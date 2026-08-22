import { describe, expect, it } from 'vitest';
import { validateExactReorder } from '@/lib/reorder';

describe('exact owned-ID reordering', () => {
  it('accepts all owned IDs in a new order', () => {
    expect(validateExactReorder(['c', 'a', 'b'], ['a', 'b', 'c'])).toBeNull();
  });

  it('rejects duplicates, missing IDs, and guessed foreign IDs', () => {
    expect(validateExactReorder(['a', 'a', 'c'], ['a', 'b', 'c'])).toBeTruthy();
    expect(validateExactReorder(['a', 'b'], ['a', 'b', 'c'])).toBeTruthy();
    expect(validateExactReorder(['a', 'b', 'foreign'], ['a', 'b', 'c'])).toBeTruthy();
  });
});
