import type { GenerationTask } from '@web-app-x/shared-contracts';
import { apiFetch } from '../../lib/api-client.js';

export async function listHistory(): Promise<GenerationTask[]> {
  const response = await apiFetch('/generations?page=1&limit=20', {
    method: 'GET',
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to load history');
  }
  return payload.data.generations as GenerationTask[];
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const response = await apiFetch(`/generations/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload?.error?.message ?? 'Failed to delete item');
  }
}
