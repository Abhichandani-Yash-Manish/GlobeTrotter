'use client';

import { CheckCircle2, KeyRound, LoaderCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { StatusMessage } from '@/components/status-message';
import { requestJson } from '@/lib/client-api';

export function RecoveryForm({ mode, token }: { mode: 'forgot' | 'reset'; token?: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);
    try {
      const result = mode === 'reset'
        ? await requestJson<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: token ?? '', password: form.get('password') }) })
        : await requestJson<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: form.get('email') }) });
      setSuccess(true);
      setMessage(result.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Recovery could not be completed.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="auth-panel recovery-panel">
      <div className="eyebrow">ACCOUNT RECOVERY</div>
      <h1>{mode === 'reset' ? 'Set a new key.' : 'Find your route.'}</h1>
      <p className="auth-intro">{mode === 'reset' ? 'Choose a password with at least eight characters. The link works once and expires after 30 minutes.' : 'Enter your email. For privacy, the response is identical whether or not the account exists.'}</p>
      <form className="stack-form" onSubmit={submit}>
        {mode === 'reset' ? <label>New password<div className="input-with-icon"><KeyRound size={17} /><input name="password" type="password" minLength={8} maxLength={128} autoComplete="new-password" required /></div></label> : <label>Email<div className="input-with-icon"><Mail size={17} /><input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></div></label>}
        <StatusMessage message={message} tone={success ? 'success' : 'error'} />
        <button className="button button-primary" type="submit" disabled={busy || success}>{busy ? <LoaderCircle className="spin" size={17} /> : success ? <CheckCircle2 size={17} /> : <KeyRound size={17} />}{mode === 'reset' ? 'Update password' : 'Prepare recovery link'}</button>
      </form>
      <p className="auth-switch"><Link href="/login">← Return to sign in</Link></p>
    </div>
  );
}
