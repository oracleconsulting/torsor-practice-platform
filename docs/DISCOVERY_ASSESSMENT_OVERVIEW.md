# Discovery Assessment System - Complete Overview

**Last Updated:** December 2025  
**System Version:** 2.0 (2-stage architecture)

---

## Table of Contents

1. [Discovery Assessment Structure](#discovery-assessment-structure)
2. [Service Lines](#service-lines)
3. [Skills by Service Line](#skills-by-service-line)
4. [Assessment-to-Service Line Tagging](#assessment-to-service-line-tagging)
5. [System Architecture](#system-architecture)

---

## Discovery Assessment Structure

The Discovery Assessment is a 2-part questionnaire that gathers comprehensive client data to generate personalized service recommendations.

### Part 1: Destination Discovery (25 Questions)

Explores the client's aspirations, current reality, and emotional state.

#### Section 1: Your Destination (5 questions)

| Question ID | Question Summary | Type | Service Link |
|------------|------------------|------|--------------|
| `dd_five_year_picture` | Picture yourself 5 years from now - describe a typical Tuesday | Text | 365_method, lifestyle_transformation |
| `dd_success_definition` | What does "success" mean for your business? | Single | exit_planning, 365_method |
| `dd_non_negotiables` | Non-negotiables for next chapter (up to 4) | Multi | lifestyle_assessment |
| `dd_what_would_change` | If money was no object, what ONE thing would you change? | Text | priority_detection |
| `dd_exit_thoughts` | Thoughts on stepping back from business | Single | business_advisory, exit_planning |

#### Section 2: Your Reality (7 questions)

| Question ID | Question Summary | Type | Service Link |
|------------|------------------|------|--------------|
| `dd_honest_assessment` | How close are you to your vision? | Single | gap_analysis |
| `dd_owner_hours` | Weekly working hours | Single | fractional_coo, burnout_detection |
| `dd_time_breakdown` | Firefighting vs strategic time % | Single | systems_audit, fractional_coo |
| `dd_holiday_reality` | Last 2+ weeks completely off | Single | burnout_detection |
| `dd_what_breaks_first` | What breaks if you double revenue? | Single | systems_audit, scaling_readiness |
| `dd_sleep_thief` | What keeps you awake at 3am? (up to 2) | Multi | emotional_anchor, risk_detection |
| `dd_biggest_frustration` | Main frustration with business | Text | core_pain_point |

#### Section 3: Your Team (5 questions)

| Question ID | Question Summary | Type | Service Link |
|------------|------------------|------|--------------|
| `dd_team_confidence` | Team confidence rating 1-10 | Single | fractional_coo, hiring_services |
| `dd_key_person_risk` | What if best person left? | Single | systems_audit, key_person_dependency |
| `dd_people_challenge` | Biggest people challenge | Single | fractional_coo |
| `dd_delegation_honest` | How good at delegating? | Single | fractional_coo, founder_dependency |
| `dd_team_secret` | What team doesn't know | Text | vulnerability_detection |

#### Section 4: Blind Spots (4 questions)

| Question ID | Question Summary | Type | Service Link |
|------------|------------------|------|--------------|
| `dd_avoided_conversation` | Conversation you've been avoiding | Text | hidden_challenge |
| `dd_hard_truth` | Hard truth reluctant to face | Text | vulnerability_detection |
| `dd_external_view` | What would spouse say about work-life? | Single | relationship_strain |
| `dd_if_i_knew` | "If I really knew my numbers, I'd discover..." | Text | financial_anxiety, management_accounts |

#### Section 5: Moving Forward (4 questions)

| Question ID | Question Summary | Type | Service Link |
|------------|------------------|------|--------------|
| `dd_priority_focus` | Magic wand - fix ONE area | Single | **PRIMARY SERVICE SELECTOR** |
| `dd_change_readiness` | Ready for real changes? | Single | implementation_likelihood |
| `dd_past_blockers` | What stopped changes before? (up to 3) | Multi | objection_handling |
| `dd_final_message` | Anything else to help us help you? | Text | open_insight |

### Part 2: Service Diagnostic (15 Questions)

These questions directly map to service recommendations.

#### Financial Clarity (3 questions)

| Question ID | Question Summary | Options → Service Mapping |
|------------|------------------|---------------------------|
| `sd_financial_confidence` | Confidence in financial data | Low confidence → **management_accounts**, **fractional_cfo** |
| `sd_numbers_action` | How often numbers change behavior | Rarely/Never → **management_accounts** |
| `sd_benchmark_awareness` | Know how you compare to peers | No → **benchmarking** |

#### Operational Freedom (3 questions)

| Question ID | Question Summary | Options → Service Mapping |
|------------|------------------|---------------------------|
| `sd_founder_dependency` | What if you disappeared for a month? | Chaos → **systems_audit**, **fractional_coo** |
| `sd_manual_work` | Time spent on manual work | >30% → **automation**, **systems_audit** |
| `sd_problem_awareness` | How quickly do you find out about issues? | Days/Blindsided → **systems_audit** |

#### Strategic Direction (3 questions)

| Question ID | Question Summary | Options → Service Mapping |
|------------|------------------|---------------------------|
| `sd_plan_clarity` | Clear 12-month plan? | No → **365_method** |
| `sd_accountability` | Who holds you accountable? | No one → **365_method**, **combined_advisory** |
| `sd_decision_partner` | Who do you discuss major decisions with? | No one → **combined_advisory**, **fractional_cfo** |

#### Growth Readiness (3 questions)

| Question ID | Question Summary | Options → Service Mapping |
|------------|------------------|---------------------------|
| `sd_growth_blocker` | Main growth blocker | Various → **multiple services** |
| `sd_double_revenue` | What breaks if revenue doubles? | Financial → **fractional_cfo**, Operations → **systems_audit** |
| `sd_operational_frustration` | Biggest operational frustration | Text analysis → **multiple services** |

#### Exit & Protection (3 questions)

| Question ID | Question Summary | Options → Service Mapping |
|------------|------------------|---------------------------|
| `sd_exit_readiness` | Can you produce docs in 48 hours? | Weeks/Months → **business_advisory** |
| `sd_valuation_clarity` | Know what business is worth? | No → **business_advisory** |
| `sd_exit_timeline` | Ideal exit timeline | 1-5 years → **business_advisory** |

---

## Service Lines

The platform offers 10 service lines, each with specific pricing tiers and use cases.

### 1. Destination Discovery
- **Code:** `discovery`
- **Name:** Destination Discovery
- **Description:** Initial discovery assessment to understand client goals and recommend services
- **Status:** Ready
- **Pricing:** Free (assessment only)

### 2. 365 Alignment Programme
- **Code:** `365_method`
- **Name:** 365 Alignment Programme
- **Description:** Life-first business transformation with 5-year vision, 6-month shift, and 12-week sprints
- **Status:** Ready
- **Pricing Tiers:**
  - Lite: £1,500/year
  - Growth: £4,500/year
  - Partner: £9,000/year
- **Monthly Revenue Target:** £5,000

### 3. Fractional CFO Services
- **Code:** `fractional_cfo`
- **Name:** Fractional CFO Services
- **Description:** Strategic financial leadership without the full-time cost
- **Status:** Ready
- **Pricing Tiers:**
  - 2 days/month: £4,000/month
- **Monthly Revenue Target:** £6,000

### 4. Systems Audit
- **Code:** `systems_audit`
- **Name:** Systems Audit
- **Description:** Identify and fix operational bottlenecks, integrate systems, eliminate manual workarounds
- **Status:** Ready
- **Pricing Tiers:**
  - Comprehensive: £4,000 (one-off)
- **Monthly Revenue Target:** £3,000

### 5. Management Accounts
- **Code:** `management_accounts`
- **Name:** Management Accounts
- **Description:** Monthly financial visibility with P&L, Balance Sheet, KPIs and Cash Flow analysis
- **Status:** Ready
- **Pricing Tiers:**
  - Monthly: £650/month
  - Quarterly: £1,750/quarter
- **Monthly Revenue Target:** £650

### 6. Combined CFO/COO Advisory
- **Code:** `combined_advisory`
- **Name:** Combined CFO/COO Advisory
- **Description:** Executive partnership covering both financial and operational strategy
- **Status:** Ready
- **Pricing:** £6,000-28,000/month
- **Monthly Revenue Target:** £10,000

### 7. Fractional COO Services
- **Code:** `fractional_coo`
- **Name:** Fractional COO Services
- **Description:** Operational leadership to build systems that run without you
- **Status:** Development
- **Pricing Tiers:**
  - 2 days/month: £3,750/month
- **Monthly Revenue Target:** £5,500

### 8. Business Advisory & Exit Planning
- **Code:** `business_advisory`
- **Name:** Business Advisory & Exit Planning
- **Description:** Protect and maximise the value you've built
- **Status:** Development
- **Pricing Tiers:**
  - Full Package: £4,000 (one-off)
- **Monthly Revenue Target:** £9,000

### 9. Automation Services
- **Code:** `automation`
- **Name:** Automation Services
- **Description:** Eliminate manual work and unlock your team's potential
- **Status:** Development
- **Pricing:**
  - Retainer: £1,500/month
  - Per hour: £115-180/hour
- **Monthly Revenue Target:** £1,500

### 10. Benchmarking Services
- **Code:** `benchmarking`
- **Name:** Benchmarking Services
- **Description:** External and internal benchmarking analysis
- **Status:** Development
- **Pricing:** £450-3,500 (one-off)
- **Monthly Revenue Target:** Variable

---

## Skills by Service Line

The platform tracks 85 skills organized into 9 categories, with each skill assigned to one or more service lines.

### Skills Summary by Service Line

| Service Line | Skill Count | Key Categories |
|-------------|-------------|----------------|
| **Automation** | 13 | Cloud Accounting & Automation, Process Automation |
| **Management Accounts** | 10 | Management Accounting & Reporting |
| **Advisory/Forecasting** | 12 | Advisory & Consulting, Tax Planning |
| **365 Alignment** | 2 | Advisory & Consulting, Communication & Soft Skills |
| **Systems Audit** | 5 | Advisory & Consulting, Process & Efficiency |
| **Client Vault** | 2 | Digital & AI Capabilities, Client Management |
| **Compliance** | 4 | Tax & Compliance (UK), Process & Efficiency |
| **Core Capability** | 37 | All categories (foundational skills) |

### Detailed Skills by Service Line

#### Automation (13 skills)

**Cloud Accounting & Automation (12 skills):**
1. Xero Advanced Features (Level 4)
2. QuickBooks Online Expertise (Level 3)
3. Sage Cloud Configuration (Level 3)
4. Bank Feed Integration (Level 4)
5. OCR & Data Capture (Level 3)
6. Chart of Accounts Design (Level 4)
7. Rule-Based Categorization (Level 3)
8. Xero to Spotlight/Syft (Level 3)
9. Dashboard Creation (Level 4)
10. Workflow Automation (Level 3)
11. API Integration Skills (Level 2)
12. Data Migration (Level 3)

**Process Automation (1 skill):**
13. Process Automation (RPA) (Level 2)

#### Management Accounts (10 skills)

**Management Accounting & Reporting (10 skills):**
1. Management Accounts Production (Level 4)
2. KPI Development & Tracking (Level 4)
3. Cash Flow Analysis (Level 4)
4. Spotlight Reporting (Level 3)
5. Variance Analysis (Level 4)
6. Working Capital Management (Level 3)
7. Financial Commentary Writing (Level 4)
8. Profitability Analysis (Level 3)
9. Graphical Data Presentation (Level 3)
10. Source & Application of Funds (Level 3)

#### Advisory/Forecasting (12 skills)

**Advisory & Consulting (9 skills):**
1. Financial Forecasting (Level 4)
2. Business Valuations (Level 3)
3. Cash Flow Forecasting (Level 4)
4. Scenario Modelling (Level 3)
5. Strategic Planning Facilitation (Level 3)
6. Benchmarking Analysis (Level 3)
7. Profit Extraction Strategies (Level 4)
8. Business Case Development (Level 3)
9. Growth Strategy Development (Level 3)
10. Succession Planning Advisory (Level 2)

**Tax & Compliance (3 skills):**
11. Personal Tax Planning (Level 3)
12. R&D Tax Credits (Level 3)
13. Dividend & Profit Extraction (Level 4)

#### 365 Alignment (2 skills)

**Advisory & Consulting (1 skill):**
1. 365 Alignment Methodology (Level 3)

**Communication & Soft Skills (2 skills):**
2. Emotional Intelligence (Level 4)
3. Empathy & Client Care (Level 4)

#### Systems Audit (5 skills)

**Advisory & Consulting (1 skill):**
1. Systems & Process Review (Level 3)

**Process & Efficiency (4 skills):**
2. Process Mapping (Level 3)
3. Internal Controls Assessment (Level 3)
4. Efficiency Analysis (Level 3)
5. Tech Stack Optimization (Level 3)

#### Client Vault (2 skills)

**Digital & AI Capabilities (1 skill):**
1. Digital Document Management (Level 3)

**Client Management & Development (1 skill):**
2. Client Portal Training (Level 3)

#### Compliance (4 skills)

**Tax & Compliance (UK) (3 skills):**
1. UK Corporation Tax (Level 4)
2. VAT Compliance & Planning (Level 4)
3. Companies House Filings (Level 4)
4. Making Tax Digital (MTD) (Level 4)
5. Payroll & PAYE (Level 3)

**Process & Efficiency (1 skill):**
6. Compliance Calendar Management (Level 3)

#### Core Capability (37 skills)

These are foundational skills required across all service lines:

**Digital & AI Capabilities (8 skills):**
- AI for Accounting Applications (Level 3)
- Excel Advanced Functions (Level 4)
- Power BI Fundamentals (Level 2)
- Data Analytics (Level 3)
- Cybersecurity Awareness (Level 3)
- Cloud Platform Management (Level 3)
- API & Webhook Configuration (Level 2)
- AI Prompt Engineering (Level 3)

**Client Management & Development (8 skills):**
- Client Onboarding Excellence (Level 4)
- Proactive Client Communication (Level 4)
- Meeting Facilitation (Level 4)
- Proposal Writing (Level 3)
- Fee Negotiation & Value Pricing (Level 3)
- Client Retention Strategies (Level 4)
- Complaint Resolution (Level 3)
- Referral Network Building (Level 3)

**Leadership & Team Skills (8 skills):**
- Team Coaching & Development (Level 3)
- Delegation & Task Management (Level 3)
- Performance Review Skills (Level 3)
- Project Management (Level 3)
- Quality Review & Control (Level 4)
- Training Delivery (Level 3)
- Resource Planning (Level 3)
- Innovation & Change Leadership (Level 3)

**Communication & Soft Skills (8 skills):**
- Business Writing (Level 4)
- Presentation Design & Delivery (Level 3)
- Active Listening (Level 4)
- Complex Problem Solving (Level 4)
- Commercial Awareness (Level 4)
- Time Management (Level 4)
- Adaptability & Learning Agility (Level 4)
- Professional Skepticism (Level 3)

**Advisory & Consulting (1 skill):**
- Cross-Selling Advisory Services (Level 3)

---

## Assessment-to-Service Line Tagging

The system uses a scoring weight matrix (`service_scoring_weights` table) to map assessment responses to service recommendations. Each question-response combination can trigger multiple service recommendations with different weight scores.

### Scoring Weight Categories

1. **Investment Readiness** - Capital raising signals
2. **Founder Dependency** - Operational bottlenecks
3. **Lifestyle/Burnout** - Work-life balance indicators
4. **Success Definition** - Client's definition of success
5. **Exit Planning** - Exit timeline and readiness

### Key Tagging Rules

#### Investment Readiness Weights

| Question | Response | Service | Weight | Category |
|----------|----------|---------|--------|----------|
| `sd_growth_blocker` | "Don't have the capital" | fractional_cfo | 50 | investment_readiness |
| `sd_growth_blocker` | "Don't have the capital" | business_advisory | 40 | investment_readiness |
| `sd_growth_blocker` | "Don't have the capital" | management_accounts | 30 | investment_readiness |
| `sd_exit_readiness` | "Yes - we're investment-ready" | fractional_cfo | 40 | investment_readiness |
| `sd_valuation_clarity` | "Yes - I've had a professional valuation" | fractional_cfo | 30 | investment_readiness |

#### Founder Dependency Weights

| Question | Response | Service | Weight | Category |
|----------|----------|---------|--------|----------|
| `sd_founder_dependency` | "Chaos - I'm essential to everything" | systems_audit | 60 | founder_dependency |
| `sd_founder_dependency` | "Chaos - I'm essential to everything" | fractional_coo | 50 | founder_dependency |
| `sd_founder_dependency` | "Chaos - I'm essential to everything" | 365_method | 40 | founder_dependency |
| `dd_key_person_risk` | "Disaster - the business would struggle badly" | systems_audit | 50 | founder_dependency |
| `dd_delegation_honest` | "Terrible - I end up doing everything myself" | 365_method | 50 | founder_dependency |

#### Lifestyle/Burnout Weights

| Question | Response | Service | Weight | Category |
|----------|----------|---------|--------|----------|
| `dd_owner_hours` | "60-70 hours" | 365_method | 40 | lifestyle |
| `dd_owner_hours` | "70+ hours" | 365_method | 50 | lifestyle |
| `dd_holiday_reality` | "I've never done that" | 365_method | 45 | lifestyle |
| `dd_external_view` | "They'd say I'm married to my business" | 365_method | 55 | lifestyle |
| `dd_time_breakdown` | "90% firefighting / 10% strategic" | 365_method | 45 | lifestyle |
| `dd_priority_focus` | "Getting my time and energy back" | 365_method | 55 | lifestyle |

#### Success Definition Weights

| Question | Response | Service | Weight | Category |
|----------|----------|---------|--------|----------|
| `dd_success_definition` | "Creating a business that runs profitably without me" | systems_audit | 50 | success_definition |
| `dd_success_definition` | "Building something I can sell for a life-changing amount" | business_advisory | 55 | success_definition |
| `dd_success_definition` | "Building a legacy that outlasts me" | 365_method | 45 | success_definition |
| `dd_success_definition` | "Having complete control over my time and income" | 365_method | 50 | success_definition |

#### Exit Planning Weights

| Question | Response | Service | Weight | Category |
|----------|----------|---------|--------|----------|
| `sd_exit_timeline` | "Already exploring options" | business_advisory | 60 | exit_planning |
| `sd_exit_timeline` | "1-3 years - actively preparing" | business_advisory | 55 | exit_planning |
| `sd_exit_timeline` | "3-5 years - need to start thinking" | business_advisory | 45 | exit_planning |
| `sd_exit_timeline` | "Build to sell even if I never do" | business_advisory | 40 | exit_planning |

### Special Detection Logic

#### Capital Raising Detection

Triggers when ANY of these are true:
- `sd_growth_blocker` = "Don't have the capital"
- `dd_if_i_knew` contains "capital", "raise", "investors", "funding"
- `sd_exit_readiness` = "Yes - we're investment-ready"
- `sd_valuation_clarity` = "Yes - I've had a professional valuation"

**Impact:** Boosts `fractional_cfo`, `management_accounts`, `business_advisory` scores by 1.5x

#### Burnout Detection

Triggers when ANY of these are true:
- `dd_owner_hours` = "60-70 hours" or "70+ hours"
- `dd_holiday_reality` = "More than 2 years ago" or "I've never done that"
- `dd_external_view` = "It's a significant source of tension" or "married to my business"

**Impact:** Boosts `fractional_coo`, `365_method` scores by 1.4x

#### Lifestyle Transformation Detection

Triggers when:
- `dd_five_year_picture` describes fundamentally different role (investor, board, advisor)
- `dd_success_definition` = "Creating a business that runs profitably without me"
- Contains mentions of "investment CEOs", "portfolio", "step back"

**Impact:** Emphasizes identity transition in analysis, boosts `365_method`, `fractional_coo`

---

## System Architecture

### 2-Stage Edge Function Pipeline

The system uses a 2-stage architecture to work within Supabase Edge Function 60-second timeout limits:

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
                      ▼                   ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│  STAGE 1 (~15-20 seconds)   │  │  STAGE 2 (~40-50 seconds)   │
│  prepare-discovery-data     │──│  generate-discovery-analysis│
│                             │  │                             │
│  • Fetch client info        │  │  • Build analysis prompt    │
│  • Fetch discovery data     │  │  • Call Claude Sonnet 4     │
│  • Fetch documents          │  │  • Parse JSON response      │
│  • Fetch financial context  │  │  • Save report to DB        │
│  • Run pattern detection    │  │  • Return analysis          │
│  • Return prepared package  │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

### Database Tables

| Table | Purpose |
|-------|---------|
| `practice_members` | Client and team member information |
| `destination_discovery` | Assessment responses (Part 1 & 2) |
| `assessment_patterns` | AI-generated pattern analysis |
| `service_scoring_weights` | Question → Service scoring rules |
| `service_lines` | Service line definitions |
| `client_service_lines` | Client enrollments in services |
| `service_line_assessments` | Service-specific onboarding assessments |
| `skills` | Team skills matrix (85 skills) |
| `client_reports` | Generated analysis reports |
| `document_embeddings` | Uploaded client documents |
| `client_context` | Additional client context |
| `client_financial_context` | Known financial data |
| `client_operational_context` | Operational data |

### Key Relationships

```
destination_discovery (assessment)
    ↓
assessment_patterns (AI analysis)
    ↓
service_scoring_weights (mapping rules)
    ↓
service_lines (available services)
    ↓
client_service_lines (enrollments)
    ↓
service_line_assessments (onboarding)
```

```
skills (85 skills)
    ↓
service_line (assignment)
    ↓
service_lines (delivery requirements)
```

---

## Summary Statistics

- **Total Assessment Questions:** 40 (25 Part 1 + 15 Part 2)
- **Service Lines:** 10 (6 Ready, 4 Development)
- **Total Skills:** 85 (across 9 categories)
- **Scoring Weight Categories:** 5
- **Special Detection Patterns:** 3 (Capital Raising, Burnout, Lifestyle Transformation)

---

*Document generated: December 2025*  
*For questions or updates, refer to the main system documentation in `DISCOVERY_ASSESSMENT_SYSTEM.md`*


