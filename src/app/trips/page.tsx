import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { TripListClient, type TripListItem } from '@/components/trip-list-client';
import { dateKey } from '@/lib/domain';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'My trips' };

export default async function TripsPage() {
  const user = await requireUser();
  const records = await prisma.trip.findMany({ where: { userId: user.id }, include: { stops: { include: { city: true, activities: { include: { activity: true } } }, orderBy: { order: 'asc' } }, expenses: true }, orderBy: { startDate: 'desc' } });
  const trips: TripListItem[] = records.map((trip) => ({
    id: trip.id, name: trip.name, description: trip.description, startDate: dateKey(trip.startDate), endDate: dateKey(trip.endDate), coverImage: trip.coverImage, budget: trip.budget, isPublic: trip.isPublic, publicId: trip.publicId, stopCount: trip.stops.length, stopNames: trip.stops.map((stop) => stop.city.name),
    spent: trip.expenses.reduce((total, expense) => total + expense.amount, 0) + trip.stops.flatMap((stop) => stop.activities).reduce((total, item) => total + (item.cost ?? item.activity.cost), 0),
  }));
  return <AppShell><div className="page-width content-page"><header className="page-heading page-heading-row"><div><div className="eyebrow">ROUTE ARCHIVE</div><h1>My trips.</h1><p>Search, reopen, publish, or retire every route in your notebook.</p></div><Link className="button button-primary" href="/trips/new"><Plus size={17} /> New trip</Link></header><TripListClient initialTrips={trips} /></div></AppShell>;
}
