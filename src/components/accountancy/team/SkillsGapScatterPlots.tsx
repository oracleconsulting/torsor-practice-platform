import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scatter } from 'react-chartjs-2';
import { BarChart3 } from 'lucide-react';

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
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  skills: TeamMemberSkill[];
}

interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  skills: Skill[];
}

interface SkillsGapScatterPlotsProps {
  teamMembers: TeamMember[];
  skillCategories: SkillCategory[];
}

const SkillsGapScatterPlots: React.FC<SkillsGapScatterPlotsProps> = ({
  teamMembers,
  skillCategories
}) => {
  
  // Plot 1: ALL 1776 individual assessment points
  const individualPointsData = useMemo(() => {
    const allAssessments: any[] = [];
    
    teamMembers.forEach(member => {
      member.skills.forEach(skill => {
        const skillInfo = skillCategories
          .flatMap(cat => cat.skills)
          .find(s => s.id === skill.skillId);
        
        if (skillInfo) {
          allAssessments.push({
            x: skill.interestLevel || 3, // Interest on X-axis
            y: skill.currentLevel,        // Skill on Y-axis
            member: member.name,
            skill: skillInfo.name,
            category: skillInfo.category
          });
        }
      });
    });
    
    return {
      datasets: [{
        label: `All Individual Assessments (${allAssessments.length} points)`,
        data: allAssessments,
        backgroundColor: allAssessments.map(d => {
          // Color by quadrant:
          // Top-right (high interest, high skill) = Green
          // Bottom-right (high interest, low skill) = Orange
          // Bottom-left (low interest, low skill) = Red
          // Top-left (low interest, high skill) = Blue
          const highInterest = d.x >= 3;
          const highSkill = d.y >= 3;
          
          if (highSkill && highInterest) return 'rgba(34, 197, 94, 0.6)'; // Green
          if (!highSkill && highInterest) return 'rgba(245, 158, 11, 0.6)'; // Orange
          if (!highSkill && !highInterest) return 'rgba(239, 68, 68, 0.6)'; // Red
          return 'rgba(59, 130, 246, 0.6)'; // Blue
        }),
        pointRadius: 4,
        pointHoverRadius: 8
      }]
    };
  }, [teamMembers, skillCategories]);
  
  // Plot 2: Average scores per skill (111 points)
  const averageSkillData = useMemo(() => {
    const allSkills = skillCategories.flatMap(cat => cat.skills);
    const skillAverages = allSkills.map(skill => {
      const assessments = teamMembers
        .flatMap(member => member.skills)
        .filter(s => s.skillId === skill.id);
      
      if (assessments.length === 0) return null;
      
      const avgSkillLevel = assessments.reduce((sum, s) => sum + s.currentLevel, 0) / assessments.length;
      const avgInterest = assessments.reduce((sum, s) => sum + (s.interestLevel || 3), 0) / assessments.length;
      
      return {
        x: avgInterest,
        y: avgSkillLevel,
        skill: skill.name,
        category: skill.category,
        count: assessments.length
      };
    }).filter(s => s !== null);
    
    return {
      datasets: [{
        label: `Average Team Scores per Skill (${skillAverages.length} skills)`,
        data: skillAverages,
        backgroundColor: skillAverages.map(d => {
          const highInterest = d.x >= 3;
          const highSkill = d.y >= 3;
          
          if (highSkill && highInterest) return 'rgba(34, 197, 94, 0.8)';
          if (!highSkill && highInterest) return 'rgba(245, 158, 11, 0.8)';
          if (!highSkill && !highInterest) return 'rgba(239, 68, 68, 0.8)';
          return 'rgba(59, 130, 246, 0.8)';
        }),
        pointRadius: 8,
        pointHoverRadius: 12
      }]
    };
  }, [teamMembers, skillCategories]);
  
  // Plot 3: Skill Gap (required vs actual)
  const skillGapData = useMemo(() => {
    const allSkills = skillCategories.flatMap(cat => cat.skills);
    const gapPoints = allSkills.map(skill => {
      const assessments = teamMembers
        .flatMap(member => member.skills)
        .filter(s => s.skillId === skill.id);
      
      if (assessments.length === 0) return null;
      
      const avgActual = assessments.reduce((sum, s) => sum + s.currentLevel, 0) / assessments.length;
      const gap = Math.max(0, skill.requiredLevel - avgActual);
      const avgInterest = assessments.reduce((sum, s) => sum + (s.interestLevel || 3), 0) / assessments.length;
      
      return {
        x: avgInterest,
        y: gap, // Gap on Y-axis
        skill: skill.name,
        category: skill.category,
        required: skill.requiredLevel,
        actual: avgActual,
        count: assessments.length
      };
    }).filter(s => s !== null && s.y > 0); // Only show skills with gaps
    
    return {
      datasets: [{
        label: `Skill Gaps (${gapPoints.length} skills need development)`,
        data: gapPoints,
        backgroundColor: gapPoints.map(d => {
          // Color by gap severity and interest
          const highInterest = d.x >= 3;
          const largeGap = d.y >= 2;
          
          if (largeGap && highInterest) return 'rgba(245, 158, 11, 0.8)'; // Orange - quick win potential
          if (largeGap && !highInterest) return 'rgba(239, 68, 68, 0.8)'; // Red - critical
          if (!largeGap && highInterest) return 'rgba(34, 197, 94, 0.8)'; // Green - easy fix
          return 'rgba(156, 163, 175, 0.8)'; // Gray - low priority
        }),
        pointRadius: 10,
        pointHoverRadius: 14
      }]
    };
  }, [teamMembers, skillCategories]);
  
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: 'white', font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 2,
        padding: 16,
        displayColors: true,
        bodyFont: { size: 13 },
        titleFont: { size: 14, weight: 'bold' as const }
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Plot 1: All Individual Points */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            1. Individual Assessment Distribution
          </CardTitle>
          <CardDescription className="text-white">
            All {individualPointsData.datasets[0].data.length} individual skill assessments plotted by Interest (X) vs Current Skill Level (Y).
            <br />
            <strong>Bottom-right (high interest, low skill)</strong> = Development opportunities
            <br />
            <strong>Top-right (high interest, high skill)</strong> = Strategic assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Scatter 
              data={individualPointsData}
              options={{
                ...commonOptions,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Interest Level (1-5)',
                      color: 'white',
                      font: { size: 14, weight: 'bold' as const }
                    },
                    min: 0,
                    max: 5,
                    ticks: { 
                      color: 'white', 
                      stepSize: 1
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Current Skill Level (1-5)',
                      color: 'white',
                      font: { size: 14, weight: 'bold' as const }
                    },
                    min: 0,
                    max: 5,
                    ticks: { 
                      color: 'white',
                      stepSize: 1
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  }
                },
                plugins: {
                  ...commonOptions.plugins,
                  tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                      title: (context: any) => {
                        return context[0].raw.member;
                      },
                      label: (context: any) => {
                        const d = context.raw;
                        return [
                          `Skill: ${d.skill}`,
                          `Category: ${d.category}`,
                          ``,
                          `Interest: ${d.x}/5`,
                          `Skill Level: ${d.y}/5`
                        ];
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Plot 2: Team Averages */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            2. Team Average by Skill
          </CardTitle>
          <CardDescription className="text-white">
            Average interest and skill level for each of the {averageSkillData.datasets[0].data.length} assessed skills.
            <br />
            Shows the team's collective strengths and weaknesses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Scatter 
              data={averageSkillData}
              options={{
                ...commonOptions,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Average Team Interest (1-5)',
                      color: 'white',
                      font: { size: 14, weight: 'bold' as const }
                    },
                    min: 0,
                    max: 5,
                    ticks: { 
                      color: 'white',
                      stepSize: 1
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Average Team Skill (1-5)',
                      color: 'white',
                      font: { size: 14, weight: 'bold' as const }
                    },
                    min: 0,
                    max: 5,
                    ticks: { 
                      color: 'white',
                      stepSize: 1
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  }
                },
                plugins: {
                  ...commonOptions.plugins,
                  tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                      title: (context: any) => {
                        return `📊 ${context[0].raw.skill}`;
                      },
                      label: (context: any) => {
                        const d = context.raw;
                        return [
                          `Category: ${d.category}`,
                          ``,
                          `Average Interest: ${d.x.toFixed(1)}/5`,
                          `Average Skill: ${d.y.toFixed(1)}/5`,
                          `Team Members: ${d.count}`
                        ];
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Plot 3: Skill Gaps */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            3. Skill Gap Analysis
          </CardTitle>
          <CardDescription className="text-white">
            Gap between required and actual skill levels (only showing {skillGapData.datasets[0].data.length} skills with gaps).
            <br />
            <strong className="text-orange-400">Orange (high interest, large gap)</strong> = Best training opportunities
            <br />
            <strong className="text-red-400">Red (low interest, large gap)</strong> = Critical concerns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <Scatter 
              data={skillGapData}
              options={{
                ...commonOptions,
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Average Team Interest (1-5)',
                      color: 'white',
                      font: { size: 14, weight: 'bold' as const }
                    },
                    min: 0,
                    max: 5,
                    ticks: { 
                      color: 'white',
                      stepSize: 1
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Skill Gap (Required - Actual)',
                      color: 'white',
                      font: { size: 14, weight: 'bold' as const }
                    },
                    min: 0,
                    max: 5,
                    ticks: { 
                      color: 'white',
                      stepSize: 0.5
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  }
                },
                plugins: {
                  ...commonOptions.plugins,
                  tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                      title: (context: any) => {
                        return `⚠️ ${context[0].raw.skill}`;
                      },
                      label: (context: any) => {
                        const d = context.raw;
                        return [
                          `Category: ${d.category}`,
                          ``,
                          `Required Level: ${d.required}/5`,
                          `Current Level: ${d.actual.toFixed(1)}/5`,
                          `Gap: ${d.y.toFixed(1)} levels`,
                          ``,
                          `Team Interest: ${d.x.toFixed(1)}/5`,
                          `Team Members: ${d.count}`
                        ];
                      },
                      afterLabel: (context: any) => {
                        const d = context.raw;
                        const highInterest = d.x >= 3;
                        const largeGap = d.y >= 2;
                        
                        if (largeGap && highInterest) {
                          return '\n\n🟠 QUICK WIN\nHigh interest + large gap = best training ROI!';
                        }
                        if (largeGap && !highInterest) {
                          return '\n\n🔴 CRITICAL\nLarge gap + low interest = needs attention!';
                        }
                        if (!largeGap && highInterest) {
                          return '\n\n🟢 EASY FIX\nSmall gap + high interest = quick improvement!';
                        }
                        return '\n\n⚪ LOW PRIORITY\nSmall gap + low interest';
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Legend */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Color Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-white text-sm">Top-right / Easy fix: Green</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-white text-sm">Bottom-right / Quick win: Orange</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-white text-sm">Bottom-left / Critical: Red</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-white text-sm">Top-left / Maintain: Blue</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SkillsGapScatterPlots;

