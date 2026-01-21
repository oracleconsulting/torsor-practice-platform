/**
 * Cash Forecast Section
 * 13-week cash forecast with scenario toggles
 * Foresight+ tiers only
 */

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, Settings } from 'lucide-react';
import type { BIScenario, BICashForecast, BICashForecastPeriod, RAGStatus } from '../../types/business-intelligence';

interface CashForecastSectionProps {
  periodId: string;
  scenarios: BIScenario[];
  activeScenario: string | null;
  onScenarioChange: (scenarioId: string | null) => void;
  editable?: boolean;
}

export function CashForecastSection({
  periodId,
  scenarios,
  activeScenario,
  onScenarioChange,
  editable
}: CashForecastSectionProps) {
  
  const [forecast, setForecast] = useState<BICashForecast | null>(null);
  const [forecastPeriods, setForecastPeriods] = useState<BICashForecastPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load forecast data
  useEffect(() => {
    loadForecast();
  }, [periodId]);
  
  async function loadForecast() {
    setLoading(true);
    try {
      // Get forecast
      const { data: fcData } = await supabase
        .from('bi_cash_forecasts')
        .select('*')
        .eq('period_id', periodId)
        .eq('forecast_type', '13_week')
        .single();
      
      if (fcData) {
        setForecast(fcData);
        
        // Get periods
        const { data: periodData } = await supabase
          .from('bi_cash_forecast_periods')
          .select('*')
          .eq('forecast_id', fcData.id)
          .order('period_number', { ascending: true });
        
        setForecastPeriods(periodData || []);
      }
    } catch (err) {
      console.error('[CashForecastSection] Load error:', err);
    } finally {
      setLoading(false);
    }
  }
  
  // Featured scenarios for toggle buttons
  const featuredScenarios = scenarios.filter(s => s.is_featured);
  
  // Get RAG color
  const getRagColor = (rag: RAGStatus | null) => {
    switch (rag) {
      case 'red': return 'bg-red-500';
      case 'amber': return 'bg-amber-400';
      case 'green': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };
  
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (absValue >= 1000) {
      return `${sign}£${(absValue / 1000).toFixed(0)}k`;
    }
    return `${sign}£${absValue.toFixed(0)}`;
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (!forecast || forecastPeriods.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">13-Week Cash Forecast</h3>
        <p className="text-gray-500">No forecast data available yet.</p>
        {editable && (
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Generate Forecast
          </button>
        )}
      </div>
    );
  }
  
  // Find lowest point and warning weeks
  const lowestCash = Math.min(...forecastPeriods.map(p => p.closing_true_cash || 0));
  const lowestWeek = forecastPeriods.find(p => p.closing_true_cash === lowestCash);
  const warningWeeks = forecastPeriods.filter(p => p.rag_status === 'red' || p.rag_status === 'amber');
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">13-Week Cash Forecast</h3>
          <p className="text-sm text-gray-500">True Cash projection with scenario modelling</p>
        </div>
        {editable && (
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Warning Banner */}
      {warningWeeks.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-amber-800">
            <strong>{warningWeeks.length} week{warningWeeks.length !== 1 ? 's' : ''}</strong> with cash below safe threshold
          </span>
        </div>
      )}
      
      {/* Scenario Toggles */}
      {featuredScenarios.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => onScenarioChange(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeScenario
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Baseline
          </button>
          {featuredScenarios.map(scenario => (
            <button
              key={scenario.id}
              onClick={() => onScenarioChange(scenario.id === activeScenario ? null : scenario.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeScenario === scenario.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {scenario.short_label || scenario.name}
            </button>
          ))}
        </div>
      )}
      
      {/* Mini Chart */}
      <div className="relative h-32 mb-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-400">
          <span>{formatCurrency(Math.max(...forecastPeriods.map(p => p.closing_true_cash || 0)))}</span>
          <span>£0</span>
          <span>{formatCurrency(lowestCash)}</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-14 h-full flex items-end gap-1">
          {forecastPeriods.map((period) => {
            const maxCash = Math.max(...forecastPeriods.map(p => p.closing_true_cash || 0), 1);
            const minCash = Math.min(...forecastPeriods.map(p => p.closing_true_cash || 0), 0);
            const range = maxCash - minCash;
            
            // Get the value to display (scenario variant or baseline)
            let displayValue = period.closing_true_cash || 0;
            if (activeScenario && period.scenario_variants?.[activeScenario]) {
              displayValue = period.scenario_variants[activeScenario].closing_true_cash;
            }
            
            const height = range > 0 ? ((displayValue - minCash) / range) * 100 : 50;
            const ragStatus = activeScenario && period.scenario_variants?.[activeScenario]
              ? period.scenario_variants[activeScenario].rag_status
              : period.rag_status;
            
            return (
              <div 
                key={period.id}
                className="flex-1 flex flex-col items-center group relative"
              >
                <div 
                  className={`w-full rounded-t transition-all duration-300 ${getRagColor(ragStatus)}`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    <div className="font-medium">{period.period_label || `Week ${period.period_number}`}</div>
                    <div>{formatCurrency(displayValue)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Key Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <div className="text-sm text-gray-500">Lowest Point</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(lowestCash)}
          </div>
          <div className="text-xs text-gray-400">
            {lowestWeek?.period_label || `Week ${lowestWeek?.period_number}`}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">End of Forecast</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(forecastPeriods[forecastPeriods.length - 1]?.closing_true_cash || 0)}
          </div>
          <div className="text-xs text-gray-400">
            {forecastPeriods[forecastPeriods.length - 1]?.period_label || 'Week 13'}
          </div>
        </div>
      </div>
      
      {/* Active Scenario Impact */}
      {activeScenario && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Scenario Impact: {featuredScenarios.find(s => s.id === activeScenario)?.name}
          </div>
          <p className="text-sm text-gray-500">
            {featuredScenarios.find(s => s.id === activeScenario)?.impact_summary || 'No impact summary available'}
          </p>
        </div>
      )}
    </div>
  );
}

