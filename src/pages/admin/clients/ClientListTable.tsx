/**
 * Client list table with owner, progress, status, and actions.
 */
import React from 'react';
import { ChevronRight, Trash2, Users } from 'lucide-react';
import { StatusBadge, EmptyState, TableRowSkeleton } from '../../../components/ui';
import type { ClientRow } from '../ClientServicesClientListTypes';

export interface ClientListTableProps {
  clients: ClientRow[];
  loading?: boolean;
  onClientClick: (clientId: string) => void;
  onDeleteClient: (id: string, name: string, email: string) => void;
  deletingClientId: string | null;
  staffMembers?: Array<{ id: string; name: string }>;
  assigningOwnerId?: string | null;
  onAssignOwner?: (clientId: string, ownerId: string | null) => void;
  updatingDiscoveryHideId?: string | null;
  onToggleHideDiscovery?: (clientId: string, hide: boolean) => void;
  /** Optional header actions (e.g. ClientFilters) rendered next to "All Clients" */
  headerActions?: React.ReactNode;
}

export function ClientListTable({
  clients,
  loading = false,
  onClientClick,
  onDeleteClient,
  deletingClientId,
  staffMembers = [],
  assigningOwnerId,
  onAssignOwner,
  updatingDiscoveryHideId,
  onToggleHideDiscovery,
  headerActions,
}: ClientListTableProps): React.ReactElement {
  return (
    <div className="card overflow-hidden">
      <div className="card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="section-heading">All Clients</h2>
        {headerActions}
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
                      {Boolean(client.is_test_client) && (
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          TEST
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <select
                      value={client.client_owner_id || ''}
                      onChange={(e) => onAssignOwner?.(client.id, e.target.value || null)}
                      disabled={assigningOwnerId === client.id}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 min-w-[140px]"
                    >
                      <option value="">Unassigned</option>
                      {staffMembers.map((staff) => (
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
                      <StatusBadge status={client.status ?? 'neutral'} />
                    )}
                  </td>
                  <td>
                    <label className="flex items-center gap-2 cursor-pointer" title="When checked, Discovery assessment is hidden on this client's dashboard">
                      <input
                        type="checkbox"
                        checked={!!client.hide_discovery_in_portal}
                        onChange={(e) => onToggleHideDiscovery?.(client.id, e.target.checked)}
                        disabled={updatingDiscoveryHideId === client.id}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-600">Hide Discovery</span>
                    </label>
                  </td>
                  <td>
                    <span className="text-sm text-gray-500">
                      {client.lastActivity
                        ? new Date(client.lastActivity).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/clients/${client.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onClientClick(client.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors text-sm font-medium"
                      >
                        View
                        <ChevronRight className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => onDeleteClient(client.id, client.name, client.email ?? '')}
                        disabled={deletingClientId === client.id}
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
}
