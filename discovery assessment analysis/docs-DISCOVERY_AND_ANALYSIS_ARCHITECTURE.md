# Discovery Assessment Analysis Architecture

**Last Updated:** February 2026  
**Version:** 2.0

---

## Overview

The Discovery and Analysis system transforms client assessment responses and uploaded financial documents into actionable insights, service recommendations, and strategic opportunities. The architecture follows a multi-pass pipeline that separates calculation from narration, ensuring consistency and auditability.

---

## 1. Discovery Assessment Analysis Pipeline

### 1.1 Data Sources

The analysis pipeline draws from three primary data sources:

| Source | Table | Content |
|--------|-------|---------|
| **Assessment Responses** | `destination_discovery.responses` | Client answers to 37 discovery questions (JSONB) |
| **Uploaded Documents** | `client_context` | Financial accounts, contracts, context documents |
| **Financial Extract** | `client_financial_context` | Parsed financial metrics from uploaded accounts |

### 1.2 Document Processing Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  File Upload    │ --> │  Edge Function   │ --> │  client_context     │
│  (PDF/CSV/XLSX) │     │  parse-document  │     │  (raw + extracted)  │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                │
                                v
                        ┌──────────────────┐
                        │  Claude Vision   │  (for complex PDFs)
                        │  or Text Extract │
                        └──────────────────┘
                                │
                                v
                        ┌──────────────────────────┐
                        │  client_financial_context │
                        │  (structured metrics)     │
                        └──────────────────────────┘
```

**Document Types Supported:**
- **PDF**: Text extraction + Claude Vision for complex layouts
- **CSV**: Direct text parsing + LLM analysis
- **XLSX/XLS**: Text extraction + LLM financial parsing

**Extracted Metrics Include:**
- Revenue (current + prior year)
- Gross profit/margin
- Operating profit/margin
- Net profit/margin
- Employee count
- Debtors/Creditors
- Cash/Net assets
- Freehold property (hidden asset detection)

### 1.3 Two-Pass Analysis Architecture

The discovery report follows a **"Calculate Once, Narrate Forever"** architecture:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          PASS 1: EXTRACTION & SCORING                   │
│  Edge Function: generate-discovery-report-pass1                         │
│  Model: None (pure calculation)                                         │
├─────────────────────────────────────────────────────────────────────────┤
│  • 8-Dimension Financial Analysis                                       │
│  • Pre-built verbatim phrases for Pass 2                               │
│  • Service scoring (rule-based)                                        │
│  • Emotional anchor extraction                                          │
│  • Destination clarity calculation                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    v
┌─────────────────────────────────────────────────────────────────────────┐
│                       PASS 2: NARRATIVE GENERATION                      │
│  Edge Function: generate-discovery-report-pass2                         │
│  Model: Claude Opus 4.5                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  • Receives pre-calculated metrics as MANDATORY                        │
│  • Generates 5-page client narrative                                   │
│  • Must use exact figures from Pass 1                                  │
│  • Creates gap analysis with diversity rules                           │
│  • Produces transformation journey with service mapping                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 The 8-Dimension Analysis (Pass 1)

Pass 1 calculates the following dimensions:

| Dimension | Interface | Key Metrics |
|-----------|-----------|-------------|
| **Valuation** | `ValuationAnalysis` | Operating profit, multiples (adjusted), enterprise value range, hidden assets |
| **Trajectory** | `TrajectoryAnalysis` | YoY revenue change, trend classification, concern level |
| **Payroll** | `PayrollAnalysis` | Staff costs %, benchmark comparison, annual excess |
| **Productivity** | `ProductivityAnalysis` | Revenue per head, implied vs actual headcount, excess employees |
| **Gross Margin** | `GrossMarginAnalysis` | Gross margin %, industry benchmark comparison |
| **Working Capital** | `WorkingCapitalAnalysis` | Debtor days, creditor days, stock days, cash conversion cycle |
| **Hidden Assets** | `HiddenAssetsAnalysis` | Freehold property, excess cash, total hidden value |
| **Exit Readiness** | `ExitReadinessAnalysis` | Score out of 100, factors (6), strengths, blockers |
| **Cost of Inaction** | `CostOfInactionAnalysis` | Time horizon, annual cost, component breakdown |
| **Achievements** | `AchievementAnalysis` | What client has done RIGHT (positive reinforcement) |

**Data Quality Assessment:**
- `comprehensive`: 6+ metrics available
- `partial`: 3-5 metrics available
- `limited`: <3 metrics available

### 1.5 Emotional Anchor Extraction

Pass 1 extracts emotional anchors from assessment responses for use in narrative:

```typescript
const emotionalAnchors = {
  tuesdayTest: responses.dd_five_year_vision,      // "What does Tuesday look like?"
  unlimitedChange: responses.dd_unlimited_change,   // "If you could change anything..."
  emergencyLog: responses.dd_emergency_log,         // "What are you called back for?"
  coreFrustration: responses.dd_core_frustration,   // "What frustrates you most?"
  hiddenFromTeam: responses.dd_hidden_from_team,    // "What don't they know?"
  avoidedConversation: responses.dd_avoided_conversation,  // "What conversation?"
  sacrificeList: responses.dd_sacrifice_list,       // "What have you given up?"
  neverHadBreak: boolean,                           // Special detection
};
```

### 1.6 Destination Clarity Score

Pre-calculated in Pass 1 (not LLM-generated):

```typescript
function calculateDestinationClarity(responses): DestinationClarityAnalysis {
  // Factors scored:
  // - Exit intent clarity (dd_exit_mindset)
  // - Timeline specificity (sd_exit_timeline)
  // - Vision articulation (dd_five_year_vision)
  // - Success definition (dd_success_definition)
  // - Financial target awareness (sd_valuation_understanding)
  
  return { score: 0-10, reasoning: string, factors: string[] };
}
```

---

## 2. Service Line Triggering & Matching

### 2.1 Discovery Service Scoring

The `scoreServicesFromDiscovery()` function evaluates each service line against assessment responses:

```typescript
interface ServiceScore {
  code: string;           // e.g., 'benchmarking', '365_method'
  name: string;
  score: number;          // 0-100
  confidence: number;     // Based on trigger count
  triggers: string[];     // Why this service was scored
  priority: 1 | 2 | 3 | 4;
  recommended: boolean;   // score >= 50
}
```

**Scoring Thresholds:**
| Score | Priority | Recommendation |
|-------|----------|----------------|
| 70+ | 1 (Critical) | ✅ Recommended |
| 50-69 | 2 (High) | ✅ Recommended |
| 30-49 | 3 (Medium) | ❌ Not recommended |
| <30 | 4 (Low) | ❌ Not recommended |

### 2.2 Service Trigger Examples

**Benchmarking & Hidden Value Analysis:**
```typescript
// Triggers for benchmarking service
if (responses.sd_valuation_understanding === 'Roughly - I have a sense') {
  scores.benchmarking.score += 25;
  scores.benchmarking.triggers.push('No baseline valuation');
}
if (payrollAnalysis?.annualExcess > 50000) {
  scores.benchmarking.score += 20;
  scores.benchmarking.triggers.push('Payroll efficiency concern');
}
```

**Goal Alignment Programme (365_method):**
```typescript
// Triggers for lifestyle/exit transformation
if (responses.dd_weekly_hours > 50) {
  scores['365_method'].score += 15;
  scores['365_method'].triggers.push('Working 50+ hours');
}
if (responses.dd_exit_mindset === 'Ready to exit' && 
    !responses.sd_exit_timeline?.includes('3-5')) {
  scores['365_method'].score += 20;
  scores['365_method'].triggers.push('Exit intent without roadmap');
}
```

**Systems Audit:**
```typescript
// Triggers for operational chaos
if (responses.sd_founder_dependency === 'Critical - business stops') {
  scores.systems_audit.score += 25;
  scores.systems_audit.triggers.push('Critical founder dependency');
}
if (responses.sd_documentation_readiness === 'Minimal') {
  scores.systems_audit.score += 15;
  scores.systems_audit.triggers.push('Poor documentation');
}
```

### 2.3 Pattern Detection

The system detects meta-patterns that affect scoring:

```typescript
interface DetectedPatterns {
  burnoutDetected: boolean;           // Hours + stress indicators
  capitalRaisingDetected: boolean;    // Investment language
  lifestyleTransformationDetected: boolean;
  urgencyMultiplier: number;          // 1.0-1.5 based on exit timeline
  founderDependencyLevel: 'low' | 'moderate' | 'critical';
}
```

### 2.4 Advisory Deep Dive (Stage 2)

The `advisory-deep-dive` Edge Function provides secondary service evaluation:

```typescript
function evaluateServiceTriggers(
  serviceCode: string,
  triggers: ServiceAdvisoryTrigger[],  // From database
  metrics: ExtractedMetrics,
  patterns: DetectedPatterns,
  responses: Record<string, any>
): EvaluatedTrigger[]
```

**Service Advisory Triggers Table:**
```sql
CREATE TABLE service_advisory_triggers (
  service_code TEXT,
  trigger_condition TEXT,      -- 'founder_risk_level:critical'
  trigger_type TEXT,           -- 'metric_threshold', 'response_match'
  relevance TEXT,              -- 'critical', 'high', 'medium', 'low'
  client_value_statement TEXT, -- What the client gets
  primary_service TEXT,        -- Main recommendation
  alternative_service TEXT     -- If primary blocked
);
```

### 2.5 Contraindication System

Services can be blocked based on client context:

```typescript
function checkContraindications(
  serviceCode: string,
  stage: BusinessStage,
  metrics: ExtractedMetrics,
  responses: Record<string, any>
): { blocked: boolean; warnings: string[]; alternatives: string[] }

// Example: Don't recommend fractional_cfo if they already have one
if (serviceCode === 'fractional_cfo' && metrics.hasCFO) {
  return { blocked: true, warnings: ['Client already has CFO'], alternatives: [] };
}
```

---

## 3. Opportunity Identification (Beyond Existing Services)

### 3.1 Benchmarking/HVA Opportunity Analysis (Pass 3)

The `generate-bm-opportunities` Edge Function uses Claude Opus 4.5 to identify opportunities **beyond** pre-defined service triggers:

```
┌──────────────────────┐
│  gather all data:    │
│  - Pass 1 analysis   │
│  - HVA responses     │
│  - MA data           │
│  - Assessment        │
└──────────┬───────────┘
           │
           v
┌──────────────────────┐     ┌──────────────────────┐
│  Claude Opus 4.5     │ --> │  Opportunity List    │
│  FREE-FORM ANALYSIS  │     │  (8-12 items)        │
└──────────────────────┘     └──────────────────────┘
           │
           v
┌──────────────────────┐     ┌──────────────────────┐
│  Service Matching    │ --> │  New Concept         │
│  (existing services) │     │  (if gap identified) │
└──────────────────────┘     └──────────────────────┘
```

### 3.2 Opportunity Categories

```typescript
type OpportunityCategory = 
  | 'risk'        // Existential threats (concentration, dependency)
  | 'efficiency'  // Operational improvements (utilisation, rates)
  | 'growth'      // Revenue/market expansion
  | 'value'       // Hidden assets, valuation enhancement
  | 'governance'; // Controls, documentation, compliance

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'opportunity';
```

### 3.3 Service Concepts Pipeline

When the LLM identifies a need that **no existing service addresses**, it creates a Service Concept:

```sql
CREATE TABLE service_concepts (
  suggested_name TEXT,           -- "Revenue Diversification Programme"
  problem_it_solves TEXT,        -- "99% concentration creates existential risk"
  suggested_deliverables JSONB,  -- ["Customer strategy", "New market entry"]
  suggested_pricing TEXT,        -- "£8,000-£15,000"
  
  -- Aggregation across clients
  times_identified INTEGER,      -- How many clients need this?
  total_opportunity_value DECIMAL,
  client_ids UUID[],             -- Which clients?
  
  -- Review workflow
  review_status TEXT,            -- 'pending' -> 'under_review' -> 'approved'
  created_service_id UUID        -- If approved, links to new service
);
```

### 3.4 Client Opportunities Table

Individual client opportunities are stored for tracking and follow-up:

```sql
CREATE TABLE client_opportunities (
  engagement_id UUID,
  opportunity_code TEXT,         -- 'concentration_critical'
  title TEXT,
  category TEXT,
  severity TEXT,
  
  -- Evidence
  data_evidence TEXT,            -- "99% revenue from top 3 clients"
  data_values JSONB,             -- {concentration: 99, revenue: 63000000}
  benchmark_comparison TEXT,
  
  -- Financial impact
  financial_impact_type TEXT,    -- 'risk', 'upside', 'cost_saving'
  financial_impact_amount DECIMAL,
  impact_calculation TEXT,       -- Show the working
  
  -- Service mapping
  recommended_service_id UUID,   -- Existing service
  OR
  suggested_concept_id UUID,     -- New concept needed
  
  -- Adviser tools
  talking_point TEXT,            -- Script for conversation
  question_to_ask TEXT,
  quick_win TEXT
);
```

### 3.5 Service Intelligence Learning Loop

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVICE INTELLIGENCE SYSTEM                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Client Analysis ──> Opportunity Identified ──> No Service Match?      │
│                                                       │                 │
│                                                       v                 │
│                                              Service Concept Created    │
│                                                       │                 │
│                                                       v                 │
│   Another Client ────> Same Opportunity ──> Concept Frequency ++        │
│                                                       │                 │
│                                                       v                 │
│   3+ Clients Need It? ─────────────> Admin Review ──> New Service       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.6 Service Opportunity Triggers (Auto-Detection)

When new services are created, triggers are defined for future auto-detection:

```sql
CREATE TABLE service_opportunity_triggers (
  service_id UUID,
  trigger_code TEXT,             -- 'concentration_high'
  trigger_type TEXT,             -- 'metric_threshold', 'hva_response'
  trigger_config JSONB,          -- {"metric": "client_concentration", "operator": ">", "value": 60}
  weight DECIMAL,                -- 0-1 importance
  severity_when_triggered TEXT,  -- 'critical'
  talking_point TEXT             -- Ready-to-use script
);

-- Example trigger configs:
-- metric_threshold: {"metric": "client_concentration_top3", "operator": ">", "value": 60}
-- hva_response: {"field": "succession_your_role", "values": ["Need to hire", "No successor"]}
-- combination: {"all": [trigger1, trigger2], "any": [trigger3]}
```

---

## 4. Simplified Benchmarking & Value Assessment in Discovery

### 4.1 Discovery vs Full Benchmarking

| Aspect | Discovery Assessment | Full Benchmarking/HVA |
|--------|---------------------|----------------------|
| **Data Depth** | Assessment responses + uploaded accounts | Full HVA questionnaire + MA data |
| **Industry Comparison** | Generic industry benchmarks | SIC-code specific peer comparison |
| **Valuation** | Indicative range (±30%) | Detailed multiple analysis |
| **Hidden Assets** | Basic detection | Full hidden value audit |
| **Analysis Time** | ~30 seconds | ~2-3 minutes |
| **Cost** | Included in discovery | £2,000 standalone |

### 4.2 Discovery Valuation Approach

```typescript
// Discovery uses simplified industry multiples
const INDUSTRY_MULTIPLES = {
  professional_services: { low: 4, high: 8 },
  wholesale: { low: 3, high: 5 },
  construction: { low: 3, high: 5 },
  manufacturing: { low: 4, high: 7 },
  default: { low: 3, high: 6 }
};

// Adjustments based on assessment signals
function calculateValuationAdjustments(signals: ValuationSignals) {
  let multiplierAdjustment = 0;
  
  if (signals.founderDependency === 'critical') multiplierAdjustment -= 1.5;
  if (signals.coreBusinessDeclining) multiplierAdjustment -= 1.0;
  if (signals.hasUnresolvedIssues) multiplierAdjustment -= 0.5;
  if (signals.marketPosition === 'leader') multiplierAdjustment += 1.0;
  
  return multiplierAdjustment;
}
```

### 4.3 Hidden Assets in Discovery

Discovery performs basic hidden asset detection:

```typescript
function detectHiddenAssets(financials: ExtractedFinancials): HiddenAsset[] {
  const assets: HiddenAsset[] = [];
  
  // Freehold property detection
  if (financials.freeholdProperty && financials.freeholdProperty > 0) {
    assets.push({
      type: 'freehold_property',
      value: financials.freeholdProperty,
      description: 'Freehold property on balance sheet',
      source: 'accounts'
    });
  }
  
  // Excess cash detection (simple threshold)
  if (financials.cash && financials.turnover) {
    const cashRatio = financials.cash / financials.turnover;
    if (cashRatio > 0.15) { // >15% of turnover
      const excessCash = financials.cash - (financials.turnover * 0.10);
      assets.push({
        type: 'excess_cash',
        value: excessCash,
        description: `Cash exceeds working capital needs by £${(excessCash/1000).toFixed(0)}k`,
        source: 'calculated'
      });
    }
  }
  
  return assets;
}
```

### 4.4 Benchmarking Pass 1 Value Calculator

The full benchmarking system uses a sophisticated value analysis with HVA-derived suppressors:

```typescript
interface ValueSuppressor {
  id: string;
  name: string;
  category: 'founder_dependency' | 'concentration' | 'documentation' | 'succession';
  hvaField: string;          // Which HVA question detected this
  hvaValue: string;          // What the client answered
  evidence: string;          // Human-readable explanation
  discountPercent: { low: number; high: number };  // e.g., 15-25%
  impactAmount: { low: number; high: number };     // £ impact
  severity: 'critical' | 'high' | 'medium' | 'low';
  remediable: boolean;
  remediationService?: string;  // Service that could fix this
}

// Example suppressor detection:
if (hva.knowledge_dependency_percentage > 70) {
  suppressors.push({
    id: 'founder_knowledge',
    name: 'Critical Knowledge Dependency',
    category: 'founder_dependency',
    hvaField: 'knowledge_dependency_percentage',
    hvaValue: hva.knowledge_dependency_percentage + '%',
    evidence: `${hva.knowledge_dependency_percentage}% of critical knowledge in founder's head`,
    discountPercent: { low: 20, high: 35 },
    severity: 'critical',
    remediable: true,
    remediationService: 'systems_audit'
  });
}
```

### 4.5 Industry Benchmarks in Benchmarking

Full benchmarking compares against SIC-code specific benchmarks:

```typescript
const VALUE_INDUSTRY_MULTIPLES = {
  'TELECOM_INFRA': { low: 4, mid: 5, high: 6, factors: ['Contract security', 'Customer concentration'] },
  'IT_SERVICES': { low: 5, mid: 7, high: 9, factors: ['Recurring revenue', 'Customer retention'] },
  'PROFESSIONAL_SERVICES': { low: 4, mid: 6, high: 8, factors: ['Recurring clients', 'Team stability'] },
  'CONSTRUCTION': { low: 3, mid: 4, high: 5, factors: ['Contract backlog', 'Equipment assets'] },
  // ... 20+ industry categories
};
```

---

## 5. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DISCOVERY ASSESSMENT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  destination_discovery.responses ─────────────────────────────────┐        │
│                                                                   │        │
│  client_context (uploaded docs) ──> parse-document ──> client_financial_context
│                                                                   │        │
│                                                                   v        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    PASS 1: Calculation                              │  │
│  │  • 8-dimension analysis    • Service scoring    • Emotional anchors │  │
│  │  • Destination clarity     • Hidden assets      • Verbatim phrases  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    v                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    PASS 2: Narrative (Claude Opus 4.5)              │  │
│  │  • 5-page client report    • Gap analysis       • Journey phases    │  │
│  │  • Investment summary      • Next steps         • Closing message   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    v                                       │
│                         discovery_reports table                            │
│                                    │                                       │
│                    ┌───────────────┴───────────────┐                      │
│                    v                               v                      │
│             Admin Portal                    Client Portal                  │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                        BENCHMARKING / HVA ASSESSMENT                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  bm_assessments (benchmarking questions) ─────────────────────────┐        │
│  hva_responses (hidden value questions) ──────────────────────────┤        │
│  ma_data (management accounts) ───────────────────────────────────┤        │
│  client_financial_context ────────────────────────────────────────┤        │
│                                                                   v        │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    PASS 1: Analysis                                 │  │
│  │  • Industry classification • Peer benchmarking  • Trend analysis   │  │
│  │  • Surplus cash calc       • Value suppressors  • Direction context│  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    v                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    PASS 2: Narrative (Claude Sonnet 4)              │  │
│  │  • Benchmarking narrative  • Peer comparisons   • Key findings     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                                    v                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    PASS 3: Opportunities (Claude Opus 4.5)          │  │
│  │  • Free-form analysis      • Service matching   • New concepts     │  │
│  │  • Talking points          • Quick wins         • Financial impact │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                       │
│                    ┌───────────────┴───────────────┐                      │
│                    v                               v                      │
│           bm_reports table              client_opportunities              │
│                    │                    service_concepts                   │
│                    v                                                       │
│             Admin Portal                                                   │
│                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Key Tables Reference

| Table | Purpose |
|-------|---------|
| `destination_discovery` | Client discovery assessment responses |
| `client_context` | Uploaded documents (raw) |
| `client_financial_context` | Extracted financial metrics |
| `discovery_reports` | Generated discovery reports (5-page format) |
| `discovery_engagements` | Engagement workflow status |
| `bm_assessments` | Benchmarking questionnaire responses |
| `bm_reports` | Generated benchmarking reports |
| `bm_engagements` | Benchmarking engagement workflow |
| `client_opportunities` | Individual client opportunities |
| `service_concepts` | Emerging service ideas pipeline |
| `services` | Active service catalogue |
| `service_opportunity_triggers` | Auto-detection rules for services |
| `service_line_metadata` | Service descriptions, pricing, deliverables |

---

## 7. Edge Functions Reference

| Function | Stage | Model | Purpose |
|----------|-------|-------|---------|
| `parse-document` | Pre | - | Extract text from uploaded documents |
| `process-accounts-upload` | Pre | Claude Vision | Parse financial accounts (PDF/CSV) |
| `generate-discovery-report-pass1` | Discovery | None | Calculate 8 dimensions, score services |
| `generate-discovery-report-pass2` | Discovery | Opus 4.5 | Generate 5-page narrative |
| `generate-service-recommendations` | Discovery | - | Rule-based service scoring |
| `advisory-deep-dive` | Discovery | Sonnet 4 | Secondary service evaluation |
| `generate-bm-report-pass1` | Benchmarking | Sonnet 4 | Industry analysis, value calculation |
| `generate-bm-report-pass2` | Benchmarking | Sonnet 4 | Benchmarking narrative |
| `generate-bm-opportunities` | Benchmarking | Opus 4.5 | Free-form opportunity analysis |
| `generate-value-analysis` | Benchmarking | Sonnet 4 | Detailed valuation with suppressors |
| `create-service-from-opportunity` | Admin | Opus 4.5 | Convert opportunity to new service |

---

## 8. Future Enhancements

1. **Automated Trigger Learning**: Track which triggers lead to closed engagements
2. **Service Concept Velocity**: Alert when concept frequency exceeds threshold
3. **Cross-Client Pattern Detection**: Identify industry-wide trends
4. **Benchmark Data Refresh**: Live benchmark data from external sources
5. **Client Outcome Tracking**: Measure actual vs predicted impact

---

*This document is auto-maintained. Last code review: February 2026*
