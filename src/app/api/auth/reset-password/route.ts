import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { hashToken, isOpaqueTokenActive } from '@/lib/tokens';
import { resetPasswordSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = await parseRequest(request, resetPasswordSchema);
  if (parsed.response) return parsed.response;

  const token = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
  });
  if (!token || !isOpaqueTokenActive(token)) {
    return apiError('INVALID_TOKEN', 'This recovery link is invalid or has expired.', 400);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: token.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
  ]);

  return apiData({ message: 'Password updated. You can sign in now.' });
}
