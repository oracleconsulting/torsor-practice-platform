-- Migration: Workflow Instances and Team Assignments
-- Tracks actual client engagements and team member assignments

-- Drop existing tables if they exist (for idempotency)
DROP TABLE IF EXISTS public.workflow_instance_assignments CASCADE;
DROP TABLE IF EXISTS public.workflow_instances CASCADE;

-- Table: workflow_instances
-- Represents an actual client engagement for a service
CREATE TABLE public.workflow_instances (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    service_id text NOT NULL, -- e.g., 'automation', 'management-accounts'
    client_name text NOT NULL,
    client_id uuid, -- Future: link to clients table or Karbon
    status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'on_hold', 'cancelled')),
    start_date date,
    target_completion_date date,
    actual_completion_date date,
    total_estimated_hours decimal(8,2),
    total_actual_hours decimal(8,2) DEFAULT 0,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Table: workflow_instance_assignments
-- Assigns team members to specific roles/stages in a workflow instance
CREATE TABLE public.workflow_instance_assignments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_instance_id uuid NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
    practice_member_id uuid NOT NULL REFERENCES public.practice_members(id) ON DELETE CASCADE,
    role_seniority text NOT NULL, -- Partner, Director, Senior, etc.
    stage_name text, -- Optional: specific stage/task name
    estimated_hours decimal(5,2),
    actual_hours decimal(5,2) DEFAULT 0,
    status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'blocked')),
    start_date timestamptz,
    completion_date timestamptz,
    notes text,
    feedback_score integer CHECK (feedback_score >= 1 AND feedback_score <= 5),
    feedback_notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT unique_instance_member_role UNIQUE (workflow_instance_id, practice_member_id, role_seniority)
);

-- Enable RLS
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instance_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_instances
DROP POLICY IF EXISTS "Allow all read access to workflow_instances" ON public.workflow_instances;
DROP POLICY IF EXISTS "Allow practice members to manage their workflow instances" ON public.workflow_instances;

CREATE POLICY "Allow all read access to workflow_instances" 
ON public.workflow_instances
FOR SELECT 
USING (true);

CREATE POLICY "Allow practice members to manage their workflow instances" 
ON public.workflow_instances
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

-- RLS Policies for workflow_instance_assignments
DROP POLICY IF EXISTS "Allow all read access to workflow_instance_assignments" ON public.workflow_instance_assignments;
DROP POLICY IF EXISTS "Allow practice members to view their assignments" ON public.workflow_instance_assignments;
DROP POLICY IF EXISTS "Allow practice members to manage assignments" ON public.workflow_instance_assignments;

CREATE POLICY "Allow all read access to workflow_instance_assignments" 
ON public.workflow_instance_assignments
FOR SELECT 
USING (true);

CREATE POLICY "Allow practice members to view their assignments" 
ON public.workflow_instance_assignments
FOR SELECT
USING (
    practice_member_id = (
        SELECT id FROM public.practice_members WHERE user_id = auth.uid()
    )
    OR
    workflow_instance_id IN (
        SELECT wi.id 
        FROM public.workflow_instances wi
        JOIN public.practice_members pm ON pm.practice_id = wi.practice_id
        WHERE pm.user_id = auth.uid()
    )
);

CREATE POLICY "Allow practice members to manage assignments" 
ON public.workflow_instance_assignments
FOR ALL 
USING (
    workflow_instance_id IN (
        SELECT wi.id 
        FROM public.workflow_instances wi
        JOIN public.practice_members pm ON pm.practice_id = wi.practice_id
        WHERE pm.user_id = auth.uid()
    )
)
WITH CHECK (
    workflow_instance_id IN (
        SELECT wi.id 
        FROM public.workflow_instances wi
        JOIN public.practice_members pm ON pm.practice_id = wi.practice_id
        WHERE pm.user_id = auth.uid()
    )
);

-- Indexes for performance
DROP INDEX IF EXISTS idx_workflow_instances_practice;
DROP INDEX IF EXISTS idx_workflow_instances_service;
DROP INDEX IF EXISTS idx_workflow_instances_status;
DROP INDEX IF EXISTS idx_workflow_instance_assignments_instance;
DROP INDEX IF EXISTS idx_workflow_instance_assignments_member;

CREATE INDEX idx_workflow_instances_practice ON public.workflow_instances(practice_id);
CREATE INDEX idx_workflow_instances_service ON public.workflow_instances(service_id);
CREATE INDEX idx_workflow_instances_status ON public.workflow_instances(status);
CREATE INDEX idx_workflow_instance_assignments_instance ON public.workflow_instance_assignments(workflow_instance_id);
CREATE INDEX idx_workflow_instance_assignments_member ON public.workflow_instance_assignments(practice_member_id);

-- Triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_workflow_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at ON public.workflow_instances;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.workflow_instances 
FOR EACH ROW 
EXECUTE FUNCTION public.update_workflow_instances_updated_at();

CREATE OR REPLACE FUNCTION public.update_workflow_instance_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at ON public.workflow_instance_assignments;
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.workflow_instance_assignments 
FOR EACH ROW 
EXECUTE FUNCTION public.update_workflow_instance_assignments_updated_at();

-- Function to calculate total actual hours for an instance
CREATE OR REPLACE FUNCTION public.update_instance_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.workflow_instances
    SET total_actual_hours = (
        SELECT COALESCE(SUM(actual_hours), 0)
        FROM public.workflow_instance_assignments
        WHERE workflow_instance_id = NEW.workflow_instance_id
    )
    WHERE id = NEW.workflow_instance_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_total_hours ON public.workflow_instance_assignments;
CREATE TRIGGER update_total_hours
AFTER INSERT OR UPDATE OF actual_hours ON public.workflow_instance_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_instance_total_hours();

-- Comments
COMMENT ON TABLE public.workflow_instances IS 'Actual client engagements for advisory services';
COMMENT ON TABLE public.workflow_instance_assignments IS 'Team member assignments to workflow instances';
COMMENT ON COLUMN public.workflow_instances.client_id IS 'Future: Link to clients table or Karbon CRM';
COMMENT ON COLUMN public.workflow_instance_assignments.feedback_score IS 'Performance feedback score (1-5) for this assignment';

