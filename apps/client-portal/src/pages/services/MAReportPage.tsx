import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, TrendingUp, CheckCircle, AlertCircle, Target, Lightbulb, Calendar } from 'lucide-react';
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
      // Load the shared MA insight
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

