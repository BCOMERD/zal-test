-- Claude Design pages → team backend: restaurant owners see their bookings, customers cancel their own.
create or replace function public.zal_team_bookings(p_restaurant uuid)
returns setof public.zal_bookings language sql security definer set search_path = public stable as $$
  select b.* from zal_bookings b
  where b.restaurant_id = p_restaurant
    and exists (select 1 from zal_team_restaurants t where t.restaurant_id = p_restaurant and t.owner_id = auth.uid())
    and b.starts_at > now() - interval '1 day'
  order by b.starts_at limit 100;
$$;
revoke all on function public.zal_team_bookings(uuid) from public, anon;
grant execute on function public.zal_team_bookings(uuid) to authenticated;

create or replace function public.zal_cancel_booking(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update zal_bookings set status = 'cancelled'
   where id = p_id and customer_id = auth.uid() and status = 'confirmed' and starts_at > now();
  if not found then raise exception 'booking cannot be cancelled'; end if;
end $$;
revoke all on function public.zal_cancel_booking(uuid) from public, anon;
grant execute on function public.zal_cancel_booking(uuid) to authenticated;

-- Partner sign-up: the owner picks table booking / own delivery for their restaurant
create or replace function public.zal_team_set_services(p_restaurant uuid, p_booking boolean, p_delivery boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update restaurants set reservation_available = p_booking, delivery_available = p_delivery
   where id = p_restaurant and exists (select 1 from zal_team_restaurants t where t.restaurant_id = p_restaurant and t.owner_id = auth.uid());
  if not found then raise exception 'Restaurant access denied'; end if;
end $$;
revoke all on function public.zal_team_set_services(uuid, boolean, boolean) from public, anon;
grant execute on function public.zal_team_set_services(uuid, boolean, boolean) to authenticated;

-- 3% cashback to the customer on every completed order, paid by ZAL out of its 7% commission
alter table public.zal_wallet_entries drop constraint if exists zal_wallet_entries_party_check;
alter table public.zal_wallet_entries add constraint zal_wallet_entries_party_check check (party in ('restaurant','driver','platform','gateway','customer'));
alter table public.zal_wallet_entries drop constraint if exists zal_wallet_entries_event_check;
alter table public.zal_wallet_entries add constraint zal_wallet_entries_event_check check (event in ('payment','delivery','refund','cashback'));
create or replace function public.zal_cashback() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and old.status <> 'completed' and new.customer_id is not null and new.is_test then
    insert into zal_wallet_entries(order_id, user_id, party, event, amount) values
      (new.id, new.customer_id, 'customer', 'cashback', round(new.subtotal * 0.03, 2)),
      (new.id, null, 'platform', 'cashback', -round(new.subtotal * 0.03, 2))
    on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists zal_cashback on public.zal_orders;
create trigger zal_cashback after update of status on public.zal_orders for each row execute function public.zal_cashback();
