-- Add optional context for data entry method (e.g. what is duplicated) for analysis.

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS data_entry_context TEXT;

COMMENT ON COLUMN sa_system_inventory.data_entry_context IS
  'Optional context for data entry method, e.g. what is duplicated: "Maria enters in both Xero and the Master Tracker"';
