'use client';

import { Link } from 'react-router-dom';
import { RatioTrendLine } from '../ratios/RatioTrendLine';

export interface PerpetualPoint {
  period_end: string;
  period_id: string;
  value: number;
  rag_status?: string | null;
}

export function PerpetualMetricRow({
  title,
  subtitle,
  series,
  clientId,
  reportHrefForPeriod,
}: {
  title: string;
  subtitle: string;
  series: PerpetualPoint[];
  clientId: string;
  /** Defaults to admin report URL; client portal should pass `/service/business_intelligence/reports/:id`. */
  reportHrefForPeriod?: (periodId: string) => string;
}) {
  const history = series.map((s) => ({ period_end: s.period_end, value: s.value }));
  const last = series[series.length - 1];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="font-semibold text-slate-800">{title}</h4>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        {last && (
          <Link
            to={(reportHrefForPeriod ?? ((pid) => `/clients/${clientId}/bi/reports/${pid}`))(last.period_id)}
            className="text-xs text-indigo-600 hover:underline"
          >
            Latest report →
          </Link>
        )}
      </div>
      <RatioTrendLine series={history} />
    </div>
  );
}
