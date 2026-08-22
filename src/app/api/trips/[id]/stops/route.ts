import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { toUtcDate, validateStopPlacement } from '@/lib/planner-guards';
import { stopSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view trip stops.', 401);
  const { id } = await params;
  const detail = await getOwnedTripDetail(session.user.id, id);
  return detail ? apiData(detail.stops) : apiError('NOT_FOUND', 'Trip not found.', 404);
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to add a stop.', 401);
  const { id } = await params;
  const parsed = await parseRequest(request, stopSchema);
  if (parsed.response) return parsed.response;

  const placement = await validateStopPlacement({
    userId: session.user.id,
    tripId: id,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  });
  if (placement.error) return apiError('INVALID_STOP', placement.error, 409);

  const city = await prisma.city.findUnique({
    where: { id: parsed.data.cityId },
    select: { id: true, imageUrl: true },
  });
  if (!city) return apiError('NOT_FOUND', 'Destination not found.', 404);

  await prisma.$transaction(async (transaction) => {
    const order = await transaction.tripStop.count({ where: { tripId: id } });
    await transaction.tripStop.create({
      data: {
        tripId: id,
        cityId: city.id,
        startDate: toUtcDate(parsed.data.startDate),
        endDate: toUtcDate(parsed.data.endDate),
        notes: parsed.data.notes || null,
        order,
      },
    });
    if (!placement.trip.coverImage && city.imageUrl) {
      await transaction.trip.update({ where: { id }, data: { coverImage: city.imageUrl } });
    }
  });

  return apiData(await getOwnedTripDetail(session.user.id, id), 201);
}
