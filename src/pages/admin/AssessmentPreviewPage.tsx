// ============================================================================
// ASSESSMENT PREVIEW PAGE
// ============================================================================
// Preview and edit service line assessment questions
// Changes are saved to database and available for AI/VP generation
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Navigation } from '../../components/Navigation';
import { 
  ArrowLeft, Eye, Edit2, Save, X, ChevronDown, ChevronRight,
  Target, LineChart, Settings, Users, CheckCircle, AlertCircle,
  Loader2, RefreshCw, Gem, Compass, Zap, TrendingUp, Briefcase,
  BarChart3, Shield, Mail, Send
} from 'lucide-react';
import { useCurrentMember } from '../../hooks/useCurrentMember';

type Page = 'heatmap' | 'management' | 'readiness' | 'analytics' | 'clients' | 'assessments' | 'delivery' | 'config' | 'cpd' | 'training' | 'knowledge';

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

// Group assessments by type
const ASSESSMENT_GROUPS = [
  {
    title: 'Client Discovery',
    subtitle: 'Understand where clients want to go',
    assessments: [
      { code: 'destination_discovery', name: 'Destination Discovery', title: '20 questions to understand goals and vision', icon: Compass, color: 'indigo', questionCount: 20 },
      { code: 'service_diagnostic', name: 'Service Diagnostics', title: '15 questions to map needs to services', icon: Zap, color: 'amber', questionCount: 15 },
    ]
  },
  {
    title: 'Service Line Onboarding',
    subtitle: 'Detailed assessments for each service',
    assessments: [
      { code: 'management_accounts', name: 'Management Accounts', title: 'Financial Visibility Diagnostic', icon: LineChart, color: 'emerald' },
      { code: 'systems_audit', name: 'Systems Audit', title: 'Operations Health Check', icon: Settings, color: 'cyan' },
      { code: 'fractional_cfo', name: 'Fractional CFO', title: 'Financial Leadership Diagnostic', icon: TrendingUp, color: 'blue' },
      { code: 'fractional_coo', name: 'Fractional COO', title: 'Operational Leadership Diagnostic', icon: Briefcase, color: 'violet' },
      { code: 'combined_advisory', name: 'Combined CFO/COO', title: 'Executive Capacity Diagnostic', icon: Users, color: 'purple' },
      { code: 'business_advisory', name: 'Business Advisory & Exit', title: 'Value Protection Diagnostic', icon: Shield, color: 'rose' },
      { code: 'benchmarking', name: 'Benchmarking', title: 'Industry Comparison Assessment', icon: BarChart3, color: 'teal' },
    ]
  },
  {
    title: 'Value Discovery',
    subtitle: 'Deep analysis of hidden value',
    assessments: [
      { code: 'hidden_value_audit', name: 'Hidden Value Audit', title: '32 questions across 6 sections', icon: Gem, color: 'rose', questionCount: 32 },
    ]
  }
];

// Flattened for lookup
const SERVICE_LINE_INFO = ASSESSMENT_GROUPS.flatMap(g => g.assessments);

export function AssessmentPreviewPage({ currentPage, onNavigate }: AssessmentPreviewPageProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
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
  
  // Share for review modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareForm, setShareForm] = useState({
    recipientEmail: '',
    recipientName: '',
    assessmentType: 'discovery' as 'discovery' | 'service_onboarding' | 'value_audit' | 'all',
    customMessage: ''
  });
  const [sendingReview, setSendingReview] = useState(false);
  
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

  const handleSendReview = async () => {
    if (!shareForm.recipientEmail || !currentMember?.practice_id) {
      setError('Please enter a valid email address');
      return;
    }

    setSendingReview(true);
    setError(null);

    try {
      const { error: fnError } = await supabase.functions.invoke('send-assessment-review', {
        body: {
          recipientEmail: shareForm.recipientEmail,
          recipientName: shareForm.recipientName,
          senderName: currentMember?.name || 'Team Member',
          senderEmail: currentMember?.email,
          practiceId: currentMember.practice_id,
          assessmentType: shareForm.assessmentType,
          customMessage: shareForm.customMessage
        }
      });

      if (fnError) throw fnError;
      
      setSuccessMessage(`Review request sent to ${shareForm.recipientEmail}`);
      setShowShareModal(false);
      setShareForm({ recipientEmail: '', recipientName: '', assessmentType: 'discovery', customMessage: '' });
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error sending review:', err);
      setError('Failed to send review request. Please try again.');
    } finally {
      setSendingReview(false);
    }
  };

  // Get unique sections
  const sections = [...new Set(questions.map(q => q.section))];

  // Service selection view
  if (!selectedService) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation currentPage={currentPage} onNavigate={onNavigate} />
        
        <main className="ml-64 p-8">
          <div className="max-w-5xl">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assessment Preview & Editor</h1>
                <p className="text-gray-600 mt-1">
                  Edit assessment questions - changes are saved to the database and used for AI value propositions
                </p>
              </div>
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Share for Review
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-700">{successMessage}</span>
              </div>
            )}

          <div className="space-y-8">
            {ASSESSMENT_GROUPS.map((group) => (
              <div key={group.title}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{group.title}</h2>
                  <p className="text-sm text-gray-500">{group.subtitle}</p>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  {group.assessments.map((service) => {
                    const Icon = service.icon;
                    return (
                      <button
                        key={service.code}
                        onClick={() => setSelectedService(service.code)}
                        className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-gray-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl bg-${service.color}-100`}>
                            <Icon className={`w-5 h-5 text-${service.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                                {service.name}
                              </h3>
                              {(service as any).questionCount && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  {(service as any).questionCount} Qs
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 truncate">{service.title}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Stats Overview */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <div className="text-2xl font-bold text-indigo-600">35</div>
              <div className="text-sm text-indigo-700">Discovery Questions</div>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <div className="text-2xl font-bold text-emerald-600">7</div>
              <div className="text-sm text-emerald-700">Service Onboardings</div>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
              <div className="text-2xl font-bold text-rose-600">32</div>
              <div className="text-sm text-rose-700">Value Audit Questions</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
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

          {/* Share for Review Modal */}
          {showShareModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Mail className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Share for Review</h2>
                        <p className="text-sm text-gray-500">Send assessments to a colleague for feedback</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowShareModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      value={shareForm.recipientEmail}
                      onChange={(e) => setShareForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                      placeholder="colleague@company.com"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={shareForm.recipientName}
                      onChange={(e) => setShareForm(prev => ({ ...prev, recipientName: e.target.value }))}
                      placeholder="Jeremy"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assessments to Review
                    </label>
                    <select
                      value={shareForm.assessmentType}
                      onChange={(e) => setShareForm(prev => ({ ...prev, assessmentType: e.target.value as typeof shareForm.assessmentType }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="discovery">Client Discovery (Destination + Diagnostics)</option>
                      <option value="service_onboarding">Service Line Onboarding</option>
                      <option value="value_audit">Hidden Value Audit</option>
                      <option value="all">All Assessments</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message (optional)
                    </label>
                    <textarea
                      value={shareForm.customMessage}
                      onChange={(e) => setShareForm(prev => ({ ...prev, customMessage: e.target.value }))}
                      placeholder="Please review these before we send to clients..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendReview}
                    disabled={sendingReview || !shareForm.recipientEmail}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Review Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  const serviceInfo = SERVICE_LINE_INFO.find(s => s.code === selectedService);
  const Icon = serviceInfo?.icon || Target;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={onNavigate} />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

        {/* Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 mb-4">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700">{successMessage}</span>
          </div>
        )}

        {/* Content */}
        <div>
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
      </main>
    </div>
  );
}

export default AssessmentPreviewPage;
