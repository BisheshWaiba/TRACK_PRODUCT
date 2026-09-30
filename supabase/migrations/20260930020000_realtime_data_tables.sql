-- Extends realtime (already enabled for notifications) to the core data
-- tables, so every open session sees another session's changes live
-- instead of only finding out via a notification and needing a reload.
alter publication supabase_realtime add table products;
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table sales;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table stock_movements;
