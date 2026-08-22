import type { Metadata } from 'next';
import { Brand } from '@/components/brand';
import { RecoveryForm } from '@/components/recovery-form';

export const metadata: Metadata = { title: 'Recover account' };

export default function ForgotPasswordPage() {
  return <main className="auth-page"><section className="auth-visual"><Brand /><div className="auth-route-art" aria-hidden="true"><span /><i>LOST</i><span /><i>FOUND</i></div><div><div className="eyebrow">SECURE RECOVERY</div><h2>One link.<br />Thirty minutes.<br />No account clues.</h2></div><p>Recovery links print to the local terminal in demo mode.</p></section><RecoveryForm mode="forgot" /></main>;
}
