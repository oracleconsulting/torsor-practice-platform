-- ============================================================================
-- DISCOVERY REPORT SYSTEM
-- ============================================================================
-- Two-pass report generation with admin context and client narrative view
-- Similar structure to Systems Audit
-- ============================================================================

-- Discovery Engagements table (tracks overall status)
CREATE TABLE IF NOT EXISTS discovery_engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES practice_members(id) ON DELETE CASCADE,
    discovery_id UUID REFERENCES destination_discovery(id) ON DELETE SET NULL,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending_responses' CHECK (status IN (
        'pending_responses',     -- Waiting for client to complete assessment
        'responses_complete',    -- Client finished, ready for analysis
        'pass1_processing',      -- AI extracting data
        'pass1_complete',        -- Extraction done, ready for context
        'adding_context',        -- Admin adding notes/docs
        'pass2_processing',      -- AI generating narrative
        'pass2_complete',        -- Report generated
        'approved',              -- Admin approved
        'published',             -- Visible to client
        'delivered'              -- Client has viewed
    )),
    
    -- Timestamps
    assessment_started_at TIMESTAMPTZ,
    assessment_completed_at TIMESTAMPTZ,
    pass1_started_at TIMESTAMPTZ,
    pass1_completed_at TIMESTAMPTZ,
    pass2_started_at TIMESTAMPTZ,
    pass2_completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    -- Admin tracking
    approved_by UUID REFERENCES auth.users(id),
    published_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(client_id)
);

-- Discovery Reports table (stores generated report content)
CREATE TABLE IF NOT EXISTS discovery_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES discovery_engagements(id) ON DELETE CASCADE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'pass1_processing',
        'pass1_complete',
        'pass2_processing',
        'generated',
        'approved',
        'published'
    )),
    
    -- Pass 1 Results (structured extraction)
    service_scores JSONB,           -- Calculated scores per service
    detection_patterns JSONB,       -- Burnout, capital raising, lifestyle patterns
    emotional_anchors JSONB,        -- Key quotes from client responses
    urgency_multiplier DECIMAL(3,2),
    change_readiness TEXT,
    
    -- Top recommendations (structured)
    primary_recommendations JSONB,  -- Top 3 services with scores/triggers
    secondary_recommendations JSONB, -- Additional services above threshold
    
    -- Pass 2 Results (narrative content)
    headline TEXT,                  -- Attention-grabbing opener
    executive_summary TEXT,         -- 2-3 paragraph overview
    
    -- Personalized narratives using client's words
    vision_narrative TEXT,          -- Their Tuesday Test woven into story
    reality_check_narrative TEXT,   -- Current state analysis
    blind_spots_narrative TEXT,     -- What they might not see
    transformation_path TEXT,       -- How we get them there
    
    -- Service-specific narratives
    service_narratives JSONB,       -- Per-service why/what/how narratives
    
    -- Emotional connection sections
    what_we_heard TEXT,             -- "You told us..." section
    what_it_means TEXT,             -- Our interpretation
    what_changes TEXT,              -- The transformation promise
    
    -- Call to action
    next_steps TEXT,                -- Specific recommended actions
    conversation_starters JSONB,    -- Questions for discovery call
    
    -- LLM metadata
    llm_model TEXT,
    llm_tokens_used INTEGER,
    llm_cost DECIMAL(10,4),
    generation_time_ms INTEGER,
    prompt_version TEXT,
    
    -- Timestamps
    pass1_completed_at TIMESTAMPTZ,
    pass2_completed_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(engagement_id)
);

-- Discovery Documents table
CREATE TABLE IF NOT EXISTS discovery_uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES discovery_engagements(id) ON DELETE CASCADE,
    
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes INTEGER,
    
    -- Document categorization
    document_type TEXT DEFAULT 'general' CHECK (document_type IN (
        'general',
        'financial_data',
        'org_chart',
        'process_doc',
        'client_provided',
        'previous_assessment',
        'other'
    )),
    
    description TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- AI processing flags
    is_for_ai_analysis BOOLEAN DEFAULT TRUE,
    ai_summary TEXT,
    
    metadata JSONB
);

-- Discovery Context Notes table
CREATE TABLE IF NOT EXISTS discovery_context_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES discovery_engagements(id) ON DELETE CASCADE,
    
    note_type TEXT NOT NULL CHECK (note_type IN (
        'discovery_call',       -- Notes from discovery/sales call
        'follow_up_answer',     -- Answers to follow-up questions
        'advisor_observation',  -- Advisor's observations
        'client_email',         -- Relevant email content
        'meeting_notes',        -- Notes from meetings
        'background_context',   -- Industry/company background
        'relationship_history', -- Previous engagement history
        'general_note'
    )),
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    -- Optional linking
    related_question_id TEXT,       -- Link to specific assessment question
    related_service_code TEXT,      -- Link to specific service recommendation
    
    source TEXT,                    -- e.g., "Discovery Call 2026-01-15"
    
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- AI processing
    is_for_ai_analysis BOOLEAN DEFAULT TRUE
);

-- Enable RLS
ALTER TABLE discovery_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_context_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discovery_engagements
DROP POLICY IF EXISTS "Team members can manage engagements" ON discovery_engagements;
DROP POLICY IF EXISTS "Clients can view own engagement" ON discovery_engagements;
DROP POLICY IF EXISTS "Service role full access de" ON discovery_engagements;

CREATE POLICY "Team members can manage engagements" ON discovery_engagements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = discovery_engagements.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "Clients can view own engagement" ON discovery_engagements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.id = discovery_engagements.client_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access de" ON discovery_engagements
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for discovery_reports
DROP POLICY IF EXISTS "Team members can manage reports" ON discovery_reports;
DROP POLICY IF EXISTS "Clients can view published reports" ON discovery_reports;
DROP POLICY IF EXISTS "Service role full access dr" ON discovery_reports;

CREATE POLICY "Team members can manage reports" ON discovery_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            JOIN discovery_engagements de ON de.id = discovery_reports.engagement_id
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = de.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "Clients can view published reports" ON discovery_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            JOIN discovery_engagements de ON de.id = discovery_reports.engagement_id
            WHERE pm.id = de.client_id
            AND pm.user_id = auth.uid()
            AND discovery_reports.status IN ('published')
        )
    );

CREATE POLICY "Service role full access dr" ON discovery_reports
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for discovery_uploaded_documents
DROP POLICY IF EXISTS "Team members can manage documents" ON discovery_uploaded_documents;
DROP POLICY IF EXISTS "Clients can upload documents" ON discovery_uploaded_documents;
DROP POLICY IF EXISTS "Service role full access dud" ON discovery_uploaded_documents;

CREATE POLICY "Team members can manage documents" ON discovery_uploaded_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            JOIN discovery_engagements de ON de.id = discovery_uploaded_documents.engagement_id
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = de.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "Clients can upload documents" ON discovery_uploaded_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            JOIN discovery_engagements de ON de.id = discovery_uploaded_documents.engagement_id
            WHERE pm.id = de.client_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role full access dud" ON discovery_uploaded_documents
    FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for discovery_context_notes
DROP POLICY IF EXISTS "Team members can manage context" ON discovery_context_notes;
DROP POLICY IF EXISTS "Service role full access dcn" ON discovery_context_notes;

CREATE POLICY "Team members can manage context" ON discovery_context_notes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM practice_members pm
            JOIN discovery_engagements de ON de.id = discovery_context_notes.engagement_id
            WHERE pm.user_id = auth.uid()
            AND pm.practice_id = de.practice_id
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "Service role full access dcn" ON discovery_context_notes
    FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovery_engagements_practice_id ON discovery_engagements(practice_id);
CREATE INDEX IF NOT EXISTS idx_discovery_engagements_client_id ON discovery_engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_discovery_engagements_status ON discovery_engagements(status);
CREATE INDEX IF NOT EXISTS idx_discovery_reports_engagement_id ON discovery_reports(engagement_id);
CREATE INDEX IF NOT EXISTS idx_discovery_reports_status ON discovery_reports(status);
CREATE INDEX IF NOT EXISTS idx_discovery_documents_engagement_id ON discovery_uploaded_documents(engagement_id);
CREATE INDEX IF NOT EXISTS idx_discovery_context_engagement_id ON discovery_context_notes(engagement_id);

-- Storage bucket for discovery documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('discovery-documents', 'discovery-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Team members can upload discovery docs" ON storage.objects;
DROP POLICY IF EXISTS "Team members can view discovery docs" ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload own discovery docs" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view own discovery docs" ON storage.objects;

CREATE POLICY "Team members can upload discovery docs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'discovery-documents'
        AND EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "Team members can view discovery docs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'discovery-documents'
        AND EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND (pm.member_type = 'team' OR pm.role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "Clients can upload own discovery docs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'discovery-documents'
        AND EXISTS (
            SELECT 1 FROM practice_members pm
            WHERE pm.user_id = auth.uid()
            AND pm.member_type = 'client'
        )
    );

CREATE POLICY "Clients can view own discovery docs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'discovery-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM practice_members WHERE user_id = auth.uid()
        )
    );

-- Function to auto-create engagement when discovery is started
CREATE OR REPLACE FUNCTION create_discovery_engagement()
RETURNS TRIGGER AS $$
BEGIN
    -- Create engagement if doesn't exist
    INSERT INTO discovery_engagements (practice_id, client_id, discovery_id, status, assessment_started_at)
    VALUES (NEW.practice_id, NEW.client_id, NEW.id, 'pending_responses', NOW())
    ON CONFLICT (client_id) DO UPDATE SET
        discovery_id = NEW.id,
        assessment_started_at = COALESCE(discovery_engagements.assessment_started_at, NOW()),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trigger_create_discovery_engagement ON destination_discovery;
CREATE TRIGGER trigger_create_discovery_engagement
    AFTER INSERT ON destination_discovery
    FOR EACH ROW
    EXECUTE FUNCTION create_discovery_engagement();

-- Function to update engagement status when discovery is completed
CREATE OR REPLACE FUNCTION update_discovery_engagement_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if all required fields are filled (simplified check)
    IF NEW.dd_five_year_vision IS NOT NULL 
       AND NEW.dd_change_readiness IS NOT NULL 
       AND NEW.sd_financial_confidence IS NOT NULL THEN
        
        UPDATE discovery_engagements
        SET status = 'responses_complete',
            assessment_completed_at = NOW(),
            updated_at = NOW()
        WHERE discovery_id = NEW.id
        AND status = 'pending_responses';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create update trigger
DROP TRIGGER IF EXISTS trigger_update_discovery_status ON destination_discovery;
CREATE TRIGGER trigger_update_discovery_status
    AFTER UPDATE ON destination_discovery
    FOR EACH ROW
    EXECUTE FUNCTION update_discovery_engagement_status();

