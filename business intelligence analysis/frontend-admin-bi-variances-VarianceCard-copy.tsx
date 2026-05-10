'use client';

import type { VarianceMetricRow } from '../../../hooks/useBICatalogMetrics';
import { CARD_SHELL, ragBorderBg } from '../../../lib/bi/biVisualTokens';
import { VarianceWaterfall } from './VarianceWaterfall';
import { VarianceBarDelta } from './VarianceBarDelta';
import { VarianceArrowCard } from './VarianceArrowCard';
import { VarianceBridge } from './VarianceBridge';
import { VarianceTrafficLight } from './VarianceTrafficLight';

export function VarianceCard({ row }: { row: VarianceMetricRow }) {
  const vis = row.default_visual || 'bar_delta';
  const rag = row.rag_status || undefined;
  return (
    <div className={`${CARD_SHELL} ${ragBorderBg(rag)}`}>
      <p className="text-xs font-medium uppercase text-slate-500">{row.category}</p>
      <h4 className="text-sm font-semibold text-slate-800 mb-2">{row.name}</h4>
      {vis === 'waterfall' && (
        <VarianceWaterfall base={row.base_value} comparator={row.comparator_value} delta={row.absolute_delta} />
      )}
      {vis === 'bar_delta' && (
        <VarianceBarDelta pct={row.percent_delta} abs={row.absolute_delta} direction={row.direction} />
      )}
      {vis === 'arrow_card' && (
        <VarianceArrowCard pct={row.percent_delta} direction={row.direction} />
      )}
      {vis === 'bridge' && (
        <VarianceBridge base={row.base_value} comparator={row.comparator_value} />
      )}
      {vis === 'traffic_light' && <VarianceTrafficLight pct={row.percent_delta} />}
    </div>
  );
}
