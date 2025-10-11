import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface AchievementBadgeProps {
  name: string;
  description: string;
  icon: string; // emoji
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  earned: boolean;
  points: number;
}

const rarityClasses = {
  common: 'badge-common',
  uncommon: 'badge-uncommon',
  rare: 'badge-rare',
  epic: 'badge-epic',
  legendary: 'badge-legendary'
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  name,
  description,
  icon,
  rarity,
  earned,
  points
}) => {
  return (
    <Card 
      className={cn(
        'p-4 text-center',
        earned ? rarityClasses[rarity] : 'bg-gray-800 opacity-50 grayscale',
        'transition-all hover:scale-105'
      )}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="font-semibold text-white">{name}</h3>
      <p className="text-sm text-gray-300 mt-1">{description}</p>
      <div className="mt-2 flex items-center justify-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="text-sm text-yellow-500">{points} pts</span>
      </div>
    </Card>
  );
};

export default AchievementBadge;

