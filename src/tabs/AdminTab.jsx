/* eslint-disable */
import { useState, useMemo } from 'react';

const SAMPLE_USERS = [
  { id:1,  name:'Ahmed Al-Rashid',  email:'ahmed@example.com',   plan:'Elite',    balance:125000, kyc:'verified', status:'active',   trades:342,  referrals:14, joined:'2023-06-12' },
  { id:2,  name:'Sara Johnson',     email:'sara@example.com',    plan:'Pro',      balance:42000,  kyc:'verified', status:'active',   trades:187,  referrals:6,  joined:'2023-08-23' },
  { id:3,  name:'Mohammed Al-Kbir', email:'mkbir@example.com',   plan:'Standard', balance:8500,   kyc:'pending',  status:'active',   trades:64,   referrals:2,  joined:'2023-11-01' },
  { id:4,  name:'Emma Chen',        email:'emma@example.com',    plan:'Elite',    balance:310000, kyc:'verified', status:'active',   trades:921,  referrals:31, joined:'2022-04-15' },
  { id:5,  name:'Khalid Nasser',    email:'khalid@example.com',  plan:'Pro',      balance:67000,  kyc:'verified', status:'suspended',trades:203,  referrals:8,  joined:'2023-05-20' },
  { id:6,  name:'Julia Rossi',      email:'julia@example.com',   plan:'Standard', balance:3200,   kyc:'rejected', status:'active',   trades:21,   referrals:0,  joined:'2024-01-08' },
  { id:7,  name:'Faris Al-Otaibi',  email:'faris@example.com',   plan:'Elite',    balance:540000, kyc:'verified', status:'active',   trades:1204, referrals:47, joined:'2022-01-03' },
  { id:8,  name:'Anna Müller',      email:'anna@example.com',    plan:'Standard', balance:11000,  kyc:'pending',  status:'active',   trades:88,   referrals:3,  joined:'2023-09-14' },
];

const KYC_QUEUE = [
  { id:1, name:'Mohammed Al-Kbir', email:'mkbir@example.com',  doc:'Passport',     submitted:'2024-01-28', country:'SA', risk:'low'    },
  { id:2, name:'Anna Müller',      email:'anna@example.com',   doc:'National ID',   submitted:'2024-01-29', country:'DE', risk:'low'    },
  { id:3, name:'Ryan Torres',      email:'ryan@example.com',   doc:'Driver License',submitted:'2024-01-30', country:'US', risk:'medium' },
  { id:4, name:'Yuki Tanaka',      email:'yuki@example.com',   doc:'Passport',      submitted:'2024-01-31', country:'JP', risk:'low'    },
];

const WITHDRAWALS = [
  { id:1, user:'Ahmed Al-Rashid', amount:15000, method:'USDT TRC20', address:'TXxxx...abc', status:'pending', date:'2024-01-31 14:23' },
  { id:2, user:'Emma Chen',       amount:50000, method:'Bank Wire',   address:'IBAN: DE89...', status:'pending', date:'2024-01-31 10:11' },
  { id:3, user:'Faris Al-Otaibi', amount:100000,method:'USDT ERC20', address:'0xabc...def', status:'pending', date:'2024-01-30 22:05' },
  { id:4, user:'Sara Johnson',    amount:8000,  method:'USDT TRC20', address:'TYyyy...xyz', status:'approved', date:'2024-01-30 18:44' },
];

function MiniBarChart({ data, color, labels }) {
  const max = Math.max(...data);
  const w = 280, h = 100, barW = (w - 20) / data.length - 4;
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} style={{ width: '100%', maxHeight: 120 }}>
      {data.map((v, i) => {
        const bh = Math.max(4, (v / max) * (h - 10));
        const x = 10 + i * ((w - 20) / data.length) + 2;
        return (
          <g key={i}>
            <rect x={x} y={h - bh} width={barW} height={bh} rx="3" fill={color} opacity="0.8" />
            {labels && <text x={x + barW / 2} y={h + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function MiniLineChart({ data, color }) {
  const min = Math.min(...data), max = Math.max(...data);
  const w = 280, h = 80;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min + 1)) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxHeight: 80 }}>
      <defs>
        <linearGradient id={`lg${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#lg${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PieChart({ data }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  let startAngle = -Math.PI / 2;
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = 50 + 40 * Math.cos(startAngle);
    const y1 = 50 + 40 * Math.sin(startAngle);
    const x2 = 50 + 40 * Math.cos(startAngle + angle);
    const y2 = 50 + 40 * Math.sin(startAngle + angle);
    const la = angle > Math.PI ? 1 : 0;
    const path = `M50,50 L${x1},${y1} A40,40,0,${la},1,${x2},${y2} Z`;
    startAngle += angle;
    return { ...d, path };
  });
  return (
    <svg viewBox="0 0 100 100" style={{ width: 100, height: 100 }}>
      {slices.map((sl, i) => <path key={i} d={sl.path} fill={sl.color} />)}
      <circle cx="50" cy="50" r="22" fill="rgba(10,10,20,0.9)" />
    </svg>
  );
}

export default function AdminTab({ theme, lang }) {
  const isAr = lang === 'ar';
  const font = isAr ? "'Cairo','Tajawal',sans-serif" : "'Inter',system-ui,sans-serif";

  const [activeTab, setActiveTab] = useState('dashboard');
  const [userSearch, setUserSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [kycAction, setKycAction] = useState({});
  const [withdrawAction, setWithdrawAction] = useState({});
  const [settings, setSettings] = useState({
    maintenance: false, twoFARequired: true, newRegistrations: true,
    withdrawalLimit: 50000, minDeposit: 100, referralBonus: 50,
    announcement: '',
  });

  const T = {
    en: {
      dashboard:'Dashboard', users:'Users', kyc:'KYC', withdrawals:'Withdrawals', settings:'Settings',
      totalUsers:'Total Users', activeUsers:'Active Users', totalVolume:'Total Volume', revenue:'Revenue',
      pendingKYC:'Pending KYC', pendingWD:'Pending Withdrawals', userGrowth:'User Growth', volumeChart:'Trading Volume',
      search:'Search users...', status:'Status', plan:'Plan', balance:'Balance', trades:'Trades', actions:'Actions',
      ban:'Ban', unban:'Unban', view:'View', kyc_status:'KYC', joined:'Joined',
      approve:'Approve', reject:'Reject', doc:'Document', country:'Country', risk:'Risk',
      amount:'Amount', method:'Method', address:'Address', date:'Date',
      maintenance_mode:'Maintenance Mode', twoFA:'2FA Required', newReg:'Allow New Registrations',
      wdLimit:'Daily Withdrawal Limit', minDep:'Min Deposit', refBonus:'Referral Bonus',
      announcement:'Site Announcement', save:'Save Settings', clear:'Clear',
      distribution:'User Distribution',
    },
    ar: {
      dashboard:'لوحة التحكم', users:'المستخدمون', kyc:'التحقق', withdrawals:'السحوبات', settings:'الإعدادات',
      totalUsers:'إجمالي المستخدمين', activeUsers:'المستخدمون النشطون', totalVolume:'الحجم الكلي', revenue:'الإيرادات',
      pendingKYC:'KYC معلق', pendingWD:'سحوبات معلقة', userGrowth:'نمو المستخدمين', volumeChart:'حجم التداول',
      search:'البحث عن مستخدمين...', status:'الحالة', plan:'الخطة', balance:'الرصيد', trades:'الصفقات', actions:'إجراءات',
      ban:'حظر', unban:'رفع الحظر', view:'عرض', kyc_status:'KYC', joined:'تاريخ الانضمام',
      approve:'موافقة', reject:'رفض', doc:'المستند', country:'الدولة', risk:'المخاطرة',
      amount:'المبلغ', method:'الطريقة', address:'العنوان', date:'التاريخ',
      maintenance_mode:'وضع الصيانة', twoFA:'2FA إلزامي', newReg:'السماح بتسجيلات جديدة',
      wdLimit:'حد السحب اليومي', minDep:'الحد الأدنى للإيداع', refBonus:'مكافأة الإحالة',
      announcement:'إعلان الموقع', save:'حفظ الإعدادات', clear:'مسح',
      distribution:'توزيع المستخدمين',
    }
  };
  const t = T[isAr ? 'ar' : 'en'];

  const s = {
    wrap: { fontFamily: font, color: '#fff', padding: '20px', minHeight: '100vh', direction: isAr ? 'rtl' : 'ltr' },
    card: { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px' },
    tab: (a) => ({ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: a ? '#D4A843' : 'rgba(255,255,255,0.06)', color: a ? '#000' : 'rgba(255,255,255,0.6)', fontFamily: font, transition: 'all .2s' }),
    btn: (c='rgba(255,255,255,0.07)', sm=false) => ({ background: c, color: ['#10b981','#ef4444','#D4A843','#f59e0b'].includes(c) ? '#fff' : '#fff', border: 'none', borderRadius: sm ? 6 : 8, padding: sm ? '4px 10px' : '8px 14px', fontWeight: 600, fontSize: sm ? 11 : 12, cursor: 'pointer', fontFamily: font }),
    input: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: font, outline: 'none', width: '100%', boxSizing: 'border-box' },
    badge: (c) => ({ background: c+'22', color: c, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }),
  };

  const TABS = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'users',     label: t.users },
    { id: 'kyc',       label: `${t.kyc} (${KYC_QUEUE.filter(k=>!kycAction[k.id]).length})` },
    { id: 'withdrawals', label: `${t.withdrawals} (${WITHDRAWALS.filter(w=>w.status==='pending'&&!withdrawAction[w.id]).length})` },
    { id: 'settings',  label: t.settings },
  ];

  /* -------- DASHBOARD -------- */
  const STATS = [
    { l: t.totalUsers,   v: '24,812', delta: '+3.2%', c: '#6366f1' },
    { l: t.activeUsers,  v: '18,540', delta: '+1.8%', c: '#10b981' },
    { l: t.totalVolume,  v: '$142.8M', delta: '+12.4%',c: '#D4A843' },
    { l: t.revenue,      v: '$284,620',delta: '+8.1%', c: '#f59e0b' },
    { l: t.pendingKYC,   v: KYC_QUEUE.length.toString(), delta: '', c: '#ef4444' },
    { l: t.pendingWD,    v: WITHDRAWALS.filter(w=>w.status==='pending').length.toString(), delta: '', c: '#8b5cf6' },
  ];
  const userGrowthData = [820,940,1200,1050,1380,1540,1820,2100,1960,2340,2580,3020];
  const volumeData = [12.4,15.8,13.2,18.6,22.1,19.8,24.5,28.2,25.6,31.4,29.8,35.6];
  const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
  const planDist = [
    { label:'Elite', value:18, color:'#D4A843' },
    { label:'Pro',   value:32, color:'#6366f1' },
    { label:'Std',   value:50, color:'#64748b' },
  ];

  const dashboardTab = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        {STATS.map(st => (
          <div key={st.l} style={{ ...s.card, padding: '16px' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{st.l}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: st.c }}>{st.v}</div>
            {st.delta && <div style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>{st.delta} {isAr ? 'هذا الشهر' : 'this month'}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: 16 }}>
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t.userGrowth}</div>
          <MiniBarChart data={userGrowthData} color="#6366f1" labels={months} />
        </div>
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t.volumeChart} (M)</div>
          <MiniLineChart data={volumeData} color="#D4A843" />
        </div>
        <div style={s.card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{t.distribution}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PieChart data={planDist} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {planDist.map(d => (
                <div key={d.label} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>{d.label}</span>
                  <span style={{ fontWeight: 700 }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  /* -------- USERS -------- */
  const filteredUsers = useMemo(() =>
    SAMPLE_USERS.filter(u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    ), [userSearch]);

  const usersTab = (
    <>
      <div style={{ marginBottom: 14 }}>
        <input style={s.input} placeholder={t.search} value={userSearch} onChange={e => setUserSearch(e.target.value)} />
      </div>
      <div style={s.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {[t.users, t.plan, t.balance, t.kyc_status, t.status, t.trades, t.actions].map(h => (
                <th key={h} style={{ padding: '9px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: isAr ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <>
                <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                  onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ ...s.badge(user.plan === 'Elite' ? '#D4A843' : user.plan === 'Pro' ? '#6366f1' : '#64748b') }}>{user.plan}</span>
                  </td>
                  <td style={{ padding: '10px 8px', fontWeight: 700 }}>${user.balance.toLocaleString()}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ ...s.badge(user.kyc === 'verified' ? '#10b981' : user.kyc === 'pending' ? '#f59e0b' : '#ef4444') }}>{user.kyc}</span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ ...s.badge(user.status === 'active' ? '#10b981' : '#ef4444') }}>{user.status}</span>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{user.trades}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={s.btn(user.status === 'active' ? '#ef4444' : '#10b981', true)}>
                        {user.status === 'active' ? t.ban : t.unban}
                      </button>
                      <button style={s.btn('rgba(255,255,255,0.08)', true)}>{t.view}</button>
                    </div>
                  </td>
                </tr>
                {expandedUser === user.id && (
                  <tr key={`${user.id}-expand`}>
                    <td colSpan={7} style={{ padding: '0 8px 12px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                        {[
                          { l: t.joined, v: user.joined },
                          { l: isAr ? 'الإحالات' : 'Referrals', v: user.referrals },
                          { l: t.balance, v: `$${user.balance.toLocaleString()}` },
                          { l: t.trades,  v: user.trades },
                        ].map(item => (
                          <div key={item.l}>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>{item.l}</div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{item.v}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  /* -------- KYC -------- */
  const kycTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {KYC_QUEUE.map(item => {
        const action = kycAction[item.id];
        return (
          <div key={item.id} style={{ ...s.card, opacity: action ? 0.5 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.email}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 8, fontSize: 12 }}>
                  <span>{t.doc}: <b>{item.doc}</b></span>
                  <span>{t.country}: <b>{item.country}</b></span>
                  <span style={{ ...s.badge(item.risk === 'low' ? '#10b981' : '#f59e0b') }}>{item.risk} {t.risk}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{t.date}: {item.submitted}</div>
              </div>
              {!action ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btn('#10b981')} onClick={() => setKycAction(p => ({ ...p, [item.id]: 'approved' }))}>{t.approve}</button>
                  <button style={s.btn('#ef4444')} onClick={() => setKycAction(p => ({ ...p, [item.id]: 'rejected' }))}>{t.reject}</button>
                </div>
              ) : (
                <span style={{ ...s.badge(action === 'approved' ? '#10b981' : '#ef4444'), fontSize: 13 }}>
                  {action === 'approved' ? '✓ Approved' : '✗ Rejected'}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  /* -------- WITHDRAWALS -------- */
  const withdrawalsTab = (
    <div style={s.card}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {[t.users, t.amount, t.method, t.date, t.status, t.actions].map(h => (
              <th key={h} style={{ padding: '9px 8px', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textAlign: isAr ? 'right' : 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WITHDRAWALS.map(wd => {
            const action = withdrawAction[wd.id];
            const effectiveStatus = action || wd.status;
            return (
              <tr key={wd.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: action ? 0.6 : 1 }}>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ fontWeight: 600 }}>{wd.user}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wd.address}</div>
                </td>
                <td style={{ padding: '10px 8px', fontWeight: 700, color: '#ef4444' }}>${wd.amount.toLocaleString()}</td>
                <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.6)' }}>{wd.method}</td>
                <td style={{ padding: '10px 8px', color: 'rgba(255,255,255,0.4)' }}>{wd.date}</td>
                <td style={{ padding: '10px 8px' }}>
                  <span style={{ ...s.badge(effectiveStatus === 'approved' ? '#10b981' : effectiveStatus === 'rejected' ? '#ef4444' : '#f59e0b') }}>
                    {effectiveStatus}
                  </span>
                </td>
                <td style={{ padding: '10px 8px' }}>
                  {!action && wd.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={s.btn('#10b981', true)} onClick={() => setWithdrawAction(p => ({ ...p, [wd.id]: 'approved' }))}>{t.approve}</button>
                      <button style={s.btn('#ef4444', true)} onClick={() => setWithdrawAction(p => ({ ...p, [wd.id]: 'rejected' }))}>{t.reject}</button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  /* -------- SETTINGS -------- */
  const Toggle = ({ on, onChange }) => (
    <button onClick={() => onChange(!on)}
      style={{ width: 44, height: 24, borderRadius: 12, background: on ? '#D4A843' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
    </button>
  );
  const settingsTab = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>{isAr ? 'إعدادات النظام' : 'System Settings'}</h3>
        {[
          { k: 'maintenance',      l: t.maintenance_mode },
          { k: 'twoFARequired',    l: t.twoFA },
          { k: 'newRegistrations', l: t.newReg },
        ].map(item => (
          <div key={item.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 13 }}>{item.l}</span>
            <Toggle on={settings[item.k]} onChange={v => setSettings(p => ({ ...p, [item.k]: v }))} />
          </div>
        ))}
      </div>
      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>{isAr ? 'الحدود المالية' : 'Financial Limits'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { k: 'withdrawalLimit', l: t.wdLimit, prefix: '$' },
            { k: 'minDeposit',      l: t.minDep,  prefix: '$' },
            { k: 'referralBonus',   l: t.refBonus, prefix: '$' },
          ].map(item => (
            <div key={item.k}>
              <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 5 }}>{item.l}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{item.prefix}</span>
                <input style={{ ...s.input, paddingLeft: 24 }} type="number" value={settings[item.k]}
                  onChange={e => setSettings(p => ({ ...p, [item.k]: +e.target.value }))} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={s.card}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700 }}>{t.announcement}</h3>
        <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
          placeholder={isAr ? 'اكتب إعلانًا ليظهر لجميع المستخدمين...' : 'Write an announcement shown to all users...'}
          value={settings.announcement}
          onChange={e => setSettings(p => ({ ...p, announcement: e.target.value }))} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button style={s.btn('#D4A843')}>{t.save}</button>
          <button style={s.btn()} onClick={() => setSettings(p => ({ ...p, announcement: '' }))}>{t.clear}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{isAr ? 'لوحة الإدارة' : 'Admin Panel'}</h2>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          {isAr ? 'إدارة شاملة للمنصة' : 'Full platform management'}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map(tab => <button key={tab.id} style={s.tab(activeTab === tab.id)} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </div>
      {activeTab === 'dashboard'   && dashboardTab}
      {activeTab === 'users'       && usersTab}
      {activeTab === 'kyc'         && kycTab}
      {activeTab === 'withdrawals' && withdrawalsTab}
      {activeTab === 'settings'    && settingsTab}
    </div>
  );
}
