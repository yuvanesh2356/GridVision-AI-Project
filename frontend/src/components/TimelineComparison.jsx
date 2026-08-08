import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Minus, AlarmClock } from "lucide-react";

const SEVERITY_DOT = {
  Low: "bg-healthy",
  Medium: "bg-medium",
  High: "bg-high",
  Critical: "bg-critical",
};

function TrendIcon({ trend }) {
  if (trend === "down") return <TrendingDown size={15} className="text-critical" />;
  if (trend === "up") return <TrendingUp size={15} className="text-healthy" />;
  return <Minus size={15} className="text-text-muted" />;
}

/**
 * Full Timeline Comparison feature: Inspection Timeline, Health Score Trend,
 * Severity Trend, and Predicted Failure Window. `timeline` expects the
 * shape returned by GET /api/assets/{id}/timeline:
 * { asset_name, points: [{date, health_score, severity, defect_count}],
 *   health_score_trend, severity_trend, predicted_failure_days }
 */
export default function TimelineComparison({ timeline, compact = false }) {
  if (!timeline || !timeline.points || timeline.points.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-text-muted">
        No historical inspections available for this asset yet.
      </div>
    );
  }

  const chartData = timeline.points.map((p) => ({
    label: new Date(p.date).toLocaleDateString(undefined, { month: "short" }),
    health_score: p.health_score,
    severity: p.severity,
    defect_count: p.defect_count,
  }));

  const first = timeline.health_score_trend[0];
  const last = timeline.health_score_trend[timeline.health_score_trend.length - 1];
  const trend = last < first ? "down" : last > first ? "up" : "flat";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="label-eyebrow">Timeline Comparison</span>
          <TrendIcon trend={trend} />
        </div>
        {timeline.predicted_failure_days !== null &&
          timeline.predicted_failure_days !== undefined && (
            <div className="flex items-center gap-2 rounded-md border border-critical/30 bg-critical/10 px-3 py-1.5">
              <AlarmClock size={14} className="text-critical" />
              <span className="text-xs font-mono text-critical">
                Predicted Failure Window:{" "}
                <span className="font-semibold">
                  {timeline.predicted_failure_days} days
                </span>
              </span>
            </div>
          )}
      </div>

      {!compact && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748B", fontSize: 11 }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#64748B", fontSize: 11 }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: 6,
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 12,
              }}
              labelStyle={{ color: "#64748B" }}
            />
            <Line
              type="monotone"
              dataKey="health_score"
              name="Health Score"
              stroke="#2563EB"
              strokeWidth={2}
              dot={{ r: 4, fill: "#FFFFFF", stroke: "#2563EB", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-text-muted">
              <th className="label-eyebrow py-2 pr-4 font-normal">Inspection</th>
              <th className="label-eyebrow py-2 pr-4 font-normal">Health</th>
              <th className="label-eyebrow py-2 pr-4 font-normal">Severity</th>
              <th className="label-eyebrow py-2 font-normal">Defects</th>
            </tr>
          </thead>
          <tbody>
            {timeline.points.map((p, idx) => (
              <tr key={idx} className="border-b border-line/60 last:border-0">
                <td className="py-2.5 pr-4 font-mono text-text-muted">
                  {new Date(p.date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                  })}
                </td>
                <td className="py-2.5 pr-4 font-mono text-text-primary">
                  {p.health_score.toFixed(1)}
                </td>
                <td className="py-2.5 pr-4">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        SEVERITY_DOT[p.severity] || "bg-signal"
                      }`}
                    />
                    {p.severity}
                  </span>
                </td>
                <td className="py-2.5 font-mono text-text-muted">{p.defect_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
