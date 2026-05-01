'use client';

export function RatioBullet({ value, target }: { value: number | null; target: number | null }) {
  const pct =
    value != null && target != null && target !== 0 ? Math.min(100, Math.max(0, (value / target) * 100)) : 40;
  return (
    <div className="mt-2 relative h-6 bg-slate-100 rounded-md overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 bg-indigo-500/80 rounded-md" style={{ width: `${pct}%` }} />
      {target != null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
          style={{ left: `${Math.min(100, (target / ((value || target) + target)) * 50)}%` }}
        />
      )}
    </div>
  );
}
