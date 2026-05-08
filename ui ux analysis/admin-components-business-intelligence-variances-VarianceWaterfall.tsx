'use client';

export function VarianceWaterfall({
  base,
  comparator,
  delta,
}: {
  base: number | null;
  comparator: number | null;
  delta: number | null;
}) {
  const items = [
    { label: 'Current', value: base ?? 0, color: 'bg-emerald-500' },
    { label: 'Prior', value: comparator ?? 0, color: 'bg-slate-400' },
    { label: 'Δ', value: delta ?? 0, color: (delta ?? 0) >= 0 ? 'bg-emerald-600' : 'bg-red-500' },
  ];
  const max = Math.max(...items.map((i) => Math.abs(i.value)), 1);
  return (
    <div className="space-y-2 mt-2">
      {items.map((i) => (
        <div key={i.label}>
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>{i.label}</span>
            <span>{i.value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="h-3 rounded bg-slate-100 overflow-hidden">
            <div className={`h-3 rounded ${i.color}`} style={{ width: `${(Math.abs(i.value) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
