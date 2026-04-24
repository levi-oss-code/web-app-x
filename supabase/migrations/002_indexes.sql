create index if not exists generation_tasks_user_created_idx
  on public.generation_tasks (user_id, created_at desc);
