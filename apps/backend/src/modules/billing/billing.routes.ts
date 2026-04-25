import { Router } from 'express';
import { env } from '../../config/env.js';
import { db } from '../../lib/db.js';
import { HttpError } from '../../lib/http-error.js';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import type { AuthedRequest } from '../../types/auth.js';
import { countUserGenerationsInMonth } from '../generation/generation.repository.js';
import { getStripeClient } from '../../services/stripe.client.js';

export const billingRouter = Router();

billingRouter.get(
  '/usage',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthedRequest;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await countUserGenerationsInMonth(authedReq.authUser.id, currentMonth);
    const canUpgrade = Boolean(
      (env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID) || env.STRIPE_PAYMENT_LINK_URL,
    );
    res.json({
      success: true,
      data: {
        plan: authedReq.authUser.plan,
        monthly_generation_limit: authedReq.authUser.monthly_generation_limit,
        used_this_month: usage,
        can_upgrade: canUpgrade,
      },
    });
  }),
);

billingRouter.post(
  '/checkout-session',
  requireAuth,
  asyncHandler(async (req, res) => {
    const authedReq = req as AuthedRequest;
    if (authedReq.authUser.plan === 'pro') {
      throw new HttpError(400, 'VALIDATION_ERROR', 'User is already on pro plan');
    }
    if (env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID) {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
        success_url: `${env.FRONTEND_ORIGIN}?billing=success`,
        cancel_url: `${env.FRONTEND_ORIGIN}?billing=cancel`,
        metadata: { user_id: authedReq.authUser.id },
        customer_email: authedReq.authUser.email,
      });
      if (!session.url) {
        throw new HttpError(502, 'PROVIDER_ERROR', 'Stripe did not return a checkout URL');
      }
      res.json({
        success: true,
        data: {
          checkout_url: session.url,
        },
      });
      return;
    }
    if (!env.STRIPE_PAYMENT_LINK_URL) {
      throw new HttpError(
        503,
        'BILLING_NOT_CONFIGURED',
        'Billing checkout is not configured yet. Set Stripe keys or STRIPE_PAYMENT_LINK_URL.',
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
  '/webhooks/stripe',
  asyncHandler(async (req, res) => {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new HttpError(503, 'BILLING_NOT_CONFIGURED', 'Stripe webhook secret is not configured');
    }
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Missing Stripe signature');
    }
    const stripe = getStripeClient();
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'Invalid Stripe webhook signature', {
        message: error instanceof Error ? error.message : 'Unknown signature error',
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        metadata?: { user_id?: string };
        customer?: string;
      };
      const userId = session.metadata?.user_id;
      if (userId) {
        db.prepare("update users set plan = 'pro', monthly_generation_limit = ?, stripe_customer_id = ? where id = ?").run(
          env.PRO_MONTHLY_GENERATION_LIMIT,
          session.customer ?? null,
          userId,
        );
      }
    }

    res.json({ received: true });
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
      .prepare("update users set plan = 'pro', monthly_generation_limit = ? where id = ?")
      .run(env.PRO_MONTHLY_GENERATION_LIMIT, userId);
    if (result.changes < 1) {
      throw new HttpError(404, 'NOT_FOUND', 'User not found');
    }
    res.json({ success: true, data: { user_id: userId, plan: 'pro' } });
  }),
);
