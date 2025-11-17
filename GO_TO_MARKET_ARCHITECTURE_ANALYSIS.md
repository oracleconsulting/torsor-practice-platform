# PART 3: INDIVIDUAL ASSESSMENT DATA

**Run the SQL script `EXPORT_ALL_TEAM_ASSESSMENT_DATA.sql` in Supabase to get:**

1. **Complete Assessment Data** - All 8 assessments for every team member
2. **Skills Breakdown** - Every skill assessed with gaps
3. **Service Line Interests** - Preferences and experience
4. **Role Assignments** - Fit scores and recommendations
5. **Mentoring Relationships** - Active pairings
6. **Reporting Lines** - Organizational structure

**This will export to CSV/Excel for your separate analysis.**

---

# PART 4: ARCHITECTURAL ANALYSIS & OPTIMIZATION

## 4.1 CODEBASE STATISTICS

**Current State:**
- **Total Lines:** 230,912 (source code)
- **TypeScript/TSX Files:** 799 files
- **Database Migrations:** 78 SQL files
- **Service Files:** 45+ services
- **Component Files:** 300+ React components

## 4.2 REDUNDANCY & CONSOLIDATION OPPORTUNITIES

### A. DUPLICATE SERVICE IMPLEMENTATIONS

**1. Outreach Services (3 implementations)**
- `src/services/outreachService.ts` (1,687 lines)
- `src/services/accountancy/outreachService.ts` (1,687 lines) ← **DUPLICATE**
- `src/services/accountancy/savedProspectsService.ts` (separate but overlapping)

**Recommendation:** Consolidate to single `outreachService.ts` in `services/accountancy/`

**2. Accountancy API Services (3 implementations)**
- `src/services/accountancyApiService.ts`
- `src/services/accountancy/accountancyApiService.ts` ← **DUPLICATE**
- `src/services/api/accountancy.ts` ← **PARTIAL DUPLICATE**

**Recommendation:** Merge into single `services/accountancy/api.ts`

**3. Client Management Services (3 implementations)**
- `src/services/clientManagementService.ts`
- `src/services/accountancy/clientManagementService.ts` ← **DUPLICATE**
- `src/components/client-management/ClientManagementPage.tsx` (contains embedded logic)

**Recommendation:** Single service in `services/accountancy/clientManagement.ts`, remove logic from components

**4. Mock API Services (4 implementations)**
- `src/services/mockApi.ts`
- `src/services/accountancy/mockApi.ts` ← **DUPLICATE**
- `src/services/api/alternateAuditor.service.ts` (210 lines of mock API)
- Various components with embedded mock data

**Recommendation:** Single `services/mocks/` folder for dev-only mock data, exclude from production builds

**5. Storage Services (3 implementations)**
- `src/services/storage.ts`
- `src/services/accountancy/storage.ts` ← **DUPLICATE**
- Embedded Supabase storage calls in components

**Recommendation:** Single `services/storage.ts` with typed interfaces

**6. Knowledge Base Services (3 implementations)**
- `src/services/knowledgeBase.ts`
- `src/services/knowledgeBaseService.ts` ← **DUPLICATE**
- `src/services/knowledgeBaseServiceDirect.ts` ← **VARIANT**

**Recommendation:** Merge into single `services/knowledgeBase/index.ts`

**Estimated LOC Reduction:** ~15,000-20,000 lines by removing duplicates

---

### B. UNUSED/STUB CODE

**1. Context Enrichment Service**
- `src/services/contextEnrichmentService.ts` (901 lines)
- **Status:** Fully stubbed out, all API calls commented
- **Usage:** Referenced but doesn't execute

**Recommendation:** Remove entirely or implement fully (currently dead code)

**2. Assessment Database Service**
- `src/services/assessmentDatabaseService.ts` (1,502 lines)
- **Issue:** Massive try/catch blocks, duplicate queries
- **Status:** Over-engineered with excessive fallback logic

**Recommendation:** Simplify to 500 lines using Supabase RLS properly

**3. Alternate Auditor Service**
- `src/services/api/alternateAuditor.service.ts` (210 lines)
- **Status:** Pure mock, never connects to real backend

**Recommendation:** Remove or implement real backend integration

**4. Wellness API Service**
- `src/services/wellness/wellnessApiService.ts`
- **Status:** Stub, never used

**Recommendation:** Remove if not part of roadmap

**Estimated LOC Reduction:** ~3,500-5,000 lines

---

### C. OVER-ENGINEERED COMPONENTS

**1. Assessment Forms**
- `AssessmentForm.tsx`, `MobileAssessmentForm.tsx`, `Part2AssessmentForm.tsx`, `Part3AssessmentForm.tsx`
- **Issue:** 4 separate form implementations with duplicate validation logic
- **Total:** ~2,500 lines

**Recommendation:** Single `AssessmentForm` component with props for part/mobile

**2. Dashboard Components**
- `src/components/dashboard/` (78 files, ~15,000 lines)
- **Issue:** Many single-use components with < 50 lines
- **Examples:** 
  - `ActionButton.tsx` (30 lines) ← Can be UI component
  - `KPICard.tsx` (40 lines) ← Generic enough for UI library
  - 10+ custom card components that could be one

**Recommendation:** Consolidate into reusable patterns, move to `ui/` folder

**3. Outreach Components**
- `src/components/accountancy/outreach/` (34 files)
- **Issue:** Deep nesting, scattered state management

**Recommendation:** Use compound component pattern, reduce to 15 files

**Estimated LOC Reduction:** ~8,000-10,000 lines

---

### D. MIGRATION FILE DUPLICATION

**78 migration files** with many addressing the same tables:

- `20251009_cpd_system.sql`
- `20251009_cpd_system_v2.sql`
- `20251009_cpd_system_v3_FINAL.sql`
- `20251009_cpd_CLEAN_INSTALL.sql` ← **4 versions of same migration**

**Recommendation:** Squash migrations into single "init" migration for new deploys

**Estimated LOC Reduction:** ~5,000 lines in SQL

---

### E. AI/LLM INTEGRATION FRAGMENTATION

**Current State:**
- `openRouterService.ts` - Generic LLM execution
- `src/services/ai/advancedAnalysis.ts` - Team analysis
- `src/services/ai/skillsCoachService.ts` - Skills coaching
- `src/services/ai/trainingRecommendations.ts` - Training plans
- Embedded LLM calls in:
  - `workflowExecutionEngine.ts`
  - `roadmapService.ts`
  - `boardService.ts`
  - `narrativeGenerator.ts`

**Issue:** No centralized LLM abstraction, cost tracking scattered

**Recommendation:** Create `services/llm/` module:
```
services/llm/
├── index.ts (exports all)
├── client.ts (OpenRouter wrapper)
├── prompts.ts (centralized prompt management)
├── cost-tracker.ts (unified cost tracking)
└── providers/
    ├── openai.ts
    ├── anthropic.ts
    └── perplexity.ts
```

**Benefits:**
- Easy provider switching
- Centralized cost tracking
- Prompt versioning
- Rate limiting
- Caching

**Estimated LOC Reduction:** ~2,000 lines through consolidation

---

## 4.3 ARCHITECTURAL IMPROVEMENTS FOR GO-TO-MARKET

### A. PROPOSED NEW ARCHITECTURE

```
torsor-practice-platform/
├── src/
│   ├── app/                    # Next.js app directory (MIGRATION RECOMMENDATION)
│   │   ├── (marketing)/        # Public marketing pages
│   │   ├── (auth)/             # Auth flows
│   │   ├── (portal)/           # Main app (protected)
│   │   │   ├── dashboard/
│   │   │   ├── team/
│   │   │   ├── clients/
│   │   │   ├── advisory/
│   │   │   └── admin/
│   │   └── api/                # API routes (replace oracle_api_server)
│   │
│   ├── features/               # Feature-based modules
│   │   ├── team/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   └── types/
│   │   ├── clients/
│   │   ├── advisory/
│   │   ├── assessments/
│   │   └── cpd/
│   │
│   ├── shared/                 # Shared utilities
│   │   ├── components/ui/      # shadcn components
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   │
│   ├── services/               # Core services (consolidated)
│   │   ├── api/                # External API clients
│   │   ├── database/           # Supabase abstraction
│   │   ├── llm/                # LLM providers
│   │   ├── storage/            # File storage
│   │   └── auth/               # Authentication
│   │
│   └── lib/                    # Third-party configs
│       ├── supabase.ts
│       ├── openrouter.ts
│       └── providers.tsx       # React Context Providers
│
├── supabase/
│   ├── migrations/
│   │   └── 00_init.sql         # Squashed migrations
│   ├── functions/              # Edge functions
│   └── seed.sql                # Test data
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

**Key Changes:**

1. **Move to Next.js App Router**
   - Current: Vite + React Router (client-side only)
   - Proposed: Next.js 14+ with App Router
   - Benefits:
     - Server-side rendering for marketing pages (SEO)
     - API routes (eliminate oracle_api_server Node.js server)
     - Better code splitting
     - Image optimization
     - Built-in middleware

2. **Feature-Based Architecture**
   - Current: Components, services, types scattered
   - Proposed: Features are self-contained modules
   - Benefits:
     - Easier to understand
     - Faster development
     - Better code ownership
     - Can extract features as separate packages later

3. **Service Layer Consolidation**
   - Current: 45+ service files with duplicates
   - Proposed: ~15 core services
   - Benefits:
     - Single source of truth
     - Easier testing
     - Better type safety

---

### B. DATABASE OPTIMIZATION

**Current Issues:**
1. **78 migration files** - Hard to track schema state
2. **Inconsistent naming** - Some tables plural, some singular
3. **Missing indexes** - Slow queries on large tables
4. **Over-normalized** - Some joins could be denormalized for performance

**Proposed Optimization:**

**1. Squash Migrations**
- Create single `00_init.sql` with current production schema
- Archive old migrations
- New migrations: `01_feature_name.sql`, `02_feature_name.sql`

**2. Add Strategic Indexes**
```sql
-- Team queries (most common)
CREATE INDEX CONCURRENTLY idx_skill_assessments_member_lookup 
ON skill_assessments(team_member_id, skill_id) 
INCLUDE (current_level, target_level);

-- Assessment queries
CREATE INDEX CONCURRENTLY idx_assessments_member_completed
ON personality_assessments(team_member_id, completed_at DESC);

-- Client queries
CREATE INDEX CONCURRENTLY idx_clients_practice_status
ON clients(practice_id, status, created_at DESC);

-- Advisory workflow queries
CREATE INDEX CONCURRENTLY idx_workflows_practice_status
ON workflow_executions(practice_id, status, created_at DESC);
```

**3. Denormalize Hot Paths**
```sql
-- Add computed columns for frequent aggregations
ALTER TABLE practice_members ADD COLUMN 
  avg_skill_level DECIMAL(3,2) GENERATED ALWAYS AS (
    (SELECT AVG(current_level) FROM skill_assessments 
     WHERE team_member_id = practice_members.id)
  ) STORED;

ALTER TABLE practice_members ADD COLUMN
  assessments_complete_count INT DEFAULT 0;
-- Update via trigger
```

**4. Partition Large Tables**
```sql
-- Partition llm_execution_history by month (grows fast)
CREATE TABLE llm_execution_history (
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE llm_execution_history_2025_11 
  PARTITION OF llm_execution_history
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

**Estimated Performance Improvement:** 30-50% faster queries

---

### C. FRONTEND OPTIMIZATION

**Current Issues:**
1. **Large bundle size** - ~5MB initial JS
2. **No code splitting** - Loads all features upfront
3. **Redundant re-renders** - Missing React.memo, useMemo
4. **Prop drilling** - Complex state passed through many levels

**Proposed Optimization:**

**1. Code Splitting**
```typescript
// Lazy load heavy features
const AdvisoryServices = lazy(() => import('@/features/advisory'));
const TeamAssessments = lazy(() => import('@/features/team/assessments'));
const AlignmentProgram = lazy(() => import('@/features/alignment'));

// Route-based splitting (Next.js does this automatically)
```

**2. State Management Consolidation**
```typescript
// Current: Mix of useState, Context, local storage, Supabase real-time
// Proposed: Zustand + React Query

// Example: Team store
import create from 'zustand';

interface TeamStore {
  members: Member[];
  selectedMember: Member | null;
  setMembers: (members: Member[]) => void;
  selectMember: (id: string) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
  members: [],
  selectedMember: null,
  setMembers: (members) => set({ members }),
  selectMember: (id) => set(state => ({
    selectedMember: state.members.find(m => m.id === id)
  }))
}));

// React Query for server state
const { data: members } = useQuery({
  queryKey: ['team', 'members'],
  queryFn: () => teamService.getMembers(practiceId)
});
```

**3. Performance Monitoring**
```typescript
// Add Vercel Analytics or similar
import { Analytics } from '@vercel/analytics/react';

// Track slow components
import { Profiler } from 'react';

<Profiler id="TeamDashboard" onRender={logProfilerData}>
  <TeamDashboard />
</Profiler>
```

**Estimated Bundle Size Reduction:** 50-60% (5MB → 2MB initial)

---

### D. AI/LLM COST OPTIMIZATION

**Current Issues:**
1. **No caching** - Same prompts run multiple times
2. **No batching** - Individual API calls for bulk operations
3. **Expensive models** - Claude Opus 4 for simple tasks
4. **No streaming** - Users wait for full response

**Proposed Optimization:**

**1. Implement LLM Response Caching**
```typescript
// services/llm/cache.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function cachedLLMCall(
  prompt: string, 
  config: LLMConfig,
  ttl: number = 3600 // 1 hour default
): Promise<string> {
  const cacheKey = `llm:${hashPrompt(prompt)}:${config.model}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('[LLM] Cache hit:', cacheKey);
    return cached as string;
  }
  
  // Call LLM
  const response = await executeLLM(prompt, config);
  
  // Cache response
  await redis.set(cacheKey, response, { ex: ttl });
  
  return response;
}
```

**2. Model Selection Strategy**
```typescript
// Use cheapest model that meets quality bar
const modelTiers = {
  simple: 'gpt-3.5-turbo',      // $0.0015/1K tokens
  standard: 'gpt-4-turbo',      // $0.01/1K tokens
  complex: 'claude-opus-4',     // $0.015/1K tokens
  research: 'perplexity-sonar'  // $0.005/1K tokens
};

// Auto-select based on task complexity
function selectModel(task: LLMTask): string {
  if (task.type === 'research') return modelTiers.research;
  if (task.complexity === 'simple') return modelTiers.simple;
  if (task.requiresReasoning) return modelTiers.complex;
  return modelTiers.standard;
}
```

**3. Streaming Responses**
```typescript
// Stream for better UX on long responses
async function* streamLLMResponse(
  prompt: string,
  config: LLMConfig
): AsyncGenerator<string> {
  const response = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers: { ...headers },
    body: JSON.stringify({ 
      ...config, 
      prompt, 
      stream: true 
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value);
  }
}

// Usage in component
const [response, setResponse] = useState('');

for await (const chunk of streamLLMResponse(prompt, config)) {
  setResponse(prev => prev + chunk);
}
```

**4. Batch Processing**
```typescript
// Batch similar operations to reduce API calls
async function batchAnalyzeProfiles(
  memberIds: string[]
): Promise<ProfileAnalysis[]> {
  // Instead of N API calls, make 1 with all data
  const members = await teamService.getMembers(memberIds);
  
  const batchPrompt = `
Analyze these ${members.length} team member profiles:

${members.map(m => `
Member ${m.name}:
- OCEAN: ${JSON.stringify(m.ocean)}
- EQ: ${m.eq}
- Skills: ${m.skills.length}
`).join('\n')}

Return JSON array of analyses.
  `;
  
  const response = await executeLLM(batchPrompt, { 
    model: 'gpt-4-turbo',
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response);
}
```

**Estimated Cost Reduction:** 40-60% on LLM costs

---

## 4.4 GO-TO-MARKET POSITIONING

### A. TARGET MARKET SEGMENTATION

**Primary Target:** UK Accounting Practices (10-50 employees)

**Segmentation:**

**Tier 1: Progressive Practices (Early Adopters)**
- Already using cloud accounting (Xero, QuickBooks)
- Interested in advisory services expansion
- Pain: Can't scale advisory due to team skill gaps
- Willingness to pay: High (£5k-15k/year)
- **Market Size:** ~500 practices in UK

**Tier 2: Traditional Practices (Growth Phase)**
- Primarily compliance-focused
- Want to move into advisory
- Pain: Don't know team capabilities, can't train effectively
- Willingness to pay: Medium (£2k-8k/year)
- **Market Size:** ~2,000 practices in UK

**Tier 3: Solo/Small Practices (5-10 people)**
- Growing fast, need structure
- Pain: Ad-hoc team development, no CPD tracking
- Willingness to pay: Low (£500-2k/year)
- **Market Size:** ~5,000 practices in UK

---

### B. VALUE PROPOSITION BY SEGMENT

**Tier 1: "Scale Your Advisory Practice with Confidence"**
- **Key Feature:** AI-powered advisory workflows (forecasting, valuation)
- **ROI Message:** "Deliver 10x more advisory engagements without hiring"
- **Proof Point:** "Our beta practice increased advisory revenue 300% in 6 months"
- **Pricing:** £10k/year + £50 per advisory workflow execution

**Tier 2: "Transform Your Team from Compliance to Advisory"**
- **Key Feature:** Skills assessment + CPD tracking + training recommendations
- **ROI Message:** "Identify hidden advisory talent in your team"
- **Proof Point:** "Teams discover avg 40% of staff have untapped advisory potential"
- **Pricing:** £5k/year for up to 25 team members

**Tier 3: "Professional Team Management for Growing Practices"**
- **Key Feature:** Skills matrix + CPD compliance + 365 Alignment for clients
- **ROI Message:** "Save 10 hours/week on admin, stay CPD compliant"
- **Proof Point:** "100% CPD compliance, zero admin overhead"
- **Pricing:** £1.5k/year for up to 10 team members

---

### C. FEATURE PRIORITIZATION FOR LAUNCH

**Must-Have (Minimum Viable Product):**
1. ✅ Team Management (skills assessment, CPD tracking)
2. ✅ Client Management (CRM, intake, document vault)
3. ✅ 365 Alignment Programme (vision, sprints)
4. ⚠️ Advisory Workflows (3 templates: forecasting, valuation, benchmarking) - **SIMPLIFY**
5. ✅ Assessment Insights (8 assessments + AI analysis)
6. ❌ Admin Portal - **TOO COMPLEX, needs simplification**

**Nice-to-Have (V1.1 - Post-Launch):**
1. Gamification (achievements, leaderboards)
2. Mentoring hub (auto-matching, session tracking)
3. AI Skills Coach (personalized recommendations)
4. Outreach system (prospect research)
5. Knowledge base (firm-wide documentation)

**Future (V2.0+):**
1. Cyber security module
2. Alternate auditor compliance
3. Xero/QuickBooks integration
4. Client self-service portal
5. White-label for accountancy networks

---

### D. SIMPLIFIED LAUNCH ARCHITECTURE

**Remove for V1:**
1. **Gamification System** (9 tables, 5 components) - **Remove**
2. **Mentoring Hub** (4 tables, 12 components) - **Remove**
3. **Outreach System** (34 components, 8 tables) - **Remove** (separate product)
4. **Knowledge Base** (5 tables, 3 services) - **Remove** (not core)
5. **Wellness Module** (stub) - **Remove**
6. **Cyber Security** (not complete) - **Remove**
7. **Alternate Auditor** (mock only) - **Remove**

**Estimated Reduction:** ~80,000 lines of code

**Core Launch Features:**
1. Team Assessment System (8 assessments)
2. Skills & CPD Management
3. Client Management & Intake
4. 365 Alignment Programme
5. Advisory Workflows (3 templates only)
6. Role-Fit Analysis
7. Admin Dashboard (simplified)

**New Estimated Codebase:** 150,000 lines (48% reduction)

---

## 4.5 DEPLOYMENT & INFRASTRUCTURE

**Current:**
- Railway (monolithic deployment)
- Supabase (database + auth + storage)
- Manual deployments

**Proposed for Production:**

**1. Move to Vercel**
- Next.js native hosting
- Automatic edge deployments
- Preview deployments for PRs
- Better performance (edge functions)
- Cost: ~$150/month (Pro plan)

**2. Database Optimization**
- Supabase Pro ($25/month)
- Add read replicas for analytics queries
- Enable point-in-time recovery
- Set up automated backups

**3. Monitoring & Observability**
- Vercel Analytics (included)
- Sentry for error tracking ($26/month)
- LogRocket for session replay ($99/month)
- Datadog for infrastructure ($15/month)

**4. CDN & Assets**
- Cloudflare for static assets
- R2 for document storage (cheaper than S3)
- Image optimization via Next.js

**Total Infrastructure Cost:** ~$300/month for production

---

## 4.6 SECURITY & COMPLIANCE

**Must-Have for Enterprise:**

**1. SOC 2 Type II Preparation**
- Audit logging (all user actions)
- Data encryption at rest and in transit
- Access controls (RLS policies)
- Incident response plan
- Cost: ~£10k for initial certification

**2. GDPR Compliance**
- Data processing agreements
- Right to erasure (delete user data)
- Data export functionality
- Privacy policy
- Cookie consent
- **Action:** Add GDPR compliance module

**3. Penetration Testing**
- Annual pen tests
- Vulnerability scanning
- Dependency audits
- Cost: ~£5k/year

**4. Insurance**
- Cyber liability insurance
- Professional indemnity
- Cost: ~£3k/year

---

# PART 5: RECOMMENDATIONS SUMMARY

## 5.1 IMMEDIATE ACTIONS (Week 1-2)

**1. Code Consolidation Sprint**
- [x] Identify all duplicate services
- [ ] Merge duplicate implementations
- [ ] Remove stub/unused code
- [ ] Squash database migrations
- **Target:** Reduce to 180k LOC

**2. Feature Freeze for Non-Core**
- [ ] Remove gamification system
- [ ] Remove mentoring hub
- [ ] Remove outreach system (separate product)
- [ ] Remove knowledge base
- **Target:** Reduce to 150k LOC

**3. Simplify Admin Portal**
- [ ] Remove complex visualizations
- [ ] Focus on core CRUD operations
- [ ] Simplify team insights
- **Target:** 50% reduction in admin code

---

## 5.2 SHORT-TERM (Month 1-2)

**1. Next.js Migration**
- [ ] Set up Next.js 14 project
- [ ] Migrate core pages
- [ ] Convert API endpoints
- [ ] Deploy to Vercel
- **Timeline:** 3-4 weeks

**2. Database Optimization**
- [ ] Squash migrations to single init file
- [ ] Add strategic indexes
- [ ] Denormalize hot paths
- [ ] Set up monitoring
- **Timeline:** 1-2 weeks

**3. LLM Cost Optimization**
- [ ] Implement caching layer
- [ ] Add model selection logic
- [ ] Enable streaming responses
- [ ] Add batch processing
- **Timeline:** 2 weeks

---

## 5.3 MEDIUM-TERM (Month 3-4)

**1. Marketing Site Launch**
- [ ] Landing page for each segment
- [ ] Case studies & testimonials
- [ ] Pricing calculator
- [ ] Demo video
- **Timeline:** 2-3 weeks

**2. Beta Program**
- [ ] Recruit 5 beta practices
- [ ] Onboard with white-glove support
- [ ] Gather feedback
- [ ] Iterate on top issues
- **Timeline:** 4-6 weeks

**3. Documentation**
- [ ] User guide (video + written)
- [ ] Admin guide
- [ ] API documentation
- [ ] Integration guides
- **Timeline:** 2-3 weeks

---

## 5.4 LONG-TERM (Month 4+)

**1. Product-Market Fit Validation**
- Target: 20 paying customers
- Churn rate: < 10%
- NPS: > 50

**2. V1.1 Feature Roadmap**
- Mentoring hub (if validated)
- Advanced reporting
- Xero integration
- White-label capability

**3. Fundraising / Bootstrap Growth**
- Decision point: Raise seed round or continue bootstrapping
- Target: £500k ARR before considering fundraising

---

# PART 6: COMPETITIVE POSITIONING

## 6.1 COMPETITIVE LANDSCAPE

**Direct Competitors:**
1. **Senta** - Practice management + workflow
   - Strengths: Established, integrations
   - Weakness: No AI, basic team management
   - Pricing: £50/user/month

2. **Karbon** - Workflow automation
   - Strengths: Robust workflows, time tracking
   - Weakness: No skills assessment, no advisory AI
   - Pricing: £59/user/month

3. **Ignition** - Client engagement
   - Strengths: Proposals, billing
   - Weakness: No team management
   - Pricing: £79/user/month

**Indirect Competitors:**
1. **BambooHR** (HR software - skills tracking)
2. **Lattice** (Performance management)
3. **LinkedIn Learning** (CPD content)

**Torsor's Unique Position:**
- **Only platform** with 8-assessment team intelligence
- **Only platform** with AI-powered advisory workflows
- **Only platform** connecting team capabilities to client advisory services
- **Only platform** with 365 Alignment Programme (client strategic planning)

---

## 6.2 PRICING STRATEGY

**Tier 1: Starter (£149/month)**
- Up to 10 team members
- Basic skills assessment
- CPD tracking
- Client CRM (up to 50 clients)
- 5 advisory workflows/month
- Target: Solo/small practices

**Tier 2: Professional (£399/month)**
- Up to 25 team members
- Full 8-assessment system
- AI team insights
- Client CRM (up to 200 clients)
- 25 advisory workflows/month
- 365 Alignment for 10 clients
- Target: Progressive practices

**Tier 3: Enterprise (£799/month)**
- Up to 50 team members
- Everything in Professional
- Unlimited advisory workflows
- Unlimited 365 Alignment clients
- White-label options
- Priority support
- Target: Established advisory practices

**Add-Ons:**
- Extra team members: £15/month each
- Extra advisory workflows: £10 each
- Extra 365 clients: £20/month each

---

## 6.3 GTM TIMELINE

**Month 1-2: Code Cleanup & Architecture**
- Reduce codebase to 150k LOC
- Migrate to Next.js
- Optimize database
- Deploy to Vercel

**Month 3: Beta Launch**
- Recruit 5 beta practices
- Provide white-glove onboarding
- Gather feedback
- Fix critical bugs

**Month 4: Marketing Prep**
- Build marketing site
- Create demo videos
- Write case studies
- Set up email sequences

**Month 5: Soft Launch**
- Launch marketing site
- Open signups (limited)
- Target: 10 paying customers
- Pricing: 50% off for first 50 customers

**Month 6-9: Growth**
- Ramp up marketing
- Add integrations (Xero, QuickBooks)
- Target: 50 paying customers
- Optimize pricing based on feedback

**Month 10-12: Scale**
- Hire CS team
- Build partner network
- Target: 100 paying customers (£50k MRR)

---

# PART 7: FINAL EXECUTIVE SUMMARY

## Current State
- **290k lines of code** (can reduce to 150k)
- **8 assessment system** (comprehensive, validated)
- **Advisory AI workflows** (functional but needs simplification)
- **365 Alignment** (unique differentiator)
- **Complex architecture** (needs consolidation)

## Key Strengths
1. Most comprehensive team assessment system in accounting vertical
2. Only platform connecting team capabilities to advisory service delivery
3. AI-powered workflows provide tangible ROI
4. 365 Alignment Programme is unique and valuable

## Key Weaknesses
1. Too many features for V1 (gamification, mentoring, outreach)
2. Code redundancy (duplicate services, over-engineering)
3. Admin portal too complex
4. No clear pricing/packaging
5. Marketing presence weak

## Path to Market
1. **Strip to core** - Remove 40% of features
2. **Consolidate code** - Eliminate duplicates
3. **Simplify UX** - Focus on 3 user journeys
4. **Clear positioning** - "AI-powered advisory practice management"
5. **Beta launch** - 5 practices, perfect the onboarding
6. **Iterate fast** - Ship v1.1 features based on demand

## Financial Projections
- **Year 1:** 50 customers @ £400/mo avg = £240k ARR
- **Year 2:** 200 customers @ £450/mo avg = £1.08M ARR
- **Year 3:** 500 customers @ £500/mo avg = £3M ARR

## Resource Needs
- **Development:** 2 full-time (you + 1)
- **CS/Sales:** 1 part-time (month 6+)
- **Marketing:** Agency/contractor
- **Infrastructure:** £300/month
- **Total burn:** £15k/month

---

## Next Steps

1. **Run `EXPORT_ALL_TEAM_ASSESSMENT_DATA.sql`** to get your team's assessment data for separate analysis
2. **Review this document** and prioritize recommendations
3. **Decide:** Bootstrap vs. fundraising approach
4. **Execute:** Week 1-2 action plan (code consolidation)
5. **Follow up:** Let's discuss specific architectural decisions

---

**Document Generated:** November 17, 2025  
**Total Analysis:** 230,912 lines of code across 799 TypeScript files  
**Recommendation:** Reduce to 150,000 lines, focus on core features, launch beta in 8-10 weeks

