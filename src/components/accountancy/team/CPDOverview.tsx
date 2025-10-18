/**
 * CPD Overview Component
 * Comprehensive tracking of CPD hours, activities, and recommendations
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Award, 
  BookOpen,
  CheckCircle,
  Calendar,
  ExternalLink,
  Lightbulb
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface CPDActivity {
  id: string;
  title: string;
  hours_claimed: number;
  activity_date: string;
  type: string;
  status: string;
  learnings_captured?: string;
}

interface CPDRecommendation {
  id: string;
  recommended_cpd_type: string;
  estimated_hours: number;
  priority_score: number;
  urgency: string;
  skill_id: string;
  skills?: {
    name: string;
    category: string;
  };
}

interface CPDStats {
  totalRequiredHours: number;
  determinedHours: number;
  selfAllocatedHours: number;
  completedHours: number;
  determinedCompleted: number;
  selfAllocatedCompleted: number;
  hoursRemaining: number;
  percentageComplete: number;
}

interface CPDOverviewProps {
  memberId: string;
  practiceId: string;
}

const CPDOverview: React.FC<CPDOverviewProps> = ({ memberId, practiceId }) => {
  const [stats, setStats] = useState<CPDStats>({
    totalRequiredHours: 0,
    determinedHours: 0,
    selfAllocatedHours: 0,
    completedHours: 0,
    determinedCompleted: 0,
    selfAllocatedCompleted: 0,
    hoursRemaining: 0,
    percentageComplete: 0
  });
  const [activities, setActivities] = useState<CPDActivity[]>([]);
  const [recommendations, setRecommendations] = useState<CPDRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCPDData();
  }, [memberId, practiceId]);

  const loadCPDData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCPDStats(),
        loadCPDActivities(),
        loadCPDRecommendations()
      ]);
    } catch (error) {
      console.error('Error loading CPD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCPDStats = async () => {
    try {
      // Get practice-level CPD requirements
      const { data: practice } = await supabase
        .from('practices')
        .select('cpd_total_expected_hours, cpd_determined_hours, cpd_self_allocated_hours')
        .eq('id', practiceId)
        .single();

      // Get member's completed hours
      const { data: member } = await supabase
        .from('practice_members')
        .select('cpd_completed_hours, cpd_determined_completed, cpd_self_allocated_completed')
        .eq('id', memberId)
        .single();

      if (practice && member) {
        const practiceData = practice as any;
        const memberData = member as any;

        const totalRequired = practiceData.cpd_total_expected_hours || 40;
        const completed = memberData.cpd_completed_hours || 0;
        const remaining = Math.max(0, totalRequired - completed);
        const percentage = totalRequired > 0 ? (completed / totalRequired) * 100 : 0;

        setStats({
          totalRequiredHours: totalRequired,
          determinedHours: practiceData.cpd_determined_hours || 20,
          selfAllocatedHours: practiceData.cpd_self_allocated_hours || 20,
          completedHours: completed,
          determinedCompleted: memberData.cpd_determined_completed || 0,
          selfAllocatedCompleted: memberData.cpd_self_allocated_completed || 0,
          hoursRemaining: remaining,
          percentageComplete: percentage
        });
      }
    } catch (error) {
      console.error('Error loading CPD stats:', error);
    }
  };

  const loadCPDActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('cpd_activities')
        .select('id, title, hours_claimed, activity_date, type, status, learnings_captured')
        .eq('practice_member_id', memberId)
        .eq('status', 'completed')
        .order('activity_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivities((data as any) || []);
    } catch (error) {
      console.error('Error loading CPD activities:', error);
      setActivities([]);
    }
  };

  const loadCPDRecommendations = async () => {
    try {
      const { data, error } = await supabase
        .from('cpd_recommendations')
        .select(`
          id,
          recommended_cpd_type,
          estimated_hours,
          priority_score,
          urgency,
          skill_id,
          skills:skill_id (
            name,
            category
          )
        `)
        .eq('member_id', memberId)
        .order('priority_score', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecommendations((data as any) || []);
    } catch (error) {
      console.error('Error loading CPD recommendations:', error);
      setRecommendations([]);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getCPDTypeColor = (type: string) => {
    const typeColors: Record<string, string> = {
      'Course': 'bg-blue-500/20 text-blue-300',
      'Workshop': 'bg-purple-500/20 text-purple-300',
      'Conference': 'bg-indigo-500/20 text-indigo-300',
      'Webinar': 'bg-green-500/20 text-green-300',
      'Reading': 'bg-orange-500/20 text-orange-300',
      'Mentoring': 'bg-pink-500/20 text-pink-300',
      'Self-Study': 'bg-teal-500/20 text-teal-300'
    };
    return typeColors[type] || 'bg-gray-500/20 text-gray-300';
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* CPD Hours Overview */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="bg-gray-800">
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            CPD Hours Tracker
          </CardTitle>
          <CardDescription className="text-gray-300 font-medium">
            Monitor your progress towards annual CPD requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-gray-800">
          {/* Main Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">Overall Progress</span>
              <span className="text-2xl font-bold text-blue-400">
                {stats.completedHours} / {stats.totalRequiredHours} hours
              </span>
            </div>
            <Progress 
              value={stats.percentageComplete} 
              className="h-4 bg-gray-700"
            />
            <p className="text-sm text-gray-300 mt-2">
              {stats.hoursRemaining > 0 
                ? `${stats.hoursRemaining.toFixed(1)} hours remaining to meet your target`
                : '🎉 Target achieved! Keep up the great work!'}
            </p>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Determined Hours */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-white font-medium">Defined Hours</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Target:</span>
                    <span className="text-white font-semibold">{stats.determinedHours}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Completed:</span>
                    <span className="text-green-400 font-bold">{stats.determinedCompleted}h</span>
                  </div>
                  <Progress 
                    value={(stats.determinedCompleted / stats.determinedHours) * 100} 
                    className="h-2 bg-gray-700"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Practice-assigned structured learning
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Self-Allocated Hours */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-white font-medium">Personal Hours</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Target:</span>
                    <span className="text-white font-semibold">{stats.selfAllocatedHours}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Completed:</span>
                    <span className="text-green-400 font-bold">{stats.selfAllocatedCompleted}h</span>
                  </div>
                  <Progress 
                    value={(stats.selfAllocatedCompleted / stats.selfAllocatedHours) * 100} 
                    className="h-2 bg-gray-700"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Self-directed learning activities
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-white font-medium">Summary</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Activities Logged:</span>
                    <Badge variant="outline" className="text-blue-300 border-blue-500">
                      {activities.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Progress:</span>
                    <Badge 
                      variant="outline" 
                      className={
                        stats.percentageComplete >= 100 
                          ? 'text-green-300 border-green-500' 
                          : stats.percentageComplete >= 75 
                          ? 'text-blue-300 border-blue-500'
                          : stats.percentageComplete >= 50
                          ? 'text-yellow-300 border-yellow-500'
                          : 'text-red-300 border-red-500'
                      }
                    >
                      {stats.percentageComplete.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Hours to Go:</span>
                    <span className="text-white font-bold">{stats.hoursRemaining.toFixed(1)}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Recent CPD Activities */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="bg-gray-800">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-green-400" />
            Recent CPD Activities
          </CardTitle>
          <CardDescription className="text-gray-300 font-medium">
            Your logged CPD activities and learning outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-gray-800">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No CPD activities logged yet</p>
              <p className="text-sm mt-1">Start logging your CPD to track your progress!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id} className="bg-gray-700 border-gray-600 hover:border-gray-500 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <h4 className="font-semibold text-white">{activity.title}</h4>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-300 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.hours_claimed}h
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(activity.activity_date).toLocaleDateString()}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={getCPDTypeColor(activity.type)}
                          >
                            {activity.type}
                          </Badge>
                        </div>

                        {activity.learnings_captured && (
                          <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600">
                            <p className="text-xs text-gray-400 mb-1 font-medium">What I Learned:</p>
                            <p className="text-sm text-white">{activity.learnings_captured}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommended CPD */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="bg-gray-800">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            Recommended CPD Activities
          </CardTitle>
          <CardDescription className="text-gray-300 font-medium">
            Personalized recommendations based on your skill gaps and development goals
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-gray-800">
          {recommendations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No recommendations available yet</p>
              <p className="text-sm mt-1">Complete your skills assessment to get personalized CPD recommendations!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={getUrgencyColor(rec.urgency)}
                          >
                            {rec.urgency?.toUpperCase()}
                          </Badge>
                          <h4 className="font-semibold text-white">
                            {rec.recommended_cpd_type}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-gray-300 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{rec.estimated_hours}h
                          </span>
                          {rec.skills && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {(rec.skills as any).name}
                            </span>
                          )}
                          <Badge variant="outline" className="text-purple-300 border-purple-500">
                            Priority: {rec.priority_score.toFixed(1)}
                          </Badge>
                        </div>

                        {rec.skills && (
                          <p className="text-xs text-gray-400 mt-2">
                            Category: {(rec.skills as any).category}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-300 border-purple-500 hover:bg-purple-500/20"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CPDOverview;

