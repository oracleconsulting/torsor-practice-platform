# Vision Workflow System - Implementation Summary

## 🎯 **What We Built**

A collaborative vision creation workflow that bridges the Oracle Method Portal (client-facing) and TORSOR (accountant-facing) to create better, more personalized roadmaps through human refinement.

---

## 📊 **The New Workflow**

### **Phase 1: Assessment** (Oracle Method Portal)
✅ Client completes Part 1 & 2 assessments
- Stored in `client_intake` and `client_intake_part2` tables

### **Phase 2: Vision Generation** (TORSOR)
✅ Accountant generates initial 5-year vision
- Clicks "Generate Vision" button in 365 Alignment → Vision Workflow tab
- Calls existing Oracle API: `POST /generate-roadmap`
- Uses Claude Opus 4 via OpenRouter
- Creates emotionally intelligent vision using assessment data

### **Phase 3: Vision Refinement** (TORSOR)
✅ Accountant edits and refines vision
- Vision Editor UI with rich text editing
- Edit narrative, north star, year milestones
- Save drafts or finalize

### **Phase 4: Feedback Call** (External + TORSOR)
✅ Upload call transcript
- Schedule call using Calendly integration (already built)
- Record call externally (you have this sorted)
- Upload transcript to TORSOR (TXT, DOCX, PDF)
- Stored in `alignment_call_transcripts` table

⚠️ **Coming Next:** LLM transcript analysis
- Extract insights from call
- Enrich assessment data with call details
- Suggest vision refinements

### **Phase 5: Roadmap Generation** (TORSOR → Oracle Method Portal)
✅ Generate complete roadmap
- Accountant finalizes vision
- Clicks "Generate Full Roadmap"
- Calls Oracle API to create 6-month shifts + 3-month sprints
- Roadmap becomes visible in Oracle Method Portal for client

---

## 🔧 **Technical Architecture**

### **Components Created**

1. **`VisionWorkflowPanel.tsx`** (NEW)
   - Location: `src/components/alignment/VisionWorkflowPanel.tsx`
   - Main UI for vision workflow
   - Status tracking (Assessment → Vision → Call → Roadmap)
   - Vision editor
   - Transcript uploader

2. **AlignmentProgrammePage.tsx** (UPDATED)
   - Added new "Vision Workflow" tab (2nd tab in navigation)
   - Integrated VisionWorkflowPanel component

### **API Integration**

**Oracle API Server Endpoints Used:**
- `POST /generate-roadmap`
  - **Location:** `oracle_api_server/api/routes/generate_roadmap.py`
  - **What it does:**
    1. Fetches assessment data from `client_intake` + `client_intake_part2`
    2. Calls `generate_five_year_vision()` (line 1939)
    3. Calls `generate_six_month_shift()` (line 2193)
    4. Calls `generate_three_month_sprint()` (line 2414)
    5. Stores complete roadmap in `client_config.roadmap` (JSONB)

**Parameters:**
```json
{
  "group_id": "uuid-of-client",
  "user_id": "default"
}
```

**Response:**
```json
{
  "success": true,
  "five_year_vision": { ... },
  "six_month_shift": { ... },
  "three_month_sprint": { ... }
}
```

### **Database Tables Used**

1. **`client_intake`** - Part 1 assessment responses
2. **`client_intake_part2`** - Part 2 assessment responses
3. **`client_config`** - Stores roadmap data (including vision)
   - `roadmap` column (JSONB) contains:
     - `five_year_vision`
     - `six_month_shift`
     - `three_month_sprint`
4. **`alignment_call_transcripts`** - Stores feedback call transcripts

---

## 🎨 **User Experience**

### **For Accountants (TORSOR):**

1. Navigate to: **365 Alignment → Select Client → Vision Workflow tab**

2. **Status Display:**
   - Visual status badges showing current stage
   - Clear "what to do next" messaging

3. **Generate Initial Vision:**
   ```
   [Assessment Complete]
   ↓
   Click "Generate Vision"
   ↓
   AI creates personalized 5-year vision
   ↓
   Vision appears in editor
   ```

4. **Refine Vision:**
   - Edit narrative, north star, milestones
   - Save draft
   - Schedule feedback call with client

5. **Upload Transcript:**
   - After call, upload transcript file
   - Review extracted insights
   - Finalize vision

6. **Generate Roadmap:**
   ```
   [Vision Finalized]
   ↓
   Click "Generate Full Roadmap"
   ↓
   Creates 6-month shifts + 3-month sprints
   ↓
   Client sees roadmap in Oracle Method Portal
   ```

### **For Clients (Oracle Method Portal):**

1. Complete assessments
2. Wait for accountant to create roadmap
3. View final roadmap with:
   - 5-year vision
   - 6-month shifts (strategic transformations)
   - 3-month sprints (tactical execution)
   - Weekly tasks

---

## ⚠️ **What's NOT Built Yet**

### **1. LLM Transcript Analysis**
**What it needs to do:**
- Read uploaded transcript
- Extract key insights:
  - Refined goals mentioned in call
  - Corrections to initial vision
  - Additional context about sacrifices, growth traps
  - Family/lifestyle details
  - New motivations or fears
- Merge insights with original assessment responses
- Suggest vision updates

**Implementation plan:**
```typescript
// New service: transcriptEnrichmentService.ts
async function analyzeTranscript(transcript: string, assessmentData: any) {
  const prompt = `
    TRANSCRIPT: ${transcript}
    ORIGINAL ASSESSMENT: ${JSON.stringify(assessmentData)}
    
    Extract:
    1. New goals or refined motivations
    2. Corrections to initial vision
    3. Additional sacrifice/growth trap context
    4. Family/lifestyle details
    5. Emotional anchors (fears, desires)
    
    Return enriched assessment data as JSON.
  `;
  
  // Call OpenRouter with Claude Opus 4
  const enrichedData = await callLLM(prompt);
  
  // Merge with original assessment
  return mergeAssessmentData(assessmentData, enrichedData);
}
```

### **2. Gamma.app PDF Export**
**What it needs to do:**
- Create beautiful presentation of 5-year vision
- Export to Gamma.app format
- Accountant sends to client for review

**Implementation options:**
- Gamma.app API (if they have one)
- Export to PowerPoint/PDF, import to Gamma manually
- Create PDF directly using jsPDF library

### **3. Vision-Only Generation Flag**
**Current issue:** API generates everything at once (vision + shifts + sprints)

**What we need:**
- Add `generate_vision_only` flag to Oracle API
- Allows generating vision first, roadmap later

**Code change needed:**
```python
# In oracle_api_server/api/routes/generate_roadmap.py

@router.post("/generate-roadmap")
async def generate_roadmap(request: Request):
    body = await request.json()
    generate_vision_only = body.get("generate_vision_only", False)
    
    # ... existing code ...
    
    # 6. Generate the 5-year vision
    five_year_vision = generate_five_year_vision(details, industry)
    
    if generate_vision_only:
        # Stop here, return just the vision
        return JSONResponse(content={
            "success": True,
            "five_year_vision": five_year_vision
        })
    
    # 7. Generate the 6-month shift
    six_month_shift = generate_six_month_shift(details, five_year_vision)
    # ...
```

---

## 🚀 **How to Test**

### **1. Run the Updated SQL (if you haven't)**
```sql
-- Run this in Supabase SQL Editor:
-- File: supabase/migrations/20251004_fix_alignment_rls.sql
-- (Already provided earlier)
```

### **2. Access the Feature**

Once Railway deploys (5-10 mins after push):

1. Go to: `https://torsor-practice-platform-production.up.railway.app/365-alignment`
2. Click on **Tom Clark** or **Zaneta Clark**
3. Click the **"Vision Workflow"** tab (2nd tab)
4. You should see status: "Assessment Complete"

### **3. Generate Vision**

Click **"Generate Vision"** button:
- Should call Oracle API
- Should return 5-year vision
- Should open editor

**Expected vision structure:**
```json
{
  "vision_narrative": "2-3 paragraphs about their journey...",
  "north_star": "Their core desire in their own words",
  "year_1": {
    "headline": "...",
    "story": "...",
    "measurable": "..."
  },
  "year_3": { ... },
  "year_5": { ... },
  "archetype": "freedom_seeker",
  "emotional_core": "The deep truth about what they're seeking"
}
```

### **4. Edit Vision**

- Click **"Edit"** button
- Modify text
- Click **"Save Draft"**
- Click **"Finalize Vision"**

### **5. Upload Transcript**

- Click **"Choose File"**
- Upload a `.txt` file
- Click **"Analyze Transcript"** (currently shows placeholder)

### **6. Generate Roadmap**

Once vision is finalized:
- Click **"Generate Full Roadmap"**
- Should call Oracle API
- Should create shifts + sprints
- Should be visible in Oracle Method Portal

---

## 📋 **Next Session TODO**

### **Priority 1: Test Current Implementation**
- [ ] Run updated SQL in Supabase
- [ ] Wait for Railway deploy
- [ ] Test vision generation for Tom & Zaneta
- [ ] Verify vision appears in editor
- [ ] Test save/finalize workflow

### **Priority 2: Add Transcript Analysis**
- [ ] Create `transcriptEnrichmentService.ts`
- [ ] Write LLM prompt for insight extraction
- [ ] Implement data merging logic
- [ ] Update VisionWorkflowPanel to use new service
- [ ] Test with sample transcript

### **Priority 3: Add Vision-Only Generation**
- [ ] Update Oracle API `/generate-roadmap` endpoint
- [ ] Add `generate_vision_only` flag support
- [ ] Update TORSOR to use new flag
- [ ] Test that shifts/sprints aren't generated early

### **Priority 4: Gamma.app Export**
- [ ] Research Gamma.app API
- [ ] Implement PDF/PowerPoint export
- [ ] Add "Export to Gamma" button
- [ ] Test export workflow

---

## 🎊 **Summary**

We've built the foundation for a much better roadmap creation process:

✅ **Vision generation** - AI creates initial vision from assessments  
✅ **Vision editing** - Accountants can refine before sharing  
✅ **Transcript upload** - Store feedback call details  
⚠️ **Transcript analysis** - Next: extract insights with LLM  
⚠️ **Gamma export** - Next: create beautiful PDFs  
✅ **Roadmap generation** - Complete system after vision finalized  

The workflow now supports **human refinement** instead of pure automation, leading to more personalized and effective roadmaps that truly resonate with clients!

---

## 📞 **Questions?**

The system is now in a testable state. Let me know:
1. Does vision generation work?
2. Can you edit and save visions?
3. What do you think of the UI?
4. Ready to build transcript analysis next?

**Railway should finish deploying in 5-10 minutes!** 🚀

