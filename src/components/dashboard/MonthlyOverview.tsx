
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RoadmapWeek } from '@/types/roadmap';

interface MonthlyOverviewProps {
  weeks: RoadmapWeek[];
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ weeks }) => {
  const totalWeeks = weeks.length;
  const completedWeeks = 0; // This would be calculated based on actual progress
  const progressPercentage = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Track your progress across {totalWeeks} weeks
        </p>
        <Progress value={progressPercentage} className="mt-4" />
        <div className="mt-4 space-y-2">
          {weeks.map((week, index) => (
            <div key={week.week_number} className="flex justify-between items-center">
              <span className="text-sm">Week {week.week_number}</span>
              <span className="text-xs text-gray-500">{week.actions.length} tasks</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
