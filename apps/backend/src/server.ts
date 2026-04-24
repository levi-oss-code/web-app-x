import { createApp } from './app.js';
import { env } from './config/env.js';
import './lib/db.js';
import { logger } from './lib/logger.js';

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Backend listening');
});
