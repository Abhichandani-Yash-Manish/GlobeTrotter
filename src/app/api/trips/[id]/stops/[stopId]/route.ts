import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { dateKey } from '@/lib/domain';
import { getOwnedStop, toUtcDate, validateStopPlacement } from '@/lib/planner-guards';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { updateStopSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string; stopId: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to update this stop.', 401);
  const { id, stopId } = await params;
  const parsed = await parseRequest(request, updateStopSchema);
  if (parsed.response) return parsed.response;

  const stop = await getOwnedStop(session.user.id, id, stopId);
  if (!stop) return apiError('NOT_FOUND', 'Stop not found in this trip.', 404);
  const startDate = parsed.data.startDate ?? dateKey(stop.startDate);
  const endDate = parsed.data.endDate ?? dateKey(stop.endDate);
  if (endDate < startDate) {
    return apiError('INVALID_DATES', 'Stop end date must be on or after its start date.', 400);
  }

  const placement = await validateStopPlacement({
    userId: session.user.id,
    tripId: id,
    startDate,
    endDate,
    excludeStopId: stopId,
  });
  if (placement.error) return apiError('INVALID_STOP', placement.error, 409);

  const data: Prisma.TripStopUpdateInput = {};
  if (parsed.data.startDate !== undefined) data.startDate = toUtcDate(startDate);
  if (parsed.data.endDate !== undefined) data.endDate = toUtcDate(endDate);
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null;
  await prisma.tripStop.update({ where: { id: stopId }, data });
  return apiData(await getOwnedTripDetail(session.user.id, id));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to remove this stop.', 401);
  const { id, stopId } = await params;
  const stop = await getOwnedStop(session.user.id, id, stopId);
  if (!stop) return apiError('NOT_FOUND', 'Stop not found in this trip.', 404);

  await prisma.$transaction(async (transaction) => {
    await transaction.tripStop.delete({ where: { id: stopId } });
    const remaining = await transaction.tripStop.findMany({
      where: { tripId: id },
      orderBy: { order: 'asc' },
      select: { id: true },
    });
    await Promise.all(
      remaining.map((item, order) =>
        transaction.tripStop.update({ where: { id: item.id }, data: { order } }),
      ),
    );
  });

  return apiData(await getOwnedTripDetail(session.user.id, id));
}
