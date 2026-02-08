# Discovery Assessment System — Live Summary (Flat Reference)

**Last synced:** 2026-02-07  
**Purpose:** Single flat reference for the currently deployed Discovery Assessment system. All code/SQL in this folder are **COPIES**; edit only the live paths in the repo.

---

## COPY NOTICE

**Every `.ts`, `.tsx`, `.sql` file in this folder is a COPY.** Do not edit these files. Edit the source paths in `torsor-practice-platform/` instead. See `COPY_NOTICE.txt` and each file’s header for the live source path.

---

## System Overview

- **Flow:** Client → 40 destination questions → (optional) type-specific follow-up → document upload → **Pass 1** (deterministic calc) → **Pass 2** (LLM narrative) → **Pass 3** (opportunities + pin/block) → Report + PDF + client portal.
- **Principles:** Calculate once (Pass 1), narrate forever (Pass 2). Pass 3 respects advisor **pinned_services** (must include) and **blocked_services** (must exclude) on `discovery_engagements`.
- **Key tables:** `discovery_engagements`, `destination_discovery`, `discovery_reports`, `discovery_opportunities`, `service_concepts`, `client_context` / `client_context_notes`, `services`.

---

## Live Paths → Flat COPY Names (No Subfolders)

### Edge functions (source: `supabase/functions/`)

| Live path | Flat COPY file in this folder |
|-----------|-------------------------------|
| `generate-discovery-opportunities/index.ts` | `generate-discovery-opportunities-copy.ts` |
| `generate-discovery-report-pass1/index.ts` | `generate-discovery-report-pass1-copy.ts` |
| `generate-discovery-report-pass2/index.ts` | `generate-discovery-report-pass2-copy.ts` |
| `generate-discovery-report/index.ts` | `generate-discovery-report-index-copy.ts` (or legacy) |
| `generate-discovery-analysis/index.ts` | `generate-discovery-analysis-copy.ts` |
| `generate-discovery-pdf/index.ts` | `generate-discovery-pdf-copy.ts` |
| `generate-discovery-responses-pdf/index.ts` | `generate-discovery-responses-pdf-copy.ts` |
| `prepare-discovery-data/index.ts` | `prepare-discovery-data-copy.ts` |
| `start-discovery-report/index.ts` | `start-discovery-report-copy.ts` |
| `generate-discovery-report-legacy` (if exists) | `generate-discovery-report-legacy-copy.ts` |
| `generate-service-recommendations/index.ts` | `generate-service-recommendations-copy.ts` |
| `process-client-context/index.ts` | `process-client-context-copy.ts` |
| `process-documents/index.ts` | `process-documents-copy.ts` |
| `parse-document/index.ts` | `parse-document-copy.ts` |
| `accept-invitation/index.ts` | `accept-invitation-copy.ts` |
| `send-client-invitation/index.ts` | `send-client-invitation-copy.ts` |
| `client-signup/index.ts` | `client-signup-copy.ts` |
| `detect-assessment-patterns/index.ts` | `detect-assessment-patterns-copy.ts` |
| `generate-value-proposition/index.ts` | `generate-value-proposition-copy.ts` |
| `advisory-deep-dive/index.ts` | `advisory-deep-dive-copy.ts` |
| `upload-client-accounts/index.ts` | `upload-client-accounts-copy.ts` |
| `process-accounts-upload/index.ts` | `process-accounts-upload-copy.ts` |
| `_shared/llm-cache.ts` | `shared-llm-cache-copy.ts` |
| `_shared/llm-cost-tracker.ts` | `shared-llm-cost-tracker-copy.ts` |
| `_shared/writing-style.ts` | `shared-writing-style-copy.ts` |
| `_shared/service-scorer.ts` | `shared-service-scorer-copy.ts` |
| `_shared/service-scorer-v2.ts` | `shared-service-scorer-v2-copy.ts` |

Pass1 subfolder files (flattened):

| Live path | Flat COPY file |
|-----------|----------------|
| `generate-discovery-report-pass1/calculators/index.ts` | `calculators-index-copy.ts` |
| `generate-discovery-report-pass1/calculators/orchestrator.ts` | `calculators-orchestrator-copy.ts` |
| `generate-discovery-report-pass1/calculators/*.ts` (each) | `calculators-*-copy.ts` |
| `generate-discovery-report-pass1/benchmarks/index.ts` | `benchmarks-index-copy.ts` |
| `generate-discovery-report-pass1/benchmarks/industry-benchmarks.ts` | `benchmarks-industry-copy.ts` |
| `generate-discovery-report-pass1/types/index.ts` | `pass1-types-index-copy.ts` |
| `generate-discovery-report-pass1/types/pass1-output.ts` | `pass1-types-output-copy.ts` |

### Migrations (source: `supabase/migrations/`)

| Live path | Flat COPY file |
|-----------|----------------|
| `20251223_fix_destination_discovery_duplicates.sql` | `migrations-20251223_fix_destination_discovery_duplicates.sql` |
| `20260115_discovery_assessment_v2.sql` | `migrations-20260115_discovery_assessment_v2.sql` |
| `20260115_discovery_report_system.sql` | `migrations-20260115_discovery_report_system.sql` |
| `20260115_discovery_destination_focused.sql` | `migrations-20260115_discovery_destination_focused.sql` |
| `20260115_migrate_legacy_discovery.sql` | `migrations-20260115_migrate_legacy_discovery.sql` |
| `20260115_discovery_data_completeness.sql` | `migrations-20260115_discovery_data_completeness.sql` |
| `20260115_fix_discovery_trigger.sql` | `migrations-20260115_fix_discovery_trigger.sql` |
| `20260123_discovery_learning_system.sql` | `migrations-20260123_discovery_learning_system.sql` |
| `20260125_discovery_7dimension_analysis.sql` | `migrations-20260125_discovery_7dimension_analysis.sql` |
| `20260129_fix_discovery_reports_client_rls.sql` | `migrations-20260129_fix_discovery_reports_client_rls.sql` |
| `20260203_add_show_in_client_view_to_opportunities.sql` | `migrations-20260203_add_show_in_client_view_to_opportunities.sql` |
| `20260204_expand_context_note_types.sql` | `migrations-20260204_expand_context_note_types.sql` |
| `20260205_add_discovery_admin_context.sql` | `migrations-20260205_add_discovery_admin_context.sql` |
| `20260206_add_followup_responses.sql` | `migrations-20260206_add_followup_responses.sql` |
| `20260207103430_discovery_opportunity_enhancements.sql` | `migrations-20260207103430_discovery_opportunity_enhancements.sql` |
| `20260208120000_discovery_three_phase_pipeline.sql` | `migrations-20260208120000_discovery_three_phase_pipeline.sql` |
| `20260209120000_reset_discovery_pipeline_for_client.sql` | `migrations-20260209120000_reset_discovery_pipeline_for_client.sql` |
| `20260209140000_discovery_data_audit.sql` | `migrations-20260209140000_discovery_data_audit.sql` |

### Frontend – Admin (source: `src/` or `src/components/discovery/`)

| Live path | Flat COPY file |
|-----------|----------------|
| `src/components/discovery/DiscoveryAdminModal.tsx` | `frontend-admin-DiscoveryAdminModal.tsx` |
| `src/components/discovery/DiscoveryOpportunityPanel.tsx` | `frontend-admin-DiscoveryOpportunityPanel.tsx` |
| `src/components/discovery/ServicePinBlockControl.tsx` | `frontend-admin-ServicePinBlockControl.tsx` |
| `src/components/discovery/AnalysisCommentSystem.tsx` | `frontend-admin-AnalysisCommentSystem.tsx` |
| `src/components/discovery/TransformationJourney.tsx` | `frontend-admin-TransformationJourney.tsx` |
| `src/components/discovery/index.ts` | `frontend-admin-discovery-index.ts` |

Admin discovery deep-dive UI (Create Service modal, pin/block, opportunities) lives inside **`src/pages/admin/ClientServicesPage.tsx`** (not a separate component); reference that file for the full admin discovery flow.

### Frontend – Client portal (source: `apps/client-portal/src/`)

| Live path | Flat COPY file |
|-----------|----------------|
| `apps/client-portal/src/pages/discovery/DestinationDiscoveryPage.tsx` | `frontend-client-DestinationDiscoveryPage.tsx` |
| `apps/client-portal/src/pages/discovery/DiscoveryFollowUpPage.tsx` | `frontend-client-DiscoveryFollowUpPage.tsx` |
| `apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx` | `frontend-client-DiscoveryReportPage.tsx` |
| `apps/client-portal/src/components/DiscoveryReportView.tsx` | `frontend-client-DiscoveryReportView.tsx` |
| `apps/client-portal/src/components/discovery/DiscoveryMetricCard.tsx` | `frontend-client-DiscoveryMetricCard.tsx` |
| `apps/client-portal/src/components/discovery/DiscoveryInsightCard.tsx` | `frontend-client-DiscoveryInsightCard.tsx` |
| `apps/client-portal/src/components/discovery/index.ts` | `frontend-client-discovery-index.ts` |
| DiscoveryCompletePage, DiscoveryDashboardPage, DiscoveryPortalPage, TransformationJourney | `frontend-client-*.tsx` (same naming) |

### Config / docs

| Live path | Flat COPY file |
|-----------|----------------|
| `src/config/assessments/benchmarking-discovery.ts` or discovery config | `config-benchmarking-discovery.ts` |
| `docs/DISCOVERY_*.md` | `docs-DISCOVERY_*.md` |

---

## Pass 3 (Opportunities) – Pin/Block

- **`discovery_engagements`:** `pinned_services TEXT[]`, `blocked_services TEXT[]` (migration `20260207103430`).
- **`generate-discovery-opportunities`:** Reads pin/block from engagement in `gatherAllClientData()`, adds “ADVISOR SERVICE PREFERENCES” to the LLM prompt, and in `postProcessOpportunities()` removes blocked from `serviceMapping.existingService` (remap to concept) and injects opportunities for each pinned service not already present.

---

## Continuation prompt (for new chat)

Paste this when moving Discovery work to a new chat:

```
The folder `torsor-practice-platform/discovery assessment analysis` is a FLAT reference copy of the live Discovery Assessment system. Every file there is marked COPY — do not edit those files; edit the corresponding live paths in `torsor-practice-platform/` instead.

Read `discovery assessment analysis/DISCOVERY_SYSTEM_LIVE_SUMMARY.md` for: system overview (Pass 1 / Pass 2 / Pass 3, pin/block, tables) and the mapping from flat COPY filenames to live paths (supabase/functions, supabase/migrations, apps/client-portal, src/components/discovery).

Admin discovery UI (Create Service modal, pin/block, opportunities) lives in `src/pages/admin/ClientServicesPage.tsx`. Pass 3 pin/block is implemented in `supabase/functions/generate-discovery-opportunities/index.ts`.
```
