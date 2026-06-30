create table if not exists public.cards (
  id            uuid        default gen_random_uuid() primary key,
  title         text        not null,
  creator       text        not null,
  type          text        not null default 'book',
  category      text        not null,
  hook          text        not null,
  hook_sub      text        not null,
  gist          text        not null,
  conversation_tip text,
  cover_url     text,
  isbn          text,
  year          integer,
  pages         integer,
  social_count  integer     not null default 0,
  created_at    timestamptz default now(),
  unique (title, creator)
);

alter table public.cards enable row level security;

create policy "cards_select" on public.cards for select using (true);
create policy "cards_insert" on public.cards for insert with check (true);
create policy "cards_update" on public.cards for update using (true) with check (true);
