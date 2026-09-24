begin;
create table if not exists public.zal_ai_usage (
 user_id uuid not null references auth.users(id), bucket timestamptz not null,
 requests integer not null default 0, primary key(user_id,bucket)
);
alter table public.zal_ai_usage enable row level security;
revoke all on public.zal_ai_usage from anon,authenticated;
create or replace function public.zal_ai_take_quota(p_user_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare n int; d int; b timestamptz:=date_trunc('minute',now());
begin
 if p_user_id is null then return false; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,1));
 select coalesce(sum(requests),0) into d from zal_ai_usage where user_id=p_user_id and bucket>=date_trunc('day',now());
 if d>=200 then return false; end if;
 insert into zal_ai_usage(user_id,bucket,requests) values(p_user_id,b,1)
 on conflict(user_id,bucket) do update set requests=zal_ai_usage.requests+1
 where zal_ai_usage.requests<12 returning requests into n;
 delete from zal_ai_usage where user_id=p_user_id and bucket<now()-interval '2 days';
 return n is not null;
end $$;
revoke all on function public.zal_ai_take_quota(uuid) from public,anon,authenticated;
grant execute on function public.zal_ai_take_quota(uuid) to service_role;
commit;
