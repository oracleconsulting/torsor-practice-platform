// =============================================================================
// AgentObservationsPage
// =============================================================================
// Lists patterns the advisory agent has flagged across conversations: gaps in
// the platform, recurring tone issues, prompt suggestions, etc. Each entry
// can be acknowledged, marked as actioned, or dismissed.
// Source table: system_observations (one row per de-duped title).
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { PageSkeleton } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Lightbulb,
  Repeat,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';

type ObservationStatus = 'open' | 'acknowledged' | 'actioned' | 'dismissed';

type ObservationType =
  | 'gap'
  | 'pattern'
  | 'tone_drift'
  | 'data_quality'
  | 'prompt_idea'
  | 'feature_idea';

interface Observation {
  id: string;
  observation_type: ObservationType;
  service_line: string | null;
  title: string;
  body: string;
  evidence: Record<string, unknown> | null;
  occurrence_count: number;
  last_observed_at: string;
  status: ObservationStatus;
  reviewed_at: string | null;
  reviewed_notes: string | null;
  source_thread_id: string | null;
  created_at: string;
}

const TYPE_META: Record<
  ObservationType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  gap: { label: 'Gap', icon: AlertTriangle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  pattern: { label: 'Pattern', icon: Repeat, color: 'text-violet-700 bg-violet-50 border-violet-200' },
  tone_drift: { label: 'Tone drift', icon: Sparkles, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  data_quality: {
    label: 'Data quality',
    icon: Settings,
    color: 'text-slate-700 bg-slate-50 border-slate-200',
  },
  prompt_idea: { label: 'Prompt idea', icon: Lightbulb, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  feature_idea: { label: 'Feature idea', icon: Lightbulb, color: 'text-blue-700 bg-blue-50 border-blue-200' },
};

const STATUS_META: Record<ObservationStatus, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-amber-100 text-amber-800' },
  acknowledged: { label: 'Acknowledged', color: 'bg-blue-100 text-blue-800' },
  actioned: { label: 'Actioned', color: 'bg-emerald-100 text-emerald-800' },
  dismissed: { label: 'Dismissed', color: 'bg-slate-100 text-slate-600' },
};

export function AgentObservationsPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ObservationStatus | 'all'>('open');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const practiceId = currentMember?.practice_id ?? null;

  const load = useCallback(async () => {
    if (!practiceId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_observations')
        .select('*')
        .eq('practice_id', practiceId)
        .order('status', { ascending: true })
        .order('occurrence_count', { ascending: false })
        .order('last_observed_at', { ascending: false });
      if (error) throw error;
      setObservations((data ?? []) as Observation[]);
    } catch (err) {
      console.error('[AgentObservationsPage] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = useCallback(
    async (id: string, next: ObservationStatus) => {
      try {
        const { error } = await supabase
          .from('system_observations')
          .update({
            status: next,
            reviewed_at: new Date().toISOString(),
            reviewed_by: currentMember?.id ?? null,
          })
          .eq('id', id);
        if (error) throw error;
        await load();
      } catch (err) {
        console.error('[AgentObservationsPage] update error:', err);
      }
    },
    [currentMember?.id, load],
  );

  const services = useMemo(() => {
    const seen = new Set<string>();
    for (const o of observations) {
      if (o.service_line) seen.add(o.service_line);
    }
    return ['all', ...Array.from(seen).sort()];
  }, [observations]);

  const filtered = useMemo(() => {
    return observations.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (serviceFilter !== 'all' && (o.service_line ?? '') !== serviceFilter) return false;
      return true;
    });
  }, [observations, statusFilter, serviceFilter]);

  const counts = useMemo(() => {
    const c: Record<ObservationStatus, number> = {
      open: 0,
      acknowledged: 0,
      actioned: 0,
      dismissed: 0,
    };
    for (const o of observations) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [observations]);

  if (loading) {
    return (
      <AdminLayout title="Agent observations">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Agent observations"
      subtitle="Patterns and gaps the advisory agent has flagged across conversations."
    >
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Counts strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['open', 'acknowledged', 'actioned', 'dismissed'] as ObservationStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                statusFilter === s
                  ? 'bg-indigo-50 border-indigo-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">
                {STATUS_META[s].label}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{counts[s]}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500">Filter by service:</span>
          {services.map((svc) => (
            <button
              key={svc}
              type="button"
              onClick={() => setServiceFilter(svc)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                serviceFilter === svc
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {svc === 'all' ? 'All' : svc}
            </button>
          ))}
          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-xs text-slate-500 hover:text-slate-900 underline ml-auto"
            >
              Clear status filter
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
            <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No observations match your filters.</p>
            <p className="text-xs text-slate-400 mt-1">
              The agent flags patterns it notices across conversations. Have a few advisor
              conversations on different clients and check back.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o) => {
              const meta = TYPE_META[o.observation_type];
              const expanded = expandedId === o.id;
              const Icon = meta.icon;
              return (
                <li key={o.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : o.id)}
                    className="w-full text-left p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className={`p-1.5 rounded-lg border ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-slate-900 text-sm">{o.title}</h3>
                        <span
                          className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            STATUS_META[o.status].color
                          }`}
                        >
                          {STATUS_META[o.status].label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100">{meta.label}</span>
                        {o.service_line && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100">{o.service_line}</span>
                        )}
                        <span>·</span>
                        <span>
                          {o.occurrence_count} occurrence{o.occurrence_count === 1 ? '' : 's'}
                        </span>
                        <span>·</span>
                        <span>
                          last seen{' '}
                          {new Date(o.last_observed_at).toLocaleDateString(undefined, {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                    )}
                  </button>
                  {expanded && (
                    <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{o.body}</p>
                      {o.evidence && Object.keys(o.evidence).length > 0 && (
                        <details className="text-xs text-slate-500">
                          <summary className="cursor-pointer hover:text-slate-700">
                            <Eye className="w-3 h-3 inline mr-1" /> Evidence
                          </summary>
                          <pre className="mt-2 bg-slate-50 border border-slate-200 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(o.evidence, null, 2)}
                          </pre>
                        </details>
                      )}
                      {o.reviewed_notes && (
                        <p className="text-xs text-slate-500 italic">
                          Note: {o.reviewed_notes}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {o.status !== 'acknowledged' && o.status !== 'actioned' && (
                          <button
                            type="button"
                            onClick={() => void updateStatus(o.id, 'acknowledged')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                          >
                            <Eye className="w-3 h-3" /> Acknowledge
                          </button>
                        )}
                        {o.status !== 'actioned' && (
                          <button
                            type="button"
                            onClick={() => void updateStatus(o.id, 'actioned')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700"
                          >
                            <Check className="w-3 h-3" /> Mark actioned
                          </button>
                        )}
                        {o.status !== 'dismissed' && (
                          <button
                            type="button"
                            onClick={() => void updateStatus(o.id, 'dismissed')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-medium rounded hover:bg-slate-300"
                          >
                            <Trash2 className="w-3 h-3" /> Dismiss
                          </button>
                        )}
                        {(o.status === 'dismissed' || o.status === 'actioned') && (
                          <button
                            type="button"
                            onClick={() => void updateStatus(o.id, 'open')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium rounded hover:bg-amber-200"
                          >
                            <X className="w-3 h-3" /> Re-open
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
