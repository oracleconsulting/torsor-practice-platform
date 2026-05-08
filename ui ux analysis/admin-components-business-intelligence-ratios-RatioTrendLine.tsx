'use client';

export function RatioTrendLine({ series }: { series: { period_end: string; value: number }[] }) {
  if (!series.length) return <p className="text-xs text-slate-400">No history yet</p>;
  const w = 200;
  const h = 48;
  const vals = series.map((s) => s.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pts = series.map((s, i) => {
    const x = (i / Math.max(series.length - 1, 1)) * w;
    const y = h - ((s.value - min) / span) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} className="mt-2 text-emerald-600">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts.join(' ')} />
    </svg>
  );
}
