import { useOracleData } from '@/hooks/useOracleData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Calendar, Target, Clock, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function TwelveWeekPlanPage() {
  const { data, loading } = useOracleData();
  const navigate = useNavigate();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your 12-week plan...</p>
        </div>
      </div>
    );
  }
  
  if (!data?.roadmapGenerated) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">12-Week Plan Not Yet Generated</h2>
          <p className="text-gray-600 mb-6">Generate your roadmap to see your personalized 12-week plan</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // Extract weeks from multiple possible locations
  const weeks = 
    data.threeMonthSprint?.weeks ||
    data.roadmapData?.three_month_sprint?.weeks ||
    data.roadmapData?.weeks ||
    [];

  // Get sprint theme and goals
  const sprintTheme = 
    data.threeMonthSprint?.sprint_theme ||
    data.roadmapData?.three_month_sprint?.sprint_theme ||
    'Your 12-Week Transformation';
    
  const sprintGoals = 
    data.threeMonthSprint?.sprint_goals ||
    data.roadmapData?.three_month_sprint?.sprint_goals ||
    ['Transform your business', 'Reduce working hours', 'Build sustainable systems'];

  // Calculate current week (for demo, we'll say week 1)
  const currentWeek = 1;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{sprintTheme}</h1>
              <p className="text-gray-600">Your personalized 12-week transformation roadmap</p>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Sprint Overview */}
        <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h2 className="text-xl font-semibold mb-4">Sprint Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sprintGoals.map((goal: string, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <Target className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{goal}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{Math.round((currentWeek / 12) * 100)}%</span>
            </div>
            <Progress value={(currentWeek / 12) * 100} className="bg-white/20" />
          </div>
        </Card>

        {/* Weeks Grid */}
        <div className="space-y-4">
          {weeks.length > 0 ? (
            weeks.map((week: any, index: number) => {
              const weekNum = week.week || week.weekNumber || index + 1;
              const isCurrentWeek = weekNum === currentWeek;
              const isExpanded = expandedWeek === weekNum;
              const isPastWeek = weekNum < currentWeek;
              
              return (
                <Card 
                  key={weekNum}
                  className={`transition-all ${
                    isCurrentWeek ? 'ring-2 ring-purple-600 shadow-lg' : ''
                  } ${isPastWeek ? 'opacity-75' : ''}`}
                >
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedWeek(isExpanded ? null : weekNum)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge 
                            variant={isCurrentWeek ? 'default' : 'outline'}
                            className={isCurrentWeek ? 'bg-purple-600' : ''}
                          >
                            Week {weekNum}
                          </Badge>
                          {isCurrentWeek && (
                            <Badge className="bg-green-500">Current Week</Badge>
                          )}
                          {isPastWeek && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                        <h3 className="text-xl font-semibold mb-1">{week.theme}</h3>
                        <p className="text-gray-600">{week.focus}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{week.tasks?.length || 0} tasks</span>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Task List */}
                  {isExpanded && (
                    <div className="border-t px-6 pb-6">
                      <div className="mt-6 space-y-4">
                        {week.tasks?.map((task: any, taskIndex: number) => (
                          <div key={taskIndex} className="flex gap-4">
                            <Circle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{task.title || task.task}</h4>
                              <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                              <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-1 text-blue-600">
                                  <Clock className="h-4 w-4" />
                                  {task.time_required || '2 hours'}
                                </span>
                                <span className="flex items-center gap-1 text-green-600">
                                  <Target className="h-4 w-4" />
                                  {task.output || 'Deliverable'}
                                </span>
                              </div>
                              {task.impact && (
                                <p className="text-sm text-purple-600 mt-2">
                                  Impact: {task.impact}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            // Fallback content if no weeks data
            <Card className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Generating Your Personalized Plan...</h3>
              <p className="text-gray-600 mb-6">
                Your 12-week transformation plan is being customized based on your assessment results.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </Card>
          )}
        </div>

        {/* Success Metrics */}
        {weeks.length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <h2 className="text-xl font-semibold mb-4">Success Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-2">By Week 4</p>
                <p className="font-semibold">Core processes documented</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-2">By Week 8</p>
                <p className="font-semibold">First major shift 50% complete</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-sm text-gray-600 mb-2">By Week 12</p>
                <p className="font-semibold">Working {data.workingHoursTarget || 30} hours/week</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 