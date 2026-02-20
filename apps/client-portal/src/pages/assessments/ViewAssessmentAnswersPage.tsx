// ============================================================================
// VIEW ASSESSMENT ANSWERS — Read-only view of completed service-line answers
// ============================================================================
// For Systems Audit: shows Stage 1 (discovery), Stage 2 (inventory), Stage 3 (deep dives).
// For other service lines: shows single-stage assessment answers.
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

const CHAIN_LABELS: Record<string, string> = {
  quote_to_cash: 'Quote-to-Cash (Revenue)',
  procure_to_pay: 'Procure-to-Pay (Spending)',
  hire_to_retire: 'Hire-to-Retire (People)',
  record_to_report: 'Record-to-Report (Finance)',
  lead_to_client: 'Lead-to-Client (Sales & Marketing)',
  comply_to_confirm: 'Comply-to-Confirm (Regulatory)',
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

interface SaSystemRow {
  id: string;
  system_name: string;
  category_code: string;
  criticality: string | null;
  usage_frequency: string | null;
  manual_hours_monthly: number | null;
  known_issues: string | null;
  workarounds_in_use: string | null;
  change_one_thing: string | null;
  user_satisfaction: number | null;
  future_plan: string | null;
}

interface SaDeepDiveRow {
  chain_code: string;
  responses: Record<string, unknown>;
  key_pain_points: string[] | null;
  hours_identified: number | null;
  completed_at: string | null;
}

export default function ViewAssessmentAnswersPage() {
  const { serviceCode } = useParams<{ serviceCode: string }>();
  const { clientSession } = useAuth();
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saInventory, setSaInventory] = useState<SaSystemRow[]>([]);
  const [saDeepDives, setSaDeepDives] = useState<SaDeepDiveRow[]>([]);
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

        if (serviceCode === 'systems_audit') {
          const { data: saEng } = await supabase
            .from('sa_engagements')
            .select('id')
            .eq('client_id', clientSession.clientId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (saEng?.id) {
            const [invRes, divesRes] = await Promise.all([
              supabase
                .from('sa_system_inventory')
                .select('id, system_name, category_code, criticality, usage_frequency, manual_hours_monthly, known_issues, workarounds_in_use, change_one_thing, user_satisfaction, future_plan')
                .eq('engagement_id', saEng.id)
                .order('system_name'),
              supabase
                .from('sa_process_deep_dives')
                .select('chain_code, responses, key_pain_points, hours_identified, completed_at')
                .eq('engagement_id', saEng.id),
            ]);
            setSaInventory(invRes.data || []);
            setSaDeepDives(divesRes.data || []);
          }
        }
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

        {serviceCode === 'systems_audit' && orderedSections.length > 0 && (
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Stage 1: Discovery</h2>
        )}

        {orderedSections.map((sectionName) => {
          const sectionQuestions = bySection.get(sectionName) || [];
          if (sectionQuestions.length === 0) return null;
          return (
            <div key={sectionName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <h3 className="px-5 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900">
                {sectionName}
              </h3>
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

        {serviceCode === 'systems_audit' && saInventory.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Stage 2: System inventory</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <p className="px-5 py-3 text-sm text-slate-500 border-b border-slate-100">
                Systems you listed and how you use them.
              </p>
              <ul className="divide-y divide-slate-100">
                {saInventory.map((sys) => (
                  <li key={sys.id} className="px-5 py-4">
                    <div className="font-medium text-slate-900">{sys.system_name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      {sys.category_code && <span>Category: {sys.category_code.replace(/_/g, ' ')}</span>}
                      {sys.criticality && <span>Criticality: {sys.criticality.replace(/_/g, ' ')}</span>}
                      {sys.usage_frequency && <span>Use: {sys.usage_frequency}</span>}
                      {sys.manual_hours_monthly != null && sys.manual_hours_monthly > 0 && (
                        <span>Manual: {sys.manual_hours_monthly}h/mo</span>
                      )}
                      {sys.user_satisfaction != null && <span>Satisfaction: {sys.user_satisfaction}/5</span>}
                      {sys.future_plan && <span>Plan: {sys.future_plan}</span>}
                    </div>
                    {(sys.known_issues || sys.workarounds_in_use || sys.change_one_thing) && (
                      <div className="mt-2 space-y-1 text-sm text-slate-700">
                        {sys.known_issues && <p><span className="text-slate-500">Issues:</span> {sys.known_issues}</p>}
                        {sys.workarounds_in_use && <p><span className="text-slate-500">Workarounds:</span> {sys.workarounds_in_use}</p>}
                        {sys.change_one_thing && <p><span className="text-slate-500">Change one thing:</span> {sys.change_one_thing}</p>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {serviceCode === 'systems_audit' && saDeepDives.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Stage 3: Process deep dives</h2>
            <div className="space-y-4">
              {saDeepDives.map((dive) => (
                <div key={dive.chain_code} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <h3 className="px-5 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-900">
                    {CHAIN_LABELS[dive.chain_code] || dive.chain_code.replace(/_/g, ' ')}
                  </h3>
                  {(dive.hours_identified != null && dive.hours_identified > 0) && (
                    <p className="px-5 py-2 text-sm text-slate-600">
                      Hours identified (wasted): {dive.hours_identified} per week
                    </p>
                  )}
                  {dive.key_pain_points && dive.key_pain_points.length > 0 && (
                    <div className="px-5 py-2 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-500 mb-1">Key pain points</p>
                      <ul className="list-disc list-inside text-sm text-slate-700 space-y-0.5">
                        {dive.key_pain_points.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {dive.responses && typeof dive.responses === 'object' && Object.keys(dive.responses).length > 0 && (
                    <dl className="px-5 py-4 border-t border-slate-100 divide-y divide-slate-50">
                      {Object.entries(dive.responses).map(([key, val]) => {
                        if (val == null || val === '') return null;
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                        const display = Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val);
                        return (
                          <div key={key} className="py-2 first:pt-0">
                            <dt className="text-xs font-medium text-slate-500">{label}</dt>
                            <dd className="text-slate-900 text-sm mt-0.5">{display}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

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
