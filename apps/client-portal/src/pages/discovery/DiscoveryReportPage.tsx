import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Calendar, ChevronRight, Sparkles, Target, TrendingUp, Heart, Clock, Shield } from 'lucide-react';

// ============================================================================
// CLIENT-FRIENDLY DISCOVERY REPORT
// ============================================================================
// Sympathetic, encouraging, clear - not overwhelming
// Shows the journey from where they are to where they want to be
// ============================================================================

interface DiscoveryReport {
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
      recommendedInvestments?: any[];
      investmentSummary?: {
        totalFirstYearInvestment?: string;
        projectedFirstYearReturn?: string;
        netBenefitYear1?: string;
        paybackPeriod?: string;
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
  const [report, setReport] = useState<DiscoveryReport | null>(null);
  const [showCallToAction, setShowCallToAction] = useState(false);

  useEffect(() => {
    loadReport();
  }, [clientSession]);

  const loadReport = async () => {
    if (!clientSession?.clientId) return;

    try {
      // Load the client's shared discovery report
      const { data, error } = await supabase
        .from('client_reports')
        .select('*')
        .eq('client_id', clientSession.clientId)
        .eq('report_type', 'discovery_analysis')
        .eq('is_shared_with_client', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading report:', error);
      }

      setReport(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show CTA after 3 seconds
  useEffect(() => {
    if (report) {
      const timer = setTimeout(() => setShowCallToAction(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [report]);

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

  if (!report) {
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">RPGCC</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm text-slate-300">Your Discovery Insights</span>
          </div>
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
            {gaps.primaryGaps?.slice(0, 3).map((gap: any, idx: number) => (
              <div key={idx} className="border border-gray-100 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-amber-600 font-bold">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{gap.gap}</h3>
                    {gap.evidence && (
                      <p className="text-sm text-indigo-600 italic mb-2">"{gap.evidence}"</p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {gap.rootCause || gap.impact || "This is creating friction in your journey"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cost of waiting - gentle but clear */}
          {gaps.costOfInaction && (
            <div className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-5">
              <p className="text-sm text-red-700 font-medium mb-1">The cost of waiting another year</p>
              <p className="text-2xl font-bold text-red-800 mb-2">
                {gaps.costOfInaction.annualFinancialCost || gaps.costOfInaction.annual || "Significant"}
              </p>
              <p className="text-sm text-red-700">
                {gaps.costOfInaction.personalCost || "Time you won't get back, stress that compounds"}
              </p>
            </div>
          )}
        </section>

        {/* Recommended Path Forward */}
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
            <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-4">Your Investment Summary</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-slate-400 text-sm">Total Investment (Year 1)</p>
                  <p className="text-2xl font-bold">{investmentSummary.totalFirstYearInvestment}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Expected Return</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {investmentSummary.projectedFirstYearReturn}
                  </p>
                </div>
              </div>
              {investmentSummary.netBenefitYear1 && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Net Benefit (Year 1)</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {investmentSummary.netBenefitYear1}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    Payback in {investmentSummary.paybackPeriod || "under 6 months"}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

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

