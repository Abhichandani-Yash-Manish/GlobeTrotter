import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError } from '@/lib/api';
import { requireTripAccess } from '@/lib/trip-access';

type RouteContext = { params: Promise<{ id: string; inviteId: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to revoke an invite.', 401);
  const { id, inviteId } = await params;
  const permission = await requireTripAccess(session.user.id, id, 'owner');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Only the trip owner can revoke invites.', 403);
  const result = await prisma.tripInvite.updateMany({
    where: { id: inviteId, tripId: id, revokedAt: null, acceptedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) return apiError('NOT_FOUND', 'Active invite not found.', 404);
  return apiData({ id: inviteId, revoked: true });
}

