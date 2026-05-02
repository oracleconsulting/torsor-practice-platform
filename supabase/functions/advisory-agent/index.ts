// =============================================================================
// EDGE FUNCTION: advisory-agent
// =============================================================================
// In-platform AI advisor for Goal Alignment clients. Receives a tokenised
// message and tokenised client context from the browser, calls Claude via
// OpenRouter, and returns the (still-tokenised) response plus any
// proposed-change blocks for the advisor to approve.
//
// PII safety: this function never sees raw client names, company names, or
// financial figures. The browser tokeniser swaps them before the request
// and reverses the swap on the response.
// =============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GA_SYSTEM_PROMPT } from '../_shared/ga-system-prompt.ts';
import { validateGAContent } from '../_shared/ga-content-validator.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvisoryAgentRequest {
  threadId: string;
  message: string;
  context: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Optional model override; defaults to claude-sonnet-4.5 via OpenRouter. */
  model?: string;
}

interface ProposedChange {
  stage_type: string;
  json_path: string;
  new_value: string;
  reason: string;
}

const AGENT_INSTRUCTIONS = `

You are an advisory agent inside the Torsor practice management platform. You are
helping a senior advisor at a UK accounting firm review and refine the content of
a specific client's Goal Alignment programme.

You have access to the client's full context (provided below). The client's name,
company name, and financial figures have been tokenised for GDPR compliance —
e.g. CLIENT_A, COMPANY_1, REVENUE_VALUE. Reason about patterns and relationships
using the tokens. Do NOT ask for the real values; the advisor sees them
de-tokenised on their screen.

When the advisor asks you to make changes to the roadmap content, respond with
one or more PROPOSED_CHANGE blocks. Each block must be a single JSON object on
its own, fenced with the language tag \`proposed_change\`:

\`\`\`proposed_change
{
  "stage_type": "fit_assessment",
  "json_path": "{openingReflection}",
  "new_value": "The new text goes here.",
  "reason": "Tightened the opening to remove em dashes and 'transformation journey' phrasing."
}
\`\`\`

Field rules:
  - "stage_type" must be one of: fit_assessment | five_year_vision |
    six_month_shift | sprint_plan | sprint_plan_part1 | sprint_plan_part2 |
    value_analysis | advisory_brief | insight_report | director_alignment
  - "json_path" uses Postgres array notation, e.g. {weeks,0,tasks,1,description}
  - "new_value" is the full replacement string (not a diff)
  - "reason" is one short sentence explaining WHY the change is being suggested

Multiple changes? Emit multiple blocks, each in its own fence.

Do NOT assume changes are applied until the advisor confirms. The advisor will
review each block in the panel UI and click Apply or Reject. If you say "I have
updated the opening", the advisor will lose trust in you. Use language like
"Here's a suggested rewrite — let me know if you want to apply it" instead.

CLIENT CONTEXT (tokenised):
`;

async function callOpenRouter(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
  model: string,
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
      max_tokens: 4000,
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
      console.warn('[advisory-agent] failed to parse proposed_change block:', err);
    }
  }
  return out;
}

function approxCostCents(tokensUsed: number): number {
  // Claude Sonnet 4.5 via OpenRouter ~$3 per 1M input + $15 per 1M output.
  // Without splitting input/output, assume an average of ~$5 per 1M tokens.
  return Math.max(1, Math.ceil((tokensUsed / 1_000_000) * 500));
}

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

  const model = body.model ?? 'anthropic/claude-sonnet-4.5';
  const systemPrompt = `${GA_SYSTEM_PROMPT}\n${AGENT_INSTRUCTIONS}\n${body.context ?? ''}`;

  // Cap conversation history to last 20 turns to keep the prompt size sane.
  const trimmedHistory = (body.conversationHistory ?? []).slice(-20).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content ?? ''),
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    { role: 'user', content: body.message },
  ];

  try {
    const { content, tokensUsed } = await callOpenRouter(openRouterKey, messages, model);

    // Tone-check the response just like the generators do, then auto-fix em dashes.
    let cleanedContent = content;
    const validation = validateGAContent(content);
    if (!validation.passed) {
      console.warn('[advisory-agent] content violations:', validation.violations);
      cleanedContent = validation.autoFixed;
    }

    const proposedChanges = extractProposedChanges(cleanedContent);
    const costCents = approxCostCents(tokensUsed);

    return new Response(
      JSON.stringify({
        ok: true,
        message: cleanedContent,
        tokensUsed,
        costCents,
        proposedChanges,
        model,
        violations: validation.passed ? [] : validation.violations,
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
