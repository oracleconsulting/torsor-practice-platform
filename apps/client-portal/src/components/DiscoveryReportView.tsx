// ============================================================================
// DISCOVERY REPORT VIEW - DESTINATION-FOCUSED CLIENT VIEW
// ============================================================================
// "We're travel agents selling holidays, not airlines selling seats."
// 
// The client doesn't buy "Management Accounts" - they buy knowing which 
// customers are profitable. They don't buy "Systems Audit" - they buy a 
// week without being the only one who can fix things.
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Loader2,
  Quote,
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Phone
} from 'lucide-react';
import { ServiceRecommendationPopup } from './ServiceRecommendationPopup';

interface DiscoveryReportViewProps {
  clientId: string;
}

// Timeline dot component
const TimelineDot = ({ active, label }: { active?: boolean; label: string }) => (
  <div className="flex flex-col items-center">
    <div className={`w-4 h-4 rounded-full border-2 ${
      active ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
    }`} />
    <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{label}</span>
  </div>
);

/** Map journey phase enabledBy / enabledByCode to service_catalogue.code */
function journeyPhaseToCatalogueCode(phase: { enabledBy?: string; enabledByCode?: string }): string {
  const code = (phase.enabledByCode || '').toUpperCase().replace(/-/g, '_');
  const map: Record<string, string> = {
    'BENCHMARKING': 'benchmarking', 'BENCHMARKING_DEEP_DIVE': 'benchmarking',
    'SYSTEMS_AUDIT': 'systems_audit', 'GOAL_ALIGNMENT': 'goal_alignment', '365_METHOD': 'goal_alignment',
    'FRACTIONAL_CFO': 'fractional_cfo', 'PROFIT_EXTRACTION': 'profit_extraction', 'QUARTERLY_BI': 'quarterly_bi',
    'MANAGEMENT_ACCOUNTS': 'quarterly_bi', 'HIDDEN_VALUE_AUDIT': 'benchmarking',
    'IHT_PLANNING': 'iht_planning', 'PROPERTY_HEALTH_CHECK': 'property_health_check',
    'WEALTH_TRANSFER_STRATEGY': 'wealth_transfer_strategy', 'PROPERTY_MANAGEMENT_SOURCING': 'property_management_sourcing',
  };
  if (map[code]) return map[code];
  const name = (phase.enabledBy || '').toLowerCase();
  if (name.includes('benchmark')) return 'benchmarking';
  if (name.includes('systems') || name.includes('audit')) return 'systems_audit';
  if (name.includes('goal') || name.includes('alignment') || name.includes('365')) return 'goal_alignment';
  if (name.includes('fractional cfo')) return 'fractional_cfo';
  if (name.includes('profit extraction')) return 'profit_extraction';
  if (name.includes('quarterly') || name.includes('bi ') || name.includes('business intelligence')) return 'quarterly_bi';
  if (name.includes('iht') || name.includes('inheritance')) return 'iht_planning';
  if (name.includes('property') && name.includes('health')) return 'property_health_check';
  if (name.includes('wealth') && name.includes('transfer')) return 'wealth_transfer_strategy';
  if (name.includes('property') && name.includes('management') && name.includes('sourcing')) return 'property_management_sourcing';
  return 'benchmarking';
}

export function DiscoveryReportView({ clientId }: DiscoveryReportViewProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<number>(0);
  const [popupCatalogueCode, setPopupCatalogueCode] = useState<string | null>(null);

  useEffect(() => {
    if (clientId) {
      fetchReport();
    }
  }, [clientId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Fetch engagement
      const { data: engagementData, error: engError } = await supabase
        .from('discovery_engagements')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'published')
        .maybeSingle();

      if (engError) throw engError;
      
      if (!engagementData) {
        setError('Your report is being prepared and will be available soon.');
        setLoading(false);
        return;
      }

      // Fetch report
      const { data: reportData, error: reportError } = await supabase
        .from('discovery_reports')
        .select('*')
        .eq('engagement_id', engagementData.id)
        .eq('status', 'published')
        .maybeSingle();

      if (reportError) throw reportError;
      
      setReport(reportData);
    } catch (err: any) {
      console.error('Error fetching report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 font-light">Loading your report...</p>
        </div>
      </div>
    );
  }

  if (error || !report?.destination_report) {
    return (
      <div className="text-center py-16 px-4">
        <Sparkles className="h-16 w-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-slate-800 mb-2">
          Your Discovery Report
        </h2>
        <p className="text-slate-500 max-w-md mx-auto">
          {error || 'Your personalized report is being prepared. You\'ll be notified when it\'s ready.'}
        </p>
      </div>
    );
  }

  const dest = report.destination_report;
  const page1 = dest.page1_destination || report.page1_destination;
  const page2 = dest.page2_gaps || report.page2_gaps;
  const page3 = dest.page3_journey || report.page3_journey;
  const page4 = dest.page4_numbers || report.page4_numbers;
  const page5 = dest.page5_nextSteps || dest.page5_next_steps || report.page5_next_steps;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      
      {/* ================================================================ */}
      {/* PAGE 1: THE DESTINATION YOU DESCRIBED */}
      {/* ================================================================ */}
      {page1 && (
        <section className="mb-16">
          <div className="mb-8">
            <p className="text-sm font-medium text-amber-600 uppercase tracking-widest mb-2">
              Your Vision
            </p>
            <h1 className="text-3xl md:text-4xl font-serif font-light text-slate-800 leading-tight">
              {page1.headerLine || "The Tuesday You're Building Towards"}
            </h1>
          </div>
          
          <div className="bg-gradient-to-br from-slate-50 to-stone-50 rounded-xl p-8 border border-slate-100">
            <Quote className="h-8 w-8 text-amber-500 mb-4 opacity-60" />
            <blockquote className="text-lg md:text-xl text-slate-700 leading-relaxed italic whitespace-pre-wrap">
              {page1.visionVerbatim}
            </blockquote>
          </div>
          
          {page1.destinationClarityScore && (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(page1.destinationClarityScore / 10) * 100}%` }}
                />
              </div>
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-emerald-600">{page1.destinationClarityScore}/10</span>
                <span className="text-slate-400 ml-2">Destination Clarity</span>
              </div>
            </div>
          )}
          {page1.clarityExplanation && (
            <p className="mt-2 text-sm text-slate-500">{page1.clarityExplanation}</p>
          )}
        </section>
      )}

      {/* ================================================================ */}
      {/* PAGE 2: WHAT'S IN THE WAY */}
      {/* ================================================================ */}
      {page2 && (
        <section className="mb-16">
          <div className="mb-8">
            <p className="text-sm font-medium text-rose-600 uppercase tracking-widest mb-2">
              The Reality
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-light text-slate-800">
              {page2.headerLine || "The Gap Between Here and There"}
            </h2>
            {page2.openingLine && (
              <p className="mt-4 text-lg text-slate-600 font-light italic">
                {page2.openingLine}
              </p>
            )}
          </div>

          <div className="space-y-6">
            {page2.gaps?.map((gap: any, index: number) => (
              <div 
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <h3 className="text-lg font-medium text-slate-800">{gap.title}</h3>
                  </div>
                  
                  {/* The Pattern - Their Words */}
                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border-l-4 border-slate-300">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                      The pattern:
                    </p>
                    <p className="text-slate-700 italic">"{gap.pattern}"</p>
                  </div>
                  
                  {/* What This Costs */}
                  {(gap.costs?.length > 0 || gap.financialImpact || gap.timeImpact) && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                        What this costs you:
                      </p>
                      <ul className="space-y-2">
                        {gap.costs?.map((cost: string, costIdx: number) => (
                          <li key={costIdx} className="flex items-start gap-2 text-slate-600">
                            <span className="text-rose-400 mt-1">•</span>
                            {cost}
                          </li>
                        ))}
                        {/* Financial impact - show calculated figures if available */}
                        {gap.financialImpact && (
                          <li className="flex items-start gap-2 text-rose-700 font-medium">
                            <span className="text-rose-500 mt-1">£</span>
                            {gap.financialImpact}
                          </li>
                        )}
                        {/* Time impact */}
                        {gap.timeImpact && (
                          <li className="flex items-start gap-2 text-amber-700">
                            <span className="text-amber-500 mt-1">⏱</span>
                            {gap.timeImpact}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {/* What This Feels Like */}
                  {gap.emotionalImpact && (
                    <div className="bg-amber-50 rounded-lg p-4 mb-4 border border-amber-100">
                      <p className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-1">
                        What this feels like:
                      </p>
                      <p className="text-amber-800 italic">{gap.emotionalImpact}</p>
                    </div>
                  )}
                  
                  {/* The Shift Required */}
                  {gap.shiftRequired && (
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-1">
                        The shift required:
                      </p>
                      <p className="text-emerald-800">{gap.shiftRequired}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* PAGE 3: THE JOURNEY */}
      {/* ================================================================ */}
      {page3 && (
        <section className="mb-16">
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-600 uppercase tracking-widest mb-2">
              The Path Forward
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-light text-slate-800">
              {page3.headerLine || "From Here to the 4pm Pickup"}
            </h2>
          </div>

          {/* Timeline Visual */}
          {page3.timelineLabel && (
            <div className="mb-8 py-6 px-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between relative">
                {/* Connection Line */}
                <div className="absolute top-2 left-4 right-4 h-0.5 bg-slate-200" />
                
                <TimelineDot label={page3.timelineLabel.now || "Now"} />
                <div className="flex-1" />
                <TimelineDot label={page3.timelineLabel.month3 || "Month 3"} />
                <div className="flex-1" />
                <TimelineDot label={page3.timelineLabel.month6 || "Month 6"} />
                <div className="flex-1" />
                <TimelineDot active label={page3.timelineLabel.month12 || "Month 12"} />
              </div>
            </div>
          )}

          {/* Journey Phases */}
          <div className="space-y-4">
            {page3.phases?.map((phase: any, index: number) => (
              <div 
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
              >
                {/* Phase Header - Clickable */}
                <button
                  onClick={() => setExpandedPhase(expandedPhase === index ? -1 : index)}
                  className="w-full p-6 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
                        {phase.timeframe}
                      </span>
                      <h3 className="text-xl font-medium text-slate-800">
                        {phase.headline}
                      </h3>
                    </div>
                    {expandedPhase === index ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </button>
                
                {/* Expanded Content */}
                {expandedPhase === index && (
                  <div className="px-6 pb-6 border-t border-slate-100">
                    {/* What Changes */}
                    <div className="mt-4">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                        What changes:
                      </p>
                      <ul className="space-y-1">
                        {phase.whatChanges?.map((change: string, changeIdx: number) => (
                          <li key={changeIdx} className="flex items-start gap-2 text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {change}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* What This Feels Like */}
                    {phase.feelsLike && (
                      <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-100">
                        <p className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-1">
                          What this feels like:
                        </p>
                        <p className="text-amber-900 italic">{phase.feelsLike}</p>
                      </div>
                    )}
                    
                    {/* The Outcome */}
                    {phase.outcome && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">
                          The outcome:
                        </p>
                        <p className="text-slate-700 font-medium">{phase.outcome}</p>
                      </div>
                    )}
                    
                    {/* Service Footnote — clickable to open universal service popup */}
                    {phase.enabledBy && (
                      <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                        Enabled by:{' '}
                        <button
                          type="button"
                          onClick={() => setPopupCatalogueCode(journeyPhaseToCatalogueCode(phase))}
                          className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium underline underline-offset-2 hover:no-underline transition-colors"
                        >
                          {phase.enabledBy}
                          <span className="text-xs font-normal opacity-90">— Learn more</span>
                        </button>
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* PAGE 4: THE NUMBERS */}
      {/* ================================================================ */}
      {page4 && (
        <section className="mb-16">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest mb-2">
              The Investment
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-light text-slate-800">
              {page4.headerLine || "The Investment in Your Tuesday"}
            </h2>
          </div>

          {/* Cost of Staying - Uses calculated financialInsights when available */}
          <div className="bg-rose-50 rounded-xl p-6 mb-6 border border-rose-100">
            <h3 className="text-lg font-medium text-rose-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              What Staying Here Costs
            </h3>
            
            {/* CALCULATED PAYROLL DATA - Priority source */}
            {page4.financialInsights?.payroll && (
              <div className="space-y-4 mb-4">
                <div className="bg-white/60 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-rose-800 font-medium">Labour inefficiency</span>
                    <span className="font-bold text-rose-700 text-lg">
                      £{Math.round(page4.financialInsights.payroll.recoverableLow / 1000)}k-£{Math.round(page4.financialInsights.payroll.recoverableHigh / 1000)}k/year
                    </span>
                  </div>
                  <div className="text-sm text-rose-600 space-y-1">
                    <p>Staff costs £{Math.round(page4.financialInsights.payroll.staffCosts / 1000)}k ({page4.financialInsights.payroll.actualPct?.toFixed(1)}% of turnover)</p>
                    <p>Industry benchmark: {page4.financialInsights.payroll.benchmarkPct}%</p>
                    <p className="text-rose-700 font-medium">
                      {(page4.financialInsights.payroll.actualPct - page4.financialInsights.payroll.benchmarkPct).toFixed(1)}% above benchmark = £{Math.round(page4.financialInsights.payroll.grossExcess / 1000)}k gross excess
                    </p>
                    <p className="text-xs text-rose-500 mt-2 italic">
                      Conservative recovery (35-50% of gross excess through restructuring)
                    </p>
                  </div>
                </div>
                
                {/* Valuation impact if available */}
                {page4.financialInsights?.valuation && (
                  <div className="bg-white/60 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-rose-800 font-medium">Exit value at risk</span>
                      <span className="font-bold text-rose-700 text-lg">
                        £{Math.round(page4.financialInsights.valuation.uplift / 1000)}k potential uplift
                      </span>
                    </div>
                    <div className="text-sm text-rose-600 space-y-1">
                      <p>Current: £{Math.round(page4.financialInsights.valuation.currentValuation / 1000)}k (£{Math.round(page4.financialInsights.valuation.currentEbitda / 1000)}k × {page4.financialInsights.valuation.currentMultiple}x)</p>
                      <p>Potential: £{Math.round(page4.financialInsights.valuation.improvedValuation / 1000)}k (with improvements)</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* FALLBACK: LLM-generated narrative if no calculated data */}
            {!page4.financialInsights?.payroll && page4.costOfStaying && (
              <div className="space-y-2 mb-4">
                {page4.costOfStaying.labourInefficiency && (() => {
                  const value = page4.costOfStaying.labourInefficiency;
                  const isShort = String(value).length <= 30;
                  return isShort ? (
                    <div className="flex justify-between text-rose-700">
                      <span>Labour inefficiency</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ) : (
                    <div className="text-rose-700 mb-3">
                      <span className="font-semibold block mb-1">Labour inefficiency</span>
                      <span className="text-sm">{value}</span>
                    </div>
                  );
                })()}
                {page4.costOfStaying.marginLeakage && (() => {
                  const value = page4.costOfStaying.marginLeakage;
                  const isShort = String(value).length <= 30;
                  return isShort ? (
                    <div className="flex justify-between text-rose-700">
                      <span>Margin leakage</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ) : (
                    <div className="text-rose-700 mb-3">
                      <span className="font-semibold block mb-1">Margin leakage</span>
                      <span className="text-sm">{value}</span>
                    </div>
                  );
                })()}
                {page4.costOfStaying.yourTimeWasted && (() => {
                  const value = page4.costOfStaying.yourTimeWasted;
                  const isShort = String(value).length <= 30;
                  return isShort ? (
                    <div className="flex justify-between text-rose-700">
                      <span>Your time on work below your pay grade</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ) : (
                    <div className="text-rose-700 mb-3">
                      <span className="font-semibold block mb-1">Your time on work below your pay grade</span>
                      <span className="text-sm">{value}</span>
                    </div>
                  );
                })()}
                {page4.costOfStaying.businessValueImpact && (() => {
                  const value = page4.costOfStaying.businessValueImpact;
                  const isShort = String(value).length <= 30;
                  return isShort ? (
                    <div className="flex justify-between text-rose-700">
                      <span>Business value without you</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ) : (
                    <div className="text-rose-700 mb-3">
                      <span className="font-semibold block mb-1">Business value without you</span>
                      <span className="text-sm">{value}</span>
                    </div>
                  );
                })()}
                {page4.costOfStaying.annualFinancialCost && (() => {
                  const value = page4.costOfStaying.annualFinancialCost;
                  const isShort = String(value).length <= 30;
                  return isShort ? (
                    <div className="flex justify-between text-rose-700">
                      <span>Annual cost</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ) : (
                    <div className="text-rose-700 mb-3">
                      <span className="font-semibold block mb-1">Annual cost</span>
                      <span className="text-sm">{value}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Personal cost - from LLM narrative */}
            {(page4.personalCost || page4.costOfStaying?.personalCost) && (
              <div className="mt-4 pt-4 border-t border-rose-200">
                <p className="text-sm font-medium text-rose-600 uppercase tracking-wide mb-1">
                  Personal cost:
                </p>
                <p className="text-rose-800">{page4.personalCost || page4.costOfStaying?.personalCost}</p>
              </div>
            )}
          </div>

          {/* Investment Table */}
          {page4.investment && page4.investment.length > 0 && (
            <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
              <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-slate-600" />
                What Moving Forward Costs
              </h3>
              
              <div className="divide-y divide-slate-100">
                {page4.investment.map((inv: any, idx: number) => (
                  <div key={idx} className="flex justify-between py-3">
                    <div>
                      <span className="text-slate-700">{inv.phase}</span>
                      {inv.whatYouGet && (
                        <span className="text-slate-400 ml-2">— {inv.whatYouGet}</span>
                      )}
                    </div>
                    <span className="font-semibold text-slate-800">{inv.amount}</span>
                  </div>
                ))}
                
                {page4.totalYear1 && (
                  <div className="flex justify-between py-3 bg-emerald-50 -mx-6 px-6 mt-2 rounded-b-lg">
                    <span className="font-medium text-emerald-800">
                      {page4.totalYear1Label || 'To start the journey'}
                    </span>
                    <span className="font-bold text-emerald-800">{page4.totalYear1}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Returns */}
          {page4.returns && (
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
              <h3 className="text-lg font-medium text-emerald-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                The Return
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {/* Conservative */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-500 mb-2">Conservative</p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Labour efficiency</span>
                      <span>{page4.returns.conservative?.labourGains}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margin recovery</span>
                      <span>{page4.returns.conservative?.marginRecovery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time reclaimed</span>
                      <span>{page4.returns.conservative?.timeReclaimed}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-emerald-700 pt-2 border-t border-emerald-100">
                      <span>Total</span>
                      <span>{page4.returns.conservative?.total}</span>
                    </div>
                  </div>
                </div>
                
                {/* Realistic */}
                <div className="bg-white rounded-lg p-4">
                  <p className="text-sm font-medium text-emerald-600 mb-2">Realistic</p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Labour efficiency</span>
                      <span>{page4.returns.realistic?.labourGains}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margin recovery</span>
                      <span>{page4.returns.realistic?.marginRecovery}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time reclaimed</span>
                      <span>{page4.returns.realistic?.timeReclaimed}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700 pt-2 border-t border-emerald-100">
                      <span>Total</span>
                      <span>{page4.returns.realistic?.total}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {page4.paybackPeriod && (
                <p className="text-emerald-700 font-medium">
                  Payback period: {page4.paybackPeriod}
                </p>
              )}
              
              {page4.realReturn && (
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <p className="text-emerald-800 italic">
                    But the real return? {page4.realReturn}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ================================================================ */}
      {/* PAGE 5: WHAT HAPPENS NEXT */}
      {/* ================================================================ */}
      {page5 && (
        <section className="mb-8">
          <div className="mb-8">
            <p className="text-sm font-medium text-emerald-600 uppercase tracking-widest mb-2">
              Next Steps
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-light text-slate-800">
              {page5.headerLine || "Starting The Journey"}
            </h2>
          </div>

          {/* This Week */}
          {page5.thisWeek && (
            <div className="bg-white rounded-xl p-6 mb-6 border border-slate-200">
              <h3 className="text-lg font-medium text-slate-800 mb-2 flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-600" />
                This Week
              </h3>
              <p className="text-xl text-slate-700 font-medium mb-2">
                {page5.thisWeek.action}
              </p>
              <p className="text-slate-500">
                {page5.thisWeek.tone}
              </p>
            </div>
          )}

          {/* First Step */}
          {page5.firstStep && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-200">
              <h3 className="text-lg font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Your First Step
              </h3>
              <p className="text-xl text-amber-900 font-medium mb-2">
                {page5.firstStep.recommendation}
              </p>
              <p className="text-amber-800 mb-4">
                {page5.firstStep.why}
              </p>
              
              {page5.firstStep.theirWordsEcho && (
                <div className="bg-white/60 rounded-lg p-4 mb-4 border-l-4 border-amber-400">
                  <p className="text-amber-800 italic">
                    "{page5.firstStep.theirWordsEcho}"
                  </p>
                  <p className="text-sm text-amber-600 mt-1">Let's fix that first.</p>
                </div>
              )}
              
              {page5.firstStep.simpleCta && (
                <p className="text-lg font-semibold text-amber-900">
                  {page5.firstStep.simpleCta}
                </p>
              )}
            </div>
          )}

          {/* The Ask */}
          {page5.theAsk && (
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-300 text-lg mb-6">
                {page5.theAsk}
              </p>
              
              <button className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-3 mb-4">
                <Phone className="h-5 w-5" />
                Book a Conversation
              </button>
              
              {page5.closingLine && (
                <p className="text-amber-400 font-medium text-lg">
                  {page5.closingLine}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <ServiceRecommendationPopup
        isOpen={!!popupCatalogueCode}
        onClose={() => setPopupCatalogueCode(null)}
        serviceCode={popupCatalogueCode || ''}
      />
    </div>
  );
}

export default DiscoveryReportView;
