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
import { RadioTower, Gauge, AlertTriangle, ArrowRight } from "lucide-react";

/* ── Risk helpers ──────────────────────────────────────────────── */
function riskColor(score) {
  if (score <= 15) return "#16A34A";
  if (score <= 35) return "#D97706";
  if (score <= 60) return "#EA580C";
  return "#DC2626";
}
function riskLabel(score) {
  if (score <= 15) return "Low";
  if (score <= 35) return "Medium";
  if (score <= 60) return "High";
  return "Critical";
}
function riskBg(score) {
  if (score <= 15) return "#F0FDF4";
  if (score <= 35) return "#FFFBEB";
  if (score <= 60) return "#FFF7ED";
  return "#FEF2F2";
}

/* ── SVG marker shapes ─────────────────────────────────────────── */
const TYPE_SHAPE = {
  tower: (color) => `
    <path d="M12 3 L18 22 L14.5 22 L12 16 L9.5 22 L6 22 Z" fill="${color}"/>
    <line x1="8.5" y1="11" x2="15.5" y2="11" stroke="white" stroke-width="1" stroke-linecap="round"/>
    <line x1="9.5" y1="15.5" x2="14.5" y2="15.5" stroke="white" stroke-width="1" stroke-linecap="round"/>
  `,
  transformer: (color) => `
    <rect x="6" y="5" width="12" height="15" rx="2" fill="${color}"/>
    <line x1="6" y1="10" x2="18" y2="10" stroke="white" stroke-width="0.8"/>
    <line x1="6" y1="14.5" x2="18" y2="14.5" stroke="white" stroke-width="0.8"/>
    <circle cx="12" cy="17.5" r="1.2" fill="white" opacity="0.8"/>
  `,
  pole: (color) => `
    <line x1="12" y1="3" x2="12" y2="22" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>
    <line x1="7" y1="8" x2="17" y2="8" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="8.5" y1="11" x2="15.5" y2="11" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/>
  `,
};

function buildDivIcon(assetType, riskScore) {
  const color = riskColor(riskScore);
  const shape = (TYPE_SHAPE[assetType] || TYPE_SHAPE.pole)(color);
  const pulseRing = riskScore > 60
    ? `<span style="position:absolute;inset:-4px;border-radius:9999px;border:2px solid ${color};opacity:0.35;animation:ping 1.5s ease-in-out infinite;"></span>`
    : "";
  const html = `
    <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
      ${pulseRing}
      <div style="
        width:32px;height:32px;
        border-radius:9999px;
        background:${riskBg(riskScore)};
        border:2px solid ${color}33;
        box-shadow:0 2px 8px ${color}40;
        display:flex;align-items:center;justify-content:center;
        position:relative;
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${shape}
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "gridvision-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

/* ── Auto-fit bounds ───────────────────────────────────────────── */
function FitBoundsOnData({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [52, 52], animate: true, maxZoom: 15 });
  }, [points, map]);
  return null;
}

/* ── Legend dot ────────────────────────────────────────────────── */
function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="text-[10px] font-mono uppercase tracking-wide text-text-muted">{label}</span>
    </div>
  );
}

/**
 * Interactive Leaflet map showing risk-colored asset markers.
 * `points` from /api/dashboard/heatmap:
 *   [{ asset_id, asset_name, asset_type, lat, lng, risk_score, health_score }]
 */
export default function MapView({ points = [], height = 400, loading = false }) {
  const navigate = useNavigate();

  const center = useMemo(
    () => (points.length > 0 ? [points[0].lat, points[0].lng] : [13.01, 79.955]),
    [points]
  );

  if (loading) {
    return (
      <div
        className="skeleton flex items-center justify-center rounded-xl border border-panel-border"
        style={{ height }}
      >
        <div className="flex items-center gap-2.5 text-sm text-text-muted">
          <RadioTower size={18} className="animate-pulse text-signal" />
          <span className="font-mono">Initializing grid map...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-panel-border shadow-card"
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
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
            <LeafletTooltip direction="top" offset={[0, -16]}>
              <div className="font-mono text-[11px] leading-tight">
                <div className="font-semibold text-slate-800">{p.asset_name}</div>
                <div className="text-slate-500">
                  Risk: {p.risk_score.toFixed(1)} ({riskLabel(p.risk_score)})
                </div>
              </div>
            </LeafletTooltip>

            <Popup>
              <div style={{ minWidth: 200, fontFamily: "Inter, sans-serif" }}>
                {/* Header */}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-display text-[14px] font-semibold text-slate-900 leading-tight">
                      {p.asset_name}
                    </div>
                    <div className="text-[11px] capitalize text-slate-500 mt-0.5">{p.asset_type}</div>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase"
                    style={{
                      background: `${riskColor(p.risk_score)}18`,
                      color: riskColor(p.risk_score),
                      border: `1px solid ${riskColor(p.risk_score)}33`,
                    }}
                  >
                    {riskLabel(p.risk_score)}
                  </span>
                </div>

                {/* Metrics */}
                <div className="space-y-1.5 mb-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Gauge size={11} /> Health Score
                    </span>
                    <span className="text-[12px] font-mono font-semibold text-slate-800">
                      {p.health_score.toFixed(1)}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-500">Risk Score</span>
                    <span className="text-[12px] font-mono font-semibold" style={{ color: riskColor(p.risk_score) }}>
                      {p.risk_score.toFixed(1)}
                    </span>
                  </div>
                  {/* Mini health bar */}
                  <div className="h-1 w-full rounded-full bg-slate-200 mt-1.5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.health_score}%`,
                        background: riskColor(p.risk_score),
                      }}
                    />
                  </div>
                </div>

                {p.risk_score > 35 && (
                  <div
                    className="mb-2.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px]"
                    style={{
                      background: `${riskColor(p.risk_score)}10`,
                      color: riskColor(p.risk_score),
                      border: `1px solid ${riskColor(p.risk_score)}22`,
                    }}
                  >
                    <AlertTriangle size={11} />
                    Requires maintenance attention
                  </div>
                )}

                <button
                  onClick={() => navigate("/assets")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#2563EB" }}
                >
                  View Asset Timeline
                  <ArrowRight size={12} />
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend overlay */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-3 rounded-xl border border-panel-border bg-panel/95 backdrop-blur-sm px-3 py-2 shadow-card">
        <LegendItem color="#16A34A" label="Low"      />
        <LegendItem color="#D97706" label="Medium"   />
        <LegendItem color="#EA580C" label="High"     />
        <LegendItem color="#DC2626" label="Critical" />
      </div>

      {/* Empty state */}
      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-void/60 backdrop-blur-sm">
          <div className="rounded-xl border border-panel-border bg-panel px-5 py-3.5 text-center shadow-card-md">
            <RadioTower size={20} className="mx-auto mb-2 text-text-muted" />
            <span className="text-sm text-text-muted">No assets to display yet.</span>
          </div>
        </div>
      )}
    </div>
  );
}
