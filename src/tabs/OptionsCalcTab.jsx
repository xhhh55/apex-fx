/* eslint-disable */
import { useState, useMemo } from 'react';

// ── Black-Scholes math ─────────────────────────────────────────────────────
const erf = x => {
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1/(1+p*x);
  const y = 1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return sign*y;
};
const normCDF = x => 0.5*(1+erf(x/Math.sqrt(2)));
const normPDF = x => Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);

const blackScholes = (S,K,T,r,sigma) => {
  if (T<=0||sigma<=0||S<=0||K<=0) return null;
  const d1 = (Math.log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
  const d2 = d1-sigma*Math.sqrt(T);
  const Nd1=normCDF(d1),Nd2=normCDF(d2),Nm_d1=normCDF(-d1),Nm_d2=normCDF(-d2);
  const call = S*Nd1-K*Math.exp(-r*T)*Nd2;
  const put  = K*Math.exp(-r*T)*Nm_d2-S*Nm_d1;
  const gamma      = normPDF(d1)/(S*sigma*Math.sqrt(T));
  const theta_call = (-(S*normPDF(d1)*sigma)/(2*Math.sqrt(T))-r*K*Math.exp(-r*T)*Nd2)/365;
  const theta_put  = (-(S*normPDF(d1)*sigma)/(2*Math.sqrt(T))+r*K*Math.exp(-r*T)*Nm_d2)/365;
  const vega       = S*normPDF(d1)*Math.sqrt(T)/100;
  const rho_call   = K*T*Math.exp(-r*T)*Nd2/100;
  const rho_put    = -K*T*Math.exp(-r*T)*Nm_d2/100;
  return { call,put,d1,d2,delta_call:Nd1,delta_put:Nd1-1,gamma,theta_call,theta_put,vega,rho_call,rho_put };
};

const EXAMPLES = [
  { name:"Apple (AAPL)", S:185, K:190, T:30,  r:5.25, sigma:28 },
  { name:"S&P 500 (SPY)", S:524, K:530, T:14, r:5.25, sigma:16 },
  { name:"Bitcoin (BTC)", S:65000, K:70000, T:7, r:5.25, sigma:65 },
  { name:"Tesla (TSLA)", S:175, K:180, T:45, r:5.25, sigma:55 },
];

const OptionsCalcTab = ({ theme, lang }) => {
  const isAr = lang === 'ar';
  const P = theme?.primary || '#D4A843';
  const [S,   setS]   = useState("185");
  const [K,   setK]   = useState("190");
  const [Td,  setTd]  = useState("30");
  const [r,   setR]   = useState("5.25");
  const [sig, setSig] = useState("28");
  const [mode, setMode] = useState("price");

  const res = useMemo(() => {
    const sv=parseFloat(S)||0, kv=parseFloat(K)||0, tv=(parseFloat(Td)||1)/365;
    const rv=(parseFloat(r)||0)/100, sigv=(parseFloat(sig)||0)/100;
    return blackScholes(sv,kv,tv,rv,sigv);
  }, [S,K,Td,r,sig]);

  // Chart data: option prices across spot price range
  const chartData = useMemo(() => {
    const sv=parseFloat(S)||185, kv=parseFloat(K)||190, tv=(parseFloat(Td)||30)/365;
    const rv=(parseFloat(r)||5.25)/100, sigv=(parseFloat(sig)||28)/100;
    return Array.from({length:41},(_,i) => {
      const spot = sv*(0.8+i*0.01);
      const r2 = blackScholes(spot,kv,tv,rv,sigv);
      return r2 ? {x:spot,call:r2.call,put:r2.put} : null;
    }).filter(Boolean);
  }, [S,K,Td,r,sig]);

  const f2 = n => (isNaN(n)||!isFinite(n)) ? 'N/A' : n.toFixed(4);
  const f4 = n => (isNaN(n)||!isFinite(n)) ? 'N/A' : n.toFixed(2);

  const ChartSVG = () => {
    if (!chartData.length) return null;
    const W=460,H=150,PAD=36;
    const xs=chartData.map(d=>d.x), calls=chartData.map(d=>d.call), puts=chartData.map(d=>d.put);
    const minX=Math.min(...xs), maxX=Math.max(...xs);
    const maxY=Math.max(...calls,...puts)*1.1||1;
    const sx=x=>PAD+(x-minX)/(maxX-minX)*(W-PAD*2);
    const sy=v=>H-PAD-(v/maxY)*(H-PAD*2);
    const callPath=chartData.map((d,i)=>`${i===0?'M':'L'}${sx(d.x)},${sy(d.call)}`).join(' ');
    const putPath =chartData.map((d,i)=>`${i===0?'M':'L'}${sx(d.x)},${sy(d.put)}`).join(' ');
    const strikeX=sx(parseFloat(K)||190);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', display:'block' }}>
        <defs>
          <linearGradient id="cG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ADE80" stopOpacity="0.25"/><stop offset="100%" stopColor="#4ADE80" stopOpacity="0"/></linearGradient>
          <linearGradient id="pG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E05252" stopOpacity="0.25"/><stop offset="100%" stopColor="#E05252" stopOpacity="0"/></linearGradient>
        </defs>
        {[0.25,0.5,0.75].map(f=><line key={f} x1={PAD} y1={sy(maxY*f)} x2={W-PAD} y2={sy(maxY*f)} stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4,4"/>)}
        <line x1={strikeX} y1={PAD} x2={strikeX} y2={H-PAD} stroke="rgba(251,191,36,0.5)" strokeWidth={1.5} strokeDasharray="5,3"/>
        <text x={strikeX+3} y={PAD+10} fontSize={8} fill="rgba(251,191,36,0.8)">K={K}</text>
        <path d={`${callPath} L${sx(maxX)},${H-PAD} L${sx(minX)},${H-PAD} Z`} fill="url(#cG)"/>
        <path d={`${putPath} L${sx(maxX)},${H-PAD} L${sx(minX)},${H-PAD} Z`} fill="url(#pG)"/>
        <path d={callPath} fill="none" stroke="#4ADE80" strokeWidth={2} strokeLinecap="round"/>
        <path d={putPath}  fill="none" stroke="#E05252" strokeWidth={2} strokeLinecap="round"/>
        {[0,0.5,1].map(f=>{
          const xv=minX+f*(maxX-minX);
          return <text key={f} x={sx(xv)} y={H-4} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.3)">{xv.toFixed(0)}</text>;
        })}
        {[0.5,1].map(f=><text key={f} x={PAD-4} y={sy(maxY*f)+3} textAnchor="end" fontSize={8} fill="rgba(255,255,255,0.3)">${(maxY*f).toFixed(1)}</text>)}
      </svg>
    );
  };

  return (
    <div style={{ fontFamily:isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif", direction:isAr?'rtl':'ltr', color:'#EEE8DA', padding:'0 0 40px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <div style={{ width:40, height:40, borderRadius:10, background:`linear-gradient(135deg,${P},${P}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>⚡</div>
        <div>
          <h2 style={{ margin:0, fontSize:19, fontWeight:800, color:'#fff' }}>{isAr?'حاسبة الخيارات — Black-Scholes':'Options Calculator — Black-Scholes'}</h2>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>{isAr?'تسعير الخيارات والمعاملات اليونانية (Delta, Gamma, Theta, Vega, Rho)':'Option pricing & Greeks (Delta, Gamma, Theta, Vega, Rho)'}</div>
        </div>
      </div>

      {/* Quick examples */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
        {EXAMPLES.map(ex => (
          <button key={ex.name} onClick={()=>{setS(String(ex.S));setK(String(ex.K));setTd(String(ex.T));setR(String(ex.r));setSig(String(ex.sigma));}} style={{ padding:'5px 12px', borderRadius:8, border:`1px solid ${P}33`, background:`${P}0f`, color:P, fontSize:11, fontWeight:600, cursor:'pointer' }}>
            {ex.name}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {/* LEFT: Inputs */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>⚙️ {isAr?'المدخلات':'Inputs'}</div>
          {[
            { label:isAr?'السعر الحالي (S)':'Spot Price (S)',               val:S,   set:setS,   desc:isAr?'السعر الحالي للأصل':'Current asset price' },
            { label:isAr?'سعر التنفيذ (K)':'Strike Price (K)',               val:K,   set:setK,   desc:isAr?'سعر الخيار المحدد':'Exercise price' },
            { label:isAr?'أيام حتى الانتهاء (T)':'Days to Expiry (T)',       val:Td,  set:setTd,  desc:isAr?'الأيام المتبقية':'Days remaining' },
            { label:isAr?'معدل الخالي من المخاطر (r %)':'Risk-Free Rate (%)', val:r,   set:setR,   desc:isAr?'عادةً سعر الفائدة على T-Bills':'T-bill rate' },
            { label:isAr?'التقلب السنوي (σ %)':'Annual Volatility (σ %)',    val:sig, set:setSig, desc:isAr?'التذبذب التاريخي أو الضمني':'Historical or implied vol' },
          ].map((f,i) => (
            <div key={i}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{f.label}</span>
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)' }}>{f.desc}</span>
              </div>
              <input type="number" value={f.val} onChange={e=>f.set(e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'7px 10px', color:'#fff', fontSize:13, outline:'none', boxSizing:'border-box' }} />
            </div>
          ))}

          {/* ITM/OTM indicator */}
          {res && (
            <div style={{ padding:'8px 12px', borderRadius:8, background: parseFloat(S)>parseFloat(K)?'rgba(74,222,128,0.1)':'rgba(96,165,250,0.1)', border:`1px solid ${parseFloat(S)>parseFloat(K)?'rgba(74,222,128,0.3)':'rgba(96,165,250,0.3)'}`, fontSize:11, fontWeight:700, color: parseFloat(S)>parseFloat(K)?'#4ADE80':'#60A5FA' }}>
              {parseFloat(S)>parseFloat(K)
                ? (isAr?'✅ Call في المال (ITM) · Put خارج المال (OTM)':'✅ Call In-the-Money · Put Out-of-the-Money')
                : (isAr?'📉 Call خارج المال (OTM) · Put في المال (ITM)':'📉 Call Out-of-the-Money · Put In-the-Money')}
            </div>
          )}
        </div>

        {/* RIGHT: Results */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {/* Mode selector */}
          <div style={{ display:'flex', gap:6 }}>
            {['price','greeks','chart'].map(m => (
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:'7px', borderRadius:8, border:`1px solid ${mode===m?P:'rgba(255,255,255,0.08)'}`, background: mode===m?`${P}22`:'transparent', color: mode===m?P:'rgba(255,255,255,0.45)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                {m==='price'?(isAr?'💰 السعر':'💰 Price'):m==='greeks'?(isAr?'🔣 اليونانية':'🔣 Greeks'):(isAr?'📈 الرسم':'📈 Chart')}
              </button>
            ))}
          </div>

          {res && mode==='price' && (
            <div style={{ animation:'fadeIn .3s ease', display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:isAr?'سعر خيار الشراء (Call)':'Call Option Price', value:`$${f4(res.call)}`, color:'#4ADE80', big:true },
                { label:isAr?'سعر خيار البيع (Put)':'Put Option Price',   value:`$${f4(res.put)}`,  color:'#E05252', big:true },
                { label:'d₁', value:f2(res.d1), color:'rgba(255,255,255,0.6)' },
                { label:'d₂', value:f2(res.d2), color:'rgba(255,255,255,0.6)' },
              ].map((s,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${s.color}22`, borderRadius:11, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginBottom:3 }}>{s.label}</div>
                  <div style={{ fontSize:s.big?22:15, fontWeight:800, color:s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {res && mode==='greeks' && (
            <div style={{ animation:'fadeIn .3s ease', display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { greek:'Δ Delta',  call:f2(res.delta_call), put:f2(res.delta_put), descEn:'Price sensitivity to $1 spot move',       descAr:'حساسية السعر لتحرك $1 في الأصل' },
                { greek:'Γ Gamma',  call:f2(res.gamma),      put:f2(res.gamma),     descEn:'Rate of change of Delta',                 descAr:'معدل تغيير دلتا' },
                { greek:'Θ Theta',  call:f2(res.theta_call), put:f2(res.theta_put), descEn:'Daily time decay ($)',                    descAr:'التآكل الزمني اليومي ($)' },
                { greek:'V Vega',   call:f2(res.vega),       put:f2(res.vega),      descEn:'$ change per 1% vol increase',            descAr:'التغيير لكل 1% زيادة في التقلب' },
                { greek:'ρ Rho',    call:f2(res.rho_call),   put:f2(res.rho_put),   descEn:'$ change per 1% rate increase',           descAr:'التغيير لكل 1% زيادة في سعر الفائدة' },
              ].map((g,i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:P }}>{g.greek}</span>
                    <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>{isAr?g.descAr:g.descEn}</span>
                  </div>
                  <div style={{ display:'flex', gap:16 }}>
                    <span style={{ fontSize:12, color:'#4ADE80' }}>Call: <b>{g.call}</b></span>
                    <span style={{ fontSize:12, color:'#E05252' }}>Put: <b>{g.put}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mode==='chart' && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:16, animation:'fadeIn .3s ease' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:12 }}>{isAr?'📈 سعر الخيار مقابل سعر الأصل':'📈 Option Price vs. Spot Price'}</div>
              <ChartSVG />
              <div style={{ display:'flex', gap:16, marginTop:10, fontSize:11, flexWrap:'wrap' }}>
                {[{color:'#4ADE80',label:'Call'},{color:'#E05252',label:'Put'},{color:'rgba(251,191,36,0.7)',label:'Strike K',dash:true}].map((l,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <svg width={20} height={8}><line x1={0} y1={4} x2={20} y2={4} stroke={l.color} strokeWidth={2} strokeDasharray={l.dash?'4,3':undefined}/></svg>
                    <span style={{ color:'rgba(255,255,255,0.45)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OptionsCalcTab;
