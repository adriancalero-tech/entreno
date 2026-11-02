"use strict";

// Analítica de solo lectura. Las fechas de agenda son días civiles, nunca medianoches locales.
const Insights = (() => {
  const madrid = new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit"});
  const msDay = 86400000;
  const dateCache=new Map();
  function dateKey(value = Date.now()) {
    if (value == null || value === "") return "";
    if (typeof value==="string" && dateCache.has(value)) return dateCache.get(value);
    const d = new Date(value);
    if (!Number.isFinite(+d)) return "";
    const parts = Object.fromEntries(madrid.formatToParts(d).map(p=>[p.type,p.value]));
    const key=[parts.year,parts.month,parts.day].join("-");
    if (typeof value==="string") {
      if (dateCache.size>=4096) dateCache.clear();
      dateCache.set(value,key);
    }
    return key;
  }
  const utc = key => Date.parse(key+"T12:00:00Z");
  const iso = stamp => new Date(stamp).toISOString().slice(0,10);
  const validDay = key => typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(utc(key)) && iso(utc(key)) === key;
  const plus = (key,n) => iso(utc(key)+n*msDay);
  const days = (from,to) => (utc(to)-utc(from))/msDay;
  const monday = key => plus(key,-((new Date(utc(key)).getUTCDay()+6)%7));
  function month(key,n) {
    const d = new Date(utc(key.slice(0,7)+"-01"));
    d.setUTCMonth(d.getUTCMonth()+n);
    return iso(+d);
  }
  const fields = {energy:["Baja","Media","Alta"],fatigue:["Baja","Media","Alta"],soreness:["Leves","Moderadas","Intensas"],pain:["Ninguna","Muscular","Articular"],left:["Sin molestias","Fatiga muscular","Fatiga alta","Molestia articular"]};
  function validateExtras(data) {
    const {plans,wellness} = data;
    if (!Array.isArray(plans) || !Array.isArray(wellness)) throw Error("Faltan agenda o registros de recuperación.");
    const unique = (list,field) => new Set(list.map(x=>x[field])).size === list.length;
    if (!plans.every(p=>p && typeof p.id==="string" && /^[A-Za-z0-9-]{1,100}$/.test(p.id) && validDay(p.date) && ["rest","3p1-a","3p1-b","3p1-c","3p1-d"].includes(p.dayId)) || !unique(plans,"id") || !unique(plans,"date")) throw Error("Planificación inválida o duplicada.");
    if (!wellness.every(w=>w && validDay(w.date) && Object.entries(fields).every(([k,opts])=>w[k]==null || opts.includes(w[k])) && (w.note==null || typeof w.note==="string" && w.note.length<=300)) || !unique(wellness,"date")) throw Error("Registro de recuperación inválido o duplicado.");
    const steps = data.settings.variantSteps;
    if (steps !== undefined && (!steps || typeof steps!=="object" || Array.isArray(steps) || !Object.entries(steps).every(([k,v])=>k.startsWith("3p1-") && Number.isFinite(v) && v>0 && v<=50))) throw Error("Incrementos de carga inválidos.");
  }
  const sessionDate = s => dateKey(s.startedAt) || dateKey(s.finishedAt);
  const done = ex => ex.status === "skipped" ? [] : ex.workingSets.filter(s=>s.completed === true);
  const count = s => s.exercises.reduce((n,ex)=>n+done(ex).length,0);
  function planMatch(plan,history) {
    return history.find(s=>s.finishedAt && s.dayId===plan.dayId && sessionDate(s)===plan.date && sessionResult(s)==="complete") ||
      history.find(s=>s.finishedAt && s.dayId===plan.dayId && sessionDate(s)===plan.date);
  }
  function forecast(next, plans, history, date, today) {
    const order = ["3p1-a","3p1-b","3p1-c","3p1-d"];
    for (const p of [...plans].sort((a,b)=>a.date.localeCompare(b.date))) {
      if (p.date<today || p.date>=date || p.dayId==="rest" || planMatch(p,history)) continue;
      if (p.dayId===next || (next==="3p1-d" && p.dayId==="3p1-a")) next = order[(order.indexOf(p.dayId)+1)%4];
    }
    return next==="3p1-d" ? ["3p1-a","3p1-d"] : [next];
  }
  function conflicts(plan, plans, history) {
    const day=dayById(plan.dayId);
    if (!day) return [];
    const targets=new Set(day.exercises.flatMap(ex=>musclesFor(ex.id)));
    const hits=[];
    const own=planMatch(plan,history);
    for (const s of history) {
      const end=dateKey(s.finishedAt);
      if (!end || days(end,plan.date)>2 || s===own) continue;
      const matched=s.exercises.some(ex=>done(ex).some(set=>{
        const key=dateKey(set.completedAt) || dateKey(s.finishedAt);
        return key && days(key,plan.date)>=0 && days(key,plan.date)<=2 && musclesFor(ex.id,set.variant ?? ex.variant).some(m=>targets.has(m));
      }));
      if (matched) hits.push("sesión realizada "+s.dayName);
    }
    for (const p of plans) {
      const other=dayById(p.dayId);
      if (!other || p.id===plan.id || Math.abs(days(p.date,plan.date))>2 || planMatch(p,history)) continue;
      if (other.exercises.some(ex=>musclesFor(ex.id).some(m=>targets.has(m)))) hits.push("plan "+other.letter+" ("+p.date+")");
    }
    return [...new Set(hits)];
  }
  function ics(plans,now=new Date()) {
    const compact=s=>s.replaceAll("-","");
    const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Entreno//Agenda 3+1//ES","CALSCALE:GREGORIAN"];
    for (const p of plans) {
      const d=dayById(p.dayId); if (!d) continue;
      lines.push("BEGIN:VEVENT","UID:"+p.id+"@entreno.local","DTSTAMP:"+now.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,""),"DTSTART;VALUE=DATE:"+compact(p.date),"DTEND;VALUE=DATE:"+compact(plus(p.date,1)),"SUMMARY:Entreno "+d.letter+" - "+d.name+(d.optional?" (opcional)":""),"END:VEVENT");
    }
    // Los únicos valores variables largos son UIDs validados como ASCII.
    return [...lines,"END:VCALENDAR",""].map(line=>line.length<=75?line:line.match(/.{1,74}/g).join("\r\n ")).join("\r\n");
  }

  const variant = v => String(v??"").trim().replace(/\s+/g," ").toLowerCase();
  const identified = v => Boolean(variant(v)) && !/^(máquina|maquina|polea|cable|multipower|smith|sin identificar|desconocid[ao])$/.test(variant(v));
  const number = v => (typeof v==="string" && v.trim()!=="" || typeof v==="number") && Number.isFinite(Number(v)) ? Number(v) : null;
  const rir = v => /^[0-4]\+?$/.test(String(v??"")) ? parseInt(v,10) : null;
  function row(set,ex) {
    const weight=number(set.weight), left=number(set.reps), right=number(set.repsRight);
    const unilateral="repsRight" in set || ["3p1-bulgara","sentadilla-bulgara","remo-unilateral","jalon-unilateral"].includes(ex.id);
    if (weight==null || weight<0 || !Number.isSafeInteger(left) || left<=0 || (unilateral && (!Number.isSafeInteger(right)||right<=0))) return null;
    const reps=unilateral?Math.min(left,right):left;
    const equip=variant(set.variant ?? ex.variant);
    const r=rir(set.actualRir);
    const estimate=weight>0 && !unilateral && /^barra(?: |$)/.test(equip) && !/máquina|multipower|guiada|smith/.test(equip) && ["3p1-sentadilla","3p1-peso-muerto","3p1-plano","3p1-inclinado","3p1-press-hombro"].includes(ex.id) && reps>=2 && reps<=10 && r!==null && r<=2 ? weight*(1+reps/30) : null;
    return {weight,reps,left,right:unilateral?right:null,volume:weight*(unilateral?left+right:left),estimate,rir:r};
  }
  function exposures(history,id,equip,includeIncomplete=false) {
    const key=variant(equip);
    if (!identified(key)) return [];
    const out=[];
    for (const s of history) {
      if (!s.finishedAt) continue;
      for (const ex of s.exercises) {
        if (ex.id!==id) continue;
        const sets=done(ex).filter(set=>variant(set.variant ?? ex.variant)===key);
        const rows=sets.map(set=>row(set,ex)).filter(Boolean);
        const end=Date.parse(s.finishedAt);
        if ((rows.length || includeIncomplete && sets.length) && Number.isFinite(end)) {
          const at=sets.reduce((latest,set)=>{const t=Date.parse(set.completedAt);return Math.max(latest,Number.isFinite(t)&&t<=end?t:end);},-Infinity);
          out.push({date:dateKey(at),at,rows,ex,full:rows.length===ex.workingSets.length});
        }
      }
    }
    return out.sort((a,b)=>a.at-b.at);
  }
  const best = rows => rows.reduce((a,b)=>!a || b.weight>a.weight || b.weight===a.weight && b.reps>a.reps?b:a,null);
  function caution(w,lower) {
    if (w?.pain==="Articular" || w?.left==="Molestia articular") return "Has registrado molestia articular. Evita forzar la progresión; no se propone una carga.";
    if (w?.energy==="Baja" || w?.fatigue==="Alta" || w?.soreness==="Intensas" || w?.pain==="Muscular" || (lower && ["Fatiga alta","Fatiga muscular"].includes(w?.left))) return "La recuperación registrada hoy aconseja no subir la carga.";
    return "";
  }
  function suggest(ex,history,settings,well,today=dateKey()) {
    const evidence=exposures(history,ex.id,ex.variant,true).filter(p=>p.date<=today);
    const last=evidence.at(-1), previous=evidence.at(-2);
    const warn=caution(well,ex.group==="lower");
    const hold=(text,extra={})=>({kind:"hold",text,...extra});
    if (!last?.rows.length) return {kind:"none",text:[warn,"Sin evidencia comparable. Identifica la máquina o variante y registra una serie efectiva con carga y repeticiones."].filter(Boolean).join(" ")};
    const recent=last.rows, weight=recent[0].weight, ago=days(last.date,today);
    const summary=last.date+" · "+recent.map(r=>r.weight+" kg × "+(r.right===null?r.reps:r.left+"/"+r.right)).join(" · ");
    const bits={summary,ago};
    if (warn && /articular/.test(warn)) return hold(warn,bits);
    if (recent.some(r=>r.weight!==weight) || weight<=0) return hold("Cargas variables o sin lastre: consulta las series; no hay un único peso objetivo.",bits);
    const target=ex.workingSets[0];
    const comparable=p=>p?.full && p.rows.every(r=>r.weight===weight) && p.ex.workingSets.length===ex.workingSets.length && p.ex.workingSets.every((s,i)=>["minReps","maxReps","targetRir"].every(k=>String(s[k])===String(ex.workingSets[i][k])));
    const top=p=>comparable(p) && p.rows.every((r,i)=>r.reps>=ex.workingSets[i].maxReps && r.rir!==null && /^\d/.test(ex.workingSets[i].targetRir) && r.rir>=parseInt(ex.workingSets[i].targetRir,10));
    const repsTotal=p=>p.rows.reduce((n,r)=>n+r.reps,0);
    const falling=comparable(last) && comparable(previous) && repsTotal(last)<repsTotal(previous);
    if (warn) return hold((falling?"Han bajado las repeticiones a igual carga. ":"")+warn+" Mantén o reduce el esfuerzo según te encuentres.",bits);
    if (ago>21 || !comparable(last)) return hold(ago>21?"Han pasado más de 3 semanas. Revalora la carga antes de retomarla.":"Exposición parcial o prescripción distinta: conserva la referencia, sin subir.",bits);
    const base={...bits,weight};
    const reps=Math.min(...recent.map(r=>r.reps));
    const lowRir=recent.some((r,i)=>r.rir!==null && r.rir<parseInt(ex.workingSets[i].targetRir,10));
    if (lowRir || falling) return hold("Mantén "+weight+" kg: "+(lowRir?"el esfuerzo superó el RIR previsto.":"las repeticiones bajaron a igual carga."),base);
    if (top(last) && top(previous) && days(previous.date,last.date)<=21 && previous.date!==last.date) {
      const compound=/^3p1-(sentadilla|peso-muerto|prensa|plano|inclinado|press-hombro|remo-.+|jalon.*|bulgara)$/.test(ex.id);
      const groupStep=ex.group==="lower"?settings.lowerIncrement:settings.upperIncrement;
      const step=settings.variantSteps?.[ex.id+"|"+variant(ex.variant)] ?? Math.min(groupStep,compound?(/barra/.test(variant(ex.variant)) && ex.group==="lower"?5:2.5):1);
      if (step>0 && step<=weight*.05+1e-8) {
        const next=+(weight+step).toFixed(2);
        return {kind:"raise",text:"Puedes valorar "+next+" kg × "+target.minReps+" si la técnica fue estable: dos exposiciones completas en el máximo con RIR compatible.",...bits,weight:next};
      }
      return hold("Mantén "+weight+" kg: el incremento disponible supera el 5 %. Si tienes microcargas, ajusta el salto del equipo.",base);
    }
    const stagnant=comparable(previous) && repsTotal(previous)===repsTotal(last);
    const below=reps<target.maxReps;
    return hold("Mantén "+weight+" kg. "+(below?(stagnant?"Rendimiento estable. ":"")+"Busca "+Math.min(target.maxReps,reps+1)+" reps en una serie, respetando el RIR.":"Antes de subir, confirma dos exposiciones completas con RIR registrado."),base);
  }
  // Una serie = un grupo principal. El mapa de recuperación sí incluye secundarios.
  function primary(ex,set) {
    const id=ex.id.replace(/^3p1-/,"");
    if (id==="gemelos-abdominales") return ["gemelos","abdominales"].includes(variant(set.variant ?? ex.variant))?variant(set.variant ?? ex.variant):"sin clasificar";
    if (/curl-tumbado|curl-femoral|peso-muerto/.test(id)) return "cadena posterior";
    if (/sentadilla|hack-squat|prensa|bulgara|extension-cuadriceps/.test(id)) return "cuádriceps";
    if (/jalon-triceps|triceps/.test(id)) return "tríceps";
    if (/remo|jalon|dominadas/.test(id)) return "espalda";
    if (/hombro|lateral|reverse|pajaros/.test(id)) return "hombros";
    if (/inclinado|plano|aperturas|fondos/.test(id) && !id.startsWith("curl")) return "pectorales";
    if (/curl|predicador/.test(id)) return "bíceps";
    if (/gemel/.test(id)) return "gemelos";
    if (/abdominal/.test(id)) return "abdominales";
    return id==="aductor"?"aductores":"sin clasificar";
  }
  function aggregate(history,plans,from,to,today=dateKey()) {
    const stats={sessions:0,partial:0,sets:0,minutes:[],muscles:new Map(),weeks:new Map(),months:new Map(),due:0,met:0,planPartial:0};
    for (const s of history) {
      const date=sessionDate(s);
      if (!s.finishedAt || !date || date<from || date>to) continue;
      const n=count(s); if (!n) continue;
      stats.sessions++; stats.sets+=n;
      if (sessionResult(s)==="partial") stats.partial++;
      const minutes=(Date.parse(s.finishedAt)-Date.parse(s.startedAt)-(s.pausedMs??0))/60000;
      if (Number.isFinite(minutes) && minutes>0 && minutes<=360) stats.minutes.push(minutes);
      for (const [map,key] of [[stats.weeks,monday(date)],[stats.months,date.slice(0,7)]]) map.set(key,(map.get(key)||0)+1);
      for (const ex of s.exercises) for (const set of done(ex)) {
        const group=primary(ex,set);
        stats.muscles.set(group,(stats.muscles.get(group)||0)+1);
      }
    }
    for (const p of plans) {
      if (p.dayId==="rest" || p.date<from || p.date>to || p.date>today) continue;
      const match=planMatch(p,history);
      if (!match && p.date===today) continue;
      stats.due++; if (!match) continue;
      if (sessionResult(match)==="complete") stats.met++; else stats.planPartial++;
    }
    return stats;
  }
  return {dateKey,validDay,plus,days,monday,month,fields,validateExtras,sessionDate,done,count,planMatch,forecast,conflicts,ics,variant,identified,row,exposures,best,caution,suggest,primary,aggregate};
})();
