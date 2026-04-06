/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { API } from "../utils/api.js";
import { proxyAI } from "../utils/ai.js";
import BrokerConnectModal from "../components/BrokerConnectModal.jsx";

/* ── TradingView Advanced Chart ── */
const TVChart = ({ symbol, theme, lang, interval = "60",
  studies = ["RSI@tv-basicstudies","MACD@tv-basicstudies","BB@tv-basicstudies"],
  chartStyle = "1", height = 480 }) => {
  const ref = useRef(null);
  const isAr = lang === "ar";

  const tvSymbol = useMemo(() => {
    const map = {
      // ── Forex ──
      "EUR/USD":"FX:EURUSD","GBP/USD":"FX:GBPUSD","USD/JPY":"FX:USDJPY",
      "AUD/USD":"FX:AUDUSD","USD/CAD":"FX:USDCAD","USD/CHF":"FX:USDCHF",
      "NZD/USD":"FX:NZDUSD","EUR/GBP":"FX:EURGBP","EUR/JPY":"FX:EURJPY",
      "GBP/JPY":"FX:GBPJPY","AUD/JPY":"FX:AUDJPY","CAD/JPY":"FX:CADJPY",
      "EUR/CHF":"FX:EURCHF","GBP/CHF":"FX:GBPCHF","USD/TRY":"FX:USDTRY",
      "USD/SGD":"FX:USDSGD","USD/ZAR":"FX:USDZAR","USD/MXN":"FX:USDMXN",
      "EUR/TRY":"FX:EURTRY","GBP/TRY":"FX:GBPTRY",
      // ── Metals ──
      "XAU/USD":"TVC:GOLD","XAG/USD":"TVC:SILVER","XPT/USD":"TVC:PLATINUM","XPD/USD":"TVC:PALLADIUM",
      // ── Crypto ──
      "BTC/USD":"BINANCE:BTCUSDT","ETH/USD":"BINANCE:ETHUSDT","BNB/USD":"BINANCE:BNBUSDT",
      "SOL/USD":"BINANCE:SOLUSDT","XRP/USD":"BINANCE:XRPUSDT","ADA/USD":"BINANCE:ADAUSDT",
      "DOGE/USD":"BINANCE:DOGEUSDT","AVAX/USD":"BINANCE:AVAXUSDT","DOT/USD":"BINANCE:DOTUSDT",
      "LINK/USD":"BINANCE:LINKUSDT","MATIC/USD":"BINANCE:MATICUSDT","UNI/USD":"BINANCE:UNIUSDT",
      "ATOM/USD":"BINANCE:ATOMUSDT","LTC/USD":"BINANCE:LTCUSDT","BCH/USD":"BINANCE:BCHUSDT",
      "SHIB/USD":"BINANCE:SHIBUSDT","TRX/USD":"BINANCE:TRXUSDT","TON/USD":"BINANCE:TONUSDT",
      "NEAR/USD":"BINANCE:NEARUSDT","APT/USD":"BINANCE:APTUSDT","ARB/USD":"BINANCE:ARBUSDT",
      "OP/USD":"BINANCE:OPUSDT","INJ/USD":"BINANCE:INJUSDT","SUI/USD":"BINANCE:SUIUSDT",
      // ── Indices ──
      "US30":"DJ:DJI","SPX500":"SP:SPX","NAS100":"NASDAQ:NDX",
      "GER40":"XETR:DAX","UK100":"LSE:UKX","JPN225":"TSE:NI225","FRA40":"EURONEXT:CAC40",
      "HK50":"HKEX:HSI","AU200":"ASX:XJO",
      // ── Energy ──
      "XTIUSD":"TVC:USOIL","XBRUSD":"TVC:UKOIL","XNGUSD":"TVC:NATGAS",
      // ── US Stocks ──
      "AAPL":"NASDAQ:AAPL","MSFT":"NASDAQ:MSFT","GOOGL":"NASDAQ:GOOGL","AMZN":"NASDAQ:AMZN",
      "META":"NASDAQ:META","NVDA":"NASDAQ:NVDA","TSLA":"NASDAQ:TSLA","AVGO":"NASDAQ:AVGO",
      "JPM":"NYSE:JPM","V":"NYSE:V","UNH":"NYSE:UNH","XOM":"NYSE:XOM","LLY":"NYSE:LLY",
      "JNJ":"NYSE:JNJ","WMT":"NYSE:WMT","MA":"NYSE:MA","HD":"NYSE:HD","CVX":"NYSE:CVX",
      "MRK":"NYSE:MRK","ABBV":"NYSE:ABBV","KO":"NYSE:KO","BAC":"NYSE:BAC","PEP":"NASDAQ:PEP",
      "COST":"NASDAQ:COST","NFLX":"NASDAQ:NFLX","AMD":"NASDAQ:AMD","INTC":"NASDAQ:INTC",
      "DIS":"NYSE:DIS","ADBE":"NASDAQ:ADBE","CRM":"NYSE:CRM","QCOM":"NASDAQ:QCOM",
      "ORCL":"NYSE:ORCL","IBM":"NYSE:IBM","GS":"NYSE:GS","MS":"NYSE:MS",
      "PLTR":"NYSE:PLTR","UBER":"NYSE:UBER","BABA":"NYSE:BABA","TSM":"NYSE:TSM",
      "NKE":"NYSE:NKE","SBUX":"NASDAQ:SBUX","TXN":"NASDAQ:TXN","ASML":"NASDAQ:ASML",
      "HSBC":"NYSE:HSBC","BP":"NYSE:BP","SHEL":"NYSE:SHEL","RIO":"NYSE:RIO",
      "SPOT":"NYSE:SPOT","SNAP":"NYSE:SNAP","RBLX":"NYSE:RBLX",
      // ── Saudi REITs (Tadawul) ──
      "RREIT":"TADAWUL:4300","MAATHER":"TADAWUL:4323","JADWA":"TADAWUL:4345",
      "JARIR":"TADAWUL:4191",
      // ── UAE REITs ──
      "EMAAR_REIT":"DFM:EMAARREIT","DUBAI_REIT":"DFM:AQARAE",
      // ── Iraq REITs → tokenized on ETH ──
      "IRQR":"BINANCE:ETHUSDT","BGDF":"BINANCE:ETHUSDT","ERRF":"BINANCE:ETHUSDT",
    };
    if (map[symbol]) return map[symbol];
    const s = symbol.replace("/","").toUpperCase();
    if (s.endsWith("USD") && s.length <= 8) return `BINANCE:${s}T`;
    if (s.endsWith("USDT")) return `BINANCE:${s}`;
    if (/^[A-Z]{6}$/.test(s)) return `FX:${s}`;
    return `NASDAQ:${s}`;
  }, [symbol]);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {};
    script.innerHTML = JSON.stringify({
      autosize: true, symbol: tvSymbol, interval, timezone: "Etc/UTC",
      theme: "dark", style: chartStyle, locale: isAr ? "ar" : "en",
      toolbar_bg: "#0a0e1a", enable_publishing: false, hide_side_toolbar: false,
      allow_symbol_change: false, studies,
      overrides: {
        "paneProperties.background": "#070A0F",
        "paneProperties.backgroundType": "solid",
        "scalesProperties.lineColor": "rgba(255,255,255,0.08)",
        "scalesProperties.textColor": "rgba(255,255,255,0.4)",
        "mainSeriesProperties.candleStyle.upColor": "#4ADE80",
        "mainSeriesProperties.candleStyle.downColor": "#E05252",
        "mainSeriesProperties.candleStyle.borderUpColor": "#4ADE80",
        "mainSeriesProperties.candleStyle.borderDownColor": "#E05252",
        "mainSeriesProperties.candleStyle.wickUpColor": "#4ADE80",
        "mainSeriesProperties.candleStyle.wickDownColor": "#E05252",
      },
      hide_top_toolbar: false, save_image: true,
      backgroundColor: "#070A0F", gridColor: "rgba(255,255,255,0.04)",
      withdateranges: true, range: "3M", details: true,
    });
    const wrapper = document.createElement("div");
    wrapper.className = "tradingview-widget-container";
    wrapper.style.cssText = "height:100%;width:100%";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.cssText = "height:100%;width:100%";
    wrapper.appendChild(inner);
    wrapper.appendChild(script);
    ref.current.appendChild(wrapper);
    return () => { if (ref.current) ref.current.innerHTML = ""; };
  }, [tvSymbol, isAr, interval, chartStyle, studies.join(",")]);

  return <div ref={ref} style={{ height, width: "100%" }} />;
};

/* ── Instrument-aware P&L multiplier (must match portfolio.py) ── */
const getLotMultiplier = (pair) => {
  if (!pair) return 100000;
  const p = pair.toUpperCase();
  if (/BTC|ETH|BNB|SOL|XRP|ADA|DOGE|DOT|AVAX|LINK|MATIC|UNI|ATOM|LTC|SHIB|ICP|TON|NEAR|ARB|OP|INJ|SUI/.test(p)) return 1;
  if (p.includes("XAU"))  return 100;
  if (p.includes("XAG"))  return 50;
  if (/XPT|XPD/.test(p))  return 50;
  if (/JPY|KRW/.test(p))  return 1000;
  if (/US30|SPX|NAS|GER|UK1|JPN|DAX|FTSE|CAC|NIKKEI|DJ|SP5|HK50|AU200/.test(p)) return 1;
  if (/WTI|BRENT|OIL|NATGAS|XNG|XTI|XBR/.test(p)) return 10;
  // Individual stocks — treat as 1 share per lot
  if (/^(AAPL|MSFT|GOOGL|AMZN|META|NVDA|TSLA|AVGO|JPM|V|UNH|XOM|LLY|JNJ|WMT|MA|HD|CVX|MRK|ABBV|KO|BAC|PEP|COST|NFLX|AMD|INTC|DIS|ADBE|CRM|QCOM|ORCL|IBM|GS|MS|PLTR|UBER|BABA|TSM|NKE|SBUX|TXN|ASML|HSBC|BP|SHEL|RIO|SPOT|SNAP|RBLX)$/.test(p)) return 1;
  return 100000;
};

/* ── Map a coin/stock symbol to its trading pair ── */
const SYMBOL_TO_PAIR = {
  BTC:"BTC/USD",ETH:"ETH/USD",BNB:"BNB/USD",SOL:"SOL/USD",XRP:"XRP/USD",
  ADA:"ADA/USD",DOGE:"DOGE/USD",AVAX:"AVAX/USD",DOT:"DOT/USD",LINK:"LINK/USD",
  MATIC:"MATIC/USD",UNI:"UNI/USD",ATOM:"ATOM/USD",LTC:"LTC/USD",BCH:"BCH/USD",
  SHIB:"SHIB/USD",TRX:"TRX/USD",TON:"TON/USD",NEAR:"NEAR/USD",APT:"APT/USD",
  ARB:"ARB/USD",OP:"OP/USD",INJ:"INJ/USD",SUI:"SUI/USD",
};

/* ── Pair categories ── */
const PAIR_CATS = {
  forex:   ["EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD","USD/CHF","NZD/USD","EUR/GBP","EUR/JPY","GBP/JPY","EUR/CHF","AUD/JPY","USD/TRY","USD/SGD"],
  metals:  ["XAU/USD","XAG/USD","XPT/USD","XPD/USD"],
  crypto:  ["BTC/USD","ETH/USD","BNB/USD","SOL/USD","XRP/USD","ADA/USD","DOGE/USD","AVAX/USD","DOT/USD","LINK/USD","MATIC/USD","UNI/USD","ATOM/USD","LTC/USD","TON/USD","NEAR/USD","ARB/USD","OP/USD","INJ/USD","SUI/USD"],
  indices: ["US30","SPX500","NAS100","GER40","UK100","JPN225","FRA40","HK50","AU200"],
  energy:  ["XTIUSD","XBRUSD","XNGUSD"],
  stocks:  ["AAPL","MSFT","GOOGL","AMZN","META","NVDA","TSLA","AVGO","JPM","V","UNH","XOM","LLY","JNJ","WMT","MA","HD","CVX","COST","NFLX","AMD","INTC","DIS","ADBE","CRM","QCOM","ORCL","GS","MS","PLTR","UBER","BABA","TSM","NKE","SBUX","ASML","HSBC","BP","SHEL","RIO"],
};

const CAT_LABELS = {
  forex:   { ar:"فوركس",      en:"Forex"   },
  metals:  { ar:"معادن",      en:"Metals"  },
  crypto:  { ar:"كريبتو",     en:"Crypto"  },
  indices: { ar:"مؤشرات",     en:"Indices" },
  energy:  { ar:"طاقة",       en:"Energy"  },
  stocks:  { ar:"أسهم",       en:"Stocks"  },
};

/* ── Detect category from a pair string ── */
const detectCat = (pair) => {
  if (!pair) return "forex";
  const p = pair.toUpperCase();
  if (PAIR_CATS.crypto.includes(pair))  return "crypto";
  if (PAIR_CATS.metals.includes(pair))  return "metals";
  if (PAIR_CATS.indices.includes(pair)) return "indices";
  if (PAIR_CATS.energy.includes(pair))  return "energy";
  if (PAIR_CATS.stocks.includes(pair))  return "stocks";
  if (/BTC|ETH|BNB|SOL|XRP|ADA|DOGE|AVAX|DOT|LINK|MATIC|UNI|ATOM|LTC|TON|NEAR|ARB|OP|INJ|SUI/.test(p)) return "crypto";
  if (/XAU|XAG|XPT|XPD|GOLD|SILVER/.test(p)) return "metals";
  if (/US30|SPX|NAS|GER|UK1|JPN|FRA|HK5|AU2/.test(p)) return "indices";
  if (/OIL|BRENT|NATGAS|XTI|XBR|XNG/.test(p)) return "energy";
  if (/^[A-Z]{1,5}$/.test(p)) return "stocks";
  return "forex";
};

/* ── Parse AI signal into structured object ── */
const parseSignal = (text) => {
  if (!text) return null;
  const upper = text.toUpperCase();
  let dir = "WAIT", conf = 70;
  if (/BUY|BULLISH|شراء|صعودي/.test(upper))  dir = "BUY";
  if (/SELL|BEARISH|بيع|هبوطي/.test(upper)) dir = "SELL";
  const pct = text.match(/(\d{1,3})%/);
  if (pct) conf = parseInt(pct[1]);
  return { dir, conf, raw: text };
};

/* ═══════════════════════════════════════════════════════════
   TRADING TAB — Professional Trading Interface
═══════════════════════════════════════════════════════════ */
const TradingTab = ({ theme, lang, prices, portfolio, setPortfolio,
  chartPair, setChartPair, chartInterval, setChartInterval,
  chartType, setChartType, chartStudies, setChartStudies }) => {

  const isAr = lang === "ar";
  const P    = theme?.primary  || "#D4A843";
  const C = {
    card:    "rgba(255,255,255,0.025)",
    card2:   "rgba(255,255,255,0.04)",
    border:  "rgba(255,255,255,0.07)",
    border2: "rgba(255,255,255,0.12)",
    sub:     "rgba(238,232,218,0.42)",
    text:    "#EEE8DA",
    green:   "#4ADE80",
    red:     "#E05252",
    blue:    "#60A5FA",
    yellow:  "#FBBF24",
    bg:      "#070A0F",
  };

  /* ── State ── */
  const [side,        setSide]        = useState("buy");
  const [orderType,   setOrderType]   = useState("market");
  const [lots,        setLots]        = useState("0.1");
  const [limitPx,     setLimitPx]     = useState("");
  const [sl,          setSl]          = useState("");
  const [tp,          setTp]          = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [tradeMsg,    setTradeMsg]    = useState(null);
  const [orderBook,   setOrderBook]   = useState({ asks:[], bids:[] });
  const [recentTrades,setRecentTrades]= useState([]);
  const [aiRec,       setAiRec]       = useState(null);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [rightTab,    setRightTab]    = useState("trade");   // trade | calc | history
  const [pairCat,     setPairCat]     = useState(() => detectCat(chartPair));
  const [showPairs,   setShowPairs]   = useState(false);

  // Auto-switch category when chartPair changes externally (e.g. from CryptoTab/StocksTab)
  useEffect(() => {
    setPairCat(detectCat(chartPair));
  }, [chartPair]);
  const [riskPct,     setRiskPct]     = useState("1");
  const [chartH,      setChartH]      = useState(480);
  const [showClosedTrades, setShowClosedTrades] = useState(false);
  const [indicators,  setIndicators]  = useState({ rsi:true, macd:true, bb:false, stoch:false, ema:false });
  const [toast,       setToast]       = useState(null);
  const [alertPrice,  setAlertPrice]  = useState("");
  const [alertDir,    setAlertDir]    = useState("above");
  const [addingAlert, setAddingAlert] = useState(false);
  const [oneClick,    setOneClick]    = useState(false);
  const [trailStop,   setTrailStop]   = useState(false);
  const [trailPips,   setTrailPips]   = useState("20");
  const [patterns,    setPatterns]    = useState([]);
  const [showPatterns,setShowPatterns]= useState(false);

  /* ── Broker state ── */
  const [brokers,          setBrokers]          = useState([]);
  const [activeBroker,     setActiveBroker]     = useState(null);   // selected account object
  const [showBrokerModal,  setShowBrokerModal]  = useState(false);
  const [brokersLoaded,    setBrokersLoaded]    = useState(false);

  useEffect(() => {
    API.getBrokers().then(res => {
      if (res.ok && res.data) {
        setBrokers(res.data);
        // Auto-select first active broker (prefer live, then demo)
        const sorted = [...res.data].sort((a,b) =>
          (a.account_type === "demo" ? 1 : 0) - (b.account_type === "demo" ? 1 : 0)
        );
        if (sorted.length > 0 && !activeBroker) setActiveBroker(sorted[0]);
      }
      setBrokersLoaded(true);
    });
  }, []);

  /* ── Derived ── */
  const sel   = prices.find(p => p.pair === chartPair) || prices[0];
  const px    = sel?.price  || 1;
  const sprd  = sel?.spread || 0.0002;
  const isJPY = chartPair?.includes("JPY");
  const isCrypto = /BTC|ETH|BNB|SOL|XRP|ADA|DOGE/.test(chartPair||"");
  const isIndex  = /US30|SPX|NAS|GER|UK1|JPN|FRA/.test(chartPair||"");
  const dec   = isJPY ? 3 : isCrypto ? (px > 1000 ? 2 : 4) : 5;

  const bid   = +(px - sprd / 2).toFixed(dec);
  const ask   = +(px + sprd / 2).toFixed(dec);

  const lotsN   = parseFloat(lots) || 0.1;
  const mult    = getLotMultiplier(chartPair);
  const pipSize = /JPY|KRW/.test(chartPair||"") ? 0.01 : mult <= 10 ? 1 : 0.0001;
  const pipVal  = +(lotsN * mult * pipSize).toFixed(2);

  /* ── Risk-based lot calc ── */
  const riskPctN = parseFloat(riskPct) || 1;
  const balance  = portfolio?.balance || 10000;
  const slNum    = parseFloat(sl);  const tpNum = parseFloat(tp);
  const slDist   = slNum ? Math.abs(px - slNum) : 0;
  const tpDist   = tpNum ? Math.abs(tpNum - px) : 0;
  const riskAmt  = balance * riskPctN / 100;
  const autoLots = slDist > 0 ? +(riskAmt / (slDist * mult)).toFixed(2) : null;
  const rr       = (slDist > 0 && tpDist > 0) ? +(tpDist / slDist).toFixed(2) : null;
  const tpProfit = tpDist > 0 ? +(tpDist * lotsN * mult).toFixed(2) : null;
  const slLoss   = slDist > 0 ? +(slDist * lotsN * mult).toFixed(2) : null;

  /* ── Direction helper ── */
  const tradeDir = (t) => (t.action || t.type || t.dir || "buy").toLowerCase();

  /* ── Open trades with live P&L ── */
  const openTrades   = (portfolio?.trades || []).filter(t => (t.status || "open") !== "closed");
  const closedTrades = (portfolio?.history || []).slice(-20).reverse();
  const totalPL = openTrades.reduce((sum, t) => {
    const cur = prices.find(p => p.pair === t.pair);
    if (!cur) return sum;
    const dir   = tradeDir(t);
    const entry = t.entry_price || t.entry || 0;
    const ex    = dir === "buy" ? cur.bid||cur.price : cur.ask||cur.price;
    return sum + +(( dir==="buy" ? ex-entry : entry-ex) * (t.lots||0.1) * getLotMultiplier(t.pair)).toFixed(2);
  }, 0);

  /* ── Studies from toggles ── */
  const activeStudies = useMemo(() => {
    const s = [];
    if (indicators.rsi)   s.push("RSI@tv-basicstudies");
    if (indicators.macd)  s.push("MACD@tv-basicstudies");
    if (indicators.bb)    s.push("BB@tv-basicstudies");
    if (indicators.stoch) s.push("Stochastic@tv-basicstudies");
    if (indicators.ema)   s.push("MASimple@tv-basicstudies");
    return s.length ? s : ["RSI@tv-basicstudies"];
  }, [indicators]);

  const TIMEFRAMES = [
    {id:"1",l:"1m"},{id:"5",l:"5m"},{id:"15",l:"15m"},
    {id:"30",l:"30m"},{id:"60",l:"1h"},{id:"240",l:"4h"},{id:"D",l:"1D"},{id:"W",l:"1W"},
  ];

  /* ── Chart height presets ── */
  const H_PRESETS = [{v:320,l:"S"},{v:480,l:"M"},{v:640,l:"L"},{v:800,l:"XL"}];

  /* ── Order Book ── */
  useEffect(() => {
    const gen = () => {
      const step = isJPY ? 0.005 : isCrypto ? px*0.0002 : 0.00004;
      let cumA = 0, cumB = 0;
      const asks = Array.from({length:12},(_,i)=>({
        price: +(ask+(i+1)*step*(1+Math.random()*0.4)).toFixed(dec),
        vol:   +(Math.random()*4+0.05).toFixed(2), cum:0,
      }));
      const bids = Array.from({length:12},(_,i)=>({
        price: +(bid-(i+1)*step*(1+Math.random()*0.4)).toFixed(dec),
        vol:   +(Math.random()*4+0.05).toFixed(2), cum:0,
      }));
      asks.forEach(a => { cumA = +(cumA+a.vol).toFixed(2); a.cum=cumA; });
      bids.forEach(b => { cumB = +(cumB+b.vol).toFixed(2); b.cum=cumB; });
      setOrderBook({ asks:[...asks].reverse(), bids });
    };
    gen();
    const id = setInterval(gen, 1500);
    return () => clearInterval(id);
  }, [chartPair, px]);

  /* ── Recent trades stream ── */
  useEffect(() => {
    const init = Array.from({length:20},(_,i) => {
      const s = Math.random()>0.5?"buy":"sell";
      return { id:Date.now()-i*900, side:s,
        price:+(px+(Math.random()-0.5)*sprd*8).toFixed(dec),
        vol:+(Math.random()*3+0.01).toFixed(2), ts:new Date(Date.now()-i*Math.random()*20000) };
    });
    setRecentTrades(init);
    const id = setInterval(() => {
      const s = Math.random()>0.5?"buy":"sell";
      setRecentTrades(prev=>[{
        id:Date.now(), side:s,
        price:+(px+(Math.random()-0.5)*sprd*4).toFixed(dec),
        vol:+(Math.random()*2+0.01).toFixed(2), ts:new Date(),
      },...prev.slice(0,19)]);
    }, 600);
    return () => clearInterval(id);
  }, [chartPair, px]);

  /* ── Sentiment from order book ── */
  const sentiment = useMemo(() => {
    const buyVol  = orderBook.bids.reduce((s,b)=>s+b.vol,0);
    const sellVol = orderBook.asks.reduce((s,a)=>s+a.vol,0);
    const total   = buyVol + sellVol || 1;
    return { buy: +(buyVol/total*100).toFixed(0), sell: +(sellVol/total*100).toFixed(0) };
  }, [orderBook]);

  /* ── AI Recommendation ── */
  const fetchAi = useCallback(async () => {
    setAiLoading(true);
    setAiRec(null);
    const prompt = isAr
      ? `زوج ${sel?.pair} السعر ${sel?.price?.toFixed(dec)} التغير ${sel?.pct}% — في جملة واحدة فقط: التوصية (شراء/بيع/انتظر) مع نسبة الثقة ومستوى المقاومة/الدعم الأقرب`
      : `${sel?.pair} @ ${sel?.price?.toFixed(dec)} (${sel?.pct>0?"+":""}${sel?.pct}%) — ONE sentence: BUY/SELL/WAIT with confidence % and nearest support/resistance level`;
    const res = await proxyAI(prompt, 100);
    setAiRec(res || (isAr?"تعذّر الاتصال":"AI unavailable"));
    setAiLoading(false);
  }, [chartPair, px, isAr]);

  useEffect(() => { fetchAi(); }, [chartPair]);

  /* ── Submit order ── */
  const submitOrder = async () => {
    if (!chartPair) return;

    // Require broker selection
    if (brokersLoaded && brokers.length === 0) {
      setShowBrokerModal(true);
      return;
    }

    setSubmitting(true);
    setTradeMsg(null);
    const entryPx = side==="buy" ? ask : bid;
    const slVal   = sl ? parseFloat(sl) : +(side==="buy" ? px*0.998 : px*1.002).toFixed(dec);
    const tpVal   = tp ? parseFloat(tp) : +(side==="buy" ? px*1.004 : px*0.996).toFixed(dec);

    let res;
    if (activeBroker) {
      // ── Real / Demo broker execution via backend ──────────────────
      res = await API.executeBrokerTrade({
        broker_account_id: activeBroker.id,
        pair:        chartPair,
        action:      side.toUpperCase(),
        lots:        lotsN,
        order_type:  orderType,
        entry_price: orderType==="limit" ? parseFloat(limitPx)||entryPx : entryPx,
        sl:          slVal,
        tp:          tpVal,
      });
    } else {
      // ── Fallback: demo portfolio endpoint ────────────────────────
      res = await API.openTrade({
        pair: chartPair, action: side.toUpperCase(), lots: lotsN,
        entry_price: orderType==="limit" ? parseFloat(limitPx)||entryPx : entryPx,
        sl: slVal, tp: tpVal,
      });
    }

    if (res.ok) {
      const label = activeBroker
        ? (activeBroker.account_type === "demo" ? "🎮 Demo" : "🏦 " + activeBroker.label)
        : "Demo";
      showToast(
        isAr
          ? `✅ ${side==="buy"?"شراء":"بيع"} ${chartPair} — ${label}`
          : `✅ ${side.toUpperCase()} ${chartPair} via ${label}`,
        "green"
      );
      setTradeMsg({
        ok:  true,
        msg: isAr
          ? `✅ تم فتح صفقة ${side==="buy"?"شراء":"بيع"} ${chartPair}`
          : `✅ ${side.toUpperCase()} ${chartPair} opened!`,
      });
      if (res.data?.trade) setPortfolio(p => ({ ...p, trades: [...(p.trades||[]), res.data.trade] }));
      else if (res.data)   setPortfolio(p => ({ ...p, trades: [...(p.trades||[]), res.data] }));
      setSl(""); setTp(""); setLots("0.1");
    } else {
      setTradeMsg({ ok:false, msg: res.error || (isAr?"فشل فتح الصفقة":"Trade failed") });
    }
    setSubmitting(false);
    setTimeout(()=>setTradeMsg(null), 4000);
  };

  /* ── Close trade ── */
  const closeTrade = async (tradeId) => {
    const t   = portfolio?.trades?.find(x => x.id === tradeId);
    const cur = prices.find(p => p.pair === t?.pair);
    const exitPrice = cur?.price || px;
    const res = await API.closeTrade(tradeId, exitPrice);
    if (res.ok) {
      const dir   = tradeDir(t);
      const entry = t.entry_price || t.entry || 0;
      const pips  = dir==="buy" ? exitPrice-entry : entry-exitPrice;
      const pl    = +(pips * (t.lots||0.1) * getLotMultiplier(t.pair)).toFixed(2);
      setPortfolio(prev => ({
        ...prev,
        trades:  prev.trades.map(x => x.id===tradeId ? {...x,status:"closed",closed:true,exit_price:exitPrice} : x),
        history: [...(prev.history||[]), {...t, pl, exit_price:exitPrice, closed_at:new Date().toISOString()}],
      }));
      showToast(`${pl>=0?"✅":"❌"} Closed ${t?.pair} ${pl>=0?"+":""}$${pl}`, pl>=0?"green":"red");
    }
  };

  /* ── Pattern Scanner ── */
  useEffect(() => {
    const PATTERNS = [
      { name:"Doji", nameAr:"دوجي", bias:"neutral", conf:Math.floor(Math.random()*30+60) },
      { name:"Hammer", nameAr:"مطرقة", bias:"bullish", conf:Math.floor(Math.random()*30+65) },
      { name:"Engulfing", nameAr:"ابتلاع", bias:Math.random()>0.5?"bullish":"bearish", conf:Math.floor(Math.random()*25+70) },
      { name:"Morning Star", nameAr:"نجم الصباح", bias:"bullish", conf:Math.floor(Math.random()*20+75) },
      { name:"Shooting Star", nameAr:"نجم ساقط", bias:"bearish", conf:Math.floor(Math.random()*25+68) },
      { name:"Hanging Man", nameAr:"رجل معلق", bias:"bearish", conf:Math.floor(Math.random()*30+62) },
      { name:"Tweezer Top", nameAr:"قمة ملقاط", bias:"bearish", conf:Math.floor(Math.random()*20+72) },
      { name:"Piercing Line", nameAr:"خط ثاقب", bias:"bullish", conf:Math.floor(Math.random()*25+67) },
    ];
    const detected = PATTERNS.sort(()=>Math.random()-0.5).slice(0, Math.floor(Math.random()*2)+1);
    setPatterns(detected);
  }, [chartPair]);

  /* ── Trailing Stop simulation ── */
  useEffect(() => {
    if (!trailStop || openTrades.length === 0) return;
    const id = setInterval(() => {
      const pips = parseFloat(trailPips) || 20;
      setPortfolio(prev => {
        if (!prev?.trades) return prev;
        const updated = prev.trades.map(t => {
          if ((t.status||"open") === "closed") return t;
          const cur = prices.find(p => p.pair === t.pair);
          if (!cur) return t;
          const dir = tradeDir(t);
          const newSl = dir === "buy"
            ? Math.max(t.sl || 0, +(cur.price - pips * 0.0001).toFixed(5))
            : Math.min(t.sl || 999999, +(cur.price + pips * 0.0001).toFixed(5));
          return { ...t, sl: newSl };
        });
        return { ...prev, trades: updated };
      });
    }, 5000);
    return () => clearInterval(id);
  }, [trailStop, trailPips, openTrades.length, prices]);

  /* ── Add price alert ── */
  const addAlert = async () => {
    if (!alertPrice) return;
    setAddingAlert(true);
    const res = await API.createAlert({ pair: chartPair, price: parseFloat(alertPrice), direction: alertDir });
    if (res.ok) showToast(isAr?`🔔 تنبيه مضاف عند ${alertPrice}`:`🔔 Alert set at ${alertPrice}`, "yellow");
    else        showToast(isAr?"فشل إضافة التنبيه":"Alert failed","red");
    setAlertPrice(""); setAddingAlert(false);
  };

  /* ── Toast ── */
  const showToast = (msg, type="green") => {
    setToast({ msg, type });
    setTimeout(()=>setToast(null), 3000);
  };

  /* ── Apply auto lots from risk ── */
  const applyAutoLots = () => {
    if (autoLots && autoLots > 0) setLots(String(Math.min(autoLots, 100)));
  };

  /* ── Style helpers ── */
  const btnStyle = (active, col) => ({
    flex:1, padding:"11px 0", border:`1px solid ${active?col:`${col}35`}`,
    borderRadius:9, background:active?col:"transparent",
    color:active?"#000":col, fontSize:13, fontWeight:900, cursor:"pointer", transition:"all 0.15s",
  });
  const inp = {
    width:"100%", padding:"9px 12px", background:"rgba(255,255,255,0.04)",
    border:`1px solid ${C.border}`, borderRadius:8, color:C.text,
    fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  };
  const lbl = { fontSize:10, color:C.sub, fontWeight:700, marginBottom:4, display:"block" };
  const card = (extra={}) => ({ background:C.card, border:`1px solid ${C.border}`, borderRadius:13, overflow:"hidden", ...extra });

  const maxVol   = Math.max(...orderBook.asks.map(a=>a.vol), ...orderBook.bids.map(b=>b.vol), 1);
  const signal   = parseSignal(aiRec);
  const sigColor = signal?.dir==="BUY" ? C.green : signal?.dir==="SELL" ? C.red : C.yellow;

  return (
    <div style={{ animation:"fadeUp 0.3s ease", fontFamily: isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif", direction:isAr?"rtl":"ltr" }}>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateX(50%)}to{opacity:1;transform:translateX(0)}}
        .hide-scrollbar::-webkit-scrollbar{display:none}
        .pair-btn:hover{opacity:0.85;transform:translateY(-1px)}
        @media(max-width:900px){.trading-grid{grid-template-columns:1fr !important}}
        @media(max-width:600px){.tf-strip{flex-wrap:wrap!important} .pair-strip{gap:4px!important}}
      `}</style>

      {/* ══ BROKER CONNECT MODAL ══ */}
      {showBrokerModal && (
        <BrokerConnectModal
          isAr={isAr} theme={theme?.name || "dark"}
          onClose={() => setShowBrokerModal(false)}
          onBrokerAdded={(acc) => {
            setBrokers(prev => {
              const next = [...prev.filter(b => b.id !== acc.id), acc];
              return next;
            });
            setActiveBroker(acc);
            setShowBrokerModal(false);
          }}
        />
      )}

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={{ position:"fixed", top:20, right:20, zIndex:9999, animation:"toastIn .3s ease",
          padding:"12px 20px", borderRadius:12, fontWeight:700, fontSize:13,
          background: toast.type==="green"?"rgba(74,222,128,0.15)":toast.type==="red"?"rgba(224,82,82,0.15)":"rgba(251,191,36,0.15)",
          border:`1px solid ${toast.type==="green"?"rgba(74,222,128,0.4)":toast.type==="red"?"rgba(224,82,82,0.4)":"rgba(251,191,36,0.4)"}`,
          color: toast.type==="green"?C.green:toast.type==="red"?C.red:C.yellow,
          backdropFilter:"blur(12px)", boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
          {toast.msg}
        </div>
      )}

      {/* ══ PAIR CATEGORY TABS ══ */}
      <div style={{ display:"flex", gap:4, marginBottom:10, flexWrap:"wrap" }}>
        {Object.keys(PAIR_CATS).map(cat => (
          <button key={cat} onClick={()=>{setPairCat(cat);setShowPairs(true);}}
            style={{ padding:"5px 14px", borderRadius:20,
              border:`1px solid ${pairCat===cat?P:`${P}25`}`,
              background:pairCat===cat?`${P}18`:"transparent",
              color:pairCat===cat?P:"rgba(255,255,255,0.4)",
              fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
            {CAT_LABELS[cat][isAr?"ar":"en"]}
          </button>
        ))}
        <button onClick={()=>setShowPairs(v=>!v)}
          style={{ marginLeft:"auto", padding:"5px 12px", borderRadius:20, border:`1px solid ${C.border}`,
            background:"transparent", color:C.sub, fontSize:11, cursor:"pointer" }}>
          {showPairs?(isAr?"▲ إخفاء":"▲ Hide"):(isAr?"▼ اختر زوج":"▼ Pairs")}
        </button>
      </div>

      {/* ══ PAIR GRID (collapsible) ══ */}
      {showPairs && (
        <div style={{ ...card(), marginBottom:10, padding:10 }}>
          <div className="pair-strip" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {PAIR_CATS[pairCat].map(p => {
              const d = prices.find(x=>x.pair===p);
              const active = chartPair===p;
              const pDec = p.includes("JPY")?3:/BTC|ETH/.test(p)&&(d?.price||0)>1000?2:5;
              return (
                <button key={p} className="pair-btn"
                  onClick={()=>{setChartPair(p);setShowPairs(false);}}
                  style={{ padding:"8px 12px", borderRadius:10,
                    background:active?`${P}18`:"rgba(255,255,255,0.03)",
                    border:`1px solid ${active?P:C.border}`,
                    cursor:"pointer", textAlign:"center", minWidth:90, transition:"all 0.2s" }}>
                  <div style={{ fontSize:11, fontWeight:800, color:active?P:C.text }}>{p}</div>
                  <div style={{ fontSize:12, fontWeight:900, color:d?.pct>=0?C.green:C.red, fontFamily:"'DM Mono',monospace" }}>
                    {d?.price?.toFixed(pDec)||"—"}
                  </div>
                  <div style={{ fontSize:9, color:d?.pct>=0?C.green:C.red }}>{d?.pct>=0?"+":""}{d?.pct||0}%</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ TOP STRIP: AI Signal + P&L + Sentiment ══ */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:10, marginBottom:12 }}>

        {/* AI Signal */}
        <div style={{ padding:"10px 14px", background:`${sigColor}08`,
          border:`1px solid ${sigColor}22`, borderRadius:12,
          display:"flex", alignItems:"center", gap:10 }}>
          {signal ? (
            <div style={{ width:44, height:44, borderRadius:10, flexShrink:0,
              background:`${sigColor}18`, border:`1px solid ${sigColor}33`,
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontSize:11, fontWeight:900, color:sigColor }}>{signal.dir}</div>
              <div style={{ fontSize:8, color:C.sub }}>{signal.conf}%</div>
            </div>
          ) : (
            <div style={{ width:32, height:32, borderRadius:8, background:`${P}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🤖</div>
          )}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:9, color:C.sub, fontWeight:700, letterSpacing:"1px", marginBottom:2 }}>
              AI · {chartPair}
            </div>
            {signal && (
              <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, marginBottom:4, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${signal.conf}%`, background:sigColor, borderRadius:2, transition:"width 0.5s" }} />
              </div>
            )}
            <div style={{ fontSize:11, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {aiLoading ? <span style={{ color:C.sub }}>{isAr?"جاري التحليل...":"Analyzing..."}</span> : (aiRec||"—")}
            </div>
          </div>
          <button onClick={fetchAi} disabled={aiLoading}
            style={{ padding:"5px 10px", background:"transparent", border:`1px solid ${P}30`,
              borderRadius:7, color:P, fontSize:10, cursor:"pointer", fontWeight:700, flexShrink:0 }}>
            ↻
          </button>
        </div>

        {/* Sentiment meter */}
        <div style={{ ...card(), padding:"10px 14px" }}>
          <div style={{ fontSize:9, color:C.sub, fontWeight:700, letterSpacing:"1px", marginBottom:6 }}>
            {isAr?"مشاعر السوق":"MARKET SENTIMENT"}
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:800, color:C.green }}>{sentiment.buy}%</span>
            <div style={{ flex:1, height:6, borderRadius:3, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${sentiment.buy}%`, background:`linear-gradient(90deg,${C.green},${C.green}99)`, borderRadius:3, transition:"width .5s" }}/>
            </div>
            <span style={{ fontSize:12, fontWeight:800, color:C.red }}>{sentiment.sell}%</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:C.sub }}>
            <span>{isAr?"شراء":"BULL"}</span>
            <span style={{ color:sentiment.buy>55?C.green:sentiment.sell>55?C.red:C.yellow, fontWeight:700 }}>
              {sentiment.buy>55?(isAr?"صعودي":"BULLISH"):sentiment.sell>55?(isAr?"هبوطي":"BEARISH"):(isAr?"محايد":"NEUTRAL")}
            </span>
            <span>{isAr?"بيع":"BEAR"}</span>
          </div>
        </div>

        {/* Open P&L pill */}
        <div style={{ padding:"10px 16px", background:totalPL>=0?"rgba(74,222,128,0.07)":"rgba(224,82,82,0.07)",
          border:`1px solid ${totalPL>=0?"rgba(74,222,128,0.2)":"rgba(224,82,82,0.2)"}`,
          borderRadius:12, textAlign:"center", minWidth:100, cursor:"pointer" }}
          onClick={()=>setShowClosedTrades(v=>!v)}>
          <div style={{ fontSize:8, color:C.sub, fontWeight:700 }}>{isAr?"P&L الإجمالي":"OPEN P&L"}</div>
          <div style={{ fontSize:18, fontWeight:900, color:totalPL>=0?C.green:C.red, fontFamily:"'DM Mono',monospace" }}>
            {totalPL>=0?"+":""}{totalPL.toFixed(2)}$
          </div>
          <div style={{ fontSize:9, color:C.sub }}>{openTrades.length} {isAr?"مفتوحة":"open"}</div>
        </div>
      </div>

      {/* ══ OPEN POSITIONS TABLE ══ */}
      {openTrades.length > 0 && (
        <div style={{ ...card(), marginBottom:12, animation:"slideIn .3s ease" }}>
          <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}`,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:10, fontWeight:700, color:C.sub, letterSpacing:"1.5px" }}>
              {isAr?"الصفقات المفتوحة":"OPEN POSITIONS"} ({openTrades.length})
            </span>
            <span style={{ fontSize:11, fontWeight:800, color:totalPL>=0?C.green:C.red, fontFamily:"'DM Mono',monospace" }}>
              {totalPL>=0?"+":""}{totalPL.toFixed(2)}$
            </span>
          </div>
          {openTrades.map(t => {
            const cur   = prices.find(p => p.pair === t.pair);
            const dir   = tradeDir(t);
            const entry = t.entry_price || t.entry || 0;
            const ex    = cur ? (dir==="buy" ? cur.bid||cur.price : cur.ask||cur.price) : entry;
            const pips  = dir==="buy" ? ex-entry : entry-ex;
            const pl    = +(pips * (t.lots||0.1) * getLotMultiplier(t.pair)).toFixed(2);
            const pct   = +(pl/balance*100).toFixed(2);
            const pDec  = t.pair?.includes("JPY")?3:5;
            return (
              <div key={t.id} style={{ display:"grid", gridTemplateColumns:"1fr 0.7fr 0.7fr 0.9fr auto",
                padding:"8px 14px", borderBottom:`1px solid rgba(255,255,255,0.03)`,
                alignItems:"center", background:pl>=0?"rgba(74,222,128,0.015)":"rgba(224,82,82,0.015)" }}>
                <div>
                  <span style={{ fontSize:12, fontWeight:800, color:C.text }}>{t.pair}</span>
                  <span style={{ marginLeft:6, fontSize:9, padding:"2px 6px", borderRadius:4,
                    background:dir==="buy"?`${C.green}18`:`${C.red}18`,
                    color:dir==="buy"?C.green:C.red, fontWeight:700 }}>
                    {dir==="buy"?(isAr?"شراء":"BUY"):(isAr?"بيع":"SELL")}
                  </span>
                  <div style={{ fontSize:9, color:C.sub, marginTop:1 }}>{t.lots||0.1} {isAr?"لوت":"lots"} @ {entry.toFixed?.(pDec)||entry}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:C.sub }}>{ex.toFixed?.(pDec)||ex}</div>
                  <div style={{ fontSize:9, color:C.sub }}>{isAr?"الحالي":"current"}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:800, color:pl>=0?C.green:C.red, fontFamily:"'DM Mono',monospace" }}>
                    {pl>=0?"+":""}{pl}$
                  </div>
                  <div style={{ fontSize:9, color:pl>=0?C.green:C.red }}>{pct>=0?"+":""}{pct}%</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  {t.sl && <div style={{ fontSize:9, color:C.red }}>SL {t.sl}</div>}
                  {t.tp && <div style={{ fontSize:9, color:C.green }}>TP {t.tp}</div>}
                </div>
                <button onClick={()=>closeTrade(t.id)}
                  style={{ padding:"5px 10px", background:"rgba(224,82,82,0.1)",
                    border:"1px solid rgba(224,82,82,0.3)", borderRadius:7,
                    color:C.red, fontSize:10, fontWeight:700, cursor:"pointer" }}>
                  {isAr?"إغلاق":"Close"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ MAIN GRID ══ */}
      <div className="trading-grid" style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:12, alignItems:"start" }}>

        {/* ─── LEFT: Chart + tools ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

          {/* Timeframe + Indicators + BID/ASK */}
          <div style={{ ...card(), padding:"8px 12px" }}>
            <div className="tf-strip" style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"nowrap", overflowX:"auto" }} >
              {/* TF buttons */}
              {TIMEFRAMES.map(tf=>(
                <button key={tf.id} onClick={()=>setChartInterval(tf.id)}
                  style={{ padding:"4px 10px", borderRadius:6,
                    border:`1px solid ${chartInterval===tf.id?P:C.border}`,
                    background:chartInterval===tf.id?`${P}20`:"transparent",
                    color:chartInterval===tf.id?P:C.sub,
                    fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.15s", flexShrink:0 }}>
                  {tf.l}
                </button>
              ))}
              <div style={{ width:1, height:16, background:C.border, margin:"0 4px", flexShrink:0 }} />
              {/* Indicator toggles */}
              {[["RSI","rsi"],["MACD","macd"],["BB","bb"],["Stoch","stoch"],["EMA","ema"]].map(([label,key])=>(
                <button key={key} onClick={()=>setIndicators(v=>({...v,[key]:!v[key]}))}
                  style={{ padding:"3px 8px", borderRadius:5, flexShrink:0,
                    border:`1px solid ${indicators[key]?P:C.border}`,
                    background:indicators[key]?`${P}20`:"transparent",
                    color:indicators[key]?P:C.sub,
                    fontSize:9, fontWeight:700, cursor:"pointer" }}>
                  {label}
                </button>
              ))}
              <div style={{ width:1, height:16, background:C.border, margin:"0 4px", flexShrink:0 }} />
              {/* Chart height */}
              {H_PRESETS.map(h=>(
                <button key={h.v} onClick={()=>setChartH(h.v)}
                  style={{ padding:"3px 7px", borderRadius:5, flexShrink:0,
                    border:`1px solid ${chartH===h.v?C.blue:C.border}`,
                    background:chartH===h.v?`${C.blue}20`:"transparent",
                    color:chartH===h.v?C.blue:C.sub, fontSize:9, fontWeight:700, cursor:"pointer" }}>
                  {h.l}
                </button>
              ))}
              {/* BID/ASK */}
              <div style={{ marginLeft:"auto", display:"flex", gap:10, alignItems:"center", flexShrink:0 }}>
                <span style={{ fontSize:11, color:C.green, fontWeight:800, fontFamily:"'DM Mono',monospace" }}>B {bid.toFixed(dec)}</span>
                <span style={{ fontSize:11, color:C.red,   fontWeight:800, fontFamily:"'DM Mono',monospace" }}>A {ask.toFixed(dec)}</span>
                <span style={{ fontSize:9, color:C.sub }}>SPR {(sprd*10000).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* TradingView Chart */}
          <div style={{ background:C.bg, border:`1px solid ${P}18`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 14px",
              background:`${P}05`, borderBottom:`1px solid ${P}08` }}>
              <span style={{ fontSize:15, fontWeight:900, color:P }}>{sel?.pair}</span>
              <span style={{ fontSize:13, fontWeight:900, color:sel?.pct>=0?C.green:C.red, fontFamily:"'DM Mono',monospace" }}>
                {sel?.price?.toFixed(dec)}
              </span>
              <span style={{ fontSize:10, color:sel?.pct>=0?C.green:C.red }}>
                {sel?.pct>=0?"+":""}{sel?.pct}%
              </span>
              <div style={{ fontSize:9, color:C.sub, marginLeft:4 }}>
                H:{sel?.price?(sel.price*1.005).toFixed(dec):"—"} L:{sel?.price?(sel.price*0.995).toFixed(dec):"—"}
              </div>
              <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5, fontSize:9, color:C.green }}>
                <div style={{ width:5,height:5,borderRadius:"50%",background:C.green,animation:"pulse 2s infinite" }}/>
                {isAr?"مباشر":"LIVE"}
              </div>
            </div>
            <TVChart
              symbol={chartPair} theme={theme} lang={lang}
              interval={chartInterval} studies={activeStudies}
              chartStyle={chartType||"1"} height={chartH}
            />
          </div>

          {/* Order Book + Recent Trades side by side */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>

            {/* Order Book */}
            <div style={{ ...card() }}>
              <div style={{ padding:"8px 12px", borderBottom:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:10, fontWeight:700, color:C.sub, letterSpacing:"1.5px" }}>
                  {isAr?"دفتر الأوامر":"ORDER BOOK"}
                </span>
                <span style={{ fontSize:9, color:C.sub }}>{chartPair}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 0.65fr 0.65fr",
                padding:"4px 10px", fontSize:8, color:C.sub, fontWeight:700 }}>
                <span>{isAr?"السعر":"PRICE"}</span>
                <span style={{ textAlign:"right" }}>VOL</span>
                <span style={{ textAlign:"right" }}>TOT</span>
              </div>
              {orderBook.asks.map((a,i)=>(
                <div key={i} style={{ position:"relative", display:"grid", gridTemplateColumns:"1fr 0.65fr 0.65fr",
                  padding:"2.5px 10px", fontSize:10, fontFamily:"'DM Mono',monospace" }}>
                  <div style={{ position:"absolute", right:0, top:0, bottom:0,
                    width:`${(a.vol/maxVol)*100}%`, background:"rgba(224,82,82,0.06)", transition:"width .4s" }}/>
                  <span style={{ color:C.red, fontWeight:700, position:"relative" }}>{a.price}</span>
                  <span style={{ color:C.sub, textAlign:"right", position:"relative" }}>{a.vol}</span>
                  <span style={{ color:"rgba(255,255,255,0.2)", textAlign:"right", position:"relative" }}>{a.cum}</span>
                </div>
              ))}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"5px 10px", background:"rgba(255,255,255,0.03)",
                borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, fontWeight:900, color:sel?.pct>=0?C.green:C.red,
                  fontFamily:"'DM Mono',monospace" }}>{px.toFixed(dec)}</span>
                <span style={{ fontSize:8, color:sel?.pct>=0?C.green:C.red }}>
                  {sel?.pct>=0?"▲":"▼"} {Math.abs(sel?.pct||0)}%
                </span>
              </div>
              {orderBook.bids.map((b,i)=>(
                <div key={i} style={{ position:"relative", display:"grid", gridTemplateColumns:"1fr 0.65fr 0.65fr",
                  padding:"2.5px 10px", fontSize:10, fontFamily:"'DM Mono',monospace" }}>
                  <div style={{ position:"absolute", right:0, top:0, bottom:0,
                    width:`${(b.vol/maxVol)*100}%`, background:"rgba(74,222,128,0.06)", transition:"width .4s" }}/>
                  <span style={{ color:C.green, fontWeight:700, position:"relative" }}>{b.price}</span>
                  <span style={{ color:C.sub, textAlign:"right", position:"relative" }}>{b.vol}</span>
                  <span style={{ color:"rgba(255,255,255,0.2)", textAlign:"right", position:"relative" }}>{b.cum}</span>
                </div>
              ))}
            </div>

            {/* Recent Trades */}
            <div style={{ ...card() }}>
              <div style={{ padding:"8px 12px", borderBottom:`1px solid ${C.border}`,
                fontSize:10, fontWeight:700, color:C.sub, letterSpacing:"1.5px" }}>
                {isAr?"آخر الصفقات":"RECENT TRADES"}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 0.7fr 0.65fr",
                padding:"4px 10px", fontSize:8, color:C.sub, fontWeight:700 }}>
                <span>{isAr?"السعر":"PRICE"}</span>
                <span style={{ textAlign:"right" }}>VOL</span>
                <span style={{ textAlign:"right" }}>TIME</span>
              </div>
              <div style={{ maxHeight:260, overflowY:"auto" }} className="hide-scrollbar">
                {recentTrades.map(t=>(
                  <div key={t.id} style={{ display:"grid", gridTemplateColumns:"1fr 0.7fr 0.65fr",
                    padding:"3px 10px", fontSize:10, fontFamily:"'DM Mono',monospace",
                    borderBottom:`1px solid rgba(255,255,255,0.02)` }}>
                    <span style={{ color:t.side==="buy"?C.green:C.red, fontWeight:700 }}>{t.price}</span>
                    <span style={{ color:C.sub, textAlign:"right" }}>{t.vol}</span>
                    <span style={{ color:"rgba(255,255,255,0.2)", textAlign:"right", fontSize:8 }}>
                      {t.ts.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false})}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Closed Trade History */}
          {closedTrades.length > 0 && (
            <div style={{ ...card() }}>
              <div style={{ padding:"8px 14px", borderBottom:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", cursor:"pointer" }}
                onClick={()=>setShowClosedTrades(v=>!v)}>
                <span style={{ fontSize:10, fontWeight:700, color:C.sub, letterSpacing:"1.5px" }}>
                  {isAr?"السجل الأخير":"RECENT HISTORY"} ({closedTrades.length})
                </span>
                <span style={{ fontSize:11, color:C.sub }}>{showClosedTrades?"▲":"▼"}</span>
              </div>
              {showClosedTrades && closedTrades.slice(0,10).map((t,i) => {
                const pl  = t.pl || 0;
                const dir = tradeDir(t);
                return (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 0.7fr 0.7fr 0.8fr",
                    padding:"7px 14px", borderBottom:`1px solid rgba(255,255,255,0.03)`,
                    alignItems:"center" }}>
                    <div>
                      <span style={{ fontSize:12, fontWeight:800, color:C.text }}>{t.pair}</span>
                      <span style={{ marginLeft:5, fontSize:9, padding:"1px 5px", borderRadius:4,
                        background:dir==="buy"?`${C.green}15`:`${C.red}15`,
                        color:dir==="buy"?C.green:C.red }}>
                        {dir==="buy"?(isAr?"شراء":"BUY"):(isAr?"بيع":"SELL")}
                      </span>
                    </div>
                    <span style={{ fontSize:10, color:C.sub, fontFamily:"'DM Mono',monospace" }}>{t.lots} lots</span>
                    <span style={{ fontSize:11, fontWeight:800, color:pl>=0?C.green:C.red, fontFamily:"'DM Mono',monospace" }}>
                      {pl>=0?"+":""}{pl.toFixed?.(2)||pl}$
                    </span>
                    <span style={{ fontSize:9, color:C.sub, textAlign:"right" }}>
                      {t.closed_at ? new Date(t.closed_at).toLocaleDateString() : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── RIGHT: Trade Panel ─── */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* Right panel tab switcher */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr",
            background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
            {[
              ["trade",    isAr?"تداول":"Trade",    "📊"],
              ["calc",     isAr?"حاسبة":"Calc",     "🧮"],
              ["patterns", isAr?"أنماط":"Patterns", "🕯️"],
              ["alert",    isAr?"تنبيه":"Alert",    "🔔"],
            ].map(([key,label,icon])=>(
              <button key={key} onClick={()=>setRightTab(key)}
                style={{ padding:"10px 0", border:"none",
                  background: rightTab===key?`${P}20`:"transparent",
                  borderBottom: rightTab===key?`2px solid ${P}`:"2px solid transparent",
                  color: rightTab===key?P:C.sub,
                  fontSize:10, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* ── TRADE TAB ── */}
          {rightTab === "trade" && (
            <div style={{ ...card(), padding:14, display:"flex", flexDirection:"column", gap:12 }}>

              {/* Broker Selector */}
              <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:9, border:`1px solid ${C.border}`, padding:"8px 10px" }}>
                <div style={{ fontSize:9, color:C.sub, fontWeight:700, marginBottom:6, letterSpacing:"1px" }}>
                  {isAr ? "الوسيط" : "BROKER"}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  {brokers.length === 0 ? (
                    <button
                      onClick={() => setShowBrokerModal(true)}
                      style={{ flex:1, padding:"7px 10px", borderRadius:7, border:`1px dashed ${P}60`,
                        background:"transparent", color:P, fontSize:11, fontWeight:700, cursor:"pointer" }}>
                      + {isAr ? "ربط وسيط" : "Connect Broker"}
                    </button>
                  ) : (
                    <>
                      {brokers.map(b => (
                        <button key={b.id}
                          onClick={() => setActiveBroker(b)}
                          style={{
                            padding:"5px 10px", borderRadius:7, fontSize:10, fontWeight:700, cursor:"pointer",
                            border:`1px solid ${activeBroker?.id === b.id ? P : C.border}`,
                            background: activeBroker?.id === b.id ? `${P}18` : "transparent",
                            color: activeBroker?.id === b.id ? P : C.sub,
                          }}>
                          {b.account_type === "demo" ? "🎮" : "🏦"} {b.label}
                          {b.broker_balance != null && (
                            <span style={{ marginLeft:4, opacity:.7 }}>
                              ${Number(b.broker_balance).toLocaleString()}
                            </span>
                          )}
                        </button>
                      ))}
                      <button onClick={() => setShowBrokerModal(true)}
                        style={{ padding:"5px 8px", borderRadius:7, border:`1px solid ${C.border}`,
                          background:"transparent", color:C.sub, fontSize:10, cursor:"pointer" }}>
                        +
                      </button>
                    </>
                  )}
                </div>
                {activeBroker && (
                  <div style={{ fontSize:9, color:activeBroker.account_type === "demo" ? C.yellow : C.green, marginTop:5 }}>
                    {activeBroker.account_type === "demo"
                      ? (isAr ? "🎮 وضع تجريبي" : "🎮 Demo mode")
                      : (isAr ? `🏦 ${activeBroker.broker?.toUpperCase()} — ${activeBroker.account_type}` : `🏦 ${activeBroker.broker?.toUpperCase()} — ${activeBroker.account_type}`)}
                  </div>
                )}
              </div>

              {/* One-Click Toggle */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 10px", background:"rgba(255,255,255,0.03)", borderRadius:8, border:`1px solid rgba(255,255,255,0.07)` }}>
                <span style={{ fontSize:10, color:C.sub, fontWeight:700 }}>⚡ {isAr?"تداول بضغطة واحدة":"One-Click Trade"}</span>
                <div onClick={()=>setOneClick(v=>!v)} style={{ width:36, height:20, borderRadius:10, background:oneClick?`${P}`:"rgba(255,255,255,0.1)", position:"relative", cursor:"pointer", transition:"background 0.2s" }}>
                  <div style={{ position:"absolute", top:3, left:oneClick?17:3, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
                </div>
              </div>

              {/* Buy / Sell */}
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>{ setSide("buy");  if(oneClick) setTimeout(submitOrder, 50); }} style={btnStyle(side==="buy",C.green)}>{isAr?"شراء ▲":"BUY ▲"}</button>
                <button onClick={()=>{ setSide("sell"); if(oneClick) setTimeout(submitOrder, 50); }} style={btnStyle(side==="sell",C.red)}>{isAr?"بيع ▼":"SELL ▼"}</button>
              </div>

              {/* Order type */}
              <div style={{ display:"flex", gap:4 }}>
                {[["market",isAr?"سوق":"Market"],["limit",isAr?"محدد":"Limit"],["stop",isAr?"وقف":"Stop"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setOrderType(k)}
                    style={{ flex:1, padding:"6px 0",
                      border:`1px solid ${orderType===k?P:C.border}`,
                      borderRadius:7, background:orderType===k?`${P}18`:"transparent",
                      color:orderType===k?P:C.sub,
                      fontSize:10, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
                    {l}
                  </button>
                ))}
              </div>

              {orderType !== "market" && (
                <div>
                  <label style={lbl}>{isAr?"سعر الدخول":"Entry Price"}</label>
                  <input value={limitPx} onChange={e=>setLimitPx(e.target.value)}
                    placeholder={px.toFixed(dec)} style={inp} type="number" />
                </div>
              )}

              {/* Lot size */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <label style={{...lbl, marginBottom:0}}>{isAr?"حجم اللوت":"Lot Size"}</label>
                  {autoLots && (
                    <button onClick={applyAutoLots} style={{ fontSize:9, color:P, background:`${P}12`, border:`1px solid ${P}30`,
                      borderRadius:5, padding:"2px 7px", cursor:"pointer", fontWeight:700 }}>
                      {isAr?`آلي: ${autoLots}`:`Auto: ${autoLots}`}
                    </button>
                  )}
                </div>
                <input value={lots} onChange={e=>setLots(e.target.value)}
                  type="number" min="0.01" step="0.01" style={inp} />
                <div style={{ display:"flex", gap:3, marginTop:6, flexWrap:"wrap" }}>
                  {[0.01,0.05,0.1,0.5,1,5].map(v=>(
                    <button key={v} onClick={()=>setLots(String(v))}
                      style={{ flex:1, minWidth:32, padding:"4px 0",
                        border:`1px solid ${lots===String(v)?P:C.border}`,
                        borderRadius:6, background:lots===String(v)?`${P}20`:"transparent",
                        color:lots===String(v)?P:C.sub,
                        fontSize:10, fontWeight:700, cursor:"pointer" }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* SL / TP */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div>
                  <label style={lbl}>🛑 {isAr?"وقف الخسارة":"Stop Loss"}</label>
                  <input value={sl} onChange={e=>setSl(e.target.value)}
                    placeholder={+(side==="buy"?px*0.998:px*1.002).toFixed(dec).toString()}
                    style={{...inp, borderColor:"rgba(224,82,82,0.35)"}} type="number" />
                </div>
                <div>
                  <label style={lbl}>🎯 {isAr?"جني الأرباح":"Take Profit"}</label>
                  <input value={tp} onChange={e=>setTp(e.target.value)}
                    placeholder={+(side==="buy"?px*1.004:px*0.996).toFixed(dec).toString()}
                    style={{...inp, borderColor:"rgba(74,222,128,0.35)"}} type="number" />
                </div>
              </div>

              {/* Trailing Stop */}
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"rgba(255,255,255,0.03)", borderRadius:8, border:`1px solid ${trailStop?"rgba(251,191,36,0.3)":"rgba(255,255,255,0.07)"}` }}>
                <div onClick={()=>setTrailStop(v=>!v)} style={{ width:34, height:18, borderRadius:9, background:trailStop?"rgba(251,191,36,0.8)":"rgba(255,255,255,0.1)", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
                  <div style={{ position:"absolute", top:2, left:trailStop?15:2, width:14, height:14, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }} />
                </div>
                <span style={{ fontSize:10, color:trailStop?C.yellow:C.sub, fontWeight:700, flex:1 }}>🔄 {isAr?"وقف خسارة متحرك":"Trailing Stop"}</span>
                {trailStop && (
                  <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                    <input value={trailPips} onChange={e=>setTrailPips(e.target.value)} type="number" min="5" style={{ width:52, padding:"3px 6px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.yellow}44`, borderRadius:5, color:C.yellow, fontSize:10, outline:"none" }} />
                    <span style={{ fontSize:9, color:C.sub }}>pips</span>
                  </div>
                )}
              </div>

              {/* Quick SL presets */}
              <div>
                <div style={{ fontSize:9, color:C.sub, fontWeight:700, marginBottom:5 }}>
                  {isAr?"وقف خسارة سريع":"QUICK SL PRESET"}
                </div>
                <div style={{ display:"flex", gap:4 }}>
                  {[
                    {l:"0.5%", v:0.005},
                    {l:"1%",   v:0.01},
                    {l:"2%",   v:0.02},
                    {l:"3%",   v:0.03},
                  ].map(({l,v})=>(
                    <button key={v} onClick={()=>{
                      const d = px*v;
                      setSl( +(side==="buy" ? px-d : px+d).toFixed(dec).toString());
                      setTp( +(side==="buy" ? px+d*2 : px-d*2).toFixed(dec).toString());
                    }} style={{ flex:1, padding:"4px 0", borderRadius:6, cursor:"pointer",
                      border:`1px solid rgba(224,82,82,0.25)`, background:"rgba(224,82,82,0.08)",
                      color:C.red, fontSize:10, fontWeight:700 }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trade metrics */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                {[
                  { label:isAr?"هامش":"MARGIN",   value:`$${(lotsN*100000*px/100).toFixed(0)}`, color:P },
                  { label:"PIP VAL",               value:`$${pipVal}`,                         color:C.text },
                  rr
                    ? { label:"R:R",               value:`1:${rr}`,   color:rr>=2?C.green:rr>=1?P:C.red }
                    : { label:isAr?"رصيد":"BAL",   value:`$${balance.toLocaleString()}`,        color:C.green },
                ].map((m,i)=>(
                  <div key={i} style={{ textAlign:"center", padding:"8px 4px",
                    background:"rgba(255,255,255,0.025)", borderRadius:8,
                    border:`1px solid rgba(255,255,255,0.06)` }}>
                    <div style={{ fontSize:7, color:C.sub, fontWeight:700, letterSpacing:"1px" }}>{m.label}</div>
                    <div style={{ fontSize:12, fontWeight:800, color:m.color, fontFamily:"'DM Mono',monospace", marginTop:2 }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* TP/SL profit preview */}
              {(tpProfit !== null || slLoss !== null) && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {tpProfit !== null && (
                    <div style={{ padding:"8px 10px", background:"rgba(74,222,128,0.07)",
                      border:"1px solid rgba(74,222,128,0.2)", borderRadius:8, textAlign:"center" }}>
                      <div style={{ fontSize:8, color:C.sub }}>🎯 {isAr?"عند الهدف":"AT TP"}</div>
                      <div style={{ fontSize:13, fontWeight:900, color:C.green }}>+${tpProfit}</div>
                    </div>
                  )}
                  {slLoss !== null && (
                    <div style={{ padding:"8px 10px", background:"rgba(224,82,82,0.07)",
                      border:"1px solid rgba(224,82,82,0.2)", borderRadius:8, textAlign:"center" }}>
                      <div style={{ fontSize:8, color:C.sub }}>🛑 {isAr?"عند الوقف":"AT SL"}</div>
                      <div style={{ fontSize:13, fontWeight:900, color:C.red }}>-${slLoss}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Submit button */}
              <button onClick={submitOrder} disabled={submitting}
                style={{ padding:"14px 0", border:"none", borderRadius:11, cursor:submitting?"not-allowed":"pointer",
                  fontWeight:900, fontSize:14, fontFamily:"inherit", transition:"all 0.2s",
                  background: submitting?"rgba(255,255,255,0.08)":side==="buy"
                    ? "linear-gradient(135deg,#4ADE80,#22C55E)"
                    : "linear-gradient(135deg,#E05252,#DC2626)",
                  color: submitting?"rgba(255,255,255,0.3)":"#000",
                  boxShadow: submitting?"none":side==="buy"
                    ? "0 4px 20px rgba(74,222,128,0.35)"
                    : "0 4px 20px rgba(224,82,82,0.35)" }}>
                {submitting
                  ? (isAr?"جاري...":"Processing...")
                  : side==="buy"
                    ? `${isAr?"شراء":"BUY"} ${chartPair} ▲`
                    : `${isAr?"بيع":"SELL"} ${chartPair} ▼`}
              </button>

              {tradeMsg && (
                <div style={{ padding:"8px 12px", borderRadius:8, fontSize:12, fontWeight:700, textAlign:"center",
                  animation:"slideIn .3s ease",
                  background: tradeMsg.ok?"rgba(74,222,128,0.1)":"rgba(224,82,82,0.1)",
                  border:`1px solid ${tradeMsg.ok?"rgba(74,222,128,0.3)":"rgba(224,82,82,0.3)"}`,
                  color: tradeMsg.ok?C.green:C.red }}>
                  {tradeMsg.msg}
                </div>
              )}
            </div>
          )}

          {/* ── CALCULATOR TAB ── */}
          {rightTab === "calc" && (
            <div style={{ ...card(), padding:14, display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>
                🧮 {isAr?"حاسبة حجم الصفقة":"Position Size Calculator"}
              </div>

              {/* Risk % */}
              <div>
                <label style={lbl}>{isAr?"نسبة المخاطرة من الرصيد":"Risk % of Balance"}</label>
                <div style={{ display:"flex", gap:4, marginBottom:6 }}>
                  {["0.5","1","1.5","2","3"].map(v=>(
                    <button key={v} onClick={()=>setRiskPct(v)}
                      style={{ flex:1, padding:"5px 0", borderRadius:6, cursor:"pointer",
                        border:`1px solid ${riskPct===v?P:C.border}`,
                        background:riskPct===v?`${P}20`:"transparent",
                        color:riskPct===v?P:C.sub, fontSize:10, fontWeight:700 }}>
                      {v}%
                    </button>
                  ))}
                </div>
                <input value={riskPct} onChange={e=>setRiskPct(e.target.value)}
                  type="number" min="0.1" step="0.1" style={inp} placeholder="1" />
              </div>

              {/* SL entry for calculator */}
              <div>
                <label style={lbl}>{isAr?"سعر وقف الخسارة":"Stop Loss Price"}</label>
                <input value={sl} onChange={e=>setSl(e.target.value)}
                  type="number" placeholder={+(px*0.99).toFixed(dec).toString()} style={inp} />
                {slDist > 0 && (
                  <div style={{ marginTop:4, fontSize:10, color:C.sub }}>
                    {isAr?"المسافة:":"Distance:"} {slDist.toFixed(dec)} ({(slDist/px*100).toFixed(2)}%)
                  </div>
                )}
              </div>

              {/* Results */}
              <div style={{ background:`${P}08`, border:`1px solid ${P}22`, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:11, fontWeight:700, color:P, marginBottom:12 }}>
                  {isAr?"نتيجة الحساب":"Calculation Results"}
                </div>
                {[
                  { label:isAr?"رصيد الحساب":"Account Balance",       value:`$${balance.toLocaleString()}`,         color:C.text },
                  { label:isAr?"مبلغ المخاطرة":"Risk Amount",          value:`$${riskAmt.toFixed(2)}`,              color:C.red },
                  { label:isAr?"مسافة الوقف (بالنقاط)":"SL Distance (pts)", value:slDist>0?`${(slDist/pipSize).toFixed(0)} pts`:"—", color:C.sub },
                  { label:isAr?"قيمة النقطة":"Pip Value ($/pip)",       value:`$${pipVal}`,                         color:C.text },
                  { label:isAr?"حجم اللوت المثالي":"Optimal Lot Size",  value:autoLots>0?`${autoLots} lots`:"أدخل SL",  color:P, big:true },
                ].map((r,i)=>(
                  <div key={i} style={{ display:"flex", justifyContent:"space-between",
                    padding:"6px 0", borderBottom:i<4?"1px solid rgba(255,255,255,0.05)":"none" }}>
                    <span style={{ fontSize:11, color:C.sub }}>{r.label}</span>
                    <span style={{ fontSize:r.big?14:11, fontWeight:r.big?900:700, color:r.color,
                      fontFamily:"'DM Mono',monospace" }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {autoLots > 0 && (
                <button onClick={applyAutoLots}
                  style={{ padding:"11px 0", border:`1px solid ${P}`, borderRadius:10, cursor:"pointer",
                    background:`${P}18`, color:P, fontSize:13, fontWeight:800, fontFamily:"inherit" }}>
                  {isAr?`✅ استخدم ${autoLots} لوت`:`✅ Use ${autoLots} lots`}
                </button>
              )}

              {/* Quick trade from calculator */}
              {autoLots > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  <button onClick={()=>{ setLots(String(autoLots)); setSide("buy"); setRightTab("trade"); }}
                    style={{ padding:"10px 0", borderRadius:9, border:"none", cursor:"pointer",
                      background:"linear-gradient(135deg,#4ADE80,#22C55E)", color:"#000", fontSize:12, fontWeight:900 }}>
                    {isAr?"شراء":"BUY"} {autoLots}L
                  </button>
                  <button onClick={()=>{ setLots(String(autoLots)); setSide("sell"); setRightTab("trade"); }}
                    style={{ padding:"10px 0", borderRadius:9, border:"none", cursor:"pointer",
                      background:"linear-gradient(135deg,#E05252,#DC2626)", color:"#000", fontSize:12, fontWeight:900 }}>
                    {isAr?"بيع":"SELL"} {autoLots}L
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PATTERNS TAB ── */}
          {rightTab === "patterns" && (
            <div style={{ ...card(), padding:14, display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>🕯️ {isAr?"كاشف الأنماط":"Pattern Scanner"} — {chartPair}</div>
              <div style={{ fontSize:10, color:C.sub }}>{isAr?"أنماط الشمعات اليابانية المكتشفة على الإطار الزمني الحالي":"Detected candlestick patterns on current timeframe"}</div>
              {patterns.map((p,i) => (
                <div key={i} style={{ padding:"12px 14px", background:p.bias==="bullish"?"rgba(74,222,128,0.07)":p.bias==="bearish"?"rgba(224,82,82,0.07)":"rgba(251,191,36,0.07)",
                  border:`1px solid ${p.bias==="bullish"?"rgba(74,222,128,0.25)":p.bias==="bearish"?"rgba(224,82,82,0.25)":"rgba(251,191,36,0.25)"}`,
                  borderRadius:10, display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ fontSize:22 }}>{p.bias==="bullish"?"🟢":p.bias==="bearish"?"🔴":"🟡"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#fff" }}>{isAr?p.nameAr:p.name}</div>
                    <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>{isAr?p.bias==="bullish"?"إشارة صعودية":p.bias==="bearish"?"إشارة هبوطية":"محايد":p.bias.charAt(0).toUpperCase()+p.bias.slice(1)}</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:16, fontWeight:900, color:p.bias==="bullish"?C.green:p.bias==="bearish"?C.red:C.yellow }}>{p.conf}%</div>
                    <div style={{ fontSize:8, color:C.sub }}>{isAr?"ثقة":"conf"}</div>
                  </div>
                  <div style={{ height:34, width:4, borderRadius:2, background:p.bias==="bullish"?C.green:p.bias==="bearish"?C.red:C.yellow, opacity:0.6 }} />
                  {p.bias !== "neutral" && (
                    <button onClick={()=>{ setSide(p.bias==="bullish"?"buy":"sell"); setRightTab("trade"); }}
                      style={{ padding:"5px 10px", borderRadius:7, border:"none", cursor:"pointer", fontSize:10, fontWeight:700,
                        background:p.bias==="bullish"?"rgba(74,222,128,0.2)":"rgba(224,82,82,0.2)",
                        color:p.bias==="bullish"?C.green:C.red }}>
                      {p.bias==="bullish"?(isAr?"شراء":"BUY"):(isAr?"بيع":"SELL")}
                    </button>
                  )}
                </div>
              ))}
              {patterns.length === 0 && (
                <div style={{ textAlign:"center", padding:"30px 0", color:C.sub, fontSize:12 }}>
                  {isAr?"لا توجد أنماط مكتشفة حالياً":"No patterns detected on current candle"}
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginTop:4 }}>
                {[["Head & Shoulders","H&S","bearish"],["Double Top","2Top","bearish"],["Cup & Handle","Cup","bullish"],["Triangle","Tri","neutral"],["Flag","Flag","bullish"],["Wedge","Wedge","bearish"]].map(([n,s,b])=>(
                  <div key={n} style={{ padding:"8px 6px", textAlign:"center", borderRadius:8,
                    background:b==="bullish"?"rgba(74,222,128,0.05)":b==="bearish"?"rgba(224,82,82,0.05)":"rgba(255,255,255,0.03)",
                    border:`1px solid ${b==="bullish"?"rgba(74,222,128,0.15)":b==="bearish"?"rgba(224,82,82,0.15)":"rgba(255,255,255,0.08)"}` }}>
                    <div style={{ fontSize:9, color:b==="bullish"?C.green:b==="bearish"?C.red:C.sub, fontWeight:700 }}>{s}</div>
                    <div style={{ fontSize:7, color:C.sub, marginTop:2 }}>{isAr?"قيد الرصد":"Watching"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ALERT TAB ── */}
          {rightTab === "alert" && (
            <div style={{ ...card(), padding:14, display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ fontSize:13, fontWeight:800, color:"#fff" }}>
                🔔 {isAr?`تنبيه سعر — ${chartPair}`:`Price Alert — ${chartPair}`}
              </div>
              <div style={{ padding:"10px 12px", background:`${P}08`, border:`1px solid ${P}22`, borderRadius:10 }}>
                <div style={{ fontSize:11, color:C.sub }}>{isAr?"السعر الحالي":"Current Price"}</div>
                <div style={{ fontSize:20, fontWeight:900, color:P, fontFamily:"'DM Mono',monospace" }}>{px.toFixed(dec)}</div>
              </div>

              <div>
                <label style={lbl}>{isAr?"سعر التنبيه":"Alert Price"}</label>
                <input value={alertPrice} onChange={e=>setAlertPrice(e.target.value)}
                  type="number" placeholder={px.toFixed(dec)} style={inp} />
              </div>

              <div>
                <label style={lbl}>{isAr?"الاتجاه":"Direction"}</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  <button onClick={()=>setAlertDir("above")}
                    style={{ padding:"9px 0", borderRadius:8, cursor:"pointer",
                      border:`1px solid ${alertDir==="above"?C.green:"rgba(74,222,128,0.2)"}`,
                      background:alertDir==="above"?"rgba(74,222,128,0.12)":"transparent",
                      color:alertDir==="above"?C.green:"rgba(74,222,128,0.5)",
                      fontSize:12, fontWeight:700 }}>
                    ▲ {isAr?"أعلى من":"Above"}
                  </button>
                  <button onClick={()=>setAlertDir("below")}
                    style={{ padding:"9px 0", borderRadius:8, cursor:"pointer",
                      border:`1px solid ${alertDir==="below"?C.red:"rgba(224,82,82,0.2)"}`,
                      background:alertDir==="below"?"rgba(224,82,82,0.12)":"transparent",
                      color:alertDir==="below"?C.red:"rgba(224,82,82,0.5)",
                      fontSize:12, fontWeight:700 }}>
                    ▼ {isAr?"أدنى من":"Below"}
                  </button>
                </div>
              </div>

              {/* Price presets */}
              <div>
                <div style={{ fontSize:9, color:C.sub, fontWeight:700, marginBottom:6 }}>
                  {isAr?"مستويات سريعة":"QUICK LEVELS"}
                </div>
                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                  {[-2,-1,-0.5,0.5,1,2].map(pct=>(
                    <button key={pct} onClick={()=>{
                      const targetPrice = +(px*(1+pct/100)).toFixed(dec);
                      setAlertPrice(String(targetPrice));
                      setAlertDir(pct>0?"above":"below");
                    }} style={{ flex:1, minWidth:40, padding:"4px 0", borderRadius:6, cursor:"pointer",
                      border:`1px solid ${pct>0?"rgba(74,222,128,0.2)":"rgba(224,82,82,0.2)"}`,
                      background:pct>0?"rgba(74,222,128,0.06)":"rgba(224,82,82,0.06)",
                      color:pct>0?C.green:C.red, fontSize:10, fontWeight:700 }}>
                      {pct>0?"+":""}{pct}%
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={addAlert} disabled={addingAlert||!alertPrice}
                style={{ padding:"13px 0", border:"none", borderRadius:10, cursor:"pointer",
                  background:`linear-gradient(135deg,${P},${theme?.primaryD||"#A07820"})`,
                  color:"#000", fontSize:13, fontWeight:900, fontFamily:"inherit",
                  opacity:addingAlert||!alertPrice?0.5:1 }}>
                {addingAlert ? (isAr?"جاري...":"Adding...") : (isAr?`🔔 أضف تنبيه عند ${alertPrice||"—"}`:`🔔 Alert at ${alertPrice||"—"}`)}
              </button>

              <div style={{ fontSize:10, color:C.sub, textAlign:"center", lineHeight:1.6 }}>
                {isAr?"سيتم تنبيهك عند وصول السعر للمستوى المحدد":"You'll be notified when price reaches the target"}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TradingTab;
