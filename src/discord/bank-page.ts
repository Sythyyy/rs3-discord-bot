export const BANK_ITEMS_PER_PAGE = 90;

export interface BankStack {
  itemKey: string;
  name: string;
  iconFile: string;
  quantity: bigint;
  unitValue: bigint;
}

export interface BankPage {
  items: readonly BankStack[];
  page: number;
  totalPages: number;
  totalValue: bigint;
  maxValue: bigint;
}

export function getBankPage(stacks: ReadonlyArray<BankStack>, requestedPage: number): BankPage {
  const owned = stacks.filter((item) => item.quantity > 0n);
  const totalPages = Math.max(1, Math.ceil(owned.length / BANK_ITEMS_PER_PAGE));
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > totalPages)
    throw new Error(`Bank page must be between 1 and ${totalPages}.`);

  const stackValues = owned.map((item) => item.quantity * item.unitValue);
  const totalValue = stackValues.reduce((total, value) => total + value, 0n);
  const maxValue = stackValues.reduce((maximum, value) => (value > maximum ? value : maximum), 0n);
  const start = (requestedPage - 1) * BANK_ITEMS_PER_PAGE;
  return {
    items: owned.slice(start, start + BANK_ITEMS_PER_PAGE),
    page: requestedPage,
    totalPages,
    totalValue,
    maxValue,
  };
}

export function bankPageCustomId(ownerId: string, page: number): string {
  return `bank:${ownerId}:${page}`;
}

export function parseBankPageCustomId(
  customId: string,
  interactionUserId: string,
): { ownerId: string; page: number } {
  const [prefix, ownerId, pageText, ...extra] = customId.split(':');
  const page = Number(pageText);
  if (prefix !== 'bank' || !ownerId || extra.length > 0 || !Number.isSafeInteger(page) || page < 1)
    throw new Error('This bank page button is invalid.');
  if (interactionUserId !== ownerId) throw new Error("Only the bank's owner can change pages.");
  return { ownerId, page };
}

export function formatBankQuantity(quantity: bigint): string {
  const units = [
    { threshold: 1_000_000_000n, suffix: 'B' },
    { threshold: 1_000_000n, suffix: 'M' },
    { threshold: 1_000n, suffix: 'K' },
  ] as const;
  for (const { threshold, suffix } of units) {
    if (quantity < threshold) continue;
    const tenths = (quantity * 10n) / threshold;
    const whole = tenths / 10n;
    const decimal = tenths % 10n;
    return decimal === 0n ? `${whole}${suffix}` : `${whole}.${decimal}${suffix}`;
  }
  return quantity.toString();
}
