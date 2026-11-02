"use strict";

const uiPlan = {date:Insights.dateKey(), view:"month"};
const uiStats = {weeks:"4",id:"",variant:"",metric:"weight",bucket:"weeks"};
const todayWellness = (date=Insights.dateKey()) => state.wellness.find(w=>w.date===date);
const fmtN = n => new Intl.NumberFormat("es-ES",{maximumFractionDigits:1}).format(n);
const fmtDay = (key,opts={day:"numeric",month:"short"}) => new Intl.DateTimeFormat("es-ES",{...opts,timeZone:"UTC"}).format(new Date(key+"T12:00:00Z"));
const opt = (val,label,selected) => `<option value="${escapeHtml(val)}" ${val===selected?"selected":""}>${escapeHtml(label)}</option>`;
const dayLabel = id => {const d=dayById(id);return d ? d.letter+" · "+d.name+(d.optional?" (opcional)":"") : "Descanso";};
function replaceFeatureState(next) {
  if (!storage.save(next)) return false;
  state=next;
  return true;
}
const wellLabels={energy:"Energía",fatigue:"Fatiga muscular",soreness:"Agujetas",pain:"Molestias",left:"Pierna izquierda"};
function wellnessForm() {
  const date=Insights.dateKey(), w=todayWellness(date) || {};
  return `<details class="panel compact"><summary>Recuperación de hoy <small>${w.date?"Registrada · editar":"Opcional · registrar"}</small></summary>
    <div class="feature-fields">${Object.entries(Insights.fields).map(([k,options])=>`<label>${wellLabels[k]}<select data-well="${k}">${opt("","Sin registrar",w[k]||"")}${options.map(v=>opt(v,v,w[k])).join("")}</select></label>`).join("")}</div>
    <label>Observaciones breves<textarea maxlength="300" data-well="note">${escapeHtml(w.note||"")}</textarea></label>
    <button class="button secondary full" data-action="well-save" data-date="${date}">Guardar recuperación</button>
    <p class="small muted">Puedes dejar cualquier campo en blanco. Este registro orienta el esfuerzo; no es un diagnóstico.</p></details>`;
}
function homeInsights(next) {
  const today=Insights.dateKey(), from=Insights.plus(today,-6);
  const recent=Insights.aggregate(state.history,[],from,today,today);
  const last=state.history.find(s=>s.finishedAt && Insights.count(s)>0);
  const upcoming=state.plans.filter(p=>p.date>=today && !Insights.planMatch(p,state.history)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,2);
  const w=todayWellness(today);
  const refs=[];
  for (const ex of next.exercises) {
    const prior=state.history.flatMap(s=>s.exercises.filter(item=>item.id===ex.id && Insights.done(item).length)).at(0);
    const equip=ex.variants?.length===1?ex.variants[0]:prior && Insights.done(prior).at(-1);
    const label=typeof equip==="string"?equip:equip?.variant??prior?.variant;
    if (!Insights.identified(label)) continue;
    const rec=Insights.suggest({...ex,workingSets:prescribedSets(ex),variant:label,group:ex.group||next.group},state.history,state.settings,w,today);
    if (rec.weight!=null) refs.push(ex.name+" · "+label+": "+rec.text);
  }
  return `<section class="panel overview"><p class="eyebrow">DE UN VISTAZO</p><h2>Tu semana</h2>
    <p><strong>${recent.sessions} entrenos · ${recent.sets} series efectivas</strong><br><small class="muted">Últimos 7 días · ${last?"Último: "+escapeHtml(last.dayName)+" ("+escapeHtml(Insights.sessionDate(last))+")":"Todavía no hay entrenamientos con efectivas."}</small></p>
    <p class="small"><strong>Agenda:</strong> ${upcoming.map(p=>fmtDay(p.date)+" · "+dayLabel(p.dayId)).join(" / ")||"Sin próximas fechas."}</p>
    <p class="small"><strong>Recuperación:</strong> ${Insights.caution(w,next.exercises.some(ex=>(ex.group||next.group)==="lower"))||(w?"Registro disponible; ajusta el esfuerzo a tus sensaciones.":"Sin registro de hoy.")}</p>
    <details><summary>Sugerencias para ${next.letter} · ${refs.length}</summary><p class="small">${refs.map(escapeHtml).join("<br>")||"Aún no hay una carga sugerida. Identifica el equipo en la sesión para consultar su referencia."}</p></details></section>${wellnessForm()}`;
}
const untouched = set => !set.completed && ["weight","reps","repsRight","actualRir"].every(k=>set[k]==null || set[k]==="");
function suggestionCard(ex,index,finished) {
  const s=progression(ex);
  const firstEmpty=ex.workingSets.find(untouched);
  const key=ex.id+"|"+Insights.variant(ex.variant);
  return `<div class="progress-note"><strong>Objetivo de hoy</strong><br>${escapeHtml(s.text)}
    ${s.summary?`<br><small>Última comparable (hace ${s.ago} días): ${escapeHtml(s.summary)}</small>`:""}
    ${!finished && firstEmpty && s.weight!=null?`<button class="button secondary full" data-action="accept-load" data-weight="${s.weight}" data-exercise="${index}">Usar ${fmtN(s.weight)} kg en la próxima serie vacía</button><small>Puedes editarla. No se asignan repeticiones ni se completa la serie.</small>`:""}
    ${ex.id.startsWith("3p1-") && Insights.identified(ex.variant)?`<details><summary>Incremento de este equipo</summary><label>Salto disponible (kg)<input type="number" step="0.05" min="0.05" max="50" data-step value="${escapeHtml(state.settings.variantSteps?.[key]??"")}" placeholder="Predeterminado"></label><button class="button secondary" data-action="save-step" data-exercise="${index}">Guardar incremento</button></details>`:""}</div>`;
}
function calendarDay(key,byDate,plans) {
  const sessions=byDate.get(key)||[], p=plans.get(key);
  const complete=sessions.some(s=>sessionResult(s)==="complete"), partial=sessions.some(s=>sessionResult(s)==="partial");
  const marks=[complete&&["ok","✓","Completa"],partial&&["partial","◐","Parcial"],p&&[p.dayId==="rest"?"rest":"plan",p.dayId==="rest"?"–":dayById(p.dayId).letter,dayLabel(p.dayId)]].filter(Boolean);
  return `<button class="cal-day ${key===uiPlan.date?"selected":""}" aria-pressed="${key===uiPlan.date}" aria-label="${key} · ${marks.map(m=>m[2]).join(", ")||"Sin registro"}" data-action="pick-date" data-date="${key}"><b>${Number(key.slice(-2))}</b><span>${marks.map(([cls,badge])=>`<i class="${cls}">${badge}</i>`).join("")}</span></button>`;
}
function forecastFor(date,except) {
  return Insights.forecast(cycleState().next.id,state.plans.filter(p=>p.id!==except),state.history,date,Insights.dateKey());
}
function agendaAdvice(p) {
  if (!dayById(p.dayId)) return "";
  const hits=Insights.conflicts(p,state.plans,state.history);
  const expected=forecastFor(p.date,p.id);
  return [!expected.includes(p.dayId)?"Esta fecha no sigue la secuencia prevista. El orden real solo avanza al finalizar un entrenamiento.":"",
    hits.length?"Posible solapamiento con "+hits.join("; ")+". Son fechas sin hora: orienta la separación hacia 48–72 h según tu recuperación.":""].filter(Boolean).map(s=>`<p class="pre-session-note recovery-note">${escapeHtml(s)}</p>`).join("");
}
function renderCalendar() {
  setHeader("AGENDA","PLAN FLEXIBLE");
  const key=uiPlan.date,today=Insights.dateKey(),monthly=uiPlan.view==="month";
  const first=monthly?key.slice(0,7)+"-01":Insights.monday(key);
  const start=Insights.monday(first);
  const size=monthly?Math.ceil(Insights.days(start,Insights.month(key,1))/7)*7:7;
  const byDate=new Map(), plans=new Map(state.plans.map(p=>[p.date,p]));
  for (const s of state.history) {
    if (!s.finishedAt) continue;
    const date=Insights.sessionDate(s); if (!date) continue;
    if (!byDate.has(date)) byDate.set(date,[]); byDate.get(date).push(s);
  }
  const entries=byDate.get(key)||[], p=plans.get(key), matched=p && Insights.planMatch(p,state.history);
  const modeled=forecastFor(key,p?.id), proposed=p || {id:"preview",date:key,dayId:modeled[0]};
  const editor=!matched && (p || key>=today && !entries.length);
  main.innerHTML=`<section class="panel"><p class="eyebrow">EUROPE/MADRID</p><div class="row"><h2>${monthly?fmtDay(key,{month:"long",year:"numeric"}):fmtDay(start)+" – "+fmtDay(Insights.plus(start,6),{day:"numeric",month:"short",year:"numeric"})}</h2>
    <select aria-label="Vista de agenda" data-feature="cal-view">${opt("month","Mes",uiPlan.view)+opt("week","Semana",uiPlan.view)}</select></div>
    <div class="period-nav"><button data-action="cal-prev" aria-label="Periodo anterior">←</button><button data-action="cal-today">Hoy</button><button data-action="cal-next" aria-label="Periodo siguiente">→</button></div>
    <div class="cal-grid">${["L","M","X","J","V","S","D"].map(d=>"<small>"+d+"</small>").join("")}${Array.from({length:size},(_,i)=>calendarDay(Insights.plus(start,i),byDate,plans)).join("")}</div>
    <p class="small muted">✓ Completa · ◐ Parcial · A/B/C/D Plan · – Descanso. Sin marca: sin registro.</p></section>
    <section class="panel"><p class="eyebrow">DÍA SELECCIONADO</p><h2>${fmtDay(key,{weekday:"long",day:"numeric",month:"long"})}</h2>
    ${entries.map(s=>`<p><strong>${escapeHtml(s.dayName)}</strong> · ${sessionResult(s)==="complete"?"Completa":"Parcial"}<br><small>${Insights.count(s)} series efectivas · ${escapeHtml(formatDate(s.startedAt))}</small></p>`).join("")||'<p class="muted small">Ninguna sesión registrada en esta fecha.</p>'}
    ${p?`<p><strong>Plan:</strong> ${dayLabel(p.dayId)}${matched?" · realizada":""}</p>`:""}
    ${editor?`<div class="feature-fields"><label>Plan de entrenamiento<select data-agenda-kind>${[...workoutProgram.days.map(d=>d.id),"rest"].map(id=>opt(id,dayLabel(id),proposed.dayId)).join("")}</select></label>
    <label>Fecha prevista<input type="date" min="${today}" value="${key}" data-agenda-date></label></div>
    <div data-agenda-advice>${agendaAdvice(proposed)}</div>
    <button class="button full" data-action="save-plan">${p?"Guardar cambios del plan":"Planificar"}</button>
    ${p?'<button class="button ghost full" data-action="remove-plan">Eliminar solo el plan</button>':""}`:""}
    </section><button class="button secondary full" data-action="export-ics">Exportar próximos entrenamientos (.ics)</button>`;
}

function plot(points,label,unit) {
  const valid=points.filter(p=>Number.isFinite(p.value));
  if (!valid.length) return '<p class="muted small">Aún no hay valores comparables para esta gráfica.</p>';
  const lo=valid.reduce((v,p)=>Math.min(v,p.value),Infinity), hi=valid.reduce((v,p)=>Math.max(v,p.value),-Infinity);
  const n=valid.length, first=valid[0].date, last=valid.at(-1).date, span=Insights.days(first,last);
  const x=p=>span?10+280*Insights.days(first,p.date)/span:150, y=p=>hi===lo?40:73-(p.value-lo)*62/(hi-lo);
  // Los puntos son observaciones. No se interpolan registros inexistentes.
  return `<figure class="trend"><figcaption>${escapeHtml(label)} · ${escapeHtml(unit)}</figcaption>
    <svg viewBox="0 0 300 84" role="img" aria-label="${escapeHtml(label)}: ${n} registros, de ${fmtN(lo)} a ${fmtN(hi)} ${escapeHtml(unit)}"><path d="M8 12H292 M8 42H292 M8 73H292" fill="none" stroke="var(--border)"/>
      ${valid.map(p=>`<circle cx="${x(p).toFixed(2)}" cy="${y(p).toFixed(2)}" r="3.5"><title>${p.date} · ${fmtN(p.value)} ${escapeHtml(unit)}</title></circle>`).join("")}</svg>
    <div class="row small muted"><span>${first}</span><span>${fmtN(lo)}–${fmtN(hi)} ${escapeHtml(unit)}</span><span>${last}</span></div></figure>`;
}
const metricNames={weight:"Carga máxima registrada",reps:"Reps a carga fija",volume:"Volumen comparable",estimate:"1RM estimada"};
const rowText=r=>fmtN(r.weight)+" kg × "+(r.right===null?r.reps:r.left+" izq. / "+r.right+" der.");
function renderEvolution() {
  setHeader("EVOLUCIÓN","TUS REGISTROS");
  const today=Insights.dateKey();
  const dates=[today,...state.history.filter(s=>s.finishedAt).map(Insights.sessionDate),...state.plans.map(p=>p.date)].filter(k=>k && k<=today);
  const from=uiStats.weeks==="all"?dates.reduce((a,b)=>a<b?a:b):Insights.plus(today,1-7*Number(uiStats.weeks));
  const length=1+Insights.days(from,today);
  const stats=Insights.aggregate(state.history,state.plans,from,today,today);
  const prev=uiStats.weeks!=="all" && Insights.aggregate(state.history,state.plans,Insights.plus(from,-length),Insights.plus(from,-1),today);
  const catalog=new Map(workoutProgram.days.flatMap(d=>d.exercises.map(ex=>[ex.id,ex.name])));
  for (const s of state.history) for (const ex of s.exercises) if (!catalog.has(ex.id)) catalog.set(ex.id,ex.name);
  if (!catalog.has(uiStats.id)) uiStats.id=catalog.keys().next().value;
  const variants=new Map();
  let unknown=0;
  for (const s of state.history) {
    for (const ex of s.exercises.filter(ex=>ex.id===uiStats.id)) for (const set of Insights.done(ex)) {
      const raw=set.variant??ex.variant;
      if (Insights.identified(raw)) variants.set(Insights.variant(raw),raw); else unknown++;
    }
  }
  if (!variants.has(uiStats.variant)) uiStats.variant=variants.keys().next().value||"";
  const all=Insights.exposures(state.history,uiStats.id,uiStats.variant).filter(p=>p.date<=today).sort((a,b)=>a.date.localeCompare(b.date)||a.at-b.at);
  const records=all.filter(p=>p.date>=from), best=Insights.best(records.flatMap(p=>p.rows)), lifetime=Insights.best(all.flatMap(p=>p.rows));
  const ref=records.length?Insights.best(records.at(-1).rows).weight:null;
  const repPR=all.reduce((top,p)=>p.rows.reduce((n,r)=>r.weight===ref?Math.max(n,r.reps):n,top),0);
  const metric=p=>{
    if (uiStats.metric==="weight") return Insights.best(p.rows).weight;
    if (uiStats.metric==="volume") return p.rows.reduce((n,r)=>n+r.volume,0);
    const values=uiStats.metric==="reps"?p.rows.filter(r=>r.weight===ref).map(r=>r.reps):p.rows.map(r=>r.estimate).filter(v=>v!==null);
    return values.length?Math.max(...values):null;
  };
  const unit={weight:"kg",volume:"kg·rep",reps:"reps",estimate:"kg estimados"}[uiStats.metric];
  const lastTwo=records.map(p=>({date:p.date,value:metric(p)})).filter(p=>p.value!==null);
  const change=lastTwo.length>1?lastTwo.at(-1).value-lastTwo.at(-2).value:null;
  const bucket=stats[uiStats.bucket], weekly=uiStats.bucket==="weeks";
  const points=[];
  for (let key=weekly?Insights.monday(from):from.slice(0,7)+"-01";key<=today;key=weekly?Insights.plus(key,7):Insights.month(key,1)) points.push({date:key,value:bucket.get(weekly?key:key.slice(0,7))||0});
  const minuteAvg=stats.minutes.length?fmtN(stats.minutes.reduce((a,b)=>a+b,0)/stats.minutes.length)+" min":"Sin duración válida";
  const latestWell=state.wellness.filter(w=>w.date>=from && w.date<=today).sort((a,b)=>b.date.localeCompare(a.date));
  const cap=uiStats.limit||12;
  main.innerHTML=`<section class="panel"><div class="row"><h2>Resumen</h2><label>Periodo<select data-feature="weeks">${["4","8","12","all"].map(v=>opt(v,v==="all"?"Todo el historial":v+" semanas",uiStats.weeks)).join("")}</select></label></div>
    <p class="small muted">${from} — ${today} · Madrid</p><div class="session-summary"><div class="stat"><strong>${stats.sessions}</strong><span>ENTRENOS</span></div><div class="stat"><strong>${stats.sets}</strong><span>EFECTIVAS</span></div><div class="stat"><strong>${fmtN(7*stats.sessions/length)}</strong><span>POR SEMANA</span></div></div>
    <p class="small">${stats.partial} parciales con trabajo · Duración media: ${minuteAvg}${stats.minutes.length?" (n="+stats.minutes.length+")":""}.</p>
    ${prev?`<p class="small muted">Periodo anterior de igual duración: ${prev.sessions} entrenos y ${prev.sets} efectivas registradas.</p>`:""}
    <p class="small">${stats.due?`Plan cumplido: ${stats.met}/${stats.due} (${fmtN(100*stats.met/stats.due)} %). Parciales: ${stats.planPartial}.`:"Sin planes vencidos evaluables."}</p>
    <label>Agrupar entrenamientos<select data-feature="bucket">${opt("weeks","Por semana",uiStats.bucket)+opt("months","Por mes",uiStats.bucket)}</select></label>
    ${plot(points,"Entrenos registrados "+(weekly?"por semana":"por mes"),"sesiones")}
    <details><summary>Ver recuentos y grupos musculares</summary><p class="small">${points.map(p=>fmtDay(p.date,{day:"numeric",month:"short",year:"numeric"})+": "+p.value).join(" · ")}</p>
    ${[...stats.muscles].sort((a,b)=>b[1]-a[1]).map(([m,n])=>`<div class="row small"><span>${escapeHtml(m)}</span><strong>${n} series</strong></div>`).join("")||"Sin series registradas."}
    <p class="small muted">Una efectiva cuenta una vez, en su grupo principal. Sentadilla y búlgaras: cuádriceps; peso muerto y curl femoral: cadena posterior. Sin atribución segura: sin clasificar.</p></details></section>
    <section class="panel"><p class="eyebrow">MISMA VARIANTE · MISMO EQUIPO</p><h2>Por ejercicio</h2><div class="feature-fields">
    <label>Ejercicio<select data-feature="exercise">${[...catalog].map(([id,name])=>opt(id,name+(id.startsWith("3p1-")?"":" · rutina anterior"),uiStats.id)).join("")}</select></label>
    <label>Variante exacta<select data-feature="variant">${variants.size?[...variants].map(([id,v])=>opt(id,v,uiStats.variant)).join(""):opt("","Sin variante identificada","")}</select></label></div>
    <p class="small muted">${unknown?unknown+" efectivas sin equipo identificable en el historial; se excluyen de las comparaciones.":"Solo se comparan efectivas con peso y repeticiones válidos."}</p>
    <label>Medida<select data-feature="metric">${Object.entries(metricNames).map(([id,name])=>opt(id,name,uiStats.metric)).join("")}</select></label>
    ${plot(records.map(p=>({date:p.date,value:metric(p)})),metricNames[uiStats.metric]+(uiStats.metric==="reps"&&ref!==null?" · "+fmtN(ref)+" kg":""),unit)}
    ${change===null?"":`<p class="small">Cambio entre los dos últimos valores comparables: ${change>0?"+":""}${fmtN(change)} ${unit}.</p>`}
    ${best?"<p>Mejor serie del periodo: <strong>"+rowText(best)+"</strong></p>":"<p>No hay series comparables en este periodo.</p>"}
    ${lifetime?"<p class='small'>Récord de carga (desempate por reps): "+rowText(lifetime)+" · todo el historial.</p>":""}
    ${repPR?"<p class='small'>Récord a "+fmtN(ref)+" kg: "+repPR+" reps · todo el historial.</p>":""}
    <p class="small muted">Volumen: kg anotados × reps realizadas; en búlgaras se suman ambos lados y se usa la pierna de menos reps para comparar rendimiento. 1RM: estimación Epley solo en básicos con barra libre, 2–10 reps y RIR registrado 0–2.</p>
    ${records.length?`<details><summary>Series por sesión (${records.length})</summary>${records.slice(-cap).reverse().map(p=>`<p class="small"><strong>${p.date}</strong> · ${p.rows.map(rowText).join(" · ")}<br>${fmtN(p.rows.reduce((n,r)=>n+r.volume,0))} kg·rep registrados</p>`).join("")}${cap<records.length?'<button class="button secondary" data-action="more-series">Ver más series</button>':""}</details>`:""}</section>
    <details class="panel compact"><summary>Registros de recuperación <small>${latestWell.length} en el periodo</small></summary>${latestWell.map(w=>`<p class="small"><strong>${w.date}</strong> · ${Object.keys(wellLabels).filter(k=>w[k]).map(k=>wellLabels[k]+": "+escapeHtml(w[k])).join(" · ")} ${escapeHtml(w.note||"")}</p>`).join("")||"Sin registros."}</details>`;
}

function featureClick(button) {
  const action=button.dataset.action, today=Insights.dateKey(), current=state.plans.find(p=>p.date===uiPlan.date);
  if (action==="well-save") {
    if (button.dataset.date!==today) { render(); notify("Ha cambiado la fecha. Revisa el registro de hoy."); return true; }
    const w={date:today}, form=button.closest("details");
    for (const el of form.querySelectorAll("[data-well]")) if (el.value.trim()) w[el.dataset.well]=el.value.trim();
    const wellness=state.wellness.filter(item=>item.date!==today);
    if (Object.keys(w).length>1) wellness.push(w);
    if (replaceFeatureState({...state,wellness})) {render();notify("Recuperación guardada");}
  } else if (action==="accept-load" || action==="save-step") {
    const index=Number(button.dataset.exercise), active=state.activeSession;
    if (!active || active.pausedAt) return true;
    const ex=active.exercises[index]; if (!ex || !Insights.identified(ex.variant)) return true;
    if (action==="save-step") {
      const input=button.closest("details").querySelector("[data-step]");
      if (!input.reportValidity()) return true;
      const variantSteps={...state.settings.variantSteps}, key=ex.id+"|"+Insights.variant(ex.variant);
      if (input.value) variantSteps[key]=Number(input.value); else delete variantSteps[key];
      if (!replaceFeatureState({...state,settings:{...state.settings,variantSteps}})) return true;
    } else {
      const suggested=progression(ex), i=ex.workingSets.findIndex(untouched);
      if (suggested.weight==null || suggested.weight!==Number(button.dataset.weight) || i<0 || ex.status==="skipped") {renderSession();return true;}
      const next=structuredClone(active);
      Object.assign(next.exercises[index].workingSets[i],{weight:String(suggested.weight),variant:ex.variant});
      if (!replaceFeatureState({...state,activeSession:next})) return true;
    }
    renderSession();
    const card=main.querySelector('.exercise-card[data-exercise="'+index+'"]'); if (card) card.open=true;
    notify(action==="save-step"?"Incremento guardado":"Carga propuesta copiada; la serie sigue pendiente");
  } else if (["pick-date","cal-prev","cal-next","cal-today"].includes(action)) {
    const dir=action==="cal-prev"?-1:1;
    uiPlan.date=action==="pick-date"?button.dataset.date:action==="cal-today"?today:uiPlan.view==="week"?Insights.plus(uiPlan.date,dir*7):Insights.month(uiPlan.date,dir);
    renderCalendar();
  } else if (action==="save-plan") {
    const input=main.querySelector("[data-agenda-date]"), date=input.value, dayId=main.querySelector("[data-agenda-kind]").value;
    if (!input.reportValidity() || !Insights.validDay(date) || date<today) return true;
    if ((current && Insights.planMatch(current,state.history)) || state.history.some(s=>s.finishedAt && Insights.sessionDate(s)===date) || state.plans.some(p=>p.id!==current?.id && p.date===date)) {notify("Ya existe un plan o entrenamiento en esa fecha.");return true;}
    const p={id:current?.id||uid(),date,dayId};
    if (replaceFeatureState({...state,plans:[...state.plans.filter(item=>item.id!==p.id),p]})) {uiPlan.date=date;renderCalendar();notify("Plan guardado; el ciclo no cambia");}
  } else if (action==="remove-plan") {
    if (!current || Insights.planMatch(current,state.history)) return true;
    showModal("¿Eliminar solo el plan?","No se eliminará ningún entrenamiento realizado.",[{label:"VOLVER"},{label:"ELIMINAR PLAN",action:()=>{
      if (replaceFeatureState({...state,plans:state.plans.filter(p=>p.id!==current.id)})) renderCalendar();
    }}]);
  } else if (action==="export-ics") {
    const plans=state.plans.filter(p=>p.dayId!=="rest" && p.date>=today && !Insights.planMatch(p,state.history));
    if (!plans.length) {notify("No hay entrenamientos futuros planificados");return true;}
    const url=URL.createObjectURL(new Blob([Insights.ics(plans)],{type:"text/calendar;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download="entreno-agenda-"+today+".ics";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  } else if (action==="more-series") {
    uiStats.limit=(uiStats.limit||12)+24; renderEvolution();
    const section=main.querySelectorAll("section.panel")[1]?.querySelector("details"); if (section) section.open=true;
  } else return false;
  return true;
}
function featureChange(el) {
  if (el.matches("[data-agenda-kind], [data-agenda-date]")) {
    const date=main.querySelector("[data-agenda-date]").value;
    if (Insights.validDay(date)) main.querySelector("[data-agenda-advice]").innerHTML=agendaAdvice({id:state.plans.find(p=>p.date===uiPlan.date)?.id||"preview",date,dayId:main.querySelector("[data-agenda-kind]").value});
    return true;
  }
  const k=el.dataset.feature; if (!k) return false;
  if (k==="cal-view") {uiPlan.view=el.value;renderCalendar();}
  else {
    if (k==="exercise") {uiStats.id=el.value;uiStats.variant="";}
    else if (["weeks","metric","variant","bucket"].includes(k)) uiStats[k]=el.value;
    uiStats.limit=12;renderEvolution();
  }
  return true;
}
