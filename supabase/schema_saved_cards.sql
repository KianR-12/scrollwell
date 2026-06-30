create table if not exists public.saved_cards (
  id         uuid        default gen_random_uuid() primary key,
  user_id    text        not null,
  card_id    uuid        not null references public.cards(id) on delete cascade,
  card_type  text        not null default 'regular',
  saved_at   timestamptz default now(),
  unique(user_id, card_id)
);

alter table public.saved_cards enable row level security;

create policy "saved_cards_select" on public.saved_cards for select using (true);
create policy "saved_cards_insert" on public.saved_cards for insert with check (true);
create policy "saved_cards_delete" on public.saved_cards for delete using (true);
