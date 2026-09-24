/* Shared test account/workflow layer for both existing ZAL designs. No secrets here. */
(function () {
  "use strict";
  const words = {
    en: {
      account: "Account",
      orders: "My orders",
      restaurant: "Restaurant",
      driver: "Driver",
      wallet: "Wallet",
      ai: "Zal AI",
      catalog: "Restaurants",
      close: "Close",
      login: "Sign in",
      signup: "Create account",
      logout: "Sign out",
      email: "Email",
      password: "Password",
      name: "Name",
      forgot: "Reset password",
      send: "Send",
      refresh: "Refresh",
      test: "TEAM TEST · No real payments",
      authHint:
        "Use any email. No confirmation email needed: you are signed in right away. Password: at least 8 characters.",
      confirm: "Check your email to confirm your account, then sign in.",
      reset:
        "If this email has an account, a password reset link will be sent.",
      newPassword: "New password",
      savePassword: "Save password",
      saved: "Saved successfully",
      loading: "Loading…",
      empty: "Nothing here yet.",
      cuisine: "Cuisine",
      address: "Address",
      city: "City",
      vehicle: "Vehicle",
      registerRestaurant: "Register your restaurant",
      registerDriver: "Become a ZAL driver",
      dish: "Dish name",
      description: "Description",
      price: "Price (€)",
      ingredients: "Ingredients (comma separated)",
      addDish: "Add dish",
      delivery: "Delivery",
      pickup: "Pickup",
      tip: "Driver tip (€)",
      note: "Order note",
      place: "Place order",
      pay: "Simulate payment",
      accept: "Accept",
      ready: "Ready",
      claim: "Claim delivery",
      complete: "Complete",
      cancel: "Cancel",
      collect: "Picked up — on the way",
      available: "Available deliveries",
      balance: "Balance (beta)",
      pending: "Pending",
      accepted: "Preparing",
      completed: "Completed",
      cancelled: "Cancelled",
      unpaid: "Unpaid",
      paid: "Paid (beta, simulated)",
      refunded: "Refunded",
      assigned: "Driver assigned",
      on_the_way: "On the way",
      delivered: "Delivered",
      unassigned: "Awaiting driver",
      created: "Order created",
      payment: "Payment",
      refund: "Refund",
      menu: "Menu",
      choose: "Choose restaurant",
      all: "General website help & search",
      question: "Ask in any language",
      ask: "Ask Zal",
      aiHint:
        "Answers use the restaurant directory and menus. Availability, allergens and prices need confirmation with the restaurant. No live GPS tracking.",
      subtotal: "Food",
      commission: "Zal commission (7%)",
      gateway: "Simulated payment fee",
      total: "Total",
      paymentHint: "Simulation only. No bank details, charges or real payouts.",
      testHint:
        "Test restaurants are operated by your team. Orders to directory restaurants are simulations; those restaurants are not notified.",
      noBackend:
        "The team-test backend is not deployed yet. This feature cannot save data until deployment.",
      signedIn: "Signed in",
      loginRequired: "Please sign in first.",
      qty: "Quantity",
      search: "Search",
      disable: "Mark unavailable",
      enable: "Make available",
      allOrders: "Orders update every 15 seconds while this panel is open.",
      owner: "Restaurant orders",
      driverOrders: "My deliveries",
      resend: "Resend confirmation email",
      sent: "Confirmation email requested.",
      privacy:
        "Each account sees only its own orders and wallet. Test addresses are shared only with the restaurant owner and assigned driver.",
      foodSearch: "Search dishes or restaurants",
      aiUnavailable:
        "The AI service is not ready. Please use restaurant search while configuration is completed.",
      chooseDish: "Choose at least one dish.",
      payExplain:
        "Order saved. Use “Simulate payment” in My orders to continue.",
      recovery: "Enter and save your new password.",
      location:
        "Directory prices are in EUR. Team members can test from any country; this is not a live delivery service.",
    },
    ar: {
      account: "حسابي",
      orders: "طلباتي",
      restaurant: "المطعم",
      driver: "السائق",
      wallet: "المحفظة",
      ai: "زال AI",
      catalog: "المطاعم",
      close: "إغلاق",
      login: "دخول",
      signup: "إنشاء حساب",
      logout: "خروج",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      name: "الاسم",
      forgot: "استعادة كلمة المرور",
      send: "إرسال",
      refresh: "تحديث",
      test: "تجربة الفريق · لا دفع حقيقي",
      authHint:
        "استخدم أي بريد. لا حاجة لتأكيد البريد، يتم الدخول مباشرة. كلمة المرور 8 أحرف على الأقل.",
      confirm: "راجع بريدك لتأكيد الحساب، ثم سجّل الدخول.",
      reset: "إذا كان البريد مسجلاً فستصلك رسالة استعادة كلمة المرور.",
      newPassword: "كلمة المرور الجديدة",
      savePassword: "حفظ كلمة المرور",
      saved: "تم الحفظ",
      loading: "جارٍ التحميل…",
      empty: "لا توجد بيانات بعد.",
      cuisine: "نوع المطبخ",
      address: "العنوان",
      city: "المدينة",
      vehicle: "وسيلة التوصيل",
      registerRestaurant: "سجّل مطعمك",
      registerDriver: "انضم كسائق في زال",
      dish: "اسم الطبق",
      description: "الوصف",
      price: "السعر باليورو",
      ingredients: "المكونات (افصل بفاصلة)",
      addDish: "إضافة طبق",
      delivery: "توصيل",
      pickup: "استلام من المطعم",
      tip: "إكرامية السائق باليورو",
      note: "ملاحظة الطلب",
      place: "تأكيد الطلب",
      pay: "محاكاة الدفع",
      accept: "قبول",
      ready: "جاهز",
      claim: "استلام مهمة التوصيل",
      complete: "إتمام الطلب",
      cancel: "إلغاء",
      collect: "استلمت الطعام — في الطريق",
      available: "طلبات التوصيل المتاحة",
      balance: "الرصيد (نسخة تجريبية)",
      pending: "بانتظار القبول",
      accepted: "قيد التحضير",
      completed: "مكتمل",
      cancelled: "ملغي",
      unpaid: "غير مدفوع",
      paid: "مدفوع (دفع تجريبي)",
      refunded: "تم الاسترجاع",
      assigned: "تم تعيين السائق",
      on_the_way: "في الطريق",
      delivered: "تم التسليم",
      unassigned: "بانتظار السائق",
      created: "تم إنشاء الطلب",
      payment: "دفع",
      refund: "استرجاع",
      menu: "قائمة الطعام",
      choose: "اختر مطعماً",
      all: "مساعدة الموقع والبحث العام",
      question: "اسأل بأي لغة",
      ask: "اسأل زال",
      aiHint:
        "الإجابات تستند إلى دليل المطاعم والمنيوهات. تأكد من المطعم بشأن التوفر والحساسية والأسعار. لا يوجد تتبع GPS حي.",
      subtotal: "الطعام",
      commission: "عمولة زال (7%)",
      gateway: "رسوم الدفع الوهمية",
      total: "الإجمالي",
      paymentHint: "محاكاة فقط. لا بيانات بنكية أو خصم أو تحويل أموال حقيقية.",
      testHint:
        "مطاعم التجربة يديرها فريقك. الطلبات لمطاعم الدليل محاكاة ولا تُرسل لتلك المطاعم.",
      noBackend:
        "خادم تجربة الفريق لم يُنشر بعد؛ لا يمكن حفظ هذه العملية قبل النشر.",
      signedIn: "تم الدخول",
      loginRequired: "سجّل الدخول أولاً.",
      qty: "الكمية",
      search: "بحث",
      disable: "إيقاف توفر الطبق",
      enable: "إتاحة الطبق",
      allOrders: "تتحدث الطلبات كل 15 ثانية أثناء فتح اللوحة.",
      owner: "طلبات المطعم",
      driverOrders: "توصيلاتي",
      resend: "إعادة إرسال تأكيد البريد",
      sent: "تم طلب رسالة التأكيد.",
      privacy:
        "كل حساب يرى طلباته ومحفظته فقط. عنوان التجربة يظهر لصاحب المطعم والسائق المعيّن فقط.",
      foodSearch: "ابحث عن طبق أو مطعم",
      aiUnavailable:
        "خدمة الذكاء الاصطناعي غير جاهزة. استخدم بحث المطاعم ريثما يكتمل الربط.",
      chooseDish: "اختر طبقاً واحداً على الأقل.",
      payExplain: "تم حفظ الطلب. افتح طلباتي واضغط محاكاة الدفع للمتابعة.",
      recovery: "أدخل كلمة المرور الجديدة واحفظها.",
      location:
        "الأسعار باليورو. يمكن للفريق التجربة من أي دولة؛ هذه ليست خدمة توصيل فعلية.",
    },
    fr: {
      account: "Compte",
      orders: "Mes commandes",
      restaurant: "Restaurant",
      driver: "Livreur",
      wallet: "Portefeuille",
      catalog: "Restaurants test",
      close: "Fermer",
      login: "Connexion",
      signup: "Créer un compte",
      logout: "Déconnexion",
      email: "E-mail",
      password: "Mot de passe",
      name: "Nom",
      refresh: "Actualiser",
      test: "TEST ÉQUIPE · Aucun paiement réel",
      delivery: "Livraison",
      pickup: "À emporter",
      send: "Envoyer",
      menu: "Menu",
      search: "Rechercher",
      pay: "Simuler le paiement",
      accept: "Accepter",
      ready: "Prêt",
      complete: "Terminer",
      cancel: "Annuler",
    },
    nl: {
      account: "Account",
      orders: "Mijn bestellingen",
      restaurant: "Restaurant",
      driver: "Bezorger",
      wallet: "Portemonnee",
      catalog: "Testrestaurants",
      close: "Sluiten",
      login: "Inloggen",
      signup: "Account maken",
      logout: "Uitloggen",
      email: "E-mail",
      password: "Wachtwoord",
      name: "Naam",
      refresh: "Vernieuwen",
      test: "TEAMTEST · Geen echte betalingen",
      delivery: "Bezorgen",
      pickup: "Afhalen",
      send: "Versturen",
      menu: "Menu",
      search: "Zoeken",
      pay: "Betaling simuleren",
      accept: "Accepteren",
      ready: "Klaar",
      complete: "Voltooien",
      cancel: "Annuleren",
    },
  };
  let lang =
    localStorage.getItem("zal-language") ||
    (navigator.language || "en").slice(0, 2);
  if (!words[lang]) lang = "en";
  const t = (k) => words[lang][k] || words.en[k] || k;
  const esc = (v) =>
    String(v == null ? "" : v).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const money = (v) =>
    new Intl.NumberFormat(lang, { style: "currency", currency: "EUR" }).format(
      Number(v) || 0,
    );
  let client,
    user = null,
    view = "account",
    data = null,
    dialog,
    main,
    notice,
    bar,
    busy = false,
    recovery = false,
    chat = [],
    aiRestaurant = "",
    checkout = null,
    catalogMenu = null,
    lastFocus;
  let menuRows = [],
    catalogRows = [];
  const btn = (label, act, extra = "", primary = false) =>
    `<button type="button" data-action="${act}" ${extra} class="${primary ? "primary" : ""}">${esc(t(label))}</button>`;
  const field = (label, name, type = "text", extra = "") =>
    `<label>${esc(t(label))}<input name="${name}" type="${type}" ${extra}></label>`;
  const errorMessage = (e) =>
    /PGRST202|Could not find the function|does not exist/.test(e.message || "")
      ? t("noBackend")
      : e.message || String(e);
  function message(s, error = false) {
    notice.textContent = s;
    notice.className = "zt-notice" + (error ? " error" : "");
  }
  async function rpc(name, args = {}) {
    const r = await client.rpc(name, args);
    if (r.error) throw r.error;
    return r.data;
  }
  function updateBar() {
    const testMode = new URLSearchParams(location.search).get("debug") === "1";
    bar.hidden = !testMode;
    if (!testMode) return;
    bar.innerHTML = `<strong>ZAL</strong><span class="zt-label">${esc(t("test"))}</span>${btn(user ? "account" : "login", "open-account")}${btn("catalog", "open-catalog")}${btn("ai", "open-ai")}<select aria-label="Language" data-language>${Object.keys(
      words,
    )
      .map(
        (l) =>
          `<option value="${l}" ${lang === l ? "selected" : ""}>${{ en: "EN", ar: "العربية", fr: "FR", nl: "NL" }[l]}</option>`,
      )
      .join("")}</select>`;
  }
  // one app, three kinds of users: each only sees their own screens
  function role() {
    const r = user?.user_metadata?.role;
    if (data?.restaurants?.length) return "restaurant";
    if (data?.driver) return "driver";
    return ["restaurant", "driver"].includes(r) ? r : "customer";
  }
  function tabsFor(r) {
    if (!user) return ["account"];
    return { restaurant: ["restaurant", "wallet", "ai", "account"], driver: ["driver", "wallet", "account"],
             customer: ["orders", "wallet", "ai", "account"] }[r];
  }
  function home() {
    const r = role();
    return r === "restaurant" ? "restaurant" : r === "driver" ? "driver" : null;
  }
  const ROLE_LABEL = { customer: { en: "Customer", ar: "زبون", fr: "Client", nl: "Klant" },
                       restaurant: { en: "Restaurant owner", ar: "صاحب مطعم", fr: "Restaurateur", nl: "Restauranthouder" },
                       driver: { en: "Driver", ar: "سائق", fr: "Livreur", nl: "Bezorger" } };
  const roleLabel = (r) => ROLE_LABEL[r][lang] || ROLE_LABEL[r].en;
  function shell() {
    dialog.dir = lang === "ar" ? "rtl" : "ltr";
    dialog.querySelector("header strong").textContent = user ? "ZAL · " + roleLabel(role()) : "ZAL";
    dialog.classList.toggle("zt-full", !!(user && home()));
    dialog.querySelector("[data-action=close]").textContent = t("close");
    dialog.querySelector("nav").innerHTML = tabsFor(role())
      .map((k) => btn(k, "tab", `data-view="${k}"`))
      .join("");
    dialog
      .querySelectorAll("nav button")
      .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  }
  let wantRole = "customer";
  async function open(v = "account", restaurantId = "") {
    lastFocus = document.activeElement;
    if (!user && ["restaurant", "driver"].includes(v)) wantRole = v;  // "Partner with us" / "Become a courier"
    view = v;
    if (restaurantId) aiRestaurant = restaurantId;
    shell();
    if (!dialog.open) dialog.showModal();
    message("");
    render();
    if (user && ["orders", "restaurant", "driver", "wallet"].includes(v))
      await refresh();
    if (v === "catalog") await loadCatalog();
    if (v === "ai") await loadAIOptions();
  }
  function authView() {
    return `<div class="zt-auth"><h2>${esc(t(recovery ? "newPassword" : user ? "account" : "login"))}</h2>${recovery ? `<form data-form="password">${field("newPassword", "password", "password", 'required minlength="8" autocomplete="new-password"')}<button class="primary">${esc(t("savePassword"))}</button></form>` : user ? `<p>${esc(user.email)}</p><p class="zt-muted">${esc(t("privacy"))}</p>${btn("logout", "logout")}<p class="zt-muted">${esc(t("location"))}</p>` : `<p class="zt-muted">${esc(t("authHint"))}</p><form data-form="auth">${field("email", "email", "email", 'required autocomplete="email"')}${field("password", "password", "password", 'required minlength="8" autocomplete="current-password"')}<label class="zt-field"><span>${esc({ en: "I am a", ar: "أنا", fr: "Je suis", nl: "Ik ben" }[lang] || "I am a")}</span><select name="role">${["customer", "restaurant", "driver"].map((r) => `<option value="${r}" ${r === wantRole ? "selected" : ""}>${esc(roleLabel(r))}</option>`).join("")}</select></label><div class="zt-row"><button class="primary" name="intent" value="login">${esc(t("login"))}</button><button name="intent" value="signup">${esc(t("signup"))}</button></div><div class="zt-row" style="margin-top:16px">${btn("forgot", "forgot")}${btn("resend", "resend")}</div></form>`}</div>`;
  }
  function orderCard(o, role) {
    const customer = o.customer_id === user?.id;
    let actions = "";
    if (customer && o.status === "pending" && o.payment_status === "unpaid")
      actions += btn("pay", "order", `data-id="${o.id}" data-op="pay"`, true);
    if (
      (customer && o.status === "pending") ||
      (role === "owner" &&
        ["pending", "accepted", "ready"].includes(o.status) &&
        o.delivery_status !== "on_the_way")
    )
      actions += btn("cancel", "order", `data-id="${o.id}" data-op="cancel"`);
    if (role === "owner" && o.payment_status === "paid") {
      if (o.status === "pending")
        actions += btn(
          "accept",
          "order",
          `data-id="${o.id}" data-op="accept"`,
          true,
        );
      if (o.status === "accepted")
        actions += btn(
          "ready",
          "order",
          `data-id="${o.id}" data-op="ready"`,
          true,
        );
      if (o.status === "ready" && o.fulfilment === "pickup")
        actions += btn(
          "complete",
          "order",
          `data-id="${o.id}" data-op="complete"`,
          true,
        );
    }
    if (role === "driver" && o.status === "ready") {
      if (o.delivery_status === "assigned")
        actions += btn(
          "collect",
          "order",
          `data-id="${o.id}" data-op="pickup"`,
          true,
        );
      if (o.delivery_status === "on_the_way")
        actions += btn(
          "complete",
          "order",
          `data-id="${o.id}" data-op="complete"`,
          true,
        );
    }
    return `<article class="zt-card"><h3>${esc(o.restaurant_name)}</h3><span class="zt-badge">#${esc(o.id.slice(0, 8))} · ${esc(t(o.status))} · ${esc(t(o.payment_status))}</span><p>${esc(t(o.fulfilment))}${o.fulfilment === "delivery" ? " · " + esc(t(o.delivery_status)) : ""}</p><ul>${(o.items || []).map((i) => `<li>${esc(i.qty)} × ${esc(i.name)} · ${money(i.unit_price)}</li>`).join("")}</ul><p>${esc(o.delivery_address || "")}</p><p>${esc(o.customer_note || "")}</p><p class="zt-total">${money(Number(o.subtotal) + Number(o.delivery_fee) + Number(o.tip))}</p><p class="zt-muted">${esc(t("commission"))}: ${money(o.commission)} · ${esc(t("gateway"))}: ${money(o.gateway_fee)} · ${esc(t("delivery"))}: ${money(o.delivery_fee)} · ${esc(t("tip"))}: ${money(o.tip)}</p><ol class="zt-timeline">${(o.events || []).map((e) => `<li>${esc(t({ pay: "paid", accept: "accepted", claim: "assigned", pickup: "on_the_way", complete: "completed", cancel: "cancelled" }[e.event] || e.event))} · ${esc(new Date(e.created_at).toLocaleString(lang))}</li>`).join("")}</ol><div class="zt-row">${actions}</div></article>`;
  }
  function render() {
    shell();
    if (view === "account") {
      main.innerHTML = authView();
      return;
    }
    if (!user && !["catalog", "ai"].includes(view)) {
      main.innerHTML = `<p>${esc(t("loginRequired"))}</p>${authView()}`;
      return;
    }
    if (view === "checkout") {
      renderCheckout();
      return;
    }
    if (view === "catalog") {
      renderCatalog();
      return;
    }
    if (view === "ai") {
      renderAI();
      return;
    }
    if (!data) {
      main.innerHTML = `<p>${esc(t("loading"))}</p>`;
      return;
    }
    const restaurants = data.restaurants || [],
      orders = data.orders || [];
    if (view === "orders")
      main.innerHTML = `<h2>${esc(t("orders"))}</h2><p class="zt-muted">${esc(t("allOrders"))}</p>${btn("refresh", "refresh")}<p class="zt-muted">${esc(t("testHint"))}</p>${
        orders
          .filter((o) => o.customer_id === user.id)
          .map((o) => orderCard(o, "customer"))
          .join("") || `<p>${esc(t("empty"))}</p>`
      }`;
    if (view === "restaurant")
      main.innerHTML = `<h2>${esc(t("restaurant"))}</h2>${btn("refresh", "refresh")}<p class="zt-muted">${esc(t("allOrders"))}</p><div class="zt-grid"><section>${restaurants.length ? "" : `<form data-form="restaurant" class="zt-card"><h3>${esc(t("registerRestaurant"))}</h3>${field("name", "name", "text", 'required minlength="2" maxlength="120"')}${field("cuisine", "cuisine", "text", 'required minlength="2" maxlength="120"')}${field("address", "address", "text", 'required minlength="3" maxlength="500"')}<label>${esc(t("delivery"))}<input type="checkbox" name="delivery" checked></label><button class="primary">${esc(t("registerRestaurant"))}</button></form>`}${restaurants.length ? `<form data-form="dish" class="zt-card"><h3>${esc(t("addDish"))}</h3><label>${esc(t("restaurant"))}<select name="restaurant">${restaurants.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join("")}</select></label>${field("dish", "name", "text", 'required minlength="2" maxlength="160"')}${field("description", "description", "text", 'maxlength="2000"')}${field("price", "price", "number", 'required min="0.01" max="1000" step="0.01"')}${field("ingredients", "ingredients", "text", 'maxlength="1000"')}<button class="primary">${esc(t("addDish"))}</button></form>` : ""}</section><section><h3>${esc(t("owner"))}</h3>${
        orders
          .filter((o) => restaurants.some((r) => r.id === o.restaurant_id))
          .map((o) => orderCard(o, "owner"))
          .join("") || `<p>${esc(t("empty"))}</p>`
      }${restaurants.map((r) => `<div class="zt-card"><strong>${esc(r.name)}</strong><p>${esc(r.address)}</p>${btn("menu", "manage-menu", `data-id="${r.id}"`)} ${btn("ai", "restaurant-ai", `data-id="${r.id}"`)}</div>`).join("")}</section></div>`;
    if (view === "driver")
      main.innerHTML = `<h2>${esc(t("driver"))}</h2><div class="zt-grid"><section>${data.driver ? "" : `<form data-form="driver" class="zt-card"><h3>${esc(t("registerDriver"))}</h3>${field("name", "name", "text", `required minlength="2" maxlength="120" value="${esc(data.driver?.display_name || "")}"`)}${field("city", "city", "text", `required minlength="2" maxlength="120" value="${esc(data.driver?.city || "")}"`)}<label>${esc(t("vehicle"))}<select name="vehicle"><option value="bike">🚲 Bike</option><option value="scooter">🛵 Scooter</option><option value="car">🚗 Car</option><option value="walk">🚶 Walk</option></select></label><button class="primary">${esc(t("registerDriver"))}</button></form>`}<h3>${esc(t("available"))}</h3>${(data.available_deliveries || []).map((o) => `<article class="zt-card"><strong>${esc(o.restaurant_name)}</strong><p>${esc(o.restaurant_address)}</p><p>${money(Number(o.delivery_fee) + Number(o.tip))}</p>${btn("claim", "order", `data-id="${o.id}" data-op="claim"`, true)}</article>`).join("") || `<p>${esc(t("empty"))}</p>`}</section><section><h3>${esc(t("driverOrders"))}</h3>${
        orders
          .filter((o) => o.driver_id === user.id)
          .map((o) => orderCard(o, "driver"))
          .join("") || `<p>${esc(t("empty"))}</p>`
      }</section></div>`;
    if (view === "wallet") {
      const entries = data.wallet || [];
      main.innerHTML = `<h2>${esc(t("wallet"))}</h2><p class="zt-total">${esc(t("balance"))}: ${money(entries.reduce((s, e) => s + Number(e.amount), 0))}</p><p>${esc(t("paymentHint"))}</p>${entries.map((e) => `<div class="zt-card"><strong>${money(e.amount)}</strong> · ${esc(t(e.party))} · ${esc(t(e.event))}<p class="zt-muted">#${esc(e.order_id.slice(0, 8))} · ${esc(new Date(e.created_at).toLocaleString(lang))}</p></div>`).join("") || `<p>${esc(t("empty"))}</p>`}`;
    }
  }
  async function refresh(silent = false) {
    if (!user) return;
    try {
      data = await rpc("zal_team_dashboard");
      if (
        ["orders", "restaurant", "driver", "wallet"].includes(view) &&
        (!silent || !main.querySelector("form[data-dirty]"))
      )
        render();
    } catch (e) {
      if (!silent) message(errorMessage(e), true);
    }
  }
  async function loadCatalog(q = "") {
    try {
      let r = client
        .from("restaurants")
        .select(
          "id,name,cuisine,address,delivery_available,pickup_available,delivery_fee,min_order",
        )
        .eq("is_test", true)
        .order("created_at", { ascending: false })
        .limit(100);
      if (q) r = r.ilike("name", "%" + q.replace(/[%_*]/g, "") + "%");
      const out = await r;
      if (out.error) throw out.error;
      catalogRows = out.data || [];
      if (view === "catalog") renderCatalog();
    } catch (e) {
      message(errorMessage(e), true);
    }
  }
  function renderCatalog() {
    if (catalogMenu) {
      main.innerHTML = `${btn("catalog", "back-catalog")}<h2>${esc(catalogMenu.name)}</h2><form data-form="basket">${menuRows.map((m) => `<article class="zt-card"><h3>${esc(m.name)} · ${money(m.price)}</h3><p>${esc(m.description)}</p><p class="zt-muted">${esc((m.ingredients || []).join(", "))}</p>${field("qty", "qty-" + m.id, "number", 'min="0" max="50" step="1" value="0"')}</article>`).join("")}<button class="primary">${esc(t("place"))}</button></form>${btn("ai", "restaurant-ai", `data-id="${catalogMenu.id}"`)}`;
      return;
    }
    main.innerHTML = `<h2>${esc(t("catalog"))}</h2><p class="zt-muted">${esc(t("testHint"))}</p><form data-form="catalog-search" class="zt-row"><input aria-label="${esc(t("search"))}" name="query" placeholder="${esc(t("search"))}"><button>${esc(t("search"))}</button></form><div class="zt-grid" style="margin-top:16px">${catalogRows.map((r) => `<article class="zt-card"><h3>${esc(r.name)}</h3><p>${esc(r.cuisine)}</p><p>${esc(r.address)}</p>${btn("menu", "catalog-menu", `data-id="${r.id}"`, true)} ${btn("ai", "restaurant-ai", `data-id="${r.id}"`)}</article>`).join("") || `<p>${esc(t("empty"))}</p>`}</div>`;
  }
  function renderCheckout() {
    if (!checkout) return;
    const p = checkout.restaurant;
    main.innerHTML = `<h2>${esc(t("place"))} · ${esc(typeof p.name === "object" ? p.name[lang] || p.name.en : p.name)}</h2><p class="zt-muted">${esc(t("paymentHint"))}</p><form data-form="checkout"><ul>${checkout.lines.map((l) => `<li>${esc(l.qty)} × ${esc(l.name)} · ${money(l.price)}</li>`).join("")}</ul><label>${esc(t("delivery"))} / ${esc(t("pickup"))}<select name="fulfilment">${(p.pickup_available ?? p.pickup) ? `<option value="pickup">${esc(t("pickup"))}</option>` : ""}${(p.delivery_available ?? p.delivery) ? `<option value="delivery" ${checkout.fulfilment === "delivery" ? "selected" : ""}>${esc(t("delivery"))}</option>` : ""}</select></label>${field("address", "address", "text", 'maxlength="500" autocomplete="street-address"')}${field("tip", "tip", "number", 'value="0" min="0" max="100" step="0.01"')}${field("note", "note", "text", 'maxlength="1000"')}<p>${esc(t("subtotal"))}: ${money(checkout.lines.reduce((s, l) => s + l.qty * l.price, 0))}</p><p class="zt-muted">${esc(t("delivery"))}: ${money(p.delivery_fee ?? p.deliveryFee ?? 0)} · ${esc(t("paymentHint"))}</p><button class="primary">${esc(t("place"))}</button></form>`;
  }
  let aiOptions = [];
  async function loadAIOptions() {
    try {
      const r = await client
        .from("restaurants")
        .select("id,name")
        .order("dish_count", { ascending: false, nullsFirst: false })
        .limit(80);
      if (r.error) throw r.error;
      aiOptions = r.data || [];
      if (aiRestaurant && !aiOptions.some((r) => r.id === aiRestaurant)) {
        const x = await client
          .from("restaurants")
          .select("id,name")
          .eq("id", aiRestaurant)
          .maybeSingle();
        if (x.data) aiOptions.unshift(x.data);
      }
      if (view === "ai") renderAI();
    } catch (e) {
      message(errorMessage(e), true);
    }
  }
  function renderAI() {
    main.innerHTML = `<h2>${esc(t("ai"))}</h2><p class="zt-muted">${esc(t("aiHint"))}</p><label>${esc(t("choose"))}<select data-ai-restaurant><option value="">${esc(t("all"))}</option>${aiOptions.map((r) => `<option value="${r.id}" ${aiRestaurant === r.id ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select></label><div aria-live="polite">${chat.map((m) => `<div class="zt-chat ${m.role === "user" ? "user" : ""}">${esc(m.content)}</div>`).join("")}</div><form data-form="ai"><label>${esc(t("question"))}<textarea name="question" required maxlength="1500"></textarea></label><button class="primary">${esc(t("ask"))}</button></form>`;
  }
  async function ask(question, restaurantId = aiRestaurant) {
    if (!user) throw Error(t("loginRequired"));
    if (!client) throw Error(t("loading"));
    const { data: out, error } = await client.functions.invoke("zal-ai", {
      body: { question, restaurant_id: restaurantId || null, language: lang },
    });
    if (error) {
      let detail = "";
      try {
        detail = (await error.context?.json())?.error || "";
      } catch (_) {}
      throw Error(detail || t("aiUnavailable"));
    }
    if (!out?.answer) throw Error(t("aiUnavailable"));
    return out.answer;
  }
  async function handleAction(b) {
    const a = b.dataset.action;
    if (a === "close") {
      dialog.close();
      lastFocus?.focus?.();
      return;
    }
    if (a.startsWith("open-")) return open(a.slice(5));
    if (a === "tab") return open(b.dataset.view);
    if (a === "logout") {
      const r = await client.auth.signOut();
      if (r.error) throw r.error;
      user = null;
      data = null;
      chat = [];
      updateBar();
      view = "account";
      render();
      return;
    }
    if (a === "refresh") return refresh();
    if (a === "forgot" || a === "resend") {
      const email = main.querySelector("[name=email]")?.value.trim();
      if (!email || !main.querySelector("[name=email]").checkValidity())
        throw Error(t("email"));
      const redirect = new URL("app.html", location.href).href;
      const r =
        a === "forgot"
          ? await client.auth.resetPasswordForEmail(email, {
              redirectTo: redirect,
            })
          : await client.auth.resend({
              type: "signup",
              email,
              options: { emailRedirectTo: redirect },
            });
      if (r.error) throw r.error;
      message(t(a === "forgot" ? "reset" : "sent"));
      return;
    }
    if (a === "order") {
      await rpc("zal_team_order_action", {
        p_order_id: b.dataset.id,
        p_action: b.dataset.op,
      });
      await refresh();
      message(t("saved"));
      return;
    }
    if (a === "restaurant-ai") {
      chat = [];
      return open("ai", b.dataset.id);
    }
    if (a === "back-catalog") {
      catalogMenu = null;
      return open("catalog");
    }
    if (a === "catalog-menu") {
      catalogMenu = catalogRows.find((r) => r.id === b.dataset.id);
      const r = await client
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", b.dataset.id)
        .eq("available", true)
        .order("name");
      if (r.error) throw r.error;
      menuRows = r.data || [];
      renderCatalog();
      return;
    }
    if (a === "manage-menu") {
      const r = await client
        .from("menu_items")
        .select("id,name,price,available")
        .eq("restaurant_id", b.dataset.id)
        .order("name");
      if (r.error) throw r.error;
      main.innerHTML = `<h2>${esc(t("menu"))}</h2>${(r.data || []).map((m) => `<div class="zt-card">${esc(m.name)} · ${money(m.price)} ${btn(m.available ? "disable" : "enable", "toggle-dish", `data-id="${m.id}" data-available="${!m.available}"`)}</div>`).join("")}`;
      return;
    }
    if (a === "toggle-dish") {
      await rpc("zal_team_set_dish_available", {
        p_dish_id: b.dataset.id,
        p_available: b.dataset.available === "true",
      });
      await open("restaurant");
      message(t("saved"));
    }
  }
  async function submit(form, submitter) {
    const f = new FormData(form),
      v = (k) => String(f.get(k) || "").trim();
    switch (form.dataset.form) {
      case "auth": {
        const email = v("email"),
          password = String(f.get("password") || "");
        const intent = submitter?.value || "login";
        const result =
          intent === "signup"
            ? await client.auth.signUp({
                email,
                password,
                options: {
                  emailRedirectTo: new URL("app.html", location.href).href,
                  data: { role: v("role") || "customer" },
                },
              })
            : await client.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        if (result.data.session) {
          user = result.data.user;
          updateBar();
          await refresh(true).catch(() => {});
          if (checkout) { view = "checkout"; render(); }
          else if (home()) await open(home());
          else { dialog.close(); window.dispatchEvent(new Event("zal-signed-in")); }
        } else message(t("confirm"));
        break;
      }
      case "password": {
        const r = await client.auth.updateUser({
          password: String(f.get("password")),
        });
        if (r.error) throw r.error;
        recovery = false;
        render();
        message(t("saved"));
        break;
      }
      case "restaurant":
        await rpc("zal_team_register_restaurant", {
          p_name: v("name"),
          p_cuisine: v("cuisine"),
          p_address: v("address"),
          p_delivery: f.has("delivery"),
        });
        await refresh();
        message(t("saved"));
        break;
      case "driver":
        await rpc("zal_team_register_driver", {
          p_name: v("name"),
          p_city: v("city"),
          p_vehicle: v("vehicle"),
        });
        await refresh();
        message(t("saved"));
        break;
      case "dish":
        await rpc("zal_team_save_dish", {
          p_restaurant_id: v("restaurant"),
          p_name: v("name"),
          p_description: v("description"),
          p_price: Number(v("price")),
          p_ingredients: v("ingredients")
            .split(/[,،]/)
            .map((s) => s.trim())
            .filter(Boolean),
        });
        await refresh();
        message(t("saved"));
        break;
      case "catalog-search":
        await loadCatalog(v("query"));
        break;
      case "basket": {
        const lines = menuRows
          .map((m) => ({
            menu_item_id: m.id,
            name: m.name,
            price: Number(m.price),
            qty: Number(f.get("qty-" + m.id) || 0),
          }))
          .filter((l) => l.qty > 0);
        if (!lines.length) throw Error(t("chooseDish"));
        await startCheckout(catalogMenu, lines, "pickup");
        break;
      }
      case "checkout": {
        const fulfilment = v("fulfilment");
        if (fulfilment === "delivery" && v("address").length < 5)
          throw Error(t("address"));
        const id = await rpc("zal_team_place_order", {
          p_restaurant_id: checkout.restaurant.id,
          p_items: checkout.lines.map((l) => ({
            menu_item_id: l.menu_item_id,
            qty: l.qty,
          })),
          p_fulfilment: fulfilment,
          p_address: fulfilment === "delivery" ? v("address") : "",
          p_note: v("note"),
          p_request_id: checkout.requestId,
          p_tip: fulfilment === "delivery" ? Number(v("tip")) : 0,
        });
        const callback = checkout.onSuccess;
        checkout = null;
        view = "orders";
        await refresh();
        if (callback) callback(id);
        message(t("payExplain"));
        break;
      }
      case "ai": {
        const question = v("question");
        chat.push({ role: "user", content: question });
        renderAI();
        const answer = await ask(question);
        chat.push({ role: "assistant", content: answer });
        renderAI();
        break;
      }
    }
  }
  async function guarded(fn) {
    if (busy) return;
    busy = true;
    message("");
    dialog.setAttribute("aria-busy", "true");
    try {
      await fn();
    } catch (e) {
      message(errorMessage(e), true);
    } finally {
      busy = false;
      dialog.removeAttribute("aria-busy");
    }
  }
  async function startCheckout(restaurant, lines, fulfilment, onSuccess) {
    checkout = {
      restaurant,
      lines,
      fulfilment,
      onSuccess,
      requestId: crypto.randomUUID(),
    };
    await open(user ? "checkout" : "account");
    if (!user) message(t("loginRequired"));
  }
  async function init() {
    if (!window.ZalDB?.client()) return false;
    client = window.ZalDB.client();
    bar = document.createElement("div");
    bar.id = "zal-team-bar";
    dialog = document.createElement("dialog");
    dialog.id = "zal-team-dialog";
    dialog.setAttribute("aria-label", "ZAL");
    dialog.innerHTML =
      '<header><strong></strong><button type="button" data-action="close">Close</button></header><nav></nav><div class="zt-notice" role="status" aria-live="polite"></div><main></main>';
    document.body.append(bar, dialog);
    main = dialog.querySelector("main");
    notice = dialog.querySelector("[role=status]");
    document.addEventListener("click", (e) => {
      const b = e.target.closest(
        "#zal-team-bar [data-action],#zal-team-dialog [data-action]",
      );
      if (b) guarded(() => handleAction(b));
    });
    dialog.addEventListener("input", (e) => {
      const f = e.target.closest("form");
      if (f) f.dataset.dirty = "true";
    });
    dialog.addEventListener("submit", (e) => {
      e.preventDefault();
      guarded(() => submit(e.target, e.submitter));
    });
    bar.addEventListener("change", (e) => {
      if (e.target.matches("[data-language]")) {
        lang = e.target.value;
        localStorage.setItem("zal-language", lang);
        updateBar();
        if (dialog.open) render();
      }
    });
    dialog.addEventListener("change", (e) => {
      if (e.target.matches("[data-ai-restaurant]")) {
        aiRestaurant = e.target.value;
        chat = [];
        renderAI();
      }
    });
    client.auth.onAuthStateChange((event, session) => {
      user = session?.user || null;
      if (event === "SIGNED_OUT") {
        data = null;
        checkout = null;
        chat = [];
      }
      updateBar();
      if (event === "PASSWORD_RECOVERY") {
        recovery = true;
        setTimeout(() => open("account"), 0);
      }
    });
    const session = await client.auth.getSession();
    if (session.error) message(session.error.message, true);
    user = session.data.session?.user || null;
    updateBar();
    setInterval(() => {
      if (
        dialog.open &&
        user &&
        !busy &&
        ["orders", "restaurant", "driver", "wallet"].includes(view)
      )
        refresh(true);
    }, 15000);
    window.ZalTeam = { open, ask, startCheckout, getUser: () => user, home: () => home() };
    document.addEventListener("click", (e) => {
      const acc = e.target.closest('button[aria-label="Account"]');
      const bell = e.target.closest("button")?.querySelector('[data-lucide="bell"], .lucide-bell');
      if (!acc && !bell) return;
      e.preventDefault(); e.stopPropagation();
      if (!user) return open("account");
      open(bell ? (home() || "orders") : (home() || "orders"));
    }, true);
    window.dispatchEvent(new Event("zal-team-ready"));
    if (location.hash === "#account") open("account");
    return true;
  }
  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    if (window.ZalDB?.client()) {
      clearInterval(timer);
      init().catch((e) =>
        console.error("ZAL account initialization failed", e),
      );
    } else if (attempts > 100) {
      clearInterval(timer);
      console.error("ZAL Supabase library did not load");
    }
  }, 100);
})();
