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

const SEVERITY_CLASS = {
  Low: "severity-low",
  Medium: "severity-medium",
  High: "severity-high",
  Critical: "severity-critical",
};

// Same escalating icon set used across AlertCard/InspectionDetail, so
// severity reads identically everywhere it appears in the app.
const SEVERITY_ICON = {
  Low: Info,
  Medium: AlertTriangle,
  High: AlertOctagon,
  Critical: Flame,
};

const SEVERITY_BAR_COLOR = {
  Low: "#16A34A",
  Medium: "#D97706",
  High: "#EA580C",
  Critical: "#DC2626",
};

// Icon + accent color per defect type, so the table reads at a glance
// instead of requiring the viewer to parse text for every row.
const DEFECT_STYLE = {
  rust: { icon: Flame, color: "#EA580C" },
  corrosion: { icon: Waves, color: "#D97706" },
  crack: { icon: Zap, color: "#DC2626" },
  broken_insulator: { icon: CircleSlash, color: "#DC2626" },
  broken_conductor: { icon: Bolt, color: "#DC2626" },
  loose_wire: { icon: Wind, color: "#EA580C" },
  bent_tower: { icon: ShieldAlert, color: "#DC2626" },
  missing_bolt: { icon: HelpCircle, color: "#D97706" },
  vegetation: { icon: TreeDeciduous, color: "#16A34A" },
  structural_measurement: { icon: Ruler, color: "#2563EB" },
};

function defectStyle(defectType) {
  return DEFECT_STYLE[defectType] || { icon: AlertTriangle, color: "#64748B" };
}

/** Compact horizontal confidence meter - faster to scan than a bare percent,
 * and color-matched to the finding's severity so high-confidence critical
 * findings visually stand out from low-confidence minor ones. */
function ConfidenceBar({ confidence = 0, severity }) {
  const pct = Math.round(confidence * 100);
  const color = SEVERITY_BAR_COLOR[severity] || "#2563EB";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="font-mono text-xs text-text-muted">{pct}%</span>
    </div>
  );
}

/**
 * Tabular list of detected defects for one or many inspections.
 * `findings` items expect: { component, defect_type, confidence, severity, explanation }
 */
export default function FindingsTable({ findings = [], compact = false }) {
  if (!findings.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <AlertTriangle size={20} className="text-text-muted" />
        <p className="text-sm text-text-muted">No findings recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-text-muted">
            <th className="label-eyebrow py-2 pr-4 font-normal">Component</th>
            <th className="label-eyebrow py-2 pr-4 font-normal">Defect</th>
            <th className="label-eyebrow py-2 pr-4 font-normal">Confidence</th>
            <th className="label-eyebrow py-2 pr-4 font-normal">Severity</th>
            {!compact && (
              <th className="label-eyebrow py-2 font-normal">Explanation</th>
            )}
          </tr>
        </thead>
        <tbody>
          {findings.map((f, idx) => {
            const { icon: DefectIcon, color } = defectStyle(f.defect_type);
            const SeverityIcon = SEVERITY_ICON[f.severity] || Info;
            return (
              <tr
                key={idx}
                className="animate-fadeInUp border-b border-line/60 last:border-0 hover:bg-elevated/50"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <td className="py-3 pr-4 font-medium capitalize text-text-primary">
                  {f.component}
                </td>
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-2 capitalize text-text-primary">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${color}1F` }}
                    >
                      <DefectIcon size={13} style={{ color }} />
                    </span>
                    {(f.defect_type || "").replaceAll("_", " ")}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <ConfidenceBar confidence={f.confidence} severity={f.severity} />
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`severity-badge ${SEVERITY_CLASS[f.severity] || "severity-low"}`}
                  >
                    <SeverityIcon size={11} />
                    {f.severity}
                  </span>
                </td>
                {!compact && (
                  <td className="max-w-md py-3 text-text-muted">{f.explanation}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
