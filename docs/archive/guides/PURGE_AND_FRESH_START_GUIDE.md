# 🗑️ Knowledge Base Purge + Fresh Start Guide

## 📋 **Pre-Discovery Cleanup**

Before running the full skill-level graduated CPD discovery, we need to clean out the existing AI-discovered resources while preserving your leadership library.

---

## 🎯 **What Gets Deleted:**

✅ **AI-Discovered Knowledge Documents**
- Articles, webinars, videos, podcasts, case studies
- Identified by: external URLs in `file_path`
- Identified by: naming patterns like `three-way-forecasting-article.md`
- Identified by: filenames containing `level1-2`, `level2-3`, etc.

✅ **AI-Discovered External Courses**
- All entries in `cpd_external_resources` table
- ICAEW courses, training programs, etc.

✅ **Orphaned Data**
- CPD activities linked to deleted documents
- CPD recommendations linked to deleted resources

---

## 🛡️ **What Gets PRESERVED:**

✅ **Leadership Library**
- Manually uploaded documents
- Internal file paths (not URLs)
- Your curated leadership content

✅ **User Data**
- Skill assessments
- Team members
- Practice settings
- All historical data

---

## 🚀 **Step-by-Step Process**

### **Step 1: Run Purge Script**

1. Open **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20251102_purge_cpd_discoveries.sql`
4. Click **Run**

**Expected Output:**
```
📊 KNOWLEDGE DOCUMENTS:
  ✅ Keeping (leadership library, manual uploads): 5
  🗑️  Deleting (AI-discovered CPD): 6
  
📊 EXTERNAL COURSES:
  🗑️  Deleting (all AI-discovered courses): 5
  
✅ Deleted all AI-discovered external courses
✅ Deleted AI-discovered knowledge documents
✅ Cleaned up orphaned CPD activities
✅ Cleaned up orphaned CPD recommendations

📊 FINAL STATE:
  📚 Knowledge Documents Remaining: 5
  🎓 External Courses Remaining: 0
  ✅ CPD Activities Remaining: 2
  💡 CPD Recommendations Remaining: 0
  
✅ PURGE COMPLETE - Leadership library and manual uploads preserved!
```

### **Step 2: Run Schema Migration**

1. Still in **SQL Editor**
2. Open: `supabase/migrations/20251102_add_skill_level_to_knowledge_docs.sql`
3. Click **Run**

This adds:
- `skill_level` column (beginner/intermediate/advanced/expert)
- `target_skill_levels` column (INTEGER[])
- Indexes for efficient filtering

### **Step 3: Verify Clean State**

Run these verification queries:

```sql
-- Should show only leadership library
SELECT id, title, file_name, created_at
FROM knowledge_documents
ORDER BY created_at DESC;

-- Should return 0
SELECT COUNT(*) as should_be_zero
FROM knowledge_documents
WHERE file_path LIKE 'http%';

-- Should return 0
SELECT COUNT(*) as should_be_zero
FROM cpd_external_resources;
```

### **Step 4: Test with 1 Skill**

1. Navigate to **Admin Dashboard**
2. Scroll to **CPD Discovery Panel**
3. Click **"Discover for 1 Skill"**
4. Watch console logs

**Expected:**
- 4 level progressions (1→2, 2→3, 3→4, 4→5)
- 12 knowledge documents created
- 12 external courses created
- **Total: 24 resources**

### **Step 5: Verify Test Results**

```sql
-- Should show 12 (3 per level)
SELECT 
  skill_level,
  COUNT(*) as count
FROM knowledge_documents
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY skill_level;

-- Should show level distribution
SELECT 
  skill_level,
  content_type,
  COUNT(*) as count
FROM knowledge_documents
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY skill_level, content_type
ORDER BY skill_level, content_type;
```

### **Step 6: Run Full Discovery**

If test looks good:

1. Top up **OpenRouter credits** (~£3)
2. Click **"Discover All (111 Skills)"**
3. Grab a coffee ☕ (~2.5-3 hours)

**Expected:**
- 2,664 total resources created
- 1,332 knowledge documents (111 skills × 12 docs)
- 1,332 external courses (111 skills × 12 courses)
- Level distribution: 25% each (beginner/intermediate/advanced/expert)

---

## 📊 **Monitoring Progress**

### **Real-Time Console Logs:**

```
[CPD Discovery] Starting batch discovery for up to 111 skills
[CPD Discovery] Found 111 skills to process
[CPD Discovery] Processing skill 1/111: Three-way Forecasting

[CPD Discovery] Level 1→2 for: Three-way Forecasting
[CPD Discovery] Found: 3 docs, 3 courses for Level 1→2
[CPD Discovery] ✅ Created beginner doc: Fundamentals of Three-way Forecasting
[CPD Discovery] ✅ Created beginner doc: Introduction to Financial Modeling
[CPD Discovery] ✅ Created beginner doc: Cash Flow Forecasting Basics
[CPD Discovery] ✅ Created beginner course: Three-way Forecasting 101
...

[CPD Discovery] Level 2→3 for: Three-way Forecasting
[CPD Discovery] Found: 3 docs, 3 courses for Level 2→3
[CPD Discovery] ✅ Created intermediate doc: Practical Three-way Forecasting
...

[CPD Discovery] Level 3→4 for: Three-way Forecasting
...

[CPD Discovery] Level 4→5 for: Three-way Forecasting
...

[CPD Discovery] ✅ Complete for Three-way Forecasting: 12 docs, 12 courses across all 4 skill levels

[CPD Discovery] Processing skill 2/111: Business Valuations
...
```

### **Progress Tracking Query:**

```sql
-- Run this periodically to see progress
SELECT 
  skill_level,
  content_type,
  COUNT(*) as count
FROM knowledge_documents
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY skill_level, content_type
ORDER BY skill_level, content_type;

-- Total count
SELECT COUNT(*) as total_new_resources
FROM knowledge_documents
WHERE created_at > NOW() - INTERVAL '1 day';
```

---

## ⚠️ **Important Notes**

### **Purge Script is Safe:**
- Uses transaction (rolls back on error)
- Preserves leadership library
- Can be run multiple times
- Shows preview before deleting

### **Discovery Takes Time:**
- **1 skill:** ~90 seconds (24 resources)
- **25 skills:** ~40 minutes (600 resources)
- **111 skills:** ~2.5-3 hours (2,664 resources)

### **Rate Limiting:**
- 1-second delay between level progressions
- Prevents API throttling
- OpenRouter has generous limits

### **Cost:**
- **Test (1 skill):** ~£0.025
- **Full (111 skills):** ~£2.50-£3
- Much cheaper than manual curation!

---

## 🎯 **Success Checklist**

After full discovery, you should have:

✅ **2,664 total CPD resources**
- 1,332 knowledge documents
- 1,332 external courses

✅ **Level distribution (per skill):**
- 3 beginner docs (Level 1→2)
- 3 intermediate docs (Level 2→3)
- 3 advanced docs (Level 3→4)
- 3 expert docs (Level 4→5)
- Same for courses

✅ **Content type distribution:**
- Articles (15-30 min)
- Webinars (30-60 min)
- Videos (15-45 min)
- Podcasts (30-60 min)
- Case studies (20-40 min)

✅ **Quality indicators:**
- UK-focused content (HMRC, FRS102, ICAEW, ACCA)
- Recent (2024-2025)
- Professional sources
- Real, accessible URLs

---

## 🚀 **Ready to Start!**

1. ✅ Purge script created
2. ⏳ Run purge (Step 1)
3. ⏳ Run schema migration (Step 2)
4. ⏳ Verify clean state (Step 3)
5. ⏳ Test with 1 skill (Step 4)
6. ⏳ Run full discovery (Step 6)

**Start with the purge script in Supabase SQL Editor!** 🗑️➡️🚀

