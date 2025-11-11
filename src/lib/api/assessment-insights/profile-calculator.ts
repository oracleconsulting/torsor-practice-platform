/**
 * INDIVIDUAL PROFILE CALCULATOR
 * Analyzes assessment data to generate strengths, development areas, and recommendations
 */

import type {
  IndividualAssessmentProfile,
  Strength,
  DevelopmentArea,
  TrainingPriority,
  OptimalWorkConditions,
  RoleGap
} from './types';

// =====================================================
// STRENGTHS IDENTIFICATION
// =====================================================

export function identifyStrengths(memberData: any): Strength[] {
  const strengths: Strength[] = [];

  // EQ Strengths
  if (memberData.eq_scores) {
    if (memberData.eq_scores.self_awareness >= 75) {
      strengths.push({
        area: 'Self-Awareness',
        score: memberData.eq_scores.self_awareness,
        evidence: 'High emotional intelligence - understands personal strengths, limitations, and emotional triggers',
        category: 'interpersonal'
      });
    }

    if (memberData.eq_scores.relationship_management >= 75) {
      strengths.push({
        area: 'Relationship Building',
        score: memberData.eq_scores.relationship_management,
        evidence: 'Excels at building rapport, managing conflicts, and maintaining client relationships',
        category: 'interpersonal'
      });
    }

    if (memberData.eq_scores.social_awareness >= 75) {
      strengths.push({
        area: 'Social Awareness',
        score: memberData.eq_scores.social_awareness,
        evidence: 'Strong ability to read room dynamics, understand client needs, and navigate political situations',
        category: 'interpersonal'
      });
    }

    if (memberData.eq_scores.self_management >= 75) {
      strengths.push({
        area: 'Self-Management',
        score: memberData.eq_scores.self_management,
        evidence: 'Excellent at managing stress, staying composed under pressure, and maintaining focus',
        category: 'interpersonal'
      });
    }
  }

  // Belbin Strengths
  const belbinStrengths = [...(memberData.belbin_primary || []), ...(memberData.belbin_secondary || [])];
  
  if (belbinStrengths.includes('Coordinator') || belbinStrengths.includes('Resource Investigator')) {
    strengths.push({
      area: 'Client Relationship Management',
      score: 85,
      evidence: `${belbinStrengths.join('/')} Belbin role(s) - naturally builds connections and coordinates with stakeholders`,
      category: 'interpersonal'
    });
  }

  if (belbinStrengths.includes('Specialist') || belbinStrengths.includes('Monitor Evaluator')) {
    strengths.push({
      area: 'Technical Excellence',
      score: 85,
      evidence: `${belbinStrengths.join('/')} Belbin role(s) - deep subject matter expertise and analytical thinking`,
      category: 'technical'
    });
  }

  if (belbinStrengths.includes('Shaper') || belbinStrengths.includes('Implementer')) {
    strengths.push({
      area: 'Delivery & Execution',
      score: 85,
      evidence: `${belbinStrengths.join('/')} Belbin role(s) - drives projects forward and ensures completion`,
      category: 'leadership'
    });
  }

  if (belbinStrengths.includes('Plant') || belbinStrengths.includes('Resource Investigator')) {
    strengths.push({
      area: 'Innovation & Problem Solving',
      score: 85,
      evidence: `${belbinStrengths.join('/')} Belbin role(s) - creative thinker who finds novel solutions`,
      category: 'creative'
    });
  }

  // Motivational Strengths
  if (memberData.motivational_drivers) {
    const topDriver = Object.entries(memberData.motivational_drivers)
      .sort(([,a]: any, [,b]: any) => b - a)[0];
    
    if (topDriver) {
      const [driver, score] = topDriver as [string, number];
      
      if (score >= 75) {
        const driverMap: Record<string, { area: string; evidence: string; category: any }> = {
          achievement: {
            area: 'Results Orientation',
            evidence: 'High achievement drive - sets challenging goals and delivers exceptional outcomes',
            category: 'leadership'
          },
          affiliation: {
            area: 'Team Collaboration',
            evidence: 'Strong affiliation drive - builds team cohesion and fosters collaborative environments',
            category: 'interpersonal'
          },
          autonomy: {
            area: 'Independent Work',
            evidence: 'High autonomy drive - thrives when given freedom and ownership over work',
            category: 'technical'
          },
          influence: {
            area: 'Leadership & Persuasion',
            evidence: 'Strong influence drive - naturally leads, persuades, and inspires others',
            category: 'leadership'
          }
        };

        if (driverMap[driver]) {
          strengths.push({
            ...driverMap[driver],
            score
          });
        }
      }
    }
  }

  // Skills Strengths
  if (memberData.skills && Array.isArray(memberData.skills)) {
    const topSkills = memberData.skills
      .filter((s: any) => s.current_level >= 4)
      .slice(0, 3);

    topSkills.forEach((skill: any) => {
      strengths.push({
        area: skill.name,
        score: skill.current_level * 20, // Convert 1-5 to 0-100
        evidence: `Level ${skill.current_level}/5 proficiency - demonstrated expertise in this area`,
        category: 'technical'
      });
    });
  }

  // Communication Strengths
  if (memberData.communication_preference === 'sync' && memberData.eq_scores?.relationship_management >= 70) {
    strengths.push({
      area: 'Verbal Communication',
      score: 80,
      evidence: 'Preference for synchronous communication combined with strong relationship skills',
      category: 'interpersonal'
    });
  }

  // Sort by score and return top 8
  return strengths
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

// =====================================================
// DEVELOPMENT AREAS IDENTIFICATION
// =====================================================

export function identifyDevelopmentAreas(memberData: any, roleRequirements?: any): DevelopmentArea[] {
  const areas: DevelopmentArea[] = [];

  // EQ Development Areas
  if (memberData.eq_scores) {
    Object.entries(memberData.eq_scores).forEach(([dimension, score]) => {
      if ((score as number) < 65) {
        const dimensionMap: Record<string, { area: string; actions: string[] }> = {
          self_awareness: {
            area: 'Self-Awareness Development',
            actions: [
              'Complete 360-degree feedback assessment',
              'Work with coach or mentor on self-reflection',
              'Journal daily about emotional responses and triggers'
            ]
          },
          self_management: {
            area: 'Self-Management Skills',
            actions: [
              'Attend stress management training',
              'Practice mindfulness or meditation techniques',
              'Develop coping strategies for high-pressure situations'
            ]
          },
          social_awareness: {
            area: 'Social Awareness & Empathy',
            actions: [
              'Shadow experienced client-facing colleagues',
              'Practice active listening techniques',
              'Seek feedback on reading social situations'
            ]
          },
          relationship_management: {
            area: 'Relationship Building',
            actions: [
              'Attend networking and relationship building workshops',
              'Practice conflict resolution techniques',
              'Increase client-facing opportunities with supervision'
            ]
          }
        };

        if (dimensionMap[dimension]) {
          areas.push({
            area: dimensionMap[dimension].area,
            current_score: score as number,
            target_score: 70,
            priority: (score as number) < 55 ? 'critical' : 'high',
            timeline: (score as number) < 55 ? '3 months' : '6 months',
            recommended_actions: dimensionMap[dimension].actions
          });
        }
      }
    });
  }

  // Belbin Gaps (if role requires specific roles they don't have)
  if (roleRequirements?.required_belbin_roles) {
    const memberBelbin = [...(memberData.belbin_primary || []), ...(memberData.belbin_secondary || [])];
    const required = Object.entries(roleRequirements.required_belbin_roles)
      .filter(([, importance]) => importance === 'required')
      .map(([role]) => role);

    const missingRequired = required.filter(r => !memberBelbin.includes(r));

    if (missingRequired.length > 0) {
      areas.push({
        area: `Team Role Development: ${missingRequired.join(', ')}`,
        current_score: 30,
        target_score: 70,
        priority: 'high',
        timeline: '6-12 months',
        recommended_actions: [
          'Work on projects that require this team role',
          'Shadow team members who excel in this role',
          'Attend targeted development workshops'
        ]
      });
    }
  }

  // Low Skills Development
  if (memberData.skills && Array.isArray(memberData.skills)) {
    const lowSkills = memberData.skills.filter((s: any) => s.current_level < 3 && s.current_level > 0);

    lowSkills.forEach((skill: any) => {
      areas.push({
        area: `${skill.name} Proficiency`,
        current_score: skill.current_level * 20,
        target_score: 60,
        priority: 'medium',
        timeline: '3-6 months',
        recommended_actions: [
          `Complete ${skill.name} training course`,
          'Practice on real projects with supervision',
          'Seek mentorship from skilled team members'
        ]
      });
    });
  }

  // Communication Style Mismatch
  if (roleRequirements?.client_facing && memberData.communication_preference === 'async') {
    areas.push({
      area: 'Synchronous Communication Skills',
      current_score: 45,
      target_score: 70,
      priority: 'high',
      timeline: '3 months',
      recommended_actions: [
        'Practice presenting in team meetings',
        'Shadow client-facing colleagues',
        'Attend communication skills workshop'
      ]
    });
  }

  // Sort by priority and score
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return areas.sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.current_score - b.current_score;
  }).slice(0, 6);
}

// =====================================================
// TRAINING PRIORITIES GENERATION
// =====================================================

export function generateTrainingPriorities(
  memberData: any,
  developmentAreas: DevelopmentArea[],
  roleRequirements?: any
): TrainingPriority[] {
  const priorities: TrainingPriority[] = [];

  // Critical gaps become immediate training priorities
  developmentAreas.filter(area => area.priority === 'critical').forEach(area => {
    priorities.push({
      skill: area.area,
      urgency: 'critical',
      estimated_time: area.timeline,
      recommended_method: 'Intensive 1-on-1 coaching + structured program',
      expected_outcome: `Reach ${area.target_score}/100 proficiency level`
    });
  });

  // High priority areas
  developmentAreas.filter(area => area.priority === 'high').forEach(area => {
    priorities.push({
      skill: area.area,
      urgency: 'high',
      estimated_time: area.timeline,
      recommended_method: 'Formal training course + practical application',
      expected_outcome: `Reach ${area.target_score}/100 proficiency level`
    });
  });

  // Role-specific skill gaps
  if (roleRequirements?.required_skills) {
    const memberSkillMap = new Map(
      (memberData.skills || []).map((s: any) => [s.name, s.current_level])
    );

    roleRequirements.required_skills
      .filter((req: any) => {
        const current = memberSkillMap.get(req.skill_name) || 0;
        return current < req.min_level;
      })
      .forEach((req: any) => {
        const current = memberSkillMap.get(req.skill_name) || 0;
        
        priorities.push({
          skill: req.skill_name,
          urgency: req.importance === 'critical' ? 'critical' : 'high',
          estimated_time: req.min_level - current > 1 ? '6 months' : '3 months',
          recommended_method: req.importance === 'critical' 
            ? 'Intensive training + mentorship + project work'
            : 'Online course + practical exercises',
          expected_outcome: `Reach Level ${req.min_level}/5 for role requirement`
        });
      });
  }

  // Remove duplicates and limit to top 5
  const unique = priorities.filter((priority, index, self) =>
    index === self.findIndex(p => p.skill === priority.skill)
  );

  return unique.slice(0, 5);
}

// =====================================================
// OPTIMAL WORK CONDITIONS
// =====================================================

export function determineOptimalWorkConditions(memberData: any): OptimalWorkConditions {
  const conditions: OptimalWorkConditions = {
    communication: 'hybrid',
    environment: 'hybrid',
    autonomy: 'medium',
    supervision: 'moderate',
    task_variety: 'medium'
  };

  // Communication preference
  if (memberData.communication_preference) {
    conditions.communication = memberData.communication_preference;
  }

  // Autonomy based on motivation
  if (memberData.motivational_drivers) {
    const autonomyScore = memberData.motivational_drivers.autonomy || 50;
    conditions.autonomy = autonomyScore >= 70 ? 'high' : autonomyScore >= 50 ? 'medium' : 'low';
    conditions.supervision = autonomyScore >= 70 ? 'minimal' : autonomyScore >= 50 ? 'moderate' : 'close';
  }

  // Task variety based on Belbin
  const belbinRoles = [...(memberData.belbin_primary || []), ...(memberData.belbin_secondary || [])];
  if (belbinRoles.includes('Plant') || belbinRoles.includes('Resource Investigator')) {
    conditions.task_variety = 'high';
  } else if (belbinRoles.includes('Specialist') || belbinRoles.includes('Implementer')) {
    conditions.task_variety = 'low'; // Prefer focus and depth
  }

  return conditions;
}

// =====================================================
// PERSONALITY SUMMARY GENERATION
// =====================================================

export function generatePersonalitySummary(memberData: any): string {
  const parts: string[] = [];

  // Belbin contribution
  const primaryBelbin = memberData.belbin_primary?.[0];
  if (primaryBelbin) {
    const belbinDescriptions: Record<string, string> = {
      'Plant': 'a creative problem-solver who thrives on innovation',
      'Resource Investigator': 'an outgoing networker who explores opportunities',
      'Coordinator': 'a natural leader who excels at delegation and team coordination',
      'Shaper': 'a dynamic driver who challenges and pushes for results',
      'Monitor Evaluator': 'an analytical thinker who provides objective judgment',
      'Teamworker': 'a collaborative diplomat who supports team cohesion',
      'Implementer': 'a practical organizer who turns ideas into action',
      'Completer-Finisher': 'a detail-oriented perfectionist who ensures quality',
      'Specialist': 'a technical expert with deep knowledge in specific areas'
    };

    parts.push(`${memberData.name} is ${belbinDescriptions[primaryBelbin] || 'a valued team contributor'}`);
  }

  // EQ profile
  if (memberData.eq_scores) {
    const avgEQ = Object.values(memberData.eq_scores).reduce((sum: any, score: any) => sum + score, 0) / 4;
    
    if (avgEQ >= 75) {
      parts.push('with exceptional emotional intelligence');
    } else if (avgEQ >= 65) {
      parts.push('with strong emotional intelligence');
    } else {
      parts.push('who is developing emotional intelligence skills');
    }
  }

  // Motivational drivers
  if (memberData.motivational_drivers) {
    const topDriver = Object.entries(memberData.motivational_drivers)
      .sort(([,a]: any, [,b]: any) => b - a)[0];
    
    if (topDriver) {
      const [driver] = topDriver as [string, number];
      const driverText: Record<string, string> = {
        achievement: 'driven by goals and measurable outcomes',
        affiliation: 'motivated by team relationships and collaboration',
        autonomy: 'energized by independence and self-direction',
        influence: 'inspired by leadership opportunities and making an impact'
      };
      
      parts.push(`. They are ${driverText[driver] || 'motivated to excel'}`);
    }
  }

  // Communication style
  if (memberData.communication_preference === 'sync') {
    parts.push(', preferring face-to-face interaction and real-time collaboration');
  } else if (memberData.communication_preference === 'async') {
    parts.push(', thriving with written communication and time for thoughtful responses');
  }

  // Conflict style
  if (memberData.conflict_style_primary) {
    const styleText: Record<string, string> = {
      'Collaborating': 'approaches conflicts constructively, seeking win-win solutions',
      'Competing': 'tackles conflicts assertively, standing firm on important issues',
      'Avoiding': 'prefers to sidestep conflicts when possible',
      'Accommodating': 'prioritizes relationships over conflict',
      'Compromising': 'finds middle ground in disagreements'
    };

    if (styleText[memberData.conflict_style_primary]) {
      parts.push(`. They ${styleText[memberData.conflict_style_primary]}`);
    }
  }

  parts.push('.');

  return parts.join(' ');
}

// =====================================================
// TEAM CONTRIBUTION STYLE
// =====================================================

export function generateTeamContributionStyle(memberData: any): string {
  const belbinRoles = [...(memberData.belbin_primary || []), ...(memberData.belbin_secondary || [])];
  const motivationalDrivers = memberData.motivational_drivers || {};
  
  const contributions: string[] = [];

  // Primary contribution based on Belbin
  if (belbinRoles.includes('Coordinator')) {
    contributions.push('orchestrates team efforts and ensures everyone contributes effectively');
  } else if (belbinRoles.includes('Resource Investigator')) {
    contributions.push('brings external ideas and connections to the team');
  } else if (belbinRoles.includes('Plant')) {
    contributions.push('generates innovative solutions to complex problems');
  } else if (belbinRoles.includes('Specialist')) {
    contributions.push('provides deep technical expertise and knowledge');
  } else if (belbinRoles.includes('Shaper')) {
    contributions.push('drives the team forward and challenges complacency');
  } else if (belbinRoles.includes('Implementer')) {
    contributions.push('turns plans into practical action and deliverables');
  } else if (belbinRoles.includes('Completer-Finisher')) {
    contributions.push('ensures work meets high quality standards');
  } else if (belbinRoles.includes('Teamworker')) {
    contributions.push('maintains team harmony and supports colleagues');
  } else if (belbinRoles.includes('Monitor Evaluator')) {
    contributions.push('provides objective analysis and careful judgment');
  }

  // Secondary contribution based on motivation
  if (motivationalDrivers.affiliation >= 70) {
    contributions.push('fosters strong team relationships and collaboration');
  } else if (motivationalDrivers.influence >= 70) {
    contributions.push('inspires and motivates teammates');
  } else if (motivationalDrivers.achievement >= 70) {
    contributions.push('sets high standards and drives results');
  }

  return contributions.join('. ') || 'Contributes valuable skills and perspective to team efforts.';
}

// =====================================================
// CAREER TRAJECTORY DETERMINATION
// =====================================================

export function determineCareerTrajectory(
  advisoryScore: number,
  technicalScore: number,
  leadershipScore: number
): 'technical_specialist' | 'people_manager' | 'hybrid_leader' | 'partner_track' {
  
  // Partner track: High across all dimensions
  if (advisoryScore >= 75 && technicalScore >= 70 && leadershipScore >= 75) {
    return 'partner_track';
  }

  // Hybrid leader: Strong in both advisory and technical
  if (advisoryScore >= 70 && technicalScore >= 70 && leadershipScore >= 65) {
    return 'hybrid_leader';
  }

  // People manager: Strong leadership and advisory, less technical
  if (leadershipScore >= 70 && advisoryScore >= 70 && technicalScore < 70) {
    return 'people_manager';
  }

  // Technical specialist: Strong technical, lower advisory
  if (technicalScore >= 70 && (advisoryScore < 70 || leadershipScore < 65)) {
    return 'technical_specialist';
  }

  // Default based on highest score
  const scores = { advisory: advisoryScore, technical: technicalScore, leadership: leadershipScore };
  const highest = Object.entries(scores).sort(([,a], [,b]) => b - a)[0][0];

  if (highest === 'technical') return 'technical_specialist';
  if (highest === 'leadership') return 'people_manager';
  return 'hybrid_leader';
}

// =====================================================
// RECOMMENDED ROLES GENERATOR
// =====================================================

export function generateRecommendedRoles(
  advisoryScore: number,
  technicalScore: number,
  leadershipScore: number,
  currentSeniority: string
): string[] {
  const roles: string[] = [];

  // Advisory roles
  if (advisoryScore >= 75) {
    roles.push('Client Advisory Specialist');
    roles.push('Relationship Manager');
  }

  // Technical roles
  if (technicalScore >= 75) {
    roles.push('Technical Specialist');
    roles.push('Subject Matter Expert');
  }

  // Hybrid roles
  if (advisoryScore >= 70 && technicalScore >= 70) {
    roles.push('Senior Consultant');
    roles.push('Engagement Manager');
  }

  // Leadership roles
  if (leadershipScore >= 75) {
    if (currentSeniority === 'Senior' || currentSeniority === 'Manager') {
      roles.push('Team Leader');
      roles.push('Practice Manager');
    } else if (currentSeniority === 'Manager' || currentSeniority === 'Director') {
      roles.push('Director');
      roles.push('Head of Department');
    }
  }

  return roles.slice(0, 3);
}

