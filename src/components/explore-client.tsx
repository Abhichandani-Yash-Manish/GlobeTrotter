'use client';

import { Bookmark, MapPin, Search, Star } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { StatusMessage } from '@/components/status-message';
import { requestJson } from '@/lib/client-api';
import { formatMoney } from '@/lib/format';
import type { ActivityDto, CityDto } from '@/types/domain';

export type ExploreCity = CityDto & { activities: ActivityDto[] };

export function ExploreClient({ initialCities }: { initialCities: ExploreCity[] }) {
  const [cities, setCities] = useState(initialCities);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function filterCities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const key of ['q', 'region', 'maxCost', 'minPopularity', 'saved']) {
      const value = String(form.get(key) ?? '');
      if (value && value !== 'All' && value !== 'false') params.set(key, value);
    }
    setBusy(true);
    try {
      setCities(await requestJson<ExploreCity[]>(`/api/cities?${params}`));
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not filter destinations.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleSaved(city: ExploreCity) {
    try {
      await requestJson('/api/saved-destinations', { method: city.saved ? 'DELETE' : 'POST', body: JSON.stringify({ cityId: city.id }) });
      setCities((current) => current.map((item) => item.id === city.id ? { ...item, saved: !item.saved } : item));
      setMessage(city.saved ? `${city.name} removed from saved destinations.` : `${city.name} saved for later.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update saved destinations.');
    }
  }

  return (
    <div>
      <form className="explore-filters" onSubmit={filterCities}>
        <label className="search-field"><Search size={17} /><input name="q" placeholder="City, country, or idea" aria-label="Search destinations" /></label>
        <select name="region" aria-label="Region"><option>All</option><option>Europe</option><option>Asia</option><option>Africa</option><option>North America</option><option>South America</option><option>Oceania</option><option>Middle East</option></select>
        <select name="maxCost" aria-label="Maximum cost"><option value="">Any cost</option><option value="2">Budget · $$</option><option value="3.5">Balanced · $$$</option><option value="5">All costs</option></select>
        <select name="minPopularity" aria-label="Minimum popularity"><option value="">Any rating</option><option value="4">4+ popular</option><option value="4.5">4.5+ icons</option></select>
        <label className="checkbox-field"><input name="saved" value="true" type="checkbox" /> Saved only</label>
        <button className="button button-dark" type="submit" disabled={busy}>Update board</button>
      </form>
      <StatusMessage message={message} tone={message?.startsWith('Could') ? 'error' : 'success'} />
      <div className="destination-grid">
        {cities.map((city) => (
          <article className="destination-card" key={city.id}>
            <div className="destination-image"><ImageWithFallback src={city.imageUrl} alt={city.name} sizes="(max-width: 760px) 100vw, 33vw" /><button className={`save-button ${city.saved ? 'saved' : ''}`} type="button" onClick={() => toggleSaved(city)} aria-label={`${city.saved ? 'Remove' : 'Save'} ${city.name}`}><Bookmark size={17} fill={city.saved ? 'currentColor' : 'none'} /></button></div>
            <div className="destination-copy"><div className="destination-heading"><div><h2>{city.name}</h2><p><MapPin size={13} /> {city.country} · {city.region}</p></div><span><Star size={14} fill="currentColor" /> {city.popularity.toFixed(1)}</span></div><p>{city.description}</p><div className="cost-dots" aria-label={`Cost index ${city.costIndex} out of 5`}>{[1,2,3,4,5].map((dot) => <i key={dot} className={dot <= Math.round(city.costIndex) ? 'filled' : ''} />)}<small>estimated cost</small></div><div className="activity-preview">{city.activities.slice(0, 3).map((activity) => <span key={activity.id}>{activity.name}<strong>{formatMoney(activity.cost)}</strong></span>)}</div></div>
          </article>
        ))}
      </div>
      {cities.length === 0 && <div className="empty-state"><MapPin size={30} /><h2>No destinations match.</h2><p>Widen the filters to reopen the board.</p></div>}
    </div>
  );
}
