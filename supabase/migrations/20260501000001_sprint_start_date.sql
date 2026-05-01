-- Add sprint_start_date to client_service_lines so clients can choose when their sprint begins.
-- Week calculations use this instead of created_at/onboarding_completed_at.

ALTER TABLE client_service_lines ADD COLUMN IF NOT EXISTS sprint_start_date DATE;
