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

/** Must appear at the very top of the Opus prompt — reconciled DB + pass1_data only. */
function buildMandatoryNumbersLockBlock(pass1Data: any, report: any): string {
  const recs = pass1Data.recommendations || [];
  const findings = pass1Data.findings || [];
  const f = pass1Data.facts || {};

  const totalBenefit = Math.round(
    report.total_annual_benefit ??
      recs.reduce((s: number, r: any) => s + (r.annualBenefit || r.annual_cost_savings || 0), 0),
  );
  const totalInvestment = Math.round(
    report.total_recommended_investment ??
      recs.reduce((s: number, r: any) => s + (r.estimatedCost || r.estimated_cost || 0), 0),
  );
  const hoursReclaimable = Math.round(
    report.hours_reclaimable_weekly ??
      recs.reduce((s: number, r: any) => s + (parseFloat(r.hoursSavedWeekly || r.hours_saved_weekly) || 0), 0),
  );
  const paybackMonths = report.overall_payback_months ?? 0;
  const roiRatio = report.roi_ratio || (totalInvestment > 0 ? `${Math.round(totalBenefit / totalInvestment)}:1` : 'Infinite');
  const annualCostOfChaos = Math.round(report.total_annual_cost_of_chaos ?? f.annualCostOfChaos ?? 0);
  const hoursWastedWeekly = report.total_hours_wasted_weekly ?? f.hoursWastedWeekly ?? 0;
  const projectedCostAtScale = Math.round(report.projected_cost_at_scale ?? f.projectedCostAtScale ?? 0);

  const recsCount = recs.length;
  const findingsCount = findings.length;
  const criticalCount = findings.filter((x: any) => x.severity === 'critical').length;
  const highCount = findings.filter((x: any) => x.severity === 'high').length;
  const mediumCount = findings.filter((x: any) => x.severity === 'medium').length;
  const lowCount = findings.filter((x: any) => x.severity === 'low').length;

  return `═══ NUMBERS LOCK — MANDATORY ═══
Every number in your output MUST match one of these exactly. Do NOT 
approximate, round differently, or invent alternative figures.

Annual cost of chaos: £${annualCostOfChaos.toLocaleString()}
Hours wasted weekly: ${hoursWastedWeekly}
Projected at growth: £${projectedCostAtScale.toLocaleString()}
Total investment: £${totalInvestment.toLocaleString()}
Total annual benefit: £${totalBenefit.toLocaleString()}
Hours reclaimable: ${hoursReclaimable}
Payback: ${paybackMonths} months
ROI: ${roiRatio}
Recommendations: ${recsCount}
Findings: ${findingsCount} (${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low)

If rounding for prose, use: "£Xk" matching the locked figure 
(e.g., "£516k" for £515,980, NOT "£374k" or "£520k").
═══ END NUMBERS LOCK ═══

`;
}

/**
 * Repair JSON that has unescaped double quotes inside string values.
 * The AI often writes: "he said "whatever" and left" — the inner quotes break JSON.
 * Strategy: walk char-by-char tracking JSON structure; when a `"` appears inside a
 * string but is followed by a lowercase letter (not `, : } ]), it's an internal quote.
 */
function repairJsonQuotes(raw: string): string {
  let out = '';
  let inStr = false;
  let esc = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const code = ch.charCodeAt(0);

    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\') { out += ch; esc = true; continue; }

    if (ch === '"') {
      if (!inStr) {
        inStr = true;
        out += ch;
        continue;
      }
      // We're inside a string and hit a quote. Is this the real closing quote?
      // Look ahead: if next non-whitespace is , : } ] or end-of-string, it's a real close.
      let j = i + 1;
      while (j < raw.length && (raw[j] === ' ' || raw[j] === '\t')) j++;
      const next = j < raw.length ? raw[j] : '';
      if (next === '' || next === ',' || next === ':' || next === '}' || next === ']' || next === '\n' || next === '\r') {
        inStr = false;
        out += ch;
      } else {
        // Internal quote — escape it
        out += '\\"';
      }
      continue;
    }

    if (inStr) {
      if (code === 0x0A) { out += '\\n'; }
      else if (code === 0x0D) { out += '\\r'; }
      else if (code === 0x09) { out += '\\t'; }
      else if (code < 0x20) { out += `\\u${code.toString(16).padStart(4, '0')}`; }
      else { out += ch; }
    } else {
      out += ch;
    }
  }
  return out;
}

function buildPass2Prompt(pass1Data: any, report: any, platformDirection?: any): string {
  const f = pass1Data.facts;
  const numbersLock = buildMandatoryNumbersLockBlock(pass1Data, report);

  return `
${numbersLock}
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

╔══════════════════════════════════════════════════════════════════════════════╗
WHAT MAKES THIS CLIENT UNIQUE
╚══════════════════════════════════════════════════════════════════════════════╝

${pass1Data.uniquenessBrief || 'Not available — treat this as a generic brief and work harder to find specificity in the data below.'}

╔══════════════════════════════════════════════════════════════════════════════╗
WHERE THEY WANT THEIR OPERATIONS TO GET TO
╚══════════════════════════════════════════════════════════════════════════════╝

Their operational goals (top 3):
${(f.desiredOutcomes || []).map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}

Their Monday morning vision (QUOTE EXACTLY — this is the emotional anchor):
"${f.mondayMorningVision || f.magicFix}"

What they'd do with the time back:
"${f.timeFreedomPriority || 'Not specified'}"

The gap between now and there:
${f.aspirationGap || 'See findings for gap analysis.'}

CRITICAL FRAMING: This report is triage — stop the bleeding first. But the treatment plan must
PULL TOWARD their stated operational goals. Every recommendation should show the bridge from
current chaos to their Monday morning vision. Don't just say "this is broken." Say "this is
broken, and here's specifically how fixing it gets you closer to [their goal]."

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

Their framing to use: "${f.breakingPoint}" — use their own words, not ours.

═══════════════════════════════════════════════════════════════════════════════
4. THE PATH - Their Stated Goal (QUOTE EXACTLY)
═══════════════════════════════════════════════════════════════════════════════

DO NOT PARAPHRASE. This is what they said they want, word for word:

"${f.magicFix}"

Break their goal down by mapping each aspiration to specific system integrations.
Use ONLY systems from the inventory:
${(f.systems || []).map((s: any) => `- ${s.name} (${s.category}): integrates with ${(s.integratesWith || []).join(', ') || 'nothing'}`).join('\n')}

For each part of their magic fix, show which systems need to connect.
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
  "headline": "Under 25 words. Include the annual cost (£${Math.round(f.annualCostOfChaos || 0).toLocaleString()}) AND their goal phrase. Make it quotable for a proposal.",
  
  "executiveSummary": "Three paragraphs that tell the story:
    
    PARAGRAPH 1 - THE PROOF:
    Open with their expensive mistake. Not 'your systems have gaps' but 'You already know what broken visibility costs—a project that looked profitable delivered at break-even because [their exact words].' Make them feel it before you explain it. This is the hook.
    
    PARAGRAPH 2 - THE PATTERN:
    Now explain WHY that happened. Show specific system-to-system disconnects from the inventory. Name their actual systems, not generic examples. Use their numbers: ${f.metrics?.quoteTimeMins || '?'}-min quotes, ${f.metrics?.invoiceLagDays || '?'}-day invoice lag, ${f.metrics?.reportingLagDays || '?'}-day reporting. Quote their month-end shame. Show this wasn't bad luck—it was structural.
    
    PARAGRAPH 3 - THE PATH:
    Their operational goals: ${(f.desiredOutcomes || []).slice(0, 3).join(', ')}.
    Map the top 3 recommendations directly to these goals — not generic outcomes, THEIR outcomes.
    Show them the bridge: from [specific current pain] → through [specific fix] → to [their specific goal].
    Close with what Monday morning looks like after implementation — use their vision:
    '${f.mondayMorningVision || f.magicFix}'.",
    
  "costOfChaosNarrative": "One paragraph that:
    - Opens with 'The ${f.hoursWastedWeekly} hours your team loses each week aren't spread evenly...'
    - Breaks down by process with their quotes: 'Quote-to-Cash alone consumes X hours because [their words]'
    - References the expensive mistake as proof this isn't theoretical
    - Shows the scaling danger: 'At ${f.growthMultiplier}x growth, [specific pain point] becomes [specific crisis]'
    - Uses their own framing: \"${f.breakingPoint}\"",
    
  "timeFreedomNarrative": "Two paragraphs.
    
    PARAGRAPH 1 — THE BRIDGE:
    Start with their Monday morning vision: '${f.mondayMorningVision || f.magicFix}'
    Show how each key recommendation builds toward that specific picture.
    Map their actual systems to their actual goals:
    ${(f.systems || []).slice(0, 4).map((s: any) => `* ${s.name} → connects to [goal] by [specific change]`).join('\n      ')}
    Every sentence must name a real system AND a real goal from their desired_outcomes.
    
    PARAGRAPH 2 — THE FREEDOM:
    They said they'd use reclaimed time for: '${f.timeFreedomPriority || 'their core work'}'.
    Paint THEIR specific picture. If they said 'Clients — the work I'm actually good at' then
    show them back doing that work — not stuck in spreadsheets at 9pm. If they said 'My life
    outside work' then show them closing the laptop at a reasonable hour, not checking bank
    balances at 6am.
    End with their Monday morning vision as the closing image. Make it feel like a promise."
}

═══════════════════════════════════════════════════════════════════════════════
WRITING RULES - ANTI-AI-SLOP
═══════════════════════════════════════════════════════════════════════════════

BANNED VOCABULARY (never use):
- Additionally, Furthermore, Moreover (just continue the thought)
- Delve, delving (look at, examine, dig into)
- Crucial, pivotal, vital, key as adjective (important, or show why it matters)
- Testament to, underscores, highlights (shows, makes clear)
- Showcases, fostering, garnered (shows, building, got)
- Tapestry, landscape, ecosystem (figurative uses)
- Intricate, vibrant, enduring (puffery)
- Synergy, leverage (verb), value-add (corporate nonsense)
- Streamline, optimize, holistic, impactful, scalable (consultant clichés)
- Best practices, digital transformation, moving forward (meaningless)

BANNED SENTENCE STRUCTURES:
- "Not only X but also Y" parallelisms (pick X or Y)
- "It's important to note that..." (just say the thing)
- "In summary..." / "In conclusion..." (don't summarize, end)
- Rule of three lists like "X, Y, and Z" (pick the best one)
- "Despite challenges, positioned for growth" formula
- "I want to be direct" / "Let me be honest" (just be direct/honest)
- Starting any paragraph with "Your" (vary your openings)
- "Your systems are fundamentally sound" (too soft)
- Ending paragraphs with "-ing" phrases ("ensuring excellence, fostering growth")

THE HUMAN TEST:
Read every sentence aloud. If it sounds like an annual report, rewrite it.
If it sounds like you explaining this over coffee, keep it.

REQUIRED ELEMENTS:
✓ Expensive mistake in first 2 sentences of executive summary
✓ Magic fix quoted EXACTLY, not paraphrased (all four parts)
✓ At least 3 of THEIR system names per paragraph (use only systems from the inventory data)
✓ At least 1 verbatim client quote per paragraph
✓ Specific numbers from their data, not rounded generalities
✓ One point per paragraph (don't cram three ideas together)
✓ End on concrete, not abstract (what they get, not what you recommend)

TONE:
- Confident, not apologetic
- Specific, not vague
- Story-driven, not list-driven
- Peer-to-peer, not consultant-to-client
- Direct, not hedging
- Short sentences. Active voice. Concrete nouns.

EXAMPLE TRANSFORMATIONS:

BAD: "The comprehensive analysis underscores the pivotal importance of enhanced financial visibility, which plays a crucial role in fostering data-driven decision-making."

GOOD: "You can't make good decisions with bad numbers. This fixes the numbers."

BAD: "Not only does this address operational challenges, but it also positions you for sustainable long-term growth in an evolving market landscape."

GOOD: "This fixes the chaos. Then you can grow."

${platformDirection?.model === 'two_path' ? `
═══════════════════════════════════════════════════════════════════════════════
PLATFORM RECOMMENDATION — TWO-PATH FRAMING (MANDATORY)
═══════════════════════════════════════════════════════════════════════════════

The practice team has identified TWO viable technology paths for this client.

Path A: ${platformDirection.financial_core?.path_a?.name || 'Option A'} — ${platformDirection.financial_core?.path_a?.strategy || 'Upgrade existing platform'}
Path B: ${platformDirection.financial_core?.path_b?.name || 'Option B'} — ${platformDirection.financial_core?.path_b?.strategy || 'Migrate to new platform'}

RULES:
1. The headline MUST NOT commit to a single platform. Frame around the problem solved, not the solution.
   Good: "£Xk annual chaos cost blocks departmental MI while Y hours vanish weekly into manual workarounds"
   Bad: "Migrate to [platform] to save £Xk" — this commits to one path.

2. The executiveSummary paragraph 3 MUST present both paths:
   - Name both options and their key advantages
   - Show that BOTH resolve the core problems
   - Frame the choice around the client's decision timeline (e.g. contract renewal)
   - Close with: the right choice depends on whether they want to optimise what exists or build for the next decade.

3. NEVER reference ${platformDirection.xero_ruled_out ? 'Xero' : 'any platform not in the two paths'} as viable for this business.

4. The timeFreedomNarrative should describe the COMMON OUTCOME both paths deliver, then:
   "How you get there is a choice between two sound approaches."
` : ''}
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
    
    const { data: engRow } = await supabaseClient
      .from('sa_engagements').select('platform_direction').eq('id', engagementId).single();
    const platformDirection = engRow?.platform_direction ?? null;

    // Build and send prompt to Opus
    console.log('[SA Pass 2] Calling Opus for narratives...');
    const startTime = Date.now();
    
    const prompt = buildPass2Prompt(pass1Data, report, platformDirection);
    
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
      
      content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
      
      const firstBrace = content.indexOf('{');
      if (firstBrace > 0) content = content.substring(firstBrace);
      
      let braceCount = 0;
      let lastBrace = -1;
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') { braceCount--; if (braceCount === 0) { lastBrace = i; break; } }
      }
      if (lastBrace > 0) content = content.substring(0, lastBrace + 1);
      
      narratives = JSON.parse(repairJsonQuotes(content));
    } catch (e: any) {
      console.error('[SA Pass 2] Parse error:', e.message);
      console.error('[SA Pass 2] Content length:', result.choices[0].message.content.length);
      const errorPos = e.message.match(/position (\d+)/)?.[1];
      if (errorPos) {
        const pos = parseInt(errorPos);
        console.error('[SA Pass 2] Content around error position:', 
          result.choices[0].message.content.substring(Math.max(0, pos - 100), pos + 100));
      }
      
      // Fallback: try regex extraction of each field
      try {
        const raw = result.choices[0].message.content;
        const extract = (key: string): string => {
          const re = new RegExp(`"${key}"\\s*:\\s*"`, 'i');
          const match = re.exec(raw);
          if (!match) return '';
          const start = match.index + match[0].length;
          let depth = 0;
          let end = start;
          for (let i = start; i < raw.length; i++) {
            if (raw[i] === '\\') { i++; continue; }
            if (raw[i] === '"') {
              const after = raw.substring(i + 1).trimStart();
              if (after[0] === ',' || after[0] === '}' || after[0] === ']') { end = i; break; }
            }
          }
          return raw.substring(start, end).replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
        };
        narratives = {
          headline: extract('headline'),
          executiveSummary: extract('executiveSummary'),
          costOfChaosNarrative: extract('costOfChaosNarrative'),
          timeFreedomNarrative: extract('timeFreedomNarrative'),
        };
        if (!narratives.headline && !narratives.executiveSummary) {
          throw new Error('Could not extract any fields from response');
        }
        console.log('[SA Pass 2] Parsed via field-by-field extraction (unescaped quotes workaround)');
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

    // McKinsey validation: check narratives use correct numbers
    const f2 = pass1Data.facts || {};
    const recs2 = pass1Data.recommendations || [];
    const totalBenefit2 = recs2.reduce((s: number, r: any) => s + (r.annualBenefit || 0), 0);
    const annualStr = (f2.annualCostOfChaos || 0).toLocaleString();
    if (narratives.headline && !narratives.headline.includes(annualStr) && !narratives.headline.includes(`£${Math.round((f2.annualCostOfChaos || 0) / 1000)}k`)) {
      console.warn(`[SA McKinsey] Headline may use wrong annual cost. Expected £${annualStr}. Got: "${narratives.headline}"`);
    }
    const execAmounts = (narratives.executiveSummary || '').match(/£[\d,]+/g) || [];
    const knownAmounts = [
      f2.annualCostOfChaos, f2.projectedCostAtScale, totalBenefit2,
      ...recs2.map((r: any) => r.annualBenefit),
      ...recs2.map((r: any) => r.estimatedCost),
    ].filter(Boolean);
    for (const amt of execAmounts) {
      const numVal = parseInt(amt.replace(/[£,]/g, ''));
      if (numVal > 1000 && !knownAmounts.some((k: number) => Math.abs(numVal - k) < k * 0.05)) {
        console.warn(`[SA McKinsey] Executive summary contains unrecognised amount: ${amt}`);
      }
    }

    // Post-generation number correction: fix LLM hallucinations in headline/executiveSummary
    const correctNumbers = {
      annualCost: Math.round(f2.annualCostOfChaos || 0),
      benefit: Math.round(totalBenefit2),
      investment: Math.round(recs2.reduce((s: number, r: any) => s + (r.estimatedCost || 0), 0)),
      hours: Math.round(recs2.reduce((s: number, r: any) => s + (parseFloat(r.hoursSavedWeekly) || 0), 0)),
      recsCount: recs2.length,
    };

    const fixNumbers = (text: string): string => {
      if (!text) return text;
      let fixed = text;

      const costRegex = /£([\d,]+(?:\.\d+)?)/g;
      fixed = fixed.replace(costRegex, (match, numStr) => {
        const num = parseInt(numStr.replace(/,/g, ''), 10);
        if (isNaN(num) || num < 1000) return match;

        if (Math.abs(num - correctNumbers.annualCost) < correctNumbers.annualCost * 0.15 && num !== correctNumbers.annualCost) {
          console.log(`[SA McKinsey] Fixed annual cost: £${numStr} → £${correctNumbers.annualCost.toLocaleString()}`);
          return `£${correctNumbers.annualCost.toLocaleString()}`;
        }
        if (correctNumbers.benefit > 0 && Math.abs(num - correctNumbers.benefit) < correctNumbers.benefit * 0.15 && num !== correctNumbers.benefit) {
          console.log(`[SA McKinsey] Fixed benefit: £${numStr} → £${correctNumbers.benefit.toLocaleString()}`);
          return `£${correctNumbers.benefit.toLocaleString()}`;
        }
        if (correctNumbers.investment > 0 && Math.abs(num - correctNumbers.investment) < correctNumbers.investment * 0.30 && num !== correctNumbers.investment) {
          console.log(`[SA McKinsey] Fixed investment: £${numStr} → £${correctNumbers.investment.toLocaleString()}`);
          return `£${correctNumbers.investment.toLocaleString()}`;
        }
        return match;
      });

      const hoursRegex = /(\d+)\s*hours?\s*(reclaimed|reclaimable|saved|recovered|freed|back|weekly|per week|every week)/gi;
      fixed = fixed.replace(hoursRegex, (match, numStr, suffix) => {
        const num = parseInt(numStr, 10);
        if (num !== correctNumbers.hours && num > 10 && Math.abs(num - correctNumbers.hours) > 2) {
          console.log(`[SA McKinsey] Fixed hours: ${numStr} hours → ${correctNumbers.hours} hours`);
          return `${correctNumbers.hours} hours ${suffix}`;
        }
        return match;
      });

      return fixed;
    };

    if (narratives.headline) narratives.headline = fixNumbers(narratives.headline);
    if (narratives.executiveSummary) narratives.executiveSummary = fixNumbers(narratives.executiveSummary);
    console.log('[SA McKinsey] Post-generation number correction applied');

    // Calculate totals
    const totalTokens = (report.llm_tokens_used || 0) + tokensUsed;
    const totalCost = (report.llm_cost || 0) + cost;
    const totalTime = (report.generation_time_ms || 0) + generationTime;
    
    // Update report with narratives
    const { data: updatedReport, error: updateError } = await supabaseClient
      .from('sa_audit_reports')
      .update({
        status: 'generated',  // Mark report as complete for frontend polling
        headline: narratives.headline,
        executive_summary: narratives.executiveSummary,
        cost_of_chaos_narrative: narratives.costOfChaosNarrative,
        time_freedom_narrative: narratives.timeFreedomNarrative,
        
        llm_model: 'claude-sonnet-4 + claude-opus-4',
        llm_tokens_used: totalTokens,
        llm_cost: totalCost,
        generation_time_ms: totalTime,
        prompt_version: 'v4-two-pass',
        generated_at: new Date().toISOString()
      })
      .eq('engagement_id', engagementId)
      .select('id, status')
      .single();
    
    if (updateError) {
      console.error('[SA Pass 2] Update error:', updateError);
      throw updateError;
    }
    
    console.log('[SA Pass 2] Report updated:', { 
      reportId: updatedReport?.id, 
      status: updatedReport?.status 
    });
    
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

