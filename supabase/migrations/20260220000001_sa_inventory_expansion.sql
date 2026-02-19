-- ============================================================================
-- SA System Inventory Expansion
-- Adds fields for deeper system understanding: key users by name,
-- actual usage vs capability, training status, setup ownership,
-- contract commitment, and shadow systems capture
-- ============================================================================

-- New columns on sa_system_inventory
ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS key_users_by_name TEXT;

COMMENT ON COLUMN sa_system_inventory.key_users_by_name IS
  'Named individuals who use this system and how. e.g. "Maria uses it daily, Sophie checks it weekly"';

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS actual_usage_description TEXT;

COMMENT ON COLUMN sa_system_inventory.actual_usage_description IS
  'What people actually use this system for vs what it is capable of. e.g. "We only use 20% of Monday features"';

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS training_status TEXT
    CHECK (training_status IN ('formal_training', 'self_taught', 'one_person_knows', 'nobody_really_knows'));

COMMENT ON COLUMN sa_system_inventory.training_status IS
  'How was the team trained on this system? formal_training | self_taught | one_person_knows | nobody_really_knows';

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS setup_owner TEXT;

COMMENT ON COLUMN sa_system_inventory.setup_owner IS
  'Who originally set up / configured this system, and are they still around? e.g. "Previous office manager, left 2022"';

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS contract_commitment TEXT
    CHECK (contract_commitment IN ('month_to_month', 'annual_locked', 'multi_year', 'free', 'dont_know'));

COMMENT ON COLUMN sa_system_inventory.contract_commitment IS
  'Contract lock-in status: month_to_month | annual_locked | multi_year | free | dont_know';

-- Shadow systems capture (stored on engagement, not per-system)
ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS shadow_systems_description TEXT;

COMMENT ON COLUMN sa_engagements.shadow_systems_description IS
  'Free-text capture of unofficial tools, personal spreadsheets, WhatsApp groups, etc. that staff actually rely on but are not in the formal system inventory';
