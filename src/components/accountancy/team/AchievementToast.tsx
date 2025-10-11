/**
 * AchievementToast Component
 * PROMPT 9: Gamification & Engagement Features
 * 
 * Celebration animation and toast for earned achievements
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { UserAchievement } from '@/services/gamification/achievementSystem';

interface AchievementToastProps {
  achievement: UserAchievement;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 50);

    // Auto-close if enabled
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-500 to-gray-600';
      case 'uncommon': return 'from-green-500 to-green-600';
      case 'rare': return 'from-blue-500 to-blue-600';
      case 'epic': return 'from-purple-500 to-purple-600';
      case 'legendary': return 'from-yellow-500 to-yellow-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const rarityClass = getRarityColor(achievement.achievement.rarity);

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
        isVisible && !isExiting 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
      style={{ width: '400px', maxWidth: 'calc(100vw - 2rem)' }}
    >
      {/* Confetti Animation */}
      {isVisible && !isExiting && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Toast Card */}
      <div className={`relative bg-gradient-to-br ${rarityClass} p-1 rounded-lg shadow-2xl`}>
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rarityClass} flex items-center justify-center text-2xl shadow-lg animate-bounce`}>
              {achievement.achievement.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Achievement Unlocked!
                </span>
              </div>
              <h3 className="text-lg font-bold">{achievement.achievement.name}</h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-3">
            {achievement.achievement.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                <Star className="h-3 w-3 mr-1" />
                +{achievement.points_awarded} pts
              </Badge>
              <Badge variant="secondary">
                {achievement.achievement.rarity}
              </Badge>
            </div>
            <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${rarityClass} blur-xl opacity-50 -z-10 animate-pulse`} />
    </div>
  );
};

// Add confetti animation to global CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes confetti {
    0% {
      transform: translateY(-10px) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(200px) rotate(720deg);
      opacity: 0;
    }
  }
  .animate-confetti {
    animation: confetti linear forwards;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

