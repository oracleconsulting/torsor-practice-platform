-- Service Workflows Schema
-- This schema supports complex, dynamic, branching workflows with LLM integration

-- 1. WORKFLOWS TABLE
-- Stores workflow definitions for advisory services
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    practice_id UUID NOT NULL,
    service_id TEXT NOT NULL, -- References the service (from localStorage or later DB)
    name TEXT NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. WORKFLOW STEPS TABLE
-- Stores individual steps in a workflow with support for branching
CREATE TABLE IF NOT EXISTS public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_type TEXT NOT NULL, -- 'llm', 'conditional', 'transform', 'user_input', 'api_call'
    name TEXT NOT NULL,
    description TEXT,
    
    -- Step Configuration
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- For LLM steps:
    --   { "provider": "openrouter", "model": "anthropic/claude-3.5-sonnet", 
    --     "prompt": "...", "temperature": 0.7, "max_tokens": 2000,
    --     "input_variables": ["client_data", "previous_output"] }
    -- For conditional steps:
    --   { "condition": "revenue > 100000", "true_branch": "step_id", "false_branch": "step_id" }
    -- For transform steps:
    --   { "transform": "extract_metrics", "mapping": {...} }
    -- For user_input steps:
    --   { "fields": [...], "validation": {...} }
    
    -- Input/Output Mapping
    input_mapping JSONB DEFAULT '{}'::jsonb,  -- Maps previous outputs to this step's inputs
    output_schema JSONB DEFAULT '{}'::jsonb,   -- Expected output structure
    
    -- Branching Support
    parent_step_id UUID REFERENCES public.workflow_steps(id) ON DELETE SET NULL,
    branch_condition TEXT, -- If this step is part of a conditional branch
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WORKFLOW EXECUTIONS TABLE
-- Stores execution history and results
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    practice_id UUID NOT NULL,
    client_id UUID, -- Optional: if workflow is for a specific client
    client_name TEXT,
    
    -- Execution Status
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    current_step_id UUID REFERENCES public.workflow_steps(id),
    progress_percentage INTEGER DEFAULT 0,
    
    -- Input/Output
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    
    -- Execution Metadata
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    execution_time_ms INTEGER,
    
    -- User Info
    executed_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STEP EXECUTIONS TABLE
-- Stores individual step execution details
CREATE TABLE IF NOT EXISTS public.step_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
    
    -- Execution Details
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    
    -- LLM-specific fields
    llm_provider TEXT,
    llm_model TEXT,
    prompt_used TEXT,
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),
    
    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    execution_time_ms INTEGER,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. WORKFLOW TEMPLATES TABLE
-- Pre-built workflow templates for common services
CREATE TABLE IF NOT EXISTS public.workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    service_type TEXT NOT NULL, -- 'forecasting', 'valuation', 'strategy', etc.
    category TEXT,
    
    -- Template Definition (can be copied to create new workflows)
    template_data JSONB NOT NULL,
    
    -- Metadata
    is_public BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for performance
CREATE INDEX IF NOT EXISTS idx_workflows_practice_id ON public.workflows(practice_id);
CREATE INDEX IF NOT EXISTS idx_workflows_service_id ON public.workflows(service_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON public.workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_order ON public.workflow_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_practice_id ON public.workflow_executions(practice_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_step_executions_workflow_execution_id ON public.step_executions(workflow_execution_id);
CREATE INDEX IF NOT EXISTS idx_step_executions_step_id ON public.step_executions(step_id);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own practice's workflows
CREATE POLICY "Users can view their practice workflows"
    ON public.workflows FOR SELECT
    USING (
        practice_id IN (
            SELECT practice_id FROM public.accountancy_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create workflows for their practice"
    ON public.workflows FOR INSERT
    WITH CHECK (
        practice_id IN (
            SELECT practice_id FROM public.accountancy_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their practice workflows"
    ON public.workflows FOR UPDATE
    USING (
        practice_id IN (
            SELECT practice_id FROM public.accountancy_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their practice workflows"
    ON public.workflows FOR DELETE
    USING (
        practice_id IN (
            SELECT practice_id FROM public.accountancy_users
            WHERE user_id = auth.uid()
        )
    );

-- Similar policies for workflow_steps (inherit from workflow)
CREATE POLICY "Users can view workflow steps"
    ON public.workflow_steps FOR SELECT
    USING (
        workflow_id IN (
            SELECT id FROM public.workflows
            WHERE practice_id IN (
                SELECT practice_id FROM public.accountancy_users
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage workflow steps"
    ON public.workflow_steps FOR ALL
    USING (
        workflow_id IN (
            SELECT id FROM public.workflows
            WHERE practice_id IN (
                SELECT practice_id FROM public.accountancy_users
                WHERE user_id = auth.uid()
            )
        )
    );

-- Executions policies
CREATE POLICY "Users can view their practice executions"
    ON public.workflow_executions FOR SELECT
    USING (
        practice_id IN (
            SELECT practice_id FROM public.accountancy_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create executions for their practice"
    ON public.workflow_executions FOR INSERT
    WITH CHECK (
        practice_id IN (
            SELECT practice_id FROM public.accountancy_users
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their practice executions"
    ON public.workflow_executions FOR UPDATE
    USING (
        practice_id IN (
            SELECT practice_id FROM public.accountancy_users
            WHERE user_id = auth.uid()
        )
    );

-- Step executions inherit from workflow executions
CREATE POLICY "Users can view step executions"
    ON public.step_executions FOR SELECT
    USING (
        workflow_execution_id IN (
            SELECT id FROM public.workflow_executions
            WHERE practice_id IN (
                SELECT practice_id FROM public.accountancy_users
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage step executions"
    ON public.step_executions FOR ALL
    USING (
        workflow_execution_id IN (
            SELECT id FROM public.workflow_executions
            WHERE practice_id IN (
                SELECT practice_id FROM public.accountancy_users
                WHERE user_id = auth.uid()
            )
        )
    );

-- Templates are public (read-only for most users)
CREATE POLICY "Anyone can view public templates"
    ON public.workflow_templates FOR SELECT
    USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates"
    ON public.workflow_templates FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own templates"
    ON public.workflow_templates FOR UPDATE
    USING (created_by = auth.uid());

-- FUNCTIONS

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at
    BEFORE UPDATE ON public.workflow_steps
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at
    BEFORE UPDATE ON public.workflow_executions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate execution progress
CREATE OR REPLACE FUNCTION public.calculate_workflow_progress(execution_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_steps INTEGER;
    completed_steps INTEGER;
    progress INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_steps
    FROM public.workflow_steps
    WHERE workflow_id = (
        SELECT workflow_id FROM public.workflow_executions WHERE id = execution_id
    );
    
    SELECT COUNT(*) INTO completed_steps
    FROM public.step_executions
    WHERE workflow_execution_id = execution_id
    AND status IN ('completed', 'skipped');
    
    IF total_steps = 0 THEN
        RETURN 0;
    END IF;
    
    progress := (completed_steps * 100 / total_steps);
    
    UPDATE public.workflow_executions
    SET progress_percentage = progress
    WHERE id = execution_id;
    
    RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.workflows IS 'Workflow definitions for advisory services';
COMMENT ON TABLE public.workflow_steps IS 'Individual steps in workflows with LLM and branching support';
COMMENT ON TABLE public.workflow_executions IS 'Execution history and results for workflows';
COMMENT ON TABLE public.step_executions IS 'Individual step execution details including LLM usage';
COMMENT ON TABLE public.workflow_templates IS 'Pre-built workflow templates';

