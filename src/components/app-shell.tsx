import Link from 'next/link';
import type { ReactNode } from 'react';
import { Brand } from '@/components/brand';
import { signOut } from '@/lib/auth';
import { requireUser } from '@/lib/session';

const links = [
  { href: '/dashboard', label: 'Home', code: '01' },
  { href: '/trips', label: 'Trips', code: '02' },
  { href: '/explore', label: 'Explore', code: '03' },
  { href: '/settings', label: 'Settings', code: '04' },
];

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="app-frame">
      <header className="app-header">
        <div className="page-width app-header-row">
          <Brand href="/dashboard" />
          <nav className="app-nav" aria-label="Application navigation">
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
              <button className="text-button" type="submit">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
