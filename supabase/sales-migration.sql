-- Run this if you already ran schema.sql BEFORE the sales table was added.
-- Supabase → SQL Editor → New query → Run

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
drop policy if exists "sales_public_delete" on public.sales;

create policy "sales_public_read" on public.sales for select using (true);
create policy "sales_public_insert" on public.sales for insert with check (true);
create policy "sales_public_update" on public.sales for update using (true);
create policy "sales_public_delete" on public.sales for delete using (true);

alter table public.sales replica identity full;
