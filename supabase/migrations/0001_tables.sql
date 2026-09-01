-- 0001_tables.sql — StudyPlanner 테이블 정의
-- 순서대로(0001 -> 0004) Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- 계정
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Student',
  friend_code text not null unique,
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  focus_minutes int not null default 25,
  break_minutes int not null default 5,
  long_break_minutes int not null default 15,
  sessions_until_long_break int not null default 4,
  streak_goal_minutes int not null default 25,
  rest_passes_per_week int not null default 1,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 과목 / 투두 / 시험
-- ============================================================

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#4f46e5',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  exam_date date not null,
  score numeric,
  retrospective text,
  retrospective_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  exam_id uuid references public.exams(id) on delete set null,
  title text not null,
  estimated_minutes int,
  due_date date,
  is_done boolean not null default false,
  completed_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 타이머 세션 — 모든 것의 원천
-- ============================================================

create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  todo_id uuid references public.todos(id) on delete set null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int not null default 0,
  distraction_count int not null default 0,
  study_date date not null,
  is_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 기출 문제 / 오답
-- ============================================================

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  exam_id uuid references public.exams(id) on delete set null,
  title text not null,
  source text,
  memo text,
  last_result text check (last_result in ('o', 'x', 'unsure')),
  interval_days int not null default 1,
  next_review_date date not null default current_date,
  review_count int not null default 0,
  created_at timestamptz not null default now()
);

create table public.question_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  result text not null check (result in ('o', 'x', 'unsure')),
  reviewed_at timestamptz not null default now()
);

create table public.rest_passes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  used_date date not null,
  week_start date not null,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ============================================================
-- 친구에게 공개되는 집계 — 숫자만, 과목/투두/시험 정보 없음
-- ============================================================

create table public.daily_stats (
  user_id uuid not null references auth.users(id) on delete cascade,
  study_date date not null,
  total_seconds int not null default 0,
  session_count int not null default 0,
  distraction_count int not null default 0,
  rest_pass_used boolean not null default false,
  primary key (user_id, study_date)
);

create table public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_study_date date,
  updated_at timestamptz not null default now()
);

create table public.study_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_studying boolean not null default false,
  session_started_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- 친구 관계
-- ============================================================

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create table public.friendships (
  user_id uuid not null references auth.users(id) on delete cascade,
  friend_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

-- ============================================================
-- 인덱스
-- ============================================================

create index idx_todos_user on public.todos(user_id);
create index idx_todos_exam on public.todos(exam_id);
create index idx_study_sessions_user_date on public.study_sessions(user_id, study_date);
create index idx_study_sessions_todo on public.study_sessions(todo_id);
create index idx_study_sessions_subject on public.study_sessions(subject_id);
create index idx_questions_user_review on public.questions(user_id, next_review_date);
create index idx_exams_user_date on public.exams(user_id, exam_date);
create index idx_friend_requests_addressee on public.friend_requests(addressee_id, status);

-- ============================================================
-- 뷰 (security_invoker: 뷰를 통해도 RLS가 그대로 적용됨)
-- ============================================================

create view public.v_todo_time
  with (security_invoker = true) as
  select todo_id, sum(duration_seconds)::int as actual_seconds
  from public.study_sessions
  where todo_id is not null
  group by todo_id;

create view public.v_subject_time
  with (security_invoker = true) as
  select subject_id, study_date, sum(duration_seconds)::int as seconds
  from public.study_sessions
  group by subject_id, study_date;
