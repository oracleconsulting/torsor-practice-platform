import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// PASS 1: EXTRACTION & ANALYSIS (Sonnet)
// Extracts structured data from all three assessment stages
// Saves to sa_audit_reports with status 'pass1_complete'
// Triggers Pass 2 automatically
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
          "invoiceLagDays": 10
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
  },
  
  "adminGuidance": {
    "talkingPoints": [
      {
        "topic": "Short topic name",
        "point": "What to say about this topic - be specific and actionable",
        "clientQuote": "Exact quote from their responses to reference",
        "importance": "critical|high|medium"
      }
    ],
    "questionsToAsk": [
      {
        "question": "Specific probing question to ask in the meeting",
        "purpose": "Why this question matters - what insight it unlocks",
        "expectedInsight": "What you expect to learn from asking this",
        "followUp": "Natural follow-up question based on likely answer"
      }
    ],
    "nextSteps": [
      {
        "action": "Specific action to take",
        "owner": "Practice team|Client|Joint",
        "timing": "Within X days/weeks",
        "outcome": "What this achieves",
        "priority": 1
      }
    ],
    "tasks": [
      {
        "task": "Specific task description",
        "assignTo": "Role who should do this",
        "dueDate": "Before next meeting|Within 1 week|etc",
        "deliverable": "What output is expected"
      }
    ],
    "riskFlags": [
      {
        "flag": "What to watch out for",
        "mitigation": "How to address this concern",
        "severity": "high|medium|low"
      }
    ]
  },
  
  "clientPresentation": {
    "executiveBrief": "One paragraph (under 100 words) summary for a busy MD - focus on the cost and the path forward, no jargon",
    "roiSummary": {
      "currentAnnualCost": number,
      "projectedSavings": number,
      "implementationCost": number,
      "paybackPeriod": "X months",
      "threeYearROI": "X:1 ratio",
      "timeReclaimed": "X hours/week"
    },
    "topThreeIssues": [
      {
        "issue": "Clear issue title",
        "impact": "£X annual impact or Y hours/week",
        "solution": "Specific solution in plain language",
        "timeToFix": "X days/weeks"
      }
    ]
  }
}

RULES:
1. Every finding must reference specific systems AND processes
2. Every recommendation must list which systems and processes it fixes
3. Use EXACT verbatim quotes - do not paraphrase their magic fix
4. Calculate hours realistically based on their actual volumes
5. Integration gaps must name both systems involved
6. Quick wins must be implementable in under 1 week

ADMIN GUIDANCE RULES:
7. Generate at least 5 talking points - prioritize their expensive mistake and magic fix
8. Generate at least 4 probing questions that uncover hidden costs or expand scope
9. Generate at least 3 next steps with clear owners and timing
10. Generate at least 3 tasks for the practice team to prepare
11. Flag any risks: change appetite concerns, budget constraints, key person dependencies
12. Client presentation must be jargon-free and focus on outcomes, not process

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
    
    console.log('[SA Pass 1] Starting extraction for:', engagementId);
    
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
    
    // Build and send prompt
    console.log('[SA Pass 1] Calling Sonnet for extraction...');
    const startTime = Date.now();
    
    const prompt = buildPass1Prompt(discovery, systems || [], deepDives || [], clientName);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor SA Pass 1'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 32000  // Increased to handle large structured outputs
      })
    });
    
    if (!response.ok) {
      throw new Error(`Sonnet API failed: ${await response.text()}`);
    }
    
    const result = await response.json();
    const generationTime = Date.now() - startTime;
    const tokensUsed = result.usage?.total_tokens || 0;
    const cost = (tokensUsed / 1000000) * 3; // Sonnet pricing
    
    // Parse response
    let pass1Data;
    try {
      let content = result.choices[0].message.content.trim();
      
      // Check if response was truncated (finish_reason === 'length')
      const finishReason = result.choices[0].finish_reason;
      const wasTruncated = finishReason === 'length';
      
      if (wasTruncated) {
        console.warn('[SA Pass 1] Response was truncated (hit max_tokens limit)');
      }
      
      // Remove markdown code fences
      content = content.replace(/^```[a-z]*\s*\n?/gi, '').replace(/\n?```\s*$/g, '').trim();
      
      // Find the first brace (start of JSON)
      const firstBrace = content.indexOf('{');
      if (firstBrace > 0) content = content.substring(firstBrace);
      
      // If truncated, try to find the last complete top-level object
      if (wasTruncated) {
        // Find the last complete closing brace for the root object
        let braceCount = 0;
        let lastBrace = -1;
        for (let i = 0; i < content.length; i++) {
          if (content[i] === '{') braceCount++;
          if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              lastBrace = i;
            }
          }
        }
        if (lastBrace > 0) {
          content = content.substring(0, lastBrace + 1);
          console.log('[SA Pass 1] Truncated response - extracted complete JSON object');
        } else {
          // Try to close incomplete JSON by finding last complete property
          const lastComma = content.lastIndexOf(',');
          if (lastComma > 0) {
            // Find the start of the last property
            const lastPropStart = content.lastIndexOf('"', lastComma);
            if (lastPropStart > 0) {
              // Remove the incomplete last property and close the JSON
              content = content.substring(0, lastPropStart - 1).trim();
              // Remove trailing comma if present
              if (content.endsWith(',')) {
                content = content.substring(0, content.length - 1).trim();
              }
              // Close all open braces
              let openBraces = (content.match(/{/g) || []).length;
              let closeBraces = (content.match(/}/g) || []).length;
              for (let i = 0; i < openBraces - closeBraces; i++) {
                content += '}';
              }
              console.log('[SA Pass 1] Attempted to fix truncated JSON by closing incomplete object');
            }
          }
        }
      } else {
        // Not truncated - find the last matching brace
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
      
      pass1Data = JSON.parse(content);
    } catch (e: any) {
      console.error('[SA Pass 1] Parse error:', e.message);
      console.error('[SA Pass 1] Content length:', result.choices[0].message.content.length);
      console.error('[SA Pass 1] Finish reason:', result.choices[0].finish_reason);
      
      // Try to extract what we can from the error position
      const errorPos = e.message.match(/position (\d+)/)?.[1];
      if (errorPos) {
        const pos = parseInt(errorPos);
        console.error('[SA Pass 1] Content around error:', 
          result.choices[0].message.content.substring(Math.max(0, pos - 200), pos + 200));
      }
      
      throw new Error(`Pass 1 parse failed: ${e.message}`);
    }
    
    console.log('[SA Pass 1] Extraction complete:', {
      systems: pass1Data.facts.systems.length,
      processes: pass1Data.facts.processes.length,
      findings: pass1Data.findings.length,
      hoursWasted: pass1Data.facts.hoursWastedWeekly,
      tokens: tokensUsed,
      timeMs: generationTime
    });
    
    const f = pass1Data.facts;
    const scores = pass1Data.scores;
    
    // Determine sentiment
    let sentiment = 'good_with_gaps';
    const avgScore = (scores.integration.score + scores.automation.score + scores.dataAccessibility.score + scores.scalability.score) / 4;
    if (avgScore >= 70) sentiment = 'strong_foundation';
    else if (avgScore >= 50) sentiment = 'good_with_gaps';
    else if (avgScore >= 30) sentiment = 'significant_issues';
    else sentiment = 'critical_attention';
    
    // Save Pass 1 results
    // First, try without pass1_data (in case column doesn't exist yet)
    const baseReportData = {
      engagement_id: engagementId,
      
      // Placeholder narratives - will be written by Pass 2
      headline: `[PENDING PASS 2] ${f.hoursWastedWeekly} hours/week wasted`,
      executive_summary: '[Pass 2 will generate narrative]',
      executive_summary_sentiment: sentiment,
      
      // Metrics from Pass 1
      total_hours_wasted_weekly: f.hoursWastedWeekly,
      total_annual_cost_of_chaos: f.annualCostOfChaos,
      growth_multiplier: f.growthMultiplier,
      projected_cost_at_scale: f.projectedCostAtScale,
      cost_of_chaos_narrative: '[Pass 2 will generate narrative]',
      
      systems_count: f.systems.length,
      integration_score: scores.integration.score,
      automation_score: scores.automation.score,
      data_accessibility_score: scores.dataAccessibility.score,
      scalability_score: scores.scalability.score,
      
      critical_findings_count: pass1Data.findings.filter((f: any) => f.severity === 'critical').length,
      high_findings_count: pass1Data.findings.filter((f: any) => f.severity === 'high').length,
      medium_findings_count: pass1Data.findings.filter((f: any) => f.severity === 'medium').length,
      low_findings_count: pass1Data.findings.filter((f: any) => f.severity === 'low').length,
      
      quick_wins: pass1Data.quickWins,
      
      total_recommended_investment: pass1Data.recommendations.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0),
      total_annual_benefit: pass1Data.recommendations.reduce((sum: number, r: any) => sum + (r.annualBenefit || 0), 0),
      overall_payback_months: Math.round(
        pass1Data.recommendations.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0) /
        Math.max(1, pass1Data.recommendations.reduce((sum: number, r: any) => sum + (r.annualBenefit || 0), 0) / 12)
      ),
      roi_ratio: `${(pass1Data.recommendations.reduce((sum: number, r: any) => sum + (r.annualBenefit || 0), 0) / 
        Math.max(1, pass1Data.recommendations.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0))).toFixed(1)}:1`,
      
      hours_reclaimable_weekly: pass1Data.recommendations.reduce((sum: number, r: any) => sum + (r.hoursSavedWeekly || 0), 0),
      time_freedom_narrative: '[Pass 2 will generate narrative]',
      what_this_enables: [f.magicFix.substring(0, 200)],
      
      client_quotes_used: f.allClientQuotes?.slice(0, 10) || [],
      
      llm_model: 'claude-sonnet-4',
      llm_tokens_used: tokensUsed,
      llm_cost: cost,
      generation_time_ms: generationTime,
      prompt_version: 'v4-pass1',
      
      status: 'pass1_complete',
      generated_at: new Date().toISOString()
    };
    
    // Prepare admin guidance and client presentation data (may not exist in DB yet)
    const adminGuidanceData = {
      admin_talking_points: pass1Data.adminGuidance?.talkingPoints || [],
      admin_questions_to_ask: pass1Data.adminGuidance?.questionsToAsk || [],
      admin_next_steps: pass1Data.adminGuidance?.nextSteps || [],
      admin_tasks: pass1Data.adminGuidance?.tasks || [],
      admin_risk_flags: pass1Data.adminGuidance?.riskFlags || [],
      client_executive_brief: pass1Data.clientPresentation?.executiveBrief || null,
      client_roi_summary: pass1Data.clientPresentation?.roiSummary || null,
    };
    
    // Try to save with all fields (pass1_data + admin guidance)
    let report;
    let saveError;
    
    const saveResult = await supabaseClient
      .from('sa_audit_reports')
      .upsert({ 
        ...baseReportData, 
        pass1_data: pass1Data,
        ...adminGuidanceData
      }, { onConflict: 'engagement_id' })
      .select()
      .single();
    
    report = saveResult.data;
    saveError = saveResult.error;
    
    // If error is about missing columns, try saving without them
    if (saveError) {
      const errorMsg = saveError.message || '';
      const hasAdminColumnError = errorMsg.includes('admin_talking_points') || 
                                  errorMsg.includes('admin_next_steps') || 
                                  errorMsg.includes('admin_questions_to_ask') || 
                                  errorMsg.includes('admin_tasks') ||
                                  errorMsg.includes('admin_risk_flags') || 
                                  errorMsg.includes('client_executive_brief') ||
                                  errorMsg.includes('client_roi_summary');
      const hasPass1DataError = errorMsg.includes('pass1_data');
      
      if (hasAdminColumnError || hasPass1DataError) {
        console.warn(`[SA Pass 1] Columns not found. Saving without them. Error: ${errorMsg}`);
        
        // Build data without missing columns
        const fallbackData: any = { ...baseReportData };
        
        // Only add pass1_data if column exists
        if (!hasPass1DataError) {
          fallbackData.pass1_data = pass1Data;
        } else {
          // Store in review_notes as fallback
          try {
            const existingNotes = fallbackData.review_notes ? JSON.parse(fallbackData.review_notes) : {};
            fallbackData.review_notes = JSON.stringify({ 
              ...existingNotes,
              _pass1_data: pass1Data, 
              _note: 'Temporary storage - migrate to pass1_data column' 
            });
          } catch {
            fallbackData.review_notes = JSON.stringify({ 
              _pass1_data: pass1Data, 
              _note: 'Temporary storage - migrate to pass1_data column' 
            });
          }
        }
        
        // Only add admin guidance if columns exist
        if (!hasAdminColumnError) {
          Object.assign(fallbackData, adminGuidanceData);
        } else {
          // Store admin guidance in review_notes as fallback
          try {
            const existingNotes = fallbackData.review_notes ? JSON.parse(fallbackData.review_notes) : {};
            fallbackData.review_notes = JSON.stringify({ 
              ...existingNotes,
              _admin_guidance: adminGuidanceData,
              _note: 'Temporary storage - migrate to admin guidance columns' 
            });
          } catch {
            fallbackData.review_notes = JSON.stringify({ 
              _admin_guidance: adminGuidanceData,
              _note: 'Temporary storage - migrate to admin guidance columns' 
            });
          }
        }
        
        const fallbackResult = await supabaseClient
          .from('sa_audit_reports')
          .upsert(fallbackData, { onConflict: 'engagement_id' })
          .select()
          .single();
        
        report = fallbackResult.data;
        saveError = fallbackResult.error;
      }
    }
    
    if (saveError || !report) {
      throw saveError || new Error('Failed to save report');
    }
    
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
    
    console.log('[SA Pass 1] Saved. Triggering Pass 2...');
    
    // Trigger Pass 2 asynchronously (with a small delay to ensure DB write is complete)
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && serviceRoleKey) {
      // Small delay to ensure database write is committed
      setTimeout(async () => {
        try {
          console.log('[SA Pass 1] Calling Pass 2 function...');
          const pass2Response = await fetch(`${supabaseUrl}/functions/v1/generate-sa-report-pass2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ engagementId, reportId: report.id })
          });
          
          if (!pass2Response.ok) {
            const errorText = await pass2Response.text();
            console.error('[SA Pass 1] Pass 2 trigger failed:', pass2Response.status, errorText);
          } else {
            console.log('[SA Pass 1] Pass 2 triggered successfully');
          }
        } catch (err) {
          console.error('[SA Pass 1] Failed to trigger Pass 2:', err);
          // Don't fail Pass 1 if Pass 2 trigger fails - it can be called manually
        }
      }, 2000); // 2 second delay
    } else {
      console.warn('[SA Pass 1] Missing SUPABASE_URL or SERVICE_ROLE_KEY - cannot trigger Pass 2');
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        reportId: report.id,
        status: 'pass1_complete',
        pass2Triggered: true,
        hoursWasted: f.hoursWastedWeekly,
        annualCost: f.annualCostOfChaos,
        findingsCount: pass1Data.findings.length,
        tokensUsed,
        cost: `£${cost.toFixed(4)}`,
        generationTimeMs: generationTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[SA Pass 1] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

