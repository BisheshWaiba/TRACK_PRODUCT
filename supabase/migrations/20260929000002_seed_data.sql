-- Seeds the same dataset the frontend previously used as in-memory mock
-- data, so switching the app over to Supabase looks identical on day one.

insert into products (id, name, category, price, bundle_size, items, stock_total, stock_taken, reorder_at) values
  ('grocery-a', 'Grocery Bundle A', 'Grocery', 8450, '4 items / bundle', array['Rice × 5','Oil × 3','Noodles × 10','Sugar × 2'], 200, 152, 40),
  ('stationery-b', 'Stationery Bundle B', 'Stationery', 4200, '3 items / bundle', array['Notebooks × 20','Pens × 50','Pencils × 30'], 150, 90, 30),
  ('hardware-c', 'Hardware Bundle C', 'Hardware', 6900, '3 items / bundle', array['Nails × 5kg','Rope × 10m','Tape × 15'], 100, 82, 20),
  ('dairy-d', 'Dairy Bundle D', 'Dairy', 11300, '3 items / bundle', array['Milk Powder × 10','Ghee × 5','Paneer × 8'], 120, 40, 25),
  ('cleaning-e', 'Cleaning Supplies Bundle E', 'Household', 5600, '3 items / bundle', array['Detergent × 12','Floor Cleaner × 6','Mop × 3'], 180, 130, 35),
  ('electronics-f', 'Electronics Accessories Bundle F', 'Electronics', 9750, '3 items / bundle', array['Cables × 20','Chargers × 15','Batteries × 30'], 90, 85, 15),
  ('winter-g', 'Winter Essentials Bundle G', 'Seasonal', 15200, '3 items / bundle', array['Blankets × 10','Heaters × 2','Socks × 20'], 60, 60, 10);

insert into customers (id, name, contact, phone, address, city, joined) values
  ('him-traders', 'Him Traders', 'Anita Sharma', '981-2345678', 'Bagar Road, Pokhara', 'Pokhara', '2026-01-14'),
  ('gorkha-mart', 'Gorkha Mart', 'Bikash Gurung', '984-1122334', 'New Road, Hetauda', 'Hetauda', '2026-02-02'),
  ('bagmati-traders', 'Bagmati Traders', 'Rita Maharjan', '980-7788990', 'Thapathali, Kathmandu', 'Kathmandu', '2025-11-20'),
  ('pokhara-retail', 'Pokhara Retail Co.', 'Sunil Adhikari', '986-5544332', 'Lakeside, Pokhara', 'Pokhara', '2026-03-05'),
  ('annapurna-store', 'Annapurna Store', 'Krishna Bhattarai', '982-3321445', 'Lakeside, Pokhara', 'Pokhara', '2026-04-18');

insert into sales (id, date, customer_id, product_id, qty, status) values
  ('SL-1042', '2026-09-24', 'him-traders', 'grocery-a', 2, 'In Transit'),
  ('SL-1041', '2026-09-23', 'gorkha-mart', 'hardware-c', 5, 'Packing'),
  ('SL-1040', '2026-09-22', 'bagmati-traders', 'dairy-d', 3, 'Order Placed'),
  ('SL-1038', '2026-09-20', 'annapurna-store', 'winter-g', 8, 'Order Placed'),
  ('SL-1035', '2026-09-18', 'pokhara-retail', 'grocery-a', 3, 'Delivered'),
  ('SL-1029', '2026-09-12', 'him-traders', 'hardware-c', 10, 'Delivered'),
  ('SL-1024', '2026-09-04', 'him-traders', 'stationery-b', 15, 'Delivered'),
  ('SL-1018', '2026-08-29', 'bagmati-traders', 'grocery-a', 2, 'Delivered'),
  ('SL-1010', '2026-08-20', 'gorkha-mart', 'cleaning-e', 10, 'Delivered'),
  ('SL-1002', '2026-08-05', 'pokhara-retail', 'stationery-b', 8, 'Delivered');

insert into payments (id, date, sale_id, amount, method) values
  ('PM-501', '2026-09-24', 'SL-1042', 16900, 'Cash on Delivery'),
  ('PM-500', '2026-09-23', 'SL-1041', 20000, 'Bank Transfer'),
  ('PM-495', '2026-09-18', 'SL-1035', 25350, 'Cash on Delivery'),
  ('PM-490', '2026-09-12', 'SL-1029', 69000, 'Bank Transfer'),
  ('PM-486', '2026-09-04', 'SL-1024', 63000, 'Bank Transfer'),
  ('PM-480', '2026-08-29', 'SL-1018', 16900, 'Cash on Delivery'),
  ('PM-475', '2026-08-21', 'SL-1010', 56000, 'Bank Transfer'),
  ('PM-470', '2026-08-05', 'SL-1002', 33600, 'Digital Wallet');

insert into stock_movements (id, date, product_id, type, qty, reference) values
  ('SM-220', '2026-09-29', 'grocery-a', 'in', 100, 'Supplier restock #RS-118'),
  ('SM-219', '2026-09-24', 'grocery-a', 'out', 2, 'Sale — SL-1042'),
  ('SM-218', '2026-09-23', 'hardware-c', 'out', 5, 'Sale — SL-1041'),
  ('SM-217', '2026-09-20', 'winter-g', 'out', 8, 'Sale — SL-1038'),
  ('SM-216', '2026-09-18', 'dairy-d', 'in', 40, 'Supplier restock #RS-112'),
  ('SM-215', '2026-09-12', 'hardware-c', 'out', 10, 'Sale — SL-1029'),
  ('SM-214', '2026-09-04', 'stationery-b', 'out', 15, 'Sale — SL-1024'),
  ('SM-213', '2026-08-29', 'grocery-a', 'out', 2, 'Sale — SL-1018');
