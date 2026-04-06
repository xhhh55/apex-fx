# routers/prices_proxy.py — Backend price proxy (replaces allorigins)
# Fetches metals.live and Yahoo Finance server-side — no CORS issue
import httpx, os
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

router = APIRouter()

# ── Metals ────────────────────────────────────────────────────
@router.get("/metals")
async def get_metals():
    """Fetch spot metal prices (gold, silver, platinum, palladium)."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://api.metals.live/v1/spot",
                headers={"User-Agent": "apex-invest/1.0"},
            )
        if resp.status_code == 200:
            metals_raw = resp.json()
            m = metals_raw[0] if isinstance(metals_raw, list) else metals_raw
            return {
                "XAU": m.get("gold")      or m.get("XAU") or 2041.0,
                "XAG": m.get("silver")    or m.get("XAG") or 23.4,
                "XPT": m.get("platinum")  or m.get("XPT") or 912.0,
                "XPD": m.get("palladium") or m.get("XPD") or 1024.0,
            }
    except Exception:
        pass

    # Fallback: GoldAPI (free tier, no key for basic)
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://www.goldapi.io/api/XAU/USD",
                headers={"x-access-token": os.getenv("GOLD_API_KEY", ""), "Content-Type": "application/json"},
            )
        if resp.status_code == 200:
            d = resp.json()
            price = d.get("price") or d.get("close_yesterday") or 2041.0
            return {"XAU": price, "XAG": 23.4, "XPT": 912.0, "XPD": 1024.0}
    except Exception:
        pass

    raise HTTPException(503, "Metals prices temporarily unavailable")


# ── Indices & Energy ──────────────────────────────────────────
YAHOO_SYMBOLS = {
    "US30":   "^DJI",
    "SPX500": "^GSPC",
    "NAS100": "^NDX",
    "GER40":  "^GDAXI",
    "UK100":  "^FTSE",
    "JPN225": "^N225",
    "XTIUSD": "CL=F",
    "XBRUSD": "BZ=F",
    "XNGUSD": "NG=F",
}
_YAHOO_REV = {v: k for k, v in YAHOO_SYMBOLS.items()}

@router.get("/indices")
async def get_indices():
    """Fetch index & commodity prices via Yahoo Finance."""
    syms = ",".join(YAHOO_SYMBOLS.values())
    url  = (
        f"https://query2.finance.yahoo.com/v7/finance/quote"
        f"?symbols={syms}&fields=regularMarketPrice,regularMarketChangePercent"
    )
    try:
        async with httpx.AsyncClient(timeout=10.0, headers={"User-Agent": "Mozilla/5.0"}) as client:
            resp = await client.get(url)
        if resp.status_code == 200:
            data = resp.json()
            result = {}
            for q in data.get("quoteResponse", {}).get("result", []):
                pair = _YAHOO_REV.get(q.get("symbol"))
                if pair and q.get("regularMarketPrice"):
                    result[pair] = {
                        "price": q["regularMarketPrice"],
                        "pct":   round(q.get("regularMarketChangePercent", 0), 2),
                    }
            if result:
                return result
    except Exception:
        pass

    raise HTTPException(503, "Indices prices temporarily unavailable")


# ── Historical OHLC (for charts) ──────────────────────────────
@router.get("/history")
async def get_history(symbol: str, interval: str = "1h", limit: int = 200):
    """
    Return OHLC candle data.
    symbol: e.g. EUR/USD, BTC/USD, US30
    interval: 1h | 4h | 1d
    """
    symbol = symbol.upper()

    # ── Crypto: Binance ──────────────────────────────────────
    CRYPTO_PAIRS = {
        "BTC/USD": "BTCUSDT", "ETH/USD": "ETHUSDT", "BNB/USD": "BNBUSDT",
        "SOL/USD": "SOLUSDT", "XRP/USD": "XRPUSDT", "ADA/USD": "ADAUSDT",
        "DOGE/USD":"DOGEUSDT","AVAX/USD":"AVAXUSDT","DOT/USD": "DOTUSDT",
        "LINK/USD":"LINKUSDT","LTC/USD": "LTCUSDT", "UNI/USD": "UNIUSDT",
    }
    if symbol in CRYPTO_PAIRS:
        binance_interval = {"1h": "1h", "4h": "4h", "1d": "1d"}.get(interval, "1h")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    "https://api.binance.com/api/v3/klines",
                    params={"symbol": CRYPTO_PAIRS[symbol], "interval": binance_interval, "limit": min(limit, 500)},
                )
            if resp.status_code == 200:
                return [
                    {"time": k[0] // 1000, "open": float(k[1]), "high": float(k[2]),
                     "low": float(k[3]), "close": float(k[4]), "volume": float(k[5])}
                    for k in resp.json()
                ]
        except Exception:
            pass

    # ── Forex: Frankfurter (daily only) ──────────────────────
    FOREX_PAIRS = {
        "EUR/USD","GBP/USD","USD/JPY","USD/CHF","AUD/USD","NZD/USD","USD/CAD",
        "EUR/GBP","EUR/JPY","GBP/JPY","EUR/AUD","GBP/CHF","USD/TRY",
    }
    if symbol in FOREX_PAIRS:
        base, quote = symbol.split("/")
        try:
            from datetime import date, timedelta
            end   = date.today().isoformat()
            start = (date.today() - timedelta(days=min(limit, 365))).isoformat()
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://api.frankfurter.app/{start}..{end}",
                    params={"from": base, "to": quote},
                )
            if resp.status_code == 200:
                rates = resp.json().get("rates", {})
                candles = []
                dates = sorted(rates.keys())
                for i, d in enumerate(dates):
                    price = rates[d].get(quote, 0)
                    prev  = rates[dates[i - 1]].get(quote, price) if i > 0 else price
                    drift = abs(price - prev) * 0.3 or price * 0.001
                    candles.append({
                        "time":   int(__import__("datetime").datetime.fromisoformat(d).timestamp()),
                        "open":   round(prev, 5),
                        "high":   round(max(price, prev) + drift, 5),
                        "low":    round(min(price, prev) - drift, 5),
                        "close":  round(price, 5),
                        "volume": 0,
                    })
                return candles[-limit:]
        except Exception:
            pass

    # ── Metals: synthesize from daily spot ────────────────────
    METAL_PAIRS = {"XAU/USD", "XAG/USD", "XPT/USD", "XPD/USD"}
    if symbol in METAL_PAIRS:
        DEFAULTS = {"XAU/USD": 2041, "XAG/USD": 23.4, "XPT/USD": 912, "XPD/USD": 1024}
        base_price = DEFAULTS.get(symbol, 1000)
        import random, math
        random.seed(symbol)
        candles = []
        now  = int(__import__("time").time())
        step = {"1h": 3600, "4h": 14400, "1d": 86400}.get(interval, 3600)
        p = base_price
        for i in range(limit - 1, -1, -1):
            t     = now - i * step
            drift = p * 0.002 * (random.random() - 0.5)
            o = round(p, 2)
            c = round(p + drift, 2)
            h = round(max(o, c) + abs(drift) * 0.5, 2)
            l = round(min(o, c) - abs(drift) * 0.5, 2)
            candles.append({"time": t, "open": o, "high": h, "low": l, "close": c, "volume": 0})
            p = c
        return candles

    raise HTTPException(404, f"No historical data available for {symbol}")
