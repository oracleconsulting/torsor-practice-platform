# TORSOR PLATFORM INVENTORY

Reconnaissance audit of the `torsor-practice-platform/` folder.
Read-only snapshot; no recommendations, no changes proposed.

---

## 1. Executive summary

Torsor is a Supabase-backed, AI-assisted practice operating system for accountancy / advisory firms. It is organised as an npm monorepo (`workspaces: ["apps/*", "packages/*"]`) but also contains a legacy top-level `src/` admin app that pre-dates the split. There are two distinct frontend surfaces (staff "platform" + client "portal"), ~90 Supabase Edge Functions, and ~213 SQL migrations.

**Total scope (excluding `node_modules`, `dist`, analysis-copy folders, `.git`):**

| File type | Count |
|---|---|
| TypeScript (`.ts`) | 247 |
| React (`.tsx`) | 258 |
| SQL (`.sql`) | 286 (213 under `supabase/migrations`, the rest in `scripts/` and `database/`) |
| Markdown (`.md`) | 74 |
| JavaScript (`.js`) | 114 (largely root-level scripts + config) |
| JSON config | 22 |
| HTML | 6 |
| CSS | 6 |

**Deployment surfaces:**

- **Edge functions:** 90 functions under `supabase/functions/` (~91,700 lines of Deno TS total). Sizes range from ~88 lines to 8,785 lines; the largest twenty are all LLM-pipeline generators.
- **Frontend routes:**
  - Staff admin (legacy `src/`): 15 admin routes (Clients, Goal Alignment, BI Portal, Delivery, Skills Heatmap/Management, Team Analytics, CPD, Training, Service Readiness, Assessments, Service Config, Service Line Builder, Tech Database, Knowledge Base, plus a public `/review` surface).
  - Staff platform (`apps/platform`): 6 routes (Login, Dashboard, Clients, Client detail, BI Pre-Call, Roadmap Review). This appears to be a nascent re-implementation.
  - Client portal (`apps/client-portal`): ~30+ routes covering dashboard, assessments (Part 1/2/3 + review/view), roadmap, tasks, life thread, progress, chat, appointments, and per-service surfaces for BI, Systems Audit, Benchmarking, and Discovery.
- **Database tables:** ~140 distinct tables are referenced from frontend `.from('…')` calls; migrations create ~120+ tables, plus a large seed of benchmark reference data across 12 industry batch files.
- **Background workers:** `sa-report-worker/` (Dockerised Node worker for Systems Audit report jobs).

**Major modules / service lines present:**

1. Benchmarking (`bm_*`)
2. Business Intelligence / Management Accounts (`bi_*` + `ma_*`; migrations show a rename from `ma` → `bi`)
3. Goal Alignment / 365 / Roadmap (`roadmap_stages`, sprint-plan, shift-update, life-design)
4. Systems Audit (`sa_*`)
5. Discovery / Destination Discovery (`discovery_*`, `destination_discovery`)
6. Business Advisory & Exit Planning (registered, `isActive: false`)
7. Automation Services (registered, `isActive: false`)
8. Fractional CFO (registered, `isActive: false`)
9. Fractional COO (registered, `isActive: false`)
10. Combined CFO/COO Advisory (registered, `isActive: false`)

Cross-cutting: Skills + CPD (`skills`, `skill_assessments`, `cpd_records`, `training_plans`), Service Readiness, Knowledge Base, Tech Database, Client + Engagement management, a generic Roadmap/Sprint system, an Outreach/Invitation system, and a Discovery "three-phase pipeline" that feeds all service-line generators.

**Primary technology stack:**

- **Language:** TypeScript everywhere (Deno flavour in edge functions, Node/Vite in apps).
- **Frontend:** React 19 + Vite 7 + Tailwind 3.4 + React Router v7 + TanStack React Query 5 + Framer Motion (client portal) + Recharts + lucide-react.
- **Backend:** Supabase (Auth, Postgres, Storage, Edge Functions). Supabase JS client `^2.84` (apps) / `^2.39` (worker).
- **LLM:** OpenRouter-routed Anthropic Claude models (Sonnet 4.5 dominant; Opus 4 / 4.5 for specific passes; Haiku for fast classifier), plus OpenAI GPT-4o-mini (Benchmarking classifier) and Perplexity Sonar Pro (live benchmark search).
- **PDF:** jspdf + html2canvas (client-side), Browserless (server-side for Benchmarking PDF).
- **Email:** Resend.
- **Node ≥ 20** (`nixpacks.toml`, `.nvmrc`).

---

## 2. Folder structure

```
torsor-practice-platform/
├── apps/                                 # Monorepo apps (newer split)
│   ├── platform/                         # Staff "platform" app (Vite+React, nascent)
│   │   └── src/
│   │       ├── App.tsx                   # Top-level route map (6 routes)
│   │       ├── components/               # Layout, services, systems-audit, roadmap
│   │       ├── config/assessments/       # Process-deep-dive + SA-discovery config
│   │       ├── contexts/AuthContext.tsx  # Staff (team_member) auth
│   │       ├── hooks/                    # useClients
│   │       ├── lib/supabase.ts           # Supabase singleton
│   │       ├── pages/                    # Login, Dashboard, Clients, ClientDetail, clients/* (BIPreCall, RoadmapReview)
│   │       └── types/                    # BI + Systems-Audit types
│   └── client-portal/                    # Client-facing portal app (React 19 + Vite)
│       └── src/
│           ├── App.tsx                   # ~30 lazy routes
│           ├── components/               # Per-surface: assessment, bi-dashboard, business-intelligence, discovery, progress, roadmap, sprint, tasks, ui + top-level shared (Layout, ProtectedRoute, DiscoveryReportView, ...)
│           ├── contexts/AuthContext.tsx  # Client auth (member_type='client')
│           ├── hooks/                    # Portal-specific: assessment progress, life alignment, analysis, tasks, weekly check-in, etc.
│           ├── lib/                      # supabase, service-registry (mirror), renewal
│           └── pages/                    # Login, Signup, Invitation, UnifiedDashboard, assessments/, discovery/, roadmap/, services/, chat/, appointments/, progress, life, reports, sprint
│
├── packages/                             # Shared monorepo packages
│   ├── shared/src/                       # @torsor/shared: types, constants, data (question sets), lib (supabase, models, utils), dataProtection util
│   ├── llm/src/                          # @torsor/llm: router, prompts, analyzers, generators, cleanup utils
│   └── ui/                               # @torsor/ui (package.json stub)
│
├── src/                                  # Legacy top-level staff admin app (still the primary admin)
│   ├── App.tsx                           # Top-level admin route map (15 routes)
│   ├── app/dashboard/                    # (empty)
│   ├── components/                       # Admin UI, grouped by service line (see below)
│   │   ├── admin/                        # Batch enrollment, onboarding, service-line builder, sprint editor, pricing, test panel, SA controls
│   │   ├── accountancy/                  # (empty dashboard + layout folders)
│   │   ├── benchmarking/                 # admin/ + client/ + assessment/ + top-level calculation cards
│   │   ├── business-intelligence/        # Dashboards, KPI, scenarios, insights, tiers, previews, MA/BI admin+client views
│   │   ├── _bi_legacy/                   # Legacy BI dashboard components
│   │   ├── dashboard/onboarding/         # (empty)
│   │   ├── discovery/                    # Admin discovery modal, opportunity panel, comments, transformation journey
│   │   ├── layout/                       # (empty)
│   │   ├── shared/                       # ServiceRecommendationPopup
│   │   ├── systems-audit/                # SAAdminReportView, SAClientReportView, SystemsMapSection
│   │   └── ui/                           # Generic UI (Toast, DataTable, StatCard, SkeletonLoader, StatusBadge, EmptyState)
│   ├── config/                           # routes, assessments, industries (taxonomy + BM discovery), serviceLineAssessments
│   ├── constants/brandAssets.ts
│   ├── data/                             # (empty)
│   ├── hooks/                            # 20 data hooks: skills, CPD, team, BI dashboard, KPIs, alerts, auth, current member, training, tech products, knowledge base, edit mode, service readiness, discovery product
│   ├── integrations/supabase/            # (empty; .DS_Store only)
│   ├── lib/                              # Domain logic & Supabase client
│   │   ├── services/benchmarking/        # founder-risk calculator, industry-mapper
│   │   ├── services/scenario-service.ts, service-catalog.ts
│   │   ├── advisory-services(-full).ts   # Advisory catalogue
│   │   ├── analytics-engine.ts
│   │   ├── export-benchmarking-data.ts
│   │   ├── issue-service-mapping.ts
│   │   ├── llm-service.ts
│   │   ├── opportunity-engine.ts
│   │   ├── pdf-export.ts
│   │   ├── scenario-calculator.ts
│   │   ├── service-calculations.ts
│   │   ├── service-lines.ts              # Thin wrapper over service-registry
│   │   ├── service-registry.ts           # 9-service canonical registry (admin mirror)
│   │   ├── supabase.ts                   # Client singleton
│   │   └── types.ts                      # Shared domain types
│   ├── pages/                            # Page components
│   │   ├── admin/                        # 19 admin pages + clients/ subfolder (Client list, filters, stats, test-mode panel)
│   │   └── public/AssessmentReviewPage.tsx
│   ├── services/                         # Client-side service modules
│   │   ├── BIAlertService.ts
│   │   ├── business-intelligence/        # comparison-service, kpi-calculator
│   │   └── ma/                           # kpi-calculations, true-cash
│   ├── styles/                           # (empty)
│   ├── types/                            # Cross-cutting TS types (bi, benchmarking, sa-platform-direction, tech-stack, etc.)
│   └── utils/extractHvaQuotes.ts
│
├── supabase/
│   ├── config.toml                       # Local Supabase project config (ports, auth redirects)
│   ├── functions/                        # 90 edge functions (Deno)
│   │   ├── _shared/                      # service-registry, service-scorer(-v2), llm-cache, llm-cost-tracker, context-enrichment, writing-style, cleanup, ANTI_AI_SLOP_STYLE_GUIDE.md
│   │   ├── README-DEPLOY.md
│   │   └── <one folder per function>/index.ts
│   └── migrations/                       # 213 SQL files (timestamped + EMERGENCY_RESTORE, see §7)
│
├── sa-report-worker/                     # Containerised Node worker for SA reports
│   ├── Dockerfile
│   ├── package.json
│   └── src/lib/types.ts                  # SharedContext interface (currently the only source file)
│
├── scripts/                              # 85 one-off SQL + JS scripts
│   ├── CONSOLIDATED_SCHEMA.sql           # Full-schema reference (pre-migrations era)
│   ├── add-*.sql                         # Early schema add-ons
│   ├── fix-*.sql, diagnose-*.sql         # Patches + diagnostics
│   ├── check-*.js, populate-*.sql        # Data checks + seeds
│   ├── sync-*.sh                         # Sync live code → analysis folders (read-only copies)
│   ├── copy-benchmarking-anonymised.ts
│   └── MA_V2_DIAGNOSTIC.md
│
├── database/                             # Early schema artefacts
│   ├── SCHEMA_COMPARISON.md              # "Oracle Method vs 365 portal" comparison
│   ├── DEACTIVATE_NEW_SKILLS.sql
│   └── migrations/001_365_client_portal_schema.sql, 002_add_roadmap_status.sql
│
├── docs/                                 # 43 project docs (see §6)
│   └── specs/                            # Feature specs (accounts-upload-feature.md)
│
├── public/                               # Static assets (diagnostics.html, images, logos, version.json)
├── dist/                                 # Build output (committed)
│
├── benchmarking assessment analysis/
├── benchmarking assessment analysis flat/
├── discovery assessment analysis/
├── goal alignment analysis/
├── systems audit analysis/
├── team cpd skills analysis/
├── ui ux analysis/                       # 644 mirrored files for a separate Claude project
│                                         # (All seven are READ-ONLY copies of live code; see .cursor/rules)
│
├── 37 top-level *.md files              # Historical status / handoff / plan docs (see §6)
├── cleanup_ben_reports.sql, diagnose_ben.sql, diagnose_report_sharing.sql  # Loose SQL
├── package.json                          # npm workspaces root; scripts for dev:client/platform, build, db:migrate
├── tsconfig.json / .app.json / .node.json
├── vite.config.ts                        # Top-level admin Vite config (port 5173)
├── tailwind.config.js, postcss.config.js, eslint.config.js
├── index.html, index.css, nixpacks.toml, .nvmrc, .env, .env.supabase
├── serve.json / serve-client.json        # SPA fallback configs (for `serve` CLI)
└── .cursor/rules/always-push-changes.mdc
```

---

## 3. Service line inventory

### 3.1 Benchmarking (`bm_*`)

**Purpose.** Compares a client's financial profile against industry benchmarks; surfaces "hidden value" opportunities and recommended follow-on services. Supports two tiers (industry comparison vs deep-dive with action plan) and a Hidden Value Audit ("HVA") follow-up. Includes a live-search component that pulls fresh benchmark stats when the DB lacks coverage.

**Key database tables.**
`industries`, `industry_categories`, `benchmark_metrics`, `benchmark_data`, `benchmark_sources`, `benchmark_refresh_log`, `benchmark_search_log`, `benchmark_metric_sources`, `benchmark_manual_queue`, `industry_requests`, `benchmarking_report_templates`, `bm_engagements`, `bm_engagement_services`, `bm_assessment_responses`, `bm_reports`, `bm_metric_comparisons`, `bm_client_scenarios`, `bm_tier_config`, plus 12 seed files under `20251222_seed_benchmark_data_batch*.sql`.

**Edge functions.**
- `generate-bm-report-pass1` (6,547 lines) — Main narrative + metrics report generation.
- `generate-bm-report-pass2` (753 lines) — Pass-2 enrichment / opportunity scoring.
- `generate-bm-opportunities` (3,353 lines) — Opportunity surfacing on top of pass-1 data.
- `regenerate-bm-report` (368 lines) — Re-run without re-uploading.
- `reset-bm-report` (88 lines) — Clear state back to pre-report.
- `generate-benchmarking-pdf` (3,472 lines) — Browserless-backed HTML→PDF.
- `fetch-industry-benchmarks` (637 lines) — Perplexity Sonar Pro live-search to fill gaps.
- `save-bm-supplementary-data` (219 lines) — Save client-provided supplementary data.
- `process-accounts-upload` (1,039 lines) + `reprocess-accounts` (233 lines) + `upload-client-accounts` (170 lines) — Accounts upload pipeline (shared with BI).

**Frontend.**
- **Admin (`src/components/benchmarking/admin/`):** `BenchmarkingAdminView`, `AccountsUploadPanel`, `BenchmarkSourcesPanel`, `ClientDataReference`, `ConversationScript`, `DataCollectionPanel`, `ExportAnalysisButton`, `FinancialDataReviewModal`, `NextStepsPanel`, `OpportunityDashboard`, `OpportunityPanel`, `PDFExportEditor`, `QuickStatsBar`, `RiskFlagsPanel`, `ServiceCreationModal`, `ServicePathwayPanel`, `ServiceSelectionPanel`, `ValueAnalysisPanel`, + top-level `CalculationBreakdown`, `EnhancedSuppressorCard`, `ExitReadinessBreakdown`, `SurplusCashBreakdown`, `TierSelector`, `TwoPathsSection`.
- **Client (`src/components/benchmarking/client/`):** `BenchmarkingClientDashboard`, `BenchmarkingClientReport`, `EnhancedServiceRecommendations`, `HeroSection`, `MetricComparisonCard`, `NarrativeSection`, `RecommendationsSection`, `RecommendedServicesSection`, `ScenarioExplorer`, `ScenarioPlanningSection`, `ServiceRecommendationsSection`, `ValueBridgeSection`.
- **Assessment:** `src/components/benchmarking/assessment/AdditionalQuestions.tsx`.
- **Client portal pages:** `BenchmarkingReportPage.tsx`, `BenchmarkingReportPreviewPage.tsx`, plus `/service/benchmarking/hva` aliased to the shared Part-3 assessment page.

**Key data flows.**
Client/admin uploads accounts → `process-accounts-upload` extracts financials → `bm_assessment_responses` captured → `generate-bm-report-pass1` produces narrative + `bm_metric_comparisons` → `generate-bm-opportunities` / `generate-bm-report-pass2` layer opportunity logic → `generate-benchmarking-pdf` renders final PDF (optionally Browserless) → shared via `bm_reports` with an `engagement_share` RLS layer (`20260411120000_bm_reports_rls_engagement_share.sql`).

**LLM usage.**
- Pass 1: Claude Sonnet 4.5 (narrative) + GPT-4o-mini for quick classification.
- Pass 2: Claude Opus 4 for higher-reasoning opportunities.
- Live search: Perplexity `sonar-pro` (via OpenRouter).

**Known docs.**
`docs/BENCHMARKING_AND_HVA_QUESTIONNAIRE.md`, `docs/BENCHMARKING_HIDDEN_VALUE_DISCOVERY.md`, `docs/BENCHMARKING_OPPORTUNITY_ANALYSIS.md`, `docs/BENCHMARKING_SERVICE_LINE_SUMMARY.md`.

---

### 3.2 Business Intelligence / Management Accounts (`bi_*` + `ma_*`)

**Purpose.** Monthly financial visibility service (three tiers: Clarity, Foresight, Strategic). Covers P&L entry/upload, KPI selection + tracking, cash-flow forecasting, scenario modelling, client profitability, "true cash" calculations, insight generation, watch-lists, report scheduling, and PDF output. The service was originally built under `ma_*` ("Management Accounts") and later rebranded to `bi_*` ("Business Intelligence") — both table families still exist.

**Key database tables.**
- BI family: `bi_engagements`, `bi_periods`, `bi_documents`, `bi_financial_data`, `bi_kpi_definitions`, `bi_kpi_values`, `bi_kpi_alerts`, `bi_insights`, `bi_cash_forecasts`, `bi_cash_forecast_periods`, `bi_cash_flow_items`, `bi_scenarios`, `bi_client_profitability`, `bi_watch_list`, `bi_report_config`, `bi_budgets`, `bi_period_comparisons`, `bi_generated_reports`, `bi_report_schedules`, `bi_scheduled_report_history`, `bi_notification_preferences`.
- MA family (legacy / still referenced): `ma_engagements`, `ma_periods`, `ma_documents`, `ma_financial_data`, `ma_financial_snapshots`, `ma_extracted_financials`, `ma_monthly_insights`, `ma_insights`, `ma_insight_feedback`, `ma_watch_list`, `ma_cash_forecasts`, `ma_cash_forecast_periods`, `ma_scenarios`, `ma_scenario_definitions`, `ma_client_profitability`, `ma_report_config`, `ma_chart_data`, `ma_kpi_definitions`, `ma_kpi_selections`, `ma_kpi_tracking`, `ma_kpi_recommendations`, `ma_assessment_reports`, `ma_assessment_responses`, `ma_uploaded_documents`, `ma_trend_data`, `ma_known_commitments`, `ma_optimisations`, `ma_period_comparisons`, `ma_true_cash_calculations`, `ma_industry_benchmarks`, `ma_client_profile`, `ma_precall_gaps`, `ma_talking_points`, `ma_presentation_interactions`, `ma_tier_definitions`.

**Edge functions.**
- `generate-ma-report-pass1` / `pass2` — Report generation.
- `generate-ma-insights`, `generate-ma-forecast`, `generate-ma-scenarios`, `generate-ma-precall-analysis`.
- `generate-bi-insights`, `generate-bi-pdf` (2,680 lines).
- `extract-ma-financials`, `upload-ma-document`, `calculate-ma-trends`, `regenerate-ma-admin-view`.
- `get-kpi-dashboard`, `get-kpi-definitions`, `manage-kpi-selections`, `save-kpi-values`, `send-scheduled-report`.

**Frontend.**
- **Admin (`src/components/business-intelligence/`):** `AdminKPIManager`, `AlertsPanel`, `BalanceSheetSummary`, `BudgetEntry`, `BudgetManager`, `CashFlowWaterfall`, `CashForecastChart`, `ClientProfitabilityChart`, `ClientProfitabilityTable`, `ClientReportPreview`, `DocumentUploader`, `FinancialDataEntry`, `HistoricalDataUploader`, `InsightCard`, `InsightEditor`, `InsightsReviewPanel`, `KPIDashboard`, `KPIDetailView`, `KPIPreview`, `KPISelector`, `KPITrendChart`, `MAAdminReportView`, `MAClientDashboard`, `MAClientReportView`, `PDFExportButton`, `PLAnalysis`, `PeriodDeliveryChecklist`, `ReportScheduler`, `ScenarioBuilder`, `TierComparisonView`, `TierSelector`, `TrueCashCard`, `TuesdayQuestionDisplay`, `WatchListPanel`, `YTDComparison`; `dashboard/` subfolder (`MADashboard`, `CashForecastSection`, `ClientProfitabilitySection`, `DashboardInsightCard`, `InsightVisualization`, `ScenarioEditor`/`Manager`, `SectionVisibilityPanel`, `SectionWrapper`, `TrueCashWaterfall`); `previews/` (`ForecastPreview`, `ScenarioPreview`, `TrueCashPreview`).
- **Legacy admin (`src/components/_bi_legacy/`):** `BIDashboard`, `CashForecastSection`, `ClientProfitabilitySection`, `InsightCard`, `InsightList`, `KPIGrid`, `TrueCashWaterfall`, `TuesdayQuestionBanner`.
- **Platform (`apps/platform/src/components/services/business-intelligence/`):** `MAAdminReportView`, `MAClientReportView`, `TierSelector`, `previews/`.
- **Client portal:** `bi-dashboard/` (`CashForecastChart`, `MetricsSummaryBar`, `PLSummaryCard`, `ScenarioExplorer`, `TuesdayQuestionBanner`, `WatchList`), `business-intelligence/` (`CashFlowForecast`, `ScenarioModeler`, `TierComparisonView`, `TrueCashPreview`), pages `BIReportPage`, `BIDashboardPage`, `BIPresentationPage`.
- **Services (client-side):** `src/services/BIAlertService.ts`, `src/services/business-intelligence/{comparison-service, kpi-calculator}`, `src/services/ma/{kpi-calculations, true-cash}`.

**Key data flows.**
Client uploads accounts / bank data → `upload-ma-document` + `extract-ma-financials` → `ma_financial_data` / `bi_financial_data` → `calculate-ma-trends` → `generate-ma-insights` / `generate-bi-insights` populate `bi_insights` / `ma_monthly_insights` → admin curates in `InsightsReviewPanel` → `generate-bi-pdf` or `generate-ma-report-pass1/2` → scheduled delivery via `send-scheduled-report` (reads `bi_report_schedules`).

**LLM usage.**
Primarily Claude Sonnet 4.5 for insight + narrative, Opus 4 for pass-2 where reasoning depth needed, Haiku for light classification, GPT-4o-mini referenced in BM but also appears in MA helpers.

**Known docs.**
`docs/PDF_EXPORT_FUNCTIONALITY.md`, `scripts/MA_V2_DIAGNOSTIC.md`, `docs/UNIFIED_UPLOAD_CHECK.md`. (No single standalone BI system doc was observed.)

---

### 3.3 Goal Alignment / 365 / Roadmap

**Purpose.** Quarterly-cycle advisory programme: client completes a 3-part "Part 1/2/3" intake, a roadmap is generated in stages, sprint plans and summaries are produced, with periodic "shift updates" and a "life design thread" that layers personal alignment on top of business goals. Three tiers (Lite / Growth / Partner). Service code in the registry is `goal_alignment` (formerly `365`, renamed in `20260122_rename_365_to_goal_alignment.sql`).

**Key database tables.**
`client_assessments` (unified Part 1/2/3), `client_roadmaps`, `roadmap_stages`, `generation_queue`, `generation_feedback`, `client_tasks`, `client_chat_threads`, `client_chat_messages`, `client_appointments`, `client_activity_log`, `llm_usage_log` (from `database/migrations/001_365_client_portal_schema.sql`), plus: `weekly_checkins`, `quarterly_life_checks`, `life_pulse_entries`, `life_alignment_scores`, `sprint_templates`, `enrollment_batches`, `enrollment_entries`, `client_progress_snapshots`, `client_wins`.

**Edge functions.**
- `generate-roadmap` (2,369 lines), `roadmap-orchestrator` (653 lines), `generate-sprint-plan`, `generate-sprint-plan-part1`, `generate-sprint-plan-part2`, `generate-sprint-summary`, `generate-shift-update`, `generate-six-month-shift`, `generate-five-year-vision`, `generate-vision-update`, `generate-director-alignment`, `generate-life-design-refresh`, `generate-insight-report`, `generate-advisory-brief`, `notify-roadmap-ready`, `notify-sprint-lifecycle`, `send-assessment-review`.
- Fit assessment: `fit-assessment`, `generate-fit-profile`.

**Frontend.**
- **Admin:** `src/pages/admin/GADashboardPage.tsx`, `src/components/admin/sprint-editor/*` (SprintEditorModal, WeekEditor, TaskEditor, SprintOverview, EditorChangeLog, PublishConfirmation, plus sync utils + types), `src/components/admin/SprintSummaryAdminPreview.tsx`.
- **Platform:** `apps/platform/src/pages/clients/RoadmapReviewPage.tsx`, `apps/platform/src/components/roadmap/StageReview.tsx`.
- **Client portal:** `pages/roadmap/RoadmapPage.tsx`, `pages/roadmap/TasksPage.tsx`, `pages/SprintDashboardPage.tsx`, `pages/LifeThreadPage.tsx`, `pages/ProgressPage.tsx`, `components/roadmap/FinancialPulse.tsx`, `components/sprint/*` (SprintCompletionCelebration, SprintCompletionLoading, SprintSummaryView, TierUpgradePrompt, TuesdayCheckInCard, WeeklyCheckIn, QuarterlyLifeCheck, LifePulseCard, LifeAlignmentCard, RenewalWaiting, CatchUpBanner, CatchUpView), `components/progress/*` (HeroStats, ProgressChart, ValueStory, WinWall), `components/tasks/TaskCompletionModal.tsx`.

**Key data flows.**
Invitation → Signup → `client_assessments` (Part 1/2/3) → `roadmap-orchestrator` fans out to `generate-roadmap` → `roadmap_stages` → `generate-sprint-plan-part1` / `part2` → `client_tasks` → weekly/quarterly check-ins update `life_*` + `client_progress_snapshots` → `generate-shift-update` / `generate-sprint-summary` each cycle → `notify-*` functions trigger email via Resend.

**LLM usage.**
Claude Sonnet 4.5 is default for sprint generation, shift updates, vision work; Opus 4.5 used in `generate-roadmap` (`claude-opus-4-5-20250514`). `packages/llm` has a tiered router (fast/balanced/premium) with OpenAI fallbacks.

**Known docs.**
`docs/365-ALIGNMENT-SYSTEM-OVERVIEW.md`, `docs/365-NARRATIVE-ELEVATION-DESIGN.md`, `docs/365_ALIGNMENT_SYSTEM_OVERVIEW.md`, `docs/ROADMAP_TO_10_OUT_OF_10.md`, `docs/STAGED_ROADMAP_ARCHITECTURE.md`, `365_CLIENT_PORTAL_SPECIFICATION.md` (root).

---

### 3.4 Systems Audit (`sa_*`)

**Purpose.** Maps a client's systems/processes, identifies bottlenecks and workarounds, outputs a systems map + prioritised recommendations. Two tiers. Supports staff interviews, process "deep dives", chain suggestion, transcript processing, and a Railway-hosted background worker for long-running report jobs.

**Key database tables.**
`sa_engagements`, `sa_discovery_responses`, `sa_uploaded_documents`, `sa_context_notes`, `sa_system_categories`, `sa_system_inventory`, `sa_process_chains`, `sa_process_deep_dives`, `sa_findings`, `sa_recommendations`, `sa_audit_reports`, `sa_engagement_gaps`, `sa_tech_products`, `sa_tech_integrations`, `sa_tech_migration_paths`, `sa_middleware_capabilities`, `sa_auto_discovery_log`, `sa_staff_members`, `sa_staff_interviews`, `sa_report_jobs`.

**Edge functions.**
- `generate-sa-report` (630 lines), `generate-sa-report-pass1` (3,298 lines), `generate-sa-report-pass2` (716 lines).
- `analyze-sa-preliminary` (375 lines), `generate-sa-call-script` (296 lines), `process-sa-transcript` (312 lines), `suggest-sa-process-chains` (374 lines), `discover-sa-tech-product` (266 lines).

**Frontend.**
- **Admin:** `src/components/systems-audit/{SAAdminReportView,SAClientReportView,SystemsMapSection}.tsx`, `src/components/admin/sa/{PlatformDirectionPanel,SAPhaseControls}.tsx`, `apps/platform/src/components/systems-audit/SystemsAuditView.tsx`.
- **Client portal:** `pages/services/{SystemInventoryPage,ProcessDeepDivesPage,ReviewSubmitPage,SubmissionStatusPage,SAReportPage,StaffInterviewPage,ServiceAssessmentPage}.tsx`, `components/assessment/StaffRosterBuilder.tsx`, `components/SystemsMapSection.tsx`.

**Key data flows.**
Client completes discovery responses → uploads docs + inventories systems → staff interviews (optional) → admin reviews in `SAAdminReportView` → `analyze-sa-preliminary` produces early gaps → `suggest-sa-process-chains` + `generate-sa-call-script` drive follow-up call → `process-sa-transcript` ingests call → `generate-sa-report-pass1/2` builds the final audit report. `sa_report_jobs` table supports offloading long runs to `sa-report-worker/` (Docker, Railway-suffix comment observed) rather than edge-function execution.

**LLM usage.**
Sonnet 4.5 across pass-1 bodies; Opus 4 used in pass-2 (`generate-sa-report-pass2`).

**Known docs.**
`docs/SYSTEMS_AUDIT_ASSESSMENT_QUESTIONS.md`, root `SYSTEMS_AUDIT_ASSESSMENT_STATUS.md`, `apps/platform/src/config/assessments/process-deep-dives.ts` and `systems-audit-discovery.ts`, `packages/shared/src/data/saProcessDeepDiveChains.ts`.

---

### 3.5 Discovery / Destination Discovery

**Purpose.** Cross-cutting "entry" experience that profiles a client's destination / ambitions / pain points and produces a report that *feeds* downstream service lines (especially Benchmarking, Goal Alignment, and Systems Audit). Implemented as a three-phase pipeline (prepare → analyse → report) with seven-dimension analysis and a learning library that records admin edits for future reuse.

**Key database tables.**
`destination_discovery`, `discovery_engagements`, `discovery_reports`, `discovery_uploaded_documents`, `discovery_context_notes`, `discovery_patterns`, `discovery_service_triggers`, `discovery_analysis_comments`, `discovery_opportunities`, `practice_learning_library`, `learning_application_log`, plus Discovery-specific opportunity helpers (`client_opportunities`, `client_financial_context`, `client_operational_context`, `client_pattern_analysis` — the last three are defined in `scripts/enhanced-discovery-framework*.sql`).

**Edge functions.**
- `prepare-discovery-data` (1,173), `generate-discovery-analysis` (8,785 – the largest edge function), `generate-discovery-opportunities` (1,574), `generate-service-recommendations` (1,422), `generate-value-proposition` (486), `generate-value-analysis` (4,890), `generate-discovery-report` (1,370), `generate-discovery-report-pass1` (5,852), `generate-discovery-report-pass2` (4,764), `generate-discovery-report-pass2a` (5,211), `generate-discovery-report-pass2b` (760), `generate-discovery-pdf` (1,980), `generate-discovery-responses-pdf` (546), `generate-followup-analysis` (863), `detect-assessment-patterns` (507), `start-discovery-report` (104), `process-client-context` (516), `process-documents` (1,442), `parse-document` (510).

**Frontend.**
- **Admin (`src/components/discovery/`):** `AnalysisCommentSystem`, `DiscoveryAdminModal`, `DiscoveryOpportunityPanel`, `ServicePinBlockControl`, `TransformationJourney`.
- **Client portal:** `pages/discovery/{DestinationDiscoveryPage,DiscoveryFollowUpPage,DiscoveryReportPage}.tsx`, `pages/DiscoveryCompletePage.tsx`, `components/DiscoveryReportView.tsx`, `components/discovery/{DiscoveryInsightCard,DiscoveryMetricCard,TransformationJourney}.tsx`.

**Key data flows.**
Assessment → `prepare-discovery-data` normalises inputs → `generate-discovery-analysis` produces the core seven-dimension read → `generate-discovery-opportunities` + `generate-value-analysis` score + surface services → `generate-discovery-report-pass1/2/2a/2b` compose the narrative → `generate-discovery-pdf` / `generate-discovery-responses-pdf` render PDFs → results fan out to service-specific engagements (`bm_engagements`, `sa_engagements`, client roadmap creation). The "learning library" records admin edits and applies them to future runs via `detect-assessment-patterns`.

**LLM usage.**
Claude Sonnet 4.5 dominant; Sonnet-4 / 4.5 + Opus-4.5 variants in different passes; extensive prompt material under `supabase/functions/_shared/context-enrichment.ts` + `writing-style.ts` and the `ANTI_AI_SLOP_STYLE_GUIDE.md`.

**Known docs.**
`docs/DISCOVERY_ASSESSMENT_OVERVIEW.md`, `docs/DISCOVERY_ASSESSMENT_SYSTEM.md`, `docs/DISCOVERY_ANALYSIS_REFINEMENT.md`, `docs/DISCOVERY_AND_ANALYSIS_ARCHITECTURE.md`, `docs/DISCOVERY_DATA_MAP.md`, `docs/DISCOVERY_LLM_OVERVIEW.md`, `docs/DISCOVERY_OPPORTUNITY_IMPLEMENTATION.md`, `docs/DISCOVERY_QUESTIONS.md`, `docs/DISCOVERY_REPORT_PDF_AND_PORTAL_VIEWER.md`, `docs/DISCOVERY_THREE_PHASE_IMPLEMENTATION_GUIDE.md`, `docs/SERVICE_LINE_DISCOVERY_MAPPING.md`, `docs/SERVICE_LINES_ARCHITECTURE_DISCOVERY.md`.

---

### 3.6 Business Advisory & Exit Planning, Automation, Fractional CFO / COO / Combined

These five services are **registered** in `src/lib/service-registry.ts` and `supabase/functions/_shared/service-registry.ts` with pricing and display copy, but each has `isActive: false`. There are no dedicated tables, edge functions, or frontend surfaces for these five service lines beyond their entry in the registry and their use in opportunity / recommendation scoring. There is, however, a **generic** "Advisory Deep Dive" edge function (`advisory-deep-dive`, 1,580 lines) and an `audit_advisory_insights` table, which appear to support cross-service advisory briefs (`generate-advisory-brief`). `src/lib/advisory-services{,-full}.ts` define advisory catalogues used by the opportunity engine. No service-specific documentation was observed for these five.

---

### 3.7 Meta-service / platform capabilities (not service lines, but registered-adjacent)

**Fit Assessment.** `fit-assessment` + `generate-fit-profile` edge functions. Used for onboarding profiling — no dedicated tables observed; appears to write into `client_assessments` / contextual rows.

**Outreach Tool.** Root `OUTREACH_TOOL_ARCHITECTURE.md` describes an outreach capability; no dedicated edge functions found in this folder. (`send-client-invitation`, `send-assessment-review`, `batch-enroll-clients`, `batch-remind-clients`, `bulk-import-clients`, `client-signup`, `accept-invitation` cover invitation / onboarding flow.)

---

## 4. Cross-cutting infrastructure

### 4.1 Authentication and identity

- **Backend:** Supabase Auth (`auth.users`), used via `createClient` with anon key on client, service-role key in edge functions.
- **Single-app isolation:** Each app has its own `supabase` singleton (`src/lib/supabase.ts`, `apps/platform/src/lib/supabase.ts`, `apps/client-portal/src/lib/supabase.ts`). The client-portal comment notes this is deliberate to avoid multiple `GoTrueClient` instances.
- **Role model:** `practice_members.member_type ∈ {team, client, advisor}` (see `CONSOLIDATED_SCHEMA.sql` and the client-portal `AuthContext`). `practice_members.role ∈ {owner, admin, advisor, viewer}` for team members. Platform app rejects a login if no `team_member` row exists and redirects to the client portal; the client portal rejects logins lacking a `member_type='client'` row.
- **Invitation flow:** `client_invitations` table; edge functions `send-client-invitation` and `accept-invitation`; client-portal `InvitationPage.tsx` + `SignupPage.tsx`.
- **Public surfaces:** `/review` (AssessmentReviewPage) is a public non-authenticated admin surface; `/staff-interview/:engagementId` is an eager-loaded non-authenticated client-portal route.

### 4.2 Client and engagement management

Core tables: `practices`, `practice_members` (extended to also hold clients via `member_type`), `client_service_lines`, `service_lines`, `service_line_assessments`, `clients` (referenced but likely an alias/view), `client_invitations`, `client_context`, `client_context_notes`, `client_reports`, `client_tasks`, `client_roadmaps`, `client_assessments`, `client_accounts_uploads`, `client_financial_data`, `client_financial_data_audit`, `client_opportunities`, `client_progress_snapshots`, `client_wins`, `client_scenarios`, `multi_client_onboarding` helpers (`enrollment_batches`, `enrollment_entries`).

Per-service engagement tables (`bm_engagements`, `bi_engagements`, `ma_engagements`, `sa_engagements`, `discovery_engagements`) all hang off `practice_members` as the client row.

Admin UI: `ClientServicesPage` + `clients/` subfolder (ClientFilters, ClientListTable, ClientStatsBar, TestModePanel). Platform UI: `ClientsPage`, `ClientDetailPage`, `ClientsPage` uses `useClients` hook.

### 4.3 Skills assessment and CPD

Skills and CPD are a **meta-layer assessing the practice team itself**, not clients:

- Tables: `skills`, `skill_assessments`, `service_line_interests`, `cpd_records`, `cpd_targets`, `training_plans`, `training_modules`, `service_roles`, `service_role_skills`, `service_skill_requirements`, `service_line_blueprints`, `service_workflow_phases`, `service_phase_activities`, `service_activity_skills`, `phase_activities`, `activity_skill_mappings`, `team_phase_assignments`, `team_member_assignments`, `delivery_teams`, plus "soft-skill" / profiling tables `personality_assessments`, `belbin_assessments`, `eq_assessments`, `conflict_style_assessments`, `motivational_drivers`, `working_preferences`, `learning_preferences`, `hva_assessments`.
- Admin pages: `SkillsHeatmapPage`, `SkillsManagementPage`, `TeamAnalyticsPage`, `CPDTrackerPage`, `TrainingPlansPage`, `ServiceReadinessPage`, `AssessmentPreviewPage`, `KnowledgeBasePage`, `TechDatabasePage`.
- Admin components: `SkillsHeatmapGrid`, `SkillCategoryCard`, `ServiceReadinessCard`, `ServiceDetailPopup`.
- Hooks: `useSkills`, `useSkillsByCategory`, `useSkillAssessments`, `useCPD`, `useCPDRecords`, `useTeamMembers`, `useTeamAnalytics`, `useTrainingPlans`, `useServiceReadiness`, `useTechProducts`, `useTechLookupBatch`, `useKnowledgeBase`.
- No service-line assessments or CPD code appears in `apps/client-portal` — this subsystem is admin-only.

### 4.4 Staff portal vs client portal

- **Legacy admin (`src/`)** is still the authoritative staff UI (15 routes, all admin-focused).
- **New `apps/platform`** is a stub admin rebuild (6 routes; Dashboard + Clients + detail + BI precall + Roadmap review).
- **`apps/client-portal`** is the external-facing client experience (~30 routes across assessment, services, roadmap, chat, appointments, progress, life).
- `src/components/AdminLayout.tsx` + `src/components/Navigation.tsx` drive the legacy sidebar; client portal uses its own `Layout.tsx` + `ProtectedRoute.tsx`; platform uses its own inline layout.

### 4.5 Document and file handling

- **Supabase Storage buckets** referenced in migrations: `ma-documents`, `sa-documents` (commented), `bi-reports` (10 MB, PDF/HTML/image), `discovery-documents`, `service-manuals`, `service-examples`, `client-accounts` (commented).
- **Upload paths:** `upload-ma-document`, `upload-client-accounts`, `process-documents`, `parse-document`, `process-accounts-upload`, `reprocess-accounts`, `delete-client-accounts`.
- **Client-portal upload UI:** `components/assessment/`, `business-intelligence/DocumentUploader`, `HistoricalDataUploader`, service-specific inventory/upload pages.
- **PDF generation:**
  - Client-side: `src/lib/pdf-export.ts` + `html2canvas` + `jspdf`; `PDFExportButton.tsx`, `PDFExportEditor.tsx`.
  - Server-side: `generate-bi-pdf`, `generate-benchmarking-pdf`, `generate-discovery-pdf`, `generate-discovery-responses-pdf` — the Benchmarking PDF can delegate HTML→PDF rendering to Browserless.
- **Unified upload:** `20260210120000_unified_client_document_upload.sql`.

### 4.6 Shared utilities

- `supabase/functions/_shared/`:
  - `service-registry.ts` — canonical services + tiers + pricing.
  - `service-scorer.ts` (437 lines) + `service-scorer-v2.ts` (967 lines) — opportunity / recommendation scoring.
  - `context-enrichment.ts` (559 lines) — prompt context builders.
  - `writing-style.ts` + `ANTI_AI_SLOP_STYLE_GUIDE.md` — prompt style rules.
  - `llm-cache.ts` / `llm-cost-tracker.ts` — caching + cost recording.
  - `cleanup.ts` — shared cleanup helpers.
- `packages/shared/`: common types (`assessment`, `client`, `chat`, `roadmap`), constants (categories, assessment-meta), question sets (Part 1/2/3, SA deep-dive chains), utils (`dataProtection`).
- `packages/llm/`: a tiered router (`fast` / `balanced` / `premium` with Claude Haiku / Sonnet-4 / Opus), shared prompts (`fit-assessment`, `roadmap`, `value-analysis`, `chat`, `quality-rules`), a roadmap generator and a value analyzer.
- `src/lib/`: frontend-only domain logic — `service-registry.ts` (mirror), `service-lines.ts`, `advisory-services(-full).ts`, `analytics-engine.ts`, `opportunity-engine.ts`, `issue-service-mapping.ts`, `scenario-calculator.ts`, `service-calculations.ts`, `export-benchmarking-data.ts`, `llm-service.ts`, `pdf-export.ts`, `services/benchmarking/founder-risk-calculator.ts`, `services/benchmarking/industry-mapper.ts`, `services/scenario-service.ts`, `services/service-catalog.ts`.
- `apps/client-portal/src/lib/`: `supabase.ts`, `service-registry.ts` (third copy), `renewal.ts`.
- `scripts/CONSOLIDATED_SCHEMA.sql`: a pre-migrations full-schema snapshot (still referenced in some tooling).

### 4.7 Database migrations (chronological shape)

- **2025-11-27:** `database/migrations/001_365_client_portal_schema.sql` — original "clean rebuild" schema (9 core tables: `practices`, `practice_members` (extended), `client_assessments`, `client_roadmaps`, `client_tasks`, `client_chat_threads`, `client_chat_messages`, `client_appointments`, `client_activity_log`, `llm_usage_log`).
- **December 2025:** first service-line migrations land — report jobs, assessment patterns, client context notes, service metadata schema (`service_line_metadata`, `service_timing_rules`, `service_advisory_triggers`, `service_contraindications`, `service_value_calculations`, `service_narrative_templates`, `advisory_overselling_rules`, `audit_advisory_insights`), staged roadmap architecture, MA AI layer, Systems Audit (`20251219_systems_audit_complete.sql`), Benchmarking core (`20251222_benchmarking_complete.sql`) + 12 seed batches.
- **January 2026:** Discovery v2 (`20260115_discovery_assessment_v2.sql`), discovery report system, MA→BI rebrand (`20260122_rename_ma_to_bi.sql`), 365→goal_alignment rebrand (`20260122_rename_365_to_goal_alignment.sql`), BI core/kpis/scheduling/phase1/phase3, service pricing, benchmarking live search.
- **February 2026:** Adaptive assessment metadata + status, life design thread (4a), sprint lifecycle, service catalogue + tiers, multi-client onboarding, renewal pipeline, context intelligence overhaul, extensive SA evolution (inventory expansion, staff interviews, engagement gaps, preliminary analysis, follow-up script/transcript, staff roster, submission flow, auto-suggest chains, industry chain templates), BM share functionality, opportunity-calculations, client-type classification.
- **March–April 2026:** SA platform direction / tech migration paths / phase-status extension, BM reports RLS engagement share (`20260411120000_bm_reports_rls_engagement_share.sql`), advisory-brief trigger chain.
- One un-timestamped file: `EMERGENCY_RESTORE_PASS1_DATA.sql`.

RLS-adjacent migrations are pervasive: a large number of migrations are `fix_*_rls.sql` style patches, indicating iterative tightening of per-row access.

### 4.8 Integration points

| External service | Where it's used | Env var(s) |
|---|---|---|
| Supabase (Auth + Postgres + Storage + Edge Functions) | Everywhere | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` |
| OpenRouter (routes to Anthropic/OpenAI/Perplexity) | All LLM-calling edge functions | `OPENROUTER_API_KEY`, `OPENROUTER_REFERRER_URL` |
| Anthropic Claude (via OpenRouter) | Pass-1 narratives, Sonnet 4.5 dominant; Opus 4/4.5 for deep passes; Haiku for fast classifiers | (routed) |
| OpenAI (via OpenRouter) | `gpt-4o-mini` classifier in BM; fallback tier in `packages/llm/router` | (routed) |
| Perplexity (via OpenRouter) | `sonar-pro` live benchmark search in `fetch-industry-benchmarks` | (routed) |
| Resend (email) | `send-client-invitation`, `notify-roadmap-ready`, reminders | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` |
| Browserless (HTML→PDF) | `generate-benchmarking-pdf` | `BROWSERLESS_API_KEY`, `BROWSERLESS_ENDPOINT` |
| Client portal cross-link | Invitation emails, etc. | `CLIENT_PORTAL_URL`, `SITE_URL` |

**No code referencing Microsoft Graph, Karbon, Xero, QuickBooks, Stripe, or any CRM integration was observed.** Document parsing is done in-process (pdf-parse, pdfjs-dist, unpdf listed in root `package.json` optionalDependencies) and via the custom `parse-document` / `process-documents` edge functions.

---

## 5. Deployment and environment

**Where the code runs:**

- **Edge functions:** Supabase Edge Runtime (Deno). Deployment notes in `supabase/functions/README-DEPLOY.md`.
- **Staff admin (legacy `src/`):** `vite build` → `dist/` → `serve -c serve.json -l $PORT` (Nixpacks/Railway-compatible; `preview.allowedHosts` in `vite.config.ts` includes `torsor.co.uk` and `.railway.app`).
- **Client portal:** `npm run build:client` → `apps/client-portal/dist` → `serve -c serve-client.json`. Invitation links and emails reference `https://client.torsor.co.uk`.
- **Platform app (`apps/platform`):** Build configured, reads comments suggest planned migration target.
- **SA report worker:** Node 20 Alpine Docker image (`sa-report-worker/Dockerfile`), triggered via `sa_report_jobs`. A 2026-02-22 migration is titled `sa_railway_worker_and_custom_chains`, suggesting Railway hosting.
- **Node version:** `.nvmrc` → 20; `nixpacks.toml` pins `nodejs_20`.

**Environment variable names referenced (no values):**

- Frontend (`VITE_`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Backend / edge functions: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` (in root `.env`), `OPENROUTER_API_KEY`, `OPENROUTER_REFERRER_URL`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CLIENT_PORTAL_URL`, `SITE_URL`, `BROWSERLESS_API_KEY`, `BROWSERLESS_ENDPOINT`.

**External services depended on:** Supabase, OpenRouter (fronting Anthropic, OpenAI, Perplexity), Resend, Browserless, Railway (hosting implied via nixpacks + `allowedHosts`).

**Deployment / CI / Docker:**

- `nixpacks.toml` — Nixpacks build declaration for Railway.
- `sa-report-worker/Dockerfile` — Node 20 Alpine build.
- `supabase/functions/README-DEPLOY.md` — edge-function deploy notes.
- Scripts in `scripts/sync-*.sh` sync live code into the read-only analysis folders.
- No `.github/workflows/`, `.gitlab-ci.yml`, or `Jenkinsfile` was observed at this level.

---

## 6. Documentation inventory

### 6.1 Root-level "status / plan / handoff" documents (35 files)

Mostly point-in-time status logs. Grouped loosely:

- **Platform vision / rebuild:** `README.md` (short rebuild readme), `COMPREHENSIVE_REBUILD_PLAN.md`, `PROPER_REBUILD_PLAN.md`, `REBUILD_STATUS.md`, `BUILD_COMPLETE.md`, `FINAL_SUMMARY.md`, `FINAL_SOLUTION.md`, `IMPLEMENTATION_PROGRESS.md`.
- **Phase gates:** `PHASE_1_COMPLETE.md`, `PHASE_7-9_COMPLETE.md`, `NEXT_STEPS_PLAN.md`.
- **Deployment / infra fixes:** `DEPLOYMENT_GUIDE.md`, `DEPLOYMENT_FIX.md`, `DEPLOYMENT_STATUS.md`, `DEPLOY_ACCEPT_INVITATION.md`, `VERIFY_DEPLOYMENT.md`, `BAD_GATEWAY_EXPLANATION.md`, `NIXPACKS_FIX.md`, `NODE_VERSION_FIX.md`, `TROUBLESHOOTING_404.md`.
- **Skills troubleshooting:** `SKILL_COVERAGE_FIX.md`, `SKILL_MAPPING_FIXED.md`, `SKILL_REPLACEMENT_MAP.md`, `SKILLS_ISSUE_RESOLVED.md`, `HEATMAP_EXPLANATION.md`, `SERVICE_LINE_SKILLS_MAPPING.md`, `INTERESTS_INTEGRATED.md`.
- **Getting started / handoff:** `QUICK_START.md`, `COMPLETE_QUICK_START.md`, `HANDOFF_PROMPT.md`, `NEW_CHAT_PROMPT.txt`, `DELETE_TEST_USER.md`.
- **Feature docs:** `365_CLIENT_PORTAL_SPECIFICATION.md`, `ORACLE_METHOD_INTEGRATION_PLAN.md`, `OUTREACH_TOOL_ARCHITECTURE.md`, `SYSTEMS_AUDIT_ASSESSMENT_STATUS.md`, `UI_UX_PLAN.md`.

### 6.2 `docs/` (43 files)

- **Platform-wide:** `ARCHITECTURE.md`, `COMPLETE_SYSTEM_OVERVIEW.md`, `DEPLOYMENT_SUMMARY.md`, `TORSOR_PRACTICE_PLATFORM_MASTER.md`, `VERIFICATION_CHECKLIST.md`, `ANALYSIS_OUTPUT_FORMATTING.md`, `ALL_SERVICE_LINE_ASSESSMENTS.md`, `PDF_EXPORT_FUNCTIONALITY.md`, `UNIFIED_UPLOAD_CHECK.md`.
- **365 / Goal Alignment:** `365-ALIGNMENT-SYSTEM-OVERVIEW.md`, `365-NARRATIVE-ELEVATION-DESIGN.md`, `365_ALIGNMENT_SYSTEM_OVERVIEW.md`, `ROADMAP_TO_10_OUT_OF_10.md`, `STAGED_ROADMAP_ARCHITECTURE.md`.
- **Benchmarking:** `BENCHMARKING_AND_HVA_QUESTIONNAIRE.md`, `BENCHMARKING_HIDDEN_VALUE_DISCOVERY.md`, `BENCHMARKING_OPPORTUNITY_ANALYSIS.md`, `BENCHMARKING_SERVICE_LINE_SUMMARY.md`.
- **Discovery:** `DISCOVERY_ANALYSIS_REFINEMENT.md`, `DISCOVERY_AND_ANALYSIS_ARCHITECTURE.md`, `DISCOVERY_ASSESSMENT_OVERVIEW.md`, `DISCOVERY_ASSESSMENT_SYSTEM.md`, `DISCOVERY_DATA_MAP.md`, `DISCOVERY_LLM_OVERVIEW.md`, `DISCOVERY_OPPORTUNITY_IMPLEMENTATION.md`, `DISCOVERY_QUESTIONS.md`, `DISCOVERY_REPORT_PDF_AND_PORTAL_VIEWER.md`, `DISCOVERY_THREE_PHASE_IMPLEMENTATION_GUIDE.md`, `SERVICE_LINES_ARCHITECTURE_DISCOVERY.md`, `SERVICE_LINE_DISCOVERY_MAPPING.md`.
- **Systems Audit:** `SYSTEMS_AUDIT_ASSESSMENT_QUESTIONS.md`.
- **Ad-hoc SQL / diagnostic snippets inside `docs/`:** `DIAGNOSTIC_SA_REPORT_CHECK.sql`, `FIX_BM_ENGAGEMENT_STATUS.sql`, `FIX_BM_ENGAGEMENT_STATUS_QUICK.sql`, `FIX_SA_REPORT_APPROVAL.sql`, `add_existing_clients_to_discovery.sql`, `add_goal_alignment_members_to_discovery.sql`, `claude_partridge_report_enrichment_2026-02.sql`, `option_c_hybrid_opportunity_surfacing.sql`, `option_c_opportunity_surfacing.sql`, `sql_discovery_financial_debug_simon.sql`.
- **Specs:** `docs/specs/accounts-upload-feature.md`.

### 6.3 Other docs

- `database/SCHEMA_COMPARISON.md` — Oracle Method Portal vs 365 portal table counts.
- `scripts/MA_V2_DIAGNOSTIC.md` — diagnostic script notes.
- `supabase/functions/README-DEPLOY.md` — edge function deploy notes.
- `supabase/functions/_shared/ANTI_AI_SLOP_STYLE_GUIDE.md` — prompt style ruleset.
- `apps/client-portal/{dist,public}/logos/README.md` — logo asset notes.
- Seven analysis-folder `TORSOR_PRACTICE_PLATFORM_MASTER.md` / `*_SYSTEM_SUMMARY.md` mirrors maintained by the `sync-*.sh` scripts.

---

## 7. Data model overview

### 7.1 Identity

- `practices` — tenant-level record.
- `practice_members` — unified table for BOTH staff and clients, differentiated by `member_type ∈ {team, client, advisor}`. Columns added over time include `client_company`, `client_industry`, `client_stage`, `program_enrolled_at`, `program_status`, `assigned_advisor_id`, `last_portal_login`, `settings JSONB`, `user_id` (FK to `auth.users`), plus an indexed `role` column.
- `client_invitations` — invitation tokens + acceptance state.
- Supabase `auth.users` is the authentication source.
- `delivery_teams`, `team_member_assignments`, `service_roles`, `service_role_skills` — team resourcing layer.

### 7.2 Service-line table families

- **Discovery:** `discovery_engagements`, `discovery_reports`, `discovery_uploaded_documents`, `discovery_context_notes`, `discovery_patterns`, `discovery_service_triggers`, `discovery_analysis_comments`, `discovery_opportunities`, `destination_discovery`, `practice_learning_library`, `learning_application_log`, `client_financial_context`, `client_operational_context`, `client_pattern_analysis`.
- **Benchmarking:** `bm_engagements`, `bm_engagement_services`, `bm_assessment_responses`, `bm_reports`, `bm_metric_comparisons`, `bm_client_scenarios`, `bm_tier_config`, `industries`, `industry_categories`, `industry_requests`, `benchmark_metrics`, `benchmark_data`, `benchmark_sources`, `benchmark_metric_sources`, `benchmark_refresh_log`, `benchmark_search_log`, `benchmark_manual_queue`, `benchmarking_report_templates`.
- **Business Intelligence / Management Accounts:** `bi_engagements`, `bi_periods`, `bi_documents`, `bi_financial_data`, `bi_kpi_definitions`, `bi_kpi_values`, `bi_kpi_alerts`, `bi_insights`, `bi_cash_forecasts`, `bi_cash_forecast_periods`, `bi_cash_flow_items`, `bi_scenarios`, `bi_client_profitability`, `bi_watch_list`, `bi_report_config`, `bi_budgets`, `bi_period_comparisons`, `bi_generated_reports`, `bi_report_schedules`, `bi_scheduled_report_history`, `bi_notification_preferences`; plus the parallel legacy `ma_*` family (engagements, periods, documents, financial_data, snapshots, extracted_financials, monthly_insights, insights, insight_feedback, watch_list, cash_forecasts/periods, scenarios, scenario_definitions, client_profitability, report_config, chart_data, KPI definitions/selections/tracking/recommendations, assessment_reports, assessment_responses, uploaded_documents, trend_data, known_commitments, optimisations, period_comparisons, true_cash_calculations, industry_benchmarks, client_profile, precall_gaps, talking_points, presentation_interactions, tier_definitions).
- **Systems Audit:** `sa_engagements`, `sa_discovery_responses`, `sa_uploaded_documents`, `sa_context_notes`, `sa_system_categories`, `sa_system_inventory`, `sa_process_chains`, `sa_process_deep_dives`, `sa_findings`, `sa_recommendations`, `sa_audit_reports`, `sa_engagement_gaps`, `sa_tech_products`, `sa_tech_integrations`, `sa_tech_migration_paths`, `sa_middleware_capabilities`, `sa_auto_discovery_log`, `sa_staff_members`, `sa_staff_interviews`, `sa_report_jobs`.
- **Goal Alignment / Roadmap:** `client_assessments`, `client_roadmaps`, `roadmap_stages`, `generation_queue`, `generation_feedback`, `client_tasks`, `client_chat_threads`, `client_chat_messages`, `client_appointments`, `client_activity_log`, `sprint_templates`, `weekly_checkins`, `quarterly_life_checks`, `life_pulse_entries`, `life_alignment_scores`, `client_progress_snapshots`, `client_wins`.

### 7.3 Cross-cutting tables

- **Service registry + catalogue:** `services`, `service_concepts`, `service_creation_requests`, `service_catalogue`, `service_tiers`, `service_pricing`, `service_pricing_tiers`, `service_lines`, `client_service_lines`, `service_line_assessments`, `service_line_metadata`, `service_line_blueprints`, `service_timing_rules`, `service_advisory_triggers`, `service_contraindications`, `service_value_calculations`, `service_narrative_templates`, `advisory_overselling_rules`, `service_skill_requirements`, `service_opportunity_triggers`, `service_workflow_phases`, `service_phase_activities`, `service_activity_skills`, `service_alternatives`, `service_roles`, `service_role_skills`, `service_scoring_weights`, `issue_service_mappings`, `audit_advisory_insights`.
- **Client context:** `client_context`, `client_context_notes`, `client_opportunities`, `client_financial_data`, `client_financial_data_audit`, `client_accounts_uploads`, `client_document_extractions`, `client_reports`, `client_tasks`, `client_scenarios`, `client_type_classification` (columns), `client_owner_assignment` (columns).
- **Team & skills:** `skills`, `skill_assessments`, `service_line_interests`, `cpd_records`, `cpd_targets`, `training_plans`, `training_modules`, `personality_assessments`, `belbin_assessments`, `eq_assessments`, `conflict_style_assessments`, `motivational_drivers`, `working_preferences`, `learning_preferences`, `hva_assessments`, `delivery_teams`, `team_member_assignments`, `phase_activities`, `activity_skill_mappings`, `team_phase_assignments`, `member_capacity`, `service_demand`.
- **Documents + parsing:** `document_parse_queue`, `document_embeddings`, `discovery_uploaded_documents`, `sa_uploaded_documents`, `ma_uploaded_documents`, `ma_documents`, `bi_documents`, plus storage buckets.
- **Assessment questions engine:** `assessment_questions`, `assessment_question_history`, `assessment_patterns`.
- **LLM cost / caching:** `llm_execution_history`, `llm_response_cache`, `llm_usage_log`, `rate_limits`.
- **Audit / knowledge:** `audit_log` (time-range partitioned), `audit_log_*` partitions, `ai_corrections`, `knowledge_base`.
- **Enrollment + invites:** `client_invitations`, `enrollment_batches`, `enrollment_entries`.
- **Report job queue:** `report_jobs`, `sa_report_jobs`.

### 7.4 Key relationships (observed)

- `practices (1) ──< practice_members (1)` — a practice has many members (team, client, advisor).
- `practice_members (client) (1) ──< *_engagements (bm/bi/ma/sa/discovery)` — one engagement per service per client.
- `*_engagements (1) ──< *_reports / *_periods / *_responses` — engagement owns reports / periods / responses.
- `client_assessments (1) ──< client_roadmaps ──< roadmap_stages ──< client_tasks` — assessment → roadmap → stage → task.
- `services` / `service_catalogue` / `service_tiers` drive the canonical service registry consumed by both edge functions (`_shared/service-registry.ts`) and three client-side mirrors.
- `discovery_reports` feeds `bm_engagements` / `sa_engagements` / roadmap generation via `discovery_service_triggers` + `discovery_opportunities`.
- RLS is applied per service family, with `engagement_share` concept used for shareable BM reports (`20260411120000_bm_reports_rls_engagement_share.sql`).

---

## 8. Observations and patterns (neutral)

1. **Edge function size distribution is extreme.** 90 functions span from 88 lines (`reset-bm-report`) to 8,785 lines (`generate-discovery-analysis`). The top 20 functions account for most of the 91,700-line total.
2. **Most generator functions follow a consistent shape.** Create a Supabase client with service-role key → fetch engagement/context rows → build a prompt (often via `_shared/context-enrichment`) → call OpenRouter (Claude Sonnet 4.5 default) → parse JSON → write result rows → optionally trigger next function via HTTP `POST` to `${SUPABASE_URL}/functions/v1/…`.
3. **Three frontend apps coexist.**
   - `src/` — legacy staff admin, still the primary staff surface (15 routes, lazy-loaded).
   - `apps/platform/` — smaller, newer staff app (6 routes), with its own AuthContext and Supabase singleton; `vite.config.ts` comment "Platform app will be migrated here from src/".
   - `apps/client-portal/` — client-facing app, the largest of the three in terms of pages and components.
4. **`service-registry` exists in at least three copies.** `supabase/functions/_shared/service-registry.ts`, `src/lib/service-registry.ts`, `apps/client-portal/src/lib/service-registry.ts`. A header comment in the shared copy says "Pass 2 and Pass 3 use local copies … keep those in sync" — so there appear to be 4–5 copies total.
5. **`BM` / `BI` / `MA` naming overlap.** The Management Accounts service was renamed to Business Intelligence (`20260122_rename_ma_to_bi.sql`). Both `ma_*` and `bi_*` families still exist. Routes in `apps/client-portal/src/App.tsx` redirect `/service/management_accounts/*` → `/service/business_intelligence/*`.
6. **`365` vs `Goal Alignment` naming overlap.** Same pattern: `20260122_rename_365_to_goal_alignment.sql` renamed the service; documents in `docs/` and at root use both names.
7. **Nine services in registry, five inactive.** Only Business Intelligence, Benchmarking, Systems Audit, and Goal Alignment have `isActive: true`. Business Advisory, Automation, Fractional CFO, Fractional COO, and Combined Advisory are registered but inactive and have no implementation beyond registry entries.
8. **Discovery is the de-facto "front door" for everything else.** Many migrations prefix Discovery data flowing into other services (e.g. `add_existing_clients_to_discovery.sql`, `add_goal_alignment_members_to_discovery.sql`, `20260224_hide_discovery_in_portal.sql`).
9. **Two auth models coexist in the client portal.** `AuthContext` supports both `signIn` (email only — magic-link style) and `signInWithPassword`. The staff platform app only uses `signInWithPassword`.
10. **A large amount of RLS iteration.** ~30+ migrations are named `*_fix_*_rls*.sql` or `*_rls_*.sql`, suggesting per-row security has been tuned repeatedly across service lines.
11. **Heavy reliance on JSONB.** `responses`, `settings`, `metadata`, and extraction outputs are frequently stored as JSONB rather than normalised — explicit design choice called out in `database/SCHEMA_COMPARISON.md` ("JSONB for flexible data").
12. **LLM model references are hard-coded across edge functions.** Sonnet 4.5 appears ~23×, Sonnet 3.5 ~6×, Sonnet 4 ~5×, Haiku ~3×, Opus 4 ~2×, Opus 4.5 ~2×, plus `gpt-4o-mini` ~2×, `text-embedding-3-small` ~1×, and `perplexity/sonar-pro` ~1×. `packages/llm/router.ts` defines a tiered abstraction but is not used by every edge function.
13. **Anti-AI-slop writing ruleset is centralised.** `supabase/functions/_shared/writing-style.ts` + `ANTI_AI_SLOP_STYLE_GUIDE.md` are imported into many generator prompts.
14. **Background work has two execution paths.** Edge functions for fast jobs; `sa-report-worker/` Docker container (ref. `sa_report_jobs` + `20260222000003_sa_railway_worker_and_custom_chains.sql`) for long-running SA reports.
15. **`scripts/` doubles as a patch archive.** 85 files include both one-off SQL patches, diagnostic JS snippets, and the seven `sync-*.sh` scripts that maintain the read-only analysis folders.
16. **Seven "analysis" folders mirror live code.** Roughly 27 MB of `*-COPY.ts` / `*-copy.ts` mirrors under `benchmarking / discovery / goal alignment / systems audit / team cpd skills / ui ux analysis` + `benchmarking assessment analysis flat`. Each has an associated `.cursor/rules/*-readonly.mdc` entry and a `sync-*.sh` script.
17. **`.bak` and `.disk_copy` files are committed.** e.g. `src/pages/admin/ClientServicesPage.tsx.bak`, `apps/client-portal/src/pages/services/SAReportPage.tsx.bak`, `…SAReportPage.tsx.disk_copy`.
18. **No automated test infrastructure was observed.** No `__tests__/`, `*.test.ts(x)`, `vitest.config`, `jest.config`, or CI workflow files under this folder. `eslint.config.js` is present and `package.json` has `lint` + `typecheck` scripts.
19. **Database schema evolution is documented twice.** `database/migrations/001_365_client_portal_schema.sql` (original clean schema) and `scripts/CONSOLIDATED_SCHEMA.sql` (a consolidated view) both describe the schema, and `supabase/migrations/` contains the authoritative chronology from 2025-12-12 onward.
20. **`dist/` is committed.** The `dist/` folder at repo root is part of the working tree (not gitignored at this level in the `.gitignore` snippet observed; the top-level `.gitignore` does include `dist`, but historical builds may still be committed).
21. **TypeScript type definitions are split across three locations.** `src/types/`, `apps/platform/src/types/`, and `packages/shared/src/types/`, plus inline types inside individual edge functions and hooks.

---

## 9. Questions and unknowns

Items this audit could not fully resolve from the code alone:

1. **`apps/platform` purpose.** Its `vite.config.ts` contains the comment *"Platform app will be migrated here from src/"*. Whether this represents an active migration, an abandoned rewrite, or a parallel experiment is unclear from the code; both surfaces ship.
2. **`clients` table.** Frontend hooks include `from('clients')` calls, but no `CREATE TABLE clients` was observed in `supabase/migrations/` or `database/migrations/`. It may be a view over `practice_members WHERE member_type='client'`, but this was not verified.
3. **`users` and `profiles` tables.** `from('users')` and `from('profiles')` are referenced in some hooks but the schema indicates auth users live in `auth.users` and the app uses `practice_members` as the profile. These references may be dead code or may depend on views not present in migrations.
4. **`documents` generic table.** Referenced from frontend `.from('documents')` but only service-prefixed upload tables exist in migrations.
5. **`industry_benchmarks` vs `benchmark_data`.** Frontend calls `.from('industry_benchmarks')` and `.from('ma_industry_benchmarks')`; migrations create `benchmark_data` and `ma_industry_benchmarks`. Relationship not verified.
6. **`avatars` and `bucket` table references.** Hooks call `.from('avatars')` and `.from('bucket')`; unclear if these are Supabase Storage views or custom tables.
7. **`hva_assessments` creation.** Table is queried from the frontend but no `CREATE TABLE hva_assessments` appears in migrations inspected; it may be created by an earlier pre-migrations script in `scripts/`.
8. **Fit assessment tables.** `fit-assessment` + `generate-fit-profile` edge functions exist (959 + 307 lines), but no `fit_*` tables were identified.
9. **Where the "Outreach tool" lives.** `OUTREACH_TOOL_ARCHITECTURE.md` at root describes an outreach capability, but no obvious dedicated edge functions or tables were found beyond invitation/enrolment.
10. **`packages/ui` contents.** `packages/ui/package.json` exists but no `src/` directory was observed.
11. **`EMERGENCY_RESTORE_PASS1_DATA.sql`.** Exists at the tail of the `supabase/migrations/` listing with no timestamp prefix; whether this is active or purely archival is unclear from the filename alone.
12. **`sa-report-worker/src/lib/types.ts` is the only worker source file present.** There is no `src/index.ts` in the worker, yet the Dockerfile references `dist/index.js`. Either an index file is generated or missing from the working copy; not determined here.
13. **Multiple `service-registry.ts` mirrors.** The shared header says Pass 2 and Pass 3 have local copies "in their function folders" for Supabase bundling; not every copy was verified.
14. **`database/migrations/002_add_roadmap_status.sql` vs. `supabase/migrations/`.** Two migration authorities exist. Whether `database/migrations/` was fully superseded by `supabase/migrations/` or is still applied was not conclusively determined.
15. **`cleanup_ben_reports.sql`, `diagnose_ben.sql`, `diagnose_report_sharing.sql` at repo root.** One-off scripts at the platform root (outside `scripts/`) — unclear whether intentional or drift.
16. **`test-client-support`, `test-mode-panel`.** A "test mode" path exists (`src/pages/admin/clients/TestModePanel.tsx`, `20260120_test_client_support.sql`); interaction with production client data was not traced.
17. **Two different top-level admin apps target the same `/clients` route, but build to different `dist/`s.** Which domain routes to which app is determined externally to this codebase.

---

*End of inventory.*
