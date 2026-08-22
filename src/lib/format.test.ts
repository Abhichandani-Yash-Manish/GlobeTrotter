import { describe, expect, it } from 'vitest';
import { baseToDisplayAmount, displayToBaseAmount, formatMoney } from '@/lib/format';

describe('currency display', () => {
  it('uses Indian rupees as the default presentation currency', () => {
    expect(formatMoney(100)).toBe('₹9,543');
  });

  it('round-trips rupee form values through the base estimate', () => {
    const base = displayToBaseAmount(125_000);
    expect(baseToDisplayAmount(base)).toBeCloseTo(125_000, 6);
  });
});
