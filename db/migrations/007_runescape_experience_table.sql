-- Convert the temporary 100-XP-per-level curve to RuneScape's standard curve.
-- Preserve both the displayed level and proportional progress towards the next level.
WITH RECURSIVE experience_table(level, points, xp) AS (
  SELECT 1, 0::bigint, 0::bigint
  UNION ALL
  SELECT
    level + 1,
    points + floor(level + 300 * power(2::double precision, level / 7::double precision))::bigint,
    floor(
      (points + floor(level + 300 * power(2::double precision, level / 7::double precision))) / 4
    )::bigint * 10
  FROM experience_table
  WHERE level < 120
),
old_progress AS (
  SELECT
    character_id,
    skill_key,
    LEAST(120, (xp / 1000)::integer + 1) AS level,
    xp % 1000 AS progress
  FROM character_skills
),
converted AS (
  SELECT
    old_progress.character_id,
    old_progress.skill_key,
    current_level.xp + CASE
      WHEN old_progress.level >= 120 THEN 0
      ELSE ((next_level.xp - current_level.xp) * old_progress.progress) / 1000
    END AS xp
  FROM old_progress
  JOIN experience_table AS current_level ON current_level.level = old_progress.level
  LEFT JOIN experience_table AS next_level ON next_level.level = old_progress.level + 1
)
UPDATE character_skills
SET xp = converted.xp
FROM converted
WHERE character_skills.character_id = converted.character_id
  AND character_skills.skill_key = converted.skill_key;
