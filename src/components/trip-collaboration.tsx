'use client';

import { Copy, Link2, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { useState } from 'react';
import { StatusMessage } from '@/components/status-message';
import { requestJson } from '@/lib/client-api';
import type { TripCollaborator, TripDetail } from '@/types/domain';

type InviteResponse = { id: string; role: 'EDITOR' | 'VIEWER'; expiresAt: string; inviteUrl: string };

export function TripCollaboration({ detail, onClose }: { detail: TripDetail; onClose: () => void }) {
  const [collaborators, setCollaborators] = useState(detail.collaborators ?? []);
  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createInvite(role: 'EDITOR' | 'VIEWER') {
    setBusy(true);
    try {
      const created = await requestJson<InviteResponse>(`/api/trips/${detail.trip.id}/invites`, { method: 'POST', body: JSON.stringify({ role }) });
      setInvite(created);
      setMessage(`${role === 'EDITOR' ? 'Editor' : 'Viewer'} link created. It expires in seven days.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create an invite.');
    } finally { setBusy(false); }
  }

  async function copyInvite() {
    if (!invite) return;
    await navigator.clipboard.writeText(invite.inviteUrl);
    setMessage('Invite link copied.');
  }

  async function removeMember(member: TripCollaborator & { id?: string }) {
    if (!member.id || !window.confirm(`Remove ${member.name} from this trip?`)) return;
    setBusy(true);
    try {
      await requestJson(`/api/trips/${detail.trip.id}/members/${member.id}`, { method: 'DELETE' });
      setCollaborators((current) => current.filter((item) => item.userId !== member.userId));
      setMessage(`${member.name} removed.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not remove this collaborator.'); }
    finally { setBusy(false); }
  }

  return (
    <section className="collaboration-panel">
      <header><div><span>TRIP CREW</span><h2>Plan together, with boundaries.</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close collaboration panel"><X size={17} /></button></header>
      <p>Editors can change the plan and costs. Viewers can inspect it. Only the owner can publish, invite, or delete.</p>
      <div className="collaborator-list">
        {collaborators.map((member) => <div key={member.userId}><span className="collaborator-avatar">{member.name.slice(0, 1).toUpperCase()}</span><span><strong>{member.name}</strong><small>{member.access}</small></span>{detail.access === 'OWNER' && member.access !== 'OWNER' && <button className="icon-button danger" type="button" disabled={busy} onClick={() => removeMember(member)} aria-label={`Remove ${member.name}`}><Trash2 size={14} /></button>}</div>)}
      </div>
      {detail.access === 'OWNER' ? <div className="invite-maker"><span><ShieldCheck size={16} /> Invite with a precise role</span><div><button className="button button-dark button-small" type="button" disabled={busy} onClick={() => createInvite('EDITOR')}><Users size={15} /> Editor link</button><button className="button button-ghost button-small" type="button" disabled={busy} onClick={() => createInvite('VIEWER')}><Link2 size={15} /> Viewer link</button></div>{invite && <button className="invite-link" type="button" onClick={copyInvite}><span>{invite.inviteUrl}</span><Copy size={15} /></button>}</div> : <p className="access-note">Your access: <strong>{detail.access}</strong>. Ask the owner to change the crew.</p>}
      <StatusMessage message={message} tone={message?.includes('Could') ? 'error' : 'success'} />
    </section>
  );
}
