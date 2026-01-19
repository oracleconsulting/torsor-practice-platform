# Discovery Assessment System - Complete Reference

## Overview

The Discovery Assessment System is a 2-stage AI-powered analysis pipeline that:
1. Gathers comprehensive client data from 40 questions + uploaded documents
2. Generates personalized service recommendations using Claude AI

---

## Assessment Structure

### Part 1: Destination Discovery (25 Questions)

These questions explore the client's aspirations, current reality, and emotional state.

#### Section 1: Your Destination (5 questions)

| ID | Question Summary | Type | Service Link |
|----|-----------------|------|--------------|
| `dd_five_year_picture` | Picture yourself 5 years from now - describe a typical Tuesday | Text | 365_method, lifestyle_transformation |
| `dd_success_definition` | What does "success" mean for your business? | Single | exit_planning, 365_method |
| `dd_non_negotiables` | Non-negotiables for next chapter (up to 4) | Multi | lifestyle_assessment |
| `dd_what_would_change` | If money was no object, what ONE thing would you change? | Text | priority_detection |
| `dd_exit_thoughts` | Thoughts on stepping back from business | Single | business_advisory, exit_planning |

#### Section 2: Your Reality (7 questions)

| ID | Question Summary | Type | Service Link |
|----|-----------------|------|--------------|
| `dd_honest_assessment` | How close are you to your vision? | Single | gap_analysis |
| `dd_owner_hours` | Weekly working hours | Single | fractional_coo, burnout_detection |
| `dd_time_breakdown` | Firefighting vs strategic time % | Single | systems_audit, fractional_coo |
| `dd_holiday_reality` | Last 2+ weeks completely off | Single | burnout_detection |
| `dd_what_breaks_first` | What breaks if you double revenue? | Single | systems_audit, scaling_readiness |
| `dd_sleep_thief` | What keeps you awake at 3am? (up to 2) | Multi | emotional_anchor, risk_detection |
| `dd_biggest_frustration` | Main frustration with business | Text | core_pain_point |

#### Section 3: Your Team (5 questions)

| ID | Question Summary | Type | Service Link |
|----|-----------------|------|--------------|
| `dd_team_confidence` | Team confidence rating 1-10 | Single | fractional_coo, hiring_services |
| `dd_key_person_risk` | What if best person left? | Single | systems_audit, key_person_dependency |
| `dd_people_challenge` | Biggest people challenge | Single | fractional_coo |
| `dd_delegation_honest` | How good at delegating? | Single | fractional_coo, founder_dependency |
| `dd_team_secret` | What team doesn't know | Text | vulnerability_detection |

#### Section 4: Blind Spots (4 questions)

| ID | Question Summary | Type | Service Link |
|----|-----------------|------|--------------|
| `dd_avoided_conversation` | Conversation you've been avoiding | Text | hidden_challenge |
| `dd_hard_truth` | Hard truth reluctant to face | Text | vulnerability_detection |
| `dd_external_view` | What would spouse say about work-life? | Single | relationship_strain |
| `dd_if_i_knew` | "If I really knew my numbers, I'd discover..." | Text | financial_anxiety, management_accounts |

#### Section 5: Moving Forward (4 questions)

| ID | Question Summary | Type | Service Link |
|----|-----------------|------|--------------|
| `dd_priority_focus` | Magic wand - fix ONE area | Single | **PRIMARY SERVICE SELECTOR** |
| `dd_change_readiness` | Ready for real changes? | Single | implementation_likelihood |
| `dd_past_blockers` | What stopped changes before? (up to 3) | Multi | objection_handling |
| `dd_final_message` | Anything else to help us help you? | Text | open_insight |

---

### Part 2: Service Diagnostic (15 Questions)

These questions directly map to service recommendations.

#### Financial Clarity (3 questions)

| ID | Question Summary | Options → Service Mapping |
|----|-----------------|---------------------------|
| `sd_financial_confidence` | Confidence in financial data | Low confidence → **management_accounts**, **fractional_cfo** |
| `sd_numbers_action` | How often numbers change behavior | Rarely/Never → **management_accounts** |
| `sd_benchmark_awareness` | Know how you compare to peers | No → **benchmarking** |

#### Operational Freedom (3 questions)

| ID | Question Summary | Options → Service Mapping |
|----|-----------------|---------------------------|
| `sd_founder_dependency` | What if you disappeared for a month? | Chaos → **systems_audit**, **fractional_coo** |
| `sd_manual_work` | Time spent on manual work | >30% → **automation**, **systems_audit** |
| `sd_problem_awareness` | How quickly do you find out about issues? | Days/Blindsided → **systems_audit** |

#### Strategic Direction (3 questions)

| ID | Question Summary | Options → Service Mapping |
|----|-----------------|---------------------------|
| `sd_plan_clarity` | Clear 12-month plan? | No → **365_method** |
| `sd_accountability` | Who holds you accountable? | No one → **365_method**, **combined_advisory** |
| `sd_decision_partner` | Who do you discuss major decisions with? | No one → **combined_advisory**, **fractional_cfo** |

#### Growth Readiness (3 questions)

| ID | Question Summary | Options → Service Mapping |
|----|-----------------|---------------------------|
| `sd_growth_blocker` | Main growth blocker | Various → **multiple services** |
| `sd_double_revenue` | What breaks if revenue doubles? | Financial → **fractional_cfo**, Operations → **systems_audit** |
| `sd_operational_frustration` | Biggest operational frustration | Text analysis → **multiple services** |

#### Exit & Protection (3 questions)

| ID | Question Summary | Options → Service Mapping |
|----|-----------------|---------------------------|
| `sd_exit_readiness` | Can you produce docs in 48 hours? | Weeks/Months → **business_advisory** |
| `sd_valuation_clarity` | Know what business is worth? | No → **business_advisory** |
| `sd_exit_timeline` | Ideal exit timeline | 1-5 years → **business_advisory** |

---

## Service Line Definitions

| Code | Name | Typical Monthly | One-Off |
|------|------|-----------------|---------|
| `365_method` | 365 Alignment Programme | - | £1,500-9,000/year |
| `fractional_cfo` | Fractional CFO Services | £3,500-15,000 | - |
| `fractional_coo` | Fractional COO Services | £3,000-14,000 | - |
| `combined_advisory` | Combined CFO/COO | £6,000-28,000 | - |
| `management_accounts` | Management Accounts | £650 | £1,750/quarter |
| `systems_audit` | Systems Audit | - | £1,500-4,000 |
| `automation` | Automation Services | £1,500 retainer | £115-180/hour |
| `business_advisory` | Exit Planning & Advisory | - | £1,000-4,000 |
| `benchmarking` | Benchmarking Services | - | £450-3,500 |

---

## Special Detection Logic

### Capital Raising Detection

Triggers when ANY of these are true:
- `sd_growth_blocker` = "Don't have the capital"
- `dd_if_i_knew` contains "capital", "raise", "investors", "funding"
- `sd_exit_readiness` = "Yes - we're investment-ready"
- `sd_valuation_clarity` = "Yes - I've had a professional valuation"

**Impact:** Boosts `fractional_cfo`, `management_accounts`, `business_advisory` scores by 1.5x

### Burnout Detection

Triggers when ANY of these are true:
- `dd_owner_hours` = "60-70 hours" or "70+ hours"
- `dd_holiday_reality` = "More than 2 years ago" or "I've never done that"
- `dd_external_view` = "It's a significant source of tension" or "married to my business"

**Impact:** Boosts `fractional_coo`, `365_method` scores by 1.4x

### Lifestyle Transformation Detection

Triggers when:
- `dd_five_year_picture` describes fundamentally different role (investor, board, advisor)
- `dd_success_definition` = "Creating a business that runs profitably without me"
- Contains mentions of "investment CEOs", "portfolio", "step back"

**Impact:** Emphasizes identity transition in analysis, boosts `365_method`, `fractional_coo`

---

## 2-Stage Edge Function Architecture

### Why 2 Stages?

Supabase Edge Functions have a **60-second timeout**. The full analysis with Claude Opus takes ~90-120 seconds. Splitting into 2 stages keeps each under 60s.

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
                      ▼                   ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  STAGE 1 (~15-20 seconds)   │  │  STAGE 2 (~40-50 seconds)   │
│  prepare-discovery-data     │──│  generate-discovery-analysis│
│                             │  │                             │
│  • Fetch client info        │  │  • Build analysis prompt    │
│  • Fetch discovery data     │  │  • Call Claude Sonnet 4     │
│  • Fetch documents          │  │  • Parse JSON response      │
│  • Fetch financial context  │  │  • Save report to DB        │
│  • Run pattern detection    │  │  • Return analysis          │
│  • Return prepared package  │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

---

## Edge Function 1: prepare-discovery-data

**Purpose:** Gather all client data and run pattern detection

**Endpoint:** `POST /functions/v1/prepare-discovery-data`

**Input:**
```json
{
  "clientId": "uuid",
  "practiceId": "uuid",
  "discoveryId": "uuid",
  "skipPatternDetection": false
}
```

**Output:**
```json
{
  "success": true,
  "preparedData": {
    "client": { "id", "name", "email", "company", "practiceId" },
    "discovery": { "id", "responses", "extractedAnchors", "recommendedServices" },
    "documents": [{ "fileName", "dataSourceType", "content" }],
    "financialContext": { "revenue", "grossMarginPct", "netProfit", ... },
    "operationalContext": { "businessType", "industry", ... },
    "patternAnalysis": { "destinationClarity", "contradictions", "emotionalState", ... },
    "practice": { "name" }
  },
  "metadata": {
    "executionTimeMs": 15234,
    "documentsCount": 2,
    "hasPatternAnalysis": true
  }
}
```

**What It Does:**
1. Fetches client from `practice_members`
2. Fetches latest discovery from `destination_discovery`
3. Fetches documents from `document_embeddings` (reconstructs from chunks)
4. Fetches context from `client_context`
5. Fetches financial data from `client_financial_context`
6. Fetches operational data from `client_operational_context`
7. Calls `detect-assessment-patterns` for AI pattern analysis
8. Returns complete data package

---

## Edge Function 2: generate-discovery-analysis

**Purpose:** Generate comprehensive analysis using prepared data

**Endpoint:** `POST /functions/v1/generate-discovery-analysis`

**Input:**
```json
{
  "preparedData": { /* output from stage 1 */ }
}
```

**Output:**
```json
{
  "success": true,
  "report": {
    "id": "uuid",
    "generatedAt": "2024-12-12T17:00:00Z",
    "client": { "name", "company" },
    "discoveryScores": { "clarityScore": 8, "gapScore": 7 },
    "analysis": {
      "executiveSummary": { ... },
      "destinationAnalysis": { ... },
      "gapAnalysis": { ... },
      "recommendedInvestments": [ ... ],
      "investmentSummary": { ... },
      "implementationRoadmap": [ ... ],
      "closingMessage": { ... }
    }
  },
  "metadata": {
    "model": "anthropic/claude-sonnet-4-20250514",
    "executionTimeMs": 45000,
    "llmTimeMs": 42000
  }
}
```

**What It Does:**
1. Builds comprehensive prompt from prepared data
2. Calls Claude Sonnet 4 via OpenRouter
3. Parses JSON response
4. Saves report to `client_reports` table
5. Updates `destination_discovery.analysis_completed_at`
6. Returns formatted report

---

## Analysis Output Structure

```json
{
  "executiveSummary": {
    "headline": "Single powerful sentence",
    "situationInTheirWords": "2-3 sentences quoting them",
    "destinationVision": "Their goal",
    "currentReality": "Where they are",
    "criticalInsight": "Key insight they may not see",
    "urgencyStatement": "Why act now"
  },
  
  "destinationAnalysis": {
    "fiveYearVision": "Detailed future state",
    "coreEmotionalDrivers": [{
      "driver": "Freedom",
      "evidence": "exact quote",
      "whatItMeans": "interpretation"
    }],
    "lifestyleGoals": ["Family time", "Health"]
  },
  
  "gapAnalysis": {
    "primaryGaps": [{
      "gap": "No financial visibility",
      "category": "Financial",
      "severity": "critical",
      "evidence": "their quote",
      "currentImpact": {
        "timeImpact": "5 hours/week",
        "financialImpact": "£50,000/year",
        "emotionalImpact": "Constant anxiety"
      }
    }],
    "costOfInaction": {
      "annualFinancialCost": "£120,000 calculation breakdown",
      "personalCost": "Relationship strain, health impact",
      "compoundingEffect": "Gets 20% worse each year"
    }
  },
  
  "recommendedInvestments": [{
    "service": "Management Accounts",
    "code": "management_accounts",
    "priority": 1,
    "recommendedTier": "Monthly",
    "investment": "£650",
    "investmentFrequency": "per month",
    "whyThisTier": "Monthly visibility needed given current blindness",
    "problemsSolved": [{
      "problem": "No financial visibility",
      "theirWords": "I don't get meaningful management information",
      "howWeSolveIt": "Monthly P&L, cash flow, KPIs",
      "expectedResult": "Decision confidence within 30 days"
    }],
    "expectedROI": {
      "multiplier": "10x",
      "timeframe": "3 months",
      "calculation": "One prevented £6,500 mistake pays for a year"
    },
    "riskOfNotActing": "Continued blind decisions, potential cash crisis"
  }],
  
  "investmentSummary": {
    "totalFirstYearInvestment": "£15,800",
    "projectedFirstYearReturn": "£85,000",
    "paybackPeriod": "2 months",
    "comparisonToInaction": "Invest £15k or lose £120k"
  },
  
  "implementationRoadmap": [{
    "phase": "Week 1-2",
    "title": "Foundation",
    "actions": ["Onboarding call", "Systems access", "First draft accounts"]
  }],
  
  "closingMessage": {
    "personalNote": "Empathetic closing",
    "callToAction": "Book strategy call",
    "urgencyReminder": "Every month of delay costs £10k"
  }
}
```

---

## Database Tables Used

| Table | Purpose |
|-------|---------|
| `practice_members` | Client info |
| `destination_discovery` | Assessment responses |
| `document_embeddings` | Uploaded documents (chunked) |
| `client_context` | Additional context |
| `client_financial_context` | Known financials |
| `client_operational_context` | Operational data |
| `assessment_patterns` | AI pattern analysis cache |
| `client_reports` | Generated reports |
| `service_scoring_weights` | Question → Service scoring rules |

---

## Deployment Checklist

### Edge Functions to Deploy:

1. **prepare-discovery-data** - Stage 1 data gathering
2. **generate-discovery-analysis** - Stage 2 AI analysis
3. **detect-assessment-patterns** - Pattern detection (called by Stage 1)

### Environment Variables Required:

- `SUPABASE_URL` - Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key
- `OPENROUTER_API_KEY` - OpenRouter API key for Claude access

### Migrations to Run:

1. `20251212_assessment_patterns.sql` - Pattern analysis table
2. `20251212_report_jobs.sql` - Job tracking (optional)
3. `20251212_update_scoring_weights.sql` - Service scoring weights

---

## Refinements Implemented (December 2025)

### 1. Destination Clarity Score Fix
```typescript
// Fallback calculation when pattern detection unavailable
- Time specificity (0500, morning): +2-3 points
- Activities (wake, run, take, walk, play): +3 points
- Relationships (wife, boys, mates): +2 points
- Role transformation (invest, portfolio, CEO): +2 points
- Length/detail (100+ chars): +1-2 points

// Ben's vision scores 9/10:
"I wake up at 0500..." → time +2, activities +3, relationships +2, transformation +2 = 9
```

### 2. Investment Affordability & Phasing
```
Client Stage Detection:
- Pre-revenue: MVP, launch, product-market in frustrations
- Early-revenue: <£500k, "don't have capital"
- Established: £500k-£2M
- Scaling: £2M+

Phasing for Pre-Revenue:
- Phase 1 (Now): Max £15k/year → Systems Audit + Management Accounts
- Phase 2 (Post-raise): Fractional CFO, 365
- Phase 3 (At scale): Full fractional suite

HEADLINE: "Start with £11,800" NOT "Total investment £152k"
```

### 3. 365 Lifestyle Transformation Detection
```
Triggers (even if they have a business plan):
- lifestyleTransformation: Vision includes "invest", "portfolio", "investment CEOs"
- identityShift: Success = "legacy that outlasts me"
- burnoutWithReadiness: 60-70hrs + "completely ready for change"
- legacyFocus: Exit timeline 1-5 years

Position: "You have a plan. You don't have a path to becoming that person."
```

### 4. Financial Projections Integration
```
Extracts from uploaded documents:
- Revenue trajectory (Year 1-5)
- Gross margin
- Team growth
- Growth multiple

Calculates:
- Investment as % of Year 1 revenue
- Exit value delta (6x vs 12x multiple)
- Specific ROI using their projections

Example: "Phase 1 (£11,800) = 2.1% of Year 1 projected revenue"
```

### 5. Gap Score Calibration
```
Severity Weights:
- Critical: 3 points
- High: 2 points
- Medium: 1 point
- Low: 0.5 points

Normalization: (weightedSum / 17) × 10

Example:
- 2 critical (6) + 3 high (6) = 12 points
- Score: (12/17) × 10 = 7/10

Scale:
- 9-10: Crisis level
- 7-8: Significant gaps
- 5-6: Multiple gaps
- 3-4: Some gaps
- 1-2: Minor optimizations
```

### 6. Enhanced Closing Message
```
Detects and references:
- Vulnerabilities: imposter syndrome, fear, doubt
- Relationship strain: "tension", "given up complaining"
- Specific vision details: morning run, school pickup, Padel

Structure:
1. Acknowledge vulnerability (1-2 sentences)
2. Reframe current reality (2-3 sentences)
3. Hope with evidence (2-3 sentences)
4. Personal stakes, not business metrics (2-3 sentences)
5. Low-pressure next step (1-2 sentences)

Tone: "Ben, I want to be direct with you..."
NOT: "Dear Mr Stocken, thank you for completing..."
```

---

## Quality Assurance

### Key Requirements for Analysis:

1. **Quote client 10+ times** - Use their exact words
2. **Calculate specific £ figures** - Show ROI calculations
3. **Recommend 3+ services** - Most clients need combinations
4. **Show domino effect** - How services enable each other
5. **Investment vs. inaction** - Make comparison clear

### Destination Clarity Scoring:

- **9-10:** Vivid, time-anchored vision with emotional detail
- **7-8:** Clear direction with some specificity
- **5-6:** General goals lacking specificity
- **3-4:** Vague aspirations
- **1-2:** No clear vision or contradictory

---

*Document generated: December 2025*
*System version: 2.0 (2-stage architecture)*


