import assert from "node:assert/strict";
let handler;
const vars = {
  SUPABASE_URL: "https://db.example.test",
  SUPABASE_SERVICE_ROLE_KEY: "server-test-secret",
};
globalThis.Deno = {
  env: { get: (k) => vars[k] },
  serve: (f) => {
    handler = f;
  },
};
await import("../supabase/functions/zal-ai/index.ts");
const restaurant = "10000000-0000-4000-8000-000000000001";
let requests = [],
  quota = true,
  providerFail = false,
  found = true;
globalThis.fetch = async (url, options = {}) => {
  url = String(url);
  requests.push({ url, options });
  if (url.endsWith("/auth/v1/user"))
    return Response.json(
      options.headers.Authorization === "Bearer good"
        ? { id: "00000000-0000-4000-8000-000000000001" }
        : {},
      { status: options.headers.Authorization === "Bearer good" ? 200 : 401 },
    );
  if (url.endsWith("/rpc/zal_ai_take_quota")) return Response.json(quota);
  if (url.includes("/rest/v1/restaurants"))
    return Response.json(
      found ? [{ id: restaurant, name: "Test Kitchen" }] : [],
    );
  if (url.includes("/rest/v1/menu_items"))
    return Response.json([
      {
        id: "dish",
        restaurant_id: restaurant,
        name: "Pasta",
        price: 10,
        ingredients: ["tomato"],
      },
    ]);
  if (url.includes("api.groq.com")) {
    if (providerFail) return Response.json({}, { status: 429 });
    const b = JSON.parse(options.body);
    return Response.json({
      choices: [
        {
          message: {
            content: b.response_format
              ? '{"terms":["pasta"]}'
              : "Pasta costs €10 in the supplied menu.",
          },
        },
      ],
    });
  }
  throw Error("Unexpected request " + url);
};
const call = (body, headers = {}, method = "POST") =>
  handler(
    new Request("https://edge.example.test/zal-ai", {
      method,
      headers: {
        origin: "https://bcomerd.github.io",
        authorization: "Bearer good",
        ...headers,
      },
      ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
    }),
  );
assert.equal((await call({}, {}, "OPTIONS")).status, 204);
assert.equal((await call({}, {}, "GET")).status, 405);
assert.equal(
  (await call({ question: "hi" }, { origin: "https://evil.example" })).status,
  403,
);
assert.equal(
  (await call({ question: "hi" }, { authorization: "" })).status,
  401,
);
assert.equal(
  (await call({ question: "hi" }, { authorization: "Bearer bad" })).status,
  401,
);
assert.equal((await call({ question: "hi" })).status, 503);
vars.GROQ_API_KEY = "provider-test-secret";
assert.equal((await call({ question: "x".repeat(1501) })).status, 400);
assert.equal(
  (await call({ question: "hello", restaurant_id: "not-uuid" })).status,
  400,
);
quota = false;
assert.equal((await call({ question: "hi" })).status, 429);
quota = true;
requests = [];
let r = await call({
  question: "What is available?",
  restaurant_id: restaurant,
});
assert.equal(r.status, 200);
assert.match((await r.json()).answer, /Pasta/);
const tables = requests.filter(
  (r) => r.url.includes("/rest/v1/") && !r.url.includes("/rpc/"),
);
assert.equal(tables.length, 2);
for (const r of tables)
  assert.ok(
    decodeURIComponent(r.url).includes("eq." + restaurant),
    "restaurant scope enforced server-side",
  );
const groq = requests.find((r) => r.url.includes("api.groq.com"));
assert.ok(!groq.options.body.includes("server-test-secret"));
assert.ok(!groq.options.body.includes("Bearer good"));
requests = [];
r = await call({ question: "ابحث عن باستا" });
assert.equal(r.status, 200);
assert.equal(requests.filter((r) => r.url.includes("api.groq.com")).length, 2);
found = false;
assert.equal(
  (await call({ question: "menu", restaurant_id: restaurant })).status,
  404,
);
found = true;
providerFail = true;
assert.equal(
  (await call({ question: "menu", restaurant_id: restaurant })).status,
  429,
);
console.log(
  "PASS: AI CORS; session validation; missing secret; request limits; per-user quota; restaurant-scoped data; multilingual search extraction; no credentials in model context; provider failure handling.",
);
