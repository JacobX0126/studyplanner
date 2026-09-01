-- 0007_recurring_tasks.sql — 매일 반복되는 태스크(= habit tracker의 기반 데이터)

create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  estimated_minutes int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 어떤 todo가 어떤 반복 태스크에서 자동으로 생성됐는지 추적.
-- 반복을 꺼도(active=false) 이미 생성된 지난 todo들은 그대로 남는다(on delete set null).
alter table public.todos add column recurring_task_id uuid references public.recurring_tasks(id) on delete set null;

alter table public.recurring_tasks enable row level security;
create policy "own rows only" on public.recurring_tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index idx_recurring_tasks_user_active on public.recurring_tasks(user_id, active);
create index idx_todos_recurring on public.todos(recurring_task_id);
