import { HttpError } from '../../lib/http-error.js';
import { logger } from '../../lib/logger.js';
import { createGenerationRequestSchema, listGenerationsQuerySchema } from '@web-app-x/shared-contracts';
import {
  countUserGenerationsInMonth,
  createPendingGeneration,
  deleteGeneration,
  getGenerationById,
  listGenerations,
  updateGeneration,
} from './generation.repository.js';
import { generateWithOpenRouter } from '../../services/openrouter.client.js';
import type { AuthUser } from '../../types/auth.js';

export async function createGenerationForUser(user: AuthUser, body: unknown) {
  const parsed = createGenerationRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid generation request', parsed.error.flatten());
  }
  if (user.plan === 'free') {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await countUserGenerationsInMonth(user.id, currentMonth);
    if (usage >= user.monthly_generation_limit) {
      throw new HttpError(402, 'PLAN_LIMIT_REACHED', 'Free plan generation limit reached', {
        usage,
        limit: user.monthly_generation_limit,
      });
    }
  }
  const pending = await createPendingGeneration(user.id, parsed.data.original_input);
  try {
    const aiResult = await generateWithOpenRouter({ prompt: parsed.data.original_input });
    return await updateGeneration(user.id, pending.id, {
      status: 'completed',
      ai_result: aiResult,
    });
  } catch (error) {
    logger.error({ error }, 'OpenRouter generation failed');
    await updateGeneration(user.id, pending.id, {
      status: 'failed',
      ai_result: null,
    });
    throw new HttpError(502, 'PROVIDER_ERROR', 'Failed to generate response');
  }
}

export async function listGenerationHistoryForUser(user: AuthUser, query: unknown) {
  const parsed = listGenerationsQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid list query', parsed.error.flatten());
  }
  const { rows, total } = await listGenerations(
    user.id,
    parsed.data.page,
    parsed.data.limit,
    parsed.data.status,
  );
  return {
    rows,
    page: parsed.data.page,
    limit: parsed.data.limit,
    total,
    has_next: parsed.data.page * parsed.data.limit < total,
  };
}

export async function getGenerationForUser(user: AuthUser, id: string) {
  const row = await getGenerationById(user.id, id);
  if (!row) {
    throw new HttpError(404, 'NOT_FOUND', 'Generation task not found');
  }
  return row;
}

export async function deleteGenerationForUser(user: AuthUser, id: string) {
  const existing = await getGenerationById(user.id, id);
  if (!existing) {
    throw new HttpError(404, 'NOT_FOUND', 'Generation task not found');
  }
  await deleteGeneration(user.id, id);
  return { id, deleted: true };
}
