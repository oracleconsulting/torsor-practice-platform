'use client';

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Upload, Database } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SumaryImportPanelProps {
  clientId: string;
  practiceId?: string | null;
  memberId?: string | null;
}

export function SumaryImportPanel({ clientId, memberId }: SumaryImportPanelProps) {
  const [engagementId, setEngagementId] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
  const [jsonText, setJsonText] = useState('{\n  "revenue": 100000,\n  "cost_of_sales": 40000,\n  "gross_profit": 60000\n}');
  const [busy, setBusy] = useState(false);
  const [imports, setImports] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [showMappings, setShowMappings] = useState(false);

  const loadEngagement = useCallback(async () => {
    const { data } = await supabase.from('ma_engagements').select('id').eq('client_id', clientId).eq('status', 'active').maybeSingle();
    setEngagementId(data?.id ?? null);
  }, [clientId]);

  const loadImports = useCallback(async () => {
    const { data: bi } = await supabase.from('bi_engagements').select('id').eq('client_id', clientId).maybeSingle();
    if (!bi?.id) {
      setImports([]);
      return;
    }
    const { data } = await supabase
      .from('bi_sumary_imports')
      .select('*')
      .eq('engagement_id', bi.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setImports(data ?? []);
  }, [clientId]);

  const loadMappings = useCallback(async () => {
    const { data } = await supabase.from('bi_sumary_field_mappings').select('*').order('mapping_version', { ascending: false }).limit(200);
    setMappings(data ?? []);
  }, []);

  useEffect(() => {
    loadEngagement();
    loadImports();
  }, [loadEngagement, loadImports]);

  useEffect(() => {
    if (showMappings) loadMappings();
  }, [showMappings, loadMappings]);

  const runImport = async (source: 'manual_json' | 'manual_csv') => {
    if (!engagementId) {
      alert('No active MA engagement for this client. Upload a document once or create an engagement.');
      return;
    }
    if (!periodStart || !periodEnd) {
      alert('Choose period start and end dates.');
      return;
    }
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(jsonText) as Record<string, unknown>;
    } catch {
      alert('Invalid JSON payload');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-sumary-period', {
        body: {
          engagementId,
          periodStart,
          periodEnd,
          periodType,
          source,
          payload,
          importedBy: memberId ?? undefined,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error || (data as { success?: boolean })?.success === false) {
        throw new Error((data as { error?: string }).error || 'Import failed');
      }
      const maPid = (data as { maPeriodId?: string })?.maPeriodId;
      alert(`Import complete.${maPid ? ` MA period: ${maPid}` : ''}`);
      await loadImports();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const saveMappingRow = async (row: Record<string, unknown>) => {
    const { error } = await supabase.from('bi_sumary_field_mappings').upsert(row);
    if (error) alert(error.message);
    else await loadMappings();
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm text-emerald-900">
          <strong>Sumary import:</strong> Paste structured P&L / balance-sheet JSON from Sumary. No AI extraction — figures map into{' '}
          <code className="text-xs bg-white/80 px-1 rounded">bi_financial_data</code> and KPI tracking runs automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="text-gray-700 font-medium">Period start</span>
          <input type="date" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-gray-700 font-medium">Period end</span>
          <input type="date" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="text-gray-700 font-medium">Cadence</span>
          <select
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as 'monthly' | 'quarterly')}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sumary JSON payload</label>
        <textarea
          className="w-full min-h-[220px] font-mono text-sm rounded-lg border border-gray-300 p-3"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => runImport('manual_json')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Import JSON
        </button>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload JSON file
          <input
            type="file"
            accept=".json,.csv,text/csv,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = () => setJsonText(String(reader.result || ''));
              reader.readAsText(f);
            }}
          />
        </label>
        <button type="button" onClick={() => setShowMappings((s) => !s)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700">
          <Database className="w-4 h-4" />
          Field mappings
        </button>
      </div>

      {showMappings && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Sumary key</th>
                <th className="text-left p-2">Internal field</th>
                <th className="text-left p-2">Transform</th>
                <th className="text-left p-2">Required</th>
                <th className="text-left p-2">Ver</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {mappings.slice(0, 50).map((m) => (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="p-2">
                    <input
                      className="w-full border rounded px-2 py-1"
                      defaultValue={m.sumary_key}
                      onBlur={(e) => saveMappingRow({ ...m, sumary_key: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <input
                      className="w-full border rounded px-2 py-1"
                      defaultValue={m.internal_field}
                      onBlur={(e) => saveMappingRow({ ...m, internal_field: e.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="border rounded px-2 py-1"
                      defaultValue={m.transform || 'raw'}
                      onChange={(e) => saveMappingRow({ ...m, transform: e.target.value })}
                    >
                      <option value="raw">raw</option>
                      <option value="negate">negate</option>
                      <option value="divide_100">divide_100</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      defaultChecked={m.is_required}
                      onChange={(e) => saveMappingRow({ ...m, is_required: e.target.checked })}
                    />
                  </td>
                  <td className="p-2">{m.mapping_version}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-500 p-2">Showing latest mapping rows. Add rows via Supabase or extend seed migration.</p>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-gray-900 mb-2">Recent imports</h4>
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
          {imports.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No imports yet.</p>
          ) : (
            imports.map((row) => (
              <div key={row.id} className="p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium capitalize">{row.status}</span>
                  <span className="text-gray-500 ml-2">{row.source}</span>
                  {row.error_message && <p className="text-red-600 text-xs mt-1">{row.error_message}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">{new Date(row.created_at).toLocaleString()}</span>
                  {row.period_id && (
                    <Link
                      to={`/clients/${clientId}/bi/reports/${row.period_id}`}
                      className="text-indigo-600 hover:underline text-xs"
                    >
                      Open report
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
