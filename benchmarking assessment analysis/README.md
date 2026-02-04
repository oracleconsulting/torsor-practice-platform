# Benchmarking Assessment Analysis

> ⚠️ **DO NOT EDIT FILES IN THIS FOLDER**
> 
> These are COPIES of the source files for analysis purposes.
> Edit the original source files, not these copies.

---

## Purpose

This folder contains a **COMPLETE** analysis package of the Benchmarking Service:
- ✅ All backend edge functions
- ✅ All frontend components (admin + client)
- ✅ Database migrations (table schemas)
- ✅ Types, config, and lib files
- ✅ Documentation

---

## Folder Structure

```
benchmarking assessment analysis/
├── 📚 Documentation
│   ├── README.md                              (this file)
│   ├── BENCHMARKING_SYSTEM_ARCHITECTURE.md    ← START HERE
│   ├── COMPONENT_SUMMARIES.md
│   ├── MIGRATIONS_INDEX.md
│   └── RELATED_DOCUMENTATION.md
│
├── 📋 Doc Copies
│   ├── BENCHMARKING_SERVICE_LINE_SUMMARY-COPY.md
│   ├── BENCHMARKING_AND_HVA_QUESTIONNAIRE-COPY.md
│   └── BENCHMARKING_HIDDEN_VALUE_DISCOVERY-COPY.md
│
├── ⚡ Edge Functions (Backend)
│   ├── generate-bm-report-pass1-COPY.ts       (4891 lines)
│   ├── generate-bm-report-pass2-COPY.ts       (540 lines)
│   ├── generate-bm-opportunities-COPY.ts      (2016 lines)
│   ├── fetch-industry-benchmarks-COPY.ts
│   ├── regenerate-bm-report-COPY.ts
│   └── save-bm-supplementary-data-COPY.ts
│
├── 🖥️ components/
│   ├── admin/                                  ← ADMIN VIEW
│   │   ├── BenchmarkingAdminView-COPY.tsx     (main admin component)
│   │   ├── DataCollectionPanel-COPY.tsx
│   │   ├── OpportunityDashboard-COPY.tsx
│   │   ├── OpportunityPanel-COPY.tsx
│   │   ├── ValueAnalysisPanel-COPY.tsx
│   │   ├── ServicePathwayPanel-COPY.tsx
│   │   ├── AccountsUploadPanel-COPY.tsx
│   │   ├── ConversationScript-COPY.tsx
│   │   └── NextStepsPanel-COPY.tsx
│   │
│   ├── client/                                 ← CLIENT REPORT
│   │   ├── BenchmarkingClientReport-COPY.tsx  (main client component)
│   │   ├── HeroSection-COPY.tsx
│   │   ├── MetricComparisonCard-COPY.tsx
│   │   ├── NarrativeSection-COPY.tsx
│   │   ├── ValueBridgeSection-COPY.tsx
│   │   ├── ScenarioPlanningSection-COPY.tsx
│   │   └── ServiceRecommendationsSection-COPY.tsx
│   │
│   └── shared/                                 ← ENHANCED (ROLLS ROYCE)
│       ├── CalculationBreakdown-COPY.tsx
│       ├── SurplusCashBreakdown-COPY.tsx
│       ├── EnhancedSuppressorCard-COPY.tsx
│       ├── ExitReadinessBreakdown-COPY.tsx
│       └── TwoPathsSection-COPY.tsx
│
├── 📄 pages/
│   └── ClientServicesPage-COPY.tsx            ← ADMIN HOST PAGE
│
├── 🗄️ migrations/                              ← DATABASE SCHEMAS
│   ├── 20251222_benchmarking_complete-COPY.sql
│   ├── 20260129_bm_balance_sheet_trends-COPY.sql
│   ├── 20260130_bm_surplus_cash_founder_risk-COPY.sql
│   ├── 20260201_add_value_analysis_column-COPY.sql
│   ├── 20260201_create_client_opportunities_table-COPY.sql
│   ├── 20260202_value_suppressors_overhaul-COPY.sql
│   └── 20260203_opportunity_calculations-COPY.sql
│
├── 📦 Types & Config
│   ├── benchmarking-types-COPY.ts
│   └── benchmarking-discovery-COPY.ts
│
└── 🔧 Lib Files
    ├── founder-risk-calculator-COPY.ts
    ├── industry-mapper-COPY.ts
    ├── scenario-calculator-COPY.ts
    └── export-benchmarking-data-COPY.ts
```

---

## File Counts

| Category | Count |
|----------|-------|
| Documentation | 8 |
| Edge Functions | 6 |
| Admin Components | 9 |
| Client Components | 7 |
| Shared Components | 5 |
| Pages | 1 |
| Migrations | 7 |
| Types/Config | 2 |
| Lib Files | 4 |
| **TOTAL** | **49 files** |

---

## Quick Reference

### Admin Flow
```
ClientServicesPage.tsx
  └── BenchmarkingAdminView.tsx
        ├── DataCollectionPanel (collect metrics)
        ├── OpportunityDashboard (view opportunities)
        ├── ValueAnalysisPanel (value bridge)
        ├── ServicePathwayPanel (recommendations)
        └── AccountsUploadPanel (upload PDFs)
```

### Client Flow
```
BenchmarkingClientReport.tsx
  ├── HeroSection (headline, percentile)
  ├── MetricComparisonCard × N (benchmarks)
  ├── NarrativeSection (AI narratives)
  ├── ValueBridgeSection (value analysis)
  ├── ScenarioPlanningSection (what-if)
  └── ServiceRecommendationsSection (next steps)
```

### Backend Flow
```
Pass 1 (Sonnet)     → Data analysis, metrics, calculations
Pass 2 (Opus)       → Narrative writing
Pass 3 (Opus 4.5)   → Opportunity identification
```

---

## Key Database Tables

| Table | Purpose |
|-------|---------|
| `bm_engagements` | Links client to benchmarking service |
| `bm_assessment_responses` | Client questionnaire answers |
| `bm_reports` | Generated report (all data) |
| `bm_metric_comparisons` | Individual metric benchmarks |
| `client_opportunities` | AI-identified opportunities |
| `services` | Service catalogue |
| `service_concepts` | New service ideas |
| `client_context_notes` | Admin notes from calls |

---

## For Claude Project Setup

### Essential (upload first)
1. `BENCHMARKING_SYSTEM_ARCHITECTURE.md` - System overview
2. `benchmarking-types-COPY.ts` - Type definitions
3. `generate-bm-report-pass1-COPY.ts` - Core analysis

### Frontend Focus
4. `components/admin/BenchmarkingAdminView-COPY.tsx`
5. `components/client/BenchmarkingClientReport-COPY.tsx`
6. `pages/ClientServicesPage-COPY.tsx`

### Backend Focus
7. `generate-bm-opportunities-COPY.ts`
8. `generate-bm-report-pass2-COPY.ts`

### Database Focus
9. `migrations/20251222_benchmarking_complete-COPY.sql`
10. `migrations/20260201_create_client_opportunities_table-COPY.sql`

---

*Last updated: 2026-02-04*
*Total files: 49*
*Total size: ~1.5MB*
