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
  // Solo en pruebas locales: con VITE_NO_SAVE=1 en .env.local no se escribe nada en Supabase
  if (import.meta.env.DEV && import.meta.env.VITE_NO_SAVE === "1") return;
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
const SK = { p:"msp-p4",pk:"msp-pk4",c:"msp-c4",s:"msp-s4",e:"msp-e4",sm:"msp-sm4",ex:"msp-ex4",pop:"msp-pop4",fx:"msp-fx4",ci:"msp-ci4" };
const load = dbLoad;
const save = dbSave;

// ── UTILS ─────────────────────────────────────────────────────────────────────
const $m = n => "$"+Number(n).toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2});
const pct = n => Number(n).toFixed(1)+"%";
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,5);
// Fecha local (Monterrey), no UTC: con toISOString después de las 6 pm ya salía el día siguiente
const today = () => { const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
// Costo de un sobre (o pieza) = lo que nos cuesta la caja ÷ sobres de la caja. Se usa en ventas por sobre,
// cortesías e inventario, así al cambiar el costo de la caja se actualiza solo.
const sobreCost=p=>p?((p.spc||1)>1?(p.cost||0)/(p.spc||1):(p.cost||0)):0;
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
  {id:"gom_f",name:"Gomitas Bliss Bears — Mujer",        cat:"Miel",    unit:"caja", spc:6,  cost:130, list:400, tiers:TD,costSobre:22,listSobre:150,stockCajas:0,stockSobres:0,spcu:"piezas"},
  {id:"gom_m",name:"Gomitas Boner Bears — Hombre",       cat:"Miel",    unit:"caja", spc:6,  cost:130, list:400, tiers:TD,costSobre:22,listSobre:150,stockCajas:0,stockSobres:0,spcu:"piezas"},
  {id:"rchv",name:"Royal Choco VIP",                    cat:"Miel",    unit:"caja", spc:12, cost:290, list:1250,tiers:TC,listSobre:200,stockCajas:0,stockSobres:0},
  {id:"rhch",name:"Rhino Choco",                        cat:"Miel",    unit:"caja", spc:12, cost:290, list:1250,tiers:TC,listSobre:200,stockCajas:0,stockSobres:0},
  {id:"ppch",name:"Pink Pussycat Choco",                cat:"Miel",    unit:"caja", spc:12, cost:290, list:1250,tiers:TC,listSobre:200,stockCajas:0,stockSobres:0},
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
// Sin "Repartidores" (sale de Envíos), "Comisiones terminal" (se calcula sola) ni "Merma / regalos" (las
// cortesías se restan en la venta): registrarlos aquí los contaría doble.
const EXP_CATS=["Renta local","Sueldos","Aguinaldo (apartado)","Plan celular","Repartidor fijo","Publicidad","Insumos palomitas","Bolsas / empaques","Merma (producto dañado)","Gasolina","Importación","Otro"];

// Gastos fijos: solo los socios los ven y registran
const FIXED_CATS=["Renta local","Sueldos","Aguinaldo (apartado)","Plan celular","Repartidor fijo","Publicidad"];
// Aguinaldo: ley = mínimo 15 días de sueldo. $2,000/7 días × 15 = $4,285.71 al año → se aparta cada mes
// ver = versión de la lista en que se agregó ese default (para agregarlo una sola vez a lo ya guardado)
const INIT_FIXED=[
  {id:"renta",     name:"Renta del local",       cat:"Renta local",          amount:7859,   freq:"mensual", ver:1},
  {id:"sueldo",    name:"Sueldo empleado",       cat:"Sueldos",              amount:2000,   freq:"semanal", ver:1},
  {id:"repartidor",name:"Repartidor fijo",       cat:"Repartidor fijo",      amount:1000,   freq:"semanal", ver:2},
  {id:"celular",   name:"Plan celular",          cat:"Plan celular",         amount:150,    freq:"mensual", ver:2},
  {id:"aguinaldo", name:"Apartado aguinaldo",    cat:"Aguinaldo (apartado)", amount:357.14, freq:"mensual", ver:2},
  {id:"publicidad",name:"Publicidad ($400 diarios)",cat:"Publicidad",        amount:2800,   freq:"semanal", ver:3},
];
// Versión de la lista de fijos: al subirla, se agregan los fijos nuevos por default una sola vez
const FIXED_VER=3;
const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const weekStartOf=ds=>{const d=new Date(ds+"T12:00:00");const w=d.getDay();d.setDate(d.getDate()-(w===0?6:w-1));return ymd(d);};
// Semanas de cobro de los fijos: bloques de 7 días a partir del arranque (1–7 oct, 8–14 oct…)
const fixedWeekStart=ds=>{const d0=new Date(INICIO_OPERACION+"T12:00:00");const d=new Date(ds+"T12:00:00");const n=Math.floor(Math.round((d-d0)/86400000)/7);const st=new Date(d0);st.setDate(d0.getDate()+n*7);return ymd(st);};
// Periodo actual de un gasto fijo: "2026-10" (mensual) o el día que empieza su semana de cobro (semanal)
const fixedPeriod=(f,ds)=>f.freq==="diario"?ds:f.freq==="semanal"?fixedWeekStart(ds):ds.slice(0,7);
const fixedPeriodLabel=(f,ds)=>{
  if(f.freq==="diario")return new Date(ds+"T12:00:00").toLocaleDateString("es-MX",{weekday:"short",day:"numeric",month:"short"});
  if(f.freq==="semanal"){const a=new Date(fixedWeekStart(ds)+"T12:00:00");const b=new Date(a);b.setDate(a.getDate()+6);
    const o={day:"numeric",month:"short"};return "semana "+a.toLocaleDateString("es-MX",o)+" – "+b.toLocaleDateString("es-MX",o);}
  return new Date(ds.slice(0,7)+"-15T12:00:00").toLocaleDateString("es-MX",{month:"long",year:"numeric"});
};
const fixedMonthly=f=>f.freq==="diario"?f.amount*365/12:f.freq==="semanal"?f.amount*52/12:f.amount;
// Periodos sin pagar hasta la fecha ds. Diario: cada día desde el arranque que no se registró (máx. 62 días
// hacia atrás), para registrar varios de un jalón. Semanal/mensual: solo el periodo actual.
const fixedMissing=(f,expenses,ds)=>{
  if(ds<INICIO_OPERACION)return[];
  const paid=new Set(expenses.filter(e=>e.fixedId===f.id).map(e=>e.period));
  if(f.freq!=="diario"){const p=fixedPeriod(f,ds);return paid.has(p)?[]:[p];}
  const out=[];const d=new Date(ds+"T12:00:00");
  for(let i=0;i<62;i++){const x=ymd(d);if(x<INICIO_OPERACION)break;if(!paid.has(x))out.push(x);d.setDate(d.getDate()-1);}
  return out.reverse();
};
// Antes del arranque no hay nada pendiente: todos los fijos se cobran por primera vez el día de arranque
const fixedPending=(fixed,expenses,ds)=>ds<INICIO_OPERACION?[]:(fixed||[]).filter(f=>fixedMissing(f,expenses,ds).length>0);

// ── PALOMITAS ─────────────────────────────────────────────────────────────────
const POP_SIZES=["s","m","l"];
// cost = insumos (maíz, aceite, sal…) · vaso = bolsita/vaso donde se sirve
const INIT_POP={s:{name:"Pequeño",price:20,cost:3,vaso:5},m:{name:"Mediano",price:35,cost:4,vaso:5},l:{name:"Grande",price:50,cost:6,vaso:5}};
const popUnitCost=c=>(+c.cost||0)+(+c.vaso||0);
// ("Tercero" ya no se ofrece; su etiqueta y color se quedan para ventas viejas)
const PAY_METHODS=["Efectivo","SPIN Marcel","SPIN Gustavo","Transferencia MP","Terminal MP","Mixto"];
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
function Dashboard({sales,expenses,extras=[],fixed,goTab,cierres=[]}){
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
    const ext=(extras||[]).filter(x=>x.date>=start&&x.date<=(end||todayStr)).reduce((a,x)=>a+x.amount,0);
    // Misma cuenta que Reparto: ventas − costo − gastos + ingresos extra
    return{rev,net:rev-cst-exp+ext,count:ss.length};
  };
  const mesData  = calcPeriod(curMonth+"-01");
  const anioData = calcPeriod(curYear+"-01-01");
  const gastosMes= expenses.filter(e=>e.date>=curMonth+"-01"&&e.date<=todayStr).reduce((a,e)=>a+e.amount,0);

  // Monthly chart — all 12 months of current year
  const MONTHS=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const byMonth=MONTHS.map((m,i)=>{
    const mm=String(i+1).padStart(2,"0");
    const start=curYear+"-"+mm+"-01";
    const end  =curYear+"-"+mm+"-31";
    return{name:m,net:+calcPeriod(start,end).net.toFixed(0)};
  });

  const nomMes=now.toLocaleDateString("es-MX",{month:"long"}).replace(/^\w/,c=>c.toUpperCase());

  const pendFijos=fixedPending(fixed,expenses,todayStr);
  const ayer=(()=>{const d=new Date(todayStr+"T12:00:00");d.setDate(d.getDate()-1);return ymd(d);})();
  const faltaCierreAyer=ayer>=INICIO_OPERACION&&!cierres.some(c=>c.date===ayer);
  const porRevisar=cierres.filter(c=>!c.revisado&&!cierreCuadra(c));

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>

      {(faltaCierreAyer||porRevisar.length>0)&&(
        <button onClick={()=>goTab&&goTab("caja")} style={{textAlign:"left",background:"rgba(192,64,64,0.07)",border:"1px solid rgba(192,64,64,0.3)",borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
          <i className="ti ti-lock-exclamation" style={{fontSize:22,color:T.expense}}/>
          <div style={{flex:1}}>
            {faltaCierreAyer&&<p style={{margin:0,fontSize:13,fontWeight:700,color:T.expense}}>No se hizo el cierre de ayer</p>}
            {porRevisar.length>0&&<p style={{margin:0,fontSize:13,fontWeight:700,color:T.expense}}>{porRevisar.length} cierre{porRevisar.length>1?"s":""} con diferencias por revisar</p>}
          </div>
          <i className="ti ti-chevron-right" style={{fontSize:18,color:T.textMuted}}/>
        </button>
      )}

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

      {/* ── KPI ── */}
      <div style={{background:mesData.net>=0?"rgba(26,140,90,0.06)":"rgba(192,64,64,0.06)",borderRadius:12,padding:"16px 18px",border:`2px solid ${mesData.net>=0?T.profit:T.expense}`}}>
        <p style={{margin:"0 0 6px",fontSize:11,fontWeight:600,color:mesData.net>=0?T.profit:T.expense,textTransform:"uppercase",letterSpacing:"0.08em"}}>Utilidad neta · {nomMes}</p>
        <p style={{margin:"0 0 2px",fontSize:30,fontWeight:700,color:mesData.net>=0?T.profit:T.expense}}>{$m(mesData.net)}</p>
        <p style={{margin:0,fontSize:12,color:T.textMuted}}>Ya descontado costo, gastos y fijos</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {[["Vendido",$m(mesData.rev),mesData.count+" venta"+(mesData.count!==1?"s":""),T.revenue],["Gastos",$m(gastosMes),nomMes,T.expense],["Utilidad del año",$m(anioData.net),"desde el arranque",T.client]].map(([l,v,sub,c])=>(
          <div key={l} style={{background:T.bgCard,borderRadius:10,padding:"10px 10px",border:`0.5px solid ${T.goldBorder}`,borderTop:`3px solid ${c}`}}>
            <p style={{margin:"0 0 4px",fontSize:10,fontWeight:600,color:T.textSub,textTransform:"uppercase"}}>{l}</p>
            <p style={{margin:0,fontSize:16,fontWeight:700,color:T.text}}>{v}</p>
            <p style={{margin:0,fontSize:10,color:T.textMuted}}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── GRÁFICA: utilidad neta por mes ── */}
      <Card>
        <STitle>Utilidad neta por mes · {curYear}</STitle>
        <div style={{height:220}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMonth} margin={{top:20,right:8,left:0,bottom:0}}>
              <XAxis dataKey="name" tick={{fontSize:11,fill:T.textSub}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip formatter={v=>[$m(v),"Utilidad neta"]} contentStyle={{background:T.bgCard,border:`1px solid ${T.goldBorder}`,borderRadius:8,fontSize:12}} cursor={{fill:"rgba(196,150,42,0.08)"}}/>
              <Bar dataKey="net" radius={[6,6,0,0]} label={{position:"top",fontSize:10,fill:T.textSub,formatter:v=>v?"$"+(v/1000).toFixed(1)+"k":""}}>
                {byMonth.map((e,i)=><Cell key={i} fill={e.net<0?T.expense:i===now.getMonth()?T.gold:"#E8C050"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ── PRODUCTOS ─────────────────────────────────────────────────────────────────
function Productos({prods,setProds}){
  const[editMode,setEditMode]=useState(false);
  const[costMap,setCostMap]=useState({});
  const[listSobreMap,setListSobreMap]=useState({});
  const cats=[...new Set(prods.map(p=>p.cat))];
  const missing=prods.filter(p=>p.cost===0).length;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {missing>0 && <div style={{background:T.goldBg,border:`1px solid ${T.goldBorder}`,borderRadius:10,padding:"10px 16px",display:"flex",alignItems:"center",gap:10,fontSize:13,color:T.goldText}}><i className="ti ti-alert-circle" style={{fontSize:18,color:T.gold}}/><span>Faltan costos en <strong>{missing} productos</strong>.</span>{!editMode&&<GoldBtn onClick={()=>{const m={};prods.forEach(p=>m[p.id]=String(p.cost));setCostMap(m);const ml={};prods.forEach(p=>{if(p.spc>1){ml[p.id]=String(p.listSobre||150);}});setListSobreMap(ml);setEditMode(true);}} style={{marginLeft:"auto",fontSize:11}}>Editar costos</GoldBtn>}</div>}
      {cats.map(cat=>(
        <Card key={cat}>
          <STitle right={!editMode&&cat===cats[0]&&<OutBtn onClick={()=>{const m={};prods.forEach(p=>m[p.id]=String(p.cost));setCostMap(m);const ml={};prods.forEach(p=>{if(p.spc>1){ml[p.id]=String(p.listSobre||150);}});setListSobreMap(ml);setEditMode(true);}} style={{fontSize:11}}>Editar costos</OutBtn>}>
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
                        {p.spc>1?<span style={{color:T.cost,fontSize:12}} title="Costo de la caja ÷ sobres">{$m(sobreCost(editMode?{...p,cost:parseFloat(costMap[p.id])||0}:p))}</span>:<span style={{color:T.textMuted,fontSize:11}}>—</span>}
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
                  if(listSobreMap[p.id]!==undefined&&listSobreMap[p.id]!=="")upd.listSobre=parseFloat(listSobreMap[p.id])||0;
                }
                return upd;
              }));setEditMode(false);setListSobreMap({});}}>Guardar costos</GoldBtn>
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


// ── CORTESÍAS (sobres que regalamos por gusto en una venta; opcionales) ───────
// regalos = {pid: cantidad}. Cada sobre cuesta lo que nos cuesta: costo de la caja ÷ sobres de la caja.
function RegalosForm({regalos,setRegalos,prods,isAdmin}){
  const sobreProds=prods.filter(p=>p.cat==="Miel"&&(p.spc||1)>1);
  const[open,setOpen]=useState(false);
  const elegidos=sobreProds.filter(p=>(regalos[p.id]||0)>0);
  const n=elegidos.reduce((a,p)=>a+regalos[p.id],0);
  const costo=elegidos.reduce((a,p)=>a+regalos[p.id]*sobreCost(p),0);
  const set=(pid,d)=>setRegalos(r=>{const v=Math.max(0,(r[pid]||0)+d);const x={...r};if(v)x[pid]=v;else delete x[pid];return x;});
  const nombre=p=>p.name.replace(/\s*\(.*\)/,"");
  return(
    <div style={{borderTop:`1px solid ${T.goldBorder}`,paddingTop:12,marginTop:4,marginBottom:12}}>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:10,minHeight:46,textAlign:"left"}}>
        <span style={{fontSize:18}}>🎁</span>
        <span style={{flex:1,fontSize:14,fontWeight:600,color:T.text}}>Cortesías <span style={{fontWeight:400,color:T.textMuted}}>(opcional)</span></span>
        {n>0&&<span style={{fontSize:12,padding:"2px 8px",borderRadius:10,background:T.goldBg,color:T.goldText,fontWeight:700}}>{n}</span>}
        <i className={"ti ti-chevron-"+(open?"up":"down")} style={{color:T.textMuted}}/>
      </button>
      {open&&(
        <div style={{marginTop:6}}>
          {sobreProds.map(p=>{const q=regalos[p.id]||0;return(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 2px",borderBottom:`0.5px solid ${T.border}`}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:13,fontWeight:600,color:T.text}}>{p.spcu==="piezas"?"Pieza":"Sobre"} {nombre(p)}</p>
                {isAdmin&&<p style={{margin:0,fontSize:11,color:T.textMuted}}>te cuesta {$m(sobreCost(p))} c/u</p>}
              </div>
              {q===0
                ?<button onClick={()=>set(p.id,1)} aria-label="Agregar cortesía" style={{width:38,height:38,minHeight:38,padding:0,borderRadius:"50%",fontSize:18,color:T.gold,borderColor:T.gold}}><i className="ti ti-plus"/></button>
                :<div style={{display:"flex",alignItems:"center",border:`1px solid ${T.gold}`,borderRadius:20,overflow:"hidden"}}>
                  <button onClick={()=>set(p.id,-1)} aria-label="Quitar" style={{border:"none",borderRadius:0,width:36,height:36,minHeight:36,padding:0,fontSize:18,color:T.expense}}>−</button>
                  <span style={{minWidth:22,textAlign:"center",fontWeight:700}}>{q}</span>
                  <button onClick={()=>set(p.id,1)} aria-label="Agregar" style={{border:"none",borderRadius:0,width:36,height:36,minHeight:36,padding:0,fontSize:18,color:T.profit}}>+</button>
                </div>}
            </div>
          );})}
        </div>
      )}
      {n>0&&(
        <div style={{marginTop:8,padding:"10px 12px",borderRadius:10,background:T.bgAlt,border:`0.5px solid ${T.goldBorder}`,fontSize:13}}>
          {elegidos.map(p=>(
            <div key={p.id} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"2px 0",color:T.textSub}}>
              <span>🎁 {regalos[p.id]} × {nombre(p)}</span>
              {isAdmin&&<span>{regalos[p.id]} × {$m(sobreCost(p))} = <strong style={{color:T.expense}}>−{$m(regalos[p.id]*sobreCost(p))}</strong></span>}
            </div>
          ))}
          {isAdmin&&<div style={{display:"flex",justifyContent:"space-between",borderTop:`0.5px solid ${T.goldBorder}`,marginTop:6,paddingTop:6,fontWeight:700}}>
            <span>Las cortesías te cuestan</span><span style={{color:T.expense}}>−{$m(costo)}</span>
          </div>}
        </div>
      )}
    </div>
  );
}

// ── VENDER: piezas de la pantalla (top-level, regla 2) ────────────────────────
// Apartados de productos en Vender
const GRUPOS=[["miel","Mieles","ti-droplet"],["gom","Gomitas y chocolates","ti-candy"],["sex","Sex shop","ti-heart"],["pkg","Paquetes","ti-packages"]];
// Gomitas y chocolates se identifican por producto (en datos viejos no siempre venía spcu)
// (en este orden se muestran: primero los 3 chocolates, luego las gomitas)
const GOM_IDS=["rchv","rhch","ppch","gom_m","gom_f"];
const grupoDe=p=>p.cat==="SexShop"?"sex":(GOM_IDS.includes(p.id)||p.spcu==="piezas"?"gom":"miel");
const iniciales=n=>(n||"?").split(" ").filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase();

function ClientePicker({clients,cl,onPick,onClear,onNew}){
  const[open,setOpen]=useState(false);
  const[q,setQ]=useState("");
  if(cl)return(
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:"rgba(26,140,90,0.08)",border:"1px solid rgba(26,140,90,0.25)"}}>
      <div style={{width:38,height:38,borderRadius:"50%",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:T.profit}}>{iniciales(cl.name)}</div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{margin:0,fontSize:15,fontWeight:700,color:T.profit,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name}</p>
        <p style={{margin:0,fontSize:12,color:T.profit}}>{cl.type}{Object.values(cl.prices||{}).some(v=>v)?" · precios especiales":""}</p>
      </div>
      <OutBtn onClick={()=>{onClear();setOpen(true);setQ("");}} style={{fontSize:12}}>Cambiar</OutBtn>
    </div>
  );
  const s=q.trim().toLowerCase();
  // Primero los que empiezan con lo que escribiste, luego los que lo tienen en otra palabra
  const rank=c=>{const n=c.name.toLowerCase();return !s?0:n.startsWith(s)?0:n.split(" ").some(w=>w.startsWith(s))?1:2;};
  const lista=[...clients].filter(c=>!s||c.name.toLowerCase().includes(s)).sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name,"es"));
  if(!open)return(
    <button onClick={()=>setOpen(true)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:12,fontSize:15,color:T.textSub,minHeight:50}}>
      <span><i className="ti ti-user" style={{fontSize:18,verticalAlign:-3,marginRight:6}}/>Elegir cliente</span><i className="ti ti-chevron-down"/>
    </button>
  );
  return(
    <div style={{border:`1px solid ${T.goldBorder}`,borderRadius:12,padding:10}}>
      <div style={{position:"relative"}}>
        <i className="ti ti-search" style={{position:"absolute",left:12,top:14,fontSize:16,color:T.textMuted}}/>
        <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar cliente, ej. M" style={{paddingLeft:36}}/>
      </div>
      <p style={{margin:"6px 2px 4px",fontSize:11,color:T.textMuted}}>{s?lista.length+" resultado"+(lista.length!==1?"s":""):"Todos tus clientes ("+clients.length+")"}</p>
      <div style={{maxHeight:320,overflowY:"auto"}}>
        {lista.map(c=>(
          <div key={c.id} onClick={()=>{onPick(c.id);setOpen(false);setQ("");}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 4px",borderBottom:`0.5px solid ${T.border}`,cursor:"pointer"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:T.goldBg,color:T.goldText,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>{iniciales(c.name)}</div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:14,color:T.text}}>{c.name}</p>
              <p style={{margin:0,fontSize:11,color:T.textMuted}}>{c.type}{c.phone?" · "+c.phone:""}</p>
            </div>
          </div>
        ))}
        {lista.length===0&&<p style={{fontSize:13,color:T.textSub,padding:"6px 2px"}}>Sin resultados</p>}
      </div>
      <OutBtn onClick={()=>{setOpen(false);onNew(q);}} style={{width:"100%",marginTop:8,fontSize:13,minHeight:42}}><i className="ti ti-user-plus" style={{fontSize:15,verticalAlign:-2}}/> Cliente nuevo{q.trim()?": "+q.trim():""}</OutBtn>
    </div>
  );
}

// Una fila de producto (o paquete) con +/−, caja/sobre, lápiz de precio y utilidad
function VentaRow({name,sub,dual,unitLabel,unit,setUnit,qty,otherQty,otherLabel,price,esp,may,unitCost,isAdmin,onAdd,onSub,editing,onEdit,editVal,setEditVal,onEditDone,onEditCancel,canSave,saveChk,setSaveChk,clName,editErr}){
  const ut=(price-unitCost)*qty;
  return(
    <div style={{padding:"12px 2px",borderBottom:`0.5px solid ${T.border}`}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{margin:0,fontSize:14,fontWeight:600,color:T.text}}>{name}</p>
          <p style={{margin:"1px 0 0",fontSize:13,color:T.textSub,display:"flex",alignItems:"center",flexWrap:"wrap",gap:4}}>
            <strong style={{color:esp?"#B86010":T.revenue}}>{$m(price)}</strong>{sub}
            <button onClick={onEdit} aria-label="Editar precio" style={{border:"none",background:"transparent",padding:"0 4px",minHeight:0,color:T.client,fontSize:15}}><i className="ti ti-pencil"/></button>
            {esp&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:8,background:"rgba(232,128,32,0.12)",color:"#B86010",fontWeight:600}}>precio especial</span>}
            {may&&<span style={{fontSize:11,color:T.profit,fontWeight:600}}>· mayoreo</span>}
          </p>
          {dual&&(
            <div style={{display:"inline-flex",border:`1px solid ${T.goldBorder}`,borderRadius:8,overflow:"hidden",marginTop:6}}>
              {[["caja","Caja"],["sobre",unitLabel]].map(([v,l])=>(
                <span key={v} onClick={()=>setUnit(v)} style={{fontSize:12,padding:"4px 12px",cursor:"pointer",background:unit===v?T.goldBg:"transparent",color:unit===v?T.goldText:T.textSub,fontWeight:unit===v?700:400}}>{l}</span>
              ))}
            </div>
          )}
          {otherQty>0&&<p style={{margin:"4px 0 0",fontSize:11,color:T.client}}>También llevas {otherQty} {otherLabel}</p>}
        </div>
        {qty===0?(
          <button onClick={onAdd} aria-label="Agregar" style={{width:42,height:42,minHeight:42,padding:0,borderRadius:"50%",fontSize:20,color:T.gold,borderColor:T.gold,flexShrink:0}}><i className="ti ti-plus"/></button>
        ):(
          <div style={{display:"flex",alignItems:"center",border:`1px solid ${T.gold}`,borderRadius:22,overflow:"hidden",flexShrink:0}}>
            <button onClick={onSub} aria-label="Quitar uno" style={{border:"none",borderRadius:0,width:40,height:40,minHeight:40,padding:0,fontSize:20,color:T.expense}}>−</button>
            <span style={{minWidth:26,textAlign:"center",fontWeight:700,fontSize:16}}>{qty}</span>
            <button onClick={onAdd} aria-label="Agregar uno" style={{border:"none",borderRadius:0,width:40,height:40,minHeight:40,padding:0,fontSize:20,color:T.profit}}>+</button>
          </div>
        )}
      </div>
      {editing&&(
        <div style={{marginTop:8,padding:10,borderRadius:10,background:T.bgAlt,border:`0.5px solid ${T.goldBorder}`}}>
          <div style={{display:"flex",gap:6}}>
            <input type="number" min="0" inputMode="decimal" autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)} placeholder="Precio" style={{flex:1,fontWeight:700,textAlign:"center"}}/>
            <GoldBtn onClick={onEditDone} style={{minHeight:44}}>Listo</GoldBtn>
            <OutBtn onClick={onEditCancel} style={{minHeight:44}}>✕</OutBtn>
          </div>
          {editErr&&<p style={{margin:"4px 0 0",fontSize:12,color:T.expense}}>{editErr}</p>}
          {canSave&&<label style={{display:"flex",alignItems:"center",gap:8,marginTop:8,fontSize:13,color:T.textSub}}><input type="checkbox" checked={saveChk} onChange={e=>setSaveChk(e.target.checked)} style={{width:18,height:18,minHeight:0}}/>Guardar como precio de {clName}</label>}
        </div>
      )}
      {qty>0&&isAdmin&&(unitCost>0
        ?<p style={{margin:"6px 0 0",fontSize:12,fontWeight:600,color:ut>=0?T.profit:T.expense}}>Utilidad {$m(ut)} · {price>0?pct(ut/(price*qty)*100):"—"}</p>
        :<p style={{margin:"6px 0 0",fontSize:12,color:"#B86010"}}>Falta el costo de este producto (Más → Catálogo)</p>)}
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
          <p style={{margin:"-4px 0 0",fontSize:11,color:T.textMuted}}>${ENVIO_TARIFA_KM} por km</p>
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
function NuevaVenta({prods,setProds,pkgs,clients,setClients,sales,setSales,user,isAdmin,stockMoves,setStockMoves,cerrados=[]}){
  const[confirmDel,setConfirmDel]=useState(null);
  const[histDate,setHistDate]=useState(today());
  const[date,setDate]=useState(today());
  const[step,setStep]=useState(1);
  const[clientId,setClientId]=useState("");
  // cart: "p|pid|caja" / "p|pid|sobre" / "k|pkgId" → cantidad · over: mismo key → precio escrito a mano
  const[cart,setCart]=useState({});
  const[over,setOver]=useState({});
  const[unitView,setUnitView]=useState({});
  const[openG,setOpenG]=useState({miel:true});
  const[editKey,setEditKey]=useState(null);
  const[editVal,setEditVal]=useState("");
  const[editErr,setEditErr]=useState("");
  const[saveChk,setSaveChk]=useState(true);
  const[payMethod,setPayMethod]=useState("Efectivo");
  const[mixEfectivo,setMixEfectivo]=useState("");
  const[mixTransferencia,setMixTransferencia]=useState("");
  const[mixCuenta,setMixCuenta]=useState("SPIN Marcel");
  const[regalos,setRegalos]=useState({});
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
  const[newCl,setNewCl]=useState(null);
  const[newClPrices,setNewClPrices]=useState(false);

  const cl=clients.find(c=>c.id===clientId);
  const vendibles=prods.filter(p=>p.id!=="sob");
  // Precio normal para este cliente (su precio especial si tiene; si no, lista/mayoreo)
  const stdProd=(p,su,qty)=>{
    if(su==="sobre"){const e=cl?.prices?.[p.id+"_s"];return e!=null&&e!==""?+e:(p.listSobre||150);}
    return clientPrice(cl,p.id,p.tiers,qty||1);
  };
  const tieneEsp=(p,su)=>{const e=cl?.prices?.[su==="sobre"?p.id+"_s":p.id];return e!=null&&e!=="";};
  const stdPkg=pk=>pkgPrice(cl,pk.id,pk.price);
  const keyP=(p,su)=>"p|"+p.id+"|"+su;
  const keyK=pk=>"k|"+pk.id;
  const priceOf=key=>{
    if(over[key]!=null)return +over[key];
    const[t,id,su]=key.split("|");
    if(t==="k"){const pk=pkgs.find(x=>x.id===id);return pk?stdPkg(pk):0;}
    const p=prods.find(x=>x.id===id);return p?stdProd(p,su,cart[key]||1):0;
  };
  const stdOf=key=>{const[t,id,su]=key.split("|");
    if(t==="k"){const pk=pkgs.find(x=>x.id===id);return pk?stdPkg(pk):0;}
    const p=prods.find(x=>x.id===id);return p?stdProd(p,su,cart[key]||1):0;};
  const costOf=key=>{const[t,id,su]=key.split("|");
    if(t==="k"){const pk=pkgs.find(x=>x.id===id);return pk?pkgCost(pk,prods):0;}
    const p=prods.find(x=>x.id===id);if(!p)return 0;return su==="sobre"?sobreCost(p):(p.cost||0);};
  const lineas=Object.entries(cart).filter(([,q])=>q>0);
  const subtotal=lineas.reduce((a,[k,q])=>a+priceOf(k)*q,0);
  const costoProd=lineas.reduce((a,[k,q])=>a+costOf(k)*q,0);
  const nPiezas=lineas.reduce((a,[,q])=>a+q,0);
  const regaloCostoVista=Object.entries(regalos).reduce((a,[pid,q])=>{const p=prods.find(x=>x.id===pid);return a+(p?sobreCost(p)*q:0);},0);
  const evVista=conEnvio?envioCalc(envKm,envCostoOver,envPct,envOtro):{costo:0,cliente:0,absorbe:0};
  const cobrar=subtotal+evVista.cliente;

  const setQty=(key,d)=>setCart(c=>{const v=Math.max(0,(c[key]||0)+d);const x={...c};if(v)x[key]=v;else delete x[key];return x;});
  const pickClient=id=>{setClientId(id);setOver({});setEditKey(null);setErr("");};
  const startEdit=key=>{setEditKey(key);setEditVal(String(priceOf(key)));setEditErr("");setSaveChk(true);};
  const doneEdit=()=>{
    if(editVal===""||+editVal<0){setEditErr("Escribe un precio");return;}
    const v=+editVal;
    setOver(o=>({...o,[editKey]:v}));
    if(isAdmin&&cl&&saveChk){
      const[t,id,su]=editKey.split("|");
      if(t==="k")setClients(prev=>prev.map(c=>c.id===cl.id?{...c,pkgPrices:{...(c.pkgPrices||{}),[id]:v}}:c));
      else setClients(prev=>prev.map(c=>c.id===cl.id?{...c,prices:{...(c.prices||{}),[su==="sobre"?id+"_s":id]:v}}:c));
    }
    setEditKey(null);
  };

  const continuar=()=>{
    if(!clientId){setErr("Elige un cliente primero");return;}
    if(nPiezas===0){setErr("Agrega al menos un producto");return;}
    setErr("");setStep(2);window.scrollTo(0,0);
  };

  const register=()=>{
    if(cerrados.includes(date)){setErr("Ese día ya se cerró. Un socio lo tiene que reabrir en 🔒 Cierre para registrar ventas.");return;}
    if(!clientId){setErr("Elige un cliente");setStep(1);return;}
    if(lineas.length===0){setErr("Agrega al menos un producto");setStep(1);return;}
    let items=[],descs=[],bajoPrecio=false,pkgFirst=null;
    lineas.forEach(([k,q])=>{
      const[t,id,su]=k.split("|");const pr=priceOf(k),st=stdOf(k);
      if(pr<st)bajoPrecio=true;
      if(t==="k"){const pk=pkgs.find(x=>x.id===id);if(!pk)return;pkgFirst=pkgFirst||pk.id;
        descs.push(q+"× "+pk.name);
        (pk.items||[]).forEach(it=>items.push({pid:it.pid,qty:it.qty*q,su:"caja",pkg:pk.id}));
      }else{const p=prods.find(x=>x.id===id);if(!p)return;
        descs.push(q+"× "+p.name.replace(/\s*\(.*\)/,"")+(su==="sobre"?" ("+(p.spcu==="piezas"?"pieza":"sobre")+(q>1?"s":"")+")":""));
        items.push({pid:id,qty:q,su,price:pr,std:st});
      }
    });
    const total=subtotal,cost=costoProd;
    let desc=descs.join(", ");
    // Envío: el cliente paga "envio", al repartidor se le paga "costoEnvio".
    // La diferencia (lo que absorbemos) va dentro de cost para que la utilidad sea real en todos los reportes.
    const ev=evVista;
    if(conEnvio&&ev.costo<=0){setErr("Pon los kilómetros o lo que cobra el repartidor");return;}
    // El pago mixto tiene que sumar exactamente lo que se cobra
    if(payMethod==="Mixto"){const suma=(+mixEfectivo||0)+(+mixTransferencia||0);const debe=total+ev.cliente;
      if(Math.abs(suma-debe)>0.5){setErr("El pago mixto suma "+$m(suma)+" pero hay que cobrar "+$m(debe));return;}}
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
    // Cortesías: cada sobre regalado cuesta lo que nos cuesta (caja ÷ sobres) y se descuenta de sobres sueltos
    const regaloItems=Object.entries(regalos).filter(([,q])=>q>0).map(([pid,q])=>{const p=prods.find(x=>x.id===pid);return{pid,qty:q,costo:+(p?sobreCost(p):0).toFixed(2)};});
    const regaloN=regaloItems.reduce((a,r)=>a+r.qty,0);
    const regaloCosto=+regaloItems.reduce((a,r)=>a+r.qty*r.costo,0).toFixed(2);
    if(regaloN>0)desc+=" + 🎁 "+regaloItems.map(r=>{const p=prods.find(x=>x.id===r.pid);return r.qty+" "+(p?p.name.replace(/\s*\(.*\)/,""):r.pid);}).join(", ");
    const stockItems=[...items,...regaloItems.map(r=>({pid:r.pid,qty:r.qty,su:"sobre"}))];
    // Productos que se vendieron sin tener stock suficiente en el sistema (se marcan para que los socios revisen)
    const sinStock=[];
    [...new Set(stockItems.map(it=>it.pid))].forEach(pid=>{const p=prods.find(x=>x.id===pid);if(!p)return;const its=stockItems.filter(it=>it.pid===pid);
      const qS=its.filter(it=>it.su==="sobre").reduce((a,it)=>a+(+it.qty||0),0);const qC=its.filter(it=>it.su!=="sobre").reduce((a,it)=>a+(+it.qty||0),0);
      if(qC>(p.stockCajas||0)||qS>(p.stockSobres||0))sinStock.push(p.name);});
    const sale={sinStock,id:uid(),date,clientId,pkgId:pkgFirst,total,cost:cost+comision+ev.absorbe+regaloCosto,comision,regalos:regaloItems,regaloCosto,desc,items,note,payMethod,
      mixEfectivo:payMethod==="Mixto"?+mixEfectivo||0:0,
      mixTransferencia:payMethod==="Mixto"?+mixTransferencia||0:0,
      mixCuenta:payMethod==="Mixto"?mixCuenta:"",
      ...envioFields,by:user?.name||"",hora:horaAhora(),bajoPrecio};
    setSales([...sales,sale]);
    // deduct stock (suma todas las líneas del mismo producto: cajas y sobres por separado)
    setProds(prev=>prev.map(prod=>{
      const its=stockItems.filter(it=>it.pid===prod.id);
      if(its.length===0)return prod;
      const qS=its.filter(it=>it.su==="sobre").reduce((a,it)=>a+(+it.qty||0),0);
      const qC=its.filter(it=>(it.su||"caja")!=="sobre").reduce((a,it)=>a+(+it.qty||0),0);
      return {...prod,stockCajas:Math.max(0,(prod.stockCajas||0)-qC),stockSobres:Math.max(0,(prod.stockSobres||0)-qS)};
    }));
    setErr("");setStep(1);setClientId("");setCart({});setOver({});setUnitView({});setEditKey(null);
    setRegalos({});setConEnvio(false);setEnvKm("");setEnvCostoOver("");setEnvPct("100");setEnvOtro("");setEnvRep("");setEnvDir("");setEnvPagado("no");setEnvCobro("transfer");setNote("");
    setPayMethod("Efectivo");setMixEfectivo("");setMixTransferencia("");setMixCuenta("SPIN Marcel");
    setOkMsg("✓ Venta de "+$m(total+ev.cliente)+" registrada"+(conEnvio?" · envío pendiente en 🛵 Envíos":"")+(sinStock.length?" · ⚠ en el sistema no había suficiente de: "+sinStock.join(", "):""));
    setTimeout(()=>setOkMsg(""),4000);
    window.scrollTo(0,0);
  };

  const borrarVenta=s=>{
    const back=[...(s.items||[]),...(s.regalos||[]).filter(r=>r.pid).map(r=>({pid:r.pid,qty:r.qty,su:"sobre"}))];
    setProds(prev=>prev.map(p=>{const its=back.filter(it=>it.pid===p.id);if(!its.length)return p;
      const qS=its.filter(it=>it.su==="sobre").reduce((a,it)=>a+(+it.qty||0),0);const qC=its.filter(it=>it.su!=="sobre").reduce((a,it)=>a+(+it.qty||0),0);
      return{...p,stockCajas:(p.stockCajas||0)+qC,stockSobres:(p.stockSobres||0)+qS};}));
    const cl=clients.find(c=>c.id===s.clientId);
    if(setStockMoves&&back.length)setStockMoves(prev=>[...prev,{id:uid(),date:today(),pid:back[0].pid,type:"devolucion",cajas:0,sobres:0,
      note:"Venta borrada ("+s.date+" · "+(cl?.name||"cliente")+" · "+$m(s.total)+"): se regresó al inventario "+s.desc,by:user?.name||""}]);
    setSales(prev=>prev.filter(x=>x.id!==s.id));
  };

  // Props comunes del editor de precio para VentaRow
  const edProps=key=>({editing:editKey===key,onEdit:()=>editKey===key?setEditKey(null):startEdit(key),editVal,setEditVal,onEditDone:doneEdit,onEditCancel:()=>setEditKey(null),
    canSave:isAdmin&&!!cl,saveChk,setSaveChk,clName:cl?.name,editErr});
  const barStyle={position:"fixed",left:0,right:0,bottom:"calc(64px + env(safe-area-inset-bottom))",zIndex:890,maxWidth:600,margin:"0 auto",background:T.bg,borderTop:`1px solid ${T.goldBorder}`,boxShadow:"0 -4px 16px rgba(0,0,0,0.06)",padding:"10px 14px",display:"flex",alignItems:"center",gap:10};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {okMsg&&<div style={{padding:"12px 14px",background:"rgba(26,140,90,0.1)",border:"1px solid rgba(26,140,90,0.3)",borderRadius:10,fontSize:14,color:T.profit,fontWeight:600}}>{okMsg}</div>}
      {cerrados.includes(today())&&<div style={{padding:"10px 12px",borderRadius:8,background:"rgba(192,64,64,0.08)",border:"1px solid rgba(192,64,64,0.3)",fontSize:13,color:T.expense,fontWeight:600}}>🔒 El día de hoy ya se cerró. Para vender, un socio tiene que reabrirlo.</div>}

      {step===1&&(
        <>
          <Card>
            <STitle>Cliente</STitle>
            {!newCl&&<ClientePicker clients={clients} cl={cl} onPick={pickClient} onClear={()=>pickClient("")} onNew={q=>setNewCl({name:q||"",type:"Menudeo",phone:"",prices:{}})}/>}
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
                    pickClient(nc.id);
                    setNewCl(null);
                  }}>✓ Guardar y continuar</GoldBtn>
                  <OutBtn onClick={()=>setNewCl(null)}>Cancelar</OutBtn>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <STitle>Productos</STitle>
            {GRUPOS.map(([g,label,icon])=>{
              const ordGom=p=>{const i=GOM_IDS.indexOf(p.id);return i<0?99:i;};
              const lista=g==="pkg"?pkgs:vendibles.filter(p=>grupoDe(p)===g).sort((a,b)=>g==="gom"?ordGom(a)-ordGom(b):0);
              if(lista.length===0)return null;
              const cnt=g==="pkg"?lista.reduce((a,pk)=>a+(cart[keyK(pk)]||0),0):lista.reduce((a,p)=>a+(cart[keyP(p,"caja")]||0)+(cart[keyP(p,"sobre")]||0),0);
              const abierto=!!openG[g];
              return(
                <div key={g} style={{marginBottom:8}}>
                  <button onClick={()=>setOpenG({...openG,[g]:!abierto})} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,minHeight:52,textAlign:"left",borderColor:abierto?T.gold:T.goldBorder,background:abierto?T.goldBg:"transparent"}}>
                    <i className={"ti "+icon} style={{fontSize:20,color:T.gold}}/>
                    <span style={{flex:1,fontSize:15,fontWeight:700,color:T.text}}>{label}</span>
                    {cnt>0&&<span style={{fontSize:12,padding:"2px 9px",borderRadius:10,background:T.gold,color:"#fff",fontWeight:700}}>{cnt}</span>}
                    <i className={"ti ti-chevron-"+(abierto?"up":"down")} style={{color:T.textMuted}}/>
                  </button>
                  {abierto&&(
                    <div style={{padding:"0 4px"}}>
                      {g==="pkg"?lista.map(pk=>{const k=keyK(pk);const q=cart[k]||0;const pr=priceOf(k);
                        return <VentaRow key={pk.id} name={pk.name} sub={" el paquete"} dual={false} qty={q} otherQty={0} price={pr} esp={over[k]!=null||pr!==pk.price} may={false} unitCost={costOf(k)} isAdmin={isAdmin}
                          onAdd={()=>setQty(k,1)} onSub={()=>setQty(k,-1)} {...edProps(k)}/>;
                      }):lista.map(p=>{
                        const dual=(p.spc||1)>1;const su=dual?(unitView[p.id]||"caja"):"caja";const other=su==="caja"?"sobre":"caja";
                        const k=keyP(p,su);const q=cart[k]||0;const pr=priceOf(k);
                        const uL=p.spcu==="piezas"?"Pieza":"Sobre";
                        const may=su==="caja"&&over[k]==null&&!tieneEsp(p,su)&&(p.tiers||[]).length>1&&pr<(p.tiers[0]?.p||pr);
                        return <VentaRow key={p.id} name={p.name.replace(/\s*\(.*\)/,"")} sub={su==="sobre"?(" el "+uL.toLowerCase()):(dual?" la caja ("+p.spc+")":" c/u")} dual={dual} unitLabel={uL}
                          unit={su} setUnit={v=>{setUnitView({...unitView,[p.id]:v});setEditKey(null);}} qty={q}
                          otherQty={dual?(cart[keyP(p,other)]||0):0} otherLabel={other==="caja"?"caja(s)":uL.toLowerCase()+"(s)"}
                          price={pr} esp={over[k]!=null||tieneEsp(p,su)} may={may} unitCost={costOf(k)} isAdmin={isAdmin}
                          onAdd={()=>setQty(k,1)} onSub={()=>setQty(k,-1)} {...edProps(k)}/>;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
          <ErrMsg msg={err}/>
        </>
      )}

      {step===2&&(
        <Card>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:10}}>
            <OutBtn onClick={()=>{setStep(1);setErr("");}} style={{fontSize:12}}>← Productos</OutBtn>
            {isAdmin
              ?<input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{maxWidth:170,fontSize:14}}/>
              :<span style={{fontSize:12,color:T.textMuted}}>{fechaLarga(date)}</span>}
          </div>
          <div style={{padding:"10px 12px",borderRadius:10,background:T.bgAlt,border:`0.5px solid ${T.goldBorder}`,marginBottom:12}}>
            <p style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:T.text}}>{cl?.name}</p>
            {lineas.map(([k,q])=>{const[t,id,su]=k.split("|");const nm=t==="k"?(pkgs.find(x=>x.id===id)?.name||id):((prods.find(x=>x.id===id)?.name||id).replace(/\s*\(.*\)/,"")+(su==="sobre"?" (sobre)":""));
              return <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:13,color:T.textSub,padding:"1px 0"}}><span>{q} × {nm}</span><span>{$m(priceOf(k)*q)}</span></div>;})}
          </div>

          {/* CORTESÍAS */}
          <RegalosForm regalos={regalos} setRegalos={setRegalos} prods={prods} isAdmin={isAdmin}/>

          {/* ENVÍO */}
          <EnvioForm {...{conEnvio,setConEnvio,envKm,setEnvKm,envCostoOver,setEnvCostoOver,envPct,setEnvPct,envOtro,setEnvOtro,envRep,setEnvRep,envDir,setEnvDir,envPagado,setEnvPagado,envPagadoCon,setEnvPagadoCon,envCobro,setEnvCobro,setPayMethod,isAdmin}} productos={subtotal} repartidores={[...new Set(sales.map(s=>s.repartidor).filter(Boolean))]}/>

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
            {isAdmin&&terminalAmt(payMethod,cobrar,mixCuenta,mixTransferencia)>0&&(()=>{
              const base=terminalAmt(payMethod,cobrar,mixCuenta,mixTransferencia);
              return <div style={{gridColumn:"1/-1",padding:"8px 12px",background:PAY_CLR["Terminal MP"].bg,borderRadius:8,fontSize:12,color:PAY_CLR["Terminal MP"].c}}>
                💳 Comisión Mercado Pago ({(TERMINAL_FEE*100).toFixed(1)}%): <strong>−{$m(base*TERMINAL_FEE)}</strong> · Te llega: <strong>{$m(base*(1-TERMINAL_FEE))}</strong>
              </div>;
            })()}
            {payMethod==="Mixto"&&(
              <div style={{gridColumn:"1/-1",background:"rgba(100,100,100,0.06)",borderRadius:10,padding:"14px",border:"1px solid rgba(100,100,100,0.15)"}}>
                <p style={{margin:"0 0 12px",fontSize:12,fontWeight:600,color:T.text}}>💳 Desglose del pago mixto · hay que cobrar {$m(cobrar)}</p>
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
                    <input type="number" min="0" value={mixTransferencia} onChange={e=>setMixTransferencia(e.target.value)} placeholder={String(Math.max(0,cobrar-(+mixEfectivo||0)))}/>
                  </F>
                </div>
              </div>
            )}
            <F label="Nota interna (opcional)" style={{gridColumn:"1/-1"}}>
              <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Observaciones…"/>
            </F>
          </div>

          {isAdmin&&(
            <div style={{marginTop:12,padding:"10px 12px",borderRadius:10,background:"rgba(26,140,90,0.06)",border:"1px solid rgba(26,140,90,0.2)",fontSize:13}}>
              {[["Productos",subtotal,T.text],["− Costo de productos",-costoProd,T.cost],regaloCostoVista>0&&["− Cortesías",-regaloCostoVista,T.expense],conEnvio&&evVista.absorbe!==0&&[evVista.absorbe>0?"− Envío que absorbes":"+ Ganancia en envío",-evVista.absorbe,evVista.absorbe>0?T.expense:T.profit]].filter(Boolean).map(([l,v,c])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"1px 0",color:T.textSub}}><span>{l}</span><span style={{color:c}}>{(v<0?"−":"")+$m(Math.abs(v))}</span></div>
              ))}
              {(()=>{const com=+(terminalAmt(payMethod,cobrar,mixCuenta,mixTransferencia)*TERMINAL_FEE).toFixed(2);const u=subtotal-costoProd-regaloCostoVista-evVista.absorbe-com;return(<>
                {com>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"1px 0",color:T.textSub}}><span>− Comisión terminal</span><span style={{color:T.expense}}>−{$m(com)}</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",borderTop:"0.5px solid rgba(26,140,90,0.3)",marginTop:4,paddingTop:4,fontWeight:700}}><span>Utilidad de esta venta</span><span style={{color:u>=0?T.profit:T.expense}}>{$m(u)}</span></div>
              </>);})()}
            </div>
          )}
          <ErrMsg msg={err}/>
        </Card>
      )}

      {/* BARRA DE TOTAL (fija arriba del menú) */}
      <div style={barStyle}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{margin:0,fontSize:11,color:T.textSub}}>{step===1?(nPiezas?nPiezas+" producto"+(nPiezas>1?"s":""):"Sin productos"):"Total a cobrar"+(conEnvio?" (con envío)":"")}</p>
          <p style={{margin:0,fontSize:20,fontWeight:700,color:T.text}}>{$m(step===1?subtotal:cobrar)}</p>
          {isAdmin&&step===1&&nPiezas>0&&<p style={{margin:0,fontSize:11,color:subtotal-costoProd>=0?T.profit:T.expense,fontWeight:600}}>Utilidad {$m(subtotal-costoProd)}{subtotal>0?" · "+pct((subtotal-costoProd)/subtotal*100):""}</p>}
        </div>
        {step===1
          ?<button onClick={continuar} style={{border:"none",background:T.client,color:"#fff",borderRadius:12,padding:"0 20px",minHeight:50,fontSize:15,fontWeight:700}}>Continuar →</button>
          :<button onClick={register} style={{border:"none",background:T.profit,color:"#fff",borderRadius:12,padding:"0 20px",minHeight:50,fontSize:15,fontWeight:700}}>✓ Registrar venta</button>}
      </div>
      <div style={{height:80}}/>

      {/* HISTORIAL: ventas de un día en tarjetas */}
      <Card>
        <STitle right={isAdmin&&<input type="date" value={histDate} onChange={e=>setHistDate(e.target.value||today())} style={{maxWidth:160,fontSize:13,minHeight:36,padding:"4px 8px"}}/>}>{histDate===today()?"Ventas de hoy":"Ventas del "+fechaLarga(histDate)}</STitle>
        {(()=>{
          const dia=sales.filter(s=>s.date===(isAdmin?histDate:today())).sort((a,b)=>(b.hora||"").localeCompare(a.hora||""));
          if(dia.length===0)return <Empty icon="ti-shopping-cart" text="Sin ventas este día"/>;
          const tot=dia.reduce((a,s)=>a+s.total+(s.envio||0),0),ut=dia.reduce((a,s)=>a+s.total-s.cost,0);
          return(<>
            <p style={{margin:"0 0 8px",fontSize:12,color:T.textSub}}>{dia.length} venta{dia.length!==1?"s":""} · <strong style={{color:T.revenue}}>{$m(tot)}</strong>{isAdmin&&<> · utilidad <strong style={{color:ut>=0?T.profit:T.expense}}>{$m(ut)}</strong></>}</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {dia.map(s=>{
                const c=clients.find(x=>x.id===s.clientId);const u=s.total-s.cost;const pc=PAY_CLR[s.payMethod]||{};
                return(
                  <div key={s.id} style={{padding:"10px 12px",borderRadius:10,border:`0.5px solid ${T.border}`,background:T.bgRow}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"flex-start"}}>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{margin:0,fontSize:14,fontWeight:700,color:T.text}}>{c?.name||(s.tipo==="palomitas"?"🍿 Palomitas":"—")}</p>
                        <p style={{margin:"1px 0 0",fontSize:12,color:T.textSub}}>{s.desc}</p>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <p style={{margin:0,fontSize:15,fontWeight:700,color:T.revenue}}>{$m(s.total+(s.envio||0))}</p>
                        {isAdmin&&<p style={{margin:0,fontSize:11,fontWeight:600,color:u>=0?T.profit:T.expense}}>{s.cost>0?"utilidad "+$m(u):"sin costo"}</p>}
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginTop:6}}>
                      {s.payMethod&&<Chip label={s.payMethod} bg={pc.bg} color={pc.c}/>}
                      {s.conEnvio&&<Chip label={"🛵 envío "+$m(s.envio||0)} bg="rgba(40,96,176,0.1)" color={T.client}/>}
                      {isAdmin&&s.bajoPrecio&&<Chip label="⚠ bajo precio lista" bg="rgba(232,128,32,0.12)" color="#B86010"/>}
                      {isAdmin&&(s.sinStock||[]).length>0&&<Chip label="⚠ sin stock en sistema" bg="rgba(192,64,64,0.1)" color={T.expense}/>}
                      <span style={{fontSize:11,color:T.textMuted,marginLeft:"auto"}}>{[s.hora,s.by].filter(Boolean).join(" · ")}</span>
                      {isAdmin&&(confirmDel===s.id?(
                        <>
                          <button onClick={()=>{borrarVenta(s);setConfirmDel(null);}} style={{fontSize:11,background:T.expense,color:"#fff",border:"none",fontWeight:600,padding:"3px 8px",minHeight:28}}>Borrar</button>
                          <button onClick={()=>setConfirmDel(null)} style={{fontSize:11,padding:"3px 8px",minHeight:28}}>No</button>
                        </>
                      ):(
                        <OutBtn onClick={()=>setConfirmDel(s.id)} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>);
        })()}
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
    const pers=antes?[]:fixedMissing(f,expenses,hoy);
    if(!pers.length)return;
    // Un gasto por cada periodo pendiente (los diarios llevan la fecha de su día)
    setExpenses(prev=>[...prev,...pers.map(per=>({id:uid(),date:f.freq==="diario"?per:hoyReal,cat:f.cat,amount:+f.amount,
      desc:f.name+" · "+fixedPeriodLabel(f,f.freq==="mensual"?per+"-01":per),pagadoCon:payWith[f.id]||"Efectivo",deCaja:false,fixedId:f.id,period:per,by:user?.name||""}))]);
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
        <span>Por día: <strong style={{color:T.expense}}>{$m(mensual*12/365)}</strong></span>
      </div>
      {!edit?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(fixed||[]).map(f=>{
            const miss=antes?[]:fixedMissing(f,expenses,hoy);
            const paid=miss.length===0&&!antes?(expenses.find(e=>e.fixedId===f.id&&e.period===fixedPeriod(f,hoy))||{date:"—"}):null;
            return(
              <div key={f.id} style={{padding:"12px",borderRadius:10,border:`1px solid ${paid?"rgba(26,140,90,0.3)":"rgba(192,64,64,0.3)"}`,background:paid?"rgba(26,140,90,0.05)":"rgba(192,64,64,0.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                  <div>
                    <p style={{margin:0,fontSize:14,fontWeight:700,color:T.text}}>{f.name}</p>
                    <p style={{margin:0,fontSize:11,color:T.textMuted}}>{$m(f.amount)} {f.freq==="diario"?"por día":f.freq==="semanal"?"por semana":"al mes"} · {fixedPeriodLabel(f,hoy)}</p>
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
                    <GoldBtn onClick={()=>pagar(f)} style={{minHeight:44}}>{miss.length>1?"✓ Registrar "+miss.length+" días · "+$m(f.amount*miss.length):"✓ Ya se pagó"}</GoldBtn>
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
              <F label="Cada cuándo"><select value={r.freq} onChange={e=>{const a=[...rows];a[i]={...r,freq:e.target.value};setRows(a);}}><option value="mensual">Cada mes</option><option value="semanal">Cada semana</option><option value="diario">Cada día</option></select></F>
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

// ── INGRESOS EXTRA (antes "Utilidad extra" en el Corte; solo socios, va en Gastos) ─
function IngresosExtra({extras,setExtras,user}){
  const blank={date:today(),amount:"",desc:"",tipo:"utilidad",via:"Efectivo"};
  const[f,setF]=useState(blank);
  const[open,setOpen]=useState(false);
  const[err,setErr]=useState("");
  const[confirmDel,setConfirmDel]=useState(null);
  const guardar=()=>{
    if(!f.amount||+f.amount<=0){setErr("Escribe el monto");return;}
    setExtras([...(extras||[]),{...f,id:uid(),amount:+f.amount,desc:f.desc.trim()||"Ingreso extra",by:user?.name||""}]);
    setF(blank);setErr("");
  };
  const lista=[...(extras||[])].sort((a,b)=>b.date.localeCompare(a.date));
  const TIPO={utilidad:"Utilidad de tercero",comision:"Comisión",otro:"Otro ingreso"};
  return(
    <Card>
      <STitle right={<OutBtn onClick={()=>setOpen(!open)} style={{fontSize:11}}>{open?"Cerrar":"+ Registrar"}</OutBtn>}>Ingresos extra</STitle>
      {open&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:12}}>
          <F label="Fecha"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/></F>
          <F label="Monto ($)"><input type="number" min="0" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} placeholder="0.00"/></F>
          <F label="Tipo"><select value={f.tipo} onChange={e=>setF({...f,tipo:e.target.value})}>{Object.entries(TIPO).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></F>
          <F label="¿A dónde llegó?"><select value={f.via} onChange={e=>setF({...f,via:e.target.value})}>{CUENTAS.map(c=><option key={c} value={c}>{CUENTA_LABEL[c]}</option>)}</select></F>
          <F label="Descripción" style={{gridColumn:"1/-1"}}><input value={f.desc} onChange={e=>setF({...f,desc:e.target.value})} placeholder="Ej. comisión por venta de Andrés"/></F>
          <div style={{gridColumn:"1/-1"}}><GoldBtn onClick={guardar} style={{minHeight:44,width:"100%"}}>Guardar ingreso</GoldBtn><ErrMsg msg={err}/></div>
        </div>
      )}
      {lista.length===0?<p style={{margin:0,fontSize:12,color:T.textMuted}}>Sin ingresos extra</p>:(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {lista.slice(0,20).map(x=>(
            <div key={x.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:8,border:`0.5px solid ${T.border}`,background:T.bgRow}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:13,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{x.desc||"—"}</p>
                <p style={{margin:0,fontSize:11,color:T.textMuted}}>{x.date} · {TIPO[x.tipo]||"Otro"} · {x.via||"Efectivo"}</p>
              </div>
              <span style={{fontWeight:700,color:T.profit}}>{$m(x.amount)}</span>
              {confirmDel===x.id
                ?<><button onClick={()=>{setExtras((extras||[]).filter(e=>e.id!==x.id));setConfirmDel(null);}} style={{fontSize:11,background:T.expense,color:"#fff",border:"none",fontWeight:600,padding:"4px 8px",minHeight:30}}>Borrar</button><button onClick={()=>setConfirmDel(null)} style={{fontSize:11,padding:"4px 8px",minHeight:30}}>No</button></>
                :<OutBtn onClick={()=>setConfirmDel(x.id)} danger style={{fontSize:11,padding:"4px 8px"}}>🗑️</OutBtn>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── GASTOS ────────────────────────────────────────────────────────────────────
function Gastos({expenses,setExpenses,user,isAdmin,fixed,setFixed,extras,setExtras}){
  const cats=isAdmin?EXP_CATS:EXP_CATS.filter(c=>!FIXED_CATS.includes(c));
  // deCaja: el efectivo salió de la caja del local (cuenta en el Cierre del día). Si lo pagó un socio, no.
  const blank={date:today(),cat:isAdmin?"Importación":"Insumos palomitas",amount:"",desc:"",pagadoCon:"Efectivo",deCaja:!isAdmin};
  const[form,setForm]=useState(blank);
  const[err,setErr]=useState("");
  const[okMsg,setOkMsg]=useState("");
  const[confirmDel,setConfirmDel]=useState(null);
  // El empleado solo ve los gastos que él registró (nunca renta, sueldos ni totales)
  const visibles=isAdmin?expenses:expenses.filter(e=>e.by===user?.name);
  const total=expenses.reduce((s,e)=>s+e.amount,0);
  const EXP_CLR=["#C4962A","#1A8C5A","#2860B0","#C04040","#7038D0","#9A6020"];
  // Incluye categorías viejas que ya tengan gastos, para que no desaparezcan de la gráfica
  const byCat=[...new Set([...EXP_CATS,...expenses.map(e=>e.cat).filter(Boolean)])].map((c,i)=>({name:c,v:+expenses.filter(e=>e.cat===c).reduce((s,e)=>s+e.amount,0).toFixed(0),fill:EXP_CLR[i%EXP_CLR.length]})).filter(x=>x.v>0);
  const save=()=>{
    if(!form.amount||+form.amount<=0){setErr("Escribe el monto");return;}
    if(!form.desc.trim()){setErr("Escribe en qué se gastó");return;}
    setExpenses([...expenses,{...form,id:uid(),amount:+form.amount,deCaja:form.pagadoCon==="Efectivo"&&(!isAdmin||!!form.deCaja),by:user?.name||""}]);
    setForm({...blank,date:form.date,cat:form.cat});setErr("");
    setOkMsg("✓ Gasto de "+$m(+form.amount)+" registrado");setTimeout(()=>setOkMsg(""),3000);
  };
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {isAdmin&&<GastosFijos fixed={fixed} setFixed={setFixed} expenses={expenses} setExpenses={setExpenses} user={user}/>}
      {isAdmin&&<IngresosExtra extras={extras} setExtras={setExtras} user={user}/>}
      <Card>
        <STitle>Registrar gasto</STitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12}}>
          <F label="Fecha"><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} disabled={!isAdmin}/></F>
          <F label="Categoría"><select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>{cats.map(c=><option key={c}>{c}</option>)}</select></F>
          <F label="Monto ($)"><input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0.00"/></F>
          <F label="Descripción"><input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="Detalle del gasto"/></F>
          <F label="¿Con qué se pagó?">
            <select value={form.pagadoCon||"Efectivo"} onChange={e=>setForm({...form,pagadoCon:e.target.value})}>
              {CUENTAS.map(c=><option key={c} value={c}>{CUENTA_LABEL[c]}</option>)}
            </select>
          </F>
          {isAdmin&&(form.pagadoCon||"Efectivo")==="Efectivo"&&(
            <F label="¿De dónde salió el efectivo?">
              <select value={form.deCaja?"caja":"socio"} onChange={e=>setForm({...form,deCaja:e.target.value==="caja"})}>
                <option value="socio">🧑 Lo pagó un socio</option>
                <option value="caja">🏪 De la caja del local</option>
              </select>
            </F>
          )}
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
                  {isAdmin&&<td style={{padding:"7px 10px",color:T.textSub,fontSize:11,whiteSpace:"nowrap"}}>{e.pagadoCon||"Efectivo"}{(e.pagadoCon||"Efectivo")==="Efectivo"&&<div style={{fontSize:10,color:T.textMuted}}>{e.deCaja?"de la caja":"socio"}</div>}</td>}
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
function Inventario({prods,setProds,sales,stockMoves,setStockMoves,user,isAdmin,popCfg,setPopCfg}){
  const by=user?.name||"";
  const[abrirForm,setAbrirForm]=useState({pid:"",cajas:1});
  const[invErr,setInvErr]=useState("");
  const[cajasIn,setCajasIn]=useState({});
  const[sueltosIn,setSueltosIn]=useState({});
  const[nota,setNota]=useState("");
  const[okMsg,setOkMsg]=useState("");
  const mielProds=prods.filter(p=>(p.spc||1)>1);
  const ord=p=>{const i=GOM_IDS.indexOf(p.id);return i<0?99:i;};

  const abrirCaja=()=>{
    const prod=prods.find(p=>p.id===abrirForm.pid);
    if(!prod||!abrirForm.cajas||+abrirForm.cajas<=0)return;
    const qty=+abrirForm.cajas;
    if((prod.stockCajas||0)<qty){setInvErr(isAdmin?"Solo tienes "+(prod.stockCajas||0)+" cajas de "+prod.name:"En el sistema no hay suficientes cajas cerradas de "+prod.name+". Avísale a un socio.");return;}
    const nuevos=qty*(prod.spc||1);
    setProds(prods.map(p=>p.id===abrirForm.pid?{...p,stockCajas:(p.stockCajas||0)-qty,stockSobres:(p.stockSobres||0)+nuevos}:p));
    setStockMoves([...stockMoves,{id:uid(),date:today(),pid:abrirForm.pid,type:"apertura",cajas:qty,sobres:nuevos,note:"Se abrieron "+qty+" caja"+(qty>1?"s":"")+" → "+nuevos+" sueltos",by}]);
    setInvErr("");setAbrirForm({pid:"",cajas:1});
  };

  // Mercancía que llegó: cajas cerradas y/o sueltos (o piezas) de cada producto, en un solo guardado
  const guardarEntrada=()=>{
    const moves=[];
    const next=prods.map(p=>{
      const c=+cajasIn[p.id]||0,sS=+sueltosIn[p.id]||0;
      if(c<=0&&sS<=0)return p;
      moves.push({id:uid(),date:today(),pid:p.id,type:"entrada",cajas:c,sobres:sS,note:nota.trim()||"Llegó mercancía",by});
      return{...p,stockCajas:(p.stockCajas||0)+c,stockSobres:(p.stockSobres||0)+sS};
    });
    if(moves.length===0){setInvErr("Escribe cuántas llegaron de al menos un producto");return;}
    setProds(next);setStockMoves([...stockMoves,...moves]);
    setCajasIn({});setSueltosIn({});setNota("");setInvErr("");
    setOkMsg("✓ Se registraron "+moves.length+" producto"+(moves.length>1?"s":""));setTimeout(()=>setOkMsg(""),3000);
  };
  const hayEntrada=Object.values(cajasIn).some(v=>+v>0)||Object.values(sueltosIn).some(v=>+v>0);
  const inp=(val,set,id,ph)=><input type="number" min="0" inputMode="numeric" value={val[id]||""} onChange={e=>set({...val,[id]:e.target.value})} placeholder={ph} style={{textAlign:"center",fontWeight:700}}/>;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {okMsg&&<div style={{padding:"10px 14px",background:"rgba(26,140,90,0.1)",border:"1px solid rgba(26,140,90,0.3)",borderRadius:10,fontSize:14,color:T.profit,fontWeight:600}}>{okMsg}</div>}

      <Card>
        <STitle>📦 Registrar mercancía que llegó</STitle>
        {GRUPOS.filter(([g])=>g!=="pkg").map(([g,label])=>{
          const lista=prods.filter(p=>grupoDe(p)===g).sort((a,b)=>g==="gom"?ord(a)-ord(b):0);
          if(!lista.length)return null;
          return(
            <div key={g} style={{marginBottom:10}}>
              <p style={{margin:"6px 0",fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</p>
              {lista.map(p=>{const dual=(p.spc||1)>1;const uL=p.spcu==="piezas"?"piezas":"sobres";return(
                <div key={p.id} style={{display:"grid",gridTemplateColumns:dual?"1fr 72px 72px":"1fr 72px",gap:8,alignItems:"center",padding:"6px 0",borderBottom:`0.5px solid ${T.border}`}}>
                  <div style={{minWidth:0}}>
                    <p style={{margin:0,fontSize:13,fontWeight:600,color:T.text}}>{p.name.replace(/\s*\(.*\)/,"")}</p>
                    {isAdmin&&<p style={{margin:0,fontSize:11,color:T.textMuted}}>Hay {p.stockCajas||0} {dual?"cajas":p.unit||"pz"}{dual?" · "+(p.stockSobres||0)+" "+uL+" sueltos":""}</p>}
                  </div>
                  {inp(cajasIn,setCajasIn,p.id,dual?"cajas":"piezas")}
                  {dual&&inp(sueltosIn,setSueltosIn,p.id,uL)}
                </div>
              );})}
            </div>
          );
        })}
        <F label="Nota (proveedor, factura…)"><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Opcional"/></F>
        <GoldBtn onClick={guardarEntrada} style={{marginTop:10,width:"100%",minHeight:48,fontSize:14,opacity:hayEntrada?1:0.6}}>📦 Guardar mercancía</GoldBtn>
        <ErrMsg msg={invErr}/>
      </Card>

      <Card>
        <STitle>🔓 Abrir caja para vender suelto</STitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 90px",gap:10,alignItems:"flex-end"}}>
          <F label="Producto">
            <select value={abrirForm.pid} onChange={e=>{setInvErr("");setAbrirForm({...abrirForm,pid:e.target.value});}}>
              <option value="">Selecciona…</option>
              {mielProds.map(p=><option key={p.id} value={p.id} disabled={isAdmin&&(p.stockCajas||0)===0}>{p.name.replace(/\s*\(.*\)/,"")}{isAdmin?" — "+(p.stockCajas||0)+" cajas":""}</option>)}
            </select>
          </F>
          <F label="Cajas"><input type="number" min="1" value={abrirForm.cajas} onChange={e=>setAbrirForm({...abrirForm,cajas:e.target.value})}/></F>
        </div>
        {abrirForm.pid&&+abrirForm.cajas>0&&(()=>{const prod=prods.find(p=>p.id===abrirForm.pid);return <p style={{margin:"8px 0 0",fontSize:12,color:T.textSub}}>= <strong style={{color:T.client}}>{(+abrirForm.cajas||0)*(prod?.spc||1)} {prod?.spcu==="piezas"?"piezas":"sobres"}</strong> sueltos</p>;})()}
        <GoldBtn onClick={abrirCaja} style={{marginTop:10,width:"100%",minHeight:44}}>🔓 Abrir</GoldBtn>
      </Card>

      {isAdmin&&<>
        <Card>
          <STitle>Mieles, gomitas y chocolates</STitle>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <TH cols={["Producto","Cajas","Sueltos","Vendido"]}/>
              <tbody>
                {[...mielProds].sort((a,b)=>(grupoDe(a)===grupoDe(b)?ord(a)-ord(b):grupoDe(a)==="miel"?-1:1)).map((p,idx)=>{
                  const cajas=p.stockCajas||0,sobres=p.stockSobres||0;
                  const soldC=sales.reduce((s,sl)=>s+(sl.items||[]).filter(i=>i.pid===p.id&&(i.su||"caja")==="caja").reduce((a,i)=>a+(+i.qty||0),0),0);
                  const soldS=sales.reduce((s,sl)=>s+(sl.items||[]).filter(i=>i.pid===p.id&&i.su==="sobre").reduce((a,i)=>a+(+i.qty||0),0),0);
                  return(
                    <tr key={p.id} style={{background:idx%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                      <td style={{padding:"8px 10px",fontWeight:600,color:T.text}}>{p.name.replace(/\s*\(.*\)/,"")}</td>
                      <td style={{padding:"8px 10px",fontSize:16,fontWeight:700,color:cajas<=0?T.expense:cajas<=2?"#E88020":T.profit}}>{cajas}</td>
                      <td style={{padding:"8px 10px",fontSize:16,fontWeight:700,color:sobres>0?T.client:T.textMuted}}>{sobres||"—"}</td>
                      <td style={{padding:"8px 10px",fontSize:11,color:T.textSub}}>{soldC||soldS?[soldC&&soldC+" cj",soldS&&soldS+" s"].filter(Boolean).join(" · "):"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
        <OtrosTable prods={prods} sales={sales}/>
        <VasosCard popCfg={popCfg} setPopCfg={setPopCfg} stockMoves={stockMoves} setStockMoves={setStockMoves} user={user}/>
      </>}

      {isAdmin&&stockMoves.length>0 && (
        <Card>
          <STitle>Historial de movimientos ({stockMoves.length})</STitle>
          <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
            <TH cols={["Fecha","Tipo","Producto","Cantidad","Nota","Registró",""]}/>
            <tbody>
              {[...stockMoves].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,60).map((m,i)=>{
                const prod=prods.find(p=>p.id===m.pid);
                const isE=m.type==="entrada",isA=m.type==="apertura",isAj=m.type==="ajuste",isD=m.type==="devolucion";
                const isPop=(m.pid||"").startsWith("pop_");const popK=isPop?m.pid.slice(4):"";
                const cant=isE?[m.cajas?"+"+m.cajas+(isPop?" vasos":(prod&&(prod.spc||1)===1?" pz":" cj")):"",m.sobres?"+"+m.sobres+" s":""].filter(Boolean).join(" · ")
                  :isA?"−"+m.cajas+" cj → +"+m.sobres+" s"
                  :isAj?[m.cajas?(m.cajas>0?"+":"")+m.cajas:"",m.sobres?(m.sobres>0?"+":"")+m.sobres+" s":""].filter(Boolean).join(" · "):"";
                return(
                  <tr key={m.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                    <td style={{padding:"7px 10px",color:T.textSub,whiteSpace:"nowrap"}}>{m.date}</td>
                    <td style={{padding:"7px 10px"}}><Chip label={isE?"Entrada":isA?"Caja abierta":isAj?"Ajuste de conteo":isD?"Venta borrada":"Otro"} bg={isE?"rgba(26,140,90,0.1)":isA?"rgba(40,96,176,0.1)":T.goldBg} color={isE?T.profit:isA?T.client:T.gold}/></td>
                    <td style={{padding:"7px 10px",fontWeight:500}}>{isPop?"Vasos "+(popCfg?.[popK]?.name||popK):isD?"—":(prod?.name.replace(/\s*\(.*\)/,"")||m.pid)}</td>
                    <td style={{padding:"7px 10px",color:isE?T.profit:T.client,fontWeight:600,whiteSpace:"nowrap"}}>{cant}</td>
                    <td style={{padding:"7px 10px",color:T.textSub,fontSize:11}}>{m.note}</td>
                    <td style={{padding:"7px 10px",color:T.textMuted,fontSize:11}}>{m.by||"—"}</td>
                    <td style={{padding:"7px 10px"}}>
                      {(isE||isA)&&<OutBtn onClick={()=>{
                        if(isE&&isPop)setPopCfg(prev=>({...prev,[popK]:{...prev[popK],stock:(+prev[popK].stock||0)-m.cajas}}));
                        else if(isE)setProds(prods.map(p=>p.id===m.pid?{...p,stockCajas:Math.max(0,(p.stockCajas||0)-(m.cajas||0)),stockSobres:Math.max(0,(p.stockSobres||0)-(m.sobres||0))}:p));
                        if(isA)setProds(prods.map(p=>p.id===m.pid?{...p,stockCajas:(p.stockCajas||0)+m.cajas,stockSobres:Math.max(0,(p.stockSobres||0)-m.sobres)}:p));
                        setStockMoves(stockMoves.filter(x=>x.id!==m.id));
                      }} danger style={{fontSize:11,padding:"3px 8px"}}>🗑️</OutBtn>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── RESUMEN POR CUENTA (lo usan el Corte de caja y el Cierre del día) ─────────
// Lo que entró y salió de una cuenta (Efectivo, SPIN, Mercado Pago…) en un rango de fechas.
function cuentaResumen(m,range,sales,expenses,extras){
  const fSales=sales.filter(s=>s.date>=range.start&&s.date<=range.end);
  const fExp=expenses.filter(e=>e.date>=range.start&&e.date<=range.end);
  const fExtrasP=(extras||[]).filter(x=>x.date>=range.start&&x.date<=range.end);
  const mixSales=fSales.filter(s=>s.payMethod==="Mixto");
  const direct=fSales.filter(s=>s.payMethod===m);
  const ventasTotal=direct.reduce((a,s)=>a+s.total,0);
  // Envío que pagó el cliente: entra a la misma cuenta que la venta (en Mixto ya viene dentro del desglose)
  const envCobrado=direct.reduce((a,s)=>a+(s.envio||0),0);
  // Pagos a repartidores hechos en este periodo desde esta cuenta
  const repPagado=sales.filter(s=>s.envioPagado&&s.envioPagadoCon===m&&s.envioPagadoFecha>=range.start&&s.envioPagadoFecha<=range.end).reduce((a,s)=>a+(s.costoEnvio||0),0);
  const mixAmt=m==="Efectivo"?mixSales.reduce((a,s)=>a+(s.mixEfectivo||0),0):mixSales.filter(s=>s.mixCuenta===m).reduce((a,s)=>a+(s.mixTransferencia||0),0);
  // Mercado Pago deposita ya descontada su comisión
  const comisionAmt=m==="Terminal MP"?fSales.reduce((a,s)=>a+(s.comision||0),0):0;
  const extraAmt=fExtrasP.filter(x=>(x.via||"Efectivo")===m).reduce((a,x)=>a+x.amount,0);
  const gastosDeEsta=fExp.filter(e=>(e.pagadoCon||"Efectivo")===m).reduce((a,e)=>a+e.amount,0);
  const entradas=ventasTotal+envCobrado+mixAmt+extraAmt;
  const neto=entradas-gastosDeEsta-comisionAmt-repPagado;
  const pc=PAY_CLR[m]||{};
  return{method:m,ventasTotal,envCobrado,repPagado,mixAmt,extraAmt,entradas,gastosDeEsta,comisionAmt,neto,count:direct.length,bg:pc.bg,c:pc.c};
}

// ── CIERRE DEL DÍA ────────────────────────────────────────────────────────────
// Fondo de cambio que se queda siempre en la caja. Lo demás se lo lleva un socio.
const FONDO_CAJA=500;
const DENOMS=[1000,500,200,100,50,20];
// Efectivo que debería haber en la caja al cerrar un día
// Solo cuenta lo que pasa por la caja: ventas/envíos/mixtos en efectivo, gastos marcados "de la caja"
// y pagos a repartidores en efectivo. No cuenta gastos que pagó un socio ni utilidades extra (esas las recibe un socio).
function efectivoEsperado(d,sales,expenses,extras){
  const r=cuentaResumen("Efectivo",{start:d,end:d},sales,expenses,extras);
  const gastosCaja=expenses.filter(e=>e.date===d&&(e.pagadoCon||"Efectivo")==="Efectivo"&&e.deCaja).reduce((a,e)=>a+e.amount,0);
  const neto=r.ventasTotal+r.envCobrado+r.mixAmt-gastosCaja-r.repPagado;
  // Contra entrega de hoy que el repartidor todavía no entrega hoy
  const traen=sales.filter(s=>s.date===d&&s.envioContra&&!(s.envioDineroRecibido&&s.envioDineroFecha===d)).reduce((a,s)=>a+(s.envioDebe||0),0);
  // Contra entrega de días anteriores que el repartidor entregó hoy
  const llegaron=sales.filter(s=>s.date<d&&s.envioContra&&s.envioDineroRecibido&&s.envioDineroFecha===d).reduce((a,s)=>a+(s.envioDebe||0),0);
  return FONDO_CAJA+neto-traen+llegaron;
}
// Todo lo que se cuenta en el cierre: productos (cajas + sobres, o piezas) y vasos de palomitas
function contables(prods,popCfg){
  const a=prods.filter(p=>p.id!=="sob").map(p=>{const dual=(p.spc||1)>1;return{key:p.id,name:p.name,dual,uC:dual?"cajas":(p.unit||"piezas"),uS:p.spcu||"sobres",
    sisC:p.stockCajas||0,sisS:dual?(p.stockSobres||0):0,pC:p.list||0,pS:dual?(p.listSobre||150):0,cC:p.cost||0,cS:dual?sobreCost(p):0};});
  const v=POP_SIZES.map(k=>({key:"pop_"+k,name:"Vaso palomitas "+popCfg[k].name,dual:false,uC:"vasos",uS:"",sisC:+popCfg[k].stock||0,sisS:0,pC:+popCfg[k].price||0,pS:0,cC:popUnitCost(popCfg[k]),cS:0}));
  return[...a,...v];
}
const cierreDifs=c=>(c.inv||[]).map(r=>({...r,dC:r.contC-r.sisC,dS:r.contS-r.sisS})).filter(r=>r.dC!==0||r.dS!==0);
const cierreCuadra=c=>Math.abs(c.efectivoContado-c.efectivoEsperado)<1&&cierreDifs(c).length===0;
const fechaLarga=ds=>new Date(ds+"T12:00:00").toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"short"}).replace(/^\w/,x=>x.toUpperCase());

function CierreDia({prods,setProds,sales,expenses,extras,popCfg,setPopCfg,cierres,setCierres,stockMoves,setStockMoves,user,isAdmin}){
  const hoy=today();
  const cierreHoy=cierres.find(c=>c.date===hoy);
  const[den,setDen]=useState({});
  const[monedas,setMonedas]=useState("");
  const[cnt,setCnt]=useState({});
  const[nota,setNota]=useState("");
  const[confirm,setConfirm]=useState(false);
  const[err,setErr]=useState("");
  const[reabrir,setReabrir]=useState(null);
  const items=contables(prods,popCfg);
  const contado=DENOMS.reduce((a,d)=>a+d*(+den[d]||0),0)+(+monedas||0);
  const faltan=items.filter(r=>cnt[r.key+"C"]===undefined||cnt[r.key+"C"]===""||(r.dual&&(cnt[r.key+"S"]===undefined||cnt[r.key+"S"]==="")));
  const setC=(k,v)=>setCnt({...cnt,[k]:v});

  const cerrar=()=>{
    if(cierres.some(c=>c.date===hoy)){setErr("El día de hoy ya está cerrado");return;}
    if(contado<=0){setErr("Cuenta el efectivo de la caja");return;}
    if(faltan.length>0){setErr("Faltan "+faltan.length+" productos por contar (pon 0 si no hay)");return;}
    if(!confirm){setConfirm(true);setErr("");return;}
    const d=new Date();
    const inv=items.map(r=>({key:r.key,name:r.name,dual:r.dual,uC:r.uC,uS:r.uS,sisC:r.sisC,sisS:r.sisS,contC:+cnt[r.key+"C"]||0,contS:r.dual?(+cnt[r.key+"S"]||0):0,pC:r.pC,pS:r.pS,cC:r.cC,cS:r.cS}));
    setCierres(prev=>[...prev,{id:uid(),date:hoy,hora:String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"),by:user?.name||"",
      fondo:FONDO_CAJA,denoms:{...den},monedas:+monedas||0,efectivoContado:contado,efectivoEsperado:+efectivoEsperado(hoy,sales,expenses,extras).toFixed(2),
      entregar:contado-FONDO_CAJA,inv,nota:nota.trim(),revisado:false,ajustado:false}]);
    setConfirm(false);setErr("");
  };

  // Socios: aplicar el conteo al inventario (registra un ajuste por cada diferencia)
  const ajustar=c=>{
    const difs=cierreDifs(c);if(difs.length===0)return;
    setProds(prev=>prev.map(p=>{const r=difs.find(x=>x.key===p.id);if(!r)return p;return{...p,stockCajas:Math.max(0,(p.stockCajas||0)+r.dC),stockSobres:Math.max(0,(p.stockSobres||0)+r.dS)};}));
    setPopCfg(prev=>{const n={...prev};POP_SIZES.forEach(k=>{const r=difs.find(x=>x.key==="pop_"+k);if(r)n[k]={...n[k],stock:(+n[k].stock||0)+r.dC};});return n;});
    setStockMoves(prev=>[...prev,...difs.map(r=>({id:uid(),date:today(),pid:r.key,type:"ajuste",cajas:r.dC,sobres:r.dS,
      note:"Ajuste por cierre del "+c.date+(r.dC<0||r.dS<0?" (faltante)":" (sobrante)"),by:user?.name||""}))]);
    setCierres(prev=>prev.map(x=>x.id===c.id?{...x,ajustado:true,revisado:true,revisadoPor:user?.name||""}:x));
  };

  const inputCnt=(k,ph)=><input type="number" min="0" inputMode="numeric" value={cnt[k]??""} onChange={e=>setC(k,e.target.value)} placeholder={ph} style={{width:"100%",textAlign:"center",fontWeight:700,fontSize:16}}/>;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {cierreHoy?(
        <Card style={{borderColor:T.profit,borderWidth:1}}>
          <STitle>✓ Cierre de hoy hecho</STitle>
          <p style={{margin:"0 0 6px",fontSize:13,color:T.textSub}}>{fechaLarga(hoy)} · {cierreHoy.hora} · por {cierreHoy.by||"—"}</p>
          <div style={{padding:12,borderRadius:10,background:"rgba(26,140,90,0.07)",fontSize:14,lineHeight:1.7}}>
            💵 Contaste: <strong>{$m(cierreHoy.efectivoContado)}</strong><br/>
            🪙 Deja de fondo: <strong>{$m(FONDO_CAJA)}</strong><br/>
            🤝 Entrega al socio: <strong style={{fontSize:18,color:T.profit}}>{$m(Math.max(0,cierreHoy.entregar))}</strong>
            {cierreHoy.entregar<0&&<div style={{color:T.expense,fontWeight:600}}>⚠ No alcanza para dejar el fondo completo</div>}
          </div>
          <p style={{margin:"10px 0 0",fontSize:12,color:T.textMuted}}>El día quedó cerrado: ya no se pueden registrar ventas de hoy.</p>
        </Card>
      ):(
        <>
          <Card>
            <STitle>🔒 Cierre del día · {fechaLarga(hoy)}</STitle>
            <p style={{margin:"0 0 4px",fontSize:12,color:T.textSub}}>Al cerrar, cuando ya no haya ventas.</p>
          </Card>

          <Card>
            <STitle right={<span style={{fontWeight:700,fontSize:16,color:T.revenue}}>{$m(contado)}</span>}>1 · Cuenta el efectivo de la caja</STitle>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {DENOMS.map(d=>(
                <F key={d} label={"Billetes de $"+d}>
                  <input type="number" min="0" inputMode="numeric" value={den[d]??""} onChange={e=>setDen({...den,[d]:e.target.value})} placeholder="0" style={{textAlign:"center",fontWeight:700}}/>
                </F>
              ))}
            </div>
            <F label="Monedas (total en $)" style={{marginTop:8}}>
              <input type="number" min="0" inputMode="decimal" value={monedas} onChange={e=>setMonedas(e.target.value)} placeholder="0" style={{textAlign:"center",fontWeight:700}}/>
            </F>
            <p style={{margin:"8px 0 0",fontSize:11,color:T.textMuted}}>Todo lo que hay en la caja, con los {$m(FONDO_CAJA)} de fondo.</p>
          </Card>

          <Card>
            <STitle right={<span style={{fontSize:12,color:faltan.length?T.expense:T.profit,fontWeight:600}}>{faltan.length?faltan.length+" por contar":"✓ Todo contado"}</span>}>2 · Cuenta el inventario</STitle>
            <p style={{margin:"0 0 10px",fontSize:12,color:T.textSub}}>Si no hay, pon 0.</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {items.map(r=>(
                <div key={r.key} style={{padding:"10px 12px",borderRadius:10,border:`1px solid ${faltan.includes(r)?T.goldBorder:"rgba(26,140,90,0.3)"}`,background:T.bgRow}}>
                  <p style={{margin:"0 0 6px",fontSize:13,fontWeight:600,color:T.text}}>{r.name}</p>
                  <div style={{display:"grid",gridTemplateColumns:r.dual?"1fr 1fr":"1fr",gap:8}}>
                    {inputCnt(r.key+"C",r.dual?"Cajas cerradas":r.uC)}
                    {r.dual&&inputCnt(r.key+"S",r.uS+" sueltos")}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <F label="Nota (opcional)"><input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej. se rompió un frasco, cliente pagó después…"/></F>
            {confirm&&(
              <div style={{marginTop:12,padding:12,borderRadius:10,background:T.goldBg,border:`1px solid ${T.goldBorder}`,fontSize:13,color:T.goldText}}>
                ¿Seguro? Contaste <strong>{$m(contado)}</strong>. Al cerrar ya no se pueden registrar ventas de hoy.
              </div>
            )}
            <button onClick={cerrar} style={{marginTop:12,width:"100%",minHeight:56,border:"none",borderRadius:12,background:confirm?T.expense:T.profit,color:"#fff",fontSize:17,fontWeight:700}}>
              {confirm?"Sí, cerrar el día":"🔒 Cerrar el día"}
            </button>
            {confirm&&<button onClick={()=>setConfirm(false)} style={{marginTop:8,width:"100%",border:"none",color:T.textSub}}>Cancelar</button>}
            <ErrMsg msg={err}/>
          </Card>
        </>
      )}

      {isAdmin&&(
        <Card>
          <STitle>Historial de cierres ({cierres.length})</STitle>
          {cierres.length===0?<Empty icon="ti-lock" text="Todavía no hay cierres"/>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[...cierres].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,31).map(c=>{
                const dif=+(c.efectivoContado-c.efectivoEsperado).toFixed(2);
                const difs=cierreDifs(c);
                const valV=difs.reduce((a,r)=>a+r.dC*r.pC+r.dS*r.pS,0);
                const valC=difs.reduce((a,r)=>a+r.dC*r.cC+r.dS*r.cS,0);
                const ok=cierreCuadra(c);
                return(
                  <div key={c.id} style={{padding:12,borderRadius:10,border:`1px solid ${ok?"rgba(26,140,90,0.3)":"rgba(192,64,64,0.35)"}`,background:ok?"rgba(26,140,90,0.04)":"rgba(192,64,64,0.04)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
                      <div>
                        <p style={{margin:0,fontWeight:700,fontSize:14}}>{fechaLarga(c.date)}</p>
                        <p style={{margin:0,fontSize:11,color:T.textMuted}}>{c.hora} · {c.by||"—"}{c.revisado?" · revisado"+(c.revisadoPor?" por "+c.revisadoPor:""):""}</p>
                      </div>
                      <Chip label={ok?"✓ Cuadró":"⚠ Con diferencias"} bg={ok?"rgba(26,140,90,0.12)":"rgba(192,64,64,0.12)"} color={ok?T.profit:T.expense}/>
                    </div>
                    <div style={{marginTop:8,fontSize:13,lineHeight:1.7}}>
                      💵 Contado <strong>{$m(c.efectivoContado)}</strong> · Debía haber <strong>{$m(c.efectivoEsperado)}</strong>
                      {Math.abs(dif)>=1&&<span style={{fontWeight:700,color:dif<0?T.expense:T.client}}> · {dif<0?"Faltan "+$m(-dif):"Sobran "+$m(dif)}</span>}
                      <br/>🤝 Entregó al socio: <strong>{$m(Math.max(0,c.entregar))}</strong>
                    </div>
                    {difs.length>0&&(
                      <div style={{marginTop:8,padding:"8px 10px",borderRadius:8,background:T.bg,border:`0.5px solid ${T.border}`,fontSize:12}}>
                        <p style={{margin:"0 0 4px",fontWeight:700,color:T.text}}>📦 Inventario que no cuadró</p>
                        {difs.map(r=>(
                          <div key={r.key} style={{display:"flex",justifyContent:"space-between",gap:8,padding:"2px 0"}}>
                            <span style={{color:T.textSub}}>{r.name}</span>
                            <span style={{fontWeight:600,color:(r.dC<0||r.dS<0)?T.expense:T.client,whiteSpace:"nowrap"}}>
                              {r.dC!==0&&(r.dC>0?"+":"")+r.dC+" "+r.uC}{r.dC!==0&&r.dS!==0&&" · "}{r.dS!==0&&(r.dS>0?"+":"")+r.dS+" "+r.uS}
                            </span>
                          </div>
                        ))}
                        <p style={{margin:"6px 0 0",color:valV<0?T.expense:T.client,fontWeight:600}}>{valV<0?"Faltante":"Sobrante"}: {$m(Math.abs(valV))} a precio de venta · {$m(Math.abs(valC))} a costo</p>
                      </div>
                    )}
                    {c.nota&&<p style={{margin:"8px 0 0",fontSize:12,color:T.textSub}}>📝 {c.nota}</p>}
                    <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
                      {!c.revisado&&<OutBtn onClick={()=>setCierres(prev=>prev.map(x=>x.id===c.id?{...x,revisado:true,revisadoPor:user?.name||""}:x))} style={{fontSize:12}}>✓ Marcar revisado</OutBtn>}
                      {difs.length>0&&!c.ajustado&&<OutBtn onClick={()=>ajustar(c)} style={{fontSize:12,color:T.client,borderColor:"rgba(40,96,176,0.3)"}}>📦 Ajustar inventario al conteo</OutBtn>}
                      {c.ajustado&&<Chip label="Inventario ajustado" bg="rgba(40,96,176,0.1)" color={T.client}/>}
                      {reabrir===c.id?(
                        <>
                          <button onClick={()=>{setCierres(prev=>prev.filter(x=>x.id!==c.id));setReabrir(null);}} style={{fontSize:12,background:T.expense,color:"#fff",border:"none",fontWeight:600}}>Sí, reabrir</button>
                          <button onClick={()=>setReabrir(null)} style={{fontSize:12}}>No</button>
                        </>
                      ):(
                        !c.ajustado&&<OutBtn onClick={()=>setReabrir(c.id)} danger style={{fontSize:12}}>↺ Reabrir día</OutBtn>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── INVENTARIO: vasos de palomitas y productos por pieza (solo socios) ────────
function VasosCard({popCfg,setPopCfg,stockMoves,setStockMoves,user}){
  const[add,setAdd]=useState({});
  const guardar=()=>{
    const moves=[];
    const n={...popCfg};
    POP_SIZES.forEach(k=>{const q=+add[k]||0;if(q>0){n[k]={...n[k],stock:(+n[k].stock||0)+q};moves.push({id:uid(),date:today(),pid:"pop_"+k,type:"entrada",cajas:q,note:"+"+q+" vasos "+popCfg[k].name,by:user?.name||""});}});
    if(moves.length===0)return;
    setPopCfg(n);setStockMoves([...stockMoves,...moves]);setAdd({});
  };
  return(
    <Card>
      <STitle>🍿 Vasos de palomitas</STitle>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
        {POP_SIZES.map(k=>{const st=+popCfg[k].stock||0;return(
          <div key={k} style={{padding:10,borderRadius:10,background:T.bgAlt,border:`0.5px solid ${T.border}`,textAlign:"center"}}>
            <p style={{margin:0,fontSize:12,fontWeight:600}}>{popCfg[k].name}</p>
            <p style={{margin:"2px 0 8px",fontSize:22,fontWeight:700,color:st<=0?T.expense:st<=20?"#E88020":T.profit}}>{st}</p>
            <input type="number" min="0" value={add[k]??""} onChange={e=>setAdd({...add,[k]:e.target.value})} placeholder="+ vasos" style={{textAlign:"center"}}/>
          </div>
        );})}
      </div>
      <GoldBtn onClick={guardar} style={{marginTop:10}}>+ Agregar vasos</GoldBtn>
    </Card>
  );
}

function OtrosTable({prods,sales}){
  const otros=prods.filter(p=>(p.spc||1)===1&&p.id!=="sob");
  return(
    <Card>
      <STitle>Productos por pieza (Sex Shop y otros)</STitle>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <TH cols={["Producto","En sistema","Vendido"]}/>
          <tbody>
            {otros.map((p,i)=>{const st=p.stockCajas||0;const sold=sales.reduce((s,sl)=>s+(sl.items||[]).filter(it=>it.pid===p.id).reduce((a,it)=>a+(+it.qty||0),0),0);return(
              <tr key={p.id} style={{background:i%2===0?T.bg:T.bgRow,borderBottom:`0.5px solid ${T.border}`}}>
                <td style={{padding:"8px 10px",fontWeight:600}}>{p.name}</td>
                <td style={{padding:"8px 10px",fontWeight:700,color:st<=0?T.expense:st<=2?"#E88020":T.profit}}>{st} <span style={{fontWeight:400,color:T.textMuted,fontSize:11}}>{p.unit}</span></td>
                <td style={{padding:"8px 10px",color:T.textSub}}>{sold||"—"}</td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── CAJA: dinero por cuenta (solo socios; va debajo del Cierre en la pestaña Caja) ──
function CorteCaja({sales,expenses,extras=[]}){
  const[period,setPeriod]=useState("dia");
  const[refDate,setRefDate]=useState(today());
  const getRange=()=>{
    if(period==="dia")return{start:refDate,end:refDate,label:fechaLarga(refDate)};
    if(period==="semana"){const st=weekStartOf(refDate);const e=new Date(st+"T12:00:00");e.setDate(e.getDate()+6);const o={day:"numeric",month:"short"};
      return{start:st,end:ymd(e),label:new Date(st+"T12:00:00").toLocaleDateString("es-MX",o)+" – "+e.toLocaleDateString("es-MX",o)};}
    const m=refDate.slice(0,7);return{start:m+"-01",end:m+"-31",label:new Date(refDate+"T12:00:00").toLocaleDateString("es-MX",{month:"long",year:"numeric"})};
  };
  const range=getRange();
  const fSales=sales.filter(s=>s.date>=range.start&&s.date<=range.end);
  // "Tercero" ya no se usa: solo aparece si hay ventas viejas con esa forma de pago
  const metodos=[...PAY_METHODS.filter(m=>m!=="Mixto"),...(fSales.some(s=>s.payMethod==="Tercero")?["Tercero"]:[])];
  const byMethod=metodos.map(m=>cuentaResumen(m,range,sales,expenses,extras));
  const traen=fSales.filter(s=>s.envioContra&&!s.envioDineroRecibido).reduce((a,s)=>a+(s.envioDebe||0),0);
  const sinMetodo=fSales.filter(s=>!s.payMethod).length;
  return(
    <Card>
      <STitle>Dinero por cuenta</STitle>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
        {[["dia","Día"],["semana","Semana"],["mes","Mes"]].map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)} style={{padding:"6px 14px",borderRadius:20,border:`1px solid ${period===v?T.gold:T.border}`,background:period===v?T.gold:"transparent",color:period===v?"#fff":T.textSub,fontSize:12,fontWeight:period===v?600:400}}>{l}</button>
        ))}
        <input type="date" value={refDate} onChange={e=>setRefDate(e.target.value)} style={{flex:1,minWidth:140}}/>
      </div>
      <p style={{margin:"0 0 10px",fontSize:13,fontWeight:600,color:T.gold}}>{range.label}</p>
      {sinMetodo>0&&<ErrMsg msg={sinMetodo+" venta"+(sinMetodo>1?"s":"")+" sin forma de pago"}/>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {byMethod.map(bm=>(
          <div key={bm.method} style={{background:bm.bg||T.goldBg,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${bm.c||T.gold}30`}}>
            <p style={{margin:"0 0 6px",fontWeight:700,fontSize:13,color:bm.c||T.gold}}>{bm.method}</p>
            {bm.ventasTotal>0&&<p style={{margin:"1px 0",fontSize:12,color:T.textSub}}>Ventas <strong style={{color:bm.c||T.gold}}>+{$m(bm.ventasTotal)}</strong></p>}
            {bm.envCobrado>0&&<p style={{margin:"1px 0",fontSize:12,color:T.textSub}}>Envíos <strong style={{color:bm.c||T.gold}}>+{$m(bm.envCobrado)}</strong></p>}
            {bm.mixAmt>0&&<p style={{margin:"1px 0",fontSize:12,color:T.textSub}}>Mixto <strong style={{color:bm.c||T.gold}}>+{$m(bm.mixAmt)}</strong></p>}
            {bm.extraAmt>0&&<p style={{margin:"1px 0",fontSize:12,color:T.textSub}}>Extra <strong style={{color:T.profit}}>+{$m(bm.extraAmt)}</strong></p>}
            {bm.gastosDeEsta>0&&<p style={{margin:"1px 0",fontSize:12,color:T.textSub}}>Gastos <strong style={{color:T.expense}}>−{$m(bm.gastosDeEsta)}</strong></p>}
            {bm.repPagado>0&&<p style={{margin:"1px 0",fontSize:12,color:T.textSub}}>Repartidores <strong style={{color:T.expense}}>−{$m(bm.repPagado)}</strong></p>}
            {bm.comisionAmt>0&&<p style={{margin:"1px 0",fontSize:12,color:T.textSub}}>Comisión <strong style={{color:T.expense}}>−{$m(bm.comisionAmt)}</strong></p>}
            <p style={{margin:"6px 0 0",fontSize:19,fontWeight:700,color:bm.neto>=0?T.profit:T.expense,borderTop:`1px solid ${bm.c||T.gold}30`,paddingTop:6}}>{$m(bm.neto)}</p>
          </div>
        ))}
      </div>
      {traen>0&&<p style={{margin:"10px 0 0",fontSize:12,color:T.expense,fontWeight:600}}>⚠ {$m(traen)} en efectivo todavía lo traen los repartidores</p>}
      <p style={{margin:"10px 0 0",fontSize:11,color:T.textMuted}}>Revisa: Efectivo = lo que se llevó el socio · SPIN = app de cada quien · Mercado Pago = transferencia + terminal</p>
    </Card>
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

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      <Card>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          <input type="date" value={refDate} onChange={e=>setRefDate(e.target.value)} style={{fontSize:13,maxWidth:180}}/>
          <span style={{fontSize:12,color:T.textSub}}>33% Marcel · 33% Gustavo · 34% reinversión</span>
        </div>
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
    </div>
  );
}


// ── PALOMITAS (POS rápido) ────────────────────────────────────────────────────
function Palomitas({sales,setSales,popCfg,setPopCfg,user,isAdmin,cerrados=[]}){
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

  const cerradoHoy=cerrados.includes(today());
  const cobrar=()=>{
    if(count===0||cerradoHoy)return;
    const sinVasos=POP_SIZES.filter(k=>qty[k]>(+popCfg[k].stock||0)).map(k=>popCfg[k].name);
    // Cada palomita vendida descuenta un vaso de su tamaño
    setPopCfg(prev=>{const n={...prev};POP_SIZES.forEach(k=>{if(qty[k]>0)n[k]={...n[k],stock:(+n[k].stock||0)-qty[k]};});return n;});
    const items=POP_SIZES.filter(k=>qty[k]>0).map(k=>({pid:"pop_"+k,qty:qty[k],su:"pieza",price:+popCfg[k].price||0}));
    const desc="🍿 "+POP_SIZES.filter(k=>qty[k]>0).map(k=>qty[k]+"× "+popCfg[k].name).join(", ");
    const comision=pay==="Terminal MP"?+(total*TERMINAL_FEE).toFixed(2):0;
    setSales(prev=>[...prev,{id:uid(),date:today(),tipo:"palomitas",clientId:"",pkgId:null,total,cost:cost+comision,comision,desc,items,note:"",payMethod:pay,
      mixEfectivo:0,mixTransferencia:0,mixCuenta:"",envio:0,costoEnvio:0,by:user?.name||"",hora:horaAhora(),sinStock:sinVasos}]);
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
        {cerradoHoy&&<div style={{marginBottom:12,padding:"10px 12px",borderRadius:8,background:"rgba(192,64,64,0.08)",border:"1px solid rgba(192,64,64,0.3)",fontSize:13,color:T.expense,fontWeight:600}}>🔒 El día de hoy ya se cerró.</div>}
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
                      <button onClick={()=>{setPopCfg(prev=>{const n={...prev};(s.items||[]).forEach(it=>{const k=(it.pid||"").replace("pop_","");if(n[k])n[k]={...n[k],stock:(+n[k].stock||0)+(+it.qty||0)};});return n;});setSales(prev=>prev.filter(x=>x.id!==s.id));setConfirmDel(null);}} style={{fontSize:11,background:T.expense,color:"#fff",border:"none",fontWeight:600,padding:"4px 8px"}}>Borrar</button>
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
            <p style={{margin:"0 0 10px",fontSize:11,color:T.textMuted}}>Aplica a ventas nuevas.</p>
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
  {k:"caja", l:"Caja",          s:"Caja",    icon:"ti-report-money",  color:T.profit},
  {k:"envios",l:"Envíos",       s:"Envíos",  icon:"ti-motorbike",     color:T.client},
  {k:"inv",  l:"Inventario",    s:"Inventario",icon:"ti-package",     color:T.client},
  {k:"gasto",l:"Gastos",        s:"Gastos",  icon:"ti-wallet",        color:T.expense},
  {k:"cli",  l:"Clientes",      s:"Clientes",icon:"ti-users",         color:T.client},
  {k:"catalogo",l:"Catálogo",   s:"Catálogo",icon:"ti-droplet-half-2",color:T.cost,    admin:true},
  {k:"reparto",l:"Reparto de utilidades",s:"Reparto",icon:"ti-users-group",color:T.pkg,admin:true},
];
// Qué va fijo en la barra de abajo; lo demás queda en "Más"
const NAV_MAIN={admin:["dash","venta","pop","caja"],staff:["venta","pop","envios","inv","caja"]};

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
  const[cierres,setCierres]=useState([]);
  const[ready,setReady]=useState(false);
  const[leaving,setLeaving]=useState(false);

  useEffect(()=>{
    (async()=>{
      let[p,pk,c,s,e,sm,ex,pop,fx,ci]=await Promise.all([load(SK.p,INIT_PRODS),load(SK.pk,INIT_PKGS),load(SK.c,[]),load(SK.s,[]),load(SK.e,[]),load(SK.sm,[]),load(SK.ex,[]),load(SK.pop,INIT_POP),load(SK.fx,INIT_FIXED),load(SK.ci,[])]);
      // Merge new products
      const ids=new Set(p.map(x=>x.id));
      INIT_PRODS.forEach(ip=>{if(!ids.has(ip.id))p.push(ip);});
      // Apply latest names/structure but RESPECT user-edited costs
      // Only set cost if the product doesn't have one yet (new products)
      p=p.map(x=>{const ip=INIT_PRODS.find(i=>i.id===x.id);if(!ip)return x;return{...x,name:ip.name,spc:ip.spc,tiers:ip.tiers,spcu:x.spcu||ip.spcu,cost:(x.cost!=null&&x.cost>0)?x.cost:ip.cost};});
      // Migrate old stock field
      p=p.map(x=>{if(x.stockCajas!=null)return x;const spc=x.spc||1;const old=x.stock||0;return{...x,stockCajas:Math.floor(old/spc),stockSobres:old%spc,stock:undefined};});
      // Fix categories
      const fix=new Set(["gom","gom_f","gom_m","rchv","rhch","ppch"]);
      // Productos que ya no existen. "sob" (sobre individual genérico): ahora cada sobre se vende por marca.
      p=p.filter(x=>x.id!=="gom"&&x.id!=="pp12"&&x.id!=="sob");
      // Chocolates: vienen en sobres (no piezas) y el sobre vale $200. Solo se cambia si seguía el default viejo de $150.
      const CHOCO_IDS=["rchv","rhch","ppch"];
      p=p.map(x=>{if(!CHOCO_IDS.includes(x.id))return x;const{spcu,...r}=x;return{...r,listSobre:(x.listSobre&&x.listSobre!==150)?x.listSobre:200};});
      p=p.map(x=>fix.has(x.id)?{...x,cat:"Miel"}:x);
      setProds(p);setPkgs(pk);setClients(c);setSales(s);setExpenses(e);setStockMoves(sm);setExtras(ex);
      // Igual que con productos: el default de insumos solo entra si no hay costo capturado (0 o vacío)
      const popM={};POP_SIZES.forEach(k=>{const st=(pop||{})[k]||{};popM[k]={...INIT_POP[k],...st,cost:(+st.cost>0)?+st.cost:INIT_POP[k].cost};});
      setPopCfg(popM);
      // Fijos: guardado como {v,items}. Si viene de una versión anterior, se agregan los fijos nuevos
      // por default que falten (sin tocar montos que ya editaron). Después se respetan tal cual.
      const fxItems=Array.isArray(fx)?fx:(fx&&Array.isArray(fx.items)?fx.items:INIT_FIXED);
      const fxVer=Array.isArray(fx)?1:(fx&&fx.v)||1;
      setCierres(Array.isArray(ci)?ci:[]);
      // Solo se agregan los defaults que se crearon después de la versión guardada (si borraron uno viejo, no regresa)
      setFixed(fxVer>=FIXED_VER?fxItems:[...fxItems,...INIT_FIXED.filter(d=>(d.ver||1)>fxVer&&!fxItems.some(x=>x.id===d.id))]);
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
  useEffect(()=>{if(ready){const t=setTimeout(()=>save(SK.ci,cierres),800);return()=>clearTimeout(t);}},[cierres,ready]);

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
  const props={prods,setProds,pkgs,setPkgs,clients,setClients,sales,setSales,expenses,setExpenses,stockMoves,setStockMoves,extras,setExtras,user,isAdmin,fixed,setFixed,goTab:setTab,popCfg,setPopCfg,cierres,setCierres,cerrados:cierres.map(c=>c.date)};
  const cur=myTabs.find(t=>t.k===tab)||myTabs[0];
  const can=k=>myTabs.some(t=>t.k===k);
  // Al salir se desmonta todo y el debounce de 800 ms se cancelaría: guardamos todo antes
  const logout=async()=>{
    if(leaving)return;
    setLeaving(true);
    await Promise.all([save(SK.p,prods),save(SK.pk,pkgs),save(SK.c,clients),save(SK.s,sales),save(SK.e,expenses),save(SK.sm,stockMoves),save(SK.ex,extras),save(SK.pop,popCfg),save(SK.fx,{v:FIXED_VER,items:fixed}),save(SK.ci,cierres)]);
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
            <button onClick={logout} title="Cambiar de usuario" style={{fontSize:11,color:T.textSub,border:`1px solid ${T.border}`,borderRadius:20,padding:"4px 10px",minHeight:30,whiteSpace:"nowrap"}}>
              {leaving?"Guardando…":user.name+" · Salir"}
            </button>
          </div>
        </div>
      </div>
      {cur.k==="dash"  && <Dashboard  {...props} sales={repSales} expenses={repExpenses} extras={repExtras}/>}
      {cur.k==="catalogo" && can("catalogo") && <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}><Productos {...props}/><Paquetes {...props}/></div>}
      {cur.k==="cli"   && <Clientes   {...props}/>}
      {cur.k==="venta" && <NuevaVenta {...props}/>}
      {cur.k==="pop"   && <Palomitas sales={sales} setSales={setSales} popCfg={popCfg} setPopCfg={setPopCfg} user={user} isAdmin={isAdmin} cerrados={props.cerrados}/>}
      {cur.k==="gasto" && <Gastos     {...props}/>}
      {cur.k==="envios"&& <Envios     {...props}/>}
      {cur.k==="caja"  && <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
        <CierreDia {...props}/>
        {isAdmin&&<CorteCaja sales={repSales} expenses={repExpenses} extras={repExtras}/>}
      </div>}
      {cur.k==="inv"   && <Inventario {...props}/>}
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
