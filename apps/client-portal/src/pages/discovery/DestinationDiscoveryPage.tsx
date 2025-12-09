// ============================================================================
// DESTINATION DISCOVERY PAGE
// ============================================================================
// "Sell the destination, not the plane"
// 35 questions: 20 destination discovery + 15 service diagnostics
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ChevronLeft, ChevronRight, Target, Compass, MapPin, 
  Sparkles, CheckCircle, Loader2, ArrowRight, Zap
} from 'lucide-react';
import { Logo } from '@/components/Logo';

interface Question {
  question_id: string;
  section: string;
  question_text: string;
  question_type: 'single' | 'multi' | 'text';
  options?: string[];
  placeholder?: string;
  char_limit?: number;
  is_required: boolean;
}

interface ServiceRecommendation {
  rank: number;
  service: {
    code: string;
    name: string;
    shortDescription: string;
    typicalMonthly: string;
  };
  valueProposition: {
    headline: string;
    destination: string;
    gap: string;
    transformation: string;
    investment: string;
    firstStep: string;
  };
  score: number;
  isFoundational?: boolean;
  isBundled?: boolean;
}

const SECTION_ICONS: Record<string, any> = {
  'The Dream': Target,
  'The Gap': MapPin,
  'Tuesday Reality': Compass,
  'The Real Question': Sparkles,
  'Financial Clarity': Zap,
  'Operational Freedom': Zap,
  'Strategic Direction': Zap,
  'Growth Readiness': Zap,
  'Exit & Protection': Zap
};

// Clean white background for all sections - RPGCC branding
const SECTION_THEMES: Record<string, { bg: string; accent: string }> = {
  'The Dream': { bg: 'from-slate-50 to-white', accent: 'blue' },
  'The Gap': { bg: 'from-slate-50 to-white', accent: 'blue' },
  'Tuesday Reality': { bg: 'from-slate-50 to-white', accent: 'blue' },
  'The Real Question': { bg: 'from-slate-50 to-white', accent: 'blue' },
  'Financial Clarity': { bg: 'from-slate-50 to-white', accent: 'blue' },
  'Operational Freedom': { bg: 'from-slate-50 to-white', accent: 'blue' },
  'Strategic Direction': { bg: 'from-slate-50 to-white', accent: 'blue' },
  'Growth Readiness': { bg: 'from-slate-50 to-white', accent: 'blue' },
  'Exit & Protection': { bg: 'from-slate-50 to-white', accent: 'blue' }
};

export default function DestinationDiscoveryPage() {
  const { clientSession } = useAuth();
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState<'intro' | 'discovery' | 'diagnostic' | 'results'>('intro');
  const [sections, setSections] = useState<Record<string, Question[]>>({});
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState<ServiceRecommendation[]>([]);

  // Load questions
  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-service-recommendations', {
        body: { action: 'get-discovery-questions' }
      });

      if (error) throw error;

      // Combine discovery and diagnostic questions
      const allSections = {
        ...data.discoveryQuestions,
        ...data.diagnosticQuestions
      };

      setSections(allSections);
      setSectionOrder(Object.keys(allSections));
      setLoading(false);
    } catch (err) {
      console.error('Error loading questions:', err);
      setLoading(false);
    }
  };

  const currentSection = sectionOrder[currentSectionIndex];
  const currentQuestions = sections[currentSection] || [];
  const isLastSection = currentSectionIndex === sectionOrder.length - 1;
  const theme = SECTION_THEMES[currentSection] || SECTION_THEMES['The Dream'];
  const SectionIcon = SECTION_ICONS[currentSection] || Target;

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const getSectionCompletion = () => {
    const required = currentQuestions.filter(q => q.is_required);
    const answered = required.filter(q => {
      const val = responses[q.question_id];
      return val && (Array.isArray(val) ? val.length > 0 : val.length > 0);
    });
    return required.length > 0 ? (answered.length / required.length) * 100 : 100;
  };

  const canProceed = getSectionCompletion() === 100;

  const handleNext = async () => {
    if (isLastSection) {
      await submitDiscovery();
    } else {
      setCurrentSectionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const submitDiscovery = async () => {
    setSubmitting(true);
    try {
      // Split responses into discovery and diagnostic
      const discoveryResponses: Record<string, any> = {};
      const diagnosticResponses: Record<string, any> = {};

      Object.entries(responses).forEach(([key, value]) => {
        if (key.startsWith('dd_')) {
          discoveryResponses[key] = value;
        } else if (key.startsWith('sd_')) {
          diagnosticResponses[key] = value;
        }
      });

      // Submit to generate recommendations (saved server-side for practice team)
      const { error } = await supabase.functions.invoke('generate-service-recommendations', {
        body: {
          action: 'calculate-recommendations',
          clientId: clientSession?.clientId,
          discoveryResponses,
          diagnosticResponses
        }
      });

      if (error) throw error;

      // Update client status to discovery_complete
      if (clientSession?.clientId) {
        await supabase
          .from('practice_members')
          .update({ program_status: 'discovery_complete' })
          .eq('id', clientSession.clientId);
      }

      // Redirect to thank you page (practice team sees recommendations)
      navigate('/discovery/complete');
    } catch (err) {
      console.error('Error submitting discovery:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Intro screen - RPGCC branded
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* RPGCC Logo */}
          <div className="flex items-center justify-center mb-12">
            <Logo variant="dark" size="lg" />
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 mb-6">
              <Compass className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Destination Discovery
            </h1>
            <p className="text-xl text-slate-300">
              Let's find the fastest path to where you want to be
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700">
            <h2 className="text-2xl font-semibold text-white mb-6">
              This isn't a typical consultation
            </h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
                  <span className="text-[#3B82F6] font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">First, your destination</h3>
                  <p className="text-slate-400 text-sm">
                    We'll understand where you're trying to get to - your 5-year vision, what success feels like, what freedom means to you.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EF4444]/20 flex items-center justify-center">
                  <span className="text-[#EF4444] font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">Then, the gap</h3>
                  <p className="text-slate-400 text-sm">
                    We'll identify what's standing between you and that vision - the real obstacles, not the symptoms.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                  <span className="text-[#F59E0B] font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-white font-medium">Finally, the path</h3>
                  <p className="text-slate-400 text-sm">
                    We'll recommend the vehicles that will get you there fastest - personalized to your specific situation.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 mb-8">
              <p className="text-slate-300 text-sm">
                <span className="text-white font-medium">~15 minutes</span> • 35 questions • No sales pitch, just clarity
              </p>
            </div>

            <button
              onClick={() => setPhase('discovery')}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg"
            >
              Let's Begin
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-slate-500 text-xs">
            <p className="font-medium text-slate-400">RPGCC</p>
            <p className="mt-1 text-slate-500">RPGCC is a trading name of RPG Crouch Chapman LLP</p>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (phase === 'results') {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Your Path Forward
            </h1>
            <p className="text-gray-600">
              Based on your responses, here's what we recommend
            </p>
          </div>

          <div className="space-y-6">
            {recommendations.map((rec, idx) => (
              <div 
                key={rec.service.code}
                className={`bg-white rounded-2xl p-6 border shadow-sm ${
                  idx === 0 ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'
                }`}
              >
                {idx === 0 && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-600 text-sm font-medium mb-4">
                    <Sparkles className="w-4 h-4" />
                    Primary Recommendation
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {rec.valueProposition.headline}
                </h2>
                <p className="text-lg text-gray-600 mb-4">
                  {rec.service.name}
                </p>

                <div className="space-y-4 mb-6">
                  {rec.valueProposition.destination && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-gray-700 italic">
                        {rec.valueProposition.destination}
                      </p>
                    </div>
                  )}

                  {rec.valueProposition.gap && (
                    <p className="text-gray-700">
                      {rec.valueProposition.gap}
                    </p>
                  )}

                  <p className="text-gray-700">
                    {rec.valueProposition.transformation}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-gray-500 text-sm">Typical investment</p>
                    <p className="text-gray-900 font-semibold">{rec.service.typicalMonthly}/month</p>
                  </div>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/portal')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Return to Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Main questionnaire
  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((currentSectionIndex + 1) / sectionOrder.length) * 100}%` }}
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <SectionIcon className="w-4 h-4" />
            <span>{currentSection}</span>
          </div>
          <div className="text-gray-500 text-sm">
            {currentSectionIndex + 1} of {sectionOrder.length}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-32">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {currentSection}
          </h2>
          <div className="h-1 w-24 bg-blue-600 rounded" />
        </div>

        <div className="space-y-8">
          {currentQuestions.map((question, qIdx) => (
            <QuestionCard
              key={question.question_id}
              question={question}
              value={responses[question.question_id]}
              onChange={(val) => handleResponse(question.question_id, val)}
              index={qIdx + 1}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentSectionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : isLastSection ? (
              <>
                See My Recommendations
                <Sparkles className="w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// QUESTION CARD COMPONENT
// ============================================================================

function QuestionCard({ 
  question, 
  value, 
  onChange,
  index 
}: { 
  question: Question;
  value: any;
  onChange: (val: any) => void;
  index: number;
}) {
  const options = question.options ? 
    (typeof question.options === 'string' ? JSON.parse(question.options) : question.options) 
    : [];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 text-sm font-medium">{index}</span>
        </div>
        <div className="flex-1">
          <label className="block text-lg text-gray-900 font-medium mb-4">
            {question.question_text}
            {question.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {question.question_type === 'text' && (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder || ''}
              maxLength={question.char_limit || 500}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
            />
          )}

          {question.question_type === 'single' && options.length > 0 && (
            <div className="space-y-2">
              {options.map((option: string) => (
                <button
                  key={option}
                  onClick={() => onChange(option)}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                    value === option
                      ? 'bg-blue-600 text-white border-2 border-blue-500'
                      : 'bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {question.question_type === 'multi' && options.length > 0 && (
            <div className="space-y-2">
              {options.map((option: string) => {
                const selected = Array.isArray(value) && value.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => {
                      const current = Array.isArray(value) ? value : [];
                      if (selected) {
                        onChange(current.filter(v => v !== option));
                      } else {
                        onChange([...current, option]);
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                      selected
                        ? 'bg-blue-50 text-gray-900 border-2 border-blue-500'
                        : 'bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selected ? 'border-blue-500 bg-blue-600' : 'border-gray-400'
                    }`}>
                      {selected && <CheckCircle className="w-3 h-3 text-white" />}
                    </div>
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {question.char_limit && question.question_type === 'text' && (
            <p className="text-gray-500 text-sm mt-2 text-right">
              {(value?.length || 0)} / {question.char_limit}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


