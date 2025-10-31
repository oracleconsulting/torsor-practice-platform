import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scatter } from 'react-chartjs-2';
import { BarChart3, User } from 'lucide-react';

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
  const [selectedMemberId, setSelectedMemberId] = useState<string>(teamMembers[0]?.id || '');
  
  // Plot 1: Individual member's skill assessments (111 skills for selected member)
  const individualMemberData = useMemo(() => {
    const selectedMember = teamMembers.find(m => m.id === selectedMemberId);
    if (!selectedMember) return { datasets: [] };
    
    const memberAssessments: any[] = [];
    
    selectedMember.skills.forEach(skill => {
      const skillInfo = skillCategories
        .flatMap(cat => cat.skills)
        .find(s => s.id === skill.skillId);
      
      if (skillInfo) {
        memberAssessments.push({
          x: skill.currentLevel,           // FLIPPED: Skill on X-axis
          y: skill.interestLevel || 3,     // FLIPPED: Interest on Y-axis
          skill: skillInfo.name,
          category: skillInfo.category
        });
      }
    });
    
    console.log('[SkillsGapScatterPlots] Individual member points:', {
      member: selectedMember.name,
      totalPoints: memberAssessments.length,
      samplePoint: memberAssessments[0]
    });
    
    return {
      datasets: [{
        label: `${selectedMember.name}'s Skills (${memberAssessments.length} skills)`,
        data: memberAssessments,
        backgroundColor: memberAssessments.map(d => {
          // Color by quadrant (FLIPPED: X=Skill, Y=Interest):
          const highInterest = d.y >= 3;
          const highSkill = d.x >= 3;
          
          if (highSkill && highInterest) return 'rgba(34, 197, 94, 0.8)';   // Green: High skill, high interest
          if (!highSkill && highInterest) return 'rgba(245, 158, 11, 0.8)'; // Orange: Low skill, high interest (Quick win)
          if (highSkill && !highInterest) return 'rgba(59, 130, 246, 0.8)'; // Blue: High skill, low interest
          return 'rgba(239, 68, 68, 0.8)'; // Red: Low skill, low interest
        }),
        pointRadius: 6,
        pointHoverRadius: 10
      }]
    };
  }, [teamMembers, skillCategories, selectedMemberId]);
  
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
        x: avgSkillLevel,  // FLIPPED: Skill on X-axis
        y: avgInterest,    // FLIPPED: Interest on Y-axis
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
          // FLIPPED: X=Skill, Y=Interest
          const highInterest = d.y >= 3;
          const highSkill = d.x >= 3;
          
          if (highSkill && highInterest) return 'rgba(34, 197, 94, 0.8)';   // Green: High skill, high interest
          if (!highSkill && highInterest) return 'rgba(245, 158, 11, 0.8)'; // Orange: Low skill, high interest
          if (!highSkill && !highInterest) return 'rgba(239, 68, 68, 0.8)'; // Red: Low skill, low interest
          return 'rgba(59, 130, 246, 0.8)'; // Blue: High skill, low interest
        }),
        pointRadius: 8,
        pointHoverRadius: 12
      }]
    };
  }, [teamMembers, skillCategories]);
  
  // Plot 3: Skill Gap (required vs actual) - SHOW ALL SKILLS
  const skillGapData = useMemo(() => {
    const allSkills = skillCategories.flatMap(cat => cat.skills);
    const gapPoints = allSkills.map(skill => {
      const assessments = teamMembers
        .flatMap(member => member.skills)
        .filter(s => s.skillId === skill.id);
      
      if (assessments.length === 0) return null;
      
      const avgActual = assessments.reduce((sum, s) => sum + s.currentLevel, 0) / assessments.length;
      // Use requiredLevel if set, otherwise default to 3
      const requiredLevel = skill.requiredLevel || 3;
      // Gap can be NEGATIVE if we exceed the target
      const gap = requiredLevel - avgActual;
      const avgInterest = assessments.reduce((sum, s) => sum + (s.interestLevel || 3), 0) / assessments.length;
      
      return {
        x: avgInterest,
        y: gap, // Gap on Y-axis (negative = exceeding target, positive = below target)
        skill: skill.name,
        category: skill.category,
        required: requiredLevel,
        actual: avgActual,
        count: assessments.length
      };
    }).filter(s => s !== null); // Show ALL skills, not just those with positive gaps
    
    console.log('[SkillsGapScatterPlots] Skill gaps:', {
      totalSkills: allSkills.length,
      pointsShown: gapPoints.length,
      skillsAboveTarget: gapPoints.filter(s => s.y < 0).length,
      skillsBelowTarget: gapPoints.filter(s => s.y > 0).length,
      skillsAtTarget: gapPoints.filter(s => Math.abs(s.y) < 0.1).length,
      sampleGap: gapPoints[0],
      sampleSkill: allSkills[0]
    });
    
    return {
      datasets: [{
        label: `Skill Gaps (${gapPoints.length} skills)`,
        data: gapPoints,
        backgroundColor: gapPoints.map(d => {
          const highInterest = d.x >= 3;
          const belowTarget = d.y > 0.5;  // Significantly below target
          const aboveTarget = d.y < -0.5; // Significantly above target
          
          // Color by performance vs interest:
          if (aboveTarget) return 'rgba(34, 197, 94, 0.8)'; // Green - exceeding target, no priority
          if (belowTarget && highInterest) return 'rgba(245, 158, 11, 0.8)'; // Orange - below target + high interest = PRIORITY
          if (belowTarget && !highInterest) return 'rgba(239, 68, 68, 0.8)'; // Red - below target + low interest = CRITICAL
          return 'rgba(156, 163, 175, 0.8)'; // Gray - at target or small gap
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
      {/* Plot 1: Individual Member Skills (with dropdown) */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5" />
            1. Individual Member Skills
          </CardTitle>
          <CardDescription className="text-white">
            Select a team member to view their {individualMemberData?.datasets?.[0]?.data?.length ? individualMemberData.datasets[0].data.length : 0} skill assessments plotted by Current Skill Level (X) vs Interest (Y).
            <br />
            <strong>Top-right (high skill, high interest)</strong> = Strategic assets
            <br />
            <strong>Top-left (low skill, high interest)</strong> = Development opportunities
          </CardDescription>
          
          {/* Member Selector Dropdown */}
          <div className="mt-4">
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-64 bg-gray-700 text-white border-gray-600">
                <SelectValue placeholder="Select a team member" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 text-white border-gray-600">
                {teamMembers.map(member => (
                  <SelectItem key={member.id} value={member.id} className="text-white hover:bg-gray-600">
                    {member.name} ({member.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96 p-4">
            <Scatter 
              data={individualMemberData}
              options={{
                ...commonOptions,
                layout: {
                  padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                  }
                },
                scales: {
                  x: {
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
                  },
                  y: {
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
                  }
                },
                plugins: {
                  ...commonOptions.plugins,
                  tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                      title: (context: any) => {
                        return context[0].raw?.skill || 'Unknown Skill';
                      },
                      label: (context: any) => {
                        const d = context.raw;
                        if (!d) return '';
                        return `Category: ${d.category || 'N/A'} | Skill: ${typeof d.x === 'number' ? d.x.toFixed(1) : '0'}/5 | Interest: ${typeof d.y === 'number' ? d.y.toFixed(1) : '0'}/5`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Plot 2: Team Average by Skill */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="w-5 h-5" />
            2. Team Average by Skill
          </CardTitle>
          <CardDescription className="text-white">
            Average interest and skill level for each of the {averageSkillData?.datasets?.[0]?.data?.length ? averageSkillData.datasets[0].data.length : 0} assessed skills.
            <br />
            Shows the team's collective strengths and weaknesses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 p-4">
            <Scatter 
              data={averageSkillData}
              options={{
                ...commonOptions,
                layout: {
                  padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                  }
                },
                scales: {
                  x: {
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
                  },
                  y: {
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
                  }
                },
                plugins: {
                  ...commonOptions.plugins,
                  tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                      title: (context: any) => {
                        return `📊 ${context[0].raw?.skill || 'Unknown Skill'}`;
                      },
                      label: (context: any) => {
                        const d = context.raw;
                        if (!d) return '';
                        return `Category: ${d.category || 'N/A'} | Avg Skill: ${typeof d.x === 'number' ? d.x.toFixed(1) : '0'}/5 | Avg Interest: ${typeof d.y === 'number' ? d.y.toFixed(1) : '0'}/5 | Members: ${d.count || 0}`;
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
            Gap between required and actual skill levels (showing all {skillGapData?.datasets?.[0]?.data?.length ? skillGapData.datasets[0].data.length : 0} skills).
            <br />
            <strong className="text-green-400">Green (above target)</strong> = Skills we already exceed - no priority
            <br />
            <strong className="text-orange-400">Orange (below target, high interest)</strong> = Best training opportunities
            <br />
            <strong className="text-red-400">Red (below target, low interest)</strong> = Critical concerns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 p-4">
            <Scatter 
              data={skillGapData}
              options={{
                ...commonOptions,
                layout: {
                  padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                  }
                },
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
                      text: 'Skill Gap (negative = exceeding target)',
                      color: 'white',
                      font: { size: 14, weight: 'bold' as const }
                    },
                    min: -3,
                    max: 3,
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
                        return `⚠️ ${context[0].raw?.skill || 'Unknown Skill'}`;
                      },
                      label: (context: any) => {
                        const d = context.raw;
                        if (!d) return '';
                        const gapDirection = d.y < 0 ? 'EXCEEDING target by' : 'Behind target by';
                        const gapValue = typeof d.y === 'number' ? Math.abs(d.y).toFixed(1) : '0';
                        const required = d.required || 3;
                        const actual = typeof d.actual === 'number' ? d.actual.toFixed(1) : '0';
                        const interest = typeof d.x === 'number' ? d.x.toFixed(1) : '0';
                        const count = d.count || 0;
                        
                        return `Category: ${d.category || 'N/A'} | Required: ${required}/5 | Current: ${actual}/5 | ${gapDirection}: ${gapValue} levels | Interest: ${interest}/5 | Members: ${count}`;
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

