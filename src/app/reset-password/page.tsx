import type { Metadata } from 'next';
import { Brand } from '@/components/brand';
import { RecoveryForm } from '@/components/recovery-form';

export const metadata: Metadata = { title: 'Reset password' };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="auth-page"><section className="auth-visual auth-visual-coral"><Brand /><div className="auth-route-art" aria-hidden="true"><span /><i>KEY</i><span /><i>READY</i></div><div><div className="eyebrow">NEW CREDENTIAL</div><h2>Close the old route.<br />Open a safer one.</h2></div><p>The old token becomes unusable as soon as the password changes.</p></section><RecoveryForm mode="reset" token={token} /></main>;
}
