# Torsor 365 Platform Architecture

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TORSOR ECOSYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────┐         ┌─────────────────────────┐               │
│  │   CLIENT PORTAL         │         │   PRACTICE PLATFORM     │               │
│  │   client.torsor.co.uk   │         │   torsor.co.uk          │               │
│  │                         │         │                         │               │
│  │  • Assessments          │◄───────►│  • Client Management    │               │
│  │  • Roadmap View         │         │  • Roadmap Overview     │               │
│  │  • Task Tracking        │         │  • Add Context          │               │
│  │  • Chat/Support         │         │  • Meeting Transcripts  │               │
│  │                         │         │  • Email Insights       │               │
│  │                         │         │  • Re-process Sprints   │               │
│  │                         │         │  • Knowledge Base       │               │
│  └───────────┬─────────────┘         └───────────┬─────────────┘               │
│              │                                   │                              │
│              └───────────────┬───────────────────┘                              │
│                              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SUPABASE BACKEND                                 │   │
│  │                                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │   │
│  │  │  PostgreSQL  │  │  Auth        │  │  Storage     │  │  Edge Fns    │ │   │
│  │  │  Database    │  │  (Users)     │  │  (Files)     │  │  (LLM)       │ │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │   │
│  │                                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │  pgvector Extension (Future: Knowledge Base / RAG)               │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                  │
│                              ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         OPENROUTER (LLM Gateway)                        │   │
│  │                                                                          │   │
│  │  Claude 3.5 Sonnet  │  GPT-4o  │  Haiku (Fast)  │  Opus (Complex)       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. DATABASE SCHEMA

### Core Tables

```sql
-- PRACTICES (Multi-tenant: Each accountant firm is a practice)
practices
├── id (uuid)
├── name (e.g., "Torsor", "Smith & Co Accountants")
├── domain (e.g., "torsor.co.uk")
├── settings (jsonb)
└── created_at

-- PRACTICE MEMBERS (Team + Clients)
practice_members
├── id (uuid)
├── practice_id (fk → practices)
├── user_id (fk → auth.users)
├── member_type ('team' | 'client')
├── role ('owner' | 'admin' | 'advisor' | 'viewer')  -- for team
├── name, email
├── client_company (for clients)
├── program_status ('pending' | 'active' | 'completed')
├── assigned_advisor_id (fk → practice_members)
├── skip_value_analysis (boolean)
└── last_portal_login

-- CLIENT ASSESSMENTS (All questionnaire responses)
client_assessments
├── id (uuid)
├── practice_id
├── client_id (fk → practice_members)
├── assessment_type ('part1' | 'part2' | 'part3' | 'followup')
├── responses (jsonb)  -- All answers stored here
├── fit_profile (jsonb) -- Generated after Part 1
├── status ('not_started' | 'in_progress' | 'completed')
└── completed_at

-- CLIENT ROADMAPS (Generated plans)
client_roadmaps
├── id (uuid)
├── practice_id
├── client_id
├── roadmap_data (jsonb)
│   ├── fiveYearVision
│   ├── sixMonthShift
│   ├── sprint (12 weeks)
│   ├── enrichedMetrics
│   └── context
├── value_analysis (jsonb)  -- From Part 3
├── is_active (boolean)
├── version (int)  -- For re-processing
└── created_at

-- CLIENT TASKS (Individual sprint tasks)
client_tasks
├── id (uuid)
├── practice_id
├── client_id
├── roadmap_id
├── week_number
├── title, description
├── category, priority
├── estimated_hours
├── status ('pending' | 'in_progress' | 'completed')
├── completed_at
└── sort_order

-- CLIENT CONTEXT (NEW: Practice-added information)
client_context
├── id (uuid)
├── practice_id
├── client_id
├── context_type ('transcript' | 'email' | 'note' | 'priority')
├── content (text)
├── source_file_url (for transcripts)
├── added_by (fk → practice_members)
├── priority_level ('normal' | 'high' | 'critical')
├── processed (boolean)  -- Has this been incorporated into roadmap?
└── created_at

-- KNOWLEDGE BASE (NEW: Practice-specific guidance)
knowledge_base
├── id (uuid)
├── practice_id
├── category ('objection' | 'methodology' | 'example' | 'correction')
├── title
├── content (text)
├── embedding (vector(1536))  -- For semantic search
├── approved_by
├── usage_count
└── created_at
```

---

## 2. EDGE FUNCTIONS (LLM Processing)

### Current Functions

| Function | Trigger | Input | Output | Model |
|----------|---------|-------|--------|-------|
| `generate-fit-profile` | Part 1 complete | Part 1 responses | Fit signals, personalized message, journey recommendation | Claude 3.5 Sonnet |
| `generate-followup-analysis` | Part 2 complete | Parts 1+2 | Gap detection, dynamic questions, enriched metrics | Rule-based + optional LLM |
| `generate-roadmap` | Follow-up complete | Parts 1+2 + followup | 5-Year Vision, 6-Month Shift, 12-Week Sprint | Claude 3.5 Sonnet |
| `generate-value-analysis` | Part 3 complete | Part 3 responses | Asset scores, risks, value gaps, valuation | Rule-based |

### Processing Order

```
1. CLIENT COMPLETES PART 1
   └─► generate-fit-profile
       ├─► Stores: fit_profile in client_assessments
       └─► Unlocks: Part 2

2. CLIENT COMPLETES PART 2
   └─► generate-followup-analysis (action: 'analyze')
       ├─► Returns: Dynamic follow-up questions
       └─► Detects: Gaps in responses

3. CLIENT ANSWERS FOLLOW-UP QUESTIONS
   └─► generate-followup-analysis (action: 'save-responses')
       ├─► Stores: Enriched metrics
       └─► Updates: client_assessments (followup)

4. SYSTEM GENERATES ROADMAP
   └─► generate-roadmap
       ├─► LLM Call 1: 5-Year Vision (uses emotional anchors)
       ├─► LLM Call 2: 6-Month Shift (uses vision + context)
       ├─► LLM Call 3: 12-Week Sprint (uses shift + industry context)
       ├─► Stores: client_roadmaps.roadmap_data
       └─► Creates: client_tasks (56 tasks across 12 weeks)

5. CLIENT COMPLETES PART 3 (Optional)
   └─► generate-value-analysis
       ├─► Calculates: 6 asset category scores
       ├─► Identifies: Risks, value gaps
       └─► Stores: client_roadmaps.value_analysis
```

---

## 3. LLM PROMPTS (Current)

### 3.1 Fit Profile Prompt
```
Location: generate-fit-profile/index.ts (lines 185-224)
Purpose: Create warm, personalized message after Part 1
Inputs: Tuesday Test, relationship mirror, family feedback, danger zone, secret pride, help fears
Output: JSON with headline, openingReflection, acknowledgment, strengthSpotlight, fearAddress, nextStepClarity, closingEnergy
```

### 3.2 Five-Year Vision Prompt
```
Location: generate-roadmap/index.ts (lines ~400-500)
Purpose: Create comprehensive 5-year transformation narrative
Inputs: Full Part 1+2 responses, emotional anchors, ROI data, industry context
Output: JSON with tagline, transformationStory (3 parts), yearMilestones (1/3/5), northStar, archetype, emotionalCore
```

### 3.3 Six-Month Shift Prompt
```
Location: generate-roadmap/index.ts (lines ~500-600)
Purpose: Create 6-month action plan bridging current to year 1
Inputs: 5-year vision, current business state, pain points
Output: JSON with shiftOverview, month1_2/3_4/5_6 (theme, focus, keyActions, metrics), quickWins, dangerMitigation
```

### 3.4 Twelve-Week Sprint Prompt
```
Location: generate-roadmap/index.ts (lines ~600-750)
Purpose: Create detailed 12-week implementation plan
Inputs: 6-month shift, vision, business context, constraints
Output: JSON with sprintTheme, phases (6), weeks (12), each with tasks, milestones, Tuesday transformation
```

---

## 4. DATA FLOW

### Client Portal → Database
```
Part 1 Submit → client_assessments (type: 'part1', responses: {...})
              → generate-fit-profile → client_assessments.fit_profile

Part 2 Submit → client_assessments (type: 'part2', responses: {...})
              → generate-followup-analysis → returns questions

Follow-up Submit → client_assessments (type: 'followup', responses: {...})
                 → generate-roadmap → client_roadmaps.roadmap_data
                                    → client_tasks (56 rows)

Part 3 Submit → client_assessments (type: 'part3', responses: {...})
              → generate-value-analysis → client_roadmaps.value_analysis
```

### Practice Platform → Database (TO BE BUILT)
```
View Client List → practice_members WHERE practice_id = X AND member_type = 'client'
View Roadmap → client_roadmaps WHERE client_id = X AND is_active = true
Add Context → client_context INSERT (type, content, priority)
Re-process → generate-roadmap (with additional context from client_context)
```

---

## 5. MULTI-TENANT ARCHITECTURE (Future-Ready)

### Current: Single Practice (Torsor)
```
practice_id = '8624cd8c-b4c2-4fc3-85b8-e559d14b0568' (Torsor)
```

### Future: Multiple Practices
```
Smith & Co Accountants → practice_id = 'aaa...'
  └── Clients: Company A, Company B...
  └── Team: John (advisor), Jane (admin)...
  └── Knowledge Base: Custom guidance
  └── Service Lines: 365 Alignment, Growth Program...

Jones Advisory → practice_id = 'bbb...'
  └── Separate clients, team, knowledge...
```

### Row Level Security (RLS)
```sql
-- Clients see only their own data
CREATE POLICY "Clients see own data" ON client_assessments
  FOR ALL USING (
    client_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- Team sees all clients in their practice
CREATE POLICY "Team sees practice data" ON client_assessments
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );
```

---

## 6. SERVICE LINES (Future-Ready)

```sql
-- SERVICE LINES TABLE
service_lines
├── id
├── practice_id
├── name ('365 Alignment' | 'Growth Program' | 'Exit Planning' | ...)
├── assessments (jsonb[])  -- Which assessments are part of this service
├── edge_functions (jsonb[])  -- Which processing functions to call
├── pricing
└── is_active

-- ENROLLMENTS
client_enrollments
├── id
├── client_id
├── service_line_id
├── status
├── enrolled_at
└── completed_at
```

---

## 7. GDPR & DATA PROTECTION

### Current Approach
- **Data Location**: All data in Supabase (EU region: Frankfurt)
- **LLM Calls**: Via OpenRouter → Anthropic Claude
- **No Training**: OpenRouter does NOT use data for training

### Recommended Additions

```typescript
// In Edge Functions - add to every LLM call
headers: {
  'X-No-Train': 'true',  // Signal no training
  'HTTP-Referer': 'https://torsor.co.uk'
}

// In request body
{
  model: 'anthropic/claude-3.5-sonnet',
  // Anthropic's data policy: No training on API data
}
```

### Data Processing Agreement Needs
1. **Supabase DPA**: Already GDPR compliant
2. **OpenRouter DPA**: Request from them
3. **Anthropic DPA**: Through OpenRouter
4. **Client Consent**: Add consent flow for LLM processing

### Anonymization Option (Future)
```typescript
// Before sending to LLM, anonymize PII
function anonymize(data) {
  return {
    ...data,
    full_name: 'CLIENT_001',
    company_name: 'COMPANY_001',
    email: 'redacted@example.com'
  };
}
```

---

## 8. KNOWLEDGE BASE / VECTOR DB

### Purpose
Store Torsor's methodology, corrections, and examples that LLMs should reference before generating suggestions.

### Implementation with pgvector

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base with embeddings
CREATE TABLE knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id),
  category text,  -- 'methodology', 'example', 'correction', 'objection_handling'
  title text,
  content text,
  embedding vector(1536),  -- OpenAI ada-002 embeddings
  created_at timestamptz DEFAULT now()
);

-- Similarity search index
CREATE INDEX ON knowledge_base 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### RAG Flow (Future Edge Function)
```typescript
async function generateWithKnowledge(prompt, practiceId) {
  // 1. Get relevant knowledge
  const { data: knowledge } = await supabase.rpc('match_knowledge', {
    query_embedding: await embed(prompt),
    practice_id: practiceId,
    match_count: 5
  });
  
  // 2. Include in prompt
  const enrichedPrompt = `
    TORSOR METHODOLOGY:
    ${knowledge.map(k => k.content).join('\n\n')}
    
    USER REQUEST:
    ${prompt}
  `;
  
  // 3. Call LLM with context
  return await callLLM(enrichedPrompt);
}
```

---

## 9. GDPR & DATA PROTECTION

### 9.1 Data Flow & LLM Safety

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA PROTECTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Client Assessment     sanitizeForLLM()      OpenRouter/Anthropic           │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐        │
│  │ Full PII     │ ──► │ Anonymized   │ ──► │ NO TRAINING          │        │
│  │ - Email      │     │ - "founder"  │     │ - API data excluded  │        │
│  │ - Full name  │     │ - Revenue    │     │ - No model updates   │        │
│  │ - IDs        │     │   ranges     │     │ - EU servers (Claude)│        │
│  └──────────────┘     └──────────────┘     └──────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 What We Send to LLMs

| Data Type | Treatment | Reason |
|-----------|-----------|--------|
| Email addresses | ❌ NEVER sent | PII |
| Full names | Anonymized to "founder" | PII |
| User/Client IDs | ❌ NEVER sent | Identifiers |
| Company name | ✅ Sent (with consent) | Needed for context |
| Revenue exact | Converted to ranges | Financial privacy |
| Emotional responses | ✅ Sent | Core to methodology |
| Industry | ✅ Sent | Required for relevance |

### 9.3 LLM Provider Compliance

**OpenRouter → Anthropic (Claude)**
- Anthropic does NOT train on API data
- EU data processing available
- GDPR compliant data handling
- No data retention beyond request

**Request Headers**
```typescript
{
  'HTTP-Referer': 'https://torsor.co.uk',
  'X-Title': 'Torsor 365 Platform'
}
```

### 9.4 Data Retention Periods

| Data Type | Retention | Legal Basis |
|-----------|-----------|-------------|
| Client assessments | 7 years | Business records |
| Roadmaps | 7 years | Business records |
| Tasks | 3 years | Operational |
| Chat messages | 1 year | Support |
| LLM logs | 1 year | Anonymized only |
| Post-contract | 6 years | UK legal requirement |

### 9.5 Consent Management

```sql
-- Client consent stored in practice_members
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS ai_consent boolean DEFAULT false;
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS consent_timestamp timestamptz;
ALTER TABLE practice_members ADD COLUMN IF NOT EXISTS consent_version text;
```

---

## 10. MULTI-TENANT GTM ARCHITECTURE

### 10.1 Current: Single Practice (Torsor)

```
torsor.co.uk (Practice Platform)
client.torsor.co.uk (Client Portal)
└── practice_id = '8624cd8c...' (Torsor)
    └── All clients belong to Torsor
```

### 10.2 Future: Multi-Tenant SaaS

```
Smith & Co Accountants → practice_id = 'aaa...'
├── Platform: smithco.torsor.co.uk OR app.smithco.com
├── Client Portal: clients.smithco.torsor.co.uk
├── Team: John (owner), Jane (advisor), Bob (viewer)
├── Clients: 50 businesses
├── Knowledge Base: Custom methodology docs
├── Service Lines: 365 Alignment, Growth Program
└── Branding: Custom colors, logo, domain

Jones Advisory → practice_id = 'bbb...'
├── Platform: jonesadvisory.torsor.co.uk
├── Completely separate data
└── Own clients, team, knowledge base
```

### 10.3 Database Isolation

```sql
-- All client tables have practice_id
ALTER TABLE client_assessments ADD COLUMN IF NOT EXISTS practice_id uuid;
ALTER TABLE client_roadmaps ADD COLUMN IF NOT EXISTS practice_id uuid;
ALTER TABLE client_tasks ADD COLUMN IF NOT EXISTS practice_id uuid;
ALTER TABLE client_context ADD COLUMN IF NOT EXISTS practice_id uuid;

-- Row Level Security enforces isolation
CREATE POLICY "Practice isolation" ON client_assessments
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid()
    )
  );
```

### 10.4 Service Line Architecture

```sql
CREATE TABLE service_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id uuid REFERENCES practices(id),
  name text NOT NULL,  -- '365 Alignment', 'Cashflow Forecast', etc.
  assessments jsonb[],  -- Which assessments are included
  edge_functions jsonb[],  -- Which generation functions to call
  pricing jsonb,
  is_active boolean DEFAULT true
);

CREATE TABLE client_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES practice_members(id),
  service_line_id uuid REFERENCES service_lines(id),
  status text DEFAULT 'active',
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
```

### 10.5 GTM Pricing Model

| Tier | Price | Clients | Service Lines | Features |
|------|-------|---------|---------------|----------|
| Starter | £299/mo | 10 | 365 Only | Basic |
| Professional | £599/mo | 50 | All | + Knowledge Base |
| Enterprise | £1499/mo | Unlimited | All | + Custom Domain, SSO |

### 10.6 White-Label Configuration

```sql
CREATE TABLE practice_branding (
  practice_id uuid PRIMARY KEY REFERENCES practices(id),
  primary_color text DEFAULT '#4F46E5',
  secondary_color text DEFAULT '#10B981',
  logo_url text,
  custom_domain text,
  email_from_name text,
  email_reply_to text
);
```

---

## 11. FILES REFERENCE

### Client Portal
```
apps/client-portal/
├── src/
│   ├── contexts/AuthContext.tsx     # Auth + client session
│   ├── hooks/useAnalysis.ts         # All analysis hooks
│   ├── pages/
│   │   ├── assessments/             # Part 1, 2, 3 forms
│   │   └── roadmap/RoadmapPage.tsx  # Roadmap display
│   └── lib/supabase.ts              # Supabase client
```

### Edge Functions
```
supabase/functions/
├── generate-fit-profile/index.ts    # 483 lines
├── generate-followup-analysis/index.ts  # 863 lines
├── generate-roadmap/index.ts        # 1,293 lines
└── generate-value-analysis/index.ts # 1,933 lines
```

### Shared Types
```
packages/shared/src/types/
├── client.ts      # ClientSession, Assessment types
├── roadmap.ts     # RoadmapData, Task types
└── practice.ts    # Practice, Member types
```

