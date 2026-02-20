-- Add advisor notes for sprint generation context
ALTER TABLE client_service_lines ADD COLUMN IF NOT EXISTS advisor_notes TEXT;

COMMENT ON COLUMN client_service_lines.advisor_notes IS
  'Advisor notes injected into sprint generation prompts. Updated before triggering renewal generation.';
