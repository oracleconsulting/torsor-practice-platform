# Discovery System Data Export for Claude Project Analysis

**Exported:** February 5, 2026  
**Purpose:** Real system data for refining Discovery Assessment process

---

## Files Included

### 1. `CLAUDE_PROJECT_DATA_EXPORT.json` (313 KB)
Complete dataset containing:

| Table | Records | Description |
|-------|---------|-------------|
| `service_scoring_weights` | 85 | Rules mapping question responses → service recommendations |
| `discovery_reports` | 5 | Generated reports with Pass 1 & Pass 2 data |
| `destination_discovery` | 10 | Raw assessment responses (40 questions) |
| `discovery_engagements` | 10 | Engagement workflow records |
| `client_financial_context` | 2 | Uploaded financial data |
| `practice_members` | 20 | Client records (anonymized) |
| `services` | 32 | Service catalogue |

---

## Data Structure Reference

### Service Scoring Weights
```json
{
  "question_id": "dd_delegation_honest",
  "response_value": "Terrible - I end up doing everything myself",
  "service_code": "365_method",
  "weight": 50,
  "category": "founder_dependency"
}
```

**Categories:**
- `founder_dependency` - Founder/key person risk indicators
- `lifestyle` - Work-life balance and burnout signals
- `success_definition` - Client's definition of success
- `investment_readiness` - Capital raising signals
- `exit_planning` - Exit timeline and readiness

### Discovery Reports
Contains:
- `service_scores` - Calculated scores per service (0-100)
- `detection_patterns` - Pattern flags (isInCrisis, isExitFocused, etc.)
- `emotional_anchors` - Verbatim client quotes
- `comprehensive_analysis` - Pass 1 calculator outputs

### Destination Discovery (Assessment Responses)
Contains:
- `responses` - Part 1: Destination Discovery (25 questions)
- `part2_responses` - Part 2: Service Diagnostic (15 questions)

---

## Key Questions to Analyse

### Part 1: Destination Discovery
- `dd_five_year_picture` - "Tuesday Test" vision
- `dd_success_definition` - Success meaning
- `dd_owner_hours` - Working hours
- `dd_time_breakdown` - Firefighting vs strategic %
- `dd_holiday_reality` - Last real break
- `dd_key_person_risk` - Key person dependency
- `dd_delegation_honest` - Delegation ability
- `dd_avoided_conversation` - Hidden challenge
- `dd_if_i_knew` - Financial anxiety trigger

### Part 2: Service Diagnostic
- `sd_founder_dependency` - Chaos indicator
- `sd_financial_confidence` - Data trust
- `sd_benchmark_awareness` - Peer comparison
- `sd_exit_timeline` - Exit horizon
- `sd_growth_blocker` - Growth constraints

---

## Analysis Questions for Claude Project

1. **Scoring Accuracy**: Do the weight values correctly prioritize services?
2. **Pattern Detection**: Are the detection patterns (burnout, exit focus) triggering correctly?
3. **Emotional Anchors**: Is the system extracting the most powerful quotes?
4. **Service Recommendations**: Are the right services being recommended for each client profile?
5. **Narrative Quality**: Does the Pass 2 output resonate with the client's expressed needs?

---

## Additional Files in This Folder

- `DISCOVERY_SYSTEM_COMPLETE_ARCHITECTURE.md` - System architecture
- `docs-DISCOVERY_ASSESSMENT_SYSTEM.md` - Question reference
- `shared-service-scorer-v2-copy.ts` - Scoring algorithm code
- `generate-discovery-report-pass1-copy.ts` - Pass 1 code
- `generate-discovery-report-pass2-copy.ts` - Pass 2 code

---

*Use this data with the architecture docs to analyse the end-to-end discovery flow.*
