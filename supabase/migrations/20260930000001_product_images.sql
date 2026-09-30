-- Adds a photo per product, stored in a public Storage bucket.
alter table products add column image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Images are shown to anyone viewing a product (public read), but only
-- authenticated wholesaler staff can upload/replace/remove them.
create policy "public read product images" on storage.objects
  for select to public using (bucket_id = 'product-images');

create policy "authenticated write product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images');

create policy "authenticated update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images');

create policy "authenticated delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images');
