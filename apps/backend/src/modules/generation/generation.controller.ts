import type { NextFunction, Request, Response } from 'express';
import {
  createGenerationForUser,
  deleteGenerationForUser,
  getGenerationForUser,
  listGenerationHistoryForUser,
} from './generation.service.js';
import type { AuthedRequest } from '../../types/auth.js';

export async function createGenerationController(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const authedReq = req as AuthedRequest;
  const generation = await createGenerationForUser(authedReq.authUser, req.body);
  res.status(201).json({ success: true, data: { generation } });
}

export async function listGenerationsController(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const authedReq = req as AuthedRequest;
  const history = await listGenerationHistoryForUser(authedReq.authUser, req.query);
  res.json({
    success: true,
    data: { generations: history.rows },
    meta: {
      pagination: {
        page: history.page,
        limit: history.limit,
        total: history.total,
        has_next: history.has_next,
      },
    },
  });
}

export async function getGenerationController(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const authedReq = req as AuthedRequest;
  const generation = await getGenerationForUser(authedReq.authUser, String(req.params.id));
  res.json({ success: true, data: { generation } });
}

export async function deleteGenerationController(
  req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> {
  const authedReq = req as AuthedRequest;
  const result = await deleteGenerationForUser(authedReq.authUser, String(req.params.id));
  res.json({ success: true, data: result });
}
