import React from 'react';
import { GlassCard } from '@/components/accountancy/ui/GlassCard';
import { ProgressRing } from '@/components/accountancy/ui/ProgressRing';
import { HealthScore } from '@/types/accountancy';

interface HealthScoreWidgetProps {
  healthScore: HealthScore;
}

export const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({ healthScore }) => {
  // Mock fallback
  const mockScore = {
    overall: 75,
    compliance: 80,
    team: 70,
    advisory: 65,
    financial: 78
  };
  const score = healthScore || mockScore;
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-6 text-primary">Practice Health Score</h3>
      
      {/* Circular Progress */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="url(#healthGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - (score.overall ?? 0) / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-semibold text-primary">{score.overall ?? 0}%</div>
              <div className="text-xs text-secondary">Overall</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Bars */}
      <div className="space-y-4">
        {Object.entries({
          compliance: score.compliance ?? 0,
          team: score.team ?? 0,
          advisory: score.advisory ?? 0,
          financial: score.financial ?? 0
        }).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm text-secondary capitalize">{key}</span>
            <div className="flex items-center gap-2">
              <div className="progress-bar w-16">
                <div 
                  className="progress-fill transition-all duration-1000"
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="text-sm font-medium text-primary w-8">{value}%</span>
            </div>
          </div>
        ))}
      </div>
      
      <button className="btn btn-primary w-full mt-6">
        View Full Report
      </button>
    </div>
  );
};
