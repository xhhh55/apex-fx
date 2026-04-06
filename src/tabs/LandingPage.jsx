/* ════════════════════════════════════════════════════════
   LANDING PAGE — Marketing / Pre-auth screen
   Props: theme, lang, onLogin, onRegister
════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useRef } from "react";

/* ── live ticker data ── */
const TICKERS = [
  { pair: 'EUR/USD', price: 1.0847, change: +0.0012, pct: +0.11 },
  { pair: 'GBP/USD', price: 1.2748, change: -0.0023, pct: -0.18 },
  { pair: 'XAU/USD', price: 2028.50, change: +8.40, pct: +0.42 },
  { pair: 'BTC/USD', price: 43250, change: +820, pct: +1.93 },
  { pair: 'ETH/USD', price: 2315, change: -34, pct: -1.45 },
  { pair: 'USD/JPY', price: 148.72, change: +0.34, pct: +0.23 },
  { pair: 'NAS100',  price: 17482, change: +124, pct: +0.71 },
  { pair: 'S&P500',  price: 4912,  change: +38,  pct: +0.78 },
];

const FEATURES = [
  { icon: '📊', en: 'Advanced Trading', ar: 'تداول متقدم',          descEn: 'Professional charts, real-time data, 50+ indicators',      descAr: 'رسوم احترافية، بيانات فورية، أكثر من 50 مؤشر' },
  { icon: '🤖', en: 'AI Signals',       ar: 'إشارات الذكاء الاصطناعي', descEn: 'AI-powered trade signals with 80%+ historical accuracy',   descAr: 'إشارات تداول مدعومة بالذكاء الاصطناعي بدقة 80%+' },
  { icon: '🔄', en: 'Copy Trading',     ar: 'نسخ التداول',          descEn: 'Follow top traders automatically, manage your risk',         descAr: 'انسخ كبار المتداولين تلقائيًا وتحكم في مخاطرك' },
  { icon: '📈', en: 'Investments',      ar: 'الاستثمارات',          descEn: 'Fixed plans with up to 18% APY, flexible or locked terms',   descAr: 'خطط ثابتة بعائد حتى 18% سنويًا' },
  { icon: '🏠', en: 'Real Estate',      ar: 'العقارات',             descEn: 'Fractional property investment starting from $500',           descAr: 'استثمار عقاري جزئي يبدأ من 500$' },
  { icon: '🔒', en: 'Bank-Grade Security', ar: 'أمان مصرفي',       descEn: '2FA, biometric login, cold storage, SSL encrypted',          descAr: '2FA، بصمة، تخزين بارد، تشفير SSL' },
];

const STATS = [
  { en: '$2.4B+',   ar: '+2.4 مليار $',  label_en: 'Trading Volume',      label_ar: 'حجم التداول' },
  { en: '120K+',    ar: '+120 ألف',       label_en: 'Active Traders',      label_ar: 'متداول نشط' },
  { en: '50+',      ar: '50+',            label_en: 'Assets Available',    label_ar: 'أصل متاح' },
  { en: '99.9%',    ar: '99.9%',          label_en: 'Uptime SLA',          label_ar: 'وقت التشغيل' },
];

const TESTIMONIALS = [
  { name: 'Ahmed Al-Rashid', role_en: 'Forex Trader, Saudi Arabia', role_ar: 'متداول فوركس، المملكة العربية السعودية', text_en: "APEX's AI signals transformed my trading. Consistent returns and a flawless mobile experience.", text_ar: "غيّرت إشارات الذكاء الاصطناعي في APEX تجربتي في التداول. عوائد ثابتة وتجربة موبايل لا تشوبها شائبة.", avatar: 'AR' },
  { name: 'Emma Chen',       role_en: 'Investment Manager, Singapore', role_ar: 'مدير استثمار، سنغافورة', text_en: "The 180-day investment plan paid 18% APY while I focused on other things. Simple, reliable, premium.", text_ar: "دفعت خطة 180 يومًا 18% سنويًا بينما ركزت على أشياء أخرى. بسيطة وموثوقة وراقية.", avatar: 'EC' },
  { name: 'Carlos Reyes',    role_en: 'Copy Trader, Mexico',         role_ar: 'ناسخ تداول، المكسيك', text_en: "Copied QuantumEdge and made 204% returns in 18 months. The platform just works.", text_ar: "نسخت QuantumEdge وحققت 204% في 18 شهرًا. المنصة تعمل ببساطة.", avatar: 'CR' },
];

const PLANS = [
  { name_en: 'Standard', name_ar: 'معياري', price_en: 'Free', price_ar: 'مجانًا', color: '#64748b', features_en: ['Live FX & Crypto prices','Basic charts','10 AI signals/mo','Community support'], features_ar: ['أسعار FX والعملات المشفرة','مخططات أساسية','10 إشارات AI شهريًا','دعم المجتمع'] },
  { name_en: 'Pro',      name_ar: 'احترافي', price_en: '$49/mo', price_ar: '49$/شهر', color: '#6366f1', featured: true, features_en: ['All Standard features','Advanced AI signals','Copy trading access','Priority support','Investment plans'], features_ar: ['جميع ميزات معياري','إشارات AI متقدمة','نسخ التداول','دعم أولوية','خطط استثمار'] },
  { name_en: 'Elite',    name_ar: 'نخبة',   price_en: '$149/mo', price_ar: '149$/شهر', color: '#D4A843', features_en: ['All Pro features','Dedicated account manager','Real estate access','Custom API access','Elite community','White-glove onboarding'], features_ar: ['جميع ميزات احترافي','مدير حساب مخصص','الوصول للعقارات','API مخصص','مجتمع النخبة','تأهيل شخصي'] },
];

const FAQ = [
  { q_en: 'Is my money safe?',                q_ar: 'هل أموالي آمنة؟',                   a_en: 'Yes. Funds are held in segregated accounts with top-tier custodians. We use cold storage for crypto, and all data is SSL-encrypted.',               a_ar: 'نعم. الأموال محفوظة في حسابات منفصلة مع أمناء من الدرجة الأولى. نستخدم التخزين البارد للعملات المشفرة وتشفير SSL.' },
  { q_en: 'What assets can I trade?',         q_ar: 'ما الأصول التي يمكنني تداولها؟',   a_en: 'Forex pairs (50+), Crypto (BTC, ETH, and 30+ altcoins), Stocks, Indices, Commodities, and Real Estate tokens.',                                   a_ar: 'أزواج الفوركس (50+)، العملات المشفرة، الأسهم، المؤشرات، السلع، وأصول العقارات الرقمية.' },
  { q_en: 'How do investment plans work?',    q_ar: 'كيف تعمل خطط الاستثمار؟',          a_en: 'Choose from Flexible (5.5% APY), 30-Day (8.5%), 90-Day (12.5%), or 180-Day (18%) plans. Earnings accrue daily.',                                a_ar: 'اختر من خطة مرنة (5.5% سنويًا)، أو 30 يومًا (8.5%)، أو 90 يومًا (12.5%)، أو 180 يومًا (18%).' },
  { q_en: 'Can I withdraw anytime?',          q_ar: 'هل يمكنني السحب في أي وقت؟',        a_en: 'Flexible plan funds can be withdrawn anytime. Locked plans (30/90/180-day) are held until maturity for maximum returns.',                          a_ar: 'يمكن سحب الخطة المرنة في أي وقت. الخطط المقفلة تُحتجز حتى الاستحقاق للحصول على أقصى عائد.' },
  { q_en: 'Is copy trading suitable for me?', q_ar: 'هل نسخ التداول مناسب لي؟',         a_en: 'Yes, especially if you\'re new to trading. Choose traders by risk level, set stop-loss, and your account mirrors their trades automatically.',     a_ar: 'نعم، خاصة إذا كنت جديدًا في التداول. اختر المتداولين حسب مستوى المخاطرة وانسخهم تلقائيًا.' },
];

/* ── helpers ── */
function useCountUp(target, duration = 1500) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const steps = 40, step = duration / steps;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setVal(Math.min(target, Math.round((target / steps) * i)));
      if (i >= steps) clearInterval(iv);
    }, step);
    return () => clearInterval(iv);
  }, [target, duration]);
  return val;
}

function LiveTicker({ tickers, isAr }) {
  const [data, setData] = useState(tickers);
  useEffect(() => {
    const iv = setInterval(() => {
      setData(prev => prev.map(t => {
        const drift = (Math.random() - 0.5) * 0.001 * t.price;
        const newPrice = +(t.price + drift).toFixed(t.price > 1000 ? 2 : 4);
        const change = +(newPrice - (t.price - t.change)).toFixed(4);
        return { ...t, price: newPrice, change, pct: +((change / (t.price - t.change)) * 100).toFixed(2) };
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ overflow: 'hidden', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', gap: 0, animation: 'tickerScroll 28s linear infinite', whiteSpace: 'nowrap' }}>
        {[...data, ...data].map((t, i) => (
          <div key={i} style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '8px 24px', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.9)' }}>{t.pair}</span>
            <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: '#fff' }}>{t.price.toLocaleString(undefined, { minimumFractionDigits: t.price > 1000 ? 2 : 4, maximumFractionDigits: t.price > 1000 ? 2 : 4 })}</span>
            <span style={{ fontSize: 11, color: t.pct >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {t.pct >= 0 ? '▲' : '▼'} {Math.abs(t.pct).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage({ theme, lang, onLogin, onRegister }) {
  const isAr = lang === 'ar';
  const font = isAr ? "'Cairo','Tajawal',sans-serif" : "'Inter',system-ui,sans-serif";
  const [faqOpen, setFaqOpen] = useState(null);
  const [email, setEmail] = useState('');
  const [heroEmail, setHeroEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const gold = '#D4A843';
  const bg = 'rgba(8,8,20,1)';

  const s = {
    section: (pad = '80px 20px') => ({ maxWidth: 1100, margin: '0 auto', padding: pad }),
    btn: (c = gold, outline = false) => ({
      background: outline ? 'transparent' : c,
      color: outline ? c : (c === gold ? '#000' : '#fff'),
      border: `2px solid ${c}`,
      borderRadius: 12,
      padding: '13px 28px',
      fontWeight: 700,
      fontSize: 15,
      cursor: 'pointer',
      fontFamily: font,
      transition: 'all .2s',
      letterSpacing: 0.3,
    }),
    h2: { fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, textAlign: 'center', margin: '0 0 14px', lineHeight: 1.2 },
    sub: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 15, maxWidth: 560, margin: '0 auto 56px', lineHeight: 1.7 },
    card: { background: 'rgba(255,255,255,0.028)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px' },
  };

  return (
    <div style={{ fontFamily: font, color: '#fff', background: bg, minHeight: '100vh', direction: isAr ? 'rtl' : 'ltr', overflowX: 'hidden' }}>
      <style>{`
        @keyframes tickerScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(8,8,20,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${gold}, #b8860b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#000' }}>A</div>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>APEX <span style={{ color: gold }}>FX</span></span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...s.btn('rgba(255,255,255,0.08)', false), color: '#fff', border: '1px solid rgba(255,255,255,0.12)', padding: '9px 20px', fontSize: 13 }} onClick={onLogin}>
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button style={{ ...s.btn(gold), padding: '9px 20px', fontSize: 13 }} onClick={onRegister}>
              {isAr ? 'ابدأ مجانًا' : 'Get Started'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <LiveTicker tickers={TICKERS} isAr={isAr} />

      {/* ── HERO ── */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '100px 24px 80px', textAlign: 'center' }}>
        {/* background blobs */}
        <div style={{ position: 'absolute', top: -100, left: '10%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${gold}18, transparent 70%)`, filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, #6366f118, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ animation: 'fadeInUp .7s ease forwards' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${gold}18`, border: `1px solid ${gold}44`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 700, color: gold, marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: gold, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            {isAr ? 'مباشر الآن — منصة التداول الاحترافية' : 'Live Now — Professional Trading Platform'}
          </div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,72px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 20px', maxWidth: 800, marginLeft: 'auto', marginRight: 'auto' }}>
            {isAr ? (
              <>تداول بذكاء. استثمر بثقة.<br /><span style={{ color: gold }}>ارتقِ مع APEX.</span></>
            ) : (
              <>Trade Smarter.<br />Invest with <span style={{ color: gold }}>Confidence.</span></>
            )}
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: 'rgba(255,255,255,0.55)', maxWidth: 620, margin: '0 auto 40px', lineHeight: 1.7 }}>
            {isAr
              ? 'منصة متكاملة للفوركس والعملات المشفرة والأسهم والعقارات مع إشارات AI ونسخ التداول وخطط استثمار بعائد حتى 18%.'
              : 'All-in-one platform for Forex, Crypto, Stocks & Real Estate — with AI signals, copy trading, and investment plans up to 18% APY.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 50 }}>
            <button style={s.btn(gold)} onClick={onRegister}>{isAr ? 'ابدأ مجانًا — لا بطاقة مطلوبة' : 'Start Free — No Card Required'}</button>
            <button style={s.btn('rgba(255,255,255,0.08)', false)} onClick={onLogin} >
              <span style={{ color: '#fff' }}>{isAr ? 'استكشف المنصة' : 'Explore Platform'}</span>
            </button>
          </div>

          {/* hero stats strip */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            {[
              { v: '$2.4B+', l: isAr ? 'حجم التداول' : 'Trading Volume' },
              { v: '120K+',  l: isAr ? 'متداول نشط' : 'Active Traders' },
              { v: '18%',    l: isAr ? 'أقصى عائد سنوي' : 'Max APY' },
            ].map(st => (
              <div key={st.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: gold }}>{st.v}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{st.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={s.section()}>
          <h2 style={s.h2}>
            {isAr ? 'كل ما تحتاجه في مكان واحد' : 'Everything You Need, In One Place'}
          </h2>
          <p style={s.sub}>
            {isAr ? 'منصة APEX الشاملة تجمع أدوات التداول الاحترافية مع الاستثمار الذكي والأمان المصرفي.' : 'APEX brings together professional trading tools, smart investing, and bank-grade security.'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ ...s.card, transition: 'border-color .2s' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700 }}>{isAr ? f.ar : f.en}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.65 }}>{isAr ? f.descAr : f.descEn}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS COUNTER ── */}
      <section>
        <div style={{ ...s.section('60px 20px'), display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
          {STATS.map((st, i) => (
            <div key={i} style={{ ...s.card, textAlign: 'center', padding: '32px 20px' }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: gold }}>{isAr ? st.ar : st.en}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>{isAr ? st.label_ar : st.label_en}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: 'rgba(255,255,255,0.012)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={s.section()}>
          <h2 style={s.h2}>{isAr ? 'ابدأ في 3 خطوات' : 'Start in 3 Steps'}</h2>
          <p style={s.sub}>{isAr ? 'من التسجيل إلى أول صفقة في دقائق.' : 'From signup to your first trade in minutes.'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {[
              { n:'01', en:'Create Account', ar:'أنشئ حسابك', d_en:'Sign up free in under 2 minutes. No credit card needed.', d_ar:'سجّل مجانًا في أقل من دقيقتين. لا بطاقة مطلوبة.' },
              { n:'02', en:'Fund & Verify',  ar:'أودع وتحقق',  d_en:'Deposit via crypto or bank. Complete KYC to unlock all features.', d_ar:'أودع عبر عملة مشفرة أو بنك. أكمل KYC لفتح جميع الميزات.' },
              { n:'03', en:'Trade & Grow',   ar:'تداول وانمو',  d_en:'Use AI signals, copy top traders, or invest in plans. Watch your portfolio grow.', d_ar:'استخدم إشارات AI أو انسخ كبار المتداولين أو استثمر في الخطط.' },
            ].map((step, i) => (
              <div key={i} style={{ ...s.card, textAlign: 'center', position: 'relative' }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: gold, opacity: 0.15, position: 'absolute', top: 16, [isAr?'left':'right']: 20, lineHeight: 1 }}>{step.n}</div>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${gold}22`, border: `2px solid ${gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: gold, margin: '0 auto 16px' }}>{step.n}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 17, fontWeight: 700 }}>{isAr ? step.ar : step.en}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.65 }}>{isAr ? step.d_ar : step.d_en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section>
        <div style={s.section()}>
          <h2 style={s.h2}>{isAr ? 'اختر خطتك' : 'Choose Your Plan'}</h2>
          <p style={s.sub}>{isAr ? 'ابدأ مجانًا. ارقِّ عندما تكون مستعدًا.' : 'Start free. Upgrade when you\'re ready.'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{ ...s.card, borderColor: plan.featured ? plan.color : 'rgba(255,255,255,0.08)', position: 'relative', transform: plan.featured ? 'scale(1.03)' : 'none' }}>
                {plan.featured && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#000', borderRadius: 20, padding: '3px 14px', fontSize: 11, fontWeight: 800 }}>
                    {isAr ? 'الأكثر شعبية' : 'Most Popular'}
                  </div>
                )}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: plan.color, borderRadius: '20px 20px 0 0' }} />
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '10px 0 4px', color: plan.color }}>{isAr ? plan.name_ar : plan.name_en}</h3>
                <div style={{ fontSize: 32, fontWeight: 900, margin: '10px 0 20px' }}>{isAr ? plan.price_ar : plan.price_en}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(isAr ? plan.features_ar : plan.features_en).map((f, j) => (
                    <li key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                      <span style={{ color: plan.color, fontWeight: 900, marginTop: 1 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button style={{ ...s.btn(plan.featured ? plan.color : 'rgba(255,255,255,0.08)', !plan.featured), color: plan.featured ? '#000' : '#fff', width: '100%', fontSize: 14 }} onClick={onRegister}>
                  {isAr ? 'ابدأ الآن' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: 'rgba(255,255,255,0.012)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={s.section()}>
          <h2 style={s.h2}>{isAr ? 'ماذا يقول عملاؤنا' : 'What Our Traders Say'}</h2>
          <p style={s.sub}>{isAr ? 'آراء حقيقية من متداولين حول العالم.' : 'Real feedback from traders around the world.'}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={s.card}>
                <div style={{ color: gold, fontSize: 20, marginBottom: 12 }}>★★★★★</div>
                <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7, fontStyle: 'italic' }}>
                  "{isAr ? t.text_ar : t.text_en}"
                </p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${gold}33`, border: `2px solid ${gold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: gold }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{isAr ? t.role_ar : t.role_en}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section>
        <div style={s.section()}>
          <h2 style={s.h2}>{isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}</h2>
          <p style={s.sub}>{isAr ? 'إجابات على أكثر الأسئلة شيوعًا.' : 'Answers to the most common questions.'}</p>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ ...s.card, cursor: 'pointer', padding: '18px 22px' }} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{isAr ? item.q_ar : item.q_en}</span>
                  <span style={{ color: gold, fontSize: 20, transition: 'transform .2s', transform: faqOpen === i ? 'rotate(45deg)' : 'none', flexShrink: 0 }}>+</span>
                </div>
                {faqOpen === i && (
                  <p style={{ margin: '12px 0 0', color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.7 }}>
                    {isAr ? item.a_ar : item.a_en}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: `linear-gradient(135deg, ${gold}12, #6366f112)`, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ ...s.section('80px 24px'), textAlign: 'center' }}>
          <h2 style={{ ...s.h2, fontSize: 'clamp(28px,5vw,48px)' }}>
            {isAr ? 'جاهز للبدء؟' : 'Ready to Start Trading?'}
          </h2>
          <p style={{ ...s.sub, marginBottom: 36 }}>
            {isAr ? 'انضم إلى 120,000+ متداول يثقون في APEX. سجّل مجانًا اليوم.' : 'Join 120,000+ traders who trust APEX. Sign up free today.'}
          </p>
          {!submitted ? (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', maxWidth: 480, margin: '0 auto', flexWrap: 'wrap' }}>
              <input
                style={{ flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '13px 18px', color: '#fff', fontSize: 15, fontFamily: font, outline: 'none' }}
                placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email address'}
                type="email" value={heroEmail} onChange={e => setHeroEmail(e.target.value)}
              />
              <button style={s.btn(gold)} onClick={() => { if (heroEmail) { setSubmitted(true); onRegister && onRegister(); } }}>
                {isAr ? 'ابدأ مجانًا' : 'Get Started Free'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 18, color: '#10b981', fontWeight: 700 }}>
              {isAr ? '✓ رائع! سيتم توجيهك للتسجيل...' : '✓ Great! Redirecting to signup...'}
            </div>
          )}
          <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
            {isAr ? 'لا حاجة لبطاقة ائتمانية. التسجيل في أقل من دقيقتين.' : 'No credit card required. Sign up in under 2 minutes.'}
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${gold}, #b8860b)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000' }}>A</div>
                <span style={{ fontWeight: 800, fontSize: 15 }}>APEX <span style={{ color: gold }}>FX</span></span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
                {isAr ? 'منصة تداول واستثمار احترافية متعددة الأصول.' : 'Professional multi-asset trading and investment platform.'}
              </p>
            </div>
            {[
              { title_en: 'Platform', title_ar: 'المنصة', links: [{ en:'Trading', ar:'التداول' },{ en:'Investments', ar:'الاستثمارات' },{ en:'Copy Trading', ar:'نسخ التداول' },{ en:'Real Estate', ar:'العقارات' }] },
              { title_en: 'Company', title_ar: 'الشركة', links: [{ en:'About', ar:'من نحن' },{ en:'Careers', ar:'وظائف' },{ en:'Blog', ar:'المدونة' },{ en:'Press', ar:'الصحافة' }] },
              { title_en: 'Legal', title_ar: 'قانوني', links: [{ en:'Privacy Policy', ar:'سياسة الخصوصية' },{ en:'Terms of Service', ar:'الشروط والأحكام' },{ en:'Risk Disclosure', ar:'إفصاح المخاطر' },{ en:'Compliance', ar:'الامتثال' }] },
            ].map((col, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, color: 'rgba(255,255,255,0.7)' }}>{isAr ? col.title_ar : col.title_en}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(l => (
                    <span key={l.en} style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>{isAr ? l.ar : l.en}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
              © 2024 APEX FX. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
              {isAr ? 'التداول ينطوي على مخاطر. الأداء السابق لا يضمن نتائج مستقبلية.' : 'Trading involves risk. Past performance does not guarantee future results.'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
