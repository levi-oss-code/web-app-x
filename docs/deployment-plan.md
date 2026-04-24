# Deployment Plan

## Target topology (MVP)

- Frontend: Vercel static hosting for the Vite app.
- Backend: Render Web Service (or Fly.io) for the Express API.
- Database: SQLite file for MVP only.
- AI Provider: OpenRouter from backend only.

## Prerequisites

1. GitHub repo is connected and CI passes.
2. OpenRouter API key is active.
3. Production domains decided:
   - Frontend domain (for example `https://web-app-x.vercel.app`)
   - Backend domain (for example `https://web-app-x-api.onrender.com`)

## Environment configuration

### Backend (`apps/backend/.env.production.example`)

- `NODE_ENV=production`
- `PORT=4000`
- `FRONTEND_ORIGIN=<frontend-domain>`
- `OPENROUTER_API_KEY=<secret>`
- `OPENROUTER_MODEL=openai/gpt-4o-mini`
- `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1`
- `JWT_SECRET=<long random secret>`
- `SQLITE_DB_PATH=./data/app.db`

### Frontend (`apps/frontend/.env.production.example`)

- `VITE_API_BASE_URL=<backend-domain>/api`

## Provider-specific steps

### 1) Deploy backend

1. Create a Web Service on Render from this repo.
2. Root directory: `apps/backend`.
3. Build command: `pnpm install --frozen-lockfile && pnpm --filter @web-app-x/backend build`
4. Start command: `pnpm --filter @web-app-x/backend dev`
5. Add all backend production env vars from template.
6. Set persistent disk mount for `./data` if staying on SQLite.

### 2) Deploy frontend

1. Create a Vercel project from this repo.
2. Root directory: `apps/frontend`.
3. Build command: `pnpm --filter @web-app-x/frontend build`
4. Output directory: `dist`.
5. Set `VITE_API_BASE_URL` to your deployed backend `/api` URL.

### 3) Cross-origin and cookie verification

1. Ensure backend `FRONTEND_ORIGIN` exactly matches deployed frontend origin.
2. Confirm browser can:
   - sign up/sign in
   - create generation
   - load and delete history

## Post-deploy checks

1. `GET /api/health` returns success.
2. Auth endpoints work end-to-end in production.
3. Generation request returns completed/failed clearly.
4. App UI shows loading and error states on network/provider issues.

## Risk notes and recommended next upgrades

- SQLite is acceptable for MVP demos but not ideal for multi-instance production.
- Next upgrade path:
  1. Move to managed Postgres.
  2. Replace local JWT/user store with managed auth provider.
  3. Add background queue for long-running generation jobs.
