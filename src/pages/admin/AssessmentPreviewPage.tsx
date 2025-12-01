// ============================================================================
// ASSESSMENT PREVIEW PAGE
// ============================================================================
// Preview and edit service line assessment questions before going live
// ============================================================================

import { useState } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  Edit2, 
  Save, 
  X, 
  ChevronDown, 
  ChevronRight,
  Target,
  LineChart,
  Settings,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Import assessment configs
import { 
  SERVICE_LINE_ASSESSMENTS,
  type ServiceLineAssessment,
  type AssessmentQuestion
} from '../../config/serviceLineAssessments';

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics' | 'clients' | 'assessments';

interface AssessmentPreviewPageProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const serviceIcons: Record<string, React.ComponentType<any>> = {
  '365_method': Target,
  'management_accounts': LineChart,
  'systems_audit': Settings,
  'fractional_executive': Users,
};

const serviceColors: Record<string, string> = {
  '365_method': 'indigo',
  'management_accounts': 'emerald',
  'systems_audit': 'amber',
  'fractional_executive': 'purple',
};

export function AssessmentPreviewPage({ currentPage, onNavigate }: AssessmentPreviewPageProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editedQuestions, setEditedQuestions] = useState<Record<string, Partial<AssessmentQuestion>>>({});

  const services = Object.entries(SERVICE_LINE_ASSESSMENTS);
  const selectedAssessment = selectedService ? SERVICE_LINE_ASSESSMENTS[selectedService] : null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getQuestionWithEdits = (question: AssessmentQuestion): AssessmentQuestion => {
    const edits = editedQuestions[question.id];
    return edits ? { ...question, ...edits } : question;
  };

  const handleSaveEdit = (questionId: string) => {
    setEditingQuestion(null);
    // In a real implementation, you'd save to database here
    console.log('Saving question:', questionId, editedQuestions[questionId]);
  };

  const handleCancelEdit = (questionId: string) => {
    setEditingQuestion(null);
    // Remove unsaved edits
    const { [questionId]: _, ...rest } = editedQuestions;
    setEditedQuestions(rest);
  };

  // Service selection view
  if (!selectedService) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Assessment Preview</h1>
            <p className="text-gray-600 mt-1">
              Preview and customize assessment questions for each service line
            </p>
          </div>

          <div className="grid gap-4">
            {services.map(([code, assessment]) => {
              const Icon = serviceIcons[code] || Target;
              const color = serviceColors[code] || 'gray';
              const questionCount = assessment.questions.length;
              const sectionCount = assessment.sections.length;

              return (
                <button
                  key={code}
                  onClick={() => setSelectedService(code)}
                  className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-gray-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-${color}-100`}>
                      <Icon className={`w-6 h-6 text-${color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {assessment.name}
                      </h3>
                      <p className="text-gray-600 mt-1">{assessment.title}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>{questionCount} questions</span>
                        <span>•</span>
                        <span>{sectionCount} sections</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900">Note on Editing</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Question edits are currently stored locally. For permanent changes, 
                  the config file needs to be updated. Contact support for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assessment detail view
  const Icon = serviceIcons[selectedService] || Target;
  const color = serviceColors[selectedService] || 'gray';

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
                <div className={`p-2 rounded-lg bg-${color}-100`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">{selectedAssessment?.name}</h1>
                  <p className="text-sm text-gray-500">{selectedAssessment?.title}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewMode === 'edit' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Edit2 className="w-4 h-4 inline mr-2" />
                Edit Mode
              </button>
              <button
                onClick={() => setPreviewMode('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  previewMode === 'preview' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Client Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {previewMode === 'edit' ? (
          // Edit Mode - Collapsible sections with editable questions
          <div className="space-y-4">
            {selectedAssessment?.sections.map((section, sectionIdx) => {
              const sectionQuestions = selectedAssessment.questions.filter(q => q.section === section);
              const isExpanded = expandedSections[section] !== false; // Default expanded

              return (
                <div key={section} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section)}
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
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {sectionQuestions.map((question, qIdx) => {
                        const q = getQuestionWithEdits(question);
                        const isEditing = editingQuestion === question.id;

                        return (
                          <div 
                            key={question.id} 
                            className={`px-6 py-4 border-b border-gray-100 last:border-0 ${
                              isEditing ? 'bg-indigo-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <span className="text-sm text-gray-400 font-mono mt-1">
                                Q{sectionIdx + 1}.{qIdx + 1}
                              </span>
                              <div className="flex-1">
                                {isEditing ? (
                                  // Edit form
                                  <div className="space-y-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Question Text
                                      </label>
                                      <textarea
                                        value={editedQuestions[question.id]?.question ?? q.question}
                                        onChange={(e) => setEditedQuestions({
                                          ...editedQuestions,
                                          [question.id]: {
                                            ...editedQuestions[question.id],
                                            question: e.target.value
                                          }
                                        })}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                      />
                                    </div>
                                    
                                    {q.type !== 'text' && q.options && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Options (one per line)
                                        </label>
                                        <textarea
                                          value={(editedQuestions[question.id]?.options ?? q.options).join('\n')}
                                          onChange={(e) => setEditedQuestions({
                                            ...editedQuestions,
                                            [question.id]: {
                                              ...editedQuestions[question.id],
                                              options: e.target.value.split('\n').filter(o => o.trim())
                                            }
                                          })}
                                          rows={q.options.length}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                        />
                                      </div>
                                    )}

                                    {q.type === 'text' && (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Placeholder Text
                                        </label>
                                        <input
                                          type="text"
                                          value={editedQuestions[question.id]?.placeholder ?? q.placeholder ?? ''}
                                          onChange={(e) => setEditedQuestions({
                                            ...editedQuestions,
                                            [question.id]: {
                                              ...editedQuestions[question.id],
                                              placeholder: e.target.value
                                            }
                                          })}
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        />
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleSaveEdit(question.id)}
                                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                                      >
                                        <Save className="w-4 h-4 inline mr-1" />
                                        Save
                                      </button>
                                      <button
                                        onClick={() => handleCancelEdit(question.id)}
                                        className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // View mode
                                  <div>
                                    <div className="flex items-start justify-between gap-4">
                                      <p className="font-medium text-gray-900">
                                        {q.question}
                                        {q.required && <span className="text-red-500 ml-1">*</span>}
                                      </p>
                                      <button
                                        onClick={() => setEditingQuestion(question.id)}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                      <span className={`px-2 py-0.5 rounded ${
                                        q.type === 'single' ? 'bg-blue-100 text-blue-700' :
                                        q.type === 'multi' ? 'bg-purple-100 text-purple-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {q.type === 'single' ? 'Single Choice' : 
                                         q.type === 'multi' ? 'Multiple Choice' : 
                                         'Free Text'}
                                      </span>
                                      {q.maxSelections && (
                                        <span className="text-gray-500">
                                          Max {q.maxSelections} selections
                                        </span>
                                      )}
                                      {q.charLimit && (
                                        <span className="text-gray-500">
                                          {q.charLimit} char limit
                                        </span>
                                      )}
                                      {q.emotionalAnchor && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                          Anchor: {q.emotionalAnchor}
                                        </span>
                                      )}
                                    </div>

                                    {q.options && (
                                      <ul className="mt-3 space-y-1">
                                        {q.options.map((opt, i) => (
                                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                            <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" />
                                            {opt}
                                          </li>
                                        ))}
                                      </ul>
                                    )}

                                    {q.placeholder && (
                                      <p className="mt-2 text-sm text-gray-400 italic">
                                        Placeholder: "{q.placeholder}"
                                      </p>
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
          // Preview Mode - How clients see it
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Preview header */}
              <div className={`bg-gradient-to-r from-${color}-600 to-${color}-700 px-6 py-8 text-white`}>
                <h2 className="text-2xl font-bold">{selectedAssessment?.title}</h2>
                <p className="text-white/80 mt-2">{selectedAssessment?.subtitle}</p>
              </div>

              {/* Questions preview */}
              <div className="p-6 space-y-8">
                {selectedAssessment?.sections.map((section, sectionIdx) => {
                  const sectionQuestions = selectedAssessment.questions.filter(q => q.section === section);
                  
                  return (
                    <div key={section}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium">
                          {sectionIdx + 1}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">{section}</h3>
                      </div>

                      <div className="space-y-6 pl-11">
                        {sectionQuestions.map((question) => {
                          const q = getQuestionWithEdits(question);
                          
                          return (
                            <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                              <label className="block font-medium text-gray-900 mb-3">
                                {q.question}
                                {q.required && <span className="text-red-500 ml-1">*</span>}
                              </label>

                              {q.type === 'single' && q.options && (
                                <div className="space-y-2">
                                  {q.options.map((opt, i) => (
                                    <label key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-300">
                                      <input type="radio" disabled className="w-4 h-4" />
                                      <span className="text-gray-700">{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              )}

                              {q.type === 'multi' && q.options && (
                                <div className="space-y-2">
                                  {q.options.map((opt, i) => (
                                    <label key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-300">
                                      <input type="checkbox" disabled className="w-4 h-4 rounded" />
                                      <span className="text-gray-700">{opt}</span>
                                    </label>
                                  ))}
                                  {q.maxSelections && (
                                    <p className="text-sm text-gray-500 mt-2">
                                      Select up to {q.maxSelections} options
                                    </p>
                                  )}
                                </div>
                              )}

                              {q.type === 'text' && (
                                <textarea
                                  placeholder={q.placeholder}
                                  disabled
                                  rows={3}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-400"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Stats footer */}
        <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-gray-600">
                <strong>{selectedAssessment?.questions.length}</strong> questions
              </span>
              <span className="text-gray-600">
                <strong>{selectedAssessment?.sections.length}</strong> sections
              </span>
              <span className="text-gray-600">
                <strong>{selectedAssessment?.questions.filter(q => q.emotionalAnchor).length}</strong> emotional anchors
              </span>
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(editedQuestions).length > 0 && (
                <span className="text-amber-600">
                  {Object.keys(editedQuestions).length} unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssessmentPreviewPage;

