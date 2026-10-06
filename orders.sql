create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text,
  customer_phone text,
  delivery_zone text,
  payment_method text not null,
  currency text not null default 'USD',
  subtotal numeric not null default 0,
  delivery_fee numeric not null default 0,
  total numeric not null default 0,
  items jsonb not null default '[]'::jsonb,
  note text,
  status text not null default 'sent'
);
alter table public.orders enable row level security;
drop policy if exists "public insert orders" on public.orders;
create policy "public insert orders" on public.orders for insert to anon, authenticated with check (true);
drop policy if exists "authenticated read orders" on public.orders;
create policy "authenticated read orders" on public.orders for select to authenticated using (true);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
