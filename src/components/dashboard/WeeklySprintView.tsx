
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TaskProgress, Week } from '@/types/roadmap';
import { WeeklyCheckIn } from '@/components/feedback/WeeklyCheckIn';

interface WeeklySprintViewProps {
  weeks: Week[];
  expandedWeek: number | null;
  onToggleWeek: (weekNumber: number) => void;
  taskProgress: TaskProgress[];
  onTaskToggle: (weekNumber: number, taskIndex: number) => void;
  groupId: string;
}

export const WeeklySprintView = ({ 
  weeks, 
  expandedWeek, 
  onToggleWeek, 
  taskProgress, 
  onTaskToggle,
  groupId 
}: WeeklySprintViewProps) => {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInWeek, setCheckInWeek] = useState<number>(0);
  const [checkInTasks, setCheckInTasks] = useState<any[]>([]);

  const getPriorityColor = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const isTaskComplete = (weekNumber: number, taskIndex: number): boolean => {
    const weekProgress = taskProgress.find((wp) => wp.weekNumber === weekNumber);
    return weekProgress ? weekProgress.tasks[taskIndex] : false;
  };

  const handleWeeklyCheckIn = (week: Week) => {
    setCheckInWeek(week.week_number);
    setCheckInTasks(week.actions || []);
    setShowCheckIn(true);
  };

  return (
    <div className="space-y-4">
      {weeks.map((week) => (
        <motion.div
          key={week.week_number}
          layout
          className="overflow-hidden rounded-lg border"
        >
          <Card className={`${getPriorityColor(week.priority_level || 'medium')} transition-all duration-200 hover:shadow-lg`}>
            <CardHeader className="flex items-center justify-between">
              <button
                onClick={() => onToggleWeek(week.week_number)}
                className="flex flex-1 items-center justify-between px-4 py-3 text-left focus:outline-none"
              >
                <CardTitle className="text-lg font-semibold">
                  Week {week.week_number}
                </CardTitle>
                {expandedWeek === week.week_number ? (
                  <ChevronUp className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </CardHeader>
            {expandedWeek === week.week_number && (
              <CardContent className="pt-0">
                <ul className="mt-4 space-y-3">
                  {week.actions && week.actions.length > 0 ? (
                    week.actions.map((task, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-3"
                      >
                        <div className="flex items-center">
                          <button
                            onClick={() => onTaskToggle(week.week_number, index)}
                            className="mr-3 focus:outline-none"
                          >
                            {isTaskComplete(week.week_number, index) ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                          <span>{typeof task === 'string' ? task : task.title || task}</span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No tasks for this week.</li>
                  )}
                </ul>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button
                    onClick={() => handleWeeklyCheckIn(week)}
                    variant="outline"
                    size="sm"
                    className="w-full text-oracle-navy border-oracle-navy hover:bg-oracle-navy hover:text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Weekly Check-In
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      ))}

      <WeeklyCheckIn
        open={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        groupId={groupId}
        weekNumber={checkInWeek}
        tasks={checkInTasks}
      />
    </div>
  );
};
