# Oracle Method Integration into Torsor Platform
## Architecture Analysis & Implementation Plan

**Date:** November 26, 2025  
**Purpose:** Integrate Oracle Method's 3-part assessment system into Torsor for the 365 Alignment Program  
**Status:** Planning Phase

---

## Executive Summary

This document outlines the strategy to integrate Oracle Method portal functionality into Torsor as a client-side add-on for the **365 Alignment Program**. We'll treat the Oracle Method codebase as an archive/reference and rebuild the assessment system within Torsor's cleaner, more maintainable architecture.

### Key Objectives

1. **Client Assessment System** - Issue and record 3-part business assessments
2. **LLM Processing** - Generate personalized roadmaps and insights
3. **Client Collaboration** - Enable ongoing work with clients through the platform
4. **Clean Integration** - Leverage Torsor's simple architecture (no over-engineering)

---

## Part 1: Oracle Method Portal Analysis

### Current Architecture Overview

#### Tech Stack Comparison

| Component | Oracle Method Portal | Torsor Platform | Recommendation |
|-----------|---------------------|-----------------|----------------|
| **Framework** | React 18.2 + React Router | React 19 + Tanstack Router | Use Torsor's newer stack |
| **Build Tool** | Vite 4.5.2 | Vite 7.2.4 | Use Torsor's version |
| **Database** | Supabase | Supabase (same instance) | Shared database |
| **State** | Context API + Custom Hooks | React Query + Tanstack Router | Use Torsor's approach |
| **UI Library** | Radix UI (extensive) | Lucide React (minimal) | Add Radix selectively |
| **Styling** | Tailwind 3.3 + Custom CSS | Tailwind 4.1 | Use Torsor's version |
| **TypeScript** | TypeScript 5 | TypeScript 5.9 | Compatible |
| **LLM Integration** | Custom Service Layer | Not implemented | Build new service |

#### Oracle Method Portal Structure

```
oracle-method-portal/
├── src/
│   ├── data/
│   │   ├── assessmentQuestions.ts       # Part 1 (15 questions)
│   │   ├── part2Questions.ts            # Part 2 (72 questions)
│   │   └── part3Questions.ts            # Part 3 (32 questions)
│   ├── pages/
│   │   ├── AssessmentPart1.tsx
│   │   ├── AssessmentPart2.tsx
│   │   ├── AssessmentPart3.tsx
│   │   ├── AssessmentReview.tsx
│   │   └── ValidationQuestions.tsx
│   ├── components/
│   │   ├── assessment/
│   │   │   ├── Part2AssessmentForm.tsx
│   │   │   ├── Part2Section.tsx
│   │   │   ├── QuestionRenderer.tsx
│   │   │   └── Part3Review.tsx
│   │   └── dashboard/
│   │       ├── AssessmentPart1Container.tsx
│   │       ├── AssessmentPart2Container.tsx
│   │       └── AssessmentsPage.tsx
│   ├── services/
│   │   ├── assessmentDatabaseService.ts # Core CRUD operations
│   │   ├── roadmapService.ts            # LLM roadmap generation
│   │   ├── contextEnrichmentService.ts  # AI enrichment
│   │   └── assessmentApiService.ts      # API layer
│   ├── hooks/
│   │   └── useAssessmentProgress.tsx    # Progress tracking
│   └── types/
│       ├── assessment.ts
│       └── assessmentProgress.ts
└── supabase/
    └── migrations/
        └── [assessment tables schema]
```

### Database Schema (Existing)

#### Core Assessment Tables

```sql
-- Part 1: Life Design
client_intake {
  group_id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users
  email TEXT
  responses JSONB                    -- Part 1 answers (15 questions)
  completed BOOLEAN
  part1_completed_at TIMESTAMP
  fit_message TEXT                   -- AI-generated fit assessment
  status VARCHAR
  created_at TIMESTAMP
  updated_at TIMESTAMP
}

-- Part 2: Business Deep Dive
client_intake_part2 {
  group_id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users
  responses JSONB                    -- Part 2 answers (72 questions)
  current_section INTEGER            -- Progress through sections
  completed BOOLEAN
  part2_completed_at TIMESTAMP
  roadmap_generated BOOLEAN
  roadmap_data JSONB                 -- AI-generated roadmap
  board_data JSONB                   -- Strategic board
  created_at TIMESTAMP
  updated_at TIMESTAMP
}

-- Part 3: Hidden Value Audit
client_intake_part3 {
  id UUID PRIMARY KEY
  user_id UUID REFERENCES auth.users
  group_id UUID
  responses JSONB                    -- Part 3 answers (32 questions)
  completed BOOLEAN
  completed_at TIMESTAMP
  value_analysis_generated BOOLEAN
  value_analysis_data JSONB          -- AI-generated value analysis
  business_stage TEXT
  created_at TIMESTAMP
}

-- Progress Tracking
assessment_progress {
  id UUID PRIMARY KEY
  group_id UUID UNIQUE
  user_id UUID
  part1_complete BOOLEAN
  part1_completed_at TIMESTAMP
  part2_complete BOOLEAN
  part2_completed_at TIMESTAMP
  part3_complete BOOLEAN
  part3_completed_at TIMESTAMP
  validation_complete BOOLEAN
  roadmap_generated BOOLEAN
  board_generated BOOLEAN
  value_analysis_complete BOOLEAN
  current_week INTEGER
  status TEXT
  created_at TIMESTAMP
  updated_at TIMESTAMP
}

-- Validation Questions (optional step between Part 2 and 3)
validation_responses {
  id UUID PRIMARY KEY
  group_id UUID
  user_id UUID
  responses JSONB
  completed BOOLEAN
  completed_at TIMESTAMP
  created_at TIMESTAMP
}
```

### LLM Integration Pattern

#### 1. Roadmap Generation Service

```typescript
// oracle-method-portal/src/services/roadmapService.ts
class RoadmapService {
  static async generateRoadmap(clientId: string, assessmentData: any) {
    // 1. Build client context from assessment
    const context = {
      clientId,
      industry: assessmentData.industry,
      businessStage: assessmentData.businessStage,
      revenue: assessmentData.revenue,
      challenges: extractChallenges(assessmentData),
      goals: extractGoals(assessmentData)
    };

    // 2. Get contextual enrichment (knowledge base)
    const enrichment = await ContextEnrichmentService.enrichContext(context);

    // 3. Build enhanced prompt
    const prompt = buildRoadmapPrompt(assessmentData, enrichment);

    // 4. Call LLM API
    const roadmap = await callLLM(prompt);

    return roadmap;
  }
}
```

#### 2. Context Enrichment Service

```typescript
// Enhances prompts with knowledge base insights
class ContextEnrichmentService {
  static async enrichContext(context: ClientContext) {
    // Extract signals from client data
    const signals = extractEnhancedSignals(context);
    
    // Search knowledge base
    const results = await knowledgeBaseService.searchDocuments(
      buildEnhancedQuery(signals, context)
    );
    
    // Filter and rank by relevance
    const enrichments = applyEnhancedFiltering(results, context, signals);
    
    return { enrichments, signalsUsed: signals };
  }
}
```

### Key Features to Migrate

#### 1. Assessment Flow
- ✅ Multi-part assessment (Part 1, 2, 3)
- ✅ Progress tracking and resume capability
- ✅ Conditional questions
- ✅ Validation between parts
- ✅ Review and edit answers

#### 2. LLM Processing
- ✅ Roadmap generation from Part 2
- ✅ Value analysis from Part 3
- ✅ Fit assessment from Part 1
- ✅ Context enrichment from knowledge base
- ✅ Prompt engineering framework

#### 3. Client Collaboration
- ✅ Dashboard with progress tracking
- ✅ Task management (roadmap → tasks)
- ✅ Weekly planning system
- ✅ Results visualization

---

## Part 2: Torsor Platform Analysis

### Current Architecture

#### Torsor Structure (Simplified)

```
torsor-practice-platform/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DiagnosticsPage.tsx
│   │   └── admin/
│   │       ├── SkillsHeatmapPage.tsx
│   │       ├── ServiceReadinessPage.tsx
│   │       ├── TeamAnalyticsPage.tsx
│   │       └── SkillsManagementPage.tsx
│   ├── components/
│   │   ├── SkillsHeatmapGrid.tsx
│   │   ├── SkillCategoryCard.tsx
│   │   └── ServiceReadinessCard.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSkills.ts
│   │   ├── useSkillAssessments.ts
│   │   ├── useTeamMembers.ts
│   │   └── useServiceReadiness.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── service-calculations.ts
│   │   └── analytics-engine.ts
│   └── types/
│       └── types.ts
└── database/
    └── [existing torsor schema]
```

### Torsor Database (Existing)

```sql
-- Team Management
practice_members {
  id UUID PRIMARY KEY
  practice_id UUID
  user_id UUID
  email TEXT
  full_name TEXT
  role VARCHAR(20)              -- owner, admin, member
  is_active BOOLEAN
  created_at TIMESTAMP
}

-- Skills Assessment
skill_assessments {
  id UUID PRIMARY KEY
  team_member_id UUID
  skill_id UUID
  current_level INTEGER         -- 1-5 scale
  interest_level INTEGER        -- 1-5 scale
  years_experience DECIMAL
  last_used_date DATE
  certifications TEXT[]
  assessment_type VARCHAR       -- self, manager, 360
  assessment_date TIMESTAMP
  notes TEXT
}

-- Service Readiness (123 skills mapped to service lines)
skills {
  id UUID PRIMARY KEY
  category VARCHAR(50)
  name VARCHAR(100)
  description TEXT
  is_active BOOLEAN
  required_level INTEGER
}

-- Advisory Services
advisory_services {
  id UUID PRIMARY KEY
  name TEXT
  category TEXT
  description TEXT
  required_skills JSONB
  pricing_model TEXT
}
```

### Torsor's Philosophy

> **"Build one feature. Get it working. Move to the next."**
> 
> - Simple: Direct queries, no complex abstractions
> - Focused: One feature at a time
> - Maintainable: Flat structure, clear components
> - Fast: Minimal dependencies, optimized rendering

---

## Part 3: Integration Architecture

### Proposed Structure

```
torsor-practice-platform/
├── src/
│   ├── pages/
│   │   ├── assessments/                    # NEW
│   │   │   ├── ClientAssessmentLauncher.tsx
│   │   │   ├── ClientAssessmentPart1.tsx
│   │   │   ├── ClientAssessmentPart2.tsx
│   │   │   ├── ClientAssessmentPart3.tsx
│   │   │   ├── AssessmentReview.tsx
│   │   │   └── ClientDashboard.tsx
│   │   └── admin/
│   │       ├── ClientManagementPage.tsx    # NEW
│   │       ├── AssessmentMonitorPage.tsx   # NEW
│   │       └── [existing admin pages]
│   ├── components/
│   │   ├── assessments/                    # NEW
│   │   │   ├── QuestionRenderer.tsx
│   │   │   ├── AssessmentProgress.tsx
│   │   │   ├── SectionNavigator.tsx
│   │   │   └── AnswerReview.tsx
│   │   ├── client-dashboard/               # NEW
│   │   │   ├── RoadmapView.tsx
│   │   │   ├── TaskList.tsx
│   │   │   ├── WeeklyPlanner.tsx
│   │   │   └── ProgressCharts.tsx
│   │   └── [existing components]
│   ├── hooks/
│   │   ├── useClientAssessment.ts          # NEW
│   │   ├── useAssessmentProgress.ts        # NEW
│   │   ├── useRoadmapGeneration.ts         # NEW
│   │   └── [existing hooks]
│   ├── lib/
│   │   ├── assessment/                     # NEW
│   │   │   ├── questions.ts                # Part 1, 2, 3 questions
│   │   │   ├── validation.ts               # Answer validation
│   │   │   └── scoring.ts                  # Assessment scoring
│   │   ├── llm/                            # NEW
│   │   │   ├── openai-client.ts            # LLM API client
│   │   │   ├── prompts.ts                  # Prompt templates
│   │   │   ├── roadmap-generator.ts        # Roadmap generation
│   │   │   └── value-analyzer.ts           # Value analysis
│   │   └── [existing lib]
│   ├── services/                           # NEW
│   │   ├── assessmentService.ts            # CRUD operations
│   │   ├── roadmapService.ts               # LLM integration
│   │   └── contextEnrichmentService.ts     # AI enhancement
│   └── types/
│       ├── assessment.ts                   # NEW
│       ├── client.ts                       # NEW
│       └── [existing types]
└── database/
    └── migrations/
        └── 001_add_client_assessments.sql  # NEW
```

### Database Extension Strategy

#### Option 1: Extend Existing Tables (Recommended)

```sql
-- Extend practice_members to support clients
ALTER TABLE practice_members ADD COLUMN member_type VARCHAR(20) DEFAULT 'team' 
  CHECK (member_type IN ('team', 'client', 'advisor'));
ALTER TABLE practice_members ADD COLUMN client_company TEXT;
ALTER TABLE practice_members ADD COLUMN client_stage TEXT;

-- Reuse existing assessment pattern
CREATE TABLE client_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id),
  client_member_id UUID REFERENCES practice_members(id),
  assessment_type VARCHAR(10) CHECK (assessment_type IN ('part1', 'part2', 'part3')),
  responses JSONB NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  current_section INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track overall progress
CREATE TABLE client_assessment_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id),
  client_member_id UUID REFERENCES practice_members(id),
  part1_complete BOOLEAN DEFAULT FALSE,
  part2_complete BOOLEAN DEFAULT FALSE,
  part3_complete BOOLEAN DEFAULT FALSE,
  validation_complete BOOLEAN DEFAULT FALSE,
  roadmap_generated BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'in_progress',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(practice_id, client_member_id)
);

-- Store LLM-generated content
CREATE TABLE client_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id),
  client_member_id UUID REFERENCES practice_members(id),
  roadmap_data JSONB NOT NULL,           -- AI-generated roadmap
  value_analysis_data JSONB,             -- Part 3 analysis
  fit_assessment TEXT,                   -- Part 1 fit message
  generated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

-- Tasks extracted from roadmap
CREATE TABLE client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id),
  client_member_id UUID REFERENCES practice_members(id),
  roadmap_id UUID REFERENCES client_roadmaps(id),
  week_number INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Option 2: Separate Client Schema (Alternative)

Create a dedicated schema for client-specific data to keep clean separation:

```sql
-- Use a separate schema
CREATE SCHEMA IF NOT EXISTS clients;

-- Then create tables in that schema
CREATE TABLE clients.assessments (...);
CREATE TABLE clients.progress (...);
CREATE TABLE clients.roadmaps (...);
```

### LLM Integration Layer

#### 1. OpenAI Client Setup

```typescript
// src/lib/llm/openai-client.ts
import OpenAI from 'openai';

export class LLMClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: false // Use backend proxy
    });
  }

  async generateCompletion(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    const response = await this.client.chat.completions.create({
      model: options?.model || 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 4000,
    });

    return response.choices[0].message.content;
  }
}

export const llmClient = new LLMClient();
```

#### 2. Prompt Templates

```typescript
// src/lib/llm/prompts.ts
export const ROADMAP_PROMPT_TEMPLATE = `
You are an expert business strategist analyzing assessment data to create a personalized 90-day transformation roadmap.

# CLIENT ASSESSMENT DATA
{assessmentData}

# YOUR TASK
Generate a comprehensive 90-day roadmap that:
1. Identifies the 3-5 highest-impact areas for transformation
2. Breaks down into weekly actionable tasks
3. Prioritizes based on dependencies and quick wins
4. Includes specific metrics for success

# OUTPUT FORMAT
Return a JSON structure with:
- summary: Overall strategic assessment
- priorities: Array of key focus areas
- weeks: Array of 13 weeks, each with:
  - weekNumber: 1-13
  - theme: Weekly focus
  - tasks: Array of tasks with title, description, category, priority
  - milestones: Key achievements for the week
`;

export const VALUE_ANALYSIS_PROMPT_TEMPLATE = `
You are a business valuation expert analyzing a company's hidden value.

# PART 3 ASSESSMENT DATA
{part3Data}

# YOUR TASK
Analyze the responses to identify:
1. Hidden assets worth £50k+
2. Critical vulnerabilities (technical debt, key person risk)
3. Immediate value unlocks
4. Exit readiness score (0-100)

# OUTPUT FORMAT
Return JSON with:
- valuationImpact: Estimated value impact in GBP
- criticalRisks: Array of risk objects
- quickWins: Array of immediate actions
- exitReadiness: Score and analysis
`;
```

#### 3. Roadmap Generation Service

```typescript
// src/services/roadmapService.ts
import { llmClient } from '@/lib/llm/openai-client';
import { ROADMAP_PROMPT_TEMPLATE } from '@/lib/llm/prompts';
import { supabase } from '@/lib/supabase';

export class RoadmapService {
  static async generateRoadmap(
    clientMemberId: string,
    assessmentData: any
  ): Promise<any> {
    try {
      // 1. Build prompt from assessment data
      const prompt = ROADMAP_PROMPT_TEMPLATE.replace(
        '{assessmentData}',
        JSON.stringify(assessmentData, null, 2)
      );

      // 2. Generate roadmap via LLM
      const response = await llmClient.generateCompletion(prompt, {
        temperature: 0.7,
        maxTokens: 4000
      });

      // 3. Parse JSON response
      const roadmapData = JSON.parse(response);

      // 4. Save to database
      const { data, error } = await supabase
        .from('client_roadmaps')
        .insert({
          client_member_id: clientMemberId,
          roadmap_data: roadmapData,
          generated_at: new Date().toISOString(),
          version: 1,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // 5. Extract and create tasks
      await this.createTasksFromRoadmap(data.id, roadmapData);

      return data;
    } catch (error) {
      console.error('Roadmap generation failed:', error);
      throw new Error('Failed to generate roadmap');
    }
  }

  private static async createTasksFromRoadmap(
    roadmapId: string,
    roadmapData: any
  ) {
    const tasks = [];
    
    // Extract tasks from each week
    for (const week of roadmapData.weeks || []) {
      for (const task of week.tasks || []) {
        tasks.push({
          roadmap_id: roadmapId,
          week_number: week.weekNumber,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          status: 'pending'
        });
      }
    }

    // Bulk insert tasks
    if (tasks.length > 0) {
      await supabase.from('client_tasks').insert(tasks);
    }
  }

  static async generateValueAnalysis(
    clientMemberId: string,
    part3Data: any
  ): Promise<any> {
    // Similar pattern for Part 3 value analysis
    // ...
  }
}
```

---

## Part 4: Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

#### Database Setup
- [ ] Create migration files
- [ ] Add `client_assessments` table
- [ ] Add `client_assessment_progress` table  
- [ ] Add `client_roadmaps` table
- [ ] Add `client_tasks` table
- [ ] Extend `practice_members` for client support
- [ ] Test migrations on dev environment

#### Core Types & Data
- [ ] Copy assessment questions from Oracle Method
  - [ ] `src/lib/assessment/part1-questions.ts`
  - [ ] `src/lib/assessment/part2-questions.ts`
  - [ ] `src/lib/assessment/part3-questions.ts`
- [ ] Create TypeScript types
  - [ ] `src/types/assessment.ts`
  - [ ] `src/types/client.ts`
  - [ ] `src/types/roadmap.ts`
- [ ] Build validation utilities
  - [ ] `src/lib/assessment/validation.ts`

### Phase 2: Assessment UI (Week 3-4)

#### Components
- [ ] `QuestionRenderer` component (handles all question types)
- [ ] `AssessmentProgress` component (progress bar & section nav)
- [ ] `SectionNavigator` component (multi-section navigation)
- [ ] `AnswerReview` component (view/edit answers)

#### Pages
- [ ] `ClientAssessmentPart1Page` - Life Design (15 questions)
- [ ] `ClientAssessmentPart2Page` - Business Deep Dive (72 questions)
- [ ] `ClientAssessmentPart3Page` - Hidden Value Audit (32 questions)
- [ ] `AssessmentReviewPage` - Review all answers

#### Hooks
- [ ] `useClientAssessment` - CRUD operations
- [ ] `useAssessmentProgress` - Track completion
- [ ] `useAssessmentValidation` - Validate answers

#### Service Layer
- [ ] `assessmentService.ts` - Database operations
  - [ ] `saveAnswers()`
  - [ ] `loadProgress()`
  - [ ] `markSectionComplete()`
  - [ ] `submitAssessment()`

### Phase 3: LLM Integration (Week 5-6)

#### LLM Infrastructure
- [ ] Set up OpenAI API client
- [ ] Create prompt templates
  - [ ] Roadmap generation prompt
  - [ ] Value analysis prompt
  - [ ] Fit assessment prompt
- [ ] Build error handling & retry logic
- [ ] Add response parsing utilities

#### Services
- [ ] `roadmapService.ts` - Generate roadmaps
  - [ ] `generateRoadmap()`
  - [ ] `regenerateRoadmap()`
  - [ ] `parseRoadmapResponse()`
- [ ] `valueAnalysisService.ts` - Part 3 analysis
  - [ ] `generateValueAnalysis()`
  - [ ] `calculateExitReadiness()`
- [ ] `contextEnrichmentService.ts` - Enhance prompts
  - [ ] `enrichWithPracticeContext()`
  - [ ] `addIndustryInsights()`

#### Hooks
- [ ] `useRoadmapGeneration` - Trigger & monitor generation
- [ ] `useValueAnalysis` - Part 3 analysis
- [ ] `useLLMStatus` - Track LLM operation status

### Phase 4: Client Dashboard (Week 7-8)

#### Dashboard Components
- [ ] `RoadmapView` - Visual roadmap timeline
- [ ] `TaskList` - Weekly tasks & actions
- [ ] `WeeklyPlanner` - Current week focus
- [ ] `ProgressCharts` - Visual progress tracking
- [ ] `ValueAnalysisSummary` - Part 3 results

#### Pages
- [ ] `ClientDashboard Page` - Main client view
- [ ] `RoadmapDetailPage` - Detailed roadmap
- [ ] `TaskManagementPage` - Task completion & tracking

#### Services
- [ ] `taskService.ts` - Task management
  - [ ] `getTasks()`
  - [ ] `updateTaskStatus()`
  - [ ] `addClientNote()`

### Phase 5: Admin & Practice Management (Week 9-10)

#### Admin Pages
- [ ] `ClientManagementPage` - View all clients
- [ ] `AssessmentMonitorPage` - Track assessment progress
- [ ] `RoadmapLibraryPage` - View all roadmaps
- [ ] `ClientAnalyticsPage` - Client engagement metrics

#### Features
- [ ] Launch assessments for clients
- [ ] Monitor assessment completion
- [ ] Review & edit roadmaps
- [ ] Track client engagement
- [ ] Export reports

### Phase 6: 365 Alignment Program Launch (Week 11-12)

#### Program Features
- [ ] Assessment invitation system
- [ ] Email notifications
- [ ] Progress reminders
- [ ] Weekly check-ins
- [ ] Milestone tracking

#### Documentation
- [ ] Client onboarding guide
- [ ] Admin user guide
- [ ] API documentation
- [ ] Troubleshooting guide

---

## Part 5: Technical Decisions

### Architecture Principles

Following Torsor's philosophy, we'll keep it simple:

1. **Direct Queries** - No complex ORM, just direct Supabase calls
2. **React Query** - Cache LLM results, assessment data
3. **Flat Structure** - No deep nesting, easy to navigate
4. **Minimal Dependencies** - Only add what's absolutely needed

### Key Design Patterns

#### 1. Assessment State Management

```typescript
// Simple React Query pattern
function useClientAssessment(clientId: string, assessmentType: 'part1' | 'part2' | 'part3') {
  return useQuery({
    queryKey: ['client-assessment', clientId, assessmentType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_assessments')
        .select('*')
        .eq('client_member_id', clientId)
        .eq('assessment_type', assessmentType)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });
}
```

#### 2. Progressive Enhancement

Start simple, add complexity only when needed:

```typescript
// Phase 1: Basic roadmap generation
async function generateRoadmap(assessmentData: any) {
  const prompt = buildPrompt(assessmentData);
  return await llmClient.generate(prompt);
}

// Phase 2 (Later): Add context enrichment
async function generateRoadmap(assessmentData: any) {
  const context = buildContext(assessmentData);
  const enrichment = await enrichWithKnowledgeBase(context); // Add later
  const prompt = buildEnhancedPrompt(assessmentData, enrichment);
  return await llmClient.generate(prompt);
}
```

#### 3. Component Composition

```typescript
// Reusable question renderer
function QuestionRenderer({ question, value, onChange }) {
  switch (question.type) {
    case 'text': return <TextInput {...} />;
    case 'textarea': return <Textarea {...} />;
    case 'radio': return <RadioGroup {...} />;
    case 'checkbox': return <CheckboxGroup {...} />;
    case 'slider': return <Slider {...} />;
    case 'matrix': return <MatrixInput {...} />;
    default: return null;
  }
}

// Use in all three assessment pages
function AssessmentPart1Page() {
  return (
    <>
      {part1Questions.map(q => (
        <QuestionRenderer key={q.id} question={q} {...} />
      ))}
    </>
  );
}
```

### What NOT to Migrate

From Oracle Method Portal, we'll skip:

❌ **Accountancy Portal** - Out of scope  
❌ **Client Portal routing** - Different use case  
❌ **Community features** - Not needed initially  
❌ **Monetization/Stripe** - Not for 365 program  
❌ **Advanced animations** - Keep it fast  
❌ **Multiple portals** - One clean integration  
❌ **Legacy code** - Clean slate implementation  

### What to Keep Simple

✅ **Question Types** - Standard HTML inputs + Radix where needed  
✅ **State Management** - React Query + URL params for nav  
✅ **Styling** - Tailwind utility classes, minimal custom CSS  
✅ **Routing** - Tanstack Router, flat structure  
✅ **API Layer** - Direct Supabase calls, no complex service layer  

---

## Part 6: LLM Strategy

### OpenAI Integration

```typescript
// Environment setup
VITE_OPENAI_API_KEY=sk-xxx...
VITE_OPENAI_MODEL=gpt-4-turbo-preview
VITE_OPENAI_MAX_TOKENS=4000
VITE_OPENAI_TEMPERATURE=0.7
```

### Prompt Engineering

#### Roadmap Generation Prompt Structure

```
SYSTEM CONTEXT:
- You are an expert business strategist
- Client has completed 72-question business assessment
- Generate actionable 90-day roadmap

ASSESSMENT DATA:
{json dump of Part 1 + Part 2 responses}

OUTPUT REQUIREMENTS:
- JSON format
- 13 weeks of tasks
- 3-5 priorities
- Specific, measurable actions
- Consider business stage: {stage}
- Revenue context: {revenue}

CONSTRAINTS:
- Maximum 5 tasks per week
- Each task: title, description, category, priority
- Categories: Financial, Operations, Team, Marketing, Product, Systems
- Priorities: Critical, High, Medium
```

### Cost Management

Estimated costs for 365 Alignment Program:

- **Assessment Processing**: ~$2-4 per client (3 LLM calls)
  - Part 1 Fit Assessment: $0.50
  - Part 2 Roadmap: $2.00
  - Part 3 Value Analysis: $1.50
- **Monthly Updates**: ~$1 per client (roadmap refresh)
- **Total per client/year**: ~$14-16

For 50 clients: ~$800/year in OpenAI costs

### Response Handling

```typescript
interface LLMResponse {
  success: boolean;
  data?: any;
  error?: string;
  retries?: number;
  duration?: number;
}

async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3
): Promise<LLMResponse> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const response = await llmClient.generate(prompt);
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: JSON.parse(response),
        duration,
        retries: attempt - 1
      };
    } catch (error) {
      if (attempt === maxRetries) {
        return {
          success: false,
          error: error.message,
          retries: attempt
        };
      }
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}
```

---

## Part 7: Data Migration Strategy

### Scenario: Migrating Existing Oracle Method Clients

If you have existing clients in Oracle Method Portal who need to be migrated to Torsor:

```sql
-- Script to migrate clients from Oracle Method to Torsor
-- Run after Torsor assessment tables are created

-- 1. Create practice_members entries for clients
INSERT INTO practice_members (
  practice_id,
  user_id,
  email,
  full_name,
  member_type,
  client_company,
  role,
  is_active
)
SELECT
  (SELECT id FROM practices WHERE practice_name = 'Howard Practice' LIMIT 1),
  ci.user_id,
  ci.email,
  ci.responses->>'full_name',
  'client',
  ci.responses->>'company_name',
  'member',
  TRUE
FROM client_intake ci
WHERE NOT EXISTS (
  SELECT 1 FROM practice_members pm 
  WHERE pm.user_id = ci.user_id
);

-- 2. Migrate Part 1 assessments
INSERT INTO client_assessments (
  practice_id,
  client_member_id,
  assessment_type,
  responses,
  completed,
  completed_at,
  created_at
)
SELECT
  (SELECT id FROM practices WHERE practice_name = 'Howard Practice' LIMIT 1),
  pm.id,
  'part1',
  ci.responses,
  ci.completed,
  ci.part1_completed_at,
  ci.created_at
FROM client_intake ci
JOIN practice_members pm ON pm.user_id = ci.user_id
WHERE pm.member_type = 'client';

-- 3. Migrate Part 2 assessments
INSERT INTO client_assessments (
  practice_id,
  client_member_id,
  assessment_type,
  responses,
  completed,
  completed_at,
  current_section,
  created_at
)
SELECT
  (SELECT id FROM practices WHERE practice_name = 'Howard Practice' LIMIT 1),
  pm.id,
  'part2',
  ci2.responses,
  ci2.completed,
  ci2.part2_completed_at,
  ci2.current_section,
  ci2.created_at
FROM client_intake_part2 ci2
JOIN practice_members pm ON pm.user_id = ci2.user_id
WHERE pm.member_type = 'client';

-- 4. Migrate Part 3 assessments
INSERT INTO client_assessments (
  practice_id,
  client_member_id,
  assessment_type,
  responses,
  completed,
  completed_at,
  created_at
)
SELECT
  (SELECT id FROM practices WHERE practice_name = 'Howard Practice' LIMIT 1),
  pm.id,
  'part3',
  ci3.responses,
  ci3.completed,
  ci3.completed_at,
  ci3.created_at
FROM client_intake_part3 ci3
JOIN practice_members pm ON pm.user_id = ci3.user_id
WHERE pm.member_type = 'client';

-- 5. Migrate roadmaps
INSERT INTO client_roadmaps (
  practice_id,
  client_member_id,
  roadmap_data,
  value_analysis_data,
  fit_assessment,
  generated_at,
  version,
  is_active
)
SELECT
  (SELECT id FROM practices WHERE practice_name = 'Howard Practice' LIMIT 1),
  pm.id,
  ci2.roadmap_data,
  ci3.value_analysis_data,
  ci.fit_message,
  ci2.roadmap_generated_at,
  1,
  TRUE
FROM client_intake ci
JOIN practice_members pm ON pm.user_id = ci.user_id
LEFT JOIN client_intake_part2 ci2 ON ci2.user_id = ci.user_id
LEFT JOIN client_intake_part3 ci3 ON ci3.user_id = ci.user_id
WHERE pm.member_type = 'client'
  AND (ci2.roadmap_data IS NOT NULL OR ci3.value_analysis_data IS NOT NULL);

-- 6. Create progress tracking
INSERT INTO client_assessment_progress (
  practice_id,
  client_member_id,
  part1_complete,
  part2_complete,
  part3_complete,
  roadmap_generated,
  status
)
SELECT
  (SELECT id FROM practices WHERE practice_name = 'Howard Practice' LIMIT 1),
  pm.id,
  ci.completed,
  ci2.completed,
  ci3.completed,
  ci2.roadmap_generated,
  CASE
    WHEN ci3.completed THEN 'completed'
    WHEN ci2.completed THEN 'part3_pending'
    WHEN ci.completed THEN 'part2_pending'
    ELSE 'in_progress'
  END
FROM practice_members pm
LEFT JOIN client_intake ci ON ci.user_id = pm.user_id
LEFT JOIN client_intake_part2 ci2 ON ci2.user_id = pm.user_id
LEFT JOIN client_intake_part3 ci3 ON ci3.user_id = pm.user_id
WHERE pm.member_type = 'client';
```

---

## Part 8: Testing Strategy

### Unit Tests

```typescript
// Test assessment validation
describe('Assessment Validation', () => {
  test('validates required questions', () => {
    const answers = { question1: 'answer' };
    const requiredQuestions = ['question1', 'question2'];
    const result = validateAnswers(answers, requiredQuestions);
    expect(result.isValid).toBe(false);
    expect(result.missing).toContain('question2');
  });

  test('validates email format', () => {
    const result = validateEmail('invalid-email');
    expect(result.isValid).toBe(false);
  });
});

// Test roadmap generation
describe('Roadmap Service', () => {
  test('generates roadmap from assessment data', async () => {
    const mockData = { /* assessment data */ };
    const result = await RoadmapService.generateRoadmap('client-id', mockData);
    expect(result.weeks).toHaveLength(13);
    expect(result.priorities).toBeDefined();
  });

  test('handles LLM errors gracefully', async () => {
    // Mock LLM failure
    llmClient.generate = jest.fn().mockRejectedValue(new Error('API Error'));
    
    await expect(
      RoadmapService.generateRoadmap('client-id', {})
    ).rejects.toThrow('Failed to generate roadmap');
  });
});
```

### Integration Tests

```typescript
// Test end-to-end assessment flow
describe('Assessment Flow', () => {
  test('completes Part 1 assessment', async () => {
    // 1. Start assessment
    const assessment = await assessmentService.startAssessment('client-id', 'part1');
    
    // 2. Save answers
    await assessmentService.saveAnswers(assessment.id, mockAnswers);
    
    // 3. Complete assessment
    await assessmentService.completeAssessment(assessment.id);
    
    // 4. Check progress updated
    const progress = await assessmentService.getProgress('client-id');
    expect(progress.part1_complete).toBe(true);
  });

  test('generates roadmap after Part 2', async () => {
    // Complete Part 1 & 2
    await completeAssessments('client-id', ['part1', 'part2']);
    
    // Trigger roadmap generation
    const roadmap = await RoadmapService.generateRoadmap('client-id', mockData);
    
    // Check database updated
    const { data } = await supabase
      .from('client_roadmaps')
      .select('*')
      .eq('client_member_id', 'client-id')
      .single();
    
    expect(data).toBeDefined();
    expect(data.roadmap_data.weeks).toHaveLength(13);
  });
});
```

### Manual Testing Checklist

#### Assessment Flow
- [ ] Part 1: All 15 questions render correctly
- [ ] Part 1: Can save progress and resume
- [ ] Part 1: Can submit completed assessment
- [ ] Part 1: Fit assessment generates
- [ ] Part 2: All 72 questions across 12 sections
- [ ] Part 2: Section navigation works
- [ ] Part 2: Can edit previous sections
- [ ] Part 2: Roadmap generates on completion
- [ ] Part 3: All 32 questions with insights
- [ ] Part 3: Value analysis generates
- [ ] Review: Can view all answers
- [ ] Review: Can edit and re-submit

#### Client Dashboard
- [ ] Roadmap displays correctly
- [ ] Tasks show for current week
- [ ] Can mark tasks complete
- [ ] Progress charts update
- [ ] Value analysis displays

#### Admin Features
- [ ] Can launch assessment for client
- [ ] Can view all client assessments
- [ ] Can monitor completion status
- [ ] Can view generated roadmaps
- [ ] Can export data

---

## Part 9: Deployment & Operations

### Environment Setup

```bash
# Add to Torsor .env
VITE_OPENAI_API_KEY=sk-xxx...
VITE_OPENAI_MODEL=gpt-4-turbo-preview
VITE_ASSESSMENT_EMAIL_FROM=assessments@torsor.com
VITE_ASSESSMENT_ENABLED=true
```

### Deployment Checklist

- [ ] Run database migrations
- [ ] Test on staging environment
- [ ] Verify LLM API access
- [ ] Test assessment flow end-to-end
- [ ] Verify email notifications
- [ ] Check performance with multiple clients
- [ ] Deploy to production
- [ ] Monitor for errors

### Monitoring

```typescript
// Track key metrics
interface AssessmentMetrics {
  assessmentsStarted: number;
  assessmentsCompleted: number;
  completionRate: number;
  averageCompletionTime: number;
  llmSuccessRate: number;
  llmAverageDuration: number;
  llmCost: number;
}

// Log LLM usage
await supabase.from('llm_usage_log').insert({
  operation: 'roadmap_generation',
  client_member_id: clientId,
  tokens_used: response.usage.total_tokens,
  cost: calculateCost(response.usage.total_tokens),
  duration: duration,
  success: true,
  created_at: new Date().toISOString()
});
```

### Backup & Recovery

```sql
-- Backup client assessments
pg_dump -h [host] -U [user] -t client_assessments -t client_roadmaps > backup.sql

-- Restore if needed
psql -h [host] -U [user] [database] < backup.sql
```

---

## Part 10: Success Criteria

### Phase 1 Complete When:
- [ ] Database tables created and tested
- [ ] Question data migrated
- [ ] TypeScript types defined
- [ ] Basic validation working

### Phase 2 Complete When:
- [ ] Can complete Part 1 assessment
- [ ] Can complete Part 2 assessment
- [ ] Can complete Part 3 assessment
- [ ] Can review all answers
- [ ] Progress saves and resumes

### Phase 3 Complete When:
- [ ] Part 1 generates fit assessment
- [ ] Part 2 generates 90-day roadmap
- [ ] Part 3 generates value analysis
- [ ] LLM errors handled gracefully
- [ ] All responses parseable

### Phase 4 Complete When:
- [ ] Client can view roadmap
- [ ] Client can see weekly tasks
- [ ] Client can mark tasks complete
- [ ] Progress visualized clearly
- [ ] Value analysis displayed

### Phase 5 Complete When:
- [ ] Admin can launch assessments
- [ ] Admin can monitor progress
- [ ] Admin can view all roadmaps
- [ ] Admin can export data
- [ ] Analytics dashboard working

### Launch Ready When:
- [ ] All phases complete
- [ ] End-to-end testing passed
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] Training materials ready
- [ ] First 5 clients onboarded successfully

---

## Part 11: Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Plan**
   - [ ] Review this architecture document
   - [ ] Discuss any concerns or changes
   - [ ] Get stakeholder sign-off

2. **Set Up Development Environment**
   - [ ] Ensure OpenAI API access
   - [ ] Set up staging Supabase environment
   - [ ] Configure environment variables

3. **Create GitHub Issues**
   - [ ] Break down into trackable tasks
   - [ ] Assign to Phase 1
   - [ ] Set up project board

### Week 1 Sprint Planning

**Goal:** Complete Phase 1 (Foundation)

**Tasks:**
1. Database migration files
2. Core TypeScript types
3. Assessment questions data
4. Basic validation utilities
5. Test all database operations

### Long-term Milestones

- **End of Month 1:** Phases 1-2 complete (Assessment UI working)
- **End of Month 2:** Phases 3-4 complete (LLM + Dashboard working)
- **End of Month 3:** Phases 5-6 complete (Admin + Launch ready)

### Questions to Resolve

1. **OpenAI Access:** Do we have API access? Need to set up billing?
2. **Email System:** How to send assessment invitations? (Supabase Auth emails vs custom?)
3. **Authentication:** Separate login for clients vs team members?
4. **Branding:** Should clients see "Torsor" or custom practice branding?
5. **Pricing:** How does this fit into practice billing/packages?

---

## Appendix A: File References

### Oracle Method Portal (Archive Reference)

Key files to reference during implementation:

```
oracle-method-portal/src/
├── data/
│   ├── assessmentQuestions.ts           # Copy to torsor
│   ├── part2Questions.ts                # Copy to torsor
│   └── part3Questions.ts                # Copy to torsor
├── services/
│   ├── assessmentDatabaseService.ts     # Reference for patterns
│   ├── roadmapService.ts                # Reference for LLM integration
│   └── contextEnrichmentService.ts      # Optional advanced feature
├── hooks/
│   └── useAssessmentProgress.tsx        # Reference for state management
└── components/
    └── assessment/
        ├── QuestionRenderer.tsx         # Reference for UI patterns
        └── Part3Review.tsx              # Reference for results display
```

### Torsor New Files

Files to create:

```
torsor-practice-platform/
├── src/
│   ├── pages/assessments/               # NEW - 6 page components
│   ├── components/assessments/          # NEW - 4 reusable components
│   ├── components/client-dashboard/     # NEW - 4 dashboard components
│   ├── hooks/useClientAssessment.ts     # NEW
│   ├── hooks/useAssessmentProgress.ts   # NEW
│   ├── hooks/useRoadmapGeneration.ts    # NEW
│   ├── lib/assessment/                  # NEW - Questions + validation
│   ├── lib/llm/                         # NEW - LLM integration
│   ├── services/assessmentService.ts    # NEW
│   ├── services/roadmapService.ts       # NEW
│   └── types/assessment.ts              # NEW
└── database/migrations/
    └── 001_add_client_assessments.sql   # NEW
```

---

## Appendix B: Cost-Benefit Analysis

### Development Investment

**Time:** 10-12 weeks (1 developer)
**Cost:** ~£15,000-20,000 (contractor rates)

### Ongoing Costs

- **OpenAI API:** ~£800/year (50 clients)
- **Storage:** Negligible (existing Supabase)
- **Maintenance:** ~2 hours/week

### Revenue Potential

**365 Alignment Program Pricing:**
- Entry: £3,000/client/year
- Standard: £5,000/client/year
- Premium: £8,000/client/year

**Break-even:** 4-7 clients
**Target:** 50 clients = £150k-400k annual revenue

### Value Add to Practice

1. **Productized Service** - Repeatable, scalable offering
2. **Client Insights** - Deep data on client businesses
3. **Engagement Tool** - Keep clients active year-round
4. **Differentiation** - Unique AI-powered approach
5. **Efficiency** - Automate strategic planning process

---

## Conclusion

This integration plan provides a clear path to bring Oracle Method's assessment system into Torsor while maintaining Torsor's philosophy of simplicity and maintainability.

**Key Success Factors:**
- ✅ Build incrementally (one phase at a time)
- ✅ Keep it simple (no over-engineering)
- ✅ Reuse Torsor patterns (familiar to team)
- ✅ Leverage existing database (same Supabase)
- ✅ Focus on 365 Alignment Program needs

**Next Action:** Review this plan, approve architecture decisions, and begin Phase 1.

---

**Document Version:** 1.0  
**Last Updated:** November 26, 2025  
**Owner:** James Howard  
**Status:** Awaiting Approval

