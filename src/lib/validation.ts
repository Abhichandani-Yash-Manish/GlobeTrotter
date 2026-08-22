import { z } from 'zod';
import { ARRIVAL_MODES, EXPENSE_CATEGORIES } from '@/types/domain';

const trimmed = z.string().trim();
const emailInput = trimmed.toLowerCase().pipe(z.email('Enter a valid email address.'));
const dateInput = trimmed
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD format.')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)), 'Enter a valid date.');
const optionalUrl = z
  .union([z.url('Enter a valid URL.'), z.literal(''), z.null()])
  .transform((value) => value || null);

export const signupSchema = z.object({
  name: trimmed.min(2, 'Name must be at least 2 characters.').max(60),
  email: emailInput,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});

export const createTripSchema = z
  .object({
    name: trimmed.min(1, 'Trip name is required.').max(80),
    description: trimmed.max(600).optional().default(''),
    startDate: dateInput,
    endDate: dateInput,
    coverImage: optionalUrl.optional(),
    budget: z.number().finite().positive('Budget must be greater than zero.').nullable().optional(),
    isPublic: z.boolean().optional().default(false),
  })
  .refine((data) => data.endDate >= data.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after the start date.',
  });

export const updateTripSchema = z
  .object({
    name: trimmed.min(1).max(80).optional(),
    description: trimmed.max(600).nullable().optional(),
    startDate: dateInput.optional(),
    endDate: dateInput.optional(),
    coverImage: optionalUrl.optional(),
    budget: z.number().finite().positive().nullable().optional(),
    isPublic: z.boolean().optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { path: ['endDate'], message: 'End date must be on or after the start date.' },
  );

export const stopSchema = z
  .object({
    cityId: trimmed.min(1, 'Choose a destination.'),
    startDate: dateInput,
    endDate: dateInput,
    notes: trimmed.max(500).optional().default(''),
    arrivalMode: z.enum(ARRIVAL_MODES).optional().default('train'),
    arrivalDurationMinutes: z.number().int().positive().max(10080).nullable().optional(),
  })
  .refine((data) => data.endDate >= data.startDate, {
    path: ['endDate'],
    message: 'Stop end date must be on or after its start date.',
  });

export const updateStopSchema = z.object({
  startDate: dateInput.optional(),
  endDate: dateInput.optional(),
  notes: trimmed.max(500).optional(),
  arrivalMode: z.enum(ARRIVAL_MODES).optional(),
  arrivalDurationMinutes: z.number().int().positive().max(10080).nullable().optional(),
});

export const scheduleActivitySchema = z.object({
  activityId: trimmed.min(1, 'Choose an activity.'),
  date: dateInput,
  startTime: trimmed.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a 24-hour time such as 09:30.').nullable().optional(),
  duration: z.number().finite().positive().max(24).optional(),
  cost: z.number().finite().min(0).optional(),
  notes: trimmed.max(500).optional().default(''),
});

export const updateScheduledActivitySchema = scheduleActivitySchema
  .omit({ activityId: true })
  .partial();

export const expenseSchema = z.object({
  tripStopId: trimmed.min(1).nullable().optional(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().finite().positive('Cost must be greater than zero.'),
  description: trimmed.max(180).optional().default(''),
  date: dateInput,
});

export const updateExpenseSchema = expenseSchema.partial();

export const reorderSchema = z.object({
  orderedIds: z.array(trimmed.min(1)).min(1),
});

export const publishSchema = z.object({
  published: z.boolean(),
});

export const savedDestinationSchema = z.object({
  cityId: trimmed.min(1),
});

export const profileSchema = z.object({
  name: trimmed.min(2).max(60).optional(),
  email: emailInput.optional(),
  avatar: optionalUrl.optional(),
  language: z.enum(['en', 'hi', 'gu']).optional(),
  defaultPrivacy: z.enum(['private', 'public']).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE'),
});

export const deleteTripSchema = z.object({
  confirmation: z.literal('DELETE'),
});

export const forgotPasswordSchema = z.object({ email: emailInput });

export const resetPasswordSchema = z.object({
  token: trimmed.min(20, 'This recovery link is invalid.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});

export const inviteSchema = z.object({
  role: z.enum(['EDITOR', 'VIEWER']),
});

export const mediaMetadataSchema = z.object({
  altText: trimmed.min(2, 'Describe this image.').max(140),
});
