import { describe, expect, it } from 'vitest';
import { canEditTrip } from '@/lib/trip-access';
import { createOpaqueToken, hashToken, isOpaqueTokenActive } from '@/lib/tokens';

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

  it('rejects expired, reused, and revoked one-time tokens', () => {
    const now = new Date('2026-08-22T08:00:00.000Z');
    expect(isOpaqueTokenActive({ expiresAt: new Date('2026-08-22T08:01:00.000Z') }, now)).toBe(true);
    expect(isOpaqueTokenActive({ expiresAt: new Date('2026-08-22T07:59:00.000Z') }, now)).toBe(false);
    expect(isOpaqueTokenActive({ expiresAt: new Date('2026-08-22T08:01:00.000Z'), usedAt: now }, now)).toBe(false);
    expect(isOpaqueTokenActive({ expiresAt: new Date('2026-08-22T08:01:00.000Z'), revokedAt: now }, now)).toBe(false);
  });
});
