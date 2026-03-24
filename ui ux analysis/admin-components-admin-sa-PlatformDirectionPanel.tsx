import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { SAPlatformDirection } from '../../../types/sa-platform-direction';
import { SA_DOCUMENT_LAYER_OPTIONS, SA_FINANCIAL_CORE_OPTIONS } from '../../../types/sa-platform-direction';

function emptyDirection(): SAPlatformDirection {
  return {
    financial_core: {
      platform: SA_FINANCIAL_CORE_OPTIONS[0],
      rationale: '',
      constraints: [],
    },
    document_layer: {
      platform: SA_DOCUMENT_LAYER_OPTIONS[0],
      rationale: '',
    },
    operational_backbone: '',
    operational_keep: [],
    must_replace: [],
    notes: '',
  };
}

function normalizeFromDb(raw: unknown): SAPlatformDirection {
  const base = emptyDirection();
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const fc = o.financial_core as Record<string, unknown> | undefined;
  const dl = o.document_layer as Record<string, unknown> | undefined;
  return {
    financial_core: {
      platform:
        typeof fc?.platform === 'string' && fc.platform
          ? fc.platform
          : base.financial_core.platform,
      rationale: typeof fc?.rationale === 'string' ? fc.rationale : '',
      constraints: Array.isArray(fc?.constraints)
        ? (fc.constraints as unknown[]).map((c) => String(c)).filter(Boolean)
        : [],
    },
    document_layer: {
      platform:
        typeof dl?.platform === 'string' && dl.platform
          ? dl.platform
          : base.document_layer.platform,
      rationale: typeof dl?.rationale === 'string' ? dl.rationale : '',
    },
    operational_backbone:
      typeof o.operational_backbone === 'string'
        ? o.operational_backbone
        : typeof (o as { operational?: string }).operational === 'string'
          ? (o as { operational: string }).operational
          : '',
    operational_keep: Array.isArray(o.operational_keep)
      ? (o.operational_keep as unknown[]).map(String).filter(Boolean)
      : [],
    must_replace: Array.isArray(o.must_replace)
      ? (o.must_replace as unknown[]).map(String).filter(Boolean)
      : [],
    notes: typeof o.notes === 'string' ? o.notes : '',
  };
}

function constraintsToText(constraints: string[]): string {
  return constraints.join('\n');
}

function textToConstraints(text: string): string[] {
  return text
    .split(/[\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface PlatformDirectionPanelProps {
  engagementId: string;
  /** Raw JSON from sa_engagements.platform_direction */
  platformDirection: unknown;
  /** Stage 2 inventory rows — use system_name for multi-select */
  inventorySystems: { id: string; system_name: string }[];
  /** Called after successful save */
  onSaved?: () => void | Promise<void>;
}

export function PlatformDirectionPanel({
  engagementId,
  platformDirection: initialPd,
  inventorySystems,
  onSaved,
}: PlatformDirectionPanelProps) {
  const [form, setForm] = useState<SAPlatformDirection>(() => normalizeFromDb(initialPd));
  const [constraintsText, setConstraintsText] = useState(() =>
    constraintsToText(normalizeFromDb(initialPd).financial_core.constraints)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const n = normalizeFromDb(initialPd);
    setForm(n);
    setConstraintsText(constraintsToText(n.financial_core.constraints));
  }, [initialPd, engagementId]);

  const inventoryNames = useMemo(
    () => [...new Set(inventorySystems.map((s) => s.system_name).filter(Boolean))].sort(),
    [inventorySystems]
  );

  const toggleInList = useCallback(
    (field: 'operational_keep' | 'must_replace', name: string) => {
      setForm((prev) => {
        const set = new Set(prev[field]);
        if (set.has(name)) set.delete(name);
        else set.add(name);
        return { ...prev, [field]: Array.from(set) };
      });
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const payload: SAPlatformDirection = {
      ...form,
      financial_core: {
        ...form.financial_core,
        constraints: textToConstraints(constraintsText),
      },
    };
    try {
      const { error: upErr } = await supabase
        .from('sa_engagements')
        .update({ platform_direction: payload as unknown as Record<string, unknown> })
        .eq('id', engagementId);
      if (upErr) throw upErr;
      setSavedAt(Date.now());
      await onSaved?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      <div>
        <h4 className="font-semibold text-gray-900">Platform direction</h4>
        <p className="text-sm text-gray-500 mt-1">
          Set the practice team&apos;s strategic platform recommendation before generating the report. This is passed to the AI for Phase 5 (recommendations) and Phase 6 (optimal stack).
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      )}
      {savedAt != null && !error && (
        <p className="text-xs text-emerald-700">Saved successfully.</p>
      )}

      {/* Financial core */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Financial core</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
            <select
              value={form.financial_core.platform}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  financial_core: { ...f.financial_core, platform: e.target.value },
                }))
              }
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              {SA_FINANCIAL_CORE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rationale</label>
          <textarea
            value={form.financial_core.rationale}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                financial_core: { ...f.financial_core, rationale: e.target.value },
              }))
            }
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            placeholder="Why this financial core…"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Constraints (one per line or semicolon-separated)
          </label>
          <textarea
            value={constraintsText}
            onChange={(e) => setConstraintsText(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            placeholder="e.g. Multi-entity; Payroll in-house"
          />
        </div>
      </div>

      {/* Document layer */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Document layer</h5>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Platform</label>
          <select
            value={form.document_layer.platform}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                document_layer: { ...f.document_layer, platform: e.target.value },
              }))
            }
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          >
            {SA_DOCUMENT_LAYER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rationale</label>
          <textarea
            value={form.document_layer.rationale}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                document_layer: { ...f.document_layer, rationale: e.target.value },
              }))
            }
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            placeholder="Why this document layer…"
          />
        </div>
      </div>

      {/* Operational backbone */}
      <div className="space-y-2 border-t border-gray-100 pt-4">
        <h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Operational backbone</h5>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          What stays as the ops backbone (e.g. SEMS, job costing)
        </label>
        <input
          type="text"
          value={form.operational_backbone}
          onChange={(e) => setForm((f) => ({ ...f, operational_backbone: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          placeholder="e.g. SEMS for site operations"
        />
      </div>

      {/* Inventory multi-select */}
      <div className="space-y-4 border-t border-gray-100 pt-4">
        <h5 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">From system inventory</h5>
        {inventoryNames.length === 0 ? (
          <p className="text-sm text-gray-500">No systems in inventory yet — complete Stage 2 first.</p>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Systems to keep</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                {inventoryNames.map((name) => (
                  <label key={`keep-${name}`} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.operational_keep.includes(name)}
                      onChange={() => toggleInList('operational_keep', name)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Systems to replace</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                {inventoryNames.map((name) => (
                  <label key={`rep-${name}`} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.must_replace.includes(name)}
                      onChange={() => toggleInList('must_replace', name)}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
          placeholder="Any extra context for the AI…"
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save platform direction
        </button>
      </div>
    </div>
  );
}

/** Yellow banner for Analysis tab when generating without platform direction */
export function PlatformDirectionGenerateWarning() {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
      <p>
        <span className="font-medium">No platform direction set</span> — AI will choose optimal stack autonomously.
      </p>
    </div>
  );
}
