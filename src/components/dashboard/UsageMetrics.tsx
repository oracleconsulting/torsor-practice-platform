
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Zap, Target } from 'lucide-react';

interface UsageMetricsProps {
  tier: 'free' | 'starter' | 'growth' | 'scale';
  usage: {
    boardMeetings: { used: number; limit: number };
    integrations: { used: number; limit: number };
    teamMembers: { used: number; limit: number };
    projects: { used: number; limit: number };
  };
}

export const UsageMetrics: React.FC<UsageMetricsProps> = ({ tier, usage }) => {
  const metrics = [
    {
      icon: TrendingUp,
      label: 'Board Meetings',
      used: usage.boardMeetings.used,
      limit: usage.boardMeetings.limit,
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Zap,
      label: 'Integrations',
      used: usage.integrations.used,
      limit: usage.integrations.limit,
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Users,
      label: 'Team Members',
      used: usage.teamMembers.used,
      limit: usage.teamMembers.limit,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: Target,
      label: 'Projects',
      used: usage.projects.used,
      limit: usage.projects.limit,
      color: 'from-amber-500 to-amber-600'
    }
  ];

  const getProgressColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="grid-mobile-stack mb-6 md:mb-8">
      {metrics.map((metric, index) => {
        const percentage = (metric.used / metric.limit) * 100;
        const isNearLimit = percentage >= 80;
        
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card-mobile ${isNearLimit ? 'border-amber-500/50' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r ${metric.color} rounded-lg flex items-center justify-center`}>
                  <metric.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm md:text-base">{metric.label}</p>
                  <p className="text-gray-400 text-xs md:text-sm">
                    {metric.used} of {metric.limit === -1 ? '∞' : metric.limit}
                  </p>
                </div>
              </div>
              
              {isNearLimit && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                  Near Limit
                </span>
              )}
            </div>
            
            {metric.limit !== -1 && (
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(metric.used, metric.limit)}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
