'use client';

export function VarianceBarDelta({
  pct,
  abs,
  direction,
}: {
  pct: number | null;
  abs: number | null;
  direction: string | null;
}) {
  const isUp = direction === 'up';
  const width = Math.min(100, Math.abs(pct ?? 0));
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>Variance</span>
        <span className={isUp ? 'text-emerald-600' : 'text-red-600'}>
          {pct != null ? `${pct.toFixed(1)}%` : '—'} ({abs != null ? abs.toFixed(0) : '—'})
        </span>
      </div>
      <div className="h-3 rounded-full bg-slate-100">
        <div
          className={`h-3 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
