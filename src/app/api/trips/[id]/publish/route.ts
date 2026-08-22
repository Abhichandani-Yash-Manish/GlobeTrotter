import { nanoid } from 'nanoid';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { publishSchema } from '@/lib/validation';
import { requireTripAccess } from '@/lib/trip-access';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to publish this trip.', 401);
  const { id } = await params;
  const parsed = await parseRequest(request, publishSchema);
  if (parsed.response) return parsed.response;

  const permission = await requireTripAccess(session.user.id, id, 'owner');
  if (!permission.allowed) return apiError('FORBIDDEN', 'Only the trip owner can publish it.', 403);

  const trip = await prisma.trip.findUnique({
    where: { id },
    select: { id: true, publicId: true, stops: { select: { id: true } } },
  });
  if (!trip) return apiError('NOT_FOUND', 'Trip not found.', 404);
  if (parsed.data.published && trip.stops.length === 0) {
    return apiError('EMPTY_TRIP', 'Add at least one destination before publishing.', 409);
  }

  const publicId = trip.publicId ?? nanoid(12);
  const updated = await prisma.trip.update({
    where: { id },
    data: { isPublic: parsed.data.published, publicId },
    select: { id: true, isPublic: true, publicId: true },
  });
  return apiData({
    ...updated,
    sharePath: updated.isPublic ? `/share/${updated.publicId}` : null,
  });
}
