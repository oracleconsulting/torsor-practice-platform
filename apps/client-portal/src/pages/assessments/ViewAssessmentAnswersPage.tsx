// ============================================================================
// VIEW ASSESSMENT ANSWERS — Read-only view of completed service-line answers
// ============================================================================

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getAssessmentByCode, type AssessmentQuestion } from '@/config/serviceLineAssessments';
import { ArrowLeft } from 'lucide-react';

const SERVICE_LINE_LABELS: Record<string, string> = {
  systems_audit: 'Systems Audit',
  management_accounts: 'Management Accounts',
  benchmarking: 'Benchmarking',
  fractional_executive: 'Fractional Executive',
};

function formatAnswer(q: AssessmentQuestion, value: unknown): React.ReactNode {
  if (value == null || value === '') return <span className="text-slate-400">—</span>;
  if (q.type === 'staff_roster') {
    const roster = Array.isArray(value) ? value : (typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return []; } })() : []);
    if (roster.length === 0) return <span className="text-slate-400">—</span>;
    return (
      <ul className="list-disc list-inside space-y-1 text-slate-700">
        {roster.map((p: { name?: string; roleTitle?: string; hourlyRate?: number; hoursPerWeek?: number }, i: number) => (
          <li key={i}>
            <strong>{p.name || '—'}</strong>
            {p.roleTitle && ` · ${p.roleTitle}`}
            {p.hourlyRate != null && p.hourlyRate > 0 && ` · £${p.hourlyRate}/hr`}
            {p.hoursPerWeek != null && ` · ${p.hoursPerWeek}h/week`}
          </li>
        ))}
      </ul>
    );
  }
  if (q.type === 'multi' && Array.isArray(value)) {
    return <span>{value.join(', ')}</span>;
  }
  if (q.type === 'single' || q.type === 'text' || q.type === 'slider') {
    return <span>{String(value)}</span>;
  }
  return <span>{String(value)}</span>;
}

export default function ViewAssessmentAnswersPage() {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const { clientSession } = useAuth();
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const assessment = serviceCode ? getAssessmentByCode(serviceCode) : null;

  useEffect(() => {
    if (!clientSession?.clientId || !serviceCode) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        if (serviceCode === 'benchmarking') {
          const { data: engagement } = await supabase
            .from('bm_engagements')
            .select('id')
            .eq('client_id', clientSession.clientId)
            .maybeSingle();
          if (!engagement) {
            setError('No benchmarking assessment found.');
            return;
          }
          const { data: row } = await supabase
            .from('bm_assessment_responses')
            .select('responses')
            .eq('engagement_id', engagement.id)
            .maybeSingle();
          setResponses(row?.responses || {});
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('service_line_assessments')
          .select('responses')
          .eq('client_id', clientSession.clientId)
          .eq('service_line_code', serviceCode)
          .maybeSingle();

        if (fetchError || !data) {
          setError('Assessment answers not found.');
          return;
        }
        setResponses(data.responses || {});
      } catch (e) {
        console.error(e);
        setError('Failed to load answers.');
      } finally {
        setLoading(false);
      }
    })();
  }, [clientSession?.clientId, serviceCode]);

  const title = SERVICE_LINE_LABELS[serviceCode || ''] || (assessment?.name ?? serviceCode ?? 'Assessment');
  const sections = assessment?.sections ?? [];
  const questions = assessment?.questions ?? [];

  if (loading) {
    return (
      <Layout title={title}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (error || (!assessment && serviceCode !== 'benchmarking')) {
    return (
      <Layout title={title}>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-amber-800">{error || 'Assessment not found.'}</p>
          <Link to="/assessments" className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Assessments
          </Link>
        </div>
      </Layout>
    );
  }

  const bySection = new Map<string, AssessmentQuestion[]>();
  questions.forEach((q) => {
    const sec = q.section || 'Other';
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec)!.push(q);
  });
  const orderedSections = sections.length ? sections.filter((s) => bySection.has(s)) : Array.from(bySection.keys());

  return (
    <Layout
      title={`${title} — Your answers`}
      subtitle="Read-only view of your submitted answers"
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          to="/assessments"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assessments
        </Link>

        {orderedSections.map((sectionName) => {
          const sectionQuestions = bySection.get(sectionName) || [];
          if (sectionQuestions.length === 0) return null;
          return (
            <div key={sectionName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <h2 className="px-5 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900">
                {sectionName}
              </h2>
              <dl className="divide-y divide-slate-100">
                {sectionQuestions.map((q) => (
                  <div key={q.id} className="px-5 py-4">
                    <dt className="text-sm font-medium text-slate-500 mb-1">{q.question}</dt>
                    <dd className="text-slate-900">
                      {formatAnswer(q, responses[q.id])}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}

        {serviceCode === 'benchmarking' && Object.keys(responses).length > 0 && !assessment && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <h2 className="px-5 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900">
              Your answers
            </h2>
            <dl className="divide-y divide-slate-100">
              {Object.entries(responses).map(([key, val]) => (
                <div key={key} className="px-5 py-4">
                  <dt className="text-sm font-medium text-slate-500 mb-1">{key.replace(/_/g, ' ')}</dt>
                  <dd className="text-slate-900">
                    {typeof val === 'object' && val !== null && Array.isArray(val)
                      ? (val as unknown[]).join(', ')
                      : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </Layout>
  );
}
