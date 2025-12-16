// ============================================================================
// SERVICE LINE ASSESSMENT PAGE
// ============================================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  getAssessmentByCode, 
  type ServiceLineAssessment, 
  type AssessmentQuestion 
} from '@/config/serviceLineAssessments';
import { 
  ArrowLeft, ArrowRight, Check, Loader2, CheckCircle,
  Target, LineChart, Settings, Users
} from 'lucide-react';

const serviceIcons: Record<string, React.ComponentType<any>> = {
  '365_method': Target,
  'management_accounts': LineChart,
  'systems_audit': Settings,
  'fractional_executive': Users,
};

export default function ServiceAssessmentPage() {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const navigate = useNavigate();
  const { clientSession } = useAuth();
  
  const [assessment, setAssessment] = useState<ServiceLineAssessment | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [checkingSharedInsight, setCheckingSharedInsight] = useState(false);

  useEffect(() => {
    if (serviceCode) {
      const config = getAssessmentByCode(serviceCode);
      if (config) {
        setAssessment(config);
        loadExistingResponses(serviceCode);
      } else {
        navigate('/dashboard');
      }
    }
  }, [serviceCode]);

  const loadExistingResponses = async (code: string) => {
    if (!clientSession?.clientId) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('service_line_assessments')
        .select('responses, completed_at')
        .eq('client_id', clientSession.clientId)
        .eq('service_line_code', code)
        .single();
      if (data) {
        setResponses(data.responses || {});
        if (data.completed_at) setCompleted(true);
      }
    } catch (err) {
      console.log('No existing assessment');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async () => {
    if (!clientSession?.clientId || !assessment) return;
    setSaving(true);
    try {
      const completionPct = Math.round((Object.keys(responses).length / assessment.questions.length) * 100);
      await supabase.from('service_line_assessments').upsert({
        client_id: clientSession.clientId,
        practice_id: clientSession.practiceId,
        service_line_code: assessment.code,
        responses,
        completion_percentage: completionPct,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id,service_line_code' });
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!clientSession?.clientId || !assessment) return;
    setSaving(true);
    try {
      const extractedInsights: Record<string, any> = {};
      assessment.questions.forEach(q => {
        if (q.emotionalAnchor && responses[q.id]) extractedInsights[q.emotionalAnchor] = responses[q.id];
        if (q.technicalField && responses[q.id]) extractedInsights[q.technicalField] = responses[q.id];
      });

      await supabase.from('service_line_assessments').upsert({
        client_id: clientSession.clientId,
        practice_id: clientSession.practiceId,
        service_line_code: assessment.code,
        responses,
        extracted_insights: extractedInsights,
        completion_percentage: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id,service_line_code' });

      const { data: sl } = await supabase.from('service_lines').select('id').eq('code', assessment.code).single();
      if (sl?.id) {
        await supabase.from('client_service_lines').update({ 
          status: 'proposal_sent',
          onboarding_completed_at: new Date().toISOString()
        }).eq('client_id', clientSession.clientId).eq('service_line_id', sl.id);
      }

      setCompleted(true);
      setGeneratingProposal(true);
      try {
        await supabase.functions.invoke('generate-value-proposition', {
          body: { clientId: clientSession.clientId, serviceLineCode: assessment.code, responses, extractedInsights }
        });
      } catch (vpErr) { console.error('VP error:', vpErr); }
      finally { setGeneratingProposal(false); }
    } catch (err) {
      console.error('Complete error:', err);
    } finally {
      setSaving(false);
    }
  };

  const sectionQuestions = assessment?.questions.filter(q => q.section === assessment.sections[currentSection]) || [];
  
  const isComplete = (qs: AssessmentQuestion[]) => qs.every(q => {
    if (!q.required) return true;
    const r = responses[q.id];
    if (q.type === 'text') return r && r.trim().length > 0;
    if (q.type === 'multi') return r && r.length > 0;
    return r !== undefined && r !== null;
  });

  const isSectionComplete = isComplete(sectionQuestions);
  const isAllComplete = isComplete(assessment?.questions || []);

  const handleNav = (dir: number) => {
    saveProgress();
    setCurrentSection(currentSection + dir);
    window.scrollTo(0, 0);
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
  if (!assessment) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Assessment not found</p></div>;

  // Check for shared insights when assessment is complete (for MA)
  useEffect(() => {
    if (completed && serviceCode === 'management_accounts' && clientSession?.clientId && !checkingSharedInsight) {
      setCheckingSharedInsight(true);
      const checkForSharedInsight = async () => {
        try {
          const { data: maInsight } = await supabase
            .from('client_context')
            .select('id, is_shared, content')
            .eq('client_id', clientSession.clientId)
            .eq('context_type', 'note')
            .eq('is_shared', true)
            .eq('processed', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (maInsight && maInsight.content) {
            try {
              const content = typeof maInsight.content === 'string' 
                ? JSON.parse(maInsight.content) 
                : maInsight.content;
              if (content && (content.headline || content.keyInsights || (content.insight && (content.insight.headline || content.insight.keyInsights)))) {
                // Redirect to report page if insight is available
                navigate('/service/management_accounts/report', { replace: true });
                return;
              }
            } catch (e) {
              // Not valid insight, continue to completion page
            }
          }
        } catch (error) {
          console.error('Error checking for shared insight:', error);
        }
      };
      checkForSharedInsight();
    }
  }, [completed, serviceCode, clientSession?.clientId, navigate, checkingSharedInsight]);

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete!</h1>
          <p className="text-gray-600 mb-6">
            {generatingProposal ? "We're preparing your personalized proposal..." : "Your advisor will review your responses shortly."}
          </p>
          {generatingProposal && <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600 mb-6" />}
          {checkingSharedInsight && serviceCode === 'management_accounts' && (
            <div className="mb-6">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
              <p className="text-sm text-gray-500 mt-2">Checking for available insights...</p>
            </div>
          )}
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const Icon = serviceIcons[assessment.code] || Target;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <div className="flex-1">
              <div className="flex items-center gap-2"><Icon className="w-5 h-5 text-indigo-600" /><h1 className="font-bold text-gray-900">{assessment.title}</h1></div>
              <p className="text-sm text-gray-500">{assessment.subtitle}</p>
            </div>
            {saving && <span className="text-gray-500 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Saving...</span>}
          </div>
          <div className="mt-4 flex gap-2">
            {assessment.sections.map((s, i) => {
              const qs = assessment.questions.filter(q => q.section === s);
              const done = isComplete(qs);
              return <button key={s} onClick={() => { saveProgress(); setCurrentSection(i); }} className={`flex-1 h-2 rounded-full ${i === currentSection ? 'bg-indigo-600' : done ? 'bg-emerald-500' : 'bg-gray-200'}`} title={s} />;
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">{assessment.sections[currentSection]}</h2>
          <p className="text-gray-500">Section {currentSection + 1} of {assessment.sections.length}</p>
        </div>

        <div className="space-y-8">
          {sectionQuestions.map(q => (
            <QuestionCard key={q.id} question={q} value={responses[q.id]} onChange={v => setResponses({ ...responses, [q.id]: v })} />
          ))}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button onClick={() => handleNav(-1)} disabled={currentSection === 0} className="flex items-center gap-2 px-4 py-2 text-gray-600 disabled:opacity-50">
            <ArrowLeft className="w-4 h-4" />Previous
          </button>
          {currentSection === assessment.sections.length - 1 ? (
            <button onClick={handleComplete} disabled={!isAllComplete || saving} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg disabled:bg-gray-300">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><Check className="w-4 h-4" />Complete</>}
            </button>
          ) : (
            <button onClick={() => handleNav(1)} disabled={!isSectionComplete} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg disabled:bg-gray-300">
              Next<ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function QuestionCard({ question, value, onChange }: { question: AssessmentQuestion; value: any; onChange: (v: any) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <label className="block text-lg font-medium text-gray-900 mb-4">{question.question}{question.required && <span className="text-red-500 ml-1">*</span>}</label>
      
      {question.type === 'single' && (
        <div className="space-y-2">
          {question.options?.map((opt, i) => (
            <label key={i} className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer ${value === opt ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" checked={value === opt} onChange={() => onChange(opt)} className="w-4 h-4 text-indigo-600" />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'multi' && (
        <div className="space-y-2">
          {question.options?.map((opt, i) => {
            const sel = value?.includes(opt) || false;
            const maxReached = !!(question.maxSelections && value?.length >= question.maxSelections && !sel);
            return (
              <label key={i} className={`flex items-center gap-3 p-4 rounded-lg border-2 ${maxReached ? 'opacity-50 cursor-not-allowed' : sel ? 'border-indigo-500 bg-indigo-50 cursor-pointer' : 'border-gray-200 hover:border-gray-300 cursor-pointer'}`}>
                <input type="checkbox" checked={sel} disabled={maxReached} onChange={e => onChange(e.target.checked ? [...(value || []), opt] : (value || []).filter((v: string) => v !== opt))} className="w-4 h-4 text-indigo-600 rounded" />
                <span>{opt}</span>
              </label>
            );
          })}
          {question.maxSelections && <p className="text-sm text-gray-500 mt-2">Select up to {question.maxSelections} ({value?.length || 0} selected)</p>}
        </div>
      )}

      {question.type === 'text' && (
        <div>
          <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={question.placeholder} maxLength={question.charLimit} rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none" />
          {question.charLimit && <p className="text-sm text-gray-400 text-right mt-1">{value?.length || 0} / {question.charLimit}</p>}
        </div>
      )}
    </div>
  );
}

