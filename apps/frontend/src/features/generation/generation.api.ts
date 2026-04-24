import type { GenerationTask } from '@web-app-x/shared-contracts';
import { apiFetch } from '../../lib/api-client.js';

export async function createGeneration(
  originalInput: string,
): Promise<GenerationTask> {
  const response = await apiFetch('/generations', {
    method: 'POST',
    body: JSON.stringify({ original_input: originalInput }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to create generation');
  }
  return payload.data.generation as GenerationTask;
}
