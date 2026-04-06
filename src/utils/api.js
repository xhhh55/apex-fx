/* ════════════════════════════════════════════════════════
   API CLIENT — Token manager + REST client + Toast system
════════════════════════════════════════════════════════ */

export const API_BASE =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "https://apex-invest-backend.up.railway.app/api";

/* ── JWT Token manager ── */
export const Token = {
  get:        () => { try { return localStorage.getItem("apex:token") || null; } catch { return null; } },
  set:        (t) => { try { localStorage.setItem("apex:token", t); } catch {} },
  del:        () => { try { localStorage.removeItem("apex:token"); } catch {} },
  getRefresh: () => { try { return localStorage.getItem("apex:refresh") || null; } catch { return null; } },
  setRefresh: (t) => { try { localStorage.setItem("apex:refresh", t); } catch {} },
  delRefresh: () => { try { localStorage.removeItem("apex:refresh"); } catch {} },
  delAll:     () => { Token.del(); Token.delRefresh(); },
};

/* ── Toast notification system ─────────────────────────────── */
// Components can subscribe with Toast.subscribe(fn); fn receives { msg, type }
const _toastSubs = new Set();
export const Toast = {
  subscribe:   (fn) => { _toastSubs.add(fn); return () => _toastSubs.delete(fn); },
  _emit:       (msg, type = "error") => _toastSubs.forEach(fn => fn({ msg, type })),
  error:       (msg) => Toast._emit(msg, "error"),
  success:     (msg) => Toast._emit(msg, "success"),
  info:        (msg) => Toast._emit(msg, "info"),
  warning:     (msg) => Toast._emit(msg, "warning"),
};

/* ── Friendly error messages ─────────────────────────────────
   Map backend detail strings → user-facing messages.
   Keys are substrings (case-insensitive). ── */
const ERROR_MAP = [
  { match: "rate limit",        en: "Too many AI requests. Please wait a moment.", ar: "طلبات كثيرة، يرجى الانتظار قليلاً." },
  { match: "token expired",     en: "Session expired. Signing in again…",          ar: "انتهت الجلسة، إعادة تسجيل الدخول…" },
  { match: "invalid token",     en: "Authentication error. Please sign in again.", ar: "خطأ في المصادقة، يرجى تسجيل الدخول." },
  { match: "invalid email",     en: "Invalid email or password.",                  ar: "البريد أو كلمة المرور غير صحيحة." },
  { match: "email already",     en: "This email is already registered.",           ar: "البريد الإلكتروني مسجّل مسبقاً." },
  { match: "not found",         en: "Resource not found.",                         ar: "العنصر غير موجود." },
  { match: "network",           en: "Network error. Check your connection.",       ar: "خطأ في الشبكة، تحقق من الاتصال." },
  { match: "ai service",        en: "AI service is not available right now.",      ar: "خدمة الذكاء الاصطناعي غير متاحة الآن." },
  { match: "500",               en: "Server error. Please try again later.",       ar: "خطأ في الخادم، حاول لاحقاً." },
  { match: "503",               en: "Service temporarily unavailable.",            ar: "الخدمة غير متاحة مؤقتاً." },
];

function friendlyError(raw, lang = "en") {
  const lower = (raw || "").toLowerCase();
  const isAr  = lang === "ar";
  for (const e of ERROR_MAP) {
    if (lower.includes(e.match)) return isAr ? e.ar : e.en;
  }
  return raw || (isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred.");
}

/* ── Refresh logic (singleton to avoid parallel refreshes) ── */
let _refreshPromise = null;

async function _doRefresh() {
  const rt = Token.getRefresh();
  if (!rt) throw new Error("No refresh token");
  const res  = await fetch(`${API_BASE}/auth/refresh`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ refresh_token: rt }),
    signal:  AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error("Refresh failed");
  const data = await res.json();
  Token.set(data.token);
  if (data.refresh_token) Token.setRefresh(data.refresh_token);
  return data.token;
}

async function _refreshOnce() {
  if (!_refreshPromise) {
    _refreshPromise = _doRefresh().finally(() => { _refreshPromise = null; });
  }
  return _refreshPromise;
}

/* ── REST client ── */
export const API = {
  _lang: "en",   // set this after language is known

  _headers(extra = {}) {
    return {
      "Content-Type": "application/json",
      ...(Token.get() ? { Authorization: `Bearer ${Token.get()}` } : {}),
      ...extra,
    };
  },

  async _fetch(path, opts = {}, _retry = true) {
    try {
      const res  = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: { ...this._headers(), ...(opts.headers || {}) },
        signal:  opts.signal || AbortSignal.timeout(10_000),
      });
      const data = await res.json();

      // ── 401: try refresh once ──────────────────────────────
      if (res.status === 401 && _retry && Token.getRefresh()) {
        try {
          await _refreshOnce();
          return this._fetch(path, opts, false);   // retry with new token
        } catch {
          // Refresh failed → log out
          Token.delAll();
          Toast.error(friendlyError("token expired", this._lang));
          return { ok: false, error: "Session expired", status: 401 };
        }
      }

      if (!res.ok) {
        const msg = data.detail || data.error || `HTTP ${res.status}`;
        // Show toast for 4xx/5xx (skip 401 handled above, 404 usually silent)
        if (res.status !== 401 && res.status !== 404) {
          Toast.error(friendlyError(msg, this._lang));
        }
        return { ok: false, error: msg, status: res.status };
      }

      return { ok: true, data };
    } catch (err) {
      const msg = err.name === "TimeoutError"
        ? (this._lang === "ar" ? "انتهت مهلة الطلب." : "Request timed out.")
        : friendlyError("network", this._lang);
      Toast.error(msg);
      return { ok: false, error: err.message };
    }
  },

  // ── Auth ──────────────────────────────────────────────────
  register(name, email, password) {
    return this._fetch("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
  },
  login(email, password) {
    return this._fetch("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },
  refresh() {
    return _refreshOnce();
  },
  logout()  { return this._fetch("/auth/logout", { method: "POST" }); },
  getMe()   { return this._fetch("/auth/me"); },

  // ── Settings ──────────────────────────────────────────────
  getSettings()         { return this._fetch("/settings"); },
  updateProfile(u)      { return this._fetch("/settings/profile",       { method: "PUT",  body: JSON.stringify(u) }); },
  updateNotifications(p){ return this._fetch("/settings/notifications", { method: "PUT",  body: JSON.stringify(p) }); },
  updatePreferences(p)  { return this._fetch("/settings/preferences",   { method: "PUT",  body: JSON.stringify(p) }); },
  changePassword(c, n)  { return this._fetch("/settings/password",      { method: "PUT",  body: JSON.stringify({ current_password: c, new_password: n }) }); },
  deleteAccount(pw, confirm = "DELETE") {
    return this._fetch("/settings/account", { method: "DELETE", body: JSON.stringify({ password: pw, confirm }) });
  },

  // ── Portfolio ─────────────────────────────────────────────
  getPortfolio()           { return this._fetch("/portfolio"); },
  openTrade(t)             { return this._fetch("/portfolio/trade",              { method: "POST", body: JSON.stringify(t) }); },
  closeTrade(id, price)    { return this._fetch(`/portfolio/trade/${id}/close`,  { method: "POST", body: JSON.stringify({ exit_price: price }) }); },
  resetPortfolio()         { return this._fetch("/portfolio/reset",              { method: "POST" }); },
  getPortfolioStats()      { return this._fetch("/portfolio/stats"); },

  // ── Alerts ────────────────────────────────────────────────
  getAlerts()              { return this._fetch("/alerts"); },
  createAlert(a)           { return this._fetch("/alerts",          { method: "POST",   body: JSON.stringify(a) }); },
  deleteAlert(id)          { return this._fetch(`/alerts/${id}`,    { method: "DELETE" }); },
  triggerAlert(id, price)  { return this._fetch(`/alerts/${id}/trigger`, { method: "PATCH", body: JSON.stringify({ fired_price: price }) }); },

  // ── Holdings ──────────────────────────────────────────────
  getHoldings()            { return this._fetch("/holdings"); },
  addHolding(h)            { return this._fetch("/holdings",       { method: "POST",  body: JSON.stringify(h) }); },
  saveCryptoHolding(h)     { return this.addHolding({ ...h, asset_type: "crypto" }); },
  saveStockHolding(h)      { return this.addHolding({ ...h, asset_type: "stock" }); },
  updateHolding(id, u)     { return this._fetch(`/holdings/${id}`, { method: "PUT",   body: JSON.stringify(u) }); },
  deleteHolding(id)        { return this._fetch(`/holdings/${id}`, { method: "DELETE" }); },
  getHoldingsSummary()     { return this._fetch("/holdings/summary"); },

  // ── Journal ───────────────────────────────────────────────
  getJournal(o = 0, l = 20){ return this._fetch(`/journal?offset=${o}&limit=${l}`); },
  addJournalEntry(e)        { return this._fetch("/journal",       { method: "POST",  body: JSON.stringify(e) }); },
  updateJournalEntry(id, u) { return this._fetch(`/journal/${id}`, { method: "PUT",   body: JSON.stringify(u) }); },
  deleteJournalEntry(id)    { return this._fetch(`/journal/${id}`, { method: "DELETE" }); },
  getJournalMoodStats()     { return this._fetch("/journal/stats/mood"); },

  // ── Affiliate ─────────────────────────────────────────────
  getAffiliateCode()        { return this._fetch("/affiliate/code"); },
  getAffiliateStats()       { return this._fetch("/affiliate/stats"); },
  applyAffiliateCode(code)  { return this._fetch("/affiliate/apply", { method: "POST", body: JSON.stringify({ code }) }); },

  // ── Stripe / Payments ─────────────────────────────────────
  createCheckout(plan) {
    return this._fetch("/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({
        plan,
        success_url: `${window.location.origin}?payment=success&plan=${plan}`,
        cancel_url:  `${window.location.origin}?payment=cancelled`,
      }),
    });
  },
  getSubscriptionStatus() { return this._fetch("/stripe/status"); },
  openBillingPortal()     { return this._fetch("/stripe/portal", { method: "POST" }); },

  // ── AI (secure proxy) ─────────────────────────────────────
  analyze(prompt, system = null) {
    return this._fetch("/ai/analyze", {
      method: "POST",
      body: JSON.stringify({ prompt, max_tokens: 700, ...(system && { system }) }),
    });
  },
  analyzePortfolio(portfolio_data, lang) {
    return this._fetch("/ai/portfolio", { method: "POST", body: JSON.stringify({ portfolio_data, lang }) });
  },
  aiChat(messages, system = null) {
    return this._fetch("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ messages, ...(system && { system }), max_tokens: 1000 }),
    });
  },
  getAIRateStatus() { return this._fetch("/ai/rate-status"); },

  // ── Prices proxy (server-side, replaces allorigins) ───────
  getPriceMetals()                       { return this._fetch("/prices/metals"); },
  getPriceIndices()                      { return this._fetch("/prices/indices"); },
  getPriceHistory(symbol, interval = "1h", limit = 200) {
    return this._fetch(`/prices/history?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`);
  },

  // ── Leaderboard ───────────────────────────────────────────
  getLeaderboard() { return this._fetch("/leaderboard"); },

  // ── Brokers ───────────────────────────────────────────────
  getBrokers()            { return this._fetch("/brokers"); },
  addBroker(body)         { return this._fetch("/brokers",              { method: "POST",   body: JSON.stringify(body) }); },
  testBroker(id)          { return this._fetch(`/brokers/${id}/test`,   { method: "POST" }); },
  updateBroker(id, body)  { return this._fetch(`/brokers/${id}`,        { method: "PUT",    body: JSON.stringify(body) }); },
  deleteBroker(id)        { return this._fetch(`/brokers/${id}`,        { method: "DELETE" }); },
  getBrokerPositions(id)  { return this._fetch(`/brokers/${id}/positions`); },

  // ── Broker Trade ──────────────────────────────────────────
  executeBrokerTrade(body)      { return this._fetch("/broker-trade",               { method: "POST",   body: JSON.stringify(body) }); },
  closeBrokerTrade(tradeId, ep) { return this._fetch(`/broker-trade/close/${tradeId}`, { method: "POST", body: JSON.stringify({ exit_price: ep }) }); },

  // ── Real Estate ───────────────────────────────────────────
  getRealEstateListings(params = {}) {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v != null))).toString();
    return this._fetch(`/real-estate${qs ? "?" + qs : ""}`);
  },
  getRealEstateListing(id)   { return this._fetch(`/real-estate/${id}`); },
  createListing(body)        { return this._fetch("/real-estate",           { method: "POST",   body: JSON.stringify(body) }); },
  updateListing(id, body)    { return this._fetch(`/real-estate/${id}`,     { method: "PUT",    body: JSON.stringify(body) }); },
  deleteListing(id)          { return this._fetch(`/real-estate/${id}`,     { method: "DELETE" }); },
  investInProperty(body)     { return this._fetch("/real-estate/invest",    { method: "POST",   body: JSON.stringify(body) }); },
  getMyREInvestments()       { return this._fetch("/real-estate/my/investments"); },
  getRealEstateStats()       { return this._fetch("/real-estate/stats/summary"); },

  // ── Investment Products ───────────────────────────────────
  getInvestmentProducts(params = {}) {
    const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v != null))).toString();
    return this._fetch(`/investments/products${qs ? "?" + qs : ""}`);
  },
  getInvestmentProduct(id)   { return this._fetch(`/investments/products/${id}`); },
  invest(body)               { return this._fetch("/investments/invest",    { method: "POST",   body: JSON.stringify(body) }); },
  getMyPositions()           { return this._fetch("/investments/positions"); },
  withdrawPosition(id)       { return this._fetch("/investments/withdraw",  { method: "POST",   body: JSON.stringify({ position_id: id }) }); },
  getInvestmentSummary()     { return this._fetch("/investments/summary"); },
};

/* ── Local DB — fallback when backend is unreachable ── */
export const DB = {
  async get(k) {
    try { const r = await window.storage?.get(k); return r ? JSON.parse(r.value) : null; }
    catch { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
  },
  async set(k, v) {
    try { await window.storage?.set(k, JSON.stringify(v)); return true; }
    catch { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
  },
  async del(k) {
    try { await window.storage?.delete(k); return true; }
    catch { try { localStorage.removeItem(k); return true; } catch { return false; } }
  },
};
