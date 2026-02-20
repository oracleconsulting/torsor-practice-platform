-- ============================================================================
-- Systems Audit: Documents & Context Tables
-- ============================================================================
-- Adds document upload and context capture for Systems Audit service line
-- ============================================================================

-- ============================================================================
-- TABLE: sa_uploaded_documents
-- ============================================================================
-- Tracks documents uploaded for Systems Audit analysis

CREATE TABLE IF NOT EXISTS sa_uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,
    
    -- Document Info
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes INTEGER,
    
    -- Document classification
    document_type TEXT DEFAULT 'general'
        CHECK (document_type IN ('general', 'process_map', 'system_screenshot', 'integration_doc', 'contract', 'org_chart', 'other')),
    description TEXT,
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_sa_documents_engagement ON sa_uploaded_documents(engagement_id);

-- ============================================================================
-- TABLE: sa_context_notes
-- ============================================================================
-- Stores follow-up answers, call transcripts, and additional context

CREATE TABLE IF NOT EXISTS sa_context_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES sa_engagements(id) ON DELETE CASCADE,
    
    -- Note Type
    note_type TEXT NOT NULL 
        CHECK (note_type IN ('followup_answer', 'call_transcript', 'meeting_notes', 'observation', 'general')),
    
    -- Content
    title TEXT,
    content TEXT NOT NULL,
    
    -- For followup answers, link to the original question
    related_question TEXT,
    
    -- Metadata
    source TEXT, -- e.g., "Client call 14/01/2026", "Site visit"
    recorded_at TIMESTAMPTZ,
    
    -- For transcripts
    transcript_type TEXT CHECK (transcript_type IN ('call', 'meeting', 'interview', 'site_visit')),
    duration_minutes INTEGER,
    participants TEXT[],
    
    -- Flags for AI processing
    include_in_analysis BOOLEAN DEFAULT TRUE,
    key_insights TEXT[], -- Extracted key points
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sa_context_engagement ON sa_context_notes(engagement_id);
CREATE INDEX idx_sa_context_type ON sa_context_notes(note_type);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE sa_uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sa_context_notes ENABLE ROW LEVEL SECURITY;

-- Policies for sa_uploaded_documents
CREATE POLICY "sa_documents_policy" ON sa_uploaded_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sa_engagements e
            WHERE e.id = sa_uploaded_documents.engagement_id
            AND (
                -- Practice members can access
                e.practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
                OR e.practice_id = current_setting('app.practice_id', true)::UUID
                -- Clients can access their own
                OR e.client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- Policies for sa_context_notes  
CREATE POLICY "sa_context_policy" ON sa_context_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sa_engagements e
            WHERE e.id = sa_context_notes.engagement_id
            AND (
                -- Practice members can access
                e.practice_id IN (
                    SELECT practice_id FROM practice_members WHERE user_id = auth.uid()
                )
                OR e.practice_id = current_setting('app.practice_id', true)::UUID
                -- Clients can access their own
                OR e.client_id IN (
                    SELECT id FROM practice_members WHERE user_id = auth.uid()
                )
            )
        )
    );

-- ============================================================================
-- STORAGE BUCKET POLICY (if not already exists for SA)
-- ============================================================================
-- Note: Run this separately in storage policy if needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('sa-documents', 'sa-documents', false);

COMMENT ON TABLE sa_uploaded_documents IS 'Documents uploaded as part of Systems Audit engagements';
COMMENT ON TABLE sa_context_notes IS 'Follow-up answers, call transcripts, and additional context for Systems Audit';

