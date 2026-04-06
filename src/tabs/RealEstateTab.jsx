/* eslint-disable */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { proxyAI } from '../utils/ai';
import { API } from '../utils/api.js';

/* ══════════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════════ */
const CITIES = [
  { id: 'riyadh',    nameEn: 'Riyadh',      nameAr: 'الرياض',      price: 4200,  currency: 'SAR', yoy: 12.3, yield: 5.8, sparkSeed: 1 },
  { id: 'jeddah',   nameEn: 'Jeddah',       nameAr: 'جدة',         price: 3800,  currency: 'SAR', yoy: 8.7,  yield: 6.2, sparkSeed: 2 },
  { id: 'dubai',    nameEn: 'Dubai',         nameAr: 'دبي',         price: 12500, currency: 'AED', yoy: 19.4, yield: 7.1, sparkSeed: 3 },
  { id: 'abudhabi', nameEn: 'Abu Dhabi',     nameAr: 'أبوظبي',     price: 9800,  currency: 'AED', yoy: 11.2, yield: 6.4, sparkSeed: 4 },
  { id: 'cairo',    nameEn: 'Cairo',         nameAr: 'القاهرة',    price: 28000, currency: 'EGP', yoy: 35.1, yield: 8.3, sparkSeed: 5 },
  { id: 'kuwait',   nameEn: 'Kuwait City',   nameAr: 'مدينة الكويت', price: 850,    currency: 'KWD', yoy: 6.8,  yield: 4.9,  sparkSeed: 6 },
  { id: 'baghdad',  nameEn: 'Baghdad',       nameAr: 'بغداد',         price: 2400000,currency: 'IQD', yoy: 18.5, yield: 7.2,  sparkSeed: 7,  country:'Iraq',   flag:'🇮🇶' },
  { id: 'erbil',    nameEn: 'Erbil',         nameAr: 'أربيل',         price: 1850000,currency: 'IQD', yoy: 22.3, yield: 8.1,  sparkSeed: 8,  country:'Iraq',   flag:'🇮🇶' },
  { id: 'basra',    nameEn: 'Basra',         nameAr: 'البصرة',        price: 1200000,currency: 'IQD', yoy: 15.2, yield: 9.3,  sparkSeed: 9,  country:'Iraq',   flag:'🇮🇶' },
  { id: 'najaf',    nameEn: 'Najaf',         nameAr: 'النجف',         price: 1650000,currency: 'IQD', yoy: 28.4, yield: 10.2, sparkSeed: 10, country:'Iraq',   flag:'🇮🇶' },
  { id: 'karbala',  nameEn: 'Karbala',       nameAr: 'كربلاء',       price: 1350000,currency: 'IQD', yoy: 25.1, yield: 9.8,  sparkSeed: 11, country:'Iraq',   flag:'🇮🇶' },
];

const MARKET_STATS = [
  { labelEn: 'Market Size',       labelAr: 'حجم السوق',        value: '$2.7T',   icon: '🏛️' },
  { labelEn: 'Avg Transaction',   labelAr: 'متوسط الصفقة',     value: '$485K',   icon: '💰' },
  { labelEn: 'YoY Growth',        labelAr: 'نمو سنوي',         value: '+16.8%',  icon: '📈' },
  { labelEn: 'Active Listings',   labelAr: 'قوائم نشطة',       value: '142,600', icon: '🏘️' },
  { labelEn: 'Iraq Market',       labelAr: 'السوق العراقي',    value: '+21.2%',  icon: '🇮🇶' },
  { labelEn: 'Cities Covered',    labelAr: 'المدن المشمولة',   value: '11',      icon: '📍' },
];

const COMPARE_ASSETS = [
  { nameEn: 'Real Estate', nameAr: 'عقارات',   pct: 12.3, color: '#22c55e' },
  { nameEn: 'Gold',        nameAr: 'ذهب',       pct: 8.4,  color: '#eab308' },
  { nameEn: 'S&P 500',     nameAr: 'S&P 500',  pct: 18.2, color: '#3b82f6' },
  { nameEn: 'Crypto',      nameAr: 'كريبتو',   pct: 45.6, color: '#f97316' },
];

const TRANSACTIONS = [
  { city: 'Dubai',       cityAr: 'دبي',         type: 'Apartment', typeAr: 'شقة',     area: 120, price: '1,500,000 AED', date: '2025-03-20' },
  { city: 'Riyadh',      cityAr: 'الرياض',      type: 'Villa',     typeAr: 'فيلا',    area: 450, price: '3,200,000 SAR', date: '2025-03-19' },
  { city: 'Cairo',       cityAr: 'القاهرة',     type: 'Commercial',typeAr: 'تجاري',   area: 200, price: '8,500,000 EGP', date: '2025-03-18' },
  { city: 'Abu Dhabi',   cityAr: 'أبوظبي',      type: 'Apartment', typeAr: 'شقة',     area: 95,  price: '980,000 AED',   date: '2025-03-17' },
  { city: 'Jeddah',      cityAr: 'جدة',         type: 'Land',      typeAr: 'أرض',     area: 800, price: '2,100,000 SAR', date: '2025-03-16' },
  { city: 'Baghdad',     cityAr: 'بغداد',       type: 'Apartment', typeAr: 'شقة',     area: 180, price: '432,000,000 IQD', date: '2025-03-22' },
  { city: 'Erbil',      cityAr: 'أربيل',        type: 'Villa',     typeAr: 'فيلا',    area: 380, price: '703,000,000 IQD', date: '2025-03-21' },
  { city: 'Najaf',      cityAr: 'النجف',        type: 'Commercial',typeAr: 'تجاري',   area: 220, price: '363,000,000 IQD', date: '2025-03-20' },
];

const PROPERTIES = [
  { id:1,  typeEn:'Apartment',  typeAr:'شقة',    city:'Riyadh',    cityAr:'الرياض',    area:120, price:504000,  currency:'SAR', yield:5.8, roi:14.2, emoji:'🏙️', grad:'linear-gradient(135deg,#1e3a5f,#2d6a9f)', descEn:'Modern apartment in Al Olaya district, close to Kingdom Tower. Fully furnished with premium finishes.', descAr:'شقة عصرية في حي العليا، قريبة من برج المملكة. مفروشة بالكامل بتشطيبات فاخرة.' },
  { id:2,  typeEn:'Apartment',  typeAr:'شقة',    city:'Jeddah',    cityAr:'جدة',       area:95,  price:361000,  currency:'SAR', yield:6.2, roi:15.1, emoji:'🌊', grad:'linear-gradient(135deg,#1a4a3a,#2e8b5a)', descEn:'Sea-view apartment in Al Hamra, 5 min from Corniche. Open kitchen, 2 bed, 2 bath.', descAr:'شقة بإطلالة بحرية في الحمراء، 5 دقائق من الكورنيش. مطبخ مفتوح، غرفتان، حمامان.' },
  { id:3,  typeEn:'Apartment',  typeAr:'شقة',    city:'Dubai',     cityAr:'دبي',       area:80,  price:1000000, currency:'AED', yield:7.1, roi:19.4, emoji:'🌃', grad:'linear-gradient(135deg,#3a1f5f,#7c3aed)', descEn:'Luxury studio in Downtown Dubai, Burj Khalifa view. Pool, gym, concierge service.', descAr:'استوديو فاخر في وسط مدينة دبي، إطلالة على برج خليفة. مسبح وصالة رياضية وخدمة استقبال.' },
  { id:4,  typeEn:'Apartment',  typeAr:'شقة',    city:'Cairo',     cityAr:'القاهرة',  area:150, price:4200000, currency:'EGP', yield:8.3, roi:22.6, emoji:'🏛️', grad:'linear-gradient(135deg,#5f3a1a,#c27a2a)', descEn:'Spacious apartment in New Administrative Capital, gated compound, smart home system.', descAr:'شقة واسعة في العاصمة الإدارية الجديدة، كمباوند مسوّر، نظام المنزل الذكي.' },
  { id:5,  typeEn:'Villa',      typeAr:'فيلا',   city:'Riyadh',    cityAr:'الرياض',    area:450, price:3200000, currency:'SAR', yield:4.9, roi:12.8, emoji:'🏡', grad:'linear-gradient(135deg,#1a3a1a,#2d7a2d)', descEn:'Grand villa in Al Malqa, private pool, 5 bedrooms, smart home, driver\'s room.', descAr:'فيلا فارهة في الملقا، مسبح خاص، 5 غرف نوم، منزل ذكي، غرفة سائق.' },
  { id:6,  typeEn:'Villa',      typeAr:'فيلا',   city:'Dubai',     cityAr:'دبي',       area:600, price:8500000, currency:'AED', yield:5.6, roi:16.2, emoji:'🌴', grad:'linear-gradient(135deg,#1a2a3f,#1a5a7a)', descEn:'Palm Jumeirah villa, private beach access, 6 bed, infinity pool, 2-car garage.', descAr:'فيلا في نخلة جميرا، إطلالة على الشاطئ الخاص، 6 غرف، مسبح لا نهاية له، كراج سيارتين.' },
  { id:7,  typeEn:'Villa',      typeAr:'فيلا',   city:'Abu Dhabi', cityAr:'أبوظبي',   area:520, price:5800000, currency:'AED', yield:5.2, roi:13.9, emoji:'🕌', grad:'linear-gradient(135deg,#2a1a3a,#5a2a7a)', descEn:'Saadiyat Island villa, beachfront, 5 bed, ultra-luxury finish, private garden.', descAr:'فيلا في جزيرة السعديات، واجهة بحرية، 5 غرف، تشطيبات فائقة الفخامة، حديقة خاصة.' },
  { id:8,  typeEn:'Commercial', typeAr:'تجاري',  city:'Riyadh',    cityAr:'الرياض',    area:300, price:2100000, currency:'SAR', yield:7.4, roi:18.3, emoji:'🏢', grad:'linear-gradient(135deg,#1a1a3a,#2a2a6a)', descEn:'Prime commercial space in Al Takhassousi, ground floor, high foot traffic.', descAr:'مساحة تجارية متميزة في التخصصي، الدور الأرضي، حركة مرور عالية.' },
  { id:9,  typeEn:'Commercial', typeAr:'تجاري',  city:'Dubai',     cityAr:'دبي',       area:250, price:3750000, currency:'AED', yield:8.1, roi:21.4, emoji:'🏬', grad:'linear-gradient(135deg,#1a2a1a,#2a5a2a)', descEn:'Business Bay office space, fitted out, panoramic view, 24/7 building access.', descAr:'مساحة مكتبية في بيزنس باي، مجهزة بالكامل، إطلالة بانورامية، دخول 24/7.' },
  { id:10, typeEn:'Land',       typeAr:'أرض',    city:'Riyadh',    cityAr:'الرياض',    area:1000,price:1200000, currency:'SAR', yield:0,   roi:25.0, emoji:'🌿', grad:'linear-gradient(135deg,#1a2a1a,#3a5a1a)', descEn:'Commercial land on King Salman Road outskirts, zoned for mixed-use development.', descAr:'أرض تجارية على أطراف طريق الملك سلمان، مخصصة للتطوير متعدد الاستخدامات.' },
  { id:11, typeEn:'Land',       typeAr:'أرض',    city:'Jeddah',    cityAr:'جدة',       area:800, price:960000,  currency:'SAR', yield:0,   roi:20.5, emoji:'⛱️', grad:'linear-gradient(135deg,#1a1a2a,#2a3a5a)', descEn:'Residential land near Al Shati district, all utilities connected, great location.', descAr:'أرض سكنية قرب حي الشاطئ، جميع الخدمات متصلة، موقع رائع.' },
  { id:12, typeEn:'Tokenized',  typeAr:'مجزأة',  city:'Dubai',     cityAr:'دبي',       area:180, price:2700000,   currency:'AED', yield:9.2,  roi:28.6, emoji:'🔗', grad:'linear-gradient(135deg,#1a1a1a,#7c3aed)', descEn:'Blockchain-tokenized luxury apartment in Marina, earn passive yield via smart contracts. Fractional ownership from $500.', descAr:'شقة فاخرة مُرمَّزة بالبلوكشين في مارينا، اكسب عائداً سلبياً عبر العقود الذكية. ملكية جزئية من 500 دولار.' },
  /* ── Iraq Properties ── */
  { id:13, typeEn:'Apartment',  typeAr:'شقة',    city:'Baghdad',   cityAr:'بغداد',     area:180, price:432000000, currency:'IQD', yield:7.2,  roi:18.5, emoji:'🏙️', grad:'linear-gradient(135deg,#1a0a05,#3d1a0a)', descEn:'Luxury apartment in Al-Mansour district, Baghdad. Fully finished, modern design, near embassies. 3 bedrooms, 2 bathrooms.', descAr:'شقة فاخرة في حي المنصور ببغداد. مكتملة التشطيب، تصميم عصري، قرب السفارات. 3 غرف نوم، 2 حمام.' },
  { id:14, typeEn:'Villa',      typeAr:'فيلا',   city:'Erbil',     cityAr:'أربيل',     area:380, price:703000000, currency:'IQD', yield:8.1,  roi:22.3, emoji:'🌿', grad:'linear-gradient(135deg,#071a07,#0f3d0f)', descEn:'Modern villa in Ankawa district, Erbil. Private garden, 5 bedrooms, 2 parking spaces, 24/7 security.', descAr:'فيلا عصرية في منطقة عنكاوا، أربيل. حديقة خاصة، 5 غرف نوم، موقفان للسيارات، حراسة على مدار الساعة.' },
  { id:15, typeEn:'Commercial', typeAr:'تجاري',  city:'Baghdad',   cityAr:'بغداد',     area:250, price:600000000, currency:'IQD', yield:9.3,  roi:24.1, emoji:'🏬', grad:'linear-gradient(135deg,#0a0a1a,#1a1a3d)', descEn:'Prime commercial space in Karada district, high traffic, ground floor, suitable for retail or offices.', descAr:'مساحة تجارية متميزة في منطقة الكرادة، حركة مرور عالية، الطابق الأرضي، مناسبة للبيع بالتجزئة أو المكاتب.' },
  { id:16, typeEn:'Apartment',  typeAr:'شقة',    city:'Najaf',     cityAr:'النجف',     area:145, price:239250000, currency:'IQD', yield:10.2, roi:28.4, emoji:'🕌', grad:'linear-gradient(135deg,#1a0f00,#3d2400)', descEn:'Apartment near the Holy Shrine of Imam Ali, high rental demand from visitors and pilgrims year-round.', descAr:'شقة قرب مرقد الإمام علي، طلب إيجاري مرتفع من الزوار والحجاج طوال العام.' },
  { id:17, typeEn:'Land',       typeAr:'أرض',    city:'Erbil',     cityAr:'أربيل',     area:600, price:555000000, currency:'IQD', yield:0,    roi:30.0, emoji:'🌄', grad:'linear-gradient(135deg,#071507,#1a3d1a)', descEn:'Residential land in Al-Andalus compound, Erbil. Ready to build, all utilities connected, gated community.', descAr:'أرض سكنية في كمباوند الأندلس، أربيل. جاهزة للبناء، جميع الخدمات متصلة، مجمع مسوّر.' },
  { id:18, typeEn:'Villa',      typeAr:'فيلا',   city:'Karbala',   cityAr:'كربلاء',    area:320, price:432000000, currency:'IQD', yield:9.8,  roi:25.1, emoji:'🌙', grad:'linear-gradient(135deg,#0a0a1a,#15153d)', descEn:'Villa in Karbala Al-Jadida, strategic location near the Holy Shrines area, high rental value year-round.', descAr:'فيلا في كربلاء الجديدة، موقع استراتيجي قرب منطقة العتبات المقدسة، قيمة إيجارية مرتفعة على مدار السنة.' },
];

const REITS = [
  { id:1,  ticker:'RREIT',  nameEn:'Riyad REIT',          nameAr:'ريت الرياض',       price:9.82,  divYield:5.6, change52w:8.2,  sector:'Diversified', sectorAr:'متنوع',     rating:'Buy',  flag:'🇸🇦' },
  { id:2,  ticker:'MAATHER',nameEn:'Al Maather REIT',     nameAr:'ريت المعذر',       price:8.14,  divYield:6.1, change52w:5.4,  sector:'Retail',      sectorAr:'تجزئة',     rating:'Hold', flag:'🇸🇦' },
  { id:3,  ticker:'DREIT',  nameEn:'Derayah REIT',        nameAr:'ريت دراية',        price:11.30, divYield:5.9, change52w:12.1, sector:'Residential', sectorAr:'سكني',      rating:'Buy',  flag:'🇸🇦' },
  { id:4,  ticker:'JADWA',  nameEn:'Jadwa REIT',          nameAr:'ريت جدوى',         price:7.60,  divYield:6.8, change52w:4.2,  sector:'Commercial',  sectorAr:'تجاري',     rating:'Hold', flag:'🇸🇦' },
  { id:5,  ticker:'EREIT',  nameEn:'Emirates REIT',       nameAr:'ريت الإمارات',     price:0.42,  divYield:7.4, change52w:-3.1, sector:'Office',      sectorAr:'مكاتب',     rating:'Sell', flag:'🇦🇪' },
  { id:6,  ticker:'ENBD',   nameEn:'ENBD REIT',           nameAr:'ريت بنك دبي',      price:0.78,  divYield:8.2, change52w:9.7,  sector:'Diversified', sectorAr:'متنوع',     rating:'Buy',  flag:'🇦🇪' },
  { id:7,  ticker:'PLD',    nameEn:'Prologis',            nameAr:'برولوجيس',         price:128.40,divYield:3.1, change52w:14.8, sector:'Industrial',  sectorAr:'صناعي',     rating:'Buy',  flag:'🇺🇸' },
  { id:8,  ticker:'O',      nameEn:'Realty Income',       nameAr:'ريالتي إنكم',      price:54.20, divYield:5.8, change52w:6.3,  sector:'Retail',      sectorAr:'تجزئة',     rating:'Buy',  flag:'🇺🇸' },
  { id:9,  ticker:'VNQ',    nameEn:'Vanguard RE ETF',     nameAr:'فانغارد العقاري',  price:88.50, divYield:4.2, change52w:11.9, sector:'Diversified', sectorAr:'متنوع',     rating:'Buy',  flag:'🇺🇸' },
  { id:10, ticker:'SPG',    nameEn:'Simon Property',      nameAr:'سايمون بروبرتي',   price:168.30,divYield:5.3, change52w:18.4, sector:'Retail',      sectorAr:'تجزئة',     rating:'Hold', flag:'🇺🇸' },
  { id:11, ticker:'IRQR',  nameEn:'Iraq Real Estate Fund',nameAr:'صندوق العقار العراقي',price:1.24, divYield:8.8, change52w:21.2, sector:'Residential', sectorAr:'سكني',      rating:'Buy',  flag:'🇮🇶' },
  { id:12, ticker:'BGDF',  nameEn:'Baghdad Devp Fund',   nameAr:'صندوق تطوير بغداد', price:0.95,  divYield:9.5, change52w:18.5, sector:'Commercial',  sectorAr:'تجاري',     rating:'Buy',  flag:'🇮🇶' },
  { id:13, ticker:'ERRF',  nameEn:'Erbil REIT Fund',     nameAr:'ريت أربيل',         price:1.08,  divYield:10.2,change52w:25.0, sector:'Diversified', sectorAr:'متنوع',     rating:'Buy',  flag:'🇮🇶' },
];

const DEMO_CONTRACTS = [
  { id:'0x1a2b', type:'Sale',   typeAr:'بيع',   party1:'Ahmed Al-Rashidi', party2:'TechCorp Dubai', amount:'2,500,000 AED', status:'Active',    statusAr:'نشط',     date:'2025-03-10', statusColor:'#22c55e' },
  { id:'0x3c4d', type:'Rent',   typeAr:'إيجار', party1:'Sara Al-Qahtani',  party2:'Luxury Stays',   amount:'85,000 SAR/yr', status:'Completed', statusAr:'مكتمل',   date:'2025-02-28', statusColor:'#3b82f6' },
  { id:'0x5e6f', type:'Sale',   typeAr:'بيع',   party1:'Khalid Mansour',   party2:'Green Dev Co.',  amount:'1,200,000 AED', status:'Pending',   statusAr:'معلق',    date:'2025-03-18', statusColor:'#f59e0b' },
  { id:'0x7a8b', type:'Rent',   typeAr:'إيجار', party1:'Fatima Al-Zahra',  party2:'Gulf Retail LLC','amount':'120,000 SAR/yr',status:'Disputed', statusAr:'متنازع عليه',date:'2025-01-15', statusColor:'#ef4444' },
];

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const fmtNum = (n) => n?.toLocaleString('en-US', { maximumFractionDigits: 0 }) ?? '0';
const fmtPct = (n) => (n >= 0 ? '+' : '') + n.toFixed(1) + '%';

function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function Sparkline({ seed, positive = true, width = 80, height = 30 }) {
  const rand = seededRand(seed * 9999 + 1);
  const pts = Array.from({ length: 12 }, (_, i) => {
    const base = positive ? 0.3 + (i / 11) * 0.5 : 0.7 - (i / 11) * 0.4;
    return Math.max(0.05, Math.min(0.95, base + (rand() - 0.5) * 0.25));
  });
  const coords = pts.map((v, i) => `${(i / 11) * width},${height - v * height}`).join(' ');
  const fillPath = `M0,${height} ` + pts.map((v, i) => `${(i / 11) * width},${height - v * height}`).join(' L') + ` L${width},${height} Z`;
  const lineColor = positive ? '#22c55e' : '#ef4444';
  const fillColor = positive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)';
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={fillPath} fill={fillColor} />
      <polyline points={coords} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#22c55e', color: '#fff', padding: '12px 20px', borderRadius: 10, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', animation: 'fadeIn .3s ease' }}>
      {message}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MARKET TAB
══════════════════════════════════════════════════ */
function MarketTab({ theme, isAr }) {
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const primary = theme?.primary || '#7c3aed';

  const runAI = async () => {
    setAiLoading(true);
    const prompt = isAr
      ? `أنت محلل عقاري خبير في منطقة الشرق الأوسط. قدّم تحليلاً للسوق العقاري في 5 نقاط واضحة تشمل: 1. الاتجاه العام 2. أفضل مدينة للاستثمار 3. فرصة قصيرة المدى 4. مخاطر يجب مراعاتها 5. التوقع للأشهر الستة القادمة. كن محدداً وموجزاً.`
      : `You are a senior real estate analyst for the Middle East. Provide a 5-point market analysis covering: 1. Overall trend 2. Best city to invest now 3. Short-term opportunity 4. Key risks to watch 5. 6-month outlook. Be specific and concise.`;
    const text = await proxyAI(prompt, 600);
    setAiText(text || (isAr ? 'تعذّر تحميل التحليل. يرجى المحاولة لاحقاً.' : 'Could not load analysis. Please try again.'));
    setAiLoading(false);
  };

  const cardStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, backdropFilter: 'blur(12px)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
        {MARKET_STATS.map((s) => (
          <div key={s.labelEn} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: primary }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{isAr ? s.labelAr : s.labelEn}</div>
          </div>
        ))}
      </div>

      {/* Iraq Spotlight Banner */}
      <div style={{ ...cardStyle, background: 'rgba(0,68,0,0.15)', borderColor: 'rgba(0,160,0,0.25)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 32 }}>🇮🇶</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 3 }}>
            {isAr ? 'السوق العقاري العراقي — فرصة استثمارية صاعدة' : 'Iraq Real Estate Market — Emerging Investment Opportunity'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            {isAr
              ? 'بغداد وأربيل والنجف وكربلاء تشهد نمواً استثنائياً +21.2% سنوياً مع عوائد إيجارية تصل إلى 10.2%.'
              : 'Baghdad, Erbil, Najaf & Karbala showing exceptional +21.2% YoY growth with rental yields up to 10.2%.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[{ l:'Avg Yield', v:'9.1%', c:'#22c55e' }, { l:'YoY Growth', v:'+21.2%', c:'#f59e0b' }].map(st => (
            <div key={st.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: st.c }}>{st.v}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{st.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* City Cards */}
      <div>
        <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 600 }}>
          {isAr ? '📍 مؤشر السوق بالمدينة' : '📍 City Market Index'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
          {CITIES.map((city) => {
            const pos = city.yoy > 0;
            const isIraq = city.country === 'Iraq';
            return (
              <div key={city.id} style={{ ...cardStyle, position: 'relative', overflow: 'hidden', borderColor: isIraq ? 'rgba(0,160,0,0.2)' : 'rgba(255,255,255,0.1)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: pos ? (isIraq ? 'linear-gradient(90deg,#22c55e,#16a34a)' : '#22c55e') : '#ef4444', borderRadius: '14px 14px 0 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{isAr ? city.nameAr : city.nameEn}</div>
                  {city.flag && <div style={{ fontSize: 16 }}>{city.flag}</div>}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: primary }}>{fmtNum(city.price)} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{city.currency}/m²</span></div>
                <div style={{ display: 'flex', gap: 10, margin: '8px 0', fontSize: 12 }}>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>{fmtPct(city.yoy)} {isAr ? 'سنوي' : 'YoY'}</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>{city.yield}% {isAr ? 'عائد' : 'yield'}</span>
                </div>
                {isIraq && (
                  <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px #22c55e' }} />
                    {isAr ? 'فرصة صاعدة' : 'Emerging Market'}
                  </div>
                )}
                <Sparkline seed={city.sparkSeed} positive={pos} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Investment Comparison */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 600 }}>
          {isAr ? '📊 مقارنة العوائد (YTD)' : '📊 YTD Return Comparison'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {COMPARE_ASSETS.map((a) => {
            const maxPct = 50;
            const barW = Math.min(100, (a.pct / maxPct) * 100);
            return (
              <div key={a.nameEn} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 100, fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: isAr ? 'left' : 'right', flexShrink: 0 }}>{isAr ? a.nameAr : a.nameEn}</div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 22, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: barW + '%', background: a.color, borderRadius: 6, transition: 'width 1s ease', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#000', whiteSpace: 'nowrap' }}>{fmtPct(a.pct)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Analysis */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 600 }}>
            {isAr ? '🤖 تحليل السوق بالذكاء الاصطناعي' : '🤖 AI Market Analysis'}
          </h3>
          <button onClick={runAI} disabled={aiLoading} style={{ background: primary, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: aiLoading ? 'wait' : 'pointer', fontWeight: 600, fontSize: 13, opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? (isAr ? 'جارٍ التحليل...' : 'Analyzing...') : (isAr ? 'تشغيل التحليل' : 'Run Analysis')}
          </button>
        </div>
        {aiText && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-line', direction: isAr ? 'rtl' : 'ltr' }}>
            {aiText}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 600 }}>
          {isAr ? '🔄 آخر الصفقات' : '🔄 Recent Transactions'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TRANSACTIONS.map((tx, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: 13 }}>{isAr ? tx.cityAr : tx.city}</span>
                <span style={{ marginLeft: 8, marginRight: 8, color: 'rgba(255,255,255,0.4)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{isAr ? tx.typeAr : tx.type}</span>
                <span style={{ marginLeft: 8, marginRight: 8, color: 'rgba(255,255,255,0.4)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{tx.area}m²</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, color: primary, fontSize: 13 }}>{tx.price}</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{tx.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   PROPERTIES TAB
══════════════════════════════════════════════════ */
function PropertiesTab({ theme, isAr }) {
  const primary = theme?.primary || '#7c3aed';
  const [filter, setFilter] = useState({ type: 'All', city: 'All', country: 'All', minYield: 0, maxPrice: Infinity });
  const [sort, setSort] = useState('price_asc');
  const [favorites, setFavorites] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const [aiModal, setAiModal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  /* ── Live listings from DB ── */
  const [dbListings, setDbListings] = useState([]);
  const [dbLoaded,   setDbLoaded]   = useState(false);
  const [investing,  setInvesting]  = useState(false);

  useEffect(() => {
    API.getRealEstateListings({ limit: 100 }).then(res => {
      if (res.ok && res.data?.listings?.length > 0) {
        // Normalize DB rows to same shape used by this component
        setDbListings(res.data.listings.map((r, i) => ({
          id:         r.id,
          typeEn:     r.property_type ? (r.property_type.charAt(0).toUpperCase() + r.property_type.slice(1)) : 'Apartment',
          typeAr:     { apartment:'شقة', villa:'فيلا', office:'مكاتب', land:'أرض', warehouse:'مستودع', retail:'تجاري', hotel:'فندق' }[r.property_type] || 'عقار',
          city:       r.city || 'Dubai',
          cityAr:     r.city || 'دبي',
          area:       r.area_sqm || 0,
          price:      r.price || r.token_price || 0,
          currency:   r.currency || 'USD',
          yield:      r.annual_yield || 0,
          roi:        (r.annual_yield || 0) * 1.5,
          emoji:      '🏢',
          grad:       'linear-gradient(135deg,#1a1a2e,#16213e)',
          descEn:     r.description || '',
          descAr:     r.description_ar || r.description || '',
          // Fractional fields
          isFractional:    r.listing_type === 'fractional',
          totalTokens:     r.total_tokens,
          tokensSold:      r.tokens_sold,
          tokenPrice:      r.token_price,
          minInvestment:   r.min_investment,
          listingId:       r.id,
        })));
      }
      setDbLoaded(true);
    });
  }, []);

  // Use DB listings if loaded and non-empty, otherwise fall back to static data
  const SOURCE = dbLoaded && dbListings.length > 0 ? dbListings : PROPERTIES;

  const IRAQ_CITIES = ['Baghdad', 'Erbil', 'Basra', 'Najaf', 'Karbala'];
  const cities = useMemo(() => ['All', ...new Set(SOURCE.map(p => p.city))], [SOURCE]);
  const types = ['All', 'Apartment', 'Villa', 'Commercial', 'Land', 'Tokenized'];
  const countries = ['All', 'GCC / ME', 'Iraq 🇮🇶'];

  const filtered = useMemo(() => {
    let arr = SOURCE.filter(p => {
      if (filter.type !== 'All' && p.typeEn !== filter.type) return false;
      if (filter.city !== 'All' && p.city !== filter.city) return false;
      if (filter.country === 'Iraq 🇮🇶' && !IRAQ_CITIES.includes(p.city)) return false;
      if (filter.country === 'GCC / ME' && IRAQ_CITIES.includes(p.city)) return false;
      if (p.yield < filter.minYield) return false;
      return true;
    });
    if (sort === 'price_asc') arr.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') arr.sort((a, b) => b.price - a.price);
    if (sort === 'yield') arr.sort((a, b) => b.yield - a.yield);
    if (sort === 'area') arr.sort((a, b) => b.area - a.area);
    return arr;
  }, [filter, sort]);

  const toggleFav = (id) => setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const runPropAI = async (prop) => {
    setAiLoading(true);
    const prompt = isAr
      ? `حلّل هذا العقار للمستثمر: ${prop.typeAr} في ${prop.cityAr}، ${prop.area}م²، السعر ${fmtNum(prop.price)} ${prop.currency}، العائد الإيجاري ${prop.yield}%، عائد الاستثمار ${prop.roi}%. قدّم تحليلاً في 4 نقاط: 1.جودة الاستثمار 2.المخاطر 3.فرص النمو 4.توصية نهائية.`
      : `Analyze this property for an investor: ${prop.typeEn} in ${prop.city}, ${prop.area}m², price ${fmtNum(prop.price)} ${prop.currency}, rental yield ${prop.yield}%, ROI ${prop.roi}%. 4-point analysis: 1.Investment quality 2.Risks 3.Growth opportunities 4.Final recommendation.`;
    const text = await proxyAI(prompt, 500);
    setAiModal(text || (isAr ? 'تعذّر التحليل.' : 'Analysis unavailable.'));
    setAiLoading(false);
  };

  const mortgage = selected ? (() => {
    const rate = 0.045 / 12;
    const n = 25 * 12;
    const loan = selected.price * 0.8;
    const monthly = loan * rate * Math.pow(1 + rate, n) / (Math.pow(1 + rate, n) - 1);
    return { monthly: fmtNum(Math.round(monthly)), total: fmtNum(Math.round(monthly * n)), interest: fmtNum(Math.round(monthly * n - loan)) };
  })() : null;

  const selectBtn = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, transition: 'all .2s' };
  const selectBtnActive = { ...selectBtn, background: primary, borderColor: primary, color: '#fff', fontWeight: 600 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Filters */}
      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{isAr ? 'النوع' : 'Type'}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {types.map(t => (
              <button key={t} style={filter.type === t ? selectBtnActive : selectBtn} onClick={() => setFilter(f => ({ ...f, type: t }))}>
                {isAr ? (t === 'All' ? 'الكل' : t === 'Apartment' ? 'شقة' : t === 'Villa' ? 'فيلا' : t === 'Commercial' ? 'تجاري' : t === 'Land' ? 'أرض' : 'مجزأة') : t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{isAr ? 'البلد' : 'Country'}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {countries.map(c => (
              <button key={c} style={filter.country === c ? { ...selectBtnActive, borderColor: c === 'Iraq 🇮🇶' ? '#22c55e' : primary } : selectBtn}
                onClick={() => setFilter(f => ({ ...f, country: c, city: 'All' }))}>
                {isAr ? (c === 'All' ? 'الكل' : c === 'Iraq 🇮🇶' ? 'العراق 🇮🇶' : 'الخليج / الشرق الأوسط') : c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{isAr ? 'المدينة' : 'City'}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {cities.filter(c => {
              if (filter.country === 'Iraq 🇮🇶') return c === 'All' || IRAQ_CITIES.includes(c);
              if (filter.country === 'GCC / ME') return c === 'All' || !IRAQ_CITIES.includes(c);
              return true;
            }).map(c => (
              <button key={c} style={filter.city === c ? selectBtnActive : selectBtn} onClick={() => setFilter(f => ({ ...f, city: c }))}>
                {isAr ? (c === 'All' ? 'الكل' : CITIES.find(x => x.nameEn === c)?.nameAr || c) : c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{isAr ? 'الترتيب' : 'Sort'}</div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '6px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>
            <option value="price_asc">{isAr ? 'السعر ↑' : 'Price ↑'}</option>
            <option value="price_desc">{isAr ? 'السعر ↓' : 'Price ↓'}</option>
            <option value="yield">{isAr ? 'العائد ↓' : 'Yield ↓'}</option>
            <option value="area">{isAr ? 'المساحة ↓' : 'Area ↓'}</option>
          </select>
        </div>
      </div>

      {/* Property Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {filtered.map(prop => {
          const isIraqProp = IRAQ_CITIES.includes(prop.city);
          return (
          <div key={prop.id} onClick={() => setSelected(prop)} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${isIraqProp ? 'rgba(0,160,0,0.2)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s,border-color .2s', position: 'relative' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = primary; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = isIraqProp ? 'rgba(0,160,0,0.2)' : 'rgba(255,255,255,0.1)'; }}>
            {/* Header */}
            <div style={{ height: 120, background: prop.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, position: 'relative' }}>
              {prop.emoji}
              <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, color: '#fff' }}>
                {isAr ? prop.typeAr : prop.typeEn}
              </div>
              <button onClick={e => { e.stopPropagation(); toggleFav(prop.id); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {favorites.has(prop.id) ? '❤️' : '🤍'}
              </button>
              {prop.typeEn === 'Tokenized' && (
                <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(124,58,237,0.9)', borderRadius: 5, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 700 }}>TOKENIZED</div>
              )}
              {isIraqProp && (
                <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(0,100,0,0.85)', borderRadius: 5, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 700 }}>🇮🇶 Iraq</div>
              )}
            </div>
            {/* Body */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{isAr ? CITIES.find(c => c.nameEn === prop.city)?.nameAr : prop.city}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{fmtNum(prop.price)} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{prop.currency}</span></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{fmtNum(Math.round(prop.price / prop.area))} {prop.currency}/m² · {prop.area}m²</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {prop.yield > 0 && (
                  <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                    {prop.yield}% {isAr ? 'عائد' : 'yield'}
                  </div>
                )}
                <div style={{ background: 'rgba(124,58,237,0.2)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>
                  {prop.roi}% ROI
                </div>
                {isIraqProp && prop.yield >= 9 && (
                  <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                    🔥 {isAr ? 'عائد مرتفع' : 'High Yield'}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div onClick={() => { setSelected(null); setAiModal(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 18, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ height: 140, background: selected.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, borderRadius: '18px 18px 0 0', position: 'relative' }}>
              {selected.emoji}
              <button onClick={() => { setSelected(null); setAiModal(''); }} style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{isAr ? selected.typeAr : selected.typeEn} · {isAr ? CITIES.find(c => c.nameEn === selected.city)?.nameAr : selected.city}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{fmtNum(selected.price)} {selected.currency}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 16, direction: isAr ? 'rtl' : 'ltr' }}>{isAr ? selected.descAr : selected.descEn}</div>

              {/* Map ASCII */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 16, textAlign: 'center', lineHeight: 1.4 }}>
                {'┌─────────────────────┐'}<br/>
                {'│  🗺 ' + (isAr ? selected.cityAr : selected.city).padEnd(14) + '       │'}<br/>
                {'│      📍 Property    │'}<br/>
                {'│   ●═══════════════  │'}<br/>
                {'└─────────────────────┘'}
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { l: isAr ? 'المساحة' : 'Area', v: `${selected.area} m²` },
                  { l: isAr ? 'السعر/م²' : 'Price/m²', v: `${fmtNum(Math.round(selected.price / selected.area))} ${selected.currency}` },
                  { l: isAr ? 'العائد الإيجاري' : 'Rental Yield', v: selected.yield > 0 ? `${selected.yield}%` : 'N/A' },
                  { l: 'ROI', v: `${selected.roi}%` },
                ].map(item => (
                  <div key={item.l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>{item.l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: primary }}>{item.v}</div>
                  </div>
                ))}
              </div>

              {/* Mortgage */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{isAr ? '🏦 تقدير التمويل العقاري (4.5%، 25 سنة، 80%)' : '🏦 Mortgage Estimate (4.5%, 25yr, 80%)'}</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{isAr ? 'القسط الشهري' : 'Monthly'}</div><div style={{ fontWeight: 700, color: '#22c55e' }}>{mortgage?.monthly} {selected.currency}</div></div>
                  <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{isAr ? 'إجمالي الفائدة' : 'Total Interest'}</div><div style={{ fontWeight: 700, color: '#f59e0b' }}>{mortgage?.interest} {selected.currency}</div></div>
                  <div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{isAr ? 'إجمالي التكلفة' : 'Total Cost'}</div><div style={{ fontWeight: 700, color: '#ef4444' }}>{mortgage?.total} {selected.currency}</div></div>
                </div>
              </div>

              {aiModal && (
                <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-line', direction: isAr ? 'rtl' : 'ltr' }}>
                  {aiModal}
                </div>
              )}

              {/* Fractional invest section */}
              {selected.isFractional && (
                <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: primary, marginBottom: 8 }}>
                    🔗 {isAr ? 'الاستثمار الجزئي' : 'Fractional Investment'}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, marginBottom: 10, color: 'rgba(255,255,255,0.6)' }}>
                    <span>{isAr ? 'سعر الوحدة:' : 'Token price:'} <b style={{ color: '#fff' }}>${selected.tokenPrice}</b></span>
                    <span>{isAr ? 'متاح:' : 'Available:'} <b style={{ color: '#22c55e' }}>{(selected.totalTokens || 0) - (selected.tokensSold || 0)}</b></span>
                    <span>{isAr ? 'الحد الأدنى:' : 'Min:'} <b style={{ color: '#fff' }}>${selected.minInvestment || selected.tokenPrice}</b></span>
                  </div>
                  <button
                    disabled={investing}
                    onClick={async () => {
                      setInvesting(true);
                      const res = await API.investInProperty({ listing_id: selected.listingId, tokens: 1 });
                      setInvesting(false);
                      if (res.ok) setToast(isAr ? `✅ تم الاستثمار بنجاح!` : `✅ Investment recorded!`);
                      else        setToast(res.error || (isAr ? 'فشل الاستثمار' : 'Investment failed'));
                    }}
                    style={{ width: '100%', background: primary, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 0', cursor: investing ? 'wait' : 'pointer', fontWeight: 700, fontSize: 13, opacity: investing ? 0.7 : 1 }}>
                    {investing ? '…' : (isAr ? '💎 استثمر الآن (وحدة واحدة)' : '💎 Invest Now (1 token)')}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => runPropAI(selected)} disabled={aiLoading} style={{ flex: 1, background: primary, color: '#fff', border: 'none', borderRadius: 9, padding: '10px 0', cursor: aiLoading ? 'wait' : 'pointer', fontWeight: 600, fontSize: 13, opacity: aiLoading ? 0.7 : 1 }}>
                  {aiLoading ? (isAr ? 'جارٍ التحليل...' : 'Analyzing...') : (isAr ? '🤖 تحليل AI' : '🤖 AI Analysis')}
                </button>
                <button onClick={() => setToast(isAr ? '✅ تم إرسال طلبك بنجاح!' : '✅ Request sent successfully!')} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '10px 0', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                  {isAr ? '📩 طلب معلومات' : '📩 Request Info'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   CALCULATOR TAB
══════════════════════════════════════════════════ */
function CalculatorTab({ theme, isAr }) {
  const primary = theme?.primary || '#7c3aed';
  const [section, setSection] = useState('roi');

  const [roi, setRoi] = useState({ purchasePrice: 1000000, downPct: 20, rentalIncome: 60000, expenses: 10000, appreciation: 5, holdYears: 5 });
  const [mtg, setMtg] = useState({ price: 1000000, downPct: 20, rate: 4.5, termYears: 25, hoa: 500 });
  const [salary, setSalary] = useState(20000);

  const roiCalc = useMemo(() => {
    const { purchasePrice, downPct, rentalIncome, expenses, appreciation, holdYears } = roi;
    const downPayment = purchasePrice * (downPct / 100);
    const loan = purchasePrice - downPayment;
    const netRental = rentalIncome - expenses;
    const rentalYield = (netRental / purchasePrice) * 100;
    const cashOnCash = (netRental / downPayment) * 100;
    const monthlyFlow = netRental / 12;
    const finalValue = purchasePrice * Math.pow(1 + appreciation / 100, holdYears);
    const totalAppreciation = finalValue - purchasePrice;
    const totalRental = netRental * holdYears;
    const totalReturn = ((totalAppreciation + totalRental) / downPayment) * 100;
    const n = holdYears;
    const irr = ((Math.pow((finalValue + totalRental) / downPayment, 1 / n) - 1) * 100);
    return { rentalYield: rentalYield.toFixed(2), cashOnCash: cashOnCash.toFixed(2), totalReturn: totalReturn.toFixed(1), irr: irr.toFixed(1), monthlyFlow: fmtNum(Math.round(monthlyFlow)), rentalShare: (totalRental / (totalRental + totalAppreciation) * 100).toFixed(0) };
  }, [roi]);

  const mtgCalc = useMemo(() => {
    const { price, downPct, rate, termYears, hoa } = mtg;
    const loan = price * (1 - downPct / 100);
    const monthly = rate / 100 / 12;
    const n = termYears * 12;
    const payment = monthly > 0 ? loan * monthly * Math.pow(1 + monthly, n) / (Math.pow(1 + monthly, n) - 1) : loan / n;
    const total = payment * n;
    const totalInterest = total - loan;
    const maxProp = salary * 12 * 4;
    return {
      monthly: fmtNum(Math.round(payment + hoa)),
      total: fmtNum(Math.round(total)),
      interest: fmtNum(Math.round(totalInterest)),
      maxProp: fmtNum(Math.round(maxProp)),
      yr1Balance: fmtNum(Math.round(loan - (payment * 12 - loan * monthly * 12))),
    };
  }, [mtg, salary]);

  const inp = (label, value, setter, min = 0, max = 10000000, step = 1000) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>{label}</div>
      <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => setter(e.target.value === '' ? 0 : Number(e.target.value))}
        style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );

  const statCard = (label, value, color = primary) => (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const cardS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20, backdropFilter: 'blur(12px)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[['roi', isAr ? 'حاسبة العائد' : 'ROI Calculator'], ['mtg', isAr ? 'حاسبة التمويل' : 'Mortgage Calculator']].map(([key, label]) => (
          <button key={key} onClick={() => setSection(key)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: section === key ? primary : 'rgba(255,255,255,0.08)', color: section === key ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'all .2s' }}>
            {label}
          </button>
        ))}
      </div>

      {section === 'roi' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cardS}>
            <h3 style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? 'بيانات الاستثمار' : 'Investment Inputs'}</h3>
            {inp(isAr ? 'سعر الشراء' : 'Purchase Price', roi.purchasePrice, v => setRoi(r => ({ ...r, purchasePrice: v })))}
            {inp(isAr ? 'الدفعة الأولى %' : 'Down Payment %', roi.downPct, v => setRoi(r => ({ ...r, downPct: v })), 0, 100, 5)}
            {inp(isAr ? 'الدخل الإيجاري السنوي' : 'Annual Rental Income', roi.rentalIncome, v => setRoi(r => ({ ...r, rentalIncome: v })), 0, 1000000, 1000)}
            {inp(isAr ? 'المصاريف السنوية' : 'Annual Expenses', roi.expenses, v => setRoi(r => ({ ...r, expenses: v })), 0, 500000, 500)}
            {inp(isAr ? 'تقدير الارتفاع السنوي %' : 'Expected Appreciation %/yr', roi.appreciation, v => setRoi(r => ({ ...r, appreciation: v })), 0, 50, 0.5)}
            {inp(isAr ? 'فترة الاحتفاظ (سنوات)' : 'Hold Period (years)', roi.holdYears, v => setRoi(r => ({ ...r, holdYears: v })), 1, 30, 1)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardS}>
              <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? 'نتائج الاستثمار' : 'Investment Results'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {statCard(isAr ? 'العائد الإيجاري' : 'Rental Yield', roiCalc.rentalYield + '%', '#22c55e')}
                {statCard(isAr ? 'العائد النقدي' : 'Cash-on-Cash', roiCalc.cashOnCash + '%', '#3b82f6')}
                {statCard(isAr ? `إجمالي العائد (${roi.holdYears}سنة)` : `Total Return (${roi.holdYears}yr)`, roiCalc.totalReturn + '%', primary)}
                {statCard('IRR', roiCalc.irr + '%', '#f59e0b')}
                {statCard(isAr ? 'التدفق الشهري' : 'Monthly Cash Flow', roiCalc.monthlyFlow, '#22c55e')}
              </div>
            </div>
            {/* Return Breakdown Bar */}
            <div style={cardS}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{isAr ? 'توزيع العائد' : 'Return Breakdown'}</div>
              <div style={{ height: 20, borderRadius: 10, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: roiCalc.rentalShare + '%', background: '#22c55e', transition: 'width .6s ease' }} title={isAr ? 'إيجاري' : 'Rental'} />
                <div style={{ flex: 1, background: '#3b82f6' }} title={isAr ? 'ارتفاع' : 'Appreciation'} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11 }}>
                <span style={{ color: '#22c55e' }}>■ {isAr ? 'إيجاري' : 'Rental'} {roiCalc.rentalShare}%</span>
                <span style={{ color: '#3b82f6' }}>■ {isAr ? 'ارتفاع' : 'Appreciation'} {100 - roiCalc.rentalShare}%</span>
              </div>
            </div>
            {/* Yield vs City Avg */}
            <div style={cardS}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{isAr ? 'مقارنة مع متوسط المدن' : 'vs City Average Yields'}</div>
              {CITIES.slice(0, 4).map(c => {
                const userYield = parseFloat(roiCalc.rentalYield);
                const diff = userYield - c.yield;
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 70, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{isAr ? c.nameAr : c.nameEn}</span>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                      <div style={{ width: Math.min(100, (c.yield / 10) * 100) + '%', height: '100%', background: '#f59e0b', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#f59e0b', width: 35 }}>{c.yield}%</span>
                    <span style={{ fontSize: 10, color: diff >= 0 ? '#22c55e' : '#ef4444', width: 40 }}>{diff >= 0 ? '+' : ''}{diff.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {section === 'mtg' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={cardS}>
            <h3 style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? 'بيانات التمويل' : 'Mortgage Inputs'}</h3>
            {inp(isAr ? 'سعر العقار' : 'Property Price', mtg.price, v => setMtg(m => ({ ...m, price: v })))}
            {inp(isAr ? 'الدفعة الأولى %' : 'Down Payment %', mtg.downPct, v => setMtg(m => ({ ...m, downPct: v })), 0, 100, 5)}
            {inp(isAr ? 'معدل الفائدة %' : 'Interest Rate %', mtg.rate, v => setMtg(m => ({ ...m, rate: v })), 0, 20, 0.1)}
            {inp(isAr ? 'مدة القرض (سنوات)' : 'Loan Term (years)', mtg.termYears, v => setMtg(m => ({ ...m, termYears: v })), 5, 30, 5)}
            {inp(isAr ? 'رسوم الصيانة الشهرية' : 'Monthly HOA Fees', mtg.hoa, v => setMtg(m => ({ ...m, hoa: v })), 0, 10000, 100)}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>{isAr ? 'راتبك الشهري (للتحقق من القدرة)' : 'Monthly Salary (affordability check)'}</div>
              <input type="number" value={salary} onChange={e => setSalary(Number(e.target.value))} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={cardS}>
              <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? 'ملخص التمويل' : 'Mortgage Summary'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {statCard(isAr ? 'القسط الشهري' : 'Monthly Payment', mtgCalc.monthly, '#22c55e')}
                {statCard(isAr ? 'إجمالي الفائدة' : 'Total Interest', mtgCalc.interest, '#ef4444')}
                {statCard(isAr ? 'إجمالي التكلفة' : 'Total Cost', mtgCalc.total, '#f59e0b')}
                {statCard(isAr ? 'أقصى عقار تحتمله' : 'Max Affordable', mtgCalc.maxProp, '#3b82f6')}
              </div>
            </div>
            <div style={cardS}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12 }}>{isAr ? 'جدول الإطفاء' : 'Amortization Summary'}</div>
              {[
                { yr: isAr ? 'السنة 1' : 'Year 1',  pct: 4 },
                { yr: isAr ? 'السنة 5' : 'Year 5',  pct: 18 },
                { yr: isAr ? 'السنة 10' : 'Year 10', pct: 36 },
              ].map(row => (
                <div key={row.yr} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 60, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{row.yr}</span>
                  <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                    <div style={{ width: row.pct + '%', height: '100%', background: primary, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 12, color: primary }}>{row.pct}% {isAr ? 'مدفوع' : 'paid'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   REITs TAB
══════════════════════════════════════════════════ */
function ReitsTab({ theme, isAr, onTrade }) {
  const primary = theme?.primary || '#7c3aed';
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [investAmt, setInvestAmt] = useState(10000);
  const [selectedReit, setSelectedReit] = useState(REITS[0].id);
  const [risk, setRisk] = useState('medium');
  const [aiRec, setAiRec] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const ratingColor = (r) => r === 'Buy' ? '#22c55e' : r === 'Hold' ? '#f59e0b' : '#ef4444';
  const ratingAr = (r) => r === 'Buy' ? 'شراء' : r === 'Hold' ? 'محايد' : 'بيع';

  const reit = REITS.find(r => r.id === selectedReit);
  const dividendIncome = reit ? (investAmt * (reit.divYield / 100)).toFixed(0) : 0;

  const runAIRec = async () => {
    setAiLoading(true);
    const riskLabel = isAr ? (risk === 'low' ? 'منخفض' : risk === 'medium' ? 'متوسط' : 'مرتفع') : risk;
    const reitList = REITS.map(r => `${r.ticker} (${r.nameEn}): yield=${r.divYield}%, 52w=${fmtPct(r.change52w)}, sector=${r.sector}, rating=${r.rating}`).join('\n');
    const prompt = isAr
      ? `مستثمر بمستوى مخاطرة ${riskLabel}. إليك قائمة صناديق REIT:\n${reitList}\nاختر أفضل صندوقين وبرر اختيارك في 4 جمل.`
      : `Investor with ${risk} risk tolerance. REIT list:\n${reitList}\nPick the best 2 REITs and justify in 4 sentences.`;
    const text = await proxyAI(prompt, 500);
    setAiRec(text || (isAr ? 'تعذّر التحليل.' : 'Analysis unavailable.'));
    setAiLoading(false);
  };

  const cardS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 16, backdropFilter: 'blur(12px)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* REIT Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 14 }}>
        {REITS.map(r => (
          <div key={r.id} style={{ ...cardS, position: 'relative', transition: 'border-color .2s', cursor: 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.flag} {r.ticker}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{isAr ? r.nameAr : r.nameEn}</div>
              </div>
              <div style={{ background: ratingColor(r.rating) + '22', color: ratingColor(r.rating), padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                {isAr ? ratingAr(r.rating) : r.rating}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>${r.price}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
              <span style={{ color: '#22c55e', fontWeight: 600 }}>💰 {r.divYield}% {isAr ? 'عائد' : 'div'}</span>
              <span style={{ color: r.change52w >= 0 ? '#3b82f6' : '#ef4444', fontWeight: 600 }}>{fmtPct(r.change52w)} 52w</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{isAr ? r.sectorAr : r.sector}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={() => setCompareA(compareA === r.id ? null : r.id)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid', borderColor: compareA === r.id ? primary : 'rgba(255,255,255,0.15)', background: compareA === r.id ? primary + '33' : 'transparent', color: compareA === r.id ? primary : 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>A</button>
              <button onClick={() => setCompareB(compareB === r.id ? null : r.id)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid', borderColor: compareB === r.id ? '#f59e0b' : 'rgba(255,255,255,0.15)', background: compareB === r.id ? '#f59e0b33' : 'transparent', color: compareB === r.id ? '#f59e0b' : 'rgba(255,255,255,0.5)', fontSize: 11, cursor: 'pointer' }}>B</button>
              {onTrade && (
                <button onClick={() => onTrade(r.ticker)} style={{ flex: 2, padding: '5px 0', borderRadius: 6, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>⚡ {isAr ? 'تداول' : 'Trade'}</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison Table */}
      {compareA && compareB && (() => {
        const a = REITS.find(r => r.id === compareA);
        const b = REITS.find(r => r.id === compareB);
        const rows = [
          ['Price', '$' + a.price, '$' + b.price],
          [isAr ? 'العائد' : 'Div Yield', a.divYield + '%', b.divYield + '%'],
          [isAr ? '52 أسبوع' : '52w Change', fmtPct(a.change52w), fmtPct(b.change52w)],
          [isAr ? 'القطاع' : 'Sector', isAr ? a.sectorAr : a.sector, isAr ? b.sectorAr : b.sector],
          [isAr ? 'التقييم' : 'Rating', isAr ? ratingAr(a.rating) : a.rating, isAr ? ratingAr(b.rating) : b.rating],
        ];
        return (
          <div style={cardS}>
            <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? 'مقارنة صناديق REIT' : 'REIT Comparison'}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontWeight: 500, fontSize: 11 }}></th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: primary, fontWeight: 700 }}>{a.ticker}</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>{b.ticker}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, va, vb]) => (
                  <tr key={label} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '9px 12px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{label}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 600, color: '#fff' }}>{va}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 600, color: '#fff' }}>{vb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* REIT Calculator + AI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={cardS}>
          <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? '💵 حاسبة REIT' : '💵 REIT Calculator'}</h3>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{isAr ? 'اختر الصندوق' : 'Select REIT'}</div>
            <select value={selectedReit} onChange={e => setSelectedReit(Number(e.target.value))} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
              {REITS.map(r => <option key={r.id} value={r.id}>{r.flag} {r.ticker} — {r.divYield}% yield</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{isAr ? 'مبلغ الاستثمار ($)' : 'Investment Amount ($)'}</div>
            <input type="number" value={investAmt} onChange={e => setInvestAmt(Number(e.target.value))} step={1000} min={0} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{isAr ? 'الدخل السنوي المتوقع' : 'Expected Annual Income'}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#22c55e' }}>${fmtNum(Number(dividendIncome))}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>${fmtNum(Math.round(dividendIncome / 12))} / {isAr ? 'شهر' : 'month'}</div>
          </div>
        </div>

        <div style={cardS}>
          <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? '🤖 أفضل REIT لي' : '🤖 Best REIT for Me'}</h3>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{isAr ? 'مستوى المخاطرة' : 'Risk Tolerance'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['low', isAr ? 'منخفض' : 'Low'], ['medium', isAr ? 'متوسط' : 'Medium'], ['high', isAr ? 'مرتفع' : 'High']].map(([val, label]) => (
                <button key={val} onClick={() => setRisk(val)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, background: risk === val ? primary : 'rgba(255,255,255,0.08)', color: risk === val ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all .2s' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={runAIRec} disabled={aiLoading} style={{ width: '100%', background: primary, color: '#fff', border: 'none', borderRadius: 9, padding: '11px 0', cursor: aiLoading ? 'wait' : 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 12, opacity: aiLoading ? 0.7 : 1 }}>
            {aiLoading ? (isAr ? 'جارٍ التحليل...' : 'Analyzing...') : (isAr ? '✨ احصل على توصية AI' : '✨ Get AI Recommendation')}
          </button>
          {aiRec && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-line', direction: isAr ? 'rtl' : 'ltr', maxHeight: 200, overflowY: 'auto' }}>
              {aiRec}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   BLOCKCHAIN TAB
══════════════════════════════════════════════════ */
function BlockchainTab({ theme, isAr, onTrade }) {
  const primary = theme?.primary || '#7c3aed';
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [contractType, setContractType] = useState('Sale');
  const [form, setForm] = useState({ seller: '', buyer: '', property: '', amount: '', duration: '' });
  const [generatedContract, setGeneratedContract] = useState('');
  const [generating, setGenerating] = useState(false);
  const [contracts, setContracts] = useState(DEMO_CONTRACTS);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(accounts[0]);
      } else {
        setWallet('0xDemo...4a2F9b');
      }
    } catch {
      setWallet('0xDemo...4a2F9b');
    }
    setConnecting(false);
  };

  const generateContract = async () => {
    setGenerating(true);
    const prompt = isAr
      ? `اكتب عقد ${contractType === 'Sale' ? 'بيع' : 'إيجار'} عقاري ذكي مفصّلاً ومهنياً باللغتين العربية والإنجليزية. البائع: ${form.seller || 'طرف أول'}، المشتري: ${form.buyer || 'طرف ثانٍ'}، العقار: ${form.property || 'وحدة سكنية'}, المبلغ: ${form.amount || '0'} SAR${contractType === 'Rent' ? ', المدة: ' + (form.duration || '12') + ' شهر' : ''}. تضمّن: 1.تعريف الأطراف 2.وصف العقار 3.الثمن وطريقة السداد 4.الشروط والأحكام 5.توقيع الطرفين. اجعله رسمياً.`
      : `Generate a professional smart ${contractType} real estate contract in both English and Arabic. Seller: ${form.seller || 'Party A'}, Buyer: ${form.buyer || 'Party B'}, Property: ${form.property || 'Residential Unit'}, Amount: ${form.amount || '0'} SAR${contractType === 'Rent' ? ', Duration: ' + (form.duration || '12') + ' months' : ''}. Include: 1.Party definitions 2.Property description 3.Price & payment 4.Terms & conditions 5.Signatures. Make it formal and complete.`;
    const text = await proxyAI(prompt, 1000);
    setGeneratedContract(text || (isAr ? 'تعذّر التوليد.' : 'Generation failed.'));
    setGenerating(false);
  };

  const statusColors = { Active: '#22c55e', Completed: '#3b82f6', Pending: '#f59e0b', Disputed: '#ef4444', Cancelled: '#6b7280' };
  const cardS = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 20, backdropFilter: 'blur(12px)' };
  const inputS = { width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginTop: 4 };

  const fld = (label, key, placeholder = '') => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{label}</div>
      <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={inputS} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Wallet Connect */}
      <div style={{ ...cardS, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>🔗 {isAr ? 'ربط المحفظة الرقمية' : 'Connect Digital Wallet'}</div>
          {wallet && <div style={{ fontSize: 13, color: '#22c55e', fontFamily: 'monospace' }}>{wallet}</div>}
          {!wallet && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{isAr ? 'MetaMask أو أي محفظة متوافقة' : 'MetaMask or any compatible wallet'}</div>}
        </div>
        {!wallet ? (
          <button onClick={connectWallet} disabled={connecting} style={{ background: '#f59e0b', color: '#000', border: 'none', borderRadius: 10, padding: '11px 22px', cursor: connecting ? 'wait' : 'pointer', fontWeight: 700, fontSize: 14, opacity: connecting ? 0.7 : 1 }}>
            {connecting ? (isAr ? 'جارٍ الاتصال...' : 'Connecting...') : (isAr ? '🦊 ربط المحفظة' : '🦊 Connect Wallet')}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#22c55e', fontWeight: 600 }}>✅ {isAr ? 'متصل' : 'Connected'}</div>
            {onTrade && (
              <button onClick={() => onTrade('ETH/USD')} style={{ background: 'rgba(98,126,234,0.15)', color: '#627EEA', border: '1px solid rgba(98,126,234,0.35)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>⚡ {isAr ? 'تداول ETH' : 'Trade ETH'}</button>
            )}
            <button onClick={() => setWallet(null)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12 }}>{isAr ? 'قطع' : 'Disconnect'}</button>
          </div>
        )}
      </div>

      {/* Contract Generator */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={cardS}>
          <h3 style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? '📝 توليد عقد ذكي' : '📝 Generate Smart Contract'}</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['Sale', isAr ? 'بيع' : 'Sale'], ['Rent', isAr ? 'إيجار' : 'Rent']].map(([val, label]) => (
              <button key={val} onClick={() => setContractType(val)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: contractType === val ? primary : 'rgba(255,255,255,0.08)', color: contractType === val ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all .2s' }}>
                {label}
              </button>
            ))}
          </div>
          {fld(isAr ? 'البائع / المؤجر' : 'Seller / Landlord', 'seller', 'Ahmed Al-...')}
          {fld(isAr ? 'المشتري / المستأجر' : 'Buyer / Tenant', 'buyer', 'Sara Al-...')}
          {fld(isAr ? 'وصف العقار' : 'Property Description', 'property', 'Apt 12B, Al Olaya...')}
          {fld(isAr ? 'المبلغ (SAR/AED)' : 'Amount (SAR/AED)', 'amount', '500,000')}
          {contractType === 'Rent' && fld(isAr ? 'المدة (أشهر)' : 'Duration (months)', 'duration', '12')}
          <button onClick={generateContract} disabled={generating || !wallet} style={{ width: '100%', background: wallet ? primary : 'rgba(255,255,255,0.1)', color: wallet ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 9, padding: '12px 0', cursor: generating || !wallet ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14, marginTop: 8, opacity: generating ? 0.7 : 1 }}>
            {!wallet ? (isAr ? '🔒 قم بربط محفظتك أولاً' : '🔒 Connect wallet first') : generating ? (isAr ? 'جارٍ التوليد...' : 'Generating...') : (isAr ? '⚡ توليد العقد' : '⚡ Generate Contract')}
          </button>
        </div>

        {/* Generated Contract Display */}
        <div style={cardS}>
          <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? '📄 نص العقد' : '📄 Contract Output'}</h3>
          {generatedContract ? (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', whiteSpace: 'pre-line', direction: 'rtl', maxHeight: 400, overflowY: 'auto' }}>
              {generatedContract}
            </div>
          ) : (
            <div style={{ height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <div style={{ fontSize: 13 }}>{isAr ? 'العقد سيظهر هنا بعد التوليد' : 'Contract will appear here after generation'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Demo Contracts */}
      <div style={cardS}>
        <h3 style={{ margin: '0 0 14px', color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>{isAr ? '📁 العقود النشطة' : '📁 Active Contracts'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contracts.map(c => (
            <div key={c.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${c.statusColor}22` }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: primary }}>{c.id}</span>
                  <span style={{ background: c.statusColor + '22', color: c.statusColor, padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>{isAr ? c.statusAr : c.status}</span>
                  <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', padding: '2px 7px', borderRadius: 5, fontSize: 11 }}>{isAr ? c.typeAr : c.type}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{c.party1} → {c.party2}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{c.amount}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{c.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
// MAP TAB — Interactive MENA Property Price Map
// ══════════════════════════════════════════════════
const MapTab = ({ theme, isAr }) => {
  const primary = theme?.primary || '#7c3aed';
  const [selected, setSelected] = useState(null);
  const [hovered,  setHovered]  = useState(null);

  // City positions mapped to SVG 800×480 viewport
  // Approximate MENA lat/lng → x/y
  const CITY_NODES = [
    { id:'riyadh',   nameEn:'Riyadh',       nameAr:'الرياض',          x:480, y:280, pricePerSqm:4200, currency:'SAR', yoy:12.3, rentalYield:5.8, transactions:8420, tier:'prime',  color:'#22c55e' },
    { id:'jeddah',   nameEn:'Jeddah',       nameAr:'جدة',             x:400, y:310, pricePerSqm:3800, currency:'SAR', yoy:8.7,  rentalYield:6.2, transactions:6200, tier:'prime',  color:'#22c55e' },
    { id:'mecca',    nameEn:'Mecca',        nameAr:'مكة المكرمة',     x:390, y:325, pricePerSqm:4800, currency:'SAR', yoy:9.1,  rentalYield:7.8, transactions:2100, tier:'prime',  color:'#22c55e' },
    { id:'medina',   nameEn:'Medina',       nameAr:'المدينة المنورة', x:430, y:290, pricePerSqm:3100, currency:'SAR', yoy:7.2,  rentalYield:6.9, transactions:1800, tier:'mid',    color:'#84cc16' },
    { id:'dubai',    nameEn:'Dubai',        nameAr:'دبي',             x:545, y:300, pricePerSqm:12500,currency:'AED', yoy:19.4, rentalYield:7.1, transactions:38000,tier:'ultra',  color:'#f59e0b' },
    { id:'abudhabi', nameEn:'Abu Dhabi',    nameAr:'أبوظبي',          x:535, y:310, pricePerSqm:9800, currency:'AED', yoy:11.2, rentalYield:6.4, transactions:12000,tier:'ultra',  color:'#f59e0b' },
    { id:'sharjah',  nameEn:'Sharjah',      nameAr:'الشارقة',         x:552, y:298, pricePerSqm:4200, currency:'AED', yoy:8.5,  rentalYield:7.2, transactions:9000, tier:'mid',    color:'#84cc16' },
    { id:'kuwait',   nameEn:'Kuwait City',  nameAr:'مدينة الكويت',   x:500, y:255, pricePerSqm:850,  currency:'KWD', yoy:6.8,  rentalYield:4.9, transactions:3200, tier:'prime',  color:'#22c55e' },
    { id:'doha',     nameEn:'Doha',         nameAr:'الدوحة',          x:525, y:285, pricePerSqm:9200, currency:'QAR', yoy:5.4,  rentalYield:5.8, transactions:7800, tier:'ultra',  color:'#f59e0b' },
    { id:'manama',   nameEn:'Manama',       nameAr:'المنامة',         x:515, y:278, pricePerSqm:3600, currency:'BHD', yoy:4.2,  rentalYield:7.4, transactions:2800, tier:'mid',    color:'#84cc16' },
    { id:'cairo',    nameEn:'Cairo',        nameAr:'القاهرة',         x:380, y:230, pricePerSqm:28000,currency:'EGP', yoy:35.1, rentalYield:8.3, transactions:45000,tier:'emerging',color:'#e05252' },
    { id:'alex',     nameEn:'Alexandria',   nameAr:'الإسكندرية',      x:365, y:220, pricePerSqm:22000,currency:'EGP', yoy:28.4, rentalYield:7.9, transactions:18000,tier:'emerging',color:'#e05252' },
    { id:'amman',    nameEn:'Amman',        nameAr:'عمّان',           x:430, y:220, pricePerSqm:2200, currency:'JOD', yoy:7.8,  rentalYield:5.6, transactions:5400, tier:'mid',    color:'#84cc16' },
    { id:'beirut',   nameEn:'Beirut',       nameAr:'بيروت',           x:425, y:210, pricePerSqm:3500, currency:'USD', yoy:-8.2, rentalYield:4.1, transactions:1200, tier:'mid',    color:'#e05252' },
    { id:'muscat',   nameEn:'Muscat',       nameAr:'مسقط',            x:570, y:310, pricePerSqm:3800, currency:'OMR', yoy:9.6,  rentalYield:6.8, transactions:4100, tier:'prime',  color:'#22c55e' },
  ];

  const TIER_COLORS = { ultra:'#f59e0b', prime:'#22c55e', mid:'#84cc16', emerging:'#e05252' };
  const TIER_AR = { ultra:'فائق', prime:'ممتاز', mid:'متوسط', emerging:'ناشئ' };

  // Radius by transaction volume
  const r = (n) => Math.max(10, Math.min(30, 8 + Math.sqrt(n / 200)));

  const sel = selected ? CITY_NODES.find(c => c.id === selected) : null;

  return (
    <div>
      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginBottom:14, flexWrap:'wrap' }}>
        {Object.entries(TIER_COLORS).map(([tier, color]) => (
          <div key={tier} style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'rgba(255,255,255,0.6)' }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:color }} />
            {isAr ? TIER_AR[tier] : tier.charAt(0).toUpperCase()+tier.slice(1)}
          </div>
        ))}
        <div style={{ marginRight:'auto', fontSize:11, color:'rgba(255,255,255,0.4)' }}>
          {isAr ? '● حجم الدائرة = حجم التداولات' : '● Circle size = transaction volume'}
        </div>
      </div>

      {/* SVG Map */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, overflow:'hidden', position:'relative' }}>
        <svg viewBox="250 150 400 220" style={{ width:'100%', display:'block', cursor:'crosshair' }}>
          {/* Background gradient */}
          <defs>
            <radialGradient id="mapBg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#1a1a3e" />
              <stop offset="100%" stopColor="#0a0a1a" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="800" height="480" fill="url(#mapBg)" />

          {/* Stylized coastline/region lines */}
          <path d="M 270,180 L 310,175 L 360,185 L 400,195 L 430,185 L 470,200 L 510,190 L 560,200 L 590,215 L 600,240 L 610,270 L 600,300 L 580,330 L 560,340 L 530,350 L 500,345 L 470,355 L 440,370 L 410,380 L 380,360 L 360,340 L 340,310 L 320,290 L 300,270 L 280,240 L 270,210 Z"
            fill="rgba(100,150,255,0.04)" stroke="rgba(100,150,255,0.12)" strokeWidth="1" />

          {/* Gulf/water body */}
          <path d="M 490,265 L 510,260 L 545,275 L 560,290 L 565,310 L 555,325 L 530,335 L 510,330 L 500,315 L 495,295 Z"
            fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.2)" strokeWidth="0.8" />
          <text x="525" y="308" fontSize="7" fill="rgba(59,130,246,0.5)" textAnchor="middle">Arabian Gulf</text>

          {/* Red Sea */}
          <path d="M 395,220 L 410,235 L 415,265 L 405,295 L 395,320 L 380,325 L 370,305 L 375,270 L 380,245 Z"
            fill="rgba(59,130,246,0.06)" stroke="rgba(59,130,246,0.15)" strokeWidth="0.8" />
          <text x="387" y="268" fontSize="6" fill="rgba(59,130,246,0.4)" textAnchor="middle" transform="rotate(-75,387,268)">Red Sea</text>

          {/* Grid dots */}
          {[0,1,2,3,4,5].map(col => [0,1,2,3].map(row => (
            <circle key={`${col}-${row}`} cx={260+col*80} cy={160+row*60} r="0.8" fill="rgba(255,255,255,0.06)" />
          )))}

          {/* City nodes */}
          {CITY_NODES.map(city => {
            const isHov = hovered === city.id;
            const isSel = selected === city.id;
            return (
              <g key={city.id}
                onClick={() => setSelected(isSel ? null : city.id)}
                onMouseEnter={() => setHovered(city.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor:'pointer' }}
                filter={isSel ? "url(#glow)" : undefined}
              >
                {/* Pulse ring for selected */}
                {isSel && <circle cx={city.x} cy={city.y} r={r(city.transactions)+8} fill="none" stroke={city.color} strokeWidth={1.5} strokeOpacity={0.4} strokeDasharray="4,3" />}
                {/* Main dot */}
                <circle cx={city.x} cy={city.y} r={r(city.transactions)}
                  fill={city.color + (isSel?"CC":isHov?"AA":"55")}
                  stroke={city.color} strokeWidth={isSel ? 2 : 1}
                />
                {/* YoY badge */}
                <text x={city.x} y={city.y+3} textAnchor="middle" fontSize={7} fontWeight="700"
                  fill={city.yoy < 0 ? "#fca5a5" : "#fff"}>
                  {city.yoy > 0 ? "+" : ""}{city.yoy}%
                </text>
                {/* City label */}
                <text x={city.x} y={city.y + r(city.transactions) + 10} textAnchor="middle"
                  fontSize={isHov||isSel ? 8.5 : 7} fill={isHov||isSel ? "#fff" : "rgba(255,255,255,0.55)"} fontWeight={isSel?"700":"400"}>
                  {isAr ? city.nameAr : city.nameEn}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected city detail card */}
      {sel && (
        <div style={{ marginTop:14, background:`linear-gradient(135deg,${primary}22,${primary}0d)`, border:`1px solid ${primary}44`, borderRadius:16, padding:18, animation:'fadeIn .3s ease' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{isAr ? sel.nameAr : sel.nameEn}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginTop:2 }}>
                <span style={{ background:TIER_COLORS[sel.tier]+"33", color:TIER_COLORS[sel.tier], borderRadius:5, padding:"1px 8px", fontSize:10, fontWeight:700, marginLeft:4 }}>
                  {isAr ? TIER_AR[sel.tier] : sel.tier}
                </span>
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background:'rgba(255,255,255,0.08)', border:'none', borderRadius:8, padding:"4px 10px", color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:16 }}>✕</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
            {[
              { icon:'💵', label:isAr?'سعر المتر':'Price/m²',         value:`${sel.pricePerSqm.toLocaleString()} ${sel.currency}` },
              { icon:'📈', label:isAr?'نمو سنوي':'YoY Growth',         value:(sel.yoy>0?"+":"")+sel.yoy+"%" },
              { icon:'🏠', label:isAr?'عائد الإيجار':'Rental Yield',    value:sel.rentalYield+"%" },
              { icon:'📊', label:isAr?'الصفقات/شهر':'Trans/month',      value:sel.transactions.toLocaleString() },
            ].map((s,i) => (
              <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                <div style={{ fontSize:18 }}>{s.icon}</div>
                <div style={{ fontSize:14, fontWeight:800, color:s.icon==='📈' ? (sel.yoy>=0?"#4ADE80":"#E05252") : '#fff', marginTop:3 }}>{s.value}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* City comparison table */}
      <div style={{ marginTop:16, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.7)' }}>
          {isAr ? '📊 مقارنة المدن — سعر المتر' : '📊 City Comparison — Price per m²'}
        </div>
        <div style={{ overflowX:'auto' }}>
          {CITY_NODES.slice().sort((a,b) => b.yoy-a.yoy).map((city, i) => {
            const maxPct = Math.max(...CITY_NODES.map(c => Math.abs(c.yoy)));
            const barW = Math.abs(city.yoy) / maxPct * 100;
            return (
              <div key={city.id} onClick={() => setSelected(city.id)} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 16px', cursor:'pointer',
                background: selected===city.id ? primary+"18" : i%2===0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background .15s',
              }}>
                <div style={{ width:24, fontSize:11, color:'rgba(255,255,255,0.3)', textAlign:'center' }}>{i+1}</div>
                <div style={{ flex:1, fontSize:12, fontWeight:600, color:'#fff', minWidth:80 }}>{isAr?city.nameAr:city.nameEn}</div>
                <div style={{ width:120, position:'relative', height:14 }}>
                  <div style={{ position:'absolute', left:0, top:3, height:8, width:barW+"%", background:city.yoy>=0?"#22c55e44":"#e0525244", borderRadius:4, transition:'width .4s' }} />
                  <div style={{ position:'absolute', left:0, top:3, height:8, width:(barW*0.6)+"%", background:city.yoy>=0?"#22c55e":"#e05252", borderRadius:4, transition:'width .4s' }} />
                </div>
                <div style={{ width:50, textAlign:'right', fontSize:12, fontWeight:700, color:city.yoy>=0?"#4ADE80":"#E05252" }}>
                  {city.yoy>0?"+":""}{city.yoy}%
                </div>
                <div style={{ width:90, textAlign:'right', fontSize:11, color:'rgba(255,255,255,0.5)' }}>
                  {city.pricePerSqm.toLocaleString()} {city.currency}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   AI VALUATION TAB
══════════════════════════════════════════════════ */
const AI_CITY_DATA = {
  riyadh:  { pricePerM2: 4200,  currency: 'SAR', yoy: 12.3, yieldPct: 5.8, comps: [
    { type: 'Apartment', area: 120, price: '504,000 SAR', date: '2026-02-15' },
    { type: 'Apartment', area: 95,  price: '399,000 SAR', date: '2026-03-01' },
    { type: 'Villa',     area: 450, price: '2,700,000 SAR',date: '2026-01-20' },
  ]},
  jeddah:  { pricePerM2: 3800,  currency: 'SAR', yoy: 8.7,  yieldPct: 6.2, comps: [
    { type: 'Apartment', area: 110, price: '418,000 SAR', date: '2026-02-20' },
    { type: 'Land',      area: 800, price: '1,900,000 SAR',date: '2026-01-30' },
  ]},
  dubai:   { pricePerM2: 12500, currency: 'AED', yoy: 19.4, yieldPct: 7.1, comps: [
    { type: 'Apartment', area: 80,  price: '1,000,000 AED',date: '2026-03-10' },
    { type: 'Villa',     area: 600, price: '8,500,000 AED',date: '2026-02-05' },
    { type: 'Studio',    area: 45,  price: '620,000 AED',  date: '2026-03-18' },
  ]},
  abudhabi:{ pricePerM2: 9800,  currency: 'AED', yoy: 11.2, yieldPct: 6.4, comps: [
    { type: 'Apartment', area: 95,  price: '931,000 AED', date: '2026-02-28' },
    { type: 'Villa',     area: 520, price: '5,800,000 AED',date: '2026-01-15' },
  ]},
  cairo:   { pricePerM2: 28000, currency: 'EGP', yoy: 35.1, yieldPct: 8.3, comps: [
    { type: 'Apartment', area: 150, price: '4,200,000 EGP',date: '2026-03-05' },
    { type: 'Commercial',area: 200, price: '8,500,000 EGP',date: '2026-02-14' },
  ]},
  kuwait:  { pricePerM2: 850,   currency: 'KWD', yoy: 6.8,  yieldPct: 4.9, comps: [
    { type: 'Apartment', area: 130, price: '110,500 KWD', date: '2026-03-01' },
  ]},
};

function AIValuationTab({ theme, isAr }) {
  const primary = theme?.primary || '#7c3aed';
  const [city, setCity] = useState('dubai');
  const [area, setArea] = useState(100);
  const [propType, setPropType] = useState('apartment');
  const [bedrooms, setBedrooms] = useState(2);
  const [floor, setFloor] = useState(5);
  const [ageYears, setAgeYears] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const cityData = AI_CITY_DATA[city] || AI_CITY_DATA.dubai;
  const cityObj = CITIES.find(c => c.id === city) || CITIES[2];

  const runValuation = async () => {
    setLoading(true);
    setResult(null);
    const cityName = isAr ? cityObj.nameAr : cityObj.nameEn;
    const prompt = isAr
      ? `أنت خبير تقييم عقاري في منطقة الشرق الأوسط. قيّم هذا العقار:
- المدينة: ${cityName}
- النوع: ${propType === 'apartment' ? 'شقة' : propType === 'villa' ? 'فيلا' : propType === 'commercial' ? 'تجاري' : 'أرض'}
- المساحة: ${area} متر مربع
- غرف النوم: ${bedrooms}
- الطابق: ${floor}
- العمر: ${ageYears} سنوات
- سعر السوق الحالي: ${cityData.pricePerM2} ${cityData.currency}/م²
- نمو سنوي: ${cityData.yoy}%
- عائد إيجاري: ${cityData.yieldPct}%

أعطني:
1. القيمة المقدرة (رقم محدد بالعملة المحلية)
2. نطاق السعر (أدنى-أعلى)
3. العائد الإيجاري السنوي المتوقع
4. أفضل وقت للبيع
5. تقييم السوق الحالي (ممتاز/جيد/متوسط/ضعيف)
كن دقيقاً ومختصراً.`
      : `You are a real estate valuation expert for the Middle East. Valuate this property:
- City: ${cityName}
- Type: ${propType}
- Area: ${area} sqm
- Bedrooms: ${bedrooms}
- Floor: ${floor}
- Age: ${ageYears} years
- Current market price: ${cityData.pricePerM2} ${cityData.currency}/sqm
- YoY growth: ${cityData.yoy}%
- Rental yield: ${cityData.yieldPct}%

Provide:
1. Estimated value (specific number in local currency)
2. Price range (low–high)
3. Expected annual rental income
4. Best time to sell
5. Current market rating (Excellent/Good/Fair/Weak)
Be specific and concise.`;

    const text = await proxyAI(prompt, 600);
    setResult(text || (isAr ? 'تعذّر التقييم. حاول مرة أخرى.' : 'Valuation unavailable. Try again.'));
    setLoading(false);
  };

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 };
  const inpStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, width: '100%', boxSizing: 'border-box', outline: 'none' };
  const quickEst = area * cityData.pricePerM2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 10 }}>
        {[
          { icon:'📍', label: isAr?'السوق الحالي':'Current Market', val:`${fmtNum(cityData.pricePerM2)} ${cityData.currency}/m²`, color: primary },
          { icon:'📈', label: isAr?'نمو سنوي':'YoY Growth',        val:`+${cityData.yoy}%`,                                     color:'#22c55e' },
          { icon:'🏦', label: isAr?'عائد الإيجار':'Rental Yield',  val:`${cityData.yieldPct}%`,                                  color:'#f59e0b' },
          { icon:'💡', label: isAr?'تقدير سريع':'Quick Est.',       val:`${fmtNum(quickEst)} ${cityData.currency}`,              color:'#60a5fa' },
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, textAlign: 'center', padding: 14 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* City selector */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{isAr ? '📍 اختر المدينة' : '📍 Select City'}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CITIES.map(c => (
            <button key={c.id} onClick={() => setCity(c.id)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: city === c.id ? `${primary}22` : 'transparent',
              border: `1px solid ${city === c.id ? primary : 'rgba(255,255,255,0.1)'}`,
              color: city === c.id ? primary : 'rgba(255,255,255,0.5)',
            }}>{isAr ? c.nameAr : c.nameEn}</button>
          ))}
        </div>
      </div>

      {/* Property form */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 16 }}>{isAr ? '🏠 تفاصيل العقار' : '🏠 Property Details'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{isAr ? 'نوع العقار' : 'Property Type'}</div>
            <select value={propType} onChange={e => setPropType(e.target.value)} style={inpStyle}>
              <option value="apartment">{isAr ? 'شقة' : 'Apartment'}</option>
              <option value="villa">{isAr ? 'فيلا' : 'Villa'}</option>
              <option value="commercial">{isAr ? 'تجاري' : 'Commercial'}</option>
              <option value="land">{isAr ? 'أرض' : 'Land'}</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{isAr ? 'المساحة (م²)' : 'Area (sqm)'}</div>
            <input type="number" min="20" max="5000" value={area} onChange={e => setArea(+e.target.value)} style={inpStyle} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{isAr ? 'غرف النوم' : 'Bedrooms'}</div>
            <input type="number" min="0" max="10" value={bedrooms} onChange={e => setBedrooms(+e.target.value)} style={inpStyle} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{isAr ? 'الطابق' : 'Floor'}</div>
            <input type="number" min="0" max="100" value={floor} onChange={e => setFloor(+e.target.value)} style={inpStyle} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{isAr ? 'عمر البناء (سنوات)' : 'Building Age (yrs)'}</div>
            <input type="number" min="0" max="50" value={ageYears} onChange={e => setAgeYears(+e.target.value)} style={inpStyle} />
          </div>
        </div>
        <button onClick={runValuation} disabled={loading} style={{
          marginTop: 18, padding: '11px 28px', borderRadius: 10, border: `1px solid ${primary}55`,
          background: loading ? 'rgba(255,255,255,0.05)' : `${primary}22`,
          color: primary, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
        }}>
          {loading ? (isAr ? '⏳ يقيّم...' : '⏳ Valuating...') : (isAr ? '🤖 تقييم AI الآن' : '🤖 Get AI Valuation')}
        </button>
      </div>

      {/* AI result */}
      {result && (
        <div style={{ ...cardStyle, borderColor: `${primary}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${primary}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{isAr ? 'نتيجة تقييم AI' : 'AI Valuation Result'}</div>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{result}</div>
        </div>
      )}

      {/* Comparable sales */}
      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14 }}>{isAr ? '🏘️ صفقات مشابهة قريبة' : '🏘️ Comparable Sales'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {cityData.comps.map((comp, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{comp.type} · {comp.area}m²</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{comp.date}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: primary }}>{comp.price}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const RealEstateTab = ({ theme, lang, onTrade }) => {
  const isAr = lang === 'ar';
  const primary = theme?.primary || '#7c3aed';

  const TABS = [
    { id: 'market',     labelEn: 'Market',     labelAr: 'السوق',          icon: '🏙️' },
    { id: 'map',        labelEn: '🗺️ Map',     labelAr: '🗺️ الخريطة',    icon: '' },
    { id: 'properties', labelEn: 'Properties', labelAr: 'العقارات',       icon: '🏘️' },
    { id: 'calculator', labelEn: 'Calculator', labelAr: 'الحاسبة',        icon: '🧮' },
    { id: 'reits',      labelEn: 'REITs',      labelAr: 'صناديق REIT',    icon: '📈' },
    { id: 'blockchain', labelEn: 'Blockchain', labelAr: 'البلوكشين',      icon: '🔗' },
    { id: 'valuation',  labelEn: '🤖 AI Value', labelAr: '🤖 تقييم AI',   icon: '' },
  ];

  const [activeTab, setActiveTab] = useState('market');

  return (
    <div style={{ fontFamily: isAr ? "'Cairo', 'Tajawal', sans-serif" : "'Inter', sans-serif", direction: isAr ? 'rtl' : 'ltr', minHeight: '100vh', color: '#fff', padding: '0 0 40px' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        * { scrollbar-width: thin; scrollbar-color: ${primary}55 transparent; }
        *::-webkit-scrollbar { width: 4px; height: 4px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb { background: ${primary}55; border-radius: 4px; }
        input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        select option { background: #1a1a2e; color: #fff; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '20px 0 16px', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, background: `linear-gradient(135deg,${primary},${primary}88)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏛️</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{isAr ? 'منصة الاستثمار العقاري' : 'Real Estate Investment Platform'}</h2>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{isAr ? 'تحليلات ذكية · عقود بلوكشين · فرص استثمارية' : 'AI Analytics · Blockchain Contracts · Investment Opportunities'}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0, overflowX: 'auto' }}>
        {TABS.map(tab => {
          const active = tab.id === activeTab;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', border: 'none', background: 'transparent', cursor: 'pointer', color: active ? primary : 'rgba(255,255,255,0.45)', fontWeight: active ? 700 : 400, fontSize: 13, borderBottom: `2px solid ${active ? primary : 'transparent'}`, marginBottom: -1, transition: 'all .2s', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
              <span>{tab.icon}</span>
              <span>{isAr ? tab.labelAr : tab.labelEn}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ animation: 'fadeIn .35s ease' }} key={activeTab}>
        {activeTab === 'market'     && <MarketTab     theme={theme} isAr={isAr} />}
        {activeTab === 'map'        && <MapTab        theme={theme} isAr={isAr} />}
        {activeTab === 'properties' && <PropertiesTab  theme={theme} isAr={isAr} />}
        {activeTab === 'calculator' && <CalculatorTab  theme={theme} isAr={isAr} />}
        {activeTab === 'reits'      && <ReitsTab       theme={theme} isAr={isAr} onTrade={onTrade} />}
        {activeTab === 'blockchain' && <BlockchainTab  theme={theme} isAr={isAr} onTrade={onTrade} />}
        {activeTab === 'valuation'  && <AIValuationTab theme={theme} isAr={isAr} />}
      </div>
    </div>
  );
};

export default RealEstateTab;
