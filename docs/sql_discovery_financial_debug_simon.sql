-- =============================================================================
-- Debug: What's in the database for Simon Jacques (financial upload not available to discovery analysis)
-- Client ID: 022927a3-899d-4e2a-8b40-dcc975d7684d
-- Engagement ID (from logs): 7aec4f6b-7b5a-4223-840e-dc06ac714f82
-- Run in Supabase SQL Editor (run each block or all).
-- =============================================================================

-- 1. Client (practice_members)
SELECT '1. practice_members (client)' AS section;
SELECT id, name, email, client_company, practice_id, program_status
FROM practice_members
WHERE id = '022927a3-899d-4e2a-8b40-dcc975d7684d';

-- 2. Discovery engagement
SELECT '2. discovery_engagements' AS section;
SELECT id, client_id, status, created_at
FROM discovery_engagements
WHERE client_id = '022927a3-899d-4e2a-8b40-dcc975d7684d';

-- 3. destination_discovery (assessment responses)
SELECT '3. destination_discovery' AS section;
SELECT id, client_id, practice_id,
       (responses IS NOT NULL AND responses != '{}'::jsonb) AS has_responses,
       completed_at
FROM destination_discovery
WHERE client_id = '022927a3-899d-4e2a-8b40-dcc975d7684d';

-- 4. client_accounts_uploads (uploaded files – used by upload-client-accounts)
SELECT '4. client_accounts_uploads' AS section;
SELECT id, client_id, file_name, file_type, status, storage_path,
       fiscal_year, extraction_confidence, processing_completed_at, created_at
FROM client_accounts_uploads
WHERE client_id = '022927a3-899d-4e2a-8b40-dcc975d7684d'
ORDER BY created_at DESC;

-- 5. client_financial_data (extracted by process-accounts-upload – NOT read by prepare-discovery-data)
SELECT '5. client_financial_data' AS section;
SELECT id, client_id, upload_id, fiscal_year, fiscal_year_end,
       revenue, ebitda, net_profit, staff_costs, employee_count, data_source
FROM client_financial_data
WHERE client_id = '022927a3-899d-4e2a-8b40-dcc975d7684d'
ORDER BY fiscal_year DESC;

-- 6. client_financial_context (only table prepare-discovery-data uses for financialContext)
SELECT '6. client_financial_context' AS section;
SELECT *
FROM client_financial_context
WHERE client_id = '022927a3-899d-4e2a-8b40-dcc975d7684d';

-- 7. discovery_uploaded_documents (documents prepare-discovery-data loads for discovery)
SELECT '7. discovery_uploaded_documents' AS section;
SELECT *
FROM discovery_uploaded_documents
WHERE engagement_id = '7aec4f6b-7b5a-4223-840e-dc06ac714f82';

-- Summary: why analysis sees "NO FINANCIAL DATA"
-- • prepare-discovery-data gets financialContext only from client_financial_context (table 6).
-- • Upload flow writes to client_accounts_uploads (4) and process-accounts-upload writes to client_financial_data (5).
-- • So if client_financial_context is empty, analysis gets no financials even when client_financial_data has rows.
-- • Documents are loaded from discovery_uploaded_documents (7) or client-documents storage; uploads go to client-accounts bucket and are not in discovery_uploaded_documents.
