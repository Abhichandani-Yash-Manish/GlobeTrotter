'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CalendarDays, Edit3, Eye, Search, Send, Trash2 } from 'lucide-react';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { requestJson } from '@/lib/client-api';
import { formatMoney } from '@/lib/format';

export type TripListItem = {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  coverImage: string | null;
  budget: number | null;
  spent: number;
  isPublic: boolean;
  publicId: string | null;
  stopCount: number;
  stopNames: string[];
  access: 'OWNER' | 'EDITOR' | 'VIEWER';
};

export function TripListClient({ initialTrips }: { initialTrips: TripListItem[] }) {
  const [trips, setTrips] = useState(initialTrips);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [scope, setScope] = useState<'all' | 'owned' | 'shared'>('all');
  const [message, setMessage] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return trips.filter((trip) => {
      const matchesQuery = trip.name.toLowerCase().includes(query.toLowerCase()) || trip.stopNames.join(' ').toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || (status === 'upcoming' ? trip.endDate >= today : trip.endDate < today);
      const matchesScope = scope === 'all' || (scope === 'owned' ? trip.access === 'OWNER' : trip.access !== 'OWNER');
      return matchesQuery && matchesStatus && matchesScope;
    });
  }, [query, scope, status, trips]);

  async function deleteTrip(trip: TripListItem) {
    if (!window.confirm(`Permanently delete “${trip.name}”? This cannot be undone.`)) return;
    try {
      await requestJson(`/api/trips/${trip.id}`, { method: 'DELETE', body: JSON.stringify({ confirmation: 'DELETE' }) });
      setTrips((current) => current.filter((item) => item.id !== trip.id));
      setMessage(`${trip.name} deleted.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not delete the trip.');
    }
  }

  async function togglePublish(trip: TripListItem) {
    try {
      const result = await requestJson<{ isPublic: boolean; publicId: string }>(`/api/trips/${trip.id}/publish`, { method: 'PUT', body: JSON.stringify({ published: !trip.isPublic }) });
      setTrips((current) => current.map((item) => item.id === trip.id ? { ...item, isPublic: result.isPublic, publicId: result.publicId } : item));
      setMessage(result.isPublic ? `${trip.name} is now public.` : `${trip.name} is private.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update publishing.');
    }
  }

  return (
    <div>
      <div className="trip-list-toolbar">
        <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trips or destinations" aria-label="Search trips" /></label>
        <div className="segmented-control" aria-label="Filter trips">
          {(['all', 'upcoming', 'completed'] as const).map((value) => <button key={value} className={status === value ? 'active' : ''} type="button" onClick={() => setStatus(value)}>{value}</button>)}
        </div>
        <div className="segmented-control" aria-label="Filter trip ownership">{(['all', 'owned', 'shared'] as const).map((value) => <button key={value} className={scope === value ? 'active' : ''} type="button" onClick={() => setScope(value)}>{value}</button>)}</div>
      </div>
      {message && <p className="status-message" role="status">{message}</p>}
      {filtered.length === 0 ? <div className="empty-state"><CalendarDays size={30} /><h2>No trips match this board.</h2><p>Change the filter or issue a new itinerary.</p><Link className="button button-primary" href="/trips/new">Plan a trip</Link></div> : (
        <div className="trip-card-grid">
          {filtered.map((trip) => (
            <article className="trip-card" key={trip.id}>
              <div className="trip-card-image"><ImageWithFallback src={trip.coverImage} alt={trip.name} sizes="(max-width: 760px) 100vw, 33vw" /><span className={`visibility-stamp ${trip.isPublic ? 'public' : ''}`}>{trip.access === 'OWNER' ? (trip.isPublic ? 'PUBLIC' : 'PRIVATE') : `SHARED · ${trip.access}`}</span></div>
              <div className="trip-card-body"><div className="ticket-code">GT · {trip.startDate.slice(2).replaceAll('-', '')}</div><h2>{trip.name}</h2><p>{trip.stopNames.length ? trip.stopNames.join(' → ') : 'Route not started'}</p><div className="trip-stats"><span>{trip.startDate}<small>depart</small></span><span>{trip.stopCount}<small>stops</small></span><span>{formatMoney(trip.spent)}<small>planned</small></span></div></div>
              <div className="trip-card-actions"><Link href={`/trips/${trip.id}`} aria-label={`View ${trip.name}`}><Eye size={17} /></Link>{trip.access !== 'VIEWER' && <Link href={`/trips/${trip.id}/edit`} aria-label={`Edit ${trip.name}`}><Edit3 size={17} /></Link>}{trip.access === 'OWNER' && <button type="button" onClick={() => togglePublish(trip)} aria-label={`${trip.isPublic ? 'Unpublish' : 'Publish'} ${trip.name}`}><Send size={17} /></button>}{trip.access === 'OWNER' && <button className="danger" type="button" onClick={() => deleteTrip(trip)} aria-label={`Delete ${trip.name}`}><Trash2 size={17} /></button>}</div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
