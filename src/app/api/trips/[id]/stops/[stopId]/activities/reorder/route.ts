import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { validateExactReorder } from '@/lib/reorder';
import { reorderSchema } from '@/lib/validation';
import { requireTripAccess } from '@/lib/trip-access';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; stopId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to reorder activities.', 401);
  const { id, stopId } = await params;
  const parsed = await parseRequest(request, reorderSchema);
  if (parsed.response) return parsed.response;
  const permission = await requireTripAccess(session.user.id, id, 'edit');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Editing access is required.', 403);
  const stop = await prisma.tripStop.findFirst({
    where: { id: stopId, tripId: id },
    select: { activities: { select: { id: true } } },
  });
  if (!stop) return apiError('NOT_FOUND', 'Stop not found in this trip.', 404);
  const reorderError = validateExactReorder(parsed.data.orderedIds, stop.activities.map((activity) => activity.id));
  if (reorderError) return apiError('INVALID_REORDER', reorderError, 400);

  await prisma.$transaction(
    parsed.data.orderedIds.map((activityId, order) =>
      prisma.tripActivity.update({ where: { id: activityId }, data: { order } }),
    ),
  );
  return apiData(await getOwnedTripDetail(session.user.id, id));
}
