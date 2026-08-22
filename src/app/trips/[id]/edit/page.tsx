import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { PlannerClient } from '@/components/planner-client';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { getOwnedTripDetail, toCityDto } from '@/lib/trip-data';
import { getRouteMapData } from '@/lib/map-data';

export const metadata: Metadata = { title: 'Itinerary builder' };

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [detail, cities, mapData] = await Promise.all([
    getOwnedTripDetail(user.id, id),
    prisma.city.findMany({ orderBy: [{ popularity: 'desc' }, { name: 'asc' }], take: 50 }),
    getRouteMapData(id),
  ]);
  if (!detail) notFound();
  return <AppShell><PlannerClient initialDetail={detail} initialCities={cities.map(toCityDto)} initialMapData={mapData} /></AppShell>;
}
