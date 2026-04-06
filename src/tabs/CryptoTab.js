/* eslint-disable */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CRYPTO_COINS, CRYPTO_IDS, CRYPTO_CATS } from '../data/cryptoData';
import { genSpark } from '../utils/indicators';
import { proxyAI } from '../utils/ai';

// ── Color & style constants ───────────────────────────────────────────────────
const GREEN = "#4ADE80";
const RED   = "#E05252";
const SUB   = "rgba(238,232,218,0.4)";
const GLASS = "rgba(255,255,255,0.025)";
const GLASS2 = "rgba(255,255,255,0.05)";

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
const Spark = ({ data, up, w = 80, h = 28 }) => {
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 0.001;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) + 2}`).join(" ");
  const col = up ? GREEN : RED;
  const uid = `sg${up ? "u" : "d"}${Math.random().toString(36).slice(2, 6)}`;
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.35" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${uid})`} />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Donut chart SVG ───────────────────────────────────────────────────────────
const Donut = ({ slices, size = 140 }) => {
  const r = size / 2 - 12, cx = size / 2, cy = size / 2;
  let cumAngle = -Math.PI / 2;
  const paths = slices.map((s, i) => {
    const angle = (s.pct / 100) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle), y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle), y2 = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return <path key={i} d={d} fill={s.color} opacity="0.85" stroke="#0a0a0f" strokeWidth="1.5" />;
  });
  return (
    <svg width={size} height={size}>
      {paths}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#0a0a0f" />
    </svg>
  );
};

// ── Format helpers ────────────────────────────────────────────────────────────
const fmtPrice = (p) => {
  if (!p && p !== 0) return "—";
  if (p >= 1000) return `$${p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.0001) return `$${p.toFixed(6)}`;
  return `$${p.toExponential(3)}`;
};
const fmtPct = (p) => (p >= 0 ? `+${p.toFixed(2)}%` : `${p.toFixed(2)}%`);
const fmtBig = (n) => {
  if (!n) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
};

// ── Arabic label map ──────────────────────────────────────────────────────────
const T = {
  markets:    { en: "Markets",     ar: "الأسواق" },
  defi:       { en: "DeFi",        ar: "ديفاي" },
  trending:   { en: "Trending",    ar: "الرائج" },
  portfolio:  { en: "Portfolio",   ar: "محفظتي" },
  signals:    { en: "AI Signals",  ar: "إشارات AI" },
  heatmap:    { en: "🟩 Heatmap",   ar: "🟩 خريطة حرارية" },
  whales:     { en: "🐋 Whales",    ar: "🐋 الحيتان" },
  price:      { en: "Price",       ar: "السعر" },
  h24:        { en: "24h",         ar: "٢٤ ساعة" },
  d7:         { en: "7d",          ar: "٧ أيام" },
  mcap:       { en: "MCap",        ar: "القيمة السوقية" },
  volume:     { en: "Volume",      ar: "الحجم" },
  chart:      { en: "Chart",       ar: "الرسم" },
  add:        { en: "Add",         ar: "أضف" },
  del:        { en: "Delete",      ar: "حذف" },
  buyPrice:   { en: "Buy Price",   ar: "سعر الشراء" },
  qty:        { en: "Quantity",    ar: "الكمية" },
  fearGreed:  { en: "Fear & Greed",ar: "خوف وجشع" },
  btcDom:     { en: "BTC Dom.",    ar: "هيمنة BTC" },
  totalMcap:  { en: "Total MCap",  ar: "إجمالي القيمة" },
  gas:        { en: "ETH Gas",     ar: "غاز ETH" },
  search:     { en: "Search coins…", ar: "ابحث عن عملة…" },
  analyze:    { en: "AI Analysis", ar: "تحليل AI" },
  refreshSig: { en: "Refresh Signals", ar: "تحديث الإشارات" },
  analyzeMarket:{ en: "Analyze Market", ar: "تحليل السوق" },
  whyTrending:{ en: "Why Trending?", ar: "لماذا رائج؟" },
  calcYield:  { en: "Calculate Yield", ar: "احسب العائد" },
  stakeNow:   { en: "Stake Now",   ar: "ابدأ الإيداع" },
  amount:     { en: "Amount ($)",  ar: "المبلغ ($)" },
  apy:        { en: "APY %",       ar: "عائد سنوي %" },
  daily:      { en: "Daily",       ar: "يومياً" },
  monthly:    { en: "Monthly",     ar: "شهرياً" },
  yearly:     { en: "سنوياً",      ar: "سنوياً" },
  totalVal:   { en: "Total Value", ar: "القيمة الكلية" },
  totalPnl:   { en: "Total P&L",   ar: "إجمالي الربح/الخسارة" },
  best:       { en: "Best",        ar: "الأفضل" },
  worst:      { en: "Worst",       ar: "الأسوأ" },
  loading:    { en: "Loading…",    ar: "جارٍ التحميل…" },
  live:       { en: "Live",        ar: "مباشر" },
  updated:    { en: "Updated",     ar: "آخر تحديث" },
  sentiment:  { en: "Market Sentiment", ar: "مزاج السوق" },
  bullish:    { en: "BULLISH",     ar: "صاعد" },
  bearish:    { en: "BEARISH",     ar: "هابط" },
  neutral:    { en: "NEUTRAL",     ar: "محايد" },
  cooldown:   { en: "Cooldown",    ar: "وقت الانتظار" },
  noHoldings: { en: "No holdings yet. Add your first coin above.", ar: "لا توجد أصول. أضف أول عملة." },
  gasfee:     { en: "⛽ Gas Fees", ar: "⛽ رسوم الغاز" },
  coin:       { en: "Coin",        ar: "العملة" },
  allCats:    { en: "All",         ar: "الكل" },
  rank:       { en: "Rank",        ar: "الترتيب" },
  selectCoin: { en: "Select coin", ar: "اختر عملة" },
  ath:        { en: "ATH",         ar: "أعلى سعر" },
  high52:     { en: "52w High",    ar: "أعلى ٥٢ أسبوع" },
  low52:      { en: "52w Low",     ar: "أدنى ٥٢ أسبوع" },
};
const t = (key, isAr) => T[key] ? (isAr ? T[key].ar : T[key].en) : key;

// ── DeFi static data ──────────────────────────────────────────────────────────
const DEFI_PROTOCOLS = [
  { name: "Lido",         apy: 3.8,  tvl: "$35B",  chain: "🔷 ETH",  risk: "Low",    token: "stETH", cat: "staking" },
  { name: "Aave",         apy: 5.2,  tvl: "$12B",  chain: "🔷 ETH",  risk: "Low",    token: "USDC",  cat: "lending" },
  { name: "Curve",        apy: 4.9,  tvl: "$7B",   chain: "🔷 ETH",  risk: "Medium", token: "DAI",   cat: "lending" },
  { name: "Binance Earn", apy: 4.2,  tvl: "$20B",  chain: "🟡 BNB",  risk: "Low",    token: "BNB",   cat: "staking" },
  { name: "Marinade",     apy: 6.1,  tvl: "$3B",   chain: "🟣 SOL",  risk: "Low",    token: "mSOL",  cat: "staking" },
  { name: "SundaeSwap",   apy: 3.0,  tvl: "$1B",   chain: "🔵 ADA",  risk: "Medium", token: "ADA",   cat: "staking" },
  { name: "Polkadot",     apy: 12,   tvl: "$8B",   chain: "🩷 DOT",  risk: "Medium", token: "DOT",   cat: "staking" },
  { name: "Cosmos Hub",   apy: 18,   tvl: "$3B",   chain: "⚫ ATOM", risk: "Medium", token: "ATOM",  cat: "staking" },
  { name: "BENQI",        apy: 8.0,  tvl: "$2B",   chain: "🔴 AVAX", risk: "Medium", token: "AVAX",  cat: "staking" },
  { name: "Compound",     apy: 4.8,  tvl: "$3B",   chain: "🔷 ETH",  risk: "Low",    token: "USDT",  cat: "lending" },
  { name: "GMX",          apy: 14.5, tvl: "$1.5B", chain: "🔵 ARB",  risk: "High",   token: "GLP",   cat: "perps" },
  { name: "Pendle",       apy: 22.0, tvl: "$0.5B", chain: "🔷 ETH",  risk: "High",   token: "PT-ETH",cat: "yield" },
];
const RISK_COLORS = { Low: GREEN, Medium: "#F59E0B", High: RED };

// ── Top 8 coins for signals ───────────────────────────────────────────────────
const TOP8 = ["BTC","ETH","SOL","BNB","XRP","ADA","AVAX","LINK"];

// ── Main component ────────────────────────────────────────────────────────────
const CryptoTab = ({ theme, lang, onTrade }) => {
  // Resolve trading pair from coin symbol
  const toTradePair = (sym) => {
    const MAP = {
      BTC:"BTC/USD",ETH:"ETH/USD",BNB:"BNB/USD",SOL:"SOL/USD",XRP:"XRP/USD",
      ADA:"ADA/USD",DOGE:"DOGE/USD",AVAX:"AVAX/USD",DOT:"DOT/USD",LINK:"LINK/USD",
      MATIC:"MATIC/USD",UNI:"UNI/USD",ATOM:"ATOM/USD",LTC:"LTC/USD",BCH:"BCH/USD",
      SHIB:"SHIB/USD",TRX:"TRX/USD",TON:"TON/USD",NEAR:"NEAR/USD",APT:"APT/USD",
      ARB:"ARB/USD",OP:"OP/USD",INJ:"INJ/USD",SUI:"SUI/USD",
    };
    return MAP[sym] || `${sym}/USD`;
  };
  const handleTrade = (sym) => onTrade && onTrade(toTradePair(sym));
  const isAr = lang === "ar";
  const dir  = isAr ? "rtl" : "ltr";
  const C = {
    primary: theme.primary,
    border: `${theme.primary}22`,
    text: "#EEE8DA",
  };

  // ── State ────────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState("markets");
  const [coins,        setCoins]        = useState(CRYPTO_COINS);
  const [, setLiveData]                 = useState({});      // id → CoinGecko row
  const [globalData,   setGlobalData]   = useState({ mcap: null, btcDom: null, fearGreed: null, gas: "24 gwei" });
  const [fetchStatus,  setFetchStatus]  = useState("loading");
  const [lastUpdate,   setLastUpdate]   = useState(null);
  const [sort,         setSort]         = useState("rank");
  const [search,       setSearch]       = useState("");
  const [category,     setCategory]     = useState("All");
  const [selCoin,      setSelCoin]      = useState(null);
  const [aiTip,        setAiTip]        = useState("");
  const [aiLoading,    setAiLoading]    = useState(false);
  const [trendData,    setTrendData]    = useState({ coins: [], nfts: [] });
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendAI,      setTrendAI]      = useState({});
  const [portfolio,    setPortfolio]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("apex:crypto:portfolio") || "[]"); } catch { return []; }
  });
  const [pForm,        setPForm]        = useState({ sym: "", qty: "", buyPrice: "" });
  const [signals,      setSignals]      = useState([]);
  const [sigLoading,   setSigLoading]   = useState(false);
  const [sigSentiment, setSigSentiment] = useState(null);
  const [sigCooldown,  setSigCooldown]  = useState(0);
  const [yieldCalc,    setYieldCalc]    = useState({ amount: "", apy: "" });
  const [stakeModal,   setStakeModal]   = useState(null);
  const cooldownRef = useRef(null);
  const sparks = useMemo(() => coins.reduce((a, c) => { a[c.sym] = genSpark(c.price, 30); return a; }, {}), []);

  // ── Fetch CoinGecko markets ───────────────────────────────────────────────
  const fetchMarkets = useCallback(async () => {
    try {
      const ids = (CRYPTO_IDS || []).slice(0, 50).map(c => c.id).join(",");
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&sparkline=true&price_change_percentage=24h,7d`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const map = {};
      data.forEach(d => { map[d.symbol.toUpperCase()] = d; });
      setLiveData(map);
      setCoins(prev => prev.map(c => {
        const d = map[c.sym];
        if (!d) return c;
        return { ...c, price: d.current_price, pct: d.price_change_percentage_24h || c.pct,
          pct7d: d.price_change_percentage_7d_in_currency || 0,
          mcapRaw: d.market_cap, volRaw: d.total_volume,
          mcap: fmtBig(d.market_cap), vol24: fmtBig(d.total_volume),
          sparkline: d.sparkline_in_7d?.price || null,
          ath: d.ath, high52: d.high_24h * 52, low52: d.low_24h, athDate: d.ath_date };
      }));
      setFetchStatus("live");
      setLastUpdate(new Date());
    } catch (e) {
      setFetchStatus("error");
    }
  }, []);

  // ── Fetch global stats ────────────────────────────────────────────────────
  const fetchGlobal = useCallback(async () => {
    try {
      const [gRes, fgRes] = await Promise.allSettled([
        fetch("https://api.coingecko.com/api/v3/global", { signal: AbortSignal.timeout(8000) }),
        fetch("https://api.alternative.me/fng/?limit=1",  { signal: AbortSignal.timeout(8000) }),
      ]);
      let mcap = null, btcDom = null, fearGreed = null;
      if (gRes.status === "fulfilled" && gRes.value.ok) {
        const gd = await gRes.value.json();
        mcap   = fmtBig(gd.data?.total_market_cap?.usd);
        btcDom = (gd.data?.market_cap_percentage?.btc || 0).toFixed(1) + "%";
      }
      if (fgRes.status === "fulfilled" && fgRes.value.ok) {
        const fd = await fgRes.value.json();
        fearGreed = fd.data?.[0]?.value || null;
      }
      setGlobalData(prev => ({ ...prev, mcap, btcDom, fearGreed }));
    } catch {}
  }, []);

  // ── Fetch trending ────────────────────────────────────────────────────────
  const fetchTrending = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/search/trending", { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setTrendData({ coins: d.coins || [], nfts: d.nfts || [] });
    } catch {}
    setTrendLoading(false);
  }, []);

  useEffect(() => {
    fetchMarkets();
    fetchGlobal();
    const iv = setInterval(fetchMarkets, 60000);
    return () => clearInterval(iv);
  }, [fetchMarkets, fetchGlobal]);

  useEffect(() => {
    if (activeTab === "trending" && !trendData.coins.length) fetchTrending();
  }, [activeTab, fetchTrending, trendData.coins.length]);

  // ── Persist portfolio ─────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("apex:crypto:portfolio", JSON.stringify(portfolio));
  }, [portfolio]);

  // ── Cooldown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (sigCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setSigCooldown(s => { if (s <= 1) { clearInterval(cooldownRef.current); return 0; } return s - 1; });
      }, 1000);
    }
    return () => clearInterval(cooldownRef.current);
  }, [sigCooldown]);

  // ── AI coin analysis ──────────────────────────────────────────────────────
  const handleAI = async (coin) => {
    setAiLoading(true);
    setAiTip("");
    const p = isAr
      ? `محلل عملات رقمية. العملة: ${coin.name} (${coin.sym}) | السعر: ${fmtPrice(coin.price)} | التغير ٢٤ساعة: ${fmtPct(coin.pct)}. قدّم تحليلاً في ٤ نقاط: ١.الاتجاه ٢.دعم/مقاومة ٣.إشارة ٤.مخاطر`
      : `Crypto analyst. Coin: ${coin.name} (${coin.sym}) | Price: ${fmtPrice(coin.price)} | 24h: ${fmtPct(coin.pct)}. 4-point analysis: 1.Trend 2.Support/Resistance 3.Signal 4.Risks`;
    const r = await proxyAI(p, 400);
    setAiTip(r || (isAr ? "لم يتوفر تحليل." : "No analysis available."));
    setAiLoading(false);
  };

  // ── AI market signals ─────────────────────────────────────────────────────
  const handleSignals = async () => {
    if (sigCooldown > 0) return;
    setSigLoading(true);
    const top = coins.filter(c => TOP8.includes(c.sym)).slice(0, 8);
    const summary = top.map(c => `${c.sym}:${fmtPrice(c.price)}(${fmtPct(c.pct)})`).join(", ");
    const prompt = `You are a crypto trading AI. Current prices: ${summary}. Reply ONLY valid JSON array: [{"sym":"BTC","signal":"BUY|SELL|HOLD","confidence":0-100,"reason":"brief reason"},…] for each coin, then add a final object {"sym":"MARKET","sentiment":"BULLISH|BEARISH|NEUTRAL","reason":"brief"}`;
    const text = await proxyAI(prompt, 800);
    try {
      const m = text.match(/\[[\s\S]*\]/);
      if (m) {
        const arr = JSON.parse(m[0]);
        const mkt = arr.find(x => x.sym === "MARKET");
        setSigSentiment(mkt || null);
        setSignals(arr.filter(x => x.sym !== "MARKET"));
      }
    } catch {}
    setSigLoading(false);
    setSigCooldown(1800);
  };

  // ── AI trending analysis ──────────────────────────────────────────────────
  const handleTrendAI = async (coin) => {
    const key = coin.item?.id || coin.item?.name;
    setTrendAI(prev => ({ ...prev, [key]: { loading: true, text: "" } }));
    const p = isAr
      ? `لماذا عملة ${coin.item?.name} رائجة الآن؟ أجب في ٣ جمل.`
      : `Why is ${coin.item?.name} (${coin.item?.symbol}) trending in crypto right now? 3 concise sentences.`;
    const r = await proxyAI(p, 250);
    setTrendAI(prev => ({ ...prev, [key]: { loading: false, text: r || "No data." } }));
  };

  // ── Coin table data ───────────────────────────────────────────────────────
  const displayCoins = useMemo(() => {
    let list = [...coins];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(s) || c.sym.toLowerCase().includes(s));
    }
    if (category !== "All" && CRYPTO_CATS) {
      const cat = CRYPTO_CATS[category] || [];
      if (cat.length) list = list.filter(c => cat.includes(c.sym));
    }
    list.sort((a, b) => {
      if (sort === "rank")   return (a.rank || 999) - (b.rank || 999);
      if (sort === "pct24h") return (b.pct || 0) - (a.pct || 0);
      if (sort === "pct7d")  return (b.pct7d || 0) - (a.pct7d || 0);
      if (sort === "mcap")   return (b.mcapRaw || 0) - (a.mcapRaw || 0);
      if (sort === "volume") return (b.volRaw || 0) - (a.volRaw || 0);
      return 0;
    });
    return list;
  }, [coins, search, category, sort]);

  // ── Portfolio calculations ────────────────────────────────────────────────
  const portStats = useMemo(() => {
    if (!portfolio.length) return null;
    let totalVal = 0, totalCost = 0;
    const enriched = portfolio.map(h => {
      const coin = coins.find(c => c.sym === h.sym);
      const cur  = coin?.price || 0;
      const val  = cur * h.qty;
      const cost = h.buyPrice * h.qty;
      const pnl  = val - cost;
      const pnlPct = cost ? (pnl / cost) * 100 : 0;
      totalVal  += val;
      totalCost += cost;
      return { ...h, cur, val, cost, pnl, pnlPct, color: coin?.color || "#888" };
    });
    const totalPnl = totalVal - totalCost;
    const totalPnlPct = totalCost ? (totalPnl / totalCost) * 100 : 0;
    const sorted = [...enriched].sort((a, b) => b.pnlPct - a.pnlPct);
    const donut = totalVal > 0 ? enriched.map(h => ({ color: h.color, pct: (h.val / totalVal) * 100 })) : [];
    return { enriched, totalVal, totalPnl, totalPnlPct, best: sorted[0], worst: sorted[sorted.length - 1], donut };
  }, [portfolio, coins]);

  // ── Portfolio handlers ────────────────────────────────────────────────────
  const addHolding = () => {
    if (!pForm.sym || !pForm.qty || !pForm.buyPrice) return;
    const existing = portfolio.findIndex(h => h.sym === pForm.sym);
    if (existing >= 0) {
      const updated = [...portfolio];
      updated[existing] = { ...updated[existing], qty: parseFloat(pForm.qty), buyPrice: parseFloat(pForm.buyPrice) };
      setPortfolio(updated);
    } else {
      setPortfolio(prev => [...prev, { sym: pForm.sym, qty: parseFloat(pForm.qty), buyPrice: parseFloat(pForm.buyPrice) }]);
    }
    setPForm({ sym: "", qty: "", buyPrice: "" });
  };
  const removeHolding = (sym) => setPortfolio(prev => prev.filter(h => h.sym !== sym));

  // ── Yield calc ────────────────────────────────────────────────────────────
  const yieldResults = useMemo(() => {
    const amt = parseFloat(yieldCalc.amount) || 0;
    const apy = parseFloat(yieldCalc.apy) || 0;
    if (!amt || !apy) return null;
    const daily   = amt * (apy / 100) / 365;
    const monthly = daily * 30;
    const yearly  = amt * (apy / 100);
    return { daily, monthly, yearly };
  }, [yieldCalc]);

  // ── Fear & Greed color ────────────────────────────────────────────────────
  const fgColor = (v) => {
    const n = parseInt(v);
    if (n >= 75) return GREEN;
    if (n >= 55) return "#A3E635";
    if (n >= 45) return "#F59E0B";
    if (n >= 25) return "#FB923C";
    return RED;
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card   = { background: GLASS, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 };
  const pill   = (active, col) => ({
    padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
    background: active ? (col || C.primary) : "transparent",
    border: `1px solid ${active ? (col || C.primary) : C.border}`,
    color: active ? "#0a0a0f" : C.text, fontWeight: active ? 700 : 400, transition: "all 0.2s"
  });
  const inp = {
    background: GLASS2, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box"
  };
  const btn = (active, col) => ({
    padding: "8px 16px", borderRadius: 8, border: `1px solid ${col || C.primary}`,
    background: active ? (col || C.primary) : "transparent",
    color: active ? "#0a0a0f" : (col || C.primary), cursor: "pointer",
    fontSize: 12, fontWeight: 600, transition: "all 0.18s", whiteSpace: "nowrap"
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ── GLOBAL HEADER ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // Fear & Greed semi-circle gauge
  const FGGauge = ({ value }) => {
    const n = parseInt(value) || 50;
    const pct = n / 100;
    const r = 28, cx = 36, cy = 34;
    const startA = -Math.PI * 0.85, sweep = Math.PI * 1.7;
    const endTrack = startA + sweep;
    const endVal = startA + sweep * pct;
    const polar = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [tx1, ty1] = polar(startA), [tx2, ty2] = polar(endTrack);
    const [vx1, vy1] = polar(startA), [vx2, vy2] = polar(endVal);
    const col = fgColor(n);
    const lbl = n >= 75 ? (isAr ? 'جشع' : 'Greed') : n >= 45 ? (isAr ? 'محايد' : 'Neutral') : (isAr ? 'خوف' : 'Fear');
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 2 }}>
        <svg width={72} height={44}>
          <path d={`M${tx1},${ty1} A${r},${r} 0 1 1 ${tx2},${ty2}`} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" strokeLinecap="round" />
          {pct > 0 && <path d={`M${vx1},${vy1} A${r},${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${vx2},${vy2}`} fill="none" stroke={col} strokeWidth="5" strokeLinecap="round" />}
          <text x={cx} y={cy - 2} textAnchor="middle" fill={col} fontSize="13" fontWeight="800">{n}</text>
        </svg>
        <div style={{ fontSize: 9, color: col, marginTop: -2, fontWeight: 700, letterSpacing: 0.5 }}>{lbl}</div>
      </div>
    );
  };

  const GlobalHeader = () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16, animation: "fadeUp 0.3s ease" }}>
      {/* Total MCap */}
      <div style={{ ...card, padding: "10px 16px", flex: "1 1 140px", minWidth: 130 }}>
        <div style={{ fontSize: 10, color: SUB, marginBottom: 3 }}>{t("totalMcap", isAr)}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{globalData.mcap || "—"}</div>
        <div style={{ fontSize: 9, color: SUB, marginTop: 2 }}>{isAr ? 'رأس المال الكلي' : 'Global market cap'}</div>
      </div>
      {/* BTC Dominance with bar */}
      <div style={{ ...card, padding: "10px 16px", flex: "1 1 130px", minWidth: 120 }}>
        <div style={{ fontSize: 10, color: SUB, marginBottom: 3 }}>{t("btcDom", isAr)}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#F7931A" }}>{globalData.btcDom || "—"}</div>
        <div style={{ marginTop: 4, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: globalData.btcDom || "50%", height: "100%", background: "linear-gradient(90deg,#F7931A80,#F7931A)", borderRadius: 2, transition: "width 1s" }} />
        </div>
      </div>
      {/* Fear & Greed with arc gauge */}
      <div style={{ ...card, padding: "10px 16px", flex: "1 1 140px", minWidth: 130 }}>
        <div style={{ fontSize: 10, color: SUB, marginBottom: 1 }}>{t("fearGreed", isAr)}</div>
        {globalData.fearGreed ? <FGGauge value={globalData.fearGreed} /> : <div style={{ fontSize: 15, fontWeight: 700, color: SUB, marginTop: 6 }}>—</div>}
      </div>
      {/* ETH Gas */}
      <div style={{ ...card, padding: "10px 16px", flex: "1 1 110px", minWidth: 100 }}>
        <div style={{ fontSize: 10, color: SUB, marginBottom: 3 }}>{t("gas", isAr)}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#6366f1" }}>{globalData.gas}</div>
        <div style={{ fontSize: 9, color: "#6366f1", marginTop: 2, opacity: 0.7 }}>gwei · ETH</div>
      </div>
      {/* Status */}
      <div style={{ ...card, padding: "10px 16px", flex: "1 1 130px", minWidth: 120, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: fetchStatus === "live" ? GREEN : fetchStatus === "error" ? RED : "#F59E0B",
          boxShadow: `0 0 6px ${fetchStatus === "live" ? GREEN : RED}`, animation: "pulse 1.5s infinite" }} />
        <div>
          <div style={{ fontSize: 11, color: fetchStatus === "live" ? GREEN : SUB, fontWeight: 700 }}>
            {fetchStatus === "live" ? t("live", isAr) : fetchStatus === "error" ? (isAr ? "خطأ" : "Error") : (isAr ? "تحميل" : "Loading")}
          </div>
          {lastUpdate && <div style={{ fontSize: 9, color: SUB }}>{lastUpdate.toLocaleTimeString()}</div>}
          <div style={{ fontSize: 9, color: SUB }}>{coins.length} {isAr ? 'عملة' : 'coins'}</div>
        </div>
      </div>
    </div>
  );

  // ── TAB BAR ───────────────────────────────────────────────────────────────
  const TabBar = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
      {[
        { key: "markets",   label: t("markets", isAr) },
        { key: "defi",      label: t("defi", isAr) },
        { key: "trending",  label: t("trending", isAr) },
        { key: "portfolio", label: t("portfolio", isAr) },
        { key: "signals",   label: t("signals", isAr) },
        { key: "heatmap",   label: t("heatmap", isAr) },
        { key: "whales",    label: t("whales", isAr) },
        { key: "gasfee",    label: t("gasfee", isAr) },
      ].map(tab => (
        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
          style={{ ...btn(activeTab === tab.key), padding: "9px 20px", fontSize: 13, borderRadius: 10 }}>
          {tab.label}
        </button>
      ))}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ── MARKETS TAB ───────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const MarketsTab = () => {
    const CATS = ["All", ...(CRYPTO_CATS ? Object.keys(CRYPTO_CATS) : [])];
    const SORTS = [
      { key: "rank",   label: t("rank", isAr) },
      { key: "pct24h", label: t("h24", isAr) },
      { key: "pct7d",  label: t("d7", isAr) },
      { key: "mcap",   label: t("mcap", isAr) },
      { key: "volume", label: t("volume", isAr) },
    ];
    return (
      <div style={{ animation: "fadeUp 0.3s ease" }}>
        {/* Search + sort */}
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search", isAr)}
            style={{ ...inp, maxWidth: 220, flex: "1 1 180px" }} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SORTS.map(s => (
              <button key={s.key} onClick={() => setSort(s.key)} style={pill(sort === s.key)}>{s.label}</button>
            ))}
          </div>
        </div>
        {/* Category chips */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {CATS.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={pill(category === cat, C.primary)}>
              {cat === "All" ? t("allCats", isAr) : cat}
            </button>
          ))}
        </div>
        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: SUB, borderBottom: `1px solid ${C.border}` }}>
                {["#", t("coin", isAr), t("price", isAr), t("h24", isAr), t("d7", isAr), t("mcap", isAr), t("volume", isAr), t("chart", isAr), ...(onTrade ? [""] : [])].map((h, i) => (
                  <th key={i} style={{ padding: "8px 10px", textAlign: i === 0 ? "center" : (isAr ? "right" : "left"), fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayCoins.slice(0, 60).map((coin, idx) => {
                const isSel = selCoin?.sym === coin.sym;
                const sp = coin.sparkline || sparks[coin.sym] || [];
                const up7 = (coin.pct7d || 0) >= 0;
                return (
                  <>
                    <tr key={coin.sym} onClick={() => { setSelCoin(isSel ? null : coin); setAiTip(""); }}
                      style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer",
                        background: isSel ? `${C.primary}12` : "transparent",
                        transition: "background 0.15s" }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = GLASS2; }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}>
                      <td style={{ padding: "9px 10px", textAlign: "center", color: SUB }}>{coin.rank || idx + 1}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: coin.color || C.primary,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {coin.sym.slice(0, 3)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: C.text }}>{coin.sym}</div>
                            <div style={{ fontSize: 10, color: SUB }}>{coin.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "9px 10px", fontWeight: 700, color: C.text }}>{fmtPrice(coin.price)}</td>
                      <td style={{ padding: "9px 10px", color: (coin.pct || 0) >= 0 ? GREEN : RED, fontWeight: 600 }}>{fmtPct(coin.pct || 0)}</td>
                      <td style={{ padding: "9px 10px", color: up7 ? GREEN : RED, fontWeight: 600 }}>{fmtPct(coin.pct7d || 0)}</td>
                      <td style={{ padding: "9px 10px", color: SUB }}>{coin.mcap}</td>
                      <td style={{ padding: "9px 10px", color: SUB }}>{coin.vol24}</td>
                      <td style={{ padding: "9px 10px" }}><Spark data={sp.slice(-30)} up={up7} w={72} h={26} /></td>
                      {onTrade && (
                        <td style={{ padding: "9px 6px" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTrade(coin.sym); }}
                            title={isAr ? `تداول ${coin.sym}` : `Trade ${coin.sym}`}
                            style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)",
                              borderRadius: 6, padding: "4px 9px", cursor: "pointer",
                              color: "#22c55e", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                            ⚡ {isAr ? "تداول" : "Trade"}
                          </button>
                        </td>
                      )}
                    </tr>
                    {isSel && (
                      <tr key={`${coin.sym}-detail`}>
                        <td colSpan={8} style={{ padding: "14px 16px", background: `${C.primary}0a`, borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, animation: "fadeUp 0.25s ease" }}>
                            <div style={{ flex: "1 1 200px" }}>
                              <div style={{ fontSize: 11, color: SUB, marginBottom: 8 }}>{t("ath", isAr)}</div>
                              <div style={{ fontWeight: 700, color: GREEN, fontSize: 15 }}>{coin.ath ? fmtPrice(coin.ath) : "—"}</div>
                              <div style={{ marginTop: 10, fontSize: 11, color: SUB }}>{t("high52", isAr)}</div>
                              <div style={{ fontWeight: 600, color: C.text }}>{coin.high52 ? fmtPrice(coin.high52) : "—"}</div>
                              <div style={{ marginTop: 6, fontSize: 11, color: SUB }}>{t("low52", isAr)}</div>
                              <div style={{ fontWeight: 600, color: C.text }}>{coin.low52 ? fmtPrice(coin.low52) : "—"}</div>
                            </div>
                            {coin.ath && coin.low52 && (
                              <div style={{ flex: "1 1 240px" }}>
                                <div style={{ fontSize: 11, color: SUB, marginBottom: 6 }}>Price Range (52w)</div>
                                <div style={{ position: "relative", height: 8, background: `${C.border}`, borderRadius: 4, overflow: "hidden" }}>
                                  {(() => {
                                    const lo = coin.low52 || 0, hi = coin.ath || coin.price * 2;
                                    const pct = Math.max(0, Math.min(100, ((coin.price - lo) / (hi - lo)) * 100));
                                    return <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: C.primary, borderRadius: 4 }} />;
                                  })()}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: SUB }}>
                                  <span>{fmtPrice(coin.low52)}</span>
                                  <span style={{ color: C.primary, fontWeight: 600 }}>{fmtPrice(coin.price)}</span>
                                  <span>{fmtPrice(coin.ath)}</span>
                                </div>
                              </div>
                            )}
                            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 8 }}>
                              <button onClick={() => handleAI(coin)} disabled={aiLoading}
                                style={{ ...btn(true), opacity: aiLoading ? 0.6 : 1 }}>
                                {aiLoading ? "…" : t("analyze", isAr)}
                              </button>
                              {onTrade && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleTrade(coin.sym); }}
                                  style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                                    color: "#000", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                                  ⚡ {isAr ? `تداول ${coin.sym}` : `Trade ${coin.sym}`}
                                </button>
                              )}
                            </div>
                          </div>
                          {aiTip && (
                            <div style={{ marginTop: 12, padding: "10px 14px", background: GLASS2, borderRadius: 8,
                              borderLeft: `3px solid ${C.primary}`, fontSize: 13, color: C.text, lineHeight: 1.6 }}>
                              {aiTip}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── DEFI TAB ──────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const DefiTab = () => (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Protocol cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
        {DEFI_PROTOCOLS.map((p, i) => (
          <div key={i} style={{ ...card, borderLeft: `3px solid ${RISK_COLORS[p.risk]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: SUB, marginTop: 2 }}>{p.chain} · {p.token}</div>
              </div>
              <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, border: `1px solid ${RISK_COLORS[p.risk]}`,
                color: RISK_COLORS[p.risk], fontWeight: 600 }}>{p.risk}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: SUB }}>APY</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: GREEN }}>{p.apy}%</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, color: SUB }}>TVL</div>
                <div style={{ fontWeight: 600, color: C.text }}>{p.tvl}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => setStakeModal(p)} style={{ ...btn(false), flex: 1, justifyContent: "center" }}>
                {t("stakeNow", isAr)}
              </button>
              {onTrade && (
                <button onClick={() => handleTrade(p.token)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    color: "#000", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                  ⚡ {isAr ? "تداول" : "Trade"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Yield Calculator */}
      <div style={{ ...card, maxWidth: 480 }}>
        <div style={{ fontWeight: 700, color: C.text, marginBottom: 12, fontSize: 15 }}>{t("calcYield", isAr)}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: "1 1 160px" }}>
            <div style={{ fontSize: 11, color: SUB, marginBottom: 4 }}>{t("amount", isAr)}</div>
            <input type="number" value={yieldCalc.amount} onChange={e => setYieldCalc(p => ({ ...p, amount: e.target.value }))}
              placeholder="10000" style={inp} />
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <div style={{ fontSize: 11, color: SUB, marginBottom: 4 }}>{t("apy", isAr)}</div>
            <input type="number" value={yieldCalc.apy} onChange={e => setYieldCalc(p => ({ ...p, apy: e.target.value }))}
              placeholder="12" style={inp} />
          </div>
        </div>
        {yieldResults && (
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: t("daily", isAr),   val: yieldResults.daily },
              { label: t("monthly", isAr), val: yieldResults.monthly },
              { label: "Annual",           val: yieldResults.yearly },
            ].map((r, i) => (
              <div key={i} style={{ flex: 1, background: GLASS2, borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: SUB, marginBottom: 4 }}>{r.label}</div>
                <div style={{ fontWeight: 700, color: GREEN, fontSize: 14 }}>${r.val.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stake modal */}
      {stakeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setStakeModal(null)}>
          <div style={{ ...card, maxWidth: 400, width: "90%", padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text, marginBottom: 8 }}>{stakeModal.name}</div>
            <div style={{ color: SUB, fontSize: 13, marginBottom: 14, lineHeight: 1.7 }}>
              Chain: {stakeModal.chain}<br />
              Token: {stakeModal.token}<br />
              APY: <span style={{ color: GREEN, fontWeight: 700 }}>{stakeModal.apy}%</span><br />
              TVL: {stakeModal.tvl}<br />
              Risk: <span style={{ color: RISK_COLORS[stakeModal.risk], fontWeight: 600 }}>{stakeModal.risk}</span>
            </div>
            <div style={{ fontSize: 12, color: SUB, marginBottom: 16 }}>
              ⚠️ {isAr ? "هذا للعرض التعليمي فقط. تحقق دائماً من الروابط الرسمية للبروتوكول." : "For educational display only. Always verify via the protocol's official website."}
            </div>
            <button onClick={() => setStakeModal(null)} style={{ ...btn(true), width: "100%" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ── TRENDING TAB ──────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const TrendingTab = () => (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {trendLoading && <div style={{ color: SUB, textAlign: "center", padding: 40 }}>{t("loading", isAr)}</div>}
      {!trendLoading && trendData.coins.length === 0 && (
        <div style={{ color: SUB, textAlign: "center", padding: 40 }}>
          {isAr ? "تعذّر تحميل البيانات." : "Could not load trending data."}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginBottom: 24 }}>
        {trendData.coins.slice(0, 7).map((entry, idx) => {
          const coin = entry.item;
          const key  = coin?.id || coin?.name;
          const ai   = trendAI[key];
          const btcPrice = coin?.price_btc;
          return (
            <div key={idx} style={{ ...card, borderTop: `2px solid ${C.primary}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${C.primary}33`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, color: C.primary, fontSize: 13 }}>#{idx + 1}</div>
                <div>
                  <div style={{ fontWeight: 700, color: C.text }}>{coin?.name}</div>
                  <div style={{ fontSize: 10, color: SUB }}>{coin?.symbol}</div>
                </div>
              </div>
              {btcPrice && (
                <div style={{ fontSize: 12, color: SUB, marginBottom: 8 }}>
                  BTC price: <span style={{ color: C.text, fontWeight: 600 }}>₿{btcPrice.toExponential(4)}</span>
                </div>
              )}
              {coin?.data?.price_change_percentage_24h?.usd !== undefined && (
                <div style={{ fontSize: 12, marginBottom: 10 }}>
                  24h: <span style={{ color: coin.data.price_change_percentage_24h.usd >= 0 ? GREEN : RED, fontWeight: 700 }}>
                    {fmtPct(coin.data.price_change_percentage_24h.usd)}
                  </span>
                </div>
              )}
              {coin?.data?.sparkline && (
                <div style={{ marginBottom: 10 }}>
                  <Spark data={coin.data.sparkline.price?.slice(-20) || []} up={(coin.data.price_change_percentage_24h?.usd || 0) >= 0} w={180} h={36} />
                </div>
              )}
              <button onClick={() => handleTrendAI(entry)} disabled={ai?.loading}
                style={{ ...btn(false), fontSize: 11, opacity: ai?.loading ? 0.6 : 1 }}>
                {ai?.loading ? "…" : t("whyTrending", isAr)}
              </button>
              {ai?.text && (
                <div style={{ marginTop: 10, fontSize: 12, color: C.text, lineHeight: 1.65,
                  padding: "8px 10px", background: GLASS2, borderRadius: 7, borderLeft: `2px solid ${C.primary}` }}>
                  {ai.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {trendData.nfts?.length > 0 && (
        <>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 15, marginBottom: 10 }}>Trending NFTs</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {trendData.nfts.slice(0, 6).map((nft, i) => (
              <div key={i} style={{ ...card, padding: "10px 14px", flex: "1 1 160px" }}>
                <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{nft.name}</div>
                <div style={{ fontSize: 11, color: SUB, marginTop: 3 }}>{nft.symbol}</div>
                {nft.floor_price_in_native_currency && (
                  <div style={{ fontSize: 11, color: SUB, marginTop: 4 }}>
                    Floor: {nft.floor_price_in_native_currency.toFixed(3)} ETH
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ── PORTFOLIO TAB ─────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const PortfolioTab = () => (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      {/* Add form */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: C.text, marginBottom: 12, fontSize: 14 }}>{t("add", isAr)} Holding</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 160px" }}>
            <div style={{ fontSize: 11, color: SUB, marginBottom: 4 }}>{t("coin", isAr)}</div>
            <select value={pForm.sym} onChange={e => setPForm(p => ({ ...p, sym: e.target.value }))}
              style={{ ...inp, cursor: "pointer" }}>
              <option value="">{t("selectCoin", isAr)}</option>
              {coins.map(c => <option key={c.sym} value={c.sym}>{c.sym} — {c.name}</option>)}
            </select>
          </div>
          <div style={{ flex: "1 1 120px" }}>
            <div style={{ fontSize: 11, color: SUB, marginBottom: 4 }}>{t("qty", isAr)}</div>
            <input type="number" value={pForm.qty} onChange={e => setPForm(p => ({ ...p, qty: e.target.value }))}
              placeholder="0.5" style={inp} />
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <div style={{ fontSize: 11, color: SUB, marginBottom: 4 }}>{t("buyPrice", isAr)}</div>
            <input type="number" value={pForm.buyPrice} onChange={e => setPForm(p => ({ ...p, buyPrice: e.target.value }))}
              placeholder="45000" style={inp} />
          </div>
          <button onClick={addHolding} style={{ ...btn(true), height: 36, flexShrink: 0 }}>{t("add", isAr)}</button>
        </div>
      </div>

      {/* Stats row */}
      {portStats && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { label: t("totalVal", isAr),  value: `$${portStats.totalVal.toLocaleString("en-US", { maximumFractionDigits: 2 })}`, color: C.text },
            { label: t("totalPnl", isAr),  value: `${portStats.totalPnl >= 0 ? "+" : ""}$${portStats.totalPnl.toFixed(2)} (${portStats.totalPnlPct.toFixed(1)}%)`, color: portStats.totalPnl >= 0 ? GREEN : RED },
            { label: t("best", isAr),      value: `${portStats.best?.sym} +${portStats.best?.pnlPct.toFixed(1)}%`, color: GREEN },
            { label: t("worst", isAr),     value: `${portStats.worst?.sym} ${portStats.worst?.pnlPct.toFixed(1)}%`, color: RED },
          ].map((s, i) => (
            <div key={i} style={{ ...card, flex: "1 1 130px", padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: SUB, marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Holdings table + donut */}
      {portfolio.length === 0 ? (
        <div style={{ color: SUB, textAlign: "center", padding: 40 }}>{t("noHoldings", isAr)}</div>
      ) : (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "2 1 300px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ color: SUB, borderBottom: `1px solid ${C.border}` }}>
                  {[t("coin", isAr), t("qty", isAr), t("buyPrice", isAr), t("price", isAr), "P&L $", "P&L %", ""].map((h, i) => (
                    <th key={i} style={{ padding: "7px 10px", textAlign: isAr ? "right" : "left", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portStats?.enriched.map((h, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "9px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: h.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: C.text }}>{h.sym}</span>
                      </div>
                    </td>
                    <td style={{ padding: "9px 10px", color: C.text }}>{h.qty}</td>
                    <td style={{ padding: "9px 10px", color: SUB }}>{fmtPrice(h.buyPrice)}</td>
                    <td style={{ padding: "9px 10px", color: C.text, fontWeight: 600 }}>{fmtPrice(h.cur)}</td>
                    <td style={{ padding: "9px 10px", color: h.pnl >= 0 ? GREEN : RED, fontWeight: 600 }}>
                      {h.pnl >= 0 ? "+" : ""}${h.pnl.toFixed(2)}
                    </td>
                    <td style={{ padding: "9px 10px", color: h.pnlPct >= 0 ? GREEN : RED }}>
                      {fmtPct(h.pnlPct)}
                    </td>
                    <td style={{ padding: "9px 10px" }}>
                      <button onClick={() => removeHolding(h.sym)}
                        style={{ ...btn(false, RED), padding: "4px 10px", fontSize: 11 }}>{t("del", isAr)}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {portStats?.donut?.length > 0 && (
            <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <Donut slices={portStats.donut} size={140} />
              <div style={{ fontSize: 11, color: SUB }}>Allocation</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {portStats.enriched.map((h, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: h.color, flexShrink: 0 }} />
                    <span style={{ color: C.text }}>{h.sym}</span>
                    <span style={{ color: SUB, marginLeft: "auto" }}>
                      {portStats.totalVal > 0 ? ((h.val / portStats.totalVal) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ── AI SIGNALS TAB ────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const SignalsTab = () => {
    const sentimentColor = sigSentiment?.sentiment === "BULLISH" ? GREEN : sigSentiment?.sentiment === "BEARISH" ? RED : "#F59E0B";
    return (
      <div style={{ animation: "fadeUp 0.3s ease" }}>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={handleSignals} disabled={sigLoading || sigCooldown > 0}
            style={{ ...btn(true), opacity: (sigLoading || sigCooldown > 0) ? 0.6 : 1, minWidth: 160 }}>
            {sigLoading ? (isAr ? "جاري التحليل…" : "Analyzing…") : t(signals.length ? "refreshSig" : "analyzeMarket", isAr)}
          </button>
          {sigCooldown > 0 && (
            <div style={{ fontSize: 12, color: SUB }}>
              {t("cooldown", isAr)}: {Math.floor(sigCooldown / 60)}:{String(sigCooldown % 60).padStart(2, "0")}
            </div>
          )}
        </div>

        {/* Market sentiment banner */}
        {sigSentiment && (
          <div style={{ ...card, marginBottom: 18, borderLeft: `4px solid ${sentimentColor}`,
            display: "flex", alignItems: "center", gap: 14, animation: "fadeUp 0.3s ease" }}>
            <div style={{ fontSize: 32 }}>
              {sigSentiment.sentiment === "BULLISH" ? "🐂" : sigSentiment.sentiment === "BEARISH" ? "🐻" : "⚖️"}
            </div>
            <div>
              <div style={{ fontSize: 11, color: SUB }}>{t("sentiment", isAr)}</div>
              <div style={{ fontWeight: 800, fontSize: 22, color: sentimentColor }}>
                {sigSentiment.sentiment === "BULLISH" ? t("bullish", isAr) : sigSentiment.sentiment === "BEARISH" ? t("bearish", isAr) : t("neutral", isAr)}
              </div>
              {sigSentiment.reason && <div style={{ fontSize: 12, color: SUB, marginTop: 4 }}>{sigSentiment.reason}</div>}
            </div>
          </div>
        )}

        {/* Signal cards */}
        {signals.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
            {signals.map((sig, i) => {
              const coin = coins.find(c => c.sym === sig.sym);
              const sigColor = sig.signal === "BUY" ? GREEN : sig.signal === "SELL" ? RED : "#F59E0B";
              return (
                <div key={i} style={{ ...card, borderTop: `3px solid ${sigColor}`, animation: `fadeUp ${0.1 + i * 0.05}s ease` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{sig.sym}</div>
                      <div style={{ fontSize: 11, color: SUB }}>{coin?.name}</div>
                    </div>
                    <div style={{ padding: "3px 10px", borderRadius: 6, background: `${sigColor}22`,
                      border: `1px solid ${sigColor}`, color: sigColor, fontWeight: 800, fontSize: 13 }}>
                      {sig.signal}
                    </div>
                  </div>
                  {coin && <div style={{ fontWeight: 600, color: C.text, marginBottom: 6 }}>{fmtPrice(coin.price)}</div>}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: SUB, marginBottom: 3 }}>
                      <span>Confidence</span><span style={{ color: sigColor }}>{sig.confidence}%</span>
                    </div>
                    <div style={{ height: 5, background: GLASS2, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${sig.confidence}%`, background: sigColor, borderRadius: 3, transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                  {sig.reason && <div style={{ fontSize: 11, color: SUB, lineHeight: 1.5 }}>{sig.reason}</div>}
                </div>
              );
            })}
          </div>
        )}

        {!sigLoading && signals.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: SUB }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
            <div style={{ fontSize: 14 }}>
              {isAr ? "اضغط 'تحليل السوق' للحصول على إشارات AI." : "Click 'Analyze Market' to generate AI signals."}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── HEATMAP TAB ───────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const HeatmapTab = () => {
    const sorted = useMemo(() => [...coins].sort((a, b) => {
      const mcapA = parseFloat((a.mcap || "0").replace(/[$TBM]/g, "")) * ((a.mcap||"").includes("T") ? 1000 : 1);
      const mcapB = parseFloat((b.mcap || "0").replace(/[$TBM]/g, "")) * ((b.mcap||"").includes("T") ? 1000 : 1);
      return mcapB - mcapA;
    }), [coins]);

    // Color intensity based on % change
    const getHeatColor = (pct) => {
      const abs = Math.min(Math.abs(pct), 15);
      const intensity = abs / 15;
      if (pct >= 0) return `rgba(34,197,94,${0.15 + intensity * 0.7})`;
      return `rgba(239,68,68,${0.15 + intensity * 0.7})`;
    };
    const getBorderColor = (pct) => pct >= 0 ? `rgba(34,197,94,${0.4})` : `rgba(239,68,68,${0.4})`;

    // Size buckets: top 5 large, next 10 medium, rest small
    const getSize = (i) => i < 5 ? "large" : i < 15 ? "medium" : "small";
    const sizeMap = { large: { h: 120, fs: 14, sub: 11 }, medium: { h: 90, fs: 12, sub: 10 }, small: { h: 70, fs: 10, sub: 9 } };

    return (
      <div>
        {/* Legend */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: SUB, letterSpacing: "1.5px" }}>
            {isAr ? "الخريطة الحرارية — الحجم يمثل القيمة السوقية" : "HEATMAP — SIZE = MARKET CAP"}
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 10, color: SUB }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(34,197,94,0.7)", display: "inline-block" }} />{isAr ? "ارتفاع" : "Up"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(239,68,68,0.7)", display: "inline-block" }} />{isAr ? "انخفاض" : "Down"}</span>
          </div>
        </div>

        {/* Heatmap grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 6, marginBottom: 20 }}>
          {sorted.map((coin, i) => {
            const size = getSize(i);
            const dim = sizeMap[size];
            const up = (coin.pct || 0) >= 0;
            return (
              <div key={coin.sym}
                style={{
                  height: dim.h,
                  background: getHeatColor(coin.pct || 0),
                  border: `1px solid ${getBorderColor(coin.pct || 0)}`,
                  borderRadius: 10,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.2s",
                  padding: 6, textAlign: "center",
                  position: "relative", overflow: "hidden",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
              >
                <div style={{ fontSize: dim.fs, fontWeight: 900, color: "#fff" }}>{coin.sym}</div>
                <div style={{ fontSize: dim.sub, fontWeight: 800, color: up ? GREEN : RED, marginTop: 3 }}>
                  {fmtPct(coin.pct || 0)}
                </div>
                {size !== "small" && (
                  <div style={{ fontSize: dim.sub - 1, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    {coin.mcap}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Top movers section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { label: isAr ? "🚀 الأكثر ارتفاعاً اليوم" : "🚀 Top Gainers Today", items: [...coins].sort((a,b) => (b.pct||0)-(a.pct||0)).slice(0,6), color: GREEN },
            { label: isAr ? "📉 الأكثر انخفاضاً اليوم" : "📉 Top Losers Today",  items: [...coins].sort((a,b) => (a.pct||0)-(b.pct||0)).slice(0,6), color: RED   },
          ].map(({ label, items, color }) => (
            <div key={label} style={{ background: GLASS, border: `1px solid rgba(255,255,255,0.07)`, borderRadius: 14, padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 12, letterSpacing: "0.5px" }}>{label}</div>
              {items.map(c => (
                <div key={c.sym} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${c.color||theme.primary}18`, border: `1px solid ${c.color||theme.primary}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: c.color||theme.primary }}>{c.sym.slice(0,4)}</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800 }}>{c.sym}</div>
                      <div style={{ fontSize: 9, color: SUB }}>{fmtPrice(c.price)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Spark data={genSpark(c.price, 12)} up={(c.pct||0) >= 0} w={44} h={20} />
                    <span style={{ fontSize: 11, fontWeight: 900, color, padding: "2px 8px", background: `${color}12`, borderRadius: 20 }}>{fmtPct(c.pct||0)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── WHALE ALERTS TAB ──────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const WhaleAlertsTab = () => {
    const [alerts, setAlerts] = useState(() => {
      const now = Date.now();
      return [
        { id:1, type:"transfer", from:"Unknown Wallet", to:"Binance",     asset:"BTC",  amount:1840,   usd:124_000_000, ts:now-120000,    flag:"🔴", label:isAr?"تحويل إلى بورصة":"Exchange Inflow" },
        { id:2, type:"transfer", from:"Coinbase",        to:"Cold Wallet", asset:"ETH",  amount:42000,  usd:148_000_000, ts:now-300000,    flag:"🟢", label:isAr?"سحب من بورصة":"Exchange Outflow" },
        { id:3, type:"mint",     from:"Tether Treasury", to:"Bitfinex",    asset:"USDT", amount:500_000_000, usd:500_000_000, ts:now-600000, flag:"🟡", label:isAr?"سك جديد":"Mint"     },
        { id:4, type:"transfer", from:"Kraken",          to:"Unknown",     asset:"BTC",  amount:920,    usd:62_000_000,  ts:now-900000,    flag:"🔴", label:isAr?"تحويل":"Transfer"  },
        { id:5, type:"transfer", from:"Unknown",         to:"Binance",     asset:"ETH",  amount:18500,  usd:65_000_000,  ts:now-1200000,   flag:"🔴", label:isAr?"تحويل إلى بورصة":"Exchange Inflow" },
        { id:6, type:"transfer", from:"Unknown",         to:"Unknown",     asset:"BNB",  amount:220000, usd:127_000_000, ts:now-1800000,   flag:"🟠", label:isAr?"تحويل ضخم":"Massive Move" },
        { id:7, type:"burn",     from:"Binance",         to:"Burn Address", asset:"BNB", amount:1_500_000, usd:870_000_000, ts:now-3600000, flag:"🔥", label:isAr?"حرق":"Burn"       },
        { id:8, type:"transfer", from:"FTX Estate",      to:"Kraken",      asset:"BTC",  amount:3200,   usd:215_000_000, ts:now-7200000,   flag:"⚠️", label:isAr?"محفظة FTX":"FTX Wallet" },
      ];
    });

    // Simulate new whale alerts coming in
    const whaleSyms  = ["BTC","ETH","USDT","BNB","XRP","SOL"];
    const whaleTos   = ["Binance","Coinbase","Kraken","Unknown Wallet","Cold Storage","Bybit"];
    const whaleFroms = ["Unknown","Binance","Coinbase","Kraken","Whale Wallet","Mining Pool"];
    // eslint-disable-next-line no-unused-vars

    useEffect(() => {
      const iv = setInterval(() => {
        const asset = whaleSyms[Math.floor(Math.random() * whaleSyms.length)];
        const price = asset === "BTC" ? 67000 : asset === "ETH" ? 3500 : asset === "BNB" ? 580 : asset === "SOL" ? 180 : asset === "XRP" ? 0.62 : 1;
        const qty   = asset === "BTC" ? Math.round(50 + Math.random()*500) : asset === "ETH" ? Math.round(500 + Math.random()*5000) : Math.round(1_000_000 + Math.random()*50_000_000);
        const usd   = qty * price;
        if (usd < 10_000_000) return; // only show 10M+
        const isInflow = Math.random() > 0.5;
        setAlerts(prev => [{
          id: Date.now(),
          type: "transfer",
          from: isInflow ? whaleTos[Math.floor(Math.random()*3)+1] : whaleTos[0],
          to:   isInflow ? whaleTos[0] : whaleFroms[Math.floor(Math.random()*3)+3],
          asset, amount: qty, usd,
          ts: Date.now(),
          flag: isInflow ? "🔴" : "🟢",
          label: isInflow ? (isAr ? "تحويل إلى بورصة" : "Exchange Inflow") : (isAr ? "سحب من بورصة" : "Exchange Outflow"),
        }, ...prev].slice(0, 20));
      }, 12000);
      return () => clearInterval(iv);
    }, []);

    const fmtUSD = (n) => n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n/1e6).toFixed(1)}M` : `$${(n/1e3).toFixed(0)}K`;
    const fmtAgo = (ts) => { const s = Math.floor((Date.now()-ts)/1000); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h`; };
    const flagColor = { "🔴": "rgba(239,68,68,0.12)", "🟢": "rgba(34,197,94,0.12)", "🟡": "rgba(250,204,21,0.12)", "🟠": "rgba(249,115,22,0.12)", "🔥": "rgba(239,68,68,0.2)", "⚠️": "rgba(245,158,11,0.12)" };
    const flagBorder = { "🔴": "rgba(239,68,68,0.25)", "🟢": "rgba(34,197,94,0.25)", "🟡": "rgba(250,204,21,0.25)", "🟠": "rgba(249,115,22,0.25)", "🔥": "rgba(239,68,68,0.4)", "⚠️": "rgba(245,158,11,0.25)" };
    const ASSET_COL = { BTC:"#F7931A", ETH:"#627EEA", USDT:"#26a17b", BNB:"#F0B90B", XRP:"#00AAE4", SOL:"#9945FF" };

    // Stats
    const totalVol   = alerts.reduce((s,a) => s + a.usd, 0);
    const inflows    = alerts.filter(a => a.flag === "🔴").length;
    const outflows   = alerts.filter(a => a.flag === "🟢").length;
    const sentiment  = inflows > outflows ? (isAr ? "ضغط بيع" : "Sell Pressure") : (isAr ? "ضغط شراء" : "Buy Pressure");
    const sentColor  = inflows > outflows ? RED : GREEN;

    return (
      <div>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { l: isAr?"إجمالي الحجم":"Total Volume",  v: fmtUSD(totalVol),        c: theme.primary, i: "🐋" },
            { l: isAr?"تدفقات للبورصات":"Inflows",     v: `${inflows} ${isAr?"حركة":"txs"}`, c: RED,          i: "🔴" },
            { l: isAr?"سحب من البورصات":"Outflows",    v: `${outflows} ${isAr?"حركة":"txs"}`, c: GREEN,        i: "🟢" },
            { l: isAr?"مزاج السوق":"Sentiment",        v: sentiment,                c: sentColor,    i: "📊" },
          ].map(s => (
            <div key={s.l} style={{ background: GLASS, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 5 }}>{s.i}</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, color: SUB, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Live ticker bar */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px 14px", marginBottom: 16, overflow: "hidden", position: "relative" }}>
          <div style={{ fontSize: 9, color: theme.primary, fontWeight: 800, letterSpacing: "1.5px", marginBottom: 4 }}>
            🔴 {isAr ? "نشاط الحيتان المباشر" : "LIVE WHALE ACTIVITY"}
            <span style={{ marginLeft: 8, padding: "1px 6px", background: `${RED}20`, border: `1px solid ${RED}30`, borderRadius: 10, color: RED }}>LIVE</span>
          </div>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 2 }}>
            {alerts.slice(0,5).map(a => (
              <span key={a.id} style={{ fontSize: 10, whiteSpace: "nowrap", color: "rgba(255,255,255,0.6)" }}>
                {a.flag} <span style={{ color: ASSET_COL[a.asset] || theme.primary, fontWeight: 800 }}>{a.amount.toLocaleString()} {a.asset}</span>
                <span style={{ color: SUB }}> ({fmtUSD(a.usd)}) {a.from} → {a.to} · {fmtAgo(a.ts)} {isAr?"مضت":"ago"}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Alert cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map(a => (
            <div key={a.id} style={{ background: flagColor[a.flag] || GLASS, border: `1px solid ${flagBorder[a.flag] || "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, animation: a.ts > Date.now() - 15000 ? "fadeUp 0.3s ease" : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Asset icon */}
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${ASSET_COL[a.asset] || theme.primary}18`, border: `1px solid ${ASSET_COL[a.asset] || theme.primary}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: ASSET_COL[a.asset] || theme.primary, flexShrink: 0 }}>
                  {a.asset}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15 }}>{a.flag}</span>
                    <span style={{ fontSize: 13, fontWeight: 900 }}>{a.amount.toLocaleString()} {a.asset}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: ASSET_COL[a.asset] || theme.primary }}>≈ {fmtUSD(a.usd)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: SUB }}>
                    <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{a.from}</span>
                    <span> → </span>
                    <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{a.to}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: isAr ? "left" : "right" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", padding: "3px 10px", background: flagColor[a.flag] || "rgba(255,255,255,0.04)", borderRadius: 20, border: `1px solid ${flagBorder[a.flag] || "rgba(255,255,255,0.07)"}` }}>{a.label}</div>
                <div style={{ fontSize: 9, color: SUB, marginTop: 4 }}>{fmtAgo(a.ts)} {isAr ? "مضت" : "ago"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── GAS FEE TAB ───────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const GasFeeTab = () => {
    const CHAINS = [
      { id:'eth',     name:'Ethereum', symbol:'ETH',  color:'#627EEA', icon:'🔷', slow:12,  std:18,  fast:28,  unit:'Gwei', usdFactor:0.00042 },
      { id:'bsc',     name:'BNB Chain',symbol:'BNB',  color:'#F0B90B', icon:'🟡', slow:1,   std:3,   fast:5,   unit:'Gwei', usdFactor:0.00002 },
      { id:'polygon', name:'Polygon',  symbol:'MATIC',color:'#8247E5', icon:'🟣', slow:80,  std:120, fast:200, unit:'Gwei', usdFactor:0.000001 },
      { id:'arb',     name:'Arbitrum', symbol:'ARB',  color:'#96BEDC', icon:'🔵', slow:0.1, std:0.2, fast:0.5, unit:'Gwei', usdFactor:0.00003 },
      { id:'op',      name:'Optimism', symbol:'OP',   color:'#FF0420', icon:'🔴', slow:0.1, std:0.2, fast:0.4, unit:'Gwei', usdFactor:0.00002 },
    ];
    const ACTIONS = [
      { id:'transfer', labelEn:'Token Transfer', labelAr:'تحويل رمز',  gasLimit:21000  },
      { id:'swap',     labelEn:'DEX Swap',        labelAr:'تبادل DEX', gasLimit:150000 },
      { id:'nft',      labelEn:'NFT Mint',        labelAr:'سك NFT',    gasLimit:200000 },
      { id:'approve',  labelEn:'Token Approve',   labelAr:'موافقة',     gasLimit:46000  },
      { id:'bridge',   labelEn:'Bridge',          labelAr:'جسر',        gasLimit:250000 },
      { id:'deploy',   labelEn:'Contract Deploy', labelAr:'نشر عقد',   gasLimit:500000 },
    ];
    const [gasData, setGasData] = useState(() =>
      CHAINS.map(c => ({ ...c, slowCur:c.slow, stdCur:c.std, fastCur:c.fast }))
    );
    const [selChain, setSelChain] = useState('eth');
    const [selAction, setSelAction] = useState('swap');
    const [tier, setTier] = useState('std');
    const [alertGwei, setAlertGwei] = useState(15);
    const gasInt = useRef(null);
    useEffect(() => {
      gasInt.current = setInterval(() => {
        setGasData(prev => prev.map(c => ({
          ...c,
          slowCur: Math.max(0.01, +(c.slow * (0.8 + Math.random() * 0.4)).toFixed(1)),
          stdCur:  Math.max(0.01, +(c.std  * (0.8 + Math.random() * 0.4)).toFixed(1)),
          fastCur: Math.max(0.01, +(c.fast * (0.8 + Math.random() * 0.4)).toFixed(1)),
        })));
      }, 5000);
      return () => clearInterval(gasInt.current);
    }, []);
    const chain  = gasData.find(c => c.id === selChain) || gasData[0];
    const action = ACTIONS.find(a => a.id === selAction) || ACTIONS[0];
    const gweiVal = tier === 'slow' ? chain.slowCur : tier === 'fast' ? chain.fastCur : chain.stdCur;
    const costUSD = gweiVal * 1e-9 * action.gasLimit / chain.usdFactor * chain.usdFactor * 1e9 * chain.usdFactor;
    // simpler: cost = gwei * 1e-9 * gasLimit * pricePerGwei where pricePerGwei ≈ usdFactor*1e9
    const gasCostUSD = gweiVal * action.gasLimit * chain.usdFactor;
    return (
      <div style={{ animation:'fadeUp 0.3s ease', display:'flex', flexDirection:'column', gap:20 }}>
        <style>{`@keyframes pulse2{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:GREEN, animation:'pulse2 1.5s infinite' }} />
          <span style={{ fontSize:12, color:GREEN, fontWeight:600 }}>{isAr?'مباشر — يتحدث كل 5 ثوانٍ':'LIVE — updates every 5s'}</span>
        </div>
        {/* Chain cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:10 }}>
          {gasData.map(ch => (
            <div key={ch.id} onClick={() => setSelChain(ch.id)} style={{
              padding:14, borderRadius:12, cursor:'pointer',
              background: selChain===ch.id ? `${ch.color}18` : GLASS,
              border:`1px solid ${selChain===ch.id ? ch.color+'55' : C.border}`, transition:'all .2s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ fontSize:18 }}>{ch.icon}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#fff' }}>{ch.name}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{ch.symbol}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:6, fontSize:11 }}>
                <span style={{ color:GREEN }}>🐢{ch.slowCur}</span>
                <span style={{ color:C.primary }}>⚡{ch.stdCur}</span>
                <span style={{ color:RED }}>🚀{ch.fastCur}</span>
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:4 }}>{ch.unit}</div>
            </div>
          ))}
        </div>
        {/* Cost Calculator */}
        <div style={{ ...card }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:14 }}>{isAr?'🧮 حاسبة رسوم الغاز':'🧮 Gas Cost Calculator'}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            <div>
              <div style={{ fontSize:11, color:SUB, marginBottom:6 }}>{isAr?'نوع العملية':'Action'}</div>
              <select value={selAction} onChange={e => setSelAction(e.target.value)} style={{ ...inp }}>
                {ACTIONS.map(a => <option key={a.id} value={a.id}>{isAr?a.labelAr:a.labelEn}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, color:SUB, marginBottom:6 }}>{isAr?'السرعة':'Speed'}</div>
              <div style={{ display:'flex', gap:6 }}>
                {[{id:'slow',e:'🐢'},{id:'std',e:'⚡'},{id:'fast',e:'🚀'}].map(sp => (
                  <button key={sp.id} onClick={() => setTier(sp.id)} style={{
                    flex:1, padding:'8px 4px', borderRadius:8, fontSize:16, cursor:'pointer',
                    background: tier===sp.id ? `${C.primary}22` : GLASS,
                    border:`1px solid ${tier===sp.id ? C.primary : C.border}`,
                    color: tier===sp.id ? C.primary : SUB,
                  }}>{sp.e}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { lEn:'Gas Price',  lAr:'سعر الغاز',  val:`${gweiVal} ${chain.unit}`, color:C.primary },
              { lEn:'Gas Limit',  lAr:'حد الغاز',   val:action.gasLimit.toLocaleString(), color:'#FBBF24' },
              { lEn:'Est. Cost',  lAr:'التكلفة',    val:`$${gasCostUSD < 0.01 ? gasCostUSD.toFixed(4) : gasCostUSD.toFixed(3)}`, color:GREEN },
            ].map((r,i) => (
              <div key={i} style={{ background:GLASS2, borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:r.color }}>{r.val}</div>
                <div style={{ fontSize:11, color:SUB, marginTop:2 }}>{isAr?r.lAr:r.lEn}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Best time chart */}
        <div style={{ ...card }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:14 }}>{isAr?'🕐 أفضل وقت للمعاملات (UTC)':'🕐 Best Time to Transact (UTC)'}</div>
          <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:72 }}>
            {Array.from({length:24},(_,h) => {
              const busy = h>=8 && h<=19;
              const rel = busy ? 0.5 + Math.sin(h*0.6)*0.35 : 0.15 + Math.random()*0.12;
              const clamped = Math.max(0.05, Math.min(1, rel));
              return (
                <div key={h} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ width:'100%', height:clamped*62, background:clamped<0.35?GREEN:RED, borderRadius:3, opacity:.75 }} />
                  {h%6===0 && <div style={{ fontSize:8, color:SUB }}>{h}</div>}
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:12, marginTop:8, fontSize:11 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8,height:8,background:GREEN,borderRadius:2,display:'inline-block' }} /><span style={{ color:SUB }}>{isAr?'غاز منخفض':'Low Gas'}</span></span>
            <span style={{ display:'flex', alignItems:'center', gap:4 }}><span style={{ width:8,height:8,background:RED,borderRadius:2,display:'inline-block' }} /><span style={{ color:SUB }}>{isAr?'غاز مرتفع':'High Gas'}</span></span>
          </div>
        </div>
        {/* Alert */}
        <div style={{ ...card }}>
          <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:12 }}>{isAr?'🔔 تنبيه الغاز':'🔔 Gas Alert'}</div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:12, color:SUB }}>{isAr?'نبّهني عندما يكون غاز ETH ≤':'Alert me when ETH gas ≤'}</span>
            <input type="number" value={alertGwei} onChange={e => setAlertGwei(+e.target.value)} style={{ ...inp, width:70 }} />
            <span style={{ fontSize:12, color:SUB }}>Gwei</span>
            <button style={{ ...btn(false), padding:'8px 16px' }}>{isAr?'تفعيل':'Set Alert'}</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ── RENDER ────────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div dir={dir} style={{ color: C.text, fontFamily: "inherit", minHeight: "100%" }}>
      <GlobalHeader />
      <TabBar />
      {activeTab === "markets"   && <MarketsTab />}
      {activeTab === "defi"      && <DefiTab />}
      {activeTab === "trending"  && <TrendingTab />}
      {activeTab === "portfolio" && <PortfolioTab />}
      {activeTab === "signals"   && <SignalsTab />}
      {activeTab === "heatmap"   && <HeatmapTab />}
      {activeTab === "whales"    && <WhaleAlertsTab />}
      {activeTab === "gasfee"    && <GasFeeTab />}
    </div>
  );
};

export default CryptoTab;
