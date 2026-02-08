# Service Line Creation, Allocation & Pricing — File Reference

**Last updated:** 2026-02-07  
**Purpose:** Single reference for every file involved in service line creation, allocation, and pricing in the torsor-practice-platform Discovery (and related) system.

---

## Summary

| Area | Role |
|------|------|
| **Creation** | New services from opportunities/concepts (`services` table, `create-service-from-opportunity`, admin Create Service modal). |
| **Allocation** | Which services are recommended per client: Pass 1 (calc) → Pass 2 (narrative) → Pass 3 (opportunities + pin/block). |
| **Pricing** | `service_pricing` / `service_pricing_tiers`, `services.price_*`, hardcoded catalog in Pass 1/Pass 2, admin ServicePricingManager. |

---

## 1. Migrations (schema & seed)

| Live path | Summary |
|-----------|---------|
| **`supabase/migrations/20260123_service_pricing.sql`** | Creates `service_pricing` and `service_pricing_tiers` (practice-level pricing config). Categories: financial, operational, strategic, implementation, analysis. |
| **`supabase/migrations/20260123_service_pricing_updates.sql`** | Updates to service pricing (tiers, RLS, indexes). |
| **`supabase/migrations/20260203_fix_service_pricing_models.sql`** | Fixes pricing model values / constraints. |
| **`supabase/migrations/20260201_create_services_table.sql`** | Creates `services` table: code, name, category, pricing (price_amount, price_display, price_period, price_from/to/unit), deliverables, status, practice_id, etc. |
| **`supabase/migrations/20260201_add_services_catalog.sql`** | Adds catalog-related columns / seed for services. |
| **`supabase/migrations/20260201_create_service_concepts_table.sql`** | `service_concepts` — draft concepts that can become services. |
| **`supabase/migrations/20260201_create_client_opportunities_table.sql`** | `client_opportunities` — opportunities per client (source for recommendations). |
| **`supabase/migrations/20260201_service_intelligence_system.sql`** | Service intelligence / scoring wiring. |
| **`supabase/migrations/20260204_add_systems_audit_service.sql`** | Adds Systems Audit to services catalog. |
| **`supabase/migrations/20260204_admin_service_selection.sql`** | Admin service selection (e.g. which services appear in flows). |
| **`supabase/migrations/20260207103430_discovery_opportunity_enhancements.sql`** | **Allocation:** `discovery_engagements.pinned_services`, `blocked_services`; `discovery_reports.recommended_services`, `not_recommended_services`, `opportunity_assessment`; `discovery_opportunities.show_in_client_view`. |
| **`supabase/migrations/20260208120000_discovery_three_phase_pipeline.sql`** | Three-phase discovery pipeline (Pass 1/2/3) status and flow. |
| **`supabase/migrations/20260209120000_reset_discovery_pipeline_for_client.sql`** | Reset discovery pipeline for a client. |
| **`supabase/migrations/20260209140000_discovery_data_audit.sql`** | Discovery data audit / consistency. |
| **`supabase/migrations/20251214_service_metadata_schema.sql`** | Early service metadata schema. |
| **`supabase/migrations/20251215_fix_service_value_calculations.sql`** | Service value calculation fixes. |
| **`supabase/migrations/20251216_fix_service_line_assessments.sql`** | Service-line assessment fixes. |
| **`supabase/migrations/20251222_add_benchmarking_service_line.sql`** | Benchmarking service line. |
| **`supabase/migrations/20260129_update_benchmarking_service_metadata.sql`** | Benchmarking service metadata. |
| **`supabase/migrations/20260129_fix_goal_alignment_metadata.sql`** | Goal Alignment (365) metadata. |
| **`supabase/migrations/20260122_rename_365_to_goal_alignment.sql`** | Rename 365 to Goal Alignment. |
| **`supabase/migrations/20260203_new_client_type_services.sql`** | Services by client type. |

**Copy location (this folder):** `migrations-<filename>.sql` (e.g. `migrations-20260123_service_pricing.sql`). Discovery-specific copies live here; service_pricing/services catalog migrations are in `supabase/migrations/` only.

---

## 2. Backend — Edge functions

| Live path | Summary |
|-----------|---------|
| **`supabase/functions/generate-discovery-report-pass1/index.ts`** | **Allocation + pricing (calc).** Builds `recommendedInvestments` from calculators; uses `SERVICE_CATALOG` / default prices; outputs `page3_journey.phases` and investment totals. Source of “Phase 1” service set and prices for Pass 2. |
| **`supabase/functions/generate-discovery-report-pass2/index.ts`** | **Allocation + pricing (narrative).** Consumes Pass 1 `recommendedInvestments` and `page3_journey`; builds `recommendedServices` (with pin/block from engagement); **hardcodes** Systems Audit £2,000 and MANDATORY PRICING in prompt; **ENABLED_BY_STRINGS** for journey phase “enabled by” text; `cleanJourneyPhases` + `cleanAllEnabledByStrings` before save. |
| **`supabase/functions/generate-discovery-opportunities/index.ts`** | **Allocation (Pass 3).** Reads `pinned_services` / `blocked_services` from `discovery_engagements`; generates/remaps opportunities; ensures pinned services appear and blocked are excluded; writes `discovery_opportunities` and report opportunity fields. |
| **`supabase/functions/generate-service-recommendations/index.ts`** | **Allocation (rule-based).** Scores services from discovery responses (inlined scorer); returns recommended service codes and triggers. Used for recommendation logic. |
| **`supabase/functions/generate-discovery-analysis/index.ts`** | **Legacy.** Contains `SERVICE_LINES` (tiers/prices) and full analysis prompt; still referenced for structure. |
| **`supabase/functions/create-service-from-opportunity/index.ts`** | **Creation.** Takes `client_opportunities` or `service_concepts`; uses LLM to generate service definition, skills, triggers; inserts into `services` (draft) for admin review. |
| **`supabase/functions/_shared/service-scorer-v2.ts`** | **Allocation.** Shared scorer: service codes, keyword sets, choice triggers, detection patterns; used by Pass 1 / opportunities / recommendations. |
| **`supabase/functions/process-client-context/index.ts`** | Stores client context used by recommendation and pricing context. |
| **`supabase/functions/generate-value-proposition/index.ts`** | Value propositions per service (used in narrative/pricing framing). |

**Copy location (this folder):** e.g. `generate-discovery-report-pass2-copy.ts`, `generate-discovery-opportunities-copy.ts`, `shared-service-scorer-v2-copy.ts`. See `DISCOVERY_SYSTEM_LIVE_SUMMARY.md` for full mapping.

---

## 3. Frontend — Admin

| Live path | Summary |
|-----------|---------|
| **`src/pages/admin/ClientServicesPage.tsx`** | **Main admin discovery UI.** Create Service modal (insert into `services`, update `service_concepts`), pin/block UI (writes `discovery_engagements.pinned_services` / `blocked_services`), opportunities list, service selection. |
| **`src/components/discovery/DiscoveryOpportunityPanel.tsx`** | Opportunities panel: list, create service from opportunity, visibility toggles. |
| **`src/components/discovery/ServicePinBlockControl.tsx`** | Pin/block controls: checkboxes per service code; saves to `discovery_engagements`. |
| **`src/components/admin/ServicePricingManager.tsx`** | **Pricing.** CRUD for `service_pricing` and `service_pricing_tiers` (practice-level). |
| **`src/pages/admin/ServiceConfigPage.tsx`** | Service configuration (which services exist, basic config). |
| **`src/components/benchmarking/admin/ServiceCreationModal.tsx`** | Benchmarking flow: create `services` row from approval request (code, name, price_from/to, etc.). |
| **`src/components/benchmarking/admin/ServiceSelectionPanel.tsx`** | Benchmarking service selection. |

**Copy location (this folder):** `frontend-admin-DiscoveryOpportunityPanel.tsx`, `frontend-admin-ServicePinBlockControl.tsx`. ClientServicesPage is not copied (too large); edit live.

---

## 4. Frontend — Client & shared

| Live path | Summary |
|-----------|---------|
| **`apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx`** | Client report page; displays recommended services and pricing from `destination_report`. |
| **`apps/client-portal/src/components/DiscoveryReportView.tsx`** | Renders report content including journey phases and “enabled by” strings. |
| **`src/components/discovery/TransformationJourney.tsx`** | Journey visualization (admin); shows phase labels and enabled-by. |
| **`src/components/ServiceDetailPopup.tsx`** | Service detail popup (name, price, description). |
| **`src/lib/service-lines.ts`** | **BSG_SERVICE_LINES**, **SERVICE_DEFINITIONS** (display names, price ranges, skills). |
| **`src/lib/advisory-services.ts`** | Advisory service definitions (client-side). |
| **`src/lib/advisory-services-full.ts`** | Full advisory service list. |
| **`src/config/serviceLineAssessments.ts`** | Service-line assessment config. |

**Copy location (this folder):** `frontend-client-*.tsx` for client-portal discovery pages; see `DISCOVERY_SYSTEM_LIVE_SUMMARY.md`.

---

## 5. Documentation

| Live path | Summary |
|-----------|---------|
| **`docs/SERVICE_LINE_DISCOVERY_MAPPING.md`** | Maps discovery questions → service lines, scoring, triggers. |
| **`docs/DISCOVERY_ASSESSMENT_OVERVIEW.md`** | Assessment overview, service lines, skills. |
| **`docs/DISCOVERY_ASSESSMENT_SYSTEM.md`** | Assessment structure and flow. |
| **`docs/DISCOVERY_OPPORTUNITY_IMPLEMENTATION.md`** | Opportunity and pin/block implementation. |
| **`SERVICE_LINE_SKILLS_MAPPING.md`** (root) | Service line ↔ skills mapping. |

**Copy location (this folder):** `docs-DISCOVERY_*.md`.

---

## 6. Data flow (creation, allocation, pricing)

```
Creation:
  service_concepts / client_opportunities
    → create-service-from-opportunity (LLM) OR ClientServicesPage "Create Service"
    → services (insert)

Allocation:
  discovery_engagements (pinned_services, blocked_services)
    → Pass 1: recommendedInvestments, page3_journey.phases
    → Pass 2: recommendedServices (merged with pins), narrative
    → generate-discovery-opportunities: discovery_opportunities, report.recommended_services

Pricing:
  service_pricing / service_pricing_tiers (by practice)
    + services.price_* (per-service overrides)
    + Pass 1 SERVICE_CATALOG / defaults
    + Pass 2 MANDATORY PRICING + ENABLED_BY_STRINGS (hardcoded display)
    → Admin: ServicePricingManager; ClientServicesPage; report UI
```

---

## 7. Key constants (where pricing / labels live)

| Location | What |
|----------|------|
| **Pass 1** | `SERVICE_CATALOG`, default prices, `recommendedInvestments` shape. |
| **Pass 2** | `ENABLED_BY_STRINGS` (phase1/deferred per service code), MANDATORY PRICING block in prompt, `recommendedServices` forced £2,000 for systems_audit. |
| **service-scorer-v2** | `SERVICES` (code + name), keyword sets, triggers. |
| **generate-service-recommendations** | Inlined `SCORING_SERVICES`, same codes. |
| **service-lines.ts** | `SERVICE_DEFINITIONS` (display name, price range, skills). |
| **DB** | `service_pricing`, `service_pricing_tiers`, `services.price_*`. |

---

*This file is part of the `discovery assessment analysis` reference set. Edit live code in `torsor-practice-platform/`; keep this doc in sync when adding or changing service line creation, allocation, or pricing.*
