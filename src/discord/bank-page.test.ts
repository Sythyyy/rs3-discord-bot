import { describe, expect, it } from 'vitest';

import {
  BANK_ITEMS_PER_PAGE,
  bankPageCustomId,
  formatBankQuantity,
  getBankPage,
  parseBankPageCustomId,
  type BankStack,
} from './bank-page.js';

function stack(index: number, quantity = BigInt(index + 1), unitValue = 2n): BankStack {
  return {
    itemKey: `item_${String(index).padStart(2, '0')}`,
    name: `Item ${index}`,
    iconFile: `item_${index}.png`,
    quantity,
    unitValue,
  };
}

describe('getBankPage', () => {
  it('renders only owned, non-zero item stacks while preserving order', () => {
    const page = getBankPage([stack(0, 3n), stack(1, 0n), stack(2, -1n), stack(3, 4n)], 1);
    expect(page.items.map((item) => item.itemKey)).toEqual(['item_00', 'item_03']);
  });

  it('fits 90 unique stacks on one page', () => {
    const page = getBankPage(
      Array.from({ length: BANK_ITEMS_PER_PAGE }, (_, index) => stack(index)),
      1,
    );
    expect(page.items).toHaveLength(90);
    expect(page.totalPages).toBe(1);
  });

  it('puts the ninety-first unique stack on a second page', () => {
    const stacks = Array.from({ length: 91 }, (_, index) => stack(index));
    expect(getBankPage(stacks, 1)).toMatchObject({ totalPages: 2 });
    expect(getBankPage(stacks, 2).items.map((item) => item.itemKey)).toEqual(['item_90']);
  });

  it('keeps quantities and calculates total and maximum stack value from unit values', () => {
    const page = getBankPage([stack(0, 387n, 4n), stack(1, 2_600n, 3n)], 1);
    expect(page.items.map((item) => item.quantity)).toEqual([387n, 2_600n]);
    expect(page.totalValue).toBe(9_348n);
    expect(page.maxValue).toBe(7_800n);
  });

  it('represents an empty bank as one empty page', () => {
    expect(getBankPage([], 1)).toEqual({
      items: [],
      page: 1,
      totalPages: 1,
      totalValue: 0n,
      maxValue: 0n,
    });
  });
});

describe('bank pagination ownership', () => {
  it('accepts the owner and rejects another player', () => {
    const customId = bankPageCustomId('owner-123', 2);
    expect(parseBankPageCustomId(customId, 'owner-123')).toEqual({
      ownerId: 'owner-123',
      page: 2,
    });
    expect(() => parseBankPageCustomId(customId, 'other-player')).toThrow(
      "Only the bank's owner can change pages.",
    );
  });
});

describe('formatBankQuantity', () => {
  it.each([
    [387n, '387'],
    [1_200n, '1.2K'],
    [2_600n, '2.6K'],
    [1_200_000n, '1.2M'],
  ])('formats %s as %s', (quantity, expected) => {
    expect(formatBankQuantity(quantity)).toBe(expected);
  });
});
