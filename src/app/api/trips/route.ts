import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { dateKey } from '@/lib/domain';
import { createTripSchema } from '@/lib/validation';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to view your trips.', 401);

  const searchParams = new URL(request.url).searchParams;
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status');
  const where: Prisma.TripWhereInput = {
    OR: [{ userId: session.user.id }, { members: { some: { userId: session.user.id } } }],
  };

  if (search) where.name = { contains: search };
  const now = new Date();
  if (status === 'upcoming') where.startDate = { gt: now };
  if (status === 'ongoing') {
    where.startDate = { lte: now };
    where.endDate = { gte: now };
  }
  if (status === 'completed') where.endDate = { lt: now };

  const trips = await prisma.trip.findMany({
    where,
    include: {
      stops: {
        include: {
          city: true,
          activities: { include: { activity: true } },
        },
        orderBy: { order: 'asc' },
      },
      expenses: true,
      members: { where: { userId: session.user.id }, select: { role: true } },
    },
    orderBy: { startDate: 'desc' },
  });

  return apiData(
    trips.map((trip) => ({
      id: trip.id,
      access: trip.userId === session.user.id ? 'OWNER' : trip.members[0]?.role,
      name: trip.name,
      description: trip.description,
      startDate: dateKey(trip.startDate),
      endDate: dateKey(trip.endDate),
      coverImage: trip.coverImage,
      budget: trip.budget,
      isPublic: trip.isPublic,
      publicId: trip.publicId,
      stopCount: trip.stops.length,
      activityCount: trip.stops.reduce((total, stop) => total + stop.activities.length, 0),
      spent:
        trip.expenses.reduce((total, expense) => total + expense.amount, 0) +
        trip.stops.reduce(
          (total, stop) =>
            total +
            stop.activities.reduce(
              (subtotal, activity) => subtotal + (activity.cost ?? activity.activity.cost),
              0,
            ),
          0,
        ),
      stops: trip.stops.map((stop) => ({
        id: stop.id,
        city: {
          id: stop.city.id,
          name: stop.city.name,
          country: stop.city.country,
          imageUrl: stop.city.imageUrl,
        },
      })),
    })),
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to create a trip.', 401);

  const parsed = await parseRequest(request, createTripSchema);
  if (parsed.response) return parsed.response;

  const [user, fallbackCity] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { defaultPrivacy: true },
    }),
    prisma.city.findFirst({ orderBy: { popularity: 'desc' }, select: { imageUrl: true } }),
  ]);

  const trip = await prisma.trip.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      startDate: new Date(`${parsed.data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${parsed.data.endDate}T00:00:00.000Z`),
      coverImage: parsed.data.coverImage ?? fallbackCity?.imageUrl ?? null,
      budget: parsed.data.budget ?? null,
      isPublic: parsed.data.isPublic || user?.defaultPrivacy === 'public',
      userId: session.user.id,
    },
    select: { id: true },
  });

  return apiData(trip, 201);
}
