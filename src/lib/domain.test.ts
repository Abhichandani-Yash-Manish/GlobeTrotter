import { describe, expect, it } from 'vitest';
import { calculateBudget, calculateTripHealth, inclusiveDays, timeRangesOverlap } from '@/lib/domain';
import type { ActivityDto, ExpenseDto, PlannerStop, TripDto } from '@/types/domain';

const trip: TripDto = {
  id: 'trip-1',
  name: 'Test route',
  description: null,
  startDate: '2026-09-01',
  endDate: '2026-09-05',
  coverImage: null,
  budget: 500,
  isPublic: false,
  publicId: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const activity: ActivityDto = {
  id: 'activity-1',
  name: 'Museum route',
  description: null,
  category: 'Culture',
  cost: 70,
  duration: 2,
  imageUrl: null,
  cityId: 'city-1',
  address: null,
  latitude: null,
  longitude: null,
  websiteUrl: null,
  bookingUrl: null,
  accessibility: null,
  tags: [],
  imageCredit: null,
  imageSourceUrl: null,
};

function stop(overrides: Partial<PlannerStop> = {}): PlannerStop {
  return {
    id: 'stop-1',
    cityId: 'city-1',
    startDate: '2026-09-01',
    endDate: '2026-09-03',
    order: 0,
    notes: null,
    arrivalMode: 'train',
    arrivalDurationMinutes: null,
    city: {
      id: 'city-1', slug: 'lisbon-portugal', name: 'Lisbon', country: 'Portugal', region: 'Europe',
      costIndex: 3, popularity: 4.4, description: null, imageUrl: null,
      latitude: null, longitude: null,
      bestSeason: null, idealDays: null, timezone: null, currencyCode: null,
      dailyBudget: null, tags: [], imageCredit: null, imageSourceUrl: null,
    },
    activities: [],
    ...overrides,
  };
}

describe('trip date and schedule rules', () => {
  it('counts both departure and return dates', () => {
    expect(inclusiveDays('2026-01-31', '2026-02-02')).toBe(3);
  });

  it('detects clock-time overlaps but allows back-to-back activities', () => {
    expect(timeRangesOverlap('09:00', 2, '10:30', 1)).toBe(true);
    expect(timeRangesOverlap('09:00', 2, '11:00', 1)).toBe(false);
  });

  it('reports overlapping stops, uncovered dates, and overlapping activities', () => {
    const first = stop({
      activities: [
        { id: 'scheduled-1', activityId: activity.id, date: '2026-09-01', startTime: '09:00', duration: 2, cost: 70, notes: null, order: 0, activity },
        { id: 'scheduled-2', activityId: activity.id, date: '2026-09-01', startTime: '10:00', duration: 1, cost: 20, notes: null, order: 1, activity: { ...activity, id: 'activity-2', name: 'Gallery' } },
      ],
    });
    const second = stop({ id: 'stop-2', cityId: 'city-2', startDate: '2026-09-03', endDate: '2026-09-04', order: 1, city: { ...first.city, id: 'city-2', name: 'Madrid', country: 'Spain' } });
    const issues = calculateTripHealth(trip, [first, second], []);
    expect(issues.map((issue) => issue.title)).toEqual(expect.arrayContaining(['Stops overlap', 'Activities overlap', 'Trip ends uncovered']));
  });
});

describe('budget aggregation', () => {
  it('adds scheduled activities once and groups non-activity expenses', () => {
    const scheduledStop = stop({ activities: [{ id: 'scheduled-1', activityId: activity.id, date: '2026-09-01', startTime: '09:00', duration: 2, cost: 70, notes: null, order: 0, activity }] });
    const expenses: ExpenseDto[] = [
      { id: 'expense-1', tripId: trip.id, tripStopId: null, category: 'Transport', amount: 120, description: null, date: '2026-09-01' },
      { id: 'expense-2', tripId: trip.id, tripStopId: null, category: 'Stay', amount: 200, description: null, date: '2026-09-02' },
    ];
    const budget = calculateBudget(trip, [scheduledStop], expenses);
    expect(budget.spent).toBe(390);
    expect(budget.remaining).toBe(110);
    expect(budget.byCategory).toMatchObject({ Activities: 70, Transport: 120, Stay: 200 });
  });

  it('flags days above the average daily ceiling', () => {
    const lowBudgetTrip = { ...trip, budget: 100 };
    const expenses: ExpenseDto[] = [{ id: 'expense-1', tripId: trip.id, tripStopId: null, category: 'Transport', amount: 60, description: null, date: '2026-09-01' }];
    expect(calculateBudget(lowBudgetTrip, [], expenses).overBudgetDays).toEqual(['2026-09-01']);
  });
});
