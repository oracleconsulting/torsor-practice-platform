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
  DollarSign
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
  showBenchmarks,
  comparePeriods
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
      trainingROI: 320 // Mock ROI percentage
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

  // Development progress trends (mock data)
  const developmentTrends = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return {
      labels: months,
      datasets: [
        {
          label: 'Planned',
          data: [15, 18, 22, 25, 28, 32],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        },
        {
          label: 'In Progress',
          data: [8, 12, 15, 18, 20, 22],
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true
        },
        {
          label: 'Completed',
          data: [5, 8, 12, 15, 18, 25],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true
        }
      ]
    };
  }, []);

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

  // Service capability matrix (mock data)
  const practiceServices = [
    'Financial Reporting',
    'Tax Advisory', 
    'Audit & Assurance',
    'Business Advisory',
    'Digital Transformation'
  ];

  const serviceCapabilities = useMemo(() => {
    return practiceServices.map(service => ({
      service,
      capability: Math.random() * 40 + 60, // Mock capability score 60-100
      readiness: Math.random() > 0.3 ? 'ready' : Math.random() > 0.6 ? 'needs_work' : 'not_ready'
    }));
  }, []);

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
        <MetricCard 
          title="Team Capability Score"
          value={teamMetrics.capabilityScore}
          max={100}
          trend="+5%"
          benchmark={showBenchmarks ? 82 : undefined}
          description="vs Industry Avg"
          icon={<TrendingUp className="w-5 h-5" />}
        />
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
              Shows team's average capability across different skill categories. Each point represents how strong your team is in that area (0-100%). Larger shapes = stronger overall capability. Use this to identify which categories need development.
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
          </CardContent>
        </Card>
      </div>

      {/* Succession Risk */}
      <div className="col-span-3">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Succession Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalSkills.slice(0, 5).map(skill => (
                <div key={skill.skillId} className="flex justify-between items-center">
                  <span className="text-sm text-gray-300 truncate">{skill.name}</span>
                  <Badge 
                    variant={skill.risk === 'high' ? 'destructive' : skill.risk === 'medium' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {skill.expertsCount} expert(s)
                  </Badge>
                </div>
              ))}
              {criticalSkills.length === 0 && (
                <p className="text-sm text-muted-foreground">No succession risks identified</p>
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
          </CardContent>
        </Card>
      </div>

      {/* ROI Metrics */}
      <div className="col-span-4">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Training ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Skills Improved</span>
                <span className="text-card-foreground font-medium">42 skills</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg Level Increase</span>
                <span className="text-card-foreground font-medium">1.3 levels</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Training Investment</span>
                <span className="text-card-foreground font-medium">£12,450</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Capability ROI</span>
                <span className="text-emerald-400 font-medium">320%</span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ROI Trend</span>
                  <span className="text-emerald-400 text-sm">+15%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Capability Matrix */}
      <div className="col-span-8">
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>Service Delivery Capability</CardTitle>
            <CardDescription>Readiness to deliver different practice services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {serviceCapabilities.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-card-foreground font-medium">{service.service}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(service.capability)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          service.capability >= 80 ? 'bg-green-500' :
                          service.capability >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${service.capability}%` }}
                      />
                    </div>
                  </div>
                  <Badge 
                    variant={
                      service.readiness === 'ready' ? 'default' :
                      service.readiness === 'needs_work' ? 'secondary' : 'destructive'
                    }
                    className="ml-4"
                  >
                    {service.readiness === 'ready' ? 'Ready' : 
                     service.readiness === 'needs_work' ? 'Needs Work' : 'Not Ready'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="col-span-4">
        <div className="space-y-4">
          <MetricCard 
            title="Critical Gaps"
            value={teamMetrics.criticalGaps}
            trend="-12%"
            icon={<Target className="w-5 h-5" />}
          />
          <MetricCard 
            title="High Interest Areas"
            value={teamMetrics.highInterestCount}
            trend="+8%"
            icon={<Award className="w-5 h-5" />}
          />
          <MetricCard 
            title="Succession Risks"
            value={teamMetrics.successionRisk}
            trend="+2"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
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
