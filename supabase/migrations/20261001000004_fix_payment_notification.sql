begin;

-- notify_payment() was written before sales_invoices/payments.invoice_id
-- existed. It unconditionally looks the payment up by sale_id:
--
--   select p.price * s.qty into v_total from sales s join products p
--     on p.id = s.product_id where s.id = NEW.sale_id;
--
-- A payment recorded against an invoice (the only way Sales.jsx creates
-- one now) has sale_id = null and invoice_id set instead. `id = null` is
-- never true, so every lookup here returns zero rows, v_total stays
-- null, and `0 >= null` is null, not true or false - so Postgres takes
-- the "partial" branch and builds a message by concatenating v_total
-- (null) into the string. Concatenating anything with null yields null,
-- so `message` arrives null and the insert fails message's not-null
-- constraint - which fails the payment insert itself, inside whatever
-- transaction created it. In practice: recording a sale as Paid or
-- Partial (the normal case) has been erroring since invoices shipped;
-- only Pending sales, which never call createPayment, have worked.
--
-- Also folds in the same historical-price fix calculations.js already
-- has for the legacy sale_id path: coalesce(s.unit_price, p.price), not
-- p.price - a sale's own notification should use what it actually sold
-- for, not today's price list.
alter table notifications add column if not exists invoice_id text references sales_invoices(id) on delete cascade;

create or replace function notify_payment() returns trigger as $$
declare
  v_total numeric;
  v_paid numeric;
  v_customer text;
  v_ref text;
begin
  if NEW.invoice_id is not null then
    v_ref := NEW.invoice_id;
    select i.total into v_total from sales_invoices i where i.id = NEW.invoice_id;
    select c.name into v_customer from sales_invoices i join customers c on c.id = i.customer_id where i.id = NEW.invoice_id;
    select coalesce(sum(amount), 0) into v_paid from payments where invoice_id = NEW.invoice_id;
  else
    v_ref := NEW.sale_id;
    select coalesce(s.unit_price, p.price) * s.qty into v_total from sales s join products p on p.id = s.product_id where s.id = NEW.sale_id;
    select c.name into v_customer from sales s join customers c on c.id = s.customer_id where s.id = NEW.sale_id;
    select coalesce(sum(amount), 0) into v_paid from payments where sale_id = NEW.sale_id;
  end if;

  -- The sale/invoice this payment pointed at doesn't exist (or either id
  -- was left null) - nothing sensible to report, so skip the
  -- notification instead of inserting a broken one.
  if v_total is null then
    return NEW;
  end if;

  if v_paid >= v_total then
    insert into notifications (type, message, sale_id, invoice_id)
    values ('payment', coalesce(v_customer, 'A customer') || ' paid in full for ' || v_ref || ' (NPR ' || to_char(v_total, 'FM999,999,999') || ')', NEW.sale_id, NEW.invoice_id);
  else
    insert into notifications (type, message, sale_id, invoice_id)
    values ('payment', coalesce(v_customer, 'A customer') || ' made a partial payment for ' || v_ref || ' (NPR ' || to_char(v_paid, 'FM999,999,999') || ' of ' || to_char(v_total, 'FM999,999,999') || ')', NEW.sale_id, NEW.invoice_id);
  end if;
  return NEW;
end;
$$ language plpgsql;

commit;
