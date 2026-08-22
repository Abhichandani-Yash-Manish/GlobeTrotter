import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { ExploreClient, type ExploreCity } from '@/components/explore-client';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

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
    id: city.id, name: city.name, country: city.country, region: city.region, costIndex: city.costIndex, popularity: city.popularity, description: city.description, imageUrl: city.imageUrl, latitude: city.latitude, longitude: city.longitude, saved: city.savedDestinations.length > 0,
    activities: city.activities.map((activity) => ({ id: activity.id, name: activity.name, description: activity.description, category: activity.category, cost: activity.cost, duration: activity.duration, imageUrl: activity.imageUrl, cityId: activity.cityId })),
  }));
  return <AppShell><div className="page-width content-page"><header className="page-heading"><div className="eyebrow">50 DESTINATIONS · LIVE DATABASE</div><h1>Explore the board.</h1><p>Filter by region, cost, and popularity. Save ideas now; turn them into dated stops when the route is ready.</p></header><ExploreClient initialCities={cities} /></div></AppShell>;
}
