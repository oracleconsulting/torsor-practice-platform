-- Fix: Goal Alignment Programme — update service_lines and service_line_metadata display names
-- (Dashboard card was showing "365 Alignment Programme" instead of "Goal Alignment Programme")

UPDATE service_lines
SET name = 'Goal Alignment Programme',
    short_description = 'Life-first business transformation with strategic clarity and accountability'
WHERE code = '365_method';

UPDATE service_line_metadata
SET name = 'Goal Alignment Programme'
WHERE code = '365_method' AND (name IS NULL OR name LIKE '%365%');
