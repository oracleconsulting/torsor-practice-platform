'use client';

import { useState } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface ForecastWeek {
  week: number;
  date: string;
  projected: number;
}

interface Scenario {
  id: string;
  name: string;
  impact: number;
  type: 'positive' | 'negative' | 'neutral';
}

interface CashForecastChartProps {
  data: ForecastWeek[];
  scenarios?: Scenario[];
  monthlyBurn: number;
  trueCash: number;
  dangerThreshold?: number;
}

export function CashForecastChart({
  data,
  scenarios = [],
  monthlyBurn,
  trueCash,
  dangerThreshold
}: CashForecastChartProps) {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  
  // Calculate threshold (2 months of costs)
  const threshold = dangerThreshold ?? monthlyBurn * 2;
  
  // Apply scenario to forecast data
  const chartData = data.map(week => {
    const scenario = scenarios.find(s => s.id === activeScenario);
    return {
      ...week,
      withScenario: scenario ? week.projected + scenario.impact : undefined
    };
  });
  
  // Calculate chart bounds
  const allValues = chartData.flatMap(d => [d.projected, d.withScenario]).filter(Boolean) as number[];
  const minValue = Math.min(...allValues, threshold);
  const maxValue = Math.max(...allValues, trueCash);
  const range = maxValue - minValue;
  const padding = range * 0.1;
  const chartMin = Math.max(0, minValue - padding);
  const chartMax = maxValue + padding;
  const chartRange = chartMax - chartMin;
  
  const minProjected = Math.min(...chartData.map(d => d.projected));
  const maxProjected = Math.max(...chartData.map(d => d.projected));
  const goesNegative = minProjected < threshold;
  
  // Convert value to Y position (0 = bottom, 100 = top)
  const toY = (value: number) => ((value - chartMin) / chartRange) * 100;
  
  // Generate SVG path
  const generatePath = (values: number[]) => {
    if (values.length === 0) return '';
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - toY(v);
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };
  
  const projectedPath = generatePath(chartData.map(d => d.projected));
  const scenarioPath = activeScenario 
    ? generatePath(chartData.map(d => d.withScenario || d.projected))
    : '';
  
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}m`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}k`;
    return `£${value.toLocaleString()}`;
  };
  
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          13-Week Cash Forecast
        </h3>
        <p className="text-sm text-gray-500">
          Forecast data not yet available. Your advisor will set this up.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            13-Week Cash Forecast
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Based on {formatCurrency(monthlyBurn)}/month burn rate
          </p>
        </div>
        
        {goesNegative && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4" />
            Drops below safety threshold
          </div>
        )}
      </div>
      
      {/* Scenario Toggles */}
      {scenarios.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveScenario(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeScenario === null
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Base Forecast
          </button>
          {scenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => setActiveScenario(
                activeScenario === scenario.id ? null : scenario.id
              )}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeScenario === scenario.id
                  ? scenario.type === 'positive'
                    ? 'bg-emerald-100 text-emerald-700'
                    : scenario.type === 'negative'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {scenario.type === 'positive' ? '✓' : scenario.type === 'negative' ? '⚠' : '?'}
              {scenario.name}
            </button>
          ))}
        </div>
      )}
      
      {/* Chart */}
      <div className="relative h-64 mb-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-gray-500">
          <span>{formatCurrency(chartMax)}</span>
          <span>{formatCurrency((chartMax + chartMin) / 2)}</span>
          <span>{formatCurrency(chartMin)}</span>
        </div>
        
        {/* Chart area */}
        <div className="absolute left-16 right-0 top-0 bottom-8">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            {/* Danger zone */}
            <rect
              x="0"
              y={100 - toY(threshold)}
              width="100"
              height={toY(threshold)}
              fill="#fef2f2"
            />
            
            {/* Danger line */}
            <line
              x1="0"
              y1={100 - toY(threshold)}
              x2="100"
              y2={100 - toY(threshold)}
              stroke="#ef4444"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map(pct => (
              <line
                key={pct}
                x1="0"
                y1={pct * 100}
                x2="100"
                y2={pct * 100}
                stroke="#e5e7eb"
                strokeWidth="0.3"
              />
            ))}
            
            {/* Scenario line (if active) */}
            {activeScenario && scenarioPath && (
              <path
                d={scenarioPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4,2"
                vectorEffect="non-scaling-stroke"
              />
            )}
            
            {/* Base forecast line */}
            <path
              d={projectedPath}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            
            {/* Data points */}
            {chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * 100;
              const y = 100 - toY(d.projected);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill={d.projected < threshold ? '#ef4444' : '#3b82f6'}
                />
              );
            })}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="absolute left-16 right-0 bottom-0 h-8 flex justify-between text-xs text-gray-500">
          <span>{chartData[0]?.date || 'Week 1'}</span>
          <span>{chartData[Math.floor(chartData.length / 2)]?.date || 'Week 7'}</span>
          <span>{chartData[chartData.length - 1]?.date || 'Week 13'}</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 mb-6">
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-blue-500 rounded" /> Base forecast
        </span>
        {activeScenario && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-emerald-500 rounded" style={{ borderStyle: 'dashed' }} /> With scenario
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 bg-red-400 rounded" style={{ borderStyle: 'dashed' }} /> Safety threshold
        </span>
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(trueCash)}
          </p>
          <p className="text-xs text-gray-500">Starting True Cash</p>
        </div>
        <div className="text-center">
          <p className={`text-2xl font-bold ${minProjected < threshold ? 'text-red-600' : 'text-gray-900'}`}>
            {formatCurrency(minProjected)}
          </p>
          <p className="text-xs text-gray-500">Minimum Projected</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(maxProjected)}
          </p>
          <p className="text-xs text-gray-500">Week 13 Projected</p>
        </div>
      </div>
    </div>
  );
}

export default CashForecastChart;


