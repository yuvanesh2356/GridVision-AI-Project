import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  TicketPlus,
  MapPin,
  Loader2,
  AlertTriangle,
  Info,
  AlertOctagon,
  Flame,
  ShieldCheck,
  Wrench,
  PhoneCall,
  Eye,
  CheckCircle2,
  Activity,
  Clock,
  TrendingDown,
  Image,
} from "lucide-react";
import {
  getInspection,
  getAssetTimeline,
  reportDownloadUrl,
  createMaintenanceTicket,
} from "../api/client.js";
import HealthScoreGauge  from "../components/HealthScoreGauge.jsx";
import FindingsTable     from "../components/FindingsTable.jsx";
import TimelineComparison from "../components/TimelineComparison.jsx";
import AlertCard         from "../components/AlertCard.jsx";

/* ── Severity maps ──────────────────────────────────────────── */
const SEVERITY_CLASS = {
  Low:      "severity-low",
  Medium:   "severity-medium",
  High:     "severity-high",
  Critical: "severity-critical",
};
const SEVERITY_ICON = {
  Low:      Info,
  Medium:   AlertTriangle,
  High:     AlertOctagon,
  Critical: Flame,
};

/* ── Recommendation config ──────────────────────────────────── */
const RECOMMENDATION_BY_SEVERITY = {
  Critical: {
    action: "Immediate Shutdown",
    icon: PhoneCall,
    bgClass:   "bg-critical-bg",
    borderCls: "border-critical-border",
    textCls:   "text-critical",
    barColor:  "#DC2626",
    reasoning: "One or more findings indicate an imminent structural or electrical failure risk. De-energize and dispatch a field crew before continuing normal operation.",
  },
  High: {
    action: "Repair within 24 hours",
    icon: Wrench,
    bgClass:   "bg-high-bg",
    borderCls: "border-high-border",
    textCls:   "text-high",
    barColor:  "#EA580C",
    reasoning: "Defects detected are unlikely to cause immediate failure but meaningfully raise risk if left unaddressed. Schedule a repair crew within the next operating day.",
  },
  Medium: {
    action: "Monitor",
    icon: Eye,
    bgClass:   "bg-medium-bg",
    borderCls: "border-medium-border",
    textCls:   "text-medium",
    barColor:  "#D97706",
    reasoning: "Findings are within tolerable limits today but trending toward a maintenance threshold. Add this asset to the next routine inspection cycle.",
  },
  Low: {
    action: "Routine Maintenance",
    icon: ShieldCheck,
    bgClass:   "bg-healthy-bg",
    borderCls: "border-healthy-border",
    textCls:   "text-healthy",
    barColor:  "#16A34A",
    reasoning: "No significant defects detected. Continue standard inspection cadence — no accelerated action required.",
  },
};
function recommendationFor(severity) {
  return RECOMMENDATION_BY_SEVERITY[severity] || RECOMMENDATION_BY_SEVERITY.Low;
}

/* ── AI Recommendation Panel ────────────────────────────────── */
function AiRecommendationPanel({ inspection }) {
  const rec          = recommendationFor(inspection.overall_severity);
  const RecIcon      = rec.icon;
  const findings     = inspection.findings || [];
  const findingCount = findings.length;
  const avgConf      = findingCount
    ? Math.round((findings.reduce((s, f) => s + (f.confidence || 0), 0) / findingCount) * 100)
    : null;

  return (
    <div className={`relative overflow-hidden rounded-xl border ${rec.borderCls} ${rec.bgClass} p-5`}>
      {/* Accent bar on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: rec.barColor }}
      />
      <div className="pl-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: icon + action + reasoning */}
        <div className="flex items-start gap-3.5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${rec.borderCls} bg-white shadow-sm`}>
            <RecIcon size={20} className={rec.textCls} />
          </div>
          <div>
            <div className="label-eyebrow mb-1 text-text-muted">AI Recommendation</div>
            <div className={`font-display text-xl font-bold ${rec.textCls} leading-tight`}>
              {rec.action}
            </div>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-text-secondary">
              {rec.reasoning}
            </p>
          </div>
        </div>

        {/* Right: stat chips */}
        <div className="flex shrink-0 gap-4 sm:flex-col sm:items-end sm:text-right">
          <div className={`rounded-lg border ${rec.borderCls} bg-white px-3 py-2 text-center shadow-card`}>
            <div className="font-mono text-xl font-bold text-text-primary tabular-nums">{findingCount}</div>
            <div className="text-[10px] uppercase tracking-wide text-text-muted">Findings</div>
          </div>
          {avgConf !== null && (
            <div className={`rounded-lg border ${rec.borderCls} bg-white px-3 py-2 text-center shadow-card`}>
              <div className="font-mono text-xl font-bold text-text-primary tabular-nums">{avgConf}%</div>
              <div className="text-[10px] uppercase tracking-wide text-text-muted">Avg. Conf.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Measurement stat chip ──────────────────────────────────── */
function MeasurementStat({ label, value, unit = "" }) {
  return (
    <div className="flex-1 text-center rounded-xl border border-panel-border bg-elevated/60 p-3">
      <div className="font-mono text-lg font-bold text-text-primary tabular-nums">
        {value != null ? `${value}${unit}` : "—"}
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   InspectionDetail page
══════════════════════════════════════════════════════════════ */
export default function InspectionDetail() {
  const { id }           = useParams();
  const [inspection,     setInspection]     = useState(null);
  const [timeline,       setTimeline]       = useState(null);
  const [timelineLoading,setTimelineLoading]= useState(false);
  const [loading,        setLoading]        = useState(true);
  const [loadError,      setLoadError]      = useState(null);
  const [ticketStatus,   setTicketStatus]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setTimeline(null);
    try {
      const insp = await getInspection(id);
      setInspection(insp);
      setLoading(false);
      if (insp.asset_id) {
        setTimelineLoading(true);
        try {
          const tl = await getAssetTimeline(insp.asset_id);
          setTimeline(tl);
        } catch {
          setTimeline(null);
        } finally {
          setTimelineLoading(false);
        }
      }
    } catch (err) {
      setLoadError(
        err?.response?.status === 404
          ? "This inspection could not be found. It may have been removed."
          : "Could not load this inspection. Confirm the API is running and try again."
      );
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleCreateTicket() {
    setTicketStatus("creating");
    try {
      await createMaintenanceTicket(inspection.id);
      setTicketStatus("created");
    } catch {
      setTicketStatus("error");
    }
  }

  /* ── Error state ── */
  if (loadError) {
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-critical-bg border border-critical-border">
          <AlertTriangle size={24} className="text-critical" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">Failed to Load Inspection</p>
          <p className="mt-1 text-[13px] text-text-muted">{loadError}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn btn-primary btn-sm">Retry</button>
          <Link to="/" className="btn btn-secondary btn-sm">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  /* ── Loading state ── */
  if (loading || !inspection) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-text-muted">
        <Loader2 size={24} className="animate-spin text-signal" />
        <span className="text-sm font-mono">Loading inspection data...</span>
      </div>
    );
  }

  const annotatedSrc = inspection.annotated_image_path
    ? "/storage/annotated/" + inspection.annotated_image_path.split(/[/\\]/).pop()
    : null;

  const SeverityIcon = SEVERITY_ICON[inspection.overall_severity] || Info;

  return (
    <div className="space-y-6">

      {/* ── Top nav bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-signal font-medium"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </Link>
        <div className="flex flex-wrap gap-2">
          <a
            href={reportDownloadUrl(inspection.id)}
            className="btn btn-secondary btn-sm"
          >
            <Download size={13} /> Download Report
          </a>
          <button
            onClick={handleCreateTicket}
            disabled={ticketStatus === "creating" || ticketStatus === "created"}
            className="btn btn-primary btn-sm disabled:opacity-60"
          >
            {ticketStatus === "created"  ? <><CheckCircle2 size={13} /> Ticket Created</>
            : ticketStatus === "creating"? <><Loader2 size={13} className="animate-spin" /> Creating...</>
            : <><TicketPlus size={13} /> Create Maintenance Ticket</>}
          </button>
        </div>
      </div>

      {/* ── Page title ── */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Inspection #{inspection.id}
          </h1>
          <span className={`severity-badge ${SEVERITY_CLASS[inspection.overall_severity] || "severity-low"}`}>
            <SeverityIcon size={11} />
            {inspection.overall_severity}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-[12px] font-mono text-text-muted">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {new Date(inspection.created_at).toLocaleString()}
          </span>
          {inspection.lat != null && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {inspection.lat.toFixed(4)}, {inspection.lng.toFixed(4)}
            </span>
          )}
        </div>
      </div>

      {/* ── AI Recommendation ── */}
      <AiRecommendationPanel inspection={inspection} />

      {/* ── Image + Health Score ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Annotated image (2/3) */}
        <div className="card overflow-hidden lg:col-span-2">
          {annotatedSrc ? (
            <img
              src={annotatedSrc}
              alt={`Inspection #${inspection.id} annotated`}
              className="max-h-[440px] w-full object-contain bg-elevated"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
            />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-3 bg-elevated text-text-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-panel border border-panel-border">
                <Image size={20} className="text-text-muted" />
              </div>
              <span className="text-sm">Annotated image unavailable.</span>
            </div>
          )}

          {/* Image caption bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-panel-border bg-elevated/40 px-4 py-3">
            <div>
              <div className="label-eyebrow">AI Vision Analysis</div>
              <div className="mt-0.5 text-[12px] font-mono text-text-muted">
                {(inspection.findings || []).length} defect(s) detected
              </div>
            </div>
            <span className={`severity-badge ${SEVERITY_CLASS[inspection.overall_severity] || "severity-low"}`}>
              <SeverityIcon size={11} />
              {inspection.overall_severity}
            </span>
          </div>
        </div>

        {/* Health score + measurements (1/3) */}
        <div className="card flex flex-col items-center gap-5 p-6">
          <div className="self-start label-eyebrow">Grid Health Score</div>
          <HealthScoreGauge score={inspection.grid_health_score} size={160} />

          {/* Measurement stats */}
          <div className="flex w-full gap-2 border-t border-panel-border pt-4">
            <MeasurementStat
              label="Tilt"
              value={inspection.tilt_angle != null ? inspection.tilt_angle.toFixed(1) : null}
              unit="°"
            />
            <MeasurementStat
              label="Sag Ratio"
              value={inspection.sag_ratio != null ? inspection.sag_ratio.toFixed(3) : null}
            />
            <MeasurementStat
              label="Vegetation"
              value={inspection.vegetation_clearance_m != null ? inspection.vegetation_clearance_m.toFixed(1) : null}
              unit="m"
            />
          </div>
        </div>
      </div>

      {/* ── Alert (if any) ── */}
      {inspection.alert && (
        <div className="max-w-2xl">
          <AlertCard alert={inspection.alert} />
        </div>
      )}

      {/* ── Findings & Explainability ── */}
      <div className="card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/10 border border-signal/20">
            <Activity size={14} className="text-signal" />
          </div>
          <h2 className="section-title">Findings & Explainable AI</h2>
        </div>
        <FindingsTable findings={inspection.findings || []} />
      </div>

      {/* ── Timeline Comparison ── */}
      {timelineLoading ? (
        <div className="card p-5 space-y-4">
          <span className="skeleton block h-4 w-48 rounded" />
          <span className="skeleton block h-[200px] w-full rounded-xl" />
          <div className="space-y-2">
            {[0,1,2].map((i) => <span key={i} className="skeleton block h-4 w-full rounded" />)}
          </div>
        </div>
      ) : (
        timeline && (
          <div className="card p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/10 border border-signal/20">
                <TrendingDown size={14} className="text-signal" />
              </div>
              <h2 className="section-title">{timeline.asset_name} — Predictive Maintenance</h2>
            </div>
            <TimelineComparison timeline={timeline} />
          </div>
        )
      )}
    </div>
  );
}
