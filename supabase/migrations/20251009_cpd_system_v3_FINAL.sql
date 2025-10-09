-- CPD System - V3 FINAL (Fixed ordering and dependencies)
-- Run this version - tables created in correct order

-- =====================================================
-- 1. CPD ACTIVITIES TABLE (Must be first - others reference it)
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
    external_link TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    verifiable BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. EXTERNAL CPD RESOURCES TABLE
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
    duration VARCHAR(100),
    skill_categories TEXT[],
    recommended_for TEXT[],
    accredited_by VARCHAR(255),
    cpd_hours DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    added_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CPD REQUIREMENTS TABLE
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
-- 4. KNOWLEDGE DOCUMENTS TABLE (References cpd_activities)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpd_activity_id UUID REFERENCES public.cpd_activities(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES public.practice_members(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('cpd_summary', 'case_study', 'guide', 'template', 'notes', 'other')),
    file_name VARCHAR(255),
    file_path TEXT,
    file_size_bytes BIGINT,
    file_type VARCHAR(100),
    tags TEXT[],
    skill_categories TEXT[],
    is_public BOOLEAN DEFAULT true,
    download_count INTEGER DEFAULT 0,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. DEVELOPMENT PLAN CPD LINKS
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

-- =====================================================
-- 6. CREATE ALL INDEXES (After all tables exist)
-- =====================================================

-- CPD Activities indexes
CREATE INDEX IF NOT EXISTS idx_cpd_activities_member ON public.cpd_activities(practice_member_id);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_date ON public.cpd_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_status ON public.cpd_activities(status);
CREATE INDEX IF NOT EXISTS idx_cpd_activities_type ON public.cpd_activities(type);

-- External resources indexes
CREATE INDEX IF NOT EXISTS idx_cpd_resources_active ON public.cpd_external_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_cpd_resources_type ON public.cpd_external_resources(type);

-- Knowledge documents indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_cpd ON public.knowledge_documents(cpd_activity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_uploader ON public.knowledge_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_public ON public.knowledge_documents(is_public);
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_tags ON public.knowledge_documents USING GIN(tags);

-- Development plan CPD indexes
CREATE INDEX IF NOT EXISTS idx_dev_plan_cpd_plan ON public.development_plan_cpd(development_plan_id);
CREATE INDEX IF NOT EXISTS idx_dev_plan_cpd_activity ON public.development_plan_cpd(cpd_activity_id);
CREATE INDEX IF NOT EXISTS idx_dev_plan_cpd_resource ON public.development_plan_cpd(cpd_resource_id);

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.cpd_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpd_external_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpd_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_plan_cpd ENABLE ROW LEVEL SECURITY;

-- CPD Activities policies
DROP POLICY IF EXISTS "Members view own CPD" ON public.cpd_activities;
CREATE POLICY "Members view own CPD"
    ON public.cpd_activities FOR SELECT
    USING (practice_member_id IN (SELECT id FROM public.practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members insert own CPD" ON public.cpd_activities;
CREATE POLICY "Members insert own CPD"
    ON public.cpd_activities FOR INSERT
    WITH CHECK (practice_member_id IN (SELECT id FROM public.practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Members update own CPD" ON public.cpd_activities;
CREATE POLICY "Members update own CPD"
    ON public.cpd_activities FOR UPDATE
    USING (practice_member_id IN (SELECT id FROM public.practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Managers view team CPD" ON public.cpd_activities;
CREATE POLICY "Managers view team CPD"
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

-- External resources policies
DROP POLICY IF EXISTS "View active resources" ON public.cpd_external_resources;
CREATE POLICY "View active resources"
    ON public.cpd_external_resources FOR SELECT
    USING (is_active = true OR added_by = auth.uid());

DROP POLICY IF EXISTS "Add resources" ON public.cpd_external_resources;
CREATE POLICY "Add resources"
    ON public.cpd_external_resources FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Update own resources" ON public.cpd_external_resources;
CREATE POLICY "Update own resources"
    ON public.cpd_external_resources FOR UPDATE
    USING (added_by = auth.uid());

-- Knowledge documents policies
DROP POLICY IF EXISTS "View public knowledge" ON public.knowledge_documents;
CREATE POLICY "View public knowledge"
    ON public.knowledge_documents FOR SELECT
    USING (
        (is_public = true AND EXISTS (
            SELECT 1 FROM public.practice_members pm1
            JOIN public.practice_members pm2 ON pm1.practice_id = pm2.practice_id
            WHERE pm1.id = knowledge_documents.uploaded_by
            AND pm2.user_id = auth.uid()
        ))
        OR uploaded_by IN (SELECT id FROM public.practice_members WHERE user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Upload knowledge" ON public.knowledge_documents;
CREATE POLICY "Upload knowledge"
    ON public.knowledge_documents FOR INSERT
    WITH CHECK (uploaded_by IN (SELECT id FROM public.practice_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Update own knowledge" ON public.knowledge_documents;
CREATE POLICY "Update own knowledge"
    ON public.knowledge_documents FOR UPDATE
    USING (uploaded_by IN (SELECT id FROM public.practice_members WHERE user_id = auth.uid()));

-- CPD requirements policies
DROP POLICY IF EXISTS "View requirements" ON public.cpd_requirements;
CREATE POLICY "View requirements"
    ON public.cpd_requirements FOR SELECT
    TO authenticated
    USING (true);

-- Development plan CPD policies
DROP POLICY IF EXISTS "View linked CPD" ON public.development_plan_cpd;
CREATE POLICY "View linked CPD"
    ON public.development_plan_cpd FOR SELECT
    USING (
        development_plan_id IN (
            SELECT id FROM public.development_goals
            WHERE practice_member_id IN (SELECT id FROM public.practice_members WHERE user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Managers link CPD" ON public.development_plan_cpd;
CREATE POLICY "Managers link CPD"
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
-- 8. TRIGGERS FOR AUTO-UPDATE
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cpd_activities_ts ON public.cpd_activities;
CREATE TRIGGER update_cpd_activities_ts
    BEFORE UPDATE ON public.cpd_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cpd_resources_ts ON public.cpd_external_resources;
CREATE TRIGGER update_cpd_resources_ts
    BEFORE UPDATE ON public.cpd_external_resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_docs_ts ON public.knowledge_documents;
CREATE TRIGGER update_knowledge_docs_ts
    BEFORE UPDATE ON public.knowledge_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cpd_requirements_ts ON public.cpd_requirements;
CREATE TRIGGER update_cpd_requirements_ts
    BEFORE UPDATE ON public.cpd_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. SAMPLE DATA
-- =====================================================

-- ACCA CPD requirements
INSERT INTO public.cpd_requirements (role, annual_hours_required, verifiable_hours_minimum, description)
VALUES
    ('owner', 40, 21, 'ACCA requirement for practicing certificate holders'),
    ('manager', 40, 21, 'ACCA requirement for practicing certificate holders'),
    ('senior', 40, 21, 'ACCA CPD requirement'),
    ('accountant', 40, 21, 'ACCA CPD requirement'),
    ('junior', 40, 0, 'Recommended CPD for professional development'),
    ('trainee', 20, 0, 'Foundation CPD for students')
ON CONFLICT (role) DO NOTHING;

-- Sample external resource
INSERT INTO public.cpd_external_resources (
    title, provider, url, description, type, duration,
    skill_categories, recommended_for, cpd_hours, is_active
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
);

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.cpd_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cpd_external_resources TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_documents TO authenticated;
GRANT SELECT ON public.cpd_requirements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.development_plan_cpd TO authenticated;

-- =====================================================
-- SUCCESS!
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '✅ CPD SYSTEM INSTALLED SUCCESSFULLY!';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created 5 tables:';
    RAISE NOTICE '   • cpd_activities';
    RAISE NOTICE '   • cpd_external_resources';
    RAISE NOTICE '   • knowledge_documents';
    RAISE NOTICE '   • cpd_requirements';
    RAISE NOTICE '   • development_plan_cpd';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '📚 ACCA CPD requirements loaded';
    RAISE NOTICE '🎓 Sample ACCA webinar resource added';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Ready to use!';
    RAISE NOTICE '════════════════════════════════════════════';
    RAISE NOTICE '';
END $$;

