/**
 * Full client list UI for Client Services (stats, table, modals).
 * Extracted to a separate file to avoid TS/JSX parse errors from large inline JSX in ClientServicesPage.
 */
import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Filter,
  Search,
  Trash2,
  ChevronRight,
  Users,
} from 'lucide-react';
import { StatCard, StatusBadge, EmptyState, TableRowSkeleton } from '../../components/ui';
import { TestClientPanel } from '../../components/admin/TestClientPanel';
import { ClientServicesClientListModals } from './ClientServicesClientListModals';
import type { ClientServicesClientListProps } from './ClientServicesClientListTypes';

export type { ClientServicesClientListProps } from './ClientServicesClientListTypes';

export function ClientServicesClientList(props: ClientServicesClientListProps): React.ReactElement {
  const loading = false;
  const [testPanelOpen, setTestPanelOpen] = useState(false);
  const clients = props.filteredClients as typeof props.clients;
  const inProgressCount = props.clients.filter((c) => !c.hasRoadmap && (c.progress ?? 0) > 0).length;
  const notStartedCount = props.clients.filter((c) => (c.progress ?? 0) === 0).length;

  const clientListSection = (
    <div className="card overflow-hidden">
      <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="section-heading">All Clients</h2>
        <div className="flex gap-4">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={props.searchQuery}
              onChange={(e) => props.setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button type="button" className="btn-secondary inline-flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <table className="data-table">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={7} />
              ))}
            </tbody>
          </table>
        ) : clients.length === 0 ? (
          <div className="card-body">
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No clients found"
              description="Try adjusting your search or filters, or invite new clients to this service line."
            />
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Owner</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Discovery in portal</th>
                <th>Last Activity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {client.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                        {client.company && (
                          <p className="text-xs text-gray-400">{client.company}</p>
                        )}
                      </div>
                      {Boolean((client as { is_test_client?: boolean }).is_test_client) && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          TEST
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      value={(client as { client_owner_id?: string }).client_owner_id || ''}
                      onChange={(e) => props.handleAssignOwner?.(client.id, e.target.value || null)}
                      disabled={props.assigningOwner === client.id}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 min-w-[140px]"
                    >
                      <option value="">Unassigned</option>
                      {(props.staffMembers ?? []).map((staff) => (
                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-blue rounded-full transition-all"
                          style={{ width: `${client.progress ?? 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{client.progress ?? 0}%</span>
                    </div>
                  </td>
                  <td>
                    {client.hasRoadmap ? (
                      <StatusBadge status="ready" label="Roadmap Active" />
                    ) : (
                      <StatusBadge status={(client as { status?: string }).status ?? 'neutral'} />
                    )}
                  </td>
                  <td>
                    <label className="flex items-center gap-2 cursor-pointer" title="When checked, Discovery assessment is hidden on this client's dashboard">
                      <input
                        type="checkbox"
                        checked={!!(client as { hide_discovery_in_portal?: boolean }).hide_discovery_in_portal}
                        onChange={(e) => props.handleToggleHideDiscovery?.(client.id, e.target.checked)}
                        disabled={props.updatingDiscoveryHide === client.id}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-600">Hide Discovery</span>
                    </label>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500">
                      {(client as { lastActivity?: string }).lastActivity
                        ? new Date((client as { lastActivity?: string }).lastActivity ?? '').toLocaleDateString()
                        : 'Never'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/clients/${client.id}`}
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
    </div>
  );

  const content = (() => {
    return ((
          <div className="space-y-6">
            {/* Back button and header */}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => props.setSelectedServiceLine(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Service Lines
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 font-display">
                {props.serviceLines.find((s) => s.id === props.selectedServiceLine)?.name}
              </h2>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                label="Total Clients"
                value={props.clients.length}
                accent="blue"
                icon={<Users className="w-5 h-5" />}
              />
              <StatCard
                label="With Roadmap"
                value={props.clients.filter((c) => c.hasRoadmap).length}
                accent="teal"
                icon={<CheckCircle className="w-5 h-5" />}
              />
              <StatCard
                label="In Progress"
                value={inProgressCount}
                accent="orange"
                icon={<Clock className="w-5 h-5" />}
              />
              <StatCard
                label="Not Started"
                value={notStartedCount}
                accent="red"
                icon={<AlertCircle className="w-5 h-5" />}
              />
            </div>

            {/* Test Mode Panel — collapsible */}
            {props.currentMember?.practice_id && props.selectedServiceLine && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden mb-4">
                <button
                  type="button"
                  onClick={() => setTestPanelOpen(!testPanelOpen)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-amber-800"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Test Mode Controls
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${testPanelOpen ? 'rotate-180' : ''}`} />
                </button>
                {testPanelOpen && (
                  <div className="px-4 pb-4 border-t border-amber-200">
                    <TestClientPanel
                      practiceId={props.currentMember.practice_id}
                      serviceLineCode={props.selectedServiceLine}
                      serviceLineName={props.serviceLines.find((s) => s.id === props.selectedServiceLine)?.name ?? props.selectedServiceLine}
                      onTestClientCreated={(clientId) => {
                        console.log('Test client created:', clientId);
                        props.fetchClients();
                      }}
                      onTestClientReset={() => {
                        console.log('Test client reset');
                        props.fetchClients();
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {clientListSection}

        <ClientServicesClientListModals {...props} />
      </div>
    ));
  })();
  return content;
}
