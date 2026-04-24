# Runbook

## Local setup

1. Install `pnpm`.
2. Run `pnpm install` from project root.
3. Copy `apps/backend/.env.example` to `apps/backend/.env`.
4. Copy `apps/frontend/.env.example` to `apps/frontend/.env`.
5. Fill OpenRouter secret and set `JWT_SECRET`.
6. Run backend: `pnpm dev:backend`.
7. Run frontend: `pnpm dev`.

## Production setup templates

- Backend template: `apps/backend/.env.production.example`
- Frontend template: `apps/frontend/.env.production.example`
- Deployment sequence: `docs/deployment-plan.md`

## Verification

- `GET /api/health` should return `success: true`.
- Frontend should load at Vite default port.
