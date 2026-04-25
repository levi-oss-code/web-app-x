import { useState } from 'react';
import { signIn as signInApi, signUp as signUpApi, type AuthResponse } from './auth.api.js';
import { submitLead } from '../leads/leads.api.js';

interface AuthPageProps {
  onAuthenticated: (auth: AuthResponse) => void;
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadNote, setLeadNote] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadMessage, setLeadMessage] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    try {
      const auth = await signInApi(email, password);
      onAuthenticated(auth);
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    setLoading(true);
    setError(null);
    try {
      const auth = await signUpApi(email, password);
      onAuthenticated(auth);
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  async function joinWaitlist() {
    setLeadLoading(true);
    setLeadMessage(null);
    try {
      const result = await submitLead({
        email: leadEmail,
        note: leadNote.trim() || undefined,
        source: 'auth-page',
      });
      setLeadMessage(result.already_exists ? 'You are already on the waitlist.' : 'Joined. We will update you soon.');
      if (!result.already_exists) {
        setLeadNote('');
      }
    } catch (leadError) {
      setLeadMessage(leadError instanceof Error ? leadError.message : 'Failed to submit waitlist request');
    } finally {
      setLeadLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-800 p-4">
      <h2 className="text-lg font-medium">Sign in</h2>
      <div className="mt-3 space-y-2">
        <input
          className="w-full rounded bg-slate-900 p-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="w-full rounded bg-slate-900 p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
      <div className="mt-4 flex gap-2">
        <button
          className="rounded bg-blue-600 px-3 py-2 text-sm disabled:opacity-60"
          type="button"
          disabled={loading}
          onClick={signIn}
        >
          {loading ? 'Working...' : 'Sign in'}
        </button>
        <button
          className="rounded bg-slate-700 px-3 py-2 text-sm disabled:opacity-60"
          type="button"
          disabled={loading}
          onClick={signUp}
        >
          {loading ? 'Working...' : 'Sign up'}
        </button>
      </div>

      <div className="mt-8 border-t border-slate-800 pt-4">
        <h3 className="text-base font-medium">Want updates as this grows?</h3>
        <p className="mt-1 text-xs text-slate-400">Join waitlist and leave feedback for upcoming features.</p>
        <div className="mt-3 space-y-2">
          <input
            className="w-full rounded bg-slate-900 p-2"
            placeholder="Email for updates"
            type="email"
            value={leadEmail}
            onChange={(event) => setLeadEmail(event.target.value)}
          />
          <textarea
            className="w-full rounded bg-slate-900 p-2"
            placeholder="What would make this useful to you?"
            value={leadNote}
            onChange={(event) => setLeadNote(event.target.value)}
          />
          <button
            className="rounded bg-emerald-700 px-3 py-2 text-sm disabled:opacity-60"
            type="button"
            disabled={leadLoading}
            onClick={joinWaitlist}
          >
            {leadLoading ? 'Submitting...' : 'Join waitlist'}
          </button>
          {leadMessage ? <p className="text-xs text-slate-300">{leadMessage}</p> : null}
        </div>
      </div>
    </section>
  );
}
