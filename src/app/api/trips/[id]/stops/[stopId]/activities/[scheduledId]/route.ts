import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { dateKey } from '@/lib/domain';
import { isDateWithin, toUtcDate } from '@/lib/planner-guards';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { updateScheduledActivitySchema } from '@/lib/validation';
import { requireTripAccess } from '@/lib/trip-access';

type RouteContext = {
  params: Promise<{ id: string; stopId: string; scheduledId: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to update this activity.', 401);
  const { id, stopId, scheduledId } = await params;
  const parsed = await parseRequest(request, updateScheduledActivitySchema);
  if (parsed.response) return parsed.response;
  const permission = await requireTripAccess(session.user.id, id, 'edit');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Editing access is required.', 403);

  const scheduled = await prisma.tripActivity.findFirst({
    where: {
      id: scheduledId,
      tripStopId: stopId,
      tripStop: { tripId: id },
    },
    include: { tripStop: true },
  });
  if (!scheduled) return apiError('NOT_FOUND', 'Scheduled activity not found in this stop.', 404);

  const activityDate = parsed.data.date ?? dateKey(scheduled.date);
  if (!isDateWithin(activityDate, scheduled.tripStop.startDate, scheduled.tripStop.endDate)) {
    return apiError('INVALID_ACTIVITY_DATE', 'Keep the activity within its destination dates.', 409);
  }

  const data: Prisma.TripActivityUpdateInput = {};
  if (parsed.data.date !== undefined) data.date = toUtcDate(activityDate);
  if (parsed.data.startTime !== undefined) data.startTime = parsed.data.startTime;
  if (parsed.data.duration !== undefined) data.duration = parsed.data.duration;
  if (parsed.data.cost !== undefined) data.cost = parsed.data.cost;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes || null;
  await prisma.tripActivity.update({ where: { id: scheduledId }, data });
  return apiData(await getOwnedTripDetail(session.user.id, id));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to remove this activity.', 401);
  const { id, stopId, scheduledId } = await params;
  const permission = await requireTripAccess(session.user.id, id, 'edit');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Editing access is required.', 403);
  const scheduled = await prisma.tripActivity.findFirst({
    where: {
      id: scheduledId,
      tripStopId: stopId,
      tripStop: { tripId: id },
    },
    select: { id: true },
  });
  if (!scheduled) return apiError('NOT_FOUND', 'Scheduled activity not found in this stop.', 404);
  await prisma.tripActivity.delete({ where: { id: scheduledId } });
  return apiData(await getOwnedTripDetail(session.user.id, id));
}
