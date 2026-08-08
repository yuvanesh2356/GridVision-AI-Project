import React, { useEffect, useRef, useState } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

function scoreColor(score) {
  if (score >= 85) return "#16A34A"; // healthy
  if (score >= 65) return "#D97706"; // medium
  if (score >= 40) return "#EA580C"; // high
  return "#DC2626";                   // critical
}

function scoreLabel(score) {
  if (score >= 85) return "Healthy";
  if (score >= 65) return "Fair";
  if (score >= 40) return "At Risk";
  return "Critical";
}

function scoreBg(score) {
  if (score >= 85) return "rgba(22,163,74,0.08)";
  if (score >= 65) return "rgba(217,119,6,0.08)";
  if (score >= 40) return "rgba(234,88,12,0.08)";
  return "rgba(220,38,38,0.08)";
}

/**
 * Radial gauge for a 0-100 Grid Health Score.
 * `size` controls diameter in pixels.
 * `label` — pass false to suppress the label below the gauge.
 */
export default function HealthScoreGauge({ score = 0, size = 140, label }) {
  const color = scoreColor(score);
  const bg = scoreBg(score);
  const data = [{ name: "health", value: score, fill: color }];

  // Smooth count-up animation for the center number
  const [displayScore, setDisplayScore] = useState(0);
  const startRef = useRef(null);
  const fromRef  = useRef(0);

  useEffect(() => {
    const from     = fromRef.current;
    const to       = score;
    startRef.current = null;
    let raf;
    const duration = 700;
    const step = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(from + (to - from) * eased);
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

  /* Recharts RadialBar has a known issue where innerRadius/outerRadius
     percentages are computed against the chart *width*, so when width ≠ height
     the gauge appears offset. We lock width === height to fix alignment. */
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ width: size, flexShrink: 0 }}
    >
      {/* Gauge ring */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Tinted background circle */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: bg }}
        />
        <RadialBarChart
          width={size}
          height={size}
          cx={size / 2}
          cy={size / 2}
          innerRadius={size * 0.36}
          outerRadius={size * 0.48}
          barSize={size * 0.095}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            background={{ fill: "#E4E9F0" }}
            dataKey="value"
            cornerRadius={999}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
        </RadialBarChart>

        {/* Center text — absolutely centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono font-bold tabular-nums leading-none"
            style={{ fontSize: Math.max(size * 0.21, 12), color }}
          >
            {Math.round(displayScore)}
          </span>
          {size >= 80 && (
            <span
              className="mt-0.5 font-mono text-text-muted"
              style={{ fontSize: Math.max(size * 0.09, 9) }}
            >
              /100
            </span>
          )}
        </div>
      </div>

      {/* Label below gauge */}
      {label !== false && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          <span
            className="font-medium text-text-muted"
            style={{ fontSize: Math.max(size * 0.085, 10) }}
          >
            {typeof label === "string" ? label : scoreLabel(score)}
          </span>
        </div>
      )}
    </div>
  );
}
