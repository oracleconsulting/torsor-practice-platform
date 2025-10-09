import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Target, 
  Users, 
  BarChart3,
  Download,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  CategoryScale
} from 'chart.js';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend, CategoryScale);

interface Skill {
  id: string;
  name: string;
  description: string;
  requiredLevel: number;
  category: string;
}

interface TeamMemberSkill {
  memberId: string;
  skillId: string;
  currentLevel: number;
  interestLevel?: number;
  targetLevel: number;
  lastAssessed: Date;
  certifications?: string[];
  notes?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  skills: TeamMemberSkill[];
  overallScore?: number;
}

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  skills: Skill[];
}

interface GapData {
  skillId: string;
  skillName: string;
  category: string;
  requiredLevel: number;
  avgCurrentLevel: number;
  gap: number;
  memberCount: number;
  avgInterest: number;
  priority: number;
  businessImpact: 'high' | 'medium' | 'low';
  affectedMembers: TeamMember[];
}

interface InterestSkillMismatch {
  member: TeamMember;
  skill: Skill;
  currentLevel: number;
  interestLevel: number;
  gap: number;
  developmentPotential: number;
}

interface GapAnalysisProps {
  teamMembers: TeamMember[];
  skillCategories: SkillCategory[];
  showHeatmap: boolean;
  priorityAlgorithm: 'weighted' | 'simple';
}

const GapAnalysis: React.FC<GapAnalysisProps> = ({
  teamMembers,
  skillCategories,
  showHeatmap,
  priorityAlgorithm
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minGapThreshold, setMinGapThreshold] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>('priority');

  // Calculate gaps for each skill
  const gapData = useMemo((): GapData[] => {
    const allSkills = skillCategories.flatMap(cat => cat.skills);
    
    return allSkills
      .filter(skill => selectedCategory === 'all' || skill.category === selectedCategory)
      .map(skill => {
        const skillAssessments = teamMembers
          .flatMap(member => member.skills)
          .filter(memberSkill => memberSkill.skillId === skill.id);

        if (skillAssessments.length === 0) {
          return {
            skillId: skill.id,
            skillName: skill.name,
            category: skill.category,
            requiredLevel: skill.requiredLevel,
            avgCurrentLevel: 0,
            gap: skill.requiredLevel,
            memberCount: 0,
            avgInterest: 0,
            priority: skill.requiredLevel * 5, // High priority for unassessed skills
            businessImpact: 'high' as const,
            affectedMembers: []
          };
        }

        const avgCurrentLevel = skillAssessments.reduce((sum, s) => sum + s.currentLevel, 0) / skillAssessments.length;
        const gap = Math.max(0, skill.requiredLevel - avgCurrentLevel);
        const avgInterest = skillAssessments.reduce((sum, s) => sum + (s.interestLevel || 3), 0) / skillAssessments.length;
        
        // Calculate priority based on algorithm
        let priority: number;
        if (priorityAlgorithm === 'weighted') {
          priority = gap * (skill.requiredLevel / 5) * (avgInterest / 5) * skillAssessments.length;
        } else {
          priority = gap * skillAssessments.length;
        }

        // Determine business impact
        let businessImpact: 'high' | 'medium' | 'low' = 'low';
        if (gap >= 2 || skill.requiredLevel >= 4) businessImpact = 'high';
        else if (gap >= 1 || skill.requiredLevel >= 3) businessImpact = 'medium';

        const affectedMembers = teamMembers.filter(member =>
          member.skills.some(s => s.skillId === skill.id && s.currentLevel < skill.requiredLevel)
        );

        return {
          skillId: skill.id,
          skillName: skill.name,
          category: skill.category,
          requiredLevel: skill.requiredLevel,
          avgCurrentLevel,
          gap,
          memberCount: affectedMembers.length,
          avgInterest,
          priority,
          businessImpact,
          affectedMembers
        };
      })
      .filter(gap => gap.gap >= minGapThreshold)
      .sort((a, b) => {
        switch (sortBy) {
          case 'gap':
            return b.gap - a.gap;
          case 'members':
            return b.memberCount - a.memberCount;
          case 'interest':
            return b.avgInterest - a.avgInterest;
          case 'priority':
          default:
            return b.priority - a.priority;
        }
      });
  }, [teamMembers, skillCategories, selectedCategory, minGapThreshold, sortBy, priorityAlgorithm]);

  // Find interest-skill mismatches (high interest, low skill)
  const mismatches = useMemo((): InterestSkillMismatch[] => {
    const mismatches: InterestSkillMismatch[] = [];

    teamMembers.forEach(member => {
      member.skills.forEach(memberSkill => {
        const skill = skillCategories
          .flatMap(cat => cat.skills)
          .find(s => s.id === memberSkill.skillId);

        if (skill && memberSkill.interestLevel && memberSkill.interestLevel >= 4 && memberSkill.currentLevel <= 2) {
          const developmentPotential = memberSkill.interestLevel - memberSkill.currentLevel;
          mismatches.push({
            member,
            skill,
            currentLevel: memberSkill.currentLevel,
            interestLevel: memberSkill.interestLevel,
            gap: skill.requiredLevel - memberSkill.currentLevel,
            developmentPotential
          });
        }
      });
    });

    return mismatches.sort((a, b) => b.developmentPotential - a.developmentPotential);
  }, [teamMembers, skillCategories]);

  // Prepare scatter plot data for priority matrix
  const scatterData = useMemo(() => {
    const data = gapData.map(gap => ({
      x: gap.gap,
      y: gap.avgInterest,
      skill: gap.skillName,
      priority: gap.priority,
      members: gap.memberCount
    }));

    return {
      datasets: [{
        label: 'Skills',
        data,
        backgroundColor: data.map(d => {
          if (d.priority >= 10) return 'rgba(239, 68, 68, 0.7)'; // High priority - Red
          if (d.priority >= 5) return 'rgba(245, 158, 11, 0.7)'; // Medium priority - Orange
          if (d.priority >= 2) return 'rgba(59, 130, 246, 0.7)'; // Low priority - Blue
          return 'rgba(156, 163, 175, 0.7)'; // Very low priority - Gray
        }),
        borderColor: data.map(d => {
          if (d.priority >= 10) return 'rgba(239, 68, 68, 1)';
          if (d.priority >= 5) return 'rgba(245, 158, 11, 1)';
          if (d.priority >= 2) return 'rgba(59, 130, 246, 1)';
          return 'rgba(156, 163, 175, 1)';
        }),
        borderWidth: 1,
        pointRadius: Math.max(4, Math.min(12, data.map(d => d.members).reduce((a, b) => Math.max(a, b), 0) / 2))
      }]
    };
  }, [gapData]);

  const GapIndicator: React.FC<{ gap: number }> = ({ gap }) => {
    if (gap >= 2) return <Badge variant="destructive">Critical ({gap})</Badge>;
    if (gap >= 1) return <Badge variant="secondary">Significant ({gap})</Badge>;
    if (gap > 0) return <Badge variant="outline">Minor ({gap})</Badge>;
    return <Badge variant="default">No Gap</Badge>;
  };

  const ImpactBadge: React.FC<{ impact: string }> = ({ impact }) => {
    const variants = {
      high: { variant: 'destructive' as const, icon: AlertTriangle },
      medium: { variant: 'secondary' as const, icon: AlertCircle },
      low: { variant: 'outline' as const, icon: CheckCircle }
    };
    const config = variants[impact as keyof typeof variants] || variants.low;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {impact}
      </Badge>
    );
  };

  const InterestBar: React.FC<{ interest: number }> = ({ interest }) => (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${(interest / 5) * 100}%` }}
        />
      </div>
      <span className="text-sm text-gray-400">{interest.toFixed(1)}/5</span>
    </div>
  );

  const PriorityScore: React.FC<{ priority: number }> = ({ priority }) => {
    const score = Math.min(100, Math.max(0, priority * 10));
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              score >= 70 ? 'bg-red-500' : 
              score >= 40 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-sm text-gray-400">{score.toFixed(0)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {skillCategories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={minGapThreshold.toString()} onValueChange={(value) => setMinGapThreshold(parseInt(value))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Min gap threshold" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All gaps</SelectItem>
            <SelectItem value="1">Gap ≥ 1</SelectItem>
            <SelectItem value="2">Gap ≥ 2</SelectItem>
            <SelectItem value="3">Gap ≥ 3</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Priority Score</SelectItem>
            <SelectItem value="gap">Skill Gap</SelectItem>
            <SelectItem value="members">Members Affected</SelectItem>
            <SelectItem value="interest">Interest Level</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Analysis
        </Button>
      </div>

      {/* Priority Matrix */}
      {showHeatmap && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Skills Gap Priority Matrix
            </CardTitle>
            <CardDescription>
              X-axis: Skill Gap (Required - Current), Y-axis: Interest Level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <Scatter 
                data={scatterData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      title: {
                        display: true,
                        text: 'Skill Gap (Required - Current)',
                        color: 'white'
                      },
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Interest Level',
                        color: 'white'
                      },
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: { color: 'white' }
                    },
                    tooltip: {
                      callbacks: {
                        title: (context: any) => context[0].raw.skill,
                        label: (context: any) => [
                          `Gap: ${context.raw.x}`,
                          `Interest: ${context.raw.y}/5`,
                          `Members affected: ${context.raw.members}`,
                          `Priority: ${context.raw.priority.toFixed(1)}`
                        ]
                      }
                    }
                  }
                }}
              />
            </div>
            
            {/* Quadrant Labels */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-400">Quick Wins</span>
                </div>
                <p className="text-xs text-gray-400">High interest, low gap - ideal for development</p>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-blue-400">Strategic Development</span>
                </div>
                <p className="text-xs text-gray-400">High interest, high gap - strategic focus needed</p>
              </div>
              <div className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-yellow-400">Low Priority</span>
                </div>
                <p className="text-xs text-gray-400">Low interest, low gap - minimal impact</p>
              </div>
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="font-medium text-red-400">Critical Gaps</span>
                </div>
                <p className="text-xs text-gray-400">Low interest, high gap - urgent attention required</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Gaps Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Critical Development Areas
          </CardTitle>
          <CardDescription>
            Skills with the highest development priority based on gap analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3 text-gray-400">Skill</th>
                  <th className="text-center p-3 text-gray-400">Gap</th>
                  <th className="text-center p-3 text-gray-400">Members Affected</th>
                  <th className="text-center p-3 text-gray-400">Business Impact</th>
                  <th className="text-center p-3 text-gray-400">Avg Interest</th>
                  <th className="text-center p-3 text-gray-400">Priority Score</th>
                  <th className="text-center p-3 text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {gapData.slice(0, 20).map((gap) => (
                  <tr key={gap.skillId} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-white">{gap.skillName}</div>
                        <div className="text-sm text-gray-400">{gap.category}</div>
                        <div className="text-xs text-gray-500">
                          Required: {gap.requiredLevel}/5 • Current: {gap.avgCurrentLevel.toFixed(1)}/5
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <GapIndicator gap={gap.gap} />
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{gap.memberCount}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <ImpactBadge impact={gap.businessImpact} />
                    </td>
                    <td className="p-3 text-center">
                      <InterestBar interest={gap.avgInterest} />
                    </td>
                    <td className="p-3 text-center">
                      <PriorityScore priority={gap.priority} />
                    </td>
                    <td className="p-3 text-center">
                      <Button size="sm" variant="outline">
                        Create Plan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Interest-Skill Mismatch */}
      {mismatches.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              High Interest Development Opportunities
            </CardTitle>
            <CardDescription>
              Team members with high interest but low skills - ideal for development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mismatches.slice(0, 10).map((mismatch) => (
                <div key={`${mismatch.member.id}-${mismatch.skill.id}`} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {mismatch.member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-white">{mismatch.member.name}</div>
                      <div className="text-sm text-gray-400">{mismatch.member.role}</div>
                      <div className="text-sm text-gray-500">{mismatch.skill.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Skill Level</div>
                      <Badge variant="outline" className="text-red-400 border-red-400">
                        {mismatch.currentLevel}/5
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Interest Level</div>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {mismatch.interestLevel}/5
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Potential</div>
                      <Badge variant="default" className="bg-green-600">
                        +{mismatch.developmentPotential}
                      </Badge>
                    </div>
                    {/* Coming soon: Development plan creation */}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{gapData.length}</div>
            <div className="text-sm text-gray-400">Total Gaps Identified</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {gapData.filter(g => g.businessImpact === 'high').length}
            </div>
            <div className="text-sm text-gray-400">Critical Gaps</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{mismatches.length}</div>
            <div className="text-sm text-gray-400">Development Opportunities</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {Math.round(gapData.reduce((sum, gap) => sum + gap.avgInterest, 0) / gapData.length)}
            </div>
            <div className="text-sm text-gray-400">Avg Interest Level</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GapAnalysis;
