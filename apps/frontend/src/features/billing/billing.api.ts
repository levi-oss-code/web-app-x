import { apiFetch } from '../../lib/api-client.js';

export interface BillingUsage {
  plan: 'free' | 'pro';
  monthly_generation_limit: number;
  used_this_month: number;
}

export async function getBillingUsage(): Promise<BillingUsage> {
  const response = await apiFetch('/billing/usage', { method: 'GET' });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to load billing usage');
  }
  return payload.data as BillingUsage;
}

export async function createCheckoutSession(): Promise<{ checkout_url: string }> {
  const response = await apiFetch('/billing/checkout-session', { method: 'POST' });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to start checkout');
  }
  return payload.data as { checkout_url: string };
}
