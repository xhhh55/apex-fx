/* eslint-disable */
import { useState, useEffect, useRef, useMemo } from 'react';
import { proxyAI } from '../utils/ai';

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
const TRADERS = ["AlphaTrader","FXKing","GoldBull88","CryptoWolf","PipHunter","TrendRider","ScalpMaster","MarketMaker","NightOwl","DayTrader99"];
const PAIRS_LIVE = ["EUR/USD","GBP/USD","XAU/USD","BTC/USD","NAS100","USD/JPY","ETH/USD","AAPL"];
const AVATARS = ["🦁","🐯","🦊","🐻","🐺","🦅","🦋","🐉","🦄","🐬"];

const rndItem = (arr) => arr[Math.floor(Math.random()*arr.length)];
const rndPct  = (min,max) => +(Math.random()*(max-min)+min).toFixed(2);
const fmtTime = (d) => d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});

function genTrade() {
  const pair = rndItem(PAIRS_LIVE);
  const dir  = Math.random() > 0.5 ? "buy" : "sell";
  const lots = +(Math.random()*2+0.01).toFixed(2);
  const price = pair === "BTC/USD" ? +(44000+Math.random()*2000).toFixed(0) : pair === "XAU/USD" ? +(2050+Math.random()*50).toFixed(1) : +(1+Math.random()*0.5).toFixed(5);
  const pl   = dir==="buy" ? rndPct(-50,120) : rndPct(-50,120);
  return { id:Date.now()+Math.random(), trader:rndItem(TRADERS), avatar:rndItem(AVATARS), pair, dir, lots, price, pl, ts:new Date() };
}

function genChatMsg(isAr) {
  const msgs = isAr
    ? ["EUR/USD يبدو صاعداً!","وقف الخسارة على 1.0820","أخبار الفيد الساعة 3","الذهب قوي هذا الأسبوع","هل BTC سيكسر 46k؟","تحليل GBP مهم الآن","أغلقت صفقة EUR بـ +45$","السوق متذبذب اليوم","NAS100 يقترب من مقاومة"]
    : ["EUR/USD looking bullish!","SL at 1.0820","Fed news at 3pm","Gold strong this week","Will BTC break 46k?","GBP analysis important now","Closed EUR trade +$45","Market choppy today","NAS100 near resistance"];
  const trader = rndItem(TRADERS);
  return { id:Date.now()+Math.random(), trader, avatar:rndItem(AVATARS), msg:rndItem(msgs), ts:new Date() };
}

/* ══════════════════════════════════════════════════════
   LIVE FEED
══════════════════════════════════════════════════════ */
function LiveFeed({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [feed, setFeed] = useState(() => Array.from({length:18}, genTrade));
  const [filter, setFilter] = useState("all");
  const [paused, setPaused] = useState(false);
  const feedRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setFeed(prev => [genTrade(), ...prev].slice(0,60));
    }, 1800);
    return () => clearInterval(id);
  }, [paused]);

  const filtered = useMemo(() => {
    if (filter === "all") return feed;
    if (filter === "buy") return feed.filter(t=>t.dir==="buy");
    if (filter === "sell") return feed.filter(t=>t.dir==="sell");
    return feed.filter(t=>t.pair===filter);
  }, [feed, filter]);

  const stats = useMemo(() => {
    const buys  = feed.filter(t=>t.dir==="buy").length;
    const sells = feed.filter(t=>t.dir==="sell").length;
    const total = feed.length || 1;
    return { buys, sells, buyPct: Math.round(buys/total*100) };
  }, [feed]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fff" }}>⚡ {isAr?"تدفق الصفقات المباشر":"Live Trade Feed"}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{isAr?"صفقات المتداولين في الوقت الفعلي":"Real-time trader activity"}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:paused?"#6b7280":"#22c55e", animation:paused?"none":"pulse 1.5s infinite" }} />
          <span style={{ fontSize:10, color:paused?"rgba(255,255,255,0.3)":"#22c55e", fontWeight:700 }}>{paused?(isAr?"متوقف":"Paused"):(isAr?"مباشر":"LIVE")}</span>
        </div>
        <button onClick={()=>setPaused(v=>!v)} style={{ padding:"4px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.6)", borderRadius:16, fontSize:10, cursor:"pointer" }}>
          {paused?(isAr?"▶ استئناف":"▶ Resume"):(isAr?"⏸ إيقاف":"⏸ Pause")}
        </button>
      </div>

      {/* Sentiment bar */}
      <div style={{ padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:11, fontWeight:700, color:"#22c55e" }}>🟢 {stats.buyPct}%</span>
        <div style={{ flex:1, height:8, background:"rgba(224,82,82,0.3)", borderRadius:4, overflow:"hidden" }}>
          <div style={{ width:`${stats.buyPct}%`, height:"100%", background:"#22c55e", borderRadius:4, transition:"width 0.5s" }} />
        </div>
        <span style={{ fontSize:11, fontWeight:700, color:"#ef4444" }}>🔴 {100-stats.buyPct}%</span>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{feed.length} {isAr?"صفقة":"trades"}</span>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {["all","buy","sell",...PAIRS_LIVE.slice(0,4)].map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"3px 10px", borderRadius:14, border:`1px solid ${filter===f?P:`${P}25`}`, background:filter===f?`${P}18`:"transparent", color:filter===f?P:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:700, cursor:"pointer" }}>
            {f==="all"?(isAr?"الكل":"All"):f==="buy"?(isAr?"شراء":"Buy"):f==="sell"?(isAr?"بيع":"Sell"):f}
          </button>
        ))}
      </div>

      {/* Feed list */}
      <div ref={feedRef} style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:380, overflowY:"auto" }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        {filtered.slice(0,40).map((t,i) => (
          <div key={t.id} style={{ display:"grid", gridTemplateColumns:"32px 1fr 60px 60px 55px 50px", gap:8, alignItems:"center",
            padding:"7px 12px", background:i===0?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)",
            border:`1px solid ${i===0?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)"}`,
            borderRadius:8, animation:i===0?"slideDown 0.3s ease":"none", transition:"background 0.3s" }}>
            <span style={{ fontSize:16 }}>{t.avatar}</span>
            <div>
              <div style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.7)" }}>{t.trader}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>{fmtTime(t.ts)}</div>
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.7)" }}>{t.pair}</span>
            <span style={{ fontSize:11, fontWeight:800, color:t.dir==="buy"?"#22c55e":"#ef4444" }}>
              {t.dir==="buy"?"▲ BUY":"▼ SELL"}
            </span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{t.lots} lot</span>
            <span style={{ fontSize:11, fontWeight:700, color:t.pl>=0?"#22c55e":"#ef4444" }}>
              {t.pl>=0?"+":""}{t.pl}$
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   TRADING ROOM
══════════════════════════════════════════════════════ */
function TradingRoom({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [messages, setMessages] = useState(() => Array.from({length:12}, ()=>genChatMsg(isAr)));
  const [input, setInput] = useState("");
  const [votes, setVotes] = useState({ EUR_USD:{up:68,dn:32}, XAU_USD:{up:75,dn:25}, BTC_USD:{up:52,dn:48}, GBP_USD:{up:41,dn:59} });
  const [myVotes, setMyVotes] = useState({});
  const [aiAns, setAiAns] = useState(""); const [aiLoad, setAiLoad] = useState(false);
  const [roomQ, setRoomQ] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  useEffect(() => {
    const id = setInterval(() => {
      setMessages(prev => [...prev, genChatMsg(isAr)].slice(-80));
    }, 4000);
    return () => clearInterval(id);
  }, [isAr]);

  const sendMsg = () => {
    const txt = input.trim();
    if (!txt) return;
    setInput("");
    setMessages(prev => [...prev, { id:Date.now(), trader:"You", avatar:"👤", msg:txt, ts:new Date(), isMe:true }]);
  };

  const vote = (pair, dir) => {
    if (myVotes[pair]) return;
    setMyVotes(v => ({ ...v, [pair]:dir }));
    setVotes(v => ({ ...v, [pair]:{ up:dir==="up"?v[pair].up+1:v[pair].up, dn:dir==="dn"?v[pair].dn+1:v[pair].dn } }));
  };

  const askRoom = async () => {
    if (!roomQ.trim()) return;
    setAiLoad(true); setAiAns("");
    const p = isAr
      ? `سؤال من غرفة التداول: "${roomQ}". أجب كخبير تداول في 3 جمل.`
      : `Trading room question: "${roomQ}". Answer as a trading expert in 3 sentences.`;
    const r = await proxyAI(p, 300);
    setAiAns(r || (isAr?"تعذّر الرد":"Unavailable"));
    setAiLoad(false);
  };

  const VOTE_PAIRS = [
    { key:"EUR_USD", label:"EUR/USD" },
    { key:"XAU_USD", label:"XAU/USD" },
    { key:"BTC_USD", label:"BTC/USD" },
    { key:"GBP_USD", label:"GBP/USD" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      {/* Direction Votes */}
      <div>
        <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:10 }}>
          🗳️ {isAr?"تصويت اتجاه السوق":"MARKET DIRECTION VOTE"}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {VOTE_PAIRS.map(({key,label}) => {
            const v = votes[key];
            const total = v.up + v.dn;
            const upPct = Math.round(v.up/total*100);
            const myV   = myVotes[key];
            return (
              <div key={key} style={{ padding:"10px 12px", background:"rgba(255,255,255,0.03)", border:`1px solid rgba(255,255,255,0.07)`, borderRadius:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#fff", marginBottom:8 }}>{label}</div>
                <div style={{ height:6, background:"rgba(224,82,82,0.3)", borderRadius:3, overflow:"hidden", marginBottom:8 }}>
                  <div style={{ width:`${upPct}%`, height:"100%", background:"#22c55e", borderRadius:3, transition:"width 0.5s" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, marginBottom:8 }}>
                  <span style={{ color:"#22c55e" }}>🟢 {upPct}%</span>
                  <span style={{ color:"rgba(255,255,255,0.4)" }}>{total} votes</span>
                  <span style={{ color:"#ef4444" }}>🔴 {100-upPct}%</span>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={()=>vote(key,"up")} disabled={!!myV} style={{ flex:1, padding:"5px 0", borderRadius:6, border:`1px solid ${myV==="up"?"#22c55e":"rgba(74,222,128,0.25)"}`, background:myV==="up"?"rgba(74,222,128,0.2)":"transparent", color:"#22c55e", fontSize:10, fontWeight:700, cursor:myV?"default":"pointer" }}>
                    ▲ {isAr?"صعود":"Bull"}
                  </button>
                  <button onClick={()=>vote(key,"dn")} disabled={!!myV} style={{ flex:1, padding:"5px 0", borderRadius:6, border:`1px solid ${myV==="dn"?"#ef4444":"rgba(224,82,82,0.25)"}`, background:myV==="dn"?"rgba(224,82,82,0.2)":"transparent", color:"#ef4444", fontSize:10, fontWeight:700, cursor:myV?"default":"pointer" }}>
                    ▼ {isAr?"هبوط":"Bear"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Room Q&A */}
      <div style={{ padding:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.5)", marginBottom:8 }}>🤖 {isAr?"سؤال للذكاء الاصطناعي":"Ask AI Analyst"}</div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={roomQ} onChange={e=>setRoomQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askRoom()}
            placeholder={isAr?"اسأل عن السوق...":"Ask about the market..."}
            style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:"7px 10px", borderRadius:7, fontSize:12, outline:"none" }} />
          <button onClick={askRoom} disabled={aiLoad||!roomQ.trim()} style={{ padding:"7px 14px", background:P, color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:700, fontSize:11 }}>
            {aiLoad?"...":"Ask"}
          </button>
        </div>
        {aiAns && <div style={{ marginTop:8, fontSize:12, color:"rgba(255,255,255,0.75)", lineHeight:1.6, padding:"8px 10px", background:`${P}08`, borderRadius:8, direction:isAr?"rtl":"ltr" }}>{aiAns}</div>}
      </div>

      {/* Chat */}
      <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"8px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:"50%", background:"#22c55e", animation:"pulse 1.5s infinite" }} />
          <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.5)" }}>{isAr?"غرفة التداول المباشرة":"LIVE TRADING ROOM"}</span>
          <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginInlineStart:"auto" }}>{TRADERS.length} {isAr?"متداول":"online"}</span>
        </div>
        <div style={{ height:240, overflowY:"auto", padding:"10px", display:"flex", flexDirection:"column", gap:6 }}>
          {messages.slice(-30).map((m,i) => (
            <div key={m.id} style={{ display:"flex", gap:8, alignItems:"flex-start", justifyContent:m.isMe?"flex-end":"flex-start" }}>
              {!m.isMe && <span style={{ fontSize:14, flexShrink:0 }}>{m.avatar}</span>}
              <div style={{ maxWidth:"75%" }}>
                {!m.isMe && <div style={{ fontSize:9, color:P, fontWeight:700, marginBottom:2 }}>{m.trader}</div>}
                <div style={{ padding:"6px 10px", borderRadius:8, fontSize:11, lineHeight:1.5,
                  background:m.isMe?`${P}25`:"rgba(255,255,255,0.05)",
                  border:`1px solid ${m.isMe?`${P}40`:"rgba(255,255,255,0.07)"}`,
                  color:m.isMe?P:"rgba(255,255,255,0.75)" }}>
                  {m.msg}
                </div>
                <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{fmtTime(m.ts)}</div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div style={{ padding:"8px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:8 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendMsg()}
            placeholder={isAr?"أرسل رسالة...":"Send a message..."}
            style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", padding:"8px 12px", borderRadius:8, fontSize:12, outline:"none" }} />
          <button onClick={sendMsg} disabled={!input.trim()} style={{ padding:"8px 16px", background:P, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
            {isAr?"إرسال":"Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LEADERBOARD
══════════════════════════════════════════════════════ */
const LEADERBOARD = [
  { rank:1,  name:"AlphaTrader",  avatar:"🦁", pl:4280,  winRate:71, trades:38, badge:"🥇" },
  { rank:2,  name:"GoldBull88",   avatar:"🐯", pl:3150,  winRate:68, trades:45, badge:"🥈" },
  { rank:3,  name:"CryptoWolf",   avatar:"🐺", pl:2890,  winRate:65, trades:52, badge:"🥉" },
  { rank:4,  name:"FXKing",       avatar:"🦅", pl:2340,  winRate:62, trades:41, badge:"⭐" },
  { rank:5,  name:"PipHunter",    avatar:"🦊", pl:1980,  winRate:58, trades:67, badge:"⭐" },
  { rank:6,  name:"TrendRider",   avatar:"🦋", pl:1650,  winRate:55, trades:34, badge:"⭐" },
  { rank:7,  name:"ScalpMaster",  avatar:"🐉", pl:1420,  winRate:53, trades:89, badge:"⭐" },
  { rank:8,  name:"NightOwl",     avatar:"🦄", pl:980,   winRate:51, trades:28, badge:"⭐" },
  { rank:9,  name:"DayTrader99",  avatar:"🐬", pl:750,   winRate:48, trades:55, badge:"⭐" },
  { rank:10, name:"MarketMaker",  avatar:"🐻", pl:520,   winRate:46, trades:30, badge:"⭐" },
];

function Leaderboard({ theme, isAr }) {
  const P = theme?.primary || '#6366f1';
  const [sort, setSort] = useState("pl");
  const sorted = [...LEADERBOARD].sort((a,b) => sort==="pl"?b.pl-a.pl:sort==="wr"?b.winRate-a.winRate:b.trades-a.trades);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontSize:14, fontWeight:800, color:"#fff", flex:1 }}>🏆 {isAr?"المتصدرون الأسبوعيون":"Weekly Leaderboard"}</div>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#fff", padding:"5px 10px", borderRadius:8, fontSize:11 }}>
          <option value="pl">{isAr?"الأرباح":"By P&L"}</option>
          <option value="wr">{isAr?"نسبة الفوز":"By Win Rate"}</option>
          <option value="tr">{isAr?"الصفقات":"By Trades"}</option>
        </select>
      </div>

      {/* Top 3 podium */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1fr", gap:10, alignItems:"flex-end" }}>
        {[sorted[1],sorted[0],sorted[2]].map((t,i) => t && (
          <div key={t.rank} style={{ textAlign:"center", padding:"14px 8px", background:i===1?"rgba(212,168,67,0.1)":"rgba(255,255,255,0.04)", border:`2px solid ${i===1?"rgba(212,168,67,0.4)":"rgba(255,255,255,0.08)"}`, borderRadius:14 }}>
            <div style={{ fontSize:i===1?28:22 }}>{t.badge}</div>
            <div style={{ fontSize:i===1?20:16, marginTop:4 }}>{t.avatar}</div>
            <div style={{ fontSize:10, fontWeight:700, color:"#fff", marginTop:4 }}>{t.name}</div>
            <div style={{ fontSize:i===1?18:14, fontWeight:900, color:"#22c55e" }}>+${t.pl}</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{t.winRate}% WR</div>
          </div>
        ))}
      </div>

      {/* Full table */}
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        {sorted.slice(3).map((t,i) => (
          <div key={t.rank} style={{ display:"grid", gridTemplateColumns:"28px 32px 1fr 70px 55px 60px", gap:8, alignItems:"center", padding:"8px 12px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:9 }}>
            <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textAlign:"center" }}>#{t.rank}</span>
            <span style={{ fontSize:16 }}>{t.avatar}</span>
            <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>{t.name}</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#22c55e" }}>+${t.pl}</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)" }}>{t.winRate}%</span>
            <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)" }}>{t.trades} {isAr?"صفقة":"trades"}</span>
          </div>
        ))}
      </div>

      {/* Prizes */}
      <div style={{ padding:"12px 14px", background:"rgba(212,168,67,0.06)", border:"1px solid rgba(212,168,67,0.2)", borderRadius:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#D4A843", marginBottom:8 }}>🎁 {isAr?"جوائز الأسبوع":"Weekly Prizes"}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, fontSize:11 }}>
          {[["🥇 1st","$500 + 3 months Pro","#D4A843"],["🥈 2nd","$200 + 1 month Pro","#9ca3af"],["🥉 3rd","$100 + 2 weeks Pro","#CD7F32"]].map(([rank,prize,c])=>(
            <div key={rank} style={{ textAlign:"center", padding:"8px" }}>
              <div style={{ fontWeight:800, color:c }}>{rank}</div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:10, marginTop:2 }}>{prize}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════ */
export default function TradingRoomTab({ theme, lang }) {
  const isAr = lang === "ar";
  const P = theme?.primary || '#6366f1';
  const [activeTab, setActiveTab] = useState("feed");

  const TABS = [
    { id:"feed",        label:"⚡ Live Feed",  labelAr:"⚡ مباشر" },
    { id:"room",        label:"💬 Room",       labelAr:"💬 الغرفة" },
    { id:"leaderboard", label:"🏆 Leaderboard",labelAr:"🏆 المتصدرون" },
  ];

  const card = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, backdropFilter:"blur(12px)" };

  return (
    <div style={{ fontFamily:isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif", direction:isAr?"rtl":"ltr", display:"flex", flexDirection:"column", gap:16 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div>
        <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>{isAr?"🌐 مجتمع المتداولين":"🌐 Traders Community"}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>{isAr?"تدفق مباشر • غرفة تداول • متصدرون":"Live feed · Trading room · Leaderboard"}</div>
      </div>

      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", padding:"4px", borderRadius:14, border:"1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{ flex:1, padding:"9px 0", borderRadius:10, border:"none", background:activeTab===t.id?`${P}20`:"transparent", color:activeTab===t.id?P:"rgba(255,255,255,0.4)", fontWeight:700, fontSize:11, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
            {isAr?t.labelAr:t.label}
          </button>
        ))}
      </div>

      <div style={card}>
        {activeTab === "feed"        && <LiveFeed    theme={theme} isAr={isAr} />}
        {activeTab === "room"        && <TradingRoom theme={theme} isAr={isAr} />}
        {activeTab === "leaderboard" && <Leaderboard theme={theme} isAr={isAr} />}
      </div>
    </div>
  );
}
