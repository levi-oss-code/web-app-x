import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { generationRateLimit } from '../../middleware/rate-limit.js';
import { asyncHandler } from '../../middleware/async-handler.js';
import {
  createGenerationController,
  deleteGenerationController,
  getGenerationController,
  listGenerationsController,
} from './generation.controller.js';

export const generationRouter = Router();

generationRouter.post('/', requireAuth, generationRateLimit, asyncHandler(createGenerationController));
generationRouter.get('/', requireAuth, asyncHandler(listGenerationsController));
generationRouter.get('/:id', requireAuth, asyncHandler(getGenerationController));
generationRouter.delete('/:id', requireAuth, asyncHandler(deleteGenerationController));
