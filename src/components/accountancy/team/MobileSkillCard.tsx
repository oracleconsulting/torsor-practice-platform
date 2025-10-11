/**
 * MobileSkillCard Component
 * PROMPT 7: Mobile-First Assessment Experience
 * 
 * Swipeable Tinder-style skill card for mobile devices
 */

import React, { useState, useRef, TouchEvent } from 'react';
import { ChevronRight, ChevronLeft, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MobileSkillCardProps {
  skillName: string;
  category: string;
  description?: string;
  currentLevel?: number;
  interestLevel?: number;
  completed?: boolean;
  totalSkills: number;
  currentIndex: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTapAndHold?: () => void;
  onRatingChange?: (type: 'level' | 'interest', value: number) => void;
}

export const MobileSkillCard: React.FC<MobileSkillCardProps> = ({
  skillName,
  category,
  description,
  currentLevel = 0,
  interestLevel = 0,
  completed = false,
  totalSkills,
  currentIndex,
  onSwipeLeft,
  onSwipeRight,
  onTapAndHold,
  onRatingChange
}) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [translateX, setTranslateX] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });

    // Start long press timer
    const timer = setTimeout(() => {
      triggerHapticFeedback('medium');
      setShowDescription(true);
      if (onTapAndHold) onTapAndHold();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchStart) return;

    // Cancel long press if moving
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
    setTouchEnd(currentTouch);

    // Calculate swipe distance
    const deltaX = currentTouch.x - touchStart.x;
    const deltaY = currentTouch.y - touchStart.y;

    // Only translate horizontally if swipe is more horizontal than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setTranslateX(deltaX);
      setRotation(deltaX * 0.1); // Rotate slightly based on swipe
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!touchStart || !touchEnd) {
      setTranslateX(0);
      setRotation(0);
      return;
    }

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // Check if swipe is horizontal enough
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > minSwipeDistance) {
        // Swipe right
        triggerHapticFeedback('light');
        if (onSwipeRight) onSwipeRight();
      } else if (deltaX < -minSwipeDistance) {
        // Swipe left
        triggerHapticFeedback('light');
        if (onSwipeLeft) onSwipeLeft();
      }
    }

    // Reset position
    setTranslateX(0);
    setRotation(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    // Haptic feedback for supported devices
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const getLevelColor = (level: number) => {
    if (level === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (level === 1) return 'bg-red-500';
    if (level === 2) return 'bg-orange-500';
    if (level === 3) return 'bg-yellow-500';
    if (level === 4) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getLevelLabel = (level: number) => {
    const labels = ['None', 'Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Expert'];
    return labels[level] || 'None';
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Card */}
      <Card
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full max-w-md h-[500px] touch-none select-none transition-shadow shadow-lg"
        style={{
          transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
          transition: translateX === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        <CardContent className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">
                {category}
              </Badge>
              <h2 className="text-2xl font-bold mb-1">{skillName}</h2>
              <p className="text-sm text-muted-foreground">
                Skill {currentIndex + 1} of {totalSkills}
              </p>
            </div>
            {completed && (
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
            )}
          </div>

          {/* Description (expandable) */}
          {description && (
            <div className="mb-4">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Info className="h-4 w-4" />
                {showDescription ? 'Hide' : 'Show'} description
              </button>
              {showDescription && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Ratings */}
          <div className="space-y-6">
            {/* Current Level */}
            <div>
              <label className="text-sm font-semibold mb-3 block">
                Current Skill Level
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      triggerHapticFeedback('light');
                      if (onRatingChange) onRatingChange('level', level);
                    }}
                    className={`flex-1 h-16 rounded-lg border-2 transition-all active:scale-95 ${
                      currentLevel === level
                        ? `${getLevelColor(level)} border-transparent text-white font-bold`
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                {getLevelLabel(currentLevel)}
              </p>
            </div>

            {/* Interest Level */}
            <div>
              <label className="text-sm font-semibold mb-3 block">
                Interest to Learn
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      triggerHapticFeedback('light');
                      if (onRatingChange) onRatingChange('interest', level);
                    }}
                    className={`flex-1 h-16 rounded-lg border-2 transition-all active:scale-95 ${
                      interestLevel === level
                        ? 'bg-purple-500 border-transparent text-white font-bold'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>

          {/* Swipe Hints */}
          <div className="mt-6 flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span>Swipe left: Previous</span>
            </div>
            <div className="flex items-center gap-1">
              <span>Swipe right: Next</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swipe Indicators */}
      {translateX !== 0 && (
        <>
          {translateX > 0 && (
            <div className="absolute top-1/2 right-4 -translate-y-1/2 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              NEXT →
            </div>
          )}
          {translateX < 0 && (
            <div className="absolute top-1/2 left-4 -translate-y-1/2 bg-blue-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
              ← PREV
            </div>
          )}
        </>
      )}
    </div>
  );
};

