/* eslint-disable */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { API } from '../utils/api.js';

/* ══════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════ */
const PLANS = [
  { id:'flex',  name:'Flexible',  nameAr:'مرن',       apy:5.5,  lock:0,   color:'#6366f1', grad:'linear-gradient(135deg,#1e1b4b,#312e81)', minAmount:100,   maxAmount:50000,  risk:'Low',    riskAr:'منخفض',  desc:'No lock period, withdraw anytime.',    descAr:'بدون قفل، سحب في أي وقت.' },
  { id:'30d',   name:'30-Day',    nameAr:'30 يوم',    apy:8.5,  lock:30,  color:'#D4A843', grad:'linear-gradient(135deg,#1c1507,#3d2c09)', minAmount:500,   maxAmount:100000, risk:'Low',    riskAr:'منخفض',  desc:'Fixed 30-day term, higher yield.',      descAr:'مدة 30 يوم، عائد أعلى.' },
  { id:'90d',   name:'90-Day',    nameAr:'90 يوم',    apy:12.5, lock:90,  color:'#10b981', grad:'linear-gradient(135deg,#052e16,#064e3b)', minAmount:1000,  maxAmount:250000, risk:'Medium', riskAr:'متوسط',  desc:'Optimal yield-liquidity balance.',       descAr:'توازن مثالي بين العائد والسيولة.' },
  { id:'180d',  name:'180-Day',   nameAr:'180 يوم',   apy:18.0, lock:180, color:'#f59e0b', grad:'linear-gradient(135deg,#1c0f00,#451a03)', minAmount:2000,  maxAmount:500000, risk:'Medium', riskAr:'متوسط',  desc:'Maximum returns, semi-annual lock.',    descAr:'أقصى عائد، قفل نصف سنوي.' },
];

const STAKING_POOLS = [
  { id:'eth2',     name:'Ethereum 2.0',   token:'ETH',  apy:3.8,  lock:0,  risk:'Low',    minAmt:0.01,  tvl:'$28.4B',  color:'#627EEA', chain:'Ethereum',   badge:'🔷' },
  { id:'bnb30',    name:'BNB 30-Day',     token:'BNB',  apy:6.2,  lock:30, risk:'Low',    minAmt:1,     tvl:'$4.2B',   color:'#F3BA2F', chain:'BNB Chain',  badge:'🟡' },
  { id:'sol',      name:'Solana Staking', token:'SOL',  apy:7.1,  lock:0,  risk:'Low',    minAmt:1,     tvl:'$12.1B',  color:'#9945FF', chain:'Solana',     badge:'🟣' },
  { id:'atom',     name:'Cosmos Hub',     token:'ATOM', apy:18.5, lock:21, risk:'Medium', minAmt:5,     tvl:'$2.8B',   color:'#2E3148', chain:'Cosmos',     badge:'⚫' },
  { id:'dot',      name:'Polkadot',       token:'DOT',  apy:12.0, lock:28, risk:'Medium', minAmt:10,    tvl:'$7.9B',   color:'#E6007A', chain:'Polkadot',   badge:'🩷' },
  { id:'avax',     name:'Avalanche',      token:'AVAX', apy:8.5,  lock:0,  risk:'Medium', minAmt:25,    tvl:'$2.1B',   color:'#E84142', chain:'Avalanche',  badge:'🔴' },
  { id:'usdt',     name:'USDT Flexible',  token:'USDT', apy:5.0,  lock:0,  risk:'Low',    minAmt:10,    tvl:'$45.0B',  color:'#26A17B', chain:'Multi-chain', badge:'💚' },
  { id:'usdc30',   name:'USDC 30-Day',    token:'USDC', apy:7.8,  lock:30, risk:'Low',    minAmt:100,   tvl:'$18.3B',  color:'#2775CA', chain:'Multi-chain', badge:'🔵' },
];

const MY_INVESTMENTS = [
  { id:1, plan:'30d',  amount:5000,  startDate:'2025-01-10', endDate:'2025-02-09', earned:34.79,  status:'active',  progress:72 },
  { id:2, plan:'90d',  amount:12000, startDate:'2024-11-01', endDate:'2025-01-30', earned:369.86, status:'matured', progress:100 },
  { id:3, plan:'flex', amount:2500,  startDate:'2025-01-01', endDate:null,         earned:9.25,   status:'active',  progress:null },
];

const HISTORY = [
  { id:1, type:'invest',  plan:'90-Day',   amount:12000, date:'2024-11-01', status:'completed', earn:369.86 },
  { id:2, type:'payout',  plan:'90-Day',   amount:369.86,date:'2025-01-30', status:'completed', earn:null },
  { id:3, type:'invest',  plan:'30-Day',   amount:5000,  date:'2025-01-10', status:'active',    earn:null },
  { id:4, type:'invest',  plan:'Flexible', amount:2500,  date:'2025-01-01', status:'active',    earn:null },
  { id:5, type:'payout',  plan:'Flexible', amount:5.72,  date:'2024-12-31', status:'completed', earn:null },
];

const RISK_COLORS = { Low:'#22c55e', Medium:'#f59e0b', High:'#ef4444' };

/* ══════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════ */

/* APY Arc gauge */
function ApyArc({ apy, color, size = 100 }) {
  const max = 22;
  const pct = Math.min(1, apy / max);
  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2 + 8;
  const startAngle = -Math.PI * 0.9;
  const endAngle = startAngle + Math.PI * 1.8 * pct;
  const trackEnd = startAngle + Math.PI * 1.8;
  const polar = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [tx1, ty1] = polar(startAngle), [tx2, ty2] = polar(trackEnd);
  const [vx1, vy1] = polar(startAngle), [vx2, vy2] = polar(endAngle);
  const lg = pct > 0.5 ? 1 : 0;
  const lvg = endAngle > startAngle + Math.PI ? 1 : 0;
  return (
    <svg width={size} height={size * 0.7} style={{ display:'block', margin:'0 auto' }}>
      <defs>
        <linearGradient id={`ag${color.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* track */}
      <path d={`M${tx1},${ty1} A${r},${r} 0 1 1 ${tx2},${ty2}`}
        fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" />
      {/* value arc */}
      {pct > 0 && (
        <path d={`M${vx1},${vy1} A${r},${r} 0 ${lvg} 1 ${vx2},${vy2}`}
          fill="none" stroke={`url(#ag${color.replace('#','')})`} strokeWidth="7" strokeLinecap="round" />
      )}
      <text x={cx} y={cy + 2} textAnchor="middle" fill={color} fontSize="14" fontWeight="800">{apy}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8">APY</text>
    </svg>
  );
}

/* Compound growth chart with dual lines */
function CompoundChart({ amount, apy, months, color, compFreq, isAr }) {
  const { compound, simple } = useMemo(() => {
    const n = compFreq === 'daily' ? 365 : compFreq === 'weekly' ? 52 : compFreq === 'monthly' ? 12 : 1;
    const compound = [], simple = [];
    for (let i = 0; i <= months; i++) {
      compound.push(amount * Math.pow(1 + apy / 100 / n, n * (i / 12)));
      simple.push(amount + amount * (apy / 100) * (i / 12));
    }
    return { compound, simple };
  }, [amount, apy, months, compFreq]);

  const allVals = [...compound, ...simple];
  const max = Math.max(...allVals), min = amount;
  const w = 480, h = 160, pad = 12;
  const toX = (i) => pad + (i / months) * (w - pad * 2);
  const toY = (v) => h - pad - ((v - min) / (max - min + 0.001)) * (h - pad * 2);
  const mkPath = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i)},${toY(v)}`).join(' ');
  const cPath = mkPath(compound);
  const sPath = mkPath(simple);
  const cArea = cPath + ` L${toX(months)},${h - pad} L${toX(0)},${h - pad} Z`;
  const earned = compound[compound.length - 1] - amount;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:140, overflow:'visible' }}>
        <defs>
          <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={cArea} fill="url(#cg2)" />
        <path d={sPath} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="5,4" strokeLinecap="round" />
        <path d={cPath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        {[0, Math.floor(months/3), Math.floor(months*2/3), months].map(i => (
          <g key={i}>
            <line x1={toX(i)} y1={h-pad} x2={toX(i)} y2={h-pad+4} stroke="rgba(255,255,255,0.12)" />
            <text x={toX(i)} y={h+4} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">
              {i === 0 ? (isAr ? 'الآن' : 'Now') : `${i}m`}
            </text>
          </g>
        ))}
        <circle cx={toX(months)} cy={toY(compound[compound.length-1])} r="4" fill={color} />
      </svg>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12 }}>
        <div style={{ display:'flex', gap:16 }}>
          <span style={{ color:'rgba(255,255,255,0.4)' }}><span style={{ color:'rgba(255,255,255,0.2)', marginRight:4 }}>—</span>{isAr ? 'بسيط' : 'Simple'}</span>
          <span style={{ color }}><span style={{ marginRight:4 }}>—</span>{isAr ? 'مركّب' : 'Compound'}</span>
        </div>
        <span style={{ color:'#10b981', fontWeight:700 }}>
          +${earned.toLocaleString(undefined,{maximumFractionDigits:2})} ({((earned/amount)*100).toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}

/* Plan comparison mini bars */
function PlanCompare({ amount, months, isAr }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {PLANS.map(p => {
        const earned = amount * Math.pow(1 + p.apy/100/12, months) - amount;
        const max = amount * Math.pow(1 + 18/100/12, months) - amount;
        const pct = (earned / max) * 100;
        return (
          <div key={p.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:70, fontSize:12, color:'rgba(255,255,255,0.6)', textAlign:isAr ? 'left':'right' }}>{isAr ? p.nameAr : p.name}</span>
            <div style={{ flex:1, height:22, background:'rgba(255,255,255,0.05)', borderRadius:6, overflow:'hidden', position:'relative' }}>
              <div style={{ position:'absolute', inset:0, width:`${pct}%`, background:p.color, borderRadius:6, transition:'width 0.8s ease', display:'flex', alignItems:'center', paddingLeft:8 }}>
                {pct > 30 && <span style={{ fontSize:11, fontWeight:700, color:'#000' }}>${earned.toFixed(0)}</span>}
              </div>
            </div>
            <span style={{ width:38, fontSize:12, color:p.color, fontWeight:700 }}>{p.apy}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const TOKEN_PAIR = { ETH:'ETH/USD', BNB:'BNB/USD', SOL:'SOL/USD', ATOM:'ATOM/USD', DOT:'DOT/USD', AVAX:'AVAX/USD', USDT:'BTC/USD', USDC:'BTC/USD' };

export default function InvestmentTab({ theme, lang, onTrade }) {
  const isAr = lang === 'ar';
  const primary = theme?.primary || '#D4A843';
  const font = isAr ? "'Cairo','Tajawal',sans-serif" : "'Inter',system-ui,sans-serif";

  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [modal, setModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [modalAmount, setModalAmount] = useState('');
  const [autoCompound, setAutoCompound] = useState(true);
  const [compFreq, setCompFreq] = useState('monthly');
  const [calcPlan, setCalcPlan] = useState(PLANS[1]);
  const [calcAmount, setCalcAmount] = useState(10000);
  const [calcMonths, setCalcMonths] = useState(12);
  const [stakeModal, setStakeModal] = useState(null);
  const [totalEarned, setTotalEarned] = useState(413.86);
  const [liveCounters, setLiveCounters] = useState(
    MY_INVESTMENTS.filter(i => i.status === 'active').map(i => ({ id:i.id, earned:i.earned }))
  );

  /* ── Real DB data ── */
  const [dbProducts,   setDbProducts]   = useState([]);   // from /investments/products
  const [dbPositions,  setDbPositions]  = useState([]);   // from /investments/positions
  const [dbSummary,    setDbSummary]    = useState(null); // from /investments/summary
  const [dbLoaded,     setDbLoaded]     = useState(false);
  const [investing,    setInvesting]    = useState(false);
  const [withdrawing,  setWithdrawing]  = useState(null); // position id being withdrawn
  const [investMsg,    setInvestMsg]    = useState(null);

  const loadDbData = useCallback(async () => {
    const [prod, pos, sum] = await Promise.all([
      API.getInvestmentProducts(),
      API.getMyPositions(),
      API.getInvestmentSummary(),
    ]);
    if (prod.ok && prod.data?.products?.length > 0) setDbProducts(prod.data.products);
    if (pos.ok)  setDbPositions(pos.data?.positions || []);
    if (sum.ok)  setDbSummary(sum.data);
    setDbLoaded(true);
  }, []);

  useEffect(() => { loadDbData(); }, [loadDbData]);

  const handleInvest = async (productId, amount, autoComp) => {
    setInvesting(true); setInvestMsg(null);
    const res = await API.invest({ product_id: productId, amount: parseFloat(amount), auto_compound: autoComp });
    if (res.ok) {
      setInvestMsg({ ok: true, msg: isAr ? '✅ تم الاستثمار بنجاح!' : '✅ Investment created!' });
      await loadDbData();
    } else {
      setInvestMsg({ ok: false, msg: res.error || (isAr ? 'فشل الاستثمار' : 'Investment failed') });
    }
    setInvesting(false);
    setTimeout(() => setInvestMsg(null), 4000);
  };

  const handleWithdraw = async (positionId) => {
    setWithdrawing(positionId);
    const res = await API.withdrawPosition(positionId);
    if (res.ok) {
      setInvestMsg({ ok: true, msg: isAr
        ? `✅ سُحب $${res.data.total_return?.toFixed(2)} بنجاح`
        : `✅ Withdrew $${res.data.total_return?.toFixed(2)}` });
      await loadDbData();
    } else {
      setInvestMsg({ ok: false, msg: res.error || (isAr ? 'فشل السحب' : 'Withdrawal failed') });
    }
    setWithdrawing(null);
    setTimeout(() => setInvestMsg(null), 4000);
  };

  const T = {
    en: {
      plans:'Plans', myInv:'My Investments', calc:'Calculator', history:'History', staking:'Staking Pools',
      subscribe:'Subscribe Now', confirm:'Confirm', amount:'Amount (USDT)', lockPeriod:'Lock Period',
      days:'days', flexible:'Flexible', expectedReturn:'Expected Yield', totalAtMaturity:'Total at Maturity',
      apy:'APY', monthly:'Monthly', annual:'Annual', myPlan:'Plan', progress:'Progress', earned:'Earned',
      endDate:'End Date', open:'Open', days_left:'days left',
      totalStats:'Total Earned', activeInv:'Active', totalInvested:'Invested',
      calcTitle:'Investment Calculator', principal:'Principal',
      duration:'Duration (months)', step1:'Enter Amount', step2:'Confirm Investment',
      agreedTerms:'I agree to investment terms and conditions',
      successMsg:'Investment confirmed!', noData:'No investments yet',
      type:'Type', date:'Date', status:'Status', invest:'Invest', payout:'Payout',
      completed:'Completed', active:'Active', matured:'Matured',
      compFreq:'Compound Frequency', daily:'Daily', weekly:'Weekly', annually:'Annually',
      autoCompound:'Auto-compound', comparison:'Plan Comparison',
      risk:'Risk', minAmt:'Min. Amount', tvl:'Total Value Locked', chain:'Chain',
      stakeNow:'Stake Now', backPlans:'Back to Plans',
    },
    ar: {
      plans:'الخطط', myInv:'استثماراتي', calc:'الحاسبة', history:'السجل', staking:'مجمعات الإيداع',
      subscribe:'اشترك الآن', confirm:'تأكيد', amount:'المبلغ (USDT)', lockPeriod:'فترة الحجز',
      days:'يوم', flexible:'مرن', expectedReturn:'العائد المتوقع', totalAtMaturity:'الإجمالي عند الاستحقاق',
      apy:'العائد السنوي', monthly:'شهريًا', annual:'سنويًا', myPlan:'الخطة', progress:'التقدم', earned:'المكتسب',
      endDate:'تاريخ الانتهاء', open:'مفتوح', days_left:'أيام متبقية',
      totalStats:'إجمالي الأرباح', activeInv:'نشط', totalInvested:'مستثمر',
      calcTitle:'حاسبة الاستثمار', principal:'المبلغ',
      duration:'المدة (أشهر)', step1:'أدخل المبلغ', step2:'تأكيد الاستثمار',
      agreedTerms:'أوافق على شروط وأحكام الاستثمار',
      successMsg:'تم تأكيد الاستثمار بنجاح!', noData:'لا توجد استثمارات بعد',
      type:'النوع', date:'التاريخ', status:'الحالة', invest:'استثمار', payout:'صرف',
      completed:'مكتمل', active:'نشط', matured:'استحق',
      compFreq:'التركيب', daily:'يوميًا', weekly:'أسبوعيًا', annually:'سنويًا',
      autoCompound:'مركّب تلقائي', comparison:'مقارنة الخطط',
      risk:'المخاطرة', minAmt:'الحد الأدنى', tvl:'القيمة المقفلة', chain:'السلسلة',
      stakeNow:'ابدأ الإيداع', backPlans:'رجوع للخطط',
    }
  };
  const t = T[isAr ? 'ar' : 'en'];

  /* ── Live counters ── */
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveCounters(prev => prev.map(c => {
        const inv = MY_INVESTMENTS.find(i => i.id === c.id);
        if (!inv) return c;
        const plan = PLANS.find(p => p.id === inv.plan);
        const rps = (inv.amount * plan.apy / 100) / (365 * 24 * 3600);
        return { ...c, earned: +(c.earned + rps * 2).toFixed(6) };
      }));
      setTotalEarned(p => +(p + 0.00012).toFixed(5));
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  /* ── Styles ── */
  const s = {
    wrap: { fontFamily:font, color:'#fff', padding:'20px', minHeight:'100vh', direction:isAr?'rtl':'ltr' },
    card: { background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px' },
    tabBtn: (active) => ({
      padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
      background: active ? primary : 'rgba(255,255,255,0.06)',
      color: active ? '#000' : 'rgba(255,255,255,0.6)',
      fontFamily:font, transition:'all .2s',
    }),
    btn: (color = primary, full = false) => ({
      background:color, color: color === primary ? '#000' : '#fff',
      border:'none', borderRadius:10, padding:'10px 22px', fontWeight:700,
      fontSize:13, cursor:'pointer', fontFamily:font, width: full ? '100%' : 'auto', transition:'all .2s',
    }),
    ghostBtn: (color = primary) => ({
      background:'transparent', color, border:`1px solid ${color}44`,
      borderRadius:10, padding:'10px 22px', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:font,
    }),
    input: {
      background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
      borderRadius:10, padding:'10px 14px', color:'#fff', fontSize:14,
      fontFamily:font, outline:'none', width:'100%', boxSizing:'border-box',
    },
    badge: (c, bg) => ({
      background: bg || c + '22', color:c, borderRadius:6, padding:'2px 10px', fontSize:11, fontWeight:700,
    }),
    riskBadge: (risk) => ({
      background: RISK_COLORS[risk] + '22', color: RISK_COLORS[risk],
      borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:700,
    }),
    toggle: (on) => ({
      width:40, height:22, borderRadius:11, background: on ? primary : 'rgba(255,255,255,0.12)',
      position:'relative', cursor:'pointer', border:'none', transition:'background .2s', flexShrink:0,
    }),
  };

  const TABS = [
    { id:'plans',   label:t.plans },
    { id:'staking', label:t.staking },
    { id:'myinv',  label:t.myInv },
    { id:'calc',   label:t.calc },
    { id:'history',label:t.history },
  ];

  /* ══ STATS ROW ══ */
  const statsRow = (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
      {[
        { label:t.totalStats,    value: dbSummary ? `$${dbSummary.total_earned?.toFixed(2)}` : `$${totalEarned.toFixed(2)}`, color:'#10b981', live:true },
        { label:t.activeInv,     value: dbSummary ? dbSummary.active_count : MY_INVESTMENTS.filter(i=>i.status==='active').length, color:primary },
        { label:t.totalInvested, value: dbSummary ? `$${dbSummary.total_invested?.toLocaleString()}` : `$${MY_INVESTMENTS.reduce((a,i)=>a+i.amount,0).toLocaleString()}`, color:'#6366f1' },
      ].map(st => (
        <div key={st.label} style={{ ...s.card, textAlign:'center', padding:'16px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, background:`radial-gradient(circle at 50% 0%, ${st.color}10 0%, transparent 70%)`, pointerEvents:'none' }} />
          <div style={{ fontSize:22, fontWeight:800, color:st.color, fontVariantNumeric:'tabular-nums' }}>{st.value}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4 }}>{st.label}</div>
          {st.live && <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginTop:6 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 6px #10b981', animation:'pulse 1.5s infinite' }} />
            <span style={{ fontSize:10, color:'#10b981' }}>LIVE</span>
          </div>}
        </div>
      ))}
    </div>
  );

  /* ══ PLANS TAB ══ */
  const plansTab = (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))', gap:16 }}>
        {PLANS.map(plan => {
          const monthly = (1000 * plan.apy / 100 / 12).toFixed(2);
          return (
            <div key={plan.id}
              onClick={() => { setSelectedPlan(plan); setModal(true); setModalStep(1); setModalAmount(''); }}
              style={{ background:plan.grad, border:`1px solid ${plan.color}30`, borderRadius:18, padding:'20px', cursor:'pointer', transition:'all .25s', position:'relative', overflow:'hidden' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor=plan.color+'80'; e.currentTarget.style.boxShadow=`0 12px 32px ${plan.color}25`; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor=plan.color+'30'; e.currentTarget.style.boxShadow='none'; }}>
              {/* Glow */}
              <div style={{ position:'absolute', top:-40, right:-40, width:120, height:120, borderRadius:'50%', background:plan.color+'20', filter:'blur(24px)', pointerEvents:'none' }} />
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:17, marginBottom:2 }}>{isAr ? plan.nameAr : plan.name}</div>
                  <span style={{ ...s.riskBadge(plan.risk) }}>{isAr ? plan.riskAr : plan.risk} {isAr ? 'مخاطرة' : 'Risk'}</span>
                </div>
                <ApyArc apy={plan.apy} color={plan.color} size={80} />
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', margin:'0 0 14px', lineHeight:1.5 }}>{isAr ? plan.descAr : plan.desc}</p>
              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {[
                  { l: t.lockPeriod, v: plan.lock === 0 ? t.flexible : `${plan.lock} ${t.days}` },
                  { l: t.monthly, v: `$${monthly}/1K` },
                ].map(item => (
                  <div key={item.l} style={{ background:'rgba(0,0,0,0.25)', borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:2 }}>{item.l}</div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{item.v}</div>
                  </div>
                ))}
              </div>
              <button style={{ ...s.btn(plan.color, true) }} onClick={e => { e.stopPropagation(); setSelectedPlan(plan); setModal(true); setModalStep(1); setModalAmount(''); }}>
                {t.subscribe}
              </button>
            </div>
          );
        })}
      </div>
      {/* Plan comparison */}
      <div style={{ ...s.card, padding:'20px' }}>
        <h3 style={{ margin:'0 0 16px', fontSize:14, fontWeight:700 }}>{t.comparison} — $10,000 / 12 {isAr ? 'أشهر' : 'months'}</h3>
        <PlanCompare amount={10000} months={12} isAr={isAr} />
      </div>
    </div>
  );

  /* ══ STAKING POOLS TAB ══ */
  // Merge DB products into staking display (staking + savings categories)
  const dbPoolProducts = dbProducts.filter(p => ['staking','savings','lending','fixed'].includes(p.category));

  const stakingTab = (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ ...s.card, padding:'14px 18px', background:'rgba(99,102,241,0.08)', borderColor:'rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.6 }}>
          {isAr
            ? '🔒 مجمعات الإيداع تتيح لك كسب عائد على عملاتك الرقمية. العوائد تتجدد يومياً.'
            : '🔒 Staking pools let you earn yield on your crypto assets. Rewards are distributed daily.'}
        </div>
      </div>

      {/* ── Real DB products (if loaded) ── */}
      {dbPoolProducts.length > 0 && (
        <div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:10 }}>
            {isAr ? '✅ منتجات حقيقية من قاعدة البيانات' : '✅ Live products from database'}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12, marginBottom:20 }}>
            {dbPoolProducts.map(prod => {
              const apy = prod.apy_max || prod.apy_min || 0;
              const color = '#D4A843';
              return (
                <div key={prod.id} style={{ ...s.card, borderColor:`${color}30`, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, borderRadius:'16px 16px 0 0' }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15 }}>{isAr ? (prod.name_ar || prod.name) : prod.name}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{prod.provider} · {prod.token}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:22, fontWeight:800, color }}>{apy}%</div>
                      <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)' }}>APY</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:12 }}>
                    {[
                      { l: isAr ? 'الحد الأدنى' : 'Min', v: `${prod.min_amount} ${prod.currency}` },
                      { l: isAr ? 'فترة الحجز' : 'Lock', v: prod.lock_days ? `${prod.lock_days}d` : (isAr ? 'مرن' : 'Flexible') },
                    ].map(item => (
                      <div key={item.l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:7, padding:'7px 9px' }}>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', marginBottom:2 }}>{item.l}</div>
                        <div style={{ fontSize:12, fontWeight:600 }}>{item.v}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    disabled={investing}
                    onClick={() => {
                      setSelectedPlan({ id: prod.id, apy, lock: prod.lock_days||0, color, minAmount: prod.min_amount, maxAmount: prod.max_amount, name: prod.name, nameAr: prod.name_ar || prod.name });
                      setModal(true); setModalStep(1); setModalAmount('');
                    }}
                    style={{ ...s.btn(color, true), opacity: investing ? 0.7 : 1 }}>
                    {t.subscribe}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {STAKING_POOLS.map(pool => (
          <div key={pool.id} style={{ ...s.card, borderColor:`${pool.color}25`, position:'relative', overflow:'hidden', transition:'all .22s', cursor:'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=pool.color+'60'; e.currentTarget.style.transform='translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=pool.color+'25'; e.currentTarget.style.transform='translateY(0)'; }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${pool.color}, ${pool.color}80)`, borderRadius:'16px 16px 0 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:`${pool.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{pool.badge}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{pool.token}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{pool.name}</div>
                </div>
              </div>
              <div style={{ textAlign:isAr ? 'left':'right' }}>
                <div style={{ fontSize:22, fontWeight:800, color:pool.color }}>{pool.apy}%</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>APY</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
              {[
                { l:t.risk, v: pool.risk, c: RISK_COLORS[pool.risk] },
                { l:t.lockPeriod, v: pool.lock === 0 ? t.flexible : `${pool.lock}d`, c:'#fff' },
                { l:t.minAmt, v: `${pool.minAmt} ${pool.token}`, c:'rgba(255,255,255,0.7)' },
              ].map(item => (
                <div key={item.l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'7px 9px' }}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', marginBottom:2 }}>{item.l}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:item.c }}>{item.v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{t.tvl}: <span style={{ color:'rgba(255,255,255,0.7)' }}>{pool.tvl}</span></span>
              <span style={{ fontSize:11, color:'rgba(255,255,255,0.35)' }}>{pool.chain}</span>
            </div>
            {/* APY bar */}
            <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:4, height:5, overflow:'hidden', marginBottom:12 }}>
              <div style={{ width:`${(pool.apy / 20) * 100}%`, height:'100%', background:pool.color, borderRadius:4, transition:'width 1s' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setStakeModal(pool)} style={{ ...s.btn(pool.color, true), flex:1 }}>{t.stakeNow}</button>
              {onTrade && TOKEN_PAIR[pool.token] && (
                <button onClick={() => onTrade(TOKEN_PAIR[pool.token])} style={{
                  background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)',
                  borderRadius:10, padding:'0 14px', cursor:'pointer', color:'#22c55e', fontSize:11, fontWeight:700, whiteSpace:'nowrap',
                }}>⚡ {isAr ? 'تداول' : 'Trade'}</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ══ MY INVESTMENTS TAB ══ */
  // Show real DB positions if available, else fall back to static demo
  const positionsToShow = dbLoaded && dbPositions.length > 0 ? dbPositions : null;

  const myInvTab = (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {/* Invest message */}
      {investMsg && (
        <div style={{ padding:'10px 14px', borderRadius:9, fontSize:13, fontWeight:600,
          background: investMsg.ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${investMsg.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: investMsg.ok ? '#22c55e' : '#ef4444' }}>
          {investMsg.msg}
        </div>
      )}

      {positionsToShow ? (
        /* ── Real DB positions ── */
        positionsToShow.length === 0 ? (
          <div style={{ ...s.card, textAlign:'center', color:'rgba(255,255,255,0.4)', padding:32 }}>
            {isAr ? 'لا توجد استثمارات بعد' : 'No investments yet'}
          </div>
        ) : positionsToShow.map(pos => {
          const prod = pos.investment_products || {};
          const apy  = parseFloat(pos.apy_locked) || 0;
          const amt  = parseFloat(pos.amount) || 0;
          const earned = pos.current_earned ?? parseFloat(pos.earned) ?? 0;
          const monthly = (amt * apy / 100 / 12).toFixed(2);
          const color = primary;
          const isLocked = pos.end_date && new Date(pos.end_date) > new Date();
          return (
            <div key={pos.id} style={{ ...s.card, borderLeft:`3px solid ${color}`, position:'relative', overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{isAr ? (prod.name_ar || prod.name) : prod.name}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                    {prod.provider} · {prod.category} · {prod.token}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                    {pos.start_date?.slice(0,10)}
                    {pos.end_date ? ` → ${pos.end_date.slice(0,10)}` : ` (${t.open})`}
                  </div>
                  {isLocked && (
                    <div style={{ fontSize:11, color:'#f59e0b', marginTop:3 }}>
                      🔒 {isAr ? 'مقفل حتى' : 'Locked until'} {pos.end_date?.slice(0,10)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                  <div style={{ fontSize:22, fontWeight:800, color }}>${amt.toLocaleString()}</div>
                  <span style={{ ...s.badge('#10b981') }}>{t.active}</span>
                </div>
              </div>
              <div style={{ marginTop:14, display:'flex', gap:20, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{t.earned}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#10b981' }}>${Number(earned).toFixed(4)}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:3, marginTop:2 }}>
                    <div style={{ width:5, height:5, background:'#10b981', borderRadius:'50%', animation:'pulse 1.5s infinite' }} />
                    <span style={{ fontSize:9, color:'#10b981' }}>LIVE</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>APY</div>
                  <div style={{ fontSize:15, fontWeight:700, color }}>{apy}%</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{isAr ? 'شهريًا' : 'Monthly'}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.8)' }}>${monthly}</div>
                </div>
                <div style={{ marginLeft:'auto' }}>
                  <button
                    disabled={withdrawing === pos.id || isLocked}
                    onClick={() => handleWithdraw(pos.id)}
                    style={{ padding:'6px 14px', borderRadius:8, border:'1px solid rgba(239,68,68,0.4)',
                      background:'rgba(239,68,68,0.08)', color:'#ef9a9a', fontSize:11, fontWeight:700,
                      cursor: (withdrawing === pos.id || isLocked) ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 0.5 : 1 }}>
                    {withdrawing === pos.id ? '…' : (isAr ? 'سحب' : 'Withdraw')}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        /* ── Fallback: static demo investments ── */
        MY_INVESTMENTS.map(inv => {
          const plan = PLANS.find(p => p.id === inv.plan);
          const liveData = liveCounters.find(c => c.id === inv.id);
          const earnedNow = liveData ? liveData.earned : inv.earned;
          const daysLeft = plan.lock > 0 && inv.status === 'active' ? Math.max(0, plan.lock - Math.round((inv.progress || 0) * plan.lock / 100)) : null;
          return (
            <div key={inv.id} style={{ ...s.card, borderLeft:`3px solid ${plan.color}`, position:'relative', overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{isAr ? plan.nameAr : plan.name}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{inv.startDate}{inv.endDate ? ` → ${inv.endDate}` : ` (${t.open})`}</div>
                  {daysLeft !== null && <div style={{ fontSize:11, color:plan.color, marginTop:4 }}>{daysLeft} {t.days_left}</div>}
                </div>
                <div style={{ textAlign:isAr ? 'left':'right' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:plan.color }}>${inv.amount.toLocaleString()}</div>
                  <span style={{ ...s.badge(inv.status === 'active' ? '#10b981' : '#D4A843') }}>
                    {inv.status === 'active' ? t.active : t.matured}
                  </span>
                </div>
              </div>
              <div style={{ marginTop:14, display:'flex', gap:20 }}>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>{t.earned}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#10b981' }}>${earnedNow.toFixed(4)}</div>
                </div>
                <div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>APY</div>
                  <div style={{ fontSize:15, fontWeight:700, color:plan.color }}>{plan.apy}%</div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  /* ══ CALCULATOR TAB ══ */
  const calcTab = (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={s.card}>
        <h3 style={{ margin:'0 0 20px', fontSize:16, fontWeight:700 }}>{t.calcTitle}</h3>
        {/* Inputs row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:6 }}>{t.principal} ($)</label>
            <input style={s.input} type="number" value={calcAmount} onChange={e => setCalcAmount(Math.max(100, +e.target.value))} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:6 }}>{t.duration}: <span style={{ color:calcPlan.color, fontWeight:700 }}>{calcMonths} {isAr ? 'أشهر' : 'mo'}</span></label>
            <input type="range" min="1" max="36" value={calcMonths} onChange={e => setCalcMonths(+e.target.value)} style={{ width:'100%', accentColor:calcPlan.color, marginTop:8 }} />
          </div>
        </div>
        {/* Plan selector */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          {PLANS.map(p => (
            <button key={p.id} onClick={() => setCalcPlan(p)}
              style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${p.color}${calcPlan.id === p.id ? '' : '44'}`, cursor:'pointer', fontSize:12, fontWeight:600,
                background: calcPlan.id === p.id ? p.color : 'transparent', color: calcPlan.id === p.id ? '#000' : p.color, transition:'all .2s' }}>
              {isAr ? p.nameAr : p.name} {p.apy}%
            </button>
          ))}
        </div>
        {/* Compound frequency */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>{t.compFreq}:</span>
          {['daily','monthly','annually'].map(f => (
            <button key={f} onClick={() => setCompFreq(f)}
              style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${calcPlan.color}${compFreq===f?'':'44'}`, cursor:'pointer', fontSize:11, fontWeight:600,
                background: compFreq===f ? calcPlan.color : 'transparent', color: compFreq===f ? '#000' : calcPlan.color, transition:'all .2s' }}>
              {t[f]}
            </button>
          ))}
        </div>
        {/* Chart */}
        <CompoundChart amount={calcAmount} apy={calcPlan.apy} months={calcMonths} color={calcPlan.color} compFreq={compFreq} isAr={isAr} />
        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginTop:16 }}>
          {[
            { l:t.monthly, v:`$${(calcAmount * calcPlan.apy / 100 / 12).toFixed(2)}` },
            { l:t.annual,  v:`$${(calcAmount * calcPlan.apy / 100).toFixed(2)}` },
            { l:t.totalAtMaturity, v:`$${(calcAmount * Math.pow(1 + calcPlan.apy / 100 / 12, calcMonths)).toFixed(2)}` },
          ].map(it => (
            <div key={it.l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'12px', textAlign:'center' }}>
              <div style={{ fontSize:16, fontWeight:700, color:calcPlan.color }}>{it.v}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:3 }}>{it.l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Plan comparison */}
      <div style={s.card}>
        <h3 style={{ margin:'0 0 14px', fontSize:14, fontWeight:700 }}>{t.comparison}</h3>
        <PlanCompare amount={calcAmount} months={calcMonths} isAr={isAr} />
      </div>
    </div>
  );

  /* ══ HISTORY TAB ══ */
  const historyTab = (
    <div style={{ ...s.card, overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            {[t.type, t.myPlan, isAr ? 'المبلغ' : 'Amount', t.date, t.status].map(h => (
              <th key={h} style={{ padding:'10px 8px', color:'rgba(255,255,255,0.4)', fontWeight:600, textAlign:isAr?'right':'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HISTORY.map(item => (
            <tr key={item.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <td style={{ padding:'10px 8px' }}>
                <span style={{ ...s.badge(item.type === 'invest' ? '#6366f1' : '#10b981') }}>
                  {item.type === 'invest' ? t.invest : t.payout}
                </span>
              </td>
              <td style={{ padding:'10px 8px' }}>{item.plan}</td>
              <td style={{ padding:'10px 8px', fontWeight:700, color: item.type === 'payout' ? '#10b981' : '#fff' }}>
                {item.type === 'payout' ? '+' : ''}${item.amount.toLocaleString()}
              </td>
              <td style={{ padding:'10px 8px', color:'rgba(255,255,255,0.45)' }}>{item.date}</td>
              <td style={{ padding:'10px 8px' }}>
                <span style={{ ...s.badge(item.status === 'completed' ? '#10b981' : '#D4A843') }}>
                  {item.status === 'completed' ? t.completed : t.active}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ══ SUBSCRIBE MODAL ══ */
  const subscribeModal = modal && selectedPlan && (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}
      onClick={() => modalStep < 3 && setModal(false)}>
      <div style={{ ...s.card, width:420, maxWidth:'92vw', borderColor:`${selectedPlan.color}40` }} onClick={e => e.stopPropagation()}>
        {modalStep < 3 ? (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <h3 style={{ margin:0, fontSize:17 }}>{isAr ? selectedPlan.nameAr : selectedPlan.name}</h3>
                <span style={{ ...s.badge(selectedPlan.color) }}>{selectedPlan.apy}% APY</span>
              </div>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'#fff', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            {modalStep === 1 ? (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                  {[
                    { l:'APY', v:`${selectedPlan.apy}%`, c:selectedPlan.color },
                    { l:t.lockPeriod, v: selectedPlan.lock === 0 ? t.flexible : `${selectedPlan.lock} ${t.days}`, c:'#fff' },
                  ].map(row => (
                    <div key={row.l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>{row.l}</div>
                      <div style={{ fontWeight:700, color:row.c }}>{row.v}</div>
                    </div>
                  ))}
                </div>
                {/* Auto-compound toggle */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.07)', marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>{t.autoCompound}</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>{isAr ? 'إعادة استثمار الأرباح تلقائياً' : 'Automatically reinvest earnings'}</div>
                  </div>
                  <button onClick={() => setAutoCompound(a => !a)} style={{ ...s.toggle(autoCompound) }}>
                    <div style={{ position:'absolute', top:3, left: autoCompound ? 21 : 3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
                  </button>
                </div>
                <label style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:6 }}>{t.amount}</label>
                <input style={{ ...s.input, marginBottom:8 }} type="number"
                  placeholder={`Min $${selectedPlan.minAmount}`}
                  value={modalAmount} onChange={e => setModalAmount(e.target.value)} />
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', marginBottom:14 }}>
                  Min: ${selectedPlan.minAmount.toLocaleString()} · Max: ${selectedPlan.maxAmount.toLocaleString()}
                </div>
                {+modalAmount >= selectedPlan.minAmount && (
                  <div style={{ background:'rgba(16,185,129,0.08)', borderRadius:10, padding:12, marginBottom:14, border:'1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:4 }}>{t.expectedReturn} ({isAr ? 'سنويًا' : 'annual'})</div>
                    <div style={{ fontSize:22, fontWeight:800, color:'#10b981' }}>
                      +${(+modalAmount * selectedPlan.apy / 100).toFixed(2)}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:4 }}>
                      {isAr ? 'شهريًا:' : 'Monthly:'} ${(+modalAmount * selectedPlan.apy / 100 / 12).toFixed(2)}
                    </div>
                  </div>
                )}
                <button style={{ ...s.btn(selectedPlan.color, true) }}
                  onClick={() => +modalAmount >= selectedPlan.minAmount && setModalStep(2)}>
                  {t.subscribe}
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', marginBottom:16 }}>{t.step2}</div>
                {[
                  { l:isAr ? 'الخطة' : 'Plan', v: isAr ? selectedPlan.nameAr : selectedPlan.name },
                  { l:t.amount, v:`$${(+modalAmount).toLocaleString()} USDT` },
                  { l:'APY', v:`${selectedPlan.apy}%` },
                  { l:t.lockPeriod, v: selectedPlan.lock === 0 ? t.flexible : `${selectedPlan.lock} ${t.days}` },
                  { l:t.autoCompound, v: autoCompound ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No') },
                  { l:t.expectedReturn, v:`$${(+modalAmount * selectedPlan.apy / 100).toFixed(2)}/yr` },
                ].map(row => (
                  <div key={row.l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13 }}>
                    <span style={{ color:'rgba(255,255,255,0.45)' }}>{row.l}</span>
                    <span style={{ fontWeight:600 }}>{row.v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'center', gap:8, margin:'16px 0' }}>
                  <input type="checkbox" id="agreeChk" />
                  <label htmlFor="agreeChk" style={{ fontSize:12, color:'rgba(255,255,255,0.5)', cursor:'pointer' }}>{t.agreedTerms}</label>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button style={{ ...s.ghostBtn(), flex:1 }} onClick={() => setModalStep(1)}>{isAr ? '→ رجوع' : '← Back'}</button>
                  <button
                    disabled={investing}
                    style={{ ...s.btn(selectedPlan.color, false), flex:2, opacity: investing ? 0.7 : 1 }}
                    onClick={async () => {
                      // Try real API first using matching DB product; fall back to demo step
                      const matchProd = dbProducts.find(p =>
                        Math.abs((p.apy_min || 0) - selectedPlan.apy) < 2 ||
                        (p.lock_days || 0) === selectedPlan.lock
                      );
                      if (matchProd) {
                        await handleInvest(matchProd.id, modalAmount, autoCompound);
                      }
                      setModalStep(3);
                    }}>
                    {investing ? '…' : t.confirm}
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ textAlign:'center', padding:'30px 0' }}>
            <div style={{ fontSize:56, marginBottom:8 }}>🎉</div>
            <div style={{ fontSize:17, fontWeight:700, color:'#10b981', marginBottom:6 }}>{t.successMsg}</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:24 }}>
              {isAr ? `بدأ استثمارك بمبلغ $${(+modalAmount).toLocaleString()} بعائد ${selectedPlan.apy}%` : `Your $${(+modalAmount).toLocaleString()} investment starts earning ${selectedPlan.apy}% APY`}
            </div>
            <button style={{ ...s.btn(selectedPlan.color) }} onClick={() => { setModal(false); setActiveTab('myinv'); }}>
              {t.myInv} →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  /* ══ STAKE MODAL ══ */
  const stakeModalEl = stakeModal && (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)' }}
      onClick={() => setStakeModal(null)}>
      <div style={{ ...s.card, width:380, maxWidth:'92vw', borderColor:`${stakeModal.color}40` }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:`${stakeModal.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>{stakeModal.badge}</div>
            <div>
              <div style={{ fontWeight:700, fontSize:16 }}>{stakeModal.token}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{stakeModal.name}</div>
            </div>
          </div>
          <button onClick={() => setStakeModal(null)} style={{ background:'none', border:'none', color:'#fff', fontSize:22, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:18 }}>
          {[
            { l:'APY', v:`${stakeModal.apy}%`, c:stakeModal.color },
            { l:t.lockPeriod, v: stakeModal.lock === 0 ? t.flexible : `${stakeModal.lock}d`, c:'#fff' },
            { l:t.risk, v:stakeModal.risk, c:RISK_COLORS[stakeModal.risk] },
            { l:t.tvl, v:stakeModal.tvl, c:'rgba(255,255,255,0.7)' },
          ].map(row => (
            <div key={row.l} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'10px 12px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginBottom:2 }}>{row.l}</div>
              <div style={{ fontWeight:700, color:row.c }}>{row.v}</div>
            </div>
          ))}
        </div>
        <label style={{ fontSize:12, color:'rgba(255,255,255,0.45)', display:'block', marginBottom:6 }}>{t.amount} ({stakeModal.token})</label>
        <input style={{ ...s.input, marginBottom:14 }} type="number" placeholder={`Min ${stakeModal.minAmt} ${stakeModal.token}`} />
        <button style={{ ...s.btn(stakeModal.color, true) }} onClick={() => setStakeModal(null)}>
          {t.stakeNow}
        </button>
      </div>
    </div>
  );

  /* ══ RENDER ══ */
  return (
    <div style={s.wrap}>
      {subscribeModal}
      {stakeModalEl}
      {statsRow}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {TABS.map(tab => (
          <button key={tab.id} style={s.tabBtn(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>
      {activeTab === 'plans'   && plansTab}
      {activeTab === 'staking' && stakingTab}
      {activeTab === 'myinv'  && myInvTab}
      {activeTab === 'calc'   && calcTab}
      {activeTab === 'history' && historyTab}
    </div>
  );
}
