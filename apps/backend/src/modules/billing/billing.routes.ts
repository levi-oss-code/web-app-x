import { Router } from 'express';
import { env } from '../../config/env.js';
import { db } from '../../lib/db.js';
import { HttpError } from '../../lib/http-error.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import type { AuthedRequest } from '../../types/auth.js';
import { countUserGenerationsInMonth } from '../generation/generation.repository.js';

export const billingRouter = Router();

billingRouter.get(
  '/usage',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthedRequest;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await countUserGenerationsInMonth(authedReq.authUser.id, currentMonth);
    res.json({
      success: true,
      data: {
        plan: authedReq.authUser.plan,
        monthly_generation_limit: authedReq.authUser.monthly_generation_limit,
        used_this_month: usage,
      },
    });
  }),
);

billingRouter.post(
  '/checkout-session',
  requireAuth,
  asyncHandler(async (_req, res) => {
    if (!env.STRIPE_PAYMENT_LINK_URL) {
      throw new HttpError(
        503,
        'BILLING_NOT_CONFIGURED',
        'Billing checkout is not configured yet. Set STRIPE_PAYMENT_LINK_URL.',
      );
    }
    res.json({
      success: true,
      data: {
        checkout_url: env.STRIPE_PAYMENT_LINK_URL,
      },
    });
  }),
);

billingRouter.post(
  '/admin/promote-pro',
  asyncHandler(async (req, res) => {
    if (!env.BILLING_ADMIN_TOKEN || req.headers['x-admin-token'] !== env.BILLING_ADMIN_TOKEN) {
      throw new HttpError(401, 'AUTH_UNAUTHORIZED', 'Invalid admin token');
    }
    const userId = String(req.body?.user_id ?? '').trim();
    if (!userId) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'user_id is required');
    }
    const result = db
      .prepare("update users set plan = 'pro', monthly_generation_limit = 100000 where id = ?")
      .run(userId);
    if (result.changes < 1) {
      throw new HttpError(404, 'NOT_FOUND', 'User not found');
    }
    res.json({ success: true, data: { user_id: userId, plan: 'pro' } });
  }),
);
