-- ============================================================================
-- SA AUTO-SUGGEST CHAINS — Columns for auto-suggestion + cap
-- ============================================================================
-- Migration: 20260226000003_sa_auto_suggest_chains.sql
--
-- Tracks when chains were auto-suggested and enforces a maximum.
-- Adds suggestion_reason and source_template_id to process chains.
--
-- SAFE: All IF NOT EXISTS. No existing data modified.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. ENGAGEMENT COLUMNS — Auto-suggest tracking
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS auto_suggested_at TIMESTAMPTZ;

ALTER TABLE sa_engagements
  ADD COLUMN IF NOT EXISTS max_suggested_chains INTEGER NOT NULL DEFAULT 3;

COMMENT ON COLUMN sa_engagements.auto_suggested_at IS
  'When the system auto-suggested industry chains after Stage 1 completion';

COMMENT ON COLUMN sa_engagements.max_suggested_chains IS
  'Maximum number of suggested chains allowed per engagement. Default 3. Admin can override.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. PROCESS CHAIN COLUMNS — Suggestion metadata
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE sa_process_chains
  ADD COLUMN IF NOT EXISTS suggestion_reason TEXT;

ALTER TABLE sa_process_chains
  ADD COLUMN IF NOT EXISTS source_template_id UUID;

COMMENT ON COLUMN sa_process_chains.suggestion_reason IS
  'Human-readable reason this chain was suggested. Shown to client. E.g. "You flagged inventory management as a key concern"';

COMMENT ON COLUMN sa_process_chains.source_template_id IS
  'If this engagement chain was created from an industry template, the template chain ID';
