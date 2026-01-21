'use client';

import type { VisualizationType } from '../../../types/ma-dashboard';

interface InsightVisualizationProps {
  type: VisualizationType;
  config: any;
}

export function InsightVisualization({ type, config }: InsightVisualizationProps) {
  if (!type || type === 'none' || !config) return null;

  switch (type) {
    case 'comparison':
      return <ComparisonViz items={config?.items || []} />;
    case 'timeline':
      return <TimelineViz events={config?.events || []} />;
    case 'progress':
      return <ProgressViz {...config} />;
    case 'bar_chart':
      return <BarChartViz data={config?.data || []} />;
    case 'mini_table':
      return <MiniTableViz columns={config?.columns || []} rows={config?.rows || []} />;
    case 'waterfall':
      return <WaterfallViz items={config?.items || []} />;
    default:
      return null;
  }
}

// ============================================
// COMPARISON VISUALIZATION
// Side-by-side value comparison
// ============================================

function ComparisonViz({ items }: { items: Array<{ label: string; value: number; color?: string }> }) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(Math.abs(value));

  const maxValue = Math.max(...items.map(i => Math.abs(i.value)));

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-32 text-sm text-slate-600">{item.label}</div>
          <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                item.value < 0 ? 'bg-red-400' : item.color || 'bg-blue-500'
              }`}
              style={{ width: `${(Math.abs(item.value) / maxValue) * 100}%` }}
            />
          </div>
          <div className={`w-24 text-right text-sm font-medium ${
            item.value < 0 ? 'text-red-600' : 'text-slate-700'
          }`}>
            {item.value < 0 ? '-' : ''}{formatCurrency(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TIMELINE VISUALIZATION
// Events on a timeline with amounts
// ============================================

function TimelineViz({ events }: { events: Array<{ date: string; label: string; amount: number; type?: string }> }) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(Math.abs(value));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
      {sortedEvents.map((event, idx) => (
        <div key={idx} className="relative">
          {/* Timeline dot */}
          <div className={`absolute -left-[21px] w-3 h-3 rounded-full border-2 border-white ${
            event.type === 'payment' ? 'bg-red-500' :
            event.type === 'receipt' ? 'bg-emerald-500' :
            'bg-blue-500'
          }`} />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">{formatDate(event.date)}</div>
              <div className="text-sm font-medium text-slate-700">{event.label}</div>
            </div>
            <div className={`text-sm font-semibold ${
              event.type === 'payment' || event.amount < 0 ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {event.type === 'payment' || event.amount < 0 ? '-' : '+'}
              {formatCurrency(event.amount)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// PROGRESS VISUALIZATION
// Progress towards a target
// ============================================

function ProgressViz({ current, target, label, unit }: { 
  current: number; 
  target: number; 
  label?: string;
  unit?: string;
}) {
  const percentage = Math.min((current / target) * 100, 100);
  
  const formatValue = (value: number) => {
    if (unit === 'currency') {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  };

  const getColor = () => {
    if (percentage >= 100) return 'bg-emerald-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium text-slate-700">{formatValue(current)}</span>
        <span className="text-slate-500">Target: {formatValue(target)}</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {label && (
        <div className="text-xs text-slate-500 mt-1 text-center">
          {percentage.toFixed(0)}% {label}
        </div>
      )}
    </div>
  );
}

// ============================================
// BAR CHART VISUALIZATION
// Simple horizontal bar chart
// ============================================

function BarChartViz({ data }: { data: Array<{ label: string; value: number; color?: string }> }) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(Math.abs(value));

  const maxValue = Math.max(...data.map(d => Math.abs(d.value)));

  return (
    <div className="space-y-2">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="w-24 text-xs text-slate-600 truncate">{item.label}</div>
          <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
            <div 
              className={`h-full rounded transition-all duration-300 ${
                item.value < 0 ? 'bg-red-400' : (item.color || 'bg-blue-500')
              }`}
              style={{ width: `${(Math.abs(item.value) / maxValue) * 100}%` }}
            />
          </div>
          <div className={`w-20 text-right text-xs font-medium ${
            item.value < 0 ? 'text-red-600' : 'text-slate-700'
          }`}>
            {formatCurrency(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// MINI TABLE VISUALIZATION
// Compact data table
// ============================================

function MiniTableViz({ columns, rows }: { columns: string[]; rows: any[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className="text-left py-1.5 px-2 font-medium text-slate-600 border-b border-slate-200 bg-slate-50"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-slate-50">
              {row.map((cell, cellIdx) => (
                <td 
                  key={cellIdx} 
                  className="py-1.5 px-2 border-b border-slate-100 text-slate-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// WATERFALL VISUALIZATION
// Mini waterfall for insights
// ============================================

function WaterfallViz({ items }: { items: Array<{ label: string; value: number; type: 'add' | 'subtract' | 'total' }> }) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(Math.abs(value));

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            item.type === 'add' ? 'bg-emerald-500' :
            item.type === 'subtract' ? 'bg-red-500' :
            'bg-blue-500'
          }`} />
          <div className="flex-1 text-slate-600">{item.label}</div>
          <div className={`font-medium ${
            item.type === 'add' ? 'text-emerald-600' :
            item.type === 'subtract' ? 'text-red-600' :
            'text-slate-900'
          }`}>
            {item.type === 'add' && '+'}
            {item.type === 'subtract' && '-'}
            {formatCurrency(item.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

