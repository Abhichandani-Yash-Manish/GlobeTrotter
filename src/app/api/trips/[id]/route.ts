import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { dateKey } from '@/lib/domain';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { deleteTripSchema, updateTripSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view this trip.', 401);
  const { id } = await params;
  const detail = await getOwnedTripDetail(session.user.id, id);
  return detail
    ? apiData(detail)
    : apiError('NOT_FOUND', 'Trip not found.', 404);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to update this trip.', 401);
  const { id } = await params;
  const parsed = await parseRequest(request, updateTripSchema);
  if (parsed.response) return parsed.response;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
    include: { stops: { include: { city: { select: { name: true } } } } },
  });
  if (!trip) return apiError('NOT_FOUND', 'Trip not found.', 404);

  const startDate = parsed.data.startDate
    ? new Date(`${parsed.data.startDate}T00:00:00.000Z`)
    : trip.startDate;
  const endDate = parsed.data.endDate
    ? new Date(`${parsed.data.endDate}T00:00:00.000Z`)
    : trip.endDate;
  if (endDate < startDate) {
    return apiError('INVALID_DATES', 'End date must be on or after the start date.', 400, {
      endDate: ['Choose a later end date.'],
    });
  }

  const outside = trip.stops.find(
    (stop) => stop.startDate < startDate || stop.endDate > endDate,
  );
  if (outside) {
    return apiError(
      'STOP_OUTSIDE_DATES',
      `${outside.city.name} falls outside the new trip dates. Adjust that stop first.`,
      409,
    );
  }

  const data: Prisma.TripUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined) data.description = parsed.data.description || null;
  if (parsed.data.startDate !== undefined) data.startDate = startDate;
  if (parsed.data.endDate !== undefined) data.endDate = endDate;
  if (parsed.data.coverImage !== undefined) data.coverImage = parsed.data.coverImage;
  if (parsed.data.budget !== undefined) data.budget = parsed.data.budget;

  await prisma.trip.update({ where: { id }, data });
  const detail = await getOwnedTripDetail(session.user.id, id);
  return apiData(detail);
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to delete this trip.', 401);
  const { id } = await params;
  const parsed = await parseRequest(request, deleteTripSchema);
  if (parsed.response) return parsed.response;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, name: true, startDate: true },
  });
  if (!trip) return apiError('NOT_FOUND', 'Trip not found.', 404);

  await prisma.trip.delete({ where: { id } });
  return apiData({ id: trip.id, name: trip.name, deletedAt: dateKey(new Date()) });
}
