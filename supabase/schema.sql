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
