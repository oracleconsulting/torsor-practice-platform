import { supabase } from '@/lib/supabase/client';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface TeamBelbinBalance {
  coordinator: number;
  shaper: number;
  plant: number;
  resourceInvestigator: number;
  implementer: number;
  completerFinisher: number;
  teamworker: number;
  monitorEvaluator: number;
  specialist: number;
  balanceScore: number; // 0-100
  gaps: string[];
  overlaps: string[];
}

export interface TeamMotivationalDistribution {
  achievement: { avg: number; range: [number, number] };
  affiliation: { avg: number; range: [number, number] };
  autonomy: { avg: number; range: [number, number] };
  influence: { avg: number; range: [number, number] };
  alignmentScore: number; // 0-100
  conflicts: string[];
}

export interface TeamEQMapping {
  avgSelfAwareness: number;
  avgSelfManagement: number;
  avgSocialAwareness: number;
  avgRelationshipManagement: number;
  eqCollectiveCapability: number; // 0-100
  lowEQMembers: string[];
  eqSuperstars: string[];
}

export interface TeamConflictStyleDiversity {
  competing: number;
  collaborating: number;
  compromising: number;
  avoiding: number;
  accommodating: number;
  diversityScore: number; // 0-100
  dominantStyle: string;
  needsImprovement: string[];
}

export interface TeamCompositionInsight {
  practiceId: string;
  serviceLine?: string;
  teamName: string;
  memberCount: number;
  belbinBalance: TeamBelbinBalance;
  motivationalDistribution: TeamMotivationalDistribution;
  eqMapping: TeamEQMapping;
  conflictStyleDiversity: TeamConflictStyleDiversity;
  teamHealthScore: number; // Overall 0-100
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  riskFactors: string[];
  lastCalculated: string;
}

// =====================================================
// TEAM COMPOSITION ANALYZER
// =====================================================

export class TeamCompositionAnalyzer {
  /**
   * Analyze Belbin team balance
   */
  analyzeBelbinBalance(members: any[]): TeamBelbinBalance {
    const belbinCounts: Record<string, number> = {
      Coordinator: 0,
      Shaper: 0,
      Plant: 0,
      'Resource Investigator': 0,
      Implementer: 0,
      'Completer Finisher': 0,
      Teamworker: 0,
      'Monitor Evaluator': 0,
      Specialist: 0
    };

    // Count primary and secondary roles
    members.forEach(member => {
      (member.belbin_primary || []).forEach((role: string) => {
        if (belbinCounts[role] !== undefined) belbinCounts[role]++;
      });
      (member.belbin_secondary || []).forEach((role: string) => {
        if (belbinCounts[role] !== undefined) belbinCounts[role] += 0.5;
      });
    });

    // Calculate balance score
    const totalMembers = members.length;
    const idealDistribution = totalMembers / 9; // Ideal: equal distribution
    const gaps: string[] = [];
    const overlaps: string[] = [];

    Object.entries(belbinCounts).forEach(([role, count]) => {
      if (count === 0) gaps.push(role);
      if (count > idealDistribution * 2) overlaps.push(role);
    });

    // Balance score: penalize for gaps and overlaps
    const gapPenalty = gaps.length * 10;
    const overlapPenalty = overlaps.length * 5;
    const balanceScore = Math.max(0, 100 - gapPenalty - overlapPenalty);

    return {
      coordinator: belbinCounts.Coordinator,
      shaper: belbinCounts.Shaper,
      plant: belbinCounts.Plant,
      resourceInvestigator: belbinCounts['Resource Investigator'],
      implementer: belbinCounts.Implementer,
      completerFinisher: belbinCounts['Completer Finisher'],
      teamworker: belbinCounts.Teamworker,
      monitorEvaluator: belbinCounts['Monitor Evaluator'],
      specialist: belbinCounts.Specialist,
      balanceScore,
      gaps,
      overlaps
    };
  }

  /**
   * Analyze motivational driver distribution
   */
  analyzeMotivationalDistribution(members: any[]): TeamMotivationalDistribution {
    const drivers = {
      achievement: [] as number[],
      affiliation: [] as number[],
      autonomy: [] as number[],
      influence: [] as number[]
    };

    members.forEach(member => {
      const md = member.motivational_drivers || {};
      drivers.achievement.push(md.achievement || 50);
      drivers.affiliation.push(md.affiliation || 50);
      drivers.autonomy.push(md.autonomy || 50);
      drivers.influence.push(md.influence || 50);
    });

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const range = (arr: number[]): [number, number] => [Math.min(...arr), Math.max(...arr)];

    const achievementAvg = avg(drivers.achievement);
    const affiliationAvg = avg(drivers.affiliation);
    const autonomyAvg = avg(drivers.autonomy);
    const influenceAvg = avg(drivers.influence);

    // Detect conflicts
    const conflicts: string[] = [];
    if (autonomyAvg > 70 && affiliationAvg > 70) {
      conflicts.push('High autonomy + high affiliation may cause tension');
    }
    if (influenceAvg > 75 && Math.max(...drivers.influence) - Math.min(...drivers.influence) < 20) {
      conflicts.push('Too many competing for influence - risk of power struggles');
    }
    if (affiliationAvg < 40) {
      conflicts.push('Low affiliation - team cohesion may suffer');
    }

    // Alignment score: prefer moderate spread, no extreme conflicts
    const spread = [
      range(drivers.achievement)[1] - range(drivers.achievement)[0],
      range(drivers.affiliation)[1] - range(drivers.affiliation)[0],
      range(drivers.autonomy)[1] - range(drivers.autonomy)[0],
      range(drivers.influence)[1] - range(drivers.influence)[0]
    ];
    const avgSpread = avg(spread);
    const alignmentScore = Math.max(0, 100 - (avgSpread / 2) - (conflicts.length * 10));

    return {
      achievement: { avg: Math.round(achievementAvg), range: range(drivers.achievement) },
      affiliation: { avg: Math.round(affiliationAvg), range: range(drivers.affiliation) },
      autonomy: { avg: Math.round(autonomyAvg), range: range(drivers.autonomy) },
      influence: { avg: Math.round(influenceAvg), range: range(drivers.influence) },
      alignmentScore: Math.round(alignmentScore),
      conflicts
    };
  }

  /**
   * Analyze team EQ mapping
   */
  analyzeTeamEQ(members: any[]): TeamEQMapping {
    const eqScores = {
      selfAwareness: [] as number[],
      selfManagement: [] as number[],
      socialAwareness: [] as number[],
      relationshipManagement: [] as number[]
    };

    members.forEach(member => {
      const eq = member.eq_scores || {};
      eqScores.selfAwareness.push(eq.self_awareness || 50);
      eqScores.selfManagement.push(eq.self_management || 50);
      eqScores.socialAwareness.push(eq.social_awareness || 50);
      eqScores.relationshipManagement.push(eq.relationship_management || 50);
    });

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    const avgSelfAwareness = Math.round(avg(eqScores.selfAwareness));
    const avgSelfManagement = Math.round(avg(eqScores.selfManagement));
    const avgSocialAwareness = Math.round(avg(eqScores.socialAwareness));
    const avgRelationshipManagement = Math.round(avg(eqScores.relationshipManagement));

    // Collective capability: weighted average
    const eqCollectiveCapability = Math.round(
      (avgSelfAwareness * 0.2) +
      (avgSelfManagement * 0.2) +
      (avgSocialAwareness * 0.3) +
      (avgRelationshipManagement * 0.3)
    );

    // Identify low EQ members (social awareness < 55 or relationship < 55)
    const lowEQMembers = members
      .filter(m => {
        const eq = m.eq_scores || {};
        return (eq.social_awareness || 50) < 55 || (eq.relationship_management || 50) < 55;
      })
      .map(m => m.name);

    // Identify EQ superstars (all scores > 75)
    const eqSuperstars = members
      .filter(m => {
        const eq = m.eq_scores || {};
        return (eq.self_awareness || 0) > 75 &&
               (eq.self_management || 0) > 75 &&
               (eq.social_awareness || 0) > 75 &&
               (eq.relationship_management || 0) > 75;
      })
      .map(m => m.name);

    return {
      avgSelfAwareness,
      avgSelfManagement,
      avgSocialAwareness,
      avgRelationshipManagement,
      eqCollectiveCapability,
      lowEQMembers,
      eqSuperstars
    };
  }

  /**
   * Analyze conflict style diversity
   */
  analyzeConflictStyleDiversity(members: any[]): TeamConflictStyleDiversity {
    const styleCounts: Record<string, number> = {
      Competing: 0,
      Collaborating: 0,
      Compromising: 0,
      Avoiding: 0,
      Accommodating: 0
    };

    members.forEach(member => {
      const style = member.conflict_style_primary;
      if (style && styleCounts[style] !== undefined) {
        styleCounts[style]++;
      }
    });

    const totalMembers = members.length || 1;

    // Calculate diversity score (Shannon entropy)
    const proportions = Object.values(styleCounts).map(count => count / totalMembers);
    const entropy = -proportions.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
    const maxEntropy = Math.log2(5); // Maximum entropy for 5 categories
    const diversityScore = Math.round((entropy / maxEntropy) * 100);

    // Dominant style
    const maxCount = Math.max(...Object.values(styleCounts));
    const dominantStyle = Object.entries(styleCounts).find(([_, count]) => count === maxCount)?.[0] || 'None';

    // Needs improvement
    const needsImprovement: string[] = [];
    if (styleCounts.Avoiding > totalMembers * 0.4) {
      needsImprovement.push('Too many Avoiding - team may not address conflicts');
    }
    if (styleCounts.Competing > totalMembers * 0.4) {
      needsImprovement.push('Too many Competing - risk of destructive conflicts');
    }
    if (styleCounts.Collaborating === 0) {
      needsImprovement.push('No Collaborating style - missed opportunities for win-win solutions');
    }

    return {
      competing: styleCounts.Competing,
      collaborating: styleCounts.Collaborating,
      compromising: styleCounts.Compromising,
      avoiding: styleCounts.Avoiding,
      accommodating: styleCounts.Accommodating,
      diversityScore,
      dominantStyle,
      needsImprovement
    };
  }

  /**
   * Calculate overall team health score
   */
  calculateTeamHealthScore(
    belbinBalance: TeamBelbinBalance,
    motivationalDistribution: TeamMotivationalDistribution,
    eqMapping: TeamEQMapping,
    conflictDiversity: TeamConflictStyleDiversity
  ): number {
    const weights = {
      belbin: 0.30,
      motivation: 0.20,
      eq: 0.30,
      conflict: 0.20
    };

    const score =
      (belbinBalance.balanceScore * weights.belbin) +
      (motivationalDistribution.alignmentScore * weights.motivation) +
      (eqMapping.eqCollectiveCapability * weights.eq) +
      (conflictDiversity.diversityScore * weights.conflict);

    return Math.round(score);
  }

  /**
   * Generate team recommendations
   */
  generateRecommendations(insight: Partial<TeamCompositionInsight>): string[] {
    const recommendations: string[] = [];

    // Belbin gaps
    if (insight.belbinBalance?.gaps && insight.belbinBalance.gaps.length > 0) {
      recommendations.push(`Address Belbin gaps: Consider hiring or developing ${insight.belbinBalance.gaps.join(', ')} roles`);
    }

    // Low EQ
    if (insight.eqMapping && insight.eqMapping.lowEQMembers.length > 0) {
      recommendations.push(`EQ development needed for ${insight.eqMapping.lowEQMembers.length} team member(s)`);
    }

    // Motivational conflicts
    if (insight.motivationalDistribution && insight.motivationalDistribution.conflicts.length > 0) {
      recommendations.push(`Address motivational conflicts through team building and role clarity`);
    }

    // Conflict style improvements
    if (insight.conflictStyleDiversity && insight.conflictStyleDiversity.needsImprovement.length > 0) {
      recommendations.push(`Develop conflict resolution capabilities: ${insight.conflictStyleDiversity.needsImprovement[0]}`);
    }

    // Health score specific
    if (insight.teamHealthScore && insight.teamHealthScore < 60) {
      recommendations.push(`URGENT: Team health score below 60 - comprehensive team intervention recommended`);
    }

    return recommendations;
  }

  /**
   * Identify team strengths
   */
  identifyStrengths(insight: Partial<TeamCompositionInsight>): string[] {
    const strengths: string[] = [];

    if (insight.belbinBalance && insight.belbinBalance.balanceScore >= 80) {
      strengths.push('Excellent Belbin role balance across the team');
    }

    if (insight.eqMapping && insight.eqMapping.eqCollectiveCapability >= 75) {
      strengths.push('High collective emotional intelligence');
    }

    if (insight.eqMapping && insight.eqMapping.eqSuperstars.length > 0) {
      strengths.push(`EQ superstars: ${insight.eqMapping.eqSuperstars.join(', ')}`);
    }

    if (insight.conflictStyleDiversity && insight.conflictStyleDiversity.diversityScore >= 70) {
      strengths.push('Good diversity in conflict resolution approaches');
    }

    if (insight.motivationalDistribution && insight.motivationalDistribution.alignmentScore >= 70) {
      strengths.push('Well-aligned motivational drivers across team');
    }

    return strengths;
  }

  /**
   * Identify team weaknesses
   */
  identifyWeaknesses(insight: Partial<TeamCompositionInsight>): string[] {
    const weaknesses: string[] = [];

    if (insight.belbinBalance && insight.belbinBalance.gaps.length > 3) {
      weaknesses.push(`Critical Belbin gaps: Missing ${insight.belbinBalance.gaps.length} roles`);
    }

    if (insight.eqMapping && insight.eqMapping.avgSocialAwareness < 60) {
      weaknesses.push('Low team social awareness - client relationships may suffer');
    }

    if (insight.motivationalDistribution && insight.motivationalDistribution.conflicts.length > 2) {
      weaknesses.push('Multiple motivational conflicts detected');
    }

    if (insight.conflictStyleDiversity && insight.conflictStyleDiversity.diversityScore < 50) {
      weaknesses.push('Low conflict style diversity - team may struggle with complex conflicts');
    }

    return weaknesses;
  }
}

// Export singleton instance
export const teamCompositionAnalyzer = new TeamCompositionAnalyzer();

