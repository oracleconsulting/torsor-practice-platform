import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, ChevronRight, Sparkles, Target, TrendingUp, Heart, Clock, Shield, FileDown, Loader2, Quote, AlertTriangle, CheckCircle2, DollarSign, Phone, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TransformationJourney } from '../../components/discovery/TransformationJourney';
import { DiscoveryMetricCard, MetricGrid, ROISummaryCard } from '../../components/discovery/DiscoveryMetricCard';
import { CostOfInactionCard } from '../../components/discovery/DiscoveryInsightCard';
import { ServiceRecommendationPopup } from '../../components/ServiceRecommendationPopup';

// ============================================================================
// CLIENT-FRIENDLY DISCOVERY REPORT
// ============================================================================
// Now supports BOTH:
// 1. New 5-page Pass 1/2 format from discovery_reports
// 2. Legacy Stage 3 format from client_reports (fallback)
// ============================================================================

/** Map Discovery recommended_services code or name to service_catalogue.code */
function discoveryServiceToCatalogueCode(rec: { serviceCode?: string; code?: string; serviceName?: string }): string {
  const code = (rec.serviceCode || rec.code || '').toUpperCase().replace(/-/g, '_');
  const map: Record<string, string> = {
    'BENCHMARKING_DEEP_DIVE': 'benchmarking',
    'BENCHMARKING': 'benchmarking',
    'SYSTEMS_AUDIT': 'systems_audit',
    'GOAL_ALIGNMENT': 'goal_alignment',
    '365_METHOD': 'goal_alignment',
    'FRACTIONAL_CFO': 'fractional_cfo',
    'PROFIT_EXTRACTION': 'profit_extraction',
    'QUARTERLY_BI': 'quarterly_bi',
  };
  if (map[code]) return map[code];
  const name = (rec.serviceName || '').toLowerCase();
  if (name.includes('benchmark')) return 'benchmarking';
  if (name.includes('systems') || name.includes('audit')) return 'systems_audit';
  if (name.includes('goal') || name.includes('alignment') || name.includes('365')) return 'goal_alignment';
  if (name.includes('fractional cfo')) return 'fractional_cfo';
  if (name.includes('profit extraction')) return 'profit_extraction';
  if (name.includes('quarterly') || name.includes('bi ') || name.includes('business intelligence')) return 'quarterly_bi';
  return 'benchmarking';
}

// Timeline dot component for new format
const TimelineDot = ({ active, label }: { active?: boolean; label: string }) => (
  <div className="flex flex-col items-center">
    <div className={`w-4 h-4 rounded-full border-2 ${
      active ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'
    }`} />
    <span className="text-xs text-gray-500 mt-1 whitespace-nowrap">{label}</span>
  </div>
);

interface LegacyDiscoveryReport {
  id: string;
  report_data: {
    generatedAt: string;
    clientName: string;
    analysis: {
      executiveSummary?: {
        headline?: string;
        destinationVision?: string;
        currentReality?: string;
        criticalInsight?: string;
      };
      gapAnalysis?: {
        primaryGaps?: any[];
        costOfInaction?: {
          annualFinancialCost?: string;
          annual?: string;
          description?: string;
          personalCost?: string;
        };
      };
      transformationJourney?: {
        destinationLabel?: string;
        destination?: string;
        destinationContext?: string;
        journeyLabel?: string;
        totalInvestment?: string;
        totalTimeframe?: string;
        phases?: Array<{
          phase: number;
          timeframe: string;
          title: string;
          youWillHave: string;
          whatChanges: string;
          enabledBy: string;
          enabledByCode: string;
          investment: string;
        }>;
      };
      recommendedInvestments?: any[];
      investmentSummary?: {
        totalFirstYearInvestment?: string;
        investmentBreakdown?: string;
        investmentAsPercentOfRevenue?: string;
        projectedFirstYearReturn?: string;
        netBenefitYear1?: string;
        paybackPeriod?: string;
        roiCalculation?: string;
        comparisonToInaction?: string;
      };
      closingMessage?: {
        personalNote?: string;
        callToAction?: string;
      } | string;
    };
    discoveryScores?: {
      clarityScore?: number;
      gapScore?: number;
    };
  };
  is_shared_with_client: boolean;
  shared_at: string;
}

export default function DiscoveryReportPage() {
  const { clientSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [legacyReport, setLegacyReport] = useState<LegacyDiscoveryReport | null>(null);
  const [newReport, setNewReport] = useState<any>(null);
  const [showCallToAction, setShowCallToAction] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [collapsedPhases, setCollapsedPhases] = useState<Set<number>>(new Set());
  const [popupCatalogueCode, setPopupCatalogueCode] = useState<string | null>(null);
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<any>(null);
  const [recommendedServices, setRecommendedServices] = useState<any[]>([]);

  useEffect(() => {
    loadReport();
  }, [clientSession]);

  // PDF Export Handler
  const handleExportPDF = async () => {
    if (!clientSession?.clientId || (!legacyReport && !newReport)) return;
    
    setExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-discovery-pdf', {
        body: {
          clientId: clientSession.clientId,
          reportId: legacyReport?.id || newReport?.id,
        }
      });

      if (error) throw error;

      if (data?.html) {
        // Open HTML in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          // Auto-trigger print dialog after a short delay
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      }
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const loadReport = async () => {
    if (!clientSession?.clientId) {
      console.log('[Report] No client session, cannot load report');
      setLoading(false);
      return;
    }

    try {
      console.log('[Report] Loading report for client:', clientSession.clientId);
      
      // ======================================================================
      // PRIORITY 1: Try to load NEW discovery_reports format (Pass 1/2)
      // ======================================================================
      const { data: engagement } = await supabase
        .from('discovery_engagements')
        .select('id, status')
        .eq('client_id', clientSession.clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[Report] Found engagement:', engagement);

      if (engagement?.id) {
        // Prefer Pass 2 report that is published for client (ready_for_client); fallback to any generated/published
        const { data: discoveryReport, error: drError } = await supabase
          .from('discovery_reports')
          .select('*')
          .eq('engagement_id', engagement.id)
          .in('status', ['generated', 'published', 'admin_review'])
          .order('ready_for_client', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('[Report] Discovery report lookup:', { 
          found: !!discoveryReport, 
          error: drError,
          hasPage1: !!discoveryReport?.page1_destination,
          hasPage2: !!discoveryReport?.page2_gaps,
          status: discoveryReport?.status
        });

        if (discoveryReport && (discoveryReport.page1_destination || discoveryReport.destination_report)) {
          console.log('[Report] ✅ Using NEW Pass 1/2 format');
          setNewReport(discoveryReport);
          // Also store comprehensive_analysis separately for use across formats
          if (discoveryReport.comprehensive_analysis) {
            setComprehensiveAnalysis(discoveryReport.comprehensive_analysis);
          }
          // Load recommended services for "How We Can Help" section
          if (discoveryReport.recommended_services) {
            setRecommendedServices(discoveryReport.recommended_services);
          }
          setLoading(false);
          return;
        }
        
        // Even if new format not used, still save comprehensive_analysis for legacy format
        if (discoveryReport?.comprehensive_analysis) {
          console.log('[Report] 📊 Storing comprehensive_analysis for legacy format');
          setComprehensiveAnalysis(discoveryReport.comprehensive_analysis);
        }
      }

      // ======================================================================
      // PRIORITY 2: Fall back to legacy client_reports format
      // ======================================================================
      console.log('[Report] Falling back to legacy client_reports format');
      
      // First, get the most recent completed discovery record for this client
      const { data: latestDiscovery } = await supabase
        .from('destination_discovery')
        .select('id, completed_at, created_at')
        .eq('client_id', clientSession.clientId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[Report] Latest completed discovery:', latestDiscovery);

      // Load the client's shared discovery report
      let report = null;
      let error = null;

      if (latestDiscovery?.id) {
        // Try to find report linked to the latest discovery
        const { data: linkedReport, error: linkedError } = await supabase
        .from('client_reports')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('report_type', 'discovery_analysis')
        .eq('is_shared_with_client', true)
          .eq('discovery_id', latestDiscovery.id)
        .order('created_at', { ascending: false })
        .limit(1)
          .maybeSingle();

        if (linkedReport) {
          console.log('[Report] Found report linked to latest discovery:', latestDiscovery.id);
          report = linkedReport;
        }
      }

      // Fallback: get most recent shared report (if no linked report found)
      if (!report) {
        const { data: fallbackReport, error: fallbackError } = await supabase
          .from('client_reports')
          .select('*')
          .eq('client_id', clientSession.clientId)
          .eq('report_type', 'discovery_analysis')
          .eq('is_shared_with_client', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        report = fallbackReport;
        error = fallbackError;
      }

      if (error) {
        console.error('[Report] Error loading report:', error);
      }

      if (report) {
        console.log('[Report] ✅ Using LEGACY client_reports format');
        setLegacyReport(report);
      } else {
        console.log('[Report] No report found for client');
      }
    } catch (err) {
      console.error('[Report] Exception loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show CTA after 3 seconds
  useEffect(() => {
    if (legacyReport || newReport) {
      const timer = setTimeout(() => setShowCallToAction(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [legacyReport, newReport]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized insights...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER NEW FORMAT (Pass 1/2 - 5 Page Structure)
  // ============================================================================
  if (newReport) {
    const dest = newReport.destination_report || {};
    const page1 = dest.page1_destination || newReport.page1_destination;
    const page2 = dest.page2_gaps || newReport.page2_gaps;
    const page3 = dest.page3_journey || newReport.page3_journey;
    const page4 = dest.page4_numbers || newReport.page4_numbers;
    const page5 = dest.page5_nextSteps || dest.page5_next_steps || newReport.page5_next_steps;

    // Get clarity score from various sources
    const clarityScore = page1?.clarityScore || page1?.destinationClarityScore || 
                         newReport.destination_clarity?.score || 7;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate('/portal')}
              className="flex items-center gap-2 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="flex items-center gap-3">
              <Logo variant="dark" size="sm" />
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-slate-300 hidden sm:inline">Your Discovery Report</span>
            </div>
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {exportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline">Export PDF</span>
                </>
              )}
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          
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
                  {page1.visionVerbatim || page1.visionNarrative || "Your vision for the future..."}
                </blockquote>
              </div>
              
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(clarityScore / 10) * 100}%` }}
                  />
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-emerald-600">{clarityScore}/10</span>
                  <span className="text-slate-400 ml-2">Destination Clarity</span>
                </div>
              </div>
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
                      {gap.pattern && (
                        <div className="bg-slate-50 rounded-lg p-4 mb-4 border-l-4 border-slate-300">
                          <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                            The pattern:
                          </p>
                          <p className="text-slate-700 italic">"{gap.pattern}"</p>
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
          {page3 && page3.phases && page3.phases.length > 0 && (
            <section className="mb-16">
              <div className="mb-8">
                <p className="text-sm font-medium text-blue-600 uppercase tracking-widest mb-2">
                  The Path Forward
                </p>
                <h2 className="text-2xl md:text-3xl font-serif font-light text-slate-800">
                  {page3.headerLine || page3.destinationLabel || "From Here to There"}
                </h2>
              </div>

              {/* Timeline Visual */}
              {page3.timelineLabel && (
                <div className="mb-8 py-6 px-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between relative">
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
                    <button
                      type="button"
                      onClick={() => {
                        setCollapsedPhases(prev => {
                          const next = new Set(prev);
                          if (next.has(index)) next.delete(index);
                          else next.add(index);
                          return next;
                        });
                      }}
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
                        {collapsedPhases.has(index) ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronUp className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </button>
                    
                    {!collapsedPhases.has(index) && (
                      <div className="px-6 pb-6 border-t border-slate-100">
                        {phase.whatChanges && phase.whatChanges.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                              What changes:
                            </p>
                            <ul className="space-y-1">
                              {phase.whatChanges.map((change: string, changeIdx: number) => (
                                <li key={changeIdx} className="flex items-start gap-2 text-slate-700">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                  {change}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {phase.feelsLike && (
                          <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-100">
                            <p className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-1">
                              What this feels like:
                            </p>
                            <p className="text-amber-900 italic">{phase.feelsLike}</p>
                          </div>
                        )}
                        
                        {phase.outcome && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">
                              The outcome:
                            </p>
                            <p className="text-slate-700 font-medium">{phase.outcome}</p>
                          </div>
                        )}
                        
                        {phase.enabledBy && (
                          <p className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-500">
                            Enabled by:{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const nameToCatalogue: Record<string, string> = {
                                  'Benchmarking & Hidden Value Analysis': 'benchmarking',
                                  'Industry Benchmarking': 'benchmarking',
                                  'Industry Benchmarking (Full Package)': 'benchmarking',
                                  'Goal Alignment Programme': 'goal_alignment',
                                  'Goal Alignment Programme (Growth)': 'goal_alignment',
                                  'Hidden Value Audit': 'benchmarking',
                                  'Fractional CFO': 'fractional_cfo',
                                  'Systems Audit': 'systems_audit',
                                  'Systems & Process Audit': 'systems_audit',
                                  'Business Intelligence': 'quarterly_bi',
                                  'Management Accounts': 'quarterly_bi',
                                };
                                const codeToCatalogue: Record<string, string> = {
                                  '365_method': 'goal_alignment',
                                  'benchmarking': 'benchmarking',
                                  'fractional_cfo': 'fractional_cfo',
                                  'systems_audit': 'systems_audit',
                                  'business_intelligence': 'quarterly_bi',
                                  'hidden_value_audit': 'benchmarking',
                                  'management_accounts': 'quarterly_bi',
                                };
                                const cleanName = phase.enabledBy.replace(/\s*\(£[\d,]+.*$/, '').trim();
                                const catalogueCode =
                                  codeToCatalogue[phase.enabledByCode || ''] ||
                                  nameToCatalogue[cleanName] ||
                                  nameToCatalogue[phase.enabledBy] ||
                                  'benchmarking';
                                setPopupCatalogueCode(catalogueCode);
                              }}
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

          {/* How We Can Help / recommended services: admin-only; not shown in client portal */}

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
                  {page4.headerLine || "The Investment in Your Future"}
                </h2>
              </div>

              {/* Business Value Insights - Full 8 Metrics */}
              {(() => {
                // Get comprehensive analysis from newReport (Pass 1/2 format)
                const ca = newReport?.comprehensive_analysis;
                
                // Check if we have any metrics to show
                const hasMetrics = page4.indicativeValuation || page4.hasIndicativeValuation ||
                  ca?.valuation?.hasData || ca?.hiddenAssets?.hasData || ca?.grossMargin?.hasData ||
                  ca?.exitReadiness?.score || ca?.payroll?.annualExcess || ca?.trajectory?.hasData ||
                  ca?.productivity?.hasData || ca?.costOfInaction?.totalOverHorizon;
                
                if (!hasMetrics) return null;
                
                // Build metrics array
                const metrics: { icon: string; label: string; value: string; subtext?: string; color: string }[] = [];
                
                // 1. Indicative Valuation
                if (page4.indicativeValuation) {
                  metrics.push({
                    icon: '💰', label: 'Indicative Value', value: page4.indicativeValuation,
                    subtext: page4.valuationMethod === 'net_asset_value' ? 'Net asset value' : 'Enterprise value range',
                    color: 'emerald'
                  });
                } else if (ca?.valuation?.enterpriseValueLow && ca?.valuation?.enterpriseValueHigh) {
                  metrics.push({
                    icon: '💰', label: 'Indicative Value',
                    value: `£${(ca.valuation.enterpriseValueLow / 1000000).toFixed(1)}M - £${(ca.valuation.enterpriseValueHigh / 1000000).toFixed(1)}M`,
                    subtext: 'Enterprise value range', color: 'emerald'
                  });
                }
                
                // 2. Hidden Assets
                if (page4.hiddenAssetsTotal || page4.hiddenAssets?.total) {
                  metrics.push({
                    icon: '💎', label: 'Hidden Assets',
                    value: page4.hiddenAssetsTotal || page4.hiddenAssets?.total,
                    subtext: page4.hiddenAssets?.breakdown || 'Outside earnings valuation', color: 'purple'
                  });
                } else if (ca?.hiddenAssets?.totalHiddenAssets > 50000) {
                  metrics.push({
                    icon: '💎', label: 'Hidden Assets',
                    value: `£${Math.round(ca.hiddenAssets.totalHiddenAssets / 1000)}k`,
                    subtext: ca.hiddenAssets.excessCash ? 'Excess cash' : 'Outside earnings valuation', color: 'purple'
                  });
                }
                
                // 3. Gross Margin (avoid duplicate: value = %, subtext = assessment only)
                if (page4.grossMarginStrength) {
                  const gmMatch = page4.grossMarginStrength.match(/([\d.]+%)/);
                  const gmValue = gmMatch ? gmMatch[1] : page4.grossMarginStrength;
                  const gmAssessment = page4.grossMarginStrength.includes(' - ')
                    ? page4.grossMarginStrength.split(' - ')[1]
                    : (ca?.grossMargin?.assessment ? `${ca.grossMargin.assessment} for industry` : undefined);
                  const extraNote = (page4 as any).grossMarginIsStructural && (page4 as any).operatingMarginPct
                    ? `No cost of sales — operating margin of ${(page4 as any).operatingMarginPct}% is the meaningful measure`
                    : undefined;
                  metrics.push({
                    icon: '📈', label: 'Gross Margin', value: gmValue,
                    subtext: gmAssessment, color: 'blue', ...(extraNote && { extraNote })
                  });
                } else if (ca?.grossMargin?.grossMarginPct) {
                  metrics.push({
                    icon: '📈', label: 'Gross Margin', value: `${ca.grossMargin.grossMarginPct.toFixed(1)}%`,
                    subtext: `${ca.grossMargin.assessment || 'Good'} for industry`, color: 'blue'
                  });
                }
                
                // 4. Exit Readiness
                if (ca?.exitReadiness?.score) {
                  const pct = Math.round((ca.exitReadiness.score / ca.exitReadiness.maxScore) * 100);
                  const exitSubtext = (page4 as any).exitReadinessNote
                    ?? (ca.exitReadiness.readiness === 'ready' ? 'Ready to sell' :
                        ca.exitReadiness.readiness === 'nearly' ? 'Nearly ready' : 'Work needed');
                  metrics.push({
                    icon: '🚪', label: 'Exit Readiness', value: `${pct}%`,
                    subtext: exitSubtext, color: 'orange'
                  });
                }
                
                // 5. Payroll Efficiency
                if (ca?.payroll?.annualExcess && ca.payroll.annualExcess > 10000) {
                  metrics.push({
                    icon: '👥', label: 'Payroll Excess',
                    value: `£${Math.round(ca.payroll.annualExcess / 1000)}k/year`,
                    subtext: `${ca.payroll.payrollPct?.toFixed(1)}% vs ${ca.payroll.benchmarkPct?.toFixed(1)}% benchmark`, color: 'rose'
                  });
                }
                
                // 6. Revenue Trajectory
                if (ca?.trajectory?.hasData && ca.trajectory.trend) {
                  const trendEmoji = ca.trajectory.trend === 'growing' ? '📈' : 
                                     ca.trajectory.trend === 'stable' ? '➡️' : '📉';
                  metrics.push({
                    icon: trendEmoji, label: 'Revenue Trend',
                    value: ca.trajectory.trend.charAt(0).toUpperCase() + ca.trajectory.trend.slice(1),
                    subtext: ca.trajectory.changePercent ? `${ca.trajectory.changePercent > 0 ? '+' : ''}${ca.trajectory.changePercent.toFixed(1)}% YoY` : undefined,
                    color: ca.trajectory.trend === 'growing' ? 'green' : ca.trajectory.trend === 'stable' ? 'slate' : 'amber'
                  });
                }
                
                // 7. Productivity (suppressed for investment vehicles / small teams)
                if (!(page4 as any).productivitySuppressed && ca?.productivity?.hasData && ca.productivity.revenuePerHead) {
                  const gap = ca.productivity.benchmarkRPH ? 
                    Math.round(((ca.productivity.benchmarkRPH - ca.productivity.revenuePerHead) / ca.productivity.benchmarkRPH) * 100) : null;
                  metrics.push({
                    icon: '⚡', label: 'Revenue per Head',
                    value: `£${Math.round(ca.productivity.revenuePerHead / 1000)}k`,
                    subtext: gap && gap > 5 ? `${gap}% below benchmark` : 'At or above benchmark', color: 'indigo'
                  });
                }
                
                // 8. Cost of Inaction
                if (ca?.costOfInaction?.totalOverHorizon && ca.costOfInaction.totalOverHorizon > 50000) {
                  metrics.push({
                    icon: '⏱️', label: 'Cost of Delay',
                    value: `£${Math.round(ca.costOfInaction.totalOverHorizon / 1000)}k+`,
                    subtext: `Over ${ca.costOfInaction.timeHorizon || 2} years`, color: 'red'
                  });
                }
                
                if (metrics.length === 0) return null;
                
                return (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 mb-6 border border-emerald-200">
                  <h3 className="text-lg font-medium text-emerald-800 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    💎 Business Value Insights
                    <span className="text-sm font-normal text-emerald-600 ml-2">({metrics.length} metrics)</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {metrics.map((m, idx) => (
                      <div key={idx} className="bg-white/60 rounded-lg p-4">
                        <p className={`text-sm text-${m.color}-600 mb-1`}>{m.icon} {m.label}</p>
                        <p className={`text-xl font-bold text-${m.color}-800`}>{m.value}</p>
                        {m.subtext && <p className="text-xs text-gray-500 mt-1">{m.subtext}</p>}
                        {(m as any).extraNote && <p className="text-xs text-slate-500 mt-1">{(m as any).extraNote}</p>}
                      </div>
                    ))}
                  </div>
                  {/* NAV-based valuation note for investment vehicles */}
                  {(page4 as any).valuationMethod === 'net_asset_value' && (page4 as any).valuationNote && (
                    <p className="text-xs text-slate-500 mt-3 italic">{(page4 as any).valuationNote}</p>
                  )}
                  
                  {/* Data Quality Indicator */}
                  {ca?.dataQuality && (
                    <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center gap-2 text-xs text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${
                        ca.dataQuality === 'comprehensive' ? 'bg-green-500' :
                        ca.dataQuality === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      Data quality: {ca.dataQuality}
                      {ca.availableMetrics?.length > 0 && (
                        <span className="ml-1">• {ca.availableMetrics.length} dimensions analyzed</span>
                      )}
                    </div>
                  )}
                </div>
                );
              })()}

              {/* Cost of Staying */}
              {page4.costOfStaying && (
                <div className="bg-rose-50 rounded-xl p-6 mb-6 border border-rose-100">
                  <h3 className="text-lg font-medium text-rose-800 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    What Staying Here Costs
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Labour inefficiency', value: page4.costOfStaying.labourInefficiency },
                      { label: 'Margin leakage', value: page4.costOfStaying.marginLeakage },
                      { label: 'Your time', value: page4.costOfStaying.yourTimeWasted },
                    ].filter(item => item.value).map((item, idx) => {
                      const value = String(item.value);
                      const isQuantified = value.length <= 40;
                      return isQuantified ? (
                        <div key={idx} className="flex justify-between items-baseline text-rose-700 py-1">
                          <span className="text-rose-600">{item.label}</span>
                          <span className="font-semibold text-rose-800">{value}</span>
                        </div>
                      ) : (
                        <div key={idx} className="text-rose-700 py-2 border-b border-rose-100 last:border-b-0">
                          <span className="font-semibold text-rose-800 text-sm uppercase tracking-wide block mb-1">{item.label}</span>
                          <span className="text-sm leading-relaxed">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                  {page4.personalCost && (
                    <div className="mt-4 pt-4 border-t border-rose-200">
                      <p className="text-rose-800 italic">{page4.personalCost}</p>
                    </div>
                  )}
                </div>
              )}

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
                        <span className="font-medium text-emerald-800">{page4.totalYear1Label || 'To start the journey'}</span>
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
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm font-medium text-slate-500 mb-2">Conservative</p>
                      <p className="text-2xl font-bold text-emerald-700">{page4.returns.conservative?.total || page4.returns.conservative}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-sm font-medium text-emerald-600 mb-2">Realistic</p>
                      <p className="text-2xl font-bold text-emerald-700">{page4.returns.realistic?.total || page4.returns.realistic}</p>
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
                  {page5.thisWeek.tone && (
                    <p className="text-slate-500">{page5.thisWeek.tone}</p>
                  )}
                </div>
              )}

              {/* First Step */}
              {page5.firstStep && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6 border border-amber-200">
                  <h3 className="text-lg font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Your First Step
                  </h3>
                  {page5.firstStep.headline && (
                    <p className="text-xl text-amber-900 font-medium mb-2">
                      {page5.firstStep.headline}
                    </p>
                  )}
                  <p className="text-amber-800 mb-4">
                    {page5.firstStep.recommendation}
                  </p>
                  {page5.firstStep.simpleCta && (
                    <p className="text-lg font-semibold text-amber-900">
                      {page5.firstStep.simpleCta}
                    </p>
                  )}
                </div>
              )}

              {/* Closing Message */}
              {page5.closingMessage && (
                <div className="bg-slate-800 rounded-xl p-8 mb-6">
                  <p className="text-slate-100 text-lg leading-relaxed mb-6 whitespace-pre-wrap">
                    {page5.closingMessage}
                  </p>
                  
                  <button 
                    onClick={() => navigate('/appointments')}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center justify-center gap-3"
                  >
                    <Phone className="h-5 w-5" />
                    Book a Conversation
                  </button>
                  
                  {page5.closingLine && (
                    <p className="text-amber-400 font-medium text-lg text-center mt-4">
                      {page5.closingLine}
                    </p>
                  )}
                </div>
              )}

              {/* The Ask - fallback if no closingMessage */}
              {!page5.closingMessage && page5.theAsk && (
                <div className="bg-slate-800 rounded-xl p-8 text-center">
                  <p className="text-slate-300 text-lg mb-6">
                    {page5.theAsk}
                  </p>
                  
                  <button 
                    onClick={() => navigate('/appointments')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-4 rounded-lg font-semibold text-lg transition-colors inline-flex items-center gap-3"
                  >
                    <Phone className="h-5 w-5" />
                    Book a Conversation
                  </button>
                </div>
              )}
            </section>
          )}

        </main>

        {/* Universal service recommendation popup (catalogue) */}
        <ServiceRecommendationPopup
          isOpen={!!popupCatalogueCode}
          onClose={() => setPopupCatalogueCode(null)}
          serviceCode={popupCatalogueCode || ''}
        />

        {/* Footer */}
        <footer className="bg-slate-800 border-t border-slate-700 mt-12">
          <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-300">
            <p>This report was prepared specifically for you based on your discovery responses.</p>
            <p className="mt-1 text-slate-400">Questions? Reach out to your advisor directly.</p>
            <p className="mt-2 text-xs font-medium text-slate-300">RPGCC • London Chartered Accountants and Auditors</p>
            <p className="mt-1 text-xs text-slate-500">RPGCC is a trading name of RPG Crouch Chapman LLP</p>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // RENDER LEGACY FORMAT (Stage 3 - client_reports)
  // ============================================================================
  if (!legacyReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate('/portal')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </button>

          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Report is Being Prepared</h1>
            <p className="text-gray-600 mb-6">
              Our team is reviewing your discovery responses and preparing personalized insights for you.
              We'll notify you when it's ready.
            </p>
            <button
              onClick={() => navigate('/portal')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const report = legacyReport;
  const analysis = report.report_data?.analysis || {};
  const scores = report.report_data?.discoveryScores || {};
  const summary = analysis.executiveSummary || {};
  const gaps = analysis.gapAnalysis || {};
  const investments = analysis.recommendedInvestments || [];
  const investmentSummary = analysis.investmentSummary || {};
  const closing = analysis.closingMessage;

  // Get clarity as percentage
  const clarityPercent = (scores.clarityScore || 7) * 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/portal')}
            className="flex items-center gap-2 text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <Logo variant="dark" size="sm" />
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-slate-300 hidden sm:inline">Your Discovery Insights</span>
          </div>
          {/* PDF Export Button */}
          <button
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {exportingPDF ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section - Sympathetic Opening */}
        <section className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 md:p-12 text-white">
          <div className="flex items-center gap-2 text-blue-200 mb-4">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">We heard you</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            {summary.headline || "We've listened to your story"}
          </h1>
          
          <p className="text-blue-100 text-lg leading-relaxed mb-6">
            Thank you for sharing so openly with us. What you've told us paints a clear picture 
            of where you want to be – and the challenges standing in your way.
          </p>

          {/* Clarity Indicator */}
          <div className="bg-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-blue-100">Your Vision Clarity</span>
              <span className="text-2xl font-bold">{clarityPercent}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${clarityPercent}%` }}
              />
            </div>
            <p className="text-sm text-blue-200 mt-2">
              You know where you want to go – now let's close the gap together
            </p>
          </div>
        </section>

        {/* What You Told Us */}
        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Destination</h2>
              <p className="text-sm text-gray-500">What you're working towards</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 mb-6">
            <p className="text-lg text-gray-800 italic leading-relaxed">
              "{summary.destinationVision || "Financial freedom and time with family"}"
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">What's in the way</p>
              <p className="text-gray-800">
                {summary.currentReality || "Day-to-day demands leaving no time for strategic thinking"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500 mb-1">The key insight</p>
              <p className="text-gray-800">
                {summary.criticalInsight || "You need visibility and systems before you can step back"}
              </p>
            </div>
          </div>
        </section>

        {/* The Gap - Gentle Framing */}
        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">What's Holding You Back</h2>
              <p className="text-sm text-gray-500">The gaps we've identified together</p>
            </div>
          </div>

          <div className="space-y-4">
            {gaps.primaryGaps?.map((gap: any, idx: number) => {
              // Severity color mapping
              const severityColors = {
                critical: { 
                  border: 'border-l-red-500', 
                  bg: 'bg-red-50/30', 
                  badge: 'bg-red-100 text-red-700',
                  icon: '🔴'
                },
                high: { 
                  border: 'border-l-orange-500', 
                  bg: 'bg-orange-50/30', 
                  badge: 'bg-orange-100 text-orange-700',
                  icon: '🟠'
                },
                medium: { 
                  border: 'border-l-blue-400', 
                  bg: 'bg-blue-50/30', 
                  badge: 'bg-blue-100 text-blue-700',
                  icon: '🟡'
                }
              };
              
              const severity = (gap.severity || 'medium').toLowerCase();
              const colors = severityColors[severity as keyof typeof severityColors] || severityColors.medium;
              
              // Extract impact items
              const impactItems: string[] = [];
              if (gap.currentImpact?.financialImpact) impactItems.push(gap.currentImpact.financialImpact);
              if (gap.currentImpact?.timeImpact) impactItems.push(gap.currentImpact.timeImpact);
              if (gap.currentImpact?.emotionalImpact) impactItems.push(gap.currentImpact.emotionalImpact);
              if (gap.impact && typeof gap.impact === 'string') impactItems.push(gap.impact);
              if (Array.isArray(gap.impact)) impactItems.push(...gap.impact);
              
              return (
                <div 
                  key={idx} 
                  className={`border-l-4 ${colors.border} ${colors.bg} rounded-r-xl p-5 mb-4`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${colors.badge}`}>
                      {colors.icon} {severity.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {gap.category || 'GENERAL'}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 text-base md:text-lg">
                    {gap.gap}
                  </h3>
                  
                  {(gap.evidence || gap.evidenceQuote) && (
                    <blockquote className="text-sm text-indigo-600 italic mb-3 pl-3 border-l-2 border-indigo-200">
                      "{(gap.evidence || gap.evidenceQuote)}"
                    </blockquote>
                  )}
                  
                  {impactItems.length > 0 && (
                    <ul className="text-sm text-gray-600 space-y-1">
                      {impactItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Cost of waiting - using enhanced component */}
          {gaps.costOfInaction && (
            <div className="mt-6">
              <CostOfInactionCard 
                annualCost={gaps.costOfInaction.annualFinancialCost || gaps.costOfInaction.annual || "Significant"}
                description={gaps.costOfInaction.description}
                personalCost={gaps.costOfInaction.personalCost || "Time you won't get back, stress that compounds"}
              />
            </div>
          )}
        </section>

        {/* Transformation Journey - The Travel Agent View */}
        {analysis.transformationJourney && 
         analysis.transformationJourney.destination && 
         analysis.transformationJourney.phases && 
         analysis.transformationJourney.phases.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <TransformationJourney 
              journey={analysis.transformationJourney}
              investmentSummary={investmentSummary}
            />
          </section>
        )}

        {/* Legacy recommendedInvestments section removed - new 5-page format supersedes it */}
        {false && (
        <section className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Your Path Forward</h2>
              <p className="text-sm text-gray-500">How we can help you get there</p>
            </div>
          </div>

          <div className="space-y-6">
            {investments.map((inv: any, idx: number) => (
              <div 
                key={idx} 
                className={`rounded-xl p-6 ${
                  idx === 0 
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200' 
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                {idx === 0 && (
                  <span className="inline-block px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full mb-3">
                    Recommended Starting Point
                  </span>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{inv.service}</h3>
                    {inv.recommendedTier && (
                      <p className="text-sm text-gray-500">{inv.recommendedTier}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-emerald-600">
                      {inv.investment || inv.monthlyInvestment}
                    </p>
                    <p className="text-sm text-gray-500">
                      {inv.investmentFrequency === 'per month' ? 'per month' : 
                       inv.investmentFrequency === 'one-off' ? 'one-time investment' :
                       inv.annualInvestment ? `${inv.annualInvestment} annual` : ''}
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">
                  {inv.whyThisService || "Addresses your core challenges and moves you closer to your goals"}
                </p>

                {/* What you'll get */}
                {inv.expectedOutcomes && inv.expectedOutcomes.length > 0 && (
                  <div className="bg-white/70 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">What this means for you:</p>
                    <ul className="space-y-2">
                      {inv.expectedOutcomes.slice(0, 3).map((outcome: any, oIdx: number) => (
                        <li key={oIdx} className="flex items-start gap-2 text-sm text-gray-600">
                          <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ChevronRight className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span>{typeof outcome === 'string' ? outcome : outcome.outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Expected return */}
                {inv.expectedROI && (
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">{inv.expectedROI.multiplier} return</span>
                    </div>
                    <div className="text-gray-500">
                      within {inv.expectedROI.timeframe}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Investment Summary - Clean and Clear */}
          {investmentSummary.totalFirstYearInvestment && (
            <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 md:p-8 text-white">
              <h3 className="text-center text-sm font-medium uppercase tracking-wide text-slate-300 mb-6">
                Your Investment
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-white">
                    {investmentSummary.totalFirstYearInvestment}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">
                    First Year
                  </p>
                </div>
                
                <div className="text-center border-l border-r border-slate-600 px-4 md:px-6">
                  <p className="text-2xl md:text-3xl font-bold text-teal-400">
                    {investmentSummary.projectedFirstYearReturn || '—'}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">
                    Projected Return
                  </p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-white">
                    {investmentSummary.paybackPeriod || '—'}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">
                    Payback
                  </p>
              </div>
              </div>
              
              {investmentSummary.investmentAsPercentOfRevenue && (
                <p className="text-center text-sm text-slate-300 mb-2">
                  {investmentSummary.investmentAsPercentOfRevenue}
                </p>
              )}
              
              {investmentSummary.investmentBreakdown && (
                <p className="text-center text-xs text-slate-400">
                  {investmentSummary.investmentBreakdown}
                </p>
              )}
              
              {investmentSummary.roiCalculation && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-xs text-slate-400 text-center">
                    {investmentSummary.roiCalculation}
                  </p>
                  </div>
              )}
            </div>
          )}
        </section>
        )}

        {/* Enhanced Investment Summary with Metrics */}
        {investmentSummary.totalFirstYearInvestment && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Investment Summary</h2>
                <p className="text-sm text-gray-500">Your return on investment at a glance</p>
              </div>
            </div>
            
            {/* ROI Summary Card */}
            <ROISummaryCard
              totalInvestment={investmentSummary.totalFirstYearInvestment}
              projectedReturn={investmentSummary.projectedFirstYearReturn || '—'}
              paybackPeriod={investmentSummary.paybackPeriod || '—'}
              investmentAsPercent={investmentSummary.investmentAsPercentOfRevenue}
            />
            
            {/* Detailed Metrics Grid */}
            <MetricGrid columns={3}>
              <DiscoveryMetricCard
                label="Total Investment"
                value={investmentSummary.totalFirstYearInvestment}
                context="First year commitment"
                type="investment"
                status="neutral"
                highlight
              />
              <DiscoveryMetricCard
                label="Projected Return"
                value={investmentSummary.projectedFirstYearReturn || '—'}
                context="First year benefit"
                type="return"
                status="positive"
              />
              <DiscoveryMetricCard
                label="Payback Period"
                value={investmentSummary.paybackPeriod || '—'}
                context="Time to break even"
                type="payback"
                status={investmentSummary.paybackPeriod?.includes('month') ? 'positive' : 'neutral'}
              />
            </MetricGrid>
            
            {/* ROI Calculation Detail */}
            {investmentSummary.roiCalculation && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">
                  How We Calculated This
                </div>
                <p className="text-sm text-emerald-800 leading-relaxed">
                  {investmentSummary.roiCalculation}
                  </p>
                </div>
              )}
          </section>
        )}

        {/* Business Value Insights - Legacy format */}
        {/* Uses comprehensiveAnalysis from discovery_reports if available */}
        {(() => {
          const ca = comprehensiveAnalysis;
          const metrics: { icon: string; label: string; value: string; subtext?: string }[] = [];
          
          // 1. Indicative Valuation (from comprehensive_analysis)
          if (ca?.valuation?.enterpriseValueLow && ca?.valuation?.enterpriseValueHigh) {
            metrics.push({
              icon: '💰', label: 'Indicative Value',
              value: `£${(ca.valuation.enterpriseValueLow / 1000000).toFixed(1)}M - £${(ca.valuation.enterpriseValueHigh / 1000000).toFixed(1)}M`,
              subtext: 'Enterprise value range'
            });
          } else if ((summary as Record<string, unknown>)?.valuationRange) {
            metrics.push({ icon: '💰', label: 'Indicative Value', value: String((summary as Record<string, unknown>).valuationRange) });
          }
          
          // 2. Hidden Assets
          if (ca?.hiddenAssets?.totalHiddenAssets > 50000) {
            metrics.push({ 
              icon: '💎', label: 'Hidden Assets', 
              value: `£${Math.round(ca.hiddenAssets.totalHiddenAssets / 1000)}k`,
              subtext: ca.hiddenAssets.excessCash ? 'Excess cash' : 'Outside earnings valuation'
            });
          }
          
          // 3. Gross Margin
          if (ca?.grossMargin?.grossMarginPct) {
            metrics.push({ 
              icon: '📈', label: 'Gross Margin', 
              value: `${ca.grossMargin.grossMarginPct.toFixed(1)}%`,
              subtext: `${ca.grossMargin.assessment || 'Good'} for industry`
            });
          }
          
          // 4. Exit Readiness
          if (ca?.exitReadiness?.score) {
            const pct = Math.round((ca.exitReadiness.score / ca.exitReadiness.maxScore) * 100);
            metrics.push({ 
              icon: '🚪', label: 'Exit Readiness', 
              value: `${pct}%`,
              subtext: ca.exitReadiness.readiness === 'ready' ? 'Ready to sell' :
                       ca.exitReadiness.readiness === 'nearly' ? 'Nearly ready' : 'Work needed'
            });
          }
          
          // 5. Payroll Excess
          if (ca?.payroll?.annualExcess && ca.payroll.annualExcess > 10000) {
            metrics.push({ 
              icon: '👥', label: 'Payroll Excess', 
              value: `£${Math.round(ca.payroll.annualExcess / 1000)}k/year`,
              subtext: `${ca.payroll.payrollPct?.toFixed(1)}% vs ${ca.payroll.benchmarkPct?.toFixed(1)}% benchmark`
            });
          }
          
          // 6. Revenue Trajectory
          if (ca?.trajectory?.hasData && ca.trajectory.trend) {
            const trendEmoji = ca.trajectory.trend === 'growing' ? '📈' : 
                               ca.trajectory.trend === 'stable' ? '➡️' : '📉';
            metrics.push({
              icon: trendEmoji, label: 'Revenue Trend',
              value: ca.trajectory.trend.charAt(0).toUpperCase() + ca.trajectory.trend.slice(1),
              subtext: ca.trajectory.changePercent ? `${ca.trajectory.changePercent > 0 ? '+' : ''}${ca.trajectory.changePercent.toFixed(1)}% YoY` : undefined,
            });
          }
          
          // 7. Productivity
          if (ca?.productivity?.hasData && ca.productivity.revenuePerHead) {
            const gap = ca.productivity.benchmarkRPH ? 
              Math.round(((ca.productivity.benchmarkRPH - ca.productivity.revenuePerHead) / ca.productivity.benchmarkRPH) * 100) : null;
            metrics.push({
              icon: '⚡', label: 'Revenue per Head',
              value: `£${Math.round(ca.productivity.revenuePerHead / 1000)}k`,
              subtext: gap && gap > 5 ? `${gap}% below benchmark` : 'At or above benchmark',
            });
          }
          
          // 8. Cost of Inaction
          if (ca?.costOfInaction?.totalOverHorizon && ca.costOfInaction.totalOverHorizon > 50000) {
            metrics.push({
              icon: '⏱️', label: 'Cost of Delay',
              value: `£${Math.round(ca.costOfInaction.totalOverHorizon / 1000)}k+`,
              subtext: `Over ${ca.costOfInaction.timeHorizon || 2} years`
            });
          } else if (gaps?.costOfInaction?.annualFinancialCost) {
            metrics.push({ 
              icon: '⏱️', label: 'Cost of Delay', 
              value: gaps.costOfInaction.annualFinancialCost,
              subtext: 'Annual cost of inaction'
            });
          }
          
          if (metrics.length === 0) return null;
          
          return (
            <section className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-emerald-800">Business Value Insights</h2>
                <span className="text-sm text-emerald-600">({metrics.length} metrics)</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((m, idx) => (
                  <div key={idx} className="bg-white/60 rounded-lg p-4">
                    <p className="text-sm text-emerald-600 mb-1">{m.icon} {m.label}</p>
                    <p className="text-xl font-bold text-emerald-800">{m.value}</p>
                    {m.subtext && <p className="text-xs text-gray-500 mt-1">{m.subtext}</p>}
                  </div>
                ))}
              </div>
              
              {/* Data Quality Indicator */}
              {ca?.dataQuality && (
                <div className="mt-4 pt-3 border-t border-emerald-200 flex items-center gap-2 text-xs text-gray-500">
                  <span className={`w-2 h-2 rounded-full ${
                    ca.dataQuality === 'comprehensive' ? 'bg-green-500' :
                    ca.dataQuality === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                  Data quality: {ca.dataQuality}
                  {ca.availableMetrics?.length > 0 && (
                    <span className="ml-1">• {ca.availableMetrics.length} dimensions analyzed</span>
                  )}
            </div>
          )}
        </section>
          );
        })()}

        {/* Closing Message - Encouraging */}
        <section className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex items-center gap-2 text-indigo-200 mb-4">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium">A Note From Us</span>
          </div>

          {typeof closing === 'string' ? (
            <p className="text-lg leading-relaxed">{closing}</p>
          ) : closing ? (
            <div className="space-y-4">
              {closing.personalNote && (
                <p className="text-lg leading-relaxed italic">"{closing.personalNote}"</p>
              )}
              {closing.callToAction && (
                <p className="font-semibold text-xl">{closing.callToAction}</p>
              )}
            </div>
          ) : (
            <p className="text-lg leading-relaxed">
              We're here to help you build the business – and the life – you've described. 
              Let's take the first step together.
            </p>
          )}
        </section>

        {/* Call to Action */}
        {showCallToAction && (
          <section className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-2 border-emerald-200">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Take the Next Step?</h2>
              <p className="text-gray-600 mb-6">
                Let's discuss your path forward. Book a call with your advisor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/appointments')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <Calendar className="w-5 h-5" />
                  Book a Conversation
                </button>
                <button
                  onClick={() => navigate('/portal')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Return to Portal
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-slate-300">
          <p>This report was prepared specifically for you based on your discovery responses.</p>
          <p className="mt-1 text-slate-400">Questions? Reach out to your advisor directly.</p>
          <p className="mt-2 text-xs font-medium text-slate-300">RPGCC • London Chartered Accountants and Auditors</p>
          <p className="mt-1 text-xs text-slate-500">RPGCC is a trading name of RPG Crouch Chapman LLP</p>
        </div>
      </footer>
    </div>
  );
}
