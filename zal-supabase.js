// ZAL data layer.
//   public.restaurant_cards  (view: every restaurants column + min_dish_price) — lists & cards
//   public.menu_items        (restaurant_id, name, description, ingredients text[], price, image_url …)
// Orders → zal_place_order(), bookings → zal_book_table()  (supabase/orders.sql, bookings_payouts.sql)
(function () {
  const cfg = window.ZAL_SUPABASE || {};
  let client = null;

  function configured() {
    return !!(cfg.url && cfg.key && !/PASTE_/.test(cfg.key) && window.supabase && window.supabase.createClient);
  }
  function db() {
    if (!client && configured()) client = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: true } });
    return client;
  }

  const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  // Returns true/false, or null when hours are missing or unparseable.
  function isOpenNow(hours, now) {
    if (!hours || typeof hours !== "string") return null;
    const d = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
    let parsed = false;
    for (const part of hours.toLowerCase().split(";")) {
      const m = part.trim().match(/^([a-z]+)(?:\s*-\s*([a-z]+))?\s+(.*)$/);
      if (!m) continue;
      const a = DAYS.indexOf(m[1]), b = m[2] ? DAYS.indexOf(m[2]) : a;
      if (a < 0 || b < 0) continue;
      parsed = true;
      const inRange = a <= b ? d >= a && d <= b : d >= a || d <= b;
      if (!inRange) continue;
      if (/closed/.test(m[3])) return false;
      for (const r of m[3].matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)) {
        const s = +r[1] * 60 + +r[2]; let e = +r[3] * 60 + +r[4]; if (e <= s) e += 1440;
        if ((mins >= s && mins <= e) || (mins + 1440 >= s && mins + 1440 <= e)) return true;
      }
      return false;
    }
    return parsed ? false : null;
  }

  // Default user location — origin for every distance and time estimate.
  const ORIGIN = { lat: 50.8488174, lng: 4.3785470, label: "Rue des Éburons 16, 1000 Brussels", short: "Rue des Éburons 16, 1000" };
  function distKm(lat, lng) {
    if (lat == null || lng == null) return null;
    const dLat = (lat - ORIGIN.lat) * 111.2, dLng = (lng - ORIGIN.lng) * 111.32 * Math.cos(ORIGIN.lat * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  }
  const etaFrom = km => (km == null ? null : Math.round(12 + km * 5));

  // opening_hours jsonb: {"mon":[["12:00","14:00"],["18:00","22:00"]], ...} in Brussels local time; "24:00" = midnight.
  const DK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  function brusselsNow() {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    const g = t => (parts.find(p => p.type === t) || {}).value || "";
    const h = (+g("hour")) % 24, m = +g("minute");
    return { d: DK.indexOf(g("weekday").toLowerCase().slice(0, 3)), m: h * 60 + m };
  }
  const toMin = v => { const [h, m] = String(v).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  function openFromJson(oh, now) {
    if (oh == null) return null;
    if (typeof oh === "string") { try { oh = JSON.parse(oh); } catch (e) { return null; } }
    if (typeof oh !== "object" || now.d < 0) return null;
    const ranges = k => (Array.isArray(oh[k]) ? oh[k] : []).filter(r => Array.isArray(r) && r.length >= 2);
    for (const [a, b] of ranges(DK[now.d])) {
      const s = toMin(a); let e = toMin(b); if (e <= s) e += 1440;
      if (now.m >= s && now.m < e) return true;
    }
    for (const [a, b] of ranges(DK[(now.d + 6) % 7])) { // yesterday's ranges running past midnight
      const s = toMin(a); let e = toMin(b); if (e <= s) e += 1440;
      if (e > 1440 && now.m < e - 1440) return true;
    }
    return false;
  }

  // "4.5/5 (230) Takeaway" → 4.5
  function parseRating(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    const m = String(v).match(/(\d+(?:[.,]\d+)?)\s*\/\s*5/) || String(v).match(/^\s*(\d+(?:[.,]\d+)?)\s*$/);
    if (!m) return null;
    const n = parseFloat(m[1].replace(",", "."));
    return isFinite(n) && n > 0 && n <= 5 ? n : null;
  }
  const num = v => (v == null || v === "" || !isFinite(Number(v)) ? null : Number(v));
  const flag = v => v === true || v === "true" || v === 1;
  const award = v => (v == null || v === false || v === "" || v === 0 || v === "0" || v === "false") ? null : (v === true || v === "true" ? "" : String(v));

  function mapCard(x, now) {
    const pc = (x.address || "").match(/\b1\d{3}\b/);
    const km = distKm(num(x.latitude), num(x.longitude));
    const rv = num(x.rating_value);
    return {
      id: x.id,
      name: { en: x.name || "", ar: x.name || "" },
      cuisine: { en: x.cuisine || "", ar: x.cuisine || "" },
      cuisineName: x.cuisine || "",
      culture: Array.isArray(x.culture) ? x.culture : [],
      area: pc ? pc[0] : "",
      address: x.address || "", phone: x.phone || "", website: x.website || "", hours: x.hours || "",
      rating: rv != null && rv > 0 ? rv : parseRating(x.rating),
      ratingCount: num(x.rating_count),
      dist: km, eta: etaFrom(km),
      priceMin: num(x.min_dish_price),
      price: num(x.min_dish_price),
      priceBand: x.price_band || "",
      open: openFromJson(x.opening_hours, now),
      healthy: flag(x.healthy), vegetarian: flag(x.vegetarian), halal: flag(x.halal),
      delivery: flag(x.delivery_available), pickup: flag(x.pickup_available),
      booking: flag(x.reservation_available), freeDelivery: flag(x.free_delivery),
      deliveryFee: num(x.delivery_fee), minOrder: num(x.min_order),
      dishCount: num(x.dish_count) || 0,
      michelin: award(x.michelin), gaultMillau: award(x.gault_millau),
      tags: flag(x.reservation_available) ? ["booking"] : [],
      image: x.image_url || ""
    };
  }

  // f: { delivery, pickup, healthy, vegetarian, halal, free_delivery, reservation, zalList,
  //      priceBand, culture, cuisine, q, postcode }
  // mode: "all" (default, server-paginated) | "nearby" (±0.01° box, by distance) | "open" (open now, by distance) | "top" (rating)
  const memo = {};
  async function queryCards(f, offset, limit, mode) {
    const c = db();
    if (!c) return null;
    f = f || {}; offset = offset || 0; limit = limit || 20; mode = mode || "all";
    const paged = mode === "all" || mode === "top";
    const base = (zalMode) => {
      let q = c.from("restaurant_cards").select("*", paged ? { count: "exact" } : undefined);
      if (f.delivery) q = q.eq("delivery_available", true);
      if (f.pickup) q = q.eq("pickup_available", true);
      if (f.healthy) q = q.eq("healthy", true);
      if (f.vegetarian) q = q.eq("vegetarian", true);
      if (f.halal) q = q.eq("halal", true);
      if (f.free_delivery) q = q.eq("free_delivery", true);
      if (f.reservation) q = q.eq("reservation_available", true);
      if (f.zalList) q = zalMode === "text" ? q.ilike("data_sources", "%Zal list%") : q.contains("data_sources", ["Zal list"]);
      if (f.priceBand) q = q.eq("price_band", f.priceBand);
      if (f.culture) q = q.contains("culture", [f.culture]);
      if (f.cuisine) q = q.ilike("cuisine", f.cuisine);
      if (f.postcode) q = q.ilike("address", "%" + f.postcode + "%");
      const term = (f.q || "").replace(/[,()*%\\]/g, " ").trim();
      if (term) q = q.or("name.ilike.*" + term + "*,cuisine.ilike.*" + term + "*");
      if (mode === "nearby") q = q.gte("latitude", ORIGIN.lat - 0.01).lte("latitude", ORIGIN.lat + 0.01).gte("longitude", ORIGIN.lng - 0.01).lte("longitude", ORIGIN.lng + 0.01);
      if (mode === "open") q = q.not("opening_hours", "is", null);
      if (mode === "top") q = q.not("rating_value", "is", null).gte("rating_count", 20).order("rating_value", { ascending: false }).order("rating_count", { ascending: false });
      if (mode === "all") q = q.order("dish_count", { ascending: false, nullsFirst: false }).order("name", { ascending: true });
      return q;
    };
    const run = async (fn) => {
      let r = await fn("array");
      if (r.error && f.zalList) r = await fn("text"); // data_sources stored as plain text
      if (r.error) throw r.error;
      return r;
    };
    const now = brusselsNow();
    if (paged) {
      const r = await run(z => base(z).range(offset, offset + limit - 1));
      return { rows: (r.data || []).map(x => mapCard(x, now)), count: r.count == null ? null : r.count };
    }
    // nearby / open: fetch the whole (bounded) set, filter + sort by distance in JS, memoised for paging.
    const key = mode + "|" + JSON.stringify(f);
    let all = memo[key] && Date.now() - memo[key].at < 60000 ? memo[key].rows : null;
    if (!all) {
      all = [];
      for (let from = 0; ; from += 1000) {
        const r = await run(z => base(z).order("id").range(from, from + 999));
        const got = r.data || [];
        all = all.concat(got.map(x => mapCard(x, now)));
        if (got.length < 1000) break;
      }
      if (mode === "open") all = all.filter(p => p.open === true);
      all.sort((a, b) => (a.dist == null) - (b.dist == null) || (a.dist || 0) - (b.dist || 0));
      memo[key] = { at: Date.now(), rows: all };
    }
    return { rows: all.slice(offset, offset + limit), count: all.length };
  }

  // → [[name, name, desc, desc, price|null, id, ingredients[], image_url]]
  async function loadMenu(restaurantId) {
    const c = db();
    if (!c) return null;
    const { data, error } = await c.from("menu_items").select("*").eq("restaurant_id", restaurantId).order("name").limit(1000);
    if (error) throw error;
    return (data || []).filter(d => d.available !== false).map(d => {
      const ings = Array.isArray(d.ingredients) ? d.ingredients.filter(Boolean) : [];
      return [d.name || "", d.name || "", d.description || "", d.description || "", num(d.price), d.id, ings, d.image_url || ""];
    });
  }

  // items: [{ menu_item_id, qty }]
  async function placeOrder(restaurantId, items, fulfilment) {
    const c = db();
    if (!c) return null;
    const { data, error } = await c.rpc("zal_place_order", {
      p_restaurant_id: restaurantId, p_items: items, p_fulfilment: fulfilment
    });
    if (error) throw error;
    return data;
  }

  // pre: [{ menu_item_id, qty }] or null; prePay: "at_restaurant" | "now"
  async function bookTable(restaurantId, startsAt, guests, pre, prePay) {
    const c = db();
    if (!c) return null;
    const { data, error } = await c.rpc("zal_book_table", {
      p_restaurant_id: restaurantId, p_starts_at: startsAt, p_guests: guests,
      p_pre: pre && pre.length ? pre : null, p_pre_pay: prePay || "at_restaurant"
    });
    if (error) throw error;
    return data && data[0]; // { booking_id, share_code }
  }

  window.ZalDB = { configured, queryCards, loadMenu, placeOrder, bookTable, parseRating, ORIGIN, client: db };
})();
