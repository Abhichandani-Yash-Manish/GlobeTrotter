'use client';

import { Bookmark, LoaderCircle, MapPin, RotateCcw, Search, Star } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { StatusMessage } from '@/components/status-message';
import { requestJson } from '@/lib/client-api';
import { formatMoney } from '@/lib/format';
import type { ActivityDto, CityDto } from '@/types/domain';

export type ExploreCity = CityDto & { activities: ActivityDto[] };

type DestinationFilters = {
  q: string;
  region: string;
  maxCost: string;
  minPopularity: string;
  saved: boolean;
};

const EMPTY_FILTERS: DestinationFilters = {
  q: '', region: 'All', maxCost: '', minPopularity: '', saved: false,
};

function destinationQuery(filters: DestinationFilters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.region !== 'All') params.set('region', filters.region);
  if (filters.maxCost) params.set('maxCost', filters.maxCost);
  if (filters.minPopularity) params.set('minPopularity', filters.minPopularity);
  if (filters.saved) params.set('saved', 'true');
  return params;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function ExploreClient({ initialCities }: { initialCities: ExploreCity[] }) {
  const [cities, setCities] = useState(initialCities);
  const [filters, setFilters] = useState<DestinationFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<DestinationFilters>(EMPTY_FILTERS);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');
  const [busy, setBusy] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  async function applyFilters(nextFilters: DestinationFilters) {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setMessage(null);
    try {
      const params = destinationQuery(nextFilters);
      const nextCities = await requestJson<ExploreCity[]>(`/api/cities${params.size ? `?${params}` : ''}`, { signal: controller.signal });
      setCities(nextCities);
      setAppliedFilters(nextFilters);
    } catch (error) {
      if (!isAbortError(error)) {
        setMessage(error instanceof Error ? error.message : 'Could not filter destinations.');
        setMessageTone('error');
      }
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setBusy(false);
      }
    }
  }

  async function filterCities(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await applyFilters(filters);
  }

  async function resetFilters() {
    setFilters(EMPTY_FILTERS);
    await applyFilters(EMPTY_FILTERS);
  }

  async function toggleSaved(city: ExploreCity) {
    try {
      await requestJson('/api/saved-destinations', { method: city.saved ? 'DELETE' : 'POST', body: JSON.stringify({ cityId: city.id }) });
      setCities((current) => current
        .map((item) => item.id === city.id ? { ...item, saved: !item.saved } : item)
        .filter((item) => !appliedFilters.saved || item.saved));
      setMessage(city.saved ? `${city.name} removed from saved destinations.` : `${city.name} saved for later.`);
      setMessageTone('success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update saved destinations.');
      setMessageTone('error');
    }
  }

  const activeFilterCount = [appliedFilters.q.trim(), appliedFilters.region !== 'All', appliedFilters.maxCost, appliedFilters.minPopularity, appliedFilters.saved]
    .filter(Boolean).length;

  return (
    <div>
      <form className="explore-filters" onSubmit={filterCities} aria-label="Filter destinations" aria-busy={busy}>
        <label className="search-field"><Search size={17} /><input name="q" value={filters.q} onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))} placeholder="City, country, or idea" aria-label="Search destinations" /></label>
        <select name="region" value={filters.region} onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))} aria-label="Region"><option>All</option><option>Europe</option><option>Asia</option><option>Africa</option><option>North America</option><option>South America</option><option>Oceania</option><option>Middle East</option></select>
        <select name="maxCost" value={filters.maxCost} onChange={(event) => setFilters((current) => ({ ...current, maxCost: event.target.value }))} aria-label="Maximum cost"><option value="">Any cost</option><option value="2">Budget · up to $$</option><option value="3.5">Balanced · up to $$$</option></select>
        <select name="minPopularity" value={filters.minPopularity} onChange={(event) => setFilters((current) => ({ ...current, minPopularity: event.target.value }))} aria-label="Minimum popularity"><option value="">Any rating</option><option value="4">4+ popular</option><option value="4.5">4.5+ icons</option></select>
        <label className="checkbox-field"><input name="saved" type="checkbox" checked={filters.saved} onChange={(event) => setFilters((current) => ({ ...current, saved: event.target.checked }))} /> Saved only</label>
        <button className="button button-dark" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : null} Apply filters</button>
        <button className="filter-reset" type="button" onClick={resetFilters} disabled={busy || activeFilterCount === 0}><RotateCcw size={14} /> Reset</button>
      </form>
      <div className="filter-result-bar" role="status" aria-live="polite"><strong>{cities.length}</strong> destinations on the board{activeFilterCount > 0 ? ` · ${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}` : ''}</div>
      <StatusMessage message={message} tone={messageTone} />
      <div className="destination-grid">
        {cities.map((city, index) => (
          <article className="destination-card" key={city.id}>
            <div className="destination-image"><Link href={`/explore/${city.slug}`} aria-label={`Open ${city.name} destination dossier`}><ImageWithFallback src={city.imageUrl} alt={city.name} sizes="(max-width: 760px) 100vw, 33vw" priority={index === 0} /></Link><button className={`save-button ${city.saved ? 'saved' : ''}`} type="button" onClick={() => toggleSaved(city)} aria-label={`${city.saved ? 'Remove' : 'Save'} ${city.name}`}><Bookmark size={17} fill={city.saved ? 'currentColor' : 'none'} /></button></div>
            <div className="destination-copy"><div className="destination-heading"><div><h2><Link href={`/explore/${city.slug}`}>{city.name}</Link></h2><p><MapPin size={13} /> {city.country} · {city.region}</p></div><span><Star size={14} fill="currentColor" /> {city.popularity.toFixed(1)}</span></div><p>{city.description}</p><div className="destination-meta"><span>{city.bestSeason ?? 'Year-round'}</span><span>{city.idealDays ?? 3} ideal days</span></div><div className="cost-dots" aria-label={`Cost index ${city.costIndex} out of 5`}>{[1,2,3,4,5].map((dot) => <i key={dot} className={dot <= Math.round(city.costIndex) ? 'filled' : ''} />)}<small>estimated cost</small></div><div className="activity-preview">{city.activities.slice(0, 3).map((activity) => <span key={activity.id}>{activity.name}<strong>{formatMoney(activity.cost)}</strong></span>)}</div><Link className="card-link" href={`/explore/${city.slug}`}>Open field dossier →</Link></div>
          </article>
        ))}
      </div>
      {cities.length === 0 && <div className="empty-state"><MapPin size={30} /><h2>No destinations match.</h2><p>Widen the filters to reopen the board.</p></div>}
    </div>
  );
}
