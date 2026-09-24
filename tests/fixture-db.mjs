import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";

export const db = new PGlite();
await db.exec(
  `create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth,public to authenticated,anon,service_role; grant execute on function auth.uid() to authenticated,anon; create table restaurants(id uuid primary key default gen_random_uuid(),name text not null,cuisine text,address text,delivery_available boolean,pickup_available boolean,delivery_fee numeric,free_delivery boolean default false,min_order numeric,listed boolean,dish_count int); create table menu_items(id uuid primary key default gen_random_uuid(),restaurant_id uuid references restaurants(id),name text,description text,price numeric,ingredients text[],available boolean); create table zal_orders(id uuid primary key default gen_random_uuid(),restaurant_id uuid references restaurants(id),customer_id uuid references auth.users(id),fulfilment text check(fulfilment in ('pickup','delivery','dine_in')),status text not null default 'pending' check(status in ('pending','accepted','ready','completed','cancelled')),subtotal numeric(10,2),commission numeric(10,2),created_at timestamptz default now()); create table zal_order_items(id bigint generated always as identity primary key,order_id uuid references zal_orders(id),menu_item_id uuid references menu_items(id),qty int check(qty between 1 and 50),unit_price numeric(8,2)); alter table zal_orders enable row level security; alter table zal_order_items enable row level security;`,
);
const migration = await readFile(
  new URL("../supabase/team-test.sql", import.meta.url),
  "utf8",
);
await db.exec(migration);
await db.exec(migration); // idempotent migration
await db.exec(
  await readFile(new URL("../supabase/ai-quota.sql", import.meta.url), "utf8"),
);
