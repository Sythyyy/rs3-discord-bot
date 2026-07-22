import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { BANK_IMAGE_HEIGHT, BANK_IMAGE_WIDTH, renderBankImage } from './bank-image.js';
import { getBankPage, type BankStack } from './bank-page.js';

function stack(index: number, quantity = 1n): BankStack {
  return {
    itemKey: `item_${index}`,
    name: `Item ${index}`,
    iconFile: `missing_${index}.png`,
    quantity,
    unitValue: 2n,
  };
}

describe('renderBankImage', () => {
  it('renders a wide 9-by-10 bank page', async () => {
    const page = getBankPage(
      Array.from({ length: 90 }, (_, index) => stack(index)),
      1,
    );
    const metadata = await sharp(
      await renderBankImage({ ...page, playerName: 'Test Player' }),
    ).metadata();

    expect(metadata).toMatchObject({
      format: 'png',
      width: BANK_IMAGE_WIDTH,
      height: BANK_IMAGE_HEIGHT,
    });
  });

  it('renders the ninety-first stack alone on page two', async () => {
    const stacks = Array.from({ length: 91 }, (_, index) => stack(index));
    const page = getBankPage(stacks, 2);
    expect(page.items).toHaveLength(1);
    const metadata = await sharp(
      await renderBankImage({ ...page, playerName: 'Test Player' }),
    ).metadata();
    expect(metadata).toMatchObject({ width: BANK_IMAGE_WIDTH, height: BANK_IMAGE_HEIGHT });
  });

  it('renders a compact clear empty-bank state', async () => {
    const page = getBankPage([], 1);
    const image = await renderBankImage({ ...page, playerName: 'Test Player' });
    const metadata = await sharp(image).metadata();
    expect(metadata).toMatchObject({ width: BANK_IMAGE_WIDTH, height: 116 });
    expect(image.length).toBeGreaterThan(1_000);
  });

  it('does not render zero-quantity entries passed directly to the image layer', async () => {
    const empty = getBankPage([], 1);
    const image = await renderBankImage({
      ...empty,
      items: [stack(0, 0n)],
      playerName: 'Test Player',
    });
    expect((await sharp(image).metadata()).height).toBe(116);
  });
});
