'use client';

import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface WatchItem {
  id: string;
  metric: string;
  current: number;
  threshold: number;
  unit: string;
  direction: 'above' | 'below';
  status: 'ok' | 'warning' | 'critical';
  action?: string;
}

interface WatchListProps {
  items: WatchItem[];
}

const statusConfig = {
  ok: {
    icon: CheckCircle,
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    iconClass: 'text-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-700'
  },
  warning: {
    icon: AlertTriangle,
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    iconClass: 'text-amber-500',
    badgeClass: 'bg-amber-100 text-amber-700'
  },
  critical: {
    icon: AlertCircle,
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    iconClass: 'text-red-500',
    badgeClass: 'bg-red-100 text-red-700'
  }
};

function formatValue(value: number, unit: string): string {
  if (unit === '£') return `£${value.toLocaleString()}`;
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === 'months') return `${value.toFixed(1)} months`;
  if (unit === 'days') return `${value} days`;
  return value.toLocaleString();
}

export function WatchList({ items }: WatchListProps) {
  const criticalCount = items.filter(i => i.status === 'critical').length;
  const warningCount = items.filter(i => i.status === 'warning').length;
  
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          📋 Your Watch List
        </h3>
        <p className="text-sm text-gray-500">
          No watch items configured yet. Your advisor will set up personalized thresholds.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            📋 Your Watch List
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Personalized thresholds we're monitoring
          </p>
        </div>
        <div className="flex gap-2">
          {criticalCount > 0 && (
            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
              {warningCount} warning
            </span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {items.map(item => {
          const config = statusConfig[item.status];
          const Icon = config.icon;
          
          // Calculate progress for visual bar
          const progress = item.direction === 'below'
            ? Math.min((item.threshold / Math.max(item.current, 1)) * 100, 100)
            : Math.min((item.current / Math.max(item.threshold, 1)) * 100, 100);
          
          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border ${config.bgClass} ${config.borderClass}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.iconClass}`} />
                  <span className="font-medium text-gray-900">{item.metric}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${config.badgeClass}`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {formatValue(item.current, item.unit)}
                </span>
                <span className="text-sm text-gray-500">
                  Threshold: {item.direction} {formatValue(item.threshold, item.unit)}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.status === 'ok' ? 'bg-emerald-500' :
                    item.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              
              {item.action && item.status !== 'ok' && (
                <p className="mt-2 text-sm text-gray-600">
                  💡 {item.action}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WatchList;

