# 🤖 COMPREHENSIVE LLM CALL AUDIT - Team Management Section

## 📊 Executive Summary

**Total LLM Integration Points Found:** 8  
**Currently in AI Settings:** 1 (Profile Synthesis)  
**Missing from AI Settings:** 7  
**Status:** ⚠️ **Significant gaps - Most LLM calls NOT configurable via admin panel**

---

## 🎯 Current State: What's in AI Settings Page

### ✅ Currently Configurable (1/8)

| LLM Call | Prompt Key | Model | Category | Status |
|----------|-----------|-------|----------|--------|
| **Profile Synthesis** | `profile_synthesis` | Configurable | Generation | ✅ In AI Settings |

**Location:** `src/lib/services/llm-service.ts`  
**Function:** `generateProfessionalProfile()`  
**Purpose:** Generates comprehensive professional profile from 8 assessments  
**Editable:** ✅ System prompt, user prompt template, model, temperature, max_tokens

---

## ❌ Missing from AI Settings (7/8)

### 1️⃣ **AI Skills Coach** 
**Status:** ❌ NOT in AI Settings  
**Location:** `src/services/ai/skillsCoachService.ts`  
**Function:** `sendCoachMessage()`  
**Model:** Hardcoded `openai/gpt-4-turbo` (env: `VITE_OPENROUTER_MODEL`)  
**API Key:** Hardcoded env var `VITE_OPENROUTER_API_KEY`

**What it does:**
- Personalized skills coaching conversations
- CPD planning assistance  
- Mentoring guidance
- Career pathway advice
- Interview preparation

**System Prompts:** 5 context types (hardcoded)
- `skills` - Skills development coaching
- `cpd` - CPD planning 
- `mentoring` - Mentoring relationships
- `career` - Career progression
- `general` - General coaching

**Parameters:**
- Temperature: `0.7` (hardcoded)
- Max tokens: `500` (hardcoded)
- Presence penalty: `0.6` (hardcoded)
- Frequency penalty: `0.3` (hardcoded)

**⚠️ ISSUE:** Completely hardcoded, no admin control

---

### 2️⃣ **Training Recommendations Generator**
**Status:** ❌ NOT in AI Settings  
**Location:** `src/services/ai/trainingRecommendations.ts`  
**Function:** `generateTrainingRecommendations()`  
**Model:** Not using OpenRouter - **Uses internal algorithm** ❗

**What it does:**
- Analyzes skill gaps
- Recommends specific training
- Suggests quick wins vs strategic investments
- Calculates ROI predictions

**⚠️ ISSUE:** This is NOT an LLM call - it's algorithmic  
**Opportunity:** Could be enhanced with LLM for personalized recommendations

---

### 3️⃣ **Workflow LLM Executor**
**Status:** ❌ NOT in AI Settings  
**Location:** `src/services/openRouterService.ts`  
**Function:** `executeLLMStep()`  
**Model:** Configurable per workflow step  
**API Key:** Hardcoded env var `VITE_OPENROUTER_API_KEY`

**What it does:**
- Generic LLM executor for workflow automation
- Template variable interpolation
- Cost tracking per execution

**Supported Models:** 8 predefined
- `anthropic/claude-3.5-sonnet` (recommended)
- `anthropic/claude-3-opus`
- `anthropic/claude-3-haiku`
- `openai/gpt-4-turbo-preview` (recommended)
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`
- `google/gemini-pro`
- `meta-llama/llama-3-70b-instruct`

**Parameters:** Configurable per call
- Temperature (default: `0.7`)
- Max tokens (default: `2000`)
- System prompt
- User prompt

**⚠️ ISSUE:** Used in workflows but not centrally managed

---

### 4️⃣ **CPD Recommendations (AI Coach Integration)**
**Status:** ❌ NOT in AI Settings  
**Location:** `src/lib/api/ai-coach.ts`  
**Function:** `generateCPDRecommendations()`  
**Model:** Uses AI Coach service (GPT-4 Turbo)

**What it does:**
- Generates CPD activity recommendations
- Tailored to learning style
- Addresses skill gaps
- Tracks toward CPD targets

**⚠️ ISSUE:** Hardcoded prompt template, no admin customization

---

### 5️⃣ **Skill Improvement Plan Generator**
**Status:** ❌ NOT in AI Settings  
**Location:** `src/lib/api/ai-coach.ts`  
**Function:** `generateSkillImprovementPlan()`  
**Model:** Uses AI Coach service (GPT-4 Turbo)

**What it does:**
- Creates personalized skill development plans
- Current level → Target level pathway
- Adapted to learning style (VARK)
- Step-by-step action items

**⚠️ ISSUE:** Hardcoded prompt template, no admin customization

---

### 6️⃣ **Interview Prep Generator**
**Status:** ❌ NOT in AI Settings  
**Location:** `src/lib/api/ai-coach.ts`  
**Function:** `generateInterviewPrep()`  
**Model:** Uses AI Coach service (GPT-4 Turbo)

**What it does:**
- Role-specific interview preparation
- Leverages candidate strengths
- Addresses skill gaps
- Practice questions & answers

**⚠️ ISSUE:** Hardcoded prompt template, no admin customization

---

### 7️⃣ **Career Pathway Generator**
**Status:** ❌ NOT in AI Settings  
**Location:** `src/lib/api/ai-coach.ts`  
**Function:** `generateCareerPathway()`  
**Model:** Uses AI Coach service (GPT-4 Turbo)

**What it does:**
- Maps current role → target role
- Years of experience factored in
- Skill progression milestones
- Realistic timelines

**⚠️ ISSUE:** Hardcoded prompt template, no admin customization

---

## 🔑 API Key Management

### Current State
- ✅ **Database stored:** `ai_api_keys` table exists
- ✅ **Admin UI:** Add/view API keys in AI Settings
- ❌ **Actually used:** Only `llm-service.ts` reads from database
- ❌ **Hardcoded everywhere else:** All other services use `VITE_OPENROUTER_API_KEY` env var

### Services Using Hardcoded Keys
1. `skillsCoachService.ts` → `import.meta.env.VITE_OPENROUTER_API_KEY`
2. `openRouterService.ts` → `import.meta.env.VITE_OPENROUTER_API_KEY`

---

## 🆕 Additional LLM Opportunities

### High-Value Additions

#### 1️⃣ **Gap Analysis AI Insights** 🔥
**Location:** `src/components/accountancy/team/GapAnalysis.tsx`  
**Current:** Loads AI recommendations but they're from training service (algorithmic)  
**Opportunity:** Add LLM call to generate narrative insights about skill gaps
- "Your team is strongest in X, but vulnerable in Y"
- Strategic recommendations for upskilling
- Risk assessment

#### 2️⃣ **Team Composition Analysis** 🔥
**Location:** `src/components/accountancy/team/TeamCompositionAnalyzer.tsx`  
**Current:** Shows data visualizations only  
**Opportunity:** LLM-powered team dynamics analysis
- Belbin role balance assessment
- Communication style compatibility
- Conflict style management tips
- Optimal team pairings

#### 3️⃣ **Service Line Deployment Optimization** 🔥
**Location:** `src/lib/api/strategic-matching.ts`  
**Current:** Algorithmic matching only  
**Opportunity:** LLM enhancement for deployment strategy
- Analyze why certain members are better fits
- Generate deployment narratives
- Risk/opportunity assessment

#### 4️⃣ **Learning Path Personalization** 
**Location:** `src/services/ai/trainingRecommendations.ts`  
**Current:** Rule-based learning paths  
**Opportunity:** LLM-generated personalized learning journeys
- Story-driven learning narratives
- Motivational messaging tailored to motivational drivers
- Adaptive pathways based on progress

#### 5️⃣ **Assessment Result Synthesis**
**Location:** Multiple assessment pages  
**Current:** Raw results displayed  
**Opportunity:** LLM-powered result interpretation
- "What does this mean for me?"
- Actionable insights from scores
- Comparison to typical patterns

---

## 📋 Recommended Action Plan

### Phase 1: Consolidate Existing (Priority 1) 🔴

**Goal:** Bring all 7 missing LLM calls into AI Settings

#### Step 1: Create Prompt Templates (Database)
Add to `ai_prompts` table:

1. **Skills Coach - Skills Context**
   - `prompt_key`: `coach_skills`
   - `category`: `coaching`
   - Template for skills development coaching

2. **Skills Coach - CPD Context**
   - `prompt_key`: `coach_cpd`
   - `category`: `coaching`
   - Template for CPD planning

3. **Skills Coach - Mentoring Context**
   - `prompt_key`: `coach_mentoring`
   - `category`: `coaching`
   - Template for mentoring guidance

4. **Skills Coach - Career Context**
   - `prompt_key`: `coach_career`
   - `category`: `coaching`
   - Template for career advice

5. **Skills Coach - General Context**
   - `prompt_key`: `coach_general`
   - `category`: `coaching`
   - Template for general coaching

6. **CPD Recommendations**
   - `prompt_key`: `cpd_recommendations`
   - `category`: `recommendation`
   - Template for CPD activity suggestions

7. **Skill Improvement Plan**
   - `prompt_key`: `skill_improvement_plan`
   - `category`: `generation`
   - Template for skill development plans

8. **Interview Preparation**
   - `prompt_key`: `interview_prep`
   - `category`: `generation`
   - Template for interview prep guides

9. **Career Pathway**
   - `prompt_key`: `career_pathway`
   - `category`: `generation`
   - Template for career progression maps

#### Step 2: Update Service Files
Modify these files to read from database instead of hardcoded:

**`src/services/ai/skillsCoachService.ts`:**
```typescript
// BEFORE (hardcoded)
const SYSTEM_PROMPTS: Record<CoachContextType, string> = { ... }
const model = import.meta.env.VITE_OPENROUTER_MODEL || 'openai/gpt-4-turbo';

// AFTER (database-driven)
const promptConfig = await getPromptConfig(`coach_${context.type}`, practiceId);
const model = promptConfig.model_name;
const systemPrompt = promptConfig.system_prompt;
```

**`src/lib/api/ai-coach.ts`:**
```typescript
// BEFORE (hardcoded templates)
const template = await getCoachingTemplate('cpd_recommendations');

// AFTER (use ai_prompts table)
const promptConfig = await getPromptConfig('cpd_recommendations', practiceId);
```

**`src/services/openRouterService.ts`:**
```typescript
// BEFORE (env var)
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// AFTER (database)
const apiKey = await getOpenRouterKey(practiceId);
```

#### Step 3: Extend AI Settings UI
Add categories to AI Settings page:

- **Coaching** (5 prompts)
- **Recommendations** (1 prompt)
- **Career Development** (3 prompts)

---

### Phase 2: Add New LLM Opportunities (Priority 2) 🟡

#### Step 1: Gap Analysis Insights
**File:** `src/components/accountancy/team/GapAnalysis.tsx`  
**New LLM Call:** `generateGapAnalysisInsights()`  
**Prompt Key:** `gap_analysis_insights`

**Implementation:**
```typescript
export async function generateGapAnalysisInsights(
  practiceId: string,
  gapData: SkillGap[],
  teamComposition: any
): Promise<string> {
  const promptConfig = await getPromptConfig('gap_analysis_insights', practiceId);
  // ... call OpenRouter with gap data
}
```

#### Step 2: Team Composition Analysis
**File:** `src/components/accountancy/team/TeamCompositionAnalyzer.tsx`  
**New LLM Call:** `generateTeamDynamicsAnalysis()`  
**Prompt Key:** `team_dynamics_analysis`

#### Step 3: Service Line Strategy
**File:** `src/lib/api/strategic-matching.ts`  
**New LLM Call:** `generateDeploymentStrategy()`  
**Prompt Key:** `deployment_strategy`

---

### Phase 3: Enhance Training Recommendations (Priority 3) 🟢

**File:** `src/services/ai/trainingRecommendations.ts`  
**Current:** Pure algorithmic  
**Enhancement:** Hybrid approach

```typescript
// Keep algorithmic scoring
const algorithmicRecs = calculateRecommendations(profile);

// Add LLM enhancement
const llmInsights = await generateTrainingNarrative(
  practiceId,
  profile,
  algorithmicRecs
);

return {
  ...algorithmicRecs,
  narrative: llmInsights, // LLM-generated explanation
  motivationalMessage: llmInsights.motivation // Tailored to motivational drivers
};
```

**New Prompt Key:** `training_narrative`

---

## 📊 Database Schema Required

### New Prompt Categories

Add these to `ai_prompts.category` enum:
- `coaching` (5 prompts)
- `career` (3 prompts)
- `analysis` (3 new prompts)
- `strategy` (1 new prompt)

Total new prompts to create: **12**

---

## 💰 Cost Considerations

### Current Usage (Estimated)

| LLM Call | Frequency | Tokens/Call | Model | Cost/Call |
|----------|-----------|-------------|-------|-----------|
| Profile Synthesis | On-demand | ~3000 | Claude 3.5 Sonnet | $0.045 |
| Skills Coach | Per message | ~1500 | GPT-4 Turbo | $0.045 |
| CPD Recommendations | On-demand | ~2000 | GPT-4 Turbo | $0.060 |
| Skill Plan | On-demand | ~2000 | GPT-4 Turbo | $0.060 |
| Interview Prep | On-demand | ~2000 | GPT-4 Turbo | $0.060 |
| Career Pathway | On-demand | ~2000 | GPT-4 Turbo | $0.060 |

**Monthly Estimate (10 team members, active usage):**
- Profile synthesis: 10 profiles × $0.045 = **$0.45**
- Skills coach: 200 messages × $0.045 = **$9.00**
- Other tools: 50 uses × $0.060 = **$3.00**
- **Total: ~$12.45/month**

### With New Features (Phase 2)

Additional monthly cost: **~$8/month**
- Gap analysis: 20 × $0.045 = $0.90
- Team dynamics: 10 × $0.045 = $0.45
- Deployment strategy: 15 × $0.060 = $0.90
- Training narratives: 100 × $0.045 = $4.50
- Assessment synthesis: 40 × $0.030 = $1.20

**Grand Total Estimated: ~$20/month**

---

## ✅ Success Criteria

### Phase 1 Complete When:
- [ ] All 9 prompt templates in `ai_prompts` table
- [ ] All services read prompts from database
- [ ] AI Settings page shows all 9 prompts
- [ ] Admin can edit/test each prompt
- [ ] API keys centrally managed
- [ ] All hardcoded prompts removed

### Phase 2 Complete When:
- [ ] 4 new LLM calls implemented
- [ ] 4 new prompt templates in database
- [ ] UI shows LLM-generated insights
- [ ] Cost tracking per feature

### Phase 3 Complete When:
- [ ] Training recommendations enhanced with LLM
- [ ] Hybrid algorithm + LLM approach working
- [ ] Personalized narratives generating

---

## 🚀 Immediate Next Steps

1. **Audit Complete** ✅ (this document)
2. **Create SQL migration** to add 9 missing prompt templates
3. **Update `skillsCoachService.ts`** to use database prompts
4. **Update `ai-coach.ts`** to use database prompts  
5. **Update `openRouterService.ts`** to use database API keys
6. **Extend AI Settings UI** with new categories
7. **Test each LLM call** through admin panel
8. **Deploy & Monitor** cost tracking

---

**Ready to proceed with implementation?** 🎯

This gives you:
- Complete visibility of all LLM usage
- Centralized prompt management
- Easy A/B testing of prompts
- Cost tracking per feature
- Admin control without code changes

