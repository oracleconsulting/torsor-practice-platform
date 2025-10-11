/**
 * MobileRatingSelector Component
 * PROMPT 7: Mobile-First Assessment Experience
 * 
 * Large touch targets for easy mobile rating selection
 */

import React from 'react';
import { Star, TrendingUp, Award, Zap, Target } from 'lucide-react';

interface MobileRatingSelectorProps {
  type: 'level' | 'interest';
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  showLabels?: boolean;
}

export const MobileRatingSelector: React.FC<MobileRatingSelectorProps> = ({
  type,
  value,
  onChange,
  disabled = false,
  showLabels = true
}) => {
  const maxValue = type === 'level' ? 5 : 5;
  const minValue = type === 'level' ? 0 : 1;

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }
  };

  const getIcon = (index: number) => {
    if (type === 'level') {
      const icons = [Star, TrendingUp, Award, Zap, Target, Star];
      const Icon = icons[index];
      return <Icon className="h-6 w-6" />;
    }
    return <Star className="h-6 w-6" />;
  };

  const getLevelLabel = (level: number) => {
    if (type === 'level') {
      const labels = ['None', 'Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Expert'];
      return labels[level];
    }
    const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
    return labels[level];
  };

  const getColor = (index: number, isSelected: boolean) => {
    if (type === 'level') {
      if (!isSelected) return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
      if (index === 0) return 'bg-gray-400 border-gray-400';
      if (index === 1) return 'bg-red-500 border-red-500';
      if (index === 2) return 'bg-orange-500 border-orange-500';
      if (index === 3) return 'bg-yellow-500 border-yellow-500';
      if (index === 4) return 'bg-green-500 border-green-500';
      return 'bg-blue-500 border-blue-500';
    }
    
    if (!isSelected) return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    return 'bg-purple-500 border-purple-500';
  };

  const getTextColor = (isSelected: boolean) => {
    return isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="w-full">
      {/* Rating Buttons - Horizontal Layout */}
      <div className="grid grid-cols-6 gap-2 md:gap-3">
        {Array.from({ length: maxValue - minValue + 1 }, (_, i) => i + minValue).map((level) => {
          const isSelected = value === level;
          return (
            <button
              key={level}
              onClick={() => {
                triggerHaptic();
                onChange(level);
              }}
              disabled={disabled}
              className={`
                relative h-20 md:h-24 rounded-xl border-2 
                flex flex-col items-center justify-center gap-1
                transition-all duration-200
                ${getColor(level, isSelected)}
                ${getTextColor(isSelected)}
                ${isSelected ? 'scale-105 shadow-lg' : 'hover:scale-102'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}
                touch-manipulation
              `}
              aria-label={`Select ${type} level ${level}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {getIcon(level)}
              </div>
              
              {/* Number */}
              <div className="text-2xl font-bold">
                {level}
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Labels (optional) */}
      {showLabels && (
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-foreground">
            {getLevelLabel(value)}
          </p>
          {type === 'level' && (
            <p className="text-xs text-muted-foreground mt-1">
              {value === 0 && 'No experience with this skill'}
              {value === 1 && 'Basic understanding, limited practical experience'}
              {value === 2 && 'Working knowledge, can handle routine tasks'}
              {value === 3 && 'Strong skills, can work independently'}
              {value === 4 && 'Expert level, can mentor others'}
              {value === 5 && 'Master level, recognized authority'}
            </p>
          )}
          {type === 'interest' && (
            <p className="text-xs text-muted-foreground mt-1">
              {value === 1 && 'Not interested in developing this skill'}
              {value === 2 && 'Slightly interested'}
              {value === 3 && 'Moderately interested'}
              {value === 4 && 'Very interested in learning'}
              {value === 5 && 'Extremely motivated to develop this skill'}
            </p>
          )}
        </div>
      )}

      {/* Alternative: Vertical Slider for Compact Mode */}
      {false && ( // Set to true to use slider instead
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={minValue}
            max={maxValue}
            value={value}
            onChange={(e) => {
              triggerHaptic();
              onChange(parseInt(e.target.value));
            }}
            disabled={disabled}
            className="flex-1 h-12 appearance-none bg-transparent cursor-pointer touch-manipulation"
            style={{
              background: `linear-gradient(to right, 
                ${type === 'level' ? '#3b82f6' : '#a855f7'} 0%, 
                ${type === 'level' ? '#3b82f6' : '#a855f7'} ${((value - minValue) / (maxValue - minValue)) * 100}%, 
                #e5e7eb ${((value - minValue) / (maxValue - minValue)) * 100}%, 
                #e5e7eb 100%)`
            }}
          />
          <div className="text-2xl font-bold w-12 text-center">
            {value}
          </div>
        </div>
      )}
    </div>
  );
};

