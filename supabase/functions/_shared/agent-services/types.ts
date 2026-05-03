// =============================================================================
// AGENT SERVICE MODULE TYPES
// =============================================================================
// Each service line (Goal Alignment, Benchmarking, Systems Audit, Management
// Accounts, Discovery) contributes a module to the advisory agent that
// supplies:
//   - service_codes: the values seen on `client_service_lines.service_lines.code`
//   - label: human-readable name used in the panel
//   - systemPromptModule: a per-service instruction block appended to the agent
//     system prompt when this service is active for the current client
//   - fetchContext(supabase, clientId): returns a string section to splice
//     into the user-prompt context block. Empty string means "no relevant
//     data yet" and the section is skipped.
//   - allowedTargets: optional. Tables this service permits the agent to
//     emit `proposed_change` blocks against. v1 only GA has any.
// =============================================================================

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AllowedTarget {
  /** Postgres table name (must be in the apply-RPC allow-list as well). */
  table: string;
  /** JSONB column the change writes into. */
  jsonbColumn: string;
  /** Human-readable label used in the proposed-change card. */
  label: string;
  /** Optional descriptor of how to identify the row, e.g. "the latest stage". */
  rowDescription?: string;
}

export interface ServiceModule {
  /** Codes from service_lines.code that activate this module. */
  codes: string[];
  /** Display label, e.g. "Goal Alignment". */
  label: string;
  /** Per-service instruction block. Appended to the agent system prompt. */
  systemPromptModule: string;
  /** Returns a context section (already-tokenised by the browser; this fetcher
   *  must NOT detokenise — it just returns whatever DB shape it grabs). */
  fetchContext: (supabase: SupabaseClient, clientId: string) => Promise<string>;
  /** Tables this service permits direct agent writes against. */
  allowedTargets: AllowedTarget[];
}
