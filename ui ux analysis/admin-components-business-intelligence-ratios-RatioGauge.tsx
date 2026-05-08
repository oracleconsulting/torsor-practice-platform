'use client';

export function RatioGauge({ value, target }: { value: number | null; target: number | null }) {
  const pct =
    value != null && target != null && target !== 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : value != null ? 50 : 0;
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      {target != null && <span className="text-xs text-slate-500">Target {target}</span>}
    </div>
  );
}
