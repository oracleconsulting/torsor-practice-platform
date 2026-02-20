-- ============================================================================
-- SA Engagement Gaps — Pre-Generation Review
-- ============================================================================
-- Captures contextual gaps identified during practice review of client
-- responses. Resolved gaps feed additional context into report generation.
-- Gap tags are tracked across engagements for assessment improvement.
-- ============================================================================

CREATE TABLE IF NOT EXISTS sa_engagement_gaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,

    -- Classification
    gap_area TEXT NOT NULL DEFAULT 'cross_cutting'
        CHECK (gap_area IN (
            'stage_1_discovery',
            'stage_2_inventory',
            'stage_3_process',
            'cross_cutting'
        )),
    gap_tag TEXT,                    -- Reusable tag for cross-engagement tracking
                                     -- e.g., 'pricing_model_detail', 'staff_permissions',
                                     -- 'integration_specifics', 'growth_plans'
                                     -- Free text, but UI should autocomplete from existing tags

    -- The gap itself
    description TEXT NOT NULL,       -- What's missing or unclear
    source_question TEXT,            -- Which specific question prompted this (optional)

    -- Resolution from follow-up call
    resolution TEXT,                 -- What we learned on the call
    additional_context TEXT,         -- Extra info to feed into report generation AI

    -- Status
    status TEXT NOT NULL DEFAULT 'identified'
        CHECK (status IN ('identified', 'resolved', 'not_applicable', 'deferred')),

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sa_engagement_gaps_engagement ON sa_engagement_gaps(engagement_id);
CREATE INDEX IF NOT EXISTS idx_sa_engagement_gaps_tag ON sa_engagement_gaps(gap_tag);
CREATE INDEX IF NOT EXISTS idx_sa_engagement_gaps_status ON sa_engagement_gaps(status);

ALTER TABLE sa_engagement_gaps ENABLE ROW LEVEL SECURITY;

-- Practice members can CRUD gaps for engagements they manage
CREATE POLICY "Practice members can view gaps" ON sa_engagement_gaps
    FOR SELECT USING (
        engagement_id IN (
            SELECT e.id FROM sa_engagements e
            JOIN practice_members pm ON pm.practice_id = e.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Practice members can insert gaps" ON sa_engagement_gaps
    FOR INSERT WITH CHECK (
        engagement_id IN (
            SELECT e.id FROM sa_engagements e
            JOIN practice_members pm ON pm.practice_id = e.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Practice members can update gaps" ON sa_engagement_gaps
    FOR UPDATE USING (
        engagement_id IN (
            SELECT e.id FROM sa_engagements e
            JOIN practice_members pm ON pm.practice_id = e.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Practice members can delete gaps" ON sa_engagement_gaps
    FOR DELETE USING (
        engagement_id IN (
            SELECT e.id FROM sa_engagements e
            JOIN practice_members pm ON pm.practice_id = e.practice_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Add review tracking columns to sa_engagements
ALTER TABLE sa_engagements
    ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'not_started'
        CHECK (review_status IN ('not_started', 'in_progress', 'complete'));

ALTER TABLE sa_engagements
    ADD COLUMN IF NOT EXISTS review_completed_at TIMESTAMPTZ;

ALTER TABLE sa_engagements
    ADD COLUMN IF NOT EXISTS review_completed_by UUID REFERENCES auth.users(id);

ALTER TABLE sa_engagements
    ADD COLUMN IF NOT EXISTS review_notes TEXT;

COMMENT ON COLUMN sa_engagements.review_status IS
    'Pre-generation review status. Practice reviews client responses and resolves gaps before generating report.';
