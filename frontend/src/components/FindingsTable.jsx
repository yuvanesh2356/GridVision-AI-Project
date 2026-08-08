import React from "react";
import {
  AlertTriangle,
  Flame,
  Zap,
  Wind,
  CircleSlash,
  Waves,
  TreeDeciduous,
  Bolt,
  ShieldAlert,
  Ruler,
  HelpCircle,
  Info,
  AlertOctagon,
} from "lucide-react";

const SEVERITY_COLORS = {
  Low:      { text: "text-healthy",  bg: "bg-healthy-bg",  border: "border-healthy-border",  bar: "#16A34A" },
  Medium:   { text: "text-medium",   bg: "bg-medium-bg",   border: "border-medium-border",   bar: "#D97706" },
  High:     { text: "text-high",     bg: "bg-high-bg",     border: "border-high-border",     bar: "#EA580C" },
  Critical: { text: "text-critical", bg: "bg-critical-bg", border: "border-critical-border", bar: "#DC2626" },
};

const SEVERITY_ICON = {
  Low: Info,
  Medium: AlertTriangle,
  High: AlertOctagon,
  Critical: Flame,
};

const DEFECT_STYLE = {
  rust:                  { icon: Flame,         color: "#EA580C" },
  corrosion:             { icon: Waves,          color: "#D97706" },
  crack:                 { icon: Zap,            color: "#DC2626" },
  broken_insulator:      { icon: CircleSlash,    color: "#DC2626" },
  broken_conductor:      { icon: Bolt,           color: "#DC2626" },
  loose_wire:            { icon: Wind,           color: "#EA580C" },
  bent_tower:            { icon: ShieldAlert,    color: "#DC2626" },
  missing_bolt:          { icon: HelpCircle,     color: "#D97706" },
  vegetation:            { icon: TreeDeciduous,  color: "#16A34A" },
  structural_measurement:{ icon: Ruler,          color: "#2563EB" },
};

function defectStyle(defectType) {
  return DEFECT_STYLE[defectType] || { icon: AlertTriangle, color: "#6B7280" };
}

/** Compact horizontal confidence bar, color-matched to severity */
function ConfidenceBar({ confidence = 0, severity }) {
  const pct   = Math.round(confidence * 100);
  const sev   = SEVERITY_COLORS[severity] || SEVERITY_COLORS.Low;
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: sev.bar }}
        />
      </div>
      <span className="w-8 text-right font-mono text-[11px] text-text-muted tabular-nums">
        {pct}%
      </span>
    </div>
  );
}

/**
 * Tabular list of detected defects.
 * `findings` items: { component, defect_type, confidence, severity, explanation }
 */
export default function FindingsTable({ findings = [], compact = false }) {
  if (!findings.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-elevated border border-panel-border">
          <AlertTriangle size={20} className="text-text-muted" />
        </div>
        <p className="text-sm text-text-muted">No findings recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[600px] text-left">
        <thead>
          <tr className="border-b border-panel-border">
            <th className="label-eyebrow px-3 py-3 font-normal">Component</th>
            <th className="label-eyebrow px-3 py-3 font-normal">Defect Type</th>
            <th className="label-eyebrow px-3 py-3 font-normal">Confidence</th>
            <th className="label-eyebrow px-3 py-3 font-normal">Severity</th>
            {!compact && (
              <th className="label-eyebrow px-3 py-3 font-normal">AI Explanation</th>
            )}
          </tr>
        </thead>
        <tbody>
          {findings.map((f, idx) => {
            const { icon: DefectIcon, color } = defectStyle(f.defect_type);
            const SeverityIcon = SEVERITY_ICON[f.severity] || Info;
            const sev = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.Low;
            return (
              <tr
                key={idx}
                className="animate-fadeInUp border-b border-panel-border/50 last:border-0
                  transition-colors duration-100 hover:bg-elevated/60"
                style={{ animationDelay: `${idx * 35}ms` }}
              >
                {/* Component */}
                <td className="px-3 py-3">
                  <span className="text-[13px] font-medium capitalize text-text-primary">
                    {f.component}
                  </span>
                </td>

                {/* Defect type */}
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${color}18` }}
                    >
                      <DefectIcon size={13} style={{ color }} />
                    </span>
                    <span className="text-[13px] capitalize text-text-secondary">
                      {(f.defect_type || "").replaceAll("_", " ")}
                    </span>
                  </span>
                </td>

                {/* Confidence bar */}
                <td className="px-3 py-3">
                  <ConfidenceBar confidence={f.confidence} severity={f.severity} />
                </td>

                {/* Severity badge */}
                <td className="px-3 py-3">
                  <span
                    className={`severity-badge ${
                      f.severity === "Low"      ? "severity-low" :
                      f.severity === "Medium"   ? "severity-medium" :
                      f.severity === "High"     ? "severity-high" : "severity-critical"
                    }`}
                  >
                    <SeverityIcon size={10} />
                    {f.severity}
                  </span>
                </td>

                {/* Explanation */}
                {!compact && (
                  <td className="px-3 py-3 max-w-xs">
                    <p className="text-[12px] leading-relaxed text-text-muted line-clamp-2">
                      {f.explanation}
                    </p>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
