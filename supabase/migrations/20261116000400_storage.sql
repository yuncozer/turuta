-- FISS 2027 · Almacenamiento de imágenes (logos, banners)
-- Bucket público de lectura; solo el administrador sube, reemplaza o borra.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy media_public_read on storage.objects for select
  using (bucket_id = 'media');

create policy media_admin_insert on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

create policy media_admin_update on storage.objects for update
  using (bucket_id = 'media' and public.is_admin());

create policy media_admin_delete on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
