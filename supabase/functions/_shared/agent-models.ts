// =============================================================================
// AGENT MODEL ROUTING
// =============================================================================
// Centralises the model slugs used by the advisory agent. Quick mode is for
// fast-turn conversations and copy edits; Deep mode is for research-heavy
// strategic discussions where the extra latency and cost is worth it.
//
// Slugs come from OpenRouter's Anthropic catalogue. The "latest" aliases
// auto-track the newest version; the pinned slugs are used by default for
// reproducibility. To bump, update PINNED_* below.
//
//   Sonnet 4.5: $3/M input, $15/M output, 1M context.
//   Opus 4.7:   $5/M input, $25/M output, 1M context.
//
// Embeddings: OpenAI text-embedding-3-small (1536 dim, ~$0.02 per 1M tokens).
// =============================================================================

export type AgentMode = 'quick' | 'deep';

export const PINNED_SONNET = 'anthropic/claude-sonnet-4.5';
export const PINNED_OPUS = 'anthropic/claude-opus-4.7';

export const SONNET_LATEST = 'anthropic/claude-sonnet-latest';
export const OPUS_LATEST = 'anthropic/claude-opus-latest';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMS = 1536;

/** Maps a mode to the model slug we use. Default is `quick` -> Sonnet. */
export function modelForMode(mode: AgentMode | undefined, override?: string): string {
  if (override) return override;
  return mode === 'deep' ? PINNED_OPUS : PINNED_SONNET;
}

/** Cost estimate in cents per token used. Approximate input/output split:
 *  60% input, 40% output (typical chat profile). */
export function approxCostCents(model: string, tokensUsed: number): number {
  if (tokensUsed <= 0) return 0;
  const inputTokens = tokensUsed * 0.6;
  const outputTokens = tokensUsed * 0.4;

  // Per-million-token rates in USD.
  let inputRate = 3;
  let outputRate = 15;
  if (model.includes('opus')) {
    inputRate = 5;
    outputRate = 25;
  }
  const usd = (inputTokens / 1_000_000) * inputRate + (outputTokens / 1_000_000) * outputRate;
  // 1 USD ~ 100 cents; round up so we never under-record.
  return Math.max(1, Math.ceil(usd * 100));
}

/** Heuristic: should the panel suggest deep mode based on the user's text?
 *  Returns true when the message looks like a research / strategy question. */
export function shouldSuggestDeepMode(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const triggers = [
    'why',
    'compare',
    'compar',
    'research',
    'analyse',
    'analyze',
    'deep dive',
    'deep dive into',
    'strategy',
    'strategic',
    'what are the trade-offs',
    'trade off',
    'trade-off',
    'evidence',
    'literature',
    'best practice',
    'walk me through',
    'reason about',
    'think through',
  ];
  return triggers.some((trigger) => t.includes(trigger));
}
