import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportContext {
  engagement: any;
  discovery: any;
  systems: any[];
  deepDives: any[];
  companyName: string;
  northStar?: string;
  growthMultiplier: number;
  totalHoursWasted: number;
  annualCostOfChaos: number;
  projectedCostAtScale: number;
}

function buildPrompt(context: ReportContext): string {
  const systemsSummary = context.systems.map(s => 
    `- ${s.system_name} (${s.category_code}): ${s.criticality}, Satisfaction: ${s.user_satisfaction}/5, Data Quality: ${s.data_quality_score}/5${s.manual_hours_monthly ? `, Manual hours: ${s.manual_hours_monthly}/mo` : ''}`
  ).join('\n');
  
  const deepDivePains = context.deepDives
    .flatMap(dd => dd.key_pain_points || [])
    .filter(Boolean)
    .join('\n- ');
  
  return `
You are a senior systems consultant preparing a Systems Audit report for ${context.companyName}.
Your job is to quantify the cost of operational chaos and show the path to freedom.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL INSTRUCTIONS
═══════════════════════════════════════════════════════════════════════════════

1. QUANTIFY EVERYTHING - hours wasted, annual cost, scaling impact
2. USE THEIR EXACT WORDS from the assessment
3. CONNECT TO THEIR LIFE GOAL - this isn't just efficiency, it's freedom
4. BE SPECIFIC - no vague statements
5. QUICK WINS FIRST - show immediate value before big investments
6. HONEST ABOUT SEVERITY - don't sugar-coat critical issues

BANNED PHRASES:
- "Streamline your operations" (vague)
- "Leverage technology" (corporate speak)
- "Best practices" (meaningless)
- "Digital transformation" (buzzword)
- "Optimize your workflow" (generic)
- "I want to be direct with you" (AI pattern)
- "Here's the truth" (AI pattern)
- "Let me be honest" (AI pattern)

═══════════════════════════════════════════════════════════════════════════════
CLIENT CONTEXT
═══════════════════════════════════════════════════════════════════════════════

Company: ${context.companyName}
Industry: ${context.discovery.industry_sector || 'Not specified'}
Team Size: ${context.discovery.team_size || 'N/A'} → ${context.discovery.expected_team_size_12mo || 'N/A'} (12mo)
Growth Multiplier: ${context.growthMultiplier}x
Revenue Band: ${context.discovery.revenue_band || 'Not specified'}

${context.northStar ? `NORTH STAR: "${context.northStar}"` : ''}

═══════════════════════════════════════════════════════════════════════════════
STAGE 1: DISCOVERY RESPONSES (use their exact words)
═══════════════════════════════════════════════════════════════════════════════

WHAT BROKE / BREAKING POINT:
"${context.discovery.systems_breaking_point || 'Not provided'}"

OPERATIONS SELF-DIAGNOSIS:
${context.discovery.operations_self_diagnosis || 'Not provided'}

MONTH-END SHAME:
"${context.discovery.month_end_shame || 'Not provided'}"

MANUAL HOURS MONTHLY: ${context.discovery.manual_hours_monthly || 'N/A'}
MONTH-END CLOSE: ${context.discovery.month_end_close_duration || 'N/A'}
DATA ERROR FREQUENCY: ${context.discovery.data_error_frequency || 'N/A'}
INFORMATION ACCESS: ${context.discovery.information_access_frequency || 'N/A'}

MOST EXPENSIVE SYSTEMS MISTAKE:
"${context.discovery.expensive_systems_mistake || 'Not provided'}"

INTEGRATION RATING: ${context.discovery.integration_rating || 'N/A'}
CRITICAL SPREADSHEETS: ${context.discovery.critical_spreadsheets || 'N/A'}

BROKEN AREAS (Top 3):
${(context.discovery.broken_areas || []).map((a: string) => `- ${a}`).join('\n')}

MAGIC PROCESS FIX:
"${context.discovery.magic_process_fix || 'Not provided'}"

CHANGE APPETITE: ${context.discovery.change_appetite || 'N/A'}
SYSTEMS FEARS: ${(context.discovery.systems_fears || []).join(', ')}
INTERNAL CHAMPION: ${context.discovery.internal_champion || 'N/A'}

═══════════════════════════════════════════════════════════════════════════════
STAGE 2: SYSTEM INVENTORY (${context.systems.length} systems)
═══════════════════════════════════════════════════════════════════════════════

${systemsSummary}

TOTAL MONTHLY SYSTEM COST: £${context.systems.reduce((sum, s) => sum + (s.monthly_cost || 0), 0).toFixed(2)}
SYSTEMS WITH MANUAL TRANSFER: ${context.systems.filter(s => s.manual_transfer_required).length}
TOTAL MANUAL HOURS FROM SYSTEMS: ${context.systems.reduce((sum, s) => sum + (s.manual_hours_monthly || 0), 0)}/month
CRITICAL SYSTEMS: ${context.systems.filter(s => s.criticality === 'critical').length}
SYSTEMS PLANNED FOR REPLACEMENT: ${context.systems.filter(s => s.future_plan === 'replace').length}

═══════════════════════════════════════════════════════════════════════════════
STAGE 3: PROCESS DEEP DIVE PAIN POINTS
═══════════════════════════════════════════════════════════════════════════════

${deepDivePains ? `- ${deepDivePains}` : 'No deep dives completed'}

═══════════════════════════════════════════════════════════════════════════════
CALCULATED COST OF CHAOS
═══════════════════════════════════════════════════════════════════════════════

Hours Wasted Weekly: ${context.totalHoursWasted}
Annual Cost of Chaos: £${context.annualCostOfChaos.toLocaleString()}
Projected at ${context.growthMultiplier}x Scale: £${context.projectedCostAtScale.toLocaleString()}

═══════════════════════════════════════════════════════════════════════════════
OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

Return a JSON object with this exact structure:

{
  "executiveSummary": {
    "headline": "Under 25 words, includes specific number, quotable",
    "narrative": "2-3 paragraphs, uses their words, honest assessment",
    "sentiment": "strong_foundation|good_with_gaps|significant_issues|critical_attention"
  },
  
  "costOfChaos": {
    "totalHoursWastedWeekly": number,
    "annualCost": number,
    "projectedCostAtScale": number,
    "scaleFactor": number,
    "narrative": "Uses their 'breaks at scale' or month-end shame words"
  },
  
  "scores": {
    "integration": { "score": 0-100, "label": "Seamless|Connected|Partial|Minimal|Disconnected", "finding": "One sentence" },
    "automation": { "score": 0-100, "label": "Highly Automated|Mostly Automated|Some Automation|Manual Heavy|Manual", "finding": "One sentence" },
    "dataAccessibility": { "score": 0-100, "label": "Instant|Minutes|Hours|Days|Unreliable", "finding": "One sentence" },
    "scalability": { "score": 0-100, "label": "Ready to Scale|Minor Adjustments|Significant Work|Major Overhaul|Will Break", "finding": "One sentence" }
  },
  
  "keyFindings": [
    {
      "severity": "critical|high|medium|low",
      "category": "integration_gap|manual_process|data_silo|single_point_failure|scalability_risk|compliance_risk|cost_inefficiency",
      "title": "Clear, specific title",
      "description": "What and why - be specific",
      "evidence": ["Data point 1", "Data point 2"],
      "clientQuote": "Their exact words that relate to this",
      "hoursWastedWeekly": number,
      "annualCostImpact": number,
      "scalabilityImpact": "What happens at 2x, 5x scale",
      "recommendation": "What to do about it"
    }
  ],
  
  "quickWins": [
    {
      "title": "Action title",
      "action": "Specific steps - be concrete",
      "timeToImplement": "e.g., '2-4 hours'",
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "impact": "What changes - be specific"
    }
  ],
  
  "recommendations": [
    {
      "priorityRank": 1,
      "title": "Clear recommendation",
      "description": "What to do and why",
      "category": "quick_win|foundation|strategic|optimization",
      "implementationPhase": "immediate|short_term|medium_term|long_term",
      "estimatedCost": number,
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "paybackMonths": number,
      "freedomUnlocked": "Connects to their life/business goal"
    }
  ],
  
  "investmentSummary": {
    "totalRecommendedInvestment": number,
    "totalAnnualBenefit": number,
    "overallPaybackMonths": number,
    "hoursReclaimableWeekly": number,
    "roi": "X:1 ratio"
  },
  
  "timeFreedom": {
    "hoursReclaimableWeekly": number,
    "narrative": "Uses their magic_process_fix or north star words",
    "whatThisEnables": ["Thing 1", "Thing 2", "Thing 3"]
  },
  
  "clientQuotesUsed": ["Quote 1", "Quote 2", "Quote 3", "Quote 4"]
}

QUALITY RULES:
- Maximum 5 key findings (focus on most impactful)
- Maximum 3 quick wins (implementable in under 1 week each)
- Maximum 5 recommendations
- Headline under 25 words with specific number
- Use at least 4 client quotes throughout
- Every finding must have hours + annual cost calculated
- Recommendations must have concrete payback periods

Return ONLY valid JSON. No markdown, no explanation, just the JSON object.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[SA Report] Fetching data for engagement:', engagementId);
    
    // Fetch all data
    const [
      { data: engagement, error: engagementError },
      { data: discovery, error: discoveryError },
      { data: systems, error: systemsError },
      { data: deepDives, error: deepDivesError }
    ] = await Promise.all([
      supabaseClient.from('sa_engagements').select('*').eq('id', engagementId).single(),
      supabaseClient.from('sa_discovery_responses').select('*').eq('engagement_id', engagementId).single(),
      supabaseClient.from('sa_system_inventory').select('*').eq('engagement_id', engagementId),
      supabaseClient.from('sa_process_deep_dives').select('*').eq('engagement_id', engagementId)
    ]);
    
    // Fetch client and north star separately
    let clientName = 'the business';
    let northStar: string | undefined;
    
    if (engagement?.client_id) {
      const { data: client } = await supabaseClient
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      
      clientName = client?.client_company || client?.company || client?.name || 'the business';
      
      // Get north star from roadmap
      const { data: roadmap } = await supabaseClient
        .from('client_roadmaps')
        .select('roadmap_data')
        .eq('client_id', engagement.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (roadmap?.roadmap_data?.northStar) {
        northStar = roadmap.roadmap_data.northStar;
      } else if (roadmap?.roadmap_data?.vision?.northStar) {
        northStar = roadmap.roadmap_data.vision.northStar;
      }
    }
    
    if (engagementError) {
      console.error('[SA Report] Engagement error:', engagementError);
      throw new Error(`Failed to fetch engagement: ${engagementError.message}`);
    }
    
    if (discoveryError) {
      console.error('[SA Report] Discovery error:', discoveryError);
      throw new Error(`Failed to fetch discovery: ${discoveryError.message}`);
    }
    
    if (!engagement || !discovery) {
      throw new Error('Engagement or discovery data not found');
    }
    
    if (systemsError) console.error('[SA Report] Systems error:', systemsError);
    if (deepDivesError) console.error('[SA Report] Deep dives error:', deepDivesError);
    
    // Calculate metrics
    const hourlyRate = 35;
    const weeksPerYear = 52;
    
    // Estimate hours from discovery responses
    const manualHoursMap: Record<string, number> = {
      'under_10': 2.5,
      '10_20': 15,
      '20_40': 30,
      '40_80': 60,
      'over_80': 100
    };
    
    const baseHoursMonthly = manualHoursMap[discovery.manual_hours_monthly] || 30;
    const systemManualHours = (systems || []).reduce((sum: number, s: any) => sum + (s.manual_hours_monthly || 0), 0);
    const totalHoursMonthly = baseHoursMonthly + systemManualHours;
    const totalHoursWeekly = totalHoursMonthly / 4;
    
    const growthMultiplier = discovery.expected_team_size_12mo && discovery.team_size
      ? discovery.expected_team_size_12mo / discovery.team_size
      : 1.5;
    
    const annualCost = totalHoursWeekly * hourlyRate * weeksPerYear;
    const projectedCost = annualCost * growthMultiplier;
    
    const context: ReportContext = {
      engagement,
      discovery,
      systems: systems || [],
      deepDives: deepDives || [],
      companyName: clientName,
      northStar: northStar,
      growthMultiplier: Math.round(growthMultiplier * 10) / 10,
      totalHoursWasted: Math.round(totalHoursWeekly * 10) / 10,
      annualCostOfChaos: Math.round(annualCost),
      projectedCostAtScale: Math.round(projectedCost)
    };
    
    console.log('[SA Report] Context prepared:', {
      companyName: context.companyName,
      systemsCount: context.systems.length,
      totalHoursWasted: context.totalHoursWasted,
      annualCost: context.annualCostOfChaos
    });
    
    const prompt = buildPrompt(context);
    const startTime = Date.now();
    
    // Call OpenRouter
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    console.log('[SA Report] Calling OpenRouter...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Systems Audit'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[SA Report] OpenRouter error:', error);
      throw new Error(`OpenRouter error: ${error}`);
    }
    
    const result = await response.json();
    const generationTime = Date.now() - startTime;
    
    const content = result.choices[0].message.content;
    const tokensUsed = result.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.003; // Sonnet pricing estimate
    
    console.log('[SA Report] LLM response received:', {
      tokensUsed,
      cost,
      generationTimeMs: generationTime
    });
    
    // Parse JSON response
    let reportData;
    try {
      // Clean potential markdown wrapping
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      reportData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('[SA Report] Failed to parse LLM response:', content.substring(0, 500));
      throw new Error('Failed to parse report data from LLM');
    }
    
    console.log('[SA Report] Parsed report data, saving to database...');
    
    // Save to database
    const { data: report, error: saveError } = await supabaseClient
      .from('sa_audit_reports')
      .upsert({
        engagement_id: engagementId,
        
        headline: reportData.executiveSummary.headline,
        executive_summary: reportData.executiveSummary.narrative,
        executive_summary_sentiment: reportData.executiveSummary.sentiment,
        
        total_hours_wasted_weekly: reportData.costOfChaos.totalHoursWastedWeekly,
        total_annual_cost_of_chaos: reportData.costOfChaos.annualCost,
        growth_multiplier: reportData.costOfChaos.scaleFactor,
        projected_cost_at_scale: reportData.costOfChaos.projectedCostAtScale,
        cost_of_chaos_narrative: reportData.costOfChaos.narrative,
        
        systems_count: systems?.length || 0,
        integration_score: reportData.scores.integration.score,
        automation_score: reportData.scores.automation.score,
        data_accessibility_score: reportData.scores.dataAccessibility.score,
        scalability_score: reportData.scores.scalability.score,
        
        critical_findings_count: reportData.keyFindings.filter((f: any) => f.severity === 'critical').length,
        high_findings_count: reportData.keyFindings.filter((f: any) => f.severity === 'high').length,
        medium_findings_count: reportData.keyFindings.filter((f: any) => f.severity === 'medium').length,
        low_findings_count: reportData.keyFindings.filter((f: any) => f.severity === 'low').length,
        
        quick_wins: reportData.quickWins,
        
        total_recommended_investment: reportData.investmentSummary.totalRecommendedInvestment,
        total_annual_benefit: reportData.investmentSummary.totalAnnualBenefit,
        overall_payback_months: reportData.investmentSummary.overallPaybackMonths,
        roi_ratio: reportData.investmentSummary.roi,
        
        hours_reclaimable_weekly: reportData.timeFreedom.hoursReclaimableWeekly,
        time_freedom_narrative: reportData.timeFreedom.narrative,
        what_this_enables: reportData.timeFreedom.whatThisEnables,
        
        client_quotes_used: reportData.clientQuotesUsed,
        
        llm_model: 'claude-sonnet-4.5',
        llm_tokens_used: tokensUsed,
        llm_cost: cost,
        generation_time_ms: generationTime,
        prompt_version: 'v2',
        
        status: 'generated',
        generated_at: new Date().toISOString()
      }, { onConflict: 'engagement_id' })
      .select()
      .single();
    
    if (saveError) {
      console.error('[SA Report] Save error:', saveError);
      throw saveError;
    }
    
    console.log('[SA Report] Report saved, creating findings and recommendations...');
    
    // Save findings
    for (const finding of reportData.keyFindings) {
      const findingCode = `F-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      await supabaseClient.from('sa_findings').insert({
        engagement_id: engagementId,
        finding_code: findingCode,
        source_stage: 'ai_generated',
        category: finding.category,
        severity: finding.severity,
        title: finding.title,
        description: finding.description,
        evidence: finding.evidence,
        client_quote: finding.clientQuote,
        hours_wasted_weekly: finding.hoursWastedWeekly,
        annual_cost_impact: finding.annualCostImpact,
        scalability_impact: finding.scalabilityImpact,
        recommendation: finding.recommendation
      });
    }
    
    // Save recommendations
    for (const rec of reportData.recommendations) {
      await supabaseClient.from('sa_recommendations').insert({
        engagement_id: engagementId,
        priority_rank: rec.priorityRank,
        title: rec.title,
        description: rec.description,
        category: rec.category,
        implementation_phase: rec.implementationPhase,
        estimated_cost: rec.estimatedCost,
        hours_saved_weekly: rec.hoursSavedWeekly,
        annual_cost_savings: rec.annualBenefit,
        time_reclaimed_weekly: rec.hoursSavedWeekly,
        freedom_unlocked: rec.freedomUnlocked
      });
    }
    
    // Update engagement status
    await supabaseClient
      .from('sa_engagements')
      .update({ status: 'analysis_complete' })
      .eq('id', engagementId);
    
    console.log('[SA Report] Report generation complete:', report.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        reportId: report.id,
        headline: reportData.executiveSummary.headline,
        costOfChaos: reportData.costOfChaos.annualCost,
        tokensUsed,
        cost,
        generationTimeMs: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[SA Report] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

