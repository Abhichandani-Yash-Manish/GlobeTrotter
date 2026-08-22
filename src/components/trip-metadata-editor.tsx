'use client';

import { ImagePlus, LoaderCircle, Save, Upload, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { StatusMessage } from '@/components/status-message';
import { requestJson } from '@/lib/client-api';
import type { CityDto, TripDetail } from '@/types/domain';

export function TripMetadataEditor({ detail, covers, onUpdated, onClose }: { detail: TripDetail; covers: CityDto[]; onUpdated: (detail: TripDetail) => void; onClose: () => void }) {
  const [coverImage, setCoverImage] = useState(detail.trip.coverImage ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) return;
    form.set('altText', `${detail.trip.name} cover`);
    setBusy(true);
    try {
      const asset = await requestJson<{ url: string }>('/api/media', { method: 'POST', body: form });
      setCoverImage(asset.url);
      setMessage('Upload processed and selected. Save the trip to apply it.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not upload this image.'); }
    finally { setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const updated = await requestJson<TripDetail>(`/api/trips/${detail.trip.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: form.get('name'), description: form.get('description'), startDate: form.get('startDate'), endDate: form.get('endDate'),
          budget: form.get('budget') ? Number(form.get('budget')) : null, coverImage: coverImage || null,
        }),
      });
      onUpdated(updated);
      setMessage('Trip details saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save trip details.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="metadata-editor">
      <header><div><span>TRIP PROFILE</span><h2>Shape the journey.</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close trip editor"><X size={17} /></button></header>
      <div className="metadata-form">
        <form className="metadata-fields" onSubmit={save}><label>Trip name<input name="name" defaultValue={detail.trip.name} maxLength={80} required /></label><div className="two-columns"><label>Start<input name="startDate" type="date" defaultValue={detail.trip.startDate} required /></label><label>End<input name="endDate" type="date" defaultValue={detail.trip.endDate} required /></label></div><label>Budget in USD<input name="budget" type="number" min="1" step="0.01" defaultValue={detail.trip.budget ?? ''} /></label><label>Field note<textarea name="description" maxLength={600} defaultValue={detail.trip.description ?? ''} /></label><button className="button button-dark" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} Save details</button></form>
        <div className="cover-editor"><div className="cover-preview"><ImageWithFallback src={coverImage} alt={`${detail.trip.name} cover`} sizes="400px" /></div><div><span className="section-kicker">SEEDED COVER GALLERY</span><div className="cover-gallery">{covers.slice(0, 8).map((city) => <button type="button" className={coverImage === city.imageUrl ? 'selected' : ''} key={city.id} onClick={() => setCoverImage(city.imageUrl ?? '')} aria-label={`Use ${city.name} cover`}><ImageWithFallback src={city.imageUrl} alt={city.name} sizes="90px" /></button>)}</div></div><form className="upload-row" onSubmit={upload}><label><ImagePlus size={16} /> Upload JPEG, PNG, or WebP<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><button className="button button-ghost button-small" type="submit" disabled={busy}><Upload size={15} /> Process</button></form><small>Uploads are decoded, resized, stripped of metadata, and stored as WebP up to 2 MB.</small></div>
      </div>
      <StatusMessage message={message} tone={message?.startsWith('Could') ? 'error' : 'success'} />
    </section>
  );
}
