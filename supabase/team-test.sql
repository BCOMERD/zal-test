-- Additive team-test workflow. Existing restaurant directory and original orders are preserved.
begin;
alter table public.restaurants add column if not exists is_test boolean not null default false;
alter table public.zal_orders add column if not exists is_test boolean not null default false;
alter table public.zal_orders add column if not exists delivery_fee numeric(8,2) not null default 0;
alter table public.zal_orders add column if not exists tip numeric(8,2) not null default 0;
alter table public.zal_orders add column if not exists gateway_fee numeric(8,2) not null default 0;
alter table public.zal_orders add column if not exists driver_id uuid references auth.users(id);
alter table public.zal_orders add column if not exists delivery_status text not null default 'unassigned';
alter table public.zal_orders add column if not exists payment_status text not null default 'unpaid';
alter table public.zal_orders add column if not exists delivery_address text;
alter table public.zal_orders add column if not exists customer_note text;
alter table public.zal_orders add column if not exists updated_at timestamptz not null default now();
alter table public.zal_orders add column if not exists request_id uuid;
create unique index if not exists zal_orders_request_id on public.zal_orders(customer_id,request_id) where request_id is not null;
create table if not exists public.zal_team_restaurants (
 restaurant_id uuid primary key references public.restaurants(id),
 owner_id uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create index if not exists zal_team_restaurant_owner on public.zal_team_restaurants(owner_id);
create table if not exists public.zal_team_drivers (
 user_id uuid primary key references auth.users(id), display_name text not null,
 city text not null, vehicle text not null check(vehicle in ('bike','scooter','car','walk')),
 created_at timestamptz not null default now()
);
create table if not exists public.zal_wallet_entries (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.zal_orders(id), user_id uuid references auth.users(id),
 party text not null check(party in ('restaurant','driver','platform','gateway')),
 event text not null check(event in ('payment','delivery','refund')),
 amount numeric(10,2) not null, created_at timestamptz not null default now(),
 unique(order_id,party,event)
);
create table if not exists public.zal_order_events (
 id bigint generated always as identity primary key, order_id uuid not null references public.zal_orders(id),
 actor_id uuid references auth.users(id), event text not null, created_at timestamptz not null default now()
);
alter table public.zal_team_restaurants enable row level security;
alter table public.zal_team_drivers enable row level security;
alter table public.zal_wallet_entries enable row level security;
alter table public.zal_order_events enable row level security;
-- Policies are created only once; no existing directory policies are widened.
do $$ begin
 if not exists(select from pg_policies where schemaname='public' and policyname='zal team owner') then
  create policy "zal team owner" on public.zal_team_restaurants for select to authenticated using(owner_id=auth.uid());
  create policy "zal team driver" on public.zal_team_drivers for select to authenticated using(user_id=auth.uid());
  create policy "zal own ledger" on public.zal_wallet_entries for select to authenticated using(user_id=auth.uid());
 end if;
end $$;
grant select on public.zal_team_restaurants,public.zal_team_drivers,public.zal_wallet_entries to authenticated;

create or replace function public.zal_team_register_restaurant(p_name text,p_cuisine text,p_address text,p_delivery boolean default true)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Please sign in'; end if;
 if length(trim(coalesce(p_name,''))) not between 2 and 120 or length(trim(coalesce(p_address,''))) not between 3 and 500 or length(trim(coalesce(p_cuisine,''))) not between 2 and 120 then raise exception 'Enter a name, cuisine and address'; end if;
 if (select count(*) from zal_team_restaurants where owner_id=auth.uid()) >= 3 then raise exception 'Maximum 3 test restaurants per account'; end if;
 insert into restaurants(name,cuisine,address,delivery_available,pickup_available,delivery_fee,min_order,is_test,listed,dish_count)
 values(trim(p_name),trim(p_cuisine),trim(p_address),p_delivery,true,3,0,true,true,0) returning id into v_id;
 insert into zal_team_restaurants values(v_id,auth.uid(),now());
 return v_id;
end $$;
create or replace function public.zal_team_register_driver(p_name text,p_city text,p_vehicle text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Please sign in'; end if;
 if length(trim(coalesce(p_name,''))) not between 2 and 120 or length(trim(coalesce(p_city,''))) not between 2 and 120 or p_vehicle not in ('bike','scooter','car','walk') then raise exception 'Invalid driver details'; end if;
 insert into zal_team_drivers(user_id,display_name,city,vehicle) values(auth.uid(),trim(p_name),trim(p_city),p_vehicle)
 on conflict(user_id) do update set display_name=excluded.display_name,city=excluded.city,vehicle=excluded.vehicle;
end $$;
create or replace function public.zal_team_save_dish(p_restaurant_id uuid,p_name text,p_description text,p_price numeric,p_ingredients text[] default '{}')
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid;
begin
 if not exists(select from zal_team_restaurants where restaurant_id=p_restaurant_id and owner_id=auth.uid()) then raise exception 'Restaurant access denied'; end if;
 if length(trim(coalesce(p_name,''))) not between 2 and 160 or p_price is null or p_price <= 0 or p_price > 1000 or length(coalesce(p_description,''))>2000 or cardinality(p_ingredients)>30 then raise exception 'Invalid dish details'; end if;
 insert into menu_items(restaurant_id,name,description,price,ingredients,available)
 values(p_restaurant_id,trim(p_name),coalesce(p_description,''),round(p_price,2),p_ingredients,true) returning id into v_id;
 update restaurants set dish_count=(select count(*) from menu_items where restaurant_id=p_restaurant_id and available) where id=p_restaurant_id;
 return v_id;
end $$;
create or replace function public.zal_team_set_dish_available(p_dish_id uuid,p_available boolean)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update menu_items m set available=p_available where m.id=p_dish_id and exists(select from zal_team_restaurants r where r.restaurant_id=m.restaurant_id and r.owner_id=auth.uid());
 if not found then raise exception 'Dish access denied'; end if;
end $$;

create or replace function public.zal_team_place_order(p_restaurant_id uuid,p_items jsonb,p_fulfilment text,p_address text,p_note text,p_request_id uuid,p_tip numeric default 0)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_sub numeric; v_fee numeric; v_count int; v_available int; v_delivery boolean; v_pickup boolean; v_min numeric;
begin
 if auth.uid() is null then raise exception 'Please sign in before ordering'; end if;
 if p_request_id is null then raise exception 'Missing request identifier'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||p_request_id::text,0));
 select id into v_id from zal_orders where customer_id=auth.uid() and request_id=p_request_id;
 if v_id is not null then return v_id; end if;
 if p_fulfilment is null or p_fulfilment not in ('pickup','delivery') then raise exception 'Invalid fulfilment'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' then raise exception 'Invalid basket'; end if;
 v_count:=jsonb_array_length(p_items);
 if v_count not between 1 and 50 or p_tip is null or p_tip<0 or p_tip>100 then raise exception 'Invalid basket or tip'; end if;
 if exists(select from jsonb_array_elements(p_items) i where coalesce(i->>'qty','') !~ '^[0-9]{1,2}$' or (i->>'qty')::int not between 1 and 50) then raise exception 'Invalid quantity'; end if;
 if (select count(distinct i->>'menu_item_id') from jsonb_array_elements(p_items) i)<>v_count then raise exception 'Duplicate dishes'; end if;
 if p_fulfilment='delivery' and length(trim(coalesce(p_address,'')))<5 then raise exception 'Enter your delivery address'; end if;
 if length(coalesce(p_address,''))>500 or length(coalesce(p_note,''))>1000 then raise exception 'Address or note too long'; end if;
 select delivery_available,pickup_available,case when free_delivery then 0 else coalesce(delivery_fee,0) end,coalesce(min_order,0) into v_delivery,v_pickup,v_fee,v_min from restaurants where id=p_restaurant_id;
 if not found then raise exception 'Restaurant not found'; end if;
 if (p_fulfilment='delivery' and v_delivery is not true) or (p_fulfilment='pickup' and v_pickup is not true) then raise exception 'Service unavailable'; end if;
 select count(*),sum(m.price*(i->>'qty')::int) into v_available,v_sub from jsonb_array_elements(p_items) i join menu_items m on m.id=(i->>'menu_item_id')::uuid where m.restaurant_id=p_restaurant_id and m.available and m.price>0;
 if v_available<>v_count or v_sub is null then raise exception 'A dish is unavailable'; end if;
 if p_fulfilment='delivery' and v_sub<v_min then raise exception 'Basket below restaurant minimum'; end if;
 if p_fulfilment='pickup' then v_fee:=0; p_tip:=0; end if;
 insert into zal_orders(restaurant_id,customer_id,fulfilment,subtotal,commission,delivery_fee,tip,gateway_fee,is_test,request_id,delivery_address,customer_note)
 values(p_restaurant_id,auth.uid(),p_fulfilment,v_sub,round(v_sub*.07,2),greatest(0,v_fee),round(p_tip,2),least(.20,v_sub-round(v_sub*.07,2)),true,p_request_id,p_address,p_note) returning id into v_id;
 insert into zal_order_items(order_id,menu_item_id,qty,unit_price) select v_id,m.id,(i->>'qty')::int,m.price from jsonb_array_elements(p_items) i join menu_items m on m.id=(i->>'menu_item_id')::uuid;
 insert into zal_order_events(order_id,actor_id,event) values(v_id,auth.uid(),'created');
 return v_id;
end $$;

create or replace function public.zal_team_order_action(p_order_id uuid,p_action text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare o zal_orders%rowtype; v_owner uuid; v_customer boolean; v_restaurant boolean; v_driver boolean;
begin
 if auth.uid() is null then raise exception 'Please sign in'; end if;
 select * into o from zal_orders where id=p_order_id and is_test for update;
 if not found then raise exception 'Test order not found'; end if;
 select owner_id into v_owner from zal_team_restaurants where restaurant_id=o.restaurant_id;
 v_customer:=o.customer_id=auth.uid(); v_restaurant:=coalesce(v_owner=auth.uid(),false); v_driver:=coalesce(o.driver_id=auth.uid(),false);
 if p_action='pay' then
  if not v_customer then raise exception 'Order access denied'; end if;
  if o.payment_status='paid' then return; end if;
  if o.status<>'pending' or o.payment_status<>'unpaid' then raise exception 'Order cannot be paid'; end if;
  update zal_orders set payment_status='paid',updated_at=now() where id=o.id;
  insert into zal_wallet_entries(order_id,user_id,party,event,amount) values(o.id,v_owner,'restaurant','payment',o.subtotal-o.commission-o.gateway_fee),(o.id,null,'platform','payment',o.commission),(o.id,null,'gateway','payment',o.gateway_fee) on conflict do nothing;
 elsif p_action='accept' then
  if not v_restaurant or o.status<>'pending' or o.payment_status<>'paid' then raise exception 'Paid pending order required'; end if;
  update zal_orders set status='accepted',updated_at=now() where id=o.id;
 elsif p_action='ready' then
  if not v_restaurant or o.status<>'accepted' then raise exception 'Accepted restaurant order required'; end if;
  update zal_orders set status='ready',updated_at=now() where id=o.id;
 elsif p_action='claim' then
  if not exists(select from zal_team_drivers where user_id=auth.uid()) or o.fulfilment<>'delivery' or o.payment_status<>'paid' or o.status not in ('accepted','ready') or o.driver_id is not null then raise exception 'Delivery unavailable'; end if;
  update zal_orders set driver_id=auth.uid(),delivery_status='assigned',updated_at=now() where id=o.id;
 elsif p_action='pickup' then
  if not v_driver or o.status<>'ready' or o.delivery_status<>'assigned' then raise exception 'Ready assigned delivery required'; end if;
  update zal_orders set delivery_status='on_the_way',updated_at=now() where id=o.id;
 elsif p_action='complete' then
  if o.status='completed' and (v_restaurant or v_driver) then return; end if;
  if o.payment_status<>'paid' or o.status<>'ready' or not ((o.fulfilment='pickup' and v_restaurant) or (o.fulfilment='delivery' and v_driver and o.delivery_status='on_the_way')) then raise exception 'Order is not ready for completion'; end if;
  update zal_orders set status='completed',delivery_status=case when o.fulfilment='delivery' then 'delivered' else 'unassigned' end,updated_at=now() where id=o.id;
  if o.fulfilment='delivery' then insert into zal_wallet_entries(order_id,user_id,party,event,amount) values(o.id,o.driver_id,'driver','delivery',o.delivery_fee+o.tip) on conflict do nothing; end if;
 elsif p_action='cancel' then
  if o.status='cancelled' and (v_customer or v_restaurant) then return; end if;
  if not ((v_customer and o.status='pending') or (v_restaurant and o.status in ('pending','accepted','ready') and o.delivery_status<>'on_the_way')) then raise exception 'Order cannot be cancelled at this stage'; end if;
  update zal_orders set status='cancelled',payment_status=case when o.payment_status='paid' then 'refunded' else 'unpaid' end,updated_at=now() where id=o.id;
  if o.payment_status='paid' then insert into zal_wallet_entries(order_id,user_id,party,event,amount) select order_id,user_id,party,'refund',-amount from zal_wallet_entries where order_id=o.id and event='payment' on conflict do nothing; end if;
 else raise exception 'Unknown action'; end if;
 insert into zal_order_events(order_id,actor_id,event) values(o.id,auth.uid(),p_action);
end $$;

create or replace function public.zal_team_dashboard()
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare v_user uuid:=auth.uid(); v_result jsonb;
begin
 if v_user is null then raise exception 'Please sign in'; end if;
 select jsonb_build_object(
 'restaurants',coalesce((select jsonb_agg(to_jsonb(r)) from restaurants r join zal_team_restaurants m on m.restaurant_id=r.id where m.owner_id=v_user),'[]'::jsonb),
 'driver',(select to_jsonb(d) from zal_team_drivers d where user_id=v_user),
 'wallet',coalesce((select jsonb_agg(to_jsonb(w) order by w.created_at desc) from zal_wallet_entries w where user_id=v_user),'[]'::jsonb),
 'orders',coalesce((select jsonb_agg(to_jsonb(q) order by q.created_at desc) from (
 select o.*,r.name restaurant_name,r.address restaurant_address,
 coalesce((select jsonb_agg(jsonb_build_object('name',m.name,'qty',i.qty,'unit_price',i.unit_price)) from zal_order_items i join menu_items m on m.id=i.menu_item_id where i.order_id=o.id),'[]'::jsonb) items,
 coalesce((select jsonb_agg(jsonb_build_object('event',e.event,'created_at',e.created_at) order by e.id) from zal_order_events e where e.order_id=o.id),'[]'::jsonb) events
 from zal_orders o join restaurants r on r.id=o.restaurant_id where o.is_test and (o.customer_id=v_user or o.driver_id=v_user or exists(select from zal_team_restaurants t where t.restaurant_id=o.restaurant_id and t.owner_id=v_user)) order by o.created_at desc limit 100
 ) q),'[]'::jsonb),
 'available_deliveries',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'restaurant_name',r.name,'restaurant_address',r.address,'delivery_fee',o.delivery_fee,'tip',o.tip,'status',o.status)) from zal_orders o join restaurants r on r.id=o.restaurant_id where o.is_test and o.fulfilment='delivery' and o.driver_id is null and o.payment_status='paid' and o.status in ('accepted','ready') and exists(select from zal_team_drivers where user_id=v_user)),'[]'::jsonb)
 ) into v_result;
 return v_result;
end $$;
-- Authenticated callers receive only their own data; no public wallet summary.
do $$ declare f record; begin
 for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'zal_team_%' loop
 execute format('revoke all on function %s from public, anon',f.sig);
 execute format('grant execute on function %s to authenticated',f.sig);
 end loop;
end $$;
commit;
