'use client';

import { Check, Copy, LoaderCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { requestJson } from '@/lib/client-api';
import { StatusMessage } from '@/components/status-message';

export function PublishControls({ tripId, initialPublic, publicId }: { tripId: string; initialPublic: boolean; publicId: string | null }) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [shareId, setShareId] = useState(publicId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success');

  async function togglePublish() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await requestJson<{ isPublic: boolean; publicId: string }>(`/api/trips/${tripId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ published: !isPublic }),
      });
      setIsPublic(result.isPublic);
      setShareId(result.publicId);
      setMessageTone('success');
      setMessage(result.isPublic ? 'Published—your share page is live.' : 'Trip is private again.');
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'Publishing failed.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!shareId) return;
    await navigator.clipboard.writeText(`${window.location.origin}/share/${shareId}`);
    setMessageTone('success');
    setMessage('Share link copied.');
  }

  return (
    <div className="publish-controls">
      <button className="button button-dark" type="button" onClick={togglePublish} disabled={busy}>
        {busy ? <LoaderCircle className="spin" size={17} /> : isPublic ? <Check size={17} /> : <Send size={17} />}
        {isPublic ? 'Published' : 'Publish trip'}
      </button>
      {isPublic && <button className="button button-ghost" type="button" onClick={copyLink}><Copy size={16} /> Copy link</button>}
      <StatusMessage message={message} tone={messageTone} stamp={message === 'Published—your share page is live.'} />
    </div>
  );
}
