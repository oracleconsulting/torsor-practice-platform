import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SkillLevelBadgeProps {
  level: 0 | 1 | 2 | 3 | 4 | 5;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const levelLabels = {
  0: 'None',
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Proficient',
  4: 'Advanced',
  5: 'Expert'
};

const levelColors = {
  0: 'bg-gray-500',
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
  5: 'bg-blue-500'
};

export const SkillLevelBadge: React.FC<SkillLevelBadgeProps> = ({
  level,
  showLabel = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      className={cn(
        levelColors[level],
        sizeClasses[size],
        'text-white font-medium'
      )}
    >
      {showLabel ? levelLabels[level] : level}
    </Badge>
  );
};

export default SkillLevelBadge;

