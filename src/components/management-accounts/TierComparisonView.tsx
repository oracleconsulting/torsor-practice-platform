'use client';

import { useState, useMemo } from 'react';
import { 
  Check, 
  X, 
  Calculator,
  FileText,
  Zap,
  BarChart3,
} from 'lucide-react';

interface TierComparisonProps {
  // From assessment/pass1
  clientData: {
    annualRevenue?: number;
    tuesdayQuestion: string;
    upcomingDecisions: string[];
    painPoints: Array<{ title: string; estimatedCost: number | null }>;
    scenarioInterests: string[];
    desiredFrequency: 'monthly' | 'quarterly';
    recommendedTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  };
  // For ROI calculations
  financialContext: {
    recentMistakeCost?: number;
    pendingDecisionValue?: number;
    cashCrisisHistory?: boolean;
    unprofitableClientSuspected?: boolean;
    estimatedMarginLeakage?: number;
  };
  onTierSelect: (tier: string) => void;
}

// Tier definitions
const tiers = {
  bronze: {
    name: 'Bronze',
    monthlyPrice: 750,
    quarterlyPrice: 2000,
    tagline: "You see what's happening",
    color: 'amber',
    features: {
      coreReports: true,
      trueCash: true,
      kpiDashboard: '3 metrics',
      varianceCommentary: true,
      tuesdayQuestion: true,
      keyInsights: '3',
      decisionSupport: false,
      trendAnalysis: false,
      watchList: false,
      reviewCall: false,
      cashForecast: false,
      scenarios: false,
      clientProfitability: false,
      weeklyFlash: false,
      benchmarking: false,
    }
  },
  silver: {
    name: 'Silver',
    monthlyPrice: 1500,
    quarterlyPrice: 4000,
    tagline: 'You know what to do',
    color: 'slate',
    features: {
      coreReports: true,
      trueCash: true,
      kpiDashboard: '5 metrics',
      varianceCommentary: true,
      tuesdayQuestion: true,
      keyInsights: '5',
      decisionSupport: true,
      trendAnalysis: '6-month',
      watchList: true,
      reviewCall: '30 mins',
      cashForecast: false,
      scenarios: false,
      clientProfitability: false,
      weeklyFlash: false,
      benchmarking: false,
    }
  },
  gold: {
    name: 'Gold',
    monthlyPrice: 3000,
    quarterlyPrice: 7500,
    tagline: 'You see ahead',
    color: 'yellow',
    features: {
      coreReports: true,
      trueCash: true,
      kpiDashboard: '8 metrics',
      varianceCommentary: true,
      tuesdayQuestion: true,
      keyInsights: '7',
      decisionSupport: true,
      trendAnalysis: '12-month',
      watchList: true,
      reviewCall: '45 mins',
      cashForecast: '13-week rolling',
      scenarios: '3 pre-built',
      clientProfitability: true,
      weeklyFlash: false,
      benchmarking: false,
    }
  },
  platinum: {
    name: 'Platinum',
    monthlyPrice: 5000,
    quarterlyPrice: null, // Not available quarterly
    tagline: 'Board-level visibility',
    color: 'purple',
    features: {
      coreReports: true,
      trueCash: true,
      kpiDashboard: 'Custom',
      varianceCommentary: true,
      tuesdayQuestion: true,
      keyInsights: 'Unlimited',
      decisionSupport: true,
      trendAnalysis: '12-month',
      watchList: true,
      reviewCall: 'Fortnightly',
      cashForecast: '13-week + weekly updates',
      scenarios: 'Unlimited',
      clientProfitability: true,
      weeklyFlash: true,
      benchmarking: true,
    }
  }
};

type TierKey = keyof typeof tiers;

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function TierComparisonView({ 
  clientData, 
  financialContext, 
  onTierSelect 
}: TierComparisonProps) {
  const [selectedTier, setSelectedTier] = useState<string>(clientData.recommendedTier);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly'>(clientData.desiredFrequency);
  const isMonthly = frequency === 'monthly';
  
  // Calculate ROI for each tier based on client's specific situation
  const calculateROI = useMemo(() => {
    return (tierId: string) => {
      const tier = tiers[tierId as TierKey];
      
      // Calculate annual cost based on frequency
      const annualCost = isMonthly 
        ? tier.monthlyPrice * 12 
        : (tier.quarterlyPrice || 0) * 4;
      
      // If no price for this frequency (e.g., Platinum quarterly), return null
      if (annualCost === 0) return null;
      
      let potentialSavings = 0;
      const savingsBreakdown: Array<{ item: string; value: number; applies: boolean }> = [];
      
      // Frequency multiplier - monthly catches issues faster
      const frequencyMultiplier = isMonthly ? 1.0 : 0.75;
      
      // 1. Avoided bad decisions (all tiers help somewhat)
      if (financialContext.pendingDecisionValue) {
        const decisionValue = financialContext.pendingDecisionValue;
        const improvementRate = tierId === 'bronze' ? 0.2 : 
                                tierId === 'silver' ? 0.4 : 
                                tierId === 'gold' ? 0.7 : 0.8;
        const saving = decisionValue * 0.15 * improvementRate * frequencyMultiplier;
        savingsBreakdown.push({
          item: 'Better hiring/investment decisions',
          value: Math.round(saving),
          applies: true
        });
        potentialSavings += saving;
      }
      
      // 2. Cash crisis prevention (needs forecasting - Gold+)
      if (financialContext.cashCrisisHistory) {
        const crisisCost = 15000;
        const hasForecast = tier.features.cashForecast !== false;
        const effectiveValue = hasForecast ? (isMonthly ? crisisCost : crisisCost * 0.6) : 0;
        savingsBreakdown.push({
          item: isMonthly ? 'Cash crisis prevention (13-week forecast)' : 'Cash crisis prevention (6-month outlook)',
          value: Math.round(effectiveValue),
          applies: hasForecast
        });
        if (hasForecast) potentialSavings += effectiveValue;
      }
      
      // 3. Client profitability - exit/fix unprofitable clients (Gold+)
      if (financialContext.unprofitableClientSuspected) {
        const leakage = financialContext.estimatedMarginLeakage || 20000;
        const applies = tier.features.clientProfitability === true;
        savingsBreakdown.push({
          item: 'Fix/exit unprofitable clients',
          value: applies ? leakage : 0,
          applies
        });
        if (applies) potentialSavings += leakage;
      }
      
      // 4. Opportunity cost recovery (needs scenarios - Gold+)
      if (financialContext.recentMistakeCost) {
        const hasScenarios = tier.features.scenarios !== false;
        const recoveryRate = tierId === 'gold' ? 0.5 : tierId === 'platinum' ? 0.7 : 0;
        const saving = financialContext.recentMistakeCost * recoveryRate * frequencyMultiplier;
        savingsBreakdown.push({
          item: 'Avoid missed opportunities (scenario modelling)',
          value: Math.round(saving),
          applies: hasScenarios
        });
        if (hasScenarios) potentialSavings += saving;
      }
      
      // 5. Decision speed (Silver+ with calls)
      if (tier.features.reviewCall) {
        const baseValue = tierId === 'silver' ? 5000 : 
                          tierId === 'gold' ? 8000 : 12000;
        const timeSaving = baseValue * (isMonthly ? 1 : 0.5);
        savingsBreakdown.push({
          item: `Faster decision-making (${isMonthly ? 'monthly' : 'quarterly'} calls)`,
          value: Math.round(timeSaving),
          applies: true
        });
        potentialSavings += timeSaving;
      }
      
      // 6. Reduced anxiety / time saved (all tiers)
      const anxietySaving = isMonthly ? 3000 : 1500;
      savingsBreakdown.push({
        item: 'Time saved & reduced financial anxiety',
        value: anxietySaving,
        applies: true
      });
      potentialSavings += anxietySaving;
      
      const roi = ((potentialSavings - annualCost) / annualCost) * 100;
      const paybackMonths = potentialSavings > 0 
        ? Math.ceil(annualCost / (potentialSavings / 12))
        : null;
      
      return {
        annualCost,
        potentialSavings: Math.round(potentialSavings),
        netBenefit: Math.round(potentialSavings - annualCost),
        roi: Math.round(roi),
        paybackMonths,
        breakdown: savingsBreakdown,
        frequency: isMonthly ? 'monthly' : 'quarterly'
      };
    };
  }, [financialContext, isMonthly]);
  
  const availableTiers = Object.entries(tiers).filter(([id]) => isMonthly || id !== 'platinum');
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">Compare Your Options</h2>
        <p className="text-slate-600 mt-2">
          See what each tier delivers and the return on your investment
        </p>
      </div>
      
      {/* Frequency Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setFrequency('monthly')}
            className={cn(
              "px-6 py-2 rounded-md text-sm font-medium transition-all",
              frequency === 'monthly'
                ? "bg-white text-slate-900 shadow"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Monthly Reporting
          </button>
          <button
            onClick={() => setFrequency('quarterly')}
            className={cn(
              "px-6 py-2 rounded-md text-sm font-medium transition-all",
              frequency === 'quarterly'
                ? "bg-white text-slate-900 shadow"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Quarterly Reporting
          </button>
        </div>
      </div>
      
      {/* Frequency Description */}
      <div className="text-center text-sm text-slate-500">
        {isMonthly ? (
          <p>Monthly reporting with 13-week rolling cash forecasts. Best for active decision-making and variable cash flow.</p>
        ) : (
          <p>Quarterly reporting with 6-month cash outlook. Best for stable businesses with predictable patterns. <span className="text-green-600 font-medium">~11% savings vs monthly.</span></p>
        )}
      </div>
      
      {/* Tier Tabs */}
      <div className="w-full">
        <div className={cn(
          "grid gap-2 mb-6",
          isMonthly ? "grid-cols-4" : "grid-cols-3"
        )}>
          {availableTiers.map(([id, tier]) => (
            <button
              key={id}
              onClick={() => setSelectedTier(id)}
              className={cn(
                "flex flex-col items-center py-4 px-3 rounded-xl border-2 transition-all relative",
                selectedTier === id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300",
                clientData.recommendedTier === id && "ring-2 ring-blue-400 ring-offset-2"
              )}
            >
              {clientData.recommendedTier === id && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
              <span className="font-semibold text-slate-800">{tier.name}</span>
              <span className="text-lg font-bold text-blue-600 mt-1">
                £{(isMonthly ? tier.monthlyPrice : tier.quarterlyPrice)?.toLocaleString() || 'N/A'}
                <span className="text-sm font-normal text-slate-500">
                  /{isMonthly ? 'mo' : 'qtr'}
                </span>
              </span>
              {!isMonthly && tier.quarterlyPrice && (
                <span className="text-xs text-green-600 mt-1">
                  (£{Math.round(tier.quarterlyPrice / 3).toLocaleString()}/mo equiv.)
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Selected Tier Content */}
        {availableTiers.map(([id, tier]) => {
          if (id !== selectedTier) return null;
          
          const roi = calculateROI(id);
          if (!roi) return null;
          
          return (
            <div key={id} className="space-y-6">
              {/* Tier Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-800">{tier.name}</h3>
                <p className="text-slate-600 italic">{tier.tagline}</p>
                <div className="mt-2">
                  <p className="text-3xl font-bold text-blue-600">
                    £{(isMonthly ? tier.monthlyPrice : tier.quarterlyPrice)?.toLocaleString()}
                    <span className="text-base font-normal text-slate-500">
                      /{isMonthly ? 'month' : 'quarter'}
                    </span>
                  </p>
                  {!isMonthly && tier.quarterlyPrice && (
                    <p className="text-sm text-green-600">
                      Equivalent to £{Math.round(tier.quarterlyPrice / 3).toLocaleString()}/month 
                      (save £{((tier.monthlyPrice * 3) - tier.quarterlyPrice).toLocaleString()}/quarter)
                    </p>
                  )}
                  <p className="text-sm text-slate-500 mt-1">
                    £{roi.annualCost.toLocaleString()}/year
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Column 1: What You Get */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      What You Get
                    </h4>
                  </div>
                  <div className="p-4 space-y-1">
                    <FeatureRow 
                      label="Tuesday Question Answered" 
                      value={tier.features.tuesdayQuestion} 
                    />
                    <FeatureRow 
                      label="True Cash Position" 
                      value={tier.features.trueCash} 
                    />
                    <FeatureRow 
                      label="KPI Dashboard" 
                      value={tier.features.kpiDashboard} 
                    />
                    <FeatureRow 
                      label="Key Insights" 
                      value={tier.features.keyInsights} 
                    />
                    <FeatureRow 
                      label="Decision Support" 
                      value={tier.features.decisionSupport} 
                    />
                    <FeatureRow 
                      label="Trend Analysis" 
                      value={tier.features.trendAnalysis} 
                    />
                    <FeatureRow 
                      label={isMonthly ? "Cash Forecast (13-week)" : "Cash Outlook (6-month)"}
                      value={tier.features.cashForecast ? (isMonthly ? '13-week rolling' : '6-month outlook') : false}
                      highlight={clientData.scenarioInterests.length > 0}
                    />
                    <FeatureRow 
                      label="Scenario Modelling" 
                      value={tier.features.scenarios ? (isMonthly ? tier.features.scenarios : '2 per quarter') : false}
                      highlight={clientData.upcomingDecisions.length > 0}
                    />
                    <FeatureRow 
                      label="Client Profitability" 
                      value={tier.features.clientProfitability} 
                    />
                    {isMonthly && (
                      <>
                        <FeatureRow 
                          label="Weekly Flash Reports" 
                          value={tier.features.weeklyFlash} 
                        />
                        <FeatureRow 
                          label="Industry Benchmarking" 
                          value={tier.features.benchmarking} 
                        />
                      </>
                    )}
                  </div>
                </div>
                
                {/* Column 2: How It's Delivered */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      How It's Delivered
                    </h4>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Reporting Frequency</p>
                      <p className="text-sm text-slate-600">
                        {isMonthly 
                          ? 'Monthly, by working day 10'
                          : 'Quarterly, within 15 working days of quarter end'
                        }
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-slate-700">Review Calls</p>
                      <p className="text-sm text-slate-600">
                        {tier.features.reviewCall 
                          ? (isMonthly 
                              ? `${tier.features.reviewCall} monthly`
                              : `${id === 'gold' ? '60 mins' : '45 mins'} quarterly`)
                          : 'Not included'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-slate-700">Support Response</p>
                      <p className="text-sm text-slate-600">
                        {id === 'platinum' ? 'Same day' : 
                         id === 'gold' ? '24 hours' : '48 hours'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-slate-700">Delivery Format</p>
                      <p className="text-sm text-slate-600">
                        Interactive dashboard + PDF summary
                        {id === 'platinum' && ' + Board pack'}
                      </p>
                    </div>
                    
                    {tier.features.cashForecast && (
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {isMonthly ? 'Cash Forecast Updates' : 'Cash Outlook Updates'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {isMonthly 
                            ? (id === 'platinum' ? 'Weekly' : 'Monthly (weekly when needed)')
                            : 'Monthly updates between quarterly reports'
                          }
                        </p>
                      </div>
                    )}
                    
                    {!isMonthly && (
                      <div className="p-3 bg-amber-50 rounded-lg mt-2">
                        <p className="text-xs text-amber-700">
                          <strong>Note:</strong> Quarterly reporting works best for stable, predictable businesses. 
                          If you have frequent decisions or variable cash flow, monthly may be more suitable.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Column 3: Your ROI */}
                <div className="bg-green-50 border border-green-200 rounded-xl overflow-hidden">
                  <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                    <h4 className="font-semibold text-green-800 flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Your ROI ({isMonthly ? 'Monthly' : 'Quarterly'})
                    </h4>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="text-center py-2">
                      <p className="text-sm text-green-700">Estimated Annual Return</p>
                      <p className="text-3xl font-bold text-green-600">
                        {roi.roi > 0 ? '+' : ''}{roi.roi}%
                      </p>
                      {roi.paybackMonths && roi.paybackMonths <= 12 && (
                        <p className="text-sm text-green-600">
                          Pays for itself in {roi.paybackMonths} months
                        </p>
                      )}
                    </div>
                    
                    <div className="border-t border-green-200 pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">Annual Investment</span>
                        <span className="font-medium">£{roi.annualCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">Potential Savings</span>
                        <span className="font-medium text-green-600">
                          £{roi.potentialSavings.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-green-200 pt-2">
                        <span className="text-green-800">Net Benefit</span>
                        <span className={roi.netBenefit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {roi.netBenefit >= 0 ? '+' : ''}£{roi.netBenefit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-green-200 pt-3">
                      <p className="text-xs font-medium text-green-700 mb-2">Based on your situation:</p>
                      {roi.breakdown.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs mb-1">
                          {item.applies ? (
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-slate-300 flex-shrink-0" />
                          )}
                          <span className={item.applies ? 'text-green-700' : 'text-slate-400'}>
                            {item.item}
                            {item.applies && item.value > 0 && (
                              <span className="ml-1 font-medium">
                                (£{item.value.toLocaleString()})
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Sample Output Preview */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    What Your Report Would Look Like
                  </h4>
                </div>
                <div className="p-4">
                  <TierOutputPreview 
                    tier={id as TierKey} 
                    tuesdayQuestion={clientData.tuesdayQuestion}
                    upcomingDecisions={clientData.upcomingDecisions}
                    isMonthly={isMonthly}
                  />
                </div>
              </div>
              
              {/* CTA */}
              <div className="flex flex-col items-center gap-4 pt-4">
                <button 
                  onClick={() => onTierSelect(`${id}_${frequency}`)}
                  className={cn(
                    "min-w-[280px] px-8 py-4 rounded-xl font-semibold text-white transition-all",
                    clientData.recommendedTier === id 
                      ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" 
                      : "bg-slate-700 hover:bg-slate-800"
                  )}
                >
                  {clientData.recommendedTier === id 
                    ? `Select ${tier.name} ${isMonthly ? 'Monthly' : 'Quarterly'} (Recommended)` 
                    : `Select ${tier.name} ${isMonthly ? 'Monthly' : 'Quarterly'}`
                  }
                </button>
                <p className="text-sm text-slate-500">
                  £{roi.annualCost.toLocaleString()}/year • {roi.netBenefit >= 0 ? 'Net benefit' : 'Investment'}: {roi.netBenefit >= 0 ? '+' : ''}£{Math.abs(roi.netBenefit).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper component for feature rows
function FeatureRow({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: boolean | string; 
  highlight?: boolean;
}) {
  const hasFeature = value !== false;
  
  return (
    <div className={cn(
      "flex items-center justify-between text-sm py-1.5 px-2 rounded",
      highlight && hasFeature && "bg-blue-50"
    )}>
      <span className={hasFeature ? "text-slate-700" : "text-slate-400"}>
        {label}
      </span>
      {typeof value === 'boolean' ? (
        value ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-slate-300" />
        )
      ) : (
        <span className="text-slate-600 font-medium text-xs">{value}</span>
      )}
    </div>
  );
}

// Sample output preview for each tier
function TierOutputPreview({ 
  tier, 
  tuesdayQuestion,
  upcomingDecisions,
  isMonthly
}: { 
  tier: TierKey;
  tuesdayQuestion: string;
  upcomingDecisions: string[];
  isMonthly: boolean;
}) {
  if (tier === 'bronze') {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <PreviewCard title="True Cash Position">
            <div className="text-2xl font-bold text-blue-600">£46,920</div>
            <div className="text-xs text-slate-500">vs £95,430 bank balance</div>
          </PreviewCard>
          <PreviewCard title="This Month's Profit">
            <div className="text-2xl font-bold text-green-600">£12,450</div>
            <div className="text-xs text-slate-500">+8% vs last month</div>
          </PreviewCard>
          <PreviewCard title="Your Tuesday Question">
            <div className="text-sm italic text-slate-600 line-clamp-2">"{tuesdayQuestion || 'Can I afford to hire?'}"</div>
            <div className="text-xs text-blue-600 mt-1">Answered in your report</div>
          </PreviewCard>
        </div>
        <p className="text-sm text-slate-500 text-center">
          Bronze gives you clarity on what's happening. You see the real numbers.
        </p>
      </div>
    );
  }
  
  if (tier === 'silver') {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <PreviewCard title="True Cash Position">
            <div className="text-2xl font-bold text-blue-600">£46,920</div>
            <div className="text-xs text-slate-500">vs £95,430 bank balance</div>
          </PreviewCard>
          <PreviewCard title="Key Insight #1">
            <div className="text-sm font-medium text-slate-700">
              Margins improving despite growth
            </div>
            <div className="text-xs text-slate-500">
              Operating margin up 2.1 points
            </div>
          </PreviewCard>
          <PreviewCard title="Decision Support">
            <div className="text-sm font-medium text-green-600">
              "Yes, if utilisation stays above 70%"
            </div>
            <div className="text-xs text-slate-500">
              Re: {upcomingDecisions[0] || 'your hiring question'}
            </div>
          </PreviewCard>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-sm font-medium text-slate-700 mb-1">Watch List Alert:</p>
          <p className="text-sm text-amber-600">
            ⚠️ Debtor days increased from 32 to 41. One client now at 58 days.
          </p>
        </div>
        <p className="text-sm text-slate-500 text-center">
          Silver tells you what to do. You get interpretation and guidance.
        </p>
      </div>
    );
  }
  
  if (tier === 'gold') {
    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <PreviewCard title="True Cash">
            <div className="text-xl font-bold text-blue-600">£46,920</div>
          </PreviewCard>
          <PreviewCard title={isMonthly ? "Week 6 Warning" : "Month 2 Warning"}>
            <div className="text-xl font-bold text-amber-600">£18,370</div>
            <div className="text-xs text-amber-600">Cash collision</div>
          </PreviewCard>
          <PreviewCard title="Hire Scenario">
            <div className="text-sm font-medium text-green-600">Breakeven: Month 4</div>
          </PreviewCard>
          <PreviewCard title="Client Margins">
            <div className="text-sm">
              <span className="text-green-600">3 profitable</span>
              {' / '}
              <span className="text-red-600">1 loss-making</span>
            </div>
          </PreviewCard>
        </div>
        
        {/* Mini forecast preview */}
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">
            {isMonthly ? '13-Week Cash Forecast Preview:' : '6-Month Cash Outlook Preview:'}
          </p>
          <div className="h-16 flex items-end gap-1">
            {(isMonthly 
              ? [45, 52, 48, 42, 38, 18, 25, 35, 42, 48, 55, 52, 58]
              : [45, 38, 25, 42, 55, 58]
            ).map((val, i) => (
              <div 
                key={i}
                className={cn(
                  "flex-1 rounded-t transition-all",
                  val < 25 ? "bg-red-400" : val < 40 ? "bg-amber-400" : "bg-green-400"
                )}
                style={{ height: `${(val / 60) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{isMonthly ? 'This week' : 'This month'}</span>
            <span className="text-amber-600 font-medium">⚠️ {isMonthly ? 'Week 6' : 'Month 3'}</span>
            <span>{isMonthly ? 'Week 13' : 'Month 6'}</span>
          </div>
        </div>
        
        <p className="text-sm text-slate-500 text-center">
          Gold shows you the future. You see problems before they hit and model decisions.
        </p>
      </div>
    );
  }
  
  // Platinum
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-4 gap-4">
        <PreviewCard title="True Cash">
          <div className="text-xl font-bold text-blue-600">£46,920</div>
        </PreviewCard>
        <PreviewCard title="vs Industry">
          <div className="text-xl font-bold text-green-600">+4.2%</div>
          <div className="text-xs text-slate-500">Above benchmark</div>
        </PreviewCard>
        <PreviewCard title="Weekly Flash">
          <div className="text-sm text-slate-600">
            Cash: ✓ | Margin: ⚠️ | Pipeline: ✓
          </div>
        </PreviewCard>
        <PreviewCard title="Scenarios Run">
          <div className="text-xl font-bold text-blue-600">12</div>
          <div className="text-xs text-slate-500">This month</div>
        </PreviewCard>
      </div>
      
      <div className="bg-purple-50 rounded-lg p-4">
        <p className="text-sm font-medium text-purple-700 mb-2">Board Pack Preview:</p>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-white rounded p-2 border border-purple-100">
            <div className="font-medium">Executive Summary</div>
            <div className="text-xs text-slate-500">1 page</div>
          </div>
          <div className="bg-white rounded p-2 border border-purple-100">
            <div className="font-medium">Financial Performance</div>
            <div className="text-xs text-slate-500">3 pages</div>
          </div>
          <div className="bg-white rounded p-2 border border-purple-100">
            <div className="font-medium">Forward Look</div>
            <div className="text-xs text-slate-500">2 pages</div>
          </div>
        </div>
      </div>
      
      <p className="text-sm text-slate-500 text-center">
        Platinum is board-ready. You get everything, updated frequently, formatted for stakeholders.
      </p>
    </div>
  );
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      {children}
    </div>
  );
}

export default TierComparisonView;

