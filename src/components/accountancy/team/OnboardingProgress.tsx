/**
 * OnboardingProgress Component
 * PROMPT 6: Onboarding Checklist System
 * 
 * Visual progress tracker with gamification
 */

import React from 'react';
import { CheckCircle2, Circle, Clock, Trophy, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  totalPoints: number;
  badgesEarned: string[];
  timeSpentMinutes: number;
  steps: {
    number: number;
    title: string;
    completed: boolean;
    estimatedMinutes: number;
  }[];
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps,
  completionPercentage,
  totalPoints,
  badgesEarned,
  timeSpentMinutes,
  steps
}) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Your Onboarding Journey</h3>
          <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-3" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{totalSteps - currentStep} steps remaining</span>
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-3 gap-4">
        {/* Points */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium">Points</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {totalPoints}
          </div>
          <div className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
            {700 - totalPoints} to max
          </div>
        </div>

        {/* Badges */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium">Badges</span>
          </div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {badgesEarned.length}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-500 mt-1">
            {6 - badgesEarned.length} available
          </div>
        </div>

        {/* Time */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium">Time</span>
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatTime(timeSpentMinutes)}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-500 mt-1">
            {timeSpentMinutes < 120 ? 'Fast pace! ⚡' : 'Thorough review 📚'}
          </div>
        </div>
      </div>

      {/* Step Progress Visual */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">Step Progress</h4>
        <div className="space-y-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                step.completed
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : step.number === currentStep
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-400 dark:ring-blue-600'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : step.number === currentStep ? (
                  <div className="h-6 w-6 rounded-full bg-blue-500 dark:bg-blue-400 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{step.number}</span>
                  </div>
                ) : (
                  <Circle className="h-6 w-6 text-white font-medium dark:text-gray-100 font-medium" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    step.completed
                      ? 'text-green-700 dark:text-green-300'
                      : step.number === currentStep
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-100 font-medium dark:text-white font-medium'
                  }`}>
                    {step.title}
                  </span>
                  {step.number === currentStep && (
                    <Badge variant="secondary" className="text-xs">Current</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  ~{step.estimatedMinutes} minutes
                </div>
              </div>

              {/* Status */}
              {step.completed && (
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                  Complete
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Motivational Message */}
      {completionPercentage < 100 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {getMotivationalMessage(completionPercentage)}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Complete the next step to earn {100} more points!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {completionPercentage === 100 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <Trophy className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-900 dark:text-green-100">
                🎉 Congratulations! Onboarding Complete!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                You've earned {totalPoints} points and {badgesEarned.length} badges. Your completion certificate is ready!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getMotivationalMessage(percentage: number): string {
  if (percentage < 15) return "Welcome aboard! Let's get started! 🚀";
  if (percentage < 30) return "Great start! You're doing awesome! ⭐";
  if (percentage < 50) return "You're halfway there! Keep going! 💪";
  if (percentage < 70) return "Excellent progress! Almost there! 🎯";
  if (percentage < 90) return "So close! Just a few more steps! 🏃";
  return "Final stretch! You've got this! 🏁";
}

