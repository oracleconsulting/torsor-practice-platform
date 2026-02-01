/**
 * Generate Benchmarking Opportunities
 * 
 * Analyses all client data to identify opportunities, map to services,
 * and surface new service concepts for the growing library.
 * 
 * Part of the Service Intelligence System - learns from every client.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[generate-bm-opportunities] Starting for engagement: ${engagementId}`);

    // 1. Gather all client data
    const clientData = await gatherAllClientData(supabase, engagementId);
    console.log(`[generate-bm-opportunities] Gathered data for client: ${clientData.clientName}`);

    // 2. Get active service catalogue
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'active');
    
    console.log(`[generate-bm-opportunities] Loaded ${services?.length || 0} active services`);

    // 3. Get existing concepts (to avoid duplicates)
    const { data: existingConcepts } = await supabase
      .from('service_concepts')
      .select('id, suggested_name, problem_it_solves, times_identified')
      .in('review_status', ['pending', 'under_review']);
    
    console.log(`[generate-bm-opportunities] Found ${existingConcepts?.length || 0} existing concepts`);

    // 4. Build and call LLM for analysis
    const analysis = await analyseWithLLM(clientData, services || [], existingConcepts || []);
    console.log(`[generate-bm-opportunities] LLM identified ${analysis.opportunities?.length || 0} opportunities`);

    // 5. Store results
    await storeOpportunities(supabase, engagementId, clientData.clientId, analysis);
    
    // 6. Update report with assessment
    await supabase
      .from('bm_reports')
      .update({
        opportunity_assessment: analysis.overallAssessment,
        scenario_suggestions: analysis.scenarioSuggestions,
        opportunities_generated_at: new Date().toISOString(),
      })
      .eq('engagement_id', engagementId);

    const newConceptCount = (analysis.opportunities || []).filter(
      (o: any) => o.serviceMapping?.newConceptNeeded
    ).length;

    console.log(`[generate-bm-opportunities] Complete. ${analysis.opportunities?.length || 0} opportunities, ${newConceptCount} new concepts`);

    return new Response(JSON.stringify({ 
      success: true, 
      opportunityCount: analysis.opportunities?.length || 0,
      newConcepts: newConceptCount,
      assessment: analysis.overallAssessment
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-bm-opportunities] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// DATA GATHERING
// ============================================================================

interface ClientData {
  engagementId: string;
  clientId: string;
  clientName: string;
  industryCode: string | null;
  pass1Data: any;
  pass2Narratives: any;
  assessment: any;
  hva: any;
  metrics: any[];
  founderRisk: any;
  supplementary: any;
}

async function gatherAllClientData(supabase: any, engagementId: string): Promise<ClientData> {
  // Get engagement with client info
  const { data: engagement } = await supabase
    .from('bm_engagements')
    .select('*, client:practice_members(id, name)')
    .eq('id', engagementId)
    .single();
  
  const clientId = engagement?.client_id || '';
  const clientName = engagement?.client?.name || 'Client';
  
  // Get report (Pass 1 & 2 data)
  const { data: report } = await supabase
    .from('bm_reports')
    .select('*')
    .eq('engagement_id', engagementId)
    .single();
  
  // Get assessment responses
  const { data: assessment } = await supabase
    .from('bm_assessment_responses')
    .select('*')
    .eq('engagement_id', engagementId)
    .single();
  
  // Get HVA Part 3 if exists
  const { data: hva } = await supabase
    .from('client_assessments')
    .select('responses')
    .eq('client_id', clientId)
    .eq('assessment_type', 'part3')
    .maybeSingle();
  
  // Get metrics comparison
  const { data: metrics } = await supabase
    .from('bm_metric_comparisons')
    .select('*')
    .eq('engagement_id', engagementId);

  // Parse pass1_data
  let pass1Data = {};
  try {
    pass1Data = typeof report?.pass1_data === 'string' 
      ? JSON.parse(report.pass1_data) 
      : (report?.pass1_data || {});
  } catch (e) {
    console.log('Could not parse pass1_data');
  }

  return {
    engagementId,
    clientId,
    clientName,
    industryCode: report?.industry_code,
    pass1Data,
    pass2Narratives: {
      headline: report?.headline,
      executiveSummary: report?.executive_summary,
      strengthNarrative: report?.strength_narrative,
      gapNarrative: report?.gap_narrative,
      opportunityNarrative: report?.opportunity_narrative,
    },
    assessment: assessment?.responses || assessment || {},
    hva: hva?.responses || {},
    metrics: metrics || [],
    founderRisk: {
      level: report?.founder_risk_level,
      score: report?.founder_risk_score,
      factors: report?.founder_risk_factors || [],
      valuationImpact: report?.valuation_impact,
    },
    supplementary: report?.supplementary_data || assessment?.responses || {},
  };
}

// ============================================================================
// LLM ANALYSIS
// ============================================================================

async function analyseWithLLM(
  clientData: ClientData, 
  services: any[], 
  existingConcepts: any[]
): Promise<any> {
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(clientData, services, existingConcepts);
  
  console.log('[generate-bm-opportunities] Calling LLM...');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 8000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse JSON response
  try {
    // Remove markdown code fences if present
    const jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse LLM response:', content.substring(0, 1000));
    throw new Error('Invalid JSON response from LLM');
  }
}

function buildSystemPrompt(): string {
  return `You are a senior adviser at Torsor, a UK accountancy practice's Business Services Group. 

Your job is to analyse client data and identify EVERY opportunity where the practice could help.

For each opportunity you must:
1. Ground it in SPECIFIC numbers from the data
2. Calculate or estimate financial impact
3. Either map it to an existing service OR describe a new service concept
4. Provide a practical talking point for the adviser

Categories to consider:
- Risk: concentration, key person, market dependency
- Efficiency: utilisation, productivity, systems
- Growth: revenue, market position, capacity
- Value: exit readiness, valuation factors
- Governance: reporting, compliance

Be thorough - the client paid £2,000 for this analysis.

RESPOND IN JSON FORMAT ONLY. No markdown outside the JSON structure, no explanations.`;
}

function buildUserPrompt(clientData: ClientData, services: any[], existingConcepts: any[]): string {
  const { clientName, industryCode, pass1Data, pass2Narratives, assessment, hva, metrics, founderRisk, supplementary } = clientData;
  
  // Extract enriched data
  const enriched = pass1Data?.enrichedData || pass1Data?._enriched || {};
  const revenue = enriched.revenue || pass1Data?.revenue || 0;
  const grossMargin = enriched.grossMargin || enriched.gross_margin || pass1Data?.grossMargin || 0;
  const netMargin = enriched.netMargin || enriched.net_margin || pass1Data?.netMargin || 0;
  const employeeCount = enriched.employeeCount || enriched.employee_count || pass1Data?.employeeCount || 0;
  const revenuePerEmployee = enriched.revenuePerEmployee || enriched.revenue_per_employee || pass1Data?.revenuePerEmployee || 0;
  const debtorDays = enriched.debtorDays || enriched.debtor_days || pass1Data?.debtorDays || 0;
  const revenueGrowth = enriched.revenueGrowth || enriched.revenue_growth || pass1Data?.revenueGrowth || 0;
  
  // Balance sheet data
  const surplusCash = pass1Data?.surplusCash?.surplusCash || 0;
  const cash = pass1Data?.balanceSheet?.cash || pass1Data?.balance_sheet?.cash || 0;
  const netAssets = pass1Data?.balanceSheet?.netAssets || pass1Data?.balance_sheet?.net_assets || 0;
  const freeholdProperty = pass1Data?.balanceSheet?.freeholdProperty || pass1Data?.balance_sheet?.freehold_property;
  
  // Build metrics comparison text
  const metricsText = (metrics || [])
    .filter((m: any) => m.percentile !== null && m.percentile !== undefined)
    .map((m: any) => `- ${m.metric_name || m.metricName}: ${m.client_value || m.clientValue} (${m.percentile}th percentile)`)
    .join('\n') || 'No benchmark data available';
  
  // Build services catalogue text
  const servicesText = services.map(s => 
    `${s.code}: ${s.name} - ${s.headline} (£${s.price_from}${s.price_to !== s.price_from ? `-${s.price_to}` : ''}${s.price_unit})`
  ).join('\n');
  
  // Get concentration data from various sources
  const concentration = supplementary?.client_concentration_top3 || 
                        supplementary?.bm_supp_client_concentration_top3 ||
                        assessment?.client_concentration_top3 ||
                        pass1Data?.supplementary?.client_concentration_top3;
  
  const topCustomers = supplementary?.top_customers || 
                       supplementary?.bm_supp_top_customers ||
                       assessment?.top_customers ||
                       pass1Data?.supplementary?.top_customers;

  return `Analyse this client and identify ALL opportunities:

## CLIENT: ${clientName}
Industry: ${industryCode || 'Unknown'}

## FINANCIAL SNAPSHOT
- Revenue: £${revenue.toLocaleString()} (${revenueGrowth > 0 ? '+' : ''}${revenueGrowth?.toFixed?.(1) || revenueGrowth}% YoY)
- Gross Margin: ${grossMargin?.toFixed?.(1) || grossMargin}%
- Net Margin: ${netMargin?.toFixed?.(1) || netMargin}%
- Employees: ${employeeCount}
- Revenue/Employee: £${Math.round(revenuePerEmployee).toLocaleString()}
- Debtor Days: ${Math.round(debtorDays)}
- Cash: £${cash.toLocaleString()}
- Net Assets: £${netAssets.toLocaleString()}
${surplusCash > 0 ? `- Surplus Cash: £${surplusCash.toLocaleString()}` : ''}
${freeholdProperty ? `- Freehold Property: £${freeholdProperty.toLocaleString()}` : ''}

## FOUNDER RISK
- Level: ${founderRisk?.level || 'Not assessed'}
- Score: ${founderRisk?.score || 'N/A'}/100
- Valuation Impact: ${founderRisk?.valuationImpact || 'N/A'}
- Factors: ${(founderRisk?.factors || []).join(', ') || 'None identified'}

## CONCENTRATION
${concentration ? `- Top 3 clients: ${concentration}% of revenue` : '- Not collected'}
${topCustomers && Array.isArray(topCustomers) ? `- Clients: ${topCustomers.map((c: any) => `${c.name} (${c.percentage}%)`).join(', ')}` : ''}

## BENCHMARK POSITION
${metricsText}

## HVA INSIGHTS
${hva?.knowledge_dependency_percentage !== undefined ? `- Knowledge Dependency: ${hva.knowledge_dependency_percentage}%` : ''}
${hva?.personal_brand_percentage !== undefined ? `- Personal Brand: ${hva.personal_brand_percentage}%` : ''}
${hva?.succession_your_role ? `- Succession Plan: ${hva.succession_your_role}` : ''}
${hva?.last_price_increase ? `- Last Price Increase: ${hva.last_price_increase}` : ''}
${hva?.recurring_revenue_percentage !== undefined ? `- Recurring Revenue: ${hva.recurring_revenue_percentage}%` : ''}
${hva?.tech_stack_health_percentage !== undefined ? `- Tech Stack Health: ${hva.tech_stack_health_percentage}%` : ''}
${hva?.team_advocacy_percentage !== undefined ? `- Team Advocacy: ${hva.team_advocacy_percentage}%` : ''}
${hva?.competitive_moat?.length ? `- Competitive Moat: ${hva.competitive_moat.join(', ')}` : ''}

## CLIENT'S OWN WORDS
- Suspected underperformance: "${assessment?.suspected_underperformance || assessment?.benchmark_suspected_underperformance || 'Not provided'}"
- Leaving money on table: "${assessment?.leaving_money || assessment?.benchmark_leaving_money || 'Not provided'}"
- Magic fix wanted: "${assessment?.magic_fix || assessment?.benchmark_magic_fix || 'Not provided'}"
- Blind spot fear: "${assessment?.blind_spot_fear || assessment?.benchmark_blind_spot_fear || 'Not provided'}"

## EXISTING ANALYSIS
${pass2Narratives?.executiveSummary || 'Not available'}

## OUR SERVICES
${servicesText}

## SERVICE CONCEPTS IN PIPELINE
${existingConcepts.length > 0 
  ? existingConcepts.map(c => `- ${c.suggested_name} (seen ${c.times_identified}x): ${c.problem_it_solves}`).join('\n')
  : 'None currently'}

---

Return JSON with this exact structure:

{
  "opportunities": [
    {
      "code": "unique_code",
      "title": "Opportunity Title",
      "category": "risk|efficiency|growth|value|governance",
      "severity": "critical|high|medium|low|opportunity",
      "dataEvidence": "Specific numbers from above",
      "dataValues": {"key": 123},
      "benchmarkComparison": "vs industry or best practice",
      "financialImpact": {
        "type": "risk|upside|cost_saving|value_creation",
        "amount": 1000000,
        "confidence": "high|medium|low",
        "calculation": "How calculated"
      },
      "serviceMapping": {
        "existingService": {
          "code": "SERVICE_CODE",
          "fitScore": 85,
          "rationale": "Why this service fits"
        },
        "newConceptNeeded": null
      },
      "adviserTools": {
        "talkingPoint": "What to say to client",
        "questionToAsk": "Discovery question",
        "quickWin": "Action for this week"
      }
    }
  ],
  "scenarioSuggestions": [
    {
      "title": "Scenario name",
      "metric": "gross_margin",
      "currentValue": 16.3,
      "targetValue": 20,
      "projectedImpact": 2340000,
      "rationale": "Why this target"
    }
  ],
  "overallAssessment": {
    "clientHealth": "strong|stable|recovering|concerning|critical",
    "topPriority": "One sentence summary",
    "quickWins": ["action1", "action2"],
    "totalOpportunityValue": 5000000
  }
}

For newConceptNeeded (when no existing service fits well):
{
  "suggestedName": "New Service Name",
  "problemItSolves": "What problem this solves",
  "suggestedDeliverables": ["deliverable1", "deliverable2"],
  "suggestedPricing": "£X-£Y",
  "suggestedDuration": "timeframe",
  "skillsRequired": ["skill1", "skill2"],
  "gapVsExisting": "Why existing services don't fully cover this",
  "marketSize": "niche|moderate|broad"
}

Important:
- Each opportunity must have either existingService OR newConceptNeeded (not both)
- Be specific with numbers - ground everything in the data above
- Include talking points that an adviser can use word-for-word`;
}

// ============================================================================
// STORAGE
// ============================================================================

async function storeOpportunities(
  supabase: any,
  engagementId: string,
  clientId: string,
  analysis: any
): Promise<void> {
  const opportunities = analysis.opportunities || [];
  
  for (const opp of opportunities) {
    let serviceId: string | null = null;
    let conceptId: string | null = null;
    
    // Handle existing service match
    if (opp.serviceMapping?.existingService?.code) {
      const { data: service } = await supabase
        .from('services')
        .select('id')
        .eq('code', opp.serviceMapping.existingService.code)
        .single();
      
      if (service) {
        serviceId = service.id;
        
        // Increment recommendation count
        await supabase.rpc('increment_column', {
          table_name: 'services',
          column_name: 'times_recommended',
          row_id: service.id
        }).catch(() => {
          // If RPC doesn't exist, do direct update
          supabase
            .from('services')
            .update({ 
              times_recommended: (service.times_recommended || 0) + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', service.id);
        });
      }
    }
    
    // Handle new concept needed
    if (opp.serviceMapping?.newConceptNeeded) {
      const concept = opp.serviceMapping.newConceptNeeded;
      
      // Check for existing similar concept (fuzzy match on name)
      const { data: existing } = await supabase
        .from('service_concepts')
        .select('*')
        .or(`suggested_name.ilike.%${concept.suggestedName.split(' ').slice(0, 2).join('%')}%`)
        .in('review_status', ['pending', 'under_review'])
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        // Update existing concept - increment frequency
        const newClientIds = [...new Set([...(existing.client_ids || []), clientId])];
        
        await supabase
          .from('service_concepts')
          .update({
            times_identified: (existing.times_identified || 1) + 1,
            client_ids: newClientIds,
            total_opportunity_value: (parseFloat(existing.total_opportunity_value) || 0) + (opp.financialImpact?.amount || 0),
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        
        conceptId = existing.id;
        console.log(`[generate-bm-opportunities] Updated existing concept: ${existing.suggested_name} (now seen ${existing.times_identified + 1}x)`);
      } else {
        // Create new concept
        const { data: newConcept, error } = await supabase
          .from('service_concepts')
          .insert({
            suggested_name: concept.suggestedName,
            suggested_category: opp.category,
            description: concept.problemItSolves,
            problem_it_solves: concept.problemItSolves,
            suggested_deliverables: concept.suggestedDeliverables || [],
            suggested_pricing: concept.suggestedPricing,
            suggested_duration: concept.suggestedDuration,
            first_client_id: clientId,
            first_engagement_id: engagementId,
            client_ids: [clientId],
            total_opportunity_value: opp.financialImpact?.amount || 0,
            market_size_estimate: concept.marketSize,
            skills_likely_required: concept.skillsRequired || [],
            gap_vs_existing: concept.gapVsExisting,
            development_priority: concept.developmentPriority || 'medium_term',
          })
          .select('id')
          .single();
        
        if (error) {
          console.error(`[generate-bm-opportunities] Failed to create concept: ${error.message}`);
        } else {
          conceptId = newConcept?.id;
          console.log(`[generate-bm-opportunities] Created new concept: ${concept.suggestedName}`);
        }
      }
    }
    
    // Insert/update the client opportunity
    const { error: oppError } = await supabase
      .from('client_opportunities')
      .upsert({
        engagement_id: engagementId,
        client_id: clientId,
        opportunity_code: opp.code,
        title: opp.title,
        category: opp.category,
        severity: opp.severity,
        data_evidence: opp.dataEvidence,
        data_values: opp.dataValues || {},
        benchmark_comparison: opp.benchmarkComparison,
        financial_impact_type: opp.financialImpact?.type,
        financial_impact_amount: opp.financialImpact?.amount,
        financial_impact_confidence: opp.financialImpact?.confidence,
        impact_calculation: opp.financialImpact?.calculation,
        recommended_service_id: serviceId,
        service_fit_score: opp.serviceMapping?.existingService?.fitScore,
        service_fit_rationale: opp.serviceMapping?.existingService?.rationale,
        suggested_concept_id: conceptId,
        talking_point: opp.adviserTools?.talkingPoint,
        question_to_ask: opp.adviserTools?.questionToAsk,
        quick_win: opp.adviserTools?.quickWin,
        llm_model: 'claude-sonnet-4',
        generated_at: new Date().toISOString(),
      }, {
        onConflict: 'engagement_id,opportunity_code'
      });
    
    if (oppError) {
      console.error(`[generate-bm-opportunities] Failed to store opportunity ${opp.code}: ${oppError.message}`);
    }
  }
  
  console.log(`[generate-bm-opportunities] Stored ${opportunities.length} opportunities`);
}

