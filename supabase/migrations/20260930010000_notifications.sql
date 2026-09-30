-- Real-time notifications: a payment clearing (partial or full) and a
-- product crossing into low-stock territory both write a row here via
-- triggers, so they fire no matter which client made the underlying
-- change. The frontend subscribes to this table over Supabase Realtime.

create table notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('payment', 'low_stock')),
  message text not null,
  sale_id text references sales(id) on delete cascade,
  product_id text references products(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_created_at_idx on notifications(created_at desc);

alter table notifications enable row level security;
create policy "authenticated full access" on notifications
  for all to authenticated using (true) with check (true);

-- Fires whenever a payment is recorded OR edited (e.g. bumped from
-- partial to full via the Payments page), telling us whether this
-- payment brought the sale fully paid or just partially.
create or replace function notify_payment() returns trigger as $$
declare
  v_total numeric;
  v_paid numeric;
  v_customer text;
begin
  select p.price * s.qty into v_total from sales s join products p on p.id = s.product_id where s.id = NEW.sale_id;
  select coalesce(sum(amount), 0) into v_paid from payments where sale_id = NEW.sale_id;
  select c.name into v_customer from sales s join customers c on c.id = s.customer_id where s.id = NEW.sale_id;

  if v_paid >= v_total then
    insert into notifications (type, message, sale_id)
    values ('payment', coalesce(v_customer, 'A customer') || ' paid in full for ' || NEW.sale_id || ' (NPR ' || to_char(v_total, 'FM999,999,999') || ')', NEW.sale_id);
  else
    insert into notifications (type, message, sale_id)
    values ('payment', coalesce(v_customer, 'A customer') || ' made a partial payment for ' || NEW.sale_id || ' (NPR ' || to_char(v_paid, 'FM999,999,999') || ' of ' || to_char(v_total, 'FM999,999,999') || ')', NEW.sale_id);
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_notify_payment
  after insert or update on payments
  for each row execute function notify_payment();

-- Fires when a product's available stock crosses at-or-below its
-- reorder point (on insert if it starts there, on update only when it
-- newly crosses — so an already-low product doesn't spam a
-- notification on every subsequent small change).
create or replace function notify_low_stock() returns trigger as $$
declare
  v_new_available numeric := NEW.stock_total - NEW.stock_taken;
  v_was_low boolean := false;
begin
  if TG_OP = 'UPDATE' then
    v_was_low := (OLD.stock_total - OLD.stock_taken) <= OLD.reorder_at;
  end if;

  if v_new_available <= NEW.reorder_at and not v_was_low then
    insert into notifications (type, message, product_id)
    values (
      'low_stock',
      NEW.name || ' is running low — ' || greatest(v_new_available, 0) || ' unit' || case when v_new_available = 1 then '' else 's' end || ' left',
      NEW.id
    );
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger trg_notify_low_stock
  after insert or update on products
  for each row execute function notify_low_stock();

alter publication supabase_realtime add table notifications;
