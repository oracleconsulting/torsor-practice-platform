# COMPREHENSIVE TORSOR SYSTEM ANALYSIS
## Complete Architecture, Assessment Data, and Go-To-Market Readiness Report

**Generated:** November 17, 2025  
**Codebase Size:** 290,000+ lines  
**Status:** Production Deployment Active  
**Purpose:** Deep analysis for market positioning and system optimization

---

## EXECUTIVE SUMMARY

Torsor is a comprehensive practice management platform for accountancy firms that combines:
1. **Team Management** - Skills assessment, CPD tracking, and development planning
2. **Client Management** - CRM, document vault, and client intake
3. **Advisory Services** - AI-powered workflows for forecasting, valuation, benchmarking
4. **365 Alignment Programme** - Integration with Oracle Method for client strategic planning
5. **Assessment & Analytics** - 8 psychometric assessments + AI-powered insights

**Current Challenge:** 290k lines of code with potential redundancy and architectural improvements needed for market launch.

---

# PART 1: SYSTEM ARCHITECTURE

## 1.1 PLATFORM OVERVIEW

### Core Purpose
Torsor solves three critical problems for accounting practices:
1. **Inconsistent advisory service delivery** - Automates repeatable processes with AI
2. **Fragmented team development** - Centralizes skills assessment and CPD tracking
3. **Manual client management** - Streamlines intake, documentation, and strategic planning

### Technology Stack
- **Frontend:** React 18 + TypeScript + Vite
- **UI Library:** shadcn/ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **AI Integration:** OpenRouter (Claude Opus 4, GPT-4 Turbo, Perplexity)
- **Deployment:** Railway (current)
- **File Count:** 799 TypeScript/TSX files

---

## 1.2 DATABASE ARCHITECTURE

### Core Tables (20+ main entities)

#### **Practice & Team Management**
```sql
practices (id, name, logo, settings)
├── practice_members (id, email, name, role, seniority_level)
│   ├── skill_assessments (self_rating, current_level, target_level)
│   ├── cpd_activities (hours, type, status, verification)
│   ├── personality_assessments (OCEAN scores, facets)
│   ├── belbin_assessments (team roles, preferences)
│   ├── eq_assessments (self_awareness, social_awareness, empathy)
│   ├── motivational_drivers (achievement, affiliation, power)
│   ├── conflict_style_assessments (competing, collaborating, compromising)
│   ├── working_preferences (environment, communication, work_style)
│   ├── learning_preferences (VARK: visual, auditory, reading, kinesthetic)
│   └── individual_profiles (strengths, development_areas, training_priorities)
│
├── role_definitions (responsibilities, competencies, assessment_weights)
├── role_assignments (member_id, role_definition_id, fit_score)
├── mentoring_relationships (mentor, mentee, status, goals)
├── team_skill_requirements (service_line, required_skills)
└── reporting_lines (reports_to, relationship_type)
```

#### **Client Management**
```sql
clients (id, name, status, industry)
├── client_intake (part1: demographics, pain_points)
├── client_intake_part2 (part2: goals, vision, values)
├── client_config (Oracle Method 365 settings)
├── sprint_progress (5yr vision, 6mo shifts, 3mo sprints)
├── client_documents (vault storage)
└── client_tickets (support, requests)
```

#### **Advisory Services & Workflows**
```sql
service_lines (name, description, category)
├── service_line_interests (member preferences)
├── service_line_analytics (capacity, demand, profitability)
├── workflow_templates (forecasting, valuation, benchmarking)
├── workflow_executions (status, llm_calls, cost)
├── workflow_steps (type, llm_config, dependencies)
└── llm_execution_history (prompts, responses, tokens, cost)
```

#### **Assessment & Analytics**
```sql
assessment_insights (role_fit, development_priorities, red_flags)
team_composition_insights (dynamics, compatibility, gaps)
strategic_insights (recommendations, training_priorities)
performance_metrics (billable_hours, client_satisfaction)
risk_scores (retention_risk, burnout_risk, flight_risk)
```

#### **Gamification & Engagement**
```sql
achievements (unlocked_at, points_earned)
leaderboards (category, timeframe, rankings)
gamification_milestones (triggers, rewards)
```

---

## 1.3 FEATURE MAP

### A. USER ROLES & PERMISSIONS

#### **1. Team Member (Standard User)**
**Access:** Own data + read-only team info
- Complete 8 assessments (OCEAN, Belbin, EQ, VARK, Working Prefs, Conflict, Motivational, Skills)
- Log CPD activities
- View own dashboard and development plan
- Access AI Skills Coach
- Request mentorship
- Earn achievements and badges

#### **2. Mentor**
**Access:** Team Member + assigned mentee data
- View mentee profiles and assessments
- Schedule mentoring sessions
- Track mentoring goals
- Provide session feedback

#### **3. Team Manager**
**Access:** Full team read + limited admin
- View all team skills and assessments
- Access team analytics dashboard
- Review skills gap analysis
- Approve CPD activities
- Assign mentors
- Generate team reports

#### **4. Administrator**
**Access:** Full system
- All manager capabilities
- Create/edit/delete users
- Modify skill categories
- Configure system settings
- Manage gamification rules
- Configure AI settings
- Export all data

### B. CORE FEATURE MODULES

#### **Module 1: Dashboard & Practice Health**
- Real-time practice metrics
- Team capacity overview
- Client health scores
- Revenue tracking
- CPD compliance rates
- Skill gap heat maps

#### **Module 2: Team Management**
- Member profiles with 8 assessments
- Skills matrix and heat map
- Seniority levels (Foundation → Expert → Master)
- Role definitions and role-fit scoring
- Individual development profiles
- Team composition analysis
- Mentoring hub
- Gamification leaderboards

#### **Module 3: Client Management**
- Client CRM with status tracking
- Two-part intake assessment
- Document vault with categorization
- Client tickets and support
- 365 Alignment Programme integration
- Real-time sprint progress tracking

#### **Module 4: Advisory Services**
- AI-powered workflow builder
- Pre-built templates:
  - Financial Forecasting (3-Statement Model)
  - Business Valuation (DCF, Comparable Analysis)
  - Benchmarking Analysis
  - Strategic Planning
  - Cash Flow Optimization
- LLM integration (Claude, GPT-4, Perplexity)
- Cost tracking and execution history
- Client-specific workflow customization

#### **Module 5: CPD System**
- Activity logging with categories
- Auto-discovery from Perplexity (AI-powered)
- Hours tracking and verification
- Compliance reporting
- External resource linking
- Certificate storage
- Development plan integration

#### **Module 6: 365 Alignment Programme**
- Live connection to Oracle Method Portal
- View client 5-year vision
- Track 6-month shifts
- Monitor 3-month sprint tasks
- Bi-directional task updates
- Real-time Supabase subscriptions
- Vision workflow with transcript upload
- AI-powered vision refinement

#### **Module 7: AI Features**
- **AI Skills Coach:** Personalized development recommendations
- **Gap Analysis:** Team-wide skill deficiency identification
- **Team Composition Analysis:** Compatibility and friction prediction
- **Training Narrative Generation:** Auto-generated training plans
- **Vision Refinement:** LLM-assisted strategic planning
- **CPD Discovery:** Auto-suggest relevant courses

#### **Module 8: Analytics & Insights**
- Team Assessment Insights (8 tabs):
  1. Role-Fit Analysis
  2. Individual Profiles
  3. Team Composition
  4. Strategic Insights
  5. Skills Dashboard
  6. Skills Heatmap
  7. Development Gaps (AI-powered)
  8. Role Definitions
- Service line analytics
- Performance correlation
- Retention risk scoring
- Cross-assessment insights

---

## 1.4 AI/LLM INTEGRATION POINTS

### A. AI Prompts System
**Table:** `ai_prompts`
**Categories:** `analysis`, `knowledge_comparison`, `letter_generation`

**Active Prompts:**
1. **Team Composition Analysis**
   - Model: GPT-4 Turbo
   - Inputs: OCEAN, Belbin, EQ, VARK, Working Prefs, Conflict Styles, Motivational Drivers, Skills
   - Outputs: Dynamics assessment, natural collaborators, friction points, gaps

2. **Gap Analysis Insights**
   - Model: GPT-4 Turbo
   - Inputs: Skill gaps, Belbin gaps, EQ, motivational drivers, service line coverage
   - Outputs: Critical gaps, impact analysis, training priorities, restructuring needs

3. **Individual Profile Generation**
   - Model: Claude Opus 4
   - Inputs: All 8 assessments + skills data
   - Outputs: Strengths, development areas, training priorities, career trajectory

4. **Vision Refinement**
   - Model: Claude Opus 4
   - Inputs: Client intake assessments, call transcripts
   - Outputs: 5-year vision, north star, year milestones

5. **CPD Discovery**
   - Model: Perplexity (Sonar Pro)
   - Inputs: Skill gaps, current level, seniority
   - Outputs: Curated courses, resources, certifications

### B. LLM Execution Tracking
**Table:** `llm_execution_history`
- Prompt used
- Response received
- Tokens consumed
- Cost per call
- Execution time
- Model used
- Associated workflow/entity

**Current Cost Tracking:**
- Average cost per advisory workflow: £2-5
- Average cost per CPD discovery: £0.10
- Average cost per team analysis: £0.50

---

## 1.5 DATA FLOW ARCHITECTURE

### User Authentication Flow
```
1. User → Supabase Auth (email/password)
2. Auth → RLS policies (row-level security)
3. RLS → practice_members lookup
4. practice_members → role-based permissions
5. Permissions → UI component rendering
```

### Assessment Flow
```
1. User completes assessment (UI form)
2. Data → Supabase table (personality_assessments, eq_assessments, etc.)
3. Trigger → individual_profiles recalculation
4. AI Service → Generate profile insights
5. Cache → assessment_insights table (24hr TTL)
6. Display → TeamAssessmentInsights component
```

### Advisory Workflow Flow
```
1. User selects workflow template
2. Template → workflow_executions (new instance)
3. Execution Engine → Process steps sequentially
4. LLM Steps → OpenRouter API call
5. Response → Store in llm_execution_history
6. Result → Display to user + save to client folder
7. Cost → Track in workflow_executions
```

### 365 Alignment Flow
```
1. Client completes assessment (Oracle Method Portal)
2. Data → Supabase (client_intake, client_intake_part2)
3. Accountant → Generate Vision (TORSOR)
4. Vision → Store in client_config
5. Accountant → Upload call transcript
6. Transcript → AI refinement suggestions
7. Finalize → Generate full roadmap (Oracle API)
8. Roadmap → Visible in Oracle Method Portal (real-time)
9. Client updates tasks → Supabase subscription → TORSOR live update
```

---

## 1.6 INTEGRATION POINTS

### External Integrations

**1. Oracle Method Portal**
- **Type:** Bi-directional Supabase connection
- **Purpose:** 365 Alignment Programme
- **Data Shared:**
  - Client intake assessments
  - 5-year visions
  - Sprint progress
  - Task updates
- **Real-time:** Yes (Supabase subscriptions)

**2. OpenRouter**
- **Type:** REST API
- **Models:** Claude Opus 4, GPT-4 Turbo, GPT-3.5 Turbo, Perplexity Sonar Pro
- **Purpose:** All AI/LLM features
- **Cost Tracking:** Per-call basis in llm_execution_history

**3. Supabase Storage**
- **Purpose:** Document vault, certificates, transcripts
- **Buckets:**
  - `client-documents`
  - `cpd-certificates`
  - `alignment-transcripts`
  - `profile-images`

**4. Resend (Email)**
- **Purpose:** User invitations, notifications
- **Status:** Configured but needs production verification

**5. Calendly (Planned)**
- **Purpose:** Schedule alignment calls
- **Status:** Integration exists but not fully deployed

---

# PART 2: ASSESSMENT SYSTEM DEEP DIVE

## 2.1 THE 8 ASSESSMENTS

### 1. OCEAN Personality Assessment (Big Five)
**Table:** `personality_assessments`
**Metrics:**
- Openness (0-100)
- Conscientiousness (0-100)
- Extraversion (0-100)
- Agreeableness (0-100)
- Neuroticism (0-100) / Emotional Stability

**Derived Insights:**
- Dominant traits (top 2)
- Work style classification
- Communication style
- Stress response pattern

**Uses:**
- Role-fit scoring (advisory vs technical)
- Team composition analysis
- Training style recommendations
- Leadership readiness prediction

---

### 2. Belbin Team Roles
**Table:** `belbin_assessments`
**9 Roles Measured:**
- Plant (Creative thinker)
- Resource Investigator (Networker)
- Coordinator (Leader)
- Shaper (Driver)
- Monitor Evaluator (Analyst)
- Teamworker (Collaborator)
- Implementer (Executor)
- Completer Finisher (Perfectionist)
- Specialist (Expert)

**Scoring:** Primary, secondary, and tertiary roles

**Uses:**
- Team balance analysis
- Project team assembly
- Gap identification (e.g., "no Shapers on team")
- Conflict prediction
- Collaboration recommendations

---

### 3. Emotional Intelligence (EQ)
**Table:** `eq_assessments`
**5 Components:**
- Self-Awareness (0-100)
- Self-Regulation (0-100)
- Motivation (0-100)
- Empathy (0-100)
- Social Skills (0-100)
- **Overall EQ:** Average of 5

**Uses:**
- Advisory role suitability (high EQ required)
- Leadership readiness
- Client-facing capability
- Mentoring potential
- Red flag detection (low EQ with high client exposure)

---

### 4. VARK Learning Styles
**Table:** `learning_preferences`
**4 Modalities:**
- Visual (percentage)
- Auditory (percentage)
- Reading/Writing (percentage)
- Kinesthetic (percentage)

**Classification:**
- Unimodal (one dominant)
- Bimodal (two strong)
- Multimodal (3+ strong)

**Uses:**
- CPD training format recommendations
- Mentoring approach customization
- Onboarding process optimization
- Team training session design

---

### 5. Working Preferences
**Table:** `working_preferences`
**Dimensions:**
- Environment (office, remote, hybrid)
- Work hours (early bird, night owl, flexible)
- Collaboration style (solo, pair, team)
- Communication preference (written, verbal, visual)
- Decision-making style (analytical, intuitive, collaborative)

**Uses:**
- Team composition (e.g., remote workers with async communicators)
- Office layout planning
- Meeting schedule optimization
- Role assignment (e.g., solo workers for deep technical work)

---

### 6. Conflict Style Assessment
**Table:** `conflict_style_assessments`
**5 Thomas-Kilmann Modes:**
- Competing (assertive, uncooperative)
- Collaborating (assertive, cooperative)
- Compromising (moderate)
- Avoiding (unassertive, uncooperative)
- Accommodating (unassertive, cooperative)

**Primary + Secondary styles tracked**

**Uses:**
- Friction point prediction
- Team pairing optimization
- Mediation strategy selection
- Leadership development focus

---

### 7. Motivational Drivers
**Table:** `motivational_drivers`
**6 McClelland Drivers:**
- Achievement (score 0-100)
- Affiliation (score 0-100)
- Power/Influence (score 0-100)
- Autonomy (score 0-100)
- Security (score 0-100)
- Recognition (score 0-100)

**Dominant driver:** Highest score

**Uses:**
- Retention risk scoring (e.g., high autonomy + micro-management = flight risk)
- Reward system design
- Career path recommendations
- Performance management approach

---

### 8. Skills Assessment (Self + Target)
**Table:** `skill_assessments`
**Structure:**
- 100+ accounting skills across categories:
  - Compliance
  - Advisory
  - Technical
  - Software
  - Soft Skills
  - Industry-specific

**Scoring:**
- Self-rating (1-5)
- Current level (1-5, verified by manager)
- Target level (1-5, career goal)
- Gap = Target - Current

**Seniority Levels:**
1. Foundation (0-2 years)
2. Competent (2-4 years)
3. Proficient (4-7 years)
4. Expert (7-12 years)
5. Master (12+ years)

**Uses:**
- Skills matrix visualization
- Heat map of team capabilities
- CPD priority determination
- Service line capacity planning
- Role-fit scoring
- Training plan generation

---

## 2.2 ASSESSMENT INTEGRATION & INSIGHTS

### Individual Profile Calculation
**Function:** `calculateIndividualProfile()`
**Inputs:** ALL 8 assessments + skills data
**Outputs:**

1. **Strengths (Top 5)**
   - Derived from high OCEAN scores + high skill levels + primary Belbin roles
   - Example: "Strategic Thinking (Openness 85, Advisory skills 4.2)"

2. **Development Areas (Top 5)**
   - Derived from low OCEAN scores + skill gaps + warning flags
   - Example: "Client Relationship Building (Agreeableness 45, EQ Social 55)"

3. **Training Priorities (Top 3)**
   - Skill gaps weighted by:
     - Current vs Target level difference
     - Importance to role
     - Service line demand
   - Example: "Cash Flow Forecasting (Gap: 2, Priority: High, Timeline: 3-6mo)"

4. **Career Trajectory**
   - Current role fit percentage
   - Recommended next role
   - Timeline to readiness
   - Development focus areas

5. **Recommended Roles (Top 3)**
   - Role-fit scoring algorithm:
     ```
     advisory_score = (
       EQ * 0.3 +
       Agreeableness * 0.2 +
       Extraversion * 0.15 +
       Advisory_skills * 0.35
     )
     
     technical_score = (
       Conscientiousness * 0.25 +
       Technical_skills * 0.40 +
       Openness * 0.15 +
       (100 - Neuroticism) * 0.20
     )
     
     leadership_score = (
       EQ * 0.30 +
       Extraversion * 0.20 +
       Belbin_Coordinator * 0.15 +
       Years_experience * 0.20 +
       Motivational_Power * 0.15
     )
     ```

---

### Team Composition Analysis
**Function:** `generateTeamCompositionAnalysis()`
**Inputs:**
- All team members' 8 assessments
- Current project teams
- Service line requirements

**Outputs:**

1. **Overall Dynamics Assessment**
   - Team personality balance (OCEAN distribution)
   - Belbin role coverage and gaps
   - Communication style compatibility
   - Conflict style friction prediction

2. **Natural Collaborators**
   - High compatibility pairs/groups based on:
     - Similar working preferences
     - Complementary Belbin roles
     - Compatible conflict styles
     - Aligned motivational drivers
   - Example: "Laura (Coordinator + High EQ) ↔ Andy (Implementer + Detail-oriented)"

3. **Potential Friction Points**
   - Low compatibility warnings based on:
     - Conflicting work styles
     - Competing Belbin roles
     - Incompatible conflict styles
     - Opposing motivational drivers
   - Example: "Tom (Shaper + Competing conflict) ↔ Sarah (Teamworker + Accommodating conflict)"

4. **Team Coverage Gaps**
   - Missing Belbin roles
   - Under-represented OCEAN traits
   - Skill coverage deficiencies
   - Example: "No Shapers (drivers) - team may struggle with tight deadlines"

5. **Optimal Project Team Configurations**
   - Recommended team assembly for different service types:
     - Advisory projects: High EQ + Coordinators + Resource Investigators
     - Technical projects: High Conscientiousness + Implementers + Specialists
     - Strategic projects: High Openness + Plants + Monitor Evaluators

6. **Team-Building Recommendations**
   - Activities to improve dynamics
   - Training to fill gaps
   - Structural changes (e.g., add senior Shaper)

7. **Leadership Distribution**
   - Leadership readiness scores
   - Succession planning
   - Mentoring pairings

---

### Gap Analysis
**Function:** `generateGapAnalysisInsights()`
**Inputs:**
- Team skills vs service line requirements
- Belbin role distribution vs ideal
- Current service mix vs capability

**Outputs:**

1. **Critical Skill Gaps (Top 5)**
   - Skill: "Cash Flow Forecasting"
   - Current team avg: 2.1/5
   - Required level: 4/5
   - Impact: "Cannot deliver Advisory Growth service"
   - Members affected: 12/15

2. **Belbin Role Gaps**
   - Missing: Shaper (0), Resource Investigator (1)
   - Over-represented: Specialist (6), Implementer (5)
   - Impact: "Struggles with innovation and external networking"

3. **Service Line Coverage**
   - Advisory: 60% capacity (need 2 more senior advisors)
   - Compliance: 120% capacity (overstaffed)
   - Forecasting: 40% capacity (critical gap)

4. **Training Priorities (Ranked)**
   - Priority 1: Cash Flow Forecasting (12 members, 6 months)
   - Priority 2: Business Valuation (8 members, 9 months)
   - Priority 3: Client Relationship Building (10 members, 3 months)

5. **Restructuring Recommendations**
   - Hire: Senior Advisory Consultant (Shaper + High EQ)
   - Develop: 3 mid-level to senior via training + mentoring
   - Redeploy: 2 Compliance Specialists to Advisory Support

6. **Quick Wins vs Long-Term**
   - Quick (3mo): EQ training for client-facing roles
   - Medium (6mo): Forecasting certification program
   - Long (12mo): Build Advisory Centre of Excellence

7. **Resource Requirements**
   - Budget: £50k-70k (training, external coaches)
   - Time: 20% capacity for development activities
   - External: 1-2 strategic hires

---

## 2.3 RED FLAGS & ALERTS SYSTEM

### Automatic Detection
**Table:** `assessment_insights.red_flags`

**Red Flag Categories:**

1. **Role Misalignment**
   - High client-facing role + Low EQ (<50)
   - Advisory role + Low Openness (<40)
   - Leadership role + Low Extraversion (<35) + Low EQ (<50)

2. **Retention Risk**
   - High Autonomy driver + Micro-management working preference
   - High Achievement driver + Limited growth opportunities
   - High Recognition driver + No recent achievements/promotions

3. **Burnout Risk**
   - High Neuroticism (>70) + High workload
   - Low Self-Regulation (<40) + High-stress role
   - Avoiding conflict style + High-conflict team

4. **Team Friction**
   - Competing conflict style + Competing conflict style (pair)
   - High Agreeableness + Micro-manager reporting line
   - Solo work preference + Team-intensive role

5. **Development Plateau**
   - Skill level unchanged >12 months
   - No CPD activities >6 months
   - Target level = Current level (no ambition set)

**Alert Severity:**
- **Critical:** Immediate action required (risk of resignation, burnout)
- **High:** Action within 1 month
- **Medium:** Monitor and plan intervention
- **Low:** Awareness only

---

# PART 3: INDIVIDUAL ASSESSMENT DATA

**I need to query the database to get all team members and their assessment data. Let me create a comprehensive SQL query:**


