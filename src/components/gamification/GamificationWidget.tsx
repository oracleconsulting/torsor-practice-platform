import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, TrendingUp, Award, Flame, Star, ChevronRight,
  Zap, Target, Medal, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getMemberPoints, getMemberAchievements } from '@/lib/api/gamification/achievement-engine';
import { getMemberLeaderboardPosition } from '@/lib/api/gamification/leaderboard';
import { getActiveMilestones } from '@/lib/api/gamification/milestone-tracker';
import type { LeaderboardEntry } from '@/lib/api/gamification/leaderboard';
import type { MemberAchievement } from '@/lib/api/gamification/achievement-engine';
import type { MemberMilestoneProgress } from '@/lib/api/gamification/milestone-tracker';

interface GamificationWidgetProps {
  memberId: string;
  compact?: boolean; // Compact mode for smaller displays
  showMilestones?: boolean;
  className?: string;
}

export default function GamificationWidget({
  memberId,
  compact = false,
  showMilestones = true,
  className = ''
}: GamificationWidgetProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<any>(null);
  const [leaderboardPosition, setLeaderboardPosition] = useState<LeaderboardEntry | null>(null);
  const [recentAchievements, setRecentAchievements] = useState<MemberAchievement[]>([]);
  const [activeMilestones, setActiveMilestones] = useState<MemberMilestoneProgress[]>([]);

  useEffect(() => {
    loadGamificationData();
  }, [memberId]);

  const loadGamificationData = async () => {
    try {
      setLoading(true);

      // Load in parallel
      const [pointsData, positionData, achievementsData, milestonesData] = await Promise.all([
        getMemberPoints(memberId),
        getMemberLeaderboardPosition(memberId),
        getMemberAchievements(memberId),
        showMilestones ? getActiveMilestones(memberId) : Promise.resolve([])
      ]);

      setPoints(pointsData);
      setLeaderboardPosition(positionData);
      setRecentAchievements(achievementsData.slice(0, 3)); // Last 3 achievements
      setActiveMilestones(milestonesData.slice(0, 2)); // Top 2 active milestones
    } catch (error) {
      console.error('[Gamification Widget] Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'silver': return 'text-gray-500 bg-gray-50 border-gray-200';
      case 'gold': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'platinum': return 'text-indigo-500 bg-indigo-50 border-indigo-200';
      case 'diamond': return 'text-cyan-400 bg-cyan-50 border-cyan-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank <= 3) return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
    if (rank <= 10) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4" />;
    if (rank <= 3) return <Medal className="w-4 h-4" />;
    return <Trophy className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Your Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className={`${className} cursor-pointer hover:shadow-lg transition-shadow`} onClick={() => navigate('/achievements')}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getRankBadgeColor(leaderboardPosition?.current_rank || 999)}`}>
                {getRankIcon(leaderboardPosition?.current_rank || 999)}
              </div>
              <div>
                <div className="text-sm font-medium">Rank #{leaderboardPosition?.current_rank || '-'}</div>
                <div className="text-xs text-gray-500">{points?.total_points || 0} points</div>
              </div>
            </div>
            {points?.current_streak_days > 0 && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="text-sm font-bold">{points.current_streak_days}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Your Progress
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/achievements')}>
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <CardDescription>Track your achievements and growth</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Points & Rank Summary */}
        <div className="grid grid-cols-3 gap-4">
          {/* Total Points */}
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-900">{points?.total_points || 0}</div>
            <div className="text-xs text-blue-600">Total Points</div>
          </div>

          {/* Current Rank */}
          <div className={`text-center p-4 rounded-lg border ${getRankBadgeColor(leaderboardPosition?.current_rank || 999)}`}>
            {getRankIcon(leaderboardPosition?.current_rank || 999)}
            <div className="text-2xl font-bold mt-2">#{leaderboardPosition?.current_rank || '-'}</div>
            <div className="text-xs opacity-90">Your Rank</div>
            {leaderboardPosition && leaderboardPosition.rank_change > 0 && (
              <div className="text-xs font-medium mt-1 flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3" />
                +{leaderboardPosition.rank_change}
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-orange-900">{points?.current_streak_days || 0}</div>
            <div className="text-xs text-orange-600">Day Streak 🔥</div>
            {points?.longest_streak_days > points?.current_streak_days && (
              <div className="text-xs text-orange-500 mt-1">Best: {points.longest_streak_days}</div>
            )}
          </div>
        </div>

        {/* Points Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Points by Category</div>
          <div className="space-y-1">
            <PointsBreakdownBar 
              label="Assessments" 
              value={points?.assessment_points || 0} 
              total={points?.total_points || 1}
              color="bg-purple-500"
            />
            <PointsBreakdownBar 
              label="CPD Learning" 
              value={points?.cpd_points || 0} 
              total={points?.total_points || 1}
              color="bg-green-500"
            />
            <PointsBreakdownBar 
              label="Skills" 
              value={points?.skill_points || 0} 
              total={points?.total_points || 1}
              color="bg-blue-500"
            />
            <PointsBreakdownBar 
              label="Achievements" 
              value={points?.achievement_points || 0} 
              total={points?.total_points || 1}
              color="bg-yellow-500"
            />
          </div>
        </div>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Recent Achievements
            </div>
            <div className="space-y-2">
              {recentAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getTierColor(achievement.achievement?.tier || 'bronze')}`}
                >
                  <Award className="w-5 h-5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{achievement.achievement?.name}</div>
                    <div className="text-xs opacity-75">+{achievement.achievement?.points_awarded} points</div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {achievement.achievement?.tier}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Milestones */}
        {showMilestones && activeMilestones.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Active Goals
            </div>
            <div className="space-y-3">
              {activeMilestones.map((milestone) => (
                <div key={milestone.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{milestone.milestone?.name}</span>
                    <span className="text-gray-500">
                      {milestone.current_value}/{milestone.target_value} {milestone.milestone?.goal_unit}
                    </span>
                  </div>
                  <Progress value={milestone.percentage_complete} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {milestone.percentage_complete.toFixed(0)}% complete
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Button 
          onClick={() => navigate('/achievements')} 
          className="w-full"
          variant="outline"
        >
          View All Achievements & Leaderboard
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Helper component for points breakdown
function PointsBreakdownBar({ 
  label, 
  value, 
  total, 
  color 
}: { 
  label: string; 
  value: number; 
  total: number; 
  color: string; 
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-600 w-24">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs font-medium text-gray-700 w-12 text-right">{value}</div>
    </div>
  );
}

