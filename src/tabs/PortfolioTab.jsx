/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { proxyAI } from '../utils/ai';

/* ══════════════════════════════════════════════════════
   DEMO DATA
══════════════════════════════════════════════════════ */
const DEMO_ASSETS = [
  { id:1,  sym:"EUR/USD",  type:"forex",   qty:1.0,   entry:1.0820, current:1.0891, category:"Forex" },
  { id:2,  sym:"XAU/USD",  type:"metal",   qty:0.5,   entry:2050.0, current:2078.5, category:"Metals" },
  { id:3,  sym:"BTC/USD",  type:"crypto",  qty:0.05,  entry:42000,  current:45200,  category:"Crypto" },
  { id:4,  sym:"AAPL",     type:"stock",   qty:10,    entry:185.0,  current:192.3,  category:"Stocks" },
  { id:5,  sym:"ETH/USD",  type:"crypto",  qty:0.8,   entry:2400,   current:2510,   category:"Crypto" },
  { id:6,  sym:"GBP/USD",  type:"forex",   qty:0.5,   entry:1.2650, current:1.2580, category:"Forex" },
  { id:7,  sym:"NVDA",     type:"stock",   qty:5,     entry:480,    current:528,    category:"Stocks" },
  { id:8,  sym:"NAS100",   type:"index",   qty:0.2,   entry:17200,  current:17640,  category:"Indices" },
];

const DAILY_PL = [
  { date:"Mon", pl:142, cum:142 }, { date:"Tue", pl:-68, cum:74 }, { date:"Wed", pl:215, cum:289 },
  { date:"Thu", pl:88,  cum:377 }, { date:"Fri", pl:-35, cum:342 }, { date:"Mon", pl:190, cum:532 },
  { date:"Tue", pl:75,  cum:607 }, { date:"Wed", pl:-120,cum:487 }, { date:"Thu", pl:310, cum:797 },
  { date:"Fri", pl:145, cum:942 }, { date:"Mon", pl:-55, cum:887 }, { date:"Tue", pl:228, cum:1115 },
  { date:"Wed", pl:95,  cum:1210 }, { date:"Thu", pl:-40, cum:1170 }, { date:"Fri", pl:185, cum:1355 },
];

const RISK_METRICS = [
  { label:"Value at Risk (95%)",  labelAr:"القيمة المعرضة للخطر",  value:"$420",  color:"#f59e0b", icon:"⚠️" },
  { label:"Sharpe Ratio",         labelAr:"نسبة شارب",              value:"1.84",  color:"#22c55e", icon:"📊" },
  { label:"Max Drawdown",         labelAr:"أقصى سحب",               value:"8.2%",  color:"#ef4444", icon:"📉" },
  { label:"Beta (vs Market)",     labelAr:"بيتا السوق",             value:"0.73",  color:"#6366f1", icon:"🔢" },
  { label:"Sortino Ratio",        labelAr:"نسبة سورتينو",           value:"2.41",  color:"#22c55e", icon:"✅" },
  { label:"Correlation Risk",     labelAr:"خطر الارتباط",          value:"Medium",color:"#f59e0b", icon:"🔗" },
];

/* ══════════════════════════════════════════════════════
   PORTFOLIO TRACKER
══════════════════════════════════════════════════════ */
function PortfolioTracker({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [assets, setAssets] = useState(DEMO_ASSETS);
  const [showAdd, setShowAdd] = useState(false);
  const [newA, setNewA] = useState({ sym:"", qty:"", entry:"", current:"", category:"Forex" });
  const [aiTip, setAiTip] = useState(""); const [aiLoad, setAiLoad] = useState(false);

  const totals = useMemo(() => {
    const invested = assets.reduce((s,a) => s + a.entry * a.qty, 0);
    const current  = assets.reduce((s,a) => s + a.current * a.qty, 0);
    const pl       = current - invested;
    const plPct    = (pl / invested * 100);
    return { invested, current, pl, plPct };
  }, [assets]);

  const byCategory = useMemo(() => {
    const cats = {};
    assets.forEach(a => {
      if (!cats[a.category]) cats[a.category] = 0;
      cats[a.category] += a.current * a.qty;
    });
    return Object.entries(cats).map(([k,v]) => ({ cat:k, val:v, pct:(v/totals.current*100).toFixed(1) }));
  }, [assets, totals.current]);

  const addAsset = () => {
    if (!newA.sym || !newA.qty || !newA.entry) return;
    setAssets(prev => [...prev, { id:Date.now(), sym:newA.sym.toUpperCase(), type:"other", qty:+newA.qty, entry:+newA.entry, current:+(newA.current||newA.entry), category:newA.category }]);
    setNewA({ sym:"", qty:"", entry:"", current:"", category:"Forex" });
    setShowAdd(false);
  };

  const analyzePortfolio = async () => {
    setAiLoad(true); setAiTip("");
    const list = assets.map(a => `${a.sym}: qty=${a.qty}, entry=${a.entry}, current=${a.current}, P&L=${((a.current-a.entry)*a.qty).toFixed(0)}`).join('\n');
    const p = isAr
      ? `حلل محفظتي الاستثمارية:\n${list}\nإجمالي P&L: ${totals.pl.toFixed(0)}\nاقترح التحسينات والمخاطر في 5 جمل.`
      : `Analyze my portfolio:\n${list}\nTotal P&L: $${totals.pl.toFixed(0)}\nSuggest improvements and risk notes in 5 sentences.`;
    const r = await proxyAI(p, 500);
    setAiTip(r || (isAr?"تعذّر التحليل":"Analysis unavailable"));
    setAiLoad(false);
  };

  const CATS = ["Forex","Crypto","Stocks","Metals","Indices","Other"];
  const catColors = { Forex:"#6366f1", Crypto:"#f7931a", Stocks:"#22c55e", Metals:"#f59e0b", Indices:"#3b82f6", Other:"#8b5cf6" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[
          [isAr?"المحفظة الكلية":"Total Portfolio", `$${totals.current.toLocaleString(undefined,{maximumFractionDigits:0})}`, P, "💼"],
          [isAr?"رأس المال":"Invested", `$${totals.invested.toLocaleString(undefined,{maximumFractionDigits:0})}`, "rgba(255,255,255,0.6)", "💰"],
          [isAr?"P&L":"P&L", `${totals.pl>=0?"+":""}$${totals.pl.toFixed(0)}`, totals.pl>=0?"#22c55e":"#ef4444", totals.pl>=0?"📈":"📉"],
          [isAr?"العائد%":"Return", `${totals.plPct>=0?"+":""}${totals.plPct.toFixed(2)}%`, totals.plPct>=0?"#22c55e":"#ef4444", "🎯"],
        ].map(([l,v,c,icon])=>(
          <div key={l} style={{ padding:"14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, textAlign:"center" }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{icon}</div>
            <div style={{ fontSize:18, fontWeight:900, color:c, fontFamily:"monospace" }}>{v}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Allocation donut (CSS-based) */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ padding:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:12 }}>{isAr?"توزيع المحفظة":"ALLOCATION"}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {byCategory.map(({cat,val,pct}) => (
              <div key={cat}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:"#fff" }}>{cat}</span>
                  <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{pct}% · ${val.toFixed(0)}</span>
                </div>
                <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:catColors[cat]||P, borderRadius:3, transition:"width 0.8s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assets table */}
        <div style={{ padding:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:12 }}>{isAr?"الأصول":"ASSETS"}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, maxHeight:200, overflowY:"auto" }}>
            {assets.map(a => {
              const pl = ((a.current - a.entry) * a.qty);
              const plPct = ((a.current - a.entry) / a.entry * 100);
              return (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background:catColors[a.category]||P, flexShrink:0 }} />
                  <span style={{ fontSize:11, fontWeight:700, color:"#fff", flex:1 }}>{a.sym}</span>
                  <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{a.qty}</span>
                  <span style={{ fontSize:11, fontWeight:700, color:pl>=0?"#22c55e":"#ef4444", minWidth:55, textAlign:"right" }}>{pl>=0?"+":""}{pl.toFixed(0)}</span>
                  <span style={{ fontSize:10, color:pl>=0?"#22c55e":"#ef4444" }}>{plPct>=0?"+":""}{plPct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:10 }}>
        <button onClick={()=>setShowAdd(v=>!v)} style={{ padding:"9px 20px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:700 }}>
          {showAdd?(isAr?"إلغاء":"Cancel"):(isAr?"+ أضف أصل":"+ Add Asset")}
        </button>
        <button onClick={analyzePortfolio} disabled={aiLoad} style={{ padding:"9px 20px", background:`${P}18`, border:`1px solid ${P}40`, color:P, borderRadius:9, cursor:aiLoad?"not-allowed":"pointer", fontSize:12, fontWeight:700 }}>
          {aiLoad?"...":(isAr?"🤖 تحليل AI":"🤖 AI Analyze")}
        </button>
      </div>

      {showAdd && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr auto", gap:8, padding:12, background:"rgba(255,255,255,0.03)", borderRadius:10, border:"1px solid rgba(255,255,255,0.08)" }}>
          {[["sym","Symbol","رمز"],["qty","Qty","الكمية"],["entry","Entry","الدخول"],["current","Current","الحالي"]].map(([k,l,la])=>(
            <input key={k} placeholder={isAr?la:l} value={newA[k]} onChange={e=>setNewA(p=>({...p,[k]:e.target.value}))}
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:"8px 10px", borderRadius:7, fontSize:12, outline:"none" }} />
          ))}
          <button onClick={addAsset} style={{ padding:"8px 14px", background:P, color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:12 }}>
            {isAr?"إضافة":"Add"}
          </button>
        </div>
      )}

      {aiTip && (
        <div style={{ padding:14, background:`${P}08`, border:`1px solid ${P}25`, borderRadius:12, fontSize:12, lineHeight:1.7, color:"rgba(255,255,255,0.75)" }}>
          <div style={{ fontWeight:700, color:P, marginBottom:6 }}>🤖 AI Portfolio Analysis</div>
          {aiTip}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   P&L DASHBOARD
══════════════════════════════════════════════════════ */
function PLDashboard({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [period, setPeriod] = useState("2w");

  const data = period === "1w" ? DAILY_PL.slice(-5) : period === "2w" ? DAILY_PL.slice(-10) : DAILY_PL;
  const totalPL = data.reduce((s,d) => s + d.pl, 0);
  const winDays = data.filter(d => d.pl > 0).length;
  const maxDay  = data.reduce((m,d) => d.pl > m.pl ? d : m, data[0]);
  const minDay  = data.reduce((m,d) => d.pl < m.pl ? d : m, data[0]);

  const maxAbs = Math.max(...data.map(d => Math.abs(d.pl)), 1);
  const maxCum = Math.max(...data.map(d => d.cum), 1);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#fff", flex:1 }}>💹 {isAr?"لوحة الأرباح والخسائر":"P&L Dashboard"}</div>
        {["1w","2w","1m"].map(p => (
          <button key={p} onClick={()=>setPeriod(p)} style={{ padding:"4px 12px", borderRadius:16, border:`1px solid ${period===p?P:`${P}30`}`, background:period===p?`${P}18`:"transparent", color:period===p?P:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, cursor:"pointer" }}>{p}</button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[
          [isAr?"إجمالي P&L":"Total P&L", `${totalPL>=0?"+":""}$${totalPL}`, totalPL>=0?"#22c55e":"#ef4444"],
          [isAr?"أيام رابحة":"Win Days", `${winDays}/${data.length}`, "#f59e0b"],
          [isAr?"أفضل يوم":"Best Day", `+$${maxDay?.pl}`, "#22c55e"],
          [isAr?"أسوأ يوم":"Worst Day", `$${minDay?.pl}`, "#ef4444"],
        ].map(([l,v,c])=>(
          <div key={l} style={{ padding:"12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:900, color:c, fontFamily:"monospace" }}>{v}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Daily P&L bar chart */}
      <div style={{ padding:"14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>{isAr?"P&L اليومي":"DAILY P&L"}</div>
        <div style={{ display:"flex", gap:4, alignItems:"center", height:100 }}>
          {data.map((d,i) => {
            const h = Math.max(4, (Math.abs(d.pl) / maxAbs) * 80);
            return (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                {d.pl >= 0 ? (
                  <><div style={{ width:"80%", height:h, background:"rgba(74,222,128,0.7)", borderRadius:"3px 3px 0 0", alignSelf:"flex-end" }} /><div style={{ width:"80%", height:4, background:"transparent" }} /></>
                ) : (
                  <><div style={{ width:"80%", height:4, background:"transparent" }} /><div style={{ width:"80%", height:h, background:"rgba(224,82,82,0.7)", borderRadius:"0 0 3px 3px" }} /></>
                )}
                <div style={{ fontSize:7, color:"rgba(255,255,255,0.3)", textAlign:"center" }}>{d.date}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cumulative equity curve */}
      <div style={{ padding:"14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:12 }}>{isAr?"المكاسب التراكمية":"CUMULATIVE GAINS"}</div>
        <div style={{ display:"flex", gap:2, alignItems:"flex-end", height:80 }}>
          {data.map((d,i) => {
            const h = Math.max(4, (d.cum / maxCum) * 72);
            return <div key={i} style={{ flex:1, height:h, background:`${P}80`, borderRadius:"2px 2px 0 0", transition:"height 0.4s" }} />;
          })}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>{data[0]?.date}</span>
          <span style={{ fontSize:11, fontWeight:700, color:P }}>+${data[data.length-1]?.cum}</span>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {[["Week 1","+$289","#22c55e"],["Week 2","+$598","#22c55e"],["Week 3","−$144","#ef4444"]].map(([w,v,c])=>(
          <div key={w} style={{ padding:"10px", background:"rgba(255,255,255,0.03)", borderRadius:9, border:"1px solid rgba(255,255,255,0.07)", textAlign:"center" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{w}</div>
            <div style={{ fontSize:15, fontWeight:900, color:c }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   RISK MANAGER
══════════════════════════════════════════════════════ */
function RiskManager({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [riskBudget, setRiskBudget] = useState(5);
  const [balance, setBalance] = useState(10000);
  const [aiReport, setAiReport] = useState(""); const [aiLoad, setAiLoad] = useState(false);

  const maxRisk  = balance * (riskBudget / 100);
  const usedRisk = 2840;
  const usedPct  = Math.min(100, (usedRisk / maxRisk * 100)).toFixed(0);
  const riskColor = usedPct > 80 ? "#ef4444" : usedPct > 60 ? "#f59e0b" : "#22c55e";

  const getReport = async () => {
    setAiLoad(true); setAiReport("");
    const p = isAr
      ? `أنا متداول برصيد $${balance}، ميزانية مخاطر ${riskBudget}%، مخاطر مستخدمة $${usedRisk}. نصيحة في إدارة المخاطر في 4 جمل.`
      : `Trader with $${balance} balance, ${riskBudget}% risk budget, $${usedRisk} currently at risk. Give 4-sentence risk management advice.`;
    const r = await proxyAI(p, 350);
    setAiReport(r || (isAr?"تعذّر التقرير":"Report unavailable"));
    setAiLoad(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>🛡️ {isAr?"مدير المخاطر":"Risk Manager"}</div>

      {/* Risk Budget */}
      <div style={{ padding:16, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
          <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{isAr?"ميزانية المخاطر":"Risk Budget"}</span>
          <span style={{ fontSize:18, fontWeight:900, color:riskColor }}>${maxRisk.toLocaleString()}</span>
        </div>
        <input type="range" min={0.5} max={10} step={0.5} value={riskBudget} onChange={e=>setRiskBudget(+e.target.value)}
          style={{ width:"100%", accentColor:P, marginBottom:6 }} />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"rgba(255,255,255,0.4)" }}>
          <span>0.5%</span><span style={{ color:P, fontWeight:700 }}>{riskBudget}% = ${maxRisk.toFixed(0)}</span><span>10%</span>
        </div>
      </div>

      {/* Risk Used Gauge */}
      <div style={{ padding:16, background:"rgba(255,255,255,0.03)", border:`1px solid ${riskColor}30`, borderRadius:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <span style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>{isAr?"المخاطر المستخدمة":"Risk In Use"}</span>
          <span style={{ fontSize:13, fontWeight:700, color:riskColor }}>${usedRisk.toLocaleString()} / ${maxRisk.toFixed(0)}</span>
        </div>
        <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:5, overflow:"hidden" }}>
          <div style={{ width:`${usedPct}%`, height:"100%", background:riskColor, borderRadius:5, transition:"width 0.8s", boxShadow:`0 0 8px ${riskColor}60` }} />
        </div>
        <div style={{ fontSize:10, color:riskColor, marginTop:6, fontWeight:700 }}>{usedPct}% {isAr?"مستخدم":"used"}</div>
      </div>

      {/* Risk Metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {RISK_METRICS.map(m => (
          <div key={m.label} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ fontSize:20 }}>{m.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginBottom:2 }}>{isAr?m.labelAr:m.label}</div>
              <div style={{ fontSize:16, fontWeight:900, color:m.color }}>{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Exposure breakdown */}
      <div style={{ padding:14, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>{isAr?"التعرض بالفئة":"EXPOSURE BY CATEGORY"}</div>
        {[["Forex","$1,200",42,"#6366f1"],["Crypto","$820",29,"#f7931a"],["Stocks","$520",18,"#22c55e"],["Indices","$300",11,"#3b82f6"]].map(([c,v,p,col])=>(
          <div key={c} style={{ marginBottom:8 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:11, color:"#fff" }}>{c}</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>{v} · {p}%</span>
            </div>
            <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
              <div style={{ width:`${p}%`, height:"100%", background:col, borderRadius:3 }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
        <div>
          <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>{isAr?"الرصيد ($)":"Balance ($)"}</label>
          <input type="number" value={balance} onChange={e=>setBalance(+e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"8px 10px", borderRadius:8, fontSize:12, outline:"none", boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"flex", alignItems:"flex-end" }}>
          <button onClick={getReport} disabled={aiLoad} style={{ width:"100%", padding:"10px 0", background:`${P}18`, border:`1px solid ${P}40`, color:P, borderRadius:8, cursor:aiLoad?"not-allowed":"pointer", fontWeight:700, fontSize:12 }}>
            {aiLoad?"...":(isAr?"🤖 تقييم المخاطر":"🤖 Risk Assessment")}
          </button>
        </div>
      </div>

      {aiReport && (
        <div style={{ padding:12, background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, fontSize:12, lineHeight:1.7, color:"rgba(255,255,255,0.75)" }}>
          <div style={{ fontWeight:700, color:"#f59e0b", marginBottom:6 }}>🛡️ AI Risk Report</div>
          {aiReport}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
export default function PortfolioTab({ theme, lang }) {
  const isAr = lang === "ar";
  const P = theme?.primary || '#6366f1';
  const [activeTab, setActiveTab] = useState("tracker");

  const TABS = [
    { id:"tracker", label:"💼 Tracker",   labelAr:"💼 المحفظة" },
    { id:"pnl",     label:"💹 P&L",       labelAr:"💹 الأرباح" },
    { id:"risk",    label:"🛡️ Risk",      labelAr:"🛡️ المخاطر" },
  ];

  const card = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, backdropFilter:"blur(12px)" };

  return (
    <div style={{ fontFamily:isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif", direction:isAr?"rtl":"ltr", display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>{isAr?"💼 إدارة المحفظة":"💼 Portfolio Management"}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{isAr?"متابعة • أرباح • مخاطر":"Tracker · P&L · Risk"}</div>
        </div>
      </div>

      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", padding:"4px", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", background:activeTab===t.id?`${P}20`:"transparent", color:activeTab===t.id?P:"rgba(255,255,255,0.4)", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
            {isAr?t.labelAr:t.label}
          </button>
        ))}
      </div>

      <div style={card}>
        {activeTab === "tracker" && <PortfolioTracker theme={theme} isAr={isAr} />}
        {activeTab === "pnl"     && <PLDashboard      theme={theme} isAr={isAr} />}
        {activeTab === "risk"    && <RiskManager       theme={theme} isAr={isAr} />}
      </div>
    </div>
  );
}
