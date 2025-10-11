/**
 * OnboardingChecklist Component
 * PROMPT 6: Onboarding Checklist System
 * 
 * Task list with checkboxes and skip options
 */

import React from 'react';
import { Check, X, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedMinutes: number;
  canSkip: boolean;
  skipReason?: string;
}

interface OnboardingChecklistProps {
  items: ChecklistItem[];
  onToggleItem: (itemId: string) => void;
  onSkipItem: (itemId: string) => void;
  currentStepNumber: number;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
  items,
  onToggleItem,
  onSkipItem,
  currentStepNumber
}) => {
  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Step {currentStepNumber} Checklist</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {Math.round(completionPercentage)}%
          </div>
          <div className="text-xs text-muted-foreground">Progress</div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className={`transition-all ${
              item.completed
                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                : 'hover:shadow-md'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => onToggleItem(item.id)}
                    className="h-5 w-5"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            item.completed
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.required && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>~{item.estimatedMinutes} min</span>
                        </div>
                        {item.completed && (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <Check className="h-3 w-3" />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!item.completed && item.canSkip && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onSkipItem(item.id)}
                              className="flex-shrink-0"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Skip
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs max-w-xs">
                              {item.skipReason || 'Skip this task if not applicable to you'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      {totalCount > 0 && completedCount < totalCount && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-100">
              <p className="font-medium">Tips for this step:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Complete required tasks before moving forward</li>
                <li>You can skip optional tasks marked with "Skip" button</li>
                <li>Save your progress at any time</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                All tasks completed! 🎉
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-0.5">
                You can now proceed to the next step.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

