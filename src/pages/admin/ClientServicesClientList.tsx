/**
 * Full client list UI for Client Services (stats, filters, table, test panel, modals).
 * Composes extracted components from clients/.
 */
import React from 'react';
import { ClientStatsBar } from './clients/ClientStatsBar';
import { ClientFilters } from './clients/ClientFilters';
import { ClientListTable } from './clients/ClientListTable';
import { TestModePanel } from './clients/TestModePanel';
import { ClientServicesClientListModals } from './ClientServicesClientListModals';
import type { ClientServicesClientListProps, ClientRow } from './ClientServicesClientListTypes';

export type { ClientServicesClientListProps } from './ClientServicesClientListTypes';

export function ClientServicesClientList(props: ClientServicesClientListProps): React.ReactElement {
  const loading = false;
  const clients = props.filteredClients as ClientRow[];
  const inProgressCount = props.clients.filter((c) => !c.hasRoadmap && (c.progress ?? 0) > 0).length;
  const notStartedCount = props.clients.filter((c) => (c.progress ?? 0) === 0).length;
  const withRoadmapCount = props.clients.filter((c) => c.hasRoadmap).length;

  return (
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

      <ClientStatsBar
        totalClients={props.clients.length}
        withRoadmapCount={withRoadmapCount}
        inProgressCount={inProgressCount}
        notStartedCount={notStartedCount}
      />

      {props.currentMember?.practice_id && props.selectedServiceLine && (
        <TestModePanel
          practiceId={props.currentMember.practice_id}
          serviceLineCode={props.selectedServiceLine}
          serviceLineName={props.serviceLines.find((s) => s.id === props.selectedServiceLine)?.name ?? props.selectedServiceLine}
          onTestClientCreated={() => props.fetchClients()}
          onTestClientReset={() => props.fetchClients()}
        />
      )}

      <ClientListTable
        clients={clients}
        loading={loading}
        onClientClick={(id) => props.setSelectedClient(id)}
        onDeleteClient={props.handleDeleteClient}
        deletingClientId={props.deletingClient}
        staffMembers={props.staffMembers ?? []}
        assigningOwnerId={props.assigningOwner}
        onAssignOwner={props.handleAssignOwner}
        updatingDiscoveryHideId={props.updatingDiscoveryHide}
        onToggleHideDiscovery={props.handleToggleHideDiscovery}
        headerActions={
          <ClientFilters
            searchQuery={props.searchQuery}
            onSearchChange={props.setSearchQuery}
          />
        }
      />

      <ClientServicesClientListModals {...props} />
    </div>
  );
}
