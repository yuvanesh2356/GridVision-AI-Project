import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const SEVERITY_COLORS = {
  Low: "#16A34A",
  Medium: "#D97706",
  High: "#EA580C",
  Critical: "#DC2626",
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md border border-line bg-panel px-3 py-2 text-xs font-mono shadow-panel">
      <div className="text-text-muted">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="text-text-primary">
          {p.name ?? p.dataKey}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
}

/**
 * Two-part risk analytics view: a health-score trend area chart across
 * recent inspections, and a severity distribution bar chart. Pass
 * `trendData` (array of {label, health_score}) and `severityCounts`
 * (object like {Low: 3, Medium: 2, High: 1, Critical: 0}). Pass
 * `loading` to render skeleton placeholders instead of empty charts while
 * the Dashboard's initial fetch is in flight.
 */
export default function RiskAnalyticsChart({ trendData = [], severityCounts = {}, loading = false }) {
  const barData = ["Low", "Medium", "High", "Critical"].map((severity) => ({
    severity,
    count: severityCounts[severity] || 0,
  }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <div className="label-eyebrow mb-2">Grid Health Trend</div>
          <div className="skeleton h-[180px] w-full" />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <div className="label-eyebrow mb-2">Severity Distribution</div>
          <div className="skeleton h-[180px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="min-w-0 lg:col-span-3">
        <div className="label-eyebrow mb-2">Grid Health Trend</div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="health_score"
                name="Health Score"
                stroke="#2563EB"
                strokeWidth={2}
                fill="url(#healthFill)"
                isAnimationActive
                animationDuration={600}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[180px] items-center justify-center text-sm text-text-muted">
            No inspection history yet
          </div>
        )}
      </div>

      <div className="min-w-0 lg:col-span-2">
        <div className="label-eyebrow mb-2">Severity Distribution</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="severity"
              tick={{ fill: "#64748B", fontSize: 11 }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              axisLine={{ stroke: "#E2E8F0" }}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(61,169,224,0.06)" }} />
            <Bar
              dataKey="count"
              name="Findings"
              radius={[4, 4, 0, 0]}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            >
              {barData.map((entry) => (
                <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
