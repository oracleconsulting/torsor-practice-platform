'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

export function VarianceArrowCard({ pct, direction }: { pct: number | null; direction: string | null }) {
  const up = direction === 'up';
  return (
    <div className="flex items-center gap-3 mt-2">
      {up ? <TrendingUp className="w-8 h-8 text-emerald-600" /> : <TrendingDown className="w-8 h-8 text-red-500" />}
      <span className="text-lg font-semibold text-slate-800">{pct != null ? `${pct.toFixed(1)}%` : '—'}</span>
    </div>
  );
}
