import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// TYPES
// =============================================================================

interface SystemAnalysis {
  name: string;
  category: string;
  criticality: string;
  monthlyCost: number;
  integrationMethod: string;
  integratesWith: string[];
  gaps: string[];
  strengths: string[];
  manualHours: number;
  dataQuality: number;
  userSatisfaction: number;
  painPoints: string[];
}

interface ProcessAnalysis {
  chainCode: string;
  chainName: string;
  keyPainPoints: string[];
  specificMetrics: Record<string, any>;
  hoursWasted: number;
  criticalGaps: string[];
  clientQuotes: string[];
}

interface ExtractedFacts {
  // Company context
  companyName: string;
  teamSize: number;
  projectedTeamSize: number;
  growthMultiplier: number;
  revenueBand: string;
  industry: string;
  
  // Their words (verbatim)
  breakingPoint: string;
  monthEndShame: string;
  expensiveMistake: string;
  magicFix: string;
  northStar: string | null;
  fears: string[];
  
  // System analysis
  systems: SystemAnalysis[];
  totalSystemCost: number;
  criticalSystems: string[];
  disconnectedSystems: string[];
  integrationGaps: string[];
  
  // Process analysis
  processes: ProcessAnalysis[];
  
  // Calculated metrics
  metrics: {
    quoteTimeMins: number;
    invoiceLagDays: number;
    reportingLagDays: number;
    monthEndCloseDays: number;
    targetCloseDays: number;
    debtorDays: number;
    transactionVolume: number;
    invoiceVolume: number;
    apVolume: number;
    employeeCount: number;
  };
  
  // Cost calculations
  hoursWastedWeekly: number;
  annualCostOfChaos: number;
  projectedCostAtScale: number;
  
  // All client quotes collected
  allClientQuotes: string[];
}

interface Finding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  evidence: string[];
  clientQuote: string;
  affectedSystems: string[];
  affectedProcesses: string[];
  hoursWastedWeekly: number;
  annualCostImpact: number;
  scalabilityImpact: string;
  recommendation: string;
}

interface QuickWin {
  title: string;
  action: string;
  systems: string[];
  timeToImplement: string;
  hoursSavedWeekly: number;
  annualBenefit: number;
  impact: string;
}

interface Recommendation {
  priorityRank: number;
  title: string;
  description: string;
  category: 'quick_win' | 'foundation' | 'strategic' | 'optimization';
  implementationPhase: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  systemsInvolved: string[];
  processesFixed: string[];
  estimatedCost: number;
  hoursSavedWeekly: number;
  annualBenefit: number;
  paybackMonths: number;
  freedomUnlocked: string;
}

interface Pass1Output {
  facts: ExtractedFacts;
  findings: Finding[];
  quickWins: QuickWin[];
  recommendations: Recommendation[];
  scores: {
    integration: { score: number; evidence: string };
    automation: { score: number; evidence: string };
    dataAccessibility: { score: number; evidence: string };
    scalability: { score: number; evidence: string };
  };
}

// =============================================================================
// PASS 1: EXTRACTION & ANALYSIS (Sonnet - structured data)
// =============================================================================

function buildPass1Prompt(discovery: any, systems: any[], deepDives: any[], clientName: string): string {
  // Build system details
  const systemDetails = systems.map(s => `
**${s.system_name}** (${s.category_code})
- Criticality: ${s.criticality}
- Cost: £${s.monthly_cost || 0}/mo
- Users: ${s.number_of_users || '?'} (${(s.primary_users || []).join(', ')})
- Integration: ${s.integration_method || 'none'}
- Manual transfer required: ${s.manual_transfer_required ? 'YES - ' + s.manual_hours_monthly + ' hrs/mo' : 'No'}
- Data quality: ${s.data_quality_score || '?'}/5
- User satisfaction: ${s.user_satisfaction || '?'}/5
- Known issues: "${s.known_issues || 'None specified'}"
- Workarounds: "${s.workarounds_in_use || 'None specified'}"
- Future plan: ${s.future_plan || 'keep'}
`).join('\n');

  // Build deep dive details
  const deepDiveDetails = deepDives.map(dd => {
    const responses = dd.responses || {};
    const pains = dd.key_pain_points || [];
    
    return `
### ${dd.chain_code.toUpperCase().replace(/_/g, ' ')}

**Pain Points (their words):**
${pains.map((p: string) => `- "${p}"`).join('\n')}

**All Responses:**
${Object.entries(responses).map(([k, v]) => `- ${k}: ${JSON.stringify(v)}`).join('\n')}
`;
  }).join('\n\n');

  return `
You are extracting structured data from a Systems Audit assessment. Your job is to:
1. Extract ALL facts, numbers, and quotes
2. Analyze each system's integration status
3. Analyze each process chain's gaps
4. Generate specific findings tied to systems and processes
5. Calculate realistic hours wasted

═══════════════════════════════════════════════════════════════════════════════
DISCOVERY DATA
═══════════════════════════════════════════════════════════════════════════════

Company: ${clientName}
Team Size: ${discovery.team_size} → ${discovery.expected_team_size_12mo} (12mo)
Revenue: ${discovery.revenue_band}
Industry: ${discovery.industry_sector}

**BREAKING POINT (verbatim):**
"${discovery.systems_breaking_point}"

**MONTH-END SHAME (verbatim):**
"${discovery.month_end_shame}"

**EXPENSIVE MISTAKE (verbatim):**
"${discovery.expensive_systems_mistake}"

**MAGIC FIX - THEIR EXACT GOAL (verbatim):**
"${discovery.magic_process_fix}"

Operations diagnosis: ${discovery.operations_self_diagnosis}
Manual hours estimate: ${discovery.manual_hours_monthly}
Month-end close: ${discovery.month_end_close_duration}
Data errors: ${discovery.data_error_frequency}
Integration rating: ${discovery.integration_rating}
Critical spreadsheets: ${discovery.critical_spreadsheets}
Change appetite: ${discovery.change_appetite}
Fears: ${(discovery.systems_fears || []).join(', ')}
Champion: ${discovery.internal_champion}

═══════════════════════════════════════════════════════════════════════════════
SYSTEM INVENTORY (${systems.length} systems)
═══════════════════════════════════════════════════════════════════════════════

${systemDetails}

═══════════════════════════════════════════════════════════════════════════════
PROCESS DEEP DIVES (${deepDives.length} processes)
═══════════════════════════════════════════════════════════════════════════════

${deepDiveDetails}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════════════════════

Analyze the data and return a JSON object with this structure:

{
  "facts": {
    "companyName": "${clientName}",
    "teamSize": number,
    "projectedTeamSize": number,
    "growthMultiplier": number (calculated),
    "revenueBand": "string",
    "industry": "string",
    
    "breakingPoint": "EXACT verbatim quote",
    "monthEndShame": "EXACT verbatim quote", 
    "expensiveMistake": "EXACT verbatim quote",
    "magicFix": "EXACT verbatim quote - do not paraphrase",
    "northStar": null,
    "fears": ["fear1", "fear2"],
    
    "systems": [
      {
        "name": "System name",
        "category": "category",
        "criticality": "critical|important|nice_to_have",
        "monthlyCost": number,
        "integrationMethod": "native|zapier_make|custom_api|manual|none",
        "integratesWith": ["other system names that this connects to"],
        "gaps": ["specific integration gap 1", "gap 2"],
        "strengths": ["what it does well"],
        "manualHours": number per month,
        "dataQuality": 1-5,
        "userSatisfaction": 1-5,
        "painPoints": ["specific pain from deep dives that relates to this system"]
      }
    ],
    "totalSystemCost": number,
    "criticalSystems": ["names of critical systems"],
    "disconnectedSystems": ["systems with no/manual integration"],
    "integrationGaps": ["Specific gap: System A doesn't talk to System B, causing X"],
    
    "processes": [
      {
        "chainCode": "quote_to_cash",
        "chainName": "Quote-to-Cash",
        "keyPainPoints": ["verbatim pain points"],
        "specificMetrics": {
          "quoteTimeMins": 90,
          "invoiceLagDays": 10,
          etc - all numbers from responses
        },
        "hoursWasted": calculated hours per month wasted in this process,
        "criticalGaps": ["specific gap causing waste"],
        "clientQuotes": ["relevant quotes from this chain"]
      }
    ],
    
    "metrics": {
      "quoteTimeMins": number,
      "invoiceLagDays": number,
      "reportingLagDays": number,
      "monthEndCloseDays": number,
      "targetCloseDays": number,
      "debtorDays": number,
      "transactionVolume": number,
      "invoiceVolume": number,
      "apVolume": number,
      "employeeCount": number
    },
    
    "hoursWastedWeekly": calculated total,
    "annualCostOfChaos": hours * 35 * 52,
    "projectedCostAtScale": annual * growth multiplier,
    
    "allClientQuotes": ["every significant verbatim quote from discovery and deep dives"]
  },
  
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "category": "integration_gap|manual_process|data_silo|single_point_failure|scalability_risk",
      "title": "Specific title referencing system or process",
      "description": "What's broken and why, using their words",
      "evidence": ["Specific data point 1", "Data point 2"],
      "clientQuote": "Their exact words",
      "affectedSystems": ["Xero", "Asana"],
      "affectedProcesses": ["quote_to_cash", "record_to_report"],
      "hoursWastedWeekly": number,
      "annualCostImpact": number,
      "scalabilityImpact": "What happens at 1.5x growth",
      "recommendation": "Specific fix"
    }
  ],
  
  "quickWins": [
    {
      "title": "Action with system name",
      "action": "Step 1, Step 2, Step 3",
      "systems": ["Xero", "Asana"],
      "timeToImplement": "X hours",
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "impact": "Specific outcome"
    }
  ],
  
  "recommendations": [
    {
      "priorityRank": 1,
      "title": "Recommendation with systems",
      "description": "How this fixes their specific problems",
      "category": "foundation",
      "implementationPhase": "immediate",
      "systemsInvolved": ["Xero", "Asana", "Harvest"],
      "processesFixed": ["quote_to_cash", "record_to_report"],
      "estimatedCost": number,
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "paybackMonths": number,
      "freedomUnlocked": "Connects to their magic fix verbatim"
    }
  ],
  
  "scores": {
    "integration": { 
      "score": 0-100, 
      "evidence": "X of Y systems have no integration. Specific gaps: A-B, C-D" 
    },
    "automation": { 
      "score": 0-100, 
      "evidence": "Specific manual processes: quote creation, invoice triggers, time backfill" 
    },
    "dataAccessibility": { 
      "score": 0-100, 
      "evidence": "25-day reporting lag. Can't answer X question in under Y minutes" 
    },
    "scalability": { 
      "score": 0-100, 
      "evidence": "At 1.5x growth, X breaks because Y" 
    }
  }
}

RULES:
1. Every finding must reference specific systems AND processes
2. Every recommendation must list which systems and processes it fixes
3. Use EXACT verbatim quotes - do not paraphrase their magic fix
4. Calculate hours realistically based on their actual volumes
5. Integration gaps must name both systems involved
6. Quick wins must be implementable in under 1 week

Return ONLY valid JSON.
`;
}

// =============================================================================
// PASS 2: NARRATIVE WRITING (Opus - quality prose)
// =============================================================================

function buildPass2Prompt(pass1: Pass1Output): string {
  const f = pass1.facts;
  
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
${f.integrationGaps.map(g => `- ${g}`).join('\n')}

THEIR WORDS DESCRIBING THE PATTERN:
- Breaking point: "${f.breakingPoint}"
- Month-end shame: "${f.monthEndShame}"

SPECIFIC METRICS PROVING THE PATTERN:
- Quotes take ${f.metrics.quoteTimeMins} mins (should be 30) because they're not linked to delivery scope
- Invoices lag ${f.metrics.invoiceLagDays} days (should be 2) because billing depends on memory
- Reports arrive ${f.metrics.reportingLagDays} days late (should be 5-7) so decisions come after the moment to act
- Month-end takes ${f.metrics.monthEndCloseDays} days (target: ${f.metrics.targetCloseDays}) because it's "part accounting, part detective work"

THE SYSTEMS INVOLVED:
${f.systems.map(s => `- ${s.name}: ${s.gaps.length > 0 ? s.gaps.join('; ') : 'Working well'}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
3. THE PRICE - Cost of Chaos
═══════════════════════════════════════════════════════════════════════════════

Hours wasted weekly: ${f.hoursWastedWeekly}
Annual cost: £${f.annualCostOfChaos.toLocaleString()}
At ${f.growthMultiplier}x growth: £${f.projectedCostAtScale.toLocaleString()}

BY PROCESS:
${f.processes.map(p => `- ${p.chainName}: ${p.hoursWasted} hours/month wasted - "${p.keyPainPoints[0] || 'No quote'}"`).join('\n')}

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
${pass1.findings.slice(0, 5).map((finding, i) => `
${i + 1}. ${finding.title}
   Systems: ${finding.affectedSystems.join(' → ')}
   Their words: "${finding.clientQuote}"
   Fixes: ${finding.recommendation}
`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
ALL CLIENT QUOTES (weave these in)
═══════════════════════════════════════════════════════════════════════════════

${f.allClientQuotes.map((q, i) => `${i + 1}. "${q}"`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
YOUR OUTPUT
═══════════════════════════════════════════════════════════════════════════════

Write these four narrative sections as a JSON object:

{
  "headline": "Under 25 words. Include the annual cost (£${f.annualCostOfChaos.toLocaleString()}) AND their goal phrase. Make it quotable for a proposal.",
  
  "executiveSummary": "Three paragraphs that tell the story:
    
    PARAGRAPH 1 - THE PROOF:
    Open with their expensive mistake. Not 'your systems have gaps' but 'You already know what broken visibility costs—a project that looked profitable delivered at break-even because [their exact words].' Make them feel it before you explain it. This is the hook.
    
    PARAGRAPH 2 - THE PATTERN:
    Now explain WHY that happened. Name the specific systems: 'When Harvest time entries don't flow to Asana project milestones, and Asana completion doesn't trigger Xero invoicing...' Use their numbers: ${f.metrics.quoteTimeMins}-min quotes, ${f.metrics.invoiceLagDays}-day invoice lag, ${f.metrics.reportingLagDays}-day reporting. Quote their month-end shame. Show this wasn't bad luck—it was structural.
    
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

═══════════════════════════════════════════════════════════════════════════════
ANTI-AI-SLOP WRITING RULES
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
- Streamline, optimize, holistic, impactful, scalable (consultant clichés)
- Best practices, digital transformation, moving forward (meaningless)

BANNED STRUCTURES:
- "Not only X but also Y" parallelisms (pick X or Y)
- "It's important to note..." / "In summary..." / "In conclusion..."
- Rule of three lists like "X, Y, and Z" (pick the best one)
- "Despite challenges, positioned for growth" formula
- "I want to be direct" / "Let me be honest" (just be direct/honest)
- Starting any paragraph with "Your" (vary openings)
- "Your systems are fundamentally sound" (too soft)
- Ending with "-ing" phrases ("ensuring excellence, fostering growth")

THE HUMAN TEST:
Read every sentence aloud. If it sounds like an annual report, rewrite it.
If it sounds like you explaining this over coffee, keep it.

REQUIRED ELEMENTS:
✓ Expensive mistake in first 2 sentences of executive summary
✓ Magic fix quoted EXACTLY, not paraphrased (all four parts)
✓ At least 3 system names per paragraph (Xero, Harvest, Asana, Dext, Stripe, etc.)
✓ At least 1 verbatim client quote per paragraph
✓ Specific numbers from their data, not rounded generalities
✓ One point per paragraph (don't cram three ideas together)
✓ End on concrete, not abstract (what they get, not what you recommend)

TONE:
- Confident, not apologetic
- Specific, not vague
- Story-driven, not list-driven
- Peer-to-peer, not consultant-to-client
- Short sentences. Active voice. Concrete nouns.

Return ONLY the JSON object with these four fields. No markdown wrapping.
`;
}

// =============================================================================
// MAIN HANDLER — Deprecated: redirects to Pass 1 pipeline (Pass 1 → Pass 2)
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const engagementId = body?.engagementId;
    const additionalContext = Array.isArray(body?.additionalContext) ? body.additionalContext : undefined;
    const preliminaryAnalysis = body?.preliminaryAnalysis && typeof body.preliminaryAnalysis === 'object' ? body.preliminaryAnalysis : undefined;

    if (!engagementId) {
      throw new Error('engagementId is required');
    }
    console.log('[SA Report Orchestrator] Redirecting to Pass 1 pipeline');
    console.log('[SA Report Orchestrator] engagementId:', engagementId, 'additionalContext:', additionalContext?.length ?? 0, 'preliminaryAnalysis:', !!preliminaryAnalysis);
    const pass1Url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-sa-report-pass1`;
    const pass1Response = await fetch(pass1Url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        engagementId,
        ...(additionalContext?.length ? { additionalContext } : {}),
        ...(preliminaryAnalysis ? { preliminaryAnalysis } : {}),
      })
    });
    const result = await pass1Response.json();
    return new Response(
      JSON.stringify({
        ...result,
        _note: 'Routed through deprecated orchestrator → Pass 1 pipeline'
      }),
      {
        status: pass1Response.ok ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[SA Report Orchestrator] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
