// ============================================================================
// PART 1: LIFE DESIGN ASSESSMENT
// ============================================================================
// Conversational, one-question-at-a-time flow
// 15 questions about personal vision and business relationship

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { QuestionRenderer } from '../../components/assessment/QuestionRenderer';
import { DotProgress } from '../../components/assessment/ProgressBar';

// Import questions from shared package (adjust path as needed)
const part1Questions = [
  {
    id: 'tuesday_test',
    title: 'The Tuesday Test',
    context: 'Picture a random Tuesday 5 years from now. Walk me through your ideal day from waking up to going to bed. Be specific - what time do you wake up? What do you NOT do anymore?',
    type: 'textarea',
    required: true
  },
  {
    id: 'money_truth',
    title: 'The Money Truth',
    context: 'Two parts about your personal income (not business turnover):',
    type: 'multi-part',
    parts: [
      { id: 'current_income', label: 'A) What is your current personal take-home salary/pay per month?', type: 'text' },
      { id: 'desired_income', label: 'B) What personal monthly income would make you feel genuinely secure and free?', type: 'text' }
    ],
    required: true
  },
  {
    id: 'business_turnover',
    title: 'The Business Reality',
    context: 'Now about your business financials (separate from your personal salary):',
    type: 'multi-part',
    parts: [
      { id: 'current_turnover', label: 'A) What is your current annual business turnover/revenue?', type: 'text' },
      { id: 'target_turnover', label: 'B) What annual turnover do you think would enable you to live the life you want?', type: 'text' }
    ],
    required: true
  },
  {
    id: 'emergency_log',
    title: 'The Emergency Log',
    context: "Think about the last month. List the 'emergencies' that pulled you away from important work (the 2am calls, the 'only you can fix this' moments)",
    type: 'textarea',
    required: true
  },
  {
    id: 'relationship_mirror',
    title: 'The Relationship Mirror',
    context: "Complete this sentence: 'My business relationship feels like...' (a bad marriage I can't leave? a needy child? a puzzle I'm solving? something else?)",
    type: 'textarea',
    required: true
  },
  {
    id: 'sacrifices',
    title: 'The Sacrifice List',
    context: 'What have you given up or put on hold because of your business? (Check all that apply)',
    type: 'checkbox',
    options: [
      'Starting/growing a family',
      'Hobbies I used to love',
      'Fitness and health',
      'Friendships',
      'Travel and adventure',
      'Sleep and rest',
      'Relationship with partner',
      'Other...'
    ],
    hasOther: true,
    required: true
  },
  {
    id: 'skills_confession',
    title: 'The Skills Confession',
    context: "If you had to hire someone tomorrow to handle the part of your business you're WORST at, what would their job title be?",
    type: 'text',
    required: true
  },
  {
    id: 'ninety_day_fantasy',
    title: 'The 90-Day Fantasy',
    context: "If I guaranteed your business wouldn't collapse, what would you do with the next 90 days?",
    type: 'textarea',
    required: true
  },
  {
    id: 'danger_zone',
    title: 'The Danger Zone',
    context: "What's the one thing that if it broke tomorrow would sink your business?",
    type: 'radio',
    options: [
      'Cash running out',
      'Key person leaving',
      'Major client walking',
      'System/tech failure',
      'Legal/compliance issue',
      'Quality/reputation crisis',
      'Other...'
    ],
    hasOther: true,
    required: true
  },
  {
    id: 'growth_trap',
    title: 'The Growth Trap',
    context: "Finish this thought: 'I'd grow faster if only...'",
    type: 'checkbox',
    options: [
      'I could trust someone else with quality',
      'I understood my numbers better',
      'I had more hours in the day',
      'I knew which customers to target',
      'I had better systems and processes',
      'I could afford the right people',
      'Other...'
    ],
    hasOther: true,
    required: true
  },
  {
    id: 'commitment_hours',
    title: 'The Commitment Question',
    context: "How many hours per week could you realistically dedicate to building a business that runs without you? (Be honest - we'll build a plan that actually fits your life)",
    type: 'radio',
    options: [
      'Less than 5 hours',
      '5-10 hours',
      '10-15 hours',
      '15 hours +'
    ],
    required: true
  },
  {
    id: 'full_name',
    title: 'Full Name',
    context: 'How should we address you in your personalised results?',
    type: 'text',
    required: true
  },
  {
    id: 'company_name',
    title: 'Company Name',
    context: "What's the name of your business?",
    type: 'text',
    required: true
  },
  {
    id: 'has_partners',
    title: 'Do you have any business partners you\'d like to invite?',
    context: 'If yes, we can send them a separate assessment to get their perspective too.',
    type: 'radio',
    options: ['Yes', 'No'],
    required: true
  },
  {
    id: 'partner_emails',
    title: 'Partner Emails',
    context: 'Please enter their email(s) below - (supports comma-separated emails)',
    type: 'text',
    required: false,
    conditional: {
      dependsOn: 'has_partners',
      showWhen: 'Yes'
    }
  }
];

export default function Part1Page() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Load existing progress
  useEffect(() => {
    async function loadProgress() {
      if (!clientSession?.clientId) return;

      try {
        const { data } = await supabase
          .from('client_assessments')
          .select('*')
          .eq('client_id', clientSession.clientId)
          .eq('assessment_type', 'part1')
          .single();

        if (data) {
          setAssessmentId(data.id);
          setResponses(data.responses || {});
          setCurrentIndex(data.current_section || 0);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgress();
  }, [clientSession?.clientId]);

  // Get visible questions (handle conditional)
  const visibleQuestions = part1Questions.filter(q => {
    if (q.conditional) {
      const dependsOnValue = responses[q.conditional.dependsOn];
      return dependsOnValue === q.conditional.showWhen;
    }
    return true;
  });

  // Ensure currentIndex is within bounds
  const safeIndex = Math.min(currentIndex, Math.max(0, visibleQuestions.length - 1));
  const currentQuestion = visibleQuestions[safeIndex];
  const isLastQuestion = safeIndex === visibleQuestions.length - 1;
  
  // Debug logging
  console.log('Assessment state:', { 
    currentIndex, 
    safeIndex, 
    visibleQuestionsLength: visibleQuestions.length,
    currentQuestion: currentQuestion?.id 
  });
  
  // For multi-part questions, check if any part has a value
  const getQuestionValue = (question: typeof currentQuestion) => {
    if (!question) return undefined;
    if (question.type === 'multi-part' && question.parts) {
      // Check if values exist as flat keys (legacy format)
      const partsValue: Record<string, any> = {};
      let hasValue = false;
      question.parts.forEach(part => {
        if (responses[part.id]) {
          partsValue[part.id] = responses[part.id];
          hasValue = true;
        }
      });
      if (hasValue) return partsValue;
      // Otherwise check nested format
      return responses[question.id];
    }
    return responses[question.id];
  };
  
  const currentValue = currentQuestion ? getQuestionValue(currentQuestion) : undefined;
  const canProceed = !currentQuestion?.required || currentValue;

  // Save progress to database
  async function saveProgress(completed = false) {
    if (!clientSession?.clientId || !clientSession?.practiceId) return;

    setIsSaving(true);
    try {
      const assessmentData = {
        practice_id: clientSession.practiceId,
        client_id: clientSession.clientId,
        assessment_type: 'part1',
        responses,
        current_section: currentIndex,
        total_sections: visibleQuestions.length,
        completion_percentage: Math.round(((currentIndex + 1) / visibleQuestions.length) * 100),
        status: completed ? 'completed' : 'in_progress',
        ...(completed && { completed_at: new Date().toISOString() }),
        ...(!assessmentId && { started_at: new Date().toISOString() })
      };

      if (assessmentId) {
        await supabase
          .from('client_assessments')
          .update(assessmentData)
          .eq('id', assessmentId);
      } else {
        const { data } = await supabase
          .from('client_assessments')
          .insert(assessmentData)
          .select()
          .single();
        
        if (data) setAssessmentId(data.id);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  }

  // Handle answer changes - flatten multi-part values
  function handleChange(fieldName: string, value: any) {
    // If value is an object (from multi-part), spread the keys directly
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      setResponses(prev => ({ ...prev, ...value }));
    } else {
      setResponses(prev => ({ ...prev, [fieldName]: value }));
    }
  }

  // Navigation
  async function handleNext() {
    await saveProgress(isLastQuestion);
    
    if (isLastQuestion) {
      // Trigger fit assessment generation
      try {
        await supabase.functions.invoke('fit-assessment', {
          body: {
            clientId: clientSession?.clientId,
            practiceId: clientSession?.practiceId,
            part1Responses: responses
          }
        });
      } catch (error) {
        console.error('Error generating fit assessment:', error);
      }
      
      navigate('/assessments/part2');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // Guard against empty questions array
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Loading assessment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 font-bold text-sm">1</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Life Design</h1>
                <p className="text-xs text-slate-400">Understanding your vision</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm"
              >
                {showSummary ? 'Back to Questions' : 'View All Answers'}
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Save & Exit
              </button>
            </div>
          </div>
          <DotProgress current={currentIndex} total={visibleQuestions.length} />
        </div>
      </div>

      {/* Content */}
      {showSummary ? (
        /* Summary View */
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
          <h2 className="text-xl font-bold text-white mb-6">Your Responses</h2>
          <div className="space-y-6">
            {visibleQuestions.map((q, idx) => {
              const qValue = q.type === 'multi-part' && q.parts
                ? q.parts.reduce((acc, p) => {
                    if (responses[p.id]) acc[p.id] = responses[p.id];
                    return acc;
                  }, {} as Record<string, any>)
                : responses[q.id];
              
              const hasAnswer = qValue && (
                typeof qValue === 'string' ? qValue.trim() : 
                Array.isArray(qValue) ? qValue.length > 0 :
                typeof qValue === 'object' ? Object.keys(qValue).length > 0 :
                true
              );
              
              return (
                <div
                  key={q.id}
                  onClick={() => { setCurrentIndex(idx); setShowSummary(false); }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-emerald-500/50
                    ${hasAnswer ? 'bg-slate-800 border-slate-700' : 'bg-slate-800/50 border-red-500/50'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">{q.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${hasAnswer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {hasAnswer ? 'Answered' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400">
                    {q.type === 'multi-part' && q.parts ? (
                      <div className="space-y-1">
                        {q.parts.map(p => (
                          <div key={p.id}>
                            <span className="text-slate-500">{p.label.split(')')[0]})</span>{' '}
                            <span className="text-slate-300">{responses[p.id] || '—'}</span>
                          </div>
                        ))}
                      </div>
                    ) : Array.isArray(qValue) ? (
                      qValue.join(', ')
                    ) : typeof qValue === 'string' ? (
                      qValue.length > 150 ? qValue.substring(0, 150) + '...' : qValue
                    ) : (
                      <span className="text-slate-500 italic">Click to answer</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Single Question View */
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="animate-fadeIn">
            <QuestionRenderer
              question={currentQuestion}
              value={currentValue}
              onChange={handleChange}
              showInsights={false}
            />
          </div>
        </div>
      )}

      {/* Navigation - hide in summary view */}
      {!showSummary && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800">
          <div className="max-w-2xl mx-auto px-4 py-4 flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                ${currentIndex === 0 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed || isSaving}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
                ${canProceed && !isSaving
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : isLastQuestion ? (
                <>
                  Complete Part 1
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  Continue
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
