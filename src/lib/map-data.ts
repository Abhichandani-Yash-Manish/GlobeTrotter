import prisma from '@/lib/prisma';
import type { ArrivalMode, MapSegment, RouteMapData } from '@/types/domain';

type Coordinate = [number, number];

function radians(value: number) {
  return (value * Math.PI) / 180;
}

function haversineKm(from: Coordinate, to: Coordinate) {
  const earthKm = 6371;
  const deltaLat = radians(to[1] - from[1]);
  const deltaLon = radians(to[0] - from[0]);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(from[1])) * Math.cos(radians(to[1])) * Math.sin(deltaLon / 2) ** 2;
  return Math.round(earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function geoapifyMode(mode: ArrivalMode) {
  if (mode === 'drive') return 'drive';
  if (mode === 'bike') return 'bicycle';
  if (mode === 'walk') return 'walk';
  if (mode === 'transit') return 'transit';
  return null;
}

function flattenCoordinates(value: unknown): Coordinate[] {
  if (!Array.isArray(value)) return [];
  if (value.length >= 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
    return [[value[0], value[1]]];
  }
  return value.flatMap(flattenCoordinates);
}

async function enhancedSegment(fromCityId: string, toCityId: string, from: Coordinate, to: Coordinate, mode: ArrivalMode) {
  const providerMode = geoapifyMode(mode);
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!providerMode || !apiKey) return null;
  const cached = await prisma.routeSegmentCache.findUnique({
    where: { fromCityId_toCityId_mode_provider: { fromCityId, toCityId, mode, provider: 'geoapify' } },
  });
  if (cached && cached.expiresAt > new Date()) {
    return {
      coordinates: JSON.parse(cached.geometry) as Coordinate[],
      distanceKm: cached.distanceKm,
      durationMinutes: cached.durationMinutes,
    };
  }

  try {
    const url = new URL('https://api.geoapify.com/v1/routing');
    url.searchParams.set('waypoints', `${from[1]},${from[0]}|${to[1]},${to[0]}`);
    url.searchParams.set('mode', providerMode);
    url.searchParams.set('apiKey', apiKey);
    const response = await fetch(url, { signal: AbortSignal.timeout(4500), cache: 'no-store' });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      features?: Array<{ geometry?: { coordinates?: unknown }; properties?: { distance?: number; time?: number } }>;
    };
    const feature = payload.features?.[0];
    const coordinates = flattenCoordinates(feature?.geometry?.coordinates);
    if (coordinates.length < 2 || !feature?.properties?.distance) return null;
    const data = {
      coordinates,
      distanceKm: Math.round(feature.properties.distance / 1000),
      durationMinutes: Math.max(1, Math.round((feature.properties.time ?? 0) / 60)),
    };
    await prisma.routeSegmentCache.upsert({
      where: { fromCityId_toCityId_mode_provider: { fromCityId, toCityId, mode, provider: 'geoapify' } },
      create: {
        fromCityId, toCityId, mode, provider: 'geoapify', geometry: JSON.stringify(data.coordinates),
        distanceKm: data.distanceKm, durationMinutes: data.durationMinutes, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        geometry: JSON.stringify(data.coordinates), distanceKm: data.distanceKm,
        durationMinutes: data.durationMinutes, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return data;
  } catch {
    return null;
  }
}

export async function getRouteMapData(tripId: string): Promise<RouteMapData> {
  const stops = await prisma.tripStop.findMany({
    where: { tripId, city: { latitude: { not: null }, longitude: { not: null } } },
    include: { city: true },
    orderBy: { order: 'asc' },
  });
  const mapStops = stops.map((stop) => ({
    id: stop.id,
    order: stop.order,
    name: stop.city.name,
    country: stop.city.country,
    latitude: stop.city.latitude as number,
    longitude: stop.city.longitude as number,
    arrivalMode: stop.arrivalMode as ArrivalMode,
  }));
  let usedEnhancedRoute = false;
  const segments: MapSegment[] = [];
  for (let index = 1; index < mapStops.length; index++) {
    const fromStop = mapStops[index - 1];
    const toStop = mapStops[index];
    const from: Coordinate = [fromStop.longitude, fromStop.latitude];
    const to: Coordinate = [toStop.longitude, toStop.latitude];
    const enhanced = await enhancedSegment(stops[index - 1].cityId, stops[index].cityId, from, to, toStop.arrivalMode);
    usedEnhancedRoute ||= Boolean(enhanced);
    segments.push({
      id: `${fromStop.id}-${toStop.id}`,
      fromStopId: fromStop.id,
      toStopId: toStop.id,
      mode: toStop.arrivalMode,
      coordinates: enhanced?.coordinates ?? [from, to],
      distanceKm: enhanced?.distanceKm ?? haversineKm(from, to),
      durationMinutes: enhanced?.durationMinutes ?? stops[index].arrivalDurationMinutes,
      estimated: !enhanced,
    });
  }
  return { stops: mapStops, segments, source: usedEnhancedRoute ? 'geoapify' : 'geodesic-fallback' };
}

