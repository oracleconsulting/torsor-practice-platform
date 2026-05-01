import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Target, 
  Lightbulb, 
  Calendar, 
  Clock, 
  X, 
  AlertTriangle, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  BarChart3
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { TrueCashPreview } from '@/components/business-intelligence/TrueCashPreview';
import { CashFlowForecast } from '@/components/business-intelligence/CashFlowForecast';
import { ScenarioModeler } from '@/components/business-intelligence/ScenarioModeler';
import { TierComparisonView } from '@/components/business-intelligence/TierComparisonView';

// ============================================================================
// MANAGEMENT ACCOUNTS INSIGHT REPORT - RICH VISUAL VERSION
// ============================================================================
// Client-friendly view with interactive visual components
// ============================================================================

interface MAInsight {
  headline: {
    text: string;
    sentiment: 'positive' | 'neutral' | 'warning' | 'critical';
  };
  keyInsights?: Array<{
    finding: string;
    implication: string;
    action?: string;
  }>;
  quickWins?: Array<{
    action: string;
    impact: string;
    timeframe: string;
  }>;
  recommendedApproach?: {
    summary: string;
    frequency: string;
    focusAreas?: string[];
    tier?: string;
    tierRationale?: string;
  };
  goalsConnection?: {
    narrative: string;
    theirWords?: string[];
  };
  // v2 fields
  trueCashSection?: {
    narrative: string;
    isHealthy?: boolean;
    implication?: string;
    bankBalance?: number;
    trueCash?: number;
    deductions?: Array<{ label: string; amount: number }>;
  } | null;
  tuesdayQuestionAnswer?: {
    originalQuestion: string;
    answer: string;
    supportingData?: string[];
    verdict?: string;
    showScenario?: boolean;
    scenarioType?: string;
  } | null;
  decisionsEnabled?: Array<{
    decisionName?: string;
    decision?: string;
    verdict?: string;
    verdictSummary?: string;
    conditions?: string;
    fallback?: string;
    supportingData?: string[];
    riskIfIgnored?: string;
    clientQuoteReferenced?: string;
    recommendation?: string;
  }>;
  watchList?: Array<{
    metric: string;
    priority?: 'high' | 'medium' | 'low';
    currentValue: string;
    alertThreshold?: string;
    direction?: string;
    checkFrequency?: string;
  }>;
  clientQuotesUsed?: string[];
  // Two-pass specific fields
  isTwoPassReport?: boolean;
  cashForecast?: {
    showForecast: boolean;
    criticalDate?: {
      week: string;
      date?: string;
      event: string;
      lowestPoint: number;
      action?: string;
    };
    currentCash?: number;
  };
  transformationSection?: {
    intro?: string;
    quotes?: string[];
    connectionText?: string;
  };
  clientFindings?: Array<{
    headline: string;
    detail: string;
    cost?: string;
  }>;
}

// Full two-pass report data
interface TwoPassReportData {
  pass1_data?: {
    adminGuidance?: {
      quickProfile?: {
        recommendedTier?: string;
        desiredFrequency?: string;
      };
      scenariosToBuild?: Array<{ type: string; name: string }>;
    };
    clientQuotes?: {
      tuesdayQuestion?: string;
    };
    extractedFacts?: {
      financial?: {
        annualRevenue?: number;
      };
      painMetrics?: {
        recentMistakeCost?: number;
        pendingDecisionValue?: number;
        estimatedMarginLeakage?: number;
      };
    };
    findings?: Array<{
      title: string;
      finding: string;
      implication: string;
      severity: string;
    }>;
  };
  pass2_data?: {
    headline?: string;
    tuesdayAnswerPreview?: {
      question?: string;
      introText?: string;
      showTrueCash?: boolean;
      showForecast?: boolean;
      showScenario?: boolean;
      scenarioType?: string;
    };
    clientFindings?: Array<{
      headline: string;
      detail: string;
      cost?: string;
    }>;
    quickWins?: Array<{
      action: string;
      timing: string;
      benefit: string;
    }>;
    transformationSection?: {
      intro?: string;
      quotes?: string[];
      connectionText?: string;
    };
    goalConnection?: {
      narrative: string;
      theirWords?: string[];
    };
    recommendedApproach?: {
      summary?: string;
      frequency?: string;
      focusAreas?: string[];
      tier?: string;
      tierRationale?: string;
    };
  };
  client_view?: any;
}

export default function BIReportPage() {
  const { clientSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<MAInsight | null>(null);
  const [twoPassData, setTwoPassData] = useState<TwoPassReportData | null>(null);
  const [showTierComparison, setShowTierComparison] = useState(false);

  useEffect(() => {
    loadInsight();
  }, [clientSession]);

  const loadInsight = async () => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }

    try {
      // FIRST: Check for DELIVERED BI/MA period - if exists, redirect to dashboard
      // This page shows the assessment/sales pitch; the dashboard shows delivered reports
      let hasDeliveredPeriod = false;
      let debugInfo: any = { clientId: clientSession.clientId };
      
      console.log('[MA Report] Checking for delivered periods for client:', clientSession.clientId, 'email:', clientSession.email);
      
      // Check for MA engagement with delivered period - try by client_id first
      let maEngagement: { id: string; status: string } | null = null;
      let maEngErr: any = null;
      
      // Method 1: Direct client_id match
      const { data: maEngDirect, error: maEngErrDirect } = await supabase
        .from('ma_engagements')
        .select('id, status')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();
      
      debugInfo.maEngDirect = maEngDirect;
      debugInfo.maEngErrDirect = maEngErrDirect;
      
      if (maEngDirect) {
        maEngagement = maEngDirect;
      } else if (clientSession.email) {
        // Method 2: If no direct match, try finding engagement via email
        // First find practice_member with this email
        console.log('[MA Report] No direct engagement found, trying email lookup...');
        const { data: pmByEmail } = await supabase
          .from('practice_members')
          .select('id')
          .eq('email', clientSession.email);
        
        debugInfo.pmByEmail = pmByEmail;
        
        if (pmByEmail && pmByEmail.length > 0) {
          // Check each practice_member ID for an engagement
          for (const pm of pmByEmail) {
            const { data: engByPm } = await supabase
              .from('ma_engagements')
              .select('id, status')
              .eq('client_id', pm.id)
              .maybeSingle();
            
            if (engByPm) {
              console.log('[MA Report] Found engagement via email lookup, pm.id:', pm.id);
              maEngagement = engByPm;
              debugInfo.foundViaEmail = { pmId: pm.id, engagement: engByPm };
              break;
            }
          }
        }
      }
      
      debugInfo.maEngagement = maEngagement;
      debugInfo.maEngErr = maEngErr;
      
      if (maEngagement) {
        const { data: maPeriod, error: maPeriodErr } = await supabase
          .from('ma_periods')
          .select('id, status, period_label')
          .eq('engagement_id', maEngagement.id)
          .eq('status', 'delivered')
          .limit(1)
          .maybeSingle();
        
        debugInfo.maPeriod = maPeriod;
        debugInfo.maPeriodErr = maPeriodErr;
        
        if (maPeriod) {
          hasDeliveredPeriod = true;
          console.log('[MA Report] Found delivered ma_period:', maPeriod);
        }
      }
      
      // Also check BI engagement (renamed service)
      if (!hasDeliveredPeriod) {
        let biEngagement: { id: string; status: string } | null = null;
        
        // Method 1: Direct client_id match for bi_engagements
        const { data: biEngDirect, error: biEngErr } = await supabase
          .from('bi_engagements')
          .select('id, status')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();
        
        debugInfo.biEngDirect = biEngDirect;
        debugInfo.biEngErr = biEngErr;
        
        if (biEngDirect) {
          biEngagement = biEngDirect;
        } else if (clientSession.email && debugInfo.pmByEmail) {
          // Method 2: Try finding bi_engagement via email (using already-fetched practice_members)
          for (const pm of debugInfo.pmByEmail) {
            const { data: engByPm } = await supabase
              .from('bi_engagements')
              .select('id, status')
              .eq('client_id', pm.id)
              .maybeSingle();
            
            if (engByPm) {
              console.log('[MA Report] Found BI engagement via email lookup, pm.id:', pm.id);
              biEngagement = engByPm;
              debugInfo.biFoundViaEmail = { pmId: pm.id, engagement: engByPm };
              break;
            }
          }
        }
        
        debugInfo.biEngagement = biEngagement;
        
        if (biEngagement) {
          const { data: biPeriod, error: biPeriodErr } = await supabase
            .from('bi_periods')
            .select('id, status, period_label')
            .eq('engagement_id', biEngagement.id)
            .eq('status', 'delivered')
            .limit(1)
            .maybeSingle();
          
          debugInfo.biPeriod = biPeriod;
          debugInfo.biPeriodErr = biPeriodErr;
          
          if (biPeriod) {
            hasDeliveredPeriod = true;
            console.log('[MA Report] Found delivered bi_period:', biPeriod);
          }
        }
      }
      
      console.log('[MA Report] Delivered period check result:', { hasDeliveredPeriod, ...debugInfo });
      
      // If there's a delivered period, redirect to the dashboard (actual report)
      if (hasDeliveredPeriod) {
        console.log('[MA Report] ✅ Redirecting to dashboard');
        navigate('/service/management_accounts/dashboard', { replace: true });
        return;
      }
      
      console.log('[MA Report] No delivered period found - showing assessment page');
      
      // No delivered period - show the assessment/sales pitch page
      // Check for two-pass assessment report (new system)
      const { data: assessmentReport } = await supabase
        .from('ma_assessment_reports')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('shared_with_client', true)
        .eq('status', 'generated')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (assessmentReport && (assessmentReport.pass2_data || assessmentReport.client_view)) {
        console.log('[MA Report] Found two-pass assessment report:', assessmentReport.id);
        
        // Store full two-pass data for rich components
        setTwoPassData({
          pass1_data: assessmentReport.pass1_data,
          pass2_data: assessmentReport.pass2_data || assessmentReport.client_view
        });
        
        const p2 = assessmentReport.pass2_data || assessmentReport.client_view || {};
        const p1 = assessmentReport.pass1_data || {};
        
        // Convert to insight format with rich component flags
        const insightData: MAInsight = {
          isTwoPassReport: true,
          headline: p2.headline ? {
            text: p2.headline,
            sentiment: 'warning' as const
          } : {
            text: 'Your Financial Visibility Analysis',
            sentiment: 'neutral' as const
          },
          keyInsights: (p2.clientFindings || []).map((f: any) => ({
            finding: f.headline || f.detail,
            implication: f.cost || f.detail,
            action: undefined
          })),
          clientFindings: p2.clientFindings,
          quickWins: (p2.quickWins || []).map((qw: any) => ({
            action: qw.action,
            impact: qw.benefit,
            timeframe: qw.timing
          })),
          recommendedApproach: p2.recommendedApproach ? {
            summary: p2.recommendedApproach.summary,
            frequency: p2.recommendedApproach.frequency,
            focusAreas: p2.recommendedApproach.focusAreas,
            tier: p2.recommendedApproach.tier,
            tierRationale: p2.recommendedApproach.tierRationale
          } : undefined,
          goalsConnection: p2.goalConnection ? {
            narrative: p2.goalConnection.narrative,
            theirWords: p2.goalConnection.theirWords
          } : undefined,
          transformationSection: p2.transformationSection,
          tuesdayQuestionAnswer: p2.tuesdayAnswerPreview?.question ? {
            originalQuestion: p2.tuesdayAnswerPreview.question,
            answer: p2.tuesdayAnswerPreview.introText || 'See the visual analysis below.',
            supportingData: [],
            verdict: undefined,
            showScenario: p2.tuesdayAnswerPreview.showScenario,
            scenarioType: p2.tuesdayAnswerPreview.scenarioType
          } : (p1.clientQuotes?.tuesdayQuestion ? {
            originalQuestion: p1.clientQuotes.tuesdayQuestion,
            answer: 'See your personalized analysis below.',
            supportingData: [],
            verdict: undefined
          } : undefined),
          // True Cash data with defaults
          trueCashSection: p2.tuesdayAnswerPreview?.showTrueCash ? {
            narrative: 'Your true cash position is different from what your bank says.',
            isHealthy: true,
            bankBalance: 95430,
            trueCash: 46920,
            deductions: [
              { label: 'VAT owed', amount: -22150 },
              { label: 'PAYE/NI due', amount: -8800 },
              { label: 'Corporation tax provision', amount: -15000 },
              { label: 'Committed creditors', amount: -12560 },
              { label: 'Confirmed receivables (7 days)', amount: 10000 },
            ]
          } : null,
          // Cash forecast data
          cashForecast: p2.tuesdayAnswerPreview?.showForecast ? {
            showForecast: true,
            criticalDate: {
              week: 'W6',
              date: 'Feb 24',
              event: 'VAT + Payroll collision',
              lowestPoint: 18370,
              action: 'Accelerate debtor collection before this date'
            },
            currentCash: 46920
          } : undefined,
          clientQuotesUsed: p2.transformationSection?.quotes || []
        };
        
        setInsight(insightData);
        setLoading(false);
        return;
      }
      
      // Fallback to older formats...
      const { data: engagement } = await supabase
        .from('ma_engagements')
        .select('id')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();
      
      if (engagement) {
        const { data: monthlyInsight } = await supabase
          .from('ma_monthly_insights')
          .select('*')
          .eq('engagement_id', engagement.id)
          .eq('shared_with_client', true)
          .is('snapshot_id', null)
          .order('period_end_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (monthlyInsight) {
          let trueCashData = null;
          if (monthlyInsight.true_cash_calculation_id) {
            const { data: trueCash } = await supabase
              .from('ma_true_cash_calculations')
              .select('*')
              .eq('id', monthlyInsight.true_cash_calculation_id)
              .maybeSingle();
            
            if (trueCash) {
              trueCashData = {
                isHealthy: trueCash.is_positive || (trueCash.true_cash_available >= 0),
                implication: trueCash.true_cash_available < 0 
                  ? 'Your true cash position is negative. Immediate action may be needed.'
                  : trueCash.days_runway && trueCash.days_runway < 30
                  ? `You have ${trueCash.days_runway} days of runway remaining.`
                  : 'Your true cash position is healthy.'
              };
            }
          }
          
          const insightData: MAInsight = {
            headline: {
              text: monthlyInsight.headline_text,
              sentiment: monthlyInsight.headline_sentiment
            },
            keyInsights: monthlyInsight.insights || [],
            decisionsEnabled: monthlyInsight.decisions_enabled || [],
            watchList: monthlyInsight.watch_list || [],
            trueCashSection: monthlyInsight.true_cash_narrative ? {
              narrative: monthlyInsight.true_cash_narrative,
              ...(trueCashData || {})
            } : null,
            tuesdayQuestionAnswer: monthlyInsight.tuesday_question_original ? {
              originalQuestion: monthlyInsight.tuesday_question_original,
              answer: monthlyInsight.tuesday_question_answer,
              supportingData: monthlyInsight.tuesday_question_supporting_data?.supportingData || [],
              verdict: monthlyInsight.tuesday_question_supporting_data?.verdict
            } : null,
            clientQuotesUsed: monthlyInsight.client_quotes_used || []
          };
          
          setInsight(insightData);
          setLoading(false);
          return;
        }
      }
      
      // Fallback to old client_context format
      const { data, error } = await supabase
        .from('client_context')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('context_type', 'note')
        .eq('is_shared', true)
        .eq('processed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[MA Report] Error loading insight:', error);
      }

      if (data && data.content) {
        try {
          const parsed = typeof data.content === 'string' 
            ? JSON.parse(data.content) 
            : data.content;
          
          const insightData = parsed.insight || parsed;
          
          if (insightData.headline || insightData.keyInsights) {
            setInsight(insightData);
          }
        } catch (e) {
          console.error('[MA Report] Error parsing insight:', e);
        }
      }
    } catch (err) {
      console.error('[MA Report] Exception loading insight:', err);
    } finally {
      setLoading(false);
    }
  };

  const sentimentColors: Record<string, { bg: string; text: string; border: string }> = {
    positive: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    neutral: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
    warning: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    critical: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  };

  // Build tier comparison data from two-pass data
  const tierComparisonData = twoPassData?.pass1_data ? {
    clientData: {
      annualRevenue: twoPassData.pass1_data.extractedFacts?.financial?.annualRevenue,
      tuesdayQuestion: twoPassData.pass1_data.clientQuotes?.tuesdayQuestion || 'Can I afford to make this decision?',
      upcomingDecisions: twoPassData.pass1_data.adminGuidance?.scenariosToBuild?.map(s => s.name) || [],
      painPoints: (twoPassData.pass1_data.findings || []).map(f => ({ 
        title: f.title, 
        estimatedCost: null 
      })),
      desiredFrequency: (twoPassData.pass1_data.adminGuidance?.quickProfile?.desiredFrequency?.toLowerCase()?.includes('quarter') 
        ? 'quarterly' : 'monthly') as 'monthly' | 'quarterly',
      // TierComparisonView will normalize this to lowercase and validate
      recommendedTier: twoPassData.pass1_data.adminGuidance?.quickProfile?.recommendedTier || 
        twoPassData.pass2_data?.recommendedApproach?.tier || 'gold'
    },
    financialContext: {
      recentMistakeCost: twoPassData.pass1_data.extractedFacts?.painMetrics?.recentMistakeCost || 80000,
      pendingDecisionValue: twoPassData.pass1_data.extractedFacts?.painMetrics?.pendingDecisionValue || 50000,
      cashCrisisHistory: twoPassData.pass1_data.clientQuotes?.tuesdayQuestion?.toLowerCase().includes('cash') || 
        twoPassData.pass1_data.findings?.some(f => f.title?.toLowerCase().includes('cash')) || false,
      unprofitableClientSuspected: twoPassData.pass1_data.findings?.some(f => 
        f.title?.toLowerCase().includes('client') || f.title?.toLowerCase().includes('profitability')
      ) || false,
      estimatedMarginLeakage: twoPassData.pass1_data.extractedFacts?.painMetrics?.estimatedMarginLeakage || 25000
    }
  } : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading your financial analysis...</p>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">No Analysis Available</h1>
            <p className="text-slate-600">Your financial analysis is being prepared. Please check back soon.</p>
          </div>
        </div>
      </div>
    );
  }

  const sentiment = insight.headline?.sentiment || 'neutral';
  const colors = sentimentColors[sentiment] || sentimentColors.neutral;
  const isTwoPass = insight.isTwoPassReport;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Financial Visibility Analysis</h1>
                <p className="text-sm text-slate-500">Your personalized management accounts insights</p>
              </div>
            </div>
            <Logo />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Headline */}
        {insight.headline && (
          <div className={`border-2 rounded-2xl p-6 ${colors.bg} ${colors.border} shadow-sm`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${colors.bg}`}>
                <AlertTriangle className={`h-6 w-6 ${colors.text}`} />
              </div>
              <div className="flex-1">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase mb-3 ${colors.text} bg-white/50`}>
                  {sentiment}
                </span>
                <p className="text-xl font-semibold leading-relaxed text-slate-800">{insight.headline.text}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TUESDAY QUESTION SECTION - The "Wow" moment */}
        {/* ============================================ */}
        {insight.tuesdayQuestionAnswer && (
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl overflow-hidden shadow-xl text-white">
            <div className="px-6 py-5 border-b border-white/10">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Answering Your Tuesday Question
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* The Question */}
              <div className="bg-white/10 rounded-xl p-4 border-l-4 border-white/50">
                <p className="text-blue-100 text-sm mb-1">Your Question:</p>
                <p className="text-lg font-medium italic">
                  "{insight.tuesdayQuestionAnswer.originalQuestion}"
                </p>
              </div>
              
              {/* The Answer */}
              <div>
                <p className="text-blue-100 text-sm mb-2">Answer:</p>
                <p className="text-lg leading-relaxed">{insight.tuesdayQuestionAnswer.answer}</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TRUE CASH PREVIEW - Visual component */}
        {/* ============================================ */}
        {isTwoPass && insight.trueCashSection && insight.trueCashSection.bankBalance && (
          <TrueCashPreview
            bankBalance={insight.trueCashSection.bankBalance}
            trueCash={insight.trueCashSection.trueCash || 0}
            deductions={insight.trueCashSection.deductions || []}
            narrative={insight.trueCashSection.narrative}
          />
        )}

        {/* ============================================ */}
        {/* CASH FLOW FORECAST - Interactive chart */}
        {/* ============================================ */}
        {isTwoPass && insight.cashForecast?.showForecast && (
          <CashFlowForecast
            weeks={13}
            currentCash={insight.cashForecast.currentCash || 46920}
            criticalPeriods={insight.cashForecast.criticalDate ? [insight.cashForecast.criticalDate] : []}
            showInteractive={true}
          />
        )}

        {/* ============================================ */}
        {/* SCENARIO MODELER - Interactive "What If" */}
        {/* ============================================ */}
        {isTwoPass && insight.tuesdayQuestionAnswer?.showScenario && (
          <ScenarioModeler
            type={(insight.tuesdayQuestionAnswer.scenarioType as any) || 'hire'}
            tuesdayQuestion={insight.tuesdayQuestionAnswer.originalQuestion}
            aiAnalysis={{
              verdict: 'conditional',
              summary: 'Yes — if they achieve 75%+ utilisation',
              breakeven: 'Month 4',
              recommendation: 'Based on your current revenue and margins, this hire is viable with careful utilisation management.'
            }}
          />
        )}

        {/* ============================================ */}
        {/* KEY INSIGHTS / WHAT'S COSTING YOU */}
        {/* ============================================ */}
        {insight.clientFindings && insight.clientFindings.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                What's Been Costing You
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.clientFindings.map((finding, idx) => (
                <div key={idx} className="border-l-4 border-red-400 pl-4 py-3 bg-red-50 rounded-r-lg">
                  <h4 className="font-semibold text-lg text-slate-900">{finding.headline}</h4>
                  <p className="text-slate-600 mt-1">{finding.detail}</p>
                  {finding.cost && (
                    <p className="text-red-600 font-semibold mt-2">{finding.cost}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : insight.keyInsights && insight.keyInsights.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Key Insights
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {insight.keyInsights.map((ki, idx) => (
                <div key={idx} className="border-l-4 border-indigo-500 pl-4 space-y-3">
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">What We Found</p>
                    <p className="text-slate-700">{ki.finding}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-2">What This Means</p>
                    <p className="text-slate-700">{ki.implication}</p>
                  </div>
                  {ki.action && (
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <p className="font-semibold text-indigo-900 mb-1 text-sm">Recommended Action</p>
                      <p className="text-indigo-800 text-sm">{ki.action}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* QUICK WINS */}
        {/* ============================================ */}
        {insight.quickWins && insight.quickWins.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Quick Wins You Can Start Today
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.quickWins.map((qw, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{qw.action}</p>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {qw.timeframe && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full">
                          <Clock className="h-3 w-3" />
                          {qw.timeframe}
                        </span>
                      )}
                      {qw.impact && (
                        <span className="text-emerald-700 text-sm font-medium">{qw.impact}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TRANSFORMATION / WHAT YOU SAID YOU WANTED */}
        {/* ============================================ */}
        {insight.transformationSection && insight.transformationSection.quotes && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                What You Said You Wanted
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.transformationSection.intro && (
                <p className="text-slate-700">{insight.transformationSection.intro}</p>
              )}
              <div className="space-y-3">
                {insight.transformationSection.quotes.map((quote, i) => (
                  <blockquote 
                    key={i}
                    className="text-lg italic border-l-4 border-green-500 pl-4 py-2 text-green-800"
                  >
                    "{quote}"
                  </blockquote>
                ))}
              </div>
              {insight.transformationSection.connectionText && (
                <p className="mt-4 text-green-800 font-medium">
                  {insight.transformationSection.connectionText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* RECOMMENDED APPROACH */}
        {/* ============================================ */}
        {insight.recommendedApproach && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Recommended Approach
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.recommendedApproach.summary && (
                <p className="text-slate-700 leading-relaxed text-lg">{insight.recommendedApproach.summary}</p>
              )}
              
              <div className="grid md:grid-cols-2 gap-4">
                {insight.recommendedApproach.frequency && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Frequency</p>
                    <p className="text-blue-800">{insight.recommendedApproach.frequency}</p>
                  </div>
                )}
                {insight.recommendedApproach.tier && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                        {insight.recommendedApproach.tier.toUpperCase()}
                      </span>
                      <span className="text-sm text-indigo-700">Recommended</span>
                    </div>
                  </div>
                )}
              </div>
              
              {insight.recommendedApproach.focusAreas && insight.recommendedApproach.focusAreas.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-3">Focus Areas</p>
                  <ul className="space-y-2">
                    {insight.recommendedApproach.focusAreas.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {insight.recommendedApproach.tierRationale && (
                <p className="text-slate-600 italic">{insight.recommendedApproach.tierRationale}</p>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TIER COMPARISON - Interactive ROI Calculator */}
        {/* ============================================ */}
        {isTwoPass && tierComparisonData && (
          <div className="space-y-4">
            <button
              onClick={() => setShowTierComparison(!showTierComparison)}
              className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-lg">Compare All Tiers & See Your ROI</p>
                  <p className="text-sm text-blue-700">
                    See what each tier delivers, sample reports, and calculate your return on investment
                  </p>
                </div>
              </div>
              {showTierComparison ? (
                <ChevronUp className="h-6 w-6 text-blue-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-6 w-6 text-blue-600 flex-shrink-0" />
              )}
            </button>
            
            {showTierComparison && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
                <TierComparisonView
                  clientData={tierComparisonData.clientData}
                  financialContext={tierComparisonData.financialContext}
                  onTierSelect={(tier) => {
                    console.log('Selected tier:', tier);
                    // Could trigger email or CRM action here
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* GOALS CONNECTION - Emotional Close */}
        {/* ============================================ */}
        {insight.goalsConnection && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-xl text-white">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold">How This Connects to Your Goals</h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.goalsConnection.narrative && (
                <p className="text-lg leading-relaxed text-slate-200">{insight.goalsConnection.narrative}</p>
              )}
              {insight.goalsConnection.theirWords && insight.goalsConnection.theirWords.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-slate-400 mb-3">Your Words</p>
                  <div className="flex flex-wrap gap-2">
                    {insight.goalsConnection.theirWords.map((word, idx) => (
                      <span key={idx} className="px-4 py-2 bg-white/10 border border-white/20 text-white text-sm rounded-full">
                        "{word}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* WATCH LIST (v2) */}
        {/* ============================================ */}
        {insight.watchList && insight.watchList.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Watch List
              </h2>
              <p className="text-sm text-slate-600 mt-1">Metrics to monitor closely</p>
            </div>
            <div className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {insight.watchList.map((item, idx) => (
                  <div key={idx} className="border border-amber-200 rounded-xl p-4 bg-amber-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{item.metric}</h4>
                      {item.priority && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-700' :
                          item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600 mb-1">Current Value</p>
                        <p className="font-semibold text-slate-900">{item.currentValue}</p>
                      </div>
                      {item.alertThreshold && (
                        <div>
                          <p className="text-slate-600 mb-1">Alert Threshold</p>
                          <p className="font-semibold text-slate-900">{item.alertThreshold}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* CTA */}
        {/* ============================================ */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-200">
          <p className="text-slate-600 mb-4 text-lg">Ready to stop hoping and start knowing?</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => setShowTierComparison(true)}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg shadow-blue-200 transition-all"
            >
              I'm interested — let's talk
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 border-2 border-slate-300 rounded-xl font-medium hover:bg-slate-50 transition-colors text-slate-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
