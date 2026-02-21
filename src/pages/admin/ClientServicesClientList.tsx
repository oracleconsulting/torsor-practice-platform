/**
 * Full client list UI for Client Services (stats, table, modals).
 * Extracted to a separate file to avoid TS/JSX parse errors from large inline JSX in ClientServicesPage.
 */
import React from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { TestClientPanel } from '../../components/admin/TestClientPanel';
import { ClientServicesClientListModals } from './ClientServicesClientListModals';
import type { ClientServicesClientListProps } from './ClientServicesClientListTypes';

export type { ClientServicesClientListProps } from './ClientServicesClientListTypes';

export function ClientServicesClientList(props: ClientServicesClientListProps): React.ReactElement {
  const loading = false;
  const clientListSection = (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-gray-500 mt-4">Loading clients...</p>
        </div>
      ) : props.filteredClients.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No clients found</p>
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Client</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Owner</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Progress</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Discovery in portal</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Last Activity</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(props.filteredClients as typeof props.clients).map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.email}</p>
                    {client.company && (
                      <p className="text-sm text-gray-400">{client.company}</p>
                    )}
                  </div>
                  {Boolean((client as { is_test_client?: boolean }).is_test_client) && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                      TEST
                    </span>
                  )}
                </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={(client as { client_owner_id?: string }).client_owner_id || ''}
                    onChange={(e) => props.handleAssignOwner?.(client.id, e.target.value || null)}
                    disabled={props.assigningOwner === client.id}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 min-w-[140px]"
                  >
                    <option value="">Unassigned</option>
                    {(props.staffMembers ?? []).map(staff => (
                      <option key={staff.id} value={staff.id}>{staff.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${client.progress ?? 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{client.progress ?? 0}%</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {client.hasRoadmap ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Roadmap Active
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${props.getStatusColor((client as { status?: string }).status ?? '')}`}>
                        {(client as { status?: string }).status === 'active' ? 'In Progress' : (client as { status?: string }).status}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <label className="flex items-center gap-2 cursor-pointer" title="When checked, Discovery assessment is hidden on this client's dashboard">
                    <input
                      type="checkbox"
                      checked={!!(client as { hide_discovery_in_portal?: boolean }).hide_discovery_in_portal}
                      onChange={(e) => props.handleToggleHideDiscovery?.(client.id, e.target.checked)}
                      disabled={props.updatingDiscoveryHide === client.id}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Hide Discovery</span>
                  </label>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-500">
                    {(client as { lastActivity?: string }).lastActivity
                      ? new Date((client as { lastActivity?: string }).lastActivity ?? '').toLocaleDateString()
                      : 'Never'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <a
                      href={`/props.clients/${client.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        props.setSelectedClient(client.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      View
                      <ChevronRight className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => props.handleDeleteClient(client.id, client.name, client.email ?? '')}
                      disabled={props.deletingClient === client.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete client permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const content = (() => {
    return ((
          <div className="space-y-6">
            {/* Back button and header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => props.setSelectedServiceLine(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Service Lines
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900">
                {props.serviceLines.find(s => s.id === props.selectedServiceLine)?.name}
              </h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{props.clients.length}</p>
                    <p className="text-sm text-gray-500">Total Clients</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {props.clients.filter(c => c.hasRoadmap).length}
                    </p>
                    <p className="text-sm text-gray-500">With Roadmap</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {props.clients.filter(c => !c.hasRoadmap && (c.progress ?? 0) > 0).length}
                    </p>
                    <p className="text-sm text-gray-500">In Progress</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {props.clients.filter(c => (c.progress ?? 0) === 0).length}
                    </p>
                    <p className="text-sm text-gray-500">Not Started</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Mode Panel */}
            {props.currentMember?.practice_id && props.selectedServiceLine && (
              <TestClientPanel
                practiceId={props.currentMember.practice_id}
                serviceLineCode={props.selectedServiceLine}
                serviceLineName={props.serviceLines.find(s => s.id === props.selectedServiceLine)?.name || props.selectedServiceLine}
                onTestClientCreated={(clientId) => {
                  console.log('Test client created:', clientId);
                  props.fetchClients();
                }}
                onTestClientReset={() => {
                  console.log('Test client reset');
                  props.fetchClients();
                }}
              />
            )}

            {/* Search and Filter */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={props.searchQuery}
                    onChange={(e) => props.setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            {clientListSection}

        <ClientServicesClientListModals {...props} />
      </div>
    ));
  })();
  return content;
}
