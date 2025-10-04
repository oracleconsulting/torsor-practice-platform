import { UserMetrics } from './dynamicCalculations';

export interface UserData {
  name?: string;
  email?: string;
  part1Answers?: Record<string, any>;
  part2Answers?: Record<string, any>;
  currentRevenue?: number;
  targetRevenue?: number;
  industry?: string;
  businessStage?: string;
  painPoints?: string[];
  aspirations?: string[];
}

export class NarrativeGenerator {
  static generateVisionNarrative(userData: UserData, userMetrics: UserMetrics): string {
    // Extract emotional themes from responses
    const painPoints = this.extractPainPoints(userData);
    const aspirations = this.extractAspirations(userData);
    const currentState = this.analyzeCurrentState(userData, userMetrics);
    
    // Create a story that shows we've truly understood them
    return `
I hear you, ${userData.name || 'friend'}.

${this.mirrorCurrentState(currentState, painPoints)}

What strikes me most is ${this.reflectKeyInsight(userData)}. ${this.validateFeelings(painPoints)}

Your vision of ${this.paraphraseAspiration(aspirations)} isn't just a dream - it's a necessity. Because ${this.explainWhyItMatters(userData, userMetrics)}.

Here's what I see for you: ${this.paintTransformation(userData, userMetrics)}

This isn't about working harder. It's about ${this.identifyCoreShift(userData)}. And yes, it will feel uncomfortable at times. But ${this.provideReassurance(userData)}.

${this.createCallToAction(userData, userMetrics)}
    `.trim();
  }

  static generateTransformationStory(userData: UserData, userMetrics: UserMetrics) {
    const currentState = this.analyzeCurrentState(userData, userMetrics);
    const futureState = this.paintFutureState(userData, userMetrics);
    
    return {
      opening: this.createOpening(userData, currentState),
      current_reality: this.describeCurrentReality(currentState, userData),
      journey_ahead: this.describeJourneyAhead(userData, userMetrics),
      transformation: this.describeTransformation(userData, userMetrics),
      closing: this.createClosing(userData, userMetrics)
    };
  }

  static generatePersonalNarrative(userData: UserData, userMetrics: UserMetrics): string {
    const painPoints = this.extractPainPoints(userData);
    const aspirations = this.extractAspirations(userData);
    
    return `
${this.createPersonalOpening(userData)}

Right now, you're ${this.describeCurrentSituation(userData, painPoints)}. 
${this.acknowledgeStruggle(painPoints)}

But here's what I see in you: ${this.identifyStrengths(userData)}

Your vision of ${this.paraphraseAspiration(aspirations)} is absolutely achievable. 
${this.explainWhyItMatters(userData, userMetrics)}

The path isn't about becoming someone else - it's about ${this.identifyCoreShift(userData)}.

${this.createPersonalCallToAction(userData, userMetrics)}
    `.trim();
  }

  private static extractPainPoints(userData: UserData): string[] {
    const painPoints: string[] = [];
    
    // Extract from Part 1 answers
    if (userData.part1Answers) {
      const answers = userData.part1Answers;
      
      if (answers.work_life_balance?.includes('poor') || answers.work_life_balance?.includes('struggling')) {
        painPoints.push('feeling overwhelmed by work demands');
      }
      
      if (answers.time_management?.includes('poor') || answers.time_management?.includes('struggling')) {
        painPoints.push('constantly feeling behind and stressed');
      }
      
      if (answers.business_growth?.includes('stuck') || answers.business_growth?.includes('plateaued')) {
        painPoints.push('feeling stuck in your business growth');
      }
      
      if (answers.financial_stress?.includes('high') || answers.financial_stress?.includes('struggling')) {
        painPoints.push('financial stress affecting your decisions');
      }
    }
    
    // Extract from Part 2 answers
    if (userData.part2Answers) {
      const answers = userData.part2Answers;
      
      if (answers.business_challenges?.includes('time') || answers.business_challenges?.includes('overwhelm')) {
        painPoints.push('not having enough time for what matters');
      }
      
      if (answers.business_challenges?.includes('revenue') || answers.business_challenges?.includes('income')) {
        painPoints.push('revenue not matching your efforts');
      }
      
      if (answers.business_challenges?.includes('team') || answers.business_challenges?.includes('delegation')) {
        painPoints.push('struggling to build the right team');
      }
    }
    
    return painPoints.length > 0 ? painPoints : ['feeling like there must be a better way'];
  }

  private static extractAspirations(userData: UserData): string[] {
    const aspirations: string[] = [];
    
    if (userData.part1Answers) {
      const answers = userData.part1Answers;
      
      if (answers.ideal_life?.includes('balance') || answers.ideal_life?.includes('freedom')) {
        aspirations.push('having true work-life balance');
      }
      
      if (answers.ideal_life?.includes('impact') || answers.ideal_life?.includes('purpose')) {
        aspirations.push('making a meaningful impact');
      }
      
      if (answers.ideal_life?.includes('growth') || answers.ideal_life?.includes('success')) {
        aspirations.push('building a successful, sustainable business');
      }
    }
    
    if (userData.part2Answers) {
      const answers = userData.part2Answers;
      
      if (answers.business_goals?.includes('revenue') || answers.business_goals?.includes('growth')) {
        aspirations.push('achieving your revenue goals');
      }
      
      if (answers.business_goals?.includes('team') || answers.business_goals?.includes('scale')) {
        aspirations.push('building a team that can scale');
      }
      
      if (answers.business_goals?.includes('freedom') || answers.business_goals?.includes('lifestyle')) {
        aspirations.push('creating the lifestyle you want');
      }
    }
    
    return aspirations.length > 0 ? aspirations : ['building the business and life you truly want'];
  }

  private static analyzeCurrentState(userData: UserData, userMetrics: UserMetrics) {
    const currentHours = userMetrics.working_hours_per_week;
    const targetHours = userMetrics.target_working_hours;
    const currentRevenue = userData.currentRevenue || 0;
    const targetRevenue = userMetrics.annual_revenue_target;
    
    return {
      workingTooMuch: currentHours > targetHours,
      revenueGap: targetRevenue - currentRevenue,
      efficiencyGap: currentHours - targetHours,
      metaphor: this.getCurrentMetaphor(userData),
      cost: this.getCurrentCost(userData, userMetrics)
    };
  }

  private static mirrorCurrentState(state: any, painPoints: string[]): string {
    const primaryPain = painPoints[0] || 'feeling overwhelmed';
    
    if (state.workingTooMuch) {
      return `Right now, you're working ${state.efficiencyGap} more hours than you want to, and ${primaryPain}. Every day feels like you're ${state.metaphor || 'running on a hamster wheel'}, and the ${state.cost || 'cost to your life'} is becoming unbearable.`;
    }
    
    return `Right now, ${primaryPain}. Even though you're working reasonable hours, you're not seeing the results you want, and the ${state.cost || 'frustration'} is building.`;
  }

  private static reflectKeyInsight(userData: UserData): string {
    const patterns = this.identifyPatterns(userData);
    return `how ${patterns.primary} is actually ${patterns.insight}`;
  }

  private static identifyPatterns(userData: UserData) {
    // Analyze patterns in their responses
    const hasTimeIssues = this.hasTimeManagementIssues(userData);
    const hasRevenueIssues = this.hasRevenueIssues(userData);
    const hasTeamIssues = this.hasTeamIssues(userData);
    
    if (hasTimeIssues && hasRevenueIssues) {
      return {
        primary: "working harder isn't leading to better results",
        insight: "a sign that you need better systems, not more effort"
      };
    }
    
    if (hasTimeIssues) {
      return {
        primary: "time management struggles",
        insight: "really about priority management and delegation"
      };
    }
    
    if (hasRevenueIssues) {
      return {
        primary: "revenue not growing as expected",
        insight: "often about focusing on the right activities, not just more activities"
      };
    }
    
    return {
      primary: "feeling stuck",
      insight: "a natural part of growth that requires a different approach"
    };
  }

  private static validateFeelings(painPoints: string[]): string {
    if (painPoints.length === 0) return '';
    
    const primaryPain = painPoints[0];
    return `It's completely normal to feel this way. ${primaryPain.charAt(0).toUpperCase() + primaryPain.slice(1)} is a common challenge for business owners who are ready to level up.`;
  }

  private static paraphraseAspiration(aspirations: string[]): string {
    if (aspirations.length === 0) return 'building the business and life you truly want';
    
    const primaryAspiration = aspirations[0];
    return primaryAspiration;
  }

  private static explainWhyItMatters(userData: UserData, userMetrics: UserMetrics): string {
    const currentRevenue = userData.currentRevenue || 0;
    const targetRevenue = userMetrics.annual_revenue_target;
    
    if (currentRevenue === 0) {
      return "you're ready to move from idea to impact, and the world needs what you have to offer.";
    }
    
    if (targetRevenue > currentRevenue * 2) {
      return "you have the potential to create something truly significant, and settling for less would be a disservice to your vision.";
    }
    
    return "you've proven you can create value, and now it's time to create the systems that let you scale that value sustainably.";
  }

  private static paintTransformation(userData: UserData, userMetrics: UserMetrics): string {
    const freedHours = this.calculateFreedHours(userMetrics);
    const firstRevenue = this.calculateFirstRevenue(userMetrics);
    
    return `In 90 days, you'll have reclaimed ${freedHours} hours per week while generating £${firstRevenue.toLocaleString()}/month in new revenue. But more importantly, you'll have ${this.identifyEmotionalWin(userData)}.`;
  }

  private static calculateFreedHours(userMetrics: UserMetrics): number {
    const currentHours = userMetrics.working_hours_per_week;
    const targetHours = userMetrics.target_working_hours;
    const potentialFreedHours = currentHours - targetHours;
    return Math.round(potentialFreedHours * 0.3);
  }

  private static calculateFirstRevenue(userMetrics: UserMetrics): number {
    const hourlyRate = userMetrics.billable_rate_gbp || 100;
    const initialBillableHours = Math.min(10, this.calculateFreedHours(userMetrics));
    return Math.round(hourlyRate * initialBillableHours * 4);
  }

  private static identifyEmotionalWin(userData: UserData): string {
    const aspirations = this.extractAspirations(userData);
    
    if (aspirations.some(a => a.includes('balance'))) {
      return "the freedom to choose how you spend your time";
    }
    
    if (aspirations.some(a => a.includes('impact'))) {
      return "the confidence that you're making the difference you want to make";
    }
    
    if (aspirations.some(a => a.includes('success'))) {
      return "the satisfaction of building something that works for you, not against you";
    }
    
    return "the clarity and confidence to make decisions that align with your vision";
  }

  private static identifyCoreShift(userData: UserData): string {
    const patterns = this.identifyPatterns(userData);
    
    if (patterns.primary.includes('working harder')) {
      return "working smarter and building systems that work for you";
    }
    
    if (patterns.primary.includes('time management')) {
      return "focusing on what truly matters and delegating the rest";
    }
    
    if (patterns.primary.includes('revenue')) {
      return "aligning your activities with your highest-value opportunities";
    }
    
    return "shifting from doing everything yourself to building a business that can grow without you";
  }

  private static provideReassurance(userData: UserData): string {
    const painPoints = this.extractPainPoints(userData);
    
    if (painPoints.some(p => p.includes('overwhelmed'))) {
      return "the systems we'll build together will make everything feel more manageable.";
    }
    
    if (painPoints.some(p => p.includes('stuck'))) {
      return "you already have what it takes - we just need to unlock it with the right approach.";
    }
    
    if (painPoints.some(p => p.includes('revenue'))) {
      return "the revenue will follow when you're focused on the right activities.";
    }
    
    return "you're not starting from scratch - you're building on a foundation that's already strong.";
  }

  private static createCallToAction(userData: UserData, userMetrics: UserMetrics): string {
    const freedHours = this.calculateFreedHours(userMetrics);
    const firstRevenue = this.calculateFirstRevenue(userMetrics);
    
    return `Ready to reclaim ${freedHours} hours per week and start generating £${firstRevenue.toLocaleString()}/month in new revenue? Your 12-week roadmap is waiting.`;
  }

  // Helper methods for pattern recognition
  private static hasTimeManagementIssues(userData: UserData): boolean {
    const answers = { ...userData.part1Answers, ...userData.part2Answers };
    
    return Object.values(answers).some(answer => 
      typeof answer === 'string' && 
      (answer.includes('time') || answer.includes('overwhelm') || answer.includes('busy'))
    );
  }

  private static hasRevenueIssues(userData: UserData): boolean {
    const answers = { ...userData.part1Answers, ...userData.part2Answers };
    
    return Object.values(answers).some(answer => 
      typeof answer === 'string' && 
      (answer.includes('revenue') || answer.includes('income') || answer.includes('money'))
    );
  }

  private static hasTeamIssues(userData: UserData): boolean {
    const answers = { ...userData.part1Answers, ...userData.part2Answers };
    
    return Object.values(answers).some(answer => 
      typeof answer === 'string' && 
      (answer.includes('team') || answer.includes('delegation') || answer.includes('help'))
    );
  }

  private static getCurrentMetaphor(userData: UserData): string {
    const painPoints = this.extractPainPoints(userData);
    
    if (painPoints.some(p => p.includes('overwhelm'))) {
      return 'running on a hamster wheel';
    }
    
    if (painPoints.some(p => p.includes('stuck'))) {
      return 'spinning your wheels';
    }
    
    if (painPoints.some(p => p.includes('time'))) {
      return 'constantly playing catch-up';
    }
    
    return 'working harder than you need to';
  }

  private static getCurrentCost(userData: UserData, userMetrics: UserMetrics): string {
    const currentHours = userMetrics.working_hours_per_week;
    const targetHours = userMetrics.target_working_hours;
    
    if (currentHours > targetHours + 10) {
      return 'cost to your health and relationships';
    }
    
    if (currentHours > targetHours) {
      return 'cost to your work-life balance';
    }
    
    return 'cost to your peace of mind';
  }

  // Additional narrative generation methods
  private static createOpening(userData: UserData, currentState: any): string {
    const name = userData.name || 'friend';
    return `I see you, ${name}. I see the gap between where you are and where you want to be.`;
  }

  private static describeCurrentReality(currentState: any, userData: UserData): string {
    return this.mirrorCurrentState(currentState, this.extractPainPoints(userData));
  }

  private static describeJourneyAhead(userData: UserData, userMetrics: UserMetrics): string {
    const freedHours = this.calculateFreedHours(userMetrics);
    const firstRevenue = this.calculateFirstRevenue(userMetrics);
    
    return `The journey ahead involves reclaiming ${freedHours} hours per week through better systems and processes, while simultaneously building new revenue streams that could generate £${firstRevenue.toLocaleString()}/month within 90 days.`;
  }

  private static describeTransformation(userData: UserData, userMetrics: UserMetrics): string {
    const aspirations = this.extractAspirations(userData);
    const primaryAspiration = aspirations[0] || 'building the business and life you want';
    
    return `The transformation is about moving from feeling overwhelmed and stuck to having the clarity, systems, and confidence to ${primaryAspiration}.`;
  }

  private static createClosing(userData: UserData, userMetrics: UserMetrics): string {
    return this.createCallToAction(userData, userMetrics);
  }

  private static createPersonalOpening(userData: UserData): string {
    const name = userData.name || 'friend';
    return `Dear ${name},`;
  }

  private static describeCurrentSituation(userData: UserData, painPoints: string[]): string {
    const primaryPain = painPoints[0] || 'feeling like there must be a better way';
    return primaryPain;
  }

  private static acknowledgeStruggle(painPoints: string[]): string {
    if (painPoints.length === 0) return '';
    
    return `The struggle is real, and it's exhausting. But here's what I know: your frustration is actually a sign that you're ready for the next level.`;
  }

  private static identifyStrengths(userData: UserData): string {
    const currentRevenue = userData.currentRevenue || 0;
    
    if (currentRevenue > 0) {
      return "you've already proven you can create value and generate revenue. That's not easy, and it shows you have what it takes.";
    }
    
    return "you have the vision and determination to build something meaningful. That's the foundation everything else is built on.";
  }

  private static createPersonalCallToAction(userData: UserData, userMetrics: UserMetrics): string {
    return `It's time to stop feeling stuck and start feeling empowered. Your roadmap is ready. Let's build the business and life you truly want.`;
  }

  private static paintFutureState(userData: UserData, userMetrics: UserMetrics): string {
    const freedHours = this.calculateFreedHours(userMetrics);
    const firstRevenue = this.calculateFirstRevenue(userMetrics);
    const aspirations = this.extractAspirations(userData);
    
    return `A future where you're working ${userMetrics.target_working_hours} focused hours per week, generating £${firstRevenue.toLocaleString()}/month in new revenue, and ${aspirations[0] || 'living the life you want'}.`;
  }
} 