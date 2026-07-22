INSERT INTO character_skills (character_id, skill_key, xp)
SELECT id, 'woodcutting', 0
FROM characters
ON CONFLICT (character_id, skill_key) DO NOTHING;
