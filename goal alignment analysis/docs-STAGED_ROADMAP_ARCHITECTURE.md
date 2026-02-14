# Staged Roadmap Architecture

## Overview

The 365 Alignment Programme generation system has been rebuilt as a staged pipeline with:
- **Individual edge functions per stage** (no timeouts)
- **Auto-chaining** (each stage triggers the next)
- **Practice review gate** before client visibility
- **Learning database** capturing edits and client feedback

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GENERATION PIPELINE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Part 1 Complete                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │ Fit Assessment  │────►│ 5-Year Vision   │────►│ 6-Month Shift   │   │
│  │ (Haiku 4.5)     │     │ (Opus 4.5)      │     │ (Sonnet 4.5)    │   │
│  │ ~5s             │     │ ~25s            │     │ ~20s            │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│                                                          │              │
│                                                          ▼              │
│                                                  ┌─────────────────┐   │
│                                                  │ 12-Week Sprint  │   │
│                                                  │ (Sonnet 4.5)    │   │
│                                                  │ ~25s            │   │
│                                                  └─────────────────┘   │
│                                                                          │
│  Part 3 Complete                                                         │
│       │                                                                  │
│       ▼                                                                  │
│  ┌─────────────────┐                                                    │
│  │ Value Analysis  │                                                    │
│  │ (Sonnet 4.5)    │                                                    │
│  │ ~20s            │                                                    │
│  └─────────────────┘                                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        QUALITY CONTROL                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Generated ──► Pending Review ──► Approved ──► Published                │
│                     │                              │                     │
│                     ▼                              ▼                     │
│              Practice Edits                 Client Can See              │
│                     │                                                    │
│                     ▼                                                    │
│              Learning Database                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### `roadmap_stages`
Tracks each generation stage independently:
- `stage_type`: `fit_assessment` | `five_year_vision` | `six_month_shift` | `sprint_plan` | `value_analysis`
- `status`: `not_started` | `generating` | `generated` | `approved` | `published` | `rejected`
- `generated_content`: JSONB (raw LLM output)
- `approved_content`: JSONB (after practice edits)
- `version`: Integer (for regeneration tracking)

### `generation_queue`
Manages the pipeline execution:
- `stage_type`: Which stage to generate
- `depends_on_stage`: Must complete before this runs
- `status`: `pending` | `processing` | `completed` | `failed`
- `priority`: Higher = more urgent

### `generation_feedback`
Learning database for continuous improvement:
- `feedback_source`: `practice_edit` | `client_task_feedback` | `client_general`
- `original_content` / `edited_content`: What changed
- `feedback_text`: Why it was changed
- `is_pattern`: Flagged as recurring issue
- `incorporated_into_prompts`: Has this been used to improve prompts?

---

## Edge Functions

### 1. `roadmap-orchestrator`
**Purpose**: Processes the generation queue and triggers appropriate stage functions

**Trigger**: 
- Called manually when roadmap regeneration is requested
- Processes all queued stages in sequence until complete

**Flow**:
1. Get next `pending` item from queue
2. Check dependencies are complete (wait if needed)
3. Mark as `processing`
4. Call appropriate stage function
5. Mark as `completed` or `failed`
6. Repeat until queue is empty or dependencies aren't ready

### 2. `generate-fit-profile`
**Stage**: `fit_assessment`  
**Model**: Claude 3.5 Sonnet  
**Trigger**: After Part 1 completion  
**Output**: Fit signals, personalized message, journey recommendation

### 3. `generate-five-year-vision`
**Stage**: `five_year_vision`  
**Model**: Claude Opus 4.5  
**Trigger**: After fit assessment approved  
**Output**: North star, tagline, key elements, year milestones

### 4. `generate-six-month-shift`
**Stage**: `six_month_shift`  
**Model**: Claude Sonnet 4.5  
**Trigger**: After vision approved  
**Output**: Shift statement, key milestones, gap analysis, quick wins

### 5. `generate-sprint-plan`
**Stage**: `sprint_plan`  
**Model**: Claude Sonnet 4.5  
**Trigger**: After shift approved  
**Output**: 12 weeks of specific tasks, phases, Tuesday evolution

### 6. `generate-value-analysis`
**Stage**: `value_analysis`  
**Model**: Claude Sonnet 4.5  
**Trigger**: After Part 3 completion  
**Output**: Asset scores, value gaps, risk register, valuation impact

---

## Auto-Chaining

The pipeline automatically chains stages via database trigger:

```sql
CREATE TRIGGER trg_auto_chain_generation
  AFTER UPDATE ON roadmap_stages
  FOR EACH ROW
  EXECUTE FUNCTION trigger_next_stage();
```

When a stage status changes to `generated`, the trigger:
1. Determines the next stage
2. Inserts into `generation_queue`
3. Orchestrator picks it up and processes

**Chain**:
- `fit_assessment` → `five_year_vision`
- `five_year_vision` → `six_month_shift`
- `six_month_shift` → `sprint_plan`

---

## Review Workflow

### Practice Review Page
**Route**: `/clients/:clientId/roadmap-review`

**Features**:
- View all stages with status indicators
- Expand/collapse each stage
- Edit generated content (JSON editor)
- Add edit reason (feeds learning DB)
- Approve individual stages
- Regenerate stages (cascades to dependents)
- Publish all approved stages to client

### Stage Status Flow
```
not_started → generating → generated → approved → published
                                    ↓
                                 rejected (regenerate)
```

### Publishing
- All stages must be `approved` before publishing
- Publishing sets status to `published`
- Client can now see the content
- `published_at` timestamp recorded

---

## Learning Loops

### Loop 1: Practice Edits
When practice team edits content before approval:
1. Edit reason captured in `generation_feedback`
2. `edit_type` classified (factual_correction, tone_adjustment, etc.)
3. `is_pattern` flag if recurring issue
4. Used to improve prompts over time

### Loop 2: Client Task Feedback
When client completes a task:
1. Feedback captured: what went well, what didn't work
2. Practice reviews feedback
3. Can flag as pattern
4. Feeds into task template improvements

---

## Setup Instructions

### 1. Run Migration
```bash
supabase migration up
```

This creates:
- `roadmap_stages` table
- `generation_feedback` table
- `generation_queue` table
- Helper functions and triggers
- RLS policies

### 2. Deploy Edge Functions
```bash
supabase functions deploy roadmap-orchestrator
supabase functions deploy generate-fit-profile
supabase functions deploy generate-five-year-vision
supabase functions deploy generate-six-month-shift
supabase functions deploy generate-sprint-plan
supabase functions deploy generate-value-analysis
```

### 3. Add Route to Platform App
```typescript
// apps/platform/src/routes.tsx
<Route path="/clients/:clientId/roadmap-review" element={<RoadmapReviewPage />} />
```

### 4. Trigger Generation
To start the pipeline for a client:

```typescript
// After Part 1 completion
await supabase.from('generation_queue').insert({
  practice_id: practiceId,
  client_id: clientId,
  stage_type: 'fit_assessment'
});
```

---

## Quality Standards

All stage functions include:
- **Quality rules**: Banned patterns, British English, claim sourcing
- **Evidence-based prompts**: Use client's explicit answers
- **Mechanical cleanup**: Post-process outputs for consistency
- **Error handling**: Graceful failures, retry logic

---

## Monitoring

### Check Pipeline Status
```sql
SELECT * FROM get_client_roadmap_status('client-uuid');
```

### View Queue
```sql
SELECT * FROM generation_queue 
WHERE status = 'pending' 
ORDER BY priority DESC, queued_at ASC;
```

### Review Feedback Patterns
```sql
SELECT 
  stage_type,
  edit_type,
  COUNT(*) as count,
  array_agg(DISTINCT feedback_text) as examples
FROM generation_feedback
WHERE is_pattern = TRUE
GROUP BY stage_type, edit_type;
```

---

## Next Steps

1. ✅ Database schema created
2. ✅ Edge functions created
3. ✅ React components created
4. ⏳ Add route to platform app
5. ✅ Orchestrator runs on-demand (no cron needed)
6. ⏳ Test full pipeline with real client
7. ⏳ Build feedback review page for practice team
8. ⏳ Integrate client task completion with feedback capture

---

## Benefits

1. **No Timeouts**: Each stage is separate, no 60s limit
2. **Quality Control**: Practice reviews before client sees
3. **Continuous Improvement**: Learning database captures patterns
4. **Scalable**: Can process multiple clients in parallel
5. **Transparent**: Full audit trail of generation and edits
6. **Flexible**: Can regenerate individual stages without full restart

---

## Troubleshooting

### Stage Stuck in "generating"
- Check edge function logs
- Verify orchestrator is running
- Check for errors in `generation_queue.last_error`

### Auto-chaining Not Working
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trg_auto_chain_generation';`
- Check function: `SELECT * FROM pg_proc WHERE proname = 'trigger_next_stage';`

### Queue Not Processing
- Check orchestrator function logs
- Manually trigger: `POST /functions/v1/roadmap-orchestrator`
- Verify queue items exist: `SELECT * FROM generation_queue WHERE status = 'pending';`

---

## Files Reference

| File | Purpose |
|------|---------|
| `migrations/20251216_staged_roadmap_architecture.sql` | Database schema |
| `functions/roadmap-orchestrator/index.ts` | Queue processor |
| `functions/generate-fit-profile/index.ts` | Fit assessment stage |
| `functions/generate-five-year-vision/index.ts` | Vision stage |
| `functions/generate-six-month-shift/index.ts` | Shift stage |
| `functions/generate-sprint-plan/index.ts` | Sprint stage |
| `functions/generate-value-analysis/index.ts` | Value analysis stage |
| `apps/platform/src/components/roadmap/StageReview.tsx` | Review component |
| `apps/platform/src/pages/clients/RoadmapReviewPage.tsx` | Review page |
| `apps/client-portal/src/components/tasks/TaskCompletionModal.tsx` | Feedback capture |


