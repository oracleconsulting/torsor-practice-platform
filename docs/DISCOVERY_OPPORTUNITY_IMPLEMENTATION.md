# Discovery Opportunity Management — Full Implementation Guide

**Status**: In Progress  
**Date**: 7 Feb 2026  
**Objective**: Bring discovery assessment's opportunity system to parity with benchmarking

---

## ✅ Phase 1: Study Benchmarking Pattern (COMPLETE)

Reviewed:
- `generate-bm-opportunities/index.ts` - storeOpportunities, generateRecommendedServices, postProcessOpportunities
- `RecommendedServicesSection.tsx` - client-facing synthesised view
- `OpportunityPanel.tsx` - admin "Create Service" button handler

---

## ✅ Phase 2: Database Migration (COMPLETE)

Migration file created: `supabase/migrations/[timestamp]_discovery_opportunity_enhancements.sql`

**Changes**:
- Added `pinned_services TEXT[]` and `blocked_services TEXT[]` to `discovery_engagements`
- Added `recommended_services JSONB`, `not_recommended_services JSONB`, `opportunity_assessment JSONB` to `discovery_reports`
- Ensured `description` column exists on `discovery_opportunities`
- Created RLS policy for client access to approved opportunities
- Added performance indexes

---

## Phase 3: Backend — Pass 3 Enhancements

File: `supabase/functions/generate-discovery-opportunities/index.ts`

### ✅ Phase 3a: DELETE-before-insert (COMPLETE)
Already implemented in Fix 2 earlier. The `storeOpportunities()` function now:
```typescript
// Delete old opportunities before inserting new ones
const { error: deleteError } = await supabase
  .from('discovery_opportunities')
  .delete()
  .eq('engagement_id', engagementId);
```

### Phase 3b: Read pinned/blocked services from engagement

**Location**: `gatherAllClientData()` function

**Add to ClientData interface**:
```typescript
pinnedServices: string[];
blockedServices: string[];
```

**Add to return object**:
```typescript
pinnedServices: engagement.pinned_services || [],
blockedServices: engagement.blocked_services || [],
```

### Phase 3c: Feed pin/block into LLM prompt

**Location**: User prompt section (after context notes)

**Add section**:
```typescript
## ADVISOR SERVICE PREFERENCES

${clientData.pinnedServices.length > 0 
  ? `MUST INCLUDE these services (advisor has specifically requested them):
${clientData.pinnedServices.map(s => `- ${s}`).join('\n')}

Create an opportunity for each pinned service even if the data doesn't strongly support it.`
  : 'No pinned services.'}

${clientData.blockedServices.length > 0 
  ? `DO NOT RECOMMEND these services (advisor has specifically excluded them):
${clientData.blockedServices.map(s => `- ${s}`).join('\n')}`
  : 'No blocked services.'}
```

### Phase 3d: Post-processing enforce pin/block

**Location**: After LLM returns, in post-processing pipeline

**Remove blocked services**:
```typescript
if (clientData.blockedServices.length > 0) {
  for (const opp of analysis.opportunities) {
    const serviceCode = opp.serviceMapping?.existingService?.code;
    if (serviceCode && clientData.blockedServices.includes(serviceCode)) {
      console.log(`[Pass 3] Blocked service ${serviceCode}`);
      // Remap to new concept instead
      opp.serviceMapping.newConceptNeeded = { /* ... */ };
      opp.serviceMapping.existingService = null;
    }
  }
}
```

**Ensure pinned services appear**:
```typescript
if (clientData.pinnedServices.length > 0) {
  for (const pinnedCode of clientData.pinnedServices) {
    const alreadyPresent = analysis.opportunities.some(
      o => o.serviceMapping?.existingService?.code === pinnedCode
    );
    if (!alreadyPresent) {
      // Add pinned service opportunity
    }
  }
}
```

### Phase 3e: Generate recommended_services synthesis

**New function**: `generateRecommendedServices()`

**Purpose**: Group opportunities by service, build "Why This Matters", calculate total value

**Store result**: Save to `discovery_reports.recommended_services`

---

## Phase 4: Frontend Admin Changes

### Phase 4a: Working "Create Service" Button

**File**: `src/components/discovery/DiscoveryOpportunityPanel.tsx`

**Add state**:
```typescript
const [showCreateModal, setShowCreateModal] = useState(false);
const [createServiceData, setCreateServiceData] = useState<any>(null);
```

**Implement handler**:
```typescript
const handleCreateService = async (opportunityId, conceptId) => {
  // Pre-fill modal with concept data
  // On confirm:
  //   1. Insert into services table
  //   2. Update service_concepts (review_status: approved, promoted_to_service_id)
  //   3. Link opportunity to new service
  //   4. Toggle show_in_client_view = true
};
```

**Add modal JSX** for service creation form

### Phase 4b: Pin/Block Controls in Context Tab

**File**: `src/components/discovery/DiscoveryAdminModal.tsx`

**New component**: `ServicePinBlockControl.tsx`

**UI**:
- List of all active services
- Each row has 📌 pin button and 🚫 block button
- Green highlight when pinned, red when blocked
- Save to `discovery_engagements.pinned_services` / `blocked_services`

**Add to Context & Docs tab** after context notes list

### Phase 4c: Client Preview: "How We Can Help" Section

**File**: `src/components/discovery/DiscoveryAdminModal.tsx`

**Load**: `report?.recommended_services`

**Render in `renderClientPreview()`**: After Page 5, before closing `</div>`

**Card layout**:
- Service name, price
- "Why This Matters" personalised copy
- "Addresses" list (if multiple opportunities map to same service)
- Total value at stake

---

## Phase 5: Frontend Client — "How We Can Help"

**File**: `src/pages/client/DiscoveryReportPage.tsx` (or apps/client-portal equivalent)

**Load**: `discoveryReport?.recommended_services`

**Render**: Between Page 3 (journey) and Page 4 (numbers)

**Card layout**: Same as admin preview
- Serif headings, amber accents, slate text
- Rounded-xl cards
- Price is clickable → service detail popup
- Match existing report styling

---

## Verification Checklist

Test with Alex's engagement:

### Create Service:
- [ ] Go to Opportunities tab → expand concept opportunity → click "Create Service"
- [ ] Modal pre-fills with concept data
- [ ] On confirm: new row in `services`, concept updated, opportunity linked
- [ ] Opportunity auto-toggled to `show_in_client_view: true`

### Pin/Block:
- [ ] Go to Context & Docs tab → Service Preferences section
- [ ] Pin a service → green highlight, saved to DB
- [ ] Block a service → red highlight, saved to DB
- [ ] Can't be both pinned and blocked
- [ ] Regenerate Pass 3 → pinned service appears
- [ ] Regenerate Pass 3 → blocked service does NOT appear

### Stale Duplicates (already fixed):
- [x] Regenerate Pass 3 → log shows "Cleared previous opportunities"
- [x] Opportunity count matches what Pass 3 generated
- [x] No duplicate services

### How We Can Help (Admin):
- [ ] Report tab → Client View → section appears after Page 5
- [ ] Shows synthesised recommendations grouped by service
- [ ] Each card shows service name, price, why it matters, addresses list

### How We Can Help (Client):
- [ ] Navigate to client report
- [ ] Section appears between Page 3 and Page 4
- [ ] Same cards as admin preview
- [ ] RLS works — only their own report's recommendations load

---

## Implementation Priority

1. ✅ Database migration
2. Backend Pass 3 (phases 3b-3e) - **NEXT**
3. Frontend admin (phases 4a-4c)
4. Frontend client (phase 5)
5. Testing & verification

---

## Notes

- `recommended_services` JSONB on `discovery_reports` is the **single source of truth** for client-facing "How We Can Help"
- Generated by Pass 3 backend, not assembled client-side from individual opportunities
- Client report doesn't query `discovery_opportunities` table — reads `discovery_reports.recommended_services`
- Admin Opportunities tab remains the raw view for internal management
- Match existing report styling: serif headings, amber accents, slate text, rounded-xl cards
