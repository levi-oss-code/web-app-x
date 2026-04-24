import { useEffect, useState } from 'react';
import { AuthPage } from '../features/auth/AuthPage.js';
import { getMe, signOut as signOutApi, type AuthResponse, type AuthUser } from '../features/auth/auth.api.js';
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

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Web App X</h1>
      {!user ? (
        <AuthPage onAuthenticated={onAuthenticated} />
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-800 p-3">
            <p className="text-sm text-slate-300">Signed in as {user.email}</p>
            <button className="rounded bg-slate-700 px-3 py-2 text-sm" type="button" onClick={signOut}>
              Sign out
            </button>
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
