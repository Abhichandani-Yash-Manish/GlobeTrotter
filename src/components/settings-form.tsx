'use client';

import { signOut } from 'next-auth/react';
import { useState, type FormEvent } from 'react';
import { Bookmark, ImagePlus, LoaderCircle, MapPin, Save, Trash2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatusMessage } from '@/components/status-message';
import { ImageWithFallback } from '@/components/image-with-fallback';
import { requestJson } from '@/lib/client-api';

type Profile = {
  name: string;
  email: string;
  avatar: string | null;
  language: string;
  defaultPrivacy: string;
  createdAt: string;
  _count: { trips: number; savedDestinations: number };
};

type SavedCity = { id: string; city: { id: string; slug: string; name: string; country: string; imageUrl: string | null } };

export function SettingsForm({ profile, initialSaved }: { profile: Profile; initialSaved: SavedCity[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'success' | 'error'>('success');
  const [avatar, setAvatar] = useState(profile.avatar ?? '');
  const [saved, setSaved] = useState(initialSaved);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      await requestJson('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          avatar: avatar || null,
          language: form.get('language'),
          defaultPrivacy: form.get('defaultPrivacy'),
          currentPassword: form.get('currentPassword') || undefined,
          newPassword: form.get('newPassword') || undefined,
        }),
      });
      setTone('success');
      setMessage('Profile and travel defaults saved.');
      router.refresh();
    } catch (error) {
      setTone('error');
      setMessage(error instanceof Error ? error.message : 'Could not update your profile.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set('altText', `${profile.name} profile portrait`);
    setBusy(true);
    try {
      const asset = await requestJson<{ url: string }>('/api/media', { method: 'POST', body: form });
      setAvatar(asset.url);
      setTone('success');
      setMessage('Avatar processed. Save settings to apply it.');
    } catch (error) { setTone('error'); setMessage(error instanceof Error ? error.message : 'Could not upload avatar.'); }
    finally { setBusy(false); }
  }

  async function removeSaved(item: SavedCity) {
    setBusy(true);
    try {
      await requestJson('/api/saved-destinations', { method: 'DELETE', body: JSON.stringify({ cityId: item.city.id }) });
      setSaved((current) => current.filter((savedItem) => savedItem.id !== item.id));
      setTone('success');
      setMessage(`${item.city.name} removed from saved destinations.`);
    } catch (error) { setTone('error'); setMessage(error instanceof Error ? error.message : 'Could not update saved destinations.'); }
    finally { setBusy(false); }
  }

  async function deleteAccount() {
    const confirmation = window.prompt('This permanently deletes your account and every trip. Type DELETE to continue.');
    if (confirmation !== 'DELETE') return;
    setBusy(true);
    try {
      await requestJson('/api/users/profile', { method: 'DELETE', body: JSON.stringify({ confirmation }) });
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      setTone('error');
      setMessage(error instanceof Error ? error.message : 'Could not delete the account.');
      setBusy(false);
    }
  }

  return (
    <div className="settings-grid">
      <form className="settings-card" onSubmit={saveProfile}>
        <div className="panel-heading"><span>TRAVELER PROFILE</span><strong>01</strong></div>
        <div className="form-grid two-columns">
          <label>Name<input name="name" defaultValue={profile.name} required minLength={2} /></label>
          <label>Email<input name="email" type="email" defaultValue={profile.email} required /></label>
        </div>
        <label>Avatar URL<input name="avatar" type="url" value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://…" /></label>
        <div className="form-grid two-columns">
          <label>Language<select name="language" defaultValue={profile.language}><option value="en">English</option><option value="hi">Hindi</option><option value="gu">Gujarati</option></select></label>
          <label>Default trip visibility<select name="defaultPrivacy" defaultValue={profile.defaultPrivacy}><option value="private">Private</option><option value="public">Public</option></select></label>
        </div>
        <div className="settings-divider"><span>CHANGE PASSWORD · OPTIONAL</span></div>
        <div className="form-grid two-columns">
          <label>Current password<input name="currentPassword" type="password" autoComplete="current-password" /></label>
          <label>New password<input name="newPassword" type="password" minLength={8} autoComplete="new-password" /></label>
        </div>
        <StatusMessage message={message} tone={tone} />
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />} Save settings</button>
      </form>
      <aside className="settings-side">
        <section className="settings-card passport-card"><div className="panel-heading"><span>PASSPORT STATS</span><strong>GT</strong></div><div className="passport-avatar">{avatar ? <ImageWithFallback src={avatar} alt={profile.name} sizes="78px" /> : profile.name.slice(0, 1).toUpperCase()}</div><h2>{profile.name}</h2><p>Member since {new Date(profile.createdAt).getUTCFullYear()}</p><form className="avatar-upload" onSubmit={uploadAvatar}><label><ImagePlus size={14} /> Choose avatar<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><button className="button button-ghost button-small" type="submit" disabled={busy}><Upload size={14} /> Process</button></form><dl><div><dt>Trips</dt><dd>{profile._count.trips}</dd></div><div><dt>Saved</dt><dd>{saved.length}</dd></div></dl></section>
        <section className="settings-card saved-settings"><div className="panel-heading"><span>SAVED DESTINATIONS</span><Bookmark size={16} /></div>{saved.length ? <div className="saved-settings-list">{saved.map((item) => <article key={item.id}><div className="saved-thumb"><ImageWithFallback src={item.city.imageUrl} alt={item.city.name} sizes="64px" /></div><span><strong>{item.city.name}</strong><small><MapPin size={11} /> {item.city.country}</small></span><button className="icon-button danger" type="button" disabled={busy} onClick={() => removeSaved(item)} aria-label={`Remove ${item.city.name}`}><Trash2 size={13} /></button></article>)}</div> : <p className="muted-copy">No saved destinations yet. Use the bookmark on Explore.</p>}</section>
        <section className="settings-card danger-zone"><div className="panel-heading"><span>DANGER ZONE</span><Trash2 size={16} /></div><h3>Delete account</h3><p>Removes your profile, trips, schedules, and saved destinations. There is no undo.</p><button className="button button-danger" type="button" onClick={deleteAccount} disabled={busy}>Delete permanently</button></section>
      </aside>
    </div>
  );
}
