# Discovery Assessment System - Complete Architecture Reference

**Created:** February 2026  
**Version:** 3.0 (Complete Reference)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Data Flow Architecture](#2-data-flow-architecture)
3. [Edge Functions](#3-edge-functions)
4. [Database Schema](#4-database-schema)
5. [Migrations Index](#5-migrations-index)
6. [Frontend Components](#6-frontend-components)
7. [Shared Utilities](#7-shared-utilities)
8. [Assessment Questions](#8-assessment-questions)
9. [Service Scoring Logic](#9-service-scoring-logic)
10. [LLM Integration](#10-llm-integration)
11. [File Index](#11-file-index)

---

## 1. System Overview

The Discovery Assessment System is a comprehensive multi-stage pipeline that:

1. **Gathers Client Data**: 40 questions across 2 parts + uploaded financial documents
2. **Performs Financial Analysis**: 8-dimension calculator suite
3. **Generates AI Insights**: Claude-powered narrative generation
4. **Recommends Services**: Rule-based + AI-enhanced service matching
5. **Displays Results**: Admin portal + client portal views

### Key Architectural Principles

- **"Calculate Once, Narrate Forever"**: Pass 1 does deterministic calculations, Pass 2 uses them for narrative
- **Separation of Concerns**: Data preparation → Calculation → LLM → Storage → Display
- **Idempotency**: Re-running any pass produces consistent results
- **Auditability**: All calculations show their working and data sources

---

## 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DISCOVERY ASSESSMENT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │ Part 1: 25 Qs   │─────────┐                                              │
│  │ Destination     │         │                                              │
│  │ Discovery       │         │                                              │
│  └─────────────────┘         │                                              │
│                              ▼                                              │
│  ┌─────────────────┐   ┌──────────────────────┐                            │
│  │ Part 2: 15 Qs   │──▶│ destination_discovery │                            │
│  │ Service         │   │ (responses JSONB)    │                            │
│  │ Diagnostic      │   └──────────┬───────────┘                            │
│  └─────────────────┘              │                                         │
│                                   │                                         │
│  ┌─────────────────┐              │                                         │
│  │ Uploaded Docs   │──────────────┼──▶ client_context                       │
│  │ (PDF/CSV/XLSX)  │              │                                         │
│  └─────────────────┘              │                                         │
│          │                        │                                         │
│          ▼                        │                                         │
│  ┌─────────────────┐              │                                         │
│  │ parse-document  │──────────────┼──▶ client_financial_context             │
│  │ Edge Function   │              │                                         │
│  └─────────────────┘              │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PASS 1: Data Preparation & Calculation            │   │
│  │  Edge Function: generate-discovery-report-pass1                      │   │
│  │  Model: None (pure calculation)                                      │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Calculators:                                                        │   │
│  │  • Valuation (enterprise value, multiples, hidden assets)           │   │
│  │  • Trajectory (YoY growth, trend classification)                    │   │
│  │  • Payroll (staff costs %, benchmark comparison)                    │   │
│  │  • Productivity (revenue per head, excess employees)                │   │
│  │  • Profitability (gross margin, net margin comparison)              │   │
│  │  • Working Capital (debtor days, creditor days, cash cycle)         │   │
│  │  • Hidden Assets (freehold property, excess cash)                   │   │
│  │  • Exit Readiness (100-point score, 6 factors)                      │   │
│  │  • Cost of Inaction (annual cost, component breakdown)              │   │
│  │  • Achievements (positive reinforcement)                            │   │
│  │                                                                      │   │
│  │  Outputs:                                                            │   │
│  │  • Emotional anchors (verbatim quotes)                              │   │
│  │  • Destination clarity score (0-10)                                 │   │
│  │  • Service scores (rule-based)                                      │   │
│  │  • Pre-built phrases for Pass 2                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PASS 2: Narrative Generation                      │   │
│  │  Edge Function: generate-discovery-report-pass2                      │   │
│  │  Model: Claude Opus 4.5 via OpenRouter                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Receives:                                                           │   │
│  │  • All Pass 1 calculations (MANDATORY - must use exact figures)     │   │
│  │  • Emotional anchors and verbatim quotes                            │   │
│  │  • Service scores and recommendations                               │   │
│  │                                                                      │   │
│  │  Generates:                                                          │   │
│  │  • Executive Summary (6 components)                                 │   │
│  │  • Destination Analysis (vision, drivers, goals)                    │   │
│  │  • Gap Analysis (primary gaps, cost of inaction)                    │   │
│  │  • Recommended Investments (services with ROI)                      │   │
│  │  • Investment Summary (totals, payback period)                      │   │
│  │  • Implementation Roadmap (phases, actions)                         │   │
│  │  • Closing Message (personal, empathetic)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│                         discovery_reports table                             │
│                                   │                                         │
│                    ┌──────────────┴──────────────┐                         │
│                    ▼                              ▼                         │
│             Admin Portal                   Client Portal                    │
│             (DiscoveryAdminModal)          (DiscoveryReportPage)           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Edge Functions

### 3.1 Core Discovery Functions

| Function | Purpose | Model | Timeout |
|----------|---------|-------|---------|
| `prepare-discovery-data` | Stage 1: Gather all client data | None | 15-20s |
| `generate-discovery-analysis` | Legacy: Single-stage analysis | Sonnet 4 | 50s |
| `generate-discovery-report-pass1` | Pass 1: Calculations | None | 20s |
| `generate-discovery-report-pass2` | Pass 2: Narrative | Opus 4.5 | 50s |
| `generate-discovery-pdf` | Generate PDF report | None | 10s |
| `generate-discovery-responses-pdf` | Export raw responses | None | 5s |
| `start-discovery-report` | Orchestrate report generation | None | 5s |
| `generate-discovery-opportunities` | Generate service opportunities | Sonnet 4 | 40s |

### 3.2 Supporting Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `parse-document` | Extract text from uploads | Document upload |
| `process-documents` | Process multiple documents | Batch upload |
| `process-accounts-upload` | Parse financial accounts | CSV/PDF upload |
| `detect-assessment-patterns` | AI pattern detection | Pass 1 |
| `generate-service-recommendations` | Rule-based service scoring | Pass 1 |
| `advisory-deep-dive` | Secondary service evaluation | Admin review |
| `process-client-context` | Store context notes | Admin input |

### 3.3 Pass 1 Calculator Module Structure

```
supabase/functions/generate-discovery-report-pass1/
├── index.ts                    # Main orchestrator
├── types/
│   ├── index.ts               # Type exports
│   └── pass1-output.ts        # Output interfaces
├── calculators/
│   ├── index.ts               # Calculator exports
│   ├── orchestrator.ts        # Calculator coordinator
│   ├── integration.ts         # Data integration
│   ├── valuation.ts           # Enterprise value calculation
│   ├── trajectory.ts          # Growth trend analysis
│   ├── payroll.ts             # Staff cost analysis
│   ├── productivity.ts        # Revenue per head
│   ├── profitability.ts       # Margin analysis
│   ├── hidden-assets.ts       # Hidden value detection
│   ├── exit-readiness.ts      # Exit readiness score
│   ├── cost-of-inaction.ts    # Inaction cost calculation
│   └── achievements.ts        # Positive reinforcement
└── benchmarks/
    ├── index.ts               # Benchmark exports
    └── industry-benchmarks.ts # Industry comparison data
```

---

## 4. Database Schema

### 4.1 Core Tables

```sql
-- Assessment Responses
CREATE TABLE destination_discovery (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES practice_members(id),
    practice_id UUID REFERENCES practices(id),
    assessment_type TEXT DEFAULT 'destination_discovery',
    responses JSONB NOT NULL,                    -- 40 questions
    analysis_completed_at TIMESTAMPTZ,
    extracted_anchors JSONB,                     -- Emotional anchors
    recommended_services JSONB,                  -- Service scores
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Reports
CREATE TABLE discovery_reports (
    id UUID PRIMARY KEY,
    engagement_id UUID REFERENCES discovery_engagements(id),
    client_id UUID REFERENCES practice_members(id),
    practice_id UUID REFERENCES practices(id),
    status TEXT DEFAULT 'draft',                 -- draft, generating, generated, shared
    
    -- Pass 1 Data (deterministic calculations)
    pass1_data JSONB,                           -- All calculator outputs
    pass1_completed_at TIMESTAMPTZ,
    
    -- Pass 2 Data (LLM narrative)
    pass2_data JSONB,                           -- Generated narrative
    pass2_completed_at TIMESTAMPTZ,
    
    -- Report Content (flattened for easy access)
    executive_summary JSONB,
    destination_analysis JSONB,
    gap_analysis JSONB,
    recommended_investments JSONB,
    investment_summary JSONB,
    implementation_roadmap JSONB,
    closing_message JSONB,
    
    -- Metadata
    model_used TEXT,
    generation_cost DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Financial Context (from uploads)
CREATE TABLE client_financial_context (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES practice_members(id),
    practice_id UUID REFERENCES practices(id),
    
    -- Core Metrics
    revenue DECIMAL,
    revenue_prior_year DECIMAL,
    gross_profit DECIMAL,
    gross_margin_pct DECIMAL,
    operating_profit DECIMAL,
    operating_margin_pct DECIMAL,
    net_profit DECIMAL,
    net_margin_pct DECIMAL,
    
    -- Balance Sheet
    total_assets DECIMAL,
    total_liabilities DECIMAL,
    net_assets DECIMAL,
    cash DECIMAL,
    debtors DECIMAL,
    creditors DECIMAL,
    stock DECIMAL,
    freehold_property DECIMAL,
    
    -- Ratios
    debtor_days INTEGER,
    creditor_days INTEGER,
    stock_days INTEGER,
    
    -- Metadata
    fiscal_year INTEGER,
    source TEXT,                                 -- 'upload', 'manual', 'api'
    confidence TEXT,                             -- 'high', 'medium', 'low'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Scoring Weights
CREATE TABLE service_scoring_weights (
    id UUID PRIMARY KEY,
    question_id TEXT NOT NULL,
    response_value TEXT NOT NULL,
    service_code TEXT NOT NULL,
    weight DECIMAL NOT NULL,
    category TEXT,                               -- 'founder_dependency', 'lifestyle', etc.
    rationale TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Supporting Tables

```sql
-- Engagement Workflow
CREATE TABLE discovery_engagements (
    id UUID PRIMARY KEY,
    client_id UUID,
    practice_id UUID,
    status TEXT,                                 -- 'pending', 'in_progress', 'completed'
    assessment_started_at TIMESTAMPTZ,
    assessment_completed_at TIMESTAMPTZ,
    report_generated_at TIMESTAMPTZ,
    shared_with_client_at TIMESTAMPTZ
);

-- Uploaded Documents
CREATE TABLE client_context (
    id UUID PRIMARY KEY,
    client_id UUID,
    practice_id UUID,
    context_type TEXT,                           -- 'document', 'notes', 'financial'
    content TEXT,
    metadata JSONB,
    source_file_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Pattern Analysis Cache
CREATE TABLE assessment_patterns (
    id UUID PRIMARY KEY,
    discovery_id UUID,
    patterns JSONB,                              -- Detected patterns
    model_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Migrations Index

| Migration | Purpose | Date |
|-----------|---------|------|
| `20260115_discovery_assessment_v2.sql` | Core discovery tables | Jan 2026 |
| `20260115_discovery_report_system.sql` | Report generation system | Jan 2026 |
| `20260115_discovery_destination_focused.sql` | Destination-focused questions | Jan 2026 |
| `20260115_migrate_legacy_discovery.sql` | Legacy data migration | Jan 2026 |
| `20260115_discovery_data_completeness.sql` | Data validation | Jan 2026 |
| `20260115_fix_discovery_trigger.sql` | Trigger fixes | Jan 2026 |
| `20260123_discovery_learning_system.sql` | Learning/feedback loop | Jan 2026 |
| `20260125_discovery_7dimension_analysis.sql` | 7-dimension analysis | Jan 2026 |
| `20260129_fix_discovery_reports_client_rls.sql` | Client portal RLS | Jan 2026 |
| `20251223_fix_destination_discovery_duplicates.sql` | Duplicate prevention | Dec 2025 |

---

## 6. Frontend Components

### 6.1 Admin Portal Components

| File | Purpose | Location |
|------|---------|----------|
| `DiscoveryAdminModal.tsx` | Admin view of discovery report | `src/components/discovery/` |
| `DiscoveryOpportunityPanel.tsx` | Opportunity management | `src/components/discovery/` |
| `AnalysisCommentSystem.tsx` | Internal comments | `src/components/discovery/` |
| `TransformationJourney.tsx` | Journey visualization | `src/components/discovery/` |
| `index.ts` | Component exports | `src/components/discovery/` |

### 6.2 Client Portal Components

| File | Purpose | Location |
|------|---------|----------|
| `DiscoveryReportView.tsx` | Client report display | `apps/client-portal/src/components/` |
| `DiscoveryMetricCard.tsx` | Metric display cards | `apps/client-portal/src/components/discovery/` |
| `DiscoveryInsightCard.tsx` | Insight display cards | `apps/client-portal/src/components/discovery/` |
| `TransformationJourney.tsx` | Client journey view | `apps/client-portal/src/components/discovery/` |
| `index.ts` | Component exports | `apps/client-portal/src/components/discovery/` |

### 6.3 Client Portal Pages

| File | Purpose | Location |
|------|---------|----------|
| `DiscoveryReportPage.tsx` | Full report page | `apps/client-portal/src/pages/discovery/` |
| `DestinationDiscoveryPage.tsx` | Assessment intake | `apps/client-portal/src/pages/discovery/` |
| `DiscoveryPortalPage.tsx` | Portal landing | `apps/client-portal/src/pages/` |
| `DiscoveryDashboardPage.tsx` | Discovery dashboard | `apps/client-portal/src/pages/` |
| `DiscoveryCompletePage.tsx` | Completion page | `apps/client-portal/src/pages/` |

---

## 7. Shared Utilities

### 7.1 Edge Function Shared Files

| File | Purpose | Location |
|------|---------|----------|
| `writing-style.ts` | LLM writing style guide | `supabase/functions/_shared/` |
| `service-scorer.ts` | V1 service scoring | `supabase/functions/_shared/` |
| `service-scorer-v2.ts` | V2 service scoring | `supabase/functions/_shared/` |
| `llm-cache.ts` | LLM response caching | `supabase/functions/_shared/` |
| `llm-cost-tracker.ts` | LLM cost tracking | `supabase/functions/_shared/` |
| `cleanup.ts` | Data cleanup utilities | `supabase/functions/_shared/` |
| `ANTI_AI_SLOP_STYLE_GUIDE.md` | Writing style guide | `supabase/functions/_shared/` |

### 7.2 Assessment Configuration

| File | Purpose | Location |
|------|---------|----------|
| `benchmarking-discovery.ts` | Discovery questions config | `src/config/assessments/` |

---

## 8. Assessment Questions

### 8.1 Part 1: Destination Discovery (25 Questions)

**Section 1: Your Destination (5 questions)**
- `dd_five_year_picture`: Describe typical Tuesday in 5 years
- `dd_success_definition`: What does success mean?
- `dd_non_negotiables`: Non-negotiables for next chapter
- `dd_what_would_change`: One thing to change if money no object
- `dd_exit_thoughts`: Thoughts on stepping back

**Section 2: Your Reality (7 questions)**
- `dd_honest_assessment`: How close to vision (1-10)
- `dd_owner_hours`: Weekly working hours
- `dd_time_breakdown`: Firefighting vs strategic %
- `dd_holiday_reality`: Last 2+ weeks completely off
- `dd_what_breaks_first`: What breaks if revenue doubles
- `dd_sleep_thief`: What keeps you awake at 3am
- `dd_biggest_frustration`: Main business frustration

**Section 3: Your Team (5 questions)**
- `dd_team_confidence`: Team confidence (1-10)
- `dd_key_person_risk`: Impact if best person leaves
- `dd_people_challenge`: Biggest people challenge
- `dd_delegation_honest`: How good at delegating
- `dd_team_secret`: What team doesn't know

**Section 4: Blind Spots (4 questions)**
- `dd_avoided_conversation`: Avoided conversation
- `dd_hard_truth`: Hard truth reluctant to face
- `dd_external_view`: Spouse's view on work-life
- `dd_if_i_knew`: "If I really knew my numbers..."

**Section 5: Moving Forward (4 questions)**
- `dd_priority_focus`: Magic wand - fix ONE area
- `dd_change_readiness`: Ready for real changes?
- `dd_past_blockers`: What stopped changes before
- `dd_final_message`: Anything else to share

### 8.2 Part 2: Service Diagnostic (15 Questions)

**Financial Clarity (3 questions)**
- `sd_financial_confidence`: Confidence in financial data
- `sd_numbers_action`: How often numbers change behavior
- `sd_benchmark_awareness`: Know how you compare to peers

**Operational Freedom (3 questions)**
- `sd_founder_dependency`: What if you disappeared for a month
- `sd_manual_work`: Time spent on manual work
- `sd_problem_awareness`: How quickly find out about issues

**Strategic Direction (3 questions)**
- `sd_plan_clarity`: Clear 12-month plan?
- `sd_accountability`: Who holds you accountable?
- `sd_decision_partner`: Who do you discuss decisions with?

**Growth Readiness (3 questions)**
- `sd_growth_blocker`: Main growth blocker
- `sd_double_revenue`: What breaks if revenue doubles
- `sd_operational_frustration`: Biggest operational frustration

**Exit & Protection (3 questions)**
- `sd_exit_readiness`: Can produce docs in 48 hours?
- `sd_valuation_clarity`: Know what business is worth?
- `sd_exit_timeline`: Ideal exit timeline

---

## 9. Service Scoring Logic

### 9.1 Service Lines

| Code | Name | Monthly Price | One-Off Price |
|------|------|---------------|---------------|
| `365_method` | 365 Alignment Programme | - | £1,500-9,000/year |
| `fractional_cfo` | Fractional CFO | £3,500-15,000/month | - |
| `fractional_coo` | Fractional COO | £3,000-14,000/month | - |
| `combined_advisory` | Combined CFO/COO | £6,000-28,000/month | - |
| `management_accounts` | Management Accounts | £650/month | £1,750/quarter |
| `systems_audit` | Systems Audit | - | £1,500-4,000 |
| `automation` | Automation Services | £1,500/month | £115-180/hour |
| `business_advisory` | Exit Planning | - | £1,000-4,000 |
| `benchmarking` | Benchmarking Services | - | £450-3,500 |

### 9.2 Scoring Algorithm

```typescript
interface ServiceScore {
  code: string;
  name: string;
  score: number;         // 0-100
  confidence: number;    // Based on trigger count
  triggers: string[];    // Why this service scored
  priority: 1 | 2 | 3 | 4;
  recommended: boolean;  // score >= 50
}

// Scoring thresholds
const THRESHOLDS = {
  CRITICAL: 70,    // Priority 1, recommended
  HIGH: 50,        // Priority 2, recommended
  MEDIUM: 30,      // Priority 3, not recommended
  LOW: 0           // Priority 4, not recommended
};

// Pattern multipliers
const MULTIPLIERS = {
  CAPITAL_RAISING: 1.5,
  BURNOUT: 1.4,
  LIFESTYLE_TRANSFORMATION: 1.3,
  EXIT_URGENCY: 1.2
};
```

### 9.3 Special Detection Patterns

**Capital Raising Detection**
- Triggers: growth_blocker = "Don't have capital", mentions of funding
- Boosts: fractional_cfo, management_accounts, business_advisory

**Burnout Detection**
- Triggers: 60-70+ hours, no holiday in 2+ years, relationship strain
- Boosts: fractional_coo, 365_method

**Lifestyle Transformation**
- Triggers: Vision describes different role, "runs without me"
- Boosts: 365_method, fractional_coo

---

## 10. LLM Integration

### 10.1 Models Used

| Pass | Model | Provider | Use Case |
|------|-------|----------|----------|
| Pass 1 | None | - | Deterministic calculation |
| Pass 2 | Claude Opus 4.5 | OpenRouter | Narrative generation |
| Pattern Detection | Claude Sonnet 4 | OpenRouter | Pattern analysis |
| Document Parsing | Claude Vision | OpenRouter | PDF/image analysis |

### 10.2 Prompt Structure (Pass 2)

```typescript
const pass2Prompt = {
  system: `You are a senior business advisor writing a confidential 
           discovery report. Use ONLY the pre-calculated figures provided.
           Never invent numbers. Quote the client verbatim.`,
  
  user: `
    CLIENT: ${clientName}
    COMPANY: ${companyName}
    
    === PRE-CALCULATED METRICS (MUST USE EXACT FIGURES) ===
    ${JSON.stringify(pass1Data.calculatorOutputs)}
    
    === EMOTIONAL ANCHORS (QUOTE VERBATIM) ===
    ${JSON.stringify(pass1Data.emotionalAnchors)}
    
    === SERVICE SCORES ===
    ${JSON.stringify(pass1Data.serviceScores)}
    
    Generate the discovery report in the following JSON structure:
    ${outputSchema}
  `
};
```

### 10.3 Writing Style Rules

- First person plural ("we", "our")
- British English spelling
- No jargon - plain language
- Quote client at least 10 times
- Show calculation working
- Empathetic but direct tone
- No em dashes (use periods or colons)

---

## 11. File Index

### 11.1 This Folder Contains Copies Of:

**Edge Functions (Main)**
- `generate-discovery-report-pass1-copy.ts`
- `generate-discovery-report-pass2-copy.ts`
- `generate-discovery-analysis-copy.ts` (legacy)
- `generate-discovery-pdf-copy.ts`
- `generate-discovery-responses-pdf-copy.ts`
- `prepare-discovery-data-copy.ts`
- `start-discovery-report-copy.ts`
- `generate-discovery-report-legacy-copy.ts`

**Edge Functions (Supporting)**
- `detect-assessment-patterns-copy.ts`
- `generate-service-recommendations-copy.ts`
- `advisory-deep-dive-copy.ts`
- `process-documents-copy.ts`
- `process-client-context-copy.ts`
- `parse-document-copy.ts`
- `upload-client-accounts-copy.ts`
- `process-accounts-upload-copy.ts`
- `accept-invitation-copy.ts`
- `client-signup-copy.ts`
- `send-client-invitation-copy.ts`
- `generate-value-proposition-copy.ts`

**Calculators**
- `calculators-index-copy.ts`
- `calculators-orchestrator-copy.ts`
- `calculators-integration-copy.ts`
- `calculators-valuation-copy.ts`
- `calculators-trajectory-copy.ts`
- `calculators-payroll-copy.ts`
- `calculators-productivity-copy.ts`
- `calculators-profitability-copy.ts`
- `calculators-hidden-assets-copy.ts`
- `calculators-exit-readiness-copy.ts`
- `calculators-cost-of-inaction-copy.ts`
- `calculators-achievements-copy.ts`

**Benchmarks**
- `benchmarks-index-copy.ts`
- `benchmarks-industry-copy.ts`

**Types**
- `pass1-types-index-copy.ts`
- `pass1-types-output-copy.ts`

**Shared Utilities**
- `shared-writing-style-copy.ts`
- `shared-service-scorer-copy.ts`
- `shared-service-scorer-v2-copy.ts`
- `shared-llm-cache-copy.ts`
- `shared-llm-cost-tracker-copy.ts`

### 11.2 Files NOT Copied (Reference Only)

**Frontend files** are NOT copied as they change frequently. Reference:
- `src/components/discovery/` - Admin components
- `apps/client-portal/src/components/discovery/` - Client components
- `apps/client-portal/src/pages/discovery/` - Client pages

**Migrations** are NOT copied as they're one-time runs. Reference:
- `supabase/migrations/20260115_*.sql` - Discovery migrations
- `supabase/migrations/20260123_discovery_learning_system.sql`
- `supabase/migrations/20260125_discovery_7dimension_analysis.sql`
- `supabase/migrations/20260129_fix_discovery_reports_client_rls.sql`

---

## Quick Reference: Key Decisions

1. **Why 2 passes?** Supabase 60s timeout. Calculations in Pass 1 (~20s), LLM in Pass 2 (~50s).

2. **Why deterministic Pass 1?** Consistency. Re-running produces same numbers. Auditability.

3. **Why not trust LLM for calculations?** LLMs hallucinate numbers. Pass 1 forces exact figures.

4. **Why 8 dimensions?** Covers financial health (4), operational health (2), strategic position (2).

5. **Why emotional anchors?** Client quotes create trust. "You said X" is more powerful than "We think X".

---

*This document is the single source of truth for the Discovery Assessment System architecture.*
*Last updated: February 2026*
