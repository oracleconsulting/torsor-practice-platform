// ============================================================================
// ASSESSMENT PREVIEW PAGE
// ============================================================================
// Preview and edit service line assessment questions
// Changes are saved to database and available for AI/VP generation
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { 
  ArrowLeft, Eye, Edit2, Save, X, ChevronDown, ChevronRight,
  Target, LineChart, Settings, Users, CheckCircle, AlertCircle,
  Loader2, RefreshCw
} from 'lucide-react';

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics' | 'clients' | 'assessments';

interface AssessmentPreviewPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface DbQuestion {
  id: string;
  service_line_code: string;
  question_id: string;
  section: string;
  question_text: string;
  question_type: 'single' | 'multi' | 'text' | 'rank';
  options: string[] | null;
  placeholder: string | null;
  char_limit: number | null;
  max_selections: number | null;
  emotional_anchor: string | null;
  technical_field: string | null;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  updated_at: string;
}

const SERVICE_LINE_INFO = [
  { code: 'management_accounts', name: 'Management Accounts', title: 'Financial Visibility Diagnostic', icon: LineChart, color: 'emerald' },
  { code: 'systems_audit', name: 'Systems Audit', title: 'Operations Health Check', icon: Settings, color: 'amber' },
  { code: 'fractional_executive', name: 'Fractional CFO/COO', title: 'Executive Capacity Diagnostic', icon: Users, color: 'purple' },
];

export function AssessmentPreviewPage(_props: AssessmentPreviewPageProps) {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  
  // Database state
  const [questions, setQuestions] = useState<DbQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Edit state
  const [editForm, setEditForm] = useState<{
    question_text: string;
    options: string[];
    placeholder: string;
  }>({ question_text: '', options: [], placeholder: '' });

  // Load questions when service is selected
  useEffect(() => {
    if (selectedService) {
      loadQuestions(selectedService);
    }
  }, [selectedService]);

  const loadQuestions = async (serviceCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .eq('service_line_code', serviceCode)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions. Make sure you\'ve run the database migration.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (question: DbQuestion) => {
    setEditingQuestion(question.id);
    setEditForm({
      question_text: question.question_text,
      options: question.options || [],
      placeholder: question.placeholder || ''
    });
  };

  const handleSave = async (questionId: string) => {
    setSaving(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('assessment_questions')
        .update({
          question_text: editForm.question_text,
          options: editForm.options.length > 0 ? editForm.options : null,
          placeholder: editForm.placeholder || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', questionId);

      if (error) throw error;

      // Update local state
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { ...q, question_text: editForm.question_text, options: editForm.options, placeholder: editForm.placeholder }
          : q
      ));
      
      setEditingQuestion(null);
      setSuccessMessage('Question saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving question:', err);
      setError('Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingQuestion(null);
    setEditForm({ question_text: '', options: [], placeholder: '' });
  };

  // Get unique sections
  const sections = [...new Set(questions.map(q => q.section))];

  // Service selection view
  if (!selectedService) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Assessment Preview & Editor</h1>
            <p className="text-gray-600 mt-1">
              Edit assessment questions - changes are saved to the database and used for AI value propositions
            </p>
          </div>

          <div className="grid gap-4">
            {SERVICE_LINE_INFO.map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.code}
                  onClick={() => setSelectedService(service.code)}
                  className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-${service.color}-100`}>
                      <Icon className={`w-6 h-6 text-${service.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-gray-600 mt-1">{service.title}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-emerald-900">Database-Backed Questions</h4>
                <p className="text-sm text-emerald-700 mt-1">
                  All changes are saved permanently and immediately available for AI-powered value proposition generation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const serviceInfo = SERVICE_LINE_INFO.find(s => s.code === selectedService);
  const Icon = serviceInfo?.icon || Target;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedService(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${serviceInfo?.color}-100`}>
                  <Icon className={`w-5 h-5 text-${serviceInfo?.color}-600`} />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">{serviceInfo?.name}</h1>
                  <p className="text-sm text-gray-500">{serviceInfo?.title}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadQuestions(selectedService)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Refresh questions"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewMode === 'edit' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Edit2 className="w-4 h-4 inline mr-2" />
                Edit
              </button>
              <button
                onClick={() => setPreviewMode('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewMode === 'preview' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700">{successMessage}</span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600 mb-4">Run the database migration to seed the questions.</p>
            <code className="text-sm bg-gray-100 px-3 py-1 rounded">scripts/add-assessment-questions-table.sql</code>
          </div>
        ) : previewMode === 'edit' ? (
          // Edit Mode
          <div className="space-y-4">
            {sections.map((section, sectionIdx) => {
              const sectionQuestions = questions.filter(q => q.section === section);
              const isExpanded = expandedSections[section] !== false;

              return (
                <div key={section} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
                        {sectionIdx + 1}
                      </span>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{section}</h3>
                        <p className="text-sm text-gray-500">{sectionQuestions.length} questions</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {sectionQuestions.map((question, qIdx) => {
                        const isEditing = editingQuestion === question.id;

                        return (
                          <div key={question.id} className={`px-6 py-4 border-b border-gray-100 last:border-0 ${isEditing ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                            <div className="flex items-start gap-4">
                              <span className="text-sm text-gray-400 font-mono mt-1">Q{sectionIdx + 1}.{qIdx + 1}</span>
                              <div className="flex-1">
                                {isEditing ? (
                                  // Edit Form
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                      <textarea
                                        value={editForm.question_text}
                                        onChange={(e) => setEditForm({ ...editForm, question_text: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    
                                    {question.question_type !== 'text' && question.options && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Options (one per line)</label>
                                        <textarea
                                          value={editForm.options.join('\n')}
                                          onChange={(e) => setEditForm({ ...editForm, options: e.target.value.split('\n').filter(o => o.trim()) })}
                                          rows={Math.min(10, (question.options?.length || 5))}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                        />
                                      </div>
                                    )}

                                    {question.question_type === 'text' && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder Text</label>
                                        <input
                                          type="text"
                                          value={editForm.placeholder}
                                          onChange={(e) => setEditForm({ ...editForm, placeholder: e.target.value })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleSave(question.id)}
                                        disabled={saving}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:bg-indigo-400"
                                      >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save to Database
                                      </button>
                                      <button
                                        onClick={handleCancel}
                                        className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // View Mode
                                  <div>
                                    <div className="flex items-start justify-between gap-4">
                                      <p className="font-medium text-gray-900">
                                        {question.question_text}
                                        {question.is_required && <span className="text-red-500 ml-1">*</span>}
                                      </p>
                                      <button
                                        onClick={() => startEditing(question)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                      <span className={`px-2 py-0.5 rounded ${
                                        question.question_type === 'single' ? 'bg-blue-100 text-blue-700' :
                                        question.question_type === 'multi' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {question.question_type === 'single' ? 'Single Choice' : question.question_type === 'multi' ? 'Multiple Choice' : 'Free Text'}
                                      </span>
                                      {question.max_selections && <span className="text-gray-500">Max {question.max_selections}</span>}
                                      {question.char_limit && <span className="text-gray-500">{question.char_limit} chars</span>}
                                      {question.emotional_anchor && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                          AI: {question.emotional_anchor}
                                        </span>
                                      )}
                                    </div>

                                    {question.options && (
                                      <ul className="mt-3 space-y-1">
                                        {question.options.slice(0, 5).map((opt, i) => (
                                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                                            {opt}
                                          </li>
                                        ))}
                                        {question.options.length > 5 && (
                                          <li className="text-sm text-gray-400">+{question.options.length - 5} more options</li>
                                        )}
                                      </ul>
                                    )}

                                    {question.placeholder && (
                                      <p className="mt-2 text-sm text-gray-400 italic">"{question.placeholder}"</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // Preview Mode
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className={`bg-gradient-to-r from-${serviceInfo?.color}-600 to-${serviceInfo?.color}-700 px-6 py-8 text-white`}>
                <h2 className="text-2xl font-bold">{serviceInfo?.title}</h2>
                <p className="text-white/80 mt-2">Help us understand your needs</p>
              </div>

              <div className="p-6 space-y-8">
                {sections.map((section, sectionIdx) => {
                  const sectionQuestions = questions.filter(q => q.section === section);
                  
                  return (
                    <div key={section}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
                          {sectionIdx + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{section}</h3>
                      </div>

                      <div className="space-y-6 pl-11">
                        {sectionQuestions.map((question) => (
                          <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                            <label className="block font-medium text-gray-900 mb-3">
                              {question.question_text}
                              {question.is_required && <span className="text-red-500 ml-1">*</span>}
                            </label>

                            {question.question_type === 'single' && question.options && (
                              <div className="space-y-2">
                                {question.options.map((opt, i) => (
                                  <label key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                    <input type="radio" disabled className="w-4 h-4" />
                                    <span className="text-gray-700">{opt}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {question.question_type === 'multi' && question.options && (
                              <div className="space-y-2">
                                {question.options.map((opt, i) => (
                                  <label key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                                    <input type="checkbox" disabled className="w-4 h-4 rounded" />
                                    <span className="text-gray-700">{opt}</span>
                                  </label>
                                ))}
                                {question.max_selections && (
                                  <p className="text-sm text-gray-500 mt-2">Select up to {question.max_selections}</p>
                                )}
                              </div>
                            )}

                            {question.question_type === 'text' && (
                              <textarea
                                placeholder={question.placeholder || ''}
                                disabled
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-400"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {questions.length > 0 && (
          <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <span className="text-gray-600"><strong>{questions.length}</strong> questions</span>
                <span className="text-gray-600"><strong>{sections.length}</strong> sections</span>
                <span className="text-gray-600"><strong>{questions.filter(q => q.emotional_anchor).length}</strong> AI anchors</span>
              </div>
              <span className="text-gray-500">Last updated: {questions[0]?.updated_at ? new Date(questions[0].updated_at).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssessmentPreviewPage;
