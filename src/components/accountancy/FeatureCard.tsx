
import React from 'react';
import { GlassCard } from './ui/GlassCard';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ 
  icon, 
  title, 
  description, 
  benefits 
}) => (
  <GlassCard className="h-full hover:scale-105 transition-transform duration-300">
    <div className="text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 mb-4">{description}</p>
      <ul className="space-y-2">
        {benefits.map((benefit, idx) => (
          <li key={idx} className="text-sm text-gray-300 flex items-center">
            <span className="text-gold-400 mr-2">✓</span>
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  </GlassCard>
);
