import type { NextFunction, Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../lib/auth-cookie.js';
import { db } from '../lib/db.js';
import type { AuthedRequest } from '../types/auth.js';
import { verifyAccessToken } from '../lib/token.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null;
    const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
    const accessToken = bearerToken ?? cookieToken ?? null;

    if (!accessToken) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Missing authentication token' },
      });
      return;
    }
    const tokenUser = verifyAccessToken(accessToken);
    const userRow = db
      .prepare('select id, email, plan, monthly_generation_limit from users where id = ?')
      .get(tokenUser.id) as
      | { id: string; email: string; plan: 'free' | 'pro'; monthly_generation_limit: number }
      | undefined;
    if (!userRow) {
      res.status(401).json({
        success: false,
        error: { code: 'AUTH_UNAUTHORIZED', message: 'Invalid or expired token' },
      });
      return;
    }
    (req as AuthedRequest).authUser = userRow;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}
