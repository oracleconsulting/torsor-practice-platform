'use client';

export function RatioBarCompare({ value, target }: { value: number | null; target: number | null }) {
  const v = Math.abs(value ?? 0);
  const t = Math.abs(target ?? (v || 1));
  const max = Math.max(v, t, 1);
  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span>Value</span>
        <span>{value?.toFixed?.(2) ?? '—'}</span>
      </div>
      <div className="h-2 rounded bg-emerald-200">
        <div className="h-2 rounded bg-emerald-600" style={{ width: `${(v / max) * 100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        <span>Target</span>
        <span>{target?.toFixed?.(2) ?? '—'}</span>
      </div>
      <div className="h-2 rounded bg-slate-200">
        <div className="h-2 rounded bg-slate-500" style={{ width: `${(t / max) * 100}%` }} />
      </div>
    </div>
  );
}
