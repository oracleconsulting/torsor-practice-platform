// ============================================================================
// OnboardingPage — Active batches, pipeline, sprint templates
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Archive, Target, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { BatchEnrollmentWizard } from '../../components/admin/BatchEnrollmentWizard';
import { OnboardingPipeline } from '../../components/admin/OnboardingPipeline';
import type { Page } from '../../types/navigation';

type TabId = 'batches' | 'pipeline' | 'templates';

export function OnboardingPage({ onNavigate, currentPage: _currentPage }: { onNavigate: (page: Page) => void; currentPage: Page }) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const practiceId = currentMember?.practice_id;

  const [activeTab, setActiveTab] = useState<TabId>('batches');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pipelineBatchId, setPipelineBatchId] = useState<string | undefined>(undefined);
  const [batches, setBatches] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    if (!practiceId) return;
    const { data } = await supabase
      .from('enrollment_batches')
      .select('*')
      .eq('practice_id', practiceId)
      .order('created_at', { ascending: false });
    setBatches(data || []);
  }, [practiceId]);

  const fetchTemplates = useCallback(async () => {
    if (!practiceId) return;
    const { data } = await supabase
      .from('sprint_templates')
      .select('*')
      .eq('practice_id', practiceId)
      .order('name');
    setTemplates(data || []);
  }, [practiceId]);

  useEffect(() => {
    fetchBatches();
    fetchTemplates();
    setLoading(false);
  }, [fetchBatches, fetchTemplates]);

  const handleArchiveBatch = async (id: string) => {
    try {
      await supabase.from('enrollment_batches').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', id);
      fetchBatches();
    } catch (e) {
      console.warn('Archive failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Client Onboarding</h1>
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Batch
          </button>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          {[
            { id: 'batches' as TabId, label: 'Active Batches', icon: Users },
            { id: 'pipeline' as TabId, label: 'Pipeline', icon: Target },
            { id: 'templates' as TabId, label: 'Templates', icon: Archive },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setActiveTab(tab.id); if (tab.id === 'pipeline') setPipelineBatchId(undefined); }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'batches' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : batches.filter((b) => !['complete', 'archived'].includes(b.status)).length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No onboarding batches yet</p>
                <p className="text-sm mt-1">Create your first batch to get started.</p>
                <button
                  type="button"
                  onClick={() => setWizardOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" /> New Batch
                </button>
              </div>
            ) : (
              batches
                .filter((b) => !['complete', 'archived'].includes(b.status))
                .map((batch) => (
                  <div key={batch.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{batch.name}</h3>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Created {new Date(batch.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(batch.services || []).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                              {s}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${batch.total_clients ? (batch.completed_count / batch.total_clients) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {batch.invited_count ?? 0} invited, {batch.registered_count ?? 0} in progress, {batch.completed_count ?? 0} complete
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          batch.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {batch.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => { setPipelineBatchId(batch.id); setActiveTab('pipeline'); }}
                          className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg"
                        >
                          View Pipeline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveBatch(batch.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'pipeline' && (
          <OnboardingPipeline
            batchId={pipelineBatchId}
            onNavigate={onNavigate}
            onViewClient={() => {
              onNavigate('clients');
            }}
          />
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {}}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                <Plus className="w-4 h-4" /> Create Template
              </button>
            </div>
            {templates.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">Sprint templates help standardise onboarding</p>
                <p className="text-sm mt-1">Create one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((t) => (
                  <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{t.name}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{t.description || '—'}</p>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {t.category}
                      </span>
                      <p className="text-xs text-gray-400 mt-2">Used {t.usage_count ?? 0} times</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="text-sm text-indigo-600 hover:underline">Edit</button>
                      <button type="button" className="text-sm text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <BatchEnrollmentWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={(batchId) => {
          setWizardOpen(false);
          fetchBatches();
          setPipelineBatchId(batchId);
          setActiveTab('pipeline');
        }}
      />
    </div>
  );
}
