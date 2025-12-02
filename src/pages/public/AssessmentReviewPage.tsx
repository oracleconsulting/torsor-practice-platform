// ============================================================================
// PUBLIC ASSESSMENT REVIEW PAGE
// ============================================================================
// Allows external reviewers (like Jeremy) to preview assessments
// without needing to log in to the platform
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  CheckCircle, ChevronDown, ChevronRight, MessageSquare,
  Compass, Zap, LineChart, Settings, TrendingUp, Briefcase,
  BarChart3, Shield, Gem, Users, Loader2
} from 'lucide-react';

interface Question {
  id: string;
  service_line_code: string;
  question_id: string;
  section: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  placeholder: string | null;
  emotional_anchor: string | null;
  display_order: number;
}

const ASSESSMENT_CONFIG: Record<string, { name: string; icon: any; color: string; description: string }> = {
  destination_discovery: { name: 'Destination Discovery', icon: Compass, color: 'indigo', description: 'Understanding where clients want to go' },
  service_diagnostic: { name: 'Service Diagnostics', icon: Zap, color: 'amber', description: 'Mapping needs to services' },
  management_accounts: { name: 'Management Accounts', icon: LineChart, color: 'emerald', description: 'Financial Visibility Diagnostic' },
  systems_audit: { name: 'Systems Audit', icon: Settings, color: 'cyan', description: 'Operations Health Check' },
  fractional_cfo: { name: 'Fractional CFO', icon: TrendingUp, color: 'blue', description: 'Financial Leadership Diagnostic' },
  fractional_coo: { name: 'Fractional COO', icon: Briefcase, color: 'violet', description: 'Operational Leadership Diagnostic' },
  combined_advisory: { name: 'Combined CFO/COO', icon: Users, color: 'purple', description: 'Executive Capacity Diagnostic' },
  business_advisory: { name: 'Business Advisory & Exit', icon: Shield, color: 'rose', description: 'Value Protection Diagnostic' },
  benchmarking: { name: 'Benchmarking', icon: BarChart3, color: 'teal', description: 'Industry Comparison Assessment' },
  hidden_value_audit: { name: 'Hidden Value Audit', icon: Gem, color: 'rose', description: 'Deep analysis of hidden value' },
};

export function AssessmentReviewPage() {
  // Parse URL params without React Router
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const type = searchParams.get('type') || 'discovery';
  const practice = searchParams.get('practice') || '';
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Determine which assessments to show
  const assessmentCodes = type === 'discovery' 
    ? ['destination_discovery', 'service_diagnostic']
    : type === 'service_onboarding'
    ? ['management_accounts', 'systems_audit', 'fractional_cfo', 'fractional_coo', 'business_advisory', 'benchmarking']
    : type === 'value_audit'
    ? ['hidden_value_audit']
    : ['destination_discovery', 'service_diagnostic', 'hidden_value_audit'];

  useEffect(() => {
    loadQuestions();
  }, [type]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .in('service_line_code', assessmentCodes)
        .eq('is_active', true)
        .order('display_order');

      if (!error && data) {
        setQuestions(data);
        // Auto-expand first section of each assessment
        const firstSections: Record<string, boolean> = {};
        assessmentCodes.forEach(code => {
          const first = data.find(q => q.service_line_code === code);
          if (first) firstSections[`${code}-${first.section}`] = true;
        });
        setExpandedSections(firstSections);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    
    // In a real implementation, this would send an email or save to DB
    // For now, we'll just show a success message
    setFeedbackSent(true);
    
    // Could also trigger an Edge Function to email the feedback
    console.log('Feedback:', feedback);
  };

  // Group questions by assessment and section
  const groupedQuestions = assessmentCodes.reduce((acc, code) => {
    const codeQuestions = questions.filter(q => q.service_line_code === code);
    const sections = [...new Set(codeQuestions.map(q => q.section))];
    acc[code] = { questions: codeQuestions, sections };
    return acc;
  }, {} as Record<string, { questions: Question[]; sections: string[] }>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Assessment Review</h1>
              <p className="text-sm text-gray-500">
                {practice ? `From ${practice}` : 'Client Discovery Assessments'}
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-2">
            Please review these assessments and provide any feedback before they go live to clients.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Assessment Cards */}
        {assessmentCodes.map(code => {
          const config = ASSESSMENT_CONFIG[code];
          const data = groupedQuestions[code];
          if (!config || !data?.questions.length) return null;
          
          const Icon = config.icon;
          
          return (
            <div key={code} className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
              {/* Assessment Header */}
              <div className={`p-6 bg-gradient-to-r from-${config.color}-50 to-${config.color}-100/50 border-b border-${config.color}-100`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-${config.color}-100 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${config.color}-600`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{config.name}</h2>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-2xl font-bold text-gray-900">{data.questions.length}</div>
                    <div className="text-xs text-gray-500">questions</div>
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="divide-y divide-gray-100">
                {data.sections.map(section => {
                  const sectionKey = `${code}-${section}`;
                  const isExpanded = expandedSections[sectionKey];
                  const sectionQuestions = data.questions.filter(q => q.section === section);

                  return (
                    <div key={sectionKey}>
                      <button
                        onClick={() => toggleSection(sectionKey)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">{section}</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {sectionQuestions.length} questions
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 pb-4 space-y-4">
                          {sectionQuestions.map((question, idx) => (
                            <div key={question.id} className="pl-8 border-l-2 border-gray-100">
                              <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="text-gray-800">{question.question_text}</p>
                                  <div className="flex items-center gap-3 mt-2">
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      question.question_type === 'single' ? 'bg-blue-50 text-blue-600' :
                                      question.question_type === 'multi' ? 'bg-purple-50 text-purple-600' :
                                      question.question_type === 'text' ? 'bg-green-50 text-green-600' :
                                      'bg-amber-50 text-amber-600'
                                    }`}>
                                      {question.question_type}
                                    </span>
                                    {question.emotional_anchor && (
                                      <span className="text-xs text-gray-400">
                                        AI anchor: {question.emotional_anchor}
                                      </span>
                                    )}
                                  </div>
                                  {question.options && question.options.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {question.options.map((opt, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-50 text-gray-700 text-sm rounded-full border border-gray-200">
                                          {opt}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {question.placeholder && (
                                    <p className="mt-2 text-sm text-gray-400 italic">
                                      Placeholder: "{question.placeholder}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Feedback Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Your Feedback</h3>
          </div>

          {feedbackSent ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700">Thank you! Your feedback has been noted.</span>
            </div>
          ) : (
            <>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share any thoughts, suggestions, or concerns about these assessments..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSendFeedback}
                  disabled={!feedback.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send Feedback
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This is a preview of assessments from {practice || 'RPGCC'}.</p>
          <p className="mt-1">Reply to the email if you have any questions.</p>
        </div>
      </div>
    </div>
  );
}

export default AssessmentReviewPage;

