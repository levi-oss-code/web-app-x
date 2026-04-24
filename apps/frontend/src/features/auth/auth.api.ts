import { apiFetch } from '../../lib/api-client.js';

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: AuthUser;
}

export async function signUp(email: string, password: string): Promise<AuthResponse> {
  const response = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to sign up');
  }
  return payload.data as AuthResponse;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await apiFetch('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to sign in');
  }
  return payload.data as AuthResponse;
}

export async function getMe(): Promise<AuthUser> {
  const response = await apiFetch('/auth/me', {
    method: 'GET',
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Failed to load profile');
  }
  return payload.data.user as AuthUser;
}

export async function signOut(): Promise<void> {
  const response = await apiFetch('/auth/signout', {
    method: 'POST',
  });
  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload?.error?.message ?? 'Failed to sign out');
  }
}
