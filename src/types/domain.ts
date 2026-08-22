export const EXPENSE_CATEGORIES = ['Transport', 'Stay', 'Meals', 'Miscellaneous'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const BUDGET_CATEGORIES = ['Activities', ...EXPENSE_CATEGORIES] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export type CityDto = {
  id: string;
  name: string;
  country: string;
  region: string;
  costIndex: number;
  popularity: number;
  description: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  saved?: boolean;
};

export type ActivityDto = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  cost: number;
  duration: number;
  imageUrl: string | null;
  cityId: string;
};

export type ScheduledActivityDto = {
  id: string;
  activityId: string;
  date: string;
  startTime: string | null;
  duration: number;
  cost: number;
  notes: string | null;
  order: number;
  activity: ActivityDto;
};

export type PlannerStop = {
  id: string;
  cityId: string;
  startDate: string;
  endDate: string;
  order: number;
  notes: string | null;
  city: CityDto;
  activities: ScheduledActivityDto[];
};

export type ExpenseDto = {
  id: string;
  tripId: string;
  tripStopId: string | null;
  category: ExpenseCategory;
  amount: number;
  description: string | null;
  date: string;
};

export type TripDto = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  budget: number | null;
  isPublic: boolean;
  publicId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BudgetSummary = {
  budget: number | null;
  spent: number;
  remaining: number | null;
  averagePerDay: number;
  byCategory: Record<BudgetCategory, number>;
  overBudgetDays: string[];
};

export type TripHealthIssue = {
  id: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  date?: string;
  stopId?: string;
};

export type TripDetail = {
  trip: TripDto;
  stops: PlannerStop[];
  expenses: ExpenseDto[];
  budget: BudgetSummary;
  health: TripHealthIssue[];
  author?: {
    name: string;
    avatar: string | null;
  };
};

export type TripCardDto = TripDto & {
  stops: Array<Pick<PlannerStop, 'id' | 'startDate' | 'endDate' | 'order' | 'city'>>;
  stopCount: number;
  expenseCount: number;
  spent: number;
};

export type ApiResult<T> =
  | { data: T }
  | {
      error: {
        code: string;
        message: string;
        fields?: Record<string, string[]>;
      };
    };
