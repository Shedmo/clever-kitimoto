-- Clever Kitimoto — run ONCE in Supabase SQL Editor (safe to re-run)
-- Adds: sales + app_storage (menu, stock, branches, staff, visits...)
-- https://supabase.com/dashboard → SQL Editor → New query → Run

-- ── POS sales ──────────────────────────────────────────────
create table if not exists public.sales (
  id text primary key,
  receipt_id text,
  at timestamptz not null default now(),
  item_id text,
  item_name text,
  category text,
  qty numeric default 0,
  unit text,
  unit_price numeric default 0,
  total numeric default 0,
  payment text,
  phone text,
  notes text,
  seller text,
  branch_id text,
  branch_name text,
  stock_after numeric,
  created_at timestamptz default now()
);
alter table public.sales enable row level security;
drop policy if exists "sales_public_read" on public.sales;
drop policy if exists "sales_public_insert" on public.sales;
drop policy if exists "sales_public_update" on public.sales;
create policy "sales_public_read" on public.sales for select using (true);
create policy "sales_public_insert" on public.sales for insert with check (true);
create policy "sales_public_update" on public.sales for update using (true);
alter table public.sales replica identity full;

-- ── App storage (menu, stock, branches, staff, visits) ─────
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
