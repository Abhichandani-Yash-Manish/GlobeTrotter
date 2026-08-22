import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
import { Brand } from '@/components/brand';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <main className="auth-page"><section className="auth-visual"><Brand /><div className="auth-route-art" aria-hidden="true"><span /><i>DEL</i><span /><i>BCN</i><span /><i>ROM</i></div><div><div className="eyebrow">YOUR FIELD NOTEBOOK</div><h2>The dates line up.<br />The budget still breathes.<br />The link is ready.</h2></div><Link href="/">← Back to GlobeTrotter</Link></section><AuthForm mode="login" nextPath={next} /></main>;
}
