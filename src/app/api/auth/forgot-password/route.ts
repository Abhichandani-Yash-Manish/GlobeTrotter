import prisma from '@/lib/prisma';
import { apiData, parseRequest } from '@/lib/api';
import { emailProvider } from '@/lib/email';
import { createOpaqueToken } from '@/lib/tokens';
import { forgotPasswordSchema } from '@/lib/validation';

const GENERIC_MESSAGE = 'If an account matches that email, a recovery link has been prepared.';

export async function POST(request: Request) {
  const parsed = await parseRequest(request, forgotPasswordSchema);
  if (parsed.response) return parsed.response;

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const { token, tokenHash } = createOpaqueToken();
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      }),
    ]);
    const resetUrl = new URL('/reset-password', request.url);
    resetUrl.searchParams.set('token', token);
    try {
      await emailProvider.sendPasswordRecovery({ recipient: user.email, resetUrl: resetUrl.toString() });
    } catch (error) {
      // Preserve the same public response for known and unknown addresses.
      console.error('[GlobeTrotter recovery] Delivery failed.', error);
    }
  }

  return apiData({ message: GENERIC_MESSAGE });
}
