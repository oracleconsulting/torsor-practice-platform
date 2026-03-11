// ============================================================================
// DISCOVERY REPORT - PASS 2B: NARRATIVE ENHANCEMENT (Opus)
// ============================================================================
// Enhances narrative sections of the Pass 2A report. Pass 2A produces the
// complete structural draft; this pass rewrites only prose for warmth and voice.
// If this fails, the Sonnet report remains intact and usable.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PASS2B_MODEL = 'anthropic/claude-opus-4.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Universal payroll figure enforcement (object-walking, JSON-safe — same as Pass 2A)
function fixPayrollInString(text: string, correctExcessK: number, correctMonthlyK: number, correctBenchmarkPct: number): { text: string; changed: boolean; count: number } {
  let result = text;
  let count = 0;
  if (text.length < 10) return { text, changed: false, count: 0 };

  if (/conservative|realistic|payback|valuation|worth|loan|borrowed|over \d+ years/i.test(text)) {
    result = result.replace(/staff costs at ([\d.]+)% vs the? (\d+)% benchmark/gi, (_match: string, _actual: string, bench: string) => {
      if (parseInt(bench) !== correctBenchmarkPct) { count++; return _match.replace(`${bench}%`, `${correctBenchmarkPct}%`); }
      return _match;
    });
    return { text: result, changed: count > 0, count };
  }

  const annualPatterns = [
    /£(\d{2,3})k\/year\s*(excess|in excess)/gi,
    /£(\d{2,3})k\s*(excess|annual|per year|a year)/gi,
    /bleeding\s*£(\d{2,3})k/gi,
    /£(\d{2,3})k\s*more than/gi,
    /excess.*?£(\d{2,3})k/gi,
    /£(\d{2,3})k.*?excess/gi,
  ];
  for (const pattern of annualPatterns) {
    result = result.replace(pattern, (match: string, amount: string) => {
      const num = parseInt(amount);
      if (Math.abs(num - correctExcessK) / correctExcessK < 0.2) return match;
      if (num > correctExcessK * 1.5 && num < correctExcessK * 5) { count++; return match.replace(`£${amount}k`, `£${correctExcessK}k`); }
      return match;
    });
  }

  const monthlyPatterns = [/£(\d{1,3})k\s*walks?\s*out/gi, /£(\d{1,3})k\s*a\s*month/gi, /£(\d{1,3})k\/month/gi, /£(\d{1,3})k\s*every\s*month/gi];
  for (const pattern of monthlyPatterns) {
    result = result.replace(pattern, (match: string, amount: string) => {
      const num = parseInt(amount);
      if (num === correctMonthlyK) return match;
      if (num > correctMonthlyK * 2 && num < correctMonthlyK * 6) { count++; return match.replace(`£${amount}k`, `£${correctMonthlyK}k`); }
      return match;
    });
  }

  result = result.replace(/the\s+(\d{2,3})%\s+benchmark/gi, (match: string, pct: string) => {
    const num = parseInt(pct); if (num === correctBenchmarkPct) return match;
    if (num >= 20 && num <= 55) { count++; return match.replace(`${num}%`, `${correctBenchmarkPct}%`); } return match;
  });
  result = result.replace(/vs\s+(?:the\s+)?(\d{2,3})%/gi, (match: string, pct: string) => {
    const num = parseInt(pct); if (num === correctBenchmarkPct) return match;
    if (num >= 20 && num <= 55) { count++; return match.replace(`${num}%`, `${correctBenchmarkPct}%`); } return match;
  });

  return { text: result, changed: count > 0, count };
}

function enforcePayrollInObject(obj: any, correctExcessK: number, correctMonthlyK: number, correctBenchmarkPct: number): number {
  let replacements = 0;
  if (!obj || correctExcessK <= 0) return 0;
  if (typeof obj === 'string') return 0;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') { const r = fixPayrollInString(obj[i], correctExcessK, correctMonthlyK, correctBenchmarkPct); if (r.changed) { obj[i] = r.text; replacements += r.count; } }
      else { replacements += enforcePayrollInObject(obj[i], correctExcessK, correctMonthlyK, correctBenchmarkPct); }
    }
    return replacements;
  }
  if (typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') { const r = fixPayrollInString(obj[key], correctExcessK, correctMonthlyK, correctBenchmarkPct); if (r.changed) { obj[key] = r.text; replacements += r.count; } }
      else { replacements += enforcePayrollInObject(obj[key], correctExcessK, correctMonthlyK, correctBenchmarkPct); }
    }
  }
  return replacements;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { engagementId } = await req.json();
    if (!engagementId) throw new Error('engagementId required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const startTime = Date.now();

    // ====================================================================
    // FETCH: Report (from Pass 2A) + Assessment responses
    // ====================================================================

    const { data: report, error: reportError } = await supabase
      .from('discovery_reports')
      .select(`
        engagement_id,
        destination_report,
        page1_destination,
        page2_gaps,
        page3_journey,
        page4_numbers,
        page5_next_steps,
        headline,
        comprehensive_analysis
      `)
      .eq('engagement_id', engagementId)
      .maybeSingle();

    if (reportError || !report) {
      throw new Error('No Pass 2A report found — run Pass 2A first');
    }

    // Get assessment responses for emotional context
    const { data: engagement } = await supabase
      .from('discovery_engagements')
      .select(`
        client:practice_members!discovery_engagements_client_id_fkey(
          id, name, email, client_company
        ),
        discovery:destination_discovery(*)
      `)
      .eq('id', engagementId)
      .maybeSingle();

    const clientName = engagement?.client?.name?.split(' ')[0] || 'there';
    const discovery = Array.isArray(engagement?.discovery) ? engagement.discovery[0] : engagement?.discovery;
    const responses = discovery?.responses || {};

    // Extract the key emotional anchors from responses
    const emotionalContext = {
      tuesdayTest: responses.dd_five_year_picture || responses.dd_tuesday_test || responses.dd_five_year_vision || '',
      businessRelationship: responses.dd_business_relationship || responses.rl_business_relationship || '',
      sacrifice: responses.dd_what_sacrificed || responses.ht_sacrifice || '',
      sleepThief: responses.dd_sleep_thief || responses.rl_sleep_thief || '',
      hardTruth: responses.dd_hard_truth || responses.ht_hard_truth || '',
      avoidedConversation: responses.dd_avoided_conversation || responses.ht_avoided_conversation || '',
      coreFrustration: responses.dd_core_frustration || responses.rl_core_frustration || '',
      magicFix: responses.dd_magic_fix || responses.dd_90_day_magic || '',
      lastBreak: responses.dd_last_break || responses.rl_last_break || '',
      neverHadBreak: (responses.dd_last_break || responses.rl_last_break || '').toLowerCase().includes('never'),
    };

    // ====================================================================
    // BUILD OPUS PROMPT — focused narrative rewrite only
    // ====================================================================

    const currentReport = report.destination_report || {};
    const page1 = report.page1_destination || currentReport.page1_destination || {};
    const page2 = report.page2_gaps || currentReport.page2_gaps || {};
    const page3 = report.page3_journey || currentReport.page3_journey || {};
    const page4 = report.page4_numbers || currentReport.page4_numbers || {};
    const page5 = report.page5_next_steps || currentReport.page5_nextSteps || {};

    const payrollExcessK = Math.round((report.comprehensive_analysis?.payroll?.annualExcess || 0) / 1000);
    const payrollMonthlyK = Math.round(payrollExcessK / 12);
    const payrollBenchmark = report.comprehensive_analysis?.payroll?.benchmark?.good || 38;

    const prompt = `You are a narrative specialist enhancing a business advisory report.

⛔⛔⛔ CRITICAL NUMBER CONSTRAINT ⛔⛔⛔
The payroll excess for this client is EXACTLY £${payrollExcessK}k/year.
The monthly figure is EXACTLY £${payrollMonthlyK}k/month.
The benchmark is ${payrollBenchmark}%.
DO NOT use any other payroll figure. Use ONLY the exact numbers above.

A structural draft has already been generated with correct data, prices, and schema.
Your job is to rewrite ONLY the narrative sections to make them sound human, warm,
direct, and deeply personal to ${clientName}.

============================================================================
CLIENT EMOTIONAL CONTEXT
============================================================================
Tuesday Test (their vision): "${emotionalContext.tuesdayTest}"
Business relationship: "${emotionalContext.businessRelationship}"
What they've sacrificed: "${emotionalContext.sacrifice}"
What keeps them awake: "${emotionalContext.sleepThief}"
Hard truth: "${emotionalContext.hardTruth}"
Avoided conversation: "${emotionalContext.avoidedConversation}"
Core frustration: "${emotionalContext.coreFrustration}"
Magic fix (90 days): "${emotionalContext.magicFix}"
Last proper break: "${emotionalContext.lastBreak}"

============================================================================
MANDATORY FINANCIAL FIGURES — USE THESE EXACT NUMBERS
============================================================================
${report.comprehensive_analysis?.payroll ? `Payroll excess: £${payrollExcessK}k/year (monthly: £${payrollMonthlyK}k). Benchmark: ${payrollBenchmark}%` : ''}
${report.comprehensive_analysis?.costOfInaction ? `Cost of inaction: £${Math.round((report.comprehensive_analysis.costOfInaction.totalOverHorizon || 0) / 1000)}k+ over ${report.comprehensive_analysis.costOfInaction.timeHorizon || 4} years` : ''}
${report.comprehensive_analysis?.valuation ? `Valuation range: £${(report.comprehensive_analysis.valuation.conservativeValue / 1000000).toFixed(1)}M - £${(report.comprehensive_analysis.valuation.optimisticValue / 1000000).toFixed(1)}M` : ''}

============================================================================
WRITING STYLE
============================================================================
- Write like a smart friend who happens to understand business inside out
- Short paragraphs (2-3 sentences max)
- Quote ${clientName}'s exact words back to them (8+ times)
- Empathy before solutions — name their pain before offering hope
- No corporate buzzwords: no "leverage", "streamline", "holistic", "ecosystem"
- No "Not only X but also Y" structures
- British English throughout
- Contractions are fine. Imperfect grammar is fine. Sound human.
- Punch, don't pad. If you can say it in 5 words, don't use 15.

============================================================================
CURRENT REPORT (from structural pass)
============================================================================

PAGE 1 — VISION:
${JSON.stringify(page1, null, 2)}

PAGE 2 — GAPS:
${JSON.stringify(page2, null, 2)}

PAGE 3 — JOURNEY:
${JSON.stringify(page3, null, 2)}

PAGE 4 — NUMBERS:
${JSON.stringify(page4, null, 2)}

PAGE 5 — NEXT STEPS:
${JSON.stringify(page5, null, 2)}

============================================================================
YOUR TASK
============================================================================

Rewrite ONLY these specific fields. Return a JSON object with exactly
this structure. Include ONLY the fields listed below — do not return
full pages or any fields not listed here.

⛔ DO NOT change any financial figures, service names, prices, or scores.
⛔ DO NOT change the JSON structure or add/remove fields.
⛔ DO NOT fabricate quotes — only use words from the CLIENT EMOTIONAL CONTEXT above.

{
  "headline": "A punchy one-sentence headline for the whole report. Use their words.",

  "page1_rewrites": {
    "visionVerbatim": "Their Tuesday Test answer rewritten in FIRST PERSON with warmth and specificity. Keep their exact words but smooth the flow. Include specific details. Do NOT change to second person.",
    "clarityExplanation": "One honest sentence about how clear their vision is."
  },

  "page2_rewrites": {
    "openingLine": "A punchy one-liner capturing their core tension. Use their metaphor if powerful.",
    "gaps": [
      {
        "index": 0,
        "title": "Outcome-focused title (not problem-focused)",
        "pattern": "Their exact words showing this pattern — DIRECT QUOTES only",
        "emotionalImpact": "The personal cost, in their words",
        "shiftRequired": "One sentence. What needs to change."
      }
    ]
  },

  "page3_rewrites": {
    "phases": [
      {
        "index": 0,
        "headline": "Outcome headline — what they GET, not what we DO",
        "feelsLike": "Emotional description using their language. What transformation FEELS like.",
        "outcome": "Single sentence: the tangible result they can point to"
      }
    ]
  },

  "page4_rewrites": {
    "personalCost": "SPECIFIC personal cost using their words. Sacrifice. Marriage. Health. Time.",
    "realReturn": "Connect the numbers to their life. What does the valuation mean for their family, their freedom, their Tuesday mornings? Do NOT start with 'But the real return?'"
  },

  "page5_rewrites": {
    "thisWeekTone": "Reassurance this isn't a sales pitch. What will actually happen.",
    "theAsk": "2-3 sentences. Acknowledge past failures. Offer the practical path.",
    "closingLine": "One line. Let's talk this week.",
    "urgencyAnchor": "Personal anchor with time-based urgency. Kids. Health. Marriage. Whatever they mentioned."
  }
}

FINAL CHECK: If your headline or any rewritten text contains "£476k" or "£40k" or "30% benchmark", you have used the WRONG numbers. The correct excess is £${payrollExcessK}k/year against a ${payrollBenchmark}% benchmark.

Return ONLY this JSON object. No markdown fences. No preamble.`;

    // ====================================================================
    // CALL OPUS
    // ====================================================================

    console.log('[Pass2B] Calling Opus for narrative enhancement...');
    const llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Discovery Pass 2B'
      },
      body: JSON.stringify({
        model: PASS2B_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,   // Higher for creative narrative
        max_tokens: 6000   // Much less needed — just prose rewrites
      })
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      throw new Error(`OpenRouter API error: ${errText}`);
    }

    const llmData = await llmResponse.json();
    let responseText = llmData.choices[0].message.content.trim();
    responseText = responseText.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();

    let rewrites;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rewrites = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in Opus response');
      }
    } catch (parseError: unknown) {
      const errMsg = parseError instanceof Error ? parseError.message : 'Parse error';
      console.error('[Pass2B] Parse error:', errMsg);
      console.error('[Pass2B] Response (first 1000):', responseText.substring(0, 1000));
      // Non-fatal — the Sonnet report is already saved
      return new Response(
        JSON.stringify({
          success: false,
          error: `Opus parse failed: ${errMsg}`,
          fallback: 'Sonnet report remains intact'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ================================================================
    // UNIVERSAL PAYROLL FIGURE ENFORCEMENT — after Opus parse
    // ================================================================
    console.log(`[Pass2B] Correct payroll figures: £${payrollExcessK}k/year, £${payrollMonthlyK}k/month, ${payrollBenchmark}% benchmark`);
    if (payrollExcessK > 0) {
      const prCount = enforcePayrollInObject(rewrites, payrollExcessK, payrollMonthlyK, payrollBenchmark);
      if (prCount > 0) console.log(`[Pass2B Payroll Enforcement] Fixed ${prCount} figures in Opus rewrites`);
    }

    const tokensUsed = llmData.usage?.total_tokens || 0;
    console.log('[Pass2B] Opus response parsed. Tokens:', tokensUsed);

    // ====================================================================
    // APPLY REWRITES — merge Opus narrative into Sonnet structure
    // ====================================================================

    // Page 1
    const updatedPage1 = { ...page1 };
    if (rewrites.page1_rewrites?.visionVerbatim) {
      updatedPage1.visionVerbatim = rewrites.page1_rewrites.visionVerbatim;
    }
    if (rewrites.page1_rewrites?.clarityExplanation) {
      updatedPage1.clarityExplanation = rewrites.page1_rewrites.clarityExplanation;
    }

    // Page 2
    const updatedPage2 = { ...page2 };
    if (rewrites.page2_rewrites?.openingLine) {
      updatedPage2.openingLine = rewrites.page2_rewrites.openingLine;
    }
    if (rewrites.page2_rewrites?.gaps && Array.isArray(page2.gaps)) {
      for (const gapRewrite of rewrites.page2_rewrites.gaps) {
        const idx = gapRewrite.index;
        if (idx >= 0 && idx < updatedPage2.gaps.length) {
          if (gapRewrite.title) updatedPage2.gaps[idx].title = gapRewrite.title;
          if (gapRewrite.pattern) updatedPage2.gaps[idx].pattern = gapRewrite.pattern;
          if (gapRewrite.emotionalImpact) updatedPage2.gaps[idx].emotionalImpact = gapRewrite.emotionalImpact;
          if (gapRewrite.shiftRequired) updatedPage2.gaps[idx].shiftRequired = gapRewrite.shiftRequired;
        }
      }
    }

    // Page 3
    const updatedPage3 = { ...page3 };
    if (rewrites.page3_rewrites?.phases && Array.isArray(page3.phases)) {
      for (const phaseRewrite of rewrites.page3_rewrites.phases) {
        const idx = phaseRewrite.index;
        if (idx >= 0 && idx < updatedPage3.phases.length) {
          if (phaseRewrite.headline) updatedPage3.phases[idx].headline = phaseRewrite.headline;
          if (phaseRewrite.feelsLike) updatedPage3.phases[idx].feelsLike = phaseRewrite.feelsLike;
          if (phaseRewrite.outcome) updatedPage3.phases[idx].outcome = phaseRewrite.outcome;
        }
      }
    }

    // Page 4
    const updatedPage4 = { ...page4 };
    if (rewrites.page4_rewrites?.personalCost) {
      updatedPage4.personalCost = rewrites.page4_rewrites.personalCost;
    }
    if (rewrites.page4_rewrites?.realReturn) {
      updatedPage4.realReturn = rewrites.page4_rewrites.realReturn;
    }

    // Page 5
    const updatedPage5 = { ...(report.page5_next_steps || currentReport.page5_nextSteps || {}) };
    if (rewrites.page5_rewrites?.thisWeekTone) {
      if (!updatedPage5.thisWeek) updatedPage5.thisWeek = {};
      updatedPage5.thisWeek.tone = rewrites.page5_rewrites.thisWeekTone;
    }
    if (rewrites.page5_rewrites?.theAsk) {
      updatedPage5.theAsk = rewrites.page5_rewrites.theAsk;
    }
    if (rewrites.page5_rewrites?.closingLine) {
      updatedPage5.closingLine = rewrites.page5_rewrites.closingLine;
    }
    if (rewrites.page5_rewrites?.urgencyAnchor) {
      updatedPage5.urgencyAnchor = rewrites.page5_rewrites.urgencyAnchor;
    }

    // Build updated destination_report with merged content
    const updatedDestinationReport = {
      ...currentReport,
      page1_destination: updatedPage1,
      page2_gaps: updatedPage2,
      page3_journey: updatedPage3,
      page4_numbers: updatedPage4,
      page5_nextSteps: updatedPage5,
      meta: {
        ...currentReport.meta,
        headline: rewrites.headline || currentReport.meta?.headline,
        narrativeModel: PASS2B_MODEL,
        narrativeEnhancedAt: new Date().toISOString()
      }
    };

    // ====================================================================
    // QUOTE VERIFICATION — lightweight, on Opus output only
    // ====================================================================
    const allResponseText = JSON.stringify(responses).toLowerCase();
    const rewriteText = JSON.stringify(rewrites).toLowerCase();
    const directQuotes = rewriteText.match(/"([^"]{20,80})"/g) || [];
    let fabricatedCount = 0;
    for (const q of directQuotes) {
      const clean = q.replace(/^"|"$/g, '').toLowerCase().trim();
      if (clean.length < 20) continue;
      if (/^(you'?ll |the |from |a |someone )/.test(clean)) continue;
      if (!allResponseText.includes(clean)) {
        console.warn(`[Pass2B] ⚠️ Possible fabricated quote: "${clean.substring(0, 60)}..."`);
        fabricatedCount++;
      }
    }
    if (fabricatedCount > 0) {
      console.warn(`[Pass2B] ${fabricatedCount} possible fabricated quotes detected`);
    }

    // ====================================================================
    // FINAL PAYROLL SWEEP on merged pages (object-walking)
    // ====================================================================
    if (payrollExcessK > 0) {
      let sweepCount = 0;
      sweepCount += enforcePayrollInObject(updatedPage2, payrollExcessK, payrollMonthlyK, payrollBenchmark);
      sweepCount += enforcePayrollInObject(updatedPage4, payrollExcessK, payrollMonthlyK, payrollBenchmark);
      sweepCount += enforcePayrollInObject(updatedPage5, payrollExcessK, payrollMonthlyK, payrollBenchmark);
      if (typeof rewrites.headline === 'string') {
        const hr = fixPayrollInString(rewrites.headline, payrollExcessK, payrollMonthlyK, payrollBenchmark);
        if (hr.changed) { rewrites.headline = hr.text; sweepCount += hr.count; }
      }
      if (sweepCount > 0) console.log(`[Pass2B Payroll Enforcement] Fixed ${sweepCount} figures in merged pages`);
    }

    // ====================================================================
    // SAVE — update narrative fields only
    // ====================================================================

    const { error: updateError } = await supabase
      .from('discovery_reports')
      .update({
        headline: rewrites.headline || report.headline,
        destination_report: updatedDestinationReport,
        page1_destination: updatedPage1,
        page2_gaps: updatedPage2,
        page3_journey: updatedPage3,
        page4_numbers: updatedPage4,
        page5_next_steps: updatedPage5,
        status: 'published',
        ready_for_client: true,
        published_to_client_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('engagement_id', engagementId);

    if (updateError) {
      console.error('[Pass2B] ❌ Save failed:', updateError.message);
      throw new Error(`Save failed: ${updateError.message}`);
    }

    // Update engagement status
    await supabase
      .from('discovery_engagements')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', engagementId);

    const processingTime = Date.now() - startTime;
    console.log(`[Pass2B] ✅ Narrative enhancement complete in ${processingTime}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        engagementId,
        processingTimeMs: processingTime,
        tokensUsed,
        fabricatedQuotesDetected: fabricatedCount,
        fieldsEnhanced: Object.keys(rewrites).length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Pass2B] Error:', errMsg);

    return new Response(
      JSON.stringify({
        error: errMsg,
        note: 'Pass 2A report remains intact — Sonnet report is still usable'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
