import React, { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip as LeafletTooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { RadioTower, Gauge, AlertTriangle } from "lucide-react";

function riskColor(riskScore) {
  if (riskScore <= 15) return "#16A34A";
  if (riskScore <= 35) return "#D97706";
  if (riskScore <= 60) return "#EA580C";
  return "#DC2626";
}

function riskLabel(riskScore) {
  if (riskScore <= 15) return "Low";
  if (riskScore <= 35) return "Medium";
  if (riskScore <= 60) return "High";
  return "Critical";
}

// Distinct silhouette per asset type so towers, transformers, and poles read
// differently on the map at a glance, independent of their risk color.
const TYPE_SHAPE = {
  tower: (color) => `
    <path d="M12 2 L18 22 L14 22 L12 15 L10 22 L6 22 Z" fill="${color}" stroke="#0A0F1A" stroke-width="0.8"/>
    <line x1="8" y1="10" x2="16" y2="10" stroke="#0A0F1A" stroke-width="0.8"/>
    <line x1="9" y1="15" x2="15" y2="15" stroke="#0A0F1A" stroke-width="0.8"/>
  `,
  transformer: (color) => `
    <rect x="6" y="6" width="12" height="14" rx="1.5" fill="${color}" stroke="#0A0F1A" stroke-width="0.8"/>
    <line x1="6" y1="10.5" x2="18" y2="10.5" stroke="#0A0F1A" stroke-width="0.7"/>
    <line x1="6" y1="15" x2="18" y2="15" stroke="#0A0F1A" stroke-width="0.7"/>
  `,
  pole: (color) => `
    <line x1="12" y1="3" x2="12" y2="21" stroke="${color}" stroke-width="3"/>
    <line x1="7" y1="7" x2="17" y2="7" stroke="${color}" stroke-width="2.4"/>
  `,
};

function buildDivIcon(assetType, riskScore) {
  const color = riskColor(riskScore);
  const shape = (TYPE_SHAPE[assetType] || TYPE_SHAPE.pole)(color);
  const html = `
    <div style="position:relative;width:30px;height:30px;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.18;transform:scale(1.8);"></span>
      <svg width="30" height="30" viewBox="0 0 24 24" style="position:relative;filter:drop-shadow(0 0 4px rgba(0,0,0,0.5));">
        ${shape}
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "gridvision-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -14],
  });
}

/** Recenters/zooms the map to fit every marker whenever the point set
 * changes, so assets are never accidentally left off-screen by a fixed
 * center/zoom. Renders nothing - it's a map-control side effect only. */
function FitBoundsOnData({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48], animate: true, maxZoom: 15 });
  }, [points, map]);

  return null;
}

/**
 * Interactive Leaflet map showing risk-colored, type-differentiated asset
 * markers with rich popups. `points` expects the /api/dashboard/heatmap
 * shape: [{ asset_id, asset_name, asset_type, lat, lng, risk_score, health_score }]
 */
export default function MapView({ points = [], height = 380, loading = false }) {
  const navigate = useNavigate();

  const center = useMemo(
    () => (points.length > 0 ? [points[0].lat, points[0].lng] : [13.01, 79.955]),
    [points]
  );

  if (loading) {
    return (
      <div
        className="skeleton flex items-center justify-center rounded-md border border-line"
        style={{ height }}
      >
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <RadioTower size={16} className="animate-pulse" />
          Loading grid map...
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md border border-line" style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#FFFFFF" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FitBoundsOnData points={points} />
        {points.map((p) => (
          <Marker
            key={p.asset_id}
            position={[p.lat, p.lng]}
            icon={buildDivIcon(p.asset_type, p.risk_score)}
          >
            <LeafletTooltip direction="top" offset={[0, -14]}>
              <div className="font-mono text-xs leading-tight">
                <div className="font-semibold">{p.asset_name}</div>
                <div>Risk: {p.risk_score.toFixed(1)} ({riskLabel(p.risk_score)})</div>
              </div>
            </LeafletTooltip>

            <Popup>
              <div style={{ minWidth: 180 }} className="font-body">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="font-display text-sm font-semibold text-slate-900">
                    {p.asset_name}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase"
                    style={{
                      background: `${riskColor(p.risk_score)}22`,
                      color: riskColor(p.risk_score),
                    }}
                  >
                    {riskLabel(p.risk_score)}
                  </span>
                </div>
                <div className="mb-2 text-[11px] capitalize text-slate-500">{p.asset_type}</div>

                <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-700">
                  <Gauge size={12} />
                  Grid Health: <span className="font-mono font-semibold">{p.health_score.toFixed(1)}/100</span>
                </div>

                {p.risk_score > 35 && (
                  <div className="mb-2 flex items-center gap-1.5 text-xs" style={{ color: riskColor(p.risk_score) }}>
                    <AlertTriangle size={12} />
                    Requires maintenance attention
                  </div>
                )}

                <button
                  onClick={() => navigate("/assets")}
                  className="mt-1 w-full rounded-md px-2 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: "#2563EB" }}
                >
                  View Asset Timeline
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-3 rounded-md border border-line bg-panel px-3 py-1.5 shadow-panel">
        <LegendDot color="#16A34A" label="Low" />
        <LegendDot color="#D97706" label="Medium" />
        <LegendDot color="#EA580C" label="High" />
        <LegendDot color="#DC2626" label="Critical" />
      </div>

      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-void/60">
          <span className="rounded-md border border-line bg-panel px-3 py-1.5 text-xs text-text-muted">
            No assets to display yet.
          </span>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-[10px] font-mono uppercase text-text-muted">{label}</span>
    </div>
  );
}
