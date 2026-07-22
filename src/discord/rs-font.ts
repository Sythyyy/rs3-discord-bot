import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import opentype from 'opentype.js';

const fontBuffer = readFileSync(resolve('assets/skills/RuneScape.woff'));
const fontData = fontBuffer.buffer.slice(
  fontBuffer.byteOffset,
  fontBuffer.byteOffset + fontBuffer.byteLength,
);
const font = opentype.parse(fontData);

export function rsTextPath(
  text: string,
  x: number,
  baseline: number,
  size: number,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  const width = font.getAdvanceWidth(text, size);
  const startX = anchor === 'end' ? x - width : anchor === 'middle' ? x - width / 2 : x;
  return font.getPath(text, startX, baseline, size).toPathData(2);
}
