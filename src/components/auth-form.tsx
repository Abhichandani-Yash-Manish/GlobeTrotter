'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { requestJson } from '@/lib/client-api';
import { StatusMessage } from '@/components/status-message';

export function AuthForm({
  mode,
  nextPath = '/dashboard',
}: {
  mode: 'login' | 'signup';
  nextPath?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function authenticate(email: string, password: string) {
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) throw new Error('Email or password is incorrect.');
    router.push(nextPath.startsWith('/') ? nextPath : '/dashboard');
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const rawEmail = String(form.get('email') ?? '');
    const email = rawEmail.trim().toLowerCase();
    const password = String(form.get('password') ?? '');

    const emailRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
      setMessage('Enter a valid email address.');
      setBusy(false);
      return;
    }

    try {
      if (mode === 'signup') {
        await requestJson('/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ name: form.get('name'), email, password }),
        });
      }
      await authenticate(email, password);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function useDemo() {
    setBusy(true);
    setMessage(null);
    try {
      await authenticate('demo@globetrotter.com', 'password123');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Demo login failed.');
      setBusy(false);
    }
  }

  return (
    <div className="auth-panel">
      <div className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Issue your passport'}</div>
      <h1>{mode === 'login' ? 'Continue your route.' : 'Plan the trip, not the chaos.'}</h1>
      <p className="auth-intro">
        {mode === 'login'
          ? 'Your saved routes, costs, and shared itineraries are waiting.'
          : 'One account keeps every stop, activity, and dollar in the same itinerary.'}
      </p>

      <button className="demo-ticket" type="button" onClick={useDemo} disabled={busy}>
        <span>
          <small>DEMO BOARDING PASS</small>
          <strong>Alex Traveler</strong>
          <em>demo@globetrotter.com · password123</em>
        </span>
        <ArrowRight size={20} />
      </button>

      <div className="or-divider"><span>or use your account</span></div>
      <form className="stack-form" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <label>
            Full name
            <input name="name" required minLength={2} maxLength={60} autoComplete="name" placeholder="Aarav Patel" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="••••••••" />
        </label>
        <StatusMessage message={message} tone="error" />
        <button className="button button-primary button-wide" type="submit" disabled={busy}>
          {busy && <LoaderCircle className="spin" size={18} />}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
        {mode === 'login' && <Link className="forgot-link" href="/forgot-password">Forgot password?</Link>}
      </form>
      <p className="auth-switch">
        {mode === 'login' ? 'New to GlobeTrotter?' : 'Already have an account?'}{' '}
        <Link href={mode === 'login' ? '/signup' : '/login'}>
          {mode === 'login' ? 'Create an account' : 'Sign in'}
        </Link>
      </p>
    </div>
  );
}
