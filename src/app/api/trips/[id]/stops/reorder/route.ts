import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { validateExactReorder } from '@/lib/reorder';
import { reorderSchema } from '@/lib/validation';
import { requireTripAccess } from '@/lib/trip-access';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to reorder stops.', 401);
  const { id } = await params;
  const parsed = await parseRequest(request, reorderSchema);
  if (parsed.response) return parsed.response;
  const permission = await requireTripAccess(session.user.id, id, 'edit');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Editing access is required.', 403);
  const trip = await prisma.trip.findUnique({
    where: { id },
    select: { stops: { select: { id: true } } },
  });
  if (!trip) return apiError('NOT_FOUND', 'Trip not found.', 404);
  const reorderError = validateExactReorder(parsed.data.orderedIds, trip.stops.map((stop) => stop.id));
  if (reorderError) return apiError('INVALID_REORDER', reorderError, 400);

  await prisma.$transaction(
    parsed.data.orderedIds.map((stopId, order) =>
      prisma.tripStop.update({ where: { id: stopId }, data: { order } }),
    ),
  );
  return apiData(await getOwnedTripDetail(session.user.id, id));
}
