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
// MAIN HANDLER
// =============================================================================

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
    
    console.log('[SA Report v3] Starting two-pass generation for:', engagementId);
    
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
    
    if (engagementError || !engagement) {
      throw new Error(`Failed to fetch engagement: ${engagementError?.message || 'Not found'}`);
    }
    
    if (discoveryError || !discovery) {
      throw new Error(`Failed to fetch discovery: ${discoveryError?.message || 'Not found'}`);
    }
    
    // Get client name
    let clientName = 'the business';
    if (engagement.client_id) {
      const { data: client } = await supabaseClient
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || client?.name || 'the business';
    }
    
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }
    
    // =========================================================================
    // PASS 1: Extraction & Analysis (Sonnet)
    // =========================================================================
    
    console.log('[SA Report v3] Pass 1: Extracting structured data with Sonnet...');
    const pass1Start = Date.now();
    
    const pass1Prompt = buildPass1Prompt(discovery, systems || [], deepDives || [], clientName);
    
    const pass1Response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor SA Pass 1'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: pass1Prompt }],
        temperature: 0.1,
        max_tokens: 8000
      })
    });
    
    if (!pass1Response.ok) {
      throw new Error(`Pass 1 failed: ${await pass1Response.text()}`);
    }
    
    const pass1Result = await pass1Response.json();
    const pass1Time = Date.now() - pass1Start;
    const pass1Tokens = pass1Result.usage?.total_tokens || 0;
    
    let pass1Data: Pass1Output;
    try {
      let content = pass1Result.choices[0].message.content.trim();
      content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
      const firstBrace = content.indexOf('{');
      if (firstBrace > 0) content = content.substring(firstBrace);
      pass1Data = JSON.parse(content);
    } catch (e: any) {
      console.error('[SA Report v3] Pass 1 parse error:', e.message);
      throw new Error(`Pass 1 parse failed: ${e.message}`);
    }
    
    console.log('[SA Report v3] Pass 1 complete:', {
      systems: pass1Data.facts.systems.length,
      processes: pass1Data.facts.processes.length,
      findings: pass1Data.findings.length,
      hoursWasted: pass1Data.facts.hoursWastedWeekly,
      tokens: pass1Tokens,
      timeMs: pass1Time
    });
    
    // =========================================================================
    // PASS 2: Narrative Writing (Opus)
    // =========================================================================
    
    console.log('[SA Report v3] Pass 2: Writing narratives with Opus...');
    const pass2Start = Date.now();
    
    const pass2Prompt = buildPass2Prompt(pass1Data);
    
    const pass2Response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor SA Pass 2'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4',
        messages: [{ role: 'user', content: pass2Prompt }],
        temperature: 0.3,
        max_tokens: 4000
      })
    });
    
    if (!pass2Response.ok) {
      throw new Error(`Pass 2 failed: ${await pass2Response.text()}`);
    }
    
    const pass2Result = await pass2Response.json();
    const pass2Time = Date.now() - pass2Start;
    const pass2Tokens = pass2Result.usage?.total_tokens || 0;
    
    let narratives: {
      headline: string;
      executiveSummary: string;
      costOfChaosNarrative: string;
      timeFreedomNarrative: string;
    };
    
    try {
      let content = pass2Result.choices[0].message.content.trim();
      content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
      const firstBrace = content.indexOf('{');
      if (firstBrace > 0) content = content.substring(firstBrace);
      narratives = JSON.parse(content);
    } catch (e: any) {
      console.error('[SA Report v3] Pass 2 parse error:', e.message);
      throw new Error(`Pass 2 parse failed: ${e.message}`);
    }
    
    console.log('[SA Report v3] Pass 2 complete:', {
      headlineLength: narratives.headline.length,
      summaryLength: narratives.executiveSummary.length,
      tokens: pass2Tokens,
      timeMs: pass2Time
    });
    
    // =========================================================================
    // COMBINE & SAVE
    // =========================================================================
    
    const totalTokens = pass1Tokens + pass2Tokens;
    const totalTime = pass1Time + pass2Time;
    // Sonnet: ~$3/MTok, Opus: ~$15/MTok
    const cost = (pass1Tokens / 1000000 * 3) + (pass2Tokens / 1000000 * 15);
    
    const f = pass1Data.facts;
    const scores = pass1Data.scores;
    
    // Determine sentiment
    let sentiment = 'good_with_gaps';
    const avgScore = (scores.integration.score + scores.automation.score + scores.dataAccessibility.score + scores.scalability.score) / 4;
    if (avgScore >= 70) sentiment = 'strong_foundation';
    else if (avgScore >= 50) sentiment = 'good_with_gaps';
    else if (avgScore >= 30) sentiment = 'significant_issues';
    else sentiment = 'critical_attention';
    
    // Save report
    const { data: report, error: saveError } = await supabaseClient
      .from('sa_audit_reports')
      .upsert({
        engagement_id: engagementId,
        
        headline: narratives.headline,
        executive_summary: narratives.executiveSummary,
        executive_summary_sentiment: sentiment,
        
        total_hours_wasted_weekly: f.hoursWastedWeekly,
        total_annual_cost_of_chaos: f.annualCostOfChaos,
        growth_multiplier: f.growthMultiplier,
        projected_cost_at_scale: f.projectedCostAtScale,
        cost_of_chaos_narrative: narratives.costOfChaosNarrative,
        
        systems_count: f.systems.length,
        integration_score: scores.integration.score,
        automation_score: scores.automation.score,
        data_accessibility_score: scores.dataAccessibility.score,
        scalability_score: scores.scalability.score,
        
        critical_findings_count: pass1Data.findings.filter(f => f.severity === 'critical').length,
        high_findings_count: pass1Data.findings.filter(f => f.severity === 'high').length,
        medium_findings_count: pass1Data.findings.filter(f => f.severity === 'medium').length,
        low_findings_count: pass1Data.findings.filter(f => f.severity === 'low').length,
        
        quick_wins: pass1Data.quickWins,
        
        total_recommended_investment: pass1Data.recommendations.reduce((sum, r) => sum + r.estimatedCost, 0),
        total_annual_benefit: pass1Data.recommendations.reduce((sum, r) => sum + r.annualBenefit, 0),
        overall_payback_months: Math.round(
          pass1Data.recommendations.reduce((sum, r) => sum + r.estimatedCost, 0) /
          (pass1Data.recommendations.reduce((sum, r) => sum + r.annualBenefit, 0) / 12)
        ),
        roi_ratio: `${(pass1Data.recommendations.reduce((sum, r) => sum + r.annualBenefit, 0) / 
          Math.max(1, pass1Data.recommendations.reduce((sum, r) => sum + r.estimatedCost, 0))).toFixed(1)}:1`,
        
        hours_reclaimable_weekly: pass1Data.recommendations.reduce((sum, r) => sum + r.hoursSavedWeekly, 0),
        time_freedom_narrative: narratives.timeFreedomNarrative,
        what_this_enables: [
          `${f.magicFix.substring(0, 100)}...`,
          'Decision-grade numbers within 7 days of month-end',
          'Hiring and pricing decisions based on data, not debates'
        ],
        
        client_quotes_used: f.allClientQuotes.slice(0, 10),
        
        llm_model: 'claude-sonnet-4 + claude-opus-4',
        llm_tokens_used: totalTokens,
        llm_cost: cost,
        generation_time_ms: totalTime,
        prompt_version: 'v4-two-pass',
        
        status: 'generated',
        generated_at: new Date().toISOString()
      }, { onConflict: 'engagement_id' })
      .select()
      .single();
    
    if (saveError) throw saveError;
    
    // Clear and save findings
    await supabaseClient.from('sa_findings').delete().eq('engagement_id', engagementId);
    
    for (const finding of pass1Data.findings) {
      await supabaseClient.from('sa_findings').insert({
        engagement_id: engagementId,
        finding_code: `F-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        source_stage: 'ai_generated',
        category: finding.category,
        severity: finding.severity,
        title: finding.title,
        // Include systems and processes in description for context
        description: `${finding.description}\n\nSystems affected: ${finding.affectedSystems.join(', ')}\nProcesses affected: ${finding.affectedProcesses.join(', ')}`,
        evidence: finding.evidence,
        client_quote: finding.clientQuote,
        hours_wasted_weekly: finding.hoursWastedWeekly,
        annual_cost_impact: finding.annualCostImpact,
        scalability_impact: finding.scalabilityImpact,
        recommendation: finding.recommendation
      });
    }
    
    // Clear and save recommendations
    await supabaseClient.from('sa_recommendations').delete().eq('engagement_id', engagementId);
    
    for (const rec of pass1Data.recommendations) {
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
    
    console.log('[SA Report v3] Complete:', {
      reportId: report.id,
      pass1Tokens,
      pass2Tokens,
      totalCost: `£${cost.toFixed(4)}`,
      totalTimeMs: totalTime
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        reportId: report.id,
        headline: narratives.headline,
        hoursWasted: f.hoursWastedWeekly,
        annualCost: f.annualCostOfChaos,
        pass1Tokens,
        pass2Tokens,
        totalTokens,
        cost: `£${cost.toFixed(4)}`,
        generationTimeMs: totalTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[SA Report v3] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
