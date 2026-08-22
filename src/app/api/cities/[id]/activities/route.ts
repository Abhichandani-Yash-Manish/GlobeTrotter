import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { apiData, apiError } from '@/lib/api';
import { toActivityDto } from '@/lib/trip-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get('q')?.trim();
  const category = searchParams.get('category')?.trim();
  const maxCostInput = searchParams.get('maxCost');
  const maxDurationInput = searchParams.get('maxDuration');
  const maxCost = maxCostInput === null ? null : Number(maxCostInput);
  const maxDuration = maxDurationInput === null ? null : Number(maxDurationInput);
  const city = await prisma.city.findUnique({ where: { id }, select: { id: true } });
  if (!city) return apiError('NOT_FOUND', 'Destination not found.', 404);

  const where: Prisma.ActivityWhereInput = { cityId: id };
  if (query) {
    where.OR = [
      { name: { contains: query } },
      { description: { contains: query } },
      { address: { contains: query } },
      { tags: { contains: query } },
    ];
  }
  if (category && category !== 'All') where.category = category;
  if (maxCost !== null && Number.isFinite(maxCost) && maxCost >= 0) where.cost = { lte: maxCost };
  if (maxDuration !== null && Number.isFinite(maxDuration) && maxDuration > 0) {
    where.duration = { lte: maxDuration };
  }

  const activities = await prisma.activity.findMany({
    where,
    orderBy: [{ category: 'asc' }, { cost: 'asc' }],
  });
  return apiData(activities.map(toActivityDto));
}
