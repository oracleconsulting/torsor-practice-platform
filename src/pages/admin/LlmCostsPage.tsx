// =============================================================================
// LlmCostsPage
// =============================================================================
// Admin dashboard for LLM spend across the practice.
// - Top strip: total cost (lifetime / month / 30d), event count, active clients
// - By client: ranked table of who's costing what
// - By operation: which edge function / operation type drives spend
// All amounts in pence are displayed as £.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { PageSkeleton } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { supabase } from '../../lib/supabase';
import {
  Coins,
  Calendar,
  Sparkles,
  Users,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';

interface PracticeSummary {
  practice_id: string;
  event_count: number;
  total_tokens: number;
  total_cost_cents: number;
  month_cost_cents: number;
  last_30d_cost_cents: number;
  active_clients: number;
}

interface ClientSummary {
  client_id: string;
  client_name: string | null;
  company: string | null;
  event_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost_cents: number;
  month_cost_cents: number;
  last_7d_cost_cents: number;
  last_30d_cost_cents: number;
  last_event_at: string | null;
}

interface OperationSummary {
  practice_id: string;
  operation_type: string;
  source_function: string;
  event_count: number;
  input_tokens: number;
  output_tokens: number;
  cost_cents: number;
  month_cost_cents: number;
}

function formatPence(cents: number | null | undefined): string {
  if (!cents || cents <= 0) return '£0';
  const pounds = cents / 100;
  if (pounds < 1) return `${cents}p`;
  return `£${pounds.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatTokens(tokens: number | null | undefined): string {
  if (!tokens) return '0';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return String(tokens);
}

const OPERATION_LABELS: Record<string, string> = {
  advisory_chat: 'Advisory chat (LLM)',
  advisory_embedding: 'Advisory chat (embeddings)',
  fit_profile_generation: 'Fit profile generation',
  vision_generation: '5-year vision generation',
  shift_generation: '6-month shift generation',
  sprint_plan_generation: 'Sprint plan generation',
  value_analysis_generation: 'Value analysis generation',
  advisory_brief_generation: 'Advisory brief generation',
  insight_report_generation: 'Insight report generation',
  director_alignment_generation: 'Director alignment generation',
};

export function LlmCostsPage() {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const practiceId = currentMember?.practice_id ?? null;

  const [practice, setPractice] = useState<PracticeSummary | null>(null);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [operations, setOperations] = useState<OperationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<keyof ClientSummary>('total_cost_cents');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    if (!practiceId) return;
    setLoading(true);
    try {
      const [practiceRes, clientsRes, opsRes] = await Promise.all([
        supabase
          .from('practice_llm_cost_summary')
          .select('*')
          .eq('practice_id', practiceId)
          .maybeSingle(),
        supabase
          .from('client_llm_cost_summary')
          .select('*')
          .eq('practice_id', practiceId)
          .order('total_cost_cents', { ascending: false }),
        supabase
          .from('llm_cost_by_operation')
          .select('*')
          .eq('practice_id', practiceId)
          .order('cost_cents', { ascending: false }),
      ]);

      setPractice((practiceRes.data as PracticeSummary | null) ?? null);
      setClients((clientsRes.data as ClientSummary[] | null) ?? []);
      setOperations((opsRes.data as OperationSummary[] | null) ?? []);
    } catch (err) {
      console.error('[LlmCostsPage] load error:', err);
    } finally {
      setLoading(false);
    }
  }, [practiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedClients = useMemo(() => {
    const out = [...clients];
    out.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [clients, sortKey, sortDir]);

  const toggleSort = useCallback((k: keyof ClientSummary) => {
    if (k === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      setSortDir('desc');
    }
  }, [sortKey]);

  if (loading) {
    return (
      <AdminLayout title="LLM costs">
        <PageSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="LLM costs"
      subtitle="Per-client and per-operation spend across all advisor / generation calls."
    >
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Top strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat
            icon={<Coins className="w-4 h-4 text-emerald-600" />}
            label="Lifetime"
            value={formatPence(practice?.total_cost_cents)}
            sub={`${practice?.event_count ?? 0} events`}
          />
          <Stat
            icon={<Calendar className="w-4 h-4 text-indigo-600" />}
            label="This month"
            value={formatPence(practice?.month_cost_cents)}
            sub="calendar month"
          />
          <Stat
            icon={<TrendingUp className="w-4 h-4 text-amber-600" />}
            label="Last 30 days"
            value={formatPence(practice?.last_30d_cost_cents)}
            sub="rolling window"
          />
          <Stat
            icon={<Users className="w-4 h-4 text-rose-600" />}
            label="Active clients"
            value={String(practice?.active_clients ?? 0)}
            sub={`${formatTokens(practice?.total_tokens)} tokens lifetime`}
          />
        </div>

        {/* By client */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">By client</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total spend per client. Click a column header to sort.
              </p>
            </div>
            <span className="text-xs text-slate-500">{clients.length} clients</span>
          </div>
          {clients.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <Sparkles className="w-6 h-6 mx-auto text-slate-300 mb-2" />
              No LLM events recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <SortableTh label="Client" k="client_name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                    <SortableTh label="Lifetime" k="total_cost_cents" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                    <SortableTh label="This month" k="month_cost_cents" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                    <SortableTh label="Last 7d" k="last_7d_cost_cents" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                    <SortableTh label="Tokens" k="total_tokens" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                    <SortableTh label="Events" k="event_count" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                    <SortableTh label="Last event" k="last_event_at" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedClients.map((c) => (
                    <tr key={c.client_id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{c.client_name ?? '(unknown)'}</div>
                        {c.company && <div className="text-xs text-slate-500">{c.company}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatPence(c.total_cost_cents)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatPence(c.month_cost_cents)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatPence(c.last_7d_cost_cents)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {formatTokens(c.total_tokens)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {c.event_count}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {c.last_event_at
                          ? new Date(c.last_event_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* By operation */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900">By operation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Which edge function or operation type drives spend.
            </p>
          </div>
          {operations.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">No operations yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Operation</th>
                    <th className="px-4 py-2 text-left">Source</th>
                    <th className="px-4 py-2 text-right">Lifetime</th>
                    <th className="px-4 py-2 text-right">This month</th>
                    <th className="px-4 py-2 text-right">Input tokens</th>
                    <th className="px-4 py-2 text-right">Output tokens</th>
                    <th className="px-4 py-2 text-right">Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operations.map((o) => (
                    <tr key={`${o.operation_type}-${o.source_function}`} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-900">
                        {OPERATION_LABELS[o.operation_type] ?? o.operation_type}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        <code>{o.source_function}</code>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {formatPence(o.cost_cents)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {formatPence(o.month_cost_cents)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {formatTokens(o.input_tokens)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {formatTokens(o.output_tokens)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 text-xs">
                        {o.event_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs text-slate-400 italic">
          Costs are estimates based on OpenRouter list pricing at time of call. Actual invoiced cost
          comes from your OpenRouter dashboard.
        </p>
      </div>
    </AdminLayout>
  );
}

function Stat({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SortableTh({
  label, k, sortKey, sortDir, onClick, align = 'left',
}: {
  label: string;
  k: keyof ClientSummary;
  sortKey: keyof ClientSummary;
  sortDir: 'asc' | 'desc';
  onClick: (k: keyof ClientSummary) => void;
  align?: 'left' | 'right';
}) {
  const active = k === sortKey;
  return (
    <th className={`px-4 py-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 hover:text-slate-900 transition-colors ${
          active ? 'text-slate-900' : ''
        }`}
      >
        {label}
        {active && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
      </button>
    </th>
  );
}
