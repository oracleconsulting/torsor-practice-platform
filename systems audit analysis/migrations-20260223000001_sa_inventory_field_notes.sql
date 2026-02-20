-- ============================================================================
-- SA System Inventory — Optional field context (Part 4C)
-- ============================================================================
-- Stores optional "Anything to add?" notes per dropdown field for system
-- inventory rows. Keyed by field name in JSONB.
-- ============================================================================

ALTER TABLE sa_system_inventory
  ADD COLUMN IF NOT EXISTS field_notes JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN sa_system_inventory.field_notes IS
  'Optional context notes keyed by field name, e.g., {"criticality": "...", "future_plan": "..."}';
