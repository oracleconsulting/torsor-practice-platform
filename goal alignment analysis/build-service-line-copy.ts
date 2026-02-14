/**
 * BUILD SERVICE LINE
 *
 * Generates a complete service line blueprint (catalogue, assessment, deliverables,
 * delivery methodology, skills, discovery scoring, value narrative) using Claude Opus 4.6.
 * Output is stored in service_line_blueprints for advisor review and promotion.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Compact service registry for prompt context (codes + names + outcome + tier summary)
const REGISTRY_SUMMARY = `benchmarking: Industry Benchmarking - "You'll Know Where You Stand" - Tier 1 £2,000 / Tier 2 £4,500 one-off
business_intelligence: Business Intelligence - "You'll Know Your Numbers" - Clarity/Foresight/Strategic monthly turnover-scaled
systems_audit: Systems & Process Audit - "You'll See Where The Time Goes" - £2,000 / £4,500 one-off
goal_alignment: Goal Alignment Programme - "You'll Have Someone In Your Corner" - Lite £1,500 / Growth £4,500 / Partner £9,000 annual
fractional_cfo: Fractional CFO - "Strategic Financial Leadership" - £4,000/month
fractional_coo: Fractional COO - "Someone Else Carries The Load" - £3,750/month
automation: Automation Services - "The Manual Work Disappears" - Project £5,000 / Retainer £1,500 monthly
business_advisory: Business Advisory & Exit Planning - "You'll Know What It's Worth" - Tier 1 £2,000 / Tier 2 £4,000 one-off`;

interface BuildServiceLineRequest {
  practiceId: string;
  conceptId?: string;
  opportunityId?: string;
  manualInput?: {
    problemStatement: string;
    targetClient: string;
    suggestedName?: string;
    pricingGuidance?: string;
    deliveryPreference?: string;
    existingInspirations?: string[];
  };
  clientExamples?: string[];
  additionalContext?: string;
}

// Minimal types for blueprint (full schema in spec)
interface ServiceLineBlueprint {
  identity: {
    code: string;
    name: string;
    displayName: string;
    category: string;
    outcome: string;
    tagline: string;
    description: string;
    problemStatement: string;
    targetClient: string;
    notSuitableFor: string;
    keywords: string[];
  };
  pricing: {
    isRecurring: boolean;
    pricingModel: string;
    tiers: Array<{
      name: string;
      tagline: string;
      description: string;
      pricingModel: string;
      price?: number;
      priceFormatted?: string;
      priceRanges?: Array<{ maxTurnover: number | null; price: number; priceFormatted: string }>;
      priceFromFormatted?: string;
      period: string;
      periodLabel: string;
      showInPopup: boolean;
      popupCtaLabel: string;
    }>;
    defaultTierIndex: number;
    valueJustification: string;
    competitorComparison: string;
  };
  assessment: {
    estimatedMinutes: number;
    sections: Array<{
      name: string;
      description: string;
      questions: Array<{
        questionId: string;
        questionText: string;
        questionType: string;
        options?: string[];
        placeholder?: string;
        charLimit?: number;
        isRequired: boolean;
        displayOrder: number;
        aiAnchor: string;
        scoringHints?: Array<{ responsePattern: string; severity: string; insight: string }>;
      }>;
    }>;
  };
  deliverables?: any[];
  delivery?: any;
  skills?: { required: any[]; desirable?: any[]; newSkillsNeeded?: any[] };
  scoring?: {
    choiceTriggers: Array<{ questionId: string; responseValue: string; points: number; triggerDescription: string }>;
    keywordTriggers?: Array<{ keywords: string[]; targetQuestions: string[]; points: number; triggerDescription: string }>;
    recommendationThreshold?: number;
  };
  narrative?: {
    outcomeStatement: string;
    beforeState: string;
    afterState: string;
    valueDrivers?: string[];
    costOfNotActing?: string[];
    enabledByString: string;
    enabledByStringDeferred?: string;
    objectionHandlers?: Array<{ objection: string; response: string }>;
    journeyPhases?: Array<{ phase: string; headline: string; description: string }>;
  };
  implementation?: Record<string, string>;
  meta?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  let body: BuildServiceLineRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { practiceId, conceptId, opportunityId, manualInput, clientExamples, additionalContext } = body;
  if (!practiceId) {
    return new Response(JSON.stringify({ error: 'practiceId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!conceptId && !opportunityId && !manualInput?.problemStatement) {
    return new Response(JSON.stringify({ error: 'Provide conceptId, opportunityId, or manualInput with problemStatement and targetClient' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let sourceData = '';
  let sourceName = 'New Service';

  if (conceptId) {
    const { data: concept, error: conceptError } = await supabase
      .from('service_concepts')
      .select('*')
      .eq('id', conceptId)
      .single();
    if (conceptError || !concept) {
      return new Response(JSON.stringify({ error: 'Concept not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    sourceData = `
## SERVICE CONCEPT
Name: ${concept.suggested_name}
Problem: ${concept.problem_it_solves}
Description: ${concept.description || 'N/A'}
Deliverables: ${JSON.stringify(concept.suggested_deliverables || [])}
Pricing: ${concept.suggested_pricing || 'N/A'}
Times Identified: ${concept.times_identified ?? 1}
Market Size: ${concept.market_size_estimate || 'N/A'}
`;
    sourceName = concept.suggested_name;
  } else if (opportunityId) {
    const { data: opp, error: oppError } = await supabase
      .from('discovery_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();
    if (oppError || !opp) {
      return new Response(JSON.stringify({ error: 'Opportunity not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    sourceData = `
## OPPORTUNITY
Title: ${opp.title}
Description: ${opp.description || 'N/A'}
Category: ${opp.category || 'N/A'}
Severity: ${opp.severity || 'N/A'}
Financial Impact: ${opp.financial_impact_amount != null ? `£${opp.financial_impact_amount}` : 'N/A'} (${opp.financial_impact_type || 'N/A'})
Life Impact: ${opp.life_impact || 'N/A'}
Service Fit Limitation: ${opp.service_fit_limitation || 'None noted'}
Talking Point: ${opp.talking_point || 'N/A'}
`;
    sourceName = opp.title;
  } else if (manualInput) {
    sourceData = `
## MANUAL SERVICE CONCEPT
Problem: ${manualInput.problemStatement}
Target Client: ${manualInput.targetClient}
Suggested Name: ${manualInput.suggestedName || 'Not specified'}
Pricing Guidance: ${manualInput.pricingGuidance || 'Not specified'}
Delivery Preference: ${manualInput.deliveryPreference || 'Not specified'}
Draw Patterns From: ${(manualInput.existingInspirations || []).join(', ') || 'None specified'}
`;
    sourceName = manualInput.suggestedName || 'New Service';
  }

  if (clientExamples?.length) {
    const { data: discoveries } = await supabase
      .from('destination_discovery')
      .select('responses, part2_responses')
      .in('client_id', clientExamples.slice(0, 3));
    if (discoveries?.length) {
      sourceData += '\n## CLIENT EXAMPLES (anonymised)\n';
      discoveries.forEach((c: any, i: number) => {
        const r = c.responses || {};
        const p2 = c.part2_responses || {};
        sourceData += `\nClient ${i + 1}: Magic fix / priority: ${r.dd_priority_focus || r.dd_magic_fix || 'N/A'}. Growth blocker: ${p2.sd_growth_blocker || 'N/A'}.\n`;
      });
    }
  }

  const { data: blueprintRow, error: insertError } = await supabase
    .from('service_line_blueprints')
    .insert({
      practice_id: practiceId,
      source_type: conceptId ? 'concept' : opportunityId ? 'opportunity' : 'manual',
      source_concept_id: conceptId || null,
      source_opportunity_id: opportunityId || null,
      status: 'generating',
      service_code: 'pending',
      service_name: sourceName,
      display_name: sourceName,
      category: 'strategic',
    })
    .select()
    .single();

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const [{ data: assessmentQuestions }, { data: skills }, { data: existingServices }] = await Promise.all([
    supabase
      .from('assessment_questions')
      .select('question_id, question_text, question_type, options, section')
      .in('service_line_code', ['destination_discovery', 'service_diagnostic'])
      .eq('is_active', true)
      .order('display_order'),
    supabase.from('skills').select('name, category').eq('is_active', true).order('category').order('name'),
    supabase.from('services').select('code, name, category').limit(50),
  ]);

  const formattedQuestions = (assessmentQuestions || [])
    .map((q: any) => `[${q.question_id}] ${q.section}: ${q.question_text} (${q.question_type})`)
    .join('\n');
  const formattedSkills = (skills || []).reduce((acc: Record<string, string[]>, s: any) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s.name);
    return acc;
  }, {});
  const existingCodes = (existingServices || []).map((s: any) => s.code).join(', ');

  const systemPrompt = `You are a senior business services consultant designing a new service line for Torsor, a UK-based Business Services Group within an accountancy practice.

## CONTEXT
Torsor sells DESTINATIONS, not services. We use an "estate agent" philosophy: we sell the life outcome (time with family, financial security, ability to step back). We connect business metrics to personal aspirations. Use clients' exact words as narrative anchors. British English only. Punch, don't pad. No buzzwords: "leverage", "synergy", "paradigm", "holistic", "empower".

## EXISTING SERVICE CATALOGUE (do not duplicate codes)
${REGISTRY_SUMMARY}

## EXISTING SERVICE CODES (your new code must be unique snake_case)
${existingCodes}

## DISCOVERY QUESTIONS (use these IDs for scoring triggers)
${formattedQuestions}

## SKILLS FRAMEWORK (use these names where possible)
${JSON.stringify(formattedSkills, null, 2)}

## YOUR TASK
Design a COMPLETE service line based on the input below. Return a single JSON object with these top-level keys only: identity, pricing, assessment, deliverables, delivery, skills, scoring, narrative, meta.

Requirements:
1. identity: code (unique snake_case), name, displayName, category (foundation|growth|strategic|operational), outcome, tagline, description, problemStatement, targetClient, notSuitableFor, keywords (array).
2. pricing: isRecurring, pricingModel (fixed|turnover-scaled), tiers (array of { name, tagline, description, pricingModel, price or priceRanges, priceFormatted or priceFromFormatted, period (one-off|monthly|quarterly|annual), periodLabel, showInPopup: true, popupCtaLabel }), defaultTierIndex, valueJustification, competitorComparison.
3. assessment: estimatedMinutes, sections (array of { name, description, questions }). Each question: questionId (snake_case prefix matching service code), questionText, questionType (text|single|multi|scale|number), options (if single/multi), placeholder, charLimit, isRequired, displayOrder, aiAnchor. Include 10-20 questions across 3-5 sections. Include at least one "magic wand" and one quantification question.
4. deliverables: array of { tierName, deliverables: [{ name, description, format, frequency, estimatedHours, automatable }], totalEstimatedHours, marginTarget }.
5. delivery: model (project|retainer|programme|hybrid), typicalDuration, stages (array of { name, description, duration, activities, clientActions, deliverables, reviewGate }), clientTouchpoints, teamRequired, qualityGates.
6. skills: required (array of { skillName, category, minLevel 1-5, idealLevel, isCritical }), desirable, newSkillsNeeded (if any).
7. scoring: choiceTriggers (array of { questionId, responseValue, points 15-50, triggerDescription }) referencing EXISTING discovery question IDs above; keywordTriggers (keywords, targetQuestions, points, triggerDescription); recommendationThreshold 50.
8. narrative: outcomeStatement, beforeState, afterState, valueDrivers (array), costOfNotActing (array), enabledByString, enabledByStringDeferred, objectionHandlers (array of { objection, response }), journeyPhases (array of { phase, headline, description }).
9. meta: generatedAt (ISO string), generatedBy "claude-opus-4.6", estimatedMRRContribution, marketSizeEstimate (niche|moderate|broad), competitiveAdvantage, riskFactors (array), dependsOn (array), canBundleWith (array).

Pricing must be credible for UK SME (£500k–£20M turnover). Assessment questions must be diagnostic; use language business owners use. Return ONLY valid JSON, no markdown fences, no commentary.`;

  const userMessage = `Generate the complete service line blueprint for this input:\n\n${sourceData}${additionalContext ? `\n\n## ADVISOR NOTES\n${additionalContext}` : ''}`;

  const startTime = Date.now();
  let llmResponse: Response;
  try {
    llmResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Service Line Builder',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        max_tokens: 16000,
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });
  } catch (e) {
    await supabase
      .from('service_line_blueprints')
      .update({ status: 'draft', blueprint: { error: 'LLM request failed', message: String(e) } })
      .eq('id', blueprintRow.id);
    return new Response(JSON.stringify({ error: 'LLM request failed', id: blueprintRow.id }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const llmResult = await llmResponse.json();
  const duration = Date.now() - startTime;
  const rawContent = llmResult.choices?.[0]?.message?.content || '';
  let parsed: ServiceLineBlueprint;

  try {
    const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    await supabase
      .from('service_line_blueprints')
      .update({
        status: 'draft',
        blueprint: { error: 'Parse failed', raw: rawContent.substring(0, 5000) },
        llm_model: llmResult.model || 'claude-sonnet-4',
        generation_duration_ms: duration,
      })
      .eq('id', blueprintRow.id);
    return new Response(
      JSON.stringify({ id: blueprintRow.id, status: 'parse_error', error: 'Failed to parse LLM output' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const code = parsed.identity?.code || 'unknown';
  const name = parsed.identity?.name || sourceName;
  const displayName = parsed.identity?.displayName || name;
  const category = parsed.identity?.category || 'strategic';

  parsed.implementation = generateImplementationArtefacts(parsed);
  if (!parsed.meta) parsed.meta = {};
  parsed.meta.generatedAt = new Date().toISOString();
  parsed.meta.generatedBy = llmResult.model || 'claude-sonnet-4';

  await supabase
    .from('service_line_blueprints')
    .update({
      status: 'draft',
      service_code: code,
      service_name: name,
      display_name: displayName,
      category,
      blueprint: parsed,
      llm_model: llmResult.model,
      generation_tokens: llmResult.usage?.total_tokens,
      generation_cost_usd: llmResult.usage?.total_tokens ? (llmResult.usage.total_tokens / 1e6) * 3 : null,
      generation_duration_ms: duration,
    })
    .eq('id', blueprintRow.id);

  if (conceptId) {
    await supabase
      .from('service_concepts')
      .update({ review_status: 'blueprint_generated' })
      .eq('id', conceptId);
  }

  return new Response(
    JSON.stringify({
      id: blueprintRow.id,
      status: 'draft',
      serviceCode: code,
      serviceName: name,
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});

function generateImplementationArtefacts(bp: ServiceLineBlueprint): Record<string, string> {
  const code = bp.identity.code;
  const defaultTier = bp.pricing.tiers[bp.pricing.defaultTierIndex ?? 0];
  const price = defaultTier?.price ?? defaultTier?.priceRanges?.[0]?.price ?? 0;
  const priceFormatted = defaultTier?.priceFormatted ?? defaultTier?.priceFromFormatted ?? 'TBD';

  const registryEntry = `
  ${code}: {
    code: '${code}',
    name: '${bp.identity.name}',
    displayName: '${bp.identity.displayName}',
    category: '${bp.identity.category}',
    outcome: "${(bp.narrative?.outcomeStatement || bp.identity.outcome).replace(/"/g, '\\"')}",
    description: '${(bp.identity.description || '').replace(/'/g, "''")}',
    keywords: ${JSON.stringify(bp.identity.keywords || [])},
    tiers: ${JSON.stringify(bp.pricing.tiers, null, 6)},
    defaultTierIndex: ${bp.pricing.defaultTierIndex ?? 0},
    isActive: true
  },`;

  const scorerLines: string[] = [];
  for (const t of bp.scoring?.choiceTriggers || []) {
    scorerLines.push(`
  if (getLower(responses.${t.questionId}) === '${(t.responseValue || '').toLowerCase().replace(/'/g, "\\'")}') {
    addPoints('${code}', ${t.points}, '${(t.triggerDescription || '').replace(/'/g, "\\'")}');
  }`);
  }
  for (const kw of bp.scoring?.keywordTriggers || []) {
    scorerLines.push(`
  for (const qId of ${JSON.stringify(kw.targetQuestions || [])}) {
    if (containsAny(getLower(responses[qId] || ''), ${JSON.stringify(kw.keywords || [])})) {
      addPoints('${code}', ${kw.points}, '${(kw.triggerDescription || '').replace(/'/g, "\\'")}');
      break;
    }
  }`);
  }
  const scorerAdditions = `
// === ${bp.identity.name} ===
// Add to SERVICES array: { code: '${code}', name: '${bp.identity.name}' },
// Add inside scoreServicesFromDiscovery():
${scorerLines.join('\n')}`;

  const assessmentRows: string[] = [];
  let orderCounter = 1;
  for (const section of bp.assessment.sections || []) {
    for (const q of section.questions || []) {
      const opt = q.options?.length ? `'${JSON.stringify(q.options).replace(/'/g, "''")}'` : 'NULL';
      const ph = q.placeholder ? `'${String(q.placeholder).replace(/'/g, "''")}'` : 'NULL';
      assessmentRows.push(`('${code}', '${section.name}', '${q.questionId}', '${String(q.questionText).replace(/'/g, "''")}', '${q.questionType}', ${opt}, ${ph}, ${q.charLimit ?? 'NULL'}, ${q.isRequired}, ${orderCounter++}, '${(q.aiAnchor || '').replace(/'/g, "''")}')`);
    }
  }
  const assessmentMigration = assessmentRows.length
    ? `-- Assessment questions for ${bp.identity.name}\nINSERT INTO assessment_questions (service_line_code, section, question_id, question_text, question_type, options, placeholder, char_limit, is_required, display_order, ai_anchor)\nVALUES\n${assessmentRows.join(',\n')};`
    : '-- No assessment questions';

  const servicesMigration = `
INSERT INTO services (code, name, category, description, status, price_amount, price_period, price_display)
VALUES ('${code}', '${bp.identity.name}', '${bp.identity.category}', '${(bp.identity.description || '').replace(/'/g, "''")}', 'active', ${price}, '${defaultTier?.period || 'one-off'}', '${priceFormatted}')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, description = EXCLUDED.description, price_amount = EXCLUDED.price_amount, price_period = EXCLUDED.price_period, price_display = EXCLUDED.price_display;`;

  const pricingTierRows = (bp.pricing.tiers || []).map((tier, idx) => {
    const p = tier.price ?? tier.priceRanges?.[0]?.price ?? 0;
    const pf = tier.priceFormatted ?? tier.priceFromFormatted ?? 'TBD';
    const freq = tier.period === 'monthly' ? 'monthly' : tier.period === 'annual' ? 'annual' : tier.period === 'quarterly' ? 'quarterly' : 'one_time';
    return `-- Tier: ${tier.name}\nINSERT INTO service_pricing_tiers (service_pricing_id, tier_name, tier_code, price, frequency, description) SELECT id, '${tier.name}', '${(tier.name || 'tier' + (idx + 1)).toLowerCase().replace(/\s+/g, '_')}', ${p}, '${freq}', '${(tier.tagline || '').replace(/'/g, "''")}' FROM service_pricing WHERE practice_id = '{{PRACTICE_ID}}' AND service_code = '${code}';`;
  });
  const pricingMigration = `-- First ensure service_pricing row exists for practice:\nINSERT INTO service_pricing (practice_id, service_code, service_name, category, pricing_model)\nVALUES ('{{PRACTICE_ID}}', '${code}', '${bp.identity.name}', '${bp.identity.category}', 'tiered')\nON CONFLICT (practice_id, service_code) DO UPDATE SET service_name = EXCLUDED.service_name;\n\n${pricingTierRows.join('\n\n')}`;

  const skillsLines = (bp.skills?.required || []).map((s: any) => `| ${s.skillName} | ${s.category} | ${s.minLevel} | ${s.idealLevel} | ${s.isCritical ? 'Yes' : 'No'} |`).join('\n');
  const skillsMappingUpdate = `### ${bp.identity.name}\n| Skill | Category | Min Level | Ideal Level | Critical |\n|-------|----------|-----------|-------------|----------|\n${skillsLines}`;

  const pass2Updates = `
// ENABLED_BY_STRINGS: '${code}': { phase1: '${bp.narrative?.enabledByString || bp.identity.name}', deferred: '${bp.narrative?.enabledByStringDeferred || bp.identity.name} — when ready' },
// SERVICE_CATALOG (Pass 1): '${code}': { name: '${bp.identity.name}', defaultPrice: ${price}, period: '${defaultTier?.period}', category: '${bp.identity.category}' },`;

  return {
    registryEntry,
    scorerAdditions,
    assessmentMigration,
    pricingMigration,
    servicesMigration,
    skillsMappingUpdate,
    pass2Updates,
  };
}
