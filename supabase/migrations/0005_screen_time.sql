-- 0005_screen_time.sql — 주간 스크린 타임 (수동 입력, 기본 비공개)

create table public.screen_time_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  minutes int not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.user_settings add column share_screen_time boolean not null default false;

alter table public.screen_time_entries enable row level security;

-- 본인은 항상 보이고, 친구는 "공유 켜짐"일 때만 보인다.
-- daily_stats/streaks와 같은 원칙: 꺼져 있으면 친구여도 행 자체가 안 돌아온다.
create policy "self or shared friend select" on public.screen_time_entries
  for select using (
    user_id = auth.uid()
    or (
      public.are_friends(auth.uid(), user_id)
      and exists (
        select 1 from public.user_settings s
        where s.user_id = screen_time_entries.user_id and s.share_screen_time = true
      )
    )
  );

create policy "self insert" on public.screen_time_entries
  for insert with check (user_id = auth.uid());
create policy "self update" on public.screen_time_entries
  for update using (user_id = auth.uid());
