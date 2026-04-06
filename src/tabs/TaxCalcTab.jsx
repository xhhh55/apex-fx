/* eslint-disable */
import { useState, useMemo } from 'react';

const TAX_RULES = {
  SA: { nameEn:"Saudi Arabia 🇸🇦", nameAr:"المملكة العربية السعودية 🇸🇦", capitalGains:0,  shortTerm:0,  zakatRate:2.5, noteEn:"No capital gains tax. Zakat 2.5% on net assets held ≥ 1 lunar year.", noteAr:"لا ضريبة على أرباح رأس المال. زكاة 2.5% على الأصول المحتفظ بها لعام قمري.", specialRules:["Zakat 2.5%/yr on savings & investments","0% capital gains for Saudi residents","Foreign investors: 20% withholding on some assets","Zakat base = net assets, not just profits"] },
  AE: { nameEn:"UAE 🇦🇪",           nameAr:"الإمارات العربية المتحدة 🇦🇪", capitalGains:0,  shortTerm:0,  zakatRate:0,   noteEn:"0% personal income & capital gains tax. No CGT for individuals.", noteAr:"0% ضريبة دخل شخصي وأرباح رأس المال. لا CGT للأفراد.", specialRules:["0% personal income tax","9% corporate tax on profits > AED 375,000","Free zone companies: potential 0% tax","VAT 5% on goods/services only"] },
  KW: { nameEn:"Kuwait 🇰🇼",        nameAr:"الكويت 🇰🇼",                  capitalGains:0,  shortTerm:0,  zakatRate:0,   noteEn:"No personal income or capital gains tax.", noteAr:"لا توجد ضريبة دخل شخصي أو على أرباح رأس المال.", specialRules:["0% personal income tax","Boursa Kuwait gains: tax free for individuals","5% zakat on foreign company profits","No withholding tax on dividends"] },
  QA: { nameEn:"Qatar 🇶🇦",         nameAr:"قطر 🇶🇦",                     capitalGains:0,  shortTerm:0,  zakatRate:0,   noteEn:"No personal income tax. Capital gains included in business income.", noteAr:"لا توجد ضريبة دخل شخصي. أرباح رأس المال جزء من دخل الأعمال.", specialRules:["0% personal capital gains","10% corporate income tax","QFC regime: special 10% tax","QSE stock gains: generally tax free"] },
  EG: { nameEn:"Egypt 🇪🇬",         nameAr:"مصر 🇪🇬",                     capitalGains:10, shortTerm:10, zakatRate:0,   noteEn:"10% CGT on EGX-listed stocks. Suspended multiple times — verify current status.", noteAr:"10% على أرباح الأسهم المدرجة في البورصة المصرية. علّقت عدة مرات — تحقق من الوضع الحالي.", specialRules:["10% on EGX stock capital gains","0% on government bonds & T-bills","Real estate: stamp duty + registration fees","Dividends: 5-10% withholding tax"] },
  BH: { nameEn:"Bahrain 🇧🇭",       nameAr:"البحرين 🇧🇭",                 capitalGains:0,  shortTerm:0,  zakatRate:0,   noteEn:"No personal income, CGT, or withholding tax.", noteAr:"لا توجد ضريبة دخل شخصي أو على أرباح رأس المال أو استقطاع.", specialRules:["0% personal tax on all income","0% CGT","VAT 10% on goods/services","Financial sector subject to CBB rules"] },
  US: { nameEn:"USA 🇺🇸",           nameAr:"الولايات المتحدة 🇺🇸",        capitalGains:20, shortTerm:37, zakatRate:0,   noteEn:"Long-term (>1yr): 0/15/20% by income bracket. Short-term: ordinary rates up to 37%.", noteAr:"طويل الأمد (>1 سنة): 0/15/20% حسب شريحة الدخل. قصير الأمد: معدلات عادية حتى 37%.", specialRules:["0% if income < $44,625 (2024)","15% if $44,625–$492,300","20% above $492,300","3.8% Net Investment Income Tax possible","Wash-sale rule: no loss deduction if rebought within 30 days"] },
  GB: { nameEn:"UK 🇬🇧",            nameAr:"المملكة المتحدة 🇬🇧",         capitalGains:20, shortTerm:20, zakatRate:0,   noteEn:"10% (basic rate) or 20% (higher rate) for most assets. 18/24% for residential property.", noteAr:"10% (المعدل الأساسي) أو 20% (المعدل الأعلى) لمعظم الأصول. 18/24% للعقارات السكنية.", specialRules:["Annual exempt amount: £3,000 (2024/25)","10% basic rate taxpayers","20% higher/additional rate","24% residential property (higher rate)","ISA gains: tax free"] },
};

const ASSET_TYPES = [
  { id:"stocks",     en:"Stocks / Equities",    ar:"أسهم / حقوق ملكية",   icon:"📈" },
  { id:"crypto",     en:"Cryptocurrency",        ar:"عملات رقمية",          icon:"₿"  },
  { id:"realestate", en:"Real Estate",           ar:"عقارات",               icon:"🏠" },
  { id:"forex",      en:"Forex / Derivatives",  ar:"فوركس / مشتقات",      icon:"💱" },
  { id:"bonds",      en:"Bonds / Fixed Income", ar:"سندات / دخل ثابت",    icon:"🏦" },
];

const TaxCalcTab = ({ theme, lang }) => {
  const isAr = lang === 'ar';
  const P = theme?.primary || '#D4A843';

  const [country,   setCountry]   = useState('SA');
  const [assetType, setAssetType] = useState('stocks');
  const [buyPrice,  setBuyPrice]  = useState('10000');
  const [sellPrice, setSellPrice] = useState('15000');
  const [quantity,  setQuantity]  = useState('100');
  const [holdDays,  setHoldDays]  = useState('400');
  const [currency,  setCurrency]  = useState('USD');

  const rules = TAX_RULES[country];
  const isLongTerm = parseInt(holdDays) >= 365;
  const rate = isLongTerm ? rules.capitalGains : rules.shortTerm;

  const results = useMemo(() => {
    const buy  = parseFloat(buyPrice)  || 0;
    const sell = parseFloat(sellPrice) || 0;
    const qty  = parseFloat(quantity)  || 1;
    const totalInvested = buy * qty;
    const totalSell     = sell * qty;
    const grossGain     = totalSell - totalInvested;
    const taxOwed       = grossGain > 0 ? (grossGain * rate / 100) : 0;
    const zakatOwed     = rules.zakatRate > 0 ? (totalSell * rules.zakatRate / 100) : 0;
    const netGain       = grossGain - taxOwed - zakatOwed;
    const roi           = buy > 0 ? ((sell - buy) / buy * 100) : 0;
    const afterTaxRoi   = totalInvested > 0 ? (netGain / totalInvested * 100) : 0;
    return { buy, sell, qty, totalInvested, totalSell, grossGain, taxOwed, zakatOwed, netGain, roi, afterTaxRoi };
  }, [buyPrice, sellPrice, quantity, rate, rules]);

  const fmt = n => {
    const abs = Math.abs(n);
    const str = abs >= 1e6 ? (abs/1e6).toFixed(2)+'M' : abs >= 1e3 ? (abs/1e3).toFixed(2)+'K' : abs.toFixed(2);
    return (n < 0 ? '-' : (n > 0 ? '+' : '')) + currency + ' ' + str;
  };

  return (
    <div style={{ fontFamily:isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif", direction:isAr?'rtl':'ltr', color:'#EEE8DA', padding:'0 0 40px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${P},${P}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🧾</div>
        <div>
          <h2 style={{ margin:0, fontSize:19, fontWeight:800, color:'#fff' }}>{isAr?'حاسبة الضرائب على الاستثمار':'Investment Tax Calculator'}</h2>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{isAr?'احسب ضريبة أرباح رأس المال حسب بلدك':'Calculate P&L capital gains tax by country'}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* LEFT: Inputs */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>⚙️ {isAr?'إعدادات الحساب':'Settings'}</div>

          {/* Country picker */}
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>{isAr?'البلد':'Country'}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {Object.entries(TAX_RULES).map(([k]) => (
                <button key={k} onClick={() => setCountry(k)} style={{
                  padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:700, cursor:'pointer',
                  background: country===k ? P+'22' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${country===k ? P : 'rgba(255,255,255,0.08)'}`,
                  color: country===k ? P : 'rgba(255,255,255,0.5)',
                }}>{k}</button>
              ))}
            </div>
          </div>

          {/* Asset type */}
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>{isAr?'نوع الأصل':'Asset Type'}</div>
            <select value={assetType} onChange={e=>setAssetType(e.target.value)} style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#fff', fontSize:12 }}>
              {ASSET_TYPES.map(a => <option key={a.id} value={a.id}>{a.icon} {isAr?a.ar:a.en}</option>)}
            </select>
          </div>

          {/* Currency */}
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:6 }}>{isAr?'العملة':'Currency'}</div>
            <select value={currency} onChange={e=>setCurrency(e.target.value)} style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#fff', fontSize:12 }}>
              {['USD','SAR','AED','EGP','KWD','GBP','EUR'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Number inputs */}
          {[
            { label:isAr?'سعر الشراء (لكل وحدة)':'Buy Price (per unit)',     val:buyPrice,  set:setBuyPrice  },
            { label:isAr?'سعر البيع (لكل وحدة)':'Sell Price (per unit)',     val:sellPrice, set:setSellPrice },
            { label:isAr?'الكمية':'Quantity',                                 val:quantity,  set:setQuantity  },
            { label:isAr?'فترة الاحتجاز (أيام)':'Holding Period (days)',     val:holdDays,  set:setHoldDays  },
          ].map((f,i) => (
            <div key={i}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:5 }}>{f.label}</div>
              <input type="number" value={f.val} onChange={e=>f.set(e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 10px', color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}

          {/* Hold type badge */}
          <div style={{ padding:'8px 12px', borderRadius:8, background: isLongTerm?'rgba(74,222,128,0.1)':'rgba(251,191,36,0.1)', border:`1px solid ${isLongTerm?'rgba(74,222,128,0.3)':'rgba(251,191,36,0.3)'}`, fontSize:12, color: isLongTerm?'#4ADE80':'#FBBF24', fontWeight:700 }}>
            {isLongTerm ? (isAr?'📅 احتجاز طويل الأمد (≥ 1 سنة)':'📅 Long-term hold (≥ 1 year)') : (isAr?'⚡ احتجاز قصير الأمد (< 1 سنة)':'⚡ Short-term hold (< 1 year)')}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Country info card */}
          <div style={{ background:`${P}0f`, border:`1px solid ${P}33`, borderRadius:12, padding:14 }}>
            <div style={{ fontWeight:700, fontSize:13, color:P, marginBottom:4 }}>{isAr?rules.nameAr:rules.nameEn}</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>{isAr?rules.noteAr:rules.noteEn}</div>
            <div style={{ marginTop:8, display:'flex', gap:8 }}>
              <div style={{ textAlign:'center', flex:1, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px' }}>
                <div style={{ fontSize:16, fontWeight:800, color: rate===0?'#4ADE80':'#FBBF24' }}>{rate}%</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{isAr?'ضريبة أرباح':'Cap Gains'}</div>
              </div>
              {rules.zakatRate > 0 && (
                <div style={{ textAlign:'center', flex:1, background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'8px' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:'#FBBF24' }}>{rules.zakatRate}%</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{isAr?'زكاة':'Zakat'}</div>
                </div>
              )}
            </div>
          </div>

          {/* Result cards */}
          {[
            { label:isAr?'إجمالي الربح / الخسارة':'Gross Profit / Loss', value:fmt(results.grossGain), color:results.grossGain>=0?'#4ADE80':'#E05252', big:true },
            { label:isAr?'الضريبة المستحقة':'Tax Owed',                   value:fmt(results.taxOwed),   color:'#FBBF24' },
            results.zakatOwed > 0 && { label:isAr?'الزكاة المستحقة':'Zakat Owed', value:fmt(results.zakatOwed), color:'#F97316' },
            { label:isAr?'صافي الربح (بعد الضرائب)':'Net Profit (After Tax)', value:fmt(results.netGain), color:results.netGain>=0?'#4ADE80':'#E05252', big:true },
          ].filter(Boolean).map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${s.color}22`, borderRadius:11, padding:'12px 14px' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:3 }}>{s.label}</div>
              <div style={{ fontSize:s.big?22:16, fontWeight:800, color:s.color }}>{s.value}</div>
            </div>
          ))}

          {/* ROI bars */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:14 }}>
            {[
              { label:isAr?'عائد الاستثمار الإجمالي':'Gross ROI',          value:results.roi,        color:P },
              { label:isAr?'عائد الاستثمار الصافي (بعد الضريبة)':'Net ROI (after tax)', value:results.afterTaxRoi, color:'#4ADE80' },
            ].map((r,i) => (
              <div key={i} style={{ marginBottom:i===0?12:0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(255,255,255,0.5)', marginBottom:5 }}>
                  <span>{r.label}</span>
                  <span style={{ color:r.value>=0?r.color:'#E05252', fontWeight:700 }}>{r.value.toFixed(2)}%</span>
                </div>
                <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(100,Math.abs(r.value))}%`, background:r.value>=0?r.color:'#E05252', borderRadius:3, transition:'width .5s' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Special rules */}
          <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:14 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:8 }}>📋 {isAr?'قواعد خاصة':'Special Rules'}</div>
            {rules.specialRules.map((r,i) => (
              <div key={i} style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:5, display:'flex', gap:6 }}>
                <span style={{ color:P, flexShrink:0 }}>•</span>{r}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop:16, padding:12, background:'rgba(255,255,255,0.02)', borderRadius:10, border:'1px solid rgba(255,255,255,0.06)', fontSize:11, color:'rgba(255,255,255,0.3)' }}>
        ⚠️ {isAr?'هذه الحاسبة للأغراض التعليمية فقط. استشر متخصص ضرائب معتمد لحالتك الخاصة.':'For educational purposes only. Consult a certified tax professional for your specific situation.'}
      </div>
    </div>
  );
};

export default TaxCalcTab;
