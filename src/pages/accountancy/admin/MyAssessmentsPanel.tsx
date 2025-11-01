/**
 * My Assessments Panel
 * Direct access to all assessments for admin users with skills heatmap
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { 
  Brain, Users, Briefcase, Target, Heart, Shield, 
  BookOpen, CheckCircle2, Circle, ArrowRight, Grid3x3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MySkillsHeatmap from '../team/MySkillsHeatmap';

interface AssessmentStatus {
  vark: boolean;
  ocean: boolean;
  working: boolean;
  belbin: boolean;
  motivational: boolean;
  eq: boolean;
  conflict: boolean;
}

const MyAssessmentsPanel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AssessmentStatus>({
    vark: false,
    ocean: false,
    working: false,
    belbin: false,
    motivational: false,
    eq: false,
    conflict: false
  });
  const [practiceMemberId, setPracticeMemberId] = useState<string | null>(null);

  useEffect(() => {
    loadAssessmentStatus();
  }, []);

  const loadAssessmentStatus = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get practice member ID
      const { data: member } = await supabase
        .from('practice_members')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!member) return;
      setPracticeMemberId(member.id);

      // Check each assessment
      const [vark, ocean, working, belbin, motivational, eq, conflict] = await Promise.all([
        supabase.from('learning_preferences').select('id').eq('practice_member_id', member.id).single(),
        supabase.from('personality_assessments').select('id').eq('practice_member_id', member.id).single(),
        supabase.from('working_preferences').select('id').eq('practice_member_id', member.id).single(),
        supabase.from('belbin_assessments').select('id').eq('practice_member_id', member.id).single(),
        supabase.from('motivational_drivers').select('id').eq('practice_member_id', member.id).single(),
        supabase.from('eq_assessments').select('id').eq('practice_member_id', member.id).single(),
        supabase.from('conflict_style_assessments').select('id').eq('practice_member_id', member.id).single()
      ]);

      setStatus({
        vark: !!vark.data,
        ocean: !!ocean.data,
        working: !!working.data,
        belbin: !!belbin.data,
        motivational: !!motivational.data,
        eq: !!eq.data,
        conflict: !!conflict.data
      });
    } catch (error) {
      console.error('[MyAssessments] Error loading status:', error);
    } finally {
      setLoading(false);
    }
  };

  const assessments = [
    {
      key: 'vark' as keyof AssessmentStatus,
      title: 'VARK Learning Styles',
      description: 'Discover your preferred learning style: Visual, Auditory, Reading/Writing, or Kinesthetic',
      icon: BookOpen,
      color: 'indigo',
      route: '/team-member/assessments',
      resultsRoute: '/team-member/assessments?tab=vark-results'
    },
    {
      key: 'ocean' as keyof AssessmentStatus,
      title: 'OCEAN Personality',
      description: 'Explore your Big Five personality traits: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism',
      icon: Brain,
      color: 'purple',
      route: '/team-member/assessments',
      resultsRoute: '/team-member/assessments?tab=ocean-results'
    },
    {
      key: 'working' as keyof AssessmentStatus,
      title: 'Working Preferences',
      description: 'Understand your communication style, work style, and environment preferences',
      icon: Briefcase,
      color: 'blue',
      route: '/team-member/assessments',
      resultsRoute: '/team-member/assessments'
    },
    {
      key: 'belbin' as keyof AssessmentStatus,
      title: 'Belbin Team Roles',
      description: 'Identify your team role strengths: Innovator, Analyst, Leader, Harmoniser, and more',
      icon: Users,
      color: 'green',
      route: '/team-member/assessments',
      resultsRoute: '/team-member/assessments'
    },
    {
      key: 'motivational' as keyof AssessmentStatus,
      title: 'Motivational Drivers',
      description: 'Discover what drives you: Achievement, Autonomy, Affiliation, Influence, Security, or Recognition',
      icon: Target,
      color: 'yellow',
      route: '/team-member/assessments',
      resultsRoute: '/team-member/assessments'
    },
    {
      key: 'eq' as keyof AssessmentStatus,
      title: 'Emotional Intelligence (EQ)',
      description: 'Assess your emotional awareness, self-management, social skills, and relationship abilities',
      icon: Heart,
      color: 'red',
      route: '/team-member/assessments',
      resultsRoute: '/team-member/assessments'
    },
    {
      key: 'conflict' as keyof AssessmentStatus,
      title: 'Conflict Resolution Style',
      description: 'Understand your approach to conflict: Competing, Collaborating, Compromising, Avoiding, or Accommodating',
      icon: Shield,
      color: 'pink',
      route: '/team-member/assessments',
      resultsRoute: '/team-member/assessments'
    }
  ];

  const completedCount = Object.values(status).filter(Boolean).length;
  const totalCount = assessments.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const colorClasses = {
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', button: 'bg-indigo-600 hover:bg-indigo-700' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', button: 'bg-purple-600 hover:bg-purple-700' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', button: 'bg-blue-600 hover:bg-blue-700' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', button: 'bg-green-600 hover:bg-green-700' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', button: 'bg-yellow-600 hover:bg-yellow-700' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', button: 'bg-red-600 hover:bg-red-700' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', button: 'bg-pink-600 hover:bg-pink-700' },
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            My Professional Assessments
          </CardTitle>
          <CardDescription className="text-base">
            Complete your professional development assessments to unlock personalized insights and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold text-blue-600">{completionPercentage}%</div>
            <div className="flex-1">
              <div className="mb-2">
                <div className="text-sm text-gray-600 mb-1">
                  {completedCount} of {totalCount} assessments completed
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {completedCount === totalCount 
                  ? '🎉 All assessments complete! View your comprehensive profile.' 
                  : `${totalCount - completedCount} remaining to complete your professional profile`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Heatmap Section */}
      <Card className="border-2 border-amber-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Grid3x3 className="w-6 h-6 text-amber-600" />
                My Skills Heatmap
              </CardTitle>
              <CardDescription className="text-base">
                Visual overview of your 111 advisory skills across all categories
              </CardDescription>
            </div>
            <Button
              onClick={() => navigate('/team-member/skills-heatmap')}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              Full View
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MySkillsHeatmap />
        </CardContent>
      </Card>

      {/* Assessment Cards */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Professional Development Assessments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assessments.map((assessment) => {
          const isCompleted = status[assessment.key];
          const colors = colorClasses[assessment.color as keyof typeof colorClasses];
          const Icon = assessment.icon;

          return (
            <Card key={assessment.key} className={`border-2 ${isCompleted ? 'border-green-300 bg-green-50' : colors.border + ' ' + colors.bg}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-200' : 'bg-white'}`}>
                      <Icon className={`w-6 h-6 ${isCompleted ? 'text-green-700' : colors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-gray-900">{assessment.title}</CardTitle>
                      {isCompleted && (
                        <Badge className="mt-1 bg-green-600 text-white">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                  {!isCompleted && (
                    <Circle className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">{assessment.description}</p>
                
                <div className="flex gap-2">
                  {isCompleted ? (
                    <>
                      <Button
                        onClick={() => navigate(assessment.resultsRoute)}
                        className={`flex-1 ${colors.button} text-white`}
                      >
                        View Results
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        onClick={() => navigate(assessment.route)}
                        variant="outline"
                        className="flex-1"
                      >
                        Retake Assessment
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => navigate(assessment.route)}
                      className={`w-full ${colors.button} text-white`}
                    >
                      Start Assessment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        </div>
      </div>

      {/* Completion Message */}
      {completedCount === totalCount && (
        <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-bold text-green-900 mb-2">🎉 Assessment Suite Complete!</h3>
            <p className="text-green-800 mb-4">
              You've completed all professional assessments. Your comprehensive profile is now available.
            </p>
            <Button
              onClick={() => navigate('/accountancy/team?tab=assessment-insights')}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              View Team Insights Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyAssessmentsPanel;

