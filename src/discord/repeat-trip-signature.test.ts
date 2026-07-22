import { describe, expect, it } from 'vitest';

import { RepeatTripSigner } from './repeat-trip-signature.js';

describe('RepeatTripSigner', () => {
  const signer = new RepeatTripSigner('a sufficiently long test secret');

  it('round-trips a signed Woodcutting repeat action', () => {
    const customId = signer.create(
      'woodcutting_eternal_magic',
      '123456789012345678',
      '123e4567-e89b-12d3-a456-426614174000',
    );
    expect(customId.length).toBeLessThanOrEqual(100);
    expect(signer.verify(customId)).toEqual({
      activityKey: 'woodcutting_eternal_magic',
      ownerId: '123456789012345678',
      sourceActivityId: '123e4567-e89b-12d3-a456-426614174000',
    });
  });

  it('rejects tampering', () => {
    const customId = signer.create(
      'woodcutting_oak',
      '123456789012345678',
      '123e4567-e89b-12d3-a456-426614174000',
    );
    expect(signer.verify(customId.replace(':oak:', ':yew:'))).toBeNull();
  });
});
