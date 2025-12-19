import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, TrendingUp, CheckCircle, AlertCircle, Target, Lightbulb, Calendar, Clock, X, AlertTriangle, MessageSquare } from 'lucide-react';
import { Logo } from '@/components/Logo';

// ============================================================================
// MANAGEMENT ACCOUNTS INSIGHT REPORT
// ============================================================================
// Client-friendly view of the AI-generated financial insights
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
  } | null;
  tuesdayQuestionAnswer?: {
    originalQuestion: string;
    answer: string;
    supportingData?: string[];
    verdict?: string;
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
}

export default function MAReportPage() {
  const { clientSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<MAInsight | null>(null);

  useEffect(() => {
    loadInsight();
  }, [clientSession]);

  const loadInsight = async () => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }

    try {
      // First check v2 insights from ma_monthly_insights
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
          .is('snapshot_id', null) // v2 insights only
          .order('period_end_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (monthlyInsight) {
          // Fetch true cash calculation if available
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
          
          // Convert v2 format to expected format
          const insightData = {
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
          
          // Handle both direct insight and nested insight structure
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Available</h1>
            <p className="text-gray-600">Your financial analysis is being prepared. Please check back soon.</p>
          </div>
        </div>
      </div>
    );
  }

  const sentiment = insight.headline?.sentiment || 'neutral';
  const colors = sentimentColors[sentiment] || sentimentColors.neutral;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Financial Visibility Analysis</h1>
                <p className="text-sm text-gray-500">Management Accounts Insights</p>
              </div>
            </div>
            <Logo />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Headline */}
        {insight.headline && (
          <div className={`border-2 rounded-xl p-6 ${colors.bg} ${colors.border}`}>
            <div className="flex items-start justify-between mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${colors.text} ${colors.bg}`}>
                {sentiment}
              </span>
            </div>
            <p className="text-xl font-semibold leading-relaxed">{insight.headline.text}</p>
          </div>
        )}

        {/* Key Insights */}
        {insight.keyInsights && insight.keyInsights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Key Insights
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {insight.keyInsights.map((ki, idx) => (
                <div key={idx} className="border-l-4 border-indigo-500 pl-4 space-y-3">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">What We Found</p>
                    <p className="text-gray-700">{ki.finding}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">What This Means</p>
                    <p className="text-gray-700">{ki.implication}</p>
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

        {/* Quick Wins */}
        {insight.quickWins && insight.quickWins.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Quick Wins
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.quickWins.map((qw, idx) => (
                <div key={idx} className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-emerald-900 flex-1">{qw.action}</p>
                    {qw.timeframe && (
                      <span className="px-2 py-1 bg-emerald-200 text-emerald-800 text-xs font-medium rounded whitespace-nowrap ml-3">
                        {qw.timeframe}
                      </span>
                    )}
                  </div>
                  {qw.impact && (
                    <p className="text-emerald-800 text-sm mt-2">{qw.impact}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Approach */}
        {insight.recommendedApproach && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recommended Approach
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.recommendedApproach.summary && (
                <p className="text-gray-700 leading-relaxed">{insight.recommendedApproach.summary}</p>
              )}
              {insight.recommendedApproach.frequency && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Frequency</p>
                  <p className="text-blue-800 text-sm">{insight.recommendedApproach.frequency}</p>
                </div>
              )}
              {insight.recommendedApproach.focusAreas && insight.recommendedApproach.focusAreas.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Focus Areas</p>
                  <ul className="space-y-2">
                    {insight.recommendedApproach.focusAreas.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* True Cash Position (v2) */}
        {insight.trueCashSection?.narrative && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                True Cash Position
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed mb-4">{insight.trueCashSection.narrative}</p>
              {insight.trueCashSection.isHealthy !== undefined && (
                <div className={`p-4 rounded-lg border ${
                  insight.trueCashSection.isHealthy 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <p className={`text-sm font-semibold ${
                    insight.trueCashSection.isHealthy ? 'text-emerald-900' : 'text-amber-900'
                  }`}>
                    {insight.trueCashSection.isHealthy ? '✓ Healthy Cash Position' : '⚠️ Cash Position Needs Attention'}
                  </p>
                  {insight.trueCashSection.implication && (
                    <p className={`text-sm mt-2 ${
                      insight.trueCashSection.isHealthy ? 'text-emerald-800' : 'text-amber-800'
                    }`}>
                      {insight.trueCashSection.implication}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tuesday Question Answer (v2) */}
        {insight.tuesdayQuestionAnswer?.answer && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Answering Your Tuesday Question</h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.tuesdayQuestionAnswer.originalQuestion && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Your Question:</p>
                  <p className="text-blue-800 italic">"{insight.tuesdayQuestionAnswer.originalQuestion}"</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">Answer:</p>
                <p className="text-gray-700 leading-relaxed">{insight.tuesdayQuestionAnswer.answer}</p>
              </div>
              {insight.tuesdayQuestionAnswer.supportingData && insight.tuesdayQuestionAnswer.supportingData.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Supporting Data:</p>
                  <ul className="space-y-2">
                    {insight.tuesdayQuestionAnswer.supportingData.map((data: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                        <span className="text-indigo-600 mt-1">•</span>
                        <span>{data}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insight.tuesdayQuestionAnswer.verdict && (
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  <p className="text-sm font-semibold text-indigo-900 mb-1">Summary</p>
                  <p className="text-indigo-800 text-sm">{insight.tuesdayQuestionAnswer.verdict}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decisions Enabled (v2) */}
        {insight.decisionsEnabled && insight.decisionsEnabled.length > 0 && (() => {
          const VERDICT_CONFIG: Record<string, { icon: any, color: string, label: string }> = {
            YES: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300', label: 'Yes' },
            NO: { icon: X, color: 'bg-red-100 text-red-800 border-red-300', label: 'No' },
            WAIT: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Wait' },
            YES_IF: { icon: CheckCircle, color: 'bg-green-50 text-green-700 border-green-200', label: 'Yes, if...' },
            NO_UNLESS: { icon: X, color: 'bg-red-50 text-red-700 border-red-200', label: 'No, unless...' },
          };
          
          const getVerdictDisplay = (decision: any) => {
            if (decision.verdict && decision.verdictSummary) {
              return { 
                verdict: decision.verdict, 
                summary: decision.verdictSummary,
                config: VERDICT_CONFIG[decision.verdict] || VERDICT_CONFIG.WAIT
              };
            }
            const rec = decision.recommendation?.toLowerCase() || '';
            if (rec.includes("don't") || rec.includes('no')) {
              return { verdict: 'NO', summary: decision.recommendation, config: VERDICT_CONFIG.NO };
            }
            if (rec.includes('wait')) {
              return { verdict: 'WAIT', summary: decision.recommendation, config: VERDICT_CONFIG.WAIT };
            }
            if (rec.includes('yes') || rec.includes('do it')) {
              return { verdict: 'YES', summary: decision.recommendation, config: VERDICT_CONFIG.YES };
            }
            return { verdict: 'WAIT', summary: decision.recommendation || 'Review needed', config: VERDICT_CONFIG.WAIT };
          };
          
          return (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Decisions Enabled
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {insight.decisionsEnabled.map((decision: any, idx: number) => {
                  const verdictDisplay = getVerdictDisplay(decision);
                  const VerdictIcon = verdictDisplay.config.icon;
                  
                  return (
                    <div key={idx} className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-lg text-purple-900">
                          {decision.decisionName || decision.decision}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-3 border flex items-center gap-1 ${verdictDisplay.config.color}`}>
                          <VerdictIcon className="h-3 w-3" />
                          {verdictDisplay.config.label}
                        </span>
                      </div>
                      
                      <div className={`p-4 rounded-lg mb-3 border ${
                        verdictDisplay.verdict?.startsWith('YES') ? 'bg-green-50 border-green-200' :
                        verdictDisplay.verdict?.startsWith('NO') ? 'bg-red-50 border-red-200' : 
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                        <p className="font-semibold text-lg text-gray-900">{verdictDisplay.summary}</p>
                        {decision.conditions && (
                          <p className="text-sm mt-2 text-gray-700">
                            <span className="font-medium">Condition:</span> {decision.conditions}
                          </p>
                        )}
                      </div>
                      
                      {decision.fallback && (
                        <div className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg mb-3 border border-gray-200">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700"><strong>Otherwise:</strong> {decision.fallback}</span>
                        </div>
                      )}
                      
                      {decision.supportingData && decision.supportingData.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Supporting Data:</p>
                          <div className="flex flex-wrap gap-2">
                            {decision.supportingData.map((data: string, dataIdx: number) => (
                              <span key={dataIdx} className="px-2 py-1 bg-white border border-purple-200 text-purple-800 text-xs rounded">
                                {data}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {decision.riskIfIgnored && (
                        <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm text-red-800">
                            <strong>Risk if wrong:</strong> {decision.riskIfIgnored}
                          </p>
                        </div>
                      )}
                      
                      {decision.clientQuoteReferenced && (
                        <div className="flex items-start gap-2 text-sm text-gray-600 mt-3 pt-3 border-t border-purple-200">
                          <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
                          <span className="italic">"{decision.clientQuoteReferenced}"</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Watch List (v2) */}
        {insight.watchList && insight.watchList.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Watch List</h2>
              <p className="text-sm text-gray-600 mt-1">Metrics to monitor closely</p>
            </div>
            <div className="p-6">
              <div className="grid gap-4">
                {insight.watchList.map((item: any, idx: number) => (
                  <div key={idx} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{item.metric}</h4>
                      {item.priority && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-700' :
                          item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Current Value</p>
                        <p className="font-semibold text-gray-900">{item.currentValue}</p>
                      </div>
                      {item.alertThreshold && (
                        <div>
                          <p className="text-gray-600 mb-1">Alert Threshold</p>
                          <p className="font-semibold text-gray-900">{item.alertThreshold}</p>
                        </div>
                      )}
                    </div>
                    {item.direction && item.checkFrequency && (
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                        <span>Direction: <strong>{item.direction}</strong></span>
                        <span>Check: <strong>{item.checkFrequency}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Goals Connection */}
        {insight.goalsConnection && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">How This Connects to Your Goals</h2>
            </div>
            <div className="p-6 space-y-4">
              {insight.goalsConnection.narrative && (
                <p className="text-gray-800 leading-relaxed">{insight.goalsConnection.narrative}</p>
              )}
              {insight.goalsConnection.theirWords && insight.goalsConnection.theirWords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-sm font-semibold text-purple-900 mb-3">Your Words</p>
                  <div className="flex flex-wrap gap-2">
                    {insight.goalsConnection.theirWords.map((word, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white border border-purple-200 text-purple-800 text-sm rounded-full">
                        "{word}"
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-600 mb-4">Have questions about your analysis?</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

