import type { Request } from 'express';
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { clearAuthCookie, setAuthCookie } from '../../lib/auth-cookie.js';
import { db } from '../../lib/db.js';
import { signAccessToken } from '../../lib/token.js';
import { requireAuth } from '../../middleware/auth.js';
import type { AuthedRequest } from '../../types/auth.js';

export const authRouter = Router();
const authBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post('/signup', (req: Request, res) => {
  const parsed = authBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid signup payload' },
    });
    return;
  }

  const existing = db.prepare('select id from users where email = ?').get(parsed.data.email) as
    | { id: string }
    | undefined;
  if (existing) {
    res.status(409).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email already exists' },
    });
    return;
  }

  const user = {
    id: randomUUID(),
    email: parsed.data.email.toLowerCase(),
    created_at: new Date().toISOString(),
  };
  const passwordHash = bcrypt.hashSync(parsed.data.password, 10);
  db.prepare(
    'insert into users (id, email, password_hash, created_at) values (?, ?, ?, ?)',
  ).run(user.id, user.email, passwordHash, user.created_at);

  const access_token = signAccessToken({ id: user.id, email: user.email });
  setAuthCookie(res, access_token);
  res.status(201).json({
    success: true,
    data: { user },
  });
});

authRouter.post('/signin', (req: Request, res) => {
  const parsed = authBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid signin payload' },
    });
    return;
  }

  const userRow = db
    .prepare('select id, email, password_hash, created_at from users where email = ?')
    .get(parsed.data.email.toLowerCase()) as
    | { id: string; email: string; password_hash: string; created_at: string }
    | undefined;

  if (!userRow || !bcrypt.compareSync(parsed.data.password, userRow.password_hash)) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_UNAUTHORIZED', message: 'Invalid credentials' },
    });
    return;
  }

  const access_token = signAccessToken({ id: userRow.id, email: userRow.email });
  setAuthCookie(res, access_token);
  res.json({
    success: true,
    data: {
      user: {
        id: userRow.id,
        email: userRow.email,
        created_at: userRow.created_at,
      },
    },
  });
});

authRouter.post('/signout', (_req, res) => {
  clearAuthCookie(res);
  res.json({
    success: true,
    data: { signed_out: true },
  });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const authedReq = req as AuthedRequest;
  const userRow = db
    .prepare('select id, email, created_at from users where id = ?')
    .get(authedReq.authUser.id) as { id: string; email: string; created_at: string } | undefined;
  if (!userRow) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
    return;
  }
  res.json({
    success: true,
    data: {
      user: {
        id: userRow.id,
        email: userRow.email,
        created_at: userRow.created_at,
      },
    },
  });
});
