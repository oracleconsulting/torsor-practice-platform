import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3,
  Download,
  Sparkles,
  Lightbulb,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Target,
  XCircle
} from 'lucide-react';
import TrainingRecommendationCards from './TrainingRecommendationCards';
import SkillsGapScatterPlots from './SkillsGapScatterPlots';
import { getTrainingRecommendations, getGroupTrainingOpportunities, createLearningPath } from '@/lib/api/training-recommendations';
import { getLearningPreference } from '@/lib/api/learning-preferences';
import type { RecommendationAnalysis, TeamMemberProfile, SkillGap } from '@/services/ai/trainingRecommendations';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minGapThreshold, setMinGapThreshold] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string>('priority');
  const [topNFilter, setTopNFilter] = useState<number>(20); // Show only top N gaps
  
  // AI Recommendations state
  const [showAIRecommendations, setShowAIRecommendations] = useState<boolean>(false);
  const [aiRecommendations, setAiRecommendations] = useState<RecommendationAnalysis | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState<boolean>(false);
  const [selectedMemberForAI, setSelectedMemberForAI] = useState<string | null>(null);
  const [generatingLearningPath, setGeneratingLearningPath] = useState<boolean>(false);

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
        const requiredLevel = skill.requiredLevel || 3; // Default to 3 if not set
        const gap = Math.max(0, requiredLevel - avgCurrentLevel);
        const avgInterest = skillAssessments.reduce((sum, s) => sum + (s.interestLevel || 3), 0) / skillAssessments.length;
        
        // Calculate priority based on algorithm
        let priority: number;
        if (priorityAlgorithm === 'weighted') {
          priority = gap * (requiredLevel / 5) * (avgInterest / 5) * skillAssessments.length;
        } else {
          priority = gap * skillAssessments.length;
        }

        // Determine business impact
        let businessImpact: 'high' | 'medium' | 'low' = 'low';
        if (gap >= 2 || requiredLevel >= 4) businessImpact = 'high';
        else if (gap >= 1 || requiredLevel >= 3) businessImpact = 'medium';

        const affectedMembers = teamMembers.filter(member =>
          member.skills.some(s => s.skillId === skill.id && s.currentLevel < requiredLevel)
        );

        return {
          skillId: skill.id,
          skillName: skill.name,
          category: skill.category,
          requiredLevel,
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

  // Create UNFILTERED gap data for the priority table (ignore minGapThreshold)
  const topPrioritySkills = useMemo((): GapData[] => {
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
            priority: skill.requiredLevel * 5,
            businessImpact: 'high' as const,
            affectedMembers: []
          };
        }

        const avgCurrentLevel = skillAssessments.reduce((sum, s) => sum + s.currentLevel, 0) / skillAssessments.length;
        const requiredLevel = skill.requiredLevel || 3; // Default to 3 if not set
        const gap = Math.max(0, requiredLevel - avgCurrentLevel);
        const avgInterest = skillAssessments.reduce((sum, s) => sum + (s.interestLevel || 3), 0) / skillAssessments.length;
        
        let priority: number;
        if (priorityAlgorithm === 'weighted') {
          priority = gap * (requiredLevel / 5) * (avgInterest / 5) * skillAssessments.length;
        } else {
          priority = gap * skillAssessments.length;
        }

        let businessImpact: 'high' | 'medium' | 'low' = 'low';
        if (gap >= 2 || requiredLevel >= 4) businessImpact = 'high';
        else if (gap >= 1 || requiredLevel >= 3) businessImpact = 'medium';

        const affectedMembers = teamMembers.filter(member =>
          member.skills.some(s => s.skillId === skill.id && s.currentLevel < requiredLevel)
        );

        return {
          skillId: skill.id,
          skillName: skill.name,
          category: skill.category,
          requiredLevel,
          avgCurrentLevel,
          gap,
          memberCount: affectedMembers.length,
          avgInterest,
          priority,
          businessImpact,
          affectedMembers
        };
      })
      // NO minGapThreshold filter - show all skills with any gap
      .filter(gap => gap.gap > 0) // Only exclude perfect scores
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
  }, [teamMembers, skillCategories, selectedCategory, sortBy, priorityAlgorithm]);

  console.log('[GapAnalysis] Top Priority Skills:', {
    total: topPrioritySkills.length,
    top5: topPrioritySkills.slice(0, 5).map(s => ({ name: s.skillName, gap: s.gap, interest: s.avgInterest, members: s.memberCount })),
    greenBoxes: topPrioritySkills.filter(s => s.avgInterest >= 4 && s.gap >= 1.5).length,
    orangeBoxes: topPrioritySkills.filter(s => s.gap >= 2 && s.avgInterest < 2.5).length
  });

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
  // X-axis: Average current skill level (1-5)
  // Y-axis: Average interest level (1-5)
  // Creates quadrant matrix: low-low to high-high
  const scatterData = useMemo(() => {
    // Get ALL assessed skills (don't filter by gap threshold for the chart)
    const allSkills = skillCategories.flatMap(cat => cat.skills);
    const assessedSkills = allSkills
      .map(skill => {
        const skillAssessments = teamMembers
          .flatMap(member => member.skills)
          .filter(memberSkill => memberSkill.skillId === skill.id);
        
        if (skillAssessments.length === 0) return null;
        
        const avgCurrentLevel = skillAssessments.reduce((sum, s) => sum + s.currentLevel, 0) / skillAssessments.length;
        const avgInterest = skillAssessments.reduce((sum, s) => sum + (s.interestLevel || 3), 0) / skillAssessments.length;
        const gap = Math.max(0, (skill.requiredLevel || 3) - avgCurrentLevel);
        
        // Calculate priority - even skills with 0 gap get a base priority from interest and team size
        // This ensures the chart always shows data
        const priority = (gap + 0.5) * ((skill.requiredLevel || 3) / 5) * (avgInterest / 5) * skillAssessments.length;
        
        return {
          skill: skill.name,
          category: skill.category,
          x: avgCurrentLevel,
          y: avgInterest,
          currentLevel: avgCurrentLevel,
          requiredLevel: skill.requiredLevel || 3,
          gap,
          priority,
          members: skillAssessments.length
        };
      })
      .filter(s => s !== null) as any[];
    
    // Sort and get top N based on the selected sort criteria
    const topSkills = [...assessedSkills]
      .sort((a, b) => {
        switch (sortBy) {
          case 'gap':
            return b.gap - a.gap;
          case 'members':
            return b.members - a.members;
          case 'interest':
            return b.y - a.y; // Sort by avgInterest (y-axis)
          case 'priority':
          default:
            return b.priority - a.priority;
        }
      })
      .slice(0, topNFilter);
    
    const data = topSkills;
    
    // Debug logging
    console.log('[GapAnalysis] Scatter data:', {
      totalSkills: allSkills.length,
      assessedSkills: assessedSkills.length,
      topSkills: data.length,
      sortedBy: sortBy,
      sample: data.slice(0, 3)
    });

    // Calculate priority score ranges for color mapping
    const maxPriority = Math.max(...data.map(d => d.priority), 1);
    const minPriority = Math.min(...data.map(d => d.priority), 0);
    
    // Color by PRIORITY SCORE (not just quadrant)
    return {
      datasets: [{
        label: `Top ${data.length} Priority Skills (gap × importance × interest × team size)`,
        data,
        backgroundColor: data.map(d => {
          // Normalize priority to 0-1 scale
          const normalizedPriority = (d.priority - minPriority) / (maxPriority - minPriority || 1);
          
          // Color gradient from gray (low priority) to red (high priority)
          if (normalizedPriority >= 0.8) return 'rgba(239, 68, 68, 0.9)';   // High Priority (≥10)
          if (normalizedPriority >= 0.5) return 'rgba(245, 158, 11, 0.9)'; // Medium Priority (5-9)
          if (normalizedPriority >= 0.2) return 'rgba(59, 130, 246, 0.8)'; // Low Priority (2-4)
          return 'rgba(156, 163, 175, 0.7)'; // Very Low Priority (<2)
        }),
        borderColor: data.map(d => {
          const normalizedPriority = (d.priority - minPriority) / (maxPriority - minPriority || 1);
          
          if (normalizedPriority >= 0.8) return 'rgba(239, 68, 68, 1)';
          if (normalizedPriority >= 0.5) return 'rgba(245, 158, 11, 1)';
          if (normalizedPriority >= 0.2) return 'rgba(59, 130, 246, 1)';
          return 'rgba(156, 163, 175, 1)';
        }),
        borderWidth: 2,
        // SIZE proportional to GAP SEVERITY (bigger = larger gap = more urgent)
        pointRadius: data.map(d => Math.max(6, Math.min(20, 6 + (d.gap * 3)))),
        pointHoverRadius: data.map(d => Math.max(10, Math.min(24, 10 + (d.gap * 3))))
      }]
    };
  }, [teamMembers, skillCategories, topNFilter, sortBy]);

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
      <span className="text-sm text-white font-medium">{interest.toFixed(1)}/5</span>
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
        <span className="text-sm text-white font-medium">{score.toFixed(0)}</span>
      </div>
    );
  };

  // Load AI Recommendations for selected member
  const loadAIRecommendations = async (member: TeamMember) => {
    if (!member) return;
    
    setLoadingRecommendations(true);
    setSelectedMemberForAI(member.id);
    setShowAIRecommendations(true);

    try {
      // Get member's learning preference
      const learningPref = await getLearningPreference(member.id);
      
      // Build skill gaps array
      const skillGaps: SkillGap[] = gapData
        .filter(gap => gap.affectedMembers.some(m => m.id === member.id))
        .map(gap => {
          const memberSkill = member.skills.find(s => s.skillId === gap.skillId);
          return {
            skillId: gap.skillId,
            skillName: gap.skillName,
            category: gap.category,
            currentLevel: memberSkill?.currentLevel || 0,
            requiredLevel: gap.requiredLevel,
            gap: gap.requiredLevel - (memberSkill?.currentLevel || 0),
            interestLevel: memberSkill?.interestLevel || 3,
            criticality: gap.businessImpact === 'high' ? 'critical' as const : 
                         gap.businessImpact === 'medium' ? 'medium' as const : 'low' as const,
            businessImpact: gap.businessImpact === 'high' ? 9 : 
                            gap.businessImpact === 'medium' ? 5 : 3
          };
        });

      // Build team member profile
      const profile: TeamMemberProfile = {
        id: member.id,
        name: member.name,
        role: member.role,
        department: member.department,
        learningStyle: learningPref?.primary_style,
        skillGaps,
        timeAvailability: 10,
        budgetConstraint: 2000
      };

      // Get recommendations
      const recommendations = await getTrainingRecommendations(profile);
      
      // Get group opportunities
      const teamProfiles: TeamMemberProfile[] = teamMembers.map(tm => ({
        id: tm.id,
        name: tm.name,
        role: tm.role,
        department: tm.department,
        skillGaps: gapData
          .filter(gap => gap.affectedMembers.some(m => m.id === tm.id))
          .map(gap => {
            const memberSkill = tm.skills.find(s => s.skillId === gap.skillId);
            return {
              skillId: gap.skillId,
              skillName: gap.skillName,
              category: gap.category,
              currentLevel: memberSkill?.currentLevel || 0,
              requiredLevel: gap.requiredLevel,
              gap: gap.requiredLevel - (memberSkill?.currentLevel || 0),
              interestLevel: memberSkill?.interestLevel || 3,
              criticality: gap.businessImpact === 'high' ? 'critical' as const : 'medium' as const,
              businessImpact: 5
            };
          })
      }));

      const groupOpps = await getGroupTrainingOpportunities(
        member.department,
        teamProfiles
      );

      setAiRecommendations({
        ...recommendations,
        groupOpportunities: groupOpps
      });
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Generate 6-month learning path
  const handleGenerateLearningPath = async () => {
    if (!aiRecommendations || !selectedMemberForAI || !user) return;

    setGeneratingLearningPath(true);
    try {
      const member = teamMembers.find(m => m.id === selectedMemberForAI);
      if (!member) return;

      const learningPref = await getLearningPreference(member.id);
      const profile: TeamMemberProfile = {
        id: member.id,
        name: member.name,
        role: member.role,
        department: member.department,
        learningStyle: learningPref?.primary_style,
        skillGaps: [],
        timeAvailability: 10,
        budgetConstraint: 2000
      };

      await createLearningPath(
        profile,
        aiRecommendations.topRecommendations,
        user.id
      );

      alert('6-month learning path generated successfully!');
    } catch (error) {
      console.error('Error generating learning path:', error);
      alert('Failed to generate learning path. Please try again.');
    } finally {
      setGeneratingLearningPath(false);
    }
  };

  // Prepare bar chart data: Top 20 skills with biggest gaps
  const barChartData = useMemo(() => {
    return topPrioritySkills
      .slice(0, 20) // Top 20 only
      .sort((a, b) => b.gap - a.gap) // Sort by gap size (biggest first)
      .map(skill => ({
        skill: skill.skillName,
        current: skill.avgCurrentLevel,
        required: skill.requiredLevel,
        gap: skill.gap
      }));
  }, [topPrioritySkills]);

  return (
    <div className="space-y-6">
      {/* NEW: Refined Scatter Plots */}
      <SkillsGapScatterPlots 
        teamMembers={teamMembers}
        skillCategories={skillCategories}
      />

      {/* NEW: Bar Chart - Skills Gap Priority Matrix */}
      {showHeatmap && (
        <Card className="bg-white border-gray-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2" style={{ color: '#000000' }}>
              <BarChart3 className="w-5 h-5 text-red-600" />
              <span style={{ color: '#000000' }}>Skills Gap Priority Matrix - Top 20</span>
            </CardTitle>
            <CardDescription style={{ color: '#000000', fontWeight: '600' }}>
              Red bars show current team average, orange bars show target team average. Sorted by largest gap first.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {barChartData.map((data, index) => (
                <div key={data.skill} className="space-y-2">
                  {/* Skill Name */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 truncate" style={{ color: '#000000' }}>
                      {index + 1}. {data.skill}
                    </span>
                    <span className="text-xs font-bold text-red-600 ml-2">
                      Gap: {data.gap.toFixed(1)}
                    </span>
                  </div>
                  
                  {/* Bars Container */}
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    {/* Current Level Bar (Red) */}
                    <div 
                      className="absolute top-0 left-0 h-8 bg-red-500 flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(data.current / 5) * 100}%` }}
                    >
                      <span className="text-xs font-bold text-white">
                        {data.current.toFixed(1)}
                      </span>
                    </div>
                    
                    {/* Target Level Bar (Orange) - positioned behind */}
                    <div 
                      className="absolute top-0 left-0 h-8 bg-orange-400 opacity-60 transition-all"
                      style={{ width: `${(data.required / 5) * 100}%` }}
                    />
                    
                    {/* Target Level Value (on top) */}
                    <div 
                      className="absolute top-0 h-8 flex items-center transition-all"
                      style={{ left: `${(data.required / 5) * 100}%` }}
                    >
                      <span className="text-xs font-bold text-orange-700 ml-2">
                        Target: {data.required}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3" style={{ color: '#000000' }}>How to Read This Chart:</h4>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-4 bg-red-500 rounded"></div>
                  <span className="text-xs font-medium text-gray-900" style={{ color: '#000000' }}>Current Team Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-4 bg-orange-400 rounded"></div>
                  <span className="text-xs font-medium text-gray-900" style={{ color: '#000000' }}>Target Team Average</span>
                </div>
                <div className="text-xs text-gray-700 font-medium" style={{ color: '#000000' }}>
                  <strong>Larger gaps = Higher priority</strong> for training investment
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* OLD Priority Matrix - KEEP for reference but commented out */}
      {false && showHeatmap && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white font-bold" style={{ color: '#ffffff' }}>
              <BarChart3 className="w-5 h-5 text-white" />
              Skills Gap Priority Matrix
            </CardTitle>
            <CardDescription className="text-white font-medium" style={{ color: '#ffffff' }}>
              <strong className="text-white" style={{ color: '#ffffff' }}>Top Priority Skills Analysis:</strong>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-white font-medium" style={{ color: '#ffffff' }}>
                  Shows the <strong>top {topNFilter} highest-priority skills</strong> based on gap severity, business importance, team interest, and number of people affected. 
                  <strong> Point SIZE = Gap Severity</strong> (bigger dots = larger gaps = more urgent).
                  <strong> Point COLOR = Priority Score</strong> (red = highest priority, gray = lowest).
                </p>
                <ul className="space-y-1 text-xs text-white font-medium" style={{ color: '#ffffff' }}>
                  <li>🔴 <strong>Large Red Dots</strong> = Critical priority: Large gaps affecting many people with high business impact</li>
                  <li>🟠 <strong>Large Orange Dots</strong> = Medium priority: Significant gaps worth addressing</li>
                  <li>🔵 <strong>Medium Blue Dots</strong> = Lower priority: Small gaps or lower business impact</li>
                  <li>⚪ <strong>Small Gray Dots</strong> = Lowest priority: Minimal gaps, monitor only</li>
                </ul>
                <p className="text-xs text-white font-medium mt-2" style={{ color: '#ffffff' }}>
                  <strong>📊 Currently sorted by: {
                    sortBy === 'priority' ? 'Priority Score (gap × importance × interest × team size)' :
                    sortBy === 'gap' ? 'Skill Gap Size (required level - current level)' :
                    sortBy === 'members' ? 'Number of Team Members Affected' :
                    'Average Interest Level (team engagement)'
                  }</strong>
                </p>
                <p className="text-xs text-white font-medium" style={{ color: '#ffffff' }}>
                  • Use the "Priority Score" dropdown above to change what's displayed • Hover over dots for details
                </p>
              </div>
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
                        text: 'Average Current Skill Level (1-5)',
                        color: 'white',
                        font: { size: 14, weight: 'bold' }
                      },
                      min: 0,
                      max: 5,
                      ticks: { 
                        color: 'white', 
                        font: { size: 12 },
                        stepSize: 1
                      },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                      title: {
                        display: true,
                        text: 'Average Interest Level (1-5)',
                        color: 'white',
                        font: { size: 14, weight: 'bold' }
                      },
                      min: 0,
                      max: 5,
                      ticks: { 
                        color: 'white', 
                        font: { size: 12 },
                        stepSize: 1
                      },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                  },
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
                      titleFont: { size: 14, weight: 'bold' },
                      callbacks: {
                        title: (context: any) => {
                          return `📊 ${context[0].raw.skill}`;
                        },
                        label: (context: any) => {
                          const d = context.raw;
                          const priorityLevel = d.priority >= 10 ? 'CRITICAL' : 
                                               d.priority >= 5 ? 'HIGH' : 
                                               d.priority >= 2 ? 'MEDIUM' : 'LOW';
                          return [
                            `Category: ${d.category}`,
                            ``,
                            `🎯 Priority Score: ${d.priority.toFixed(1)} (${priorityLevel})`,
                            `📊 Gap Severity: ${d.gap.toFixed(1)} levels`,
                            ``,
                            `Current Level: ${d.currentLevel.toFixed(1)}/5 ⭐`,
                            `Required Level: ${d.requiredLevel}/5`,
                            `Interest Level: ${d.y.toFixed(1)}/5 🎯`,
                            ``,
                            `Team Members Assessed: ${d.members}`
                          ];
                        },
                        afterLabel: (context: any) => {
                          const d = context.raw;
                          const priorityLevel = d.priority >= 10 ? '🔴 CRITICAL PRIORITY' : 
                                               d.priority >= 5 ? '🟠 HIGH PRIORITY' : 
                                               d.priority >= 2 ? '🔵 MEDIUM PRIORITY' : '⚪ LOW PRIORITY';
                          
                          let recommendation = '';
                          if (d.gap >= 2) {
                            recommendation = 'Large gap - immediate training needed!';
                          } else if (d.gap >= 1) {
                            recommendation = 'Significant gap - schedule development soon.';
                          } else if (d.gap > 0.5) {
                            recommendation = 'Small gap - can be addressed with focused learning.';
                          } else {
                            recommendation = 'Minimal gap - monitor for future needs.';
                          }
                          
                          return `\n\n${priorityLevel}\n${recommendation}`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
            
            {/* Interpretation Guide */}
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                How to Use This Chart:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-white font-medium">
                <div className="flex items-start gap-2">
                  <div className="text-green-400 font-bold mt-0.5">✅</div>
                  <div>
                    <span className="font-semibold text-white">TOP-RIGHT (High Interest, Big Gap)</span> 
                    <p className="text-white font-medium">= BEST opportunities! Team wants to learn AND needs these skills.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-amber-400 font-bold mt-0.5">⚠️</div>
                  <div>
                    <span className="font-semibold text-white">BOTTOM-RIGHT (Low Interest, Big Gap)</span>
                    <p className="text-white font-medium">= Challenges. Need motivation strategies or external hiring.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-blue-400 font-bold mt-0.5">🚀</div>
                  <div>
                    <span className="font-semibold text-white">TOP-LEFT (High Interest, Small Gap)</span>
                    <p className="text-white font-medium">= Quick wins! Easy to close with minimal training.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-white font-medium font-bold mt-0.5">⏸️</div>
                  <div>
                    <span className="font-semibold text-white">BOTTOM-LEFT (Low Interest, Small Gap)</span>
                    <p className="text-white font-medium">= Low priority. Monitor but don't focus resources here.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Color Legend */}
            <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-600">
              <h4 className="text-sm font-semibold text-white mb-2">Priority Color Guide:</h4>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-xs text-white font-medium">High Priority (≥10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-white font-medium">Medium Priority (5-9)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-xs text-white font-medium">Low Priority (2-4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-500"></div>
                  <span className="text-xs text-white font-medium">Very Low Priority (&lt;2)</span>
                </div>
              </div>
            </div>
            
            {/* Quadrant Labels */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-green-900 border border-green-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-bold text-white">Quick Wins</span>
                </div>
                <p className="text-xs text-white font-medium">High interest, low gap - ideal for development</p>
              </div>
              <div className="p-3 bg-blue-900 border border-blue-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white">Strategic Development</span>
                </div>
                <p className="text-xs text-white font-medium">High interest, high gap - strategic focus needed</p>
              </div>
              <div className="p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="font-bold text-white">Low Priority</span>
                </div>
                <p className="text-xs text-white font-medium">Low interest, low gap - minimal impact</p>
              </div>
              <div className="p-3 bg-red-900 border border-red-700 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="font-bold text-white">Critical Gaps</span>
                </div>
                <p className="text-xs text-white font-medium">Low interest, high gap - urgent attention required</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Gaps Table - ACTIONABLE DATA */}
      <Card className="bg-white border-gray-300 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center gap-2" style={{ color: '#000000 !important' }}>
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span style={{ color: '#000000 !important' }}>🎯 TOP PRIORITY SKILLS TO DEVELOP</span>
          </CardTitle>
          <CardDescription style={{ color: '#000000 !important', fontWeight: '600' }}>
            These skills have the biggest gaps and highest priority. Focus training resources here for maximum impact.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left p-4 font-bold" style={{ color: '#000000' }}>Skill Name</th>
                  <th className="text-center p-4 font-bold" style={{ color: '#000000' }}>Gap Size</th>
                  <th className="text-center p-4 font-bold" style={{ color: '#000000' }}>Team Members</th>
                  <th className="text-center p-4 font-bold" style={{ color: '#000000' }}>Interest Level</th>
                  <th className="text-left p-4 font-bold" style={{ color: '#000000' }}>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {topPrioritySkills.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="text-gray-500 text-lg">
                        <p className="font-semibold mb-2">No skill gaps detected! 🎉</p>
                        <p className="text-sm">Your team is performing at or above required levels for all assessed skills.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  topPrioritySkills.slice(0, 15).map((gap, index) => (
                  <tr key={gap.skillId} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${index < 5 ? 'bg-red-50/30' : ''}`}>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-lg text-gray-900">{gap.skillName}</div>
                        <div className="text-sm text-gray-600 font-medium mt-1">{gap.category}</div>
                        <div className="text-xs mt-1 flex gap-3 text-gray-700">
                          <span>
                            <strong>Required:</strong> Level {gap.requiredLevel}
                          </span>
                          <span>
                            <strong>Current:</strong> Level {gap.avgCurrentLevel.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`text-2xl font-bold ${
                          gap.gap >= 2 ? 'text-red-600' : 
                          gap.gap >= 1 ? 'text-orange-600' : 
                          'text-blue-600'
                        }`}>
                          {gap.gap.toFixed(1)}
                        </div>
                        <div className="text-xs" style={{ color: '#000000' }}>levels</div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xl font-bold" style={{ color: '#000000' }}>{gap.memberCount}</div>
                        <div className="text-xs" style={{ color: '#000000' }}>people</div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-lg font-bold" style={{ color: '#000000' }}>
                          {gap.avgInterest.toFixed(1)}/5
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              gap.avgInterest >= 4 ? 'bg-green-500' :
                              gap.avgInterest >= 3 ? 'bg-blue-500' :
                              gap.avgInterest >= 2 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${(gap.avgInterest / 5) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs" style={{ color: '#000000' }}>
                          {gap.avgInterest >= 4 ? '⭐ High' :
                           gap.avgInterest >= 3 ? '✓ Medium' :
                           gap.avgInterest >= 2 ? '⚠️ Low' :
                           '❌ Very Low'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-2">
                        {gap.avgInterest >= 4 && gap.gap >= 1.5 ? (
                          <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                            <div className="font-semibold text-green-900 flex items-center gap-2 mb-1">
                              <CheckCircle className="w-4 h-4" />
                              EXCELLENT OPPORTUNITY!
                            </div>
                            <div className="text-sm text-green-800">
                              Team is eager to learn. Invest in training program.
                            </div>
                          </div>
                        ) : gap.avgInterest >= 2.5 && gap.gap >= 1 ? (
                          <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                            <div className="font-semibold text-blue-900 flex items-center gap-2 mb-1">
                              <Target className="w-4 h-4" />
                              GOOD CANDIDATE
                            </div>
                            <div className="text-sm text-blue-800">
                              Moderate interest. Schedule training workshop.
                            </div>
                          </div>
                        ) : gap.gap >= 2 && gap.avgInterest < 2.5 ? (
                          <div className="p-3 bg-orange-100 rounded-lg border border-orange-300">
                            <div className="font-semibold text-orange-900 flex items-center gap-2 mb-1">
                              <AlertCircle className="w-4 h-4" />
                              NEEDS MOTIVATION
                            </div>
                            <div className="text-sm text-orange-800">
                              Low interest but critical. Consider incentives or external hire.
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                            <div className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                              <XCircle className="w-4 h-4" />
                              LOW PRIORITY
                            </div>
                            <div className="text-sm text-gray-700">
                              Small gap or low interest. Monitor but not urgent.
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary Action Box - Only show if we have data */}
          {topPrioritySkills.length > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-400">
            <h4 className="font-bold text-lg mb-2" style={{ color: '#000000' }}>📋 IMMEDIATE ACTIONS:</h4>
            <ul className="space-y-2 text-sm" style={{ color: '#000000' }}>
              <li className="flex items-start gap-2">
                <span className="font-bold">1.</span>
                <span><strong>Top 5 skills</strong> (highlighted in pink) - These are CRITICAL. Book training sessions this month.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">2.</span>
                <span><strong>Green boxes</strong> (Excellent Opportunity) - Team wants to learn these! Invest here for best ROI.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">3.</span>
                <span><strong>Orange boxes</strong> (Needs Motivation) - Critical but low interest. Consider bonuses or hire externally.</span>
              </li>
            </ul>
          </div>
          )}
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
                      <div className="text-sm text-white font-medium">{mismatch.member.role}</div>
                      <div className="text-sm text-gray-100 font-medium">{mismatch.skill.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-white font-medium">Skill Level</div>
                      <Badge variant="outline" className="text-red-400 border-red-400">
                        {mismatch.currentLevel}/5
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-white font-medium">Interest Level</div>
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {mismatch.interestLevel}/5
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-white font-medium">Potential</div>
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

      {/* AI-Powered Training Recommendations */}
      <Card className="bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2" style={{ color: '#000000 !important', fontWeight: '700' }}>
                <Sparkles className="w-6 h-6 text-purple-600" />
                <span style={{ color: '#000000 !important' }}>AI-Powered Training Recommendations</span>
              </CardTitle>
              <CardDescription className="mt-2" style={{ color: '#000000 !important', fontWeight: '600' }}>
                Get personalized training recommendations based on skill gaps, learning styles, and business priorities
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIRecommendations(!showAIRecommendations)}
              className="border-purple-500 text-purple-400 hover:bg-purple-900/30"
            >
              {showAIRecommendations ? 'Hide' : 'Show'} Recommendations
            </Button>
          </div>
        </CardHeader>
        
        {showAIRecommendations && (
          <CardContent>
            {!selectedMemberForAI ? (
              <div className="text-center py-8">
                <p className="text-white font-medium mb-4">Select a team member to generate personalized recommendations</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {teamMembers.slice(0, 5).map(member => (
                    <Button
                      key={member.id}
                      onClick={() => loadAIRecommendations(member)}
                      disabled={loadingRecommendations}
                      variant="outline"
                      size="sm"
                    >
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {member.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : loadingRecommendations ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-white font-medium">Generating AI-powered recommendations...</p>
              </div>
            ) : aiRecommendations ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {teamMembers.find(m => m.id === selectedMemberForAI)?.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-white">
                        {teamMembers.find(m => m.id === selectedMemberForAI)?.name}
                      </div>
                      <div className="text-sm text-white font-medium">
                        {aiRecommendations.topRecommendations.length} recommendations • 
                        {' '}{aiRecommendations.totalEstimatedHours}h • 
                        {' '}£{aiRecommendations.totalEstimatedCost}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMemberForAI(null);
                        setAiRecommendations(null);
                      }}
                    >
                      Change Member
                    </Button>
                  </div>
                </div>
                
                <TrainingRecommendationCards
                  topRecommendations={aiRecommendations.topRecommendations}
                  quickWins={aiRecommendations.quickWins}
                  strategicInvestments={aiRecommendations.strategicInvestments}
                  groupOpportunities={aiRecommendations.groupOpportunities}
                  onGenerateLearningPath={handleGenerateLearningPath}
                  isGenerating={generatingLearningPath}
                />
              </div>
            ) : null}
          </CardContent>
        )}
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{gapData.length}</div>
            <div className="text-sm text-white font-medium">Total Gaps Identified</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">
              {gapData.filter(g => g.businessImpact === 'high').length}
            </div>
            <div className="text-sm text-white font-medium">Critical Gaps</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{mismatches.length}</div>
            <div className="text-sm text-white font-medium">Development Opportunities</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-500">
              {Math.round(gapData.reduce((sum, gap) => sum + gap.avgInterest, 0) / gapData.length)}
            </div>
            <div className="text-sm text-white font-medium">Avg Interest Level</div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Recommendations CTA */}
      <Card className="bg-gradient-to-br from-purple-100 to-blue-100 border-purple-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: '#000000 !important', fontWeight: '700' }}>
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span style={{ color: '#000000 !important' }}>AI-Powered Training Recommendations</span>
          </CardTitle>
          <CardDescription style={{ color: '#000000 !important', fontWeight: '600' }}>
            Get personalized training recommendations based on your skill gaps, interests, and learning style
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/accountancy/team-portal/training-recommendations')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate AI Recommendations
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GapAnalysis;
