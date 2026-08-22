import prisma from '@/lib/prisma';
import { dateKey } from '@/lib/domain';
import { requireTripAccess } from '@/lib/trip-access';

function asDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function validateStopPlacement({
  userId,
  tripId,
  startDate,
  endDate,
  excludeStopId,
}: {
  userId: string;
  tripId: string;
  startDate: string;
  endDate: string;
  excludeStopId?: string;
}) {
  const permission = await requireTripAccess(userId, tripId, 'edit');
  if (!permission.allowed) return { error: 'Trip not found.' } as const;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      stops: {
        where: excludeStopId ? { id: { not: excludeStopId } } : undefined,
        include: { city: { select: { name: true } } },
      },
    },
  });

  if (!trip) return { error: 'Trip not found.' } as const;

  const start = asDate(startDate);
  const end = asDate(endDate);
  if (start < trip.startDate || end > trip.endDate) {
    return {
      error: `Keep this stop between ${dateKey(trip.startDate)} and ${dateKey(trip.endDate)}.`,
    } as const;
  }

  const overlap = trip.stops.find(
    (stop) => start <= stop.endDate && end >= stop.startDate,
  );
  if (overlap) {
    return {
      error: `This stop overlaps ${overlap.city.name}, ${dateKey(overlap.startDate)}–${dateKey(overlap.endDate)}.`,
    } as const;
  }

  return { trip } as const;
}

export async function getOwnedStop(userId: string, tripId: string, stopId: string) {
  const permission = await requireTripAccess(userId, tripId, 'edit');
  if (!permission.allowed) return null;
  return prisma.tripStop.findFirst({
    where: { id: stopId, tripId },
    include: { trip: true, city: true },
  });
}

export function isDateWithin(date: string, start: Date, end: Date): boolean {
  const value = asDate(date);
  return value >= start && value <= end;
}

export function toUtcDate(date: string): Date {
  return asDate(date);
}
