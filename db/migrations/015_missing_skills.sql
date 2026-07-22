INSERT INTO character_skills (character_id, skill_key, xp)
SELECT id, 'fishing', 0
FROM characters
UNION ALL
SELECT id, 'firemaking', 0
FROM characters
ON CONFLICT (character_id, skill_key) DO NOTHING;
