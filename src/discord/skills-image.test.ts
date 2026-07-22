import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { combatLevelForSkills, maximumLevelForSkill, renderSkillsImage } from './skills-image.js';

describe('renderSkillsImage', () => {
  it('renders the complete skills screen at its native size', async () => {
    const image = await renderSkillsImage(
      [
        { key: 'attack', level: 110 },
        { key: 'mining', level: 42 },
        { key: 'cooking', level: 10 },
      ],
      123,
    );
    const metadata = await sharp(image).metadata();

    expect(metadata.format).toBe('png');
    expect(metadata.width).toBe(219);
    expect(metadata.height).toBe(346);
  });

  it('uses the correct RuneScape level caps', () => {
    expect(maximumLevelForSkill('attack')).toBe(99);
    expect(maximumLevelForSkill('woodcutting')).toBe(110);
    expect(maximumLevelForSkill('necromancy')).toBe(120);
  });

  it('calculates RuneScape combat levels instead of displaying zero', () => {
    expect(combatLevelForSkills([])).toBe(3);
    expect(
      combatLevelForSkills([
        { key: 'attack', level: 99 },
        { key: 'strength', level: 99 },
        { key: 'defence', level: 99 },
        { key: 'constitution', level: 99 },
        { key: 'prayer', level: 99 },
        { key: 'summoning', level: 99 },
      ]),
    ).toBe(138);
    expect(
      combatLevelForSkills([
        { key: 'necromancy', level: 120 },
        { key: 'defence', level: 99 },
        { key: 'constitution', level: 99 },
        { key: 'prayer', level: 99 },
        { key: 'summoning', level: 99 },
      ]),
    ).toBe(152);
  });
});
