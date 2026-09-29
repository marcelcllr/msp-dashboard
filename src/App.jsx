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
      .from("msp_store").select("value").eq("key", key).maybeSingle();
    if (error) { console.error("dbLoad error:", key, error.message); return def; }
    if (!data) return def;
    return JSON.parse(data.value);
  } catch(e) { console.error("dbLoad catch:", key, e); return def; }
}

async function dbSave(key, value) {
  try {
    const { error } = await _supabase.from("msp_store")
      .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() },
               { onConflict: "key" });
    if (error) console.error("dbSave error:", key, error.message);
  } catch(e) { console.error("dbSave catch:", key, e); }
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const APP_PWD = import.meta.env.VITE_APP_PASSWORD || "msp2024";

// Cada quien entra con su contraseña. Si no existen las variables nuevas en Vercel,
// Marcel y Gustavo siguen entrando con VITE_APP_PASSWORD. El empleado necesita VITE_PWD_EMPLEADO.
const USERS=[
  {id:"marcel",  name:"Marcel",  role:"admin", pwd:import.meta.env.VITE_PWD_MARCEL  ||APP_PWD},
  {id:"gustavo", name:"Gustavo", role:"admin", pwd:import.meta.env.VITE_PWD_GUSTAVO ||APP_PWD},
  {id:"empleado",name:import.meta.env.VITE_EMPLEADO_NOMBRE||"Empleado",role:"staff",pwd:import.meta.env.VITE_PWD_EMPLEADO||""},
];

function LoginScreen({ onLogin }) {
  const [who, setWho] = useState(null);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const check = () => {
    if (!who.pwd) { setErr("Falta configurar la contraseña de "+who.name+" en Vercel"); return; }
    if (pass === who.pwd) onLogin(who);
    else { setErr("Contraseña incorrecta"); setPass(""); }
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#FDFCF9"}}>
      <div style={{background:"#fff",borderRadius:16,padding:"36px 24px",border:"1px solid rgba(196,150,42,0.25)",width:"100%",maxWidth:380,textAlign:"center",boxShadow:"0 4px 30px rgba(196,150,42,0.1)"}}>
        <p style={{margin:"0 0 4px",fontWeight:700,fontSize:20,color:"#1C1A16",letterSpacing:"0.05em"}}>MY SECRET PASSION MX</p>
        <p style={{margin:"0 0 24px",fontSize:12,color:"#ADA394"}}>{who?"Hola, "+who.name:"¿Quién eres?"}</p>
        {!who ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {USERS.map(u=>(
              <button key={u.id} onClick={()=>{setWho(u);setErr("");setPass("");}} style={{minHeight:56,fontSize:16,fontWeight:600,color:"#1C1A16",border:"1px solid rgba(196,150,42,0.35)",borderRadius:12,background:"#FDFCF9"}}>
                {u.role==="admin"?"👤 ":"🧑‍💼 "}{u.name}
              </button>
            ))}
          </div>
        ) : (
          <>
            <input type="password" value={pass}
              onChange={e=>setPass(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&check()}
              placeholder="Tu contraseña"
              style={{width:"100%",marginBottom:10,textAlign:"center"}}
              autoFocus/>
            {err&&<p style={{color:"#C04040",fontSize:12,marginBottom:8}}>{err}</p>}
            <button onClick={check} style={{width:"100%",background:"#C4962A",color:"#fff",border:"none",borderRadius:10,minHeight:48,fontSize:15,fontWeight:600}}>
              Entrar
            </button>
            <button onClick={()=>{setWho(null);setErr("");}} style={{marginTop:10,border:"none",color:"#7A7060",fontSize:13}}>← No soy {who.name}</button>
          </>
        )}
      </div>
    </div>
  );
}


// ── STORAGE ──────────────────────────────────────────────────────────────────
const SK = { p:"msp-p4",pk:"msp-pk4",c:"msp-c4",s:"msp-s4",e:"msp-e4",sm:"msp-sm4",ex:"msp-ex4",pop:"msp-pop4",fx:"msp-fx4" };
const load = dbLoad;
const save = dbSave;

// ── UTILS ─────────────────────────────────────────────────────────────────────
const $m = n => "$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
const pct = n => Number(n).toFixed(1)+"%";
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,5);
// Fecha local (Monterrey), no UTC: con toISOString después de las 6 pm ya salía el día siguiente
const today = () => { const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
// Costo promedio de un sobre (todas las marcas). Se usa para los regalos que absorbemos.
const SOBRE_COST = 17;
// Fecha en que empezamos a usar la app con números reales. Inicio, Corte y Reparto no cuentan nada antes.
const INICIO_OPERACION = "2026-10-01";

// ── TIERS ─────────────────────────────────────────────────────────────────────
const TA=[{m:1,p:1199},{m:3,p:699},{m:5,p:650},{m:10,p:530},{m:20,p:500},{m:50,p:470},{m:100,p:450}];
const TB=[{m:1,p:999},{m:3,p:450},{m:5,p:400},{m:10,p:380},{m:20,p:350},{m:50,p:320},{m:100,p:290}];
const TC=[{m:1,p:1250},{m:3,p:750},{m:5,p:700},{m:10,p:580},{m:20,p:550},{m:50,p:520},{m:100,p:500}];
const TD=[{m:1,p:400},{m:3,p:260},{m:5,p:240},{m:10,p:220},{m:20,p:200},{m:50,p:190},{m:100,p:180}];
function tierPrice(tiers,qty){let p=tiers[0].p;for(const t of tiers)if(qty>=t.m)p=t.p;return p;}
function clientPrice(cl,pid,tiers,qty){if(cl?.prices?.[pid]!=null)return+cl.prices[pid];return tierPrice(tiers,qty);}
function pkgPrice(cl,pkgId,std){if(cl?.pkgPrices?.[pkgId]!=null)return+cl.pkgPrices[pkgId];return std;}

// ── CATALOG ───────────────────────────────────────────────────────────────────
const COSTS={"bh":225,"rhv":220,"hs":235,"rh":125,"rhp":170,"pp24":220,"vf":340,"sob":10,"gom":130,"rchv":290,"rhch":290};
const INIT_PRODS=[
  {id:"bh",  name:"Black Horse (24 sobres)",           cat:"Miel",    unit:"caja", spc:24, cost:225, list:1199,tiers:TA,costSobre:9,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"rhv", name:"Royal Honey VIP (24 sobres)",        cat:"Miel",    unit:"caja", spc:24, cost:220, list:1199,tiers:TA,costSobre:9,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"hs",  name:"Hard Steel (24 sobres)",             cat:"Miel",    unit:"caja", spc:24, cost:235, list:1199,tiers:TA,costSobre:10,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"rh",  name:"Royal Honey (12 sobres)",            cat:"Miel",    unit:"caja", spc:12, cost:125, list:999, tiers:TB,costSobre:10,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"rhp", name:"Royal Honey Platinum (12 sobres)",   cat:"Miel",    unit:"caja", spc:12, cost:183, list:999, tiers:TB,costSobre:15,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"rhh", name:"Royal Honey for Her (12 sobres)",    cat:"Miel",    unit:"caja", spc:12, cost:173, list:999, tiers:TB,costSobre:14,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"pp24",name:"Pink Pussycat (24 sobres)",          cat:"Miel",    unit:"caja", spc:24, cost:220, list:1199,tiers:TA,costSobre:9,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"vf",  name:"Vitafer-L (16 sobres)",              cat:"Miel",    unit:"caja", spc:16, cost:340, list:1199,tiers:TA,costSobre:21,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"sob", name:"Sobre individual",                   cat:"Miel",    unit:"sobre",spc:1,  cost:10,  list:150, tiers:[{m:1,p:150},{m:4,p:125},{m:8,p:100}],stockCajas:0,stockSobres:0},
  {id:"gom_f",name:"Gomitas Bliss Bears — Mujer",        cat:"Miel",    unit:"caja", spc:6,  cost:130, list:400, tiers:TD,costSobre:22,listSobre:150,stockCajas:0,stockSobres:0,spcu:"piezas"},
  {id:"gom_m",name:"Gomitas Boner Bears — Hombre",       cat:"Miel",    unit:"caja", spc:6,  cost:130, list:400, tiers:TD,costSobre:22,listSobre:150,stockCajas:0,stockSobres:0,spcu:"piezas"},
  {id:"rchv",name:"Royal Choco VIP",                    cat:"Miel",    unit:"caja", spc:12, cost:290, list:1250,tiers:TC,spcu:"piezas",costSobre:24,listSobre:150,stockCajas:0,stockSobres:0},
  {id:"rhch",name:"Rhino Choco",                        cat:"Miel",    unit:"caja", spc:12, cost:290, list:1250,tiers:TC,spcu:"piezas",costSobre:24,listSobre:150,stockCajas:0,stockSobres:0},
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
  {id:"may", name:"Paquete Mayorista",    price:39400,items:[{pid:"bh",qty:20},{pid:"rhv",qty:15},{pid:"rhp",qty:15},{pid:"hs",qty:10},{pid:"pp24",qty:5}]},
];
const EXP_CATS=["Renta local","Sueldos","Aguinaldo (apartado)","Plan celular","Repartidor fijo","Comisiones terminal","Insumos palomitas","Bolsas / empaques","Merma / regalos","Gasolina","Repartidores","Importación","Transporte","Almacén","Marketing","Gastos generales","Otro"];

// Gastos fijos: solo los socios los ven y registran
const FIXED_CATS=["Renta local","Sueldos","Aguinaldo (apartado)","Plan celular","Repartidor fijo"];
// Aguinaldo: ley = mínimo 15 días de sueldo. $2,000/7 días × 15 = $4,285.71 al año → se aparta cada mes
const INIT_FIXED=[
  {id:"renta",     name:"Renta del local",       cat:"Renta local",          amount:7859,   freq:"mensual"},
  {id:"sueldo",    name:"Sueldo empleado",       cat:"Sueldos",              amount:2000,   freq:"semanal"},
  {id:"repartidor",name:"Repartidor fijo",       cat:"Repartidor fijo",      amount:1000,   freq:"semanal"},
  {id:"celular",   name:"Plan celular",          cat:"Plan celular",         amount:150,    freq:"mensual"},
  {id:"aguinaldo", name:"Apartado aguinaldo",    cat:"Aguinaldo (apartado)", amount:357.14, freq:"mensual"},
];
// Versión de la lista de fijos: al subirla, se agregan los fijos nuevos por default una sola vez
const FIXED_VER=2;
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const weekStartOf=ds=>{const d=new Date(ds+"T12:00:00");const w=d.getDay();d.setDate(d.getDate()-(w===0?6:w-1));return ymd(d);};
// Semanas de cobro de los fijos: bloques de 7 días a partir del arranque (1–7 oct, 8–14 oct…)
const fixedWeekStart=ds=>{const d0=new Date(INICIO_OPERACION+"T12:00:00");const d=new Date(ds+"T12:00:00");const n=Math.floor(Math.round((d-d0)/86400000)/7);const st=new Date(d0);st.setDate(d0.getDate()+n*7);return ymd(st);};
// Periodo actual de un gasto fijo: "2026-10" (mensual) o el día que empieza su semana de cobro (semanal)
const fixedPeriod=(f,ds)=>f.freq==="semanal"?fixedWeekStart(ds):ds.slice(0,7);
const fixedPeriodLabel=(f,ds)=>{
  if(f.freq==="semanal"){const a=new Date(fixedWeekStart(ds)+"T12:00:00");const b=new Date(a);b.setDate(a.getDate()+6);
    const o={day:"numeric",month:"short"};return "semana "+a.toLocaleDateString("es-MX",o)+" – "+b.toLocaleDateString("es-MX",o);}
  return new Date(ds.slice(0,7)+"-15T12:00:00").toLocaleDateString("es-MX",{month:"long",year:"numeric"});
};
const fixedMonthly=f=>f.freq==="semanal"?f.amount*52/12:f.amount;
// Antes del arranque no hay nada pendiente: todos los fijos se cobran por primera vez el día de arranque
const fixedPending=(fixed,expenses,ds)=>ds<INICIO_OPERACION?[]:(fixed||[]).filter(f=>!expenses.some(e=>e.fixedId===f.id&&e.period===fixedPeriod(f,ds)));

// ── PALOMITAS ─────────────────────────────────────────────────────────────────
const POP_SIZES=["s","m","l"];
// cost = insumos (maíz, aceite, sal…) · vaso = bolsita/vaso donde se sirve
const INIT_POP={s:{name:"Pequeño",price:20,cost:3,vaso:5},m:{name:"Mediano",price:35,cost:4,vaso:5},l:{name:"Grande",price:50,cost:6,vaso:5}};
const popUnitCost=c=>(+c.cost||0)+(+c.vaso||0);
const PAY_METHODS=["Efectivo","SPIN Marcel","SPIN Gustavo","Transferencia MP","Terminal MP","Tercero","Mixto"];
// Cuentas de dinero del negocio (de dónde se paga un gasto, un fijo o a un repartidor).
// "Transferencia MP" = la cuenta de Mercado Pago (ahí también cae lo de la terminal).
const CUENTAS=["Efectivo","SPIN Marcel","SPIN Gustavo","Transferencia MP"];
const CUENTA_LABEL={"Efectivo":"💵 Efectivo","SPIN Marcel":"📱 SPIN Marcel","SPIN Gustavo":"📱 SPIN Gustavo","Transferencia MP":"🏦 Mercado Pago"};
const PAY_METHODS_LABEL={"Efectivo":"💵 Efectivo","SPIN Marcel":"📱 SPIN Marcel","SPIN Gustavo":"📱 SPIN Gustavo","Transferencia MP":"🏦 Transferencia Mercado Pago","Terminal MP":"💳 Terminal MP","Tercero":"🤝 Tercero","Mixto":"🔀 Mixto"};
// ── ENVÍOS ──
// Cada viaje se le paga al repartidor por kilómetro. La cuota semanal de la plataforma va en gastos fijos.
const ENVIO_TARIFA_KM=10;
const ENVIO_PCTS=[["100","Paga todo"],["50","Paga la mitad"],["0","Gratis"],["otro","Otro monto"]];
// Lo que se le paga al repartidor y lo que paga el cliente
function envioCalc(km,costoOver,pct,otro){
  const costo=costoOver!==""&&costoOver!=null?(+costoOver||0):(+km||0)*ENVIO_TARIFA_KM;
  const cliente=pct==="otro"?(+otro||0):+(costo*(+pct||0)/100).toFixed(2);
  return{costo,cliente,absorbe:costo-cliente};
}
// Comisión de Mercado Pago por cobro con terminal. Se descuenta de la utilidad de cada venta.
const TERMINAL_FEE=0.035;
// Cuánto de una venta pasó por la terminal (directo o la parte de un pago mixto)
const terminalAmt=(payMethod,total,mixCuenta,mixTransferencia)=>payMethod==="Terminal MP"?total:(payMethod==="Mixto"&&mixCuenta==="Terminal MP"?(+mixTransferencia||0):0);
const PAY_CLR={"Efectivo":{bg:"rgba(26,140,90,0.12)",c:"#1A8C5A"},"SPIN Marcel":{bg:"rgba(196,150,42,0.12)",c:"#8B6716"},"SPIN Gustavo":{bg:"rgba(112,56,208,0.12)",c:"#7038D0"},"Transferencia MP":{bg:"rgba(0,158,227,0.10)",c:"#005F8F"},"Terminal MP":{bg:"rgba(0,158,227,0.12)",c:"#0077B6"},"Tercero":{bg:"rgba(40,96,176,0.12)",c:"#2860B0"},"Mixto":{bg:"rgba(100,100,100,0.1)",c:"#555555"}};

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
function Card({children,style}){return <div style={{background:T.bgCard,border:`0.5px solid ${T.goldBorder}`,borderRadius:12,padding:"1rem 1.25rem",...style}}>{children}</div>;}
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
function Dashboard({prods,pkgs,clients,sales,expenses,fixed,goTab}){
  const now      = new Date();
  const todayStr = today();
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

  const pendFijos=fixedPending(fixed,expenses,todayStr);

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

      {pendFijos.length>0&&(
        <button onClick={()=>goTab&&goTab("gasto")} style={{textAlign:"left",background:"rgba(192,64,64,0.07)",border:"1px solid rgba(192,64,64,0.3)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
          <i className="ti ti-bell-ringing" style={{fontSize:22,color:T.expense}}/>
          <div style={{flex:1}}>
            <p style={{margin:0,fontSize:13,fontWeight:700,color:T.expense}}>Gastos fijos pendientes</p>
            <p style={{margin:0,fontSize:12,color:T.textSub}}>{pendFijos.map(f=>f.name+" "+$m(f.amount)).join(" · ")}</p>
          </div>
          <i className="ti ti-chevron-right" style={{fontSize:18,color:T.textMuted}}/>
        </button>
      )}

      {/* ── KPI CARDS ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12}}>
        <div style={{background:T.bgCard,borderRadius:12,padding:"16px 18px",border:`0.5px solid ${T.goldBorder}`,borderTop:`3px solid ${T.gold}`}}>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.08em"}}>Ganancias del mes</p>
          <p style={{margin:"0 0 4px",fontSize:28,fontWeight:700,color:T.text}}>{$m(mesData.util)}</p>
          <p style={{margin:0,fontSize:12,color:T.textMuted}}>{nomMes}</p>
        </div>
        <div style={{background:T.bgCard,borderRadius:12,padding:"16px 18px",border:`0.5px solid ${T.goldBorder}`,borderTop:`3px solid ${T.profit}`}}>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.textSub,textTransform:"uppercase",letterSpacing:"0.08em"}}>Ganancias del año</p>
          <p style={{margin:"0 0 4px",fontSize:28,fontWeight:700,color:T.text}}>{$m(totalData.util)}</p>
          <p style={{margin:0,fontSize:12,color:T.textMuted}}>Desde el arranque ({new Date(INICIO_OPERACION+"T12:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})}) · {curYear}</p>
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
        <div style={{background:mesData.net>=0?"rgba(26,140,90,0.06)":"rgba(192,64,64,0.06)",borderRadius:12,padding:"16px 18px",border:`2px solid ${mesData.net>=0?T.profit:T.expense}`}}>
          <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:mesData.net>=0?T.profit:T.expense,textTransform:"uppercase",letterSpacing:"0.08em"}}>✨ Utilidad neta del mes</p>
          <p style={{margin:"0 0 4px",fontSize:28,fontWeight:700,color:mesData.net>=0?T.profit:T.expense}}>{$m(mesData.net)}</p>
          <p style={{margin:0,fontSize:12,color:T.textMuted}}>Ganancias − gastos · {nomMes}</p>
        </div>
      </div>

      {/* ── CHART + RECIENTES ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12}}>
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
                      <p style={{margin:"0 0 2px",fontWeight:600,fontSize:13,color:T.text}}>{cl?.name||(s.tipo==="palomitas"?"🍿 Palomitas":"Cliente")}</p>
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
            <td style={{padding:"10px 12px",fontWeight:700,color:data.net>=0?T.profit:T.expense,textAlign:"right",whiteSpace:"nowrap"}}>{$m(data.net)}</td>
          </tr>
        );
        return(
          <Card>
            <STitle>Resumen de ganancias</STitle>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <TH cols={["Período","Ventas","Ingresos","Utilidad bruta","Utilidad neta"]}/>
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
  const[costSobreMap,setCostSobreMap]=useState({});
  const[listSobreMap,setListSobreMap]=useState({});
  const cats=[...new Set(prods.map(p=>p.cat))];
  const missing=prods.filter(p=>p.cost===0).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {missing>0 && <div style={{background:T.goldBg,border:`1px solid ${T.goldBorder}`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,fontSize:13,color:T.goldText}}><i className="ti ti-alert-circle" style={{fontSize:18,color:T.gold}}/><span>Faltan costos en <strong>{missing} productos</strong>.</span>{!editMode&&<GoldBtn onClick={()=>{const m={};prods.forEach(p=>m[p.id]=String(p.cost));setCostMap(m);const ms={};const ml={};prods.forEach(p=>{if(p.spc>1){ms[p.id]=String(p.costSobre||Math.round(p.cost/p.spc));ml[p.id]=String(p.listSobre||150);}});setCostSobreMap(ms);setListSobreMap(ml);setEditMode(true);}} style={{marginLeft:"auto",fontSize:11}}>Editar costos</GoldBtn>}</div>}
      {cats.map(cat=>(
        <Card key={cat}>
          <STitle right={!editMode&&cat===cats[0]&&<OutBtn onClick={()=>{const m={};prods.forEach(p=>m[p.id]=String(p.cost));setCostMap(m);const ms={};const ml={};prods.forEach(p=>{if(p.spc>1){ms[p.id]=String(p.costSobre||Math.round(p.cost/p.spc));ml[p.id]=String(p.listSobre||150);}});setCostSobreMap(ms);setListSobreMap(ml);setEditMode(true);}} style={{fontSize:11}}>Editar costos</OutBtn>}>
            {cat==="Miel"?"Productos en existencia":"Sex Shop"}
          </STitle>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
              <TH cols={["Producto","Contenido","Costo caja","Costo sobre","P. lista","P. sobre","Margen"]}/>
              <tbody>
                {prods.filter(p=>p.cat===cat).map((p,i)=>{
                  const u=p.list-p.cost;const m=p.list>0?(u/p.list)*100:0;
                  return(
                    <tr key={p.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                      <td style={{padding:"8px 10px",fontWeight:600,color:T.text}}>{p.name}</td>
                      <td style={{padding:"8px 10px",color:T.textSub,fontSize:11}}>{p.spc>1?p.spc+" "+(p.spcu||"sobres")+"/caja":p.unit}</td>
                      <td style={{padding:"8px 10px"}}>
                        {editMode ? <input type="number" min="0" step="0.01" value={costMap[p.id]||""} onChange={e=>setCostMap({...costMap,[p.id]:e.target.value})} style={{width:80,fontSize:12}}/> : (p.cost>0?<span style={{color:T.cost,fontWeight:600}}>{$m(p.cost)}</span>:<span style={{color:T.textMuted}}>—</span>)}
                      </td>
                      <td style={{padding:"8px 10px"}}>
                        {p.spc>1?(editMode ? <input type="number" min="0" step="0.01" value={costSobreMap[p.id]||""} onChange={e=>setCostSobreMap({...costSobreMap,[p.id]:e.target.value})} placeholder={String(p.costSobre||Math.round(p.cost/p.spc))} style={{width:70,fontSize:12}}/> : <span style={{color:T.cost,fontSize:12}}>{$m(p.costSobre||Math.round(p.cost/p.spc))}</span>):<span style={{color:T.textMuted,fontSize:11}}>—</span>}
                      </td>
                      <td style={{padding:"8px 10px",color:T.text}}>{$m(p.list)}</td>
                      <td style={{padding:"8px 10px"}}>
                        {p.spc>1?(editMode ? <input type="number" min="0" step="1" value={listSobreMap[p.id]||""} onChange={e=>setListSobreMap({...listSobreMap,[p.id]:e.target.value})} placeholder={String(p.listSobre||150)} style={{width:70,fontSize:12}}/> : <span style={{color:T.revenue,fontSize:12,fontWeight:600}}>{$m(p.listSobre||150)}</span>):<span style={{color:T.textMuted,fontSize:11}}>—</span>}
                      </td>
                      <td style={{padding:"8px 10px"}}>{p.cost>0?<span style={{color:m>0?T.profit:T.expense,fontWeight:700}}>{pct(m)}</span>:<span style={{color:T.textMuted,fontSize:11}}>—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {editMode&&cat===cats[cats.length-1]&&(
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <GoldBtn onClick={()=>{setProds(prods.map(p=>{
                const upd={...p,cost:parseFloat(costMap[p.id])||0};
                if(p.spc>1){
                  if(costSobreMap[p.id]!==undefined&&costSobreMap[p.id]!=="")upd.costSobre=parseFloat(costSobreMap[p.id])||0;
                  if(listSobreMap[p.id]!==undefined&&listSobreMap[p.id]!=="")upd.listSobre=parseFloat(listSobreMap[p.id])||0;
                }
                return upd;
              }));setEditMode(false);setCostSobreMap({});setListSobreMap({});}}>Guardar costos</GoldBtn>
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
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:12}}>
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
function Clientes({clients,setClients,prods,pkgs,isAdmin}){
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
          <F label="Nombre / empresa"><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Nombre del cliente"/></F>
          <F label="Tipo"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></F>
          <F label="Teléfono"><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="55 0000 0000"/></F>
          <F label="Notas"><input value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Zona, condiciones…"/></F>
        </div>
        {isAdmin&&<button onClick={()=>setShowP(!showP)} style={{marginTop:10,fontSize:11,color:T.gold,background:"none",border:"none",cursor:"pointer",fontWeight:600}}>
          {showP?"▲ Ocultar":"▼ Configurar"} precios especiales
        </button>}
        {isAdmin && showP && (
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
                            {isAdmin&&<button onClick={()=>setConfirmDel(c.id)} style={{padding:"5px 12px",fontSize:11,background:"rgba(192,64,64,0.1)",color:T.expense,border:"1px solid rgba(192,64,64,0.25)",borderRadius:6,cursor:"pointer",fontWeight:500}}>🗑️ Borrar</button>}
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
    <div style={{position:"relative"}}>
      <div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",border:`1px solid ${open?T.gold:T.border}`,borderRadius:6,background:T.bg,cursor:"pointer",minHeight:32}}>
        {sel
          ? <span style={{flex:1,fontSize:12,color:T.text,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sel.name} <span style={{color:T.textMuted,fontWeight:400}}>· {$m(sel.list)}</span></span>
          : <span style={{flex:1,fontSize:12,color:T.textMuted}}>— Selecciona producto —</span>
        }
        <i className="ti ti-chevron-down" style={{fontSize:12,color:T.textMuted,flexShrink:0}}/>
      </div>
      {open && (
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:999,background:T.bg,border:`1px solid ${T.goldBorder}`,borderRadius:8,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",marginTop:2,maxHeight:260,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`}}>
            <input
              autoFocus
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Buscar producto…"
              style={{width:"100%",fontSize:12,padding:"5px 8px",border:`1px solid ${T.border}`,borderRadius:5}}
              onClick={e=>e.stopPropagation()}
            />
          </div>
          <div style={{overflowY:"auto",flex:1}}>
            {fm.length>0 && (
              <>
                <div style={{padding:"5px 10px 2px",fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",background:T.bgAlt}}>Mieles & Chocolates</div>
                {fm.map(p=>(
                  <div key={p.id} onClick={()=>pick(p.id)} style={{padding:"8px 12px",fontSize:12,cursor:"pointer",background:value===p.id?T.goldBg:undefined,color:value===p.id?T.goldText:T.text,display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bgAlt}
                    onMouseLeave={e=>e.currentTarget.style.background=value===p.id?T.goldBg:"transparent"}>
                    <span style={{fontWeight:value===p.id?600:400}}>{p.name}</span>
                    <span style={{color:T.textMuted,fontSize:11}}>{$m(p.list)}</span>
                  </div>
                ))}
              </>
            )}
            {fs.length>0 && (
              <>
                <div style={{padding:"5px 10px 2px",fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",background:T.bgAlt}}>Sex Shop</div>
                {fs.map(p=>(
                  <div key={p.id} onClick={()=>pick(p.id)} style={{padding:"8px 12px",fontSize:12,cursor:"pointer",background:value===p.id?T.goldBg:undefined,color:value===p.id?T.goldText:T.text,display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bgAlt}
                    onMouseLeave={e=>e.currentTarget.style.background=value===p.id?T.goldBg:"transparent"}>
                    <span style={{fontWeight:value===p.id?600:400}}>{p.name}</span>
                    <span style={{color:T.textMuted,fontSize:11}}>{$m(p.list)}</span>
                  </div>
                ))}
              </>
            )}
            {fm.length===0&&fs.length===0 && <div style={{padding:"12px",fontSize:12,color:T.textMuted,textAlign:"center"}}>Sin resultados para "{q}"</div>}
          </div>
          {value && <div onClick={()=>pick("")} style={{padding:"8px 12px",fontSize:11,color:T.expense,cursor:"pointer",borderTop:`1px solid ${T.border}`,textAlign:"center"}}>✕ Quitar producto</div>}
        </div>
      )}
    </div>
  );
}

// ── REGALOS (sobres que regalamos en una venta) ───────────────────────────────
function RegalosForm({regalos,setRegalos,prods,isAdmin}){
  const sobreProds=prods.filter(p=>p.cat==="Miel"&&(p.spc||1)>1);
  const n=regalos.reduce((a,r)=>a+(+r.qty||0),0);
  const upd=(i,k,v)=>{const a=[...regalos];a[i]={...a[i],[k]:v};setRegalos(a);};
  return(
    <div style={{borderTop:`1px solid ${T.goldBorder}`,paddingTop:12,marginTop:4,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <p style={{margin:0,fontSize:12,fontWeight:600,color:T.text}}>🎁 Regalos para el cliente</p>
        <OutBtn onClick={()=>setRegalos([...regalos,{pid:"",qty:1}])} style={{fontSize:12}}>+ Agregar regalo</OutBtn>
      </div>
      {regalos.map((r,i)=>(
        <div key={i} style={{display:"flex",gap:6,marginTop:8,alignItems:"center"}}>
          <select value={r.pid} onChange={e=>upd(i,"pid",e.target.value)} style={{flex:1}}>
            <option value="">Sobre surtido</option>
            {sobreProds.map(p=><option key={p.id} value={p.id}>Sobre {p.name.replace(/\s*\(.*\)/,"")} ({p.stockSobres||0} sueltos)</option>)}
          </select>
          <input type="number" min="1" value={r.qty} onChange={e=>upd(i,"qty",e.target.value)} style={{width:64,textAlign:"center"}}/>
          <OutBtn onClick={()=>setRegalos(regalos.filter((_,j)=>j!==i))} danger style={{padding:"6px 10px"}}>✕</OutBtn>
        </div>
      ))}
      {n>0&&(
        <p style={{margin:"8px 0 0",fontSize:12,color:T.textSub}}>
          {n} sobre{n!==1?"s":""} de regalo{isAdmin&&<> · los absorbes: <strong style={{color:T.expense}}>−{$m(n*SOBRE_COST)}</strong> (a {$m(SOBRE_COST)} c/u)</>}
          {regalos.some(r=>r.pid)&&" · se descuentan del inventario"}
        </p>
      )}
    </div>
  );
}

// ── FORMULARIO DE ENVÍO (dentro de Nueva venta) ───────────────────────────────
function EnvioForm({conEnvio,setConEnvio,envKm,setEnvKm,envCostoOver,setEnvCostoOver,envPct,setEnvPct,envOtro,setEnvOtro,envRep,setEnvRep,envDir,setEnvDir,envPagado,setEnvPagado,envPagadoCon,setEnvPagadoCon,envCobro,setEnvCobro,setPayMethod,productos,isAdmin,repartidores}){
  const ev=envioCalc(envKm,envCostoOver,envPct,envOtro);
  const cobraRep=productos+ev.cliente;           // lo que el repartidor le cobra al cliente
  const teEntrega=cobraRep-ev.costo;              // lo que el repartidor te regresa
  const pill=(on,c)=>({border:`2px solid ${on?c:T.border}`,background:on?c+"18":"transparent",color:on?c:T.textSub,fontWeight:on?700:500,fontSize:12,minHeight:42,padding:"6px 4px",borderRadius:10});
  return(
    <div style={{borderTop:`1px solid ${T.goldBorder}`,paddingTop:12,marginTop:4,marginBottom:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        <button onClick={()=>setConEnvio(false)} style={pill(!conEnvio,T.textSub)}>🏪 Se lo lleva / sin envío</button>
        <button onClick={()=>setConEnvio(true)} style={pill(conEnvio,T.client)}>🛵 Con envío</button>
      </div>
      {conEnvio&&(
        <div style={{marginTop:10,padding:12,borderRadius:10,background:"rgba(40,96,176,0.05)",border:"1px solid rgba(40,96,176,0.2)",display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Kilómetros">
              <input type="number" min="0" step="0.1" value={envKm} onChange={e=>setEnvKm(e.target.value)} placeholder="Ej. 10"/>
            </F>
            <F label={"Repartidor cobra ($)"}>
              <input type="number" min="0" value={envCostoOver} onChange={e=>setEnvCostoOver(e.target.value)} placeholder={envKm?String((+envKm||0)*ENVIO_TARIFA_KM):"$"+ENVIO_TARIFA_KM+" × km"}/>
            </F>
          </div>
          <p style={{margin:"-4px 0 0",fontSize:11,color:T.textMuted}}>Se calcula solo a ${ENVIO_TARIFA_KM} por km. Escribe el monto solo si cobró distinto.</p>
          <div>
            <p style={{margin:"0 0 6px",fontSize:11,fontWeight:600,color:T.textSub}}>¿CUÁNTO PAGA EL CLIENTE DE ENVÍO?</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4}}>
              {ENVIO_PCTS.map(([v,l])=><button key={v} onClick={()=>setEnvPct(v)} style={pill(envPct===v,T.client)}>{l}</button>)}
            </div>
            {envPct==="otro"&&<input type="number" min="0" value={envOtro} onChange={e=>setEnvOtro(e.target.value)} placeholder="¿Cuánto paga el cliente?" style={{marginTop:6}}/>}
          </div>
          {ev.costo>0&&(
            <div style={{padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`,fontSize:13,display:"flex",flexDirection:"column",gap:3}}>
              <span>👤 Cliente paga: <strong style={{color:T.revenue}}>{$m(ev.cliente)}</strong></span>
              <span>🛵 Repartidor cobra: <strong style={{color:T.cost}}>{$m(ev.costo)}</strong></span>
              {isAdmin&&<span>{ev.absorbe>0?"📉 Absorbes: ":"📈 Te queda: "}<strong style={{color:ev.absorbe>0?T.expense:T.profit}}>{$m(Math.abs(ev.absorbe))}</strong></span>}
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <F label="Repartidor">
              <input list="msp-repartidores" value={envRep} onChange={e=>setEnvRep(e.target.value)} placeholder="Nombre"/>
              <datalist id="msp-repartidores">{repartidores.map(r=><option key={r} value={r}/>)}</datalist>
            </F>
            <F label="Colonia / dirección">
              <input value={envDir} onChange={e=>setEnvDir(e.target.value)} placeholder="Opcional"/>
            </F>
          </div>
          <div>
            <p style={{margin:"0 0 6px",fontSize:11,fontWeight:600,color:T.textSub}}>¿CÓMO PAGA EL CLIENTE?</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <button onClick={()=>setEnvCobro("transfer")} style={pill(envCobro==="transfer",T.client)}>📱 Transferencia / terminal</button>
              <button onClick={()=>{setEnvCobro("contra");setPayMethod("Efectivo");}} style={pill(envCobro==="contra",T.profit)}>💵 Efectivo al repartidor</button>
            </div>
          </div>
          {envCobro==="contra"?(
            <div style={{padding:"10px 12px",borderRadius:8,background:"rgba(26,140,90,0.06)",border:"1px solid rgba(26,140,90,0.25)",fontSize:13,display:"flex",flexDirection:"column",gap:3}}>
              <span>💵 El repartidor le cobra al cliente: <strong>{$m(cobraRep)}</strong></span>
              <span>🛵 Se queda con su envío: <strong style={{color:T.cost}}>−{$m(ev.costo)}</strong></span>
              <span style={{fontSize:14}}>🤝 Te tiene que entregar: <strong style={{color:T.profit}}>{$m(teEntrega)}</strong></span>
              {teEntrega<0&&<span style={{color:T.expense,fontSize:12}}>⚠ El envío cuesta más que lo que cobra: tú le debes {$m(-teEntrega)}</span>}
            </div>
          ):(
          <div>
            <p style={{margin:"0 0 6px",fontSize:11,fontWeight:600,color:T.textSub}}>¿YA SE LE PAGÓ AL REPARTIDOR?</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              <button onClick={()=>setEnvPagado("no")} style={pill(envPagado==="no",T.expense)}>⏳ No, después</button>
              <button onClick={()=>setEnvPagado("si")} style={pill(envPagado==="si",T.profit)}>✓ Sí, ya se le pagó</button>
            </div>
            {envPagado==="si"&&(
              <select value={envPagadoCon} onChange={e=>setEnvPagadoCon(e.target.value)} style={{marginTop:6}}>
                {CUENTAS.map(c=><option key={c} value={c}>{c==="Efectivo"?"💵 Se le pagó en efectivo (de la caja)":"Se le pagó con "+CUENTA_LABEL[c]}</option>)}
              </select>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── NUEVA VENTA ───────────────────────────────────────────────────────────────
function NuevaVenta({prods,setProds,pkgs,clients,setClients,sales,setSales,user,isAdmin}){
  const[confirmDel,setConfirmDel]=useState(null);
  const[date,setDate]=useState(today());
  const[clientId,setClientId]=useState("");
  const[mode,setMode]=useState("custom");
  const[pkgId,setPkgId]=useState("");
  const[pkgQty,setPkgQty]=useState(1);
  const[pkgOver,setPkgOver]=useState("");
  const[lines,setLines]=useState([{pid:"",qty:1,price:"",su:"caja"}]);
  const[payMethod,setPayMethod]=useState("Efectivo");
  const[mixEfectivo,setMixEfectivo]=useState("");
  const[mixTransferencia,setMixTransferencia]=useState("");
  const[mixCuenta,setMixCuenta]=useState("SPIN Marcel");
  const[regalos,setRegalos]=useState([]);
  const[conEnvio,setConEnvio]=useState(false);
  const[envKm,setEnvKm]=useState("");
  const[envCostoOver,setEnvCostoOver]=useState("");
  const[envPct,setEnvPct]=useState("100");
  const[envOtro,setEnvOtro]=useState("");
  const[envRep,setEnvRep]=useState("");
  const[envDir,setEnvDir]=useState("");
  const[envPagado,setEnvPagado]=useState("no");
  const[envPagadoCon,setEnvPagadoCon]=useState("Efectivo");
  const[envCobro,setEnvCobro]=useState("transfer");
  const[note,setNote]=useState("");
  const[err,setErr]=useState("");
  const[okMsg,setOkMsg]=useState("");
  const[pricesSaved,setPricesSaved]=useState(false);
  const[newCl,setNewCl]=useState(null);
  const[newClPrices,setNewClPrices]=useState(false);

  const cl=clients.find(c=>c.id===clientId);
  const selPkg=pkgs.find(p=>p.id===pkgId);
  const pSalePrice=selPkg?pkgPrice(cl,pkgId,selPkg.price):0;
  const effPkgPrice=pkgOver?+pkgOver:pSalePrice;
  const pkgCostU=selPkg?pkgCost(selPkg,prods):0;
  const pkgTotal=effPkgPrice*pkgQty;
  const pkgCostT=pkgCostU*pkgQty;

  const getLC=l=>{const p=prods.find(x=>x.id===l.pid);if(!p)return 0;return l.su==="sobre"?(p.costSobre||Math.round(p.cost/(p.spc||1))):p.cost;};
  const getLP=l=>{if(l.price)return+l.price;if(!l.pid)return 0;const p=prods.find(x=>x.id===l.pid);if(!p)return 0;if(l.su==="sobre")return p.listSobre||150;return clientPrice(cl,l.pid,p.tiers,+l.qty||1);};
  const getStd=l=>{const p=prods.find(x=>x.id===l.pid);if(!p)return 0;if(l.su==="sobre")return p.listSobre||150;return clientPrice(cl,l.pid,p.tiers,+l.qty||1);};
  const lineTotal=lines.reduce((s,l)=>s+getLP(l)*(+l.qty||1),0);
  const lineCost=lines.reduce((s,l)=>{if(!l.pid)return s;return s+getLC(l)*(+l.qty||1);},0);
  // simpler lineCost
  const lineCostCalc=lines.reduce((s,l)=>{if(!l.pid)return s;return s+getLC(l)*(+l.qty||1);},0);

  const register=()=>{
    if(!clientId){setErr("Selecciona un cliente");return;}
    let total,cost,desc,items,bajoPrecio=false;
    if(mode==="paquete"){
      if(!pkgId){setErr("Selecciona un paquete");return;}
      total=pkgTotal;cost=pkgCostT;
      bajoPrecio=effPkgPrice<pSalePrice;
      desc=selPkg.name+" ×"+pkgQty;
      items=(selPkg.items||[]).map(it=>({pid:it.pid,qty:it.qty*pkgQty,su:"caja"}));
    } else {
      const valid=lines.filter(l=>l.pid&&+l.qty>0);
      if(valid.length===0){setErr("Agrega al menos un producto");return;}
      total=lineTotal;cost=lineCostCalc;
      desc=valid.map(l=>{const p=prods.find(x=>x.id===l.pid);return l.qty+"× "+(p?p.name:l.pid);}).join(", ");
      items=valid.map(l=>({pid:l.pid,qty:+l.qty,su:l.su||"caja",price:getLP(l),std:getStd(l)}));
      bajoPrecio=items.some(it=>it.price<it.std);
    }
    // Envío: el cliente paga "envio", al repartidor se le paga "costoEnvio".
    // La diferencia (lo que absorbemos) va dentro de cost para que la utilidad sea real en todos los reportes.
    const ev=conEnvio?envioCalc(envKm,envCostoOver,envPct,envOtro):{costo:0,cliente:0,absorbe:0};
    if(conEnvio&&ev.costo<=0){setErr("Pon los kilómetros o lo que cobra el repartidor");return;}
    // Comisión de la terminal (sobre productos + envío que pagó el cliente)
    const comision=+(terminalAmt(payMethod,total+ev.cliente,mixCuenta,mixTransferencia)*TERMINAL_FEE).toFixed(2);
    // Contra entrega: el repartidor cobra en efectivo, se queda con su envío (queda pagado ese mismo día, en efectivo)
    // y nos debe entregar el resto hasta que se marque "ya entregó el dinero"
    const contra=conEnvio&&envCobro==="contra";
    const envioFields=conEnvio?{conEnvio:true,envio:ev.cliente,costoEnvio:ev.costo,envioNeto:ev.absorbe,envioKm:+envKm||0,envioPct:envPct,
      envioContra:contra,envioDebe:contra?+(total+ev.cliente-ev.costo).toFixed(2):0,envioDineroRecibido:false,envioDineroHora:"",
      repartidor:envRep.trim(),envioDir:envDir.trim(),envioStatus:"pendiente",envioSalio:"",envioEntregado:"",
      envioPagado:contra||envPagado==="si",envioPagadoCon:contra?"Efectivo":(envPagado==="si"?envPagadoCon:""),envioPagadoFecha:(contra||envPagado==="si")?date:""}
      :{conEnvio:false,envio:0,costoEnvio:0,envioNeto:0};
    // Regalos: cada sobre regalado lo absorbemos a SOBRE_COST y, si se eligió marca, se descuenta de sobres sueltos
    const regaloItems=regalos.filter(r=>+r.qty>0).map(r=>({pid:r.pid||"",qty:+r.qty}));
    const regaloN=regaloItems.reduce((a,r)=>a+r.qty,0);
    const regaloCosto=regaloN*SOBRE_COST;
    if(regaloN>0)desc+=" + 🎁 "+regaloN+" regalo"+(regaloN!==1?"s":"");
    const stockItems=[...items,...regaloItems.filter(r=>r.pid).map(r=>({pid:r.pid,qty:r.qty,su:"sobre"}))];
    const sale={id:uid(),date,clientId,pkgId:mode==="paquete"?pkgId:null,total,cost:cost+comision+ev.absorbe+regaloCosto,comision,regalos:regaloItems,regaloCosto,desc,items,note,payMethod,
      mixEfectivo:payMethod==="Mixto"?+mixEfectivo||0:0,
      mixTransferencia:payMethod==="Mixto"?+mixTransferencia||0:0,
      mixCuenta:payMethod==="Mixto"?mixCuenta:"",
      ...envioFields,by:user?.name||"",bajoPrecio};
    setSales([...sales,sale]);
    // deduct stock (suma todas las líneas del mismo producto: cajas y sobres por separado)
    setProds(prev=>prev.map(prod=>{
      const its=stockItems.filter(it=>it.pid===prod.id);
      if(its.length===0)return prod;
      const qS=its.filter(it=>it.su==="sobre").reduce((a,it)=>a+(+it.qty||0),0);
      const qC=its.filter(it=>(it.su||"caja")!=="sobre").reduce((a,it)=>a+(+it.qty||0),0);
      return {...prod,stockCajas:Math.max(0,(prod.stockCajas||0)-qC),stockSobres:Math.max(0,(prod.stockSobres||0)-qS)};
    }));
    setErr("");
    setPkgId("");setPkgQty(1);setPkgOver("");
    setLines([{pid:"",qty:1,price:"",su:"caja"}]);
    setRegalos([]);setConEnvio(false);setEnvKm("");setEnvCostoOver("");setEnvPct("100");setEnvOtro("");setEnvRep("");setEnvDir("");setEnvPagado("no");setEnvCobro("transfer");setNote("");
    setPayMethod("Efectivo");setMixEfectivo("");setMixTransferencia("");setMixCuenta("SPIN Marcel");
    setOkMsg("✓ Venta de "+$m(total+ev.cliente)+" registrada"+(conEnvio?" · envío pendiente en 🛵 Envíos":""));
    setTimeout(()=>setOkMsg(""),3000);
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
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
              <select value="" onChange={e=>{setErr("");const v=e.target.value;if(v==="__new__"){setNewCl({name:"",type:"Menudeo",phone:"",prices:{}});}else if(v){setClientId(v);}}}>
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
              {isAdmin&&<button onClick={()=>setNewClPrices(!newClPrices)} style={{marginTop:10,fontSize:12,color:T.gold,background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:0}}>
                {newClPrices?"▲ Ocultar":"▼ Configurar"} precios especiales (opcional)
              </button>}
              {isAdmin&&newClPrices&&(
                <div style={{marginTop:10,padding:"12px",background:T.bg,borderRadius:8,border:`0.5px solid ${T.goldBorder}`}}>
                  <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:T.goldText,textTransform:"uppercase"}}>Precio especial por producto (vacío = precio lista)</p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {prods.filter(p=>p.cat==="Miel").map(p=>(
                      <F key={p.id} label={p.name}>
                        <input type="number" min="0" placeholder={"$"+p.list}
                          value={newCl.prices?.[p.id]||""}
                          onChange={e=>setNewCl({...newCl,prices:{...(newCl.prices||{}),[p.id]:e.target.value}})}/>
                      </F>
                    ))}
                  </div>
                </div>
              )}
              {!newCl.name.trim() && <p style={{margin:"8px 0 0",fontSize:11,color:T.expense}}>⚠ Escribe el nombre del cliente para continuar</p>}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <GoldBtn onClick={()=>{
                  if(!newCl.name.trim())return;
                  const cleanPrices={};
                  Object.entries(newCl.prices||{}).forEach(([k,v])=>{if(v&&+v>0)cleanPrices[k]=+v;});
                  const nc={id:uid(),name:newCl.name.trim(),type:newCl.type,phone:newCl.phone||"",notes:"",prices:cleanPrices,pkgPrices:{}};
                  setClients(prev=>[...prev,nc]);
                  setClientId(nc.id);
                  setNewCl(null);
                  setNewClPrices(false);
                  setErr("");
                }}>✓ Guardar y continuar</GoldBtn>
                <OutBtn onClick={()=>{setNewCl(null);setNewClPrices(false);}}>Cancelar</OutBtn>
              </div>
            </div>
          )}
        </div>

        {/* PAQUETE */}
        {mode==="paquete" && (
          <div style={{background:T.bgAlt,borderRadius:10,padding:"12px",marginBottom:12,border:`0.5px solid ${T.goldBorder}`}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12}}>
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
                {isAdmin && pkgCostT>0 && <span style={{marginLeft:12}}>Utilidad: <strong style={{color:T.profit}}>{$m(pkgTotal-pkgCostT)} ({pct((pkgTotal-pkgCostT)/pkgTotal*100)})</strong></span>}
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
              const ut=up*(+l.qty||1)-(p?getLC(l)*(+l.qty||1):0);
              const esEspecial=p&&cl?.prices?.[l.pid];
              return(
                <div key={i} style={{background:T.bg,borderRadius:8,padding:"10px",marginBottom:8,border:`0.5px solid ${T.border}`}}>
                  <div style={{marginBottom:8}}>
                    <ProdSearch prods={prods} value={l.pid} onChange={pid=>updLine(i,"pid",pid)}/>
                  </div>
                  {p&&(
                    <div style={{display:"flex",gap:8,alignItems:"flex-end",flexWrap:"wrap"}}>
                      {p.spc>1&&(
                        <div style={{flex:"0 0 auto"}}>
                          <label style={{fontSize:10,fontWeight:600,color:T.textSub,display:"block",marginBottom:2}}>Unidad</label>
                          <select value={l.su||"caja"} onChange={e=>updLine(i,"su",e.target.value)} style={{width:90,minHeight:40}}>
                            <option value="caja">Caja</option>
                            <option value="sobre">Sobre</option>
                          </select>
                        </div>
                      )}
                      <div style={{flex:"0 0 auto"}}>
                        <label style={{fontSize:10,fontWeight:600,color:T.textSub,display:"block",marginBottom:2}}>Cant.</label>
                        <input type="number" min="1" step="1" value={l.qty} onChange={e=>updLine(i,"qty",e.target.value)} style={{width:72,minHeight:40,textAlign:"center"}}/>
                      </div>
                      <div style={{flex:"0 0 130px"}}>
                        <label style={{fontSize:10,fontWeight:600,color:esEspecial?T.profit:T.textSub,display:"block",marginBottom:2}}>{esEspecial?"Precio especial":"Precio"}</label>
                        <input type="number" min="0" value={l.price} onChange={e=>updLine(i,"price",e.target.value)} placeholder={p?String(clientPrice(cl,l.pid,p.tiers,+l.qty||1)):"0"} style={{minHeight:40,textAlign:"center",fontWeight:600}}/>
                      </div>
                      {isAdmin&&<div style={{flex:"0 0 auto",textAlign:"right",paddingBottom:8}}>
                        <div style={{fontSize:10,color:T.textMuted}}>Utilidad</div>
                        <div style={{fontSize:14,fontWeight:700,color:ut>=0?T.profit:T.expense,whiteSpace:"nowrap"}}>{p.cost>0?$m(ut):"—"}</div>
                      </div>}
                      <OutBtn onClick={()=>setLines(lines.filter((_,j)=>j!==i))} danger style={{padding:"7px 10px",marginBottom:2}}>✕</OutBtn>
                    </div>
                  )}
                </div>
              );
            })}
            <OutBtn onClick={()=>setLines([...lines,{pid:"",qty:1,price:"",su:"caja"}])} style={{fontSize:11}}>+ Agregar producto</OutBtn>
            {lineTotal>0 && (
              <div style={{marginTop:10,padding:"8px 12px",background:T.goldBg,borderRadius:8,fontSize:12,display:"flex",gap:20,flexWrap:"wrap"}}>
                <span style={{color:T.textSub}}>Total: <strong style={{color:T.revenue}}>{$m(lineTotal)}</strong></span>
                {isAdmin && lineCostCalc>0 && <span style={{color:T.textSub}}>Utilidad: <strong style={{color:lineTotal-lineCostCalc>=0?T.profit:T.expense}}>{$m(lineTotal-lineCostCalc)} ({pct((lineTotal-lineCostCalc)/lineTotal*100)})</strong></span>}
              </div>
            )}
            {isAdmin&&cl&&lines.some(l=>l.pid&&l.price)&&(
              <div style={{marginTop:8}}>
                {pricesSaved?(
                  <div style={{padding:"8px 12px",background:"rgba(26,140,90,0.1)",border:"1px solid rgba(26,140,90,0.3)",borderRadius:8,fontSize:12,color:T.profit}}>✓ Precios guardados para {cl.name}</div>
                ):(
                  <OutBtn onClick={()=>{
                    const newPrices={...(cl.prices||{})};
                    lines.forEach(l=>{if(l.pid&&l.price)newPrices[l.pid]=+l.price;});
                    setClients(clients.map(c=>c.id===cl.id?{...c,prices:newPrices}:c));
                    setPricesSaved(true);
                    setTimeout(()=>setPricesSaved(false),3000);
                  }} style={{fontSize:12,color:T.client,borderColor:"rgba(40,96,176,0.3)"}}>
                    💾 Guardar estos precios para {cl.name}
                  </OutBtn>
                )}
              </div>
            )}
          </div>
        )}

        {/* REGALOS */}
        <RegalosForm regalos={regalos} setRegalos={setRegalos} prods={prods} isAdmin={isAdmin}/>

        {/* ENVÍO */}
        <EnvioForm {...{conEnvio,setConEnvio,envKm,setEnvKm,envCostoOver,setEnvCostoOver,envPct,setEnvPct,envOtro,setEnvOtro,envRep,setEnvRep,envDir,setEnvDir,envPagado,setEnvPagado,envPagadoCon,setEnvPagadoCon,envCobro,setEnvCobro,setPayMethod,isAdmin}} productos={mode==="paquete"?pkgTotal:lineTotal} repartidores={[...new Set(sales.map(s=>s.repartidor).filter(Boolean))]}/>

        {/* PAGO */}
        <div style={{borderTop:`1px solid ${T.goldBorder}`,paddingTop:12,marginTop:4,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12}}>
          {conEnvio&&envCobro==="contra"?(
            <F label="¿Cómo pagó?"><div style={{padding:"10px 12px",borderRadius:8,background:PAY_CLR.Efectivo.bg,color:PAY_CLR.Efectivo.c,fontWeight:600,fontSize:13}}>💵 Efectivo contra entrega</div></F>
          ):(
          <F label="¿Cómo pagó?">
            <select value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
              {PAY_METHODS.map(m=><option key={m} value={m}>{PAY_METHODS_LABEL[m]||m}</option>)}
            </select>
          </F>
          )}
          {isAdmin&&terminalAmt(payMethod,mode==="paquete"?pkgTotal:lineTotal,mixCuenta,mixTransferencia)>0&&(()=>{
            const base=terminalAmt(payMethod,mode==="paquete"?pkgTotal:lineTotal,mixCuenta,mixTransferencia);
            return <div style={{gridColumn:"1/-1",padding:"8px 12px",background:PAY_CLR["Terminal MP"].bg,borderRadius:8,fontSize:12,color:PAY_CLR["Terminal MP"].c}}>
              💳 Comisión Mercado Pago ({(TERMINAL_FEE*100).toFixed(1)}%): <strong>−{$m(base*TERMINAL_FEE)}</strong> · Te llega: <strong>{$m(base*(1-TERMINAL_FEE))}</strong>
            </div>;
          })()}
          {payMethod==="Mixto"&&(
            <div style={{gridColumn:"1/-1",background:"rgba(100,100,100,0.06)",borderRadius:10,padding:"14px",border:"1px solid rgba(100,100,100,0.15)"}}>
              <p style={{margin:"0 0 12px",fontSize:12,fontWeight:600,color:T.text}}>💳 Desglose del pago mixto</p>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <F label="💵 ¿Cuánto pagó en efectivo? ($)">
                  <input type="number" min="0" value={mixEfectivo} onChange={e=>setMixEfectivo(e.target.value)} placeholder="0.00"/>
                </F>
                <F label="📱 ¿El resto a dónde se pagó?">
                  <select value={mixCuenta} onChange={e=>setMixCuenta(e.target.value)}>
                    <option value="SPIN Marcel">📱 SPIN Marcel</option>
                    <option value="SPIN Gustavo">📱 SPIN Gustavo</option>
                    <option value="Transferencia MP">🏦 Transferencia Mercado Pago</option>
                    <option value="Terminal MP">💳 Terminal Mercado Pago</option>
                  </select>
                </F>
                <F label={"💰 ¿Cuánto se pagó con "+mixCuenta+"? ($)"}>
                  <input type="number" min="0" value={mixTransferencia} onChange={e=>setMixTransferencia(e.target.value)} placeholder="0.00"/>
                </F>
                {(+mixEfectivo>0||+mixTransferencia>0)&&(
                  <div style={{padding:"10px 12px",background:T.goldBg,borderRadius:8,fontSize:12,color:T.goldText}}>
                    Total mixto: <strong>{$m((+mixEfectivo||0)+(+mixTransferencia||0))}</strong>
                    {" · "}💵 Efectivo: <strong>{$m(+mixEfectivo||0)}</strong>
                    {" · "}📱 {mixCuenta}: <strong>{$m(+mixTransferencia||0)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{gridColumn:"1/-1",padding:"10px 12px",background:T.goldBg,borderRadius:8,fontSize:13,color:T.goldText,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <span>Total a cobrar al cliente{conEnvio?" (con envío)":""}:</span>
            <strong style={{fontSize:16}}>{$m((mode==="paquete"?pkgTotal:lineTotal)+(conEnvio?envioCalc(envKm,envCostoOver,envPct,envOtro).cliente:0))}</strong>
          </div>
        </div>

        <div style={{display:"flex",gap:12,alignItems:"flex-end",marginTop:12}}>
          <F label="Nota interna (opcional)" style={{flex:1}}>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Observaciones…"/>
          </F>
          <GoldBtn onClick={register} style={{padding:"9px 24px",fontSize:13}}>
            ✓ Registrar venta
          </GoldBtn>
        </div>
        <ErrMsg msg={err}/>
        {okMsg&&<div style={{marginTop:8,padding:"10px 14px",background:"rgba(26,140,90,0.1)",border:"1px solid rgba(26,140,90,0.3)",borderRadius:8,fontSize:13,color:T.profit,fontWeight:600}}>{okMsg}</div>}
      </Card>

      {/* HISTORIAL */}
      <Card>
        <STitle>{isAdmin?"Historial de ventas ("+sales.length+")":"Ventas de hoy"}</STitle>
        {sales.length===0 ? <Empty icon="ti-shopping-cart" text="Sin ventas registradas"/> : (
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",fontSize:12,borderCollapse:"collapse",minWidth:580}}>
              <TH cols={isAdmin?["Fecha","Cliente","Descripción","Cobro","Ingresos","Envío","Utilidad","Margen","Registró",""]:["Fecha","Cliente","Descripción","Cobro","Total","Envío","Registró"]}/>
              <tbody>
                {[...sales].filter(s=>isAdmin||s.date===today()).sort((a,b)=>b.date.localeCompare(a.date)).map((s,i)=>{
                  const c=clients.find(x=>x.id===s.clientId);
                  const u=s.total-s.cost;const m=s.total>0?(u/s.total)*100:0;
                  const label=s.payMethod;
                  const pc=PAY_CLR[s.payMethod]||{};
                  return(
                    <tr key={s.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                      <td style={{padding:"6px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{s.date}</td>
                      <td style={{padding:"6px 10px",fontWeight:500,maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c?.name||(s.tipo==="palomitas"?"🍿 Palomitas":"—")}</td>
                      <td style={{padding:"6px 10px",color:T.textSub,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.desc}{isAdmin&&s.bajoPrecio&&<div><Chip label="⚠ bajo precio lista" bg="rgba(232,128,32,0.12)" color="#B86010"/></div>}</td>
                      <td style={{padding:"6px 10px"}}>{label&&<Chip label={label} bg={pc.bg} color={pc.c}/>}</td>
                      <td style={{padding:"6px 10px",fontWeight:600,color:T.revenue,whiteSpace:"nowrap"}}>{$m(s.total)}</td>
                      <td style={{padding:"6px 10px",color:T.client,whiteSpace:"nowrap"}}>{(s.envio||0)>0?$m(s.envio):"—"}</td>
                      {isAdmin&&<td style={{padding:"6px 10px",fontWeight:700,color:u>=0?T.profit:T.expense,whiteSpace:"nowrap"}}>{s.cost>0?$m(u):"—"}</td>}
                      {isAdmin&&<td style={{padding:"6px 10px",color:m>0?T.profit:T.expense,whiteSpace:"nowrap"}}>{s.cost>0?pct(m):"—"}</td>}
                      <td style={{padding:"6px 10px",color:T.textMuted,fontSize:11,whiteSpace:"nowrap"}}>{s.by||"—"}</td>
                      {isAdmin&&<td style={{padding:"6px 10px",whiteSpace:"nowrap"}}>
                        {confirmDel===s.id?(
                          <>
                            <button onClick={()=>{setSales(sales.filter(x=>x.id!==s.id));setConfirmDel(null);}} style={{fontSize:11,background:T.expense,color:"#fff",border:"none",fontWeight:600,padding:"3px 8px",minHeight:28}}>Borrar</button>
                            <button onClick={()=>setConfirmDel(null)} style={{fontSize:11,padding:"3px 8px",minHeight:28,marginLeft:4}}>No</button>
                          </>
                        ):(
                          <OutBtn onClick={()=>setConfirmDel(s.id)} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn>
                        )}
                      </td>}
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

// ── GASTOS FIJOS (solo socios) ────────────────────────────────────────────────
function GastosFijos({fixed,setFixed,expenses,setExpenses,user}){
  const hoyReal=today();
  // Antes del arranque se muestra el primer periodo (el que se cobra el día de arranque) sin dejar pagarlo
  const antes=hoyReal<INICIO_OPERACION;
  const hoy=antes?INICIO_OPERACION:hoyReal;
  const[payWith,setPayWith]=useState({});
  const[edit,setEdit]=useState(false);
  const[rows,setRows]=useState([]);
  const pend=fixedPending(fixed,expenses,hoy);
  const mensual=(fixed||[]).reduce((a,f)=>a+fixedMonthly(f),0);
  const pagar=f=>{
    const per=fixedPeriod(f,hoy);
    if(antes||expenses.some(e=>e.fixedId===f.id&&e.period===per))return;
    setExpenses(prev=>[...prev,{id:uid(),date:hoyReal,cat:f.cat,amount:+f.amount,desc:f.name+" · "+fixedPeriodLabel(f,hoy),pagadoCon:payWith[f.id]||"Efectivo",fixedId:f.id,period:per,by:user?.name||""}]);
  };
  const guardar=()=>{
    setFixed(rows.filter(r=>r.name.trim()&&+r.amount>0).map(r=>({...r,name:r.name.trim(),amount:+r.amount})));
    setEdit(false);
  };
  return(
    <Card style={{borderColor:pend.length>0?T.expense:T.goldBorder,borderWidth:pend.length>0?1:0.5}}>
      <STitle right={!edit&&<OutBtn onClick={()=>{setRows((fixed||[]).map(f=>({...f,amount:String(f.amount)})));setEdit(true);}} style={{fontSize:11}}>⚙️ Editar</OutBtn>}>Gastos fijos</STitle>
      <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:12,fontSize:12,color:T.textSub}}>
        <span>Al mes: <strong style={{color:T.expense}}>{$m(mensual)}</strong></span>
        <span>Por día: <strong style={{color:T.expense}}>{$m(mensual/30)}</strong></span>
      </div>
      <p style={{margin:"0 0 12px",fontSize:11,color:T.textMuted}}>Es lo mínimo de utilidad que necesitan sacar al día solo para cubrir los fijos.</p>
      {!edit?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(fixed||[]).map(f=>{
            const paid=expenses.find(e=>e.fixedId===f.id&&e.period===fixedPeriod(f,hoy));
            return(
              <div key={f.id} style={{padding:"12px",borderRadius:10,border:`1px solid ${paid?"rgba(26,140,90,0.3)":"rgba(192,64,64,0.3)"}`,background:paid?"rgba(26,140,90,0.05)":"rgba(192,64,64,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <div>
                    <p style={{margin:0,fontSize:14,fontWeight:700,color:T.text}}>{f.name}</p>
                    <p style={{margin:0,fontSize:11,color:T.textMuted}}>{$m(f.amount)} {f.freq==="semanal"?"por semana":"al mes"} · {fixedPeriodLabel(f,hoy)}</p>
                  </div>
                  {paid
                    ? <Chip label={"✓ Pagado "+paid.date.slice(5)} bg="rgba(26,140,90,0.12)" color={T.profit}/>
                    : antes
                      ? <Chip label={"Se cobra el "+new Date(INICIO_OPERACION+"T12:00:00").toLocaleDateString("es-MX",{day:"numeric",month:"short"})} bg={T.goldBg} color={T.goldText}/>
                      : <Chip label="Pendiente" bg="rgba(192,64,64,0.12)" color={T.expense}/>}
                </div>
                {!paid&&!antes&&(
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    <select value={payWith[f.id]||"Efectivo"} onChange={e=>setPayWith({...payWith,[f.id]:e.target.value})} style={{flex:1}}>
                      {CUENTAS.map(c=><option key={c} value={c}>{CUENTA_LABEL[c]}</option>)}
                    </select>
                    <GoldBtn onClick={()=>pagar(f)} style={{minHeight:44}}>✓ Ya se pagó</GoldBtn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ):(
        <>
          {rows.map((r,i)=>(
            <div key={r.id} style={{padding:10,borderRadius:10,border:`0.5px solid ${T.border}`,marginBottom:8,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8}}>
              <F label="Nombre"><input value={r.name} onChange={e=>{const a=[...rows];a[i]={...r,name:e.target.value};setRows(a);}}/></F>
              <F label="Monto ($)"><input type="number" min="0" value={r.amount} onChange={e=>{const a=[...rows];a[i]={...r,amount:e.target.value};setRows(a);}}/></F>
              <F label="Cada cuándo"><select value={r.freq} onChange={e=>{const a=[...rows];a[i]={...r,freq:e.target.value};setRows(a);}}><option value="mensual">Cada mes</option><option value="semanal">Cada semana</option></select></F>
              <F label="Categoría"><select value={r.cat} onChange={e=>{const a=[...rows];a[i]={...r,cat:e.target.value};setRows(a);}}>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select></F>
              <OutBtn onClick={()=>setRows(rows.filter((_,j)=>j!==i))} danger style={{alignSelf:"end",minHeight:44}}>Quitar</OutBtn>
            </div>
          ))}
          <OutBtn onClick={()=>setRows([...rows,{id:uid(),name:"",cat:"Plan celular",amount:"",freq:"mensual"}])} style={{fontSize:12,marginBottom:12}}>+ Agregar gasto fijo</OutBtn>
          <div style={{display:"flex",gap:8}}>
            <GoldBtn onClick={guardar}>Guardar</GoldBtn>
            <OutBtn onClick={()=>setEdit(false)}>Cancelar</OutBtn>
          </div>
        </>
      )}
    </Card>
  );
}

// ── GASTOS ────────────────────────────────────────────────────────────────────
function Gastos({expenses,setExpenses,user,isAdmin,fixed,setFixed}){
  const cats=isAdmin?EXP_CATS:EXP_CATS.filter(c=>!FIXED_CATS.includes(c));
  const blank={date:today(),cat:isAdmin?"Importación":"Insumos palomitas",amount:"",desc:"",pagadoCon:"Efectivo"};
  const[form,setForm]=useState(blank);
  const[err,setErr]=useState("");
  const[okMsg,setOkMsg]=useState("");
  const[confirmDel,setConfirmDel]=useState(null);
  // El empleado solo ve los gastos que él registró (nunca renta, sueldos ni totales)
  const visibles=isAdmin?expenses:expenses.filter(e=>e.by===user?.name);
  const total=expenses.reduce((s,e)=>s+e.amount,0);
  const EXP_CLR=["#C4962A","#1A8C5A","#2860B0","#C04040","#7038D0","#9A6020"];
  const byCat=EXP_CATS.map((c,i)=>({name:c,v:+expenses.filter(e=>e.cat===c).reduce((s,e)=>s+e.amount,0).toFixed(0),fill:EXP_CLR[i%EXP_CLR.length]})).filter(x=>x.v>0);
  const save=()=>{
    if(!form.amount||+form.amount<=0){setErr("Escribe el monto");return;}
    if(!form.desc.trim()){setErr("Escribe en qué se gastó");return;}
    setExpenses([...expenses,{...form,id:uid(),amount:+form.amount,by:user?.name||""}]);
    setForm({...blank,date:form.date,cat:form.cat});setErr("");
    setOkMsg("✓ Gasto de "+$m(+form.amount)+" registrado");setTimeout(()=>setOkMsg(""),3000);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {isAdmin&&<GastosFijos fixed={fixed} setFixed={setFixed} expenses={expenses} setExpenses={setExpenses} user={user}/>}
      <Card>
        <STitle>Registrar gasto</STitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
          <F label="Fecha"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></F>
          <F label="Categoría"><select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>{cats.map(c=><option key={c}>{c}</option>)}</select></F>
          <F label="Monto ($)"><input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></F>
          <F label="Descripción"><input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Detalle del gasto"/></F>
          <F label="¿Con qué se pagó?">
            <select value={form.pagadoCon||"Efectivo"} onChange={e=>setForm({...form,pagadoCon:e.target.value})}>
              {CUENTAS.map(c=><option key={c} value={c}>{CUENTA_LABEL[c]}</option>)}
            </select>
          </F>
        </div>
        <GoldBtn onClick={save} style={{marginTop:12,minHeight:44,width:"100%",fontSize:14}}>Registrar gasto</GoldBtn>
        <ErrMsg msg={err}/>
        {okMsg&&<div style={{marginTop:8,padding:"10px 14px",background:"rgba(26,140,90,0.1)",border:"1px solid rgba(26,140,90,0.3)",borderRadius:8,fontSize:13,color:T.profit,fontWeight:600}}>{okMsg}</div>}
      </Card>
      {isAdmin && byCat.length>0 && (
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
        <STitle>{isAdmin?"Historial ("+expenses.length+")":"Gastos que registraste"}</STitle>
        {visibles.length===0 ? <Empty icon="ti-wallet" text="Sin gastos registrados"/> : (
          <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
            <TH cols={isAdmin?["Fecha","Categoría","Descripción","Pagado con","Monto","Registró",""]:["Fecha","Categoría","Descripción","Monto"]}/>
            <tbody>
              {[...visibles].sort((a,b)=>b.date.localeCompare(a.date)).map((e,i)=>(
                <tr key={e.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                  <td style={{padding:"7px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{e.date}</td>
                  <td style={{padding:"7px 10px"}}><Chip label={e.cat} bg="rgba(192,64,64,0.1)" color={T.expense}/></td>
                  <td style={{padding:"7px 10px"}}>{e.desc}</td>
                  {isAdmin&&<td style={{padding:"7px 10px",color:T.textSub,fontSize:11,whiteSpace:"nowrap"}}>{e.pagadoCon||"Efectivo"}</td>}
                  <td style={{padding:"7px 10px",fontWeight:700,color:T.expense,whiteSpace:"nowrap"}}>{$m(e.amount)}</td>
                  {isAdmin&&<td style={{padding:"7px 10px",color:T.textMuted,fontSize:11}}>{e.by||"—"}</td>}
                  {isAdmin&&<td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>
                    {confirmDel===e.id?(
                      <>
                        <button onClick={()=>{setExpenses(expenses.filter(x=>x.id!==e.id));setConfirmDel(null);}} style={{fontSize:11,background:T.expense,color:"#fff",border:"none",fontWeight:600,padding:"3px 8px",minHeight:28}}>Borrar</button>
                        <button onClick={()=>setConfirmDel(null)} style={{fontSize:11,padding:"3px 8px",minHeight:28,marginLeft:4}}>No</button>
                      </>
                    ):(
                      <OutBtn onClick={()=>setConfirmDel(e.id)} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn>
                    )}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── INVENTARIO ────────────────────────────────────────────────────────────────
function Inventario({prods,setProds,sales,stockMoves,setStockMoves,user,isAdmin}){
  const by=user?.name||"";
  const[entForm,setEntForm]=useState({date:today(),pid:"",cajas:"",note:""});
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
    setStockMoves([...stockMoves,{id:uid(),date:entForm.date,pid:entForm.pid,type:"entrada",cajas:qty,note:entForm.note||"+"+qty+" cajas",by}]);
    setEntForm({date:today(),pid:"",cajas:"",note:""});
  };

  const abrirCaja=()=>{
    const prod=prods.find(p=>p.id===abrirForm.pid);
    if(!prod||!abrirForm.cajas||+abrirForm.cajas<=0)return;
    const qty=+abrirForm.cajas;
    if((prod.stockCajas||0)<qty){setInvErr("Solo tienes "+(prod.stockCajas||0)+" cajas de "+prod.name);return;}
    const nuevos=qty*(prod.spc||1);
    setProds(prods.map(p=>p.id===abrirForm.pid?{...p,stockCajas:(p.stockCajas||0)-qty,stockSobres:(p.stockSobres||0)+nuevos}:p));
    setStockMoves([...stockMoves,{id:uid(),date:today(),pid:abrirForm.pid,type:"apertura",cajas:qty,sobres:nuevos,note:"Apertura menudeo: "+qty+" caja"+(qty>1?"s":"")+" → "+nuevos+" sobres",by}]);
    setInvErr("");setAbrirForm({pid:"",cajas:1});
  };

  const[bulkMap,setBulkMap]=useState({});
  const[bulkMapSobres,setBulkMapSobres]=useState({});
  const[showBulk,setShowBulk]=useState(true);
  const[confirmReset,setConfirmReset]=useState(false);

  const saveBulk=()=>{
    const hayCajas=Object.values(bulkMap).some(v=>+v>0);
    const haySobres=Object.values(bulkMapSobres).some(v=>+v>0);
    if(!hayCajas&&!haySobres)return;
    const newMoves=[];
    setProds(prods.map(p=>{
      const cajas=+bulkMap[p.id]||0;
      const sobres=+bulkMapSobres[p.id]||0;
      if(cajas>0)newMoves.push({id:uid(),date:today(),pid:p.id,type:"entrada",cajas,note:"Carga de stock: "+cajas+" cajas",by});
      if(sobres>0)newMoves.push({id:uid(),date:today(),pid:p.id,type:"apertura",cajas:0,sobres,note:"Carga de sueltos: "+sobres,by});
      return {...p,stockCajas:(p.stockCajas||0)+cajas,stockSobres:(p.stockSobres||0)+sobres};
    }));
    setStockMoves([...stockMoves,...newMoves]);
    setBulkMap({});
    setBulkMapSobres({});
  };

  const resetStock=()=>{
    setProds(prods.map(p=>({...p,stockCajas:0,stockSobres:0})));
    setStockMoves([]);
    setConfirmReset(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

      {/* ── STOCK EN MASA ── */}
      <Card style={{borderColor:T.gold,borderWidth:1}}>
        <STitle right={
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {isAdmin&&(confirmReset?(
              <>
                <span style={{fontSize:11,color:T.expense,fontWeight:600}}>¿Resetear todo a cero?</span>
                <button onClick={resetStock} style={{padding:"4px 12px",fontSize:11,background:T.expense,color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontWeight:600}}>Sí, resetear</button>
                <button onClick={()=>setConfirmReset(false)} style={{padding:"4px 10px",fontSize:11,background:"transparent",color:T.textSub,border:`1px solid ${T.border}`,borderRadius:6,cursor:"pointer"}}>No</button>
              </>
            ):(
              <OutBtn onClick={()=>setConfirmReset(true)} danger style={{fontSize:11}}>🗑️ Resetear todo a cero</OutBtn>
            ))}
            <button onClick={()=>setShowBulk(!showBulk)} style={{fontSize:11,color:T.textSub,background:"none",border:"none",cursor:"pointer"}}>{showBulk?"▲ Ocultar":"▼ Cargar stock"}</button>
          </div>
        }>
          Cargar / actualizar stock
        </STitle>
        {showBulk && (
          <>
            <p style={{margin:"0 0 12px",fontSize:12,color:T.textSub}}>
              📦 <strong>Cajas</strong> = cajas selladas · 🔓 <strong>Sobres</strong> = sobres sueltos que ya tienes abiertos
            </p>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
              {prods.filter(p=>p.cat==="Miel"&&p.id!=="sob").map(p=>(
                <div key={p.id} style={{background:T.bgAlt,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.border}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
                    <div>
                      <p style={{margin:"0 0 2px",fontSize:13,fontWeight:600,color:T.text}}>{p.name}</p>
                      <p style={{margin:0,fontSize:11,color:T.textMuted}}>{p.spc>1?p.spc+" "+(p.spcu||"sobres")+"/caja":p.unit}</p>
                    </div>
                    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                      {(p.stockCajas||0)>0&&<Chip label={(p.stockCajas||0)+" cajas"} bg={T.goldBg} color={T.goldText}/>}
                      {(p.stockSobres||0)>0&&<Chip label={(p.stockSobres||0)+" "+(p.spcu||"sobres")} bg="rgba(40,96,176,0.1)" color={T.client}/>}
                      {(p.stockCajas||0)===0&&(p.stockSobres||0)===0&&<Chip label="Sin stock" bg="rgba(192,64,64,0.08)" color={T.expense}/>}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:p.spc>1?"1fr 1fr":"1fr",gap:10}}>
                    <F label={"📦 Cajas"+(p.spc>1?" ("+p.spc+" "+(p.spcu||"sobres")+" c/u)":"")}>
                      <input type="number" min="0" step="1" value={bulkMap[p.id]||""} onChange={e=>setBulkMap({...bulkMap,[p.id]:e.target.value})} placeholder="0" style={{textAlign:"center",fontWeight:700,fontSize:18}}/>
                    </F>
                    {p.spc>1&&(
                      <F label={"🔓 "+(p.spcu||"Sobres")+" sueltos"}>
                        <input type="number" min="0" step="1" value={bulkMapSobres[p.id]||""} onChange={e=>setBulkMapSobres({...bulkMapSobres,[p.id]:e.target.value})} placeholder="0" style={{textAlign:"center",fontWeight:700,fontSize:18}}/>
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
                  ...Object.entries(bulkMapSobres).filter(([,v])=>+v>0).map(([pid,v])=>{const p=prods.find(x=>x.id===pid);return "🔓 "+v+" sueltos de "+(p?.name||pid);})
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
            <TH cols={["Producto","Cajas selladas","Sobres menudeo","Vendido","Conteo físico (cajas · sobres)","Diferencia"]}/>
            <tbody>
              {mielProds.map((p,idx)=>{
                const spc=p.spc||1;
                const cajas=p.stockCajas||0;
                const sobres=p.stockSobres||0;
                const soldC=sales.reduce((s,sl)=>s+(sl.items||[]).filter(i=>i.pid===p.id&&(i.su||"caja")==="caja").reduce((a,i)=>a+(+i.qty||0),0),0);
                const soldS=sales.reduce((s,sl)=>s+(sl.items||[]).filter(i=>i.pid===p.id&&i.su==="sobre").reduce((a,i)=>a+(+i.qty||0),0),0);
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
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12,alignItems:"flex-end"}}>
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
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 2fr",gap:12,alignItems:"flex-end"}}>
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
            <TH cols={["Fecha","Tipo","Producto","Cantidad","Nota","Registró",""]}/>
            <tbody>
              {[...stockMoves].sort((a,b)=>b.date.localeCompare(a.date)).map((m,i)=>{
                const prod=prods.find(p=>p.id===m.pid);
                const isE=m.type==="entrada",isA=m.type==="apertura";
                return(
                  <tr key={m.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                    <td style={{padding:"7px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{m.date}</td>
                    <td style={{padding:"7px 10px"}}><Chip label={isE?"Entrada":isA?"Apertura menudeo":"Otro"} bg={isE?"rgba(26,140,90,0.1)":isA?"rgba(40,96,176,0.1)":T.goldBg} color={isE?T.profit:isA?T.client:T.gold}/></td>
                    <td style={{padding:"7px 10px",fontWeight:500}}>{prod?.name||m.pid}</td>
                    <td style={{padding:"7px 10px",color:isE?T.profit:T.client,fontWeight:600}}>{isE?"+"+m.cajas+" caja"+(m.cajas!==1?"s":""):isA?"−"+m.cajas+"c → +"+m.sobres+"s":""}</td>
                    <td style={{padding:"7px 10px",color:T.textSub,fontSize:11}}>{m.note}</td>
                    <td style={{padding:"7px 10px",color:T.textMuted,fontSize:11}}>{m.by||"—"}</td>
                    <td style={{padding:"7px 10px"}}>
                      {isAdmin&&<OutBtn onClick={()=>{
                        if(isE)setProds(prods.map(p=>p.id===m.pid?{...p,stockCajas:Math.max(0,(p.stockCajas||0)-m.cajas)}:p));
                        if(isA)setProds(prods.map(p=>p.id===m.pid?{...p,stockCajas:(p.stockCajas||0)+m.cajas,stockSobres:Math.max(0,(p.stockSobres||0)-m.sobres)}:p));
                        setStockMoves(stockMoves.filter(x=>x.id!==m.id));
                      }} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn>}
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
function CorteCaja({sales,expenses,extras=[],setExtras,user}){
  const[period,setPeriod]=useState("semana");
  const[refDate,setRefDate]=useState(today());
  const[exForm,setExForm]=useState({date:today(),amount:"",desc:"",tipo:"utilidad",via:"Efectivo"});
  const[exSaved,setExSaved]=useState(false);
  const saveExtra=()=>{
    if(!exForm.amount||+exForm.amount<=0)return;
    setExtras([...(extras||[]),{...exForm,id:uid(),amount:+exForm.amount,desc:exForm.desc||exForm.tipo,by:user?.name||""}]);
    setExForm({date:today(),amount:"",desc:"",tipo:"utilidad",via:"Efectivo"});
    setExSaved(true);
    setTimeout(()=>setExSaved(false),3000);
  };
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
  const costo=fSales.reduce((s,v)=>s+(v.cost||0),0);
  const fExtrasP=(extras||[]).filter(x=>x.date>=range.start&&x.date<=range.end);
  const extrasTotal=fExtrasP.reduce((a,x)=>a+x.amount,0);
  const utilNeta=rev-costo-gastos+extrasTotal;
  const extraEfectivo=fExtrasP.filter(x=>x.via==="Efectivo").reduce((a,x)=>a+x.amount,0);
  const extraMarcel=fExtrasP.filter(x=>x.via==="SPIN Marcel").reduce((a,x)=>a+x.amount,0);
  const extraGustavo=fExtrasP.filter(x=>x.via==="SPIN Gustavo").reduce((a,x)=>a+x.amount,0);
  const mixSales=fSales.filter(s=>s.payMethod==="Mixto");
  const mixEfectivoTotal=mixSales.reduce((a,s)=>a+(s.mixEfectivo||0),0);
  const mixMarcelTotal=mixSales.filter(s=>s.mixCuenta==="SPIN Marcel").reduce((a,s)=>a+(s.mixTransferencia||0),0);
  const mixGustavoTotal=mixSales.filter(s=>s.mixCuenta==="SPIN Gustavo").reduce((a,s)=>a+(s.mixTransferencia||0),0);
  const byMethod=PAY_METHODS.filter(m=>m!=="Mixto").map(m=>{
    const direct=fSales.filter(s=>s.payMethod===m);
    const ventasTotal=direct.reduce((a,s)=>a+s.total,0);
    // Envío que pagó el cliente: entra a la misma cuenta que la venta (en Mixto ya viene dentro del desglose)
    const envCobrado=direct.reduce((a,s)=>a+(s.envio||0),0);
    // Pagos a repartidores hechos en este periodo desde esta cuenta
    const repPagado=sales.filter(s=>s.envioPagado&&s.envioPagadoCon===m&&s.envioPagadoFecha>=range.start&&s.envioPagadoFecha<=range.end).reduce((a,s)=>a+(s.costoEnvio||0),0);
    const mixAmt=m==="Efectivo"?mixEfectivoTotal:mixSales.filter(s=>s.mixCuenta===m).reduce((a,s)=>a+(s.mixTransferencia||0),0);
    // Mercado Pago deposita ya descontada su comisión
    const comisionAmt=m==="Terminal MP"?fSales.reduce((a,s)=>a+(s.comision||0),0):0;
    const extraAmt=fExtrasP.filter(x=>(x.via||"Efectivo")===m).reduce((a,x)=>a+x.amount,0);
    const gastosDeEsta=fExp.filter(e=>(e.pagadoCon||"Efectivo")===m).reduce((a,e)=>a+e.amount,0);
    const entradas=ventasTotal+envCobrado+mixAmt+extraAmt;
    const neto=entradas-gastosDeEsta-comisionAmt-repPagado;
    const pc=PAY_CLR[m]||{};
    return{method:m,ventasTotal,envCobrado,repPagado,mixAmt,extraAmt,entradas,gastosDeEsta,comisionAmt,neto,count:direct.length,env:direct.reduce((a,s)=>a+(s.envio||0),0),bg:pc.bg,c:pc.c};
  });
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
        <KCard icon="ti-motorbike"   label="Envíos cobrados" value={$m(envTotal)} sub={"Repartidores: "+$m(fSales.reduce((a,v)=>a+(v.costoEnvio||0),0))} color={T.client}/>
        <KCard icon="ti-wallet"      label="Gastos" value={$m(gastos)} color={T.expense}/>
        <KCard icon="ti-sparkles"    label="Utilidad neta" value={$m(utilNeta)} sub="ventas − costo − gastos + extras" color={utilNeta>=0?T.profit:T.expense}/>
      </div>
      {sinMetodo>0 && <div style={{background:"rgba(192,64,64,0.08)",border:"1px solid rgba(192,64,64,0.25)",borderRadius:10,padding:"10px 16px",fontSize:13,color:T.expense,display:"flex",gap:8,alignItems:"center"}}><i className="ti ti-alert-triangle" style={{fontSize:18}}/><strong>{sinMetodo} venta{sinMetodo>1?"s":""}</strong> sin forma de pago. Ve a Ventas y corrígelas.</div>}
      <Card>
        <STitle>Desglose por forma de cobro</STitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {byMethod.map(bm=>(
            <div key={bm.method} style={{background:bm.bg||T.goldBg,borderRadius:10,padding:"14px 16px",border:`0.5px solid ${bm.c||T.gold}30`}}>
              <p style={{margin:"0 0 8px",fontWeight:700,fontSize:13,color:bm.c||T.gold}}>{bm.method} <span style={{fontWeight:400,fontSize:11,color:T.textMuted}}>({bm.count} venta{bm.count!==1?"s":""})</span></p>
              {bm.ventasTotal>0&&<p style={{margin:"2px 0",fontSize:12,color:T.textSub}}>Ventas: <strong style={{color:bm.c||T.gold}}>{$m(bm.ventasTotal)}</strong></p>}
              {bm.mixAmt>0&&<p style={{margin:"2px 0",fontSize:12,color:T.textSub}}>Mixto: <strong style={{color:bm.c||T.gold}}>+{$m(bm.mixAmt)}</strong></p>}
              {bm.extraAmt>0&&<p style={{margin:"2px 0",fontSize:12,color:T.textSub}}>Extra: <strong style={{color:T.profit}}>+{$m(bm.extraAmt)}</strong></p>}
              {bm.gastosDeEsta>0&&<p style={{margin:"2px 0",fontSize:12,color:T.textSub}}>Gastos: <strong style={{color:T.expense}}>−{$m(bm.gastosDeEsta)}</strong></p>}
              {bm.envCobrado>0&&<p style={{margin:"2px 0",fontSize:12,color:T.textSub}}>Envíos cobrados: <strong style={{color:bm.c||T.gold}}>+{$m(bm.envCobrado)}</strong></p>}
              {bm.repPagado>0&&<p style={{margin:"2px 0",fontSize:12,color:T.textSub}}>Pagado a repartidores: <strong style={{color:T.expense}}>−{$m(bm.repPagado)}</strong></p>}
              {bm.comisionAmt>0&&<p style={{margin:"2px 0",fontSize:12,color:T.textSub}}>Comisión MP: <strong style={{color:T.expense}}>−{$m(bm.comisionAmt)}</strong></p>}
              <div style={{borderTop:`1px solid ${bm.c||T.gold}30`,marginTop:8,paddingTop:8}}>
                <p style={{margin:0,fontSize:20,fontWeight:700,color:bm.neto>=0?T.profit:T.expense}}>{$m(bm.neto)}</p>
                <p style={{margin:"2px 0 0",fontSize:10,color:T.textMuted}}>neto en esta cuenta</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:"10px 14px",background:T.goldBg,borderRadius:8,fontSize:12,color:T.goldText}}>
          {(()=>{const x=fSales.filter(s=>s.envioContra&&!s.envioDineroRecibido).reduce((a,s)=>a+(s.envioDebe||0),0);
            return x>0?<div style={{marginBottom:6,color:T.expense,fontWeight:600}}>⚠ De tu efectivo, {$m(x)} todavía lo traen los repartidores (ve a 🛵 Envíos).</div>:null;})()}
          🛡️ <strong>Verifica:</strong> Efectivo debe estar en caja física · SPIN Marcel debe coincidir con la app de Marcel · SPIN Gustavo con la de Gustavo · Transferencia MP + Terminal MP (ya sin comisión) = lo que entró a tu Mercado Pago
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
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:12}}>
          <F label="Fecha"><input type="date" value={exForm.date} onChange={e=>setExForm({...exForm,date:e.target.value})}/></F>
          <F label="Monto recibido ($)"><input type="number" min="0" value={exForm.amount} onChange={e=>setExForm({...exForm,amount:e.target.value})} placeholder="0.00"/></F>
          <F label="Tipo">
            <select value={exForm.tipo} onChange={e=>setExForm({...exForm,tipo:e.target.value})}>
              <option value="utilidad">Utilidad de tercero</option>
              <option value="comision">Comisión</option>
              <option value="otro">Otro ingreso</option>
            </select>
          </F>
          <F label="¿Cómo llegó el dinero?">
            <select value={exForm.via||"Efectivo"} onChange={e=>setExForm({...exForm,via:e.target.value})}>
              {CUENTAS.map(c=><option key={c} value={c}>{CUENTA_LABEL[c]}</option>)}
            </select>
          </F>
          <F label="Descripción (opcional)"><input value={exForm.desc} onChange={e=>setExForm({...exForm,desc:e.target.value})} placeholder="Ej. comisión por venta de Andrés…"/></F>
        </div>
        <GoldBtn onClick={saveExtra}>+ Registrar utilidad extra</GoldBtn>
        {exSaved&&<div style={{marginTop:8,padding:"10px 14px",background:"rgba(26,140,90,0.1)",border:"1px solid rgba(26,140,90,0.3)",borderRadius:8,fontSize:13,color:T.profit}}>✓ ¡Registrado correctamente!</div>}
        {(extras||[]).length>0&&(
          <div style={{marginTop:16}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <p style={{margin:0,fontSize:12,fontWeight:600,color:T.text}}>Historial completo</p>
              <Chip label={"Total: "+$m((extras||[]).reduce((s,x)=>s+x.amount,0))} bg="rgba(26,140,90,0.1)" color={T.profit}/>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[...(extras||[])].sort((a,b)=>b.date.localeCompare(a.date)).map((x,i)=>{
                const pc=PAY_CLR[x.via||"Efectivo"]||{bg:T.goldBg,c:T.goldText};
                return(
                  <div key={x.id} style={{background:i%2===0?T.bg:T.bgRow,borderRadius:8,padding:"10px 12px",border:`0.5px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}>
                        <span style={{fontSize:11,color:T.textMuted,whiteSpace:"nowrap"}}>{x.date}</span>
                        <Chip label={x.tipo==="utilidad"?"Utilidad":x.tipo==="comision"?"Comisión":"Otro"} bg="rgba(26,140,90,0.1)" color={T.profit}/>
                        <Chip label={x.via||"Efectivo"} bg={pc.bg} color={pc.c}/>
                      </div>
                      <p style={{margin:0,fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{x.desc||"—"}</p>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <span style={{fontWeight:700,fontSize:15,color:T.profit}}>{$m(x.amount)}</span>
                      <OutBtn onClick={()=>setExtras((extras||[]).filter(e=>e.id!==x.id))} danger style={{fontSize:11,padding:"4px 8px"}}>🗑️</OutBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}


// ── REPARTO DE UTILIDADES ─────────────────────────────────────────────────────
function RepartoCard({data,label,sublabel}){
  const marcel=data.neta*0.33, gustavo=data.neta*0.33, reinv=data.neta*0.34;
  return(
    <Card>
      <STitle right={<span style={{fontSize:13,fontWeight:600,color:T.gold}}>{label}</span>}>{sublabel}</STitle>
      <div style={{background:T.bgAlt,borderRadius:10,padding:"14px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}>
          <span style={{color:T.textSub}}>Ingresos por ventas ({data.ventas})</span>
          <span style={{fontWeight:600,color:T.revenue}}>{$m(data.ingresos)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}>
          <span style={{color:T.textSub}}>− Costo de productos, comisiones y envíos absorbidos</span>
          <span style={{fontWeight:600,color:T.cost}}>−{$m(data.costo)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}>
          <span style={{color:T.textSub}}>− Gastos</span>
          <span style={{fontWeight:600,color:T.expense}}>−{$m(data.gastos)}</span>
        </div>
        {data.extrasP>0&&(
          <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}>
            <span style={{color:T.textSub}}>+ Utilidades extra</span>
            <span style={{fontWeight:600,color:T.profit}}>+{$m(data.extrasP)}</span>
          </div>
        )}
        <div style={{borderTop:`1px solid ${T.goldBorder}`,marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,fontSize:14,color:T.text}}>Utilidad neta a repartir</span>
          <span style={{fontWeight:700,fontSize:20,color:data.neta>=0?T.profit:T.expense}}>{$m(data.neta)}</span>
        </div>
      </div>
      {data.neta>0?(
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
          <div style={{background:"rgba(196,150,42,0.08)",borderRadius:10,padding:"14px 16px",border:`1px solid ${T.goldBorder}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><p style={{margin:0,fontWeight:700,fontSize:14,color:T.goldText}}>🧑 Marcel</p><p style={{margin:0,fontSize:11,color:T.textMuted}}>33% de la utilidad</p></div>
            <span style={{fontWeight:700,fontSize:22,color:T.goldText}}>{$m(marcel)}</span>
          </div>
          <div style={{background:"rgba(112,56,208,0.08)",borderRadius:10,padding:"14px 16px",border:"1px solid rgba(112,56,208,0.25)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><p style={{margin:0,fontWeight:700,fontSize:14,color:T.pkg}}>🧑 Gustavo</p><p style={{margin:0,fontSize:11,color:T.textMuted}}>33% de la utilidad</p></div>
            <span style={{fontWeight:700,fontSize:22,color:T.pkg}}>{$m(gustavo)}</span>
          </div>
          <div style={{background:"rgba(26,140,90,0.08)",borderRadius:10,padding:"14px 16px",border:"1px solid rgba(26,140,90,0.25)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><p style={{margin:0,fontWeight:700,fontSize:14,color:T.profit}}>🏢 Reinversión MSP</p><p style={{margin:0,fontSize:11,color:T.textMuted}}>34% para la empresa</p></div>
            <span style={{fontWeight:700,fontSize:22,color:T.profit}}>{$m(reinv)}</span>
          </div>
        </div>
      ):(
        <div style={{padding:"16px",textAlign:"center",color:T.textMuted,fontSize:13}}>
          {data.neta===0?"Sin utilidad para repartir en este período":"⚠ Hay pérdida en este período — no hay reparto"}
        </div>
      )}
    </Card>
  );
}

function Reparto({sales,expenses,extras=[]}){
  const[refDate,setRefDate]=useState(today());

  const calcUtilidad=(start,end)=>{
    const ss=sales.filter(s=>s.date>=start&&s.date<=end);
    const ingresos=ss.reduce((a,s)=>a+s.total,0);
    const costo=ss.reduce((a,s)=>a+s.cost,0);
    const gastos=expenses.filter(e=>e.date>=start&&e.date<=end).reduce((a,e)=>a+e.amount,0);
    const extrasP=(extras||[]).filter(x=>x.date>=start&&x.date<=end).reduce((a,x)=>a+x.amount,0);
    const neta=(ingresos-costo)-gastos+extrasP;
    return{ingresos,costo,gastos,extrasP,neta,ventas:ss.length};
  };

  const d=new Date(refDate+"T12:00:00");
  const day=d.getDay();
  const mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:day-1));
  const sun=new Date(mon);sun.setDate(mon.getDate()+6);
  const weekStart=mon.toISOString().slice(0,10);
  const weekEnd=sun.toISOString().slice(0,10);
  const weekLabel="Sem "+mon.toLocaleDateString("es-MX",{day:"2-digit",month:"short"})+" – "+sun.toLocaleDateString("es-MX",{day:"2-digit",month:"short"});

  const monthStr=refDate.slice(0,7);
  const monthLabel=new Date(refDate+"T12:00:00").toLocaleDateString("es-MX",{month:"long",year:"numeric"});

  const sem=calcUtilidad(weekStart,weekEnd);
  const mes=calcUtilidad(monthStr+"-01",monthStr+"-31");

  // Gráfica: utilidad neta por cada día de la semana
  const NOM_DIAS=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const weekChart=NOM_DIAS.map((nom,i)=>{
    const dd=new Date(mon);dd.setDate(mon.getDate()+i);
    const ds=dd.toISOString().slice(0,10);
    const u=calcUtilidad(ds,ds);
    return{name:nom,neta:Math.round(u.neta)};
  });

  // Gráfica: utilidad neta por mes del año actual
  const year=refDate.slice(0,4);
  const NOM_MESES=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const monthChart=NOM_MESES.map((nom,i)=>{
    const mm=String(i+1).padStart(2,"0");
    const u=calcUtilidad(year+"-"+mm+"-01",year+"-"+mm+"-31");
    return{name:nom,neta:Math.round(u.neta)};
  });

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      <Card>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:13,fontWeight:600,color:T.text}}>Selecciona fecha:</span>
          <input type="date" value={refDate} onChange={e=>setRefDate(e.target.value)} style={{fontSize:13,maxWidth:180}}/>
        </div>
        <p style={{margin:"10px 0 0",fontSize:12,color:T.textSub}}>
          Reparto sobre la utilidad neta (ventas − costo − gastos + utilidades extra): <strong>33% Marcel · 33% Gustavo · 34% reinversión</strong>.
        </p>
      </Card>

      <RepartoCard data={sem} label={weekLabel} sublabel="Reparto semanal"/>

      {/* GRÁFICA SEMANAL */}
      <Card>
        <STitle>Utilidad neta por día — {weekLabel}</STitle>
        <div style={{width:"100%",height:220}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChart} margin={{top:10,right:10,left:-10,bottom:0}}>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSub}} axisLine={{stroke:T.border}} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:T.textMuted}} axisLine={false} tickLine={false} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"k"}/>
              <Tooltip formatter={v=>$m(v)} contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.goldBorder}`}}/>
              <Bar dataKey="neta" radius={[6,6,0,0]}>
                {weekChart.map((e,i)=><Cell key={i} fill={e.neta>=0?T.profit:T.expense}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <RepartoCard data={mes} label={monthLabel} sublabel="Resumen mensual"/>

      {/* GRÁFICA MENSUAL */}
      <Card>
        <STitle>Utilidad neta por mes — {year}</STitle>
        <div style={{width:"100%",height:240}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthChart} margin={{top:10,right:10,left:-10,bottom:0}}>
              <XAxis dataKey="name" tick={{fontSize:10,fill:T.textSub}} axisLine={{stroke:T.border}} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:T.textMuted}} axisLine={false} tickLine={false} tickFormatter={v=>"$"+(v/1000).toFixed(0)+"k"}/>
              <Tooltip formatter={v=>$m(v)} contentStyle={{fontSize:12,borderRadius:8,border:`1px solid ${T.goldBorder}`}}/>
              <Bar dataKey="neta" radius={[6,6,0,0]}>
                {monthChart.map((e,i)=><Cell key={i} fill={e.name===NOM_MESES[d.getMonth()]?T.gold:(e.neta>=0?"rgba(26,140,90,0.55)":T.expense)}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ── ENVÍOS: seguimiento y pago a repartidores ─────────────────────────────────
const horaAhora=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");};
function Envios({sales,setSales,clients,isAdmin,user}){
  const[period,setPeriod]=useState("dia");
  const[refDate,setRefDate]=useState(today());
  const[payCon,setPayCon]=useState({});
  const cuentasPago=isAdmin?CUENTAS:["Efectivo"];
  const range=period==="dia"?{start:refDate,end:refDate}:period==="semana"?(()=>{const st=weekStartOf(refDate);const e=new Date(st+"T12:00:00");e.setDate(e.getDate()+6);return{start:st,end:ymd(e)};})():{start:refDate.slice(0,7)+"-01",end:refDate.slice(0,7)+"-31"};
  const envAll=sales.filter(s=>s.conEnvio);
  const env=envAll.filter(s=>s.date>=range.start&&s.date<=range.end).sort((a,b)=>b.date.localeCompare(a.date));
  const pend=envAll.filter(s=>!s.envioPagado);
  const debe=envAll.filter(s=>s.envioContra&&!s.envioDineroRecibido);
  const porRepDebe={};debe.forEach(s=>{const k=s.repartidor||"Sin nombre";(porRepDebe[k]=porRepDebe[k]||[]).push(s);});
  const recibir=ids=>{const set=new Set(ids);const h=horaAhora();setSales(prev=>prev.map(s=>set.has(s.id)?{...s,envioDineroRecibido:true,envioDineroHora:h,envioDineroFecha:today(),envioDineroPor:user?.name||""}:s));};
  const upd=(id,patch)=>setSales(prev=>prev.map(s=>s.id===id?{...s,...patch}:s));
  const pagar=(ids,con)=>{const set=new Set(ids);setSales(prev=>prev.map(s=>set.has(s.id)?{...s,envioPagado:true,envioPagadoCon:con,envioPagadoFecha:today(),envioPagadoPor:user?.name||""}:s));};
  const porRep={};pend.forEach(s=>{const k=s.repartidor||"Sin nombre";(porRep[k]=porRep[k]||[]).push(s);});
  const sum=(arr,f)=>arr.reduce((a,s)=>a+(+s[f]||0),0);
  const cobrado=sum(env,"envio"),costo=sum(env,"costoEnvio"),absorbido=costo-cobrado;
  const ST={pendiente:{l:"⏳ Por salir",c:"#B86010"},salio:{l:"🛵 En camino",c:T.client},entregado:{l:"✓ Entregado",c:T.profit}};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {debe.length>0&&(
        <Card style={{borderColor:T.profit,borderWidth:1}}>
          <STitle right={<span style={{fontWeight:700,color:T.profit}}>{$m(sum(debe,"envioDebe"))}</span>}>💵 Te tienen que entregar</STitle>
          <p style={{margin:"-4px 0 10px",fontSize:11,color:T.textMuted}}>Efectivo que cobraron los repartidores (ya descontado su envío).</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.entries(porRepDebe).map(([rep,arr])=>(
              <div key={rep} style={{padding:10,borderRadius:10,border:"1px solid rgba(26,140,90,0.3)",background:"rgba(26,140,90,0.05)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><p style={{margin:0,fontWeight:700,fontSize:14}}>🛵 {rep}</p><p style={{margin:0,fontSize:11,color:T.textMuted}}>{arr.length} pedido{arr.length!==1?"s":""} contra entrega</p></div>
                  <span style={{fontWeight:700,fontSize:16,color:T.profit}}>{$m(sum(arr,"envioDebe"))}</span>
                </div>
                <GoldBtn onClick={()=>recibir(arr.map(s=>s.id))} style={{marginTop:8,width:"100%",minHeight:44,background:T.profit}}>✓ Ya me entregó {$m(sum(arr,"envioDebe"))}</GoldBtn>
              </div>
            ))}
          </div>
        </Card>
      )}

      {pend.length>0&&(
        <Card style={{borderColor:T.expense,borderWidth:1}}>
          <STitle right={<span style={{fontWeight:700,color:T.expense}}>{$m(sum(pend,"costoEnvio"))}</span>}>Por pagar a repartidores</STitle>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {Object.entries(porRep).map(([rep,arr])=>(
              <div key={rep} style={{padding:10,borderRadius:10,border:"1px solid rgba(192,64,64,0.25)",background:"rgba(192,64,64,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><p style={{margin:0,fontWeight:700,fontSize:14}}>🛵 {rep}</p><p style={{margin:0,fontSize:11,color:T.textMuted}}>{arr.length} viaje{arr.length!==1?"s":""} · {sum(arr,"envioKm")} km</p></div>
                  <span style={{fontWeight:700,fontSize:16,color:T.expense}}>{$m(sum(arr,"costoEnvio"))}</span>
                </div>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <select value={payCon[rep]||"Efectivo"} onChange={e=>setPayCon({...payCon,[rep]:e.target.value})} style={{flex:1}}>
                    {cuentasPago.map(c=><option key={c} value={c}>{CUENTA_LABEL[c]}</option>)}
                  </select>
                  <GoldBtn onClick={()=>pagar(arr.map(s=>s.id),payCon[rep]||"Efectivo")} style={{minHeight:44}}>✓ Pagar todo</GoldBtn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          {[["dia","Día"],["semana","Semana"],["mes","Mes"]].map(([v,l])=>(
            <button key={v} onClick={()=>setPeriod(v)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${period===v?T.client:T.border}`,background:period===v?T.client:"transparent",color:period===v?"#fff":T.textSub,fontSize:12,fontWeight:period===v?600:400}}>{l}</button>
          ))}
          <input type="date" value={refDate} onChange={e=>setRefDate(e.target.value)} style={{flex:1,minWidth:140}}/>
        </div>
      </Card>

      {isAdmin&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <KCard icon="ti-motorbike" label="Envíos" value={env.length} sub={sum(env,"envioKm")+" km en total"} color={T.client}/>
          <KCard icon="ti-cash" label="Cobrado a clientes" value={$m(cobrado)} color={T.revenue}/>
          <KCard icon="ti-receipt" label="Costo repartidores" value={$m(costo)} color={T.cost}/>
          <KCard icon="ti-trending-down" label={absorbido>=0?"Absorbido por ustedes":"Ganancia en envíos"} value={$m(Math.abs(absorbido))} sub={costo>0?pct(Math.max(0,absorbido)/costo*100)+" del costo":""} color={absorbido>0?T.expense:T.profit}/>
        </div>
      )}

      <Card>
        <STitle>Envíos ({env.length})</STitle>
        {env.length===0?<Empty icon="ti-motorbike" text="Sin envíos en este periodo"/>:(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {env.map(s=>{
              const cl=clients.find(c=>c.id===s.clientId);const st=ST[s.envioStatus||"pendiente"]||ST.pendiente;
              return(
                <div key={s.id} style={{padding:12,borderRadius:10,border:`1px solid ${T.border}`,background:T.bgRow}}>
                  <div style={{display:"flex",justifyContent:"space-between",gap:8}}>
                    <div style={{minWidth:0}}>
                      <p style={{margin:0,fontWeight:700,fontSize:14}}>{cl?.name||"Cliente"}</p>
                      <p style={{margin:0,fontSize:11,color:T.textMuted}}>{s.date}{s.envioDir?" · "+s.envioDir:""}</p>
                      <p style={{margin:"2px 0 0",fontSize:12,color:T.textSub}}>🛵 {s.repartidor||"Sin nombre"} · {s.envioKm||0} km</p>
                    </div>
                    <Chip label={st.l} bg={st.c+"18"} color={st.c}/>
                  </div>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8,fontSize:12}}>
                    <span>Cliente pagó: <strong style={{color:T.revenue}}>{$m(s.envio||0)}</strong></span>
                    <span>Repartidor: <strong style={{color:T.cost}}>{$m(s.costoEnvio||0)}</strong></span>
                    {isAdmin&&(s.envioNeto||0)>0&&<span>Absorbes: <strong style={{color:T.expense}}>{$m(s.envioNeto)}</strong></span>}
                  </div>
                  <div style={{fontSize:11,color:T.textMuted,marginTop:4}}>
                    {s.envioSalio&&<span>Salió {s.envioSalio} </span>}{s.envioEntregado&&<span>· Entregado {s.envioEntregado} </span>}
                    <span>· {s.envioContra?"💵 Contra entrega (se cobró su envío)":s.envioPagado?"✓ Repartidor pagado"+(s.envioPagadoCon?" ("+s.envioPagadoCon+")":""):"⏳ Falta pagar al repartidor"}</span>
                    {s.envioContra&&<div style={{marginTop:2,color:s.envioDineroRecibido?T.profit:T.expense,fontWeight:600}}>{s.envioDineroRecibido?"✓ Entregó "+$m(s.envioDebe||0)+" a las "+s.envioDineroHora:"⏳ Te debe entregar "+$m(s.envioDebe||0)}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,marginTop:8}}>
                    {(s.envioStatus||"pendiente")==="pendiente"&&<GoldBtn onClick={()=>upd(s.id,{envioStatus:"salio",envioSalio:horaAhora()})} style={{flex:1,minHeight:40,background:T.client}}>🛵 Ya salió</GoldBtn>}
                    {s.envioStatus==="salio"&&<GoldBtn onClick={()=>upd(s.id,{envioStatus:"entregado",envioEntregado:horaAhora()})} style={{flex:1,minHeight:40,background:T.profit}}>✓ Entregado</GoldBtn>}
                    {!s.envioPagado&&<OutBtn onClick={()=>pagar([s.id],"Efectivo")} style={{flex:1,minHeight:40}}>💵 Pagarle en efectivo</OutBtn>}
                    {s.envioContra&&!s.envioDineroRecibido&&<OutBtn onClick={()=>recibir([s.id])} style={{flex:1,minHeight:40,color:T.profit,borderColor:"rgba(26,140,90,0.4)"}}>✓ Ya entregó el dinero</OutBtn>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <p style={{margin:0,fontSize:11,color:T.textMuted,textAlign:"center"}}>La cuota semanal de la plataforma de repartidores está en Gastos → Gastos fijos.</p>
    </div>
  );
}


// ── PALOMITAS (POS rápido) ────────────────────────────────────────────────────
function Palomitas({sales,setSales,popCfg,setPopCfg,user,isAdmin}){
  const[qty,setQty]=useState({s:0,m:0,l:0});
  const[pay,setPay]=useState("Efectivo");
  const[okMsg,setOkMsg]=useState("");
  const[showCfg,setShowCfg]=useState(false);
  const[cfgForm,setCfgForm]=useState(null);
  const[confirmDel,setConfirmDel]=useState(null);

  const count=POP_SIZES.reduce((a,k)=>a+qty[k],0);
  const total=POP_SIZES.reduce((a,k)=>a+qty[k]*(+popCfg[k].price||0),0);
  const cost=POP_SIZES.reduce((a,k)=>a+qty[k]*popUnitCost(popCfg[k]),0);
  const add=(k,d)=>setQty(q=>({...q,[k]:Math.max(0,q[k]+d)}));

  const cobrar=()=>{
    if(count===0)return;
    const items=POP_SIZES.filter(k=>qty[k]>0).map(k=>({pid:"pop_"+k,qty:qty[k],su:"pieza",price:+popCfg[k].price||0}));
    const desc="🍿 "+POP_SIZES.filter(k=>qty[k]>0).map(k=>qty[k]+"× "+popCfg[k].name).join(", ");
    const comision=pay==="Terminal MP"?+(total*TERMINAL_FEE).toFixed(2):0;
    setSales(prev=>[...prev,{id:uid(),date:today(),tipo:"palomitas",clientId:"",pkgId:null,total,cost:cost+comision,comision,desc,items,note:"",payMethod:pay,
      mixEfectivo:0,mixTransferencia:0,mixCuenta:"",envio:0,costoEnvio:0,envioTipo:"ninguno",envioDesc:"",by:user?.name||""}]);
    setQty({s:0,m:0,l:0});setPay("Efectivo");
    setOkMsg("✓ Cobrado "+$m(total));
    setTimeout(()=>setOkMsg(""),2500);
  };

  const hoy=today();
  const mes=hoy.slice(0,7);
  const popSales=sales.filter(s=>s.tipo==="palomitas");
  const popHoy=popSales.filter(s=>s.date===hoy);
  const popMes=popSales.filter(s=>s.date.slice(0,7)===mes);
  const unidades=(arr,k)=>arr.reduce((a,s)=>a+(s.items||[]).filter(i=>i.pid==="pop_"+k).reduce((b,i)=>b+(+i.qty||0),0),0);
  const sum=(arr,f)=>arr.reduce((a,s)=>a+(s[f]||0),0);
  const hayCostos=POP_SIZES.some(k=>popUnitCost(popCfg[k])>0);
  const SIZE_EMOJI={s:22,m:32,l:44};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      <Card>
        <STitle>🍿 Vender palomitas</STitle>
        <p style={{margin:"0 0 12px",fontSize:12,color:T.textSub}}>Toca el tamaño para agregar. Usa − para quitar.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {POP_SIZES.map(k=>{
            const c=popCfg[k];const on=qty[k]>0;
            return(
              <div key={k} style={{borderRadius:12,border:`2px solid ${on?T.gold:T.goldBorder}`,background:on?T.goldBg:T.bg,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                <button onClick={()=>add(k,1)} style={{border:"none",borderRadius:0,background:"transparent",padding:"14px 4px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,minHeight:120,justifyContent:"flex-end"}}>
                  <span style={{fontSize:SIZE_EMOJI[k],lineHeight:1}}>🍿</span>
                  <span style={{fontSize:13,fontWeight:700,color:T.text}}>{c.name}</span>
                  <span style={{fontSize:15,fontWeight:700,color:T.revenue}}>{$m(c.price).replace(".00","")}</span>
                </button>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:`1px solid ${T.goldBorder}`}}>
                  <button onClick={()=>add(k,-1)} disabled={!on} style={{border:"none",borderRadius:0,flex:1,fontSize:20,fontWeight:700,color:on?T.expense:T.textMuted,minHeight:44}}>−</button>
                  <span style={{minWidth:28,textAlign:"center",fontSize:18,fontWeight:700,color:on?T.goldText:T.textMuted}}>{qty[k]}</span>
                  <button onClick={()=>add(k,1)} style={{border:"none",borderRadius:0,flex:1,fontSize:20,fontWeight:700,color:T.profit,minHeight:44}}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{margin:"16px 0 6px",fontSize:11,fontWeight:600,color:T.textSub,letterSpacing:"0.04em"}}>¿CÓMO PAGÓ?</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>
          {["Efectivo","Terminal MP","SPIN Marcel","SPIN Gustavo","Transferencia MP"].map(m=>{
            const on=pay===m;const pc=PAY_CLR[m];
            return <button key={m} onClick={()=>setPay(m)} style={{border:`2px solid ${on?pc.c:T.border}`,background:on?pc.bg:"transparent",color:on?pc.c:T.textSub,fontWeight:on?700:500,fontSize:12,minHeight:44,padding:"6px 4px"}}>{PAY_METHODS_LABEL[m]}</button>;
          })}
        </div>

        <button onClick={cobrar} disabled={count===0} style={{marginTop:16,width:"100%",minHeight:56,border:"none",borderRadius:12,background:count>0?T.profit:"#E8E0D0",color:"#fff",fontSize:18,fontWeight:700}}>
          {count>0?"Cobrar "+$m(total)+" · "+count+" pz":"Selecciona un tamaño"}
        </button>
        {okMsg&&<div style={{marginTop:8,padding:"10px 14px",background:"rgba(26,140,90,0.1)",border:"1px solid rgba(26,140,90,0.3)",borderRadius:8,fontSize:14,color:T.profit,fontWeight:700,textAlign:"center"}}>{okMsg}</div>}
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <KCard icon="ti-calendar" label="Vendido hoy" value={$m(sum(popHoy,"total"))} sub={POP_SIZES.map(k=>unidades(popHoy,k)+" "+popCfg[k].name.slice(0,3).toLowerCase()+".").join(" · ")} color={T.revenue}/>
        <KCard icon="ti-calendar-month" label="Vendido este mes" value={$m(sum(popMes,"total"))} sub={POP_SIZES.map(k=>unidades(popMes,k)+" "+popCfg[k].name.slice(0,3).toLowerCase()+".").join(" · ")} color={T.client}/>
        {isAdmin&&hayCostos&&<KCard icon="ti-sparkles" label="Utilidad hoy" value={$m(sum(popHoy,"total")-sum(popHoy,"cost"))} color={T.profit}/>}
        {isAdmin&&hayCostos&&<KCard icon="ti-sparkles" label="Utilidad del mes" value={$m(sum(popMes,"total")-sum(popMes,"cost"))} color={T.profit}/>}
      </div>

      <Card>
        <STitle>Ventas de hoy ({popHoy.length})</STitle>
        {popHoy.length===0?<Empty icon="ti-receipt" text="Aún no hay ventas de palomitas hoy"/>:(
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {[...popHoy].reverse().map(s=>{
              const pc=PAY_CLR[s.payMethod]||{};
              return(
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:`0.5px solid ${T.border}`,background:T.bgRow}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:0,fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.desc}</p>
                    <Chip label={s.payMethod} bg={pc.bg} color={pc.c}/>
                    {s.by&&<span style={{fontSize:10,color:T.textMuted,marginLeft:6}}>{s.by}</span>}
                  </div>
                  <span style={{fontWeight:700,fontSize:15,color:T.revenue}}>{$m(s.total)}</span>
                  {!isAdmin?null:confirmDel===s.id?(
                    <>
                      <button onClick={()=>{setSales(prev=>prev.filter(x=>x.id!==s.id));setConfirmDel(null);}} style={{fontSize:11,background:T.expense,color:"#fff",border:"none",fontWeight:600,padding:"4px 8px"}}>Borrar</button>
                      <button onClick={()=>setConfirmDel(null)} style={{fontSize:11,padding:"4px 8px"}}>No</button>
                    </>
                  ):(
                    <OutBtn onClick={()=>setConfirmDel(s.id)} danger style={{fontSize:11,padding:"4px 8px"}}>🗑️</OutBtn>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {isAdmin&&<Card>
        <STitle right={!showCfg&&<OutBtn onClick={()=>{setCfgForm(JSON.parse(JSON.stringify(popCfg)));setShowCfg(true);}} style={{fontSize:11}}>⚙️ Editar</OutBtn>}>Precios y costos</STitle>
        {!showCfg?(
          <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
            <TH cols={["Tamaño","Precio","Vaso","Insumos","Utilidad"]}/>
            <tbody>
              {POP_SIZES.map(k=>{const c=popCfg[k];const u=c.price-popUnitCost(c);return(
                <tr key={k} style={{borderBottom:`0.5px solid ${T.border}`}}>
                  <td style={{padding:"8px 10px",fontWeight:600}}>{c.name}</td>
                  <td style={{padding:"8px 10px",color:T.revenue,fontWeight:600}}>{$m(c.price)}</td>
                  <td style={{padding:"8px 10px",color:T.cost}}>{$m(c.vaso||0)}</td>
                  <td style={{padding:"8px 10px",color:c.cost>0?T.cost:T.textMuted}}>{c.cost>0?$m(c.cost):"falta"}</td>
                  <td style={{padding:"8px 10px",color:T.profit,fontWeight:700}}>{$m(u)+" ("+pct(u/c.price*100)+")"}{!(c.cost>0)&&<div style={{fontSize:10,color:T.textMuted,fontWeight:400}}>solo con vaso</div>}</td>
                </tr>
              );})}
            </tbody>
          </table>
        ):(
          <>
            {POP_SIZES.map(k=>(
              <div key={k} style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:12,paddingBottom:12,borderBottom:`0.5px solid ${T.border}`}}>
                <F label="Tamaño"><input value={cfgForm[k].name} onChange={e=>setCfgForm({...cfgForm,[k]:{...cfgForm[k],name:e.target.value}})}/></F>
                <F label="Precio ($)"><input type="number" min="0" value={cfgForm[k].price} onChange={e=>setCfgForm({...cfgForm,[k]:{...cfgForm[k],price:e.target.value}})}/></F>
                <F label="Vaso / bolsita ($)"><input type="number" min="0" step="0.01" value={cfgForm[k].vaso} onChange={e=>setCfgForm({...cfgForm,[k]:{...cfgForm[k],vaso:e.target.value}})}/></F>
                <F label="Insumos ($)"><input type="number" min="0" step="0.01" value={cfgForm[k].cost} onChange={e=>setCfgForm({...cfgForm,[k]:{...cfgForm[k],cost:e.target.value}})}/></F>
              </div>
            ))}
            <p style={{margin:"0 0 10px",fontSize:11,color:T.textMuted}}>Insumos = lo que se va en cada tamaño de maíz, aceite, sal, mantequilla… Los cambios aplican a ventas nuevas.</p>
            <div style={{display:"flex",gap:8}}>
              <GoldBtn onClick={()=>{const n={};POP_SIZES.forEach(k=>{n[k]={name:cfgForm[k].name.trim()||INIT_POP[k].name,price:+cfgForm[k].price||0,cost:+cfgForm[k].cost||0,vaso:+cfgForm[k].vaso||0};});setPopCfg(n);setShowCfg(false);}}>Guardar</GoldBtn>
              <OutBtn onClick={()=>setShowCfg(false)}>Cancelar</OutBtn>
            </div>
          </>
        )}
      </Card>}
    </div>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
// admin:true = solo socios. s = nombre corto para el menú de abajo. e = emoji en vez de ícono.
const TABS=[
  {k:"dash", l:"Inicio",        s:"Inicio",  icon:"ti-home",          color:T.revenue, admin:true},
  {k:"venta",l:"Nueva venta",   s:"Vender",  icon:"ti-shopping-cart", color:T.profit},
  {k:"pop",  l:"Palomitas",     s:"Palomitas",e:"🍿",                 color:T.revenue},
  {k:"corte",l:"Corte de caja", s:"Caja",    icon:"ti-report-money",  color:T.profit,  admin:true},
  {k:"envios",l:"Envíos",       s:"Envíos",  icon:"ti-motorbike",     color:T.client},
  {k:"inv",  l:"Inventario",    s:"Inventario",icon:"ti-package",     color:T.client},
  {k:"gasto",l:"Gastos",        s:"Gastos",  icon:"ti-wallet",        color:T.expense},
  {k:"cli",  l:"Clientes",      s:"Clientes",icon:"ti-users",         color:T.client},
  {k:"prod", l:"Productos y costos",s:"Productos",icon:"ti-droplet-half-2",color:T.cost,admin:true},
  {k:"pkgs", l:"Paquetes",      s:"Paquetes",icon:"ti-packages",      color:T.pkg,     admin:true},
  {k:"reparto",l:"Reparto de utilidades",s:"Reparto",icon:"ti-users-group",color:T.pkg,admin:true},
];
// Qué va fijo en la barra de abajo; lo demás queda en "Más"
const NAV_MAIN={admin:["dash","venta","pop","corte"],staff:["venta","pop","inv","gasto","cli"]};

function TabIcon({t,size,color}){
  if(t.e)return <span style={{fontSize:size-2,lineHeight:1}}>{t.e}</span>;
  return <i className={"ti "+t.icon} style={{fontSize:size,color}}/>;
}

function BottomNav({tabs,mainKeys,tab,setTab}){
  const[more,setMore]=useState(false);
  const main=mainKeys.map(k=>tabs.find(t=>t.k===k)).filter(Boolean);
  const rest=tabs.filter(t=>!mainKeys.includes(t.k));
  const inRest=rest.some(t=>t.k===tab);
  const go=k=>{setTab(k);setMore(false);window.scrollTo(0,0);};
  return(
    <>
      {more&&(
        <div onClick={()=>setMore(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:900}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",left:0,right:0,bottom:0,background:T.bg,borderRadius:"18px 18px 0 0",padding:"16px 16px calc(84px + env(safe-area-inset-bottom))",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:600,margin:"0 auto"}}>
            {rest.map(t=>(
              <button key={t.k} onClick={()=>go(t.k)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 4px",borderRadius:12,border:`1px solid ${tab===t.k?t.color:T.goldBorder}`,background:tab===t.k?T.goldBg:T.bgCard,color:T.text,fontSize:12,fontWeight:600}}>
                <TabIcon t={t} size={24} color={t.color}/>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      )}
      <nav style={{position:"fixed",left:0,right:0,bottom:0,zIndex:950,background:T.bg,borderTop:`1px solid ${T.goldBorder}`,boxShadow:"0 -2px 12px rgba(0,0,0,0.05)",paddingBottom:"env(safe-area-inset-bottom)"}}>
        <div style={{display:"flex",maxWidth:600,margin:"0 auto"}}>
          {main.map(t=>{const on=tab===t.k&&!more;return(
            <button key={t.k} onClick={()=>go(t.k)} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"8px 2px 6px",minHeight:60,display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:on?t.color:T.textMuted,fontSize:11,fontWeight:on?700:500,borderTop:on?`3px solid ${t.color}`:"3px solid transparent"}}>
              <TabIcon t={t} size={22} color={on?t.color:T.textMuted}/>
              {t.s}
            </button>
          );})}
          {rest.length>0&&(
            <button onClick={()=>setMore(!more)} style={{flex:1,border:"none",borderRadius:0,background:"transparent",padding:"8px 2px 6px",minHeight:60,display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:more||inRest?T.gold:T.textMuted,fontSize:11,fontWeight:more||inRest?700:500,borderTop:more||inRest?`3px solid ${T.gold}`:"3px solid transparent"}}>
              <i className="ti ti-dots" style={{fontSize:22}}/>
              Más
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
function Dashboard_App({user,onLogout}){
  const isAdmin=user.role==="admin";
  const myTabs=TABS.filter(t=>isAdmin||!t.admin);
  const[tab,setTab]=useState(isAdmin?"dash":"venta");
  const[prods,setProds]=useState([]);
  const[pkgs,setPkgs]=useState([]);
  const[clients,setClients]=useState([]);
  const[sales,setSales]=useState([]);
  const[expenses,setExpenses]=useState([]);
  const[stockMoves,setStockMoves]=useState([]);
  const[extras,setExtras]=useState([]);
  const[popCfg,setPopCfg]=useState(INIT_POP);
  const[fixed,setFixed]=useState(INIT_FIXED);
  const[ready,setReady]=useState(false);
  const[leaving,setLeaving]=useState(false);

  useEffect(()=>{
    (async()=>{
      let[p,pk,c,s,e,sm,ex,pop,fx]=await Promise.all([load(SK.p,INIT_PRODS),load(SK.pk,INIT_PKGS),load(SK.c,[]),load(SK.s,[]),load(SK.e,[]),load(SK.sm,[]),load(SK.ex,[]),load(SK.pop,INIT_POP),load(SK.fx,INIT_FIXED)]);
      // Merge new products
      const ids=new Set(p.map(x=>x.id));
      INIT_PRODS.forEach(ip=>{if(!ids.has(ip.id))p.push(ip);});
      // Apply latest names/structure but RESPECT user-edited costs
      // Only set cost if the product doesn't have one yet (new products)
      p=p.map(x=>{const ip=INIT_PRODS.find(i=>i.id===x.id);if(!ip)return x;return{...x,name:ip.name,spc:ip.spc,tiers:ip.tiers,cost:(x.cost!=null&&x.cost>0)?x.cost:ip.cost};});
      // Migrate old stock field
      p=p.map(x=>{if(x.stockCajas!=null)return x;const spc=x.spc||1;const old=x.stock||0;return{...x,stockCajas:Math.floor(old/spc),stockSobres:old%spc,stock:undefined};});
      // Fix categories
      const fix=new Set(["gom","gom_f","gom_m","rchv","rhch"]);
      p=p.filter(x=>x.id!=="gom"&&x.id!=="pp12");
      p=p.map(x=>fix.has(x.id)?{...x,cat:"Miel"}:x);
      setProds(p);setPkgs(pk);setClients(c);setSales(s);setExpenses(e);setStockMoves(sm);setExtras(ex);
      // Igual que con productos: el default de insumos solo entra si no hay costo capturado (0 o vacío)
      const popM={};POP_SIZES.forEach(k=>{const st=(pop||{})[k]||{};popM[k]={...INIT_POP[k],...st,cost:(+st.cost>0)?+st.cost:INIT_POP[k].cost};});
      setPopCfg(popM);
      // Fijos: guardado como {v,items}. Si viene de una versión anterior, se agregan los fijos nuevos
      // por default que falten (sin tocar montos que ya editaron). Después se respetan tal cual.
      const fxItems=Array.isArray(fx)?fx:(fx&&Array.isArray(fx.items)?fx.items:INIT_FIXED);
      const fxVer=Array.isArray(fx)?1:(fx&&fx.v)||1;
      setFixed(fxVer>=FIXED_VER?fxItems:[...fxItems,...INIT_FIXED.filter(d=>!fxItems.some(x=>x.id===d.id))]);
      setReady(true);
    })();
  },[]);

    useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.p,prods),800);return()=>clearTimeout(t);}},[prods,ready]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.pk,pkgs),800);return()=>clearTimeout(t);}},[pkgs,ready]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.c,clients),800);return()=>clearTimeout(t);}},[clients,ready]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.s,sales),800);return()=>clearTimeout(t);}},[sales,ready]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.e,expenses),800);return()=>clearTimeout(t);}},[expenses,ready]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.sm,stockMoves),800);return()=>clearTimeout(t);}},[stockMoves,ready]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.ex,extras),800);return()=>clearTimeout(t);}},[extras,ready]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.pop,popCfg),800);return()=>clearTimeout(t);}},[popCfg,ready]);
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.fx,{v:FIXED_VER,items:fixed}),800);return()=>clearTimeout(t);}},[fixed,ready]);

  if(!ready)return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"3rem",gap:12,color:T.textSub}}>
      <Logo size={48}/>
      <p style={{margin:0,fontSize:13}}>Cargando tu dashboard…</p>
    </div>
  );

  // Solo lectura para reportes: lo anterior al arranque se conserva guardado pero no se cuenta
  const repSales=sales.filter(s=>s.date>=INICIO_OPERACION);
  const repExpenses=expenses.filter(e=>e.date>=INICIO_OPERACION);
  const repExtras=extras.filter(x=>x.date>=INICIO_OPERACION);
  const props={prods,setProds,pkgs,setPkgs,clients,setClients,sales,setSales,expenses,setExpenses,stockMoves,setStockMoves,extras,setExtras,user,isAdmin,fixed,setFixed,goTab:setTab};
  const warn=isAdmin&&prods.some(p=>p.cost===0);
  const cur=myTabs.find(t=>t.k===tab)||myTabs[0];
  const can=k=>myTabs.some(t=>t.k===k);
  // Al salir se desmonta todo y el debounce de 800 ms se cancelaría: guardamos todo antes
  const logout=async()=>{
    if(leaving)return;
    setLeaving(true);
    await Promise.all([save(SK.p,prods),save(SK.pk,pkgs),save(SK.c,clients),save(SK.s,sales),save(SK.e,expenses),save(SK.sm,stockMoves),save(SK.ex,extras),save(SK.pop,popCfg),save(SK.fx,{v:FIXED_VER,items:fixed})]);
    onLogout();
  };

  return(
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:T.bg,paddingBottom:"calc(84px + env(safe-area-inset-bottom))"}}>
      <div style={{borderBottom:`2px solid ${T.goldBorder}`,marginBottom:"1rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0 8px"}}>
          <Logo size={32}/>
          <div style={{minWidth:0}}>
            <p style={{margin:0,fontWeight:700,fontSize:14,color:T.text,letterSpacing:"0.05em"}}>MY SECRET PASSION MX</p>
            <p style={{margin:0,fontSize:17,color:cur.color,fontWeight:700}}>{cur.l}</p>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
            {warn&&tab!=="prod"&&(
              <button onClick={()=>setTab("prod")} style={{fontSize:11,background:T.goldBg,color:T.goldText,border:`1px solid ${T.goldBorder}`,borderRadius:20,padding:"4px 10px",fontWeight:600,minHeight:30}}>
                ⚠️ Costos
              </button>
            )}
            <button onClick={logout} title="Cambiar de usuario" style={{fontSize:11,color:T.textSub,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 10px",minHeight:30,whiteSpace:"nowrap"}}>
              {leaving?"Guardando…":user.name+" · Salir"}
            </button>
          </div>
        </div>
      </div>
      {cur.k==="dash"  && <Dashboard  {...props} sales={repSales} expenses={repExpenses}/>}
      {cur.k==="prod"  && <Productos  {...props}/>}
      {cur.k==="pkgs"  && <Paquetes   {...props}/>}
      {cur.k==="cli"   && <Clientes   {...props}/>}
      {cur.k==="venta" && <NuevaVenta {...props}/>}
      {cur.k==="pop"   && <Palomitas sales={sales} setSales={setSales} popCfg={popCfg} setPopCfg={setPopCfg} user={user} isAdmin={isAdmin}/>}
      {cur.k==="gasto" && <Gastos     {...props}/>}
      {cur.k==="envios"&& <Envios     {...props}/>}
      {cur.k==="inv"   && <Inventario {...props}/>}
      {cur.k==="corte" && can("corte") && <CorteCaja  sales={repSales} expenses={repExpenses} extras={extras} setExtras={setExtras} user={user}/>}
      {cur.k==="reparto" && can("reparto") && <Reparto sales={repSales} expenses={repExpenses} extras={repExtras}/>}
      <BottomNav tabs={myTabs} mainKeys={NAV_MAIN[user.role]||NAV_MAIN.staff} tab={cur.k} setTab={setTab}/>
    </div>
  );
}


export default function App() {
  const [user, setUser] = useState(()=>{
    try { const id=sessionStorage.getItem("msp_user"); return USERS.find(u=>u.id===id)||null; } catch { return null; }
  });
  if (!user) return <LoginScreen onLogin={u=>{ try{sessionStorage.setItem("msp_user",u.id);}catch{} setUser(u); }}/>;
  return <Dashboard_App key={user.id} user={user} onLogout={()=>{ try{sessionStorage.removeItem("msp_user");}catch{} setUser(null); }}/>;
}
