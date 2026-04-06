/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const Spark = ({ data, up, w = 80, h = 28 }) => {
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 0.001;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * (h - 4) + 2}`).join(" ");
  const col = up ? "#D4A843" : "#E05252";
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sg${up?"u":"d"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.35" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sg${up?"u":"d"})`} />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const TournamentTab = ({ theme, lang, user, prices }) => {
  const isAr = lang === 'ar';
  const C = {
    card: 'rgba(255,255,255,0.025)', border: `${theme.primary}18`,
    sub: 'rgba(238,232,218,0.45)', text: '#EEE8DA',
    green: '#4ADE80', red: '#E05252', gold: '#D4A843',
    purple: '#A78BFA', blue: '#60A5FA',
  };

  const [activeTab, setActiveTab] = React.useState('live');
  const [joined, setJoined] = React.useState({});
  const [myTrades, setMyTrades] = React.useState([]);
  const [tradeForm, setTradeForm] = React.useState({ pair:'EUR/USD', dir:'buy', lots:'0.1', tid:null });
  const [showTradeForm, setShowTradeForm] = React.useState(false);

  const now = Date.now();

  const TOURNAMENTS = [
    {
      id: 't1',
      name: { ar: 'بطولة الذهب الأسبوعية', en: 'Weekly Gold Championship' },
      prize: '$5,000',
      prizePool: 5000,
      fee: 0,
      currency: 'XAU/USD',
      startTime: now - 1000*3600*24*2,
      endTime: now + 1000*3600*24*5,
      participants: 847,
      maxParticipants: 1000,
      status: 'live',
      icon: '🥇',
      color: '#D4A843',
      badge: { ar: 'مجاني', en: 'FREE ENTRY' },
      rules: { ar: 'تداول XAU/USD فقط، الرصيد $10,000 افتراضي', en: 'Trade XAU/USD only, $10,000 virtual balance' },
    },
    {
      id: 't2',
      name: { ar: 'تحدي EUR/USD الكبير', en: 'EUR/USD Grand Challenge' },
      prize: '$2,500',
      prizePool: 2500,
      fee: 0,
      currency: 'EUR/USD',
      startTime: now - 1000*3600*12,
      endTime: now + 1000*3600*36,
      participants: 1243,
      maxParticipants: 2000,
      status: 'live',
      icon: '💶',
      color: '#60A5FA',
      badge: { ar: 'مشهور', en: 'POPULAR' },
      rules: { ar: 'تداول EUR/USD، الرصيد $50,000 افتراضي', en: 'Trade EUR/USD, $50,000 virtual balance' },
    },
    {
      id: 't3',
      name: { ar: 'بطولة المحترفين الشهرية', en: 'Monthly Pro Tournament' },
      prize: '$10,000',
      prizePool: 10000,
      fee: 0,
      currency: 'ALL',
      startTime: now + 1000*3600*24*3,
      endTime: now + 1000*3600*24*33,
      participants: 412,
      maxParticipants: 500,
      status: 'upcoming',
      icon: '👑',
      color: '#A78BFA',
      badge: { ar: 'قريباً', en: 'UPCOMING' },
      rules: { ar: 'جميع الأزواج، الرصيد $100,000 افتراضي', en: 'All pairs, $100,000 virtual balance' },
    },
    {
      id: 't4',
      name: { ar: 'بطولة الربح السريع', en: 'Rapid Profit Blitz' },
      prize: '$500',
      prizePool: 500,
      currency: 'MAJORS',
      startTime: now - 1000*3600*48,
      endTime: now - 1000*3600*2,
      participants: 389,
      maxParticipants: 400,
      status: 'ended',
      icon: '⚡',
      color: '#4ADE80',
      badge: { ar: 'منتهية', en: 'ENDED' },
      rules: { ar: 'أزواج رئيسية فقط، 48 ساعة', en: 'Major pairs only, 48 hours' },
    },
  ];

  const LEADERBOARD = [
    { rank:1, name:'Ahmed K.',    flag:'🇸🇦', profit: 4821.50, pct: 48.2, trades: 23, badge:'👑' },
    { rank:2, name:'Sara M.',     flag:'🇦🇪', profit: 3940.00, pct: 39.4, trades: 18, badge:'🥈' },
    { rank:3, name:'Omar H.',     flag:'🇪🇬', profit: 3215.75, pct: 32.2, trades: 31, badge:'🥉' },
    { rank:4, name:'Fatima A.',   flag:'🇰🇼', profit: 2891.25, pct: 28.9, trades: 14, badge:null },
    { rank:5, name:'Khalid R.',   flag:'🇶🇦', profit: 2634.00, pct: 26.3, trades: 27, badge:null },
    { rank:6, name:'Nour J.',     flag:'🇯🇴', profit: 2410.50, pct: 24.1, trades: 19, badge:null },
    { rank:7, name:'Hassan M.',   flag:'🇲🇦', profit: 2108.75, pct: 21.1, trades: 22, badge:null },
    { rank:8, name:'Layla S.',    flag:'🇧🇭', profit: 1945.00, pct: 19.5, trades: 16, badge:null },
    { rank:9, name:'Tariq B.',    flag:'🇴🇲', profit: 1720.25, pct: 17.2, trades: 28, badge:null },
    { rank:10,name:'Rania L.',   flag:'🇩🇿', profit: 1512.50, pct: 15.1, trades: 12, badge:null },
  ];

  // My position (simulated)
  const myRank = joined['t1'] ? 47 : null;
  const myProfit = joined['t1'] ? 342.50 : null;

  const formatTimeLeft = (endTime) => {
    const diff = endTime - now;
    if (diff <= 0) return isAr ? 'انتهت' : 'Ended';
    const d = Math.floor(diff / (1000*3600*24));
    const h = Math.floor((diff % (1000*3600*24)) / (1000*3600));
    const m = Math.floor((diff % (1000*3600)) / 60000);
    if (d > 0) return isAr ? `${d}ي ${h}س` : `${d}d ${h}h`;
    if (h > 0) return isAr ? `${h}س ${m}د` : `${h}h ${m}m`;
    return isAr ? `${m}د` : `${m}m`;
  };

  const formatTimeStart = (startTime) => {
    const diff = startTime - now;
    if (diff <= 0) return isAr ? 'بدأت' : 'Started';
    const d = Math.floor(diff / (1000*3600*24));
    const h = Math.floor((diff % (1000*3600*24)) / (1000*3600));
    if (d > 0) return isAr ? `تبدأ خلال ${d}ي` : `Starts in ${d}d`;
    return isAr ? `تبدأ خلال ${h}س` : `Starts in ${h}h`;
  };

  const liveTournaments = TOURNAMENTS.filter(t => t.status === 'live');
  const upcomingTournaments = TOURNAMENTS.filter(t => t.status === 'upcoming');
  const endedTournaments = TOURNAMENTS.filter(t => t.status === 'ended');

  const execTrade = (tid) => {
    const t = TOURNAMENTS.find(x => x.id === tid);
    if (!t) return;
    const price = prices.find(p => p.pair === tradeForm.pair)?.price || 1.0;
    const newTrade = {
      id: Date.now(),
      tid,
      pair: tradeForm.pair,
      dir: tradeForm.dir,
      lots: parseFloat(tradeForm.lots),
      entry: price,
      time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
      pl: 0,
      status: 'open',
    };
    setMyTrades(prev => [newTrade, ...prev]);
    setShowTradeForm(false);
  };

  const TournamentCard = ({ t }) => {
    const isJoined = joined[t.id];
    const progressPct = (t.participants / t.maxParticipants * 100).toFixed(0);
    return (
      <div style={{
        background: `linear-gradient(145deg,${t.color}06,rgba(255,255,255,0.015))`,
        border: `2px solid ${isJoined ? t.color+'50' : t.color+'18'}`,
        borderRadius: 20, padding: 22, position: 'relative', overflow: 'hidden',
        transition: 'all 0.2s',
        boxShadow: isJoined ? `0 0 30px ${t.color}12` : 'none',
      }}>
        {/* Glow line */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${t.color}60,transparent)` }} />

        {/* Badge */}
        <div style={{ position:'absolute', top:14, [isAr?'left':'right']:14, padding:'3px 10px', background:`${t.color}18`, border:`1px solid ${t.color}30`, borderRadius:20, fontSize:9, fontWeight:800, color:t.color }}>
          {t.badge?.[lang] || t.badge?.en}
        </div>

        {isJoined && (
          <div style={{ position:'absolute', top:14, [isAr?'right':'left']:14, padding:'3px 10px', background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.3)', borderRadius:20, fontSize:9, fontWeight:800, color:C.green }}>
            ✓ {isAr?'مشارك':'Joined'}
          </div>
        )}

        <div style={{ marginBottom:16, marginTop: 8 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>{t.icon}</div>
          <div style={{ fontSize:15, fontWeight:900, marginBottom:4 }}>{t.name[lang] || t.name.en}</div>
          <div style={{ fontSize:10, color:C.sub, lineHeight:1.6 }}>{t.rules[lang] || t.rules.en}</div>
        </div>

        {/* Prize */}
        <div style={{ background:`${t.color}10`, border:`1px solid ${t.color}20`, borderRadius:12, padding:'12px 16px', marginBottom:14, textAlign:'center' }}>
          <div style={{ fontSize:9, color:t.color, fontWeight:700, letterSpacing:2, marginBottom:4 }}>{isAr?'جائزة المركز الأول':'FIRST PRIZE'}</div>
          <div style={{ fontSize:28, fontWeight:900, color:t.color }}>{t.prize}</div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:900 }}>{t.participants.toLocaleString()}</div>
            <div style={{ fontSize:8, color:C.sub, marginTop:2 }}>{isAr?'مشارك':'Participants'}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
            <div style={{ fontSize:14, fontWeight:900, color: t.status==='live' ? C.green : t.status==='upcoming' ? C.blue : C.sub }}>
              {t.status === 'live' ? formatTimeLeft(t.endTime) :
               t.status === 'upcoming' ? formatTimeStart(t.startTime) :
               (isAr?'انتهت':'Ended')}
            </div>
            <div style={{ fontSize:8, color:C.sub, marginTop:2 }}>{t.status==='live'?(isAr?'متبقي':'Remaining'):t.status==='upcoming'?(isAr?'موعد البدء':'Start Time'):(isAr?'الحالة':'Status')}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:C.sub, marginBottom:4 }}>
            <span>{isAr?'الأماكن المتاحة':'Available spots'}</span>
            <span>{(t.maxParticipants - t.participants).toLocaleString()} {isAr?'متبقي':'left'}</span>
          </div>
          <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background:`linear-gradient(90deg,${t.color}80,${t.color})`, borderRadius:3, transition:'width 0.5s ease' }} />
          </div>
        </div>

        {/* Action button */}
        {t.status === 'live' && (
          <button
            onClick={() => {
              if (!isJoined) { setJoined(p => ({...p, [t.id]: true})); }
              else { setTradeForm(p => ({...p, tid: t.id})); setShowTradeForm(true); }
            }}
            style={{
              width:'100%', padding:12,
              background: isJoined ? `linear-gradient(135deg,${C.green},${C.green}BB)` : `linear-gradient(135deg,${t.color},${t.color}BB)`,
              border:'none', borderRadius:12, color:'#000', fontWeight:900, fontSize:12,
              cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s',
              boxShadow: `0 4px 16px ${t.color}25`,
            }}>
            {isJoined ? (isAr?'🎯 تداول الآن':'🎯 Trade Now') : (isAr?'🚀 انضم مجاناً':'🚀 Join Free')}
          </button>
        )}
        {t.status === 'upcoming' && (
          <button
            onClick={() => setJoined(p => ({...p, [t.id]: !p[t.id]}))}
            style={{
              width:'100%', padding:12,
              background: isJoined ? 'rgba(74,222,128,0.1)' : `linear-gradient(135deg,${t.color},${t.color}BB)`,
              border: isJoined ? '1px solid rgba(74,222,128,0.3)' : 'none',
              borderRadius:12, color: isJoined ? C.green : '#000', fontWeight:900, fontSize:12,
              cursor:'pointer', fontFamily:'inherit',
            }}>
            {isJoined ? (isAr?'✓ مسجل — إلغاء':'✓ Registered — Cancel') : (isAr?'🔔 سجّل مسبقاً':'🔔 Pre-Register')}
          </button>
        )}
        {t.status === 'ended' && (
          <button disabled style={{ width:'100%', padding:12, background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:12, color:C.sub, fontWeight:700, fontSize:12, cursor:'default', fontFamily:'inherit' }}>
            {isAr?'عرض النتائج':'View Results'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ animation:'fadeUp 0.3s ease', maxWidth:1100, margin:'0 auto' }}>

      {/* Trade Form Modal */}
      {showTradeForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(2,4,8,0.92)', backdropFilter:'blur(16px)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => e.target===e.currentTarget && setShowTradeForm(false)}>
          <div style={{ background:'#0A0E1A', border:`1px solid ${theme.primary}25`, borderRadius:20, padding:28, maxWidth:400, width:'100%', animation:'fadeUp 0.2s ease' }}>
            <div style={{ fontSize:15, fontWeight:900, marginBottom:20 }}>🎯 {isAr?'تنفيذ صفقة في البطولة':'Execute Tournament Trade'}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { k:'pair', lbl:isAr?'الزوج':'Pair', type:'select', opts:['EUR/USD','GBP/USD','USD/JPY','XAU/USD','AUD/USD'] },
                { k:'lots', lbl:isAr?'حجم اللوت':'Lot Size', type:'number' },
              ].map(f => (
                <div key={f.k}>
                  <div style={{ fontSize:9, color:C.sub, marginBottom:4, fontWeight:700 }}>{f.lbl}</div>
                  {f.type === 'select' ? (
                    <select value={tradeForm[f.k]} onChange={e=>setTradeForm(p=>({...p,[f.k]:e.target.value}))}
                      style={{ width:'100%', background:'#0D1117', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:12, fontFamily:'inherit', outline:'none' }}>
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type="number" value={tradeForm[f.k]} onChange={e=>setTradeForm(p=>({...p,[f.k]:e.target.value}))} step="0.01" min="0.01"
                      style={{ width:'100%', background:'rgba(255,255,255,0.04)', border:`1px solid ${C.border}`, borderRadius:8, padding:'9px 12px', color:C.text, fontSize:12, fontFamily:'inherit', outline:'none', boxSizing:'border-box' }} />
                  )}
                </div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:4 }}>
                {['buy','sell'].map(d => (
                  <button key={d} onClick={()=>setTradeForm(p=>({...p,dir:d}))} style={{
                    padding:12, border:`2px solid ${tradeForm.dir===d?(d==='buy'?C.green:C.red):C.border}`,
                    borderRadius:10, background: tradeForm.dir===d ? (d==='buy'?'rgba(74,222,128,0.12)':'rgba(224,82,82,0.12)') : 'transparent',
                    color: tradeForm.dir===d ? (d==='buy'?C.green:C.red) : C.sub,
                    fontWeight:800, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                  }}>
                    {d==='buy' ? (isAr?'📈 شراء':'📈 BUY') : (isAr?'📉 بيع':'📉 SELL')}
                  </button>
                ))}
              </div>
              <button onClick={()=>execTrade(tradeForm.tid)} style={{ marginTop:4, padding:13, background:`linear-gradient(135deg,${theme.primary},${theme.primaryD||theme.primary})`, border:'none', borderRadius:12, color:'#000', fontWeight:900, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                ✓ {isAr?'تنفيذ الصفقة':'Execute Trade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:900, marginBottom:4 }}>🏆 {isAr?'بطولات التداول':'Trading Tournaments'}</div>
        <div style={{ fontSize:11, color:C.sub }}>{isAr?'تنافس على جوائز حقيقية في بطولات التداول الافتراضية':'Compete for real prizes in virtual trading tournaments'}</div>
      </div>

      {/* My Stats Banner (if joined any) */}
      {Object.keys(joined).length > 0 && (
        <div style={{ background:`linear-gradient(135deg,${theme.primary}08,rgba(255,255,255,0.02))`, border:`1px solid ${theme.primary}20`, borderRadius:16, padding:'16px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
          <div style={{ fontSize:20 }}>🎖️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:800, marginBottom:2 }}>{isAr?'أنت مشارك في البطولة!':'You are in the tournament!'}</div>
            <div style={{ fontSize:10, color:C.sub }}>{isAr?`مرتبتك الحالية: #${myRank || '—'} | ربحك: $${myProfit ? myProfit.toFixed(2) : '0.00'}`:`Your rank: #${myRank || '—'} | Profit: $${myProfit ? myProfit.toFixed(2) : '0.00'}`}</div>
          </div>
          <button onClick={()=>{ setTradeForm(p=>({...p, tid:Object.keys(joined)[0]})); setShowTradeForm(true); }} style={{ padding:'8px 18px', background:`${theme.primary}18`, border:`1px solid ${theme.primary}30`, borderRadius:10, color:theme.primary, fontSize:11, fontWeight:800, cursor:'pointer', fontFamily:'inherit' }}>
            {isAr?'تداول الآن →':'Trade Now →'}
          </button>
        </div>
      )}

      {/* Tab navigation */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {[
          { k:'live', l:isAr?`🔴 مباشر (${liveTournaments.length})`:`🔴 Live (${liveTournaments.length})` },
          { k:'upcoming', l:isAr?`🔜 قادمة (${upcomingTournaments.length})`:`🔜 Upcoming (${upcomingTournaments.length})` },
          { k:'leaderboard', l:isAr?'🏅 المتصدرون':'🏅 Leaderboard' },
          { k:'mytrades', l:isAr?`📊 صفقاتي (${myTrades.length})`:`📊 My Trades (${myTrades.length})` },
          { k:'ended', l:isAr?'📁 منتهية':'📁 Ended' },
        ].map(t => (
          <button key={t.k} onClick={()=>setActiveTab(t.k)} style={{
            padding:'8px 16px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            border:`1px solid ${activeTab===t.k ? theme.primary : C.border}`,
            background: activeTab===t.k ? `${theme.primary}18` : 'transparent',
            color: activeTab===t.k ? theme.primary : C.sub,
          }}>{t.l}</button>
        ))}
      </div>

      {/* Live Tournaments */}
      {activeTab === 'live' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {liveTournaments.map(t => <TournamentCard key={t.id} t={t} />)}
          {liveTournaments.length === 0 && (
            <div style={{ gridColumn:'1/-1', textAlign:'center', padding:48, background:C.card, border:`1px solid ${C.border}`, borderRadius:16 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🏆</div>
              <div style={{ color:C.sub, fontSize:13 }}>{isAr?'لا توجد بطولات مباشرة حالياً':'No live tournaments at the moment'}</div>
            </div>
          )}
        </div>
      )}

      {/* Upcoming */}
      {activeTab === 'upcoming' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {upcomingTournaments.map(t => <TournamentCard key={t.id} t={t} />)}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div>
          <div style={{ background:`${C.gold}08`, border:`1px solid ${C.gold}20`, borderRadius:16, overflow:'hidden', marginBottom:16 }}>
            {/* Header */}
            <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, display:'grid', gridTemplateColumns:'60px 1fr 120px 100px 80px', gap:8, fontSize:9, fontWeight:800, color:C.sub, letterSpacing:1 }}>
              <span>{isAr?'المرتبة':'RANK'}</span>
              <span>{isAr?'المتداول':'TRADER'}</span>
              <span style={{ textAlign:'center' }}>{isAr?'الربح':'PROFIT'}</span>
              <span style={{ textAlign:'center' }}>{isAr?'الصفقات':'TRADES'}</span>
              <span style={{ textAlign:'right' }}>{isAr?'%':'%'}</span>
            </div>
            {LEADERBOARD.map((p, i) => (
              <div key={p.rank} style={{ padding:'12px 20px', borderBottom:i<9?`1px solid rgba(255,255,255,0.03)`:'none', display:'grid', gridTemplateColumns:'60px 1fr 120px 100px 80px', gap:8, alignItems:'center', background:i===0?`${C.gold}05`:i<3?`rgba(255,255,255,0.012)`:'transparent', transition:'background 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                onMouseLeave={e=>e.currentTarget.style.background=i===0?`${C.gold}05`:i<3?`rgba(255,255,255,0.012)`:'transparent'}>
                <div style={{ textAlign:'center' }}>
                  {p.badge ? <span style={{ fontSize:18 }}>{p.badge}</span> : <span style={{ fontSize:13, fontWeight:800, color:C.sub }}>#{p.rank}</span>}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:16 }}>{p.flag}</span>
                  <span style={{ fontSize:12, fontWeight:700 }}>{p.name}</span>
                </div>
                <div style={{ textAlign:'center', fontSize:13, fontWeight:900, color:C.green }}>+${p.profit.toLocaleString()}</div>
                <div style={{ textAlign:'center', fontSize:11, color:C.sub }}>{p.trades}</div>
                <div style={{ textAlign:'right', fontSize:11, fontWeight:800, color:p.pct>=20?C.gold:C.green }}>+{p.pct}%</div>
              </div>
            ))}
          </div>
          {myRank && (
            <div style={{ background:`${theme.primary}08`, border:`1px solid ${theme.primary}25`, borderRadius:12, padding:'12px 20px', display:'grid', gridTemplateColumns:'60px 1fr 120px 100px 80px', gap:8, alignItems:'center' }}>
              <div style={{ textAlign:'center', fontSize:12, fontWeight:800, color:theme.primary }}>#{myRank}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:16 }}>👤</span>
                <span style={{ fontSize:12, fontWeight:700, color:theme.primary }}>{user?.name || 'You'} ★</span>
              </div>
              <div style={{ textAlign:'center', fontSize:13, fontWeight:900, color:C.green }}>+${myProfit?.toFixed(2)}</div>
              <div style={{ textAlign:'center', fontSize:11, color:C.sub }}>{myTrades.length}</div>
              <div style={{ textAlign:'right', fontSize:11, fontWeight:800, color:C.green }}>+{((myProfit||0)/10000*100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      )}

      {/* My Trades */}
      {activeTab === 'mytrades' && (
        <div>
          {myTrades.length === 0 ? (
            <div style={{ textAlign:'center', padding:48, background:C.card, border:`1px solid ${C.border}`, borderRadius:16 }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:13, color:C.sub, marginBottom:16 }}>{isAr?'لم تفتح أي صفقة في البطولة بعد':'No tournament trades yet'}</div>
              <button onClick={()=>{setTradeForm(p=>({...p,tid:Object.keys(joined)[0]||'t1'}));setShowTradeForm(true);}} disabled={Object.keys(joined).length===0}
                style={{ padding:'10px 24px', background:Object.keys(joined).length>0?`linear-gradient(135deg,${theme.primary},${theme.primaryD||theme.primary})`:'rgba(255,255,255,0.05)', border:'none', borderRadius:10, color:Object.keys(joined).length>0?'#000':C.sub, fontWeight:800, fontSize:12, cursor:Object.keys(joined).length>0?'pointer':'default', fontFamily:'inherit' }}>
                {Object.keys(joined).length>0?(isAr?'تداول الآن':'Trade Now'):(isAr?'انضم لبطولة أولاً':'Join a tournament first')}
              </button>
            </div>
          ) : (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, fontSize:12, fontWeight:800 }}>
                {isAr?`صفقاتي في البطولة (${myTrades.length})`:`My Tournament Trades (${myTrades.length})`}
              </div>
              {myTrades.map((tr,i) => (
                <div key={tr.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 20px', borderBottom:i<myTrades.length-1?`1px solid rgba(255,255,255,0.03)`:'none' }}>
                  <div style={{ padding:'3px 10px', borderRadius:20, fontSize:9, fontWeight:800, background:tr.dir==='buy'?'rgba(74,222,128,0.1)':'rgba(224,82,82,0.1)', color:tr.dir==='buy'?C.green:C.red }}>
                    {tr.dir==='buy'?(isAr?'شراء':'BUY'):(isAr?'بيع':'SELL')}
                  </div>
                  <span style={{ fontSize:13, fontWeight:700 }}>{tr.pair}</span>
                  <span style={{ fontSize:10, color:C.sub }}>{tr.lots} lots @ {tr.entry}</span>
                  <span style={{ fontSize:10, color:C.sub, marginInlineStart:'auto' }}>{tr.time}</span>
                  <span style={{ fontSize:12, fontWeight:800, color:C.sub }}>{isAr?'مفتوحة':'Open'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ended */}
      {activeTab === 'ended' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
          {endedTournaments.map(t => <TournamentCard key={t.id} t={t} />)}
        </div>
      )}

      {/* Prize distribution */}
      <div style={{ marginTop:24, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:20 }}>
        <div style={{ fontSize:13, fontWeight:800, marginBottom:16 }}>🎁 {isAr?'توزيع الجوائز':'Prize Distribution'}</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {[
            { rank:'#1', pct:'40%', icon:'👑', color:C.gold },
            { rank:'#2', pct:'25%', icon:'🥈', color:'#C0C0C0' },
            { rank:'#3', pct:'15%', icon:'🥉', color:'#CD7F32' },
            { rank:'#4-5', pct:'10%', icon:'🎖️', color:C.blue },
            { rank:'#6-10', pct:'10%', icon:'🏅', color:C.sub },
          ].map((p,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:12, padding:'14px 10px', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{p.icon}</div>
              <div style={{ fontSize:11, fontWeight:800, color:p.color }}>{p.rank}</div>
              <div style={{ fontSize:16, fontWeight:900, marginTop:4 }}>{p.pct}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentTab;
