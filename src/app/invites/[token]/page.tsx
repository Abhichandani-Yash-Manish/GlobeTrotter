import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Users } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AcceptInviteButton } from '@/components/accept-invite-button';
import { AppShell } from '@/components/app-shell';
import prisma from '@/lib/prisma';
import { hashToken, isOpaqueTokenActive } from '@/lib/tokens';

export const metadata: Metadata = { title: 'Trip invitation' };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await prisma.tripInvite.findUnique({ where: { tokenHash: hashToken(token) }, include: { trip: { select: { name: true, description: true } }, creator: { select: { name: true } } } });
  if (!invite) notFound();
  const active = isOpaqueTokenActive({ expiresAt: invite.expiresAt, usedAt: invite.acceptedAt, revokedAt: invite.revokedAt });
  return <AppShell><div className="standalone-state invite-page"><section className="invite-card"><div className="invite-emblem"><Users size={28} /></div><div className="eyebrow">TRIP CREW INVITATION</div><h1>{invite.trip.name}</h1><p>{invite.trip.description}</p><dl><div><dt>Invited by</dt><dd>{invite.creator.name}</dd></div><div><dt>Access</dt><dd>{invite.role}</dd></div><div><dt>Expires</dt><dd>{invite.expiresAt.toLocaleDateString()}</dd></div></dl><div className="permission-note"><ShieldCheck size={18} /><span>{invite.role === 'EDITOR' ? 'You can edit the itinerary and costs, but cannot publish, invite, or delete.' : 'You can read the complete itinerary and costs, but cannot change them.'}</span></div>{active ? <AcceptInviteButton token={token} /> : <p className="status-message status-error">This invite is no longer active.</p>}<Link className="text-button" href="/dashboard">Return to dashboard</Link></section></div></AppShell>;
}
