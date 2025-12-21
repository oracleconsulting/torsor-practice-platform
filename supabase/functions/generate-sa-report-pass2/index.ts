import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// PASS 2: NARRATIVE WRITING (Opus)
// Reads pass1_data from sa_audit_reports
// Writes compelling narratives using the story arc framework
// Updates report with status 'generated'
// =============================================================================

function buildPass2Prompt(pass1Data: any): string {
  const f = pass1Data.facts;
  
  return `
You are writing the narrative sections of a Systems Audit report. Your job is to tell a STORY, not list problems.

═══════════════════════════════════════════════════════════════════════════════
THE STORY ARC
═══════════════════════════════════════════════════════════════════════════════

Every good consulting narrative follows this arc:

1. THE PROOF (their expensive mistake) → This already happened. It's not theoretical.
2. THE PATTERN (why it happened) → The systemic gaps that made it inevitable.
3. THE PRICE (cost of chaos) → What it's costing them now, and at scale.
4. THE PATH (their stated goal) → What they actually want, in their words.
5. THE PLAN (how to get there) → Specific systems → specific outcomes.

Your job is to weave these elements into compelling prose that reads like a story, not a report.

═══════════════════════════════════════════════════════════════════════════════
1. THE PROOF - Their Expensive Mistake (LEAD WITH THIS)
═══════════════════════════════════════════════════════════════════════════════

This is your opening hook. Not "your systems are disconnected" but THIS SPECIFIC THING THAT HAPPENED:

"${f.expensiveMistake}"

This proves everything else. When you write the executive summary, START HERE. The reader should feel the gut-punch of "we thought we were profitable but we weren't" before you explain why.

═══════════════════════════════════════════════════════════════════════════════
2. THE PATTERN - Why It Happened
═══════════════════════════════════════════════════════════════════════════════

The expensive mistake wasn't bad luck. It was the predictable result of these disconnects:

SYSTEMS THAT DON'T TALK:
${(f.integrationGaps || []).map((g: string) => `- ${g}`).join('\n')}

THEIR WORDS DESCRIBING THE PATTERN:
- Breaking point: "${f.breakingPoint}"
- Month-end shame: "${f.monthEndShame}"

SPECIFIC METRICS PROVING THE PATTERN:
- Quotes take ${f.metrics?.quoteTimeMins || '?'} mins (should be 30) because they're not linked to delivery scope
- Invoices lag ${f.metrics?.invoiceLagDays || '?'} days (should be 2) because billing depends on memory
- Reports arrive ${f.metrics?.reportingLagDays || '?'} days late (should be 5-7) so decisions come after the moment to act
- Month-end takes ${f.metrics?.monthEndCloseDays || '?'} days (target: ${f.metrics?.targetCloseDays || 5}) because it's "part accounting, part detective work"

THE SYSTEMS INVOLVED:
${(f.systems || []).map((s: any) => `- ${s.name}: ${(s.gaps || []).length > 0 ? (s.gaps || []).join('; ') : 'Working well'}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
3. THE PRICE - Cost of Chaos
═══════════════════════════════════════════════════════════════════════════════

Hours wasted weekly: ${f.hoursWastedWeekly}
Annual cost: £${(f.annualCostOfChaos || 0).toLocaleString()}
At ${f.growthMultiplier}x growth: £${(f.projectedCostAtScale || 0).toLocaleString()}

BY PROCESS:
${(f.processes || []).map((p: any) => `- ${p.chainName}: ${p.hoursWasted} hours/month wasted - "${(p.keyPainPoints || [])[0] || 'No quote'}"`).join('\n')}

Their framing to use: "grown-up decisions with teenage visibility"

═══════════════════════════════════════════════════════════════════════════════
4. THE PATH - Their Stated Goal (QUOTE EXACTLY)
═══════════════════════════════════════════════════════════════════════════════

DO NOT PARAPHRASE. This is what they said they want, word for word:

"${f.magicFix}"

Break this down:
- "true cash position" → requires Xero-bank-Stripe reconciliation
- "margin by service line" → requires Harvest time → Asana project → Xero invoice connection
- "staff cost ratio" → requires Dext expenses + payroll integration
- "90-day cash view" → requires pipeline visibility + recurring revenue tracking

When you write, map YOUR recommendations to THEIR specific goals.

═══════════════════════════════════════════════════════════════════════════════
5. THE PLAN - Specific Systems → Specific Outcomes
═══════════════════════════════════════════════════════════════════════════════

Top findings and what they affect:
${(pass1Data.findings || []).slice(0, 5).map((finding: any, i: number) => `
${i + 1}. ${finding.title}
   Systems: ${(finding.affectedSystems || []).join(' → ')}
   Their words: "${finding.clientQuote}"
   Fixes: ${finding.recommendation}
`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
ALL CLIENT QUOTES (weave these in)
═══════════════════════════════════════════════════════════════════════════════

${(f.allClientQuotes || []).map((q: string, i: number) => `${i + 1}. "${q}"`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
YOUR OUTPUT
═══════════════════════════════════════════════════════════════════════════════

Write these four narrative sections as a JSON object:

{
  "headline": "Under 25 words. Include the annual cost (£${(f.annualCostOfChaos || 0).toLocaleString()}) AND their goal phrase. Make it quotable for a proposal.",
  
  "executiveSummary": "Three paragraphs that tell the story:
    
    PARAGRAPH 1 - THE PROOF:
    Open with their expensive mistake. Not 'your systems have gaps' but 'You already know what broken visibility costs—a project that looked profitable delivered at break-even because [their exact words].' Make them feel it before you explain it. This is the hook.
    
    PARAGRAPH 2 - THE PATTERN:
    Now explain WHY that happened. Name the specific systems: 'When Harvest time entries don't flow to Asana project milestones, and Asana completion doesn't trigger Xero invoicing...' Use their numbers: ${f.metrics?.quoteTimeMins || '?'}-min quotes, ${f.metrics?.invoiceLagDays || '?'}-day invoice lag, ${f.metrics?.reportingLagDays || '?'}-day reporting. Quote their month-end shame. Show this wasn't bad luck—it was structural.
    
    PARAGRAPH 3 - THE PATH FORWARD:
    Quote their magic fix VERBATIM (the full thing about true cash position, margin by service line, etc.). Then show how each integration delivers each part of their goal. End with what changes: decisions stop being debates.",
    
  "costOfChaosNarrative": "One paragraph that:
    - Opens with 'The ${f.hoursWastedWeekly} hours your team loses each week aren't spread evenly...'
    - Breaks down by process with their quotes: 'Quote-to-Cash alone consumes X hours because [their words]'
    - References the expensive mistake as proof this isn't theoretical
    - Shows the scaling danger: 'At ${f.growthMultiplier}x growth, [specific pain point] becomes [specific crisis]'
    - Uses their 'grown-up decisions with teenage visibility' framing",
    
  "timeFreedomNarrative": "One paragraph that:
    - Opens by quoting their magic fix EXACTLY: 'You said you want to see [full quote]'
    - Maps each system integration to each part of that goal:
      * Harvest→Xero delivers true cash position by...
      * Asana→Harvest exposes margin by service line through...
      * Dext→Xero provides staff cost ratios via...
      * Pipeline visibility creates 90-day cash view by...
    - Ends with what 'decisions stop being debates driven by gut feel' actually looks like day-to-day"
}

═══════════════════════════════════════════════════════════════════════════════
WRITING RULES
═══════════════════════════════════════════════════════════════════════════════

BANNED PHRASES (instant fail):
- "streamline" / "leverage" / "optimize" / "best practices"
- "digital transformation" / "holistic approach" / "moving forward"
- "I want to be direct" / "Let me be honest" / "Here's the truth"
- "Your systems are fundamentally sound" (too soft - they just told you about a project that broke even)
- Starting any paragraph with "Your" (vary your openings)

REQUIRED ELEMENTS:
✓ Expensive mistake must appear in first 2 sentences of executive summary
✓ Magic fix must be quoted EXACTLY, not paraphrased (all four parts)
✓ At least 3 system names per paragraph (Xero, Harvest, Asana, Dext, Stripe, Slack, Google Workspace)
✓ At least 1 verbatim client quote per paragraph
✓ Specific numbers from their data, not rounded generalities

TONE:
- Confident, not apologetic
- Specific, not vague
- Story-driven, not list-driven
- Peer-to-peer, not consultant-to-client

Return ONLY the JSON object with these four fields. No markdown wrapping.
`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId, reportId } = await req.json();
    
    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log('[SA Pass 2] Starting narrative generation for:', engagementId);
    
    // Fetch the report with pass1_data
    const { data: report, error: reportError } = await supabaseClient
      .from('sa_audit_reports')
      .select('*')
      .eq('engagement_id', engagementId)
      .single();
    
    if (reportError || !report) {
      throw new Error(`Failed to fetch report: ${reportError?.message || 'Not found'}`);
    }
    
    // Get pass1_data from either the column or review_notes (temporary storage)
    let pass1Data = report.pass1_data;
    
    if (!pass1Data && report.review_notes) {
      try {
        const notes = JSON.parse(report.review_notes);
        if (notes._pass1_data) {
          pass1Data = notes._pass1_data;
          console.log('[SA Pass 2] Found pass1_data in review_notes (temporary storage)');
        }
      } catch (e) {
        // review_notes is not JSON or doesn't contain pass1_data
      }
    }
    
    if (!pass1Data) {
      throw new Error('Pass 1 data not found in report. Please run Pass 1 first.');
    }
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    // Build and send prompt to Opus
    console.log('[SA Pass 2] Calling Opus for narratives...');
    const startTime = Date.now();
    
    const prompt = buildPass2Prompt(pass1Data);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor SA Pass 2'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Opus API failed: ${await response.text()}`);
    }
    
    const result = await response.json();
    const generationTime = Date.now() - startTime;
    const tokensUsed = result.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000000) * 15; // Opus pricing
    
    // Parse response
    let narratives: {
      headline: string;
      executiveSummary: string;
      costOfChaosNarrative: string;
      timeFreedomNarrative: string;
    };
    
    try {
      let content = result.choices[0].message.content.trim();
      
      // Remove markdown code fences
      content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
      
      // Find the first brace (start of JSON)
      const firstBrace = content.indexOf('{');
      if (firstBrace > 0) content = content.substring(firstBrace);
      
      // Find the last matching brace (end of JSON) - handle nested braces
      let braceCount = 0;
      let lastBrace = -1;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            lastBrace = i;
            break;
          }
        }
      }
      if (lastBrace > 0) content = content.substring(0, lastBrace + 1);
      
      narratives = JSON.parse(content);
    } catch (e: any) {
      console.error('[SA Pass 2] Parse error:', e.message);
      console.error('[SA Pass 2] Content length:', result.choices[0].message.content.length);
      const errorPos = e.message.match(/position (\d+)/)?.[1];
      if (errorPos) {
        const pos = parseInt(errorPos);
        console.error('[SA Pass 2] Content around error position:', 
          result.choices[0].message.content.substring(Math.max(0, pos - 100), pos + 100));
      }
      
      // Try to fix control characters in string values
      try {
        let content = result.choices[0].message.content.trim();
        content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
        const firstBrace = content.indexOf('{');
        if (firstBrace > 0) content = content.substring(firstBrace);
        
        // Find last complete JSON object
        let braceCount = 0;
        let lastBrace = -1;
        for (let i = 0; i < content.length; i++) {
          if (content[i] === '{') braceCount++;
          if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              lastBrace = i;
              break;
            }
          }
        }
        if (lastBrace > 0) content = content.substring(0, lastBrace + 1);
        
        // Fix control characters: escape them properly in string values
        // This regex matches string values (handles escaped quotes)
        let inString = false;
        let escaped = false;
        let fixed = '';
        
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          
          if (escaped) {
            fixed += char;
            escaped = false;
            continue;
          }
          
          if (char === '\\') {
            fixed += char;
            escaped = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            fixed += char;
            continue;
          }
          
          if (inString) {
            // Inside a string - escape control characters
            const code = char.charCodeAt(0);
            if (code < 0x20 && code !== 0x09 && code !== 0x0A && code !== 0x0D) {
              // Control character that's not tab, newline, or carriage return
              fixed += `\\u${code.toString(16).padStart(4, '0')}`;
            } else if (code === 0x09) {
              fixed += '\\t';
            } else if (code === 0x0A) {
              fixed += '\\n';
            } else if (code === 0x0D) {
              fixed += '\\r';
            } else {
              fixed += char;
            }
          } else {
            fixed += char;
          }
        }
        
        narratives = JSON.parse(fixed);
        console.log('[SA Pass 2] Successfully parsed after fixing control characters');
      } catch (e2: any) {
        console.error('[SA Pass 2] Fallback parse also failed:', e2.message);
        throw new Error(`Pass 2 parse failed: ${e.message}. Fallback also failed: ${e2.message}`);
      }
    }
    
    console.log('[SA Pass 2] Narratives generated:', {
      headlineLength: narratives.headline.length,
      summaryLength: narratives.executiveSummary.length,
      tokens: tokensUsed,
      timeMs: generationTime
    });
    
    // Calculate totals
    const totalTokens = (report.llm_tokens_used || 0) + tokensUsed;
    const totalCost = (report.llm_cost || 0) + cost;
    const totalTime = (report.generation_time_ms || 0) + generationTime;
    
    // Update report with narratives
    const { error: updateError } = await supabaseClient
      .from('sa_audit_reports')
      .update({
        headline: narratives.headline,
        executive_summary: narratives.executiveSummary,
        cost_of_chaos_narrative: narratives.costOfChaosNarrative,
        time_freedom_narrative: narratives.timeFreedomNarrative,
        
        llm_model: 'claude-sonnet-4 + claude-opus-4',
        llm_tokens_used: totalTokens,
        llm_cost: totalCost,
        generation_time_ms: totalTime,
        prompt_version: 'v4-two-pass',
        
        status: 'generated',
        generated_at: new Date().toISOString()
      })
      .eq('engagement_id', engagementId);
    
    if (updateError) throw updateError;
    
    // Update engagement status
    await supabaseClient
      .from('sa_engagements')
      .update({ status: 'analysis_complete' })
      .eq('id', engagementId);
    
    console.log('[SA Pass 2] Complete:', {
      totalTokens,
      totalCost: `£${totalCost.toFixed(4)}`,
      totalTimeMs: totalTime
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        reportId: report.id,
        status: 'generated',
        headline: narratives.headline,
        pass2Tokens: tokensUsed,
        totalTokens,
        cost: `£${totalCost.toFixed(4)}`,
        generationTimeMs: totalTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[SA Pass 2] Error:', error);
    
    // Update report status to indicate pass 2 failed
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      const requestBody = await req.clone().json();
      const engagementId = requestBody.engagementId;
      
      if (engagementId) {
        await supabaseClient
          .from('sa_audit_reports')
          .update({
            status: 'pass2_failed',
            review_notes: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('engagement_id', engagementId);
      }
    } catch (e) {
      console.error('[SA Pass 2] Failed to update status:', e);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

