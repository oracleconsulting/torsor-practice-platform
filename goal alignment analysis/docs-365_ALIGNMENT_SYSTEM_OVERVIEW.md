# 365 Alignment Service - Complete System Overview

**Version:** 2.0  
**Date:** December 2025  
**Status:** Production

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Assessment Flow](#assessment-flow)
3. [Database Architecture](#database-architecture)
4. [LLM Models & Routing](#llm-models--routing)
5. [Prompt Library](#prompt-library)
6. [Data Analysis Logic](#data-analysis-logic)
7. [Output Generation](#output-generation)
8. [Integration Points](#integration-points)
9. [Cost Structure](#cost-structure)

---

## System Overview

The **365 Alignment Programme** is a comprehensive business transformation service that guides clients through a 13-week (90-day) structured journey. The system uses AI-powered analysis to create personalized roadmaps based on three assessment phases.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT ASSESSMENT                        │
│  Part 1: Life Design (15 questions)                        │
│  Part 2: Business Deep Dive (72 questions)                 │
│  Part 3: Hidden Value Audit (32 questions)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  AI ANALYSIS PIPELINE                       │
│  1. Fit Assessment (Part 1) → Claude Haiku                 │
│  2. Roadmap Generation (Part 2) → Claude Sonnet 4          │
│  3. Value Analysis (Part 3) → Claude Sonnet 4              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  ROADMAP OUTPUT                             │
│  • 13-Week Sprint Plan                                      │
│  • 3-5 Strategic Priorities                                 │
│  • Weekly Tasks (3-5 per week)                              │
│  • Success Metrics                                          │
│  • Value Analysis Report                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT PORTAL & TRACKING                       │
│  • Task Completion Tracking                                 │
│  • AI Chat Assistant                                        │
│  • Progress Analytics                                       │
│  • Appointment Booking                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Assessment Flow

### Part 1: Life Design (15 Questions)

**Purpose:** Understand the client's personal vision, lifestyle goals, and relationship with their business.

**Key Questions:**
1. **Tuesday Test** - "Picture a random Tuesday 5 years from now. Walk me through your ideal day..."
2. **Money Truth** - Current vs desired personal income
3. **Business Reality** - Current vs target business turnover
4. **Emergency Log** - What emergencies pull them away from important work?
5. **Relationship Mirror** - "My business relationship feels like..."
6. **Sacrifices** - What have they given up for the business?
7. **Skills Confession** - What job title would they hire for their weakest area?
8. **90-Day Fantasy** - What would they do if business wouldn't collapse?
9. **Danger Zone** - What would sink the business if it broke?
10. **Growth Trap** - "I'd grow faster if only..."
11. **Commitment Hours** - Hours per week available for transformation

**Location:** `oracle-method-portal/src/data/assessmentQuestions.ts`

**Storage:** `client_assessments` table, `assessment_type = 'part1'`, `responses` JSONB

---

### Part 2: Business Deep Dive (72 Questions)

**Purpose:** Comprehensive business analysis across 12 sections.

**Sections:**
1. **Leadership & Vision Reality** (9 questions)
2. **Money Truth** (7 questions)
3. **Customer & Market Reality** (6 questions)
4. **Execution Engine** (8 questions)
5. **People & Culture** (3 questions)
6. **Tech & Data** (4 questions)
7. **Product & Customer Value** (6 questions)
8. **Risk & Compliance** (5 questions)
9. **Supply Chain & Partnerships** (2 questions)
10. **Market Position & Growth** (2 questions)
11. **Integration & Bottlenecks** (3 questions)
12. **External Support & Advisory Network** (additional questions)

**Location:** `oracle-method-portal/src/data/part2Questions.ts`

**Storage:** `client_assessments` table, `assessment_type = 'part2'`, `responses` JSONB

---

### Part 3: Hidden Value Audit (32 Questions)

**Purpose:** Identify hidden assets, value destroyers, and exit readiness.

**Focus Areas:**
- Intellectual property and processes
- Customer relationships and lifetime value
- Recurring revenue potential
- Team expertise
- Data and analytics
- Strategic partnerships
- Key person dependencies
- Documentation gaps
- Compliance status

**Storage:** `client_assessments` table, `assessment_type = 'part3'`, `responses` JSONB

---

## Database Architecture

### Core Tables

#### 1. `client_assessments`
```sql
CREATE TABLE client_assessments (
  id UUID PRIMARY KEY,
  practice_id UUID REFERENCES practices(id),
  client_id UUID REFERENCES practice_members(id),
  assessment_type VARCHAR(10) CHECK (assessment_type IN ('part1', 'part2', 'part3')),
  responses JSONB NOT NULL DEFAULT '{}',
  current_section INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'not_started',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(client_id, assessment_type)
);
```

**Key Features:**
- Single table for all assessment types
- Progress tracking embedded (no separate table)
- JSONB for flexible response storage
- Status workflow: `not_started` → `in_progress` → `completed` → `reviewed`

---

#### 2. `client_roadmaps`
```sql
CREATE TABLE client_roadmaps (
  id UUID PRIMARY KEY,
  practice_id UUID REFERENCES practices(id),
  client_id UUID REFERENCES practice_members(id),
  roadmap_data JSONB NOT NULL,
  fit_assessment JSONB,
  value_analysis JSONB,
  llm_model TEXT,
  prompt_version TEXT,
  generation_cost_cents INTEGER,
  generation_duration_ms INTEGER,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  manually_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Roadmap Data Structure:**
```typescript
{
  summary: {
    headline: string;
    keyInsight: string;
    expectedOutcome: string;
  };
  priorities: Array<{
    rank: number;
    title: string;
    description: string;
    category: 'Financial' | 'Operations' | 'Team' | 'Marketing' | 'Product' | 'Systems';
    targetOutcome: string;
    weekSpan: [number, number];
  }>;
  weeks: Array<{
    weekNumber: number;
    theme: string;
    focus: string;
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      priority: 'critical' | 'high' | 'medium';
      estimatedHours: number;
      dependsOn: string[] | null;
      deliverable: string;
      resources: string[] | null;
    }>;
    milestone: string | null;
    advisorCheckpoint: boolean;
  }>;
  successMetrics: Array<{
    metric: string;
    baseline: string;
    target: string;
    measurementMethod: string;
  }>;
}
```

---

#### 3. `client_tasks`
```sql
CREATE TABLE client_tasks (
  id UUID PRIMARY KEY,
  practice_id UUID REFERENCES practices(id),
  client_id UUID REFERENCES practice_members(id),
  roadmap_id UUID REFERENCES client_roadmaps(id),
  week_number INTEGER CHECK (week_number BETWEEN 1 AND 13),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Financial', 'Operations', 'Team', 'Marketing', 'Product', 'Systems', 'Personal')),
  priority TEXT DEFAULT 'medium',
  estimated_hours DECIMAL(4,1),
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP,
  completion_notes TEXT,
  attachments JSONB DEFAULT '[]',
  due_date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Task Status Flow:**
- `pending` → `in_progress` → `completed`
- Alternative: `skipped` or `deferred`

---

#### 4. `llm_usage_log`
```sql
CREATE TABLE llm_usage_log (
  id UUID PRIMARY KEY,
  practice_id UUID REFERENCES practices(id),
  client_id UUID REFERENCES practice_members(id),
  task_type TEXT CHECK (task_type IN (
    'fit_assessment', 'roadmap_generation', 'value_analysis',
    'chat_completion', 'meeting_agenda', 'task_breakdown',
    'document_summary', 'quarterly_review', 'pdf_generation'
  )),
  model TEXT NOT NULL,
  prompt_version TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_cents INTEGER,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose:** Track all LLM calls for cost management and debugging.

---

## LLM Models & Routing

### Model Selection Matrix

| Use Case | Primary Model | Fallback | Temperature | Max Tokens | Cost/Million (I/O) |
|----------|--------------|----------|-------------|------------|-------------------|
| **Fit Assessment** | Claude 3 Haiku | GPT-4o Mini | 0.3 | 1,000 | $0.25 / $1.25 |
| **Roadmap Generation** | Claude Sonnet 4 | GPT-4 Turbo | 0.7 | 4,000 | $3 / $15 |
| **Value Analysis** | Claude Sonnet 4 | GPT-4 Turbo | 0.7 | 4,000 | $3 / $15 |
| **Chat (Simple)** | Claude 3 Haiku | Claude Sonnet 4 | 0.3 | 1,000 | $0.25 / $1.25 |
| **Chat (Complex)** | Claude Sonnet 4 | - | 0.7 | 4,000 | $3 / $15 |
| **Meeting Agenda** | Claude 3 Haiku | - | 0.3 | 1,000 | $0.25 / $1.25 |
| **Task Breakdown** | Claude Sonnet 4 | - | 0.7 | 4,000 | $3 / $15 |
| **Quarterly Review** | Claude Opus 4.5 | - | 0.7 | 8,000 | $15 / $75 |
| **PDF Generation** | Claude Opus 4.5 | - | 0.7 | 8,000 | $15 / $75 |

### Intelligent Routing Logic

**Location:** `packages/llm/router.ts`

```typescript
const TASK_TO_TIER: Record<TaskType, keyof typeof MODEL_CONFIGS> = {
  fit_assessment: 'fast',           // Haiku
  roadmap_generation: 'balanced',   // Sonnet 4
  value_analysis: 'balanced',       // Sonnet 4
  chat_simple: 'fast',              // Haiku
  chat_complex: 'balanced',         // Sonnet 4
  meeting_agenda: 'fast',           // Haiku
  task_breakdown: 'balanced',       // Sonnet 4
  quarterly_review: 'premium',      // Opus 4.5
  pdf_generation: 'premium'         // Opus 4.5
};
```

**Chat Complexity Detection:**
- **Simple:** Short questions, basic task help, < 500 chars
- **Complex:** Strategic questions, explanations, comparisons, > 500 chars, financial data

---

## Prompt Library

### 1. Fit Assessment Prompt

**Model:** Claude 3 Haiku  
**Location:** `packages/llm/prompts/fit-assessment.ts`

```typescript
export const FIT_ASSESSMENT_PROMPT = `
You are evaluating a potential client's fit for the 365 Alignment Program.

## Assessment Responses
{part1Responses}

## Your Task
Analyze these responses to determine:
1. Program fit score (0-100)
2. Key strengths that will help them succeed
3. Potential challenges to address
4. Personalized welcome message

## Fit Criteria
- **Excellent Fit (80-100):** Clear goals, growth mindset, time commitment available, business has potential
- **Good Fit (60-79):** Most criteria met, some areas need attention
- **Moderate Fit (40-59):** Significant gaps, may need pre-program work
- **Poor Fit (0-39):** Major blockers, not ready for program

## Output Format (JSON)
{
  "fitScore": number,
  "fitCategory": "excellent" | "good" | "moderate" | "poor",
  "strengths": ["string", "string", "string"],
  "challenges": ["string", "string"],
  "recommendedFocus": "string",
  "welcomeMessage": "string (2-3 sentences, warm and personalized)",
  "advisorNotes": "string (internal notes for the team)"
}
`;
```

---

### 2. Roadmap Generation Prompt

**Model:** Claude Sonnet 4  
**Location:** `packages/llm/prompts/roadmap.ts`

```typescript
export const ROADMAP_GENERATION_PROMPT = `
You are an expert business strategist creating a personalized 90-day transformation roadmap.

## Client Profile
{clientProfile}

## Part 1 Assessment (Life Design)
{part1Responses}

## Part 2 Assessment (Business Deep Dive)
{part2Responses}

## Your Task
Create a comprehensive 13-week roadmap that:

1. **Identifies 3-5 Strategic Priorities** based on biggest opportunities and pain points
2. **Sequences tasks logically** - dependencies respected, quick wins early
3. **Balances across categories** - Financial, Operations, Team, Marketing, Product, Systems
4. **Matches their capacity** - Consider available time and resources
5. **Includes measurable milestones** - Clear success criteria for each week

## Constraints
- Maximum 5 tasks per week (3-4 is ideal)
- Each task should take 1-4 hours to complete
- Critical tasks should be front-loaded
- Include at least one "quick win" in Week 1
- Advisor checkpoint at weeks 1, 7, and 13

## Output Format (JSON)
{
  "summary": {
    "headline": "string",
    "keyInsight": "string",
    "expectedOutcome": "string"
  },
  "priorities": [...],
  "weeks": [...],
  "successMetrics": [...]
}
`;
```

**Full prompt template:** See `packages/llm/prompts/roadmap.ts`

---

### 3. Value Analysis Prompt

**Model:** Claude Sonnet 4  
**Location:** `packages/llm/prompts/value-analysis.ts`

```typescript
export const VALUE_ANALYSIS_PROMPT = `
You are a business valuation expert analyzing a company's hidden value and exit readiness.

## Part 3 Assessment (Hidden Value Audit)
{part3Responses}

## Previous Roadmap Context
{roadmapSummary}

## Your Task
Analyze responses to identify:

1. **Hidden Assets** - Undervalued or unrecognized value
2. **Value Destroyers** - Risks that could reduce business value
3. **Quick Value Wins** - Immediate actions to increase value
4. **Exit Readiness** - How prepared they are for future exit

## Analysis Categories

### Hidden Assets:
- Intellectual property (processes, systems, brand)
- Customer relationships and lifetime value
- Recurring revenue potential
- Team expertise and institutional knowledge
- Data and analytics capabilities
- Strategic partnerships
- Underutilized assets

### Value Destroyers:
- Key person dependencies
- Customer concentration
- Undocumented processes
- Technical debt
- Compliance gaps
- Owner involvement requirements

## Output Format (JSON)
{
  "executiveSummary": "string",
  "exitReadinessScore": {
    "overall": number (0-100),
    "breakdown": {...},
    "interpretation": "string"
  },
  "hiddenAssets": [...],
  "valueDestroyers": [...],
  "quickWins": [...],
  "valuationInsights": {...},
  "recommendedFocus": {...}
}
`;
```

---

### 4. Chat System Prompt

**Model:** Claude 3 Haiku (simple) / Claude Sonnet 4 (complex)  
**Location:** `packages/llm/prompts/chat-system.ts`

```typescript
export const CHAT_SYSTEM_PROMPT = `
You are a knowledgeable business advisor assistant for the 365 Alignment Program.

## Client Context
- Company: {companyName}
- Industry: {industry}
- Current Sprint Week: {currentWeek} of 13
- Current Focus: {currentWeekTheme}
- Tasks This Week: {currentTasks}
- Recent Completions: {recentCompletions}

## Their Roadmap Priorities
{priorities}

## Their Key Challenges
{challenges}

## Conversation Guidelines
1. Keep responses concise and actionable (2-4 paragraphs max)
2. Reference their specific roadmap when relevant
3. Offer to break down complex tasks
4. Acknowledge frustration and offer perspective
5. For complex strategic questions, suggest discussing with advisor
6. Celebrate wins and progress

## Things to Escalate to Human Advisor
- Major strategic pivots
- Financial decisions over £10k
- Legal or compliance concerns
- Emotional distress or crisis
- Requests to change roadmap significantly
`;
```

---

## Data Analysis Logic

### Business Stage Detection

**Location:** `packages/llm/src/generators/roadmap-generator.ts`

```typescript
private determineBusinessStage(part1: Record<string, any>, part2: Record<string, any>): string {
  const turnover = part2.annual_turnover || '';
  const teamSize = part2.team_size || 'solo';
  
  if (turnover.includes('Under £100k') || turnover === '') {
    return teamSize === 'solo' ? 'startup' : 'early_stage';
  } else if (turnover.includes('£100k-£250k')) {
    return 'early_stage';
  } else if (turnover.includes('£250k-£500k')) {
    return 'growth_stage';
  } else if (turnover.includes('£500k-£1m')) {
    return 'growth_stage';
  } else {
    return 'established';
  }
}
```

### Sprint Phase Definitions

```typescript
const SPRINT_PHASES = {
  RELIEF: { weeks: [1, 2], name: 'Immediate Relief', focus: 'Quick wins and pain reduction' },
  FOUNDATION: { weeks: [3, 4], name: 'Foundation Building', focus: 'Core systems and processes' },
  MOMENTUM: { weeks: [5, 6], name: 'Momentum Multiplication', focus: 'Scaling what works' },
  LOCK_IN: { weeks: [7, 8], name: 'Lock-In & Stabilize', focus: 'Embedding new habits' },
  SCALE: { weeks: [9, 10], name: 'Scale Phase', focus: 'Growth acceleration' },
  TRANSFORM: { weeks: [11, 12, 13], name: 'Transform & Sustain', focus: 'Long-term transformation' }
};
```

### Task Generation Logic

**Weekly Task Structure:**
1. **Quick Win Task** (30 minutes) - Build momentum
2. **Core Task 1** (2 hours) - Main focus for the week
3. **Core Task 2** (1.5 hours) - Secondary focus
4. **Reflection Task** (15 minutes) - Weekly review and planning

**Task Categories:**
- `quick_win` - Low effort, high impact
- `core_task` - Main transformation work
- `reflection` - Review and planning

---

## Output Generation

### Roadmap Generation Flow

```
1. Load Assessment Data
   ├─ Part 1 responses (Life Design)
   ├─ Part 2 responses (Business Deep Dive)
   └─ Part 3 responses (Hidden Value Audit)

2. Build Context
   ├─ Extract client profile
   ├─ Determine business stage
   ├─ Identify priorities
   └─ Calculate capacity

3. Generate Components (Sequential)
   ├─ Fit Assessment (Part 1) → Claude Haiku
   ├─ Roadmap (Part 2) → Claude Sonnet 4
   └─ Value Analysis (Part 3) → Claude Sonnet 4

4. Extract Tasks
   ├─ Parse roadmap JSON
   ├─ Create task records (client_tasks table)
   └─ Link to roadmap_id

5. Save & Activate
   ├─ Save roadmap to client_roadmaps
   ├─ Mark previous roadmap as inactive
   └─ Set new roadmap as active
```

### Edge Function: `generate-roadmap`

**Location:** `supabase/functions/generate-roadmap/index.ts`

**Endpoint:** `POST /functions/v1/generate-roadmap`

**Request Body:**
```typescript
{
  clientId: string;
  practiceId: string;
  regenerate?: boolean;  // If true, create new version
}
```

**Response:**
```typescript
{
  success: boolean;
  roadmapId: string;
  roadmap: RoadmapData;
  fitAssessment: FitAssessment;
  valueAnalysis: ValueAnalysis;
  generationCost: number;
  generationDuration: number;
}
```

---

## Integration Points

### 1. Client Portal Integration

**Assessment Pages:**
- `apps/client-portal/src/pages/assessments/Part1Page.tsx`
- `apps/client-portal/src/pages/assessments/Part2Page.tsx`
- `apps/client-portal/src/pages/assessments/Part3Page.tsx`

**Roadmap Display:**
- `apps/client-portal/src/pages/roadmap/RoadmapPage.tsx`
- `apps/client-portal/src/components/roadmap/WeeklySprintView.tsx`
- `apps/client-portal/src/components/roadmap/TaskCard.tsx`

**Task Tracking:**
- Real-time updates via Supabase subscriptions
- Task completion toggles
- Progress visualization

---

### 2. Practice Platform Integration

**Client Management:**
- `src/pages/admin/ClientServicesPage.tsx` - Service assignment
- `src/pages/admin/ClientDetailPage.tsx` - View client progress

**Roadmap Management:**
- View generated roadmaps
- Edit tasks and priorities
- Regenerate with AI
- Export to PDF

---

### 3. AI Chat Integration

**Chat Interface:**
- `apps/client-portal/src/pages/chat/ChatPage.tsx`
- Context-aware responses using roadmap data
- Task-specific help
- Escalation to human advisor

**Chat Context:**
- Current week and theme
- Active tasks
- Recent completions
- Roadmap priorities
- Client challenges

---

## Cost Structure

### Per-Client Cost Breakdown

**One-Time (Onboarding):**
- Fit Assessment: $0.02 (Haiku, ~500 tokens)
- Roadmap Generation: $0.80 (Sonnet 4, ~4,000 tokens)
- Value Analysis: $0.60 (Sonnet 4, ~3,000 tokens)
- **Total Onboarding: $1.42**

**Monthly Recurring:**
- Chat Messages: $0.30 (~30 messages/month, Haiku)
- Weekly Digests: $0.04 (4 digests, Haiku)
- Meeting Agendas: $0.02 (1-2 meetings/month, Haiku)
- **Total Monthly: $0.36**

**Quarterly:**
- Quarterly Review: $1.50 (Opus 4.5, comprehensive)
- Roadmap Refresh: $0.80 (Sonnet 4, regeneration)
- **Total Quarterly: $2.30**

**Annual Total per Client:**
- Onboarding: $1.42
- Monthly (12 months): $4.32
- Quarterly (4 quarters): $9.20
- **Total: $14.94 per client per year**

**For 50 Clients:** ~$750/year

---

## Key Files Reference

### Assessment Questions
- `oracle-method-portal/src/data/assessmentQuestions.ts` - Part 1 (15 questions)
- `oracle-method-portal/src/data/part2Questions.ts` - Part 2 (72 questions)
- Part 3 questions embedded in assessment flow

### LLM Prompts
- `packages/llm/src/prompts/fit-assessment.ts`
- `packages/llm/src/prompts/roadmap.ts`
- `packages/llm/src/prompts/value-analysis.ts`
- `packages/llm/src/prompts/chat-system.ts`

### Generators
- `packages/llm/src/generators/roadmap-generator.ts` - Roadmap generation logic
- `packages/llm/router.ts` - Model routing and cost tracking

### Edge Functions
- `supabase/functions/generate-roadmap/index.ts` - Main roadmap generation
- `supabase/functions/chat-completion/index.ts` - AI chat handler

### Database Schema
- `database/migrations/001_365_client_portal_schema.sql` - Complete schema

### Types
- `packages/shared/src/types/roadmap.ts` - TypeScript interfaces

---

## Version History

- **v2.0** (Dec 2025) - Current production version
- **v1.0** (Oct 2025) - Initial implementation

---

**Last Updated:** December 2025  
**Maintained By:** Development Team


