import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError } from '@/lib/api';
import { requireTripAccess } from '@/lib/trip-access';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view collaborators.', 401);
  const { id } = await params;
  const permission = await requireTripAccess(session.user.id, id);
  if (!permission.allowed) return apiError('NOT_FOUND', 'Trip not found.', 404);
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: {
      user: { select: { id: true, name: true, avatar: true } },
      members: { include: { user: { select: { id: true, name: true, avatar: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!trip) return apiError('NOT_FOUND', 'Trip not found.', 404);
  return apiData([
    { userId: trip.user.id, name: trip.user.name, avatarUrl: trip.user.avatar, access: 'OWNER' },
    ...trip.members.map((member) => ({ id: member.id, userId: member.user.id, name: member.user.name, avatarUrl: member.user.avatar, access: member.role })),
  ]);
}
