# Architecture

## Apps

- `apps/frontend`: React + Vite + Tailwind user interface.
- `apps/backend`: Express API, auth enforcement, OpenRouter integration.

## Packages

- `packages/shared-contracts`: Common Zod schemas and TypeScript interfaces.

## Data

- SQLite database managed by backend
- `users` and `generation_tasks` tables with user-owned row filtering in backend queries

## Security boundaries

- OpenRouter API key exists only on backend env.
- Frontend never calls OpenRouter directly.
