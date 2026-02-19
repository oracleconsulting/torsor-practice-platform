// ============================================================================
// BatchEnrollmentWizard — 4-step batch onboarding modal
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentMember } from '../../hooks/useCurrentMember';
import { SERVICE_REGISTRY } from '../../lib/service-registry';

const MAX_BATCH_SIZE = 50;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ClientRow {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  stage: string;
}

export interface BatchEnrollmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (batchId: string) => void;
}

const STEPS = [
  { id: 1, label: 'Add Clients' },
  { id: 2, label: 'Select Services' },
  { id: 3, label: 'Customise' },
  { id: 4, label: 'Review & Send' },
];

function nextMonday(from?: Date): string {
  const d = from ? new Date(from) : new Date();
  d.setDate(d.getDate() + (d.getDay() === 0 ? 1 : 8 - d.getDay()));
  return d.toISOString().slice(0, 10);
}

export function BatchEnrollmentWizard({ isOpen, onClose, onComplete }: BatchEnrollmentWizardProps) {
  const { user } = useAuth();
  const { data: currentMember } = useCurrentMember(user?.id);
  const practiceId = currentMember?.practice_id ?? null;
  const createdById = currentMember?.id ?? null;

  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<ClientRow[]>(() => [
    { id: crypto.randomUUID(), name: '', email: '', company: '', industry: '', stage: '' },
  ]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [gaTier, setGaTier] = useState<string>('Growth');
  const [defaultAdvisorId, setDefaultAdvisorId] = useState<string>('');
  const [sprintStartDate, setSprintStartDate] = useState<string>(() => nextMonday());
  const [defaultNotes, setDefaultNotes] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string }[]>([]);
  const [serviceLines, setServiceLines] = useState<{ id: string; code: string; name: string }[]>([]);
  const [templates, setTemplates] = useState<{ id: string; name: string; category: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
  const [sendResult, setSendResult] = useState<{ succeeded: number; failed: number; failures: { email: string; reason: string }[] } | null>(null);

  const hasEntries = clients.some((c) => c.name.trim() || c.email.trim());
  const validClients = clients.filter((c) => c.name.trim() && c.email.trim() && EMAIL_REGEX.test(c.email.trim()));
  const duplicateEmails = validClients.map((c) => c.email.toLowerCase()).filter((e, i, a) => a.indexOf(e) !== i);

  const canProceedStep1 = validClients.length > 0 && duplicateEmails.length === 0 && validClients.length <= MAX_BATCH_SIZE;
  const canProceedStep2 = selectedServices.length > 0;
  const canProceedStep3 = true;

  useEffect(() => {
    if (!isOpen || !practiceId) return;
    (async () => {
      const [slRes, teamRes, tmplRes] = await Promise.all([
        supabase.from('service_lines').select('id, code, name').order('name'),
        supabase.from('practice_members').select('id, name').eq('practice_id', practiceId).eq('member_type', 'team').order('name'),
        supabase.from('sprint_templates').select('id, name, category').eq('practice_id', practiceId).eq('is_active', true).order('name'),
      ]);
      if (slRes.data) setServiceLines(slRes.data);
      if (teamRes.data) setTeamMembers(teamRes.data);
      if (tmplRes.data) setTemplates(tmplRes.data);
      if (teamRes.data?.length && !defaultAdvisorId) setDefaultAdvisorId(teamRes.data[0].id);
    })();
  }, [isOpen, practiceId, defaultAdvisorId]);

  const addRow = useCallback(() => {
    setClients((prev) => [...prev, { id: crypto.randomUUID(), name: '', email: '', company: '', industry: '', stage: '' }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: keyof ClientRow, value: string) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }, []);

  const handleCsv = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      const rows = text.split(/\r?\n/).map((r) => r.split(',').map((c) => c.trim()));
      if (rows.length === 0) return;
      const hasHeader = rows[0]?.some((c) => /name|email|company/i.test(c));
      const data = hasHeader ? rows.slice(1) : rows;
      const nameIdx = hasHeader ? (rows[0].findIndex((c) => /name/i.test(c)) >= 0 ? rows[0].findIndex((c) => /name/i.test(c)) : 0) : 0;
      const emailIdx = hasHeader ? (rows[0].findIndex((c) => /email/i.test(c)) >= 0 ? rows[0].findIndex((c) => /email/i.test(c)) : 1) : 1;
      const companyIdx = hasHeader ? (rows[0].findIndex((c) => /company/i.test(c)) >= 0 ? rows[0].findIndex((c) => /company/i.test(c)) : 2) : 2;
      const industryIdx = hasHeader ? (rows[0].findIndex((c) => /industry/i.test(c)) >= 0 ? rows[0].findIndex((c) => /industry/i.test(c)) : 3) : 3;
      const stageIdx = hasHeader ? (rows[0].findIndex((c) => /stage/i.test(c)) >= 0 ? rows[0].findIndex((c) => /stage/i.test(c)) : 4) : 4;
      const newRows: ClientRow[] = data
        .filter((row) => row[nameIdx] || row[emailIdx])
        .slice(0, MAX_BATCH_SIZE)
        .map((row) => ({
          id: crypto.randomUUID(),
          name: row[nameIdx] ?? '',
          email: row[emailIdx] ?? '',
          company: row[companyIdx] ?? '',
          industry: row[industryIdx] ?? '',
          stage: row[stageIdx] ?? '',
        }));
      setClients((prev) => (prev.every((c) => !c.name && !c.email) ? newRows : [...prev, ...newRows].slice(0, MAX_BATCH_SIZE)));
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const toggleService = useCallback((code: string) => {
    setSelectedServices((prev) => (prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]));
  }, []);

  const handleClose = useCallback(() => {
    if (hasEntries && !sendResult && !sending) {
      if (window.confirm('Discard this batch? Unsaved changes will be lost.')) {
        setStep(1);
        setClients([{ id: crypto.randomUUID(), name: '', email: '', company: '', industry: '', stage: '' }]);
        setSendResult(null);
        onClose();
      }
    } else {
      setStep(1);
      setSendResult(null);
      onClose();
    }
  }, [hasEntries, sendResult, sending, onClose]);

  const handleSend = useCallback(async () => {
    if (!practiceId || !createdById || validClients.length === 0 || selectedServices.length === 0) return;
    setSending(true);
    setSendProgress({ current: 0, total: validClients.length });
    try {
      const batchRes = await supabase
        .from('enrollment_batches')
        .insert({
          practice_id: practiceId,
          created_by: createdById,
          name: `Batch ${new Date().toLocaleDateString()}`,
          services: selectedServices,
          default_tier: selectedServices.includes('365_method') ? gaTier : undefined,
          default_advisor_id: defaultAdvisorId || null,
          sprint_start_date: sprintStartDate || null,
          status: 'sending',
        })
        .select('id')
        .single();
      if (batchRes.error) throw batchRes.error;
      const batchId = batchRes.data.id;

      const entries = validClients.map((c) => ({
        batch_id: batchId,
        practice_id: practiceId,
        client_name: c.name.trim(),
        client_email: c.email.trim().toLowerCase(),
        client_company: c.company.trim() || null,
        client_industry: c.industry.trim() || null,
        client_stage: c.stage.trim() || null,
        assigned_advisor_id: defaultAdvisorId || null,
        tier_name: selectedServices.includes('365_method') ? gaTier : null,
        advisor_notes: defaultNotes.trim() || null,
        template_id: templateId || null,
      }));

      const insertRes = await supabase.from('enrollment_entries').insert(entries).select('id');
      if (insertRes.error) throw insertRes.error;

      const invokeRes = await supabase.functions.invoke('batch-enroll-clients', {
        body: {
          batchId,
          entries: validClients.map((c) => ({
            name: c.name.trim(),
            email: c.email.trim().toLowerCase(),
            company: c.company.trim() || undefined,
            industry: c.industry.trim() || undefined,
            stage: c.stage.trim() || undefined,
            advisorId: defaultAdvisorId || undefined,
            tier: selectedServices.includes('365_method') ? gaTier : undefined,
            notes: defaultNotes.trim() || undefined,
          })),
          services: selectedServices,
          defaultTier: selectedServices.includes('365_method') ? gaTier : undefined,
          defaultAdvisorId: defaultAdvisorId || undefined,
          sprintStartDate: sprintStartDate || undefined,
        },
      });

      const result = invokeRes.data as { success?: boolean; succeeded?: number; failed?: number; failures?: { email: string; reason: string }[] } | undefined;
      setSendResult({
        succeeded: result?.succeeded ?? validClients.length,
        failed: result?.failed ?? 0,
        failures: result?.failures ?? [],
      });
      if (result?.success !== false) {
        await supabase.from('enrollment_batches').update({ status: 'active' }).eq('id', batchId);
        onComplete(batchId);
      }
    } catch (err) {
      console.warn('Batch send failed', err);
      setSendResult({
        succeeded: 0,
        failed: validClients.length,
        failures: [{ email: '', reason: (err as Error).message }],
      });
    } finally {
      setSending(false);
    }
  }, [
    practiceId,
    createdById,
    validClients,
    selectedServices,
    gaTier,
    defaultAdvisorId,
    sprintStartDate,
    defaultNotes,
    templateId,
    onComplete,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-2 text-sm font-medium ${step === s.id ? 'text-indigo-600' : 'text-gray-500'}`}
              >
                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${step === s.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100'}`}>
                  {s.id}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
          <button type="button" onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {sendResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${sendResult.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <p className="font-medium text-gray-900">
                  {sendResult.succeeded} invitation(s) sent. {sendResult.failed > 0 && `${sendResult.failed} failed.`}
                </p>
                {sendResult.failures?.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                    {sendResult.failures.map((f, i) => (
                      <li key={i}>{f.email ? `${f.email}: ${f.reason}` : f.reason}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button type="button" onClick={handleClose} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Done
              </button>
            </div>
          ) : (
            <>
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Add clients manually or upload CSV (max {MAX_BATCH_SIZE})</p>
                    <div className="flex gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 text-sm font-medium">
                        <Upload className="w-4 h-4" />
                        Upload CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleCsv} />
                      </label>
                      <button type="button" onClick={addRow} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">
                        <Plus className="w-4 h-4" />
                        Add Row
                      </button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 divide-x divide-gray-200">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Name *</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Email *</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Industry</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Stage</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {clients.map((row) => (
                          <tr key={row.id} className="divide-x divide-gray-100">
                            <td className="px-3 py-1">
                              <input
                                value={row.name}
                                onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded"
                                placeholder="Name"
                              />
                            </td>
                            <td className="px-3 py-1">
                              <input
                                type="email"
                                value={row.email}
                                onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded"
                                placeholder="email@example.com"
                              />
                            </td>
                            <td className="px-3 py-1">
                              <input
                                value={row.company}
                                onChange={(e) => updateRow(row.id, 'company', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded"
                                placeholder="Company"
                              />
                            </td>
                            <td className="px-3 py-1">
                              <input
                                value={row.industry}
                                onChange={(e) => updateRow(row.id, 'industry', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded"
                                placeholder="Industry"
                              />
                            </td>
                            <td className="px-3 py-1">
                              <input
                                value={row.stage}
                                onChange={(e) => updateRow(row.id, 'stage', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded"
                                placeholder="Stage"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <button type="button" onClick={() => removeRow(row.id)} className="p-1 text-gray-400 hover:text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {validClients.length > MAX_BATCH_SIZE && (
                    <p className="text-sm text-red-600">Maximum {MAX_BATCH_SIZE} clients per batch. Remove some entries.</p>
                  )}
                  {duplicateEmails.length > 0 && (
                    <p className="text-sm text-red-600">Duplicate emails: please fix before continuing.</p>
                  )}
                  <p className="text-sm text-gray-500">{validClients.length} client(s) added</p>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Select services to enroll all clients in.</p>
                  <div className="space-y-3">
                    {serviceLines.map((sl) => (
                      <label key={sl.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(sl.code)}
                          onChange={() => toggleService(sl.code)}
                          className="rounded border-gray-300 text-indigo-600"
                        />
                        <span className="font-medium">{sl.name}</span>
                        {SERVICE_REGISTRY[sl.code === '365_method' ? 'goal_alignment' : sl.code]?.tiers?.[0]?.priceFormatted && (
                          <span className="text-sm text-gray-500">
                            {SERVICE_REGISTRY[sl.code === '365_method' ? 'goal_alignment' : sl.code]?.tiers?.[0]?.priceFormatted}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                  {selectedServices.includes('365_method') && (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Goal Alignment tier</p>
                      <div className="flex gap-4">
                        {['Lite', 'Growth', 'Partner'].map((t) => (
                          <label key={t} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="gaTier" checked={gaTier === t} onChange={() => setGaTier(t)} className="text-indigo-600" />
                            <span>{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    {validClients.length} client(s) × {selectedServices.length} service(s)
                  </p>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-6 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default advisor</label>
                    <select
                      value={defaultAdvisorId}
                      onChange={(e) => setDefaultAdvisorId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sprint start date (Monday)</label>
                    <input
                      type="date"
                      value={sprintStartDate}
                      onChange={(e) => setSprintStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default advisor notes (optional)</label>
                    <textarea
                      value={defaultNotes}
                      onChange={(e) => setDefaultNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Notes applied to all clients"
                    />
                  </div>
                  {selectedServices.includes('365_method') && templates.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sprint template (optional)</label>
                      <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">None — fully personalised</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Review and send invitations.</p>
                  <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr className="divide-x divide-gray-200">
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Client</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Company</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Services</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-700">Tier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {validClients.map((c) => (
                          <tr key={c.id} className="divide-x divide-gray-100">
                            <td className="px-3 py-2">
                              <p className="font-medium">{c.name}</p>
                              <p className="text-gray-500 text-xs">{c.email}</p>
                            </td>
                            <td className="px-3 py-2">{c.company || '—'}</td>
                            <td className="px-3 py-2">{selectedServices.join(', ')}</td>
                            <td className="px-3 py-2">{selectedServices.includes('365_method') ? gaTier : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-gray-500">
                    Total: {validClients.length} clients. Click Send to create accounts and email invitations.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {!sendResult && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3)
                }
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Next <ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="w-full max-w-xs px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Invitations'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
