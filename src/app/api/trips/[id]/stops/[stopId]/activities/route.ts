import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { getOwnedStop, isDateWithin, toUtcDate } from '@/lib/planner-guards';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { scheduleActivitySchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string; stopId: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to add an activity.', 401);
  const { id, stopId } = await params;
  const parsed = await parseRequest(request, scheduleActivitySchema);
  if (parsed.response) return parsed.response;

  const stop = await getOwnedStop(session.user.id, id, stopId);
  if (!stop) return apiError('NOT_FOUND', 'Stop not found in this trip.', 404);
  if (!isDateWithin(parsed.data.date, stop.startDate, stop.endDate)) {
    return apiError(
      'INVALID_ACTIVITY_DATE',
      `Schedule this activity between ${stop.startDate.toISOString().slice(0, 10)} and ${stop.endDate.toISOString().slice(0, 10)}.`,
      409,
    );
  }

  const activity = await prisma.activity.findFirst({
    where: { id: parsed.data.activityId, cityId: stop.cityId },
  });
  if (!activity) {
    return apiError('INVALID_ACTIVITY', `Choose an activity available in ${stop.city.name}.`, 404);
  }

  const order = await prisma.tripActivity.count({ where: { tripStopId: stopId } });
  await prisma.tripActivity.create({
    data: {
      tripStopId: stopId,
      activityId: activity.id,
      date: toUtcDate(parsed.data.date),
      startTime: parsed.data.startTime ?? null,
      duration: parsed.data.duration ?? activity.duration,
      cost: parsed.data.cost ?? activity.cost,
      notes: parsed.data.notes || null,
      order,
    },
  });

  return apiData(await getOwnedTripDetail(session.user.id, id), 201);
}
