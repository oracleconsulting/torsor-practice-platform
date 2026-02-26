# Discovery Assessment Analysis - Complete Backup (COPY REFERENCE)

**Created:** February 2026 | **Last synced:** 2026-02-10  
**Purpose:** Direct copy of live Discovery files for separate assessment. **Do not edit these files** during live work — edit the live paths and run the sync script to refresh. See `COPY_NOTICE.txt` and `DISCOVERY_SYSTEM_LIVE_SUMMARY.md`.

**To sync after live changes (from repo root):** `./scripts/sync-discovery-assessment-copies.sh`

---

## Quick Navigation

| Document | Purpose |
|----------|---------|
| [DISCOVERY_SYSTEM_COMPLETE_ARCHITECTURE.md](./DISCOVERY_SYSTEM_COMPLETE_ARCHITECTURE.md) | **START HERE** - Complete architecture reference |
| [DISCOVERY_SYSTEM_LIVE_SUMMARY.md](./DISCOVERY_SYSTEM_LIVE_SUMMARY.md) | Live paths → flat COPY mapping, financial data priority, migrations |
| [MIGRATIONS_INDEX.md](./MIGRATIONS_INDEX.md) | Ordered list of discovery + accounts migrations |
| [SERVICE_LINE_FILES_REFERENCE.md](./SERVICE_LINE_FILES_REFERENCE.md) | **Service lines** - Creation, allocation, pricing (migrations, backend, frontend) |
| [docs-DISCOVERY_ASSESSMENT_SYSTEM.md](./docs-DISCOVERY_ASSESSMENT_SYSTEM.md) | Assessment structure and questions |
| [docs-DISCOVERY_AND_ANALYSIS_ARCHITECTURE.md](./docs-DISCOVERY_AND_ANALYSIS_ARCHITECTURE.md) | Data flow and analysis architecture |
| [docs-DISCOVERY_ASSESSMENT_OVERVIEW.md](./docs-DISCOVERY_ASSESSMENT_OVERVIEW.md) | Service lines and skills mapping |
| [BENCHMARKING_SERVICE_LINE_SUMMARY-COPY.md](./BENCHMARKING_SERVICE_LINE_SUMMARY-COPY.md) | Benchmarking service line (copy from benchmarking assessment analysis) |
| [GOAL_ALIGNMENT_SUMMARY-COPY.md](./GOAL_ALIGNMENT_SUMMARY-COPY.md) | Goal Alignment architecture & workflows (copy from goal alignment analysis) |
| [BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md](./BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md) | Business Intelligence service: tiers, Discovery→popup mapping |

---

## File Categories

### 📋 Architecture & Documentation (10 files)

| File | Description |
|------|-------------|
| `DISCOVERY_SYSTEM_COMPLETE_ARCHITECTURE.md` | Complete architecture reference (created Feb 2026) |
| `DISCOVERY_SYSTEM_LIVE_SUMMARY.md` | Live paths → COPY mapping, financial data priority, migrations table |
| `MIGRATIONS_INDEX.md` | Ordered discovery + accounts migrations index |
| `docs-DISCOVERY_ASSESSMENT_SYSTEM.md` | Assessment structure, 40 questions |
| `docs-DISCOVERY_AND_ANALYSIS_ARCHITECTURE.md` | Data flow, Pass 1/Pass 2 architecture |
| `docs-DISCOVERY_ASSESSMENT_OVERVIEW.md` | Service lines, skills by service |
| `docs-DISCOVERY_REPORT_PDF_AND_PORTAL_VIEWER.md` | PDF export and portal viewing |
| `docs-DISCOVERY_QUESTIONS.md` | Question reference |
| `docs-DISCOVERY_LLM_OVERVIEW.md` | LLM integration details |
| `docs-DISCOVERY_ANALYSIS_REFINEMENT.md` | Refinement history |
| `SERVICE_LINE_FILES_REFERENCE.md` | Service line creation, allocation, pricing (all files + summaries) |
| `BENCHMARKING_SERVICE_LINE_SUMMARY-COPY.md` | Benchmarking service line summary (copy from benchmarking assessment analysis) |
| `GOAL_ALIGNMENT_SUMMARY-COPY.md` | Goal Alignment architecture & workflows (copy from goal alignment analysis) |
| `BUSINESS_INTELLIGENCE_SERVICE_LINE_SUMMARY.md` | Business Intelligence: catalogue code, tiers, Discovery popup mapping |

### ⚡ Edge Functions - Main (9 files)

| File | Edge Function | Purpose |
|------|--------------|---------|
| `generate-discovery-report-pass1-copy.ts` | generate-discovery-report-pass1 | **Pass 1**: Calculations (112KB) |
| `generate-discovery-report-pass2-copy.ts` | generate-discovery-report-pass2 | **Pass 2**: Narrative (130KB) |
| `generate-discovery-analysis-copy.ts` | generate-discovery-analysis | Legacy single-pass (380KB) |
| `generate-discovery-pdf-copy.ts` | generate-discovery-pdf | PDF generation |
| `generate-discovery-responses-pdf-copy.ts` | generate-discovery-responses-pdf | Raw responses PDF |
| `prepare-discovery-data-copy.ts` | prepare-discovery-data | Stage 1 data gathering |
| `start-discovery-report-copy.ts` | start-discovery-report | Report orchestration |
| `generate-discovery-report-legacy-copy.ts` | generate-discovery-report | Legacy report |
| `generate-discovery-opportunities-copy.ts` | generate-discovery-opportunities | Service opportunities |

### ⚡ Edge Functions - Supporting (12 files)

| File | Edge Function | Purpose |
|------|--------------|---------|
| `detect-assessment-patterns-copy.ts` | detect-assessment-patterns | AI pattern detection |
| `generate-service-recommendations-copy.ts` | generate-service-recommendations | Rule-based scoring |
| `advisory-deep-dive-copy.ts` | advisory-deep-dive | Secondary evaluation |
| `process-documents-copy.ts` | process-documents | Document processing |
| `process-client-context-copy.ts` | process-client-context | Context storage |
| `parse-document-copy.ts` | parse-document | Text extraction |
| `upload-client-accounts-copy.ts` | upload-client-accounts | Account uploads |
| `process-accounts-upload-copy.ts` | process-accounts-upload | Account parsing |
| `accept-invitation-copy.ts` | accept-invitation | Client onboarding |
| `client-signup-copy.ts` | client-signup | Client signup |
| `send-client-invitation-copy.ts` | send-client-invitation | Invitation emails |
| `generate-value-proposition-copy.ts` | generate-value-proposition | Value props |

### 🧮 Calculators (12 files)

| File | Calculator | Purpose |
|------|-----------|---------|
| `calculators-index-copy.ts` | - | Calculator exports |
| `calculators-orchestrator-copy.ts` | - | Coordinator (21KB) |
| `calculators-integration-copy.ts` | - | Data integration |
| `calculators-valuation-copy.ts` | Valuation | Enterprise value, multiples |
| `calculators-trajectory-copy.ts` | Trajectory | YoY growth, trends |
| `calculators-payroll-copy.ts` | Payroll | Staff costs analysis |
| `calculators-productivity-copy.ts` | Productivity | Revenue per head |
| `calculators-profitability-copy.ts` | Profitability | Margin analysis |
| `calculators-hidden-assets-copy.ts` | Hidden Assets | Property, excess cash |
| `calculators-exit-readiness-copy.ts` | Exit Readiness | 100-point score |
| `calculators-cost-of-inaction-copy.ts` | Cost of Inaction | Annual cost calc |
| `calculators-achievements-copy.ts` | Achievements | Positive reinforcement |

### 📊 Benchmarks (2 files)

| File | Purpose |
|------|---------|
| `benchmarks-index-copy.ts` | Benchmark exports |
| `benchmarks-industry-copy.ts` | Industry comparison data |

### 📝 Types (2 files)

| File | Purpose |
|------|---------|
| `pass1-types-index-copy.ts` | Type exports |
| `pass1-types-output-copy.ts` | Output interfaces |

### 🔧 Shared Utilities (5 files)

| File | Purpose |
|------|---------|
| `shared-writing-style-copy.ts` | LLM writing style guide |
| `shared-service-scorer-copy.ts` | V1 service scoring |
| `shared-service-scorer-v2-copy.ts` | V2 service scoring (48KB) |
| `shared-llm-cache-copy.ts` | LLM response caching |
| `shared-llm-cost-tracker-copy.ts` | LLM cost tracking |

### 🗄️ Migrations (15 files)

| File | Migration | Purpose |
|------|-----------|---------|
| `migrations-20260115_discovery_assessment_v2.sql` | Core | Discovery tables (23KB) |
| `migrations-20260115_discovery_report_system.sql` | Core | Report generation (16KB) |
| `migrations-20260115_discovery_destination_focused.sql` | Core | Destination questions |
| `migrations-20260115_migrate_legacy_discovery.sql` | Core | Legacy data migration |
| `migrations-20260115_discovery_data_completeness.sql` | Core | Data validation |
| `migrations-20260115_fix_discovery_trigger.sql` | Fix | Trigger fixes |
| `migrations-20260123_discovery_learning_system.sql` | Feature | Learning loop (18KB) |
| `migrations-20260125_discovery_7dimension_analysis.sql` | Feature | 7-dimension analysis |
| `migrations-20260129_fix_discovery_reports_client_rls.sql` | Fix | Client portal RLS |
| `migrations-20251223_fix_destination_discovery_duplicates.sql` | Fix | Duplicate prevention |
| `migrations-20260208120000_discovery_three_phase_pipeline.sql` | Feature | Three-phase pipeline |
| `migrations-20260209120000_reset_discovery_pipeline_for_client.sql` | Utility | Reset pipeline |
| `migrations-20260209140000_discovery_data_audit.sql` | Utility | Data audit |
| `migrations-20260210180000_add_staff_costs_client_financial_data.sql` | Feature | Add staff_costs to client_financial_data |
| `migrations-20260210200000_add_directors_operating_profit_financial_data.sql` | Feature | Add directors_remuneration, operating_profit to client_financial_data |

### 🖥️ Frontend - Admin Portal (5 files)

| File | Component | Purpose |
|------|-----------|---------|
| `frontend-admin-DiscoveryAdminModal.tsx` | DiscoveryAdminModal | Admin report view (95KB) |
| `frontend-admin-DiscoveryOpportunityPanel.tsx` | DiscoveryOpportunityPanel | Opportunity management |
| `frontend-admin-AnalysisCommentSystem.tsx` | AnalysisCommentSystem | Internal comments |
| `frontend-admin-TransformationJourney.tsx` | TransformationJourney | Journey visualization |
| `frontend-admin-discovery-index.ts` | - | Component exports |

### 🖥️ Frontend - Client Portal (10 files)

| File | Component | Purpose |
|------|-----------|---------|
| `frontend-client-DiscoveryReportPage.tsx` | DiscoveryReportPage | Full report page (75KB) |
| `frontend-client-DiscoveryReportView.tsx` | DiscoveryReportView | Report display |
| `frontend-client-DestinationDiscoveryPage.tsx` | DestinationDiscoveryPage | Assessment intake |
| `frontend-client-DiscoveryPortalPage.tsx` | DiscoveryPortalPage | Portal landing |
| `frontend-client-DiscoveryDashboardPage.tsx` | DiscoveryDashboardPage | Dashboard |
| `frontend-client-DiscoveryCompletePage.tsx` | DiscoveryCompletePage | Completion page |
| `frontend-client-DiscoveryMetricCard.tsx` | DiscoveryMetricCard | Metric cards |
| `frontend-client-DiscoveryInsightCard.tsx` | DiscoveryInsightCard | Insight cards |
| `frontend-client-TransformationJourney.tsx` | TransformationJourney | Client journey |
| `frontend-client-discovery-index.ts` | - | Component exports |

### ⚙️ Configuration (1 file)

| File | Purpose |
|------|---------|
| `config-benchmarking-discovery.ts` | Discovery questions configuration |

---

## Total Files: 80

| Category | Count |
|----------|-------|
| Documentation | 10 |
| Edge Functions (Main) | 9 |
| Edge Functions (Supporting) | 12 |
| Calculators | 12 |
| Benchmarks | 2 |
| Types | 2 |
| Shared Utilities | 5 |
| Migrations | 15 |
| Frontend - Admin | 5 |
| Frontend - Client | 10 |
| Configuration | 1 |
| **Total** | **79** |

---

## System Summary

### Assessment Flow

```
Client → 40 Questions → Document Upload → Pass 1 (Calc) → Pass 2 (LLM) → Report
```

### Key Architecture Principles

1. **"Calculate Once, Narrate Forever"**: Pass 1 is deterministic, Pass 2 uses exact figures
2. **8-Dimension Analysis**: Valuation, Trajectory, Payroll, Productivity, Profitability, Working Capital, Hidden Assets, Exit Readiness
3. **Service Scoring**: Rule-based triggers + pattern detection multipliers
4. **Emotional Anchors**: Verbatim client quotes for personalization

### LLM Models Used

| Pass | Model | Provider | Cost |
|------|-------|----------|------|
| Pass 1 | None | - | Free |
| Pass 2 | Claude Opus 4.5 | OpenRouter | ~$0.10/report |
| Pattern Detection | Claude Sonnet 4 | OpenRouter | ~$0.02/analysis |

---

## Related Folders

- `benchmarking assessment analysis/` - Similar backup for Benchmarking system
- `docs/` - Original documentation (kept in sync)
- `supabase/functions/` - Live edge functions
- `supabase/migrations/` - Live migrations

---

*This folder is FLAT (no subfolders). Every .ts, .tsx, .sql file here is a COPY; edit only the live source paths.*  
*For a new chat, use the continuation prompt in COPY_NOTICE.txt.*
