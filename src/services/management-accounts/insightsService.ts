// ============================================================================
// MA INSIGHTS SERVICE
// ============================================================================
// Service layer for Management Accounts insight operations
// ============================================================================

import { supabase } from '@/lib/supabase';
import type {
  MAMonthlyInsightsRow,
  MAFinancialSnapshotRow,
  MAEngagementRow,
  MAInsightFeedback,
  GenerateMAInsightsRequest,
  GenerateMAInsightsResponse,
} from '@/types/management-accounts';

export const maInsightsService = {
  // ============================================================================
  // INSIGHT GENERATION
  // ============================================================================

  /**
   * Generate insights for a snapshot
   */
  async generateInsights(request: GenerateMAInsightsRequest): Promise<GenerateMAInsightsResponse> {
    const { data, error } = await supabase.functions.invoke('generate-ma-insights', {
      body: request,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  },

  // ============================================================================
  // INSIGHT RETRIEVAL
  // ============================================================================

  /**
   * Get insight by ID
   */
  async getInsight(insightId: string): Promise<MAMonthlyInsightsRow | null> {
    const { data, error } = await supabase
      .from('ma_monthly_insights')
      .select('*')
      .eq('id', insightId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get insight with full context (snapshot, engagement, client)
   */
  async getInsightWithContext(insightId: string): Promise<any> {
    const { data, error } = await supabase
      .from('ma_monthly_insights')
      .select(`
        *,
        ma_financial_snapshots (
          *,
          ma_engagements (
            *,
            practice_members!ma_engagements_client_id_fkey (
              name,
              client_company
            )
          )
        )
      `)
      .eq('id', insightId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get insights for an engagement
   */
  async getInsightsForEngagement(engagementId: string): Promise<MAMonthlyInsightsRow[]> {
    const { data, error } = await supabase
      .from('ma_monthly_insights')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('period_end_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get insights for a practice with optional status filter
   */
  async getInsightsForPractice(
    practiceId: string,
    options: {
      status?: string;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    let query = supabase
      .from('ma_monthly_insights')
      .select(`
        id,
        period_end_date,
        headline_text,
        headline_sentiment,
        status,
        created_at,
        approved_at,
        shared_at,
        ma_engagements!inner (
          client_id,
          practice_id,
          practice_members!ma_engagements_client_id_fkey (
            name,
            client_company
          )
        )
      `)
      .eq('ma_engagements.practice_id', practiceId)
      .order('period_end_date', { ascending: false });

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // ============================================================================
  // WORKFLOW OPERATIONS
  // ============================================================================

  /**
   * Approve insight
   */
  async approveInsight(insightId: string, notes?: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('ma_monthly_insights')
      .update({
        status: 'approved',
        approved_by: userData.user?.id,
        approved_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('id', insightId);

    if (error) throw error;
  },

  /**
   * Reject insight
   */
  async rejectInsight(insightId: string, notes?: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('ma_monthly_insights')
      .update({
        status: 'rejected',
        reviewed_by: userData.user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes || null,
      })
      .eq('id', insightId);

    if (error) throw error;
  },

  /**
   * Share insight with client
   */
  async shareWithClient(insightId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('ma_monthly_insights')
      .update({
        status: 'shared',
        shared_with_client: true,
        shared_at: new Date().toISOString(),
        shared_by: userData.user?.id,
      })
      .eq('id', insightId);

    if (error) throw error;

    // TODO: Send email notification to client
  },

  /**
   * Update insight content (for editing before approval)
   */
  async updateInsight(
    insightId: string,
    updates: {
      headlineText?: string;
      headlineSentiment?: string;
      insights?: any[];
      decisionsEnabled?: any[];
      watchList?: any[];
      northStarConnection?: string;
    }
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('ma_monthly_insights')
      .update({
        headline_text: updates.headlineText,
        headline_sentiment: updates.headlineSentiment,
        insights: updates.insights,
        decisions_enabled: updates.decisionsEnabled,
        watch_list: updates.watchList,
        north_star_connection: updates.northStarConnection,
        reviewed_by: userData.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', insightId);

    if (error) throw error;
  },

  // ============================================================================
  // FEEDBACK
  // ============================================================================

  /**
   * Submit feedback on an insight
   */
  async submitFeedback(
    insightId: string,
    feedback: {
      feedbackSource?: 'practice_team' | 'client';
      headlineAccuracy?: number;
      insightRelevance?: number;
      actionUsefulness?: number;
      northStarConnectionQuality?: number;
      overallRating?: number;
      whatWasValuable?: string;
      whatWasMissing?: string;
      whatWasWrong?: string;
      suggestedImprovements?: string;
      editsMade?: Record<string, any>;
    }
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from('ma_insight_feedback').insert({
      insight_id: insightId,
      feedback_source: feedback.feedbackSource || 'practice_team',
      feedback_by: userData.user?.id,
      headline_accuracy: feedback.headlineAccuracy,
      insight_relevance: feedback.insightRelevance,
      action_usefulness: feedback.actionUsefulness,
      north_star_connection_quality: feedback.northStarConnectionQuality,
      overall_rating: feedback.overallRating,
      what_was_valuable: feedback.whatWasValuable,
      what_was_missing: feedback.whatWasMissing,
      what_was_wrong: feedback.whatWasWrong,
      suggested_improvements: feedback.suggestedImprovements,
      edits_made: feedback.editsMade,
    });

    if (error) throw error;
  },

  /**
   * Get feedback for an insight
   */
  async getFeedbackForInsight(insightId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ma_insight_feedback')
      .select('*')
      .eq('insight_id', insightId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ============================================================================
  // ENGAGEMENT OPERATIONS
  // ============================================================================

  /**
   * Create a new MA engagement
   */
  async createEngagement(engagement: {
    clientId: string;
    practiceId: string;
    tier?: 'bronze' | 'silver' | 'gold';
    frequency?: 'monthly' | 'quarterly';
    monthlyFee?: number;
    settings?: any;
  }): Promise<MAEngagementRow> {
    const { data, error } = await supabase
      .from('ma_engagements')
      .insert({
        client_id: engagement.clientId,
        practice_id: engagement.practiceId,
        tier: engagement.tier || 'silver',
        frequency: engagement.frequency || 'monthly',
        monthly_fee: engagement.monthlyFee,
        settings: engagement.settings || {
          kpiFocusAreas: [],
          customMetrics: [],
          reportRecipients: [],
          autoGenerateInsights: true,
          includeBenchmarks: true,
        },
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get engagements for a practice
   */
  async getEngagementsForPractice(practiceId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('ma_engagements')
      .select(`
        *,
        practice_members!ma_engagements_client_id_fkey (
          name,
          client_company
        )
      `)
      .eq('practice_id', practiceId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ============================================================================
  // SNAPSHOT OPERATIONS
  // ============================================================================

  /**
   * Create a financial snapshot
   */
  async createSnapshot(snapshot: Partial<MAFinancialSnapshotRow>): Promise<MAFinancialSnapshotRow> {
    const { data, error } = await supabase
      .from('ma_financial_snapshots')
      .insert(snapshot)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get snapshots for an engagement
   */
  async getSnapshotsForEngagement(engagementId: string): Promise<MAFinancialSnapshotRow[]> {
    const { data, error } = await supabase
      .from('ma_financial_snapshots')
      .select('*')
      .eq('engagement_id', engagementId)
      .order('period_end_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // ============================================================================
  // BENCHMARK OPERATIONS
  // ============================================================================

  /**
   * Get benchmark for an industry/revenue band
   */
  async getBenchmark(
    industryCode: string,
    revenueBand: string,
    practiceId?: string
  ): Promise<any | null> {
    const currentYear = new Date().getFullYear();

    let query = supabase
      .from('ma_industry_benchmarks')
      .select('*')
      .eq('industry_code', industryCode)
      .eq('revenue_band', revenueBand)
      .gte('period_year', currentYear - 2)
      .order('period_year', { ascending: false })
      .limit(1);

    // Check practice-specific first, then global
    if (practiceId) {
      const { data: practiceData } = await query.eq('practice_id', practiceId).maybeSingle();
      if (practiceData) return practiceData;
    }

    const { data: globalData } = await query.is('practice_id', null).maybeSingle();
    return globalData;
  },

  /**
   * Create or update a benchmark
   */
  async upsertBenchmark(benchmark: any): Promise<any> {
    const { data, error } = await supabase
      .from('ma_industry_benchmarks')
      .upsert(benchmark, {
        onConflict: 'industry_code,revenue_band,period_year',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get insight statistics for a practice
   */
  async getInsightStats(practiceId: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    shared: number;
    avgGenerationTime: number;
    avgCost: number;
  }> {
    const { data, error } = await supabase
      .from('ma_monthly_insights')
      .select(`
        status,
        generation_time_ms,
        llm_cost,
        ma_engagements!inner (practice_id)
      `)
      .eq('ma_engagements.practice_id', practiceId);

    if (error) throw error;

    const insights = data || [];
    const total = insights.length;
    const pending = insights.filter((i) => i.status === 'generated').length;
    const approved = insights.filter((i) => i.status === 'approved').length;
    const shared = insights.filter((i) => i.status === 'shared').length;

    const timesWithValue = insights
      .map((i) => i.generation_time_ms)
      .filter((t): t is number => t !== null);
    const costsWithValue = insights
      .map((i) => i.llm_cost)
      .filter((c): c is number => c !== null);

    const avgGenerationTime =
      timesWithValue.length > 0
        ? timesWithValue.reduce((a, b) => a + b, 0) / timesWithValue.length
        : 0;

    const avgCost =
      costsWithValue.length > 0
        ? costsWithValue.reduce((a, b) => a + b, 0) / costsWithValue.length
        : 0;

    return {
      total,
      pending,
      approved,
      shared,
      avgGenerationTime,
      avgCost,
    };
  },
};

