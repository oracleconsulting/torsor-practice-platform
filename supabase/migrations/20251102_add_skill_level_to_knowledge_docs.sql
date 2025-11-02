-- Add skill_level to knowledge_documents for level-appropriate CPD

-- Add skill_level column (beginner, intermediate, advanced, expert)
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS skill_level VARCHAR(50) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert'));

-- Add target_skill_levels array for more granular targeting
ALTER TABLE knowledge_documents 
ADD COLUMN IF NOT EXISTS target_skill_levels INTEGER[] DEFAULT ARRAY[1,2,3,4,5];

-- Add index for filtering by skill level
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_skill_level ON knowledge_documents(skill_level);

-- Add index for target_skill_levels array queries
CREATE INDEX IF NOT EXISTS idx_knowledge_docs_target_levels ON knowledge_documents USING GIN(target_skill_levels);

COMMENT ON COLUMN knowledge_documents.skill_level IS 'General skill level: beginner (1-2), intermediate (2-3), advanced (3-4), expert (4-5)';
COMMENT ON COLUMN knowledge_documents.target_skill_levels IS 'Array of specific skill levels this resource targets (e.g., [2,3] for someone moving from 2 to 3)';

