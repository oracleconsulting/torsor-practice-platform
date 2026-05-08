'use client';

import { RatioTrendLine } from './RatioTrendLine';

export function RatioSparkline({ series }: { series: { period_end: string; value: number }[] }) {
  return <RatioTrendLine series={series.slice(-8)} />;
}
