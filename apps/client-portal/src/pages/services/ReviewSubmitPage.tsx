// ============================================================================
// SYSTEMS AUDIT — Review & Submit (all 3 stages before formal submission)
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getAssessmentByCode } from '@/config/serviceLineAssessments';
import {
  useCompletenessValidation,
  type CompletenessValidationInput,
  type ValidationIssue,
  type Stage1Question,
  type Stage2System,
  type Stage3Chain,
  type Stage3DeepDive,
} from '@/hooks/useCompletenessValidation';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Edit2,
  Settings,
  Database,
  Workflow,
} from 'lucide-react';

interface Engagement {
  id: string;
  submission_status: string;
  submitted_at: string | null;
  stage_1_completed_at: string | null;
  stage_2_completed_at: string | null;
  stage_3_completed_at: string | null;
}

export default function ReviewSubmitPage() {
  const navigate = useNavigate();
  const { clientSession } = useAuth();

  const [loading, setLoading] = useState(true);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [stage1Responses, setStage1Responses] = useState<Record<string, unknown>>({});
  const [stage2Systems, setStage2Systems] = useState<Stage2System[]>([]);
  const [stage3Chains, setStage3Chains] = useState<Stage3Chain[]>([]);
  const [stage3DeepDives, setStage3DeepDives] = useState<Stage3DeepDive[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'none' | 'warnings'>('none');

  const assessment = useMemo(() => getAssessmentByCode('systems_audit'), []);
  const stage1Questions: Stage1Question[] = useMemo(
    () =>
      (assessment?.questions ?? []).map((q) => ({
        id: q.id,
        section: q.section,
        question: q.question,
        type: q.type,
        required: q.required,
      })),
    [assessment]
  );

  const validationInput: CompletenessValidationInput | null = useMemo(
    () =>
      engagement
        ? {
            stage1Responses,
            stage1Questions,
            stage2Systems,
            stage3Chains,
            stage3DeepDives: stage3DeepDives.map((d) => ({
              chain_code: d.chain_code,
              completed_at: d.completed_at,
              responses: d.responses,
            })),
          }
        : null,
    [
      engagement,
      stage1Responses,
      stage1Questions,
      stage2Systems,
      stage3Chains,
      stage3DeepDives,
    ]
  );

  const validation = useCompletenessValidation(validationInput);

  useEffect(() => {
    if (!clientSession?.clientId) {
      setLoading(false);
      return;
    }
    loadAll();
  }, [clientSession?.clientId]);

  const loadAll = async () => {
    if (!clientSession?.clientId) return;
    try {
      const { data: eng, error: engErr } = await supabase
        .from('sa_engagements')
        .select('id, submission_status, submitted_at, stage_1_completed_at, stage_2_completed_at, stage_3_completed_at')
        .eq('client_id', clientSession.clientId)
        .maybeSingle();

      if (engErr || !eng) {
        setLoading(false);
        return;
      }

      setEngagement(eng as Engagement);

      const [r1, r2, chainsRes, divesRes] = await Promise.all([
        supabase
          .from('service_line_assessments')
          .select('responses')
          .eq('client_id', clientSession.clientId)
          .eq('service_line_code', 'systems_audit')
          .maybeSingle(),
        supabase
          .from('sa_system_inventory')
          .select('id, system_name, category_code, criticality, usage_frequency, manual_hours_monthly, known_issues, workarounds_in_use, change_one_thing, user_satisfaction, future_plan')
          .eq('engagement_id', eng.id),
        supabase
          .from('sa_process_chains')
          .select('id, chain_code, chain_name, is_core, suggestion_reason')
          .or(`is_core.eq.true,and(engagement_id.eq.${eng.id},chain_status.eq.active)`)
          .order('display_order', { ascending: true }),
        supabase
          .from('sa_process_deep_dives')
          .select('chain_code, responses, completed_at')
          .eq('engagement_id', eng.id),
      ]);

      if (r1.data?.responses) setStage1Responses((r1.data.responses as Record<string, unknown>) || {});
      if (r2.data) setStage2Systems((r2.data as Stage2System[]) || []);
      if (chainsRes.data) setStage3Chains((chainsRes.data as Stage3Chain[]) || []);
      if (divesRes.data) setStage3DeepDives((divesRes.data as Stage3DeepDive[]) || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isLocked = engagement?.submission_status === 'submitted';

  const coreChains = stage3Chains.filter((c) => c.is_core);
  const completedChainCodes = new Set(
    stage3DeepDives.filter((d) => d.completed_at).map((d) => d.chain_code)
  );
  const allCoreCompleted = coreChains.length > 0 && coreChains.every((c) => completedChainCodes.has(c.chain_code));
  const suggestedChains = stage3Chains.filter((c) => !c.is_core);
  const suggestedCompleted = suggestedChains.filter((c) => completedChainCodes.has(c.chain_code)).length;

  const canSubmitAllowed =
    !isLocked &&
    validation?.canSubmit === true &&
    allCoreCompleted;

  const hasWarnings = (validation?.issues?.length ?? 0) > 0 && validation?.issues?.some((i) => i.severity === 'warning');
  const warningCount = validation?.issues?.filter((i) => i.severity === 'warning').length ?? 0;

  const handleSubmit = async () => {
    if (!engagement || isLocked) return;
    if (!canSubmitAllowed) return;

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('sa_engagements')
        .update({
          submission_status: 'submitted',
          submitted_at: now,
          stage_1_completed_at: engagement.stage_1_completed_at || now,
          stage_2_completed_at: engagement.stage_2_completed_at || now,
          stage_3_completed_at: engagement.stage_3_completed_at || now,
        })
        .eq('id', engagement.id);

      if (error) throw error;
      setConfirmModal('none');
      navigate('/service/systems_audit/status');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getIssueForQuestion = (questionId: string): ValidationIssue | undefined =>
    validation?.issues?.find((i) => i.questionId === questionId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-md">
          <p className="text-gray-600 mb-6">No Systems Audit engagement found. Complete Stage 1 first.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Systems Audit — Review & Submit</h1>
        <p className="text-gray-600 mb-8">
          Review all your answers before submitting for assessment. Once submitted, answers cannot be changed.
        </p>

        {isLocked && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-blue-800 font-medium">
              Submitted on {engagement.submitted_at ? new Date(engagement.submitted_at).toLocaleDateString() : ''}. Answers are locked.
            </p>
          </div>
        )}

        {/* Stage 1 */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Stage 1: Discovery</h2>
          </div>
          {validation && (
            <p className="text-sm text-gray-600 mb-4">
              {validation.stage1Score.answered}/{validation.stage1Score.total} questions answered
              {validation.stage1Score.flagged > 0 && (
                <span className="text-amber-600 ml-2">
                  — {validation.stage1Score.flagged} flagged as incomplete
                </span>
              )}
            </p>
          )}
          <div className="space-y-4">
            {stage1Questions.map((q) => {
              const raw = stage1Responses[q.id];
              const display =
                raw === undefined || raw === null
                  ? '—'
                  : Array.isArray(raw)
                    ? (raw as string[]).join(', ')
                    : String(raw);
              const issue = getIssueForQuestion(q.id);
              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg border ${
                    issue?.severity === 'error'
                      ? 'bg-red-50 border-red-200'
                      : issue?.severity === 'warning'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-700">{q.question}</p>
                  <p className="text-gray-900 mt-1">{display || '—'}</p>
                  {issue && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle
                        className={`w-4 h-4 ${issue.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`}
                      />
                      <span className={`text-xs ${issue.severity === 'error' ? 'text-red-600' : 'text-amber-600'}`}>
                        {issue.message}
                      </span>
                    </div>
                  )}
                  {!isLocked && (
                    <Link
                      to="/service/systems_audit/assessment"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 mt-2 hover:underline"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Stage 2 */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Stage 2: System Inventory</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {stage2Systems.length} systems added
            {validation && validation.stage2Score.flagged > 0 && (
              <span className="text-amber-600 ml-2">— {validation.stage2Score.flagged} flagged</span>
            )}
          </p>
          <ul className="space-y-2">
            {stage2Systems.map((s) => (
              <li key={s.id || s.system_name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-gray-900">
                  {s.system_name || 'Unnamed'} — {(s as any).criticality || '—'}
                </span>
                {!isLocked && (
                  <Link
                    to="/service/systems_audit/inventory"
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Stage 3 */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Workflow className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Stage 3: Process Deep Dives</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {validation?.stage3Score.chainsCompleted ?? 0}/{validation?.stage3Score.chainsTotal ?? 0} chains completed
            {suggestedChains.length > 0 && (
              <span className="text-gray-500 ml-2">
                ({suggestedCompleted} suggested)
              </span>
            )}
          </p>
          <ul className="space-y-2">
            {stage3Chains.map((c) => {
              const done = completedChainCodes.has(c.chain_code);
              const isSuggested = !c.is_core;
              return (
                <li
                  key={c.chain_code}
                  className={`flex items-center justify-between py-2 border-b border-gray-100 last:border-0 ${isSuggested ? 'pl-2 border-l-2 border-purple-200' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {done ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <span className="text-gray-900">{c.chain_name || c.chain_code}</span>
                    {isSuggested && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                        Recommended for your industry
                      </span>
                    )}
                  </div>
                  {!isLocked && (
                    <Link
                      to="/service/systems_audit/process-deep-dives"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {done ? 'Review' : 'Start'}
                      <Edit2 className="w-3 h-3" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          {allCoreCompleted && suggestedChains.length > 0 && suggestedCompleted < suggestedChains.length && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-amber-800">
                You have {suggestedChains.length - suggestedCompleted} recommended process deep dive(s) still to complete.
                These are optional but will improve the quality of your assessment.
              </p>
            </div>
          )}
        </section>

        {/* Completeness summary */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Completeness Summary</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              {validation && validation.stage1Score.answered >= (validation.stage1Score.total - 3) ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
              Stage 1: {validation?.stage1Score.answered ?? 0}/{validation?.stage1Score.total ?? 0} answered
              {(validation?.stage1Score.flagged ?? 0) > 0 && ` (${validation.stage1Score.flagged} flagged)`}
            </li>
            <li className="flex items-center gap-2">
              {stage2Systems.length > 0 ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
              Stage 2: {stage2Systems.length} systems catalogued
            </li>
            <li className="flex items-center gap-2">
              {allCoreCompleted ? (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
              Stage 3: {validation?.stage3Score.chainsCompleted ?? 0}/{validation?.stage3Score.chainsTotal ?? 0} chains
              {suggestedChains.length > 0 && ` (${suggestedCompleted} suggested)`}
            </li>
          </ul>
          {hasWarnings && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {warningCount} answer(s) look incomplete and may affect the quality of your assessment.
                We recommend reviewing flagged items.
              </p>
            </div>
          )}
        </section>

        {!isLocked && (
          <>
            <button
              onClick={() => {
                if (hasWarnings && canSubmitAllowed) {
                  setConfirmModal('warnings');
                } else if (canSubmitAllowed) {
                  handleSubmit();
                }
              }}
              disabled={!allCoreCompleted || !validation?.canSubmit || submitting}
              className="w-full py-3 px-6 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Submit for Assessment
            </button>
            <p className="text-xs text-gray-500 mt-3 text-center">
              By submitting, you confirm these answers are complete. They cannot be changed after submission.
            </p>
          </>
        )}

        {/* Confirmation modal for warnings */}
        {confirmModal === 'warnings' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <p className="text-gray-900 font-medium mb-2">Submit anyway?</p>
              <p className="text-sm text-gray-600 mb-6">
                {warningCount} answer(s) look incomplete and may affect the quality of your assessment.
                Are you sure you want to submit?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal('none')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Review Flagged Items
                </button>
                <button
                  onClick={() => handleSubmit()}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Submit Anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
