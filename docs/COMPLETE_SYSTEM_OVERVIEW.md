# TORSOR PLATFORM - COMPLETE SYSTEM OVERVIEW
## Last Updated: January 2025

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
│  │  DISCOVERY FLOW                    │         │  SKILLS & TEAM                     │        │
│  │  ├── Signup (RPGCC branded)        │         │  ├── Skills Heatmap                │        │
│  │  ├── Login (RPGCC branded)         │         │  ├── Skills Management            │        │
│  │  ├── Discovery Portal              │         │  ├── Team Analytics               │        │
│  │  ├── Destination Discovery         │◄───────►│  └── Service Readiness            │        │
│  │  │   (25 refined questions)        │         │                                    │        │
│  │  ├── Discovery Complete            │         │  CLIENT SERVICES                   │        │
│  │  └── Discovery Report              │         │  ├── Client List by Service        │        │
│  │      (Client-friendly view)        │         │  ├── Discovery Client Modal        │        │
│  │                                    │         │  │   ├── Responses Tab             │        │
│  │  ASSESSMENTS                       │         │  │   ├── Documents Tab             │        │
│  │  ├── Part 1/2/3 (365 Method)       │         │  │   ├── Analysis Tab             │        │
│  │  ├── Service Diagnostics           │         │  │   └── Services Tab             │        │
│  │  └── Service Onboarding            │         │  ├── Generate Discovery Report     │        │
│  │                                    │         │  ├── Share Report with Client      │        │
│  │  ROADMAP & TASKS                   │         │  ├── Roadmap Viewer                │        │
│  │  ├── 5-Year Vision                 │         │  ├── Context Upload (docs/notes)   │        │
│  │  ├── 6-Month Shift                 │         │  ├── Sprint Regeneration           │        │
│  │  ├── 12-Week Sprint                │         │  └── Value Analysis                │        │
│  │  └── Weekly Tasks                  │         │                                    │        │
│  │                                    │         │  DELIVERY TEAMS                    │        │
│  │  VALUE ANALYSIS                    │         │  ├── Team Assignment               │        │
│  │  ├── Business Valuation            │         │  ├── Capacity Management           │        │
│  │  ├── Risk Register                 │         │  └── Phase-Based Fit               │        │
│  │  └── ROI Opportunities             │         │                                    │        │
│  │                                    │         │  SERVICE CONFIG                    │        │
│  │  CHAT & SUPPORT                    │         │  ├── Workflow Phases               │        │
│  │  ├── AI-Powered Chat               │         │  ├── Phase Activities              │        │
│  │  └── Appointments                  │         │  └── Skill Matching                │        │
│  │                                    │         │                                    │        │
│  └──────────────┬─────────────────────┘         │  ASSESSMENTS EDITOR                │        │
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
│  │  │   + pgvector     │  │    (Supabase)    │  │ (client-docs)    │  │  (15 total)   │  │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘  └──────────────┘  │   │
│  │                                                                                        │   │
│  │  Edge Functions:                                                                      │   │
│  │  • generate-discovery-report      • process-client-context                            │   │
│  │  • generate-roadmap               • generate-value-analysis                           │   │
│  │  • client-signup                  • chat-completion                                   │   │
│  │  • [11 more...]                                                                      │   │
│  └───────────────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                                      │
│                                        ▼                                                      │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              EXTERNAL SERVICES                                         │   │
│  │                                                                                        │   │
│  │  ┌─────────────────────────────┐  ┌─────────────────────┐  ┌──────────────────────┐  │   │
│  │  │   OpenRouter (LLM Gateway)  │  │    Resend (Email)   │  │   Railway (Hosting)  │  │   │
│  │  │  Claude 3.5 Sonnet (main)   │  │  noreply@torsor.uk  │  │  3 deployments       │  │   │
│  │  │  GPT-4o (fallback)          │  │                     │  │  • platform          │  │   │
│  │  └─────────────────────────────┘  └─────────────────────┘  │  • client-portal     │  │   │
│  │                                                             │  • ai-portal         │  │   │
│  │                                                             └──────────────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                              AI PORTAL (Separate System)                               │   │
│  │                              ai.torsor.co.uk                                           │   │
│  │  • Implementation Committee  • Oversight Committee  • Admin                            │   │
│  │  • AI Tool Registry          • Policy Management    • Audit Logs                      │   │
│  └───────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# 2. DEPLOYMENTS

| Domain | Purpose | Tech Stack | Railway Service | Status |
|--------|---------|------------|-----------------|--------|
| `torsor.co.uk` | Practice Platform | Vite + React + TypeScript | torsor-platform | ✅ Live |
| `client.torsor.co.uk` | Client Portal | Vite + React + TypeScript | client-portal | ✅ Live |
| `ai.torsor.co.uk` | AI Portal | Next.js 14 + React | ai-portal | ✅ Live |

---

# 3. CLIENT PORTAL (client.torsor.co.uk)

## Overview

The Client Portal is a white-labeled, client-facing application that provides a simple, focused experience for RPGCC clients. It features RPGCC branding throughout and focuses on discovery assessments and service delivery.

## Key Features

### 1. Discovery Assessment Flow

**Purpose:** Understand client goals, challenges, and opportunities to recommend appropriate services.

**Flow:**
1. **Signup** (`/signup/rpgcc`) - Auto-login after signup, no email verification required
2. **Login** (`/login`) - Redirects to `/portal` after authentication
3. **Discovery Portal** (`/portal`) - Main landing page showing discovery status
4. **Destination Discovery** (`/discovery`) - 25 refined questions across 5 sections:
   - **Your Destination (5 questions)** - Vision, success definition, exit thinking
   - **Your Reality (7 questions)** - Hours worked, firefighting %, holidays, scaling constraints
   - **Your Team (5 questions)** - Team confidence, key person risk, delegation ability
   - **Blind Spots (4 questions)** - Avoided conversations, hard truths, external view
   - **Moving Forward (4 questions)** - Priority focus, change readiness, blockers
5. **Discovery Complete** (`/discovery/complete`) - Thank you page
6. **Discovery Report** (`/discovery/report`) - Client-friendly personalized insights

**Design:**
- Clean white backgrounds with RPGCC blue accents
- Professional, sympathetic tone
- No purple/indigo colors - uses slate and blue only
- Responsive and accessible

### 2. Discovery Report (Client View)

**Location:** `/discovery/report`

**Features:**
- **Sympathetic Opening** - "We heard you" with heart icon
- **Vision Clarity Score** - Visual progress bar showing clarity percentage
- **Your Destination** - Shows their stated goals in their own words
- **What's Holding You Back** - Gentle gap analysis (max 3 gaps)
- **Cost of Waiting** - Clear but not aggressive presentation
- **Your Path Forward** - 2-3 service recommendations with:
  - Annual investment + monthly equivalent
  - Expected ROI and payback period
  - Key outcomes and benefits
- **Investment Summary** - Total investment, expected return, net benefit
- **Closing Message** - Encouraging, personalized note
- **Call to Action** - Book a conversation button

**Access Control:**
- Only visible when `is_shared_with_client = true` in `client_reports` table
- Practice team controls sharing via "Share with Client" button

### 3. Service Line Assessments

Clients can complete service-specific assessments for enrolled services:
- Management Accounts onboarding
- Systems Audit diagnostic
- Fractional CFO/COO assessments
- Combined Advisory assessment

### 4. Roadmap & Tasks

For 365 Alignment clients:
- 5-Year Vision display
- 6-Month Shift overview
- 12-Week Sprint with weekly tasks
- Task completion tracking

### 5. Value Analysis

For clients who complete Part 3 (Hidden Value Audit):
- Business valuation with industry multiples
- Risk register
- Value gaps identification
- ROI opportunities

## Branding

**Logo:**
- Uses actual logo files from `/public/logos/`
- `rpgcc-logo.png` - For light backgrounds
- `rpgcc-logo-white.png` - For dark backgrounds
- Falls back to text-based logo if images not found

**Colors:**
- **Primary:** Slate-800 (dark navy) for headers
- **Accent:** Blue-600 for buttons and highlights
- **Background:** White/light gray for clean, professional look
- **Text:** Gray-900 for headings, Gray-600 for body

**Footer:**
- "RPGCC"
- "London Chartered Accountants and Auditors"
- "RPGCC is a trading name of RPG Crouch Chapman LLP"

## Authentication

**Flow:**
1. Client signs up via `/signup/rpgcc`
2. `client-signup` Edge Function creates:
   - `auth.users` record
   - `practice_members` record (member_type='client', practice_id=RPGCC)
3. Auto-login via `signInWithPassword`
4. Redirect to `/portal`

**Session Management:**
- Uses `AuthContext` to load client session from `practice_members`
- Stores `ClientSession` with: clientId, practiceId, name, email, company, status
- Handles token refresh gracefully

## Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/login` | Client login | No |
| `/signup` | Client signup | No |
| `/signup/:practiceCode` | Practice-specific signup | No |
| `/portal` | Main discovery portal | Yes |
| `/discovery` | Destination discovery assessment | Yes |
| `/discovery/complete` | Thank you page | Yes |
| `/discovery/report` | Personalized discovery report | Yes |
| `/assessments` | Assessment list | Yes |
| `/assessment/part1` | Part 1 assessment | Yes |
| `/assessment/part2` | Part 2 assessment | Yes |
| `/assessment/part3` | Part 3 assessment | Yes |
| `/roadmap` | Roadmap view | Yes |
| `/tasks` | Task list | Yes |
| `/chat` | AI chat | Yes |
| `/appointments` | Appointment booking | Yes |

---

# 4. PRACTICE PLATFORM (torsor.co.uk)

## Overview

The Practice Platform is the internal tool for RPGCC team members to manage clients, services, assessments, and delivery.

## Key Features

### 1. Client Services Management

**Location:** `/` (clients tab)

**Features:**
- View all clients grouped by service line
- **Discovery Service Line Card:**
  - Shows clients in discovery phase
  - Click to open `DiscoveryClientModal`
  
**Discovery Client Modal Tabs:**

1. **Responses Tab:**
   - All discovery assessment answers
   - Organized by section
   - Shows question text and client responses

2. **Documents Tab:**
   - Upload client documents (financial data, contracts, notes)
   - Multi-file upload support
   - Documents stored in `client_context` table
   - Processed by `process-client-context` Edge Function

3. **Analysis Tab:**
   - Internal notes textarea
   - AI-generated value propositions display
   - "Generate Report" button triggers `generate-discovery-report` Edge Function
   - Shows generated report with:
     - Executive summary
     - Gap analysis
     - Recommended investments (2-3 services)
     - Investment summary with ROI
     - Closing message
   - **Share with Client** button - Toggles `is_shared_with_client` flag

4. **Services Tab:**
   - Assign service lines to client
   - Checkboxes for available services
   - Updates `client_service_lines` table

### 2. Skills & Team Management

- **Skills Heatmap** - Visual grid of team member skills
- **Skills Management** - Add skills, assess team members
- **Service Readiness** - Service delivery readiness by team
- **Team Analytics** - Team performance metrics

### 3. Delivery Management

- **Delivery Teams** - Build and manage delivery teams
- **Team Member Assignments** - Assign team members to clients
- **Phase-Based Fit** - Match team skills to service phases

### 4. Service Configuration

- **Workflow Phases** - Configure phases for each service
- **Phase Activities** - Define activities within phases
- **Skill Matching** - Map skills to activities

### 5. Assessment Editor

- Preview assessment questions
- Edit and save to database
- Share for review

---

# 5. DISCOVERY REPORT GENERATION

## Edge Function: `generate-discovery-report`

**Location:** `supabase/functions/generate-discovery-report/index.ts`

**Trigger:** Manual via "Generate Report" button in Practice Platform

**Input:**
```typescript
{
  clientId: string;
  practiceId: string;
  discoveryId: string;
}
```

**Process:**
1. Fetches client discovery responses from `destination_discovery`
2. Loads client context documents from `client_context`
3. Loads financial context from `client_financial_context` (if available)
4. Loads operational context from `client_operational_context` (if available)
5. Loads pattern analysis from `client_pattern_analysis` (if available)
6. Builds comprehensive prompt with:
   - Client's exact words from discovery
   - Known financial data (revenue, margins, staff count)
   - Team observations
   - Pre-computed patterns
7. Calls OpenRouter (Claude 3.5 Sonnet) to generate report
8. Parses JSON response (handles markdown-wrapped JSON)
9. Stores in `client_reports` table
10. Returns report data to frontend

**Report Structure:**
```typescript
{
  executiveSummary: {
    headline: string;
    destinationVision: string;
    currentReality: string;
    criticalInsight: string;
  };
  gapAnalysis: {
    primaryGaps: Array<{
      gap: string;
      category: string;
      severity: string;
      evidence: string;
      currentImpact: {...};
      rootCause: string;
      ifUnaddressed: string;
    }>;
    costOfInaction: {
      annualFinancialCost: string;
      opportunityCost: string;
      personalCost: string;
    };
  };
  recommendedInvestments: Array<{
    service: string;
    code: string;
    priority: number;
    recommendedTier: string;
    annualInvestment: string;
    monthlyInvestment: string;
    investmentFrequency: string;
    whyThisService: string;
    problemsSolved: Array<{
      problem: string;
      theirWords: string;
      expectedResult: string;
    }>;
    expectedROI: {
      multiplier: string;
      timeframe: string;
      calculation: string;
    };
    expectedOutcomes: Array<{
      outcome: string;
      timeline: string;
    }>;
  }>;
  investmentSummary: {
    totalFirstYearInvestment: string;
    projectedFirstYearReturn: string;
    netBenefitYear1: string;
    paybackPeriod: string;
  };
  closingMessage: {
    personalNote: string;
    callToAction: string;
    urgencyReminder: string;
  };
}
```

**Key Requirements:**
- Always recommends 2-3 services (minimum 2)
- Uses exact pricing from service tiers
- Quotes client's exact words 8-10 times
- Calculates specific £ figures for costs and benefits
- Connects every recommendation to something client said

---

# 6. ENHANCED DISCOVERY FRAMEWORK

## Refined Questions (25 Total)

**For Existing Clients** - Avoids asking about known financial data

### Section 1: Your Destination (5 questions)
- `dd_five_year_picture` - Describe a typical Tuesday in 5 years
- `dd_success_definition` - What does success mean to you?
- `dd_non_negotiables` - What are your non-negotiables?
- `dd_what_would_change` - If money was no object, what would you change?
- `dd_exit_thoughts` - Thoughts on eventually stepping back

### Section 2: Your Reality (7 questions)
- `dd_honest_assessment` - How close are you to your vision?
- `dd_owner_hours` - How many hours do you work per week?
- `dd_time_breakdown` - Firefighting vs strategic work percentage
- `dd_holiday_reality` - When did you last take 2+ weeks off?
- `dd_what_breaks_first` - What would break if you doubled revenue?
- `dd_sleep_thief` - What keeps you awake at 3am?
- `dd_biggest_frustration` - Complete: "The thing that frustrates me MOST is..."

### Section 3: Your Team (5 questions)
- `dd_team_confidence` - Rate confidence in your team (1-10)
- `dd_key_person_risk` - What if your best person left?
- `dd_people_challenge` - Biggest people challenge right now
- `dd_delegation_honest` - How good are you at delegating?
- `dd_team_secret` - What does your team NOT know?

### Section 4: Blind Spots (4 questions)
- `dd_avoided_conversation` - What conversation have you been avoiding?
- `dd_hard_truth` - Hard truth you've been reluctant to face
- `dd_external_view` - What would spouse/partner say about work-life balance?
- `dd_if_i_knew` - Complete: "If I really KNEW my numbers, I'd discover..."

### Section 5: Moving Forward (4 questions)
- `dd_priority_focus` - Wave a magic wand, fix ONE area
- `dd_change_readiness` - How ready are you to make real changes?
- `dd_past_blockers` - What's stopped you before?
- `dd_final_message` - One thing to help us help you better

## Structured Client Context Tables

### `client_financial_context`
Stores known financial data (from accounts, Xero, etc.):
- Period info (annual, YTD, quarterly, monthly)
- Revenue, gross profit, margins
- Net profit, operating costs
- Working capital (debtors/creditors days, cash)
- People metrics (staff count, cost, revenue per head)
- Trends (YoY growth)
- Extracted insights and risk indicators

### `client_operational_context`
Stores team knowledge/observations:
- Business profile (type, industry, years trading)
- Client concentration (% from top clients)
- Team structure (management size, owner age, succession status)
- Engagement history (years as client, services used)
- Team observations (strengths, challenges, relationship notes)
- Opportunity score and risk factors

### `client_pattern_analysis`
AI-detected patterns and insights:
- Patterns detected (JSON array)
- Risks identified
- Opportunities identified
- Emotional anchors extracted
- Overall scores (destination clarity, gap severity, readiness, opportunity)
- Recommended services

## Document Processing

### Edge Function: `process-client-context`

**Purpose:** Extract structured data from uploaded documents

**Process:**
1. Receives document uploads from practice team
2. Extracts text (PDF, DOCX, TXT)
3. Uses AI to extract:
   - Financial data → `client_financial_context`
   - Operational insights → `client_operational_context`
   - Patterns, risks, opportunities → `client_pattern_analysis`
4. Stores extracted data for use in report generation

---

# 7. DATABASE SCHEMA (Key Tables)

## Discovery & Reports

```sql
-- DESTINATION DISCOVERY
destination_discovery
├── id (uuid, PK)
├── client_id, practice_id
├── responses (jsonb) -- All 25 question responses
├── extracted_anchors (jsonb) -- Emotional anchors
├── destination_clarity_score (integer 1-10)
├── gap_score (integer 1-10)
├── recommended_services (jsonb) -- Initial AI recommendations
├── value_propositions (jsonb)
├── section_scores (jsonb) -- Scores by section
├── emotional_intensity_score (integer)
├── urgency_indicators (jsonb)
├── pattern_matches (jsonb)
├── analysis_notes (text) -- Team internal notes
├── analysis_completed_at (timestamptz)
├── analysis_report_id (uuid, FK → client_reports)
└── completed_at, created_at, updated_at

-- CLIENT REPORTS
client_reports
├── id (uuid, PK)
├── client_id, practice_id
├── report_type (text) -- 'discovery_analysis'
├── report_data (jsonb) -- Full AI-generated report
├── is_shared_with_client (boolean)
├── shared_at (timestamptz)
└── created_at, updated_at

-- CLIENT FINANCIAL CONTEXT
client_financial_context
├── id (uuid, PK)
├── client_id, practice_id
├── period_type, period_end_date
├── revenue, gross_profit, gross_margin_pct
├── net_profit, net_margin_pct
├── debtors_days, creditors_days, cash_position
├── staff_count, staff_cost, revenue_per_head
├── revenue_growth_pct, profit_growth_pct
├── extracted_insights (jsonb)
├── risk_indicators (jsonb)
├── data_source (text)
└── created_at, updated_at

-- CLIENT OPERATIONAL CONTEXT
client_operational_context
├── id (uuid, PK)
├── client_id, practice_id
├── business_type, industry, years_trading
├── top_client_revenue_pct, top_3_clients_revenue_pct
├── client_count
├── management_team_size, owner_age_bracket
├── succession_status
├── years_as_client, services_used (text[])
├── observed_strengths (text[])
├── observed_challenges (text[])
├── relationship_notes (text)
├── opportunity_score (integer 1-10)
├── risk_factors (text[])
└── created_at, updated_at

-- CLIENT PATTERN ANALYSIS
client_pattern_analysis
├── id (uuid, PK)
├── client_id, practice_id
├── analysis_type (text)
├── patterns_detected (jsonb)
├── risks_identified (jsonb)
├── opportunities_identified (jsonb)
├── emotional_anchors (jsonb)
├── destination_clarity_score (integer 1-10)
├── gap_severity_score (integer 1-10)
├── readiness_score (integer 1-10)
├── opportunity_score (integer 1-10)
├── recommended_services (jsonb)
└── created_at
```

## Core Client Tables

```sql
-- PRACTICE MEMBERS
practice_members
├── id (uuid, PK)
├── practice_id (FK → practices)
├── user_id (FK → auth.users)
├── member_type -- 'team' | 'client'
├── name, email
├── client_company
├── program_status -- 'discovery' | 'discovery_complete' | 'enrolled' | 'active'
└── last_portal_login

-- CLIENT SERVICE LINES
client_service_lines
├── id (uuid, PK)
├── client_id (FK → practice_members)
├── service_line_id (FK → service_lines)
├── status -- 'pending_onboarding' | 'active' | 'in_progress' | 'cancelled'
└── enrolled_at

-- CLIENT CONTEXT (Documents & Notes)
client_context
├── id (uuid, PK)
├── client_id, practice_id
├── context_type -- 'document' | 'note' | 'transcript' | 'email'
├── content (text)
├── source_file_url (text)
├── applies_to (text[]) -- ['discovery', 'roadmap', etc.]
├── priority_level
├── is_shared (boolean)
├── data_source_type -- 'accounts' | 'transcript' | 'notes' | 'general'
├── processed (boolean)
└── created_at
```

---

# 8. EDGE FUNCTIONS

| Function | Purpose | Lines | Status |
|----------|---------|-------|--------|
| `generate-discovery-report` | AI-powered discovery analysis & recommendations | 948 | ✅ Active |
| `process-client-context` | Extract structured data from documents | 484 | ✅ Active |
| `generate-roadmap` | Generate 5-year/6-month/12-week plans | 1,889 | ✅ Active |
| `generate-value-analysis` | Business valuation & risk analysis | 1,933 | ✅ Active |
| `client-signup` | Secure client account creation | ~200 | ✅ Active |
| `generate-fit-profile` | Part 1 fit assessment | 483 | ✅ Active |
| `generate-followup-analysis` | Part 2 gap detection | 863 | ✅ Active |
| `generate-service-recommendations` | Service scoring after discovery | 537 | ✅ Active |
| `generate-value-proposition` | Service-specific VPs | 472 | ✅ Active |
| `send-client-invitation` | Email client invites | 261 | ✅ Active |
| `accept-invitation` | Handle invitation acceptance | 316 | ✅ Active |
| `chat-completion` | AI chat responses | ~200 | ✅ Active |
| `process-documents` | Document text extraction & vectorization | ~400 | ✅ Active |
| `send-assessment-review` | Email assessment previews | 285 | ✅ Active |
| `manage-assessment-questions` | CRUD for questions | ~200 | ✅ Active |

---

# 9. SERVICE LINES & PRICING

## Discovery Service

| Service | Code | Pricing |
|---------|------|---------|
| Destination Discovery | `destination_discovery` | Free (included) |

## Core Services

| Service | Code | Pricing Model | Tiers |
|---------|------|---------------|-------|
| 365 Alignment Programme | `365_method` | Annual | Lite: £1,500/yr<br>Growth: £4,500/yr<br>Partner: £9,000/yr |
| Fractional CFO | `fractional_cfo` | Monthly | From £3,500-£15,000/month |
| Fractional COO | `fractional_coo` | Monthly | From £3,000-£14,000/month |
| Combined CFO/COO | `combined_advisory` | Monthly | From £6,000-£28,000/month |
| Management Accounts | `management_accounts` | Monthly/Quarterly | £650/month or £1,750/quarter |
| Systems Audit | `systems_audit` | Project-based | £1,500-£4,000 (diagnostic + implementation) |
| Business Advisory | `business_advisory` | Project-based | £1,000-£4,000 |
| Benchmarking | `benchmarking` | Project-based | £450-£3,500 |
| Automation | `automation` | Hourly | £115-£180/hour |

---

# 10. CLIENT JOURNEY FLOW

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DISCOVERY-FIRST CLIENT JOURNEY                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. SIGNUP                   2. DISCOVERY             3. REPORT GENERATION  │
│  ┌──────────────────┐       ┌──────────────────┐    ┌──────────────────┐  │
│  │ /signup/rpgcc    │──────►│ /discovery       │───►│ Practice Team    │  │
│  │ • Email/Password │       │ • 25 Questions   │    │ Generates Report │  │
│  │ • Auto-login     │       │ • Clean UI       │    │ via Edge Function│  │
│  │ • → /portal      │       │ • White/Blue     │    │                  │  │
│  └──────────────────┘       └──────────────────┘    └────────┬─────────┘  │
│                                                               │            │
│  4. SHARE REPORT             5. CLIENT VIEWS REPORT          │            │
│  ┌──────────────────┐       ┌──────────────────┐            │            │
│  │ Practice clicks  │──────►│ /discovery/report│            │            │
│  │ "Share with      │       │ • Sympathetic     │            │            │
│  │  Client" button  │       │ • Clear pricing   │            │            │
│  └──────────────────┘       │ • 2-3 services    │            │            │
│                             │ • ROI & benefits  │            │            │
│                             └──────────────────┘            │            │
│                                                                              │
│  6. SERVICE ENROLLMENT       7. SERVICE DELIVERY                             │
│  ┌──────────────────┐       ┌──────────────────┐                           │
│  │ Client accepts   │──────►│ Service-specific │                           │
│  │ recommendations  │       │ assessments &    │                           │
│  │ Practice assigns │       │ delivery begin   │                           │
│  │ service lines    │       └──────────────────┘                           │
│  └──────────────────┘                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# 11. BRANDING & DESIGN

## RPGCC Branding

**Logo Implementation:**
- Component: `apps/client-portal/src/components/Logo.tsx`
- Files: `/public/logos/rpgcc-logo.png` and `/public/logos/rpgcc-logo-white.png`
- Automatic fallback to text-based logo if images not found
- Supports sizes: sm, md, lg, xl
- Supports variants: light (for light backgrounds), dark (for dark backgrounds)

**Color Palette:**
- **Primary Header:** Slate-800 (dark navy)
- **Primary Accent:** Blue-600 (RPGCC blue)
- **Background:** White/Slate-50 (clean, professional)
- **Text:** Gray-900 (headings), Gray-600 (body)
- **Success:** Green-500/600
- **Warning:** Amber-500/600
- **Error:** Red-500/600

**Typography:**
- Headings: Bold, tracking-tight
- Body: Regular weight
- Consistent spacing and sizing

**Legal Entity:**
- Footer displays: "RPGCC is a trading name of RPG Crouch Chapman LLP"
- All client-facing pages include this disclaimer

---

# 12. SECURITY & RLS

## Row Level Security Policies

**Practice Members:**
```sql
-- Clients see own record
CREATE POLICY "Users see own member record" ON practice_members
  FOR SELECT USING (user_id = auth.uid());

-- Clients update own record
CREATE POLICY "Users update own member record" ON practice_members
  FOR UPDATE USING (user_id = auth.uid());
```

**Client Reports:**
```sql
-- Clients see shared reports only
CREATE POLICY "Clients see shared reports" ON client_reports
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'client'
    )
    AND is_shared_with_client = true
  );

-- Team manages all reports
CREATE POLICY "Team manages reports" ON client_reports
  FOR ALL USING (
    practice_id IN (
      SELECT practice_id FROM practice_members 
      WHERE user_id = auth.uid() AND member_type = 'team'
    )
  );
```

**Client Context:**
- Team-only access (clients cannot see internal notes/documents)
- RLS ensures team members only see their practice's data

---

# 13. ENVIRONMENT VARIABLES

## Client Portal (Railway)

```env
VITE_SUPABASE_URL=https://mvdejlkiqslwrbarwxkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Practice Platform (Railway)

```env
VITE_SUPABASE_URL=https://mvdejlkiqslwrbarwxkw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Supabase Edge Functions

```env
OPENROUTER_API_KEY=sk-or-v1-...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@torsor.co.uk
SUPABASE_URL=https://mvdejlkiqslwrbarwxkw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

# 14. RECENT UPDATES (January 2025)

## Discovery Assessment Enhancements

✅ **Refined Questions (25 total)**
- Tailored for existing clients
- Avoids asking about known financial data
- Focuses on aspirations, challenges, and readiness

✅ **Enhanced Context Framework**
- `client_financial_context` table for known financials
- `client_operational_context` table for team knowledge
- `client_pattern_analysis` table for AI-detected patterns

✅ **Document Intelligence**
- `process-client-context` Edge Function
- Extracts structured data from uploaded documents
- Identifies patterns, risks, and opportunities

✅ **Improved Report Generation**
- Always recommends 2-3 services (minimum 2)
- Uses exact service pricing from tiers
- Quotes client's exact words throughout
- Calculates specific £ figures for costs/benefits
- Clear annual + monthly pricing display

## Client Portal Improvements

✅ **Client-Friendly Report View**
- Sympathetic, encouraging design
- Clear pricing (annual + monthly)
- Visual clarity score
- Gentle gap analysis
- Investment summary with ROI

✅ **Share with Client Feature**
- Practice team controls report visibility
- Toggle `is_shared_with_client` flag
- Client sees report in portal when shared

✅ **Branding Updates**
- Actual logo files (PNG format)
- Consistent RPGCC colors throughout
- Clean white design for assessments
- Professional, sympathetic tone

✅ **Auto-Login After Signup**
- No email verification required
- Immediate redirect to portal
- Seamless onboarding experience

---

# 15. AI PORTAL (ai.torsor.co.uk)

## Overview

Separate system for managing RPGCC's internal AI implementation initiative. See `/ai-portal/docs/SYSTEM_OVERVIEW.md` for complete documentation.

**Key Features:**
- Implementation Committee portal
- Oversight Committee portal
- AI Tool Registry
- Policy Management
- Audit Logging
- Post-Implementation Reviews

---

# 16. QUICK REFERENCE

## Client Discovery Link

**For Existing Clients:**
```
https://client.torsor.co.uk/signup/rpgcc
```

## Key URLs

| System | URL | Purpose |
|--------|-----|---------|
| Practice Platform | https://torsor.co.uk | Internal team tool |
| Client Portal | https://client.torsor.co.uk | Client-facing portal |
| AI Portal | https://ai.torsor.co.uk | AI implementation management |
| Supabase | https://supabase.com/dashboard/project/mvdejlkiqslwrbarwxkw | Database management |

## Support

- **Technical:** James Howard
- **Project:** RPGCC Practice Team

---

*Document maintained in `/docs/COMPLETE_SYSTEM_OVERVIEW.md`*  
*Last Updated: January 2025*  
*Version: 4.0 - Complete Discovery Framework + Client Reports + Enhanced Branding*
