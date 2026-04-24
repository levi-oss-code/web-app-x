import { z } from 'zod';

export const generationStatusSchema = z.enum(['pending', 'completed', 'failed']);

export const createGenerationRequestSchema = z.object({
  original_input: z.string().trim().min(1).max(5000),
});

export const listGenerationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: generationStatusSchema.optional(),
});
