create table if not exists public.profiles (
  id             uuid        not null primary key references auth.users(id) on delete cascade,
  email          text        not null,
  name           text,
  created_at     timestamptz default now(),
  streak_count   integer     not null default 0,
  last_opened_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
