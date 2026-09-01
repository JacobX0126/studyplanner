-- 0003_triggers.sql — 회원가입 / 일별 집계 / 스트릭 / 간격 반복 자동화

-- ============================================================
-- 회원가입 시 profile / settings / streak / presence 행 자동 생성
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.profiles where friend_code = v_code);
  end loop;

  insert into public.profiles (id, display_name, friend_code)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Student'),
    v_code
  );

  insert into public.user_settings (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  insert into public.study_presence (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ISO 주 월요일 계산 (rest_passes.week_start / 랭킹 집계에 사용)
-- ============================================================

create or replace function public.week_start_of(d date)
returns date language sql immutable as $$
  select d - (extract(isodow from d)::int - 1);
$$;

-- ============================================================
-- study_sessions -> daily_stats 동기화
-- ============================================================

create or replace function public.sync_daily_stats_for(p_user_id uuid, p_date date)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_count int;
  v_distractions int;
begin
  select coalesce(sum(duration_seconds), 0), count(*), coalesce(sum(distraction_count), 0)
    into v_total, v_count, v_distractions
    from public.study_sessions
    where user_id = p_user_id and study_date = p_date;

  if v_total = 0 and v_count = 0 then
    delete from public.daily_stats where user_id = p_user_id and study_date = p_date;
  else
    insert into public.daily_stats (user_id, study_date, total_seconds, session_count, distraction_count)
    values (p_user_id, p_date, v_total, v_count, v_distractions)
    on conflict (user_id, study_date) do update
      set total_seconds = excluded.total_seconds,
          session_count = excluded.session_count,
          distraction_count = excluded.distraction_count;
  end if;

  perform public.recalculate_streak(p_user_id);
end;
$$;

create or replace function public.handle_study_session_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_daily_stats_for(old.user_id, old.study_date);
    return old;
  end if;

  perform public.sync_daily_stats_for(new.user_id, new.study_date);
  if tg_op = 'UPDATE' and old.study_date <> new.study_date then
    perform public.sync_daily_stats_for(old.user_id, old.study_date);
  end if;
  return new;
end;
$$;

create trigger trg_study_sessions_stats
  after insert or update or delete on public.study_sessions
  for each row execute function public.handle_study_session_change();

-- ============================================================
-- 스트릭 재계산
-- 오늘부터 거꾸로 훑으며: 목표 시간(기본 25분) 달성한 날은 카운트,
-- 미달인 날은 그 주의 휴식권(주 1회)이 남아있으면 자동으로 소모해 카운트,
-- 둘 다 아니면 그 지점에서 멈춘다.
-- 휴식권은 "사용자가 실제로 공부를 시작한 날짜(첫 daily_stats 기록)" 이전으로는
-- 소급 적용하지 않는다 — 그렇지 않으면 한 번도 공부하지 않은 계정도
-- 매주 휴식권을 자동 소모하며 무한히 과거로 스트릭이 쌓이는 버그가 생긴다.
-- ============================================================

create or replace function public.recalculate_streak(p_user_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_goal_seconds int;
  v_passes_per_week int;
  v_first_study date;
  v_cursor date;
  v_current int := 0;
  v_longest int;
  v_seconds int;
  v_week date;
  v_passes_used_this_week int;
  v_iterations int := 0;
begin
  select streak_goal_minutes * 60, rest_passes_per_week
    into v_goal_seconds, v_passes_per_week
    from public.user_settings where user_id = p_user_id;

  if v_goal_seconds is null then
    v_goal_seconds := 25 * 60;
    v_passes_per_week := 1;
  end if;

  select longest_streak into v_longest from public.streaks where user_id = p_user_id;
  v_longest := coalesce(v_longest, 0);

  select min(study_date) into v_first_study
    from public.daily_stats where user_id = p_user_id and total_seconds > 0;

  if v_first_study is null then
    -- 한 번도 공부 기록이 없으면 스트릭은 0
    insert into public.streaks (user_id, current_streak, longest_streak, last_study_date, updated_at)
    values (p_user_id, 0, v_longest, null, now())
    on conflict (user_id) do update
      set current_streak = 0, updated_at = now();
    return;
  end if;

  -- 오늘은 아직 진행 중인 날이므로: 이미 목표를 달성했다면 카운트에 포함하되,
  -- 미달이라고 해서 스트릭을 끊거나 휴식권을 쓰지는 않는다.
  select coalesce(total_seconds, 0) into v_seconds
    from public.daily_stats where user_id = p_user_id and study_date = current_date;

  if coalesce(v_seconds, 0) >= v_goal_seconds then
    v_current := v_current + 1;
    v_cursor := current_date - 1;
  else
    v_cursor := current_date - 1;
  end if;

  while v_cursor >= v_first_study and v_iterations < 3650 loop
    v_iterations := v_iterations + 1;

    select coalesce(total_seconds, 0) into v_seconds
      from public.daily_stats where user_id = p_user_id and study_date = v_cursor;

    if coalesce(v_seconds, 0) >= v_goal_seconds then
      v_current := v_current + 1;
      v_cursor := v_cursor - 1;
      continue;
    end if;

    v_week := public.week_start_of(v_cursor);
    select count(*) into v_passes_used_this_week
      from public.rest_passes where user_id = p_user_id and week_start = v_week;

    if v_passes_used_this_week < v_passes_per_week then
      insert into public.rest_passes (user_id, used_date, week_start)
      values (p_user_id, v_cursor, v_week)
      on conflict (user_id, week_start) do nothing;

      insert into public.daily_stats (user_id, study_date, total_seconds, session_count, distraction_count, rest_pass_used)
      values (p_user_id, v_cursor, 0, 0, 0, true)
      on conflict (user_id, study_date) do update set rest_pass_used = true;

      v_current := v_current + 1;
      v_cursor := v_cursor - 1;
    else
      exit;
    end if;
  end loop;

  v_longest := greatest(v_longest, v_current);

  insert into public.streaks (user_id, current_streak, longest_streak, last_study_date, updated_at)
  values (
    p_user_id,
    v_current,
    v_longest,
    (select max(study_date) from public.daily_stats where user_id = p_user_id and total_seconds >= v_goal_seconds),
    now()
  )
  on conflict (user_id) do update
    set current_streak = excluded.current_streak,
        longest_streak = excluded.longest_streak,
        last_study_date = excluded.last_study_date,
        updated_at = now();
end;
$$;

-- ============================================================
-- 기출 문제 간격 반복
-- 틀리면/헷갈리면 1일 뒤, 맞히면 1->3->7->14일로 늘어남. 다시 틀리면 1일로 리셋.
-- ============================================================

create or replace function public.apply_question_review()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_prev_interval int;
  v_next_interval int;
begin
  if new.result in ('x', 'unsure') then
    v_next_interval := 1;
  else
    select interval_days into v_prev_interval from public.questions where id = new.question_id;
    v_next_interval := case coalesce(v_prev_interval, 1)
      when 1 then 3
      when 3 then 7
      else 14
    end;
  end if;

  update public.questions
    set last_result = new.result,
        interval_days = v_next_interval,
        next_review_date = current_date + v_next_interval,
        review_count = review_count + 1
    where id = new.question_id;

  return new;
end;
$$;

create trigger trg_question_review
  after insert on public.question_reviews
  for each row execute function public.apply_question_review();
