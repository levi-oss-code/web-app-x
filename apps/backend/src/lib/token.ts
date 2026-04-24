import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

interface JwtClaims {
  sub: string;
  email: string;
}

export function signAccessToken(user: { id: string; email: string }): string {
  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string): { id: string; email: string } {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtClaims;
  if (!decoded.sub || !decoded.email) {
    throw new Error('Invalid token claims');
  }
  return {
    id: decoded.sub,
    email: decoded.email,
  };
}
