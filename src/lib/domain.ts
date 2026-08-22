import {
  BUDGET_CATEGORIES,
  type BudgetCategory,
  type BudgetSummary,
  type ExpenseDto,
  type PlannerStop,
  type TripDto,
  type TripHealthIssue,
} from '@/types/domain';

const DAY_MS = 86_400_000;

export function dateKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

function utcDay(value: string | Date): number {
  const key = dateKey(value);
  return Date.parse(`${key}T00:00:00.000Z`);
}

export function inclusiveDays(start: string | Date, end: string | Date): number {
  return Math.max(1, Math.floor((utcDay(end) - utcDay(start)) / DAY_MS) + 1);
}

export function enumerateDates(start: string | Date, end: string | Date): string[] {
  const first = utcDay(start);
  const last = utcDay(end);
  const dates: string[] = [];

  for (let cursor = first; cursor <= last; cursor += DAY_MS) {
    dates.push(new Date(cursor).toISOString().slice(0, 10));
  }

  return dates;
}

function expenseBudgetCategory(category: string): BudgetCategory {
  if (category === 'Accommodation') return 'Stay';
  if (BUDGET_CATEGORIES.includes(category as BudgetCategory)) {
    return category as BudgetCategory;
  }
  return 'Miscellaneous';
}

export function calculateBudget(
  trip: TripDto,
  stops: PlannerStop[],
  expenses: ExpenseDto[],
): BudgetSummary {
  const byCategory = Object.fromEntries(
    BUDGET_CATEGORIES.map((category) => [category, 0]),
  ) as Record<BudgetCategory, number>;
  const spendingByDay = new Map<string, number>();

  for (const stop of stops) {
    for (const scheduled of stop.activities) {
      byCategory.Activities += scheduled.cost;
      const day = dateKey(scheduled.date);
      spendingByDay.set(day, (spendingByDay.get(day) ?? 0) + scheduled.cost);
    }
  }

  for (const expense of expenses) {
    byCategory[expenseBudgetCategory(expense.category)] += expense.amount;
    const day = dateKey(expense.date);
    spendingByDay.set(day, (spendingByDay.get(day) ?? 0) + expense.amount);
  }

  const spent = Object.values(byCategory).reduce((total, amount) => total + amount, 0);
  const dayCount = inclusiveDays(trip.startDate, trip.endDate);
  const dailyBudget = trip.budget === null ? null : trip.budget / dayCount;
  const overBudgetDays = dailyBudget === null
    ? []
    : [...spendingByDay.entries()]
        .filter(([, amount]) => amount > dailyBudget)
        .map(([day]) => day)
        .sort();

  return {
    budget: trip.budget,
    spent,
    remaining: trip.budget === null ? null : trip.budget - spent,
    averagePerDay: spent / dayCount,
    byCategory,
    overBudgetDays,
  };
}

function minutes(time: string): number {
  const [hours = '0', minute = '0'] = time.split(':');
  return Number(hours) * 60 + Number(minute);
}

export function timeRangesOverlap(
  firstStart: string,
  firstDurationHours: number,
  secondStart: string,
  secondDurationHours: number,
): boolean {
  const firstStartMinutes = minutes(firstStart);
  const secondStartMinutes = minutes(secondStart);
  const firstEnd = firstStartMinutes + firstDurationHours * 60;
  const secondEnd = secondStartMinutes + secondDurationHours * 60;
  return firstStartMinutes < secondEnd && secondStartMinutes < firstEnd;
}

export function calculateTripHealth(
  trip: TripDto,
  stops: PlannerStop[],
  expenses: ExpenseDto[],
): TripHealthIssue[] {
  const issues: TripHealthIssue[] = [];
  const tripStart = utcDay(trip.startDate);
  const tripEnd = utcDay(trip.endDate);
  const sortedStops = [...stops].sort((a, b) => utcDay(a.startDate) - utcDay(b.startDate));

  for (const [index, stop] of sortedStops.entries()) {
    const stopStart = utcDay(stop.startDate);
    const stopEnd = utcDay(stop.endDate);

    if (stopStart < tripStart || stopEnd > tripEnd) {
      issues.push({
        id: `stop-range-${stop.id}`,
        severity: 'error',
        title: 'Stop outside trip dates',
        message: `${stop.city.name} must stay between ${dateKey(trip.startDate)} and ${dateKey(trip.endDate)}.`,
        stopId: stop.id,
      });
    }

    const previous = sortedStops[index - 1];
    if (previous && stopStart <= utcDay(previous.endDate)) {
      issues.push({
        id: `stop-overlap-${previous.id}-${stop.id}`,
        severity: 'error',
        title: 'Stops overlap',
        message: `${stop.city.name} overlaps ${previous.city.name}, ${dateKey(previous.startDate)}–${dateKey(previous.endDate)}.`,
        stopId: stop.id,
      });
    }

    if (previous && stopStart > utcDay(previous.endDate) + DAY_MS) {
      issues.push({
        id: `gap-${previous.id}-${stop.id}`,
        severity: 'warning',
        title: 'Uncovered dates',
        message: `No destination is planned between ${previous.city.name} and ${stop.city.name}.`,
        date: dateKey(new Date(utcDay(previous.endDate) + DAY_MS)),
      });
    }

    for (const scheduled of stop.activities) {
      const activityDay = utcDay(scheduled.date);
      if (activityDay < stopStart || activityDay > stopEnd) {
        issues.push({
          id: `activity-range-${scheduled.id}`,
          severity: 'error',
          title: 'Activity outside stop',
          message: `${scheduled.activity.name} must be scheduled during the ${stop.city.name} stop.`,
          date: dateKey(scheduled.date),
          stopId: stop.id,
        });
      }
    }

    const byDate = new Map<string, typeof stop.activities>();
    for (const scheduled of stop.activities) {
      const day = dateKey(scheduled.date);
      byDate.set(day, [...(byDate.get(day) ?? []), scheduled]);
    }

    for (const [day, activities] of byDate) {
      const timed = activities.filter((activity) => activity.startTime);
      for (let first = 0; first < timed.length; first += 1) {
        for (let second = first + 1; second < timed.length; second += 1) {
          const left = timed[first];
          const right = timed[second];
          if (
            left.startTime &&
            right.startTime &&
            timeRangesOverlap(left.startTime, left.duration, right.startTime, right.duration)
          ) {
            issues.push({
              id: `activity-overlap-${left.id}-${right.id}`,
              severity: 'warning',
              title: 'Activities overlap',
              message: `${left.activity.name} overlaps ${right.activity.name} on ${day}.`,
              date: day,
              stopId: stop.id,
            });
          }
        }
      }
    }
  }

  if (sortedStops.length > 0) {
    if (utcDay(sortedStops[0].startDate) > tripStart) {
      issues.push({
        id: 'gap-before-first-stop',
        severity: 'warning',
        title: 'Trip starts uncovered',
        message: `Choose a destination for ${dateKey(trip.startDate)} before ${sortedStops[0].city.name}.`,
        date: dateKey(trip.startDate),
      });
    }
    const last = sortedStops.at(-1);
    if (last && utcDay(last.endDate) < tripEnd) {
      issues.push({
        id: 'gap-after-last-stop',
        severity: 'warning',
        title: 'Trip ends uncovered',
        message: `Choose a destination after ${last.city.name} through ${dateKey(trip.endDate)}.`,
        date: dateKey(new Date(utcDay(last.endDate) + DAY_MS)),
      });
    }
  } else {
    issues.push({
      id: 'no-stops',
      severity: 'warning',
      title: 'Route not started',
      message: 'Add your first destination to turn this trip into an itinerary.',
    });
  }

  const activityDates = new Set(
    stops.flatMap((stop) => stop.activities.map((activity) => dateKey(activity.date))),
  );
  for (const day of enumerateDates(trip.startDate, trip.endDate)) {
    const coveredByStop = stops.some(
      (stop) => utcDay(day) >= utcDay(stop.startDate) && utcDay(day) <= utcDay(stop.endDate),
    );
    if (coveredByStop && !activityDates.has(day)) {
      issues.push({
        id: `empty-day-${day}`,
        severity: 'info',
        title: 'Open day',
        message: `Nothing is scheduled on ${day}; keep it flexible or add an activity.`,
        date: day,
      });
    }
  }

  const budget = calculateBudget(trip, stops, expenses);
  if (budget.remaining !== null && budget.remaining < 0) {
    issues.push({
      id: 'over-budget',
      severity: 'error',
      title: 'Budget exceeded',
      message: `Planned spending is $${Math.abs(budget.remaining).toFixed(0)} over the trip budget.`,
    });
  } else if (budget.overBudgetDays.length > 0) {
    issues.push({
      id: 'daily-budget-pressure',
      severity: 'warning',
      title: 'High-spend days',
      message: `${budget.overBudgetDays.length} day${budget.overBudgetDays.length === 1 ? '' : 's'} exceed the average daily budget.`,
    });
  }

  return issues;
}
