import { useState } from 'react';
import type { FormEvent } from 'react';

interface GenerationFormProps {
  onSubmit: (input: string) => Promise<void>;
}

export function GenerationForm({ onSubmit }: GenerationFormProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) {
      setError('Prompt is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(input);
      setInput('');
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to generate result';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 rounded-lg border border-slate-800 p-4" onSubmit={handleSubmit}>
      <h2 className="text-lg font-medium">New generation</h2>
      <textarea
        className="mt-3 min-h-28 w-full rounded bg-slate-900 p-2"
        placeholder="Enter your prompt"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      {error ? <p className="mt-2 text-sm text-rose-400">{error}</p> : null}
      <button
        className="mt-3 rounded bg-emerald-600 px-3 py-2 text-sm disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? 'Processing with AI...' : 'Generate'}
      </button>
    </form>
  );
}
