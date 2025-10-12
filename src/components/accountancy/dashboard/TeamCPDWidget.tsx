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
  const teamData = Array.isArray(data) ? data : [];
  
  return (
    <GlassCard>
      <h3 className="text-lg font-semibold text-white mb-4">Team CPD</h3>
      <div className="space-y-3">
        {teamData.length > 0 ? (
          teamData.map((member: any) => (
            <div key={member.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
              <span className="text-white font-medium">{member.name}</span>
              <span className="text-gold-400 font-bold">{member.cpdHours || 0} hrs</span>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-400">
            <p>No CPD data available</p>
            <p className="text-sm mt-1">Team members will appear here once they log CPD hours</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
