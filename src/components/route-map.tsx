'use client';

import { AlertTriangle, LoaderCircle, MapPin, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import type { RouteMapData } from '@/types/domain';

type RouteMapProps = {
  data: RouteMapData;
  selectedStopId?: string | null;
  onSelectStop?: (stopId: string) => void;
  compact?: boolean;
};

type MapStatus = 'loading' | 'ready' | 'failed';
type Point = [number, number];

const MAPLIBRE_WORKER_URL = '/vendor/maplibre/maplibre-gl-worker.mjs';

function routePreviewGeometry(data: RouteMapData) {
  const routeCoordinates = data.segments.flatMap((segment) => segment.coordinates);
  const stopCoordinates: Point[] = data.stops.map((stop) => [stop.longitude, stop.latitude]);
  const coordinates = routeCoordinates.length > 0 ? routeCoordinates : stopCoordinates;
  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);
  const longitudeCenter = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
  const latitudeCenter = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
  const longitudeSpan = Math.max(5, Math.max(...longitudes) - Math.min(...longitudes));
  const latitudeSpan = Math.max(5, Math.max(...latitudes) - Math.min(...latitudes));
  const project = ([longitude, latitude]: Point): Point => [
    80 + ((longitude - (longitudeCenter - longitudeSpan * 0.62)) / (longitudeSpan * 1.24)) * 840,
    60 + (((latitudeCenter + latitudeSpan * 0.62) - latitude) / (latitudeSpan * 1.24)) * 390,
  ];

  const segmentPaths = data.segments.length > 0
    ? data.segments.map((segment) => segment.coordinates.map(project))
    : [stopCoordinates.map(project)];

  return {
    segmentPaths,
    stops: data.stops.map((stop) => ({ ...stop, point: project([stop.longitude, stop.latitude]) })),
  };
}

function RoutePreview({ data, status, onRetry }: { data: RouteMapData; status: MapStatus; onRetry: () => void }) {
  const geometry = routePreviewGeometry(data);
  return (
    <div className={`atlas-map-preview atlas-map-preview-${status}`}>
      <svg viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="atlas-grid" width="100" height="90" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 90" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1000" height="540" fill="url(#atlas-grid)" />
        {geometry.segmentPaths.map((points, index) => (
          <path
            // Segment IDs are stable for real routes; the index covers a one-stop preview.
            key={data.segments[index]?.id ?? `preview-${index}`}
            d={points.map(([x, y], pointIndex) => `${pointIndex === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')}
            className="atlas-preview-route"
          />
        ))}
        {geometry.stops.map((stop) => (
          <g key={stop.id} transform={`translate(${stop.point[0]} ${stop.point[1]})`}>
            <circle r="19" className="atlas-preview-node-ring" />
            <circle r="13" className="atlas-preview-node" />
            <text y="4" textAnchor="middle">{stop.order + 1}</text>
          </g>
        ))}
      </svg>
      <div className="atlas-map-status" role="status" aria-live="polite">
        {status === 'loading' ? <><LoaderCircle className="spin" size={16} /> Loading live map…</> : (
          <><AlertTriangle size={16} /> Live tiles unavailable. Route preview shown.<button type="button" onClick={onRetry}><RotateCcw size={13} /> Retry</button></>
        )}
      </div>
    </div>
  );
}

export function RouteMap({ data, selectedStopId, onSelectStop, compact = false }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [status, setStatus] = useState<MapStatus>('loading');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current || data.stops.length === 0) return;
    let cancelled = false;
    let ready = false;
    setStatus('loading');
    const failTimer = window.setTimeout(() => {
      if (!cancelled && !ready) setStatus('failed');
    }, 10_000);

    void import('maplibre-gl').then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      maplibre.setWorkerUrl(MAPLIBRE_WORKER_URL);
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
      map.on('error', (event) => {
        const message = event.error?.message ?? '';
        if (!ready && /worker|webgl|initializ/i.test(message)) setStatus('failed');
      });
      map.once('load', () => {
        if (cancelled) return;
        ready = true;
        window.clearTimeout(failTimer);
        setStatus('ready');
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
          const marker = document.createElement(onSelectStop ? 'button' : 'div');
          if (marker instanceof HTMLButtonElement) marker.type = 'button';
          marker.className = 'atlas-map-marker';
          marker.textContent = String(stop.order + 1);
          if (onSelectStop) {
            marker.setAttribute('aria-label', `Select ${stop.name}, stop ${stop.order + 1}`);
            marker.addEventListener('click', () => onSelectStop(stop.id));
          } else {
            marker.setAttribute('aria-hidden', 'true');
          }
          markersRef.current.push(new maplibre.Marker({ element: marker }).setLngLat([stop.longitude, stop.latitude]).addTo(map));
        });
        if (data.stops.length > 1) map.fitBounds(bounds, { padding: 58, maxZoom: 7, duration: 0 });
      });
    }).catch(() => setStatus('failed'));

    return () => {
      cancelled = true;
      window.clearTimeout(failTimer);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [data, onSelectStop, retryKey]);

  useEffect(() => {
    const stop = data.stops.find((item) => item.id === selectedStopId);
    if (stop && mapRef.current) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      mapRef.current.easeTo({ center: [stop.longitude, stop.latitude], zoom: Math.max(mapRef.current.getZoom(), 7), duration: reducedMotion ? 0 : 500 });
    }
  }, [data.stops, selectedStopId]);

  if (data.stops.length === 0) {
    return <div className="map-fallback"><MapPin size={24} /><strong>Map begins with your first destination.</strong><span>The route ribbon and itinerary remain available.</span></div>;
  }

  return (
    <section className={`atlas-map-shell ${compact ? 'atlas-map-compact' : ''}`} aria-label="Trip route map">
      <div ref={containerRef} className={`atlas-map-canvas ${status !== 'ready' ? 'atlas-map-canvas-pending' : ''}`} />
      {status !== 'ready' && <RoutePreview data={data} status={status} onRetry={() => setRetryKey((value) => value + 1)} />}
      <ol className="map-text-route">
        {data.stops.map((stop, index) => (
          <li key={stop.id} className={stop.id === selectedStopId ? 'selected' : ''}>
            {onSelectStop ? (
              <button type="button" onClick={() => onSelectStop(stop.id)}><b>{index + 1}</b><span><strong>{stop.name}</strong><small>{stop.country} · arrive by {stop.arrivalMode}</small></span></button>
            ) : (
              <div className="map-route-label"><b>{index + 1}</b><span><strong>{stop.name}</strong><small>{stop.country} · arrive by {stop.arrivalMode}</small></span></div>
            )}
            {index > 0 && data.segments[index - 1] && <em>{data.segments[index - 1].distanceKm.toLocaleString()} km {data.segments[index - 1].estimated ? 'estimate' : 'route'}</em>}
          </li>
        ))}
      </ol>
    </section>
  );
}
