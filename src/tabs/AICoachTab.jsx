/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { proxyAI } from '../utils/ai';

/* ══════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════ */
const TRADE_LOG = [
  { id:1,  pair:"EUR/USD", dir:"buy",  entry:1.0820, exit:1.0791, lots:0.5, pl:-14.5, dur:"2h 15m", mistake:"Entered against trend" },
  { id:2,  pair:"XAU/USD", dir:"buy",  entry:2048,   exit:2079,   lots:0.2, pl:62.0,  dur:"5h 40m", mistake:null },
  { id:3,  pair:"BTC/USD", dir:"sell", entry:45200,   exit:44800,  lots:0.1, pl:40.0,  dur:"1h 05m", mistake:null },
  { id:4,  pair:"GBP/USD", dir:"buy",  entry:1.2710,  exit:1.2648, lots:0.3, pl:-18.6, dur:"3h 20m", mistake:"No SL set" },
  { id:5,  pair:"USD/JPY", dir:"sell", entry:149.80,  exit:150.20, lots:0.5, pl:-20.0, dur:"45m",    mistake:"Traded news event" },
  { id:6,  pair:"NAS100",  dir:"buy",  entry:17200,   exit:17510,  lots:0.1, pl:31.0,  dur:"8h",     mistake:null },
  { id:7,  pair:"EUR/USD", dir:"sell", entry:1.0895,  exit:1.0841, lots:0.5, pl:27.0,  dur:"4h 10m", mistake:null },
  { id:8,  pair:"AAPL",    dir:"buy",  entry:191.0,   exit:188.5,  lots:5,   pl:-12.5, dur:"1d 2h",  mistake:"Overtrade" },
];

const MISTAKES_DATA = [
  { type:"Against Trend",  typeAr:"ضد الاتجاه",    count:4, color:"#ef4444" },
  { type:"No Stop Loss",   typeAr:"بدون وقف خسارة", count:3, color:"#f59e0b" },
  { type:"News Trading",   typeAr:"تداول الأخبار",  count:2, color:"#8b5cf6" },
  { type:"Overtrading",    typeAr:"الإفراط في التداول", count:5, color:"#3b82f6" },
  { type:"FOMO Entry",     typeAr:"الدخول بعاطفة",  count:3, color:"#ec4899" },
];

const PAIRS_PRED = ["EUR/USD","GBP/USD","USD/JPY","XAU/USD","BTC/USD","ETH/USD","NAS100","US30"];

/* ══════════════════════════════════════════════════════
   AI TRADE COACH
══════════════════════════════════════════════════════ */
function AICoach({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([
    { role:"assistant", content: isAr
      ? "مرحباً! أنا مدرب التداول بالذكاء الاصطناعي. يمكنني تحليل أخطاء تداولك، تحسين استراتيجيتك، والإجابة على أسئلتك. كيف يمكنني مساعدتك اليوم؟"
      : "Hi! I'm your AI Trade Coach. I can analyze your trading mistakes, improve your strategy, and answer questions. How can I help today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    const q = chatInput.trim();
    if (!q) return;
    setChatInput("");
    setMessages(prev => [...prev, { role:"user", content:q }]);
    setLoading(true);

    const tradeContext = TRADE_LOG.slice(0,5).map(t => `${t.dir.toUpperCase()} ${t.pair}: P&L=${t.pl>=0?"+":""}${t.pl} (${t.dur})${t.mistake?` ❌ ${t.mistake}`:""}`).join('\n');
    const wins  = TRADE_LOG.filter(t=>t.pl>0).length;
    const total = TRADE_LOG.length;

    const prompt = isAr
      ? `أنت مدرب تداول محترف. سجل التداول الأخير:\n${tradeContext}\nنسبة الفوز: ${wins}/${total}\nسؤال المتداول: ${q}\nأجب باختصار وعملياً في 3-4 جمل.`
      : `You are a professional trade coach. Recent trade log:\n${tradeContext}\nWin rate: ${wins}/${total}\nTrader asks: "${q}"\nRespond concisely and practically in 3-4 sentences.`;

    const r = await proxyAI(prompt, 400);
    setMessages(prev => [...prev, { role:"assistant", content: r || (isAr?"تعذّر الرد":"Response unavailable") }]);
    setLoading(false);
  };

  const QUICK_QUESTIONS = isAr
    ? ["ما أكثر أخطائي تكراراً؟","كيف أحسن نسبة الفوز؟","متى أوقف التداول اليوم؟","ما أفضل إدارة رأس المال لي؟"]
    : ["What's my biggest mistake?","How do I improve win rate?","When should I stop trading today?","Best position sizing for me?"];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>🤖 {isAr?"مدرب التداول بالذكاء الاصطناعي":"AI Trade Coach"}</div>

      {/* Stats bar */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
        {(() => {
          const wins = TRADE_LOG.filter(t=>t.pl>0).length;
          const totalPL = TRADE_LOG.reduce((s,t)=>s+t.pl,0);
          const mistakes = TRADE_LOG.filter(t=>t.mistake).length;
          const avgPL = (totalPL / TRADE_LOG.length).toFixed(1);
          return [
            [isAr?"الصفقات":"Trades", TRADE_LOG.length, "#fff"],
            [isAr?"نسبة الفوز":"Win Rate", `${Math.round(wins/TRADE_LOG.length*100)}%`, "#22c55e"],
            [isAr?"صافي P&L":"Net P&L", `${totalPL>=0?"+":""}$${totalPL.toFixed(0)}`, totalPL>=0?"#22c55e":"#ef4444"],
            [isAr?"أخطاء":"Mistakes", mistakes, "#f59e0b"],
          ].map(([l,v,c])=>(
            <div key={l} style={{ padding:"10px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, textAlign:"center" }}>
              <div style={{ fontSize:15, fontWeight:900, color:c }}>{v}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{l}</div>
            </div>
          ));
        })()}
      </div>

      {/* Mistakes heatmap */}
      <div style={{ padding:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:10 }}>{isAr?"أكثر الأخطاء تكراراً":"MOST COMMON MISTAKES"}</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {MISTAKES_DATA.map(m => (
            <div key={m.type} style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.65)", minWidth:140 }}>{isAr?m.typeAr:m.type}</span>
              <div style={{ flex:1, height:6, background:"rgba(255,255,255,0.05)", borderRadius:3 }}>
                <div style={{ width:`${(m.count/5)*100}%`, height:"100%", background:m.color, borderRadius:3 }} />
              </div>
              <span style={{ fontSize:11, fontWeight:700, color:m.color, minWidth:20 }}>{m.count}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"8px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700 }}>
          💬 {isAr?"محادثة مع المدرب":"COACH CHAT"}
        </div>
        <div style={{ height:220, overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:10 }}>
          {messages.map((m,i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"82%", padding:"8px 12px", borderRadius:10, fontSize:12, lineHeight:1.6,
                background:m.role==="user"?`${P}25`:"rgba(255,255,255,0.05)",
                border:`1px solid ${m.role==="user"?`${P}40`:"rgba(255,255,255,0.08)"}`,
                color:m.role==="user"?P:"rgba(255,255,255,0.8)", direction:isAr?"rtl":"ltr" }}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex" }}>
              <div style={{ padding:"8px 12px", background:"rgba(255,255,255,0.05)", borderRadius:10, fontSize:12, color:"rgba(255,255,255,0.4)" }}>
                {isAr?"يفكر...":"Thinking..."}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div style={{ padding:"8px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:8 }}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder={isAr?"اسأل مدربك...":"Ask your coach..."}
            style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:"8px 12px", borderRadius:8, fontSize:12, outline:"none" }} />
          <button onClick={send} disabled={loading||!chatInput.trim()} style={{ padding:"8px 16px", background:P, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
            {isAr?"إرسال":"Send"}
          </button>
        </div>
      </div>

      {/* Quick questions */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {QUICK_QUESTIONS.map(q => (
          <button key={q} onClick={()=>{setChatInput(q);}} style={{ padding:"5px 12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", borderRadius:16, fontSize:10, cursor:"pointer", fontWeight:600 }}>{q}</button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   AI PRICE PREDICTION
══════════════════════════════════════════════════════ */
function AIPricePrediction({ theme, isAr, prices }) {
  const P = theme?.primary || '#6366f1';
  const [pair, setPair] = useState("EUR/USD");
  const [tf, setTf] = useState("4h");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const predict = async () => {
    setLoading(true); setResult(null);
    const livePrice = prices?.find(p=>p.pair===pair)?.price;
    const prompt = isAr
      ? `تنبأ بحركة السعر لـ ${pair} على الإطار الزمني ${tf}. السعر الحالي: ${livePrice||"غير محدد"}.\nأعطني: 1) الاتجاه (صعود/هبوط/محايد) 2) هدف السعر 3) وقف الخسارة المقترح 4) نسبة الثقة (%) 5) أبرز سبب واحد. كن مختصراً ومنظماً.`
      : `Predict price movement for ${pair} on ${tf} timeframe. Current price: ${livePrice||"unknown"}.\nProvide: 1) Direction (bullish/bearish/neutral) 2) Price target 3) Suggested stop loss 4) Confidence % 5) Top reason. Be concise and structured.`;
    const r = await proxyAI(prompt, 350);
    const dir = /bullish|bull|صعود|شراء/i.test(r||"") ? "bullish" : /bearish|bear|هبوط|بيع/i.test(r||"") ? "bearish" : "neutral";
    const confMatch = r?.match(/(\d{2,3})%/);
    setResult({ text:r, dir, conf:confMatch?parseInt(confMatch[1]):65 });
    setLoading(false);
  };

  const dirColor = result?.dir === "bullish" ? "#22c55e" : result?.dir === "bearish" ? "#ef4444" : "#f59e0b";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>🔮 {isAr?"توقع الأسعار بالذكاء الاصطناعي":"AI Price Prediction"}</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div>
          <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>{isAr?"الزوج":"Pair"}</label>
          <select value={pair} onChange={e=>setPair(e.target.value)} style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"9px 12px", borderRadius:9, fontSize:13 }}>
            {PAIRS_PRED.map(p=><option key={p} value={p} style={{background:"#1a1a2e"}}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:10, color:"rgba(255,255,255,0.4)", display:"block", marginBottom:4 }}>{isAr?"الإطار الزمني":"Timeframe"}</label>
          <div style={{ display:"flex", gap:4 }}>
            {["1h","4h","1D","1W"].map(t=>(
              <button key={t} onClick={()=>setTf(t)} style={{ flex:1, padding:"9px 0", borderRadius:8, border:`1px solid ${tf===t?P:`${P}30`}`, background:tf===t?`${P}18`:"transparent", color:tf===t?P:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, cursor:"pointer" }}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      <button onClick={predict} disabled={loading} style={{ padding:"14px 0", background:loading?"rgba(255,255,255,0.06)":P, color:"#fff", border:"none", borderRadius:11, cursor:loading?"not-allowed":"pointer", fontWeight:800, fontSize:14, boxShadow:loading?"none":`0 4px 20px ${P}50`, transition:"all 0.2s" }}>
        {loading?(isAr?"جارٍ التنبؤ...":"Predicting..."):(isAr?"🔮 توقع الحركة":"🔮 Predict Movement")}
      </button>

      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ padding:"16px", background:`${dirColor}09`, border:`1px solid ${dirColor}30`, borderRadius:14, display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ fontSize:40 }}>{result.dir==="bullish"?"📈":result.dir==="bearish"?"📉":"➡️"}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:18, fontWeight:900, color:dirColor, textTransform:"uppercase" }}>
                {isAr?result.dir==="bullish"?"صعودي":result.dir==="bearish"?"هبوطي":"محايد":result.dir}
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{pair} · {tf}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:24, fontWeight:900, color:dirColor }}>{result.conf}%</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{isAr?"ثقة":"confidence"}</div>
            </div>
          </div>

          {/* Confidence bar */}
          <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ width:`${result.conf}%`, height:"100%", background:`linear-gradient(90deg,${dirColor}80,${dirColor})`, borderRadius:4, transition:"width 0.8s" }} />
          </div>

          <div style={{ padding:"14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, fontSize:12, lineHeight:1.8, color:"rgba(255,255,255,0.8)", whiteSpace:"pre-line", direction:isAr?"rtl":"ltr" }}>
            {result.text}
          </div>

          <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", textAlign:"center" }}>
            ⚠️ {isAr?"هذا تحليل بالذكاء الاصطناعي وليس نصيحة مالية. تداول بمسؤولية.":"AI analysis only — not financial advice. Trade responsibly."}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
export default function AICoachTab({ theme, lang, prices }) {
  const isAr = lang === "ar";
  const P = theme?.primary || '#6366f1';
  const [activeTab, setActiveTab] = useState("coach");

  const TABS = [
    { id:"coach",   label:"🤖 Coach",      labelAr:"🤖 المدرب" },
    { id:"predict", label:"🔮 Predict",    labelAr:"🔮 التوقع" },
  ];

  const card = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, backdropFilter:"blur(12px)" };

  return (
    <div style={{ fontFamily:isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif", direction:isAr?"rtl":"ltr", display:"flex", flexDirection:"column", gap:16 }}>
      <div>
        <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>{isAr?"🤖 الذكاء الاصطناعي للتداول":"🤖 AI Trading Intelligence"}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{isAr?"مدرب شخصي + توقعات الأسعار":"Personal coach · Price prediction"}</div>
      </div>

      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", padding:"4px", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", background:activeTab===t.id?`${P}20`:"transparent", color:activeTab===t.id?P:"rgba(255,255,255,0.4)", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
            {isAr?t.labelAr:t.label}
          </button>
        ))}
      </div>

      <div style={card}>
        {activeTab === "coach"   && <AICoach        theme={theme} isAr={isAr} />}
        {activeTab === "predict" && <AIPricePrediction theme={theme} isAr={isAr} prices={prices} />}
      </div>
    </div>
  );
}
