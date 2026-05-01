'use client';

export function VarianceTrafficLight({ pct }: { pct: number | null }) {
  const v = pct ?? 0;
  const color = Math.abs(v) < 3 ? 'bg-emerald-500' : Math.abs(v) < 10 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className={`w-10 h-10 rounded-full ${color}`} />
      <span className="text-sm text-slate-700">{pct != null ? `${pct.toFixed(1)}% vs comparator` : '—'}</span>
    </div>
  );
}
