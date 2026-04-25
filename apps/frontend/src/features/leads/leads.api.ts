import { apiFetch } from '../../lib/api-client.js';

export interface LeadSubmissionInput {
  email: string;
  note?: string;
  source?: string;
}

export async function submitLead(input: LeadSubmissionInput): Promise<{ already_exists: boolean }> {
  const response = await apiFetch('/leads', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to submit waitlist request');
  }
  return payload.data as { already_exists: boolean };
}
