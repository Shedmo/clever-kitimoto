-- Clever Kitimoto: complete, repeatable Supabase setup.
-- Run once in Supabase Dashboard -> SQL Editor. Re-running does not overwrite
-- existing orders, sales, branches, products, or other app data.
--
-- This static app currently uses the Supabase publishable key and custom
-- client-side staff login. The policies below preserve that legacy behavior:
-- any visitor with the publishable key can access these tables. Do not treat
-- this as private or secure authentication. Never put an sb_secret key here.

begin;

-- Orders created through the customer menu.
create table if not exists public.orders (
  id text primary key,
  at timestamptz not null default now(),
  channel text,
  phone text,
  address text,
  notes text,
  fulfillment text,
  payment text,
  subtotal numeric not null default 0,
  service_fee numeric not null default 0,
  total numeric not null default 0,
  items jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  payment_reference text,
  payment_checkout_url text,
  payment_session_created_at timestamptz,
  status_at timestamptz,
  status_by text,
  created_at timestamptz not null default now()
);
alter table public.orders add column if not exists at timestamptz not null default now();
alter table public.orders add column if not exists channel text;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists notes text;
alter table public.orders add column if not exists fulfillment text;
alter table public.orders add column if not exists payment text;
alter table public.orders add column if not exists subtotal numeric not null default 0;
alter table public.orders add column if not exists service_fee numeric not null default 0;
alter table public.orders add column if not exists total numeric not null default 0;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.orders add column if not exists payment_reference text;
alter table public.orders add column if not exists payment_checkout_url text;
alter table public.orders add column if not exists payment_session_created_at timestamptz;
alter table public.orders add column if not exists status_at timestamptz;
alter table public.orders add column if not exists status_by text;
alter table public.orders add column if not exists created_at timestamptz not null default now();

-- Point-of-sale receipts. Each item on a multi-item receipt is one row.
create table if not exists public.sales (
  id text primary key,
  receipt_id text,
  at timestamptz not null default now(),
  item_id text,
  item_name text,
  category text,
  qty numeric not null default 0,
  unit text,
  unit_price numeric not null default 0,
  total numeric not null default 0,
  payment text,
  phone text,
  notes text,
  seller text,
  branch_id text,
  branch_name text,
  stock_after numeric,
  created_at timestamptz not null default now()
);
alter table public.sales add column if not exists receipt_id text;
alter table public.sales add column if not exists at timestamptz not null default now();
alter table public.sales add column if not exists item_id text;
alter table public.sales add column if not exists item_name text;
alter table public.sales add column if not exists category text;
alter table public.sales add column if not exists qty numeric not null default 0;
alter table public.sales add column if not exists unit text;
alter table public.sales add column if not exists unit_price numeric not null default 0;
alter table public.sales add column if not exists total numeric not null default 0;
alter table public.sales add column if not exists payment text;
alter table public.sales add column if not exists phone text;
alter table public.sales add column if not exists notes text;
alter table public.sales add column if not exists seller text;
alter table public.sales add column if not exists branch_id text;
alter table public.sales add column if not exists branch_name text;
alter table public.sales add column if not exists stock_after numeric;
alter table public.sales add column if not exists created_at timestamptz not null default now();

-- Cloud-synced app records: branch catalog, stock, menu/prices, and settings.
create table if not exists public.app_storage (
  storage_key text primary key,
  data jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_storage add column if not exists data jsonb;
alter table public.app_storage add column if not exists updated_at timestamptz not null default now();

alter table public.orders enable row level security;
alter table public.sales enable row level security;
alter table public.app_storage enable row level security;

-- Existing static app client policies. These allow its publishable-key client
-- to work; they do not provide user-level data privacy.
drop policy if exists "orders_public_read" on public.orders;
drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "orders_public_update" on public.orders;
drop policy if exists "orders_public_delete" on public.orders;
create policy "orders_public_read" on public.orders for select using (true);
create policy "orders_public_insert" on public.orders for insert with check (true);
create policy "orders_public_update" on public.orders for update using (true) with check (true);
create policy "orders_public_delete" on public.orders for delete using (true);

drop policy if exists "sales_public_read" on public.sales;
drop policy if exists "sales_public_insert" on public.sales;
drop policy if exists "sales_public_update" on public.sales;
drop policy if exists "sales_public_delete" on public.sales;
create policy "sales_public_read" on public.sales for select using (true);
create policy "sales_public_insert" on public.sales for insert with check (true);
create policy "sales_public_update" on public.sales for update using (true) with check (true);
create policy "sales_public_delete" on public.sales for delete using (true);

drop policy if exists "app_storage_public_read" on public.app_storage;
drop policy if exists "app_storage_public_insert" on public.app_storage;
drop policy if exists "app_storage_public_update" on public.app_storage;
drop policy if exists "app_storage_public_delete" on public.app_storage;
create policy "app_storage_public_read" on public.app_storage for select using (true);
create policy "app_storage_public_insert" on public.app_storage for insert with check (true);
create policy "app_storage_public_update" on public.app_storage for update using (true) with check (true);
create policy "app_storage_public_delete" on public.app_storage for delete using (true);

grant select, insert, update, delete on public.orders to anon, authenticated;
grant select, insert, update, delete on public.sales to anon, authenticated;
grant select, insert, update, delete on public.app_storage to anon, authenticated;

alter table public.orders replica identity full;
alter table public.sales replica identity full;
alter table public.app_storage replica identity full;

-- Seed app defaults only when the corresponding cloud record does not exist.
-- This preserves existing cloud data if the setup is run on an active project.
insert into public.app_storage (storage_key, data) values
  (
    'cleverKitimotoBranchesV1',
    jsonb_build_array(jsonb_build_object(
      'id', 'br-main',
      'name', 'Clever Kitimoto — Main',
      'location', 'Dar es Salaam',
      'phone', '0683 497 330',
      'active', true,
      'createdAt', now()
    ))
  ),
  (
    'cleverKitimotoSalesItemsV1__br-main',
    jsonb_build_array(
      jsonb_build_object('id','si-br-main-0','name','Choma','category','Choma','unit','KG','price',18000,'costPrice',12000,'stock',20,'lowStock',3,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-1','name','Choma ya Foil','category','Choma ya Foil','unit','KG','price',18000,'costPrice',12000,'stock',20,'lowStock',3,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-2','name','Rosti','category','Rosti','unit','KG','price',17000,'costPrice',11000,'stock',20,'lowStock',3,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-3','name','Kavu','category','Kavu','unit','KG','price',17000,'costPrice',11000,'stock',20,'lowStock',3,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-4','name','½ KG Mix','category','Mix','unit','Kifurushi','price',25000,'costPrice',16000,'stock',12,'lowStock',2,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-5','name','1 KG Mix','category','Mix','unit','Kifurushi','price',35000,'costPrice',22000,'stock',10,'lowStock',2,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-6','name','Kisinia Single','category','Kisinia','unit','Kifurushi','price',20000,'costPrice',13000,'stock',15,'lowStock',3,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-7','name','Kisinia Couple','category','Kisinia','unit','Kifurushi','price',35000,'costPrice',22000,'stock',10,'lowStock',2,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-8','name','Kisinia Family','category','Kisinia','unit','Kifurushi','price',65000,'costPrice',42000,'stock',6,'lowStock',1,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-9','name','Chipsi Kavu','category','Sides','unit','Sahani','price',2000,'costPrice',800,'stock',40,'lowStock',8,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-10','name','Chipsi Yai','category','Sides','unit','Sahani','price',3000,'costPrice',1200,'stock',30,'lowStock',6,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-11','name','Ugali','category','Sides','unit','Kipande','price',1000,'costPrice',400,'stock',50,'lowStock',10,'trackStock',true,'active',true),
      jsonb_build_object('id','si-br-main-12','name','Ndizi','category','Sides','unit','Kipande','price',500,'costPrice',200,'stock',60,'lowStock',12,'trackStock',true,'active',true)
    )
  ),
  (
    'cleverKitimotoMenuV1',
    '{"choma":"9,000","choma1":"18,000","choma15":"27,000","choma2":"36,000","foil":"9,000","foil1":"18,000","foil15":"27,000","foil2":"36,000","rosti":"8,500","rosti1":"17,000","rosti15":"25,500","rosti2":"34,000","kavu":"8,500","kavu1":"17,000","kavu15":"25,500","kavu2":"34,000","single":"20,000","couple":"35,000","family":"65,000","mixedhalf":"25,000","mixedone":"35,000","mixedtwo":"65,000","zegeSingle":"15,000","zegeCouple":"30,000","zegeSpecial":"35,000","chipsiKavu":"2,000","chipsiYai":"3,000","ndizi":"500","ugali":"1,000","kachumbari":"1,000"}'::jsonb
  ),
  ('cleverKitimotoCustomMenusV1', '[]'::jsonb),
  ('cleverKitimotoStaffBranchesV1', '{"seller":"br-main"}'::jsonb),
  ('cleverKitimotoSalesLogV1__br-main', '[]'::jsonb),
  ('cleverKitimotoStockLogV1__br-main', '[]'::jsonb),
  ('cleverKitimotoExpensesV1__br-main', '[]'::jsonb),
  ('cleverKitimotoVisitLogV1', '[]'::jsonb)
on conflict (storage_key) do nothing;

-- Add Realtime publication entries when the standard Supabase publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
      alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='sales') then
      alter publication supabase_realtime add table public.sales;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='app_storage') then
      alter publication supabase_realtime add table public.app_storage;
    end if;
  end if;
end $$;

commit;
