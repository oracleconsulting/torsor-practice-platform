import type { Skill, PracticeMember, SkillAssessment } from './types';
import type { ServiceLine } from './advisory-services';

export interface SkillReadiness {
  skillName: string;
  required: number;
  ideal: number;
  isCritical: boolean;
  membersWithSkill: Array<{
    memberId: string;
    memberName: string;
    currentLevel: number;
  }>;
  membersMeetingMinimum: number;
  membersMeetingIdeal: number;
  averageLevel: number;
  gap: number; // How many more people needed at minimum level
}

export interface ServiceReadiness {
  service: ServiceLine;
  readinessPercent: number;
  canDeliverNow: boolean;
  skillsReady: number;
  totalSkills: number;
  criticalSkillsMet: number;
  totalCriticalSkills: number;
  skillReadiness: SkillReadiness[];
  teamMembersCapable: Array<{
    memberId: string;
    memberName: string;
    skillsCovered: number;
    interestRank?: number;
    experienceLevel?: number;
    desiredInvolvement?: number;
    hasHighInterest?: boolean;
  }>;
  gaps: SkillReadiness[];
  recommendations: string[];
}

export function calculateServiceReadiness(
  service: ServiceLine,
  members: PracticeMember[],
  assessments: SkillAssessment[],
  skills: Skill[],
  serviceInterests?: Map<string, { rank: number; experience: number; involvement: number }>
): ServiceReadiness {
  const skillReadiness: SkillReadiness[] = service.requiredSkills.map((req) => {
    // Find the skill in our skills list
    const skill = skills.find((s) => 
      s.name.toLowerCase() === req.skillName.toLowerCase()
    );

    if (!skill) {
      // Skill not found in our database
      return {
        skillName: req.skillName,
        required: req.minimumLevel,
        ideal: req.idealLevel,
        isCritical: req.criticalToDelivery,
        membersWithSkill: [],
        membersMeetingMinimum: 0,
        membersMeetingIdeal: 0,
        averageLevel: 0,
        gap: 1, // Need at least 1 person
      };
    }

    // Find all assessments for this skill
    const skillAssessments = assessments.filter((a) => a.skill_id === skill.id);

    // Map assessments to members
    const membersWithSkill = skillAssessments
      .map((assessment) => {
        const member = members.find((m) => m.id === assessment.member_id);
        if (!member) return null;
        return {
          memberId: member.id,
          memberName: member.name,
          currentLevel: assessment.current_level,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    // Count members meeting minimum and ideal levels
    const membersMeetingMinimum = membersWithSkill.filter(
      (m) => m.currentLevel >= req.minimumLevel
    ).length;
    
    const membersMeetingIdeal = membersWithSkill.filter(
      (m) => m.currentLevel >= req.idealLevel
    ).length;

    // Calculate average level
    const totalLevel = membersWithSkill.reduce((sum, m) => sum + m.currentLevel, 0);
    const averageLevel = membersWithSkill.length > 0 ? totalLevel / membersWithSkill.length : 0;

    // Calculate gap (need at least 1 person at minimum level for critical skills, 2 for redundancy)
    const targetCount = req.criticalToDelivery ? 2 : 1;
    const gap = Math.max(0, targetCount - membersMeetingMinimum);

    return {
      skillName: req.skillName,
      required: req.minimumLevel,
      ideal: req.idealLevel,
      isCritical: req.criticalToDelivery,
      membersWithSkill,
      membersMeetingMinimum,
      membersMeetingIdeal,
      averageLevel,
      gap,
    };
  });

  // Calculate overall metrics
  const totalSkills = service.requiredSkills.length;
  const criticalSkills = service.requiredSkills.filter((s) => s.criticalToDelivery);
  const totalCriticalSkills = criticalSkills.length;

  const skillsReady = skillReadiness.filter((s) => s.membersMeetingMinimum > 0).length;
  const criticalSkillsMet = skillReadiness.filter(
    (s) => s.isCritical && s.membersMeetingMinimum > 0
  ).length;

  // Calculate readiness percentage
  // Weight critical skills more heavily (70% weight) vs nice-to-have (30% weight)
  const criticalWeight = 0.7;
  const niceToHaveWeight = 0.3;
  
  const criticalReadiness = totalCriticalSkills > 0 
    ? (criticalSkillsMet / totalCriticalSkills) * criticalWeight 
    : 0;
  
  const niceToHaveSkills = totalSkills - totalCriticalSkills;
  const niceToHaveReady = skillsReady - criticalSkillsMet;
  const niceToHaveReadiness = niceToHaveSkills > 0 
    ? (niceToHaveReady / niceToHaveSkills) * niceToHaveWeight 
    : 0;

  const readinessPercent = ((criticalReadiness + niceToHaveReadiness) / (criticalWeight + niceToHaveWeight)) * 100;

  // Can deliver if ALL critical skills are met
  const canDeliverNow = criticalSkillsMet === totalCriticalSkills;

  // Identify gaps (skills we don't have enough people for)
  const gaps = skillReadiness.filter((s) => s.gap > 0);

  // Find capable team members (those who can contribute to this service)
  const memberCapability = new Map<string, number>();
  skillReadiness.forEach((sr) => {
    sr.membersWithSkill
      .filter((m) => m.currentLevel >= sr.required)
      .forEach((m) => {
        const current = memberCapability.get(m.memberId) || 0;
        memberCapability.set(m.memberId, current + 1);
      });
  });

  const teamMembersCapable = Array.from(memberCapability.entries())
    .map(([memberId, skillsCovered]) => {
      const member = members.find((m) => m.id === memberId);
      
      // Get service line interest data
      const interestKey = `${memberId}-${service.name}`;
      const interest = serviceInterests?.get(interestKey);
      
      return {
        memberId,
        memberName: member?.name || 'Unknown',
        skillsCovered,
        // Add interest indicators
        interestRank: interest?.rank,
        experienceLevel: interest?.experience || 0,
        desiredInvolvement: interest?.involvement || 0,
        hasHighInterest: interest ? (interest.rank <= 3 && interest.involvement > 50) : false,
      };
    })
    // Sort by: high interest first, then skills covered, then experience
    .sort((a, b) => {
      if (a.hasHighInterest && !b.hasHighInterest) return -1;
      if (!a.hasHighInterest && b.hasHighInterest) return 1;
      if (a.skillsCovered !== b.skillsCovered) return b.skillsCovered - a.skillsCovered;
      return (b.experienceLevel || 0) - (a.experienceLevel || 0);
    });

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (canDeliverNow) {
    recommendations.push('✅ Ready to deliver this service');
    if (gaps.length > 0) {
      recommendations.push(`Consider training ${gaps.length} additional skill(s) for redundancy`);
    }
  } else {
    const criticalGaps = gaps.filter((g) => g.isCritical);
    recommendations.push(`❌ Not ready - missing ${criticalGaps.length} critical skill(s)`);
    criticalGaps.slice(0, 3).forEach((gap) => {
      recommendations.push(`• Need ${gap.gap} more person(s) with ${gap.skillName} (Level ${gap.required}+)`);
    });
  }

  return {
    service,
    readinessPercent,
    canDeliverNow,
    skillsReady,
    totalSkills,
    criticalSkillsMet,
    totalCriticalSkills,
    skillReadiness,
    teamMembersCapable,
    gaps,
    recommendations,
  };
}

