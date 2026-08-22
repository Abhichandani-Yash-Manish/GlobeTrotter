import { createHash, randomBytes } from 'node:crypto';

export function createOpaqueToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function isOpaqueTokenActive(
  token: { expiresAt: Date; usedAt?: Date | null; revokedAt?: Date | null },
  now = new Date(),
) {
  return !token.usedAt && !token.revokedAt && token.expiresAt > now;
}
