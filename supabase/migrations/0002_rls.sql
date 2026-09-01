-- 0002_rls.sql — Row Level Security
-- 정책이 없는 테이블은 RLS가 켜지는 순간 기본적으로 모두 접근 불가가 된다.
-- 친구가 읽을 수 있는 테이블에는 애초에 민감한 컬럼(과목명·투두·시험명 등)이 없다.

-- security definer: friendships 자신의 RLS를 다시 타지 않아 정책 재귀를 피한다.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.friendships f where f.user_id = a and f.friend_id = b
  );
$$;

-- ============================================================
-- 본인 소유 전용 테이블 — 절대 타인에게 노출되지 않음
-- ============================================================

alter table public.subjects enable row level security;
alter table public.exams enable row level security;
alter table public.todos enable row level security;
alter table public.study_sessions enable row level security;
alter table public.questions enable row level security;
alter table public.question_reviews enable row level security;
alter table public.rest_passes enable row level security;
alter table public.user_settings enable row level security;

create policy "own rows only" on public.subjects
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows only" on public.exams
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows only" on public.todos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows only" on public.study_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows only" on public.questions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows only" on public.question_reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows only" on public.rest_passes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own rows only" on public.user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- profiles — 본인, 친구, 대기 중인 친구 요청 상대에게만 노출
-- ============================================================

alter table public.profiles enable row level security;

create policy "self or friend or pending request select" on public.profiles
  for select using (
    id = auth.uid()
    or public.are_friends(auth.uid(), id)
    or exists (
      select 1 from public.friend_requests r
      where r.status = 'pending'
        and ((r.requester_id = auth.uid() and r.addressee_id = id)
          or (r.addressee_id = auth.uid() and r.requester_id = id))
    )
  );

create policy "self update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ============================================================
-- 친구에게 공개되는 집계 테이블 — 숫자만
-- daily_stats / streaks 는 트리거(SECURITY DEFINER)만 쓸 수 있다 (쓰기 정책 없음).
-- ============================================================

alter table public.daily_stats enable row level security;
alter table public.streaks enable row level security;
alter table public.study_presence enable row level security;

create policy "self or friend select" on public.daily_stats
  for select using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
create policy "self or friend select" on public.streaks
  for select using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
create policy "self or friend select" on public.study_presence
  for select using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));

-- study_presence는 타이머 시작/종료 시 클라이언트가 직접 갱신한다 (과목 정보는 넣지 않음).
create policy "self insert" on public.study_presence
  for insert with check (user_id = auth.uid());
create policy "self update" on public.study_presence
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- 친구 관계 — 생성/수락은 RPC(SECURITY DEFINER) 전용이라 INSERT 정책이 없다.
-- ============================================================

alter table public.friendships enable row level security;
create policy "member select" on public.friendships
  for select using (user_id = auth.uid() or friend_id = auth.uid());
create policy "self delete" on public.friendships
  for delete using (user_id = auth.uid());

alter table public.friend_requests enable row level security;
create policy "party select" on public.friend_requests
  for select using (requester_id = auth.uid() or addressee_id = auth.uid());
