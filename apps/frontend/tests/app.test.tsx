import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app/App.js';
import type { GenerationTask } from '@web-app-x/shared-contracts';

const authApiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  signOut: vi.fn(),
}));

const generationApiMocks = vi.hoisted(() => ({
  createGeneration: vi.fn(),
}));

const historyApiMocks = vi.hoisted(() => ({
  listHistory: vi.fn(),
  deleteHistoryItem: vi.fn(),
}));

vi.mock('../src/features/auth/auth.api.js', () => ({
  getMe: authApiMocks.getMe,
  signOut: authApiMocks.signOut,
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('../src/features/generation/generation.api.js', () => ({
  createGeneration: generationApiMocks.createGeneration,
}));

vi.mock('../src/features/history/history.api.js', () => ({
  listHistory: historyApiMocks.listHistory,
  deleteHistoryItem: historyApiMocks.deleteHistoryItem,
}));

function makeGeneration(overrides: Partial<GenerationTask> = {}): GenerationTask {
  return {
    id: 'gen-1',
    user_id: 'user-1',
    original_input: 'Test prompt',
    ai_result: 'Test output',
    status: 'completed',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows auth page for guests', async () => {
    authApiMocks.getMe.mockRejectedValueOnce(new Error('unauthorized'));

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows loading and error state when history fetch fails', async () => {
    authApiMocks.getMe.mockResolvedValueOnce({
      id: 'user-1',
      email: 'member@example.com',
      created_at: new Date().toISOString(),
    });
    let rejectHistory: ((reason?: unknown) => void) | undefined;
    historyApiMocks.listHistory.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectHistory = reject;
        }),
    );

    render(<App />);

    await screen.findByText('Loading history...');
    rejectHistory?.(new Error('History failed'));
    expect(await screen.findByText('History failed')).toBeInTheDocument();
  });

  it('submits prompt and updates then deletes history item', async () => {
    const user = userEvent.setup();
    authApiMocks.getMe.mockResolvedValueOnce({
      id: 'user-1',
      email: 'member@example.com',
      created_at: new Date().toISOString(),
    });
    historyApiMocks.listHistory.mockResolvedValueOnce([]);
    generationApiMocks.createGeneration.mockResolvedValueOnce(
      makeGeneration({
        id: 'gen-new',
        original_input: 'Explain observability',
        ai_result: 'Observability is...',
      }),
    );
    historyApiMocks.deleteHistoryItem.mockResolvedValueOnce(undefined);

    render(<App />);

    await screen.findByText('Signed in as member@example.com');
    await user.type(screen.getByPlaceholderText('Enter your prompt'), 'Explain observability');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(await screen.findByText('Observability is...')).toBeInTheDocument();
    expect(generationApiMocks.createGeneration).toHaveBeenCalledWith('Explain observability');

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(historyApiMocks.deleteHistoryItem).toHaveBeenCalledWith('gen-new');
    });
    await waitFor(() => {
      expect(screen.queryByText('Observability is...')).not.toBeInTheDocument();
    });
  });
});
