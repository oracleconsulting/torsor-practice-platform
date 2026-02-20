-- ============================================================================
-- CLIENT CONTEXT NOTES
-- ============================================================================
-- Date-stamped contextual notes that advisors can add to provide critical
-- business context that may not be captured in assessments or documents.
-- Examples: "Raised £1m seed round", "Product launching January 2025", 
-- "Secured 3 pilot customers"
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_context_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id UUID REFERENCES practices(id),
    
    -- The note content
    note_type TEXT NOT NULL DEFAULT 'general' CHECK (note_type IN (
        'funding',           -- Investment/capital raised
        'milestone',         -- Product launch, expansion, etc.
        'customer',          -- Customer wins, pilots, contracts
        'team',              -- Key hires, departures
        'financial',         -- Revenue updates, burn rate changes
        'personal',          -- Founder personal circumstances
        'strategic',         -- Pivots, strategy changes
        'general'            -- Other context
    )),
    
    title TEXT NOT NULL,                    -- Brief headline
    content TEXT NOT NULL,                  -- Full details
    
    -- When did this happen/will happen?
    event_date DATE,                        -- The date of the event (past or future)
    is_future_event BOOLEAN DEFAULT FALSE,  -- Is this a planned future event?
    
    -- Importance for analysis
    importance TEXT DEFAULT 'medium' CHECK (importance IN ('critical', 'high', 'medium', 'low')),
    include_in_analysis BOOLEAN DEFAULT TRUE,  -- Should LLM see this?
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_context_notes_client ON client_context_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_context_notes_practice ON client_context_notes(practice_id);
CREATE INDEX IF NOT EXISTS idx_context_notes_type ON client_context_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_context_notes_date ON client_context_notes(event_date);
CREATE INDEX IF NOT EXISTS idx_context_notes_analysis ON client_context_notes(client_id, include_in_analysis) 
    WHERE include_in_analysis = TRUE;

-- Enable RLS
ALTER TABLE client_context_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Practice members can view their clients' notes"
    ON client_context_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = client_context_notes.practice_id
        )
        OR
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = client_context_notes.client_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Practice members can insert notes for their clients"
    ON client_context_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = client_context_notes.practice_id
        )
    );

CREATE POLICY "Practice members can update their clients' notes"
    ON client_context_notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = client_context_notes.practice_id
        )
    );

CREATE POLICY "Practice members can delete their clients' notes"
    ON client_context_notes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = client_context_notes.practice_id
        )
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_context_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_context_notes_timestamp
    BEFORE UPDATE ON client_context_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_context_notes_updated_at();

-- ============================================================================
-- SAMPLE DATA (for Ben Stocken - you can remove after testing)
-- ============================================================================
-- INSERT INTO client_context_notes (client_id, practice_id, note_type, title, content, event_date, is_future_event, importance)
-- SELECT 
--     pm.id as client_id,
--     pm.practice_id,
--     'funding',
--     'Closed seed round',
--     'Raised nearly £1m in seed funding from angel investors and early-stage VCs. This addresses the capital constraint mentioned in the assessment.',
--     '2024-11-15',
--     false,
--     'critical'
-- FROM practice_members pm
-- WHERE pm.email = 'ben@atheriohq.com'
-- LIMIT 1;



