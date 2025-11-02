# Perplexity AI Integration for CPD - Implementation Plan

## 🎯 Goal
Automatically source relevant CPD resources using Perplexity AI:
1. **Knowledge Documents** - Research and summarize latest industry content
2. **External Courses** - Find and recommend specific courses matching team needs

---

## 📋 Architecture

### Flow Diagram:
```
Skill Gap Identified
       ↓
Perplexity AI Search
       ↓
   ┌─────────┴─────────┐
   ↓                   ↓
Knowledge Doc      External Course
(Research)         (Find Courses)
   ↓                   ↓
Auto-upload to     Add to External
knowledge_documents  Resources
   ↓                   ↓
Trigger Notification ← ─┘
   ↓
Update Recommendations
```

---

## 🔧 Implementation Components

### 1. Perplexity API Service
**File:** `src/lib/ai/perplexity-service.ts`

**Endpoints:**
- `searchKnowledgeDocuments(topic, skillCategory)` - Research industry content
- `findRelevantCourses(skill, currentLevel, targetLevel)` - Find specific courses
- `summarizeContent(url)` - Summarize web content for knowledge base

### 2. Automated CPD Discovery Service
**File:** `src/lib/api/cpd-discovery.ts`

**Functions:**
- `discoverKnowledgeForSkill(skillId, skillName, category)` - Auto-research
- `findCoursesForSkillGap(skillId, currentLevel, targetLevel)` - Course discovery
- `enrichRecommendation(recommendationId)` - Enhance existing recommendations

### 3. Database Functions
**File:** `supabase/migrations/20251102_perplexity_integration.sql`

**Tables:**
- `ai_content_discoveries` - Track AI-discovered content
- `discovery_queue` - Queue for processing discoveries
- `discovery_logs` - Audit trail

**Functions:**
- `queue_skill_discovery(skill_id)` - Add to discovery queue
- `process_discovery_queue()` - Background processor

### 4. Admin Dashboard
**File:** `src/pages/accountancy/admin/CPDDiscoveryDashboard.tsx`

**Features:**
- View AI-discovered content
- Approve/reject suggestions
- Manual trigger discovery
- View discovery logs

---

## 🤖 Perplexity AI Queries

### Query 1: Knowledge Document Research
```
Find the latest 2024-2025 UK accounting updates, best practices, and 
industry insights related to {skill_category}. Focus on:
- Recent regulatory changes (HMRC, FRS102, etc.)
- Best practice guides
- Case studies
- Industry trends

Provide: Title, Summary (200 words), Source URL, Key Takeaways
```

### Query 2: Course Discovery
```
Find professional CPD courses for UK accountants to improve 
{skill_name} from level {current_level} to {target_level}.

Requirements:
- UK-based or online providers
- Accredited (ICAEW, ACCA, AAT, etc.)
- 2-10 hours duration
- Cost £50-500
- Available in 2024-2025

For each course provide:
- Course Title
- Provider Name
- URL
- Duration (hours)
- Cost (GBP)
- Accreditation
- Skill Level (Beginner/Intermediate/Advanced)
- Brief Description
```

---

## 🔑 Required Environment Variables

```env
# Perplexity AI
VITE_PERPLEXITY_API_KEY=pplx-xxxxx
VITE_PERPLEXITY_MODEL=llama-3.1-sonar-large-128k-online

# Discovery Settings
VITE_CPD_AUTO_DISCOVERY_ENABLED=true
VITE_CPD_DISCOVERY_BATCH_SIZE=5
VITE_CPD_DISCOVERY_INTERVAL_HOURS=24
```

---

## 📊 Data Models

### AI Content Discovery
```typescript
interface AIContentDiscovery {
  id: string;
  skill_id: string;
  discovery_type: 'knowledge_document' | 'external_course';
  
  // AI Results
  suggested_title: string;
  suggested_description: string;
  source_url?: string;
  provider?: string;
  
  // Course-specific
  duration_hours?: number;
  cost?: number;
  accreditation?: string;
  
  // Metadata
  ai_confidence_score: number; // 0-100
  search_query_used: string;
  perplexity_response: JSONB;
  
  // Approval workflow
  status: 'pending' | 'approved' | 'rejected' | 'published';
  reviewed_by?: UUID;
  reviewed_at?: timestamp;
  rejection_reason?: string;
  
  // Publishing
  published_knowledge_doc_id?: UUID;
  published_external_resource_id?: UUID;
  
  created_at: timestamp;
}
```

---

## 🚀 Implementation Phases

### Phase 1: Perplexity Service (IMMEDIATE)
- [ ] Create Perplexity API service
- [ ] Implement knowledge document search
- [ ] Implement course search
- [ ] Add error handling & rate limiting

### Phase 2: Discovery System (WEEK 1)
- [ ] Create database tables
- [ ] Build discovery queue system
- [ ] Implement auto-discovery triggers
- [ ] Add admin approval workflow

### Phase 3: Admin Dashboard (WEEK 1)
- [ ] Build CPD Discovery Dashboard
- [ ] Approval/rejection interface
- [ ] Manual discovery triggers
- [ ] Discovery logs viewer

### Phase 4: Automation (WEEK 2)
- [ ] Automatic daily discovery
- [ ] Batch processing
- [ ] Auto-publish approved content
- [ ] Email notifications for new discoveries

---

## 🎯 Use Cases

### Use Case 1: New Team Member Onboarding
```
1. Member completes Skills Assessment
2. System identifies 20 skill gaps
3. Perplexity discovers content for each gap
4. Admin reviews & approves 18/20
5. Knowledge docs auto-created
6. External courses added to library
7. Member receives 96 recommendations (ALL linked to resources)
```

### Use Case 2: Skill Category Update
```
1. HMRC announces new Making Tax Digital requirements
2. Admin triggers discovery for "Tax Compliance" category
3. Perplexity finds:
   - 5 knowledge documents (guides, updates)
   - 8 external courses (MTD training)
4. Admin approves all
5. 15 team members with Tax skills get notifications
6. Recommendations auto-update with new resources
```

### Use Case 3: Nightly Auto-Discovery
```
1. Cron job runs at 2 AM daily
2. Checks discovery_queue for pending skills
3. Processes 5 skills at a time
4. Adds discoveries to admin review queue
5. Admin gets email: "10 new CPD resources discovered"
6. Admin reviews during morning coffee ☕
7. Publishes approved content
```

---

## 💰 Cost Estimation

### Perplexity AI Pricing:
- **Model:** `llama-3.1-sonar-large-128k-online`
- **Cost:** ~$5 per 1M tokens
- **Avg Query:** ~5,000 tokens (input + output)
- **Cost per Query:** ~$0.025 (2.5 pence)

### Monthly Estimates:
| Scenario | Queries/Month | Cost/Month |
|----------|---------------|------------|
| Small team (10 members, 50 skills) | ~200 | £5 |
| Medium team (30 members, 100 skills) | ~600 | £15 |
| Large team (100 members, 200 skills) | ~2000 | £50 |

**Very affordable!** 🎉

---

## 🔒 Safety & Quality Controls

### 1. AI Confidence Scoring
- Perplexity responses analyzed for quality
- Score 0-100 based on:
  - Source credibility
  - Relevance to skill
  - Recency of information
  - Citation quality

### 2. Admin Review Required
- All AI discoveries require admin approval
- Prevents:
  - Irrelevant content
  - Inappropriate resources
  - Low-quality suggestions

### 3. Rate Limiting
- Max 10 queries/minute to Perplexity
- Queue-based processing
- Graceful backoff on errors

### 4. Source Verification
- URLs validated before saving
- Dead link detection
- Provider reputation check

---

## 📈 Success Metrics

### Key Metrics:
- **Discovery Success Rate** - % of discoveries approved
- **Resource Coverage** - % of skills with linked resources
- **Time to Resource** - Hours from skill gap → linked resource
- **Member Engagement** - % of recommendations viewed

### Target Goals:
- 80%+ discovery approval rate
- 90%+ skills with linked resources
- <24 hours time to resource
- 60%+ recommendation engagement

---

## 🎬 Quick Start (Immediate Fix + Perplexity)

### Step 1: Add Perplexity API Key
```bash
# In Railway dashboard
VITE_PERPLEXITY_API_KEY=pplx-your-key-here
```

### Step 2: Run Discovery
```typescript
// Manual trigger in admin dashboard
await discoverResourcesForAllSkills();
```

### Step 3: Review & Approve
```typescript
// Admin dashboard
- View discovered content
- Click "Approve" or "Reject"
- Approved content auto-publishes
```

### Step 4: Recommendations Update
```typescript
// Automatic
- Triggers regenerate CPD recommendations
- Members get notifications
- Resources now linked
```

---

## 🔮 Future Enhancements

### Phase 5: Advanced Features
- [ ] **Sentiment Analysis** - Filter out negative course reviews
- [ ] **Competitor Analysis** - Compare similar courses
- [ ] **Trend Detection** - Identify emerging skills
- [ ] **ROI Prediction** - Estimate course effectiveness
- [ ] **Personalized Discovery** - Based on member preferences
- [ ] **Multi-language Support** - International resources

### Phase 6: Integration Expansions
- [ ] **Direct Course Enrollment** - API integration with providers
- [ ] **Certificate Verification** - Auto-verify completions
- [ ] **Cost Optimization** - Find cheaper alternatives
- [ ] **Bundle Recommendations** - "Members who took this also took..."

---

## 🎓 Training for Admin

### Admin Workflow:
1. **Review Queue** - Check AI discoveries daily
2. **Quality Check** - Verify source credibility
3. **Approve/Reject** - One-click decisions
4. **Monitor Impact** - View recommendation engagement

### Best Practices:
- ✅ Approve high-confidence (80+) discoveries
- ✅ Verify provider websites exist
- ✅ Check course dates (not expired)
- ✅ Ensure UK relevance
- ❌ Don't approve sales pages
- ❌ Don't approve unaccredited courses

---

## 🚨 Immediate Action Plan

Want me to implement this? Here's what I'll build:

**This weekend (2-3 hours):**
1. ✅ Perplexity API service
2. ✅ Basic discovery function
3. ✅ Quick fix for empty resources
4. ✅ Manual trigger in admin

**Next week (5-6 hours):**
1. ✅ Full discovery queue system
2. ✅ Admin approval dashboard
3. ✅ Automated nightly discovery
4. ✅ Email notifications

**Total implementation time: ~8 hours**

---

## 💡 The Vision

Imagine this:
```
Member logs in → Sees "96 recommendations"
Clicks "View Resource" → Opens actual course
Signs up → Takes training → Improves skill
System tracks → Updates skill level → Recommends next step

Meanwhile...
Perplexity discovers new HMRC guidance
Admin approves
All 30 tax team members notified
Recommendations updated
Team stays cutting-edge

ALL AUTOMATIC. ALL REAL RESOURCES. ALL PERSONALIZED.
```

---

**Ready to build this? Say the word and I'll start implementing!** 🚀

