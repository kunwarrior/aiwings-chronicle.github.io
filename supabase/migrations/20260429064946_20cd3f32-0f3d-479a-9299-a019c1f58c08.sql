insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "Public read uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');

create policy "Public upload to uploads"
  on storage.objects for insert
  with check (bucket_id = 'uploads');

create policy "Public update uploads"
  on storage.objects for update
  using (bucket_id = 'uploads');

create policy "Public delete uploads"
  on storage.objects for delete
  using (bucket_id = 'uploads');