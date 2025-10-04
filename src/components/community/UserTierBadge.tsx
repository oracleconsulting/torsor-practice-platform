
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap, Sparkles } from 'lucide-react';

interface UserTierBadgeProps {
  tier: 'explorer' | 'starter' | 'growth' | 'enterprise';
  className?: string;
}

export function UserTierBadge({ tier, className }: UserTierBadgeProps) {
  const tierConfig = {
    explorer: {
      label: 'Explorer',
      icon: Star,
      color: 'bg-gray-600 text-gray-200',
      description: 'Free Access'
    },
    starter: {
      label: 'Starter',
      icon: Zap,
      color: 'bg-blue-600 text-white',
      description: '£99/month'
    },
    growth: {
      label: 'Growth',
      icon: Crown,
      color: 'bg-purple-600 text-white',
      description: '£299/month'
    },
    enterprise: {
      label: 'Enterprise',
      icon: Sparkles,
      color: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
      description: 'Custom'
    }
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge className={`${config.color} flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
      <span className="text-sm text-gray-400">{config.description}</span>
    </div>
  );
}
