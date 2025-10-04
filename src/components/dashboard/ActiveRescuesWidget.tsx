import React from 'react';
import { ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/accountancy/ui/GlassCard';
import { StatusBadge } from '@/components/accountancy/ui/StatusBadge';
import { severityToBadgeStatus } from '@/utils/accountancy/mappers';
import { Rescue } from '@/types/accountancy';

interface ActiveRescuesWidgetProps {
  rescues: Rescue[];
  onUpdateProgress: (rescueId: string, progress: number) => Promise<void>;
}

export const ActiveRescuesWidget: React.FC<ActiveRescuesWidgetProps> = ({ 
  rescues, 
  onUpdateProgress 
}) => {
  // Mock fallback
  const mockRescues: Rescue[] = [
    { id: '1', clientName: 'Acme Ltd', issueType: 'VAT', severity: 'high', progress: 60, dueDate: '2024-07-01' },
    { id: '2', clientName: 'Beta LLP', issueType: 'Payroll', severity: 'medium', progress: 40, dueDate: '2024-07-10' }
  ];
  const safeRescues = Array.isArray(rescues) ? rescues : mockRescues;
  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Active Client Rescues</h3>
        <span className="text-gold-400 text-sm">{safeRescues.length} active</span>
      </div>
      <div className="space-y-3">
        {safeRescues.map((rescue) => (
          <div key={rescue.id} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{rescue.clientName}</span>
              <StatusBadge status={severityToBadgeStatus(rescue.severity)} />
            </div>
            <div className="text-gray-400 text-sm mb-2">{rescue.issueType}</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gold-400 transition-all duration-1000"
                    style={{ width: `${rescue.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{rescue.progress}%</span>
              </div>
              <span className="text-xs text-gray-400">Due {rescue.dueDate}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="w-full mt-4 px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all flex items-center justify-center space-x-2">
        <span>View All Rescues</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </GlassCard>
  );
};
