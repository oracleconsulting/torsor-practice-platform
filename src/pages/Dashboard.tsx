import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOracleData } from '@/hooks/useOracleData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Target, TrendingUp, Users, Calendar, ChevronRight, Eye, BookOpen, Sparkles, Clock, DollarSign, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DataInspector } from '@/components/debug/DataInspector';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, refreshData } = useOracleData();
  
  // Dialog states
  const [showVisionDialog, setShowVisionDialog] = useState(false);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  
  // Helper functions
  const getRoadmapWeeks = () => {
    // Your weeks are in: data.roadmapData.three_month_sprint.weeks
    const weeks = data?.threeMonthSprint?.weeks || 
                  data?.roadmapData?.three_month_sprint?.weeks || 
                  [];
    
    return weeks.map((week: any, index: number) => ({
      ...week,
      weekNumber: week.week || index + 1,
      tasks: week.tasks || []
    }));
  };

  const calculateProgress = () => {
    if (!data) return 0;
    let progress = 0;
    if (data.intakeComplete) progress += 25;
    if (data.part2Complete) progress += 25;
    if (data.part3Complete) progress += 25;
    if (data.roadmapGenerated) progress += 25;
    return progress;
  };

  // Navigation handlers
  const handleViewTwelveWeekPlan = () => {
    navigate('/oracle/twelve-week-plan');
  };

  const handleViewBoardMeetings = () => {
    navigate('/oracle/board-meetings');
  };

  const handleGenerateRoadmap = async () => {
    try {
      toast.loading('Generating your roadmap...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify({
          group_id: data?.rawData?.part1?.group_id || data?.rawData?.part2?.group_id,
          user_id: user?.id
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate roadmap');
      
      toast.success('Roadmap generation started!');
      setTimeout(() => refreshData(), 5000);
      
    } catch (error) {
      toast.error('Failed to generate roadmap');
      console.error('Roadmap generation error:', error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your Oracle dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">Error loading dashboard data</p>
          <Button onClick={refreshData} className="bg-gradient-to-r from-purple-600 to-blue-600">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // No data state
  if (!data || !data.intakeComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="p-12 text-center max-w-2xl shadow-xl">
          <Sparkles className="h-16 w-16 text-purple-600 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Oracle Method
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Transform your business in 12 weeks with AI-powered guidance
          </p>
          <Button 
            onClick={() => navigate('/assessments')} 
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6"
          >
            Start Your Assessment
          </Button>
        </Card>
      </div>
    );
  }

  // Assessment incomplete
  if (!data.part2Complete || !data.validationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="p-8 max-w-2xl w-full shadow-xl">
          <h1 className="text-2xl font-bold mb-6">Continue Your Assessment</h1>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span className="font-semibold">{calculateProgress()}% Complete</span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
          </div>
          <p className="text-gray-600 mb-6">
            You're almost there! Complete your assessment to unlock your personalized roadmap.
          </p>
          <Button 
            onClick={() => navigate('/assessments')} 
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Continue Assessment
          </Button>
        </Card>
      </div>
    );
  }

  // Roadmap not generated
  if (!data.roadmapGenerated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-2xl shadow-xl">
          <div className="mb-6">
            <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
              ✓ Assessment Complete
            </Badge>
          </div>
          <h1 className="text-3xl font-bold mb-4">Ready to Generate Your Roadmap!</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Great job! Now let's create your personalized 12-week transformation plan.
          </p>
          <Button 
            onClick={handleGenerateRoadmap}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-lg px-8 py-6"
          >
            Generate My Roadmap
          </Button>
        </Card>
      </div>
    );
  }

  // Full dashboard
  const weeks = getRoadmapWeeks();
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Debug Data Inspector */}
      <DataInspector />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {data.userName}!
              </h1>
              <p className="text-gray-600 mt-2">Your Oracle Method transformation dashboard</p>
            </div>
            <Button onClick={refreshData} variant="outline" size="sm">
              <Loader2 className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="p-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <h2 className="text-lg font-semibold mb-4">Your Journey Progress</h2>
          <Progress value={progress} className="bg-white/20 h-3" />
          <div className="flex justify-between mt-2 text-sm">
            <span>Assessment, Roadmap & Board</span>
            <span className="font-semibold">{progress}% Complete</span>
          </div>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Building className="h-8 w-8 text-purple-600" />
              <Badge variant="outline">{data.industry}</Badge>
            </div>
            <h3 className="text-2xl font-bold">{data.businessName}</h3>
            <p className="text-sm text-gray-600 mt-1">{data.yearsTrading} years trading</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <Badge className="bg-red-100 text-red-700">-30h target</Badge>
            </div>
            <h3 className="text-2xl font-bold">60h → 30h</h3>
            <p className="text-sm text-gray-600 mt-1">Working hours per week</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <Badge variant="outline">Pre-Revenue</Badge>
            </div>
            <h3 className="text-2xl font-bold">Pre-Revenue</h3>
            <p className="text-sm text-gray-600 mt-1">Building for growth</p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Users className="h-8 w-8 text-indigo-600" />
              <Badge variant="outline">{data.teamSize}</Badge>
            </div>
            <h3 className="text-2xl font-bold">Team Size</h3>
            <p className="text-sm text-gray-600 mt-1">Current employees</p>
          </Card>
        </div>

        {/* Board Recommendation - YOUR EXACT DATA */}
        {data.boardRecommended && (
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your AI Board Recommendation</h2>
                <Badge className="mt-2 bg-indigo-600">{data.boardType} Board</Badge>
              </div>
              <Sparkles className="h-6 w-6 text-indigo-600" />
            </div>
            
            {/* Show YOUR actual board members */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selected Board Members:</p>
              <div className="flex gap-2">
                {(data.boardMembers || ["CMO", "CGO", "CCO"]).map((member: string) => (
                  <Badge key={member} variant="outline" className="text-lg py-1 px-3">
                    {member}: {data.boardScores?.[member] || 0}%
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { name: 'Chief Marketing Officer', score: data.boardScores?.CMO || 100, desc: 'Marketing & Growth' },
                { name: 'Chief Growth Officer', score: data.boardScores?.CGO || 40, desc: 'Strategy & Scaling' },
                { name: 'Chief Commercial Officer', score: data.boardScores?.CCO || 29, desc: 'Revenue & Sales' }
              ].map((board) => (
                <div key={board.name} className="text-center p-4 bg-white rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">{board.name}</p>
                  <p className="text-3xl font-bold text-indigo-600">{board.score}%</p>
                  <p className="text-xs text-gray-500 mt-1">{board.desc}</p>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleViewBoardMeetings} 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Meet Your AI Board Members
            </Button>
          </Card>
        )}

        {/* Journey Overview */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Your Transformation Journey</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowVisionDialog(true)}
                variant="outline"
                size="sm"
                className="hover:bg-purple-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                5-Year Vision
              </Button>
              <Button
                onClick={() => setShowShiftDialog(true)}
                variant="outline"
                size="sm"
                className="hover:bg-blue-50"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                6-Month Shifts
              </Button>
            </div>
          </div>

          {/* Sprint Overview */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4 text-gray-700">12-Week Sprint: First 4 Weeks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weeks.slice(0, 4).map((week: any) => (
                <Card
                  key={week.weekNumber}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                  onClick={() => setSelectedWeek(week.weekNumber)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">Week {week.weekNumber}</Badge>
                    <span className="text-xs text-gray-500">{week.tasks?.length || 0} tasks</span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{week.theme}</h4>
                  <p className="text-xs text-gray-600">{week.focus}</p>
                </Card>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleViewTwelveWeekPlan} 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Calendar className="h-4 w-4 mr-2" />
            View Complete 12-Week Plan
          </Button>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Sprint Plan',
              description: 'View all 12 weeks',
              icon: Target,
              onClick: handleViewTwelveWeekPlan,
              color: 'hover:bg-purple-50'
            },
            {
              title: 'AI Board',
              description: 'Schedule meetings',
              icon: Users,
              onClick: handleViewBoardMeetings,
              color: 'hover:bg-blue-50'
            },
            {
              title: 'Knowledge Hub',
              description: 'Resources & guides',
              icon: BookOpen,
              onClick: () => navigate('/knowledge-hub'),
              color: 'hover:bg-green-50'
            }
          ].map((action) => (
            <Card 
              key={action.title}
              className={`p-6 hover:shadow-lg transition-all cursor-pointer ${action.color}`}
              onClick={action.onClick}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{action.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
                <action.icon className="h-8 w-8 text-gray-400" />
              </div>
            </Card>
          ))}
        </div>

        {/* Dialogs */}
        <VisionDialog 
          open={showVisionDialog} 
          onOpenChange={setShowVisionDialog}
          visionData={data.fiveYearVision}
        />
        
        <ShiftDialog
          open={showShiftDialog}
          onOpenChange={setShowShiftDialog}
          shiftData={data.sixMonthShift}
        />
        
        <WeekDetailsDialog
          open={selectedWeek !== null}
          onOpenChange={() => setSelectedWeek(null)}
          week={weeks.find((w: any) => w.weekNumber === selectedWeek)}
          weekNumber={selectedWeek}
        />
      </div>
    </div>
  );
}

// Dialog Components
function VisionDialog({ open, onOpenChange, visionData }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your 5-Year Vision</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-6">
          {visionData?.north_star && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">🌟 North Star</h3>
              <p className="text-purple-800 text-lg">{visionData.north_star}</p>
              {/* YOUR ACTUAL VALUE: "Freedom to be in the business if I want, or off exploring the world..." */}
            </div>
          )}
          
          {/* Show YOUR year milestones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Journey</h3>
            
            {visionData.year_1 && (
              <Card className="p-4">
                <h4 className="font-bold mb-2">Year 1: {visionData.year_1.headline}</h4>
                <p className="text-sm text-gray-600">{visionData.year_1.story}</p>
                <p className="text-xs text-gray-500 mt-2">{visionData.year_1.measurable}</p>
              </Card>
            )}
            
            {visionData.year_3 && (
              <Card className="p-4">
                <h4 className="font-bold mb-2">Year 3: {visionData.year_3.headline}</h4>
                <p className="text-sm text-gray-600">{visionData.year_3.story}</p>
                <p className="text-xs text-gray-500 mt-2">{visionData.year_3.measurable}</p>
              </Card>
            )}
            
            {visionData.year_5 && (
              <Card className="p-4">
                <h4 className="font-bold mb-2">Year 5: {visionData.year_5.headline}</h4>
                <p className="text-sm text-gray-600">{visionData.year_5.story}</p>
                <p className="text-xs text-gray-500 mt-2">{visionData.year_5.measurable}</p>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShiftDialog({ open, onOpenChange, shiftData }: any) {
  const shifts = [
    { 
      period: 'month_1_2',
      title: 'Months 1-2',
      data: shiftData?.month_1_2
    },
    { 
      period: 'month_3_4',
      title: 'Months 3-4',
      data: shiftData?.month_3_4
    },
    { 
      period: 'month_5_6',
      title: 'Months 5-6',
      data: shiftData?.month_5_6
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your 6-Month Structural Shifts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-6">
          {shifts.map(({ period, title, data }) => {
            if (!data) return null;
            
            return (
              <Card key={period} className="p-6 hover:shadow-md transition-shadow">
                <h4 className="font-bold text-lg mb-3">
                  {title}: {data.theme}
                </h4>
                <p className="text-gray-700 mb-4">{data.focus}</p>
                
                {data.key_actions && (
                  <div className="mb-4">
                    <p className="font-semibold text-sm mb-2">Key Actions:</p>
                    <div className="space-y-2">
                      {data.key_actions.map((action: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {data.success_metrics && (
                  <div>
                    <p className="font-semibold text-sm mb-2">Success Metrics:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.success_metrics.map((metric: string, i: number) => (
                        <Badge key={i} variant="outline">{metric}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function WeekDetailsDialog({ open, onOpenChange, week, weekNumber }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Week {weekNumber} - {week?.theme}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-6">
          <p className="text-gray-600">{week?.focus}</p>
          {week?.tasks?.map((task: any, index: number) => (
            <Card key={index} className="p-5 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-lg mb-2">{task.title || task.task}</h4>
              <p className="text-gray-700 mb-3">{task.description}</p>
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
                <p className="text-sm text-purple-600 mt-3 italic">
                  Impact: {task.impact}
                </p>
              )}
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}