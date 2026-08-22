import { describe, expect, it } from 'vitest';
import { flattenCoordinates, geoapifyMode, haversineKm } from '@/lib/map-math';

describe('route map fallbacks', () => {
  it('calculates a stable geodesic estimate when routing is unavailable', () => {
    expect(haversineKm([72.5714, 23.0225], [72.8777, 19.076])).toBe(440);
  });

  it('flattens valid GeoJSON coordinates and rejects malformed payloads', () => {
    expect(flattenCoordinates([[[72.57, 23.02], [72.88, 19.08]]])).toEqual([[72.57, 23.02], [72.88, 19.08]]);
    expect(flattenCoordinates({ coordinates: 'invalid' })).toEqual([]);
  });

  it('only sends routing modes supported by the provider', () => {
    expect(geoapifyMode('drive')).toBe('drive');
    expect(geoapifyMode('bike')).toBe('bicycle');
    expect(geoapifyMode('flight')).toBeNull();
    expect(geoapifyMode('train')).toBeNull();
  });
});
