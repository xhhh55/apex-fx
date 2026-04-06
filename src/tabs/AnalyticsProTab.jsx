/* eslint-disable */
import { useState, useEffect, useMemo, useRef } from 'react';
import { proxyAI } from '../utils/ai';

/* ══════════════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════════════ */
const CALENDAR_EVENTS = [
  { id:1,  time:"08:30", country:"US",  flag:"🇺🇸", event:"Non-Farm Payrolls",       eventAr:"الرواتب خارج الزراعة",   impact:"high",   forecast:"185K",  prev:"175K",   actual:null },
  { id:2,  time:"10:00", country:"US",  flag:"🇺🇸", event:"ISM Manufacturing PMI",   eventAr:"مؤشر مديري المشتريات",   impact:"high",   forecast:"50.5",  prev:"49.3",   actual:null },
  { id:3,  time:"12:45", country:"EU",  flag:"🇪🇺", event:"ECB Interest Rate",        eventAr:"قرار الفائدة الأوروبي",  impact:"high",   forecast:"4.25%", prev:"4.50%",  actual:null },
  { id:4,  time:"07:00", country:"UK",  flag:"🇬🇧", event:"CPI y/y",                  eventAr:"مؤشر أسعار المستهلك",   impact:"high",   forecast:"3.1%",  prev:"3.4%",   actual:"3.0%" },
  { id:5,  time:"09:30", country:"US",  flag:"🇺🇸", event:"Initial Jobless Claims",   eventAr:"طلبات إعانة البطالة",   impact:"medium", forecast:"215K",  prev:"220K",   actual:"211K" },
  { id:6,  time:"14:00", country:"US",  flag:"🇺🇸", event:"Fed Chair Speech",         eventAr:"خطاب رئيس الفيدرالي",  impact:"high",   forecast:"—",     prev:"—",      actual:null },
  { id:7,  time:"06:00", country:"DE",  flag:"🇩🇪", event:"German Unemployment",      eventAr:"البطالة الألمانية",     impact:"medium", forecast:"5.9%",  prev:"5.8%",   actual:null },
  { id:8,  time:"23:50", country:"JP",  flag:"🇯🇵", event:"BoJ Tankan Survey",        eventAr:"مسح تانكان",            impact:"medium", forecast:"12",    prev:"11",     actual:null },
  { id:9,  time:"08:30", country:"CA",  flag:"🇨🇦", event:"Canada CPI m/m",           eventAr:"التضخم الكندي",         impact:"medium", forecast:"0.3%",  prev:"0.1%",   actual:null },
  { id:10, time:"10:00", country:"US",  flag:"🇺🇸", event:"Consumer Confidence",      eventAr:"ثقة المستهلك",          impact:"medium", forecast:"105.0", prev:"104.7",  actual:"106.3" },
  { id:11, time:"13:30", country:"US",  flag:"🇺🇸", event:"Core PCE Price Index",     eventAr:"مؤشر PCE الأساسي",     impact:"high",   forecast:"2.6%",  prev:"2.7%",   actual:null },
  { id:12, time:"15:00", country:"US",  flag:"🇺🇸", event:"FOMC Meeting Minutes",     eventAr:"محضر اجتماع FOMC",     impact:"high",   forecast:"—",     prev:"—",      actual:null },
];

const PAIRS_CORR = ["EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CHF","XAU/USD","BTC/USD","US30"];
const CORR_MATRIX_BASE = {
  "EUR/USD": [1.00, 0.82,-0.74, 0.71,-0.81, 0.45, 0.28, 0.35],
  "GBP/USD": [0.82, 1.00,-0.68, 0.65,-0.73, 0.41, 0.31, 0.40],
  "USD/JPY": [-0.74,-0.68,1.00,-0.62, 0.69,-0.52,-0.22,-0.30],
  "AUD/USD": [0.71, 0.65,-0.62,1.00,-0.68, 0.55, 0.48, 0.52],
  "USD/CHF": [-0.81,-0.73,0.69,-0.68,1.00,-0.40,-0.25,-0.33],
  "XAU/USD": [0.45, 0.41,-0.52,0.55,-0.40,1.00, 0.61, 0.28],
  "BTC/USD": [0.28, 0.31,-0.22,0.48,-0.25,0.61, 1.00, 0.55],
  "US30":    [0.35, 0.40,-0.30,0.52,-0.33,0.28, 0.55, 1.00],
};

const COT_DATA = [
  { sym:"EUR",  nameAr:"يورو",       net:28400,  prev:21000, nonComm:112000, comm:-83600, change:+7400,  pct:62 },
  { sym:"GBP",  nameAr:"جنيه",       net:-8200,  prev:-5100, nonComm:48000,  comm:-56200, change:-3100,  pct:32 },
  { sym:"JPY",  nameAr:"ين",         net:-42000, prev:-38000,nonComm:21000,  comm:-63000, change:-4000,  pct:18 },
  { sym:"AUD",  nameAr:"أسترالي",    net:-12000, prev:-9000, nonComm:22000,  comm:-34000, change:-3000,  pct:28 },
  { sym:"CAD",  nameAr:"كندي",       net:5200,   prev:3800,  nonComm:31000,  comm:-25800, change:+1400,  pct:55 },
  { sym:"CHF",  nameAr:"فرنك",       net:-18500, prev:-16000,nonComm:8000,   comm:-26500, change:-2500,  pct:22 },
  { sym:"NZD",  nameAr:"نيوزيلندي",  net:2800,   prev:1200,  nonComm:14000,  comm:-11200, change:+1600,  pct:58 },
  { sym:"Gold", nameAr:"ذهب",        net:184000, prev:170000,nonComm:240000, comm:-56000, change:+14000, pct:78 },
  { sym:"Oil",  nameAr:"نفط",        net:225000, prev:240000,nonComm:310000, comm:-85000, change:-15000, pct:71 },
  { sym:"BTC",  nameAr:"بيتكوين",    net:3200,   prev:2400,  nonComm:8500,   comm:-5300,  change:+800,   pct:65 },
];

const BT_STRATEGIES = [
  { id:"ma_cross", name:"MA Crossover", nameAr:"تقاطع المتوسطات" },
  { id:"rsi_mean", name:"RSI Mean Reversion", nameAr:"RSI الارتداد" },
  { id:"bb_bounce", name:"Bollinger Bounce", nameAr:"ارتداد بولينجر" },
  { id:"breakout", name:"Breakout", nameAr:"الاختراق" },
  { id:"macd_sig", name:"MACD Signal", nameAr:"إشارة MACD" },
];

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
const corrColor = (v) => {
  if (v >= 0.7)  return { bg:"rgba(74,222,128,0.18)", c:"#4ade80" };
  if (v >= 0.3)  return { bg:"rgba(74,222,128,0.08)", c:"#86efac" };
  if (v >= -0.3) return { bg:"rgba(255,255,255,0.04)", c:"rgba(255,255,255,0.55)" };
  if (v >= -0.7) return { bg:"rgba(224,82,82,0.08)", c:"#fca5a5" };
  return           { bg:"rgba(224,82,82,0.18)", c:"#ef4444" };
};

function runBacktest({ strategy, pair, fromYear, toYear, riskPct, sl, tp }) {
  const seed = strategy.length + pair.length + fromYear + toYear;
  const rng = (s) => ((Math.sin(s * 9301 + 49297) / 233280 + 1) % 1);
  const years = toYear - fromYear;
  const trades = Math.floor(rng(seed) * 300 + 100);
  const winRate = 40 + rng(seed*2) * 25;
  const avgWin  = tp * (1 + rng(seed*3) * 0.5);
  const avgLoss = sl * (1 + rng(seed*4) * 0.3);
  const grossProfit = trades * (winRate/100) * avgWin * riskPct * 100;
  const grossLoss   = trades * (1-winRate/100) * avgLoss * riskPct * 100;
  const netProfit   = grossProfit - grossLoss;
  const maxDD       = rng(seed*5) * 15 + 5;
  const sharpe      = (netProfit / (maxDD * 100) * rng(seed*6) * 2).toFixed(2);
  const equity = Array.from({length:24},(_,i)=>{
    const base = 10000 + (netProfit / 24) * i;
    return +(base + (rng(seed+i)*1000-500)).toFixed(0);
  });
  return { trades, winRate: winRate.toFixed(1), netProfit: netProfit.toFixed(0),
    grossProfit: grossProfit.toFixed(0), grossLoss: grossLoss.toFixed(0),
    maxDD: maxDD.toFixed(1), sharpe, profitFactor: (grossProfit/grossLoss).toFixed(2), equity };
}

/* ══════════════════════════════════════════════════════
   ECONOMIC CALENDAR
══════════════════════════════════════════════════════ */
function EconCalendar({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [filter, setFilter] = useState("all");
  const [aiImpact, setAiImpact] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selEvent, setSelEvent] = useState(null);

  const filtered = filter === "all" ? CALENDAR_EVENTS : CALENDAR_EVENTS.filter(e => e.impact === filter);

  const impactColor = (i) => i === "high" ? "#ef4444" : i === "medium" ? "#f59e0b" : "#22c55e";
  const impactLabel = (i) => i === "high" ? (isAr?"عالي":"HIGH") : i === "medium" ? (isAr?"متوسط":"MED") : (isAr?"منخفض":"LOW");

  const askAI = async (ev) => {
    setSelEvent(ev); setAiLoading(true); setAiImpact("");
    const p = isAr
      ? `حلل تأثير "${ev.event}" على الفوركس. التوقع: ${ev.forecast}، السابق: ${ev.prev}. ما الأزواج الأكثر تأثراً؟ 3 جمل.`
      : `Analyze the forex impact of "${ev.event}". Forecast: ${ev.forecast}, Previous: ${ev.prev}. Which pairs are most affected? 3 sentences.`;
    const r = await proxyAI(p, 300);
    setAiImpact(r || (isAr?"تعذّر التحليل":"Analysis unavailable"));
    setAiLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#fff", flex:1 }}>📅 {isAr?"تقويم الأحداث الاقتصادية":"Economic Calendar"}</div>
        {["all","high","medium","low"].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"4px 12px", borderRadius:16, border:`1px solid ${filter===f?P:`${P}30`}`, background:filter===f?`${P}18`:"transparent", color:filter===f?P:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, cursor:"pointer" }}>
            {f==="all"?(isAr?"الكل":"All"):f==="high"?(isAr?"عالي":"High"):f==="medium"?(isAr?"متوسط":"Medium"):(isAr?"منخفض":"Low")}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {filtered.map(ev => (
          <div key={ev.id} onClick={()=>askAI(ev)} style={{ padding:"10px 14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${selEvent?.id===ev.id?P:"rgba(255,255,255,0.08)"}`, borderRadius:10, cursor:"pointer", transition:"all 0.15s", display:"grid", gridTemplateColumns:"50px 30px 1fr 70px 70px 70px 80px", gap:8, alignItems:"center" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}
            onMouseLeave={e=>e.currentTarget.style.background=selEvent?.id===ev.id?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.04)"}>
            <span style={{ fontSize:11, fontFamily:"monospace", color:"rgba(255,255,255,0.5)" }}>{ev.time}</span>
            <span style={{ fontSize:16 }}>{ev.flag}</span>
            <span style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{isAr?ev.eventAr:ev.event}</span>
            <div style={{ padding:"2px 6px", borderRadius:4, background:impactColor(ev.impact)+"22", color:impactColor(ev.impact), fontSize:9, fontWeight:800, textAlign:"center" }}>{impactLabel(ev.impact)}</div>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textAlign:"right" }}>{isAr?"توقع":"Fcst"}: {ev.forecast}</span>
            <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)", textAlign:"right" }}>{isAr?"سابق":"Prev"}: {ev.prev}</span>
            <span style={{ fontSize:11, fontWeight:700, color:ev.actual?"#22c55e":"rgba(255,255,255,0.25)", textAlign:"right" }}>{ev.actual || (isAr?"معلق":"Pending")}</span>
          </div>
        ))}
      </div>

      {selEvent && (
        <div style={{ padding:14, background:`${P}08`, border:`1px solid ${P}25`, borderRadius:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:P, marginBottom:8 }}>🤖 AI — {isAr?selEvent.eventAr:selEvent.event}</div>
          {aiLoading ? <div style={{ color:"rgba(255,255,255,0.4)", fontSize:12 }}>{isAr?"يحلل...":"Analyzing..."}</div>
          : <div style={{ fontSize:12, color:"rgba(255,255,255,0.75)", lineHeight:1.7 }}>{aiImpact}</div>}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CORRELATION MATRIX
══════════════════════════════════════════════════════ */
function CorrelationMatrix({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [period, setPeriod] = useState("30d");

  const seed = period === "30d" ? 1 : period === "90d" ? 2 : 3;
  const matrix = useMemo(() => {
    const noise = (i, j) => (Math.sin((i*7+j*13+seed)*9301) % 1) * 0.15;
    const result = {};
    PAIRS_CORR.forEach((r,i) => {
      result[r] = PAIRS_CORR.map((c,j) => {
        if (i === j) return 1;
        const base = CORR_MATRIX_BASE[r]?.[j] ?? 0;
        return Math.max(-1, Math.min(1, +(base + noise(i,j)).toFixed(2)));
      });
    });
    return result;
  }, [seed]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#fff", flex:1 }}>🔗 {isAr?"مصفوفة الارتباط":"Correlation Matrix"}</div>
        {["7d","30d","90d"].map(p => (
          <button key={p} onClick={()=>setPeriod(p)} style={{ padding:"4px 12px", borderRadius:16, border:`1px solid ${period===p?P:`${P}30`}`, background:period===p?`${P}18`:"transparent", color:period===p?P:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, cursor:"pointer" }}>{p}</button>
        ))}
      </div>

      <div style={{ overflowX:"auto" }}>
        <table style={{ borderCollapse:"collapse", fontSize:11, minWidth:580 }}>
          <thead>
            <tr>
              <th style={{ padding:"6px 10px", color:"rgba(255,255,255,0.3)", fontSize:10, fontWeight:600, minWidth:80 }}></th>
              {PAIRS_CORR.map(p => <th key={p} style={{ padding:"6px 8px", color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:700, whiteSpace:"nowrap" }}>{p.replace("/","")}</th>)}
            </tr>
          </thead>
          <tbody>
            {PAIRS_CORR.map((row,ri) => (
              <tr key={row}>
                <td style={{ padding:"5px 10px", fontWeight:700, color:"rgba(255,255,255,0.7)", fontSize:10, whiteSpace:"nowrap" }}>{row}</td>
                {(matrix[row]||[]).map((val,ci) => {
                  const { bg, c } = corrColor(val);
                  return (
                    <td key={ci} title={`${row} vs ${PAIRS_CORR[ci]}: ${val}`} style={{ padding:"5px 8px", textAlign:"center", background:bg, color:c, fontWeight:ri===ci?900:600, borderRadius:4, fontSize:10 }}>
                      {val.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {[["Strong +","rgba(74,222,128,0.18)","#4ade80"],["Mild +","rgba(74,222,128,0.08)","#86efac"],["Neutral","rgba(255,255,255,0.04)","rgba(255,255,255,0.55)"],["Mild −","rgba(224,82,82,0.08)","#fca5a5"],["Strong −","rgba(224,82,82,0.18)","#ef4444"]].map(([l,bg,c])=>(
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:10 }}>
            <div style={{ width:14, height:14, background:bg, borderRadius:3 }} />
            <span style={{ color:c }}>{isAr&&l==="Strong +"?"ارتباط قوي +":isAr&&l==="Mild +"?"ارتباط خفيف +":isAr&&l==="Neutral"?"محايد":isAr&&l==="Mild −"?"ارتباط خفيف −":isAr?"ارتباط قوي −":l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   COT REPORT
══════════════════════════════════════════════════════ */
function COTReport({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [sort, setSort] = useState("pct");
  const sorted = [...COT_DATA].sort((a,b) => sort === "pct" ? b.pct - a.pct : Math.abs(b.net) - Math.abs(a.net));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>📜 {isAr?"تقرير مراكز المضاربين (COT)":"COT Report — Commitment of Traders"}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{isAr?"البيانات الأسبوعية لمراكز المؤسسات في سوق العقود الآجلة":"Weekly institutional positions in futures markets"}</div>
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"5px 10px", borderRadius:8, fontSize:11 }}>
          <option value="pct">{isAr?"ترتيب: الثيران%":"Sort: Bull%"}</option>
          <option value="net">{isAr?"ترتيب: المركز":"Sort: Net pos"}</option>
        </select>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {sorted.map(item => {
          const bullish = item.net > 0;
          const barW = Math.min(100, Math.abs(item.net) / 250000 * 100);
          return (
            <div key={item.sym} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:`${bullish?"rgba(74,222,128,0.15)":"rgba(224,82,82,0.15)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:12, color:bullish?"#4ade80":"#ef4444", flexShrink:0 }}>{item.sym}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{isAr?item.nameAr:item.sym}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:bullish?"#4ade80":"#ef4444" }}>{bullish?"+":""}{item.net.toLocaleString()} {isAr?"عقد":"contracts"}</span>
                  </div>
                  <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${item.pct}%`, background:bullish?"#4ade80":"#ef4444", borderRadius:3, transition:"width 0.8s" }} />
                  </div>
                </div>
                <div style={{ textAlign:"center", minWidth:40 }}>
                  <div style={{ fontSize:16, fontWeight:900, color:bullish?"#4ade80":"#ef4444" }}>{item.pct}%</div>
                  <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>{isAr?"ثيران":"Bulls"}</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[
                  [isAr?"غير تجاري":"Non-Comm", item.nonComm.toLocaleString(), "#fff"],
                  [isAr?"تجاري":"Commercial", item.comm.toLocaleString(), "#fff"],
                  [isAr?"التغيير":"Change", `${item.change>=0?"+":""}${item.change.toLocaleString()}`, item.change>=0?"#4ade80":"#ef4444"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ background:"rgba(255,255,255,0.03)", borderRadius:7, padding:"6px 8px" }}>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.35)", marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:c }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   BACKTESTING
══════════════════════════════════════════════════════ */
function Backtester({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [strategy, setStrategy] = useState("ma_cross");
  const [pair,     setPair]     = useState("EUR/USD");
  const [fromYear, setFromYear] = useState(2020);
  const [toYear,   setToYear]   = useState(2024);
  const [riskPct,  setRiskPct]  = useState(1);
  const [sl,       setSl]       = useState(30);
  const [tp,       setTp]       = useState(60);
  const [result,   setResult]   = useState(null);
  const [running,  setRunning]  = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [aiLoad,   setAiLoad]   = useState(false);

  const pairs = ["EUR/USD","GBP/USD","USD/JPY","XAU/USD","BTC/USD","US30","NAS100"];

  const run = () => {
    setRunning(true); setResult(null); setAiReport("");
    setTimeout(() => {
      setResult(runBacktest({ strategy, pair, fromYear, toYear, riskPct, sl, tp }));
      setRunning(false);
    }, 900);
  };

  const getAIReport = async () => {
    if (!result) return;
    setAiLoad(true); setAiReport("");
    const strat = BT_STRATEGIES.find(s=>s.id===strategy);
    const p = isAr
      ? `نتائج باكتست: استراتيجية "${strat?.nameAr}", زوج ${pair}, فترة ${fromYear}-${toYear}. الصفقات: ${result.trades}, نسبة الفوز: ${result.winRate}%, صافي الربح: $${result.netProfit}, أقصى سحب: ${result.maxDD}%, شارب: ${result.sharpe}. حلل هذه النتائج واقترح تحسينات في 4 جمل.`
      : `Backtest results: "${strat?.name}" on ${pair} ${fromYear}-${toYear}. Trades: ${result.trades}, Win%: ${result.winRate}%, Net P&L: $${result.netProfit}, MaxDD: ${result.maxDD}%, Sharpe: ${result.sharpe}. Analyze and suggest 2 improvements in 4 sentences.`;
    const r = await proxyAI(p, 400);
    setAiReport(r || (isAr?"تعذّر التقرير":"Report unavailable"));
    setAiLoad(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>📈 {isAr?"اختبار الاستراتيجية التاريخي":"Strategy Backtester"}</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div>
          <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>{isAr?"الاستراتيجية":"Strategy"}</label>
          <select value={strategy} onChange={e=>setStrategy(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"8px 10px", borderRadius:8, fontSize:12 }}>
            {BT_STRATEGIES.map(s => <option key={s.id} value={s.id} style={{background:"#1a1a2e"}}>{isAr?s.nameAr:s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>{isAr?"الزوج":"Pair"}</label>
          <select value={pair} onChange={e=>setPair(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"8px 10px", borderRadius:8, fontSize:12 }}>
            {pairs.map(p => <option key={p} value={p} style={{background:"#1a1a2e"}}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>{isAr?"من سنة":"From"}</label>
          <input type="number" value={fromYear} onChange={e=>setFromYear(+e.target.value)} min={2010} max={2023} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"8px 10px", borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }} />
        </div>
        <div>
          <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>{isAr?"إلى سنة":"To"}</label>
          <input type="number" value={toYear} onChange={e=>setToYear(+e.target.value)} min={2011} max={2025} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"8px 10px", borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }} />
        </div>
        <div>
          <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>{isAr?"مخاطرة%":"Risk %"}</label>
          <input type="number" value={riskPct} onChange={e=>setRiskPct(+e.target.value)} min={0.1} max={5} step={0.1} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"8px 10px", borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
          <div>
            <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>SL (pips)</label>
            <input type="number" value={sl} onChange={e=>setSl(+e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(224,82,82,0.3)", color:"#fff", padding:"8px 10px", borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>TP (pips)</label>
            <input type="number" value={tp} onChange={e=>setTp(+e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(74,222,128,0.3)", color:"#fff", padding:"8px 10px", borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }} />
          </div>
        </div>
      </div>

      <button onClick={run} disabled={running} style={{ padding:"13px 0", background:running?"rgba(255,255,255,0.06)":P, color:"#fff", border:"none", borderRadius:10, cursor:running?"not-allowed":"pointer", fontWeight:800, fontSize:14, boxShadow:running?"none":`0 4px 20px ${P}50` }}>
        {running ? (isAr?"جارٍ الاختبار...":"Running backtest...") : (isAr?"▶ تشغيل الاختبار":"▶ Run Backtest")}
      </button>

      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {[
              [isAr?"صافي الربح":"Net P&L", `$${Number(result.netProfit)>=0?"+":""}${result.netProfit}`, Number(result.netProfit)>=0?"#4ade80":"#ef4444"],
              [isAr?"نسبة الفوز":"Win Rate", `${result.winRate}%`, "#f59e0b"],
              [isAr?"الصفقات":"Trades", result.trades, P],
              [isAr?"أقصى سحب":"Max DD", `${result.maxDD}%`, "#ef4444"],
              [isAr?"ربح إجمالي":"Gross Win", `$${result.grossProfit}`, "#4ade80"],
              [isAr?"خسارة إجمالية":"Gross Loss", `$${result.grossLoss}`, "#ef4444"],
              [isAr?"معامل الربح":"Profit Factor", result.profitFactor, Number(result.profitFactor)>=1.5?"#4ade80":"#f59e0b"],
              [isAr?"شارب":"Sharpe", result.sharpe, Number(result.sharpe)>=1?"#4ade80":"#f59e0b"],
            ].map(([l,v,c])=>(
              <div key={l} style={{ textAlign:"center", padding:"10px 6px", background:"rgba(255,255,255,0.03)", borderRadius:8, border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize:8, color:"rgba(255,255,255,0.4)", marginBottom:4, fontWeight:700 }}>{l}</div>
                <div style={{ fontSize:14, fontWeight:900, color:c, fontFamily:"monospace" }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Equity curve */}
          <div style={{ padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginBottom:8, fontWeight:700 }}>{isAr?"منحنى الأسهم":"EQUITY CURVE"}</div>
            <div style={{ height:80, display:"flex", alignItems:"flex-end", gap:2 }}>
              {result.equity.map((v,i) => {
                const min = Math.min(...result.equity), max = Math.max(...result.equity);
                const h = Math.max(4, ((v-min)/(max-min||1))*70+4);
                return <div key={i} style={{ flex:1, height:`${h}px`, background:v>=10000?`${P}90`:"rgba(224,82,82,0.7)", borderRadius:"2px 2px 0 0", transition:"height 0.3s" }} />;
              })}
            </div>
          </div>

          <button onClick={getAIReport} disabled={aiLoad} style={{ padding:"10px 0", background:`${P}18`, border:`1px solid ${P}40`, color:P, borderRadius:9, cursor:aiLoad?"not-allowed":"pointer", fontWeight:700, fontSize:13 }}>
            {aiLoad?"...":(isAr?"🤖 تقرير AI تفصيلي":"🤖 AI Analysis Report")}
          </button>
          {aiReport && (
            <div style={{ padding:12, background:`${P}08`, border:`1px solid ${P}25`, borderRadius:10, fontSize:12, lineHeight:1.7, color:"rgba(255,255,255,0.75)" }}>
              {aiReport}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export default function AnalyticsProTab({ theme, lang }) {
  const isAr = lang === "ar";
  const P = theme?.primary || '#6366f1';
  const [activeTab, setActiveTab] = useState("calendar");

  const TABS = [
    { id:"calendar",    label:"📅 Calendar",    labelAr:"📅 الأحداث" },
    { id:"correlation", label:"🔗 Correlation", labelAr:"🔗 الارتباط" },
    { id:"cot",         label:"📜 COT",         labelAr:"📜 COT" },
    { id:"backtest",    label:"📈 Backtest",    labelAr:"📈 باكتست" },
  ];

  const card = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, backdropFilter:"blur(12px)" };

  return (
    <div style={{ fontFamily:isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif", direction:isAr?"rtl":"ltr", display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>{isAr?"📊 تحليلات متقدمة":"📊 Advanced Analytics"}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{isAr?"تقويم • ارتباط • COT • باكتست":"Calendar · Correlation · COT · Backtesting"}</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", padding:"4px", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)", flexWrap:"wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ flex:1, minWidth:100, padding:"9px 0", borderRadius:10, border:"none", background:activeTab===t.id?`${P}20`:"transparent", color:activeTab===t.id?P:"rgba(255,255,255,0.4)", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
            {isAr?t.labelAr:t.label}
          </button>
        ))}
      </div>

      <div style={card}>
        {activeTab === "calendar"    && <EconCalendar   theme={theme} isAr={isAr} />}
        {activeTab === "correlation" && <CorrelationMatrix theme={theme} isAr={isAr} />}
        {activeTab === "cot"         && <COTReport       theme={theme} isAr={isAr} />}
        {activeTab === "backtest"    && <Backtester      theme={theme} isAr={isAr} />}
      </div>
    </div>
  );
}
