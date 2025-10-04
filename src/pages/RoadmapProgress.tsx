
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentProgress } from '@/hooks/useAssessmentProgress';
import { sprintTrackingService } from '@/services/sprintTrackingService';
import { 
  Calendar, Target, TrendingUp, Clock, Plus, 
  CheckCircle, ArrowLeft, Filter, MessageSquare
} from 'lucide-react';
import { SprintFeedbackModal } from '@/components/roadmap/SprintFeedbackModal';
import { TaskCard } from '@/components/roadmap/TaskCard';
import { SprintOverview } from '@/components/roadmap/SprintOverview';

interface SprintTask {
  id: string;
  task_id: string;
  task_title: string;
  task_description: string;
  completed: boolean;
  completed_date: string | null;
  notes: string | null;
  week: number;
}

interface SprintStats {
  completionPercentage: number;
  currentDay: number;
  totalDays: number;
  status: 'on-track' | 'behind' | 'ahead';
  endDate: string;
  tasksCompleted: number;
  totalTasks: number;
}

const RoadmapProgress = () => {
  const { user } = useAuth();
  const { progress } = useAssessmentProgress();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [stats, setStats] = useState<SprintStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    loadSprintData();
  }, [progress.group_id]);

  const loadSprintData = async () => {
    if (!progress.group_id) return;

    try {
      setLoading(true);
      const [sprintTasks, sprintStats] = await Promise.all([
        sprintTrackingService.getSprintProgress(progress.group_id),
        sprintTrackingService.getSprintStats(progress.group_id)
      ]);

      setTasks(sprintTasks);
      setStats(sprintStats);
    } catch (error) {
      console.error('Error loading sprint data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(task => 
        task.task_id === taskId 
          ? { ...task, completed, completed_date: completed ? new Date().toISOString() : null }
          : task
      ));

      await sprintTrackingService.updateTaskStatus(taskId, completed, '');
      
      // Reload stats to update progress
      const updatedStats = await sprintTrackingService.getSprintStats(progress.group_id);
      setStats(updatedStats);
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update on error
      loadSprintData();
    }
  };

  const handleAddNote = async (taskId: string, notes: string) => {
    try {
      const task = tasks.find(t => t.task_id === taskId);
      if (!task) return;

      await sprintTrackingService.updateTaskStatus(taskId, task.completed, notes);
      
      setTasks(prev => prev.map(t => 
        t.task_id === taskId ? { ...t, notes } : t
      ));
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const groupTasksByWeek = (tasks: SprintTask[]) => {
    const grouped: { [key: number]: SprintTask[] } = {};
    tasks.forEach(task => {
      const week = task.week || 1;
      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(task);
    });
    return grouped;
  };

  const getWeekProgress = (weekTasks: SprintTask[]) => {
    const completed = weekTasks.filter(t => t.completed).length;
    return (completed / weekTasks.length) * 100;
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-oracle-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your sprint progress...</p>
        </div>
      </div>
    );
  }

  const weeklyTasks = groupTasksByWeek(tasks);
  const weeks = Object.keys(weeklyTasks).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-oracle-navy"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-oracle-navy text-center">90-Day Sprint Progress</h1>
              <p className="text-gray-600 text-center">Track your transformation journey</p>
            </div>
          </div>
        </div>

        {/* Sprint Overview */}
        <SprintOverview stats={stats} />

        {/* Week Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-oracle-navy flex items-center justify-center gap-2">
              <Filter className="h-5 w-5" />
              Filter by Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant={selectedWeek === null ? "default" : "outline"}
                onClick={() => setSelectedWeek(null)}
                size="sm"
              >
                All Weeks
              </Button>
              {weeks.map(week => (
                <Button
                  key={week}
                  variant={selectedWeek === week ? "default" : "outline"}
                  onClick={() => setSelectedWeek(week)}
                  size="sm"
                  className="relative"
                >
                  Week {week}
                  <Badge 
                    variant="secondary" 
                    className="ml-2 text-xs"
                  >
                    {Math.round(getWeekProgress(weeklyTasks[week]))}%
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks by Week */}
        <div className="space-y-8">
          {weeks
            .filter(week => selectedWeek === null || selectedWeek === week)
            .map(week => (
              <Card key={week} className="border-l-4 border-oracle-gold">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-oracle-navy text-center">
                      Week {week}
                    </CardTitle>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {weeklyTasks[week].filter(t => t.completed).length} of {weeklyTasks[week].length} complete
                        </p>
                        <Progress 
                          value={getWeekProgress(weeklyTasks[week])} 
                          className="w-32 h-2"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {weeklyTasks[week].map(task => (
                      <TaskCard
                        key={task.task_id}
                        task={task}
                        onToggle={handleTaskToggle}
                        onAddNote={handleAddNote}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Floating Action Button */}
        <Button
          onClick={() => setFeedbackModalOpen(true)}
          className="fixed bottom-8 right-8 rounded-full w-16 h-16 bg-oracle-gold hover:bg-oracle-gold/90 text-oracle-navy shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Feedback Modal */}
        <SprintFeedbackModal
          open={feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(false)}
          groupId={progress.group_id}
        />
      </div>
    </div>
  );
};

export default RoadmapProgress;
