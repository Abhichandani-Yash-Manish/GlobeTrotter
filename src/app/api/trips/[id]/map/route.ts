import { auth } from '@/lib/auth';
import { apiData, apiError } from '@/lib/api';
import { getRouteMapData } from '@/lib/map-data';
import { requireTripAccess } from '@/lib/trip-access';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view this route.', 401);
  const { id } = await params;
  const permission = await requireTripAccess(session.user.id, id);
  if (!permission.allowed) return apiError('NOT_FOUND', 'Trip not found.', 404);
  return apiData(await getRouteMapData(id));
}
