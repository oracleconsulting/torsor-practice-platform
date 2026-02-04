# Benchmarking Assessment Analysis

> ⚠️ **DO NOT EDIT FILES IN THIS FOLDER**
> 
> These are COPIES of the source files for analysis purposes.
> Edit the original source files, not these copies.

---

## Purpose

This folder contains a comprehensive analysis package of the Benchmarking Service for:
1. **Claude Project setup** - All context needed for AI-assisted development
2. **Architecture reference** - Understanding how the system works
3. **Debugging** - Quick access to key code without navigation

---

## File Index

### 📚 Documentation

| File | Description |
|------|-------------|
| `BENCHMARKING_SYSTEM_ARCHITECTURE.md` | **START HERE** - Complete system overview |
| `COMPONENT_SUMMARIES.md` | Frontend component descriptions |
| `MIGRATIONS_INDEX.md` | Database schema evolution |
| `RELATED_DOCUMENTATION.md` | Links to other docs and systems |

### 📋 Documentation Copies

| File | Source |
|------|--------|
| `BENCHMARKING_SERVICE_LINE_SUMMARY-COPY.md` | `docs/` |
| `BENCHMARKING_AND_HVA_QUESTIONNAIRE-COPY.md` | `docs/` |
| `BENCHMARKING_HIDDEN_VALUE_DISCOVERY-COPY.md` | `docs/` |

### ⚡ Edge Functions (Supabase)

| File | Lines | Purpose |
|------|-------|---------|
| `generate-bm-report-pass1-COPY.ts` | 4891 | Data analysis (Sonnet) |
| `generate-bm-report-pass2-COPY.ts` | 540 | Narrative writing (Opus) |
| `generate-bm-opportunities-COPY.ts` | 2016 | Opportunity analysis (Opus 4.5) |
| `fetch-industry-benchmarks-COPY.ts` | 638 | Perplexity benchmark search |
| `regenerate-bm-report-COPY.ts` | 303 | Re-run analysis |
| `save-bm-supplementary-data-COPY.ts` | 219 | Save admin-collected data |

### 📦 Types & Config

| File | Purpose |
|------|---------|
| `benchmarking-types-COPY.ts` | TypeScript interfaces |
| `benchmarking-discovery-COPY.ts` | Assessment configuration |

### 🔧 Lib Files

| File | Purpose |
|------|---------|
| `founder-risk-calculator-COPY.ts` | Founder risk scoring algorithm |
| `industry-mapper-COPY.ts` | SIC code → industry code mapping |
| `scenario-calculator-COPY.ts` | Client-side what-if calculations |
| `export-benchmarking-data-COPY.ts` | Debug utility |

---

## Quick Links to Source Files

### Edge Functions
```
supabase/functions/generate-bm-report-pass1/index.ts
supabase/functions/generate-bm-report-pass2/index.ts
supabase/functions/generate-bm-opportunities/index.ts
supabase/functions/fetch-industry-benchmarks/index.ts
supabase/functions/regenerate-bm-report/index.ts
supabase/functions/save-bm-supplementary-data/index.ts
```

### Components
```
src/components/benchmarking/admin/BenchmarkingAdminView.tsx
src/components/benchmarking/client/BenchmarkingClientReport.tsx
```

### Types & Config
```
src/types/benchmarking.ts
src/config/assessments/benchmarking-discovery.ts
```

### Lib Files
```
src/lib/services/benchmarking/founder-risk-calculator.ts
src/lib/services/benchmarking/industry-mapper.ts
src/lib/scenario-calculator.ts
```

---

## System Summary

### Data Flow
```
Assessment → Pass 1 → Pass 2 → Pass 3 → Report
    ↓           ↓         ↓         ↓
Responses   Analysis  Narrative  Opportunities
```

### Key Tables
- `bm_engagements` - Engagement tracking
- `bm_assessment_responses` - Client answers
- `bm_reports` - Generated reports
- `client_opportunities` - Identified opportunities
- `services` - Service catalogue

### LLM Usage
- **Pass 1**: Claude Sonnet - Fast data analysis
- **Pass 2**: Claude Opus - Narrative writing
- **Pass 3**: Claude Opus 4.5 - Opportunity identification

---

## For Claude Project Setup

Upload these files to your Claude Project:
1. `BENCHMARKING_SYSTEM_ARCHITECTURE.md` (required)
2. `COMPONENT_SUMMARIES.md` (required)
3. `generate-bm-report-pass1-COPY.ts` (main logic)
4. `generate-bm-opportunities-COPY.ts` (opportunity logic)
5. `benchmarking-types-COPY.ts` (type definitions)

Optional for deep dives:
- Other edge function copies
- Documentation copies
- Lib file copies

---

*Last updated: 2026-02-04*
*Total files: 21*
*Total size: ~550KB*
