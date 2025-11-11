-- Fix gendered pronouns in VARK questions
-- Replace him/her/his/hers with they/them/their/theirs

-- Update all instances of gendered pronouns to gender-neutral alternatives
UPDATE vark_questions
SET question_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    question_text,
    ' her ', ' them '),
    ' him ', ' them '),
    ' his ', ' their '),
    ' hers ', ' theirs '),
    ' she ', ' they '),
    ' he ', ' they '),
    'with her', 'with them'),
    'with him', 'with them'
);

-- Update option A
UPDATE vark_questions
SET option_a = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    option_a,
    ' her ', ' them '),
    ' him ', ' them '),
    ' his ', ' their '),
    ' hers ', ' theirs '),
    ' she ', ' they '),
    ' he ', ' they '),
    'with her', 'with them'),
    'with him', 'with them'
);

-- Update option B
UPDATE vark_questions
SET option_b = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    option_b,
    ' her ', ' them '),
    ' him ', ' them '),
    ' his ', ' their '),
    ' hers ', ' theirs '),
    ' she ', ' they '),
    ' he ', ' they '),
    'with her', 'with them'),
    'with him', 'with them'
);

-- Update option C
UPDATE vark_questions
SET option_c = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    option_c,
    ' her ', ' them '),
    ' him ', ' them '),
    ' his ', ' their '),
    ' hers ', ' theirs '),
    ' she ', ' they '),
    ' he ', ' they '),
    'with her', 'with them'),
    'with him', 'with them'
);

-- Update option D
UPDATE vark_questions
SET option_d = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
    option_d,
    ' her ', ' them '),
    ' him ', ' them '),
    ' his ', ' their '),
    ' hers ', ' theirs '),
    ' she ', ' they '),
    ' he ', ' they '),
    'with her', 'with them'),
    'with him', 'with them'
);

-- Also handle sentence-starting cases (capitalized)
UPDATE vark_questions
SET question_text = REPLACE(REPLACE(REPLACE(REPLACE(
    question_text,
    'Her ', 'Their '),
    'Him ', 'Them '),
    'His ', 'Their '),
    'She ', 'They '
);

UPDATE vark_questions
SET option_a = REPLACE(REPLACE(REPLACE(REPLACE(
    option_a,
    'Her ', 'Their '),
    'Him ', 'Them '),
    'His ', 'Their '),
    'She ', 'They '
);

UPDATE vark_questions
SET option_b = REPLACE(REPLACE(REPLACE(REPLACE(
    option_b,
    'Her ', 'Their '),
    'Him ', 'Them '),
    'His ', 'Their '),
    'She ', 'They '
);

UPDATE vark_questions
SET option_c = REPLACE(REPLACE(REPLACE(REPLACE(
    option_c,
    'Her ', 'Their '),
    'Him ', 'Them '),
    'His ', 'Their '),
    'She ', 'They '
);

UPDATE vark_questions
SET option_d = REPLACE(REPLACE(REPLACE(REPLACE(
    option_d,
    'Her ', 'Their '),
    'Him ', 'Them '),
    'His ', 'Their '),
    'She ', 'They '
);

-- Display confirmation message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully updated VARK questions to use gender-neutral pronouns (they/them/their)';
END $$;






