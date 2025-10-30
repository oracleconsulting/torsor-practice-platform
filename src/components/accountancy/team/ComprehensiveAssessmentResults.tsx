/**
 * Comprehensive Assessment Results Component
 * Displays results from all 5 assessments with visualizations
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase/client';
import { 
  Briefcase, Users, Zap, Brain, Shield, 
  TrendingUp, AlertCircle, CheckCircle2, Target,
  MessageSquare, Clock, Lightbulb, Heart
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell
} from 'recharts';

interface ComprehensiveAssessmentResultsProps {
  practiceMemberId: string;
  memberName: string;
}

export const ComprehensiveAssessmentResults: React.FC<ComprehensiveAssessmentResultsProps> = ({
  practiceMemberId,
  memberName
}) => {
  const [loading, setLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<any>({});

  useEffect(() => {
    loadAllAssessments();
  }, [practiceMemberId]);

  const loadAllAssessments = async () => {
    setLoading(true);
    try {
      // Load all 5 assessments in parallel
      const [workingPrefs, belbin, motivational, eq, conflict] = await Promise.all([
        supabase.from('working_preferences').select('*').eq('practice_member_id', practiceMemberId).single(),
        supabase.from('belbin_assessments').select('*').eq('practice_member_id', practiceMemberId).single(),
        supabase.from('motivational_drivers').select('*').eq('practice_member_id', practiceMemberId).single(),
        supabase.from('eq_assessments').select('*').eq('practice_member_id', practiceMemberId).single(),
        supabase.from('conflict_style_assessments').select('*').eq('practice_member_id', practiceMemberId).single()
      ]);

      setAssessmentData({
        workingPreferences: workingPrefs.data,
        belbin: belbin.data,
        motivational: motivational.data,
        eq: eq.data,
        conflict: conflict.data
      });

      console.log('[ComprehensiveResults] Loaded all assessments:', {
        workingPrefs: !!workingPrefs.data,
        belbin: !!belbin.data,
        motivational: !!motivational.data,
        eq: !!eq.data,
        conflict: !!conflict.data
      });
    } catch (error) {
      console.error('[ComprehensiveResults] Error loading assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading assessment results...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { workingPreferences, belbin, motivational, eq, conflict } = assessmentData;

  // Calculate completion status
  const completionStatus = {
    workingPreferences: !!workingPreferences,
    belbin: !!belbin,
    motivational: !!motivational,
    eq: !!eq,
    conflict: !!conflict
  };
  const completedCount = Object.values(completionStatus).filter(Boolean).length;
  const totalCount = 5;

  // Prepare radar chart data for EQ
  const eqRadarData = eq ? [
    { domain: 'Self Awareness', score: eq.self_awareness_score },
    { domain: 'Self Management', score: eq.self_management_score },
    { domain: 'Social Awareness', score: eq.social_awareness_score },
    { domain: 'Relationship Mgmt', score: eq.relationship_management_score }
  ] : [];

  // Prepare bar chart data for motivational drivers
  const motivationalBarData = motivational ? Object.entries(motivational.driver_scores || {}).map(([driver, score]) => ({
    driver: driver.charAt(0).toUpperCase() + driver.slice(1),
    score: score
  })) : [];

  // Prepare bar chart data for conflict styles
  const conflictBarData = conflict ? Object.entries(conflict.style_scores || {}).map(([style, score]) => ({
    style: style.charAt(0).toUpperCase() + style.slice(1),
    score: score
  })) : [];

  // Prepare bar chart data for Belbin roles
  const belbinBarData = belbin && belbin.role_scores ? Object.entries(belbin.role_scores).map(([role, score]) => ({
    role: role,
    score: score as number
  })).sort((a, b) => b.score - a.score).slice(0, 5) : [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{memberName}'s Professional Profile</CardTitle>
              <CardDescription>Comprehensive assessment results across 5 dimensions</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{completedCount}/{totalCount}</div>
              <div className="text-sm text-gray-600">Assessments Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={(completedCount / totalCount) * 100} className="h-2" />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="working">Working Prefs</TabsTrigger>
          <TabsTrigger value="belbin">Team Roles</TabsTrigger>
          <TabsTrigger value="motivational">Motivation</TabsTrigger>
          <TabsTrigger value="eq">EQ</TabsTrigger>
          <TabsTrigger value="conflict">Conflict</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Working Preferences */}
            <Card className={!workingPreferences ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Working Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workingPreferences ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Communication:</span>
                      <Badge>{workingPreferences.communication_style}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Work Style:</span>
                      <Badge>{workingPreferences.work_style}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Environment:</span>
                      <Badge>{workingPreferences.environment}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not completed</p>
                )}
              </CardContent>
            </Card>

            {/* Belbin Team Roles */}
            <Card className={!belbin ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                  Team Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {belbin ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Primary:</span>
                      <Badge className="bg-purple-600">{belbin.primary_role}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Secondary:</span>
                      <Badge variant="outline">{belbin.secondary_role}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not completed</p>
                )}
              </CardContent>
            </Card>

            {/* Motivational Drivers */}
            <Card className={!motivational ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Motivation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {motivational ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Primary:</span>
                      <Badge className="bg-yellow-600">{motivational.primary_driver}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Secondary:</span>
                      <Badge variant="outline">{motivational.secondary_driver}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not completed</p>
                )}
              </CardContent>
            </Card>

            {/* Emotional Intelligence */}
            <Card className={!eq ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                  Emotional Intelligence
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eq ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Overall EQ:</span>
                      <Badge className="bg-blue-600">{eq.overall_eq_score}/100</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Level:</span>
                      <Badge variant="outline">{eq.eq_level}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not completed</p>
                )}
              </CardContent>
            </Card>

            {/* Conflict Style */}
            <Card className={!conflict ? 'opacity-50' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-orange-600" />
                  Conflict Style
                </CardTitle>
              </CardHeader>
              <CardContent>
                {conflict ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Primary:</span>
                      <Badge className="bg-orange-600">{conflict.primary_style}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Secondary:</span>
                      <Badge variant="outline">{conflict.secondary_style}</Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not completed</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Visual Overview */}
          {eq && (
            <Card>
              <CardHeader>
                <CardTitle>Emotional Intelligence Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={eqRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="domain" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="EQ Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Working Preferences Tab */}
        <TabsContent value="working" className="space-y-6">
          {workingPreferences ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Working Preferences Profile</CardTitle>
                  <CardDescription>How you prefer to work and collaborate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <MessageSquare className="w-4 h-4" />
                        Communication Style
                      </div>
                      <Badge className="text-base">{workingPreferences.communication_style}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Briefcase className="w-4 h-4" />
                        Work Approach
                      </div>
                      <Badge className="text-base">{workingPreferences.work_style}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Lightbulb className="w-4 h-4" />
                        Preferred Environment
                      </div>
                      <Badge className="text-base">{workingPreferences.environment}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Target className="w-4 h-4" />
                        Feedback Preference
                      </div>
                      <Badge className="text-base">{workingPreferences.feedback_preference}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Users className="w-4 h-4" />
                        Collaboration Style
                      </div>
                      <Badge className="text-base">{workingPreferences.collaboration_preference}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-900 font-medium">
                        <Clock className="w-4 h-4" />
                        Time Management
                      </div>
                      <Badge className="text-base">{workingPreferences.time_management}</Badge>
                    </div>
                  </div>

                  {workingPreferences.summary && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{workingPreferences.summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-gray-500">Working Preferences assessment not completed</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Belbin Team Roles Tab */}
        <TabsContent value="belbin" className="space-y-6">
          {belbin ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Team Role Profile</CardTitle>
                  <CardDescription>Your natural contributions to team success</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Primary Role</div>
                      <div className="text-lg font-bold text-purple-900">{belbin.primary_role}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Secondary Role</div>
                      <div className="text-lg font-bold text-purple-900">{belbin.secondary_role}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Tertiary Role</div>
                      <div className="text-lg font-bold text-purple-900">{belbin.tertiary_role}</div>
                    </div>
                  </div>

                  {belbinBarData.length > 0 && (
                    <div className="pt-4">
                      <h4 className="font-medium text-gray-900 mb-4">Role Strength Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={belbinBarData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="role" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="score" fill="#9333ea">
                            {belbinBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {belbin.team_contribution && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Team Contribution</h4>
                      <p className="text-gray-700">{belbin.team_contribution}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-gray-500">Belbin Team Roles assessment not completed</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Motivational Drivers Tab */}
        <TabsContent value="motivational" className="space-y-6">
          {motivational ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Motivational Profile</CardTitle>
                  <CardDescription>What drives and energizes you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Primary Driver</div>
                      <div className="text-lg font-bold text-yellow-900 capitalize">{motivational.primary_driver}</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Secondary Driver</div>
                      <div className="text-lg font-bold text-yellow-900 capitalize">{motivational.secondary_driver}</div>
                    </div>
                  </div>

                  {motivationalBarData.length > 0 && (
                    <div className="pt-4">
                      <h4 className="font-medium text-gray-900 mb-4">Motivational Driver Scores</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={motivationalBarData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="driver" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="score" fill="#eab308">
                            {motivationalBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {motivational.motivation_summary && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{motivational.motivation_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-gray-500">Motivational Drivers assessment not completed</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* EQ Tab */}
        <TabsContent value="eq" className="space-y-6">
          {eq ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Emotional Intelligence Profile</CardTitle>
                  <CardDescription>Your EQ across 4 key domains</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Overall EQ Score</div>
                    <div className="text-4xl font-bold text-blue-900">{eq.overall_eq_score}/100</div>
                    <Badge className="mt-2 bg-blue-600">{eq.eq_level}</Badge>
                  </div>

                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={eqRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="domain" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name="EQ Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <RechartsTooltip />
                    </RadarChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eq.strengths && eq.strengths.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          Strengths
                        </h4>
                        <ul className="space-y-1">
                          {eq.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700">• {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {eq.development_areas && eq.development_areas.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                          Development Areas
                        </h4>
                        <ul className="space-y-1">
                          {eq.development_areas.map((area: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700">• {area}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {eq.eq_summary && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{eq.eq_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-gray-500">Emotional Intelligence assessment not completed</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Conflict Style Tab */}
        <TabsContent value="conflict" className="space-y-6">
          {conflict ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Conflict Style Profile</CardTitle>
                  <CardDescription>How you approach and resolve conflicts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Primary Style</div>
                      <div className="text-lg font-bold text-orange-900 capitalize">{conflict.primary_style}</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Secondary Style</div>
                      <div className="text-lg font-bold text-orange-900 capitalize">{conflict.secondary_style}</div>
                    </div>
                  </div>

                  {conflictBarData.length > 0 && (
                    <div className="pt-4">
                      <h4 className="font-medium text-gray-900 mb-4">Conflict Style Distribution</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={conflictBarData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="style" />
                          <YAxis />
                          <RechartsTooltip />
                          <Bar dataKey="score" fill="#f97316">
                            {conflictBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {conflict.conflict_summary && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{conflict.conflict_summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-48">
                <p className="text-gray-500">Conflict Style assessment not completed</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComprehensiveAssessmentResults;

