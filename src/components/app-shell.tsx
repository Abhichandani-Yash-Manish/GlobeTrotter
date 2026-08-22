import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brand } from '@/components/brand';
import { signOut } from '@/lib/auth';
import { requireUser } from '@/lib/session';
import prisma from '@/lib/prisma';
import { normalizeLanguage, primaryCopy } from '@/lib/i18n';

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const preference = await prisma.user.findUnique({ where: { id: user.id }, select: { language: true } });
  const language = normalizeLanguage(preference?.language ?? 'en');
  const copy = primaryCopy[language];
  const links = [
    { href: '/dashboard', label: copy.home, code: '01' },
    { href: '/trips', label: copy.trips, code: '02' },
    { href: '/explore', label: copy.explore, code: '03' },
    { href: '/settings', label: copy.settings, code: '04' },
  ];

  return (
    <div className="app-frame">
      <header className="app-header">
        <div className="page-width app-header-row">
          <Brand href="/dashboard" />
          <nav className="app-nav" aria-label={copy.nav}>
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                <span>{link.code}</span>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="account-block">
            <span className="account-avatar" aria-hidden="true">
              {user.name?.slice(0, 1).toUpperCase() ?? 'T'}
            </span>
            <span className="account-name">{user.name}</span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button className="text-button" type="submit">{copy.signOut}</button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
