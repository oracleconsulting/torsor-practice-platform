# Business Intelligence Service Line — Summary

**Purpose:** Reference for the Business Intelligence (BI) service in torsor-practice-platform: catalogue code, tiers, Discovery journey mapping, and popup behaviour. Kept in the discovery assessment analysis folder alongside the Benchmarking and Goal Alignment summaries.

---

## 1. Overview

### 1.1 What Business Intelligence Is

- **Display name:** Business Intelligence
- **Catalogue code:** `business_intelligence` (used in `service_catalogue`, client portal routes, and popup logic)
- **Related code:** `management_accounts` is treated as the same service in the client portal (routes redirect to BI). Discovery can recommend either; both should open the **Business Intelligence** popup, not Quarterly BI.
- **Outcome:** "You'll Know Your Numbers" — monthly financial visibility from basic clarity to strategic financial partnership.

### 1.2 How It Differs From Quarterly BI

- **Quarterly BI & Benchmarking** (`quarterly_bi`): Focus on quarterly reporting, benchmarking packs, and comparative analysis.
- **Business Intelligence** (`business_intelligence`): Monthly management information, cash visibility, forecasting, and tiered support (Clarity → Foresight → Strategic). Different product and popup.

Discovery recommendations can include either. The client portal must map each to the correct popup so "Learn more" opens the right service detail.

---

## 2. Tiers (Popup Content)

The Business Intelligence popup shows three tiers (from `apps/client-portal/src/lib/service-registry.ts`):

| Tier       | Tagline                 | Pricing (examples)                          |
|-----------|--------------------------|--------------------------------------------|
| **Clarity**  | See where you are        | Turnover-scaled; from £2,000/month        |
| **Foresight**| See where you could be   | From £3,000/month                          |
| **Strategic**| Your financial partner   | From £5,000/month (e.g. £7K at £5M turnover) |

Pricing is turnover-scaled (e.g. Clarity £3,500/month for a £5.2M business). The popup shows tier names, taglines, and price ranges; clients can "View Example" or "Talk to us".

---

## 3. Discovery → Popup Mapping (Fixed Feb 2026)

Discovery recommends services by **service code** (e.g. `BUSINESS_INTELLIGENCE`) or **name** (e.g. "Business Intelligence", "Management Accounts"). The client portal maps these to a **catalogue code** to decide which popup to open.

### 3.1 Where Mapping Lives

1. **`discoveryServiceToCatalogueCode`**  
   - **Files:** `apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx`, `apps/client-portal/src/components/DiscoveryReportView.tsx`  
   - **Role:** Maps recommended service code/name → catalogue code for "Learn more" in the report and journey.

2. **Inline maps in Page 3 journey (DiscoveryReportPage.tsx)**  
   - **nameToCatalogue:** Display name → catalogue code (e.g. `'Business Intelligence': 'business_intelligence'`).  
   - **codeToCatalogue:** Service code → catalogue code (e.g. `'business_intelligence': 'business_intelligence'`, `'management_accounts': 'business_intelligence'`).

### 3.2 Correct Mapping (After Fix)

- `BUSINESS_INTELLIGENCE` → `business_intelligence`
- `business_intelligence` → `business_intelligence`
- `management_accounts` → `business_intelligence`
- "Business Intelligence" (name) → `business_intelligence`
- "Management Accounts" (name) → `business_intelligence`

Name-based fallback order matters: **business intelligence / management account** must be checked **before** "quarterly" / "bi ", so that "Business Intelligence" and "Management Accounts" open the BI popup, not the Quarterly BI popup.

### 3.3 Bug That Was Fixed

Previously, `business_intelligence` and "Business Intelligence" were mapped to `quarterly_bi`, so "Learn more" on the Business Intelligence phase (Month 3–6) opened the **Quarterly BI & Benchmarking** popup instead of the **Business Intelligence** popup (Clarity/Foresight/Strategic). The fix:

- Added `BUSINESS_INTELLIGENCE` → `business_intelligence` in the explicit map.
- Set nameToCatalogue and codeToCatalogue for Business Intelligence and Management Accounts to `business_intelligence`.
- In `journeyPhaseToCatalogueCode` (DiscoveryReportView), added `BUSINESS_INTELLIGENCE` and `MANAGEMENT_ACCOUNTS` → `business_intelligence`, and split name fallbacks so "business intelligence" / "management account" return `business_intelligence` before "quarterly" / "bi " return `quarterly_bi`.

---

## 4. Key Files (Live Paths)

| Area           | Path |
|----------------|------|
| BI service def | `apps/client-portal/src/lib/service-registry.ts` — `business_intelligence` entry, tiers, pricing |
| Popup component| `apps/client-portal/src/components/ServiceRecommendationPopup.tsx` (or ServiceDetailPopup) — uses catalogue code to show correct content |
| Discovery page | `apps/client-portal/src/pages/discovery/DiscoveryReportPage.tsx` — `discoveryServiceToCatalogueCode`, nameToCatalogue, codeToCatalogue |
| Discovery view | `apps/client-portal/src/components/DiscoveryReportView.tsx` — `journeyPhaseToCatalogueCode` |
| BI report/dash  | `apps/client-portal/src/App.tsx` — routes for `/service/business_intelligence/report`, `/dashboard`, `/presentation`; `management_accounts` redirects to BI |

---

## 5. Copies in This Folder

- **Discovery:** `frontend-client-DiscoveryReportPage.tsx`, `frontend-client-DiscoveryReportView.tsx` (synced via `./scripts/sync-discovery-assessment-copies.sh`) contain the mapping logic above.
- **Related summaries:** `BENCHMARKING_SERVICE_LINE_SUMMARY-COPY.md`, `GOAL_ALIGNMENT_SUMMARY-COPY.md` (copies from the benchmarking and goal alignment analysis folders).

**Last updated:** February 2026 (after BI popup mapping fix).
