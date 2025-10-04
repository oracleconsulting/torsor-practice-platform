import { ContextEnrichmentService } from './contextEnrichmentService';
import { ClientContext } from '@/types/context';
import { supabase } from '@/lib/supabase/client';

export class RoadmapService {
  static async generateRoadmap(clientId: string, assessmentData: any) {
    try {
      // 1. Build client context
      const context: ClientContext = {
        clientId,
        industry: assessmentData.industry,
        businessStage: assessmentData.businessStage,
        revenue: assessmentData.revenue,
        challenges: this.extractChallenges(assessmentData),
        goals: this.extractGoals(assessmentData),
        stage: 'roadmap'
      };

      // 2. Get contextual enrichment
      const enrichment = await ContextEnrichmentService.enrichContext(context);

      // 3. Build enhanced prompt with enriched context
      const prompt = this.buildRoadmapPrompt(assessmentData, enrichment);

      // 4. Generate roadmap
      const roadmap = await this.callLLM(prompt);

      // 5. Record successful enrichments
      if (enrichment.enrichments.length > 0) {
        await supabase.from('roadmap_enrichments').insert({
          client_id: clientId,
          enrichments_used: enrichment.enrichments,
          signals_matched: enrichment.signalsUsed
        });
      }

      return roadmap;
    } catch (error) {
      console.error('Roadmap generation failed:', error);
      // Fall back to basic generation without enrichment
      const basicPrompt = this.buildRoadmapPrompt(assessmentData);
      return this.callLLM(basicPrompt);
    }
  }

  private static buildRoadmapPrompt(assessmentData: any, enrichment?: any): string {
    let prompt = `Generate a strategic roadmap based on the following assessment data:
${JSON.stringify(assessmentData, null, 2)}`;

    // Add enriched context if available
    if (enrichment?.enrichments?.length > 0) {
      prompt += `\n\nConsider these relevant insights from our knowledge base:`;
      
      enrichment.enrichments.forEach((e: any) => {
        prompt += `\n\nInsight (${e.source}, relevance: ${e.relevance}):
${e.content}`;
      });

      prompt += `\n\nIncorporate these insights where they meaningfully enhance the roadmap, but maintain focus on the client's specific situation.`;
    }

    return prompt;
  }

  private static extractChallenges(assessmentData: any): string[] {
    const challenges = [];
    
    if (assessmentData.part2Answers) {
      if (assessmentData.part2Answers.growth_challenges) {
        challenges.push('growth');
      }
      if (assessmentData.part2Answers.efficiency_challenges) {
        challenges.push('efficiency');
      }
      if (assessmentData.part2Answers.revenue_challenges) {
        challenges.push('revenue');
      }
    }

    return challenges;
  }

  private static extractGoals(assessmentData: any): string[] {
    const goals = [];
    
    if (assessmentData.part2Answers) {
      if (assessmentData.part2Answers.revenue_goals) {
        goals.push('increase revenue');
      }
      if (assessmentData.part2Answers.efficiency_goals) {
        goals.push('improve efficiency');
      }
      if (assessmentData.part2Answers.growth_goals) {
        goals.push('scale business');
      }
    }

    return goals;
  }

  private static async callLLM(prompt: string) {
    // Your existing LLM call implementation
    return {};
  }

  static async enrichSprintTasks(sprintWeek: number, tasks: any[], clientContext: ClientContext) {
    try {
      // Get enrichment for sprint tasks
      const sprintGoals = tasks.map(t => t.title || t.description);
      const enrichment = await ContextEnrichmentService.enrichSprintTasks(
        sprintGoals,
        clientContext
      );

      // Enhance each task with relevant insights
      const enrichedTasks = tasks.map((task, index) => {
        const taskEnrichment = {
          ...task,
          implementation_guide: enrichment.implementationGuides?.[index],
          resources: enrichment.resources?.filter(r => 
            r.description.toLowerCase().includes(task.title?.toLowerCase() || '')
          ),
          kpis: enrichment.sprintKPIs?.filter(k => 
            k.kpi.toLowerCase().includes(task.title?.toLowerCase() || '')
          ),
          prerequisites: enrichment.prerequisites?.filter(p => 
            p.description.toLowerCase().includes(task.title?.toLowerCase() || '')
          )
        };

        return taskEnrichment;
      });

      return enrichedTasks;
    } catch (error) {
      console.error('Sprint task enrichment failed:', error);
      // Return original tasks if enrichment fails
      return tasks;
    }
  }

  static async generateEnrichedRoadmap(clientId: string, assessmentData: any) {
    try {
      // 1. Generate base roadmap with context enrichment
      const roadmap = await this.generateRoadmap(clientId, assessmentData);

      // 2. Build client context for sprint enrichment
      const context: ClientContext = {
        clientId,
        industry: assessmentData.industry,
        businessType: assessmentData.businessType,
        businessStage: assessmentData.businessStage,
        revenue: assessmentData.revenue,
        challenges: this.extractChallenges(assessmentData),
        goals: this.extractGoals(assessmentData),
        yearsInBusiness: assessmentData.yearsInBusiness,
        location: assessmentData.location,
        urgency: assessmentData.urgency || 'medium',
        stage: 'sprint'
      };

      // 3. Enrich sprint tasks if they exist
      if (roadmap.three_month_sprint?.weeks) {
        for (let i = 0; i < roadmap.three_month_sprint.weeks.length; i++) {
          const week = roadmap.three_month_sprint.weeks[i];
          if (week.tasks && week.tasks.length > 0) {
            week.tasks = await this.enrichSprintTasks(i + 1, week.tasks, context);
          }
        }
      }

      // 4. Record enriched roadmap
      await supabase.from('roadmap_enrichments').insert({
        client_id: clientId,
        roadmap_id: roadmap.id,
        enrichment_type: 'full',
        enrichments_applied: {
          context_enrichment: true,
          sprint_enrichment: true
        }
      });

      return roadmap;
    } catch (error) {
      console.error('Enriched roadmap generation failed:', error);
      // Fall back to basic generation
      return this.generateRoadmap(clientId, assessmentData);
    }
  }
} 