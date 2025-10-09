-- CPD (Continuing Professional Development) System - V2 (Simplified)
-- This version doesn't require the practices table to exist yet

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
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cpd_activities_member ON public.cpd_activities(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_date ON public.cpd_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_status ON public.cpd_activities(status);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_type ON public.cpd_activities(type);

-- =====================================================
-- 2. EXTERNAL CPD RESOURCES TABLE (No practice_id for now)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cpd_external_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    added_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cpd_resources_active ON public.cpd_external_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_cpd_resources_type ON public.cpd_external_resources(type);

-- =====================================================
-- 3. KNOWLEDGE DOCUMENTS TABLE (Linked to members, not practice)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    is_public BOOLEAN DEFAULT true, -- Visible to all team members in same practice
    download_count INTEGER DEFAULT 0,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_cpd ON public.knowledge_documents(cpd_activity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_uploader ON public.knowledge_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_public ON public.knowledge_documents(is_public);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_tags ON public.knowledge_documents USING GIN(tags);

-- =====================================================
-- 4. CPD REQUIREMENTS TABLE (Stored by role, not practice-specific initially)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cpd_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(100) NOT NULL UNIQUE,
    annual_hours_required DECIMAL(5,2) NOT NULL,
    verifiable_hours_minimum DECIMAL(5,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. LINK CPD TO DEVELOPMENT PLANS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.development_plan_cpd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    development_plan_id UUID NOT NULL REFERENCES public.development_goals(id) ON DELETE CASCADE,
    cpd_activity_id UUID REFERENCES public.cpd_activities(id) ON DELETE SET NULL,
    cpd_resource_id UUID REFERENCES public.cpd_external_resources(id) ON DELETE SET NULL,
    is_recommended BOOLEAN DEFAULT false,
    recommended_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT cpd_or_resource_required CHECK (
        (cpd_activity_id IS NOT NULL AND cpd_resource_id IS NULL) OR
        (cpd_activity_id IS NULL AND cpd_resource_id IS NOT NULL)
    )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dev_plan_cpd_plan ON public.development_plan_cpd(development_plan_id);
CREATE INDEX IF NOT EXISTS idx_dev_plan_cpd_activity ON public.development_plan_cpd(cpd_activity_id);
CREATE INDEX IF NOT EXISTS idx_dev_plan_cpd_resource ON public.development_plan_cpd(cpd_resource_id);

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- CPD Activities - Members can see their own
ALTER TABLE public.cpd_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own CPD activities" ON public.cpd_activities;
CREATE POLICY "Members can view own CPD activities"
    ON public.cpd_activities FOR SELECT
    USING (
        practice_member_id IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can insert own CPD activities" ON public.cpd_activities;
CREATE POLICY "Members can insert own CPD activities"
    ON public.cpd_activities FOR INSERT
    WITH CHECK (
        practice_member_id IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can update own CPD activities" ON public.cpd_activities;
CREATE POLICY "Members can update own CPD activities"
    ON public.cpd_activities FOR UPDATE
    USING (
        practice_member_id IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Managers can view team CPD activities" ON public.cpd_activities;
CREATE POLICY "Managers can view team CPD activities"
    ON public.cpd_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.practice_members pm1
            WHERE pm1.id = cpd_activities.practice_member_id
            AND pm1.practice_id IN (
                SELECT pm2.practice_id FROM public.practice_members pm2
                WHERE pm2.user_id = auth.uid() AND pm2.role IN ('owner', 'admin', 'manager')
            )
        )
    );

-- External CPD Resources - Public for all authenticated users
ALTER TABLE public.cpd_external_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active CPD resources" ON public.cpd_external_resources;
CREATE POLICY "Anyone can view active CPD resources"
    ON public.cpd_external_resources FOR SELECT
    USING (is_active = true OR added_by = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can add CPD resources" ON public.cpd_external_resources;
CREATE POLICY "Authenticated users can add CPD resources"
    ON public.cpd_external_resources FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own CPD resources" ON public.cpd_external_resources;
CREATE POLICY "Users can update their own CPD resources"
    ON public.cpd_external_resources FOR UPDATE
    USING (added_by = auth.uid());

-- Knowledge Documents - Team members in same practice can view
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members can view public knowledge docs" ON public.knowledge_documents;
CREATE POLICY "Team members can view public knowledge docs"
    ON public.knowledge_documents FOR SELECT
    USING (
        (is_public = true AND EXISTS (
            SELECT 1 FROM public.practice_members pm1
            JOIN public.practice_members pm2 ON pm1.practice_id = pm2.practice_id
            WHERE pm1.id = knowledge_documents.uploaded_by
            AND pm2.user_id = auth.uid()
        ))
        OR
        uploaded_by IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can upload knowledge documents" ON public.knowledge_documents;
CREATE POLICY "Members can upload knowledge documents"
    ON public.knowledge_documents FOR INSERT
    WITH CHECK (
        uploaded_by IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Uploaders can update their own documents" ON public.knowledge_documents;
CREATE POLICY "Uploaders can update their own documents"
    ON public.knowledge_documents FOR UPDATE
    USING (
        uploaded_by IN (
            SELECT id FROM public.practice_members WHERE user_id = auth.uid()
        )
    );

-- CPD Requirements - Public for all authenticated users
ALTER TABLE public.cpd_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view CPD requirements" ON public.cpd_requirements;
CREATE POLICY "Anyone can view CPD requirements"
    ON public.cpd_requirements FOR SELECT
    TO authenticated
    USING (true);

-- Development Plan CPD
ALTER TABLE public.development_plan_cpd ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view CPD linked to their dev plans" ON public.development_plan_cpd;
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

DROP POLICY IF EXISTS "Managers can link CPD to dev plans" ON public.development_plan_cpd;
CREATE POLICY "Managers can link CPD to dev plans"
    ON public.development_plan_cpd FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.development_goals dg
            JOIN public.practice_members pm1 ON dg.practice_member_id = pm1.id
            JOIN public.practice_members pm2 ON pm1.practice_id = pm2.practice_id
            WHERE dg.id = development_plan_cpd.development_plan_id
            AND pm2.user_id = auth.uid()
            AND pm2.role IN ('owner', 'admin', 'manager')
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
DROP TRIGGER IF EXISTS update_cpd_activities_updated_at ON public.cpd_activities;
CREATE TRIGGER update_cpd_activities_updated_at
    BEFORE UPDATE ON public.cpd_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cpd_resources_updated_at ON public.cpd_external_resources;
CREATE TRIGGER update_cpd_resources_updated_at
    BEFORE UPDATE ON public.cpd_external_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_docs_updated_at ON public.knowledge_documents;
CREATE TRIGGER update_knowledge_docs_updated_at
    BEFORE UPDATE ON public.knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cpd_requirements_updated_at ON public.cpd_requirements;
CREATE TRIGGER update_cpd_requirements_updated_at
    BEFORE UPDATE ON public.cpd_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. SAMPLE DATA - Default CPD Requirements
-- =====================================================

-- Insert standard ACCA CPD requirements
INSERT INTO public.cpd_requirements (role, annual_hours_required, verifiable_hours_minimum, description)
VALUES
    ('owner', 40, 21, 'ACCA requirement for practicing certificate holders'),
    ('manager', 40, 21, 'ACCA requirement for practicing certificate holders'),
    ('senior', 40, 21, 'ACCA CPD requirement'),
    ('accountant', 40, 21, 'ACCA CPD requirement'),
    ('junior', 40, 0, 'Recommended CPD for professional development'),
    ('trainee', 20, 0, 'Foundation CPD for students')
ON CONFLICT (role) DO NOTHING;

-- Insert sample external CPD resource
INSERT INTO public.cpd_external_resources (
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
VALUES (
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
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.cpd_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cpd_external_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_documents TO authenticated;
GRANT SELECT ON public.cpd_requirements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.development_plan_cpd TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ CPD System tables created successfully!';
    RAISE NOTICE '📊 Tables: cpd_activities, cpd_external_resources, knowledge_documents, cpd_requirements, development_plan_cpd';
    RAISE NOTICE '🔒 Row Level Security enabled on all tables';
    RAISE NOTICE '📚 Sample ACCA CPD requirements loaded';
END $$;

