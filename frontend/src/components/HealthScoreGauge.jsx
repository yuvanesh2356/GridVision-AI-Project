import React, { useEffect, useRef, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

function scoreColor(score) {
  if (score >= 85) return "#16A34A"; // healthy
  if (score >= 65) return "#D97706"; // medium
  if (score >= 40) return "#EA580C"; // high
  return "#DC2626"; // critical
}

function scoreLabel(score) {
  if (score >= 85) return "Healthy";
  if (score >= 65) return "Fair";
  if (score >= 40) return "At Risk";
  return "Critical";
}

/**
 * Radial gauge for a 0-100 Grid Health Score. `size` controls diameter in
 * pixels; used both large (Dashboard KPI) and small (AssetList rows).
 * Animates smoothly whenever `score` changes, so an updated inspection or a
 * freshly-loaded asset visibly "fills in" rather than snapping.
 */
export default function HealthScoreGauge({ score = 0, size = 140, label }) {
  const color = scoreColor(score);
  const data = [{ name: "health", value: score, fill: color }];

  // Animate the center number in step with the radial bar's own transition.
  const [displayScore, setDisplayScore] = useState(0);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = score;
    startRef.current = null;
    let raf;
    const duration = 700;
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / duration);
      setDisplayScore(from + (to - from) * progress);
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div style={{ width: size, height: size }} className="relative">
        <RadialBarChart
          width={size}
          height={size}
          cx="50%"
          cy="50%"
          innerRadius="72%"
          outerRadius="100%"
          barSize={size * 0.09}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: "#E2E8F0" }}
            dataKey="value"
            cornerRadius={999}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-semibold leading-none tabular-nums"
            style={{ fontSize: size * 0.22, color }}
          >
            {Math.round(displayScore)}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">
            / 100
          </span>
        </div>
      </div>
      {label !== false && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          <span className="text-xs font-medium text-text-muted">
            {label || scoreLabel(score)}
          </span>
        </div>
      )}
    </div>
  );
}
