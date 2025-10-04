import React from 'react';
import { GlassCard } from '@/components/accountancy/ui/GlassCard';
import { AdvisoryProgress } from '@/types/accountancy';

interface AdvisoryProgressWidgetProps {
  advisoryProgress: AdvisoryProgress;
}

export const AdvisoryProgressWidget: React.FC<AdvisoryProgressWidgetProps> = ({ advisoryProgress }) => {
  // Mock fallback
  const mockProgress = {
    currentMix: { advisory: 30, compliance: 70 },
    targetMix: { advisory: 50, compliance: 50 }
  };
  const progress = advisoryProgress || mockProgress;
  const currentMix = progress.currentMix || { advisory: 0, compliance: 0 };
  const targetMix = progress.targetMix || { advisory: 0, compliance: 0 };
  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border border-border backdrop-blur-sm lg:col-span-2">
      <h3 className="text-lg font-semibold mb-4 text-card-foreground">Advisory Transformation</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-card-foreground mb-1">
            {currentMix.advisory}%
          </div>
          <div className="text-text-secondary text-sm">Current Advisory</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-gold mb-1">
            {targetMix.advisory}%
          </div>
          <div className="text-text-secondary text-sm">Target Advisory</div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-text-secondary mb-2">
          <span>Compliance</span>
          <span>Advisory</span>
        </div>
        <div className="h-4 bg-background-slate rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-coral to-semantic-success transition-all duration-1000"
            style={{ width: `${currentMix.advisory}%` }}
          />
        </div>
      </div>
      
      <div className="text-sm text-text-secondary">
        Progress: Moving from {currentMix.compliance}%/{currentMix.advisory}% 
        to {targetMix.compliance}%/{targetMix.advisory}% split
      </div>
    </div>
  );
};
