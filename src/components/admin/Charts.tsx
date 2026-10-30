"use client";

/** Minimal, dependency-free charts (plain SVG) — avoids pulling in a charting library for a
 *  handful of simple series. Not pixel-perfect, but every value drawn is a real database number. */

interface Point {
  label: string;
  value: number;
}

const BRAND = "#0f3d39";
const PALETTE = ["#0f3d39", "#c9962c", "#2f6e68", "#94a3b8", "#b45309"];

export function BarLineChart({ points, height = 160, color = BRAND, formatValue }: { points: Point[]; height?: number; color?: string; formatValue?: (v: number) => string }) {
  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No data in this range.</p>;
  }
  const max = Math.max(1, ...points.map((p) => p.value));
  const width = Math.max(240, points.length * 36);
  const barWidth = Math.min(28, (width / points.length) * 0.6);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height + 24} role="img" aria-label="Chart">
        {points.map((p, i) => {
          const x = i * (width / points.length) + (width / points.length - barWidth) / 2;
          const barHeight = (p.value / max) * height;
          const y = height - barHeight;
          return (
            <g key={p.label}>
              <title>{`${p.label}: ${formatValue ? formatValue(p.value) : p.value}`}</title>
              <rect x={x} y={y} width={barWidth} height={Math.max(1, barHeight)} rx={3} fill={color} opacity={0.85} />
              <text x={x + barWidth / 2} y={height + 16} textAnchor="middle" fontSize={10} fill="#64748b">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DonutBreakdown({ segments }: { segments: { label: string; value: number }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) {
    return <p className="py-6 text-center text-sm text-slate-400">No data in this range.</p>;
  }
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcs = segments.reduce<{ label: string; dash: number; offset: number }[]>((acc, s) => {
    const dash = (s.value / total) * circumference;
    const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    acc.push({ label: s.label, dash, offset });
    return acc;
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width={140} height={140} viewBox="0 0 140 140" role="img" aria-label="Breakdown">
        <g transform="translate(70,70) rotate(-90)">
          <circle r={radius} fill="none" stroke="#e2e8f0" strokeWidth={20} />
          {arcs.map((arc, i) => (
            <circle
              key={arc.label}
              r={radius}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={20}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </g>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="font-medium text-slate-800">{s.value}</span>
            <span className="text-xs text-slate-400">({total > 0 ? Math.round((s.value / total) * 100) : 0}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
