# Benchmarking Service Line - Complete System Summary

## Overview

The Benchmarking Service Line provides SME business owners with quantified performance comparisons against industry peers, identifying specific £ opportunities for improvement.

---

## 1. Assessment Questions (Benchmarking Assessment)

The assessment collects data through the `bm_assessment_responses` table with responses stored in JSONB format. Field names use `bm_` prefix with spaces (e.g., `bm revenue exact`).

### Core Identity Fields
| Field | Type | Purpose |
|-------|------|---------|
| `bm sic code` | text | UK SIC code for industry classification |
| `bm sub sector` | text | Detailed description of their niche |
| `bm business description` | text | Client's own description of what they do |
| `bm industry suggestion` | select | Client's industry suggestion if standard options don't fit |
| `bm business age` | select | Business maturity (startup/1-3y/3-10y/10+y) |
| `bm location type` | select | Geography affecting benchmarks (London/Southeast/Regions) |

### Financial Data Fields
| Field | Type | Purpose |
|-------|------|---------|
| `bm revenue exact` | currency | Exact revenue (£63,000,000 format) |
| `bm employee count` | number | Headcount for efficiency calculations |
| `bm revenue band` | select | Revenue tier for benchmark matching |

### Behavioral/Perception Fields
| Field | Type | Purpose |
|-------|------|---------|
| `bm performance perception` | select | How they think they perform vs peers |
| `bm current tracking` | multi-select | What metrics they already track |
| `bm comparison method` | text | How they currently compare themselves |
| `bm suspected underperformance` | text | What they think is wrong |
| `bm leaving money` | text | Where they think they're losing £ |
| `bm top quartile ambition` | multi-select | Areas they want to be "top 25%" |
| `bm competitor envy` | text | What competitors do that they admire |
| `bm benchmark magic fix` | text | What would happen if they closed the gap |
| `bm blind spot fear` | text | What they're afraid they don't know |
| `bm action readiness` | select | Readiness to act on findings |

---

## 2. Database Tables

### Core Tables
```
bm_assessment_responses     - Raw assessment answers (JSONB responses field)
bm_reports                  - Generated reports with pass1_data, pass2_data, narratives
bm_engagements              - Links clients to benchmarking engagements
client_financial_data       - Uploaded accounts data (revenue, margins, etc.)
client_accounts_uploads     - File upload records for accounts documents
industries                  - Industry definitions with benchmark mappings
industry_benchmarks         - P25/P50/P75 values by industry/revenue band
benchmark_metrics           - Metric definitions (revenue_per_employee, etc.)
```

### Report Status Flow
```
pending → pass1_complete → generated → (optionally) confirmed
```

---

## 3. Edge Functions

### Report Generation Pipeline

#### `generate-bm-report-pass1` (2,276 lines)
**Purpose:** Data extraction, benchmark comparison, gap analysis
**Model:** Claude Sonnet 4
**Input:** Assessment data, HVA data, uploaded accounts, industry benchmarks
**Output:** `pass1_data` with:
- `classification` (industry, revenue band, employee band)
- `metricsComparison` (percentile positions for each metric)
- `topGaps` and `topStrengths`
- `opportunitySizing` (£ impact calculations)
- `riskFlags` (admin warnings)
- `missingData` (what needs collection)
- `discoveryQuestions` (conversation starters)
- `openingStatement` (script for practitioner)

**Key Functions:**
- `enrichBenchmarkData()` - Combines assessment + HVA + uploaded accounts
- `resolveIndustryFromSIC()` - Maps SIC codes to industry codes
- `detectIndustryFromContext()` - AI fallback for industry detection
- `calculateEmployeeBand()` - Determines size tier

#### `generate-bm-report-pass2` (296 lines)
**Purpose:** Narrative writing
**Model:** Claude Opus 4
**Input:** `pass1_data` from bm_reports
**Output:** `pass2_data` with narrative sections:
- `headline` - Under 25 words, includes £ opportunity
- `executiveSummary` - 3 paragraphs following story arc
- `positionNarrative` - Where they actually sit
- `strengthNarrative` - What they do well (credibility first)
- `gapNarrative` - Where they're behind (with £ costs)
- `opportunityNarrative` - What closing gaps means

#### `regenerate-bm-report`
**Purpose:** Triggers report regeneration from UI
**Flow:** Deletes existing report → Triggers Pass 1 → Returns immediately (frontend polls)

### Data Collection Functions

#### `save-bm-supplementary-data`
**Purpose:** Saves data collected by practitioners during conversations
**Input:** `{ engagementId, metricName, value }`
**Output:** Stored in `bm_assessment_responses.responses` with `bm_supp_` prefix

#### `upload-client-accounts`
**Purpose:** Handles file uploads (PDF/CSV/Excel)
**Flow:** Upload to storage → Create record → Trigger processing

#### `process-accounts-upload`
**Purpose:** Extract financial data from uploaded documents
**Flow:** Download file → Extract text → LLM analysis → Save to `client_financial_data`
**Note:** PDF extraction limited due to Deno edge function constraints

#### `delete-client-accounts`
**Purpose:** Clear uploaded accounts and extracted data
**Flow:** Delete from storage → Delete from `client_accounts_uploads` → Delete from `client_financial_data`

### Supporting Functions

#### `fetch-industry-benchmarks`
**Purpose:** Live search for industry benchmark data
**Cache:** 30-day refresh cycle
**Sources:** Industry reports, surveys, aggregated data

---

## 4. Industry Classification System

### The Problem: SIC Code Mapping

The `resolveIndustryFromSIC()` function maps SIC codes to industry codes:

```typescript
const sicMap: Record<string, string> = {
  '62020': 'AGENCY_DEV', // IT consultancy
  '62012': 'AGENCY_DEV', // Business software development
  '62090': 'AGENCY_DEV', // Other IT service activities ⚠️ TOO BROAD
  '62030': 'ITSERV',     // Computer facilities management
  // ...
};
```

**Current Issue:** SIC 62090 ("Other information technology service activities") maps to `AGENCY_DEV` (Software Development Agency), but this SIC code covers:
- Network infrastructure companies
- Telecoms contractors
- Systems integrators
- IT hardware installers
- Technical support services

### Industry Classification Flow

```
1. Check assessment.industry_code → Use if present
2. Check assessment.responses.industry_code → Use if present
3. Attempt SIC code mapping via resolveIndustryFromSIC()
4. If SIC maps, verify industry exists in database
5. If no SIC match, use AI classification via detectIndustryFromContext()
6. Error if no match possible
```

### Missing Industries for SIC 62090

The system needs additional industry codes for:
- `TELECOMS` - Telecoms/network infrastructure contractors
- `ITSERV` - IT services (facilities management exists but not general IT services)
- `SYSINT` - Systems integrators

### Client Data Showing the Problem

```
bm sic code: 62090
bm industry suggestion: Other  ← Client says standard options don't fit!
bm business description: "provider of large network infrastructure solutions 
                          focusing on wireless telephony, connectivity and 
                          data solutions to the railway, hospital and schools sectors"
```

This client is clearly NOT a "Software Development Agency" - they're a telecoms/infrastructure contractor.

---

## 5. Data Flow & Workflow

### Client Journey

```
                                    ┌─────────────────────┐
                                    │  Client completes   │
                                    │  Benchmarking       │
                                    │  Assessment         │
                                    └──────────┬──────────┘
                                               │
                           ┌───────────────────┼───────────────────┐
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
                    │ Assessment   │   │  HVA Part 3  │   │   Accounts   │
                    │ Responses    │   │  Responses   │   │   Upload     │
                    └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                           │                   │                   │
                           └───────────────────┼───────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │  Pass 1: Analysis   │
                                    │  (Claude Sonnet)    │
                                    │                     │
                                    │  • Industry mapping │
                                    │  • Benchmark lookup │
                                    │  • Gap calculation  │
                                    │  • £ opportunity    │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │  Pass 2: Narrative  │
                                    │  (Claude Opus)      │
                                    │                     │
                                    │  • Headline         │
                                    │  • Story arc        │
                                    │  • Recommendations  │
                                    └──────────┬──────────┘
                                               │
                       ┌───────────────────────┼───────────────────────┐
                       │                       │                       │
                       ▼                       ▼                       ▼
              ┌────────────────┐     ┌────────────────┐     ┌────────────────┐
              │  Admin View    │     │  Client View   │     │  PDF Export    │
              │                │     │                │     │  (future)      │
              │  • Conv guide  │     │  • Headline    │     │                │
              │  • Risk flags  │     │  • Metrics     │     │                │
              │  • Data gaps   │     │  • Insights    │     │                │
              │  • Collect UI  │     │  • Actions     │     │                │
              └────────────────┘     └────────────────┘     └────────────────┘
```

### Admin Workflow

1. **Pre-Analysis Tab**
   - View assessment responses
   - Upload client accounts (CSV/Excel preferred)
   - Review extracted financial data

2. **Analysis Tab (Admin View)**
   - Opening statement / conversation script
   - Risk flags requiring attention
   - Discovery questions to ask
   - Missing data indicators
   - Supplementary data collection forms

3. **Collect Data Tab**
   - Forms to record metrics gathered in conversation
   - Utilisation rate, hourly rates, project margins, etc.
   - Saves to `bm_assessment_responses.responses` with `bm_supp_` prefix

4. **Sources Tab**
   - Shows benchmark data sources
   - Confidence scores per metric
   - Live search vs static data indicators

5. **Client View Toggle**
   - Preview what client will see
   - Headline, metrics, narratives
   - Actionable recommendations

---

## 6. Frontend Components

### Admin Components (`src/components/benchmarking/admin/`)

| Component | Purpose |
|-----------|---------|
| `BenchmarkingAdminView.tsx` | Main admin dashboard orchestrator |
| `ConversationScript.tsx` | Opening statement and talking points |
| `RiskFlagsPanel.tsx` | Warning cards for admin attention |
| `DataCollectionPanel.tsx` | Forms for collecting missing metrics |
| `AccountsUploadPanel.tsx` | File upload and extraction status |
| `FinancialDataReviewModal.tsx` | Review/confirm extracted data |
| `BenchmarkSourcesPanel.tsx` | Data sources and confidence |
| `QuickStatsBar.tsx` | Summary metrics strip |
| `NextStepsPanel.tsx` | Recommended actions |
| `ClientDataReference.tsx` | Quick access to client data |

### Client Components (`src/components/benchmarking/client/`)

| Component | Purpose |
|-----------|---------|
| `BenchmarkingClientReport.tsx` | Main client-facing report |
| `HeroSection.tsx` | Headline and key number |
| `MetricComparisonCard.tsx` | Individual metric vs benchmark |
| `NarrativeSection.tsx` | Story-based insights |
| `RecommendationsSection.tsx` | Actionable next steps |

---

## 7. Key Metrics Tracked

### Financial Performance
- Revenue / Turnover
- Gross Profit & Margin %
- EBITDA & Margin %
- Net Profit & Margin %
- Revenue per Employee

### Operational Efficiency
- Utilisation Rate (billable %)
- Hourly/Daily Rates
- Project Margins
- Debtor Days
- Creditor Days

### Risk Indicators
- Client Concentration (top 3 %)
- Employee Turnover
- Founder Dependency (from HVA)

### Structural
- Billable vs Non-billable Headcount
- Overhead Ratio

---

## 8. Known Issues & Improvements Needed

### ⚠️ Industry Classification (CRITICAL)
- SIC 62090 maps too broadly to AGENCY_DEV
- Need additional industry codes: TELECOMS, SYSINT, IT_CONTRACTOR
- Should respect `bm industry suggestion: Other` flag
- Consider using AI classification when client indicates mismatch

### Field Name Inconsistency
- Assessment fields use spaces (`bm revenue exact`)
- Some code expects underscores (`bm_revenue_exact`)
- `parseMoneyString()` helper added to handle currency formatting

### PDF Parsing Limitations
- Deno edge functions can't use Node.js PDF libraries
- Companies House PDFs use complex encoding
- **Workaround:** Use CSV/Excel exports instead

### Uploaded Data Confirmation
- Data now used at ≥70% confidence even without confirmation
- Consider auto-confirm at high confidence levels

---

## 9. Fixing the Industry Classification

### Recommended Changes

1. **Add new industry codes to `industries` table:**
```sql
INSERT INTO industries (code, name, category, sic_codes, is_active) VALUES
('TELECOMS', 'Telecoms & Network Infrastructure', 'Technology', '{"61100","61200","61300","61900"}', true),
('SYSINT', 'Systems Integration', 'Technology', '{"62090"}', true),
('IT_CONTRACTOR', 'IT Contracting & Services', 'Technology', '{"62090"}', true);
```

2. **Update `resolveIndustryFromSIC()` to check business description first for ambiguous SIC codes:**
```typescript
// For ambiguous SIC codes, check description first
const ambiguousSICs = ['62090'];
if (ambiguousSICs.includes(sicCode) && businessDescription) {
  const desc = businessDescription.toLowerCase();
  if (desc.includes('network') || desc.includes('infrastructure') || desc.includes('telecoms')) {
    return 'TELECOMS';
  }
  if (desc.includes('systems integrat')) {
    return 'SYSINT';
  }
  // Fall back to AGENCY_DEV only if clearly software
  if (desc.includes('software') || desc.includes('app development')) {
    return 'AGENCY_DEV';
  }
}
```

3. **Respect client's industry suggestion:**
```typescript
// If client says "Other", use AI classification
if (assessment.responses?.['bm industry suggestion'] === 'Other') {
  return await detectIndustryFromContext(supabaseClient, sicCodes, businessDescription);
}
```

---

## 10. Testing Checklist

- [ ] Assessment submission flows through to report generation
- [ ] Uploaded accounts are extracted and available
- [ ] Industry classification uses correct benchmarks
- [ ] Missing data indicators show correct fields
- [ ] Supplementary data saves and persists
- [ ] Report regeneration picks up new data
- [ ] Client view shows correct metrics and formatting
- [ ] £ opportunities are calculated without double-counting
- [ ] Admin conversation script uses client's exact words

