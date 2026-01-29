import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricComparisonProps {
  metricName: string;
  clientValue: number;
  medianValue: number;
  p25: number;
  p75: number;
  percentile: number;
  format: 'currency' | 'percent' | 'number' | 'days';
  higherIsBetter: boolean;
  annualImpact?: number;
}

export function MetricComparisonCard({
  metricName,
  clientValue,
  medianValue,
  p25,
  p75,
  percentile,
  format,
  higherIsBetter,
  annualImpact
}: MetricComparisonProps) {
  
  const formatValue = (val: number | null | undefined) => {
    // Defensive null check
    const safeVal = val ?? 0;
    switch (format) {
      case 'currency':
        return `£${safeVal.toLocaleString()}`;
      case 'percent':
        return `${safeVal}%`;
      case 'days':
        return `${safeVal} days`;
      default:
        return safeVal.toLocaleString();
    }
  };
  
  // Defensive null checks for calculations
  const safeClientValue = clientValue ?? 0;
  const safeMedianValue = medianValue ?? 0;
  const safeP25 = p25 ?? 0;
  const safeP75 = p75 ?? 0;
  
  const isGap = higherIsBetter ? safeClientValue < safeMedianValue : safeClientValue > safeMedianValue;
  const gapAmount = Math.abs(safeClientValue - safeMedianValue);
  
  // Calculate position on scale with clean rounding based on format
  const calculateScale = (clientVal: number, p25Val: number, p75Val: number, fmt: string) => {
    const minValue = Math.min(clientVal, p25Val);
    const maxValue = Math.max(clientVal, p75Val);
    const range = maxValue - minValue;
    const padding = range * 0.15;
    
    // Different rounding for different formats
    let roundTo: number;
    if (fmt === 'percent') {
      // For percentages, round to 5 or 10
      roundTo = range > 50 ? 10 : 5;
    } else if (fmt === 'days') {
      // For days, round to 5 or 10
      roundTo = range > 50 ? 10 : 5;
    } else {
      // For currency/numbers, round based on magnitude
      roundTo = range > 100000 ? 10000 : range > 10000 ? 5000 : range > 1000 ? 500 : 100;
    }
    
    let scaleMin = Math.floor((minValue - padding) / roundTo) * roundTo;
    let scaleMax = Math.ceil((maxValue + padding) / roundTo) * roundTo;
    
    // Ensure minimum is 0 for percentages and days (can't be negative)
    if ((fmt === 'percent' || fmt === 'days') && scaleMin < 0) {
      scaleMin = 0;
    }
    
    // Cap percentage scales at sensible values
    if (fmt === 'percent' && scaleMax > 100 && maxValue <= 100) {
      scaleMax = 100;
    }
    
    return { scaleMin, scaleMax };
  };
  
  const { scaleMin, scaleMax } = calculateScale(safeClientValue, safeP25, safeP75, format);
  const scaleRange = scaleMax - scaleMin || 1; // Prevent division by zero
  
  const clientPosition = ((safeClientValue - scaleMin) / scaleRange) * 100;
  const medianPosition = ((safeMedianValue - scaleMin) / scaleRange) * 100;
  const p25Position = ((safeP25 - scaleMin) / scaleRange) * 100;
  const p75Position = ((safeP75 - scaleMin) / scaleRange) * 100;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{metricName}</h3>
          <p className="text-sm text-slate-500">
            {percentile}th percentile
          </p>
        </div>
        {isGap && annualImpact != null && annualImpact > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Impact</p>
            <p className="text-lg font-semibold text-rose-600">
              £{(annualImpact ?? 0).toLocaleString()}
            </p>
          </div>
        )}
      </div>
      
      {/* Visual Comparison */}
      <div className="relative mb-6">
        {/* Scale Background */}
        <div className="h-12 bg-slate-100 rounded-lg relative overflow-hidden">
          {/* Interquartile Range (P25-P75) */}
          <div 
            className="absolute inset-y-0 bg-slate-200"
            style={{ 
              left: `${p25Position}%`, 
              width: `${p75Position - p25Position}%` 
            }}
          />
          
          {/* Median Line */}
          <div 
            className="absolute inset-y-0 w-0.5 bg-slate-400"
            style={{ left: `${medianPosition}%` }}
          />
          
          {/* Client Value Marker */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
            style={{ left: `${clientPosition}%` }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
              isGap ? 'bg-rose-500' : 'bg-emerald-500'
            }`}>
              {isGap ? (
                <TrendingDown className="w-5 h-5 text-white" />
              ) : (
                <TrendingUp className="w-5 h-5 text-white" />
              )}
            </div>
          </div>
        </div>
        
        {/* Scale Labels */}
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{formatValue(Math.round(scaleMin))}</span>
          <span>P25: {formatValue(safeP25)}</span>
          <span>Median: {formatValue(safeMedianValue)}</span>
          <span>P75: {formatValue(safeP75)}</span>
          <span>{formatValue(Math.round(scaleMax))}</span>
        </div>
      </div>
      
      {/* Comparison Text */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{formatValue(safeClientValue)}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Your Value</p>
        </div>
        
        <ArrowRight className="w-6 h-6 text-slate-400" />
        
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-600">{formatValue(safeMedianValue)}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Median</p>
        </div>
        
        <ArrowRight className="w-6 h-6 text-slate-400" />
        
        <div className="text-center">
          <p className={`text-2xl font-bold ${isGap ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isGap ? '-' : '+'}{formatValue(gapAmount)}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">
            {isGap ? 'Gap' : 'Advantage'}
          </p>
        </div>
      </div>
    </div>
  );
}

