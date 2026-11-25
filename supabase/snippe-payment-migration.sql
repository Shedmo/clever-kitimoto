-- Add Snippe payment tracking to an existing Clever Kitimoto project.
-- Safe to run repeatedly; existing orders and their prices are preserved.

alter table public.orders add column if not exists service_fee numeric not null default 0;
alter table public.orders add column if not exists total numeric not null default 0;
alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists payment_checkout_url text;
alter table public.orders add column if not exists payment_session_created_at timestamptz;
