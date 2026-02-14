# Service Line Discovery Mapping
## How Discovery Assessment Triggers Service Recommendations

This document maps every Discovery assessment question to the service lines it can trigger, along with the scoring weights and trigger conditions.

---

## Table of Contents

1. [Service Lines Overview](#1-service-lines-overview)
2. [Destination Discovery Questions](#2-destination-discovery-questions)
3. [Service Diagnostic Questions](#3-service-diagnostic-questions)
4. [Service Scoring Logic](#4-service-scoring-logic)
5. [Special Detection Patterns](#5-special-detection-patterns)
6. [Value Proposition Generation](#6-value-proposition-generation)
7. [Recommendations for Improvement](#7-recommendations-for-improvement)

---

## 1. Service Lines Overview

### Active Service Lines

| Code | Name | Transformation Promise | Typical Monthly |
|------|------|------------------------|-----------------|
| `365_method` | 365 Alignment Programme | From drifting to deliberate. From hoping to planning. | £5,000 |
| `fractional_cfo` | Fractional CFO Services | From guessing to knowing. From anxiety to confidence. | £3,500 - £12,000 |
| `fractional_coo` | Fractional COO Services | From essential to optional. From trapped to free. | £3,000 - £10,000 |
| `combined_advisory` | Combined CFO/COO Advisory | Board-level thinking without board-level cost. | £8,000 - £15,000 |
| `management_accounts` | Management Accounts | From blind to informed. From surprises to certainty. | £650 |
| `systems_audit` | Systems Audit | From firefighting to flowing. From chaos to control. | £3,000 retainer |
| `automation` | Automation Services | From manual to magical. More output, less effort. | £1,500 |
| `benchmarking` | Benchmarking Services | Know exactly where you compare. | £2,000 |
| `business_advisory` | Business Advisory & Exit Planning | From vulnerable to secure. From undervalued to optimised. | £9,000 |

### Service Dependencies

```
automation → requires systems_audit
management_accounts → enables benchmarking
fractional_cfo + fractional_coo → suggests combined_advisory
```

---

## 2. Destination Discovery Questions

### Section: The Dream (Vision)

#### `dd_five_year_vision` / `dd_five_year_picture`
**Question:** "Picture a random Tuesday 5 years from now. Walk me through your ideal day from waking up to going to bed."

**Type:** Free text (400 chars)

**Service Triggers:**
- **365_method** (+20 pts): If contains "invest", "portfolio", "advisory", "board", "step back", "chairman"
- **business_advisory** (+15 pts): If mentions exit, selling, legacy

**Why this matters:** Vision language reveals whether client wants lifestyle transformation vs growth.

---

#### `dd_success_definition`
**Question:** "What does success look like for you?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Creating a business that runs profitably without me" | 365_method, systems_audit | +25, +10 |
| "Building a legacy that outlasts me" | 365_method, business_advisory | +25, +15 |
| "Building something I can sell for a life-changing amount" | 365_method, business_advisory | +25, +20 |
| "Maximising current income" | fractional_cfo, management_accounts | +10, +10 |
| "Having complete control over my time" | 365_method, fractional_coo | +20, +15 |

---

#### `dd_non_negotiables`
**Question:** "What are your non-negotiables? What must you protect?"

**Type:** Multi-select

**Service Triggers:**
- Family time → 365_method (+10)
- Health → 365_method (+10)
- Team/culture → fractional_coo (+10)
- Financial security → management_accounts, fractional_cfo (+10 each)

---

### Section: The Gap (Current Reality)

#### `dd_exit_mindset`
**Question:** "How do you think about exiting or stepping back from the business?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "I've already got a clear exit plan" | business_advisory | +15 |
| "I think about it but haven't planned" | 365_method, business_advisory | +10, +10 |
| "I'd love to but can't see how" | 365_method, systems_audit | +10, +15 |
| "The business is me - no point thinking about it" | fractional_coo, systems_audit | +15, +15 |
| "I want to grow, not exit" | fractional_cfo, combined_advisory | +10, +10 |

---

#### `dd_reality_assessment`
**Question:** "How far are you from your vision right now?"

**Type:** Single choice

**Options:**
- "Close - I can see the path clearly" → Lower urgency multiplier (0.9x)
- "Halfway - making progress but it's slow" → 365_method (+5)
- "Far away - I know where I want to go but not how" → 365_method (+15)
- "Lost - I don't even know what I want anymore" → 365_method (+20), combined_advisory (+10)
- "Stuck - I keep trying but nothing changes" → 365_method (+20), systems_audit (+10)

---

### Section: Tuesday Reality (Daily Experience)

#### `dd_weekly_hours` / `dd_owner_hours`
**Question:** "How many hours per week do you work?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points | Notes |
|--------|-------------------|--------|-------|
| "Under 40 hours" | (none) | 0 | Healthy |
| "40-50 hours" | (none) | 0 | Normal |
| "50-60 hours" | fractional_cfo | +5 | Stretched |
| "60-70 hours" | 365_method, fractional_coo | +15, +10 | Burnout risk |
| "70+ hours" | 365_method, fractional_coo, systems_audit | +20, +15, +10 | High burnout |

**Special:** If 60-70 or 70+ hours AND `dd_change_readiness` = "Completely ready", add +15 to 365_method

---

#### `dd_time_allocation`
**Question:** "How do you spend your time?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "90% firefighting / 10% strategic" | systems_audit | +15 |
| "70% firefighting / 30% strategic" | systems_audit | +15 |
| "50% firefighting / 50% strategic" | (none) | 0 |
| "30% firefighting / 70% strategic" | (none) | 0 |
| "90%+ strategic" | (none) | 0 |

---

#### `dd_scaling_constraint`
**Question:** "What's the biggest constraint to scaling your business?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "My team - we're stretched thin" | fractional_coo | +25 |
| "My personal capacity - I'm already maxed" | fractional_coo, 365_method | +20, +10 |
| "Cash flow - we could grow but can't fund it" | fractional_cfo, management_accounts | +20, +15 |
| "Systems - we'd just create bigger chaos" | systems_audit | +25 |
| "Market - not enough demand" | benchmarking | +10 |
| "I don't know - I haven't figured out what's holding us back" | 365_method | +15 |

---

#### `dd_sleep_thieves` / `dd_sleep_thief`
**Question:** "What keeps you awake at night?"

**Type:** Multi-select

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Cash flow and paying bills" | management_accounts, fractional_cfo | +15, +10 |
| "A key employee leaving" | fractional_coo, systems_audit | +10, +10 |
| "A big client leaving" | benchmarking | +10 |
| "My own energy running out" | 365_method | +15 |
| "Not having a plan B" | business_advisory | +10 |
| "The competition overtaking us" | benchmarking | +15 |
| "Something breaking that I haven't spotted" | systems_audit | +15 |
| "Nothing - I sleep fine" | (none) | 0 |

---

#### `dd_core_frustration`
**Question:** "What's the thing that frustrates you most about running this business right now?"

**Type:** Free text (300 chars)

**Keyword Analysis:**

| Keywords | Services Triggered | Points |
|----------|-------------------|--------|
| "manual", "process", "system", "repeat" | systems_audit, automation | +15, +15 |
| "price", "compet", "market", "rate" | benchmarking | +15 |
| "cash", "money", "afford" | management_accounts | +15 |
| "team", "people", "staff" | fractional_coo | +15 |
| "tired", "exhaust", "burn" | 365_method | +20 |

---

### Section: The Real Question

#### `dd_team_confidence`
**Question:** "Rate your team's capability (1-10)"

**Type:** Single choice with rating

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "1-3: Major concerns" | fractional_coo | +15 |
| "4-5: Some good people but significant gaps" | fractional_coo | +15 |
| "6-7: Generally capable but stretched" | fractional_coo | +5 |
| "8-10: Strong team" | (none) | 0 |

---

#### `dd_key_person_dependency`
**Question:** "If you were suddenly unable to work for 3 months, what would happen?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Disaster - the business would struggle badly" | systems_audit | +20 |
| "Major disruption for 6+ months" | systems_audit | +20 |
| "Would struggle but survive" | systems_audit | +10 |
| "Would be fine - team would step up" | (none) | 0 |

---

#### `dd_people_challenge`
**Question:** "What's your biggest people challenge?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Finding good people to hire" | fractional_coo | +20 |
| "Developing future leaders" | fractional_coo | +20 |
| "Managing performance" | fractional_coo | +20 |
| "Getting the best from current team" | fractional_coo | +20 |
| "Retention - keeping good people" | fractional_coo | +15 |
| "No major people challenges" | (none) | 0 |

---

#### `dd_delegation_ability`
**Question:** "How would you rate your ability to delegate?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Poor - I struggle to let go" | systems_audit | +15 |
| "Terrible - I end up doing everything myself" | systems_audit | +15 |
| "Average - some things, not others" | systems_audit | +5 |
| "Good - I delegate most things" | (none) | 0 |

---

#### `dd_external_perspective`
**Question:** "What would your spouse/partner/close friend say about your work-life balance?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "It's a significant source of tension" | 365_method | +10 |
| "They've given up complaining" | 365_method | +10 |
| "They worry about me sometimes" | 365_method | +10 |
| "They think it's fine" | (none) | 0 |
| "They'd say I'm married to my business" | 365_method | +15 |

---

#### `dd_suspected_truth` / `dd_if_i_knew`
**Question:** "If you knew your numbers better, what do you suspect you'd discover?"

**Type:** Free text (300 chars)

**Keyword Analysis:**

| Keywords | Services Triggered | Points |
|----------|-------------------|--------|
| "margin", "profit", "losing", "cost", "pricing", "money" | management_accounts | +20 |
| "underperform", "behind", "compared", "competitor", "industry", "average" | benchmarking | +20 |

---

#### `dd_priority_area`
**Question:** "If you could only fix ONE thing in the next 12 months, what would it be?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Getting real financial visibility and control" | management_accounts | +30 |
| "Building a business that runs without me" | systems_audit | +25 |
| "Scaling without scaling the chaos" | systems_audit | +25 |
| "Protecting the value I've built" | business_advisory | +30 |
| "Having strategic direction and accountability" | 365_method | +25 |
| "Getting my time and energy back" | 365_method | +25 |

---

#### `dd_change_readiness`
**Question:** "How ready are you for change?"

**Type:** Single choice

**Urgency Multiplier:**

| Option | Multiplier |
|--------|------------|
| "Completely ready - I'll do whatever it takes" | 1.3x |
| "Ready - as long as I understand the why" | 1.2x |
| "Open - but I'll need convincing" | 1.0x |
| "Hesitant - change feels risky" | 0.9x |
| "Resistant - I prefer how things are" | 0.7x |

---

## 3. Service Diagnostic Questions

These are more specific questions that directly measure service-specific needs.

### Financial Questions

#### `sd_financial_confidence`
**Question:** "How confident are you in your financial numbers?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Uncertain - I'm often surprised" | management_accounts | +30 |
| "Not confident - I mostly guess" | management_accounts | +30 |
| "I avoid financial decisions because I don't trust the data" | management_accounts | +30 |
| "Fairly confident" | (none) | 0 |
| "Very confident" | (none) | 0 |

---

#### `sd_numbers_action_frequency`
**Question:** "How often do you act on your financial numbers?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Weekly - always making data-driven decisions" | (none) | 0 |
| "Monthly - regular reviews" | (none) | 0 |
| "Quarterly - when accounts come through" | management_accounts | +25 |
| "Rarely - I don't find them useful" | management_accounts | +25 |
| "Never - I don't get meaningful management information" | management_accounts | +25 |

---

#### `sd_benchmark_awareness`
**Question:** "Do you know how your business compares to industry benchmarks?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "No - I'd love to know but don't have access" | benchmarking | +40 |
| "Never considered it" | benchmarking | +25 |
| "Roughly - I have a general sense" | benchmarking | +15 |
| "Yes - I have good benchmarking data" | (none) | 0 |

---

### Operational Questions

#### `sd_founder_dependency`
**Question:** "What would happen to the business if you disappeared for 3 months?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Chaos - I'm essential to everything" | systems_audit | +25 |
| "Significant problems - but wouldn't collapse" | systems_audit | +25 |
| "Would cope with some struggles" | systems_audit | +10 |
| "Would be fine" | (none) | 0 |

---

#### `sd_manual_work_percentage`
**Question:** "What percentage of your team's work is manual/repetitive?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Significant - probably 30-50%" | systems_audit, automation | +25, +30 |
| "Too much - over half our effort is manual" | systems_audit, automation | +25, +30 |
| "I don't know - never measured it" | systems_audit | +15 |
| "Minimal" | (none) | 0 |

---

#### `sd_problem_awareness_speed`
**Question:** "How quickly do you learn about problems in the business?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Same day - real-time visibility" | (none) | 0 |
| "Days later - when problems compound" | systems_audit | +20 |
| "Often too late - when customers complain" | systems_audit | +20 |
| "We're often blindsided" | systems_audit | +20 |

---

### Strategic Questions

#### `sd_plan_clarity`
**Question:** "How clear is your business plan?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Crystal clear - documented and actioned" | (none) | 0 |
| "I have goals but not a real plan" | 365_method | +15 |
| "I'm too busy to plan" | 365_method | +15 |
| "I've given up on planning - things always change" | 365_method | +15 |

---

#### `sd_accountability_source`
**Question:** "Who holds you accountable to your business goals?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "A board or advisory group" | (none) | 0 |
| "A coach or mentor" | (none) | 0 |
| "My business partner" | (none) | 0 |
| "My spouse/family (informally)" | 365_method | +10 |
| "No one - just me" | 365_method | +10 |

---

#### `sd_decision_support`
**Question:** "Who do you turn to for major business decisions?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Professional advisors" | (none) | 0 |
| "Peer network" | (none) | 0 |
| "Friends or family (not business experts)" | fractional_cfo | +15 |
| "I figure it out myself" | fractional_cfo | +15 |
| "I avoid major decisions" | fractional_cfo | +15 |

---

#### `sd_growth_blocker`
**Question:** "What's the main thing blocking your growth?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Don't have the capital" | fractional_cfo | +20 |
| "Don't have the team capacity" | fractional_coo | +20 |
| "Don't have the right systems" | systems_audit | +20 |
| "Don't have the time" | 365_method | +15 |
| "Don't have the clarity" | 365_method | +20 |
| "Market conditions" | benchmarking | +10 |

---

#### `sd_scaling_vulnerability`
**Question:** "If you doubled revenue tomorrow, what would break first?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Financial systems and controls" | fractional_cfo | +30 |
| "Operational processes" | systems_audit | +20 |
| "Team capacity" | fractional_coo | +20 |
| "My personal capacity" | fractional_coo | +20 |
| "Nothing - we're ready to scale" | (none) | 0 |

---

### Exit & Value Questions

#### `sd_documentation_readiness`
**Question:** "If you had to show an investor your business documentation, how ready would you be?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Very ready - everything's documented" | (none) | 0 |
| "Mostly ready - some gaps" | business_advisory | +10 |
| "It would take weeks to pull together" | business_advisory | +20 |
| "Months - things are scattered" | business_advisory | +20 |
| "I don't know where to start" | business_advisory | +20 |

---

#### `sd_valuation_understanding`
**Question:** "Do you know what your business is worth?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Yes - had a professional valuation recently" | (none) | 0 |
| "Roughly - based on industry multiples" | benchmarking | +10 |
| "No idea - it's never come up" | benchmarking | +15 |
| "I try not to think about it" | benchmarking | +15 |

---

#### `sd_exit_timeline`
**Question:** "What's your exit timeline?"

**Type:** Single choice

**Options & Service Triggers:**

| Option | Services Triggered | Points |
|--------|-------------------|--------|
| "Already exploring options" | business_advisory | +30 |
| "1-3 years - actively preparing" | business_advisory | +30 |
| "3-5 years - need to start thinking" | business_advisory | +30 |
| "5-10 years - too early" | business_advisory | +10 |
| "No plans to exit" | (none) | 0 |

---

## 4. Service Scoring Logic

### Base Scoring Algorithm

```typescript
// 1. Initialize all services to 0
scores = {
  '365_method': 0,
  'management_accounts': 0,
  'systems_audit': 0,
  'fractional_cfo': 0,
  'fractional_coo': 0,
  'combined_advisory': 0,
  'business_advisory': 0,
  'automation': 0,
  'benchmarking': 0
};

// 2. Apply question-based scoring (see tables above)

// 3. Apply urgency multiplier (0.7x - 1.5x based on dd_change_readiness)

// 4. Cap all scores at 100

// 5. Calculate confidence = triggers.length * 20 (capped at 100)

// 6. Assign priority:
//    - Score >= 50: Priority 1, 2, 3...
//    - Score >= 30: Priority 3+
//    - Score < 30: Priority 5
```

### Score Thresholds

| Score Range | Recommendation Level |
|-------------|---------------------|
| 80-100 | **Strong Match** - Primary recommendation |
| 50-79 | **Good Match** - Secondary recommendation |
| 30-49 | **Potential Match** - Consider discussing |
| 0-29 | **Weak Match** - Not recommended |

### Combined Service Logic

```typescript
// If both CFO and COO scores >= 8, suggest Combined Advisory
if (scores['fractional_cfo'] >= 8 && scores['fractional_coo'] >= 8) {
  recommendations.unshift({
    service: 'combined_advisory',
    score: scores['fractional_cfo'] + scores['fractional_coo'],
    isBundled: true
  });
}
```

---

## 5. Special Detection Patterns

### Capital Raising Detection

**Triggers (need 2+ signals):**
- `sd_growth_blocker` = "Don't have the capital"
- Free text mentions: "capital", "raise", "invest", "funding"
- `sd_exit_timeline` = "Already exploring options" or "1-3 years"

**Effect:** 
- fractional_cfo × 1.5
- management_accounts × 1.3
- business_advisory × 1.3
- systems_audit × 1.2

### Lifestyle Transformation Detection

**Triggers (need 3+ signals):**
- Vision mentions: "invest", "portfolio", "ceo", "advisory", "board", "chairman", "non-executive"
- Vision mentions lifestyle: "family", "children", "wife/husband", "holiday", "travel", "health"
- Success definition: runs without me, legacy, control over time

**Effect:**
- 365_method × 1.5
- fractional_coo × 1.3
- systems_audit × 1.2

### Burnout Detection

**Triggers (need 3+ signals):**
- Hours: 60-70 or 70+
- No holidays: "I've never done that" or "Can't remember"
- Relationship strain: "significant tension" or "married to business"
- High firefighting: 70%+ or 90%
- Sleep issues (any selection except "Nothing - I sleep fine")

**Effect:**
- 365_method × 1.4

---

## 6. Value Proposition Generation

Each service recommendation includes a personalized value proposition built from the client's own words.

### Structure

```typescript
{
  headline: string;        // Service tagline
  destination: string;     // Uses dd_five_year_vision
  gap: string;            // Uses dd_core_frustration or obstacles
  transformation: string;  // Service-specific promise
  investment: string;     // Cost context
  firstStep: string;      // Immediate action
}
```

### Example for 365_method

```typescript
{
  headline: "From drifting to deliberate",
  destination: `You painted a picture: "${vision.substring(0, 150)}..."`,
  gap: `But right now, you're dealing with: "${frustration}"`,
  transformation: `Within 12 weeks, you'll have a clear roadmap to that vision. No more "${failureInsight}". Every week, you'll know exactly what to focus on.`,
  investment: `The cost of NOT doing this? You told us: "${costOfInaction}"`,
  firstStep: "A 90-minute strategy session to map your destination and identify the gaps."
}
```

---

## 7. Recommendations for Improvement

### Current Gaps

1. **Missing Questions for Automation:**
   - No direct question asking about specific automation opportunities
   - Only triggered indirectly via manual work percentage

2. **Weak Benchmarking Triggers:**
   - `sd_benchmark_awareness` is the only strong trigger
   - Could add questions about competitive positioning concerns

3. **Business Advisory Under-Triggered:**
   - Only triggered by exit-focused questions
   - Missing questions about business value concerns, succession planning

4. **365_method vs Fractional Services Confusion:**
   - Similar responses can trigger both
   - Need clearer differentiation questions

### Suggested New Questions

#### For Automation Detection
```
Question: "Which of these manual tasks consume the most team time?"
Options:
- Data entry between systems
- Report generation
- Invoice processing
- Email follow-ups
- Document creation
- Approval workflows
- None - we're highly automated

Triggers: automation +20 per selection (except "None")
```

#### For Clearer 365_method vs Operations Split
```
Question: "What do you want from external support?"
Options:
- Help me figure out where I want to go (365_method +25)
- Help me build systems that run without me (systems_audit +25)
- Help me with specific operational challenges (fractional_coo +25)
- Help me understand my numbers better (management_accounts +25)
- Someone to hold me accountable (365_method +20)
- All of the above - I need comprehensive help (combined_advisory +30)
```

### Scoring Weight Adjustments Needed

| Service | Current Issue | Recommended Change |
|---------|--------------|-------------------|
| automation | Under-triggered | Add automation-specific question, increase manual_work weight to +40 |
| benchmarking | Relies too heavily on single question | Add competitive positioning questions |
| business_advisory | Only exit-focused | Add value protection and succession questions |
| combined_advisory | Only triggered by high CFO+COO | Add direct "comprehensive support" option |

---

## Appendix: Question ID Reference

### Destination Discovery (dd_)
- `dd_five_year_vision` / `dd_five_year_picture` / `dd_five_year_story`
- `dd_success_definition`
- `dd_non_negotiables`
- `dd_exit_mindset`
- `dd_reality_assessment`
- `dd_weekly_hours` / `dd_owner_hours`
- `dd_time_allocation` / `dd_time_breakdown`
- `dd_scaling_constraint`
- `dd_sleep_thieves` / `dd_sleep_thief`
- `dd_core_frustration`
- `dd_team_confidence`
- `dd_key_person_dependency` / `dd_key_person_risk`
- `dd_people_challenge`
- `dd_delegation_ability` / `dd_delegation_honest`
- `dd_external_perspective` / `dd_external_view`
- `dd_suspected_truth` / `dd_if_i_knew`
- `dd_priority_area` / `dd_priority_focus` / `dd_honest_priority`
- `dd_change_readiness`

### Service Diagnostics (sd_)
- `sd_financial_confidence`
- `sd_numbers_action_frequency`
- `sd_benchmark_awareness`
- `sd_founder_dependency`
- `sd_manual_work_percentage`
- `sd_problem_awareness_speed`
- `sd_plan_clarity`
- `sd_accountability_source`
- `sd_decision_support`
- `sd_growth_blocker`
- `sd_scaling_vulnerability`
- `sd_operational_frustration`
- `sd_documentation_readiness`
- `sd_valuation_understanding`
- `sd_exit_timeline`

---

*Document generated: January 2026*
*Last updated by: Cursor AI Assistant*

