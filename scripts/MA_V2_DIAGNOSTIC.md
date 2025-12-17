# Management Accounts v2 Diagnostic Guide

## Current Flow Analysis

### 1. Document Upload Flow (✅ IMPLEMENTED)

**Location:** `src/pages/admin/ClientServicesPage.tsx` (lines 4810-4952)

**What happens:**
1. User uploads PDF/Excel file
2. System finds or creates `ma_engagements` record
3. File uploaded to `ma-documents` storage bucket
4. `ma_uploaded_documents` record created with status `pending`
5. **`extract-ma-financials` edge function called automatically**
6. Extraction status updated based on result

**Check if working:**
```sql
-- Run this in Supabase SQL Editor
SELECT 
  id, filename, extraction_status, extraction_error, created_at, extracted_at
FROM ma_uploaded_documents
ORDER BY created_at DESC
LIMIT 5;
```

**Expected console logs:**
- `[MA Upload] Calling extract-ma-financials for document {id}`
- `[MA Upload] Extraction started: {result}`

---

### 2. Generate Analysis Flow (✅ IMPLEMENTED)

**Location:** `src/pages/admin/ClientServicesPage.tsx` (lines 5030-5088)

**What happens:**
1. User clicks "Generate Analysis" button
2. System checks for `ma_engagements` record
3. **If engagement exists:** Uses v2 mode with `engagementId`
4. **If no engagement:** Falls back to v1 mode with `clientId`
5. Calls `generate-ma-insights` edge function

**Check which mode is used:**
Look for console logs:
- `[MA Insights] Using v2 mode with engagementId: ...` ← **v2 mode (what we want)**
- `[MA Insights] Using v1 mode with clientId: ...` ← **v1 mode (fallback)**

---

### 3. Missing Piece: Assessment Data Sync

**PROBLEM:** Assessment responses are stored in `service_line_assessments` but v2 needs them in `ma_assessment_responses`.

**Solution:** We need to sync assessment data when generating insights OR create a trigger/function to sync automatically.

**Check if assessment exists:**
```sql
-- Check service_line_assessments (old table)
SELECT 
  id, client_id, service_line_code, responses, extracted_insights, completed_at
FROM service_line_assessments
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28'
  AND service_line_code = 'management_accounts';

-- Check ma_assessment_responses (new v2 table)
SELECT 
  id, engagement_id, client_id, tuesday_financial_question, magic_away_financial
FROM ma_assessment_responses
WHERE client_id = '1522309d-3516-4694-8a0a-69f24ab22d28';
```

---

## Diagnostic Checklist

### ✅ Step 1: Verify Migration Ran
```sql
-- Check if v2 tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name IN (
    'ma_assessment_responses',
    'ma_uploaded_documents',
    'ma_extracted_financials',
    'ma_true_cash_calculations',
    'ma_period_comparisons'
  );
```

**Expected:** All 5 tables should exist

---

### ✅ Step 2: Check Edge Functions Deployed

**In Supabase Dashboard:**
1. Go to Edge Functions
2. Verify these functions exist:
   - `extract-ma-financials` ✅
   - `generate-ma-insights` ✅

**Check function logs:**
- Go to Edge Functions → `extract-ma-financials` → Logs
- Look for invocations when documents are uploaded

---

### ✅ Step 3: Check Storage Bucket

**In Supabase Dashboard:**
1. Go to Storage
2. Verify `ma-documents` bucket exists
3. Check RLS policies allow uploads

---

### ✅ Step 4: Test Upload Flow

1. Upload a PDF document
2. Check browser console for:
   ```
   [MA Upload] Calling extract-ma-financials for document {id}
   [MA Upload] Extraction started: {result}
   ```
3. Check Supabase Edge Function logs for `extract-ma-financials`
4. Run diagnostic query:
   ```sql
   SELECT * FROM ma_uploaded_documents ORDER BY created_at DESC LIMIT 1;
   ```
5. Check extraction status - should be `completed` or `processing`

---

### ✅ Step 5: Test Generate Analysis Flow

1. Click "Generate Analysis" button
2. Check browser console for:
   ```
   [MA Insights] Using v2 mode with engagementId: ...  ← GOOD
   OR
   [MA Insights] Using v1 mode with clientId: ...  ← FALLBACK
   ```
3. If v1 mode, check why engagement wasn't found:
   ```sql
   SELECT * FROM ma_engagements WHERE client_id = 'YOUR_CLIENT_ID';
   ```

---

## Common Issues & Fixes

### Issue 1: "extract-ma-financials not being called"

**Symptoms:**
- Documents upload successfully
- No console logs about extraction
- `ma_uploaded_documents` records have `extraction_status = 'pending'`

**Possible causes:**
1. Edge function not deployed
2. Error in upload handler (check browser console)
3. `ma-documents` bucket doesn't exist

**Fix:**
- Deploy `extract-ma-financials` edge function
- Create `ma-documents` storage bucket
- Check browser console for errors

---

### Issue 2: "Using v1 mode instead of v2"

**Symptoms:**
- Console shows `[MA Insights] Using v1 mode with clientId`
- No True Cash, Tuesday Question, etc. in output

**Possible causes:**
1. No `ma_engagements` record exists
2. Engagement query failing

**Fix:**
- Check if engagement exists: `SELECT * FROM ma_engagements WHERE client_id = '...'`
- If missing, upload a document first (creates engagement automatically)
- Or manually create engagement

---

### Issue 3: "No assessment data in v2 mode"

**Symptoms:**
- v2 mode is used but error: "No assessment found for this engagement"

**Possible causes:**
1. Assessment exists in `service_line_assessments` but not `ma_assessment_responses`
2. Assessment not completed

**Fix:**
- Sync assessment data (see sync script below)
- Or complete assessment first

---

## Quick Fix: Sync Assessment Data

If assessment exists in `service_line_assessments` but not `ma_assessment_responses`:

```sql
-- Sync assessment data for a specific client
INSERT INTO ma_assessment_responses (
  engagement_id,
  client_id,
  tuesday_financial_question,
  magic_away_financial,
  decision_making_story,
  kpi_priorities,
  current_reporting_lag,
  accounting_platform,
  bookkeeping_currency,
  bookkeeping_owner,
  ma_transformation_desires,
  financial_visibility_vision,
  reporting_frequency_preference,
  additional_reporting_needs,
  raw_responses,
  completed_at
)
SELECT 
  e.id as engagement_id,
  sla.client_id,
  sla.responses->>'ma_tuesday_financial_question' as tuesday_financial_question,
  sla.responses->>'ma_magic_away_financial' as magic_away_financial,
  sla.responses->>'ma_decision_making_story' as decision_making_story,
  ARRAY(SELECT jsonb_array_elements_text(sla.responses->'ma_pain_points')) as kpi_priorities,
  sla.responses->>'ma_reporting_lag' as current_reporting_lag,
  sla.responses->>'ma_accounting_platform' as accounting_platform,
  sla.responses->>'ma_bookkeeping_currency' as bookkeeping_currency,
  sla.responses->>'ma_bookkeeping_owner' as bookkeeping_owner,
  ARRAY(SELECT jsonb_array_elements_text(sla.responses->'ma_transformation_desires')) as ma_transformation_desires,
  sla.responses->>'ma_visibility_vision' as financial_visibility_vision,
  sla.responses->>'ma_reporting_frequency' as reporting_frequency_preference,
  ARRAY(SELECT jsonb_array_elements_text(sla.responses->'ma_additional_reporting')) as additional_reporting_needs,
  sla.responses as raw_responses,
  sla.completed_at
FROM service_line_assessments sla
JOIN ma_engagements e ON e.client_id = sla.client_id
WHERE sla.service_line_code = 'management_accounts'
  AND sla.completed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ma_assessment_responses mar 
    WHERE mar.engagement_id = e.id
  );
```

---

## Expected v2 Output Format

When v2 mode works correctly, the insight should have:

```json
{
  "headline": {
    "text": "...",
    "sentiment": "positive|neutral|warning|critical"
  },
  "trueCashSection": {
    "narrative": "...",
    "isHealthy": true/false,
    "implication": "..."
  },
  "tuesdayQuestionAnswer": {
    "originalQuestion": "...",
    "answer": "...",
    "supportingData": [...],
    "verdict": "..."
  },
  "keyInsights": [...],
  "decisionsEnabled": [...],
  "watchList": [...],
  "clientQuotesUsed": [...]
}
```

If you're seeing the old format (just headline, insights, decisionsEnabled, watchList), it's using v1 mode.

