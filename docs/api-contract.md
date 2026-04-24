# API Contract

## Base

- Base URL: `/api`
- Auth: HttpOnly cookie (`web_app_x_token`) for browser clients, `Authorization: Bearer <jwt_access_token>` for API clients.
- Content type: `application/json`

## Endpoints

- `GET /health`
  - Public liveness endpoint.
- `GET /auth/me`
  - Returns authenticated user profile.
- `POST /auth/signup`
  - Creates a user and returns `access_token`.
- `POST /auth/signin`
  - Authenticates user and sets HttpOnly auth cookie.
- `POST /auth/signout`
  - Clears auth cookie and ends browser session.
- `POST /generations`
  - Creates a generation task, calls OpenRouter from backend only, persists result.
- `GET /generations`
  - Lists current user's generation history with pagination.
- `GET /generations/:id`
  - Returns one task if owned by current user.
- `DELETE /generations/:id`
  - Deletes one task if owned by current user.

## Entities

- `User`: `id`, `email`, `created_at`
- `Generation_Task`: `id`, `user_id`, `original_input`, `ai_result`, `status`, `created_at`

## Generation status

- `pending`
- `completed`
- `failed`

## Error codes

- `AUTH_UNAUTHORIZED`
- `AUTH_FORBIDDEN`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `RATE_LIMITED`
- `PROVIDER_ERROR`
- `PROVIDER_TIMEOUT`
- `INTERNAL_ERROR`
