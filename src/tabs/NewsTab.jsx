/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import { fetchLiveNews, classifySentiment, analyzeArticle } from "../utils/newsService.js";
import { proxyAI } from "../utils/ai.js";

const SEN_COLOR = { bullish:"#4ADE80", bearish:"#E05252", neutral:"#F59E0B" };

/* ── Skeleton loader ── */
const NewsSkeleton = () => (
  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
    {Array.from({length:5}).map((_,i)=>(
      <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"18px", animation:`pulse 1.5s ease ${i*0.1}s infinite alternate` }}>
        <div style={{ height:14, width:"70%", background:"rgba(255,255,255,0.06)", borderRadius:4, marginBottom:10 }}/>
        <div style={{ height:10, width:"90%", background:"rgba(255,255,255,0.04)", borderRadius:4, marginBottom:6 }}/>
        <div style={{ height:10, width:"60%", background:"rgba(255,255,255,0.04)", borderRadius:4 }}/>
      </div>
    ))}
    <style>{`@keyframes pulse{from{opacity:0.6}to{opacity:1}}`}</style>
  </div>
);

/* ── Article card ── */
const ArticleCard = ({ article, theme, lang, idx }) => {
  const [expanded, setExpanded]   = useState(false);
  const [aiText,   setAiText]     = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const isAr = lang === "ar";
  const sc   = SEN_COLOR[article.sentiment];

  const runAI = useCallback(async (e) => {
    e.stopPropagation();
    if (aiText) { setExpanded(true); return; }
    setAiLoading(true);
    setExpanded(true);
    const text = await analyzeArticle(article, lang, proxyAI);
    setAiText(text || (isAr ? "تعذّر التحليل" : "Analysis unavailable"));
    setAiLoading(false);
  }, [article, lang, aiText]);

  const minsAgo = article.mins < 60
    ? `${article.mins}${isAr ? "د" : "m"}`
    : `${Math.floor(article.mins/60)}${isAr ? "س" : "h"}`;

  return (
    <div style={{
      background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)",
      borderRadius:16, overflow:"hidden", cursor:"pointer", transition:"all 0.25s",
      animation:`fadeUp 0.3s ease ${idx*0.06}s both`,
    }}
    onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}
    onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"}
    onClick={()=>setExpanded(v=>!v)}>
      <div style={{ height:3, background:`linear-gradient(90deg,${sc},${sc}20,transparent)` }}/>
      <div style={{ padding:"14px 16px" }}>
        <div style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, lineHeight:1.5, marginBottom:6, color:"rgba(238,232,218,0.9)" }}>
              {article.title}
            </div>
            {expanded && (
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", lineHeight:1.7, marginBottom:8 }}>
                {article.summary}
              </div>
            )}
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
            <span style={{ fontSize:8, fontWeight:700, padding:"3px 8px", borderRadius:5,
              background:`${sc}14`, border:`1px solid ${sc}35`, color:sc, whiteSpace:"nowrap" }}>
              {isAr
                ? article.sentiment === "bullish" ? "صعودي" : article.sentiment === "bearish" ? "هبوطي" : "محايد"
                : article.sentiment.toUpperCase()}
            </span>
            <span style={{ fontSize:8, color:"rgba(255,255,255,0.3)" }}>{article.source}</span>
            <span style={{ fontSize:8, color:"rgba(255,255,255,0.2)", fontFamily:"'DM Mono',monospace" }}>{minsAgo}</span>
          </div>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
          <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
            {article.pairs?.map(p => (
              <span key={p} style={{ fontSize:8, padding:"2px 7px", borderRadius:4,
                background:`${theme.primary}10`, border:`1px solid ${theme.primary}20`,
                color:theme.primary, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{p}</span>
            ))}
            <span style={{ fontSize:8, padding:"2px 7px", borderRadius:4,
              background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)" }}>
              {article.cat}
            </span>
          </div>
          <button onClick={runAI} disabled={aiLoading}
            style={{ fontSize:9, padding:"4px 10px", background:`${theme.primary}10`,
              border:`1px solid ${theme.primary}20`, borderRadius:7, color:theme.primary,
              cursor:"pointer", fontWeight:700, whiteSpace:"nowrap" }}>
            {aiLoading ? "⏳" : "🤖 AI"}
          </button>
        </div>

        {/* AI Analysis panel */}
        {expanded && aiText && (
          <div style={{ marginTop:10, padding:"10px 12px", background:`${theme.primary}08`,
            border:`1px solid ${theme.primary}18`, borderRadius:10 }}>
            <div style={{ fontSize:8, color:`${theme.primary}60`, fontWeight:700, marginBottom:4, letterSpacing:"1px" }}>
              🤖 AI ANALYSIS
            </div>
            <div style={{ fontSize:11, color:"rgba(238,232,218,0.75)", lineHeight:1.7 }}>{aiText}</div>
          </div>
        )}

        {/* External link */}
        {expanded && article.link && article.link !== "#" && (
          <a href={article.link} target="_blank" rel="noopener noreferrer"
            onClick={e=>e.stopPropagation()}
            style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:8,
              fontSize:9, color:`${theme.primary}80`, textDecoration:"none" }}>
            {isAr ? "اقرأ المزيد" : "Read more"} →
          </a>
        )}
      </div>
    </div>
  );
};

/* ── Stats mini panel ── */
const NewsStats = ({ articles, theme, lang, isAr }) => {
  const bull    = articles.filter(a => a.sentiment === "bullish").length;
  const bear    = articles.filter(a => a.sentiment === "bearish").length;
  const neutral = articles.filter(a => a.sentiment === "neutral").length;
  const total   = articles.length || 1;
  return (
    <div style={{ background:`${theme.primary}05`, border:`1px solid ${theme.primary}12`, borderRadius:14, padding:"14px 16px" }}>
      <div style={{ fontSize:8, fontWeight:700, letterSpacing:"2px", color:`${theme.primary}50`, marginBottom:12 }}>
        📊 {isAr ? "مؤشر المشاعر" : "SENTIMENT METER"}
      </div>
      {[
        { label: isAr?"صعودي":"Bullish", val:bull,    pct:Math.round(bull/total*100),    color:"#4ADE80" },
        { label: isAr?"هبوطي":"Bearish", val:bear,    pct:Math.round(bear/total*100),    color:"#E05252" },
        { label: isAr?"محايد":"Neutral", val:neutral, pct:Math.round(neutral/total*100), color:"#F59E0B" },
      ].map(s => (
        <div key={s.label} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:9, color:s.color, fontWeight:700 }}>{s.label}</span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", fontFamily:"'DM Mono',monospace" }}>{s.val} ({s.pct}%)</span>
          </div>
          <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${s.pct}%`, background:s.color, borderRadius:2, transition:"width 1s ease" }}/>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── Main NewsTab ── */
const NewsTab = ({ theme, lang, prices }) => {
  const isAr = lang === "ar";
  const [articles,    setArticles]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState("all");
  const [catFilter,   setCatFilter]   = useState("all");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [error,       setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiveNews();
      if (data.length === 0) {
        setError(isAr ? "تعذّر جلب الأخبار. حاول لاحقاً." : "Could not fetch news. Try again later.");
      } else {
        setArticles(data);
        setLastRefresh(new Date());
      }
    } catch {
      setError(isAr ? "خطأ في الاتصال" : "Connection error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const filtered = articles.filter(a =>
    (filter    === "all" || a.sentiment === filter) &&
    (catFilter === "all" || a.cat       === catFilter)
  );

  const C = {
    border: "rgba(255,255,255,0.07)",
    sub:    "rgba(238,232,218,0.42)",
  };

  const FILTERS = [
    { id:"all",     labelAr:"الكل",    labelEn:"All"     },
    { id:"bullish", labelAr:"صعودي",   labelEn:"Bullish", color:"#4ADE80" },
    { id:"bearish", labelAr:"هبوطي",   labelEn:"Bearish", color:"#E05252" },
    { id:"neutral", labelAr:"محايد",   labelEn:"Neutral", color:"#F59E0B" },
  ];
  const CATS = [
    { id:"all",    labelAr:"الكل",      labelEn:"All"    },
    { id:"forex",  labelAr:"فوركس",     labelEn:"Forex"  },
    { id:"crypto", labelAr:"كريبتو",    labelEn:"Crypto" },
    { id:"stocks", labelAr:"أسهم",      labelEn:"Stocks" },
  ];

  return (
    <div style={{ animation:"fadeUp 0.3s ease" }}>

      {/* Header */}
      <div style={{ marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:10 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:800, marginBottom:4 }}>
            📰 {isAr ? "الأخبار الحية" : "Live Market News"}
          </div>
          <div style={{ fontSize:9, color:`${theme.primary}50`, letterSpacing:"2px", fontWeight:700 }}>
            {lastRefresh
              ? `${isAr?"آخر تحديث:":"Updated:"} ${lastRefresh.toLocaleTimeString()}`
              : (isAr ? "جاري التحميل..." : "Loading...")}
          </div>
        </div>
        <button onClick={load} disabled={loading}
          style={{ padding:"8px 16px", background:`${theme.primary}12`, border:`1px solid ${theme.primary}25`,
            borderRadius:10, color:theme.primary, fontSize:10, fontWeight:700,
            cursor:loading?"not-allowed":"pointer", transition:"all 0.2s" }}>
          {loading ? "⏳" : `🔄 ${isAr?"تحديث":"Refresh"}`}
        </button>
      </div>

      {/* Filters row */}
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
        {FILTERS.map(f => {
          const col = f.color || theme.primary;
          return (
            <button key={f.id} onClick={()=>setFilter(f.id)}
              style={{ padding:"6px 12px", borderRadius:8, fontSize:9, fontWeight:700, cursor:"pointer",
                border:`1px solid ${filter===f.id?`${col}50`:"rgba(255,255,255,0.08)"}`,
                background: filter===f.id?`${col}12`:"rgba(255,255,255,0.02)",
                color: filter===f.id?col:"rgba(255,255,255,0.35)", transition:"all 0.15s" }}>
              {isAr ? f.labelAr : f.labelEn}
            </button>
          );
        })}
        <div style={{ width:1, background:"rgba(255,255,255,0.1)", margin:"0 4px" }}/>
        {CATS.map(c => (
          <button key={c.id} onClick={()=>setCatFilter(c.id)}
            style={{ padding:"6px 12px", borderRadius:8, fontSize:9, fontWeight:700, cursor:"pointer",
              border:`1px solid ${catFilter===c.id?`${theme.primary}40`:"rgba(255,255,255,0.06)"}`,
              background: catFilter===c.id?`${theme.primary}10`:"transparent",
              color: catFilter===c.id?theme.primary:"rgba(255,255,255,0.3)", transition:"all 0.15s" }}>
            {isAr ? c.labelAr : c.labelEn}
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16, alignItems:"start" }} className="news-grid">

        {/* LEFT — Articles */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {loading ? (
            <NewsSkeleton />
          ) : error ? (
            <div style={{ padding:"48px 24px", textAlign:"center" }}>
              <div style={{ fontSize:42, marginBottom:12, opacity:0.4 }}>📡</div>
              <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>{error}</div>
              <button onClick={load} style={{ padding:"10px 20px", background:`${theme.primary}15`,
                border:`1px solid ${theme.primary}30`, borderRadius:10, color:theme.primary,
                fontSize:11, fontWeight:700, cursor:"pointer" }}>
                {isAr ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:"36px 24px", textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:12 }}>
              {isAr ? "لا توجد أخبار لهذا الفلتر" : "No news for this filter"}
            </div>
          ) : (
            filtered.map((article, i) => (
              <ArticleCard key={article.id} article={article} theme={theme} lang={lang} idx={i} />
            ))
          )}
        </div>

        {/* RIGHT — Sidebar */}
        <div style={{ position:"sticky", top:160, display:"flex", flexDirection:"column", gap:14 }}>

          {/* Sentiment stats */}
          {!loading && articles.length > 0 && (
            <NewsStats articles={articles} theme={theme} lang={lang} isAr={isAr} />
          )}

          {/* Live prices mini */}
          <div style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontSize:8, fontWeight:700, letterSpacing:"2px", color:`${theme.primary}50`, marginBottom:12 }}>
              ⚡ {isAr ? "أسعار حية" : "LIVE PRICES"}
            </div>
            {prices.slice(0, 8).map(p => {
              const up = p.pct >= 0;
              return (
                <div key={p.pair} style={{ display:"flex", justifyContent:"space-between",
                  padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize:10, color:"rgba(238,232,218,0.5)", fontFamily:"'DM Mono',monospace" }}>{p.pair}</span>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:10, fontWeight:700, color:up?"#4ADE80":"#E05252", fontFamily:"'DM Mono',monospace" }}>
                      {(p.price||0).toFixed(p.price>100?2:p.price>10?3:5)}
                    </span>
                    <span style={{ fontSize:8, color:up?"#4ADE80":"#E05252" }}>
                      {up?"+":""}{(p.pct||0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Disclaimer */}
          <div style={{ padding:"10px 12px", background:"rgba(255,255,255,0.015)",
            border:"1px solid rgba(255,255,255,0.05)", borderRadius:10 }}>
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", lineHeight:1.7 }}>
              {isAr
                ? "⚠️ الأخبار للأغراض المعلوماتية فقط. ليست نصيحة مالية."
                : "⚠️ News is for informational purposes only. Not financial advice."}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){.news-grid{grid-template-columns:1fr !important;}}
      `}</style>
    </div>
  );
};

export default NewsTab;
