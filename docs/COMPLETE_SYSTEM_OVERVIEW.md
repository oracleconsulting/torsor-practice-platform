# TORSOR PLATFORM - COMPLETE SYSTEM OVERVIEW
## Last Updated: December 2024

---

# 1. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TORSOR ECOSYSTEM                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  ┌───────────────────────────────────┐         ┌───────────────────────────────────┐        │
│  │         CLIENT PORTAL              │         │       PRACTICE PLATFORM            │        │
│  │     client.torsor.co.uk           │         │        torsor.co.uk                │        │
│  │                                    │         │                                    │        │
│  │  ASSESSMENTS                       │         │  SKILLS & TEAM                     │        │
│  │  ├── Destination Discovery         │         │  ├── Skills Heatmap                │        │
│  │  ├── Service Diagnostics           │◄───────►│  ├── Skills Management            │        │
│  │  ├── Part 1/2/3 (365 Method)       │         │  ├── Team Analytics               │        │
│  │  └── Service Onboarding            │         │  └── Service Readiness            │        │
│  │                                    │         │                                    │        │
│  │  ROADMAP & TASKS                   │         │  CLIENT SERVICES                   │        │
│  │  ├── 5-Year Vision                 │         │  ├── Client List by Service        │        │
│  │  ├── 6-Month Shift                 │         │  ├── Roadmap Viewer                │        │
│  │  ├── 12-Week Sprint                │         │  ├── Context Upload (docs/notes)   │        │
│  │  └── Weekly Tasks                  │         │  ├── Sprint Regeneration           │        │
│  │                                    │         │  └── Value Analysis                │        │
│  │  VALUE ANALYSIS                    │         │                                    │        │
│  │  ├── Business Valuation            │         │  DELIVERY TEAMS                    │        │
│  │  ├── Risk Register                 │         │  ├── Team Assignment               │        │
│  │  └── ROI Opportunities             │         │  ├── Capacity Management           │        │
│  │                                    │         │  └── Phase-Based Fit               │        │
│  │  CHAT & SUPPORT                    │         │                                    │        │
│  │  ├── AI-Powered Chat               │         │  SERVICE CONFIG                    │        │
│  │  └── Appointments                  │         │  ├── Workflow Phases               │        │
│  │                                    │         │  ├── Phase Activities              │        │
│  └──────────────┬─────────────────────┘         │  └── Skill Matching                │        │
│                 │                               │                                    │        │
│                 │                               │  ASSESSMENTS EDITOR                │        │
│                 │                               │  ├── Preview Questions             │        │
│                 │                               │  ├── Edit & Save to DB             │        │
│                 │                               │  └── Share for Review              │        │
│                 │                               └──────────────┬─────────────────────┘        │
│                 │                                              │                              │
│                 └──────────────────────┬───────────────────────┘                              │
│                                        ▼                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                  SUPABASE BACKEND                                      │   │
│  │                         mvdejlkiqslwrbarwxkw.supabase.co                              │   │
│  │                                                                                        │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │   │
│  │  │    PostgreSQL    │  │  Authentication  │  │     Storage      │  │ Edge Functions│  │   │
│  │  │   + pgvector     │  │    (Supabase)    │  │ (client-docs)    │  │  (13 total)   │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                                      │
│                                        ▼                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              EXTERNAL SERVICES                                         │   │
│  │                                                                                        │   │
│  │  ┌─────────────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐  │   │
│  │  │   OpenRouter (LLM Gateway)  │  │    Resend (Email)   │  │   Railway (Hosting)  │  │   │
│  │  │  Claude 3.5 Sonnet (main)   │  │  noreply@torsor.uk  │  │  2 deployments       │  │   │
│  │  │  GPT-4o (fallback)          │  │                     │  │                      │  │   │
│  │  └─────────────────────────────┘  └─────────────────────┘  └──────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. DEPLOYMENTS

| Domain | Purpose | Tech Stack | Railway Service |
|--------|---------|------------|-----------------|
| `torsor.co.uk` | Practice Platform | Vite + React + TypeScript | torsor-platform |
| `client.torsor.co.uk` | Client Portal | Vite + React + TypeScript | client-portal |

---

# 3. PROJECT STRUCTURE

```
torsor-practice-platform/
├── apps/
│   ├── client-portal/           # Client-facing application
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── DashboardPage.tsx
│   │       │   ├── LoginPage.tsx
│   │       │   ├── InvitationPage.tsx
│   │       │   ├── assessments/
│   │       │   │   ├── Part1Page.tsx      # Life Design Assessment
│   │       │   │   ├── Part2Page.tsx      # Business Deep Dive
│   │       │   │   └── Part3Page.tsx      # Hidden Value Audit
│   │       │   ├── discovery/
│   │       │   │   └── DestinationDiscoveryPage.tsx
│   │       │   ├── roadmap/
│   │       │   │   ├── RoadmapPage.tsx    # Main roadmap display
│   │       │   │   └── TasksPage.tsx
│   │       │   ├── services/
│   │       │   │   └── ServiceAssessmentPage.tsx
│   │       │   └── chat/
│   │       │       └── ChatPage.tsx
│   │       ├── contexts/
│   │       │   └── AuthContext.tsx        # Client session management
│   │       ├── hooks/
│   │       │   ├── useAnalysis.ts         # Roadmap/analysis hooks
│   │       │   └── useAssessmentProgress.ts
│   │       └── config/
│   │           └── serviceLineAssessments.ts
│   │
│   └── platform/                # Legacy apps/platform (mostly unused)
│
├── src/                         # Practice Platform (main torsor.co.uk)
│   ├── App.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DiagnosticsPage.tsx
│   │   ├── admin/
│   │   │   ├── SkillsHeatmapPage.tsx     # Team skills heatmap
│   │   │   ├── SkillsManagementPage.tsx  # Skill CRUD + assessments
│   │   │   ├── ServiceReadinessPage.tsx  # Service line readiness
│   │   │   ├── TeamAnalyticsPage.tsx     # Team performance
│   │   │   ├── ClientServicesPage.tsx    # Client management by service
│   │   │   ├── AssessmentPreviewPage.tsx # View/edit assessments
│   │   │   ├── DeliveryManagementPage.tsx# Delivery teams
│   │   │   └── ServiceConfigPage.tsx     # Phase/activity config
│   │   └── public/
│   │       └── AssessmentReviewPage.tsx  # Public review (no login)
│   ├── components/
│   │   └── Navigation.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCurrentMember.ts
│   │   ├── usePractice.ts
│   │   └── useSkills.ts
│   └── lib/
│       ├── supabase.ts
│       └── advisory-services.ts
│
├── supabase/functions/          # Edge Functions (13 total)
│   ├── accept-invitation/       # Handle client invitation acceptance
│   ├── chat-completion/         # AI chat
│   ├── fit-assessment/          # Legacy
│   ├── generate-fit-profile/    # After Part 1: fit signals + message
│   ├── generate-followup-analysis/  # After Part 2: gap detection
│   ├── generate-roadmap/        # Main roadmap generation (1,293 lines)
│   ├── generate-service-recommendations/ # After discovery survey
│   ├── generate-value-analysis/ # Business valuation (1,933 lines)
│   ├── generate-value-proposition/  # Service-specific VPs
│   ├── manage-assessment-questions/ # CRUD for questions
│   ├── process-documents/       # Text extraction + vectorization
│   ├── send-assessment-review/  # Email assessment preview
│   └── send-client-invitation/  # Email client invites
│
├── packages/
│   ├── shared/                  # Shared types & utilities
│   │   └── src/
│   │       ├── types/
│   │       │   ├── client.ts
│   │       │   └── roadmap.ts
│   │       └── utils/
│   │           └── dataProtection.ts  # PII sanitization
│   ├── llm/                     # LLM utilities
│   └── ui/                      # Shared UI components
│
├── scripts/                     # SQL migrations & utility scripts
│   ├── add-delivery-management.sql
│   ├── add-destination-discovery-framework.sql
│   ├── add-assessment-questions-table.sql
│   ├── add-phase-activities.sql
│   ├── add-service-workflow-tiers.sql
│   └── [35+ migration scripts]
│
└── docs/
    ├── ARCHITECTURE.md
    └── COMPLETE_SYSTEM_OVERVIEW.md  # This file
```

---

# 4. DATABASE SCHEMA

## Core Tables

```sql
-- PRACTICES (Multi-tenant support)
practices
├── id (uuid, PK)
├── name                  -- "RPGCC", "Torsor"
├── settings (jsonb)
└── created_at

-- PRACTICE MEMBERS (Team + Clients)
practice_members
├── id (uuid, PK)
├── practice_id (FK → practices)
├── user_id (FK → auth.users)
├── member_type           -- 'team' | 'client'
├── role                  -- 'owner' | 'admin' | 'advisor' | 'viewer'
├── name, email
├── client_company
├── program_status        -- 'pending' | 'active' | 'completed'
├── skip_value_analysis   -- boolean
└── last_portal_login

-- CLIENT ASSESSMENTS
client_assessments
├── id (uuid, PK)
├── practice_id, client_id
├── assessment_type       -- 'part1' | 'part2' | 'part3' | 'followup'
├── responses (jsonb)
├── fit_profile (jsonb)   -- Generated after Part 1
├── status                -- 'not_started' | 'in_progress' | 'completed'
├── completion_percentage
└── completed_at

-- CLIENT ROADMAPS
client_roadmaps
├── id (uuid, PK)
├── practice_id, client_id
├── roadmap_data (jsonb)
│   ├── fiveYearVision
│   ├── sixMonthShift
│   ├── sprint (12 weeks)
│   └── enrichedMetrics
├── value_analysis (jsonb)
│   ├── businessStage
│   ├── riskRegister
│   ├── valueGaps
│   └── businessValuation
├── is_active, version
└── created_at

-- CLIENT CONTEXT (Practice-added information)
client_context
├── id (uuid, PK)
├── practice_id, client_id
├── context_type          -- 'transcript' | 'email' | 'note' | 'document'
├── content (text)
├── applies_to (text[])   -- ['5year', '6month', '12week', 'value']
├── priority_level        -- 'normal' | 'high' | 'critical'
├── is_shared (boolean)   -- Applies to multiple clients
├── data_source_type      -- 'accounts' | 'transcript' | 'notes' | 'general'
├── processed (boolean)
├── vectorized (boolean)
└── created_at
```

## Service Lines & Invitations

```sql
-- SERVICE LINES
service_lines
├── id (uuid, PK)
├── practice_id
├── code                  -- '365_method', 'management_accounts', etc.
├── name, description
├── is_discovery          -- Part of destination discovery
├── scoring_config (jsonb)
└── is_active

-- CLIENT SERVICE LINES (Enrollment)
client_service_lines
├── id (uuid, PK)
├── client_id, service_line_id
├── enrolled_at
├── status
└── hidden_value_audit_unlocked_at

-- CLIENT INVITATIONS
client_invitations
├── id (uuid, PK)
├── practice_id
├── email, name, company
├── service_line_codes (text[])
├── include_discovery (boolean)
├── token (unique)
├── status                -- 'pending' | 'accepted' | 'expired'
├── invited_by
└── created_at, expires_at
```

## Assessment Questions (Database-backed)

```sql
-- ASSESSMENT QUESTIONS
assessment_questions
├── id (uuid, PK)
├── service_line_code
├── question_id
├── section
├── question_text
├── question_type         -- 'single' | 'multi' | 'text' | 'rank'
├── options (text[])
├── placeholder
├── emotional_anchor      -- For AI processing
├── technical_field
├── display_order
├── is_active
└── updated_at

-- QUESTION HISTORY (Audit trail)
assessment_question_history
├── id, question_id
├── changed_by
├── old_value, new_value
└── changed_at
```

## Delivery Management

```sql
-- DELIVERY TEAMS
delivery_teams
├── id (uuid, PK)
├── practice_id
├── service_line_code
├── name
├── max_clients
└── status

-- TEAM MEMBER ASSIGNMENTS
team_member_assignments
├── id, team_id
├── member_id
├── role_name
├── is_team_lead
├── allocated_hours_per_week
└── status

-- SERVICE WORKFLOW PHASES
service_workflow_phases
├── id (uuid, PK)
├── service_line_code
├── phase_code, phase_name
├── description
├── typical_duration
├── display_order
└── color

-- PHASE ACTIVITIES
phase_activities
├── id, phase_id
├── activity_name
├── description
└── display_order

-- ACTIVITY SKILL MAPPINGS
activity_skill_mappings
├── id, activity_id
├── skill_name
└── minimum_level
```

## Skills & Team

```sql
-- SKILLS
skills
├── id (uuid, PK)
├── name, category
├── description
├── is_technical
└── target_level

-- SKILL ASSESSMENTS
skill_assessments
├── id, member_id, skill_id
├── current_level (1-5)
├── target_level
├── assessed_by
└── assessed_at
```

## Vector Storage (pgvector)

```sql
-- DOCUMENT EMBEDDINGS
document_embeddings
├── id (uuid, PK)
├── client_id, context_id
├── chunk_index
├── chunk_text
├── embedding (vector(1536))
├── metadata (jsonb)
└── created_at

-- KNOWLEDGE BASE
knowledge_base
├── id (uuid, PK)
├── practice_id
├── category              -- 'methodology' | 'example' | 'correction'
├── title, content
├── embedding (vector(1536))
└── usage_count
```

---

# 5. EDGE FUNCTIONS

| Function | Trigger | Purpose | Lines |
|----------|---------|---------|-------|
| `generate-fit-profile` | Part 1 complete | Assess fit signals, generate personalized message | 483 |
| `generate-followup-analysis` | Part 2 complete | Detect gaps, generate dynamic questions | 863 |
| `generate-roadmap` | Follow-up complete | Generate 5-year/6-month/12-week plans | 1,293 |
| `generate-value-analysis` | Part 3 complete | Business valuation, risks, ROI opportunities | 1,933 |
| `generate-service-recommendations` | Discovery complete | Score services, recommend based on responses | 537 |
| `generate-value-proposition` | Service assessment | Generate service-specific value proposition | 472 |
| `send-client-invitation` | Manual | Email invitation with magic link | 261 |
| `accept-invitation` | Link clicked | Create user, enroll in services | 316 |
| `send-assessment-review` | Manual | Email assessments to reviewer (Jeremy) | 285 |
| `manage-assessment-questions` | API | CRUD operations for questions | ~200 |
| `process-documents` | File upload | Extract text, chunk, vectorize | ~400 |
| `chat-completion` | Chat message | AI-powered chat responses | ~200 |
| `fit-assessment` | Legacy | Old fit assessment | ~150 |

---

# 6. SERVICE LINES

| Code | Name | Type | Assessments |
|------|------|------|-------------|
| `365_method` | 365 Alignment Program | Core | Part 1 → Part 2 → Roadmap → Part 3 |
| `management_accounts` | Management Accounts | Service | MA Onboarding |
| `systems_audit` | Systems Audit | Service | SA Onboarding |
| `fractional_cfo` | Fractional CFO | Service | CFO Onboarding |
| `fractional_coo` | Fractional COO | Service | COO Onboarding |
| `combined_advisory` | Combined CFO/COO | Service | Combined Onboarding |
| `business_advisory` | Business Advisory & Exit | Service | BA Onboarding |
| `benchmarking` | Industry Benchmarking | Service | Benchmarking Assessment |
| `destination_discovery` | Destination Discovery | Discovery | 20 questions |
| `service_diagnostic` | Service Diagnostics | Discovery | 15 questions |
| `hidden_value_audit` | Hidden Value Audit | Value | 32 questions (shared) |

---

# 7. CLIENT JOURNEY FLOW

```
                                    DESTINATION FIRST FLOW
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  1. INVITATION                    2. DISCOVERY                  3. RECOMMENDATIONS  │
│  ┌──────────────────────┐        ┌────────────────────────┐    ┌─────────────────┐ │
│  │ Practice sends email │───────►│ Destination Discovery  │───►│ Service Scores  │ │
│  │ "Start with Discovery"│        │ (20 questions)         │    │ Top 3 shown     │ │
│  └──────────────────────┘        │ Service Diagnostics    │    │ + Value Props   │ │
│                                   │ (15 questions)         │    └────────┬────────┘ │
│                                   └────────────────────────┘             │          │
│                                                                          ▼          │
│  4. SERVICE ENROLLMENT           5. SERVICE ONBOARDING      6. VALUE ANALYSIS     │
│  ┌──────────────────────┐        ┌────────────────────────┐ ┌─────────────────┐   │
│  │ Client picks service │───────►│ Service-specific       │►│ Hidden Value    │   │
│  │ e.g. 365 Alignment   │        │ assessment (varies)    │ │ Audit (32 Qs)   │   │
│  └──────────────────────┘        └────────────────────────┘ └─────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                    365 ALIGNMENT SPECIFIC FLOW
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  PART 1                          PART 2                        ROADMAP GENERATION   │
│  ┌──────────────────────┐        ┌────────────────────────┐   ┌─────────────────┐  │
│  │ Life Design          │        │ Business Deep Dive     │   │ LLM Processing: │  │
│  │ - Tuesday Test       │───────►│ - Revenue/Expenses     │──►│ - 5-Year Vision │  │
│  │ - Secret Pride       │        │ - Team/Systems         │   │ - 6-Month Shift │  │
│  │ - Danger Zone        │        │ - Bottlenecks          │   │ - 12-Week Sprint│  │
│  │ - Family Feedback    │        │ - Desired Income       │   │                 │  │
│  └──────────────────────┘        └────────────────────────┘   └────────┬────────┘  │
│           │                                                            │           │
│           ▼                                                            ▼           │
│  ┌──────────────────────┐                                    ┌─────────────────┐  │
│  │ generate-fit-profile │                                    │ generate-roadmap│  │
│  │ → Fit signals        │                                    │ → 56 tasks      │  │
│  │ → Journey recommend  │                                    │ → Board members │  │
│  └──────────────────────┘                                    └─────────────────┘  │
│                                                                                      │
│  PART 3 (Optional)               VALUE ANALYSIS                                     │
│  ┌──────────────────────┐        ┌────────────────────────────────────────────┐    │
│  │ Hidden Value Audit   │───────►│ generate-value-analysis                    │    │
│  │ - Team Assets        │        │ → Business Valuation (industry multiples)  │    │
│  │ - IP/Systems         │        │ → Risk Register                            │    │
│  │ - Customer Value     │        │ → Value Gaps                               │    │
│  │ - Brand/Reputation   │        │ → ROI Opportunities                        │    │
│  └──────────────────────┘        └────────────────────────────────────────────┘    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. PRACTICE PLATFORM PAGES

| Page | URL Path | Purpose |
|------|----------|---------|
| Skills Heatmap | `/` (heatmap) | Visual grid of team skills |
| Skills Management | `/` (management) | Add skills, assess team members |
| Service Readiness | `/` (readiness) | Service delivery readiness by team |
| Team Analytics | `/` (analytics) | Team performance metrics |
| Client Services | `/` (clients) | Manage clients by service line |
| Assessments Editor | `/` (assessments) | Preview/edit question database |
| Delivery Teams | `/` (delivery) | Build & manage delivery teams |
| Service Config | `/` (config) | Configure workflow phases & activities |
| Public Review | `/review` | External assessment review (no login) |

---

# 9. LLM INTEGRATION

## OpenRouter Configuration

```typescript
// Model selection
const MODEL = 'anthropic/claude-3.5-sonnet';  // Primary
const FALLBACK = 'openai/gpt-4o';             // Fallback

// Headers for data protection
headers: {
  'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
  'HTTP-Referer': 'https://torsor.co.uk',
  'X-Title': 'Torsor 365 Platform'
}
```

## Data Sanitization (GDPR)

```typescript
// packages/shared/src/utils/dataProtection.ts
function sanitizeForLLM(data) {
  // ❌ NEVER send: emails, phone, NI numbers, bank accounts
  // ✅ Anonymize: names → "founder", company → "the business"
  // ✅ Convert: £125,000 → "[REVENUE: £100k-£150k]"
}
```

---

# 10. AUTHENTICATION & SECURITY

## Auth Flow

```
1. Practice Team:
   Email/Password → Supabase Auth → Check practice_members (member_type='team')
   
2. Client:
   Email/Password → Supabase Auth → Check practice_members (member_type='client')
   
3. Invitation:
   Magic link with token → accept-invitation → Create auth.user + practice_member
```

## Row Level Security (RLS)

```sql
-- Clients see only their data
CREATE POLICY "Clients own data" ON client_assessments
  FOR ALL USING (
    client_id = (SELECT id FROM practice_members WHERE user_id = auth.uid())
  );

-- Team sees all practice clients
CREATE POLICY "Team sees practice" ON client_assessments
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );

-- Public read for review page
CREATE POLICY "Public read questions" ON assessment_questions
  FOR SELECT TO anon USING (is_active = true);
```

---

# 11. FILE STORAGE

## Supabase Storage Bucket

```
Bucket: client-documents
├── {practice_id}/
│   ├── {client_id}/
│   │   ├── accounts_2024.pdf
│   │   ├── meeting_transcript.txt
│   │   └── notes.docx
```

## Document Processing Pipeline

```
1. Upload → Supabase Storage
2. process-documents Edge Function:
   - Extract text (PDF/DOCX/TXT)
   - Sanitize PII
   - Chunk text (500 tokens)
   - Generate embeddings (OpenAI)
   - Store in document_embeddings
3. Available for RAG in roadmap generation
```

---

# 12. EMAIL SYSTEM (Resend)

| Function | From | Template |
|----------|------|----------|
| Client Invitation | noreply@torsor.co.uk | Personalized invite with magic link |
| Assessment Review | noreply@torsor.co.uk | Assessment summary for reviewers |

---

# 13. ENVIRONMENT VARIABLES

## Railway (torsor.co.uk)

```
VITE_SUPABASE_URL=https://mvdejlkiqslwrbarwxkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Railway (client.torsor.co.uk)

```
VITE_SUPABASE_URL=https://mvdejlkiqslwrbarwxkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Supabase Edge Function Secrets

```
OPENROUTER_API_KEY=sk-or-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@torsor.co.uk
SUPABASE_URL (auto)
SUPABASE_SERVICE_ROLE_KEY (auto)
```

---

# 14. CURRENT CLIENTS

| Name | Email | Service | Status |
|------|-------|---------|--------|
| Tom Clark | tom@rowgear.com | 365 Alignment | Active (roadmap generated) |
| Zaneta Clark | zaneta@zlsalon.co.uk | 365 Alignment | Active (roadmap generated) |

---

# 15. WHAT'S WORKING ✅

- [x] Client authentication & session management
- [x] Part 1/2/3 assessments with conditional questions
- [x] Fit profile generation (LLM)
- [x] Comprehensive roadmap generation (5-year/6-month/12-week)
- [x] Business valuation with industry multiples
- [x] Value analysis with risk register
- [x] Practice platform with client management
- [x] Skills matrix & team analytics
- [x] Delivery teams with phase-based fit
- [x] Service configuration with workflow phases
- [x] Assessment question editor (database-backed)
- [x] Client invitations via email
- [x] Public assessment review page
- [x] Document upload & vectorization
- [x] Multi-service line architecture
- [x] Destination Discovery flow

---

# 16. WHAT NEEDS WORK 🔧

- [ ] Knowledge base population & RAG integration
- [ ] Chat functionality improvements
- [ ] Sprint task editing in practice platform
- [ ] Automated sprint regeneration with new context
- [ ] Multi-tenant onboarding (for other practices)
- [ ] Billing integration
- [ ] Email notification system
- [ ] Calendar/appointment booking
- [ ] PDF export of roadmaps
- [ ] Mobile responsiveness improvements

---

# 17. NEXT PRIORITIES

1. **Complete Delivery Management** - Phase activities, skill matching
2. **Knowledge Base** - Populate with Torsor methodology
3. **Sprint Refinement** - Better task specificity
4. **Jeremy Review** - Get feedback on assessments
5. **Multi-tenant prep** - White-label configuration

---

*Document maintained in `/docs/COMPLETE_SYSTEM_OVERVIEW.md`*

