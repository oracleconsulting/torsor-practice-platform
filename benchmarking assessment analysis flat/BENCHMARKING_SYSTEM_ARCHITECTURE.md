# Benchmarking System Architecture - Comprehensive Analysis

> **COPY FILE - DO NOT EDIT**
> This is a reference document for Claude Project analysis. Edit the source files, not these copies.

---

## 1. SYSTEM OVERVIEW

The Benchmarking Service is a comprehensive business analysis platform that:
1. **Collects client data** via multi-step assessment questionnaire
2. **Enriches with financial data** from uploaded accounts (PDF parsing)
3. **Compares against industry benchmarks** (via live Perplexity search + cached data)
4. **Generates AI-powered analysis** (Pass 1 → data analysis, Pass 2 → narrative writing, Pass 3 → opportunities)
5. **Produces client-facing reports** with value analysis, suppressors, and actionable insights
6. **Links to service recommendations** from the services catalogue

---

## 2. DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. CLIENT COMPLETES ASSESSMENT
   └── bm_assessment_responses (questionnaire answers)
       ├── Business description, industry, size
       ├── Self-perception (suspected underperformance)
       ├── Investment context (recent investments, margin context)
       └── Magic fix / blind spot fear

2. ADMIN ENRICHES DATA
   ├── Upload accounts (PDF) → process-accounts-upload → client_financial_data
   ├── Add supplementary data (utilisation, rates) → save-bm-supplementary-data
   ├── Context notes → client_context_notes
   └── Manual triggers (regenerate report)

3. REPORT GENERATION (3-PASS SYSTEM)
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ PASS 1: Data Analysis (Claude Sonnet)                                   │
   │ ─────────────────────────────────────────────────────────────────────── │
   │ Input:  Assessment responses + Financial data + Industry benchmarks     │
   │ Output: pass1_data JSON with:                                           │
   │         - metricsComparison (percentiles vs benchmarks)                 │
   │         - topStrengths / topGaps                                        │
   │         - opportunitySizing (£ annual opportunity)                      │
   │         - surplusCash calculation                                       │
   │         - founderRisk scoring                                           │
   │         - valueAnalysis (baseline, suppressors, exit readiness)         │
   │         - enhanced_suppressors (detailed breakdown)                     │
   │         - exit_readiness_breakdown (component scoring)                  │
   │         - opportunity_calculations (full transparency)                  │
   │         - two_paths_narrative                                           │
   │ Stored: bm_reports.pass1_data + dedicated columns                       │
   └─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ PASS 2: Narrative Writing (Claude Opus)                                 │
   │ ─────────────────────────────────────────────────────────────────────── │
   │ Input:  pass1_data + client quotes + financial context                  │
   │ Output: Written narratives:                                             │
   │         - headline (25 words, £ opportunity + concern)                  │
   │         - executiveSummary (3 paragraphs, story arc)                    │
   │         - positionNarrative (where they sit)                            │
   │         - strengthNarrative (credibility first)                         │
   │         - gapNarrative (connected to concerns, £ quantified)            │
   │         - opportunityNarrative (magic fix connection)                   │
   │ Stored: bm_reports.headline/executive_summary/etc.                      │
   └─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ PASS 3: Opportunity Analysis (Claude Opus 4.5)                          │
   │ ─────────────────────────────────────────────────────────────────────── │
   │ Input:  All client data + service catalogue + existing concepts         │
   │ Output: Structured opportunities:                                       │
   │         - 8-12 prioritised opportunities                                │
   │         - Service mapping (existing service OR new concept)             │
   │         - Financial impact with calculation                             │
   │         - Talking points for adviser                                    │
   │         - Priority (must_address_now / next_12_months / when_ready)     │
   │ Stored: client_opportunities table + bm_reports.opportunity_assessment  │
   │                                                                         │
   │ Post-processing:                                                        │
   │ - Theme consolidation (protected themes never merge)                    │
   │ - Financial impact sanitisation (cap at % of revenue)                   │
   │ - Direction-aware priority adjustment                                   │
   │ - Value analysis sync (suppressors match opportunities)                 │
   └─────────────────────────────────────────────────────────────────────────┘

4. CLIENT VIEWS REPORT
   └── BenchmarkingClientReport.tsx renders all data
       ├── Hero section (headline, overall percentile)
       ├── Metric comparisons (visual percentile bars)
       ├── Value bridge (baseline → suppressors → current value)
       ├── Exit readiness scoring
       ├── Scenario planning (interactive what-if calculator)
       └── Service recommendations
```

---

## 3. DATABASE SCHEMA (KEY TABLES)

### Core Benchmarking Tables

| Table | Purpose |
|-------|---------|
| `bm_engagements` | Links clients to benchmarking service engagements |
| `bm_assessment_responses` | Client's questionnaire answers (JSONB responses) |
| `bm_reports` | Main report storage with all generated data |
| `bm_metric_comparisons` | Individual metric comparisons with percentiles |
| `bm_client_scenarios` | Saved "what-if" scenarios |

### bm_reports Key Columns

```sql
-- Core data
pass1_data              JSONB   -- Full Pass 1 analysis (metrics, sizing, etc.)
industry_code           TEXT    -- Resolved industry classification

-- Narratives (Pass 2)
headline                TEXT
executive_summary       TEXT
position_narrative      TEXT
strength_narrative      TEXT  
gap_narrative           TEXT
opportunity_narrative   TEXT

-- Financial analysis
surplus_cash            JSONB   -- Surplus cash breakdown
balance_sheet           JSONB   -- Balance sheet data
financial_trends        JSONB   -- YoY trend analysis
historical_financials   JSONB   -- Multi-year data
current_ratio           NUMERIC
cash_months             NUMERIC

-- Value analysis
value_analysis          JSONB   -- Full value bridge data
value_suppressors       JSONB   -- Suppressor details
total_value_discount    NUMERIC -- Aggregate discount %
baseline_multiple       NUMERIC -- Industry multiple
discounted_multiple     NUMERIC -- After suppressors

-- Founder risk
founder_risk_level      TEXT    -- low/medium/high/critical
founder_risk_score      INTEGER -- 0-100
founder_risk_factors    JSONB

-- Enhanced data (Rolls Royce features)
opportunity_calculations    JSONB   -- Full calculation transparency
enhanced_suppressors        JSONB   -- Detailed suppressor breakdown
exit_readiness_breakdown    JSONB   -- Component scoring
two_paths_narrative         JSONB   -- Operational + strategic connection

-- Status
status                  TEXT    -- draft/pass1_complete/generated/etc.
llm_model              TEXT    -- Models used
llm_tokens_used        INTEGER
llm_cost               NUMERIC
generation_time_ms     INTEGER
```

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `client_opportunities` | AI-identified opportunities per engagement |
| `services` | Service catalogue (what we sell) |
| `service_concepts` | New service ideas surfaced from analysis |
| `client_context_notes` | Admin notes from client conversations |
| `client_financial_data` | Extracted financial data (multi-year) |
| `client_accounts_uploads` | Uploaded account files |
| `benchmark_data` | Industry benchmark values (cached) |
| `benchmark_search_log` | Audit log of benchmark fetches |
| `industries` | Industry definitions |

---

## 4. EDGE FUNCTIONS

### Core Generation Functions

| Function | Model | Purpose |
|----------|-------|---------|
| `generate-bm-report-pass1` | Claude Sonnet | Data analysis, metrics, calculations |
| `generate-bm-report-pass2` | Claude Opus | Narrative writing (story arc) |
| `generate-bm-opportunities` | Claude Opus 4.5 | Opportunity identification + service mapping |

### Supporting Functions

| Function | Purpose |
|----------|---------|
| `regenerate-bm-report` | Re-run analysis on existing data |
| `fetch-industry-benchmarks` | Perplexity Sonar Pro for live benchmarks |
| `save-bm-supplementary-data` | Save admin-collected metrics |
| `process-accounts-upload` | Parse PDF accounts → extract financials |

---

## 5. KEY ALGORITHMS

### 5.1 Founder Risk Calculation

```typescript
// Located: src/lib/services/benchmarking/founder-risk-calculator.ts

Inputs:
- succession_your_role (Nobody/Need 6 months/Ready)
- autonomy_finance/strategy/sales (Would fail/Needs oversight/Autonomous)
- risk_tech_lead/sales_lead (Crisis/Disrupted/Covered)
- knowledge_dependency_percentage (0-100)
- personal_brand_percentage (0-100)

Scoring:
- No successor: +25 points
- Autonomy would fail: +12-15 points per area
- Key person crisis risk: +8-12 points per role
- Knowledge dependency >80%: +15 points
- Personal brand >85%: +12 points

Levels:
- score >= 60: CRITICAL (30-50% valuation discount)
- score >= 40: HIGH (20-30% discount)
- score >= 20: MEDIUM (10-20% discount)
- score < 20: LOW (minimal impact)
```

### 5.2 Surplus Cash Calculation

```typescript
// Located: generate-bm-report-pass1/index.ts (inlined)

Formula:
surplusCash = actualCash - requiredCash

where:
requiredCash = operatingBuffer + max(0, workingCapitalRequirement)

operatingBuffer = (staffCosts + adminExpenses) × (3/12)
                  // 3 months of operating expenses

workingCapitalRequirement = debtors - creditors - stock
                            // Can be negative if suppliers fund operations
```

### 5.3 Value Suppressor Discounts

```typescript
// Located: generate-bm-report-pass1/index.ts (inlined)

Concentration Risk:
- 90%+ top 3: 25-35% discount (CRITICAL)
- 75-89%: 15-25% discount (HIGH)
- 50-74%: 10-15% discount (MEDIUM)

Founder Dependency:
- 70%+ knowledge: 15-25% discount (CRITICAL)
- 50-69%: 12-18% discount (HIGH)
- 40-49%: 8-12% discount (MEDIUM)

No Succession:
- No plan + founder dependency: 8-12% discount
- No plan only: 5-8% discount

Revenue Predictability:
- <20% recurring: 10-15% discount
- <40% recurring: 5-10% discount
```

### 5.4 Opportunity Prioritisation

```typescript
// Located: generate-bm-opportunities/index.ts

Priority Assignment:
1. CRITICAL severity → must_address_now
2. HIGH + (risk OR governance category) → must_address_now
3. HIGH + direction boost ≥2 → must_address_now
4. HIGH (other) → next_12_months
5. MEDIUM → when_ready
6. LOW/OPPORTUNITY → when_ready

Protected Themes (never merged):
- concentration_risk
- founder_dependency
- succession_gap

Force must_address_now patterns:
- "99%", "existential risk", "hit by a bus"
- "80% founder", "unsellable", "no succession"
```

---

## 6. FRONTEND COMPONENTS

### Admin View (`src/components/benchmarking/admin/`)

| Component | Purpose |
|-----------|---------|
| `BenchmarkingAdminView.tsx` | Main admin dashboard |
| `DataCollectionPanel.tsx` | Collect supplementary metrics |
| `ConversationScript.tsx` | Guided discovery questions |
| `OpportunityDashboard.tsx` | View/manage opportunities |
| `ValueAnalysisPanel.tsx` | Value bridge editor |
| `ServicePathwayPanel.tsx` | Service recommendations |
| `AccountsUploadPanel.tsx` | Upload/manage accounts |
| `NextStepsPanel.tsx` | Engagement workflow |

### Client Report (`src/components/benchmarking/client/`)

| Component | Purpose |
|-----------|---------|
| `BenchmarkingClientReport.tsx` | Main client-facing report |
| `HeroSection.tsx` | Headline + overall position |
| `MetricComparisonCard.tsx` | Individual metric display |
| `NarrativeSection.tsx` | AI-written narratives |
| `ValueBridgeSection.tsx` | Value analysis visualisation |
| `ScenarioPlanningSection.tsx` | Interactive what-if calculator |
| `ServiceRecommendationsSection.tsx` | Linked service suggestions |

### Enhanced Components (Rolls Royce)

| Component | Purpose |
|-----------|---------|
| `CalculationBreakdown.tsx` | Show calculation steps/assumptions |
| `SurplusCashBreakdown.tsx` | Detailed cash analysis table |
| `EnhancedSuppressorCard.tsx` | Current/target/recovery path |
| `ExitReadinessBreakdown.tsx` | Component-level scoring |
| `TwoPathsSection.tsx` | Operational + strategic narrative |

---

## 7. LIB FILES

| File | Purpose |
|------|---------|
| `scenario-calculator.ts` | Client-side what-if calculations |
| `export-benchmarking-data.ts` | Debug utility for data extraction |
| `services/benchmarking/founder-risk-calculator.ts` | Founder risk scoring |
| `services/benchmarking/industry-mapper.ts` | SIC code → industry code mapping |

---

## 8. CONFIGURATION

### Assessment Configuration
`src/config/assessments/benchmarking-discovery.ts`

Sections:
1. **Classification** - Business description, industry, sub-sector
2. **Size & Context** - Revenue, employees, age, location
3. **Investment Context** - Recent investments, margin context
4. **Perception & Tracking** - Self-assessment, current metrics
5. **Priority Areas** - Suspected underperformance, ambitions
6. **Magic Action** - If you could fix one thing...

### Type Definitions
`src/types/benchmarking.ts`

Key interfaces:
- `ValueAnalysis` - Full value bridge structure
- `ValueSuppressor` - Discount factor definition
- `MetricComparison` - Benchmark comparison
- `BenchmarkReport` - Report structure
- `Pass1Data` - Pass 1 output structure
- `HVAResponses` - Hidden Value Audit fields

---

## 9. INTEGRATION POINTS

### Links to Discovery Assessment

The benchmarking system can consume HVA (Hidden Value Audit) data from the Discovery assessment:

```typescript
// HVA fields used in benchmarking:
- knowledge_dependency_percentage → founder risk
- personal_brand_percentage → founder risk
- succession_your_role → succession planning
- autonomy_finance/strategy/sales → autonomy assessment
- risk_tech_lead/sales_lead → key person risk
- top3_customer_revenue_percentage → concentration
- recurring_revenue_percentage → predictability
- unique_methods_protection → IP assessment
```

### Links to Services

Opportunities map to services via:
1. `services` table - Active service catalogue
2. `service_concepts` table - Suggested new services
3. `client_opportunities.recommended_service_id` - Direct mapping
4. `client_opportunities.suggested_concept_id` - New concept reference

### Links to M&A

Value analysis can feed into M&A service:
- Baseline valuation methodology
- Suppressor discounts
- Exit readiness scoring

---

## 10. CONTEXT NOTES SYSTEM

### Purpose
Capture additional context from client conversations that should influence report generation.

### Note Types
- `discovery_call` - Notes from discovery conversations
- `follow_up_answer` - Answers to follow-up questions
- `advisor_observation` - Things advisor noticed
- `client_email` - Relevant email excerpts
- `meeting_notes` - General meeting notes
- `background_context` - Background information

### Integration
Context notes are fetched in Pass 1 and included in the LLM prompt as "CRITICAL CONTEXT - DO NOT IGNORE" section.

---

## 11. KEY DESIGN DECISIONS

### Why 3-Pass Generation?

1. **Pass 1 (Sonnet)** - Fast, accurate data analysis. Cost-effective for numerical work.
2. **Pass 2 (Opus)** - Superior narrative writing. Worth the cost for client-facing content.
3. **Pass 3 (Opus 4.5)** - Most sophisticated reasoning for opportunity identification.

### Why Protected Themes?

Existential risks (concentration, founder dependency, succession) should never be merged or downplayed. They need separate, focused attention.

### Why Direction-Aware Prioritisation?

A client preparing for exit has different priorities than one focused on aggressive growth. The system adjusts recommendations accordingly.

### Why Value Analysis Sync?

Ensures the value bridge suppressors match the opportunities tab. Creates coherent narrative across the report.

---

## 12. COMMON DEBUGGING

### Check Data Flow

```typescript
// In browser console:
await window.exportBenchmarkingData('engagement-id-here');
await window.checkDataUsage('engagement-id-here');
```

### Regenerate Report

```bash
# Call regenerate function with force refresh
POST /functions/v1/regenerate-bm-report
{
  "engagementId": "xxx",
  "forceRefreshBenchmarks": true,
  "reason": "Debug regeneration"
}
```

### Check Pass 1 Output

```sql
SELECT 
  pass1_data,
  enhanced_suppressors,
  exit_readiness_breakdown,
  opportunity_calculations
FROM bm_reports 
WHERE engagement_id = 'xxx';
```

---

## 13. FILE INDEX

All files related to benchmarking are copied to this folder for reference:

### Edge Functions
- `generate-bm-report-pass1-COPY.ts` - Main analysis (4891 lines)
- `generate-bm-report-pass2-COPY.ts` - Narrative writing
- `generate-bm-opportunities-COPY.ts` - Opportunity analysis
- `fetch-industry-benchmarks-COPY.ts` - Benchmark fetching
- `regenerate-bm-report-COPY.ts` - Re-generation
- `save-bm-supplementary-data-COPY.ts` - Supplementary data

### Types
- `benchmarking-types-COPY.ts`

### Config
- `benchmarking-discovery-COPY.ts`

### Lib Files
- `founder-risk-calculator-COPY.ts`
- `industry-mapper-COPY.ts`
- `scenario-calculator-COPY.ts`
- `export-benchmarking-data-COPY.ts`

### Components (summaries, not full copies)
- See `COMPONENT_SUMMARIES.md`

---

*Last updated: 2026-02-04*
