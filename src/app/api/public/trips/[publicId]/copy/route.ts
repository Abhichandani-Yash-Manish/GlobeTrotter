import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError } from '@/lib/api';
import { tripDetailInclude } from '@/lib/trip-data';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to copy this trip.', 401);
  const { publicId } = await params;
  const source = await prisma.trip.findFirst({
    where: { publicId, isPublic: true },
    include: tripDetailInclude,
  });
  if (!source) return apiError('NOT_FOUND', 'This shared trip is no longer available.', 404);

  const copy = await prisma.$transaction(async (transaction) => {
    const trip = await transaction.trip.create({
      data: {
        name: `${source.name} — my copy`,
        description: source.description,
        startDate: source.startDate,
        endDate: source.endDate,
        coverImage: source.coverImage,
        budget: source.budget,
        isPublic: false,
        userId: session.user.id,
      },
    });

    const stopMap = new Map<string, string>();
    for (const stop of source.stops) {
      const createdStop = await transaction.tripStop.create({
        data: {
          tripId: trip.id,
          cityId: stop.cityId,
          startDate: stop.startDate,
          endDate: stop.endDate,
          order: stop.order,
          notes: stop.notes,
          arrivalMode: stop.arrivalMode,
          arrivalDurationMinutes: stop.arrivalDurationMinutes,
        },
      });
      stopMap.set(stop.id, createdStop.id);

      if (stop.activities.length > 0) {
        await transaction.tripActivity.createMany({
          data: stop.activities.map((scheduled) => ({
            tripStopId: createdStop.id,
            activityId: scheduled.activityId,
            date: scheduled.date,
            startTime: scheduled.startTime,
            duration: scheduled.duration,
            cost: scheduled.cost,
            notes: scheduled.notes,
            order: scheduled.order,
          })),
        });
      }
    }

    if (source.expenses.length > 0) {
      await transaction.expense.createMany({
        data: source.expenses.map((expense) => ({
          tripId: trip.id,
          tripStopId: expense.tripStopId ? stopMap.get(expense.tripStopId) ?? null : null,
          category: expense.category,
          amount: expense.amount,
          description: expense.description,
          date: expense.date,
        })),
      });
    }
    return trip;
  });

  return apiData({ id: copy.id }, 201);
}
