import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Brand } from '@/components/brand';
import { CopyTripButton } from '@/components/copy-trip-button';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { ItineraryView } from '@/components/itinerary-view';
import { auth } from '@/lib/auth';
import { getPublicTripDetail } from '@/lib/trip-data';
import { getRouteMapData } from '@/lib/map-data';

export const metadata: Metadata = { title: 'Shared itinerary' };

export default async function SharedTripPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const [detail, session] = await Promise.all([getPublicTripDetail(publicId), auth()]);
  if (!detail) notFound();
  const mapData = await getRouteMapData(detail.trip.id);
  return <div className="shared-page"><header className="shared-header page-width"><Brand /><span>READ-ONLY SHARED ITINERARY</span><Link href={session ? '/dashboard' : '/login'}>{session ? 'Open dashboard' : 'Sign in'}</Link></header><main><div className="trip-detail-hero shared-hero"><div className="trip-detail-image"><ImageWithFallback src={detail.trip.coverImage} alt={detail.trip.name} sizes="100vw" priority /></div><div className="trip-detail-overlay page-width"><div><div className="eyebrow">SHARED BY {detail.author?.name.toUpperCase()} · {detail.trip.startDate} / {detail.trip.endDate}</div><h1>{detail.trip.name}</h1><p>{detail.trip.description}</p></div><CopyTripButton publicId={publicId} signedIn={Boolean(session)} /></div></div><div className="page-width itinerary-page"><div className="shared-note">You are viewing a published snapshot. Copy it to make an independent itinerary you own.</div><ItineraryView detail={detail} mapData={mapData} /></div></main><footer className="site-footer page-width"><span>Made with GlobeTrotter</span><Link href="/">Build your own route →</Link></footer></div>;
}
