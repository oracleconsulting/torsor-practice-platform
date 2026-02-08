# Benchmarking Component Summaries

> **COPY FILE - DO NOT EDIT**
> This is a reference document for Claude Project analysis.

---

## Admin Components (`src/components/benchmarking/admin/`)

### BenchmarkingAdminView.tsx
**Purpose:** Main admin dashboard for benchmarking engagements.
**Key Features:**
- Tab-based interface (Overview, Data, Opportunities, Value Analysis, Services)
- Engagement status tracking
- Report generation triggers
- Context notes management
- Supplementary data collection

### DataCollectionPanel.tsx
**Purpose:** Collect additional metrics during client conversations.
**Fields:**
- Utilisation rate
- Blended hourly rate
- Project margins
- Client concentration
- Debtor/creditor days

### ConversationScript.tsx
**Purpose:** Guided discovery questions for admin to ask client.
**Features:**
- Pre-written probing questions
- Links to data fields
- Suggested follow-ups

### OpportunityDashboard.tsx
**Purpose:** View and manage identified opportunities.
**Features:**
- Priority grouping (Must Address / Next 12 Months / When Ready)
- Severity indicators
- Service mapping display
- Financial impact
- Talking points for meetings

### ValueAnalysisPanel.tsx
**Purpose:** View and adjust value analysis.
**Features:**
- Baseline valuation display
- Suppressor management
- Exit readiness scoring
- Value bridge visualisation

### ServicePathwayPanel.tsx
**Purpose:** Service recommendations based on opportunities.
**Features:**
- Matched services list
- Service concept suggestions
- Pricing and scope

### AccountsUploadPanel.tsx
**Purpose:** Upload and manage client accounts.
**Features:**
- PDF upload
- Processing status
- Multi-year data display

### NextStepsPanel.tsx
**Purpose:** Engagement workflow management.
**Features:**
- Status transitions
- Action items
- Timeline

---

## Client Report Components (`src/components/benchmarking/client/`)

### BenchmarkingClientReport.tsx
**Purpose:** Main client-facing report component (~2000 lines).
**Sections:**
1. Hero - Headline, percentile, opportunity size
2. Executive Summary - AI-written narrative
3. Metrics Dashboard - Visual percentile comparisons
4. Strength Analysis - Top performing areas
5. Gap Analysis - Underperforming areas with £ impact
6. Value Analysis - Current vs potential business value
7. Exit Readiness - Component-level scoring
8. Scenario Planning - Interactive what-if calculator
9. Service Recommendations - Next steps
10. Technical Appendix - Data sources, methodology

### HeroSection.tsx
**Purpose:** Top banner with headline and key metrics.
**Displays:**
- AI-generated headline
- Overall percentile position
- Total annual opportunity
- Key statistics grid

### MetricComparisonCard.tsx
**Purpose:** Individual metric comparison display.
**Features:**
- Percentile bar visualisation
- Client value vs P25/P50/P75
- Annual impact calculation
- Gap/strength indicator

### NarrativeSection.tsx
**Purpose:** Display AI-written narrative sections.
**Supports:**
- Executive summary
- Position narrative
- Strength narrative
- Gap narrative
- Opportunity narrative

### ValueBridgeSection.tsx
**Purpose:** Visual value bridge from baseline to current.
**Shows:**
- Baseline valuation (EBITDA × multiple)
- Suppressor discounts (waterfall chart)
- Current market value
- Recoverable value
- Exit readiness score

### ScenarioPlanningSection.tsx
**Purpose:** Interactive what-if calculator.
**Scenarios:**
- Margin improvement
- Pricing power
- Cash optimisation
- Efficiency gains
- Customer diversification
- Exit readiness

### ServiceRecommendationsSection.tsx
**Purpose:** Display recommended services.
**Features:**
- Service cards with pricing
- Fit rationale
- Next steps

---

## Enhanced Components (Rolls Royce Features)

### CalculationBreakdown.tsx
**Purpose:** Show full calculation transparency.
**Displays:**
- Step-by-step calculation
- Assumptions with rationale
- Adjustments applied
- Interpretation text
- Caveats

### SurplusCashBreakdown.tsx
**Purpose:** Detailed surplus cash analysis.
**Shows:**
- Operating buffer calculation
- Working capital components
- Debtors/creditors/stock
- Net surplus
- Methodology notes

### EnhancedSuppressorCard.tsx
**Purpose:** Detailed suppressor display.
**Shows:**
- Current state (value, discount %)
- Target state (value, discount %)
- Recovery potential (£ and %)
- Evidence
- Path to fix (steps, investment, timeframe)
- Industry context

### ExitReadinessBreakdown.tsx
**Purpose:** Component-level exit readiness scoring.
**Components:**
- Customer concentration (25 pts)
- Founder dependency (25 pts)
- Succession planning (20 pts)
- Revenue predictability (15 pts)
- Documentation & governance (15 pts)

**Features:**
- Score bar per component
- Gap analysis
- Improvement actions
- Path to 70% readiness

### TwoPathsSection.tsx
**Purpose:** Connect operational and strategic improvements.
**Narrative:**
- Operational path (margin, cash, efficiency)
- Strategic path (concentration, founder, succession)
- Owner journey (Year 1, 2, 3)
- Bottom line message

---

## Shared Components

### TierSelector.tsx
**Purpose:** Select service tier (Basic/Standard/Premium).

### assessment/AdditionalQuestions.tsx
**Purpose:** Dynamic question rendering for assessment.

---

## Component File Locations

```
src/components/benchmarking/
├── admin/
│   ├── AccountsUploadPanel.tsx
│   ├── BenchmarkingAdminView.tsx
│   ├── BenchmarkSourcesPanel.tsx
│   ├── ClientDataReference.tsx
│   ├── ConversationScript.tsx
│   ├── DataCollectionPanel.tsx
│   ├── ExportAnalysisButton.tsx
│   ├── FinancialDataReviewModal.tsx
│   ├── NextStepsPanel.tsx
│   ├── OpportunityDashboard.tsx
│   ├── OpportunityPanel.tsx
│   ├── QuickStatsBar.tsx
│   ├── RiskFlagsPanel.tsx
│   ├── ServiceCreationModal.tsx
│   ├── ServicePathwayPanel.tsx
│   └── ValueAnalysisPanel.tsx
├── assessment/
│   └── AdditionalQuestions.tsx
├── client/
│   ├── BenchmarkingClientReport.tsx
│   ├── HeroSection.tsx
│   ├── MetricComparisonCard.tsx
│   ├── NarrativeSection.tsx
│   ├── RecommendationsSection.tsx
│   ├── ScenarioExplorer.tsx
│   ├── ScenarioPlanningSection.tsx
│   ├── ServiceRecommendationsSection.tsx
│   └── ValueBridgeSection.tsx
├── CalculationBreakdown.tsx
├── EnhancedSuppressorCard.tsx
├── ExitReadinessBreakdown.tsx
├── SurplusCashBreakdown.tsx
├── TierSelector.tsx
└── TwoPathsSection.tsx
```

---

*Last updated: 2026-02-04*
