do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'support-attachments', 'support-attachments', false, 10485760,
      array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf', 'text/plain']
    )
    on conflict (id) do nothing;
  end if;

  if to_regclass('storage.objects') is not null then
    drop policy if exists support_attachments_read on storage.objects;
    create policy support_attachments_read on storage.objects
      for select to authenticated using (
        bucket_id = 'support-attachments' and (
          public.is_admin()
          or auth.uid()::text = (storage.foldername(name))[1]
        )
      );

    drop policy if exists support_attachments_insert on storage.objects;
    create policy support_attachments_insert on storage.objects
      for insert to authenticated with check (
        bucket_id = 'support-attachments' and (
          public.is_admin()
          or auth.uid()::text = (storage.foldername(name))[1]
        )
      );

    drop policy if exists support_attachments_delete on storage.objects;
    create policy support_attachments_delete on storage.objects
      for delete to authenticated using (
        bucket_id = 'support-attachments' and (
          public.is_admin()
          or auth.uid()::text = (storage.foldername(name))[1]
        )
      );
  else
    raise notice 'Relation storage.objects does not exist, skipping storage policy creation';
  end if;
end $$;
