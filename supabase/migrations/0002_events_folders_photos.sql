-- FrameFinder: events, ceremony folders, photos
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  location text,
  event_date date,
  photographer_whatsapp text,
  price_per_photo numeric(10,2),
  event_price numeric(10,2),
  watermark_text text,
  created_at timestamptz not null default now()
);
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  file_size int,
  width int,
  height int,
  faces_count int not null default 0,
  starred boolean not null default false,
  price numeric(10,2),
  created_at timestamptz not null default now()
);
create index photos_event_idx on public.photos(event_id);
create index photos_folder_idx on public.photos(folder_id);
alter table public.events enable row level security;
alter table public.folders enable row level security;
alter table public.photos enable row level security;
create policy "events_owner_all" on public.events for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "folders_owner_all" on public.folders for all
  using (exists (select 1 from public.events e where e.id = folders.event_id and e.owner_id = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = folders.event_id and e.owner_id = auth.uid()));
create policy "photos_owner_all" on public.photos for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
