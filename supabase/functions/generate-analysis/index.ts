// ============================================================================
// EDGE FUNCTION: Generate Complete Analysis
// ============================================================================
// Master orchestrator that:
// 1. Fetches all 3 assessment parts
// 2. Runs rule-based Value Analysis (deterministic scoring)
// 3. Generates LLM-powered Roadmap & Insights
// 4. Stores results in database

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// VALUE ANALYZER (Rule-Based - No LLM Cost)
// ============================================================================

interface AssetScore {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  issues: string[];
  opportunities: string[];
  financialImpact: number;
}

function calculateAssetScores(r: Record<string, any>): AssetScore[] {
  const scores: AssetScore[] = [];
  
  // Intellectual Capital
  let icScore = 50;
  const icIssues: string[] = [];
  const icOpps: string[] = [];
  const undocumented = r.critical_processes_undocumented || [];
  if (undocumented.length > 4) {
    icIssues.push(`${undocumented.length} critical processes undocumented`);
    icScore -= undocumented.length * 5;
  }
  const dependency = parseInt(r.knowledge_dependency_percentage) || 0;
  if (dependency > 67) {
    icIssues.push(`${dependency}% knowledge dependency on founder`);
    icScore -= 20;
  }
  scores.push({
    category: 'Intellectual Capital',
    score: Math.max(0, Math.min(100, icScore)),
    maxScore: 100,
    percentage: Math.max(0, Math.min(100, icScore)),
    issues: icIssues,
    opportunities: icOpps,
    financialImpact: undocumented.length * 50000
  });
  
  // Brand & Trust
  let btScore = 50;
  const btIssues: string[] = [];
  const personalBrand = parseInt(r.personal_brand_percentage) || 0;
  if (personalBrand > 60) {
    btIssues.push(`${personalBrand}% buy from you personally`);
    btScore -= 25;
  }
  scores.push({
    category: 'Brand & Trust',
    score: Math.max(0, Math.min(100, btScore)),
    maxScore: 100,
    percentage: Math.max(0, Math.min(100, btScore)),
    issues: btIssues,
    opportunities: [],
    financialImpact: 0
  });
  
  // Market Position
  let mpScore = 50;
  const mpIssues: string[] = [];
  const concentration = parseInt(r.top3_customer_revenue_percentage) || 0;
  if (concentration > 50) {
    mpIssues.push(`${concentration}% revenue from top 3 customers`);
    mpScore -= 20;
  }
  scores.push({
    category: 'Market Position',
    score: Math.max(0, Math.min(100, mpScore)),
    maxScore: 100,
    percentage: Math.max(0, Math.min(100, mpScore)),
    issues: mpIssues,
    opportunities: [],
    financialImpact: 0
  });
  
  // Systems & Scale
  let ssScore = 50;
  const ssIssues: string[] = [];
  let failedProcesses = 0;
  ['autonomy_sales', 'autonomy_delivery', 'autonomy_finance'].forEach(f => {
    if (r[f] === 'Would fail') failedProcesses++;
  });
  if (failedProcesses > 1) {
    ssIssues.push(`${failedProcesses} processes would fail without you`);
    ssScore -= failedProcesses * 12;
  }
  scores.push({
    category: 'Systems & Scale',
    score: Math.max(0, Math.min(100, ssScore)),
    maxScore: 100,
    percentage: Math.max(0, Math.min(100, ssScore)),
    issues: ssIssues,
    opportunities: [],
    financialImpact: failedProcesses * 25000
  });
  
  // People & Culture
  let pcScore = 50;
  const pcIssues: string[] = [];
  let noSuccession = 0;
  ['succession_your_role', 'succession_operations', 'succession_sales'].forEach(f => {
    if (r[f] === 'Nobody') noSuccession++;
  });
  if (noSuccession > 1) {
    pcIssues.push(`${noSuccession} roles have no succession plan`);
    pcScore -= noSuccession * 10;
  }
  scores.push({
    category: 'People & Culture',
    score: Math.max(0, Math.min(100, pcScore)),
    maxScore: 100,
    percentage: Math.max(0, Math.min(100, pcScore)),
    issues: pcIssues,
    opportunities: [],
    financialImpact: noSuccession * 15000
  });
  
  // Financial & Exit
  let feScore = 50;
  const feIssues: string[] = [];
  if (r.know_business_worth === 'No idea at all') {
    feIssues.push('Unknown business value');
    feScore -= 10;
  }
  scores.push({
    category: 'Financial & Exit',
    score: Math.max(0, Math.min(100, feScore)),
    maxScore: 100,
    percentage: Math.max(0, Math.min(100, feScore)),
    issues: feIssues,
    opportunities: [],
    financialImpact: 0
  });
  
  return scores;
}

function identifyRisks(r: Record<string, any>): any[] {
  const risks: any[] = [];
  
  const concentration = parseInt(r.top3_customer_revenue_percentage) || 0;
  if (concentration > 50) {
    risks.push({
      title: 'Customer Concentration',
      severity: concentration > 70 ? 'Critical' : 'High',
      impact: `${concentration}% revenue from top 3 customers`,
      mitigation: 'Diversify customer base'
    });
  }
  
  const dependency = parseInt(r.knowledge_dependency_percentage) || 0;
  if (dependency > 80) {
    risks.push({
      title: 'Knowledge Concentration',
      severity: 'Critical',
      impact: `${dependency}% knowledge inaccessible without founder`,
      mitigation: 'Document critical processes'
    });
  }
  
  return risks;
}

function identifyGaps(r: Record<string, any>): any[] {
  const gaps: any[] = [];
  
  const undocumented = r.critical_processes_undocumented || [];
  if (undocumented.length > 0) {
    gaps.push({
      area: 'Process Documentation',
      gap: undocumented.length * 50000,
      effort: 'Medium',
      actions: [`Document "${undocumented[0]}" first`]
    });
  }
  
  const hiddenSignals = r.hidden_trust_signals || [];
  if (hiddenSignals.length > 0) {
    gaps.push({
      area: 'Trust Signals',
      gap: hiddenSignals.length * 12000,
      effort: 'Low',
      actions: ['Display trust badges prominently']
    });
  }
  
  return gaps;
}

// ============================================================================
// ROADMAP PROMPT
// ============================================================================

const ROADMAP_PROMPT = `You are an expert business strategist creating a 13-week transformation roadmap.

## Client Context
{context}

## Assessment Summary
Part 1 (Life Design): {part1Summary}
Part 2 (Business Deep Dive): {part2Summary}
Part 3 (Hidden Value): {part3Summary}

## Value Analysis
Score: {overallScore}/100
Key Risks: {risks}
Top Opportunities: {opportunities}

## Output Format (JSON only, no markdown)
{
  "summary": {
    "headline": "string",
    "keyInsight": "string",
    "expectedOutcome": "string"
  },
  "priorities": [
    {"rank": 1, "title": "string", "description": "string", "category": "string"}
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "string",
      "focus": "string",
      "tasks": [
        {"id": "w1-t1", "title": "string", "description": "string", "category": "string", "priority": "high", "estimatedHours": 2}
      ],
      "milestone": "string"
    }
  ],
  "successMetrics": [{"metric": "string", "baseline": "string", "target": "string"}]
}`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clientId, practiceId, regenerate } = await req.json();

    if (!clientId || !practiceId) {
      return new Response(
        JSON.stringify({ error: 'Missing clientId or practiceId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting analysis for client ${clientId}...`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch assessments
    const { data: assessments, error: fetchError } = await supabase
      .from('client_assessments')
      .select('assessment_type, responses, status')
      .eq('client_id', clientId);

    if (fetchError) throw new Error(`Failed to fetch assessments: ${fetchError.message}`);

    const part1 = assessments?.find(a => a.assessment_type === 'part1')?.responses || {};
    const part2 = assessments?.find(a => a.assessment_type === 'part2')?.responses || {};
    const part3 = assessments?.find(a => a.assessment_type === 'part3')?.responses || {};

    // Rule-based analysis (free)
    console.log('Running value analysis...');
    const assetScores = calculateAssetScores(part3);
    const riskRegister = identifyRisks(part3);
    const valueGaps = identifyGaps(part3);
    const overallScore = Math.round(assetScores.reduce((sum, s) => sum + s.percentage, 0) / assetScores.length);

    const valueAnalysis = {
      assetScores,
      riskRegister,
      valueGaps,
      overallScore,
      totalOpportunity: valueGaps.reduce((sum, g) => sum + g.gap, 0),
      generatedAt: new Date().toISOString()
    };

    // LLM roadmap generation
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const prompt = ROADMAP_PROMPT
      .replace('{context}', JSON.stringify({
        name: part1.full_name || 'Owner',
        company: part1.company_name || part2.trading_name || 'Business',
        commitment: part1.commitment_hours || '10-15 hours'
      }))
      .replace('{part1Summary}', JSON.stringify({ sacrifices: part1.sacrifices, desiredIncome: part1.desired_income }))
      .replace('{part2Summary}', JSON.stringify({ teamSize: part2.team_size, turnover: part2.annual_turnover, priorities: part2.ninety_day_priorities }))
      .replace('{part3Summary}', JSON.stringify({ undocumented: part3.critical_processes_undocumented?.length, dependency: part3.knowledge_dependency_percentage }))
      .replace('{overallScore}', String(overallScore))
      .replace('{risks}', JSON.stringify(riskRegister.slice(0, 3).map(r => r.title)))
      .replace('{opportunities}', JSON.stringify(valueGaps.slice(0, 3).map(g => g.area)));

    console.log('Generating roadmap...');
    const startTime = Date.now();

    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co',
        'X-Title': 'Torsor 365'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      throw new Error(`OpenRouter error: ${errorText}`);
    }

    const llmData = await llmResponse.json();
    const duration = Date.now() - startTime;
    const roadmapData = JSON.parse(llmData.choices[0].message.content);
    const usage = llmData.usage || {};
    const cost = ((usage.prompt_tokens || 0) * 0.000003) + ((usage.completion_tokens || 0) * 0.000015);

    console.log(`Roadmap generated in ${duration}ms. Cost: $${cost.toFixed(4)}`);

    // Deactivate existing roadmaps
    await supabase.from('client_roadmaps').update({ is_active: false }).eq('client_id', clientId);

    // Save new roadmap
    const { data: savedRoadmap, error: saveError } = await supabase
      .from('client_roadmaps')
      .insert({
        practice_id: practiceId,
        client_id: clientId,
        roadmap_data: roadmapData,
        value_analysis: valueAnalysis,
        llm_model_used: 'anthropic/claude-sonnet-4-20250514',
        prompt_version: '2.0.0',
        generation_cost: cost,
        generation_duration_ms: duration,
        is_active: true
      })
      .select()
      .single();

    if (saveError) throw new Error(`Failed to save: ${saveError.message}`);

    // Create tasks
    if (savedRoadmap && roadmapData.weeks) {
      const tasks = roadmapData.weeks.flatMap((week: any) => 
        (week.tasks || []).map((task: any, i: number) => ({
          practice_id: practiceId,
          client_id: clientId,
          roadmap_id: savedRoadmap.id,
          week_number: week.weekNumber,
          title: task.title,
          description: task.description,
          category: task.category || 'General',
          priority: task.priority || 'medium',
          sort_order: i,
          status: 'pending'
        }))
      );
      if (tasks.length > 0) await supabase.from('client_tasks').insert(tasks);
    }

    // Log usage
    await supabase.from('llm_usage_log').insert({
      practice_id: practiceId,
      client_id: clientId,
      task_type: 'complete_analysis',
      model_used: 'anthropic/claude-sonnet-4-20250514',
      tokens_input: usage.prompt_tokens || 0,
      tokens_output: usage.completion_tokens || 0,
      cost_usd: cost,
      duration_ms: duration,
      success: true
    });

    // Update client status
    await supabase
      .from('practice_members')
      .update({ program_status: 'roadmap_generated', updated_at: new Date().toISOString() })
      .eq('id', clientId);

    return new Response(
      JSON.stringify({
        success: true,
        roadmapId: savedRoadmap.id,
        valueAnalysis: { overallScore, totalOpportunity: valueAnalysis.totalOpportunity },
        roadmap: {
          summary: roadmapData.summary,
          weekCount: roadmapData.weeks?.length || 0,
          taskCount: roadmapData.weeks?.reduce((sum: number, w: any) => sum + (w.tasks?.length || 0), 0) || 0
        },
        usage: { model: 'claude-sonnet-4', cost, durationMs: duration }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

