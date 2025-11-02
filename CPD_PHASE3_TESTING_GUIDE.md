# CPD Phase 3 - Testing Guide

## ✅ Phase 3 Implementation: COMPLETE & DEPLOYED

All code has been pushed to `main` and Railway deployment should be triggering automatically.

---

## 🚨 ACTION REQUIRED: Run SQL Migration

Before testing the frontend, you **must** run the SQL migration to create the new database tables and triggers.

### Step 1: Run Migration

```bash
# Connect to your Supabase database
# Run this migration:
supabase/migrations/20251102_cpd_phase3_automation.sql
```

**Or via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251102_cpd_phase3_automation.sql`
3. Paste and run

---

## 🧪 Testing Checklist

### Test 1: Automatic Recommendation Generation ✅

**Goal:** Verify recommendations generate automatically without manual button

**Steps:**
1. Log in as a member who has completed Skills Assessment
2. Navigate to CPD Overview page
3. **Expected:** Recommendations appear automatically
4. **No manual "Generate" button should be visible**

**Pass Criteria:**
- [ ] Recommendations display on page load
- [ ] No "Generate Recommendations" button present
- [ ] Console shows `[CPD] Auto-generated recommendations successfully`

---

### Test 2: Resource Matching Algorithm ✅

**Goal:** Verify recommendations link to actual resources

**Steps:**
1. View recommendations on CPD Overview
2. Check for "Resource Available" badge
3. Click "View Resource" button

**Expected Results:**
- Recommendations show actual resource titles (not just "Online Course")
- Green "Resource Available" badge appears if resource is linked
- Description shows resource details
- View button either:
  - Opens internal knowledge document page (📄 icon)
  - Opens external URL in new tab (🔗 icon)

**Pass Criteria:**
- [ ] At least some recommendations have linked resources
- [ ] View button navigates correctly
- [ ] Internal resources open in-app
- [ ] External resources open in new tab

---

### Test 3: Knowledge Base Upload → Notifications ✅

**Goal:** Verify automatic notifications when new content is added

**Setup:**
1. Have two browser tabs open:
   - Tab 1: Member portal (CPD Overview page)
   - Tab 2: Admin portal (ready to upload knowledge document)

**Steps:**

**In Admin Portal (Tab 2):**
1. Navigate to CPD Library / Knowledge Documents
2. Upload a new document
3. Set `skill_categories` to include a skill the member has (e.g., "Tax", "Xero")
4. Approve and publish the document

**In Member Portal (Tab 1):**
5. Watch for real-time notification (should appear within seconds)
6. Check notification banner appears at top
7. Click "View All" to expand notifications
8. Click on the notification

**Expected Results:**
- Purple notification banner appears WITHOUT refreshing the page
- Shows count (e.g., "1 New CPD Update")
- Toast notification pops up in corner
- Clicking notification:
  - Marks it as read (purple dot disappears)
  - Navigates to the knowledge document
  - Unread count decreases

**Pass Criteria:**
- [ ] Notification appears in real-time (no refresh)
- [ ] Toast notification displays
- [ ] Clicking notification marks as read
- [ ] Navigation works correctly
- [ ] Unread count updates

---

### Test 4: External Resource Upload → Notifications ✅

**Goal:** Same as Test 3 but for external resources

**Steps:**

**In Admin Portal:**
1. Add new external CPD resource
2. Set `skill_categories` to match member's skills
3. Save and activate

**In Member Portal:**
1. Watch for notification
2. Click notification
3. Should open external URL in new tab

**Pass Criteria:**
- [ ] Notification appears in real-time
- [ ] External URL opens in new tab
- [ ] Recommendations update with new resource

---

### Test 5: Recommendation Regeneration ✅

**Goal:** Verify recommendations update after new content is added

**Steps:**
1. Note current recommendations on CPD Overview
2. Admin uploads knowledge document (as in Test 3)
3. Member receives notification saying "recommendations_updated"
4. Member clicks notification
5. Recommendations should reload

**Expected Results:**
- Old generic recommendations replaced with resource-linked ones
- New resources appear in recommendation list
- Priority scores may change

**Pass Criteria:**
- [ ] Recommendations contain newly uploaded resource
- [ ] Resource title and description show in recommendation
- [ ] View button links to new resource

---

### Test 6: No Skills Assessment Scenario ✅

**Goal:** Verify graceful handling when member hasn't done assessment

**Steps:**
1. Log in as a member WITHOUT skill assessments
2. Navigate to CPD Overview

**Expected Results:**
- Shows message: "Complete your Skills Assessment first"
- Button: "Go to Skills Assessment"
- No errors in console

**Pass Criteria:**
- [ ] Clear messaging
- [ ] No JavaScript errors
- [ ] Navigation button works

---

### Test 7: Notification Persistence ✅

**Goal:** Verify notifications persist across page reloads

**Steps:**
1. Receive a notification (via Test 3 or 4)
2. Don't mark as read
3. Navigate away from CPD Overview
4. Return to CPD Overview
5. Refresh the page

**Expected Results:**
- Unread notification still shows
- Count still correct
- Purple dot still visible

**Pass Criteria:**
- [ ] Notifications persist
- [ ] Count accurate after refresh
- [ ] Can still mark as read

---

### Test 8: Multiple Notifications ✅

**Goal:** Test notification list with multiple items

**Steps:**
1. Upload 3+ knowledge documents with different skill categories
2. View notification list
3. Click through each notification

**Expected Results:**
- All notifications visible in list
- Sorted by priority and date
- Each clickable
- Each marks as read independently

**Pass Criteria:**
- [ ] List scrollable (if >5 notifications)
- [ ] Each notification independent
- [ ] Count decreases correctly

---

## 🐛 Common Issues & Solutions

### Issue: "No notifications appearing"

**Check:**
- SQL migration ran successfully
- RLS policies enabled on `cpd_notifications`
- Knowledge document has `skill_categories` set
- Document is `is_public = true` and `approved_at` is not null
- Member has matching skills in `skill_assessments`

**Debug:**
```sql
-- Check if trigger fired
SELECT * FROM cpd_notifications 
WHERE member_id = 'YOUR_MEMBER_ID' 
ORDER BY created_at DESC;

-- Check if member has skills
SELECT * FROM skill_assessments 
WHERE team_member_id = 'YOUR_MEMBER_ID';

-- Check if document has categories
SELECT id, title, skill_categories, is_public, approved_at 
FROM knowledge_documents 
WHERE id = 'YOUR_DOCUMENT_ID';
```

---

### Issue: "View button does nothing"

**Check:**
- `resource_url` is set in `cpd_recommendations`
- `resource_type` is not 'none'
- Console for errors
- Browser popup blocker (for external links)

**Debug:**
```sql
SELECT 
  id, 
  title, 
  resource_type, 
  resource_url, 
  linked_knowledge_doc_id, 
  linked_external_resource_id 
FROM cpd_recommendations 
WHERE member_id = 'YOUR_MEMBER_ID';
```

---

### Issue: "Recommendations not auto-generating"

**Check:**
- Member has completed skills assessment
- Function `autoGenerateCPDRecommendations()` being called
- No console errors
- Network tab for API calls

**Debug:**
```javascript
// Open browser console on CPD Overview page
// Should see these logs:
// [CPD] Auto-generating recommendations for member: <uuid>
// [CPD] Query returned: X assessments
// [CPD] Identified Y skill gaps, generating recommendations...
```

---

## 📊 Expected Console Output

### On CPD Overview Load:
```
[CPD] Auto-generating recommendations for member: <uuid>
[CPD] Query returned: 111 assessments
[CPD] Identified 96 skill gaps, generating recommendations...
[CPD] Generating recommendations for 96 skill gaps
[CPD] Found 3 resources for skill: Tax Planning
[CPD] Found 2 resources for skill: Xero Reporting
[CPD] Inserting 96 recommendations with resource links
[CPD] ✅ Successfully generated 96 recommendations
```

### On Knowledge Document Upload:
```
(In Supabase logs - not browser console)
NOTICE: Created 15 notifications for new knowledge document: Tax Update 2024
NOTICE: Triggered CPD regeneration for 15 members
```

### On Notification Received:
```
[CPD Notifications] New notification received: {new: {...}}
```

---

## ✅ Success Criteria Summary

**All 8 tests must pass:**
1. ✅ Automatic generation works
2. ✅ Resources link correctly
3. ✅ Knowledge doc → notification pipeline
4. ✅ External resource → notification pipeline
5. ✅ Recommendations regenerate
6. ✅ No-assessment scenario handled
7. ✅ Notification persistence
8. ✅ Multiple notifications work

---

## 🎉 When All Tests Pass:

**You will have:**
- ✅ Automatic CPD recommendations (no manual clicks)
- ✅ Real-time notifications for new content
- ✅ Resources linked to actual courses/documents
- ✅ Functional View button
- ✅ Seamless knowledge base integration

---

## 📞 Next Steps After Testing

Once testing is complete:
1. ✅ Mark this testing guide as complete
2. 🔄 Move to next phase (if any issues, report them)
3. 📚 Populate knowledge base with actual content
4. 👥 Invite team members to test

---

## 🔧 Database Verification Queries

### Check notification system is working:
```sql
-- Count notifications per member
SELECT 
  pm.name, 
  COUNT(cpd.id) as notification_count,
  SUM(CASE WHEN cpd.is_read THEN 0 ELSE 1 END) as unread_count
FROM cpd_notifications cpd
JOIN practice_members pm ON cpd.member_id = pm.id
GROUP BY pm.name
ORDER BY unread_count DESC;
```

### Check recommendation resource linking:
```sql
-- Show recommendations with resources
SELECT 
  pm.name as member,
  cr.title,
  cr.resource_type,
  CASE 
    WHEN cr.resource_type = 'internal' THEN kd.title
    WHEN cr.resource_type = 'external' THEN er.title
    ELSE 'No resource'
  END as resource_title
FROM cpd_recommendations cr
JOIN practice_members pm ON cr.member_id = pm.id
LEFT JOIN knowledge_documents kd ON cr.linked_knowledge_doc_id = kd.id
LEFT JOIN cpd_external_resources er ON cr.linked_external_resource_id = er.id
ORDER BY pm.name, cr.priority_score DESC;
```

### Check trigger activity:
```sql
-- Recent notifications (should increase after uploads)
SELECT 
  notification_type,
  title,
  created_at
FROM cpd_notifications
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

**Good luck with testing! 🚀**

