# Unified upload check — is client data where it needs to be?

**One place:** Uploads → `client_accounts_uploads` → process-accounts-upload → `client_financial_data`.  
Discovery (and everything else) should read financials from `client_financial_data`.

Run the following in **Supabase SQL Editor** to see where a given engagement’s/client’s data lives.

---

## Alex (Polar London) — engagement and client IDs

- **Engagement ID:** `6cfb2a1c-d81a-4f97-afac-98c3132f92fa`
- **Client ID:** `d24e1c68-79e3-4dac-9336-a3d2ccf9ece8`

---

## Single query: unified upload audit for an engagement

Paste this and replace the engagement id if needed:

```sql
-- Replace with your engagement_id (e.g. Alex: 6cfb2a1c-d81a-4f97-afac-98c3132f92fa)
WITH e AS (
  SELECT id AS engagement_id, client_id
  FROM discovery_engagements
  WHERE id = '6cfb2a1c-d81a-4f97-afac-98c3132f92fa'
),
uploads_for_engagement AS (
  SELECT COUNT(*) AS n FROM client_accounts_uploads c, e WHERE c.engagement_id = e.engagement_id
),
uploads_for_client AS (
  SELECT COUNT(*) AS n FROM client_accounts_uploads c, e WHERE c.client_id = e.client_id
),
financial_rows AS (
  SELECT COUNT(*) AS n FROM client_financial_data f, e WHERE f.client_id = e.client_id
),
legacy_docs AS (
  SELECT COUNT(*) AS n FROM discovery_uploaded_documents d, e WHERE d.engagement_id = e.engagement_id
)
SELECT
  (SELECT engagement_id FROM e) AS engagement_id,
  (SELECT client_id FROM e) AS client_id,
  (SELECT n FROM uploads_for_engagement) AS client_accounts_uploads_linked_to_engagement,
  (SELECT n FROM uploads_for_client) AS client_accounts_uploads_for_client,
  (SELECT n FROM financial_rows) AS client_financial_data_rows,
  (SELECT n FROM legacy_docs) AS discovery_uploaded_documents_legacy;
```

**What “where it needs to be” looks like**

- **client_accounts_uploads_linked_to_engagement** ≥ 1 (upload went through the unified flow and is linked to this engagement).
- **client_financial_data_rows** ≥ 1 (processor has run and Pass 1/reports can use it).
- **discovery_uploaded_documents_legacy** can be 0 or > 0; legacy docs don’t feed `client_financial_data` unless re-uploaded via the new flow.

---

## Row-level detail (optional)

To see the actual rows for Alex’s client/engagement:

```sql
-- Alex's client_id
SELECT 'client_accounts_uploads' AS tbl, id, file_name, status, engagement_id, created_at
FROM client_accounts_uploads
WHERE client_id = 'd24e1c68-79e3-4dac-9336-a3d2ccf9ece8'
   OR engagement_id = '6cfb2a1c-d81a-4f97-afac-98c3132f92fa'
ORDER BY created_at DESC;

SELECT 'client_financial_data' AS tbl, id, fiscal_year, revenue, upload_id, created_at
FROM client_financial_data
WHERE client_id = 'd24e1c68-79e3-4dac-9336-a3d2ccf9ece8'
ORDER BY fiscal_year DESC;

SELECT 'discovery_uploaded_documents (legacy)' AS tbl, id, filename, uploaded_at
FROM discovery_uploaded_documents
WHERE engagement_id = '6cfb2a1c-d81a-4f97-afac-98c3132f92fa'
ORDER BY uploaded_at DESC;
```

---

## If Alex’s data is not in the unified tables

- **Before the unified flow:** Alex’s 4-year financial doc was uploaded only to Discovery “Documents” (storage + `discovery_uploaded_documents`). That path did *not* write to `client_accounts_uploads` or run the processor, so there were no rows in `client_financial_data` for that client.
- **After the change:** New Discovery uploads of PDF/CSV/Excel go through `upload-client-accounts` → `client_accounts_uploads` → process-accounts-upload → `client_financial_data`.
- **To get Alex’s information where it needs to be:** Re-upload the same financial file from the Discovery Admin modal (Documents / Upload). The new flow will create a row in `client_accounts_uploads` (with `engagement_id` and `source: 'discovery'`) and populate `client_financial_data`. Then re-run the first query above to confirm.
