import { resolve } from 'node:path';

import sharp, { type OverlayOptions } from 'sharp';

import { skillKeys, type SkillKey } from '../content/game-content.js';
import { rsTextPath } from './rs-font.js';

export interface SkillsImageSkill {
  key: SkillKey;
  level: number;
}

const backgroundPath = resolve('assets/items/Skill_screen.png');
const width = 219;
const height = 346;
const columnTextX = [73, 139, 205];
const rowTop = 36;
const rowHeight = 27;

const level110Skills = new Set<SkillKey>([
  'mining',
  'smithing',
  'woodcutting',
  'firemaking',
  'runecrafting',
  'fletching',
]);
const level120Skills = new Set<SkillKey>([
  'herblore',
  'slayer',
  'farming',
  'dungeoneering',
  'invention',
  'archaeology',
  'necromancy',
]);

export function maximumLevelForSkill(key: SkillKey): number {
  if (level120Skills.has(key)) return 120;
  if (level110Skills.has(key)) return 110;
  return 99;
}

export function combatLevelForSkills(skills: ReadonlyArray<SkillsImageSkill>): number {
  const levels = new Map(skills.map((skill) => [skill.key, skill.level]));
  const level = (key: SkillKey) => levels.get(key) ?? 1;
  const offensive = Math.max(
    level('attack') + level('strength'),
    level('magic') * 2,
    level('ranged') * 2,
    level('necromancy') * 2,
  );
  return Math.max(
    3,
    Math.floor(
      (1.3 * offensive +
        level('defence') +
        level('constitution') +
        Math.floor(level('prayer') / 2) +
        Math.floor(level('summoning') / 2)) /
        4,
    ),
  );
}

export async function renderSkillsImage(
  skills: ReadonlyArray<SkillsImageSkill>,
  questPoints = 0,
): Promise<Buffer> {
  const levels = new Map(skills.map((skill) => [skill.key, skill.level]));
  const totalLevel = skillKeys.reduce((total, key) => total + (levels.get(key) ?? 1), 0);
  const slotOverlays = skillKeys.map((key, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    return skillLevelOverlay(
      columnTextX[column] ?? 65,
      rowTop + row * rowHeight,
      levels.get(key) ?? 1,
      maximumLevelForSkill(key),
    );
  });

  return sharp(backgroundPath)
    .composite([
      ...slotOverlays,
      {
        input: summaryOverlay(totalLevel, combatLevelForSkills(skills), questPoints),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
}

function skillLevelOverlay(
  right: number,
  top: number,
  level: number,
  maximumLevel: number,
): OverlayOptions {
  const overlayWidth = 46;
  const levelText = `${level}/${maximumLevel}`;
  return {
    input: Buffer.from(`
      <svg width="${overlayWidth}" height="27" xmlns="http://www.w3.org/2000/svg">
        <rect width="${overlayWidth}" height="27" fill="#211d19"/>
        <path d="${rsTextPath(levelText, 43, 21, 15, 'end')}" stroke="#000" stroke-width="2" stroke-linejoin="round" paint-order="stroke" fill="#f4d77b"/>
      </svg>
    `),
    left: right - overlayWidth,
    top,
  };
}

function summaryOverlay(totalLevel: number, combatLevel: number, questPoints: number): Buffer {
  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="29" y="320" width="45" height="25" fill="#211d19"/>
      <rect x="96" y="320" width="39" height="25" fill="#211d19"/>
      <rect x="164" y="320" width="45" height="25" fill="#211d19"/>
      <g stroke="#000" stroke-width="2" stroke-linejoin="round" paint-order="stroke" fill="#ffffff">
        <path d="${rsTextPath(totalLevel.toString(), 52, 340, 16, 'middle')}"/>
        <path d="${rsTextPath(combatLevel.toString(), 116, 340, 16, 'middle')}"/>
        <path d="${rsTextPath(questPoints.toString(), 187, 340, 16, 'middle')}"/>
      </g>
    </svg>
  `);
}
