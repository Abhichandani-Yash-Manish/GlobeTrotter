import type { ArrivalMode } from '@/types/domain';

export type Coordinate = [number, number];

function radians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(from: Coordinate, to: Coordinate) {
  const earthKm = 6371;
  const deltaLat = radians(to[1] - from[1]);
  const deltaLon = radians(to[0] - from[0]);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(from[1])) * Math.cos(radians(to[1])) * Math.sin(deltaLon / 2) ** 2;
  return Math.round(earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function geoapifyMode(mode: ArrivalMode) {
  if (mode === 'drive') return 'drive';
  if (mode === 'bike') return 'bicycle';
  if (mode === 'walk') return 'walk';
  if (mode === 'transit') return 'transit';
  return null;
}

export function flattenCoordinates(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) return [];
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    return [[value[0], value[1]]];
  }
  return value.flatMap(flattenCoordinates);
}
