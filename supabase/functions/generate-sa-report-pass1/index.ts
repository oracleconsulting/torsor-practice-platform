import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

// =============================================================================
// PASS 1: 3-PHASE EXTRACTION (each phase ~60-100s, under Edge Function timeout)
// Phase 1: EXTRACT — facts, systems, scores, uniquenessBrief
// Phase 2: DIAGNOSE — findings, quickWins
// Phase 3: PRESCRIBE — recommendations, adminGuidance, clientPresentation
// Then assemble final pass1_data, save findings/recommendations, trigger Pass 2
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

  const cleanContent = parseJsonFromContent(fullContent.trim(), wasTruncated);
  const data = JSON.parse(cleanContent);

  const cost = (tokensUsed / 1000000) * 3;

  console.log(`[SA Pass 1] Phase ${phase}: Parsed successfully. Writing to DB...`);

  return { data, tokensUsed, cost, generationTime: elapsed };
}

// ---------- Phase 1: EXTRACT (facts, systems, scores, uniquenessBrief) ----------
function buildPhase1Prompt(
  discovery: any,
  systems: any[],
  deepDives: any[],
  clientName: string,
  hourlyRate: number
): string {
  const MAX_SYSTEMS = 20;
  const MAX_DEEP_DIVES = 12;
  const MAX_TEXT = 600;
  const systemsSlice = systems.slice(0, MAX_SYSTEMS);
  const deepDivesSlice = deepDives.slice(0, MAX_DEEP_DIVES);

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

  return `
You are extracting structured data from a Systems Audit assessment. Extract ALL facts, numbers, and quotes. Do NOT generate findings, quick wins, or recommendations in this step — only facts and scores.

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
PROCESS DEEP DIVES (${deepDivesSlice.length} processes)
═══════════════════════════════════════════════════════════════════════════════

${deepDiveDetails}

═══════════════════════════════════════════════════════════════════════════════
YOUR TASK — Return ONLY this JSON (no findings, quickWins, or recommendations)
═══════════════════════════════════════════════════════════════════════════════

{
  "uniquenessBrief": "3-4 sentences: what makes THIS client's situation different? Emotional core, not just technical gap.",
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
    "aspirationGap": "2-3 sentences: gap between where they ARE and where they WANT TO BE. Name systems, hours, capabilities missing.",
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
    "processes": [
      {
        "chainCode": "quote_to_cash",
        "chainName": "Quote-to-Cash",
        "keyPainPoints": ["verbatim pain points"],
        "specificMetrics": { "quoteTimeMins": 90, "invoiceLagDays": 10 },
        "hoursWasted": number,
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
    "hoursWastedWeekly": number,
    "annualCostOfChaos": number,
    "projectedCostAtScale": number,
    "allClientQuotes": ["every significant verbatim quote"]
  },
  "scores": {
    "integration": { "score": 0-100, "evidence": "..." },
    "automation": { "score": 0-100, "evidence": "..." },
    "dataAccessibility": { "score": 0-100, "evidence": "..." },
    "scalability": { "score": 0-100, "evidence": "..." }
  }
}

CRITICAL NUMBER CONSISTENCY:
- facts.hoursWastedWeekly × ${hourlyRate} × 52 = facts.annualCostOfChaos (no rounding errors)
- facts.projectedCostAtScale = facts.annualCostOfChaos × facts.growthMultiplier × 1.3
- Round monetary to nearest £10, hours to whole number

Return ONLY valid JSON.
`;
}

function validatePhase1Numbers(data: any, hourlyRate: number): void {
  const f = data.facts;
  const expectedAnnual = Math.round(f.hoursWastedWeekly * hourlyRate * 52);
  const expectedScale = Math.round(f.annualCostOfChaos * f.growthMultiplier * 1.3);
  const tolerance = 0.05;
  if (Math.abs(f.annualCostOfChaos - expectedAnnual) / Math.max(expectedAnnual, 1) > tolerance) {
    f.annualCostOfChaos = expectedAnnual;
  }
  if (Math.abs(f.projectedCostAtScale - expectedScale) / Math.max(expectedScale, 1) > tolerance) {
    f.projectedCostAtScale = expectedScale;
  }
}

async function runPhase1(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  discovery: any,
  systems: any[],
  deepDives: any[],
  clientName: string,
  hourlyRate: number,
  openRouterKey: string
): Promise<{ success: boolean; phase: number }> {
  const prompt = buildPhase1Prompt(discovery, systems || [], deepDives || [], clientName, hourlyRate);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 6000, 1, openRouterKey);
  validatePhase1Numbers(data, hourlyRate);

  const f = data.facts;
  const scores = data.scores;
  let sentiment = 'good_with_gaps';
  const avgScore = (scores.integration.score + scores.automation.score + scores.dataAccessibility.score + scores.scalability.score) / 4;
  if (avgScore >= 70) sentiment = 'strong_foundation';
  else if (avgScore >= 50) sentiment = 'good_with_gaps';
  else if (avgScore >= 30) sentiment = 'significant_issues';
  else sentiment = 'critical_attention';

  console.log('[SA Pass 1] Phase 1: Writing to DB...');
  await supabaseClient.from('sa_audit_reports').upsert(
    {
      engagement_id: engagementId,
      status: 'generating',
      executive_summary: 'Phase 1/3: Extracting facts and analysing systems...',
      executive_summary_sentiment: sentiment,
      pass1_data: { phase1: data },
      total_hours_wasted_weekly: Math.round(f.hoursWastedWeekly),
      total_annual_cost_of_chaos: Math.round(f.annualCostOfChaos / 10) * 10,
      growth_multiplier: f.growthMultiplier,
      projected_cost_at_scale: Math.round(f.projectedCostAtScale / 10) * 10,
      systems_count: f.systems.length,
      integration_score: scores.integration.score,
      automation_score: scores.automation.score,
      data_accessibility_score: scores.dataAccessibility.score,
      scalability_score: scores.scalability.score,
      llm_model: 'claude-sonnet-4.5',
      llm_tokens_used: tokensUsed,
      llm_cost: cost,
      generation_time_ms: generationTime,
      prompt_version: 'v5-phase1',
    },
    { onConflict: 'engagement_id' }
  );
  console.log('[SA Pass 1] Phase 1: DB write complete');

  return { success: true, phase: 1 };
}

// ---------- Phase 2: DIAGNOSE (findings, quickWins) ----------
const SPECIFICITY_AND_BANNED = `
SPECIFICITY RULES (non-negotiable):
19. Every finding title must name something specific: system name, role, number, process. NEVER "Improve system integration". ALWAYS "Harvest→Xero disconnect: Maria transfers 8 hours/month manually..."
20. Every recommendation must reference at least ONE desired_outcome by name.
21. freedomUnlocked must echo their monday_morning_vision language.
22. Quick wins must be things THIS team can do THIS week — name person, system, setting.
23. If a recommendation would be identical for a plumber and a creative agency, it's too generic.
24. aspirationGap must name specific systems and hours. Not "better integration" but "Harvest has no connection to Xero — 8 hrs/month blocks the goal".

BANNED: Additionally, Furthermore, Moreover, Delve, Crucial, pivotal, vital, Testament to, Showcases, fostering, Tapestry, landscape, Synergy, leverage, streamline, optimize, holistic.
BANNED STRUCTURES: "Not only X but also Y"; "It's important to note..."; Generic recommendations like "implement a CRM", "automate invoicing". Name the specific tool. Findings without system-to-system gap evidence.
Return ONLY valid JSON.`;

function buildPhase2Prompt(phase1: any, clientName: string, hourlyRate: number): string {
  const factsStr = JSON.stringify(phase1.facts, null, 2);
  const scoresStr = JSON.stringify(phase1.scores, null, 2);
  return `
Given these extracted facts about ${clientName}, generate specific findings and quick wins. Use EXACT verbatim quotes where relevant.

uniquenessBrief: ${phase1.uniquenessBrief}

facts (extracted):
${factsStr}

scores:
${scoresStr}

Return JSON:
{
  "findings": [
    {
      "severity": "critical|high|medium|low",
      "category": "integration_gap|manual_process|data_silo|single_point_failure|scalability_risk",
      "title": "Specific title with system names and numbers",
      "description": "What's broken and why, using their words",
      "evidence": ["Specific data point 1", "Data point 2"],
      "clientQuote": "Their exact words",
      "affectedSystems": ["Xero", "Asana"],
      "affectedProcesses": ["quote_to_cash", "record_to_report"],
      "hoursWastedWeekly": number,
      "annualCostImpact": number,
      "scalabilityImpact": "What happens at 1.5x growth",
      "recommendation": "Specific fix",
      "blocksGoal": "Which desired_outcome this blocks — use their exact text"
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
  ]
}
${SPECIFICITY_AND_BANNED}
`;
}

async function runPhase2(
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
  const phase1 = report.pass1_data.phase1;
  const clientName = phase1.facts.companyName || 'the business';
  const prompt = buildPhase2Prompt(phase1, clientName, hourlyRate);
  const { data, tokensUsed, cost, generationTime } = await callSonnet(prompt, 6000, 2, openRouterKey);

  const existingPass1 = report.pass1_data as any;
  console.log('[SA Pass 1] Phase 2: Writing to DB...');
  await supabaseClient
    .from('sa_audit_reports')
    .update({
      pass1_data: { ...existingPass1, phase2: data },
      executive_summary: 'Phase 2/3: Generating findings and quick wins...',
    })
    .eq('engagement_id', engagementId);
  console.log('[SA Pass 1] Phase 2: DB write complete');

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

  return { success: true, phase: 2 };
}

// ---------- Phase 3: PRESCRIBE (recommendations, adminGuidance, clientPresentation) ----------
function buildPhase3Prompt(phase1: any, phase2: any, clientName: string): string {
  const findingSummaries = (phase2.findings || []).map((f: any) => ({
    title: f.title,
    severity: f.severity,
    affectedSystems: f.affectedSystems,
    hoursWastedWeekly: f.hoursWastedWeekly,
    blocksGoal: f.blocksGoal,
  }));
  return `
Given these facts and findings for ${clientName}, generate recommendations, admin guidance, and client presentation.

uniquenessBrief: ${phase1.uniquenessBrief}

Key facts: desiredOutcomes=${JSON.stringify(phase1.facts.desiredOutcomes)}, mondayMorningVision="${phase1.facts.mondayMorningVision}", aspirationGap="${phase1.facts.aspirationGap}".
Systems (names, costs, gaps): ${JSON.stringify(phase1.facts.systems?.map((s: any) => ({ name: s.name, monthlyCost: s.monthlyCost, gaps: s.gaps })))}.
Processes: ${JSON.stringify(phase1.facts.processes?.map((p: any) => ({ chainName: p.chainName, hoursWasted: p.hoursWasted })))}.
hoursWastedWeekly: ${phase1.facts.hoursWastedWeekly}, annualCostOfChaos: ${phase1.facts.annualCostOfChaos}.

Finding summaries (for recommendations):
${JSON.stringify(findingSummaries, null, 2)}

Return JSON:
{
  "recommendations": [
    {
      "priorityRank": 1,
      "title": "Recommendation with systems",
      "description": "How this fixes their specific problems",
      "category": "foundation|quick_win|strategic|optimization",
      "implementationPhase": "immediate|short_term|medium_term|long_term",
      "systemsInvolved": ["Xero", "Asana"],
      "processesFixed": ["quote_to_cash"],
      "estimatedCost": number,
      "hoursSavedWeekly": number,
      "annualBenefit": number,
      "paybackMonths": number,
      "freedomUnlocked": "Echo their monday_morning_vision — use THEIR language",
      "goalsAdvanced": ["Which desired_outcomes — EXACT option text"]
    }
  ],
  "adminGuidance": {
    "talkingPoints": [{ "topic": "...", "point": "...", "clientQuote": "...", "importance": "critical|high|medium" }],
    "questionsToAsk": [{ "question": "...", "purpose": "...", "expectedInsight": "...", "followUp": "..." }],
    "nextSteps": [{ "action": "...", "owner": "Practice team|Client|Joint", "timing": "...", "outcome": "...", "priority": 1 }],
    "tasks": [{ "task": "...", "assignTo": "...", "dueDate": "...", "deliverable": "..." }],
    "riskFlags": [{ "flag": "...", "mitigation": "...", "severity": "high|medium|low" }]
  },
  "clientPresentation": {
    "executiveBrief": "One paragraph (under 100 words) for a busy MD — cost and path forward, no jargon",
    "roiSummary": {
      "currentAnnualCost": number,
      "projectedSavings": number,
      "implementationCost": number,
      "paybackPeriod": "X months",
      "threeYearROI": "X:1",
      "timeReclaimed": "X hours/week"
    },
    "topThreeIssues": [{ "issue": "...", "impact": "£X or Y hours/week", "solution": "...", "timeToFix": "..." }]
  }
}

ADMIN GUIDANCE: At least 5 talking points, 4 questions, 3 next steps, 3 tasks. Flag risks. Client presentation jargon-free.
${SPECIFICITY_AND_BANNED}
`;
}

async function runPhase3(
  supabaseClient: any,
  engagementId: string,
  engagement: any,
  openRouterKey: string
): Promise<{ success: boolean; phase: number; reportId: string }> {
  const { data: reportRow } = await supabaseClient
    .from('sa_audit_reports')
    .select('id, pass1_data')
    .eq('engagement_id', engagementId)
    .single();
  if (!reportRow?.pass1_data?.phase1 || !reportRow.pass1_data.phase2) {
    throw new Error('Phase 1 or Phase 2 data not found');
  }
  const phase1 = reportRow.pass1_data.phase1;
  const phase2 = reportRow.pass1_data.phase2;
  const clientName = phase1.facts.companyName || 'the business';
  const prompt = buildPhase3Prompt(phase1, phase2, clientName);
  const { data: phase3, tokensUsed, cost, generationTime } = await callSonnet(prompt, 6000, 3, openRouterKey);

  const finalPass1Data = {
    uniquenessBrief: phase1.uniquenessBrief,
    facts: phase1.facts,
    scores: phase1.scores,
    findings: phase2.findings,
    quickWins: phase2.quickWins,
    recommendations: phase3.recommendations,
    adminGuidance: phase3.adminGuidance,
    clientPresentation: phase3.clientPresentation,
  };

  const f = phase1.facts;
  const recs = phase3.recommendations || [];
  const totalInv = recs.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0);
  const totalBenefit = recs.reduce((sum: number, r: any) => sum + (r.annualBenefit || 0), 0);
  const hoursReclaimable = recs.reduce((sum: number, r: any) => sum + (parseFloat(r.hoursSavedWeekly) || 0), 0) ||
    (phase2.quickWins || []).reduce((sum: number, q: any) => sum + (parseFloat(q.hoursSavedWeekly) || 0), 0);

  await supabaseClient.from('sa_recommendations').delete().eq('engagement_id', engagementId);
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

  const updatePayload: any = {
    pass1_data: finalPass1Data,
    status: 'pass1_complete',
    executive_summary: '[Pass 2 will generate narrative]',
    headline: `[PENDING PASS 2] ${f.hoursWastedWeekly} hours/week wasted`,
    quick_wins: phase2.quickWins,
    critical_findings_count: (phase2.findings || []).filter((x: any) => x.severity === 'critical').length,
    high_findings_count: (phase2.findings || []).filter((x: any) => x.severity === 'high').length,
    medium_findings_count: (phase2.findings || []).filter((x: any) => x.severity === 'medium').length,
    low_findings_count: (phase2.findings || []).filter((x: any) => x.severity === 'low').length,
    total_recommended_investment: Math.round(totalInv / 10) * 10,
    total_annual_benefit: Math.round(totalBenefit / 10) * 10,
    overall_payback_months: totalBenefit > 0 ? Math.round(totalInv / (totalBenefit / 12)) : 0,
    roi_ratio: totalInv > 0 ? `${(totalBenefit / totalInv).toFixed(1)}:1` : '0:1',
    hours_reclaimable_weekly: Math.round(hoursReclaimable),
    cost_of_chaos_narrative: '[Pass 2 will generate narrative]',
    time_freedom_narrative: '[Pass 2 will generate narrative]',
    what_this_enables: [f.magicFix?.substring(0, 200) || ''],
    client_quotes_used: f.allClientQuotes?.slice(0, 10) || [],
    generated_at: new Date().toISOString(),
  };
  if (phase3.adminGuidance) {
    updatePayload.admin_talking_points = phase3.adminGuidance.talkingPoints || [];
    updatePayload.admin_questions_to_ask = phase3.adminGuidance.questionsToAsk || [];
    updatePayload.admin_next_steps = phase3.adminGuidance.nextSteps || [];
    updatePayload.admin_tasks = phase3.adminGuidance.tasks || [];
    updatePayload.admin_risk_flags = phase3.adminGuidance.riskFlags || [];
  }
  if (phase3.clientPresentation) {
    updatePayload.client_executive_brief = phase3.clientPresentation.executiveBrief || null;
    updatePayload.client_roi_summary = phase3.clientPresentation.roiSummary || null;
  }

  console.log('[SA Pass 1] Phase 3: Writing to DB...');
  const { error: updateError } = await supabaseClient
    .from('sa_audit_reports')
    .update(updatePayload)
    .eq('engagement_id', engagementId);
  console.log('[SA Pass 1] Phase 3: DB write complete');
  if (updateError) {
    console.error('[SA Pass 1] Phase 3 update error:', updateError);
    throw updateError;
  }

  return { success: true, phase: 3, reportId: reportRow.id };
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
          { engagement_id: engagementId, status: 'generating', executive_summary: 'Phase 1/3: Extracting facts and analysing systems...' },
          { onConflict: 'engagement_id' }
        );
        const [discoveryRes, systemsRes, deepDivesRes] = await Promise.all([
          supabaseClient.from('sa_discovery_responses').select('*').eq('engagement_id', engagementId).single(),
          supabaseClient.from('sa_system_inventory').select('*').eq('engagement_id', engagementId),
          supabaseClient.from('sa_process_deep_dives').select('*').eq('engagement_id', engagementId),
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
          deepDivesRes.data || [],
          clientName,
          hourlyRate,
          openRouterKey
        );
        break;
      }
      case 2: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 2/3: Generating findings and quick wins...' })
          .eq('engagement_id', engagementId);
        result = await runPhase2(supabaseClient, engagementId, engagement, hourlyRate, openRouterKey);
        break;
      }
      case 3: {
        await supabaseClient
          .from('sa_audit_reports')
          .update({ executive_summary: 'Phase 3/3: Building recommendations and admin guidance...' })
          .eq('engagement_id', engagementId);
        result = await runPhase3(supabaseClient, engagementId, engagement, openRouterKey);
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
        nextPhase: phase < 3 ? phase + 1 : null,
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
