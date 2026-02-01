/**
 * CREATE SERVICE FROM OPPORTUNITY
 * 
 * Takes an identified opportunity (from client_opportunities or service_concepts)
 * and uses Claude Opus 4.5 to:
 * 1. Generate a complete service definition
 * 2. Map required skills from the 111 assessed skills
 * 3. Create detection triggers for future assessments
 * 
 * The result is saved as a draft for admin review.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Model configuration
const MODEL_CONFIG = {
  model: 'anthropic/claude-sonnet-4-20250514', // Use Sonnet for speed, Opus for complex cases
  maxTokens: 8000,
  temperature: 0.3,
};

interface OpportunityInput {
  opportunityId?: string;      // From client_opportunities
  conceptId?: string;          // From service_concepts
  engagementId?: string;
  clientId?: string;
  practiceId: string;
  requestedBy: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  required_level: number;
}

interface ServiceProposal {
  name: string;
  code: string;
  headline: string;
  description: string;
  short_description: string;
  category: string;
  deliverables: string[];
  typical_duration: string;
  time_to_first_value: string;
  delivery_complexity: 'low' | 'medium' | 'high';
  pricing_suggestion: {
    model: 'fixed' | 'monthly' | 'hourly' | 'value_based';
    price_from: number;
    price_to: number;
    unit: string;
    rationale: string;
  };
  best_for: string;
  typical_roi: string;
}

interface SkillMapping {
  skill_id: string;
  skill_name: string;
  importance: 'critical' | 'required' | 'beneficial' | 'nice_to_have';
  minimum_level: number;
  ideal_level: number;
  recommended_seniority: string[];
  rationale: string;
}

interface TriggerDefinition {
  trigger_code: string;
  trigger_name: string;
  description: string;
  trigger_type: 'metric_threshold' | 'hva_response' | 'financial_ratio' | 'combination' | 'text_pattern';
  trigger_config: Record<string, any>;
  weight: number;
  severity_when_triggered: 'critical' | 'high' | 'medium' | 'low';
  talking_point: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const input: OpportunityInput = await req.json();
    console.log('[CreateService] Starting for:', input);

    // 1. Gather source data
    const sourceData = await gatherSourceData(supabase, input);
    if (!sourceData) {
      throw new Error('Could not find source opportunity or concept');
    }

    // 2. Fetch all 111 skills
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, category, required_level')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (skillsError) throw skillsError;
    console.log(`[CreateService] Loaded ${skills?.length || 0} skills`);

    // 3. Fetch existing services for context
    const { data: existingServices } = await supabase
      .from('services')
      .select('code, name, category, description')
      .eq('status', 'active');

    // 4. Call Claude to generate service proposal
    const proposal = await generateServiceProposal(
      sourceData,
      skills as Skill[],
      existingServices || []
    );

    // 5. Save as draft for review
    const { data: creationRequest, error: saveError } = await supabase
      .from('service_creation_requests')
      .insert({
        source_type: input.opportunityId ? 'opportunity' : 'service_concept',
        source_opportunity_id: input.opportunityId || null,
        source_concept_id: input.conceptId || null,
        source_engagement_id: input.engagementId || null,
        source_client_id: input.clientId || null,
        proposed_service: proposal.service,
        proposed_skills: proposal.skills,
        proposed_triggers: proposal.triggers,
        ai_reasoning: proposal.reasoning,
        llm_model: MODEL_CONFIG.model,
        status: 'pending_review',
        requested_by: input.requestedBy,
        practice_id: input.practiceId,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    console.log('[CreateService] Created draft:', creationRequest.id);

    return new Response(
      JSON.stringify({
        success: true,
        requestId: creationRequest.id,
        proposal: {
          service: proposal.service,
          skillCount: proposal.skills.length,
          triggerCount: proposal.triggers.length,
        },
        message: 'Service proposal created and awaiting review',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CreateService] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherSourceData(supabase: any, input: OpportunityInput) {
  if (input.opportunityId) {
    const { data: opportunity } = await supabase
      .from('client_opportunities')
      .select(`
        *,
        service:services(*),
        concept:service_concepts(*)
      `)
      .eq('id', input.opportunityId)
      .single();
    
    return opportunity ? { type: 'opportunity', data: opportunity } : null;
  }

  if (input.conceptId) {
    const { data: concept } = await supabase
      .from('service_concepts')
      .select('*')
      .eq('id', input.conceptId)
      .single();
    
    return concept ? { type: 'concept', data: concept } : null;
  }

  return null;
}

async function generateServiceProposal(
  sourceData: { type: string; data: any },
  skills: Skill[],
  existingServices: any[]
): Promise<{
  service: ServiceProposal;
  skills: SkillMapping[];
  triggers: TriggerDefinition[];
  reasoning: string;
}> {
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) throw new Error('OPENROUTER_API_KEY not configured');

  const systemPrompt = buildSystemPrompt(skills, existingServices);
  const userPrompt = buildUserPrompt(sourceData);

  console.log('[CreateService] Calling LLM...');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
    },
    body: JSON.stringify({
      model: MODEL_CONFIG.model,
      max_tokens: MODEL_CONFIG.maxTokens,
      temperature: MODEL_CONFIG.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const content = result.choices[0]?.message?.content;

  if (!content) throw new Error('No content from LLM');

  // Parse the JSON response
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : content;

  try {
    const parsed = JSON.parse(jsonStr);
    console.log('[CreateService] LLM response parsed successfully');
    return parsed;
  } catch (e) {
    console.error('[CreateService] Failed to parse LLM response:', content.substring(0, 500));
    throw new Error('Failed to parse LLM response as JSON');
  }
}

function buildSystemPrompt(skills: Skill[], existingServices: any[]): string {
  // Group skills by category for easier reference
  const skillsByCategory: Record<string, Skill[]> = {};
  skills.forEach(s => {
    if (!skillsByCategory[s.category]) skillsByCategory[s.category] = [];
    skillsByCategory[s.category].push(s);
  });

  const skillList = Object.entries(skillsByCategory)
    .map(([cat, skills]) => `
## ${cat}
${skills.map(s => `- ${s.name} (ID: ${s.id})`).join('\n')}`)
    .join('\n');

  const existingServicesList = existingServices
    .map(s => `- ${s.code}: ${s.name} (${s.category})`)
    .join('\n');

  return `You are a Service Design AI for a professional services firm.

Your task is to design a new service line based on an identified client opportunity.

## YOUR SKILLS DATABASE (111 skills total)
${skillList}

## EXISTING SERVICES (for reference, avoid duplication)
${existingServicesList}

## OUTPUT FORMAT
You MUST return valid JSON with this exact structure:

\`\`\`json
{
  "service": {
    "name": "Service Name",
    "code": "SERVICE_CODE_UPPERCASE",
    "headline": "One compelling sentence",
    "description": "2-3 sentences describing the service",
    "short_description": "Under 100 chars",
    "category": "advisory|operational|strategic|technical",
    "deliverables": ["Deliverable 1", "Deliverable 2", ...],
    "typical_duration": "e.g., 4-6 weeks",
    "time_to_first_value": "e.g., 2 weeks",
    "delivery_complexity": "low|medium|high",
    "pricing_suggestion": {
      "model": "fixed|monthly|hourly|value_based",
      "price_from": 2000,
      "price_to": 5000,
      "unit": "/project or /month or /hour",
      "rationale": "Why this pricing makes sense"
    },
    "best_for": "Ideal client profile",
    "typical_roi": "Expected return description"
  },
  "skills": [
    {
      "skill_id": "actual-uuid-from-list",
      "skill_name": "Skill Name",
      "importance": "critical|required|beneficial|nice_to_have",
      "minimum_level": 3,
      "ideal_level": 4,
      "recommended_seniority": ["Manager", "Senior"],
      "rationale": "Why this skill is needed"
    }
  ],
  "triggers": [
    {
      "trigger_code": "TRIGGER_CODE",
      "trigger_name": "Human readable name",
      "description": "When and why this fires",
      "trigger_type": "metric_threshold|hva_response|financial_ratio|combination|text_pattern",
      "trigger_config": {
        "metric": "client_concentration_top3",
        "operator": ">",
        "value": 60
      },
      "weight": 0.8,
      "severity_when_triggered": "critical|high|medium|low",
      "talking_point": "What to say to the client when this triggers"
    }
  ],
  "reasoning": "2-3 paragraphs explaining your design decisions"
}
\`\`\`

## TRIGGER CONFIG EXAMPLES

metric_threshold:
{"metric": "gross_margin", "operator": "<", "value": 20}

hva_response:
{"field": "succession_your_role", "values": ["Need to hire", "No one identified"]}

financial_ratio:
{"ratio": "current_ratio", "operator": "<", "value": 1.5}

combination:
{"all": [
  {"metric": "client_concentration_top3", "operator": ">", "value": 50},
  {"metric": "revenue", "operator": ">", "value": 1000000}
]}

text_pattern:
{"field": "business_description", "contains_any": ["legacy", "manual process", "spreadsheet"]}

## GUIDELINES

1. **Service Design**: Create something genuinely valuable, not just a relabeled existing service
2. **Skill Mapping**: Be selective - only include skills truly needed (5-12 skills typically)
3. **Triggers**: Create 3-6 specific, measurable triggers that would identify similar opportunities
4. **Pricing**: Base suggestions on the opportunity's financial impact (typically 10-20% of value unlocked)
5. **Use actual skill IDs from the list provided - don't make them up`;
}

function buildUserPrompt(sourceData: { type: string; data: any }): string {
  if (sourceData.type === 'opportunity') {
    const opp = sourceData.data;
    return `## OPPORTUNITY TO CONVERT TO SERVICE

**Title:** ${opp.title}
**Category:** ${opp.category}
**Severity:** ${opp.severity}
**Financial Impact:** £${(opp.financial_impact_amount || 0).toLocaleString()}

**Evidence/Data:**
${opp.data_evidence || 'Not specified'}

**Talking Point:**
${opp.talking_point || 'Not specified'}

**Question to Ask:**
${opp.question_to_ask || 'Not specified'}

**Quick Win:**
${opp.quick_win || 'Not specified'}

**Life Impact:**
${opp.life_impact || 'Not specified'}

**Current Service Recommendation:** ${opp.service?.name || 'None - this needs a NEW service'}
**Suggested Concept:** ${opp.concept?.suggested_name || 'None'}

Please design a service that specifically addresses this opportunity pattern.
The service should be reusable for any client with similar characteristics.`;
  }

  if (sourceData.type === 'concept') {
    const concept = sourceData.data;
    return `## SERVICE CONCEPT TO FORMALIZE

**Suggested Name:** ${concept.suggested_name}
**Problem it Solves:** ${concept.problem_it_solves || 'Not specified'}
**Times Identified:** ${concept.times_identified}
**Total Opportunity Value:** £${(concept.total_opportunity_value || 0).toLocaleString()}
**Suggested Pricing:** ${concept.suggested_pricing || 'Not specified'}

This concept has been identified ${concept.times_identified} times across different clients.
Please design a formal service that addresses this recurring need.`;
  }

  return 'No source data provided';
}

