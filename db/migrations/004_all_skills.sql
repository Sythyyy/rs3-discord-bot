INSERT INTO character_skills (character_id, skill_key, xp)
SELECT characters.id, skill.skill_key, 0
FROM characters
CROSS JOIN (
  VALUES
    ('attack'), ('constitution'), ('mining'), ('strength'), ('agility'), ('smithing'),
    ('defence'), ('herblore'), ('ranged'), ('thieving'), ('cooking'),
    ('prayer'), ('crafting'), ('magic'), ('fletching'), ('woodcutting'),
    ('runecrafting'), ('slayer'), ('farming'), ('construction'), ('hunter'), ('summoning'),
    ('dungeoneering'), ('divination'), ('invention'), ('archaeology'), ('necromancy')
) AS skill(skill_key)
ON CONFLICT (character_id, skill_key) DO NOTHING;
