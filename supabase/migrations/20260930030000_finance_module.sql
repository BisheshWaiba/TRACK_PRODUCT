-- The finance layer: ledgers, a cash book, bank accounts, expenses and
-- purchases, sitting on top of the sales and payments this app already
-- records. Ported from the Jageer Nepal finance system.
--
-- Nothing existing changes shape. sales and payments stay exactly as
-- they are and keep driving the pages that already read them; two
-- triggers mirror them into a customer ledger, and everything the
-- finance screens need is derived from there.
--
-- Three deliberate differences from the system this came from, each
-- forced by this codebase rather than chosen:
--
--   1. No owner_id. That system is multi-tenant - every row belongs to
--      a reseller and RLS hides it from everyone else. This is an
--      internal single-business tool, so these tables use the same
--      "any authenticated staff member, full access" policy the
--      existing tables use. Making BulkTrack multi-tenant later is a
--      schema-wide change, not a finance-module one.
--
--   2. customers is not re-created. The existing table IS the party
--      table, so customer_id and vendor_id here are `text`, matching
--      its slug ids - and a vendor is just a party you buy from.
--
--   3. Finance rows get uuid primary keys defaulted server-side,
--      instead of the client-generated "SL-1042" style ids the older
--      tables use. Nothing here is referred to by a human-readable
--      reference, so there is no reason to make every insert mint one.

begin;

-- ---------------------------------------------------------------------
-- 0. Capture the price a sale was actually made at
-- ---------------------------------------------------------------------
-- Today a sale's value is computed live as products.price * qty, so
-- editing a product's price silently rewrites the value of every past
-- sale of it - last month's revenue changes because someone updated a
-- price list today. That is survivable while the numbers are only ever
-- shown on a screen; it is not survivable once those numbers are booked
-- into a ledger and reconciled against cash.
--
-- So: remember the price on the sale. Existing rows are backfilled from
-- the current price, which is the best guess available for them, and
-- everything below reads coalesce(sale.unit_price, product.price) so it
-- behaves correctly either way.
alter table sales add column if not exists unit_price numeric;

update sales s set unit_price = p.price
  from products p where p.id = s.product_id and s.unit_price is null;

-- The app should send unit_price on new sales (Sales.jsx / DataContext
-- addSale). Until it does, this fills it in so no sale is ever stored
-- without the price it was made at.
create or replace function sales_capture_unit_price() returns trigger as $$
begin
  if new.unit_price is null then
    select price into new.unit_price from products where id = new.product_id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_sales_capture_unit_price on sales;
create trigger trg_sales_capture_unit_price before insert on sales
  for each row execute function sales_capture_unit_price();

-- One definition of what a sale is worth, used by every trigger below.
create or replace function sale_value(p_sale_id text) returns numeric as $$
  select coalesce(s.unit_price, p.price) * s.qty
    from sales s join products p on p.id = s.product_id
   where s.id = p_sale_id;
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------
-- 1. Where the money sits
-- ---------------------------------------------------------------------
-- Cash in hand is bank_account_id = null, on every table that has that
-- column. Do not add a "Cash" account row - every balance calculation
-- buckets null as cash, and a real Cash row would be counted twice.
create table if not exists bank_accounts (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  bank_name           text,
  account_number      text,
  account_holder_name text,
  address             text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists bank_accounts_name_idx on bank_accounts (lower(name));

-- Moving your own money between your own accounts. Never touches sales,
-- purchases or any party ledger, and never changes the combined balance.
create table if not exists account_transfers (
  id              uuid primary key default gen_random_uuid(),
  from_account_id uuid references bank_accounts(id) on delete set null,
  to_account_id   uuid references bank_accounts(id) on delete set null,
  amount          numeric not null check (amount > 0),
  note            text,
  transfer_date   date not null default current_date,
  created_at      timestamptz not null default now(),
  constraint account_transfers_different_accounts
    check (from_account_id is distinct from to_account_id)
);

create index if not exists account_transfers_date_idx on account_transfers (transfer_date);

-- ---------------------------------------------------------------------
-- 2. Classification
-- ---------------------------------------------------------------------
create table if not exists expense_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists expense_categories_name_idx on expense_categories (lower(name));

-- Line-item names typed on a purchase or expense bill, remembered so the
-- next one can offer them. Separate from products on purpose: products is
-- what you sell, this is anything you might type on a bill.
create table if not exists finance_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  rate       numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists finance_items_name_idx on finance_items (lower(name));

-- ---------------------------------------------------------------------
-- 3. Bills and expenses
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                  where t.typname = 'business_transaction_type' and n.nspname = 'public') then
    create type business_transaction_type as enum ('sale', 'purchase', 'expense');
  end if;
end
$$;

-- A purchase bill (stock bought in), an expense, or a sale that did not
-- come through the sales table.
--
-- The rule everything depends on: a sale or purchase here does NOT move
-- money. It books a debt on the party's ledger, and the cash arrives
-- later as its own payment. An expense is the exception - paid on the
-- spot, so it is cash out the moment it is recorded.
create table if not exists business_transactions (
  id                  uuid primary key default gen_random_uuid(),
  type                business_transaction_type not null,
  -- The grand total billed: subtotal - discount + VAT.
  amount              numeric not null check (amount > 0),
  note                text,
  -- Free text as written on the bill; party_id is the real link, and
  -- this survives the party row being deleted.
  party_name          text,
  party_id            text references customers(id) on delete set null,
  bill_no             text,
  bill_date           date,
  party_address       text,
  vat_pan_no          text,
  -- [{description, qty, rate, amount}, ...]
  items               jsonb not null default '[]'::jsonb,
  discount_amount     numeric not null default 0,
  vat_amount          numeric not null default 0,
  expense_category_id uuid references expense_categories(id),
  payment_mode        text not null default 'cash'
                      check (payment_mode in ('cash', 'bank', 'credit')),
  bank_account_id     uuid references bank_accounts(id) on delete set null,
  source_type         text,
  source_id           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists business_transactions_type_idx on business_transactions (type, created_at);
create index if not exists business_transactions_party_idx on business_transactions (party_id, created_at);
-- Load-bearing: the conflict target every "post it once, keep it in step
-- afterwards" upsert below relies on.
create unique index if not exists business_transactions_source_idx
  on business_transactions (source_type, source_id)
  where source_type is not null and source_id is not null;

-- ---------------------------------------------------------------------
-- 4. The two ledgers
-- ---------------------------------------------------------------------
-- Two tables, opposite polarity, one party table. Netting them into a
-- single signed balance hides half the story when someone both buys from
-- you and supplies you, so they are kept apart.
--
--   customer_ledger_entries : debit = they owe you more (a sale)
--                             credit = they paid you (money in)
--   vendor_ledger_entries   : debit = you owe them more (a purchase)
--                             credit = you paid them (money out)
--
-- source = 'manual'  -> typed by a person; editable and deletable.
-- source = 'booking' -> written by a trigger from a sale, payment or
--                       bill. Edit the thing behind it and this follows.
create table if not exists customer_ledger_entries (
  id              uuid primary key default gen_random_uuid(),
  customer_id     text not null references customers(id) on delete cascade,
  entry_type      text not null check (entry_type in ('debit', 'credit')),
  amount          numeric not null check (amount > 0),
  note            text,
  source          text not null default 'manual' check (source in ('manual', 'booking')),
  source_type     text,
  source_id       text,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  -- The day the money moved, as entered. Falls back to created_at when
  -- null - read it everywhere as coalesce(entry_date, created_at::date).
  entry_date      date,
  receipt_no      text,
  created_at      timestamptz not null default now()
);

create index if not exists customer_ledger_entries_customer_idx
  on customer_ledger_entries (customer_id, created_at);
create unique index if not exists customer_ledger_entries_source_idx
  on customer_ledger_entries (source_type, source_id)
  where source_type is not null and source_id is not null;

create table if not exists vendor_ledger_entries (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       text not null references customers(id) on delete cascade,
  entry_type      text not null check (entry_type in ('debit', 'credit')),
  amount          numeric not null check (amount > 0),
  note            text,
  source          text not null default 'manual' check (source in ('manual', 'booking')),
  source_type     text,
  source_id       text,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  entry_date      date,
  receipt_no      text,
  created_at      timestamptz not null default now()
);

create index if not exists vendor_ledger_entries_vendor_idx
  on vendor_ledger_entries (vendor_id, created_at);
create unique index if not exists vendor_ledger_entries_source_idx
  on vendor_ledger_entries (source_type, source_id)
  where source_type is not null and source_id is not null;

-- ---------------------------------------------------------------------
-- 5. Statement import bookkeeping
-- ---------------------------------------------------------------------
-- One row per statement line already imported, keyed by the bank's own
-- reference. Re-importing the same export, or a later one whose dates
-- overlap, then skips what is already in. This is the whole duplicate
-- defence.
create table if not exists statement_imports (
  id             uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. Mirroring sales and payments into the ledger
-- ---------------------------------------------------------------------
-- A sale is a debt the moment it is placed; a payment settles part or
-- all of it. Together these two triggers make the customer ledger say
-- exactly what Customers.jsx already computes as `outstanding`, except
-- that it now lives in one place that expenses, bank accounts and the
-- day book can all read.
create or replace function post_sale_to_ledger() returns trigger as $$
declare
  value numeric;
begin
  if tg_op = 'DELETE' then
    delete from customer_ledger_entries
     where source_type = 'sale' and source_id = old.id;
    return old;
  end if;

  value := coalesce(new.unit_price, (select price from products where id = new.product_id)) * new.qty;

  if value is null or value <= 0 then
    delete from customer_ledger_entries
     where source_type = 'sale' and source_id = new.id;
    return new;
  end if;

  insert into customer_ledger_entries
    (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
  values
    (new.customer_id, 'debit', value, new.id, 'booking', 'sale', new.id, new.date)
  on conflict (source_type, source_id) where source_type is not null and source_id is not null
  do update set amount      = excluded.amount,
                customer_id = excluded.customer_id,
                entry_date  = excluded.entry_date;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function post_payment_to_ledger() returns trigger as $$
declare
  who text;
begin
  if tg_op = 'DELETE' then
    delete from customer_ledger_entries
     where source_type = 'payment' and source_id = old.id;
    return old;
  end if;

  select customer_id into who from sales where id = new.sale_id;
  if who is null or new.amount <= 0 then
    delete from customer_ledger_entries
     where source_type = 'payment' and source_id = new.id;
    return new;
  end if;

  insert into customer_ledger_entries
    (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
  values
    (who, 'credit', new.amount, new.method, 'booking', 'payment', new.id, new.date)
  on conflict (source_type, source_id) where source_type is not null and source_id is not null
  do update set amount      = excluded.amount,
                customer_id = excluded.customer_id,
                note        = excluded.note,
                entry_date  = excluded.entry_date;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- A purchase bill against a party books what you now owe them; an
-- expense books nothing here, because it is paid on the spot.
create or replace function post_bill_to_vendor_ledger() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from vendor_ledger_entries
     where source_type = 'business_transaction' and source_id = old.id::text;
    return old;
  end if;

  if new.type = 'purchase' and new.party_id is not null and new.amount > 0 then
    insert into vendor_ledger_entries
      (vendor_id, entry_type, amount, note, source, source_type, source_id, entry_date)
    values
      (new.party_id, 'debit', new.amount, new.note, 'booking',
       'business_transaction', new.id::text, new.bill_date)
    on conflict (source_type, source_id) where source_type is not null and source_id is not null
    do update set amount     = excluded.amount,
                  vendor_id  = excluded.vendor_id,
                  note       = excluded.note,
                  entry_date = excluded.entry_date;
  else
    delete from vendor_ledger_entries
     where source_type = 'business_transaction' and source_id = new.id::text;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- And the same for a sale typed directly as a bill rather than through
-- the sales table (a one-off, a cash customer with no order).
create or replace function post_bill_to_customer_ledger() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from customer_ledger_entries
     where source_type = 'business_transaction' and source_id = old.id::text;
    return old;
  end if;

  if new.type = 'sale' and new.party_id is not null and new.amount > 0 then
    insert into customer_ledger_entries
      (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
    values
      (new.party_id, 'debit', new.amount, new.note, 'booking',
       'business_transaction', new.id::text, new.bill_date)
    on conflict (source_type, source_id) where source_type is not null and source_id is not null
    do update set amount      = excluded.amount,
                  customer_id = excluded.customer_id,
                  note        = excluded.note,
                  entry_date  = excluded.entry_date;
  else
    delete from customer_ledger_entries
     where source_type = 'business_transaction' and source_id = new.id::text;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_post_sale_to_ledger on sales;
create trigger trg_post_sale_to_ledger
after insert or update or delete on sales
for each row execute function post_sale_to_ledger();

drop trigger if exists trg_post_payment_to_ledger on payments;
create trigger trg_post_payment_to_ledger
after insert or update or delete on payments
for each row execute function post_payment_to_ledger();

drop trigger if exists trg_post_bill_to_vendor_ledger on business_transactions;
create trigger trg_post_bill_to_vendor_ledger
after insert or update or delete on business_transactions
for each row execute function post_bill_to_vendor_ledger();

drop trigger if exists trg_post_bill_to_customer_ledger on business_transactions;
create trigger trg_post_bill_to_customer_ledger
after insert or update or delete on business_transactions
for each row execute function post_bill_to_customer_ledger();

do $$
declare
  t text;
begin
  foreach t in array array['bank_accounts', 'expense_categories', 'finance_items', 'business_transactions']
  loop
    execute format('drop trigger if exists %I on %I', 'trg_touch_' || t, t);
    execute format('create trigger %I before update on %I for each row execute function touch_updated_at()',
                   'trg_touch_' || t, t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------
-- 7. Backfill: put the sales and payments already recorded into the ledger
-- ---------------------------------------------------------------------
-- The triggers above only fire on new activity, so without this the
-- ledger would start empty and every existing customer would read as
-- settled.
insert into customer_ledger_entries
  (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
select s.customer_id, 'debit', coalesce(s.unit_price, p.price) * s.qty, s.id, 'booking', 'sale', s.id, s.date
  from sales s join products p on p.id = s.product_id
 where coalesce(s.unit_price, p.price) * s.qty > 0
on conflict (source_type, source_id) where source_type is not null and source_id is not null
do nothing;

insert into customer_ledger_entries
  (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
select s.customer_id, 'credit', pm.amount, pm.method, 'booking', 'payment', pm.id, pm.date
  from payments pm join sales s on s.id = pm.sale_id
 where pm.amount > 0
on conflict (source_type, source_id) where source_type is not null and source_id is not null
do nothing;

-- ---------------------------------------------------------------------
-- 8. Access
-- ---------------------------------------------------------------------
-- Same rule as every existing table: logged-in staff get full access,
-- anonymous gets nothing. The one exception is trigger-written ledger
-- rows, which nobody may hand-edit - the sale or payment behind them is
-- the source of truth, and the next trigger run would overwrite the
-- change anyway.
alter table bank_accounts           enable row level security;
alter table account_transfers       enable row level security;
alter table expense_categories      enable row level security;
alter table finance_items           enable row level security;
alter table business_transactions   enable row level security;
alter table customer_ledger_entries enable row level security;
alter table vendor_ledger_entries   enable row level security;
alter table statement_imports       enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['bank_accounts', 'account_transfers', 'expense_categories',
                           'finance_items', 'business_transactions', 'statement_imports']
  loop
    execute format('drop policy if exists "authenticated full access" on %I', t);
    execute format('create policy "authenticated full access" on %I for all to authenticated using (true) with check (true)', t);
  end loop;

  foreach t in array array['customer_ledger_entries', 'vendor_ledger_entries']
  loop
    execute format('drop policy if exists "authenticated read" on %I', t);
    execute format('create policy "authenticated read" on %I for select to authenticated using (true)', t);

    execute format('drop policy if exists "authenticated write manual" on %I', t);
    execute format($f$create policy "authenticated write manual" on %I for insert to authenticated with check (source = 'manual')$f$, t);

    execute format('drop policy if exists "authenticated update manual" on %I', t);
    execute format($f$create policy "authenticated update manual" on %I for update to authenticated using (source = 'manual') with check (source = 'manual')$f$, t);

    execute format('drop policy if exists "authenticated delete manual" on %I', t);
    execute format($f$create policy "authenticated delete manual" on %I for delete to authenticated using (source = 'manual')$f$, t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------
-- 9. Live updates, same as the existing tables
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table bank_accounts;
alter publication supabase_realtime add table account_transfers;
alter publication supabase_realtime add table expense_categories;
alter publication supabase_realtime add table finance_items;
alter publication supabase_realtime add table business_transactions;
alter publication supabase_realtime add table customer_ledger_entries;
alter publication supabase_realtime add table vendor_ledger_entries;

commit;
