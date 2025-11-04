-- Migration: Service Delivery Team Role Assignments
-- Allows defining delivery team structure with skill requirements per role

-- Drop existing tables if they exist (for idempotency)
DROP TABLE IF EXISTS public.service_delivery_role_skills CASCADE;
DROP TABLE IF EXISTS public.service_delivery_roles CASCADE;

-- Table: service_delivery_roles
-- Defines the team structure for delivering a service
CREATE TABLE public.service_delivery_roles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    service_id text NOT NULL, -- e.g., 'automation', 'management-accounts'
    seniority text NOT NULL, -- Partner, Director, Associate Director, Manager, Assistant Manager, Senior, Junior, Admin
    display_order integer DEFAULT 0,
    responsibilities text[] DEFAULT '{}',
    estimated_hours decimal(5,2),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_practice_service_seniority UNIQUE (practice_id, service_id, seniority)
);

-- Table: service_delivery_role_skills
-- Maps specific skills to each delivery role
CREATE TABLE public.service_delivery_role_skills (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_role_id uuid NOT NULL REFERENCES public.service_delivery_roles(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    minimum_level integer NOT NULL CHECK (minimum_level >= 1 AND minimum_level <= 5),
    ideal_level integer NOT NULL CHECK (ideal_level >= 1 AND ideal_level <= 5),
    is_critical boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_role_skill UNIQUE (delivery_role_id, skill_id),
    CONSTRAINT valid_skill_levels CHECK (ideal_level >= minimum_level)
);

-- Enable RLS
ALTER TABLE public.service_delivery_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_delivery_role_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_delivery_roles
DROP POLICY IF EXISTS "Allow all read access to service_delivery_roles" ON public.service_delivery_roles;
DROP POLICY IF EXISTS "Allow practice members to manage delivery roles" ON public.service_delivery_roles;

CREATE POLICY "Allow all read access to service_delivery_roles" 
ON public.service_delivery_roles
FOR SELECT 
USING (true);

CREATE POLICY "Allow practice members to manage delivery roles" 
ON public.service_delivery_roles
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

-- RLS Policies for service_delivery_role_skills
DROP POLICY IF EXISTS "Allow all read access to service_delivery_role_skills" ON public.service_delivery_role_skills;
DROP POLICY IF EXISTS "Allow practice members to manage role skills" ON public.service_delivery_role_skills;

CREATE POLICY "Allow all read access to service_delivery_role_skills" 
ON public.service_delivery_role_skills
FOR SELECT 
USING (true);

CREATE POLICY "Allow practice members to manage role skills" 
ON public.service_delivery_role_skills
FOR ALL 
USING (
    delivery_role_id IN (
        SELECT dr.id 
        FROM public.service_delivery_roles dr
        JOIN public.practice_members pm ON pm.practice_id = dr.practice_id
        WHERE pm.user_id = auth.uid()
    )
)
WITH CHECK (
    delivery_role_id IN (
        SELECT dr.id 
        FROM public.service_delivery_roles dr
        JOIN public.practice_members pm ON pm.practice_id = dr.practice_id
        WHERE pm.user_id = auth.uid()
    )
);

-- Indexes for performance
DROP INDEX IF EXISTS idx_service_delivery_roles_practice;
DROP INDEX IF EXISTS idx_service_delivery_roles_service;
DROP INDEX IF EXISTS idx_service_delivery_role_skills_role;
DROP INDEX IF EXISTS idx_service_delivery_role_skills_skill;

CREATE INDEX idx_service_delivery_roles_practice ON public.service_delivery_roles(practice_id);
CREATE INDEX idx_service_delivery_roles_service ON public.service_delivery_roles(service_id);
CREATE INDEX idx_service_delivery_role_skills_role ON public.service_delivery_role_skills(delivery_role_id);
CREATE INDEX idx_service_delivery_role_skills_skill ON public.service_delivery_role_skills(skill_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_service_delivery_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at ON public.service_delivery_roles;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.service_delivery_roles 
FOR EACH ROW 
EXECUTE FUNCTION public.update_service_delivery_roles_updated_at();

-- Function to sync role skills to service skills
-- When skills are assigned to delivery roles, aggregate them into service_skill_assignments
CREATE OR REPLACE FUNCTION public.sync_role_skills_to_service(
    p_practice_id uuid,
    p_service_id text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_skill_record RECORD;
BEGIN
    -- Delete existing service skill assignments (we'll rebuild from role skills)
    DELETE FROM public.service_skill_assignments
    WHERE practice_id = p_practice_id
    AND service_id = p_service_id;
    
    -- Aggregate skills from all delivery roles for this service
    -- Take the highest minimum_level and ideal_level if a skill appears in multiple roles
    -- Mark as critical if ANY role marks it as critical
    FOR v_skill_record IN
        SELECT 
            drskills.skill_id,
            MAX(drskills.minimum_level) as min_level,
            MAX(drskills.ideal_level) as ideal_level,
            BOOL_OR(drskills.is_critical) as is_critical,
            ARRAY_AGG(DISTINCT dr.seniority) as seniorities
        FROM public.service_delivery_roles dr
        JOIN public.service_delivery_role_skills drskills ON drskills.delivery_role_id = dr.id
        WHERE dr.practice_id = p_practice_id
        AND dr.service_id = p_service_id
        GROUP BY drskills.skill_id
    LOOP
        -- Insert aggregated skill into service_skill_assignments
        INSERT INTO public.service_skill_assignments (
            practice_id,
            service_id,
            skill_id,
            minimum_level,
            ideal_level,
            is_critical,
            required_seniority,
            notes
        ) VALUES (
            p_practice_id,
            p_service_id,
            v_skill_record.skill_id,
            v_skill_record.min_level,
            v_skill_record.ideal_level,
            v_skill_record.is_critical,
            v_skill_record.seniorities,
            'Auto-synced from delivery role skills'
        );
    END LOOP;
END;
$$;

-- Comments
COMMENT ON TABLE public.service_delivery_roles IS 'Delivery team structure per service with role definitions';
COMMENT ON TABLE public.service_delivery_role_skills IS 'Skill requirements for each delivery role';
COMMENT ON FUNCTION public.sync_role_skills_to_service IS 'Aggregates skills from delivery roles into service skill assignments';

