'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'flat';
  status?: 'good' | 'warning' | 'critical';
}

interface MetricsSummaryBarProps {
  metrics: Metric[];
}

export function MetricsSummaryBar({ metrics }: MetricsSummaryBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => {
        const statusClasses = {
          good: 'border-emerald-200 bg-emerald-50',
          warning: 'border-amber-200 bg-amber-50',
          critical: 'border-red-200 bg-red-50'
        };
        
        const TrendIcon = metric.trend === 'up' ? TrendingUp :
                          metric.trend === 'down' ? TrendingDown : Minus;
        
        return (
          <div
            key={index}
            className={`p-4 rounded-xl border transition-shadow hover:shadow-md ${
              metric.status ? statusClasses[metric.status] : 'border-gray-200 bg-white'
            }`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {metric.label}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              {metric.trend && (
                <TrendIcon className={`w-4 h-4 ${
                  metric.trend === 'up' ? 'text-emerald-500' :
                  metric.trend === 'down' ? 'text-red-500' : 'text-gray-400'
                }`} />
              )}
            </div>
            {metric.subtext && (
              <p className="text-xs text-gray-500 mt-1">{metric.subtext}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MetricsSummaryBar;


