/**
 * Service Line Builder — list blueprints and create new (manual) or open for review.
 */

import { useState, useEffect } from 'react';
import { Wrench, Plus, Loader2, FileText, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { ServiceLineBuilderModal } from '../../components/admin/ServiceLineBuilderModal';
import { AdminLayout } from '../../components/AdminLayout';
import type { NavigationProps } from '../../types/navigation';

const STATUS_COLOURS: Record<string, string> = {
  generating: 'bg-amber-100 text-amber-800',
  draft: 'bg-gray-100 text-gray-800',
  reviewed: 'bg-blue-100 text-blue-800',
  approved: 'bg-emerald-100 text-emerald-800',
  implemented: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-500',
};

export function ServiceLineBuilderPage({ currentPage, onNavigate }: NavigationProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const practiceId = currentMember?.practice_id;

  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'new' | 'review'>('new');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [manualFormOpen, setManualFormOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ problemStatement: '', targetClient: '', suggestedName: '' });
  const [pendingManualInput, setPendingManualInput] = useState<{ problemStatement: string; targetClient: string; suggestedName?: string } | null>(null);

  useEffect(() => {
    if (practiceId) loadBlueprints();
  }, [practiceId]);

  const loadBlueprints = async () => {
    if (!practiceId) return;
    setLoading(true);
    const { data } = await supabase
      .from('service_line_blueprints')
      .select('id, service_code, service_name, display_name, category, status, source_type, created_at')
      .eq('practice_id', practiceId)
      .order('created_at', { ascending: false });
    setBlueprints(data || []);
    setLoading(false);
  };

  const openNewManual = () => {
    setModalMode('new');
    setSelectedBlueprintId(null);
    setPendingManualInput(null);
    setManualForm({ problemStatement: '', targetClient: '', suggestedName: '' });
    setManualFormOpen(true);
  };

  const submitManualAndOpenBuilder = () => {
    if (!manualForm.problemStatement.trim() || !manualForm.targetClient.trim()) return;
    setPendingManualInput({
      problemStatement: manualForm.problemStatement.trim(),
      targetClient: manualForm.targetClient.trim(),
      suggestedName: manualForm.suggestedName?.trim() || undefined,
    });
    setManualFormOpen(false);
    setModalOpen(true);
  };

  const openReview = (id: string) => {
    setModalMode('review');
    setSelectedBlueprintId(id);
    setModalOpen(true);
  };

  return (
    <AdminLayout
      title="Service Line Builder"
      subtitle="Generate full service line blueprints from concepts, opportunities, or scratch. Review and promote to live."
      currentPage={currentPage}
      onNavigate={onNavigate}
      headerActions={
        <button
            onClick={openNewManual}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New blueprint (manual)
          </button>
      }
    >
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : blueprints.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No blueprints yet</p>
            <p className="text-sm text-gray-500 mt-1">Create one from the Discovery Opportunity Panel (Build Full Service Line) or start here with manual input.</p>
            <button
              onClick={openNewManual}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm inline-flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              New blueprint
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {blueprints.map((bp) => (
              <li key={bp.id}>
                <div
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openReview(bp.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{bp.service_name || bp.display_name || bp.service_code}</p>
                      <p className="text-xs text-gray-500">
                        {bp.service_code} • {bp.source_type} • {bp.created_at ? new Date(bp.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_COLOURS[bp.status] || 'bg-gray-100 text-gray-600'}`}>
                      {bp.status}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

      {manualFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setManualFormOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New blueprint — manual input</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem statement</label>
                <textarea
                  value={manualForm.problemStatement}
                  onChange={e => setManualForm(f => ({ ...f, problemStatement: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="What problem does this service solve?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target client</label>
                <input
                  type="text"
                  value={manualForm.targetClient}
                  onChange={e => setManualForm(f => ({ ...f, targetClient: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Who is this for?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Suggested name (optional)</label>
                <input
                  type="text"
                  value={manualForm.suggestedName}
                  onChange={e => setManualForm(f => ({ ...f, suggestedName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Revenue Diversification Programme"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setManualFormOpen(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              <button
                onClick={submitManualAndOpenBuilder}
                disabled={!manualForm.problemStatement.trim() || !manualForm.targetClient.trim()}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Generate blueprint
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && practiceId && (
        <ServiceLineBuilderModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedBlueprintId(null); setPendingManualInput(null); }}
          practiceId={practiceId}
          existingBlueprintId={modalMode === 'review' ? selectedBlueprintId || undefined : undefined}
          manualInput={modalMode === 'new' ? pendingManualInput || undefined : undefined}
          initialSourceName={pendingManualInput?.suggestedName}
          onImplemented={loadBlueprints}
        />
      )}
      </div>
    </AdminLayout>
  );
}
