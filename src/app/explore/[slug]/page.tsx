import type { Metadata } from 'next';
import Link from 'next/link';
import { Accessibility, ArrowLeft, Clock3, ExternalLink, MapPin, Sparkles, WalletCards } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AddDestinationToTrip } from '@/components/add-destination-to-trip';
import { AppShell } from '@/components/app-shell';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { RouteMap } from '@/components/route-map';
import prisma from '@/lib/prisma';
import { formatMoney } from '@/lib/format';
import { toActivityDto, toCityDto } from '@/lib/trip-data';
import type { RouteMapData } from '@/types/domain';

export const metadata: Metadata = { title: 'Destination dossier' };

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = await prisma.city.findFirst({
    where: { OR: [{ id: slug }, { slug }] },
    include: { activities: { orderBy: [{ category: 'asc' }, { name: 'asc' }] } },
  });
  if (!city || city.latitude === null || city.longitude === null) notFound();
  const cityDto = toCityDto(city);
  const mapData: RouteMapData = {
    source: 'geodesic-fallback', segments: [],
    stops: [{ id: city.id, order: 0, name: city.name, country: city.country, latitude: city.latitude, longitude: city.longitude, arrivalMode: 'other' }],
  };

  return (
    <AppShell>
      <main className="destination-dossier">
        <section className="destination-dossier-hero">
          <div className="destination-dossier-image"><ImageWithFallback src={city.imageUrl} alt={city.name} sizes="100vw" priority /></div>
          <div className="destination-dossier-overlay page-width">
            <Link className="back-link" href="/explore"><ArrowLeft size={16} /> Back to Explore</Link>
            <div className="destination-title-block">
              <div className="eyebrow">DESTINATION DOSSIER · {city.region}</div>
              <h1>{city.name}</h1>
              <p><MapPin size={15} /> {city.country} · {city.bestSeason ?? 'Year-round discovery'}</p>
            </div>
            <AddDestinationToTrip cityId={city.id} cityName={city.name} />
          </div>
        </section>

        <div className="page-width dossier-layout">
          <section className="dossier-story">
            <div className="eyebrow">FIELD NOTE / {city.slug.toUpperCase()}</div>
            <h2>{city.description}</h2>
            <div className="dossier-facts">
              <div><Clock3 size={19} /><span><small>Ideal stay</small><strong>{city.idealDays ?? 3} days</strong></span></div>
              <div><WalletCards size={19} /><span><small>Daily estimate</small><strong>{formatMoney(city.dailyBudget ?? city.costIndex * 48)}</strong></span></div>
              <div><Sparkles size={19} /><span><small>Atlas rating</small><strong>{city.popularity.toFixed(1)} / 5</strong></span></div>
            </div>
            <div className="tag-row">{cityDto.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          </section>
          <RouteMap data={mapData} compact />
        </div>

        <section className="page-width dossier-activities">
          <header className="section-title-row"><div><div className="eyebrow">CURATED ON THE GROUND</div><h2>{city.activities.length} ways into {city.name}.</h2></div><p>Every card is persisted in SQLite with cost, duration, location, accessibility notes, and image provenance.</p></header>
          <div className="dossier-activity-grid">
            {city.activities.map((record, index) => {
              const activity = toActivityDto(record);
              return (
                <article className="dossier-activity-card" key={activity.id}>
                  <div className="activity-image"><ImageWithFallback src={activity.imageUrl} alt={activity.name} sizes="(max-width: 700px) 100vw, 33vw" /></div>
                  <div className="activity-card-copy"><span className="activity-index">{String(index + 1).padStart(2, '0')} · {activity.category}</span><h3>{activity.name}</h3><p>{activity.description}</p><dl><div><dt>Duration</dt><dd>{activity.duration}h</dd></div><div><dt>Estimate</dt><dd>{formatMoney(activity.cost)}</dd></div></dl><small><MapPin size={13} /> {activity.address}</small>{activity.accessibility && <small><Accessibility size={13} /> {activity.accessibility}</small>}{activity.websiteUrl && <a href={activity.websiteUrl} target="_blank" rel="noreferrer">Official source <ExternalLink size={13} /></a>}</div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
