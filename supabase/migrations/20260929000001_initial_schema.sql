-- BulkTrack wholesaler admin schema.
-- Text primary keys match the slug/reference-style ids the frontend already
-- generates client-side (e.g. "grocery-a", "SL-1042"), so the app layer
-- keeps producing ids the same way it did against the old mock data.

create table products (
  id text primary key,
  name text not null,
  category text not null default 'General',
  price numeric not null default 0,
  bundle_size text not null default '',
  items text[] not null default '{}',
  stock_total integer not null default 0,
  stock_taken integer not null default 0,
  reorder_at integer not null default 0,
  created_at timestamptz not null default now()
);

create table customers (
  id text primary key,
  name text not null,
  contact text not null default '',
  phone text not null default '',
  address text not null default '',
  city text not null default '',
  joined date not null default current_date,
  created_at timestamptz not null default now()
);

create table sales (
  id text primary key,
  date date not null default current_date,
  customer_id text not null references customers(id) on delete restrict,
  product_id text not null references products(id) on delete restrict,
  qty integer not null check (qty > 0),
  status text not null default 'Order Placed',
  created_at timestamptz not null default now()
);

create table payments (
  id text primary key,
  date date not null default current_date,
  sale_id text not null references sales(id) on delete cascade,
  amount numeric not null check (amount > 0),
  method text not null default 'Cash on Delivery',
  created_at timestamptz not null default now()
);

create table stock_movements (
  id text primary key,
  date date not null default current_date,
  product_id text not null references products(id) on delete cascade,
  type text not null check (type in ('in', 'out')),
  qty integer not null check (qty > 0),
  reference text not null default '',
  created_at timestamptz not null default now()
);

create index sales_customer_id_idx on sales(customer_id);
create index sales_product_id_idx on sales(product_id);
create index payments_sale_id_idx on payments(sale_id);
create index stock_movements_product_id_idx on stock_movements(product_id);

-- This is an internal admin tool: any authenticated (logged-in) wholesaler
-- staff account gets full read/write access. There is no public-facing
-- role, so anonymous access is denied entirely.
alter table products enable row level security;
alter table customers enable row level security;
alter table sales enable row level security;
alter table payments enable row level security;
alter table stock_movements enable row level security;

create policy "authenticated full access" on products
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on customers
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on sales
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on payments
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on stock_movements
  for all to authenticated using (true) with check (true);
