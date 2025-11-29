// ============================================================================
// PART 2: BUSINESS DEEP DIVE ASSESSMENT
// ============================================================================
// 72 questions across 12 sections, sectioned navigation

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/Layout';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Circle,
  Eye,
  Save
} from 'lucide-react';

// Import questions from shared package
import { part2Sections, Part2Section, Part2Question } from '@torsor/shared/data/part2-questions';

export default function Part2Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clientSession } = useAuth();
  const isReviewMode = searchParams.get('mode') === 'review';

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(isReviewMode);

  const currentSection = part2Sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === part2Sections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  // Load existing progress
  useEffect(() => {
    async function loadProgress() {
      if (!clientSession?.clientId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('client_assessments')
          .select('*')
          .eq('client_id', clientSession.clientId)
          .eq('assessment_type', 'part2')
          .maybeSingle();

        if (data) {
          setAssessmentId(data.id);
          setResponses(data.responses || {});
          setCurrentSectionIndex(data.current_section || 0);
          if (data.status === 'completed' || isReviewMode) {
            setShowSummary(true);
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProgress();
  }, [clientSession?.clientId, isReviewMode]);

  // Calculate section completion
  const getSectionCompletion = (section: Part2Section) => {
    const requiredQuestions = section.questions.filter(q => q.required);
    const answeredRequired = requiredQuestions.filter(q => {
      const value = responses[q.fieldName];
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    });
    return requiredQuestions.length === 0 ? 100 : 
      Math.round((answeredRequired.length / requiredQuestions.length) * 100);
  };

  const overallCompletion = Math.round(
    part2Sections.reduce((sum, s) => sum + getSectionCompletion(s), 0) / part2Sections.length
  );

  // Save progress
  async function saveProgress(completed = false) {
    if (!clientSession?.clientId || !clientSession?.practiceId) return;

    setIsSaving(true);
    try {
      const assessmentData = {
        practice_id: clientSession.practiceId,
        client_id: clientSession.clientId,
        assessment_type: 'part2',
        responses,
        current_section: currentSectionIndex,
        total_sections: part2Sections.length,
        completion_percentage: overallCompletion,
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

  // Handle changes
  function handleChange(fieldName: string, value: any) {
    setResponses(prev => ({ ...prev, [fieldName]: value }));
  }

  // Navigation
  async function handleNext() {
    await saveProgress(isLastSection);
    if (isLastSection) {
      navigate('/assessment/part3');
    } else {
      setCurrentSectionIndex(prev => prev + 1);
    }
  }

  function handleBack() {
    if (!isFirstSection) {
      setCurrentSectionIndex(prev => prev - 1);
    }
  }

  if (isLoading) {
    return (
      <Layout title="Part 2: Business Deep Dive" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Part 2: Business Deep Dive"
      subtitle={showSummary ? "Review your responses" : currentSection?.title}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/assessments')}
            className="text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Assessments
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
            >
              <Eye className="w-4 h-4" />
              {showSummary ? 'Continue Assessment' : 'View All Answers'}
            </button>
            <span className="text-sm text-slate-500">{overallCompletion}% complete</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${overallCompletion}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Section {currentSectionIndex + 1} of {part2Sections.length}</span>
            <span>{overallCompletion}% Complete</span>
          </div>
        </div>

        {showSummary ? (
          /* Summary View */
          <div className="space-y-6">
            {part2Sections.map((section, sIdx) => (
              <div 
                key={section.shortTitle}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => {
                    setCurrentSectionIndex(sIdx);
                    setShowSummary(false);
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      getSectionCompletion(section) === 100 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {getSectionCompletion(section) === 100 ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{sIdx + 1}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-slate-900">{section.title}</h3>
                      <p className="text-sm text-slate-500">{section.questions.length} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      getSectionCompletion(section) === 100 ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                      {getSectionCompletion(section)}%
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </button>
                
                {/* Show responses preview */}
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {section.questions.slice(0, 4).map(q => (
                      <div key={q.fieldName} className="truncate">
                        <span className="text-slate-500">{q.question.slice(0, 30)}...</span>
                        {responses[q.fieldName] && (
                          <span className="text-slate-700 ml-1">
                            {typeof responses[q.fieldName] === 'object' 
                              ? JSON.stringify(responses[q.fieldName]).slice(0, 20) 
                              : String(responses[q.fieldName]).slice(0, 20)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Question View */
          <div className="space-y-6">
            {/* Section Navigation Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {part2Sections.map((section, idx) => (
                <button
                  key={section.shortTitle}
                  onClick={() => setCurrentSectionIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    idx === currentSectionIndex
                      ? 'bg-indigo-600 text-white'
                      : getSectionCompletion(section) === 100
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {getSectionCompletion(section) === 100 && idx !== currentSectionIndex && (
                    <Check className="w-3 h-3" />
                  )}
                  {section.shortTitle}
                </button>
              ))}
            </div>

            {/* Section Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 text-indigo-200 text-sm mb-2">
                <span>Section {currentSectionIndex + 1}</span>
                <Circle className="w-1 h-1 fill-current" />
                <span>{currentSection.questions.length} questions</span>
              </div>
              <h2 className="text-2xl font-bold">{currentSection.title}</h2>
              <p className="text-indigo-100 mt-2">{currentSection.description}</p>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {currentSection.questions.map((question, qIdx) => (
                <QuestionCard
                  key={question.fieldName}
                  question={question}
                  value={responses[question.fieldName]}
                  onChange={(value) => handleChange(question.fieldName, value)}
                  responses={responses}
                  number={qIdx + 1}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
              <button
                onClick={handleBack}
                disabled={isFirstSection}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isFirstSection
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Section
              </button>
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Save className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : isLastSection ? (
                  <>
                    Complete Part 2
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next Section
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// Question Card Component
function QuestionCard({
  question,
  value,
  onChange,
  responses,
  number
}: {
  question: Part2Question;
  value: any;
  onChange: (value: any) => void;
  responses: Record<string, any>;
  number: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex gap-4">
        <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
          {number}
        </span>
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-medium text-slate-900">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {question.helperText && (
              <p className="text-sm text-slate-500 mt-1">{question.helperText}</p>
            )}
          </div>

          {/* Render based on question type */}
          {question.type === 'text' && (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={question.helperText || 'Enter your answer'}
            />
          )}

          {question.type === 'textarea' && (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={question.helperText || 'Enter your answer'}
            />
          )}

          {question.type === 'radio' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    value === option
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={value === option}
                    onChange={() => onChange(option)}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-slate-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === 'checkbox' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => {
                const isChecked = Array.isArray(value) && value.includes(option);
                return (
                  <label
                    key={option}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      isChecked
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        const current = Array.isArray(value) ? value : [];
                        if (isChecked) {
                          onChange(current.filter((v: string) => v !== option));
                        } else {
                          onChange([...current, option]);
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-slate-700">{option}</span>
                  </label>
                );
              })}
            </div>
          )}

          {question.type === 'slider' && (
            <div className="space-y-2">
              <input
                type="range"
                min={question.min || 0}
                max={question.max || 10}
                value={value || question.min || 0}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-slate-500">
                <span>{question.min || 0}</span>
                <span className="font-medium text-indigo-600">{value ?? '-'}</span>
                <span>{question.max || 10}</span>
              </div>
            </div>
          )}

          {question.type === 'number' && (
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min={question.min}
              max={question.max}
            />
          )}

          {question.type === 'conditional' && question.options && (
            <div className="space-y-4">
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      value === option
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={value === option}
                      onChange={() => onChange(option)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-slate-700">{option}</span>
                  </label>
                ))}
              </div>
              {/* Render conditional questions if visible */}
              {question.conditionalQuestions?.filter(cq => cq.showWhen === value).map(cq => (
                <div key={cq.id} className="ml-6 pl-4 border-l-2 border-indigo-200">
                  <p className="text-sm font-medium text-slate-700 mb-2">{cq.question}</p>
                  {/* Simplified render for conditional questions */}
                  {cq.type === 'text' || cq.type === 'number' ? (
                    <input
                      type={cq.type}
                      value={responses[cq.fieldName] || ''}
                      onChange={(e) => onChange(e.target.value)} // Note: this needs separate handler
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  ) : cq.type === 'radio' && cq.options ? (
                    <div className="space-y-1">
                      {cq.options.map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm">
                          <input type="radio" name={cq.fieldName} className="w-3 h-3" />
                          {opt}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          {question.type === 'matrix' && question.matrixItems && (
            <div className="space-y-3">
              {question.matrixItems.map((item) => (
                <div key={item.fieldName} className="flex items-center gap-4">
                  <span className="w-40 text-sm text-slate-600">{item.label}</span>
                  <input
                    type="range"
                    min={question.min || 0}
                    max={question.max || 10}
                    value={responses[item.fieldName] || question.min || 0}
                    onChange={(e) => {
                      // For matrix items, we need to store in their own field
                      onChange({ ...responses, [item.fieldName]: parseInt(e.target.value) });
                    }}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-8 text-center text-sm font-medium text-indigo-600">
                    {responses[item.fieldName] ?? '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
