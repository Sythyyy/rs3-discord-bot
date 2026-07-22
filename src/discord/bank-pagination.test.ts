import { describe, expect, it } from 'vitest';

import { bankPaginationComponents } from './interaction-handler.js';

describe('bankPaginationComponents', () => {
  it('omits buttons for a one-page bank', () => {
    expect(bankPaginationComponents('owner', { page: 1, totalPages: 1 })).toEqual([]);
  });

  it('disables Previous on page one and Next on the final page', () => {
    const first = bankPaginationComponents('owner', { page: 1, totalPages: 2 })[0]!.toJSON();
    expect(first.components).toMatchObject([
      { custom_id: 'bank:owner:1', label: 'Previous', disabled: true },
      { custom_id: 'bank:owner:2', label: 'Next', disabled: false },
    ]);

    const last = bankPaginationComponents('owner', { page: 2, totalPages: 2 })[0]!.toJSON();
    expect(last.components).toMatchObject([
      { custom_id: 'bank:owner:1', label: 'Previous', disabled: false },
      { custom_id: 'bank:owner:2', label: 'Next', disabled: true },
    ]);
  });
});
