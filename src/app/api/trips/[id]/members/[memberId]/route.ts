import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError } from '@/lib/api';
import { requireTripAccess } from '@/lib/trip-access';

type RouteContext = { params: Promise<{ id: string; memberId: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to remove a collaborator.', 401);
  const { id, memberId } = await params;
  const permission = await requireTripAccess(session.user.id, id, 'owner');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Only the trip owner can remove collaborators.', 403);
  const result = await prisma.tripMember.deleteMany({ where: { id: memberId, tripId: id } });
  if (!result.count) return apiError('NOT_FOUND', 'Collaborator not found.', 404);
  return apiData({ id: memberId, removed: true });
}

