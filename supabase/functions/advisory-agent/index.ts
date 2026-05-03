// =============================================================================
// EDGE FUNCTION: advisory-agent
// =============================================================================
// In-platform AI advisor — Torsor-wide. Handles:
//   - Model routing (Quick=Sonnet 4.5, Deep=Opus 4.7).
//   - Per-message embedding generation (text-embedding-3-small via OpenRouter).
//   - Same-client + (opt-in) cross-client vector retrieval before each LLM
//     call so the conversation grows over time.
//   - Service-aware system prompt + context: GA, Benchmarking, Systems Audit,
//     Management Accounts, Discovery. Each service contributes a prompt
//     module + context fetcher; the agent only sees modules for services
//     the client is actually enrolled in.
//   - Tone-validated responses (validateGAContent post-pass).
//   - Three structured response artefacts:
//       1. `proposed_change`     -> applied via apply_roadmap_change RPC
//          (currently GA-only; other services suggest in plain text).
//       2. `next_steps`          -> clickable cards in the panel; the
//          choice (plus alternatives offered) is persisted in metadata.
//       3. `system_observation`  -> upserted via record_system_observation
//          for the practice owner to review on /practice/agent-observations.
//
// PII: receives only tokenised content. Does not de-tokenise.
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GA_SYSTEM_PROMPT } from '../_shared/ga-system-prompt.ts';
import { validateGAContent } from '../_shared/ga-content-validator.ts';
import {
  EMBEDDING_DIMS,
  EMBEDDING_MODEL,
  approxCostCents,
  modelForMode,
  type AgentMode,
} from '../_shared/agent-models.ts';
import {
  modulesForCodes,
  systemPromptForModules,
} from '../_shared/agent-services/registry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdvisoryAgentRequest {
  threadId: string;
  message: string;
  context: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  mode?: AgentMode;
  modelOverride?: string;
  practiceId?: string;
  clientId?: string;
}

interface ProposedChange {
  stage_type: string;
  json_path: string;
  new_value: string;
  reason: string;
}

interface NextStepOption {
  id: string;
  title: string;
  description?: string;
  action_hint?: 'apply' | 'rewrite' | 'draft' | 'research' | 'compare' | 'discuss';
}

interface NextSteps {
  context?: string;
  options: NextStepOption[];
}

interface SystemObservation {
  observation_type:
    | 'gap'
    | 'pattern'
    | 'tone_drift'
    | 'data_quality'
    | 'prompt_idea'
    | 'feature_idea';
  service_line?: string;
  title: string;
  body: string;
  evidence?: Record<string, unknown>;
}

interface RetrievedMessage {
  id: string;
  content: string;
  anon_summary: string;
  is_same_client: boolean;
  similarity: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Agent instructions
// ---------------------------------------------------------------------------

const AGENT_INSTRUCTIONS = `

You are an advisory agent inside the Torsor practice management platform. You are
helping a senior advisor at a UK accounting firm review and refine content for
a specific client across whichever Torsor services they're engaged in. The list
of active services for this client (and what content you can directly edit) is
spelled out in the SERVICE-SPECIFIC INSTRUCTIONS section below.

You have access to the client's full context (provided below). The client's name,
company name, and financial figures have been tokenised for GDPR compliance —
e.g. CLIENT_A, COMPANY_1, REVENUE_VALUE. Reason about patterns and relationships
using the tokens. Do NOT ask for the real values; the advisor sees them
de-tokenised on their screen.

CONVERSATION FLOW (this is non-negotiable):

For every substantive response, finish with a \`next_steps\` block listing 2-4
concrete options the advisor can pick from. The advisor will click one option,
which sends back a follow-up "I'll go with: <title>" message. Only THEN should
you emit \`proposed_change\` blocks (if needed). This way every change is
explicitly chosen by the advisor.

If the user is just chatting / asking a clarifying question without needing
action, you can omit next_steps. But err on the side of giving them options:
agency over the conversation matters.

\`\`\`next_steps
{
  "context": "Three ways forward:",
  "options": [
    {
      "id": "tighten",
      "title": "Tighten the existing narrative",
      "description": "Cut em dashes, replace 'transformation journey', keep the Tuesday Test framing.",
      "action_hint": "rewrite"
    },
    {
      "id": "rewrite_research",
      "title": "Rewrite using Pencavel + Mark research",
      "description": "Ground it in the 50h plateau and 23-min interruption findings.",
      "action_hint": "research"
    },
    {
      "id": "compare",
      "title": "Show me a side-by-side comparison first",
      "action_hint": "compare"
    }
  ]
}
\`\`\`

PROPOSED CHANGES (for client content edits):

When the advisor has chosen a path that requires editing roadmap content, emit
one or more \`proposed_change\` blocks. Each block is a single JSON object on
its own:

\`\`\`proposed_change
{
  "stage_type": "fit_assessment",
  "json_path": "{openingReflection}",
  "new_value": "The new text goes here.",
  "reason": "Tightened opening: removed em dashes and 'transformation journey' phrasing."
}
\`\`\`

  - "stage_type": fit_assessment | five_year_vision | six_month_shift |
    sprint_plan | sprint_plan_part1 | sprint_plan_part2 | value_analysis |
    advisory_brief | insight_report | director_alignment
  - "json_path": Postgres array notation, e.g. {weeks,0,tasks,1,description}
  - "new_value": full replacement string (not a diff)
  - "reason": one short sentence

Do NOT claim a change has been applied. Use language like "Here's a suggested
rewrite — tap Apply to push it" instead of "I have updated the opening".

SYSTEM OBSERVATIONS (when you spot platform-level patterns):

When you notice a recurring issue — a topic that comes up across multiple
conversations, a gap in the prompts, a tone drift that keeps slipping through,
data-quality problems in the inputs — emit a fenced \`system_observation\`
block alongside your normal response. These are NOT applied to client content;
they go into a backlog the practice owner reviews on
/practice/agent-observations.

\`\`\`system_observation
{
  "observation_type": "gap",
  "service_line": "365_method",
  "title": "Sprint plan generator under-handles family-business power dynamics",
  "body": "Three separate clients with ageing parent-as-shareholder dynamics have all needed manual rewrites of Week 3 to address succession anxiety. The generator currently treats it as a delegation issue. Suggest adding a 'family power dynamics' branch to generate-sprint-plan-part1's user prompt.",
  "evidence": {
    "client_count": 3,
    "thread_ids": ["..."],
    "message_excerpts": ["..."]
  }
}
\`\`\`

Field rules:
  - "observation_type": gap | pattern | tone_drift | data_quality | prompt_idea | feature_idea
  - "service_line": one of the service codes (365_method, benchmarking,
    systems_audit, management_accounts, discovery) or "platform" for
    cross-cutting issues
  - "title": short, declarative; will be deduplicated against existing
    observations of the same type — re-raise the same title to bump
    occurrence_count rather than create a new row
  - "body": full reasoning, cite evidence
  - "evidence": optional structured supporting data

Only emit observations when you have GENUINE evidence of a recurring pattern
(at least 2-3 supporting data points). Do not speculate. Do not emit one on
every message.

CLIENT CONTEXT (tokenised):
`;

const REFERENCES_HEADER = `

PRIOR DISCUSSIONS RELEVANT TO THIS QUESTION:
The system has retrieved the following past messages (tokenised). Use them for
continuity. Reference them naturally if they help — "we discussed this with this
client on <date>" or "this echoes a similar pattern we've seen before". Do NOT
list them as a bibliography.

`;

// ---------------------------------------------------------------------------
// External calls
// ---------------------------------------------------------------------------

async function generateEmbedding(text: string, openRouterKey: string): Promise<number[] | null> {
  if (!text || !openRouterKey) return null;
  // Cap input to ~8000 chars to stay within embedding token limits.
  const trimmed = text.length > 8000 ? text.slice(0, 8000) : text;
  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://torsor.co.uk',
        'X-Title': 'Torsor Advisory Agent',
      },
      body: JSON.stringify({
        // OpenRouter exposes OpenAI's embedding family with the openai/ prefix.
        model: `openai/${EMBEDDING_MODEL}`,
        input: trimmed,
      }),
    });
    if (!response.ok) {
      console.warn(`[advisory-agent] embedding failed: ${response.status} ${await response.text()}`);
      return null;
    }
    const data = await response.json();
    const vec = data?.data?.[0]?.embedding;
    if (Array.isArray(vec) && vec.length === EMBEDDING_DIMS) return vec;
    console.warn(`[advisory-agent] embedding response unexpected: vec length ${Array.isArray(vec) ? vec.length : 'n/a'}`);
    return null;
  } catch (err) {
    console.warn('[advisory-agent] embedding error:', err);
    return null;
  }
}

async function callLLM(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string,
  maxTokens = 4000,
): Promise<{ content: string; tokensUsed: number }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://torsor.co.uk',
      'X-Title': 'Torsor Advisory Agent',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.4,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  const tokensUsed = data?.usage?.total_tokens ?? 0;
  return { content, tokensUsed };
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function extractProposedChanges(content: string): ProposedChange[] {
  const out: ProposedChange[] = [];
  const regex = /```proposed_change\s*\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (
        typeof parsed?.stage_type === 'string' &&
        typeof parsed?.json_path === 'string' &&
        typeof parsed?.new_value === 'string'
      ) {
        out.push({
          stage_type: parsed.stage_type,
          json_path: parsed.json_path,
          new_value: parsed.new_value,
          reason: typeof parsed.reason === 'string' ? parsed.reason : '',
        });
      }
    } catch (err) {
      console.warn('[advisory-agent] proposed_change parse error:', err);
    }
  }
  return out;
}

function extractSystemObservations(content: string): SystemObservation[] {
  const out: SystemObservation[] = [];
  const regex = /```system_observation\s*\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (
        typeof parsed?.observation_type === 'string' &&
        typeof parsed?.title === 'string' &&
        typeof parsed?.body === 'string' &&
        ['gap', 'pattern', 'tone_drift', 'data_quality', 'prompt_idea', 'feature_idea'].includes(
          parsed.observation_type,
        )
      ) {
        out.push({
          observation_type: parsed.observation_type,
          service_line: typeof parsed.service_line === 'string' ? parsed.service_line : undefined,
          title: parsed.title,
          body: parsed.body,
          evidence: parsed.evidence && typeof parsed.evidence === 'object' ? parsed.evidence : {},
        });
      }
    } catch (err) {
      console.warn('[advisory-agent] system_observation parse error:', err);
    }
  }
  return out;
}

function extractNextSteps(content: string): NextSteps | null {
  const regex = /```next_steps\s*\n([\s\S]*?)\n```/g;
  const match = regex.exec(content);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1]);
    if (parsed && Array.isArray(parsed.options)) {
      const options: NextStepOption[] = parsed.options
        .filter((o: unknown) => o && typeof o === 'object')
        .map((o: any, i: number) => ({
          id: typeof o.id === 'string' && o.id.length > 0 ? o.id : `option_${i + 1}`,
          title: String(o.title ?? `Option ${i + 1}`),
          description: typeof o.description === 'string' ? o.description : undefined,
          action_hint:
            typeof o.action_hint === 'string'
              ? (o.action_hint as NextStepOption['action_hint'])
              : undefined,
        }));
      if (options.length === 0) return null;
      return {
        context: typeof parsed.context === 'string' ? parsed.context : undefined,
        options,
      };
    }
  } catch (err) {
    console.warn('[advisory-agent] next_steps parse error:', err);
  }
  return null;
}

function formatRetrievedMessages(messages: RetrievedMessage[]): string {
  if (messages.length === 0) return '';
  const lines: string[] = [];
  for (const m of messages) {
    const date = new Date(m.created_at).toISOString().slice(0, 10);
    const tag = m.is_same_client ? 'this client' : 'another client (anonymised)';
    const snippet = (m.anon_summary || m.content || '').slice(0, 800);
    lines.push(`[${date} - ${tag} - similarity ${m.similarity.toFixed(2)}]\n${snippet}`);
  }
  return REFERENCES_HEADER + lines.join('\n\n---\n\n');
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: AdvisoryAgentRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body?.message || typeof body.message !== 'string') {
    return new Response(JSON.stringify({ error: 'message is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterKey) {
    return new Response(
      JSON.stringify({ error: 'OPENROUTER_API_KEY not configured on edge function' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  // Use the caller's auth header so RLS applies to the vector match.
  const authHeader = req.headers.get('authorization') ?? '';
  const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey || supabaseServiceKey,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    },
  );

  const model = modelForMode(body.mode, body.modelOverride);

  // -----------------------------------------------------------------------
  // 1. Resolve which service modules apply to this client
  // -----------------------------------------------------------------------

  let activeServiceCodes: string[] = [];
  let activeServiceLabels: string[] = [];
  let serviceContextBlock = '';
  if (body.clientId) {
    try {
      const { data: serviceRows } = await supabase
        .from('client_service_lines')
        .select('service_lines(code, name), status')
        .eq('client_id', body.clientId);
      activeServiceCodes = (serviceRows ?? [])
        .map((r: any) => {
          const sl = Array.isArray(r.service_lines) ? r.service_lines[0] : r.service_lines;
          return sl?.code ?? null;
        })
        .filter(Boolean);

      const modules = modulesForCodes(activeServiceCodes);
      activeServiceLabels = modules.map((m) => m.label);

      // Fetch per-service context in parallel.
      const sections = await Promise.all(
        modules.map(async (m) => {
          try {
            return await m.fetchContext(supabase, body.clientId!);
          } catch (err) {
            console.warn(`[advisory-agent] ${m.label} context fetch error:`, err);
            return '';
          }
        }),
      );
      serviceContextBlock = sections.filter(Boolean).join('\n\n');
    } catch (err) {
      console.warn('[advisory-agent] service detection error:', err);
    }
  }

  const servicePrompts = systemPromptForModules(modulesForCodes(activeServiceCodes));

  // -----------------------------------------------------------------------
  // 2. Generate embedding for the user's message (for retrieval + storage)
  // -----------------------------------------------------------------------

  const userEmbedding = await generateEmbedding(body.message, openRouterKey);

  // -----------------------------------------------------------------------
  // 2. Retrieve relevant prior messages (same-client + cross-client)
  // -----------------------------------------------------------------------

  let retrieved: RetrievedMessage[] = [];
  if (userEmbedding && body.practiceId && body.clientId) {
    try {
      const { data, error } = await supabase.rpc('match_chat_messages_for_practice', {
        p_query_embedding: userEmbedding,
        p_practice_id: body.practiceId,
        p_current_client_id: body.clientId,
        p_match_count: 5,
      });
      if (error) {
        console.warn('[advisory-agent] match function error:', error);
      } else if (Array.isArray(data)) {
        retrieved = data
          .filter((r: any) => r.id && r.similarity >= 0.7)
          .map((r: any) => ({
            id: r.id,
            content: r.content ?? '',
            anon_summary: r.anon_summary ?? r.content ?? '',
            is_same_client: Boolean(r.is_same_client),
            similarity: Number(r.similarity ?? 0),
            created_at: r.created_at,
          }));
      }
    } catch (err) {
      console.warn('[advisory-agent] retrieval error:', err);
    }
  }

  // -----------------------------------------------------------------------
  // 4. Build the prompt
  // -----------------------------------------------------------------------

  const activeServicesHeader =
    activeServiceLabels.length > 0
      ? `\n\nACTIVE SERVICES FOR THIS CLIENT: ${activeServiceLabels.join(', ')}\n`
      : '\n\nACTIVE SERVICES FOR THIS CLIENT: (none / not enrolled in any tracked service)\n';

  const systemPrompt =
    GA_SYSTEM_PROMPT +
    AGENT_INSTRUCTIONS +
    activeServicesHeader +
    '\nSERVICE-SPECIFIC INSTRUCTIONS:\n' +
    (servicePrompts || '(no service modules active)') +
    '\n\n' +
    (body.context ?? '') +
    (serviceContextBlock ? '\n\n' + serviceContextBlock : '') +
    formatRetrievedMessages(retrieved);

  const trimmedHistory = (body.conversationHistory ?? []).slice(-20).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? ''),
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    { role: 'user', content: body.message },
  ];

  // -----------------------------------------------------------------------
  // 4. Call the LLM
  // -----------------------------------------------------------------------

  try {
    const { content: rawContent, tokensUsed } = await callLLM(openRouterKey, messages, model);

    let cleanedContent = rawContent;
    const validation = validateGAContent(rawContent);
    if (!validation.passed) {
      console.warn('[advisory-agent] content violations:', validation.violations);
      cleanedContent = validation.autoFixed;
    }

    const proposedChanges = extractProposedChanges(cleanedContent);
    const nextSteps = extractNextSteps(cleanedContent);
    const observations = extractSystemObservations(cleanedContent);
    const costCents = approxCostCents(model, tokensUsed);

    // 5. Persist any system observations the agent emitted. These are
    //    upserted (de-duped by practice/type/title) and bump occurrence_count
    //    when re-raised. Failures are logged but do not break the response.
    let observationsRecorded = 0;
    if (observations.length > 0 && body.practiceId) {
      for (const obs of observations) {
        try {
          const { error: obsErr } = await supabase.rpc('record_system_observation', {
            p_practice_id: body.practiceId,
            p_observation_type: obs.observation_type,
            p_title: obs.title,
            p_body: obs.body,
            p_service_line: obs.service_line ?? null,
            p_evidence: obs.evidence ?? {},
            p_source_thread_id: body.threadId ?? null,
            p_source_message_id: null, // panel hasn't yet inserted the message
          });
          if (obsErr) {
            console.warn('[advisory-agent] record_system_observation error:', obsErr);
          } else {
            observationsRecorded++;
          }
        } catch (err) {
          console.warn('[advisory-agent] observation persist error:', err);
        }
      }
    }

    // 6. Embed the assistant response too (for future retrieval).
    const assistantEmbedding = await generateEmbedding(cleanedContent, openRouterKey);

    return new Response(
      JSON.stringify({
        ok: true,
        message: cleanedContent,
        tokensUsed,
        costCents,
        proposedChanges,
        nextSteps,
        observations,
        observationsRecorded,
        model,
        mode: body.mode ?? 'quick',
        violations: validation.passed ? [] : validation.violations,
        // Embeddings — the panel persists these on the message rows.
        userMessageEmbedding: userEmbedding,
        assistantMessageEmbedding: assistantEmbedding,
        // Diagnostics: how many references the agent had access to.
        retrievedCount: retrieved.length,
        retrievedSameClientCount: retrieved.filter((r) => r.is_same_client).length,
        // Active service modules.
        activeServiceCodes,
        activeServiceLabels,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[advisory-agent] error:', err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
