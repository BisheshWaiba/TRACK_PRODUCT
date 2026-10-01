begin;

create table if not exists suppliers (
  id text primary key, name text not null, contact text, phone text, address text,
  city text, joined date, created_at timestamptz not null default now()
);
alter table suppliers enable row level security;
drop policy if exists "authenticated full access" on suppliers;
create policy "authenticated full access" on suppliers for all to authenticated using (true) with check (true);

alter table business_transactions add column if not exists supplier_id text references suppliers(id) on delete set null;
alter table vendor_ledger_entries add column if not exists supplier_id text references suppliers(id) on delete set null;
alter table vendor_ledger_entries alter column vendor_id drop not null;
create index if not exists business_transactions_supplier_idx on business_transactions (supplier_id, created_at);
create index if not exists vendor_ledger_entries_supplier_idx on vendor_ledger_entries (supplier_id, created_at);

insert into suppliers (id, name, contact, phone, address, city, joined, created_at)
select 'supplier-' || md5(c.id), c.name, c.contact, c.phone, c.address, c.city, c.joined, coalesce(c.joined::timestamptz, now())
  from customers c
 where c.id in (
   select party_id from business_transactions where type = 'purchase' and party_id is not null
   union
   select vendor_id from vendor_ledger_entries where vendor_id is not null
 )
on conflict (id) do nothing;

update business_transactions set supplier_id = 'supplier-' || md5(party_id)
 where type = 'purchase' and party_id is not null and supplier_id is null;
update vendor_ledger_entries set supplier_id = 'supplier-' || md5(vendor_id)
 where vendor_id is not null and supplier_id is null;

create or replace function post_bill_to_vendor_ledger() returns trigger as $$
begin
  if tg_op = 'DELETE' then
    delete from vendor_ledger_entries where source_type = 'business_transaction' and source_id = old.id::text;
    return old;
  end if;
  if new.type = 'purchase' and (new.supplier_id is not null or new.party_id is not null) and new.amount > 0 then
    insert into vendor_ledger_entries
      (vendor_id, supplier_id, entry_type, amount, note, source, source_type, source_id, entry_date)
    values (new.party_id, new.supplier_id, 'debit', new.amount, new.note, 'booking', 'business_transaction', new.id::text, new.bill_date)
    on conflict (source_type, source_id) where source_type is not null and source_id is not null
    do update set amount = excluded.amount, vendor_id = excluded.vendor_id, supplier_id = excluded.supplier_id,
                  note = excluded.note, entry_date = excluded.entry_date;
  else
    delete from vendor_ledger_entries where source_type = 'business_transaction' and source_id = new.id::text;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

alter publication supabase_realtime add table suppliers;
commit;