import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { SettingsForm } from '@/components/settings-form';
import prisma from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const sessionUser = await requireUser();
  const profile = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, email: true, avatar: true, language: true, defaultPrivacy: true, createdAt: true, _count: { select: { trips: true, savedDestinations: true } } } });
  if (!profile) notFound();
  return <AppShell><div className="page-width content-page"><header className="page-heading"><div className="eyebrow">TRAVELER SETTINGS</div><h1>Your passport.</h1><p>Profile details, default privacy, password changes, and account controls.</p></header><SettingsForm profile={{ ...profile, createdAt: profile.createdAt.toISOString() }} /></div></AppShell>;
}
