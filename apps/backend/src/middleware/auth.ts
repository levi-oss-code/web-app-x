import type { NextFunction, Request, Response } from 'express';
import { ACCESS_TOKEN_COOKIE } from '../lib/auth-cookie.js';
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
    (req as AuthedRequest).authUser = verifyAccessToken(accessToken);
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}
