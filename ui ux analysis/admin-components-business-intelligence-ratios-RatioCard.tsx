'use client';

import type { RatioMetricRow } from '../../../hooks/useBICatalogMetrics';
import { CARD_SHELL, ragBorderBg, ragText } from '../../../lib/bi/biVisualTokens';
import { RatioGauge } from './RatioGauge';
import { RatioTrendLine } from './RatioTrendLine';
import { RatioSparkline } from './RatioSparkline';
import { RatioBullet } from './RatioBullet';
import { RatioBarCompare } from './RatioBarCompare';
import { RatioRadial } from './RatioRadial';

function formatVal(unit: string, v: number | null, dp: number): string {
  if (v === null || Number.isNaN(v)) return '—';
  if (unit === 'percentage') return `${v.toFixed(dp)}%`;
  if (unit === 'currency') return `£${v.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
  if (unit === 'days') return `${Math.round(v)}d`;
  return v.toFixed(dp);
}

export function RatioCard({ row, visual }: { row: RatioMetricRow; visual?: string }) {
  const vis = visual || row.default_visual || 'gauge';
  const rag = row.rag_status || undefined;

  return (
    <div className={`${CARD_SHELL} ${ragBorderBg(rag)}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.category}</p>
          <h4 className="text-sm font-semibold text-slate-800">{row.name}</h4>
        </div>
        <span className={`text-lg font-bold ${ragText(rag)}`}>{formatVal(row.unit, row.value, row.decimal_places)}</span>
      </div>
      {vis === 'gauge' && <RatioGauge value={row.value} target={row.target_value} />}
      {vis === 'trend_line' && <RatioTrendLine series={row.history} />}
      {vis === 'sparkline' && <RatioSparkline series={row.history} />}
      {vis === 'bullet' && <RatioBullet value={row.value} target={row.target_value} />}
      {vis === 'bar_compare' && <RatioBarCompare value={row.value} target={row.target_value} />}
      {vis === 'radial' && <RatioRadial value={row.value} target={row.target_value} />}
    </div>
  );
}
