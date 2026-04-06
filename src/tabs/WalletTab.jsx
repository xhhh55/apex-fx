/* eslint-disable */
import { useState, useEffect, useMemo, useCallback } from 'react';

/* ── Simulated QR Code SVG ── */
const generateQRMatrix = (text) => {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
    if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
      matrix[r][c] = true; matrix[r][size - 1 - c] = true; matrix[size - 1 - r][c] = true;
    }
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  for (let r = 8; r < size - 8; r++) for (let c = 8; c < size - 8; c++)
    matrix[r][c] = ((hash ^ (r * 7 + c * 13)) & 1) === 1;
  return matrix;
};

const QRCodeSVG = ({ value, size = 160 }) => {
  const matrix = useMemo(() => generateQRMatrix(value), [value]);
  const cell = size / matrix.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius: 8 }}>
      <rect width={size} height={size} fill="white" rx="8" />
      {matrix.map((row, r) => row.map((on, c) => on ? (
        <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#000" />
      ) : null))}
    </svg>
  );
};

/* ── Donut Chart ── */
const DonutChart = ({ data, size = 130 }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let offset = 0;
  const r = 44, cx = size / 2, cy = size / 2, stroke = 18;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const pct = d.value / total;
        const dash = circ * pct;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
            strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset * circ}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray .5s' }} />
        );
        offset += pct;
        return el;
      })}
    </svg>
  );
};

/* ── Mini Sparkline ── */
const Sparkline = ({ data, color, width = 80, height = 32 }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) + 2}`).join(' ');
  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={`wSpark_${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#wSpark_${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ── Constants ── */
const PRICES_INIT = { USDT: 1, BTC: 67500, ETH: 3200, BNB: 580 };
const COLORS = { USDT: '#26a17b', BTC: '#f7931a', ETH: '#627eea', BNB: '#f3ba2f' };
const NETWORKS = {
  USDT: ['TRC20', 'ERC20', 'BEP20'],
  BTC:  ['BTC (Native)', 'BEP20'],
  ETH:  ['ERC20', 'BEP20'],
  BNB:  ['BEP20', 'BSC'],
};
const NET_INFO = {
  TRC20:           { fee: '1 USDT',    min: '10 USDT',   conf: 20 },
  ERC20:           { fee: '5 USDT',    min: '50 USDT',   conf: 12 },
  BEP20:           { fee: '0.5 USDT',  min: '5 USDT',    conf: 15 },
  'BTC (Native)':  { fee: '0.0001 BTC',min: '0.001 BTC', conf: 3  },
  BSC:             { fee: '0.001 BNB', min: '0.01 BNB',  conf: 15 },
};
const ADDRESSES = {
  'USDT-TRC20':         'TRX7xK9mNpQw3LzA8bRc2YdE5fGhJkMnPq',
  'USDT-ERC20':         '0x4aF3b8C9dE2f1A7c6B5e0D4F8G2H3I9J0K1L',
  'USDT-BEP20':         '0xBEP2081aF3b8C9dE2f1A7c6B5e0D4F8G2H3I',
  'BTC-BTC (Native)':   '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R',
  'ETH-ERC20':          '0xETH4aF3b8C9dE2f1A7c6B5e0D4F8G2H3I9J',
  'BNB-BEP20':          '0xBNB4aF3b8C9dE2f1A7c6B5e0D4F8G2H3I9J',
};
const P2P_ADS = [
  { id:1, type:'buy',  asset:'USDT', price:3.68, currency:'SAR', minAmt:500,  maxAmt:20000, method:'Bank Transfer', seller:'Ahmad_FX',   completion:99, trades:1240, online:true  },
  { id:2, type:'buy',  asset:'USDT', price:3.67, currency:'SAR', minAmt:100,  maxAmt:10000, method:'STC Pay',       seller:'TradeMaster', completion:98, trades:873,  online:true  },
  { id:3, type:'sell', asset:'USDT', price:3.70, currency:'SAR', minAmt:1000, maxAmt:50000, method:'Bank Transfer', seller:'CryptoKing',  completion:97, trades:2150, online:false },
  { id:4, type:'buy',  asset:'USDT', price:3.66, currency:'SAR', minAmt:200,  maxAmt:30000, method:'Mada',          seller:'SwiftPay',    completion:100,trades:445,  online:true  },
  { id:5, type:'sell', asset:'USDT', price:3.71, currency:'SAR', minAmt:500,  maxAmt:15000, method:'STC Pay',       seller:'FX_Pro',      completion:96, trades:712,  online:true  },
];

const initWallet = () => {
  try { const s = localStorage.getItem('wallet_balances'); if (s) return JSON.parse(s); } catch {}
  return { USDT: 10000, BTC: 0.25, ETH: 3.8, BNB: 12 };
};
const initTxs = () => {
  try { const s = localStorage.getItem('wallet_txs'); if (s) return JSON.parse(s); } catch {}
  return [
    { id:1, type:'deposit',  asset:'USDT', amount:5000, network:'TRC20',       status:'completed', time:'2024-01-15 14:23', hash:'abc123def' },
    { id:2, type:'trade',    asset:'BTC',  amount:0.05, network:null,           status:'completed', time:'2024-01-14 09:11', hash:'def456abc' },
    { id:3, type:'withdraw', asset:'ETH',  amount:0.5,  network:'ERC20',        status:'pending',   time:'2024-01-13 18:44', hash:'ghi789xyz' },
    { id:4, type:'bonus',    asset:'USDT', amount:100,  network:null,           status:'completed', time:'2024-01-12 12:00', hash:'jkl012mno' },
    { id:5, type:'deposit',  asset:'BNB',  amount:5,    network:'BEP20',        status:'completed', time:'2024-01-11 08:30', hash:'mno345pqr' },
    { id:6, type:'trade',    asset:'ETH',  amount:0.2,  network:null,           status:'completed', time:'2024-01-10 16:45', hash:'pqr678stu' },
  ];
};

const T = {
  en: {
    wallet:'Wallet', overview:'Overview', deposit:'Deposit', withdraw:'Withdraw',
    history:'History', security:'Security', p2p:'P2P', convert:'Convert',
    totalBalance:'Total Balance', totalValue:'Total Value', asset:'Asset',
    network:'Network', address:'Deposit Address', copy:'Copy', copied:'Copied!',
    fee:'Fee', min:'Min Amount', conf:'Confirmations', amount:'Amount', max:'MAX',
    toAddress:'To Address', next:'Next', confirm:'Confirm Withdrawal',
    enterOTP:'Enter OTP', sent:'OTP sent to your email', verify:'Verify & Withdraw',
    success:'Withdrawal Submitted!', allTypes:'All', twofa:'2FA Setup',
    loginHistory:'Login History', scan2FA:'Scan with Google Authenticator',
    quickActions:'Quick Actions', recentTxs:'Recent Transactions',
    allocation:'Asset Allocation', newWithdrawal:'New Withdrawal',
    available:'Available', convertFrom:'From', convertTo:'To',
    convertRate:'Rate', convertBtn:'Convert Now',
    p2pBuy:'Buy', p2pSell:'Sell', p2pAmount:'Amount',
    p2pMethod:'Payment Method', p2pTrade:'Trade',
    ipWhitelist:'IP Whitelist', addIP:'Add IP Address',
    twoFaEnabled:'2FA Enabled', twoFaDisabled:'2FA Disabled',
    enable:'Enable', disable:'Disable',
    withdrawLimit:'Daily Withdrawal Limit', balanceHistory:'Balance History',
    days7:'7D', days30:'30D', days90:'90D',
  },
  ar: {
    wallet:'المحفظة', overview:'نظرة عامة', deposit:'إيداع', withdraw:'سحب',
    history:'السجل', security:'الأمان', p2p:'P2P', convert:'تحويل',
    totalBalance:'الرصيد الكلي', totalValue:'القيمة الكلية', asset:'الأصل',
    network:'الشبكة', address:'عنوان الإيداع', copy:'نسخ', copied:'تم النسخ!',
    fee:'الرسوم', min:'الحد الأدنى', conf:'التأكيدات', amount:'المبلغ', max:'الحد الأقصى',
    toAddress:'عنوان المستلم', next:'التالي', confirm:'تأكيد السحب',
    enterOTP:'أدخل رمز OTP', sent:'تم إرسال الرمز إلى بريدك', verify:'تحقق وسحب',
    success:'تم تقديم طلب السحب!', allTypes:'الكل', twofa:'إعداد 2FA',
    loginHistory:'سجل الدخول', scan2FA:'امسح بـ Google Authenticator',
    quickActions:'إجراءات سريعة', recentTxs:'المعاملات الأخيرة',
    allocation:'توزيع الأصول', newWithdrawal:'سحب جديد',
    available:'متاح', convertFrom:'من', convertTo:'إلى',
    convertRate:'السعر', convertBtn:'تحويل الآن',
    p2pBuy:'شراء', p2pSell:'بيع', p2pAmount:'المبلغ',
    p2pMethod:'طريقة الدفع', p2pTrade:'تداول',
    ipWhitelist:'قائمة IP البيضاء', addIP:'أضف عنوان IP',
    twoFaEnabled:'2FA مفعّل', twoFaDisabled:'2FA معطّل',
    enable:'تفعيل', disable:'تعطيل',
    withdrawLimit:'حد السحب اليومي', balanceHistory:'سجل الرصيد',
    days7:'7 أيام', days30:'30 يوم', days90:'90 يوم',
  },
};

const WalletTab = ({ theme, lang, user }) => {
  const isAr = lang === 'ar';
  const t = T[isAr ? 'ar' : 'en'];
  const P = theme?.primary || '#D4A843';

  const C = {
    card:    'rgba(255,255,255,0.025)',
    card2:   'rgba(255,255,255,0.04)',
    border:  'rgba(255,255,255,0.07)',
    border2: 'rgba(255,255,255,0.12)',
    sub:     'rgba(238,232,218,0.42)',
    text:    '#EEE8DA',
    green:   '#4ADE80',
    red:     '#E05252',
    blue:    '#60A5FA',
    yellow:  '#FBBF24',
    bg:      '#070A0F',
  };

  /* ── State ── */
  const [activeTab, setActiveTab]   = useState('overview');
  const [balances,  setBalances]    = useState(initWallet);
  const [prices,    setPrices]      = useState(PRICES_INIT);
  const [txs,       setTxs]         = useState(initTxs);
  const [depAsset,  setDepAsset]    = useState('USDT');
  const [depNet,    setDepNet]      = useState('TRC20');
  const [wdAsset,   setWdAsset]     = useState('USDT');
  const [wdNet,     setWdNet]       = useState('TRC20');
  const [wdAmount,  setWdAmount]    = useState('');
  const [wdAddr,    setWdAddr]      = useState('');
  const [wdStep,    setWdStep]      = useState(1);
  const [otp,       setOtp]         = useState(['','','','','','']);
  const [histFilter,setHistFilter]  = useState('all');
  const [toast,     setToast]       = useState(null);
  const [convFrom,  setConvFrom]    = useState('BTC');
  const [convTo,    setConvTo]      = useState('USDT');
  const [convAmt,   setConvAmt]     = useState('');
  const [convDone,  setConvDone]    = useState(false);
  const [p2pMode,   setP2pMode]     = useState('buy');
  const [twoFaOn,   setTwoFaOn]     = useState(false);
  const [histRange, setHistRange]   = useState('7D');
  const [sparkData] = useState(() => ({
    USDT: Array.from({length:14}, (_,i) => 1 + Math.sin(i)*0.001),
    BTC:  Array.from({length:14}, (_,i) => 65000 + Math.sin(i*0.8)*3000),
    ETH:  Array.from({length:14}, (_,i) => 3000  + Math.cos(i*0.9)*400),
    BNB:  Array.from({length:14}, (_,i) => 560   + Math.sin(i*1.1)*30),
  }));

  /* ── Live price updates ── */
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices(p => ({
        USDT: 1,
        BTC: p.BTC * (1 + (Math.random()-0.5)*0.002),
        ETH: p.ETH * (1 + (Math.random()-0.5)*0.003),
        BNB: p.BNB * (1 + (Math.random()-0.5)*0.003),
      }));
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => { localStorage.setItem('wallet_balances', JSON.stringify(balances)); }, [balances]);
  useEffect(() => { localStorage.setItem('wallet_txs', JSON.stringify(txs)); }, [txs]);

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const totalUSD = useMemo(() =>
    Object.entries(balances).reduce((s,[a,v]) => s + v * prices[a], 0), [balances, prices]);

  const donutData = useMemo(() =>
    Object.entries(balances).map(([a,v]) => ({ label:a, value:v*prices[a], color:COLORS[a] })), [balances, prices]);

  const depAddress = ADDRESSES[`${depAsset}-${depNet}`] || 'Address not available';

  const handleCopy = () => {
    navigator.clipboard.writeText(depAddress).catch(()=>{});
    showToast(isAr ? 'تم نسخ العنوان' : 'Address copied to clipboard');
  };

  const handleWithdraw = () => {
    if (wdStep === 1) {
      if (!wdAmount || !wdAddr) return;
      setWdStep(2);
    } else if (wdStep === 2) {
      if (otp.join('').length < 6) return;
      const newTx = {
        id: Date.now(), type:'withdraw', asset:wdAsset, amount:parseFloat(wdAmount),
        network:wdNet, status:'pending', time: new Date().toLocaleString(), hash: Math.random().toString(36).slice(2,10),
      };
      setTxs(prev => [newTx, ...prev]);
      setBalances(prev => ({ ...prev, [wdAsset]: Math.max(0, prev[wdAsset] - parseFloat(wdAmount)) }));
      setWdStep(3);
      showToast(isAr ? 'تم تقديم طلب السحب' : 'Withdrawal request submitted');
    }
  };

  const handleConvert = () => {
    const amt = parseFloat(convAmt);
    if (!amt || !convFrom || !convTo || convFrom === convTo) return;
    const usdVal = amt * prices[convFrom];
    const toAmt = usdVal / prices[convTo];
    setBalances(prev => ({
      ...prev,
      [convFrom]: Math.max(0, prev[convFrom] - amt),
      [convTo]:   prev[convTo] + toAmt,
    }));
    setConvDone(true);
    showToast(isAr ? `تم تحويل ${amt} ${convFrom} إلى ${toAmt.toFixed(6)} ${convTo}` : `Converted ${amt} ${convFrom} → ${toAmt.toFixed(6)} ${convTo}`);
    setTimeout(() => { setConvAmt(''); setConvDone(false); }, 2500);
  };

  const filteredTxs = histFilter === 'all' ? txs : txs.filter(tx => tx.type === histFilter);

  const convRate = convFrom && convTo && convFrom !== convTo
    ? (prices[convFrom] / prices[convTo]).toFixed(6) : null;

  /* ── Style helpers ── */
  const card = (extra={}) => ({
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, ...extra,
  });
  const inp = {
    width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.05)',
    border:`1px solid ${C.border}`, borderRadius:9, color:C.text,
    fontSize:13, fontFamily:'inherit', outline:'none', boxSizing:'border-box',
  };
  const tabBtn = (active) => ({
    padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer',
    fontSize:12, fontWeight:700, transition:'all 0.15s',
    background: active ? `${P}22` : 'rgba(255,255,255,0.04)',
    color: active ? P : C.sub,
    borderBottom: active ? `2px solid ${P}` : '2px solid transparent',
  });
  const TX_ICONS = { deposit:'↓', withdraw:'↑', trade:'⇄', bonus:'🎁', p2p:'P2P', convert:'⇌' };
  const TX_COLORS = { deposit:C.green, withdraw:C.red, trade:C.blue, bonus:C.yellow, p2p:P, convert:'#A78BFA' };

  const loginHistory = [
    { device:'Chrome / Windows', location:'Dubai, UAE',   time:'2024-01-15 14:23', status:'success' },
    { device:'Mobile / iOS',     location:'Dubai, UAE',   time:'2024-01-14 09:11', status:'success' },
    { device:'Firefox / Mac',    location:'Unknown',      time:'2024-01-13 03:44', status:'blocked' },
  ];

  /* ── Balance history (simulated) ── */
  const balHistPoints = useMemo(() => {
    const days = histRange==='7D'?7:histRange==='30D'?30:90;
    return Array.from({length:days},(_,i)=>({
      d: i,
      v: totalUSD * (0.85 + 0.15 * Math.sin(i * 0.4) + (i/days)*0.1),
    }));
  }, [histRange, totalUSD]);

  const balHistSVG = (() => {
    if (!balHistPoints.length) return null;
    const W=460, H=100, PAD=10;
    const vals = balHistPoints.map(p=>p.v);
    const mn = Math.min(...vals)*0.98, mx = Math.max(...vals)*1.02;
    const sx = (i) => PAD + (i/(balHistPoints.length-1))*(W-PAD*2);
    const sy = (v) => H-PAD - ((v-mn)/(mx-mn||1))*(H-PAD*2);
    const path = balHistPoints.map((p,i) => `${i===0?'M':'L'}${sx(i)},${sy(p.v)}`).join(' ');
    const area = `${path} L${sx(balHistPoints.length-1)},${H-PAD} L${sx(0)},${H-PAD} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block'}}>
        <defs>
          <linearGradient id="balHist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={P} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={P} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#balHist)"/>
        <path d={path} fill="none" stroke={P} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {[0,0.5,1].map(f => (
          <text key={f} x={PAD} y={sy(mn+(mx-mn)*f)+3} fontSize="8" fill="rgba(255,255,255,0.25)">
            ${((mn+(mx-mn)*f)/1000).toFixed(0)}K
          </text>
        ))}
      </svg>
    );
  })();

  return (
    <div style={{ fontFamily:isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif", direction:isAr?'rtl':'ltr', color:C.text, padding:'0 0 40px', animation:'walletFadeUp .3s ease' }}>
      <style>{`
        @keyframes walletFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wSlideIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wPulse{0%,100%{opacity:1}50%{opacity:.4}}
        .w-tab-btn:hover{opacity:.85}
        @media(max-width:700px){.wallet-grid{grid-template-columns:1fr !important}}
      `}</style>

      {/* ══ TOAST ══ */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:isAr?'auto':24, left:isAr?24:'auto', zIndex:9999,
          padding:'12px 20px', borderRadius:12, fontWeight:700, fontSize:13,
          background: toast.type==='success'?'rgba(74,222,128,0.15)':toast.type==='error'?'rgba(224,82,82,0.15)':'rgba(96,165,250,0.15)',
          border:`1px solid ${toast.type==='success'?'rgba(74,222,128,0.4)':toast.type==='error'?'rgba(224,82,82,0.4)':'rgba(96,165,250,0.4)'}`,
          color: toast.type==='success'?C.green:toast.type==='error'?C.red:C.blue,
          backdropFilter:'blur(12px)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', animation:'wSlideIn .3s ease' }}>
          {toast.type==='success'?'✓':toast.type==='error'?'✕':'ℹ'} {toast.msg}
        </div>
      )}

      {/* ══ HEADER ══ */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${P},${P}88)`,
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>💳</div>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:900, color:'#fff' }}>{t.wallet}</h2>
          <div style={{ fontSize:12, color:C.sub }}>
            {isAr?'إدارة أصولك الرقمية':'Manage your digital assets'}
          </div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.green, animation:'wPulse 2s infinite' }}/>
          <span style={{ fontSize:11, color:C.green, fontWeight:700 }}>{isAr?'محفظة نشطة':'Wallet Active'}</span>
        </div>
      </div>

      {/* ══ TAB NAV ══ */}
      <div style={{ display:'flex', gap:4, marginBottom:20, flexWrap:'wrap' }}>
        {['overview','deposit','withdraw','convert','p2p','history','security'].map(tab => (
          <button key={tab} className="w-tab-btn" onClick={() => setActiveTab(tab)} style={tabBtn(activeTab===tab)}>
            {tab==='overview'?(isAr?'📊 نظرة':'📊 Overview'):
             tab==='deposit'? (isAr?'↓ إيداع':'↓ Deposit'):
             tab==='withdraw'?(isAr?'↑ سحب':'↑ Withdraw'):
             tab==='convert'? (isAr?'⇌ تحويل':'⇌ Convert'):
             tab==='p2p'?     (isAr?'P2P':'P2P'):
             tab==='history'? (isAr?'📋 السجل':'📋 History'):
                              (isAr?'🔒 الأمان':'🔒 Security')}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Total balance card */}
          <div style={{ ...card(), padding:'20px 24px', background:`linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, right:0, width:200, height:200, background:`radial-gradient(circle,${P}08 0%,transparent 70%)`, borderRadius:'50%' }} />
            <div style={{ fontSize:11, color:C.sub, fontWeight:700, letterSpacing:'1.5px', marginBottom:4 }}>{t.totalBalance}</div>
            <div style={{ fontSize:36, fontWeight:900, color:'#fff', fontFamily:"'DM Mono',monospace", marginBottom:4 }}>
              ${totalUSD.toLocaleString('en', { maximumFractionDigits:2, minimumFractionDigits:2 })}
            </div>
            <div style={{ fontSize:12, color:C.green }}>↑ +2.4% {isAr?'اليوم':'today'}</div>
          </div>

          {/* Asset cards */}
          <div className="wallet-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {Object.entries(balances).map(([asset, bal]) => {
              const usdVal = bal * prices[asset];
              const pct = totalUSD > 0 ? (usdVal/totalUSD*100).toFixed(1) : '0';
              return (
                <div key={asset} style={{ ...card(), padding:'14px', cursor:'pointer' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=`${COLORS[asset]}44`}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:800, color:COLORS[asset] }}>{asset}</span>
                    <Sparkline data={sparkData[asset]} color={COLORS[asset]} />
                  </div>
                  <div style={{ fontSize:18, fontWeight:800, color:C.text, fontFamily:"'DM Mono',monospace" }}>
                    {bal.toLocaleString('en', { maximumFractionDigits:asset==='USDT'?2:6 })}
                  </div>
                  <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
                    ${usdVal.toLocaleString('en', { maximumFractionDigits:2 })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                    <span style={{ fontSize:10, color:C.sub }}>{pct}%</span>
                    <span style={{ fontSize:10, color:prices[asset]>PRICES_INIT[asset]?C.green:C.red }}>
                      ${prices[asset].toLocaleString('en',{maximumFractionDigits:asset==='USDT'?4:2})}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Allocation + Quick Actions */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ ...card(), padding:'16px' }}>
              <div style={{ fontSize:11, color:C.sub, fontWeight:700, marginBottom:12, letterSpacing:'1px' }}>
                {t.allocation}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <DonutChart data={donutData} size={120} />
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {donutData.map(d => (
                    <div key={d.label} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:d.color, flexShrink:0 }} />
                      <span style={{ color:C.text, fontWeight:700 }}>{d.label}</span>
                      <span style={{ color:C.sub, marginLeft:'auto' }}>
                        {totalUSD>0 ? (d.value/totalUSD*100).toFixed(1) : '0'}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ ...card(), padding:'16px' }}>
              <div style={{ fontSize:11, color:C.sub, fontWeight:700, marginBottom:12, letterSpacing:'1px' }}>
                {t.quickActions}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  { label:isAr?'إيداع':'Deposit',    tab:'deposit',  icon:'↓', col:C.green },
                  { label:isAr?'سحب':'Withdraw',      tab:'withdraw', icon:'↑', col:C.red   },
                  { label:isAr?'تحويل':'Convert',     tab:'convert',  icon:'⇌', col:'#A78BFA' },
                  { label:isAr?'سجل':'History',       tab:'history',  icon:'📋', col:C.blue  },
                ].map(a => (
                  <button key={a.tab} onClick={() => setActiveTab(a.tab)} style={{
                    padding:'10px 8px', borderRadius:10, border:`1px solid ${a.col}22`,
                    background:`${a.col}10`, color:a.col, cursor:'pointer',
                    fontSize:12, fontWeight:700, fontFamily:'inherit', transition:'all .15s',
                  }}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Balance history chart */}
          <div style={{ ...card(), padding:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontSize:11, color:C.sub, fontWeight:700, letterSpacing:'1px' }}>{t.balanceHistory}</span>
              <div style={{ display:'flex', gap:4 }}>
                {['7D','30D','90D'].map(r => (
                  <button key={r} onClick={() => setHistRange(r)} style={{
                    padding:'3px 8px', borderRadius:5, border:`1px solid ${histRange===r?P:C.border}`,
                    background: histRange===r?`${P}20`:'transparent', color:histRange===r?P:C.sub,
                    fontSize:10, fontWeight:700, cursor:'pointer',
                  }}>{isAr ? (r==='7D'?t.days7:r==='30D'?t.days30:t.days90) : r}</button>
                ))}
              </div>
            </div>
            {balHistSVG}
          </div>

          {/* Recent transactions */}
          <div style={{ ...card(), padding:'16px' }}>
            <div style={{ fontSize:11, color:C.sub, fontWeight:700, letterSpacing:'1px', marginBottom:12 }}>
              {t.recentTxs}
            </div>
            {txs.slice(0,5).map(tx => (
              <div key={tx.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0',
                borderBottom:`1px solid rgba(255,255,255,0.03)` }}>
                <div style={{ width:32, height:32, borderRadius:8, background:`${TX_COLORS[tx.type]}18`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, color:TX_COLORS[tx.type] }}>
                  {TX_ICONS[tx.type]||'•'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:C.text, textTransform:'capitalize' }}>{tx.type}</div>
                  <div style={{ fontSize:10, color:C.sub }}>{tx.time}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:['deposit','bonus'].includes(tx.type)?C.green:C.red, fontFamily:"'DM Mono',monospace" }}>
                    {['deposit','bonus'].includes(tx.type)?'+':'-'}{tx.amount} {tx.asset}
                  </div>
                  <div style={{ fontSize:10, color:tx.status==='completed'?C.green:C.yellow }}>{tx.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          DEPOSIT TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'deposit' && (
        <div style={{ maxWidth:520, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ ...card(), padding:20 }}>
            {/* Asset selector */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>{t.asset}</label>
              <div style={{ display:'flex', gap:8 }}>
                {Object.keys(NETWORKS).map(a => (
                  <button key={a} onClick={() => { setDepAsset(a); setDepNet(NETWORKS[a][0]); }} style={{
                    flex:1, padding:'8px 0', borderRadius:9,
                    border:`1px solid ${depAsset===a?COLORS[a]:C.border}`,
                    background: depAsset===a?`${COLORS[a]}18`:'transparent',
                    color: depAsset===a?COLORS[a]:C.sub,
                    fontSize:12, fontWeight:700, cursor:'pointer',
                  }}>{a}</button>
                ))}
              </div>
            </div>

            {/* Network selector */}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>{t.network}</label>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {NETWORKS[depAsset].map(n => (
                  <button key={n} onClick={() => setDepNet(n)} style={{
                    padding:'6px 14px', borderRadius:8,
                    border:`1px solid ${depNet===n?P:`${P}25`}`,
                    background: depNet===n?`${P}18`:'transparent',
                    color: depNet===n?P:C.sub, cursor:'pointer', fontSize:12, fontWeight:600,
                  }}>{n}</button>
                ))}
              </div>
            </div>

            {/* QR Code */}
            <div style={{ display:'flex', justifyContent:'center', marginBottom:20, padding:'16px', background:'rgba(255,255,255,0.03)', borderRadius:12 }}>
              <QRCodeSVG value={depAddress} size={160} />
            </div>

            {/* Address */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>{t.address}</label>
              <div style={{ display:'flex', gap:8 }}>
                <input readOnly value={depAddress} style={{ ...inp, fontSize:11, flex:1 }} />
                <button onClick={handleCopy} style={{
                  padding:'9px 14px', borderRadius:9, border:`1px solid ${P}44`,
                  background:`${P}18`, color:P, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
                }}>{t.copy}</button>
              </div>
            </div>

            {/* Network info */}
            {NET_INFO[depNet] && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {[[t.fee, NET_INFO[depNet].fee],[t.min, NET_INFO[depNet].min],[t.conf, NET_INFO[depNet].conf]].map(([label,val])=>(
                  <div key={label} style={{ background:'rgba(255,255,255,0.03)', borderRadius:9, padding:'10px', textAlign:'center' }}>
                    <div style={{ fontSize:10, color:C.sub, marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.text }}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          <div style={{ padding:'12px 16px', background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:10, fontSize:11, color:C.yellow, lineHeight:1.6 }}>
            ⚠️ {isAr
              ? `أرسل فقط ${depAsset} على شبكة ${depNet}. الإرسال بأصل أو شبكة خاطئة سيؤدي إلى فقدان الأموال.`
              : `Only send ${depAsset} on the ${depNet} network. Sending the wrong asset or network will result in permanent loss.`}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          WITHDRAW TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'withdraw' && (
        <div style={{ maxWidth:520 }}>
          <div style={{ ...card(), padding:20 }}>

            {wdStep === 1 && (
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:4 }}>
                  {isAr?'🔐 طلب سحب':'🔐 Withdrawal Request'}
                </div>

                {/* Asset */}
                <div>
                  <label style={{ fontSize:11, color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>{t.asset}</label>
                  <div style={{ display:'flex', gap:8 }}>
                    {Object.keys(NETWORKS).map(a => (
                      <button key={a} onClick={() => { setWdAsset(a); setWdNet(NETWORKS[a][0]); }} style={{
                        flex:1, padding:'7px 0', borderRadius:9,
                        border:`1px solid ${wdAsset===a?COLORS[a]:C.border}`,
                        background: wdAsset===a?`${COLORS[a]}18`:'transparent',
                        color: wdAsset===a?COLORS[a]:C.sub,
                        fontSize:12, fontWeight:700, cursor:'pointer',
                      }}>{a}</button>
                    ))}
                  </div>
                </div>

                {/* Network */}
                <div>
                  <label style={{ fontSize:11, color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>{t.network}</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {NETWORKS[wdAsset].map(n => (
                      <button key={n} onClick={() => setWdNet(n)} style={{
                        padding:'6px 14px', borderRadius:8, cursor:'pointer',
                        border:`1px solid ${wdNet===n?P:`${P}25`}`,
                        background: wdNet===n?`${P}18`:'transparent',
                        color: wdNet===n?P:C.sub, fontSize:12, fontWeight:600,
                      }}>{n}</button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <label style={{ fontSize:11, color:C.sub, fontWeight:700 }}>{t.amount}</label>
                    <span style={{ fontSize:10, color:C.sub }}>{t.available}: {balances[wdAsset]} {wdAsset}</span>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <input type="number" value={wdAmount} onChange={e=>setWdAmount(e.target.value)}
                      placeholder="0.00" style={{ ...inp, flex:1 }} />
                    <button onClick={() => setWdAmount(String(balances[wdAsset]))} style={{
                      padding:'9px 12px', borderRadius:9, border:`1px solid ${P}44`,
                      background:`${P}18`, color:P, fontSize:11, fontWeight:700, cursor:'pointer',
                    }}>{t.max}</button>
                  </div>
                  {wdAmount && <div style={{ fontSize:10, color:C.sub, marginTop:4 }}>≈ ${(parseFloat(wdAmount)*prices[wdAsset]).toFixed(2)} USD</div>}
                </div>

                {/* Address */}
                <div>
                  <label style={{ fontSize:11, color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>{t.toAddress}</label>
                  <input type="text" value={wdAddr} onChange={e=>setWdAddr(e.target.value)}
                    placeholder={isAr?'أدخل عنوان المحفظة...':'Enter wallet address...'} style={inp} />
                </div>

                {/* Fee info */}
                {NET_INFO[wdNet] && (
                  <div style={{ padding:'10px 14px', background:'rgba(96,165,250,0.07)', border:'1px solid rgba(96,165,250,0.2)', borderRadius:9, fontSize:11, color:C.blue }}>
                    {isAr?`رسوم الشبكة: ${NET_INFO[wdNet].fee}`:`Network fee: ${NET_INFO[wdNet].fee}`}
                  </div>
                )}

                <button onClick={handleWithdraw} style={{
                  padding:'13px 0', borderRadius:10, border:'none', cursor:'pointer',
                  background:`linear-gradient(135deg,${P},${P}bb)`, color:'#000',
                  fontSize:13, fontWeight:900, fontFamily:'inherit',
                  opacity: (!wdAmount||!wdAddr)?0.5:1,
                }}>{t.next} →</button>
              </div>
            )}

            {wdStep === 2 && (
              <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
                <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{t.confirm}</div>
                <div style={{ padding:'14px 20px', background:'rgba(255,255,255,0.03)', borderRadius:12, width:'100%' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:11, color:C.sub }}>{t.asset}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:COLORS[wdAsset] }}>{wdAsset}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:11, color:C.sub }}>{t.amount}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:C.text }}>{wdAmount} {wdAsset}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:11, color:C.sub }}>{t.toAddress}</span>
                    <span style={{ fontSize:11, color:C.text, fontFamily:'monospace' }}>{wdAddr.slice(0,10)}...{wdAddr.slice(-6)}</span>
                  </div>
                </div>
                <div style={{ fontSize:12, color:C.sub }}>{t.sent}</div>
                <div style={{ display:'flex', gap:8 }}>
                  {otp.map((v,i) => (
                    <input key={i} type="text" maxLength={1} value={v}
                      onChange={e => {
                        const n=[...otp]; n[i]=e.target.value; setOtp(n);
                        if (e.target.value && i<5) document.getElementById(`otp${i+1}`)?.focus();
                      }}
                      id={`otp${i}`}
                      style={{ width:44, height:52, textAlign:'center', fontSize:22, fontWeight:700,
                        borderRadius:10, border:`1px solid ${P}`, background:'rgba(255,255,255,0.07)',
                        color:'#fff', outline:'none', fontFamily:'monospace' }} />
                  ))}
                </div>
                <button onClick={handleWithdraw} style={{
                  padding:'13px 0', width:'100%', borderRadius:10, border:'none', cursor:'pointer',
                  background:`linear-gradient(135deg,${P},${P}bb)`, color:'#000', fontSize:13, fontWeight:900, fontFamily:'inherit',
                }}>{t.verify}</button>
              </div>
            )}

            {wdStep === 3 && (
              <div style={{ textAlign:'center', padding:'30px 0' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
                <div style={{ fontSize:20, fontWeight:800, color:C.green, marginBottom:8 }}>{t.success}</div>
                <div style={{ fontSize:12, color:C.sub, marginBottom:24 }}>
                  {isAr?'سيتم معالجة طلبك خلال 10-30 دقيقة':'Your request will be processed within 10-30 minutes'}
                </div>
                <button onClick={() => { setWdStep(1); setWdAmount(''); setWdAddr(''); setOtp(['','','','','','']); }} style={{
                  padding:'12px 24px', borderRadius:10, border:'none', cursor:'pointer',
                  background:`${P}18`, border:`1px solid ${P}`, color:P, fontSize:13, fontWeight:800, fontFamily:'inherit',
                }}>{t.newWithdrawal}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          CONVERT TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'convert' && (
        <div style={{ maxWidth:480, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ ...card(), padding:20 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:16 }}>
              ⇌ {isAr?'تحويل الأصول':'Asset Conversion'}
            </div>

            {/* From */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>{t.convertFrom}</label>
              <div style={{ display:'flex', gap:8 }}>
                <select value={convFrom} onChange={e=>setConvFrom(e.target.value)} style={{ ...inp, width:'auto' }}>
                  {Object.keys(balances).filter(a=>a!==convTo).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <input type="number" value={convAmt} onChange={e=>setConvAmt(e.target.value)}
                  placeholder="0.00" style={{ ...inp, flex:1 }} />
                <button onClick={() => setConvAmt(String(balances[convFrom]))} style={{
                  padding:'9px 10px', borderRadius:9, border:`1px solid ${P}44`,
                  background:`${P}18`, color:P, fontSize:11, fontWeight:700, cursor:'pointer',
                }}>{t.max}</button>
              </div>
              <div style={{ fontSize:10, color:C.sub, marginTop:4 }}>{t.available}: {balances[convFrom]?.toFixed(6)} {convFrom}</div>
            </div>

            {/* Swap arrow */}
            <div style={{ textAlign:'center', marginBottom:12 }}>
              <button onClick={() => { const tmp=convFrom; setConvFrom(convTo); setConvTo(tmp); }} style={{
                background:`${P}18`, border:`1px solid ${P}44`, borderRadius:'50%',
                width:36, height:36, fontSize:18, cursor:'pointer', color:P,
              }}>⇅</button>
            </div>

            {/* To */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, color:C.sub, fontWeight:700, display:'block', marginBottom:6 }}>{t.convertTo}</label>
              <div style={{ display:'flex', gap:8 }}>
                <select value={convTo} onChange={e=>setConvTo(e.target.value)} style={{ ...inp, width:'auto' }}>
                  {Object.keys(balances).filter(a=>a!==convFrom).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <div style={{ ...inp, flex:1, display:'flex', alignItems:'center', color:C.sub, fontSize:12, fontFamily:"'DM Mono',monospace" }}>
                  {convAmt && convRate ? (+convAmt * +convRate).toFixed(6) : '—'}
                </div>
              </div>
            </div>

            {/* Rate */}
            {convRate && (
              <div style={{ padding:'10px 14px', background:`${P}08`, border:`1px solid ${P}22`, borderRadius:9, fontSize:12, color:C.sub, marginBottom:16 }}>
                {t.convertRate}: 1 {convFrom} = {convRate} {convTo}
                <span style={{ color:C.sub, marginLeft:12 }}>≈ ${prices[convFrom]?.toFixed(2)}</span>
              </div>
            )}

            <button onClick={handleConvert} disabled={!convAmt||convFrom===convTo} style={{
              padding:'13px 0', width:'100%', borderRadius:10, border:'none', cursor:'pointer',
              background: convDone
                ? `linear-gradient(135deg,${C.green},#22C55E)`
                : `linear-gradient(135deg,${P},${P}bb)`,
              color:'#000', fontSize:13, fontWeight:900, fontFamily:'inherit',
              opacity: (!convAmt||convFrom===convTo)?0.5:1, transition:'background .3s',
            }}>{convDone ? '✓ Done!' : t.convertBtn}</button>
          </div>

          {/* Fee notice */}
          <div style={{ padding:'12px 16px', background:'rgba(74,222,128,0.07)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:10, fontSize:11, color:C.green }}>
            ✓ {isAr?'بدون رسوم تحويل — الصرف بالسعر الحالي':'Zero conversion fee — converted at live market rate'}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          P2P TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'p2p' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:6, marginBottom:4 }}>
            <button onClick={()=>setP2pMode('buy')} style={{
              padding:'8px 24px', borderRadius:9, border:`1px solid ${p2pMode==='buy'?C.green:`${C.green}22`}`,
              background: p2pMode==='buy'?`${C.green}18`:'transparent',
              color: p2pMode==='buy'?C.green:C.sub, fontSize:13, fontWeight:800, cursor:'pointer',
            }}>{isAr?'شراء':'Buy'}</button>
            <button onClick={()=>setP2pMode('sell')} style={{
              padding:'8px 24px', borderRadius:9, border:`1px solid ${p2pMode==='sell'?C.red:`${C.red}22`}`,
              background: p2pMode==='sell'?`${C.red}18`:'transparent',
              color: p2pMode==='sell'?C.red:C.sub, fontSize:13, fontWeight:800, cursor:'pointer',
            }}>{isAr?'بيع':'Sell'}</button>
          </div>

          {P2P_ADS.filter(ad => ad.type===p2pMode).map(ad => (
            <div key={ad.id} style={{ ...card(), padding:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:`${P}20`, border:`1px solid ${P}44`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:P }}>
                    {ad.seller.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{ad.seller}</div>
                    <div style={{ fontSize:10, color:C.sub }}>
                      {ad.completion}% {isAr?'اكتمال':'completion'} · {ad.trades} {isAr?'صفقة':'trades'}
                      <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:ad.online?C.green:'#666', marginLeft:6, verticalAlign:'middle' }}/>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:900, color:p2pMode==='buy'?C.green:C.red }}>
                    {ad.price} {ad.currency}
                  </div>
                  <div style={{ fontSize:10, color:C.sub }}>per {ad.asset}</div>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
                <div style={{ fontSize:11, color:C.sub }}>
                  <span>{ad.method}</span>
                  <span style={{ margin:'0 8px' }}>·</span>
                  <span>{ad.minAmt.toLocaleString()}–{ad.maxAmt.toLocaleString()} {ad.currency}</span>
                </div>
                <button style={{
                  padding:'6px 16px', borderRadius:8, border:'none', cursor:'pointer',
                  background: p2pMode==='buy'?`linear-gradient(135deg,${C.green},#22C55E)`:`linear-gradient(135deg,${C.red},#DC2626)`,
                  color:'#000', fontSize:12, fontWeight:800, fontFamily:'inherit',
                }}>{p2pMode==='buy'?(isAr?'شراء':'Buy'):(isAr?'بيع':'Sell')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HISTORY TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['all','deposit','withdraw','trade','bonus','p2p'].map(f => (
              <button key={f} onClick={() => setHistFilter(f)} style={{
                padding:'5px 12px', borderRadius:8, border:`1px solid ${histFilter===f?P:C.border}`,
                background: histFilter===f?`${P}18`:'transparent',
                color: histFilter===f?P:C.sub, fontSize:11, fontWeight:700, cursor:'pointer',
              }}>
                {f==='all'?(isAr?'الكل':'All'):f}
              </button>
            ))}
          </div>

          <div style={{ ...card(), overflow:'hidden' }}>
            {filteredTxs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:C.sub }}>
                <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
                {isAr?'لا توجد معاملات':'No transactions found'}
              </div>
            ) : filteredTxs.map((tx, i) => (
              <div key={tx.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
                borderBottom: i<filteredTxs.length-1 ? `1px solid rgba(255,255,255,0.03)` : 'none',
                background:'transparent' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:`${TX_COLORS[tx.type]||C.blue}18`,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:TX_COLORS[tx.type]||C.blue, flexShrink:0 }}>
                  {TX_ICONS[tx.type]||'•'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:12, fontWeight:700, color:C.text, textTransform:'capitalize' }}>{tx.type}</span>
                    <span style={{ fontSize:10, padding:'1px 7px', borderRadius:10,
                      background:`${COLORS[tx.asset]||P}18`, color:COLORS[tx.asset]||P, fontWeight:600 }}>{tx.asset}</span>
                    {tx.network && <span style={{ fontSize:10, color:C.sub }}>{tx.network}</span>}
                  </div>
                  <div style={{ fontSize:10, color:C.sub, fontFamily:'monospace' }}>{tx.hash?.slice(0,16)}...</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:['deposit','bonus'].includes(tx.type)?C.green:C.red, fontFamily:"'DM Mono',monospace" }}>
                    {['deposit','bonus'].includes(tx.type)?'+':'-'}{tx.amount} {tx.asset}
                  </div>
                  <div style={{ fontSize:10, marginTop:2 }}>
                    <span style={{ color:tx.status==='completed'?C.green:tx.status==='pending'?C.yellow:C.red }}>
                      ● {tx.status}
                    </span>
                    <span style={{ color:C.sub, marginLeft:8 }}>{tx.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECURITY TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {/* 2FA */}
          <div style={{ ...card(), padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:'#fff' }}>🔐 {t.twofa}</div>
                <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
                  {isAr?'مصادقة ثنائية لحماية حسابك':'Two-factor authentication for account protection'}
                </div>
              </div>
              <button onClick={() => setTwoFaOn(v=>!v)} style={{
                padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer',
                background: twoFaOn ? `linear-gradient(135deg,${C.green},#22C55E)` : 'rgba(255,255,255,0.08)',
                color: twoFaOn ? '#000' : C.sub, fontSize:12, fontWeight:700, fontFamily:'inherit',
              }}>{twoFaOn ? (isAr?'✓ مفعّل':'✓ Enabled') : (isAr?'تفعيل':'Enable')}</button>
            </div>
            {twoFaOn && (
              <div style={{ display:'flex', gap:20, alignItems:'center', padding:'16px', background:'rgba(74,222,128,0.05)', borderRadius:12, border:'1px solid rgba(74,222,128,0.2)', animation:'wSlideIn .3s ease' }}>
                <QRCodeSVG value="otpauth://totp/ApexFX?secret=JBSWY3DPEHPK3PXP" size={120} />
                <div>
                  <div style={{ fontSize:11, color:C.sub, marginBottom:8 }}>{t.scan2FA}</div>
                  <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:8, padding:'8px 12px', fontFamily:'monospace', fontSize:13, letterSpacing:3, color:P, marginBottom:8 }}>
                    JBSWY3DPEHPK3PXP
                  </div>
                  <div style={{ fontSize:10, color:C.sub }}>
                    {isAr?'الكود يتجدد كل 30 ثانية':'Code refreshes every 30 seconds'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Withdrawal limits */}
          <div style={{ ...card(), padding:20 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:12 }}>
              💸 {t.withdrawLimit}
            </div>
            {[
              { label:isAr?'يومي':'Daily',   limit:'$50,000',  used:'$2,400',  pct:4.8  },
              { label:isAr?'أسبوعي':'Weekly', limit:'$200,000', used:'$18,200', pct:9.1  },
              { label:isAr?'شهري':'Monthly',  limit:'$500,000', used:'$42,000', pct:8.4  },
            ].map((row,i) => (
              <div key={i} style={{ marginBottom:i<2?12:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.sub, marginBottom:4 }}>
                  <span>{row.label}</span>
                  <span>{row.used} / {row.limit}</span>
                </div>
                <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${row.pct}%`, background:P, borderRadius:3, transition:'width .5s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Login history */}
          <div style={{ ...card(), padding:20 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:12 }}>
              🌐 {t.loginHistory}
            </div>
            {loginHistory.map((l,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 0', borderBottom: i<loginHistory.length-1?`1px solid ${C.border}`:'none' }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{l.device}</div>
                  <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>{l.location} · {l.time}</div>
                </div>
                <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20,
                  background: l.status==='success'?`${C.green}15`:`${C.red}15`,
                  color: l.status==='success'?C.green:C.red }}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>

          {/* IP Whitelist */}
          <div style={{ ...card(), padding:20 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:12 }}>
              🛡️ {t.ipWhitelist}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input placeholder={isAr?'أدخل عنوان IP...':'Enter IP address...'} style={{ ...inp, flex:1 }} />
              <button style={{ padding:'9px 14px', borderRadius:9, border:`1px solid ${P}44`,
                background:`${P}18`, color:P, fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}>
                {t.addIP}
              </button>
            </div>
            <div style={{ fontSize:11, color:C.sub, marginTop:8 }}>
              {isAr?'ستحتاج تسجيل الدخول فقط من عناوين IP المعتمدة':'Only approved IPs will be allowed to log in'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletTab;
