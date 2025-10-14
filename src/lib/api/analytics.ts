/**
 * Analytics API
 * PROMPT 8: Analytics & Insights Dashboard
 * 
 * Provides comprehensive analytics data for skills and CPD tracking
 */

import { supabase } from '@/lib/supabase/client';

// Type helper to safely cast Supabase query results
const toArray = (data: any): any[] => (data as any[] || []);

// Types
export interface TeamMetrics {
  team_capability_score: number;
  skills_coverage_percentage: number;
  avg_skill_improvement_rate: number;
  cpd_compliance_rate: number;
  mentoring_engagement_score: number;
  total_members: number;
  total_skills: number;
  total_cpd_hours: number;
  total_mentoring_sessions: number;
}

export interface SkillProgressionPoint {
  date: string;
  avg_level: number;
  skill_name: string;
  category: string;
  member_count: number;
}

export interface DepartmentComparison {
  department: string;
  avg_technical: number;
  avg_soft_skills: number;
  avg_compliance: number;
  avg_business: number;
  avg_leadership: number;
  member_count: number;
}

export interface CPDInvestment {
  member_name: string;
  hours_invested: number;
  improvement: number;
  roi: number;
  cost: number;
}

export interface SkillDemandSupply {
  skill_name: string;
  demand_score: number;
  supply_score: number;
  gap: number;
  category: string;
}

export interface GrowthTrajectory {
  member_id: string;
  member_name: string;
  data_points: {
    date: string;
    avg_skill_level: number;
    total_skills: number;
  }[];
}

export interface SkillAtRisk {
  skill_name: string;
  category: string;
  trend: 'declining' | 'stagnant';
  current_avg_level: number;
  decline_rate: number;
  affected_members: number;
  recommendation: string;
}

export interface SuccessionAlert {
  role: string;
  current_holder: string;
  risk_level: 'high' | 'medium' | 'low';
  potential_successors: {
    name: string;
    readiness_score: number;
    skills_gap: string[];
  }[];
  recommendation: string;
}

export interface TrainingROI {
  training_type: string;
  predicted_improvement: number;
  estimated_cost: number;
  estimated_hours: number;
  expected_roi: number;
  confidence: number;
}

export interface SkillGapForecast {
  skill_name: string;
  category: string;
  current_gap: number;
  predicted_gap_3_months: number;
  predicted_gap_6_months: number;
  predicted_gap_12_months: number;
  trend: 'improving' | 'stable' | 'worsening';
  recommendation: string;
}

/**
 * Get team capability metrics - REAL DATA
 */
export async function getTeamMetrics(practiceId: string): Promise<TeamMetrics> {
  try {
    console.log('[getTeamMetrics] Fetching real data for practice:', practiceId);
    
    // Get member count
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    const totalMembers = members?.length || 0;
    const memberIds = toArray(members).map((m: any) => m.id);

    // Get skills count
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, required_level');

    if (skillsError) throw skillsError;
    const totalSkills = skills?.length || 0;

    // Get all skill assessments for the practice
    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select('team_member_id, skill_id, current_level, target_level')
      .in('team_member_id', memberIds);

    if (assessError) throw assessError;

    // Calculate team capability score (average of all current levels / 5 * 100)
    const avgLevel = assessments && assessments.length > 0
      ? toArray(assessments).reduce((sum: number, a: any) => sum + a.current_level, 0) / assessments.length
      : 0;
    const teamCapabilityScore = Math.round((avgLevel / 5) * 100);

    // Calculate skills coverage (% of skills assessed by at least one member)
    const assessedSkillIds = new Set(toArray(assessments).map((a: any) => a.skill_id));
    const skillsCoverage = totalSkills > 0 ? Math.round((assessedSkillIds.size / totalSkills) * 100) : 0;

    // Calculate improvement rate (would need historical data - simplified for now)
    const avgImprovement = 0; // TODO: Implement with skill_improvement_tracking

    // Get CPD data
    const { data: cpdData } = await supabase
      .from('cpd_activities')
      .select('hours, team_member_id')
      .in('team_member_id', memberIds);

    const totalCPDHours = toArray(cpdData).reduce((sum: number, c: any) => sum + (c.hours || 0), 0);
    
    // CPD compliance (members with >0 hours / total members * 100)
    const membersWithCPD = new Set(toArray(cpdData).map((c: any) => c.team_member_id)).size;
    const cpdCompliance = totalMembers > 0 ? Math.round((membersWithCPD / totalMembers) * 100) : 0;

    // Mentoring engagement (simplified - would need mentoring_relationships table)
    const mentoringEngagement = 0; // TODO: Implement with mentoring data

    console.log('[getTeamMetrics] Calculated:', {
      teamCapabilityScore,
      skillsCoverage,
      totalMembers,
      totalSkills,
      assessmentsCount: assessments?.length || 0,
      totalCPDHours,
      cpdCompliance
    });

    return {
      team_capability_score: teamCapabilityScore,
      skills_coverage_percentage: skillsCoverage,
      avg_skill_improvement_rate: avgImprovement,
      cpd_compliance_rate: cpdCompliance,
      mentoring_engagement_score: mentoringEngagement,
      total_members: totalMembers,
      total_skills: totalSkills,
      total_cpd_hours: totalCPDHours,
      total_mentoring_sessions: 0 // TODO: Implement with mentoring data
    };
  } catch (error) {
    console.error('Error fetching team metrics:', error);
    throw error;
  }
}

/**
 * Get skill progression timeline
 */
export async function getSkillProgression(
  practiceId: string,
  skillId?: string,
  months: number = 6
): Promise<SkillProgressionPoint[]> {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startDateStr = startDate.toISOString();

    // Query skill assessments over time
    let query = supabase
      .from('skill_assessments')
      .select(`
        assessed_at,
        current_level,
        skill_id,
        skills (
          name,
          category
        )
      `)
      .gte('assessed_at', startDateStr)
      .order('assessed_at', { ascending: true });

    if (skillId) {
      query = query.eq('skill_id', skillId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching skill progression:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Group by month and calculate averages
    const progressionMap = new Map<string, {
      total: number;
      count: number;
      skillName: string;
      category: string;
      memberIds: Set<string>;
    }>();

    data.forEach((assessment: any) => {
      const date = new Date(assessment.assessed_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      
      if (!progressionMap.has(monthKey)) {
        progressionMap.set(monthKey, {
          total: 0,
          count: 0,
          skillName: assessment.skills?.name || 'Unknown',
          category: assessment.skills?.category || 'Unknown',
          memberIds: new Set()
        });
      }

      const entry = progressionMap.get(monthKey)!;
      entry.total += assessment.current_level;
      entry.count += 1;
      entry.memberIds.add(assessment.team_member_id);
    });

    // Convert to array format
    const progression: SkillProgressionPoint[] = Array.from(progressionMap.entries())
      .map(([date, data]) => ({
        date,
        avg_level: data.total / data.count,
        skill_name: data.skillName,
        category: data.category,
        member_count: data.memberIds.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return progression;
  } catch (error) {
    console.error('Error fetching skill progression:', error);
    return [];
  }
}

/**
 * Get department comparison data - REAL DATA
 */
export async function getDepartmentComparison(
  practiceId: string
): Promise<DepartmentComparison[]> {
  try {
    console.log('[getDepartmentComparison] Fetching real data for practice:', practiceId);

    // Get all members with their departments
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id, department')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    // Get all skill assessments with skill categories
    const memberIds = members.map(m => m.id);
    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select(`
        team_member_id,
        current_level,
        skills (
          category
        )
      `)
      .in('team_member_id', memberIds);

    if (assessError) throw assessError;
    if (!assessments || assessments.length === 0) return [];

    // Group by department and category
    const deptMap = new Map<string, {
      members: Set<string>;
      categories: Map<string, { total: number; count: number }>;
    }>();

    members.forEach(member => {
      const dept = member.department || 'Advisory';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          members: new Set(),
          categories: new Map()
        });
      }
      deptMap.get(dept)!.members.add(member.id);
    });

    // Aggregate assessments by department and category
    assessments.forEach((assessment: any) => {
      const member = members.find(m => m.id === assessment.team_member_id);
      if (!member) return;

      const dept = member.department || 'Advisory';
      const deptData = deptMap.get(dept)!;
      const category = assessment.skills?.category || 'Technical';

      if (!deptData.categories.has(category)) {
        deptData.categories.set(category, { total: 0, count: 0 });
      }

      const catData = deptData.categories.get(category)!;
      catData.total += assessment.current_level;
      catData.count += 1;
    });

    // Convert to output format
    const result: DepartmentComparison[] = Array.from(deptMap.entries()).map(([dept, data]) => {
      const getAvg = (cat: string) => {
        const catData = data.categories.get(cat);
        return catData && catData.count > 0 ? Number((catData.total / catData.count).toFixed(1)) : 0;
      };

      return {
        department: dept,
        avg_technical: getAvg('Technical Accounting Fundamentals') || getAvg('Tax & Compliance - UK Focus') || 0,
        avg_soft_skills: getAvg('Communication & Soft Skills') || 0,
        avg_compliance: getAvg('Tax & Compliance - UK Focus') || 0,
        avg_business: getAvg('Advisory & Consulting') || getAvg('Client Management & Development') || 0,
        avg_leadership: getAvg('Leadership & Team Skills') || 0,
        member_count: data.members.size
      };
    });

    console.log('[getDepartmentComparison] Result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching department comparison:', error);
    return [];
  }
}

/**
 * Get CPD investment vs improvement data - REAL DATA
 */
export async function getCPDInvestmentAnalysis(
  practiceId: string
): Promise<CPDInvestment[]> {
  try {
    console.log('[getCPDInvestmentAnalysis] Fetching real data for practice:', practiceId);

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id, name')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    const memberIds = members.map(m => m.id);

    // Get CPD activities
    const { data: cpdActivities, error: cpdError } = await supabase
      .from('cpd_activities')
      .select('team_member_id, hours, cost')
      .in('team_member_id', memberIds);

    if (cpdError) throw cpdError;

    // Get skill assessments to calculate improvement
    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select('team_member_id, current_level, target_level')
      .in('team_member_id', memberIds);

    if (assessError) throw assessError;

    // Calculate metrics per member
    const result: CPDInvestment[] = members.map(member => {
      // Sum CPD hours and costs
      const memberCPD = cpdActivities?.filter(c => c.team_member_id === member.id) || [];
      const hours = memberCPD.reduce((sum, c) => sum + (c.hours || 0), 0);
      const cost = memberCPD.reduce((sum, c) => sum + (c.cost || 0), 0);

      // Calculate average improvement (target - current)
      const memberAssessments = assessments?.filter(a => a.team_member_id === member.id) || [];
      const avgImprovement = memberAssessments.length > 0
        ? memberAssessments.reduce((sum, a) => sum + (a.target_level - a.current_level), 0) / memberAssessments.length
        : 0;

      // Calculate ROI (improvement per hour)
      const roi = hours > 0 ? (avgImprovement * 10) / hours : 0; // Simplified formula

      return {
        member_name: member.name,
        hours_invested: hours,
        improvement: Number(Math.max(0, avgImprovement).toFixed(1)),
        roi: Number(Math.max(0, roi).toFixed(1)),
        cost: cost
      };
    }).filter(m => m.hours_invested > 0); // Only show members with CPD activity

    console.log('[getCPDInvestmentAnalysis] Result:', result);
    return result;
  } catch (error) {
    console.error('Error fetching CPD investment analysis:', error);
    return [];
  }
}

/**
 * Get skill demand vs supply heatmap - REAL DATA
 */
export async function getSkillDemandSupply(
  practiceId: string
): Promise<SkillDemandSupply[]> {
  try {
    console.log('[getSkillDemandSupply] Fetching real data for practice:', practiceId);

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    const memberIds = members.map(m => m.id);

    // Get all skills with required levels
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category, required_level');

    if (skillsError) throw skillsError;
    if (!skills || skills.length === 0) return [];

    // Get all assessments
    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select('skill_id, current_level')
      .in('team_member_id', memberIds);

    if (assessError) throw assessError;

    // Calculate demand vs supply for each skill
    const result: SkillDemandSupply[] = skills.map(skill => {
      // Demand score: required level * 20 (to get 0-100 scale)
      const demandScore = skill.required_level * 20;

      // Supply score: average current level * 20
      const skillAssessments = assessments?.filter(a => a.skill_id === skill.id) || [];
      const avgLevel = skillAssessments.length > 0
        ? skillAssessments.reduce((sum, a) => sum + a.current_level, 0) / skillAssessments.length
        : 0;
      const supplyScore = Math.round(avgLevel * 20);

      // Gap: difference
      const gap = demandScore - supplyScore;

      return {
        skill_name: skill.name,
        demand_score: demandScore,
        supply_score: supplyScore,
        gap: gap,
        category: skill.category
      };
    })
    .filter(s => s.gap > 0) // Only show skills with gaps
    .sort((a, b) => b.gap - a.gap) // Sort by gap descending
    .slice(0, 15); // Top 15

    console.log('[getSkillDemandSupply] Result:', result.length, 'skills with gaps');
    return result;
  } catch (error) {
    console.error('Error fetching skill demand/supply:', error);
    return [];
  }
}

/**
 * Get individual growth trajectories - REAL DATA
 */
export async function getGrowthTrajectories(
  practiceId: string,
  limit: number = 10
): Promise<GrowthTrajectory[]> {
  try {
    console.log('[getGrowthTrajectories] Fetching real data for practice:', practiceId);

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id, name')
      .eq('practice_id', practiceId)
      .limit(limit);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    const memberIds = members.map(m => m.id);

    // Get all assessments with dates
    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select('team_member_id, current_level, assessed_at')
      .in('team_member_id', memberIds)
      .order('assessed_at', { ascending: true });

    if (assessError) throw assessError;
    if (!assessments || assessments.length === 0) return [];

    // Group by member and month
    const result: GrowthTrajectory[] = members.map(member => {
      const memberAssessments = assessments.filter(a => a.team_member_id === member.id);
      
      // Group by month
      const monthlyData = new Map<string, { levels: number[]; count: number }>();
      
      memberAssessments.forEach(assessment => {
        const date = new Date(assessment.assessed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { levels: [], count: 0 });
        }
        
        const data = monthlyData.get(monthKey)!;
        data.levels.push(assessment.current_level);
        data.count++;
      });

      // Convert to data points
      const data_points = Array.from(monthlyData.entries())
        .map(([date, data]) => ({
          date,
          avg_skill_level: Number((data.levels.reduce((sum, l) => sum + l, 0) / data.levels.length).toFixed(1)),
          total_skills: data.count
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        member_id: member.id,
        member_name: member.name,
        data_points
      };
    }).filter(m => m.data_points.length > 0); // Only members with assessment history

    console.log('[getGrowthTrajectories] Result:', result.length, 'members with trajectories');
    return result;
  } catch (error) {
    console.error('Error fetching growth trajectories:', error);
    return [];
  }
}

/**
 * Get skills at risk (declining or stagnant trends) - REAL DATA
 */
export async function getSkillsAtRisk(
  practiceId: string
): Promise<SkillAtRisk[]> {
  try {
    console.log('[getSkillsAtRisk] Fetching real data for practice:', practiceId);

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    const memberIds = members.map(m => m.id);

    // Get all skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category, required_level');

    if (skillsError) throw skillsError;
    if (!skills || skills.length === 0) return [];

    // Get assessments with dates (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select('skill_id, current_level, assessed_at, team_member_id')
      .in('team_member_id', memberIds)
      .gte('assessed_at', sixMonthsAgo.toISOString())
      .order('assessed_at', { ascending: true });

    if (assessError) throw assessError;
    if (!assessments || assessments.length === 0) return [];

    // Analyze each skill for trends
    const result: SkillAtRisk[] = [];

    skills.forEach(skill => {
      const skillAssessments = assessments.filter(a => a.skill_id === skill.id);
      if (skillAssessments.length < 2) return; // Need at least 2 data points

      // Get current average
      const currentAvg = skillAssessments.reduce((sum, a) => sum + a.current_level, 0) / skillAssessments.length;

      // Check if below required level
      if (currentAvg >= skill.required_level) return; // Not at risk

      // Simple trend analysis: compare first half vs second half
      const mid = Math.floor(skillAssessments.length / 2);
      const firstHalf = skillAssessments.slice(0, mid);
      const secondHalf = skillAssessments.slice(mid);

      const firstAvg = firstHalf.reduce((sum, a) => sum + a.current_level, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, a) => sum + a.current_level, 0) / secondHalf.length;
      const declineRate = secondAvg - firstAvg;

      // Determine trend
      let trend: 'declining' | 'stagnant' = 'stagnant';
      if (declineRate < -0.1) trend = 'declining';

      // Count affected members
      const affectedMemberIds = new Set(skillAssessments.map(a => a.team_member_id));

      result.push({
        skill_name: skill.name,
        category: skill.category,
        trend,
        current_avg_level: Number(currentAvg.toFixed(1)),
        decline_rate: Number(declineRate.toFixed(2)),
        affected_members: affectedMemberIds.size,
        recommendation: trend === 'declining'
          ? `Schedule refresher training. ${skill.name} levels are declining.`
          : `Introduce new tools or training to revitalize this skill area.`
      });
    });

    console.log('[getSkillsAtRisk] Result:', result.length, 'skills at risk');
    return result.slice(0, 10); // Top 10
  } catch (error) {
    console.error('Error fetching skills at risk:', error);
    return [];
  }
}

/**
 * Get succession planning alerts - REAL DATA
 */
export async function getSuccessionAlerts(
  practiceId: string
): Promise<SuccessionAlert[]> {
  try {
    console.log('[getSuccessionAlerts] Fetching real data for practice:', practiceId);

    // Get all members with their roles
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id, name, role')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    // Get all senior roles that might need succession planning
    const seniorRoles = ['Partner', 'Director', 'Manager'];
    const seniorMembers = members.filter(m => seniorRoles.some(role => m.role?.includes(role)));

    if (seniorMembers.length === 0) return [];

    const memberIds = members.map(m => m.id);

    // Get all skill assessments
    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select('team_member_id, skill_id, current_level')
      .in('team_member_id', memberIds);

    if (assessError) throw assessError;

    // Get all skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category');

    if (skillsError) throw skillsError;

    // For each senior role, find potential successors
    const result: SuccessionAlert[] = seniorMembers.map(seniorMember => {
      // Get senior member's skills
      const seniorSkills = assessments?.filter(a => a.team_member_id === seniorMember.id) || [];
      const seniorSkillIds = new Set(seniorSkills.map(s => s.skill_id));

      // Find other members who could be successors
      const potentialSuccessors = members
        .filter(m => m.id !== seniorMember.id && m.role !== seniorMember.role)
        .map(member => {
          const memberSkills = assessments?.filter(a => a.team_member_id === member.id) || [];
          const memberSkillIds = new Set(memberSkills.map(s => s.skill_id));

          // Calculate readiness: % of senior skills they have
          const overlap = Array.from(seniorSkillIds).filter(id => memberSkillIds.has(id)).length;
          const readinessScore = seniorSkillIds.size > 0
            ? Math.round((overlap / seniorSkillIds.size) * 100)
            : 0;

          // Find skills gap
          const gapSkillIds = Array.from(seniorSkillIds).filter(id => !memberSkillIds.has(id));
          const skills_gap = gapSkillIds
            .map(id => skills?.find(s => s.id === id)?.name)
            .filter((name): name is string => !!name)
            .slice(0, 3); // Top 3 gaps

          return {
            name: member.name,
            readiness_score: readinessScore,
            skills_gap
          };
        })
        .filter(s => s.readiness_score > 50) // Only show viable successors
        .sort((a, b) => b.readiness_score - a.readiness_score)
        .slice(0, 3); // Top 3 successors

      // Determine risk level
      const topReadiness = potentialSuccessors[0]?.readiness_score || 0;
      const risk_level: 'high' | 'medium' | 'low' =
        topReadiness < 60 ? 'high' :
        topReadiness < 75 ? 'medium' : 'low';

      return {
        role: seniorMember.role || 'Senior Role',
        current_holder: seniorMember.name,
        risk_level,
        potential_successors: potentialSuccessors,
        recommendation: potentialSuccessors.length > 0
          ? `Accelerate leadership training for ${potentialSuccessors[0].name}. ${risk_level === 'high' ? 'Consider external hire as backup.' : ''}`
          : 'No clear internal successor identified. Consider external recruitment.'
      };
    });

    console.log('[getSuccessionAlerts] Result:', result.length, 'succession alerts');
    return result;
  } catch (error) {
    console.error('Error fetching succession alerts:', error);
    return [];
  }
}

/**
 * Get training ROI predictions - REAL DATA (simplified)
 */
export async function getTrainingROIPredictions(
  practiceId: string
): Promise<TrainingROI[]> {
  try {
    console.log('[getTrainingROIPredictions] Fetching real data for practice:', practiceId);

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    const memberIds = members.map(m => m.id);

    // Get skill gaps (skills below required level)
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category, required_level');

    if (skillsError) throw skillsError;

    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select('skill_id, current_level, target_level')
      .in('team_member_id', memberIds);

    if (assessError) throw assessError;

    // Calculate gaps by category
    const categoryGaps = new Map<string, { gap: number; count: number }>();

    skills?.forEach(skill => {
      const skillAssessments = assessments?.filter(a => a.skill_id === skill.id) || [];
      if (skillAssessments.length === 0) return;

      const avgLevel = skillAssessments.reduce((sum, a) => sum + a.current_level, 0) / skillAssessments.length;
      const gap = Math.max(0, skill.required_level - avgLevel);

      if (gap > 0.5) { // Only significant gaps
        if (!categoryGaps.has(skill.category)) {
          categoryGaps.set(skill.category, { gap: 0, count: 0 });
        }
        const data = categoryGaps.get(skill.category)!;
        data.gap += gap;
        data.count++;
      }
    });

    // Create training recommendations based on gaps
    const result: TrainingROI[] = Array.from(categoryGaps.entries())
      .map(([category, data]) => {
        const avgGap = data.gap / data.count;
        
        // Estimate training parameters based on gap size and category
        const estimated_hours = Math.round(avgGap * 20); // ~20 hours per gap level
        const estimated_cost = estimated_hours * 50; // £50/hour estimate
        const predicted_improvement = Number(avgGap.toFixed(1));
        const expected_roi = Number((predicted_improvement / (estimated_hours / 10)).toFixed(1));
        const confidence = data.count > 5 ? 0.85 : 0.70; // Higher confidence with more data

        return {
          training_type: `${category} Development Program`,
          predicted_improvement,
          estimated_cost,
          estimated_hours,
          expected_roi,
          confidence
        };
      })
      .sort((a, b) => b.expected_roi - a.expected_roi)
      .slice(0, 5); // Top 5

    console.log('[getTrainingROIPredictions] Result:', result.length, 'predictions');
    return result;
  } catch (error) {
    console.error('Error fetching training ROI predictions:', error);
    return [];
  }
}

/**
 * Get future skill gap forecasts - REAL DATA (simplified projection)
 */
export async function getSkillGapForecasts(
  practiceId: string
): Promise<SkillGapForecast[]> {
  try {
    console.log('[getSkillGapForecasts] Fetching real data for practice:', practiceId);

    // Get members
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    if (!members || members.length === 0) return [];

    const memberIds = members.map(m => m.id);

    // Get skills with required levels
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category, required_level');

    if (skillsError) throw skillsError;

    // Get assessments
    const { data: assessments, error: assessError } = await supabase
      .from('skill_assessments')
      .select('skill_id, current_level, target_level, assessed_at')
      .in('team_member_id', memberIds)
      .order('assessed_at', { ascending: true });

    if (assessError) throw assessError;

    // Calculate current gaps and trends
    const result: SkillGapForecast[] = (skills || [])
      .map(skill => {
        const skillAssessments = assessments?.filter(a => a.skill_id === skill.id) || [];
        if (skillAssessments.length === 0) return null;

        // Current gap
        const avgLevel = skillAssessments.reduce((sum, a) => sum + a.current_level, 0) / skillAssessments.length;
        const currentGap = Math.max(0, skill.required_level - avgLevel);
        
        // Try to detect trend from assessment history
        let trend: 'improving' | 'stable' | 'worsening' = 'stable';
        if (skillAssessments.length >= 2) {
          const mid = Math.floor(skillAssessments.length / 2);
          const firstHalfAvg = skillAssessments.slice(0, mid).reduce((sum, a) => sum + a.current_level, 0) / mid;
          const secondHalfAvg = skillAssessments.slice(mid).reduce((sum, a) => sum + a.current_level, 0) / (skillAssessments.length - mid);
          const changeRate = secondHalfAvg - firstHalfAvg;
          
          if (changeRate > 0.2) trend = 'improving';
          else if (changeRate < -0.2) trend = 'worsening';
        }

        // Project future gaps based on trend
        const trendRate = trend === 'improving' ? -0.1 : trend === 'worsening' ? 0.1 : 0;
        const predicted_gap_3_months = Math.round(Math.max(0, currentGap + trendRate * 1));
        const predicted_gap_6_months = Math.round(Math.max(0, currentGap + trendRate * 2));
        const predicted_gap_12_months = Math.round(Math.max(0, currentGap + trendRate * 4));

        return {
          skill_name: skill.name,
          category: skill.category,
          current_gap: Math.round(currentGap),
          predicted_gap_3_months,
          predicted_gap_6_months,
          predicted_gap_12_months,
          trend,
          recommendation: trend === 'improving'
            ? 'On track. Continue current training initiatives.'
            : trend === 'worsening'
            ? `Urgent: Skill gap increasing. Invest in ${skill.name} training now.`
            : `Stable. Monitor and maintain current training level.`
        };
      })
      .filter((f): f is SkillGapForecast => f !== null && f.current_gap > 0)
      .sort((a, b) => b.current_gap - a.current_gap)
      .slice(0, 10); // Top 10

    console.log('[getSkillGapForecasts] Result:', result.length, 'forecasts');
    return result;
  } catch (error) {
    console.error('Error fetching skill gap forecasts:', error);
    return [];
  }
}

/**
 * Export data for reports
 */
export async function exportReportData(
  practiceId: string,
  reportType: 'monthly' | 'board' | 'individual' | 'benchmarking',
  filters?: {
    dateRange?: { start: string; end: string };
    department?: string;
    memberId?: string;
  }
): Promise<any> {
  try {
    // Gather all relevant data based on report type
    const [metrics, progression, departments, cpdAnalysis] = await Promise.all([
      getTeamMetrics(practiceId),
      getSkillProgression(practiceId),
      getDepartmentComparison(practiceId),
      getCPDInvestmentAnalysis(practiceId)
    ]);

    return {
      report_type: reportType,
      generated_at: new Date().toISOString(),
      practice_id: practiceId,
      filters,
      data: {
        metrics,
        progression,
        departments,
        cpd_analysis: cpdAnalysis
      }
    };
  } catch (error) {
    console.error('Error exporting report data:', error);
    throw error;
  }
}

