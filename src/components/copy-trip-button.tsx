'use client';

import { Copy, Link2, LoaderCircle, Mail, MessageCircle, Printer, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { requestJson } from '@/lib/client-api';
import { StatusMessage } from '@/components/status-message';

export function CopyTripButton({ publicId, signedIn }: { publicId: string; signedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function copyTrip() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/share/${publicId}`)}`);
      return;
    }
    setBusy(true);
    try {
      const trip = await requestJson<{ id: string }>(`/api/public/trips/${publicId}/copy`, { method: 'POST' });
      router.push(`/trips/${trip.id}/edit`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not copy this trip.');
      setBusy(false);
    }
  }

  function shareUrl() {
    return `${window.location.origin}/share/${publicId}`;
  }

  async function shareNative() {
    const url = shareUrl();
    if (navigator.share) await navigator.share({ title: 'GlobeTrotter itinerary', text: 'Explore this day-by-day trip plan.', url });
    else { await navigator.clipboard.writeText(url); setMessage('Link copied for sharing.'); }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl());
    setMessage('Share link copied.');
  }

  return <div className="shared-actions"><button className="button button-primary" type="button" onClick={copyTrip} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Copy size={17} />} Copy this trip</button><div className="social-share-row"><button className="icon-button" type="button" onClick={shareNative} aria-label="Share using device"><Share2 size={16} /></button><button className="icon-button" type="button" onClick={copyLink} aria-label="Copy share link"><Link2 size={16} /></button><button className="icon-button" type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Explore this GlobeTrotter itinerary: ${shareUrl()}`)}`, '_blank', 'noopener,noreferrer')} aria-label="Share on WhatsApp"><MessageCircle size={16} /></button><button className="icon-button" type="button" onClick={() => { window.location.href = `mailto:?subject=${encodeURIComponent('GlobeTrotter itinerary')}&body=${encodeURIComponent(`Open this itinerary: ${shareUrl()}`)}`; }} aria-label="Share by email"><Mail size={16} /></button><button className="icon-button" type="button" onClick={() => window.print()} aria-label="Print itinerary"><Printer size={16} /></button></div><StatusMessage message={message} tone={message?.includes('copied') ? 'success' : 'error'} /></div>;
}
