-- Systems Audit: expand text answer character limits from 300/400 to 800
-- Allows fuller narrative answers for questions like sa_expensive_mistake, sa_magic_fix, etc.

UPDATE assessment_questions
SET char_limit = 800
WHERE service_line_code = 'systems_audit'
  AND question_type = 'text'
  AND char_limit IN (300, 400);
