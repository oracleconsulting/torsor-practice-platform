import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Target, 
  TrendingUp, 
  BookOpen, 
  Award,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  GraduationCap,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSkills: 0,
    assessedSkills: 0,
    overallScore: 0,
    lastUpdated: null as Date | null,
    activeGoals: 0,
    topStrengths: [] as any[],
    developmentAreas: [] as any[],
  });
  const [goals, setGoals] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [varkCompleted, setVarkCompleted] = useState(true); // Default to true to hide banner until loaded
  const [varkBannerDismissed, setVarkBannerDismissed] = useState(() => {
    return localStorage.getItem('vark_banner_dismissed') === 'true';
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get practice member
      const { data: member } = await supabase
        .from('practice_members')
        .select('id, vark_assessment_completed')
        .eq('user_id', session.user.id)
        .single();

      if (!member) return;

      // Set VARK completion status
      setVarkCompleted(member.vark_assessment_completed || false);

      // Get skill assessments
      const { data: assessments } = await supabase
        .from('skill_assessments')
        .select(`
          *,
          skill:skill_id (
            id,
            name,
            category
          )
        `)
        .eq('team_member_id', member.id);

      // Get all skills count
      const { count: totalSkillsCount } = await supabase
        .from('skills')
        .select('*', { count: 'only', head: true });

      // Calculate stats
      const assessedCount = assessments?.length || 0;
      const avgScore = assessedCount > 0
        ? assessments!.reduce((sum, a) => sum + (a.current_level || 0), 0) / assessedCount
        : 0;

      // Get top 5 strengths
      const topStrengths = (assessments || [])
        .filter(a => a.current_level >= 4)
        .sort((a, b) => (b.current_level || 0) - (a.current_level || 0))
        .slice(0, 5);

      // Get development areas (high interest, low skill)
      const developmentAreas = (assessments || [])
        .filter(a => (a.interest_level || 0) > (a.current_level || 0) + 1)
        .sort((a, b) => 
          ((b.interest_level || 0) - (b.current_level || 0)) - 
          ((a.interest_level || 0) - (a.current_level || 0))
        )
        .slice(0, 3);

      // Get last assessment date
      const lastUpdated = assessments && assessments.length > 0
        ? new Date(Math.max(...assessments.map(a => new Date(a.assessment_date).getTime())))
        : null;

      // Get active goals
      const { data: goalsData } = await supabase
        .from('development_goals')
        .select('*')
        .eq('practice_member_id', member.id)
        .in('status', ['active', 'planned'])
        .order('target_date', { ascending: true })
        .limit(3);

      setStats({
        totalSkills: totalSkillsCount || 0,
        assessedSkills: assessedCount,
        overallScore: avgScore,
        lastUpdated,
        activeGoals: goalsData?.length || 0,
        topStrengths,
        developmentAreas,
      });

      setGoals(goalsData || []);

      // Mock recommendations (can be enhanced with AI later)
      setRecommendations([
        {
          title: 'Complete Your Skills Assessment',
          description: 'You have skills waiting to be assessed',
          action: 'Start Assessment',
          url: '/team-portal/assessment',
          priority: assessedCount < (totalSkillsCount || 0) * 0.5 ? 'high' : 'low',
        },
        {
          title: 'Set Development Goals',
          description: 'Plan your growth for the next quarter',
          action: 'Create Goals',
          url: '/team-portal/development',
          priority: (goalsData?.length || 0) === 0 ? 'high' : 'low',
        },
      ].filter(r => r.priority === 'high'));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-400';
    if (score >= 3) return 'text-blue-400';
    if (score >= 2) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-500/50 rounded-2xl p-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-white font-medium">
          Here's your skills and development overview
        </p>
      </div>

      {/* VARK Assessment Banner */}
      {!varkCompleted && !varkBannerDismissed && (
        <div className="bg-gradient-to-r from-green-900/60 to-emerald-900/60 border border-green-500/50 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <GraduationCap className="w-6 h-6 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-white font-bold text-lg mb-1">
                  Discover Your Learning Style
                </h2>
                <p className="text-white font-medium mb-2">
                  Take the VARK Assessment to help us tailor training recommendations to match how you learn best.
                </p>
                <p className="text-green-300 text-sm font-medium">
                  ⏱️ Takes only 5 minutes • Visual, Auditory, Reading, Kinesthetic
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/team-portal/vark-assessment')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors whitespace-nowrap"
              >
                Take VARK Assessment
              </button>
              <button
                onClick={() => {
                  setVarkBannerDismissed(true);
                  localStorage.setItem('vark_banner_dismissed', 'true');
                }}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Overall Score</h3>
            <Target className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getScoreColor(stats.overallScore)}`}>
              {stats.overallScore.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm">/  5.0</span>
          </div>
          <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${getProgressColor((stats.overallScore / 5) * 100)}`}
              style={{ width: `${(stats.overallScore / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Skills Assessed */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Skills Assessed</h3>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{stats.assessedSkills}</span>
            <span className="text-gray-500 text-sm">/ {stats.totalSkills}</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {Math.round((stats.assessedSkills / stats.totalSkills) * 100)}% complete
          </p>
        </div>

        {/* Active Goals */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Active Goals</h3>
            <BookOpen className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{stats.activeGoals}</span>
            <span className="text-gray-500 text-sm">in progress</span>
          </div>
          <button
            onClick={() => navigate('/team-portal/development')}
            className="text-sm text-purple-400 hover:text-purple-300 mt-2"
          >
            View all →
          </button>
        </div>

        {/* Last Updated */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Last Updated</h3>
            <Clock className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-white text-lg font-semibold">
            {stats.lastUpdated 
              ? new Date(stats.lastUpdated).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short',
                  year: 'numeric'
                })
              : 'Never'
            }
          </div>
          <button
            onClick={() => navigate('/team-portal/assessment')}
            className="text-sm text-yellow-400 hover:text-yellow-300 mt-2"
          >
            Update now →
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-yellow-900/40 border border-yellow-500/50 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-bold text-white">Recommended Actions</h2>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{rec.title}</p>
                  <p className="text-sm text-white font-medium">{rec.description}</p>
                </div>
                <button
                  onClick={() => navigate(rec.url)}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors whitespace-nowrap"
                >
                  {rec.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Your Top Strengths
            </h2>
            <button
              onClick={() => navigate('/team-portal/profile')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all →
            </button>
          </div>
          
          {stats.topStrengths.length > 0 ? (
            <div className="space-y-3">
              {stats.topStrengths.map((strength, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-medium">{strength.skill?.name}</p>
                    <p className="text-sm text-gray-400">{strength.skill?.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < strength.current_level 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-gray-400 text-sm font-medium">
                      {strength.current_level}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Complete your assessment to see your strengths</p>
            </div>
          )}
        </div>

        {/* Development Areas */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Development Opportunities
            </h2>
            <button
              onClick={() => navigate('/team-portal/development')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              Create goals →
            </button>
          </div>
          
          {stats.developmentAreas.length > 0 ? (
            <div className="space-y-4">
              {stats.developmentAreas.map((area, idx) => (
                <div key={idx} className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">{area.skill?.name}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">
                      Current: <span className="text-orange-400">{area.current_level}/5</span>
                    </span>
                    <span className="text-gray-400">
                      Interest: <span className="text-green-400">{area.interest_level}/5</span>
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/team-portal/development')}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Create goal <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Update your interests to see recommendations</p>
            </div>
          )}
        </div>
      </div>

      {/* Active Goals */}
      {goals.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Active Goals</h2>
            <button
              onClick={() => navigate('/team-portal/development')}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View all →
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <div key={goal.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-medium">{goal.title}</h3>
                  <span className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${goal.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600 text-gray-300'}
                  `}>
                    {goal.status}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{goal.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getProgressColor(goal.progress_percentage)}`}
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  Due: {new Date(goal.target_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/team-portal/assessment')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl p-6 text-left transition-all transform hover:scale-105"
        >
          <Target className="w-8 h-8 text-white mb-3" />
          <h3 className="text-white font-bold text-lg mb-1">Update Skills</h3>
          <p className="text-blue-100 text-sm">Complete your assessment</p>
        </button>

        <button
          onClick={() => navigate('/team-portal/development')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl p-6 text-left transition-all transform hover:scale-105"
        >
          <BookOpen className="w-8 h-8 text-white mb-3" />
          <h3 className="text-white font-bold text-lg mb-1">Set Goals</h3>
          <p className="text-purple-100 text-sm">Plan your development</p>
        </button>

        <button
          onClick={() => navigate('/team-portal/team')}
          className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl p-6 text-left transition-all transform hover:scale-105"
        >
          <TrendingUp className="w-8 h-8 text-white mb-3" />
          <h3 className="text-white font-bold text-lg mb-1">Team Insights</h3>
          <p className="text-green-100 text-sm">Compare with team</p>
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;

