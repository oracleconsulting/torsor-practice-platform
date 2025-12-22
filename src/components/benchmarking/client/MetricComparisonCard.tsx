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
  
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `£${val.toLocaleString()}`;
      case 'percent':
        return `${val}%`;
      case 'days':
        return `${val} days`;
      default:
        return val.toLocaleString();
    }
  };
  
  const isGap = higherIsBetter ? clientValue < medianValue : clientValue > medianValue;
  const gapAmount = Math.abs(clientValue - medianValue);
  
  // Calculate position on scale with clean rounding
  const calculateScale = (clientVal: number, p25Val: number, p75Val: number) => {
    const minValue = Math.min(clientVal, p25Val);
    const maxValue = Math.max(clientVal, p75Val);
    const range = maxValue - minValue;
    const padding = range * 0.15;
    
    // Round to nice numbers based on range
    const roundTo = range > 100000 ? 10000 : range > 10000 ? 5000 : 1000;
    
    const scaleMin = Math.floor((minValue - padding) / roundTo) * roundTo;
    const scaleMax = Math.ceil((maxValue + padding) / roundTo) * roundTo;
    
    return { scaleMin, scaleMax };
  };
  
  const { scaleMin, scaleMax } = calculateScale(clientValue, p25, p75);
  const scaleRange = scaleMax - scaleMin;
  
  const clientPosition = ((clientValue - scaleMin) / scaleRange) * 100;
  const medianPosition = ((medianValue - scaleMin) / scaleRange) * 100;
  const p25Position = ((p25 - scaleMin) / scaleRange) * 100;
  const p75Position = ((p75 - scaleMin) / scaleRange) * 100;

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
        {isGap && annualImpact && annualImpact > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Impact</p>
            <p className="text-lg font-semibold text-rose-600">
              £{annualImpact.toLocaleString()}
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
          <span>P25: {formatValue(p25)}</span>
          <span>Median: {formatValue(medianValue)}</span>
          <span>P75: {formatValue(p75)}</span>
          <span>{formatValue(Math.round(scaleMax))}</span>
        </div>
      </div>
      
      {/* Comparison Text */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{formatValue(clientValue)}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Your Value</p>
        </div>
        
        <ArrowRight className="w-6 h-6 text-slate-400" />
        
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-600">{formatValue(medianValue)}</p>
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

