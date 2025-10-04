import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, CheckCircle, ArrowRight, Loader2, AlertCircle,
  MessageSquare, Target, Clock, TrendingUp, Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useOracleData } from '../hooks/useOracleData';
import { ContextEnrichmentService } from '../services/contextEnrichmentService';

interface ValidationQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'textarea' | 'number';
  required: boolean;
  options?: string[];
  placeholder?: string;
  help_text?: string;
  category?: string;
  validation?: {
    min?: number;
    max?: number;
  };
}

interface ValidationResponse {
  question_id: string;
  answer: string | number;
  category?: string;
}

// Additional validation questions for user metrics
const additionalValidationQuestions: ValidationQuestion[] = [
  {
    id: "working_hours_per_week",
    question: "How many hours are you currently working per week?",
    type: "number",
    placeholder: "e.g., 50",
    validation: { min: 1, max: 168 },
    help_text: "Be honest - include everything: client work, admin, business development",
    required: true,
    category: "Time & Efficiency"
  },
  {
    id: "billable_rate_gbp",
    question: "What's your current hourly rate when you do charge by the hour? (£)",
    type: "number",
    placeholder: "e.g., 250",
    validation: { min: 0 },
    help_text: "If you don't charge hourly, estimate your equivalent rate",
    required: true,
    category: "Financial"
  },
  {
    id: "target_working_hours",
    question: "How many hours per week would you ideally like to work?",
    type: "number",
    placeholder: "e.g., 30",
    validation: { min: 1, max: 168 },
    help_text: "Your dream work-life balance",
    required: true,
    category: "Time & Efficiency"
  },
  {
    id: "annual_revenue_target",
    question: "What's your turnover target for the next 12 months? (£)",
    type: "number",
    placeholder: "e.g., 250000",
    validation: { min: 0 },
    help_text: "Be ambitious but realistic",
    required: true,
    category: "Financial"
  },
  {
    id: "working_weeks_per_year",
    question: "How many weeks do you work per year? (excluding holidays)",
    type: "number",
    placeholder: "e.g., 46",
    validation: { min: 1, max: 52 },
    help_text: "Most people work 46-48 weeks",
    required: true,
    category: "Time & Efficiency"
  }
];

export default function ValidationQuestions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data } = useOracleData();
  const [questions, setQuestions] = useState<ValidationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [enrichedInsights, setEnrichedInsights] = useState<any>(null);

  // Fetch validation questions
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/validation/generate-questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            group_id: data?.groupId,
            email: data?.email || user?.email,
            part1_answers: data?.part1Answers,
            part2_answers: data?.part2Answers,
            current_revenue: data?.currentRevenue,
            target_revenue: data?.targetRevenue
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate validation questions');
        }

        const result = await response.json();
        let allQuestions = result.questions || [];
        
        // Add additional validation questions if they don't already exist
        const existingQuestionIds = new Set(allQuestions.map((q: ValidationQuestion) => q.id));
        const newQuestions = additionalValidationQuestions.filter(q => !existingQuestionIds.has(q.id));
        allQuestions = [...allQuestions, ...newQuestions];
        
        setQuestions(allQuestions);
        
        // Load any existing responses
        if (result.existing_responses) {
          setResponses(result.existing_responses);
        }

        // Enrich validation with context-specific insights
        if (data?.part1Answers || data?.part2Answers) {
          try {
            const assessmentData = {
              ...data?.part1Answers,
              ...data?.part2Answers,
              industry: data?.part1Answers?.industry || data?.part2Answers?.industry,
              challenges: data?.part2Answers?.challenges || [],
              goals: data?.part2Answers?.goals || [],
              businessStage: data?.part1Answers?.business_stage,
              revenue: data?.currentRevenue,
              yearsInBusiness: data?.part1Answers?.years_in_business
            };

            const insights = await ContextEnrichmentService.enrichValidation(assessmentData);
            setEnrichedInsights(insights);
            
            console.log('Enriched validation insights:', insights);
          } catch (err) {
            console.error('Failed to enrich validation:', err);
            // Don't fail the whole process if enrichment fails
          }
        }
      } catch (err) {
        console.error('Error fetching validation questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };

    if (data?.groupId) {
      fetchQuestions();
    }
  }, [data, user]);

  // Auto-save responses
  const autoSave = useCallback(async (questionId: string, answer: string | number) => {
    try {
      setAutoSaving(true);
      await fetch(`https://oracle-api-server-production.up.railway.app/api/validation/auto-save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: data?.groupId,
          question_id: questionId,
          answer: answer
        })
      });
    } catch (err) {
      console.error('Auto-save failed:', err);
      // Don't show error to user for auto-save failures
    } finally {
      setAutoSaving(false);
    }
  }, [data?.groupId]);

  // Handle answer changes
  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Auto-save after a short delay
    setTimeout(() => {
      autoSave(questionId, answer);
    }, 1000);
  };

  // Navigate to next question
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Submit all responses
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Extract user metrics from responses
      const userMetrics = {
        working_hours_per_week: Number(responses.working_hours_per_week) || 0,
        billable_rate_gbp: Number(responses.billable_rate_gbp) || 0,
        target_working_hours: Number(responses.target_working_hours) || 0,
        annual_revenue_target: Number(responses.annual_revenue_target) || 0,
        working_weeks_per_year: Number(responses.working_weeks_per_year) || 48
      };
      
      // Debug: Log what we're sending
      const submitData = {
        group_id: data?.groupId,
        email: data?.email || user?.email,
        responses: Object.entries(responses).map(([question_id, answer]) => ({
          question_id,
          answer
        })),
        user_metrics: userMetrics,
        part1_answers: data?.part1Answers,
        part2_answers: data?.part2Answers
      };
      
      console.log('Submitting validation responses:', submitData);
      
      const response = await fetch(`https://oracle-api-server-production.up.railway.app/api/validation/submit-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Submit error response:', errorData);
        throw new Error(errorData?.detail || 'Failed to submit responses');
      }
  
      const result = await response.json();
      console.log('Submit success:', result);
      
      toast.success('Personalisation complete! Generating your roadmap...');
      
      // Navigate to generation progress
      navigate('/assessment/confirmation', { 
        state: { 
          groupId: data?.groupId,
          email: data?.email || user?.email,
          isValidationComplete: true,
          userMetrics: userMetrics
        }
      });
    } catch (err) {
      console.error('Error submitting responses:', err);
      toast.error('Failed to submit responses. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Validate answer based on question validation rules
  const validateAnswer = (question: ValidationQuestion, answer: string | number): boolean => {
    if (!question.validation) return true;
    
    const numAnswer = Number(answer);
    
    if (question.validation.min !== undefined && numAnswer < question.validation.min) {
      return false;
    }
    
    if (question.validation.max !== undefined && numAnswer > question.validation.max) {
      return false;
    }
    
    return true;
  };

  // Render question input based on type
  const renderQuestionInput = (question: ValidationQuestion) => {
    const value = responses[question.id] || '';
    const isValid = validateAnswer(question, value);

    switch (question.type) {
      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          >
            <option value="">Select an option...</option>
            {question.options?.map((option) => (
              <option key={option} value={option} className="text-gray-800">
                {option}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={value as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            rows={4}
            className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
          />
        );

      case 'number':
        return (
          <div>
            <input
              type="number"
              value={value as string}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder={question.placeholder}
              className={`w-full p-4 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:border-transparent ${
                value && !isValid 
                  ? 'border-red-400 focus:ring-red-400' 
                  : 'border-white/20 focus:ring-purple-400'
              }`}
            />
            {value && !isValid && (
              <p className="text-red-300 text-sm mt-2">
                Please enter a value between {question.validation?.min} and {question.validation?.max}
              </p>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder={question.placeholder}
            className="w-full p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
          />
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"
          />
          <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Assessment</h2>
          <p className="text-purple-200">Generating personalised questions...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Something went wrong</h2>
          <p className="text-purple-200 mb-6 text-center">{error}</p>
          <div className="flex gap-4">
            <Button
              onClick={() => window.location.reload()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">No Questions Needed</h2>
          <p className="text-purple-200 mb-6">
            Your assessment provided enough information to generate your roadmap. 
            You can proceed directly to generation.
          </p>
          <Button
            onClick={() => navigate('/assessment/confirmation', { 
              state: { 
                groupId: data?.groupId,
                email: data?.email || user?.email
              }
            })}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Generate Roadmap
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnswer = responses[currentQuestion.id] && String(responses[currentQuestion.id]).trim() !== '';
  const isValidAnswer = hasAnswer && validateAnswer(currentQuestion, responses[currentQuestion.id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-black/20 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Personalising Your Roadmap</h1>
              <p className="text-purple-200 text-sm">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {autoSaving && (
                <div className="flex items-center gap-2 text-purple-200 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </div>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 w-full bg-white/10 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-32 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
                {/* Question header */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {currentQuestion.question}
                      </h2>
                      {currentQuestion.category && (
                        <p className="text-purple-200 text-sm mt-1">
                          {currentQuestion.category}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {currentQuestion.help_text && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0" />
                        <p className="text-purple-200 text-sm">{currentQuestion.help_text}</p>
                      </div>
                    </div>
                  )}

                  {/* Display enriched insights relevant to current question */}
                  {enrichedInsights && currentQuestion.category && (
                    <div className="mt-4 space-y-3">
                      {/* Industry Benchmarks */}
                      {enrichedInsights.benchmarks?.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-purple-300 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-purple-100 font-medium text-sm mb-1">Industry Benchmark</h4>
                              <p className="text-purple-200 text-sm">
                                {enrichedInsights.benchmarks[0]?.value || 'Based on similar businesses in your industry'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Relevant KPIs */}
                      {enrichedInsights.kpis?.length > 0 && currentQuestion.category === 'Financial' && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                          <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-blue-300 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-blue-100 font-medium text-sm mb-1">Key Metrics to Track</h4>
                              <p className="text-blue-200 text-sm">
                                {enrichedInsights.kpis[0]?.description || 'Important metrics for your business stage'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Proven Approaches */}
                      {enrichedInsights.provenApproaches?.length > 0 && currentQuestion.category === 'Time & Efficiency' && (
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-green-100 font-medium text-sm mb-1">What Works</h4>
                              <p className="text-green-200 text-sm">
                                {enrichedInsights.provenApproaches[0]?.description || 'Strategies that have worked for similar businesses'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Watch Outs */}
                      {enrichedInsights.watchOuts?.length > 0 && (
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-300 mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="text-amber-100 font-medium text-sm mb-1">Common Pitfall</h4>
                              <p className="text-amber-200 text-sm">
                                {enrichedInsights.watchOuts[0]?.description || 'Things to avoid based on industry experience'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Question input */}
                <div className="mb-8">
                  {renderQuestionInput(currentQuestion)}
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center justify-between">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Previous
                  </Button>

                  <div className="flex items-center gap-4">
                    {isLastQuestion ? (
                      <Button
                        onClick={handleSubmit}
                        disabled={!isValidAnswer || submitting}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Complete Personalisation
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={!isValidAnswer}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                      >
                        Next Question
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Question preview */}
          {questions.length > 1 && (
            <div className="mt-8">
              <h3 className="text-white font-semibold mb-4">All Questions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      index === currentQuestionIndex
                        ? 'bg-purple-500 text-white'
                        : responses[question.id]
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {responses[question.id] && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>Q{index + 1}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 