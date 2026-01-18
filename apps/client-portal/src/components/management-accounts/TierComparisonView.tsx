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
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';

interface TierComparisonProps {
  clientData: {
    annualRevenue?: number;
    tuesdayQuestion: string;
    upcomingDecisions: string[];
    painPoints: Array<{ title: string; estimatedCost: number | null }>;
    recommendedTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    desiredFrequency: 'monthly' | 'quarterly';
  };
  financialContext: {
    recentMistakeCost?: number;
    pendingDecisionValue?: number;
    cashCrisisHistory?: boolean;
    unprofitableClientSuspected?: boolean;
    estimatedMarginLeakage?: number;
  };
  onTierSelect?: (tier: string) => void;
}

// Tier definitions - reframed as depth of support
const tiers = {
  bronze: {
    name: 'Bronze',
    monthlyPrice: 750,
    quarterlyPrice: 2000,
    tagline: "You see what's happening",
    description: "Clear visibility of your financial reality. We show you what's actually happening. You decide what to do about it.",
    perfectFor: "Businesses that want clarity but have the confidence to act independently.",
    features: [
      'True Cash Position calculated',
      'Your Tuesday Question answered',
      'Monthly P&L & Balance Sheet',
      '3 key insights flagged',
      'Watch list (3 metrics)',
    ],
    support: 'Self-serve',
    callTime: null,
    responseTime: '48 hours',
  },
  silver: {
    name: 'Silver',
    monthlyPrice: 1500,
    quarterlyPrice: 4000,
    tagline: "You know what to do",
    description: "We tell you what we'd do. When we spot a cash collision, we don't just flag it — we tell you how to handle it.",
    perfectFor: "Businesses that want a trusted advisor, not just a report.",
    features: [
      'Everything in Bronze, plus:',
      'Action recommendations with each insight',
      'Decision support guidance',
      '6-month trend analysis',
      'Watch list (5 metrics)',
      '30-minute monthly review call',
    ],
    support: '30-min monthly call',
    callTime: '30 mins',
    responseTime: '48 hours',
  },
  gold: {
    name: 'Gold',
    monthlyPrice: 3000,
    quarterlyPrice: 7500,
    tagline: "You see ahead",
    description: "We model your decisions before you make them. Want to hire? We'll show you exactly when you break even and what risks exist.",
    perfectFor: "Businesses making significant decisions needing scenario analysis.",
    features: [
      'Everything in Silver, plus:',
      '13-week rolling cash forecast',
      '3 pre-built scenario models',
      'Client profitability analysis',
      'Industry benchmarks on 8 KPIs',
      '45-minute monthly strategy call',
    ],
    support: '45-min monthly call',
    callTime: '45 mins',
    responseTime: '24 hours',
  },
  platinum: {
    name: 'Platinum',
    monthlyPrice: 5000,
    quarterlyPrice: null,
    tagline: "Board-ready visibility",
    description: "Full visibility with weekly updates, benchmarking, and board-pack documentation. Partner-level access.",
    perfectFor: "Businesses with stakeholders who need professional reporting.",
    features: [
      'Everything in Gold, plus:',
      'Weekly flash reports',
      'Unlimited scenario models',
      'Custom KPI dashboard',
      'Industry benchmarking',
      'Fortnightly partner calls',
      'Board-pack documentation',
    ],
    support: 'Fortnightly calls',
    callTime: 'Fortnightly',
    responseTime: 'Same day',
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
  const [selectedTier, setSelectedTier] = useState<TierKey>(clientData.recommendedTier);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly'>(clientData.desiredFrequency);
  const [showDetails, setShowDetails] = useState(true);
  const isMonthly = frequency === 'monthly';
  
  // Calculate VALUE for each tier - always positive framing
  const calculateValue = useMemo(() => {
    return (tierId: TierKey) => {
      const tier = tiers[tierId];
      
      const annualCost = isMonthly 
        ? tier.monthlyPrice * 12 
        : (tier.quarterlyPrice || 0) * 4;
      
      if (annualCost === 0) return null;
      
      // Value items based on client's situation
      const valueItems: Array<{ description: string; value: number; tier: TierKey }> = [];
      
      // ALL TIERS: Clarity value
      valueItems.push({
        description: 'Know your True Cash vs bank balance fiction',
        value: 3000,
        tier: 'bronze'
      });
      valueItems.push({
        description: 'Your Tuesday Question answered every month',
        value: 2500,
        tier: 'bronze'
      });
      valueItems.push({
        description: 'Stop the 3am cash spreadsheets',
        value: 3000,
        tier: 'bronze'
      });
      
      // SILVER+: Guidance value
      if (['silver', 'gold', 'platinum'].includes(tierId)) {
        valueItems.push({
          description: "Know what to do (we tell you, not just show you)",
          value: 5000,
          tier: 'silver'
        });
        if (financialContext.cashCrisisHistory) {
          valueItems.push({
            description: "Clear guidance when cash gets tight",
            value: 8000,
            tier: 'silver'
          });
        }
      }
      
      // GOLD+: Foresight value
      if (['gold', 'platinum'].includes(tierId)) {
        if (financialContext.pendingDecisionValue) {
          valueItems.push({
            description: `Model ${clientData.upcomingDecisions[0] || 'your hire'} before committing`,
            value: Math.round(financialContext.pendingDecisionValue * 0.15),
            tier: 'gold'
          });
        }
        if (financialContext.cashCrisisHistory) {
          valueItems.push({
            description: 'See cash collisions 6 weeks out (13-week forecast)',
            value: 15000,
            tier: 'gold'
          });
        }
        if (financialContext.unprofitableClientSuspected) {
          valueItems.push({
            description: 'Confirm which clients are actually profitable',
            value: financialContext.estimatedMarginLeakage || 20000,
            tier: 'gold'
          });
        }
        if (financialContext.recentMistakeCost) {
          valueItems.push({
            description: 'Avoid another missed opportunity (scenario modelling)',
            value: Math.round(financialContext.recentMistakeCost * 0.5),
            tier: 'gold'
          });
        }
      }
      
      // PLATINUM: Board-level value
      if (tierId === 'platinum') {
        valueItems.push({
          description: 'Weekly updates - no surprises ever',
          value: 5000,
          tier: 'platinum'
        });
        valueItems.push({
          description: 'Board-ready reports for stakeholders',
          value: 8000,
          tier: 'platinum'
        });
      }
      
      // Filter to items available at this tier
      const tierOrder: TierKey[] = ['bronze', 'silver', 'gold', 'platinum'];
      const tierIndex = tierOrder.indexOf(tierId);
      const availableItems = valueItems.filter(item => 
        tierOrder.indexOf(item.tier) <= tierIndex
      );
      
      const totalValue = availableItems.reduce((sum, item) => sum + item.value, 0);
      const netBenefit = totalValue - annualCost;
      const roi = Math.round((netBenefit / annualCost) * 100);
      const paybackMonths = totalValue > 0 ? Math.ceil(annualCost / (totalValue / 12)) : null;
      
      return {
        annualCost,
        totalValue,
        netBenefit,
        roi,
        paybackMonths,
        valueItems: availableItems
      };
    };
  }, [clientData, financialContext, isMonthly]);
  
  const availableTiers = Object.entries(tiers).filter(([id]) => isMonthly || id !== 'platinum') as [TierKey, typeof tiers[TierKey]][];
  const currentTier = tiers[selectedTier];
  const currentValue = calculateValue(selectedTier);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">Choose Your Level</h2>
        <p className="text-slate-600 mt-2">
          Based on your answers, we recommend <span className="font-bold text-blue-600">{clientData.recommendedTier.toUpperCase()}</span>
        </p>
      </div>
      
      {/* Frequency Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setFrequency('monthly')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
              frequency === 'monthly'
                ? "bg-white text-slate-900 shadow-md"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setFrequency('quarterly')}
            className={cn(
              "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
              frequency === 'quarterly'
                ? "bg-white text-slate-900 shadow-md"
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
                You mentioned cash timing challenges and upcoming decisions. Monthly gives you faster visibility.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tier Cards */}
      <div className={cn("grid gap-4", isMonthly ? "md:grid-cols-4" : "md:grid-cols-3")}>
        {availableTiers.map(([id, tier]) => {
          const isSelected = selectedTier === id;
          const isRecommended = clientData.recommendedTier === id;
          const value = calculateValue(id);
          
          return (
            <button
              key={id}
              onClick={() => setSelectedTier(id)}
              className={cn(
                "relative flex flex-col p-5 rounded-2xl border-2 transition-all text-left",
                isSelected
                  ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02]"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md",
                isRecommended && !isSelected && "ring-2 ring-blue-200"
              )}
            >
              {isRecommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium whitespace-nowrap">
                  <Sparkles className="h-3 w-3" />
                  Recommended
                </span>
              )}
              
              <span className="font-bold text-xl text-slate-800">{tier.name}</span>
              <span className="text-3xl font-bold text-blue-600 mt-2">
                £{(isMonthly ? tier.monthlyPrice : tier.quarterlyPrice)?.toLocaleString()}
              </span>
              <span className="text-sm text-slate-500">
                /{isMonthly ? 'month' : 'quarter'}
              </span>
              <span className="text-sm text-slate-600 mt-3 italic min-h-[40px]">
                {tier.tagline}
              </span>
              
              {isSelected && (
                <span className="mt-3 flex items-center justify-center gap-1 text-sm text-blue-600 font-medium">
                  <Check className="h-4 w-4" />
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* ALL PACKAGES INCLUDE */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-emerald-800">ALL PACKAGES INCLUDE</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            'True Cash Position (not bank balance fiction)',
            'Your Tuesday Question answered each month',
            'Monthly P&L and Balance Sheet',
            'Key insights flagged (problems we spot)',
            'Interactive dashboard + PDF summary'
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-emerald-800 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Selected Tier Detail */}
      {currentValue && showDetails && (
        <div className="space-y-6 border-t border-slate-200 pt-6">
          {/* Tier Description */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-slate-800">{currentTier.name}</h3>
            <p className="text-slate-600 mt-2 max-w-xl mx-auto">{currentTier.description}</p>
            <p className="text-sm text-slate-500 mt-1 italic">
              Perfect for: {currentTier.perfectFor}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* What's in this tier */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  What's in {currentTier.name}
                </h4>
              </div>
              <div className="p-5 space-y-3">
                {currentTier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* How it's delivered */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" />
                  How it's delivered
                </h4>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
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
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Phone className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Review Calls</p>
                    <p className="text-sm text-slate-600">
                      {currentTier.callTime || 'Not included'} {currentTier.callTime && (isMonthly ? 'monthly' : 'quarterly')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Support Response</p>
                    <p className="text-sm text-slate-600">{currentTier.responseTime}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* ROI Analysis */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl overflow-hidden">
            <div className="bg-blue-100 px-5 py-3 border-b border-blue-200">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Your Investment Analysis
              </h4>
            </div>
            <div className="p-5 space-y-5">
              <div className="text-center">
                <p className="text-sm text-blue-700">Annual Investment</p>
                <p className="text-4xl font-bold text-blue-800">
                  £{currentValue.annualCost.toLocaleString()}
                </p>
              </div>
              
              <div className="border-t border-blue-200 pt-5">
                <p className="font-medium text-blue-800 mb-3">
                  Based on YOUR situation, {currentTier.name} would help you:
                </p>
                <div className="space-y-2">
                  {currentValue.valueItems.map((item, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{item.description}</span>
                      </div>
                      <span className="text-blue-700 font-medium whitespace-nowrap">
                        £{item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Potential Annual Value</span>
                  <span className="font-medium text-slate-800">
                    £{currentValue.totalValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Annual Investment</span>
                  <span className="font-medium text-slate-800">
                    £{currentValue.annualCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-800">Net Benefit</span>
                  <span className={cn(
                    "font-bold text-lg",
                    currentValue.netBenefit >= 0 ? "text-emerald-600" : "text-slate-600"
                  )}>
                    {currentValue.netBenefit >= 0 ? '+' : ''}£{currentValue.netBenefit.toLocaleString()}
                  </span>
                </div>
                {currentValue.paybackMonths && currentValue.paybackMonths <= 12 && (
                  <p className="text-center text-sm text-emerald-600 font-medium pt-2">
                    ✓ Pays for itself in {currentValue.paybackMonths} months
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex flex-col items-center gap-4 pt-4">
            <button 
              onClick={() => onTierSelect?.(`${selectedTier}_${frequency}`)}
              className="min-w-[320px] px-8 py-4 rounded-xl font-semibold text-white transition-all text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
            >
              I'm interested in {currentTier.name}
            </button>
            <p className="text-sm text-slate-500">
              £{currentValue.annualCost.toLocaleString()}/year • Net benefit: +£{Math.max(0, currentValue.netBenefit).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default TierComparisonView;

