/* ════════════════════════════════════════════════════════
   src/api/prices.js — Live price + historical data
   All data routed through priceService (backend proxy).
   No hardcoded API keys, no allorigins, no placeholders.
════════════════════════════════════════════════════════ */
export { fetchLivePrices, fetchHistoricalOHLC, BINANCE_WS_MAP, COINGECKO_IDS } from "../utils/priceService.js";

import { API_BASE } from "../utils/api.js";

/* ── Supported symbols ── */
export const SYMBOLS = [
  "EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD","USD/CHF","NZD/USD",
  "EUR/GBP","EUR/JPY","GBP/JPY","AUD/JPY","EUR/AUD","GBP/AUD","USD/TRY",
  "XAU/USD","XAG/USD","XPT/USD",
  "BTC/USD","ETH/USD","BNB/USD","SOL/USD","XRP/USD","DOGE/USD","AVAX/USD",
  "US30","SPX500","NAS100","GER40","UK100","JPN225",
  "XTIUSD","XBRUSD","XNGUSD",
];

/**
 * Fetch OHLC candle data for chart display.
 * @param {string} symbol  e.g. "EUR/USD", "BTC/USD"
 * @param {string} interval "1h" | "4h" | "1d"
 * @param {number} limit   number of candles
 * @returns {Array<{time,open,high,low,close,volume}>|null}
 */
export async function fetchHistorical(symbol, interval = "1h", limit = 200) {
  try {
    const r = await fetch(
      `${API_BASE}/prices/history?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=${limit}`,
      { signal: AbortSignal.timeout(12_000) }
    );
    if (r.ok) return await r.json();
  } catch {}
  return null;
}
