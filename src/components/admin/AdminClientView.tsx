import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  RefreshCw, 
  Eye, 
  FileText, 
  Users, 
  Target,
  Calendar,
  TrendingUp,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Brain,
  Heart,
  Zap
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOracleData } from '../../hooks/useOracleData';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import AdminService from '../../services/adminService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { supabase } from '../../lib/supabase/client';

interface AdminClientViewProps {
  clientEmail: string;
  groupId: string;
  onBack?: () => void;
}

export const AdminClientView: React.FC<AdminClientViewProps> = ({ 
  clientEmail, 
  groupId,
  onBack
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useOracleData(groupId, clientEmail);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerationStatus, setRegenerationStatus] = useState('');
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);
  const [actualTasks, setActualTasks] = useState<any[]>([]);

  // Fetch sprint progress to determine completed weeks
  React.useEffect(() => {
    const fetchSprintProgress = async () => {
      if (!groupId) return;

      const { data: sprintData, error: sprintError } = await supabase
        .from('sprint_progress')
        .select('*')
        .eq('group_id', groupId);

      if (sprintError) {
        console.error('Error fetching sprint progress:', sprintError);
        return;
      }

      // Store the actual tasks
      setActualTasks(sprintData || []);

      // Calculate completed weeks based on task completion
      const weekCompletion: Record<number, { total: number; completed: number }> = {};
      
      sprintData?.forEach((task: any) => {
        const week = task.week || task.week_number || task.sprint_number || 1;
        if (!weekCompletion[week]) {
          weekCompletion[week] = { total: 0, completed: 0 };
        }
        weekCompletion[week].total++;
        if (task.completed) {
          weekCompletion[week].completed++;
        }
      });

      // Mark weeks as completed if all tasks are done
      const completed = Object.entries(weekCompletion)
        .filter(([_, stats]) => stats.total > 0 && stats.completed === stats.total)
        .map(([week]) => parseInt(week));

      setCompletedWeeks(completed);
    };

    fetchSprintProgress();
  }, [groupId]);

  const handleRegenerateRoadmap = async () => {
    if (!confirm(`This will regenerate the entire roadmap and board for ${clientEmail}. Existing data will be replaced. Continue?`)) {
      return;
    }

    setRegenerating(true);
    setRegenerationStatus('Starting regeneration...');
    
    try {
      const success = await AdminService.regenerateRoadmap(
        groupId,
        {}, // empty options for now
        user?.email || 'admin'
      );

      if (success) {
        toast.success(`Roadmap regenerated successfully for ${clientEmail}!`);
        // Refresh the page to show new data
        window.location.reload();
      } else {
        toast.warning(`Regeneration initiated for ${clientEmail}`, {
          description: "This process may take up to 3 minutes. Check back shortly."
        });
      }
    } catch (error) {
      console.error('Error regenerating roadmap:', error);
      toast.error('Failed to regenerate roadmap', {
        description: error instanceof Error ? error.message : 'Please check the backend logs for details'
      });
    } finally {
      setRegenerating(false);
      setRegenerationStatus('');
    }
  };

  const handleBackToAdmin = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/admin');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading client data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
          <p className="text-red-400 mb-4">Error loading client data</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={handleBackToAdmin} variant="outline">
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-yellow-400" />
          <p className="text-yellow-400 mb-4">No data found for this client</p>
          <Button onClick={handleBackToAdmin} variant="outline">
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-y-auto">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleBackToAdmin}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Client Dashboard</h1>
                <p className="text-gray-400 text-sm">{clientEmail}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-400">
                Group ID: {groupId}
              </div>
              <Button
                onClick={handleRegenerateRoadmap}
                disabled={regenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {regenerating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {regenerating ? 'Regenerating...' : 'Regenerate Roadmap'}
              </Button>
            </div>
          </div>
          
          {regenerating && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-blue-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{regenerationStatus}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.part1Complete ? 'bg-green-500' : 'bg-gray-500'}`} />
              <div>
                <p className="text-white text-sm">Part 1 Assessment</p>
                <p className="font-semibold text-gray-200">{data.part1Complete ? 'Complete' : 'Not Started'}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.part2Complete ? 'bg-green-500' : 'bg-gray-500'}`} />
              <div>
                <p className="text-white text-sm">Part 2 Assessment</p>
                <p className="font-semibold text-gray-200">{data.part2Complete ? 'Complete' : 'Not Started'}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.validationComplete ? 'bg-green-500' : 'bg-gray-500'}`} />
              <div>
                <p className="text-white text-sm">Validation Questions</p>
                <p className="font-semibold text-gray-200">{data.validationComplete ? 'Complete' : 'Not Started'}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${data.boardGenerated ? 'bg-green-500' : 'bg-gray-500'}`} />
              <div>
                <p className="text-white text-sm">Board Generated</p>
                <p className="font-semibold text-gray-200">{data.boardGenerated ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800 p-6">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white text-sm">ROI Value</p>
                <p className="font-semibold text-gray-200">{data.roiValue}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Fit Message */}
        {data.fitMessage && (
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-pink-400" />
                <h2 className="text-lg font-semibold">Oracle Fit Message</h2>
              </div>
              <p className="text-gray-200 leading-relaxed">{data.fitMessage}</p>
            </div>
          </Card>
        )}

        {/* Assessment Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Part 1 Assessment */}
          <Card className="bg-gray-900 border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold">Part 1 Assessment</h2>
                {data.part1Complete && <CheckCircle className="w-5 h-5 text-green-400" />}
              </div>
              {data.part1Complete ? (
                <div className="space-y-3">
                  {Object.entries(data.part1Answers).map(([question, answer]) => (
                    <div key={question} className="border-b border-gray-800 pb-3 last:border-b-0">
                      <p className="text-white font-medium text-sm mb-1">{question}</p>
                      <p className="text-gray-300">{String(answer)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No Part 1 assessment completed</p>
              )}
            </div>
          </Card>

          {/* Part 2 Assessment */}
          <Card className="bg-gray-900 border-gray-800">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold">Part 2 Assessment</h2>
                {data.part2Complete && <CheckCircle className="w-5 h-5 text-green-400" />}
              </div>
              {data.part2Complete ? (
                <div className="space-y-3">
                  {Object.entries(data.part2Answers).map(([question, answer]) => (
                    <div key={question} className="border-b border-gray-800 pb-3 last:border-b-0">
                      <p className="text-white font-medium text-sm mb-1">{question}</p>
                      <p className="text-gray-300">{String(answer)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No Part 2 assessment completed</p>
              )}
            </div>
          </Card>
        </div>

        {/* Validation Questions */}
        {data.validationComplete && (
          <div className="mt-8">
            <Card className="bg-gray-900 border-gray-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h2 className="text-lg font-semibold">Validation Questions</h2>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {data.validationResponses && Object.entries(data.validationResponses).map(([question, answer]) => (
                    <div key={question} className="border border-gray-800 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-2">{question}</p>
                      <p className="text-white">{String(answer)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Roadmap Data */}
        {data.roadmap && (
          <div className="mt-8">
            <Card className="bg-gray-900 border-gray-800">
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <h2 className="text-xl font-semibold">Generated Roadmap</h2>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Five Year Vision */}
                  {data.roadmap && typeof data.roadmap === 'object' && data.roadmap !== null && 
                   'five_year_vision' in data.roadmap && data.roadmap.five_year_vision && (
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-purple-300">Five Year Vision</h3>
                      <p className="text-gray-200 leading-relaxed">{String(data.roadmap.five_year_vision)}</p>
                    </div>
                  )}
                  
                  {/* Six Month Shift */}
                  {data.roadmap && typeof data.roadmap === 'object' && data.roadmap !== null && 
                   'six_month_shift' in data.roadmap && data.roadmap.six_month_shift && (
                    <div>
                      <h3 className="text-lg font-medium mb-3 text-blue-300">Six Month Shift</h3>
                      <p className="text-gray-200 leading-relaxed">{String(data.roadmap.six_month_shift)}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Board Data */}
        {data.boardGenerated && data.board.length > 0 && (
          <div className="mt-8">
            <Card className="bg-gray-900 border-gray-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-semibold">Board Recommendation</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.board.map((advisor, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="font-medium text-green-400">{advisor}</span>
                      </div>
                      {data.boardRationale[advisor] && (
                        <p className="text-gray-300 text-sm">{data.boardRationale[advisor]}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                {data.boardComposition && (
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-lg font-medium mb-2 text-blue-300">Board Composition</h3>
                    <p className="text-gray-200">{data.boardComposition}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Three Month Sprint */}
        {data.roadmap && typeof data.roadmap === 'object' && data.roadmap !== null && 
         'three_month_sprint' in data.roadmap && data.roadmap.three_month_sprint && (
          <div className="mt-8">
            <Card className="bg-gray-900 border-gray-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Calendar className="w-6 h-6 text-orange-400" />
                  <h2 className="text-xl font-semibold">Three Month Sprint - Actual Tasks</h2>
                </div>
                
                <div className="space-y-6">
                  {data.roadmap.three_month_sprint && typeof data.roadmap.three_month_sprint === 'object' && 
                   'sprint_theme' in data.roadmap.three_month_sprint && data.roadmap.three_month_sprint.sprint_theme && (
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-orange-300">Sprint Theme</h3>
                      <p className="text-gray-200">{String(data.roadmap.three_month_sprint.sprint_theme)}</p>
                    </div>
                  )}
                  
                  {data.roadmap.three_month_sprint && typeof data.roadmap.three_month_sprint === 'object' && 
                   'biggest_risk' in data.roadmap.three_month_sprint && data.roadmap.three_month_sprint.biggest_risk && (
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-red-300">Biggest Risk</h3>
                      <p className="text-gray-200">{String(data.roadmap.three_month_sprint.biggest_risk)}</p>
                    </div>
                  )}
                  
                  {data.roadmap.three_month_sprint && typeof data.roadmap.three_month_sprint === 'object' && 
                   'weeks' in data.roadmap.three_month_sprint && Array.isArray(data.roadmap.three_month_sprint.weeks) && (
                    <div>
                      <h3 className="text-lg font-medium mb-4 text-blue-300">Weekly Breakdown</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.roadmap.three_month_sprint.weeks.map((week, index) => {
                          const weekObj = week as any;
                          // Check if this week is completed based on sprint progress
                          const isCompleted = completedWeeks.includes(weekObj.week || index + 1);
                          
                          return (
                            <div 
                              key={index} 
                              className={`rounded-lg p-4 border-2 transition-all ${
                                isCompleted 
                                  ? 'bg-green-900/20 border-green-500/50 shadow-lg shadow-green-500/20' 
                                  : 'bg-gray-800 border-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-white">Week {weekObj.week}</h4>
                                {isCompleted && (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                )}
                              </div>
                              {weekObj.theme && (
                                <p className="text-gray-300 text-sm mb-2">
                                  <span className="text-gray-400">Theme:</span> {weekObj.theme}
                                </p>
                              )}
                              {weekObj.focus && (
                                <p className="text-gray-300 text-sm mb-2">
                                  <span className="text-gray-400">Focus:</span> {weekObj.focus}
                                </p>
                              )}
                              {weekObj.tasks && Array.isArray(weekObj.tasks) && weekObj.tasks.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-gray-300 text-sm mb-2 font-medium">Tasks:</p>
                                  <ul className="text-sm space-y-2">
                                    {weekObj.tasks.map((task: any, taskIndex: number) => (
                                      <li key={taskIndex} className="flex items-start gap-2">
                                        <span className={`mt-0.5 ${isCompleted ? 'text-green-400' : 'text-blue-400'}`}>
                                          {isCompleted ? <CheckCircle className="w-3 h-3" /> : '•'}
                                        </span>
                                        <div className="flex-1">
                                          <span className="text-gray-200">
                                            {typeof task === 'string' ? task : task.task || task.title || JSON.stringify(task)}
                                          </span>
                                          {task.detail && (
                                            <p className="text-gray-400 text-xs mt-1">{task.detail}</p>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Actual Allocated Tasks */}
        {actualTasks.length > 0 && (
          <div className="mt-8">
            <Card className="bg-gray-900 border-gray-800">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-6 h-6 text-green-400" />
                  <h2 className="text-xl font-semibold">Actual Allocated Tasks</h2>
                  <Badge className="bg-green-900 text-green-300">
                    {actualTasks.filter(t => t.completed).length}/{actualTasks.length} Completed
                  </Badge>
                </div>
                
                <div className="space-y-6">
                  {/* Group tasks by week */}
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(weekNum => {
                    const weekTasks = actualTasks.filter(task => {
                      const taskWeek = task.week || task.week_number || task.sprint_number || 1;
                      return taskWeek === weekNum;
                    });
                    
                    if (weekTasks.length === 0) return null;
                    
                    const isWeekCompleted = completedWeeks.includes(weekNum);
                    const completedCount = weekTasks.filter(t => t.completed).length;
                    
                    return (
                      <div 
                        key={weekNum} 
                        className={`rounded-lg p-4 border-2 transition-all ${
                          isWeekCompleted 
                            ? 'bg-green-900/20 border-green-500/50 shadow-lg shadow-green-500/20' 
                            : 'bg-gray-800 border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-white">Week {weekNum}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={isWeekCompleted ? "default" : "secondary"}>
                              {completedCount}/{weekTasks.length} tasks
                            </Badge>
                            {isWeekCompleted && (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {weekTasks.map((task, idx) => (
                            <div 
                              key={task.id || idx} 
                              className={`flex items-start gap-3 p-2 rounded ${
                                task.completed ? 'bg-green-900/20' : 'bg-gray-700/50'
                              }`}
                            >
                              <div className="mt-0.5">
                                {task.completed ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-gray-500" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                                  {task.task_title}
                                </p>
                                {task.task_description && (
                                  <p className="text-xs text-gray-500 mt-1">{task.task_description}</p>
                                )}
                                {task.completed_date && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Completed: {new Date(task.completed_date).toLocaleDateString()}
                                  </p>
                                )}
                                {task.notes && (
                                  <p className="text-xs text-gray-400 mt-1 italic">Note: {task.notes}</p>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {task.priority && (
                                  <Badge variant="outline" className="text-xs">
                                    {task.priority}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}; 