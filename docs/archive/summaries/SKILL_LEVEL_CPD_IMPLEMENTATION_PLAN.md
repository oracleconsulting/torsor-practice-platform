# 🎓 Skill-Level Graduated CPD System - Implementation Plan

## 🎯 **The Challenge**

CPD resources need to be appropriate for learner's current skill level:
- **Level 1 → 2**: Fundamentals, "what is X?", introductory content
- **Level 2 → 3**: Practical application, "how to use X in practice"
- **Level 3 → 4**: Advanced techniques, edge cases, optimization
- **Level 4 → 5**: Mastery, thought leadership, cutting-edge research

Currently, we discover the same resources for everyone, regardless of their level.

---

## 📊 **Proposed Database Schema**

### New Columns for `knowledge_documents`:

```sql
-- General skill level category
skill_level VARCHAR(50) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert'))

-- Specific target levels (e.g., [2,3] = for moving from level 2 to 3)
target_skill_levels INTEGER[] DEFAULT ARRAY[1,2,3,4,5]
```

**Migration created:** `20251102_add_skill_level_to_knowledge_docs.sql`

---

## 🔄 **Discovery Strategy - Two Approaches**

### **Option 1: Discover Multiple Levels Per Skill (RECOMMENDED)**
For each skill, discover resources at EACH level progression:

```javascript
// For "Three-way Forecasting"
discover("Three-way Forecasting", level 1→2) // 3 beginner resources
discover("Three-way Forecasting", level 2→3) // 3 intermediate resources  
discover("Three-way Forecasting", level 3→4) // 3 advanced resources
discover("Three-way Forecasting", level 4→5) // 3 expert resources

// Result: 12 resources per skill, covering all progressions
// Total for 111 skills: 111 × 12 = 1,332 resources
```

**Pros:**
- ✅ Complete coverage of all skill progressions
- ✅ Appropriate resources for everyone
- ✅ Clear learning pathways from beginner to expert

**Cons:**
- ❌ 4× more API calls (4× cost, 4× time)
- ❌ Takes ~3 hours for full discovery vs ~40 minutes

### **Option 2: Discover Based on Team's Current Levels**
Only discover resources for levels team members actually need:

```javascript
// Check team skill levels first
skill_levels = getTeamSkillLevels("Three-way Forecasting")
// Returns: {1: 5 people, 2: 8 people, 3: 3 people, 4: 1 person}

// Only discover for existing gaps
if (people at level 1) discover(level 1→2)
if (people at level 2) discover(level 2→3)
// etc.

// Result: Only resources team actually needs
```

**Pros:**
- ✅ More efficient (only what's needed)
- ✅ Faster, cheaper
- ✅ Focused on actual team gaps

**Cons:**
- ❌ Incomplete library (missing levels with no current team members)
- ❌ Need to re-discover when new people join at different levels

---

## 🎨 **UI Updates Needed**

### **Knowledge Base Filtering:**
```
[All Levels ▼] [Beginner] [Intermediate] [Advanced] [Expert]

Or more specific:
[All ▼] [Level 1→2] [Level 2→3] [Level 3→4] [Level 4→5]
```

### **CPD Recommendations:**
```javascript
// When showing recommendations to a user:
const userLevel = getUserSkillLevel(memberId, skillId); // e.g., 2
const targetLevel = userLevel + 1; // e.g., 3

// Filter resources:
resources.filter(r => 
  r.target_skill_levels.includes(userLevel) && 
  r.target_skill_levels.includes(targetLevel)
)
```

### **Resource Cards:**
```
┌─────────────────────────────────────┐
│ 📄 Three-way Forecasting Guide     │
│ [Intermediate] [Level 2→3] [30 min] │
│                                     │
│ Perfect for: Moving from developing │
│ to competent level                  │
└─────────────────────────────────────┘
```

---

## 💡 **Recommended Implementation Path**

### **Phase 1: Database & Basic Infrastructure** (Complete)
- ✅ Add `skill_level` and `target_skill_levels` columns
- ✅ Update TypeScript interfaces
- ✅ Migration SQL created

### **Phase 2: Smart Discovery** (Next)
**Decision Point:** Which approach?

**My Recommendation:** Start with Option 2 (team-based) because:
- More practical for immediate use
- Lower cost for initial rollout
- Can add Option 1 later for comprehensive library

### **Phase 3: Prompt Updates**
- Modify Perplexity prompts to request level-appropriate content
- Add level guidelines to system prompt
- Return `skillLevel` and `targetSkillLevels` in responses

### **Phase 4: UI Updates**
- Add level filters to knowledge base
- Show level badges on resource cards
- Filter recommendations by user's current level

### **Phase 5: Smart Matching**
- Link CPD recommendations to user skill levels
- "Recommended for your level" section
- Progressive learning paths

---

## 🚀 **Quick Implementation (Option 2)**

```typescript
// 1. Get team skill levels for this skill
const skillLevels = await getTeamSkillLevels(skillId);

// 2. Discover for each level with team members
for (const [level, count] of Object.entries(skillLevels)) {
  if (count > 0) {
    await discoverKnowledgeDocuments(
      skillName,
      skillCategory,
      level,           // currentLevel
      level + 1,       // targetLevel  
      3                // 3 resources per level
    );
  }
}
```

---

## 📊 **Cost Comparison**

### Current (No Levels):
- 111 skills × 5 resources = 555 resources
- Cost: ~£1.10
- Time: ~40 minutes

### Option 1 (All Levels):
- 111 skills × 12 resources (3 per level × 4 levels) = 1,332 resources
- Cost: ~£2.50-£3
- Time: ~160 minutes (2h 40min)

### Option 2 (Team-Based, estimated):
- ~111 skills × 8 resources average (2 levels per skill) = 888 resources
- Cost: ~£1.75
- Time: ~60 minutes

---

## ❓ **Decision Required**

**Which approach should we implement?**

1. **Option 1 (Complete Library)** - Comprehensive but slower/costlier
2. **Option 2 (Team-Based)** - Practical, efficient, focused

**Or hybrid:**
3. Start with Option 2, add Option 1 for critical skills

Let me know your preference and I'll implement it! 🎯

