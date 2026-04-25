import Stripe from 'stripe';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http-error.js';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, 'BILLING_NOT_CONFIGURED', 'Stripe secret key is not configured');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}
