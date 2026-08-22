import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { SettingsForm } from '@/components/settings-form';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const profile = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, email: true, avatar: true, language: true, defaultPrivacy: true, createdAt: true, savedDestinations: { include: { city: { select: { id: true, slug: true, name: true, country: true, imageUrl: true } } }, orderBy: { createdAt: 'desc' } }, _count: { select: { trips: true, savedDestinations: true } } } });
  if (!profile) notFound();
  const { savedDestinations, ...profileData } = profile;
  return <AppShell><div className="page-width content-page"><header className="page-heading"><div className="eyebrow">TRAVELER SETTINGS</div><h1>Your passport.</h1><p>Profile details, default privacy, password changes, saved places, and account controls.</p></header><SettingsForm profile={{ ...profileData, createdAt: profile.createdAt.toISOString() }} initialSaved={savedDestinations} /></div></AppShell>;
}
