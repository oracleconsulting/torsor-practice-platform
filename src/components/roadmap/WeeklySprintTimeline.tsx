
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Clock, Target, CheckCircle, ChevronRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { sprintTrackingService } from '@/services/sprintTrackingService';

interface Week {
  week_number: number;
  title?: string;
  theme?: string;
  focus?: string;
  priority_level?: string;
  time_budget?: string;
  actions: any[];
  expected_outcome?: string;
}

interface WeeklySprintTimelineProps {
  weeks: Week[];
  groupId: string;
  currentWeek?: number;
}

export const WeeklySprintTimeline: React.FC<WeeklySprintTimelineProps> = ({
  weeks,
  groupId,
  currentWeek = 1
}) => {
  const [taskProgress, setTaskProgress] = useState<Record<string, boolean>>({});
  const [expandedWeek, setExpandedWeek] = useState<number | null>(currentWeek);
  const [checkingIn, setCheckingIn] = useState<Record<number, boolean>>({});

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'IMMEDIATE RELIEF': 'bg-red-500',
      'QUICK WIN': 'bg-yellow-500',
      'FOUNDATION': 'bg-blue-500',
      'STRATEGIC': 'bg-purple-500',
      'DELEGATION': 'bg-teal-500',
      'GROWTH': 'bg-green-500',
      'REVIEW & PLAN': 'bg-gray-500'
    };
    return colors[priority] || 'bg-purple-500';
  };

  const handleTaskToggle = async (weekNumber: number, taskIndex: number, taskTitle: string) => {
    const taskKey = `${weekNumber}-${taskIndex}`;
    const isCompleted = !taskProgress[taskKey];
    
    setTaskProgress(prev => ({
      ...prev,
      [taskKey]: isCompleted
    }));

    try {
      await sprintTrackingService.updateTaskStatus(
        `${weekNumber}-${taskIndex}`,
        isCompleted,
        `Week ${weekNumber} - ${taskTitle}`
      );
      console.log(`Task ${taskTitle} marked as ${isCompleted ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert optimistic update
      setTaskProgress(prev => ({
        ...prev,
        [taskKey]: !isCompleted
      }));
    }
  };

  const handleWeeklyCheckIn = async (weekNumber: number) => {
    setCheckingIn(prev => ({ ...prev, [weekNumber]: true }));
    
    try {
      // Get completed tasks for this week
      const weekTasks = weeks.find(w => w.week_number === weekNumber)?.actions || [];
      const completedTasks = weekTasks.filter((_, index) => 
        taskProgress[`${weekNumber}-${index}`]
      ).length;

      // Submit check-in data
      await sprintTrackingService.addFeedback(groupId, 'weekly_checkin', {
        title: `Week ${weekNumber} Check-in`,
        description: `Completed ${completedTasks}/${weekTasks.length} tasks`,
        impact_score: Math.round((completedTasks / weekTasks.length) * 5)
      });

      console.log(`Week ${weekNumber} check-in completed successfully`);
      alert(`Week ${weekNumber} check-in saved! You completed ${completedTasks}/${weekTasks.length} tasks.`);
    } catch (error) {
      console.error('Failed to submit check-in:', error);
      alert('Failed to save check-in. Please try again.');
    } finally {
      setCheckingIn(prev => ({ ...prev, [weekNumber]: false }));
    }
  };

  const getWeekProgress = (week: Week) => {
    const completedTasks = week.actions.filter((_, index) => 
      taskProgress[`${week.week_number}-${index}`]
    ).length;
    return (completedTasks / week.actions.length) * 100;
  };

  return (
    <div className="space-y-6" data-roadmap-details>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">12-Week Transformation Timeline</h2>
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 mb-2">Your Story</Badge>
          </div>
          <div className="text-center">
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 mb-2">12-Week Sprint</Badge>
          </div>
          <div className="text-center">
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 mb-2">ROI Impact</Badge>
          </div>
          <div className="text-center">
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/30 mb-2">Progress</Badge>
          </div>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {weeks.map((week, index) => {
          const isExpanded = expandedWeek === week.week_number;
          const isCurrent = week.week_number === currentWeek;
          const isPast = week.week_number < currentWeek;
          const progress = getWeekProgress(week);
          
          return (
            <motion.div
              key={week.week_number}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Week Number Circle */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  isCurrent ? 'bg-purple-500 ring-4 ring-purple-500/30' :
                  isPast ? 'bg-green-500' : 'bg-gray-600'
                }`}>
                  {week.week_number}
                </div>
              </div>

              <Card 
                className={`mt-4 cursor-pointer transition-all duration-300 ${
                  isCurrent ? 'ring-2 ring-purple-500 shadow-lg shadow-purple-500/20' : ''
                } ${
                  isExpanded ? 'bg-gray-800/90 border-purple-500/50' : 'bg-gray-900/80 border-gray-800'
                } backdrop-blur-sm hover:border-gray-700`}
                onClick={() => setExpandedWeek(isExpanded ? null : week.week_number)}
              >
                <CardContent className="p-4">
                  {/* Week Header */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-white text-lg mb-1">
                      {week.theme || week.title || `Week ${week.week_number}`}
                    </h3>
                    <p className="text-gray-300 text-sm mb-2">{week.focus}</p>
                    
                    {week.priority_level && (
                      <Badge className={`${getPriorityColor(week.priority_level)} text-white border-none mb-2`}>
                        {week.priority_level}
                      </Badge>
                    )}
                    
                    <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{week.time_budget || '20 hours'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{week.actions.length} tasks</span>
                      </div>
                    </div>

                    <Progress value={progress} className="h-2 mb-2" />
                    <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="space-y-4 border-t border-gray-700 pt-4">
                      {/* Tasks */}
                      <div>
                        <h4 className="font-semibold text-gray-300 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Week {week.week_number} Tasks
                        </h4>
                        <div className="space-y-2">
                          {week.actions.map((action, actionIndex) => {
                            const taskKey = `${week.week_number}-${actionIndex}`;
                            const isCompleted = taskProgress[taskKey] || false;
                            
                            return (
                              <div 
                                key={actionIndex} 
                                className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
                              >
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => handleTaskToggle(
                                    week.week_number, 
                                    actionIndex, 
                                    typeof action === 'string' ? action : action.title || action.action
                                  )}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm leading-relaxed ${
                                    isCompleted ? 'text-gray-400 line-through' : 'text-gray-200'
                                  }`}>
                                    {typeof action === 'string' ? action : action.title || action.action || action}
                                  </p>
                                  {(action.description || action.detail) && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      {action.description || action.detail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Expected Outcome */}
                      {week.expected_outcome && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <p className="text-sm text-green-300 flex items-start gap-2">
                            <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span><strong>Expected Outcome:</strong> {week.expected_outcome}</span>
                          </p>
                        </div>
                      )}

                      {/* Check-in Button */}
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWeeklyCheckIn(week.week_number);
                        }}
                        disabled={checkingIn[week.week_number]}
                      >
                        {checkingIn[week.week_number] ? 'Saving...' : 'Weekly Check-in'}
                        {isCurrent && <Zap className="w-4 h-4 ml-2" />}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
