import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Compass, MapPin, Plus, WalletCards } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { dateKey } from '@/lib/domain';
import { formatMoney } from '@/lib/format';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  const [trips, destinations] = await Promise.all([
    prisma.trip.findMany({
      where: { userId: user.id },
      include: { stops: { include: { city: true, activities: { include: { activity: true } } }, orderBy: { order: 'asc' } }, expenses: true },
      orderBy: { startDate: 'asc' },
      take: 6,
    }),
    prisma.city.findMany({ orderBy: [{ popularity: 'desc' }, { costIndex: 'asc' }], take: 4 }),
  ]);
  const nextTrip = trips.find((trip) => trip.endDate >= new Date()) ?? trips[0];
  const plannedSpend = nextTrip
    ? nextTrip.expenses.reduce((total, expense) => total + expense.amount, 0) + nextTrip.stops.flatMap((stop) => stop.activities).reduce((total, item) => total + (item.cost ?? item.activity.cost), 0)
    : 0;

  return (
    <AppShell>
      <div className="page-width content-page dashboard-page">
        <header className="dashboard-heading"><div><div className="eyebrow">CONTROL BOARD · {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}</div><h1>Where to next, {user.name.split(' ')[0]}?</h1><p>Your live routes, open decisions, and saved ideas are all on one board.</p></div><Link className="button button-primary" href="/trips/new"><Plus size={18} /> Plan a trip</Link></header>
        <section className="dashboard-metrics" aria-label="Travel summary">
          <article><CalendarDays /><div><strong>{trips.length}</strong><span>routes in notebook</span></div></article>
          <article><MapPin /><div><strong>{trips.reduce((total, trip) => total + trip.stops.length, 0)}</strong><span>destination stops</span></div></article>
          <article><WalletCards /><div><strong>{formatMoney(plannedSpend)}</strong><span>next route planned</span></div></article>
        </section>
        {nextTrip ? (
          <section className="next-trip-feature">
            <div className="next-trip-image"><ImageWithFallback src={nextTrip.coverImage} alt={nextTrip.name} sizes="(max-width: 900px) 100vw, 45vw" priority /></div>
            <div className="next-trip-copy"><div className="ticket-code">NEXT DEPARTURE · {dateKey(nextTrip.startDate)}</div><h2>{nextTrip.name}</h2><p>{nextTrip.description}</p><div className="route-inline">{nextTrip.stops.length ? nextTrip.stops.map((stop) => stop.city.name).join(' → ') : 'Route still waiting for its first stop'}</div><dl><div><dt>DATES</dt><dd>{dateKey(nextTrip.startDate)} — {dateKey(nextTrip.endDate)}</dd></div><div><dt>BUDGET</dt><dd>{nextTrip.budget ? formatMoney(nextTrip.budget) : 'Open'}</dd></div><div><dt>STATUS</dt><dd>{nextTrip.isPublic ? 'Published' : 'Private draft'}</dd></div></dl><div className="hero-actions"><Link className="button button-dark" href={`/trips/${nextTrip.id}/edit`}>Continue planning <ArrowRight size={17} /></Link><Link className="button button-ghost" href={`/trips/${nextTrip.id}`}>Review itinerary</Link></div></div>
          </section>
        ) : (
          <section className="empty-state featured-empty"><Compass size={36} /><h2>Your board is clear.</h2><p>Create the first trip and turn a destination idea into a route.</p><Link className="button button-primary" href="/trips/new">Plan the first trip</Link></section>
        )}
        <section className="dashboard-section"><div className="section-title-row"><div><div className="eyebrow">RECOMMENDED FROM THE DATABASE</div><h2>Destinations with momentum.</h2></div><Link href="/explore">See all <ArrowRight size={16} /></Link></div><div className="recommendation-strip">{destinations.map((city) => <article key={city.id}><div className="recommendation-image"><ImageWithFallback src={city.imageUrl} alt={city.name} sizes="(max-width: 760px) 80vw, 25vw" /></div><div><span>{city.region}</span><h3>{city.name}</h3><p>{city.country} · {city.popularity.toFixed(1)} popularity</p></div></article>)}</div></section>
      </div>
    </AppShell>
  );
}
