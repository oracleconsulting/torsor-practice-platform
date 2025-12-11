# Discovery Assessment LLM Analysis Overview

## Summary

The Discovery Assessment system uses a combination of **rule-based scoring** and **AI-powered analysis** to evaluate client responses and generate personalized service recommendations.

---

## 1. Service Recommendation Engine

**File:** `supabase/functions/generate-service-recommendations/index.ts`

### Model
- **No LLM** - Uses rule-based scoring algorithm

### How It Works
1. **Scoring Weights**: Fetches pre-defined weights from `service_scoring_weights` database table
2. **Priority Boosts**: Applies boosts based on client's stated priorities
3. **Urgency Multiplier**: Adjusts scores based on urgency level (0.8x to 1.5x)

### Scoring Logic
```
Base Score = Sum of matching weights from service_scoring_weights table

Priority Boosts:
- "Financial clarity and control" → management_accounts, fractional_cfo, benchmarking
- "My business running without me" → systems_audit, fractional_coo, automation
- "Strategic direction and accountability" → 365_method, combined_advisory
- "Growing without growing problems" → systems_audit, fractional_coo, fractional_cfo
- "Protecting what I've built" → business_advisory, fractional_cfo
- "Better work-life balance" → 365_method, systems_audit, fractional_coo

Urgency Multipliers:
- "Critical - I can't continue like this": 1.5x
- "Important - within the next 3 months": 1.3x
- "Significant - within the next 6 months": 1.1x
- "Moderate - sometime this year": 1.0x
- "Low - whenever the time is right": 0.8x
```

### Emotional Anchor Extraction
Extracts key emotional anchors from responses:
- Five Year Vision
- Biggest Change wanted
- Tuesday Reality (frustrations)
- Core Feeling Desired
- Primary Obstacle

---

## 2. Discovery Report Generator

**File:** `supabase/functions/generate-discovery-report/index.ts`

### Model
- **anthropic/claude-3.5-sonnet** via OpenRouter API
- Max tokens: 8,192

### System Prompt
```
You are a senior business advisor at RPGCC, a boutique accountancy and advisory practice. 
You are analyzing a discovery assessment to produce a COMPREHENSIVE report for the practice team.

Your role is to:
1. Deeply understand what the client REALLY wants (their destination) - read between the lines
2. Identify ALL the gaps between where they are and where they want to be
3. Diagnose the ROOT CAUSES of their challenges (not just symptoms)
4. Map specific problems to specific services with detailed implementation plans
5. Frame every recommendation as an INVESTMENT with clear, quantified ROI

Key principles:
- Quote the client's EXACT WORDS frequently - they should see themselves in this report
- Be SPECIFIC - no generic advice. Reference their actual situation.
- QUANTIFY everything: hours saved, £ impact, timeline, payback period
- Explain HOW each service solves their specific problem
- Show the domino effect: fixing X enables Y which unlocks Z
- Make inaction feel like the RISKIER choice with concrete costs
- Connect emotional goals (freedom, family time) to practical solutions

Analysis depth requirements:
- Analyze EVERY response they gave, not just the obvious ones
- Look for patterns and connections between their answers
- Identify what they're NOT saying but implying
- Consider the interdependencies between their challenges
- Think about sequencing - what needs to happen first?

Writing style:
- Direct and confident, backed by specific evidence from their responses
- Empathetic but pragmatic - acknowledge feelings, provide solutions
- Use their language and metaphors back at them
- Create urgency without being pushy
```

### User Prompt Structure
The user prompt includes:

1. **Client Discovery Data** - Full JSON of all responses
2. **Important Context** - Notes that client is EXISTING client, we know their financials
3. **Financial Context** (if available):
   - Revenue, Gross Margin, Net Profit
   - Staff Count, Revenue/Head, Growth Rate
4. **Operational Context** (if available):
   - Years Trading, Years as Client
   - Business Type, Client Concentration
   - Observed Strengths/Challenges
5. **Pre-identified Patterns** (if pattern analysis was run)
6. **Analysis Approach** - 5-step methodology
7. **Available Services & ROI Data** - Full service definitions with pricing
8. **Required Output Format** - Detailed JSON schema

### Output JSON Structure
```json
{
  "executiveSummary": {
    "headline": "One powerful sentence",
    "situationInTheirWords": "Using EXACT quotes",
    "destinationVision": "What they want",
    "currentReality": "Where they are",
    "criticalInsight": "Key insight",
    "urgencyStatement": "Why act now"
  },
  "clientProfile": {
    "businessContext": "...",
    "ownerProfile": { "currentState", "emotionalState", "whatKeepsThemUp" },
    "strengthsIdentified": [],
    "blindSpots": []
  },
  "destinationAnalysis": {
    "fiveYearVision": "...",
    "coreEmotionalDrivers": [{ "driver", "evidence", "whatItMeans" }],
    "successMetrics": [],
    "lifestyleGoals": [],
    "timelineExpectations": "..."
  },
  "gapAnalysis": {
    "primaryGaps": [{
      "gap", "category", "severity", "evidence",
      "currentImpact": { "timeImpact", "financialImpact", "emotionalImpact" },
      "rootCause", "connectedGaps", "ifUnaddressed"
    }],
    "hiddenChallenges": [{ "challenge", "evidence", "potentialImpact" }],
    "costOfInaction": {
      "annualFinancialCost", "opportunityCost", "personalCost",
      "businessRisk", "compoundingEffect"
    }
  },
  "recommendedInvestments": [{
    "service", "code", "priority", "recommendedTier",
    "investment", "investmentFrequency", "annualInvestment",
    "whyThisTier",
    "problemsSolved": [{ "problem", "theirWords", "howWeSolveIt", "expectedResult" }],
    "implementationPlan": { "phase1", "phase2", "ongoing" },
    "expectedROI": { "multiplier", "timeframe", "calculation", "conservativeEstimate" },
    "expectedOutcomes": [{ "outcome", "timeline", "howMeasured" }],
    "riskOfNotActing"
  }],
  "serviceSequencing": {
    "recommendedOrder", "dependencies", "quickWins", "foundationalWork"
  },
  "investmentSummary": {
    "totalFirstYearInvestment", "breakdownByService",
    "projectedFirstYearReturn", "roiCalculation",
    "paybackPeriod", "netBenefitYear1", "comparisonToInaction"
  },
  "implementationRoadmap": [
    { "phase", "title", "actions": [{ "action", "owner", "outcome" }] }
  ],
  "successMilestones": [{ "milestone", "timeline", "significance" }],
  "closingMessage": { "personalNote", "callToAction", "urgencyReminder" }
}
```

### Critical Requirements (from prompt)
- Quote client's EXACT WORDS 8-10+ times
- Calculate specific £ figures for every cost/benefit
- Connect every recommendation to something they said
- Always recommend 2-3 services minimum
- Show the domino effect of fixing issues
- Make investment vs inaction comparison crystal clear

---

## 3. Service Line Definitions

Both systems use detailed service definitions:

| Service | Pricing | Typical ROI |
|---------|---------|-------------|
| **365 Alignment Programme** | Lite £1,500 / Growth £4,500 / Partner £9,000 | 3x in 12 months |
| **Fractional CFO** | £3,500-£15,000/month | 5x in 6 months |
| **Systems Audit** | £1,500-£4,000 + implementation | 4x in 3 months |
| **Management Accounts** | £650/month or £1,750/quarter | 10x in 2 months |
| **Fractional COO** | £3,000-£14,000/month | 4x in 6 months |
| **Combined CFO/COO** | £6,000-£28,000/month | 6x in 6 months |
| **Automation** | £115-£180/hour | 8x in 3 months |
| **Business Advisory** | £1,000-£4,000 per project | 10x in 12 months |
| **Benchmarking** | £450-£3,500 | 5x in 3 months |

---

## 4. Related LLM Functions

### Chat Completion
**File:** `supabase/functions/chat-completion/index.ts`
- **Simple queries:** `anthropic/claude-3-haiku-20240307`
- **Complex queries:** `anthropic/claude-sonnet-4-20250514`

### Process Client Context
**File:** `supabase/functions/process-client-context/index.ts`
- **Summary extraction:** `anthropic/claude-3-haiku-20240307`
- **Detailed analysis:** `anthropic/claude-3.5-sonnet`

### Generate Fit Profile
**File:** `supabase/functions/generate-fit-profile/index.ts`
- **Model:** `anthropic/claude-3.5-sonnet`

### Fit Assessment
**File:** `supabase/functions/fit-assessment/index.ts`
- **Model:** `anthropic/claude-3-haiku-20240307` (fast classification)

### Generate Value Proposition
**File:** `supabase/functions/generate-value-proposition/index.ts`
- **Model:** `anthropic/claude-3.5-sonnet`
- Service-specific prompts for Management Accounts, Systems Audit, Fractional CFO/COO

### Process Documents (Embeddings)
**File:** `supabase/functions/process-documents/index.ts`
- **Model:** `openai/text-embedding-3-small` via OpenRouter

### Generate Roadmap
**File:** `supabase/functions/generate-roadmap/index.ts`
- **Model:** `anthropic/claude-3.5-sonnet`

---

## 5. API Configuration

All LLM calls go through **OpenRouter API**:
- Base URL: `https://openrouter.ai/api/v1/chat/completions`
- Auth: `OPENROUTER_API_KEY` environment variable
- Headers: `HTTP-Referer: https://torsor.co.uk`, `X-Title: Torsor [Function Name]`

---

## 6. Discovery Question Categories

### Destination Discovery (dd_* questions)
- Five year vision/picture
- Biggest change wanted
- Success definition
- Honest assessment
- Key person risk
- Holiday reality
- Team confidence
- Change readiness
- Non-negotiables
- Owner hours
- Sleep thieves

### Service Diagnostics (sd_* questions)
- Financial confidence
- Plan clarity
- Exit timeline/readiness
- Growth blockers
- Double revenue obstacles
- Decision partners
- Accountability structures
- Problem awareness
- Manual work levels
- Operational frustrations

---

## 7. Data Flow

```
Client Completes Discovery Assessment
            ↓
generate-service-recommendations (Rule-based scoring)
            ↓
Service scores + Emotional anchors saved to DB
            ↓
Admin clicks "Generate Report"
            ↓
generate-discovery-report (Claude 3.5 Sonnet)
            ↓
Comprehensive JSON report saved to client_reports
            ↓
Report displayed in admin UI + optionally shared with client
```
