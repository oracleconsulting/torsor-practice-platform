# 365 Client Portal + Torsor Integration
## Complete Technical Specification

**Version:** 2.0  
**Date:** November 27, 2025  
**Status:** Approved for Implementation

---

## Architecture Overview

### Two-Portal System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UNIFIED SUPABASE                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  practice_members │ client_assessments │ client_roadmaps │ tasks    │   │
│  │  appointments     │ chat_threads       │ llm_execution_history      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                    │
                    ▼                                    ▼
    ┌───────────────────────────┐        ┌───────────────────────────┐
    │    CLIENT PORTAL          │        │    TORSOR PLATFORM        │
    │    (client.torsor.co)     │        │    (app.torsor.co)        │
    │                           │        │                           │
    │  • Complete assessments   │        │  • View all 365 clients   │
    │  • View dashboard         │        │  • Monitor progress       │
    │  • Chat with advisor      │        │  • Review roadmaps        │
    │  • Book appointments      │        │  • Manage appointments    │
    │  • Sprint task tracking   │        │  • Analytics dashboard    │
    │  • Document access        │        │  • Trigger LLM generation │
    │                           │        │  • Export/reporting       │
    │  Auth: Client login       │        │  Auth: Team login         │
    │  RLS: client_id scoped    │        │  RLS: practice_id scoped  │
    └───────────────────────────┘        └───────────────────────────┘
```

---

## Part 1: Feature Specification

### Client Portal Features (What Clients See)

#### 1. Assessment Hub

| Feature | Description |
|---------|-------------|
| Part 1: Life Design | 15 questions, conversational one-at-a-time UX |
| Part 2: Business Deep Dive | 72 questions, sectioned with progress |
| Part 3: Hidden Value Audit | 32 questions with inline insights |
| Review & Edit | Review all answers before final submission |
| Progress Persistence | Save and resume across sessions |
| Mobile-Responsive | Complete from any device |

#### 2. Client Dashboard

| Component | Description |
|-----------|-------------|
| Personalized Welcome | Key metrics and current status |
| Current Sprint | Week X of 13 highlighted |
| Weekly Tasks | Tasks due with completion toggles |
| Roadmap Timeline | Gantt-style or milestone visualization |
| Value Analysis Summary | Exit readiness score, hidden assets |
| Quick Actions | Book call, Ask question, View documents |

#### 3. AI Chat Interface

| Feature | Description |
|---------|-------------|
| Contextual Assistant | Trained on their assessment data |
| Smart Responses | "What should I focus on this week?" |
| Roadmap Explanations | Can explain roadmap decisions |
| Task Breakdown | Help break down complex tasks |
| Conversation History | Preserved across sessions |
| Escalation | Route to human advisor when needed |

#### 4. Appointment Booking

| Feature | Description |
|---------|-------------|
| Calendar Integration | Calendly or Cal.com embed |
| Upcoming View | See scheduled appointments |
| Reschedule | Self-service rescheduling |
| Pre-call Agenda | AI-generated based on progress |

#### 5. Sprint Task Management

| Feature | Description |
|---------|-------------|
| 13-Week View | Weekly breakdown timeline |
| Task Cards | Title, description, category, priority |
| Completion Tracking | Status with timestamps |
| Notes/Comments | Per-task comments |
| File Attachments | Receipts, documents per task |
| Celebrations | Milestone achievement moments |

#### 6. Document Vault

| Feature | Description |
|---------|-------------|
| Shared Documents | Access practice-shared files |
| Upload Capability | Client document uploads |
| Version History | Track document versions |
| Secure Downloads | Authenticated download links |

---

### Torsor Platform Features (What Your Team Sees)

#### 1. 365 Client List View

| Feature | Description |
|---------|-------------|
| Client Roster | All 365 Alignment Program clients |
| Status Indicators | Assessment stage, Sprint week, Engagement level |
| Sort/Filter | By progress, last activity, start date, risk flags |
| Quick Actions | View profile, Send reminder, Book call |

#### 2. Individual Client View

| Feature | Description |
|---------|-------------|
| Assessment Responses | Full Part 1, 2, 3 data |
| Roadmap Editor | View and edit capability |
| Task Timeline | Completion history |
| Chat History | AI assistant conversations |
| Appointments | Past and scheduled |
| Engagement Analytics | Logins, completions, time-in-app |
| Team Notes | Internal notes |
| Risk Flags | Stalled progress, overdue tasks |

#### 3. Roadmap Management

| Feature | Description |
|---------|-------------|
| View Roadmap | Generated roadmap display |
| Edit Capability | Modify tasks, priorities, dates |
| AI Regeneration | Regenerate sections with AI |
| Export | PDF/Word for meetings |
| Version History | Track all versions |

#### 4. Analytics Dashboard

| Metric | Description |
|--------|-------------|
| Completion Rates | Program-wide assessment completion |
| Engagement Scores | Average client engagement |
| LLM Usage | Model usage and costs |
| Revenue Attribution | Clients → program revenue |

#### 5. Communication Tools

| Feature | Description |
|---------|-------------|
| Nudge Emails | Templated reminder emails |
| Bulk Reminders | For stalled clients |
| Check-in Sequences | Scheduled touchpoint automation |

---

## Part 2: Database Schema

### Core Client Management

```sql
-- =============================================================================
-- CORE CLIENT MANAGEMENT
-- =============================================================================

-- Extend practice_members for clients
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS member_type VARCHAR(20) 
  DEFAULT 'team' CHECK (member_type IN ('team', 'client', 'advisor'));
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS client_company TEXT;
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS client_industry TEXT;
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS client_stage TEXT; -- startup, growth, mature, exit-planning
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS program_enrolled_at TIMESTAMP;
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS program_status VARCHAR(20) 
  DEFAULT 'active' CHECK (program_status IN ('invited', 'active', 'paused', 'completed', 'churned'));
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS assigned_advisor_id UUID REFERENCES practice_members(id);
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS client_portal_last_login TIMESTAMP;

-- Client-specific settings
CREATE TABLE client_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_member_id UUID UNIQUE REFERENCES practice_members(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{"email_reminders": true, "weekly_digest": true}'::jsonb,
  dashboard_preferences JSONB DEFAULT '{}'::jsonb,
  timezone TEXT DEFAULT 'Europe/London',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Assessment System

```sql
-- =============================================================================
-- ASSESSMENT SYSTEM
-- =============================================================================

CREATE TABLE client_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  assessment_type VARCHAR(10) NOT NULL CHECK (assessment_type IN ('part1', 'part2', 'part3')),
  
  -- Response data
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Progress tracking (embedded, no separate table needed)
  current_section INTEGER DEFAULT 0,
  sections_completed INTEGER[] DEFAULT '{}',
  completion_percentage INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'not_started' 
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'reviewed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES practice_members(id),
  
  -- Metadata
  device_info JSONB, -- Track if mobile/desktop completion
  time_spent_seconds INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(client_member_id, assessment_type)
);

-- Indexes for common queries
CREATE INDEX idx_assessments_client ON client_assessments(client_member_id);
CREATE INDEX idx_assessments_status ON client_assessments(practice_id, status);
CREATE INDEX idx_assessments_type_status ON client_assessments(assessment_type, status);
```

### Roadmap & Tasks

```sql
-- =============================================================================
-- ROADMAP & TASKS
-- =============================================================================

CREATE TABLE client_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  -- Generated content
  roadmap_data JSONB NOT NULL, -- Full roadmap structure
  fit_assessment JSONB, -- Part 1 analysis
  value_analysis JSONB, -- Part 3 analysis
  
  -- Generation metadata
  llm_model_used TEXT,
  prompt_version TEXT,
  generation_cost DECIMAL(10,4),
  generation_duration_ms INTEGER,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  superseded_by UUID REFERENCES client_roadmaps(id),
  
  -- Manual edits tracking
  manually_edited BOOLEAN DEFAULT FALSE,
  edited_by UUID REFERENCES practice_members(id),
  edited_at TIMESTAMP,
  edit_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_roadmaps_active ON client_roadmaps(client_member_id, is_active) WHERE is_active = TRUE;

CREATE TABLE client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  roadmap_id UUID REFERENCES client_roadmaps(id) ON DELETE SET NULL,
  
  -- Task details
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 13),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Financial', 'Operations', 'Team', 'Marketing', 'Product', 'Systems', 'Personal')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'deferred')),
  completed_at TIMESTAMP,
  completion_notes TEXT,
  
  -- Evidence/attachments
  attachments JSONB DEFAULT '[]'::jsonb, -- [{filename, storage_path, uploaded_at}]
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Scheduling
  due_date DATE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_client_week ON client_tasks(client_member_id, week_number);
CREATE INDEX idx_tasks_status ON client_tasks(client_member_id, status);
CREATE INDEX idx_tasks_due ON client_tasks(due_date) WHERE status = 'pending';
```

### AI Chat System

```sql
-- =============================================================================
-- AI CHAT SYSTEM
-- =============================================================================

CREATE TABLE client_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  title TEXT, -- Auto-generated or manual
  thread_type TEXT DEFAULT 'general' CHECK (thread_type IN ('general', 'task_help', 'roadmap_question', 'escalated')),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'escalated')),
  escalated_to UUID REFERENCES practice_members(id),
  escalated_at TIMESTAMP,
  resolved_at TIMESTAMP,
  
  -- Context for AI
  context_snapshot JSONB, -- Snapshot of relevant client data when thread started
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE client_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES client_chat_threads(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'advisor')),
  content TEXT NOT NULL,
  
  -- For AI messages
  llm_model TEXT,
  tokens_used INTEGER,
  generation_cost DECIMAL(10,4),
  
  -- For advisor messages
  sent_by UUID REFERENCES practice_members(id),
  
  -- Metadata
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_thread ON client_chat_messages(thread_id, created_at);
```

### Appointments

```sql
-- =============================================================================
-- APPOINTMENTS
-- =============================================================================

CREATE TABLE client_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES practice_members(id),
  
  -- Scheduling
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  timezone TEXT DEFAULT 'Europe/London',
  
  -- Type and status
  appointment_type TEXT DEFAULT 'check_in' 
    CHECK (appointment_type IN ('initial', 'check_in', 'quarterly_review', 'ad_hoc', 'escalation')),
  status TEXT DEFAULT 'scheduled' 
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')),
  
  -- Integration
  external_calendar_id TEXT, -- Calendly/Cal.com ID
  video_link TEXT,
  
  -- Content
  agenda JSONB, -- AI-generated or manual agenda items
  notes TEXT, -- Post-meeting notes
  action_items JSONB, -- Tasks created from meeting
  
  -- Tracking
  reminder_sent_at TIMESTAMP,
  confirmed_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_appointments_client ON client_appointments(client_member_id, scheduled_at);
CREATE INDEX idx_appointments_advisor ON client_appointments(advisor_id, scheduled_at);
CREATE INDEX idx_appointments_upcoming ON client_appointments(scheduled_at) WHERE status IN ('scheduled', 'confirmed');
```

### Engagement Tracking

```sql
-- =============================================================================
-- ENGAGEMENT TRACKING
-- =============================================================================

CREATE TABLE client_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
  client_member_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL,
  -- Types: 'login', 'assessment_progress', 'task_completed', 'chat_message', 
  --        'document_viewed', 'appointment_booked', 'roadmap_viewed'
  
  activity_data JSONB DEFAULT '{}'::jsonb,
  
  -- Session tracking
  session_id UUID,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_client_date ON client_activity_log(client_member_id, created_at DESC);
CREATE INDEX idx_activity_type ON client_activity_log(activity_type, created_at DESC);

-- Materialized view for dashboard metrics
CREATE MATERIALIZED VIEW client_engagement_metrics AS
SELECT 
  client_member_id,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as activities_7d,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as activities_30d,
  MAX(created_at) as last_activity,
  COUNT(*) FILTER (WHERE activity_type = 'login' AND created_at > NOW() - INTERVAL '30 days') as logins_30d,
  COUNT(*) FILTER (WHERE activity_type = 'task_completed' AND created_at > NOW() - INTERVAL '30 days') as tasks_completed_30d
FROM client_activity_log
GROUP BY client_member_id;

CREATE INDEX idx_engagement_metrics ON client_engagement_metrics(client_member_id);
```

### Row Level Security

```sql
-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE client_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;

-- Client can only see their own data
CREATE POLICY "Clients see own assessments" ON client_assessments
  FOR ALL USING (
    client_member_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients see own tasks" ON client_tasks
  FOR ALL USING (
    client_member_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients see own chat threads" ON client_chat_threads
  FOR ALL USING (
    client_member_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients see own messages" ON client_chat_messages
  FOR ALL USING (
    thread_id IN (
      SELECT id FROM client_chat_threads WHERE client_member_id IN (
        SELECT id FROM practice_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Clients see own appointments" ON client_appointments
  FOR ALL USING (
    client_member_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Clients see own roadmaps" ON client_roadmaps
  FOR ALL USING (
    client_member_id IN (
      SELECT id FROM practice_members WHERE user_id = auth.uid()
    )
  );

-- Team members see all clients in their practice
CREATE POLICY "Team sees practice assessments" ON client_assessments
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Team sees practice tasks" ON client_tasks
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Team sees practice chat" ON client_chat_threads
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Team sees practice appointments" ON client_appointments
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

CREATE POLICY "Team sees practice roadmaps" ON client_roadmaps
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );
```

---

## Part 3: LLM Strategy

### Model Selection Matrix

| Use Case | Primary Model | Fallback | Rationale |
|----------|--------------|----------|-----------|
| Fit Assessment (Part 1) | claude-3-haiku | gpt-4o-mini | Simple classification, fast |
| Roadmap Generation (Part 2) | claude-sonnet-4 | gpt-4-turbo | Complex reasoning needed |
| Value Analysis (Part 3) | claude-sonnet-4 | gpt-4-turbo | Financial accuracy |
| Chat Assistant | claude-3-haiku | claude-sonnet-4 | Fast for simple, escalate for complex |
| Meeting Agenda | claude-3-haiku | - | Template-based |
| Task Breakdown | claude-sonnet-4 | - | Context understanding |
| Document Summary | claude-3-haiku | - | Fast extraction |
| Roadmap PDF | claude-opus-4.5 | - | High-quality prose |
| Weekly Digest Email | claude-3-haiku | - | Template completion |
| Complex Strategic Questions | claude-opus-4.5 | - | Best reasoning |

### Cost Estimation

```typescript
const LLM_COSTS_PER_CLIENT = {
  // One-time (during onboarding)
  fitAssessment: 0.02,      // Haiku: ~500 tokens
  roadmapGeneration: 0.80,  // Sonnet: ~4000 tokens
  valueAnalysis: 0.60,      // Sonnet: ~3000 tokens
  
  // Monthly recurring
  chatMessages: 0.30,       // ~30 messages/month, Haiku
  weeklyDigests: 0.04,      // 4 digests, Haiku
  meetingAgendas: 0.02,     // 1-2 meetings/month, Haiku
  
  // Quarterly
  quarterlyReview: 1.50,    // Opus for comprehensive review
  roadmapRefresh: 0.80,     // Sonnet regeneration
  
  // Annual totals
  onboarding: 1.42,
  monthlyOngoing: 0.36,
  quarterly: 2.30,
  
  // Total per client per year: £15.94
};

// For 50 clients: ~£800/year
```

### Intelligent Model Routing

```typescript
// packages/llm/router.ts

import { OpenAI } from 'openai';

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

interface ModelConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  fallback?: string;
  costPerMillion: { input: number; output: number };
}

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  fast: {
    model: 'anthropic/claude-3-haiku-20240307',
    maxTokens: 1000,
    temperature: 0.3,
    fallback: 'openai/gpt-4o-mini',
    costPerMillion: { input: 0.25, output: 1.25 }
  },
  balanced: {
    model: 'anthropic/claude-sonnet-4-20250514',
    maxTokens: 4000,
    temperature: 0.7,
    fallback: 'openai/gpt-4-turbo',
    costPerMillion: { input: 3, output: 15 }
  },
  premium: {
    model: 'anthropic/claude-opus-4-5-20250514',
    maxTokens: 8000,
    temperature: 0.7,
    costPerMillion: { input: 15, output: 75 }
  }
};

type TaskType = 
  | 'fit_assessment' 
  | 'roadmap_generation' 
  | 'value_analysis'
  | 'chat_simple'
  | 'chat_complex'
  | 'meeting_agenda'
  | 'task_breakdown'
  | 'document_summary'
  | 'quarterly_review'
  | 'pdf_generation';

const TASK_TO_TIER: Record<TaskType, keyof typeof MODEL_CONFIGS> = {
  fit_assessment: 'fast',
  roadmap_generation: 'balanced',
  value_analysis: 'balanced',
  chat_simple: 'fast',
  chat_complex: 'balanced',
  meeting_agenda: 'fast',
  task_breakdown: 'balanced',
  document_summary: 'fast',
  quarterly_review: 'premium',
  pdf_generation: 'premium'
};

export async function generateWithRouting(
  taskType: TaskType,
  prompt: string,
  context?: {
    clientId: string;
    practiceId: string;
    requestedBy?: string;
  }
): Promise<LLMResult> {
  const tier = TASK_TO_TIER[taskType];
  const config = MODEL_CONFIGS[tier];
  
  const startTime = Date.now();
  
  try {
    const response = await openrouter.chat.completions.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [{ role: 'user', content: prompt }],
      ...(taskType !== 'pdf_generation' && { 
        response_format: { type: 'json_object' } 
      })
    });
    
    const duration = Date.now() - startTime;
    const usage = response.usage;
    const cost = calculateCost(usage, config.costPerMillion);
    
    // Log to database
    if (context) {
      await logLLMUsage({
        clientMemberId: context.clientId,
        practiceId: context.practiceId,
        taskType,
        model: config.model,
        tokensInput: usage?.prompt_tokens || 0,
        tokensOutput: usage?.completion_tokens || 0,
        cost,
        durationMs: duration,
        success: true
      });
    }
    
    return {
      success: true,
      content: response.choices[0].message.content,
      model: config.model,
      usage,
      cost,
      duration
    };
    
  } catch (error) {
    // Try fallback model
    if (config.fallback) {
      console.log(`Primary model failed, trying fallback: ${config.fallback}`);
      return generateWithFallback(config.fallback, prompt, context, taskType);
    }
    
    throw error;
  }
}

// Chat-specific routing with complexity detection
export async function routeChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
  clientContext: ClientContext
): Promise<LLMResult> {
  const complexity = detectMessageComplexity(message, conversationHistory);
  const taskType = complexity === 'complex' ? 'chat_complex' : 'chat_simple';
  
  const systemPrompt = buildChatSystemPrompt(clientContext);
  const fullPrompt = buildConversationalPrompt(systemPrompt, conversationHistory, message);
  
  return generateWithRouting(taskType, fullPrompt, {
    clientId: clientContext.clientId,
    practiceId: clientContext.practiceId
  });
}

function detectMessageComplexity(
  message: string, 
  history: ChatMessage[]
): 'simple' | 'complex' {
  const complexIndicators = [
    message.length > 500,
    message.includes('explain'),
    message.includes('why'),
    message.includes('compare'),
    message.includes('strategy'),
    message.includes('financial'),
    history.length > 10,
    /\d{4,}/.test(message),
  ];
  
  const complexCount = complexIndicators.filter(Boolean).length;
  return complexCount >= 2 ? 'complex' : 'simple';
}
```

---

## Part 4: Monorepo Structure

### Deployment Architecture

**Recommended: Option A (Subdomain)**
- `app.torsor.co` → Torsor Platform (team)
- `client.torsor.co` → Client Portal
- `api.torsor.co` → Supabase Edge Functions

### Directory Structure

```
torsor/
├── apps/
│   ├── platform/                    # Team-facing Torsor
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── admin/
│   │   │   │   │   ├── clients/
│   │   │   │   │   │   ├── ClientListPage.tsx
│   │   │   │   │   │   ├── ClientDetailPage.tsx
│   │   │   │   │   │   └── ClientAnalyticsPage.tsx
│   │   │   │   │   └── 365-program/
│   │   │   │   │       ├── ProgramOverviewPage.tsx
│   │   │   │   │       └── RoadmapManagerPage.tsx
│   │   │   │   └── [existing pages]
│   │   │   └── components/
│   │   └── package.json
│   │
│   └── client-portal/               # Client-facing portal
│       ├── src/
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── assessments/
│       │   │   │   ├── Part1Page.tsx
│       │   │   │   ├── Part2Page.tsx
│       │   │   │   ├── Part3Page.tsx
│       │   │   │   └── ReviewPage.tsx
│       │   │   ├── roadmap/
│       │   │   │   ├── RoadmapPage.tsx
│       │   │   │   └── TaskDetailPage.tsx
│       │   │   ├── chat/
│       │   │   │   └── ChatPage.tsx
│       │   │   ├── appointments/
│       │   │   │   └── BookingPage.tsx
│       │   │   └── documents/
│       │   │       └── VaultPage.tsx
│       │   ├── components/
│       │   │   ├── assessment/
│       │   │   │   ├── QuestionRenderer.tsx
│       │   │   │   ├── ProgressBar.tsx
│       │   │   │   └── SectionNav.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── WeeklySprintCard.tsx
│       │   │   │   ├── TaskList.tsx
│       │   │   │   ├── MetricsCards.tsx
│       │   │   │   └── TimelineView.tsx
│       │   │   ├── chat/
│       │   │   │   ├── ChatWindow.tsx
│       │   │   │   ├── MessageBubble.tsx
│       │   │   │   └── QuickActions.tsx
│       │   │   └── common/
│       │   │       ├── ClientHeader.tsx
│       │   │       ├── MobileNav.tsx
│       │   │       └── LoadingStates.tsx
│       │   ├── hooks/
│       │   │   ├── useClientAuth.ts
│       │   │   ├── useAssessment.ts
│       │   │   ├── useTasks.ts
│       │   │   ├── useChat.ts
│       │   │   └── useRoadmap.ts
│       │   └── lib/
│       │       └── client-supabase.ts
│       └── package.json
│
├── packages/
│   ├── shared/                      # Shared between both apps
│   │   ├── types/
│   │   │   ├── assessment.ts
│   │   │   ├── client.ts
│   │   │   ├── roadmap.ts
│   │   │   └── chat.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   └── utils.ts
│   │   └── constants/
│   │       ├── assessment-questions.ts
│   │       └── categories.ts
│   │
│   ├── llm/                         # LLM integration layer
│   │   ├── prompts/
│   │   │   ├── roadmap.ts
│   │   │   ├── value-analysis.ts
│   │   │   ├── chat-system.ts
│   │   │   └── meeting-agenda.ts
│   │   ├── router.ts
│   │   └── index.ts
│   │
│   └── ui/                          # Shared UI components
│       ├── components/
│       └── styles/
│
├── supabase/
│   ├── functions/
│   │   ├── generate-roadmap/
│   │   ├── generate-value-analysis/
│   │   ├── chat-completion/
│   │   └── send-reminder/
│   └── migrations/
│
└── package.json                     # Workspace root
```

---

## Part 5: Prompt Library

### Fit Assessment (Part 1)

```typescript
// packages/llm/prompts/fit-assessment.ts

export const FIT_ASSESSMENT_PROMPT = `
You are evaluating a potential client's fit for the 365 Alignment Program, a comprehensive business transformation service.

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

### Roadmap Generation (Part 2)

```typescript
// packages/llm/prompts/roadmap.ts

export const ROADMAP_GENERATION_PROMPT = `
You are an expert business strategist creating a personalized 90-day transformation roadmap for a business owner.

## Client Profile
{clientProfile}

## Part 1 Assessment (Life Design)
{part1Responses}

## Part 2 Assessment (Business Deep Dive)
{part2Responses}

## Your Task
Create a comprehensive 13-week roadmap that:

1. **Identifies 3-5 Strategic Priorities** based on their biggest opportunities and pain points
2. **Sequences tasks logically** - dependencies respected, quick wins early
3. **Balances across categories** - Financial, Operations, Team, Marketing, Product, Systems
4. **Matches their capacity** - Consider their available time and resources
5. **Includes measurable milestones** - Clear success criteria for each week

## Business Context
- Industry: {industry}
- Stage: {businessStage}
- Revenue: {revenue}
- Team size: {teamSize}
- Available hours per week: {availableHours}

## Constraints
- Maximum 5 tasks per week (3-4 is ideal for most clients)
- Each task should take 1-4 hours to complete
- Critical tasks should be front-loaded
- Include at least one "quick win" in Week 1

## Output Format (JSON)
{
  "summary": {
    "headline": "string (compelling summary of their transformation)",
    "keyInsight": "string (the most important thing you noticed)",
    "expectedOutcome": "string (what success looks like at 90 days)"
  },
  "priorities": [
    {
      "rank": 1,
      "title": "string",
      "description": "string",
      "category": "Financial" | "Operations" | "Team" | "Marketing" | "Product" | "Systems",
      "targetOutcome": "string",
      "weekSpan": [1, 13]
    }
  ],
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "string (e.g., 'Foundation & Quick Wins')",
      "focus": "string (primary priority for this week)",
      "tasks": [
        {
          "id": "w1-t1",
          "title": "string",
          "description": "string (clear, actionable instructions)",
          "category": "string",
          "priority": "critical" | "high" | "medium",
          "estimatedHours": number,
          "dependsOn": ["task-id"] | null,
          "deliverable": "string (what they should have completed)",
          "resources": ["string"] | null
        }
      ],
      "milestone": "string (what success looks like this week)" | null,
      "advisorCheckpoint": boolean
    }
  ],
  "successMetrics": [
    {
      "metric": "string",
      "baseline": "string (current state)",
      "target": "string (90-day goal)",
      "measurementMethod": "string"
    }
  ]
}
`;
```

### Value Analysis (Part 3)

```typescript
// packages/llm/prompts/value-analysis.ts

export const VALUE_ANALYSIS_PROMPT = `
You are a business valuation expert analyzing a company's hidden value and exit readiness for the 365 Alignment Program.

## Client Profile
{clientProfile}

## Part 3 Assessment (Hidden Value Audit)
{part3Responses}

## Previous Roadmap Context
{roadmapSummary}

## Your Task
Analyze their responses to identify:

1. **Hidden Assets** - Undervalued or unrecognized value in the business
2. **Value Destroyers** - Risks that could reduce business value
3. **Quick Value Wins** - Immediate actions to increase value
4. **Exit Readiness** - How prepared they are for a future exit (even if not planned)

## Analysis Categories

### Hidden Assets to Look For:
- Intellectual property (processes, systems, brand)
- Customer relationships and lifetime value
- Recurring revenue potential
- Team expertise and institutional knowledge
- Data and analytics capabilities
- Strategic partnerships
- Underutilized assets

### Value Destroyers to Identify:
- Key person dependencies
- Customer concentration
- Undocumented processes
- Technical debt
- Compliance gaps
- Owner involvement requirements

## Output Format (JSON)
{
  "executiveSummary": "string (2-3 paragraphs summarizing findings)",
  
  "exitReadinessScore": {
    "overall": number (0-100),
    "breakdown": {
      "financials": number,
      "operations": number,
      "team": number,
      "documentation": number,
      "customerBase": number,
      "marketPosition": number
    },
    "interpretation": "string"
  },
  
  "hiddenAssets": [
    {
      "asset": "string",
      "currentState": "string",
      "potentialValue": "string (estimated £ range)",
      "unlockStrategy": "string",
      "timeToRealize": "string",
      "priority": "high" | "medium" | "low"
    }
  ],
  
  "valueDestroyers": [
    {
      "risk": "string",
      "currentImpact": "string",
      "potentialImpact": "string",
      "mitigationStrategy": "string",
      "urgency": "critical" | "high" | "medium" | "low"
    }
  ],
  
  "quickWins": [
    {
      "action": "string",
      "valueImpact": "string",
      "effort": "low" | "medium" | "high",
      "timeline": "string"
    }
  ],
  
  "valuationInsights": {
    "estimatedCurrentMultiple": "string (e.g., '2-3x revenue')",
    "potentialMultiple": "string (with improvements)",
    "keyDrivers": ["string"],
    "comparables": "string (industry context)"
  },
  
  "recommendedFocus": {
    "immediate": ["string", "string"],
    "shortTerm": ["string", "string"],
    "longTerm": ["string", "string"]
  }
}
`;
```

### Chat System Prompt

```typescript
// packages/llm/prompts/chat-system.ts

export const CHAT_SYSTEM_PROMPT = `
You are a knowledgeable business advisor assistant for the 365 Alignment Program. You're helping {clientName} navigate their business transformation journey.

## Your Role
- Provide helpful, actionable guidance based on their specific situation
- Reference their roadmap and assessment data when relevant
- Be encouraging but realistic
- Know when to escalate to their human advisor

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
1. Keep responses concise and actionable (2-4 paragraphs max for most questions)
2. When they ask about tasks, reference their specific roadmap
3. If they seem stuck, offer to break down the task into smaller steps
4. If they express frustration, acknowledge it and offer perspective
5. For complex strategic questions, suggest they discuss with their advisor
6. Celebrate wins and progress

## Things You Can Help With
- Explaining tasks and why they matter
- Breaking down complex tasks into steps
- Providing templates or frameworks
- Answering business questions related to their industry
- Motivation and accountability
- Scheduling suggestions

## Things to Escalate to Human Advisor
- Major strategic pivots
- Financial decisions over £10k
- Legal or compliance concerns
- Emotional distress or crisis
- Requests to change the roadmap significantly
- Anything you're uncertain about

## Response Format
- Use natural, conversational language
- Include specific references to their situation when helpful
- End with a clear next step or question when appropriate
`;

export function buildChatSystemPrompt(context: ClientContext): string {
  return CHAT_SYSTEM_PROMPT
    .replace('{clientName}', context.clientName)
    .replace('{companyName}', context.companyName)
    .replace('{industry}', context.industry)
    .replace('{currentWeek}', context.currentWeek.toString())
    .replace('{currentWeekTheme}', context.currentWeekTheme)
    .replace('{currentTasks}', formatTaskList(context.currentTasks))
    .replace('{recentCompletions}', formatCompletions(context.recentCompletions))
    .replace('{priorities}', formatPriorities(context.priorities))
    .replace('{challenges}', formatChallenges(context.challenges));
}
```

---

## Part 6: Security Architecture

### Authentication Flow

```typescript
// Client Portal Authentication

// 1. Invitation Flow (Practice sends invite)
async function inviteClient(practiceId: string, clientEmail: string, clientName: string) {
  // Create practice_member record
  const { data: member } = await supabase
    .from('practice_members')
    .insert({
      practice_id: practiceId,
      email: clientEmail,
      full_name: clientName,
      member_type: 'client',
      program_status: 'invited'
    })
    .select()
    .single();
  
  // Generate magic link
  const { data: authData } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: clientEmail,
    options: {
      redirectTo: `${CLIENT_PORTAL_URL}/onboarding`
    }
  });
  
  // Send branded email via Resend
  await sendClientInvitation({
    to: clientEmail,
    clientName,
    practiceName: practice.name,
    magicLink: authData.properties.action_link
  });
  
  return member;
}

// 2. Session Validation
async function validateClientSession(userId: string): Promise<ClientSession | null> {
  const { data: member } = await supabase
    .from('practice_members')
    .select(`
      id,
      practice_id,
      full_name,
      email,
      member_type,
      program_status,
      client_company,
      assigned_advisor:assigned_advisor_id(id, full_name, email)
    `)
    .eq('user_id', userId)
    .eq('member_type', 'client')
    .eq('is_active', true)
    .single();
  
  if (!member) return null;
  
  // Update last login
  await supabase
    .from('practice_members')
    .update({ client_portal_last_login: new Date() })
    .eq('id', member.id);
  
  return {
    clientId: member.id,
    practiceId: member.practice_id,
    name: member.full_name,
    email: member.email,
    company: member.client_company,
    status: member.program_status,
    advisor: member.assigned_advisor
  };
}
```

---

## Part 7: Implementation Phases

### Phase 0: Foundation Setup (Week 1)
- [ ] Set up monorepo structure
- [ ] Configure shared packages
- [ ] Run database migrations
- [ ] Set up Supabase Edge Functions scaffolding
- [ ] Configure CI/CD for both apps
- [ ] Set up staging environments

### Phase 1: Client Portal Shell + Auth (Week 2)
- [ ] Client portal routing setup
- [ ] Authentication flow (magic link)
- [ ] Client session management
- [ ] Basic layout and navigation
- [ ] Mobile-responsive shell

### Phase 2: Assessment System (Week 3-4)
- [ ] Part 1 assessment (15 questions)
- [ ] Part 2 assessment (72 questions, sectioned)
- [ ] Part 3 assessment (32 questions)
- [ ] Progress persistence
- [ ] Review and edit capability
- [ ] Auto-save with debouncing

### Phase 3: LLM Integration (Week 5-6)
- [ ] Edge Functions for LLM calls
- [ ] Fit assessment generation
- [ ] Roadmap generation
- [ ] Value analysis generation
- [ ] Cost tracking integration
- [ ] Error handling and retries

### Phase 4: Client Dashboard (Week 7-8)
- [ ] Dashboard home with metrics
- [ ] Roadmap visualization
- [ ] Task list with completion
- [ ] Weekly sprint view
- [ ] Value analysis display
- [ ] Progress charts

### Phase 5: AI Chat (Week 9)
- [ ] Chat interface
- [ ] Context-aware responses
- [ ] Conversation history
- [ ] Escalation to advisor

### Phase 6: Appointments & Documents (Week 10)
- [ ] Cal.com/Calendly integration
- [ ] Appointment booking flow
- [ ] Document vault
- [ ] File upload/download

### Phase 7: Torsor Admin Views (Week 11)
- [ ] Client list in Torsor
- [ ] Individual client view
- [ ] Assessment review capability
- [ ] Roadmap editing
- [ ] Communication tools

### Phase 8: Polish & Launch (Week 12)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] First client onboarding
- [ ] Monitoring setup

---

## Part 8: Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deployment | Subdomain (client.torsor.co) | Clean separation, same auth system |
| Code Structure | Monorepo | Shared types, single database, consistent tooling |
| LLM Provider | OpenRouter | Existing integration, multi-model access, cost tracking |
| Primary LLM | Claude Sonnet 4 | Best balance of quality/cost for complex tasks |
| Fast LLM | Claude Haiku | Chat, simple tasks, 10x cheaper |
| Premium LLM | Claude Opus 4.5 | Quarterly reviews, PDF generation |
| LLM Security | Edge Functions | Server-side only, no client exposure |
| Chat | Contextual AI + escalation | Self-service with human backup |
| Appointments | Cal.com embed | Open source, good API, affordable |
| Real-time | Supabase subscriptions | Already available, no extra cost |

---

## Document Version

**Version:** 2.0  
**Last Updated:** November 27, 2025  
**Status:** Approved for Implementation  
**Owner:** James Howard

