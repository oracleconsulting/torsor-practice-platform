import { useState, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, ZoomIn, ZoomOut } from 'lucide-react';

interface DataPoint {
  week: string;
  amount: number;
  label?: string;
  events?: string[];
}

interface CriticalPeriod {
  week: string;
  date?: string;
  event: string;
  lowestPoint: number;
  action?: string;
}

interface CashFlowForecastProps {
  weeks?: number;
  dataPoints?: DataPoint[];
  criticalPeriods?: CriticalPeriod[];
  currentCash?: number;
  showInteractive?: boolean;
}

export function CashFlowForecast({ 
  weeks = 13, 
  dataPoints,
  criticalPeriods = [],
  currentCash = 46920,
  showInteractive = true
}: CashFlowForecastProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<'all' | '6week' | '4week'>('all');
  
  // Generate sample data if not provided
  const sampleData: DataPoint[] = useMemo(() => {
    if (dataPoints) return dataPoints;
    
    // Generate realistic looking forecast data
    const baseAmount = currentCash;
    return Array.from({ length: weeks }, (_, i) => {
      // Create realistic fluctuations
      let amount = baseAmount;
      
      // Week 1-3: Small decline (typical month-end expenses)
      if (i <= 2) amount = baseAmount - (i * 3500);
      
      // Week 4-5: Recovery from payments in
      else if (i <= 4) amount = baseAmount + (5000 * (i - 2));
      
      // Week 6-7: VAT/PAYE collision (critical dip)
      else if (i <= 6) amount = 18370 + ((i - 5) * 2000);
      
      // Week 8-10: Strong recovery
      else if (i <= 9) amount = 25000 + ((i - 7) * 12000);
      
      // Week 11-13: Stabilize higher
      else amount = 55000 + ((i - 10) * 5000);
      
      const events: string[] = [];
      if (i === 0) events.push('VAT payment');
      if (i === 3) events.push('Quarterly receipts');
      if (i === 5) events.push('VAT + Payroll collision');
      if (i === 8) events.push('Major invoice payment');
      
      return {
        week: `W${i + 1}`,
        label: i === 0 ? 'Now' : i === 5 ? 'Watch' : undefined,
        amount,
        events
      };
    });
  }, [dataPoints, currentCash, weeks]);
  
  const defaultCriticalPeriods: CriticalPeriod[] = criticalPeriods.length > 0 ? criticalPeriods : [
    {
      week: 'W6',
      date: 'Feb 24',
      event: 'VAT + Payroll collision',
      lowestPoint: 18370,
      action: 'Accelerate debtor collection before this date'
    }
  ];
  
  // Get visible data based on zoom level
  const visibleData = useMemo(() => {
    switch (zoomLevel) {
      case '4week': return sampleData.slice(0, 4);
      case '6week': return sampleData.slice(0, 6);
      default: return sampleData;
    }
  }, [sampleData, zoomLevel]);
  
  const maxAmount = Math.max(...visibleData.map(d => d.amount));
  const minAmount = Math.min(...visibleData.map(d => d.amount));
  const range = maxAmount - minAmount || 1;
  
  // Thresholds for coloring
  const dangerThreshold = minAmount + (range * 0.2);
  const warningThreshold = minAmount + (range * 0.4);
  
  const formatCurrency = (amount: number) => `£${amount.toLocaleString()}`;
  
  const getBarColor = (amount: number) => {
    if (amount <= dangerThreshold) return 'from-red-500 to-red-400';
    if (amount <= warningThreshold) return 'from-amber-500 to-amber-400';
    return 'from-emerald-500 to-emerald-400';
  };
  
  const getBarBg = (amount: number) => {
    if (amount <= dangerThreshold) return 'bg-red-500/20';
    if (amount <= warningThreshold) return 'bg-amber-500/20';
    return 'bg-emerald-500/20';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Your Cash Over the Next {weeks} Weeks
            </h3>
            <p className="text-blue-100 text-sm mt-1">
              See ahead. Act before problems become crises.
            </p>
          </div>
          {showInteractive && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel('4week')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  zoomLevel === '4week' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                4W
              </button>
              <button
                onClick={() => setZoomLevel('6week')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  zoomLevel === '6week' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                6W
              </button>
              <button
                onClick={() => setZoomLevel('all')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  zoomLevel === 'all' ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                All
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {/* Chart Area */}
        <div className="relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-500">
            <span>{formatCurrency(maxAmount)}</span>
            <span>{formatCurrency(Math.round((maxAmount + minAmount) / 2))}</span>
            <span>{formatCurrency(minAmount)}</span>
          </div>
          
          {/* Chart */}
          <div className="ml-20 mr-4">
            {/* Grid lines */}
            <div className="absolute inset-0 ml-20 mr-4" style={{ top: 0, bottom: 32 }}>
              <div className="h-1/3 border-b border-dashed border-slate-200" />
              <div className="h-1/3 border-b border-dashed border-slate-200" />
            </div>
            
            {/* Bars */}
            <div className="h-64 flex items-end gap-1 relative z-10">
              {visibleData.map((point, i) => {
                const height = ((point.amount - minAmount) / range) * 100;
                const isCritical = defaultCriticalPeriods.some(c => c.week === point.week);
                const isHovered = hoveredWeek === i;
                
                return (
                  <div 
                    key={i} 
                    className="flex-1 flex flex-col items-center justify-end h-full"
                    onMouseEnter={() => setHoveredWeek(i)}
                    onMouseLeave={() => setHoveredWeek(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-16 transform -translate-x-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-20 whitespace-nowrap">
                        <p className="font-semibold">{formatCurrency(point.amount)}</p>
                        {point.events && point.events.length > 0 && (
                          <p className="text-slate-300 text-xs">{point.events.join(', ')}</p>
                        )}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900" />
                      </div>
                    )}
                    
                    {/* Bar */}
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer ${
                        isHovered ? 'scale-105' : ''
                      } ${isCritical ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    >
                      <div 
                        className={`w-full h-full rounded-t-lg bg-gradient-to-t ${getBarColor(point.amount)} ${
                          isHovered ? 'shadow-lg' : ''
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* X-axis labels */}
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              {visibleData.map((point, i) => (
                <div key={i} className="flex-1 text-center">
                  <span className={`${point.label ? 'font-semibold text-slate-700' : ''}`}>
                    {point.label || point.week}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-emerald-400" />
            <span className="text-slate-600">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-amber-400" />
            <span className="text-slate-600">Watch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-red-500 to-red-400" />
            <span className="text-slate-600">Critical</span>
          </div>
        </div>
        
        {/* Critical Period Alerts */}
        {defaultCriticalPeriods.map((critical, i) => (
          <div 
            key={i}
            className="mt-6 flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-xl"
          >
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">
                WATCH: {critical.date ? `Week of ${critical.date}` : critical.week}
              </p>
              <p className="text-red-700 mt-1">
                {critical.event} — cash drops to {formatCurrency(critical.lowestPoint)}
              </p>
              {critical.action && (
                <p className="text-amber-700 mt-2 font-medium text-sm">
                  ➤ Action: {critical.action}
                </p>
              )}
            </div>
          </div>
        ))}
        
        {/* Key Insight */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-blue-800 text-sm">
            <strong>Why this matters:</strong> Without this visibility, you'd see £{currentCash.toLocaleString()} in 
            the bank and think you're fine. This forecast shows you what's actually coming — giving you 
            {weeks > 10 ? ' 6 weeks' : ' time'} to act before cash gets tight.
          </p>
        </div>
      </div>
    </div>
  );
}

export default CashFlowForecast;


