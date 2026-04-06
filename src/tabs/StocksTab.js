/* eslint-disable */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { STOCKS_DATA, STOCKS_META, INDICES_META } from '../data/stocksData';
import { genSpark } from '../utils/indicators';
import { proxyAI } from '../utils/ai';

// ─── Sparkline SVG ─────────────────────────────────────────────────────────
const Spark = ({ data, up, w = 80, h = 28 }) => {
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 0.001;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) + 2}`).join(" ");
  const col = up ? "#4ADE80" : "#E05252";
  const gid = `sg${up ? "u" : "d"}${Math.random().toString(36).slice(2, 6)}`;
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.3" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ─── Fade-up animation keyframe injector ───────────────────────────────────
const injectKeyframes = () => {
  if (document.getElementById('stocks-anim')) return;
  const s = document.createElement('style');
  s.id = 'stocks-anim';
  s.textContent = `
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    .su-fade { animation: fadeUp 0.35s ease both; }
    .su-pulse { animation: pulse 2s ease infinite; }
  `;
  document.head.appendChild(s);
};

// ─── Earnings static data ──────────────────────────────────────────────────
const EARNINGS_DATA = [
  { sym:"TSLA",  name:"Tesla",           date:"Apr 22", time:"AC", eps:0.51,  lastEps:0.71,  consensus:"Miss" },
  { sym:"META",  name:"Meta Platforms",  date:"Apr 24", time:"AC", eps:5.28,  lastEps:5.33,  consensus:"Beat" },
  { sym:"MSFT",  name:"Microsoft",       date:"Apr 24", time:"AC", eps:3.22,  lastEps:2.93,  consensus:"Beat" },
  { sym:"GOOGL", name:"Alphabet",        date:"Apr 25", time:"AC", eps:2.01,  lastEps:1.89,  consensus:"Beat" },
  { sym:"AAPL",  name:"Apple",           date:"Apr 30", time:"AC", eps:1.60,  lastEps:2.18,  consensus:"In-line" },
  { sym:"AMZN",  name:"Amazon",          date:"May 1",  time:"AC", eps:1.03,  lastEps:0.98,  consensus:"Beat" },
  { sym:"NVDA",  name:"NVIDIA",          date:"May 22", time:"AC", eps:5.59,  lastEps:5.16,  consensus:"Beat" },
  { sym:"JPM",   name:"JPMorgan Chase",  date:"Apr 11", time:"BO", eps:4.61,  lastEps:4.44,  consensus:"Beat" },
  { sym:"UNH",   name:"UnitedHealth",    date:"Apr 15", time:"BO", eps:7.19,  lastEps:6.16,  consensus:"Miss" },
  { sym:"V",     name:"Visa",            date:"Apr 23", time:"AC", eps:2.67,  lastEps:2.41,  consensus:"Beat" },
  { sym:"LLY",   name:"Eli Lilly",       date:"May 1",  time:"BO", eps:3.57,  lastEps:2.58,  consensus:"Beat" },
  { sym:"NFLX",  name:"Netflix",         date:"Apr 17", time:"AC", eps:5.65,  lastEps:4.49,  consensus:"Beat" },
  { sym:"XOM",   name:"ExxonMobil",      date:"May 2",  time:"BO", eps:2.34,  lastEps:2.48,  consensus:"In-line" },
  { sym:"AMD",   name:"AMD",             date:"Apr 29", time:"AC", eps:0.62,  lastEps:0.69,  consensus:"Miss" },
  { sym:"COST",  name:"Costco",          date:"May 29", time:"AC", eps:4.10,  lastEps:3.92,  consensus:"Beat" },
];

// ─── ETF static data ───────────────────────────────────────────────────────
const ETF_DATA = [
  { sym:"SPY",  name:"SPDR S&P 500 ETF",         price:524.18, pct:0.42, ytd:8.2,  er:0.0945, aum:"$532B", cat:"Broad Market",  top:["AAPL","MSFT","NVDA"] },
  { sym:"QQQ",  name:"Invesco QQQ Trust",         price:448.32, pct:0.61, ytd:9.4,  er:0.20,   aum:"$254B", cat:"Tech",           top:["MSFT","AAPL","NVDA"] },
  { sym:"IWM",  name:"iShares Russell 2000 ETF",  price:198.44, pct:-0.3, ytd:-3.1, er:0.19,   aum:"$61B",  cat:"Broad Market",  top:["SPSC","ATKR","ICUI"] },
  { sym:"VTI",  name:"Vanguard Total Stock Mkt",  price:252.18, pct:0.38, ytd:7.9,  er:0.03,   aum:"$415B", cat:"Broad Market",  top:["AAPL","MSFT","NVDA"] },
  { sym:"BND",  name:"Vanguard Total Bond Mkt",   price:73.42,  pct:-0.1, ytd:-0.8, er:0.03,   aum:"$112B", cat:"Bonds",          top:["US Gov","MBS","Corp"] },
  { sym:"GLD",  name:"SPDR Gold Trust ETF",        price:215.84, pct:0.85, ytd:14.2, er:0.40,   aum:"$68B",  cat:"Commodity",      top:["Gold","—","—"] },
  { sym:"VNQ",  name:"Vanguard Real Estate ETF",  price:84.12,  pct:-0.2, ytd:-2.4, er:0.12,   aum:"$34B",  cat:"Sector",         top:["PLD","AMT","EQIX"] },
  { sym:"ARKK", name:"ARK Innovation ETF",         price:46.28,  pct:1.22, ytd:4.8,  er:0.75,   aum:"$7B",   cat:"Growth",         top:["TSLA","ROKU","COIN"] },
  { sym:"XLE",  name:"Energy Select SPDR ETF",    price:92.44,  pct:0.55, ytd:6.1,  er:0.09,   aum:"$38B",  cat:"Sector",         top:["XOM","CVX","COP"] },
  { sym:"XLK",  name:"Technology Select SPDR",    price:218.72, pct:0.72, ytd:10.2, er:0.09,   aum:"$65B",  cat:"Tech",           top:["MSFT","AAPL","NVDA"] },
  { sym:"XLF",  name:"Financial Select SPDR ETF", price:41.84,  pct:0.48, ytd:9.8,  er:0.09,   aum:"$44B",  cat:"Sector",         top:["JPM","BAC","WFC"] },
  { sym:"XLV",  name:"Health Care Select SPDR",   price:148.22, pct:0.28, ytd:3.4,  er:0.09,   aum:"$37B",  cat:"Sector",         top:["UNH","LLY","JNJ"] },
  { sym:"SOXX", name:"iShares Semiconductor ETF", price:218.44, pct:1.85, ytd:7.2,  er:0.35,   aum:"$12B",  cat:"Tech",           top:["NVDA","AVGO","AMD"] },
  { sym:"VIG",  name:"Vanguard Dividend Apprec.", price:178.84, pct:0.32, ytd:5.6,  er:0.06,   aum:"$78B",  cat:"Dividend",       top:["MSFT","AAPL","UNH"] },
  { sym:"SCHD", name:"Schwab US Dividend Equity", price:78.42,  pct:0.42, ytd:4.2,  er:0.06,   aum:"$52B",  cat:"Dividend",       top:["ABBV","MRK","CSCO"] },
];

// ─── IPO Calendar data ────────────────────────────────────────────────────
const IPO_DATA = [
  { sym:"REDDIT",     name:"Reddit Inc.",         date:"Apr 8",    qtr:"Q2",   priceRange:"$34–38",  val:"$6.4B",  sector:"Social Media", sectorAr:"تواصل",    status:"priced",   change:48.4, flag:"🇺🇸" },
  { sym:"KLARNA",     name:"Klarna Bank AB",       date:"May 15",   qtr:"Q2",   priceRange:"$45–52",  val:"$15B",   sector:"Fintech",      sectorAr:"فينتك",    status:"upcoming", change:null, flag:"🇸🇪" },
  { sym:"CEREBRAS",   name:"Cerebras Systems",     date:"Apr 2025", qtr:"Q2",   priceRange:"$28–32",  val:"$4.2B",  sector:"AI Chips",     sectorAr:"رقائق AI", status:"upcoming", change:null, flag:"🇺🇸" },
  { sym:"DATABRICKS", name:"Databricks",           date:"Jun 2025", qtr:"Q2",   priceRange:"$55–65",  val:"$62B",   sector:"AI/Cloud",     sectorAr:"سحابة AI", status:"upcoming", change:null, flag:"🇺🇸" },
  { sym:"SHEIN",      name:"SHEIN Group Ltd.",     date:"Q3 2025",  qtr:"Q3",   priceRange:"$60–70",  val:"$45B",   sector:"E-Commerce",   sectorAr:"تجارة",    status:"rumored",  change:null, flag:"🇨🇳" },
  { sym:"STRIPE",     name:"Stripe Inc.",          date:"TBD 2025", qtr:"TBD",  priceRange:"$90–110", val:"$65B",   sector:"Fintech",      sectorAr:"فينتك",    status:"rumored",  change:null, flag:"🇺🇸" },
  { sym:"STARLINK",   name:"SpaceX Starlink",      date:"TBD",      qtr:"TBD",  priceRange:"$80–95",  val:"$120B",  sector:"Telecom",      sectorAr:"اتصالات",  status:"rumored",  change:null, flag:"🇺🇸" },
  { sym:"CHIME",      name:"Chime Financial",      date:"Q2 2025",  qtr:"Q2",   priceRange:"$22–26",  val:"$8B",    sector:"Fintech",      sectorAr:"فينتك",    status:"upcoming", change:null, flag:"🇺🇸" },
  { sym:"STUBHUB",    name:"StubHub",             date:"Q2 2025",  qtr:"Q2",   priceRange:"$18–22",  val:"$16.5B", sector:"Marketplace",  sectorAr:"تجارة",    status:"upcoming", change:null, flag:"🇺🇸" },
  { sym:"CANVA",      name:"Canva Pty Ltd",        date:"TBD 2025", qtr:"TBD",  priceRange:"$35–42",  val:"$26B",   sector:"SaaS",         sectorAr:"برمجيات",  status:"rumored",  change:null, flag:"🇦🇺" },
];

// ─── Dividend Tracker data ─────────────────────────────────────────────────
const DIVIDEND_DATA = [
  { sym:"AAPL", name:"Apple Inc.",          exDate:"May 9",  payDate:"May 15",  amount:0.25,  yield:0.5,  freq:"Quarterly", sector:"Tech",        sectorAr:"تقنية",    yrsGrowth:12, flag:"🇺🇸" },
  { sym:"MSFT", name:"Microsoft Corp.",     exDate:"May 14", payDate:"Jun 12",  amount:0.75,  yield:0.7,  freq:"Quarterly", sector:"Tech",        sectorAr:"تقنية",    yrsGrowth:24, flag:"🇺🇸" },
  { sym:"JNJ",  name:"Johnson & Johnson",   exDate:"May 20", payDate:"Jun 10",  amount:1.24,  yield:3.1,  freq:"Quarterly", sector:"Healthcare",  sectorAr:"صحة",      yrsGrowth:61, flag:"🇺🇸" },
  { sym:"KO",   name:"Coca-Cola Co.",       exDate:"Jun 14", payDate:"Jul 1",   amount:0.485, yield:3.0,  freq:"Quarterly", sector:"Consumer",    sectorAr:"استهلاكي", yrsGrowth:62, flag:"🇺🇸" },
  { sym:"VZ",   name:"Verizon Comm.",       exDate:"Apr 9",  payDate:"May 1",   amount:0.665, yield:6.5,  freq:"Quarterly", sector:"Telecom",     sectorAr:"اتصالات",  yrsGrowth:17, flag:"🇺🇸" },
  { sym:"T",    name:"AT&T Inc.",           exDate:"Apr 8",  payDate:"May 1",   amount:0.2775,yield:6.8,  freq:"Quarterly", sector:"Telecom",     sectorAr:"اتصالات",  yrsGrowth:0,  flag:"🇺🇸" },
  { sym:"XOM",  name:"ExxonMobil Corp.",    exDate:"May 13", payDate:"Jun 10",  amount:0.95,  yield:3.4,  freq:"Quarterly", sector:"Energy",      sectorAr:"طاقة",     yrsGrowth:41, flag:"🇺🇸" },
  { sym:"JPM",  name:"JPMorgan Chase",      exDate:"Apr 4",  payDate:"Apr 30",  amount:1.25,  yield:2.0,  freq:"Quarterly", sector:"Finance",     sectorAr:"مالية",    yrsGrowth:13, flag:"🇺🇸" },
  { sym:"ABBV", name:"AbbVie Inc.",         exDate:"Apr 11", payDate:"May 15",  amount:1.55,  yield:3.6,  freq:"Quarterly", sector:"Healthcare",  sectorAr:"صحة",      yrsGrowth:11, flag:"🇺🇸" },
  { sym:"PG",   name:"Procter & Gamble",    exDate:"Apr 19", payDate:"May 15",  amount:0.94,  yield:2.3,  freq:"Quarterly", sector:"Consumer",    sectorAr:"استهلاكي", yrsGrowth:68, flag:"🇺🇸" },
  { sym:"HD",   name:"Home Depot Inc.",     exDate:"Jun 3",  payDate:"Jun 26",  amount:2.25,  yield:2.4,  freq:"Quarterly", sector:"Retail",      sectorAr:"تجزئة",    yrsGrowth:14, flag:"🇺🇸" },
  { sym:"MCD",  name:"McDonald's Corp.",    exDate:"Jun 2",  payDate:"Jun 17",  amount:1.77,  yield:2.3,  freq:"Quarterly", sector:"Consumer",    sectorAr:"استهلاكي", yrsGrowth:47, flag:"🇺🇸" },
];

// ─── Market open check (NYSE 9:30-16:00 ET) ────────────────────────────────
const isMarketOpen = () => {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  if (day === 0 || day === 6) return false;
  const h = et.getHours(), m = et.getMinutes();
  const mins = h * 60 + m;
  return mins >= 570 && mins < 960;
};

// ─── Sector heatmap colours ────────────────────────────────────────────────
const sectorColor = (pct) => {
  if (pct > 2)   return "rgba(74,222,128,0.75)";
  if (pct > 1)   return "rgba(74,222,128,0.50)";
  if (pct > 0)   return "rgba(74,222,128,0.28)";
  if (pct > -1)  return "rgba(224,82,82,0.28)";
  if (pct > -2)  return "rgba(224,82,82,0.50)";
  return "rgba(224,82,82,0.75)";
};

// ══════════════════════════════════════════════════════════════════════════
// Map index symbol → TradingTab pair
const INDEX_TRADE_MAP = {
  "^GSPC":"SPX500","^IXIC":"NAS100","^DJI":"US30","^FTSE":"UK100",
  "SPX":"SPX500","NDX":"NAS100","DJI":"US30","FTSE":"UK100",
  "S&P 500":"SPX500","NASDAQ":"NAS100","Dow Jones":"US30","FTSE 100":"UK100",
};
const toTradePair = (sym) => INDEX_TRADE_MAP[sym] || sym;

const StocksTab = ({ theme, lang, onTrade }) => {
  injectKeyframes();
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const C = {
    card: "rgba(255,255,255,0.03)",
    cardHov: "rgba(255,255,255,0.06)",
    border: `${theme.primary}22`,
    sub: "rgba(238,232,218,0.42)",
    text: "#EEE8DA",
    green: "#4ADE80",
    red: "#E05252",
    primary: theme.primary,
    bg: "rgba(0,0,0,0.25)",
  };

  // ── Tab state ──
  const [tab, setTab] = useState("stocks");
  const tabs = [
    { id:"stocks",    en:"Stocks",    ar:"الأسهم" },
    { id:"screener",  en:"Screener",  ar:"الفلتر" },
    { id:"portfolio", en:"Portfolio", ar:"محفظتي" },
    { id:"earnings",  en:"Earnings",  ar:"النتائج" },
    { id:"etfs",      en:"ETFs",      ar:"صناديق ETF" },
    { id:"ipo",       en:"📅 IPO",     ar:"📅 الإدراجات" },
    { id:"dividends", en:"💰 Dividends",ar:"💰 التوزيعات" },
    { id:"calculator",en:"🧮 Calc",   ar:"🧮 الحاسبة" },
  ];

  // ── Stocks tab state ──
  const [stocks, setStocks] = useState(STOCKS_DATA);
  const [indices, setIndices] = useState([
    { sym:"^GSPC", label:"S&P 500",   price:5234.18, pct:0.42 },
    { sym:"^IXIC", label:"NASDAQ",    price:16421.0,  pct:0.61 },
    { sym:"^DJI",  label:"Dow Jones", price:38686.0,  pct:0.28 },
    { sym:"^FTSE", label:"FTSE 100",  price:8421.2,   pct:-0.14 },
  ]);
  const [sector, setSector] = useState("all");
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const [aiTip, setAiTip] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [fetchStatus, setFetchStatus] = useState("idle");
  const [marketOpen] = useState(isMarketOpen());

  // ── Screener state ──
  const [scrMcap, setScrMcap] = useState("all");
  const [scrPe, setScrPe] = useState("all");
  const [scrDiv, setScrDiv] = useState("all");
  const [scrSector, setScrSector] = useState("all");
  const [scrPerf, setScrPerf] = useState("all");
  const [aiScreen, setAiScreen] = useState("");
  const [aiScreenLoading, setAiScreenLoading] = useState(false);

  // ── Portfolio state ──
  const [portfolio, setPortfolio] = useState(() => {
    try { return JSON.parse(localStorage.getItem("apex:stocks:portfolio") || "[]"); }
    catch { return []; }
  });
  const [addSym, setAddSym] = useState("");
  const [addQty, setAddQty] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addError, setAddError] = useState("");

  // ── Earnings state ──
  const [earnFilter, setEarnFilter] = useState("all");
  const [earnAi, setEarnAi] = useState({});
  const [earnAiLoading, setEarnAiLoading] = useState({});

  // ── ETF state ──
  const [etfCat, setEtfCat] = useState("all");
  const [etfCmp, setEtfCmp] = useState([null, null]);
  const [etfAi, setEtfAi] = useState("");
  const [etfAiLoading, setEtfAiLoading] = useState(false);

  // ── IPO state ──
  const [ipoFilter, setIpoFilter] = useState("all");

  // ── Dividend state ──
  const [divFilter, setDivFilter] = useState("all");
  const [divShares, setDivShares] = useState({});

  // ── Compound Calculator state ──
  const [calcPrincipal, setCalcPrincipal] = useState("10000");
  const [calcMonthly,   setCalcMonthly]   = useState("500");
  const [calcRate,      setCalcRate]       = useState("10");
  const [calcYears,     setCalcYears]      = useState("20");

  // ── Sparklines (memoized) ──
  const sparks = useMemo(() => stocks.reduce((a, s) => {
    a[s.sym] = genSpark(s.price, 20); return a;
  }, {}), [stocks]);

  // ── Persist portfolio ──
  useEffect(() => {
    localStorage.setItem("apex:stocks:portfolio", JSON.stringify(portfolio));
  }, [portfolio]);

  // ── Fetch live Yahoo Finance data ──
  const fetchLive = useCallback(async () => {
    setFetchStatus("loading");
    try {
      const allSyms = STOCKS_DATA.map(s => s.sym);
      const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${allSyms.join(",")}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(quoteUrl)}`;
      const res = await fetch(proxyUrl);
      const raw = await res.json();
      const data = JSON.parse(raw.contents);
      const quotes = data?.quoteResponse?.result || [];
      if (quotes.length > 0) {
        setStocks(prev => prev.map(s => {
          const q = quotes.find(x => x.symbol === s.sym);
          if (!q) return s;
          return { ...s, price: q.regularMarketPrice ?? s.price, pct: q.regularMarketChangePercent ?? s.pct };
        }));
      }

      const idxSyms = ["^GSPC","^IXIC","^DJI","^FTSE"];
      const idxUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${idxSyms.join(",")}`;
      const idxProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(idxUrl)}`;
      const ir = await fetch(idxProxy);
      const iraw = await ir.json();
      const idata = JSON.parse(iraw.contents);
      const iquotes = idata?.quoteResponse?.result || [];
      if (iquotes.length > 0) {
        setIndices(prev => prev.map(idx => {
          const q = iquotes.find(x => x.symbol === idx.sym);
          if (!q) return idx;
          return { ...idx, price: q.regularMarketPrice ?? idx.price, pct: q.regularMarketChangePercent ?? idx.pct };
        }));
      }
      setFetchStatus("ok");
    } catch {
      setFetchStatus("err");
    }
  }, []);

  useEffect(() => { fetchLive(); }, [fetchLive]);

  // ── Derived data ──
  const sectors = useMemo(() => ["all", ...Array.from(new Set(stocks.map(s => s.sector))).sort()], [stocks]);
  const filtered = useMemo(() => stocks.filter(s => {
    if (sector !== "all" && s.sector !== sector) return false;
    if (search && !s.sym.toLowerCase().includes(search.toLowerCase()) && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [stocks, sector, search]);

  const topGainers = useMemo(() => [...stocks].sort((a,b) => b.pct - a.pct).slice(0, 4), [stocks]);
  const topLosers  = useMemo(() => [...stocks].sort((a,b) => a.pct - b.pct).slice(0, 4), [stocks]);

  const sectorHeatmap = useMemo(() => {
    const map = {};
    stocks.forEach(s => {
      if (!map[s.sector]) map[s.sector] = [];
      map[s.sector].push(s.pct);
    });
    return Object.entries(map).map(([sec, pcts]) => ({
      sector: sec,
      avg: pcts.reduce((a,b) => a+b, 0) / pcts.length,
    })).sort((a,b) => b.avg - a.avg);
  }, [stocks]);

  // ── Screener filter ──
  const screened = useMemo(() => {
    const parseMcap = (m) => {
      if (!m) return 0;
      const n = parseFloat(m.replace(/[$TB]/g, ""));
      if (m.includes("T")) return n * 1000;
      return n;
    };
    return stocks.filter(s => {
      const mcapB = parseMcap(s.mcap);
      if (scrMcap === "mega"  && mcapB < 200) return false;
      if (scrMcap === "large" && (mcapB < 10  || mcapB >= 200)) return false;
      if (scrMcap === "mid"   && (mcapB < 2   || mcapB >= 10))  return false;
      if (scrMcap === "small" && mcapB >= 2) return false;
      if (scrPe === "<10"     && (s.pe <= 0  || s.pe >= 10))    return false;
      if (scrPe === "10-20"   && (s.pe < 10  || s.pe >= 20))    return false;
      if (scrPe === "20-40"   && (s.pe < 20  || s.pe >= 40))    return false;
      if (scrPe === ">40"     && s.pe < 40)                      return false;
      if (scrPe === "neg"     && s.pe >= 0)                      return false;
      if (scrDiv === ">1"  && s.div < 1)  return false;
      if (scrDiv === ">2"  && s.div < 2)  return false;
      if (scrDiv === ">4"  && s.div < 4)  return false;
      if (scrDiv === ">6"  && s.div < 6)  return false;
      if (scrSector !== "all" && s.sector !== scrSector) return false;
      if (scrPerf === "gainers" && s.pct <= 0) return false;
      if (scrPerf === "losers"  && s.pct >= 0) return false;
      return true;
    });
  }, [stocks, scrMcap, scrPe, scrDiv, scrSector, scrPerf]);

  // ── Portfolio computed ──
  const holdings = useMemo(() => portfolio.map(h => {
    const live = stocks.find(s => s.sym === h.sym);
    const cur  = live ? live.price : h.buyPrice;
    const val  = cur * h.qty;
    const cost = h.buyPrice * h.qty;
    return { ...h, curPrice: cur, value: val, cost, pnl: val - cost, pnlPct: ((val - cost) / cost) * 100 };
  }), [portfolio, stocks]);
  const totalValue = holdings.reduce((a,h) => a + h.value, 0);
  const totalCost  = holdings.reduce((a,h) => a + h.cost, 0);
  const totalPnl   = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const bestH  = holdings.length ? holdings.reduce((a,b) => a.pnlPct > b.pnlPct ? a : b) : null;
  const worstH = holdings.length ? holdings.reduce((a,b) => a.pnlPct < b.pnlPct ? a : b) : null;

  // ── Shared style helpers ──
  const glass = (extra = {}) => ({
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 14,
    backdropFilter: "blur(12px)",
    ...extra,
  });
  const badge = (color, text) => (
    <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "1px 10px", fontSize: 11, fontWeight: 700 }}>{text}</span>
  );
  const pctColor = (p) => p >= 0 ? C.green : C.red;
  const fmtPct   = (p) => `${p >= 0 ? "+" : ""}${p.toFixed(2)}%`;
  const fmtPrice = (p) => p >= 10 ? p.toFixed(2) : p.toFixed(4);

  const SelectFilter = ({ label, val, onChange, opts }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <span style={{ color: C.sub, fontSize:11, fontWeight:600 }}>{label}</span>
      <select value={val} onChange={e => onChange(e.target.value)} style={{
        background: "rgba(255,255,255,0.06)", border:`1px solid ${C.border}`,
        color: C.text, borderRadius:8, padding:"6px 10px", fontSize:12, outline:"none",
      }}>
        {opts.map(o => <option key={o.v} value={o.v} style={{ background:"#1a1a2e" }}>{isAr && o.ar ? o.ar : o.l}</option>)}
      </select>
    </div>
  );

  // ── AI helpers ──
  const runAI = async (prompt, set, setLoad) => {
    setLoad(true); set("");
    try { const r = await proxyAI(prompt, 350); set(r); }
    catch { set(isAr ? "تعذّر تحليل البيانات." : "Analysis unavailable."); }
    finally { setLoad(false); }
  };

  // ══════════════════════
  // STOCKS TAB
  // ══════════════════════
  const renderStocks = () => (
    <div className="su-fade" style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Indices bar */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {indices.map(idx => (
          <div key={idx.sym} style={{ ...glass({ padding:"12px 14px" }), display:"flex", flexDirection:"column", gap:4 }}>
            <span style={{ color: C.sub, fontSize:11 }}>{idx.label}</span>
            <span style={{ color: C.text, fontWeight:700, fontSize:15 }}>{idx.price.toLocaleString()}</span>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ color: pctColor(idx.pct), fontWeight:700, fontSize:12 }}>{fmtPct(idx.pct)}</span>
              {onTrade && (
                <button onClick={e => { e.stopPropagation(); onTrade(toTradePair(idx.sym)); }} style={{
                  background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.35)",
                  borderRadius:6, padding:"3px 8px", cursor:"pointer", color:"#818cf8", fontSize:10, fontWeight:700,
                }}>⚡ {isAr ? "تداول" : "Trade"}</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Market status + refresh */}
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        {marketOpen
          ? badge(C.green, isAr ? "السوق مفتوح" : "MARKET OPEN")
          : badge(C.red,   isAr ? "السوق مغلق"  : "MARKET CLOSED")}
        <span style={{ color: C.sub, fontSize:11 }}>NYSE 9:30–16:00 ET</span>
        <button onClick={fetchLive} style={{
          marginLeft:"auto", background: C.primary + "22", border:`1px solid ${C.primary}44`,
          color: C.primary, borderRadius:8, padding:"5px 14px", cursor:"pointer", fontSize:12, fontWeight:600,
        }}>
          {fetchStatus === "loading" ? "⟳ ..." : (isAr ? "تحديث" : "Refresh")}
        </button>
      </div>

      {/* Top Gainers / Losers */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {[
          { label: isAr ? "الأعلى ربحاً" : "Top Gainers", data: topGainers, up: true },
          { label: isAr ? "الأكثر خسارة" : "Top Losers",  data: topLosers,  up: false },
        ].map(({ label, data, up }) => (
          <div key={label} style={glass({ padding:14 })}>
            <div style={{ color: C.sub, fontSize:11, fontWeight:700, marginBottom:8 }}>{label}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {data.map(s => (
                <div key={s.sym} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div>
                    <span style={{ color: C.text, fontWeight:700, fontSize:13 }}>{s.sym}</span>
                    <span style={{ color: C.sub, fontSize:11, marginLeft:6 }}>{s.name.split(" ")[0]}</span>
                  </div>
                  <span style={{ color: pctColor(s.pct), fontWeight:700, fontSize:13 }}>{fmtPct(s.pct)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sector Heatmap */}
      <div style={glass({ padding:14 })}>
        <div style={{ color: C.sub, fontSize:11, fontWeight:700, marginBottom:10 }}>{isAr ? "خريطة القطاعات" : "Sector Heatmap"}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {sectorHeatmap.map(({ sector: sec, avg }) => (
            <div key={sec} onClick={() => setSector(sec)} style={{
              background: sectorColor(avg), borderRadius:8, padding:"5px 10px", cursor:"pointer",
              fontSize:11, fontWeight:600, color:"#fff", border:`1px solid rgba(255,255,255,0.1)`,
              transition:"transform 0.15s", userSelect:"none",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            >
              {sec} <span style={{ opacity:0.85 }}>{fmtPct(avg)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search + sector filter */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={isAr ? "ابحث عن سهم..." : "Search symbol or name..."}
          style={{ flex:1, minWidth:180, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`,
            color:C.text, borderRadius:9, padding:"8px 14px", fontSize:13, outline:"none" }} />
        <select value={sector} onChange={e => setSector(e.target.value)} style={{
          background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`,
          color:C.text, borderRadius:9, padding:"8px 12px", fontSize:12, outline:"none",
        }}>
          {sectors.map(s => <option key={s} value={s} style={{ background:"#1a1a2e" }}>{s === "all" ? (isAr ? "كل القطاعات" : "All Sectors") : s}</option>)}
        </select>
      </div>

      {/* Stock cards grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
        {filtered.map(s => {
          const up = s.pct >= 0;
          const isSel = sel?.sym === s.sym;
          return (
            <div key={s.sym} onClick={() => setSel(isSel ? null : s)}
              className="su-fade"
              style={{
                ...glass({ padding:14, cursor:"pointer", transition:"all 0.2s",
                  border: isSel ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
                  gridColumn: isSel ? "1 / -1" : undefined,
                }),
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = C.cardHov; }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = C.card; }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:C.text, fontWeight:800, fontSize:15 }}>{s.sym}</span>
                    <span style={{ fontSize:13 }}>{s.flag}</span>
                    {badge(up ? C.green : C.red, fmtPct(s.pct))}
                  </div>
                  <div style={{ color:C.sub, fontSize:11, marginTop:2 }}>{s.name}</div>
                </div>
                <Spark data={sparks[s.sym] || [s.price]} up={up} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:10 }}>
                <span style={{ color:C.text, fontWeight:700, fontSize:16 }}>${fmtPrice(s.price)}</span>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:C.sub, fontSize:10 }}>{isAr ? "رسملة" : "MCap"}: {s.mcap}</div>
                  <div style={{ color:C.sub, fontSize:10 }}>P/E: {s.pe || "—"}</div>
                </div>
              </div>
              {onTrade && !isSel && (
                <button onClick={e => { e.stopPropagation(); onTrade(s.sym); }} style={{
                  marginTop:8, width:"100%", background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)",
                  borderRadius:7, padding:"5px 0", cursor:"pointer", color:"#22c55e", fontSize:11, fontWeight:700,
                }}>⚡ {isAr ? "تداول الآن" : "Trade Now"}</button>
              )}
              <div style={{ color:C.sub, fontSize:10, marginTop:4 }}>{s.sector} · {isAr ? "حجم" : "Vol"}: {s.vol}</div>

              {/* Expanded detail */}
              {isSel && (
                <div className="su-fade" style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:12 }}>
                    {/* 52-week range */}
                    <div>
                      <div style={{ color:C.sub, fontSize:10, marginBottom:4 }}>{isAr ? "نطاق 52 أسبوع" : "52W Range"}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ color:C.red, fontSize:10 }}>${(s.price * 0.72).toFixed(2)}</span>
                        <div style={{ flex:1, height:4, background:"rgba(255,255,255,0.1)", borderRadius:4, position:"relative" }}>
                          <div style={{ position:"absolute", left:"58%", top:-2, width:8, height:8, borderRadius:"50%", background:C.primary }} />
                        </div>
                        <span style={{ color:C.green, fontSize:10 }}>${(s.price * 1.28).toFixed(2)}</span>
                      </div>
                    </div>
                    {/* P/E Gauge */}
                    <div>
                      <div style={{ color:C.sub, fontSize:10, marginBottom:4 }}>{isAr ? "مضاعف الأرباح" : "P/E Ratio"}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:44, height:44, borderRadius:"50%", background:`conic-gradient(${C.primary} ${Math.min((s.pe||0)/100*360,360)}deg, rgba(255,255,255,0.08) 0deg)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ color:C.text, fontSize:12, fontWeight:700 }}>{s.pe || "—"}</span>
                        </div>
                        <span style={{ color:C.sub, fontSize:10 }}>{s.pe > 40 ? (isAr?"مرتفع":"High") : s.pe > 0 ? (isAr?"معتدل":"Fair") : (isAr?"سالب":"Neg")}</span>
                      </div>
                    </div>
                    {/* Dividend */}
                    <div>
                      <div style={{ color:C.sub, fontSize:10, marginBottom:4 }}>{isAr ? "عائد الأرباح" : "Dividend Yield"}</div>
                      <div style={{ color:s.div > 0 ? C.green : C.sub, fontWeight:700, fontSize:18 }}>{s.div > 0 ? `${s.div}%` : "—"}</div>
                    </div>
                  </div>

                  {/* Trade + AI Analysis */}
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  {onTrade && (
                    <button onClick={e => { e.stopPropagation(); onTrade(s.sym); }} style={{
                      background:"rgba(34,197,94,0.15)", border:"1px solid rgba(34,197,94,0.35)", color:"#22c55e",
                      borderRadius:8, padding:"7px 18px", cursor:"pointer", fontSize:12, fontWeight:700,
                    }}>⚡ {isAr ? "تداول" : "Trade"}</button>
                  )}
                  <button onClick={e => { e.stopPropagation(); runAI(
                    `Analyze ${s.name} (${s.sym}) stock. Price $${s.price}, P/E ${s.pe}, Div ${s.div}%, sector ${s.sector}. Give concise bullish/bearish analysis in 3 points.`,
                    setAiTip, setAiLoading
                  ); }} style={{
                    background: C.primary + "22", border:`1px solid ${C.primary}55`, color:C.primary,
                    borderRadius:8, padding:"7px 16px", cursor:"pointer", fontSize:12, fontWeight:600, marginBottom:8,
                  }}>
                    {aiLoading ? "..." : (isAr ? "تحليل الذكاء الاصطناعي" : "AI Analysis")}
                  </button>
                  </div>
                  {aiTip && (
                    <div style={{ background: C.primary + "11", border:`1px solid ${C.primary}33`, borderRadius:8, padding:10, fontSize:12, color:C.text, lineHeight:1.6 }}>
                      {aiTip}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ══════════════════════
  // SCREENER TAB
  // ══════════════════════
  const renderScreener = () => (
    <div className="su-fade" style={{ display:"flex", flexDirection:"column", gap:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
        <SelectFilter label={isAr ? "الرسملة السوقية" : "Market Cap"} val={scrMcap} onChange={setScrMcap} opts={[
          {v:"all",l:"All",ar:"الكل"},{v:"mega",l:"Mega >200B",ar:"عملاق >200B"},
          {v:"large",l:"Large 10-200B",ar:"كبير"},{v:"mid",l:"Mid 2-10B",ar:"متوسط"},{v:"small",l:"Small <2B",ar:"صغير"},
        ]} />
        <SelectFilter label={isAr ? "مضاعف الأرباح" : "P/E Ratio"} val={scrPe} onChange={setScrPe} opts={[
          {v:"all",l:"All",ar:"الكل"},{v:"<10",l:"< 10"},{v:"10-20",l:"10–20"},{v:"20-40",l:"20–40"},{v:">40",l:"> 40"},{v:"neg",l:"Negative",ar:"سالب"},
        ]} />
        <SelectFilter label={isAr ? "عائد الأرباح" : "Dividend Yield"} val={scrDiv} onChange={setScrDiv} opts={[
          {v:"all",l:"All",ar:"الكل"},{v:">1",l:"> 1%"},{v:">2",l:"> 2%"},{v:">4",l:"> 4%"},{v:">6",l:"> 6%"},
        ]} />
        <SelectFilter label={isAr ? "القطاع" : "Sector"} val={scrSector} onChange={setScrSector} opts={[
          {v:"all",l:"All Sectors",ar:"كل القطاعات"},
          ...Array.from(new Set(stocks.map(s => s.sector))).sort().map(s => ({v:s,l:s})),
        ]} />
        <SelectFilter label={isAr ? "الأداء 24 ساعة" : "Performance 24h"} val={scrPerf} onChange={setScrPerf} opts={[
          {v:"all",l:"All",ar:"الكل"},{v:"gainers",l:"Gainers",ar:"الرابحون"},{v:"losers",l:"Losers",ar:"الخاسرون"},
        ]} />
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ ...glass({ padding:"4px 14px" }), color:C.primary, fontWeight:700, fontSize:13 }}>
          {screened.length} {isAr ? "نتيجة" : "results"}
        </span>
        <button onClick={() => runAI(
          `Based on these screener filters — MCap: ${scrMcap}, P/E: ${scrPe}, Dividend: ${scrDiv}, Sector: ${scrSector}, Performance: ${scrPerf} — recommend top 5 stocks with brief rationale. Be specific.`,
          setAiScreen, setAiScreenLoading
        )} style={{
          background: C.primary + "22", border:`1px solid ${C.primary}55`, color:C.primary,
          borderRadius:9, padding:"7px 18px", cursor:"pointer", fontSize:12, fontWeight:700,
        }}>
          {aiScreenLoading ? "..." : (isAr ? "اقتراح أسهم بالذكاء الاصطناعي" : "AI Screen")}
        </button>
      </div>

      {aiScreen && (
        <div className="su-fade" style={{ ...glass({ padding:14 }), fontSize:13, color:C.text, lineHeight:1.7 }}>
          {aiScreen}
        </div>
      )}

      {/* Results table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
              {["#", isAr?"الاسم":"Name", isAr?"السعر":"Price", isAr?"الرسملة":"MCap",
                "P/E", isAr?"عائد%":"Div%", isAr?"24س":"24h%", isAr?"القطاع":"Sector"].map(h => (
                <th key={h} style={{ padding:"8px 10px", color:C.sub, fontWeight:600, textAlign: isAr ? "right" : "left", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {screened.slice(0,50).map((s, i) => (
              <tr key={s.sym} style={{ borderBottom:`1px solid ${C.border}33`, transition:"background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding:"8px 10px", color:C.sub }}>{i+1}</td>
                <td style={{ padding:"8px 10px" }}>
                  <span style={{ color:C.text, fontWeight:700 }}>{s.sym}</span>
                  <span style={{ color:C.sub, fontSize:10, marginLeft:6 }}>{s.flag}</span>
                </td>
                <td style={{ padding:"8px 10px", color:C.text, fontWeight:600 }}>${fmtPrice(s.price)}</td>
                <td style={{ padding:"8px 10px", color:C.sub }}>{s.mcap}</td>
                <td style={{ padding:"8px 10px", color:C.sub }}>{s.pe || "—"}</td>
                <td style={{ padding:"8px 10px", color: s.div > 0 ? C.green : C.sub }}>{s.div > 0 ? `${s.div}%` : "—"}</td>
                <td style={{ padding:"8px 10px", color:pctColor(s.pct), fontWeight:700 }}>{fmtPct(s.pct)}</td>
                <td style={{ padding:"8px 10px", color:C.sub, fontSize:11 }}>{s.sector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ══════════════════════
  // PORTFOLIO TAB
  // ══════════════════════
  const addHolding = () => {
    setAddError("");
    const sym = addSym.toUpperCase().trim();
    if (!sym) return setAddError(isAr ? "أدخل الرمز" : "Enter symbol");
    const qty = parseFloat(addQty);
    if (!qty || qty <= 0) return setAddError(isAr ? "كمية غير صالحة" : "Invalid qty");
    const bp = parseFloat(addPrice);
    if (!bp || bp <= 0) return setAddError(isAr ? "سعر غير صالح" : "Invalid price");
    const exists = portfolio.findIndex(h => h.sym === sym);
    if (exists >= 0) {
      const updated = [...portfolio];
      const cur = updated[exists];
      const totalQty = cur.qty + qty;
      updated[exists] = { ...cur, qty: totalQty, buyPrice: (cur.buyPrice * cur.qty + bp * qty) / totalQty };
      setPortfolio(updated);
    } else {
      setPortfolio([...portfolio, { sym, qty, buyPrice: bp }]);
    }
    setAddSym(""); setAddQty(""); setAddPrice("");
  };

  const renderPortfolio = () => (
    <div className="su-fade" style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* Summary card */}
      {holdings.length > 0 && (
        <div style={{ ...glass({ padding:16 }), display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:12 }}>
          {[
            { l: isAr ? "القيمة الإجمالية" : "Total Value",   v: `$${totalValue.toFixed(2)}`,  c: C.text },
            { l: isAr ? "إجمالي التكلفة"   : "Total Cost",    v: `$${totalCost.toFixed(2)}`,   c: C.sub  },
            { l: isAr ? "الربح/الخسارة"     : "P&L",           v: `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, c: pctColor(totalPnl) },
            { l: isAr ? "العائد%"           : "P&L %",         v: fmtPct(totalPnlPct),          c: pctColor(totalPnlPct) },
            { l: isAr ? "الأفضل أداءً"     : "Best",          v: bestH?.sym || "—",            c: C.green },
            { l: isAr ? "الأسوأ أداءً"     : "Worst",         v: worstH?.sym || "—",           c: C.red  },
          ].map(({ l, v, c }) => (
            <div key={l}>
              <div style={{ color:C.sub, fontSize:10, marginBottom:2 }}>{l}</div>
              <div style={{ color:c, fontWeight:700, fontSize:15 }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add holding form */}
      <div style={glass({ padding:14 })}>
        <div style={{ color:C.sub, fontSize:11, fontWeight:700, marginBottom:10 }}>{isAr ? "أضف سهماً" : "Add Holding"}</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"flex-end" }}>
          {[
            { placeholder: isAr ? "الرمز (AAPL)" : "Symbol (AAPL)", val: addSym, set: setAddSym },
            { placeholder: isAr ? "الكمية"       : "Quantity",       val: addQty, set: setAddQty, type:"number" },
            { placeholder: isAr ? "سعر الشراء"  : "Buy Price",      val: addPrice, set: setAddPrice, type:"number" },
          ].map(({ placeholder, val, set, type }) => (
            <input key={placeholder} value={val} onChange={e => set(e.target.value)} type={type || "text"} placeholder={placeholder} style={{
              flex:1, minWidth:120, background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`,
              color:C.text, borderRadius:8, padding:"7px 12px", fontSize:13, outline:"none",
            }} />
          ))}
          <button onClick={addHolding} style={{
            background: C.primary + "22", border:`1px solid ${C.primary}55`, color:C.primary,
            borderRadius:8, padding:"7px 18px", cursor:"pointer", fontSize:13, fontWeight:700,
          }}>{isAr ? "أضف" : "Add"}</button>
        </div>
        {addError && <div style={{ color:C.red, fontSize:12, marginTop:6 }}>{addError}</div>}
      </div>

      {/* Holdings table */}
      {holdings.length > 0 ? (
        <>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                  {[isAr?"السهم":"Stock", isAr?"الكمية":"Qty", isAr?"سعر الشراء":"Avg Price",
                    isAr?"السعر الحالي":"Cur Price", isAr?"القيمة":"Value", "P&L $", "P&L %", ""].map(h => (
                    <th key={h} style={{ padding:"8px 10px", color:C.sub, fontWeight:600, textAlign:isAr?"right":"left", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.sym} style={{ borderBottom:`1px solid ${C.border}33` }}>
                    <td style={{ padding:"8px 10px", color:C.text, fontWeight:700 }}>{h.sym}</td>
                    <td style={{ padding:"8px 10px", color:C.sub }}>{h.qty}</td>
                    <td style={{ padding:"8px 10px", color:C.sub }}>${h.buyPrice.toFixed(2)}</td>
                    <td style={{ padding:"8px 10px", color:C.text }}>${fmtPrice(h.curPrice)}</td>
                    <td style={{ padding:"8px 10px", color:C.text, fontWeight:600 }}>${h.value.toFixed(2)}</td>
                    <td style={{ padding:"8px 10px", color:pctColor(h.pnl), fontWeight:600 }}>{h.pnl >= 0 ? "+" : ""}${h.pnl.toFixed(2)}</td>
                    <td style={{ padding:"8px 10px", color:pctColor(h.pnlPct), fontWeight:700 }}>{fmtPct(h.pnlPct)}</td>
                    <td style={{ padding:"8px 10px" }}>
                      <button onClick={() => setPortfolio(portfolio.filter(p => p.sym !== h.sym))} style={{
                        background:"rgba(224,82,82,0.15)", border:"1px solid rgba(224,82,82,0.3)",
                        color:C.red, borderRadius:6, padding:"3px 10px", cursor:"pointer", fontSize:11,
                      }}>{isAr ? "حذف" : "Delete"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Allocation bars */}
          <div style={glass({ padding:14 })}>
            <div style={{ color:C.sub, fontSize:11, fontWeight:700, marginBottom:10 }}>{isAr ? "توزيع المحفظة" : "Allocation"}</div>
            {holdings.map(h => (
              <div key={h.sym} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ color:C.text, fontSize:12, fontWeight:600, width:50, flexShrink:0 }}>{h.sym}</span>
                <div style={{ flex:1, height:8, background:"rgba(255,255,255,0.06)", borderRadius:6, overflow:"hidden" }}>
                  <div style={{ width:`${(h.value / totalValue * 100).toFixed(1)}%`, height:"100%", background:C.primary, borderRadius:6, transition:"width 0.5s" }} />
                </div>
                <span style={{ color:C.sub, fontSize:11, width:40, textAlign:"right" }}>{(h.value / totalValue * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>

          <button onClick={() => { if (window.confirm(isAr ? "هل تريد إعادة تعيين المحفظة؟" : "Reset portfolio?")) setPortfolio([]); }} style={{
            alignSelf:"flex-start", background:"rgba(224,82,82,0.1)", border:"1px solid rgba(224,82,82,0.3)",
            color:C.red, borderRadius:8, padding:"7px 16px", cursor:"pointer", fontSize:12,
          }}>{isAr ? "إعادة تعيين المحفظة" : "Reset Portfolio"}</button>
        </>
      ) : (
        <div style={{ ...glass({ padding:30 }), textAlign:"center", color:C.sub }}>
          {isAr ? "محفظتك فارغة — ابدأ بإضافة أسهم" : "Your portfolio is empty — add some holdings above"}
        </div>
      )}
    </div>
  );

  // ══════════════════════
  // EARNINGS TAB
  // ══════════════════════
  const renderEarnings = () => {
    const filtered = EARNINGS_DATA.filter(e => {
      if (earnFilter === "week1") return ["Apr 11","Apr 15","Apr 17","Apr 22","Apr 23","Apr 24","Apr 25"].includes(e.date);
      if (earnFilter === "week2") return ["Apr 29","Apr 30","May 1","May 2"].includes(e.date);
      return true;
    });
    const consensusColor = c => c === "Beat" ? C.green : c === "Miss" ? C.red : C.primary;

    return (
      <div className="su-fade" style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Filter */}
        <div style={{ display:"flex", gap:8 }}>
          {[{v:"all",l:isAr?"الكل":"All"},{v:"week1",l:isAr?"هذا الأسبوع":"This Week"},{v:"week2",l:isAr?"الأسبوع القادم":"Next Week"}].map(f => (
            <button key={f.v} onClick={() => setEarnFilter(f.v)} style={{
              background: earnFilter === f.v ? C.primary + "33" : "rgba(255,255,255,0.04)",
              border: `1px solid ${earnFilter === f.v ? C.primary : C.border}`,
              color: earnFilter === f.v ? C.primary : C.sub,
              borderRadius:8, padding:"6px 16px", cursor:"pointer", fontSize:12, fontWeight:600,
            }}>{f.l}</button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {filtered.map(e => (
            <div key={e.sym} style={glass({ padding:14 })} className="su-fade">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color:C.text, fontWeight:800, fontSize:15 }}>{e.sym}</span>
                    {badge(consensusColor(e.consensus), e.consensus)}
                  </div>
                  <div style={{ color:C.sub, fontSize:11, marginTop:2 }}>{e.name}</div>
                </div>
                {badge(e.time === "BO" ? C.primary : "#F59E0B", e.time === "BO" ? (isAr ? "قبل الافتتاح" : "Before Open") : (isAr ? "بعد الإغلاق" : "After Close"))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                <div>
                  <div style={{ color:C.sub, fontSize:10 }}>{isAr ? "التاريخ" : "Date"}</div>
                  <div style={{ color:C.text, fontWeight:600, fontSize:13 }}>{e.date}</div>
                </div>
                <div>
                  <div style={{ color:C.sub, fontSize:10 }}>{isAr ? "الأرباح المتوقعة" : "Expected EPS"}</div>
                  <div style={{ color:C.text, fontWeight:600, fontSize:13 }}>${e.eps}</div>
                </div>
                <div>
                  <div style={{ color:C.sub, fontSize:10 }}>{isAr ? "آخر ربع" : "Last EPS"}</div>
                  <div style={{ color:C.sub, fontSize:13 }}>${e.lastEps}</div>
                </div>
              </div>

              <button onClick={() => {
                setEarnAiLoading(prev => ({...prev, [e.sym]: true}));
                proxyAI(`Predict earnings for ${e.name} (${e.sym}). Expected EPS $${e.eps}, last EPS $${e.lastEps}. Give 2-sentence bull/bear outlook.`, 200)
                  .then(r => setEarnAi(prev => ({...prev, [e.sym]: r})))
                  .catch(() => setEarnAi(prev => ({...prev, [e.sym]: "Analysis unavailable."})))
                  .finally(() => setEarnAiLoading(prev => ({...prev, [e.sym]: false})));
              }} style={{
                background: C.primary + "15", border:`1px solid ${C.primary}33`, color:C.primary,
                borderRadius:7, padding:"5px 12px", cursor:"pointer", fontSize:11, fontWeight:600, marginBottom:6,
              }}>{earnAiLoading[e.sym] ? "..." : (isAr ? "توقع الذكاء الاصطناعي" : "AI Prediction")}</button>

              {earnAi[e.sym] && (
                <div style={{ background: C.primary + "0d", border:`1px solid ${C.primary}22`, borderRadius:7, padding:8, fontSize:11, color:C.text, lineHeight:1.6 }}>
                  {earnAi[e.sym]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ══════════════════════
  // ETFs TAB
  // ══════════════════════
  const renderETFs = () => {
    const cats = ["all","Broad Market","Tech","Bonds","Commodity","Sector","Dividend","Growth"];
    const etfFiltered = ETF_DATA.filter(e => etfCat === "all" || e.cat === etfCat);
    const cmpA = ETF_DATA.find(e => e.sym === etfCmp[0]);
    const cmpB = ETF_DATA.find(e => e.sym === etfCmp[1]);

    return (
      <div className="su-fade" style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {/* Category filter */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setEtfCat(c)} style={{
              background: etfCat === c ? C.primary + "33" : "rgba(255,255,255,0.04)",
              border: `1px solid ${etfCat === c ? C.primary : C.border}`,
              color: etfCat === c ? C.primary : C.sub,
              borderRadius:8, padding:"5px 14px", cursor:"pointer", fontSize:11, fontWeight:600,
            }}>{c === "all" ? (isAr ? "الكل" : "All") : c}</button>
          ))}
        </div>

        {/* ETF cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:12 }}>
          {etfFiltered.map(etf => {
            const inCmp = etfCmp.includes(etf.sym);
            return (
              <div key={etf.sym} style={{ ...glass({ padding:14, cursor:"pointer",
                border: inCmp ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
              }) }}
                onMouseEnter={e => e.currentTarget.style.background = C.cardHov}
                onMouseLeave={e => e.currentTarget.style.background = C.card}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ color:C.text, fontWeight:800, fontSize:15 }}>{etf.sym}</div>
                    <div style={{ color:C.sub, fontSize:11, marginTop:2, maxWidth:160 }}>{etf.name}</div>
                  </div>
                  {badge(C.primary, etf.cat)}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:10 }}>
                  <div>
                    <div style={{ color:C.sub, fontSize:10 }}>{isAr ? "السعر" : "Price"}</div>
                    <div style={{ color:C.text, fontWeight:700, fontSize:15 }}>${etf.price.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ color:C.sub, fontSize:10 }}>24h</div>
                    <div style={{ color:pctColor(etf.pct), fontWeight:700 }}>{fmtPct(etf.pct)}</div>
                  </div>
                  <div>
                    <div style={{ color:C.sub, fontSize:10 }}>YTD</div>
                    <div style={{ color:pctColor(etf.ytd), fontWeight:600, fontSize:13 }}>{fmtPct(etf.ytd)}</div>
                  </div>
                  <div>
                    <div style={{ color:C.sub, fontSize:10 }}>{isAr ? "رسوم الإدارة" : "Expense Ratio"}</div>
                    <div style={{ color:C.sub, fontSize:13 }}>{etf.er}%</div>
                  </div>
                </div>

                <div style={{ marginTop:8, borderTop:`1px solid ${C.border}`, paddingTop:8 }}>
                  <div style={{ color:C.sub, fontSize:10, marginBottom:4 }}>
                    AUM: <span style={{ color:C.text }}>{etf.aum}</span> &nbsp;|&nbsp;
                    {isAr ? "أكبر المقتنيات" : "Top Holdings"}: <span style={{ color:C.text }}>{etf.top.join(", ")}</span>
                  </div>
                </div>

                <button onClick={() => setEtfCmp(prev => {
                  if (prev.includes(etf.sym)) return prev.map(x => x === etf.sym ? null : x);
                  if (prev[0] === null) return [etf.sym, prev[1]];
                  if (prev[1] === null) return [prev[0], etf.sym];
                  return [etf.sym, prev[1]];
                })} style={{
                  marginTop:8, width:"100%", background: inCmp ? C.primary + "33" : "rgba(255,255,255,0.05)",
                  border:`1px solid ${inCmp ? C.primary : C.border}`, color: inCmp ? C.primary : C.sub,
                  borderRadius:7, padding:"5px", cursor:"pointer", fontSize:11, fontWeight:600,
                }}>{inCmp ? (isAr ? "تم الاختيار ✓" : "Selected ✓") : (isAr ? "قارن" : "Compare")}</button>
              </div>
            );
          })}
        </div>

        {/* Comparison panel */}
        {cmpA && cmpB && (
          <div className="su-fade" style={glass({ padding:18 })}>
            <div style={{ color:C.sub, fontSize:11, fontWeight:700, marginBottom:12 }}>{isAr ? "مقارنة الصناديق" : "ETF Comparison"}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", gap:16, alignItems:"start" }}>
              {[cmpA, cmpB].map((etf, idx) => (
                <React.Fragment key={etf.sym}>
                  {idx === 1 && <div style={{ color:C.sub, alignSelf:"center", textAlign:"center", fontWeight:700 }}>vs</div>}
                  <div>
                    <div style={{ color:C.text, fontWeight:800, fontSize:16, marginBottom:4 }}>{etf.sym}</div>
                    <div style={{ color:C.sub, fontSize:11, marginBottom:10 }}>{etf.name}</div>
                    {[
                      { l: isAr?"السعر":"Price", v:`$${etf.price.toFixed(2)}`, c:C.text },
                      { l:"24h", v:fmtPct(etf.pct), c:pctColor(etf.pct) },
                      { l:"YTD", v:fmtPct(etf.ytd), c:pctColor(etf.ytd) },
                      { l:isAr?"رسوم الإدارة":"Expense Ratio", v:`${etf.er}%`, c:C.sub },
                      { l:"AUM", v:etf.aum, c:C.sub },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${C.border}33` }}>
                        <span style={{ color:C.sub, fontSize:12 }}>{l}</span>
                        <span style={{ color:c, fontWeight:600, fontSize:12 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <button onClick={() => runAI(
              `Compare ETFs ${cmpA.sym} (${cmpA.name}) vs ${cmpB.sym} (${cmpB.name}). ${cmpA.sym}: price $${cmpA.price}, YTD ${cmpA.ytd}%, expense ${cmpA.er}%. ${cmpB.sym}: price $${cmpB.price}, YTD ${cmpB.ytd}%, expense ${cmpB.er}%. Which is better for long-term investor and why?`,
              setEtfAi, setEtfAiLoading
            )} style={{
              marginTop:12, background: C.primary + "22", border:`1px solid ${C.primary}55`,
              color:C.primary, borderRadius:9, padding:"8px 18px", cursor:"pointer", fontSize:12, fontWeight:700,
            }}>{etfAiLoading ? "..." : (isAr ? "أي صندوق أفضل؟" : "Which ETF?")}</button>
            {etfAi && (
              <div className="su-fade" style={{ marginTop:10, background: C.primary + "0d", border:`1px solid ${C.primary}22`, borderRadius:9, padding:12, fontSize:12, color:C.text, lineHeight:1.7 }}>
                {etfAi}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ══ IPO CALENDAR ══════════════════════════════════════════════════════════
  const renderIPO = () => {
    const STATUS_COLOR = { priced:"#4ADE80", upcoming:C.primary, rumored:"#FBBF24" };
    const STATUS_AR = { priced:"تم التسعير", upcoming:"قادم", rumored:"متوقع" };
    const filtered = ipoFilter === "all" ? IPO_DATA : IPO_DATA.filter(x => x.status === ipoFilter);
    return (
      <div className="su-fade">
        {/* Header stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label: isAr?"إجمالي الإدراجات":"Total IPOs", value: IPO_DATA.length, icon:"📅" },
            { label: isAr?"حجم السوق المتوقع":"Expected Market Cap", value:"$371B+", icon:"💰" },
            { label: isAr?"متوسط أول يوم (مُسعَّر)":"Avg 1st Day (priced)", value:"+48.4%", icon:"🚀" },
          ].map((s,i) => (
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
              <div style={{ fontSize:22 }}>{s.icon}</div>
              <div style={{ fontSize:18, fontWeight:800, color:C.primary, marginTop:4 }}>{s.value}</div>
              <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Filter */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {["all","upcoming","priced","rumored"].map(f => (
            <button key={f} onClick={() => setIpoFilter(f)} style={{
              padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer",
              background: ipoFilter===f ? C.primary+"22" : "transparent",
              border:`1px solid ${ipoFilter===f ? C.primary : C.border}`,
              color: ipoFilter===f ? C.primary : C.sub,
            }}>
              {f==="all"?(isAr?"الكل":"All"):f==="upcoming"?(isAr?"قادم":"Upcoming"):f==="priced"?(isAr?"تم التسعير":"Priced"):(isAr?"متوقع":"Rumored")}
            </button>
          ))}
        </div>
        {/* IPO cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
          {filtered.map(ipo => (
            <div key={ipo.sym} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${STATUS_COLOR[ipo.status]},${STATUS_COLOR[ipo.status]}44)` }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:18 }}>{ipo.flag}</span>
                    <span style={{ fontWeight:800, fontSize:16, color:C.text }}>{ipo.sym}</span>
                    <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:STATUS_COLOR[ipo.status]+"22", color:STATUS_COLOR[ipo.status], fontWeight:700, border:`1px solid ${STATUS_COLOR[ipo.status]}44` }}>
                      {isAr ? STATUS_AR[ipo.status] : ipo.status}
                    </span>
                  </div>
                  <div style={{ fontSize:12, color:C.sub, marginTop:3 }}>{ipo.name}</div>
                </div>
                {ipo.change != null && (
                  <div style={{ textAlign:"center", background:"#4ADE8022", borderRadius:8, padding:"6px 10px" }}>
                    <div style={{ fontSize:14, fontWeight:800, color:"#4ADE80" }}>+{ipo.change}%</div>
                    <div style={{ fontSize:9, color:C.sub }}>{isAr?"يوم أول":"Day 1"}</div>
                  </div>
                )}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  { label:isAr?"السعر المتوقع":"Price Range", value:ipo.priceRange },
                  { label:isAr?"التقييم":"Valuation",         value:ipo.val },
                  { label:isAr?"القطاع":"Sector",              value:isAr?ipo.sectorAr:ipo.sector },
                  { label:isAr?"التاريخ":"Date",               value:ipo.date },
                ].map((d,i) => (
                  <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"8px 10px" }}>
                    <div style={{ fontSize:10, color:C.sub }}>{d.label}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text, marginTop:2 }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16, padding:12, background:C.card, borderRadius:10, border:`1px solid ${C.border}`, fontSize:12, color:C.sub }}>
          ⚠️ {isAr?"البيانات تقديرية للأغراض التعليمية فقط. ليست توصية استثمارية.":"Data is illustrative for educational purposes only. Not investment advice."}
        </div>
      </div>
    );
  };

  // ══ DIVIDEND TRACKER ══════════════════════════════════════════════════════
  const renderDividends = () => {
    const filtered = divFilter === "all" ? DIVIDEND_DATA : DIVIDEND_DATA.filter(d => d.sector === divFilter);
    const sectors = [...new Set(DIVIDEND_DATA.map(d => d.sector))];
    const totalAnnual = (sym) => {
      const shares = parseFloat(divShares[sym] || 0);
      const div = DIVIDEND_DATA.find(d => d.sym === sym);
      return div ? (shares * div.amount * 4).toFixed(2) : "0.00";
    };
    return (
      <div className="su-fade">
        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
          {[
            { label:isAr?"متوسط العائد":"Avg Yield",    value: (DIVIDEND_DATA.reduce((s,d) => s+d.yield,0)/DIVIDEND_DATA.length).toFixed(1)+"%", icon:"💹" },
            { label:isAr?"أعلى عائد":"Highest Yield",  value: Math.max(...DIVIDEND_DATA.map(d=>d.yield)).toFixed(1)+"%", icon:"🏆" },
            { label:isAr?"دفعة قادمة":"Next Payment",  value: "May 1", icon:"📅" },
            { label:isAr?"أرستقراطيات":"Div Aristocrats",value: DIVIDEND_DATA.filter(d=>d.yrsGrowth>=25).length, icon:"👑" },
          ].map((s,i) => (
            <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
              <div style={{ fontSize:18 }}>{s.icon}</div>
              <div style={{ fontSize:17, fontWeight:800, color:C.primary, marginTop:3 }}>{s.value}</div>
              <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        {/* Sector filter */}
        <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap" }}>
          {["all",...sectors].map(f => (
            <button key={f} onClick={() => setDivFilter(f)} style={{
              padding:"5px 12px", borderRadius:8, fontSize:11, fontWeight:600, cursor:"pointer",
              background: divFilter===f ? C.primary+"22" : "transparent",
              border:`1px solid ${divFilter===f ? C.primary : C.border}`,
              color: divFilter===f ? C.primary : C.sub,
            }}>{f==="all"?(isAr?"الكل":"All"):f}</button>
          ))}
        </div>
        {/* Dividend cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
          {filtered.map(div => (
            <div key={div.sym} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <div style={{ width:44, height:44, borderRadius:10, background:C.primary+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:C.primary, flexShrink:0 }}>{div.sym}</div>
              <div style={{ flex:1, minWidth:120 }}>
                <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{div.name} <span style={{ fontSize:10 }}>{div.flag}</span></div>
                <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
                  {isAr?"تاريخ الاستحقاق":"Ex-Date"}: <b style={{ color:C.text }}>{div.exDate}</b>
                  {" · "}{isAr?"تاريخ الدفع":"Pay"}: <b style={{ color:C.text }}>{div.payDate}</b>
                  {div.yrsGrowth > 0 && <span style={{ marginRight:8, marginLeft:8, fontSize:10, color:"#FBBF24" }}> 👑 {div.yrsGrowth}yr</span>}
                </div>
              </div>
              <div style={{ textAlign:"center", minWidth:60 }}>
                <div style={{ fontSize:16, fontWeight:800, color:"#4ADE80" }}>{div.yield}%</div>
                <div style={{ fontSize:10, color:C.sub }}>{isAr?"العائد":"Yield"}</div>
              </div>
              <div style={{ textAlign:"center", minWidth:70 }}>
                <div style={{ fontSize:15, fontWeight:700, color:C.text }}>${div.amount}</div>
                <div style={{ fontSize:10, color:C.sub }}>{isAr?"لكل سهم":"Per share"}</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:4, minWidth:120 }}>
                <div style={{ fontSize:10, color:C.sub }}>{isAr?"عدد الأسهم":"Shares owned"}</div>
                <input
                  type="number" placeholder="0"
                  value={divShares[div.sym] || ""}
                  onChange={e => setDivShares(p => ({ ...p, [div.sym]: e.target.value }))}
                  style={{ background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:7, padding:"5px 8px", color:C.text, fontSize:12, width:80, outline:"none" }}
                />
                {divShares[div.sym] > 0 && (
                  <div style={{ fontSize:11, color:"#FBBF24", fontWeight:700 }}>
                    ${totalAnnual(div.sym)}/yr
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Annual income summary */}
        {Object.keys(divShares).some(k => divShares[k] > 0) && (
          <div style={{ background:`linear-gradient(135deg,${C.primary}22,${C.primary}0d)`, border:`1px solid ${C.primary}44`, borderRadius:14, padding:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:8 }}>
              {isAr?"💰 دخل التوزيعات السنوي المتوقع":"💰 Estimated Annual Dividend Income"}
            </div>
            <div style={{ fontSize:28, fontWeight:900, color:"#4ADE80" }}>
              ${DIVIDEND_DATA.reduce((sum, d) => sum + (parseFloat(divShares[d.sym]||0) * d.amount * 4), 0).toLocaleString(undefined, { maximumFractionDigits:2 })}
            </div>
            <div style={{ fontSize:11, color:C.sub, marginTop:4 }}>
              {isAr?"بناءً على الأسهم المُدخَلة وعائد الربع الحالي × 4":"Based on entered shares × current quarterly dividend × 4"}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══ COMPOUND INTEREST CALCULATOR ══════════════════════════════════════════
  const renderCalc = () => {
    const P = parseFloat(calcPrincipal) || 0;
    const M = parseFloat(calcMonthly)   || 0;
    const R = (parseFloat(calcRate)     || 0) / 100 / 12;
    const N = Math.max(1, Math.min(50, parseInt(calcYears) || 20));

    // Build year-by-year data
    const years = Array.from({ length: N + 1 }, (_, i) => {
      if (i === 0) return { yr:0, compound:P, simple:P, contrib:P };
      const compound = P * Math.pow(1 + R, i*12) + (R > 0 ? M * (Math.pow(1+R,i*12)-1)/R : M*i*12);
      const simple   = P + (P * (parseFloat(calcRate)||0)/100 * i) + M*i*12;
      const contrib  = P + M*i*12;
      return { yr:i, compound, simple, contrib };
    });

    const final    = years[N];
    const totalContrib = P + M * N * 12;
    const interest = final.compound - totalContrib;

    // SVG chart
    const W = 480, H = 160, PAD = 30;
    const maxV = final.compound * 1.05;
    const xScale = i => PAD + (i / N) * (W - PAD * 2);
    const yScale = v => H - PAD - (v / maxV) * (H - PAD * 2);
    const toPath = arr => arr.map((d, i) => `${i===0?"M":"L"}${xScale(d.yr)},${yScale(d.compound)}`).join(" ");
    const toPath2 = arr => arr.map((d, i) => `${i===0?"M":"L"}${xScale(d.yr)},${yScale(d.simple)}`).join(" ");
    const toPath3 = arr => arr.map((d, i) => `${i===0?"M":"L"}${xScale(d.yr)},${yScale(d.contrib)}`).join(" ");
    const fmtM = v => v >= 1e6 ? (v/1e6).toFixed(2)+"M" : v >= 1e3 ? (v/1e3).toFixed(1)+"K" : v.toFixed(0);

    return (
      <div className="su-fade">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          {/* Inputs */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:20 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:16 }}>
              🧮 {isAr?"إعدادات الحساب":"Calculator Settings"}
            </div>
            {[
              { label:isAr?"رأس المال الأولي":"Initial Capital ($)", val:calcPrincipal, set:setCalcPrincipal },
              { label:isAr?"الإضافة الشهرية":"Monthly Addition ($)", val:calcMonthly,   set:setCalcMonthly },
              { label:isAr?"معدل العائد السنوي %":"Annual Return Rate %", val:calcRate,     set:setCalcRate },
              { label:isAr?"عدد السنوات":"Number of Years",         val:calcYears,    set:setCalcYears },
            ].map((f,i) => (
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>{f.label}</div>
                <input
                  type="number" value={f.val} onChange={e => f.set(e.target.value)}
                  style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 12px", color:C.text, fontSize:14, outline:"none", boxSizing:"border-box" }}
                />
              </div>
            ))}
          </div>
          {/* Results */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:isAr?"القيمة النهائية (مركبة)":"Final Value (Compound)", value:"$"+fmtM(final.compound), color:C.primary, big:true },
              { label:isAr?"إجمالي المساهمات":"Total Contributions",            value:"$"+fmtM(totalContrib),   color:C.text },
              { label:isAr?"الأرباح المتراكمة":"Total Interest Earned",          value:"$"+fmtM(interest),       color:"#4ADE80" },
              { label:isAr?"مضاعف الثروة":"Wealth Multiplier",                   value: (final.compound/Math.max(1,P)).toFixed(1)+"x", color:"#FBBF24" },
              { label:isAr?"القيمة البسيطة للمقارنة":"Simple Interest (for comparison)", value:"$"+fmtM(final.simple), color:C.sub },
            ].map((s,i) => (
              <div key={i} style={{ background:C.card, border:`1px solid ${s.big ? C.primary+"44" : C.border}`, borderRadius:12, padding:"12px 16px" }}>
                <div style={{ fontSize:11, color:C.sub }}>{s.label}</div>
                <div style={{ fontSize: s.big?22:17, fontWeight:800, color:s.color, marginTop:3 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
        {/* SVG Chart */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.text, marginBottom:12 }}>
            📈 {isAr?"نمو الثروة عبر الزمن":"Wealth Growth Over Time"}
          </div>
          <div style={{ overflowX:"auto" }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", maxWidth:W, display:"block", minWidth:280 }}>
              {/* Grid lines */}
              {[0.25,0.5,0.75,1].map(f => (
                <line key={f} x1={PAD} y1={yScale(maxV*f)} x2={W-PAD} y2={yScale(maxV*f)}
                  stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4,4" />
              ))}
              {/* Year labels */}
              {years.filter((_,i) => i % Math.max(1,Math.round(N/5)) === 0).map(d => (
                <text key={d.yr} x={xScale(d.yr)} y={H-6} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.35)">{d.yr}yr</text>
              ))}
              {/* Value labels on y axis */}
              {[0.5,1].map(f => (
                <text key={f} x={PAD-4} y={yScale(maxV*f)+4} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.35)">${fmtM(maxV*f)}</text>
              ))}
              {/* Fill under compound line */}
              <defs>
                <linearGradient id="calcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.primary} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={C.primary} stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path d={`${toPath(years)} L${xScale(N)},${H-PAD} L${PAD},${H-PAD} Z`} fill="url(#calcGrad)" />
              {/* Contributions baseline */}
              <path d={toPath3(years)} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="6,3" />
              {/* Simple interest */}
              <path d={toPath2(years)} fill="none" stroke="#FBBF2466" strokeWidth={1.5} strokeDasharray="4,4" />
              {/* Compound main line */}
              <path d={toPath(years)} fill="none" stroke={C.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          {/* Legend */}
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:8, fontSize:11, color:C.sub }}>
            {[
              { color:C.primary, label:isAr?"مركب":"Compound" },
              { color:"#FBBF24", label:isAr?"بسيط":"Simple", dash:true },
              { color:"rgba(255,255,255,0.3)", label:isAr?"مساهمات":"Contributions", dash:true },
            ].map((l,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:5 }}>
                <svg width={24} height={10}>
                  <line x1={0} y1={5} x2={24} y2={5} stroke={l.color} strokeWidth={2} strokeDasharray={l.dash?"4,3":undefined} />
                </svg>
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════
  // ROOT RENDER
  // ══════════════════════════════════
  return (
    <div style={{ fontFamily:"'Inter',system-ui,sans-serif", color:C.text, direction:dir }}>
      {/* Inner tab navigation */}
      <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:`1px solid ${C.border}`, paddingBottom:0, flexWrap:"wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? C.primary + "22" : "transparent",
            border:"none", borderBottom: tab === t.id ? `2px solid ${C.primary}` : "2px solid transparent",
            color: tab === t.id ? C.primary : C.sub,
            padding:"10px 18px", cursor:"pointer", fontSize:13, fontWeight:700,
            transition:"all 0.2s", borderRadius:"8px 8px 0 0",
          }}>{isAr ? t.ar : t.en}</button>
        ))}
      </div>

      {tab === "stocks"    && renderStocks()}
      {tab === "screener"  && renderScreener()}
      {tab === "portfolio" && renderPortfolio()}
      {tab === "earnings"  && renderEarnings()}
      {tab === "etfs"       && renderETFs()}
      {tab === "ipo"        && renderIPO()}
      {tab === "dividends"  && renderDividends()}
      {tab === "calculator" && renderCalc()}
    </div>
  );
};

export default StocksTab;
