import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError } from '@/lib/api';
import { toActivityDto, toCityDto } from '@/lib/trip-data';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  const city = await prisma.city.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      activities: { orderBy: [{ category: 'asc' }, { name: 'asc' }] },
      savedDestinations: session?.user?.id ? { where: { userId: session.user.id }, select: { id: true } } : false,
    },
  });
  if (!city) return apiError('NOT_FOUND', 'Destination not found.', 404);
  return apiData({
    ...toCityDto(city),
    saved: Array.isArray(city.savedDestinations) && city.savedDestinations.length > 0,
    activities: city.activities.map(toActivityDto),
  });
}
