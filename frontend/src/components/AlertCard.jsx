import React from "react";
import { Bell, Check, ExternalLink, Info, AlertTriangle, AlertOctagon, Flame } from "lucide-react";
import { Link } from "react-router-dom";

const SEVERITY_BAR = {
  Low:      { bar: "#16A34A", bg: "bg-healthy-bg",  border: "border-healthy-border",  text: "text-healthy" },
  Medium:   { bar: "#D97706", bg: "bg-medium-bg",   border: "border-medium-border",   text: "text-medium"  },
  High:     { bar: "#EA580C", bg: "bg-high-bg",     border: "border-high-border",     text: "text-high"    },
  Critical: { bar: "#DC2626", bg: "bg-critical-bg", border: "border-critical-border", text: "text-critical" },
};

const SEVERITY_ICON = {
  Low:      Info,
  Medium:   AlertTriangle,
  High:     AlertOctagon,
  Critical: Flame,
};

/**
 * Single alert row.
 * `alert` expects: { id, inspection_id, severity, message, status, created_at }
 * `onAcknowledge(id)` — optional, omit to render read-only.
 */
export default function AlertCard({ alert, onAcknowledge }) {
  const isNew = alert.status === "new";
  const SeverityIcon = SEVERITY_ICON[alert.severity] || Info;
  const style = SEVERITY_BAR[alert.severity] || SEVERITY_BAR.Low;

  return (
    <div
      className={`group relative flex items-start gap-0 overflow-hidden rounded-xl border shadow-card
        transition-all duration-200 hover:shadow-card-md hover:-translate-y-px
        bg-panel ${style.border}`}
    >
      {/* Left severity stripe */}
      <div
        className="w-1 shrink-0 self-stretch rounded-l-xl"
        style={{ background: style.bar }}
      />

      <div className="flex flex-1 items-start gap-3 px-3 py-3 min-w-0">
        {/* Icon */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${style.bg} ${style.border}`}
        >
          <SeverityIcon size={14} className={style.text} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`severity-badge ${
              alert.severity === "Low" ? "severity-low" :
              alert.severity === "Medium" ? "severity-medium" :
              alert.severity === "High" ? "severity-high" : "severity-critical"
            }`}>
              <SeverityIcon size={10} />
              {alert.severity}
            </span>
            {!isNew && (
              <span className="rounded-full bg-healthy-bg border border-healthy-border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-healthy">
                {alert.status}
              </span>
            )}
            <span className="text-[11px] font-mono text-text-faint ml-auto">
              {new Date(alert.created_at).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <p className="text-[13px] text-text-secondary leading-snug" title={alert.message}>
            {alert.message}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 px-2 py-3">
        <Link
          to={`/inspections/${alert.inspection_id}`}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-panel-border text-text-muted
            transition-all duration-150 hover:border-signal/40 hover:text-signal hover:bg-signal/5"
          title="View inspection"
          aria-label="View inspection"
        >
          <ExternalLink size={13} />
        </Link>
        {onAcknowledge && isNew && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-panel-border text-text-muted
              transition-all duration-150 hover:border-healthy/40 hover:text-healthy hover:bg-healthy-bg"
            title="Acknowledge"
            aria-label="Acknowledge alert"
          >
            <Check size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
