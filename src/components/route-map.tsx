'use client';

import { AlertTriangle, MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { RouteMapData } from '@/types/domain';

type RouteMapProps = {
  data: RouteMapData;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
  compact?: boolean;
};

export function RouteMap({ data, selectedStopId, onSelectStop, compact = false }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || data.stops.length === 0) return;
    let cancelled = false;

    void import('maplibre-gl').then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      const first = data.stops[0];
      const map = new maplibre.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [first.longitude, first.latitude],
        zoom: data.stops.length === 1 ? 10 : 3,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibre.AttributionControl({ compact: true }), 'bottom-right');
      map.on('error', () => setFailed(true));
      map.on('load', () => {
        if (data.segments.length > 0) {
          map.addSource('globetrotter-route', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: data.segments.map((segment) => ({
                type: 'Feature',
                properties: { estimated: segment.estimated },
                geometry: { type: 'LineString', coordinates: segment.coordinates },
              })),
            },
          });
          map.addLayer({
            id: 'globetrotter-route-shadow', type: 'line', source: 'globetrotter-route',
            paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.8 },
          });
          map.addLayer({
            id: 'globetrotter-route', type: 'line', source: 'globetrotter-route',
            paint: { 'line-color': '#0E7C7B', 'line-width': 4, 'line-dasharray': [1.5, 1] },
          });
        }

        const bounds = new maplibre.LngLatBounds();
        data.stops.forEach((stop) => {
          bounds.extend([stop.longitude, stop.latitude]);
          const marker = document.createElement('button');
          marker.type = 'button';
          marker.className = 'atlas-map-marker';
          marker.textContent = String(stop.order + 1);
          marker.setAttribute('aria-label', `Select ${stop.name}, stop ${stop.order + 1}`);
          marker.addEventListener('click', () => onSelectStop?.(stop.id));
          markersRef.current.push(new maplibre.Marker({ element: marker }).setLngLat([stop.longitude, stop.latitude]).addTo(map));
        });
        if (data.stops.length > 1) map.fitBounds(bounds, { padding: 58, maxZoom: 7, duration: 0 });
      });
    }).catch(() => setFailed(true));

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [data, onSelectStop]);

  useEffect(() => {
    const stop = data.stops.find((item) => item.id === selectedStopId);
    if (stop && mapRef.current) mapRef.current.easeTo({ center: [stop.longitude, stop.latitude], zoom: Math.max(mapRef.current.getZoom(), 7), duration: 500 });
  }, [data.stops, selectedStopId]);

  if (data.stops.length === 0) {
    return <div className="map-fallback"><MapPin size={24} /><strong>Map begins with your first destination.</strong><span>The route ribbon and itinerary remain available.</span></div>;
  }

  return (
    <section className={`atlas-map-shell ${compact ? 'atlas-map-compact' : ''}`} aria-label="Trip route map">
      {failed ? (
        <div className="map-fallback"><AlertTriangle size={24} /><strong>Live map unavailable.</strong><span>Your route is still readable below.</span></div>
      ) : <div ref={containerRef} className="atlas-map-canvas" aria-hidden="true" />}
      <ol className="map-text-route">
        {data.stops.map((stop, index) => (
          <li key={stop.id} className={stop.id === selectedStopId ? 'selected' : ''}>
            <button type="button" onClick={() => onSelectStop?.(stop.id)}><b>{index + 1}</b><span><strong>{stop.name}</strong><small>{stop.country} · arrive by {stop.arrivalMode}</small></span></button>
            {index > 0 && data.segments[index - 1] && <em>{data.segments[index - 1].distanceKm.toLocaleString()} km {data.segments[index - 1].estimated ? 'estimate' : 'route'}</em>}
          </li>
        ))}
      </ol>
    </section>
  );
}

