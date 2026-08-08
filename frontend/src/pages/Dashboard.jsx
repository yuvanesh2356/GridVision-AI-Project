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

// Single source of truth for severity -> maintenance recommendation, used
// by both the Maintenance Queue and (identically, in InspectionDetail.jsx)
// the AI Recommendation panel. Kept as a small local function per file
// rather than a new shared module, per the locked file set.
const RECOMMENDATION_BY_SEVERITY = {
  Critical: "Immediate Shutdown",
  High: "Repair within 24 hours",
  Medium: "Monitor",
  Low: "Routine Maintenance",
};
function recommendationFor(severity) {
  return RECOMMENDATION_BY_SEVERITY[severity] || "Routine Maintenance";
}

const RECOMMENDATION_STYLE = {
  "Immediate Shutdown": "border-critical/40 bg-critical/10 text-critical",
  "Repair within 24 hours": "border-high/40 bg-high/10 text-high",
  Monitor: "border-medium/40 bg-medium/10 text-medium",
  "Routine Maintenance": "border-healthy/40 bg-healthy/10 text-healthy",
};

// Realistic sample detections shown only when the grid has no real
// inspections yet, so the AI Findings panel never looks broken/empty on a
// fresh install. Clearly a placeholder set, not passed off as live data.
const SAMPLE_FINDINGS = [
  {
    component: "tower",
    defect_type: "rust",
    confidence: 0.81,
    severity: "Medium",
    explanation: "Surface rust detected across the lower cross-arm bracket. Recommend cleaning and re-coating within the next maintenance cycle.",
  },
  {
    component: "conductor",
    defect_type: "loose_wire",
    confidence: 0.74,
    severity: "High",
    explanation: "Conductor shows abnormal slack between spans. Elevated sag increases contact risk during high winds.",
  },
  {
    component: "insulator",
    defect_type: "broken_insulator",
    confidence: 0.88,
    severity: "Critical",
    explanation: "Hairline crack detected on ceramic insulator body. Risk of flashover under load; prioritize inspection.",
  },
  {
    component: "vegetation",
    defect_type: "vegetation",
    confidence: 0.62,
    severity: "Low",
    explanation: "Vegetation encroaching within advisory clearance distance. Schedule routine trimming.",
  },
];

// Pipeline stages mirrored 1:1 to the locked Vision Intelligence Engine
// module boundary (detector.py -> geometry.py -> intelligence.py) plus the
// surrounding workflow steps, cycled visually while the single backend call
// is in flight so the demo tells an honest, accurate story about what's
// actually happening server-side.
const PIPELINE_STAGES = [
  { key: "uploading", label: "Uploading Drone Image...", icon: UploadCloud },
  { key: "detecting", label: "Asset Detection", icon: ScanEye },
  { key: "measuring", label: "Infrastructure Measurements", icon: Ruler },
  { key: "risk", label: "Risk Assessment", icon: ShieldAlert },
  { key: "scoring", label: "Grid Health Analysis", icon: BrainCircuit },
  { key: "recommend", label: "Maintenance Recommendation", icon: ClipboardCheck },
  { key: "updating", label: "Updating Dashboard", icon: LayoutDashboard },
  { key: "complete", label: "Inspection Complete", icon: PartyPopper },
];

/** Small count-up hook, local to this file — no new module introduced. */
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  useEffect(() => {
    if (target === null || target === undefined) return;
    startRef.current = null;
    let raf;
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / duration);
      setValue(target * progress);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function KpiCard({ icon: Icon, label, value, decimals = 0, accent = "text-signal", delay = 0, loading = false }) {
  const animated = useCountUp(typeof value === "number" ? value : null);
  const display = typeof value === "number" ? animated.toFixed(decimals) : value ?? "—";

  if (loading) {
    return (
      <div className="hud-panel relative p-4">
        <span className="hud-corner-tl" />
        <span className="hud-corner-br" />
        <div className="flex items-center justify-between">
          <span className="skeleton h-3 w-16" />
          <span className="skeleton h-4 w-4 rounded-full" />
        </div>
        <div className="skeleton mt-3 h-8 w-20" />
      </div>
    );
  }

  return (
    <div
      className="hud-panel relative animate-fadeInUp p-4 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="hud-corner-tl" />
      <span className="hud-corner-br" />
      <div className="flex items-center justify-between">
        <span className="label-eyebrow">{label}</span>
        <Icon size={16} className={accent} />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums text-text-primary">
        {display}
      </div>
    </div>
  );
}

/** Grid Health KPI as a compact live gauge instead of a bare number - the
 * single most important figure on the page gets the most visual weight. */
function GridHealthKpiCard({ score, loading, delay = 0 }) {
  if (loading) {
    return (
      <div className="hud-panel relative flex items-center gap-3 p-4">
        <span className="hud-corner-tl" />
        <span className="hud-corner-br" />
        <span className="skeleton h-14 w-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <span className="skeleton block h-3 w-16" />
          <span className="skeleton block h-3 w-20" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="hud-panel relative flex animate-fadeInUp items-center gap-3 p-4 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="hud-corner-tl" />
      <span className="hud-corner-br" />
      <HealthScoreGauge score={score ?? 0} size={56} label={false} />
      <div>
        <span className="label-eyebrow block">Grid Health</span>
        <div className="mt-1 font-display text-2xl font-semibold tabular-nums text-text-primary">
          {score !== null && score !== undefined ? score.toFixed(1) : "—"}
        </div>
      </div>
    </div>
  );
}

function ProcessingOverlay({ stageIndex }) {
  return (
    <div className="mb-3 rounded-md border border-signal/30 bg-elevated/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-signal" />
        <span className="font-display text-sm font-semibold text-signal">
          Vision Intelligence Engine
        </span>
      </div>
      <div className="space-y-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const StageIcon = stage.icon;
          const isActive = idx === stageIndex;
          const isDone = idx < stageIndex;
          return (
            <div
              key={stage.key}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-all duration-300 ${
                isActive
                  ? "translate-x-1 bg-signal/10 text-signal"
                  : isDone
                  ? "text-healthy"
                  : "text-text-muted"
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={13} />
              ) : (
                <StageIcon size={13} className={isActive ? "animate-pulse" : ""} />
              )}
              <span className="font-mono">{stage.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-signal transition-all duration-500 ease-out"
          style={{
            width: `${((stageIndex + 1) / PIPELINE_STAGES.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const Icon = toast.type === "success" ? CheckCircle2 : XCircle;
  return (
    <div
      className={`animate-toastIn mb-3 flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm ${
        toast.type === "success" ? "toast-success" : "toast-error"
      }`}
    >
      <Icon size={16} className="shrink-0" />
      <span>{toast.message}</span>
    </div>
  );
}

function FindingsSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="skeleton h-6 w-6 shrink-0 rounded-md" />
          <span className="skeleton h-4 flex-1" />
          <span className="skeleton h-4 w-16" />
          <span className="skeleton h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Small pulsing "LIVE" chip + last-updated timestamp, reinforcing that the
 * control room reflects real-time backend state rather than a static mock. */
function LiveIndicator({ lastUpdated }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 rounded-full border border-healthy/30 bg-healthy/10 px-2 py-0.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-healthy opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-healthy" />
        </span>
        <span className="text-[10px] font-mono font-semibold uppercase tracking-wide text-healthy">
          Live
        </span>
      </span>
      {lastUpdated && (
        <span className="text-[10px] font-mono text-text-muted">
          Updated {lastUpdated.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardSummary, setDashboardSummary, setLastInspectionId, setSelectedAssetId } =
    useAppStore();

  const [heatmap, setHeatmap] = useState([]);
  const [recentInspections, setRecentInspections] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [selectedAssetIdLocal, setSelectedAssetIdLocal] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState(null);
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
    } catch (err) {
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

    // Cycle through pipeline stage labels while the single backend call is
    // in flight. This visually mirrors the real detector -> geometry ->
    // intelligence sequence without claiming granular server progress we
    // don't actually stream. Stops one step short of "complete" until the
    // response actually returns.
    stageTimerRef.current = setInterval(() => {
      setStageIndex((prev) => Math.min(prev + 1, PIPELINE_STAGES.length - 2));
    }, 700);

    try {
      const result = await uploadInspection(file, selectedAssetIdLocal || undefined);
      clearInterval(stageTimerRef.current);

      setLastInspectionId(result.id);
      if (result.asset_id) setSelectedAssetId(result.asset_id);

      // Auto-refresh everything derived from server state: KPIs, map,
      // recent findings, charts, and (via navigation below) Timeline
      // Comparison on the destination inspection's asset.
      setStageIndex(PIPELINE_STAGES.length - 2); // "Updating Dashboard"
      await loadAll();
      setStageIndex(PIPELINE_STAGES.length - 1); // "Inspection Complete"

      showToast(
        "success",
        `Inspection complete — Grid Health ${result.grid_health_score.toFixed(0)}/100, ${
          result.overall_severity
        } severity.`
      );

      setTimeout(() => navigate(`/inspections/${result.id}`), 700);
    } catch (err) {
      clearInterval(stageTimerRef.current);
      showToast(
        "error",
        err?.response?.data?.detail || "Upload failed. Please try a different image."
      );
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  async function handleAcknowledge(alertId) {
    await updateAlertStatus(alertId, "acknowledged");
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }

  const hasRealData = recentInspections.length > 0;
  const allFindings = hasRealData
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
    ? [...recentInspections]
        .reverse()
        .map((i) => ({
          label: new Date(i.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
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

      {/* SECTION 1 — Executive KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <GridHealthKpiCard
          score={dashboardSummary ? dashboardSummary.grid_health_avg : null}
          loading={showSkeletons}
          delay={0}
        />
        <KpiCard
          icon={Boxes}
          label="Assets"
          value={dashboardSummary ? dashboardSummary.total_assets : null}
          accent="text-healthy"
          delay={60}
          loading={showSkeletons}
        />
        <KpiCard
          icon={ShieldAlert}
          label="Critical Alerts"
          value={dashboardSummary ? dashboardSummary.critical_alerts : null}
          accent="text-critical"
          delay={120}
          loading={showSkeletons}
        />
        <KpiCard
          icon={ScanLine}
          label="Today's Inspections"
          value={dashboardSummary ? dashboardSummary.todays_inspections : null}
          accent="text-medium"
          delay={180}
          loading={showSkeletons}
        />
      </section>

      {/* SECTION 2 — Interactive Grid Map + integrated upload */}
      <section className="hud-panel relative p-3 sm:p-4">
        <span className="hud-corner-tl" />
        <span className="hud-corner-tr" />
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="label-eyebrow">Interactive Grid Map</span>
            {!showSkeletons && <LiveIndicator lastUpdated={lastUpdated} />}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <select
              value={selectedAssetIdLocal}
              onChange={(e) => setSelectedAssetIdLocal(e.target.value)}
              disabled={uploading}
              className="rounded-md border border-line bg-elevated px-2.5 py-1.5 text-xs font-mono text-text-primary focus:border-signal/50 disabled:opacity-50"
            >
              <option value="">Auto-detect asset (GPS)</option>
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <label
              onDragOver={(e) => {
                e.preventDefault();
                if (!uploading) setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={uploading ? undefined : onDrop}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                uploading
                  ? "cursor-not-allowed border-line text-text-muted opacity-60"
                  : dragActive
                  ? "border-signal bg-signal/10 text-signal shadow-glow"
                  : "border-line text-text-muted hover:border-signal/40 hover:text-signal"
              }`}
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <UploadCloud size={14} />
              )}
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
        </div>

        {uploading && <ProcessingOverlay stageIndex={stageIndex} />}

        <MapView points={heatmap} loading={loadingDashboard && heatmap.length === 0} />
      </section>

      {/* SECTION 3 — AI Findings */}
      <section className="hud-panel relative p-3 sm:p-4">
        <span className="hud-corner-tl" />
        <span className="hud-corner-br" />
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="label-eyebrow">AI Findings — Recent Detections</span>
          {!showSkeletons && !hasRealData && (
            <span className="rounded-full border border-medium/30 bg-medium/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide text-medium">
              Sample Data
            </span>
          )}
        </div>
        {showSkeletons ? <FindingsSkeleton /> : <FindingsTable findings={allFindings.slice(0, 10)} />}
      </section>

      {/* SECTION 4 — Risk Analytics */}
      <section className="hud-panel relative p-3 sm:p-4">
        <span className="hud-corner-tl" />
        <span className="hud-corner-tr" />
        <div className="mb-4 label-eyebrow">Risk Analytics</div>
        <RiskAnalyticsChart
          trendData={trendData}
          severityCounts={severityCounts}
          loading={showSkeletons}
        />
      </section>

      {/* SECTION 5 — Maintenance Queue + AI Recommendations + Alert feed */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="hud-panel relative p-3 sm:p-4 lg:col-span-2">
          <span className="hud-corner-tl" />
          <span className="hud-corner-br" />
          <div className="mb-3 flex items-center gap-2 label-eyebrow">
            <Wrench size={13} /> Maintenance Queue &amp; AI Recommendations
          </div>
          {maintenanceQueue.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">
              No assets currently require maintenance action.
            </p>
          ) : (
            <div className="space-y-2">
              {maintenanceQueue.map((insp) => {
                const recommendation = recommendationFor(insp.overall_severity);
                return (
                  <button
                    key={insp.id}
                    onClick={() => navigate(`/inspections/${insp.id}`)}
                    className="flex w-full flex-col gap-2 rounded-md border border-line bg-elevated/40 px-3 py-2.5 text-left transition-colors hover:border-signal/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-text-primary">
                        Inspection #{insp.id} &middot; Health {insp.grid_health_score.toFixed(0)}
                      </div>
                      <div className="text-xs font-mono text-text-muted">
                        {new Date(insp.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`w-fit shrink-0 rounded-md border px-2.5 py-1 text-xs font-mono ${
                        RECOMMENDATION_STYLE[recommendation]
                      }`}
                    >
                      {recommendation}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="hud-panel relative p-3 sm:p-4">
          <span className="hud-corner-tl" />
          <span className="hud-corner-br" />
          <div className="mb-3 label-eyebrow">Active Alerts</div>
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                No active alerts. Grid nominal.
              </p>
            ) : (
              alerts
                .slice(0, 5)
                .map((a) => (
                  <AlertCard key={a.id} alert={a} onAcknowledge={handleAcknowledge} />
                ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
