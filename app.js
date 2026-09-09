"use strict";

// Fuente única de verdad. Aproximaciones y series efectivas son datos distintos.
const warmup = (loadLabel, targetLoadPercent, targetReps, restSeconds, options = {}) => ({
  loadLabel, targetLoadPercent, targetReps: String(targetReps), restSeconds, ...options
});
const working = (minReps, maxReps, targetRir) => ({ minReps, maxReps, targetRir: String(targetRir) });

const workoutProgram = {
  microcycle: ["Push", "Pull", "Pierna A", "Descanso", "Upper", "Descanso", "Pierna B", "Descanso"],
  days: [
    { id: "push", number: 1, name: "PUSH", group: "upper", subtitle: "Pecho · hombro · tríceps", exercises: [
      { id: "press-inclinado", name: "Press inclinado en multipower o barra", warmupSets: [
        warmup("40%", 40, 8, 60), warmup("60%", 60, 5, 90), warmup("75%", 75, 3, 90), warmup("85–90%", 87.5, 1, 150)
      ], workingSets: [working(6, 10, 2), working(6, 10, 1), working(6, 10, 1)], restSeconds: 180, transitionRestSeconds: 240, note: "" },
      { id: "press-plano-mancuernas", name: "Press plano con mancuernas o máquina", warmupSets: [warmup("65%", 65, 5, 90)], workingSets: [working(8, 12, 2), working(8, 12, 1)], restSeconds: 150, transitionRestSeconds: 180, note: "" },
      { id: "press-hombro", name: "Press de hombro con mancuernas o máquina", warmupSets: [warmup("65%", 65, 5, 90)], workingSets: [working(8, 12, 2), working(8, 12, 1)], restSeconds: 150, transitionRestSeconds: 150, note: "" },
      { id: "aperturas-polea", name: "Aperturas en polea", warmupSets: [warmup("Carga ligera", null, 8, 60, { optional: true })], workingSets: [working(10, 15, 1), working(10, 15, "0-1")], restSeconds: 90, transitionRestSeconds: 120, note: "" },
      { id: "elevaciones-laterales-polea", name: "Elevaciones laterales en polea o mancuerna", warmupSets: [warmup("Carga ligera", null, 8, 60, { optional: true })], workingSets: [working(12, 20, 2), working(12, 20, 1), working(12, 20, "0-1")], restSeconds: 90, transitionRestSeconds: 120, note: "" },
      { id: "extension-triceps-cabeza", name: "Extensión de tríceps sobre la cabeza", warmupSets: [warmup("Carga ligera", null, 8, 60)], workingSets: [working(10, 15, 1), working(10, 15, "0-1")], restSeconds: 90, transitionRestSeconds: 90, note: "" },
      { id: "jalon-triceps", name: "Jalón de tríceps", warmupSets: [], workingSets: [working(10, 15, 1), working(10, 15, "0-1")], restSeconds: 90, transitionRestSeconds: 90, note: "" }
    ]},
    { id: "pull", number: 2, name: "PULL", group: "upper", subtitle: "Espalda · bíceps", exercises: [
      { id: "dominadas-jalon", name: "Dominadas o jalón al pecho", warmupSets: [], warmupVariants: [
        { id: "jalon", label: "Jalón al pecho", sets: [warmup("40%", 40, 8, 60), warmup("60%", 60, 5, 90), warmup("75%", 75, "2-3", 150)] },
        { id: "dominadas", label: "Dominadas", sets: [warmup("Retracciones escapulares o jalón ligero", null, "6-8", 60), warmup("Dominadas asistidas / fáciles", null, "3-4", 120)] }
      ], workingSets: [working(6, 10, 2), working(6, 10, 1), working(6, 10, 1)], restSeconds: 180, transitionRestSeconds: 240, note: "" },
      { id: "remo-pecho", name: "Remo con pecho apoyado o T-Bar", warmupSets: [warmup("55%", 55, 5, 75), warmup("75%", 75, "2-3", 120)], workingSets: [working(8, 12, 2), working(8, 12, 1), working(8, 12, 1)], restSeconds: 180, transitionRestSeconds: 210, note: "" },
      { id: "jalon-unilateral", name: "Jalón unilateral", warmupSets: [warmup("Carga ligera", null, "5 por lado", 60)], workingSets: [working(10, 15, 2), working(10, 15, 1)], restSeconds: 120, transitionRestSeconds: 150, note: "" },
      { id: "pajaros", name: "Reverse pec deck o pájaros", warmupSets: [warmup("Carga ligera", null, 8, 60)], workingSets: [working(12, 20, 2), working(12, 20, 1), working(12, 20, "0-1")], restSeconds: 90, transitionRestSeconds: 150, note: "" },
      { id: "curl-predicador", name: "Curl predicador", warmupSets: [warmup("Carga ligera", null, 6, 60)], workingSets: [working(8, 12, 1), working(8, 12, "0-1")], restSeconds: 120, transitionRestSeconds: 150, note: "" },
      { id: "curl-inclinado", name: "Curl inclinado con mancuernas", warmupSets: [warmup("Carga muy ligera", null, 5, 60)], workingSets: [working(10, 15, 1), working(10, 15, "0-1")], restSeconds: 90, transitionRestSeconds: 90, note: "" }
    ]},
    { id: "pierna-a", number: 3, name: "PIERNA A", group: "lower", subtitle: "CUÁDRICEPS", preSessionNote: "Opcional: 5–8 minutos de bici o cinta suave antes de entrenar.", exercises: [
      { id: "hack-squat", name: "Hack squat o sentadilla", warmupSets: [warmup("35%", 35, 8, 60), warmup("55%", 55, 5, 90), warmup("72–75%", 73.5, 3, 90), warmup("85%", 85, "1-2", 180, { minRestSeconds: 150 })], workingSets: [working(6, 10, 3), working(6, 10, 2), working(6, 10, 2)], restSeconds: 180, transitionRestSeconds: 240, note: "" },
      { id: "prensa", name: "Prensa", warmupSets: [warmup("50%", 50, 5, 75), warmup("75%", 75, 2, 120, { optional: true })], workingSets: [working(10, 15, 3), working(10, 15, 2)], restSeconds: 180, transitionRestSeconds: 180, note: "" },
      { id: "extension-cuadriceps", name: "Extensión de cuádriceps", warmupSets: [warmup("Carga ligera", null, 8, 60)], workingSets: [working(12, 15, 2), working(12, 15, 1)], restSeconds: 120, transitionRestSeconds: 150, note: "" },
      { id: "curl-femoral-a", name: "Curl femoral", warmupSets: [warmup("40–50%", 45, 6, 90)], workingSets: [working(10, 15, 3), working(10, 15, 2)], restSeconds: 120, transitionRestSeconds: 150, note: "" },
      { id: "gemelo-a", name: "Gemelo", warmupSets: [warmup("Carga ligera", null, 8, 60)], workingSets: [working(8, 15, 2), working(8, 15, 1), working(8, 15, 1)], restSeconds: 120, transitionRestSeconds: 90, note: "" },
      { id: "abdominal", name: "Abdominal", warmupSets: [], workingSets: [working(10, 20, 2), working(10, 20, 1), working(10, 20, 1)], restSeconds: 90, transitionRestSeconds: 90, note: "" }
    ]},
    { id: "upper", number: 4, name: "UPPER", group: "upper", subtitle: "TORSO COMPLETO", exercises: [
      { id: "press-plano-barra", name: "Press plano con barra o máquina", warmupSets: [warmup("40%", 40, 8, 60), warmup("60%", 60, 5, 90), warmup("75%", 75, 3, 90), warmup("85–90%", 87.5, 1, 150)], workingSets: [working(6, 10, 2), working(6, 10, 1), working(6, 10, 1)], restSeconds: 180, transitionRestSeconds: 210, note: "" },
      { id: "jalon-neutro", name: "Jalón neutro cerrado/medio al pecho", warmupSets: [warmup("50%", 50, 6, 60), warmup("75%", 75, 3, 120)], workingSets: [working(8, 12, 2), working(8, 12, 1), working(8, 12, 1)], restSeconds: 150, transitionRestSeconds: 180, note: "" },
      { id: "fondos-paralelas", name: "Fondos en paralelas", warmupSets: [], warmupVariants: [
        { id: "peso-corporal", label: "Peso corporal", sets: [warmup("Fondos asistidos / serie muy fácil", null, "4-5", 90)] },
        { id: "lastrados", label: "Lastrados", sets: [warmup("Peso corporal", null, "4-5", 90), warmup("50% del lastre efectivo", 50, "2-3", 120)] }
      ], workingSets: [working(6, 10, 2), working(6, 10, 1)], restSeconds: 180, transitionRestSeconds: 180, note: "" },
      { id: "remo-unilateral", name: "Remo unilateral o máquina", warmupSets: [warmup("Carga ligera", null, 5, 60)], workingSets: [working(10, 15, 2), working(10, 15, 1)], restSeconds: 120, transitionRestSeconds: 120, note: "" },
      { id: "elevaciones-laterales", name: "Elevaciones laterales", warmupSets: [warmup("Carga ligera", null, 8, 60, { optional: true })], workingSets: [working(12, 20, 2), working(12, 20, 1), working(12, 20, "0-1")], restSeconds: 90, transitionRestSeconds: 120, note: "" },
      { id: "curl-cable", name: "Curl de bíceps en cable o mancuerna", warmupSets: [warmup("Carga ligera", null, 5, 60)], workingSets: [working(10, 15, 1), working(10, 15, "0-1")], restSeconds: 90, transitionRestSeconds: 90, note: "" },
      { id: "extension-triceps-polea", name: "Extensión de tríceps en polea", warmupSets: [warmup("Carga ligera", null, 5, 60, { optional: true })], workingSets: [working(10, 15, 1), working(10, 15, "0-1")], restSeconds: 90, transitionRestSeconds: 90, note: "" }
    ]},
    { id: "pierna-b", number: 5, name: "PIERNA B", group: "lower", subtitle: "POSTERIOR", exercises: [
      { id: "peso-muerto-rumano", name: "Peso muerto rumano", warmupSets: [warmup("30%", 30, 6, 60), warmup("50%", 50, 5, 75), warmup("70%", 70, 3, 90), warmup("85%", 85, "1-2", 180, { minRestSeconds: 150 })], workingSets: [working(6, 10, 3), working(6, 10, 2)], restSeconds: 180, transitionRestSeconds: 240, note: "", info: "Las aproximaciones preparan el patrón sin buscar fatiga. Mantén todas muy lejos del fallo." },
      { id: "sentadilla-bulgara", name: "Sentadilla búlgara", warmupSets: [warmup("Peso corporal o carga ligera", null, "5 por pierna", 90)], workingSets: [working(8, 12, 3), working(8, 12, 2)], restSeconds: 180, transitionRestSeconds: 210, note: "Repeticiones por pierna" },
      { id: "prensa-pies-altos", name: "Prensa con pies medios/altos", warmupSets: [warmup("50–60%", 55, 5, 90)], workingSets: [working(10, 15, 3), working(10, 15, 2)], restSeconds: 180, transitionRestSeconds: 180, note: "" },
      { id: "gemelo-b", name: "Gemelo", warmupSets: [warmup("Carga ligera", null, 8, 60)], workingSets: [working(10, 15, 2), working(10, 15, 1), working(10, 15, 1)], restSeconds: 120, transitionRestSeconds: 120, note: "" },
      { id: "aductor", name: "Aductor en máquina", warmupSets: [warmup("Carga ligera", null, 8, 60)], workingSets: [working(10, 15, 2), working(10, 15, 1)], restSeconds: 90, transitionRestSeconds: 90, note: "" }
    ]}
  ]
};

function programWarmups(exercise) { return exercise.warmupVariants?.[0]?.sets || exercise.warmupSets; }
function validateWorkoutProgram(program) {
  const exercises = program.days.flatMap(day => day.exercises);
  if (exercises.length !== 31) throw new Error(`La rutina V3 debe tener 31 ejercicios; contiene ${exercises.length}.`);
  if (new Set(exercises.map(exercise => exercise.id)).size !== exercises.length) throw new Error("Hay identificadores de ejercicio duplicados.");
  exercises.forEach(exercise => {
    if (!Array.isArray(exercise.warmupSets) || !Array.isArray(exercise.workingSets) || !exercise.workingSets.length) throw new Error(`Estructura incompleta en ${exercise.id}.`);
    [...exercise.warmupSets, ...(exercise.warmupVariants || []).flatMap(variant => variant.sets)].forEach(set => {
      if (!validPositive(set.restSeconds, 0) || !set.targetReps) throw new Error(`Aproximación inválida en ${exercise.id}.`);
    });
    if (!validPositive(exercise.restSeconds, 0) || !validPositive(exercise.transitionRestSeconds, 0)) throw new Error(`Descanso inválido en ${exercise.id}.`);
  });
}

const SCHEMA_VERSION = 3;
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
    if (![1, 2, SCHEMA_VERSION].includes(data.schemaVersion)) throw new Error(`Versión de datos incompatible (${data.schemaVersion ?? "desconocida"}).`);
    if (!data.settings || typeof data.settings !== "object" || !Array.isArray(data.history)) throw new Error("Faltan secciones obligatorias.");
    const clean = defaults();
    clean.settings = {
      sound: Boolean(data.settings.sound), vibration: data.settings.vibration !== false,
      upperIncrement: validPositive(data.settings.upperIncrement, 2.5),
      lowerIncrement: validPositive(data.settings.lowerIncrement, 5)
    };
    clean.history = data.history.filter(isValidSession).slice(0, 1000).map(session => normalizeSession(session, false));
    clean.activeSession = isValidSession(data.activeSession) && !data.activeSession.finishedAt ? normalizeSession(data.activeSession, true) : null;
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
function inferredExerciseStatus(exercise) {
  if (exercise.status === "skipped") return "skipped";
  const sets = exercise.workingSets || exercise.sets || [];
  if (sets.length && sets.every(set => set.completed)) return "completed";
  if (sets.some(set => set.completed)) return "active";
  return "pending";
}
function normalizeSession(session, active) {
  const clean = structuredClone(session);
  const programDay = workoutProgram.days.find(day => day.id === clean.dayId);
  clean.exercises.forEach(exercise => {
    const programExercise = programDay?.exercises.find(item => item.id === exercise.id);
    const legacySets = Array.isArray(exercise.sets) ? exercise.sets : [];
    const sourceWorkingSets = Array.isArray(exercise.workingSets) ? exercise.workingSets : legacySets;
    exercise.workingSets = sourceWorkingSets.map((set, index) => ({
      ...set,
      number: Number.isInteger(set.number) ? set.number : index + 1,
      minReps: Number(set.minReps ?? exercise.minReps ?? programExercise?.workingSets[index]?.minReps ?? 0),
      maxReps: Number(set.maxReps ?? exercise.maxReps ?? programExercise?.workingSets[index]?.maxReps ?? 0),
      weight: set.weight ?? "", reps: set.reps ?? "", targetRir: String(set.targetRir ?? ""), actualRir: set.actualRir ?? "",
      completed: Boolean(set.completed), completedAt: set.completed ? (set.completedAt || null) : null
    }));
    exercise.warmupSets = (Array.isArray(exercise.warmupSets) ? exercise.warmupSets : []).map((set, index) => {
      const status = ["pending", "completed", "skipped"].includes(set.status) ? set.status : (set.completed ? "completed" : "pending");
      return { ...set, number: Number.isInteger(set.number) ? set.number : index + 1, weight: set.weight ?? "", reps: set.reps ?? "", targetReps: String(set.targetReps ?? ""),
        restSeconds: validPositive(set.restSeconds, exercise.restSeconds || programExercise?.restSeconds || 90), status, completed: status === "completed", completedAt: status === "completed" ? (set.completedAt || null) : null, skippedByExercise: Boolean(set.skippedByExercise) };
    });
    delete exercise.sets;
    exercise.restSeconds = validPositive(exercise.restSeconds, programExercise?.restSeconds || 90);
    exercise.transitionRestSeconds = validPositive(exercise.transitionRestSeconds, exercise.restSeconds);
    exercise.status = inferredExerciseStatus(exercise);
  });
  if (active) {
    const available = clean.exercises.findIndex(exercise => !["completed", "skipped"].includes(exercise.status));
    if (!Number.isInteger(clean.currentExercise) || !clean.exercises[clean.currentExercise] || ["completed", "skipped"].includes(clean.exercises[clean.currentExercise].status)) clean.currentExercise = available;
    const current = clean.exercises[clean.currentExercise];
    if (current?.status === "pending") current.status = "active";
  }
  const timer = clean.timer || {};
  const timerExercise = clean.exercises[timer.exerciseIndex];
  timer.status = ["running", "paused", "finished", "idle"].includes(timer.status) ? timer.status : "idle";
  timer.kind = timer.status === "idle" ? null : (["warmup", "between-exercises"].includes(timer.kind) ? timer.kind : "between-sets");
  timer.durationMs = Number.isFinite(timer.durationMs) ? timer.durationMs : 0;
  timer.remainingMs = Number.isFinite(timer.remainingMs) ? timer.remainingMs : 0;
  timer.endTimestamp = Number.isFinite(timer.endTimestamp) ? timer.endTimestamp : null;
  timer.exerciseIndex = Number.isInteger(timer.exerciseIndex) ? timer.exerciseIndex : null;
  timer.exerciseName = timer.exerciseName || timerExercise?.name || "";
  timer.warmupIndex = timer.kind === "warmup" && Number.isInteger(timer.warmupIndex) ? timer.warmupIndex : null;
  timer.nextSetLabel = timer.kind === "warmup" ? (timer.nextSetLabel || "") : "";
  if (timer.kind === "between-exercises") {
    const namedIndex = clean.exercises.findIndex(exercise => exercise.name === timer.nextExerciseName && exercise.status !== "skipped");
    timer.nextExerciseIndex = Number.isInteger(timer.nextExerciseIndex) && clean.exercises[timer.nextExerciseIndex]?.status !== "skipped" ? timer.nextExerciseIndex : (namedIndex >= 0 ? namedIndex : clean.currentExercise);
    timer.nextExerciseName = clean.exercises[timer.nextExerciseIndex]?.name || "";
  } else { timer.nextExerciseIndex = null; timer.nextExerciseName = ""; }
  clean.timer = timer;
  return clean;
}
function uid() { return `${Date.now().toString(36)}-${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c])); }
function formatTime(seconds) { const s = Math.max(0, Math.ceil(seconds)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }
function formatDate(iso) { return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)); }
function durationText(ms) { const mins = Math.max(1, Math.round(ms / 60000)); return mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`; }

validateWorkoutProgram(workoutProgram);
let state = storage.load();
let route = state.activeSession ? "session" : "home";
let selectedDayId = null;
let editingHistoryId = null;
let historyDraft = null;
let timerInterval = null;
let timerAudioContext = null;
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
function exerciseStatus(exercise) { return ["pending", "active", "completed", "skipped"].includes(exercise?.status) ? exercise.status : inferredExerciseStatus(exercise); }
function sessionComplete(s = state.activeSession) { return Boolean(s && s.exercises.every(exercise => exerciseStatus(exercise) === "completed")); }
function sessionReadyToFinish(s = state.activeSession) { return Boolean(s && s.exercises.every(exercise => ["completed", "skipped"].includes(exerciseStatus(exercise)))); }
function completedSetCount(s) { return s.exercises.reduce((n, exercise) => exerciseStatus(exercise) === "skipped" ? n : n + exercise.workingSets.filter(set => set.completed).length, 0); }
function totalSetCount(s) { return s.exercises.reduce((n, exercise) => n + exercise.workingSets.length, 0); }
function nextAvailableExercise(session, afterIndex, wrap = false) {
  const available = (_, index) => index > afterIndex && !["completed", "skipped"].includes(exerciseStatus(session.exercises[index]));
  let index = session.exercises.findIndex(available);
  if (index < 0 && wrap) index = session.exercises.findIndex((exercise, i) => i !== afterIndex && !["completed", "skipped"].includes(exerciseStatus(exercise)));
  return index;
}
function makeExerciseCurrent(session, index) {
  if (index < 0 || !session.exercises[index]) return;
  session.currentExercise = index;
  if (exerciseStatus(session.exercises[index]) === "pending") session.exercises[index].status = "active";
}

function createWarmupSets(definitions) {
  return definitions.map((set, index) => ({ ...structuredClone(set), number: index + 1, weight: "", reps: "", status: "pending", completed: false, completedAt: null, skippedByExercise: false }));
}

function createSession(day) {
  return {
    id: uid(), dayId: day.id, dayName: `${day.name}${day.subtitle ? ` · ${day.subtitle}` : ""}`,
    group: day.group, startedAt: new Date().toISOString(), finishedAt: null, currentExercise: 0,
    exercises: day.exercises.map((ex, index) => {
      const variant = ex.warmupVariants?.[0];
      return { id: ex.id, name: ex.name, restSeconds: ex.restSeconds, transitionRestSeconds: ex.transitionRestSeconds, note: ex.note, info: ex.info || "", status: index === 0 ? "active" : "pending",
        warmupVariantId: variant?.id || null, warmupVariantLabel: variant?.label || "", warmupSets: createWarmupSets(variant?.sets || ex.warmupSets),
        workingSets: ex.workingSets.map((set, i) => ({ ...structuredClone(set), number: i + 1, weight: "", reps: "", actualRir: "", completed: false, completedAt: null })) };
    }),
    timer: { status: "idle", kind: null, durationMs: 0, remainingMs: 0, endTimestamp: null, exerciseIndex: null, exerciseName: "", warmupIndex: null, nextSetLabel: "", nextExerciseIndex: null, nextExerciseName: "" }
  };
}

function latestExercise(exerciseId) {
  for (const session of state.history) { const ex = session.exercises.find(item => item.id === exerciseId && exerciseStatus(item) !== "skipped" && item.workingSets.some(set => set.completed)); if (ex) return ex; }
  return null;
}
function progression(ex, group) {
  if (!ex) return "";
  const last = latestExercise(ex.id);
  if (!last || last.workingSets.length !== ex.workingSets.length || !last.workingSets.every((set, index) => set.completed && Number(set.reps) >= ex.workingSets[index].maxReps)) return "";
  const withRir = last.workingSets.filter(set => set.actualRir !== "");
  let confident = withRir.length === last.workingSets.length;
  if (confident) confident = last.workingSets.every(set => Number.parseInt(set.actualRir, 10) >= Number.parseInt(set.targetRir, 10) - 1);
  const increment = group === "lower" ? state.settings.lowerIncrement : state.settings.upperIncrement;
  return confident ? `↑ Posible subida de ${increment} kg` : `↑ Posible subida de ${increment} kg si respetaste el RIR objetivo`;
}

function expectedWorkingWeight(exercise) {
  const current = Number(exercise.workingSets?.[0]?.weight);
  if (Number.isFinite(current) && current > 0) return current;
  const previous = latestExercise(exercise.id)?.workingSets.find(set => set.completed && Number(set.weight) > 0);
  return previous ? Number(previous.weight) : null;
}
function suggestedWarmupWeight(exercise, set) {
  const reference = expectedWorkingWeight(exercise);
  if (!reference || !Number.isFinite(set.targetLoadPercent)) return null;
  return Math.round(reference * set.targetLoadPercent / 50) / 2;
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
    }).join("")}</section>
    <section class="panel microcycle"><p class="eyebrow">MICROCICLO RECOMENDADO · 8 DÍAS</p><div>${workoutProgram.microcycle.map((item, index) => `<span class="${item === "Descanso" ? "rest-day" : ""}"><small>D${index + 1}</small>${item}</span>`).join("")}</div><p class="muted small">Orientativo: puedes abrir cualquier entrenamiento cuando quieras.</p></section>`;
}

function renderDay() {
  const day = dayById(selectedDayId);
  if (!day) { route = "home"; return render(); }
  setHeader(day.name, `DÍA ${day.number}`, true);
  const activeOther = state.activeSession && state.activeSession.dayId !== day.id;
  const workingCount = day.exercises.reduce((total, exercise) => total + exercise.workingSets.length, 0);
  const warmupCount = day.exercises.reduce((total, exercise) => total + programWarmups(exercise).length, 0);
  main.innerHTML = `<section class="panel"><p class="eyebrow">${day.subtitle}</p><h2>${day.name}</h2><p class="muted">${day.exercises.length} ejercicios · ${workingCount} series efectivas · ${warmupCount} aproximaciones</p>
    ${day.preSessionNote ? `<p class="pre-session-note">${escapeHtml(day.preSessionNote)}</p>` : ""}
    <button class="button full" data-action="${state.activeSession?.dayId === day.id ? "resume-session" : "start-session"}" ${activeOther ? "disabled" : ""}>${state.activeSession?.dayId === day.id ? "REANUDAR ENTRENAMIENTO" : "COMENZAR ENTRENAMIENTO"}</button>
    ${activeOther ? `<p class="small muted">Finaliza primero tu sesión activa de ${escapeHtml(activeDay().name)}.</p>` : ""}</section>
    <section class="exercise-list">${day.exercises.map((ex,i)=>`<article class="panel"><span class="day-number">${String(i+1).padStart(2,"0")}</span><h3>${escapeHtml(ex.name)}</h3><p class="muted small">Aproximación: ${programWarmups(ex).length}${ex.warmupVariants ? " (variante seleccionable)" : ""}<br>Efectivas: ${ex.workingSets.map(set => `${set.minReps}-${set.maxReps}`).join(" / ")} reps${ex.note ? ` · ${escapeHtml(ex.note)}` : ""}<br>RIR ${ex.workingSets.map(set => set.targetRir).join(" / ")}<br>Entre series: ${formatTime(ex.restSeconds)}<br>Al siguiente ejercicio: ${formatTime(ex.transitionRestSeconds)}</p>${ex.info ? `<p class="info-note">${escapeHtml(ex.info)}</p>` : ""}</article>`).join("")}</section>`;
}

function renderSession() {
  const s = state.activeSession;
  if (!s) { route = "home"; return render(); }
  const day = activeDay();
  setHeader(day.name, "SESIÓN ACTIVA", false);
  const done = completedSetCount(s), total = totalSetCount(s);
  const completedExercises=s.exercises.filter(exercise=>exerciseStatus(exercise)==="completed").length;
  const skippedExercises=s.exercises.filter(exercise=>exerciseStatus(exercise)==="skipped").length;
  main.innerHTML = `<section class="session-summary"><div class="stat"><strong>${done}/${total}</strong><span>SERIES</span></div><div class="stat"><strong>${completedExercises}/${s.exercises.length}</strong><span>EJERCICIOS${skippedExercises ? ` · ${skippedExercises} omit.` : ""}</span></div><div class="stat"><strong>${durationText(Date.now()-new Date(s.startedAt))}</strong><span>TIEMPO</span></div></section>
    <section class="exercise-list">${s.exercises.map((ex, exIndex) => renderExercise(ex, exIndex, day)).join("")}</section>
    <section class="panel session-finish"><h2>${sessionReadyToFinish(s) ? "ENTRENAMIENTO COMPLETADO" : "Finalizar sesión"}</h2><p class="muted">${sessionReadyToFinish(s) ? (skippedExercises ? "Has terminado la sesión con ejercicios omitidos." : "Has completado todas las series. Buen trabajo.") : "Puedes finalizar ahora; las series pendientes quedarán registradas como no completadas."}</p><button class="button full" data-action="finish-session">FINALIZAR ENTRENAMIENTO</button><button class="button danger-outline full" data-action="cancel-session">CANCELAR ENTRENAMIENTO</button></section>`;
  renderTimer();
}

function renderExercise(ex, exIndex, day) {
  const status=exerciseStatus(ex),done=status==="completed",skipped=status==="skipped",current=exIndex===state.activeSession.currentExercise&&!done&&!skipped;
  const latest = latestExercise(ex.id);
  const lastText = latest ? latest.workingSets.filter(set=>set.completed).map(set=>`${set.weight || "—"} kg × ${set.reps || "—"}${set.actualRir !== "" ? ` (RIR ${set.actualRir})` : ""}`).join(" · ") : "Sin registros anteriores";
  const lastWarmups = latest?.warmupSets?.filter(set => set.status === "completed");
  const programEx = day.exercises.find(e=>e.id===ex.id);
  const recommendation = progression(programEx, day.group);
  const label=skipped?"OMITIDO":done?"COMPLETADO":current||status==="active"?"EN CURSO":"PENDIENTE";
  const minReps = Math.min(...ex.workingSets.map(set => set.minReps));
  const maxReps = Math.max(...ex.workingSets.map(set => set.maxReps));
  return `<details class="exercise-card ${done ? "done" : ""} ${skipped ? "skipped" : ""} ${current ? "current" : ""}" data-exercise="${exIndex}" ${current || skipped ? "open" : ""}>
    <summary class="exercise-summary"><div><span class="badge ${done ? "accent" : skipped ? "warning" : ""}">${label}</span><h3>${escapeHtml(ex.name)}</h3><div class="exercise-meta"><span>${ex.warmupSets.length} aprox. · ${ex.workingSets.length} efectivas</span><span>${minReps}-${maxReps} reps${ex.note ? " por pierna" : ""}</span><span>RIR ${ex.workingSets.map(set=>set.targetRir).join(" / ")}</span><span>Entre series: ${formatTime(ex.restSeconds)}</span><span>Al siguiente: ${formatTime(ex.transitionRestSeconds)}</span></div></div></summary>
    ${skipped ? `<div class="exercise-actions"><p class="muted small">Este ejercicio y sus aproximaciones pendientes no contarán como realizados.</p><button class="button secondary full" data-action="recover-exercise" data-exercise="${exIndex}">RECUPERAR EJERCICIO</button></div>` : `<p class="last-session"><strong>Última vez · efectivas:</strong> ${escapeHtml(lastText)}${lastWarmups?.length ? `<details class="last-warmups"><summary>Aproximaciones utilizadas</summary><span>${escapeHtml(lastWarmups.map(set => `${set.weight || "—"} kg × ${set.reps || "—"}`).join(" · "))}</span></details>` : ""}</p>${ex.info ? `<button type="button" class="exercise-info" data-action="exercise-info" data-exercise="${exIndex}">ⓘ Indicaciones de aproximación</button>` : ""}${recommendation ? `<p class="progress-note">${escapeHtml(recommendation)}</p>` : ""}${renderWarmupBlock(ex, exIndex, programEx, current)}<div class="sets working-block"><div class="block-title"><span>SERIES EFECTIVAS</span><small>${ex.workingSets.length}</small></div>${ex.workingSets.map((set,setIndex)=>renderSet(set,exIndex,setIndex)).join("")}${!done ? `<button class="button ghost full" data-action="skip-exercise" data-exercise="${exIndex}">SALTAR EJERCICIO</button>` : ""}</div>`}</details>`;
}

function renderWarmupBlock(exercise, exIndex, programExercise, current) {
  const variants = programExercise?.warmupVariants || [];
  if (!exercise.warmupSets.length && !variants.length) return `<div class="warmup-empty"><span>APROXIMACIÓN</span><small>No necesaria</small></div>`;
  const hasPending = exercise.warmupSets.some(set => set.status === "pending");
  const variantButtons = variants.length ? `<div class="variant-picker" role="group" aria-label="Variante de aproximación">${variants.map(variant => `<button type="button" data-action="select-warmup-variant" data-exercise="${exIndex}" data-variant="${variant.id}" class="${exercise.warmupVariantId === variant.id ? "selected" : ""}">${escapeHtml(variant.label)}</button>`).join("")}</div>` : "";
  return `<details class="warmup-block" ${current && hasPending ? "open" : ""}><summary><span>APROXIMACIÓN <small>(${exercise.warmupSets.length})</small></span><span class="muted small">mostrar / ocultar</span></summary>${variantButtons}<p class="warmup-guidance">Debe sentirse fácil · lejos del fallo · RIR 5+ orientativo</p><div class="warmup-sets">${exercise.warmupSets.map((set, setIndex) => renderWarmupSet(exercise, set, exIndex, setIndex)).join("")}</div></details>`;
}

function renderWarmupSet(exercise, set, exIndex, setIndex) {
  const skipped = set.status === "skipped", completed = set.status === "completed";
  const suggestion = suggestedWarmupWeight(exercise, set);
  const rest = set.minRestSeconds ? `${formatTime(set.minRestSeconds)}–${formatTime(set.restSeconds)}` : formatTime(set.restSeconds);
  return `<article class="warmup-set ${completed ? "done" : ""} ${skipped ? "skipped" : ""}"><div class="set-top"><span class="set-title">A${set.number}${set.optional ? " · OPCIONAL" : ""}${completed ? " · ✓" : skipped ? " · OMITIDA" : ""}</span><span class="warmup-target">${escapeHtml(set.loadLabel)} · ${escapeHtml(set.targetReps)} reps · ${rest}</span></div>${skipped ? `<button type="button" class="button secondary full" data-action="recover-warmup" data-exercise="${exIndex}" data-set="${setIndex}">RECUPERAR APROXIMACIÓN</button>` : `<div class="set-inputs"><label class="input-suffix">Peso<input data-field="weight" data-series="warmup" data-exercise="${exIndex}" data-set="${setIndex}" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(set.weight)}"><span>kg</span></label><label>Repeticiones<input data-field="reps" data-series="warmup" data-exercise="${exIndex}" data-set="${setIndex}" type="number" inputmode="numeric" min="0" step="1" value="${escapeHtml(set.reps)}"></label></div>${suggestion !== null ? `<p class="load-suggestion">Carga orientativa: ${suggestion} kg (sobre ${expectedWorkingWeight(exercise)} kg efectivos)</p>` : ""}<div class="warmup-actions"><button type="button" class="button ${completed ? "secondary" : ""}" data-action="toggle-warmup" data-exercise="${exIndex}" data-set="${setIndex}">${completed ? "DESMARCAR" : "✓ COMPLETAR"}</button>${!completed ? `<button type="button" class="button ghost" data-action="skip-warmup" data-exercise="${exIndex}" data-set="${setIndex}">SALTAR</button>` : ""}</div>`}</article>`;
}

function renderSet(set, exIndex, setIndex) {
  return `<article class="set-card ${set.completed ? "done" : ""}"><div class="set-top"><span class="set-title">S${set.number}${set.completed ? " · ✓" : ""} · ${set.minReps}-${set.maxReps} REPS</span><span class="target-rir">RIR OBJ. ${set.targetRir}</span></div>
    <div class="set-inputs"><label class="input-suffix">Peso<input data-field="weight" data-series="working" data-exercise="${exIndex}" data-set="${setIndex}" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(set.weight)}"><span>kg</span></label>
    <label>Repeticiones<input data-field="reps" data-series="working" data-exercise="${exIndex}" data-set="${setIndex}" type="number" inputmode="numeric" min="0" step="1" value="${escapeHtml(set.reps)}"></label></div>
    <label>RIR realizado <span class="muted">(opcional)</span></label><div class="rir-picker" role="group" aria-label="RIR realizado">${["0","1","2","3","4+"].map(v=>`<button type="button" data-action="set-rir" data-exercise="${exIndex}" data-set="${setIndex}" data-value="${v}" class="${set.actualRir===v ? "selected" : ""}">${v}</button>`).join("")}</div>
    <button type="button" class="button full ${set.completed ? "secondary" : ""}" data-action="toggle-set" data-exercise="${exIndex}" data-set="${setIndex}">${set.completed ? "DESMARCAR SERIE" : "✓ COMPLETAR SERIE"}</button></article>`;
}

function renderHistory() {
  setHeader("HISTORIAL", "TUS SESIONES");
  timerDock.classList.add("hidden");
  main.innerHTML = state.history.length ? state.history.map(renderHistorySession).join("") : `<div class="empty"><h2>Aún no hay sesiones</h2><p>Finaliza tu primer entrenamiento y aparecerá aquí.</p></div>`;
}

function renderHistorySession(session) {
  const editing=editingHistoryId===session.id&&historyDraft;
  const shown=editing?historyDraft:session;
  return `<details class="panel history-item" data-session="${escapeHtml(session.id)}" ${editing?"open":""}><summary><div class="row"><div><h3>${escapeHtml(shown.dayName)}</h3><span class="muted small">${formatDate(shown.finishedAt || shown.startedAt)}</span></div><span class="badge">${durationText(new Date(shown.finishedAt)-new Date(shown.startedAt))}</span></div></summary>
    ${shown.exercises.map((exercise,exerciseIndex)=>renderHistoryExercise(exercise,exerciseIndex,Boolean(editing))).join("")}
    <div class="history-actions">${editing?`<button class="button secondary" data-action="cancel-history-edit">CANCELAR EDICIÓN</button><button class="button" data-action="save-history-edit" data-session="${escapeHtml(session.id)}">GUARDAR CAMBIOS</button>`:`<button class="button secondary" data-action="edit-history" data-session="${escapeHtml(session.id)}">EDITAR</button><button class="button danger-outline" data-action="delete-history" data-session="${escapeHtml(session.id)}">ELIMINAR SESIÓN</button>`}</div></details>`;
}

function renderHistoryExercise(exercise, exerciseIndex, editing) {
  const skipped=exerciseStatus(exercise)==="skipped";
  return `<div class="history-exercise"><div class="row"><strong>${escapeHtml(exercise.name)}</strong>${skipped?`<span class="badge warning">OMITIDO</span>`:""}</div>${skipped&&!editing?`<div class="history-set">No realizado</div>`:`${exercise.warmupSets.length ? `<p class="history-block-title">APROXIMACIONES</p>${exercise.warmupSets.map((set,setIndex)=>renderHistoryWarmup(set,exerciseIndex,setIndex,editing)).join("")}` : ""}<p class="history-block-title">SERIES EFECTIVAS</p>${exercise.workingSets.map((set,setIndex)=>renderHistorySet(set,exerciseIndex,setIndex,editing)).join("")}`}</div>`;
}

function renderHistoryWarmup(set, exerciseIndex, setIndex, editing) {
  if (set.status === "skipped" && !editing) return `<div class="history-set warmup-history">A${set.number} · omitida</div>`;
  if (!editing) return `<div class="history-set warmup-history">A${set.number} · ${set.status === "completed" ? `${escapeHtml(set.weight || "—")} kg × ${escapeHtml(set.reps || "—")}` : "no completada"}</div>`;
  return `<article class="history-edit-set warmup-history"><div class="set-top"><span class="set-title">A${set.number}</span><span class="warmup-target">${escapeHtml(set.loadLabel || "Aproximación")}</span></div><div class="set-inputs"><label class="input-suffix">Peso<input data-history-field="weight" data-series="warmup" data-exercise="${exerciseIndex}" data-set="${setIndex}" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(set.weight)}"><span>kg</span></label><label>Repeticiones<input data-history-field="reps" data-series="warmup" data-exercise="${exerciseIndex}" data-set="${setIndex}" type="number" inputmode="numeric" min="0" step="1" value="${escapeHtml(set.reps)}"></label></div></article>`;
}

function renderHistorySet(set, exerciseIndex, setIndex, editing) {
  if(!editing)return `<div class="history-set">${set.completed ? `${escapeHtml(set.weight || "—")} kg × ${escapeHtml(set.reps || "—")} · RIR obj. ${escapeHtml(set.targetRir)}${set.actualRir !== "" ? ` · real ${escapeHtml(set.actualRir)}` : ""}` : "Serie no completada"}</div>`;
  return `<article class="history-edit-set"><div class="set-top"><span class="set-title">S${set.number}</span><span class="target-rir">RIR OBJ. ${escapeHtml(set.targetRir)}</span></div><div class="set-inputs"><label class="input-suffix">Peso<input data-history-field="weight" data-series="working" data-exercise="${exerciseIndex}" data-set="${setIndex}" type="number" inputmode="decimal" min="0" step="0.1" value="${escapeHtml(set.weight)}"><span>kg</span></label><label>Repeticiones<input data-history-field="reps" data-series="working" data-exercise="${exerciseIndex}" data-set="${setIndex}" type="number" inputmode="numeric" min="0" step="1" value="${escapeHtml(set.reps)}"></label></div><label>RIR realizado <span class="muted">(opcional)</span></label><div class="rir-picker" role="group" aria-label="RIR realizado de la serie ${set.number}">${["0","1","2","3","4+"].map(value=>`<button type="button" data-action="history-rir" data-exercise="${exerciseIndex}" data-set="${setIndex}" data-value="${value}" class="${set.actualRir===value?"selected":""}">${value}</button>`).join("")}</div></article>`;
}

function renderSettings() {
  setHeader("AJUSTES", "PREFERENCIAS"); timerDock.classList.add("hidden");
  main.innerHTML = `<section class="panel"><label class="toggle"><span><strong>Sonido</strong><small class="muted"> Aviso corto al acabar el descanso</small></span><input type="checkbox" data-setting="sound" ${state.settings.sound ? "checked" : ""}></label>
    ${state.settings.sound ? `<button class="button secondary full" data-action="test-sound">PROBAR SONIDO</button>` : ""}
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
  const exercise = s.exercises[Number(input.dataset.exercise)];
  const collection = input.dataset.series === "warmup" ? exercise?.warmupSets : exercise?.workingSets;
  const set = collection?.[Number(input.dataset.set)]; if (!set) return;
  let value = input.value.trim();
  if (value !== "") { const n = Number(value); if (!Number.isFinite(n) || n < 0) value = ""; else if (input.dataset.field === "reps") value = String(Math.floor(n)); }
  set[input.dataset.field] = value; persist();
}

function updateHistoryInput(input) {
  if(!historyDraft)return;
  const exercise=historyDraft.exercises[Number(input.dataset.exercise)];
  const collection=input.dataset.series==="warmup"?exercise?.warmupSets:exercise?.workingSets;
  const set=collection?.[Number(input.dataset.set)];if(!set)return;
  let value=input.value.trim();
  if(value!==""){const number=Number(value);if(!Number.isFinite(number)||number<0)value="";else if(input.dataset.historyField==="reps")value=String(Math.floor(number));}
  set[input.dataset.historyField]=value;
}

function toggleSet(exIndex, setIndex) {
  const s = state.activeSession, ex = s?.exercises[exIndex], set = ex?.workingSets[setIndex]; if (!set) return;
  if(exerciseStatus(ex)==="skipped")return;
  if (!set.completed && (set.weight === "" || set.reps === "" || Number(set.weight) < 0 || !Number.isInteger(Number(set.reps)))) { notify("Introduce un peso y repeticiones válidos"); return; }
  set.completed = !set.completed; set.completedAt = set.completed ? new Date().toISOString() : null;
  if (set.completed) {
    const exerciseDone = ex.workingSets.every(item=>item.completed);
    ex.status=exerciseDone?"completed":"active";
    const next = exerciseDone ? nextAvailableExercise(s,exIndex,true) : -1;
    if (exerciseDone && next < 0) {
      s.currentExercise = exIndex;
      stopTimer(false);
    } else {
      if (exerciseDone) makeExerciseCurrent(s,next);else makeExerciseCurrent(s,exIndex);
      if (state.settings.sound) void armTimerAudio();
      startTimer(exerciseDone ? (ex.transitionRestSeconds ?? ex.restSeconds) : ex.restSeconds, exIndex, exerciseDone ? "between-exercises" : "between-sets", exerciseDone ? next : null);
    }
  } else {
    ex.status=ex.workingSets.some(item=>item.completed)?"active":"pending";
    makeExerciseCurrent(s,exIndex);
  }
  persist(); renderSession();
}

function toggleWarmup(exIndex, setIndex) {
  const session=state.activeSession,exercise=session?.exercises[exIndex],set=exercise?.warmupSets[setIndex];
  if(!set||exerciseStatus(exercise)==="skipped"||set.status==="skipped")return;
  if(set.status!=="completed"&&(set.weight===""||set.reps===""||Number(set.weight)<0||!Number.isInteger(Number(set.reps)))){notify("Introduce un peso y repeticiones válidos");return;}
  const completing=set.status!=="completed";
  set.status=completing?"completed":"pending";set.completed=completing;set.completedAt=completing?new Date().toISOString():null;set.skippedByExercise=false;
  makeExerciseCurrent(session,exIndex);
  if(completing){
    const nextIndex=exercise.warmupSets.findIndex((candidate,index)=>index>setIndex&&candidate.status==="pending");
    const nextLabel=nextIndex>=0?`Aproximación ${nextIndex+1}`:"Serie efectiva 1";
    if(state.settings.sound)void armTimerAudio();
    startTimer(set.restSeconds||exercise.restSeconds,exIndex,"warmup",null,setIndex,nextLabel);
  }
  persist();renderSession();
}

function skipWarmup(exIndex,setIndex){
  const exercise=state.activeSession?.exercises[exIndex],set=exercise?.warmupSets[setIndex];
  if(!set||exerciseStatus(exercise)==="skipped"||set.status!=="pending")return;
  set.status="skipped";set.completed=false;set.completedAt=null;set.skippedByExercise=false;persist();renderSession();notify(`Aproximación A${set.number} omitida`);
}

function recoverWarmup(exIndex,setIndex){
  const exercise=state.activeSession?.exercises[exIndex],set=exercise?.warmupSets[setIndex];
  if(!set||exerciseStatus(exercise)==="skipped"||set.status!=="skipped")return;
  set.status="pending";set.completed=false;set.completedAt=null;set.skippedByExercise=false;persist();renderSession();notify(`Aproximación A${set.number} recuperada`);
}

function selectWarmupVariant(exIndex,variantId){
  const session=state.activeSession,exercise=session?.exercises[exIndex],programExercise=activeDay()?.exercises.find(item=>item.id===exercise?.id);
  const variant=programExercise?.warmupVariants?.find(item=>item.id===variantId);if(!variant||exercise.warmupVariantId===variantId)return;
  const apply=()=>{const timer=session.timer;if(timer.status!=="idle"&&timer.kind==="warmup"&&timer.exerciseIndex===exIndex)stopTimer(false);exercise.warmupVariantId=variant.id;exercise.warmupVariantLabel=variant.label;exercise.warmupSets=createWarmupSets(variant.sets);persist();renderSession();notify(`Aproximación adaptada a ${variant.label}`);};
  const touched=exercise.warmupSets.some(set=>set.status!=="pending"||set.weight!==""||set.reps!=="");
  if(touched)showModal("¿Cambiar la variante?","Se reemplazarán las aproximaciones registradas para este ejercicio.",[{label:"VOLVER"},{label:"CAMBIAR VARIANTE",action:apply}]);else apply();
}

function startTimer(seconds, exerciseIndex, kind = "between-sets", nextExerciseIndex = null, warmupIndex = null, nextSetLabel = "") {
  const timer = state.activeSession.timer;
  timer.status = "running"; timer.kind = kind; timer.durationMs = seconds * 1000; timer.remainingMs = timer.durationMs; timer.endTimestamp = Date.now() + timer.remainingMs; timer.exerciseIndex = exerciseIndex; timer.exerciseName = state.activeSession.exercises[exerciseIndex]?.name || ""; timer.warmupIndex=kind==="warmup"?warmupIndex:null;timer.nextSetLabel=kind==="warmup"?nextSetLabel:"";timer.nextExerciseIndex = kind === "between-exercises" ? nextExerciseIndex : null; timer.nextExerciseName = state.activeSession.exercises[timer.nextExerciseIndex]?.name || ""; persist();
}
function timerRemaining(timer) { return timer.status === "running" && timer.endTimestamp ? Math.max(0, timer.endTimestamp - Date.now()) : Math.max(0, timer.remainingMs || 0); }
function adjustTimer(deltaMs) {
  const t = state.activeSession?.timer; if (!t || t.status === "idle") return;
  const remaining = Math.max(0, timerRemaining(t) + deltaMs); t.remainingMs = remaining; if (t.status === "running") t.endTimestamp = Date.now() + remaining; persist(); tickTimer();
}
function pauseTimer() { const t=state.activeSession?.timer; if (!t||t.status!=="running") return; t.remainingMs=timerRemaining(t);t.endTimestamp=null;t.status="paused";persist();renderTimer(); }
function resumeTimer() { const t=state.activeSession?.timer; if (!t||t.status!=="paused") return;t.status="running";t.endTimestamp=Date.now()+t.remainingMs;persist();renderTimer(); }
function resetTimer() { const t=state.activeSession?.timer;if(!t||t.status==="idle")return;t.remainingMs=t.durationMs;t.status="running";t.endTimestamp=Date.now()+t.durationMs;persist();renderTimer(); }
function stopTimer(persistChange=false) { clearInterval(timerInterval);timerInterval=null;releaseTimerAudio();const t=state.activeSession?.timer;if(t){t.status="idle";t.kind=null;t.remainingMs=0;t.endTimestamp=null;t.exerciseIndex=null;t.exerciseName="";t.warmupIndex=null;t.nextSetLabel="";t.nextExerciseIndex=null;t.nextExerciseName="";if(persistChange)persist();}timerDock.classList.add("hidden"); }
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
  const kind=t.kind==="warmup"?"DESCANSO DE APROXIMACIÓN":t.kind==="between-exercises"?"DESCANSO ENTRE EJERCICIOS":"DESCANSO ENTRE SERIES";
  const exerciseLabel=t.kind==="between-exercises"?"EJERCICIO TERMINADO":t.kind==="warmup"?`APROXIMACIÓN A${Number(t.warmupIndex)+1}`:"EJERCICIO";
  const exercise=`<p class="timer-context"><span>${exerciseLabel}</span>${escapeHtml(t.exerciseName||state.activeSession.exercises[t.exerciseIndex]?.name||"")}</p>`;
  const next=t.kind==="between-exercises"?`<p class="timer-next"><span>SIGUIENTE</span>${escapeHtml(t.nextExerciseName||"Sin ejercicios pendientes")}</p>`:t.kind==="warmup"?`<p class="timer-next"><span>SIGUIENTE</span>${escapeHtml(t.nextSetLabel||"Serie efectiva 1")}</p>`:"";
  timerDock.classList.toggle("finished",finished);
  timerDock.innerHTML=`<div class="timer-main"><div><span class="eyebrow">${kind}</span><div class="timer-time">${formatTime(seconds)}</div>${t.status==="paused"?`<span class="badge">EN PAUSA</span>`:""}${finished?`<span class="badge accent">TERMINADO</span>`:""}</div><button class="button" data-action="${t.status==="paused" ? "timer-resume" : "timer-pause"}" ${finished ? "disabled" : ""}>${t.status==="paused" ? "REANUDAR" : "PAUSAR"}</button></div>${exercise}${next}<div class="timer-controls"><button data-action="timer-minus">−30 s</button><button data-action="timer-plus">+30 s</button><button data-action="timer-reset">REINICIAR</button><button data-action="timer-skip">OMITIR</button></div>`;
  if(finished&&t.status==="running"){t.status="finished";t.remainingMs=0;t.endTimestamp=null;clearInterval(timerInterval);timerInterval=null;persist();signalTimerEnd();}
}
function signalTimerEnd(){if(state.settings.vibration&&navigator.vibrate)navigator.vibrate([180,80,180]);if(state.settings.sound)void playTimerAlert(true);else releaseTimerAudio();}

async function armTimerAudio(){
  if(!state.settings.sound){releaseTimerAudio();return false;}
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx){console.warn("Web Audio no está disponible; el aviso visual seguirá funcionando.");return false;}
  try{
    if(!timerAudioContext||timerAudioContext.state==="closed")timerAudioContext=new Ctx();
    if(timerAudioContext.state==="suspended"||timerAudioContext.state==="interrupted")await timerAudioContext.resume();
    return timerAudioContext.state==="running";
  }catch(error){console.warn("No se pudo preparar el audio del temporizador:",error);return false;}
}

function releaseTimerAudio(){
  const context=timerAudioContext;timerAudioContext=null;
  if(context&&context.state!=="closed"){
    try{context.close().catch(error=>console.warn("No se pudo liberar el audio del temporizador:",error));}
    catch(error){console.warn("No se pudo liberar el audio del temporizador:",error);}
  }
}

async function playTimerAlert(releaseAfter=true){
  const context=timerAudioContext;
  if(!context){console.warn("El aviso sonoro no estaba preparado por una interacción del usuario.");return;}
  try{
    if(context.state==="suspended"||context.state==="interrupted")await context.resume();
    if(context.state!=="running")throw new Error(`AudioContext en estado ${context.state}`);
    const master=context.createGain();master.gain.value=1;master.connect(context.destination);
    const starts=[0,.28,.56],now=context.currentTime+.02;
    let cleaned=false;
    const cleanup=()=>{if(cleaned)return;cleaned=true;master.disconnect();if(releaseAfter)releaseTimerAudio();};
    starts.forEach((offset,index)=>{
      const oscillator=context.createOscillator(),gain=context.createGain(),start=now+offset,end=start+.16;
      oscillator.type="sine";oscillator.frequency.value=1050;
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.28,start+.018);gain.gain.setValueAtTime(.28,start+.11);gain.gain.exponentialRampToValueAtTime(.0001,end);
      oscillator.connect(gain).connect(master);oscillator.start(start);oscillator.stop(end+.01);
      if(index===starts.length-1)oscillator.onended=cleanup;
    });
    setTimeout(cleanup,1200);
  }catch(error){console.warn("No se pudo reproducir el aviso sonoro:",error);if(releaseAfter)releaseTimerAudio();}
}

function testTimerSound(){
  if(!state.settings.sound)return;
  const timerStatus=state.activeSession?.timer?.status;
  const keepArmed=timerStatus==="running"||timerStatus==="paused";
  void armTimerAudio().then(armed=>{if(armed)void playTimerAlert(!keepArmed);});
}

function cancelActiveSession(){
  const sessionId=state.activeSession?.id;if(!sessionId)return;
  showModal("¿Cancelar este entrenamiento?","Se eliminarán los datos de esta sesión en curso. Tu historial anterior no se verá afectado.",[{label:"VOLVER"},{label:"CANCELAR ENTRENAMIENTO",className:"danger",action:()=>{if(state.activeSession?.id!==sessionId)return;stopTimer(false);state.activeSession=null;persist();route="home";render();notify("Entrenamiento cancelado");}}]);
}

function skipExercise(exIndex){
  const session=state.activeSession,exercise=session?.exercises[exIndex];
  if(!exercise||["completed","skipped"].includes(exerciseStatus(exercise)))return;
  showModal(`¿Saltar ${exercise.name}?`,"El ejercicio quedará como omitido y sus series no contarán como realizadas.",[{label:"VOLVER"},{label:"SALTAR EJERCICIO",className:"danger",action:()=>{
    const currentSession=state.activeSession,currentExercise=currentSession?.exercises[exIndex];
    if(!currentExercise||["completed","skipped"].includes(exerciseStatus(currentExercise)))return;
    const timer=currentSession.timer;
    const cancelOwnSetRest=timer.status!=="idle"&&["between-sets","warmup"].includes(timer.kind)&&timer.exerciseIndex===exIndex;
    const wasTransitionTarget=timer.status!=="idle"&&timer.kind==="between-exercises"&&timer.nextExerciseIndex===exIndex;
    if(cancelOwnSetRest)stopTimer(false);
    currentExercise.warmupSets.forEach(set=>{if(set.status==="pending"){set.status="skipped";set.completed=false;set.completedAt=null;set.skippedByExercise=true;}});
    currentExercise.status="skipped";
    const next=nextAvailableExercise(currentSession,exIndex,true);
    if(wasTransitionTarget){timer.nextExerciseIndex=next>=0?next:null;timer.nextExerciseName=next>=0?currentSession.exercises[next].name:"";}
    if(currentSession.currentExercise===exIndex||!["pending","active"].includes(exerciseStatus(currentSession.exercises[currentSession.currentExercise]))){currentSession.currentExercise=-1;if(next>=0)makeExerciseCurrent(currentSession,next);}
    persist();renderSession();notify(`${currentExercise.name} omitido`);
  }}]);
}

function recoverExercise(exIndex){
  const session=state.activeSession,exercise=session?.exercises[exIndex];if(!exercise||exerciseStatus(exercise)!=="skipped")return;
  exercise.status=exercise.workingSets.some(set=>set.completed)?"active":"pending";
  exercise.warmupSets.forEach(set=>{if(set.status==="skipped"&&set.skippedByExercise){set.status="pending";set.skippedByExercise=false;}});
  if(session.currentExercise<0||!["pending","active"].includes(exerciseStatus(session.exercises[session.currentExercise])))makeExerciseCurrent(session,exIndex);
  persist();renderSession();notify(`${exercise.name} recuperado`);
}

function beginHistoryEdit(sessionId){
  const session=state.history.find(item=>item.id===sessionId);if(!session)return;
  editingHistoryId=sessionId;historyDraft=structuredClone(session);renderHistory();
}

function saveHistoryEdit(sessionId){
  if(!historyDraft||editingHistoryId!==sessionId||historyDraft.id!==sessionId)return;
  const index=state.history.findIndex(session=>session.id===sessionId);if(index<0)return;
  state.history[index]=normalizeSession(historyDraft,false);editingHistoryId=null;historyDraft=null;persist();renderHistory();notify("Cambios guardados");
}

function deleteHistorySession(sessionId){
  const session=state.history.find(item=>item.id===sessionId);if(!session)return;
  showModal("¿Eliminar esta sesión?","Esta acción eliminará definitivamente este entrenamiento del historial.",[{label:"VOLVER"},{label:"ELIMINAR SESIÓN",className:"danger",action:()=>{const previousLength=state.history.length;state.history=state.history.filter(item=>item.id!==sessionId);if(state.history.length===previousLength)return;if(editingHistoryId===sessionId){editingHistoryId=null;historyDraft=null;}persist();renderHistory();notify("Sesión eliminada");}}]);
}

function finishSession() {
  const s=state.activeSession;if(!s)return;
  const execute=()=>{if(!state.activeSession||state.history.some(x=>x.id===s.id))return;stopTimer(false);s.finishedAt=new Date().toISOString();state.history.unshift(structuredClone(s));state.activeSession=null;persist();route="history";render();notify("Entrenamiento guardado");};
  const skipped=s.exercises.filter(exercise=>exerciseStatus(exercise)==="skipped");
  if(skipped.length){const names=skipped.map(exercise=>`• ${exercise.name}`).join("\n");const pending=sessionReadyToFinish(s)?"":"\n\nTambién quedan series pendientes.";showModal(`Has omitido ${skipped.length} ${skipped.length===1?"ejercicio":"ejercicios"}`,`${names}${pending}`,[{label:"VOLVER AL ENTRENAMIENTO"},{label:"FINALIZAR DE TODAS FORMAS",className:"danger",action:execute}]);}
  else if(!sessionComplete(s))showModal("¿Finalizar antes de tiempo?","Quedan series pendientes. Se guardará lo completado hasta ahora.",[{label:"VOLVER AL ENTRENAMIENTO"},{label:"FINALIZAR DE TODAS FORMAS",className:"danger",action:execute}]);else execute();
}

function showModal(title, body, actions) {
  const dialog=document.querySelector("#modal");if(dialog.open)return;document.querySelector("#modal-title").textContent=title;document.querySelector("#modal-body").innerHTML=`<p class="muted">${escapeHtml(body)}</p>`;
  const area=document.querySelector("#modal-actions");area.replaceChildren();actions.forEach(a=>{const b=document.createElement("button");b.type="button";b.className=`button ${a.className||"secondary"}`;b.textContent=a.label;b.addEventListener("click",()=>{dialog.close();a.action?.();},{once:true});area.append(b);});dialog.showModal();
}

function exportData() { const blob=new Blob([storage.export(state)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`entreno-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
async function importData(file) { try{const imported=storage.import(await file.text());showModal("Importar datos","Esto reemplazará la sesión, historial y ajustes actuales.",[{label:"CANCELAR"},{label:"IMPORTAR",action:()=>{state=imported;persist();route=state.activeSession?"session":"settings";render();notify("Datos importados correctamente");}}]);}catch(error){console.error("Importación rechazada:",error);notify(`Archivo no válido: ${error.message}`);} }

document.addEventListener("click", event => {
  const button=event.target.closest("button");if(!button)return;const {action}=button.dataset;
  if(button.dataset.route){route=button.dataset.route;selectedDayId=null;render();return;}
  if(action==="open-day"){selectedDayId=button.dataset.day;route="day";render();}
  else if(action==="start-session")beginSession(); else if(action==="resume-session"){route="session";render();}
  else if(action==="set-rir"){const set=state.activeSession?.exercises[+button.dataset.exercise]?.workingSets[+button.dataset.set];if(set){set.actualRir=set.actualRir===button.dataset.value?"":button.dataset.value;persist();button.parentElement.querySelectorAll("button").forEach(b=>b.classList.toggle("selected",b.dataset.value===set.actualRir));}}
  else if(action==="toggle-set"){button.disabled=true;toggleSet(+button.dataset.exercise,+button.dataset.set);}
  else if(action==="toggle-warmup"){button.disabled=true;toggleWarmup(+button.dataset.exercise,+button.dataset.set);}
  else if(action==="skip-warmup")skipWarmup(+button.dataset.exercise,+button.dataset.set);else if(action==="recover-warmup")recoverWarmup(+button.dataset.exercise,+button.dataset.set);
  else if(action==="select-warmup-variant")selectWarmupVariant(+button.dataset.exercise,button.dataset.variant);
  else if(action==="exercise-info"){const info=state.activeSession?.exercises[+button.dataset.exercise]?.info;if(info)showModal("Aproximaciones del ejercicio",info,[{label:"ENTENDIDO",className:""}]);}
  else if(action==="skip-exercise")skipExercise(+button.dataset.exercise);else if(action==="recover-exercise")recoverExercise(+button.dataset.exercise);
  else if(action==="continue"){makeExerciseCurrent(state.activeSession,+button.dataset.exercise);persist();renderSession();document.querySelector(`[data-exercise="${button.dataset.exercise}"]`)?.scrollIntoView({behavior:"smooth"});}
  else if(action==="finish-session")finishSession();else if(action==="cancel-session")cancelActiveSession();else if(action==="timer-pause")pauseTimer();else if(action==="timer-resume")resumeTimer();else if(action==="timer-plus")adjustTimer(30000);else if(action==="timer-minus")adjustTimer(-30000);else if(action==="timer-reset")resetTimer();else if(action==="timer-skip")stopTimer(true);
  else if(action==="edit-history")beginHistoryEdit(button.dataset.session);else if(action==="cancel-history-edit"){editingHistoryId=null;historyDraft=null;renderHistory();}else if(action==="save-history-edit")saveHistoryEdit(button.dataset.session);else if(action==="delete-history")deleteHistorySession(button.dataset.session);
  else if(action==="history-rir"&&historyDraft){const set=historyDraft.exercises[+button.dataset.exercise]?.workingSets[+button.dataset.set];if(set){set.actualRir=set.actualRir===button.dataset.value?"":button.dataset.value;button.parentElement.querySelectorAll("button").forEach(item=>item.classList.toggle("selected",item.dataset.value===set.actualRir));}}
  else if(action==="test-sound")testTimerSound();
  else if(action==="export")exportData();else if(action==="import")document.querySelector("#import-input").click();
  else if(action==="clear-data")showModal("Borrar todos los datos","Se eliminarán historial, sesión activa y ajustes. Esta acción no se puede deshacer.",[{label:"CANCELAR"},{label:"BORRAR TODO",className:"danger",action:()=>{if(state.activeSession)stopTimer(false);else releaseTimerAudio();storage.clear();state=defaults();route="settings";render();notify("Todos los datos se han borrado");}}]);
});

document.addEventListener("change", event => {
  const el=event.target;if(el.matches("input[data-field]"))updateInput(el);
  if(el.matches("input[data-history-field]"))updateHistoryInput(el);
  if(el.matches("input[data-setting]")){const key=el.dataset.setting;if(el.type==="checkbox")state.settings[key]=el.checked;else state.settings[key]=validPositive(el.value,state.settings[key]);if(key==="sound"&&!state.settings.sound)releaseTimerAudio();persist();if(el.type!=="checkbox")el.value=state.settings[key];if(key==="sound")renderSettings();}
  if(el.id==="import-input"&&el.files[0]){importData(el.files[0]);el.value="";}
});
document.addEventListener("input",event=>{if(event.target.matches("input[data-field]"))updateInput(event.target);if(event.target.matches("input[data-history-field]"))updateHistoryInput(event.target);});
document.querySelector("#back-button").addEventListener("click",()=>{route="home";selectedDayId=null;render();});
document.querySelector("#rir-info").addEventListener("click",()=>showModal("¿Qué es el RIR?","RIR son las repeticiones que aproximadamente podrías haber realizado antes del fallo.",[{label:"ENTENDIDO",className:""}]));
["visibilitychange","pageshow","focus"].forEach(name=>window.addEventListener(name,()=>{if(name!=="visibilitychange"||document.visibilityState==="visible"){if(route==="session")renderTimer();}}));
window.addEventListener("storage",event=>{if(event.key===STORAGE_KEY){state=storage.load();route=state.activeSession?"session":route;render();}});

render();
