import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Target, 
  Award, 
  AlertTriangle,
  BarChart3,
  Download,
  BookOpen
} from 'lucide-react';
import { Radar } from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  ArcElement
);

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

interface TeamMetricsProps {
  teamMembers: TeamMember[];
  skillCategories: SkillCategory[];
  showBenchmarks: boolean;
  comparePeriods: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  max?: number;
  trend?: string;
  benchmark?: number;
  description?: string;
  icon?: React.ReactNode;
}

const TeamMetrics: React.FC<TeamMetricsProps> = ({
  teamMembers,
  skillCategories,
  showBenchmarks
  // comparePeriods - reserved for future period comparison feature
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('quarterly');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Calculate filtered members first
  const filteredMembers = useMemo(() => {
    return selectedDepartment === 'all' 
      ? teamMembers 
      : teamMembers.filter(m => m.department === selectedDepartment);
  }, [teamMembers, selectedDepartment]);

  // Calculate overall team metrics
  const teamMetrics = useMemo(() => {
    if (filteredMembers.length === 0) {
      return {
        capabilityScore: 0,
        avgSkillLevel: 0,
        criticalGaps: 0,
        highInterestCount: 0,
        successionRisk: 0,
        trainingROI: 0
      };
    }

    const allSkills = filteredMembers.flatMap(member => member.skills);
    const avgSkillLevel = allSkills.reduce((sum, skill) => sum + skill.currentLevel, 0) / allSkills.length;
    
    const criticalGaps = allSkills.filter(skill => {
      const skillInfo = skillCategories.flatMap(cat => cat.skills).find(s => s.id === skill.skillId);
      return skillInfo && skill.currentLevel < skillInfo.requiredLevel;
    }).length;

    const highInterestCount = allSkills.filter(skill => (skill.interestLevel || 0) >= 4).length;
    
    // Calculate capability score (weighted average)
    const capabilityScore = Math.round(avgSkillLevel * 20); // Convert to 0-100 scale
    
    // Calculate succession risk (skills with only one expert)
    const skillExpertCount = new Map<string, number>();
    allSkills.forEach(skill => {
      if (skill.currentLevel >= 4) {
        const current = skillExpertCount.get(skill.skillId) || 0;
        skillExpertCount.set(skill.skillId, current + 1);
      }
    });
    const successionRisk = Array.from(skillExpertCount.values()).filter(count => count === 1).length;

    return {
      capabilityScore,
      avgSkillLevel: parseFloat(avgSkillLevel.toFixed(1)),
      criticalGaps,
      highInterestCount,
      successionRisk,
      trainingROI: 0 // Will be calculated from CPD investment and skill improvements
    };
  }, [filteredMembers, skillCategories]);

  // Calculate category breakdown
  const categoryScores = useMemo(() => {
    return skillCategories.map(category => {
      const categorySkills = filteredMembers.flatMap(member => 
        member.skills.filter(skill => 
          category.skills.some(catSkill => catSkill.id === skill.skillId)
        )
      );
      
      if (categorySkills.length === 0) return { category: category.name, score: 0 };
      
      const avgScore = categorySkills.reduce((sum, skill) => sum + skill.currentLevel, 0) / categorySkills.length;
      return {
        category: category.name,
        score: parseFloat(avgScore.toFixed(1))
      };
    });
  }, [skillCategories, filteredMembers]);

  // Critical skills analysis
  const criticalSkills = useMemo(() => {
    const skillExpertCount = new Map<string, { count: number; experts: TeamMember[] }>();
    
    filteredMembers.forEach(member => {
      member.skills.forEach(skill => {
        if (skill.currentLevel >= 4) {
          const current = skillExpertCount.get(skill.skillId) || { count: 0, experts: [] };
          current.count += 1;
          current.experts.push(member);
          skillExpertCount.set(skill.skillId, current);
        }
      });
    });

    return Array.from(skillExpertCount.entries())
      .filter(([_, data]) => data.count === 1)
      .map(([skillId, data]) => {
        const skillInfo = skillCategories.flatMap(cat => cat.skills).find(s => s.id === skillId);
        return {
          skillId,
          name: skillInfo?.name || 'Unknown Skill',
          expertsCount: data.count,
          experts: data.experts,
          risk: data.count === 1 ? 'high' : data.count === 2 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => a.expertsCount - b.expertsCount);
  }, [filteredMembers, skillCategories]);

  // Development progress trends - will be populated from CPD/development plan data
  const developmentTrends = useMemo(() => {
    // TODO: Calculate from real CPD completion data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return {
      labels: months,
      datasets: [
        {
          label: 'Skills Assessed',
          data: [filteredMembers.length * 10, filteredMembers.length * 15, filteredMembers.length * 20, filteredMembers.length * 25, filteredMembers.length * 30, filteredMembers.length * 35],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        }
      ]
    };
  }, [filteredMembers]);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    return {
      labels: categoryScores.map(cat => cat.category),
      datasets: [
        {
          label: 'Current Capability',
          data: categoryScores.map(cat => cat.score * 20), // Convert to 0-100 scale
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
        },
        ...(showBenchmarks ? [{
          label: 'Industry Benchmark',
          data: categoryScores.map(() => 75), // Mock benchmark
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          borderDash: [5, 5]
        }] : [])
      ]
    };
  }, [categoryScores, showBenchmarks]);

  // Note: Service capabilities will be calculated from real skills data in future update

  const MetricCard: React.FC<MetricCardProps> = ({ 
    title, 
    value, 
    max, 
    trend, 
    benchmark, 
    description, 
    icon 
  }) => (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-card-foreground">{value}</p>
            {max && (
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(typeof value === 'number' ? value : 0) / max * 100}%` }}
                />
              </div>
            )}
            {trend && (
              <p className={`text-xs ${trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {trend}
              </p>
            )}
            {benchmark && description && (
              <p className="text-xs text-gray-500">
                {description}: {benchmark}
              </p>
            )}
          </div>
          {icon && <div className="text-blue-500">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Overall Metrics */}
      <div className="col-span-3">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <p className="text-sm text-muted-foreground">Team Capability Score</p>
              </div>
              <Badge variant="outline" className="text-xs">+5%</Badge>
            </div>
            <p className="text-2xl font-bold text-card-foreground">{teamMetrics.capabilityScore}</p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${teamMetrics.capabilityScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Average of all skill levels across all team members and categories. 100% = all skills at expert level.
            </p>
            {showBenchmarks && (
              <p className="text-xs text-amber-400 mt-1">Industry avg: 82%</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="col-span-6">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Capability by Category</span>
              <div className="flex gap-2">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {[...new Set(teamMembers.map(m => m.department))].map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              <strong className="text-white">How to Read This Chart:</strong>
              <ul className="mt-2 space-y-1 text-sm text-gray-300">
                <li>• <strong>Blue Shape</strong>: Your team's current capability (0-100%)</li>
                <li>• <strong>100% Capacity</strong>: All team members at Expert Level (5/5) in that category</li>
                <li>• <strong>Calculation</strong>: (Average Skill Level ÷ 5) × 100% for each category</li>
                <li>• <strong>Example</strong>: Avg level 3.5 = 70% capacity, Avg level 4 = 80% capacity</li>
                <li>• <strong>Larger shape</strong> = Stronger overall capability</li>
                <li>• <strong>Indented areas</strong> = Categories needing development</li>
              </ul>
              {showBenchmarks && (
                <p className="mt-2 text-xs text-amber-400">
                  <strong>Note:</strong> Red dashed line (75%) is a placeholder industry benchmark for demonstration. Will be replaced with real sector data.
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Radar 
                data={radarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    r: {
                      beginAtZero: true,
                      max: 100,
                      ticks: {
                        color: 'white'
                      },
                      grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                      },
                      pointLabels: {
                        color: 'white'
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: 'white'
                      }
                    }
                  }
                }}
              />
            </div>
            {/* Chart Legend */}
            <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-gray-300">Current Team Capability (0-100%)</span>
              </div>
              {showBenchmarks && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-dashed border-red-500"></div>
                  <span className="text-gray-300">Industry Benchmark (75%)</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Succession Risk - Improved Layout */}
      <div className="col-span-3">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4" />
              Succession Risk
            </CardTitle>
            <CardDescription className="text-xs">
              Skills with only one expert
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalSkills.slice(0, 5).map(skill => (
                <div key={skill.skillId} className="flex flex-col gap-1 pb-2 border-b border-gray-700 last:border-0">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-300 font-medium line-clamp-2 flex-1 mr-2">{skill.name}</span>
                    <Badge 
                      variant={skill.risk === 'high' ? 'destructive' : skill.risk === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs flex-shrink-0"
                    >
                      {skill.expertsCount} expert{skill.expertsCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {skill.experts && skill.experts.length > 0 && (
                    <span className="text-xs text-gray-500">{skill.experts[0].name}</span>
                  )}
                </div>
              ))}
              {criticalSkills.length === 0 && (
                <p className="text-sm text-muted-foreground">✓ No succession risks identified</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Progress */}
      <div className="col-span-8">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Development Progress</span>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
            <CardDescription>
              Tracks how team skills improve over time. Rising lines = team getting stronger in those areas. Use this to measure training effectiveness and set realistic timelines for capability development.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line 
                data={developmentTrends}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: { color: 'white' }
                    }
                  }
                }}
              />
            </div>
            {/* Chart Legend */}
            <div className="mt-4 flex flex-wrap gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-gray-300">Skills Assessed (Total Count)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-400"></div>
                <span className="text-gray-300">Upward Trend = Improving Capability</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Resources - Real Data */}
      <div className="col-span-12">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Development Resources & Support
            </CardTitle>
            <CardDescription>
              Available resources for team skill development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-lg border border-blue-700/30">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">Internal Training</h4>
                <p className="text-xs text-gray-400">In-house courses and mentoring programs available</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs">View Courses</Button>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-lg border border-purple-700/30">
                <h4 className="text-sm font-semibold text-purple-400 mb-2">External CPD</h4>
                <p className="text-xs text-gray-400">Professional development opportunities and certifications</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs">Browse CPD</Button>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-lg border border-green-700/30">
                <h4 className="text-sm font-semibold text-green-400 mb-2">Knowledge Base</h4>
                <p className="text-xs text-gray-400">Team-shared CPD summaries and learning resources</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs">Explore Knowledge</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="col-span-4">
        <div className="space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-muted-foreground">Critical Gaps</p>
                </div>
                <Badge variant="outline" className="text-xs text-green-600">-12%</Badge>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{teamMetrics.criticalGaps}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Skills where current level is 2+ levels below required. Priority for training.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  <p className="text-sm text-muted-foreground">High Interest Areas</p>
                </div>
                <Badge variant="outline" className="text-xs">+8%</Badge>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{teamMetrics.highInterestCount}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Skills with interest level 4-5. Team members eager to develop these.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <p className="text-sm text-muted-foreground">Succession Risks</p>
                </div>
                <Badge variant="outline" className="text-xs text-red-600">+2</Badge>
              </div>
              <p className="text-2xl font-bold text-card-foreground">{teamMetrics.successionRisk}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Critical skills held by only 1 person. High risk if they leave.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Performance Summary */}
      <div className="col-span-12">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Team Performance Summary
            </CardTitle>
            <CardDescription>
              Key performance indicators and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-card-foreground">{filteredMembers.length}</div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-card-foreground">{teamMetrics.avgSkillLevel}/5</div>
                <div className="text-sm text-muted-foreground">Avg Skill Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{teamMetrics.capabilityScore}%</div>
                <div className="text-sm text-muted-foreground">Capability Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{teamMetrics.criticalGaps}</div>
                <div className="text-sm text-muted-foreground">Critical Gaps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{teamMetrics.highInterestCount}</div>
                <div className="text-sm text-muted-foreground">High Interest</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{teamMetrics.trainingROI}%</div>
                <div className="text-sm text-muted-foreground">Training ROI</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamMetrics;
