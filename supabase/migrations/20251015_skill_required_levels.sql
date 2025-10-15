-- Create table for storing firm-specific required skill levels
CREATE TABLE IF NOT EXISTS public.skill_required_levels (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    practice_id uuid NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
    skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    required_level integer NOT NULL CHECK (required_level >= 1 AND required_level <= 5),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- Unique constraint: one required level per skill per practice
    CONSTRAINT unique_practice_skill_required UNIQUE (practice_id, skill_id)
);

-- Enable RLS
ALTER TABLE public.skill_required_levels ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all read access to skill_required_levels" 
ON public.skill_required_levels
FOR SELECT 
USING (true);

CREATE POLICY "Allow practice members to manage their practice skill requirements" 
ON public.skill_required_levels
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

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_skill_required_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE TRIGGER handle_updated_at 
BEFORE UPDATE ON public.skill_required_levels 
FOR EACH ROW 
EXECUTE FUNCTION public.update_skill_required_levels_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_skill_required_levels_practice ON public.skill_required_levels(practice_id);
CREATE INDEX idx_skill_required_levels_skill ON public.skill_required_levels(skill_id);

-- Add some helpful comments
COMMENT ON TABLE public.skill_required_levels IS 'Stores the firm-specific required skill levels for gap analysis';
COMMENT ON COLUMN public.skill_required_levels.required_level IS 'Target skill level (1-5) that the firm requires for this skill';

