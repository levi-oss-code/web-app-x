import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  plan: 'free' | 'pro';
  monthly_generation_limit: number;
}

export type AuthedRequest = Request & { authUser: AuthUser };
