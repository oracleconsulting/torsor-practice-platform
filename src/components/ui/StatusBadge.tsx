
import React from 'react';
import { BadgeStatus } from '@/types/accountancy';

interface StatusBadgeProps {
  status: BadgeStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colors = {
    good: 'bg-green-400/20 text-green-400 border-green-400/30',
    warning: 'bg-amber-400/20 text-amber-400 border-amber-400/30',
    danger: 'bg-red-400/20 text-red-400 border-red-400/30'
  };
  
  const labels = {
    good: 'Compliant',
    warning: 'Action Needed',
    danger: 'Non-Compliant'
  };
  
  return (
    <span className={`
      px-3 py-1 rounded-full text-xs font-medium
      border ${colors[status]}
    `}>
      {labels[status]}
    </span>
  );
};
