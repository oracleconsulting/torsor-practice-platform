-- CPD (Continuing Professional Development) System
-- Complete schema for tracking CPD activities, external links, and knowledge documents

-- =====================================================
-- 1. CPD ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cpd_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_member_id UUID NOT NULL REFERENCES public.practice_members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('course', 'seminar', 'webinar', 'reading', 'conference', 'workshop', 'certification', 'other')),
    provider VARCHAR(255),
    activity_date DATE NOT NULL,
    hours_claimed DECIMAL(5,2) NOT NULL DEFAULT 0,
    hours_verified DECIMAL(5,2),
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'GBP',
    category VARCHAR(100),
    description TEXT,
    learning_objectives TEXT,
    key_takeaways TEXT,
    certificate_url TEXT,
    external_link TEXT, -- Link to course/provider website
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    verifiable BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_cpd_activities_member ON public.cpd_activities(practice_member_id);
CREATE INDEX idx_cpd_activities_date ON public.cpd_activities(activity_date DESC);
CREATE INDEX idx_cpd_activities_status ON public.cpd_activities(status);
CREATE INDEX idx_cpd_activities_type ON public.cpd_activities(type);

-- =====================================================
-- 2. EXTERNAL CPD RESOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cpd_external_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('course', 'certification', 'webinar_series', 'training_platform', 'professional_body', 'other')),
    cost DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'GBP',
    duration VARCHAR(100), -- e.g., "3 days", "20 hours", "self-paced"
    skill_categories TEXT[], -- Array of relevant skill categories
    recommended_for TEXT[], -- Array of roles this is recommended for
    accredited_by VARCHAR(255),
    cpd_hours DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    added_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cpd_resources_practice ON public.cpd_external_resources(practice_id);
CREATE INDEX idx_cpd_resources_active ON public.cpd_external_resources(is_active);
CREATE INDEX idx_cpd_resources_type ON public.cpd_external_resources(type);

-- =====================================================
-- 3. KNOWLEDGE DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    cpd_activity_id UUID REFERENCES public.cpd_activities(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES public.practice_members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL, -- Required summary of learning
    document_type VARCHAR(50) CHECK (document_type IN ('cpd_summary', 'case_study', 'guide', 'template', 'notes', 'other')),
    file_name VARCHAR(255),
    file_path TEXT, -- Supabase storage path
    file_size_bytes BIGINT,
    file_type VARCHAR(100), -- MIME type
    tags TEXT[], -- Searchable tags
    skill_categories TEXT[], -- Related skill categories
    is_public BOOLEAN DEFAULT true, -- Visible to all team members
    download_count INTEGER DEFAULT 0,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_knowledge_docs_practice ON public.knowledge_documents(practice_id);
CREATE INDEX idx_knowledge_docs_cpd ON public.knowledge_documents(cpd_activity_id);
CREATE INDEX idx_knowledge_docs_uploader ON public.knowledge_documents(uploaded_by);
CREATE INDEX idx_knowledge_docs_public ON public.knowledge_documents(is_public);
CREATE INDEX idx_knowledge_docs_tags ON public.knowledge_documents USING GIN(tags);

-- =====================================================
-- 4. CPD REQUIREMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cpd_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    annual_hours_required DECIMAL(5,2) NOT NULL,
    verifiable_hours_minimum DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(practice_id, role)
);

-- Indexes
CREATE INDEX idx_cpd_requirements_practice ON public.cpd_requirements(practice_id);

-- =====================================================
-- 5. LINK CPD TO DEVELOPMENT PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.development_plan_cpd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    development_plan_id UUID NOT NULL REFERENCES public.development_goals(id) ON DELETE CASCADE,
    cpd_activity_id UUID REFERENCES public.cpd_activities(id) ON DELETE SET NULL,
    cpd_resource_id UUID REFERENCES public.cpd_external_resources(id) ON DELETE SET NULL,
    is_recommended BOOLEAN DEFAULT false,
    recommended_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT cpd_or_resource_required CHECK (
        (cpd_activity_id IS NOT NULL AND cpd_resource_id IS NULL) OR
        (cpd_activity_id IS NULL AND cpd_resource_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX idx_dev_plan_cpd_plan ON public.development_plan_cpd(development_plan_id);
CREATE INDEX idx_dev_plan_cpd_activity ON public.development_plan_cpd(cpd_activity_id);
CREATE INDEX idx_dev_plan_cpd_resource ON public.development_plan_cpd(cpd_resource_id);

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- CPD Activities - Members can see their own and managers can see team
ALTER TABLE public.cpd_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own CPD activities"
    ON public.cpd_activities FOR SELECT
    USING (
        practice_member_id IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Members can insert own CPD activities"
    ON public.cpd_activities FOR INSERT
    WITH CHECK (
        practice_member_id IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Members can update own CPD activities"
    ON public.cpd_activities FOR UPDATE
    USING (
        practice_member_id IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can view team CPD activities"
    ON public.cpd_activities FOR SELECT
    USING (
        practice_member_id IN (
            SELECT pm.id FROM public.practice_members pm
            WHERE pm.practice_id IN (
                SELECT practice_id FROM public.practice_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
            )
        )
    );

-- External CPD Resources - Practice-wide visibility
ALTER TABLE public.cpd_external_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view CPD resources"
    ON public.cpd_external_resources FOR SELECT
    USING (
        practice_id IN (
            SELECT practice_id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage CPD resources"
    ON public.cpd_external_resources FOR ALL
    USING (
        practice_id IN (
            SELECT practice_id FROM public.practice_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Knowledge Documents - Public within practice
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view public knowledge docs"
    ON public.knowledge_documents FOR SELECT
    USING (
        (is_public = true AND practice_id IN (
            SELECT practice_id FROM public.practice_members WHERE user_id = auth.uid()
        ))
        OR
        uploaded_by IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Members can upload knowledge documents"
    ON public.knowledge_documents FOR INSERT
    WITH CHECK (
        uploaded_by IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Uploaders can update their own documents"
    ON public.knowledge_documents FOR UPDATE
    USING (
        uploaded_by IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

-- CPD Requirements - Practice-wide visibility
ALTER TABLE public.cpd_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice members can view CPD requirements"
    ON public.cpd_requirements FOR SELECT
    USING (
        practice_id IN (
            SELECT practice_id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage CPD requirements"
    ON public.cpd_requirements FOR ALL
    USING (
        practice_id IN (
            SELECT practice_id FROM public.practice_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
        )
    );

-- Development Plan CPD - Link visibility follows development plan visibility
ALTER TABLE public.development_plan_cpd ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view CPD linked to their dev plans"
    ON public.development_plan_cpd FOR SELECT
    USING (
        development_plan_id IN (
            SELECT id FROM public.development_goals
            WHERE practice_member_id IN (
                SELECT id FROM public.practice_members WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Managers can link CPD to dev plans"
    ON public.development_plan_cpd FOR ALL
    USING (
        development_plan_id IN (
            SELECT dg.id FROM public.development_goals dg
            JOIN public.practice_members pm ON dg.practice_member_id = pm.id
            WHERE pm.practice_id IN (
                SELECT practice_id FROM public.practice_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
            )
        )
    );

-- =====================================================
-- 7. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_cpd_activities_updated_at
    BEFORE UPDATE ON public.cpd_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cpd_resources_updated_at
    BEFORE UPDATE ON public.cpd_external_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_docs_updated_at
    BEFORE UPDATE ON public.knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cpd_requirements_updated_at
    BEFORE UPDATE ON public.cpd_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample CPD requirements for common roles
INSERT INTO public.cpd_requirements (practice_id, role, annual_hours_required, verifiable_hours_minimum, description)
SELECT 
    p.id,
    role,
    hours_required,
    verifiable_minimum,
    description
FROM public.practices p
CROSS JOIN (VALUES
    ('owner', 40, 21, 'ACCA requirement for practicing certificate holders'),
    ('manager', 40, 21, 'ACCA requirement for practicing certificate holders'),
    ('senior', 40, 21, 'ACCA CPD requirement'),
    ('accountant', 40, 21, 'ACCA CPD requirement'),
    ('junior', 40, 0, 'Recommended CPD for professional development'),
    ('trainee', 20, 0, 'Foundation CPD for students')
) AS roles(role, hours_required, verifiable_minimum, description)
ON CONFLICT (practice_id, role) DO NOTHING;

-- Insert sample external CPD resources
INSERT INTO public.cpd_external_resources (
    practice_id,
    title,
    provider,
    url,
    description,
    type,
    duration,
    skill_categories,
    recommended_for,
    cpd_hours,
    is_active
)
SELECT 
    p.id,
    'ACCA Technical Webinars',
    'ACCA',
    'https://www.accaglobal.com/gb/en/member/cpd/resources.html',
    'Free technical webinars covering latest accounting standards and regulations',
    'webinar_series',
    'Various (1-2 hours each)',
    ARRAY['technical-accounting-audit', 'regulatory-compliance'],
    ARRAY['accountant', 'senior', 'manager'],
    1.5,
    true
FROM public.practices p
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.cpd_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cpd_external_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_documents TO authenticated;
GRANT SELECT ON public.cpd_requirements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.development_plan_cpd TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run these queries to verify the setup:
-- SELECT * FROM public.cpd_activities LIMIT 1;
-- SELECT * FROM public.cpd_external_resources LIMIT 1;
-- SELECT * FROM public.knowledge_documents LIMIT 1;
-- SELECT * FROM public.cpd_requirements;

