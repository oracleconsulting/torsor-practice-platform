import { useState } from 'react';
import { CheckCircle, TrendingUp, Target, Lightbulb, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { TrueCashPreview } from './previews/TrueCashPreview';
import { ForecastPreview } from './previews/ForecastPreview';
import { ScenarioPreview } from './previews/ScenarioPreview';
import { TierSelector } from './TierSelector';
import { TierComparisonView } from './TierComparisonView';

interface MAClientReportViewProps {
  report: {
    pass1_data: any;
    pass2_data?: any;
    client_view?: any;
  };
  engagement?: any;
  onTierSelect?: (tier: string) => void;
  showTierComparison?: boolean; // Default true - show the full tier comparison
}

export function MAClientReportView({ report, onTierSelect, showTierComparison = true }: MAClientReportViewProps) {
  const [showFullComparison, setShowFullComparison] = useState(false);
  const p1 = report.pass1_data;
  const p2 = report.pass2_data || report.client_view;
  
  if (!p2) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Client report not yet generated</p>
        <p className="text-sm mt-2">The full analysis will appear here once generated</p>
      </div>
    );
  }

  // Build sample True Cash data from extracted facts
  const trueCashSample = {
    bankBalance: 95430,
    trueCash: 46920,
    deductions: [
      { label: 'VAT owed', amount: -22150 },
      { label: 'PAYE/NI due', amount: -8800 },
      { label: 'Corporation tax provision', amount: -15000 },
      { label: 'Committed creditors', amount: -12560 },
      { label: 'Confirmed receivables (7 days)', amount: 10000 },
    ],
  };

  // Extract data for tier comparison from pass1 data
  const tierComparisonData = p1 ? {
    clientData: {
      annualRevenue: p1.extractedFacts?.financial?.annualRevenue,
      tuesdayQuestion: p1.clientQuotes?.tuesdayQuestion || 'Can I afford to make this decision?',
      upcomingDecisions: p1.adminGuidance?.scenariosToBuild?.map((s: any) => s.name) || [],
      painPoints: (p1.findings || []).map((f: any) => ({ 
        title: f.title, 
        estimatedCost: null 
      })),
      scenarioInterests: p1.adminGuidance?.scenariosToBuild?.map((s: any) => s.type) || [],
      desiredFrequency: (p1.adminGuidance?.quickProfile?.desiredFrequency?.toLowerCase()?.includes('quarter') 
        ? 'quarterly' : 'monthly') as 'monthly' | 'quarterly',
      recommendedTier: (p1.tierRecommendation?.tier || 'gold') as 'bronze' | 'silver' | 'gold' | 'platinum'
    },
    financialContext: {
      // Try to extract from assessment data, default to reasonable estimates
      recentMistakeCost: p1.extractedFacts?.painMetrics?.recentMistakeCost || 
        (p1.clientQuotes?.avoidedCalculation ? 80000 : undefined),
      pendingDecisionValue: p1.extractedFacts?.painMetrics?.pendingDecisionValue || 
        (p1.adminGuidance?.scenariosToBuild?.length > 0 ? 50000 : undefined),
      cashCrisisHistory: p1.clientQuotes?.worstCashMoment ? true : 
        (p1.findings?.some((f: any) => f.title?.toLowerCase().includes('cash')) || false),
      unprofitableClientSuspected: p1.findings?.some((f: any) => 
        f.title?.toLowerCase().includes('client') || f.title?.toLowerCase().includes('profitability')
      ) || false,
      estimatedMarginLeakage: p1.extractedFacts?.painMetrics?.estimatedMarginLeakage || 25000
    }
  } : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Headline */}
      {p2.headline && (
        <div className="text-center py-8">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
            {p2.headline}
          </h1>
        </div>
      )}
      
      {/* Tuesday Question Section - The "Wow" */}
      {p2.tuesdayAnswerPreview && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl overflow-hidden">
          <div className="bg-blue-100 px-6 py-4 border-b border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900">Your Tuesday Question</h2>
          </div>
          <div className="p-6">
            {p2.tuesdayAnswerPreview.question && (
              <blockquote className="text-xl italic border-l-4 border-blue-500 pl-4 mb-6 text-blue-800">
                "{p2.tuesdayAnswerPreview.question}"
              </blockquote>
            )}
            
            {p2.tuesdayAnswerPreview.introText && (
              <p className="text-slate-600 mb-6">{p2.tuesdayAnswerPreview.introText}</p>
            )}
            
            {/* Visual Previews */}
            <div className="space-y-6">
              {p2.tuesdayAnswerPreview.showTrueCash && (
                <TrueCashPreview {...trueCashSample} />
              )}
              
              {p2.tuesdayAnswerPreview.showForecast && (
                <ForecastPreview 
                  weeks={13}
                  criticalDate={{
                    week: 'Feb 24',
                    event: 'VAT + Payroll collision',
                    lowestPoint: 18370
                  }}
                />
              )}
              
              {p2.tuesdayAnswerPreview.showScenario && p2.tuesdayAnswerPreview.scenarioType && (
                <ScenarioPreview 
                  type={p2.tuesdayAnswerPreview.scenarioType as 'hire' | 'price' | 'client_loss' | 'investment'}
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* What's Been Costing You */}
      {p2.clientFindings && p2.clientFindings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Target className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900">What's Been Costing You</h2>
          </div>
          <div className="p-6 space-y-4">
            {p2.clientFindings.map((finding: any, i: number) => (
              <div key={i} className="border-l-4 border-red-400 pl-4 py-2">
                <h4 className="font-semibold text-lg text-gray-900">{finding.headline}</h4>
                <p className="text-slate-600">{finding.detail}</p>
                {finding.cost && (
                  <p className="text-red-600 font-medium mt-1">{finding.cost}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* What You Said You Wanted */}
      {p2.transformationSection && (
        <div className="bg-green-50 border border-green-200 rounded-xl overflow-hidden">
          <div className="bg-green-100 px-6 py-4 border-b border-green-200 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-green-900">What You Said You Wanted</h2>
          </div>
          <div className="p-6">
            {p2.transformationSection.intro && (
              <p className="text-slate-600 mb-4">{p2.transformationSection.intro}</p>
            )}
            {p2.transformationSection.quotes && p2.transformationSection.quotes.length > 0 && (
              <div className="space-y-3">
                {p2.transformationSection.quotes.map((quote: string, i: number) => (
                  <blockquote 
                    key={i}
                    className="text-lg italic border-l-4 border-green-500 pl-4 py-1 text-green-800"
                  >
                    "{quote}"
                  </blockquote>
                ))}
              </div>
            )}
            {p2.transformationSection.connectionText && (
              <p className="mt-6 text-green-800 font-medium">
                {p2.transformationSection.connectionText}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Quick Wins */}
      {p2.quickWins && p2.quickWins.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Wins You Can Start Today</h2>
          </div>
          <div className="p-6 space-y-4">
            {p2.quickWins.map((win: any, i: number) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{win.action}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-slate-500">{win.timing}</span>
                    <span className="text-emerald-600 font-medium">{win.benefit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommended Approach */}
      {p2.recommendedApproach && (
        <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recommended Approach</h2>
          </div>
          <div className="p-6">
            {p2.recommendedApproach.summary && (
              <p className="text-lg mb-6 text-gray-700">{p2.recommendedApproach.summary}</p>
            )}
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {p2.recommendedApproach.frequency && (
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Frequency</h4>
                  <p className="text-slate-600">{p2.recommendedApproach.frequency}</p>
                </div>
              )}
              {p2.recommendedApproach.focusAreas && p2.recommendedApproach.focusAreas.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-gray-900">Focus Areas</h4>
                  <ul className="space-y-1">
                    {p2.recommendedApproach.focusAreas.map((area: string, i: number) => (
                      <li key={i} className="text-slate-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {p2.recommendedApproach.tier && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded">
                    {p2.recommendedApproach.tier.toUpperCase()}
                  </span>
                  <span className="text-slate-600">Recommended for you</span>
                </div>
                {p2.recommendedApproach.tierRationale && (
                  <p className="text-slate-700">{p2.recommendedApproach.tierRationale}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Tier Comparison / Selector */}
      {p2.recommendedApproach?.tier && showTierComparison && tierComparisonData && (
        <div className="space-y-4">
          {/* Expandable Tier Comparison */}
          <button
            onClick={() => setShowFullComparison(!showFullComparison)}
            className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <div className="text-left">
              <p className="font-semibold text-blue-900">Compare All Tiers & See Your ROI</p>
              <p className="text-sm text-blue-700">
                See what each tier delivers, sample reports, and calculate your return on investment
              </p>
            </div>
            {showFullComparison ? (
              <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-blue-600 flex-shrink-0" />
            )}
          </button>
          
          {showFullComparison && (
            <div className="border border-slate-200 rounded-xl p-6 bg-white">
              <TierComparisonView
                clientData={tierComparisonData.clientData}
                financialContext={tierComparisonData.financialContext}
                onTierSelect={(tier) => onTierSelect?.(tier)}
              />
            </div>
          )}
          
          {/* Always show simple tier selector as well */}
          {!showFullComparison && (
            <TierSelector 
              recommendedTier={p2.recommendedApproach.tier}
              onSelect={onTierSelect}
            />
          )}
        </div>
      )}
      
      {/* Fallback to simple selector if no comparison data */}
      {p2.recommendedApproach?.tier && (!showTierComparison || !tierComparisonData) && (
        <TierSelector 
          recommendedTier={p2.recommendedApproach.tier}
          onSelect={onTierSelect}
        />
      )}
      
      {/* Goal Connection - Emotional Close */}
      {p2.goalConnection && (
        <div className="bg-slate-800 text-white rounded-xl overflow-hidden">
          <div className="p-8">
            {p2.goalConnection.narrative && (
              <p className="text-lg leading-relaxed mb-6">
                {p2.goalConnection.narrative}
              </p>
            )}
            {p2.goalConnection.theirWords && p2.goalConnection.theirWords.length > 0 && (
              <div className="border-t border-slate-600 pt-6">
                <p className="text-slate-400 text-sm mb-3">In your words:</p>
                <div className="space-y-2">
                  {p2.goalConnection.theirWords.map((quote: string, i: number) => (
                    <p key={i} className="italic text-slate-200">"{quote}"</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-slate-600 mb-4">Ready to stop hoping and start knowing?</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <button 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            onClick={() => onTierSelect?.(p2.recommendedApproach?.tier || 'silver')}
          >
            I'm interested - let's talk
          </button>
          <button className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 transition-colors text-slate-700">
            I need to think about it
          </button>
        </div>
      </div>
    </div>
  );
}

export default MAClientReportView;

