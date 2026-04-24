import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().min(1).default('openai/gpt-4o-mini'),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  JWT_SECRET: z.string().min(16).default('dev-jwt-secret-change-in-production'),
  SQLITE_DB_PATH: z.string().default('./data/app.db'),
  FREE_MONTHLY_GENERATION_LIMIT: z.coerce.number().int().positive().default(20),
  STRIPE_PAYMENT_LINK_URL: z.string().url().optional(),
  BILLING_ADMIN_TOKEN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
