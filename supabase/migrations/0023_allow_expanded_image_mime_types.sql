do $$
begin
  if to_regclass('storage.buckets') is not null then
    update storage.buckets
    set allowed_mime_types = array[
      'image/jpeg',
      'image/jpg',
      'image/pjpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/avif',
      'image/gif'
    ]
    where id = 'pet-media';
  end if;
end $$;
