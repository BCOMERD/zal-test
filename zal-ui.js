// ZAL app layer: accounts, role dashboards (customer / restaurant / driver) and Zal AI chat.
// One app, one website: whoever signs in gets their own dashboard. Backend: Supabase RPCs zal_team_*.
(() => {
  "use strict";
  const Y = "#F2B203", BG = "#0A1122", CARD = "#101B33", LINE = "rgba(255,255,255,.08)", MUTE = "#8E9BAE";
  const IS_APP = /app\.html$/.test(location.pathname);
  let sb, user = null, dash = null, view = "auth", mode = "customer", tab = "", busy = false, poll = null, root, toastT;
  const chat = JSON.parse(sessionStorage.getItem("zal-chat") || "[]");

  const lang = () => (document.documentElement.dir === "rtl" || /^ar/.test(localStorage.getItem("zal-language") || "")) ? "ar" : "en";
  const T = (en, ar) => (lang() === "ar" ? ar : en);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const eur = (n) => "€" + Number(n || 0).toFixed(2);
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  const ic = {
    x: '<path d="M18 6 6 18M6 6l12 12"/>', back: '<path d="m15 18-6-6 6-6"/>', out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>', bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    menu: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    bike: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
    cog: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    spark: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  };
  const svg = (k, s = 20) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ic[k]}</svg>`;

  // ---------- styles ----------
  const css = `
  #zal-ui{position:fixed;inset:0;z-index:2147483600;display:none;background:rgba(3,7,20,.72);font-family:Inter,Tajawal,system-ui,sans-serif;color:#F4F6FB}
  #zal-ui.on{display:flex;align-items:center;justify-content:center}
  #zal-ui .zu-screen{background:${BG};width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden}
  #zal-ui.phone .zu-screen{width:min(430px,100vw);height:min(880px,100dvh);border-radius:38px;border:1px solid ${LINE};box-shadow:0 30px 80px rgba(0,0,0,.55)}
  #zal-ui.page .zu-screen{max-width:1180px;border-radius:0}
  @media (max-width:520px){#zal-ui.phone .zu-screen{border-radius:0;height:100dvh;border:0}}
  .zu-top{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid ${LINE}}
  .zu-top h1{flex:1;font-size:17px;font-weight:800;margin:0;display:flex;align-items:center;gap:8px}
  .zu-logo{width:30px;height:30px;border-radius:50%;background:${Y};color:${BG};display:grid;place-items:center;font-weight:900;font-size:15px}
  .zu-ib{width:38px;height:38px;border-radius:999px;background:${CARD};border:1px solid ${LINE};color:#fff;display:grid;place-items:center;cursor:pointer}
  .zu-body{flex:1;overflow:auto;padding:18px}
  .zu-tabs{display:flex;gap:6px;padding:10px 14px;border-top:1px solid ${LINE};background:#081020}
  .zu-tabs button{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:0;color:${MUTE};font:600 11px Inter,Tajawal,sans-serif;cursor:pointer;padding:6px 0;border-radius:12px}
  .zu-tabs button.on{color:${Y};background:rgba(242,178,3,.08)}
  .zu-card{background:${CARD};border:1px solid ${LINE};border-radius:16px;padding:14px;margin-bottom:12px}
  .zu-h{font-size:22px;font-weight:800;margin:4px 0 6px}
  .zu-sub{color:${MUTE};font-size:13.5px;margin:0 0 16px;line-height:1.5}
  .zu-in{width:100%;box-sizing:border-box;background:#0D1830;border:1px solid ${LINE};color:#fff;border-radius:12px;padding:13px 14px;font:15px Inter,Tajawal,sans-serif;margin:6px 0 12px;outline:none}
  .zu-in:focus{border-color:${Y}}
  .zu-lbl{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${MUTE}}
  .zu-btn{width:100%;background:${Y};color:${BG};border:0;border-radius:14px;padding:14px;font:800 15px Inter,Tajawal,sans-serif;cursor:pointer}
  .zu-btn.ghost{background:transparent;color:#fff;border:1px solid ${LINE}}
  .zu-btn.sm{width:auto;padding:9px 14px;font-size:13px;border-radius:11px}
  .zu-btn:disabled{opacity:.5}
  .zu-link{background:none;border:0;color:${Y};font:700 14px Inter,Tajawal,sans-serif;cursor:pointer;padding:6px 0}
  .zu-row{display:flex;align-items:center;gap:10px}.zu-between{justify-content:space-between}.zu-wrap{flex-wrap:wrap}
  .zu-pill{font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:999px;background:#1B2A4A;color:#CBD5E1;white-space:nowrap}
  .zu-pill.new{background:#3B2F00;color:${Y}}.zu-pill.prep{background:#1E3A8A;color:#BFDBFE}.zu-pill.ready{background:#7C2D12;color:#FED7AA}.zu-pill.done{background:#14532D;color:#BBF7D0}.zu-pill.x{background:#7F1D1D;color:#FECACA}
  .zu-stat{flex:1;background:${CARD};border:1px solid ${LINE};border-radius:16px;padding:14px}
  .zu-stat b{display:block;font-size:22px;margin-top:4px}
  .zu-steps{display:flex;gap:4px;margin:10px 0}.zu-steps i{flex:1;height:4px;border-radius:4px;background:#1B2A4A}.zu-steps i.on{background:${Y}}
  .zu-empty{text-align:center;color:${MUTE};padding:40px 10px;font-size:14px}
  .zu-chat{display:flex;flex-direction:column;gap:10px}
  .zu-msg{max-width:84%;padding:11px 14px;border-radius:18px;font-size:14.5px;line-height:1.55}
  .zu-msg.me{align-self:flex-end;background:${Y};color:${BG};border-bottom-right-radius:6px}
  .zu-msg.ai{align-self:flex-start;background:${CARD};border:1px solid ${LINE};border-bottom-left-radius:6px}
  .zu-typing span{display:inline-block;width:7px;height:7px;margin:0 2px;border-radius:50%;background:${MUTE};animation:zub 1s infinite}
  .zu-typing span:nth-child(2){animation-delay:.15s}.zu-typing span:nth-child(3){animation-delay:.3s}
  @keyframes zub{0%,80%,100%{opacity:.3}40%{opacity:1}}
  .zu-compose{display:flex;gap:8px;padding:12px 14px;border-top:1px solid ${LINE}}
  .zu-compose input{flex:1;margin:0}
  .zu-send{width:48px;border-radius:14px;border:0;background:${Y};color:${BG};display:grid;place-items:center;cursor:pointer}
  .zu-chips{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 12px}
  .zu-chip{border:1px solid rgba(242,178,3,.35);background:transparent;color:${Y};border-radius:999px;padding:7px 12px;font:600 13px Inter,Tajawal,sans-serif;cursor:pointer}
  .zu-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#111827;border:1px solid ${LINE};color:#fff;padding:11px 16px;border-radius:12px;font-size:14px;z-index:2147483647;max-width:90vw}
  .zu-toggle{width:46px;height:26px;border-radius:999px;background:#334155;position:relative;border:0;cursor:pointer}
  .zu-toggle.on{background:#16A34A}.zu-toggle::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}.zu-toggle.on::after{left:23px}
  .zu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
  #zal-ui[dir=rtl] .zu-msg.me{border-bottom-right-radius:18px;border-bottom-left-radius:6px}
  `;

  // ---------- helpers ----------
  function toast(msg) { document.querySelector(".zu-toast")?.remove(); const d = document.createElement("div"); d.className = "zu-toast"; d.textContent = msg; document.body.append(d); clearTimeout(toastT); toastT = setTimeout(() => d.remove(), 3500); }
  async function rpc(fn, args = {}) { const r = await sb.rpc(fn, args); if (r.error) throw r.error; return r.data; }
  async function guard(fn, btn) { if (busy) return; busy = true; if (btn) btn.disabled = true; try { await fn(); } catch (e) { toast(e.message || String(e)); } finally { busy = false; if (btn) btn.disabled = false; } }
  function role() {
    const r = user?.user_metadata?.role;
    if (dash?.restaurants?.length) return "restaurant";
    if (dash?.driver) return "driver";
    return ["restaurant", "driver"].includes(r) ? r : "customer";
  }
  async function load() { dash = user ? await rpc("zal_team_dashboard") : null; }
  const STATUS = (o) => {
    if (o.status === "cancelled") return ["x", T("Cancelled", "ملغي")];
    if (o.status === "completed") return ["done", o.fulfilment === "delivery" ? T("Delivered", "تم التوصيل") : T("Picked up", "تم الاستلام")];
    if (o.delivery_status === "on_the_way") return ["ready", T("On the way", "في الطريق")];
    if (o.status === "ready") return ["ready", T("Ready", "جاهز")];
    if (o.status === "accepted") return ["prep", T("Preparing", "قيد التحضير")];
    return ["new", o.payment_status === "paid" ? T("New order", "طلب جديد") : T("Awaiting payment", "بانتظار الدفع")];
  };
  const stepOf = (o) => o.status === "completed" ? 4 : o.delivery_status === "on_the_way" ? 3 : o.status === "ready" ? 3 : o.status === "accepted" ? 2 : 1;
  const total = (o) => Number(o.subtotal) + Number(o.delivery_fee || 0) + Number(o.tip || 0);

  // ---------- shell ----------
  function mount() {
    const st = document.createElement("style"); st.textContent = css; document.head.append(st);
    root = document.createElement("div"); root.id = "zal-ui"; root.className = IS_APP ? "phone" : "page";
    document.body.append(root);
    root.addEventListener("click", (e) => { if (e.target === root) close(); });
  }
  function open(v, m) {
    if (m) mode = m;
    view = v || (user ? home() : "auth"); tab = "";
    root.dir = lang() === "ar" ? "rtl" : "ltr";
    root.classList.add("on"); document.documentElement.style.overflow = "hidden";
    render(); startPoll();
  }
  function close() { root.classList.remove("on"); document.documentElement.style.overflow = ""; clearInterval(poll); }
  function home() { return { restaurant: "restaurant", driver: "driver", customer: "customer" }[role()]; }
  function startPoll() { clearInterval(poll); poll = setInterval(async () => { if (!user || busy || !["restaurant", "driver", "customer"].includes(view)) return; try { await load(); render(); } catch {} }, 12000); }
  function frame(title, body, { tabs = null, back = false, compose = "" } = {}) {
    root.innerHTML = `<div class="zu-screen" role="dialog" aria-label="ZAL">
      <div class="zu-top">${back ? `<button class="zu-ib" data-a="back" aria-label="Back">${svg("back")}</button>` : ""}
        <h1><span class="zu-logo">Z</span>${esc(title)}</h1>
        ${user ? `<button class="zu-ib" data-a="logout" aria-label="${T("Sign out", "تسجيل الخروج")}" title="${T("Sign out", "تسجيل الخروج")}">${svg("out", 18)}</button>` : ""}
        <button class="zu-ib" data-a="close" aria-label="Close">${svg("x", 18)}</button></div>
      <div class="zu-body">${body}</div>${compose}
      ${tabs ? `<nav class="zu-tabs">${tabs.map(([k, icon, l]) => `<button data-a="tab" data-t="${k}" class="${tab === k ? "on" : ""}">${svg(icon, 21)}${esc(l)}</button>`).join("")}</nav>` : ""}
    </div>`;
  }

  // ---------- auth ----------
  function authView() {
    const what = { customer: [T("Welcome to ZAL", "أهلاً بك في زال"), T("Discover Brussels food, order for pickup and track your orders.", "اكتشف أكل بروكسل، اطلب واستلم وتابع طلباتك.")],
                   restaurant: [T("ZAL for restaurants", "زال للمطاعم"), T("Create your partner account, add your menu and receive orders. 7% commission, no hidden fees.", "أنشئ حساب شريك، أضف منيوك واستقبل الطلبات. عمولة 7% فقط.")],
                   driver: [T("Drive with ZAL", "وصّل مع زال"), T("Create your courier account, take delivery jobs and keep 100% of fees and tips.", "أنشئ حساب سائق، استلم طلبات التوصيل واحتفظ بكامل الأجرة والإكرامية.")] }[mode];
    const signup = view === "signup";
    frame(mode === "customer" ? "ZAL" : what[0], `
      <div style="max-width:420px;margin:0 auto">
      <p class="zu-h">${esc(signup ? T("Create account", "إنشاء حساب") : what[0])}</p><p class="zu-sub">${esc(what[1])}</p>
      <form data-f="auth">${signup ? `<div class="zu-row" style="align-items:flex-start"><div style="flex:1"><span class="zu-lbl">${T("First name", "الاسم الأول")}</span><input class="zu-in" name="first" required autocomplete="given-name"></div>
      <div style="flex:1"><span class="zu-lbl">${T("Last name", "اسم العائلة")}</span><input class="zu-in" name="last" required autocomplete="family-name"></div></div>` : ""}<span class="zu-lbl">${T("Email", "البريد الإلكتروني")}</span><input class="zu-in" name="email" type="email" required autocomplete="email">
      <span class="zu-lbl">${T("Password", "كلمة المرور")}</span><input class="zu-in" name="password" type="password" minlength="8" required autocomplete="${signup ? "new-password" : "current-password"}">
      <button class="zu-btn">${signup ? T("Create account", "إنشاء الحساب") : T("Sign in", "تسجيل الدخول")}</button></form>
      <div class="zu-row zu-between" style="margin-top:10px"><button class="zu-link" data-a="${signup ? "signin" : "signup"}">${signup ? T("I already have an account", "لدي حساب") : T("Create an account", "إنشاء حساب جديد")}</button>
      ${signup ? "" : `<button class="zu-link" data-a="forgot" style="color:${MUTE}">${T("Forgot password?", "نسيت كلمة المرور؟")}</button>`}</div>
      <p class="zu-sub" style="margin-top:18px;font-size:12px">${T("Beta: payments are simulated, no real money is charged.", "نسخة تجريبية: الدفع وهمي ولا تُسحب أموال حقيقية.")}</p></div>`);
  }
  async function authSubmit(f, btn) {
    const email = f.email.value.trim(), password = f.password.value;
    await guard(async () => {
      const r = view === "signup"
        ? await sb.auth.signUp({ email, password, options: { data: { role: mode, first_name: f.first.value.trim(), last_name: f.last.value.trim(),
            full_name: (f.first.value.trim() + " " + f.last.value.trim()).trim() } } })
        : await sb.auth.signInWithPassword({ email, password });
      if (r.error) throw r.error;
      if (!r.data.session) { toast(T("Check your email to confirm, then sign in.", "راجع بريدك للتأكيد ثم سجّل الدخول.")); return; }
      user = r.data.user; await load();
      const first = user.user_metadata?.first_name;
      if (IS_APP && role() === "customer") { close(); toast(first ? T(`Welcome, ${first}!`, `أهلاً ${first}!`) : T("Welcome to ZAL!", "أهلاً بك في زال!")); return; }
      view = home(); render();
    }, btn);
  }

  // ---------- customer ----------
  function customerView() {
    tab = tab || "orders";
    const orders = (dash?.orders || []).filter((o) => o.customer_id === user.id);
    const spent = orders.filter((o) => o.payment_status === "paid").reduce((s, o) => s + total(o), 0);
    let body;
    if (tab === "orders") body = `<p class="zu-h">${T("My orders", "طلباتي")}</p>` + (orders.length ? orders.map((o) => { const [k, l] = STATUS(o); const n = stepOf(o); return `<div class="zu-card">
        <div class="zu-row zu-between"><b>${esc(o.restaurant_name)}</b><span class="zu-pill ${k}">${esc(l)}</span></div>
        <div class="zu-steps">${[1, 2, 3, 4].map((i) => `<i class="${i <= n && o.status !== "cancelled" ? "on" : ""}"></i>`).join("")}</div>
        <p class="zu-sub" style="margin:4px 0">${(o.items || []).map((i) => `${i.qty}× ${esc(i.name)}`).join(" · ")}</p>
        <div class="zu-row zu-between"><span class="zu-sub" style="margin:0">${o.fulfilment === "delivery" ? T("Delivery", "توصيل") : T("Pickup", "استلام")} · ${new Date(o.created_at).toLocaleString(lang())}</span><b>${eur(total(o))}</b></div>
        ${o.status === "pending" ? `<button class="zu-btn ghost sm" style="margin-top:10px" data-a="order" data-op="cancel" data-id="${o.id}">${T("Cancel order", "إلغاء الطلب")}</button>` : ""}</div>`; }).join("")
        : `<div class="zu-empty">${svg("bag", 36)}<p>${T("No orders yet. Pick a restaurant and order for pickup.", "لا طلبات بعد. اختر مطعماً واطلب للاستلام.")}</p><button class="zu-btn sm" data-a="close">${T("Explore restaurants", "تصفح المطاعم")}</button></div>`);
    if (tab === "wallet") body = `<p class="zu-h">${T("Wallet", "المحفظة")}</p><div class="zu-row"><div class="zu-stat"><span class="zu-lbl">${T("Spent", "المصروف")}</span><b>${eur(spent)}</b></div><div class="zu-stat"><span class="zu-lbl">${T("Orders", "الطلبات")}</span><b>${orders.length}</b></div></div>
      <p class="zu-sub" style="margin-top:14px">${T("Every order: the restaurant keeps the food price minus 7%. Couriers keep 100% of delivery and tips.", "في كل طلب: المطعم يأخذ سعر الأكل ناقص 7%، والسائق يأخذ كامل التوصيل والإكرامية.")}</p>`;
    if (tab === "me") body = profile();
    frame(T("My ZAL", "حسابي"), body, { tabs: [["orders", "bag", T("Orders", "طلباتي")], ["wallet", "wallet", T("Wallet", "المحفظة")], ["ai", "spark", "Zal AI"], ["me", "cog", T("Account", "الحساب")]] });
  }
  function profile() {
    const name = user.user_metadata?.full_name || "";
    return `<p class="zu-h">${T("Account", "الحساب")}</p>${name ? `<div class="zu-card"><span class="zu-lbl">${T("Name", "الاسم")}</span><p style="margin:6px 0 0">${esc(name)}</p></div>` : ""}<div class="zu-card"><span class="zu-lbl">${T("Email", "البريد")}</span><p style="margin:6px 0 0">${esc(user.email)}</p></div>
      <button class="zu-btn ghost" data-a="logout">${T("Sign out", "تسجيل الخروج")}</button>`;
  }

  // ---------- restaurant dashboard ----------
  let menu = [];
  async function loadMenu(id) { const r = await sb.from("menu_items").select("id,name,price,description,ingredients").eq("restaurant_id", id).order("name"); menu = r.data || []; }
  function restaurantView() {
    const rs = dash?.restaurants || [];
    if (!rs.length) {
      frame(T("Set up your restaurant", "إعداد مطعمك"), `<div style="max-width:520px;margin:0 auto"><p class="zu-h">${T("Tell us about your restaurant", "عرّفنا على مطعمك")}</p><p class="zu-sub">${T("It appears in the ZAL app as soon as you save. You can add dishes right after.", "يظهر في تطبيق زال فور الحفظ، ثم تضيف أطباقك.")}</p>
        <form data-f="rest"><span class="zu-lbl">${T("Restaurant name", "اسم المطعم")}</span><input class="zu-in" name="name" required minlength="2">
        <span class="zu-lbl">${T("Cuisine", "نوع المطبخ")}</span><input class="zu-in" name="cuisine" required placeholder="Syrian, Kurdish, Italian…">
        <span class="zu-lbl">${T("Address", "العنوان")}</span><input class="zu-in" name="address" required placeholder="Rue des Éburons 16, 1000 Brussels">
        <label class="zu-row" style="margin:6px 0 16px"><input type="checkbox" name="delivery"> ${T("We deliver with our own couriers", "لدينا توصيل خاص بنا")}</label>
        <button class="zu-btn">${T("Save restaurant", "حفظ المطعم")}</button></form></div>`);
      return;
    }
    const r = rs[0]; tab = tab || "orders";
    const orders = (dash.orders || []).filter((o) => o.restaurant_id === r.id);
    const live = orders.filter((o) => o.payment_status === "paid" && ["pending", "accepted", "ready"].includes(o.status));
    const earned = (dash.wallet || []).filter((w) => w.party === "restaurant").reduce((s, w) => s + Number(w.amount), 0);
    let body;
    if (tab === "orders") {
      const col = (title, list) => `<div><p class="zu-lbl" style="margin:0 0 8px">${esc(title)} · ${list.length}</p>${list.map(orderCardR).join("") || `<div class="zu-card zu-sub" style="margin:0 0 12px">${T("Nothing here", "لا شيء هنا")}</div>`}</div>`;
      body = `<div class="zu-row" style="margin-bottom:14px"><div class="zu-stat"><span class="zu-lbl">${T("Live orders", "طلبات حالية")}</span><b>${live.length}</b></div><div class="zu-stat"><span class="zu-lbl">${T("Earnings", "الأرباح")}</span><b>${eur(earned)}</b></div></div>
        <div class="zu-grid">${col(T("New", "جديدة"), live.filter((o) => o.status === "pending"))}${col(T("Preparing", "قيد التحضير"), live.filter((o) => o.status === "accepted"))}${col(T("Ready", "جاهزة"), live.filter((o) => o.status === "ready"))}</div>
        <p class="zu-lbl" style="margin:18px 0 8px">${T("History", "السجل")}</p>${orders.filter((o) => ["completed", "cancelled"].includes(o.status)).slice(0, 15).map(orderCardR).join("") || `<p class="zu-sub">${T("No past orders yet.", "لا طلبات سابقة.")}</p>`}`;
    }
    if (tab === "menu") body = `<p class="zu-h">${T("Menu", "المنيو")}</p>
      <form data-f="dish" class="zu-card"><span class="zu-lbl">${T("New dish", "طبق جديد")}</span><input class="zu-in" name="name" required placeholder="${T("Dish name", "اسم الطبق")}">
      <div class="zu-row"><input class="zu-in" name="price" type="number" step="0.10" min="0.1" required placeholder="€"><input class="zu-in" name="ingredients" placeholder="${T("Ingredients, comma separated", "المكونات، بفواصل")}"></div>
      <input class="zu-in" name="description" placeholder="${T("Short description", "وصف قصير")}"><button class="zu-btn">${T("Add dish", "إضافة الطبق")}</button></form>
      ${menu.map((m) => `<div class="zu-card zu-row zu-between"><div><b>${esc(m.name)}</b><p class="zu-sub" style="margin:4px 0 0">${esc((m.ingredients || []).join(", ") || m.description || "")}</p></div><div class="zu-row"><b>${eur(m.price)}</b><button class="zu-btn ghost sm" data-a="hide" data-id="${m.id}">${T("Hide", "إخفاء")}</button></div></div>`).join("") || `<p class="zu-sub">${T("Add your first dish above.", "أضف أول طبق.")}</p>`}`;
    if (tab === "earn") body = `<p class="zu-h">${T("Earnings", "الأرباح")}</p><div class="zu-row"><div class="zu-stat"><span class="zu-lbl">${T("Balance", "الرصيد")}</span><b>${eur(earned)}</b></div><div class="zu-stat"><span class="zu-lbl">${T("Commission", "العمولة")}</span><b>7%</b></div></div>
      <div style="margin-top:14px">${(dash.wallet || []).map((w) => `<div class="zu-card zu-row zu-between"><span class="zu-sub" style="margin:0">${w.event === "refund" ? T("Refund", "استرجاع") : T("Order", "طلب")} · ${new Date(w.created_at).toLocaleString(lang())}</span><b style="color:${Number(w.amount) < 0 ? "#F87171" : "#4ADE80"}">${Number(w.amount) < 0 ? "" : "+"}${eur(w.amount)}</b></div>`).join("")}</div>`;
    if (tab === "me") body = `<p class="zu-h">${esc(r.name)}</p><div class="zu-card"><p style="margin:0">${esc(r.cuisine)} · ${esc(r.address)}</p><p class="zu-sub" style="margin:6px 0 0">${r.delivery_available ? T("Pickup + own delivery", "استلام + توصيل خاص") : T("Pickup", "استلام")}</p></div>` + profile();
    frame(r.name, body, { tabs: [["orders", "bag", T("Orders", "الطلبات")], ["menu", "menu", T("Menu", "المنيو")], ["earn", "wallet", T("Earnings", "الأرباح")], ["me", "cog", T("Settings", "الإعدادات")]] });
  }
  function orderCardR(o) {
    const [k, l] = STATUS(o);
    const acts = o.payment_status !== "paid" ? "" : o.status === "pending" ? [["accept", T("Accept", "قبول")], ["cancel", T("Decline", "رفض")]]
      : o.status === "accepted" ? [["ready", T("Mark ready", "جاهز")]] : o.status === "ready" && o.fulfilment === "pickup" ? [["complete", T("Picked up", "تم الاستلام")]] : [];
    return `<div class="zu-card"><div class="zu-row zu-between"><b>#${esc(o.id.slice(0, 6).toUpperCase())}</b><span class="zu-pill ${k}">${esc(l)}</span></div>
      <p style="margin:8px 0 4px">${(o.items || []).map((i) => `<b>${i.qty}×</b> ${esc(i.name)}`).join("<br>")}</p>
      ${o.customer_note ? `<p class="zu-sub" style="margin:4px 0">“${esc(o.customer_note)}”</p>` : ""}
      <div class="zu-row zu-between"><span class="zu-sub" style="margin:0">${o.fulfilment === "delivery" ? T("Delivery", "توصيل") : T("Pickup", "استلام")}</span><b>${eur(Number(o.subtotal) - Number(o.commission) - Number(o.gateway_fee))} <span class="zu-sub" style="font-weight:400">${T("to you", "لك")}</span></b></div>
      ${acts.length ? `<div class="zu-row" style="margin-top:10px">${acts.map(([op, t], i) => `<button class="zu-btn sm ${i ? "ghost" : ""}" data-a="order" data-op="${op}" data-id="${o.id}">${esc(t)}</button>`).join("")}</div>` : ""}</div>`;
  }

  // ---------- driver dashboard ----------
  function driverView() {
    if (!dash?.driver) {
      frame(T("Become a courier", "انضم كسائق"), `<div style="max-width:480px;margin:0 auto"><p class="zu-h">${T("Your courier profile", "ملفك كسائق")}</p><p class="zu-sub">${T("You keep 100% of the delivery fee and tips.", "تحتفظ بكامل أجرة التوصيل والإكرامية.")}</p>
        <form data-f="driver"><span class="zu-lbl">${T("Full name", "الاسم الكامل")}</span><input class="zu-in" name="name" required minlength="2">
        <span class="zu-lbl">${T("City / zone", "المدينة / المنطقة")}</span><input class="zu-in" name="city" required placeholder="Brussels">
        <span class="zu-lbl">${T("Vehicle", "وسيلة التنقل")}</span><select class="zu-in" name="vehicle"><option value="bike">${T("Bike", "دراجة")}</option><option value="scooter">${T("Scooter", "سكوتر")}</option><option value="car">${T("Car", "سيارة")}</option><option value="walk">${T("On foot", "مشياً")}</option></select>
        <button class="zu-btn">${T("Start delivering", "ابدأ التوصيل")}</button></form></div>`);
      return;
    }
    tab = tab || "jobs";
    const mine = (dash.orders || []).filter((o) => o.driver_id === user.id);
    const active = mine.filter((o) => o.status !== "completed" && o.status !== "cancelled");
    const earned = (dash.wallet || []).filter((w) => w.party === "driver").reduce((s, w) => s + Number(w.amount), 0);
    let body;
    if (tab === "jobs") body = `<div class="zu-row" style="margin-bottom:14px"><div class="zu-stat"><span class="zu-lbl">${T("Today", "اليوم")}</span><b>${eur(earned)}</b></div><div class="zu-stat"><span class="zu-lbl">${T("Deliveries", "توصيلات")}</span><b>${mine.filter((o) => o.status === "completed").length}</b></div></div>
      ${active.length ? `<p class="zu-lbl">${T("Your active delivery", "توصيلتك الحالية")}</p>${active.map((o) => `<div class="zu-card" style="border-color:${Y}"><div class="zu-row zu-between"><b>${esc(o.restaurant_name)}</b><span class="zu-pill ${STATUS(o)[0]}">${esc(STATUS(o)[1])}</span></div>
        <p class="zu-sub" style="margin:8px 0 2px">📍 ${T("Pick up", "استلام")}: ${esc(o.restaurant_address)}</p><p class="zu-sub" style="margin:0 0 8px">🏠 ${T("Deliver to", "إلى")}: ${esc(o.delivery_address || "")}</p>
        <div class="zu-row zu-between"><b style="color:#4ADE80">+${eur(Number(o.delivery_fee) + Number(o.tip))}</b>${o.status === "ready" && o.delivery_status === "assigned" ? `<button class="zu-btn sm" data-a="order" data-op="pickup" data-id="${o.id}">${T("Picked up", "استلمت الطلب")}</button>` : o.delivery_status === "on_the_way" ? `<button class="zu-btn sm" data-a="order" data-op="complete" data-id="${o.id}">${T("Delivered", "تم التسليم")}</button>` : `<span class="zu-sub" style="margin:0">${T("Kitchen is preparing…", "المطبخ يحضّر…")}</span>`}</div></div>`).join("")}` : ""}
      <p class="zu-lbl" style="margin-top:16px">${T("Available jobs", "طلبات متاحة")}</p>${(dash.available_deliveries || []).map((o) => `<div class="zu-card"><div class="zu-row zu-between"><b>${esc(o.restaurant_name)}</b><b style="color:#4ADE80">+${eur(Number(o.delivery_fee) + Number(o.tip))}</b></div><p class="zu-sub" style="margin:6px 0 10px">📍 ${esc(o.restaurant_address)}</p><button class="zu-btn sm" data-a="order" data-op="claim" data-id="${o.id}">${T("Accept job", "قبول التوصيلة")}</button></div>`).join("") || `<div class="zu-empty">${svg("bike", 36)}<p>${T("No jobs right now. New jobs appear automatically.", "لا طلبات الآن. تظهر الطلبات الجديدة تلقائياً.")}</p></div>`}`;
    if (tab === "earn") body = `<p class="zu-h">${T("Earnings", "الأرباح")}</p><div class="zu-row"><div class="zu-stat"><span class="zu-lbl">${T("Balance", "الرصيد")}</span><b>${eur(earned)}</b></div><div class="zu-stat"><span class="zu-lbl">${T("You keep", "نصيبك")}</span><b>100%</b></div></div>
      <div style="margin-top:14px">${(dash.wallet || []).map((w) => `<div class="zu-card zu-row zu-between"><span class="zu-sub" style="margin:0">${T("Delivery", "توصيل")} · ${new Date(w.created_at).toLocaleString(lang())}</span><b style="color:#4ADE80">+${eur(w.amount)}</b></div>`).join("")}</div>`;
    if (tab === "me") body = `<p class="zu-h">${esc(dash.driver.display_name || "")}</p><div class="zu-card"><p style="margin:0">${esc(dash.driver.city || "")} · ${esc(dash.driver.vehicle || "")}</p></div>` + profile();
    frame(T("ZAL Courier", "زال للسائقين"), body, { tabs: [["jobs", "bike", T("Jobs", "الطلبات")], ["earn", "wallet", T("Earnings", "الأرباح")], ["me", "cog", T("Profile", "الملف")]] });
  }

  // ---------- Zal AI chat ----------
  function aiView() {
    const chips = [T("Something Kurdish near me", "بدي أكل كردي قريب"), T("Cheap halal food", "أكل حلال رخيص"), T("How does ZAL work?", "كيف تشتغل زال؟"), T("I want to open my restaurant on ZAL", "بدي سجّل مطعمي")];
    frame("Zal AI", `<div class="zu-chat" id="zu-chat">${chat.length ? "" : `<div class="zu-msg ai">${T("Hi! I'm Zal, your food guide in Brussels. What are you in the mood for?", "أهلاً! أنا زال، دليلك للأكل في بروكسل. شو حابب تاكل اليوم؟")}</div><div class="zu-chips">${chips.map((c) => `<button class="zu-chip" data-a="chip">${esc(c)}</button>`).join("")}</div>`}
      ${chat.map((m) => `<div dir="auto" class="zu-msg ${m.role === "user" ? "me" : "ai"}">${m.role === "user" ? esc(m.content) : md(m.content)}</div>`).join("")}</div>`,
      { back: !!user, compose: `<form class="zu-compose" data-f="ai"><input class="zu-in" dir="auto" name="q" autocomplete="off" placeholder="${T("Message Zal…", "اكتب لزال…")}"><button class="zu-send" aria-label="Send">${svg("send", 18)}</button></form>`,
      });
    const box = root.querySelector(".zu-body"); box.scrollTop = box.scrollHeight;
    root.querySelector("[name=q]")?.focus();
  }
  async function askAI(q) {
    chat.push({ role: "user", content: q }); sessionStorage.setItem("zal-chat", JSON.stringify(chat));
    if (view === "ai") { aiView(); document.getElementById("zu-chat").insertAdjacentHTML("beforeend", `<div class="zu-msg ai zu-typing" id="zu-typing"><span></span><span></span><span></span></div>`); const b = root.querySelector(".zu-body"); b.scrollTop = b.scrollHeight; }
    let answer;
    try {
      const { data, error } = await sb.functions.invoke("zal-ai", { body: { message: q, history: chat.slice(-11, -1), language: lang() } });
      if (error || data?.error) throw new Error(data?.error || error.message);
      answer = data.answer;
    } catch (e) { answer = T("Sorry, I couldn't answer right now. Please try again in a moment.", "عذراً، ما قدرت أجاوب الآن. جرّب بعد لحظة."); }
    chat.push({ role: "assistant", content: answer }); sessionStorage.setItem("zal-chat", JSON.stringify(chat.slice(-30)));
    if (view === "ai" && root.classList.contains("on")) aiView();
    return answer;
  }

  // ---------- render + events ----------
  function render() {
    if (view === "ai") return aiView();
    if (!user || view === "auth" || view === "signup") { if (view !== "signup") view = "auth"; return authView(); }
    if (view === "restaurant" && role() !== "restaurant") view = home();
    if (view === "driver" && role() !== "driver") view = home();
    ({ customer: customerView, restaurant: restaurantView, driver: driverView })[view === "customer" || !["restaurant", "driver"].includes(view) ? home() : view]();
  }
  async function onClick(e) {
    const b = e.target.closest("[data-a]"); if (!b || !root.contains(b)) return;
    const a = b.dataset.a;
    if (a === "close") return close();
    if (a === "back") { view = home(); tab = ""; return render(); }
    if (a === "signup" || a === "signin") { view = a === "signup" ? "signup" : "auth"; return render(); }
    if (a === "mode") { mode = b.dataset.m; view = "signup"; return render(); }
    if (a === "forgot") { const em = root.querySelector("[name=email]")?.value.trim(); if (!em) return toast(T("Enter your email first.", "اكتب بريدك أولاً.")); await sb.auth.resetPasswordForEmail(em, { redirectTo: location.href }); return toast(T("If this email exists, a reset link was sent.", "إذا كان البريد مسجلاً ستصلك رسالة.")); }
    if (a === "logout") { await sb.auth.signOut(); user = null; dash = null; mode = "customer"; view = "auth"; toast(T("Signed out", "تم تسجيل الخروج")); return render(); }
    if (a === "tab") { const t = b.dataset.t; if (t === "ai") { view = "ai"; return render(); } tab = t; if (t === "menu") await loadMenu(dash.restaurants[0].id); return render(); }
    if (a === "chip") return askAI(b.textContent);
    if (a === "order") return guard(async () => { await rpc("zal_team_order_action", { p_order_id: b.dataset.id, p_action: b.dataset.op }); await load(); render(); }, b);
    if (a === "hide") return guard(async () => { await rpc("zal_team_set_dish_available", { p_dish_id: b.dataset.id, p_available: false }); await loadMenu(dash.restaurants[0].id); render(); toast(T("Dish hidden from the menu", "تم إخفاء الطبق")); }, b);
  }
  async function onSubmit(e) {
    const f = e.target; if (!root.contains(f)) return; e.preventDefault();
    const btn = f.querySelector("button"), v = (k) => (f[k]?.value || "").trim();
    if (f.dataset.f === "auth") return authSubmit(f, btn);
    if (f.dataset.f === "ai") { const q = v("q"); if (q) { f.q.value = ""; askAI(q); } return; }
    if (f.dataset.f === "rest") return guard(async () => { await rpc("zal_team_register_restaurant", { p_name: v("name"), p_cuisine: v("cuisine"), p_address: v("address"), p_delivery: f.delivery.checked }); await load(); tab = "menu"; await loadMenu(dash.restaurants[0].id); render(); toast(T("Your restaurant is live on ZAL", "مطعمك صار على زال")); }, btn);
    if (f.dataset.f === "dish") return guard(async () => { await rpc("zal_team_save_dish", { p_restaurant_id: dash.restaurants[0].id, p_name: v("name"), p_description: v("description"), p_price: Number(v("price")), p_ingredients: v("ingredients").split(",").map((s) => s.trim()).filter(Boolean) }); await loadMenu(dash.restaurants[0].id); render(); toast(T("Dish added", "تمت إضافة الطبق")); }, btn);
    if (f.dataset.f === "driver") return guard(async () => { await rpc("zal_team_register_driver", { p_name: v("name"), p_city: v("city"), p_vehicle: f.vehicle.value }); await load(); render(); toast(T("You're ready to deliver", "أنت جاهز للتوصيل")); }, btn);
  }

  // hooks into the existing app / website design
  function hookHost() {
    document.addEventListener("click", (e) => {
      if (root.contains(e.target)) return;
      const btn = e.target.closest("button, a"); if (!btn) return;
      const has = (n) => btn.querySelector(`[data-lucide="${n}"], .lucide-${n}`);
      if (btn.matches('[aria-label="Account"]') || btn.id === "zal-account-icon") { e.preventDefault(); e.stopPropagation(); return open(user ? home() : "auth", "customer"); }
      if (IS_APP && has("sparkles")) { e.preventDefault(); e.stopPropagation(); return open("ai"); }
      if (IS_APP && has("bell")) { e.preventDefault(); e.stopPropagation(); return open(user ? home() : "auth"); }
    }, true);
    if (!IS_APP) {  // website: account icon next to the cart
      let n = 0; const t = setInterval(() => {
        const cart = document.querySelector('[data-lucide="shopping-bag"], svg.lucide-shopping-bag')?.closest("button, a");
        if ((!cart && ++n < 60) || document.getElementById("zal-account-icon")) return; clearInterval(t); if (!cart) return;
        const b = cart.cloneNode(false); b.id = "zal-account-icon"; b.removeAttribute("href"); b.removeAttribute("onclick"); b.type = "button"; b.setAttribute("aria-label", "Account");
        b.innerHTML = svg("user", 18); b.style.marginInlineEnd = "8px";
        cart.parentNode.insertBefore(b, cart);
      }, 250);
    }
  }

  async function init() {
    sb = window.ZalDB.client();
    mount(); root.addEventListener("click", onClick); root.addEventListener("submit", onSubmit); hookHost();
    const { data } = await sb.auth.getSession(); user = data.session?.user || null;
    if (user) await load().catch(() => {});
    sb.auth.onAuthStateChange((_e, s) => { user = s?.user || null; });
    // public API used by the app checkout and the website (partner / courier / AI buttons)
    window.ZalTeam = {
      open: (v, id) => v === "restaurant" ? open(user && role() === "restaurant" ? "restaurant" : "signup", "restaurant")
        : v === "driver" ? open(user && role() === "driver" ? "driver" : "signup", "driver")
        : v === "ai" ? open("ai") : open(user ? home() : "auth", "customer"),
      ask: (q) => askAI(q), getUser: () => user, startCheckout: () => open(user ? home() : "auth", "customer"), home,
    };
    const h = location.hash.replace("#", "");
    if (h === "partner" || h === "courier") window.ZalTeam.open(h === "partner" ? "restaurant" : "driver");
    window.dispatchEvent(new Event("zal-team-ready"));
  }
  let tries = 0; const wait = setInterval(() => { if (window.ZalDB?.client()) { clearInterval(wait); init().catch((e) => console.error("ZAL UI", e)); } else if (++tries > 100) clearInterval(wait); }, 100);
})();
