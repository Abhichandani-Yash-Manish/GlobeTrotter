export const EXPENSE_CATEGORIES = ['Transport', 'Stay', 'Meals', 'Miscellaneous'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const BUDGET_CATEGORIES = ['Activities', ...EXPENSE_CATEGORIES] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export type CityDto = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  costIndex: number;
  popularity: number;
  description: string | null;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  bestSeason: string | null;
  idealDays: number | null;
  timezone: string | null;
  currencyCode: string | null;
  dailyBudget: number | null;
  tags: string[];
  imageCredit: string | null;
  imageSourceUrl: string | null;
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
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  websiteUrl: string | null;
  bookingUrl: string | null;
  accessibility: string | null;
  tags: string[];
  imageCredit: string | null;
  imageSourceUrl: string | null;
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
  arrivalMode: ArrivalMode;
  arrivalDurationMinutes: number | null;
  city: CityDto;
  activities: ScheduledActivityDto[];
};

export const ARRIVAL_MODES = ['train', 'flight', 'drive', 'transit', 'bike', 'walk', 'other'] as const;
export type ArrivalMode = (typeof ARRIVAL_MODES)[number];

export type TripAccess = 'OWNER' | 'EDITOR' | 'VIEWER';

export type TripCollaborator = {
  id?: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  access: TripAccess;
};

export type MapStop = {
  id: string;
  order: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  arrivalMode: ArrivalMode;
};

export type MapSegment = {
  id: string;
  fromStopId: string;
  toStopId: string;
  mode: ArrivalMode;
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number | null;
  estimated: boolean;
};

export type RouteMapData = {
  stops: MapStop[];
  segments: MapSegment[];
  source: 'geoapify' | 'geodesic-fallback';
};

export type DestinationDetail = CityDto & {
  activities: ActivityDto[];
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
  access?: TripAccess;
  collaborators?: TripCollaborator[];
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
