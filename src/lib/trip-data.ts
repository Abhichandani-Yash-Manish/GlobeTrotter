import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { calculateBudget, calculateTripHealth, dateKey } from '@/lib/domain';
import type {
  ActivityDto,
  CityDto,
  ExpenseCategory,
  ExpenseDto,
  PlannerStop,
  ScheduledActivityDto,
  TripDetail,
  TripDto,
} from '@/types/domain';

export const tripDetailInclude = {
  stops: {
    include: {
      city: true,
      activities: {
        include: { activity: true },
        orderBy: { order: 'asc' as const },
      },
    },
    orderBy: { order: 'asc' as const },
  },
  expenses: { orderBy: { date: 'asc' as const } },
  user: { select: { name: true, avatar: true } },
} satisfies Prisma.TripInclude;

export type TripRecord = Prisma.TripGetPayload<{ include: typeof tripDetailInclude }>;

export function toCityDto(city: TripRecord['stops'][number]['city']): CityDto {
  return {
    id: city.id,
    name: city.name,
    country: city.country,
    region: city.region,
    costIndex: city.costIndex,
    popularity: city.popularity,
    description: city.description,
    imageUrl: city.imageUrl,
    latitude: city.latitude,
    longitude: city.longitude,
  };
}

function toActivityDto(activity: TripRecord['stops'][number]['activities'][number]['activity']): ActivityDto {
  return {
    id: activity.id,
    name: activity.name,
    description: activity.description,
    category: activity.category,
    cost: activity.cost,
    duration: activity.duration,
    imageUrl: activity.imageUrl,
    cityId: activity.cityId,
  };
}

function toScheduledActivityDto(
  scheduled: TripRecord['stops'][number]['activities'][number],
): ScheduledActivityDto {
  return {
    id: scheduled.id,
    activityId: scheduled.activityId,
    date: dateKey(scheduled.date),
    startTime: scheduled.startTime,
    duration: scheduled.duration ?? scheduled.activity.duration,
    cost: scheduled.cost ?? scheduled.activity.cost,
    notes: scheduled.notes,
    order: scheduled.order,
    activity: toActivityDto(scheduled.activity),
  };
}

function toStopDto(stop: TripRecord['stops'][number]): PlannerStop {
  return {
    id: stop.id,
    cityId: stop.cityId,
    startDate: dateKey(stop.startDate),
    endDate: dateKey(stop.endDate),
    order: stop.order,
    notes: stop.notes,
    city: toCityDto(stop.city),
    activities: stop.activities.map(toScheduledActivityDto),
  };
}

function normalizeExpenseCategory(category: string): ExpenseCategory {
  if (category === 'Accommodation') return 'Stay';
  if (category === 'Transport' || category === 'Stay' || category === 'Meals') return category;
  return 'Miscellaneous';
}

function toExpenseDto(expense: TripRecord['expenses'][number]): ExpenseDto {
  return {
    id: expense.id,
    tripId: expense.tripId,
    tripStopId: expense.tripStopId,
    category: normalizeExpenseCategory(expense.category),
    amount: expense.amount,
    description: expense.description,
    date: dateKey(expense.date),
  };
}

export function toTripDto(trip: TripRecord): TripDto {
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    startDate: dateKey(trip.startDate),
    endDate: dateKey(trip.endDate),
    coverImage: trip.coverImage,
    budget: trip.budget,
    isPublic: trip.isPublic,
    publicId: trip.publicId,
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
  };
}

export function toTripDetail(record: TripRecord, includeAuthor = false): TripDetail {
  const trip = toTripDto(record);
  const stops = record.stops.map(toStopDto);
  const expenses = record.expenses.map(toExpenseDto);
  return {
    trip,
    stops,
    expenses,
    budget: calculateBudget(trip, stops, expenses),
    health: calculateTripHealth(trip, stops, expenses),
    ...(includeAuthor ? { author: record.user } : {}),
  };
}

export async function getOwnedTripDetail(userId: string, tripId: string): Promise<TripDetail | null> {
  const record = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: tripDetailInclude,
  });
  return record ? toTripDetail(record) : null;
}

export async function getPublicTripDetail(publicId: string): Promise<TripDetail | null> {
  const record = await prisma.trip.findFirst({
    where: { publicId, isPublic: true },
    include: tripDetailInclude,
  });
  return record ? toTripDetail(record, true) : null;
}
