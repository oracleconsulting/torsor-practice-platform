// ============================================================================
// STAFF INTERVIEW PAGE (Stage 3b)
// ============================================================================
// Shared link: /staff-interview/:engagementId — no auth required.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import {
  STAFF_INTERVIEW_QUESTIONS,
  STAFF_INTERVIEW_SECTIONS,
  STAFF_IDENTITY_FIELDS,
  type StaffInterviewQuestion,
  type StaffInterviewIdentity,
} from '@/config/staffInterviewQuestions';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, MessageSquare } from 'lucide-react';

type Step = 'intro' | 'identity' | 'questions' | 'thankyou';

export default function StaffInterviewPage() {
  const { engagementId } = useParams<{ engagementId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('intro');
  const [engagement, setEngagement] = useState<{ id: string; staff_interviews_anonymous: boolean } | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [identity, setIdentity] = useState<StaffInterviewIdentity>({ role_title: '', tenure: '' });
  const [responses, setResponses] = useState<Record<string, string | string[]>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const saveTimeoutRef = useState<NodeJS.Timeout | null>(null)[0];

  const anonymous = engagement?.staff_interviews_anonymous ?? true;

  // Validate engagement and load or create interview
  useEffect(() => {
    if (!engagementId) {
      setError('Invalid link');
      setLoading(false);
      return;
    }
    const run = async () => {
      const { data: eng, error: engError } = await supabase
        .from('sa_engagements')
        .select('id, staff_interviews_enabled, staff_interviews_anonymous')
        .eq('id', engagementId)
        .single();
      if (engError || !eng?.id || !(eng as any).staff_interviews_enabled) {
        setError('This link is not active.');
        setEngagement(null);
        setLoading(false);
        return;
      }
      setEngagement({ id: eng.id, staff_interviews_anonymous: (eng as any).staff_interviews_anonymous ?? true });
      setLoading(false);
    };
    run();
  }, [engagementId]);

  const createInterviewRow = useCallback(async () => {
    if (!engagementId || !engagement) return;
    setSaving(true);
    try {
      const { data: row, error: insertError } = await supabase
        .from('sa_staff_interviews')
        .insert({
          engagement_id: engagementId,
          role_title: '',
          department: null,
          tenure: '',
          staff_name: null,
          anonymous,
          responses: {},
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (insertError) throw insertError;
      if (row?.id) {
        setInterviewId(row.id);
        setStep('identity');
      }
    } catch (e: any) {
      setError(e?.message || 'Could not start interview');
    } finally {
      setSaving(false);
    }
  }, [engagementId, engagement, anonymous]);

  const saveIdentityAndStart = useCallback(async () => {
    if (!interviewId) return;
    setSaving(true);
    try {
      await supabase
        .from('sa_staff_interviews')
        .update({
          role_title: identity.role_title,
          department: identity.department || null,
          tenure: identity.tenure,
          staff_name: anonymous ? null : (identity.staff_name || null),
          updated_at: new Date().toISOString(),
        })
        .eq('id', interviewId);
      setStep('questions');
    } catch (e: any) {
      setError(e?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  }, [interviewId, identity, anonymous]);

  const saveResponses = useCallback(async (nextResponses: Record<string, string | string[]>) => {
    if (!interviewId) return;
    const { error: updateError } = await supabase
      .from('sa_staff_interviews')
      .update({ responses: nextResponses, updated_at: new Date().toISOString() })
      .eq('id', interviewId);
    if (updateError) console.error('Auto-save error:', updateError);
  }, [interviewId]);

  useEffect(() => {
    if (step !== 'questions' || !interviewId || Object.keys(responses).length === 0) return;
    const t = setTimeout(() => saveResponses(responses), 800);
    return () => clearTimeout(t);
  }, [responses, step, interviewId, saveResponses]);

  const completeInterview = useCallback(async () => {
    if (!interviewId) return;
    setSaving(true);
    try {
      await supabase
        .from('sa_staff_interviews')
        .update({
          responses,
          status: 'complete',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', interviewId);
      setStep('thankyou');
    } catch (e: any) {
      setError(e?.message || 'Could not submit');
    } finally {
      setSaving(false);
    }
  }, [interviewId, responses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !engagement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  // Intro
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <MessageSquare className="w-10 h-10 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Your Systems Experience</h1>
          </div>
          <p className="text-gray-700 mb-4">
            Your business is about to make some changes to how your systems work together. Before anything changes, we want to understand your daily experience — what works, what doesn&apos;t, and what you&apos;d change.
          </p>
          <p className="text-gray-600 mb-4">This takes about 8 minutes. Your honest answers directly shape which tools and processes get prioritised.</p>
          {anonymous ? (
            <p className="text-gray-600 mb-6">Your responses are anonymous — your name will not be attached to your answers.</p>
          ) : (
            <p className="text-gray-600 mb-6">Your name will be attached to your responses so the team can follow up if needed.</p>
          )}
          <button
            onClick={createInterviewRow}
            disabled={saving}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Begin'}
          </button>
        </div>
      </div>
    );
  }

  // Identity (interview row created on "Begin")
  if (step === 'identity' && interviewId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg w-full">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">About you</h2>
          {!anonymous && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{STAFF_IDENTITY_FIELDS.staff_name.label}</label>
              <input
                type="text"
                value={identity.staff_name ?? ''}
                onChange={(e) => setIdentity((i) => ({ ...i, staff_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder={STAFF_IDENTITY_FIELDS.staff_name.placeholder}
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{STAFF_IDENTITY_FIELDS.role_title.label} *</label>
            <input
              type="text"
              value={identity.role_title}
              onChange={(e) => setIdentity((i) => ({ ...i, role_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={STAFF_IDENTITY_FIELDS.role_title.placeholder}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{STAFF_IDENTITY_FIELDS.department.label}</label>
            <input
              type="text"
              value={identity.department ?? ''}
              onChange={(e) => setIdentity((i) => ({ ...i, department: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={STAFF_IDENTITY_FIELDS.department.placeholder}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">{STAFF_IDENTITY_FIELDS.tenure.label} *</label>
            <input
              type="text"
              value={identity.tenure}
              onChange={(e) => setIdentity((i) => ({ ...i, tenure: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={STAFF_IDENTITY_FIELDS.tenure.placeholder}
            />
          </div>
          <button
            onClick={saveIdentityAndStart}
            disabled={saving || !identity.role_title.trim() || !identity.tenure.trim()}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Continue to questions'}
          </button>
        </div>
      </div>
    );
  }

  // Thank you
  if (step === 'thankyou') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you</h1>
          <p className="text-gray-700">
            Your input has been recorded. It will directly inform which systems and processes get improved — and how. The goal is to make your working day better, not just the view from the top.
          </p>
        </div>
      </div>
    );
  }

  // Questions (section by section)
  const sectionName = STAFF_INTERVIEW_SECTIONS[currentSectionIndex];
  const sectionQuestions = STAFF_INTERVIEW_QUESTIONS.filter((q) => q.section === sectionName);
  const isLastSection = currentSectionIndex === STAFF_INTERVIEW_SECTIONS.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {STAFF_INTERVIEW_SECTIONS.map((name, i) => (
            <button
              key={name}
              onClick={() => setCurrentSectionIndex(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                i === currentSectionIndex ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{sectionName}</h2>
          <div className="space-y-6">
            {sectionQuestions.map((q) => (
              <QuestionBlock
                key={q.id}
                question={q}
                value={responses[q.id]}
                onChange={(v) => setResponses((r) => ({ ...r, [q.id]: v }))}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentSectionIndex((i) => Math.max(0, i - 1))}
              disabled={currentSectionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
            {isLastSection ? (
              <button
                onClick={completeInterview}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit
              </button>
            ) : (
              <button
                onClick={() => setCurrentSectionIndex((i) => i + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionBlock({
  question,
  value,
  onChange,
}: {
  question: StaffInterviewQuestion;
  value: string | string[] | undefined;
  onChange: (v: string | string[]) => void;
}) {
  const limit = question.charLimit ?? 800;
  if (question.type === 'single' && question.options) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          {question.question} {question.required && '*'}
        </label>
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="rounded border-gray-300 text-indigo-600"
              />
              <span className="text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {question.question} {question.required && '*'}
      </label>
      <textarea
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value.slice(0, limit))}
        placeholder={question.placeholder}
        rows={4}
        maxLength={limit}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
      <p className="text-xs text-gray-500 mt-1">{typeof value === 'string' ? value.length : 0}/{limit}</p>
    </div>
  );
}
