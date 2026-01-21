'use client';

import { 
  TrendingUp, 
  TrendingDown,
  PlusCircle, 
  AlertTriangle, 
  Edit3,
  Calendar
} from 'lucide-react';
import type { MAScenario, CashForecastDataPoint } from '../../../types/ma-dashboard';

interface CashForecastSectionProps {
  forecastData: CashForecastDataPoint[];
  scenarios: MAScenario[];
  activeScenario: string | null;
  onScenarioChange: (scenarioId: string | null) => void;
  monthlyBurn: number;
  currentCash?: number;
  forecastType?: '13-week' | '6-month';
  editMode?: boolean;
  onEdit?: () => void;
  onAddScenario?: () => void;
}

export function CashForecastSection({
  forecastData,
  scenarios,
  activeScenario,
  onScenarioChange,
  monthlyBurn,
  currentCash: _currentCash,
  forecastType = '13-week',
  editMode,
  onEdit,
  onAddScenario,
}: CashForecastSectionProps) {
  const featuredScenarios = scenarios.filter(s => s.is_featured);
  const activeScenarioData = scenarios.find(s => s.id === activeScenario);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Find warning periods (below 1 month burn)
  const warningPeriods = forecastData.filter(d => {
    const value = activeScenario ? (d[activeScenario] as number) : d.baseline;
    return value < monthlyBurn;
  });
  const hasWarnings = warningPeriods.length > 0;

  // Calculate chart dimensions
  const maxValue = Math.max(
    ...forecastData.map(d => {
      let max = d.baseline;
      scenarios.forEach(s => {
        if (d[s.id] && typeof d[s.id] === 'number') {
          max = Math.max(max, d[s.id] as number);
        }
      });
      return max;
    })
  ) * 1.1;

  const minValue = Math.min(
    ...forecastData.map(d => {
      let min = d.baseline;
      scenarios.forEach(s => {
        if (d[s.id] && typeof d[s.id] === 'number') {
          min = Math.min(min, d[s.id] as number);
        }
      });
      return min;
    }),
    0
  );

  const valueRange = maxValue - minValue;

  const getY = (value: number) => {
    return ((maxValue - value) / valueRange) * 200;
  };

  // Generate path for baseline
  const baselinePath = forecastData.map((d, i) => {
    const x = (i / (forecastData.length - 1)) * 100;
    const y = getY(d.baseline);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate area path for baseline
  const baselineAreaPath = `${baselinePath} L 100 200 L 0 200 Z`;

  // Generate path for active scenario
  const scenarioPath = activeScenario ? forecastData.map((d, i) => {
    const x = (i / (forecastData.length - 1)) * 100;
    const value = d[activeScenario] as number || d.baseline;
    const y = getY(value);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ') : '';

  // Warning line Y position
  const warningLineY = getY(monthlyBurn);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            {forecastType === '13-week' ? '13-Week' : '6-Month'} Cash Forecast
          </h3>
          <p className="text-sm text-slate-500">With scenario modelling</p>
        </div>
        {editMode && onEdit && (
          <button
            onClick={onEdit}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Scenario Toggles */}
      <div className="flex flex-wrap gap-2 mb-6">
        <ScenarioToggle
          label="Base Forecast"
          isActive={activeScenario === null}
          onClick={() => onScenarioChange(null)}
          color="#3b82f6"
        />
        {featuredScenarios.map(scenario => (
          <ScenarioToggle
            key={scenario.id}
            label={scenario.short_label || scenario.name}
            isActive={activeScenario === scenario.id}
            onClick={() => onScenarioChange(scenario.id)}
            color={scenario.scenario_color}
            recommendation={scenario.recommendation}
          />
        ))}
        {editMode && onAddScenario && (
          <button
            onClick={onAddScenario}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-white border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Add Scenario
          </button>
        )}
      </div>

      {/* Chart */}
      <div className="relative h-52 mb-4">
        <svg 
          viewBox="0 0 100 200" 
          preserveAspectRatio="none" 
          className="w-full h-full"
        >
          {/* Grid lines */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" strokeWidth="0.5" />
          <line x1="0" y1="100" x2="100" y2="100" stroke="#f1f5f9" strokeWidth="0.5" />
          <line x1="0" y1="150" x2="100" y2="150" stroke="#f1f5f9" strokeWidth="0.5" />
          
          {/* Warning line - 1 month costs */}
          <line 
            x1="0" 
            y1={warningLineY} 
            x2="100" 
            y2={warningLineY} 
            stroke="#ef4444" 
            strokeWidth="0.5" 
            strokeDasharray="2 2"
          />
          
          {/* Baseline area */}
          <path
            d={baselineAreaPath}
            fill="url(#baselineGradient)"
            opacity={activeScenario ? 0.3 : 0.6}
          />
          
          {/* Baseline line */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1"
            opacity={activeScenario ? 0.5 : 1}
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Scenario line */}
          {activeScenario && scenarioPath && (
            <path
              d={scenarioPath}
              fill="none"
              stroke={activeScenarioData?.scenario_color || '#10b981'}
              strokeWidth="1.5"
              strokeDasharray="4 2"
              vectorEffect="non-scaling-stroke"
            />
          )}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 -ml-2 flex flex-col justify-between text-xs text-slate-400 pointer-events-none">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency((maxValue + minValue) / 2)}</span>
          <span>{formatCurrency(minValue)}</span>
        </div>

        {/* Warning label */}
        <div 
          className="absolute right-0 text-xs text-red-500 font-medium pointer-events-none"
          style={{ top: `${(warningLineY / 200) * 100}%`, transform: 'translateY(-50%)' }}
        >
          1 month costs
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-slate-400 px-2 mb-4">
        {forecastData.filter((_, i) => i % Math.ceil(forecastData.length / 5) === 0 || i === forecastData.length - 1).map((d, i) => (
          <span key={i}>{d.period}</span>
        ))}
      </div>

      {/* Warning Banner */}
      {hasWarnings && !activeScenario && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900">Cash Warning</h4>
            <p className="text-sm text-red-700">
              {warningPeriods.length} period{warningPeriods.length > 1 ? 's' : ''} projected 
              below minimum operating cash. First warning: {warningPeriods[0]?.period}.
            </p>
          </div>
        </div>
      )}

      {/* Scenario Impact Card */}
      {activeScenarioData && (
        <ScenarioImpactCard scenario={activeScenarioData} />
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500 rounded" />
          <span className="text-slate-600">Base forecast</span>
        </div>
        {activeScenarioData && (
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-0.5 rounded" 
              style={{ 
                backgroundColor: activeScenarioData.scenario_color,
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)'
              }} 
            />
            <span className="text-slate-600">{activeScenarioData.short_label || activeScenarioData.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// SCENARIO TOGGLE BUTTON
// ============================================

interface ScenarioToggleProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  color: string;
  recommendation?: 'positive' | 'warning' | 'neutral';
}

function ScenarioToggle({ label, isActive, onClick, color, recommendation }: ScenarioToggleProps) {
  const icon = recommendation === 'positive' ? '✓' : recommendation === 'warning' ? '⚠' : null;
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
        isActive 
          ? 'text-white shadow-md' 
          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
      style={isActive ? { backgroundColor: color } : undefined}
    >
      {icon && <span>{icon}</span>}
      {label}
    </button>
  );
}

// ============================================
// SCENARIO IMPACT CARD
// ============================================

interface ScenarioImpactCardProps {
  scenario: MAScenario;
}

function ScenarioImpactCard({ scenario }: ScenarioImpactCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
    }).format(Math.abs(value));

  const isPositive = (scenario.impact_on_cash || 0) > 0;
  
  return (
    <div className={`mt-4 p-4 rounded-lg border ${
      isPositive 
        ? 'bg-emerald-50 border-emerald-200' 
        : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isPositive ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <h4 className={`font-semibold ${isPositive ? 'text-emerald-900' : 'text-amber-900'}`}>
              {scenario.short_label || scenario.name}
            </h4>
            {scenario.impact_summary && (
              <p className={`text-sm mt-1 ${isPositive ? 'text-emerald-700' : 'text-amber-700'}`}>
                {scenario.impact_summary}
              </p>
            )}
          </div>
        </div>
        
        <div className="text-right">
          {scenario.impact_on_cash !== undefined && (
            <div className={`text-lg font-bold ${isPositive ? 'text-emerald-700' : 'text-amber-700'}`}>
              {isPositive ? '+' : '-'}{formatCurrency(scenario.impact_on_cash)}
            </div>
          )}
          {scenario.impact_on_runway !== undefined && (
            <div className={`text-sm ${isPositive ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isPositive ? '+' : ''}{scenario.impact_on_runway.toFixed(1)} months runway
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

