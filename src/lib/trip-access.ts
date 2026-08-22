import prisma from '@/lib/prisma';
import type { TripAccess } from '@/types/domain';

export function canEditTrip(access: TripAccess | null): access is 'OWNER' | 'EDITOR' {
  return access === 'OWNER' || access === 'EDITOR';
}

export async function getTripAccess(userId: string, tripId: string): Promise<TripAccess | null> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      userId: true,
      members: { where: { userId }, select: { role: true }, take: 1 },
    },
  });
  if (!trip) return null;
  if (trip.userId === userId) return 'OWNER';
  const role = trip.members[0]?.role;
  return role === 'EDITOR' || role === 'VIEWER' ? role : null;
}

export async function requireTripAccess(
  userId: string,
  tripId: string,
  minimum: 'view' | 'edit' | 'owner' = 'view',
) {
  const access = await getTripAccess(userId, tripId);
  const allowed =
    minimum === 'view'
      ? access !== null
      : minimum === 'edit'
        ? canEditTrip(access)
        : access === 'OWNER';
  return { access, allowed };
}

