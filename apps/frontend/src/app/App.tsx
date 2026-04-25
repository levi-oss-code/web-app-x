import { useEffect, useState } from 'react';
import { AuthPage } from '../features/auth/AuthPage.js';
import { getMe, signOut as signOutApi, type AuthResponse, type AuthUser } from '../features/auth/auth.api.js';
import { createCheckoutSession, getBillingUsage, type BillingUsage } from '../features/billing/billing.api.js';
import { GenerationForm } from '../features/generation/GenerationForm.js';
import { createGeneration } from '../features/generation/generation.api.js';
import { HistoryList } from '../features/history/HistoryList.js';
import { deleteHistoryItem, listHistory } from '../features/history/history.api.js';
import type { GenerationTask } from '@web-app-x/shared-contracts';

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [history, setHistory] = useState<GenerationTask[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingUsage | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  useEffect(() => {
    getMe()
      .then((profile) => {
        setUser(profile);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      setBilling(null);
      return;
    }
    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError(null);
      try {
        const rows = await listHistory();
        setHistory(rows);
      } catch (error) {
        setHistoryError(error instanceof Error ? error.message : 'Failed to load history');
      }
      finally {
        setHistoryLoading(false);
      }
    }
    void loadHistory();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    getBillingUsage()
      .then((usage) => {
        setBilling(usage);
      })
      .catch(() => {
        setBilling(null);
      });
  }, [user]);

  function onAuthenticated(auth: AuthResponse) {
    setUser(auth.user);
  }

  function signOut() {
    signOutApi()
      .catch(() => undefined)
      .finally(() => {
        setUser(null);
        setHistory([]);
      });
  }

  async function handleCreateGeneration(input: string) {
    if (!user) {
      throw new Error('You must be signed in');
    }
    const created = await createGeneration(input);
    setHistory((current) => [created, ...current]);
    setBilling((current) =>
      current
        ? { ...current, used_this_month: Math.min(current.used_this_month + 1, current.monthly_generation_limit) }
        : current,
    );
  }

  async function handleDelete(id: string) {
    if (!user) {
      throw new Error('You must be signed in');
    }
    setDeletingId(id);
    try {
      await deleteHistoryItem(id);
      setHistory((current) => current.filter((row) => row.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function startUpgrade() {
    setUpgradeLoading(true);
    try {
      const session = await createCheckoutSession();
      window.location.href = session.checkout_url;
    } finally {
      setUpgradeLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Web App X</h1>
      {!user ? (
        <AuthPage onAuthenticated={onAuthenticated} />
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800 p-3">
            <div>
              <p className="text-sm text-slate-300">Signed in as {user.email}</p>
              <p className="text-xs text-slate-400">
                Plan: {billing?.plan ?? user.plan} {billing ? `| ${billing.used_this_month}/${billing.monthly_generation_limit} this month` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {(billing?.plan ?? user.plan) === 'free' && (billing?.can_upgrade ?? false) ? (
                <button
                  className="rounded bg-emerald-700 px-3 py-2 text-sm disabled:opacity-60"
                  type="button"
                  disabled={upgradeLoading}
                  onClick={startUpgrade}
                >
                  {upgradeLoading ? 'Opening checkout...' : 'Upgrade'}
                </button>
              ) : null}
              <button className="rounded bg-slate-700 px-3 py-2 text-sm" type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          </div>
          <GenerationForm onSubmit={handleCreateGeneration} />
          {historyLoading ? <p className="mt-4 text-slate-400">Loading history...</p> : null}
          {historyError ? <p className="mt-4 text-rose-400">{historyError}</p> : null}
          <HistoryList history={history} deletingId={deletingId} onDelete={handleDelete} />
        </>
      )}
    </main>
  );
}
