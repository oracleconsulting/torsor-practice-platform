// ============================================================================
// OnboardingPipeline — Table view of enrollment entries with filters
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  MoreVertical,
  Send,
  Eye,
  AlertCircle,
  RotateCcw,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import type { PageId } from '../../types/navigation';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon?: React.ReactNode }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-700' },
  invited: { label: 'Invited', className: 'bg-blue-100 text-blue-800' },
  registered: { label: 'Registered', className: 'bg-indigo-100 text-indigo-800' },
  assessment_started: { label: 'Assessment', className: 'bg-amber-100 text-amber-800' },
  assessment_complete: { label: 'Complete', className: 'bg-emerald-100 text-emerald-800' },
  generating: { label: 'Generating', className: 'bg-purple-100 text-purple-800', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  review_pending: { label: 'Review', className: 'bg-orange-100 text-orange-800' },
  published: { label: 'Published', className: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="w-3 h-3" /> },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800' },
};

export interface OnboardingPipelineProps {
  batchId?: string;
  advisorId?: string;
  onNavigate?: (page: PageId) => void;
  onViewClient?: (clientId: string, serviceLineCode: string) => void;
}

export function OnboardingPipeline({ batchId, advisorId, onViewClient }: OnboardingPipelineProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const practiceId = currentMember?.practice_id;

  const [batches, setBatches] = useState<{ id: string; name: string }[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batchId || '');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [advisorFilter, setAdvisorFilter] = useState<string>(advisorId || '');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    if (!practiceId) return;
    const { data } = await supabase
      .from('enrollment_batches')
      .select('id, name')
      .eq('practice_id', practiceId)
      .in('status', ['draft', 'sending', 'active'])
      .order('created_at', { ascending: false });
    setBatches(data || []);
  }, [practiceId]);

  const fetchEntries = useCallback(async () => {
    if (!practiceId) return;
    let q = supabase
      .from('enrollment_entries')
      .select(`
        id,
        client_name,
        client_email,
        client_company,
        status,
        assigned_advisor_id,
        batch_id,
        invited_at,
        updated_at,
        failure_reason,
        practice_member_id,
        enrollment_batches(name, services)
      `)
      .eq('practice_id', practiceId)
      .order('updated_at', { ascending: false });
    if (selectedBatchId) q = q.eq('batch_id', selectedBatchId);
    if (advisorFilter) q = q.eq('assigned_advisor_id', advisorFilter);
    if (statusFilter.length) q = q.in('status', statusFilter);
    const { data } = await q;
    setEntries(data || []);
  }, [practiceId, selectedBatchId, advisorFilter, statusFilter]);

  const fetchTeam = useCallback(async () => {
    if (!practiceId) return;
    const { data } = await supabase
      .from('practice_members')
      .select('id, name')
      .eq('practice_id', practiceId)
      .eq('member_type', 'team')
      .order('name');
    setTeamMembers(data || []);
  }, [practiceId]);

  useEffect(() => {
    fetchBatches();
    fetchTeam();
  }, [fetchBatches, fetchTeam]);

  useEffect(() => {
    if (batchId) setSelectedBatchId(batchId);
  }, [batchId]);

  useEffect(() => {
    fetchEntries();
    setLoading(false);
  }, [fetchEntries]);

  const filteredEntries = search.trim()
    ? entries.filter(
        (e) =>
          e.client_name?.toLowerCase().includes(search.toLowerCase()) ||
          e.client_email?.toLowerCase().includes(search.toLowerCase()) ||
          e.client_company?.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const servicesForEntry = (e: any) => (e.enrollment_batches?.services as string[] | undefined) || [];

  const daysIdle = (e: any) => {
    const t = e.updated_at ? new Date(e.updated_at).getTime() : 0;
    if (!t) return null;
    return Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
  };

  const stats = {
    total: entries.length,
    invited: entries.filter((e) => ['invited', 'registered', 'assessment_started'].includes(e.status)).length,
    inProgress: entries.filter((e) => ['assessment_started', 'assessment_complete', 'generating', 'review_pending'].includes(e.status)).length,
    complete: entries.filter((e) => e.status === 'published').length,
    stalled: entries.filter((e) => {
      const d = daysIdle(e);
      return d !== null && d > 7 && !['published', 'failed'].includes(e.status);
    }).length,
  };

  const toggleStatus = (s: string) => {
    setStatusFilter((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredEntries.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredEntries.map((e) => e.id)));
  };

  const handleRemind = async (entryIds: string[]) => {
    if (!entryIds.length) return;
    setReminding(true);
    try {
      await supabase.functions.invoke('batch-remind-clients', { body: { entryIds } });
      fetchEntries();
    } catch (e) {
      console.warn('Remind failed', e);
    } finally {
      setReminding(false);
      setActionMenuId(null);
    }
  };

  const handleMarkFailed = async (entryId: string, reason: string) => {
    try {
      await supabase.from('enrollment_entries').update({ status: 'failed', failure_reason: reason || null }).eq('id', entryId);
      fetchEntries();
    } catch (e) {
      console.warn('Mark failed error', e);
    }
    setActionMenuId(null);
  };

  if (!practiceId) return null;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-2xl font-bold text-blue-600">{stats.invited}</p>
          <p className="text-xs text-gray-500">Invited</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-2xl font-bold text-emerald-600">{stats.complete}</p>
          <p className="text-xs text-gray-500">Complete</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <p className="text-2xl font-bold text-red-600">{stats.stalled}</p>
          <p className="text-xs text-gray-500">Stalled (&gt;7d)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1">
          {Object.entries(STATUS_CONFIG).map(([key, { label, className }]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleStatus(key)}
              className={`px-2 py-1 rounded-full text-xs font-medium ${statusFilter.includes(key) ? className : 'bg-gray-100 text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={advisorFilter}
          onChange={(e) => setAdvisorFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All advisors</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search name, email, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
        />
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2">
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-indigo-700 font-medium"
          >
            Clear selection
          </button>
          <button
            type="button"
            onClick={() => handleRemind(Array.from(selectedIds))}
            disabled={reminding}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {reminding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Remind all selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 divide-x divide-gray-200">
              <tr>
                <th className="px-3 py-2 text-left w-10">
                  <input type="checkbox" checked={filteredEntries.length > 0 && selectedIds.size === filteredEntries.length} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Client</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Services</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Advisor</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Days idle</th>
                <th className="px-3 py-2 text-right font-medium text-gray-700 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-gray-500">
                    No entries match your filters.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e) => {
                  const statusCfg = STATUS_CONFIG[e.status] || { label: e.status, className: 'bg-gray-100 text-gray-700' };
                  const days = daysIdle(e);
                  const daysClass = days === null ? '' : days < 3 ? 'text-emerald-600' : days <= 7 ? 'text-amber-600' : 'text-red-600';
                  const advisorName = teamMembers.find((m) => m.id === e.assigned_advisor_id)?.name ?? 'Unassigned';
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 divide-x divide-gray-100">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(e.id)}
                          onChange={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(e.id)) next.delete(e.id);
                              else next.add(e.id);
                              return next;
                            });
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{e.client_name}</p>
                        <p className="text-gray-500 text-xs">{e.client_email}</p>
                      </td>
                      <td className="px-3 py-2">{e.client_company || '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {servicesForEntry(e).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{s}</span>
                          ))}
                          {servicesForEntry(e).length === 0 && '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2">{advisorName}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                          {statusCfg.icon}
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className={`px-3 py-2 ${daysClass}`}>{days !== null ? days : '—'}</td>
                      <td className="px-3 py-2 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActionMenuId(actionMenuId === e.id ? null : e.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                        {actionMenuId === e.id && (
                          <div className="absolute right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                            {e.practice_member_id && onViewClient && (
                              <button
                                type="button"
                                onClick={() => { onViewClient(e.practice_member_id, '365_method'); setActionMenuId(null); }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" /> View details
                              </button>
                            )}
                            {['invited', 'registered', 'assessment_started'].includes(e.status) && (
                              <button
                                type="button"
                                onClick={() => handleRemind([e.id])}
                                disabled={reminding}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Send className="w-4 h-4" /> Send reminder
                              </button>
                            )}
                            {e.status === 'failed' && (
                              <button
                                type="button"
                                onClick={() => handleRemind([e.id])}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" /> Re-invite
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { const r = window.prompt('Failure reason (optional)'); handleMarkFailed(e.id, r || ''); }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                            >
                              <AlertCircle className="w-4 h-4" /> Mark failed
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
