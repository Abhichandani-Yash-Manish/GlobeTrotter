import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarDays, Compass, MapPin, Plus, Share2, WalletCards } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { CurrencyPocket } from '@/components/currency-pocket';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { dateKey } from '@/lib/domain';
import { formatMoney } from '@/lib/format';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Dashboard' };

const DASHBOARD_DESTINATIONS = ['Goa', 'Mumbai', 'Paris', 'Tokyo'];

export default async function DashboardPage() {
  const user = await requireUser();
  const [trips, destinations, savedDestinations] = await Promise.all([
    prisma.trip.findMany({
      where: { OR: [{ userId: user.id }, { members: { some: { userId: user.id } } }] },
      include: { stops: { include: { city: true, activities: { include: { activity: true } } }, orderBy: { order: 'asc' } }, expenses: true, members: { where: { userId: user.id }, select: { role: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 8,
    }),
    prisma.city.findMany({ where: { name: { in: DASHBOARD_DESTINATIONS } } }),
    prisma.savedDestination.findMany({ where: { userId: user.id }, include: { city: true }, orderBy: { createdAt: 'desc' }, take: 4 }),
  ]);
  const chronologicalTrips = [...trips].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const orderedDestinations = DASHBOARD_DESTINATIONS.flatMap((name) => destinations.filter((city) => city.name === name));
  const nextTrip = (user.email === 'demo@globetrotter.com' ? trips.find((trip) => trip.publicId === 'demo-western-india') : undefined)
    ?? chronologicalTrips.find((trip) => trip.endDate >= new Date())
    ?? chronologicalTrips[0];
  const plannedSpend = nextTrip
    ? nextTrip.expenses.reduce((total, expense) => total + expense.amount, 0) + nextTrip.stops.flatMap((stop) => stop.activities).reduce((total, item) => total + (item.cost ?? item.activity.cost), 0)
    : 0;
  const warnings = nextTrip ? [
    ...(nextTrip.stops.length === 0 ? ['Add the first destination'] : []),
    ...(nextTrip.stops.some((stop) => stop.activities.length === 0) ? ['One or more stops have open days'] : []),
    ...(nextTrip.budget !== null && plannedSpend > nextTrip.budget ? ['Planned costs exceed the trip budget'] : []),
  ] : [];

  return (
    <AppShell>
      <div className="page-width content-page dashboard-page">
        <header className="dashboard-heading"><div><div className="eyebrow">CONTROL BOARD · {new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}</div><h1>Where to next, {user.name.split(' ')[0]}?</h1><p>Your live routes, open decisions, and saved ideas are all on one board.</p></div><Link className="button button-primary" href="/trips/new"><Plus size={18} /> Plan a trip</Link></header>
        <section className="dashboard-metrics" aria-label="Travel summary">
          <article><CalendarDays /><div><strong>{trips.length}</strong><span>routes in notebook</span></div></article>
          <article><MapPin /><div><strong>{trips.reduce((total, trip) => total + trip.stops.length, 0)}</strong><span>destination stops</span></div></article>
          <article><WalletCards /><div><strong>{formatMoney(plannedSpend)}</strong><span>next route planned</span></div></article>
        </section>
        <CurrencyPocket />
        {nextTrip ? (
          <section className="next-trip-feature">
            <div className="next-trip-image"><ImageWithFallback src={nextTrip.coverImage} alt={nextTrip.name} sizes="(max-width: 900px) 100vw, 45vw" priority /></div>
            <div className="next-trip-copy"><div className="ticket-code">NEXT DEPARTURE · {dateKey(nextTrip.startDate)}</div><h2>{nextTrip.name}</h2><p>{nextTrip.description}</p><div className="route-inline">{nextTrip.stops.length ? nextTrip.stops.map((stop) => stop.city.name).join(' → ') : 'Route still waiting for its first stop'}</div><dl><div><dt>DATES</dt><dd>{dateKey(nextTrip.startDate)} — {dateKey(nextTrip.endDate)}</dd></div><div><dt>BUDGET</dt><dd>{nextTrip.budget ? formatMoney(nextTrip.budget) : 'Open'}</dd></div><div><dt>STATUS</dt><dd>{nextTrip.isPublic ? 'Published' : 'Private draft'}</dd></div></dl><div className="hero-actions"><Link className="button button-dark" href={`/trips/${nextTrip.id}/edit`}>Continue planning <ArrowRight size={17} /></Link><Link className="button button-ghost" href={`/trips/${nextTrip.id}`}>Review itinerary</Link></div></div>
          </section>
        ) : (
          <section className="empty-state featured-empty"><Compass size={36} /><h2>Your board is clear.</h2><p>Create the first trip and turn a destination idea into a route.</p><Link className="button button-primary" href="/trips/new">Plan the first trip</Link></section>
        )}
        {warnings.length > 0 && <section className="dashboard-alert"><AlertTriangle size={20} /><div><strong>Route needs attention</strong>{warnings.map((warning) => <span key={warning}>{warning}</span>)}</div><Link href={`/trips/${nextTrip?.id}/edit`}>Resolve in planner <ArrowRight size={15} /></Link></section>}
        <section className="dashboard-section"><div className="section-title-row"><div><div className="eyebrow">RECENT ROUTES · OWNED + SHARED</div><h2>Your working notebook.</h2></div><Link href="/trips">Open all <ArrowRight size={16} /></Link></div><div className="dashboard-trip-ledger">{trips.slice(0, 4).map((trip) => { const access = trip.userId === user.id ? 'OWNER' : trip.members[0]?.role ?? 'VIEWER'; const spent = trip.expenses.reduce((total, expense) => total + expense.amount, 0) + trip.stops.flatMap((stop) => stop.activities).reduce((total, item) => total + (item.cost ?? item.activity.cost), 0); return <article key={trip.id}><span className="ledger-code">{access === 'OWNER' ? 'OWN' : 'SHR'}</span><div><strong>{trip.name}</strong><small>{trip.stops.map((stop) => stop.city.name).join(' → ') || 'No stops yet'}</small></div><span><b>{formatMoney(spent)}</b><small>{dateKey(trip.startDate)}</small></span><Link href={`/trips/${trip.id}`}>{access === 'VIEWER' ? 'View' : 'Continue'} <ArrowRight size={14} /></Link></article>; })}</div></section>
        {savedDestinations.length > 0 && <section className="dashboard-section"><div className="section-title-row"><div><div className="eyebrow">SAVED FOR LATER</div><h2>Ideas ready for a route.</h2></div><Link href="/settings">Manage saved <ArrowRight size={16} /></Link></div><div className="saved-dashboard-strip">{savedDestinations.map(({ city }) => <Link href={`/explore/${city.slug}`} key={city.id}><div className="saved-dashboard-image"><ImageWithFallback src={city.imageUrl} alt={city.name} sizes="220px" /></div><span><strong>{city.name}</strong><small>{city.bestSeason ?? city.region}</small></span><Share2 size={15} /></Link>)}</div></section>}
        <section className="dashboard-section"><div className="section-title-row"><div><div className="eyebrow">DISCOVERY BOARD · NEAR + FAR</div><h2>Destinations with momentum.</h2></div><Link href="/explore">See all <ArrowRight size={16} /></Link></div><div className="recommendation-strip">{orderedDestinations.map((city) => <article key={city.id}><div className="recommendation-image"><ImageWithFallback src={city.imageUrl} alt={city.name} sizes="(max-width: 760px) 80vw, 25vw" /></div><div><span>{city.region}</span><h3>{city.name}</h3><p>{city.country} · {city.popularity.toFixed(1)} popularity</p></div></article>)}</div></section>
      </div>
    </AppShell>
  );
}
