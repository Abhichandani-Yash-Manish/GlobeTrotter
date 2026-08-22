import type { Metadata } from 'next';
import Link from 'next/link';
import { Edit3 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { ItineraryView } from '@/components/itinerary-view';
import { PublishControls } from '@/components/publish-controls';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { requireUser } from '@/lib/session';
import { getOwnedTripDetail } from '@/lib/trip-data';
import { getRouteMapData } from '@/lib/map-data';

export const metadata: Metadata = { title: 'Trip itinerary' };

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const detail = await getOwnedTripDetail(user.id, id);
  if (!detail) notFound();
  const mapData = await getRouteMapData(id);
  return <AppShell><div className="trip-detail-hero"><div className="trip-detail-image"><ImageWithFallback src={detail.trip.coverImage} alt={detail.trip.name} sizes="100vw" priority /></div><div className="trip-detail-overlay page-width"><div><div className="eyebrow">ITINERARY · {detail.trip.startDate} / {detail.trip.endDate}</div><h1>{detail.trip.name}</h1><p>{detail.trip.description}</p></div><div className="title-actions">{detail.access !== 'VIEWER' && <Link className="button button-light" href={`/trips/${id}/edit`}><Edit3 size={17} /> Edit route</Link>}{detail.access === 'OWNER' && <PublishControls tripId={id} initialPublic={detail.trip.isPublic} publicId={detail.trip.publicId} />}</div></div></div><div className="page-width itinerary-page"><ItineraryView detail={detail} mapData={mapData} /></div></AppShell>;
}
