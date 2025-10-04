// src/components/dashboard/RoadmapProgressTracker.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Zap,
  Calendar,
  RotateCcw,
  TrendingUp,
  Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface RoadmapProgressTrackerProps {
  roadmap: any;
  groupId: string;
}

interface TaskProgress {
  weekNumber: number;
  taskIndex: number;
  completed: boolean;
  completedAt?: string;
  rolledOver?: boolean;
}

const RoadmapProgressTracker: React.FC<RoadmapProgressTrackerProps> = ({ roadmap, groupId }) => {
  const navigate = useNavigate();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1])); // Start with week 1 expanded
  const [taskProgress, setTaskProgress] = useState<Record<string, TaskProgress>>({});
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);

  // Calculate what week we're in based on roadmap start date
  useEffect(() => {
    const calculateCurrentWeek = () => {
      // For now, we'll use a simple calculation. In production, you'd store the start date
      const startDate = new Date(roadmap?.metadata?.start_date || new Date());
      const now = new Date();
      const weeksSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
      setCurrentWeek(Math.min(Math.max(1, weeksSinceStart), 12));
    };

    calculateCurrentWeek();
  }, [roadmap]);

  // Load saved progress from database - UPDATED to handle missing columns
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('sprint_progress')
          .select('*')
          .eq('group_id', groupId)
          .eq('sprint_number', 1); // Sprint 1 = 12-week roadmap

        if (data) {
          const progressMap: Record<string, TaskProgress> = {};
          data.forEach(task => {
            // Use task_id as the key since week_number and task_index don't exist yet
            const key = task.task_id;
            progressMap[key] = {
              weekNumber: 1, // Default values for now
              taskIndex: 0,
              completed: task.completed,
              completedAt: task.completed_date,
              rolledOver: false // Default value since column doesn't exist yet
            };
          });
          setTaskProgress(progressMap);
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      loadProgress();
    }
  }, [groupId]);

  // Get weeks with rolled-over tasks - SIMPLIFIED for now
  const getWeekWithRollovers = (weekNumber: number) => {
    const week = roadmap.three_month_sprint.weeks[weekNumber - 1];
    if (!week) return null;

    // For now, just return the week as-is since we don't have rollover tracking yet
    return {
      ...week,
      actions: week.actions.map((a: any, i: number) => ({ ...a, originalIndex: i }))
    };
  };

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  // SIMPLIFIED toggle task function
  const toggleTask = async (weekNumber: number, taskIndex: number, isRollover: boolean = false, originalWeek?: number, originalIndex?: number) => {
    const taskKey = `${weekNumber}-${taskIndex}`;
    const currentStatus = taskProgress[taskKey]?.completed || false;
    const newStatus = !currentStatus;

    // Update local state
    setTaskProgress(prev => ({
      ...prev,
      [taskKey]: {
        weekNumber: weekNumber,
        taskIndex: taskIndex,
        completed: newStatus,
        completedAt: newStatus ? new Date().toISOString() : undefined,
        rolledOver: false
      }
    }));

    // Save to database - SIMPLIFIED for existing schema
    try {
      if (newStatus) {
        await supabase.from('sprint_progress').upsert({
          group_id: groupId,
          sprint_number: 1,
          task_title: roadmap.three_month_sprint.weeks[weekNumber - 1].actions[taskIndex],
          task_description: '',
          completed: true,
          completed_date: new Date().toISOString()
        });
      } else {
        // For now, we can't easily delete without proper keys, so just update
        console.log('Would delete task, but keeping for now due to schema limitations');
      }

      toast.success(newStatus ? 'Task completed! 🎉' : 'Task unchecked');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to save progress');
    }
  };

  // Calculate overall progress
  const calculateProgress = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    roadmap.three_month_sprint.weeks.forEach((week: any, weekIndex: number) => {
      week.actions.forEach((_: any, actionIndex: number) => {
        totalTasks++;
        if (taskProgress[`${weekIndex + 1}-${actionIndex}`]?.completed) {
          completedTasks++;
        }
      });
    });

    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  };

  // Get week status - SIMPLIFIED
  const getWeekStatus = (weekNumber: number) => {
    const week = roadmap.three_month_sprint.weeks[weekNumber - 1];
    if (!week) return { completed: 0, total: 0, hasRollovers: false };

    let completed = 0;

    // Count completed tasks for this week
    week.actions.forEach((_: any, index: number) => {
      if (taskProgress[`${weekNumber}-${index}`]?.completed) {
        completed++;
      }
    });

    return { completed, total: week.actions.length, hasRollovers: false };
  };

  const progressPercentage = calculateProgress();

  if (loading) {
    return <div className="animate-pulse bg-gray-800 rounded-lg h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Overall Progress</h3>
              <p className="text-gray-400 text-sm">Week {currentWeek} of 12</p>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Object.values(taskProgress).filter(t => t.completed).length}
              </div>
              <p className="text-xs text-gray-400">Tasks Completed</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {Object.values(taskProgress).filter(t => !t.completed && t.rolledOver).length}
              </div>
              <p className="text-xs text-gray-400">Rolled Over</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {currentWeek}
              </div>
              <p className="text-xs text-gray-400">Current Week</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => navigate('/roadmap/full')}
          className="bg-gray-800 hover:bg-gray-700 text-white"
        >
          <Calendar className="w-4 h-4 mr-2" />
          View Full Roadmap
        </Button>
        <Button
          onClick={() => navigate('/roadmap/quick-wins')}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg text-white"
        >
          <Zap className="w-4 h-4 mr-2" />
          Quick Wins
        </Button>
        <Button
          onClick={() => setExpandedWeeks(new Set(Array.from({ length: 12 }, (_, i) => i + 1)))}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:text-white"
        >
          <Target className="w-4 h-4 mr-2" />
          Expand All
        </Button>
      </div>

      {/* Weekly Progress - SIMPLIFIED */}
      <div className="space-y-3">
        {roadmap.three_month_sprint.weeks.map((week: any, index: number) => {
          const weekNumber = index + 1;
          const isExpanded = expandedWeeks.has(weekNumber);
          const isCurrent = weekNumber === currentWeek;
          const isPast = weekNumber < currentWeek;
          const weekWithRollovers = getWeekWithRollovers(weekNumber);
          const weekStatus = getWeekStatus(weekNumber);
          
          return (
            <motion.div
              key={weekNumber}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`bg-gray-900/80 backdrop-blur-sm border ${
                isCurrent ? 'border-purple-500' : 
                isPast ? 'border-gray-700' : 
                'border-gray-800'
              }`}>
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleWeek(weekNumber)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button className="p-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex items-center space-x-3">
                        {isCurrent && (
                          <div className="animate-pulse h-2 w-2 bg-purple-500 rounded-full" />
                        )}
                        <div>
                          <h4 className="text-white font-semibold">
                            Week {weekNumber}: {week.theme}
                          </h4>
                          <p className="text-gray-400 text-sm">{week.focus}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">
                          {weekStatus.completed}/{weekStatus.total}
                        </span>
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${(weekStatus.completed / weekStatus.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{week.time_budget}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && weekWithRollovers && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-800"
                    >
                      <div className="p-4 space-y-3">
                        {weekWithRollovers.actions.map((action: any, actionIndex: number) => {
                          const taskKey = `${weekNumber}-${actionIndex}`;
                          const isCompleted = taskProgress[taskKey]?.completed || false;

                          return (
                            <motion.div
                              key={actionIndex}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: actionIndex * 0.05 }}
                              className={`flex items-start space-x-3 p-3 rounded-lg ${
                                isCompleted ? 'bg-green-900/20' : 'bg-gray-800/50'
                              }`}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTask(weekNumber, actionIndex);
                                }}
                                className="mt-0.5"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 hover:text-purple-400" />
                                )}
                              </button>
                              
                              <div className="flex-1">
                                <p className={`text-sm ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                  {action.task || action}
                                </p>
                                {action.time_estimate && (
                                  <div className="flex items-center space-x-1 mt-1 text-xs text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{action.time_estimate}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Motivational Message */}
      {currentWeek <= 12 && roadmap.three_month_sprint.weeks[currentWeek - 1] && (
        <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 backdrop-blur-sm border-purple-500/30">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">This Week's Focus</h3>
            </div>
            <p className="text-gray-200">
              {roadmap.three_month_sprint.weeks[currentWeek - 1].focus}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RoadmapProgressTracker;
