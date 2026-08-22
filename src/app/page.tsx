import Link from 'next/link';
import { ArrowRight, CalendarDays, Check, IndianRupee, MapPin, Route } from 'lucide-react';
import { MarketingHeader } from '@/components/marketing-header';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { RouteRibbon } from '@/components/route-ribbon';
import { auth } from '@/lib/auth';
import { formatMoney } from '@/lib/format';
import prisma from '@/lib/prisma';
import { getPublicTripDetail } from '@/lib/trip-data';

const FEATURED_DESTINATIONS = ['Mumbai', 'Goa', 'Udaipur', 'Paris', 'Tokyo', 'Cape Town'];

export default async function Home() {
  const [session, indiaPreview, fallbackPreview, destinations] = await Promise.all([
    auth(),
    getPublicTripDetail('demo-western-india'),
    getPublicTripDetail('demo-europe-trip'),
    prisma.city.findMany({ where: { name: { in: FEATURED_DESTINATIONS } } }),
  ]);
  const preview = indiaPreview ?? fallbackPreview;
  const orderedDestinations = FEATURED_DESTINATIONS.flatMap((name) => destinations.filter((city) => city.name === name));

  return (
    <div className="marketing-page">
      <MarketingHeader />
      <main>
        <section className="hero page-width">
          <div className="hero-copy">
            <div className="eyebrow">ITINERARY CONTROL · WITHOUT THE SPREADSHEET</div>
            <h1>Every great trip has a <em>route.</em></h1>
            <p>Build a multi-city journey, make every day fit, and keep the budget honest—then hand someone a link they can actually use.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href={session ? '/trips/new' : '/signup'}>Plan a trip <ArrowRight size={18} /></Link>
              <Link className="button button-ghost" href={preview?.trip.publicId ? `/share/${preview.trip.publicId}` : '/explore'}>View a live itinerary</Link>
            </div>
            <div className="hero-proof"><span><Check size={15} /> persisted in SQLite</span><span><Check size={15} /> budget recalculates live</span><span><Check size={15} /> explainable trip checks</span></div>
          </div>
          {preview && (
            <div className="hero-board">
              <div className="board-topline"><span>{indiaPreview ? 'GT 079' : 'GT LIVE'}</span><strong>{indiaPreview ? 'WESTERN INDIA / SOUTHBOUND' : 'LIVE ROUTE / DEPARTURE BOARD'}</strong><span>ON TIME</span></div>
              <div className="board-trip"><div><small>TRIP</small><h2>{preview.trip.name}</h2></div><div><small>DATES</small><strong>{preview.trip.startDate.slice(5)} — {preview.trip.endDate.slice(5)}</strong></div></div>
              <RouteRibbon stops={preview.stops} health={preview.health} compact />
              <div className="board-metrics"><span><Route size={17} /><strong>{preview.stops.length}</strong><small>cities</small></span><span><CalendarDays size={17} /><strong>{preview.stops.reduce((total, stop) => total + stop.activities.length, 0)}</strong><small>activities</small></span><span><IndianRupee size={17} /><strong>{formatMoney(preview.budget.spent)}</strong><small>planned</small></span></div>
            </div>
          )}
        </section>
        <section className="marquee" aria-label="Product principles"><div>ROUTE WITH INTENT <span>•</span> COSTS WITHOUT SURPRISES <span>•</span> SHARE WITHOUT SIGN-UP <span>•</span> ROUTE WITH INTENT <span>•</span> COSTS WITHOUT SURPRISES</div></section>
        <section className="page-width landing-section">
          <div className="section-heading"><div className="eyebrow">DESTINATION BOARD · INDIA TO THE WORLD</div><h2>One passport. A world of routes.</h2><p>Begin close to home or cross continents—every destination and estimate comes from the GlobeTrotter database.</p></div>
          <div className="destination-teaser-grid">
            {orderedDestinations.map((city, index) => <article key={city.id} className="destination-teaser"><div className="destination-image"><ImageWithFallback src={city.imageUrl} alt={city.name} sizes="(max-width: 760px) 100vw, 33vw" /></div><span className="teaser-index">0{index + 1}</span><div><h3>{city.name}</h3><p><MapPin size={13} /> {city.country}</p><small>{city.description}</small></div></article>)}
          </div>
        </section>
        <section className="landing-cta"><div className="page-width"><span className="ticket-code">NOW BOARDING · YOUR NEXT ROUTE</span><h2>Turn “we should go” into a day-by-day plan.</h2><Link className="button button-light" href={session ? '/trips/new' : '/signup'}>Open the planner <ArrowRight size={18} /></Link></div></section>
      </main>
      <footer className="site-footer page-width"><span>GlobeTrotter · Odoo Hackathon 2026</span><span>INR planning estimates · locally persisted · built to explain</span></footer>
    </div>
  );
}
