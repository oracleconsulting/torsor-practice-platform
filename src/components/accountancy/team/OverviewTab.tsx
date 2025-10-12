import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  Users, 
  Target,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuickActions from './QuickActions';
import LeaderboardWidget from './LeaderboardWidget';
import ProgressStreaks from './ProgressStreaks';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountancyContext } from '@/contexts/AccountancyContext';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  skills: any[];
}

interface SkillCategory {
  id: string;
  name: string;
  skills: any[];
}

interface OverviewTabProps {
  teamMembers: TeamMember[];
  skillCategories: SkillCategory[];
  onNavigate: (tab: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  teamMembers, 
  skillCategories,
  onNavigate 
}) => {
  const { user } = useAuth();
  const { practice } = useAccountancyContext();
  const currentUserId = user?.id || '';
  const currentPracticeId = practice?.id || '';

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalSkills = skillCategories.flatMap(cat => cat.skills).length;
    const totalAssessments = teamMembers.reduce((sum, member) => sum + member.skills.length, 0);
    
    const criticalGaps = teamMembers.flatMap(member => 
      member.skills.filter((skill: any) => {
        const targetLevel = skill.targetLevel || skill.requiredLevel || 3;
        return (targetLevel - skill.currentLevel) >= 2;
      })
    ).length;
    
    const highInterest = teamMembers.flatMap(member => 
      member.skills.filter((skill: any) => (skill.interestLevel || 0) >= 4)
    ).length;
    
    const avgSkillLevel = totalAssessments > 0
      ? teamMembers.reduce((sum, member) => 
          sum + member.skills.reduce((s: number, skill: any) => s + skill.currentLevel, 0), 0
        ) / totalAssessments
      : 0;
    
    const teamCapability = (avgSkillLevel / 5) * 100;
    
    return {
      totalMembers: teamMembers.length,
      totalSkills,
      totalAssessments,
      criticalGaps,
      highInterest,
      avgSkillLevel: avgSkillLevel.toFixed(1),
      teamCapability: Math.round(teamCapability),
    };
  }, [teamMembers, skillCategories]);

  // Quick actions
  const quickActions = [
    {
      title: 'Start Assessment',
      description: 'Assess team member skills',
      icon: Target,
      color: 'blue',
      action: () => onNavigate('assessment'),
    },
    {
      title: 'View Gaps',
      description: 'Identify skill gaps',
      icon: AlertTriangle,
      color: 'amber',
      action: () => onNavigate('gaps'),
    },
    {
      title: 'Plan Development',
      description: 'Create learning plans',
      icon: Award,
      color: 'green',
      action: () => onNavigate('planning'),
    },
  ];

  // Top performers
  const topPerformers = useMemo(() => {
    return [...teamMembers]
      .map(member => ({
        ...member,
        avgLevel: member.skills.length > 0
          ? member.skills.reduce((sum: number, skill: any) => sum + skill.currentLevel, 0) / member.skills.length
          : 0
      }))
      .sort((a, b) => b.avgLevel - a.avgLevel)
      .slice(0, 5);
  }, [teamMembers]);

  return (
    <div className="space-y-6">
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>Team Capability</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#000000' }}>{metrics.teamCapability}%</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#000000' }}>Avg level: {metrics.avgSkillLevel}/5</p>
              </div>
              <TrendingUp className="w-12 h-12" style={{ color: '#000000', opacity: 0.2 }} />
            </div>
            <Progress value={metrics.teamCapability} className="mt-4 bg-blue-400" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>Critical Gaps</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#000000' }}>{metrics.criticalGaps}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#000000' }}>Need attention</p>
              </div>
              <AlertTriangle className="w-12 h-12" style={{ color: '#000000', opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>High Interest</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#000000' }}>{metrics.highInterest}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#000000' }}>Skills to develop</p>
              </div>
              <Sparkles className="w-12 h-12" style={{ color: '#000000', opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#000000' }}>Team Members</p>
                <p className="text-3xl font-bold mt-1" style={{ color: '#000000' }}>{metrics.totalMembers}</p>
                <p className="text-xs mt-1 font-medium" style={{ color: '#000000' }}>{metrics.totalAssessments} assessments</p>
              </div>
              <Users className="w-12 h-12" style={{ color: '#000000', opacity: 0.2 }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NEW: Quick Actions to All Features */}
      <QuickActions />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <action.icon className="w-8 h-8 text-white font-medium group-hover:text-blue-500 mb-2" />
                <h3 className="font-semibold text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-100 font-medium mt-1">{action.description}</p>
                <ArrowRight className="w-4 h-4 text-white font-medium group-hover:text-blue-500 mt-2" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gamification & Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Streaks */}
        {currentUserId && currentPracticeId && (
          <ProgressStreaks 
            memberId={currentUserId} 
            practiceId={currentPracticeId}
          />
        )}

        {/* Leaderboard */}
        {currentPracticeId && (
          <LeaderboardWidget 
            practiceId={currentPracticeId}
            leaderboardType="top_points"
          />
        )}

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Top Performers
            </CardTitle>
            <CardDescription>Team members with highest skill levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((member, index) => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      <p className="text-sm text-gray-100 font-medium">{member.role}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {member.avgLevel.toFixed(1)}/5
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Recommended actions based on your data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.criticalGaps > 0 && (
                <div className="flex gap-3 p-3 rounded-lg border-l-4 border-red-500 bg-red-50">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Address Critical Gaps</p>
                    <p className="text-sm text-red-700 mt-1">
                      {metrics.criticalGaps} skills need immediate attention
                    </p>
                    <Button 
                      variant="link" 
                      className="text-red-700 p-0 h-auto mt-1"
                      onClick={() => onNavigate('gaps')}
                    >
                      View Gap Analysis →
                    </Button>
                  </div>
                </div>
              )}
              
              {metrics.highInterest > 0 && (
                <div className="flex gap-3 p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50">
                  <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">High Development Potential</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {metrics.highInterest} skills with high team interest
                    </p>
                    <Button 
                      variant="link" 
                      className="text-blue-700 p-0 h-auto mt-1"
                      onClick={() => onNavigate('planning')}
                    >
                      Create Development Plans →
                    </Button>
                  </div>
                </div>
              )}

              {metrics.totalAssessments === 0 && (
                <div className="flex gap-3 p-3 rounded-lg border-l-4 border-amber-500 bg-amber-50">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900">No Assessments Yet</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Start by assessing your team's skills
                    </p>
                    <Button 
                      variant="link" 
                      className="text-amber-700 p-0 h-auto mt-1"
                      onClick={() => onNavigate('assessment')}
                    >
                      Start Assessment →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;

