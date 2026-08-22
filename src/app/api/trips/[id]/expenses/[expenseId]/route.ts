import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiData, apiError, parseRequest } from '@/lib/api';
import { dateKey } from '@/lib/domain';
import { isDateWithin, toUtcDate } from '@/lib/planner-guards';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { updateExpenseSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string; expenseId: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to update this cost.', 401);
  const { id, expenseId } = await params;
  const parsed = await parseRequest(request, updateExpenseSchema);
  if (parsed.response) return parsed.response;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId: id, trip: { userId: session.user.id } },
    include: { trip: true },
  });
  if (!expense) return apiError('NOT_FOUND', 'Cost not found in this trip.', 404);
  const expenseDate = parsed.data.date ?? dateKey(expense.date);
  if (!isDateWithin(expenseDate, expense.trip.startDate, expense.trip.endDate)) {
    return apiError('INVALID_EXPENSE_DATE', 'Keep this cost within the trip dates.', 409);
  }
  if (parsed.data.tripStopId) {
    const stop = await prisma.tripStop.findFirst({
      where: { id: parsed.data.tripStopId, tripId: id },
      select: { id: true },
    });
    if (!stop) return apiError('INVALID_STOP', 'That stop does not belong to this trip.', 400);
  }

  const data: Prisma.ExpenseUpdateInput = {};
  if (parsed.data.tripStopId !== undefined) {
    data.tripStop = parsed.data.tripStopId
      ? { connect: { id: parsed.data.tripStopId } }
      : { disconnect: true };
  }
  if (parsed.data.category !== undefined) data.category = parsed.data.category;
  if (parsed.data.amount !== undefined) data.amount = parsed.data.amount;
  if (parsed.data.description !== undefined) data.description = parsed.data.description || null;
  if (parsed.data.date !== undefined) data.date = toUtcDate(expenseDate);
  await prisma.expense.update({ where: { id: expenseId }, data });
  return apiData(await getOwnedTripDetail(session.user.id, id));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return apiError('UNAUTHORIZED', 'Sign in to remove this cost.', 401);
  const { id, expenseId } = await params;
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, tripId: id, trip: { userId: session.user.id } },
    select: { id: true },
  });
  if (!expense) return apiError('NOT_FOUND', 'Cost not found in this trip.', 404);
  await prisma.expense.delete({ where: { id: expenseId } });
  return apiData(await getOwnedTripDetail(session.user.id, id));
}
