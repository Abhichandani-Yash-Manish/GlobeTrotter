import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData } from '@/lib/api';
import { toActivityDto, toCityDto } from '@/lib/trip-data';

export async function GET(request: Request) {
  const session = await auth();
  const params = new URL(request.url).searchParams;
  const query = params.get('q')?.trim();
  const region = params.get('region')?.trim();
  const maxCost = Number(params.get('maxCost'));
  const minPopularity = Number(params.get('minPopularity'));
  const savedOnly = params.get('saved') === 'true';

  const where: Prisma.CityWhereInput = {};
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { country: { contains: query } },
      { description: { contains: query } },
    ];
  }
  if (region && region !== 'All') where.region = region;
  if (Number.isFinite(maxCost) && maxCost > 0) where.costIndex = { lte: maxCost };
  if (Number.isFinite(minPopularity) && minPopularity > 0) {
    where.popularity = { gte: minPopularity };
  }
  if (savedOnly && session?.user?.id) {
    where.savedDestinations = { some: { userId: session.user.id } };
  }

  const cities = await prisma.city.findMany({
    where,
    include: {
      activities: { take: 3, orderBy: { cost: 'asc' } },
      savedDestinations: session?.user?.id
        ? { where: { userId: session.user.id }, select: { id: true } }
        : false,
    },
    orderBy: [{ popularity: 'desc' }, { name: 'asc' }],
    take: 100,
  });

  return apiData(
    cities.map((city) => ({
      ...toCityDto(city),
      saved: 'savedDestinations' in city && city.savedDestinations.length > 0,
      activities: city.activities.map(toActivityDto),
    })),
  );
}
