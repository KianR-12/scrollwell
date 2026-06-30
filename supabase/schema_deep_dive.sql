create table if not exists public.deep_dive_cards (
  id               uuid        default gen_random_uuid() primary key,
  parent_title     text        not null,
  parent_creator   text        not null,
  chapter_number   integer     not null,
  chapter_title    text        not null,
  hook             text        not null,
  gist             text        not null,
  conversation_tip text        not null,
  parent_description text,
  created_at       timestamptz default now(),
  unique (parent_title, parent_creator, chapter_number)
);

alter table public.deep_dive_cards enable row level security;

create policy "deep_dive_select" on public.deep_dive_cards for select using (true);
create policy "deep_dive_insert" on public.deep_dive_cards for insert with check (true);
create policy "deep_dive_update" on public.deep_dive_cards for update using (true) with check (true);
