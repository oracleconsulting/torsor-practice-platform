# Discovery UI – Where Data Lives

This doc maps **Supabase tables** to **what the Discovery modal shows**. Use it to debug “data still showing after reset” and to run surgical deletes or audits.

## How the UI loads data

- **Client** is identified by `client_id` = `practice_members.id` (the id passed when you open the modal).
- **Engagement** = single row from `discovery_engagements` where `client_id` = that id, ordered by `created_at DESC`, limit 1.
- All report/opportunities fetches use that **engagement.id**.

If the modal’s `client_id` and the `client_id` on `discovery_engagements` don’t match (e.g. different client record), the reset will clear a different engagement than the one the UI is showing.

---

## Table → UI mapping

| Table | Key filter | What it feeds |
|-------|------------|----------------|
| **discovery_engagements** | `client_id` = modal clientId, `ORDER BY created_at DESC LIMIT 1` | Engagement row; UI uses `.id` for all child fetches. Status, pinned/blocked. |
| **discovery_reports** | `engagement_id` = engagement.id | **Analysis tab**: purple headline, Destination Clarity, Gap Score, `comprehensive_analysis`. |
| **discovery_opportunities** | `engagement_id` = engagement.id | **Analysis tab**: “Service Opportunities” list (e.g. 12 items with £25K, etc.). |
| **client_reports** | `client_id`, `report_type = 'discovery_analysis'`, latest by `created_at` | **Analysis tab**: “Loaded existing report”, Export PDF, Share with Client. |
| **client_context** | `client_id`, `context_type = 'document'` | **Documents tab**: uploaded document content (e.g. Polar London text). |
| **client_financial_context** | `client_id` | Used by Pass 1 extraction; not shown directly in modal. |
| **destination_discovery** | `client_id` (or email match) | **Responses** tab + analysis_notes. *Kept by reset.* |
| **client_context_notes** | `client_id` | **Context Notes** tab. *Kept by reset.* |
| **discovery_analysis_comments** | `engagement_id` | Learning/comments. *Cleared by reset.* |

---

## Auditing in Supabase

After applying the migration `20260209140000_discovery_data_audit.sql`:

**By client (modal’s client_id):**
```sql
SELECT discovery_data_audit_for_client('YOUR_CLIENT_UUID');
```

**By engagement (e.g. from console log `[Report] Opportunities fetch for engagement: 6cfb2a1c-...`):**
```sql
SELECT discovery_data_audit_for_engagement('6cfb2a1c-d81a-4f97-afac-98c3132f92fa');
```
This returns that engagement’s `client_id` — use that when calling the reset if it differs from the modal.

---

## Reset behaviour

- **`reset_discovery_financials_and_analysis_for_client(p_client_id)`**  
  Deletes: `client_financial_context`, `client_reports` (discovery_analysis), `client_context` (document), `discovery_opportunities`, `discovery_reports`, `discovery_analysis_comments` for **all** engagements where `discovery_engagements.client_id = p_client_id`. Resets those engagements to `responses_complete`.  
  So the **same** `client_id` the UI uses must be passed; otherwise a different engagement (or none) is cleared.

---

## Quick checks when “still all showing”

1. In the modal, click **Audit**. Check console for `[Discovery Audit] client_id` and the full audit JSON.
2. In the console, note **engagement_id** from `[Report] Opportunities fetch for engagement: ...`.
3. In Supabase SQL Editor run:
   - `SELECT discovery_data_audit_for_engagement('ENGAGEMENT_ID');`  
   Compare returned `client_id` to the modal’s client_id (from step 1). If they differ, the UI is showing an engagement for a different client than the one you’re resetting.
4. Run `SELECT discovery_data_audit_for_client('MODAL_CLIENT_ID');` and confirm it lists the same engagement and the report/opportunity counts you expect before and after reset.
