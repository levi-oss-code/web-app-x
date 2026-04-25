import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../lib/db.js';
import { HttpError } from '../../lib/http-error.js';
import { asyncHandler } from '../../middleware/async-handler.js';

const createLeadSchema = z.object({
  email: z.string().email(),
  note: z.string().trim().max(2000).optional(),
  source: z.string().trim().min(1).max(100).optional(),
});

export const leadsRouter = Router();

leadsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = createLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid waitlist submission', parsed.error.flatten());
    }

    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const existing = db
      .prepare('select id from waitlist_leads where email = ?')
      .get(normalizedEmail) as { id: string } | undefined;

    if (existing) {
      res.json({
        success: true,
        data: { id: existing.id, already_exists: true },
      });
      return;
    }

    const id = randomUUID();
    db.prepare(
      'insert into waitlist_leads (id, email, note, source, created_at) values (?, ?, ?, ?, ?)',
    ).run(
      id,
      normalizedEmail,
      parsed.data.note ?? null,
      parsed.data.source ?? 'landing',
      new Date().toISOString(),
    );

    res.status(201).json({
      success: true,
      data: { id, already_exists: false },
    });
  }),
);
