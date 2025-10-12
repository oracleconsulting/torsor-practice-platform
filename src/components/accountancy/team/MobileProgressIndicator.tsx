/**
 * MobileProgressIndicator Component
 * PROMPT 7: Mobile-First Assessment Experience
 * 
 * Clean, mobile-optimized progress indicator
 */

import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MobileProgressIndicatorProps {
  current: number;
  total: number;
  completed: number;
  categoryName?: string;
  showPercentage?: boolean;
  compact?: boolean;
}

export const MobileProgressIndicator: React.FC<MobileProgressIndicatorProps> = ({
  current,
  total,
  completed,
  categoryName,
  showPercentage = true,
  compact = false
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const remaining = total - completed;

  if (compact) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {current + 1} of {total}
          </span>
          <span className="text-xs text-muted-foreground">
            {completed} completed
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg border border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Assessment Progress</h3>
          {categoryName && (
            <p className="text-sm text-muted-foreground mt-1">{categoryName}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">
            {showPercentage ? `${percentage}%` : `${completed}/${total}`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Complete</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 mb-4">
        <Progress value={percentage} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Skill {current + 1} of {total}</span>
          <span>{remaining} remaining</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Completed */}
        <div className="bg-background/50 backdrop-blur rounded-lg p-3 text-center">
          <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{completed}</div>
          <div className="text-xs text-muted-foreground">Done</div>
        </div>

        {/* In Progress */}
        <div className="bg-background/50 backdrop-blur rounded-lg p-3 text-center">
          <Loader2 className="h-5 w-5 text-blue-500 mx-auto mb-1 animate-spin" />
          <div className="text-xl font-bold text-foreground">1</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>

        {/* Remaining */}
        <div className="bg-background/50 backdrop-blur rounded-lg p-3 text-center">
          <Circle className="h-5 w-5 text-white font-medium mx-auto mb-1" />
          <div className="text-xl font-bold text-foreground">{remaining - 1}</div>
          <div className="text-xs text-muted-foreground">Left</div>
        </div>
      </div>

      {/* Estimated Time */}
      <div className="mt-4 pt-4 border-t border-primary/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Estimated time left:</span>
          <span className="font-semibold text-foreground">
            ~{Math.ceil((remaining * 30) / 60)} min
          </span>
        </div>
      </div>

      {/* Motivational Message */}
      {percentage >= 75 && (
        <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            🎉 Almost there! You're doing great!
          </p>
        </div>
      )}
      {percentage >= 50 && percentage < 75 && (
        <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            💪 Halfway done! Keep going!
          </p>
        </div>
      )}
      {percentage < 50 && percentage > 0 && (
        <div className="mt-3 bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
            ⭐ Great start! You've got this!
          </p>
        </div>
      )}
    </div>
  );
};

