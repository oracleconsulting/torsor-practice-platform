'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Sparkles, Save, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { catalogCaps, tierFromEngagement } from '../../lib/bi/tierCaps';

interface Rec {
  title: string;
  body: string;
  priority?: string;
  rationale?: string;
  suggested_metric_to_track?: string;
}

export function PeriodSummaryEditor({
  biPeriodId,
  practiceTier,
  readOnly,
}: {
  biPeriodId: string | null;
  practiceTier?: string | null;
  readOnly?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headline, setHeadline] = useState('');
  const [narrative, setNarrative] = useState('');
  const [recommendations, setRecommendations] = useState<Rec[]>([]);
  const [status, setStatus] = useState<string>('draft');
  const [rowId, setRowId] = useState<string | null>(null);

  const caps = catalogCaps(tierFromEngagement(practiceTier ?? null));

  const load = useCallback(async () => {
    if (!biPeriodId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('bi_period_summaries').select('*').eq('period_id', biPeriodId).maybeSingle();
    if (data) {
      setRowId(data.id);
      setHeadline(data.headline || '');
      setNarrative(data.narrative || '');
      setRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
      setStatus(data.status || 'draft');
    } else {
      setRowId(null);
      setHeadline('');
      setNarrative('');
      setRecommendations([]);
      setStatus('draft');
    }
    setLoading(false);
  }, [biPeriodId]);

  useEffect(() => {
    void load();
  }, [load]);

  const generateAi = async () => {
    if (!biPeriodId || !caps.aiPeriodSummary) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('generate-bi-period-summary', {
        body: { periodId: biPeriodId },
      });
      if (error) throw error;
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const persist = async (nextStatus: string) => {
    if (!biPeriodId || readOnly) return;
    const { data: bp } = await supabase.from('bi_periods').select('engagement_id').eq('id', biPeriodId).single();
    if (!bp?.engagement_id) return;
    setSaving(true);
    try {
      const payload = {
        period_id: biPeriodId,
        engagement_id: bp.engagement_id,
        headline,
        narrative,
        recommendations,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      };
      if (rowId) {
        await supabase.from('bi_period_summaries').update(payload).eq('id', rowId);
      } else {
        const { data } = await supabase.from('bi_period_summaries').insert(payload).select('id').single();
        setRowId(data?.id ?? null);
      }
      setStatus(nextStatus);
    } finally {
      setSaving(false);
    }
  };

  if (!biPeriodId) return null;
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 py-8">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading period summary…
      </div>
    );
  }

  if (readOnly && (!rowId || !['approved', 'published'].includes(status))) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4 print:break-inside-avoid">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Bespoke period summary</h3>
          <p className="text-xs text-slate-500">Status: {status}</p>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {caps.aiPeriodSummary && (
              <button
                type="button"
                disabled={saving}
                onClick={() => generateAi()}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate AI draft
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('draft')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
            >
              <Save className="w-4 h-4" /> Save draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('pending_review')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-300 text-sm"
            >
              Submit for approval
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('approved')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm"
            >
              <CheckCircle className="w-4 h-4" /> Approve
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist('published')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm"
            >
              Publish
            </button>
          </div>
        )}
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Headline</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm"
          rows={3}
          disabled={readOnly}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Narrative</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm font-mono"
          rows={10}
          disabled={readOnly}
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
        />
      </label>

      <div>
        <span className="font-medium text-slate-700 text-sm">Recommendations</span>
        <div className="mt-2 space-y-3">
          {recommendations.map((r, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2 bg-slate-50">
              <input
                className="w-full border rounded px-2 py-1 text-sm font-medium"
                disabled={readOnly}
                value={r.title}
                onChange={(e) => {
                  const next = [...recommendations];
                  next[i] = { ...r, title: e.target.value };
                  setRecommendations(next);
                }}
              />
              <textarea
                className="w-full border rounded px-2 py-1 text-sm"
                rows={3}
                disabled={readOnly}
                value={r.body}
                onChange={(e) => {
                  const next = [...recommendations];
                  next[i] = { ...r, body: e.target.value };
                  setRecommendations(next);
                }}
              />
            </div>
          ))}
          {!readOnly && (
            <button
              type="button"
              className="text-sm text-indigo-600"
              onClick={() => setRecommendations([...recommendations, { title: '', body: '', priority: 'medium' }])}
            >
              + Add recommendation
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
