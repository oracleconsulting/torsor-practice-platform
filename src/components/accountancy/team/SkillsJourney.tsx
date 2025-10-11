/**
 * SkillsJourney Component
 * PROMPT 9: Gamification & Engagement Features
 * 
 * Visual progress map showing skills development journey
 */

import React from 'react';
import { Check, Circle, Lock, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface JourneyMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  locked: boolean;
  points: number;
  date?: string;
}

interface SkillsJourneyProps {
  milestones: JourneyMilestone[];
  currentLevel: number;
  nextLevel: number;
  progressPercentage: number;
}

export const SkillsJourney: React.FC<SkillsJourneyProps> = ({
  milestones,
  currentLevel,
  nextLevel,
  progressPercentage
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Your Skills Journey
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Level Progress */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Level {currentLevel}</span>
            <span className="text-sm font-medium">Level {nextLevel}</span>
          </div>
          <div className="h-3 bg-white dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">
              {progressPercentage}% to next level
            </span>
          </div>
        </div>

        {/* Journey Path */}
        <div className="relative space-y-4">
          {/* Connecting Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-gray-300" />

          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="relative flex gap-4">
              {/* Milestone Icon */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  milestone.completed
                    ? 'bg-green-500 text-white'
                    : milestone.locked
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                    : 'bg-blue-500 text-white animate-pulse'
                }`}
              >
                {milestone.completed && <Check className="h-5 w-5" />}
                {!milestone.completed && !milestone.locked && <Circle className="h-5 w-5" />}
                {milestone.locked && <Lock className="h-4 w-4" />}
              </div>

              {/* Milestone Content */}
              <div className="flex-1 pb-4">
                <div className={`p-4 rounded-lg border ${
                  milestone.completed
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : milestone.locked
                    ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-semibold">{milestone.title}</h4>
                    <Badge variant={milestone.completed ? 'default' : 'secondary'}>
                      <Star className="h-3 w-3 mr-1" />
                      {milestone.points} pts
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  {milestone.completed && milestone.date && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                      ✓ Completed on {new Date(milestone.date).toLocaleDateString()}
                    </div>
                  )}
                  {milestone.locked && (
                    <div className="text-xs text-gray-500 mt-2">
                      🔒 Unlock previous milestones first
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
