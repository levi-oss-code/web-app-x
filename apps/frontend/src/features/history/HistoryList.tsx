import type { GenerationTask } from '@web-app-x/shared-contracts';

interface HistoryListProps {
  history: GenerationTask[];
  deletingId: string | null;
  onDelete: (id: string) => Promise<void>;
}

export function HistoryList({ history, deletingId, onDelete }: HistoryListProps) {
  return (
    <section className="mt-6 rounded-lg border border-slate-800 p-4">
      <h2 className="text-lg font-medium">Your history</h2>
      {history.length === 0 ? <p className="mt-3 text-slate-400">No generations yet.</p> : null}
      <div className="mt-3 space-y-3">
        {history.map((item) => (
          <article key={item.id} className="rounded border border-slate-800 bg-slate-900 p-3">
            <p className="text-xs uppercase text-slate-400">{item.status}</p>
            <p className="mt-2 text-sm text-slate-300">{item.original_input}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm">{item.ai_result ?? 'No AI output available.'}</p>
            <button
              className="mt-3 rounded bg-rose-700 px-3 py-1 text-xs disabled:opacity-60"
              type="button"
              disabled={deletingId === item.id}
              onClick={() => onDelete(item.id)}
            >
              {deletingId === item.id ? 'Deleting...' : 'Delete'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
