/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { proxyAI } from '../utils/ai';

const TRADERS = [
  { id:1, name:'AlphaStrike',  avatar:'AS', win:73, roi:142.5, aum:2100000, followers:4320, trades:1841, drawdown:8.2,  risk:2, since:'2021', pairs:['EUR/USD','XAU/USD','BTC/USD'], color:'#D4A843', verified:true,  monthlyRoi:[3.2,4.1,5.8,3.9,6.1,4.8,7.2,5.3,4.6,8.1,6.5,7.4] },
  { id:2, name:'FxSensei',     avatar:'FS', win:68, roi:98.3,  aum:870000,  followers:2110, trades:3204, drawdown:11.4, risk:3, since:'2020', pairs:['USD/JPY','EUR/JPY','GBP/USD'], color:'#6366f1', verified:true,  monthlyRoi:[2.1,3.8,2.9,4.2,3.1,5.6,4.0,6.2,3.7,4.9,5.1,4.8] },
  { id:3, name:'QuantumEdge',  avatar:'QE', win:81, roi:204.0, aum:5200000, followers:8900, trades:954,  drawdown:5.1,  risk:1, since:'2022', pairs:['BTC/USD','ETH/USD'],            color:'#10b981', verified:true,  monthlyRoi:[8.2,7.4,9.1,6.8,10.2,8.5,9.8,11.2,7.6,10.5,9.1,8.7] },
  { id:4, name:'PipHunter',    avatar:'PH', win:62, roi:65.8,  aum:430000,  followers:980,  trades:5621, drawdown:16.0, risk:4, since:'2019', pairs:['GBP/USD','AUD/USD','NZD/USD'], color:'#ef4444', verified:false, monthlyRoi:[1.4,2.3,3.1,1.8,2.7,3.5,2.1,4.2,1.9,3.3,2.8,2.4] },
  { id:5, name:'GoldMaster',   avatar:'GM', win:76, roi:118.7, aum:1340000, followers:3200, trades:2187, drawdown:9.7,  risk:2, since:'2021', pairs:['XAU/USD','XAG/USD'],           color:'#f59e0b', verified:true,  monthlyRoi:[4.1,5.2,4.8,6.3,5.1,7.2,5.8,6.9,5.4,7.8,6.2,5.9] },
  { id:6, name:'BotAlpha9',    avatar:'B9', win:70, roi:155.3, aum:3100000, followers:6540, trades:12400,drawdown:6.3,  risk:2, since:'2022', pairs:['Multiple'],                   color:'#8b5cf6', verified:true,  monthlyRoi:[5.8,6.2,7.1,5.9,6.8,7.4,6.1,7.9,6.5,8.2,7.1,6.7] },
  { id:7, name:'SwingKing',    avatar:'SK', win:65, roi:78.2,  aum:620000,  followers:1450, trades:428,  drawdown:13.2, risk:3, since:'2020', pairs:['EUR/USD','GBP/JPY'],           color:'#06b6d4', verified:false, monthlyRoi:[2.8,3.4,3.9,2.6,4.1,3.7,3.2,4.8,3.5,4.2,3.8,3.1] },
  { id:8, name:'SafeHaven',    avatar:'SH', win:78, roi:52.4,  aum:780000,  followers:2180, trades:612,  drawdown:3.8,  risk:1, since:'2021', pairs:['USD/CHF','XAU/USD'],           color:'#84cc16', verified:true,  monthlyRoi:[1.8,2.1,2.4,2.0,2.7,2.3,2.9,2.5,2.2,3.1,2.6,2.8] },
];

const MY_COPIES = [
  { traderId:1, amount:2000, since:'2024-01-05', pnl:142.8,  pnlPct:7.14,  status:'active' },
  { traderId:3, amount:5000, since:'2023-12-01', pnl:820.5,  pnlPct:16.41, status:'active' },
  { traderId:6, amount:1500, since:'2024-01-15', pnl:-38.2,  pnlPct:-2.55, status:'paused' },
];

function Sparkline({ data, color, width=80, height=32 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const areaD = `M0,${height} L${pts.split(' ').map(p => p).join(' L')} L${width},${height} Z`;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export default function CopyTradingTab({ theme, lang }) {
  const isAr = lang === 'ar';
  const font = isAr ? "'Cairo','Tajawal',sans-serif" : "'Inter',system-ui,sans-serif";

  const [activeTab, setActiveTab] = useState('discover');
  const [sortBy, setSortBy] = useState('roi');
  const [filterRisk, setFilterRisk] = useState(0);
  const [copyModal, setCopyModal] = useState(null);
  const [copyAmount, setCopyAmount] = useState('');
  const [copyStep, setCopyStep] = useState(1);
  const [aiAnalysis, setAiAnalysis] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [livePnl, setLivePnl] = useState(MY_COPIES.map(c => ({ traderId: c.traderId, pnl: c.pnl })));
  const [expandedTrader, setExpandedTrader] = useState(null);

  const T = {
    en: {
      discover:'Discover', myCopies:'My Copies', leaderboard:'Leaderboard',
      winRate:'Win Rate', roi:'ROI', aum:'AUM', followers:'Followers',
      trades:'Trades', drawdown:'Max DD', risk:'Risk',
      copyNow:'Copy Now', analysis:'AI Analysis', since:'Since',
      sortBy:'Sort by', filterRisk:'Risk Level', all:'All',
      amount:'Copy Amount (USDT)', presets:'Quick Select',
      step1:'Setup Copy', step2:'Confirm', success:'Copy trading activated!',
      stopLoss:'Stop Loss %', takeProfit:'Take Profit %',
      pause:'Pause', stop:'Stop Copy', resume:'Resume',
      totalCopied:'Total Copied', activeCopies:'Active Copies', totalPnL:'Total P&L',
      rank:'Rank', trader:'Trader', monthly:'Monthly', verified:'Verified',
      riskLevels: ['All','Low','Medium','High','Very High'],
    },
    ar: {
      discover:'اكتشف', myCopies:'نسخي', leaderboard:'المتصدرون',
      winRate:'نسبة الفوز', roi:'العائد', aum:'إجمالي الأموال', followers:'المتابعون',
      trades:'الصفقات', drawdown:'أقصى سحب', risk:'المخاطرة',
      copyNow:'انسخ الآن', analysis:'تحليل AI', since:'منذ',
      sortBy:'ترتيب حسب', filterRisk:'مستوى المخاطرة', all:'الكل',
      amount:'مبلغ النسخ (USDT)', presets:'اختيار سريع',
      step1:'إعداد النسخ', step2:'تأكيد', success:'تم تفعيل النسخ!',
      stopLoss:'وقف الخسارة %', takeProfit:'جني الأرباح %',
      pause:'إيقاف مؤقت', stop:'إيقاف النسخ', resume:'استئناف',
      totalCopied:'إجمالي المنسوخ', activeCopies:'النسخ النشطة', totalPnL:'إجمالي الأرباح',
      rank:'الترتيب', trader:'المتداول', monthly:'شهري', verified:'موثق',
      riskLevels: ['الكل','منخفض','متوسط','عالٍ','عالٍ جداً'],
    }
  };
  const t = T[isAr ? 'ar' : 'en'];

  useEffect(() => {
    const iv = setInterval(() => {
      setLivePnl(prev => prev.map(p => {
        const trader = TRADERS.find(tr => tr.traderId === p.traderId || tr.id === p.traderId);
        const delta = (Math.random() - 0.42) * 2;
        return { ...p, pnl: +(p.pnl + delta).toFixed(2) };
      }));
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  const handleAI = async (trader) => {
    setAiLoading(p => ({ ...p, [trader.id]: true }));
    const prompt = `Briefly analyze copy trader "${trader.name}": Win Rate ${trader.win}%, ROI ${trader.roi}%, Max Drawdown ${trader.drawdown}%, Risk Level ${trader.risk}/5, active since ${trader.since}, trades ${trader.pairs.join(', ')}. Give 2-3 sentence assessment in ${isAr ? 'Arabic' : 'English'}.`;
    try {
      const res = await proxyAI(prompt, 180);
      setAiAnalysis(p => ({ ...p, [trader.id]: res }));
    } catch { setAiAnalysis(p => ({ ...p, [trader.id]: isAr ? 'تعذّر تحميل التحليل.' : 'Analysis unavailable.' })); }
    setAiLoading(p => ({ ...p, [trader.id]: false }));
  };

  const s = {
    wrap: { fontFamily: font, color: '#fff', padding: '20px', minHeight: '100vh', direction: isAr ? 'rtl' : 'ltr' },
    card: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' },
    tab: (a) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: a ? '#D4A843' : 'rgba(255,255,255,0.06)', color: a ? '#000' : 'rgba(255,255,255,0.6)', fontFamily: font, transition: 'all .2s' }),
    btn: (c='#D4A843', full=false) => ({ background: c, color: c==='#D4A843'?'#000':'#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: font, width: full?'100%':'auto', transition: 'opacity .2s' }),
    input: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, fontFamily: font, outline: 'none', width: '100%', boxSizing: 'border-box' },
    badge: (c) => ({ background: c+'22', color: c, borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }),
    riskDots: (level) => (
      <div style={{ display: 'flex', gap: 3 }}>
        {[1,2,3,4,5].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= level ? (level <= 2 ? '#10b981' : level <= 3 ? '#f59e0b' : '#ef4444') : 'rgba(255,255,255,0.1)' }} />)}
      </div>
    ),
  };

  const sorted = useMemo(() => {
    let arr = [...TRADERS];
    if (filterRisk > 0) arr = arr.filter(t => t.risk === filterRisk);
    return arr.sort((a, b) => {
      if (sortBy === 'roi') return b.roi - a.roi;
      if (sortBy === 'win') return b.win - a.win;
      if (sortBy === 'aum') return b.aum - a.aum;
      if (sortBy === 'drawdown') return a.drawdown - b.drawdown;
      return 0;
    });
  }, [sortBy, filterRisk]);

  /* STATS */
  const totalPnlVal = livePnl.reduce((a, p) => a + p.pnl, 0);
  const statsRow = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
      {[
        { l: t.totalCopied,   v: `$${MY_COPIES.reduce((a,c)=>a+c.amount,0).toLocaleString()}`, c: '#D4A843' },
        { l: t.activeCopies,  v: MY_COPIES.filter(c=>c.status==='active').length, c: '#10b981' },
        { l: t.totalPnL,      v: `${totalPnlVal >= 0 ? '+' : ''}$${totalPnlVal.toFixed(2)}`, c: totalPnlVal >= 0 ? '#10b981' : '#ef4444', live: true },
      ].map(st => (
        <div key={st.l} style={{ ...s.card, textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: st.c, fontVariantNumeric: 'tabular-nums' }}>{st.v}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{st.l}</div>
          {st.live && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', margin: '6px auto 0', boxShadow: '0 0 6px #10b981' }} />}
        </div>
      ))}
    </div>
  );

  /* DISCOVER */
  const discoverTab = (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ ...s.input, width: 'auto', padding: '7px 12px', fontSize: 12 }}>
          {[['roi','ROI'],['win',t.winRate],['aum','AUM'],['drawdown',t.drawdown]].map(([v,l]) => (
            <option key={v} value={v}>{t.sortBy}: {l}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2,3,4].map(r => (
            <button key={r} onClick={() => setFilterRisk(r)}
              style={{ ...s.btn(filterRisk===r ? '#D4A843' : 'rgba(255,255,255,0.07)'), color: filterRisk===r ? '#000':'#fff', padding: '6px 12px', fontSize: 11 }}>
              {t.riskLevels[r]}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {sorted.map(trader => {
          const isExpanded = expandedTrader === trader.id;
          const isCopying = MY_COPIES.some(c => c.traderId === trader.id);
          return (
            <div key={trader.id} style={{ ...s.card, borderColor: isExpanded ? trader.color+'55' : 'rgba(255,255,255,0.07)', transition: 'border-color .2s', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: trader.color, borderRadius: '16px 16px 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: trader.color+'33', border: `2px solid ${trader.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: trader.color }}>
                    {trader.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{trader.name} {trader.verified && <span style={{ color: '#3b82f6', fontSize: 11 }}>✓</span>}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.since} {trader.since}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>+{trader.roi}%</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{t.roi}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
                {[
                  { l: t.winRate, v: `${trader.win}%` },
                  { l: t.drawdown, v: `${trader.drawdown}%` },
                  { l: t.trades, v: trader.trades.toLocaleString() },
                ].map(m => (
                  <div key={m.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{m.v}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{m.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Sparkline data={trader.monthlyRoi} color={trader.color} />
                <div style={{ textAlign: 'right', fontSize: 11 }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{t.risk}</div>
                  {s.riskDots(trader.risk)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setCopyModal(trader); setCopyStep(1); setCopyAmount(''); }}
                  style={{ ...s.btn(trader.color, true), flex: 2 }}>
                  {isCopying ? '+ ' : ''}{t.copyNow}
                </button>
                <button onClick={() => { setExpandedTrader(isExpanded ? null : trader.id); if (!isExpanded && !aiAnalysis[trader.id]) handleAI(trader); }}
                  style={{ ...s.btn('rgba(255,255,255,0.07)'), flex: 1, color: '#fff', fontSize: 11 }}>
                  {t.analysis}
                </button>
              </div>
              {isExpanded && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 12, lineHeight: 1.6 }}>
                  {aiLoading[trader.id]
                    ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>⟳ {isAr ? 'جاري التحليل...' : 'Analyzing...'}</div>
                    : <span style={{ color: 'rgba(255,255,255,0.7)' }}>{aiAnalysis[trader.id]}</span>
                  }
                  <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                    {isAr ? 'الأزواج: ' : 'Pairs: '}{trader.pairs.join(', ')}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  /* MY COPIES */
  const myCopiesTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {MY_COPIES.map(copy => {
        const trader = TRADERS.find(t => t.id === copy.traderId);
        const live = livePnl.find(p => p.traderId === copy.traderId);
        const pnlNow = live ? live.pnl : copy.pnl;
        return (
          <div key={copy.traderId} style={{ ...s.card, borderLeft: `3px solid ${trader.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: trader.color+'33', border: `2px solid ${trader.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:11, color: trader.color }}>
                  {trader.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{trader.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.since} {copy.since}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: pnlNow >= 0 ? '#10b981' : '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
                  {pnlNow >= 0 ? '+' : ''}${pnlNow.toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: pnlNow >= 0 ? '#10b981' : '#ef4444' }}>
                  ({copy.pnlPct >= 0 ? '+' : ''}{copy.pnlPct}%)
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{t.totalCopied}</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>${copy.amount.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{isAr ? 'الحالة' : 'Status'}</div>
                <span style={{ ...s.badge(copy.status === 'active' ? '#10b981' : '#f59e0b') }}>
                  {copy.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Paused')}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {copy.status === 'active'
                ? <button style={{ ...s.btn('#f59e0b'), fontSize: 12, padding: '7px 14px' }}>{t.pause}</button>
                : <button style={{ ...s.btn('#10b981'), fontSize: 12, padding: '7px 14px' }}>{t.resume}</button>
              }
              <button style={{ ...s.btn('#ef4444'), fontSize: 12, padding: '7px 14px' }}>{t.stop}</button>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* LEADERBOARD */
  const leaderboardTab = (
    <div style={s.card}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {[t.rank, t.trader, t.roi, t.winRate, t.drawdown, t.followers, ''].map(h => (
              <th key={h} style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: isAr ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...TRADERS].sort((a,b) => b.roi - a.roi).map((trader, idx) => (
            <tr key={trader.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '10px 8px' }}>
                <span style={{ fontSize: 16 }}>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}</span>
              </td>
              <td style={{ padding: '10px 8px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: trader.color+'33', border: `1.5px solid ${trader.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color: trader.color }}>{trader.avatar}</div>
                  <span style={{ fontWeight: 600 }}>{trader.name} {trader.verified && <span style={{ color:'#3b82f6' }}>✓</span>}</span>
                </div>
              </td>
              <td style={{ padding: '10px 8px', color: '#10b981', fontWeight: 700 }}>+{trader.roi}%</td>
              <td style={{ padding: '10px 8px' }}>{trader.win}%</td>
              <td style={{ padding: '10px 8px', color: '#ef4444' }}>{trader.drawdown}%</td>
              <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.5)' }}>{trader.followers.toLocaleString()}</td>
              <td style={{ padding: '10px 8px' }}>
                <button onClick={() => { setCopyModal(trader); setCopyStep(1); setCopyAmount(''); }}
                  style={{ ...s.btn(trader.color), fontSize: 11, padding: '5px 12px' }}>{t.copyNow}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* COPY MODAL */
  const copyModalEl = copyModal && (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={() => copyStep < 3 && setCopyModal(null)}>
      <div style={{ ...s.card, width:400, maxWidth:'92vw' }} onClick={e => e.stopPropagation()}>
        {copyStep < 3 ? (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0 }}>{t.copyNow}: {copyModal.name}</h3>
              <button onClick={() => setCopyModal(null)} style={{ background:'none', border:'none', color:'#fff', fontSize:20, cursor:'pointer' }}>×</button>
            </div>
            {copyStep === 1 ? (
              <>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:6 }}>{t.amount}</label>
                  <input style={s.input} type="number" placeholder="Min $100" value={copyAmount} onChange={e => setCopyAmount(e.target.value)} />
                  <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                    {[100,500,1000,5000].map(a => (
                      <button key={a} onClick={() => setCopyAmount(a)} style={{ ...s.btn('rgba(255,255,255,0.07)'), color:'#fff', fontSize:12, padding:'5px 12px' }}>${a}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  <div>
                    <label style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:4 }}>{t.stopLoss}</label>
                    <input style={s.input} type="number" placeholder="e.g. 20" defaultValue="20" />
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:4 }}>{t.takeProfit}</label>
                    <input style={s.input} type="number" placeholder="e.g. 50" defaultValue="50" />
                  </div>
                </div>
                <button style={{ ...s.btn(copyModal.color, true) }} onClick={() => copyAmount >= 100 && setCopyStep(2)}>
                  {t.step2} →
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:16 }}>{t.step2}</div>
                {[
                  { l: t.trader, v: copyModal.name },
                  { l: t.amount, v: `$${(+copyAmount).toLocaleString()} USDT` },
                  { l: t.roi, v: `+${copyModal.roi}%` },
                  { l: t.winRate, v: `${copyModal.win}%` },
                ].map(row => (
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
                    <span style={{ color:'rgba(255,255,255,0.45)' }}>{row.l}</span>
                    <span style={{ fontWeight:600 }}>{row.v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button style={{ ...s.btn('rgba(255,255,255,0.08)', true), color:'#fff' }} onClick={() => setCopyStep(1)}>←</button>
                  <button style={{ ...s.btn(copyModal.color, true) }} onClick={() => setCopyStep(3)}>{t.step2}</button>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'30px 0' }}>
            <div style={{ fontSize:48 }}>🚀</div>
            <div style={{ fontSize:16, fontWeight:700, marginTop:12, color:'#10b981' }}>{t.success}</div>
            <button style={{ ...s.btn(copyModal.color), marginTop:20 }} onClick={() => { setCopyModal(null); setActiveTab('myCopies'); }}>{t.myCopies}</button>
          </div>
        )}
      </div>
    </div>
  );

  const TABS = [
    { id:'discover', label: t.discover },
    { id:'myCopies', label: t.myCopies },
    { id:'leaderboard', label: t.leaderboard },
  ];

  return (
    <div style={s.wrap}>
      {copyModalEl}
      {statsRow}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {TABS.map(tab => <button key={tab.id} style={s.tab(activeTab===tab.id)} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </div>
      {activeTab === 'discover'     && discoverTab}
      {activeTab === 'myCopies'     && myCopiesTab}
      {activeTab === 'leaderboard'  && leaderboardTab}
    </div>
  );
}
