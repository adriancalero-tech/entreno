"use strict";

// Fuente única de verdad de la rutina. La lógica no contiene ejercicios hardcodeados.
const workoutProgram = {
  days: [
    { id: "push", number: 1, name: "PUSH", group: "upper", subtitle: "Pecho · hombro · tríceps", exercises: [
      ["press-inclinado", "Press inclinado en multipower o barra", 3, 6, 10, ["2", "1", "1"], 180],
      ["press-plano-mancuernas", "Press plano con mancuernas o máquina", 2, 8, 12, ["2", "1"], 150],
      ["press-hombro", "Press de hombro con mancuernas o máquina", 2, 8, 12, ["2", "1"], 150],
      ["aperturas-polea", "Aperturas en polea", 2, 10, 15, ["1", "0-1"], 90],
      ["elevaciones-laterales-polea", "Elevaciones laterales en polea o mancuerna", 3, 12, 20, ["2", "1", "0-1"], 90],
      ["extension-triceps-cabeza", "Extensión de tríceps sobre la cabeza", 2, 10, 15, ["1", "0-1"], 90],
      ["jalon-triceps", "Jalón de tríceps", 2, 10, 15, ["1", "0-1"], 90]
    ]},
    { id: "pull", number: 2, name: "PULL", group: "upper", subtitle: "Espalda · bíceps", exercises: [
      ["dominadas-jalon", "Dominadas o jalón al pecho", 3, 6, 10, ["2", "1", "1"], 180],
      ["remo-pecho", "Remo con pecho apoyado o T-Bar", 3, 8, 12, ["2", "1", "1"], 150],
      ["jalon-unilateral", "Jalón unilateral", 2, 10, 15, ["1-2", "1"], 120],
      ["pajaros", "Pájaros o reverse pec deck", 3, 12, 20, ["2", "1", "0-1"], 90],
      ["curl-predicador", "Curl predicador", 2, 8, 12, ["1", "0-1"], 120],
      ["curl-inclinado", "Curl inclinado con mancuernas", 2, 10, 15, ["1", "0-1"], 90]
    ]},
    { id: "pierna-a", number: 3, name: "PIERNA A", group: "lower", subtitle: "CUÁDRICEPS", exercises: [
      ["hack-squat", "Hack squat o sentadilla", 3, 6, 10, ["2", "1", "1"], 180],
      ["prensa", "Prensa", 3, 10, 15, ["2", "1", "1"], 180],
      ["extension-cuadriceps", "Extensión de cuádriceps", 2, 12, 15, ["1", "0-1"], 120],
      ["curl-femoral-a", "Curl femoral", 3, 8, 12, ["2", "1", "0-1"], 120],
      ["gemelo-a", "Gemelo", 3, 8, 15, ["2", "1", "0-1"], 120],
      ["abdominal", "Abdominal", 3, 10, 20, ["1-2", "1-2", "1-2"], 90]
    ]},
    { id: "upper", number: 4, name: "UPPER", group: "upper", subtitle: "TORSO COMPLETO", exercises: [
      ["press-plano-barra", "Press plano con barra o máquina", 3, 6, 10, ["2", "1", "1"], 180],
      ["jalon-neutro", "Jalón neutro o al pecho", 3, 8, 12, ["2", "1", "1"], 150],
      ["press-inclinado-mancuernas", "Press inclinado con mancuernas", 2, 8, 12, ["1-2", "1"], 150],
      ["remo-unilateral", "Remo unilateral o máquina", 2, 10, 15, ["1-2", "1"], 120],
      ["elevaciones-laterales", "Elevaciones laterales", 3, 12, 20, ["2", "1", "0-1"], 90],
      ["curl-cable", "Curl de bíceps en cable o mancuerna", 2, 10, 15, ["1", "0-1"], 90],
      ["extension-triceps-polea", "Extensión de tríceps en polea", 2, 10, 15, ["1", "0-1"], 90]
    ]},
    { id: "pierna-b", number: 5, name: "PIERNA B", group: "lower", subtitle: "FEMORAL · GLÚTEO", exercises: [
      ["peso-muerto-rumano", "Peso muerto rumano", 3, 6, 10, ["2", "1", "1"], 180],
      ["curl-femoral-b", "Curl femoral", 3, 8, 12, ["2", "1", "0-1"], 120],
      ["sentadilla-bulgara", "Sentadilla búlgara", 3, 8, 12, ["2", "1", "1"], 180, "Repeticiones por pierna"],
      ["prensa-pies-altos", "Prensa con pies medios/altos", 2, 10, 15, ["2", "1"], 150],
      ["gemelo-b", "Gemelo", 3, 10, 15, ["2", "1", "0-1"], 120],
      ["aductor", "Aductor en máquina", 2, 10, 15, ["1", "0-1"], 90]
    ]}
  ]
};

workoutProgram.days.forEach(day => {
  day.exercises = day.exercises.map(([id, name, setCount, minReps, maxReps, rir, restSeconds, note = ""]) =>
    ({ id, name, setCount, minReps, maxReps, rir, restSeconds, note }));
});

const SCHEMA_VERSION = 1;
const STORAGE_KEY = "entreno.data";
const defaults = () => ({
  schemaVersion: SCHEMA_VERSION,
  settings: { sound: false, vibration: true, upperIncrement: 2.5, lowerIncrement: 5 },
  activeSession: null,
  history: []
});

const storage = {
  validate(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("El archivo no contiene un objeto válido.");
    if (data.schemaVersion !== SCHEMA_VERSION) throw new Error(`Versión de datos incompatible (${data.schemaVersion ?? "desconocida"}).`);
    if (!data.settings || typeof data.settings !== "object" || !Array.isArray(data.history)) throw new Error("Faltan secciones obligatorias.");
    const clean = defaults();
    clean.settings = {
      sound: Boolean(data.settings.sound), vibration: data.settings.vibration !== false,
      upperIncrement: validPositive(data.settings.upperIncrement, 2.5),
      lowerIncrement: validPositive(data.settings.lowerIncrement, 5)
    };
    clean.history = data.history.filter(isValidSession).slice(0, 1000);
    clean.activeSession = isValidSession(data.activeSession) && !data.activeSession.finishedAt ? data.activeSession : null;
    return clean;
  },
  load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    try { return this.migrate(JSON.parse(raw)); }
    catch (error) { console.error("No se pudieron cargar los datos guardados:", error); notify("Datos locales dañados: se ha iniciado una copia segura"); return defaults(); }
  },
  save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
    catch (error) { console.error("No se pudieron guardar los datos:", error); notify("No se han podido guardar los cambios"); return false; }
  },
  migrate(data) { return this.validate(data); },
  export(data) { return JSON.stringify(data, null, 2); },
  import(text) { return this.validate(JSON.parse(text)); },
  clear() { localStorage.removeItem(STORAGE_KEY); }
};

function validPositive(value, fallback) { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : fallback; }
function isValidSession(s) { return Boolean(s && typeof s === "object" && typeof s.id === "string" && typeof s.dayId === "string" && Array.isArray(s.exercises)); }
function uid() { return `${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }
function formatTime(seconds) { const s = Math.max(0, Math.ceil(seconds)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function formatDate(iso) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)); }
function durationText(ms) { const mins = Math.max(1, Math.round(ms / 60000)); return mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`; }

let state = storage.load();
let route = state.activeSession ? "session" : "home";
let selectedDayId = null;
let timerInterval = null;
let toastTimeout = null;
const main = document.querySelector("#main-content");
const timerDock = document.querySelector("#timer-dock");

function persist() { storage.save(state); }
function notify(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;
  toast.textContent = message; toast.classList.add("show");
  clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}
function dayById(id) { return workoutProgram.days.find(day => day.id === id); }
function activeDay() { return state.activeSession ? dayById(state.activeSession.dayId) : null; }
function sessionComplete(s = state.activeSession) { return Boolean(s && s.exercises.every(e => e.sets.every(set => set.completed))); }
function completedSetCount(s) { return s.exercises.reduce((n, e) => n + e.sets.filter(x => x.completed).length, 0); }
function totalSetCount(s) { return s.exercises.reduce((n, e) => n + e.sets.length, 0); }

function createSession(day) {
  return {
    id: uid(), dayId: day.id, dayName: `${day.name}${day.subtitle ? ` · ${day.subtitle}` : ""}`,
    group: day.group, startedAt: new Date().toISOString(), finishedAt: null, currentExercise: 0,
    exercises: day.exercises.map(ex => ({ id: ex.id, name: ex.name, minReps: ex.minReps, maxReps: ex.maxReps, restSeconds: ex.restSeconds, note: ex.note,
      sets: Array.from({ length: ex.setCount }, (_, i) => ({ number: i + 1, weight: "", reps: "", targetRir: ex.rir[i], actualRir: "", completed: false, completedAt: null })) })),
    timer: { status: "idle", durationMs: 0, remainingMs: 0, endTimestamp: null, exerciseIndex: null }
  };
}

function latestExercise(exerciseId) {
  for (const session of state.history) { const ex = session.exercises.find(item => item.id === exerciseId); if (ex) return ex; }
  return null;
}
function progression(ex, group) {
  const last = latestExercise(ex.id);
  if (!last || !last.sets.length || !last.sets.every(s => s.completed && Number(s.reps) >= ex.maxReps)) return "";
  const withRir = last.sets.filter(s => s.actualRir !== "");
  let confident = withRir.length === last.sets.length;
  if (confident) confident = last.sets.every(s => Number.parseInt(s.actualRir, 10) >= Number.parseInt(s.targetRir, 10) - 1);
  const increment = group === "lower" ? state.settings.lowerIncrement : state.settings.upperIncrement;
  return confident ? `↑ Posible subida de ${increment} kg` : `↑ Posible subida de ${increment} kg si respetaste el RIR objetivo`;
}

function setHeader(title, kicker, back = false) {
  document.querySelector("#page-title").textContent = title;
  document.querySelector("#header-kicker").textContent = kicker;
  document.querySelector("#back-button").classList.toggle("hidden", !back);
  document.querySelectorAll(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.route === route));
}

function render() {
  if (route !== "session") stopTimerUiOnly();
  if (route === "home") renderHome();
  else if (route === "day") renderDay();
  else if (route === "session") renderSession();
  else if (route === "history") renderHistory();
  else if (route === "settings") renderSettings();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function renderHome() {
  setHeader("ENTRENO", "TU RUTINA");
  main.innerHTML = `<section class="hero"><h2>Haz que cada serie cuente.</h2><p class="muted">Elige el entrenamiento de hoy y supera tu última sesión.</p></section>
    <section class="day-grid" aria-label="Días de entrenamiento">${workoutProgram.days.map(day => {
      const active = state.activeSession?.dayId === day.id;
      return `<button class="day-card ${active ? "active-session" : ""}" data-action="open-day" data-day="${day.id}" type="button">
        <span class="day-card-top"><span class="day-number">DÍA ${day.number}</span><span class="badge ${active ? "accent" : ""}">${active ? "SESIÓN ACTIVA" : `${day.exercises.length} EJERCICIOS`}</span></span>
        <strong>${day.name}</strong><span class="muted small">${day.subtitle}</span></button>`;
    }).join("")}</section>`;
}

function renderDay() {
  const day = dayById(selectedDayId);
  if (!day) { route = "home"; return render(); }
  setHeader(day.name, `DÍA ${day.number}`, true);
  const activeOther = state.activeSession && state.activeSession.dayId !== day.id;
  main.innerHTML = `<section class="panel"><p class="eyebrow">${day.subtitle}</p><h2>${day.name}</h2><p class="muted">${day.exercises.length} ejercicios · ${day.exercises.reduce((n,e)=>n+e.setCount,0)} series</p>
    <button class="button full" data-action="${state.activeSession?.dayId === day.id ? "resume-session" : "start-session"}" ${activeOther ? "disabled" : ""}>${state.activeSession?.dayId === day.id ? "REANUDAR ENTRENAMIENTO" : "COMENZAR ENTRENAMIENTO"}</button>
    ${activeOther ? `<p class="small muted">Finaliza primero tu sesión activa de ${escapeHtml(activeDay().name)}.</p>` : ""}</section>
    <section class="exercise-list">${day.exercises.map((ex,i)=>`<article class="panel"><span class="day-number">${String(i+1).padStart(2,"0")}</span><h3>${ex.name}</h3><p class="muted small">${ex.setCount} × ${ex.minReps}-${ex.maxReps}${ex.note ? ` · ${ex.note}` : ""}<br>RIR ${ex.rir.join(" / ")} · Descanso ${formatTime(ex.restSeconds)}</p></article>`).join("")}</section>`;
}

function renderSession() {
  const s = state.activeSession;
  if (!s) { route = "home"; return render(); }
  const day = activeDay();
  setHeader(day.name, "SESIÓN ACTIVA", false);
  const done = completedSetCount(s), total = totalSetCount(s);
  main.innerHTML = `<section class="session-summary"><div class="stat"><strong>${done}/${total}</strong><span>SERIES</span></div><div class="stat"><strong>${s.exercises.filter(e=>e.sets.every(x=>x.completed)).length}/${s.exercises.length}</strong><span>EJERCICIOS</span></div><div class="stat"><strong>${durationText(Date.now()-new Date(s.startedAt))}</strong><span>TIEMPO</span></div></section>
    <section class="exercise-list">${s.exercises.map((ex, exIndex) => renderExercise(ex, exIndex, day)).join("")}</section>
    <section class="panel"><h2>${sessionComplete(s) ? "ENTRENAMIENTO COMPLETADO" : "Finalizar sesión"}</h2><p class="muted">${sessionComplete(s) ? "Has completado todas las series. Buen trabajo." : "Puedes finalizar ahora; las series pendientes quedarán registradas como no completadas."}</p><button class="button full" data-action="finish-session">FINALIZAR ENTRENAMIENTO</button></section>`;
  renderTimer();
}

function renderExercise(ex, exIndex, day) {
  const done = ex.sets.every(x => x.completed), current = exIndex === state.activeSession.currentExercise && !done;
  const latest = latestExercise(ex.id);
  const lastText = latest ? latest.sets.filter(s=>s.completed).map(s=>`${s.weight || "—"} kg × ${s.reps || "—"}${s.actualRir !== "" ? ` (RIR ${s.actualRir})` : ""}`).join(" · ") : "Sin registros anteriores";
  const programEx = day.exercises.find(e=>e.id===ex.id);
  const recommendation = progression(programEx, day.group);
  return `<details class="exercise-card ${done ? "done" : ""} ${current ? "current" : ""}" data-exercise="${exIndex}" ${current ? "open" : ""}>
    <summary class="exercise-summary"><div><span class="badge ${done ? "accent" : ""}">${done ? "COMPLETADO" : current ? "EN CURSO" : "PENDIENTE"}</span><h3>${escapeHtml(ex.name)}</h3><div class="exercise-meta"><span>${ex.sets.length} × ${ex.minReps}-${ex.maxReps}${ex.note ? " por pierna" : ""}</span><span>RIR ${ex.sets.map(s=>s.targetRir).join(" / ")}</span><span>Descanso ${formatTime(ex.restSeconds)}</span></div></div></summary>
    <p class="last-session"><strong>Última vez:</strong> ${escapeHtml(lastText)}</p>${recommendation ? `<p class="progress-note">${escapeHtml(recommendation)}</p>` : ""}
    <div class="sets">${ex.sets.map((set,setIndex)=>renderSet(set,exIndex,setIndex)).join("")}${done && exIndex < state.activeSession.exercises.length-1 ? `<button class="button secondary full" data-action="continue" data-exercise="${exIndex+1}">CONTINUAR AL SIGUIENTE</button>` : ""}</div></details>`;
}

function renderSet(set, exIndex, setIndex) {
  return `<article class="set-card ${set.completed ? "done" : ""}"><div class="set-top"><span class="set-title">SERIE ${set.number}${set.completed ? " · ✓" : ""}</span><span class="target-rir">RIR OBJ. ${set.targetRir}</span></div>
    <div class="set-inputs"><label class="input-suffix">Peso<input data-field="weight" data-exercise="${exIndex}" data-set="${setIndex}" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(set.weight)}" ${set.completed ? "disabled" : ""}><span>kg</span></label>
    <label>Repeticiones<input data-field="reps" data-exercise="${exIndex}" data-set="${setIndex}" type="number" inputmode="numeric" min="0" step="1" value="${escapeHtml(set.reps)}" ${set.completed ? "disabled" : ""}></label></div>
    <label>RIR realizado <span class="muted">(opcional)</span></label><div class="rir-picker" role="group" aria-label="RIR realizado">${["0","1","2","3","4+"].map(v=>`<button type="button" data-action="set-rir" data-exercise="${exIndex}" data-set="${setIndex}" data-value="${v}" class="${set.actualRir===v ? "selected" : ""}" ${set.completed ? "disabled" : ""}>${v}</button>`).join("")}</div>
    <button type="button" class="button full ${set.completed ? "secondary" : ""}" data-action="toggle-set" data-exercise="${exIndex}" data-set="${setIndex}">${set.completed ? "DESMARCAR SERIE" : "✓ COMPLETAR SERIE"}</button></article>`;
}

function renderHistory() {
  setHeader("HISTORIAL", "TUS SESIONES");
  timerDock.classList.add("hidden");
  main.innerHTML = state.history.length ? state.history.map(s => `<details class="panel history-item"><summary><div class="row"><div><h3>${escapeHtml(s.dayName)}</h3><span class="muted small">${formatDate(s.finishedAt || s.startedAt)}</span></div><span class="badge">${durationText(new Date(s.finishedAt)-new Date(s.startedAt))}</span></div></summary>
    ${s.exercises.map(ex=>`<div class="history-exercise"><strong>${escapeHtml(ex.name)}</strong>${ex.sets.map(set=>`<div class="history-set">${set.completed ? `${escapeHtml(set.weight || "—")} kg × ${escapeHtml(set.reps || "—")} · RIR obj. ${escapeHtml(set.targetRir)}${set.actualRir !== "" ? ` · real ${escapeHtml(set.actualRir)}` : ""}` : "Serie no completada"}</div>`).join("")}</div>`).join("")}</details>`).join("") : `<div class="empty"><h2>Aún no hay sesiones</h2><p>Finaliza tu primer entrenamiento y aparecerá aquí.</p></div>`;
}

function renderSettings() {
  setHeader("AJUSTES", "PREFERENCIAS"); timerDock.classList.add("hidden");
  main.innerHTML = `<section class="panel"><label class="toggle"><span><strong>Sonido</strong><small class="muted"> Aviso corto al acabar el descanso</small></span><input type="checkbox" data-setting="sound" ${state.settings.sound ? "checked" : ""}></label>
    <label class="toggle"><span><strong>Vibración</strong><small class="muted"> Si el dispositivo lo permite</small></span><input type="checkbox" data-setting="vibration" ${state.settings.vibration ? "checked" : ""}></label></section>
    <section class="panel"><h2>Doble progresión</h2><div class="set-inputs"><label class="input-suffix">Incremento tren superior<input type="number" inputmode="decimal" min="0.1" step="0.5" data-setting="upperIncrement" value="${state.settings.upperIncrement}"><span>kg</span></label><label class="input-suffix">Incremento tren inferior<input type="number" inputmode="decimal" min="0.1" step="0.5" data-setting="lowerIncrement" value="${state.settings.lowerIncrement}"><span>kg</span></label></div></section>
    <section class="panel settings-actions"><h2>Tus datos</h2><button class="button secondary" data-action="export">EXPORTAR DATOS</button><button class="button secondary" data-action="import">IMPORTAR DATOS</button><button class="button danger" data-action="clear-data">BORRAR TODOS LOS DATOS</button><p class="small muted">Los datos nunca salen de este navegador salvo cuando tú exportas una copia.</p></section>`;
}

function beginSession() {
  const day = dayById(selectedDayId); if (!day || state.activeSession) return;
  state.activeSession = createSession(day); persist(); route = "session"; render();
}

function updateInput(input) {
  const s = state.activeSession; if (!s) return;
  const set = s.exercises[Number(input.dataset.exercise)]?.sets[Number(input.dataset.set)]; if (!set || set.completed) return;
  let value = input.value.trim();
  if (value !== "") { const n = Number(value); if (!Number.isFinite(n) || n < 0) value = ""; else if (input.dataset.field === "reps") value = String(Math.floor(n)); }
  set[input.dataset.field] = value; persist();
}

function toggleSet(exIndex, setIndex) {
  const s = state.activeSession, ex = s?.exercises[exIndex], set = ex?.sets[setIndex]; if (!set) return;
  if (!set.completed && (set.weight === "" || set.reps === "" || Number(set.weight) < 0 || !Number.isInteger(Number(set.reps)))) { notify("Introduce un peso y repeticiones válidos"); return; }
  set.completed = !set.completed; set.completedAt = set.completed ? new Date().toISOString() : null;
  if (set.completed) {
    const exerciseDone = ex.sets.every(x=>x.completed);
    if (exerciseDone) { stopTimer(true); const next = s.exercises.findIndex((e,i)=>i>exIndex && !e.sets.every(x=>x.completed)); s.currentExercise = next < 0 ? exIndex : next; }
    else startTimer(ex.restSeconds, exIndex);
  } else { s.currentExercise = exIndex; }
  persist(); renderSession();
}

function startTimer(seconds, exerciseIndex) {
  const timer = state.activeSession.timer;
  timer.status = "running"; timer.durationMs = seconds * 1000; timer.remainingMs = timer.durationMs; timer.endTimestamp = Date.now() + timer.remainingMs; timer.exerciseIndex = exerciseIndex; persist();
}
function timerRemaining(timer) { return timer.status === "running" && timer.endTimestamp ? Math.max(0, timer.endTimestamp - Date.now()) : Math.max(0, timer.remainingMs || 0); }
function adjustTimer(deltaMs) {
  const t = state.activeSession?.timer; if (!t || t.status === "idle") return;
  const remaining = Math.max(0, timerRemaining(t) + deltaMs); t.remainingMs = remaining; if (t.status === "running") t.endTimestamp = Date.now() + remaining; persist(); tickTimer();
}
function pauseTimer() { const t=state.activeSession?.timer; if (!t||t.status!=="running") return; t.remainingMs=timerRemaining(t);t.endTimestamp=null;t.status="paused";persist();renderTimer(); }
function resumeTimer() { const t=state.activeSession?.timer; if (!t||t.status!=="paused") return;t.status="running";t.endTimestamp=Date.now()+t.remainingMs;persist();renderTimer(); }
function resetTimer() { const t=state.activeSession?.timer;if(!t||t.status==="idle")return;t.remainingMs=t.durationMs;t.status="running";t.endTimestamp=Date.now()+t.durationMs;persist();renderTimer(); }
function stopTimer(persistChange=false) { clearInterval(timerInterval);timerInterval=null;const t=state.activeSession?.timer;if(t){t.status="idle";t.remainingMs=0;t.endTimestamp=null;t.exerciseIndex=null;if(persistChange)persist();}timerDock.classList.add("hidden"); }
function stopTimerUiOnly() { clearInterval(timerInterval); timerInterval=null; }
function renderTimer() {
  clearInterval(timerInterval); timerInterval=null; const t=state.activeSession?.timer;
  if (!t || t.status === "idle") { timerDock.classList.add("hidden"); return; }
  timerDock.classList.remove("hidden"); tickTimer();
  if (t.status === "running") timerInterval=setInterval(tickTimer,250);
}
function tickTimer() {
  const t=state.activeSession?.timer;if(!t||t.status==="idle")return;
  const remaining=timerRemaining(t), seconds=Math.ceil(remaining/1000), finished=remaining<=0;
  timerDock.classList.toggle("finished",finished);
  timerDock.innerHTML=`<div class="timer-main"><div><span class="eyebrow">${finished ? "DESCANSO TERMINADO" : t.status==="paused" ? "EN PAUSA" : "DESCANSO"}</span><div class="timer-time">${formatTime(seconds)}</div></div><button class="button" data-action="${t.status==="paused" ? "timer-resume" : "timer-pause"}" ${finished ? "disabled" : ""}>${t.status==="paused" ? "REANUDAR" : "PAUSAR"}</button></div><div class="timer-controls"><button data-action="timer-minus">−30 s</button><button data-action="timer-plus">+30 s</button><button data-action="timer-reset">REINICIAR</button><button data-action="timer-skip">OMITIR</button></div>`;
  if(finished&&t.status==="running"){t.status="finished";t.remainingMs=0;t.endTimestamp=null;clearInterval(timerInterval);timerInterval=null;persist();signalTimerEnd();}
}
function signalTimerEnd(){if(state.settings.vibration&&navigator.vibrate)navigator.vibrate([180,80,180]);if(state.settings.sound)playBeep();}
function playBeep(){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=880;gain.gain.setValueAtTime(.12,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.18);osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.18);osc.onended=()=>ctx.close();}catch(error){console.warn("El navegador bloqueó el aviso sonoro:",error);}}

function finishSession() {
  const s=state.activeSession;if(!s)return;
  const execute=()=>{if(!state.activeSession||state.history.some(x=>x.id===s.id))return;s.finishedAt=new Date().toISOString();state.history.unshift(structuredClone(s));state.activeSession=null;stopTimerUiOnly();persist();route="history";render();notify("Entrenamiento guardado");};
  if(!sessionComplete(s)) showModal("¿Finalizar antes de tiempo?","Quedan series pendientes. Se guardará lo completado hasta ahora.",[{label:"CANCELAR"},{label:"FINALIZAR",className:"danger",action:execute}]); else execute();
}

function showModal(title, body, actions) {
  const dialog=document.querySelector("#modal");document.querySelector("#modal-title").textContent=title;document.querySelector("#modal-body").innerHTML=`<p class="muted">${escapeHtml(body)}</p>`;
  const area=document.querySelector("#modal-actions");area.replaceChildren();actions.forEach(a=>{const b=document.createElement("button");b.type="button";b.className=`button ${a.className||"secondary"}`;b.textContent=a.label;b.addEventListener("click",()=>{dialog.close();a.action?.();},{once:true});area.append(b);});dialog.showModal();
}

function exportData() { const blob=new Blob([storage.export(state)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`entreno-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
async function importData(file) { try{const imported=storage.import(await file.text());showModal("Importar datos","Esto reemplazará la sesión, historial y ajustes actuales.",[{label:"CANCELAR"},{label:"IMPORTAR",action:()=>{state=imported;persist();route=state.activeSession?"session":"settings";render();notify("Datos importados correctamente");}}]);}catch(error){console.error("Importación rechazada:",error);notify(`Archivo no válido: ${error.message}`);} }

document.addEventListener("click", event => {
  const button=event.target.closest("button");if(!button)return;const {action}=button.dataset;
  if(button.dataset.route){route=button.dataset.route;selectedDayId=null;render();return;}
  if(action==="open-day"){selectedDayId=button.dataset.day;route="day";render();}
  else if(action==="start-session")beginSession(); else if(action==="resume-session"){route="session";render();}
  else if(action==="set-rir"){const set=state.activeSession?.exercises[+button.dataset.exercise]?.sets[+button.dataset.set];if(set&&!set.completed){set.actualRir=set.actualRir===button.dataset.value?"":button.dataset.value;persist();button.parentElement.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===set.actualRir));}}
  else if(action==="toggle-set")toggleSet(+button.dataset.exercise,+button.dataset.set);
  else if(action==="continue"){state.activeSession.currentExercise=+button.dataset.exercise;persist();renderSession();document.querySelector(`[data-exercise="${button.dataset.exercise}"]`)?.scrollIntoView({behavior:"smooth"});}
  else if(action==="finish-session")finishSession();else if(action==="timer-pause")pauseTimer();else if(action==="timer-resume")resumeTimer();else if(action==="timer-plus")adjustTimer(30000);else if(action==="timer-minus")adjustTimer(-30000);else if(action==="timer-reset")resetTimer();else if(action==="timer-skip")stopTimer(true);
  else if(action==="export")exportData();else if(action==="import")document.querySelector("#import-input").click();
  else if(action==="clear-data")showModal("Borrar todos los datos","Se eliminarán historial, sesión activa y ajustes. Esta acción no se puede deshacer.",[{label:"CANCELAR"},{label:"BORRAR TODO",className:"danger",action:()=>{stopTimerUiOnly();storage.clear();state=defaults();route="settings";render();notify("Todos los datos se han borrado");}}]);
});

document.addEventListener("change", event => {
  const el=event.target;if(el.matches("input[data-field]"))updateInput(el);
  if(el.matches("input[data-setting]")){const key=el.dataset.setting;if(el.type==="checkbox")state.settings[key]=el.checked;else state.settings[key]=validPositive(el.value,state.settings[key]);persist();if(el.type!=="checkbox")el.value=state.settings[key];}
  if(el.id==="import-input"&&el.files[0]){importData(el.files[0]);el.value="";}
});
document.addEventListener("input",event=>{if(event.target.matches("input[data-field]"))updateInput(event.target);});
document.querySelector("#back-button").addEventListener("click",()=>{route="home";selectedDayId=null;render();});
document.querySelector("#rir-info").addEventListener("click",()=>showModal("¿Qué es el RIR?","RIR son las repeticiones que aproximadamente podrías haber realizado antes del fallo.",[{label:"ENTENDIDO",className:""}]));
["visibilitychange","pageshow","focus"].forEach(name=>window.addEventListener(name,()=>{if(name!=="visibilitychange"||document.visibilityState==="visible"){if(route==="session")renderTimer();}}));
window.addEventListener("storage",event=>{if(event.key===STORAGE_KEY){state=storage.load();route=state.activeSession?"session":route;render();}});

render();
