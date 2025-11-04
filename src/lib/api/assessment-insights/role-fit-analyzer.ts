import { supabase } from '@/lib/supabase/client';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface RoleFitScores {
  advisorySuitability: number;
  technicalSuitability: number;
  hybridSuitability: number;
  leadershipReadiness: number;
  overallRoleFit: number;
}

export interface RedFlag {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  recommendation: string;
}

export interface DevelopmentPriority {
  area: string;
  priority: number;
  timeline: string;
  description: string;
}

export interface AssessmentInsight {
  memberId: string;
  memberName: string;
  assignedRoleType: 'advisory' | 'technical' | 'hybrid' | 'leadership' | 'unassigned';
  roleFitScores: RoleFitScores;
  belbinPrimary: string[];
  belbinSecondary: string[];
  motivationalDrivers: Record<string, number>;
  eqScores: Record<string, number>;
  conflictStylePrimary: string;
  communicationPreference: string;
  redFlags: RedFlag[];
  warningFlags: RedFlag[];
  developmentPriorities: DevelopmentPriority[];
  trainingLevel: 'critical' | 'enhancement' | 'excellence' | 'none';
  currentRoleMatch: number;
  recommendedRoleType: string;
  successionReadiness: number;
}

// =====================================================
// ROLE-FIT CALCULATION ALGORITHMS
// =====================================================

export class RoleFitAnalyzer {
  /**
   * Calculate advisory suitability score (0-100)
   */
  calculateAdvisorySuitability(memberData: any): number {
    let score = 0;
    const weights = {
      eq_social: 0.25,
      eq_relationship: 0.20,
      belbin_people: 0.20,
      motivation_influence: 0.15,
      conflict_collaborative: 0.10,
      communication_sync: 0.10
    };

    // EQ Social Awareness (target: ≥70)
    const socialAwareness = memberData.eq_scores?.social_awareness || 50;
    score += (socialAwareness / 100) * weights.eq_social * 100;

    // EQ Relationship Management (target: ≥70)
    const relationshipMgmt = memberData.eq_scores?.relationship_management || 50;
    score += (relationshipMgmt / 100) * weights.eq_relationship * 100;

    // Belbin People-Oriented Roles
    const peopleRoles = ['Coordinator', 'Resource Investigator', 'Teamworker', 'Shaper'];
    const belbinPrimary = memberData.belbin_primary || [];
    const hasPeopleRole = belbinPrimary.some((role: string) => peopleRoles.includes(role));
    score += (hasPeopleRole ? 1 : 0) * weights.belbin_people * 100;

    // Motivational Drivers (Achievement + Influence)
    const achievement = memberData.motivational_drivers?.achievement || 50;
    const influence = memberData.motivational_drivers?.influence || 50;
    const motivationScore = (achievement + influence) / 2;
    score += (motivationScore / 100) * weights.motivation_influence * 100;

    // Conflict Style (Collaborating preferred)
    const isCollaborative = memberData.conflict_style_primary === 'Collaborating';
    score += (isCollaborative ? 1 : 0) * weights.conflict_collaborative * 100;

    // Communication Preference (Sync or Balanced)
    const prefersSyncComm = ['High-sync', 'Balanced'].includes(memberData.communication_preference || '');
    score += (prefersSyncComm ? 1 : 0) * weights.communication_sync * 100;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate technical suitability score (0-100)
   */
  calculateTechnicalSuitability(memberData: any): number {
    let score = 0;
    const weights = {
      belbin_specialist: 0.30,
      eq_self_management: 0.20,
      motivation_achievement: 0.20,
      motivation_autonomy: 0.15,
      attention_detail: 0.15
    };

    // Belbin Specialist/Implementer/Completer Finisher
    const techRoles = ['Specialist', 'Implementer', 'Completer Finisher', 'Monitor Evaluator'];
    const belbinPrimary = memberData.belbin_primary || [];
    const hasTechRole = belbinPrimary.some((role: string) => techRoles.includes(role));
    score += (hasTechRole ? 1 : 0) * weights.belbin_specialist * 100;

    // EQ Self-Management
    const selfManagement = memberData.eq_scores?.self_management || 50;
    score += (selfManagement / 100) * weights.eq_self_management * 100;

    // Motivational Drivers
    const achievement = memberData.motivational_drivers?.achievement || 50;
    const autonomy = memberData.motivational_drivers?.autonomy || 50;
    score += (achievement / 100) * weights.motivation_achievement * 100;
    score += (autonomy / 100) * weights.motivation_autonomy * 100;

    // Attention to Detail (from skills assessment)
    const detailSkillLevel = this.getSkillLevel(memberData.skills, 'Attention to Detail');
    const detailScore = detailSkillLevel / 5; // Normalize to 0-1
    score += detailScore * weights.attention_detail * 100;

    return Math.min(100, Math.round(score));
  }

  /**
   * Calculate hybrid suitability score (0-100)
   */
  calculateHybridSuitability(advisoryScore: number, technicalScore: number): number {
    const minThreshold = 60;

    if (advisoryScore < minThreshold || technicalScore < minThreshold) {
      return 0; // Not suitable for hybrid
    }

    // Average of both, with bonus for balance
    const average = (advisoryScore + technicalScore) / 2;
    const balance = 100 - Math.abs(advisoryScore - technicalScore);

    return Math.round((average * 0.7) + (balance * 0.3));
  }

  /**
   * Calculate leadership readiness score (0-100)
   */
  calculateLeadershipReadiness(memberData: any): number {
    let score = 0;
    const weights = {
      eq_relationship: 0.30,
      eq_social: 0.20,
      belbin_leadership: 0.25,
      motivation_influence: 0.15,
      experience: 0.10
    };

    // EQ Relationship Management (critical for leaders)
    const relationshipMgmt = memberData.eq_scores?.relationship_management || 50;
    score += (relationshipMgmt / 100) * weights.eq_relationship * 100;

    // EQ Social Awareness
    const socialAwareness = memberData.eq_scores?.social_awareness || 50;
    score += (socialAwareness / 100) * weights.eq_social * 100;

    // Belbin Leadership Roles
    const leadershipRoles = ['Coordinator', 'Shaper'];
    const belbinPrimary = memberData.belbin_primary || [];
    const hasLeadershipRole = belbinPrimary.some((role: string) => leadershipRoles.includes(role));
    score += (hasLeadershipRole ? 1 : 0) * weights.belbin_leadership * 100;

    // Motivational Drivers (Influence/Power)
    const influence = memberData.motivational_drivers?.influence || 50;
    score += (influence / 100) * weights.motivation_influence * 100;

    // Experience (based on seniority)
    const seniorityScore = this.getSeniorityScore(memberData.role);
    score += seniorityScore * weights.experience * 100;

    return Math.min(100, Math.round(score));
  }

  /**
   * Detect red flags for role misalignment
   */
  detectRedFlags(memberData: any, assignedRole: string): RedFlag[] {
    const flags: RedFlag[] = [];

    // ADVISORY ROLE RED FLAGS
    if (assignedRole === 'advisory') {
      // Low EQ Social Awareness
      const socialAwareness = memberData.eq_scores?.social_awareness || 50;
      if (socialAwareness < 55) {
        flags.push({
          type: 'low_eq_social',
          severity: 'critical',
          message: `EQ Social Awareness (${socialAwareness}) below 55 for advisory role`,
          recommendation: 'Intensive EQ coaching or role realignment to technical position'
        });
      }

      // Async-only communication preference
      if (memberData.communication_preference === 'Async-heavy') {
        flags.push({
          type: 'async_only_advisory',
          severity: 'high',
          message: 'Async-only communication preference for client-facing role',
          recommendation: 'Communication flexibility training or consider technical role'
        });
      }

      // No people-oriented Belbin roles
      const peopleRoles = ['Coordinator', 'Resource Investigator', 'Teamworker', 'Shaper'];
      const allBelbin = [...(memberData.belbin_primary || []), ...(memberData.belbin_secondary || [])];
      const hasPeopleRole = allBelbin.some((role: string) => peopleRoles.includes(role));

      if (!hasPeopleRole) {
        flags.push({
          type: 'no_people_belbin_advisory',
          severity: 'high',
          message: 'No people-oriented Belbin roles for advisory position',
          recommendation: 'Develop Resource Investigator or Coordinator traits through coaching'
        });
      }

      // Avoiding conflict style
      if (memberData.conflict_style_primary === 'Avoiding') {
        flags.push({
          type: 'avoiding_conflict_advisory',
          severity: 'medium',
          message: 'Avoiding conflict style for client-facing role',
          recommendation: 'Conflict resolution training and role-play exercises'
        });
      }
    }

    // TECHNICAL ROLE RED FLAGS
    if (assignedRole === 'technical') {
      // Low attention to detail
      const detailLevel = this.getSkillLevel(memberData.skills, 'Attention to Detail');
      if (detailLevel < 3) {
        flags.push({
          type: 'low_detail_technical',
          severity: 'high',
          message: `Attention to Detail (Level ${detailLevel}) below level 3 for technical role`,
          recommendation: 'Quality assurance training and systematic review processes'
        });
      }

      // No technical Belbin roles
      const techRoles = ['Specialist', 'Implementer', 'Completer Finisher'];
      const allBelbin = [...(memberData.belbin_primary || []), ...(memberData.belbin_secondary || [])];
      const hasTechRole = allBelbin.some((role: string) => techRoles.includes(role));

      if (!hasTechRole) {
        flags.push({
          type: 'no_tech_belbin',
          severity: 'medium',
          message: 'No technical-oriented Belbin roles',
          recommendation: 'Develop Specialist or Implementer strengths through focused work'
        });
      }
    }

    // LEADERSHIP RED FLAGS
    if (['Partner', 'Director', 'Manager'].includes(memberData.role)) {
      // Low Relationship Management EQ
      const relationshipMgmt = memberData.eq_scores?.relationship_management || 50;
      if (relationshipMgmt < 60) {
        flags.push({
          type: 'low_eq_relationship_leader',
          severity: 'critical',
          message: `Relationship Management (${relationshipMgmt}) below 60 for leadership role`,
          recommendation: 'Leadership coaching programme with focus on team dynamics'
        });
      }

      // No leadership Belbin roles
      const leadershipRoles = ['Coordinator', 'Shaper'];
      const belbinPrimary = memberData.belbin_primary || [];
      const hasLeadershipRole = belbinPrimary.some((role: string) => leadershipRoles.includes(role));

      if (!hasLeadershipRole) {
        flags.push({
          type: 'no_leadership_belbin',
          severity: 'high',
          message: 'No leadership-oriented Belbin roles for management position',
          recommendation: 'Leadership development programme with mentoring component'
        });
      }
    }

    return flags;
  }

  /**
   * Generate development priorities
   */
  generateDevelopmentPriorities(memberData: any, roleFitScores: RoleFitScores, redFlags: RedFlag[]): DevelopmentPriority[] {
    const priorities: DevelopmentPriority[] = [];

    // Critical priorities from red flags
    const criticalFlags = redFlags.filter(f => f.severity === 'critical');
    criticalFlags.forEach(flag => {
      priorities.push({
        area: flag.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        priority: 1,
        timeline: 'Immediate (0-3 months)',
        description: flag.recommendation
      });
    });

    // Role-specific development
    const assignedRole = this.determineRecommendedRole(roleFitScores);

    if (assignedRole === 'advisory' && roleFitScores.advisorySuitability < 75) {
      priorities.push({
        area: 'Client Relationship Building',
        priority: 2,
        timeline: '3-6 months',
        description: 'Improve advisory capability through client exposure and communication training'
      });
    }

    if (assignedRole === 'technical' && roleFitScores.technicalSuitability < 75) {
      priorities.push({
        area: 'Technical Excellence',
        priority: 2,
        timeline: '3-6 months',
        description: 'Develop technical depth through specialist training and certifications'
      });
    }

    // Leadership development if leadership readiness is moderate
    if (roleFitScores.leadershipReadiness >= 50 && roleFitScores.leadershipReadiness < 70) {
      priorities.push({
        area: 'Leadership Development',
        priority: 3,
        timeline: '6-12 months',
        description: 'Prepare for leadership through delegation, coaching skills, and strategic thinking'
      });
    }

    return priorities.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Helper: Get skill level by name
   */
  private getSkillLevel(skills: any[], skillName: string): number {
    const skill = skills?.find(s => s.name?.toLowerCase() === skillName.toLowerCase());
    return skill?.current_level || 0;
  }

  /**
   * Helper: Get seniority score
   */
  private getSeniorityScore(role: string): number {
    const seniorityMap: Record<string, number> = {
      'Partner': 1.0,
      'Director': 0.9,
      'Associate Director': 0.8,
      'Manager': 0.7,
      'Assistant Manager': 0.6,
      'Senior': 0.5,
      'Junior': 0.3,
      'Admin': 0.2
    };
    return seniorityMap[role] || 0.5;
  }

  /**
   * Helper: Determine recommended role type
   */
  private determineRecommendedRole(scores: RoleFitScores): string {
    const { advisorySuitability, technicalSuitability, hybridSuitability } = scores;

    if (hybridSuitability >= 70) return 'hybrid';
    if (advisorySuitability > technicalSuitability && advisorySuitability >= 60) return 'advisory';
    if (technicalSuitability >= 60) return 'technical';
    
    return 'unassigned';
  }
}

// Export singleton instance
export const roleFitAnalyzer = new RoleFitAnalyzer();

