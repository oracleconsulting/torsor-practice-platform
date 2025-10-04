import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Target, 
  Rocket, 
  Calendar,
  CheckCircle,
  TrendingUp,
  Clock,
  MessageSquare,
  Phone,
  Sparkles,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Heart,
  Plane,
  Users,
  Home,
  Trophy,
  PoundSterling
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RoadmapDisplayProps {
  roadmap: any;
  groupId: string;
}

const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({ roadmap, groupId }) => {
  const [activeTab, setActiveTab] = useState('story');
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);
  const [taskProgress, setTaskProgress] = useState<Record<string, boolean>>({});
  const [taskComments, setTaskComments] = useState<Record<string, { good: string; bad: string }>>({});
  const [savingProgress, setSavingProgress] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  // Load existing progress on mount
  useEffect(() => {
    loadProgress();
  }, [groupId]);

  // Calculate overall progress when tasks change
  useEffect(() => {
    calculateOverallProgress();
  }, [taskProgress]);

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('sprint_progress')
        .select('*')
        .eq('group_id', groupId);

      if (error) throw error;

      if (data) {
        const progressMap: Record<string, boolean> = {};
        const commentsMap: Record<string, { good: string; bad: string }> = {};
        
        data.forEach(item => {
          if (item.task_id) {
            progressMap[item.task_id] = item.completed || false;
            if (item.comments) {
              commentsMap[item.task_id] = item.comments;
            }
          }
        });
        
        setTaskProgress(progressMap);
        setTaskComments(commentsMap);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const calculateOverallProgress = () => {
    const totalTasks = getTotalTasks();
    const completedTasks = Object.values(taskProgress).filter(completed => completed).length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    setOverallProgress(progress);
  };

  const getTotalTasks = () => {
    if (!roadmap?.three_month_sprint?.weeks) return 0;
    return roadmap.three_month_sprint.weeks.reduce((total: number, week: any) => 
      total + (week.actions?.length || 0), 0
    );
  };

  const toggleWeekExpansion = (weekNumber: number) => {
    setExpandedWeeks(prev => 
      prev.includes(weekNumber) 
        ? prev.filter(w => w !== weekNumber)
        : [...prev, weekNumber]
    );
  };

  const updateTaskProgress = async (taskId: string, completed: boolean, taskTitle: string, weekNumber: number) => {
    setTaskProgress(prev => ({ ...prev, [taskId]: completed }));
    setSavingProgress(true);

    try {
      const { error } = await supabase
        .from('sprint_progress')
        .upsert({
          group_id: groupId,
          task_id: taskId,
          task_title: taskTitle,
          completed: completed,
          sprint_number: weekNumber,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast({
        title: completed ? "Task completed!" : "Task unchecked",
        description: "Your progress has been saved.",
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error saving progress",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSavingProgress(false);
    }
  };

  const updateTaskComments = async (taskId: string, comments: { good: string; bad: string }) => {
    setTaskComments(prev => ({ ...prev, [taskId]: comments }));

    try {
      const { error } = await supabase
        .from('sprint_progress')
        .update({ comments: comments })
        .eq('task_id', taskId)
        .eq('group_id', groupId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving comments:', error);
    }
  };

  // Extract data from roadmap - CORRECTED PATHS
  const narrative = roadmap?.narrative || {};
  const transformationStory = narrative.transformation_story || {};
  const header = roadmap?.header || {};
  const weeks = roadmap?.three_month_sprint?.weeks || [];
  const sixMonthStretch = roadmap?.six_month_stretch || {};
  const display = roadmap?.display || {};
  const summary = roadmap?.summary || {};
  const immediateValue = roadmap?.immediate_value || {};
  const roiAnalysis = roadmap?.roi_analysis || {};
  const fiveYearPossibility = roadmap?.five_year_possibility || {};

  // Story Tab Content
  const StoryTab = () => (
    <div className="space-y-6">
      {/* Journey Overview */}
      <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 overflow-hidden">
        <div className="relative p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/10"></div>
          
          <div className="relative space-y-6">
            {/* Header */}
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Your Transformation Journey
              </h2>
              <p className="text-gray-400">
                {header.tagline || "Your journey to business transformation"}
              </p>
            </div>

            {/* Personal Understanding - Using the correct path */}
            {transformationStory.opening && (
              <div className="bg-black/30 rounded-xl p-6">
                <p className="text-lg text-gray-300 leading-relaxed italic">
                  "{transformationStory.opening}"
                </p>
              </div>
            )}

            {/* Vision Breakdown */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-700/30">
                <Target className="w-8 h-8 text-purple-400 mb-3" />
                <h4 className="font-semibold text-purple-300 mb-2">5-Year Vision</h4>
                <p className="text-gray-300 text-sm">
                  {fiveYearPossibility.dare_to_dream ? "£500k+ business on 15 hours/week" : "Building a sustainable business"}
                </p>
              </div>

              <div className="bg-pink-900/20 rounded-xl p-6 border border-pink-700/30">
                <Rocket className="w-8 h-8 text-pink-400 mb-3" />
                <h4 className="font-semibold text-pink-300 mb-2">6-Month Shift</h4>
                <p className="text-gray-300 text-sm">
                  {sixMonthStretch.vision_statement ? "£15k+/month with automated systems" : "From chaos to control"}
                </p>
              </div>

              <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-700/30">
                <Calendar className="w-8 h-8 text-blue-400 mb-3" />
                <h4 className="font-semibold text-blue-300 mb-2">3-Month Sprint</h4>
                <p className="text-gray-300 text-sm">{summary.quickWin || "Your focused 12-week action plan"}</p>
              </div>
            </div>

            {/* Journey Sections - Using correct paths */}
            <div className="space-y-6">
              {transformationStory.current_reality && (
                <div>
                  <div className="flex items-center gap-2 text-orange-400 mb-3">
                    <MapPin className="w-5 h-5" />
                    <h3 className="text-xl font-semibold">Where You Are Now</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{transformationStory.current_reality}</p>
                </div>
              )}

              {transformationStory.journey_ahead && (
                <div>
                  <div className="flex items-center gap-2 text-green-400 mb-3">
                    <Target className="w-5 h-5" />
                    <h3 className="text-xl font-semibold">Where You're Heading</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{transformationStory.journey_ahead}</p>
                </div>
              )}

              {transformationStory.why_this_order && (
                <div>
                  <div className="flex items-center gap-2 text-blue-400 mb-3">
                    <Rocket className="w-5 h-5" />
                    <h3 className="text-xl font-semibold">How We'll Get You There</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{transformationStory.why_this_order}</p>
                </div>
              )}

              {/* 5-Year Vision Details */}
              {fiveYearPossibility.dare_to_dream && (
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-700/30">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">The 5-Year Dream</h3>
                  <p className="text-gray-300 leading-relaxed mb-4">{fiveYearPossibility.dare_to_dream}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {fiveYearPossibility.lifestyle_vision && (
                      <div className="space-y-2">
                        <h4 className="text-purple-400 font-medium mb-2">Life Goals</h4>
                        <p className="text-gray-300 text-sm">{fiveYearPossibility.lifestyle_vision}</p>
                      </div>
                    )}
                    
                    {fiveYearPossibility.business_legacy && (
                      <div className="space-y-2">
                        <h4 className="text-pink-400 font-medium mb-2">Business Legacy</h4>
                        <p className="text-gray-300 text-sm">{fiveYearPossibility.business_legacy}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Support and Promise */}
              {(transformationStory.support_available || transformationStory.commitment_required) && (
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-700/30">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">Our Promise to You</h3>
                  {transformationStory.support_available && (
                    <p className="text-gray-300 leading-relaxed mb-2">{transformationStory.support_available}</p>
                  )}
                  {transformationStory.commitment_required && (
                    <p className="text-gray-300 leading-relaxed">{transformationStory.commitment_required}</p>
                  )}
                  <p className="text-right text-purple-400 mt-4 font-medium">— The Oracle Team</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Sprint Tab Content
  const SprintTab = () => (
    <div className="space-y-6">
      {/* Sprint Overview */}
      <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">12-Week Sprint Plan</h3>
          <Badge variant="outline" className="text-purple-400 border-purple-400">
            {header.time_commitment || "20 hours/week"}
          </Badge>
        </div>
        <Progress value={overallProgress} className="h-3 mb-2" />
        <p className="text-gray-400 text-sm">{overallProgress}% Complete</p>
      </Card>

      {/* Weekly Breakdown */}
      <div className="space-y-4">
        {weeks.map((week: any, index: number) => {
          const weekNumber = week.week_number || week.week || index + 1;
          const isExpanded = expandedWeeks.includes(weekNumber);
          
          // Parse tasks from different possible formats
          let weekTasks: any[] = [];
          if (week.tasks && Array.isArray(week.tasks)) {
            // Properly structured tasks
            weekTasks = week.tasks;
          } else if (week.actions && Array.isArray(week.actions)) {
            // Legacy actions format - convert to task objects
            weekTasks = week.actions.map((action: any, idx: number) => {
              if (typeof action === 'string') {
                // Parse string format
                let taskTitle = action;
                let taskTime = '1 hour';
                
                // Extract time if present (e.g., "[2 hours]")
                const timeMatch = action.match(/\[([^\]]+)\]/);
                if (timeMatch) {
                  taskTime = timeMatch[1];
                  taskTitle = action.replace(timeMatch[0], '').trim();
                }
                
                // Extract title before colon if present
                const colonIndex = taskTitle.indexOf(':');
                if (colonIndex > 0 && colonIndex < 50) {
                  const fullDescription = taskTitle;
                  taskTitle = taskTitle.substring(0, colonIndex).trim();
                  return {
                    id: `week-${weekNumber}-task-${idx}`,
                    title: taskTitle,
                    description: fullDescription.substring(colonIndex + 1).trim(),
                    time: taskTime,
                    priority: week.priority_level === 'IMMEDIATE RELIEF' ? 'high' : 'medium'
                  };
                }
                
                return {
                  id: `week-${weekNumber}-task-${idx}`,
                  title: taskTitle,
                  description: '',
                  time: taskTime,
                  priority: 'medium'
                };
              } else {
                // Already an object
                return {
                  id: action.id || `week-${weekNumber}-task-${idx}`,
                  title: action.title || action.task || 'Task',
                  description: action.description || action.specific_action || '',
                  time: action.time || action.timeEstimate || '1 hour',
                  priority: action.priority || 'medium',
                  board_member: action.board_member
                };
              }
            });
          }
          
          const completedTasks = weekTasks.filter((_: any, taskIndex: number) => 
            taskProgress[`week-${weekNumber}-task-${taskIndex}`]
          ).length;

          return (
            <Card key={weekNumber} className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 overflow-hidden">
              <div 
                className="p-6 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleWeekExpansion(weekNumber)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-purple-400 font-bold">{weekNumber}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{week.theme || `Week ${weekNumber}`}</h4>
                      <p className="text-gray-400 text-sm">{week.focus || 'Sprint Focus'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={`${week.priority_level === 'IMMEDIATE RELIEF' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>
                      {week.priority_level || 'MEDIUM'}
                    </Badge>
                    <span className="text-gray-400 text-sm">{completedTasks}/{weekTasks.length} tasks</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-gray-800"
                  >
                    <div className="p-6 space-y-4">
                      {/* Week Details */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-1">Time Budget</p>
                          <p className="text-white font-medium">{week.time_budget || 'Flexible'}</p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <p className="text-gray-400 text-sm mb-1">Expected Outcome</p>
                          <p className="text-white font-medium">{week.expected_outcome || 'Progress toward goals'}</p>
                        </div>
                      </div>

                      {/* Tasks */}
                      <div className="space-y-3">
                        {weekTasks.map((task: any, taskIndex: number) => {
                          const taskId = task.id || `week-${weekNumber}-task-${taskIndex}`;
                          const isCompleted = taskProgress[taskId] || false;
                          const comments = taskComments[taskId] || { good: '', bad: '' };

                          return (
                            <div key={taskId} className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={(checked) => 
                                    updateTaskProgress(taskId, checked as boolean, task.title || task, weekNumber)
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <label className={`block cursor-pointer ${isCompleted ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                    <span className="font-medium">{task.title || task}</span>
                                    {task.board_member && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {task.board_member}
                                      </Badge>
                                    )}
                                  </label>
                                  {task.description && (
                                    <p className="text-gray-400 text-sm mt-1">{task.description}</p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="text-gray-500 text-xs flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {task.time || task.timeEstimate || '1 hour'}
                                    </span>
                                    {task.priority && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${
                                          task.priority === 'high' ? 'text-red-400 border-red-400' : 
                                          task.priority === 'medium' ? 'text-yellow-400 border-yellow-400' : 
                                          'text-green-400 border-green-400'
                                        }`}
                                      >
                                        {task.priority}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Comments Section */}
                              {isCompleted && (
                                <div className="ml-7 space-y-2">
                                  <div>
                                    <label className="text-green-400 text-sm mb-1 block">What went well?</label>
                                    <Textarea
                                      value={comments.good}
                                      onChange={(e) => updateTaskComments(taskId, { ...comments, good: e.target.value })}
                                      placeholder="Share your wins..."
                                      className="bg-gray-900/50 border-gray-700 text-gray-300 min-h-[60px]"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-red-400 text-sm mb-1 block">What was challenging?</label>
                                    <Textarea
                                      value={comments.bad}
                                      onChange={(e) => updateTaskComments(taskId, { ...comments, bad: e.target.value })}
                                      placeholder="What could be improved..."
                                      className="bg-gray-900/50 border-gray-700 text-gray-300 min-h-[60px]"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Touch Base CTA */}
      <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/30 p-6">
        <div className="flex items-center gap-4 mb-4">
          <Phone className="w-8 h-8 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Need Support? Touch Base with an Advisor</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Feeling stuck or need guidance? Book a 30 or 60-minute call with one of our expert advisors. 
          Get personalized support to overcome obstacles and stay on track.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-400 font-semibold">From £200/hour</p>
            <p className="text-gray-400 text-sm">Save thousands vs traditional consulting</p>
          </div>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            onClick={() => window.open('https://calendly.com/your-link', '_blank')}
          >
            Book a Call
          </Button>
        </div>
      </Card>
    </div>
  );

  // ROI Tab Content  
  const ROITab = () => {
    return (
      <div className="space-y-6">
        <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 p-8">
          <div className="text-center mb-8">
            <TrendingUp className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Expected Return on Investment</h2>
            <p className="text-gray-400">Based on your current metrics and industry benchmarks</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-900/20 rounded-xl p-6 border border-green-700/30 text-center">
              <p className="text-4xl font-bold text-green-400 mb-2">
                {roiAnalysis.total_annual_value || '£25k+'}
              </p>
              <p className="text-gray-400">Annual Value Potential</p>
            </div>
            <div className="bg-blue-900/20 rounded-xl p-6 border border-blue-700/30 text-center">
              <p className="text-4xl font-bold text-blue-400 mb-2">
                {immediateValue.potential_time_saved || '5 hours'}
              </p>
              <p className="text-gray-400">Time Saved This Week</p>
            </div>
            <div className="bg-purple-900/20 rounded-xl p-6 border border-purple-700/30 text-center">
              <p className="text-4xl font-bold text-purple-400 mb-2">
                {immediateValue.potential_money_saved || '£2-3k'}
              </p>
              <p className="text-gray-400">Money Saved This Month</p>
            </div>
          </div>

          {roiAnalysis.growth_opportunities && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Growth Opportunities</h3>
              {Object.entries(roiAnalysis.growth_opportunities).map(([key, value]) => (
                <div key={key} className="bg-gray-800/50 rounded-lg p-4 flex justify-between items-center">
                  <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className="text-green-400 font-semibold">{value as string}</span>
                </div>
              ))}
            </div>
          )}

          {immediateValue.this_week_quick_win && (
            <div className="mt-6 bg-gradient-to-br from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-700/30">
              <h3 className="text-lg font-semibold text-green-300 mb-3">This Week's Quick Win</h3>
              <p className="text-gray-300">{immediateValue.this_week_quick_win}</p>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // Progress Tab Content
  const ProgressTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 p-8">
        <div className="text-center mb-8">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Your Progress</h2>
          <p className="text-gray-400">Track your transformation journey</p>
        </div>

        <div className="space-y-6">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Overall Completion</span>
              <span className="text-green-400 font-semibold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-4" />
          </div>

          {/* Week by Week Progress */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Weekly Progress</h3>
            {weeks.map((week: any, index: number) => {
              const weekNumber = week.week_number || index + 1;
              const weekTasks = week.actions || [];
              const completedTasks = weekTasks.filter((_: any, taskIndex: number) => 
                taskProgress[`week-${weekNumber}-task-${taskIndex}`]
              ).length;
              const weekProgress = weekTasks.length > 0 ? Math.round((completedTasks / weekTasks.length) * 100) : 0;

              return (
                <div key={weekNumber} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Week {weekNumber}: {week.theme}</span>
                    <span className="text-green-400 text-sm">{weekProgress}%</span>
                  </div>
                  <Progress value={weekProgress} className="h-2" />
                </div>
              );
            })}
          </div>

          {/* Insights from Comments */}
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-purple-700/30">
            <h3 className="text-lg font-semibold text-purple-300 mb-3">
              <MessageSquare className="inline w-5 h-5 mr-2" />
              Your Insights
            </h3>
            <p className="text-gray-300 mb-4">
              Your comments and reflections are invaluable for refining your next 90-day roadmap. 
              Keep documenting what works and what doesn't!
            </p>
            <Button 
              variant="outline" 
              className="border-purple-500 text-purple-400 hover:bg-purple-900/20"
              onClick={() => setActiveTab('sprint')}
            >
              Review Your Comments
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/60 backdrop-blur-sm border border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Your 90-Day Roadmap</h2>
            </div>
            <Badge variant="outline" className="text-orange-400 border-orange-400">
              12 Weeks
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full bg-gray-800/50">
              <TabsTrigger value="story" className="data-[state=active]:bg-purple-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Your Story
              </TabsTrigger>
              <TabsTrigger value="sprint" className="data-[state=active]:bg-purple-600">
                <Calendar className="w-4 h-4 mr-2" />
                12-Week Sprint
              </TabsTrigger>
              <TabsTrigger value="roi" className="data-[state=active]:bg-purple-600">
                <TrendingUp className="w-4 h-4 mr-2" />
                ROI Impact
              </TabsTrigger>
              <TabsTrigger value="progress" className="data-[state=active]:bg-purple-600">
                <CheckCircle className="w-4 h-4 mr-2" />
                Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="story">
              <StoryTab />
            </TabsContent>
            <TabsContent value="sprint">
              <SprintTab />
            </TabsContent>
            <TabsContent value="roi">
              <ROITab />
            </TabsContent>
            <TabsContent value="progress">
              <ProgressTab />
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};

export default RoadmapDisplay;