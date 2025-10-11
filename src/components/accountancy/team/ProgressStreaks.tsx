/**
 * ProgressStreaks Component
 * PROMPT 9: Gamification & Engagement Features
 * 
 * Visual display of activity streaks with motivation
 */

import React from 'react';
import { Flame, Calendar, Zap, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface StreakData {
  current: number;
  longest: number;
  type: 'assessment' | 'cpd' | 'learning';
  nextMilestone: number;
}

interface ProgressStreaksProps {
  streaks: StreakData[];
  totalDaysActive: number;
}

export const ProgressStreaks: React.FC<ProgressStreaksProps> = ({
  streaks,
  totalDaysActive
}) => {
  const getStreakColor = (days: number) => {
    if (days >= 30) return 'text-red-500';
    if (days >= 14) return 'text-orange-500';
    if (days >= 7) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getStreakMessage = (days: number) => {
    if (days === 0) return "Start your streak today!";
    if (days < 3) return "Keep it up!";
    if (days < 7) return "You're on fire!";
    if (days < 14) return "Amazing streak!";
    if (days < 30) return "Unstoppable!";
    return "Legendary dedication!";
  };

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <Calendar className="h-5 w-5" />;
      case 'cpd': return <Award className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Activity Streaks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {streaks.map((streak, index) => {
          const progress = (streak.current / streak.nextMilestone) * 100;
          const colorClass = getStreakColor(streak.current);

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={colorClass}>{getStreakIcon(streak.type)}</div>
                  <span className="font-medium capitalize">{streak.type}</span>
                </div>
                <Badge variant={streak.current >= 7 ? 'default' : 'secondary'}>
                  <Flame className={`h-3 w-3 mr-1 ${colorClass}`} />
                  {streak.current} days
                </Badge>
              </div>

              <Progress value={progress} className="h-2" />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{getStreakMessage(streak.current)}</span>
                <span>{streak.nextMilestone - streak.current} to next milestone</span>
              </div>

              {streak.longest > streak.current && (
                <div className="text-xs text-muted-foreground">
                  🏆 Personal best: {streak.longest} days
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {totalDaysActive}
            </div>
            <div className="text-sm text-muted-foreground">
              Total days active
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
