/* eslint-disable */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const MonetizeTab = ({ theme, lang, user, userPlan, onUpgrade }) => {
  const isAr = lang === 'ar';
  const C = {
    card: 'rgba(255,255,255,0.03)', border: `${theme.primary}18`,
    sub: 'rgba(238,232,218,0.45)', text: '#EEE8DA',
    green: '#4ADE80', gold: '#D4A843', blue: '#60A5FA', red: '#E05252',
  };
  const S = {
    card: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '18px 20px', marginBottom: 14 },
    badge: (c) => ({ padding: '2px 10px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: `${c}15`, color: c, border: `1px solid ${c}25` }),
    btn: (c) => ({ padding: '10px 20px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,${c},${c}bb)`, color: '#000', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: '100%' }),
    label: { fontSize: 11, color: C.sub, marginBottom: 4 },
    val: { fontSize: 22, fontWeight: 900 },
  };

  const [activeStream, setActiveStream] = useState('affiliate');
  const [calcAff, setCalcAff] = useState(10);
  const [calcSub, setCalcSub] = useState(100);
  const [adsCopied, setAdsCopied] = useState(false);

  // ── Revenue Calculation ─────────────────────────────
  const affRev   = calcAff * 400;
  const subRev   = Math.round(calcSub * 0.7 * 9.99 + calcSub * 0.3 * 24.99);
  const adsRev   = calcSub > 500 ? 3000 : calcSub > 100 ? 1000 : 300;
  const totalRev = affRev + subRev + adsRev;

  // ── Affiliate Programs ──────────────────────────────
  const AFF_PROGRAMS = [
    { name:'Exness Partners', cpa:'$1,850', rev:'25%', pay:'أسبوعي', color:'#1DB954', url:'https://partners.exness.com', badge:'الأعلى CPA' },
    { name:'IC Markets IB',   cpa:'$800',  rev:'20%', pay:'شهري',   color:'#00B4D8', url:'https://icmarkets.com/global/en/partners/', badge:'الأوسع انتشاراً' },
    { name:'Pepperstone',     cpa:'$700',  rev:'20%', pay:'شهري',   color:'#FF6B35', url:'https://pepperstone.com/en/partners/', badge:'' },
    { name:'XM Partners',     cpa:'$600',  rev:'15%', pay:'شهري',   color:'#E63946', url:'https://partners.xm.com', badge:'الأسهل تسجيلاً' },
    { name:'eToro Partners',  cpa:'$400',  rev:'—',   pay:'شهري',   color:'#2196F3', url:'https://www.etoro.com/partners/', badge:'' },
    { name:'AvaTrade IB',     cpa:'$500',  rev:'20%', pay:'شهري',   color:'#9C27B0', url:'https://www.avatrade.com/partnerships/', badge:'' },
    { name:'FP Markets IB',   cpa:'$600',  rev:'25%', pay:'شهري',   color:'#FF9800', url:'https://www.fpmarkets.com/partners/', badge:'' },
    { name:'Tickmill IB',     cpa:'$400',  rev:'25%', pay:'أسبوعي', color:'#4CAF50', url:'https://www.tickmill.com/partners', badge:'' },
    { name:'OANDA Partners',  cpa:'$300',  rev:'15%', pay:'شهري',   color:'#607D8B', url:'https://www.oanda.com/affiliate/', badge:'' },
    { name:'Plus500 Affiliate',cpa:'$350', rev:'—',   pay:'شهري',   color:'#E91E63', url:'https://www.plus500.com/en/Affiliates', badge:'' },
    { name:'Admirals Partner',cpa:'$450',  rev:'20%', pay:'شهري',   color:'#3F51B5', url:'https://admiralmarkets.com/partnerships', badge:'' },
    { name:'HFM Partners',    cpa:'$400',  rev:'20%', pay:'شهري',   color:'#009688', url:'https://www.hfm.com/partners/', badge:'' },
    { name:'Saxo Partner',    cpa:'$500',  rev:'—',   pay:'شهري',   color:'#795548', url:'https://www.home.saxo/rates-and-conditions/partner', badge:'' },
    { name:'IG Affiliates',   cpa:'$300',  rev:'—',   pay:'شهري',   color:'#F44336', url:'https://affiliates.ig.com', badge:'' },
    { name:'Swissquote IB',   cpa:'$400',  rev:'—',   pay:'شهري',   color:'#E91E63', url:'https://www.swissquote.com/forex/en/introducing-broker.html', badge:'' },
  ];

  // ── White-label packages ────────────────────────────
  const WL_PACKAGES = [
    { name: isAr ? 'حزمة المطلع' : 'Starter',    price: '$5,000',  desc: isAr ? 'ملف HTML جاهز بشعارك + ألوانك' : 'Ready HTML file with your brand', features: isAr ? ['تخصيص الشعار','تغيير الألوان','دومين مخصص'] : ['Logo customization','Color theme','Custom domain'] },
    { name: isAr ? 'حزمة الوسيط' : 'Broker',     price: '$15,000', desc: isAr ? 'تطبيق كامل + Backend + API خاص' : 'Full app + Backend + Private API', features: isAr ? ['كل ميزات Starter','Backend خاص','دعم 3 أشهر'] : ['All Starter features','Private backend','3mo support'] },
    { name: isAr ? 'حزمة المؤسسة' : 'Enterprise', price: '$50,000', desc: isAr ? 'بناء كامل مخصص + عقد صيانة سنوي' : 'Full custom build + annual maintenance', features: isAr ? ['تطوير مخصص','فريق دعم','عقد سنوي'] : ['Custom development','Support team','Annual contract'] },
  ];

  // ── B2B Report types ────────────────────────────────
  const B2B_REPORTS = [
    { title: isAr ? 'تقرير اتجاهات الفوركس العربي' : 'Arabic Forex Trends Report', price: '$2,000', freq: isAr ? 'ربع سنوي' : 'Quarterly' },
    { title: isAr ? 'بيانات ديموغرافية مجهّلة' : 'Anonymized User Demographics', price: '$1,000', freq: isAr ? 'شهري' : 'Monthly' },
    { title: isAr ? 'تقرير الأصول الأكثر تداولاً' : 'Most Traded Assets Report', price: '$500',   freq: isAr ? 'شهري' : 'Monthly' },
    { title: isAr ? 'تحليل سلوك المستثمر الخليجي' : 'GCC Investor Behavior Analysis', price: '$3,000', freq: isAr ? 'سنوي' : 'Annual' },
  ];

  const streams = [
    { id: 'affiliate',    icon: '🔗', label: isAr ? 'أفلييت' : 'Affiliate' },
    { id: 'subscriptions',icon: '💳', label: isAr ? 'اشتراكات' : 'Subscriptions' },
    { id: 'ads',          icon: '📣', label: isAr ? 'إعلانات' : 'Ads' },
    { id: 'whitelabel',   icon: '🏢', label: isAr ? 'وايت لابل' : 'White-label' },
    { id: 'b2b',          icon: '📊', label: isAr ? 'بيانات B2B' : 'B2B Data' },
    { id: 'calculator',   icon: '🧮', label: isAr ? 'الحاسبة' : 'Calculator' },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.3s ease', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>💰 {isAr ? 'مركز الربح — كل طرق التكسب' : 'Revenue Hub — All Monetization'}</div>
        <div style={{ fontSize: 11, color: C.sub }}>{isAr ? '6 طرق ربح مدمجة في تطبيقك | ابدأ اليوم' : '6 built-in revenue streams | Start today'}</div>
      </div>

      {/* ── Revenue Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
        {[
          { label: isAr ? 'إمكانية شهرية (الحد الأدنى)' : 'Monthly potential (conservative)', val: '$1,500', icon: '📉', c: C.sub },
          { label: isAr ? 'مع 100 مشترك + 10 إحالة' : 'With 100 subs + 10 referrals', val: '$5,999',  icon: '📈', c: C.gold },
          { label: isAr ? 'بعد SEO ونمو حقيقي' : 'After SEO & real growth', val: '$50,000+', icon: '🚀', c: C.green },
        ].map((s,i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Stream Selector ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {streams.map(s => (
          <button key={s.id} onClick={() => setActiveStream(s.id)} style={{
            padding: '8px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            border: `1px solid ${activeStream === s.id ? theme.primary : C.border}`,
            background: activeStream === s.id ? `${theme.primary}15` : 'transparent',
            color: activeStream === s.id ? theme.primary : C.sub,
          }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── AFFILIATE ── */}
      {activeStream === 'affiliate' && (
        <div style={{ animation: 'fadeUp 0.2s ease' }}>
          <div style={{ ...S.card, borderColor: `${C.green}25` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>🔗 {isAr ? 'برامج الشراكة — أسرع مصدر دخل' : 'Affiliate Programs — Fastest Revenue'}</div>
                <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>{isAr ? `${AFF_PROGRAMS.length} برنامج شراكة حقيقي يمكنك التسجيل فيه الآن` : `${AFF_PROGRAMS.length} real affiliate programs you can join today`}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: C.green }}>${(calcAff * 400).toLocaleString()}</div>
                <div style={{ fontSize: 9, color: C.sub }}>{isAr ? 'متوقع/شهر' : 'est./month'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 10 }}>
              {AFF_PROGRAMS.map((p, pi) => (
                <div key={pi} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: `${p.color}20`, border: `1px solid ${p.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: p.color }}>
                        {p.name.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800 }}>{p.name}</div>
                        {p.badge && <span style={{ ...S.badge(C.gold), fontSize: 8 }}>{p.badge}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                    {[
                      { l: 'CPA', v: p.cpa },
                      { l: isAr ? 'حصة' : 'Rev Share', v: p.rev },
                      { l: isAr ? 'دفع' : 'Payment', v: p.pay },
                    ].map((m,mi) => (
                      <div key={mi} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '5px 7px', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.green }}>{m.v}</div>
                        <div style={{ fontSize: 8, color: C.sub }}>{m.l}</div>
                      </div>
                    ))}
                  </div>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', textAlign: 'center', padding: '7px', borderRadius: 8,
                    background: `${p.color}15`, border: `1px solid ${p.color}25`,
                    color: p.color, fontSize: 10, fontWeight: 700, textDecoration: 'none',
                  }}>
                    {isAr ? 'سجّل الآن ↗' : 'Join Now ↗'}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTIONS ── */}
      {activeStream === 'subscriptions' && (
        <div style={{ animation: 'fadeUp 0.2s ease' }}>
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>💳 {isAr ? 'الاشتراكات المدفوعة — دخل متكرر شهرياً' : 'Paid Subscriptions — Monthly Recurring'}</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 18 }}>{isAr ? 'خطط Pro/Elite مفعّلة في التطبيق — تحتاج فقط ربط بوابة دفع' : 'Pro/Elite plans already in the app — just need a payment gateway'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
              {[
                { plan: 'Free',  price: '$0',    color: C.sub,   features: isAr ? ['أسعار لحظية','700 زوج','وسطاء','محفظة'] : ['Live prices','700 pairs','Brokers','Portfolio'] },
                { plan: 'Pro',   price: '$9.99', color: C.gold,  features: isAr ? ['كل المجاني','مستشار AI','تحليلات','إشارات'] : ['All Free','AI Advisor','Analytics','Signals'] },
                { plan: 'Elite', price: '$24.99',color: C.green, features: isAr ? ['كل Pro','إدارة خطر AI','API access','VIP دعم'] : ['All Pro','AI Risk Mgr','API access','VIP support'] },
              ].map((p,pi) => (
                <div key={pi} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16, border: `1px solid ${p.color}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: p.color, marginBottom: 8 }}>{p.plan}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>{p.price}</div>
                  {p.features.map((f,fi) => (
                    <div key={fi} style={{ fontSize: 11, color: C.sub, padding: '4px 0', borderBottom: fi < p.features.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>✓ {f}</div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{isAr ? '📊 حاسبة دخل الاشتراكات' : 'Subscription Revenue Calculator'}</div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                  <span style={{ color: C.sub }}>{isAr ? 'عدد المشتركين' : 'Subscribers'}</span>
                  <span style={{ fontWeight: 800, color: C.gold }}>{calcSub} {isAr ? 'مشترك' : 'subscribers'}</span>
                </div>
                <input type="range" min="10" max="2000" value={calcSub} step="10"
                  onChange={e => setCalcSub(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: theme.primary }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {[
                  { l: isAr ? 'دخل شهري' : 'Monthly', v: `$${subRev.toLocaleString()}` },
                  { l: isAr ? 'دخل سنوي' : 'Annual',  v: `$${(subRev * 12).toLocaleString()}` },
                  { l: isAr ? 'تقييم SaaS (10x)' : 'SaaS Val (10x)', v: `$${(subRev * 120).toLocaleString()}` },
                ].map((s,i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: C.green }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: C.sub, marginTop: 3 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 14, background: `${theme.primary}08`, borderRadius: 12, border: `1px solid ${theme.primary}20` }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>⚡ {isAr ? 'كيف تفعّل الدفع الحقيقي؟' : 'How to activate real payments?'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { name: 'Stripe', url: 'https://stripe.com', note: isAr ? 'الأفضل عالمياً' : 'Global best' },
                  { name: 'Paddle', url: 'https://paddle.com', note: isAr ? 'بدون كيان قانوني' : 'No legal entity needed' },
                  { name: 'PayPal', url: 'https://paypal.com/webapps/mpp/merchant', note: isAr ? 'الأشهر عربياً' : 'Most popular Arab world' },
                  { name: 'Moyasar', url: 'https://moyasar.com', note: isAr ? 'بطاقات مدى وSTC Pay' : 'Mada & STC Pay' },
                ].map((g,gi) => (
                  <a key={gi} href={g.url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8,
                    textDecoration: 'none', border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{g.name}</span>
                    <span style={{ fontSize: 9, color: C.sub }}>{g.note}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADS ── */}
      {activeStream === 'ads' && (
        <div style={{ animation: 'fadeUp 0.2s ease' }}>
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>📣 {isAr ? 'الإعلانات الممولة' : 'Sponsored Placements'}</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 18 }}>{isAr ? 'وسطاء يدفعون لإبراز أنفسهم في تطبيقك' : 'Brokers pay to feature themselves in your app'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { placement: isAr ? 'وسيط مميّز (Featured)' : 'Featured Broker Spot', price: '$500–$1,500', period: isAr ? 'شهرياً' : '/month', desc: isAr ? 'أول نتيجة في قائمة الوسطاء + شارة "مميّز"' : 'First in broker list + "Featured" badge', icon: '⭐' },
                { placement: isAr ? 'بانر في الأسعار' : 'Prices Tab Banner', price: '$200–$500', period: isAr ? 'شهرياً' : '/month', desc: isAr ? 'بانر ثابت في تاب الأسعار اللحظية' : 'Fixed banner in live prices tab', icon: '📊' },
                { placement: isAr ? 'إشعار Push مدفوع' : 'Sponsored Push Alert', price: '$100–$300', period: isAr ? 'لكل إرسال' : '/send', desc: isAr ? 'إشعار لجميع المستخدمين باسم الوسيط' : 'Push notification to all users', icon: '🔔' },
                { placement: isAr ? 'نشرة بريدية' : 'Email Newsletter Spot', price: '$100–$400', period: isAr ? 'لكل إصدار' : '/issue', desc: isAr ? 'إعلان في النشرة الأسبوعية للمستخدمين' : 'Ad in weekly user newsletter', icon: '✉️' },
                { placement: isAr ? 'لافتة في التعليم' : 'Education Tab Banner', price: '$150–$400', period: isAr ? 'شهرياً' : '/month', desc: isAr ? 'إعلان في دروس التداول التعليمية' : 'Ad in educational trading lessons', icon: '📚' },
                { placement: isAr ? 'رعاية البطولة' : 'Tournament Sponsorship', price: '$500–$2,000', period: isAr ? 'للبطولة' : '/tournament', desc: isAr ? 'وسيط يرعى بطولة ويظهر شعاره' : 'Broker sponsors tournament with logo', icon: '🏆' },
              ].map((a, ai) => (
                <div key={ai} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{a.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{a.placement}</div>
                  <div style={{ fontSize: 10, color: C.sub, marginBottom: 10, lineHeight: 1.5 }}>{a.desc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: C.gold }}>{a.price}</span>
                    <span style={{ fontSize: 9, color: C.sub }}>{a.period}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>📧 {isAr ? 'نموذج تواصل مع الوسطاء — انسخه وأرسله' : 'Outreach template — copy & send'}</div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontFamily: 'monospace', fontSize: 10.5, color: 'rgba(238,232,218,0.7)', lineHeight: 1.8, position: 'relative' }}>
                {isAr
                  ? `Subject: شراكة إعلانية — APEX INVEST (X مستخدم)

مرحباً فريق [اسم الوسيط]،

أنا مطوّر منصة APEX INVEST، أكبر منصة استثمار عربية مجانية بـ [X] مستخدم شهرياً.

أعرض عليكم حزمة "وسيط مميّز" بـ $500/شهر تشمل:
• الظهور الأول في قائمة الوسطاء
• شارة "موثوق ومرخّص"
• بانر في تاب الأسعار

تواصلوا معي على: [بريدك]`
                  : `Subject: Advertising Partnership — APEX INVEST ([X] users)

Hi [Broker] Team,

I'm the developer of APEX INVEST, the largest free Arabic investment platform with [X] monthly users.

I'm offering a "Featured Broker" package at $500/month including:
• First position in broker listings
• "Verified & Licensed" badge
• Banner in live prices tab

Contact: [your email]`
                }
                <button onClick={() => { navigator.clipboard.writeText('Copy the template above'); setAdsCopied(true); setTimeout(()=>setAdsCopied(false), 2000); }}
                  style={{ position: 'absolute', top: 8, [isAr?'left':'right']: 8, padding: '4px 10px', background: adsCopied ? C.green : `${theme.primary}20`, border: `1px solid ${adsCopied ? C.green : theme.primary}40`, borderRadius: 6, color: adsCopied ? '#000' : theme.primary, fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {adsCopied ? '✓' : (isAr ? 'نسخ' : 'Copy')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WHITE LABEL ── */}
      {activeStream === 'whitelabel' && (
        <div style={{ animation: 'fadeUp 0.2s ease' }}>
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>🏢 {isAr ? 'White-label — بيع تطبيقك لوسيط' : 'White-label — Sell your app to a broker'}</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 18 }}>{isAr ? 'وسطاء يريدون تطبيق تحليل بعلامتهم التجارية — أنت تبيع نسخة مخصصة' : 'Brokers want a branded analysis app — you sell a customized version'}</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
              {WL_PACKAGES.map((p, pi) => (
                <div key={pi} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 18, border: `1px solid ${pi===1 ? theme.primary+'40' : 'rgba(255,255,255,0.06)'}`, position: 'relative' }}>
                  {pi === 1 && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: theme.primary, color: '#000', fontSize: 8, fontWeight: 900, padding: '2px 12px', borderRadius: 20 }}>الأكثر طلباً</div>}
                  <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.gold, marginBottom: 6 }}>{p.price}</div>
                  <div style={{ fontSize: 10, color: C.sub, marginBottom: 12, lineHeight: 1.6 }}>{p.desc}</div>
                  {p.features.map((f,fi) => (
                    <div key={fi} style={{ fontSize: 11, color: C.text, padding: '5px 0', borderBottom: fi < p.features.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>✅ {f}</div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ padding: 14, background: `${theme.primary}08`, borderRadius: 12, border: `1px solid ${theme.primary}20` }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>🎯 {isAr ? 'كيف تجد عملاء White-label؟' : 'How to find White-label clients?'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(isAr ? [
                  'LinkedIn: راسل Marketing Directors للوسطاء الصغار',
                  'Telegram: مجموعات وسطاء الفوركس العرب',
                  'تواصل مع وسطاء من تاب APEX مباشرة',
                  'عرض في مؤتمرات iFX EXPO و Finance Magnates',
                ] : [
                  'LinkedIn: Message Marketing Directors of small brokers',
                  'Telegram: Forex broker groups',
                  'Contact brokers directly from APEX broker tab',
                  'Pitch at iFX EXPO & Finance Magnates conferences',
                ]).map((tip, ti) => (
                  <div key={ti} style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 11, color: C.sub }}>💡 {tip}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── B2B DATA ── */}
      {activeStream === 'b2b' && (
        <div style={{ animation: 'fadeUp 0.2s ease' }}>
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>📊 {isAr ? 'بيانات B2B — بيع تقارير للوسطاء' : 'B2B Data — Sell reports to brokers'}</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 18 }}>{isAr ? 'بيانات مجمّعة ومجهّلة عن سلوك المستثمر العربي — قيمة عالية للوسطاء' : 'Aggregated anonymous data on Arab investor behavior — high value for brokers'}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {B2B_REPORTS.map((r, ri) => (
                <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{r.title}</div>
                    <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>{r.freq}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.gold }}>{r.price}</div>
                    <div style={{ fontSize: 8, color: C.sub }}>{isAr ? 'للتقرير' : '/report'}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>⚠️ {isAr ? 'شروط قانونية مهمة' : 'Important legal requirements'}</div>
              {(isAr ? [
                'لا تبيع بيانات شخصية — فقط إحصاءات مجمّعة ومجهّلة',
                'أضف Privacy Policy واضحة في التطبيق',
                'احصل على موافقة المستخدم عند التسجيل (Consent checkbox)',
                'استشر محامياً متخصص في GDPR / قوانين البيانات المحلية',
              ] : [
                'Never sell personal data — only aggregated anonymous statistics',
                'Add a clear Privacy Policy to your app',
                'Get user consent at registration (consent checkbox)',
                'Consult a GDPR / local data law specialist',
              ]).map((req, ri) => (
                <div key={ri} style={{ fontSize: 11, color: C.sub, padding: '5px 0', borderBottom: ri < 3 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>⚖️ {req}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CALCULATOR ── */}
      {activeStream === 'calculator' && (
        <div style={{ animation: 'fadeUp 0.2s ease' }}>
          <div style={S.card}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 18 }}>🧮 {isAr ? 'حاسبة الدخل الشاملة' : 'Full Revenue Calculator'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                { id:'aff', label: isAr?'إحالات أفلييت/شهر':'Affiliate referrals/month', min:0, max:100, step:1, val:calcAff, set:setCalcAff, unit: isAr?'إحالة':'referrals', avg:'$400 avg CPA' },
                { id:'sub', label: isAr?'مشتركون Pro+Elite':'Pro+Elite subscribers', min:0, max:5000, step:10, val:calcSub, set:setCalcSub, unit: isAr?'مشترك':'subscribers', avg:'$14.99 avg' },
              ].map((s) => (
                <div key={s.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>{s.label}</div>
                  <input type="range" min={s.min} max={s.max} value={s.val} step={s.step}
                    onChange={e => s.set(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: theme.primary, marginBottom: 6 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ fontWeight: 800 }}>{s.val} {s.unit}</span>
                    <span style={{ color: C.sub }}>{s.avg}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: isAr?'أفلييت':'Affiliate',     val: affRev,  color: C.blue },
                { label: isAr?'اشتراكات':'Subscriptions', val: subRev,  color: C.gold },
                { label: isAr?'إعلانات':'Ads',           val: adsRev,  color: C.sub },
                { label: isAr?'المجموع':'Total',          val: totalRev, color: C.green },
              ].map((r,i) => (
                <div key={i} style={{ background: i===3 ? `${C.green}10` : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, textAlign: 'center', border: i===3 ? `1px solid ${C.green}25` : '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 9, color: i===3?C.green:C.sub, marginBottom: 6 }}>{r.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: r.color }}>${r.val.toLocaleString()}</div>
                  <div style={{ fontSize: 8, color: C.sub, marginTop: 3 }}>{isAr?'شهرياً':'/month'}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: isAr?'سنوياً':'Annual', val: totalRev * 12 },
                { label: isAr?'تقييم SaaS (12x MRR)':'SaaS Valuation (12x MRR)', val: totalRev * 12 },
                { label: isAr?'تقييم مع نمو 50%':'Valuation with 50% growth', val: totalRev * 12 * 1.5 },
              ].map((r,i) => (
                <div key={i} style={{ background: `${theme.primary}08`, borderRadius: 12, padding: 14, textAlign: 'center', border: `1px solid ${theme.primary}20` }}>
                  <div style={{ fontSize: 9, color: `${theme.primary}70`, marginBottom: 6 }}>{r.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: theme.primary }}>${Math.round(r.val).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>🗓️ {isAr ? 'خارطة طريق الدخل' : 'Revenue Roadmap'}</div>
              {[
                { m: isAr?'الشهر 1-2':'Month 1-2', goal: isAr?'سجّل في 3 برامج أفلييت + Deploy':'Register in 3 affiliate programs + Deploy', target: '$200–$600' },
                { m: isAr?'الشهر 3-4':'Month 3-4', goal: isAr?'ربط Stripe + أول 20 مشترك Pro':'Connect Stripe + first 20 Pro subscribers', target: '$1,000–$2,000' },
                { m: isAr?'الشهر 5-6':'Month 5-6', goal: isAr?'SEO + مجتمع Telegram + محتوى':'SEO + Telegram community + content', target: '$3,000–$8,000' },
                { m: isAr?'السنة 2+':'Year 2+',    goal: isAr?'وسطاء يدفعون + White-label + B2B':'Broker ads + White-label + B2B data', target: '$20,000+' },
              ].map((r, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: ri < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div style={{ width: 70, fontSize: 9, fontWeight: 800, color: theme.primary, flexShrink: 0 }}>{r.m}</div>
                  <div style={{ flex: 1, fontSize: 11, color: C.sub }}>{r.goal}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: C.green, flexShrink: 0 }}>{r.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonetizeTab;
