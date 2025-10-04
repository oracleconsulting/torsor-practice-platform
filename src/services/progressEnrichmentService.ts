import { ContextEnrichmentService } from './contextEnrichmentService';
import { ClientContext } from '@/types/context';
import { supabase } from '@/lib/supabase/client';

interface ProgressData {
  clientId: string;
  completedTasks: number;
  totalTasks: number;
  currentWeek: number;
  milestonesMet: string[];
  challengesFaced: string[];
  industry?: string;
  businessStage?: string;
}

export class ProgressEnrichmentService {
  /**
   * Enrich progress analysis with peer comparisons and recommendations
   */
  static async enrichProgressAnalysis(progressData: ProgressData) {
    try {
      // Build context from progress data
      const context: ClientContext = {
        clientId: progressData.clientId,
        industry: progressData.industry,
        businessStage: progressData.businessStage,
        stage: 'progress',
        currentFocus: progressData.challengesFaced
      };

      // Get enriched insights
      const enrichment = await ContextEnrichmentService.enrichProgressAnalysis(progressData);

      // Calculate progress score
      const progressScore = this.calculateProgressScore(progressData);

      // Generate enriched analysis
      const analysis = {
        progressScore,
        completionRate: (progressData.completedTasks / progressData.totalTasks) * 100,
        peerComparison: enrichment.peerComparison,
        accelerators: enrichment.accelerators,
        adjustments: enrichment.adjustments,
        nextActions: enrichment.nextActions,
        insights: this.generateProgressInsights(progressData, enrichment)
      };

      // Record analysis
      await this.recordProgressAnalysis(progressData.clientId, analysis);

      return analysis;
    } catch (error) {
      console.error('Progress enrichment failed:', error);
      // Return basic analysis
      return {
        progressScore: this.calculateProgressScore(progressData),
        completionRate: (progressData.completedTasks / progressData.totalTasks) * 100,
        insights: []
      };
    }
  }

  /**
   * Get real-time progress recommendations
   */
  static async getProgressRecommendations(clientId: string, currentWeek: number) {
    try {
      // Fetch current progress
      const { data: progress } = await supabase
        .from('sprint_progress')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (!progress) return null;

      // Build progress data
      const progressData: ProgressData = {
        clientId,
        completedTasks: progress.completed_tasks || 0,
        totalTasks: progress.total_tasks || 0,
        currentWeek,
        milestonesMet: progress.milestones_met || [],
        challengesFaced: progress.challenges_faced || [],
        industry: progress.industry,
        businessStage: progress.business_stage
      };

      // Get enriched analysis
      const analysis = await this.enrichProgressAnalysis(progressData);

      // Generate specific recommendations
      const recommendations = {
        immediate: analysis.nextActions?.slice(0, 2) || [],
        thisWeek: analysis.accelerators?.filter(a => a.impact > 0.7) || [],
        adjustments: analysis.adjustments?.filter(a => a.urgency > 0.8) || []
      };

      return recommendations;
    } catch (error) {
      console.error('Failed to get progress recommendations:', error);
      return null;
    }
  }

  /**
   * Calculate progress score based on multiple factors
   */
  private static calculateProgressScore(progressData: ProgressData): number {
    const completionWeight = 0.4;
    const paceWeight = 0.3;
    const milestoneWeight = 0.3;

    // Completion score
    const completionScore = (progressData.completedTasks / progressData.totalTasks) || 0;

    // Pace score (are they on track?)
    const expectedCompletion = (progressData.currentWeek / 12) * progressData.totalTasks;
    const paceScore = Math.min(1, progressData.completedTasks / expectedCompletion);

    // Milestone score
    const expectedMilestones = Math.floor(progressData.currentWeek / 4);
    const milestoneScore = Math.min(1, progressData.milestonesMet.length / expectedMilestones);

    // Calculate weighted score
    const score = (
      completionScore * completionWeight +
      paceScore * paceWeight +
      milestoneScore * milestoneWeight
    ) * 100;

    return Math.round(score);
  }

  /**
   * Generate contextual insights based on progress
   */
  private static generateProgressInsights(
    progressData: ProgressData, 
    enrichment: any
  ): string[] {
    const insights: string[] = [];

    // Pace insights
    const expectedCompletion = (progressData.currentWeek / 12) * progressData.totalTasks;
    if (progressData.completedTasks > expectedCompletion * 1.2) {
      insights.push("You're ahead of schedule! Consider tackling some advanced tasks.");
    } else if (progressData.completedTasks < expectedCompletion * 0.8) {
      insights.push("You're slightly behind pace. Focus on high-impact tasks this week.");
    }

    // Peer comparison insights
    if (enrichment.peerComparison?.length > 0) {
      const peerInsight = enrichment.peerComparison[0];
      insights.push(`${peerInsight.comparison}: ${peerInsight.benchmark}`);
    }

    // Challenge-based insights
    if (progressData.challengesFaced.length > 2) {
      insights.push("You've overcome multiple challenges. Your resilience is building momentum.");
    }

    return insights;
  }

  /**
   * Record progress analysis for future reference
   */
  private static async recordProgressAnalysis(clientId: string, analysis: any) {
    try {
      await supabase.from('progress_analysis').insert({
        client_id: clientId,
        analysis_date: new Date().toISOString(),
        progress_score: analysis.progressScore,
        completion_rate: analysis.completionRate,
        insights: analysis.insights,
        recommendations: {
          accelerators: analysis.accelerators,
          adjustments: analysis.adjustments
        }
      });
    } catch (error) {
      console.error('Failed to record progress analysis:', error);
    }
  }

  /**
   * Get progress trends over time
   */
  static async getProgressTrends(clientId: string, weeks: number = 4) {
    try {
      const { data: analyses } = await supabase
        .from('progress_analysis')
        .select('*')
        .eq('client_id', clientId)
        .order('analysis_date', { ascending: false })
        .limit(weeks);

      if (!analyses || analyses.length === 0) return null;

      // Calculate trends
      const trends = {
        scoreTrajectory: this.calculateTrajectory(analyses.map(a => a.progress_score)),
        completionTrend: this.calculateTrajectory(analyses.map(a => a.completion_rate)),
        momentum: this.calculateMomentum(analyses),
        projectedCompletion: this.projectCompletion(analyses)
      };

      return trends;
    } catch (error) {
      console.error('Failed to get progress trends:', error);
      return null;
    }
  }

  private static calculateTrajectory(values: number[]): 'improving' | 'steady' | 'declining' {
    if (values.length < 2) return 'steady';
    
    const recent = values.slice(0, Math.floor(values.length / 2));
    const older = values.slice(Math.floor(values.length / 2));
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    if (recentAvg > olderAvg * 1.1) return 'improving';
    if (recentAvg < olderAvg * 0.9) return 'declining';
    return 'steady';
  }

  private static calculateMomentum(analyses: any[]): number {
    if (analyses.length < 2) return 0;
    
    const recentScore = analyses[0].progress_score;
    const previousScore = analyses[1].progress_score;
    
    return ((recentScore - previousScore) / previousScore) * 100;
  }

  private static projectCompletion(analyses: any[]): number {
    if (analyses.length < 2) return 12;
    
    const currentRate = analyses[0].completion_rate;
    const rateChange = analyses[0].completion_rate - analyses[1].completion_rate;
    
    // Simple linear projection
    const weeksRemaining = (100 - currentRate) / (rateChange || 1);
    
    return Math.max(1, Math.min(12, Math.round(weeksRemaining)));
  }
} 