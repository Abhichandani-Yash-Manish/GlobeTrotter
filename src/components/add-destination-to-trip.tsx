'use client';

import { CalendarPlus, LoaderCircle, Plus, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { StatusMessage } from '@/components/status-message';
import { requestJson } from '@/lib/client-api';
import type { ArrivalMode } from '@/types/domain';

type TripOption = { id: string; name: string; startDate: string; endDate: string; access?: string };

export function AddDestinationToTrip({ cityId, cityName }: { cityId: string; cityName: string }) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function openPanel() {
    setOpen(true);
    if (trips.length) return;
    setBusy(true);
    try {
      const items = await requestJson<TripOption[]>('/api/trips');
      setTrips(items.filter((trip) => trip.access !== 'VIEWER'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load your trips.');
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tripId = String(form.get('tripId'));
    setBusy(true);
    setMessage(null);
    try {
      await requestJson(`/api/trips/${tripId}/stops`, {
        method: 'POST',
        body: JSON.stringify({
          cityId,
          startDate: form.get('startDate'),
          endDate: form.get('endDate'),
          arrivalMode: form.get('arrivalMode') as ArrivalMode,
          notes: `Added from the ${cityName} destination dossier.`,
        }),
      });
      setMessage(`${cityName} is now on your route.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add this destination.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) return <button className="button button-primary" type="button" onClick={openPanel}><Plus size={17} /> Add to a trip</button>;

  return (
    <div className="add-destination-panel">
      <div className="panel-heading"><div><span>ROUTE INSERT</span><h3>Add {cityName}</h3></div><button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close"><X size={17} /></button></div>
      {busy && trips.length === 0 ? <p><LoaderCircle className="spin" size={16} /> Loading your trips…</p> : (
        <form className="stack-form" onSubmit={submit}>
          <label>Trip<select name="tripId" required defaultValue=""><option value="" disabled>Choose a trip</option>{trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name} · {trip.startDate} to {trip.endDate}</option>)}</select></label>
          <div className="two-columns"><label>Arrive<input name="startDate" type="date" required /></label><label>Leave<input name="endDate" type="date" required /></label></div>
          <label>Arrival mode<select name="arrivalMode" defaultValue="train"><option value="train">Train</option><option value="flight">Flight</option><option value="drive">Drive</option><option value="transit">Transit</option><option value="bike">Bike</option><option value="walk">Walk</option><option value="other">Other</option></select></label>
          <button className="button button-dark" type="submit" disabled={busy || trips.length === 0}><CalendarPlus size={17} /> Add dated stop</button>
        </form>
      )}
      {trips.length === 0 && !busy && <p className="muted-copy">Create a trip first, then return to add this stop.</p>}
      <StatusMessage message={message} tone={message?.includes('now on') ? 'success' : 'error'} />
    </div>
  );
}
