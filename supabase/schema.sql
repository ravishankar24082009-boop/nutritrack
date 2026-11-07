-- Run this in Supabase Dashboard > SQL Editor.
create table if not exists public.nutritrack_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.nutritrack_data enable row level security;

grant select, insert, update, delete on public.nutritrack_data to authenticated;

drop policy if exists "Users can read their own NutriTrack data" on public.nutritrack_data;
create policy "Users can read their own NutriTrack data"
  on public.nutritrack_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own NutriTrack data" on public.nutritrack_data;
create policy "Users can insert their own NutriTrack data"
  on public.nutritrack_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own NutriTrack data" on public.nutritrack_data;
create policy "Users can update their own NutriTrack data"
  on public.nutritrack_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own NutriTrack data" on public.nutritrack_data;
create policy "Users can delete their own NutriTrack data"
  on public.nutritrack_data for delete to authenticated
  using ((select auth.uid()) = user_id);
