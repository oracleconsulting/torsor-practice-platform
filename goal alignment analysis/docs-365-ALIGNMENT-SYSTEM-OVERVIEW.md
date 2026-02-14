# 365 Alignment System - Technical Overview

**Last Updated:** December 14, 2025

## Executive Summary

The 365 Alignment System is a staged roadmap generation pipeline that creates personalized transformation journeys for accounting practice clients. It uses Supabase Edge Functions, database triggers, and LLM-powered content generation to produce comprehensive business roadmaps.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT JOURNEY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Client completes assessments (Part 1, 2, 3)                             │
│                    ↓                                                         │
│  2. Admin clicks "Regenerate Roadmap" in Client Services                    │
│                    ↓                                                         │
│  3. fit_assessment queued → triggers chain of 6 stages                      │
│                    ↓                                                         │
│  4. Each stage generates content → triggers next stage automatically        │
│                    ↓                                                         │
│  5. Roadmap displayed in admin portal + client portal                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Generation Pipeline (6 Stages)

The pipeline executes in strict sequence. Each stage must complete before the next begins.

### Stage Flow

```
fit_assessment → five_year_vision → six_month_shift → sprint_plan_part1 → sprint_plan_part2 → value_analysis
```

| Stage | Edge Function | Model | Purpose |
|-------|--------------|-------|---------|
| 1. `fit_assessment` | `generate-fit-profile` | Rule-based | Analyze client fit, readiness scores |
| 2. `five_year_vision` | `generate-five-year-vision` | Claude Sonnet 4.5 | Create transformation story & milestones |
| 3. `six_month_shift` | `generate-six-month-shift` | Claude Sonnet 4.5 | Define 6-month milestones & gap analysis |
| 4. `sprint_plan_part1` | `generate-sprint-plan-part1` | Claude Sonnet 4.5 | Generate weeks 1-6 with tasks |
| 5. `sprint_plan_part2` | `generate-sprint-plan-part2` | Claude Sonnet 4.5 | Generate weeks 7-12, merge with part1 |
| 6. `value_analysis` | `generate-value-analysis` | Rule-based | Business valuation & opportunity scoring |

### Why Sprint Plan is Split

The 12-week sprint plan was split into two parts (weeks 1-6 and 7-12) because:
- LLM responses for all 12 weeks exceeded Edge Function timeout limits
- Smaller chunks = faster responses and better reliability
- JSON repair is more effective on smaller payloads
- `sprint_plan_part2` merges both parts into complete sprint data

---

## Database Architecture

### Core Tables

#### `roadmap_stages`
Stores generated content for each stage.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `practice_id` | UUID | FK to practice |
| `client_id` | UUID | FK to practice_members (client) |
| `stage_type` | TEXT | One of the 6 stage types |
| `version` | INT | Version number (supports regeneration) |
| `status` | TEXT | `generating`, `generated`, `approved`, `published` |
| `generated_content` | JSONB | Raw LLM output |
| `approved_content` | JSONB | Human-reviewed content (optional) |
| `model_used` | TEXT | LLM model identifier |
| `generation_started_at` | TIMESTAMP | When generation began |
| `generation_completed_at` | TIMESTAMP | When generation finished |

#### `generation_queue`
Manages pending stage generations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `practice_id` | UUID | FK to practice |
| `client_id` | UUID | FK to practice_members |
| `stage_type` | TEXT | Stage to generate |
| `status` | TEXT | `pending`, `processing`, `completed`, `failed` |
| `depends_on_stage` | TEXT | Previous stage that must complete first |
| `priority` | INT | Higher = process first |
| `queued_at` | TIMESTAMP | When added to queue |
| `started_at` | TIMESTAMP | When processing began |
| `completed_at` | TIMESTAMP | When finished |
| `error_message` | TEXT | Error details if failed |

---

## Trigger Chain (Auto-Progression)

A PostgreSQL trigger automatically queues the next stage when one completes.

```sql
CREATE OR REPLACE FUNCTION trigger_next_stage()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
  next_stage TEXT;
BEGIN
  IF NEW.status = 'generated' AND (OLD.status IS NULL OR OLD.status = 'generating') THEN
    next_stage := CASE NEW.stage_type
      WHEN 'fit_assessment' THEN 'five_year_vision'
      WHEN 'five_year_vision' THEN 'six_month_shift'
      WHEN 'six_month_shift' THEN 'sprint_plan_part1'
      WHEN 'sprint_plan_part1' THEN 'sprint_plan_part2'
      WHEN 'sprint_plan_part2' THEN 'value_analysis'
      ELSE NULL
    END;
    
    IF next_stage IS NOT NULL THEN
      INSERT INTO generation_queue (practice_id, client_id, stage_type, depends_on_stage)
      VALUES (NEW.practice_id, NEW.client_id, next_stage, NEW.stage_type)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Edge Functions Detail

### `roadmap-orchestrator`
**Purpose:** Polls the queue and invokes stage functions.

- Runs when triggered by admin action or scheduled
- Finds oldest `pending` queue item
- Invokes the appropriate stage function
- Handles retries on failure
- Special handling for `value_analysis` (requires `action: 'generate-analysis'` parameter)

### `generate-fit-profile`
**Purpose:** Analyze client assessment data to determine fit.

**Input:** Assessment Part 1 responses  
**Output:** Fit scores, journey recommendation, personalized insights

```json
{
  "fitSignals": {
    "readinessScore": 75,
    "commitmentScore": 80,
    "clarityScore": 65,
    "urgencyScore": 70,
    "coachabilityScore": 85,
    "overallFit": "good"
  },
  "journeyRecommendation": "365_method",
  "northStar": "Working 1-2 days a week...",
  "tagline": "Britain's Rowing Specialist..."
}
```

### `generate-five-year-vision`
**Purpose:** Create transformation narrative with year milestones.

**Input:** Fit profile, Part 1 & 2 assessment data  
**Output:** Vision story, Y1/Y3/Y5 milestones, transformation journey

```json
{
  "tagline": "Britain's Rowing Specialist - With Freedom to Live",
  "transformationStory": {
    "currentReality": { "narrative": "..." },
    "futureReality": { "narrative": "..." }
  },
  "yearOneMilestone": { "headline": "...", "specifics": [...] },
  "yearThreeMilestone": { "headline": "...", "specifics": [...] },
  "yearFiveMilestone": { "headline": "...", "specifics": [...] }
}
```

### `generate-six-month-shift`
**Purpose:** Define concrete milestones for the next 6 months.

**Input:** Vision, Part 1 & 2 data  
**Output:** Shift statement, key milestones, gap analysis, risks

```json
{
  "shiftStatement": "In 6 months, you have a GM handling day-to-day...",
  "keyMilestones": [
    { "milestone": "...", "targetMonth": 2, "measurable": "..." },
    { "milestone": "...", "targetMonth": 4, "measurable": "..." },
    { "milestone": "...", "targetMonth": 6, "measurable": "..." }
  ],
  "gapAnalysis": { "current": {...}, "sixMonths": {...} },
  "risks": [{ "risk": "...", "mitigation": "..." }],
  "quickWins": ["...", "..."]
}
```

### `generate-sprint-plan-part1`
**Purpose:** Create weeks 1-6 of 12-week sprint.

**Input:** Vision, shift plan, Part 1 & 2 data  
**Output:** 6 weeks with themes, focus areas, and 3-4 tasks each

```json
{
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Reclaim Your Mornings",
      "focusArea": "Immediate Relief",
      "tasks": [
        { "title": "...", "description": "...", "priority": "high" }
      ],
      "weekMilestone": "By end of Week 1: ..."
    }
    // ... weeks 2-6
  ]
}
```

### `generate-sprint-plan-part2`
**Purpose:** Create weeks 7-12 and merge with Part 1.

**Input:** Part 1 sprint, vision, shift plan  
**Output:** Complete 12-week sprint (merged)

The function fetches `sprint_plan_part1` content, generates weeks 7-12, then merges them:

```javascript
const completeSprint = mergeSprints(sprintPart1, sprintPart2);
// Result: { weeks: [...all 12 weeks...], tuesdayEvolution: {...}, ... }
```

### `generate-value-analysis`
**Purpose:** Business valuation and opportunity scoring.

**Input:** All assessment data, industry context  
**Output:** Value score, business valuation, risks, opportunities

```json
{
  "overallScore": 64,
  "scoreInterpretation": "Good foundation with opportunities",
  "businessValuation": {
    "baselineValue": 404972,
    "valueRange": { "low": 283480, "high": 566961 }
  },
  "totalOpportunity": 136250,
  "riskRegister": [
    { "risk": "...", "severity": "Critical", "mitigation": "..." }
  ],
  "assetScores": [...]
}
```

---

## JSON Repair Logic

LLMs sometimes produce malformed JSON. Both sprint plan functions include repair logic:

```javascript
// 1. Remove trailing commas
fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');

// 2. Fix missing commas between elements
fixedJson = fixedJson.replace(/}(\s*){/g, '},{');
fixedJson = fixedJson.replace(/](\s*)\[/g, '],[');

// 3. Close unclosed brackets/braces
if (openBrackets > closeBrackets) {
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    fixedJson += ']';
  }
}
```

---

## Row Level Security (RLS)

### Practice Members Access
Practice team members can view/edit stages for their practice:

```sql
CREATE POLICY "Practice members can view their practice's roadmap stages"
  ON roadmap_stages FOR SELECT
  USING (
    practice_id IN (
      SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
    )
  );
```

### Client Access
Clients (stored in `practice_members` with `member_type = 'client'`) access their own data via the same policy since they have a `user_id` linked to their Supabase auth.

---

## UI Integration

### Admin Portal (`ClientServicesPage.tsx`)

The `ClientDetailModal` displays:
- **Overview Tab:** North Star, assessment status
- **Roadmap Tab:** 
  - 5-Year Vision (tagline + transformation story)
  - 6-Month Shift (shift statement + key milestones)
  - 12-Week Sprint Overview (all 12 weeks)
  - Value Analysis (score, opportunity, critical risks)
- **Sprint Tab:** Detailed week-by-week tasks with editing
- **Context Tab:** Add notes/documents for next regeneration

### Client Portal (`RoadmapPage.tsx`)

Displays the client-facing view of their roadmap:
- Vision tab
- Shift tab  
- Sprint tab (with task completion tracking)
- Value tab

### Data Fetching

Both portals now fetch from `roadmap_stages` first, with fallback to legacy `client_roadmaps`:

```javascript
const { data: stagesData } = await supabase
  .from('roadmap_stages')
  .select('*')
  .eq('client_id', clientId)
  .in('status', ['published', 'approved', 'generated'])
  .order('created_at', { ascending: true });

if (stagesData && stagesData.length > 0) {
  // Build roadmap from stages
} else {
  // Fallback to client_roadmaps table
}
```

---

## Deployment

### Edge Functions
Deploy with Supabase CLI:

```bash
supabase functions deploy generate-fit-profile
supabase functions deploy generate-five-year-vision
supabase functions deploy generate-six-month-shift
supabase functions deploy generate-sprint-plan-part1
supabase functions deploy generate-sprint-plan-part2
supabase functions deploy generate-value-analysis
supabase functions deploy roadmap-orchestrator
```

### Database Migrations
Run in Supabase SQL Editor:

1. `20251216_staged_roadmap_architecture.sql` - Core schema
2. `20251214_split_sprint_plan_trigger.sql` - Updated trigger for split sprint
3. `20251216_fix_all_rls_policies.sql` - RLS policies

### Frontend
- **Admin Portal:** Deployed via Railway (auto-deploys from `main` branch)
- **Client Portal:** Deployed via Railway (auto-deploys from `main` branch)

---

## Monitoring & Debugging

### Supabase Dashboard
- **Edge Functions → Logs:** View execution logs for each function
- **Table Editor → `roadmap_stages`:** Check stage statuses
- **Table Editor → `generation_queue`:** Monitor queue processing

### Useful SQL Queries

```sql
-- Check all stages for a client
SELECT stage_type, status, version, created_at 
FROM roadmap_stages 
WHERE client_id = '<client-id>'
ORDER BY created_at DESC;

-- Check generation queue
SELECT stage_type, status, queued_at, completed_at, error_message
FROM generation_queue 
WHERE client_id = '<client-id>'
ORDER BY queued_at DESC;

-- Verify trigger function
SELECT prosrc FROM pg_proc WHERE proname = 'trigger_next_stage';
```

### Console Logging
Both portals include debug logging:
- `[fetchClientDetail]` - Admin portal data fetching
- `[useRoadmap]` - Client portal data fetching

---

## Key Files Reference

```
torsor-practice-platform/
├── supabase/
│   ├── functions/
│   │   ├── generate-fit-profile/index.ts
│   │   ├── generate-five-year-vision/index.ts
│   │   ├── generate-six-month-shift/index.ts
│   │   ├── generate-sprint-plan-part1/index.ts
│   │   ├── generate-sprint-plan-part2/index.ts
│   │   ├── generate-value-analysis/index.ts
│   │   └── roadmap-orchestrator/index.ts
│   └── migrations/
│       ├── 20251216_staged_roadmap_architecture.sql
│       ├── 20251214_split_sprint_plan_trigger.sql
│       └── 20251216_fix_all_rls_policies.sql
├── src/pages/admin/
│   └── ClientServicesPage.tsx          # Admin portal
└── apps/client-portal/src/
    ├── hooks/useAnalysis.ts            # Data fetching hooks
    └── pages/roadmap/RoadmapPage.tsx   # Client roadmap view
```

---

## Version History

| Date | Change |
|------|--------|
| Dec 14, 2025 | Split sprint_plan into part1 and part2 for reliability |
| Dec 14, 2025 | Added JSON repair logic for LLM response handling |
| Dec 14, 2025 | Updated trigger chain for 6-stage pipeline |
| Dec 14, 2025 | Fixed admin/client portals to read from roadmap_stages |
| Dec 14, 2025 | Added Value Analysis display to Roadmap tab |



