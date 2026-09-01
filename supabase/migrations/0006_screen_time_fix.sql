-- 0006_screen_time_fix.sql — 스크린타임 공유가 항상 "미기록"으로 보이던 버그 수정
--
-- 원인: 0005의 screen_time_entries 정책이 user_settings.share_screen_time을
-- 직접 서브쿼리로 확인했는데, user_settings 자체의 RLS("본인 행만")가 그 서브쿼리에도
-- 적용돼서 친구의 설정 행은 애초에 읽을 수가 없었다 — 그래서 공유를 켜도 항상 안 보였다.
-- are_friends()처럼 SECURITY DEFINER 함수로 우회해야 한다.

create or replace function public.shares_screen_time(p_user_id uuid)
returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce(
    (select share_screen_time from public.user_settings where user_id = p_user_id),
    false
  );
$$;

drop policy if exists "self or shared friend select" on public.screen_time_entries;

create policy "self or shared friend select" on public.screen_time_entries
  for select using (
    user_id = auth.uid()
    or (public.are_friends(auth.uid(), user_id) and public.shares_screen_time(user_id))
  );
