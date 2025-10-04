import React from 'react';
import { User } from 'lucide-react';
import { GlassCard } from '@/components/accountancy/ui/GlassCard';
import { ProgressRing } from '@/components/accountancy/ui/ProgressRing';
import { StatusBadge } from '@/components/accountancy/ui/StatusBadge';
import { TeamMember } from '@/types/accountancy';

interface TeamCPDWidgetProps {
  data?: TeamMember[];
}

export const TeamCPDWidget: React.FC<TeamCPDWidgetProps> = ({ data }) => {
  // Mock fallback
  const mockData = [
    { id: '1', name: 'Alice', cpdHours: 12 },
    { id: '2', name: 'Bob', cpdHours: 8 },
    { id: '3', name: 'Charlie', cpdHours: 15 }
  ];
  const teamData = Array.isArray(data) ? data : mockData;
  return (
    <GlassCard>
      <h3 className="text-lg font-semibold text-white mb-4">Team CPD</h3>
      <div className="space-y-3">
        {teamData.map((member) => (
          <div key={member.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
            <span className="text-white font-medium">{member.name}</span>
            <span className="text-gold-400 font-bold">{member.cpdHours} hrs</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
