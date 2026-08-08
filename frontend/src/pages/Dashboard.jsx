import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Loader2,
  Boxes,
  ShieldAlert,
  ScanLine,
  Wrench,
  CheckCircle2,
  XCircle,
  ScanEye,
  Ruler,
  BrainCircuit,
  ClipboardCheck,
  LayoutDashboard,
  PartyPopper,
  TrendingUp,
  Activity,
  Bell,
  ChevronRight,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import {
  getDashboardSummary,
  getDashboardHeatmap,
  getInspections,
  getAlerts,
  uploadInspection,
  getAssets,
  updateAlertStatus,
} from "../api/client.js";
import useAppStore from "../store/useAppStore.js";
import MapView from "../components/MapView.jsx";
import FindingsTable from "../components/FindingsTable.jsx";
import RiskAnalyticsChart from "../components/RiskAnalyticsChart.jsx";
import AlertCard from "../components/AlertCard.jsx";
import HealthScoreGauge from "../components/HealthScoreGauge.jsx";

/* ── Severity → recommendation mapping ──────────────────────── */
const RECOMMENDATION_BY_SEVERITY = {
  Critical: "Immediate Shutdown",
  High:     "Repair within 24 hours",
  Medium:   "Monitor",
  Low:      "Routine Maintenance",
};
function recommendationFor(severity) {
  return RECOMMENDATION_BY_SEVERITY[severity] || "Routine Maintenance";
}

const RECOMMENDATION_STYLE = {
  "Immediate Shutdown":    { cls: "border-critical-border bg-critical-bg text-critical",  dot: "bg-critical" },
  "Repair within 24 hours":{ cls: "border-high-border bg-high-bg text-high",              dot: "bg-high"     },
  "Monitor":               { cls: "border-medium-border bg-medium-bg text-medium",        dot: "bg-medium"   },
  "Routine Maintenance":   { cls: "border-healthy-border bg-healthy-bg text-healthy",     dot: "bg-healthy"  },
};

/* ── Sample findings (shown when no real data) ──────────────── */
const SAMPLE_FINDINGS = [
  { component: "tower",     defect_type: "rust",             confidence: 0.81, severity: "Medium",   explanation: "Surface rust detected across the lower cross-arm bracket." },
  { component: "conductor", defect_type: "loose_wire",       confidence: 0.74, severity: "High",     explanation: "Conductor shows abnormal slack between spans." },
  { component: "insulator", defect_type: "broken_insulator", confidence: 0.88, severity: "Critical", explanation: "Hairline crack detected on ceramic insulator body." },
  { component: "vegetation",defect_type: "vegetation",       confidence: 0.62, severity: "Low",      explanation: "Vegetation encroaching within advisory clearance distance." },
];

/* ── Vision pipeline stages ─────────────────────────────────── */
const PIPELINE_STAGES = [
  { key: "uploading",  label: "Uploading Drone Image",          icon: UploadCloud    },
  { key: "detecting",  label: "Asset Detection",                icon: ScanEye        },
  { key: "measuring",  label: "Infrastructure Measurements",    icon: Ruler          },
  { key: "risk",       label: "Risk Assessment",                icon: ShieldAlert    },
  { key: "scoring",    label: "Grid Health Analysis",           icon: BrainCircuit   },
  { key: "recommend",  label: "Maintenance Recommendation",     icon: ClipboardCheck },
  { key: "updating",   label: "Updating Dashboard",             icon: LayoutDashboard},
  { key: "complete",   label: "Inspection Complete",            icon: PartyPopper    },
];

/* ── Count-up hook ──────────────────────────────────────────── */
function useCountUp(target, duration = 800) {
  const [value, setValue]    = useState(0);
  const startRef             = useRef(null);
  const fromRef              = useRef(0);
  useEffect(() => {
    if (target == null) return;
    const from = fromRef.current;
    startRef.current = null;
    let raf;
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const p     = Math.min(1, (ts - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ── KPI Card ───────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, decimals = 0, accentColor = "#2563EB", delay = 0, loading = false, trend }) {
  const animated = useCountUp(typeof value === "number" ? value : null);
  const display  = typeof value === "number" ? animated.toFixed(decimals) : (value ?? "—");

  if (loading) {
    return (
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="skeleton h-3 w-20 rounded" />
          <span className="skeleton h-8 w-8 rounded-lg" />
        </div>
        <span className="skeleton block h-9 w-24 rounded" />
        <span className="skeleton block h-3 w-16 rounded" />
      </div>
    );
  }

  return (
    <div
      className="card p-5 transition-all duration-200 ease-spring hover:shadow-card-hover hover:-translate-y-0.5 animate-fadeInUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="label-eyebrow">{label}</span>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}22` }}
        >
          <Icon size={16} style={{ color: accentColor }} />
        </div>
      </div>

      {/* Value */}
      <div
        className="font-display text-3xl font-bold tabular-nums leading-none"
        style={{ color: "#0F172A" }}
      >
        {display}
      </div>

      {/* Trend chip */}
      {trend && (
        <div className="mt-2.5 flex items-center gap-1">
          <TrendingUp size={11} className="text-healthy" />
          <span className="text-[11px] font-mono text-text-muted">{trend}</span>
        </div>
      )}
    </div>
  );
}

/* ── Grid Health KPI (with gauge) ───────────────────────────── */
function GridHealthKpiCard({ score, loading, delay = 0 }) {
  if (loading) {
    return (
      <div className="card p-5 flex items-center gap-4">
        <span className="skeleton h-16 w-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <span className="skeleton block h-3 w-20 rounded" />
          <span className="skeleton block h-9 w-16 rounded" />
          <span className="skeleton block h-3 w-14 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="card p-5 flex items-center gap-4 transition-all duration-200 ease-spring hover:shadow-card-hover hover:-translate-y-0.5 animate-fadeInUp"
      style={{ animationDelay: `${delay}ms` }}
    >
      <HealthScoreGauge score={score ?? 0} size={64} label={false} />
      <div>
        <span className="label-eyebrow block">Grid Health</span>
        <div className="mt-1.5 font-display text-3xl font-bold tabular-nums text-text-primary leading-none">
          {score != null ? score.toFixed(1) : "—"}
        </div>
        <div className="mt-1 text-[11px] font-mono text-text-muted">out of 100</div>
      </div>
    </div>
  );
}

/* ── Processing overlay ─────────────────────────────────────── */
function ProcessingOverlay({ stageIndex }) {
  return (
    <div className="mb-4 rounded-xl border border-signal/20 bg-signal/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/15">
          <Loader2 size={14} className="animate-spin text-signal" />
        </div>
        <span className="font-display text-sm font-semibold text-signal">
          Vision Intelligence Engine
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 mb-3">
        {PIPELINE_STAGES.map((stage, idx) => {
          const StageIcon = stage.icon;
          const isActive  = idx === stageIndex;
          const isDone    = idx < stageIndex;
          return (
            <div
              key={stage.key}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-mono
                transition-all duration-300 ${
                  isActive ? "bg-signal/15 text-signal translate-x-0.5"
                  : isDone  ? "text-healthy"
                  : "text-text-faint"
                }`}
            >
              {isDone
                ? <CheckCircle2 size={12} className="shrink-0" />
                : <StageIcon   size={12} className={`shrink-0 ${isActive ? "animate-pulse" : ""}`} />
              }
              <span className="leading-tight">{stage.label}</span>
            </div>
          );
        })}
      </div>
      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-signal/15">
        <div
          className="h-full rounded-full bg-signal transition-all duration-500 ease-out"
          style={{ width: `${((stageIndex + 1) / PIPELINE_STAGES.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ── Toast ──────────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  const Icon = toast.type === "success" ? CheckCircle2 : XCircle;
  return (
    <div
      className={`animate-toastIn mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-card-md text-sm font-medium ${
        toast.type === "success" ? "toast-success" : "toast-error"
      }`}
    >
      <Icon size={16} className="shrink-0" />
      <span>{toast.message}</span>
    </div>
  );
}

/* ── Findings skeleton ──────────────────────────────────────── */
function FindingsSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3">
          <span className="skeleton h-7 w-7 rounded-lg shrink-0" />
          <span className="skeleton h-4 w-24 rounded"  />
          <span className="skeleton h-4 flex-1 rounded ml-auto max-w-[120px]" />
          <span className="skeleton h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/* ── Live indicator ─────────────────────────────────────────── */
function LiveIndicator({ lastUpdated }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 rounded-full border border-healthy-border bg-healthy-bg px-2.5 py-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-healthy opacity-60 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-healthy" />
        </span>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wide text-healthy">Live</span>
      </span>
      {lastUpdated && (
        <span className="text-[10px] font-mono text-text-faint">
          {lastUpdated.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </div>
  );
}

/* ── Section Header ─────────────────────────────────────────── */
function SectionHeader({ icon: Icon, title, right, iconColor = "#2563EB" }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: `${iconColor}14`, border: `1px solid ${iconColor}20` }}
          >
            <Icon size={14} style={{ color: iconColor }} />
          </div>
        )}
        <h2 className="section-title">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Dashboard page
══════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardSummary, setDashboardSummary, setLastInspectionId, setSelectedAssetId } =
    useAppStore();

  const [heatmap,            setHeatmap]            = useState([]);
  const [recentInspections,  setRecentInspections]  = useState([]);
  const [alerts,             setAlerts]             = useState([]);
  const [assets,             setAssets]             = useState([]);
  const [loadingDashboard,   setLoadingDashboard]   = useState(true);
  const [lastUpdated,        setLastUpdated]        = useState(null);

  const [uploading,          setUploading]          = useState(false);
  const [stageIndex,         setStageIndex]         = useState(0);
  const [selectedAssetIdLocal, setSelectedAssetIdLocal] = useState("");
  const [dragActive,         setDragActive]         = useState(false);
  const [toast,              setToast]              = useState(null);
  const toastTimerRef = useRef(null);
  const stageTimerRef = useRef(null);

  const showToast = useCallback((type, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 5000);
  }, []);

  const loadAll = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const [summaryData, heatmapData, inspectionsData, alertsData, assetsData] =
        await Promise.all([
          getDashboardSummary(),
          getDashboardHeatmap(),
          getInspections(),
          getAlerts({ status: "new" }),
          getAssets(),
        ]);
      setDashboardSummary(summaryData);
      setHeatmap(heatmapData);
      setRecentInspections(inspectionsData.slice(0, 8));
      setAlerts(alertsData);
      setAssets(assetsData);
      setLastUpdated(new Date());
    } catch {
      showToast("error", "Could not reach the GridVision backend. Is the API running?");
    } finally {
      setLoadingDashboard(false);
    }
  }, [setDashboardSummary, showToast]);

  useEffect(() => {
    loadAll();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
    };
  }, [loadAll]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Please upload an image file (JPG or PNG).");
      return;
    }
    setUploading(true);
    setStageIndex(0);
    stageTimerRef.current = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, PIPELINE_STAGES.length - 2));
    }, 700);

    try {
      const result = await uploadInspection(file, selectedAssetIdLocal || undefined);
      clearInterval(stageTimerRef.current);
      setLastInspectionId(result.id);
      if (result.asset_id) setSelectedAssetId(result.asset_id);
      setStageIndex(PIPELINE_STAGES.length - 2);
      await loadAll();
      setStageIndex(PIPELINE_STAGES.length - 1);
      showToast(
        "success",
        `Inspection complete — Grid Health ${result.grid_health_score.toFixed(0)}/100, ${result.overall_severity} severity.`
      );
      setTimeout(() => navigate(`/inspections/${result.id}`), 700);
    } catch (err) {
      clearInterval(stageTimerRef.current);
      showToast("error", err?.response?.data?.detail || "Upload failed. Please try a different image.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  async function handleAcknowledge(alertId) {
    await updateAlertStatus(alertId, "acknowledged");
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  const hasRealData   = recentInspections.length > 0;
  const allFindings   = hasRealData
    ? recentInspections.flatMap((i) => i.findings || [])
    : SAMPLE_FINDINGS;

  const severityCounts = hasRealData
    ? recentInspections.reduce((acc, i) => {
        acc[i.overall_severity] = (acc[i.overall_severity] || 0) + 1;
        return acc;
      }, {})
    : SAMPLE_FINDINGS.reduce((acc, f) => {
        acc[f.severity] = (acc[f.severity] || 0) + 1;
        return acc;
      }, {});

  const trendData = hasRealData
    ? [...recentInspections].reverse().map((i) => ({
        label: new Date(i.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        health_score: i.grid_health_score,
      }))
    : [];

  const maintenanceQueue = [...recentInspections]
    .filter((i) => i.overall_severity !== "Low")
    .sort((a, b) => a.grid_health_score - b.grid_health_score)
    .slice(0, 5);

  const showSkeletons = loadingDashboard && !dashboardSummary;

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* ── Page header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary leading-tight">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Real-time power grid monitoring and AI-powered inspection analytics.
          </p>
        </div>
        {!showSkeletons && <LiveIndicator lastUpdated={lastUpdated} />}
      </div>

      {/* ═══ SECTION 1 — KPI Cards ═══ */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GridHealthKpiCard
          score={dashboardSummary?.grid_health_avg}
          loading={showSkeletons}
          delay={0}
        />
        <KpiCard
          icon={Boxes}
          label="Total Assets"
          value={dashboardSummary?.total_assets}
          accentColor="#16A34A"
          delay={60}
          loading={showSkeletons}
          trend="Monitored"
        />
        <KpiCard
          icon={ShieldAlert}
          label="Critical Alerts"
          value={dashboardSummary?.critical_alerts}
          accentColor="#DC2626"
          delay={120}
          loading={showSkeletons}
        />
        <KpiCard
          icon={ScanLine}
          label="Today's Inspections"
          value={dashboardSummary?.todays_inspections}
          accentColor="#D97706"
          delay={180}
          loading={showSkeletons}
        />
      </section>

      {/* ═══ SECTION 2 — Map + Upload ═══ */}
      <section className="card p-4 sm:p-5">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeader
            icon={Activity}
            title="Interactive Grid Map"
            iconColor="#2563EB"
            right={!showSkeletons && <LiveIndicator lastUpdated={lastUpdated} />}
          />
        </div>

        {/* Upload controls */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {/* Asset selector */}
          <div className="relative">
            <select
              value={selectedAssetIdLocal}
              onChange={(e) => setSelectedAssetIdLocal(e.target.value)}
              disabled={uploading}
              className="form-select pr-8 py-2 text-[13px] font-mono disabled:opacity-50"
            >
              <option value="">Auto-detect asset (GPS)</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <ChevronRight
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-text-muted"
            />
          </div>

          {/* Upload button / drop target */}
          <label
            onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={uploading ? undefined : onDrop}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2 text-[13px] font-medium transition-all duration-200 ${
              uploading
                ? "cursor-not-allowed border-panel-border text-text-muted opacity-60"
                : dragActive
                ? "border-signal bg-signal/10 text-signal shadow-glow-sm"
                : "border-signal/40 bg-signal/5 text-signal hover:bg-signal/10 hover:border-signal/60 hover:shadow-glow-sm"
            }`}
          >
            {uploading
              ? <Loader2 size={14} className="animate-spin" />
              : <UploadCloud size={14} />
            }
            {uploading ? "Analyzing..." : "Upload Drone Image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>

        {/* Pipeline processing overlay */}
        {uploading && <ProcessingOverlay stageIndex={stageIndex} />}

        {/* Map */}
        <MapView
          points={heatmap}
          height={400}
          loading={loadingDashboard && heatmap.length === 0}
        />
      </section>

      {/* ═══ SECTION 3 — AI Findings ═══ */}
      <section className="card p-4 sm:p-5">
        <SectionHeader
          icon={ScanEye}
          title="AI Findings — Recent Detections"
          iconColor="#7C3AED"
          right={
            !showSkeletons && !hasRealData && (
              <span className="rounded-full border border-medium-border bg-medium-bg px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-wide text-medium">
                Sample Data
              </span>
            )
          }
        />
        {showSkeletons ? <FindingsSkeleton /> : <FindingsTable findings={allFindings.slice(0, 10)} />}
      </section>

      {/* ═══ SECTION 4 — Risk Analytics ═══ */}
      <section className="card p-4 sm:p-5">
        <SectionHeader
          icon={TrendingUp}
          title="Risk Analytics"
          iconColor="#EA580C"
        />
        <RiskAnalyticsChart
          trendData={trendData}
          severityCounts={severityCounts}
          loading={showSkeletons}
        />
      </section>

      {/* ═══ SECTION 5 — Maintenance Queue + Active Alerts ═══ */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Maintenance Queue (2/3 width) */}
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <SectionHeader
            icon={Wrench}
            title="Maintenance Queue & AI Recommendations"
            iconColor="#D97706"
          />
          {maintenanceQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-healthy-bg border border-healthy-border">
                <CheckCircle2 size={20} className="text-healthy" />
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">All Clear</p>
                <p className="text-[12px] text-text-muted mt-0.5">No assets currently require maintenance action.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {maintenanceQueue.map((insp, idx) => {
                const recommendation = recommendationFor(insp.overall_severity);
                const rs = RECOMMENDATION_STYLE[recommendation] || RECOMMENDATION_STYLE["Routine Maintenance"];
                return (
                  <button
                    key={insp.id}
                    onClick={() => navigate(`/inspections/${insp.id}`)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-panel-border bg-elevated/40 px-4 py-3
                      text-left transition-all duration-200 hover:border-signal/30 hover:bg-elevated hover:shadow-card animate-fadeInUp"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    {/* Health score mini display */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-panel border border-panel-border shadow-card">
                      <span className="font-mono text-sm font-bold text-text-primary tabular-nums">
                        {insp.grid_health_score.toFixed(0)}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[13px] font-semibold text-text-primary">
                          Inspection #{insp.id}
                        </span>
                        <span className="text-text-faint">·</span>
                        <span className="text-[12px] font-mono text-text-muted">
                          Health {insp.grid_health_score.toFixed(0)}/100
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-text-faint">
                        {new Date(insp.created_at).toLocaleString(undefined, {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {/* Recommendation badge */}
                    <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-mono font-semibold ${rs.cls}`}>
                      {recommendation}
                    </span>

                    {/* Arrow */}
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-text-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Alerts (1/3 width) */}
        <div className="card p-4 sm:p-5">
          <SectionHeader
            icon={Bell}
            title="Active Alerts"
            iconColor="#DC2626"
            right={
              alerts.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-critical-bg border border-critical-border px-1.5 text-[10px] font-mono font-semibold text-critical">
                  {alerts.length}
                </span>
              )
            }
          />
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-healthy-bg border border-healthy-border">
                  <Zap size={20} className="text-healthy" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Grid Nominal</p>
                  <p className="text-[12px] text-text-muted mt-0.5">No active alerts.</p>
                </div>
              </div>
            ) : (
              alerts.slice(0, 5).map((a) => (
                <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
