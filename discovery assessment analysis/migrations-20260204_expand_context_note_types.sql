-- ============================================================================
-- EXPAND CONTEXT NOTE TYPES
-- ============================================================================
-- Add additional note types for benchmarking and other service contexts
-- ============================================================================

-- Drop and recreate the check constraint with expanded types
ALTER TABLE client_context_notes 
DROP CONSTRAINT IF EXISTS client_context_notes_note_type_check;

ALTER TABLE client_context_notes 
ADD CONSTRAINT client_context_notes_note_type_check 
CHECK (note_type IN (
    -- Original types
    'funding',           -- Investment/capital raised
    'milestone',         -- Product launch, expansion, etc.
    'customer',          -- Customer wins, pilots, contracts
    'team',              -- Key hires, departures
    'financial',         -- Revenue updates, burn rate changes
    'personal',          -- Founder personal circumstances
    'strategic',         -- Pivots, strategy changes
    'general',           -- Other context
    -- New types for benchmarking/discovery
    'discovery_call',    -- Notes from discovery conversations
    'follow_up_answer',  -- Answers to follow-up questions
    'advisor_observation', -- Things the advisor noticed
    'client_email',      -- Relevant email excerpts
    'meeting_notes',     -- General meeting notes
    'background_context' -- Background information about the business
));

COMMENT ON TABLE client_context_notes IS 
'Date-stamped contextual notes that advisors add about clients. 
Used in benchmarking, discovery, and other service analyses.
Note types: funding, milestone, customer, team, financial, personal, strategic, general,
discovery_call, follow_up_answer, advisor_observation, client_email, meeting_notes, background_context';
