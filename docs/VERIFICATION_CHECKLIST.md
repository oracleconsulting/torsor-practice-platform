# Discovery Opportunity Management — Verification Checklist

**Test Engagement**: Alex (Polar Advertising) - `6cfb2a1c-d81a-4f97-afac-98c3132f92fa`

**Unified upload (financials in one place):** To verify Alex’s (or any engagement’s) data is in `client_accounts_uploads` and `client_financial_data`, run the SQL in [UNIFIED_UPLOAD_CHECK.md](./UNIFIED_UPLOAD_CHECK.md) in the Supabase SQL Editor.

---

## ✅ DEPLOYMENT STATUS

### Database:
- [x] Migration `20260207103430_discovery_opportunity_enhancements.sql` deployed
- [x] Added `pinned_services TEXT[]` to `discovery_engagements`
- [x] Added `blocked_services TEXT[]` to `discovery_engagements`
- [x] Added `recommended_services JSONB` to `discovery_reports`
- [x] Added `not_recommended_services JSONB` to `discovery_reports`
- [x] Added `opportunity_assessment JSONB` to `discovery_reports`
- [x] Created RLS policy for client access

### Backend:
- [x] `generate-discovery-opportunities` deployed

### Frontend:
- [x] `ServicePinBlockControl.tsx` created
- [x] `DiscoveryOpportunityPanel.tsx` updated with Create Service modal
- [x] `DiscoveryAdminModal.tsx` updated with pin/block controls and How We Can Help preview
- [x] `DiscoveryReportPage.tsx` updated with client-facing How We Can Help section

---

## TEST 1: CREATE SERVICE

Test with Alex's engagement:

- [ ] Navigate to Discovery Admin Modal → Opportunities tab
- [ ] Find an opportunity with a NEW CONCEPT (purple "New Service Concept" label)
- [ ] Click "Create Service" button
- [ ] Modal opens pre-filled with:
  - Service Name: concept's `suggested_name`
  - Description: concept's `problem_it_solves`
  - Category: opportunity's `category`
- [ ] Fill in price (e.g., 2000) and pricing model (e.g., "One-off")
- [ ] Click "Create Service"
- [ ] Verify:
  - New row appears in `services` table (check Supabase dashboard)
  - `service_concepts.review_status` = 'approved'
  - `service_concepts.promoted_to_service_id` = new service ID
  - Opportunity now shows service name instead of concept
  - Opportunity `show_in_client_view` = true

---

## TEST 2: PIN/BLOCK SERVICES

- [ ] Navigate to Discovery Admin Modal → Context tab
- [ ] Scroll down to "Service Preferences" section
- [ ] See list of all active services with pin (📌) and block (🚫) buttons
- [ ] Pin a service (e.g., "Agency Profitability Review"):
  - Button turns green
  - Service row highlights green
  - Check database: `discovery_engagements.pinned_services` contains service code
- [ ] Block a different service (e.g., "Exit Planning"):
  - Button turns red
  - Service row highlights red
  - Check database: `discovery_engagements.blocked_services` contains service code
- [ ] Try to pin a blocked service:
  - Service becomes pinned, no longer blocked
  - Can't be both simultaneously
- [ ] Try to block a pinned service:
  - Service becomes blocked, no longer pinned

---

## TEST 3: PIN/BLOCK ENFORCEMENT IN PASS 3

**Setup**: Pin "Benchmarking Deep Dive", Block "Exit Planning"

- [ ] Regenerate Pass 3 (delete opportunities, run `generate-discovery-opportunities`)
- [ ] Check console logs:
  - "⭐ MUST INCLUDE these services" shows in LLM prompt
  - "🚫 DO NOT RECOMMEND these services" shows in LLM prompt
  - `[Pass 3] Adding pinned service: BENCHMARKING_DEEP_DIVE` (if wasn't already present)
  - `[Pass 3] Blocked service EXIT_PLANNING from opportunity: [title]` (if LLM tried to suggest it)
- [ ] Check results:
  - Pinned service appears in opportunities even if data doesn't strongly support
  - Blocked service does NOT appear (or appears as new concept alternative)

---

## TEST 4: STALE DUPLICATES FIX

- [ ] Regenerate Pass 3 twice in a row
- [ ] Check console log: `[Discovery Pass 3] Cleared previous opportunities for clean insert`
- [ ] Check database: opportunity count equals what Pass 3 generated
- [ ] No duplicate services (e.g., not "Agency Profitability Audit ×2")
- [ ] Admin modal Opportunities tab shows correct count

---

## TEST 5: HOW WE CAN HELP — ADMIN PREVIEW

- [ ] Navigate to Discovery Admin Modal → Report tab
- [ ] Toggle to "Client View" (not "Call Script")
- [ ] Scroll to after Page 5 section
- [ ] See "How We Can Help" section
- [ ] Verify:
  - Section header: "Services Matched To Your Situation"
  - Each card shows:
    - Service name (h3, semibold)
    - "Why This Matters" text (personalised from life impacts)
    - "What this addresses" list (if multiple opportunities map to same service)
    - Price (right side, large, amber)
    - Total value at stake (if > 0, shows "↗ £XX,XXX potential")
  - Hidden opportunity count message at bottom (if applicable)

---

## TEST 6: HOW WE CAN HELP — CLIENT PORTAL

- [ ] Navigate to client portal: `client.torsor.co` (or local dev)
- [ ] Log in as Alex
- [ ] View Discovery Report
- [ ] "How We Can Help" section appears between Page 3 (Journey) and Page 4 (Numbers)
- [ ] Verify same card layout as admin preview:
  - Service name, why it matters, addresses list
  - Price is clickable → opens `ServiceDetailPopup`
  - Total value at stake shown
  - Styling matches rest of report (serif headings, amber accents, slate text)
- [ ] RLS works: only loads `recommended_services` from their own report

---

## TEST 7: RECOMMENDED SERVICES GENERATION

Check the `discovery_reports.recommended_services` JSON structure:

```sql
SELECT recommended_services, opportunity_assessment
FROM discovery_reports
WHERE engagement_id = '6cfb2a1c-d81a-4f97-afac-98c3132f92fa';
```

Expected structure:
```json
{
  "recommended_services": [
    {
      "serviceCode": "BENCHMARKING_DEEP_DIVE",
      "serviceName": "Agency Profitability Review",
      "displayPrice": "£2,000",
      "pricingModel": "fixed",
      "totalValueAtStake": 62000,
      "whyThisMatters": "You're spending 62% on people vs industry benchmark of 45%...",
      "addresses": [
        "Payroll Efficiency Gap",
        "Contractor Cost Management"
      ],
      "primaryOpportunityTitle": "Payroll Efficiency Gap",
      "severity": "high",
      "priority": "next_3_months",
      "fitScore": 85
    }
  ],
  "opportunity_assessment": {
    "totalOpportunities": 12,
    "totalValue": 248000,
    "criticalCount": 2,
    "highCount": 5
  }
}
```

---

## EDGE CASES TO TEST

- [ ] No opportunities generated (Pass 3 returns empty) → How We Can Help section doesn't appear
- [ ] All opportunities are concepts (no existing services) → How We Can Help section doesn't appear
- [ ] Only 1 opportunity per service → "What this addresses" list doesn't show
- [ ] Pin a service that LLM would have recommended anyway → doesn't duplicate
- [ ] Block ALL services → Pass 3 generates only new concepts

---

## EXPECTED CONSOLE LOGS

### Pass 3:
```
[Discovery Pass 3] Gathered data for client: Alex Redmond
[Pass 3] ⭐ Pinned services: BENCHMARKING_DEEP_DIVE
[Pass 3] 🚫 Blocked services: EXIT_PLANNING
[Pass 3] Blocked service EXIT_PLANNING from opportunity: Exit Readiness Assessment
[Pass 3] Adding pinned service: BENCHMARKING_DEEP_DIVE
[Discovery Pass 3] Cleared previous opportunities for clean insert
[GenerateRecommendedServices] Created 6 synthesised recommendations
[Discovery Pass 3] Generated 6 authoritative service recommendations
[Discovery Pass 3] Recommended: BENCHMARKING_DEEP_DIVE, SYSTEMS_AUDIT, ...
```

### Client Report:
```
[Report] ✅ Using NEW Pass 1/2 format
[Report] Loaded 6 recommended services
```

---

## SUCCESS CRITERIA

All phases complete when:

1. ✅ Create Service button works, promotes concepts to catalogue
2. ✅ Pin/Block controls save and load correctly
3. ✅ Pass 3 respects pinned/blocked services
4. ✅ No stale duplicate opportunities across regenerations
5. ✅ Admin preview shows "How We Can Help" synthesised from Pass 3
6. ✅ Client portal shows same "How We Can Help" section
7. ✅ RLS allows clients to see only their own recommendations
8. ✅ Service cards match design: serif, amber, slate, rounded-xl

All features match benchmarking system parity.
