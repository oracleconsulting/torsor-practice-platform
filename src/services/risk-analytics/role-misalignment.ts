/**
 * Role Misalignment Monitoring & Alerting
 * 
 * Proactively detects when team members are in roles that don't match their assessments
 * Generates alerts for managers and suggests interventions
 * 
 * This prevents retention issues by catching misalignment BEFORE it becomes a problem
 */

import { supabase } from '@/lib/supabase/client';

export interface RoleMisalignmentAlert {
  memberId: string;
  memberName: string;
  memberRole: string;
  
  // Misalignment details
  misalignmentType: 'role_fit' | 'eq_mismatch' | 'motivation_mismatch' | 'skill_gap' | 'multiple';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  
  // Scores
  currentRoleMatch: number;        // 0-100
  optimalRoleMatch: number;        // 0-100 for suggested role
  gap: number;                     // Difference
  
  // Specific issues
  issues: Array<{
    issue: string;
    currentValue: number;
    requiredValue: number;
    gap: number;
    description: string;
  }>;
  
  // Recommendations
  suggestedRole: string;
  suggestedActions: Array<{
    action: string;
    priority: 'Immediate' | 'Short-term' | 'Medium-term';
    expectedImprovement: number;
    description: string;
  }>;
  
  // Retention risk
  retentionRiskIncrease: number;   // How much this adds to retention risk
  timeToIntervene: string;         // "Within X weeks"
  
  detectedAt: string;
}

export interface MisalignmentSummary {
  totalMisaligned: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  
  byType: Record<string, number>;
  alerts: RoleMisalignmentAlert[];
  calculatedAt: string;
}

/**
 * Detect all role misalignments in practice
 */
export async function detectRoleMisalignments(practiceId: string): Promise<MisalignmentSummary> {
  console.log('[RoleMisalignment] 🔍 Detecting misalignments for practice:', practiceId);

  try {
    // Get all active, non-test members with their role insights
    const { data: members } = await supabase
      .from('practice_members')
      .select('id, name, role, email')
      .eq('is_active', true)
      .or('is_test_account.is.null,is_test_account.eq.false');

    if (!members || members.length === 0) {
      return getEmptySummary();
    }

    const alerts: RoleMisalignmentAlert[] = [];
    const typeCount: Record<string, number> = {};
    let critical = 0, high = 0, medium = 0, low = 0;

    for (const member of members) {
      const memberAlerts = await detectMemberMisalignment(member);
      if (memberAlerts.length > 0) {
        alerts.push(...memberAlerts);
        
        memberAlerts.forEach(alert => {
          // Count by type
          typeCount[alert.misalignmentType] = (typeCount[alert.misalignmentType] || 0) + 1;
          
          // Count by severity
          if (alert.severity === 'Critical') critical++;
          else if (alert.severity === 'High') high++;
          else if (alert.severity === 'Medium') medium++;
          else low++;
        });
      }
    }

    // Sort alerts by severity (critical first)
    const severityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      totalMisaligned: alerts.length,
      critical,
      high,
      medium,
      low,
      byType: typeCount,
      alerts,
      calculatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('[RoleMisalignment] Error detecting misalignments:', error);
    return getEmptySummary();
  }
}

/**
 * Detect misalignments for a single member
 */
async function detectMemberMisalignment(member: any): Promise<RoleMisalignmentAlert[]> {
  const alerts: RoleMisalignmentAlert[] = [];

  // Get assessment data
  const [
    roleInsights,
    eq,
    motivation,
    skills
  ] = await Promise.all([
    supabase.from('assessment_insights').select('*').eq('member_id', member.id).maybeSingle(),
    supabase.from('eq_assessments').select('*').eq('practice_member_id', member.id).maybeSingle(),
    supabase.from('motivational_drivers').select('*').eq('practice_member_id', member.id).maybeSingle(),
    supabase.from('skill_assessments').select('*, skills(name)').eq('team_member_id', member.id)
  ]);

  const issues: Array<{
    issue: string;
    currentValue: number;
    requiredValue: number;
    gap: number;
    description: string;
  }> = [];

  // CHECK 1: Overall Role Fit Score
  if (roleInsights?.data && roleInsights.data.current_role_match_percentage !== null) {
    const roleMatch = roleInsights.data.current_role_match_percentage;
    
    if (roleMatch < 60) {
      const suggestedRole = roleInsights.data.recommended_role_type || 'To be determined';
      const optimalScore = suggestedRole === 'advisory' ? roleInsights.data.advisory_suitability_score :
                          suggestedRole === 'technical' ? roleInsights.data.technical_suitability_score :
                          suggestedRole === 'hybrid' ? roleInsights.data.hybrid_suitability_score :
                          roleInsights.data.leadership_readiness_score;

      issues.push({
        issue: 'Overall Role Fit',
        currentValue: roleMatch,
        requiredValue: 70,
        gap: 70 - roleMatch,
        description: `Current role match is ${roleMatch}%. Suggested role: ${suggestedRole} (${optimalScore}% fit)`
      });
    }
  }

  // CHECK 2: EQ Mismatch (Low EQ in client-facing role)
  if (eq?.data && member.role) {
    const overallEQ = eq.data.overall_eq || 0;
    const isClientFacing = 
      member.role.toLowerCase().includes('partner') ||
      member.role.toLowerCase().includes('director') ||
      member.role.toLowerCase().includes('manager');

    if (isClientFacing && overallEQ < 60) {
      issues.push({
        issue: 'EQ Too Low for Client-Facing Role',
        currentValue: overallEQ,
        requiredValue: 70,
        gap: 70 - overallEQ,
        description: `EQ of ${overallEQ} is below recommended ${70} for client-facing roles. May struggle with relationship management.`
      });
    }
  }

  // CHECK 3: Motivation Mismatch
  if (motivation?.data && member.role) {
    const achievement = motivation.data.driver_scores?.achievement || 50;
    const influence = motivation.data.driver_scores?.influence || 50;
    const autonomy = motivation.data.driver_scores?.autonomy || 50;

    const isJunior = 
      member.role.toLowerCase().includes('junior') ||
      member.role.toLowerCase().includes('assistant');

    // High achievers in junior roles = misalignment
    if ((achievement >= 75 || influence >= 75) && isJunior) {
      issues.push({
        issue: 'High Ambition in Junior Role',
        currentValue: Math.max(achievement, influence),
        requiredValue: 60,
        gap: Math.max(achievement, influence) - 60,
        description: `High achievement/influence motivation (${Math.max(achievement, influence)}) not fulfilled in junior role. Needs growth opportunities.`
      });
    }

    // High autonomy needs without autonomy
    if (autonomy >= 75) {
      issues.push({
        issue: 'High Autonomy Need',
        currentValue: autonomy,
        requiredValue: 75,
        gap: 0,
        description: `Member has high need for autonomy (${autonomy}). Ensure they have sufficient independence in their role.`
      });
    }
  }

  // CHECK 4: Critical Skill Gaps
  if (skills?.data && Array.isArray(skills.data)) {
    const criticalSkills = ['Client Relationship Management', 'Financial Reporting', 'Tax Compliance'];
    const isClientFacing = 
      member.role && (
        member.role.toLowerCase().includes('partner') ||
        member.role.toLowerCase().includes('director') ||
        member.role.toLowerCase().includes('manager')
      );

    if (isClientFacing) {
      for (const criticalSkill of criticalSkills) {
        const skillData = skills.data.find((s: any) => s.skills?.name === criticalSkill);
        const currentLevel = skillData?.current_level || 0;

        if (currentLevel < 3) {
          issues.push({
            issue: `Critical Skill Gap: ${criticalSkill}`,
            currentValue: currentLevel,
            requiredValue: 3,
            gap: 3 - currentLevel,
            description: `Level ${currentLevel}/5 in ${criticalSkill}, but level 3+ needed for ${member.role}`
          });
        }
      }
    }
  }

  // If we found issues, create alert(s)
  if (issues.length > 0) {
    // Determine severity
    const avgGap = issues.reduce((sum, i) => sum + i.gap, 0) / issues.length;
    const severity: 'Critical' | 'High' | 'Medium' | 'Low' =
      avgGap >= 30 ? 'Critical' :
      avgGap >= 20 ? 'High' :
      avgGap >= 10 ? 'Medium' : 'Low';

    // Determine misalignment type
    const types = new Set(issues.map(i => {
      if (i.issue.includes('Role Fit')) return 'role_fit';
      if (i.issue.includes('EQ')) return 'eq_mismatch';
      if (i.issue.includes('Ambition') || i.issue.includes('Autonomy')) return 'motivation_mismatch';
      if (i.issue.includes('Skill')) return 'skill_gap';
      return 'other';
    }));
    const misalignmentType = types.size > 1 ? 'multiple' : Array.from(types)[0] as any;

    // Generate recommendations
    const suggestedActions = generateMisalignmentActions(issues, member, roleInsights?.data);

    // Calculate retention risk increase
    const retentionRiskIncrease = severity === 'Critical' ? 30 :
                                 severity === 'High' ? 20 :
                                 severity === 'Medium' ? 10 : 5;

    const timeToIntervene = severity === 'Critical' ? 'Within 1-2 weeks' :
                           severity === 'High' ? 'Within 1 month' :
                           'Within 2-3 months';

    const currentRoleMatch = roleInsights?.data?.current_role_match_percentage || 50;
    const optimalRoleMatch = Math.max(
      roleInsights?.data?.advisory_suitability_score || 0,
      roleInsights?.data?.technical_suitability_score || 0,
      roleInsights?.data?.hybrid_suitability_score || 0
    );

    alerts.push({
      memberId: member.id,
      memberName: member.name,
      memberRole: member.role || 'Unassigned',
      misalignmentType,
      severity,
      currentRoleMatch,
      optimalRoleMatch,
      gap: Math.max(0, optimalRoleMatch - currentRoleMatch),
      issues,
      suggestedRole: roleInsights?.data?.recommended_role_type || 'Review needed',
      suggestedActions,
      retentionRiskIncrease,
      timeToIntervene,
      detectedAt: new Date().toISOString()
    });
  }

  return alerts;
}

/**
 * Generate recommended actions for misalignment
 */
function generateMisalignmentActions(
  issues: any[],
  member: any,
  roleInsights: any
): Array<{
  action: string;
  priority: 'Immediate' | 'Short-term' | 'Medium-term';
  expectedImprovement: number;
  description: string;
}> {
  const actions = [];

  // Action for role fit issues
  if (issues.some(i => i.issue.includes('Role Fit'))) {
    actions.push({
      action: 'Role Review & Reassignment Discussion',
      priority: 'Immediate' as const,
      expectedImprovement: 40,
      description: `Schedule urgent meeting to discuss role fit. Consider transition to ${roleInsights?.recommended_role_type || 'more suitable'} role or adjustment of current responsibilities.`
    });
  }

  // Action for EQ issues
  if (issues.some(i => i.issue.includes('EQ'))) {
    actions.push({
      action: 'EQ Development Program or Role Adjustment',
      priority: 'Short-term' as const,
      expectedImprovement: 25,
      description: 'Either provide EQ coaching/training (12-16 weeks) or transition to less client-facing role where EQ demands are lower.'
    });
  }

  // Action for motivation issues
  if (issues.some(i => i.issue.includes('Ambition') || i.issue.includes('Autonomy'))) {
    actions.push({
      action: 'Career Development & Growth Opportunities',
      priority: 'Immediate' as const,
      expectedImprovement: 35,
      description: 'Create clear progression plan with milestones. Identify opportunities for advancement or expanded responsibilities within 6 months.'
    });
  }

  // Action for skill gaps
  if (issues.some(i => i.issue.includes('Skill'))) {
    actions.push({
      action: 'Targeted Skills Training',
      priority: 'Short-term' as const,
      expectedImprovement: 30,
      description: 'Develop focused training plan for critical skill gaps. Assign mentor, provide resources, set 90-day development goals.'
    });
  }

  // Generic support action
  if (actions.length === 0) {
    actions.push({
      action: 'One-on-One Support Discussion',
      priority: 'Short-term' as const,
      expectedImprovement: 20,
      description: 'Schedule check-in to understand concerns and provide support. Identify any barriers to success.'
    });
  }

  return actions.sort((a, b) => b.expectedImprovement - a.expectedImprovement);
}

/**
 * Get empty summary
 */
function getEmptySummary(): MisalignmentSummary {
  return {
    totalMisaligned: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    byType: {},
    alerts: [],
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Generate manager notification for new/worsening misalignments
 */
export async function generateManagerAlerts(practiceId: string): Promise<Array<{
  managerId: string;
  managerName: string;
  managerEmail: string;
  alerts: RoleMisalignmentAlert[];
  urgentCount: number;
}>> {
  const summary = await detectRoleMisalignments(practiceId);
  
  // Group alerts by manager (would need reporting structure in DB)
  // For now, return all urgent alerts for practice leadership
  
  const urgentAlerts = summary.alerts.filter(a => 
    a.severity === 'Critical' || a.severity === 'High'
  );

  // In real implementation, would query reporting structure and group by manager
  // For now, return a single notification for practice leadership
  return [{
    managerId: 'practice-leadership',
    managerName: 'Practice Leadership',
    managerEmail: 'leadership@practice.com',
    alerts: urgentAlerts,
    urgentCount: urgentAlerts.length
  }];
}

