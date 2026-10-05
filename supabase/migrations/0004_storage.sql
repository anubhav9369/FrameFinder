-- FrameFinder: private storage bucket for event photos.
-- Object path convention: {userId}/{eventId}/{folderId}/{filename}
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', false)
on conflict (id) do nothing;
create policy "event_photos_owner_all" on storage.objects for all
  using (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'event-photos' and (storage.foldername(name))[1] = auth.uid()::text);
