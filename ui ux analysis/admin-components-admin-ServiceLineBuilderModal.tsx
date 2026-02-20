/**
 * Service Line Builder Modal
 *
 * Generates a full service line blueprint from a concept/opportunity or manual input,
 * then allows review, approval, and promotion to live system.
 */

import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Check,
  Copy,
  DollarSign,
  ClipboardList,
  Target,
  Code,
  Sparkles,
  Rocket,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';


interface ServiceLineBuilderModalProps {
  open: boolean;
  onClose: () => void;
  practiceId: string;
  /** Open for review (skip generate) */
  existingBlueprintId?: string;
  conceptId?: string;
  opportunityId?: string;
  initialSourceName?: string;
  manualInput?: { problemStatement: string; targetClient: string; suggestedName?: string };
  onImplemented?: () => void;
}

type Step = 'input' | 'generating' | 'review' | 'implemented';

export function ServiceLineBuilderModal({
  open,
  onClose,
  practiceId,
  existingBlueprintId,
  conceptId,
  opportunityId,
  initialSourceName,
  manualInput,
  onImplemented,
}: ServiceLineBuilderModalProps) {
  const [step, setStep] = useState<Step>('input');
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('identity');
  const [advisorNotes, setAdvisorNotes] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setStep(conceptId || opportunityId ? 'input' : manualInput ? 'input' : 'input');
      setBlueprintId(null);
      setBlueprint(null);
      setError(null);
      setAdvisorNotes('');
    }
  }, [open, conceptId, opportunityId, manualInput]);

  useEffect(() => {
    if (open && existingBlueprintId && practiceId) {
      setBlueprintId(existingBlueprintId);
      setStep('review');
      (async () => {
        const { data, error: fetchError } = await supabase
          .from('service_line_blueprints')
          .select('*')
          .eq('id', existingBlueprintId)
          .eq('practice_id', practiceId)
          .single();
        if (fetchError) return;
        setBlueprint(data?.blueprint);
        setStatus(data?.status);
        setAdvisorNotes(data?.advisor_notes || '');
      })();
    }
  }, [open, existingBlueprintId, practiceId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setStep('generating');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('build-service-line', {
        body: {
          practiceId,
          conceptId: conceptId || undefined,
          opportunityId: opportunityId || undefined,
          manualInput: manualInput || undefined,
          additionalContext: advisorNotes || undefined,
        },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setBlueprintId(data.id);
      setStatus(data.status || 'draft');
      if (data.status === 'parse_error') {
        setError(data.error || 'Failed to parse blueprint');
        setStep('input');
      } else {
        await fetchBlueprint(data.id);
        setStep('review');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
      setStep('input');
    } finally {
      setGenerating(false);
    }
  };

  const fetchBlueprint = async (id: string) => {
    const { data, error: fetchError } = await supabase
      .from('service_line_blueprints')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) return;
    setBlueprint(data?.blueprint);
    setStatus(data?.status);
  };

  const handleApprove = async () => {
    if (!blueprintId) return;
    const { error: updateError } = await supabase
      .from('service_line_blueprints')
      .update({ status: 'approved', advisor_notes: advisorNotes || null })
      .eq('id', blueprintId);
    if (updateError) setError(updateError.message);
    else setStatus('approved');
  };

  const handlePromote = async () => {
    if (!blueprintId) return;
    setPromoting(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('promote-service-line', {
        body: { blueprintId, practiceId },
      });
      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);
      setStep('implemented');
      onImplemented?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promotion failed');
    } finally {
      setPromoting(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!open) return null;

  const sourceLabel = initialSourceName || (conceptId ? 'Concept' : opportunityId ? 'Opportunity' : 'Manual');
  const tabs = [
    { id: 'identity', label: 'Identity', icon: Target },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'assessment', label: 'Assessment', icon: ClipboardList },
    { id: 'narrative', label: 'Narrative', icon: Sparkles },
    { id: 'implementation', label: 'Implementation', icon: Code },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'generating' ? 'Generating blueprint...' : step === 'review' ? 'Review blueprint' : step === 'implemented' ? 'Implemented' : 'Build service line'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'input' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Source: <strong>{sourceLabel}</strong>
                {conceptId && ' (concept)'}
                {opportunityId && ' (opportunity)'}
                {manualInput && ' (manual)'}
              </p>
              {manualInput && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm">
                  <p><strong>Problem:</strong> {manualInput.problemStatement}</p>
                  <p className="mt-2"><strong>Target client:</strong> {manualInput.targetClient}</p>
                  {manualInput.suggestedName && <p className="mt-1"><strong>Suggested name:</strong> {manualInput.suggestedName}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advisor notes (optional)</label>
                <textarea
                  value={advisorNotes}
                  onChange={e => setAdvisorNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Pricing guidance, delivery preference..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate blueprint
                </button>
              </div>
            </div>
          )}

          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">Claude is designing the full service line (catalogue, assessment, scoring, narrative)...</p>
              <p className="text-sm text-gray-500 mt-2">This may take 30–60 seconds.</p>
            </div>
          )}

          {step === 'review' && blueprint && (
            <>
              <div className="flex gap-2 border-b mb-4 overflow-x-auto">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`px-3 py-2 text-sm font-medium rounded-t-lg flex items-center gap-1.5 whitespace-nowrap ${activeTab === id ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'identity' && blueprint.identity && (
                <div className="space-y-2 text-sm">
                  <p><strong>Code:</strong> {blueprint.identity.code}</p>
                  <p><strong>Name:</strong> {blueprint.identity.name}</p>
                  <p><strong>Category:</strong> {blueprint.identity.category}</p>
                  <p><strong>Outcome:</strong> {blueprint.identity.outcome}</p>
                  <p><strong>Description:</strong> {blueprint.identity.description}</p>
                </div>
              )}

              {activeTab === 'pricing' && blueprint.pricing && (
                <div className="space-y-2 text-sm">
                  <p><strong>Tiers:</strong></p>
                  <ul className="list-disc pl-5">
                    {(blueprint.pricing.tiers || []).map((t: any, i: number) => (
                      <li key={i}>{t.name}: {t.priceFormatted || t.priceFromFormatted || t.price} {t.periodLabel}</li>
                    ))}
                  </ul>
                  <p><strong>Value justification:</strong> {blueprint.pricing.valueJustification}</p>
                </div>
              )}

              {activeTab === 'assessment' && blueprint.assessment && (
                <div className="space-y-3 text-sm">
                  <p>Estimated time: {blueprint.assessment.estimatedMinutes} min</p>
                  {(blueprint.assessment.sections || []).map((sec: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <p className="font-semibold text-gray-800">{sec.name}</p>
                      <ul className="mt-2 space-y-1 text-gray-600">
                        {(sec.questions || []).slice(0, 5).map((q: any, j: number) => (
                          <li key={j}>• {q.questionText?.slice(0, 80)}…</li>
                        ))}
                        {(sec.questions?.length || 0) > 5 && <li>… +{(sec.questions?.length || 0) - 5} more</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'narrative' && blueprint.narrative && (
                <div className="space-y-2 text-sm">
                  <p><strong>Outcome:</strong> {blueprint.narrative.outcomeStatement}</p>
                  <p><strong>Before:</strong> {blueprint.narrative.beforeState}</p>
                  <p><strong>After:</strong> {blueprint.narrative.afterState}</p>
                  <p><strong>Enabled by:</strong> {blueprint.narrative.enabledByString}</p>
                </div>
              )}

              {activeTab === 'implementation' && blueprint.implementation && (
                <div className="space-y-4">
                  {Object.entries(blueprint.implementation).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <button
                          onClick={() => copyToClipboard(String(value), key)}
                          className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1"
                        >
                          {copied === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-lg overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {String(value)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-1">Advisor notes</label>
                <textarea
                  value={advisorNotes}
                  onChange={e => setAdvisorNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                  placeholder="Notes before approval..."
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Status: {status}</span>
                  <div className="flex gap-2">
                    {status !== 'approved' && (
                      <button
                        onClick={handleApprove}
                        className="px-4 py-2 text-sm text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                      >
                        Mark approved
                      </button>
                    )}
                    <button
                      onClick={handlePromote}
                      disabled={status !== 'approved' || promoting}
                      className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                      Implement
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'implemented' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Service line is live</h3>
              <p className="text-sm text-gray-600 mt-1 text-center max-w-md">
                Services, assessment questions, pricing tiers, and scoring weights have been applied. Copy the registry and scorer snippets from the Implementation tab and redeploy edge functions to complete.
              </p>
              <button onClick={onClose} className="mt-6 px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
