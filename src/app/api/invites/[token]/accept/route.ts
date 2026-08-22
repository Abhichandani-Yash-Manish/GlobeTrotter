import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError } from '@/lib/api';
import { hashToken, isOpaqueTokenActive } from '@/lib/tokens';

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in before accepting this invite.', 401);
  const { token } = await params;
  const invite = await prisma.tripInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { trip: { select: { id: true, name: true, userId: true } } },
  });
  if (!invite || !isOpaqueTokenActive({ expiresAt: invite.expiresAt, usedAt: invite.acceptedAt, revokedAt: invite.revokedAt })) {
    return apiError('INVALID_INVITE', 'This invite is invalid, expired, or has already been used.', 400);
  }
  if (invite.trip.userId === session.user.id) {
    return apiError('ALREADY_OWNER', 'You already own this trip.', 409);
  }

  await prisma.$transaction([
    prisma.tripMember.upsert({
      where: { tripId_userId: { tripId: invite.tripId, userId: session.user.id } },
      create: { tripId: invite.tripId, userId: session.user.id, role: invite.role },
      update: { role: invite.role },
    }),
    prisma.tripInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } }),
  ]);
  return apiData({ tripId: invite.trip.id, tripName: invite.trip.name, access: invite.role });
}
