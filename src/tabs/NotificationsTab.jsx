/* eslint-disable */
import { useState, useEffect } from 'react';

const INITIAL_NOTIFS = [
  { id:1,  type:'alert',    icon:'🔔', titleEn:'Price Alert Triggered',        titleAr:'تفعّل تنبيه السعر',         bodyEn:'EUR/USD reached your target 1.0850 (Above)',      bodyAr:'EUR/USD وصل هدفك 1.0850 (أعلى)',          time: Date.now()-120000,   read:false },
  { id:2,  type:'trade',    icon:'📊', titleEn:'Trade Executed',                titleAr:'تمت الصفقة',                bodyEn:'Buy 0.5 lot GBP/USD @ 1.2748 — SL: 1.2700',      bodyAr:'شراء 0.5 لوت GBP/USD بسعر 1.2748',        time: Date.now()-600000,   read:false },
  { id:3,  type:'wallet',   icon:'💳', titleEn:'Deposit Confirmed',             titleAr:'تم تأكيد الإيداع',          bodyEn:'$5,000 USDT deposited via TRC20',                 bodyAr:'تم إيداع 5,000 USDT عبر TRC20',            time: Date.now()-3600000,  read:true  },
  { id:4,  type:'system',   icon:'⚙️', titleEn:'Password Changed',             titleAr:'تم تغيير كلمة المرور',      bodyEn:'Your account password was updated successfully',  bodyAr:'تم تحديث كلمة مرور حسابك بنجاح',           time: Date.now()-7200000,  read:true  },
  { id:5,  type:'invest',   icon:'📈', titleEn:'Investment Payout',             titleAr:'صرف الاستثمار',             bodyEn:'90-Day plan matured. $12,369.86 credited',        bodyAr:'اكتملت خطة 90 يومًا. تم إضافة 12,369.86$', time: Date.now()-86400000, read:true  },
  { id:6,  type:'copy',     icon:'🔄', titleEn:'Copy Trade Closed',             titleAr:'أُغلقت صفقة النسخ',         bodyEn:'AlphaStrike: EUR/USD +$142.80 profit',            bodyAr:'AlphaStrike: EUR/USD ربح +142.80$',         time: Date.now()-90000000, read:true  },
  { id:7,  type:'kyc',      icon:'✅', titleEn:'KYC Verification Approved',     titleAr:'تمت الموافقة على التحقق',   bodyEn:'Your identity has been verified successfully',    bodyAr:'تم التحقق من هويتك بنجاح',                 time: Date.now()-172800000,read:true  },
  { id:8,  type:'alert',    icon:'⚠️', titleEn:'Margin Call Warning',           titleAr:'تحذير مارجن كول',           bodyEn:'Account margin level at 120%. Add funds now.',    bodyAr:'مستوى الهامش 120%. أضف رصيدًا الآن.',       time: Date.now()-180000000,read:true  },
  { id:9,  type:'promo',    icon:'🎁', titleEn:'Referral Bonus Credited',       titleAr:'تم إضافة مكافأة الإحالة',   bodyEn:'$50 bonus for referring Ahmed Al-Rashid',         bodyAr:'مكافأة 50$ لإحالة أحمد الراشد',            time: Date.now()-259200000,read:true  },
  { id:10, type:'trade',    icon:'📊', titleEn:'Take Profit Hit',               titleAr:'تحقق هدف الربح',            bodyEn:'XAU/USD TP hit @ 2028.50 — Profit: $620',        bodyAr:'وصل XAU/USD لهدف الربح 2028.50 — ربح: 620$', time: Date.now()-345600000,read:true  },
];

const PREF_CATS = [
  { id:'trade',  en:'Trade Executions',     ar:'تنفيذ الصفقات' },
  { id:'alert',  en:'Price Alerts',         ar:'تنبيهات السعر' },
  { id:'wallet', en:'Wallet & Deposits',    ar:'المحفظة والإيداعات' },
  { id:'invest', en:'Investments & Payouts',ar:'الاستثمارات والعوائد' },
  { id:'copy',   en:'Copy Trading',         ar:'نسخ التداول' },
  { id:'kyc',    en:'KYC & Verification',   ar:'التحقق من الهوية' },
  { id:'promo',  en:'Promotions & Bonuses', ar:'العروض والمكافآت' },
  { id:'system', en:'Security & Account',   ar:'الأمان والحساب' },
];

const TYPE_COLORS = {
  alert:'#f59e0b', trade:'#6366f1', wallet:'#10b981',
  system:'#64748b', invest:'#D4A843', copy:'#8b5cf6',
  kyc:'#22d3ee', promo:'#ec4899',
};

function timeAgo(ts, isAr) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (isAr) {
    if (m < 2) return 'الآن';
    if (m < 60) return `منذ ${m} دقيقة`;
    if (h < 24) return `منذ ${h} ساعة`;
    return `منذ ${d} يوم`;
  }
  if (m < 2) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function groupByDay(notifs, isAr) {
  const groups = {};
  notifs.forEach(n => {
    const d = new Date(n.time);
    const now = new Date();
    const key = d.toDateString() === now.toDateString()
      ? (isAr ? 'اليوم' : 'Today')
      : d.toDateString() === new Date(now - 86400000).toDateString()
        ? (isAr ? 'أمس' : 'Yesterday')
        : d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday:'long', month:'short', day:'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

export default function NotificationsTab({ theme, lang }) {
  const isAr = lang === 'ar';
  const font = isAr ? "'Cairo','Tajawal',sans-serif" : "'Inter',system-ui,sans-serif";

  const [activeTab, setActiveTab] = useState('all');
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const [prefs, setPrefs] = useState(() => {
    const init = {};
    PREF_CATS.forEach(c => { init[c.id] = { inApp: true, email: true, push: false }; });
    return init;
  });
  const [filterType, setFilterType] = useState('all');

  const T = {
    en: { all:'All', unread:'Unread', preferences:'Preferences', markAll:'Mark all read', clear:'Clear all', noNotifs:'No notifications', inApp:'In-App', email:'Email', push:'Push', channel:'Channel' },
    ar: { all:'الكل', unread:'غير مقروءة', preferences:'الإعدادات', markAll:'تعليم الكل مقروء', clear:'مسح الكل', noNotifs:'لا توجد إشعارات', inApp:'داخل التطبيق', email:'البريد', push:'الإشعارات', channel:'القناة' },
  };
  const t = T[isAr ? 'ar' : 'en'];

  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll = () => setNotifs([]);
  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id) => setNotifs(prev => prev.filter(n => n.id !== id));

  const filtered = notifs.filter(n => {
    if (activeTab === 'unread' && n.read) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;
    return true;
  });

  const groups = groupByDay(filtered, isAr);

  const togglePref = (cat, channel) => {
    setPrefs(prev => ({ ...prev, [cat]: { ...prev[cat], [channel]: !prev[cat][channel] } }));
  };

  const s = {
    wrap: { fontFamily: font, color: '#fff', padding: '20px', minHeight: '100vh', direction: isAr ? 'rtl' : 'ltr' },
    card: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' },
    tab: (a) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: a ? '#D4A843' : 'rgba(255,255,255,0.06)', color: a ? '#000' : 'rgba(255,255,255,0.6)', fontFamily: font, transition: 'all .2s', position: 'relative' }),
    btn: (c='rgba(255,255,255,0.07)') => ({ background: c, color: c === '#D4A843' ? '#000' : '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: font }),
    toggle: (on) => ({
      width: 38, height: 20, borderRadius: 10, background: on ? '#D4A843' : 'rgba(255,255,255,0.1)',
      position: 'relative', cursor: 'pointer', transition: 'background .2s', border: 'none', padding: 0, flexShrink: 0,
    }),
    toggleThumb: (on) => ({
      position: 'absolute', top: 2, left: on ? 20 : 2, width: 16, height: 16,
      borderRadius: '50%', background: '#fff', transition: 'left .2s',
    }),
  };

  /* NOTIF LIST */
  const notifsTab = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', ...Object.keys(TYPE_COLORS)].map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              style={{ ...s.btn(filterType === type ? (TYPE_COLORS[type] || '#D4A843') : 'rgba(255,255,255,0.06)'), padding: '5px 10px', fontSize: 11 }}>
              {type === 'all' ? t.all : type}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && <button style={s.btn()} onClick={markAllRead}>{t.markAll}</button>}
          <button style={s.btn()} onClick={clearAll}>{t.clear}</button>
        </div>
      </div>
      {Object.keys(groups).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔕</div>
          <div>{t.noNotifs}</div>
        </div>
      ) : (
        Object.entries(groups).map(([day, items]) => (
          <div key={day} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, padding: '0 4px' }}>{day}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(n => (
                <div key={n.id} onClick={() => markRead(n.id)}
                  style={{ display: 'flex', gap: 12, padding: '14px', background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)', borderRadius: 12, border: `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : TYPE_COLORS[n.type] + '33'}`, cursor: 'pointer', transition: 'background .2s', position: 'relative' }}>
                  {!n.read && <div style={{ position: 'absolute', top: 14, [isAr ? 'left' : 'right']: 14, width: 7, height: 7, borderRadius: '50%', background: TYPE_COLORS[n.type], boxShadow: `0 0 6px ${TYPE_COLORS[n.type]}` }} />}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: TYPE_COLORS[n.type] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13, marginBottom: 3 }}>
                      {isAr ? n.titleAr : n.titleEn}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                      {isAr ? n.bodyAr : n.bodyEn}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ ...s.btn(), background: TYPE_COLORS[n.type]+'22', color: TYPE_COLORS[n.type], padding: '2px 8px', fontSize: 10 }}>{n.type}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{timeAgo(n.time, isAr)}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 16, padding: 0, alignSelf: 'flex-start', lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );

  /* PREFERENCES */
  const prefsTab = (
    <div style={s.card}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>{isAr ? 'قنوات الإشعارات' : 'Notification Channels'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 0, fontSize: 12, marginBottom: 8 }}>
        <div style={{ color: 'rgba(255,255,255,0.35)', padding: '6px 0' }}>{t.channel}</div>
        {[t.inApp, t.email, t.push].map(ch => (
          <div key={ch} style={{ color: 'rgba(255,255,255,0.35)', textAlign: 'center', padding: '6px 0' }}>{ch}</div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {PREF_CATS.map(cat => (
          <div key={cat.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[cat.id] || '#D4A843' }} />
              <span style={{ fontSize: 13 }}>{isAr ? cat.ar : cat.en}</span>
            </div>
            {['inApp', 'email', 'push'].map(channel => (
              <div key={channel} style={{ display: 'flex', justifyContent: 'center' }}>
                <button style={s.toggle(prefs[cat.id][channel])} onClick={() => togglePref(cat.id, channel)}>
                  <div style={s.toggleThumb(prefs[cat.id][channel])} />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, padding: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        {isAr
          ? 'يتم تخزين تفضيلات الإشعارات محليًا. ستُطبّق التغييرات فورًا.'
          : 'Notification preferences are saved locally. Changes take effect immediately.'}
      </div>
    </div>
  );

  const TABS = [
    { id: 'all',   label: `${t.all}${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { id: 'unread', label: t.unread },
    { id: 'prefs',  label: t.preferences },
  ];

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
            {isAr ? 'الإشعارات' : 'Notifications'}
            {unreadCount > 0 && (
              <span style={{ marginLeft: 10, background: '#ef4444', color: '#fff', borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </h2>
          <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            {isAr ? 'ابقَ على اطلاع بجميع أنشطة حسابك' : 'Stay updated on all account activity'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map(tab => (
          <button key={tab.id} style={s.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {(activeTab === 'all' || activeTab === 'unread') && notifsTab}
      {activeTab === 'prefs' && prefsTab}
    </div>
  );
}
