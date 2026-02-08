# Discovery Three-Phase Implementation Guide

**Purpose**: Reference for the Discovery report pipeline (1. Analyse → 2. Score → 3. Report) and required fixes so Phase 1 timeouts and status drift don’t block users.

---

## Pipeline overview

| Phase | UI label   | Edge Functions / steps | Writes to |
|-------|------------|--------------------------|-----------|
| 1     | 1. Analyse | `prepare-discovery-data` → `advisory-deep-dive` → `generate-discovery-analysis` | Client-side updates engagement to `analysis_complete` (if response received) |
| 2     | 2. Score   | `generate-discovery-report-pass1` → `generate-discovery-opportunities` | `discovery_reports` (Pass 1), `discovery_opportunities`; engagement → `opportunities_complete` |
| 3     | 3. Report  | `generate-discovery-report-pass2` | `discovery_reports` (narrative); engagement → `pass2_complete` |

Phase 1 can run 2–3+ minutes (Opus in `generate-discovery-analysis`). The browser may close the connection before the response, so the client shows “Failed to send a request to the Edge Function” even when the function completes on the server. Engagement status may stay `analysis_processing` and the UI can get out of sync with the DB.

---

## Fix A: `generate-discovery-analysis` timeout / blocking

**Problem**: The Phase 1 step `generate-discovery-analysis` is the long “deep analysis” Opus call. It is currently a blocking step; if the client times out, Phase 1 appears failed even when the server finished.

**Options (add to implementation backlog)**:

1. **Same timeout treatment as opportunities**  
   Give the invoke a long client-side timeout (e.g. 10 minutes) and treat connection-closed as “may still be running; refresh and check.” (Already done for the Phase 1 chain in `ClientServicesPage`.)

2. **Switch to Sonnet**  
   Use a faster model for `generate-discovery-analysis` so the call returns before typical client timeouts, at the cost of some quality.

3. **Make it non-blocking**  
   - Trigger `generate-discovery-analysis` (e.g. from Phase 1 or a separate “Start analysis” action) and return immediately.  
   - Do not block “Phase 1 complete” or “Phase 2 (Score) enabled” on this call.  
   - Let Pass 1 mechanical calcs in `generate-discovery-report-pass1` run using whatever data exists (e.g. `client_financial_context`, `destination_discovery`, uploaded docs).  
   - If “deep analysis” is required for narrative quality, have Pass 2 (or a later step) wait for or merge in that result when it becomes available, or make Phase 2 clearly “needs analysis complete” and drive that via status/polling.

**Decision**: Document that Pass 1 mechanical calcs can run without `generate-discovery-analysis` if we make that step async; then either make Phase 1 non-blocking and enable Phase 2 when `analysis_processing` or when Pass 1 has run, or keep blocking but use Sonnet/long timeout to reduce failures.

---

## Fix B: Pass 2 must check for Pass 1 data before generating

**Problem**: If a user opens Phase 3 (3. Report) before Phase 2 (2. Score) has run, or if status is wrong, Pass 2 can run without Pass 1 data and produce bad or empty output.

**Implementation** (in `generate-discovery-report-pass2/index.ts`):

Add a guard at the top, immediately after creating the Supabase client and validating `engagementId`, and before updating status or doing heavy work:

```typescript
// GUARD: Refuse to generate if Pass 1 hasn't run
const { data: existingReport, error: reportGuardError } = await supabase
  .from('discovery_reports')
  .select('id, comprehensive_analysis, pass1_completed_at')
  .eq('engagement_id', engagementId)
  .maybeSingle();

if (reportGuardError) {
  console.error('[Pass2] Guard: failed to load report:', reportGuardError.message);
  throw new Error('Could not verify Pass 1 status');
}
if (!existingReport?.comprehensive_analysis && !existingReport?.pass1_completed_at) {
  console.warn('[Pass2] Guard: Pass 1 not complete for engagement:', engagementId);
  return new Response(
    JSON.stringify({ error: 'Pass 1 has not completed. Run Phase 2 (Score) first.' }),
    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**Status**: Implemented in `generate-discovery-report-pass2/index.ts`.

---

## Fix C: Frontend must hard-gate Phase 3 on Pass 1 data

**Problem**: Phase 3 (3. Report) was enabled using only engagement status or presence of opportunities. If Phase 1 errored on the client or status wasn’t updated, users could click 3. Report without Pass 1 having run, leading to Pass 2 errors or poor output.

**Implementation** (in `ClientServicesPage.tsx`):

The Phase 3 button must require **actual Pass 1 output from the database**, not just engagement status or opportunity count:

- **Allowed when**  
  - Engagement status is `opportunities_complete` or `pass2_complete`, **or**  
  - There are specialist opportunities **and** the current `destinationReport` (from `discovery_reports` for this engagement) has `comprehensive_analysis` (i.e. Pass 1 has run and written data).

- **Disabled when**  
  - There is no engagement, or  
  - Status is not one of the above **and** either there are no opportunities or `destinationReport?.comprehensive_analysis` is missing.

So: enable Phase 3 only when `['opportunities_complete', 'pass2_complete'].includes(status)` **or** `(specialistOpportunities?.length > 0 && !!destinationReport?.comprehensive_analysis)`.

**Status**: Implemented in `ClientServicesPage.tsx` (Phase 3 button `disabled` and styling use `destinationReport?.comprehensive_analysis` for the hard gate).

---

## Related docs

- `docs/DISCOVERY_DATA_MAP.md` – Where Discovery UI data lives (tables, engagement, reports, opportunities).
- `supabase/migrations/20260208120000_discovery_three_phase_pipeline.sql` – Pipeline statuses and columns.
- `docs/DISCOVERY_OPPORTUNITY_IMPLEMENTATION.md` – Opportunity management and pin/block.
