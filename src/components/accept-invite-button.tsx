'use client';

import { LoaderCircle, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { StatusMessage } from '@/components/status-message';
import { requestJson } from '@/lib/client-api';

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function accept() {
    setBusy(true);
    try {
      const result = await requestJson<{ tripId: string; tripName: string; access: string }>(`/api/invites/${token}/accept`, { method: 'POST' });
      setMessage(`Joined ${result.tripName} as ${result.access.toLowerCase()}.`);
      router.push(`/trips/${result.tripId}`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not accept this invite.'); setBusy(false); }
  }
  return <div><button className="button button-primary button-wide" type="button" onClick={accept} disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Users size={17} />} Accept invitation</button><StatusMessage message={message} tone={message?.startsWith('Joined') ? 'success' : 'error'} /></div>;
}
