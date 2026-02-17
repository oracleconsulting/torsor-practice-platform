-- Add optional context for data entry method (e.g. what is duplicated) for analysis.

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS data_entry_context TEXT;

COMMENT ON COLUMN sa_system_inventory.data_entry_context IS
  'Optional context for data entry method, e.g. what is duplicated: "Maria enters in both Xero and the Master Tracker"';

-- Optional descriptors for usage frequency and cost trend (e.g. "supposed to be — actual compliance ~60%", "adding seats as team grows").

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS usage_frequency_context TEXT,
  ADD COLUMN IF NOT EXISTS cost_trend_context TEXT;

COMMENT ON COLUMN sa_system_inventory.usage_frequency_context IS
  'Optional context for usage frequency, e.g. "supposed to be daily — actual compliance ~60%"';
COMMENT ON COLUMN sa_system_inventory.cost_trend_context IS
  'Optional context for cost trend, e.g. "adding seats as team grows"';

-- Optional descriptor for future plan (e.g. "but open to replacing if something better exists").

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS future_plan_context TEXT;

COMMENT ON COLUMN sa_system_inventory.future_plan_context IS
  'Optional context for future plan, e.g. "but open to replacing if something better exists"';

-- When category is "other", optional description (e.g. "Design"). When primary users includes "Other", optional description (e.g. "design team").

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS category_other_description TEXT,
  ADD COLUMN IF NOT EXISTS primary_users_other TEXT;

COMMENT ON COLUMN sa_system_inventory.category_other_description IS
  'When category_code is other, optional description e.g. "Design"';
COMMENT ON COLUMN sa_system_inventory.primary_users_other IS
  'When primary_users includes Other, optional description e.g. "design team"';
