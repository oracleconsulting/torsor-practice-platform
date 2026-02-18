import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// =============================================================================
// PASS 1: 5-PHASE EXTRACTION & ANALYSIS (each phase ~130s, under ~200s wall limit)
// Phase 1: EXTRACT CORE — company facts, system inventory, metrics, quotes
// Phase 2: ANALYSE PROCESSES — process deep dives, scores, uniquenessBrief, costs
// Phase 3: DIAGNOSE — findings with evidence + quick wins
// Phase 4: RECOMMEND — recommendations with ROI and freedom mapping
// Phase 5: GUIDE & PRESENT — admin guidance + client presentation
// Then assemble final pass1_data and set status='pass1_complete'
// =============================================================================

const TRUNCATE = (s: string | undefined | null, maxLen: number) =>
  (s == null ? '' : String(s)).length <= maxLen ? (s ?? '') : (s ?? '').slice(0, maxLen) + '…';

function parseJsonFromContent(content: string, wasTruncated: boolean): string {
  content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
  const firstBrace = content.indexOf('{');
  if (firstBrace > 0) content = content.substring(firstBrace);
  if (wasTruncated) {
    let braceCount = 0;
    let lastBrace = -1;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) lastBrace = i;
      }
    }
    if (lastBrace > 0) content = content.substring(0, lastBrace + 1);
  } else {
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
  }
  return content;
}

async function callSonnet(
  prompt: string,
  maxTokens: number,
  phase: number,
  openRouterKey: string
): Promise<{ data: any; tokensUsed: number; cost: number; generationTime: number }> {
  const startTime = Date.now();
  console.log(`[SA Pass 1] Phase ${phase}: Calling Sonnet (streaming, max_tokens=${maxTokens})...`);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor SA Pass 1',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: maxTokens,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Sonnet API failed (${response.status}): ${errText}`);
  }

  console.log(`[SA Pass 1] Phase ${phase}: Stream connected in ${Date.now() - startTime}ms, reading chunks...`);

  let fullContent = '';
  let tokensUsed = 0;
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let chunkCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') continue;

        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            chunkCount++;
          }
          if (json.usage) {
            tokensUsed = json.usage.total_tokens || json.usage.prompt_tokens + json.usage.completion_tokens || 0;
          }
        } catch {
          // Skip malformed chunks
        }
      }

      if (chunkCount > 0 && chunkCount % 100 === 0) {
        console.log(`[SA Pass 1] Phase ${phase}: ${chunkCount} chunks received, ${fullContent.length} chars so far (${Math.round((Date.now() - startTime) / 1000)}s)`);
      }
    }
  } finally {
    reader.releaseLock();
  }

  const elapsed = Date.now() - startTime;
  console.log(`[SA Pass 1] Phase ${phase}: Stream complete in ${elapsed}ms. ${chunkCount} chunks, ${fullContent.length} chars, ${tokensUsed} tokens`);

  const wasTruncated = fullContent.length > 0 && !fullContent.trimEnd().endsWith('}');
  if (wasTruncated) {
    console.warn(`[SA Pass 1] Phase ${phase}: Response may be truncated (doesn't end with })`);
  }

  let cleanContent = parseJsonFromContent(fullContent.trim(), wasTruncated);

  let data: any;
  try {
    data = JSON.parse(cleanContent);
  } catch (parseErr) {
    console.warn(`[SA Pass 1] Phase ${phase}: JSON parse failed, attempting repair...`);
    let repaired = cleanContent;
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*("[^"]*)?$/, '');
    repaired = repaired.replace(/,\s*"[^"]*"?\s*:\s*\[?\s*(\{[^}]*)?$/, '');
    let openBraces = 0, openBrackets = 0, inString = false, escape = false;
    for (let i = 0; i < repaired.length; i++) {
      if (escape) { escape = false; continue; }
      if (repaired[i] === '\\') { escape = true; continue; }
      if (repaired[i] === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (repaired[i] === '{') openBraces++;
      if (repaired[i] === '}') openBraces--;
      if (repaired[i] === '[') openBrackets++;
      if (repaired[i] === ']') openBrackets--;
    }
    repaired = repaired.replace(/,\s*$/, '');
    for (let i = 0; i < openBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces; i++) repaired += '}';
    console.log(`[SA Pass 1] Phase ${phase}: Repaired JSON (closed ${openBraces} braces, ${openBrackets} brackets)`);
    try {
      data = JSON.parse(repaired);
      console.log(`[SA Pass 1] Phase ${phase}: Repaired JSON parsed successfully`);
    } catch (repairErr) {
      console.error(`[SA Pass 1] Phase ${phase}: JSON repair failed. First 500 chars: ${cleanContent.substring(0, 500)}`);
      console.error(`[SA Pass 1] Phase ${phase}: Last 500 chars: ${cleanContent.substring(cleanContent.length - 500)}`);
      throw new Error(`Phase ${phase} JSON parse failed: ${(parseErr as Error).message}`);
    }
  }

  const cost = (tokensUsed / 1000000) * 3;
  return { data, tokensUsed, cost, generationTime: elapsed };
}

// ---------- Phase 1: EXTRACT CORE (company info, system inventory, metrics, quotes) ----------
function buildPhase1Prompt(
  discovery: any,
  systems: any[],
  clientName: string,
  hourlyRate: number
): string {
  const MAX_SYSTEMS = 20;
  const MAX_TEXT = 600;
  const systemsSlice = systems.slice(0, MAX_SYSTEMS);

  const systemDetails = systemsSlice.map(s => `
**${s.system_name}** (${s.category_code})
- Criticality: ${s.criticality}
- Cost: £${s.monthly_cost || 0}/mo
- Users: ${s.number_of_users || '?'} (${(s.primary_users || []).join(', ')})
- Integration: ${s.integration_method || 'none'}
- Manual transfer required: ${s.manual_transfer_required ? 'YES - ' + s.manual_hours_monthly + ' hrs/mo' : 'No'}
- Data quality: ${s.data_quality_score || '?'}/5
- User satisfaction: ${s.user_satisfaction || '?'}/5
- Known issues: "${TRUNCATE(s.known_issues || 'None specified', MAX_TEXT)}"
- Workarounds: "${TRUNCATE(s.workarounds_in_use || 'None specified', MAX_TEXT)}"
- Future plan: ${s.future_plan || 'keep'}
`).join('\n');

  return `
You are extracting structured FACTS from a Systems Audit assessment. Extract ALL facts, numbers, and quotes. Analyse each system's integration status. Do NOT generate findings, process analysis, scores, or recommendations — only facts about the company and its systems.

═══════════════════════════════════════════════════════════════════════════════
DISCOVERY DATA
═══════════════════════════════════════════════════════════════════════════════

Company: ${clientName}
Team Size: ${discovery.team_size} → ${discovery.expected_team_size_12mo} (12mo)
Revenue: ${discovery.revenue_band}
Industry: ${discovery.industry_sector}

**BREAKING POINT (verbatim):** "${TRUNCATE(discovery.systems_breaking_point, MAX_TEXT)}"
**MONTH-END SHAME (verbatim):** "${TRUNCATE(discovery.month_end_shame, MAX_TEXT)}"
**EXPENSIVE MISTAKE (verbatim):** "${TRUNCATE(discovery.expensive_systems_mistake, MAX_TEXT)}"
**MAGIC FIX (verbatim):** "${TRUNCATE(discovery.magic_process_fix, MAX_TEXT)}"

Operations diagnosis: ${discovery.operations_self_diagnosis}
Manual hours estimate: ${discovery.manual_hours_monthly}
Month-end close: ${discovery.month_end_close_duration}
Data errors: ${discovery.data_error_frequency}
Integration rating: ${discovery.integration_rating}
Critical spreadsheets: ${discovery.critical_spreadsheets}
Change appetite: ${discovery.change_appetite}
Fears: ${(discovery.systems_fears || []).join(', ')}
Champion: ${discovery.internal_champion}

TARGET STATE:
- Desired outcomes: ${(discovery.desired_outcomes || []).join(' | ') || 'Not specified'}
- Monday morning vision: "${TRUNCATE(discovery.monday_morning_vision || 'Not specified', MAX_TEXT)}"
- Time freedom priority: "${TRUNCATE(discovery.time_freedom_priority || 'Not specified', MAX_TEXT)}"
- Magic fix (Focus Areas): "${TRUNCATE(discovery.magic_process_fix || 'Not specified', MAX_TEXT)}"

═══════════════════════════════════════════════════════════════════════════════
SYSTEM INVENTORY (${systemsSlice.length} systems)
═══════════════════════════════════════════════════════════════════════════════

${systemDetails}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK — Return ONLY this JSON
═══════════════════════════════════════════════════════════════════════════════

{
  "facts": {
    "companyName": "${clientName}",
    "teamSize": number,
    "projectedTeamSize": number,
    "growthMultiplier": number,
    "revenueBand": "string",
    "industry": "string",
    "breakingPoint": "EXACT verbatim quote",
    "monthEndShame": "EXACT verbatim quote",
    "expensiveMistake": "EXACT verbatim quote",
    "magicFix": "EXACT verbatim quote",
    "fears": ["fear1", "fear2"],
    "desiredOutcomes": ["exact text of outcome 1", "outcome 2", "outcome 3"],
    "mondayMorningVision": "EXACT verbatim quote",
    "timeFreedomPriority": "What they said they'd do with reclaimed time",
    "systems": [
      {
        "name": "System name",
        "category": "category",
        "criticality": "critical|important|nice_to_have",
        "monthlyCost": number,
        "integrationMethod": "native|zapier_make|custom_api|manual|none",
        "integratesWith": ["other system names"],
        "gaps": ["specific integration gap 1", "gap 2"],
        "strengths": ["what it does well"],
        "manualHours": number,
        "dataQuality": 1-5,
        "userSatisfaction": 1-5,
        "painPoints": ["specific pain relating to this system"]
      }
    ],
    "totalSystemCost": number,
    "criticalSystems": ["names"],
    "disconnectedSystems": ["systems with no/manual integration"],
    "integrationGaps": ["Specific gap: System A doesn't talk to System B, causing X"],
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
    "allClientQuotes": ["every significant verbatim quote from discovery and deep dives"]
  }
}

Return ONLY valid JSON.
`;
}

// ---------- Phase 2: ANALYSE PROCESSES (scores, uniquenessBrief, aspirationGap) ----------
function buildPhase2AnalysePrompt(
  phase1Facts: any,
  discovery: any,
  deepDives: any[],
  clientName: string,
  hourlyRate: number
): string {
  const MAX_DEEP_DIVES = 12;
  const MAX_TEXT = 600;
  const deepDivesSlice = deepDives.slice(0, MAX_DEEP_DIVES);

  const deepDiveDetails = deepDivesSlice.map(dd => {
    const responses = dd.responses || {};
    const pains = dd.key_pain_points || [];
    return `
### ${dd.chain_code.toUpperCase().replace(/_/g, ' ')}
**Pain Points (their words):**
${pains.slice(0, 15).map((p: string) => `- "${TRUNCATE(p, 300)}"`).join('\n')}
**All Responses:**
${Object.entries(responses).slice(0, 25).map(([k, v]) => `- ${k}: ${TRUNCATE(JSON.stringify(v), 400)}`).join('\n')}
`;
  }).join('\n\n');

  const systemSummary = (phase1Facts.systems || []).map((s: any) =>
    `- ${s.name} (${s.category}): ${s.criticality}, ${s.integrationMethod} integration, ${s.manualHours || 0} manual hrs/mo, gaps: ${(s.gaps || []).join('; ')}`
  ).join('\n');

  return `
You are analysing process deep dives for ${clientName}. Phase 1 already extracted company facts and system inventory. Now analyse the PROCESSES, generate scores, and synthesise the client's unique situation.

═══════════════════════════════════════════════════════════════════════════════
CONTEXT FROM PHASE 1
═══════════════════════════════════════════════════════════════════════════════

Company: ${clientName}
Team: ${phase1Facts.teamSize} → ${phase1Facts.projectedTeamSize} (12mo), growth multiplier: ${phase1Facts.growthMultiplier}
Revenue: ${phase1Facts.revenueBand}
Industry: ${phase1Facts.industry}

Systems extracted (${(phase1Facts.systems || []).length} total):
${systemSummary}

Total system cost: £${phase1Facts.totalSystemCost || 0}/mo
Disconnected systems: ${(phase1Facts.disconnectedSystems || []).join(', ')}
Integration gaps: ${(phase1Facts.integrationGaps || []).join('; ')}

TARGET STATE:
- Desired outcomes: ${(discovery.desired_outcomes || []).join(' | ') || 'Not specified'}
- Monday morning vision: "${TRUNCATE(discovery.monday_morning_vision || 'Not specified', MAX_TEXT)}"
- Time freedom priority: "${TRUNCATE(discovery.time_freedom_priority || 'Not specified', MAX_TEXT)}"
- Magic fix: "${TRUNCATE(discovery.magic_process_fix || 'Not specified', MAX_TEXT)}"

═══════════════════════════════════════════════════════════════════════════════
PROCESS DEEP DIVES (${deepDivesSlice.length} processes) — ANALYSE THESE
═══════════════════════════════════════════════════════════════════════════════

${deepDiveDetails}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK — Return ONLY this JSON
═══════════════════════════════════════════════════════════════════════════════

{
  "uniquenessBrief": "3-4 sentences: what makes THIS client's situation different from any other small business? Emotional core, not just technical gap. Reference their specific systems, team dynamics, and aspirations.",

  "aspirationGap": "2-3 sentences: gap between where they ARE and where they WANT TO BE. Name specific systems, hours, and capabilities that are missing. Reference their desired_outcomes and monday_morning_vision.",

  "processes": [
    {
      "chainCode": "quote_to_cash",
      "chainName": "Quote-to-Cash",
      "keyPainPoints": ["verbatim pain points from deep dive"],
      "specificMetrics": { "quoteTimeMins": 90, "invoiceLagDays": 10 },
      "hoursWasted": "calculated hours per MONTH wasted in this process",
      "criticalGaps": ["specific gap causing waste — name systems involved"],
      "clientQuotes": ["relevant verbatim quotes from this chain"]
    }
  ],

  "hoursWastedWeekly": "calculated total across ALL processes (sum of monthly hoursWasted / 4)",
  "annualCostOfChaos": "hoursWastedWeekly × ${hourlyRate} × 52",
  "projectedCostAtScale": "annualCostOfChaos × ${phase1Facts.growthMultiplier} × 1.3",

  "scores": {
    "integration": { "score": 0-100, "evidence": "X of Y systems have no integration. Specific gaps: A→B, C→D" },
    "automation": { "score": 0-100, "evidence": "Specific manual processes: quote creation (Xmins), invoice triggers (manual), time backfill (Yhrs/wk)" },
    "dataAccessibility": { "score": 0-100, "evidence": "X-day reporting lag. Can't answer [question] in under Y minutes" },
    "scalability": { "score": 0-100, "evidence": "At ${phase1Facts.growthMultiplier}x growth, [system] breaks because [reason]" }
  },

  "additionalClientQuotes": ["any significant verbatim quotes from deep dives NOT already captured in Phase 1"]
}

CRITICAL NUMBER CONSISTENCY:
- hoursWastedWeekly = sum of all process hoursWasted (monthly) divided by 4
- annualCostOfChaos = hoursWastedWeekly × ${hourlyRate} × 52 (EXACT — no rounding errors)
- projectedCostAtScale = annualCostOfChaos × ${phase1Facts.growthMultiplier} × 1.3
- Round monetary to nearest £10, hours to whole number
- Score evidence must cite SPECIFIC systems and numbers from the data above

Return ONLY valid JSON.
`;
}

async function runPhase1(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  discovery: any,
  systems: any[],
  clientName: string,
  hourlyRate: number,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const prompt = buildPhase1Prompt(discovery, systems || [], clientName, hourlyRate);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 1, openRouterKey);

  console.log('[SA Pass 1] Phase 1: Writing to DB...');
  await supabaseClient.from('sa_audit_reports').upsert(
    {
      engagement_id: engagementId,
      status: 'generating',
      executive_summary: 'Phase 1/5: Extracting facts and analysing systems...',
      pass1_data: { phase1: data },
      systems_count: (data.facts?.systems || []).length,
      llm_model: 'claude-sonnet-4.5',
      llm_tokens_used: tokensUsed,
      llm_cost: cost,
      generation_time_ms: generationTime,
      prompt_version: 'v7-5phase',
    },
    { onConflict: 'engagement_id' }
  );
  console.log('[SA Pass 1] Phase 1: DB write complete');

  return { success: true, phase: 1 };
}

// ---------- Phase 2: ANALYSE PROCESSES (scores, uniquenessBrief, aspirationGap) ----------
async function runPhase2Analyse(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  hourlyRate: number,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports')
    .select('pass1_data')
    .eq('engagement_id', engagementId)
    .single();
  if (!report?.pass1_data?.phase1) {
    throw new Error('Phase 1 data not found');
  }
  const phase1Facts = report.pass1_data.phase1.facts;

  const [discoveryRes, deepDivesRes] = await Promise.all([
    supabaseClient.from('sa_discovery_responses').select('*').eq('engagement_id', engagementId).single(),
    supabaseClient.from('sa_process_deep_dives').select('*').eq('engagement_id', engagementId),
  ]);
  if (discoveryRes.error || !discoveryRes.data) {
    throw new Error(`Discovery not found: ${discoveryRes.error?.message}`);
  }

  const clientName = phase1Facts.companyName || 'the business';
  const prompt = buildPhase2AnalysePrompt(phase1Facts, discoveryRes.data, deepDivesRes.data || [], clientName, hourlyRate);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 2, openRouterKey);

  const expectedAnnual = Math.round(data.hoursWastedWeekly * hourlyRate * 52);
  const expectedScale = Math.round(expectedAnnual * phase1Facts.growthMultiplier * 1.3);
  const tolerance = 0.05;
  if (Math.abs((data.annualCostOfChaos || 0) - expectedAnnual) / Math.max(expectedAnnual, 1) > tolerance) {
    data.annualCostOfChaos = expectedAnnual;
  }
  if (Math.abs((data.projectedCostAtScale || 0) - expectedScale) / Math.max(expectedScale, 1) > tolerance) {
    data.projectedCostAtScale = expectedScale;
  }

  const scores = data.scores;
  const avgScore = (scores.integration.score + scores.automation.score + scores.dataAccessibility.score + scores.scalability.score) / 4;
  let sentiment = 'good_with_gaps';
  if (avgScore >= 70) sentiment = 'strong_foundation';
  else if (avgScore >= 50) sentiment = 'good_with_gaps';
  else if (avgScore >= 30) sentiment = 'significant_issues';
  else sentiment = 'critical_attention';

  const existingPass1 = report.pass1_data as any;

  console.log('[SA Pass 1] Phase 2: Writing to DB...');
  await supabaseClient
    .from('sa_audit_reports')
    .update({
      pass1_data: { ...existingPass1, phase2: data },
      executive_summary: 'Phase 2/5: Analysing processes and calculating scores...',
      executive_summary_sentiment: sentiment,
      total_hours_wasted_weekly: Math.round(data.hoursWastedWeekly),
      total_annual_cost_of_chaos: Math.round(data.annualCostOfChaos / 10) * 10,
      growth_multiplier: phase1Facts.growthMultiplier,
      projected_cost_at_scale: Math.round(data.projectedCostAtScale / 10) * 10,
      integration_score: scores.integration.score,
      automation_score: scores.automation.score,
      data_accessibility_score: scores.dataAccessibility.score,
      scalability_score: scores.scalability.score,
    })
    .eq('engagement_id', engagementId);
  console.log('[SA Pass 1] Phase 2: DB write complete');

  return { success: true, phase: 2 };
}

// ---------- Phase 3: DIAGNOSE (findings with full evidence + quick wins) ----------
const SPECIFICITY_RULES = `
SPECIFICITY RULES (non-negotiable):
1. Every finding title must name something specific: system name, role, number, process. NEVER "Improve system integration". ALWAYS "Harvest→Xero disconnect: Maria transfers 8 hours/month manually..."
2. Every finding must reference at least ONE desired_outcome by name in blocksGoal.
3. Quick wins must be things THIS team can do THIS week — name person, system, setting.
4. If a finding would be identical for a plumber and a creative agency, it's too generic. Rewrite it.

BANNED: Additionally, Furthermore, Moreover, Delve, Crucial, pivotal, vital, Testament to, Showcases, fostering, Tapestry, landscape, Synergy, leverage, streamline, optimize, holistic.
BANNED STRUCTURES: "Not only X but also Y"; "It's important to note..."; Generic recommendations like "implement a CRM", "automate invoicing" — name the specific tool, the specific person, the specific setting.
Return ONLY valid JSON.`;

function buildPhase3DiagnosePrompt(phase1: any, phase2: any, clientName: string, hourlyRate: number): string {
  const allFacts = {
    ...phase1.facts,
    processes: phase2.processes,
    hoursWastedWeekly: phase2.hoursWastedWeekly,
    annualCostOfChaos: phase2.annualCostOfChaos,
    projectedCostAtScale: phase2.projectedCostAtScale,
    aspirationGap: phase2.aspirationGap,
  };
  const factsStr = JSON.stringify(allFacts, null, 2);
  const scoresStr = JSON.stringify(phase2.scores, null, 2);
  return `
Given these extracted facts about ${clientName}, generate specific, evidence-backed findings and actionable quick wins. Use EXACT verbatim quotes where relevant. Every finding must be tied to specific systems, specific processes, and specific numbers from the data.

uniquenessBrief: ${phase2.uniquenessBrief}

facts (extracted from Phase 1 + Phase 2):
${factsStr}

scores:
${scoresStr}

Return JSON:
{
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "category": "integration_gap|manual_process|data_silo|single_point_failure|scalability_risk",
      "title": "Specific title with system names and numbers — e.g. 'Harvest→Xero disconnect costs 8hrs/week in manual time entry transfer'",
      "description": "What's broken and why, using their words. Be detailed — this is the core diagnostic output.",
      "evidence": ["Specific data point 1 with number", "Data point 2 with system name"],
      "clientQuote": "Their exact words that prove this finding",
      "affectedSystems": ["Xero", "Asana"],
      "affectedProcesses": ["quote_to_cash", "record_to_report"],
      "hoursWastedWeekly": number,
      "annualCostImpact": number,
      "scalabilityImpact": "What specifically happens at ${allFacts.growthMultiplier}x growth — name the breaking point",
      "recommendation": "Specific fix — name the integration, tool, or setting change",
      "blocksGoal": "Which desired_outcome this blocks — use their exact text from desiredOutcomes"
    }
  ],
  "quickWins": [
    {
      "title": "Action with specific system name and person",
      "action": "Step 1: [specific action], Step 2: [specific action], Step 3: [specific action]",
      "systems": ["Xero", "Asana"],
      "timeToImplement": "X hours",
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "impact": "Specific outcome — what changes for the team on Monday morning"
    }
  ]
}

Generate AT LEAST 6 findings (mix of critical, high, medium). Generate AT LEAST 4 quick wins.
${SPECIFICITY_RULES}
`;
}

async function runPhase3Diagnose(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  hourlyRate: number,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports')
    .select('pass1_data')
    .eq('engagement_id', engagementId)
    .single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase2) {
    throw new Error('Phase 1 or Phase 2 data not found');
  }
  const phase1 = report.pass1_data.phase1;
  const phase2 = report.pass1_data.phase2;
  const clientName = phase1.facts.companyName || 'the business';
  const prompt = buildPhase3DiagnosePrompt(phase1, phase2, clientName, hourlyRate);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 3, openRouterKey);

  const existingPass1 = report.pass1_data as any;
  console.log('[SA Pass 1] Phase 3: Writing to DB...');
  await supabaseClient
    .from('sa_audit_reports')
    .update({
      pass1_data: { ...existingPass1, phase3: data },
      executive_summary: 'Phase 3/5: Generating detailed findings and quick wins...',
    })
    .eq('engagement_id', engagementId);
  console.log('[SA Pass 1] Phase 3: DB write complete');

  await supabaseClient.from('sa_findings').delete().eq('engagement_id', engagementId);
  if (data.findings?.length) {
    const findingRows = data.findings.map((finding: any) => ({
      engagement_id: engagementId,
      finding_code: `F-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      source_stage: 'ai_generated',
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      description: `${finding.description}${finding.blocksGoal ? `\n\nBlocks goal: ${finding.blocksGoal}` : ''}\n\nSystems: ${(finding.affectedSystems || []).join(', ')}\nProcesses: ${(finding.affectedProcesses || []).join(', ')}`,
      evidence: finding.evidence || [],
      client_quote: finding.clientQuote,
      hours_wasted_weekly: finding.hoursWastedWeekly,
      annual_cost_impact: finding.annualCostImpact,
      scalability_impact: finding.scalabilityImpact,
      recommendation: finding.recommendation,
    }));
    await supabaseClient.from('sa_findings').insert(findingRows);
  }

  return { success: true, phase: 3 };
}

// ---------- Tech stack intelligence context (Stage 2) ----------
function buildTechContext(
  matchedProducts: { systemName: string; categoryCode: string; slug: string | null; techProduct: any }[],
  relevantIntegrations: any[],
  alternativeProducts: any[],
  relevantMiddleware: any[],
  discovery: any
): string {
  const currentStackContext = matchedProducts
    .filter((mp) => mp.techProduct)
    .map((mp) => {
      const tp = mp.techProduct;
      return `
**${tp.product_name}** (${tp.category}) — Client uses this
- Market position: ${tp.market_position}
- Sweet spot: ${tp.sweet_min_employees}-${tp.sweet_max_employees} employees
- Pricing: £${tp.price_entry_gbp}/mo (entry) to £${tp.price_top_gbp ?? '?'}/mo (top). Model: ${tp.pricing_model}
- Scores: Ease=${tp.score_ease}/5, Features=${tp.score_features}/5, Integrations=${tp.score_integrations}/5, Reporting=${tp.score_reporting}/5, Scalability=${tp.score_scalability}/5
- Strengths: ${(tp.key_strengths || []).join(', ')}
- Weaknesses: ${(tp.key_weaknesses || []).join(', ')}
- Best for: ${tp.best_for || 'N/A'}
- Not ideal for: ${tp.not_ideal_for || 'N/A'}`;
    })
    .join('\n');

  const integrationContext = relevantIntegrations
    .map(
      (ti: any) =>
        `${ti.product_a_slug} ↔ ${ti.product_b_slug}: type=${ti.integration_type}, quality=${ti.quality}, bidirectional=${ti.bidirectional}, data_flows=[${ti.data_flows || 'N/A'}], setup=${ti.setup_complexity}, cost=£${ti.monthly_cost_gbp || 0}/mo, limitations=[${ti.known_limitations || 'none'}]`
    )
    .join('\n');

  const alternativesContext = alternativeProducts
    .filter((ap: any) => !matchedProducts.find((mp) => mp.slug === ap.slug))
    .slice(0, 50)
    .map(
      (ap: any) => {
        const categories = [ap.category, ...(ap.additional_categories || [])].join(', ');
        return `**${ap.product_name}** (${categories}) — ${ap.market_position}
  Sweet spot: ${ap.sweet_min_employees}-${ap.sweet_max_employees} employees
  Pricing: £${ap.price_entry_gbp}/mo entry, £${ap.price_mid_gbp}/mo mid. ${ap.is_per_user ? 'Per user' : 'Flat'}
  Scores: Ease=${ap.score_ease}/5, Features=${ap.score_features}/5, Integrations=${ap.score_integrations}/5
  Strengths: ${(ap.key_strengths || []).slice(0, 3).join(', ')}
  Can replace: ${(ap.can_replace || []).join(', ')}
  Migration complexity: ${ap.migration_complexity || 'unknown'}`;
      }
    )
    .join('\n');

  const middlewareContext: Record<string, { slug: string; platform: string; triggers: string[]; actions: string[]; searches: string[] }> = {};
  for (const mc of relevantMiddleware) {
    const key = `${mc.product_slug}_${mc.platform}`;
    if (!middlewareContext[key]) {
      middlewareContext[key] = { slug: mc.product_slug, platform: mc.platform, triggers: [], actions: [], searches: [] };
    }
    if (mc.capability_type === 'trigger') middlewareContext[key].triggers.push(mc.capability_name);
    if (mc.capability_type === 'action') middlewareContext[key].actions.push(mc.capability_name);
    if (mc.capability_type === 'search') middlewareContext[key].searches.push(mc.capability_name);
  }
  const middlewareStr = Object.values(middlewareContext)
    .map(
      (mc: any) =>
        `${mc.slug} on ${mc.platform}: ${mc.triggers.length} triggers, ${mc.actions.length} actions. Key triggers: [${mc.triggers.slice(0, 5).join(', ')}]. Key actions: [${mc.actions.slice(0, 5).join(', ')}]`
    )
    .join('\n');

  const d = discovery || {};
  const strategyStr = `
Team size: ${d.team_size || '?'} → ${d.expected_team_size_12mo || '?'} (12 months)
Revenue: ${d.revenue_band || '?'}
Growth trajectory: ${d.growth_trajectory || 'not specified'}
Owner role intent: ${d.owner_role_intent || 'not specified'}
Budget appetite: ${d.systems_budget_appetite || 'not specified'}
Growth constraint: ${d.biggest_growth_constraint || 'not specified'}`;

  return `
═══════════════════════════════════════════════════════════
TECH STACK INTELLIGENCE DATABASE
═══════════════════════════════════════════════════════════

THEIR CURRENT TOOLS (from our database):
${currentStackContext || 'No products matched in tech database'}

KNOWN INTEGRATIONS BETWEEN THEIR TOOLS:
${integrationContext || 'No integration data found'}

ALTERNATIVE PRODUCTS AVAILABLE:
${alternativesContext || 'No alternatives found'}

MIDDLEWARE CAPABILITIES (Zapier/Make):
${middlewareStr || 'No middleware data found'}

CLIENT'S STRATEGIC DIRECTION:
${strategyStr}
`;
}

// ---------- Phase 4: RECOMMEND (recommendations only — systems maps in separate phase) ----------
function buildPhase4Prompt(phase1: any, phase2: any, phase3: any, clientName: string): string {
  const findingSummaries = (phase3.findings || []).map((f: any) => ({
    title: f.title, severity: f.severity, affectedSystems: f.affectedSystems,
    hoursWastedWeekly: f.hoursWastedWeekly, annualCostImpact: f.annualCostImpact, blocksGoal: f.blocksGoal,
  }));
  return `
Given these facts, analysis, and findings for ${clientName}, generate detailed recommendations. Each recommendation must have clear ROI, connect to their specific goals, and reference their exact systems.

uniquenessBrief: ${phase2.uniquenessBrief}

Key context:
- Desired outcomes: ${JSON.stringify(phase1.facts.desiredOutcomes)}
- Monday morning vision: "${phase1.facts.mondayMorningVision}"
- Aspiration gap: "${phase2.aspirationGap}"
- Hours wasted weekly: ${phase2.hoursWastedWeekly}
- Annual cost of chaos: £${phase2.annualCostOfChaos}

Systems (name, cost, gaps):
${JSON.stringify(phase1.facts.systems?.map((s: any) => ({ name: s.name, monthlyCost: s.monthlyCost, gaps: s.gaps, integrationMethod: s.integrationMethod })), null, 2)}

Processes (name, hours wasted):
${JSON.stringify(phase2.processes?.map((p: any) => ({ chainName: p.chainName, chainCode: p.chainCode, hoursWasted: p.hoursWasted, criticalGaps: p.criticalGaps })), null, 2)}

Findings to address:
${JSON.stringify(findingSummaries, null, 2)}

Quick wins already identified:
${JSON.stringify((phase3.quickWins || []).map((q: any) => ({ title: q.title, hoursSavedWeekly: q.hoursSavedWeekly })), null, 2)}

Return JSON:
{
  "recommendations": [
    {
      "priorityRank": 1,
      "title": "Recommendation title with specific systems — e.g. 'Connect Harvest→Xero for automated time-to-invoice flow'",
      "description": "Detailed description of what this fixes, how it works, and why it matters for THIS client. Reference specific findings it addresses.",
      "category": "foundation|quick_win|strategic|optimization",
      "implementationPhase": "immediate|short_term|medium_term|long_term",
      "systemsInvolved": ["Xero", "Asana"],
      "processesFixed": ["quote_to_cash"],
      "findingsAddressed": ["Finding title 1", "Finding title 2"],
      "estimatedCost": number,
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "paybackMonths": number,
      "freedomUnlocked": "Echo their monday_morning_vision — use THEIR language. What does Monday morning look like after this is done?",
      "goalsAdvanced": ["Which desired_outcomes this advances — use EXACT text from their desiredOutcomes"]
    }
  ]
}

Generate AT LEAST 5 recommendations, prioritised. Mix of immediate wins and strategic changes.
Sum of all recommendations.hoursSavedWeekly must not exceed ${phase2.hoursWastedWeekly} (can't save more hours than are wasted).
Every recommendation must reference at least one finding and at least one desired_outcome.
${SPECIFICITY_RULES}
`;
}

// ---------- Phase 4b: SYSTEMS MAPS (separate call after recommendations) ----------
function buildPhase4SystemsMapsPrompt(phase1: any, phase2: any, phase3: any, phase4: any, techContextStr: string, clientName: string): string {
  const summary = JSON.stringify(
    {
      companyName: phase1.facts?.companyName,
      systems: phase1.facts?.systems?.map((s: any) => ({ name: s.name, category: s.category, monthlyCost: s.monthlyCost, integrationMethod: s.integrationMethod, manualHours: s.manualHours })),
      totalSystemCost: phase1.facts?.totalSystemCost,
      hoursWastedWeekly: phase2.hoursWastedWeekly,
      annualCostOfChaos: phase2.annualCostOfChaos,
      findings: (phase3.findings || []).slice(0, 8).map((f: any) => ({ title: f.title, severity: f.severity, affectedSystems: f.affectedSystems })),
      recommendations: (phase4.recommendations || []).slice(0, 6).map((r: any) => ({ title: r.title, systemsInvolved: r.systemsInvolved, hoursSavedWeekly: r.hoursSavedWeekly })),
    },
    null,
    2
  ).substring(0, 28000);

  return `
You have the extracted analysis for ${clientName}. Using it AND the tech stack intelligence below, generate ONLY systems maps, tech stack summary, and hours breakdown.

PASS 1 ANALYSIS (summary):
${summary}

${techContextStr}

═══════════════════════════════════════════════════════════
YOUR TASK — Return ONLY this JSON (no other text)
═══════════════════════════════════════════════════════════

{
  "systemsMaps": [
    {
      "level": 1,
      "title": "Where You Are Today",
      "description": "One sentence description",
      "nodes": [ { "id": "slug", "name": "Product name", "category": "category_code", "monthlyCost": number, "status": "keep", "verdict": "string", "satisfactionScore": 1-5 } ],
      "edges": [ { "from": "slug", "to": "slug", "status": "active|broken|off|manual|middleware|native_new|none", "colour": "green|amber|red|blue|grey", "dataFlows": [], "manualHoursMonthly": number, "middlewareTool": null, "middlewareCostMonthly": 0, "changeFromPrevious": null } ],
      "metrics": { "monthlySoftwareCost": number, "manualHoursWeekly": number, "annualWastedCost": number, "annualSavingsVsMap1": 0, "oneOffInvestment": 0, "activeIntegrations": "2/9" },
      "changes": [],
      "narrative": "2-3 paragraph explanation",
      "recommendedLevel": false,
      "recommendationReason": null
    }
  ],
  "techStackSummary": {
    "currentMonthlySpend": number,
    "recommendedMonthlySpend": number,
    "netMonthlyDelta": number,
    "toolsToKeep": [],
    "toolsToReconfigure": [],
    "toolsToReplace": [ { "current": "string", "replacement": "string", "reason": "string" } ],
    "toolsToAdd": [ { "product": "string", "reason": "string" } ],
    "toolsToRemove": []
  },
  "hoursBreakdown": {
    "quickWins": number,
    "foundation": number,
    "strategic": number,
    "optimisation": number,
    "total": number
  }
}

FOUR-LEVEL SYSTEMS MAPS: Generate exactly 4 entries. MAP 1 = Where You Are Today (every inventory system as node; edges from assessment: red=manual/none, amber=issues, green=working). MAP 2 = What Your Current Tools Can Already Do (same nodes; upgrade RED/AMBER to green where NATIVE integration exists in TECH INTEGRATIONS DATA; £0 investment). MAP 3 = Connected With Middleware (add Zapier/Make bridges, blue edges; include middleware cost). MAP 4 = The Optimal Stack (use ALTERNATIVE PRODUCTS; recommend replacements; sweet spot fit). Set recommendedLevel: true on ONE map. Node IDs = slug format. Map 1 metrics.annualWastedCost = annualCostOfChaos. Manual hours decrease Map 1 > 2 > 3 > 4. hoursBreakdown.total = sum of quickWins+foundation+strategic+optimisation.
Return ONLY valid JSON.
`;
}

async function runPhase4(
  supabaseClient: any,
  engagementId: string,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports').select('pass1_data').eq('engagement_id', engagementId).single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase2 || !report.pass1_data.phase3) {
    throw new Error('Phase 1, 2, or 3 data not found');
  }

  const phase1 = report.pass1_data.phase1;
  const phase2 = report.pass1_data.phase2;
  const phase3 = report.pass1_data.phase3;
  const clientName = phase1.facts.companyName || 'the business';

  // ---------- Phase 4a: Recommendations only ----------
  const prompt = buildPhase4Prompt(phase1, phase2, phase3, clientName);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 4, openRouterKey);

  console.log('[SA Pass 1] Phase 4: Writing recommendations to DB...');
  await supabaseClient.from('sa_audit_reports').update({
    pass1_data: { ...report.pass1_data, phase4: data },
    executive_summary: 'Phase 4/5: Building recommendations with ROI analysis...',
  }).eq('engagement_id', engagementId);

  await supabaseClient.from('sa_recommendations').delete().eq('engagement_id', engagementId);
  const recs = data.recommendations || [];
  if (recs.length) {
    const recRows = recs.map((rec: any) => ({
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
      freedom_unlocked: `${rec.freedomUnlocked || ''}${rec.goalsAdvanced?.length ? `\n\nAdvances: ${rec.goalsAdvanced.join('; ')}` : ''}`,
    }));
    await supabaseClient.from('sa_recommendations').insert(recRows);
  }
  console.log('[SA Pass 1] Phase 4: Recommendations complete');

  // ---------- Phase 4b: Systems maps (separate call, graceful degradation) ----------
  await supabaseClient
    .from('sa_audit_reports')
    .update({ executive_summary: 'Phase 4/5: Generating systems maps...' })
    .eq('engagement_id', engagementId);

  try {
    const mapsResult = await runPhase4SystemsMaps(supabaseClient, engagementId, openRouterKey);
    const { data: reportAfter } = await supabaseClient
      .from('sa_audit_reports')
      .select('pass1_data')
      .eq('engagement_id', engagementId)
      .single();
    const pass1Data = { ...(reportAfter?.pass1_data || report.pass1_data), ...mapsResult };
    await supabaseClient
      .from('sa_audit_reports')
      .update({ pass1_data: pass1Data })
      .eq('engagement_id', engagementId);
    console.log(`[SA Pass 1] Systems maps: ${mapsResult.systemsMaps?.length || 0} levels; techStackSummary: ${mapsResult.techStackSummary ? 'present' : 'missing'}`);
  } catch (mapsErr) {
    console.warn('[SA Pass 1] Systems maps generation failed (continuing without maps):', (mapsErr as Error).message);
    const { data: reportAfter } = await supabaseClient
      .from('sa_audit_reports')
      .select('pass1_data')
      .eq('engagement_id', engagementId)
      .single();
    const pass1Data = { ...(reportAfter?.pass1_data || report.pass1_data), systemsMaps: null, techStackSummary: null, hoursBreakdown: null };
    await supabaseClient
      .from('sa_audit_reports')
      .update({ pass1_data: pass1Data })
      .eq('engagement_id', engagementId);
  }

  return { success: true, phase: 4 };
}

async function runPhase4SystemsMaps(
  supabaseClient: any,
  engagementId: string,
  openRouterKey: string
): Promise<{ systemsMaps: any; techStackSummary: any; hoursBreakdown: any }> {
  const { data: report } = await supabaseClient
    .from('sa_audit_reports').select('pass1_data').eq('engagement_id', engagementId).single();
  if (!report?.pass1_data?.phase1 || !report.pass1_data.phase4) {
    throw new Error('Phase 1 or 4 data not found');
  }
  const phase1 = report.pass1_data.phase1;
  const phase2 = report.pass1_data.phase2;
  const phase3 = report.pass1_data.phase3;
  const phase4 = report.pass1_data.phase4;
  const clientName = phase1.facts?.companyName || 'the business';

  console.log('[SA Pass 1] Querying tech stack for systems maps...');
  const { data: techProducts, error: techError } = await supabaseClient
    .from('sa_tech_products')
    .select('*')
    .eq('uk_strong', true);
  if (techError) console.warn('[SA Pass 1] Tech products query failed:', techError.message);
  const { data: techIntegrations } = await supabaseClient.from('sa_tech_integrations').select('*');
  const { data: middlewareCapabilities } = await supabaseClient.from('sa_middleware_capabilities').select('*');

  const systems = phase1.facts?.systems || [];
  const matchedProducts = systems.map((s: any) => {
    const name = (s.name || '').trim();
    const normalised = name.toLowerCase();
    const slugified = normalised.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    const match = (techProducts || []).find(
      (tp: any) =>
        tp.slug === slugified ||
        (tp.product_name || '').toLowerCase() === normalised ||
        normalised.includes((tp.product_name || '').toLowerCase()) ||
        (tp.product_name || '').toLowerCase().includes(normalised) ||
        (tp.slug && tp.slug.startsWith(slugified)) ||
        (tp.slug && slugified.startsWith(tp.slug))
    );
    return { systemName: name, categoryCode: s.category || '', slug: match?.slug || null, techProduct: match || null };
  });
  const matchedSlugs = matchedProducts.filter((m: any) => m.techProduct).map((m: any) => m.slug);
  const relevantIntegrations = (techIntegrations || []).filter(
    (ti: any) => matchedSlugs.includes(ti.product_a_slug) || matchedSlugs.includes(ti.product_b_slug)
  );
  const clientCategories = [...new Set(systems.map((s: any) => s.category).filter(Boolean))];
  const alternativeProducts = (techProducts || []).filter(
    (tp: any) =>
      clientCategories.includes(tp.category) ||
      (tp.additional_categories && tp.additional_categories.some((ac: string) => clientCategories.includes(ac)))
  );
  const relevantMiddleware = (middlewareCapabilities || []).filter((mc: any) => matchedSlugs.includes(mc.product_slug));

  const { data: discoveryRes } = await supabaseClient
    .from('sa_discovery_responses')
    .select('*')
    .eq('engagement_id', engagementId)
    .single();
  const techContextStr = buildTechContext(matchedProducts, relevantIntegrations, alternativeProducts, relevantMiddleware, discoveryRes);
  const mapsPrompt = buildPhase4SystemsMapsPrompt(phase1, phase2, phase3, phase4, techContextStr, clientName);

  const { data: mapsData, tokensUsed, cost, generationTime } = await callSonnet(mapsPrompt, 32000, 4.5, openRouterKey);

  const wasTruncated = typeof mapsData?.systemsMaps === 'undefined' || (Array.isArray(mapsData.systemsMaps) && mapsData.systemsMaps.length < 4);
  if (wasTruncated) {
    console.warn('[SA Pass 1] Systems maps response may be truncated');
  }

  return {
    systemsMaps: mapsData?.systemsMaps ?? null,
    techStackSummary: mapsData?.techStackSummary ?? null,
    hoursBreakdown: mapsData?.hoursBreakdown ?? null,
  };
}

// ---------- Phase 5: GUIDE & PRESENT (admin guidance + client presentation + final assembly) ----------
function buildPhase5Prompt(phase1: any, phase2: any, phase3: any, phase4: any, clientName: string): string {
  const topFindings = (phase3.findings || []).slice(0, 5).map((f: any) => ({
    title: f.title, severity: f.severity, hoursWastedWeekly: f.hoursWastedWeekly,
    annualCostImpact: f.annualCostImpact, clientQuote: f.clientQuote, blocksGoal: f.blocksGoal,
  }));
  const topRecs = (phase4.recommendations || []).slice(0, 5).map((r: any) => ({
    title: r.title, priorityRank: r.priorityRank, estimatedCost: r.estimatedCost,
    annualBenefit: r.annualBenefit, hoursSavedWeekly: r.hoursSavedWeekly, freedomUnlocked: r.freedomUnlocked,
  }));

  return `
Given the full analysis for ${clientName}, generate admin guidance for the practice team's client meeting AND a client-facing presentation summary.

═══════════════════════════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════════════════════════

uniquenessBrief: ${phase2.uniquenessBrief}
aspirationGap: ${phase2.aspirationGap}
desiredOutcomes: ${JSON.stringify(phase1.facts.desiredOutcomes)}
mondayMorningVision: "${phase1.facts.mondayMorningVision}"
magicFix: "${phase1.facts.magicFix}"
expensiveMistake: "${phase1.facts.expensiveMistake}"
breakingPoint: "${phase1.facts.breakingPoint}"
fears: ${JSON.stringify(phase1.facts.fears)}
hoursWastedWeekly: ${phase2.hoursWastedWeekly}
annualCostOfChaos: £${phase2.annualCostOfChaos}

Top findings:
${JSON.stringify(topFindings, null, 2)}

Top recommendations:
${JSON.stringify(topRecs, null, 2)}

Quick wins: ${JSON.stringify((phase3.quickWins || []).map((q: any) => ({ title: q.title, impact: q.impact })))}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK — Return ONLY this JSON
═══════════════════════════════════════════════════════════════════════════════

{
  "adminGuidance": {
    "talkingPoints": [
      {
        "topic": "Short topic name — e.g. 'The invoice lag problem'",
        "point": "What to say about this topic — be specific, actionable, reference their data. Write it as if coaching the practice team member before the meeting.",
        "clientQuote": "Exact quote from their responses to reference in conversation",
        "importance": "critical|high|medium"
      }
    ],
    "questionsToAsk": [
      {
        "question": "Specific probing question to ask in the client meeting",
        "purpose": "Why this question matters — what business insight it unlocks",
        "expectedInsight": "What you expect to learn and how it affects the recommendation",
        "followUp": "Natural follow-up question based on the likely answer"
      }
    ],
    "nextSteps": [
      {
        "action": "Specific action to take — name systems, people, deliverables",
        "owner": "Practice team|Client|Joint",
        "timing": "Within X days/weeks",
        "outcome": "What this achieves — be concrete",
        "priority": 1
      }
    ],
    "tasks": [
      {
        "task": "Specific task description — what exactly needs doing",
        "assignTo": "Role who should do this",
        "dueDate": "Before next meeting|Within 1 week|etc",
        "deliverable": "What output is expected — be specific"
      }
    ],
    "riskFlags": [
      {
        "flag": "What to watch out for — be specific to THIS client",
        "mitigation": "How to address this concern — practical steps",
        "severity": "high|medium|low"
      }
    ]
  },
  "clientPresentation": {
    "executiveBrief": "One paragraph (under 100 words) for a busy MD — lead with the cost, name their goal, show the path. No jargon. This should be quotable in a proposal.",
    "roiSummary": {
      "currentAnnualCost": number,
      "projectedSavings": number,
      "implementationCost": number,
      "paybackPeriod": "X months",
      "threeYearROI": "X:1",
      "timeReclaimed": "X hours/week"
    },
    "topThreeIssues": [
      {
        "issue": "Clear issue title a non-technical MD would understand",
        "impact": "£X annual impact or Y hours/week — use the number",
        "solution": "Specific solution in plain language — name the systems",
        "timeToFix": "X days/weeks"
      }
    ]
  }
}

ADMIN GUIDANCE RULES:
- Generate AT LEAST 6 talking points — prioritise their expensive mistake, magic fix, and biggest findings
- Generate AT LEAST 5 probing questions that uncover hidden costs or expand engagement scope
- Generate AT LEAST 4 next steps with clear owners and timing
- Generate AT LEAST 4 tasks for the practice team to prepare before the client meeting
- Flag ALL risks: change appetite concerns, budget constraints, key person dependencies, data migration risks
- Client presentation must be completely jargon-free — an MD who doesn't know what an API is should understand every word

${SPECIFICITY_RULES}
`;
}

async function runPhase5(
  supabaseClient: any,
  engagementId: string,
  openRouterKey: string
): Promise<{ success: boolean; phase: number; reportId: string }> {
  const { data: reportRow } = await supabaseClient
    .from('sa_audit_reports').select('id, pass1_data').eq('engagement_id', engagementId).single();
  if (!reportRow?.pass1_data?.phase1 || !reportRow.pass1_data.phase2 || !reportRow.pass1_data.phase3 || !reportRow.pass1_data.phase4) {
    throw new Error('Phase 1, 2, 3, or 4 data not found');
  }

  const phase1 = reportRow.pass1_data.phase1;
  const phase2 = reportRow.pass1_data.phase2;
  const phase3 = reportRow.pass1_data.phase3;
  const phase4 = reportRow.pass1_data.phase4;
  const clientName = phase1.facts.companyName || 'the business';
  const prompt = buildPhase5Prompt(phase1, phase2, phase3, phase4, clientName);
  const { data: phase5, tokensUsed, cost, generationTime } = await callSonnet(prompt, 12000, 5, openRouterKey);

  const allQuotes = [
    ...(phase1.facts.allClientQuotes || []),
    ...(phase2.additionalClientQuotes || []),
  ];

  const pass1Data = reportRow.pass1_data as any;
  const finalPass1Data = {
    uniquenessBrief: phase2.uniquenessBrief,
    facts: {
      ...phase1.facts,
      processes: phase2.processes,
      hoursWastedWeekly: phase2.hoursWastedWeekly,
      annualCostOfChaos: phase2.annualCostOfChaos,
      projectedCostAtScale: phase2.projectedCostAtScale,
      aspirationGap: phase2.aspirationGap,
      allClientQuotes: allQuotes,
    },
    scores: phase2.scores,
    findings: phase3.findings,
    quickWins: phase3.quickWins,
    recommendations: phase4.recommendations,
    systemsMaps: pass1Data.systemsMaps ?? phase4.systemsMaps ?? null,
    techStackSummary: pass1Data.techStackSummary ?? phase4.techStackSummary ?? null,
    hoursBreakdown: pass1Data.hoursBreakdown ?? phase4.hoursBreakdown ?? null,
    adminGuidance: phase5.adminGuidance,
    clientPresentation: phase5.clientPresentation,
  };

  const f = finalPass1Data.facts;
  const recs = phase4.recommendations || [];
  const totalInv = recs.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0);
  const totalBenefit = recs.reduce((sum: number, r: any) => sum + (r.annualBenefit || 0), 0);
  const hoursReclaimable = recs.reduce((sum: number, r: any) => sum + (parseFloat(r.hoursSavedWeekly) || 0), 0) ||
    (phase3.quickWins || []).reduce((sum: number, q: any) => sum + (parseFloat(q.hoursSavedWeekly) || 0), 0);

  console.log('[SA Pass 1] Phase 5: Writing final report to DB...');
  const updatePayload: any = {
    pass1_data: finalPass1Data,
    status: 'pass1_complete',
    executive_summary: '[Pass 2 will generate narrative]',
    headline: `[PENDING PASS 2] ${f.hoursWastedWeekly} hours/week wasted`,
    quick_wins: phase3.quickWins,
    critical_findings_count: (phase3.findings || []).filter((x: any) => x.severity === 'critical').length,
    high_findings_count: (phase3.findings || []).filter((x: any) => x.severity === 'high').length,
    medium_findings_count: (phase3.findings || []).filter((x: any) => x.severity === 'medium').length,
    low_findings_count: (phase3.findings || []).filter((x: any) => x.severity === 'low').length,
    total_recommended_investment: Math.round(totalInv / 10) * 10,
    total_annual_benefit: Math.round(totalBenefit / 10) * 10,
    overall_payback_months: totalBenefit > 0 ? Math.round(totalInv / (totalBenefit / 12)) : 0,
    roi_ratio: totalInv > 0 ? `${(totalBenefit / totalInv).toFixed(1)}:1` : '0:1',
    hours_reclaimable_weekly: Math.round(hoursReclaimable),
    cost_of_chaos_narrative: '[Pass 2 will generate narrative]',
    time_freedom_narrative: '[Pass 2 will generate narrative]',
    what_this_enables: [f.magicFix?.substring(0, 200) || ''],
    client_quotes_used: allQuotes.slice(0, 10),
    generated_at: new Date().toISOString(),
  };
  if (phase5.adminGuidance) {
    updatePayload.admin_talking_points = phase5.adminGuidance.talkingPoints || [];
    updatePayload.admin_questions_to_ask = phase5.adminGuidance.questionsToAsk || [];
    updatePayload.admin_next_steps = phase5.adminGuidance.nextSteps || [];
    updatePayload.admin_tasks = phase5.adminGuidance.tasks || [];
    updatePayload.admin_risk_flags = phase5.adminGuidance.riskFlags || [];
  }
  if (phase5.clientPresentation) {
    updatePayload.client_executive_brief = phase5.clientPresentation.executiveBrief || null;
    updatePayload.client_roi_summary = phase5.clientPresentation.roiSummary || null;
  }

  const { error: updateError } = await supabaseClient
    .from('sa_audit_reports').update(updatePayload).eq('engagement_id', engagementId);
  if (updateError) {
    console.error('[SA Pass 1] Phase 5 update error:', updateError);
    throw updateError;
  }
  console.log('[SA Pass 1] Phase 5: DB write complete. Status set to pass1_complete.');

  return { success: true, phase: 5, reportId: reportRow.id };
}

// ---------- Entry: route by phase ----------
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let engagementId: string | null = null;
  let phase = 1;

  try {
    const body = await req.json();
    engagementId = body.engagementId ?? null;
    phase = body.phase ?? 1;

    if (!engagementId) {
      throw new Error('engagementId is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: engagement, error: engagementError } = await supabaseClient
      .from('sa_engagements')
      .select('*')
      .eq('id', engagementId)
      .single();

    if (engagementError || !engagement) {
      throw new Error(`Failed to fetch engagement: ${engagementError?.message || 'Not found'}`);
    }

    let clientName = 'the business';
    if (engagement.client_id) {
      const { data: client } = await supabaseClient
        .from('practice_members')
        .select('client_company, company, name')
        .eq('id', engagement.client_id)
        .maybeSingle();
      clientName = client?.client_company || client?.company || client?.name || 'the business';
    }

    const hourlyRate = engagement?.hourly_rate != null ? Number(engagement.hourly_rate) : 45;
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterKey) {
      throw new Error('OPENROUTER_API_KEY not configured');
    }

    console.log(`[SA Pass 1] Phase ${phase} starting for: ${engagementId}`);

    let result: { success: boolean; phase: number; reportId?: string };

    switch (phase) {
      case 1: {
        await supabaseClient.from('sa_audit_reports').upsert(
          { engagement_id: engagementId, status: 'generating', executive_summary: 'Phase 1/5: Extracting facts and analysing systems...' },
          { onConflict: 'engagement_id' }
        );
        const [discoveryRes, systemsRes] = await Promise.all([
          supabaseClient.from('sa_discovery_responses').select('*').eq('engagement_id', engagementId).single(),
          supabaseClient.from('sa_system_inventory').select('*').eq('engagement_id', engagementId),
        ]);
        if (discoveryRes.error || !discoveryRes.data) {
          throw new Error(`Discovery not found: ${discoveryRes.error?.message}`);
        }
        result = await runPhase1(
          supabaseClient,
          engagementId,
          engagement,
          discoveryRes.data,
          systemsRes.data || [],
          clientName,
          hourlyRate,
          openRouterKey
        );
        break;
      }
      case 2: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 2/5: Analysing processes and calculating scores...' })
          .eq('engagement_id', engagementId);
        result = await runPhase2Analyse(supabaseClient, engagementId, engagement, hourlyRate, openRouterKey);
        break;
      }
      case 3: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 3/5: Generating detailed findings and quick wins...' })
          .eq('engagement_id', engagementId);
        result = await runPhase3Diagnose(supabaseClient, engagementId, engagement, hourlyRate, openRouterKey);
        break;
      }
      case 4: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 4/5: Building recommendations with ROI analysis...' })
          .eq('engagement_id', engagementId);
        result = await runPhase4(supabaseClient, engagementId, openRouterKey);
        break;
      }
      case 5: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 5/5: Generating admin guidance and client presentation...' })
          .eq('engagement_id', engagementId);
        result = await runPhase5(supabaseClient, engagementId, openRouterKey);
        break;
      }
      default:
        throw new Error(`Invalid phase: ${phase}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        phase: result.phase,
        reportId: (result as any).reportId,
        nextPhase: phase < 5 ? phase + 1 : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SA Pass 1] Error:', error);

    if (engagementId) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      const status = `phase${phase}_failed`;
      await supabaseClient
        .from('sa_audit_reports')
        .update({
          status,
          executive_summary: `Report generation failed at phase ${phase}: ${errMsg}. Retry from admin.`,
        })
        .eq('engagement_id', engagementId);
    }

    return new Response(
      JSON.stringify({ error: errMsg, phase }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
