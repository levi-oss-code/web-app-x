import { randomUUID } from 'node:crypto';
import type { GenerationStatus, GenerationTask } from '@web-app-x/shared-contracts';
import { db } from '../../lib/db.js';

export async function createPendingGeneration(
  userId: string,
  originalInput: string,
): Promise<GenerationTask> {
  const row: GenerationTask = {
    id: randomUUID(),
    user_id: userId,
    original_input: originalInput,
    ai_result: null,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  db.prepare(
    'insert into generation_tasks (id, user_id, original_input, ai_result, status, created_at) values (?, ?, ?, ?, ?, ?)',
  ).run(row.id, row.user_id, row.original_input, row.ai_result, row.status, row.created_at);
  return row;
}

export async function updateGeneration(
  userId: string,
  id: string,
  patch: Partial<Pick<GenerationTask, 'ai_result' | 'status'>>,
): Promise<GenerationTask> {
  db.prepare(
    'update generation_tasks set ai_result = coalesce(?, ai_result), status = coalesce(?, status) where id = ? and user_id = ?',
  ).run(patch.ai_result ?? null, patch.status ?? null, id, userId);
  const row = db
    .prepare('select * from generation_tasks where id = ? and user_id = ?')
    .get(id, userId) as GenerationTask | undefined;
  if (!row) {
    throw new Error('Generation task not found after update');
  }
  return row;
}

export async function listGenerations(
  userId: string,
  page: number,
  limit: number,
  status?: GenerationStatus,
): Promise<{ rows: GenerationTask[]; total: number }> {
  const from = (page - 1) * limit;
  const countRow = status
    ? (db
        .prepare('select count(*) as count from generation_tasks where user_id = ? and status = ?')
        .get(userId, status) as { count: number })
    : (db
        .prepare('select count(*) as count from generation_tasks where user_id = ?')
        .get(userId) as { count: number });

  const rows = status
    ? (db
        .prepare(
          'select * from generation_tasks where user_id = ? and status = ? order by created_at desc limit ? offset ?',
        )
        .all(userId, status, limit, from) as unknown as GenerationTask[])
    : (db
        .prepare('select * from generation_tasks where user_id = ? order by created_at desc limit ? offset ?')
        .all(userId, limit, from) as unknown as GenerationTask[]);

  return { rows, total: countRow.count };
}

export async function getGenerationById(
  userId: string,
  id: string,
): Promise<GenerationTask | null> {
  const row = db
    .prepare('select * from generation_tasks where id = ? and user_id = ?')
    .get(id, userId) as GenerationTask | undefined;
  return row ?? null;
}

export async function deleteGeneration(userId: string, id: string): Promise<boolean> {
  const result = db
    .prepare('delete from generation_tasks where id = ? and user_id = ?')
    .run(id, userId);
  return result.changes > 0;
}

export async function countUserGenerationsInMonth(userId: string, isoMonthPrefix: string): Promise<number> {
  const row = db
    .prepare(
      "select count(*) as count from generation_tasks where user_id = ? and created_at >= ? and status in ('pending', 'completed', 'failed')",
    )
    .get(userId, `${isoMonthPrefix}-01`) as { count: number };
  return row.count;
}
