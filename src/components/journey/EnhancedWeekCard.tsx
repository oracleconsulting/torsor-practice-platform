import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Target, CheckCircle, Circle, Star, 
  Sparkles, TrendingUp, AlertCircle, ChevronDown, ChevronUp,
  Brain, Users, Zap, Timer, Award, Edit, Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  task: string;
  time?: string;
  priority?: 'high' | 'medium' | 'low';
  board_member?: string;
  time_estimate?: string;
  completed?: boolean;
}

interface Week {
  week_number?: number;
  week?: number;
  theme: string;
  focus: string;
  priority_level?: string;
  time_budget?: string;
  actions?: Task[];
  tasks?: Task[];
  expected_outcome?: string;
  tools_to_use?: string[];
}

interface WeekProgress {
  tasks: Record<number, boolean>;
  notes: string;
  blockers: string;
  wins: string;
  actualHours?: number;
  energyLevel?: number;
}

interface EnhancedWeekCardProps {
  week: Week;
  isCurrentWeek: boolean;
  progress?: WeekProgress;
  onTaskToggle: (taskIndex: number) => void;
  onProgressUpdate: (updates: Partial<WeekProgress>) => void;
  onReflectionComplete?: () => void;
  className?: string;
}

// Theme icons mapping
const themeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'foundation': Brain,
  'momentum': TrendingUp,
  'optimization': Zap,
  'scale': Target,
  'team': Users,
  'systems': Timer,
  'growth': Sparkles,
  'default': Calendar
};

export const EnhancedWeekCard: React.FC<EnhancedWeekCardProps> = ({
  week,
  isCurrentWeek,
  progress = { tasks: {}, notes: '', blockers: '', wins: '' },
  onTaskToggle,
  onProgressUpdate,
  onReflectionComplete,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(isCurrentWeek);
  const [showReflection, setShowReflection] = useState(false);
  const [localProgress, setLocalProgress] = useState(progress);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Get theme icon
  const getThemeIcon = () => {
    const themeKey = (week.theme || '').toLowerCase();
    for (const [key, Icon] of Object.entries(themeIcons)) {
      if (themeKey.includes(key)) return Icon;
    }
    return themeIcons.default;
  };
  const ThemeIcon = getThemeIcon();

  // Handle both 'actions' and 'tasks' properties for backward compatibility
  const weekTasks = (week as any).tasks || week.actions || [];
  
  // Handle both 'week' and 'week_number' properties
  const weekNumber = week.week_number || (week as any).week || 1;
  
  // Calculate progress
  const completedTasks = Object.values(progress.tasks).filter(Boolean).length;
  const totalTasks = weekTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle task completion with celebration
  const handleTaskToggle = (taskIndex: number) => {
    const wasCompleted = progress.tasks[taskIndex];
    onTaskToggle(taskIndex);
    
    if (!wasCompleted) {
      // Celebrate completion
      toast.success('Task completed! 🎉');
      
      // Check if all tasks are completed
      const newCompletedCount = completedTasks + 1;
      if (newCompletedCount === totalTasks && totalTasks > 0) {
        setTimeout(() => {
          toast.success('Week completed! Amazing work! 🎊');
          setShowReflection(true);
        }, 500);
      }
    }
  };

  // Handle reflection save
  const handleReflectionSave = () => {
    if (localProgress.wins || localProgress.blockers || localProgress.notes) {
      onProgressUpdate({
        ...localProgress,
        actualHours: timeSpent / 3600
      });
      onReflectionComplete?.();
      setShowReflection(false);
      toast.success('Reflection saved!');
    } else {
      toast.error('Please add at least one reflection');
    }
  };

  // Priority color mapping
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
      <motion.div
        className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
          isCurrentWeek ? 'border-blue-500 shadow-lg' : 'border-gray-200'
        } ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Card Header */}
        <div 
          className={`p-6 rounded-t-2xl cursor-pointer transition-colors ${
            isCurrentWeek 
              ? 'bg-gradient-to-r from-blue-50 to-indigo-50' 
              : 'bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
          }`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <ThemeIcon className={`w-6 h-6 ${isCurrentWeek ? 'text-blue-600' : 'text-gray-600'}`} />
                <h3 className="text-xl font-bold text-gray-800">
                  Week {weekNumber}: {week.theme}
                </h3>
                {isCurrentWeek && (
                  <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full animate-pulse">
                    Current Week
                  </span>
                )}
              </div>
              <p className="text-gray-600">{week.focus}</p>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{week.time_budget || '2-4 hours'}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>{completedTasks}/{totalTasks} tasks</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  week.priority_level === 'high' ? 'bg-red-100 text-red-700' :
                  week.priority_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {week.priority_level || 'medium'} priority
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Progress Ring */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={progressPercentage === 100 ? '#10b981' : progressPercentage > 0 ? '#3b82f6' : '#e5e7eb'}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(progressPercentage / 100) * 176} 176`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-800">{progressPercentage}%</span>
                </div>
              </div>
              
              {/* Expand/Collapse Icon */}
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 ${
                  progressPercentage === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  progressPercentage > 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                  'bg-gray-300'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-gray-200"
            >
              <div className="p-6 space-y-6">
                {/* Time Tracker */}
                {isCurrentWeek && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-1">Time Tracker</h4>
                        <p className="text-2xl font-mono font-bold text-blue-600">{formatTime(timeSpent)}</p>
                      </div>
                      <button
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isTimerRunning 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isTimerRunning ? 'Stop' : 'Start'} Timer
                      </button>
                    </div>
                  </div>
                )}

                {/* Tasks List */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Tasks for This Week</h4>
                  <div className="space-y-2">
                    {weekTasks.map((task, idx) => (
                      <motion.div
                        key={idx}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                          progress.tasks[idx] 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <button
                          onClick={() => handleTaskToggle(idx)}
                          className="mt-0.5"
                        >
                          {progress.tasks[idx] ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                          )}
                        </button>
                        
                        <div className="flex-1">
                          <p className={`text-gray-800 ${progress.tasks[idx] ? 'line-through opacity-60' : ''}`}>
                            {task.task}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            {task.time && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-3 h-3" />
                                {task.time}
                              </span>
                            )}
                            {task.board_member && (
                              <span className="flex items-center gap-1 text-gray-500">
                                <Users className="w-3 h-3" />
                                {task.board_member}
                              </span>
                            )}
                            {task.priority && (
                              <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {progress.tasks[idx] && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-0.5"
                          >
                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Expected Outcome */}
                {week.expected_outcome && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-600" />
                      Expected Outcome
                    </h4>
                    <p className="text-gray-700">{week.expected_outcome}</p>
                  </div>
                )}

                {/* Tools to Use */}
                {week.tools_to_use && week.tools_to_use.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Recommended Tools</h4>
                    <div className="flex flex-wrap gap-2">
                      {week.tools_to_use.map((tool, idx) => (
                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Reflection */}
                {(isCurrentWeek || completedTasks > 0) && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">Weekly Reflection</h4>
                      <button
                        onClick={() => setShowReflection(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Add Reflection
                      </button>
                    </div>
                    
                    {(progress.wins || progress.blockers || progress.notes) && (
                      <div className="space-y-2 text-sm">
                        {progress.wins && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="font-medium text-green-800 mb-1">Wins:</p>
                            <p className="text-green-700">{progress.wins}</p>
                          </div>
                        )}
                        {progress.blockers && (
                          <div className="bg-red-50 rounded-lg p-3">
                            <p className="font-medium text-red-800 mb-1">Blockers:</p>
                            <p className="text-red-700">{progress.blockers}</p>
                          </div>
                        )}
                        {progress.notes && (
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="font-medium text-blue-800 mb-1">Notes:</p>
                            <p className="text-blue-700">{progress.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Reflection Modal */}
      <AnimatePresence>
        {showReflection && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowReflection(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Week {weekNumber} Reflection</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What were your wins this week? (3 max)
                  </label>
                  <textarea
                    value={localProgress.wins}
                    onChange={(e) => setLocalProgress({ ...localProgress, wins: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="e.g., Completed all priority tasks, Had great client meeting..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What challenges did you face?
                  </label>
                  <textarea
                    value={localProgress.blockers}
                    onChange={(e) => setLocalProgress({ ...localProgress, blockers: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="e.g., Tech issues, Time constraints..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key learnings & notes
                  </label>
                  <textarea
                    value={localProgress.notes}
                    onChange={(e) => setLocalProgress({ ...localProgress, notes: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="e.g., Need to delegate more, New tool works great..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Energy level this week
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setLocalProgress({ ...localProgress, energyLevel: level })}
                        className={`w-12 h-12 rounded-lg font-medium transition-all ${
                          localProgress.energyLevel === level
                            ? 'bg-blue-500 text-white transform scale-110'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">1 = Very Low, 5 = Very High</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleReflectionSave}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save Reflection
                </button>
                <button
                  onClick={() => setShowReflection(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Celebration */}
      <AnimatePresence>
        {progressPercentage === 100 && completedTasks === totalTasks && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 1,
                repeat: 3,
              }}
            >
              <Award className="w-32 h-32 text-yellow-500 drop-shadow-lg" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 