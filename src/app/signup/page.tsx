import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';
import { Brand } from '@/components/brand';

export const metadata: Metadata = { title: 'Create account' };

export default function SignupPage() {
  return <main className="auth-page"><section className="auth-visual auth-visual-coral"><Brand /><div className="auth-route-art" aria-hidden="true"><span /><i>START</i><span /><i>PLAN</i><span /><i>GO</i></div><div><div className="eyebrow">ONE ROUTE · ONE BUDGET</div><h2>From the first pin<br />to the final<br />boarding pass.</h2></div><Link href="/">← Back to GlobeTrotter</Link></section><AuthForm mode="signup" /></main>;
}
