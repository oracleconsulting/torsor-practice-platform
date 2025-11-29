// ============================================================================
// PART 3: HIDDEN VALUE AUDIT
// ============================================================================
// 32 questions across 6 sections with insights and benchmarks

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
  Save,
  Lightbulb,
  TrendingUp
} from 'lucide-react';

// Import questions from shared package
import { part3Sections, Part3Section, Part3Question } from '@torsor/shared/data/part3-questions';

export default function Part3Page() {
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

  const currentSection = part3Sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === part3Sections.length - 1;
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
          .eq('assessment_type', 'part3')
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
  const getSectionCompletion = (section: Part3Section) => {
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
    part3Sections.reduce((sum, s) => sum + getSectionCompletion(s), 0) / part3Sections.length
  );

  // Save progress
  async function saveProgress(completed = false) {
    if (!clientSession?.clientId || !clientSession?.practiceId) return;

    setIsSaving(true);
    try {
      const assessmentData = {
        practice_id: clientSession.practiceId,
        client_id: clientSession.clientId,
        assessment_type: 'part3',
        responses,
        current_section: currentSectionIndex,
        total_sections: part3Sections.length,
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
      // All assessments complete, go to review
      navigate('/assessments');
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
      <Layout title="Part 3: Hidden Value Audit" subtitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Part 3: Hidden Value Audit"
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
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${overallCompletion}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>Section {currentSectionIndex + 1} of {part3Sections.length}</span>
            <span>{overallCompletion}% Complete</span>
          </div>
        </div>

        {showSummary ? (
          /* Summary View */
          <div className="space-y-6">
            {part3Sections.map((section, sIdx) => (
              <div 
                key={section.id}
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
                        <span className="text-sm font-medium">{section.number}</span>
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
                
                {/* Theme */}
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <p className="text-sm text-slate-600 italic">{section.theme}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Question View */
          <div className="space-y-6">
            {/* Section Navigation Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {part3Sections.map((section, idx) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSectionIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    idx === currentSectionIndex
                      ? 'bg-amber-500 text-white'
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
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 text-amber-200 text-sm mb-2">
                <span>Section {currentSection.number}</span>
                <Circle className="w-1 h-1 fill-current" />
                <span>{currentSection.questions.length} questions</span>
              </div>
              <h2 className="text-2xl font-bold">{currentSection.title}</h2>
              <p className="text-amber-100 mt-2">{currentSection.description}</p>
              <p className="text-white/80 mt-3 italic text-sm">"{currentSection.theme}"</p>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {currentSection.questions.map((question, qIdx) => (
                <Part3QuestionCard
                  key={question.fieldName}
                  question={question}
                  value={responses[question.fieldName]}
                  onChange={(value) => handleChange(question.fieldName, value)}
                  responses={responses}
                  onMatrixChange={handleChange}
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
                className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Save className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : isLastSection ? (
                  <>
                    Complete Assessment
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

// Part 3 Question Card Component with insights and benchmarks
function Part3QuestionCard({
  question,
  value,
  onChange,
  responses,
  onMatrixChange,
  number
}: {
  question: Part3Question;
  value: any;
  onChange: (value: any) => void;
  responses: Record<string, any>;
  onMatrixChange: (fieldName: string, value: any) => void;
  number: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex gap-4">
        <span className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm font-medium text-amber-700">
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

          {/* Insight Badge */}
          {question.insight && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{question.insight}</p>
            </div>
          )}

          {/* Benchmark Badge */}
          {question.benchmark && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{question.benchmark}</p>
            </div>
          )}

          {/* Render based on question type */}
          {question.type === 'text' && (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder={question.placeholder || 'Enter your answer'}
            />
          )}

          {question.type === 'textarea' && (
            <textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder={question.placeholder || 'Enter your answer'}
            />
          )}

          {question.type === 'number' && (
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder={question.placeholder || 'Enter a number'}
              min={question.min}
              max={question.max}
            />
          )}

          {question.type === 'percentage' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={value || ''}
                onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-24 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="0"
                min={0}
                max={100}
              />
              <span className="text-slate-500">%</span>
            </div>
          )}

          {question.type === 'radio' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    value === option
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    checked={value === option}
                    onChange={() => onChange(option)}
                    className="w-4 h-4 text-amber-600"
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
                        ? 'border-amber-500 bg-amber-50'
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
                      className="w-4 h-4 text-amber-600 rounded"
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
                max={question.max || 100}
                step={question.step || 1}
                value={value || question.min || 0}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-slate-500">
                <span>{question.min || 0}{question.format === 'percentage' ? '%' : ''}</span>
                <span className="font-medium text-amber-600">
                  {value ?? '-'}{question.format === 'percentage' ? '%' : ''}
                </span>
                <span>{question.max || 100}{question.format === 'percentage' ? '%' : ''}</span>
              </div>
            </div>
          )}

          {question.type === 'matrix' && question.matrixRows && question.matrixColumns && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left p-2"></th>
                    {question.matrixColumns.map(col => (
                      <th key={col} className="p-2 text-center font-medium text-slate-600 min-w-[100px]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {question.matrixRows.map(row => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="p-2 text-slate-700">{row.label}</td>
                      {question.matrixColumns!.map((col, colIdx) => (
                        <td key={col} className="p-2 text-center">
                          <input
                            type="radio"
                            name={row.fieldName}
                            checked={responses[row.fieldName] === col}
                            onChange={() => onMatrixChange(row.fieldName, col)}
                            className="w-4 h-4 text-amber-600"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
