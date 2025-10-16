import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, User, BookOpen, TrendingUp, Award, 
  Target, Calendar, Mail, MessageSquare, AlertCircle,
  CheckCircle, Clock, Users, Brain, Lightbulb
} from 'lucide-react';
import { getMentoringRelationships } from '@/lib/api/mentoring';

interface TeamMemberProfile {
  // Basic info
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  joinedDate: string;
  
  // Skills assessment
  totalSkills: number;
  assessedSkills: number;
  avgSkillLevel: number;
  topSkills: Array<{ name: string; level: number; category: string }>;
  criticalGaps: Array<{ name: string; currentLevel: number; requiredLevel: number; gap: number }>;
  
  // Recent improvements
  recentImprovements: Array<{
    skillName: string;
    previousLevel: number;
    currentLevel: number;
    improvement: number;
    assessedAt: string;
  }>;
  
  // CPD Activities
  recentCPD: Array<{
    id: string;
    title: string;
    category: string;
    hours: number;
    completedAt: string;
    notes?: string;
  }>;
  totalCPDHours: number;
  cpdThisYear: number;
  
  // Mentoring
  mentoringRelationships: Array<{
    id: string;
    type: 'mentor' | 'mentee';
    partnerName: string;
    status: string;
    matchedSkills: string[];
    startDate?: string;
    sessionsCompleted: number;
  }>;
  
  // VARK Learning Style
  varkAssessmentCompleted: boolean;
  varkResult?: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
    primaryStyle: string;
    secondaryStyle?: string;
  };
  
  // Development goals
  activeGoals: Array<{
    id: string;
    title: string;
    targetDate: string;
    progress: number;
    status: string;
  }>;
}

export default function TeamMemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TeamMemberProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAccessAndLoadProfile();
  }, [memberId, user]);

  async function checkAccessAndLoadProfile() {
    if (!memberId || !user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user has admin/partner/director access
      const { data: currentUser, error: userError } = await supabase
        .from('practice_members')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (userError) throw userError;

      const allowedRoles = ['owner', 'admin', 'partner', 'director'];
      const userHasAccess = currentUser && allowedRoles.includes(currentUser.role.toLowerCase());

      setHasAccess(userHasAccess);

      if (!userHasAccess) {
        setError('You do not have permission to view team member profiles');
        setLoading(false);
        return;
      }

      // Load comprehensive profile
      await loadProfileData(memberId);
    } catch (error: any) {
      console.error('[TeamMemberProfile] Error:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  async function loadProfileData(memberId: string) {
    try {
      // 1. Basic member info
      const { data: memberData, error: memberError } = await supabase
        .from('practice_members')
        .select('id, full_name, email, role, created_at, vark_assessment_completed, vark_result')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // 2. Skills assessments
      const { data: assessments, error: assessmentsError } = await supabase
        .from('skill_assessments')
        .select('skill_id, current_level, assessed_at, skills(id, name, category, required_level)')
        .eq('team_member_id', memberId)
        .order('assessed_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // 3. CPD activities
      const { data: cpdActivities, error: cpdError } = await supabase
        .from('cpd_activities')
        .select('*')
        .eq('practice_member_id', memberId)
        .order('activity_date', { ascending: false })
        .limit(10);

      if (cpdError) throw cpdError;

      // 4. Development goals
      const { data: goals, error: goalsError } = await supabase
        .from('development_goals')
        .select('*')
        .eq('team_member_id', memberId)
        .in('status', ['in_progress', 'not_started'])
        .order('target_date', { ascending: true });

      if (goalsError) throw goalsError;

      // 5. Mentoring relationships
      const mentoringData = await getMentoringRelationships(memberId);

      // Process skills data
      const totalSkills = assessments?.length || 0;
      const avgSkillLevel = assessments && assessments.length > 0
        ? assessments.reduce((sum, a) => sum + (a.current_level || 0), 0) / assessments.length
        : 0;

      // Top skills (level 4-5)
      const topSkills = assessments
        ?.filter(a => a.current_level >= 4 && a.skills)
        .map(a => ({
          name: (a.skills as any).name,
          level: a.current_level,
          category: (a.skills as any).category
        }))
        .slice(0, 10) || [];

      // Critical gaps (current < required)
      const criticalGaps = assessments
        ?.filter(a => a.skills && a.current_level < (a.skills as any).required_level)
        .map(a => ({
          name: (a.skills as any).name,
          currentLevel: a.current_level,
          requiredLevel: (a.skills as any).required_level,
          gap: (a.skills as any).required_level - a.current_level
        }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 10) || [];

      // Recent improvements (find skills assessed multiple times)
      const skillHistory = new Map<string, Array<{ level: number; date: string }>>();
      assessments?.forEach(a => {
        if (!a.skills) return;
        const skillName = (a.skills as any).name;
        if (!skillHistory.has(skillName)) {
          skillHistory.set(skillName, []);
        }
        skillHistory.get(skillName)!.push({
          level: a.current_level,
          date: a.assessed_at
        });
      });

      const recentImprovements = Array.from(skillHistory.entries())
        .filter(([_, history]) => history.length > 1)
        .map(([skillName, history]) => {
          const sorted = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const current = sorted[0];
          const previous = sorted[1];
          return {
            skillName,
            previousLevel: previous.level,
            currentLevel: current.level,
            improvement: current.level - previous.level,
            assessedAt: current.date
          };
        })
        .filter(imp => imp.improvement > 0)
        .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())
        .slice(0, 5);

      // CPD stats
      const currentYear = new Date().getFullYear();
      const cpdThisYear = cpdActivities
        ?.filter(cpd => new Date(cpd.activity_date).getFullYear() === currentYear)
        .reduce((sum, cpd) => sum + (cpd.hours_claimed || 0), 0) || 0;
      const totalCPDHours = cpdActivities
        ?.reduce((sum, cpd) => sum + (cpd.hours_claimed || 0), 0) || 0;

      // Process mentoring relationships
      const mentoringRelationships = await Promise.all(
        mentoringData.map(async (rel: any) => {
          const isMentor = rel.mentor_id === memberId;
          const partnerId = isMentor ? rel.mentee_id : rel.mentor_id;
          
          // Get partner name
          const { data: partner } = await supabase
            .from('practice_members')
            .select('full_name')
            .eq('id', partnerId)
            .single();

          // Get session count
          const { count: sessionsCompleted } = await supabase
            .from('mentoring_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('relationship_id', rel.id)
            .eq('status', 'completed');

          return {
            id: rel.id,
            type: isMentor ? 'mentor' : 'mentee',
            partnerName: partner?.full_name || 'Unknown',
            status: rel.status,
            matchedSkills: rel.matched_skills || [],
            startDate: rel.start_date,
            sessionsCompleted: sessionsCompleted || 0
          };
        })
      );

      const profileData: TeamMemberProfile = {
        id: memberData.id,
        name: memberData.full_name,
        email: memberData.email,
        role: memberData.role,
        department: undefined, // Department field doesn't exist in schema
        joinedDate: memberData.created_at,
        
        totalSkills: totalSkills,
        assessedSkills: totalSkills,
        avgSkillLevel,
        topSkills,
        criticalGaps,
        
        recentImprovements,
        
        recentCPD: cpdActivities?.map(cpd => ({
          id: cpd.id,
          title: cpd.title || cpd.activity_type,
          category: cpd.category || 'General',
          hours: cpd.hours_claimed,
          completedAt: cpd.activity_date,
          notes: cpd.notes
        })) || [],
        totalCPDHours,
        cpdThisYear,
        
        mentoringRelationships,
        
        varkAssessmentCompleted: memberData.vark_assessment_completed || false,
        varkResult: memberData.vark_result as any,
        
        activeGoals: goals?.map(g => ({
          id: g.id,
          title: g.title,
          targetDate: g.target_date,
          progress: g.progress || 0,
          status: g.status
        })) || []
      };

      setProfile(profileData);
      setLoading(false);
    } catch (error: any) {
      console.error('[TeamMemberProfile] Error loading profile:', error);
      setError(error.message);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-red-900">Access Denied</h3>
                <p className="text-red-700 mt-1">{error || 'You do not have permission to view this page.'}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/team')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Team Management
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-500">Team member not found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/team')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Team Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/team?tab=admin')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Team Management
          </Button>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className="text-sm">
                    {profile.role}
                  </Badge>
                  {profile.department && (
                    <span className="text-gray-600">{profile.department}</span>
                  )}
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.joinedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Skills Assessed</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.assessedSkills}</p>
                </div>
                <Award className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Skill Level</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.avgSkillLevel.toFixed(1)}</p>
                  <p className="text-xs text-gray-500">out of 5.0</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">CPD Hours (Year)</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.cpdThisYear}</p>
                  <p className="text-xs text-gray-500">{profile.totalCPDHours} total</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Goals</p>
                  <p className="text-2xl font-bold text-gray-900">{profile.activeGoals.length}</p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* VARK Learning Style */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  VARK Learning Style
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Preferred learning modalities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.varkAssessmentCompleted && profile.varkResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-sm text-gray-600">Visual</div>
                        <div className="text-xl font-bold text-blue-700">{profile.varkResult.visual}%</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm text-gray-600">Auditory</div>
                        <div className="text-xl font-bold text-green-700">{profile.varkResult.auditory}%</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-sm text-gray-600">Reading</div>
                        <div className="text-xl font-bold text-purple-700">{profile.varkResult.reading}%</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-sm text-gray-600">Kinesthetic</div>
                        <div className="text-xl font-bold text-orange-700">{profile.varkResult.kinesthetic}%</div>
                      </div>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-600">Primary Learning Style</p>
                      <p className="text-lg font-bold text-gray-900">{profile.varkResult.primaryStyle}</p>
                      {profile.varkResult.secondaryStyle && (
                        <p className="text-sm text-gray-600 mt-1">
                          Secondary: {profile.varkResult.secondaryStyle}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>VARK assessment not completed</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Top Skills
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Strongest competencies (Level 4-5)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.topSkills.length > 0 ? (
                  <div className="space-y-3">
                    {profile.topSkills.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{skill.name}</p>
                          <p className="text-xs text-gray-500">{skill.category}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          Level {skill.level}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No advanced skills yet</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Improvements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recent Improvements
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Skills that have leveled up
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.recentImprovements.length > 0 ? (
                  <div className="space-y-3">
                    {profile.recentImprovements.map((imp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{imp.skillName}</p>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            +{imp.improvement}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>Level {imp.previousLevel} → {imp.currentLevel}</span>
                          <span>•</span>
                          <span>{new Date(imp.assessedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent improvements tracked</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Critical Skill Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Critical Skill Gaps
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Skills below required level
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.criticalGaps.length > 0 ? (
                  <div className="space-y-4">
                    {profile.criticalGaps.slice(0, 5).map((gap, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-gray-900">{gap.name}</p>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                            Gap: {gap.gap}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">
                              Current: {gap.currentLevel} / Target: {gap.requiredLevel}
                            </div>
                            <Progress value={(gap.currentLevel / gap.requiredLevel) * 100} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No critical skill gaps</p>
                )}
              </CardContent>
            </Card>

            {/* Recent CPD */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Recent CPD Activities
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Last 10 completed activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.recentCPD.length > 0 ? (
                  <div className="space-y-3">
                    {profile.recentCPD.map((cpd) => (
                      <div key={cpd.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cpd.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Badge variant="secondary">{cpd.category}</Badge>
                            <span>•</span>
                            <span>{cpd.hours}h</span>
                            <span>•</span>
                            <span>{new Date(cpd.completedAt).toLocaleDateString()}</span>
                          </div>
                          {cpd.notes && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{cpd.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No CPD activities recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Mentoring Relationships */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Mentoring Relationships
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Active mentoring connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.mentoringRelationships.length > 0 ? (
                  <div className="space-y-3">
                    {profile.mentoringRelationships.map((rel) => (
                      <div key={rel.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{rel.partnerName}</p>
                            <Badge
                              variant="outline"
                              className={rel.type === 'mentor' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}
                            >
                              {rel.type === 'mentor' ? '👨‍🏫 Mentoring' : '👨‍🎓 Mentee'}
                            </Badge>
                          </div>
                          <Badge variant="secondary">{rel.status}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>Skills: {rel.matchedSkills.slice(0, 3).join(', ')}</p>
                          <p>Sessions completed: {rel.sessionsCompleted}</p>
                          {rel.startDate && (
                            <p>Started: {new Date(rel.startDate).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No active mentoring relationships</p>
                )}
              </CardContent>
            </Card>

            {/* Active Development Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Active Development Goals
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Current learning objectives
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.activeGoals.length > 0 ? (
                  <div className="space-y-4">
                    {profile.activeGoals.map((goal) => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-gray-900">{goal.title}</p>
                          <Badge variant="secondary">{goal.status}</Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Progress: {goal.progress}%</span>
                            <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No active development goals</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

