# Hidden Value & Benchmarking Service Discovery

**Generated:** 2026-01-31  
**Purpose:** Architecture mapping before implementing DISCOVER → COMPARE → EXPLORE → ACT framework  
**Test Case:** Installation Tech (engagement_id: `3eddae86-d39b-478e-ae81-d73316bb5871`)

---

## 1. ARCHITECTURE SUMMARY

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BENCHMARKING SERVICE DATA FLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

[Client Assessment]    [Accounts Upload]     [HVA Part 3]
      ↓                      ↓                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        bm_assessment_responses                               │
│  - responses (JSONB) - stores all assessment data including supplementary    │
│  - industry_code, revenue_band, employee_count, business_description        │
│  - suspected_underperformance, leaving_money, magic_fix, blind_spot_fear    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   generate-bm-report-pass1 (Edge Function)                  │
│  INPUTS:                                                                     │
│    - bm_assessment_responses (assessment data)                              │
│    - client_assessments (HVA data - assessment_type='part3')                │
│    - client_financial_data (uploaded accounts)                              │
│    - benchmark_data (industry benchmarks)                                   │
│                                                                              │
│  PROCESSING:                                                                 │
│    - enrichBenchmarkData() - derives revenue, employee count, margins       │
│    - calculateSurplusCash() - surplus above operating buffer                │
│    - analyseFinancialTrends() - multi-year trend analysis                   │
│    - detectInvestmentPattern() - identifies investment years                │
│    - calculateFounderRisk() - HVA-derived risk scoring                      │
│    - extractHVAMetrics() - client_concentration, knowledge_dependency       │
│    - resolveIndustryFromSIC() - SIC code to industry mapping                │
│    - LLM call (GPT-4o-mini) - generates admin guidance                      │
│                                                                              │
│  OUTPUTS (to bm_reports):                                                   │
│    - pass1_data (JSONB) - all enriched data                                 │
│    - balance_sheet, financial_trends, investment_signals                    │
│    - surplus_cash, cash_months, current_ratio, quick_ratio                  │
│    - admin_opening_statement, admin_talking_points, admin_risk_flags        │
│    - founder_risk_level, founder_risk_score, founder_risk_factors           │
│    - metrics_comparison, total_annual_opportunity                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                   generate-bm-report-pass2 (Edge Function)                  │
│  INPUT: bm_reports.pass1_data                                               │
│                                                                              │
│  PROCESSING:                                                                 │
│    - buildPass2Prompt() - story arc narrative construction                  │
│    - Injects: financial_trends, balance_sheet, surplus_cash                 │
│    - Injects: client_concentration, project_margin, hourly_rate             │
│    - Industry-specific context (e.g., TELECOM_INFRA interpretation)         │
│    - LLM call (Claude Opus 4) - generates client-facing narratives          │
│                                                                              │
│  OUTPUTS (to bm_reports):                                                   │
│    - headline, executive_summary                                            │
│    - position_narrative, strength_narrative                                 │
│    - gap_narrative, opportunity_narrative                                   │
│    - status: 'generated'                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              bm_reports                                      │
│  PRIMARY KEY: engagement_id                                                  │
│  STORED: All narratives, pass1_data, balance_sheet, trends, surplus_cash   │
└─────────────────────────────────────────────────────────────────────────────┘
           ↓                                                    ↓
┌─────────────────────────┐                     ┌─────────────────────────────┐
│   ADMIN VIEW            │                     │    CLIENT REPORT            │
│   BenchmarkingAdminView │                     │    BenchmarkingClientReport │
│   - Conversation Script │                     │    - HeroSection            │
│   - Risk Flags          │                     │    - Hidden Value Section   │
│   - Data Collection     │                     │    - Concentration Risk     │
│   - Next Steps          │                     │    - Metric Cards           │
│   - Accounts Upload     │                     │    - Recommendations        │
└─────────────────────────┘                     └─────────────────────────────┘
```

---

## 2. DATABASE SCHEMA

### Core Tables

#### `bm_engagements`
```sql
CREATE TABLE bm_engagements (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES practice_members(id),
  practice_id UUID NOT NULL REFERENCES practices(id),
  status TEXT CHECK (status IN ('draft', 'assessment_complete', 'pass1_complete', 
                                'generated', 'approved', 'published', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ,
  assessment_completed_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  delivered_at TIMESTAMPTZ,
  is_test BOOLEAN DEFAULT false
);
```

#### `bm_assessment_responses`
```sql
CREATE TABLE bm_assessment_responses (
  engagement_id UUID PRIMARY KEY REFERENCES bm_engagements(id),
  
  -- Classification
  business_description TEXT,
  industry_code TEXT REFERENCES industries(code),
  industry_confidence INTEGER,
  industry_override TEXT,
  sub_sector TEXT,
  sic_code TEXT,
  
  -- Size & Context
  revenue_band TEXT CHECK (...),
  employee_count INTEGER,
  business_age TEXT,
  location_type TEXT,
  
  -- Self-Assessment
  performance_perception TEXT,
  current_tracking TEXT[],
  comparison_method TEXT,
  
  -- Pain & Priority
  suspected_underperformance TEXT,
  leaving_money TEXT,
  top_quartile_ambition TEXT[],
  competitor_envy TEXT,
  
  -- Magic & Action
  benchmark_magic_fix TEXT,
  action_readiness TEXT,
  blind_spot_fear TEXT,
  
  -- JSONB for all responses (including supplementary data)
  responses JSONB,  -- Contains bm_supp_* fields for collected data
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `bm_reports`
```sql
CREATE TABLE bm_reports (
  engagement_id UUID PRIMARY KEY REFERENCES bm_engagements(id),
  
  -- Classification
  industry_code TEXT REFERENCES industries(code),
  revenue_band TEXT,
  employee_band TEXT,
  
  -- Narratives (from Pass 2)
  headline TEXT,
  executive_summary TEXT,
  position_narrative TEXT,
  strength_narrative TEXT,
  gap_narrative TEXT,
  opportunity_narrative TEXT,
  
  -- Metrics (from Pass 1)
  metrics_comparison JSONB,
  overall_percentile INTEGER,
  strength_count INTEGER,
  gap_count INTEGER,
  total_annual_opportunity DECIMAL(12,2),
  opportunity_breakdown JSONB,
  
  -- Admin Guidance (from Pass 1)
  admin_opening_statement TEXT,
  admin_talking_points JSONB,
  admin_questions_to_ask JSONB,
  admin_data_collection_script JSONB,
  admin_closing_script TEXT,
  admin_next_steps JSONB,
  admin_tasks JSONB,
  admin_risk_flags JSONB,
  
  -- Top Findings
  top_strengths JSONB,
  top_gaps JSONB,
  recommendations JSONB,
  
  -- Balance Sheet & Trends (added 2026-01-29)
  balance_sheet JSONB,           -- {cash, net_assets, freehold_property, investments}
  financial_trends JSONB,        -- [{metric, direction, isRecovering, narrative}]
  investment_signals JSONB,      -- {likelyInvestmentYear, indicators, confidence}
  historical_financials JSONB,   -- [{fiscal_year, revenue, gross_margin, net_margin}]
  current_ratio NUMERIC(10,2),
  quick_ratio NUMERIC(10,2),
  cash_months NUMERIC(10,1),
  creditor_days INTEGER,
  
  -- Surplus Cash (added 2026-01-30)
  surplus_cash JSONB,            -- {hasData, actualCash, requiredCash, surplusCash, ...}
  
  -- Founder Risk (added 2026-01-30)
  founder_risk_level TEXT,       -- 'low' | 'medium' | 'high' | 'critical'
  founder_risk_score INTEGER,    -- 0-100
  founder_risk_factors JSONB,    -- [{category, signal, severity, points}]
  valuation_impact TEXT,         -- '30-50% discount' etc.
  
  -- Generation Metadata
  pass1_data JSONB,
  llm_model TEXT,
  llm_tokens_used INTEGER,
  llm_cost DECIMAL(8,4),
  generation_time_ms INTEGER,
  prompt_version TEXT DEFAULT 'v1',
  benchmark_data_as_of DATE,
  data_sources TEXT[],
  benchmark_sources_detail JSONB,
  status TEXT,
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `bm_metric_comparisons`
```sql
CREATE TABLE bm_metric_comparisons (
  id UUID PRIMARY KEY,
  engagement_id UUID REFERENCES bm_engagements(id),
  
  metric_code TEXT REFERENCES benchmark_metrics(code),
  metric_name TEXT,
  
  -- Client Value
  client_value DECIMAL,
  client_value_source TEXT CHECK (client_value_source IN ('ma_data', 'assessment', 'calculated', 'collected', 'missing')),
  
  -- Benchmarks
  p10 DECIMAL,
  p25 DECIMAL,
  p50 DECIMAL,
  p75 DECIMAL,
  p90 DECIMAL,
  
  -- Position
  percentile INTEGER,
  assessment TEXT CHECK (assessment IN ('top_10', 'top_quartile', 'above_median', 
                                        'below_median', 'bottom_quartile', 'bottom_10')),
  
  -- Gap Analysis
  vs_median DECIMAL,
  vs_top_quartile DECIMAL,
  gap_to_target DECIMAL,
  target_percentile INTEGER,
  
  -- Impact
  annual_impact DECIMAL(12,2),
  impact_calculation TEXT,
  
  -- Display
  display_order INTEGER,
  is_primary BOOLEAN DEFAULT false,
  
  -- Unique constraint for upsert
  CONSTRAINT bm_metric_comparisons_engagement_metric_unique 
    UNIQUE (engagement_id, metric_code)
);
```

#### `benchmark_data`
```sql
CREATE TABLE benchmark_data (
  id UUID PRIMARY KEY,
  industry_code TEXT REFERENCES industries(code),
  metric_code TEXT REFERENCES benchmark_metrics(code),
  
  -- Segmentation
  revenue_band TEXT,  -- 'under_250k', '250k_500k', ..., '10m_plus', 'all'
  employee_band TEXT, -- '1_5', '6_10', ..., '100_plus', 'all'
  
  -- Percentile Values
  p10 DECIMAL,
  p25 DECIMAL,
  p50 DECIMAL,
  p75 DECIMAL,
  p90 DECIMAL,
  mean DECIMAL,
  
  -- Metadata
  sample_size INTEGER,
  data_year INTEGER,
  data_source TEXT,
  source_url TEXT,
  confidence_level TEXT,
  fetched_via TEXT,  -- 'live_search' | 'manual'
  
  -- Versioning
  version INTEGER DEFAULT 1,
  valid_from DATE,
  valid_to DATE,
  is_current BOOLEAN DEFAULT true,
  
  UNIQUE(industry_code, metric_code, revenue_band, employee_band, version)
);
```

#### `industries`
```sql
CREATE TABLE industries (
  code TEXT PRIMARY KEY,          -- e.g., 'ITSERV', 'TELECOM_INFRA'
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  sic_codes TEXT[],
  keywords TEXT[],
  benchmark_profile JSONB,
  is_active BOOLEAN DEFAULT true
);
```

#### `client_assessments` (HVA Data)
```sql
-- This is where HVA Part 3 data lives
CREATE TABLE client_assessments (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES practice_members(id),
  practice_id UUID,
  assessment_type TEXT,  -- 'part1', 'part2', 'part3' (part3 = HVA)
  responses JSONB,       -- Contains all HVA responses
  value_analysis_data JSONB,
  ...
);
```

---

## 3. HVA (Hidden Value Audit) DATA

### Where HVA Data Lives
- **Table:** `client_assessments`
- **Filter:** `assessment_type = 'part3'`
- **Join:** `client_id` links to `practice_members.id`

### Key HVA Fields in `responses` JSONB

| Field | Description | Used In |
|-------|-------------|---------|
| `top3_customer_revenue_percentage` | Client concentration | Pass 1 risk flags |
| `knowledge_dependency_percentage` | Founder knowledge risk | Founder risk calc |
| `personal_brand_percentage` | Brand tied to individual | Founder risk calc |
| `succession_your_role` | Who can replace founder | Founder risk calc |
| `succession_sales/technical/operations` | Role-specific succession | Founder risk calc |
| `autonomy_finance/strategy/sales/delivery` | Can function operate independently | Founder risk calc |
| `risk_tech_lead/sales_lead/finance_lead` | Impact if key person unavailable | Founder risk calc |
| `competitive_moat` | Array of competitive advantages | Client report |
| `unique_methods` | Proprietary processes | Client report |
| `team_advocacy_percentage` | Internal NPS | Pass 1 |
| `tech_stack_health_percentage` | System health | Pass 1 |
| `last_price_increase` | Pricing history | Risk flags |

### How HVA Data Flows

```typescript
// In generate-bm-report-pass1/index.ts (line ~2722)
const { data: hvaData } = await supabaseClient
  .from('client_assessments')
  .select('responses, value_analysis_data')
  .eq('client_id', engagement.client_id)
  .eq('assessment_type', 'part3')
  .maybeSingle();

// Extract benchmarkable metrics
hvaMetricsForBenchmarking = extractHVAMetrics(hvaData);
// → Returns: {client_concentration_top3, knowledge_concentration, founder_brand_dependency, ...}

// Calculate founder risk
founderRisk = calculateFounderRisk(hvaData);
// → Returns: {riskLevel, overallScore, valuationImpact, riskFactors, ...}
```

---

## 4. COMPONENT MAP

### Admin Components (`src/components/benchmarking/admin/`)

| Component | Purpose | Data Used |
|-----------|---------|-----------|
| `BenchmarkingAdminView.tsx` | Main admin dashboard | `BenchmarkAnalysis` interface, HVA data |
| `ConversationScript.tsx` | Talking points for client meeting | `admin_opening_statement`, `admin_talking_points` |
| `RiskFlagsPanel.tsx` | Display risk flags with severity | `admin_risk_flags` |
| `DataCollectionPanel.tsx` | Collect missing metrics | `missingData[]`, `llmScripts[]` |
| `NextStepsPanel.tsx` | Next actions | `admin_next_steps`, `admin_tasks` |
| `ClientDataReference.tsx` | Quick stats sidebar | Revenue, employees, industry, surplus_cash |
| `AccountsUploadPanel.tsx` | Upload statutory accounts | `client_accounts_uploads` |
| `FinancialDataReviewModal.tsx` | Review extracted data | `client_financial_data` |
| `BenchmarkSourcesPanel.tsx` | Show data sources | `benchmark_sources_detail` |
| `QuickStatsBar.tsx` | Header stats | Overall percentile, opportunity |

### Client Components (`src/components/benchmarking/client/`)

| Component | Purpose | Data Used |
|-----------|---------|-----------|
| `BenchmarkingClientReport.tsx` | Main client report | `BenchmarkAnalysis` interface |
| `HeroSection.tsx` | Header with headline & percentile | `headline`, `overall_percentile`, `total_annual_opportunity` |
| `MetricComparisonCard.tsx` | Individual metric display | `bm_metric_comparisons` |
| `NarrativeSection.tsx` | Text narrative blocks | Position/strength/gap/opportunity narratives |
| `RecommendationsSection.tsx` | Recommendations list | `recommendations` |
| Hidden Value Section (inline) | Surplus cash, property, investments | `surplus_cash`, `balance_sheet` |
| Concentration Risk Section (inline) | Customer concentration warning | `client_concentration_top3`, `revenue` |

---

## 5. EDGE FUNCTIONS

### `generate-bm-report-pass1`
- **File:** `supabase/functions/generate-bm-report-pass1/index.ts` (3440 lines)
- **Trigger:** Manual or from frontend when generating report
- **Model:** GPT-4o-mini via OpenRouter (for admin guidance)
- **Key Functions:**
  - `enrichBenchmarkData()` - derive metrics from raw data
  - `calculateSurplusCash()` - surplus above operating requirements
  - `analyseFinancialTrends()` - multi-year trend detection
  - `detectInvestmentPattern()` - identify investment years
  - `calculateFounderRisk()` - HVA-derived risk score (0-100)
  - `extractHVAMetrics()` - pull benchmarkable values from HVA
  - `extractNarrativeQuotes()` - get client verbatims
  - `resolveIndustryFromSIC()` - map SIC to industry code
  - `detectInfrastructureContractor()` - special handling for telecom infra

### `generate-bm-report-pass2`
- **File:** `supabase/functions/generate-bm-report-pass2/index.ts` (518 lines)
- **Trigger:** Called after Pass 1 completes
- **Model:** Claude Opus 4 via OpenRouter (for narratives)
- **Key Function:** `buildPass2Prompt()` - constructs story-arc prompt with:
  - Client quotes (suspectedUnderperformance, leavingMoney, magicFix)
  - Pass 1 metrics and opportunity sizing
  - Financial trends context
  - Balance sheet context
  - Surplus cash context
  - Collected data (concentration, pricing, margins)
  - Industry-specific context (TELECOM_INFRA handling)

### `save-bm-supplementary-data`
- **File:** `supabase/functions/save-bm-supplementary-data/index.ts` (220 lines)
- **Trigger:** When admin saves collected data from Data Collection panel
- **Action:** Merges supplementary data into `bm_assessment_responses.responses` JSONB
- **Prefix:** Stores with `bm_supp_` prefix for identification

### `regenerate-bm-report`
- **File:** `supabase/functions/regenerate-bm-report/index.ts`
- **Trigger:** When admin clicks "Regenerate Analysis"
- **Action:** Calls Pass 1 then Pass 2 sequentially

---

## 6. DATA AVAILABILITY ASSESSMENT

### FOR DISCOVER (Hidden Value)

| Data Point | Status | Source | Notes |
|------------|--------|--------|-------|
| `surplus_cash` | ✅ Calculated & Stored | Pass 1 → `bm_reports.surplus_cash` | Full JSONB with breakdown |
| `surplus_cash` display | ⚠️ Partial | Admin sidebar, client report | Shows in hidden value section |
| `founder_risk_score` | ✅ Calculated & Stored | Pass 1 → `bm_reports.founder_risk_*` | From HVA data |
| `founder_dependency` | ✅ Available | HVA `knowledge_dependency_percentage` | Flows to risk calc |
| `competitive_moat` | ✅ Available | HVA `competitive_moat[]` | Not displayed in client report yet |
| `unique_methods` | ✅ Available | HVA `unique_methods` | Not displayed in client report yet |
| `freehold_property` | ✅ Calculated | Pass 1 → `bm_reports.balance_sheet` | From accounts extraction |
| `investments` | ✅ Calculated | Pass 1 → `bm_reports.balance_sheet` | From accounts extraction |

### FOR COMPARE (Benchmarking)

| Data Point | Status | Source |
|------------|--------|--------|
| Gross margin vs benchmark | ✅ Working | `bm_metric_comparisons` |
| Revenue per employee | ✅ Working | `bm_metric_comparisons` |
| EBITDA margin | ✅ Working | `bm_metric_comparisons` (after TELECOM_INFRA fix) |
| Debtor days | ✅ Working | `bm_metric_comparisons` |
| Client concentration | ⚠️ Needs work | Shows as risk card, not percentile |
| Net margin | ✅ Working | `bm_metric_comparisons` |
| Revenue growth | ✅ Working | `bm_metric_comparisons` |

### FOR EXPLORE (Scenarios) - NOT YET BUILT

| Data Point | Status | Notes |
|------------|--------|-------|
| Baseline financial data | ✅ Available | `client_financial_data`, `bm_reports.pass1_data` |
| Historical years | ✅ Available | `bm_reports.historical_financials` |
| Calculation utilities | ⚠️ Partial | `calculateSurplusCash`, trend analysis exist |
| Scenario models | ❌ Missing | Need: margin improvement, pricing, utilisation scenarios |
| Interactive sliders | ❌ Missing | No frontend components yet |
| Saved scenarios | ❌ Missing | No database table yet |

### FOR ACT (Service Pathway) - NOT YET BUILT

| Data Point | Status | Notes |
|------------|--------|-------|
| Service catalogue | ⚠️ Static only | `src/lib/advisory-services.ts`, `src/lib/service-lines.ts` |
| Service table in DB | ❌ Missing | No `services` table in Supabase |
| Issue→Service mapping | ❌ Missing | Recommendations generic, not linked |
| Service CTAs in report | ❌ Missing | No interactive booking/enquiry |
| Pricing tiers | ⚠️ Static only | In code, not database |

---

## 7. CALCULATION UTILITIES

### Surplus Cash Calculation (`calculateSurplusCash`)
```typescript
// Location: generate-bm-report-pass1/index.ts (line ~132)

interface SurplusCashAnalysis {
  hasData: boolean;
  actualCash: number | null;
  requiredCash: number | null;
  surplusCash: number | null;  // = actualCash - requiredCash
  surplusAsPercentOfRevenue: number | null;
  components: {
    operatingBuffer: number | null;     // 3 months fixed costs
    workingCapitalRequirement: number;  // debtors + stock - creditors
    staffCostsQuarterly: number | null;
    adminExpensesQuarterly: number | null;
    debtors: number | null;
    creditors: number | null;
    stock: number | null;
    netWorkingCapital: number | null;
  };
  methodology: string;
  narrative: string;
  confidence: 'high' | 'medium' | 'low';
}

// Formula:
// requiredCash = operatingBuffer + workingCapitalRequirement
// operatingBuffer = (staffCosts + adminExpenses) / 4  (3 months)
// workingCapitalRequirement = max(0, debtors + stock - creditors)
// surplusCash = max(0, actualCash - requiredCash)
```

### Founder Risk Calculation (`calculateFounderRisk`)
```typescript
// Location: generate-bm-report-pass1/index.ts (line ~1042)
// Also: src/lib/services/benchmarking/founder-risk-calculator.ts

// Scoring:
// - succession_your_role = 'Nobody': +25 points
// - autonomy_finance = 'Would fail': +15 points
// - risk_tech_lead = 'Crisis situation': +12 points
// - knowledge_dependency >= 80%: +15 points
// - personal_brand >= 85%: +12 points
// etc.

// Levels:
// score >= 60: 'critical', '30-50% valuation discount'
// score >= 40: 'high', '20-30% valuation discount'
// score >= 20: 'medium', '10-20% valuation discount'
// score < 20: 'low', 'Minimal valuation impact'
```

### Trend Analysis (`analyseFinancialTrends`)
```typescript
// Location: generate-bm-report-pass1/index.ts

interface TrendAnalysis {
  metric: string;
  direction: 'improving' | 'stable' | 'declining' | 'volatile';
  currentValue: number;
  priorValue: number;
  change: number;
  changePercent: number;
  isRecovering: boolean;  // Prior year was worse than year before
  narrative: string;
}

// Recovery detection:
// isRecovering = (twoYearsAgoGM && priorGM < twoYearsAgoGM && currentGM > priorGM)
```

### Impact Calculation
```typescript
// In Pass 1, for each metric gap:
annualImpact = Math.abs(gapPercentage / 100) * revenue;

// Example: 
// gapPercentage = -1.7 (client 16.3% vs median 18%)
// revenue = £63,000,000
// annualImpact = (1.7 / 100) * 63,000,000 = £1,071,000
```

---

## 8. SUPPLEMENTARY DATA COLLECTION

### How It Works

1. **Admin sees "Collect Data" tab** with missing metrics list
2. **LLM-generated scripts** guide conversation (from `admin_data_collection_script`)
3. **Admin enters values** - can be numeric or narrative text
4. **"Save Collected Data"** calls `save-bm-supplementary-data` Edge Function
5. **Data stored** in `bm_assessment_responses.responses` with `bm_supp_` prefix
6. **"Regenerate"** re-runs Pass 1 with new data → Pass 2

### Key Metric Definitions (in DataCollectionPanel.tsx)

| Metric | Code | Unit | Benchmark Range |
|--------|------|------|-----------------|
| Utilisation Rate | `utilisation_rate` | % | P25: 55%, P50: 71%, P75: 82% |
| Blended Hourly Rate | `blended_hourly_rate` | £/hr | P25: £75, P50: £95, P75: £125 |
| Average Project Margin | `avg_project_margin` | % | P25: 35%, P50: 45%, P75: 55% |
| Client Concentration | `client_concentration_top3` | % | P25: 25%, P50: 40%, P75: 60% |
| EBITDA Margin | `ebitda_margin` | % | P25: 10%, P50: 18%, P75: 25% |
| Debtor Days | `debtor_days` | days | P25: 30, P50: 45, P75: 60 |
| Creditor Days | `creditor_days` | days | P25: 20, P50: 30, P75: 45 |

---

## 9. INDUSTRY CLASSIFICATION

### Current Industries with Benchmarks

From benchmark_data seeding migrations:
- Professional Services (CONSULT, LEGAL, RECRUIT, ARCH)
- Technology (ITSERV, AGENCY_DEV, SAAS, AGENCY_MKT)
- Healthcare (DENTAL, VET, OPTICIAN)
- Hospitality (PUB, HOTEL, RESTAURANT)
- Construction (CONSTR_GEN, CONSTR_TRADE, PROPERTY)
- Retail (RETAIL_FASHION, RETAIL_FOOD)
- Manufacturing (MFG_FOOD, MFG_ENG)
- Wholesale/Logistics (WHSLE_GEN, LOGISTICS)
- Financial Services (IFA, MORTGAGE)
- Education/Charities (NURSERY, CHARITY)
- Creative (AGENCY_CREATIVE, PHOTO, FILM)
- **TELECOM_INFRA** (added 2026-01-31 for infrastructure contractors)

### Industry Detection Logic

```typescript
// In generate-bm-report-pass1/index.ts

// 1. Check for manual override
if (assessment.responses?.industry_override) {
  industryCode = assessment.responses.industry_override;
}

// 2. Map SIC code
const sicMap = {
  '62090': { primary: 'ITSERV', alternatives: ['AGENCY_DEV', 'TELECOM_INFRA'] },
  '42220': { primary: 'TELECOM_INFRA' },
  // ...
};

// 3. Detect infrastructure contractor pattern
if (sicCode === '62090') {
  const isInfra = detectInfrastructureContractor(
    businessDescription, subSector, responses,
    { grossMargin, revenuePerEmployee }
  );
  if (isInfra) industryCode = 'TELECOM_INFRA';
}

// 4. Verify industry exists in database
// 5. Fall back to CONSULT if all else fails
```

---

## 10. GAPS IDENTIFIED

### Missing Data / Not Flowing

| Gap | Impact | Priority |
|-----|--------|----------|
| Competitive moat not displayed | HVA data collected but not shown in client report | P2 |
| Unique methods not displayed | HVA data collected but not shown | P2 |
| Service linkage missing | Recommendations generic, not linked to specific services | P1 for ACT |
| Scenario calculations | No interactive "what if" modelling | P1 for EXPLORE |

### Missing Calculations

| Calculation | Needed For | Formula |
|-------------|------------|---------|
| Scenario projections | EXPLORE | Revenue at target utilisation, margin, pricing |
| Valuation estimate | DISCOVER | EBITDA multiple with risk adjustments |
| ROI on service | ACT | Cost vs expected improvement |

### Missing Components

| Component | Purpose | Priority |
|-----------|---------|----------|
| `ScenarioSlider.tsx` | Interactive what-if inputs | P1 for EXPLORE |
| `ScenarioResults.tsx` | Show projected outcomes | P1 for EXPLORE |
| `ServicePathwayCard.tsx` | Link issue to service with CTA | P1 for ACT |
| `CompetitiveMoatSection.tsx` | Display HVA moat data | P2 |
| `ValuationEstimate.tsx` | Show estimated business value | P2 |

### Missing Database

| Table | Purpose | Needed For |
|-------|---------|------------|
| `services` | Service definitions, pricing, features | ACT |
| `service_recommendations` | Link issues to services | ACT |
| `scenario_saves` | Saved scenario states per client | EXPLORE |

---

## 11. SERVICE CATALOGUE STATUS

### Current State
- **No database table** for services
- Services defined in TypeScript files:
  - `src/lib/service-lines.ts` - 10 BSG service lines
  - `src/lib/advisory-services.ts` - Detailed skill requirements

### Service List
1. Automation (£115-180/hour)
2. Business Intelligence (£2,000-8,000/month)
3. FFI / Advisory Accelerator (£2,500-5,000)
4. Benchmarking (£1,500-3,500)
5. Goal Alignment Programme (£1,500-4,500/month)
6. Systems Audit (£2,000-5,000)
7. Profit Extraction (£1,500-3,000)
8. Fractional CFO (£2,500-5,000/month)
9. Fractional COO (£2,500-5,000/month)
10. Combined CFO/COO (£4,000-8,000/month)

---

## 12. FILES TO MODIFY FOR FRAMEWORK

### DISCOVER (Surface Hidden Value)
- `src/components/benchmarking/client/BenchmarkingClientReport.tsx` - Add competitive moat section
- `src/components/benchmarking/admin/ClientDataReference.tsx` - Already has surplus cash
- `supabase/functions/generate-bm-report-pass2/index.ts` - Include moat in narrative

### COMPARE (Already Working)
- Minor fixes only (ordinal suffixes done, floating point done)

### EXPLORE (Interactive Scenarios)
**CREATE:**
- `src/components/benchmarking/client/ScenarioExplorer.tsx`
- `src/components/benchmarking/client/ScenarioSlider.tsx`
- `src/components/benchmarking/client/ScenarioResults.tsx`
- `src/utils/scenario-calculations.ts`
- `supabase/migrations/YYYYMMDD_scenario_saves.sql`

### ACT (Service Pathway)
**CREATE:**
- `supabase/migrations/YYYYMMDD_services_table.sql`
- `src/components/benchmarking/client/ServicePathway.tsx`
- `src/components/benchmarking/client/ServiceCard.tsx`
- `src/lib/issue-service-mapping.ts`

---

## 13. QUICK REFERENCE: INSTALLATION TECH DATA

**Engagement ID:** `3eddae86-d39b-478e-ae81-d73316bb5871`

| Field | Value | Source |
|-------|-------|--------|
| Company | Installation Technology | `practice_members` |
| Industry | TELECOM_INFRA | `bm_reports.industry_code` |
| Revenue | £63.3M | `client_financial_data` |
| Employees | 131 | Assessment |
| Revenue/Employee | £483k (top quartile) | Calculated |
| Gross Margin | 16.3% (45th percentile for TELECOM_INFRA) | `client_financial_data` |
| Client Concentration | 99% (Boldyn, Capita, GSTT) | Collected data |
| Surplus Cash | £7.4M | Calculated |
| Cash | £11.6M | `client_financial_data` |
| Debtor Days | 30 (excellent) | Collected/Override |
| Creditor Days | 30 | Collected/Override |

---

*This document provides the complete architectural context needed to implement the DISCOVER → COMPARE → EXPLORE → ACT framework.*

