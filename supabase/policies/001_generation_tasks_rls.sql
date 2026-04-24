alter table public.generation_tasks enable row level security;

create policy "Users can select own generation tasks"
  on public.generation_tasks
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own generation tasks"
  on public.generation_tasks
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own generation tasks"
  on public.generation_tasks
  for delete
  using (auth.uid() = user_id);

create policy "Users can update own generation tasks"
  on public.generation_tasks
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
