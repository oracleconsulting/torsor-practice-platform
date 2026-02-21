/**
 * Stat cards bar for Client Services list (total, with roadmap, in progress, not started).
 */
import React from 'react';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { StatCard } from '../../../components/ui';

export interface ClientStatsBarProps {
  totalClients: number;
  withRoadmapCount: number;
  inProgressCount: number;
  notStartedCount: number;
}

export function ClientStatsBar({
  totalClients,
  withRoadmapCount,
  inProgressCount,
  notStartedCount,
}: ClientStatsBarProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total Clients"
        value={totalClients}
        accent="blue"
        icon={<Users className="w-5 h-5" />}
      />
      <StatCard
        label="With Roadmap"
        value={withRoadmapCount}
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
  );
}
