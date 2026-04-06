/* ════════════════════════════════════════════════════════
   AI SERVICE — Unified AI layer
   All AI calls go through proxyAI (backend keeps the API key)
   callAI adds caching + retry logic on top.
════════════════════════════════════════════════════════ */

import { API_BASE, Token } from "./api.js";

export const AI_CACHE_TTL = 5 * 60_000; // 5 min
const CACHE_TTL = AI_CACHE_TTL;
const _cache    = new Map();
const _ts       = new Map();

/* ── Low-level proxy (single call, no cache) ── */
export const proxyAI = async (prompt, maxTokens = 500, system = null) => {
  try {
    const headers = { "Content-Type": "application/json" };
    const tok = Token.get();
    if (tok) headers.Authorization = `Bearer ${tok}`;
    const res = await fetch(`${API_BASE}/ai/analyze`, {
      method:  "POST",
      headers,
      body:    JSON.stringify({ prompt, max_tokens: maxTokens, ...(system && { system }) }),
      signal:  AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).text || "";
  } catch { return ""; }
};

/* ── Cached + retry wrapper ── */
export const callAI = async (key, prompt, maxTokens = 500, retries = 2) => {
  const now = Date.now();
  if (_cache.has(key) && (now - (_ts.get(key) || 0)) < CACHE_TTL) return _cache.get(key);
  for (let i = 0; i <= retries; i++) {
    try {
      const text = await proxyAI(prompt, maxTokens);
      if (text) { _cache.set(key, text); _ts.set(key, now); return text; }
    } catch (e) {
      if (i < retries) await new Promise(r => setTimeout(r, 800 * (i + 1)));
      else throw e;
    }
  }
  throw new Error("AI call failed");
};

/* ── Market overview analysis ── */
export const runMarketAI = (prices, lang) => {
  const isAr   = lang === "ar";
  const hour   = new Date().getHours();
  const session = hour >= 8 && hour < 17 ? "London"
    : hour >= 13 && hour < 22 ? "New York"
    : hour >= 0  && hour < 9  ? "Tokyo" : "Sydney";
  const summary = prices.slice(0, 8)
    .map(p => `${p.pair}: ${p.price} (${p.pct > 0 ? "+" : ""}${p.pct}%)`).join(", ");
  const key = `market_${lang}_${Math.floor(Date.now() / CACHE_TTL)}`;
  const prompt = isAr
    ? `أنت محلل فوركس محترف. الجلسة: ${session}. الأسعار: ${summary}. قدّم تحليلاً في 4-5 جمل: الاتجاه السائد، أبرز حركة، فرصة محتملة، مستوى المخاطرة.`
    : `Professional forex analyst. Session: ${session}. Prices: ${summary}. 4-5 sentences: dominant trend, key move, trade opportunity, risk level.`;
  return callAI(key, prompt, 400);
};

/* ── Pair sentiment ── */
export const getSentiment = async (pair) => {
  try {
    const key    = `sentiment_${pair}_${Math.floor(Date.now() / (10 * 60_000))}`;
    const prompt = `Forex sentiment for ${pair}. Reply ONLY valid JSON (no markdown): {"score":-1to1,"confidence":0-100,"recommendation":"BULLISH"|"BEARISH"|"NEUTRAL","reason":"2-3 words"}`;
    const text   = await callAI(key, prompt, 120);
    const m      = text.match(/\{[\s\S]*?\}/);
    if (m) {
      const d = JSON.parse(m[0]);
      return { score: d.score || 0, confidence: d.confidence || 50,
               recommendation: d.recommendation || "NEUTRAL", reason: d.reason || "N/A" };
    }
  } catch {}
  return { score: 0, confidence: 50, recommendation: "NEUTRAL", reason: "N/A" };
};

/* ── AI broker recommendation ── */
export const getAIBrokerRec = async (prefs, brokers, lang) => {
  const isAr = lang === "ar";
  try {
    const bList  = brokers.map(b =>
      `${b.name}: rating=${b.rating}, spread=${b.spread}, execSpeed=${b.execSpeed}ms, ` +
      `minDeposit=$${b.minDeposit}, regulation=${b.regulation.join(",")}, islamic=${b.islamicAccount}`
    ).join("\n");
    const prompt = `User: style=${prefs.tradingStyle}, deposit=${prefs.minDeposit}, regulator=${prefs.preferredRegulator}, islamic=${prefs.islamic}\nBrokers:\n${bList}\nReply ONLY JSON: {"broker":"name","reason":"${isAr ? "سبب واضح" : "clear reason"}","match":0-100}`;
    const text   = await proxyAI(prompt, 200);
    const m      = text.match(/\{[\s\S]*\}/);
    if (m) {
      const rec    = JSON.parse(m[0]);
      const broker = brokers.find(b => b.name.toLowerCase().includes((rec.broker || "").toLowerCase()));
      if (broker) return { broker, reason: rec.reason, match: rec.match };
    }
  } catch {}
  return { broker: brokers[0], reason: isAr ? "أفضل تقييم وأداء عام" : "Top rated overall", match: 87 };
};

/* ── Agent prompts ── */
export const AI_AGENT_PROMPTS = {
  priceAgent: (pair, price, pct, cat, lang) => {
    const isAr = lang === "ar";
    return isAr
      ? `أنت محلل أسعار في ${cat}. الزوج: ${pair} | السعر: ${price} | التغير: ${pct >= 0 ? "+" : ""}${pct}%\nقدّم تحليلاً في 4 نقاط: 1.الاتجاه 2.دعم/مقاومة 3.إشارة الدخول 4.TP/SL`
      : `Price analyst for ${cat}. Pair: ${pair} | Price: ${price} | Change: ${pct >= 0 ? "+" : ""}${pct}%\n4-point analysis: 1.Trend 2.S/R levels 3.Entry signal 4.TP/SL`;
  },
  riskAgent: (portfolio, trade, lang) => {
    const isAr = lang === "ar";
    return isAr
      ? `مدير مخاطر. الرصيد: $${portfolio?.balance || 10000}\nالصفقة: ${JSON.stringify(trade)}\n3 نقاط: 1.نسبة الخطر 2.حجم اللوت المناسب 3.توصيتك`
      : `Risk manager. Balance: $${portfolio?.balance || 10000}\nTrade: ${JSON.stringify(trade)}\n3 points: 1.Risk% 2.Lot size rec 3.Execute?`;
  },
  marketResearcher: (asset, assetType, lang) => {
    const isAr = lang === "ar";
    return isAr
      ? `باحث سوق. الأصل: ${asset} (${assetType})\n5 نقاط: 1.الأساسيات 2.عوامل الأسبوع 3.شعور السوق 4.المخاطر 5.التوقع 7-14 يوم`
      : `Market researcher. Asset: ${asset} (${assetType})\n5 points: 1.Fundamentals 2.Week factors 3.Sentiment 4.Risks 5.7-14d outlook`;
  },
  portfolioAdvisor: (portfolio, lang) => {
    const isAr = lang === "ar";
    const trades = (portfolio?.trades || []).slice(0, 5);
    return isAr
      ? `مستشار محفظة. الرصيد: $${portfolio?.balance}\nالصفقات: ${JSON.stringify(trades)}\n4 نقاط: 1.تقييم الأداء 2.التنويع 3.أكبر خطر 4.توصية فورية`
      : `Portfolio advisor. Balance: $${portfolio?.balance}\nTrades: ${JSON.stringify(trades)}\n4 points: 1.Performance 2.Diversification 3.Biggest risk 4.Action item`;
  },
};
