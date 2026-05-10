// Utility to get correct ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
const getOrdinalSuffix = (n: number): string => {
  const num = Math.round(n);
  if (num % 100 >= 11 && num % 100 <= 13) {
    return num + 'th';
  }
  switch (num % 10) {
    case 1: return num + 'st';
    case 2: return num + 'nd';
    case 3: return num + 'rd';
    default: return num + 'th';
  }
};

const fmtCurrency = (v: number | undefined | null): string => {
  if (v == null || v === 0) return '—';
  if (v >= 1000000) return `£${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `£${Math.round(v / 1000).toLocaleString()}k`;
  return `£${v.toLocaleString()}`;
};

interface PreRevenueHeroData {
  targetExitValuation?: number;
  defensiblePreMoney?: number;
  targetArr?: number;
  investmentReadinessScore?: number;
}

interface HeroSectionProps {
  totalOpportunity: number;
  percentile: number | null | undefined;
  headline: string;
  trend?: 'up' | 'down' | 'neutral';
  isPreRevenue?: boolean;
  preRevenueData?: PreRevenueHeroData;
}

export function HeroSection({ 
  totalOpportunity, 
  percentile, 
  headline,
  isPreRevenue,
  preRevenueData,
}: HeroSectionProps) {
  
  // Defensive null checks
  const safeOpportunity = totalOpportunity ?? 0;
  const safePercentile = percentile ?? 50;
  const hasValidPercentile = percentile != null && percentile > 0;
  
  const getPercentileColor = (p: number) => {
    if (p >= 75) return 'text-emerald-600';
    if (p >= 50) return 'text-blue-600';
    if (p >= 25) return 'text-amber-600';
    return 'text-rose-600';
  };
  
  const getPercentileLabel = (p: number) => {
    if (p >= 75) return 'Top Quartile';
    if (p >= 50) return 'Above Median';
    if (p >= 25) return 'Below Median';
    return 'Bottom Quartile';
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="relative z-10">
        {/* Main Number */}
        <div className="text-center">
          <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">
            {isPreRevenue ? 'Target Exit Valuation' : 'Annual Opportunity Identified'}
          </p>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            {isPreRevenue ? fmtCurrency(preRevenueData?.targetExitValuation) : `£${safeOpportunity.toLocaleString()}`}
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            {headline}
          </p>
        </div>

        {isPreRevenue && preRevenueData ? (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Defensible Pre-Money</p>
              <p className="text-2xl font-bold text-blue-400">{fmtCurrency(preRevenueData.defensiblePreMoney)}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Target ARR</p>
              <p className="text-2xl font-bold text-emerald-400">
                {preRevenueData.targetArr ? fmtCurrency(preRevenueData.targetArr) : 'Pre-revenue'}
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Investment Readiness</p>
              <p className="text-2xl font-bold text-purple-400">
                {preRevenueData.investmentReadinessScore != null ? `${preRevenueData.investmentReadinessScore}/100` : '—'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-10">
            <div className="max-w-xl mx-auto">
              {/* Gauge Track */}
              <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                {/* Quartile Markers */}
                <div className="absolute inset-0 flex">
                  <div className="w-1/4 border-r border-slate-600" />
                  <div className="w-1/4 border-r border-slate-600" />
                  <div className="w-1/4 border-r border-slate-600" />
                  <div className="w-1/4" />
                </div>
                
                {/* Position Indicator */}
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${safePercentile}%` }}
                />
                
                {/* Current Position Marker */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-1000"
                  style={{ left: `${safePercentile}%` }}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-lg border-2 border-slate-900" />
                </div>
              </div>
              
              {/* Labels */}
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>0</span>
                <span>25th</span>
                <span>50th</span>
                <span>75th</span>
                <span>100</span>
              </div>
              
              {/* Current Position Label */}
              <div className="text-center mt-4">
                {hasValidPercentile ? (
                  <>
                    <span className={`text-lg font-semibold ${getPercentileColor(safePercentile)}`}>
                      {getOrdinalSuffix(safePercentile)} Percentile
                    </span>
                    <span className="text-slate-400 ml-2">
                      · {getPercentileLabel(safePercentile)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg text-slate-400">
                    Percentile data not available
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

