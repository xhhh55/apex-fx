/* ════════════════════════════════════════════════════════
   NEWS SERVICE — Live financial news via RSS + AI sentiment
   Sources: Reuters, FT, MarketWatch, CoinDesk (via allorigins)
════════════════════════════════════════════════════════ */

const _cache = new Map();
const TTL = 10 * 60 * 1000; // 10 min

const PROXY = (url) =>
  `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

// RSS sources — no API key required
export const RSS_FEEDS = [
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=EURUSD=X,GBPUSD=X,XAUUSD=X&region=US&lang=en-US", cat: "forex" },
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=BTC-USD,ETH-USD,BNB-USD&region=US&lang=en-US", cat: "crypto" },
  { url: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^DJI,^GSPC,^NDX&region=US&lang=en-US", cat: "stocks" },
  { url: "https://coindesk.com/arc/outboundfeeds/rss/", cat: "crypto" },
];

/* ── Parse RSS XML to article array ── */
function parseRSS(xml, cat) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0, 8);
    return items.map((item, i) => {
      const title   = item.querySelector("title")?.textContent?.trim() || "";
      const desc    = item.querySelector("description")?.textContent?.replace(/<[^>]*>/g,"").trim() || "";
      const link    = item.querySelector("link")?.textContent?.trim() || "#";
      const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
      const source  = item.closest("channel")?.querySelector("title")?.textContent?.trim() || "Reuters";
      const mins    = pubDate ? Math.floor((Date.now() - new Date(pubDate)) / 60000) : (i + 1) * 12;
      return { id: `${cat}_${i}_${Date.now()}`, title, summary: desc.slice(0, 160), link, source, cat, mins, pubDate };
    }).filter(a => a.title);
  } catch { return []; }
}

/* ── Fetch one RSS feed ── */
async function fetchFeed(feed) {
  try {
    const r = await fetch(PROXY(feed.url), { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const json = await r.json();
    return parseRSS(json.contents, feed.cat);
  } catch { return []; }
}

/* ── Sentiment classifier (no AI call — keyword based, fast) ── */
const BULLISH_KW = ["surge","rally","soar","jump","gain","rise","bull","high","record","break","above","strong","growth","up"];
const BEARISH_KW = ["crash","fall","drop","plunge","sink","bear","low","fear","below","weak","loss","down","decline","sell"];

export function classifySentiment(text) {
  const t = text.toLowerCase();
  const b = BULLISH_KW.filter(w => t.includes(w)).length;
  const bear = BEARISH_KW.filter(w => t.includes(w)).length;
  if (b > bear + 1) return "bullish";
  if (bear > b + 1) return "bearish";
  return "neutral";
}

/* ── Detect relevant pairs from headline ── */
const PAIR_KEYWORDS = {
  "EUR/USD": ["euro","eur","eurusd","ecb","eurozone"],
  "GBP/USD": ["pound","gbp","sterling","gbpusd","boe","uk","britain"],
  "USD/JPY": ["yen","jpy","usdjpy","boj","japan"],
  "XAU/USD": ["gold","xauusd","bullion","precious"],
  "BTC/USD": ["bitcoin","btc","crypto","cryptocurrency","satoshi"],
  "ETH/USD": ["ethereum","eth","ether","defi"],
  "NAS100":  ["nasdaq","tech stock","nasdaq100","ndx"],
  "SPX500":  ["s&p","spx","sp500","dow jones","us market"],
};

export function detectPairs(text) {
  const t = text.toLowerCase();
  return Object.entries(PAIR_KEYWORDS)
    .filter(([, kws]) => kws.some(kw => t.includes(kw)))
    .map(([pair]) => pair)
    .slice(0, 3);
}

/* ── Master fetch — all feeds, deduplicated ── */
export async function fetchLiveNews() {
  const hit = _cache.get("news");
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));
  const all = results.flatMap(r => r.status === "fulfilled" ? r.value : []);

  // deduplicate by title similarity
  const seen = new Set();
  const deduped = all.filter(a => {
    const key = a.title.slice(0, 40).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // enrich with sentiment + pairs
  const enriched = deduped.map(a => ({
    ...a,
    sentiment: classifySentiment(a.title + " " + a.summary),
    pairs:     detectPairs(a.title + " " + a.summary),
  })).sort((a, b) => a.mins - b.mins); // newest first

  if (enriched.length > 0) {
    _cache.set("news", { data: enriched, ts: Date.now() });
  }
  return enriched;
}

/* ── Single article AI analysis (called on demand) ── */
export async function analyzeArticle(article, lang, proxyAI) {
  const isAr = lang === "ar";
  const prompt = isAr
    ? `خبر مالي: "${article.title}". في جملتين فقط: 1) الأثر على ${article.pairs?.join("/") || "السوق"} 2) توصية قصيرة (شراء/بيع/انتظر)`
    : `Financial news: "${article.title}". In 2 sentences: 1) Impact on ${article.pairs?.join("/") || "markets"} 2) Quick call (BUY/SELL/WAIT)`;
  return proxyAI(prompt, 120);
}
