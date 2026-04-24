create table if not exists public.generation_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_input text not null,
  ai_result text,
  status text not null check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);
