'use client';

import { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import type { MACashForecast, MACashForecastPeriod } from '../../types/business-intelligence';

interface CashForecastChartProps {
  forecast: MACashForecast;
  periods: MACashForecastPeriod[];
  showActuals?: boolean;
}

export function CashForecastChart({ 
  forecast, 
  periods,
  showActuals = false 
}: CashForecastChartProps) {
  const [hoveredPeriod, setHoveredPeriod] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-GB', { 
      style: 'currency', 
      currency: 'GBP', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value);

  // Find min and max for chart scaling
  const allValues = periods.flatMap(p => [
    p.opening_balance,
    p.closing_balance,
    ...(showActuals && p.actual_closing ? [p.actual_closing] : [])
  ]);
  const minValue = Math.min(...allValues) * 0.9;
  const maxValue = Math.max(...allValues) * 1.1;
  const range = maxValue - minValue;

  const getYPosition = (value: number) => {
    return 100 - ((value - minValue) / range) * 100;
  };

  // Find warning periods
  const warningPeriods = periods.filter(p => p.is_warning);
  const lowestPoint = periods.reduce((min, p) => 
    p.closing_balance < min.closing_balance ? p : min
  );

  // Calculate trend
  const firstPeriod = periods[0];
  const lastPeriod = periods[periods.length - 1];
  const trend = lastPeriod.closing_balance - firstPeriod.opening_balance;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              {forecast.forecast_type === '13_week' ? '13-Week' : '6-Month'} Cash Forecast
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Created {new Date(forecast.created_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {warningPeriods.length > 0 && (
              <div className="flex items-center gap-1 text-amber-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {warningPeriods.length} warning{warningPeriods.length > 1 ? 's' : ''}
              </div>
            )}
            <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {formatCurrency(Math.abs(trend))} net change
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <div className="relative h-64 mb-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-slate-500">
            <span>{formatCurrency(maxValue)}</span>
            <span>{formatCurrency((maxValue + minValue) / 2)}</span>
            <span>{formatCurrency(minValue)}</span>
          </div>

          {/* Chart area */}
          <div className="ml-16 h-full relative">
            {/* Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              <div className="border-b border-slate-100" />
              <div className="border-b border-slate-100" />
              <div className="border-b border-slate-100" />
            </div>

            {/* SVG for lines and areas */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Zero line if applicable */}
              {minValue < 0 && (
                <line
                  x1="0"
                  y1={`${getYPosition(0)}%`}
                  x2="100%"
                  y2={`${getYPosition(0)}%`}
                  stroke="#ef4444"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              )}

              {/* Forecast area fill */}
              <defs>
                <linearGradient id="cashGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`
                  M 0 ${getYPosition(periods[0].opening_balance)}
                  ${periods.map((p, i) => {
                    const x = (i / (periods.length - 1)) * 100;
                    const y = getYPosition(p.closing_balance);
                    return `L ${x} ${y}`;
                  }).join(' ')}
                  L 100 100
                  L 0 100
                  Z
                `}
                fill="url(#cashGradient)"
              />

              {/* Forecast line */}
              <path
                d={`
                  M 0 ${getYPosition(periods[0].opening_balance)}
                  ${periods.map((p, i) => {
                    const x = (i / (periods.length - 1)) * 100;
                    const y = getYPosition(p.closing_balance);
                    return `L ${x} ${y}`;
                  }).join(' ')}
                `}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />

              {/* Actuals line (if available) */}
              {showActuals && (
                <path
                  d={`
                    ${periods
                      .filter(p => p.actual_closing !== null)
                      .map((p, i) => {
                        const periodIndex = periods.indexOf(p);
                        const x = (periodIndex / (periods.length - 1)) * 100;
                        const y = getYPosition(p.actual_closing!);
                        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                      }).join(' ')}
                  `}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
              )}
            </svg>

            {/* Data points */}
            <div className="absolute inset-0 flex justify-between">
              {periods.map((period, idx) => (
                <div
                  key={period.id}
                  className="relative flex-1"
                  onMouseEnter={() => setHoveredPeriod(idx)}
                  onMouseLeave={() => setHoveredPeriod(null)}
                >
                  {/* Warning indicator */}
                  {period.is_warning && (
                    <div 
                      className="absolute w-full h-full bg-amber-500/10"
                      style={{ top: 0 }}
                    />
                  )}

                  {/* Forecast point */}
                  <div
                    className={`absolute w-3 h-3 rounded-full -ml-1.5 ${
                      period.is_warning ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ top: `${getYPosition(period.closing_balance)}%` }}
                  />

                  {/* Actual point */}
                  {showActuals && period.actual_closing && (
                    <div
                      className="absolute w-3 h-3 rounded-full -ml-1.5 bg-green-500"
                      style={{ top: `${getYPosition(period.actual_closing)}%` }}
                    />
                  )}

                  {/* Tooltip */}
                  {hoveredPeriod === idx && (
                    <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs rounded-lg p-3 min-w-[180px] shadow-lg">
                      <p className="font-medium mb-2">{period.period_label}</p>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Opening:</span>
                          <span>{formatCurrency(period.opening_balance)}</span>
                        </div>
                        <div className="flex justify-between text-green-400">
                          <span>+ Receipts:</span>
                          <span>{formatCurrency(period.forecast_receipts)}</span>
                        </div>
                        <div className="flex justify-between text-red-400">
                          <span>- Payments:</span>
                          <span>{formatCurrency(period.forecast_payments)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-600 pt-1 mt-1 font-medium">
                          <span>Closing:</span>
                          <span className={period.is_warning ? 'text-amber-400' : ''}>
                            {formatCurrency(period.closing_balance)}
                          </span>
                        </div>
                        {showActuals && period.actual_closing && (
                          <div className="flex justify-between text-green-400 border-t border-slate-600 pt-1 mt-1">
                            <span>Actual:</span>
                            <span>{formatCurrency(period.actual_closing)}</span>
                          </div>
                        )}
                      </div>
                      {period.is_warning && period.warning_message && (
                        <p className="text-amber-400 text-xs mt-2 pt-2 border-t border-slate-600">
                          ⚠️ {period.warning_message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* X-axis labels */}
        <div className="ml-16 flex justify-between text-xs text-slate-500">
          {periods.map((p, idx) => (
            <span 
              key={p.id} 
              className={`text-center ${idx === 0 || idx === periods.length - 1 || idx % 2 === 0 ? 'visible' : 'invisible'}`}
            >
              {p.period_label}
            </span>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600">Forecast</span>
          </div>
          {showActuals && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-600">Actual</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-600">Warning</span>
          </div>
        </div>
      </div>

      {/* Warnings Section */}
      {warningPeriods.length > 0 && (
        <div className="px-5 pb-5">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-800 flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4" />
              Cash Flow Warnings
            </h4>
            <div className="space-y-3">
              {warningPeriods.map(period => (
                <div key={period.id} className="text-sm">
                  <p className="font-medium text-amber-900">
                    {period.period_label}: {formatCurrency(period.closing_balance)}
                  </p>
                  {period.warning_message && (
                    <p className="text-amber-700">{period.warning_message}</p>
                  )}
                  {period.recommended_actions && period.recommended_actions.length > 0 && (
                    <ul className="mt-1 space-y-1">
                      {period.recommended_actions.map((action: string, idx: number) => (
                        <li key={idx} className="text-amber-600 flex items-start gap-1">
                          <span className="text-amber-500">→</span> {action}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lowest Point Highlight */}
      <div className="px-5 pb-5">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
          <Info className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <div className="text-sm">
            <span className="text-slate-600">Lowest projected cash point: </span>
            <span className="font-semibold text-slate-800">
              {formatCurrency(lowestPoint.closing_balance)}
            </span>
            <span className="text-slate-600"> in {lowestPoint.period_label}</span>
          </div>
        </div>
      </div>

      {/* Detailed Table Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
      >
        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showDetails ? 'Hide' : 'Show'} Detailed Breakdown
      </button>

      {/* Detailed Table */}
      {showDetails && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-t border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Period</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Opening</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Receipts</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Payments</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Net</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">Closing</th>
                {showActuals && (
                  <th className="px-4 py-2 text-right font-medium text-slate-600">Actual</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.map(period => (
                <tr 
                  key={period.id} 
                  className={period.is_warning ? 'bg-amber-50' : 'hover:bg-slate-50'}
                >
                  <td className="px-4 py-2 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      {period.is_warning && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                      {period.period_label}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(period.opening_balance)}</td>
                  <td className="px-4 py-2 text-right text-green-600">+{formatCurrency(period.forecast_receipts)}</td>
                  <td className="px-4 py-2 text-right text-red-600">-{formatCurrency(period.forecast_payments)}</td>
                  <td className={`px-4 py-2 text-right ${period.net_movement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {period.net_movement >= 0 ? '+' : ''}{formatCurrency(period.net_movement)}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${period.is_warning ? 'text-amber-700' : 'text-slate-800'}`}>
                    {formatCurrency(period.closing_balance)}
                  </td>
                  {showActuals && (
                    <td className="px-4 py-2 text-right text-green-600">
                      {period.actual_closing ? formatCurrency(period.actual_closing) : '-'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CashForecastChart;

