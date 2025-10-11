/**
 * Analytics API
 * PROMPT 8: Analytics & Insights Dashboard
 * 
 * Provides comprehensive analytics data for skills and CPD tracking
 */

import { supabase } from '@/lib/supabase/client';

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
 * Get team capability metrics
 */
export async function getTeamMetrics(practiceId: string): Promise<TeamMetrics> {
  try {
    // In a real implementation, this would call a database view or function
    // For now, we'll construct from multiple queries
    
    // Get member count
    const { data: members, error: membersError } = await supabase
      .from('practice_members')
      .select('id')
      .eq('practice_id', practiceId);

    if (membersError) throw membersError;
    const totalMembers = members?.length || 0;

    // Get skills count
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id');

    if (skillsError) throw skillsError;
    const totalSkills = skills?.length || 0;

    // Calculate metrics (simplified - would be more complex in production)
    const teamCapabilityScore = 75; // Would calculate from assessments
    const skillsCoverage = 82; // Would calculate from assessments
    const avgImprovement = 12.5; // Would calculate from tracking
    const cpdCompliance = 88; // Would calculate from CPD data
    const mentoringEngagement = 65; // Would calculate from mentoring data

    return {
      team_capability_score: teamCapabilityScore,
      skills_coverage_percentage: skillsCoverage,
      avg_skill_improvement_rate: avgImprovement,
      cpd_compliance_rate: cpdCompliance,
      mentoring_engagement_score: mentoringEngagement,
      total_members: totalMembers,
      total_skills: totalSkills,
      total_cpd_hours: 450, // From CPD tracker
      total_mentoring_sessions: 32 // From mentoring system
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
    // Mock data - would query skill_improvement_tracking table
    const mockData: SkillProgressionPoint[] = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      mockData.push({
        date: date.toISOString().split('T')[0],
        avg_level: 2.5 + (Math.random() * 0.5) + (i * 0.1),
        skill_name: 'Tax Planning',
        category: 'Technical',
        member_count: 12
      });
    }

    return mockData;
  } catch (error) {
    console.error('Error fetching skill progression:', error);
    throw error;
  }
}

/**
 * Get department comparison data
 */
export async function getDepartmentComparison(
  practiceId: string
): Promise<DepartmentComparison[]> {
  try {
    // Mock data - would query assessments grouped by department
    return [
      {
        department: 'Tax',
        avg_technical: 4.2,
        avg_soft_skills: 3.5,
        avg_compliance: 4.5,
        avg_business: 3.8,
        avg_leadership: 3.2,
        member_count: 8
      },
      {
        department: 'Audit',
        avg_technical: 4.0,
        avg_soft_skills: 4.1,
        avg_compliance: 4.3,
        avg_business: 3.9,
        avg_leadership: 3.7,
        member_count: 10
      },
      {
        department: 'Advisory',
        avg_technical: 3.8,
        avg_soft_skills: 4.3,
        avg_compliance: 3.9,
        avg_business: 4.2,
        avg_leadership: 4.0,
        member_count: 6
      }
    ];
  } catch (error) {
    console.error('Error fetching department comparison:', error);
    throw error;
  }
}

/**
 * Get CPD investment vs improvement data
 */
export async function getCPDInvestmentAnalysis(
  practiceId: string
): Promise<CPDInvestment[]> {
  try {
    // Mock data - would join CPD activities with skill improvements
    return [
      { member_name: 'John Smith', hours_invested: 40, improvement: 1.2, roi: 3.0, cost: 800 },
      { member_name: 'Sarah Jones', hours_invested: 35, improvement: 1.5, roi: 4.3, cost: 700 },
      { member_name: 'Mike Wilson', hours_invested: 50, improvement: 1.0, roi: 2.0, cost: 1000 },
      { member_name: 'Emma Davis', hours_invested: 45, improvement: 1.8, roi: 4.0, cost: 900 },
      { member_name: 'Tom Brown', hours_invested: 30, improvement: 0.8, roi: 2.7, cost: 600 }
    ];
  } catch (error) {
    console.error('Error fetching CPD investment analysis:', error);
    throw error;
  }
}

/**
 * Get skill demand vs supply heatmap
 */
export async function getSkillDemandSupply(
  practiceId: string
): Promise<SkillDemandSupply[]> {
  try {
    // Mock data - would calculate from requirements vs current levels
    return [
      { skill_name: 'Tax Planning', demand_score: 90, supply_score: 75, gap: 15, category: 'Technical' },
      { skill_name: 'Financial Audit', demand_score: 85, supply_score: 80, gap: 5, category: 'Technical' },
      { skill_name: 'Client Management', demand_score: 95, supply_score: 65, gap: 30, category: 'Soft Skills' },
      { skill_name: 'Data Analytics', demand_score: 80, supply_score: 45, gap: 35, category: 'Technical' },
      { skill_name: 'Leadership', demand_score: 70, supply_score: 55, gap: 15, category: 'Leadership' }
    ];
  } catch (error) {
    console.error('Error fetching skill demand/supply:', error);
    throw error;
  }
}

/**
 * Get individual growth trajectories
 */
export async function getGrowthTrajectories(
  practiceId: string,
  limit: number = 10
): Promise<GrowthTrajectory[]> {
  try {
    // Mock data - would query skill assessment history
    return [
      {
        member_id: '1',
        member_name: 'John Smith',
        data_points: [
          { date: '2025-06', avg_skill_level: 2.5, total_skills: 20 },
          { date: '2025-07', avg_skill_level: 2.7, total_skills: 22 },
          { date: '2025-08', avg_skill_level: 2.9, total_skills: 24 },
          { date: '2025-09', avg_skill_level: 3.1, total_skills: 25 },
          { date: '2025-10', avg_skill_level: 3.3, total_skills: 26 }
        ]
      },
      {
        member_id: '2',
        member_name: 'Sarah Jones',
        data_points: [
          { date: '2025-06', avg_skill_level: 3.0, total_skills: 25 },
          { date: '2025-07', avg_skill_level: 3.2, total_skills: 27 },
          { date: '2025-08', avg_skill_level: 3.5, total_skills: 28 },
          { date: '2025-09', avg_skill_level: 3.7, total_skills: 30 },
          { date: '2025-10', avg_skill_level: 4.0, total_skills: 32 }
        ]
      }
    ];
  } catch (error) {
    console.error('Error fetching growth trajectories:', error);
    throw error;
  }
}

/**
 * Get skills at risk (declining trends)
 */
export async function getSkillsAtRisk(
  practiceId: string
): Promise<SkillAtRisk[]> {
  try {
    // Mock data - would analyze trends in skill_improvement_tracking
    return [
      {
        skill_name: 'VAT Compliance',
        category: 'Compliance',
        trend: 'declining',
        current_avg_level: 3.2,
        decline_rate: -0.15,
        affected_members: 5,
        recommendation: 'Schedule refresher training. VAT rules have changed recently.'
      },
      {
        skill_name: 'Excel Advanced',
        category: 'Technical',
        trend: 'stagnant',
        current_avg_level: 2.8,
        decline_rate: 0.0,
        affected_members: 8,
        recommendation: 'Introduce new analytics tools to revitalize this skill area.'
      }
    ];
  } catch (error) {
    console.error('Error fetching skills at risk:', error);
    throw error;
  }
}

/**
 * Get succession planning alerts
 */
export async function getSuccessionAlerts(
  practiceId: string
): Promise<SuccessionAlert[]> {
  try {
    // Mock data - would analyze role requirements vs member skills
    return [
      {
        role: 'Tax Partner',
        current_holder: 'Jane Doe (retiring in 18 months)',
        risk_level: 'high',
        potential_successors: [
          {
            name: 'John Smith',
            readiness_score: 75,
            skills_gap: ['Client Portfolio Management', 'Business Development']
          },
          {
            name: 'Sarah Jones',
            readiness_score: 68,
            skills_gap: ['Leadership', 'Strategic Planning', 'Business Development']
          }
        ],
        recommendation: 'Accelerate leadership training for John Smith. Consider external hire as backup.'
      }
    ];
  } catch (error) {
    console.error('Error fetching succession alerts:', error);
    throw error;
  }
}

/**
 * Get training ROI predictions
 */
export async function getTrainingROIPredictions(
  practiceId: string
): Promise<TrainingROI[]> {
  try {
    // Mock data - would use ML model based on historical data
    return [
      {
        training_type: 'Data Analytics Bootcamp',
        predicted_improvement: 1.5,
        estimated_cost: 2500,
        estimated_hours: 40,
        expected_roi: 3.2,
        confidence: 0.85
      },
      {
        training_type: 'Leadership Development Program',
        predicted_improvement: 1.2,
        estimated_cost: 3000,
        estimated_hours: 60,
        expected_roi: 2.8,
        confidence: 0.78
      },
      {
        training_type: 'Client Communication Workshop',
        predicted_improvement: 0.8,
        estimated_cost: 800,
        estimated_hours: 16,
        expected_roi: 4.5,
        confidence: 0.92
      }
    ];
  } catch (error) {
    console.error('Error fetching training ROI predictions:', error);
    throw error;
  }
}

/**
 * Get future skill gap forecasts
 */
export async function getSkillGapForecasts(
  practiceId: string
): Promise<SkillGapForecast[]> {
  try {
    // Mock data - would use trend analysis and industry data
    return [
      {
        skill_name: 'AI/ML for Accounting',
        category: 'Technical',
        current_gap: 45,
        predicted_gap_3_months: 50,
        predicted_gap_6_months: 55,
        predicted_gap_12_months: 60,
        trend: 'worsening',
        recommendation: 'Urgent: Invest in AI training now. Industry demand increasing rapidly.'
      },
      {
        skill_name: 'ESG Reporting',
        category: 'Compliance',
        current_gap: 35,
        predicted_gap_3_months: 32,
        predicted_gap_6_months: 28,
        predicted_gap_12_months: 25,
        trend: 'improving',
        recommendation: 'On track. Continue current training initiatives.'
      },
      {
        skill_name: 'Cybersecurity Awareness',
        category: 'Compliance',
        current_gap: 25,
        predicted_gap_3_months: 25,
        predicted_gap_6_months: 26,
        predicted_gap_12_months: 27,
        trend: 'stable',
        recommendation: 'Maintain current level. Consider advanced training for IT team.'
      }
    ];
  } catch (error) {
    console.error('Error fetching skill gap forecasts:', error);
    throw error;
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

