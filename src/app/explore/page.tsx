import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ExploreClient, type ExploreCity } from '@/components/explore-client';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { toActivityDto, toCityDto } from '@/lib/trip-data';

export const metadata: Metadata = { title: 'Explore destinations' };

export default async function ExplorePage() {
  const user = await requireUser();
  const records = await prisma.city.findMany({
    include: {
      activities: { take: 3, orderBy: { cost: 'asc' } },
      savedDestinations: { where: { userId: user.id }, select: { id: true } },
    },
    orderBy: [{ popularity: 'desc' }, { name: 'asc' }],
    take: 50,
  });
  const cities: ExploreCity[] = records.map((city) => ({
    ...toCityDto(city),
    saved: city.savedDestinations.length > 0,
    activities: city.activities.map(toActivityDto),
  }));
  return <AppShell><div className="page-width content-page"><header className="page-heading"><div className="eyebrow">50 DESTINATIONS · LIVE DATABASE</div><h1>Explore the board.</h1><p>Filter by region, cost, and popularity. Save ideas now; turn them into dated stops when the route is ready.</p></header><ExploreClient initialCities={cities} /></div></AppShell>;
}
