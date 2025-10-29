import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAccountancyContext } from '@/contexts/AccountancyContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DirectReportsPanel from '@/components/accountancy/team/DirectReportsPanel';
import {
  User,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  Edit,
  Plus,
  ArrowRight,
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  Brain
} from 'lucide-react';

interface TeamMemberStats {
  totalSkills: number;
  assessedSkills: number;
  averageLevel: number;
  cpdHours: number;
  cpdActivities: number;
  mentoringActive: boolean;
}

export default function TeamMemberDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { practiceId } = useAccountancyContext();
  
  console.log('🔴🔴🔴 [TeamMemberDashboard] COMPONENT RENDERING - This should be Luke\'s portal!');
  console.log('🔴 Current URL:', window.location.href);
  console.log('🔴 User:', user?.email);
  
  // EMERGENCY FIX: If user lands here from wrong URL, redirect to correct one
  useEffect(() => {
    const currentPath = window.location.pathname;
    console.log('🔴 [TeamMemberDashboard] Path check:', currentPath);
    if (currentPath === '/team' || currentPath === '/accountancy/team') {
      console.log('🔴🔴🔴 [TeamMemberDashboard] EMERGENCY REDIRECT from wrong URL:', currentPath);
      window.location.href = '/accountancy/team-member';
    }
  }, []);
  
  const [stats, setStats] = useState<TeamMemberStats>({
    totalSkills: 0,
    assessedSkills: 0,
    averageLevel: 0,
    cpdHours: 0,
    cpdActivities: 0,
    mentoringActive: false
  });
  const [loading, setLoading] = useState(true);
  const [recentCPD, setRecentCPD] = useState<any[]>([]);
  const [viewingAsMemberId, setViewingAsMemberId] = useState<string | null>(null);
  const [viewingAsMemberName, setViewingAsMemberName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberName, setMemberName] = useState<string>('Team Member');
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('[TeamMemberDashboard] State:', {
      user: user?.email,
      userId: user?.id,
      practiceId,
      loading
    });
  }, [user, practiceId, loading]);

  useEffect(() => {
    const viewAsParam = searchParams.get('viewAs');
    
    console.log('[TeamMemberDashboard] useEffect triggered:', {
      viewAsParam,
      userId: user?.id,
      viewingAsMemberId
    });
    
    // PRIORITY 1: If viewAs parameter exists, ALWAYS load that user's data
    if (viewAsParam) {
      console.log('[Dashboard] Loading data for viewAs:', viewAsParam);
      checkAdminAndLoadMember(viewAsParam);
      return; // Exit early to prevent loading own data
    }
    
    // PRIORITY 2: Only load own data if NOT viewing as someone else
    if (user?.id && !viewingAsMemberId && !viewAsParam) {
      console.log('[Dashboard] Loading own data for user:', user.id);
      loadDashboardData();
    } else if (!user?.id) {
      console.log('[Dashboard] No user ID available');
    }
  }, [searchParams, user?.id]); // Removed 'loading' to prevent infinite loop

  // Separate effect to handle timeout if user is not loaded
  useEffect(() => {
    if (!user?.id) {
      const timeout = setTimeout(() => {
        console.log('[Dashboard] User not loaded after 3 seconds, redirecting to login');
        navigate('/auth?portal=accountancy');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [user?.id, navigate]); // Only depend on user?.id, not loading

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[Dashboard] Loading timeout after 10 seconds - forcing loading state to false');
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  const checkAdminAndLoadMember = async (memberId: string) => {
    try {
      console.log('[Dashboard] checkAdminAndLoadMember called for:', memberId);
      console.log('[Dashboard] Current user.id:', user?.id);
      
      // Immediately set viewing state to prevent override
      setViewingAsMemberId(memberId);
      
      // Check if current user is admin
      const { data: currentUser, error: userError } = await supabase
        .from('practice_members')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      console.log('[Dashboard] Current user query result:', { currentUser, userError });
      console.log('[Dashboard] Current user role:', currentUser?.role);

      const allowedRoles = ['owner', 'admin', 'partner', 'director'];
      const hasAccess = currentUser && allowedRoles.includes(currentUser.role.toLowerCase());
      console.log('[Dashboard] Has access:', hasAccess, 'Role check:', currentUser?.role?.toLowerCase(), 'in', allowedRoles);
      setIsAdmin(hasAccess);

      if (!hasAccess) {
        console.log('[Dashboard] ❌ Access denied, redirecting to own dashboard');
        navigate('/accountancy/team-member');
        return;
      }

      console.log('[Dashboard] ✅ Access granted, loading member data');
      await loadDashboardDataForMember(memberId);
    } catch (error) {
      console.error('[Dashboard] ❌ Error checking admin access:', error);
      navigate('/accountancy/team-member');
    }
  };

  const loadDashboardDataForMember = async (memberId: string) => {
    try {
      setLoading(true);

      // Get member info
      const { data: memberData } = await supabase
        .from('practice_members')
        .select('name, email')
        .eq('id', memberId)
        .single();

      setViewingAsMemberName(memberData?.name || 'Team Member');

      // **NEW: Get skill assessments from invitations table**
      const { data: invitation } = await supabase
        .from('invitations')
        .select('assessment_data, email')
        .ilike('email', memberData.email) // Case-insensitive match
        .eq('practice_id', practiceId)
        .eq('status', 'accepted')
        .single();

      // Transform JSONB into assessment-like format
      const assessments = (invitation?.assessment_data as any[] || []).map(skill => ({
        current_level: skill.current_level || 0,
        skill_id: skill.skill_id
      }));

      // Get total skills count
      const { count: totalSkillsCount } = await supabase
        .from('skills')
        .select('*', { count: 'exact', head: true });

      // Get CPD activities
      const { data: cpdData } = await supabase
        .from('cpd_activities')
        .select('hours_claimed, activity_date, title, type')
        .eq('practice_member_id', memberId)
        .order('activity_date', { ascending: false })
        .limit(5);

      // Calculate stats
      const assessedCount = assessments?.length || 0;
      const avgLevel = assessments?.reduce((sum, a) => sum + (a.current_level || 0), 0) / (assessedCount || 1);
      const totalHours = cpdData?.reduce((sum, cpd) => sum + (cpd.hours_claimed || 0), 0) || 0;

      setStats({
        totalSkills: totalSkillsCount || 0,
        assessedSkills: assessedCount,
        averageLevel: avgLevel,
        cpdHours: totalHours,
        cpdActivities: cpdData?.length || 0,
        mentoringActive: false
      });

      setRecentCPD(cpdData || []);
    } catch (error) {
      console.error('Error loading dashboard for member:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Safety check: Don't load own data if viewing as someone else
      const viewAsParam = searchParams.get('viewAs');
      if (viewAsParam || viewingAsMemberId) {
        console.log('[Dashboard] Skipping loadDashboardData - viewing as another user');
        return;
      }
      
      if (!user?.id) {
        console.log('[Dashboard] No user ID, cannot load data');
        setLoading(false);
        return;
      }
      
      console.log('[Dashboard] Loading own dashboard data for user:', user.id);
      setLoading(true);

      // First, get the practice_member record for this user
      const { data: member, error: memberError } = await supabase
        .from('practice_members')
        .select('id, name, email')
        .eq('user_id', user.id)
        .single();

      if (memberError) {
        console.error('[Dashboard] Error fetching practice member:', memberError);
        setLoading(false);
        return;
      }

      if (!member) {
        console.log('[Dashboard] No practice member found for user');
        setLoading(false);
        return;
      }

      console.log('[Dashboard] Found practice member:', member.name, member.id);

      // Set member info for UI and DirectReportsPanel
      setMemberName(member.name || 'Team Member');
      setCurrentMemberId(member.id);

      // **NEW: Get skill assessments from invitations table (single source of truth)**
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .select('assessment_data, email')
        .ilike('email', member.email) // Case-insensitive match
        .eq('practice_id', practiceId)
        .eq('status', 'accepted')
        .single();

      if (invitationError) {
        console.error('[Dashboard] Error fetching invitation:', invitationError);
      }

      console.log('[Dashboard] Invitation assessment_data length:', invitation?.assessment_data?.length || 0);

      // Transform JSONB into assessment-like format
      const assessments = (invitation?.assessment_data as any[] || []).map(skill => ({
        current_level: skill.current_level || 0,
        skill_id: skill.skill_id
      }));

      // Get total skills count
      const { count: totalSkillsCount, error: skillsCountError } = await supabase
        .from('skills')
        .select('*', { count: 'exact', head: true });

      if (skillsCountError) {
        console.error('[Dashboard] Error fetching skills count:', skillsCountError);
      }

      // Get CPD activities
      const { data: cpdData, error: cpdError } = await supabase
        .from('cpd_activities')
        .select('hours_claimed, activity_date, title, type')
        .eq('practice_member_id', member.id)
        .order('activity_date', { ascending: false })
        .limit(5);

      if (cpdError) {
        console.error('[Dashboard] Error fetching CPD data:', cpdError);
      }

      // Calculate stats
      const assessedCount = assessments?.length || 0;
      const avgLevel = assessments?.reduce((sum, a) => sum + (a.current_level || 0), 0) / (assessedCount || 1);
      const totalHours = cpdData?.reduce((sum, cpd) => sum + (cpd.hours_claimed || 0), 0) || 0;

      console.log('[Dashboard] Stats calculated:', {
        totalSkills: totalSkillsCount,
        assessedSkills: assessedCount,
        averageLevel: avgLevel,
        cpdHours: totalHours,
        cpdActivities: cpdData?.length || 0
      });

      setStats({
        totalSkills: totalSkillsCount || 0,
        assessedSkills: assessedCount,
        averageLevel: avgLevel,
        cpdHours: totalHours,
        cpdActivities: cpdData?.length || 0,
        mentoringActive: false // TODO: Check mentoring status
      });

      setRecentCPD(cpdData || []);
      
      console.log('[Dashboard] Data loading complete');
    } catch (error) {
      console.error('[Dashboard] Error loading dashboard:', error);
    } finally {
      console.log('[Dashboard] Setting loading to false');
      setLoading(false);
    }
  };

  const completionPercentage = (stats.assessedSkills / Math.max(stats.totalSkills, 1)) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Admin Viewing Banner */}
        {viewingAsMemberId && (
          <Card className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500 p-2 rounded-full">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      Admin View: Viewing {viewingAsMemberName}'s Portal
                    </p>
                    <p className="text-sm text-gray-600">
                      You're seeing exactly what {viewingAsMemberName} sees and has access to
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate('/accountancy/team?tab=admin')}
                  variant="outline"
                  className="bg-white hover:bg-gray-50"
                >
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Back to Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {viewingAsMemberName || memberName}!
          </h1>
          <p className="text-gray-600">
            Here's {viewingAsMemberId ? 'their' : 'your'} personal development overview
          </p>
        </div>

        {/* Stats Overview - Clickable Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
            onClick={() => navigate('/team-member/skills-heatmap')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Skills Assessed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.assessedSkills}
                    <span className="text-lg text-gray-600">/{stats.totalSkills}</span>
                  </p>
                </div>
                <Target className="h-10 w-10 text-amber-600" />
              </div>
              <Progress value={completionPercentage} className="mt-3" />
              <p className="text-xs text-gray-600 mt-2">Click to view and edit skills</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200"
            onClick={() => navigate('/team-member/assessments')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Assessments</p>
                  <p className="text-lg font-semibold text-gray-900">
                    VARK + OCEAN
                  </p>
                </div>
                <Brain className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600 mt-2">Complete your profile</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
            onClick={() => navigate('/team-member/cpd')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">CPD Hours</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.cpdHours}</p>
                </div>
                <Award className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-xs text-gray-600 mt-2">
                {stats.cpdActivities} activities • Click to log more
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
            onClick={() => navigate('/team-member/mentoring')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Mentoring</p>
                  <Badge 
                    variant={stats.mentoringActive ? 'default' : 'secondary'}
                    className="text-sm"
                  >
                    {stats.mentoringActive ? 'Active' : 'Not Active'}
                  </Badge>
                </div>
                <Users className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-xs text-gray-600 mt-2">Click to find mentors</p>
            </CardContent>
          </Card>
        </div>

        {/* Direct Reports Panel - Only show if user has direct reports */}
        {currentMemberId && practiceId && !viewingAsMemberId && (
          <div className="mb-8">
            <DirectReportsPanel 
              managerId={currentMemberId}
              practiceId={practiceId}
            />
          </div>
        )}

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* My Assignments */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-black">My Assignments</CardTitle>
                    <CardDescription className="text-black">
                      View your client work and log hours
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Active Projects</span>
                  <span className="font-bold text-green-600">Track work</span>
                </div>
                <Button 
                  onClick={() => navigate('/team-member/assignments')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Assignments
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Knowledge Base */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-black">Knowledge Base</CardTitle>
                    <CardDescription className="text-black">
                      Access resources and leadership library
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  Books, guides, articles, and training materials
                </div>
                <Button 
                  onClick={() => navigate('/team-member/knowledge-base')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Browse Resources
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent CPD Activity */}
        {recentCPD.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Recent CPD Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCPD.map((cpd, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{cpd.title || 'CPD Activity'}</p>
                        <p className="text-sm text-gray-600">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(cpd.activity_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{cpd.hours_claimed} hrs</p>
                      <Badge variant="outline" className="text-xs">
                        {cpd.type || 'Training'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

