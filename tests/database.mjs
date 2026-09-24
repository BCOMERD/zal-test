import assert from "node:assert/strict";
import { db } from "./fixture-db.mjs";
const users = Array.from(
  { length: 5 },
  (_, i) => `00000000-0000-4000-8000-00000000000${i + 1}`,
);
for (const id of users)
  await db.query("insert into auth.users values($1)", [id]);
const [owner, customer, driver, intruder, driver2] = users;
async function as(id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id || "",
  ]);
  await db.exec("set role " + (id ? "authenticated" : "anon"));
}
async function value(sql, args = []) {
  return Object.values((await db.query(sql, args)).rows[0])[0];
}
async function deny(sql, args = []) {
  await assert.rejects(() => db.query(sql, args));
}
await as(owner);
const restaurant = await value(
  "select zal_team_register_restaurant('QA Restaurant','Belgian','QA test address',true)",
);
const dish = await value(
  "select zal_team_save_dish($1,'QA pasta','Test ingredients',10,array['tomato'])",
  [restaurant],
);
await as(intruder);
await deny("select zal_team_save_dish($1,'Hacked dish','',1,'{}')", [
  restaurant,
]);
await as(driver);
await db.query(
  "select zal_team_register_driver('QA Driver','Brussels','bike')",
);
await as(driver2);
await db.query(
  "select zal_team_register_driver('QA Driver 2','Brussels','bike')",
);
const items = JSON.stringify([{ menu_item_id: dish, qty: 2 }]);
const place = async (
  request = "10000000-0000-4000-8000-000000000001",
  fulfilment = "delivery",
) =>
  value("select zal_team_place_order($1,$2,$3,$4,$5,$6,$7)", [
    restaurant,
    items,
    fulfilment,
    "QA delivery address",
    "Test only",
    request,
    fulfilment === "delivery" ? 2 : 0,
  ]);
const action = (id, op) =>
  db.query("select zal_team_order_action($1,$2)", [id, op]);
const dashboard = () => value("select zal_team_dashboard()");
await as(null);
await deny("select zal_team_dashboard()");
await deny("select zal_team_register_restaurant('bad','bad','bad',true)");
await as(customer);
const order = await place();
assert.equal(await place(), order);
await deny("select zal_team_place_order($1,$2,$3,$4,$5,$6,$7)", [
  restaurant,
  JSON.stringify([{ menu_item_id: dish, qty: -3 }]),
  "delivery",
  "QA address",
  "",
  "10000000-0000-4000-8000-000000000099",
  0,
]);
await as(owner);
await assert.rejects(() => action(order, "accept")); // cannot accept unpaid
await as(intruder);
assert.equal((await dashboard()).orders.length, 0);
await assert.rejects(() => action(order, "pay"));
await assert.rejects(() => action(order, "accept"));
await as(customer);
await action(order, "pay");
await action(order, "pay");
await as(owner);
let state = await dashboard();
assert.equal(state.wallet.length, 1);
assert.equal(Number(state.wallet[0].amount), 18.4);
await action(order, "accept");
await action(order, "ready");
await as(driver);
state = await dashboard();
assert.equal(state.available_deliveries.length, 1);
assert.equal(state.available_deliveries[0].delivery_address, undefined);
await action(order, "claim");
await as(driver2);
await assert.rejects(() => action(order, "claim"));
await as(driver);
await assert.rejects(() => action(order, "complete"));
await action(order, "pickup");
await action(order, "complete");
await action(order, "complete");
state = await dashboard();
assert.equal(Number(state.wallet[0].amount), 5);
assert.equal(state.wallet.length, 1);
assert.equal(state.orders[0].status, "completed");
await assert.rejects(() => action(order, "cancel"));
await as(customer);
const refundOrder = await place("10000000-0000-4000-8000-000000000002");
await action(refundOrder, "pay");
await action(refundOrder, "cancel");
await action(refundOrder, "cancel");
state = await dashboard();
assert.equal(
  state.orders.find((x) => x.id === refundOrder).payment_status,
  "refunded",
);
await as(owner);
state = await dashboard();
assert.equal(
  state.wallet
    .filter((x) => x.order_id === refundOrder)
    .reduce((s, x) => s + Number(x.amount), 0),
  0,
);
await as(customer);
const pickup = await place("10000000-0000-4000-8000-000000000003", "pickup");
await action(pickup, "pay");
await as(owner);
await action(pickup, "accept");
await action(pickup, "ready");
await action(pickup, "complete");
await as(intruder);
assert.equal(
  (await db.query("select * from zal_wallet_entries")).rows.length,
  0,
);
await deny("select * from zal_order_events");
await deny(
  "insert into zal_team_restaurants(restaurant_id,owner_id) values($1,$2)",
  [restaurant, intruder],
);
await deny("select zal_ai_take_quota($1)", [intruder]);
await db.exec("reset role");
for (let i = 0; i < 12; i++)
  assert.equal(await value("select zal_ai_take_quota($1)", [customer]), true);
assert.equal(await value("select zal_ai_take_quota($1)", [customer]), false);
const sums = (
  await db.query(
    "select party,sum(amount)::numeric as amount from zal_wallet_entries where order_id=$1 group by party",
    [order],
  )
).rows;
assert.equal(
  sums.reduce((s, x) => s + Number(x.amount), 0),
  25,
);
console.log(
  "PASS: migration rerun; auth/ownership; quantities; server pricing; order idempotency; pay-before-accept; payment idempotency; exclusive driver claim; pickup/delivery lifecycle; completion idempotency; full refund reversal; private wallets; AI quota; payout conservation.",
);
await db.close();
