'use client';

import { useState, useMemo } from 'react';
import { 
  Check, 
  Calculator,
  FileText,
  Zap,
  BarChart3,
  Phone,
  Clock,
  TrendingUp,
  AlertCircle,
  Target,
  Star
} from 'lucide-react';
import { TIER_FEATURES, TierType, TURNOVER_BANDS, getPrice, getPriceRange } from '../../types/ma';

interface TierComparisonProps {
  clientData: {
    annualRevenue?: number;
    tuesdayQuestion: string;
    upcomingDecisions: string[];
    painPoints: Array<{ title: string; estimatedCost: number | null }>;
    scenarioInterests: string[];
    desiredFrequency: 'monthly' | 'quarterly';
    recommendedTier: TierType;
    isPreRevenue?: boolean;
  };
  financialContext: {
    recentMistakeCost?: number;
    pendingDecisionValue?: number;
    cashCrisisHistory?: boolean;
    unprofitableClientSuspected?: boolean;
    estimatedMarginLeakage?: number;
    hasProjections?: boolean;
    seekingFunding?: boolean;
    burnRate?: number;
    runway?: number;
    bankBalance?: number;
  };
  onTierSelect: (tier: string) => void;
}

// New tier definitions
const tiers: Record<TierType, {
  name: string;
  tagline: string;
  description: string;
  perfectFor: string;
  kpiCount: number | string;
  insightCount: number;
  support: string;
  callMinutes: number | null;
  responseTime: string;
  features: string[];
  color: string;
}> = {
  clarity: {
    name: 'Clarity',
    tagline: 'See where you are',
    description: 'Clear visibility of your financial reality. True Cash position, core KPIs, AI insights, and your questions answered.',
    perfectFor: 'Businesses that want clarity and actionable insights to guide their own decisions.',
    kpiCount: 5,
    insightCount: 7,
    support: '30-min monthly call',
    callMinutes: 30,
    responseTime: '48 hours',
    features: [
      'Business Intelligence Portal',
      'True Cash Position calculated',
      '5 core KPIs tracked',
      'AI-generated insights (max 7)',
      'Your Tuesday Question answered',
      'Monthly/quarterly PDF report',
      '30-minute review call',
    ],
    color: 'blue'
  },
  foresight: {
    name: 'Foresight',
    tagline: 'See where you could be',
    description: "We model your decisions before you make them. See ahead with 13-week forecasts, scenario models, and client profitability analysis.",
    perfectFor: 'Businesses making significant decisions needing forward-looking analysis.',
    kpiCount: 8,
    insightCount: 7,
    support: '45-min monthly call',
    callMinutes: 45,
    responseTime: '24 hours',
    features: [
      'Everything in Clarity',
      '8 KPIs with industry context',
      'Actionable recommendations',
      '13-week rolling cash forecast',
      '3 pre-built scenario models',
      'Client profitability analysis',
      'Watch list alerts',
      '45-minute review call',
    ],
    color: 'indigo'
  },
  strategic: {
    name: 'Strategic',
    tagline: 'Your financial partner',
    description: 'Board-level support and CFO gateway. Unlimited scenarios, weekly updates, benchmarking, and board pack generation.',
    perfectFor: 'Businesses with stakeholders who need professional reporting and strategic partnership.',
    kpiCount: 'Custom',
    insightCount: 7,
    support: '60-min + ad-hoc calls',
    callMinutes: 60,
    responseTime: 'Same day',
    features: [
      'Everything in Foresight',
      'Custom KPI dashboard (unlimited)',
      'Unlimited scenario models',
      'Weekly cash flash reports',
      'Board pack generation',
      'Industry benchmarking',
      'Ad-hoc advisory access',
      '60-minute review call',
    ],
    color: 'purple'
  }
};

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function TierComparisonView({ 
  clientData, 
  financialContext, 
  onTierSelect 
}: TierComparisonProps) {
  const [selectedTier, setSelectedTier] = useState<TierType>(clientData.recommendedTier);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly'>(clientData.desiredFrequency);
  const isMonthly = frequency === 'monthly';
  const isPreRevenue = clientData.isPreRevenue;
  
  // Determine turnover band for pricing
  const turnoverBandIndex = useMemo(() => {
    if (!clientData.annualRevenue) return 0;
    const band = TURNOVER_BANDS.find(b => 
      clientData.annualRevenue! >= b.min && (b.max === null || clientData.annualRevenue! < b.max)
    );
    return band?.index ?? 0;
  }, [clientData.annualRevenue]);
  
  // Calculate pricing for each tier
  const getTierPrice = (tier: TierType) => {
    if (tier === 'strategic' && !isMonthly) {
      return null; // Strategic is monthly only
    }
    try {
      return getPrice(tier, turnoverBandIndex, frequency);
    } catch {
      return null;
    }
  };
  
  // Calculate VALUE for each tier
  const calculateValue = useMemo(() => {
    return (tierId: TierType) => {
      const price = getTierPrice(tierId);
      if (!price) return null;
      
      const annualCost = isMonthly ? price * 12 : price * 4;
      
      const valueItems: Array<{ description: string; value: number | null; tier: TierType; isQualitative?: boolean }> = [];
      
      if (isPreRevenue) {
        // Pre-revenue value items (qualitative)
        valueItems.push(
          { description: 'Financial infrastructure ready from day 1 of trading', value: null, tier: 'clarity', isQualitative: true },
          { description: 'Track burn rate and runway in real-time', value: null, tier: 'clarity', isQualitative: true },
          { description: 'Your Tuesday Question answered as soon as revenue starts', value: null, tier: 'clarity', isQualitative: true }
        );
        
        if (['foresight', 'strategic'].includes(tierId)) {
          valueItems.push(
            { description: 'Expert guidance on startup financial decisions', value: null, tier: 'foresight', isQualitative: true },
            { description: 'Model hiring decisions before committing runway', value: null, tier: 'foresight', isQualitative: true }
          );
          
          if (financialContext.seekingFunding) {
            valueItems.push({ description: 'Investor-ready financials for seed conversations', value: null, tier: 'foresight', isQualitative: true });
          }
        }
        
        if (tierId === 'strategic') {
          valueItems.push(
            { description: 'Weekly updates as you scale', value: null, tier: 'strategic', isQualitative: true },
            { description: 'Board-ready investor reporting pack', value: null, tier: 'strategic', isQualitative: true }
          );
        }
      } else {
        // Established business value items (quantifiable)
        valueItems.push(
          { description: 'Know your True Cash vs bank balance fiction', value: 3000, tier: 'clarity' },
          { description: 'Your Tuesday Question answered every month', value: 2500, tier: 'clarity' },
          { description: 'Stop the 3am cash spreadsheets', value: 3000, tier: 'clarity' }
        );
        
        if (['foresight', 'strategic'].includes(tierId)) {
          valueItems.push({ description: "Know what to do (we tell you, not just show you)", value: 5000, tier: 'foresight' });
          
          if (financialContext.cashCrisisHistory) {
            valueItems.push({ description: 'See cash collisions 6 weeks out (13-week forecast)', value: 15000, tier: 'foresight' });
          }
          
          if (financialContext.unprofitableClientSuspected) {
            valueItems.push({ description: 'Confirm which clients are actually profitable', value: financialContext.estimatedMarginLeakage || 20000, tier: 'foresight' });
          }
          
          if (financialContext.pendingDecisionValue) {
            valueItems.push({ description: `Model ${clientData.upcomingDecisions[0] || 'your hire'} before committing`, value: Math.round(financialContext.pendingDecisionValue * 0.15), tier: 'foresight' });
          }
        }
        
        if (tierId === 'strategic') {
          valueItems.push(
            { description: 'Weekly updates - no surprises ever', value: 5000, tier: 'strategic' },
            { description: 'Board-ready reports for stakeholders', value: 8000, tier: 'strategic' }
          );
        }
      }
      
      // Filter to items available at this tier
      const tierOrder: TierType[] = ['clarity', 'foresight', 'strategic'];
      const tierIndex = tierOrder.indexOf(tierId);
      const availableItems = valueItems.filter(item => 
        tierOrder.indexOf(item.tier) <= tierIndex
      );
      
      const quantifiableItems = availableItems.filter(item => !item.isQualitative && item.value !== null);
      const totalValue = quantifiableItems.reduce((sum, item) => sum + (item.value || 0), 0);
      const netBenefit = totalValue - annualCost;
      const paybackMonths = totalValue > 0 ? Math.ceil(annualCost / (totalValue / 12)) : null;
      
      return {
        annualCost,
        monthlyPrice: price,
        totalValue,
        netBenefit,
        paybackMonths,
        valueItems: availableItems
      };
    };
  }, [clientData, financialContext, isMonthly, turnoverBandIndex, isPreRevenue]);
  
  // Filter out Strategic tier for quarterly
  const availableTiers = (Object.keys(tiers) as TierType[]).filter(id => 
    isMonthly || id !== 'strategic'
  );
  
  const currentTier = tiers[selectedTier];
  const currentValue = calculateValue(selectedTier);
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">Choose Your Business Intelligence Tier</h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          All tiers show you the same insights. Higher tiers add forecasting, scenarios, and deeper support.
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
            Monthly
          </button>
          <button
            onClick={() => {
              setFrequency('quarterly');
              if (selectedTier === 'strategic') {
                setSelectedTier('foresight');
              }
            }}
            className={cn(
              "px-6 py-2 rounded-md text-sm font-medium transition-all",
              frequency === 'quarterly'
                ? "bg-white text-slate-900 shadow"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Quarterly
          </button>
        </div>
      </div>
      
      {/* Quarterly Warning */}
      {!isMonthly && (financialContext.cashCrisisHistory || clientData.upcomingDecisions.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl mx-auto">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Based on your situation, we recommend Monthly</p>
              <p className="text-sm text-amber-700 mt-1">
                You mentioned {financialContext.cashCrisisHistory ? 'cash timing challenges' : ''} 
                {financialContext.cashCrisisHistory && clientData.upcomingDecisions.length > 0 ? ' and ' : ''}
                {clientData.upcomingDecisions.length > 0 ? 'upcoming decisions' : ''}.
                Monthly reporting gives you faster visibility.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tier Selection Tabs */}
      <div className={cn(
        "grid gap-4",
        availableTiers.length === 3 ? "grid-cols-3" : "grid-cols-2"
      )}>
        {availableTiers.map((id) => {
          const tier = tiers[id];
          const price = getTierPrice(id);
          
          return (
            <button
              key={id}
              onClick={() => setSelectedTier(id)}
              className={cn(
                "flex flex-col items-center py-5 px-4 rounded-xl border-2 transition-all relative",
                selectedTier === id
                  ? id === 'clarity' ? "border-blue-500 bg-blue-50 shadow-lg"
                  : id === 'foresight' ? "border-indigo-500 bg-indigo-50 shadow-lg"
                  : "border-purple-500 bg-purple-50 shadow-lg"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow",
                clientData.recommendedTier === id && selectedTier !== id && "ring-2 ring-offset-2 " + 
                  (id === 'clarity' ? 'ring-blue-200' : id === 'foresight' ? 'ring-indigo-200' : 'ring-purple-200')
              )}
            >
              {clientData.recommendedTier === id && (
                <span className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-white px-3 py-1 rounded-full font-medium flex items-center gap-1",
                  id === 'clarity' ? 'bg-blue-600' : id === 'foresight' ? 'bg-indigo-600' : 'bg-purple-600'
                )}>
                  <Star className="h-3 w-3" /> Recommended
                </span>
              )}
              <span className="font-bold text-lg text-slate-800">{tier.name}</span>
              <span className={cn(
                "text-2xl font-bold mt-1",
                id === 'clarity' ? 'text-blue-600' : id === 'foresight' ? 'text-indigo-600' : 'text-purple-600'
              )}>
                {price ? `£${price.toLocaleString()}` : 'N/A'}
              </span>
              <span className="text-sm text-slate-500">
                /{isMonthly ? 'month' : 'quarter'}
              </span>
              <span className="text-sm text-slate-600 mt-2 italic">
                {tier.tagline}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Turnover Band Info */}
      {clientData.annualRevenue && (
        <p className="text-center text-sm text-slate-500">
          Pricing based on annual turnover of £{clientData.annualRevenue.toLocaleString()} 
          ({TURNOVER_BANDS[turnoverBandIndex]?.label})
        </p>
      )}
      
      {/* ALL PACKAGES INCLUDE */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-emerald-800">ALL TIERS INCLUDE</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">True Cash Position (not bank balance)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">Your Tuesday Question answered</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">AI-generated insights (up to 7)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">Interactive dashboard + PDF report</span>
          </div>
        </div>
        <p className="text-sm text-emerald-700 mt-4 pt-4 border-t border-emerald-200">
          <strong>Same insights at every tier</strong> - we always show you problems we spot. 
          Higher tiers add forecasts, scenarios, and deeper partnership.
        </p>
      </div>
      
      {/* Selected Tier Detail */}
      {currentValue && (
        <div className="space-y-6">
          <div className="text-center py-4 border-b border-slate-200">
            <h3 className={cn(
              "text-2xl font-bold",
              selectedTier === 'clarity' ? 'text-blue-700' : selectedTier === 'foresight' ? 'text-indigo-700' : 'text-purple-700'
            )}>{currentTier.name}</h3>
            <p className="text-slate-600 mt-1 max-w-xl mx-auto">{currentTier.description}</p>
            <p className="text-sm text-slate-500 mt-2 italic">
              Perfect for: {currentTier.perfectFor}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* What's in this tier */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className={cn(
                "px-5 py-3 border-b",
                selectedTier === 'clarity' ? 'bg-blue-50 border-blue-100' : 
                selectedTier === 'foresight' ? 'bg-indigo-50 border-indigo-100' : 
                'bg-purple-50 border-purple-100'
              )}>
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className={cn(
                    "h-5 w-5",
                    selectedTier === 'clarity' ? 'text-blue-500' : 
                    selectedTier === 'foresight' ? 'text-indigo-500' : 
                    'text-purple-500'
                  )} />
                  What's in {currentTier.name}
                </h4>
              </div>
              <div className="p-5 space-y-3">
                {currentTier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className={cn(
                      "h-5 w-5 flex-shrink-0 mt-0.5",
                      selectedTier === 'clarity' ? 'text-blue-500' : 
                      selectedTier === 'foresight' ? 'text-indigo-500' : 
                      'text-purple-500'
                    )} />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* How it's delivered */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  How it's delivered
                </h4>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Reports</p>
                    <p className="text-sm text-slate-600">
                      {isMonthly ? 'Monthly, by working day 10' : 'Quarterly, within 15 working days'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Review Calls</p>
                    <p className="text-sm text-slate-600">
                      {currentTier.callMinutes} minutes {isMonthly ? 'monthly' : 'quarterly'}
                      {selectedTier === 'strategic' && ' + ad-hoc access'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Support Response</p>
                    <p className="text-sm text-slate-600">{currentTier.responseTime}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Dashboard</p>
                    <p className="text-sm text-slate-600">Interactive portal + PDF summary</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Investment Analysis */}
          <div className={cn(
            "border rounded-xl overflow-hidden",
            selectedTier === 'clarity' ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200' : 
            selectedTier === 'foresight' ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200' : 
            'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
          )}>
            <div className={cn(
              "px-5 py-3 border-b",
              selectedTier === 'clarity' ? 'bg-blue-100 border-blue-200' : 
              selectedTier === 'foresight' ? 'bg-indigo-100 border-indigo-200' : 
              'bg-purple-100 border-purple-200'
            )}>
              <h4 className={cn(
                "font-semibold flex items-center gap-2",
                selectedTier === 'clarity' ? 'text-blue-800' : 
                selectedTier === 'foresight' ? 'text-indigo-800' : 
                'text-purple-800'
              )}>
                <Calculator className="h-5 w-5" />
                {isPreRevenue ? 'Pre-Revenue Investment' : 'Your Investment Analysis'}
              </h4>
            </div>
            <div className="p-5 space-y-5">
              <div className="text-center">
                <p className="text-sm text-slate-600">Annual Investment</p>
                <p className={cn(
                  "text-3xl font-bold",
                  selectedTier === 'clarity' ? 'text-blue-800' : 
                  selectedTier === 'foresight' ? 'text-indigo-800' : 
                  'text-purple-800'
                )}>
                  £{currentValue.annualCost.toLocaleString()}
                </p>
              </div>
              
              {isPreRevenue ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Pre-Revenue Note:</strong> ROI calculations require trading history. 
                      Once you have 3+ months of revenue, we'll show quantified value.
                    </p>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-5">
                    <p className="font-medium text-slate-800 mb-3">
                      What {currentTier.name} gives you as you grow:
                    </p>
                    <div className="space-y-3">
                      {currentValue.valueItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="border-t border-slate-200 pt-5">
                    <p className="font-medium text-slate-800 mb-3">
                      Based on YOUR situation, {currentTier.name} would help you:
                    </p>
                    <div className="space-y-2">
                      {currentValue.valueItems.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-4 text-sm">
                          <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-700">{item.description}</span>
                          </div>
                          {item.value !== null && (
                            <span className="text-slate-700 font-medium whitespace-nowrap">
                              £{item.value.toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Potential Annual Value</span>
                      <span className="font-medium text-slate-800">£{currentValue.totalValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Annual Investment</span>
                      <span className="font-medium text-slate-800">£{currentValue.annualCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-800">Net Benefit</span>
                      <span className={cn(
                        "font-bold",
                        currentValue.netBenefit >= 0 ? "text-green-600" : "text-slate-600"
                      )}>
                        {currentValue.netBenefit >= 0 ? '+' : ''}£{currentValue.netBenefit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {currentValue.paybackMonths && currentValue.paybackMonths <= 12 && (
                    <p className="text-center text-sm text-green-600 font-medium pt-2">
                      Pays for itself in {currentValue.paybackMonths} months
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Sample Report Preview */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                What Your Report Would Show
              </h4>
            </div>
            <div className="p-5">
              <TierPreview 
                tier={selectedTier} 
                tuesdayQuestion={clientData.tuesdayQuestion}
                isMonthly={isMonthly}
              />
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <button 
              onClick={() => onTierSelect(`${selectedTier}_${frequency}`)}
              className={cn(
                "min-w-[320px] px-8 py-4 rounded-xl font-semibold text-white transition-all text-lg shadow-lg",
                selectedTier === 'clarity' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 
                selectedTier === 'foresight' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 
                'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
              )}
            >
              Select {currentTier.name} {isMonthly ? 'Monthly' : 'Quarterly'}
            </button>
            <p className="text-sm text-slate-500">
              £{currentValue.annualCost.toLocaleString()}/year
              {!isPreRevenue && currentValue.netBenefit > 0 && (
                <> • Net benefit: +£{currentValue.netBenefit.toLocaleString()}</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Sample report preview for each tier
function TierPreview({ 
  tier, 
  tuesdayQuestion,
  isMonthly
}: { 
  tier: TierType;
  tuesdayQuestion: string;
  isMonthly: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Common cards for all tiers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PreviewCard title="True Cash">
          <div className="text-xl font-bold text-blue-600">£46,920</div>
          <div className="text-xs text-slate-500">vs £95,430 bank</div>
        </PreviewCard>
        
        <PreviewCard title="This Month">
          <div className="text-xl font-bold text-green-600">£12,450</div>
          <div className="text-xs text-green-600">+8% profit</div>
        </PreviewCard>
        
        {tier === 'clarity' && (
          <>
            <PreviewCard title="Key Insight">
              <div className="text-sm text-amber-600 font-medium">Cash timing risk</div>
              <div className="text-xs text-slate-500">flagged for attention</div>
            </PreviewCard>
            <PreviewCard title="Your Question">
              <div className="text-xs text-slate-600 line-clamp-2">"{tuesdayQuestion || 'Can I hire?'}"</div>
              <div className="text-xs text-blue-600 mt-1">Answered ✓</div>
            </PreviewCard>
          </>
        )}
        
        {tier === 'foresight' && (
          <>
            <PreviewCard title={isMonthly ? "Week 6 Alert" : "Month 2 Alert"}>
              <div className="text-xl font-bold text-amber-600">£18,370</div>
              <div className="text-xs text-amber-600">Cash pinch coming</div>
            </PreviewCard>
            <PreviewCard title="Hire Scenario">
              <div className="text-sm font-medium text-green-600">Breakeven: Month 4</div>
              <div className="text-xs text-slate-500">if 70% utilisation</div>
            </PreviewCard>
          </>
        )}
        
        {tier === 'strategic' && (
          <>
            <PreviewCard title={isMonthly ? "Week 6 Alert" : "Month 2 Alert"}>
              <div className="text-xl font-bold text-amber-600">£18,370</div>
              <div className="text-xs text-amber-600">Cash pinch coming</div>
            </PreviewCard>
            <PreviewCard title="Board Pack">
              <div className="text-sm font-medium text-purple-600">Ready to send</div>
              <div className="text-xs text-slate-500">stakeholder format</div>
            </PreviewCard>
          </>
        )}
      </div>
      
      {/* Forecast preview for Foresight and Strategic */}
      {(tier === 'foresight' || tier === 'strategic') && (
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm font-medium text-slate-700 mb-2">
            {isMonthly ? '13-Week Cash Forecast:' : '6-Month Cash Outlook:'}
          </p>
          <div className="h-12 flex items-end gap-0.5">
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
            <span>Now</span>
            <span className="text-amber-600 font-medium">⚠️ {isMonthly ? 'Week 6' : 'Month 2'}</span>
            <span>{isMonthly ? 'Week 13' : 'Month 6'}</span>
          </div>
        </div>
      )}
      
      {/* Your Tuesday Question */}
      <div className={cn(
        "rounded-lg p-4",
        tier === 'clarity' ? 'bg-blue-50' : 
        tier === 'foresight' ? 'bg-indigo-50' : 
        'bg-purple-50'
      )}>
        <p className={cn(
          "text-sm font-medium mb-1",
          tier === 'clarity' ? 'text-blue-800' : 
          tier === 'foresight' ? 'text-indigo-800' : 
          'text-purple-800'
        )}>Your Tuesday Question:</p>
        <p className={cn(
          "italic",
          tier === 'clarity' ? 'text-blue-700' : 
          tier === 'foresight' ? 'text-indigo-700' : 
          'text-purple-700'
        )}>"{tuesdayQuestion || 'Can we actually afford this hire?'}"</p>
        <p className={cn(
          "text-sm mt-2 font-medium",
          tier === 'clarity' ? 'text-blue-600' : 
          tier === 'foresight' ? 'text-indigo-600' : 
          'text-purple-600'
        )}>
          → {tier === 'clarity' ? 'Answered with clear analysis' : 
             tier === 'foresight' ? 'Answered with scenario model' :
             'Answered with full scenario + board impact'}
        </p>
      </div>
      
      {/* Tier-specific summary */}
      <p className="text-sm text-slate-500 text-center pt-2">
        {tier === 'clarity' && "Clear visibility of your financial reality."}
        {tier === 'foresight' && "See ahead with forecasts and scenario modelling."}
        {tier === 'strategic' && "Board-level visibility with full partnership support."}
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
