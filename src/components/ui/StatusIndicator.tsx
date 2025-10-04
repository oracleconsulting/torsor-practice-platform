import React from 'react';

interface StatusIndicatorProps {
  status: 'compliant' | 'action_required' | 'urgent' | 'not_configured';
  daysRemaining?: number;
  className?: string;
}

const statusMap = {
  compliant: {
    color: 'bg-green-500',
    label: 'Compliant',
    desc: 'All requirements met'
  },
  action_required: {
    color: 'bg-yellow-400',
    label: 'Action Required',
    desc: 'Review required documents'
  },
  urgent: {
    color: 'bg-red-500',
    label: 'Urgent',
    desc: 'Immediate action needed'
  },
  not_configured: {
    color: 'bg-gray-400',
    label: 'Not Configured',
    desc: 'Setup required by Dec 1, 2025'
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, daysRemaining, className }) => {
  const { color, label, desc } = statusMap[status] || statusMap.not_configured;
  return (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      <span className={`w-4 h-4 rounded-full ${color} border-2 border-white/30`} />
      <span className="font-semibold text-white">{label}</span>
      {typeof daysRemaining === 'number' && (
        <span className="text-xs text-gray-300 ml-2">{daysRemaining > 0 ? `${daysRemaining} days` : 'Expired'}</span>
      )}
      <span className="text-xs text-gray-400 ml-2">{desc}</span>
    </div>
  );
}; 