# Benchmarking Opportunity Analysis System

## Overview

The opportunity analysis system is **Pass 3** of the benchmarking report generation pipeline. It takes all available client data and uses Claude Opus 4.5 to identify actionable opportunities, map them to services, and generate adviser-ready talking points.

**Location:** `supabase/functions/generate-bm-opportunities/index.ts`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PASS 3 FLOW                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. GATHER DATA                                                      │
│     ├── Pass 1 data (metrics, financials, enriched values)          │
│     ├── Pass 2 narratives (executive summary, position, etc.)       │
│     ├── HVA assessment (founder risk, business direction)           │
│     ├── Context notes (advisor conversation notes)                  │
│     └── Advisor selections (pinned/blocked services)                │
│                                                                      │
│  2. BUILD LLM PROMPT                                                 │
│     ├── System prompt (philosophy, what to look for, output format) │
│     └── User prompt (all client data, service catalogue, concepts)  │
│                                                                      │
│  3. LLM ANALYSIS (Claude Opus 4.5)                                  │
│     └── Returns JSON with opportunities, scenarios, assessment      │
│                                                                      │
│  4. POST-PROCESSING                                                  │
│     ├── Consolidate duplicate themes                                │
│     ├── Sanitize financial impacts (cap at % of revenue)            │
│     ├── Filter blocked services (context-aware)                     │
│     ├── Add context-driven suggestions                              │
│     ├── Add pinned services from advisor                            │
│     ├── Adjust priorities for business direction                    │
│     ├── Force must_address_now for existential risks                │
│     └── Cap at 12 opportunities max                                 │
│                                                                      │
│  5. GENERATE RECOMMENDED SERVICES                                    │
│     └── Build client-facing "How We Can Help" section               │
│                                                                      │
│  6. STORAGE                                                          │
│     ├── client_opportunities table                                  │
│     ├── service_concepts table (new service ideas)                  │
│     └── bm_reports (recommended_services, opportunity_assessment)   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Structures

### Input: ClientData

```typescript
interface ClientData {
  engagementId: string;
  clientId: string;
  clientName: string;
  industryCode: string | null;
  pass1Data: any;              // Metrics, financials, enriched values
  pass2Narratives: any;        // Executive summary, position narrative, etc.
  assessment: any;             // Assessment responses
  hva: any;                    // Hidden Value Audit responses
  metrics: any[];              // Benchmark comparisons
  founderRisk: any;            // Founder dependency analysis
  supplementary: any;          // Additional data (accounts, etc.)
  directionContext: DirectionContext;    // Business direction, roles, etc.
  contextNotes: ContextNote[];           // Advisor conversation notes
  clientPreferences: ClientPreferences;  // Extracted from context notes
  pinnedServices: string[];              // Advisor-selected services
  manuallyBlockedServices: string[];     // Advisor-blocked services
}
```

### Direction Context

```typescript
interface DirectionContext {
  leadershipStructure: string;
  existingRoles: string[];
  hasCFO: boolean;
  hasCOO: boolean;
  hasNED: boolean;
  businessDirection: string;    // 'grow_aggressive', 'step_back', 'unsure', etc.
  exitTimeline: string | null;
  investmentPlans: string[];
  lastPriceIncrease: string;
  pricingConfidence: string | null;
  leadershipEffectiveness: string;
  recentConversations: string[];
}
```

### Client Preferences (Extracted from Context Notes)

```typescript
interface ClientPreferences {
  prefersExternalSupport: boolean;    // Prefers consultants over hires
  prefersProjectBasis: boolean;       // Prefers projects over ongoing
  avoidsInternalHires: boolean;       // Explicitly avoids fractional roles
  needsDocumentation: boolean;        // Documentation gaps identified
  needsSystemsAudit: boolean;         // Loose structure mentioned
  hasSuccessionConcerns: boolean;     // Exit/succession timeline mentioned
  explicitServiceBlocks: string[];    // Services explicitly not wanted
  suggestedServices: string[];        // Services suggested by patterns
  rawNotes: string[];                 // Original note content
}
```

### Output: Opportunity

```typescript
interface Opportunity {
  code: string;                 // Unique identifier e.g. "concentration_critical"
  title: string;                // Human-readable title
  category: string;             // 'risk' | 'efficiency' | 'growth' | 'value' | 'governance'
  severity: string;             // 'critical' | 'high' | 'medium' | 'low' | 'opportunity'
  priority: string;             // 'must_address_now' | 'next_12_months' | 'when_ready'
  dataEvidence: string;         // Specific numbers from the data
  dataValues: object;           // Raw values for reference
  benchmarkComparison: string;  // How they compare to peers
  
  financialImpact: {
    type: string;               // 'risk' | 'upside' | 'cost_saving' | 'value_creation'
    amount: number;             // Monetary value
    confidence: string;         // 'high' | 'medium' | 'low'
    calculation: string;        // Show working
  };
  
  lifeImpact: string;           // What this means for the owner personally
  
  serviceMapping: {
    existingService?: {
      code: string;
      fitScore: number;         // 1-100
      rationale: string;
      limitation?: string;
    };
    newConceptNeeded?: {
      suggestedName: string;
      problemItSolves: string;
      suggestedDeliverables: string[];
      suggestedPricing: string;
      suggestedDuration: string;
      skillsRequired: string[];
      gapVsExisting: string;
      marketSize: string;       // 'niche' | 'moderate' | 'broad'
    };
  };
  
  adviserTools: {
    talkingPoint: string;       // Natural conversation script
    questionToAsk: string;      // Follow-up discovery question
    quickWin: string;           // Something they can do this week
  };
}
```

---

## Key Functions

### 1. gatherAllClientData()

Collects all available data for the client:
- Fetches engagement, report, and client records
- Extracts Pass 1 data (metrics, financials)
- Gets Pass 2 narratives
- Fetches context notes from advisor conversations
- Extracts client preferences from notes
- Gets pinned/blocked services from advisor

### 2. extractClientPreferences()

Parses context notes to identify patterns:
- Preference for external support vs internal hires
- Project-based vs ongoing engagement preferences
- Documentation/systems audit needs
- Succession/exit timeline concerns
- Explicit service blocks

### 3. buildSystemPrompt()

Creates the persona and instructions for the LLM:

**Philosophy:**
- "Sell destinations, not services"
- Connect every recommendation to owner's life goals
- Be specific with numbers, not vague

**What to Look For:**
- Existential risks (concentration, key person dependency)
- Hidden value (surplus cash, IP, relationships)
- Operational friction (cash collection, utilisation)
- Growth constraints (founder bottleneck, capacity)
- Exit readiness (what would concern a buyer)
- Personal goals gap (stated vs actual situation)

**Output Quality:**
- Sound human, not like a consulting deck
- Quantify everything (£2.3M, not "significant")
- Be direct about severity
- UK English (turnover not sales, profit not earnings)

### 4. buildUserPrompt()

Assembles all client data into a structured prompt:
- Financials summary (revenue, margins, trends)
- Benchmark comparisons
- HVA scores (founder risk, team advocacy)
- Balance sheet highlights
- Client preferences (extracted from notes)
- Service catalogue
- Existing service concepts

**Key Constraints:**
- 8-12 opportunities MAX
- Consolidation rules (ONE opportunity per theme)
- Financial impact capping (30% revenue max for critical)
- Aim for 3-5 new service concepts

### 5. postProcessOpportunities()

Multi-step post-processing of LLM output:

1. **Consolidate** - Merge duplicate themes
2. **Sanitize** - Cap financial impacts at sensible % of revenue
3. **Filter** - Remove blocked services based on context
4. **Add Context** - Include suggestions from advisor notes
5. **Add Pinned** - Include advisor-selected services
6. **Prioritize** - Adjust based on business direction
7. **Force Priority** - Existential risks always must_address_now
8. **Sort** - By priority, then severity, then impact
9. **Cap** - Maximum 12 opportunities

### 6. consolidateOpportunities()

Groups opportunities by theme and merges duplicates:

**Protected Themes (kept separate):**
- `concentration_risk` - Customer concentration
- `succession_gap` - Exit/succession planning

**Merged Themes:**
- `pricing_margin` - All margin/pricing issues → one opportunity
- `working_capital` - All cash flow issues → one opportunity
- `founder_risk` - All founder dependency issues → one opportunity

### 7. filterBlockedServices()

Context-aware service blocking:

```typescript
// Example: Block Fractional COO if...
{
  serviceCode: 'FRACTIONAL_COO',
  blockIf: (ctx, prefs) => 
    ctx.hasCOO ||                        // Already has one
    prefs.prefersExternalSupport ||      // Prefers consultants
    prefs.prefersProjectBasis ||         // Prefers projects
    prefs.avoidsInternalHires,           // Explicitly avoids
  blockReason: (ctx, prefs) => {
    if (ctx.hasCOO) return 'Already has Operations Director';
    if (prefs.avoidsInternalHires) return 'Prefers external support';
    // etc.
  }
}
```

### 8. generateRecommendedServices()

Builds the "How We Can Help" section:
- Groups opportunities by service code
- Remaps blocked services to alternatives (e.g., COO → Systems Audit)
- Calculates total value at stake per service
- Builds personalised "Why This Matters" from opportunity data
- Enriches with Systems Audit founder data if applicable

### 9. storeOpportunities()

Persists results to database:
- Deletes existing opportunities for engagement (fresh start)
- Links to existing services (increments `times_recommended`)
- Creates or updates service concepts (new ideas)
- Stores all opportunity fields to `client_opportunities` table

---

## Database Schema

### client_opportunities

```sql
CREATE TABLE client_opportunities (
  id UUID PRIMARY KEY,
  engagement_id UUID NOT NULL,
  client_id UUID NOT NULL,
  
  -- Identity
  opportunity_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,        -- risk, efficiency, growth, value, governance
  severity TEXT NOT NULL,        -- critical, high, medium, low, opportunity
  priority TEXT,                 -- must_address_now, next_12_months, when_ready
  
  -- Evidence
  data_evidence TEXT NOT NULL,
  data_values JSONB,
  benchmark_comparison TEXT,
  
  -- Financial Impact
  financial_impact_type TEXT,
  financial_impact_amount DECIMAL(12,2),
  financial_impact_confidence TEXT,
  impact_calculation TEXT,
  
  -- Service Mapping
  recommended_service_id UUID,   -- Link to existing service
  service_fit_score INTEGER,
  service_fit_rationale TEXT,
  suggested_concept_id UUID,     -- Link to new concept
  
  -- Adviser Tools
  talking_point TEXT,
  question_to_ask TEXT,
  quick_win TEXT,
  life_impact TEXT,
  
  -- Tracking
  display_order INTEGER,
  priority_rationale TEXT,
  priority_adjusted BOOLEAN,
  consolidated_from TEXT[],
  
  -- Metadata
  llm_model TEXT,
  generated_at TIMESTAMPTZ
);
```

### service_concepts

```sql
CREATE TABLE service_concepts (
  id UUID PRIMARY KEY,
  suggested_name TEXT NOT NULL,
  suggested_category TEXT,
  problem_it_solves TEXT,
  suggested_deliverables JSONB,
  suggested_pricing TEXT,
  suggested_duration TEXT,
  skills_likely_required JSONB,
  gap_vs_existing TEXT,
  market_size_estimate TEXT,
  
  -- Tracking
  times_identified INTEGER DEFAULT 1,
  client_ids UUID[],
  total_opportunity_value DECIMAL,
  
  -- Review
  review_status TEXT DEFAULT 'pending',
  development_priority TEXT
);
```

### bm_reports (relevant columns)

```sql
-- Added by Pass 3
recommended_services JSONB,        -- Array of RecommendedService
not_recommended_services JSONB,    -- Blocked services with reasons
opportunity_assessment JSONB,      -- Overall assessment
scenario_suggestions JSONB,        -- Suggested scenarios
opportunities_generated_at TIMESTAMPTZ
```

---

## Opportunity Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `risk` | Existential or significant business risks | Customer concentration, key person dependency |
| `efficiency` | Operational improvements | Cash collection, utilisation, systems |
| `growth` | Revenue/market expansion opportunities | Pricing, diversification, market positioning |
| `value` | Exit/valuation related | Founder de-risking, documentation, IP |
| `governance` | Structure/leadership | Board advisory, succession planning |

---

## Severity Levels

| Severity | Criteria | Priority Implication |
|----------|----------|----------------------|
| `critical` | Existential risk, >60% concentration, >70% founder dependency | Always `must_address_now` |
| `high` | Significant impact, needs attention within 6 months | Usually `must_address_now` |
| `medium` | Notable but not urgent | Usually `next_12_months` |
| `low` | Optimisation opportunity | Usually `when_ready` |
| `opportunity` | Positive development potential | `when_ready` |

---

## Priority Levels

| Priority | Description | Adjusted Based On |
|----------|-------------|-------------------|
| `must_address_now` | Existential risks requiring immediate attention | Forced for concentration >80%, founder dependency >70% |
| `next_12_months` | Important but not urgent | Default for high severity |
| `when_ready` | Nice to have, do when capacity allows | Step-back direction, low severity |

---

## Service Intelligence

The system learns from every client:

1. **Service Recommendations** - Tracks which services are recommended most
2. **New Concepts** - Surfaces gaps in service catalogue
3. **Concept Frequency** - Concepts seen multiple times = higher priority to build
4. **Total Opportunity Value** - Aggregates value across clients per concept

---

## Key Design Decisions

1. **One Pass, Multiple Outputs** - Single LLM call generates opportunities, scenarios, and assessment

2. **Post-Processing > Prompt Engineering** - Heavy post-processing allows deterministic control over final output

3. **Context-Aware Blocking** - Services blocked based on what we know about client preferences, not just what they already have

4. **Theme Consolidation** - Prevents LLM from generating multiple variations of the same issue

5. **Protected Themes** - Some themes (concentration, succession) are too important to merge

6. **Financial Impact Capping** - Prevents unrealistic values that undermine credibility

7. **Deterministic Enrichment** - Systems Audit enrichment uses calculated values, not LLM-generated

8. **Internal Notes Sanitisation** - Context notes inform analysis but never appear in client output

---

## Replication Checklist for Discovery

To implement similar functionality for Discovery Assessment:

- [ ] Define opportunity categories relevant to discovery (different from benchmarking)
- [ ] Define severity criteria appropriate for discovery findings
- [ ] Create `discovery_opportunities` table (or reuse `client_opportunities` with type flag)
- [ ] Build data gathering function for discovery context
- [ ] Create system prompt with discovery-specific philosophy
- [ ] Create user prompt with discovery data structure
- [ ] Implement post-processing pipeline (consolidation, sanitisation, filtering)
- [ ] Define blocking rules for discovery services
- [ ] Implement service recommendation generation
- [ ] Create storage functions for discovery opportunities
- [ ] Build frontend components to display discovery opportunities

---

## File References

- **Main Function:** `supabase/functions/generate-bm-opportunities/index.ts`
- **DB Schema:** `supabase/migrations/20260201_create_client_opportunities_table.sql`
- **Frontend Display:** `src/components/benchmarking/client/RecommendedServicesSection.tsx`
- **Admin View:** `src/components/benchmarking/admin/OpportunityPanel.tsx`
