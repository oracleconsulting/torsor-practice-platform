// ============================================================================
// Management Accounts Client Presentation Page
// ============================================================================
// The "wow" moment - showing clients what financial visibility could look like
// Shows: Their pain (in their words), the destination, preview, tier options
// ============================================================================

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  Loader2, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Clock,
  BarChart3,
  PieChart,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AssessmentResponses {
  ma_tuesday_question?: string;
  ma_expensive_blindspot?: string;
  ma_worst_cash_moment?: string;
  ma_visibility_transformation?: string;
  ma_sleep_better?: string;
  ma_scenario_interest?: string[];
  ma_upcoming_decisions?: string[];
  ma_decision_confidence?: number;
  ma_cash_visibility_30day?: string;
  [key: string]: any;
}

interface TierDefinition {
  tier_code: string;
  tier_name: string;
  monthly_price: number;
  features: Record<string, any>;
}

const TIER_FEATURES: Record<string, { name: string; tagline: string; features: string[] }> = {
  bronze: {
    name: 'Bronze',
    tagline: 'Essentials',
    features: [
      'Monthly P&L & Balance Sheet',
      'True Cash calculation',
      'Your Tuesday Answer',
      '3 Key insights per month',
      'Watch list (3 items)'
    ]
  },
  silver: {
    name: 'Silver',
    tagline: 'Full Picture',
    features: [
      'Everything in Bronze +',
      '6-month rolling trends',
      '5 Key insights per month',
      'Optimization recommendations',
      'Decision support'
    ]
  },
  gold: {
    name: 'Gold',
    tagline: 'Decision-Ready',
    features: [
      'Everything in Silver +',
      '13-week cash forecast',
      'Interactive scenario dashboard',
      'Monthly strategy call',
      '3 Pre-built scenarios'
    ]
  },
  platinum: {
    name: 'Platinum',
    tagline: 'Board-Level',
    features: [
      'Everything in Gold +',
      'Weekly flash updates',
      'Fortnightly calls',
      'Unlimited scenarios',
      'Custom KPIs & benchmarking'
    ]
  }
};

const TIER_PRICES: Record<string, number> = {
  bronze: 750,
  silver: 1500,
  gold: 3000,
  platinum: 5000
};

export default function MAPresentationPage() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<AssessmentResponses>({});
  const [recommendedTier, setRecommendedTier] = useState<string>('gold');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [scenarioValue, setScenarioValue] = useState(55000);
  const [interacted, setInteracted] = useState(false);
  
  const presentationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clientSession?.clientId) {
      loadData();
      trackInteraction('viewed');
    }
  }, [clientSession?.clientId]);

  const loadData = async () => {
    if (!clientSession?.clientId) return;
    
    setLoading(true);
    try {
      // Get MA engagement
      const { data: engagement } = await supabase
        .from('ma_engagements')
        .select('id, ai_analysis, recommended_tier')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();

      if (engagement) {
        // Load assessment responses
        const { data: assessmentData } = await supabase
          .from('ma_assessment_responses')
          .select('responses')
          .eq('engagement_id', engagement.id)
          .maybeSingle();

        if (assessmentData?.responses) {
          setResponses(assessmentData.responses);
        }

        if (engagement.recommended_tier) {
          setRecommendedTier(engagement.recommended_tier);
        }
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const trackInteraction = async (type: string, details?: any) => {
    if (!clientSession?.clientId) return;
    
    try {
      const { data: engagement } = await supabase
        .from('ma_engagements')
        .select('id')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();

      if (engagement) {
        await supabase.from('ma_presentation_interactions').insert({
          engagement_id: engagement.id,
          client_id: clientSession.clientId,
          interaction_type: type,
          details
        });
      }
    } catch (err) {
      console.error('Error tracking interaction:', err);
    }
  };

  const handleTierSelect = async (tier: string) => {
    setSelectedTier(tier);
    await trackInteraction('tier_clicked', { tier });
  };

  const handleCTAClick = async (action: string) => {
    await trackInteraction('cta_clicked', { action, selectedTier });
    
    if (action === 'interested') {
      // Update engagement with interest
      if (clientSession?.clientId) {
        const { data: engagement } = await supabase
          .from('ma_engagements')
          .select('id')
          .eq('client_id', clientSession.clientId)
          .maybeSingle();

        if (engagement) {
          await supabase
            .from('ma_engagements')
            .update({ 
              selected_tier: selectedTier || recommendedTier,
              tier_selected_at: new Date().toISOString()
            })
            .eq('id', engagement.id);
        }
      }
      // Navigate to success/confirmation
      navigate('/dashboard');
    } else if (action === 'later') {
      navigate('/dashboard');
    }
  };

  const sections = [
    { id: 'problem', title: 'Your Challenge' },
    { id: 'destination', title: 'Your Vision' },
    { id: 'preview', title: 'What This Looks Like' },
    { id: 'tiers', title: 'Choose Your Level' },
    { id: 'next', title: 'Get Started' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const tuesdayQuestion = responses.ma_tuesday_question || "How much cash will we have?";
  const expensiveBlindspot = responses.ma_expensive_blindspot;
  const worstCashMoment = responses.ma_worst_cash_moment;
  const visibilityTransformation = responses.ma_visibility_transformation;
  const sleepBetter = responses.ma_sleep_better;
  const scenarioInterest = responses.ma_scenario_interest || [];
  const decisionConfidence = responses.ma_decision_confidence || 5;

  return (
    <div 
      ref={presentationRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
    >
      {/* Navigation dots */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => setCurrentSection(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSection === idx 
                ? 'bg-indigo-400 scale-125' 
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
            title={section.title}
          />
        ))}
      </div>

      {/* Section Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-slate-800/80 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-700">
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-slate-300 text-sm font-medium min-w-[120px] text-center">
          {sections[currentSection].title}
        </span>
        <button
          onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
          disabled={currentSection === sections.length - 1}
          className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* Section 1: The Problem */}
        {currentSection === 0 && (
          <motion.section
            key="problem"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
          >
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <span className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
                  Your Tuesday Question
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight"
              >
                "{tuesdayQuestion}"
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-slate-400 mb-12"
              >
                This is the question you told us you can't currently answer.
                <br />
                Here's what answering it could look like...
              </motion.p>

              {(expensiveBlindspot || worstCashMoment) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-left"
                >
                  <h3 className="text-amber-400 font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    The Cost of Not Knowing
                  </h3>
                  {expensiveBlindspot && (
                    <p className="text-slate-300 mb-4">
                      You told us: <span className="text-white italic">"{expensiveBlindspot}"</span>
                    </p>
                  )}
                  {worstCashMoment && (
                    <p className="text-slate-300">
                      You also mentioned: <span className="text-white italic">"{worstCashMoment}"</span>
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* Section 2: The Destination */}
        {currentSection === 1 && (
          <motion.section
            key="destination"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
          >
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8"
              >
                <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                  What You Said You Wanted
                </span>
              </motion.div>

              {visibilityTransformation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-2xl p-8 border border-emerald-500/30 mb-8"
                >
                  <p className="text-slate-400 mb-2">When we asked what would change with proper visibility:</p>
                  <p className="text-2xl text-white font-medium italic">"{visibilityTransformation}"</p>
                </motion.div>
              )}

              {sleepBetter && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700"
                >
                  <p className="text-slate-400 mb-2">And what would help you sleep better:</p>
                  <p className="text-2xl text-white font-medium italic">"{sleepBetter}"</p>
                </motion.div>
              )}

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-emerald-400 text-xl font-semibold mt-12"
              >
                That's exactly what we're going to build.
              </motion.p>
            </div>
          </motion.section>
        )}

        {/* Section 3: Preview */}
        {currentSection === 2 && (
          <motion.section
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
          >
            <div className="max-w-5xl mx-auto w-full">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white text-center mb-12"
              >
                What This Looks Like
              </motion.h2>

              <div className="grid md:grid-cols-2 gap-6">
                {/* True Cash Preview */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700"
                >
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    True Cash vs Bank Balance
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-300">
                      <span>What your bank says:</span>
                      <span className="text-white font-medium">£95,430</span>
                    </div>
                    <div className="border-t border-slate-700 pt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-400">
                        <span>Less: VAT owed</span>
                        <span className="text-red-400">(£22,150)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Less: PAYE/NI due</span>
                        <span className="text-red-400">(£8,800)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Less: Corp tax provision</span>
                        <span className="text-red-400">(£15,000)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Plus: Confirmed receivables (7 days)</span>
                        <span className="text-emerald-400">£10,000</span>
                      </div>
                    </div>
                    <div className="border-t border-slate-700 pt-3 flex justify-between text-lg">
                      <span className="text-emerald-400 font-semibold">TRUE CASH:</span>
                      <span className="text-emerald-400 font-bold">£46,920</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-4">
                    The £48,510 difference is money you can see but can't touch.
                  </p>
                </motion.div>

                {/* 13-Week Forecast Preview */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700"
                >
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                    Your Cash Over 13 Weeks
                  </h3>
                  <div className="h-40 flex items-end gap-1">
                    {[60, 65, 55, 45, 40, 35, 30, 25, 35, 45, 55, 60, 65].map((height, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t transition-all ${
                          idx === 6 ? 'bg-amber-500' : 'bg-indigo-500/70'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                  </div>
                  <div className="mt-4 bg-amber-500/10 rounded-lg p-3 border border-amber-500/30">
                    <p className="text-amber-400 text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      WATCH: Week of Feb 24 - cash drops to £18,370
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Action: Accelerate debtor collection before this date
                    </p>
                  </div>
                </motion.div>

                {/* Interactive Scenario Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="md:col-span-2 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 border border-indigo-500/30"
                >
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    What If: You Hired a Consultant?
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Salary</label>
                      <input
                        type="range"
                        min={35000}
                        max={85000}
                        step={5000}
                        value={scenarioValue}
                        onChange={(e) => {
                          setScenarioValue(Number(e.target.value));
                          if (!interacted) {
                            setInteracted(true);
                            trackInteraction('scenario_played', { type: 'hire' });
                          }
                        }}
                        className="w-full accent-indigo-500"
                      />
                      <div className="flex justify-between text-sm text-slate-500 mt-1">
                        <span>£35k</span>
                        <span className="text-indigo-400 font-medium">£{scenarioValue.toLocaleString()}</span>
                        <span>£85k</span>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <h4 className="text-slate-400 text-sm mb-3">Year 1 Impact</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Revenue potential:</span>
                          <span className="text-emerald-400">+£{Math.round(scenarioValue * 1.8).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cost (salary + oncosts):</span>
                          <span className="text-red-400">-£{Math.round(scenarioValue * 1.15).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-700 pt-2">
                          <span className="text-white font-medium">Net contribution:</span>
                          <span className="text-emerald-400 font-bold">+£{Math.round(scenarioValue * 0.65).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Breakeven month:</span>
                          <span className="text-indigo-400">Month {Math.max(3, Math.round(scenarioValue / 20000))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">VERDICT: ✓ YES IF they achieve 65%+ utilisation</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Section 4: Tier Options */}
        {currentSection === 3 && (
          <motion.section
            key="tiers"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
          >
            <div className="max-w-5xl mx-auto w-full">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl font-bold text-white mb-4">Choose Your Level</h2>
                <p className="text-slate-400">
                  Based on your answers, we recommend: 
                  <span className="text-indigo-400 font-semibold ml-1">
                    {TIER_FEATURES[recommendedTier]?.name}
                  </span>
                </p>
              </motion.div>

              <div className="grid md:grid-cols-4 gap-4">
                {Object.entries(TIER_FEATURES).map(([tier, details], idx) => {
                  const isRecommended = tier === recommendedTier;
                  const isSelected = tier === selectedTier;
                  
                  return (
                    <motion.button
                      key={tier}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleTierSelect(tier)}
                      className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500/10' 
                          : isRecommended 
                            ? 'border-emerald-500/50 bg-emerald-500/5' 
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                          RECOMMENDED
                        </span>
                      )}
                      
                      <h3 className="text-lg font-bold text-white mb-1">{details.name}</h3>
                      <p className="text-sm text-slate-400 mb-3">{details.tagline}</p>
                      <p className="text-2xl font-bold text-white mb-4">
                        £{TIER_PRICES[tier].toLocaleString()}
                        <span className="text-sm font-normal text-slate-500">/mo</span>
                      </p>
                      
                      <ul className="space-y-2">
                        {details.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}

        {/* Section 5: Next Steps */}
        {currentSection === 4 && (
          <motion.section
            key="next"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
          >
            <div className="max-w-2xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="w-20 h-20 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <Zap className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 mb-8"
              >
                <h3 className="text-white font-semibold mb-4">If you'd like to move forward:</h3>
                <ol className="text-left text-slate-300 space-y-3">
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-sm flex items-center justify-center">1</span>
                    Choose your tier
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-sm flex items-center justify-center">2</span>
                    We'll send a simple agreement
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-sm flex items-center justify-center">3</span>
                    We connect to your Xero (or you send us the data)
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-sm flex items-center justify-center">4</span>
                    First report within 10 working days of month end
                  </li>
                </ol>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-indigo-500/10 rounded-xl p-6 border border-indigo-500/30 mb-8"
              >
                <p className="text-slate-400 mb-2">Your first Tuesday question answered:</p>
                <p className="text-xl text-indigo-400 font-medium italic">"{tuesdayQuestion}"</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <button
                  onClick={() => handleCTAClick('interested')}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  I'm interested - let's talk
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleCTAClick('later')}
                  className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  I need to think about it
                </button>
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

