import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE ──────────────────────────────────────────────────────────────────
const _supabase = createClient(
  "https://frsvrgojdttnajxdakxv.supabase.co",
  "sb_publishable_glqqufYmNPaPVrt3Ar23-A_nUXAh-Gr"
);

async function dbLoad(key, def) {
  try {
    const { data, error } = await _supabase
      .from("msp_store").select("value").eq("key", key).single();
    if (error || !data) return def;
    return JSON.parse(data.value);
  } catch { return def; }
}

async function dbSave(key, value) {
  try {
    await _supabase.from("msp_store")
      .upsert({ key, value: JSON.stringify(value) }, { onConflict: "key" });
  } catch(e) { console.error("dbSave:", e); }
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const APP_PWD = import.meta.env.VITE_APP_PASSWORD || "msp2024";

function LoginScreen({ onLogin }) {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const check = () => {
    if (pass === APP_PWD) onLogin();
    else { setErr("Contraseña incorrecta"); setPass(""); }
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FDFCF9"}}>
      <div style={{background:"#fff",borderRadius:16,padding:"40px 36px",border:"1px solid rgba(196,150,42,0.25)",width:"100%",maxWidth:380,textAlign:"center",boxShadow:"0 4px 30px rgba(196,150,42,0.1)"}}>
        <p style={{margin:"0 0 4px",fontWeight:700,fontSize:20,color:"#1C1A16",letterSpacing:"0.05em"}}>MY SECRET PASSION MX</p>
        <p style={{margin:"0 0 28px",fontSize:12,color:"#ADA394"}}>Dashboard de control</p>
        <input type="password" value={pass}
          onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&check()}
          placeholder="Contraseña de acceso"
          style={{width:"100%",marginBottom:10,padding:"10px 14px",fontSize:14,textAlign:"center",borderRadius:8,border:"1px solid rgba(196,150,42,0.3)",outline:"none"}}
          autoFocus/>
        {err&&<p style={{color:"#C04040",fontSize:12,marginBottom:8}}>{err}</p>}
        <button onClick={check} style={{width:"100%",background:"#C4962A",color:"#fff",border:"none",borderRadius:8,padding:11,fontSize:14,fontWeight:600,cursor:"pointer"}}>
          Entrar
        </button>
      </div>
    </div>
  );
}


// ── STORAGE ──────────────────────────────────────────────────────────────────
const SK = { p:"msp-p4",pk:"msp-pk4",c:"msp-c4",s:"msp-s4",e:"msp-e4",sm:"msp-sm4",ex:"msp-ex4" };
const load = dbLoad;
const save = dbSave;

// ── UTILS ─────────────────────────────────────────────────────────────────────
const $m = n => "$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
const pct = n => Number(n).toFixed(1)+"%";
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const today = () => new Date().toISOString().slice(0,10);
const SOBRE_COST = 10;

// ── TIERS ─────────────────────────────────────────────────────────────────────
const TA=[{m:1,p:1199},{m:3,p:699},{m:5,p:650},{m:10,p:530},{m:20,p:500},{m:50,p:470},{m:100,p:450}];
const TB=[{m:1,p:999},{m:3,p:450},{m:5,p:400},{m:10,p:380},{m:20,p:350},{m:50,p:320},{m:100,p:290}];
const TC=[{m:1,p:1250},{m:3,p:750},{m:5,p:700},{m:10,p:580},{m:20,p:550},{m:50,p:520},{m:100,p:500}];
const TD=[{m:1,p:400},{m:3,p:260},{m:5,p:240},{m:10,p:220},{m:20,p:200},{m:50,p:190},{m:100,p:180}];
function tierPrice(tiers,qty){let p=tiers[0].p;for(const t of tiers)if(qty>=t.m)p=t.p;return p;}
function clientPrice(cl,pid,tiers,qty){if(cl?.prices?.[pid]!=null)return+cl.prices[pid];return tierPrice(tiers,qty);}
function pkgPrice(cl,pkgId,std){if(cl?.pkgPrices?.[pkgId]!=null)return+cl.pkgPrices[pkgId];return std;}

// ── CATALOG ───────────────────────────────────────────────────────────────────
const COSTS={"bh":225,"rhv":220,"hs":235,"rh":125,"rhp":170,"pp24":220,"pp12":195,"vf":340,"sob":10,"gom_f":130,"gom_m":130,"rchv":290,"rhch":290};
const INIT_PRODS=[
  {id:"bh",  name:"Black Horse (24 sobres)",           cat:"Miel",    unit:"caja", spc:24, cost:225, list:1199,tiers:TA,stockCajas:0,stockSobres:0},
  {id:"rhv", name:"Royal Honey VIP (24 sobres)",        cat:"Miel",    unit:"caja", spc:24, cost:220, list:1199,tiers:TA,stockCajas:0,stockSobres:0},
  {id:"hs",  name:"Hard Steel (24 sobres)",             cat:"Miel",    unit:"caja", spc:24, cost:235, list:1199,tiers:TA,stockCajas:0,stockSobres:0},
  {id:"rh",  name:"Royal Honey (12 sobres)",            cat:"Miel",    unit:"caja", spc:12, cost:125, list:999, tiers:TB,stockCajas:0,stockSobres:0},
  {id:"rhp", name:"Royal Honey Platinum (12 sobres)",   cat:"Miel",    unit:"caja", spc:12, cost:170, list:999, tiers:TB,stockCajas:0,stockSobres:0},
  {id:"pp24",name:"Pink Pussycat (24 sobres)",          cat:"Miel",    unit:"caja", spc:24, cost:220, list:1199,tiers:TA,stockCajas:0,stockSobres:0},
  {id:"pp12",name:"Pink Pussycat (12 sobres)",          cat:"Miel",    unit:"caja", spc:12, cost:195, list:999, tiers:TB,stockCajas:0,stockSobres:0},
  {id:"vf",  name:"Vitafer-L (16 sobres)",              cat:"Miel",    unit:"caja", spc:16, cost:340, list:1199,tiers:TA,stockCajas:0,stockSobres:0},
  {id:"sob", name:"Sobre individual",                   cat:"Miel",    unit:"sobre",spc:1,  cost:10,  list:150, tiers:[{m:1,p:150},{m:4,p:125},{m:8,p:100}],stockCajas:0,stockSobres:0},
  {id:"gom_f",name:"Gomitas Bliss Bears (Mujer)",         cat:"Miel",    unit:"caja", spc:1,  cost:130, list:400, tiers:TD,stockCajas:0,stockSobres:0},
  {id:"gom_m",name:"Gomitas Boner Bears (Hombre)",         cat:"Miel",    unit:"caja", spc:1,  cost:130, list:400, tiers:TD,stockCajas:0,stockSobres:0},
  {id:"rchv",name:"Royal Choco VIP (12 chocolates)",    cat:"Miel",    unit:"caja", spc:12, cost:290, list:1250,tiers:TC,stockCajas:0,stockSobres:0},
  {id:"rhch",name:"Rhino Choco (12 sobres)",            cat:"Miel",    unit:"caja", spc:12, cost:290, list:1250,tiers:TC,stockCajas:0,stockSobres:0},
  {id:"cond",name:"Condones + Lubricante",              cat:"SexShop", unit:"kit",  spc:1,  cost:0,   list:55,  tiers:[{m:1,p:55}],stockCajas:0,stockSobres:0},
  {id:"gel", name:"Gel de Masaje Sizzle Lips",          cat:"SexShop", unit:"pieza",spc:1,  cost:0,   list:645, tiers:[{m:1,p:645}],stockCajas:0,stockSobres:0},
  {id:"swn", name:"Swiss Navy Max Size",                cat:"SexShop", unit:"tubo", spc:1,  cost:0,   list:1680,tiers:[{m:1,p:1680}],stockCajas:0,stockSobres:0},
  {id:"lub", name:"Lubricante Love Lub 60g",            cat:"SexShop", unit:"pieza",spc:1,  cost:0,   list:110, tiers:[{m:1,p:110}],stockCajas:0,stockSobres:0},
  {id:"fero",name:"Sey Feromonas",                      cat:"SexShop", unit:"spray",spc:1,  cost:0,   list:420, tiers:[{m:1,p:420}],stockCajas:0,stockSobres:0},
  {id:"obig",name:"Odibo Touch My Big Ass",             cat:"SexShop", unit:"pieza",spc:1,  cost:0,   list:2320,tiers:[{m:1,p:2320}],stockCajas:0,stockSobres:0},
  {id:"vbol",name:"Vibrador Bolsillo Odibo",            cat:"SexShop", unit:"pieza",spc:1,  cost:0,   list:1250,tiers:[{m:1,p:1250}],stockCajas:0,stockSobres:0},
  {id:"cln", name:"Cleaner Antibacterial",              cat:"SexShop", unit:"frasco",spc:1, cost:0,   list:55,  tiers:[{m:1,p:55}],stockCajas:0,stockSobres:0},
  {id:"dms", name:"Dildo Monster Sytry",                cat:"SexShop", unit:"pieza",spc:1,  cost:0,   list:1690,tiers:[{m:1,p:1690}],stockCajas:0,stockSobres:0},
  {id:"vbf", name:"Vibrador Butterfly 10 Func",         cat:"SexShop", unit:"pieza",spc:1,  cost:0,   list:1450,tiers:[{m:1,p:1450}],stockCajas:0,stockSobres:0},
  {id:"dbb", name:'Dildo Big Boy 10"',                  cat:"SexShop", unit:"pieza",spc:1,  cost:0,   list:2105,tiers:[{m:1,p:2105}],stockCajas:0,stockSobres:0},
  {id:"lenc",name:"Lencería / Conjunto",                cat:"SexShop", unit:"pieza",spc:1,  cost:0,   list:380, tiers:[{m:1,p:380}],stockCajas:0,stockSobres:0},
];
const INIT_PKGS=[
  {id:"ini", name:"Paquete Inicial",      price:1849, items:[{pid:"bh",qty:1},{pid:"rhv",qty:1},{pid:"rh",qty:1}]},
  {id:"emp", name:"Paquete Emprendedor",  price:3000, items:[{pid:"bh",qty:2},{pid:"rhv",qty:1},{pid:"rh",qty:1},{pid:"pp24",qty:1}]},
  {id:"dist",name:"Paquete Distribuidor", price:9400, items:[{pid:"bh",qty:5},{pid:"rhv",qty:4},{pid:"rh",qty:5},{pid:"pp24",qty:3},{pid:"hs",qty:3}]},
  {id:"may", name:"Paquete Mayorista",    price:39400,items:[{pid:"bh",qty:20},{pid:"rhv",qty:15},{pid:"rhp",qty:15},{pid:"hs",qty:10},{pid:"pp24",qty:5},{pid:"pp12",qty:10}]},
];
const EXP_CATS=["Gasolina","Repartidores","Importación","Transporte","Almacén","Marketing","Gastos generales","Otro"];
const PAY_METHODS=["Efectivo","SPIN Marcel","SPIN Gustavo","Tercero"];
const PAY_METHODS_LABEL={"Efectivo":"💵 Efectivo","SPIN Marcel":"📱 SPIN Marcel","SPIN Gustavo":"📱 SPIN Gustavo","Tercero":"🤝 Tercero"};
const PAY_CLR={"Efectivo":{bg:"rgba(26,140,90,0.12)",c:"#1A8C5A"},"SPIN Marcel":{bg:"rgba(196,150,42,0.12)",c:"#8B6716"},"SPIN Gustavo":{bg:"rgba(112,56,208,0.12)",c:"#7038D0"},"Tercero":{bg:"rgba(40,96,176,0.12)",c:"#2860B0"}};

// ── THEME ─────────────────────────────────────────────────────────────────────
const T={
  gold:"#C4962A",goldBright:"#E8B84B",goldText:"#6B4E0A",goldBg:"rgba(196,150,42,0.07)",goldBorder:"rgba(196,150,42,0.22)",
  bg:"#FFFFFF",bgCard:"#FDFCF9",bgAlt:"#F8F5EE",bgRow:"#FAFAF6",
  border:"rgba(196,150,42,0.16)",text:"#1C1A16",textSub:"#7A7060",textMuted:"#ADA394",
  revenue:"#C4962A",profit:"#1A8C5A",expense:"#C04040",client:"#2860B0",pkg:"#7038D0",cost:"#9A6020",
};

// ── LOGO ──────────────────────────────────────────────────────────────────────
function Logo({size=36}){
  const r=6.5,W=r*Math.sqrt(3),H=2*r,vs=H*0.75;
  const hex=(cx,cy)=>{const pts=Array.from({length:6},(_,k)=>{const a=Math.PI/180*(60*k-30);return `${(cx+r*Math.cos(a)).toFixed(1)},${(cy+r*Math.sin(a)).toFixed(1)}`;});return `M ${pts.join(" L ")} Z`;};
  const hs=[{cx:W*.5,cy:r,f:"#C4962A"},{cx:W*1.5,cy:r,f:"#D4A830"},{cx:0,cy:r+vs,f:"#B88420"},{cx:W,cy:r+vs,f:"#E8C050"},{cx:W*2,cy:r+vs,f:"#B88420"},{cx:W*.5,cy:r+vs*2,f:"#C4962A"},{cx:W*1.5,cy:r+vs*2,f:"#D4A830"}];
  const vw=W*2+2,vh=r+vs*2+r+1,sc=size/Math.max(vw,vh);
  return <svg width={vw*sc} height={vh*sc} viewBox={`-0.5 -0.5 ${vw+1} ${vh+1}`}>{hs.map((h,i)=><path key={i} d={hex(h.cx,h.cy)} fill={h.f} stroke="#8B6716" strokeWidth="0.4"/>)}</svg>;
}

// ── UI ATOMS ──────────────────────────────────────────────────────────────────
function F({label,children,style}){return <div style={{display:"flex",flexDirection:"column",gap:4,...style}}><label style={{fontSize:11,fontWeight:600,color:T.textSub,letterSpacing:"0.04em"}}>{label}</label>{children}</div>;}
function Card({children,style}){return <div style={{background:T.bgCard,border:`0.5px solid ${T.goldBorder}`,borderRadius:10,padding:"0.875rem 1rem",...style}}>{children}</div>;}
function STitle({children,right}){return <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><p style={{margin:0,fontWeight:600,fontSize:12,color:T.text,letterSpacing:"0.06em",textTransform:"uppercase"}}>{children}</p>{right}</div>;}
function TH({cols}){return <thead><tr style={{background:T.goldBg}}>{cols.map((c,i)=><th key={i} style={{textAlign:"left",padding:"7px 10px",fontWeight:600,color:T.goldText,fontSize:10,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap",borderBottom:`1px solid ${T.goldBorder}`}}>{c}</th>)}</tr></thead>;}
function KCard({label,value,sub,color,icon}){const c=color||T.gold;return <div style={{background:T.bgCard,borderRadius:10,padding:"14px 16px",border:`0.5px solid ${T.goldBorder}`,borderLeft:`3px solid ${c}`}}><div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>{icon&&<i className={"ti "+icon} style={{fontSize:14,color:c}}/>}<p style={{margin:0,fontSize:11,color:T.textSub,fontWeight:500}}>{label}</p></div><p style={{margin:0,fontSize:22,fontWeight:700,color:c}}>{value}</p>{sub&&<p style={{margin:0,fontSize:11,color:T.textMuted,marginTop:2}}>{sub}</p>}</div>;}
function Chip({label,bg,color}){return <span style={{background:bg||T.goldBg,color:color||T.goldText,padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{label}</span>;}
function Empty({icon,text}){return <div style={{textAlign:"center",padding:"2rem",color:T.textMuted}}><i className={"ti "+icon} style={{fontSize:28,display:"block",marginBottom:8}}/><p style={{margin:0,fontSize:13}}>{text}</p></div>;}
function GoldBtn({children,onClick,style}){return <button onClick={onClick} style={{background:T.gold,color:"#fff",border:"none",borderRadius:8,padding:"7px 18px",fontSize:12,fontWeight:600,cursor:"pointer",...style}}>{children}</button>;}
function OutBtn({children,onClick,danger,style}){return <button onClick={onClick} style={{background:"transparent",color:danger?T.expense:T.textSub,border:`1px solid ${danger?"rgba(192,64,64,0.3)":T.border}`,borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",...style}}>{children}</button>;}
function ErrMsg({msg}){if(!msg)return null;return <div style={{background:"rgba(192,64,64,0.1)",border:"1px solid rgba(192,64,64,0.3)",borderRadius:8,padding:"8px 14px",fontSize:12,color:T.expense,display:"flex",alignItems:"center",gap:8,marginTop:6}}><i className="ti ti-alert-circle" style={{fontSize:15}}/>{msg}</div>;}

function pkgCost(pkg,prods){return pkg.items.reduce((s,it)=>{const p=prods.find(x=>x.id===it.pid);return s+(p?p.cost*it.qty:0);},0);}
function pkgDesc(pkg,prods){return pkg.items.map(it=>{const p=prods.find(x=>x.id===it.pid);return it.qty+"× "+(p?p.name:it.pid);}).join(" · ");}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({prods,pkgs,clients,sales,expenses}){
  const now      = new Date();
  const todayStr = now.toISOString().slice(0,10);
  const curMonth = todayStr.slice(0,7);
  const curYear  = todayStr.slice(0,4);

  // KPI helpers
  const calcPeriod=(start,end)=>{
    const ss=sales.filter(s=>s.date>=start&&s.date<=(end||todayStr));
    const rev=ss.reduce((a,s)=>a+s.total,0);
    const cst=ss.reduce((a,s)=>a+s.cost,0);
    const exp=expenses.filter(e=>e.date>=start&&e.date<=(end||todayStr)).reduce((a,e)=>a+e.amount,0);
    return{rev,util:rev-cst,net:rev-cst-exp,count:ss.length};
  };
  const mesData  = calcPeriod(curMonth+"-01");
  const totalData= calcPeriod(curYear+"-01-01");
  const gastosMes= expenses.filter(e=>e.date>=curMonth+"-01"&&e.date<=todayStr).reduce((a,e)=>a+e.amount,0);

  // Monthly chart — all 12 months of current year
  const MONTHS=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const byMonth=MONTHS.map((m,i)=>{
    const mm=String(i+1).padStart(2,"0");
    const start=curYear+"-"+mm+"-01";
    const end  =curYear+"-"+mm+"-31";
    const ss=sales.filter(s=>s.date>=start&&s.date<=end);
    const rev=ss.reduce((a,s)=>a+s.total,0);
    const cst=ss.reduce((a,s)=>a+s.cost,0);
    return{name:m,util:+(rev-cst).toFixed(0),rev:+rev.toFixed(0)};
  });

  // Recent sales
  const recent=[...sales].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,6);

  const nomMes=now.toLocaleDateString("es-MX",{month:"long"}).replace(/^\w/,c=>c.toUpperCase());

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

      {/* ── KPI CARDS ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
        <div style={{background:T.bgCard,borderRadius:12,padding:"16px 18px",border:`0.5px solid ${T.goldBorder}`,borderTop:`3px solid ${T.gold}`}}>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.08em"}}>Ganancias del mes</p>
          <p style={{margin:"0 0 4px",fontSize:28,fontWeight:700,color:T.text}}>{$m(mesData.util)}</p>
          <p style={{margin:0,fontSize:12,color:T.textMuted}}>{nomMes}</p>
        </div>
        <div style={{background:T.bgCard,borderRadius:12,padding:"16px 18px",border:`0.5px solid ${T.goldBorder}`,borderTop:`3px solid ${T.profit}`}}>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.08em"}}>Ganancias totales</p>
          <p style={{margin:"0 0 4px",fontSize:28,fontWeight:700,color:T.text}}>{$m(totalData.util)}</p>
          <p style={{margin:0,fontSize:12,color:T.textMuted}}>Todos los registros</p>
        </div>
        <div style={{background:T.bgCard,borderRadius:12,padding:"16px 18px",border:`0.5px solid ${T.goldBorder}`,borderTop:`3px solid ${T.client}`}}>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.08em"}}>Ventas este mes</p>
          <p style={{margin:"0 0 4px",fontSize:28,fontWeight:700,color:T.text}}>{mesData.count}</p>
          <p style={{margin:0,fontSize:12,color:T.textMuted}}>{nomMes}</p>
        </div>
        <div style={{background:T.bgCard,borderRadius:12,padding:"16px 18px",border:`0.5px solid ${T.goldBorder}`,borderTop:`3px solid ${T.expense}`}}>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.08em"}}>Gastos del mes</p>
          <p style={{margin:"0 0 4px",fontSize:28,fontWeight:700,color:T.text}}>{$m(gastosMes)}</p>
          <p style={{margin:0,fontSize:12,color:T.textMuted}}>Mes actual</p>
        </div>
      </div>

      {/* ── CHART + RECIENTES ── */}
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {/* Gráfica mensual */}
        <Card>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:T.gold,display:"inline-block"}}/>
            <p style={{margin:0,fontWeight:600,fontSize:14,color:T.text}}>Ganancias por mes — {curYear}</p>
          </div>
          <div style={{height:220}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth} margin={{top:20,right:8,left:0,bottom:0}}>
                <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSub}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip
                  formatter={v=>[$m(v),"Utilidad"]}
                  contentStyle={{background:T.bgCard,border:`1px solid ${T.goldBorder}`,borderRadius:8,fontSize:12}}
                  cursor={{fill:"rgba(196,150,42,0.08)"}}
                />
                <Bar dataKey="util" radius={[6,6,0,0]} label={{position:"top",fontSize:10,fill:T.textSub,formatter:v=>v>0?"$"+(v/1000).toFixed(1)+"k":""}}>
                  {byMonth.map((entry,i)=>{
                    const isCurrentMonth=i===now.getMonth();
                    return <Cell key={i} fill={entry.util>0?(isCurrentMonth?T.gold:"#E8C050"):"#E8E0D0"}/>;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Ventas recientes */}
        <Card>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
            <span style={{width:10,height:10,borderRadius:"50%",background:T.expense,display:"inline-block"}}/>
            <p style={{margin:0,fontWeight:600,fontSize:14,color:T.text}}>Ventas recientes</p>
          </div>
          {recent.length===0 ? <Empty icon="ti-shopping-cart" text="Sin ventas registradas"/> : (
            <div style={{display:"flex",flexDirection:"column",gap:2}}>
              {recent.map((s,i)=>{
                const cl=clients.find(c=>c.id===s.clientId);
                const util=s.total-s.cost;
                const fecha=new Date(s.date+"T12:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"});
                return(
                  <div key={s.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 4px",borderBottom:i<recent.length-1?`0.5px solid ${T.border}`:"none"}}>
                    <div>
                      <p style={{margin:"0 0 2px",fontWeight:600,fontSize:13,color:T.text}}>{cl?.name||"Cliente"}</p>
                      <p style={{margin:0,fontSize:11,color:T.textMuted}}>{fecha} · {s.desc?.slice(0,28)}{s.desc?.length>28?"…":""}</p>
                    </div>
                    <p style={{margin:0,fontWeight:700,fontSize:14,color:util>=0?T.profit:T.expense,whiteSpace:"nowrap",marginLeft:12}}>{util>0?$m(util):$m(s.total)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── TABLA MENSUAL + ANUAL ── */}
      {(()=>{
        const anioData=calcPeriod(curYear+"-01-01");
        const Row=({label,data,accent})=>(
          <tr style={{borderBottom:`0.5px solid ${T.border}`}}>
            <td style={{padding:"10px 12px",fontWeight:600,color:T.text,whiteSpace:"nowrap"}}>
              <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:accent,marginRight:8}}/>
              {label}
            </td>
            <td style={{padding:"10px 12px",color:T.textSub,textAlign:"center"}}>{data.count}</td>
            <td style={{padding:"10px 12px",color:T.revenue,fontWeight:600,textAlign:"right",whiteSpace:"nowrap"}}>{$m(data.rev)}</td>
            <td style={{padding:"10px 12px",fontWeight:700,color:data.util>=0?T.profit:T.expense,textAlign:"right",whiteSpace:"nowrap"}}>{$m(data.util)}</td>
          </tr>
        );
        return(
          <Card>
            <STitle>Resumen de ganancias</STitle>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <TH cols={["Período","Ventas","Ingresos","Utilidad"]}/>
                <tbody>
                  <Row label={"Este mes ("+nomMes+")"} data={mesData}  accent={T.gold}/>
                  <Row label={"Este año ("+curYear+")"}  data={anioData} accent={T.profit}/>
                </tbody>
                <tfoot>
                  <tr style={{background:T.goldBg}}>
                    <td style={{padding:"7px 12px",fontSize:10,color:T.textMuted,fontStyle:"italic"}} colSpan={5}>
                      * Utilidad neta descuenta gastos registrados en el período
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}

// ── PRODUCTOS ─────────────────────────────────────────────────────────────────
function Productos({prods,setProds}){
  const[editMode,setEditMode]=useState(false);
  const[costMap,setCostMap]=useState({});
  const cats=[...new Set(prods.map(p=>p.cat))];
  const missing=prods.filter(p=>p.cost===0).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {missing>0 && <div style={{background:T.goldBg,border:`1px solid ${T.goldBorder}`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,fontSize:13,color:T.goldText}}><i className="ti ti-alert-circle" style={{fontSize:18,color:T.gold}}/><span>Faltan costos en <strong>{missing} productos</strong>.</span>{!editMode&&<GoldBtn onClick={()=>{const m={};prods.forEach(p=>m[p.id]=String(p.cost));setCostMap(m);setEditMode(true);}} style={{marginLeft:"auto",fontSize:11}}>Editar costos</GoldBtn>}</div>}
      {cats.map(cat=>(
        <Card key={cat}>
          <STitle right={!editMode&&cat===cats[0]&&<OutBtn onClick={()=>{const m={};prods.forEach(p=>m[p.id]=String(p.cost));setCostMap(m);setEditMode(true);}} style={{fontSize:11}}>Editar costos</OutBtn>}>
            {cat==="Miel"?"Productos en existencia":"Sex Shop"}
          </STitle>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
              <TH cols={["Producto","Contenido","Costo import.","P. lista","Margen lista"]}/>
              <tbody>
                {prods.filter(p=>p.cat===cat).map((p,i)=>{
                  const u=p.list-p.cost;const m=p.list>0?(u/p.list)*100:0;
                  return(
                    <tr key={p.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                      <td style={{padding:"8px 10px",fontWeight:600,color:T.text}}>{p.name}</td>
                      <td style={{padding:"8px 10px",color:T.textSub,fontSize:11}}>{p.spc>1?p.spc+" sobres/caja":p.unit}</td>
                      <td style={{padding:"8px 10px"}}>
                        {editMode ? <input type="number" min="0" step="0.01" value={costMap[p.id]||""} onChange={e=>setCostMap({...costMap,[p.id]:e.target.value})} style={{width:90,fontSize:12}}/> : (p.cost>0?<span style={{color:T.cost,fontWeight:600}}>{$m(p.cost)}</span>:<span style={{color:T.textMuted}}>— pendiente</span>)}
                      </td>
                      <td style={{padding:"8px 10px",color:T.text}}>{$m(p.list)}/{p.unit}</td>
                      <td style={{padding:"8px 10px"}}>{p.cost>0?<span style={{color:m>0?T.profit:T.expense,fontWeight:700}}>{$m(u)} <span style={{fontWeight:400}}>({pct(m)})</span></span>:<span style={{color:T.textMuted,fontSize:11}}>— agregar costo</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {editMode&&cat===cats[cats.length-1]&&(
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <GoldBtn onClick={()=>{setProds(prods.map(p=>({...p,cost:parseFloat(costMap[p.id])||0})));setEditMode(false);}}>Guardar costos</GoldBtn>
              <OutBtn onClick={()=>setEditMode(false)}>Cancelar</OutBtn>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ── PAQUETES ──────────────────────────────────────────────────────────────────
function Paquetes({pkgs,setPkgs,prods}){
  const[editing,setEditing]=useState(null);
  const[form,setForm]=useState({name:"",price:"",items:[{pid:"",qty:1}]});
  const save=()=>{
    if(!form.name.trim()||!form.price)return;
    const items=form.items.filter(i=>i.pid&&+i.qty>0);
    if(editing==="new")setPkgs([...pkgs,{id:uid(),name:form.name,price:+form.price,items}]);
    else setPkgs(pkgs.map(p=>p.id===editing?{...p,name:form.name,price:+form.price,items}:p));
    setEditing(null);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      <Card>
        <STitle right={<OutBtn onClick={()=>{setForm({name:"",price:"",items:[{pid:"",qty:1}]});setEditing("new");}} style={{fontSize:11}}>+ Nuevo paquete</OutBtn>}>Paquetes ({pkgs.length})</STitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
            <TH cols={["Paquete","Contenido","P. venta","Costo","Utilidad","Margen",""]}/>
            <tbody>
              {pkgs.map((pk,i)=>{const c=pkgCost(pk,prods);const u=pk.price-c;const m=pk.price>0?(u/pk.price)*100:0;const ok=c>0;return(
                <tr key={pk.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                  <td style={{padding:"8px 10px",fontWeight:600}}>{pk.name}</td>
                  <td style={{padding:"8px 10px",color:T.textSub,fontSize:11,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pkgDesc(pk,prods)}</td>
                  <td style={{padding:"8px 10px",color:T.revenue,fontWeight:700}}>{$m(pk.price)}</td>
                  <td style={{padding:"8px 10px",color:T.cost}}>{ok?$m(c):"—"}</td>
                  <td style={{padding:"8px 10px",fontWeight:700,color:ok&&u>=0?T.profit:T.textMuted}}>{ok?$m(u):"—"}</td>
                  <td style={{padding:"8px 10px",color:ok&&m>0?T.profit:T.textMuted}}>{ok?pct(m):"—"}</td>
                  <td style={{padding:"8px 10px"}}>
                    <div style={{display:"flex",gap:4}}>
                      <OutBtn onClick={()=>{setForm({name:pk.name,price:String(pk.price),items:pk.items.map(x=>({...x}))});setEditing(pk.id);}} style={{fontSize:11,padding:"4px 8px"}}>✏️</OutBtn>
                      <OutBtn onClick={()=>setPkgs(pkgs.filter(x=>x.id!==pk.id))} danger style={{fontSize:11,padding:"4px 8px"}}>🗑️</OutBtn>
                    </div>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </Card>
      {editing && (
        <Card style={{borderColor:T.gold,borderWidth:1}}>
          <STitle>{editing==="new"?"Nuevo paquete":"Editar paquete"}</STitle>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
            <F label="Nombre"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej. Paquete Emprendedor"/></F>
            <F label="Precio de venta ($)"><input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0.00"/></F>
          </div>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.05em"}}>Contenido</p>
          {form.items.map((it,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-end"}}>
              <F label={i===0?"Producto":""} style={{flex:1}}>
                <select value={it.pid} onChange={e=>{const a=[...form.items];a[i]={...a[i],pid:e.target.value};setForm({...form,items:a});}}>
                  <option value="">Selecciona…</option>
                  {prods.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </F>
              <F label={i===0?"Cant.":""}><input type="number" min="1" value={it.qty} onChange={e=>{const a=[...form.items];a[i]={...a[i],qty:+e.target.value};setForm({...form,items:a});}} style={{width:60}}/></F>
              <OutBtn onClick={()=>setForm({...form,items:form.items.filter((_,j)=>j!==i)})} danger style={{padding:"6px 10px"}}>✕</OutBtn>
            </div>
          ))}
          <OutBtn onClick={()=>setForm({...form,items:[...form.items,{pid:"",qty:1}]})} style={{fontSize:11,marginBottom:12}}>+ Agregar producto</OutBtn>
          <div style={{display:"flex",gap:8}}>
            <GoldBtn onClick={save}>Guardar</GoldBtn>
            <OutBtn onClick={()=>setEditing(null)}>Cancelar</OutBtn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── CLIENTES ──────────────────────────────────────────────────────────────────
function Clientes({clients,setClients,prods,pkgs}){
  const blank={name:"",type:"Menudeo",phone:"",notes:"",prices:{},pkgPrices:{}};
  const[form,setForm]=useState(blank);
  const[editing,setEditing]=useState(null);
  const[showP,setShowP]=useState(false);
  const[confirmDel,setConfirmDel]=useState(null);
  const TYPES=["Menudeo","Mayorista","Exclusivo"];
  const TS={Menudeo:{bg:"rgba(196,150,42,0.10)",c:T.goldText},Mayorista:{bg:"rgba(40,96,176,0.10)",c:T.client},Exclusivo:{bg:"rgba(112,56,208,0.10)",c:T.pkg}};
  const save=()=>{
    if(!form.name.trim())return;
    if(editing)setClients(clients.map(c=>c.id===editing?{...c,...form}:c));
    else setClients([...clients,{...form,id:uid()}]);
    setEditing(null);setForm(blank);setShowP(false);
  };
  const startEdit=c=>{setForm({name:c.name,type:c.type,phone:c.phone||"",notes:c.notes||"",prices:{...c.prices||{}},pkgPrices:{...c.pkgPrices||{}}});setEditing(c.id);setShowP(Object.values(c.prices||{}).some(v=>v)||Object.values(c.pkgPrices||{}).some(v=>v));};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      <Card>
        <STitle>{editing?"Editar cliente":"Agregar cliente"}</STitle>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <F label="Nombre / empresa"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre del cliente"/></F>
          <F label="Tipo"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></F>
          <F label="Teléfono"><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="55 0000 0000"/></F>
          <F label="Notas"><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Zona, condiciones…"/></F>
        </div>
        <button onClick={()=>setShowP(!showP)} style={{marginTop:10,fontSize:11,color:T.gold,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>
          {showP?"▲ Ocultar":"▼ Configurar"} precios especiales
        </button>
        {showP && (
          <div style={{marginTop:10,padding:"12px",background:T.goldBg,borderRadius:10,border:`0.5px solid ${T.goldBorder}`}}>
            <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.goldText,textTransform:"uppercase"}}>Precio especial por producto (vacío = precio lista)</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
              {prods.filter(p=>p.cat==="Miel").map(p=><F key={p.id} label={p.name}><input type="number" min="0" placeholder={"Lista: $"+p.list} value={form.prices[p.id]||""} onChange={e=>setForm({...form,prices:{...form.prices,[p.id]:e.target.value}})}/></F>)}
            </div>
            <p style={{margin:"12px 0 8px",fontSize:11,fontWeight:600,color:T.goldText,textTransform:"uppercase"}}>Precio especial por paquete</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
              {pkgs.map(pk=><F key={pk.id} label={pk.name}><input type="number" min="0" placeholder={"Estándar: $"+pk.price} value={form.pkgPrices[pk.id]||""} onChange={e=>setForm({...form,pkgPrices:{...form.pkgPrices,[pk.id]:e.target.value}})}/></F>)}
            </div>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <GoldBtn onClick={save}>{editing?"Guardar cambios":"Agregar cliente"}</GoldBtn>
          {editing && <OutBtn onClick={()=>{setForm(blank);setEditing(null);setShowP(false);}}>Cancelar</OutBtn>}
        </div>
      </Card>
      <Card>
        <STitle>Clientes ({clients.length})</STitle>
        {clients.length===0 ? <Empty icon="ti-users" text="Agrega tu primer cliente"/> : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",fontSize:12,borderCollapse:"collapse",minWidth:500}}>
              <TH cols={["Cliente","Tipo","Teléfono","Precios especiales","Notas","Acciones"]}/>
              <tbody>
                {clients.map((c,i)=>{
                  const ns=Object.values(c.prices||{}).filter(v=>v).length+Object.values(c.pkgPrices||{}).filter(v=>v).length;
                  const ts=TS[c.type]||{};
                  return(
                    <tr key={c.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                      <td style={{padding:"8px 10px",fontWeight:600}}>{c.name}</td>
                      <td style={{padding:"8px 10px"}}><Chip label={c.type} bg={ts.bg} color={ts.c}/></td>
                      <td style={{padding:"8px 10px",color:T.textSub}}>{c.phone||"—"}</td>
                      <td style={{padding:"8px 10px"}}>{ns>0?<Chip label={ns+" especial"+(ns>1?"es":"")} bg="rgba(26,140,90,0.1)" color={T.profit}/>:<span style={{color:T.textMuted,fontSize:11}}>precio lista</span>}</td>
                      <td style={{padding:"8px 10px",color:T.textSub,fontSize:11}}>{c.notes||"—"}</td>
                      <td style={{padding:"8px 10px"}}>
                        {confirmDel===c.id ? (
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            <span style={{fontSize:11,color:T.expense,fontWeight:600}}>¿Seguro?</span>
                            <button onClick={()=>{setClients(clients.filter(x=>x.id!==c.id));setConfirmDel(null);}} style={{padding:"4px 10px",fontSize:11,background:T.expense,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:600}}>Sí, borrar</button>
                            <button onClick={()=>setConfirmDel(null)} style={{padding:"4px 8px",fontSize:11,background:"transparent",color:T.textSub,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer"}}>No</button>
                          </div>
                        ) : (
                          <div style={{display:"flex",gap:6}}>
                            <button onClick={()=>startEdit(c)} style={{padding:"5px 12px",fontSize:11,background:"rgba(40,96,176,0.1)",color:T.client,border:"1px solid rgba(40,96,176,0.25)",borderRadius:6,cursor:"pointer",fontWeight:500}}>✏️ Editar</button>
                            <button onClick={()=>setConfirmDel(c.id)} style={{padding:"5px 12px",fontSize:11,background:"rgba(192,64,64,0.1)",color:T.expense,border:"1px solid rgba(192,64,64,0.25)",borderRadius:6,cursor:"pointer",fontWeight:500}}>🗑️ Borrar</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}


// ── SEARCHABLE PRODUCT DROPDOWN ───────────────────────────────────────────────
function ProdSearch({prods,value,onChange}){
  const[q,setQ]=useState("");
  const[open,setOpen]=useState(false);
  const sel=prods.find(p=>p.id===value);
  const miel=prods.filter(p=>p.cat==="Miel");
  const sex=prods.filter(p=>p.cat==="SexShop");
  const filter=arr=>q.trim()===""?arr:arr.filter(p=>p.name.toLowerCase().includes(q.toLowerCase()));
  const fm=filter(miel);const fs=filter(sex);
  const pick=pid=>{onChange(pid);setQ("");setOpen(false);};
  return(
    <div>
      <div onClick={()=>setOpen(!open)}
        style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",border:`1.5px solid ${open?T.gold:T.border}`,borderRadius:8,background:T.bg,cursor:"pointer",minHeight:48}}>
        {sel
          ? <span style={{flex:1,fontSize:14,color:T.text,fontWeight:500}}>{sel.name} <span style={{color:T.textMuted,fontWeight:400,fontSize:12}}>· {$m(sel.list)}</span></span>
          : <span style={{flex:1,fontSize:14,color:T.textMuted}}>— Selecciona producto —</span>
        }
        <i className={"ti ti-chevron-"+(open?"up":"down")} style={{fontSize:14,color:T.textMuted,flexShrink:0}}/>
      </div>
      {open && (
        <>
          <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9998}}/>
          <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:9999,background:T.bg,borderRadius:"16px 16px 0 0",boxShadow:"0 -4px 30px rgba(0,0,0,0.2)",maxHeight:"75vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:13,fontWeight:600,color:T.text,flex:1}}>Selecciona producto</span>
              <button onClick={()=>setOpen(false)} style={{border:"none",background:"none",fontSize:20,color:T.textMuted,padding:"0 4px",minHeight:"auto"}}>✕</button>
            </div>
            <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`}}>
              <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
                placeholder="Buscar…" style={{fontSize:16}}
                onClick={e=>e.stopPropagation()}/>
            </div>
            <div style={{overflowY:"auto",flex:1,paddingBottom:20}}>
              {fm.length>0&&(
                <>
                  <div style={{padding:"8px 16px 4px",fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",background:T.bgAlt,position:"sticky",top:0}}>Mieles & Chocolates</div>
                  {fm.map(p=>(
                    <div key={p.id} onClick={()=>pick(p.id)}
                      style={{padding:"14px 16px",fontSize:14,cursor:"pointer",background:value===p.id?T.goldBg:"transparent",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${T.border}`}}>
                      <span style={{fontWeight:value===p.id?600:400,color:value===p.id?T.goldText:T.text}}>{p.name}</span>
                      <span style={{color:T.textMuted,fontSize:12,flexShrink:0,marginLeft:8}}>{$m(p.list)}</span>
                    </div>
                  ))}
                </>
              )}
              {fs.length>0&&(
                <>
                  <div style={{padding:"8px 16px 4px",fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",background:T.bgAlt,position:"sticky",top:0}}>Sex Shop</div>
                  {fs.map(p=>(
                    <div key={p.id} onClick={()=>pick(p.id)}
                      style={{padding:"14px 16px",fontSize:14,cursor:"pointer",background:value===p.id?T.goldBg:"transparent",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`0.5px solid ${T.border}`}}>
                      <span style={{fontWeight:value===p.id?600:400,color:value===p.id?T.goldText:T.text}}>{p.name}</span>
                      <span style={{color:T.textMuted,fontSize:12,flexShrink:0,marginLeft:8}}>{$m(p.list)}</span>
                    </div>
                  ))}
                </>
              )}
              {fm.length===0&&fs.length===0&&<div style={{padding:"20px",fontSize:13,color:T.textMuted,textAlign:"center"}}>Sin resultados</div>}
              {value&&<div onClick={()=>pick("")} style={{padding:"14px 16px",fontSize:13,color:T.expense,cursor:"pointer",textAlign:"center",fontWeight:500}}>✕ Quitar producto</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── NUEVA VENTA ───────────────────────────────────────────────────────────────
function NuevaVenta({prods,setProds,pkgs,clients,setClients,sales,setSales}){
  const[date,setDate]=useState(today());
  const[clientId,setClientId]=useState("");
  const[mode,setMode]=useState("custom");
  const[pkgId,setPkgId]=useState("");
  const[pkgQty,setPkgQty]=useState(1);
  const[pkgOver,setPkgOver]=useState("");
  const[lines,setLines]=useState([{pid:"",qty:1,price:"",su:"caja"}]);
  const[payMethod,setPayMethod]=useState("Efectivo");
  const[envio,setEnvio]=useState("");
  const[envioTipo,setEnvioTipo]=useState("ninguno");
  const[envioDesc,setEnvioDesc]=useState("");
  const[note,setNote]=useState("");
  const[err,setErr]=useState("");
  const[newCl,setNewCl]=useState(null);

  const cl=clients.find(c=>c.id===clientId);
  const selPkg=pkgs.find(p=>p.id===pkgId);
  const pSalePrice=selPkg?pkgPrice(cl,pkgId,selPkg.price):0;
  const effPkgPrice=pkgOver?+pkgOver:pSalePrice;
  const pkgCostU=selPkg?pkgCost(selPkg,prods):0;
  const pkgTotal=effPkgPrice*pkgQty;
  const pkgCostT=pkgCostU*pkgQty;

  const getLP=l=>{if(l.price)return+l.price;if(!l.pid)return 0;const p=prods.find(x=>x.id===l.pid);if(!p)return 0;return clientPrice(cl,l.pid,p.tiers,+l.qty||1);};
  const lineTotal=lines.reduce((s,l)=>s+getLP(l)*(+l.qty||1),0);
  const lineCost=lines.reduce((s,l)=>{const p=prods.find(x=>x.id===l.pid);if(!p)return s;return s+(l.su==="sobre"?p.cost*(+l.qty||1):p.cost*p.spc*(+l.qty||1)/p.spc*(+l.qty||1));},0);
  // simpler lineCost
  const lineCostCalc=lines.reduce((s,l)=>{const p=prods.find(x=>x.id===l.pid);if(!p)return s;const qty=+l.qty||1;return s+p.cost*qty;},0);

  const register=()=>{
    if(!clientId){setErr("Selecciona un cliente");return;}
    let total,cost,desc,items;
    if(mode==="paquete"){
      if(!pkgId){setErr("Selecciona un paquete");return;}
      total=pkgTotal;cost=pkgCostT;
      desc=selPkg.name+" ×"+pkgQty;
      items=(selPkg.items||[]).map(it=>({pid:it.pid,qty:it.qty*pkgQty,su:"caja"}));
    } else {
      const valid=lines.filter(l=>l.pid&&+l.qty>0);
      if(valid.length===0){setErr("Agrega al menos un producto");return;}
      total=lineTotal;cost=lineCostCalc;
      desc=valid.map(l=>{const p=prods.find(x=>x.id===l.pid);return l.qty+"× "+(p?p.name:l.pid);}).join(", ");
      items=valid.map(l=>({pid:l.pid,qty:+l.qty,su:l.su||"caja"}));
    }
    const envioNum=+envio||0;
    const regaloC=envioTipo==="sobres"?(parseInt(envioDesc)||1)*SOBRE_COST:0;
    const sale={id:uid(),date,clientId,pkgId:mode==="paquete"?pkgId:null,total,cost:cost+regaloC,desc,items,note,payMethod,envio:envioNum,envioTipo,envioDesc};
    setSales([...sales,sale]);
    // deduct stock
    setProds(prev=>prev.map(prod=>{
      const si=items.find(it=>it.pid===prod.id);
      if(!si)return prod;
      if((si.su||"caja")==="sobre") return {...prod,stockSobres:Math.max(0,(prod.stockSobres||0)-si.qty)};
      return {...prod,stockCajas:Math.max(0,(prod.stockCajas||0)-si.qty)};
    }));
    setErr("");
    setPkgId("");setPkgQty(1);setPkgOver("");
    setLines([{pid:"",qty:1,price:"",su:"caja"}]);
    setEnvio("");setEnvioTipo("ninguno");setEnvioDesc("");setNote("");
    setPayMethod("Efectivo");setCuenta("");
  };

  const updLine=(i,k,v)=>{
    const ls=[...lines];ls[i]={...ls[i],[k]:v};
    if(k==="pid"&&!ls[i].price){const p=prods.find(x=>x.id===v);if(p)ls[i].price=String(clientPrice(cl,v,p.tiers,+ls[i].qty||1));}
    setLines(ls);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      <Card>
        <STitle>Registrar venta</STitle>
        {/* ROW 1: fecha, modo */}
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:12}}>
          <F label="Fecha"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></F>
          <F label="Modo de venta">
            <div style={{display:"flex",gap:10,paddingTop:6}}>
              {[["paquete","📦 Paquete"],["custom","🛒 Productos"]].map(([v,l])=>(
                <label key={v} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,cursor:"pointer",color:mode===v?T.gold:T.textSub,fontWeight:mode===v?600:400}}>
                  <input type="radio" name="mode" value={v} checked={mode===v} onChange={()=>setMode(v)} style={{accentColor:T.gold}}/>{l}
                </label>
              ))}
            </div>
          </F>
        </div>

        {/* CLIENTE */}
        <div style={{marginBottom:12}}>
          {clientId && !newCl ? (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(26,140,90,0.08)",border:"1px solid rgba(26,140,90,0.25)",borderRadius:10}}>
              <span style={{fontSize:13,fontWeight:600,color:T.profit}}>✓ Cliente seleccionado:</span>
              <span style={{fontSize:13,color:T.text,fontWeight:500}}>{clients.find(c=>c.id===clientId)?.name}</span>
              <Chip label={clients.find(c=>c.id===clientId)?.type||""} bg={T.goldBg} color={T.goldText}/>
              <button onClick={()=>{setClientId("");setErr("");}} style={{marginLeft:"auto",fontSize:11,color:T.expense,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>✕ Cambiar</button>
            </div>
          ) : !newCl ? (
            <F label="Cliente">
              <select value="" onChange={e=>{setErr("");const v=e.target.value;if(v==="__new__"){setNewCl({name:"",type:"Menudeo",phone:""});}else if(v){setClientId(v);}}}>
                <option value="">— Selecciona cliente —</option>
                <option value="__new__" style={{color:T.gold,fontWeight:600}}>➕ Nuevo cliente rápido</option>
                {clients.map(c=><option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </F>
          ) : null}

          {/* NUEVO CLIENTE RÁPIDO */}
          {newCl && (
            <div style={{background:T.goldBg,border:`1px solid ${T.goldBorder}`,borderRadius:10,padding:"14px"}}>
              <p style={{margin:"0 0 12px",fontSize:12,fontWeight:600,color:T.goldText,textTransform:"uppercase",letterSpacing:"0.05em"}}>➕ Datos del nuevo cliente</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <F label="Nombre *"><input value={newCl.name} onChange={e=>setNewCl({...newCl,name:e.target.value})} placeholder="Nombre del cliente" autoFocus/></F>
                <F label="Tipo"><select value={newCl.type} onChange={e=>setNewCl({...newCl,type:e.target.value})}><option>Menudeo</option><option>Mayorista</option><option>Exclusivo</option></select></F>
                <F label="Teléfono"><input value={newCl.phone} onChange={e=>setNewCl({...newCl,phone:e.target.value})} placeholder="Opcional"/></F>
              </div>
              {!newCl.name.trim() && <p style={{margin:"8px 0 0",fontSize:11,color:T.expense}}>⚠ Escribe el nombre del cliente para continuar</p>}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <GoldBtn onClick={()=>{
                  if(!newCl.name.trim())return;
                  const nc={id:uid(),name:newCl.name.trim(),type:newCl.type,phone:newCl.phone||"",notes:"",prices:{},pkgPrices:{}};
                  setClients(prev=>[...prev,nc]);
                  setClientId(nc.id);
                  setNewCl(null);
                  setErr("");
                }}>✓ Guardar y continuar</GoldBtn>
                <OutBtn onClick={()=>{setNewCl(null);}}>Cancelar</OutBtn>
              </div>
            </div>
          )}
        </div>

        {/* PAQUETE */}
        {mode==="paquete" && (
          <div style={{background:T.bgAlt,borderRadius:10,padding:"12px",marginBottom:12,border:`0.5px solid ${T.goldBorder}`}}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <F label="Paquete">
                <select value={pkgId} onChange={e=>{setPkgId(e.target.value);setPkgOver("");setErr("");}}>
                  <option value="">— Selecciona paquete —</option>
                  {pkgs.map(p=><option key={p.id} value={p.id}>{p.name} — {$m(p.price)}</option>)}
                </select>
              </F>
              <F label="Cantidad"><input type="number" min="1" value={pkgQty} onChange={e=>setPkgQty(Math.max(1,+e.target.value))} style={{width:70}}/></F>
              <F label={selPkg?"Precio venta (lista: "+$m(pSalePrice)+")":"Precio venta"}>
                <input type="number" min="0" value={pkgOver} onChange={e=>setPkgOver(e.target.value)} placeholder={selPkg?String(pSalePrice):"0.00"}/>
              </F>
            </div>
            {selPkg && (
              <div style={{marginTop:8,fontSize:11,color:T.textSub}}>
                <span>Incluye: {pkgDesc(selPkg,prods)}</span>
                {pkgCostT>0 && <span style={{marginLeft:12}}>Utilidad: <strong style={{color:T.profit}}>{$m(pkgTotal-pkgCostT)} ({pct((pkgTotal-pkgCostT)/pkgTotal*100)})</strong></span>}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTOS INDIVIDUALES */}
        {mode==="custom" && (
          <div style={{background:T.bgAlt,borderRadius:10,padding:"12px",marginBottom:12,border:`0.5px solid ${T.goldBorder}`}}>
            {lines.map((l,i)=>{
              const p=prods.find(x=>x.id===l.pid);
              const up=getLP(l);
              const ut=up*(+l.qty||1)-(p?p.cost*(+l.qty||1):0);
              return(
                <div key={i} style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12,padding:"10px",background:"rgba(196,150,42,0.04)",borderRadius:8,border:"0.5px solid rgba(196,150,42,0.15)"}}>
                  <F label={i===0?"Producto":""} style={{width:"100%",position:"relative"}}>
                    <ProdSearch
                      prods={prods}
                      value={l.pid}
                      onChange={pid=>updLine(i,"pid",pid)}
                    />
                  </F>
                  {p && p.spc>1 && (
                    <F label={i===0?"Unidad":""}>
                      <select value={l.su||"caja"} onChange={e=>updLine(i,"su",e.target.value)} style={{width:80}}>
                        <option value="caja">Caja</option>
                        <option value="sobre">Sobre</option>
                      </select>
                    </F>
                  )}
                  <F label={i===0?"Cantidad":""}>
                    <input type="number" min="0.1" step="0.1" value={l.qty} onChange={e=>updLine(i,"qty",e.target.value)} style={{width:65}}/>
                  </F>
                  <F label={i===0?("Precio"+(p&&cl?.prices?.[l.pid]?" (especial)":p?" (lista $"+p.list+")":"")):""}>
                    <input type="number" min="0" value={l.price} onChange={e=>updLine(i,"price",e.target.value)} placeholder={p?String(clientPrice(cl,l.pid,p.tiers,+l.qty||1)):"0"} style={{width:90}}/>
                  </F>
                  {p && p.cost>0 && <div style={{paddingBottom:6,fontSize:11,fontWeight:600,color:ut>=0?T.profit:T.expense,whiteSpace:"nowrap"}}>{$m(ut)}</div>}
                  <OutBtn onClick={()=>setLines(lines.filter((_,j)=>j!==i))} danger style={{padding:"10px 14px",fontSize:14,alignSelf:"flex-end"}}>✕ Quitar</OutBtn>
                </div>
              );
            })}
            <OutBtn onClick={()=>setLines([...lines,{pid:"",qty:1,price:"",su:"caja"}])} style={{fontSize:11}}>+ Agregar producto</OutBtn>
            {lineTotal>0 && (
              <div style={{marginTop:10,padding:"8px 12px",background:T.goldBg,borderRadius:8,fontSize:12,display:"flex",gap:20,flexWrap:"wrap"}}>
                <span style={{color:T.textSub}}>Total: <strong style={{color:T.revenue}}>{$m(lineTotal)}</strong></span>
                {lineCostCalc>0 && <span style={{color:T.textSub}}>Utilidad: <strong style={{color:lineTotal-lineCostCalc>=0?T.profit:T.expense}}>{$m(lineTotal-lineCostCalc)} ({pct((lineTotal-lineCostCalc)/lineTotal*100)})</strong></span>}
              </div>
            )}
          </div>
        )}

        {/* PAGO Y ENVÍO */}
        <div style={{borderTop:`1px solid ${T.goldBorder}`,paddingTop:12,marginTop:4,display:"flex",flexWrap:"wrap",gap:10}}>
          <F label="¿Cómo pagó?">
            <select value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
              {PAY_METHODS.map(m=><option key={m} value={m}>{PAY_METHODS_LABEL[m]||m}</option>)}
            </select>
          </F>

          <F label="Cobro de envío ($)">
            <input type="number" min="0" value={envio} onChange={e=>setEnvio(e.target.value)} placeholder="0 = sin envío"/>
          </F>
          {+envio>0 && (
            <F label="Descuento en envío">
              <select value={envioTipo} onChange={e=>setEnvioTipo(e.target.value)}>
                <option value="ninguno">Sin descuento</option>
                <option value="mitad">Mitad de regreso</option>
                <option value="sobres">Sobres de regalo</option>
              </select>
            </F>
          )}
          {+envio>0 && envioTipo!=="ninguno" && (
            <F label={envioTipo==="mitad"?"Nota del descuento":"¿Qué sobres de regalo?"}>
              <input value={envioDesc} onChange={e=>setEnvioDesc(e.target.value)} placeholder={envioTipo==="mitad"?"Ej. regresé $60":"Ej. 2 sobres BH"}/>
            </F>
          )}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:12}}>
          <F label="Nota interna (opcional)" style={{flex:1}}>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Observaciones…"/>
          </F>
          <GoldBtn onClick={register} style={{padding:"9px 24px",fontSize:13}}>
            ✓ Registrar venta
          </GoldBtn>
        </div>
        <ErrMsg msg={err}/>
      </Card>

      {/* HISTORIAL */}
      <Card>
        <STitle>Historial de ventas ({sales.length})</STitle>
        {sales.length===0 ? <Empty icon="ti-shopping-cart" text="Sin ventas registradas"/> : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",fontSize:12,borderCollapse:"collapse",minWidth:580}}>
              <TH cols={["Fecha","Cliente","Descripción","Cobro","Ingresos","Envío","Utilidad","Margen",""]}/>
              <tbody>
                {[...sales].sort((a,b)=>b.date.localeCompare(a.date)).map((s,i)=>{
                  const c=clients.find(x=>x.id===s.clientId);
                  const u=s.total-s.cost;const m=s.total>0?(u/s.total)*100:0;
                  const label=s.payMethod;
                  const pc=PAY_CLR[s.payMethod]||{};
                  return(
                    <tr key={s.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                      <td style={{padding:"6px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{s.date}</td>
                      <td style={{padding:"6px 10px",fontWeight:500,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c?.name||"—"}</td>
                      <td style={{padding:"6px 10px",color:T.textSub,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.desc}</td>
                      <td style={{padding:"6px 10px"}}>{label&&<Chip label={label} bg={pc.bg} color={pc.c}/>}</td>
                      <td style={{padding:"6px 10px",fontWeight:600,color:T.revenue,whiteSpace:"nowrap"}}>{$m(s.total)}</td>
                      <td style={{padding:"6px 10px",color:T.client,whiteSpace:"nowrap"}}>{(s.envio||0)>0?$m(s.envio):"—"}</td>
                      <td style={{padding:"6px 10px",fontWeight:700,color:u>=0?T.profit:T.expense,whiteSpace:"nowrap"}}>{s.cost>0?$m(u):"—"}</td>
                      <td style={{padding:"6px 10px",color:m>0?T.profit:T.expense,whiteSpace:"nowrap"}}>{s.cost>0?pct(m):"—"}</td>
                      <td style={{padding:"6px 10px"}}>
                        <OutBtn onClick={()=>setSales(sales.filter(x=>x.id!==s.id))} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── GASTOS ────────────────────────────────────────────────────────────────────
function Gastos({expenses,setExpenses}){
  const blank={date:today(),cat:"Importación",amount:"",desc:""};
  const[form,setForm]=useState(blank);
  const total=expenses.reduce((s,e)=>s+e.amount,0);
  const EXP_CLR=["#C4962A","#1A8C5A","#2860B0","#C04040","#7038D0","#9A6020"];
  const byCat=EXP_CATS.map((c,i)=>({name:c,v:+expenses.filter(e=>e.cat===c).reduce((s,e)=>s+e.amount,0).toFixed(0),fill:EXP_CLR[i]})).filter(x=>x.v>0);
  const save=()=>{if(!form.amount||!form.desc.trim())return;setExpenses([...expenses,{...form,id:uid(),amount:+form.amount}]);setForm({...blank,date:form.date,cat:form.cat});};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      <Card>
        <STitle>Registrar gasto</STitle>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <F label="Fecha"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></F>
          <F label="Categoría"><select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select></F>
          <F label="Monto ($)"><input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></F>
          <F label="Descripción"><input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Detalle del gasto"/></F>
        </div>
        <GoldBtn onClick={save} style={{marginTop:12}}>Registrar gasto</GoldBtn>
      </Card>
      {byCat.length>0 && (
        <Card>
          <STitle right={<span style={{fontSize:14,fontWeight:700,color:T.expense}}>{$m(total)}</span>}>Gastos por categoría</STitle>
          <div style={{height:160}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCat} margin={{top:4,right:4,left:0,bottom:0}}>
                <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSub}}/>
                <YAxis tick={{fontSize:10,fill:T.textSub}} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"k"} width={42}/>
                <Tooltip formatter={v=>[$m(v),"Gasto"]} contentStyle={{background:T.bgCard,border:`1px solid ${T.goldBorder}`,borderRadius:8,fontSize:12}}/>
                <Bar dataKey="v" radius={[5,5,0,0]}>{byCat.map((e,i)=><Cell key={i} fill={e.fill}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
      <Card>
        <STitle>Historial ({expenses.length})</STitle>
        {expenses.length===0 ? <Empty icon="ti-wallet" text="Sin gastos registrados"/> : (
          <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
            <TH cols={["Fecha","Categoría","Descripción","Monto",""]}/>
            <tbody>
              {[...expenses].sort((a,b)=>b.date.localeCompare(a.date)).map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                  <td style={{padding:"7px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{e.date}</td>
                  <td style={{padding:"7px 10px"}}><Chip label={e.cat} bg="rgba(192,64,64,0.1)" color={T.expense}/></td>
                  <td style={{padding:"7px 10px"}}>{e.desc}</td>
                  <td style={{padding:"7px 10px",fontWeight:700,color:T.expense,whiteSpace:"nowrap"}}>{$m(e.amount)}</td>
                  <td style={{padding:"7px 10px"}}><OutBtn onClick={()=>setExpenses(expenses.filter(x=>x.id!==e.id))} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ── INVENTARIO ────────────────────────────────────────────────────────────────
function Inventario({prods,setProds,sales,stockMoves,setStockMoves}){
  const[entForm,setEntForm]=useState({date:today(),pid:"",cajas:"",note:""});
  const[editingStock,setEditingStock]=useState(null);
  const[editVals,setEditVals]=useState({cajas:"",sobres:""});
  const[abrirForm,setAbrirForm]=useState({pid:"",cajas:1});
  const[invErr,setInvErr]=useState("");
  const[physCajas,setPhysCajas]=useState({});
  const[physSobres,setPhysSobres]=useState({});
  const mielProds=prods.filter(p=>p.cat==="Miel"&&(p.spc||1)>1);
  const otherProds=prods.filter(p=>p.cat!=="Miel"||(p.spc||1)===1);

  const addEntrada=()=>{
    if(!entForm.pid||!entForm.cajas||+entForm.cajas<=0)return;
    const qty=+entForm.cajas;
    setProds(prods.map(p=>p.id===entForm.pid?{...p,stockCajas:(p.stockCajas||0)+qty}:p));
    setStockMoves([...stockMoves,{id:uid(),date:entForm.date,pid:entForm.pid,type:"entrada",cajas:qty,note:entForm.note||"+"+qty+" cajas"}]);
    setEntForm({date:today(),pid:"",cajas:"",note:""});
  };

  const abrirCaja=()=>{
    const prod=prods.find(p=>p.id===abrirForm.pid);
    if(!prod||!abrirForm.cajas||+abrirForm.cajas<=0)return;
    const qty=+abrirForm.cajas;
    if((prod.stockCajas||0)<qty){setInvErr("Solo tienes "+(prod.stockCajas||0)+" cajas de "+prod.name);return;}
    const nuevos=qty*(prod.spc||1);
    setProds(prods.map(p=>p.id===abrirForm.pid?{...p,stockCajas:(p.stockCajas||0)-qty,stockSobres:(p.stockSobres||0)+nuevos}:p));
    setStockMoves([...stockMoves,{id:uid(),date:today(),pid:abrirForm.pid,type:"apertura",cajas:qty,sobres:nuevos,note:"Apertura menudeo: "+qty+" caja"+(qty>1?"s":"")+" → "+nuevos+" sobres"}]);
    setInvErr("");setAbrirForm({pid:"",cajas:1});
  };

  const[bulkMap,setBulkMap]=useState({});
  const[bulkMapSobres,setBulkMapSobres]=useState({});
  const[showBulk,setShowBulk]=useState(true);
  const[confirmReset,setConfirmReset]=useState(false);

  const saveBulk=()=>{
    const entriesCajas=Object.entries(bulkMap).filter(([,v])=>+v>0);
    const entriesSobres=Object.entries(bulkMapSobres).filter(([,v])=>+v>0);
    if(entriesCajas.length===0&&entriesSobres.length===0)return;
    const newMoves=[];
    setProds(prods.map(p=>{
      const cajas=+bulkMap[p.id]||0;
      const sobres=+bulkMapSobres[p.id]||0;
      if(cajas>0)newMoves.push({id:uid(),date:today(),pid:p.id,type:"entrada",cajas,note:"Carga de stock: "+cajas+" cajas"});
      if(sobres>0)newMoves.push({id:uid(),date:today(),pid:p.id,type:"apertura",cajas:0,sobres,note:"Carga de sobres sueltos: "+sobres});
      return {...p,
        stockCajas:(p.stockCajas||0)+cajas,
        stockSobres:(p.stockSobres||0)+sobres
      };
    }));
    setStockMoves([...stockMoves,...newMoves]);
    setBulkMap({});
    setBulkMapSobres({});
  };

  const resetStock=()=>{
    setProds(prods.map(p=>({...p,stockCajas:0,stockSobres:0})));
    setStockMoves([]);
    setConfirmReset(false);setBulkMapSobres({});
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

      {/* ── STOCK EN MASA ── */}
      <Card style={{borderColor:T.gold,borderWidth:1}}>
        <STitle right={
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {confirmReset?(
              <>
                <span style={{fontSize:11,color:T.expense,fontWeight:600}}>¿Resetear todo a cero?</span>
                <button onClick={resetStock} style={{padding:"4px 12px",fontSize:11,background:T.expense,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:600}}>Sí, resetear</button>
                <button onClick={()=>setConfirmReset(false)} style={{padding:"4px 10px",fontSize:11,background:"transparent",color:T.textSub,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer"}}>No</button>
              </>
            ):(
              <OutBtn onClick={()=>setConfirmReset(true)} danger style={{fontSize:11}}>🗑️ Resetear todo a cero</OutBtn>
            )}
            <button onClick={()=>setShowBulk(!showBulk)} style={{fontSize:11,color:T.textSub,background:"none",border:"none",cursor:"pointer"}}>{showBulk?"▲ Ocultar":"▼ Cargar stock"}</button>
          </div>
        }>
          Cargar / actualizar stock
        </STitle>
        {showBulk && (
          <>
            <p style={{margin:"0 0 12px",fontSize:12,color:T.textSub}}>
              Escribe cuántas cajas quieres <strong>agregar</strong> a cada producto. El número se suma al stock actual.
            </p>
            <p style={{margin:"0 0 4px",fontSize:11,color:T.textMuted}}>
              📦 <strong>Cajas</strong> = cajas selladas · 🔓 <strong>Sobres</strong> = sobres sueltos que ya tienes abiertos
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {prods.filter(p=>p.cat==="Miel"&&p.id!=="sob").map(p=>(
                <div key={p.id} style={{background:T.bgAlt,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.border}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
                    <div>
                      <p style={{margin:"0 0 2px",fontSize:13,fontWeight:600,color:T.text}}>{p.name}</p>
                      <p style={{margin:0,fontSize:11,color:T.textMuted}}>{p.spc>1?p.spc+" sobres/caja":p.unit}</p>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {(p.stockCajas||0)>0&&<Chip label={(p.stockCajas||0)+" cajas"} bg={T.goldBg} color={T.goldText}/>}
                      {(p.stockSobres||0)>0&&<Chip label={(p.stockSobres||0)+" sobres"} bg="rgba(40,96,176,0.1)" color={T.client}/>}
                      {(p.stockCajas||0)===0&&(p.stockSobres||0)===0&&<Chip label="Sin stock" bg="rgba(192,64,64,0.08)" color={T.expense}/>}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:p.spc>1?"1fr 1fr":"1fr",gap:10}}>
                    <F label={"📦 Cajas"+(p.spc>1?" ("+p.spc+" sobres c/u)":"")}>
                      <input type="number" min="0" step="1"
                        value={bulkMap[p.id]||""}
                        onChange={e=>setBulkMap({...bulkMap,[p.id]:e.target.value})}
                        placeholder="0"
                        style={{textAlign:"center",fontWeight:700,fontSize:18}}/>
                    </F>
                    {p.spc>1&&(
                      <F label="🔓 Sobres sueltos">
                        <input type="number" min="0" step="1"
                          value={bulkMapSobres[p.id]||""}
                          onChange={e=>setBulkMapSobres({...bulkMapSobres,[p.id]:e.target.value})}
                          placeholder="0"
                          style={{textAlign:"center",fontWeight:700,fontSize:18}}/>
                      </F>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {(Object.values(bulkMap).some(v=>+v>0)||Object.values(bulkMapSobres).some(v=>+v>0))&&(
              <div style={{marginBottom:12,padding:"10px 14px",background:T.goldBg,borderRadius:8,fontSize:12,color:T.goldText,lineHeight:1.8}}>
                <strong>Se agregarán:</strong><br/>
                {[...Object.entries(bulkMap).filter(([,v])=>+v>0).map(([pid,v])=>{const p=prods.find(x=>x.id===pid);return "📦 "+v+" caja"+(+v!==1?"s":"")+" de "+(p?.name||pid);}),
                  ...Object.entries(bulkMapSobres).filter(([,v])=>+v>0).map(([pid,v])=>{const p=prods.find(x=>x.id===pid);return "🔓 "+v+" sobre"+(+v!==1?"s":"")+" suelto"+(+v!==1?"s":"")+" de "+(p?.name||pid);})
                ].join(" · ")}
              </div>
            )}
            <GoldBtn onClick={saveBulk} style={{fontSize:13,padding:"9px 24px"}}>📦 Guardar stock</GoldBtn>
          </>
        )}
      </Card>

      <Card>
        <STitle right={<span style={{fontSize:11,color:T.textMuted}}>🛡️ Conteo físico activa el control anti-robo</span>}>Inventario en cajas</STitle>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:650,fontSize:12}}>
            <TH cols={["Producto","Cajas selladas","Sobres menudeo","Vendido","Conteo físico (cajas · sobres)","Diferencia",""]}/>
            <tbody>
              {mielProds.map((p,idx)=>{
                const spc=p.spc||1;
                const cajas=p.stockCajas||0;
                const sobres=p.stockSobres||0;
                const soldC=sales.reduce((s,sl)=>{const it=sl.items?.find(i=>i.pid===p.id&&(i.su||"caja")==="caja");return s+(it?+it.qty:0);},0);
                const soldS=sales.reduce((s,sl)=>{const it=sl.items?.find(i=>i.pid===p.id&&i.su==="sobre");return s+(it?+it.qty:0);},0);
                const pC=physCajas[p.id]!==undefined?parseInt(physCajas[p.id])||0:null;
                const pS=physSobres[p.id]!==undefined?parseInt(physSobres[p.id])||0:null;
                const dC=pC!==null?pC-cajas:null;
                const dS=pS!==null?pS-sobres:null;
                const hasDiff=(dC!==null&&dC!==0)||(dS!==null&&dS!==0);
                const dc=d=>d===0?T.profit:d<0?T.expense:T.client;
                return(
                  <tr key={p.id} style={{background:hasDiff?"rgba(192,64,64,0.04)":idx%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                    <td style={{padding:"9px 10px",fontWeight:600,color:T.text}}>{p.name}<div style={{fontSize:10,color:T.textMuted,fontWeight:400}}>{spc} sobres/caja</div></td>
                    <td style={{padding:"9px 10px",textAlign:"center"}}><span style={{fontSize:18,fontWeight:700,color:cajas<=0?T.expense:cajas<=2?"#E88020":T.profit}}>{cajas}</span><div style={{fontSize:10,color:T.textMuted}}>cajas</div></td>
                    <td style={{padding:"9px 10px",textAlign:"center"}}>{sobres>0?<span style={{fontSize:18,fontWeight:700,color:T.client}}>{sobres}<div style={{fontSize:10,color:T.textMuted,fontWeight:400}}>sobres</div></span>:<span style={{color:T.textMuted}}>—</span>}</td>
                    <td style={{padding:"9px 10px",fontSize:11,color:T.textSub}}>{soldC>0&&<div>{soldC} caja{soldC!==1?"s":""}</div>}{soldS>0&&<div style={{color:T.client}}>{soldS} sobre{soldS!==1?"s":""}</div>}{soldC===0&&soldS===0&&"—"}</td>
                    <td style={{padding:"9px 10px"}}>
                      <div style={{display:"flex",gap:4}}>
                        <input type="number" min="0" placeholder="Cajas" value={physCajas[p.id]!==undefined?physCajas[p.id]:""} onChange={e=>setPhysCajas({...physCajas,[p.id]:e.target.value})} style={{width:58,fontSize:11}}/>
                        <input type="number" min="0" placeholder="Sobres" value={physSobres[p.id]!==undefined?physSobres[p.id]:""} onChange={e=>setPhysSobres({...physSobres,[p.id]:e.target.value})} style={{width:58,fontSize:11}}/>
                      </div>
                    </td>
                    <td style={{padding:"9px 10px",fontSize:12}}>
                      {(dC!==null||dS!==null)?(
                        <div>
                          {dC!==null&&<div style={{fontWeight:600,color:dc(dC)}}>{dC===0?"✓ cajas OK":dC<0?dC+" cajas ⚠":"+"+dC+" cajas"}</div>}
                          {dS!==null&&<div style={{fontWeight:600,color:dc(dS)}}>{dS===0?"✓ sobres OK":dS<0?dS+" sobres ⚠":"+"+dS+" sobres"}</div>}
                          {hasDiff&&(()=>{const tot=(dC||0)*p.list+(dS||0)*(p.list/(spc||1));return <div style={{fontSize:10,color:tot<0?T.expense:T.client}}>{tot<0?"−":"+"}{$m(Math.abs(tot))} en valor</div>;})()}
                        </div>
                      ):<span style={{color:T.textMuted}}>sin conteo</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <STitle>Abrir caja para menudeo</STitle>
        <p style={{margin:"0 0 12px",fontSize:12,color:T.textSub}}>Descuenta cajas selladas y agrega los sobres al stock de menudeo.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"flex-end"}}>
          <F label="Producto">
            <select value={abrirForm.pid} onChange={e=>{setInvErr("");setAbrirForm({...abrirForm,pid:e.target.value});}}>
              <option value="">Selecciona…</option>
              {mielProds.map(p=><option key={p.id} value={p.id} disabled={(p.stockCajas||0)===0}>{p.name} — {p.stockCajas||0} cajas</option>)}
            </select>
          </F>
          <F label="Cajas a abrir">
            <input type="number" min="1" value={abrirForm.cajas} onChange={e=>setAbrirForm({...abrirForm,cajas:e.target.value})} style={{width:80}}/>
          </F>
          <div>
            {abrirForm.pid&&+abrirForm.cajas>0&&(()=>{const prod=prods.find(p=>p.id===abrirForm.pid);const s=(+abrirForm.cajas||0)*(prod?.spc||1);return <div style={{fontSize:12,color:T.textSub,marginBottom:6}}>= <strong style={{color:T.client}}>{s} sobres</strong></div>;})()}
            <GoldBtn onClick={abrirCaja} style={{width:"100%"}}>🔓 Abrir para menudeo</GoldBtn>
          </div>
        </div>
        <ErrMsg msg={invErr}/>
      </Card>

      <Card>
        <STitle>Registrar entrada de mercancía</STitle>
        <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"flex-end"}}>
          <F label="Producto">
            <select value={entForm.pid} onChange={e=>setEntForm({...entForm,pid:e.target.value})}>
              <option value="">Selecciona…</option>
              {prods.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </F>
          <F label="Cajas recibidas"><input type="number" min="1" value={entForm.cajas} onChange={e=>setEntForm({...entForm,cajas:e.target.value})} placeholder="0"/></F>
          <F label="Fecha"><input type="date" value={entForm.date} onChange={e=>setEntForm({...entForm,date:e.target.value})}/></F>
          <F label="Nota (factura, proveedor…)"><input value={entForm.note} onChange={e=>setEntForm({...entForm,note:e.target.value})} placeholder="Opcional"/></F>
        </div>
        {entForm.pid&&+entForm.cajas>0&&(()=>{const prod=prods.find(p=>p.id===entForm.pid);return <div style={{marginTop:8,padding:"8px 12px",background:T.goldBg,borderRadius:8,fontSize:12,color:T.goldText}}>Stock actual: <strong>{prod?.stockCajas||0}</strong> → Nuevo total: <strong style={{color:T.profit}}>{(prod?.stockCajas||0)+(+entForm.cajas||0)} cajas</strong></div>;})()}
        <GoldBtn onClick={addEntrada} style={{marginTop:12}}>📦 Registrar entrada</GoldBtn>
      </Card>

      {stockMoves.length>0 && (
        <Card>
          <STitle>Historial de movimientos ({stockMoves.length})</STitle>
          <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
            <TH cols={["Fecha","Tipo","Producto","Cantidad","Nota",""]}/>
            <tbody>
              {[...stockMoves].sort((a,b)=>b.date.localeCompare(a.date)).map((m,i)=>{
                const prod=prods.find(p=>p.id===m.pid);
                const isE=m.type==="entrada",isA=m.type==="apertura",isJ=m.type==="ajuste";
                return(
                  <tr key={m.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                    <td style={{padding:"7px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{m.date}</td>
                    <td style={{padding:"7px 10px"}}><Chip label={isE?"Entrada":isA?"Apertura menudeo":isJ?"✏️ Ajuste manual":"Otro"} bg={isE?"rgba(26,140,90,0.1)":isA?"rgba(40,96,176,0.1)":T.goldBg} color={isE?T.profit:isA?T.client:isJ?"#E88020":T.gold}/></td>
                    <td style={{padding:"7px 10px",fontWeight:500}}>{prod?.name||m.pid}</td>
                    <td style={{padding:"7px 10px",color:isE?T.profit:T.client,fontWeight:600}}>{isE?"+"+m.cajas+" caja"+(m.cajas!==1?"s":""):isA?"−"+m.cajas+"c → +"+m.sobres+"s":isJ?"Cajas: "+(m.cajas>=0?"+":"")+m.cajas+" · Sobres: "+(m.sobres>=0?"+":"")+m.sobres:""}</td>
                    <td style={{padding:"7px 10px",color:T.textSub,fontSize:11}}>{m.note}</td>
                    <td style={{padding:"7px 10px"}}>
                      <OutBtn onClick={()=>{
                        if(isE)setProds(prods.map(p=>p.id===m.pid?{...p,stockCajas:Math.max(0,(p.stockCajas||0)-m.cajas)}:p));
                        if(isA)setProds(prods.map(p=>p.id===m.pid?{...p,stockCajas:(p.stockCajas||0)+m.cajas,stockSobres:Math.max(0,(p.stockSobres||0)-m.sobres)}:p));
                        setStockMoves(stockMoves.filter(x=>x.id!==m.id));
                      }} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── CORTE DE CAJA ─────────────────────────────────────────────────────────────
function CorteCaja({sales,expenses,extras=[],setExtras}){
  const[period,setPeriod]=useState("semana");
  const[refDate,setRefDate]=useState(today());
  const[exForm,setExForm]=useState({date:today(),amount:"",desc:"",socio:"Marcel",tipo:"utilidad"});
  const getRange=()=>{
    const d=new Date(refDate+"T12:00:00");
    if(period==="dia")return{start:refDate,end:refDate,label:refDate};
    if(period==="semana"){const day=d.getDay();const mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:day-1));const sun=new Date(mon);sun.setDate(mon.getDate()+6);return{start:mon.toISOString().slice(0,10),end:sun.toISOString().slice(0,10),label:"Sem "+mon.toLocaleDateString("es-MX",{day:"2-digit",month:"short"})+" – "+sun.toLocaleDateString("es-MX",{day:"2-digit",month:"short"})};}
    const m=refDate.slice(0,7);return{start:m+"-01",end:m+"-31",label:new Date(refDate+"T12:00:00").toLocaleDateString("es-MX",{month:"long",year:"numeric"})};
  };
  const range=getRange();
  const fSales=sales.filter(s=>s.date>=range.start&&s.date<=range.end);
  const fExp=expenses.filter(e=>e.date>=range.start&&e.date<=range.end);
  const rev=fSales.reduce((s,v)=>s+v.total,0);
  const envTotal=fSales.reduce((s,v)=>s+(v.envio||0),0);
  const gastos=fExp.reduce((s,e)=>s+e.amount,0);
  const byMethod=PAY_METHODS.map(m=>{const direct=fSales.filter(s=>s.payMethod===m);const total=direct.reduce((a,s)=>a+s.total,0);const pc=PAY_CLR[m]||{};return{method:m,total,count:direct.length,env:direct.reduce((a,s)=>a+(s.envio||0),0),bg:pc.bg,c:pc.c};});
  const DAYS=["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const byDay=DAYS.map((d,i)=>{const dn=(i+1)%7;const ds=fSales.filter(s=>{const w=new Date(s.date+"T12:00:00").getDay();return w===dn||(i===6&&w===0);});return{day:d,total:ds.reduce((a,s)=>a+s.total,0),util:ds.reduce((a,s)=>a+s.total-s.cost,0),count:ds.length};});
  const sinMetodo=fSales.filter(s=>!s.payMethod).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      <Card>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:4}}>
            {[["dia","Día"],["semana","Semana"],["mes","Mes"]].map(([v,l])=>(
              <button key={v} onClick={()=>setPeriod(v)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${period===v?T.gold:T.border}`,background:period===v?T.gold:"transparent",color:period===v?"#fff":T.textSub,fontSize:12,fontWeight:period===v?600:400,cursor:"pointer"}}>{l}</button>
            ))}
          </div>
          <input type="date" value={refDate} onChange={e=>setRefDate(e.target.value)} style={{fontSize:12,padding:"5px 10px"}}/>
          <span style={{fontSize:13,fontWeight:600,color:T.gold}}>{range.label}</span>
        </div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
        <KCard icon="ti-trending-up" label="Ingresos" value={$m(rev)} color={T.revenue}/>
        <KCard icon="ti-motorbike"   label="Envíos cobrados" value={$m(envTotal)} color={T.client}/>
        <KCard icon="ti-wallet"      label="Gastos" value={$m(gastos)} color={T.expense}/>
        <KCard icon="ti-sparkles"    label="Utilidad estimada" value={$m(rev-gastos)} color={rev-gastos>=0?T.profit:T.expense}/>
      </div>
      {sinMetodo>0 && <div style={{background:"rgba(192,64,64,0.08)",border:"1px solid rgba(192,64,64,0.25)",borderRadius:10,padding:"10px 16px",fontSize:13,color:T.expense,display:"flex",gap:8,alignItems:"center"}}><i className="ti ti-alert-triangle" style={{fontSize:18}}/><strong>{sinMetodo} venta{sinMetodo>1?"s":""}</strong> sin forma de pago. Ve a Ventas y corrígelas.</div>}
      <Card>
        <STitle>Desglose por forma de cobro</STitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
          {byMethod.map(bm=>(
            <div key={bm.method} style={{background:bm.bg||T.goldBg,borderRadius:10,padding:"14px 16px",border:`0.5px solid ${bm.c||T.gold}30`}}>
              <p style={{margin:"0 0 6px",fontWeight:700,fontSize:13,color:bm.c||T.gold}}>{bm.method} <span style={{fontWeight:400,fontSize:11,color:T.textMuted}}>({bm.count} venta{bm.count!==1?"s":""})</span></p>
              <p style={{margin:0,fontSize:22,fontWeight:700,color:bm.c||T.gold}}>{$m(bm.total)}</p>
              {bm.env>0 && <p style={{margin:"4px 0 0",fontSize:11,color:T.textSub}}>Incl. envíos: {$m(bm.env)}</p>}
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:"10px 14px",background:T.goldBg,borderRadius:8,fontSize:12,color:T.goldText}}>
          🛡️ <strong>Verifica:</strong> Efectivo debe estar en caja física · SPIN Marcel debe coincidir con la app de Marcel · SPIN Gustavo con la de Gustavo
        </div>
      </Card>
      {period==="semana" && (
        <Card>
          <STitle>Ventas por día — {range.label}</STitle>
          <table style={{width:"100%",fontSize:13,borderCollapse:"collapse"}}>
            <TH cols={["Día","Ventas","Ingresos","Utilidad"]}/>
            <tbody>
              {byDay.map((d,i)=>(
                <tr key={d.day} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                  <td style={{padding:"8px 10px",fontWeight:500}}>{d.day}</td>
                  <td style={{padding:"8px 10px",color:T.textSub}}>{d.count||"—"}</td>
                  <td style={{padding:"8px 10px",color:d.total>0?T.revenue:T.textMuted,fontWeight:d.total>0?600:400}}>{$m(d.total)}</td>
                  <td style={{padding:"8px 10px",color:d.util>0?T.profit:T.textMuted,fontWeight:d.util>0?600:400}}>{d.util>0?$m(d.util):"—"}</td>
                </tr>
              ))}
              <tr style={{background:T.goldBg,borderTop:`1px solid ${T.goldBorder}`}}>
                <td style={{padding:"8px 10px",fontWeight:700,color:T.goldText}}>TOTAL</td>
                <td style={{padding:"8px 10px",fontWeight:700,color:T.goldText}}>{fSales.length}</td>
                <td style={{padding:"8px 10px",fontWeight:700,color:T.revenue}}>{$m(rev)}</td>
                <td style={{padding:"8px 10px",fontWeight:700,color:T.profit}}>{$m(fSales.reduce((a,s)=>a+s.total-s.cost,0))}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}

      {/* ── UTILIDAD EXTRA ── */}
      <Card>
        <STitle>Utilidad extra / negocios externos</STitle>
        <p style={{margin:"0 0 12px",fontSize:12,color:T.textSub}}>
          Registra ingresos que llegan por terceros — solo la utilidad que te corresponde como socio.
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
          <F label="Fecha"><input type="date" value={exForm.date} onChange={e=>setExForm({...exForm,date:e.target.value})}/></F>
          <F label="Monto recibido ($)"><input type="number" min="0" value={exForm.amount} onChange={e=>setExForm({...exForm,amount:e.target.value})} placeholder="0.00"/></F>
          <F label="Corresponde a">
            <select value={exForm.socio} onChange={e=>setExForm({...exForm,socio:e.target.value})}>
              <option>Marcel</option>
              <option>Gustavo</option>
              <option>Ambos</option>
            </select>
          </F>
          <F label="Tipo">
            <select value={exForm.tipo} onChange={e=>setExForm({...exForm,tipo:e.target.value})}>
              <option value="utilidad">Utilidad de tercero</option>
              <option value="comision">Comisión</option>
              <option value="otro">Otro ingreso</option>
            </select>
          </F>
          <F label="Descripción"><input value={exForm.desc} onChange={e=>setExForm({...exForm,desc:e.target.value})} placeholder="Ej. venta por Andrés, comisión envío…"/></F>
        </div>
        <GoldBtn onClick={()=>{
          if(!exForm.amount||!exForm.desc.trim())return;
          if(setExtras)setExtras([...(extras||[]),{...exForm,id:uid(),amount:+exForm.amount}]);
          setExForm({date:today(),amount:"",desc:"",socio:"Marcel",tipo:"utilidad"});
        }}>+ Registrar utilidad extra</GoldBtn>

        {(extras||[]).length>0&&(()=>{
          const fExtras=(extras||[]).filter(x=>x.date>=range.start&&x.date<=range.end);
          const totalExtra=fExtras.reduce((s,x)=>s+x.amount,0);
          if(fExtras.length===0)return <p style={{marginTop:12,fontSize:12,color:T.textMuted}}>Sin utilidades extra en este período.</p>;
          return(
            <div style={{marginTop:14}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <p style={{margin:0,fontSize:12,fontWeight:600,color:T.text}}>En este período</p>
                <Chip label={"Total: "+$m(totalExtra)} bg="rgba(26,140,90,0.1)" color={T.profit}/>
              </div>
              <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
                <TH cols={["Fecha","Tipo","Socio","Descripción","Monto",""]}/>
                <tbody>
                  {fExtras.map((x,i)=>(
                    <tr key={x.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                      <td style={{padding:"7px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{x.date}</td>
                      <td style={{padding:"7px 10px"}}><Chip label={x.tipo==="utilidad"?"Utilidad tercero":x.tipo==="comision"?"Comisión":"Otro"} bg="rgba(26,140,90,0.1)" color={T.profit}/></td>
                      <td style={{padding:"7px 10px"}}><Chip label={x.socio} bg={x.socio==="Marcel"?T.goldBg:x.socio==="Gustavo"?"rgba(112,56,208,0.1)":"rgba(40,96,176,0.1)"} color={x.socio==="Marcel"?T.goldText:x.socio==="Gustavo"?T.pkg:T.client}/></td>
                      <td style={{padding:"7px 10px",color:T.text}}>{x.desc}</td>
                      <td style={{padding:"7px 10px",fontWeight:700,color:T.profit,whiteSpace:"nowrap"}}>{$m(x.amount)}</td>
                      <td style={{padding:"7px 10px"}}><OutBtn onClick={()=>setExtras&&setExtras((extras||[]).filter(e=>e.id!==x.id))} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS=[
  {k:"dash", l:"Dashboard",    icon:"ti-chart-bar",    color:T.revenue},
  {k:"prod", l:"Productos",    icon:"ti-droplet-half-2",color:T.cost},
  {k:"pkgs", l:"Paquetes",     icon:"ti-packages",     color:T.pkg},
  {k:"cli",  l:"Clientes",     icon:"ti-users",        color:T.client},
  {k:"venta",l:"Nueva venta",  icon:"ti-shopping-cart",color:T.profit},
  {k:"gasto",l:"Gastos",       icon:"ti-wallet",       color:T.expense},
  {k:"inv",  l:"Inventario",   icon:"ti-package",      color:T.client},
  {k:"corte",l:"Corte de caja",icon:"ti-report-money", color:T.profit},
];

// ── APP ───────────────────────────────────────────────────────────────────────
function Dashboard_App(){
  const[tab,setTab]=useState("dash");
  const[prods,setProds]=useState([]);
  const[pkgs,setPkgs]=useState([]);
  const[clients,setClients]=useState([]);
  const[sales,setSales]=useState([]);
  const[expenses,setExpenses]=useState([]);
  const[stockMoves,setStockMoves]=useState([]);
  const[extras,setExtras]=useState([]);
  const[ready,setReady]=useState(false);

  useEffect(()=>{
    (async()=>{
      let[p,pk,c,s,e,sm,ex]=await Promise.all([load(SK.p,INIT_PRODS),load(SK.pk,INIT_PKGS),load(SK.c,[]),load(SK.s,[]),load(SK.e,[]),load(SK.sm,[]),load(SK.ex,[])]);
      // Merge new products
      const ids=new Set(p.map(x=>x.id));
      INIT_PRODS.forEach(ip=>{if(!ids.has(ip.id))p.push(ip);});
      // Apply latest costs & names
      p=p.map(x=>{const ip=INIT_PRODS.find(i=>i.id===x.id);if(!ip)return x;return{...x,cost:ip.cost,name:ip.name,spc:ip.spc,tiers:ip.tiers};});
      // Migrate old stock field
      p=p.map(x=>{if(x.stockCajas!=null)return x;const spc=x.spc||1;const old=x.stock||0;return{...x,stockCajas:Math.floor(old/spc),stockSobres:old%spc,stock:undefined};});
      // Fix categories
      const fix=new Set(["gom","gom_f","gom_m","rchv","rhch"]);
      p=p.map(x=>fix.has(x.id)?{...x,cat:"Miel"}:x);
      setProds(p);setPkgs(pk);setClients(c);setSales(s);setExpenses(e);setStockMoves(sm);setExtras(ex);
      setReady(true);
    })();
  },[]);

  useEffect(()=>{if(ready)save(SK.p,prods);},[prods,ready]);
  useEffect(()=>{if(ready)save(SK.pk,pkgs);},[pkgs,ready]);
  useEffect(()=>{if(ready)save(SK.c,clients);},[clients,ready]);
  useEffect(()=>{if(ready)save(SK.s,sales);},[sales,ready]);
  useEffect(()=>{if(ready)save(SK.e,expenses);},[expenses,ready]);
  useEffect(()=>{if(ready)save(SK.sm,stockMoves);},[stockMoves,ready]);
  useEffect(()=>{if(ready)save(SK.ex,extras);},[extras,ready]);

  if(!ready)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem",gap:12,color:T.textSub}}>
      <Logo size={48}/>
      <p style={{margin:0,fontSize:13}}>Cargando tu dashboard…</p>
    </div>
  );

  const props={prods,setProds,pkgs,setPkgs,clients,setClients,sales,setSales,expenses,setExpenses,stockMoves,setStockMoves,extras,setExtras};
  const warn=prods.some(p=>p.cost===0);

  return(
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:T.bg}}>
      <div style={{borderBottom:`2px solid ${T.goldBorder}`,marginBottom:"1.25rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0 8px"}}>
          <Logo size={38}/>
          <div>
            <p style={{margin:0,fontWeight:700,fontSize:15,color:T.text,letterSpacing:"0.05em"}}>MY SECRET PASSION MX</p>
            <p style={{margin:0,fontSize:10,color:T.gold,fontWeight:600,letterSpacing:"0.12em",textTransform:"uppercase"}}>Dashboard de control · guardado automático</p>
          </div>
          {warn&&tab!=="prod"&&(
            <button onClick={()=>setTab("prod")} style={{marginLeft:"auto",fontSize:11,background:T.goldBg,color:T.goldText,border:`1px solid ${T.goldBorder}`,borderRadius:20,padding:"4px 12px",cursor:"pointer",fontWeight:600}}>
              ⚠️ Faltan costos
            </button>
          )}
        </div>
        <div style={{display:"flex",overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:"8px 8px",border:"none",borderBottom:tab===t.k?"2.5px solid "+t.color:"2.5px solid transparent",background:"transparent",cursor:"pointer",fontSize:11,whiteSpace:"nowrap",color:tab===t.k?t.color:T.textMuted,fontWeight:tab===t.k?700:400,display:"flex",alignItems:"center",gap:4}}>
              <i className={"ti "+t.icon} style={{fontSize:14,color:tab===t.k?t.color:T.textMuted}}/>
              {t.l}
            </button>
          ))}
        </div>
      </div>
      {tab==="dash"  && <Dashboard  {...props}/>}
      {tab==="prod"  && <Productos  {...props}/>}
      {tab==="pkgs"  && <Paquetes   {...props}/>}
      {tab==="cli"   && <Clientes   {...props}/>}
      {tab==="venta" && <NuevaVenta {...props}/>}
      {tab==="gasto" && <Gastos     {...props}/>}
      {tab==="inv"   && <Inventario {...props}/>}
      {tab==="corte" && <CorteCaja  sales={sales} expenses={expenses}/>}
    </div>
  );
}


export default function App() {
  const [authed, setAuthed] = useState(()=>sessionStorage.getItem("msp_auth")==="1");
  if (!authed) return <LoginScreen onLogin={()=>{ sessionStorage.setItem("msp_auth","1"); setAuthed(true); }}/>;
  return <Dashboard_App/>;
}
