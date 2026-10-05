-- FrameFinder: client selections + billing subscriptions
create table public.selections (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  client_name text,
  source text not null default 'whatsapp',
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id text not null,
  status text not null default 'created',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions(user_id);
alter table public.selections enable row level security;
alter table public.subscriptions enable row level security;
create policy "selections_owner_all" on public.selections for all
  using (exists (select 1 from public.events e where e.id = selections.event_id and e.owner_id = auth.uid()))
  with check (exists (select 1 from public.events e where e.id = selections.event_id and e.owner_id = auth.uid()));
create policy "subscriptions_owner_all" on public.subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
