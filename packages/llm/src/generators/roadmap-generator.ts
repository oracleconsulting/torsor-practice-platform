// ============================================================================
// ROADMAP GENERATOR
// ============================================================================
// Generates personalized 13-week transformation roadmaps based on:
// - Part 1 (Life Design) responses
// - Part 2 (Business Deep Dive) responses  
// - Part 3 (Hidden Value Audit) responses
// - Value Analysis results
// - Business context and stage

import type { ValueAnalysisResult, ValueGap, Risk } from '../analyzers/value-analyzer';

export interface WeeklyTask {
  id: string;
  title: string;
  description: string;
  category: 'quick_win' | 'core_task' | 'reflection';
  estimatedTime: string;
  tools?: string[];
  completed: boolean;
  completedAt?: string;
}

export interface WeeklySprint {
  week: number;
  theme: string;
  focus: string;
  objectives: string[];
  tasks: WeeklyTask[];
  milestone?: string;
  reflection?: {
    wins: string;
    challenges: string;
    learnings: string;
  };
}

export interface TransformationStory {
  opening: string;
  currentReality: string;
  journeyAhead: string;
  whyThisOrder: string;
  commitmentRequired: string;
  supportAvailable: string;
}

export interface SuccessMetrics {
  week4: string;
  week8: string;
  week13: string;
}

export interface Roadmap {
  id: string;
  clientId: string;
  practiceId: string;
  title: string;
  subtitle: string;
  transformationStory: TransformationStory;
  weeks: WeeklySprint[];
  successMetrics: SuccessMetrics;
  customization: {
    timeCommitment: string;
    focusAreas: string[];
    preferences: string[];
  };
  metadata: {
    generatedAt: string;
    version: string;
    businessStage: string;
    totalTasks: number;
    estimatedHours: number;
  };
}

export interface RoadmapContext {
  // From Part 1
  userName: string;
  companyName: string;
  tuesdayTest: string;
  emergencyLog: string;
  sacrifices: string[];
  commitmentHours: string;
  desiredIncome: string;
  currentIncome: string;
  
  // From Part 2
  teamSize: string;
  annualTurnover: string;
  growthBottleneck: string;
  ninetyDayPriorities: string[];
  moneyWorry: string;
  biggestChallenge: string;
  
  // From Part 3 / Value Analysis
  businessStage: string;
  criticalRisks: Risk[];
  topOpportunities: ValueGap[];
  overallScore: number;
}

// Sprint phase definitions
const SPRINT_PHASES = {
  RELIEF: { weeks: [1, 2], name: 'Immediate Relief', focus: 'Quick wins and pain reduction' },
  FOUNDATION: { weeks: [3, 4], name: 'Foundation Building', focus: 'Core systems and processes' },
  MOMENTUM: { weeks: [5, 6], name: 'Momentum Multiplication', focus: 'Scaling what works' },
  LOCK_IN: { weeks: [7, 8], name: 'Lock-In & Stabilize', focus: 'Embedding new habits' },
  SCALE: { weeks: [9, 10], name: 'Scale Phase', focus: 'Growth acceleration' },
  TRANSFORM: { weeks: [11, 12, 13], name: 'Transform & Sustain', focus: 'Long-term transformation' }
};

export class RoadmapGenerator {
  /**
   * Generate a complete 13-week roadmap
   */
  generate(
    part1Responses: Record<string, any>,
    part2Responses: Record<string, any>,
    part3Responses: Record<string, any>,
    valueAnalysis: ValueAnalysisResult,
    clientId: string,
    practiceId: string
  ): Roadmap {
    // Build context from all inputs
    const context = this.buildContext(part1Responses, part2Responses, part3Responses, valueAnalysis);
    
    // Generate transformation story
    const transformationStory = this.generateTransformationStory(context);
    
    // Generate weekly sprints
    const weeks = this.generateWeeklySprints(context, valueAnalysis);
    
    // Generate success metrics
    const successMetrics = this.generateSuccessMetrics(context, valueAnalysis);
    
    // Calculate metadata
    const totalTasks = weeks.reduce((sum, w) => sum + w.tasks.length, 0);
    const estimatedHours = this.estimateHours(context.commitmentHours);
    
    return {
      id: `roadmap_${clientId}_${Date.now()}`,
      clientId,
      practiceId,
      title: `${context.companyName}'s 13-Week Transformation`,
      subtitle: this.generateSubtitle(context),
      transformationStory,
      weeks,
      successMetrics,
      customization: {
        timeCommitment: context.commitmentHours,
        focusAreas: context.ninetyDayPriorities.slice(0, 3),
        preferences: ['Weekly check-ins', 'Progress tracking', 'AI guidance']
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0',
        businessStage: context.businessStage,
        totalTasks,
        estimatedHours
      }
    };
  }

  /**
   * Build unified context from all assessment parts
   */
  private buildContext(
    part1: Record<string, any>,
    part2: Record<string, any>,
    part3: Record<string, any>,
    valueAnalysis: ValueAnalysisResult
  ): RoadmapContext {
    return {
      // Part 1
      userName: part1.full_name || 'Business Owner',
      companyName: part1.company_name || part2.trading_name || 'Your Business',
      tuesdayTest: part1.tuesday_test || '',
      emergencyLog: part1.emergency_log || '',
      sacrifices: part1.sacrifices || [],
      commitmentHours: part1.commitment_hours || '10-15 hours',
      desiredIncome: part1.desired_income || '',
      currentIncome: part1.current_income || '',
      
      // Part 2
      teamSize: part2.team_size || 'solo',
      annualTurnover: part2.annual_turnover || 'Unknown',
      growthBottleneck: part2.growth_bottleneck || '',
      ninetyDayPriorities: part2.ninety_day_priorities || [],
      moneyWorry: part2.money_worry || '',
      biggestChallenge: part2.growth_bottleneck || '',
      
      // From Value Analysis
      businessStage: this.determineBusinessStage(part1, part2),
      criticalRisks: valueAnalysis.riskRegister.filter(r => r.severity === 'Critical' || r.severity === 'High'),
      topOpportunities: valueAnalysis.valueGaps.slice(0, 3),
      overallScore: valueAnalysis.overallScore
    };
  }

  /**
   * Determine business stage from responses
   */
  private determineBusinessStage(part1: Record<string, any>, part2: Record<string, any>): string {
    const turnover = part2.annual_turnover || '';
    const teamSize = part2.team_size || 'solo';
    
    if (turnover.includes('Under £100k') || turnover === '') {
      return teamSize === 'solo' || teamSize === 'Just me' ? 'startup' : 'early_stage';
    } else if (turnover.includes('£100k-£250k')) {
      return 'early_stage';
    } else if (turnover.includes('£250k-£500k')) {
      return 'growth_stage';
    } else if (turnover.includes('£500k-£1m')) {
      return 'growth_stage';
    } else {
      return 'established';
    }
  }

  /**
   * Generate the transformation story
   */
  private generateTransformationStory(context: RoadmapContext): TransformationStory {
    const isPreRevenue = context.annualTurnover.includes('Under £100k') || context.annualTurnover === '';
    const isSolo = context.teamSize === 'solo' || context.teamSize === 'Just me';
    
    return {
      opening: `Welcome to your personalized 13-week transformation roadmap, ${context.userName}. This isn't a generic template – it's built specifically for ${context.companyName} based on your assessment responses.`,
      
      currentReality: this.buildCurrentRealityNarrative(context),
      
      journeyAhead: `Over the next 13 weeks, we'll systematically address your biggest challenges. We've prioritized ${context.ninetyDayPriorities[0] || 'growth'} first because it unlocks everything else.`,
      
      whyThisOrder: `Week 1-2 focuses on immediate relief and quick wins. Weeks 3-8 build the foundation. Weeks 9-13 scale what works. Each week builds on the previous one.`,
      
      commitmentRequired: `Based on your ${context.commitmentHours} per week commitment, we've right-sized every task. Most can be done in focused 2-hour blocks.`,
      
      supportAvailable: `Your AI advisor will guide you through each step, providing context, suggestions, and accountability check-ins.`
    };
  }

  /**
   * Build personalized current reality narrative
   */
  private buildCurrentRealityNarrative(context: RoadmapContext): string {
    const parts: string[] = [];
    
    if (context.emergencyLog) {
      parts.push(`You've shared that emergencies like "${context.emergencyLog.slice(0, 100)}..." are pulling you away from important work.`);
    }
    
    if (context.sacrifices.length > 0) {
      parts.push(`You've put ${context.sacrifices.slice(0, 2).join(' and ')} on hold for the business.`);
    }
    
    if (context.growthBottleneck) {
      parts.push(`Your biggest growth challenge is: ${context.growthBottleneck.slice(0, 150)}...`);
    }
    
    return parts.join(' ') || 'You\'re ready to take your business to the next level.';
  }

  /**
   * Generate all 13 weekly sprints
   */
  private generateWeeklySprints(context: RoadmapContext, valueAnalysis: ValueAnalysisResult): WeeklySprint[] {
    const weeks: WeeklySprint[] = [];
    
    for (let weekNum = 1; weekNum <= 13; weekNum++) {
      const phase = this.getPhaseForWeek(weekNum);
      const theme = this.getWeekTheme(weekNum, context, valueAnalysis);
      const focus = this.getWeekFocus(weekNum, context, valueAnalysis);
      
      weeks.push({
        week: weekNum,
        theme,
        focus,
        objectives: this.generateObjectives(weekNum, context, valueAnalysis),
        tasks: this.generateTasks(weekNum, theme, focus, context, valueAnalysis),
        milestone: this.getMilestone(weekNum),
        reflection: undefined // Filled in as user completes weeks
      });
    }
    
    return weeks;
  }

  /**
   * Get the phase for a given week
   */
  private getPhaseForWeek(weekNum: number): typeof SPRINT_PHASES[keyof typeof SPRINT_PHASES] {
    if (weekNum <= 2) return SPRINT_PHASES.RELIEF;
    if (weekNum <= 4) return SPRINT_PHASES.FOUNDATION;
    if (weekNum <= 6) return SPRINT_PHASES.MOMENTUM;
    if (weekNum <= 8) return SPRINT_PHASES.LOCK_IN;
    if (weekNum <= 10) return SPRINT_PHASES.SCALE;
    return SPRINT_PHASES.TRANSFORM;
  }

  /**
   * Generate week theme based on context and priorities
   */
  private getWeekTheme(weekNum: number, context: RoadmapContext, valueAnalysis: ValueAnalysisResult): string {
    // Week 1-2: Address immediate pain points
    if (weekNum === 1) return 'Quick Wins & Immediate Relief';
    if (weekNum === 2) return 'Pain Point Resolution';
    
    // Week 3-4: Foundation based on top priorities
    if (weekNum === 3) return `Building Foundation: ${context.ninetyDayPriorities[0] || 'Core Systems'}`;
    if (weekNum === 4) return 'Systems & Process Setup';
    
    // Week 5-6: Address critical risks
    if (weekNum === 5) {
      const topRisk = valueAnalysis.riskRegister[0];
      return topRisk ? `Risk Mitigation: ${topRisk.title}` : 'Risk Assessment & Planning';
    }
    if (weekNum === 6) return 'Building Resilience';
    
    // Week 7-8: Value capture
    if (weekNum === 7) {
      const topOpp = valueAnalysis.valueGaps[0];
      return topOpp ? `Value Capture: ${topOpp.area}` : 'Value Optimization';
    }
    if (weekNum === 8) return 'Stabilization & Lock-In';
    
    // Week 9-10: Growth acceleration
    if (weekNum === 9) return `Growth Focus: ${context.ninetyDayPriorities[1] || 'Revenue Growth'}`;
    if (weekNum === 10) return 'Scaling What Works';
    
    // Week 11-13: Transformation
    if (weekNum === 11) return 'Strategic Positioning';
    if (weekNum === 12) return 'Future-Proofing';
    if (weekNum === 13) return 'Transformation Complete';
    
    return `Week ${weekNum} Focus`;
  }

  /**
   * Generate week focus description
   */
  private getWeekFocus(weekNum: number, context: RoadmapContext, valueAnalysis: ValueAnalysisResult): string {
    const phase = this.getPhaseForWeek(weekNum);
    
    if (weekNum === 1) {
      return `Get a quick win under your belt to build momentum. We're targeting the lowest-hanging fruit first.`;
    }
    
    if (weekNum === 2) {
      return `Address the emergency that's stealing your time: ${context.emergencyLog?.slice(0, 100) || 'operational fires'}`;
    }
    
    return phase.focus;
  }

  /**
   * Generate objectives for a week
   */
  private generateObjectives(weekNum: number, context: RoadmapContext, valueAnalysis: ValueAnalysisResult): string[] {
    const objectives: string[] = [];
    
    if (weekNum === 1) {
      objectives.push('Complete your first quick win task');
      objectives.push('Establish your weekly review rhythm');
      objectives.push('Set up your tracking system');
    } else if (weekNum <= 4) {
      objectives.push('Build core systems and processes');
      objectives.push('Document key workflows');
      objectives.push('Reduce firefighting time by 25%');
    } else if (weekNum <= 8) {
      objectives.push('Address critical business risks');
      objectives.push('Capture quick-win value opportunities');
      objectives.push('Build sustainable habits');
    } else {
      objectives.push('Scale proven improvements');
      objectives.push('Measure transformation impact');
      objectives.push('Plan for continued growth');
    }
    
    return objectives;
  }

  /**
   * Generate tasks for a specific week
   */
  private generateTasks(
    weekNum: number,
    theme: string,
    focus: string,
    context: RoadmapContext,
    valueAnalysis: ValueAnalysisResult
  ): WeeklyTask[] {
    const tasks: WeeklyTask[] = [];
    const weekId = `w${weekNum}`;
    
    // Quick Win Task (every week)
    tasks.push({
      id: `${weekId}_quickwin`,
      title: this.getQuickWinTask(weekNum, context, valueAnalysis),
      description: 'Start with this 30-minute task to build momentum',
      category: 'quick_win',
      estimatedTime: '30 minutes',
      completed: false
    });
    
    // Core Task 1
    tasks.push({
      id: `${weekId}_core1`,
      title: this.getCoreTask1(weekNum, context, valueAnalysis),
      description: `Main focus task for ${theme.toLowerCase()}`,
      category: 'core_task',
      estimatedTime: '2 hours',
      completed: false
    });
    
    // Core Task 2
    tasks.push({
      id: `${weekId}_core2`,
      title: this.getCoreTask2(weekNum, context, valueAnalysis),
      description: 'Secondary focus task to reinforce progress',
      category: 'core_task',
      estimatedTime: '1.5 hours',
      completed: false
    });
    
    // Reflection Task (every week)
    tasks.push({
      id: `${weekId}_reflect`,
      title: 'Weekly Reflection & Planning',
      description: 'Review progress, capture learnings, plan next week',
      category: 'reflection',
      estimatedTime: '15 minutes',
      completed: false
    });
    
    return tasks;
  }

  /**
   * Generate quick win task based on week and context
   */
  private getQuickWinTask(weekNum: number, context: RoadmapContext, valueAnalysis: ValueAnalysisResult): string {
    if (weekNum === 1) {
      // First quick win based on trust signals
      const hiddenSignals = valueAnalysis.actionPlan.quickWins[0];
      if (hiddenSignals) {
        return `Add trust signals to your website (${hiddenSignals.area})`;
      }
      return 'Update your LinkedIn profile with recent wins';
    }
    
    if (weekNum <= 4) {
      return `Document one ${context.ninetyDayPriorities[0] || 'key'} process`;
    }
    
    if (weekNum <= 8) {
      return 'Automate one recurring manual task';
    }
    
    return 'Review and optimize one customer touchpoint';
  }

  /**
   * Generate core task 1 based on week and context
   */
  private getCoreTask1(weekNum: number, context: RoadmapContext, valueAnalysis: ValueAnalysisResult): string {
    const priorities = context.ninetyDayPriorities;
    const risks = valueAnalysis.riskRegister;
    
    if (weekNum === 1) {
      return `Audit your current ${priorities[0] || 'business'} situation and identify low-hanging fruit`;
    }
    
    if (weekNum === 2) {
      return `Create a delegation plan for: ${context.emergencyLog?.slice(0, 50) || 'recurring issues'}`;
    }
    
    if (weekNum === 3) {
      return `Implement your first ${priorities[0] || 'operational'} improvement`;
    }
    
    if (weekNum === 5 && risks[0]) {
      return `Address critical risk: ${risks[0].title}`;
    }
    
    if (weekNum === 7 && valueAnalysis.valueGaps[0]) {
      return `Capture value opportunity: ${valueAnalysis.valueGaps[0].area}`;
    }
    
    return `Execute core ${context.ninetyDayPriorities[Math.floor(weekNum / 4)] || 'improvement'} task`;
  }

  /**
   * Generate core task 2 based on week and context
   */
  private getCoreTask2(weekNum: number, context: RoadmapContext, valueAnalysis: ValueAnalysisResult): string {
    if (weekNum <= 2) {
      return 'Set up progress tracking system for your 90-day goals';
    }
    
    if (weekNum <= 4) {
      return 'Create documentation template for key processes';
    }
    
    if (weekNum <= 6) {
      return 'Build cross-training plan for critical roles';
    }
    
    if (weekNum <= 8) {
      return 'Measure and document progress on key metrics';
    }
    
    if (weekNum <= 10) {
      return 'Scale one successful improvement to another area';
    }
    
    return 'Review transformation progress and plan next quarter';
  }

  /**
   * Get milestone for specific weeks
   */
  private getMilestone(weekNum: number): string | undefined {
    const milestones: Record<number, string> = {
      4: '🎯 Foundation Complete - Core systems in place',
      8: '📈 Midpoint Review - Measure progress against goals',
      13: '🏆 Transformation Complete - Ready for next phase'
    };
    return milestones[weekNum];
  }

  /**
   * Generate success metrics
   */
  private generateSuccessMetrics(context: RoadmapContext, valueAnalysis: ValueAnalysisResult): SuccessMetrics {
    return {
      week4: `Complete foundation for ${context.ninetyDayPriorities[0] || 'primary goal'}`,
      week8: `Reduce ${context.criticalRisks[0]?.title || 'key risks'} by 50%`,
      week13: `Achieve measurable progress on all 3 priorities: ${context.ninetyDayPriorities.slice(0, 3).join(', ')}`
    };
  }

  /**
   * Generate subtitle based on context
   */
  private generateSubtitle(context: RoadmapContext): string {
    const focus = context.ninetyDayPriorities[0] || 'business growth';
    return `Your personalized path to ${focus} and sustainable success`;
  }

  /**
   * Estimate total hours based on commitment
   */
  private estimateHours(commitment: string): number {
    if (commitment.includes('5-10')) return 7.5 * 13;
    if (commitment.includes('10-15')) return 12.5 * 13;
    if (commitment.includes('15-20')) return 17.5 * 13;
    if (commitment.includes('20+')) return 25 * 13;
    return 12.5 * 13; // Default
  }
}

// Singleton instance
export const roadmapGenerator = new RoadmapGenerator();

