-- Supabase schema for the food business management app.
-- Apply this file in Supabase SQL Editor after creating the project.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.plan_code as enum ('essential', 'management', 'elite');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum ('active', 'past_due', 'canceled', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transaction_type as enum ('entrada', 'despesa');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.transaction_period as enum ('daily', 'monthly', 'yearly');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.bill_kind as enum ('fixed', 'bill');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.bill_status as enum ('pendente', 'paga', 'atrasada');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.bill_recurrence as enum ('unica', 'mensal');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.ingredient_unit as enum ('kg', 'g', 'l', 'ml', 'unidade', 'pacote');
exception when duplicate_object then null;
end $$;

create table if not exists public.plans (
  code public.plan_code primary key,
  name text not null,
  price_cents integer not null,
  store_limit integer not null,
  device_limit integer not null,
  created_at timestamptz not null default now()
);

insert into public.plans (code, name, price_cents, store_limit, device_limit)
values
  ('essential', 'Essencial', 2990, 1, 2),
  ('management', 'Gestão', 4990, 2, 3),
  ('elite', 'Elite', 7990, 3, 5)
on conflict (code) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  store_limit = excluded.store_limit,
  device_limit = excluded.device_limit;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  business_name text,
  document_number text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_code public.plan_code not null references public.plans(code),
  status public.subscription_status not null default 'active',
  gateway_customer_id text,
  gateway_subscription_id text,
  current_period_end timestamptz,
  canceled_at timestamptz,
  data_retention_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  type public.transaction_type not null,
  description text not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  transaction_date date not null,
  period public.transaction_period default 'daily',
  period_label text,
  payment_method text,
  business_hours text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  kind public.bill_kind not null,
  title text not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  status public.bill_status not null default 'pendente',
  recurrence public.bill_recurrence not null default 'unica',
  paid_at date,
  payment_method text,
  bank text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.priced_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  category text not null,
  packaging_cost numeric(12,2) not null default 0,
  extra_costs numeric(12,2) not null default 0,
  monthly_fixed_costs numeric(12,2) not null default 0,
  expected_monthly_sales numeric(12,2) not null default 0,
  margin_percent numeric(6,2) not null default 0,
  ifood_fee_percent numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_ingredients (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.priced_products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  purchase_unit public.ingredient_unit not null,
  purchase_quantity numeric(12,3) not null check (purchase_quantity > 0),
  purchase_price numeric(12,2) not null check (purchase_price >= 0),
  used_unit public.ingredient_unit not null,
  used_quantity numeric(12,3) not null check (used_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.monthly_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  month date not null,
  amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, month)
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'neutral',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_label text,
  device_fingerprint text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists stores_user_id_idx on public.stores(user_id);
create index if not exists transactions_store_date_idx on public.transactions(store_id, transaction_date);
create index if not exists bills_store_due_date_idx on public.bills(store_id, due_date);
create index if not exists priced_products_store_idx on public.priced_products(store_id);
create index if not exists product_ingredients_product_idx on public.product_ingredients(product_id);
create index if not exists monthly_targets_store_month_idx on public.monthly_targets(store_id, month);
create index if not exists device_sessions_user_idx on public.device_sessions(user_id);
create unique index if not exists device_sessions_user_fingerprint_unique
on public.device_sessions(user_id, device_fingerprint);

grant usage on schema public to service_role;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.subscriptions to service_role;
grant select, insert, update, delete on public.device_sessions to authenticated;
grant select, insert, update, delete on public.stores to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.bills to authenticated;
grant select, insert, update, delete on public.priced_products to authenticated;
grant select, insert, update, delete on public.product_ingredients to authenticated;
grant select, insert, update, delete on public.monthly_targets to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;
grant select on public.plans to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
before update on public.subscriptions
for each row execute function public.touch_updated_at();

drop trigger if exists stores_touch_updated_at on public.stores;
create trigger stores_touch_updated_at
before update on public.stores
for each row execute function public.touch_updated_at();

drop trigger if exists transactions_touch_updated_at on public.transactions;
create trigger transactions_touch_updated_at
before update on public.transactions
for each row execute function public.touch_updated_at();

drop trigger if exists bills_touch_updated_at on public.bills;
create trigger bills_touch_updated_at
before update on public.bills
for each row execute function public.touch_updated_at();

drop trigger if exists priced_products_touch_updated_at on public.priced_products;
create trigger priced_products_touch_updated_at
before update on public.priced_products
for each row execute function public.touch_updated_at();

drop trigger if exists product_ingredients_touch_updated_at on public.product_ingredients;
create trigger product_ingredients_touch_updated_at
before update on public.product_ingredients
for each row execute function public.touch_updated_at();

drop trigger if exists monthly_targets_touch_updated_at on public.monthly_targets;
create trigger monthly_targets_touch_updated_at
before update on public.monthly_targets
for each row execute function public.touch_updated_at();

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
before update on public.user_settings
for each row execute function public.touch_updated_at();

create or replace function public.current_plan_store_limit(target_user_id uuid)
returns integer
language sql
stable
as $$
  select p.store_limit
  from public.subscriptions s
  join public.plans p on p.code = s.plan_code
  where s.user_id = target_user_id
    and (
      s.status = 'active'
      or (s.status in ('past_due', 'canceled') and coalesce(s.data_retention_until, now()) >= now())
    )
  limit 1;
$$;

create or replace function public.enforce_store_limit()
returns trigger
language plpgsql
as $$
declare
  allowed_stores integer;
  active_stores integer;
begin
  select public.current_plan_store_limit(new.user_id) into allowed_stores;

  if allowed_stores is null then
    raise exception 'Assinatura ativa não encontrada.';
  end if;

  select count(*) into active_stores
  from public.stores
  where user_id = new.user_id
    and archived_at is null;

  if active_stores >= allowed_stores then
    raise exception 'Limite de lojas do plano atingido.';
  end if;

  return new;
end;
$$;

drop trigger if exists stores_enforce_store_limit on public.stores;
create trigger stores_enforce_store_limit
before insert on public.stores
for each row execute function public.enforce_store_limit();

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, business_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'business_name', '')
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan_code, status, data_retention_until)
  values (new.id, 'essential', 'past_due', now() + interval '45 days')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stores enable row level security;
alter table public.transactions enable row level security;
alter table public.bills enable row level security;
alter table public.priced_products enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.monthly_targets enable row level security;
alter table public.user_settings enable row level security;
alter table public.device_sessions enable row level security;
alter table public.plans enable row level security;

drop policy if exists "Plans are readable by authenticated users" on public.plans;
create policy "Plans are readable by authenticated users"
on public.plans for select
to authenticated
using (true);

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can read own subscription" on public.subscriptions;
create policy "Users can read own subscription"
on public.subscriptions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage own stores" on public.stores;
create policy "Users can manage own stores"
on public.stores for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage own transactions" on public.transactions;
create policy "Users can manage own transactions"
on public.transactions for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.stores
    where stores.id = transactions.store_id
      and stores.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own bills" on public.bills;
create policy "Users can manage own bills"
on public.bills for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.stores
    where stores.id = bills.store_id
      and stores.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own priced products" on public.priced_products;
create policy "Users can manage own priced products"
on public.priced_products for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.stores
    where stores.id = priced_products.store_id
      and stores.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own product ingredients" on public.product_ingredients;
create policy "Users can manage own product ingredients"
on public.product_ingredients for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.priced_products
    where priced_products.id = product_ingredients.product_id
      and priced_products.user_id = auth.uid()
      and priced_products.store_id = product_ingredients.store_id
  )
);

drop policy if exists "Users can manage own monthly targets" on public.monthly_targets;
create policy "Users can manage own monthly targets"
on public.monthly_targets for all
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.stores
    where stores.id = monthly_targets.store_id
      and stores.user_id = auth.uid()
  )
);

drop policy if exists "Users can manage own settings" on public.user_settings;
create policy "Users can manage own settings"
on public.user_settings for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can manage own device sessions" on public.device_sessions;
create policy "Users can manage own device sessions"
on public.device_sessions for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
