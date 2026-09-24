import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { db } from "./fixture-db.mjs";
const root = resolve(new URL("..", import.meta.url).pathname);
// Additional directory columns used by the existing design's read layer.
await db.exec(
  `alter table restaurants add column created_at timestamptz default now();alter table restaurants add column opening_hours jsonb;alter table restaurants add column rating_value numeric;alter table restaurants add column rating_count int;alter table restaurants add column latitude numeric;alter table restaurants add column longitude numeric; create view restaurant_cards as select r.*, (select min(price) from menu_items m where m.restaurant_id=r.id and available) min_dish_price from restaurants r;`,
);
const ids = {
  owner: "00000000-0000-4000-8000-000000000001",
  customer: "00000000-0000-4000-8000-000000000002",
  driver: "00000000-0000-4000-8000-000000000003",
};
for (const id of Object.values(ids))
  await db.query("insert into auth.users values($1)", [id]);
const server = createServer(async (req, res) => {
  try {
    const p = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!p.startsWith(root + "/")) throw Error("bad path");
    const data = await readFile(
      (await stat(p)).isDirectory() ? p + "/index.html" : p,
    );
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".svg": "image/svg+xml",
      }[extname(p)] || "application/octet-stream",
    );
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : {}),
});
let tail = Promise.resolve();
const calls = [];
async function api({ kind, name, args, user, filters = [] }) {
  const run = tail.then(async () => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      user?.id || "",
    ]);
    if (kind === "rpc") {
      await db.exec("set role " + (user ? "authenticated" : "anon"));
      calls.push({ name, args });
      const keys = Object.keys(args);
      const result = await db.query(
        `select ${name}(${keys.map((k, i) => k + "=> $" + (i + 1)).join(",")}) as value`,
        Object.values(args).map((x) =>
          Array.isArray(x) && name === "zal_team_place_order"
            ? JSON.stringify(x)
            : x,
        ),
      );
      return { data: result.rows[0].value, error: null };
    }
    if (kind === "select") {
      if (!["restaurants", "menu_items", "restaurant_cards"].includes(name))
        throw Error("unknown table");
      let sql = "select * from " + name;
      const clauses = [],
        vals = [];
      for (const f of filters) {
        if (f.op === "eq") {
          vals.push(f.value);
          clauses.push(f.column + "=$" + vals.length);
        }
        if (f.op === "ilike") {
          vals.push(f.value);
          clauses.push(f.column + " ilike $" + vals.length);
        }
      }
      if (clauses.length) sql += " where " + clauses.join(" and ");
      const r = await db.query(sql, vals);
      return { data: r.rows, count: r.rows.length, error: null };
    }
    throw Error("unsupported");
  });
  tail = run.catch(() => {});
  try {
    return await run;
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}
const mock = `(() => {
 const ids=${JSON.stringify(ids)};let current=JSON.parse(localStorage.getItem('qa-user')||'null'),listeners=[];
 const emit=event=>listeners.forEach(f=>f(event,current?{user:current}:null));
 window.supabase={createClient:()=>({auth:{onAuthStateChange:f=>{listeners.push(f);return {data:{subscription:{unsubscribe(){}}}}},getSession:async()=>({data:{session:current?{user:current}:null},error:null}),signUp:async()=>({data:{user:{id:'new'},session:null},error:null}),signInWithPassword:async({email,password})=>{if(password!=='testing123')return {data:{},error:{message:'Invalid login credentials'}};const role=email.split('@')[0];current={id:ids[role],email};localStorage.setItem('qa-user',JSON.stringify(current));emit('SIGNED_IN');return {data:{user:current,session:{user:current}},error:null}},signOut:async()=>{current=null;localStorage.removeItem('qa-user');emit('SIGNED_OUT');return {error:null}},resetPasswordForEmail:async()=>({error:null}),resend:async()=>({error:null}),updateUser:async()=>({error:null})},rpc:(name,args)=>window.qaApi({kind:'rpc',name,args,user:current}),functions:{invoke:async()=>({data:null,error:{message:'Unavailable',context:{json:async()=>({error:'AI is not configured in this test'})}}})},from:(name)=>{const filters=[];const q={select:()=>q,eq:(column,value)=>{filters.push({op:'eq',column,value});return q},ilike:(column,value)=>{filters.push({op:'ilike',column,value});return q},order:()=>q,limit:()=>q,range:()=>q,not:()=>q,contains:()=>q,or:()=>q,gte:()=>q,lte:()=>q,maybeSingle:async()=>{const r=await window.qaApi({kind:'select',name,filters,user:current});return {...r,data:r.data?.[0]||null}},then:(resolve,reject)=>window.qaApi({kind:'select',name,filters,user:current}).then(resolve,reject)};return q}})};
})();`;
// Separate browser contexts ensure test-role sessions cannot leak into one another.
async function pageFor(role, viewport = { width: 1280, height: 900 }) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.exposeFunction("qaApi", api);
  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.includes("@supabase/supabase-js"))
      return route.fulfill({
        contentType: "application/javascript",
        body: mock,
      });
    if (url.startsWith("http://127.0.0.1:")) return route.continue();
    if (url.includes("unpkg.com/react-dom@"))
      return route.fulfill({
        contentType: "application/javascript",
        body: await readFile(
          new URL(
            "../node_modules/react-dom/umd/react-dom.production.min.js",
            import.meta.url,
          ),
        ),
      });
    if (url.includes("unpkg.com/react@"))
      return route.fulfill({
        contentType: "application/javascript",
        body: await readFile(
          new URL(
            "../node_modules/react/umd/react.production.min.js",
            import.meta.url,
          ),
        ),
      });
    if (url.includes("unpkg.com/@babel/"))
      return route.fulfill({
        contentType: "application/javascript",
        body: await readFile(
          new URL(
            "../node_modules/@babel/standalone/babel.min.js",
            import.meta.url,
          ),
        ),
      });
    if (url.includes("lucide"))
      return route.fulfill({
        contentType: "application/javascript",
        body: "window.lucide={createIcons(){}}",
      });
    return route.fulfill({ body: "", status: 200 });
  });
  const errors = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("PAGE ERROR", e.message);
  });
  await page.goto(`http://127.0.0.1:${port}/app.html`);
  await page.waitForFunction(() => !!window.ZalTeam, {}, { timeout: 12000 });
  if (role) {
    await page.locator("#zal-team-bar [data-action=open-account]").click();
    await page.locator("[name=email]").fill(role + "@example.test");
    await page.locator("[name=password]").fill("testing123");
    await page.locator("button[value=login]").click();
    await page.waitForFunction(() => !!window.ZalTeam.getUser());
  }
  return { page, context, errors };
}
const owner = await pageFor("owner");
const customer = await pageFor("customer", { width: 390, height: 844 });
const driver = await pageFor("driver");
const tab = (p, v) => p.locator(`#zal-team-dialog [data-view=${v}]`).click();
const form = (p, n) => p.locator(`form[data-form=${n}]`);
try {
  await tab(owner.page, "restaurant");
  let f = form(owner.page, "restaurant");
  await f
    .locator("[name=name]")
    .fill("QA <img src=x onerror=alert(1)> Kitchen");
  await f.locator("[name=cuisine]").fill("Belgian");
  await f.locator("[name=address]").fill("Test Street, Brussels");
  await f.locator("button.primary").click();
  await form(owner.page, "dish").waitFor();
  f = form(owner.page, "dish");
  await f.locator("[name=name]").fill("Pasta");
  await f.locator("[name=description]").fill("Tomato and basil");
  await f.locator("[name=price]").fill("10");
  await f.locator("[name=ingredients]").fill("tomato, basil");
  await f.locator("button.primary").click();
  await owner.page.waitForFunction(() =>
    document.querySelector("[role=status]").textContent.includes("Saved"),
  );
  await tab(customer.page, "catalog");
  await customer.page.locator("[data-action=catalog-menu]").click();
  await customer.page.locator("input[name^=qty-]").fill("2");
  await form(customer.page, "basket").locator("button.primary").click();
  await form(customer.page, "checkout").waitFor();
  await form(customer.page, "checkout")
    .locator("[name=fulfilment]")
    .selectOption("delivery");
  await form(customer.page, "checkout")
    .locator("[name=address]")
    .fill("Test delivery address");
  await form(customer.page, "checkout").locator("[name=tip]").fill("2");
  await form(customer.page, "checkout").locator("button.primary").click();
  await customer.page.locator("[data-op=pay]").waitFor();
  await customer.page.locator("[data-op=pay]").click();
  await customer.page
    .locator(".zt-badge").filter({hasText:"Test payment confirmed"})
    .waitFor();
  await tab(owner.page, "orders");
  await tab(owner.page, "restaurant");
  await owner.page.locator("[data-op=accept]").click();
  await owner.page.locator("[data-op=ready]").click();
  await tab(driver.page, "driver");
  f = form(driver.page, "driver");
  await f.locator("[name=name]").fill("QA Driver");
  await f.locator("[name=city]").fill("Brussels");
  await f.locator("button.primary").click();
  await driver.page.locator("[data-op=claim]").click();
  await driver.page.locator("[data-op=pickup]").click();
  await driver.page.locator("[data-op=complete]").click();
  await tab(driver.page, "wallet");
  await driver.page.getByText("Test balance: €5.00").waitFor();
  await tab(customer.page, "orders");
  await customer.page.locator(".zt-badge").filter({hasText:"Completed"}).waitFor();
  assert.equal(
    await customer.page.locator("#zal-team-dialog img").count(),
    0,
    "restaurant strings escaped",
  );
  if (process.env.ZAL_QA_OUTPUT_DIR) {
    await mkdir(process.env.ZAL_QA_OUTPUT_DIR, { recursive: true });
    await customer.page.screenshot({
      path: resolve(process.env.ZAL_QA_OUTPUT_DIR, "zal-team-mobile.png"),
      fullPage: true,
    });
    await owner.page.screenshot({
      path: resolve(process.env.ZAL_QA_OUTPUT_DIR, "zal-team-restaurant.png"),
      fullPage: true,
    });
  }
  await tab(customer.page, "account");
  await customer.page.locator("[data-action=logout]").click();
  assert.equal(
    await customer.page.evaluate(() => window.ZalTeam.getUser()),
    null,
  );
  await form(customer.page, "auth").waitFor();
  await customer.page.locator("[name=email]").fill("new@example.test");
  await customer.page.locator("[name=password]").fill("testing123");
  await customer.page.locator("button[value=signup]").click();
  await customer.page
    .getByText("Check your email to confirm your account, then sign in.")
    .waitFor();
  // Refresh persistence is tested in a separate signed-in browser context.
  await owner.page.reload();
  await owner.page.waitForFunction(() => !!window.ZalTeam?.getUser());
  assert.equal(
    await owner.page.evaluate(() => window.ZalTeam.getUser().email),
    "owner@example.test",
  );
  await owner.page.goto(`http://127.0.0.1:${port}/index.html`);
  await owner.page.waitForFunction(() => !!window.ZalTeam);
  await owner.page.locator("#zal-team-bar [data-action=open-ai]").click();
  await form(owner.page, "ai")
    .locator("[name=question]")
    .fill("What food is available?");
  await form(owner.page, "ai").locator("button.primary").click();
  await owner.page.getByText("AI is not configured in this test").waitFor();
  for (const p of [owner, customer, driver])
    assert.deepEqual(p.errors, [], "No unhandled browser errors");
  assert.ok(
    calls.some((c) => c.name === "zal_team_place_order" && c.args.p_tip === 2),
  );
  console.log(
    "PASS: existing app + website render; desktop/mobile; registration confirmation; sign in/out; session reload; restaurant + menu creation; customer test checkout; restaurant acceptance; driver assignment/delivery; real SQL wallet accounting; XSS escaping; honest AI error.",
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await tail;
  await db.close();
}
