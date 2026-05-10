'use client';

export function VarianceBridge({ base, comparator }: { base: number | null; comparator: number | null }) {
  return (
    <div className="flex items-end gap-2 h-24 mt-2">
      <div className="flex-1 flex flex-col justify-end">
        <div className="bg-indigo-500 rounded-t" style={{ height: `${Math.min(100, ((base ?? 0) / Math.max(Math.abs(base ?? 1), Math.abs(comparator ?? 1))) * 80)}px` }} />
        <span className="text-xs text-center text-slate-600 mt-1">Now</span>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <div className="bg-slate-400 rounded-t" style={{ height: `${Math.min(100, ((comparator ?? 0) / Math.max(Math.abs(base ?? 1), Math.abs(comparator ?? 1))) * 80)}px` }} />
        <span className="text-xs text-center text-slate-600 mt-1">Compare</span>
      </div>
    </div>
  );
}
