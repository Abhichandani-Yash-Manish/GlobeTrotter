import { describe, expect, it } from 'vitest';
import { createTripSchema, expenseSchema, signupSchema, stopSchema } from '@/lib/validation';

describe('request validation', () => {
  it('normalizes account identity fields', () => {
    const result = signupSchema.parse({ name: '  Alex Traveler ', email: ' ALEX@EXAMPLE.COM ', password: 'password123' });
    expect(result).toMatchObject({ name: 'Alex Traveler', email: 'alex@example.com' });
  });

  it('rejects inverted trip and stop dates', () => {
    expect(createTripSchema.safeParse({ name: 'Broken', startDate: '2026-09-10', endDate: '2026-09-01' }).success).toBe(false);
    expect(stopSchema.safeParse({ cityId: 'city-1', startDate: '2026-09-10', endDate: '2026-09-01' }).success).toBe(false);
  });

  it('rejects unknown expense categories and non-positive amounts', () => {
    expect(expenseSchema.safeParse({ category: 'Activities', amount: 20, date: '2026-09-01' }).success).toBe(false);
    expect(expenseSchema.safeParse({ category: 'Meals', amount: 0, date: '2026-09-01' }).success).toBe(false);
  });
});
