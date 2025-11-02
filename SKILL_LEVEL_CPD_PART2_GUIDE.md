# 🚀 Skill-Level CPD - Part 2 Implementation Guide

## ✅ COMPLETED (Part 1):
- ✅ Database schema (skill_level, target_skill_levels columns)
- ✅ TypeScript interfaces updated
- ✅ Perplexity prompts now request level-specific content
- ✅ `discoverKnowledgeDocuments()` accepts level parameters

---

## 🔧 REMAINING WORK (Part 2):

### **Step 1: Update `discoverResourcesForSkill()` Function**

**File:** `src/lib/api/cpd-discovery.ts` (lines 24-160)

**Current behavior:** Discovers once per skill (5 resources total)

**New behavior:** Loop through 4 skill level progressions:

```typescript
// Replace lines 40-49 with:
const levelProgressions = [
  { current: 1, target: 2 },  // Beginner
  { current: 2, target: 3 },  // Intermediate
  { current: 3, target: 4 },  // Advanced
  { current: 4, target: 5 }   // Expert
];

for (const progression of levelProgressions) {
  console.log(`[CPD Discovery] Level ${progression.current}→${progression.target} for: ${skillName}`);
  
  // Discover 3 knowledge docs for this level
  const knowledgeDocs = await discoverKnowledgeDocuments(
    skillName,
    skillCategory,
    progression.current,  // NEW: Pass current level
    progression.target,   // NEW: Pass target level
    3                      // 3 resources per level
  );
  
  // Discover 3 courses for this level
  const courses = await discoverTrainingCourses(
    skillName,
    skillCategory,
    progression.current,   // Already has this parameter
    progression.target,    // Already has this parameter
    3
  );
  
  // Insert documents and courses (existing code)
  // ... (keep existing insert logic)
  
  // Add 1 second delay between level progressions
  if (progression.current < 4) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

---

### **Step 2: Update Knowledge Document Insert**

**File:** `src/lib/api/cpd-discovery.ts` (lines 84-101)

**Add level fields to insert:**

```typescript
const { error } = await (supabase
  .from('knowledge_documents') as any)
  .insert({
    uploaded_by: (member as any).id,
    title: doc.title,
    summary: doc.summary,
    document_type: documentType,
    content_type: doc.contentType,
    duration_minutes: doc.durationMinutes,
    skill_level: doc.skillLevel,              // NEW: Store skill level
    target_skill_levels: doc.targetSkillLevels, // NEW: Store target levels
    file_name: `${skillName.toLowerCase().replace(/\s+/g, '-')}-${doc.contentType}-level${progression.current}-${progression.target}.md`,  // NEW: Include level in filename
    file_path: doc.sourceUrl,
    tags: doc.tags,
    skill_categories: doc.skillCategories.length > 0 ? doc.skillCategories : [skillCategory],
    is_public: true,
    approved_by: (member as any).id,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  });
```

---

### **Step 3: Update Console Logging**

**Update line 108 and 143:**

```typescript
// Knowledge docs
console.log(`[CPD Discovery] ✅ Created ${doc.skillLevel} doc: ${doc.title}`);

// Courses
console.log(`[CPD Discovery] ✅ Created ${course.skillLevel} course: ${course.title}`);
```

---

### **Step 4: Update Final Summary Log**

**Update line 152:**

```typescript
console.log(`[CPD Discovery] ✅ Complete for ${skillName}: ${result.knowledgeDocsCreated} docs, ${result.coursesCreated} courses across all 4 skill levels`);
```

---

## 📊 **Expected Results**

### **Per Skill:**
- 12 knowledge documents (3 per level × 4 levels)
- 12 external courses (3 per level × 4 levels)
- **Total: 24 resources per skill**

### **Full Discovery (111 skills):**
- 1,332 knowledge documents
- 1,332 external courses  
- **Total: 2,664 resources**

### **Time & Cost:**
- **Time:** ~2.5-3 hours (4× longer due to 4 levels)
- **Cost:** ~£2.50-£3 (4× more API calls)
- **Per skill:** ~90 seconds (was ~20 seconds)

---

## 🎨 **Future UI Updates (Part 3)**

### **Knowledge Base Filtering:**

```tsx
// Add level filter dropdown
<Select value={selectedLevel} onValueChange={setSelectedLevel}>
  <SelectTrigger>
    <SelectValue placeholder="All Levels" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Levels</SelectItem>
    <SelectItem value="beginner">Beginner (1→2)</SelectItem>
    <SelectItem value="intermediate">Intermediate (2→3)</SelectItem>
    <SelectItem value="advanced">Advanced (3→4)</SelectItem>
    <SelectItem value="expert">Expert (4→5)</SelectItem>
  </SelectContent>
</Select>

// Filter documents
const filteredDocs = documents.filter(doc =>
  selectedLevel === 'all' || doc.skill_level === selectedLevel
);
```

### **Resource Cards:**

```tsx
{/* Show level badge */}
{doc.skill_level && (
  <Badge variant="outline" className="capitalize">
    {doc.skill_level} (Level {doc.target_skill_levels?.[0]}→{doc.target_skill_levels?.[1]})
  </Badge>
)}
```

---

## 🎯 **Smart Recommendations (Part 4)**

### **Filter by User's Current Level:**

```typescript
// Get user's current skill level
const userSkillLevel = await getUserSkillLevel(memberId, skillId);

// Show resources for next progression
const recommendedResources = allResources.filter(resource =>
  resource.target_skill_levels?.includes(userSkillLevel) &&
  resource.target_skill_levels?.includes(userSkillLevel + 1)
);
```

---

## ⚡ **Quick Implementation Checklist**

- [ ] Update `discoverResourcesForSkill()` to loop through 4 levels
- [ ] Update knowledge doc insert to include `skill_level` and `target_skill_levels`
- [ ] Update `file_name` to include level (e.g., `three-way-forecasting-article-level1-2.md`)
- [ ] Update console logging to show skill levels
- [ ] Run SQL migration: `20251102_add_skill_level_to_knowledge_docs.sql`
- [ ] Test with 1 skill to verify all 4 levels discovered
- [ ] Run full discovery for all 111 skills
- [ ] Add level filters to knowledge base UI (Part 3)
- [ ] Implement smart recommendations (Part 4)

---

## 🚨 **Important Notes**

1. **Discovery will take 4× longer** (~2.5-3 hours for all 111 skills)
2. **Cost will be 4× higher** (~£2.50-£3 total)
3. **Rate limiting:** 1-second delay between level progressions
4. **File naming:** Must include level to avoid duplicates
5. **Console logs:** Show clear progress through levels

---

## 🎯 **Testing Strategy**

### **Test with ONE skill first:**

```typescript
// In console or test file:
await discoverResourcesForSkill(
  'skill-id',
  'Three-way Forecasting',
  'Advisory & Consulting',
  0,
  4
);

// Should create:
// - 12 docs (3 beginner, 3 intermediate, 3 advanced, 3 expert)
// - 12 courses (3 per level)
// - 24 total resources
```

### **Verify in database:**

```sql
SELECT 
  skill_level,
  COUNT(*) as count
FROM knowledge_documents
WHERE title LIKE '%Three-way Forecasting%'
GROUP BY skill_level;

-- Should return:
-- beginner: 3
-- intermediate: 3
-- advanced: 3
-- expert: 3
```

---

## 📝 **Next Actions**

1. **Review this implementation plan**
2. **Make the code changes** (Steps 1-4 above)
3. **Run SQL migration** in Supabase
4. **Test with 1 skill** (verify 24 resources created)
5. **Run full discovery** (all 111 skills, ~3 hours)
6. **Verify in knowledge base** (should see level badges)
7. **Implement UI filters** (Part 3)
8. **Add smart recommendations** (Part 4)

**Ready to implement?** Let me know and I'll make the code changes! 🚀

