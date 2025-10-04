
import React from 'react';
import { GlassCard } from './GlassCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon, 
  trend = 'neutral' 
}) => (
  <GlassCard>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
        {change !== undefined && (
          <div className="flex items-center mt-2 space-x-1">
            <span className={`text-sm ${
              trend === 'up' ? 'text-green-400' : 
              trend === 'down' ? 'text-red-400' : 
              'text-gray-400'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
      <div className="text-gold-400 text-2xl">{icon}</div>
    </div>
  </GlassCard>
);
