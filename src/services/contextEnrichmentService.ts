// import { knowledgeBaseService } from './knowledgeBaseService';
import { ClientContext, EnrichmentResult, EnrichmentConfig } from '@/types/context';

interface EnhancedSignals {
  // Industry-specific patterns
  industrySegment?: string;
  industryMaturity?: string;
  regulatoryEnvironment?: string[];
  
  // Challenge categorization
  challengeTypes?: {
    operational?: string[];
    financial?: string[];
    market?: string[];
    technical?: string[];
  };
  
  // Goal hierarchies
  goalTimelines?: {
    immediate?: string[];
    shortTerm?: string[];
    longTerm?: string[];
  };
  
  // Business context
  businessModel?: string;
  teamSize?: string;
  growthStage?: string;
  marketPosition?: string;
}

interface FilteringCriteria {
  baseRelevance: number;
  qualityFactors: {
    specificity: number;
    actionability: number;
    evidence: number;
    recency: number;
  };
  diversityRequirements: {
    maxPerCategory: number;
    requiredCategories: string[];
    balanceShortAndLongTerm: boolean;
  };
}

export class ContextEnrichmentService {
  /**
   * Enriches client context with relevant knowledge base insights
   * Returns only highly relevant content that meaningfully adds to the context
   */
  static async enrichContext(
    context: ClientContext, 
    config?: EnrichmentConfig
  ): Promise<EnrichmentResult> {
    try {
      // Extract enhanced signals from client context
      const signals = this.extractEnhancedSignals(context);
      
      // Build semantic search query
      const searchQuery = this.buildEnhancedQuery(signals, context);
      
      // Search knowledge base - STUB for now
      // TODO: Re-enable when knowledge base service is properly configured
      const results: any[] = [];
      /*
      const results = await knowledgeBaseService.searchDocuments(
        searchQuery,
        {
          // Map to expected filter format
          category: context.industry,
          tags: context.challenges
        }
      );
      */

      // Apply sophisticated filtering
      const enrichments = this.applyEnhancedFiltering(
        results, 
        context, 
        signals,
        config
      );

      // Record usage for feedback loop - STUB for now
      /*
      await Promise.all(enrichments.map(e => 
        knowledgeBaseService.recordUsage(e.id, 'roadmap' as const, {
          clientId: context.clientId,
          relevanceScore: e.relevanceScore || 0.5,
          enrichmentType: config?.type || 'general'
        })
      ));
      */

      return {
        enrichments: enrichments.map(e => ({
          content: e.content,
          source: e.title,
          relevance: e.relevanceScore || 0.5,
          context: e.type || 'general',
          category: e.category,
          actionability: this.calculateActionability(e.content)
        })),
        signalsUsed: signals,
        enhancedSignals: signals
      };

    } catch (error) {
      console.error('Context enrichment failed:', error);
      // Fail gracefully - return empty enrichment rather than breaking flow
      return { enrichments: [], signalsUsed: [], enhancedSignals: {} };
    }
  }

  /**
   * Enrich assessment questions based on client responses
   */
  static async enrichAssessmentQuestions(currentResponses: any) {
    const context = this.buildContextFromResponses(currentResponses);
    const insights = await this.enrichContext(context, {
      type: 'assessment',
      minRelevance: 0.8,
      limit: 3
    });
    
    // Analyze gaps and patterns
    const gapAnalysis = this.analyzeResponseGaps(currentResponses, insights);
    
    return {
      skipQuestions: gapAnalysis.alreadyAnswered,
      addQuestions: gapAnalysis.criticalGaps.map(gap => ({
        question: gap.question,
        rationale: gap.rationale,
        category: gap.category
      })),
      rephrase: this.generateIndustrySpecificPhrasing(
        context.industry,
        gapAnalysis.questionsToRephrase
      )
    };
  }

  /**
   * Enrich validation responses with benchmarks and recommendations
   */
  static async enrichValidation(assessmentData: any) {
    const context = this.buildContextFromAssessment(assessmentData);
    const insights = await this.enrichContext(context, {
      type: 'validation',
      minRelevance: 0.75,
      limit: 5
    });
    
    return {
      // Add industry benchmarks
      benchmarks: this.extractBenchmarks(insights, context),
      
      // Suggest proven solutions
      provenApproaches: this.extractProvenApproaches(insights, context),
      
      // Warn about common pitfalls
      watchOuts: this.extractCommonPitfalls(insights, context),
      
      // Success metrics
      kpis: this.extractRelevantKPIs(insights, context)
    };
  }

  /**
   * Enrich sprint task generation with tactical guidance
   */
  static async enrichSprintTasks(sprintGoals: any[], clientContext: ClientContext) {
    const insights = await this.enrichContext({
      ...clientContext,
      currentFocus: sprintGoals
    }, {
      type: 'sprint',
      minRelevance: 0.8,
      limit: 4
    });
    
    return {
      // Add tactical how-tos
      implementationGuides: this.extractImplementationGuides(insights, sprintGoals),
      
      // Include templates/tools
      resources: this.extractRelevantResources(insights, sprintGoals),
      
      // Add success metrics
      sprintKPIs: this.extractSprintKPIs(insights, sprintGoals),
      
      // Dependencies and prerequisites
      prerequisites: this.extractPrerequisites(insights, sprintGoals)
    };
  }

  /**
   * Enrich progress analysis with peer comparisons and adjustments
   */
  static async enrichProgressAnalysis(progressData: any) {
    const context = this.buildContextFromProgress(progressData);
    const insights = await this.enrichContext(context, {
      type: 'progress',
      minRelevance: 0.7,
      limit: 4
    });
    
    return {
      // Compare to similar companies
      peerComparison: this.extractPeerComparisons(insights, progressData),
      
      // Identify acceleration opportunities
      accelerators: this.extractAccelerators(insights, progressData),
      
      // Suggest course corrections
      adjustments: this.extractCourseCorrections(insights, progressData),
      
      // Next best actions
      nextActions: this.extractNextActions(insights, progressData)
    };
  }

  /**
   * Extract enhanced signals with more sophisticated categorization
   */
  private static extractEnhancedSignals(context: ClientContext): EnhancedSignals {
    const enhancedSignals: EnhancedSignals = {};

    // Industry analysis
    if (context.industry) {
      enhancedSignals.industrySegment = this.categorizeIndustrySegment(context);
      enhancedSignals.industryMaturity = this.assessIndustryMaturity(context);
      enhancedSignals.regulatoryEnvironment = this.identifyRegulations(context);
    }

    // Challenge categorization
    if (context.challenges) {
      enhancedSignals.challengeTypes = this.categorizeChallenges(context.challenges);
    }

    // Goal timeline mapping
    if (context.goals) {
      enhancedSignals.goalTimelines = this.categorizeGoalsByTimeline(context.goals);
    }

    // Business context
    enhancedSignals.businessModel = this.identifyBusinessModel(context);
    enhancedSignals.teamSize = this.categorizeTeamSize(context);
    enhancedSignals.growthStage = this.identifyGrowthStage(context);
    enhancedSignals.marketPosition = this.assessMarketPosition(context);

    return enhancedSignals;
  }

  /**
   * Apply enhanced filtering with multiple factors
   */
  private static applyEnhancedFiltering(
    results: any[],
    context: ClientContext,
    signals: EnhancedSignals,
    config?: EnrichmentConfig
  ): any[] {
    const criteria = this.getFilteringCriteria(config?.type || 'general');
    
    // Score each result
    const scoredResults = results.map(result => ({
      ...result,
      qualityScore: this.calculateQualityScore(result, criteria.qualityFactors),
      relevanceScore: this.calculateDynamicRelevance(result, context, signals),
      diversityScore: this.calculateDiversityScore(result, results)
    }));

    // Apply dynamic threshold
    const filtered = scoredResults.filter(result => {
      const threshold = this.getDynamicThreshold(result, context, criteria);
      return result.relevanceScore >= threshold;
    });

    // Ensure diversity
    return this.ensureDiversity(filtered, criteria.diversityRequirements);
  }

  /**
   * Get filtering criteria based on enrichment type
   */
  private static getFilteringCriteria(type: string): FilteringCriteria {
    const criteriaMap: Record<string, FilteringCriteria> = {
      general: {
        baseRelevance: 0.75,
        qualityFactors: {
          specificity: 0.3,
          actionability: 0.3,
          evidence: 0.2,
          recency: 0.2
        },
        diversityRequirements: {
          maxPerCategory: 2,
          requiredCategories: ['strategic', 'tactical'],
          balanceShortAndLongTerm: true
        }
      },
      assessment: {
        baseRelevance: 0.8,
        qualityFactors: {
          specificity: 0.4,
          actionability: 0.2,
          evidence: 0.3,
          recency: 0.1
        },
        diversityRequirements: {
          maxPerCategory: 1,
          requiredCategories: ['diagnostic'],
          balanceShortAndLongTerm: false
        }
      },
      sprint: {
        baseRelevance: 0.7,
        qualityFactors: {
          specificity: 0.2,
          actionability: 0.5,
          evidence: 0.2,
          recency: 0.1
        },
        diversityRequirements: {
          maxPerCategory: 3,
          requiredCategories: ['tactical', 'implementation'],
          balanceShortAndLongTerm: false
        }
      }
    };

    return criteriaMap[type] || criteriaMap.general;
  }

  /**
   * Calculate dynamic relevance threshold based on context
   */
  private static getDynamicThreshold(
    result: any,
    context: ClientContext,
    criteria: FilteringCriteria
  ): number {
    let threshold = criteria.baseRelevance;

    // Adjust for critical challenges
    if (result.category === 'critical_challenge' && context.urgency === 'high') {
      threshold -= 0.05;
    }

    // Adjust for content freshness
    const daysSinceUpdate = this.getDaysSinceUpdate(result.updated_at);
    if (daysSinceUpdate > 90) {
      threshold += 0.05;
    }

    // Adjust for specificity
    if (this.isHighlySpecific(result.content, context)) {
      threshold -= 0.03;
    }

    return Math.max(0.6, Math.min(0.9, threshold));
  }

  /**
   * Ensure diversity in results
   */
  private static ensureDiversity(
    results: any[],
    requirements: FilteringCriteria['diversityRequirements']
  ): any[] {
    const selected: any[] = [];
    const categoryCount: Record<string, number> = {};

    // First, ensure required categories
    for (const category of requirements.requiredCategories) {
      const categoryResult = results.find(r => 
        r.category === category && !selected.includes(r)
      );
      if (categoryResult) {
        selected.push(categoryResult);
        categoryCount[category] = 1;
      }
    }

    // Then add remaining results respecting max per category
    const remaining = results.filter(r => !selected.includes(r));
    
    for (const result of remaining) {
      const category = result.category || 'general';
      if ((categoryCount[category] || 0) < requirements.maxPerCategory) {
        selected.push(result);
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      }
    }

    // Balance short and long term if required
    if (requirements.balanceShortAndLongTerm) {
      return this.balanceTimeHorizons(selected);
    }

    return selected;
  }

  /**
   * Extended mapping for related industries
   */
  private static getRelatedIndustries(industry: string): string[] {
    const relatedMap: Record<string, string[]> = {
      'accounting': ['finance', 'professional services', 'consulting', 'bookkeeping', 'tax services'],
      'consulting': ['professional services', 'business services', 'advisory', 'strategy'],
      'technology': ['software', 'it services', 'digital', 'saas', 'cloud services'],
      'manufacturing': ['production', 'industrial', 'supply chain', 'logistics'],
      'retail': ['ecommerce', 'consumer goods', 'wholesale', 'distribution'],
      'healthcare': ['medical', 'pharma', 'biotech', 'health services'],
      'finance': ['banking', 'investment', 'insurance', 'fintech'],
      // Add more mappings as needed
    };
    
    return relatedMap[industry.toLowerCase()] || [];
  }

  /**
   * Extended mapping for related challenges
   */
  private static getRelatedChallenges(challenge: string): string[] {
    const relatedMap: Record<string, string[]> = {
      'growth': ['scaling', 'expansion', 'market penetration', 'customer acquisition'],
      'efficiency': ['productivity', 'optimization', 'streamlining', 'automation'],
      'revenue': ['sales', 'profitability', 'cash flow', 'pricing', 'monetization'],
      'talent': ['hiring', 'retention', 'culture', 'training', 'leadership'],
      'innovation': ['r&d', 'product development', 'differentiation', 'disruption'],
      'compliance': ['regulation', 'governance', 'risk', 'audit', 'security'],
      // Add more mappings as needed
    };
    
    return relatedMap[challenge.toLowerCase()] || [];
  }

  /**
   * Extended mapping for related goals
   */
  private static getRelatedGoals(goal: string): string[] {
    const relatedMap: Record<string, string[]> = {
      'increase revenue': ['grow sales', 'boost profitability', 'expand market', 'upsell', 'cross-sell'],
      'improve efficiency': ['optimize operations', 'reduce costs', 'streamline', 'automate', 'digitize'],
      'scale business': ['expand operations', 'grow team', 'increase capacity', 'enter new markets'],
      'enhance customer experience': ['improve satisfaction', 'reduce churn', 'increase nps', 'personalize'],
      'digital transformation': ['modernize', 'cloud migration', 'data analytics', 'ai adoption'],
      // Add more mappings as needed
    };
    
    return relatedMap[goal.toLowerCase()] || [];
  }

  // Additional helper methods for enhanced functionality
  private static categorizeIndustrySegment(context: ClientContext): string {
    // Implementation for industry segment categorization
    if (context.businessType === 'b2b' && context.industry === 'technology') {
      return 'B2B SaaS';
    }
    // Add more categorization logic
    return 'General Business';
  }

  private static assessIndustryMaturity(context: ClientContext): string {
    // Implementation for industry maturity assessment
    if (context.yearsInBusiness < 2) return 'startup';
    if (context.yearsInBusiness < 5) return 'growth-stage';
    if (context.yearsInBusiness < 10) return 'established';
    return 'mature';
  }

  private static identifyRegulations(context: ClientContext): string[] {
    // Implementation for regulatory identification
    const regulations: string[] = [];
    if (context.industry === 'finance') regulations.push('SOX', 'PCI-DSS');
    if (context.location?.includes('EU')) regulations.push('GDPR');
    if (context.industry === 'healthcare') regulations.push('HIPAA');
    return regulations;
  }

  private static categorizeChallenges(challenges: string[]): any {
    // Implementation for challenge categorization
    return {
      operational: challenges.filter(c => 
        ['efficiency', 'productivity', 'process'].some(keyword => 
          c.toLowerCase().includes(keyword)
        )
      ),
      financial: challenges.filter(c => 
        ['revenue', 'cost', 'cash', 'profit'].some(keyword => 
          c.toLowerCase().includes(keyword)
        )
      ),
      market: challenges.filter(c => 
        ['competition', 'market', 'customer', 'growth'].some(keyword => 
          c.toLowerCase().includes(keyword)
        )
      ),
      technical: challenges.filter(c => 
        ['technology', 'system', 'data', 'digital'].some(keyword => 
          c.toLowerCase().includes(keyword)
        )
      )
    };
  }

  private static calculateActionability(content: string): number {
    // Calculate how actionable the content is (0-1 scale)
    const actionableIndicators = [
      'step', 'implement', 'create', 'develop',
      'establish', 'measure', 'increase', 'reduce',
      'improve', 'optimize', 'strategy', 'tactic',
      'execute', 'deploy', 'launch', 'initiate'
    ];
    
    const words = content.toLowerCase().split(/\s+/);
    const actionableCount = words.filter(w => 
      actionableIndicators.includes(w)
    ).length;
    
    return Math.min(1, actionableCount / 10);
  }

  // Build enhanced query from signals
  private static buildEnhancedQuery(signals: EnhancedSignals, context: ClientContext): string {
    const parts = [];

    if (signals.industrySegment) {
      parts.push(`${signals.industrySegment} business`);
    }

    if (signals.growthStage) {
      parts.push(`at ${signals.growthStage} stage`);
    }

    if (signals.challengeTypes) {
      const allChallenges = [
        ...(signals.challengeTypes.operational || []),
        ...(signals.challengeTypes.financial || []),
        ...(signals.challengeTypes.market || []),
        ...(signals.challengeTypes.technical || [])
      ];
      if (allChallenges.length > 0) {
        parts.push(`facing ${allChallenges.join(', ')}`);
      }
    }

    if (signals.goalTimelines) {
      const immediateGoals = signals.goalTimelines.immediate || [];
      if (immediateGoals.length > 0) {
        parts.push(`urgently needs to ${immediateGoals.join(' and ')}`);
      }
    }

    return parts.join(' ') || 'business improvement strategies';
  }

  // Helper methods for categorization
  private static categorizeGoalsByTimeline(goals: string[]): any {
    return {
      immediate: goals.filter(g => 
        ['urgent', 'immediate', 'now', 'asap', 'critical'].some(keyword => 
          g.toLowerCase().includes(keyword)
        )
      ),
      shortTerm: goals.filter(g => 
        ['month', 'quarter', 'short-term', 'soon'].some(keyword => 
          g.toLowerCase().includes(keyword)
        )
      ),
      longTerm: goals.filter(g => 
        ['year', 'long-term', 'future', 'strategic'].some(keyword => 
          g.toLowerCase().includes(keyword)
        )
      )
    };
  }

  private static identifyBusinessModel(context: ClientContext): string {
    if (context.businessType === 'b2b' && context.revenue && context.revenue > 1000000) {
      return 'Enterprise B2B';
    }
    if (context.businessType === 'b2c' && context.industry === 'technology') {
      return 'Consumer Tech';
    }
    if (context.industry === 'accounting' || context.industry === 'consulting') {
      return 'Professional Services';
    }
    return context.businessType || 'General Business';
  }

  private static categorizeTeamSize(context: ClientContext): string {
    // This would need additional context data
    return 'Small-Medium Business';
  }

  private static identifyGrowthStage(context: ClientContext): string {
    if (context.businessStage) return context.businessStage;
    
    const revenue = context.revenue || 0;
    if (revenue < 100000) return 'pre-revenue';
    if (revenue < 1000000) return 'early-revenue';
    if (revenue < 10000000) return 'growth';
    return 'scale';
  }

  private static assessMarketPosition(context: ClientContext): string {
    // This would need additional market data
    return 'Challenger';
  }

  // Calculation helper methods
  private static calculateQualityScore(result: any, factors: any): number {
    const scores = {
      specificity: this.calculateSpecificity(result.content),
      actionability: this.calculateActionability(result.content),
      evidence: this.calculateEvidenceScore(result.content),
      recency: this.calculateRecencyScore(result.updated_at)
    };

    return Object.keys(factors).reduce((total, factor) => {
      return total + (scores[factor] * factors[factor]);
    }, 0);
  }

  private static calculateSpecificity(content: string): number {
    const genericTerms = ['business', 'company', 'organization', 'should', 'must'];
    const specificTerms = ['specifically', 'particularly', 'exactly', 'precisely'];
    
    const words = content.toLowerCase().split(/\s+/);
    const genericCount = words.filter(w => genericTerms.includes(w)).length;
    const specificCount = words.filter(w => specificTerms.includes(w)).length;
    
    return Math.min(1, specificCount / (genericCount + 1));
  }

  private static calculateEvidenceScore(content: string): number {
    const evidenceIndicators = [
      'study', 'research', 'data', 'survey', 'analysis',
      'report', 'finding', 'statistic', 'metric', 'benchmark',
      '%', 'percent', 'average', 'median'
    ];
    
    const hasEvidence = evidenceIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
    
    return hasEvidence ? 0.8 : 0.3;
  }

  private static calculateRecencyScore(updatedAt: string): number {
    const daysSince = this.getDaysSinceUpdate(updatedAt);
    if (daysSince < 30) return 1;
    if (daysSince < 90) return 0.8;
    if (daysSince < 180) return 0.6;
    if (daysSince < 365) return 0.4;
    return 0.2;
  }

  private static calculateDynamicRelevance(
    result: any,
    context: ClientContext,
    signals: EnhancedSignals
  ): number {
    let relevance = result.relevance_score || 0.5;

    // Boost for industry match
    if (result.content.toLowerCase().includes(context.industry?.toLowerCase() || '')) {
      relevance += 0.1;
    }

    // Boost for challenge match
    if (context.challenges?.some(c => result.content.toLowerCase().includes(c.toLowerCase()))) {
      relevance += 0.15;
    }

    // Boost for goal alignment
    if (context.goals?.some(g => result.content.toLowerCase().includes(g.toLowerCase()))) {
      relevance += 0.1;
    }

    // Boost for regulatory match
    if (signals.regulatoryEnvironment?.some(r => result.content.includes(r))) {
      relevance += 0.05;
    }

    return Math.min(1, relevance);
  }

  private static calculateDiversityScore(result: any, allResults: any[]): number {
    const similarResults = allResults.filter(r => 
      r.category === result.category && r.id !== result.id
    );
    
    return 1 - (similarResults.length / allResults.length);
  }

  private static getDaysSinceUpdate(updatedAt: string): number {
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private static isHighlySpecific(content: string, context: ClientContext): boolean {
    let specificityScore = 0;
    
    if (context.industry && content.includes(context.industry)) {
      specificityScore += 1;
    }
    
    if (context.challenges?.some(c => content.includes(c))) {
      specificityScore += 1;
    }
    
    if (context.goals?.some(g => content.includes(g))) {
      specificityScore += 1;
    }
    
    return specificityScore >= 2;
  }

  private static balanceTimeHorizons(results: any[]): any[] {
    // Implementation to balance short and long term results
    return results;
  }

  // Context building methods
  private static buildContextFromResponses(responses: any): ClientContext {
    return {
      industry: responses.industry,
      challenges: responses.challenges || [],
      goals: responses.goals || [],
      businessStage: responses.stage,
      revenue: responses.revenue,
      businessType: responses.businessType,
      yearsInBusiness: responses.yearsInBusiness,
      location: responses.location,
      urgency: responses.urgency
    };
  }

  private static buildContextFromAssessment(assessment: any): ClientContext {
    return {
      industry: assessment.industry,
      challenges: assessment.challenges || [],
      goals: assessment.goals || [],
      businessStage: assessment.businessStage,
      revenue: assessment.revenue,
      yearsInBusiness: assessment.yearsInBusiness,
      businessType: assessment.businessType,
      location: assessment.location
    };
  }

  private static buildContextFromProgress(progress: any): ClientContext {
    return {
      clientId: progress.clientId,
      industry: progress.industry,
      currentFocus: progress.currentTasks || []
    };
  }

  // Extraction methods for different enrichment types
  private static analyzeResponseGaps(responses: any, insights: any): any {
    return {
      alreadyAnswered: [],
      criticalGaps: [],
      questionsToRephrase: []
    };
  }

  private static generateIndustrySpecificPhrasing(industry: string | undefined, questions: any[]): any {
    return questions;
  }

  private static extractBenchmarks(insights: any, context: ClientContext): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('benchmark') || e.content.includes('average'))
      .map(e => ({
        metric: e.source,
        value: e.content,
        relevance: e.relevance
      }));
  }

  private static extractProvenApproaches(insights: any, context: ClientContext): any[] {
    return insights.enrichments
      .filter(e => e.actionability > 0.7)
      .map(e => ({
        approach: e.source,
        description: e.content,
        successRate: e.relevance
      }));
  }

  private static extractCommonPitfalls(insights: any, context: ClientContext): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('avoid') || e.content.includes('mistake'))
      .map(e => ({
        pitfall: e.source,
        description: e.content,
        severity: e.relevance
      }));
  }

  private static extractRelevantKPIs(insights: any, context: ClientContext): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('measure') || e.content.includes('metric'))
      .map(e => ({
        kpi: e.source,
        description: e.content,
        importance: e.relevance
      }));
  }

  private static extractImplementationGuides(insights: any, goals: any[]): any[] {
    return insights.enrichments
      .filter(e => e.actionability > 0.8)
      .map(e => ({
        guide: e.source,
        steps: e.content,
        complexity: e.relevance
      }));
  }

  private static extractRelevantResources(insights: any, goals: any[]): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('template') || e.content.includes('tool'))
      .map(e => ({
        resource: e.source,
        description: e.content,
        usefulness: e.relevance
      }));
  }

  private static extractSprintKPIs(insights: any, goals: any[]): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('sprint') || e.content.includes('milestone'))
      .map(e => ({
        kpi: e.source,
        target: e.content,
        priority: e.relevance
      }));
  }

  private static extractPrerequisites(insights: any, goals: any[]): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('before') || e.content.includes('prerequisite'))
      .map(e => ({
        prerequisite: e.source,
        description: e.content,
        criticality: e.relevance
      }));
  }

  private static extractPeerComparisons(insights: any, progress: any): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('peer') || e.content.includes('industry average'))
      .map(e => ({
        comparison: e.source,
        benchmark: e.content,
        position: e.relevance
      }));
  }

  private static extractAccelerators(insights: any, progress: any): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('accelerate') || e.content.includes('quick win'))
      .map(e => ({
        accelerator: e.source,
        description: e.content,
        impact: e.relevance
      }));
  }

  private static extractCourseCorrections(insights: any, progress: any): any[] {
    return insights.enrichments
      .filter(e => e.content.includes('adjust') || e.content.includes('pivot'))
      .map(e => ({
        correction: e.source,
        recommendation: e.content,
        urgency: e.relevance
      }));
  }

  private static extractNextActions(insights: any, progress: any): any[] {
    return insights.enrichments
      .filter(e => e.actionability > 0.7)
      .map(e => ({
        action: e.source,
        description: e.content,
        priority: e.relevance
      }));
  }

  // ... rest of existing methods ...
} 