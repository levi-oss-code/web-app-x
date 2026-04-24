import type { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
}

export type AuthedRequest = Request & { authUser: AuthUser };
