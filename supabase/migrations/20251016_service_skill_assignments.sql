-- Migration: Service Skill Assignments
-- Allows admins to customize which skills are required for each advisory service
-- and at what seniority level

-- Drop existing tables if they exist (for idempotency)
DROP TABLE IF EXISTS public.workflow_stage_skill_requirements CASCADE;
DROP TABLE IF EXISTS public.workflow_stage_assignments CASCADE;
DROP TABLE IF EXISTS public.service_skill_assignments CASCADE;

-- Table: service_skill_assignments
-- Links advisory services to required skills with customizable requirements
CREATE TABLE public.service_skill_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    service_id text NOT NULL, -- e.g., 'automation', 'management-accounts'
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    minimum_level integer NOT NULL CHECK (minimum_level >= 1 AND minimum_level <= 5),
    ideal_level integer NOT NULL CHECK (ideal_level >= 1 AND ideal_level <= 5),
    is_critical boolean DEFAULT false,
    required_seniority text[] DEFAULT '{}', -- Array of seniority levels: Partner, Director, Senior, etc.
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    
    CONSTRAINT unique_practice_service_skill UNIQUE (practice_id, service_id, skill_id),
    CONSTRAINT valid_levels CHECK (ideal_level >= minimum_level)
);

-- Table: workflow_stage_assignments
-- Tracks who is responsible for each workflow stage
CREATE TABLE public.workflow_stage_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    stage_index integer NOT NULL, -- Position in the workflow
    stage_name text NOT NULL,
    assigned_to uuid REFERENCES public.practice_members(id) ON DELETE SET NULL,
    assigned_role text, -- Partner, Director, Senior, etc. (fallback if no specific person)
    estimated_hours decimal(5,2),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_workflow_stage UNIQUE (workflow_id, stage_index)
);

-- Table: workflow_stage_skill_requirements
-- Defines which skills are needed for each workflow stage
CREATE TABLE public.workflow_stage_skill_requirements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_assignment_id uuid NOT NULL REFERENCES public.workflow_stage_assignments(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    minimum_level integer NOT NULL CHECK (minimum_level >= 1 AND minimum_level <= 5),
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_stage_skill UNIQUE (stage_assignment_id, skill_id)
);

-- Enable RLS
ALTER TABLE public.service_skill_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stage_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_stage_skill_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_skill_assignments
DROP POLICY IF EXISTS "Allow all read access to service_skill_assignments" ON public.service_skill_assignments;
DROP POLICY IF EXISTS "Allow practice members to manage their service skills" ON public.service_skill_assignments;

CREATE POLICY "Allow all read access to service_skill_assignments" 
ON public.service_skill_assignments
FOR SELECT 
USING (true);

CREATE POLICY "Allow practice members to manage their service skills" 
ON public.service_skill_assignments
FOR ALL 
USING (
    practice_id IN (
        SELECT practice_id 
        FROM public.practice_members 
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    practice_id IN (
        SELECT practice_id 
        FROM public.practice_members 
        WHERE user_id = auth.uid()
    )
);

-- RLS Policies for workflow_stage_assignments
DROP POLICY IF EXISTS "Allow all read access to workflow_stage_assignments" ON public.workflow_stage_assignments;
DROP POLICY IF EXISTS "Allow practice members to manage workflow stages" ON public.workflow_stage_assignments;

CREATE POLICY "Allow all read access to workflow_stage_assignments" 
ON public.workflow_stage_assignments
FOR SELECT 
USING (true);

CREATE POLICY "Allow practice members to manage workflow stages" 
ON public.workflow_stage_assignments
FOR ALL 
USING (
    workflow_id IN (
        SELECT w.id 
        FROM public.workflows w
        JOIN public.practice_members pm ON pm.practice_id = w.practice_id
        WHERE pm.user_id = auth.uid()
    )
)
WITH CHECK (
    workflow_id IN (
        SELECT w.id 
        FROM public.workflows w
        JOIN public.practice_members pm ON pm.practice_id = w.practice_id
        WHERE pm.user_id = auth.uid()
    )
);

-- RLS Policies for workflow_stage_skill_requirements
DROP POLICY IF EXISTS "Allow all read access to workflow_stage_skill_requirements" ON public.workflow_stage_skill_requirements;
DROP POLICY IF EXISTS "Allow practice members to manage stage skill requirements" ON public.workflow_stage_skill_requirements;

CREATE POLICY "Allow all read access to workflow_stage_skill_requirements" 
ON public.workflow_stage_skill_requirements
FOR SELECT 
USING (true);

CREATE POLICY "Allow practice members to manage stage skill requirements" 
ON public.workflow_stage_skill_requirements
FOR ALL 
USING (
    stage_assignment_id IN (
        SELECT sa.id 
        FROM public.workflow_stage_assignments sa
        JOIN public.workflows w ON w.id = sa.workflow_id
        JOIN public.practice_members pm ON pm.practice_id = w.practice_id
        WHERE pm.user_id = auth.uid()
    )
)
WITH CHECK (
    stage_assignment_id IN (
        SELECT sa.id 
        FROM public.workflow_stage_assignments sa
        JOIN public.workflows w ON w.id = sa.workflow_id
        JOIN public.practice_members pm ON pm.practice_id = w.practice_id
        WHERE pm.user_id = auth.uid()
    )
);

-- Indexes for performance
DROP INDEX IF EXISTS idx_service_skill_assignments_practice;
DROP INDEX IF EXISTS idx_service_skill_assignments_service;
DROP INDEX IF EXISTS idx_service_skill_assignments_skill;
DROP INDEX IF EXISTS idx_workflow_stage_assignments_workflow;
DROP INDEX IF EXISTS idx_workflow_stage_skill_requirements_stage;

CREATE INDEX idx_service_skill_assignments_practice ON public.service_skill_assignments(practice_id);
CREATE INDEX idx_service_skill_assignments_service ON public.service_skill_assignments(service_id);
CREATE INDEX idx_service_skill_assignments_skill ON public.service_skill_assignments(skill_id);
CREATE INDEX idx_workflow_stage_assignments_workflow ON public.workflow_stage_assignments(workflow_id);
CREATE INDEX idx_workflow_stage_skill_requirements_stage ON public.workflow_stage_skill_requirements(stage_assignment_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_service_skill_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at ON public.service_skill_assignments;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.service_skill_assignments 
FOR EACH ROW 
EXECUTE FUNCTION public.update_service_skill_assignments_updated_at();

CREATE OR REPLACE FUNCTION public.update_workflow_stage_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at ON public.workflow_stage_assignments;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.workflow_stage_assignments 
FOR EACH ROW 
EXECUTE FUNCTION public.update_workflow_stage_assignments_updated_at();

-- Comments
COMMENT ON TABLE public.service_skill_assignments IS 'Custom skill requirements for advisory services per practice';
COMMENT ON TABLE public.workflow_stage_assignments IS 'Assignment of team members and roles to workflow stages';
COMMENT ON TABLE public.workflow_stage_skill_requirements IS 'Skills required for each workflow stage';

