-- ============================================================================
-- ASSESSMENT PATTERNS TABLE
-- ============================================================================
-- Stores AI-generated pattern analysis for discovery assessments
-- This is Stage 2 of the multi-stage analysis pipeline
-- ============================================================================

-- LLM Execution History table for cost tracking
CREATE TABLE IF NOT EXISTS llm_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    execution_time_ms INTEGER,
    entity_type TEXT,
    entity_id UUID,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_llm_execution_history_function ON llm_execution_history(function_name);
CREATE INDEX idx_llm_execution_history_created ON llm_execution_history(created_at);
CREATE INDEX idx_llm_execution_history_entity ON llm_execution_history(entity_type, entity_id);

-- Assessment pattern analysis results
CREATE TABLE IF NOT EXISTS assessment_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES destination_discovery(id) ON DELETE CASCADE,
    client_id UUID REFERENCES practice_members(id) ON DELETE CASCADE,
    practice_id UUID REFERENCES practices(id),
    
    -- Destination clarity (AI-assessed, overrides rule-based scoring)
    destination_clarity_score INTEGER NOT NULL CHECK (destination_clarity_score >= 1 AND destination_clarity_score <= 10),
    destination_clarity_rationale TEXT NOT NULL,
    vision_strengths JSONB DEFAULT '[]',
    vision_gaps JSONB DEFAULT '[]',
    
    -- Contradictions detected between responses
    contradictions JSONB DEFAULT '[]',
    -- Format: [{ responses: string[], nature: string, significance: 'high'|'medium'|'low' }]
    
    -- Hidden signals (what they're NOT saying)
    hidden_signals JSONB DEFAULT '[]',
    -- Format: [{ signal: string, evidence: string, implication: string }]
    
    -- Emotional state mapping
    stress_level TEXT CHECK (stress_level IN ('high', 'medium', 'low')),
    burnout_risk TEXT CHECK (burnout_risk IN ('high', 'medium', 'low')),
    imposter_syndrome BOOLEAN DEFAULT FALSE,
    relationship_strain BOOLEAN DEFAULT FALSE,
    emotional_evidence JSONB DEFAULT '[]',
    
    -- True priority analysis
    stated_priority TEXT,
    actual_priority TEXT,
    priority_gap TEXT,
    
    -- Capital raising detection
    capital_raising_detected BOOLEAN DEFAULT FALSE,
    capital_raising_evidence JSONB DEFAULT '[]',
    capital_raising_urgency TEXT CHECK (capital_raising_urgency IN ('high', 'medium', 'low') OR capital_raising_urgency IS NULL),
    
    -- Lifestyle transformation detection
    lifestyle_transformation_detected BOOLEAN DEFAULT FALSE,
    transformation_type TEXT, -- e.g., 'operator_to_investor', 'founder_to_chairperson'
    
    -- Identity transition signals
    identity_transition JSONB DEFAULT '{}',
    -- Format: { currentIdentity: string, desiredIdentity: string, gapAnalysis: string }
    
    -- Metadata
    model_used TEXT NOT NULL,
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),
    execution_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessment_patterns_assessment_id ON assessment_patterns(assessment_id);
CREATE INDEX idx_assessment_patterns_client_id ON assessment_patterns(client_id);
CREATE INDEX idx_assessment_patterns_capital_raising ON assessment_patterns(capital_raising_detected) WHERE capital_raising_detected = TRUE;
CREATE INDEX idx_assessment_patterns_burnout ON assessment_patterns(burnout_risk) WHERE burnout_risk = 'high';

-- RLS
ALTER TABLE assessment_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_execution_history ENABLE ROW LEVEL SECURITY;

-- Users can view patterns for their practice assessments
CREATE POLICY "Team can view patterns for their practice"
ON assessment_patterns FOR SELECT
USING (
    practice_id IN (
        SELECT practice_id FROM practice_members 
        WHERE user_id = auth.uid() AND member_type = 'team'
    )
);

-- Service can insert/update patterns
CREATE POLICY "Service role can manage patterns"
ON assessment_patterns FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- LLM execution history is service-only (internal tracking)
CREATE POLICY "Service role can manage LLM history"
ON llm_execution_history FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_assessment_patterns_updated_at ON assessment_patterns;
CREATE TRIGGER set_assessment_patterns_updated_at
    BEFORE UPDATE ON assessment_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE assessment_patterns IS 'Stores AI-generated pattern analysis for discovery assessments - Stage 2 of analysis pipeline';
COMMENT ON TABLE llm_execution_history IS 'Tracks all LLM API calls for cost monitoring and debugging';
COMMENT ON COLUMN assessment_patterns.destination_clarity_score IS 'AI-assessed clarity score (1-10), overrides rule-based scoring';
COMMENT ON COLUMN assessment_patterns.capital_raising_detected IS 'Whether client shows investment/capital raising signals';
COMMENT ON COLUMN assessment_patterns.lifestyle_transformation_detected IS 'Whether client is seeking identity/role transformation';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Assessment Patterns Table' as type, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_patterns') 
            THEN 'Created' ELSE 'Failed' END as status
UNION ALL
SELECT 'LLM Execution History Table', 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'llm_execution_history') 
            THEN 'Created' ELSE 'Failed' END;
