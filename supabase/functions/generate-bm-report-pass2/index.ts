import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// PASS 2: NARRATIVE WRITING (Opus)
// Reads pass1_data from bm_reports
// Writes compelling narratives using the story arc framework
// Updates report with status 'generated'
// =============================================================================

function buildPass2Prompt(pass1Data: any): string {
  const quotes = pass1Data.clientQuotes || {};
  const overall = pass1Data.overallPosition || {};
  const strengths = pass1Data.topStrengths || [];
  const gaps = pass1Data.topGaps || [];
  const metrics = pass1Data.metricsComparison || [];
  const opportunity = pass1Data.opportunitySizing || {};
  
  return `
You are writing the narrative sections of a Benchmarking report. Your job is to tell a STORY, not list problems.

═══════════════════════════════════════════════════════════════════════════════
THE STORY ARC
═══════════════════════════════════════════════════════════════════════════════

Every good consulting narrative follows this arc:

1. THE POSITION   → Where they actually sit (not where they think)
2. THE STRENGTHS  → What they're doing well (credibility first)
3. THE GAPS       → Where they're behind (connected to their stated concerns)
4. THE PRICE      → What these gaps cost them annually
5. THE PATH       → What closing the gaps would enable (their magic fix)

═══════════════════════════════════════════════════════════════════════════════
THEIR WORDS (USE THESE VERBATIM)
═══════════════════════════════════════════════════════════════════════════════

SUSPECTED UNDERPERFORMANCE: "${quotes.suspectedUnderperformance || 'Not specified'}"
WHERE THEY'RE LEAVING MONEY: "${quotes.leavingMoney}"
COMPETITOR ENVY: "${quotes.competitorEnvy || 'Not specified'}"
MAGIC FIX: "${quotes.magicFix}"
BLIND SPOT FEAR: "${quotes.blindSpotFear || 'Not specified'}"

═══════════════════════════════════════════════════════════════════════════════
PASS 1 ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

OVERALL POSITION: ${overall.percentile || 0}th percentile
STRENGTHS: ${overall.strengthCount || 0} metrics above median
GAPS: ${overall.gapCount || 0} metrics below median
TOTAL OPPORTUNITY: £${(opportunity.totalAnnualOpportunity || 0).toLocaleString()}/year

TOP STRENGTHS:
${strengths.map((s: any) => `- ${s.metric}: ${s.position} - ${s.implication}`).join('\n')}

TOP GAPS:
${gaps.map((g: any) => `- ${g.metric}: ${g.position} (£${g.annualImpact?.toLocaleString()}/year) - ${g.rootCauseHypothesis || 'No hypothesis'}`).join('\n')}

METRIC DETAILS:
${metrics.slice(0, 10).map((m: any) => `${m.metricName}: Client ${m.clientValue} vs Median ${m.p50} (${m.percentile}th percentile, £${m.annualImpact?.toLocaleString()} impact)`).join('\n')}

${pass1Data.financial_trends && pass1Data.financial_trends.length > 0 ? `
═══════════════════════════════════════════════════════════════════════════════
⚠️ FINANCIAL TRENDS - CRITICAL CONTEXT (DO NOT IGNORE)
═══════════════════════════════════════════════════════════════════════════════

${pass1Data.financial_trends.map((t: any) => `
📊 ${t.metric.toUpperCase()}:
   ${t.narrative}
   ${t.isRecovering ? '✅ THIS IS A RECOVERY PATTERN - interpret current metrics positively' : ''}
`).join('')}

${pass1Data.investment_signals?.likelyInvestmentYear ? `
⚠️ INVESTMENT PATTERN DETECTED (Confidence: ${pass1Data.investment_signals.confidence})
Indicators:
${pass1Data.investment_signals.indicators.map((ind: string) => `  • ${ind}`).join('\n')}

CRITICAL INSTRUCTION: Do NOT describe current margins as "crisis" or "alarming" if 
this is an investment/recovery pattern. Instead, use language like:
- "Margins recovering from strategic investment period"
- "Strong trajectory following capacity building"
- "Financial discipline restored after growth investment"
` : ''}
` : ''}

${pass1Data.balance_sheet ? `
═══════════════════════════════════════════════════════════════════════════════
BALANCE SHEET CONTEXT (Financial Resilience Indicators)
═══════════════════════════════════════════════════════════════════════════════

${pass1Data.balance_sheet.cash ? `- Cash Position: £${(pass1Data.balance_sheet.cash / 1000000).toFixed(2)}M` : ''}
${pass1Data.balance_sheet.net_assets ? `- Net Assets: £${(pass1Data.balance_sheet.net_assets / 1000000).toFixed(2)}M` : ''}
${pass1Data.current_ratio ? `- Current Ratio: ${pass1Data.current_ratio}` : ''}
${pass1Data.cash_months ? `- Cash Runway: ${pass1Data.cash_months} months of revenue` : ''}
${pass1Data.balance_sheet.freehold_property ? `- Freehold Property: £${(pass1Data.balance_sheet.freehold_property / 1000).toFixed(0)}k (hidden value)` : ''}

INTERPRETATION: If balance sheet is strong (high cash, positive net assets), 
do NOT describe the business as "in crisis" even if margins are low. 
Strong balance sheets indicate financial resilience and capacity to invest.
` : ''}

═══════════════════════════════════════════════════════════════════════════════
YOUR OUTPUT
═══════════════════════════════════════════════════════════════════════════════

Return JSON:
{
  "headline": "Under 25 words. Include the £ opportunity and their stated concern.",
  
  "executiveSummary": "3 paragraphs following the story arc. Start with their blind spot fear or suspected underperformance. End with their magic fix quoted verbatim.",
  
  "positionNarrative": "2 paragraphs. Where they actually sit. Be honest but constructive. Reference specific percentiles.",
  
  "strengthNarrative": "2 paragraphs. What they're doing well. Build credibility before discussing gaps. Use specific numbers.",
  
  "gapNarrative": "3 paragraphs. Where they're behind. Connect to their stated concerns. Quantify each gap in £.",
  
  "opportunityNarrative": "2 paragraphs. What closing gaps would mean for them. Reference their magic fix. Paint the picture."
}

═══════════════════════════════════════════════════════════════════════════════
TONE: SMART ADVISOR OVER COFFEE, NOT CORPORATE CONSULTANT
═══════════════════════════════════════════════════════════════════════════════

Write like you're explaining this to a smart business owner over coffee. 
They don't need impressing - they need clarity and honesty.

GOOD: "Your team bills 57% of their time. The average agency hits 71%. That gap 
costs you about £184k a year - roughly what you'd pay a senior developer."

BAD: "The benchmarking analysis reveals that utilisation metrics demonstrate 
significant underperformance against industry medians, with the 14 percentage 
point shortfall representing substantial unrealised revenue potential."

WRITE LIKE A PERSON:
- Use contractions (you're, don't, it's)
- Use "you" and "your" liberally - this is THEIR story
- Short sentences. Varied rhythm. 
- Numbers should land like punches, not drown in verbiage
- Acknowledge uncertainty where it exists ("probably", "likely", "suggests")

═══════════════════════════════════════════════════════════════════════════════
BANNED AI-SLOP
═══════════════════════════════════════════════════════════════════════════════

BANNED VOCABULARY (never use):
- Additionally, Furthermore, Moreover (just continue the thought)
- Delve, delving (look at, examine, dig into)
- Crucial, pivotal, vital, key as adjective (show why it matters)
- Testament to, underscores, highlights (shows, makes clear)
- Showcases, fostering, garnered (shows, building, got)
- Tapestry, landscape, ecosystem (figurative uses)
- Intricate, vibrant, enduring (puffery)
- Synergy, leverage (verb), value-add (corporate nonsense)
- Streamline, optimize, holistic, impactful, scalable, robust (consultant clichés)
- Best practices, industry-leading, unlock potential, drive growth

BANNED STRUCTURES:
- "Not only X but also Y" parallelisms (pick X or Y)
- "It's important to note..." / "In summary..." / "In conclusion..."
- Rule of three lists (pick the best one)
- "Despite challenges, positioned for growth" formula
- "Let me be direct" / "I want to be honest" (just be direct/honest)
- Starting any paragraph with "Your" (vary openings)
- Ending with "-ing" phrases ("ensuring excellence, fostering growth")

THE HUMAN TEST:
If it sounds like an annual report, rewrite it. If it sounds like coffee with a smart friend, keep it.

EXAMPLE TRANSFORMATIONS:
BAD: "The analysis underscores the pivotal importance of enhanced operational efficiency."
GOOD: "You're leaving £47,000 on the table. Here's why."

BAD: "Not only does this represent a significant opportunity, but it also positions you for sustainable growth."
GOOD: "Fix this and you add £47,000/year. That's the gap."

═══════════════════════════════════════════════════════════════════════════════
REQUIRED ELEMENTS
═══════════════════════════════════════════════════════════════════════════════

EVERY narrative must include:
- At least ONE verbatim client quote per section
- At least THREE specific numbers per section
- Their suspected underperformance connected to actual findings
- Their magic fix quoted exactly in the opportunity section
- If their blind spot fear was confirmed, address it directly
- If their perception was wrong, correct it gently with evidence

Return ONLY valid JSON.
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
    
    console.log('[BM Pass 2] Starting narrative generation for:', engagementId);
    
    // Fetch report with pass1_data
    const { data: report, error: reportError } = await supabaseClient
      .from('bm_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();
    
    if (reportError || !report) {
      throw new Error(`Failed to fetch report: ${reportError?.message || 'Not found'}`);
    }
    
    if (!report.pass1_data) {
      throw new Error('Pass 1 data not found - run Pass 1 first');
    }
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    // Build and send prompt
    console.log('[BM Pass 2] Calling Opus for narrative generation...');
    const startTime = Date.now();
    
    // Merge pass1_data with additional context from report (balance sheet, trends)
    const enrichedPass1Data = {
      ...report.pass1_data,
      balance_sheet: report.balance_sheet,
      financial_trends: report.financial_trends,
      investment_signals: report.investment_signals,
      historical_financials: report.historical_financials,
      current_ratio: report.current_ratio,
      quick_ratio: report.quick_ratio,
      cash_months: report.cash_months
    };
    
    // Log if we have trend/investment context
    if (enrichedPass1Data.financial_trends?.length > 0) {
      console.log('[BM Pass 2] Including financial trends in narrative context');
    }
    if (enrichedPass1Data.investment_signals?.likelyInvestmentYear) {
      console.log('[BM Pass 2] ⚠️ Investment pattern detected - adjusting narrative tone');
    }
    if (enrichedPass1Data.balance_sheet) {
      console.log('[BM Pass 2] Including balance sheet context in narrative');
    }
    
    const prompt = buildPass2Prompt(enrichedPass1Data);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    let content = result.choices[0].message.content;
    
    // Strip markdown code blocks if present (```json ... ```)
    content = content.trim();
    if (content.startsWith('```')) {
      // Remove opening ```json or ```
      content = content.replace(/^```(?:json)?\n?/i, '');
      // Remove closing ```
      content = content.replace(/\n?```$/i, '');
      content = content.trim();
    }
    
    const narratives = JSON.parse(content);
    const tokensUsed = result.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000) * 0.015; // Approximate cost for Opus 4
    const generationTime = Date.now() - startTime;
    
    console.log('[BM Pass 2] Narrative generation complete. Tokens:', tokensUsed, 'Cost: £', cost.toFixed(4));
    
    // Update report with narratives
    const { error: updateError } = await supabaseClient
      .from('bm_reports')
      .update({
        headline: narratives.headline,
        executive_summary: narratives.executiveSummary,
        position_narrative: narratives.positionNarrative,
        strength_narrative: narratives.strengthNarrative,
        gap_narrative: narratives.gapNarrative,
        opportunity_narrative: narratives.opportunityNarrative,
        status: 'generated',
        llm_model: report.llm_model + ' + claude-opus-4',
        llm_tokens_used: (report.llm_tokens_used || 0) + tokensUsed,
        llm_cost: (report.llm_cost || 0) + cost,
        generation_time_ms: (report.generation_time_ms || 0) + generationTime
      })
      .eq('engagement_id', engagementId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Update engagement status
    await supabaseClient
      .from('bm_engagements')
      .update({ 
        status: 'generated',
        generated_at: new Date().toISOString()
      })
      .eq('id', engagementId);
    
    console.log('[BM Pass 2] Report complete!');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        engagementId,
        status: 'generated',
        tokensUsed,
        cost: `£${cost.toFixed(4)}`,
        generationTimeMs: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[BM Pass 2] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

