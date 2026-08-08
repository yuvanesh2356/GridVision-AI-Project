import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Minus, AlarmClock, Activity } from "lucide-react";

const SEVERITY_STYLE = {
  Low:      { dot: "bg-healthy",  text: "text-healthy",  badge: "bg-healthy-bg border-healthy-border text-healthy"  },
  Medium:   { dot: "bg-medium",   text: "text-medium",   badge: "bg-medium-bg border-medium-border text-medium"    },
  High:     { dot: "bg-high",     text: "text-high",     badge: "bg-high-bg border-high-border text-high"          },
  Critical: { dot: "bg-critical", text: "text-critical", badge: "bg-critical-bg border-critical-border text-critical" },
};

const AXIS_TICK  = { fill: "#9CA3AF", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" };
const AXIS_LINE  = { stroke: "#E4E9F0" };

function TrendIcon({ trend }) {
  if (trend === "down") return <TrendingDown size={16} className="text-critical" />;
  if (trend === "up")   return <TrendingUp   size={16} className="text-healthy"  />;
  return <Minus size={16} className="text-text-muted" />;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-panel-border bg-panel px-3.5 py-2.5 shadow-card-md">
      <div className="mb-1.5 text-[11px] font-mono text-text-muted">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal" />
          <span className="text-[12px] font-mono text-text-primary">
            Health:{" "}
            <span className="font-semibold tabular-nums">
              {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Full Timeline Comparison: line chart + inspection history table + predicted failure badge.
 * `timeline` shape: { asset_name, points, health_score_trend, severity_trend, predicted_failure_days }
 */
export default function TimelineComparison({ timeline, compact = false }) {
  if (!timeline || !timeline.points || timeline.points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-elevated border border-panel-border">
          <Activity size={18} className="text-text-muted" />
        </div>
        <p className="text-sm text-text-muted">No historical inspections available for this asset yet.</p>
      </div>
    );
  }

  const chartData = timeline.points.map((p) => ({
    label:        new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    health_score: p.health_score,
    severity:     p.severity,
    defect_count: p.defect_count,
  }));

  const trend = (() => {
    const arr = timeline.health_score_trend;
    if (!arr || arr.length < 2) return "flat";
    return arr[arr.length - 1] < arr[0] ? "down" : arr[arr.length - 1] > arr[0] ? "up" : "flat";
  })();

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="label-eyebrow">Health Timeline</span>
          <TrendIcon trend={trend} />
        </div>
        {timeline.predicted_failure_days != null && (
          <div className="flex items-center gap-2 rounded-lg border border-critical-border bg-critical-bg px-3 py-1.5">
            <AlarmClock size={13} className="text-critical" />
            <span className="text-[12px] font-mono text-critical">
              Predicted failure:{" "}
              <span className="font-semibold">{timeline.predicted_failure_days} days</span>
            </span>
          </div>
        )}
      </div>

      {/* Line chart — hidden in compact mode */}
      {!compact && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563EB" floodOpacity="0.18" />
              </filter>
            </defs>
            <CartesianGrid stroke="#F0F2F5" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label"    tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} dy={6} />
            <YAxis domain={[0, 100]} tick={AXIS_TICK} axisLine={false}     tickLine={false} width={32} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2563EB22", strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="health_score"
              name="Health Score"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#FFFFFF", stroke: "#2563EB", strokeWidth: 2.5 }}
              activeDot={{ r: 7, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 }}
              style={{ filter: "url(#lineShadow)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Inspection history table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[380px] text-left">
          <thead>
            <tr className="border-b border-panel-border">
              <th className="label-eyebrow px-2 py-2.5 font-normal">Date</th>
              <th className="label-eyebrow px-2 py-2.5 font-normal">Health</th>
              <th className="label-eyebrow px-2 py-2.5 font-normal">Severity</th>
              <th className="label-eyebrow px-2 py-2.5 font-normal">Defects</th>
            </tr>
          </thead>
          <tbody>
            {timeline.points.map((p, idx) => {
              const s = SEVERITY_STYLE[p.severity] || SEVERITY_STYLE.Low;
              return (
                <tr
                  key={idx}
                  className="border-b border-panel-border/50 last:border-0 transition-colors duration-100 hover:bg-elevated/50"
                >
                  <td className="px-2 py-2.5 font-mono text-[12px] text-text-muted">
                    {new Date(p.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="font-mono text-[13px] font-semibold text-text-primary tabular-nums">
                      {p.health_score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      <span className={`text-[12px] font-medium ${s.text}`}>{p.severity}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-[12px] text-text-muted tabular-nums">
                    {p.defect_count}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
