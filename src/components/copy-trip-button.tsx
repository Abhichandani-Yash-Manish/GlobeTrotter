'use client';

import { Copy, LoaderCircle } from 'lucide-react';
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

  return <div><button className="button button-primary" type="button" onClick={copyTrip} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Copy size={17} />} Copy this trip</button><StatusMessage message={message} tone="error" /></div>;
}
