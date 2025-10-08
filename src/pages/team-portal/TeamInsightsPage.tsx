import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Lightbulb,
  BarChart3,
  Shield
} from 'lucide-react';

interface TeamInsight {
  category: string;
  userAverage: number;
  teamAverage: number;
  userPercentile: number;
  gap: number;
}

const TeamInsightsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<TeamInsight[]>([]);
  const [topTeamSkills, setTopTeamSkills] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [overallStats, setOverallStats] = useState({
    userAverage: 0,
    teamAverage: 0,
    userPercentile: 50,
    strengthsCount: 0,
    gapsCount: 0
  });

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get practice member
      const { data: member } = await supabase
        .from('practice_members')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!member) return;

      // Get user's assessments
      const { data: userAssessments } = await supabase
        .from('skill_assessments')
        .select(`
          *,
          skill:skill_id (*)
        `)
        .eq('team_member_id', member.id);

      // Get team averages by category (anonymized)
      const { data: teamAverages, error } = await supabase
        .rpc('get_team_skill_averages', {
          p_practice_id: member.practice_id
        });

      if (error) {
        console.error('Error loading team averages:', error);
      }

      // Calculate category insights
      const categoryInsights: Record<string, TeamInsight> = {};
      
      userAssessments?.forEach(assessment => {
        const category = assessment.skill?.category;
        if (!category) return;

        if (!categoryInsights[category]) {
          categoryInsights[category] = {
            category,
            userAverage: 0,
            teamAverage: 0,
            userPercentile: 50,
            gap: 0
          };
        }
      });

      // Calculate user averages by category
      Object.keys(categoryInsights).forEach(category => {
        const categoryAssessments = userAssessments?.filter(a => a.skill?.category === category) || [];
        const userAvg = categoryAssessments.length > 0
          ? categoryAssessments.reduce((sum, a) => sum + (a.current_level || 0), 0) / categoryAssessments.length
          : 0;

        const teamCategoryAvg = teamAverages?.find(t => t.category === category);
        const teamAvg = teamCategoryAvg?.avg_current_level || 0;

        categoryInsights[category].userAverage = userAvg;
        categoryInsights[category].teamAverage = teamAvg;
        categoryInsights[category].gap = userAvg - teamAvg;
        
        // Calculate percentile (simplified - would need more data for accuracy)
        if (userAvg > teamAvg) {
          categoryInsights[category].userPercentile = 50 + Math.min(50, ((userAvg - teamAvg) / teamAvg) * 50);
        } else if (userAvg < teamAvg) {
          categoryInsights[category].userPercentile = 50 - Math.min(50, ((teamAvg - userAvg) / teamAvg) * 50);
        }
      });

      setInsights(Object.values(categoryInsights));

      // Calculate overall stats
      const userOverallAvg = userAssessments && userAssessments.length > 0
        ? userAssessments.reduce((sum, a) => sum + (a.current_level || 0), 0) / userAssessments.length
        : 0;

      const teamOverallAvg = teamAverages && teamAverages.length > 0
        ? teamAverages.reduce((sum, t) => sum + parseFloat(t.avg_current_level || 0), 0) / teamAverages.length
        : 0;

      const strengthsCount = Object.values(categoryInsights).filter(c => c.gap > 0.5).length;
      const gapsCount = Object.values(categoryInsights).filter(c => c.gap < -0.5).length;

      setOverallStats({
        userAverage: userOverallAvg,
        teamAverage: teamOverallAvg,
        userPercentile: userOverallAvg > teamOverallAvg ? 60 : userOverallAvg < teamOverallAvg ? 40 : 50,
        strengthsCount,
        gapsCount
      });

      // Get top team skills (skills with highest team averages)
      const topSkills = teamAverages
        ?.sort((a, b) => parseFloat(b.avg_current_level) - parseFloat(a.avg_current_level))
        .slice(0, 5)
        .map(t => ({
          name: t.skill_name,
          category: t.category,
          teamAverage: parseFloat(t.avg_current_level),
          userLevel: userAssessments?.find(a => a.skill?.name === t.skill_name)?.current_level || 0
        })) || [];

      setTopTeamSkills(topSkills);

      // Generate recommendations
      const recs = Object.values(categoryInsights)
        .filter(c => c.gap < -0.5)
        .sort((a, b) => a.gap - b.gap)
        .slice(0, 3)
        .map(c => ({
          category: c.category,
          gap: Math.abs(c.gap),
          recommendation: `Consider developing your ${c.category} skills to align with team standards.`
        }));

      setRecommendations(recs);

    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-400';
    if (percentile >= 50) return 'text-blue-400';
    if (percentile >= 25) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading team insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Team Insights</h1>
        <p className="text-gray-400">See how your skills compare with the team (anonymized)</p>
        
        <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <strong>Privacy Notice:</strong> All team data is anonymized and aggregated. 
            Individual team member information is never displayed.
          </div>
        </div>
      </div>

      {/* Overall Comparison */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          Overall Comparison
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Your Score */}
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Your Average</div>
            <div className="text-5xl font-bold text-blue-400 mb-2">
              {overallStats.userAverage.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Out of 5.0</div>
          </div>

          {/* Comparison Visual */}
          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-xs">
              <div className="h-8 bg-gray-700 rounded-full relative">
                {/* Team Average Marker */}
                <div 
                  className="absolute top-0 h-full w-1 bg-yellow-400"
                  style={{ left: `${(overallStats.teamAverage / 5) * 100}%` }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="text-xs text-yellow-400 font-medium">Team</div>
                  </div>
                </div>

                {/* Your Score */}
                <div 
                  className="absolute top-0 h-full w-2 bg-blue-500 rounded-full"
                  style={{ left: `${(overallStats.userAverage / 5) * 100}%` }}
                >
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    <div className="text-xs text-blue-400 font-medium">You</div>
                  </div>
                </div>
              </div>

              {/* Scale */}
              <div className="flex justify-between mt-12 text-xs text-gray-500">
                <span>0</span>
                <span>2.5</span>
                <span>5.0</span>
              </div>
            </div>
          </div>

          {/* Team Average */}
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Team Average</div>
            <div className="text-5xl font-bold text-yellow-400 mb-2">
              {overallStats.teamAverage.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Across all skills</div>
          </div>
        </div>

        {/* Your Ranking */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p className="text-gray-400 mb-2">Your Overall Ranking</p>
          <p className={`text-2xl font-bold ${getPercentileColor(overallStats.userPercentile)}`}>
            {getPercentileLabel(overallStats.userPercentile)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-white mb-6">Skills by Category</h2>

        <div className="space-y-4">
          {insights.sort((a, b) => b.gap - a.gap).map(insight => (
            <div key={insight.category} className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">{insight.category}</h3>
                
                {insight.gap > 0.5 ? (
                  <span className="flex items-center gap-1 text-green-400 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Above Team
                  </span>
                ) : insight.gap < -0.5 ? (
                  <span className="flex items-center gap-1 text-orange-400 text-sm">
                    <TrendingDown className="w-4 h-4" />
                    Below Team
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">On Par</span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Your Avg</div>
                  <div className="text-blue-400 font-bold">{insight.userAverage.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Team Avg</div>
                  <div className="text-yellow-400 font-bold">{insight.teamAverage.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Difference</div>
                  <div className={`font-bold ${
                    insight.gap > 0 ? 'text-green-400' : insight.gap < 0 ? 'text-orange-400' : 'text-gray-400'
                  }`}>
                    {insight.gap > 0 ? '+' : ''}{insight.gap.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Percentile */}
              <div className="mt-3 pt-3 border-t border-gray-600">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Your Ranking:</span>
                  <span className={getPercentileColor(insight.userPercentile)}>
                    {getPercentileLabel(insight.userPercentile)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Strengths vs Team */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-400" />
            Your Strengths ({overallStats.strengthsCount} categories)
          </h3>

          {overallStats.strengthsCount > 0 ? (
            <div className="space-y-3">
              {insights
                .filter(i => i.gap > 0.5)
                .sort((a, b) => b.gap - a.gap)
                .map(insight => (
                  <div key={insight.category} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <span className="text-white">{insight.category}</span>
                    <span className="text-green-400 font-bold">+{insight.gap.toFixed(1)}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Complete more assessments to identify your strengths relative to the team.
            </p>
          )}
        </div>

        {/* Development Opportunities */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-400" />
            Development Opportunities ({overallStats.gapsCount} categories)
          </h3>

          {overallStats.gapsCount > 0 ? (
            <div className="space-y-3">
              {insights
                .filter(i => i.gap < -0.5)
                .sort((a, b) => a.gap - b.gap)
                .map(insight => (
                  <div key={insight.category} className="flex items-center justify-between p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <span className="text-white">{insight.category}</span>
                    <span className="text-orange-400 font-bold">{insight.gap.toFixed(1)}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Great! You're on par or above team average in all assessed categories.
            </p>
          )}
        </div>
      </div>

      {/* Top Team Skills */}
      {topTeamSkills.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Top Team Skills
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Skills where the team excels (highest average levels)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topTeamSkills.map((skill, idx) => (
              <div key={idx} className="bg-gray-700/50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">{idx + 1}</div>
                <p className="text-white font-medium text-sm mb-2">{skill.name}</p>
                <p className="text-xs text-gray-400 mb-3">{skill.category}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Team:</span>
                  <span className="text-yellow-400 font-bold">{skill.teamAverage.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">You:</span>
                  <span className={`font-bold ${
                    skill.userLevel >= skill.teamAverage ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {skill.userLevel.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Personalized Recommendations
          </h3>

          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{rec.category}</h4>
                  <span className="text-orange-400 text-sm">Gap: {rec.gap.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-400">{rec.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamInsightsPage;

