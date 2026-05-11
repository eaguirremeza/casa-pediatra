import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const API = import.meta.env.VITE_API_URL || "https://casa-pediatra-production.up.railway.app";

const C = {
  bg:"#0d0f18", card:"#141621", border:"#1f2235", muted:"#4b5268",
  dim:"#8892a4", text:"#e2e8f0", head:"#ffffff",
  fb:"#4f8ef7", gg:"#f97316", accent:"#22d3ee",
  ok:"#22c55e", warn:"#f59e0b", danger:"#ef4444",
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS  = ["L","M","X","J","V","S","D"];
const pad   = n => String(n).padStart(2,"0");
const fmtDate = d => d ? `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` : "";
const today = () => new Date();
const clpFull = n => !n||isNaN(n) ? "$0" : `$${Math.round(n).toLocaleString("es-CL")}`;
const clp = n => !n||isNaN(n) ? "$0" : n>=1e6 ? `$${(n/1e6).toFixed(2)}M` : n>=1e3 ? `$${(n/1e3).toFixed(1)}K` : `$${Math.round(n)}`;

function calGrid(y, m) {
  const first = new Date(y,m,1), last = new Date(y,m+1,0);
  const startDow = (first.getDay()+6)%7;
  const days = Array(startDow).fill(null);
  for(let d=1;d<=last.getDate();d++) days.push(new Date(y,m,d));
  while(days.length%7) days.push(null);
  return days;
}

function CalPanel({ y, m, sel, hov, onDay, onHov, onNav, minD, maxD }) {
  const grid = calGrid(y,m);
  const todStr = fmtDate(today());
  const inRange = d => {
    if(!d) return false;
    const s = fmtDate(d);
    const [a,b] = sel[0]&&sel[1] ? [fmtDate(sel[0]),fmtDate(sel[1])]
      : sel[0]&&hov ? [fmtDate(sel[0]),fmtDate(hov)].sort() : [null,null];
    return a&&b&&s>=a&&s<=b;
  };
  const isS = d => d&&sel[0]&&fmtDate(d)===fmtDate(sel[0]);
  const isE = d => d&&sel[1]&&fmtDate(d)===fmtDate(sel[1]);
  const dis  = d => !d||(minD&&d<minD)||(maxD&&d>maxD);
  return (
    <div style={{flex:1,minWidth:200}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>onNav(-1)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:18}}>‹</button>
        <span style={{fontSize:13,fontWeight:500,color:C.text}}>{MESES[m]} {y}</span>
        <button onClick={()=>onNav(1)} style={{background:"none",border:"none",color:C.dim,cursor:"pointer",fontSize:18}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:4}}>
        {DIAS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:C.muted,padding:"2px 0",fontWeight:500}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
        {grid.map((d,i)=>{
          const disabled=dis(d), sel_=isS(d)||isE(d), rng=inRange(d)&&!sel_, tod=d&&fmtDate(d)===todStr;
          return (
            <div key={i} onClick={()=>!disabled&&d&&onDay(d)} onMouseEnter={()=>d&&!disabled&&onHov(d)}
              style={{textAlign:"center",fontSize:12,padding:"6px 0",borderRadius:5,cursor:disabled?"default":"pointer",
                background:sel_?C.accent:rng?`${C.accent}22`:"transparent",
                color:!d?"transparent":disabled?C.muted:sel_?"#000":tod?C.accent:C.text,
                fontWeight:sel_||tod?600:400,
                border:tod&&!sel_?`1px solid ${C.accent}`:"1px solid transparent",
                opacity:disabled?0.3:1}}>
              {d?d.getDate():""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DatePicker({ value, onChange }) {
  const [open,setOpen]=useState(false);
  const [phase,setPhase]=useState(0);
  const [tmp,setTmp]=useState([null,null]);
  const [hov,setHov]=useState(null);
  const now=today();
  const [cal,setCal]=useState({y:now.getFullYear(),m:now.getMonth()});
  const ref=useRef(null);
  const minD=new Date(2026,0,1), maxD=now;
  useEffect(()=>{
    const fn=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",fn);
    return()=>document.removeEventListener("mousedown",fn);
  },[]);
  const handleDay=d=>{
    if(phase===0||!tmp[0]){setTmp([d,null]);setPhase(1);}
    else{const [a,b]=[tmp[0],d].sort((a,b)=>a-b);setTmp([a,b]);setPhase(0);}
  };
  const apply=()=>{const r=tmp[1]?tmp:[tmp[0],tmp[0]||now];if(r[0]){onChange(r);setOpen(false);}};
  const quick=k=>{
    const t=today();let s,e;
    if(k==="hoy"){s=e=t;}
    else if(k==="mes"){s=new Date(t.getFullYear(),t.getMonth(),1);e=t;}
    else if(k==="mes-full"){s=new Date(t.getFullYear(),t.getMonth(),1);e=new Date(t.getFullYear(),t.getMonth()+1,0);}
    else if(k==="mes-ant"){s=new Date(t.getFullYear(),t.getMonth()-1,1);e=new Date(t.getFullYear(),t.getMonth(),0);}
    else if(k==="ano"){s=new Date(t.getFullYear(),0,1);e=t;}
    setTmp([s,e]);setPhase(0);
  };
  const cal2y=cal.m===11?cal.y+1:cal.y, cal2m=cal.m===11?0:cal.m+1;
  const nav=d=>{const nm=cal.m+d;setCal({y:cal.y+(nm<0?-1:nm>11?1:0),m:((nm%12)+12)%12});};
  const [a,b]=value||[null,null];
  const label=a&&b?(fmtDate(a)===fmtDate(b)?fmtDate(a):`${fmtDate(a)} → ${fmtDate(b)}`):"Seleccionar período";
  return (
    <div ref={ref} style={{position:"relative",zIndex:200}}>
      <button onClick={()=>{setOpen(o=>!o);setTmp(value||[null,null]);setPhase(0);}}
        style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 16px",color:C.text,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:8,whiteSpace:"nowrap"}}>
        📅 {label}
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:16,boxShadow:"0 20px 60px #00000070",width:"min(98vw,520px)"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.border}`}}>
            {[["hoy","Hoy"],["mes","Inicio mes → hoy"],["mes-full","Mes completo"],["mes-ant","Mes anterior"],["ano","Año 2026"]].map(([k,v])=>(
              <button key={k} onClick={()=>quick(k)}
                style={{background:"#1e2235",border:`1px solid ${C.border}`,borderRadius:7,padding:"4px 11px",color:C.dim,cursor:"pointer",fontSize:12}}>
                {v}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>
            <CalPanel y={cal.y} m={cal.m} sel={tmp} hov={hov} onDay={handleDay} onHov={setHov} onNav={nav} minD={minD} maxD={maxD}/>
            <CalPanel y={cal2y} m={cal2m} sel={tmp} hov={hov} onDay={handleDay} onHov={setHov} onNav={nav} minD={minD} maxD={maxD}/>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:11.5,color:C.dim}}>
              {tmp[0]?<><span style={{color:C.text}}>Inicio: </span>{fmtDate(tmp[0])}</>:"Selecciona inicio"}
              {tmp[0]&&tmp[1]&&<>&emsp;<span style={{color:C.text}}>Fin: </span>{fmtDate(tmp[1])}</>}
            </div>
            <button onClick={apply} disabled={!tmp[0]}
              style={{background:tmp[0]?C.accent:"#333",border:"none",borderRadius:8,padding:"7px 22px",color:tmp[0]?"#000":C.muted,fontWeight:600,cursor:tmp[0]?"pointer":"default",fontSize:13}}>
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({label,value,icon}){
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",flex:1,minWidth:120}}>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>{icon} {label}</div>
      <div style={{fontSize:20,fontWeight:500,color:C.head}}>{value}</div>
    </div>
  );
}

function ChanCard({label,color,data}){
  const cpc=data.clicks>0?data.cost/data.clicks:0;
  const ctr=data.imp>0?data.clicks/data.imp*100:0;
  const cpa=data.conv>0?data.cost/data.conv:0;
  const rows=[["Gasto",clpFull(data.cost)],["Clicks",Math.round(data.clicks).toLocaleString()],["Impresiones",Math.round(data.imp).toLocaleString()],["CPC",clpFull(cpc)],["CTR",ctr.toFixed(2)+"%"],["Conversiones",Math.round(data.conv).toLocaleString()],["CPA",clpFull(cpa)]];
  return(
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,flex:1,minWidth:200}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <div style={{width:4,height:18,background:color,borderRadius:2}}/>
        <span style={{fontSize:13,color,fontWeight:500}}>{label}</span>
      </div>
      {rows.map(([k,v])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:6,paddingBottom:5,borderBottom:`1px solid ${C.border}33`}}>
          <span style={{color:C.dim}}>{k}</span><span style={{color:C.text}}>{v}</span>
        </div>
      ))}
    </div>
  );
}

function MonthTable({monthly}){
  const months=Object.keys(monthly).sort();
  const totals={cost:0,fb:0,gg:0,clicks:0,imp:0,conv:0};
  months.forEach(ym=>{const d=monthly[ym];totals.cost+=d.fb.cost+d.gg.cost;totals.fb+=d.fb.cost;totals.gg+=d.gg.cost;totals.clicks+=d.fb.clicks+d.gg.clicks;totals.imp+=d.fb.imp+d.gg.imp;totals.conv+=d.fb.conv+d.gg.conv;});
  const lastYm=months[months.length-1];
  const TH=({ch})=><th style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:500,fontSize:11,textTransform:"uppercase",letterSpacing:".04em",borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{ch}</th>;
  const TD=({ch,color,bold})=><td style={{padding:"9px 12px",color:color||C.text,fontWeight:bold?600:400,fontSize:12.5,whiteSpace:"nowrap"}}>{ch}</td>;
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{background:"#0d0f18"}}>
          {["Mes","Gasto Total","Meta Ads","Google Ads","Clicks","Impresiones","CPC","CTR","Conversiones"].map(h=><TH key={h} ch={h}/>)}
        </tr></thead>
        <tbody>
          {months.map((ym,i)=>{
            const d=monthly[ym];
            const tot=d.fb.cost+d.gg.cost,totClk=d.fb.clicks+d.gg.clicks,totImp=d.fb.imp+d.gg.imp,totConv=d.fb.conv+d.gg.conv;
            const cpc=totClk>0?tot/totClk:0,ctr=totImp>0?totClk/totImp*100:0;
            const [y,m]=ym.split("-");
            const isCur=ym===lastYm;
            return(
              <tr key={ym} style={{borderBottom:`1px solid ${C.border}22`,background:isCur?`${C.accent}08`:i%2===0?"transparent":"#ffffff03"}}>
                <TD ch={`${MESES[parseInt(m)-1]} ${y}${isCur?" ✦":""}`} color={isCur?C.accent:C.text} bold={isCur}/>
                <TD ch={clpFull(tot)} bold/>
                <TD ch={clpFull(d.fb.cost)} color={C.fb}/>
                <TD ch={clpFull(d.gg.cost)} color={C.gg}/>
                <TD ch={totClk.toLocaleString("es-CL")}/>
                <TD ch={totImp.toLocaleString("es-CL")}/>
                <TD ch={clpFull(cpc)}/>
                <TD ch={ctr.toFixed(2)+"%"}/>
                <TD ch={Math.round(totConv).toLocaleString("es-CL")}/>
              </tr>
            );
          })}
          <tr style={{borderTop:`2px solid ${C.border}`,background:"#3b82f612"}}>
            <TD ch="TOTAL 2026" bold color={C.head}/>
            <TD ch={clpFull(totals.cost)} bold color={C.head}/>
            <TD ch={clpFull(totals.fb)} bold color={C.fb}/>
            <TD ch={clpFull(totals.gg)} bold color={C.gg}/>
            <TD ch={totals.clicks.toLocaleString("es-CL")} bold color={C.head}/>
            <TD ch={totals.imp.toLocaleString("es-CL")} bold color={C.head}/>
            <TD ch={clpFull(totals.clicks>0?totals.cost/totals.clicks:0)} bold color={C.head}/>
            <TD ch={(totals.imp>0?totals.clicks/totals.imp*100:0).toFixed(2)+"%"} bold color={C.head}/>
            <TD ch={Math.round(totals.conv).toLocaleString("es-CL")} bold color={C.head}/>
          </tr>
        </tbody>
      </table>
      <div style={{padding:"7px 12px",fontSize:11,color:C.muted}}>✦ Mes en curso — datos parciales al {fmtDate(today())}</div>
    </div>
  );
}

function Charts({monthly}){
  const months=Object.keys(monthly).sort();
  const bars=months.map(ym=>{
    const d=monthly[ym],[y,m]=ym.split("-");
    return{label:MESES[parseInt(m)-1].slice(0,3),fb:Math.round(d.fb.cost),gg:Math.round(d.gg.cost),total:Math.round(d.fb.cost+d.gg.cost),conv:Math.round(d.fb.conv+d.gg.conv)};
  });
  const TT=({active,payload,label})=>{
    if(!active||!payload?.length)return null;
    return<div style={{background:"#1a1d2e",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:12}}>
      <div style={{color:C.dim,marginBottom:4}}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{color:p.color}}>{p.name}: {clpFull(p.value)}</div>)}
    </div>;
  };
  const axFmt=v=>v>=1e6?`$${(v/1e6).toFixed(1)}M`:v>=1e3?`$${(v/1e3).toFixed(0)}K`:`$${v}`;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 6px"}}>
        <div style={{fontSize:12.5,color:C.dim,paddingLeft:10,marginBottom:10}}>Gasto mensual por canal</div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={bars} margin={{top:4,right:16,left:10,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="label" tick={{fill:C.dim,fontSize:12}}/>
            <YAxis tick={{fill:C.dim,fontSize:11}} tickFormatter={axFmt} width={64}/>
            <Tooltip content={<TT/>}/>
            <Legend wrapperStyle={{fontSize:12,color:C.dim}}/>
            <Bar dataKey="fb" name="Meta Ads" fill={C.fb} radius={[4,4,0,0]}/>
            <Bar dataKey="gg" name="Google Ads" fill={C.gg} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 6px"}}>
        <div style={{fontSize:12.5,color:C.dim,paddingLeft:10,marginBottom:10}}>Gasto total mensual</div>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={bars} margin={{top:4,right:16,left:10,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="label" tick={{fill:C.dim,fontSize:12}}/>
            <YAxis tick={{fill:C.dim,fontSize:11}} tickFormatter={axFmt} width={64}/>
            <Tooltip content={<TT/>}/>
            <Line type="monotone" dataKey="total" name="Total" stroke={C.accent} strokeWidth={2.5} dot={{r:4,fill:C.accent}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function App(){
  const now=today();
  const [range,setRange]=useState([new Date(now.getFullYear(),now.getMonth(),1),now]);
  const [tab,setTab]=useState("overview");
  const [monthly,setMonthly]=useState({});
  const [rangeData,setRangeData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [lastUpdated,setLastUpdated]=useState(null);

  // Cargar histórico al inicio
  useEffect(()=>{
    fetch(`${API}/api/monthly`)
      .then(r=>r.json())
      .then(d=>{setMonthly(d.monthly||{});setLastUpdated(d.lastUpdated);setLoading(false);})
      .catch(()=>{setError("No se pudo conectar con el backend.");setLoading(false);});
  },[]);

  // Cargar datos del rango seleccionado
  useEffect(()=>{
    if(!range[0]||!range[1])return;
    const s=fmtDate(range[0]),e=fmtDate(range[1]);
    fetch(`${API}/api/data?start=${s}&end=${e}`)
      .then(r=>r.json())
      .then(d=>setRangeData(d))
      .catch(()=>setError("Error al cargar datos del período."));
  },[range]);

  const fb=rangeData?.fb||{cost:0,clicks:0,imp:0,conv:0};
  const gg=rangeData?.gg||{cost:0,clicks:0,imp:0,conv:0};
  const tot=rangeData?.tot||{cost:0,clicks:0,imp:0,conv:0};
  const cpc=tot.clicks>0?tot.cost/tot.clicks:0;
  const ctr=tot.imp>0?tot.clicks/tot.imp*100:0;
  const cpa=tot.conv>0?tot.cost/tot.conv:0;
  const rangeLabel=range[0]&&range[1]?(fmtDate(range[0])===fmtDate(range[1])?fmtDate(range[0]):`${fmtDate(range[0])} → ${fmtDate(range[1])}`):"—";
  const tabs=[{id:"overview",label:"📊 Resumen"},{id:"history",label:"📅 Histórico"},{id:"trend",label:"📈 Tendencia"}];

  return(
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"system-ui,-apple-system,sans-serif",padding:"18px 14px 40px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10,marginBottom:18}}>
        <div>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>
            Dashbo · Cliente 7805 · {lastUpdated?`Actualizado ${lastUpdated}`:"Cargando..."}
          </div>
          <h1 style={{margin:"0 0 6px",fontSize:19,fontWeight:500,color:"#fff"}}>Casa Pediatra — Performance Dashboard</h1>
          <div style={{display:"flex",gap:6}}>
            <span style={{background:`${C.fb}22`,color:C.fb,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:500}}>Meta Ads</span>
            <span style={{background:`${C.gg}22`,color:C.gg,borderRadius:5,padding:"2px 8px",fontSize:11,fontWeight:500}}>Google Ads</span>
          </div>
        </div>
        <DatePicker value={range} onChange={setRange}/>
      </div>

      {error&&<div style={{background:`${C.warn}18`,border:`1px solid ${C.warn}44`,borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:12.5,color:C.warn}}>⚠️ {error}</div>}
      {loading&&<div style={{textAlign:"center",padding:40,color:C.dim}}>Cargando datos...</div>}

      {!loading&&(
        <>
          <div style={{display:"flex",gap:0,marginBottom:18,borderBottom:`1px solid ${C.border}`}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${C.accent}`:"2px solid transparent",padding:"7px 14px 9px",color:tab===t.id?C.accent:C.dim,cursor:"pointer",fontSize:13,fontWeight:tab===t.id?500:400}}>
                {t.label}
              </button>
            ))}
          </div>

          {tab==="overview"&&(
            <>
              <div style={{fontSize:11.5,color:C.muted,marginBottom:12}}>Período: <span style={{color:C.accent}}>{rangeLabel}</span></div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                <KpiCard label="Gasto total" value={clpFull(tot.cost)} icon="💸"/>
                <KpiCard label="Clicks" value={Math.round(tot.clicks).toLocaleString()} icon="🖱️"/>
                <KpiCard label="Impresiones" value={Math.round(tot.imp).toLocaleString()} icon="👁️"/>
                <KpiCard label="CPC" value={clpFull(cpc)} icon="💰"/>
                <KpiCard label="CTR" value={ctr.toFixed(2)+"%"} icon="📊"/>
                <KpiCard label="Conversiones" value={Math.round(tot.conv).toLocaleString()} icon="✅"/>
                <KpiCard label="CPA" value={clpFull(cpa)} icon="🎯"/>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <ChanCard label="Meta Ads" color={C.fb} data={fb}/>
                <ChanCard label="Google Ads" color={C.gg} data={gg}/>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:14,minWidth:160,flex:"0 0 auto"}}>
                  <div style={{fontSize:11,color:C.dim,marginBottom:10}}>Distribución gasto</div>
                  {[["Meta Ads",fb.cost,C.fb],["Google Ads",gg.cost,C.gg]].map(([n,v,col])=>{
                    const pct=tot.cost>0?(v/tot.cost*100):0;
                    return(
                      <div key={n} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                          <span style={{color:col}}>{n}</span><span style={{color:C.text}}>{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{height:6,background:C.border,borderRadius:3,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:3}}/>
                        </div>
                        <div style={{fontSize:11,color:C.muted,marginTop:2}}>{clpFull(v)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {tab==="history"&&(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,fontWeight:500,color:C.text}}>Gastos mensuales — Enero 2026 a la fecha</span>
              </div>
              {Object.keys(monthly).length>0?<MonthTable monthly={monthly}/>:<div style={{padding:20,color:C.dim}}>Cargando histórico...</div>}
            </div>
          )}

          {tab==="trend"&&(
            Object.keys(monthly).length>0?<Charts monthly={monthly}/>:<div style={{padding:20,color:C.dim}}>Cargando tendencias...</div>
          )}
        </>
      )}

      <div style={{marginTop:18,fontSize:10,color:C.muted,textAlign:"right"}}>
        Casa Pediatra · {fmtDate(now)}
      </div>
    </div>
  );
  }
