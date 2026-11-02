import assert from "node:assert/strict";

export function verifyInsights(api,check,saved) {
  const I=api.Insights, [a,b,c,d]=api.currentProgram.days, config=api.defaults().settings;
  const today="2026-04-05", plain=v=>JSON.parse(JSON.stringify(v));
  function entry(day,index,date,weight=60,reps=10,v="Barra",rir="2") {
    const s=api.createSession(day);
    s.startedAt=date+"T09:00:00Z";s.finishedAt=date+"T10:00:00Z";
    const ex=s.exercises[index];ex.variant=v;
    ex.workingSets.forEach(set=>Object.assign(set,{weight:String(weight),reps:String(reps),completed:true,variant:v,actualRir:rir,completedAt:s.finishedAt}));
    return s;
  }
  const base=[entry(a,0,"2026-03-26"),entry(a,0,"2026-04-02")], exercise=base[0].exercises[0];
  const rec=(hist=base,w,settings=config)=>I.suggest(exercise,hist,settings,w,today);
  check("Madrid: medianoche, DST de marzo/octubre, lunes ISO, febrero bisiesto y cambio de año",()=>{
    assert.equal(I.dateKey("2026-03-29T22:01:00Z"),"2026-03-30");
    assert.equal(I.dateKey("2026-10-25T22:30:00Z"),"2026-10-25");
    assert.equal(I.dateKey("2026-10-25T23:30:00Z"),"2026-10-26");
    assert.equal(I.days("2026-03-28","2026-03-30"),2);
    assert.equal(I.monday("2026-01-01"),"2025-12-29");
    assert.equal(I.month("2025-12-31",1),"2026-01-01");
    assert.equal(I.plus("2024-02-28",1),"2024-02-29");
    assert.equal(I.validDay("2026-02-29"),false);
  });
  const plans=[{id:"qa-a",date:"2026-04-06",dayId:a.id},{id:"qa-b",date:"2026-04-08",dayId:b.id},{id:"qa-c",date:"2026-04-10",dayId:c.id}];
  check("Previsión A/B/C/D opcional: ignora planes vencidos o realizados, sin mover el ciclo",()=>{
    assert.deepEqual(plain(I.forecast(a.id,plans,[],"2026-04-09",today)),[c.id]);
    assert.deepEqual(plain(I.forecast(a.id,plans,[],"2026-04-12",today)),[a.id,d.id]);
    assert.deepEqual(plain(I.forecast(b.id,plans,[],"2026-04-15","2026-04-14")),[b.id]);
    const past=entry(a,0,plans[0].date);
    assert.deepEqual(plain(I.forecast(b.id,plans,[past],"2026-04-07",today)),[b.id]);
  });
  check("Avisos entre planes y efectivas B/C, D/A; descanso sin exposición",()=>{
    const near={id:"check",date:"2026-04-09",dayId:c.id};
    assert.match(I.conflicts(near,plans,[]).join(" "),/plan B/);
    assert.match(I.conflicts(near,[],[entry(b,0,"2026-04-08")]).join(" "),/Pierna/);
    assert.equal(I.conflicts(near,[],[entry(b,5,"2026-04-08")]).length,0);
    assert.match(I.conflicts({...near,dayId:a.id},[{id:"d",dayId:d.id,date:near.date}],[]).join(" "),/plan D/);
  });
  check("ICS: días completos sin desplazamiento UTC, identificador estable, fin exclusivo y sin datos privados",()=>{
    const text=I.ics([...plans,{id:"r",date:today,dayId:"rest"}],new Date("2026-04-05T09:00:00Z"));
    assert.equal(text.match(/BEGIN:VEVENT/g).length,3);
    assert.match(text,/UID:qa-a@entreno.local\r\n/);assert.match(text,/DTSTART;VALUE=DATE:20260406\r\nDTEND;VALUE=DATE:20260407/);
    assert.doesNotMatch(text,/fatigue|OBSERVACIONES|Europe\/Madrid/);
    const long=I.ics([{...plans[0],id:"a".repeat(90)}]);
    assert.ok(long.split("\r\n").every(line=>Buffer.byteLength(line)<=75));
  });
  check("Dos exposiciones con RIR, mismo equipo y carga → subida editable, sin mutar ninguna serie",()=>{
    const before=JSON.stringify(base);
    assert.equal(rec().weight,62.5);assert.equal(rec().kind,"raise");assert.equal(rec().ago,3);
    assert.equal(rec(base,{}, {...config,variantSteps:{[exercise.id+"|barra"]:1}}).weight,61);
    assert.equal(JSON.stringify(base),before);
    assert.equal(rec([base[1]]).kind,"hold");
  });
  check("No se mezclan variantes, máquinas genéricas, ejercicios con igual nombre ni series de una exposición mixta",()=>{
    for(const v of ["","Máquina","Polea","Máquina 7"]) assert.equal(I.suggest({...exercise,variant:v},base,config,{},today).kind,"none");
    assert.equal(I.exposures(base,"id-distinto","Barra").length,0);
    const mixed=structuredClone(base);
    mixed[1].exercises[0].workingSets[0].variant="Máquina 2";
    assert.equal(rec(mixed).weight,undefined);
    assert.equal(I.exposures(mixed,exercise.id,"Máquina 2")[0].rows.length,1);
  });
  check("RIR ausente, parcial, carga heterogénea, pausa larga o técnica no confirmada no justifican una subida automática",()=>{
    const history=structuredClone(base);
    history[1].exercises[0].workingSets[0].actualRir="";
    assert.equal(rec(history).kind,"hold");
    history[1].exercises[0].workingSets[0].completed=false;
    assert.equal(rec(history).weight,undefined);
    history[1].exercises[0].workingSets[1].weight="50";
    assert.equal(rec(history).kind,"hold");
    assert.match(I.suggest(exercise,base,config,{},"2026-06-01").text,/3 semanas/);
    assert.match(rec().text,/técnica/);
    const incomplete=entry(a,0,"2026-04-04");
    incomplete.exercises[0].workingSets.forEach(set=>set.reps="");
    assert.equal(rec([...base,incomplete]).kind,"none");
  });
  check("Fatiga + bajada, precaución articular y percepción izquierda; ninguna señal inventada",()=>{
    const history=structuredClone(base);
    history[1].exercises[0].workingSets[1].reps="8";
    assert.match(rec(history,{fatigue:"Alta"}).text,/bajado.*no subir/);
    assert.equal(rec(base,{pain:"Articular"}).weight,undefined);
    assert.equal(rec(base,{left:"Fatiga alta"}).kind,"raise");
    const leg=entry(b,0,"2026-04-03",100,8,"Barra libre","3");
    assert.match(I.suggest(leg.exercises[0],[leg],config,{left:"Fatiga alta"},today).text,/no subir/);
    assert.match(rec(history).text,/bajaron/);
  });
  check("Salto por equipamiento y ejercicio, límite del 5 %, prioridad a repeticiones y estancamiento",()=>{
    const curl1=entry(a,5,"2026-03-26",30,12,"Banco 2","2"), curl2=entry(a,5,"2026-04-02",30,12,"Banco 2","2");
    assert.equal(I.suggest(curl2.exercises[5],[curl1,curl2],config,{},today).weight,31);
    assert.match(rec(base,{}, {...config,variantSteps:{[exercise.id+"|barra"]:5}}).text,/5 %/);
    const hist=structuredClone(base);for(const s of hist) s.exercises[0].workingSets[0].reps="8";
    assert.match(rec(hist).text,/estable.*9 reps/);
  });
  check("Métricas: Epley solo cuando procede, kilos×reps bilaterales y por pierna, faltantes nunca son cero",()=>{
    const set=exercise.workingSets[0];
    assert.equal(I.row(set,exercise).volume,600);
    assert.equal(I.row(set,exercise).estimate,80);
    assert.equal(I.row({...set,variant:"Máquina 34"},exercise).estimate,null);
    assert.equal(I.row({...set,actualRir:""},exercise).estimate,null);
    assert.equal(I.row({...set,weight:""},exercise),null);
    const leg={id:"3p1-bulgara"};assert.equal(I.row(set,leg),null);
    const uni=I.row({...set,reps:"8",repsRight:"10",weight:"20"},leg);
    assert.equal(uni.volume,360);assert.equal(uni.reps,8);assert.equal(uni.estimate,null);
    assert.equal(I.best([uni,I.row(set,exercise)]).weight,60);
  });
  check("Frecuencia, grupos, duración y cumplimiento se basan en hechos; nada pendiente, futuro u omitido cuenta",()=>{
    const partial=entry(a,0,"2026-04-02"), full=entry(b,0,"2026-04-03"), empty=entry(c,0,"2026-04-04");
    empty.exercises[0].status="skipped"; partial.pausedMs=20*60000;
    for (const ex of full.exercises) for (const set of ex.workingSets) set.completed=true;
    const past=[partial,full,empty], schedule=past.map((s,i)=>({id:"p"+i,date:I.sessionDate(s),dayId:s.dayId}));
    const snapshot=JSON.stringify(past);
    const stats=I.aggregate(past,[...schedule,...plans,{id:"rest",date:"2026-04-01",dayId:"rest"}],"2026-04-01",today,today);
    assert.equal(stats.sessions,2);assert.equal(stats.partial,1);assert.equal(stats.sets,15);
    assert.deepEqual(plain(stats.minutes),[40,60]);assert.equal(stats.due,3);assert.equal(stats.met,1);
    assert.equal(stats.weeks.get("2026-03-30"),2);assert.equal(stats.months.get("2026-04"),2);
    assert.equal(stats.muscles.get("pectorales"),3);assert.equal([...stats.muscles.values()].reduce((a,b)=>a+b),15);
    assert.equal(JSON.stringify(past),snapshot);
  });
  check("V4→V5: historial y sesión pausada idénticos; copia literal previa independiente y exportación V5 reversible",()=>{
    const old={schemaVersion:4,settings:config,activeSession:{...entry(b,0,today),finishedAt:null,pausedAt:Date.now()},history:base};
    const raw=JSON.stringify(old,null,1);saved.set("entreno.data",raw);
    const before=new Map([...saved].filter(([key])=>key.startsWith("entreno.backup.")));
    const loaded=api.storage.load();assert.deepEqual(plain(loaded.history),plain(old.history));assert.deepEqual(plain(loaded.activeSession),plain(old.activeSession));
    assert.deepEqual(plain(loaded.plans),[]);assert.deepEqual(plain(loaded.wellness),[]);
    assert.equal(saved.get("entreno.data"),raw);assert.equal(api.storage.save(loaded),true);
    assert.ok([...saved].some(([k,v])=>k.startsWith("entreno.backup.before-adaptive")&&v===raw));
    for(const [key,value] of before) assert.equal(saved.get(key),value);
    loaded.plans=plans;loaded.wellness=[{date:today,pain:"Muscular",note:"observación local"}];
    assert.deepEqual(plain(api.storage.import(api.storage.export(loaded))),plain(loaded));
    assert.throws(()=>api.storage.validate({...loaded,plans:[...plans,plans[0]]}),/duplicada/);
    assert.throws(()=>api.storage.validate({...loaded,wellness:[{date:today,pain:"?"}]}),/inválido/);
    assert.throws(()=>api.storage.validate({...loaded,plans:null}),/agenda/);
  });
}
