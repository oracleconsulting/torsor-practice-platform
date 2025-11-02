# 🚀 Quick Start: Perplexity AI CPD Integration

## ✅ Immediate Fix Deployed

**Your "View Resource" button now works better!**

When clicking on a recommendation without a linked resource, it will:
1. Show toast: "🔍 No specific resource found yet"
2. Display: "Searching for [skill name] training..."
3. Automatically open Google search in new tab
4. Action button: "Search Google" (manual trigger)

**Try it now:**
- Refresh your CPD page
- Click "View Resource" on any recommendation
- Google search will open automatically with relevant query

---

## 🤖 Perplexity AI Setup (5 minutes)

### Step 1: Get Perplexity API Key

1. Go to: https://www.perplexity.ai/settings/api
2. Sign up / Log in
3. Click "Generate API Key"
4. Copy the key (starts with `pplx-`)

### Step 2: Add to Railway

1. Go to Railway dashboard
2. Select `torsor-practice-platform` project
3. Go to **Variables** tab
4. Add new variable:
   ```
   VITE_PERPLEXITY_API_KEY=pplx-your-key-here
   ```
5. **Redeploy** the service

### Step 3: Wait for Deployment (~2 minutes)

Railway will automatically rebuild with the new environment variable.

---

## 🧪 Test the Integration

### Option A: Quick Test (Browser Console)

1. Open your CPD page
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Run this command:

```javascript
// Test Perplexity discovery for a single skill
import { discoverResourcesForSkill } from '/src/lib/api/cpd-discovery.ts';

await discoverResourcesForSkill(
  'skill-id-here',  // Replace with actual skill ID
  'Tax Planning',
  'Tax & Compliance',
  1,  // Current level
  4   // Target level
);
```

**Expected Result:**
- Console shows: "Found: 2 docs, 3 courses"
- New knowledge documents appear in database
- New external courses appear in database

### Option B: Batch Discovery (All Skills)

**Coming in admin dashboard, but you can test via console:**

```javascript
import { discoverResourcesForAllSkills } from '/src/lib/api/cpd-discovery.ts';

// Discover for first 5 skills (takes ~1 minute)
const result = await discoverResourcesForAllSkills(5);

console.log(`Processed: ${result.processed} skills`);
console.log(`Created: ${result.totalResources} resources`);
console.log('Errors:', result.errors);
```

---

## 📊 What Happens Next

### Automatic Flow:

```
1. Discovery runs for skill
2. Perplexity searches web (real-time)
3. Finds 2 knowledge docs + 3 courses
4. Auto-creates in database
5. Database trigger fires
6. Members with matching skills get notified
7. Recommendations regenerate with resources
8. Members see "Resource Available" badges
9. View button opens actual course!
```

### Cost Tracking:

Each skill discovery costs ~5p (£0.05):
- 2 API calls to Perplexity
- ~10,000 tokens total
- Cost per discovery: £0.05

For 100 skills: ~£5 total

---

## 🎯 Expected Results

### After Running Discovery:

**Before:**
- 90 recommendations
- All show "Resource link not available"
- No "Resource Available" badges

**After:**
- 90 recommendations
- 70+ have linked resources
- Green "Resource Available" badges
- View button opens actual courses
- Titles show real course names
- Descriptions show course details

---

## 🐛 Troubleshooting

### Issue: "Perplexity API key not configured"

**Fix:**
- Check Railway variables include `VITE_PERPLEXITY_API_KEY`
- Redeploy after adding variable
- Wait for build to complete
- Hard refresh browser (Cmd/Ctrl + Shift + R)

### Issue: "Failed to parse AI response as JSON"

**Fix:**
- This is normal occasionally (AI doesn't always return perfect JSON)
- The function retries automatically
- Check console for specific parsing error
- Usually resolves on next run

### Issue: "Rate limit exceeded"

**Fix:**
- Perplexity free tier: 5 requests/minute
- Script has 2-second delays between calls
- Reduce `maxSkills` parameter
- Upgrade to paid tier for faster processing

---

## 📈 Monitoring Discovery

### Check Stats:

```javascript
import { getDiscoveryStats } from '/src/lib/api/cpd-discovery.ts';

const stats = await getDiscoveryStats();

console.log('Total Knowledge Docs:', stats.totalKnowledgeDocs);
console.log('Total External Courses:', stats.totalExternalCourses);
console.log('Skills Covered:', stats.skillsCovered);
console.log('Categories:', stats.categoriesRepresented);
```

### View Resources in Database:

**Supabase Dashboard → Table Editor:**

1. `knowledge_documents` - See all discovered guides
2. `cpd_external_resources` - See all discovered courses

Filter by:
- `created_at DESC` - Newest first
- `skill_categories` - By category
- `is_active = true` - Active only

---

## 🎓 What Gets Discovered

### Knowledge Documents:
- HMRC guidance updates
- FRS102 changes
- Professional body articles (ICAEW, ACCA)
- Industry best practices
- Case studies
- Regulatory updates

**Example:**
```json
{
  "title": "Making Tax Digital for ITSA: 2024 Implementation Guide",
  "summary": "Comprehensive guide to MTD ITSA rollout...",
  "sourceUrl": "https://icaew.com/mtd-itsa-guide",
  "tags": ["tax", "hmrc", "mtd", "compliance"],
  "skillCategories": ["Tax & Compliance"]
}
```

### External Courses:
- ICAEW CPD courses
- ACCA training
- AAT courses
- Kaplan, BPP, Tolley's
- Specialist providers

**Example:**
```json
{
  "title": "Xero Advanced Reporting & Analytics",
  "provider": "Xero Training Academy",
  "url": "https://xero.com/uk/training/advanced-reporting",
  "cost": 295,
  "durationHours": 6,
  "accreditation": "CPD Certified",
  "skillLevel": "intermediate"
}
```

---

## ⚡ Quick Commands

### Discover for Your Top 5 Skill Gaps:

```javascript
import { discoverResourcesForMember } from '/src/lib/api/cpd-discovery.ts';

// Replace with your member ID
const result = await discoverResourcesForMember('your-member-id');

console.log('Created:', result.knowledgeDocsCreated + result.coursesCreated, 'resources');
```

### Discover for Specific Skill:

```javascript
await discoverResourcesForSkill(
  'skill-uuid',
  'Xero Reporting',
  'Cloud Accounting',
  2, // intermediate
  4  // proficient
);
```

### Check if Perplexity is Working:

```javascript
import { checkPerplexityStatus } from '/src/lib/ai/perplexity-service.ts';

const status = await checkPerplexityStatus();
console.log('Configured:', status.configured);
console.log('Working:', status.working);
console.log('Error:', status.error);
```

---

## 🎯 Next Steps

1. ✅ **Add API key to Railway** (Step 2 above)
2. ✅ **Wait for deployment**
3. ✅ **Test discovery** (Option A or B)
4. ✅ **Check results** in database
5. ✅ **Refresh CPD page**
6. ✅ **Click "View Resource"** - should now open real courses!

---

## 📞 Support

**If discovery isn't working:**

1. Check Railway logs for errors
2. Verify API key is correct
3. Test Perplexity directly: https://www.perplexity.ai
4. Check console for detailed error messages

**Console logging:**
- `[Perplexity]` - API calls
- `[CPD Discovery]` - Resource creation
- All errors are logged with details

---

## 🎉 Success Indicators

**You'll know it's working when:**

✅ Console shows: "Discovered X knowledge documents"
✅ Console shows: "Created Y courses"
✅ Database has new entries in `knowledge_documents`
✅ Database has new entries in `cpd_external_resources`
✅ CPD page shows "Resource Available" badges
✅ View button opens actual course websites
✅ Recommendations show real course titles

---

**Ready to populate your CPD library automatically? 🚀**

Add that API key and let the AI do the research for you!

