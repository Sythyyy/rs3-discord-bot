import { access } from 'node:fs/promises';
import { resolve } from 'node:path';

import sharp, { type OverlayOptions } from 'sharp';

import { formatBankQuantity, type BankPage } from './bank-page.js';
import { rsTextPath } from './rs-font.js';

export interface BankImageOptions extends BankPage {
  playerName: string;
}

export const BANK_IMAGE_WIDTH = 756;
export const BANK_IMAGE_HEIGHT = 786;
const emptyBankHeight = 116;
const iconsPath = resolve('assets/items');
const columns = 9;
const cellWidth = 78;
const iconSize = 58;
const gridLeft = 27;
const gridTop = 55;
const rowHeight = 72;

export async function renderBankImage(options: BankImageOptions): Promise<Buffer> {
  const items = options.items.filter((item) => item.quantity > 0n);
  const height = items.length === 0 ? emptyBankHeight : BANK_IMAGE_HEIGHT;
  const overlays: OverlayOptions[] = [frame(height), header(options)];

  if (items.length === 0) {
    overlays.push(emptyState());
  } else {
    for (const [index, item] of items.entries()) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const left = gridLeft + column * cellWidth;
      const top = gridTop + row * rowHeight;
      const iconPath = resolve(iconsPath, item.iconFile);
      overlays.push({
        input: (await fileExists(iconPath))
          ? await sharp(iconPath).resize(iconSize, iconSize, { fit: 'contain' }).png().toBuffer()
          : missingIcon(item.name),
        left: left + 10,
        top: top + 8,
      });
      overlays.push({
        input: quantityLabel(item.quantity),
        left: left + 3,
        top,
      });
    }
  }

  return sharp({
    create: {
      width: BANK_IMAGE_WIDTH,
      height,
      channels: 3,
      background: '#211d19',
    },
  })
    .composite(overlays)
    .png()
    .toBuffer();
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function frame(height: number): OverlayOptions {
  return {
    input: Buffer.from(`
      <svg width="${BANK_IMAGE_WIDTH}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#332b23"/>
            <stop offset="1" stop-color="#1d1a17"/>
          </linearGradient>
        </defs>
        <rect width="${BANK_IMAGE_WIDTH}" height="${height}" fill="url(#bg)"/>
        <rect x="3" y="3" width="${BANK_IMAGE_WIDTH - 6}" height="${height - 6}" rx="5" fill="none" stroke="#806641" stroke-width="2"/>
        <rect x="7" y="7" width="${BANK_IMAGE_WIDTH - 14}" height="${height - 14}" rx="3" fill="none" stroke="#3f3429"/>
        <path d="M16 43 H740" stroke="#70593b"/>
        <path d="M16 45 H740" stroke="#171411"/>
      </svg>
    `),
    left: 0,
    top: 0,
  };
}

function header(options: BankImageOptions): OverlayOptions {
  const title = `${options.playerName}'s Bank - Page ${options.page} of ${options.totalPages} (V: ${formatBankQuantity(options.totalValue)} / MV: ${formatBankQuantity(options.maxValue)})`;
  return {
    input: Buffer.from(`
      <svg width="${BANK_IMAGE_WIDTH}" height="44" xmlns="http://www.w3.org/2000/svg">
        <path d="${rsTextPath(title, BANK_IMAGE_WIDTH / 2, 29, 20, 'middle')}" stroke="#100d0a" stroke-width="3" stroke-linejoin="round" paint-order="stroke" fill="#f1dfb1"/>
      </svg>
    `),
    left: 0,
    top: 0,
  };
}

function emptyState(): OverlayOptions {
  return {
    input: Buffer.from(`
      <svg width="${BANK_IMAGE_WIDTH}" height="70" xmlns="http://www.w3.org/2000/svg">
        <path d="${rsTextPath('Your bank is empty', BANK_IMAGE_WIDTH / 2, 47, 23, 'middle')}" stroke="#100d0a" stroke-width="3" stroke-linejoin="round" paint-order="stroke" fill="#d8c28d"/>
      </svg>
    `),
    left: 0,
    top: 43,
  };
}

function missingIcon(name: string): Buffer {
  const initial = name.slice(0, 1).toUpperCase();
  return Buffer.from(`
    <svg width="${iconSize}" height="${iconSize}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="29" cy="29" r="25" fill="#3b332a" stroke="#9b7a43" stroke-width="2"/>
      <path d="${rsTextPath(initial, 29, 40, 31, 'middle')}" fill="#e8d5a5"/>
    </svg>
  `);
}

function quantityLabel(quantity: bigint): Buffer {
  const label = formatBankQuantity(quantity);
  return Buffer.from(`
    <svg width="72" height="28" xmlns="http://www.w3.org/2000/svg">
      <path d="${rsTextPath(label, 3, 20, 17)}" stroke="#0b0907" stroke-width="3" stroke-linejoin="round" paint-order="stroke" fill="#ffff00"/>
    </svg>
  `);
}
