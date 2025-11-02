# 🚀 QUICK START: Skill-Level CPD Deployment

## ⏱️ **Total Time: ~3 hours** | 💰 **Cost: ~£3**

---

## 📋 **4 Simple Steps**

### **1️⃣ PURGE (2 minutes)**
```sql
-- In Supabase SQL Editor, run:
-- File: supabase/migrations/20251102_purge_cpd_discoveries.sql
```
✅ Deletes AI discoveries  
✅ Preserves leadership library  
✅ Clean slate for fresh discovery

---

### **2️⃣ SCHEMA (1 minute)**
```sql
-- In Supabase SQL Editor, run:
-- File: supabase/migrations/20251102_add_skill_level_to_knowledge_docs.sql
```
✅ Adds skill_level column  
✅ Adds target_skill_levels column  
✅ Creates indexes

---

### **3️⃣ TEST (90 seconds)**
1. Admin Dashboard → CPD Discovery Panel
2. Click "Discover for 1 Skill"
3. Watch console for:
   ```
   Level 1→2 for: Three-way Forecasting
   Level 2→3 for: Three-way Forecasting
   Level 3→4 for: Three-way Forecasting
   Level 4→5 for: Three-way Forecasting
   ✅ Complete: 12 docs, 12 courses across all 4 skill levels
   ```

**Verify:**
```sql
SELECT skill_level, COUNT(*) 
FROM knowledge_documents 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY skill_level;
-- Should return 3 for each level
```

---

### **4️⃣ DEPLOY (2.5-3 hours)**
1. Top up OpenRouter: https://openrouter.ai/settings/credits (~£3)
2. Admin Dashboard → CPD Discovery Panel
3. Click "Discover All (111 Skills)"
4. ☕ Coffee break (monitor console logs)

**Expected Output:**
- 2,664 resources created
- 1,332 knowledge documents
- 1,332 external courses
- 25% each level

---

## 📊 **What You Get**

### **Per Skill (24 resources):**
- 3 beginner docs (Level 1→2)
- 3 intermediate docs (Level 2→3)
- 3 advanced docs (Level 3→4)
- 3 expert docs (Level 4→5)
- 3 beginner courses
- 3 intermediate courses
- 3 advanced courses
- 3 expert courses

### **Content Types:**
- 📄 Articles (15-30 min)
- 🎥 Webinars (30-60 min)
- 📹 Videos (15-45 min)
- 🎙️ Podcasts (30-60 min)
- 📚 Case Studies (20-40 min)

### **Quality:**
- 🇬🇧 UK-focused (HMRC, FRS102, ICAEW, ACCA)
- 🆕 Recent (2024-2025)
- ✅ Professional sources
- 🔗 Real, accessible URLs

---

## 🎯 **Success Check**

After full deployment:

```sql
-- Total count (should be ~2,664)
SELECT COUNT(*) FROM knowledge_documents;
SELECT COUNT(*) FROM cpd_external_resources;

-- Level distribution (should be ~25% each)
SELECT 
  skill_level,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM knowledge_documents
GROUP BY skill_level;
```

---

## 📚 **Full Documentation**

For detailed guides, see:
- 📖 `PURGE_AND_FRESH_START_GUIDE.md` - Complete step-by-step
- 🎓 `SKILL_LEVEL_CPD_COMPLETE.md` - Testing & verification
- 📊 `SKILL_LEVEL_CPD_SUMMARY.md` - Executive summary
- 🛠️ `SKILL_LEVEL_CPD_PART2_GUIDE.md` - Technical details

---

## ⚡ **Start Now!**

Open Supabase SQL Editor and run Step 1 (Purge) 🚀

