import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { isDateWithin, toUtcDate } from '@/lib/planner-guards';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { expenseSchema } from '@/lib/validation';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to add a cost.', 401);
  const { id } = await params;
  const parsed = await parseRequest(request, expenseSchema);
  if (parsed.response) return parsed.response;

  const trip = await prisma.trip.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, startDate: true, endDate: true },
  });
  if (!trip) return apiError('NOT_FOUND', 'Trip not found.', 404);
  if (!isDateWithin(parsed.data.date, trip.startDate, trip.endDate)) {
    return apiError('INVALID_EXPENSE_DATE', 'Keep this cost within the trip dates.', 409);
  }
  if (parsed.data.tripStopId) {
    const stop = await prisma.tripStop.findFirst({
      where: { id: parsed.data.tripStopId, tripId: id },
      select: { id: true },
    });
    if (!stop) return apiError('INVALID_STOP', 'That stop does not belong to this trip.', 400);
  }

  await prisma.expense.create({
    data: {
      tripId: id,
      tripStopId: parsed.data.tripStopId ?? null,
      category: parsed.data.category,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
      date: toUtcDate(parsed.data.date),
    },
  });
  return apiData(await getOwnedTripDetail(session.user.id, id), 201);
}
