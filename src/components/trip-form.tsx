'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { requestJson } from '@/lib/client-api';
import { displayToBaseAmount } from '@/lib/format';
import { StatusMessage } from '@/components/status-message';

export function TripForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const budgetValue = String(form.get('budget') ?? '').trim();

    try {
      const trip = await requestJson<{ id: string }>('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          description: form.get('description'),
          startDate: form.get('startDate'),
          endDate: form.get('endDate'),
          budget: budgetValue ? displayToBaseAmount(Number(budgetValue)) : null,
          isPublic: form.get('privacy') === 'public',
        }),
      });
      router.push(`/trips/${trip.id}/edit`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the trip.');
      setBusy(false);
    }
  }

  return (
    <form className="trip-form ticket-panel" onSubmit={handleSubmit}>
      <div className="ticket-code">GT / NEW ROUTE</div>
      <label className="field-wide">
        Trip name
        <input name="name" required maxLength={80} placeholder="Monsoon Coast Run" />
      </label>
      <div className="form-grid two-columns">
        <label>
          Depart
          <input name="startDate" type="date" required />
        </label>
        <label>
          Return
          <input name="endDate" type="date" required />
        </label>
      </div>
      <label>
        Field notes
        <textarea name="description" rows={4} maxLength={600} placeholder="What makes this trip worth taking?" />
      </label>
      <div className="form-grid two-columns">
        <label>
          Budget estimate (₹)
          <input name="budget" type="number" min="100" step="100" placeholder="150000" />
        </label>
        <label>
          Visibility
          <select name="privacy" defaultValue="private">
            <option value="private">Private while planning</option>
            <option value="public">Public when ready</option>
          </select>
        </label>
      </div>
      <StatusMessage message={message} tone="error" />
      <div className="form-actions">
        <button className="button button-primary" type="submit" disabled={busy}>
          {busy ? <LoaderCircle className="spin" size={18} /> : <ArrowRight size={18} />}
          Build itinerary
        </button>
      </div>
    </form>
  );
}
