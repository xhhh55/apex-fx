/* eslint-disable */
import { useState, useEffect, useMemo } from 'react';
import { proxyAI } from '../utils/ai';

const C = { card:"rgba(255,255,255,0.025)", border:"rgba(255,255,255,0.07)", sub:"rgba(238,232,218,0.42)", text:"#EEE8DA", green:"#4ADE80", red:"#E05252", blue:"#60A5FA", yellow:"#FBBF24", purple:"#A78BFA" };
const PAIRS = ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CHF','NZD/USD','EUR/GBP','USD/CAD','EUR/JPY','GBP/JPY'];
const BASE_SPREADS = { 'XM':[0.6,0.9,0.7,0.8,0.9,1.1,0.8,1.0,1.2,1.4],'Exness':[0.3,0.6,0.4,0.5,0.7,0.9,0.6,0.7,0.9,1.1],'IC Markets':[0.1,0.4,0.2,0.3,0.5,0.7,0.4,0.5,0.7,0.9],'eToro':[1.0,1.5,1.2,1.3,1.5,1.8,1.3,1.6,1.9,2.2],'FXCM':[0.8,1.1,0.9,1.0,1.2,1.4,1.0,1.2,1.5,1.7],'OANDA':[0.9,1.3,1.0,1.1,1.3,1.6,1.1,1.4,1.7,2.0] };
const BROKER_COLORS = { 'XM':'#F59E0B','Exness':'#3B82F6','IC Markets':'#10B981','eToro':'#8B5CF6','FXCM':'#EF4444','OANDA':'#EC4899' };
const FG_HISTORY = [{day:'Mon',dayAr:'الإثنين',v:38},{day:'Tue',dayAr:'الثلاثاء',v:45},{day:'Wed',dayAr:'الأربعاء',v:52},{day:'Thu',dayAr:'الخميس',v:61},{day:'Fri',dayAr:'الجمعة',v:58},{day:'Sat',dayAr:'السبت',v:49},{day:'Sun',dayAr:'الأحد',v:54}];
const FG_FACTORS = [{en:'Price Momentum',ar:'زخم السعر',v:62,c:'#4ADE80'},{en:'Volatility',ar:'التذبذب',v:38,c:'#FBBF24'},{en:'Market Volume',ar:'حجم السوق',v:71,c:'#60A5FA'},{en:'Social Sentiment',ar:'مزاج التواصل',v:55,c:'#A78BFA'},{en:'Safe Haven Demand',ar:'طلب الملاذ الآمن',v:42,c:'#F472B6'}];
const ZONES = [{min:0,max:20,en:'Extreme Fear',ar:'خوف شديد',c:'#DC2626'},{min:21,max:40,en:'Fear',ar:'خوف',c:'#EF4444'},{min:41,max:60,en:'Neutral',ar:'محايد',c:'#FBBF24'},{min:61,max:80,en:'Greed',ar:'جشع',c:'#4ADE80'},{min:81,max:100,en:'Extreme Greed',ar:'جشع شديد',c:'#16A34A'}];
const CB_EVENTS = [{bank:'FED',bankAr:'الاحتياطي الفيدرالي',date:'Feb 1',dateAr:'1 فبراير',decision:'Hold',decisionAr:'ثبات',color:'#FBBF24'},{bank:'FED',bankAr:'الاحتياطي الفيدرالي',date:'Mar 20',dateAr:'20 مارس',decision:'Hold',decisionAr:'ثبات',color:'#FBBF24'},{bank:'FED',bankAr:'الاحتياطي الفيدرالي',date:'May 1',dateAr:'1 مايو',decision:'Cut',decisionAr:'خفض',color:'#60A5FA'},{bank:'ECB',bankAr:'البنك المركزي الأوروبي',date:'Feb 7',dateAr:'7 فبراير',decision:'Hold',decisionAr:'ثبات',color:'#FBBF24'},{bank:'ECB',bankAr:'البنك المركزي الأوروبي',date:'Mar 14',dateAr:'14 مارس',decision:'Cut',decisionAr:'خفض',color:'#60A5FA'},{bank:'BOE',bankAr:'بنك إنجلترا',date:'Feb 1',dateAr:'1 فبراير',decision:'Hold',decisionAr:'ثبات',color:'#FBBF24'},{bank:'BOE',bankAr:'بنك إنجلترا',date:'Mar 21',dateAr:'21 مارس',decision:'Hike',decisionAr:'رفع',color:'#E05252'},{bank:'BOJ',bankAr:'بنك اليابان',date:'Mar 19',dateAr:'19 مارس',decision:'Hold',decisionAr:'ثبات',color:'#FBBF24'},{bank:'RBA',bankAr:'البنك الأسترالي',date:'Feb 6',dateAr:'6 فبراير',decision:'Hold',decisionAr:'ثبات',color:'#FBBF24'}];

const T = {
  en:{ title:'Forex Market Sentiment', subtitle:'Fear & Greed · Pair Sentiment · Broker Spreads · CB Calendar', lastUpdated:'Last updated', tabFG:'Fear & Greed', tabPairs:'Pair Sentiment', tabSpreads:'Broker Spreads', tabCB:'CB Calendar', gaugeTitle:'Fear & Greed Index', zoneTitle:'Index Zones', histTitle:'7-Day History', factorsTitle:'Factor Breakdown', pairTitle:'Pair Sentiment Grid', liveRefresh:'LIVE — refreshes every 5s', bullish:'Bullish', bearish:'Bearish', neutral:'Neutral', buy:'BUY', sell:'SELL', spreadsTitle:'Broker Spread Comparison', selectPair:'Select Pair', pips:'pips', avgSpread:'Avg Spread', liveSpread:'LIVE — updates every 4s', cbTitle:'Central Bank Calendar', cbBank:'Bank', cbDate:'Date', cbDecision:'Expected Decision', aiTitle:'AI Market Outlook', aiPlaceholder:'Click below for a 2-sentence AI sentiment analysis.', aiBtn:'Get AI Outlook', aiLoading:'Analyzing...' },
  ar:{ title:'مزاج سوق الفوركس', subtitle:'الخوف والجشع · مزاج الأزواج · السبريدات · تقويم البنوك', lastUpdated:'آخر تحديث', tabFG:'الخوف والجشع', tabPairs:'مزاج الأزواج', tabSpreads:'سبريد الوسطاء', tabCB:'تقويم البنوك', gaugeTitle:'مؤشر الخوف والجشع', zoneTitle:'مناطق المؤشر', histTitle:'السجل الأسبوعي', factorsTitle:'تفاصيل المؤشر', pairTitle:'مزاج أزواج الفوركس', liveRefresh:'مباشر — يتجدد كل 5 ثوانٍ', bullish:'صعودي', bearish:'هبوطي', neutral:'محايد', buy:'شراء', sell:'بيع', spreadsTitle:'مقارنة سبريد الوسطاء', selectPair:'اختر الزوج', pips:'نقطة', avgSpread:'متوسط السبريد', liveSpread:'مباشر — يتحدث كل 4 ثوانٍ', cbTitle:'تقويم البنوك المركزية', cbBank:'البنك', cbDate:'التاريخ', cbDecision:'القرار المتوقع', aiTitle:'توقعات الذكاء الاصطناعي', aiPlaceholder:'اضغط أدناه للحصول على تحليل ذكي للسوق.', aiBtn:'احصل على التوقعات', aiLoading:'جارٍ التحليل...' },
};

const clamp = (v,lo,hi) => Math.min(hi,Math.max(lo,v));
const fgColor = v => v<=20?'#DC2626':v<=40?'#EF4444':v<=60?'#FBBF24':v<=80?'#4ADE80':'#16A34A';
const fgZone  = v => ZONES.find(z=>v>=z.min&&v<=z.max)||ZONES[2];
const initPairs = () => PAIRS.map(pair=>{ const b=clamp(Math.round(40+Math.random()*30),30,70); return {pair,buy:b,sell:100-b}; });

const SemiGauge = ({ value, color, size=210 }) => {
  const cx=size/2, cy=size/2, r=size*0.38, toR=d=>(d*Math.PI)/180;
  const arc=(s,e,rad)=>{
    const [x1,y1]=[cx+rad*Math.cos(toR(s)),cy+rad*Math.sin(toR(s))];
    const [x2,y2]=[cx+rad*Math.cos(toR(e)),cy+rad*Math.sin(toR(e))];
    return `M${x1} ${y1} A${rad} ${rad} 0 ${e-s>180?1:0} 1 ${x2} ${y2}`;
  };
  const segs=[{s:0,e:20,c:'#DC2626'},{s:20,e:40,c:'#EF4444'},{s:40,e:60,c:'#FBBF24'},{s:60,e:80,c:'#4ADE80'},{s:80,e:100,c:'#16A34A'}];
  const nd=-180+(clamp(value,0,100)/100)*180;
  const nlen=r-12;
  return (
    <svg width={size} height={size*0.58} viewBox={`0 0 ${size} ${size*0.58}`}>
      <path d={arc(-180,0,r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={16}/>
      {segs.map((z,i)=><path key={i} d={arc(-180+(z.s/100)*180,-180+(z.e/100)*180,r)} fill="none" stroke={z.c} strokeWidth={16} opacity={0.85}/>)}
      {[0,25,50,75,100].map(p=>{ const d=toR(-180+(p/100)*180); return <line key={p} x1={cx+(r-22)*Math.cos(d)} y1={cy+(r-22)*Math.sin(d)} x2={cx+(r+3)*Math.cos(d)} y2={cy+(r+3)*Math.sin(d)} stroke="rgba(255,255,255,0.3)" strokeWidth={2}/>; })}
      <line x1={cx} y1={cy} x2={cx+nlen*Math.cos(toR(nd))} y2={cy+nlen*Math.sin(toR(nd))} stroke={color} strokeWidth={3} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={7} fill={color}/><circle cx={cx} cy={cy} r={3} fill="#070A0F"/>
    </svg>
  );
};

const ForexSentimentTab = ({ theme, lang }) => {
  const isAr=lang==='ar', P=theme?.primary||'#D4A843', t=isAr?T.ar:T.en;
  const [tab,setTab]=useState('fg');
  const [now,setNow]=useState(new Date());
  const [fgVal,setFgVal]=useState(54);
  const [pairSent,setPairSent]=useState(initPairs);
  const [spreads,setSpreads]=useState(()=>{ const s={}; Object.keys(BASE_SPREADS).forEach(b=>{ s[b]=BASE_SPREADS[b].map(v=>+(v+(Math.random()-.5)*.1).toFixed(1)); }); return s; });
  const [selPair,setSelPair]=useState(0);
  const [aiText,setAiText]=useState('');
  const [aiLoad,setAiLoad]=useState(false);

  useEffect(()=>{ const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id); },[]);
  useEffect(()=>{ const id=setInterval(()=>setFgVal(v=>clamp(Math.round(v+(Math.random()-.5)*4),1,99)),30000); return ()=>clearInterval(id); },[]);
  useEffect(()=>{ const id=setInterval(()=>setPairSent(p=>p.map(x=>{ const b=clamp(x.buy+Math.round((Math.random()-.5)*6),20,80); return {...x,buy:b,sell:100-b}; })),5000); return ()=>clearInterval(id); },[]);
  useEffect(()=>{ const id=setInterval(()=>setSpreads(p=>{ const n={}; Object.keys(p).forEach(b=>{ n[b]=p[b].map(v=>Math.max(0.1,+(v+(Math.random()-.5)*.08).toFixed(1))); }); return n; }),4000); return ()=>clearInterval(id); },[]);

  const gc=fgColor(fgVal), gz=fgZone(fgVal);
  const bestPer=useMemo(()=>PAIRS.map((_,pi)=>{ let m=Infinity,b=''; Object.keys(spreads).forEach(br=>{ if(spreads[br][pi]<m){m=spreads[br][pi];b=br;} }); return b; }),[spreads]);
  const bkAvgs=useMemo(()=>Object.keys(spreads).map(b=>({ broker:b, avg:(spreads[b].reduce((a,v)=>a+v,0)/spreads[b].length).toFixed(2), wins:PAIRS.filter((_,pi)=>bestPer[pi]===b).length })).sort((a,b)=>+a.avg-+b.avg),[spreads,bestPer]);
  const spMax=Math.max(...Object.values(spreads).map(a=>a[selPair]))*1.25||2.5;

  const runAI=async()=>{ setAiLoad(true); const zone=isAr?gz.ar:gz.en; const prompt=isAr?`في جملتين، لخّص حالة سوق الفوركس بناءً على مؤشر الخوف والجشع (${fgVal}/100 — ${zone}).`:`In 2 sentences, summarize forex market sentiment based on Fear & Greed index (${fgVal}/100 — ${zone}).`; const r=await proxyAI(prompt,200); setAiText(r||(isAr?'تعذّر التحليل':'Unavailable')); setAiLoad(false); };
  const getDir=buy=>buy>=60?{label:t.bullish,color:C.green}:buy<=40?{label:t.bearish,color:C.red}:{label:t.neutral,color:C.yellow};
  const card=(ex={})=>({background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:'18px 20px',...ex});
  const tabS=a=>({padding:'9px 16px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .2s',background:a?`${P}1E`:'transparent',border:`1px solid ${a?P:'rgba(255,255,255,0.1)'}`,color:a?P:'rgba(255,255,255,0.45)'});
  const fmt=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;

  return (
    <div style={{fontFamily:isAr?"'Cairo','Tajawal',sans-serif":"'Inter',system-ui,sans-serif",direction:isAr?'rtl':'ltr',color:C.text,padding:'0 0 48px'}}>
      <style>{`@keyframes fxFade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes lPulse{0%,100%{opacity:1}50%{opacity:.4}}.fx-bar{transition:width .6s ease}.fx-row:hover{background:rgba(255,255,255,0.025)!important}`}</style>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${P},${P}99)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🧠</div>
          <div>
            <h2 style={{margin:0,fontSize:19,fontWeight:900,color:'#fff'}}>{t.title}</h2>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>{t.subtitle}</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'rgba(255,255,255,0.3)'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:C.green,animation:'lPulse 2s infinite'}}/>{t.lastUpdated}: {fmt(now)}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:22}}>
        {[['fg',`📊 ${t.tabFG}`],['pairs',`🔄 ${t.tabPairs}`],['spreads',`📡 ${t.tabSpreads}`],['cb',`🏦 ${t.tabCB}`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={tabS(tab===k)}>{l}</button>
        ))}
      </div>

      {/* FEAR & GREED */}
      {tab==='fg'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16,animation:'fxFade .35s ease'}}>
          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:16}}>📊 {t.gaugeTitle}</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,alignItems:'center'}}>
              <div style={{textAlign:'center'}}>
                <SemiGauge value={fgVal} color={gc} size={210}/>
                <div style={{fontSize:52,fontWeight:900,color:gc,lineHeight:1,marginTop:-8}}>{fgVal}</div>
                <div style={{fontSize:15,fontWeight:800,color:gc,marginTop:8}}>{isAr?gz.ar:gz.en}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:C.sub,fontWeight:700,marginBottom:12}}>{t.zoneTitle}</div>
                {ZONES.map((z,i)=>{ const act=fgVal>=z.min&&fgVal<=z.max; return (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,padding:'5px 9px',borderRadius:8,background:act?`${z.c}15`:'transparent',border:`1px solid ${act?z.c+'44':'transparent'}`}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:z.c,flexShrink:0}}/>
                    <span style={{fontSize:9,color:C.sub,width:40}}>{z.min}–{z.max}</span>
                    <span style={{fontSize:12,fontWeight:act?800:400,color:act?'#fff':C.sub}}>{isAr?z.ar:z.en}{act&&<span style={{color:z.c}}> ◀</span>}</span>
                  </div>
                );})}
              </div>
            </div>
          </div>

          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:16}}>📅 {t.histTitle}</div>
            <div style={{display:'flex',gap:6,alignItems:'flex-end',height:110}}>
              {FG_HISTORY.map((d,i)=>{ const h=Math.max(10,(d.v/100)*90),col=fgColor(d.v); return (
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{fontSize:9,fontWeight:700,color:col}}>{d.v}</div>
                  <div style={{width:'100%',height:h,borderRadius:'4px 4px 2px 2px',background:`linear-gradient(180deg,${col}CC,${col}44)`,transition:'height .5s'}}/>
                  <div style={{fontSize:9,color:C.sub,textAlign:'center'}}>{isAr?d.dayAr:d.day}</div>
                </div>
              );})}
            </div>
          </div>

          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:16}}>⚙️ {t.factorsTitle}</div>
            {FG_FACTORS.map((f,i)=>(
              <div key={i} style={{marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.72)'}}>{isAr?f.ar:f.en}</span>
                  <span style={{fontSize:13,fontWeight:800,color:f.c}}>{f.v}%</span>
                </div>
                <div style={{height:6,background:'rgba(255,255,255,0.06)',borderRadius:6,overflow:'hidden'}}>
                  <div className="fx-bar" style={{width:`${f.v}%`,height:'100%',background:`linear-gradient(90deg,${f.c}66,${f.c})`,borderRadius:6}}/>
                </div>
              </div>
            ))}
          </div>

          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:12}}>🤖 {t.aiTitle}</div>
            {aiText?<div style={{fontSize:13,color:'rgba(255,255,255,0.8)',lineHeight:1.8,background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'12px 14px',marginBottom:14,borderInlineStart:`3px solid ${P}`}}>{aiText}</div>:<div style={{fontSize:12,color:C.sub,marginBottom:14,lineHeight:1.6}}>{t.aiPlaceholder}</div>}
            <button onClick={runAI} disabled={aiLoad} style={{padding:'10px 22px',borderRadius:10,border:`1px solid ${P}44`,background:`${P}15`,color:aiLoad?C.sub:P,fontSize:12,fontWeight:700,cursor:aiLoad?'not-allowed':'pointer'}}>
              {aiLoad?`⏳ ${t.aiLoading}`:`✨ ${t.aiBtn}`}
            </button>
          </div>
        </div>
      )}

      {/* PAIR SENTIMENT */}
      {tab==='pairs'&&(
        <div style={{animation:'fxFade .35s ease'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:16}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:C.green,animation:'lPulse 1.5s infinite'}}/><span style={{fontSize:11,color:C.green,fontWeight:600}}>{t.liveRefresh}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10}}>
            {pairSent.map(p=>{ const dir=getDir(p.buy); return (
              <div key={p.pair} className="fx-row" style={{...card({padding:'14px 16px'}),transition:'background .2s'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <span style={{fontSize:14,fontWeight:800,color:'#fff'}}>{p.pair}</span>
                  <span style={{fontSize:10,fontWeight:700,color:dir.color,background:`${dir.color}18`,border:`1px solid ${dir.color}44`,borderRadius:6,padding:'2px 8px'}}>{dir.label}</span>
                </div>
                {[[t.buy,p.buy,C.green],[t.sell,p.sell,C.red]].map(([label,pct,col])=>(
                  <div key={label} style={{marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontSize:10,color:col,fontWeight:600}}>{label}</span>
                      <span style={{fontSize:11,fontWeight:800,color:col,fontFamily:"monospace"}}>{pct}%</span>
                    </div>
                    <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:5,overflow:'hidden'}}>
                      <div className="fx-bar" style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${col}55,${col})`,borderRadius:5}}/>
                    </div>
                  </div>
                ))}
              </div>
            );})}
          </div>
        </div>
      )}

      {/* BROKER SPREADS */}
      {tab==='spreads'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16,animation:'fxFade .35s ease'}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:C.green,animation:'lPulse 1.5s infinite'}}/><span style={{fontSize:11,color:C.green,fontWeight:600}}>{t.liveSpread}</span>
          </div>
          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:16}}>📡 {t.spreadsTitle}</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap'}}>
              <span style={{fontSize:12,color:C.sub}}>{t.selectPair}:</span>
              <select value={selPair} onChange={e=>setSelPair(+e.target.value)} style={{padding:'7px 12px',borderRadius:8,fontSize:12,fontWeight:600,background:'rgba(255,255,255,0.07)',border:`1px solid ${C.border}`,color:'#fff',cursor:'pointer',outline:'none'}}>
                {PAIRS.map((p,i)=><option key={p} value={i} style={{background:'#1a1a2e'}}>{p}</option>)}
              </select>
            </div>
            {Object.keys(spreads).map(broker=>{ const val=spreads[broker][selPair],pct=(val/spMax)*100,isBest=bestPer[selPair]===broker; return (
              <div key={broker} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                  <div style={{display:'flex',alignItems:'center',gap:7}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:BROKER_COLORS[broker]}}/>
                    <span style={{fontSize:12,fontWeight:isBest?800:500,color:isBest?'#fff':C.sub}}>{broker}</span>
                    {isBest&&<span style={{fontSize:9,color:C.green,fontWeight:700,background:`${C.green}18`,padding:'1px 6px',borderRadius:4}}>BEST</span>}
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:isBest?C.green:C.sub,fontFamily:'monospace'}}>{val} {t.pips}</span>
                </div>
                <div style={{height:7,background:'rgba(255,255,255,0.06)',borderRadius:6,overflow:'hidden'}}>
                  <div className="fx-bar" style={{width:`${pct}%`,height:'100%',background:`linear-gradient(90deg,${BROKER_COLORS[broker]}66,${BROKER_COLORS[broker]})`,borderRadius:6}}/>
                </div>
              </div>
            );})}
          </div>

          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:14}}>🏆 {isAr?'ترتيب الوسطاء':'Broker Ranking'}</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10}}>
              {bkAvgs.map((b,i)=>(
                <div key={b.broker} style={{textAlign:'center',padding:'12px 8px',background:'rgba(255,255,255,0.03)',border:`1px solid ${i===0?C.green+'44':C.border}`,borderRadius:12}}>
                  <div style={{width:10,height:10,borderRadius:'50%',background:BROKER_COLORS[b.broker],margin:'0 auto 8px'}}/>
                  <div style={{fontSize:11,fontWeight:700,color:'#fff',marginBottom:4}}>{b.broker}</div>
                  <div style={{fontSize:22,fontWeight:900,color:i===0?C.green:P,lineHeight:1}}>{b.avg}</div>
                  <div style={{fontSize:9,color:C.sub,marginTop:3}}>{t.avgSpread}</div>
                  {i===0&&<div style={{fontSize:10,color:C.green,fontWeight:800,marginTop:5}}>🥇</div>}
                </div>
              ))}
            </div>
          </div>

          <div style={{...card(),padding:'16px 0',overflowX:'auto'}}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:12,paddingInlineStart:16}}>📋 {isAr?'جدول السبريدات':'Full Spread Table'}</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                <th style={{padding:'8px 12px',textAlign:isAr?'right':'left',color:C.sub}}>{isAr?'الزوج':'Pair'}</th>
                {Object.keys(spreads).map(b=><th key={b} style={{padding:'8px 6px',textAlign:'center',color:BROKER_COLORS[b],fontWeight:700}}>{b}</th>)}
              </tr></thead>
              <tbody>
                {PAIRS.map((pair,pi)=>(
                  <tr key={pair} className="fx-row" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td style={{padding:'9px 12px',fontWeight:700,color:'#fff'}}>{pair}</td>
                    {Object.keys(spreads).map(b=>{ const isBest=bestPer[pi]===b; return <td key={b} style={{padding:'9px 6px',textAlign:'center',color:isBest?C.green:C.sub,fontWeight:isBest?800:400,background:isBest?`${C.green}0A`:'transparent'}}>{spreads[b][pi]}{isBest?' ★':''}</td>; })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CB CALENDAR */}
      {tab==='cb'&&(
        <div style={{display:'flex',flexDirection:'column',gap:16,animation:'fxFade .35s ease'}}>
          <div style={card()}>
            <div style={{fontSize:13,fontWeight:700,color:'#fff',marginBottom:14}}>🏦 {t.cbTitle}</div>
            <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
              {[{l:isAr?'ثبات':'Hold',c:'#FBBF24'},{l:isAr?'خفض':'Cut',c:'#60A5FA'},{l:isAr?'رفع':'Hike',c:'#E05252'}].map(x=>(
                <div key={x.l} style={{display:'flex',alignItems:'center',gap:5}}><div style={{width:8,height:8,borderRadius:'50%',background:x.c}}/><span style={{fontSize:11,color:C.sub}}>{x.l}</span></div>
              ))}
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {[t.cbBank,t.cbDate,t.cbDecision].map(h=><th key={h} style={{padding:'9px 12px',textAlign:isAr?'right':'left',color:C.sub,fontWeight:600}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {CB_EVENTS.map((ev,i)=>(
                  <tr key={i} className="fx-row" style={{borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <td style={{padding:'10px 12px',fontWeight:700,color:'#fff'}}>{isAr?ev.bankAr:ev.bank}</td>
                    <td style={{padding:'10px 12px',color:C.sub}}>{isAr?ev.dateAr:ev.date}</td>
                    <td style={{padding:'10px 12px'}}><span style={{fontSize:11,fontWeight:700,color:ev.color,background:`${ev.color}18`,border:`1px solid ${ev.color}44`,borderRadius:6,padding:'3px 10px'}}>{isAr?ev.decisionAr:ev.decision}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={card()}>
            <div style={{fontSize:12,color:C.sub,lineHeight:1.9}}>
              {isAr?<><div>• <span style={{color:'#FBBF24',fontWeight:700}}>الثبات</span>: البنك يُبقي الفائدة دون تغيير.</div><div>• <span style={{color:'#60A5FA',fontWeight:700}}>الخفض</span>: سلبي للعملة عموماً.</div><div>• <span style={{color:'#E05252',fontWeight:700}}>الرفع</span>: إيجابي للعملة عموماً.</div><div style={{marginTop:8,fontSize:10,color:'rgba(255,255,255,0.25)'}}>* للأغراض التعليمية فقط.</div></>:<><div>• <span style={{color:'#FBBF24',fontWeight:700}}>Hold</span>: Rates unchanged — neutral for currency.</div><div>• <span style={{color:'#60A5FA',fontWeight:700}}>Cut</span>: Generally bearish for the currency.</div><div>• <span style={{color:'#E05252',fontWeight:700}}>Hike</span>: Generally bullish for the currency.</div><div style={{marginTop:8,fontSize:10,color:'rgba(255,255,255,0.25)'}}>* Dates and decisions for educational purposes only.</div></>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForexSentimentTab;
