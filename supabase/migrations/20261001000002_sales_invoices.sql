begin;

create table if not exists sales_invoices (
  id              text primary key,
  date            date not null default current_date,
  customer_id     text not null references customers(id) on delete restrict,
  subtotal        numeric not null check (subtotal >= 0),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  vat_amount      numeric not null default 0 check (vat_amount >= 0),
  total           numeric not null check (total >= 0),
  payment_status  text not null default 'Pending' check (payment_status in ('Paid', 'Partial', 'Pending')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table sales add column if not exists invoice_id text references sales_invoices(id) on delete cascade;
alter table payments add column if not exists invoice_id text references sales_invoices(id) on delete cascade;
alter table payments alter column sale_id drop not null;

create index if not exists sales_invoice_id_idx on sales(invoice_id);
create index if not exists payments_invoice_id_idx on payments(invoice_id);
create index if not exists sales_invoices_customer_id_idx on sales_invoices(customer_id);
create index if not exists sales_invoices_date_idx on sales_invoices(date desc);

-- Give every historical sale a stable one-line invoice without changing its
-- captured value. Existing payments keep sale_id and also gain the invoice link.
insert into sales_invoices (id, date, customer_id, subtotal, total, payment_status)
select 'INV-' || s.id, s.date, s.customer_id,
       coalesce(s.unit_price, p.price) * s.qty,
       coalesce(s.unit_price, p.price) * s.qty,
       case when coalesce(paid.amount, 0) <= 0 then 'Pending'
            when paid.amount < coalesce(s.unit_price, p.price) * s.qty then 'Partial'
            else 'Paid' end
  from sales s
  join products p on p.id = s.product_id
  left join (
    select sale_id, sum(amount) as amount from payments group by sale_id
  ) paid on paid.sale_id = s.id
 where s.invoice_id is null
on conflict (id) do nothing;

update sales
   set invoice_id = 'INV-' || id
 where invoice_id is null;

update payments pm
   set invoice_id = s.invoice_id
  from sales s
 where pm.sale_id = s.id and pm.invoice_id is null and s.invoice_id is not null;

-- Replace the finance module's line-level booking only for invoice lines.
-- A null invoice_id intentionally retains the original sale ledger behavior.
create or replace function post_sale_to_ledger() returns trigger as $$
declare
  value numeric;
begin
  if tg_op = 'DELETE' then
    delete from customer_ledger_entries where source_type = 'sale' and source_id = old.id;
    return old;
  end if;

  if new.invoice_id is not null then
    delete from customer_ledger_entries where source_type = 'sale' and source_id = new.id;
    return new;
  end if;

  value := coalesce(new.unit_price, (select price from products where id = new.product_id)) * new.qty;
  if value is null or value <= 0 then
    delete from customer_ledger_entries where source_type = 'sale' and source_id = new.id;
    return new;
  end if;

  insert into customer_ledger_entries
    (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
  values
    (new.customer_id, 'debit', value, new.id, 'booking', 'sale', new.id, new.date)
  on conflict (source_type, source_id) where source_type is not null and source_id is not null
  do update set amount = excluded.amount, customer_id = excluded.customer_id, entry_date = excluded.entry_date;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function post_invoice_to_ledger() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from customer_ledger_entries where source_type = 'invoice' and source_id = old.id;
    return old;
  end if;

  if new.total <= 0 then
    delete from customer_ledger_entries where source_type = 'invoice' and source_id = new.id;
    return new;
  end if;

  insert into customer_ledger_entries
    (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
  values
    (new.customer_id, 'debit', new.total, new.id, 'booking', 'invoice', new.id, new.date)
  on conflict (source_type, source_id) where source_type is not null and source_id is not null
  do update set amount = excluded.amount, customer_id = excluded.customer_id, entry_date = excluded.entry_date;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function post_payment_to_ledger() returns trigger as $$
declare
  who text;
begin
  if tg_op = 'DELETE' then
    delete from customer_ledger_entries where source_type = 'payment' and source_id = old.id;
    return old;
  end if;

  if new.invoice_id is not null then
    select customer_id into who from sales_invoices where id = new.invoice_id;
  else
    select customer_id into who from sales where id = new.sale_id;
  end if;

  if who is null or new.amount <= 0 then
    delete from customer_ledger_entries where source_type = 'payment' and source_id = new.id;
    return new;
  end if;

  insert into customer_ledger_entries
    (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
  values
    (who, 'credit', new.amount, new.method, 'booking', 'payment', new.id, new.date)
  on conflict (source_type, source_id) where source_type is not null and source_id is not null
  do update set amount = excluded.amount, customer_id = excluded.customer_id, note = excluded.note, entry_date = excluded.entry_date;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_post_invoice_to_ledger on sales_invoices;
create trigger trg_post_invoice_to_ledger
after insert or update or delete on sales_invoices
for each row execute function post_invoice_to_ledger();

drop trigger if exists trg_touch_sales_invoices on sales_invoices;
create trigger trg_touch_sales_invoices before update on sales_invoices
for each row execute function touch_updated_at();

-- Remove the line bookings produced while the old trigger was still active,
-- then create exactly one booking per invoice.
delete from customer_ledger_entries e
 where e.source_type = 'sale'
   and exists (select 1 from sales s where s.id = e.source_id and s.invoice_id is not null);

insert into customer_ledger_entries
  (customer_id, entry_type, amount, note, source, source_type, source_id, entry_date)
select customer_id, 'debit', total, id, 'booking', 'invoice', id, date
  from sales_invoices
 where total > 0
on conflict (source_type, source_id) where source_type is not null and source_id is not null
do update set amount = excluded.amount, customer_id = excluded.customer_id, entry_date = excluded.entry_date;

alter table sales_invoices enable row level security;
create policy "authenticated full access" on sales_invoices
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table sales_invoices;

commit;