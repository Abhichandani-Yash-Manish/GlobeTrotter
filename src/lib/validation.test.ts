import { describe, expect, it } from 'vitest';
import { createTripSchema, expenseSchema, forgotPasswordSchema, inviteSchema, mediaMetadataSchema, profileSchema, signupSchema, stopSchema } from '@/lib/validation';

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

  it('accepts uploaded media URLs while rejecting guessed local paths', () => {
    expect(profileSchema.safeParse({ avatar: '/api/media/asset_123' }).success).toBe(true);
    expect(profileSchema.safeParse({ avatar: '/uploads/private/avatar.webp' }).success).toBe(false);
  });

  it('validates recovery, invite, and upload metadata inputs', () => {
    expect(forgotPasswordSchema.parse({ email: ' DEMO@GLOBETROTTER.COM ' }).email).toBe('demo@globetrotter.com');
    expect(inviteSchema.safeParse({ role: 'OWNER' }).success).toBe(false);
    expect(mediaMetadataSchema.safeParse({ altText: ' ' }).success).toBe(false);
  });

  it('rejects emails with consecutive dots, leading/trailing dots, or spaces in domain', () => {
    expect(signupSchema.safeParse({ name: 'Test', email: 'user..name@example.com', password: 'password123' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Test', email: '.user@example.com', password: 'password123' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Test', email: 'user.@example.com', password: 'password123' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Test', email: '   ', password: 'password123' }).success).toBe(false);
  });
});
