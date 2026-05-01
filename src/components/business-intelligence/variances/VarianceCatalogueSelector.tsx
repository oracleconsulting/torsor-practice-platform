'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { catalogCaps, tierFromEngagement } from '../../../lib/bi/tierCaps';

interface DefRow {
  code: string;
  name: string;
  category: string;
  min_tier: string;
}

export function VarianceCatalogueSelector({
  open,
  onClose,
  engagementId,
  practiceTier,
  selectedCodes,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  engagementId: string;
  practiceTier?: string | null;
  selectedCodes: Set<string>;
  onChanged: () => void;
}) {
  const [defs, setDefs] = useState<DefRow[]>([]);
  const level = tierFromEngagement(practiceTier ?? null);
  const caps = catalogCaps(level);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from('bi_variance_definitions').select('code,name,category,min_tier').eq('is_active', true);
      setDefs((data ?? []) as DefRow[]);
    })();
  }, [open]);

  if (!open) return null;

  const tierRank = { clarity: 0, foresight: 1, strategic: 2 };
  const allowed = (minTier: string) => tierRank[level as keyof typeof tierRank] >= tierRank[(minTier || 'clarity') as keyof typeof tierRank];

  const toggle = async (code: string, select: boolean) => {
    const action = select ? 'add_variance' : 'remove_variance';
    const { data, error } = await supabase.functions.invoke('manage-bi-catalog-selections', {
      body: { action, engagementId, code },
    });
    if (error) {
      alert(error.message);
      return;
    }
    if ((data as { error?: string })?.error) alert((data as { error: string }).error);
    onChanged();
  };

  const grouped = defs.reduce<Record<string, DefRow[]>>((acc, d) => {
    acc[d.category] = acc[d.category] || [];
    acc[d.category].push(d);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-800">Variance catalogue</h3>
            <p className="text-xs text-slate-500">
              Tier {level}: up to {caps.maxVariances} variances
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4">
          {Object.entries(grouped).map(([cat, rows]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">{cat}</p>
              <div className="space-y-2">
                {rows.map((d) => {
                  const sel = selectedCodes.has(d.code);
                  const ok = allowed(d.min_tier);
                  return (
                    <label key={d.code} className={`flex items-start gap-3 p-2 rounded-lg border ${ok ? 'border-slate-200' : 'opacity-50'}`}>
                      <input type="checkbox" checked={sel} disabled={!ok} onChange={(e) => toggle(d.code, e.target.checked)} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{d.name}</p>
                        <p className="text-xs text-slate-500">{d.code}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
