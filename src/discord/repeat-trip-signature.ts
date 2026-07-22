import { createHmac, timingSafeEqual } from 'node:crypto';

const PREFIX = 'repeatwc';

export class RepeatTripSigner {
  public constructor(private readonly secret: string) {
    if (secret.length < 16)
      throw new Error('Repeat-trip signing secret must be at least 16 characters.');
  }

  public create(activityKey: string, ownerId: string, sourceActivityId: string): string {
    if (!activityKey.startsWith('woodcutting_')) throw new Error('Only Woodcutting trips repeat.');
    const treeKey = activityKey.slice('woodcutting_'.length);
    const compactSourceId = sourceActivityId.replaceAll('-', '');
    const payload = `${treeKey}:${ownerId}:${compactSourceId}`;
    return `${PREFIX}:${payload}:${this.signature(payload)}`;
  }

  public verify(customId: string): {
    activityKey: string;
    ownerId: string;
    sourceActivityId: string;
  } | null {
    const [prefix, treeKey, ownerId, compactSourceId, signature] = customId.split(':');
    if (
      prefix !== PREFIX ||
      !treeKey ||
      !ownerId ||
      !compactSourceId ||
      !signature ||
      !/^[a-f0-9]{32}$/i.test(compactSourceId)
    )
      return null;
    const payload = `${treeKey}:${ownerId}:${compactSourceId}`;
    const expected = this.signature(payload);
    const suppliedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(suppliedBuffer, expectedBuffer)
    )
      return null;
    try {
      const sourceActivityId = compactSourceId.replace(
        /^(........)(....)(....)(....)(............)$/,
        '$1-$2-$3-$4-$5',
      );
      return {
        activityKey: `woodcutting_${treeKey}`,
        ownerId,
        sourceActivityId,
      };
    } catch {
      return null;
    }
  }

  private signature(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url').slice(0, 16);
  }
}
