-- 0004_friend_rpc.sql — 친구 요청/수락/삭제/요약 RPC
-- friendships / friend_requests 는 INSERT 정책이 없으므로(0002 참고),
-- 아래 SECURITY DEFINER 함수를 통해서만 관계가 생성된다.

create or replace function public.send_friend_request(p_friend_code text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_target uuid;
begin
  select id into v_target from public.profiles where friend_code = upper(p_friend_code);

  if v_target is null then
    raise exception 'No user found with that friend code.';
  end if;

  if v_target = auth.uid() then
    raise exception 'You cannot send a friend request to yourself.';
  end if;

  if exists (
    select 1 from public.friendships where user_id = auth.uid() and friend_id = v_target
  ) then
    raise exception 'You are already friends.';
  end if;

  insert into public.friend_requests (requester_id, addressee_id)
  values (auth.uid(), v_target)
  on conflict (requester_id, addressee_id) do update
    set status = 'pending', responded_at = null, created_at = now()
  where friend_requests.status = 'rejected';
end;
$$;

create or replace function public.respond_friend_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_req record;
begin
  select * into v_req from public.friend_requests where id = p_request_id;

  if v_req is null or v_req.addressee_id <> auth.uid() then
    raise exception 'Request not found.';
  end if;

  update public.friend_requests
    set status = case when p_accept then 'accepted' else 'rejected' end,
        responded_at = now()
    where id = p_request_id;

  if p_accept then
    insert into public.friendships (user_id, friend_id)
      values (v_req.requester_id, v_req.addressee_id)
      on conflict do nothing;
    insert into public.friendships (user_id, friend_id)
      values (v_req.addressee_id, v_req.requester_id)
      on conflict do nothing;
  end if;
end;
$$;

create or replace function public.remove_friend(p_friend_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.friendships where user_id = auth.uid() and friend_id = p_friend_id;
  delete from public.friendships where user_id = p_friend_id and friend_id = auth.uid();
end;
$$;

-- security invoker: 호출자의 RLS로 재확인되며, 각 친구 행은
-- daily_stats/streaks/study_presence/profiles 의 "본인 또는 친구" 정책으로만 보인다.
create or replace function public.get_friends_summary()
returns table (
  friend_id uuid,
  display_name text,
  today_seconds int,
  week_seconds int,
  current_streak int,
  is_studying boolean
)
language sql security invoker stable set search_path = public as $$
  select
    p.id as friend_id,
    p.display_name,
    coalesce(ds_today.total_seconds, 0) as today_seconds,
    coalesce(week.week_seconds, 0) as week_seconds,
    coalesce(s.current_streak, 0) as current_streak,
    coalesce(sp.is_studying, false) as is_studying
  from public.friendships f
  join public.profiles p on p.id = f.friend_id
  left join public.daily_stats ds_today
    on ds_today.user_id = f.friend_id and ds_today.study_date = current_date
  left join public.streaks s on s.user_id = f.friend_id
  left join public.study_presence sp on sp.user_id = f.friend_id
  left join (
    select user_id, sum(total_seconds) as week_seconds
    from public.daily_stats
    where study_date >= public.week_start_of(current_date)
    group by user_id
  ) week on week.user_id = f.friend_id
  where f.user_id = auth.uid()
  order by week_seconds desc nulls last;
$$;
