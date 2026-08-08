import React from "react";
import { Bell, Check, ExternalLink, Info, AlertTriangle, AlertOctagon, Flame } from "lucide-react";
import { Link } from "react-router-dom";

const SEVERITY_CLASS = {
  Low: "severity-low",
  Medium: "severity-medium",
  High: "severity-high",
  Critical: "severity-critical",
};

const SEVERITY_BAR = {
  Low: "bg-healthy",
  Medium: "bg-medium",
  High: "bg-high",
  Critical: "bg-critical",
};

// Same escalating icon set used in FindingsTable/InspectionDetail, so
// severity reads identically wherever it appears in the app.
const SEVERITY_ICON = {
  Low: Info,
  Medium: AlertTriangle,
  High: AlertOctagon,
  Critical: Flame,
};

/**
 * Single alert row. `alert` expects: { id, inspection_id, severity, message,
 * status, created_at }. `onAcknowledge(id)` is optional — omit to render
 * read-only.
 */
export default function AlertCard({ alert, onAcknowledge }) {
  const isNew = alert.status === "new";
  const SeverityIcon = SEVERITY_ICON[alert.severity] || Info;

  return (
    <div className="hud-panel flex items-start gap-3 overflow-hidden p-3 transition-colors hover:border-signal/30">
      <span
        className={`mt-0.5 h-full w-1 shrink-0 self-stretch rounded-full ${
          SEVERITY_BAR[alert.severity] || "bg-signal"
        }`}
      />
      <div className="flex min-w-0 flex-1 items-start gap-2">
        <Bell size={15} className="mt-0.5 shrink-0 text-text-muted" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`severity-badge ${SEVERITY_CLASS[alert.severity] || "severity-low"}`}>
              <SeverityIcon size={11} />
              {alert.severity}
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              {new Date(alert.created_at).toLocaleString()}
            </span>
            {!isNew && (
              <span className="text-[11px] font-mono uppercase text-healthy">
                {alert.status}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-text-primary" title={alert.message}>
            {alert.message}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Link
          to={`/inspections/${alert.inspection_id}`}
          className="rounded-md border border-line p-1.5 text-text-muted transition-colors hover:border-signal/40 hover:text-signal"
          title="View inspection"
          aria-label="View inspection"
        >
          <ExternalLink size={14} />
        </Link>
        {onAcknowledge && isNew && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="rounded-md border border-line p-1.5 text-text-muted transition-colors hover:border-healthy/40 hover:text-healthy"
            title="Acknowledge"
            aria-label="Acknowledge alert"
          >
            <Check size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
