-- ============================================================================
-- DISCOVERY LEARNING SYSTEM
-- Enables admin comments on analysis sections and builds a perpetual 
-- learning library for future analysis generation
-- ============================================================================

-- ============================================================================
-- TABLE: discovery_analysis_comments
-- Comments/corrections on specific sections of generated discovery analyses
-- ============================================================================

CREATE TABLE IF NOT EXISTS discovery_analysis_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Links
    engagement_id UUID NOT NULL REFERENCES discovery_engagements(id) ON DELETE CASCADE,
    report_id UUID REFERENCES discovery_reports(id) ON DELETE SET NULL,
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    
    -- What section is being commented on
    section_type TEXT NOT NULL CHECK (section_type IN (
        'page1_destination',      -- Vision/Destination section
        'page2_gaps',             -- Gap analysis section
        'page2_gap_item',         -- Specific gap within page 2
        'page3_journey',          -- Overall journey section
        'page3_phase',            -- Specific phase in the journey
        'page4_investment',       -- Investment/numbers section
        'page4_cost_of_staying',  -- Cost analysis
        'page4_returns',          -- ROI/returns section
        'page5_next_steps',       -- Next steps section
        'page5_first_step',       -- First recommended step
        'recommendation',         -- Specific service recommendation
        'general'                 -- General comment about the analysis
    )),
    
    -- For section_type = 'page2_gap_item', 'page3_phase', 'recommendation'
    section_index INTEGER,           -- Which gap/phase/recommendation (0-indexed)
    section_identifier TEXT,         -- e.g., "gap-founder-dependency", "phase-month-1-3", "fractional_coo"
    
    -- The content being commented on (snapshot)
    original_content JSONB NOT NULL, -- The original generated content being commented on
    
    -- The comment/correction
    comment_type TEXT NOT NULL CHECK (comment_type IN (
        'correction',             -- This is wrong, should be X
        'suggestion',             -- Consider adding/changing X
        'removal',                -- Remove this entirely
        'tone',                   -- Tone/wording issue
        'factual_error',          -- Factual mistake
        'better_alternative',     -- There's a better recommendation
        'praise'                  -- This is good, learn from it
    )),
    
    comment_text TEXT NOT NULL,      -- The actual comment/feedback
    suggested_replacement TEXT,      -- Optional: what it should say instead
    
    -- Learning extraction
    extracted_learning TEXT,         -- What principle/pattern to learn from this
    learning_category TEXT CHECK (learning_category IN (
        'tone_style',             -- How to write/speak
        'service_appropriateness', -- When to recommend/not recommend services
        'client_stage_detection', -- Identifying client stages correctly
        'financial_analysis',     -- How to analyse/present financials
        'recommendation_logic',   -- Logic for making recommendations
        'personalization',        -- How to personalise content
        'industry_specific',      -- Industry-specific knowledge
        'objection_handling',     -- How to handle/anticipate objections
        'value_proposition',      -- How to frame value
        'general'
    )),
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',                -- Just added, not reviewed
        'approved',               -- Approved for learning extraction
        'applied',                -- Applied to regeneration
        'rejected',               -- Rejected (not a valid correction)
        'archived'                -- Old/superseded
    )),
    
    -- For linking to regeneration
    applied_to_regeneration BOOLEAN DEFAULT FALSE,
    regeneration_timestamp TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ
);

-- Indexes for fast lookup
CREATE INDEX idx_dac_engagement ON discovery_analysis_comments(engagement_id);
CREATE INDEX idx_dac_practice ON discovery_analysis_comments(practice_id);
CREATE INDEX idx_dac_section ON discovery_analysis_comments(section_type);
CREATE INDEX idx_dac_status ON discovery_analysis_comments(status);
CREATE INDEX idx_dac_learning ON discovery_analysis_comments(learning_category) WHERE status = 'approved';

-- ============================================================================
-- TABLE: practice_learning_library
-- The perpetual learning database that accumulates wisdom over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_learning_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id UUID NOT NULL REFERENCES practices(id) ON DELETE CASCADE,
    
    -- What this learning teaches
    learning_type TEXT NOT NULL CHECK (learning_type IN (
        'style_preference',       -- Tone, voice, writing style
        'service_logic',          -- When to recommend services
        'anti_pattern',           -- What NOT to do
        'success_pattern',        -- What works well
        'client_archetype',       -- Types of clients and how to handle them
        'industry_insight',       -- Industry-specific knowledge
        'phrase_preference',      -- Preferred phrases/terminology
        'calculation_method',     -- How to calculate/present numbers
        'objection_response',     -- How to handle objections
        'value_framing'           -- How to frame value propositions
    )),
    
    -- The learning itself
    title TEXT NOT NULL,             -- Short descriptive title
    description TEXT NOT NULL,       -- Full description of the learning
    
    -- Context for when this applies
    applies_to_client_stages TEXT[], -- e.g., ['exit-focused', 'pre-revenue']
    applies_to_industries TEXT[],    -- e.g., ['saas', 'manufacturing']
    applies_to_services TEXT[],      -- e.g., ['fractional_coo', 'business_advisory']
    applies_to_sections TEXT[],      -- e.g., ['page2_gaps', 'page4_investment']
    
    -- The pattern/example
    context_example TEXT,            -- The specific client context that triggered this
    before_example TEXT,             -- What the AI generated (before correction)
    after_example TEXT,              -- What the human corrected it to (after)
    
    -- Structured learning for LLM consumption
    learning_rule TEXT NOT NULL,     -- The rule in clear, actionable terms
    learning_rationale TEXT,         -- Why this matters
    
    -- Confidence and usage
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- 0-1 confidence in this learning
    times_applied INTEGER DEFAULT 0,  -- How many times this has been used
    times_validated INTEGER DEFAULT 0, -- How many times it was correct when used
    last_applied_at TIMESTAMPTZ,
    
    -- Source tracking
    source_comment_id UUID REFERENCES discovery_analysis_comments(id) ON DELETE SET NULL,
    source_client_id UUID REFERENCES practice_members(id) ON DELETE SET NULL,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pll_practice ON practice_learning_library(practice_id);
CREATE INDEX idx_pll_type ON practice_learning_library(learning_type);
CREATE INDEX idx_pll_active ON practice_learning_library(practice_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_pll_services ON practice_learning_library USING GIN(applies_to_services);
CREATE INDEX idx_pll_stages ON practice_learning_library USING GIN(applies_to_client_stages);

-- ============================================================================
-- TABLE: learning_application_log
-- Track when learnings are applied to analysis generation
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_application_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Links
    learning_id UUID NOT NULL REFERENCES practice_learning_library(id) ON DELETE CASCADE,
    engagement_id UUID NOT NULL REFERENCES discovery_engagements(id) ON DELETE CASCADE,
    report_id UUID REFERENCES discovery_reports(id) ON DELETE SET NULL,
    
    -- Application details
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    section_applied_to TEXT,
    
    -- Validation
    was_helpful BOOLEAN,             -- Did it improve the output?
    feedback_notes TEXT,
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ
);

CREATE INDEX idx_lal_learning ON learning_application_log(learning_id);
CREATE INDEX idx_lal_engagement ON learning_application_log(engagement_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE discovery_analysis_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_learning_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_application_log ENABLE ROW LEVEL SECURITY;

-- discovery_analysis_comments policies
CREATE POLICY "dac_team_access" ON discovery_analysis_comments
    FOR ALL USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid() 
            AND (member_type = 'team' OR role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "dac_service_role" ON discovery_analysis_comments
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- practice_learning_library policies
CREATE POLICY "pll_team_access" ON practice_learning_library
    FOR ALL USING (
        practice_id IN (
            SELECT practice_id FROM practice_members 
            WHERE user_id = auth.uid() 
            AND (member_type = 'team' OR role IN ('admin', 'member', 'owner'))
        )
    );

CREATE POLICY "pll_service_role" ON practice_learning_library
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- learning_application_log policies
CREATE POLICY "lal_team_access" ON learning_application_log
    FOR ALL USING (
        learning_id IN (
            SELECT id FROM practice_learning_library WHERE practice_id IN (
                SELECT practice_id FROM practice_members 
                WHERE user_id = auth.uid() 
                AND (member_type = 'team' OR role IN ('admin', 'member', 'owner'))
            )
        )
    );

CREATE POLICY "lal_service_role" ON learning_application_log
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- FUNCTION: Extract learning from approved comment
-- Called when a comment is approved to automatically create a learning entry
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_learning_from_comment()
RETURNS TRIGGER
SECURITY DEFINER
AS $$
DECLARE
    v_client_stage TEXT;
    v_industry TEXT;
BEGIN
    -- Only trigger on status change to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Only extract if learning category is set
        IF NEW.learning_category IS NOT NULL AND NEW.extracted_learning IS NOT NULL THEN
            
            -- Get client context for the learning
            SELECT 
                de.client_stage
            INTO v_client_stage
            FROM discovery_engagements de
            WHERE de.id = NEW.engagement_id;
            
            -- Industry is not available on practice_members, so we leave it null
            v_industry := NULL;
            
            -- Create learning entry
            INSERT INTO practice_learning_library (
                practice_id,
                learning_type,
                title,
                description,
                applies_to_client_stages,
                applies_to_industries,
                applies_to_sections,
                context_example,
                before_example,
                after_example,
                learning_rule,
                learning_rationale,
                source_comment_id,
                created_by
            ) VALUES (
                NEW.practice_id,
                CASE NEW.learning_category
                    WHEN 'tone_style' THEN 'style_preference'
                    WHEN 'service_appropriateness' THEN 'service_logic'
                    WHEN 'recommendation_logic' THEN 'service_logic'
                    WHEN 'client_stage_detection' THEN 'client_archetype'
                    WHEN 'financial_analysis' THEN 'calculation_method'
                    WHEN 'personalization' THEN 'style_preference'
                    WHEN 'industry_specific' THEN 'industry_insight'
                    WHEN 'objection_handling' THEN 'objection_response'
                    WHEN 'value_proposition' THEN 'value_framing'
                    ELSE 'success_pattern'
                END,
                COALESCE(
                    'Learning: ' || LEFT(NEW.comment_text, 50),
                    'Learning from ' || NEW.section_type
                ),
                NEW.extracted_learning,
                CASE WHEN v_client_stage IS NOT NULL 
                    THEN ARRAY[v_client_stage] 
                    ELSE ARRAY[]::TEXT[] 
                END,
                CASE WHEN v_industry IS NOT NULL 
                    THEN ARRAY[v_industry] 
                    ELSE ARRAY[]::TEXT[] 
                END,
                ARRAY[NEW.section_type],
                NEW.original_content::TEXT,
                NEW.original_content::TEXT,
                NEW.suggested_replacement,
                NEW.extracted_learning,
                NEW.comment_text,
                NEW.source_comment_id,
                NEW.created_by
            );
            
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_extract_learning_from_comment ON discovery_analysis_comments;
CREATE TRIGGER trg_extract_learning_from_comment
    AFTER UPDATE ON discovery_analysis_comments
    FOR EACH ROW
    EXECUTE FUNCTION extract_learning_from_comment();

-- ============================================================================
-- FUNCTION: Get relevant learnings for a client
-- Used by generate-discovery-analysis to fetch applicable learnings
-- ============================================================================

CREATE OR REPLACE FUNCTION get_relevant_learnings(
    p_practice_id UUID,
    p_client_stage TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_services TEXT[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    learning_type TEXT,
    title TEXT,
    learning_rule TEXT,
    learning_rationale TEXT,
    before_example TEXT,
    after_example TEXT,
    confidence_score DECIMAL,
    times_validated INTEGER
)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pll.id,
        pll.learning_type,
        pll.title,
        pll.learning_rule,
        pll.learning_rationale,
        pll.before_example,
        pll.after_example,
        pll.confidence_score,
        pll.times_validated
    FROM practice_learning_library pll
    WHERE pll.practice_id = p_practice_id
      AND pll.is_active = TRUE
      AND (
          -- General learnings always apply
          (pll.applies_to_client_stages = '{}' OR pll.applies_to_client_stages IS NULL)
          OR 
          -- Stage-specific learnings
          (p_client_stage IS NOT NULL AND p_client_stage = ANY(pll.applies_to_client_stages))
      )
      AND (
          -- General learnings always apply
          (pll.applies_to_industries = '{}' OR pll.applies_to_industries IS NULL)
          OR
          -- Industry-specific learnings
          (p_industry IS NOT NULL AND p_industry = ANY(pll.applies_to_industries))
      )
      AND (
          -- General learnings always apply
          (pll.applies_to_services = '{}' OR pll.applies_to_services IS NULL)
          OR
          -- Service-specific learnings
          (p_services IS NOT NULL AND pll.applies_to_services && p_services)
      )
    ORDER BY 
        pll.confidence_score DESC,
        pll.times_validated DESC,
        pll.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE discovery_analysis_comments IS 'Admin comments and corrections on generated discovery analyses. These feed into the learning library.';
COMMENT ON TABLE practice_learning_library IS 'Perpetual learning database that accumulates wisdom from corrections to improve future analyses.';
COMMENT ON TABLE learning_application_log IS 'Tracks when learnings from the library are applied to analysis generation.';

COMMENT ON FUNCTION get_relevant_learnings IS 'Fetches applicable learnings for a client based on their stage, industry, and recommended services.';

