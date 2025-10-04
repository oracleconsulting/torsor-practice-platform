import React from 'react';

interface Milestone {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  critical: boolean;
}

interface ComplianceCalendarProps {
  milestones: Milestone[];
  className?: string;
}

export const ComplianceCalendar: React.FC<ComplianceCalendarProps> = ({ milestones, className }) => {
  return (
    <div className={`space-y-3 ${className || ''}`}>
      {milestones.map(m => (
        <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <span className={`w-3 h-3 rounded-full ${m.completed ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className={`flex-1 text-white ${m.completed ? 'line-through text-gray-400' : ''}`}>{m.title}</span>
          <span className="text-xs text-purple-200">{new Date(m.date).toLocaleDateString()}</span>
          {m.critical && <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">Critical</span>}
        </div>
      ))}
    </div>
  );
}; 