'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { useBICatalogMetrics } from '../../hooks/useBICatalogMetrics';
import { RatioCard } from './ratios/RatioCard';
import { VarianceCard } from './variances/VarianceCard';
import { RatioCatalogueSelector } from './ratios/RatioCatalogueSelector';
import { VarianceCatalogueSelector } from './variances/VarianceCatalogueSelector';

interface BICatalogSectionsProps {
  maEngagementId: string;
  maPeriodId: string;
  practiceTier?: string | null;
  isAdmin?: boolean;
}

export function BICatalogSections({ maEngagementId, maPeriodId, practiceTier, isAdmin }: BICatalogSectionsProps) {
  const { loading, ratios, variances, refetch } = useBICatalogMetrics(maEngagementId, maPeriodId);
  const [ratioModal, setRatioModal] = useState(false);
  const [varModal, setVarModal] = useState(false);

  const selectedRatioCodes = useMemo(() => new Set(ratios.map((r) => r.code)), [ratios]);
  const selectedVarCodes = useMemo(() => new Set(variances.map((v) => v.code)), [variances]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500 py-6">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading ratios & variances…
      </div>
    );
  }

  if (ratios.length === 0 && variances.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
        <p>No Sumary ratio or variance selections yet.</p>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setRatioModal(true)}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
          >
            <Plus className="w-4 h-4" />
            Add ratios / variances
          </button>
        )}
        <RatioCatalogueSelector
          open={ratioModal}
          onClose={() => setRatioModal(false)}
          engagementId={maEngagementId}
          practiceTier={practiceTier}
          selectedCodes={selectedRatioCodes}
          onChanged={() => {
            refetch();
            setRatioModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-6">
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRatioModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            Ratio catalogue
          </button>
          <button
            type="button"
            onClick={() => setVarModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            Variance catalogue
          </button>
        </div>
      )}

      {ratios.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Ratio analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ratios.map((r) => (
              <RatioCard key={r.code} row={r} />
            ))}
          </div>
        </div>
      )}

      {variances.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-3">Variance analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {variances.map((v) => (
              <VarianceCard key={v.code} row={v} />
            ))}
          </div>
        </div>
      )}

      <RatioCatalogueSelector
        open={ratioModal}
        onClose={() => setRatioModal(false)}
        engagementId={maEngagementId}
        practiceTier={practiceTier}
        selectedCodes={selectedRatioCodes}
        onChanged={() => {
          refetch();
        }}
      />
      <VarianceCatalogueSelector
        open={varModal}
        onClose={() => setVarModal(false)}
        engagementId={maEngagementId}
        practiceTier={practiceTier}
        selectedCodes={selectedVarCodes}
        onChanged={() => {
          refetch();
        }}
      />
    </div>
  );
}
