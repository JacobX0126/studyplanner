-- 0008_daily_notes.sql — 하루 회고 한 칸 (날짜당 하나)

create table public.daily_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, note_date)
);

alter table public.daily_notes enable row level security;
create policy "own rows only" on public.daily_notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
