/**
 * Comprehensive Assessment Results Component
 * Displays results from all 5 assessments with visualizations
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { generateProfessionalProfile, getCurrentProfile } from '@/lib/services/llm-service';
import {
  getWorkingPreferenceDescriptor,
  getBelbinDescriptor,
  getMotivationalDescriptor,
  getEQDescriptor,
  getConflictStyleDescriptor
} from '@/lib/assessments/profile-descriptors';
import { ProfileNarrative } from './ProfileNarrative';
import { useToast } from '@/components/ui/use-toast';
import { 
  Briefcase, Users, Zap, Brain, Shield, 
  TrendingUp, AlertCircle, CheckCircle2, Target,
  MessageSquare, Clock, Lightbulb, Heart, Sparkles, Loader2
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
  const [aiProfile, setAIProfile] = useState<any>(null);
  const [generatingProfile, setGeneratingProfile] = useState(false);
  const { toast } = useToast();

  const practiceId = 'a1b2c3d4-5678-90ab-cdef-123456789abc'; // RPGCC practice ID

  useEffect(() => {
    loadAllAssessments();
    loadAIProfile();
  }, [practiceMemberId]);

  // Auto-generate profile when all assessments are complete
  useEffect(() => {
    const checkAndGenerateProfile = async () => {
      // Only proceed if we have all assessments and no existing profile
      if (!assessmentData.workingPreferences || !assessmentData.belbin || 
          !assessmentData.motivational || !assessmentData.eq || !assessmentData.conflict) {
        return;
      }

      // If profile already exists, don't regenerate
      if (aiProfile) {
        return;
      }

      // Profile doesn't exist, generate it automatically
      console.log('[ComprehensiveResults] Auto-generating profile...');
      await handleGenerateProfile();
    };

    checkAndGenerateProfile();
  }, [assessmentData, aiProfile]);

  const loadAIProfile = async () => {
    const profile = await getCurrentProfile(practiceMemberId);
    setAIProfile(profile);
  };

  const handleGenerateProfile = async () => {
    if (!assessmentData.workingPreferences || !assessmentData.belbin || 
        !assessmentData.motivational || !assessmentData.eq || !assessmentData.conflict) {
      toast({
        title: 'Incomplete Assessments',
        description: 'Please complete all 5 assessments before generating your profile.',
        variant: 'destructive'
      });
      return;
    }

    setGeneratingProfile(true);
    try {
      const result = await generateProfessionalProfile({
        practiceMemberId,
        practiceId,
        workingPreferences: assessmentData.workingPreferences,
        belbinRoles: assessmentData.belbin,
        motivationalDrivers: assessmentData.motivational,
        eqLevels: assessmentData.eq,
        conflictStyle: assessmentData.conflict,
        generatedBy: undefined  // Auto-generation without user requirement
      });

      if (result.success) {
        toast({
          title: 'Profile Generated!',
          description: 'Your AI-generated professional profile is ready.',
        });
        loadAIProfile(); // Reload to show the new profile
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('[ComprehensiveResults] Error generating profile:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingProfile(false);
    }
  };

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
  const conflictBarData = conflict && conflict.style_scores && typeof conflict.style_scores === 'object'
    ? Object.entries(conflict.style_scores).map(([style, score]) => ({
        style: style.charAt(0).toUpperCase() + style.slice(1),
        score: Number(score) || 0
      }))
    : [];

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

      {/* AI-Generated Professional Profile */}
      {completedCount === totalCount && aiProfile && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Your Professional Profile
                </CardTitle>
                <CardDescription>
                  Generated {new Date(aiProfile.generated_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button
                onClick={handleGenerateProfile}
                disabled={generatingProfile}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {generatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Regenerate Profile
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
              {/* Main Narrative */}
              <div>
                <h3 className="text-xl font-bold text-purple-900 mb-3">Your Professional Fingerprint</h3>
                <p className="text-gray-800 leading-relaxed whitespace-pre-line">{aiProfile.narrative}</p>
              </div>

              {/* Grid of Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* You Thrive When */}
                {aiProfile.optimal_environment && (
                  <Card className="bg-white/70">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-600" />
                        You Thrive When...
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                        {aiProfile.optimal_environment}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Others Value You For */}
                {aiProfile.unique_value_proposition && (
                  <Card className="bg-white/70">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-600" />
                        Others Value You For...
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                        {aiProfile.unique_value_proposition}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Synergies */}
              {aiProfile.synergies && aiProfile.synergies.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Your Superpowers in Action
                  </h4>
                  <ul className="space-y-2">
                    {aiProfile.synergies.map((synergy: string, index: number) => (
                      <li key={index} className="text-gray-700 pl-4 border-l-2 border-green-400">
                        {synergy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Creative Tensions */}
              {aiProfile.creative_tensions && aiProfile.creative_tensions.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Creative Tensions to Navigate
                  </h4>
                  <ul className="space-y-2">
                    {aiProfile.creative_tensions.map((tension: string, index: number) => (
                      <li key={index} className="text-gray-700 pl-4 border-l-2 border-amber-400">
                        {tension}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Growth Recommendations */}
              {aiProfile.growth_recommendations && aiProfile.growth_recommendations.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Growth Opportunities
                  </h4>
                  <ul className="space-y-2">
                    {aiProfile.growth_recommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-gray-700 pl-4 border-l-2 border-blue-400">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
        </Card>
      )}

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
                      <Badge className="bg-blue-600">{eq.overall_eq}/100</Badge>
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

              {/* Rich Narrative Descriptions */}
              {workingPreferences.communication_style && (
                <ProfileNarrative
                  title={getWorkingPreferenceDescriptor('communication_style', workingPreferences.communication_style)?.title || 'Communication Style'}
                  narrative={getWorkingPreferenceDescriptor('communication_style', workingPreferences.communication_style)?.narrative || ''}
                  superpower={getWorkingPreferenceDescriptor('communication_style', workingPreferences.communication_style)?.superpower}
                  growthEdge={getWorkingPreferenceDescriptor('communication_style', workingPreferences.communication_style)?.worthKnowing}
                />
              )}

              {workingPreferences.work_style && (
                <ProfileNarrative
                  title={getWorkingPreferenceDescriptor('work_style', workingPreferences.work_style)?.title || 'Work Style'}
                  narrative={getWorkingPreferenceDescriptor('work_style', workingPreferences.work_style)?.narrative || ''}
                  superpower={getWorkingPreferenceDescriptor('work_style', workingPreferences.work_style)?.superpower}
                  growthEdge={getWorkingPreferenceDescriptor('work_style', workingPreferences.work_style)?.worthKnowing}
                />
              )}

              {workingPreferences.environment && (
                <ProfileNarrative
                  title={getWorkingPreferenceDescriptor('environment', workingPreferences.environment)?.title || 'Environment Preference'}
                  narrative={getWorkingPreferenceDescriptor('environment', workingPreferences.environment)?.narrative || ''}
                  superpower={getWorkingPreferenceDescriptor('environment', workingPreferences.environment)?.superpower}
                  growthEdge={getWorkingPreferenceDescriptor('environment', workingPreferences.environment)?.worthKnowing}
                />
              )}

              {workingPreferences.time_management && (
                <ProfileNarrative
                  title={getWorkingPreferenceDescriptor('time_management', workingPreferences.time_management)?.title || 'Time Management'}
                  narrative={getWorkingPreferenceDescriptor('time_management', workingPreferences.time_management)?.narrative || ''}
                  superpower={getWorkingPreferenceDescriptor('time_management', workingPreferences.time_management)?.superpower}
                  growthEdge={getWorkingPreferenceDescriptor('time_management', workingPreferences.time_management)?.worthKnowing}
                />
              )}

              {workingPreferences.feedback_preference && (
                <ProfileNarrative
                  title={getWorkingPreferenceDescriptor('feedback_preference', workingPreferences.feedback_preference)?.title || 'Feedback Preference'}
                  narrative={getWorkingPreferenceDescriptor('feedback_preference', workingPreferences.feedback_preference)?.narrative || ''}
                  superpower={getWorkingPreferenceDescriptor('feedback_preference', workingPreferences.feedback_preference)?.superpower}
                  growthEdge={getWorkingPreferenceDescriptor('feedback_preference', workingPreferences.feedback_preference)?.worthKnowing}
                />
              )}

              {workingPreferences.collaboration_preference && (
                <ProfileNarrative
                  title={getWorkingPreferenceDescriptor('collaboration_preference', workingPreferences.collaboration_preference)?.title || 'Collaboration Preference'}
                  narrative={getWorkingPreferenceDescriptor('collaboration_preference', workingPreferences.collaboration_preference)?.narrative || ''}
                  superpower={getWorkingPreferenceDescriptor('collaboration_preference', workingPreferences.collaboration_preference)?.superpower}
                  growthEdge={getWorkingPreferenceDescriptor('collaboration_preference', workingPreferences.collaboration_preference)?.worthKnowing}
                />
              )}
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

              {/* Rich Narrative Descriptions for Belbin */}
              {belbin.primary_role && (
                <ProfileNarrative
                  title={getBelbinDescriptor(belbin.primary_role)?.title || 'Primary Role'}
                  narrative={getBelbinDescriptor(belbin.primary_role)?.narrative || ''}
                  gift={getBelbinDescriptor(belbin.primary_role)?.gift}
                  growthEdge={getBelbinDescriptor(belbin.primary_role)?.growingEdge}
                />
              )}

              {belbin.secondary_role && (
                <ProfileNarrative
                  title={`Secondary: ${getBelbinDescriptor(belbin.secondary_role)?.title || belbin.secondary_role}`}
                  narrative={getBelbinDescriptor(belbin.secondary_role)?.narrative || ''}
                  gift={getBelbinDescriptor(belbin.secondary_role)?.gift}
                  growthEdge={getBelbinDescriptor(belbin.secondary_role)?.growingEdge}
                />
              )}
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

                  {motivational.summary && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{motivational.summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rich Narrative Descriptions for Motivational Drivers */}
              {motivational.primary_driver && (
                <ProfileNarrative
                  title={getMotivationalDescriptor(motivational.primary_driver)?.title || 'Primary Driver'}
                  narrative={getMotivationalDescriptor(motivational.primary_driver)?.narrative || ''}
                  energiser={getMotivationalDescriptor(motivational.primary_driver)?.energiser}
                  growthEdge={getMotivationalDescriptor(motivational.primary_driver)?.growthEdge}
                />
              )}

              {motivational.secondary_driver && (
                <ProfileNarrative
                  title={`Secondary: ${getMotivationalDescriptor(motivational.secondary_driver)?.title || motivational.secondary_driver}`}
                  narrative={getMotivationalDescriptor(motivational.secondary_driver)?.narrative || ''}
                  energiser={getMotivationalDescriptor(motivational.secondary_driver)?.energiser}
                  growthEdge={getMotivationalDescriptor(motivational.secondary_driver)?.growthEdge}
                />
              )}
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
                    <div className="text-4xl font-bold text-blue-900">{eq.overall_eq}/100</div>
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

                  {eq.summary && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-700">{eq.summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rich Narrative Descriptions for EQ Domains */}
              {eq.self_awareness_score && (
                <ProfileNarrative
                  title={`Self-Awareness: ${getEQDescriptor('self_awareness', eq.self_awareness_score)?.title || ''}`}
                  narrative={getEQDescriptor('self_awareness', eq.self_awareness_score)?.narrative || ''}
                  strength={getEQDescriptor('self_awareness', eq.self_awareness_score)?.strength}
                  growthEdge={getEQDescriptor('self_awareness', eq.self_awareness_score)?.growingEdge}
                />
              )}

              {eq.self_management_score && (
                <ProfileNarrative
                  title={`Self-Management: ${getEQDescriptor('self_management', eq.self_management_score)?.title || ''}`}
                  narrative={getEQDescriptor('self_management', eq.self_management_score)?.narrative || ''}
                  strength={getEQDescriptor('self_management', eq.self_management_score)?.strength}
                  growthEdge={getEQDescriptor('self_management', eq.self_management_score)?.growingEdge}
                />
              )}

              {eq.social_awareness_score && (
                <ProfileNarrative
                  title={`Social Awareness: ${getEQDescriptor('social_awareness', eq.social_awareness_score)?.title || ''}`}
                  narrative={getEQDescriptor('social_awareness', eq.social_awareness_score)?.narrative || ''}
                  strength={getEQDescriptor('social_awareness', eq.social_awareness_score)?.strength}
                  growthEdge={getEQDescriptor('social_awareness', eq.social_awareness_score)?.growingEdge}
                />
              )}

              {eq.relationship_management_score && (
                <ProfileNarrative
                  title={`Relationship Management: ${getEQDescriptor('relationship_management', eq.relationship_management_score)?.title || ''}`}
                  narrative={getEQDescriptor('relationship_management', eq.relationship_management_score)?.narrative || ''}
                  strength={getEQDescriptor('relationship_management', eq.relationship_management_score)?.strength}
                  growthEdge={getEQDescriptor('relationship_management', eq.relationship_management_score)?.growingEdge}
                />
              )}
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

                  {/* Temporarily disabled chart due to rendering issues */}
                  {/* {conflictBarData.length > 0 && (
                    <div className="pt-4">
                      <h4 className="font-medium text-gray-900 mb-4">Conflict Style Distribution</h4>
                      {(() => {
                        try {
                          return (
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
                          );
                        } catch (error) {
                          console.error('[ComprehensiveResults] Chart render error:', error);
                          return <p className="text-gray-500 text-sm">Unable to display chart</p>;
                        }
                      })()}
                    </div>
                  )} */}

                  {conflict.summary && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2 text-base">Summary</h4>
                      <p className="text-gray-700 text-base leading-relaxed">{conflict.summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rich Narrative Descriptions for Conflict Style */}
              {conflict.primary_style && (() => {
                const descriptor = getConflictStyleDescriptor(conflict.primary_style);
                if (!descriptor) return null;
                return (
                  <ProfileNarrative
                    title={descriptor.title || 'Primary Style'}
                    narrative={descriptor.narrative || ''}
                    power={descriptor.power}
                    growthEdge={descriptor.growthEdge}
                  />
                );
              })()}

              {conflict.secondary_style && (() => {
                const descriptor = getConflictStyleDescriptor(conflict.secondary_style);
                if (!descriptor) return null;
                return (
                  <ProfileNarrative
                    title={`Secondary: ${descriptor.title || conflict.secondary_style}`}
                    narrative={descriptor.narrative || ''}
                    power={descriptor.power}
                    growthEdge={descriptor.growthEdge}
                  />
                );
              })()}
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

