import { describe, expect, it } from 'vitest';
import { canEditTrip } from '@/lib/trip-access';
import { createOpaqueToken, hashToken } from '@/lib/tokens';

describe('trip collaboration access', () => {
  it('allows owners and editors to mutate, but not viewers', () => {
    expect(canEditTrip('OWNER')).toBe(true);
    expect(canEditTrip('EDITOR')).toBe(true);
    expect(canEditTrip('VIEWER')).toBe(false);
    expect(canEditTrip(null)).toBe(false);
  });

  it('stores one-way hashes rather than raw invite and recovery tokens', () => {
    const created = createOpaqueToken();
    expect(created.token).not.toBe(created.tokenHash);
    expect(created.tokenHash).toHaveLength(64);
    expect(hashToken(created.token)).toBe(created.tokenHash);
  });
});
