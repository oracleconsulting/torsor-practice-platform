// ============================================================================
import type { Page } from '../../types/navigation';
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

// Systems Audit Stage 1 Discovery questions (inline to avoid cross-app import issues)
const SYSTEMS_AUDIT_STAGE1_QUESTIONS = [
  // Section 1: Current Pain
  { id: 'q1_1', section: 'Current Pain', question_text: 'What broke – or is about to break – that made you think about systems?', question_type: 'text' as const, placeholder: 'Be specific – the incident, the near-miss, the frustration that tipped you over...', char_limit: 400, emotional_anchor: 'systems_breaking_point', is_required: true },
  { id: 'q1_2', section: 'Current Pain', question_text: 'How would you describe your current operations?', question_type: 'single' as const, options: ['Controlled chaos – it works but I can\'t explain how', 'Manual heroics – we survive on people\'s goodwill', 'Death by spreadsheet – everything\'s tracked but nothing connects', 'Tech Frankenstein – we\'ve bolted tools together over years', 'Actually pretty good – we just need optimisation'], is_required: true },
  { id: 'q1_3', section: 'Current Pain', question_text: 'If I followed you through a typical month-end, what would embarrass you most?', question_type: 'text' as const, placeholder: 'The workaround you\'re ashamed of, the process you\'d never show an investor...', char_limit: 300, emotional_anchor: 'month_end_shame', is_required: true },
  // Section 2: Impact Quantification
  { id: 'q2_1', section: 'Impact Quantification', question_text: 'How many hours per month do you estimate your team spends on manual data entry, reconciliation, or "making things match"?', question_type: 'single' as const, options: ['Under 10 hours', '10-20 hours', '20-40 hours', '40-80 hours', 'More than 80 hours'], is_required: true },
  { id: 'q2_2', section: 'Impact Quantification', question_text: 'How long does your month-end close currently take?', question_type: 'single' as const, options: ['1-2 days', '3-5 days', '1-2 weeks', '2-4 weeks', 'We don\'t really "close" – it\'s ongoing'], is_required: true },
  { id: 'q2_3', section: 'Impact Quantification', question_text: 'In the last year, how many times have you discovered data errors that affected a business decision?', question_type: 'single' as const, options: ['Never – our data is solid', 'Once or twice – minor issues', 'Several times – some costly', 'Regularly – I don\'t fully trust our numbers', 'I don\'t know – which is the scary part'], is_required: true },
  { id: 'q2_4', section: 'Impact Quantification', question_text: 'What\'s the most expensive mistake caused by a systems/process gap in the last 2 years?', question_type: 'text' as const, placeholder: 'Lost client, tax penalty, missed opportunity, overpayment...', char_limit: 300, emotional_anchor: 'expensive_systems_mistake', is_required: true },
  { id: 'q2_5', section: 'Impact Quantification', question_text: 'How many times last month did someone ask for information and you couldn\'t get it within 5 minutes?', question_type: 'single' as const, options: ['Never', '1-2 times', 'Weekly', 'Daily', 'Constantly'], is_required: true },
  // Section 3: Tech Stack
  { id: 'q3_1', section: 'Tech Stack', question_text: 'Which software tools does your business use? (Select all that apply)', question_type: 'multi' as const, options: ['Xero / QuickBooks / Sage (Accounting)', 'HubSpot / Salesforce / Pipedrive (CRM)', 'Asana / Trello / Monday (Projects)', 'Slack / Teams (Communication)', 'Stripe / GoCardless (Payments)', 'Google Workspace (Email, Docs)', 'Microsoft 365', 'BreatheHR / CharlieHR (HR)', 'Dext / Receipt Bank (Expenses)', 'Other (we\'ll capture in Stage 2)'], is_required: true },
  { id: 'q3_2', section: 'Tech Stack', question_text: 'How would you rate the integration between these systems?', question_type: 'single' as const, options: ['Seamless – data flows automatically', 'Partial – some connected, some manual', 'Minimal – mostly manual transfers', 'Non-existent – each system is an island'], is_required: true },
  { id: 'q3_3', section: 'Tech Stack', question_text: 'How many spreadsheets are "critical" to running your business? (Be honest)', question_type: 'single' as const, options: ['None – everything\'s in proper systems', '1-3 key spreadsheets', '4-10 spreadsheets', '10-20 spreadsheets', 'I\'ve lost count'], is_required: true },
  // Section 4: Focus Areas
  { id: 'q4_1', section: 'Focus Areas', question_text: 'Which areas feel most broken right now? (Select top 3)', question_type: 'multi' as const, max_selections: 3, options: ['Financial reporting / management accounts', 'Accounts payable (paying suppliers)', 'Accounts receivable (getting paid)', 'Inventory / stock management', 'Payroll and HR processes', 'Sales / CRM / pipeline tracking', 'Project management and delivery', 'Client onboarding', 'Compliance and documentation', 'IT infrastructure / security'], is_required: true },
  { id: 'q4_2', section: 'Focus Areas', question_text: 'If you could fix ONE process by magic, which would have the biggest impact?', question_type: 'text' as const, placeholder: 'Describe the process and why fixing it would matter...', char_limit: 300, emotional_anchor: 'magic_process_fix', is_required: true },
  // Section 5: Readiness
  { id: 'q5_1', section: 'Readiness', question_text: 'What\'s your appetite for change right now?', question_type: 'single' as const, options: ['Urgent – we need to fix this yesterday', 'Ready – we\'ve budgeted time and money for this', 'Cautious – we want to improve but can\'t afford disruption', 'Exploring – just want to understand options'], is_required: true },
  { id: 'q5_2', section: 'Readiness', question_text: 'What\'s your biggest fear about tackling systems?', question_type: 'multi' as const, options: ['Cost will spiral out of control', 'Implementation will disrupt operations', 'We\'ll invest and it won\'t work', 'Team won\'t adopt new processes', 'We\'ll become dependent on consultants', 'It\'s too complex to know where to start', 'No major fears – just want to get on with it'], emotional_anchor: 'systems_fears', is_required: true },
  { id: 'q5_3', section: 'Readiness', question_text: 'Who internally would champion this project?', question_type: 'single' as const, options: ['Me – the founder/owner', 'Finance manager/FD', 'Operations manager', 'Office manager', 'IT lead', 'Other'], is_required: true },
  // Section 6: Context
  { id: 'q6_1', section: 'Context', question_text: 'How many people work in your business currently?', question_type: 'text' as const, placeholder: 'Enter number', is_required: true },
  { id: 'q6_2', section: 'Context', question_text: 'How many people do you expect in 12 months?', question_type: 'text' as const, placeholder: 'Enter number', is_required: true },
  { id: 'q6_3', section: 'Context', question_text: 'What\'s your annual revenue band?', question_type: 'single' as const, options: ['Under £250k', '£250k - £500k', '£500k - £1m', '£1m - £2m', '£2m - £5m', '£5m - £10m', '£10m+'], is_required: true },
  { id: 'q6_4', section: 'Context', question_text: 'What industry are you in?', question_type: 'text' as const, placeholder: 'e.g., Professional services, Manufacturing, Retail, Tech...', char_limit: 100, is_required: true },
];


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
      { code: 'systems_audit', name: 'Systems Audit', title: 'Operations Health Check - Stage 1: Discovery (19 questions)', icon: Settings, color: 'cyan', questionCount: 19 },
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
  const [systemsAuditStage, setSystemsAuditStage] = useState<'stage1' | 'stage2' | 'stage3'>('stage1');
  
  // Stage 2 & 3 data
  const [systemCategories, setSystemCategories] = useState<any[]>([]);
  const [processChains, setProcessChains] = useState<any[]>([]);
  const [loadingStage2, setLoadingStage2] = useState(false);
  const [loadingStage3, setLoadingStage3] = useState(false);
  
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
      if (selectedService === 'systems_audit') {
        loadQuestions(selectedService);
        loadStage2Data();
        loadStage3Data();
      } else {
        loadQuestions(selectedService);
      }
    }
  }, [selectedService]);
  
  // Load Stage 2 data (System Categories)
  const loadStage2Data = async () => {
    setLoadingStage2(true);
    try {
      const { data, error } = await supabase
        .from('sa_system_categories')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      setSystemCategories(data || []);
    } catch (err) {
      console.error('Error loading system categories:', err);
    } finally {
      setLoadingStage2(false);
    }
  };
  
  // Load Stage 3 data (Process Chains)
  const loadStage3Data = async () => {
    setLoadingStage3(true);
    try {
      const { data, error } = await supabase
        .from('sa_process_chains')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      setProcessChains(data || []);
    } catch (err) {
      console.error('Error loading process chains:', err);
    } finally {
      setLoadingStage3(false);
    }
  };

  const loadQuestions = async (serviceCode: string) => {
    setLoading(true);
    setError(null);
    try {
      // Systems Audit uses a different structure (Stage 1/2/3)
      // Stage 1 questions are inline here to avoid cross-app import issues
      if (serviceCode === 'systems_audit') {
        console.log('🔍 Loading Systems Audit questions from inline config...');
        console.log('📋 Total questions in config:', SYSTEMS_AUDIT_STAGE1_QUESTIONS.length);
        
        // Convert inline questions to DbQuestion format
        const convertedQuestions: DbQuestion[] = SYSTEMS_AUDIT_STAGE1_QUESTIONS.map((q, idx) => ({
          id: `sa_${q.id}`,
          service_line_code: 'systems_audit',
          question_id: q.id,
          section: q.section,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options || null,
          placeholder: q.placeholder || null,
          char_limit: q.char_limit || null,
          max_selections: q.max_selections || null,
          emotional_anchor: q.emotional_anchor || null,
          technical_field: null,
          is_required: q.is_required,
          display_order: idx + 1,
          is_active: true,
          updated_at: new Date().toISOString()
        }));
        
        console.log('✅ Converted questions:', convertedQuestions.length);
        console.log('📝 First question:', convertedQuestions[0]);
        
        setQuestions(convertedQuestions);
        setError(null); // Clear any previous error
        setLoading(false);
        return;
      }
      
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

        {/* Systems Audit Stage Tabs */}
        {selectedService === 'systems_audit' && (
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={() => setSystemsAuditStage('stage1')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  systemsAuditStage === 'stage1'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stage 1: Discovery (19 questions)
              </button>
              <button
                onClick={() => setSystemsAuditStage('stage2')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  systemsAuditStage === 'stage2'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stage 2: System Inventory
              </button>
              <button
                onClick={() => setSystemsAuditStage('stage3')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  systemsAuditStage === 'stage3'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Stage 3: Process Deep Dives (6 chains)
              </button>
            </div>
          </div>
        )}

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
        {/* Stage 2: System Inventory */}
        {selectedService === 'systems_audit' && systemsAuditStage === 'stage2' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">System Categories</h2>
              <p className="text-sm text-gray-600 mb-4">
                Clients will fill out system cards for each tool they use. Categories are pre-defined in the database.
              </p>
              {loadingStage2 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              ) : systemCategories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {systemCategories.map((cat) => (
                    <div key={cat.id} className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-1">{cat.category_name}</h3>
                      <p className="text-xs text-gray-500 mb-2">Code: {cat.category_code}</p>
                      {cat.common_systems && cat.common_systems.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-600 font-medium mb-1">Common systems:</p>
                          <div className="flex flex-wrap gap-1">
                            {cat.common_systems.slice(0, 3).map((sys: string, idx: number) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {sys}
                              </span>
                            ))}
                            {cat.common_systems.length > 3 && (
                              <span className="text-xs text-gray-500">+{cat.common_systems.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No system categories found. Run the Systems Audit migration.</p>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">System Inventory Fields</h3>
              <p className="text-sm text-blue-700 mb-2">
                When clients fill out system cards, they provide:
              </p>
              <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                <li>Basic info (name, category, vendor, website)</li>
                <li>Usage (users, frequency, criticality)</li>
                <li>Cost (pricing model, monthly/annual cost, cost trend)</li>
                <li>Integration (what it connects to, integration method, manual hours)</li>
                <li>Data quality (score, entry method)</li>
                <li>Satisfaction (user satisfaction, fit for purpose, would recommend)</li>
                <li>Pain points (known issues, workarounds, change one thing)</li>
                <li>Future plans (keep/replace/upgrade, replacement candidate, contract end)</li>
              </ul>
            </div>
          </div>
        )}

        {/* Stage 3: Process Deep Dives */}
        {selectedService === 'systems_audit' && systemsAuditStage === 'stage3' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Process Chains</h2>
              <p className="text-sm text-gray-600 mb-4">
                Consultant-led deep dives into 6 key process chains. Each chain has detailed questions organized by sections.
              </p>
              {loadingStage3 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              ) : processChains.length > 0 ? (
                <div className="space-y-4">
                  {processChains.map((chain) => (
                    <div key={chain.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{chain.chain_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{chain.description}</p>
                        </div>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                          ~{chain.estimated_duration_mins} mins
                        </span>
                      </div>
                      {chain.process_steps && chain.process_steps.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 font-medium mb-2">Process Steps:</p>
                          <div className="flex flex-wrap gap-1">
                            {chain.process_steps.map((step: string, idx: number) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {step}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {chain.trigger_areas && chain.trigger_areas.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-600 font-medium mb-1">Triggered by:</p>
                          <div className="flex flex-wrap gap-1">
                            {chain.trigger_areas.map((area: string, idx: number) => (
                              <span key={idx} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                {area.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No process chains found. Run the Systems Audit migration.</p>
              )}
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">Process Deep Dive Structure</h3>
              <p className="text-sm text-purple-700 mb-2">
                Each process chain has detailed questions organized into sections. Questions are configured in:
              </p>
              <code className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded block mt-2">
                apps/platform/src/config/assessments/process-deep-dives.ts
              </code>
              <p className="text-sm text-purple-700 mt-3">
                The 6 process chains are:
              </p>
              <ul className="text-sm text-purple-700 list-disc list-inside mt-2 space-y-1">
                <li><strong>Quote-to-Cash:</strong> From lead to cash collected</li>
                <li><strong>Procure-to-Pay:</strong> From need to payment</li>
                <li><strong>Hire-to-Retire:</strong> Full employee lifecycle</li>
                <li><strong>Record-to-Report:</strong> From transaction to insight</li>
                <li><strong>Lead-to-Client:</strong> From stranger to customer</li>
                <li><strong>Comply-to-Confirm:</strong> From requirement to filed</li>
              </ul>
            </div>
          </div>
        )}

        {/* Stage 1: Discovery Questions (existing logic) */}
        {(selectedService !== 'systems_audit' || systemsAuditStage === 'stage1') && (
        <>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20">
            {error ? (
              <div className="max-w-2xl mx-auto">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Systems Audit Multi-Stage Structure</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left mt-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{error}</pre>
                </div>
              </div>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
                <p className="text-gray-600 mb-4">Run the database migration to seed the questions.</p>
                <code className="text-sm bg-gray-100 px-3 py-1 rounded">scripts/add-assessment-questions-table.sql</code>
              </>
            )}
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

        {/* Stats - Only show for Stage 1 */}
        {questions.length > 0 && (selectedService !== 'systems_audit' || systemsAuditStage === 'stage1') && (
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
        </>
        )}
        </div>
      </main>
    </div>
  );
}

export default AssessmentPreviewPage;
