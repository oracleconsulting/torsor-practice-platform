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
  Target
} from 'lucide-react';

interface TierComparisonProps {
  clientData: {
    annualRevenue?: number;
    tuesdayQuestion: string;
    upcomingDecisions: string[];
    painPoints: Array<{ title: string; estimatedCost: number | null }>;
    scenarioInterests: string[];
    desiredFrequency: 'monthly' | 'quarterly';
    recommendedTier: 'bronze' | 'silver' | 'gold' | 'platinum';
    isPreRevenue?: boolean; // Flag for pre-revenue/startup clients
  };
  financialContext: {
    recentMistakeCost?: number;
    pendingDecisionValue?: number;
    cashCrisisHistory?: boolean;
    unprofitableClientSuspected?: boolean;
    estimatedMarginLeakage?: number;
    // Pre-revenue specific context
    hasProjections?: boolean;
    seekingFunding?: boolean;
    burnRate?: number;
    runway?: number;
    bankBalance?: number;
  };
  onTierSelect: (tier: string) => void;
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
    kpiCount: 3,
    insightCount: 3,
    support: 'Self-serve',
    callTime: null,
    responseTime: '48 hours',
    plusFeatures: [
      'True Cash Position calculated',
      '3 KPIs you choose',
      '3 key insights flagged',
      'Your Tuesday Question answered',
    ],
  },
  silver: {
    name: 'Silver',
    monthlyPrice: 1500,
    quarterlyPrice: 4000,
    tagline: "You know what to do",
    description: "We tell you what we'd do. When we spot a cash collision, we don't just flag it - we tell you how to handle it.",
    perfectFor: "Businesses that want a trusted advisor, not just a report.",
    kpiCount: 5,
    insightCount: 5,
    support: '30-min monthly call',
    callTime: '30 mins',
    responseTime: '48 hours',
    plusFeatures: [
      '5 KPIs with action recommendations',
      '5 insights with "what we\'d do"',
      'Decision support guidance',
      '6-month trend analysis',
      '30-minute monthly review call',
    ],
  },
  gold: {
    name: 'Gold',
    monthlyPrice: 3000,
    quarterlyPrice: 7500,
    tagline: "You see ahead",
    description: "We model your decisions before you make them. Want to hire? We'll show you exactly when you break even and what risks exist.",
    perfectFor: "Businesses making significant decisions needing scenario analysis.",
    kpiCount: 8,
    insightCount: 7,
    support: '45-min monthly call',
    callTime: '45 mins',
    responseTime: '24 hours',
    plusFeatures: [
      '8 KPIs with industry benchmarks',
      '7 insights prioritised by impact',
      '13-week rolling cash forecast',
      '3 pre-built scenario models',
      'Client profitability analysis',
      '45-minute monthly strategy call',
    ],
  },
  platinum: {
    name: 'Platinum',
    monthlyPrice: 5000,
    quarterlyPrice: null,
    tagline: "Board-ready visibility",
    description: "Full visibility with weekly updates, benchmarking, and board-pack documentation. Partner-level access.",
    perfectFor: "Businesses with stakeholders who need professional reporting.",
    kpiCount: 'Custom',
    insightCount: 'Unlimited',
    support: 'Fortnightly calls',
    callTime: 'Fortnightly',
    responseTime: 'Same day',
    plusFeatures: [
      'Custom KPI dashboard',
      'Unlimited insights',
      'Weekly flash reports',
      'Unlimited scenario models',
      'Industry benchmarking',
      'Fortnightly partner calls',
      'Board-pack documentation',
    ],
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
  const isMonthly = frequency === 'monthly';
  
  const isPreRevenue = clientData.isPreRevenue;
  
  // Calculate VALUE (not ROI) for each tier - always positive framing
  const calculateValue = useMemo(() => {
    return (tierId: TierKey) => {
      const tier = tiers[tierId];
      
      const annualCost = isMonthly 
        ? tier.monthlyPrice * 12 
        : (tier.quarterlyPrice || 0) * 4;
      
      if (annualCost === 0) return null;
      
      // Value items based on client's situation
      const valueItems: Array<{ description: string; value: number | null; tier: TierKey; isQualitative?: boolean }> = [];
      
      // ============================================
      // PRE-REVENUE CLIENTS: Different value framing
      // ============================================
      if (isPreRevenue) {
        // ALL TIERS: Infrastructure value
        valueItems.push({
          description: 'Financial infrastructure ready from day 1 of trading',
          value: null,
          tier: 'bronze',
          isQualitative: true
        });
        
        valueItems.push({
          description: 'Track burn rate and runway in real-time',
          value: null,
          tier: 'bronze',
          isQualitative: true
        });
        
        valueItems.push({
          description: 'Your Tuesday Question answered as soon as revenue starts',
          value: null,
          tier: 'bronze',
          isQualitative: true
        });
        
        // SILVER+: Guidance for pre-revenue
        if (['silver', 'gold', 'platinum'].includes(tierId)) {
          valueItems.push({
            description: 'Expert guidance on startup financial decisions',
            value: null,
            tier: 'silver',
            isQualitative: true
          });
          
          valueItems.push({
            description: 'Avoid common pre-revenue cash mistakes',
            value: null,
            tier: 'silver',
            isQualitative: true
          });
        }
        
        // GOLD+: Scenario modelling and investor readiness
        if (['gold', 'platinum'].includes(tierId)) {
          valueItems.push({
            description: 'Model hiring decisions before committing runway',
            value: null,
            tier: 'gold',
            isQualitative: true
          });
          
          valueItems.push({
            description: 'Scenario model your first 12 months of trading',
            value: null,
            tier: 'gold',
            isQualitative: true
          });
          
          if (financialContext.seekingFunding) {
            valueItems.push({
              description: 'Investor-ready financials for seed conversations',
              value: null,
              tier: 'gold',
              isQualitative: true
            });
          }
          
          if (financialContext.burnRate && financialContext.runway) {
            valueItems.push({
              description: `Protect your ${financialContext.runway}-month runway with proactive monitoring`,
              value: null,
              tier: 'gold',
              isQualitative: true
            });
          }
        }
        
        // PLATINUM: Board-level for pre-revenue
        if (tierId === 'platinum') {
          valueItems.push({
            description: 'Weekly updates as you scale',
            value: null,
            tier: 'platinum',
            isQualitative: true
          });
          valueItems.push({
            description: 'Board-ready investor reporting pack',
            value: null,
            tier: 'platinum',
            isQualitative: true
          });
        }
      } else {
        // ============================================
        // ESTABLISHED CLIENTS: Quantifiable ROI
        // ============================================
        
        // ALL TIERS: Clarity value (we always tell them what we see)
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
      }
      
      // Filter to items available at this tier
      const tierOrder: TierKey[] = ['bronze', 'silver', 'gold', 'platinum'];
      const tierIndex = tierOrder.indexOf(tierId);
      const availableItems = valueItems.filter(item => 
        tierOrder.indexOf(item.tier) <= tierIndex
      );
      
      // For pre-revenue, we don't calculate ROI - just show qualitative value
      const quantifiableItems = availableItems.filter(item => !item.isQualitative && item.value !== null);
      const totalValue = quantifiableItems.reduce((sum, item) => sum + (item.value || 0), 0);
      const netBenefit = totalValue - annualCost;
      const roi = totalValue > 0 ? Math.round((netBenefit / annualCost) * 100) : null;
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800">Compare Your Options</h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
          Every package shows you what's really happening. Higher tiers help you do something about it.
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
            onClick={() => setFrequency('quarterly')}
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
      
      {/* Quarterly Warning if relevant */}
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
                Monthly reporting gives you faster visibility when it matters.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tier Selection Tabs */}
      <div className={cn(
        "grid gap-3",
        isMonthly ? "grid-cols-4" : "grid-cols-3"
      )}>
        {availableTiers.map(([id, tier]) => (
          <button
            key={id}
            onClick={() => setSelectedTier(id)}
            className={cn(
              "flex flex-col items-center py-5 px-4 rounded-xl border-2 transition-all relative",
              selectedTier === id
                ? "border-blue-500 bg-blue-50 shadow-lg"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow",
              clientData.recommendedTier === id && selectedTier !== id && "ring-2 ring-blue-200"
            )}
          >
            {clientData.recommendedTier === id && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-blue-600 text-white px-3 py-1 rounded-full font-medium">
                Recommended
              </span>
            )}
            <span className="font-bold text-lg text-slate-800">{tier.name}</span>
            <span className="text-2xl font-bold text-blue-600 mt-1">
              £{(isMonthly ? tier.monthlyPrice : tier.quarterlyPrice)?.toLocaleString()}
            </span>
            <span className="text-sm text-slate-500">
              /{isMonthly ? 'month' : 'quarter'}
            </span>
            <span className="text-sm text-slate-600 mt-2 italic">
              {tier.tagline}
            </span>
          </button>
        ))}
      </div>
      
      {/* ALL PACKAGES INCLUDE - No X marks anywhere */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-emerald-600" />
          <h3 className="font-bold text-emerald-800">ALL PACKAGES INCLUDE</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">True Cash Position (not bank balance fiction)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">Your Tuesday Question answered each month</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">Monthly P&L and Balance Sheet</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">Key insights flagged (problems we spot)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span className="text-emerald-800">Interactive dashboard + PDF summary</span>
          </div>
        </div>
        <p className="text-sm text-emerald-700 mt-4 pt-4 border-t border-emerald-200">
          <strong>We will always tell you</strong> when we see a cash collision coming, a client that's not profitable, 
          a hiring decision that needs attention, or an opportunity window opening.
        </p>
      </div>
      
      {/* Selected Tier Detail */}
      {currentValue && (
        <div className="space-y-6">
          {/* Tier Header */}
          <div className="text-center py-4 border-b border-slate-200">
            <h3 className="text-2xl font-bold text-slate-800">{currentTier.name}</h3>
            <p className="text-slate-600 mt-1 max-w-xl mx-auto">{currentTier.description}</p>
            <p className="text-sm text-slate-500 mt-2 italic">
              Perfect for: {currentTier.perfectFor}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* What's in this tier */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  What's in {currentTier.name}
                </h4>
              </div>
              <div className="p-5 space-y-3">
                {currentTier.plusFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
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
                      {currentTier.callTime || 'Not included'} {currentTier.callTime && (isMonthly ? 'monthly' : 'quarterly')}
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
                    <p className="text-sm text-slate-600">Interactive + PDF summary</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Investment Analysis - Different framing for pre-revenue vs established */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl overflow-hidden">
            <div className="bg-blue-100 px-5 py-3 border-b border-blue-200">
              <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {isPreRevenue ? 'Pre-Revenue Investment' : 'Your Investment Analysis'}
              </h4>
            </div>
            <div className="p-5 space-y-5">
              <div className="text-center">
                <p className="text-sm text-blue-700">Annual Investment</p>
                <p className="text-3xl font-bold text-blue-800">
                  £{currentValue.annualCost.toLocaleString()}
                </p>
              </div>
              
              {isPreRevenue ? (
                // PRE-REVENUE: Show qualitative value, not ROI
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      <strong>Pre-Revenue Note:</strong> ROI calculations require trading history. 
                      Once you have 3+ months of revenue, we'll show quantified value based on your actual numbers.
                    </p>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-5">
                    <p className="font-medium text-blue-800 mb-3">
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
                  
                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <p className="font-semibold text-slate-800 text-sm">Why invest before revenue?</p>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500">→</span>
                        <span><strong>Infrastructure ready:</strong> No scrambling when you close your first deal</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500">→</span>
                        <span><strong>Runway protection:</strong> Proactive burn rate monitoring from day 1</span>
                      </div>
                      {financialContext.seekingFunding && (
                        <div className="flex items-start gap-2">
                          <span className="text-blue-500">→</span>
                          <span><strong>Investor-ready:</strong> Clean financials for your seed conversations</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500">→</span>
                        <span><strong>Decision confidence:</strong> Model hires before committing limited runway</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // ESTABLISHED: Show quantified ROI
                <>
                  <div className="border-t border-blue-200 pt-5">
                    <p className="font-medium text-blue-800 mb-3">
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
                            <span className="text-blue-700 font-medium whitespace-nowrap">
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
                </>
              )}
              
              {/* Payback message - only for established businesses with calculated ROI */}
              {!isPreRevenue && currentValue.paybackMonths && currentValue.paybackMonths <= 12 && (
                <p className="text-center text-sm text-green-600 font-medium pt-2">
                  Pays for itself in {currentValue.paybackMonths} months
                </p>
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
                "min-w-[320px] px-8 py-4 rounded-xl font-semibold text-white transition-all text-lg",
                "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
              )}
            >
              Select {currentTier.name} {isMonthly ? 'Monthly' : 'Quarterly'}
            </button>
            <p className="text-sm text-slate-500">
              £{currentValue.annualCost.toLocaleString()}/year
              {!isPreRevenue && currentValue.netBenefit > 0 && (
                <> • Net benefit: +£{currentValue.netBenefit.toLocaleString()}</>
              )}
              {isPreRevenue && (
                <> • Infrastructure investment for growth</>
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
  tier: TierKey;
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
        
        {tier === 'bronze' && (
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
        
        {tier === 'silver' && (
          <>
            <PreviewCard title="Our Advice">
              <div className="text-sm text-green-600 font-medium">"Push invoice, delay VAT"</div>
              <div className="text-xs text-slate-500">specific guidance</div>
            </PreviewCard>
            <PreviewCard title="Watch Item">
              <div className="text-sm text-amber-600 font-medium">Debtor days: 41</div>
              <div className="text-xs text-amber-600">Action: Chase Smith Ltd</div>
            </PreviewCard>
          </>
        )}
        
        {(tier === 'gold' || tier === 'platinum') && (
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
      </div>
      
      {/* Tier-specific content */}
      {(tier === 'gold' || tier === 'platinum') && (
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
      
      {/* Your Tuesday Question - all tiers answer this */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-800 mb-1">Your Tuesday Question:</p>
        <p className="text-blue-700 italic">"{tuesdayQuestion || 'Can we actually afford this hire?'}"</p>
        <p className="text-sm text-blue-600 mt-2 font-medium">
          → {tier === 'bronze' ? 'Answered clearly' : 
             tier === 'silver' ? 'Answered with our recommendation' :
             'Answered with scenario model'}
        </p>
      </div>
      
      {/* Tier-specific summary */}
      <p className="text-sm text-slate-500 text-center pt-2">
        {tier === 'bronze' && "You see what's happening. You decide what to do."}
        {tier === 'silver' && "You know what to do because we tell you."}
        {tier === 'gold' && "You see ahead because we model the options."}
        {tier === 'platinum' && "Board-level visibility with weekly updates."}
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
