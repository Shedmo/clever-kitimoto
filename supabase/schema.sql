-- Clever Kitimoto — run once in Supabase → SQL Editor → Run
-- https://supabase.com/dashboard → your project → SQL Editor

create table if not exists public.orders (
  id text primary key,
  at timestamptz not null default now(),
  channel text,
  phone text,
  address text,
  notes text,
  fulfillment text,
  payment text,
  subtotal numeric default 0,
  items jsonb default '[]'::jsonb,
  status text default 'pending',
  status_at timestamptz,
  status_by text,
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

drop policy if exists "orders_public_read" on public.orders;
drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "orders_public_update" on public.orders;

create policy "orders_public_read" on public.orders for select using (true);
create policy "orders_public_insert" on public.orders for insert with check (true);
create policy "orders_public_update" on public.orders for update using (true);

-- Realtime (admin sees new orders instantly)
alter table public.orders replica identity full;

-- POS / in-store sales (Smart POS — mauzo ya muuzaji)
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
