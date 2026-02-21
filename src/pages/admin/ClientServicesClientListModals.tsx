/**
 * All modals for the client list (Discovery, SA, Benchmarking, Client Detail, Invite, Bulk Import, Delete, Service Edit).
 * Separate file to keep ClientServicesClientList.tsx under parse-safe size.
 */
import React from 'react';
import { CheckCircle, Loader2, Mail, Save, Send, Target, Trash2, Upload, X, XCircle } from 'lucide-react';
import type { ClientServicesClientListProps, InviteFormState } from './ClientServicesClientListTypes';

const DEFAULT_INVITE_FORM: InviteFormState = {
  email: '',
  name: '',
  company: '',
  services: [],
  customMessage: '',
  inviteType: 'discovery',
};

export function ClientServicesClientListModals(props: ClientServicesClientListProps): React.ReactElement {
  const DiscoveryClientModal = props.DiscoveryClientModal;
  const SystemsAuditClientModal = props.SystemsAuditClientModal;
  const BenchmarkingClientModal = props.BenchmarkingClientModal;
  const ClientDetailModal = props.ClientDetailModal;

  const inviteForm = props.inviteForm ?? DEFAULT_INVITE_FORM;
  const setInviteForm = props.setInviteForm ?? (() => {});
  const bulkImportData = props.bulkImportData ?? '';
  const setBulkImportData = props.setBulkImportData ?? (() => {});
  const bulkSendEmails = props.bulkSendEmails ?? false;
  const setBulkSendEmails = props.setBulkSendEmails ?? (() => {});
  const sendingInvite = props.sendingInvite ?? false;
  const bulkImporting = props.bulkImporting ?? false;
  const handleSendInvite = props.handleSendInvite ?? (async () => {});
  const handleBulkImport = props.handleBulkImport ?? (async () => {});

  return (
    <>
      {/* Client Detail Modal - show Discovery modal for discovery clients */}
      {props.selectedClient && props.selectedServiceLine === 'discovery' && DiscoveryClientModal && (
        <DiscoveryClientModal
          clientId={props.selectedClient}
          onClose={() => props.setSelectedClient(null)}
          onRefresh={props.fetchClients}
        />
      )}
      {props.selectedClient && props.selectedServiceLine === 'systems_audit' && SystemsAuditClientModal && (
        <SystemsAuditClientModal
          clientId={props.selectedClient}
          onClose={() => props.setSelectedClient(null)}
        />
      )}
      {props.selectedClient && props.selectedServiceLine === 'benchmarking' && BenchmarkingClientModal && (
        <BenchmarkingClientModal
          clientId={props.selectedClient}
          onClose={() => props.setSelectedClient(null)}
        />
      )}
      {props.selectedClient && props.selectedServiceLine && props.selectedServiceLine !== 'discovery' && props.selectedServiceLine !== 'systems_audit' && props.selectedServiceLine !== 'benchmarking' && ClientDetailModal && (
        <ClientDetailModal
          clientId={props.selectedClient}
          serviceLineCode={props.selectedServiceLine}
          onClose={() => props.setSelectedClient(null)}
          onNavigate={props.onNavigate}
        />
      )}

      {props.clientToDelete && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Delete Client</h2>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to permanently delete <strong>{props.clientToDelete.name}</strong> ({props.clientToDelete.email})?
              </p>
              
              <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-lg">
                ⚠️ This action cannot be undone. This will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Client profile and account</li>
                  <li>All service enrollments</li>
                  <li>All assessments and progress data</li>
                  <li>All roadmaps and plans</li>
                  <li>All related records</li>
                </ul>
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => props.setClientToDelete(null)}
                  disabled={props.deletingClient === props.clientToDelete.id}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={props.confirmDeleteClient}
                  disabled={props.deletingClient === props.clientToDelete.id}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {props.deletingClient === props.clientToDelete.id ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Client Modal */}
        {props.showInviteModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Invite Client</h2>
                  <p className="text-sm text-gray-500">Create their portal account and start their journey</p>
                </div>
                <button
                  onClick={() => props.setShowInviteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Invite Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How should they start?
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setInviteForm({ ...inviteForm, inviteType: 'discovery' })}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        inviteForm.inviteType === 'discovery'
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          inviteForm.inviteType === 'discovery' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Target className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Destination Discovery</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Start with a questionnaire to understand their goals, then recommend services
                          </p>
                        </div>
                      </div>
                      {inviteForm.inviteType === 'discovery' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-indigo-500" />
                        </div>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInviteForm({ ...inviteForm, inviteType: 'direct' })}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        inviteForm.inviteType === 'direct'
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          inviteForm.inviteType === 'direct' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Send className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">Direct Enrollment</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Skip discovery and enroll directly in specific services
                          </p>
                        </div>
                      </div>
                      {inviteForm.inviteType === 'direct' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Client Details */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="client@example.com"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      placeholder="John Smith"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={inviteForm.company}
                    onChange={(e) => setInviteForm({ ...inviteForm, company: e.target.value })}
                    placeholder="Acme Ltd"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Service Lines - Only show for Direct enrollment, or optionally for Discovery */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {inviteForm.inviteType === 'discovery' 
                      ? 'Pre-select services (optional - let discovery guide them)'
                      : 'Enroll in Services *'
                    }
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {props.serviceLines.filter((service, index, self) => 
                      // Remove duplicates by id and only show ready services
                      service.status === 'ready' && index === self.findIndex(s => s.id === service.id)
                    ).map((service) => {
                      const Icon = service.icon as React.ComponentType<{ className?: string }> | undefined;
                      const serviceCode = (service as { code?: string }).code ?? service.id;
                      const isSelected = inviteForm.services.includes(serviceCode);
                      return (
                        <label
                          key={service.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInviteForm({ ...inviteForm, services: [...inviteForm.services, serviceCode] });
                              } else {
                                setInviteForm({ ...inviteForm, services: inviteForm.services.filter(s => s !== serviceCode) });
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          {Icon ? <Icon className="w-4 h-4 text-gray-500" /> : <span className="w-4 h-4 inline-block" />}
                          <span className="text-sm font-medium text-gray-900">{service.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {inviteForm.inviteType === 'discovery' && (
                    <p className="text-xs text-gray-500 mt-2">
                      Tip: Leave blank to let Discovery recommend the best services based on their goals
                    </p>
                  )}
                </div>

                {/* Custom Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (optional)
                  </label>
                  <textarea
                    value={inviteForm.customMessage}
                    onChange={(e) => setInviteForm({ ...inviteForm, customMessage: e.target.value })}
                    placeholder="Looking forward to helping you reach your goals..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Preview what client will see */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">What they will experience:</p>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">1</div>
                      <div className="w-px h-4 bg-slate-300" />
                    </div>
                    <p>Receive email invitation</p>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">2</div>
                      <div className="w-px h-4 bg-slate-300" />
                    </div>
                    <p>Create their portal account (set password)</p>
                  </div>
                  {inviteForm.inviteType === 'discovery' ? (
                    <>
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                          <div className="w-px h-4 bg-slate-300" />
                        </div>
                        <p>Complete Destination Discovery (~15 mins)</p>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-slate-600">
                        <div className="flex flex-col items-center">
                          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">4</div>
                        </div>
                        <p>Receive personalized service recommendations</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">3</div>
                      </div>
                      <p>Start onboarding for {inviteForm.services.length > 0 ? inviteForm.services.length : 'selected'} service(s)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    props.setShowInviteModal(false);
                    setInviteForm(DEFAULT_INVITE_FORM);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={sendingInvite || !inviteForm.email || (inviteForm.inviteType === 'direct' && inviteForm.services.length === 0)}
                  className={`inline-flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    inviteForm.inviteType === 'discovery'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {sendingInvite ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {inviteForm.inviteType === 'discovery' ? 'Send Discovery Invite' : 'Send Direct Invite'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {props.showBulkImportModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Bulk Import Clients</h2>
                  <p className="text-sm text-gray-500">Import multiple clients at once for Destination Discovery</p>
                </div>
                <button
                  onClick={() => {
                    props.setShowBulkImportModal(false);
                    setBulkImportData('');
                    props.setBulkImportResults(null);
                    setBulkSendEmails(false);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {!props.bulkImportResults ? (
                  <>
                    {/* Instructions */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <h3 className="font-medium text-blue-900 mb-2">How to format your data</h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Paste data from Excel/Sheets with columns: <strong>Name</strong>, <strong>Email</strong>, and optionally <strong>Company</strong>
                      </p>
                      <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-600 border border-blue-200">
                        <div>Yonas Ackholm	yackholm@hotmail.com	Ackholm Holdings</div>
                        <div>Jeremy Baron	jeremy@baronsec.com	Baron Securities</div>
                        <div>Claude Partridge	claudepartridge@me.com	CEP Developments</div>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        ✓ Tab-separated (Excel copy) or comma-separated (CSV)<br />
                        ✓ Passwords will be auto-generated if not provided<br />
                        ✓ Each client will receive a welcome email with their credentials
                      </p>
                    </div>

                    {/* Data Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paste your client data here
                      </label>
                      <textarea
                        value={bulkImportData}
                        onChange={(e) => setBulkImportData(e.target.value)}
                        placeholder="Name	Email	Company (optional)
Yonas Ackholm	yackholm@hotmail.com	Ackholm Holdings
Jeremy Baron	jeremy@baronsec.com	Baron Securities"
                        rows={12}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                      />
                    </div>

                    {/* Preview */}
                    {bulkImportData.trim() && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Preview: {bulkImportData.trim().split('\n').filter(l => l.trim() && !l.toLowerCase().includes('name')).length} clients detected
                        </p>
                      </div>
                    )}

                    {/* Email Option */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <h3 className="font-medium text-gray-900">Send welcome emails automatically?</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {bulkSendEmails 
                              ? 'Clients will receive an email with their login credentials'
                              : 'No emails sent - you will share credentials personally'
                            }
                          </p>
                        </div>
                        <div 
                          onClick={() => setBulkSendEmails(!bulkSendEmails)}
                          className={`relative w-12 h-6 rounded-full transition-colors ${bulkSendEmails ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${bulkSendEmails ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </div>
                      </label>
                    </div>

                    {/* What happens */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <h3 className="font-medium text-amber-900 mb-2">What happens when you import</h3>
                      <div className="space-y-2 text-sm text-amber-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-600" />
                          <span>Portal accounts created with auto-generated passwords</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-600" />
                          <span>Credentials shown after import so you can share them</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-600" />
                          <span>Clients enrolled in <strong>Destination Discovery</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-amber-600" />
                          <span>When they log in, Discovery assessment appears immediately</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Results View */
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className={`rounded-xl p-6 ${props.bulkImportResults?.summary?.succeeded === props.bulkImportResults?.summary?.total ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                      <h3 className="text-lg font-semibold mb-3">
                        {props.bulkImportResults?.summary?.succeeded === props.bulkImportResults?.summary?.total 
                          ? '✅ All clients imported successfully!'
                          : `⚠️ ${props.bulkImportResults?.summary?.succeeded} of ${props.bulkImportResults?.summary?.total} clients imported`
                        }
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-2xl font-bold text-emerald-600">{props.bulkImportResults?.summary?.succeeded || 0}</div>
                          <div className="text-xs text-gray-500">Succeeded</div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-2xl font-bold text-red-600">{props.bulkImportResults?.summary?.failed || 0}</div>
                          <div className="text-xs text-gray-500">Failed</div>
                        </div>
                        <div className="bg-white rounded-lg p-3">
                          <div className="text-2xl font-bold text-blue-600">{props.bulkImportResults?.summary?.emailsSent || 0}</div>
                          <div className="text-xs text-gray-500">Emails Sent</div>
                        </div>
                      </div>
                    </div>

                    {/* Credentials Table - Copyable */}
                    {props.bulkImportResults?.results?.some((r: any) => r.success) && (
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                          <h4 className="font-medium text-emerald-900">📋 Client Credentials</h4>
                          <button
                            onClick={() => {
                              const successResults = props.bulkImportResults?.results?.filter((r: any) => r.success) ?? [];
                              const text = successResults.map((r: any) => 
                                `${r.name}\t${r.email}\t${r.password}`
                              ).join('\n');
                              navigator.clipboard.writeText(`Name\tEmail\tPassword\n${text}`);
                              alert('Credentials copied to clipboard!');
                            }}
                            className="text-xs px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                          >
                            Copy All
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email (Username)</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Password</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(props.bulkImportResults?.results?.filter((r: any) => r.success) ?? []).map((result: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 font-medium text-gray-900">{result.name}</td>
                                  <td className="px-4 py-2 text-gray-600">{result.email}</td>
                                  <td className="px-4 py-2">
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{result.password}</code>
                                  </td>
                                  <td className="px-4 py-2 text-gray-500">{result.company || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200 text-xs text-blue-700">
                          <strong>Portal URL:</strong> https://torsor.co.uk/client
                        </div>
                      </div>
                    )}

                    {/* Failed Imports */}
                    {props.bulkImportResults?.results?.some((r: any) => !r.success) && (
                      <div className="bg-white rounded-lg border border-red-200 overflow-hidden">
                        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                          <h4 className="font-medium text-red-900">⚠️ Failed Imports</h4>
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          {(props.bulkImportResults?.results?.filter((r: any) => !r.success) ?? []).map((result: any, idx: number) => (
                            <div key={idx} className="px-4 py-2 border-b border-red-100 flex items-center justify-between">
                              <span className="text-sm text-gray-900">{result.name || result.email}</span>
                              <span className="text-xs text-red-600">{result.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                {!props.bulkImportResults ? (
                  <>
                    <button
                      onClick={() => {
                        props.setShowBulkImportModal(false);
                        setBulkImportData('');
                        setBulkSendEmails(false);
                      }}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={bulkImporting || !bulkImportData.trim()}
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                        bulkImporting || !bulkImportData.trim()
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {bulkImporting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Import Clients
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      props.setShowBulkImportModal(false);
                      setBulkImportData('');
                      props.setBulkImportResults(null);
                      setBulkSendEmails(false);
                    }}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Service Edit Modal */}
        {props.editingService && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Edit Service</h2>
                  <button 
                    onClick={() => props.setEditingService(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    value={props.editingService.name || ''}
                    onChange={(e) => props.setEditingService({ ...props.editingService, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                  <input
                    type="text"
                    value={props.editingService.short_description || ''}
                    onChange={(e) => props.setEditingService(props.editingService ? { ...props.editingService, short_description: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                  <textarea
                    rows={3}
                    value={props.editingService.description || ''}
                    onChange={(e) => props.setEditingService(props.editingService ? { ...props.editingService, description: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (£)</label>
                    <input
                      type="number"
                      value={props.editingService.price_amount || ''}
                      onChange={(e) => props.setEditingService(props.editingService ? { ...props.editingService, price_amount: parseFloat(e.target.value) || null } : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Period</label>
                    <select
                      value={props.editingService.price_period || 'one-off'}
                      onChange={(e) => props.setEditingService(props.editingService ? { ...props.editingService, price_period: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="one-off">One-off</option>
                      <option value="month">Monthly</option>
                      <option value="year">Annual</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={props.editingService.status || 'active'}
                    onChange={(e) => props.setEditingService(props.editingService ? { ...props.editingService, status: e.target.value } : null)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Archive instead of delete (safer)
                      props.handleSaveService?.(props.editingService ? { ...props.editingService, status: 'archived' } : undefined);
                    }}
                    disabled={props.savingService}
                    className="px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-2"
                    title="Archive service (keeps data but hides from list)"
                  >
                    <XCircle className="w-4 h-4" />
                    Archive
                  </button>
                  <button
                    onClick={() => { if (props.editingService?.id != null) props.handleDeleteService(props.editingService.id); }}
                    disabled={props.savingService}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    title="Permanently delete (may fail if in use)"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => props.setEditingService(null)}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => props.editingService != null && props.handleSaveService?.(props.editingService)}
                    disabled={props.savingService}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    {props.savingService ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
