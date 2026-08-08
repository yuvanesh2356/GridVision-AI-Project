import React, { useEffect, useState, useCallback } from "react";
import {
  Zap,
  Boxes,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Radar,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
} from "lucide-react";
import { getAssets, getAssetTimeline } from "../api/client.js";
import HealthScoreGauge   from "../components/HealthScoreGauge.jsx";
import TimelineComparison from "../components/TimelineComparison.jsx";

/* ── Asset type icon map ─────────────────────────────────────── */
const TYPE_ICON  = { tower: Zap, transformer: Boxes };
const TYPE_LABEL = { tower: "Transmission Tower", transformer: "Transformer", pole: "Distribution Pole" };

/* ── Score → style ───────────────────────────────────────────── */
function scoreStyle(score) {
  if (score >= 85) return { label: "Healthy",   cls: "bg-healthy-bg  border-healthy-border  text-healthy"  };
  if (score >= 65) return { label: "Fair",       cls: "bg-medium-bg   border-medium-border   text-medium"   };
  if (score >= 40) return { label: "At Risk",    cls: "bg-high-bg     border-high-border     text-high"     };
  return                  { label: "Critical",   cls: "bg-critical-bg border-critical-border text-critical" };
}

/* ── Trend icon ─────────────────────────────────────────────── */
function TrendIcon({ trend }) {
  if (trend === "down") return <TrendingDown size={14} className="text-critical" />;
  if (trend === "up")   return <TrendingUp   size={14} className="text-healthy"  />;
  return <Minus size={14} className="text-text-muted" />;
}

/* ── Asset Card ─────────────────────────────────────────────── */
function AssetCard({ asset, isExpanded, onToggle, timeline }) {
  const Icon  = TYPE_ICON[asset.type]  || Boxes;
  const ss    = scoreStyle(asset.health_score);
  const label = TYPE_LABEL[asset.type] || asset.type;

  /* Derive trend from timeline when available */
  const trend = (() => {
    if (!timeline || !timeline.health_score_trend || timeline.health_score_trend.length < 2) return "flat";
    const arr = timeline.health_score_trend;
    return arr[arr.length - 1] < arr[0] ? "down" : arr[arr.length - 1] > arr[0] ? "up" : "flat";
  })();

  return (
    <div
      className="card overflow-hidden transition-all duration-200 ease-spring hover:shadow-card-md animate-fadeInUp"
    >
      {/* Asset summary row */}
      <div className="flex items-start gap-4 p-4">
        {/* Health gauge */}
        <HealthScoreGauge score={asset.health_score} size={72} label={false} />

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon size={13} className="text-signal shrink-0" />
                <span className="font-display text-[14px] font-semibold text-text-primary truncate">
                  {asset.name}
                </span>
              </div>
              <div className="text-[12px] text-text-muted">{label}</div>
            </div>
            <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-mono font-semibold ${ss.cls}`}>
              {ss.label}
            </span>
          </div>

          {/* Coordinates */}
          <div className="mt-2 flex items-center gap-1 text-[11px] font-mono text-text-faint">
            <MapPin size={10} />
            {asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}
          </div>

          {/* Health score + trend */}
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-elevated overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${asset.health_score}%`,
                  background: asset.health_score >= 85 ? "#16A34A"
                    : asset.health_score >= 65 ? "#D97706"
                    : asset.health_score >= 40 ? "#EA580C"
                    : "#DC2626",
                }}
              />
            </div>
            <div className="flex items-center gap-1">
              <TrendIcon trend={trend} />
              <span className="font-mono text-[11px] text-text-muted tabular-nums">
                {asset.health_score.toFixed(0)}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expand button */}
      <button
        onClick={() => onToggle(asset.id)}
        className="group flex w-full items-center justify-center gap-1.5 border-t border-panel-border
          bg-elevated/40 py-2.5 text-[12px] font-medium text-text-muted
          transition-all duration-150 hover:bg-elevated hover:text-signal"
      >
        {isExpanded ? (
          <>Hide Timeline <ChevronUp size={13} className="transition-transform group-hover:translate-y-[-1px]" /></>
        ) : (
          <>View Timeline <ChevronDown size={13} className="transition-transform group-hover:translate-y-[1px]" /></>
        )}
      </button>

      {/* Timeline expand panel */}
      {isExpanded && (
        <div className="border-t border-panel-border p-4 animate-fadeIn">
          {timeline === undefined ? (
            /* Loading skeleton */
            <div className="space-y-3">
              <span className="skeleton block h-4 w-40 rounded" />
              <span className="skeleton block h-[160px] w-full rounded-xl" />
              <div className="space-y-2">
                {[0,1,2].map((i) => <span key={i} className="skeleton block h-3.5 w-full rounded" />)}
              </div>
            </div>
          ) : timeline === null ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <AlertTriangle size={18} className="text-text-muted" />
              <p className="text-[13px] text-text-muted">Could not load timeline for this asset.</p>
            </div>
          ) : (
            <TimelineComparison timeline={timeline} compact />
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AssetList page
══════════════════════════════════════════════════════════════ */
export default function AssetList() {
  const [assets,     setAssets]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [timelines,  setTimelines]  = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (err) {
      setLoadError(
        err?.response?.data?.detail ||
          "Could not reach the GridVision backend. Confirm the API is running and try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = useCallback(
    async (assetId) => {
      if (expandedId === assetId) {
        setExpandedId(null);
        return;
      }
      setExpandedId(assetId);
      if (!timelines[assetId]) {
        try {
          const tl = await getAssetTimeline(assetId);
          setTimelines((prev) => ({ ...prev, [assetId]: tl }));
        } catch {
          setTimelines((prev) => ({ ...prev, [assetId]: null }));
        }
      }
    },
    [expandedId, timelines]
  );

  /* ── Stats computed from assets ── */
  const totalHealthy  = assets.filter((a) => a.health_score >= 85).length;
  const totalAtRisk   = assets.filter((a) => a.health_score <  65).length;
  const avgHealth     = assets.length
    ? (assets.reduce((s, a) => s + a.health_score, 0) / assets.length).toFixed(1)
    : null;

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="skeleton block h-7 w-40 rounded" />
          <span className="skeleton block h-4 w-64 rounded" />
        </div>
        {/* Summary bar skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map((i) => (
            <div key={i} className="card p-4 space-y-2">
              <span className="skeleton block h-3 w-20 rounded" />
              <span className="skeleton block h-8 w-14 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0,1,2,3,4,5].map((i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-4">
                <span className="skeleton h-[72px] w-[72px] rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <span className="skeleton block h-4 w-28 rounded" />
                  <span className="skeleton block h-3 w-20 rounded" />
                  <span className="skeleton block h-3 w-16 rounded" />
                  <span className="skeleton block h-1.5 w-full rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (loadError) {
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-critical-bg border border-critical-border">
          <AlertTriangle size={24} className="text-critical" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Failed to Load Assets</p>
          <p className="mt-1 text-[13px] text-text-muted">{loadError}</p>
        </div>
        <button onClick={load} className="btn btn-primary btn-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal/10 border border-signal/20">
              <Radar size={17} className="text-signal" />
            </div>
            <h1 className="font-display text-2xl font-bold text-text-primary">Grid Assets</h1>
          </div>
          <p className="mt-1.5 text-sm text-text-muted">
            {assets.length} registered asset{assets.length !== 1 ? "s" : ""} across the monitored network.
          </p>
        </div>
      </div>

      {/* ── Summary KPIs ── */}
      {assets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="label-eyebrow mb-1.5">Fleet Avg Health</div>
            <div className="font-display text-2xl font-bold text-text-primary tabular-nums">
              {avgHealth ?? "—"}
              <span className="text-base font-medium text-text-muted">/100</span>
            </div>
          </div>
          <div className="card p-4">
            <div className="label-eyebrow mb-1.5">Healthy Assets</div>
            <div className="flex items-end gap-2">
              <div className="font-display text-2xl font-bold text-healthy tabular-nums">{totalHealthy}</div>
              <span className="mb-0.5 text-[11px] font-mono text-text-muted">/ {assets.length}</span>
            </div>
          </div>
          <div className="card p-4">
            <div className="label-eyebrow mb-1.5">Needs Attention</div>
            <div className="flex items-end gap-2">
              <div className={`font-display text-2xl font-bold tabular-nums ${totalAtRisk > 0 ? "text-high" : "text-healthy"}`}>
                {totalAtRisk}
              </div>
              <span className="mb-0.5 text-[11px] font-mono text-text-muted">assets</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {assets.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-elevated border border-panel-border">
            <Radar size={24} className="text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">No Assets Registered</p>
            <p className="mt-1 text-[13px] text-text-muted max-w-xs">
              Seed data should populate this automatically on first backend startup.
            </p>
          </div>
        </div>
      ) : (
        /* ── Asset grid ── */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset, idx) => (
            <div key={asset.id} style={{ animationDelay: `${idx * 30}ms` }}>
              <AssetCard
                asset={asset}
                isExpanded={expandedId === asset.id}
                onToggle={toggleExpand}
                timeline={timelines[asset.id]}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
