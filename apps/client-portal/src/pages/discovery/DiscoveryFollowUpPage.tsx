// ============================================================================
// DISCOVERY FOLLOW-UP PAGE
// ============================================================================
// Type-specific follow-up questions for investment_vehicle, funded_startup,
// trading_agency, and professional_practice business types
// ============================================================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  ChevronLeft, ChevronRight, Loader2, CheckCircle, 
  ArrowRight, Save, AlertCircle
} from 'lucide-react';
import { Logo } from '@/components/Logo';

interface FollowUpQuestion {
  id: string;
  question: string;
  type: 'text' | 'single' | 'multi' | 'number';
  options?: string[];
  placeholder?: string;
  char_limit?: number;
  required: boolean;
}

// Follow-up questions by business type
const FOLLOW_UP_QUESTIONS: Record<string, FollowUpQuestion[]> = {
  investment_vehicle: [
    {
      id: 'iv_property_portfolio',
      question: 'What types of properties are in your portfolio? (Select all that apply)',
      type: 'multi',
      options: [
        'Residential buy-to-let',
        'Commercial property',
        'Mixed-use',
        'Development land',
        'Other'
      ],
      required: true
    },
    {
      id: 'iv_property_value',
      question: 'What is the approximate total value of your property portfolio?',
      type: 'single',
      options: [
        'Under £500k',
        '£500k - £1m',
        '£1m - £2.5m',
        '£2.5m - £5m',
        '£5m - £10m',
        'Over £10m',
        'Prefer not to say'
      ],
      required: true
    },
    {
      id: 'iv_management_approach',
      question: 'How are your properties currently managed?',
      type: 'single',
      options: [
        'Self-managed',
        'Property management company',
        'Mix of both',
        'Looking to change approach'
      ],
      required: true
    },
    {
      id: 'iv_succession_planning',
      question: 'Have you considered succession planning or wealth transfer for your portfolio?',
      type: 'text',
      placeholder: 'Tell us about your plans or concerns...',
      char_limit: 500,
      required: false
    },
    {
      id: 'iv_iht_concerns',
      question: 'What are your main concerns around inheritance tax and wealth transfer?',
      type: 'text',
      placeholder: 'IHT planning, gifting, trusts, etc.',
      char_limit: 500,
      required: false
    }
  ],
  
  funded_startup: [
    {
      id: 'fs_funding_stage',
      question: 'What stage of funding are you at?',
      type: 'single',
      options: [
        'Pre-seed / Bootstrapped',
        'Seed round',
        'Series A',
        'Series B or later',
        'Not yet funded but seeking investment'
      ],
      required: true
    },
    {
      id: 'fs_funding_amount',
      question: 'How much funding have you raised? (Approximate)',
      type: 'single',
      options: [
        'Under £100k',
        '£100k - £500k',
        '£500k - £1m',
        '£1m - £5m',
        'Over £5m',
        'Prefer not to say'
      ],
      required: false
    },
    {
      id: 'fs_runway',
      question: 'What is your current cash runway?',
      type: 'single',
      options: [
        'Less than 3 months',
        '3-6 months',
        '6-12 months',
        '12-18 months',
        '18+ months',
        'Not sure'
      ],
      required: true
    },
    {
      id: 'fs_board_reporting',
      question: 'What board reporting or investor updates do you currently provide?',
      type: 'text',
      placeholder: 'Monthly P&L, cash flow forecasts, KPIs, etc.',
      char_limit: 500,
      required: false
    },
    {
      id: 'fs_foundational_needs',
      question: 'What foundational systems or processes do you need to build before scaling?',
      type: 'text',
      placeholder: 'Financial reporting, compliance, operations, etc.',
      char_limit: 500,
      required: false
    }
  ],
  
  trading_agency: [
    {
      id: 'ta_team_structure',
      question: 'What is your team structure?',
      type: 'single',
      options: [
        'All employees (no contractors)',
        'Mix of employees and contractors',
        'Mostly contractors/freelancers',
        'Just me + occasional freelancers'
      ],
      required: true
    },
    {
      id: 'ta_contractor_percentage',
      question: 'Roughly what percentage of your team are contractors vs employees?',
      type: 'single',
      options: [
        '0-25% contractors',
        '25-50% contractors',
        '50-75% contractors',
        '75-100% contractors'
      ],
      required: false
    },
    {
      id: 'ta_utilization_tracking',
      question: 'Do you track team utilization or project profitability?',
      type: 'single',
      options: [
        'Yes, we track it closely',
        'We track it but not consistently',
        'We know roughly but don\'t measure it',
        'No, we don\'t track this'
      ],
      required: true
    },
    {
      id: 'ta_cash_flow_challenges',
      question: 'What are your main cash flow challenges?',
      type: 'multi',
      options: [
        'Client payment terms (30/60/90 days)',
        'Seasonal revenue fluctuations',
        'Contractor payments timing',
        'Project overruns affecting profitability',
        'Difficulty forecasting cash flow',
        'Other'
      ],
      required: false
    },
    {
      id: 'ta_project_profitability',
      question: 'How confident are you that you know which projects/clients are profitable?',
      type: 'single',
      options: [
        'Very confident - we track this well',
        'Fairly confident - we have a good sense',
        'Uncertain - we suspect some aren\'t profitable',
        'Not confident - we don\'t really know'
      ],
      required: true
    }
  ],
  
  professional_practice: [
    {
      id: 'pp_practice_structure',
      question: 'What is your practice structure?',
      type: 'single',
      options: [
        'Sole practitioner',
        'Partnership (2-5 partners)',
        'Partnership (6+ partners)',
        'LLP or incorporated practice',
        'Other'
      ],
      required: true
    },
    {
      id: 'pp_partner_dynamics',
      question: 'How would you describe partner dynamics and decision-making?',
      type: 'text',
      placeholder: 'Consensus-based, majority vote, one lead partner, etc.',
      char_limit: 500,
      required: false
    },
    {
      id: 'pp_succession_planning',
      question: 'Have you thought about succession planning or partner exit?',
      type: 'single',
      options: [
        'Yes, we have a plan in place',
        'We\'ve discussed it but no formal plan',
        'It\'s on the agenda but not urgent',
        'Not really considered it',
        'Not applicable'
      ],
      required: false
    },
    {
      id: 'pp_goodwill_valuation',
      question: 'How is goodwill valued in your practice?',
      type: 'single',
      options: [
        'We have a formal valuation method',
        'We use industry standards/benchmarks',
        'It\'s discussed but not formalized',
        'We don\'t really value goodwill',
        'Not applicable'
      ],
      required: false
    },
    {
      id: 'pp_client_retention',
      question: 'What is your client retention rate? (Approximate)',
      type: 'single',
      options: [
        'Over 95%',
        '90-95%',
        '80-90%',
        '70-80%',
        'Under 70%',
        'Not sure'
      ],
      required: false
    }
  ]
};

export default function DiscoveryFollowUpPage() {
  const { clientSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [clientType, setClientType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  
  // Get client type from URL param or fetch from report
  useEffect(() => {
    const loadClientType = async () => {
      if (!clientSession?.clientId) {
        navigate('/dashboard');
        return;
      }
      
      // Check URL param first (for manual links)
      const typeParam = searchParams.get('type');
      if (typeParam && FOLLOW_UP_QUESTIONS[typeParam]) {
        setClientType(typeParam);
        await loadSavedResponses(typeParam);
        setLoading(false);
        return;
      }
      
      // Otherwise, fetch from discovery report
      try {
        // Get the most recent discovery engagement
        const { data: engagement } = await supabase
          .from('discovery_engagements')
          .select('id')
          .eq('client_id', clientSession.clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (engagement) {
          // Get the report to find client type
          const { data: report } = await supabase
            .from('discovery_reports')
            .select('client_type')
            .eq('engagement_id', engagement.id)
            .maybeSingle();
          
          if (report?.client_type && FOLLOW_UP_QUESTIONS[report.client_type]) {
            setClientType(report.client_type);
            await loadSavedResponses(report.client_type);
          } else {
            // No follow-up needed for this client type
            navigate('/discovery/complete');
            return;
          }
        } else {
          // No engagement found, redirect
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error loading client type:', error);
        navigate('/dashboard');
        return;
      }
      
      setLoading(false);
    };
    
    loadClientType();
  }, [clientSession, searchParams, navigate]);
  
  const loadSavedResponses = async (type: string) => {
    if (!clientSession?.clientId) return;
    
    try {
      const { data: discovery } = await supabase
        .from('destination_discovery')
        .select('follow_up_responses')
        .eq('client_id', clientSession.clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (discovery?.follow_up_responses && typeof discovery.follow_up_responses === 'object') {
        setResponses(discovery.follow_up_responses);
      }
    } catch (error) {
      console.error('Error loading saved follow-up responses:', error);
    }
  };
  
  const saveResponses = async () => {
    if (!clientSession?.clientId || !clientType) return;
    
    setSaving(true);
    try {
      // Find the discovery record
      const { data: discovery } = await supabase
        .from('destination_discovery')
        .select('id')
        .eq('client_id', clientSession.clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (discovery?.id) {
        await supabase
          .from('destination_discovery')
          .update({ follow_up_responses: responses })
          .eq('id', discovery.id);
      }
    } catch (error) {
      console.error('Error saving follow-up responses:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!clientSession?.clientId || !clientType) return;
    
    setSubmitting(true);
    try {
      // Save final responses
      await saveResponses();
      
      // Navigate to completion
      navigate('/discovery/complete');
    } catch (error) {
      console.error('Error submitting follow-up:', error);
      alert('Error saving responses. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  if (!clientType || !FOLLOW_UP_QUESTIONS[clientType]) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">No follow-up questions required for your business type.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const questions = FOLLOW_UP_QUESTIONS[clientType];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = currentQuestion.required 
    ? responses[currentQuestion.id] !== undefined && responses[currentQuestion.id] !== '' && 
      (!Array.isArray(responses[currentQuestion.id]) || responses[currentQuestion.id].length > 0)
    : true;
  
  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
      // Auto-save progress
      saveResponses();
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };
  
  const getClientTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      investment_vehicle: 'Property/Investment Portfolio',
      funded_startup: 'Funded Startup',
      trading_agency: 'Agency/Creative Services',
      professional_practice: 'Professional Practice'
    };
    return labels[type] || type;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            <Logo variant="light" size="md" />
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              A Few More Questions
            </h1>
            <p className="text-lg text-gray-600">
              To make sure we get the right picture for your {getClientTypeLabel(clientType)} business
            </p>
          </div>
          
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentQuestion.question}
            </h2>
            {currentQuestion.required && (
              <span className="text-sm text-red-500">Required</span>
            )}
          </div>
          
          {/* Answer Input */}
          <div className="space-y-4">
            {currentQuestion.type === 'text' && (
              <textarea
                value={responses[currentQuestion.id] || ''}
                onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                placeholder={currentQuestion.placeholder}
                maxLength={currentQuestion.char_limit}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={6}
              />
            )}
            
            {currentQuestion.type === 'single' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => (
                  <label
                    key={option}
                    className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={responses[currentQuestion.id] === option}
                      onChange={(e) => handleResponseChange(currentQuestion.id, e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}
            
            {currentQuestion.type === 'multi' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option) => {
                  const selected = Array.isArray(responses[currentQuestion.id])
                    ? responses[currentQuestion.id].includes(option)
                    : false;
                  
                  return (
                    <label
                      key={option}
                      className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          const current = Array.isArray(responses[currentQuestion.id])
                            ? responses[currentQuestion.id]
                            : [];
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter((v: string) => v !== option);
                          handleResponseChange(currentQuestion.id, updated);
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-700">{option}</span>
                    </label>
                  );
                })}
              </div>
            )}
            
            {currentQuestion.char_limit && (
              <p className="text-sm text-gray-500 text-right">
                {(responses[currentQuestion.id]?.length || 0)} / {currentQuestion.char_limit} characters
              </p>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
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
                Saving...
              </>
            ) : isLastQuestion ? (
              <>
                Complete
                <CheckCircle className="w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
        
        {/* Save indicator */}
        {saving && (
          <div className="mt-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            Saving progress...
          </div>
        )}
      </div>
    </div>
  );
}
