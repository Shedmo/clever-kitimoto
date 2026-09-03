-- Full online backup for ALL Clever Kitimoto data (stock, menu, branches, staff, visits...)
-- Run in Supabase → SQL Editor if app_storage table is missing

create table if not exists public.app_storage (
  storage_key text primary key,
  data jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_storage enable row level security;

drop policy if exists "app_storage_public_read" on public.app_storage;
drop policy if exists "app_storage_public_insert" on public.app_storage;
drop policy if exists "app_storage_public_update" on public.app_storage;

create policy "app_storage_public_read" on public.app_storage for select using (true);
create policy "app_storage_public_insert" on public.app_storage for insert with check (true);
create policy "app_storage_public_update" on public.app_storage for update using (true);

alter table public.app_storage replica identity full;
