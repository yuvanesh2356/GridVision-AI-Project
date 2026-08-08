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
  Low:      "#16A34A",
  Medium:   "#D97706",
  High:     "#EA580C",
  Critical: "#DC2626",
};

/* ── Custom Tooltip ─────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-panel-border bg-panel px-3.5 py-2.5 shadow-card-md">
      <div className="mb-1.5 text-[11px] font-mono text-text-muted">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill || "#2563EB" }}
          />
          <span className="text-[12px] font-mono text-text-primary">
            {p.name ?? p.dataKey}:{" "}
            <span className="font-semibold tabular-nums">
              {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Common axis style ───────────────────────────────────────── */
const AXIS_TICK  = { fill: "#9CA3AF", fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" };
const AXIS_LINE  = { stroke: "#E4E9F0" };
const GRID_STYLE = { stroke: "#F0F2F5", strokeDasharray: "4 4" };

/**
 * Two-part risk analytics panel: grid health area trend + severity bar chart.
 * Receives `trendData` [{label, health_score}] and `severityCounts` {Low, Medium, High, Critical}.
 */
export default function RiskAnalyticsChart({ trendData = [], severityCounts = {}, loading = false }) {
  const barData = ["Low", "Medium", "High", "Critical"].map((s) => ({
    severity: s,
    count: severityCounts[s] || 0,
  }));

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="min-w-0 space-y-2 lg:col-span-3">
          <div className="label-eyebrow">Grid Health Trend</div>
          <div className="skeleton h-[200px] w-full rounded-xl" />
        </div>
        <div className="min-w-0 space-y-2 lg:col-span-2">
          <div className="label-eyebrow">Severity Distribution</div>
          <div className="skeleton h-[200px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

      {/* ── Health trend area chart ── */}
      <div className="min-w-0 space-y-3 lg:col-span-3">
        <div className="label-eyebrow">Grid Health Trend</div>
        {trendData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#2563EB" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
                dy={6}
              />
              <YAxis
                domain={[0, 100]}
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2563EB22", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="health_score"
                name="Health Score"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#healthGrad)"
                dot={{ r: 4, fill: "#FFFFFF", stroke: "#2563EB", strokeWidth: 2.5 }}
                activeDot={{ r: 6, fill: "#2563EB", stroke: "#FFFFFF", strokeWidth: 2 }}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-panel-border bg-elevated/40">
            <span className="text-sm text-text-muted">No inspection history yet</span>
            <span className="text-[11px] font-mono text-text-faint">Upload a drone image to get started</span>
          </div>
        )}
      </div>

      {/* ── Severity distribution bar chart ── */}
      <div className="min-w-0 space-y-3 lg:col-span-2">
        <div className="label-eyebrow">Severity Distribution</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid {...GRID_STYLE} vertical={false} />
            <XAxis
              dataKey="severity"
              tick={AXIS_TICK}
              axisLine={AXIS_LINE}
              tickLine={false}
              dy={6}
            />
            <YAxis
              allowDecimals={false}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(37,99,235,0.05)", radius: 6 }}
            />
            <Bar
              dataKey="count"
              name="Findings"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              maxBarSize={48}
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
