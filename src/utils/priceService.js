/* ════════════════════════════════════════════════════════
   PRICE SERVICE — Multi-source live price engine
   Sources:
     • Frankfurter / ExchangeRate-API  → Forex
     • Backend /api/prices/metals      → XAU / XAG / XPT / XPD  (no allorigins)
     • CoinGecko                        → Crypto (30s cache)
     • Backend /api/prices/indices      → Indices / Energy  (no allorigins)
     • Binance WebSocket                → Crypto real-time (caller's responsibility)
════════════════════════════════════════════════════════ */

import { API_BASE } from "./api.js";

const _cache = new Map();
const TTL_FX     = 60_000;    // 1 min
const TTL_METALS = 300_000;   // 5 min
const TTL_CRYPTO = 30_000;    // 30 s
const TTL_INDEX  = 60_000;    // 1 min

/* ── helpers ── */
const cached = (key, ttl) => {
  const c = _cache.get(key);
  return c && (Date.now() - c.ts) < ttl ? c.data : null;
};
const store = (key, data) => { _cache.set(key, { data, ts: Date.now() }); return data; };

/* ── Forex: Frankfurter → ExchangeRate-API fallback ── */
const FX_CURRENCIES =
  "EUR,GBP,JPY,AUD,CAD,CHF,NZD,SGD,HKD,NOK,SEK,DKK,PLN,HUF,CZK," +
  "TRY,ZAR,MXN,BRL,INR,CNH,KRW,TWD,THB,MYR,IDR,PHP,ILS,AED,SAR,EGP,NGN,PKR";

export async function fetchFXRates() {
  const hit = cached("fx", TTL_FX); if (hit) return hit;
  try {
    const r = await fetch(
      `https://api.frankfurter.app/latest?from=USD&to=${FX_CURRENCIES}`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (r.ok) return store("fx", (await r.json()).rates);
  } catch {}
  try {
    const r2 = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(6000) });
    if (r2.ok) return store("fx", (await r2.json()).rates);
  } catch {}
  return null;
}

/* ── Metals: via backend proxy (no allorigins) ── */
export async function fetchMetalPrices() {
  const hit = cached("metals", TTL_METALS); if (hit) return hit;
  try {
    const r = await fetch(`${API_BASE}/prices/metals`, { signal: AbortSignal.timeout(8000) });
    if (r.ok) return store("metals", await r.json());
  } catch {}
  return null;
}

/* ── Crypto: CoinGecko ── */
export const COINGECKO_IDS = {
  "BTC/USD":  "bitcoin",       "ETH/USD":   "ethereum",
  "BNB/USD":  "binancecoin",   "SOL/USD":   "solana",
  "XRP/USD":  "ripple",        "ADA/USD":   "cardano",
  "AVAX/USD": "avalanche-2",   "DOT/USD":   "polkadot",
  "LINK/USD": "chainlink",     "DOGE/USD":  "dogecoin",
  "MATIC/USD":"matic-network", "SHIB/USD":  "shiba-inu",
  "LTC/USD":  "litecoin",      "UNI/USD":   "uniswap",
  "ATOM/USD": "cosmos",        "ICP/USD":   "internet-computer",
};
const CG_REV = Object.fromEntries(Object.entries(COINGECKO_IDS).map(([p, id]) => [id, p]));

export async function fetchCryptoPrices() {
  const hit = cached("crypto", TTL_CRYPTO); if (hit) return hit;
  try {
    const ids = Object.values(COINGECKO_IDS).join(",");
    const r = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (r.ok) {
      const d = await r.json();
      const result = {};
      Object.entries(d).forEach(([id, v]) => {
        if (CG_REV[id]) result[CG_REV[id]] = { price: v.usd, pct: +(v.usd_24h_change || 0).toFixed(2) };
      });
      return store("crypto", result);
    }
  } catch {}
  return null;
}

/* ── Indices + Energy: via backend proxy (no allorigins) ── */
export const YAHOO_MAP = {
  US30:   "^DJI",  SPX500: "^GSPC", NAS100: "^NDX",
  GER40:  "^GDAXI",UK100:  "^FTSE", JPN225: "^N225",
  XTIUSD: "CL=F",  XBRUSD: "BZ=F",  XNGUSD: "NG=F",
};

export async function fetchIndexPrices() {
  const hit = cached("indices", TTL_INDEX); if (hit) return hit;
  try {
    const r = await fetch(`${API_BASE}/prices/indices`, { signal: AbortSignal.timeout(10000) });
    if (r.ok) {
      const data = await r.json();
      if (Object.keys(data).length) return store("indices", data);
    }
  } catch {}
  return null;
}

/* ── Historical OHLC — via backend (Binance/Frankfurter/metals) ── */
export async function fetchHistoricalOHLC(symbol, interval = "1h", limit = 200) {
  try {
    const r = await fetch(
      `${API_BASE}/prices/history?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (r.ok) return await r.json();
  } catch {}
  return null;
}

/* ── Binance WebSocket map ── */
export const BINANCE_WS_MAP = {
  btcusdt:  "BTC/USD",  ethusdt:  "ETH/USD",  bnbusdt:  "BNB/USD",
  solusdt:  "SOL/USD",  xrpusdt:  "XRP/USD",  adausdt:  "ADA/USD",
  avaxusdt: "AVAX/USD", dogeusdt: "DOGE/USD", maticusdt:"MATIC/USD",
  linkusdt: "LINK/USD", ltcusdt:  "LTC/USD",  uniusdt:  "UNI/USD",
  atomusdt: "ATOM/USD", dotusdt:  "DOT/USD",
};

/* ── Master price updater ── */
export async function fetchLivePrices(cur) {
  try {
    const [rt, metals, crypto, indices] = await Promise.all([
      fetchFXRates(), fetchMetalPrices(), fetchCryptoPrices(), fetchIndexPrices(),
    ]);
    if (!rt) return null;

    const buildFX = (pair) => {
      const [base, quote] = pair.split("/");
      if (!base || !quote) return null;
      if (base === "USD" && rt[quote])  return +rt[quote].toFixed(["JPY","KRW","IDR"].includes(quote) ? 3 : 5);
      if (quote === "USD" && rt[base])  return +(1 / rt[base]).toFixed(5);
      if (rt[base] && rt[quote])        return +(rt[quote] / rt[base]).toFixed(5);
      return null;
    };

    return cur.map(p => {
      let np = null, livePct = null;

      if (crypto?.[p.pair])        { np = crypto[p.pair].price;  livePct = crypto[p.pair].pct; }
      else if (indices?.[p.pair])  { np = indices[p.pair].price; livePct = indices[p.pair].pct; }
      else if (metals) {
        if      (p.pair === "XAU/USD")              np = metals.XAU;
        else if (p.pair === "XAG/USD")              np = metals.XAG;
        else if (p.pair === "XPT/USD")              np = metals.XPT;
        else if (p.pair === "XPD/USD")              np = metals.XPD;
        else if (p.pair === "XAU/EUR" && rt.EUR)   np = +(metals.XAU / rt.EUR).toFixed(2);
        else if (p.pair === "XAU/GBP" && rt.GBP)   np = +(metals.XAU / rt.GBP).toFixed(2);
        else if (p.pair === "XAU/JPY" && rt.JPY)   np = +(metals.XAU * rt.JPY).toFixed(0);
      }
      if (!np) np = buildFX(p.pair);
      if (!np) return p;

      const pct = livePct !== null
        ? livePct
        : p.price ? +((np - p.price) / p.price * 100).toFixed(2) : 0;
      const sp  = p.spread * (["crypto","index"].includes(p.cat) ? 0.1 : 0.00001);
      const dec = ["major","cross"].includes(p.cat) ? 5 : 3;
      return {
        ...p,
        price: np,
        pct:   Math.abs(pct) > 15 ? p.pct : pct,
        bid:   +(np - sp).toFixed(dec),
        ask:   +(np + sp).toFixed(dec),
        live:  true,
      };
    });
  } catch { return null; }
}
