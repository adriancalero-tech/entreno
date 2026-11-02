import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { verifyInsights } from "./verify-insights.mjs";

class FakeElement {
  constructor() {
    this.innerHTML = "";
    this.textContent = "";
    this.open = false;
    this.files = [];
    this.value = "";
    this.dataset = {};
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  addEventListener() {}
  append() {}
  replaceChildren() {}
  querySelectorAll() { return []; }
  querySelector() { return null; }
  scrollIntoView() {}
  showModal() { this.open = true; }
  close() { this.open = false; }
}

const elements = new Map();
const element = selector => {
  if (!elements.has(selector)) elements.set(selector, new FakeElement());
  return elements.get(selector);
};
const saved = new Map();
const consoleErrors = [];
const context = vm.createContext({
  Blob,
  URL,
  crypto: webcrypto,
  structuredClone,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  Intl,
  console: {
    log: (...args) => console.log(...args),
    warn: (...args) => consoleErrors.push(args.join(" ")),
    error: (...args) => consoleErrors.push(args.join(" "))
  },
  navigator: { vibrate() {} },
  localStorage: {
    get length() { return saved.size; },
    key: i => [...saved.keys()][i] ?? null,
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key)
  },
  document: {
    querySelector: element,
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => new FakeElement(),
    visibilityState: "visible"
  },
  window: {
    addEventListener() {},
    scrollTo() {},
    AudioContext: null,
    webkitAudioContext: null
  }
});

let source = ["insights.js","views.js","app.js"].map(file=>readFileSync(new URL(file, import.meta.url), "utf8")).join("\n");
source = source.replace(/\nrender\(\);\s*$/, "");
source += `
globalThis.api = {
  workoutProgram: legacyProgram, currentProgram: workoutProgram, Insights, defaults, storage, normalizeSession, createSession, progression,
  completedSetCount, totalSetCount, programWarmups, renderHistoryExercise, renderExercise, suggestedWarmupWeight,
  toggleWarmup, skipWarmup, recoverWarmup, toggleSet, skipExercise, recoverExercise,
  selectWarmupVariant, updateInput, beginHistoryEdit, updateHistoryInput, saveHistoryEdit, stopTimer,
  getState: () => state,
  getHistoryDraft: () => historyDraft,
  cycleState, skipOptional, finishSession, cancelActiveSession, saveExerciseOptions, renderHome, importData, recoveryPlan, planningText, musclesFor,
  pauseSession, resumeSession, sessionRoute, sessionDuration, renderHistorySession, pauseTimer, backupButtons,
  startDay: id => { selectedDayId = id; beginSession(); },
  setState: value => { state = value; },
  autoConfirm: () => { showModal = (_title, _body, actions) => actions.at(-1).action?.(); }
};`;
vm.runInContext(source, context, { filename: "app.js" });
const { api } = context;
const program = api.workoutProgram;
const day = id => program.days.find(item => item.id === id);
const exercise = id => program.days.flatMap(item => item.exercises).find(item => item.id === id);
const withSession = dayId => {
  const session = api.createSession(day(dayId));
  api.setState({ ...api.defaults(), activeSession: session });
  return session;
};
const completeInput = set => { set.weight = "40"; set.reps = "8"; };
const results = [];
const check = (name, callback) => {
  callback();
  results.push(`✓ ${name}`);
};

check("1. Usuario nuevo creado con el esquema actual", () => assert.equal(api.defaults().schemaVersion, 5));

const v2Session = {
  id: "legacy-session", dayId: "push", dayName: "PUSH", startedAt: "2026-01-01T10:00:00.000Z", finishedAt: "2026-01-01T11:00:00.000Z", currentExercise: 0,
  exercises: [{ id: "press-inclinado", name: "Press antiguo", minReps: 6, maxReps: 10, restSeconds: 180, transitionRestSeconds: 180, status: "completed",
    sets: [{ number: 1, weight: "80", reps: "10", targetRir: "2", actualRir: "2", completed: true, completedAt: "2026-01-01T10:10:00.000Z" }] }],
  timer: { status: "idle" }
};
const v2Data = { schemaVersion: 2, settings: { sound: false, vibration: true, upperIncrement: 2.5, lowerIncrement: 5 }, activeSession: { ...structuredClone(v2Session), id: "legacy-active", finishedAt: null }, history: [v2Session] };
const migrated = api.storage.validate(v2Data);
const migratedV1 = api.storage.validate({ ...v2Data, schemaVersion: 1, activeSession: null });
check("2. Los datos V1/V2 existentes se aceptan", () => {
  assert.equal(migrated.history[0].id, "legacy-session");
  assert.equal(migratedV1.history[0].exercises[0].workingSets[0].weight, "80");
});
check("3. La migración conserva historial y sesión activa", () => {
  assert.equal(migrated.schemaVersion, 5);
  assert.equal(migrated.activeSession.id, "legacy-active");
  assert.equal(migrated.history[0].exercises[0].workingSets[0].weight, "80");
  assert.deepEqual([...migrated.history[0].exercises[0].warmupSets], []);
});

const push = withSession("push");
check("4. Push inicia con aproximaciones y efectivas separadas", () => {
  assert.equal(push.exercises[0].warmupSets.length, 4);
  assert.equal(push.exercises[0].workingSets.length, 3);
});
completeInput(push.exercises[0].warmupSets[0]);
api.toggleWarmup(0, 0);
check("5. Completar A1 crea un único timer propio de 60 s", () => {
  assert.equal(push.timer.kind, "warmup");
  assert.equal(push.timer.durationMs, 60_000);
  assert.equal(push.timer.warmupIndex, 0);
});
for (let index = 1; index < push.exercises[0].warmupSets.length; index += 1) {
  completeInput(push.exercises[0].warmupSets[index]);
  api.toggleWarmup(0, index);
}
check("6. Todas las aproximaciones se completan de forma independiente", () => assert.ok(push.exercises[0].warmupSets.every(set => set.status === "completed")));
check("7. La última aproximación anuncia Serie efectiva 1", () => {
  assert.equal(push.timer.durationMs, 150_000);
  assert.equal(push.timer.nextSetLabel, "Serie efectiva 1");
});
api.stopTimer(false);

const progressionSession = api.createSession(day("push"));
const progressionExercise = progressionSession.exercises[0];
progressionExercise.workingSets.forEach(set => { set.weight = "100"; set.reps = String(set.maxReps); set.actualRir = set.targetRir; set.completed = true; });
progressionExercise.status = "completed";
progressionExercise.warmupSets.forEach(set => { set.status = "skipped"; set.reps = "0"; });
progressionSession.finishedAt = new Date().toISOString();
api.setState({ ...api.defaults(), history: [progressionSession] });
const progressionBefore = api.progression(exercise("press-inclinado"), "upper");
progressionExercise.warmupSets.forEach(set => { set.status = "completed"; set.reps = "999"; });
check("8. La progresión ignora por completo las aproximaciones", () => {
  assert.equal(progressionBefore.kind,"none");
  assert.deepEqual(api.progression(exercise("press-inclinado"), "upper"), progressionBefore);
});

const skipSession = withSession("push");
api.skipWarmup(0, 1);
check("9. A2 puede omitirse sin omitir el ejercicio", () => {
  assert.equal(skipSession.exercises[0].warmupSets[1].status, "skipped");
  assert.notEqual(skipSession.exercises[0].status, "skipped");
  assert.equal(skipSession.timer.status, "idle");
});
api.recoverWarmup(0, 1);
check("10. A2 omitida puede recuperarse", () => assert.equal(skipSession.exercises[0].warmupSets[1].status, "pending"));
const firstWarmup = skipSession.exercises[0].warmupSets[0];
completeInput(firstWarmup);
api.toggleWarmup(0, 0);
const timerEnd = skipSession.timer.endTimestamp;
const fakeInput = { dataset: { exercise: "0", set: "0", series: "warmup", field: "weight" }, value: "42.5" };
api.updateInput(fakeInput);
check("11. Editar A1 completada no reinicia su timer", () => {
  assert.equal(firstWarmup.weight, "42.5");
  assert.equal(skipSession.timer.endTimestamp, timerEnd);
});
const restored = api.normalizeSession(structuredClone(skipSession), true);
check("12. Recargar durante el descanso restaura el timer de aproximación", () => {
  assert.equal(restored.timer.kind, "warmup");
  assert.equal(restored.timer.warmupIndex, 0);
  assert.equal(restored.timer.endTimestamp, timerEnd);
});
api.stopTimer(false);

const finishExerciseSession = withSession("push");
const firstExercise = finishExerciseSession.exercises[0];
firstExercise.workingSets.slice(0, 2).forEach(set => { completeInput(set); set.completed = true; set.completedAt = new Date().toISOString(); });
completeInput(firstExercise.workingSets[2]);
api.toggleSet(0, 2);
check("13. La última efectiva completa el ejercicio", () => assert.equal(firstExercise.status, "completed"));
check("14. La transición usa los 240 s del ejercicio terminado", () => {
  assert.equal(finishExerciseSession.timer.kind, "between-exercises");
  assert.equal(finishExerciseSession.timer.durationMs, 240_000);
  assert.equal(finishExerciseSession.timer.nextExerciseIndex, 1);
});
api.stopTimer(false);

const skippedExerciseSession = withSession("push");
api.autoConfirm();
api.skipExercise(0);
check("15. Omitir ejercicio omite sus aproximaciones pendientes", () => {
  assert.equal(skippedExerciseSession.exercises[0].status, "skipped");
  assert.ok(skippedExerciseSession.exercises[0].warmupSets.every(set => set.status === "skipped" && set.skippedByExercise));
});
api.recoverExercise(0);
check("16. Recuperar ejercicio reactiva solo las aproximaciones auto-omitidas", () => {
  assert.equal(skippedExerciseSession.exercises[0].status, "pending");
  assert.ok(skippedExerciseSession.exercises[0].warmupSets.every(set => set.status === "pending" && !set.skippedByExercise));
});

api.setState({ ...api.defaults(), history: [progressionSession] });
progressionSession.warmupVariantId = null;
progressionExercise.warmupSets[0].weight = "30";
api.beginHistoryEdit(progressionSession.id);
api.updateHistoryInput({ dataset: { exercise: "0", set: "0", series: "warmup", historyField: "weight" }, value: "32.5" });
assert.equal(api.getHistoryDraft().exercises[0].warmupSets[0].weight, "32.5");
assert.equal(progressionExercise.warmupSets[0].weight, "30");
api.saveHistoryEdit(progressionSession.id);
assert.equal(api.getState().history[0].exercises[0].warmupSets[0].weight, "32.5");
const historyHtml = api.renderHistoryExercise(progressionExercise, 0, false);
check("17. El historial V3 muestra ambos bloques", () => {
  assert.match(historyHtml, /APROXIMACIONES/);
  assert.match(historyHtml, /SERIES EFECTIVAS/);
});
const oldHistoryHtml = api.renderHistoryExercise(migrated.history[0].exercises[0], 0, false);
assert.doesNotMatch(oldHistoryHtml, /APROXIMACIONES/);
const sessionForLatest = withSession("push");
progressionExercise.variant = sessionForLatest.exercises[0].variant = "Barra del gimnasio";
api.getState().history = [structuredClone(progressionSession)];
delete api.getState().history[0].exercises[0].workingSets[0].actualRir;
const latestHtml = api.renderExercise(sessionForLatest.exercises[0], 0, day("push"));
check("18. Última sesión usa las efectivas como referencia principal", () => {
  assert.match(latestHtml, /Última vez · efectivas/);
  assert.match(latestHtml, /100 kg/);
  assert.doesNotMatch(latestHtml, /RIR undefined|RIR null/);
});

check("19. Pierna A tiene exactamente 3/2/2/2 efectivas principales", () => {
  const counts = ["hack-squat", "prensa", "extension-cuadriceps", "curl-femoral-a"].map(id => exercise(id).workingSets.length);
  assert.deepEqual(counts, [3, 2, 2, 2]);
});
check("20. Pierna B tiene 2 RDL, 0 curl, 2 búlgara, 2 prensa, 3 gemelo y 2 aductor", () => {
  assert.deepEqual(Array.from(day("pierna-b").exercises, item => [item.id, item.workingSets.length]), [
    ["peso-muerto-rumano", 2], ["sentadilla-bulgara", 2], ["prensa-pies-altos", 2], ["gemelo-b", 3], ["aductor", 2]
  ]);
  assert.equal(day("pierna-b").exercises.some(item => item.id === "curl-femoral-b"), false);
});
check("21. Upper contiene fondos y ya no el segundo press inclinado", () => {
  assert.ok(exercise("fondos-paralelas"));
  assert.equal(Boolean(exercise("press-inclinado-mancuernas")), false);
});
check("22. Hay 4 series efectivas directas de isquios", () => assert.equal(exercise("curl-femoral-a").workingSets.length + exercise("peso-muerto-rumano").workingSets.length, 4));
check("23. Los resúmenes no cuentan aproximaciones", () => {
  const legA = api.createSession(day("pierna-a"));
  assert.equal(api.totalSetCount(legA), 15);
  assert.equal(legA.exercises.reduce((total, item) => total + item.warmupSets.length, 0), 9);
  assert.equal(api.completedSetCount(legA), 0);
});
check("24. El nuevo total real es 31 ejercicios", () => assert.equal(program.days.flatMap(item => item.exercises).length, 31));

const defaultWarmups = Array.from(program.days, item => item.exercises.reduce((total, current) => total + api.programWarmups(current).length, 0));
const workingCounts = Array.from(program.days, item => item.exercises.reduce((total, current) => total + current.workingSets.length, 0));
const plain = value => JSON.parse(JSON.stringify(value));
assert.deepEqual(defaultWarmups, [9, 9, 9, 11, 8]);
assert.deepEqual(workingCounts, [16, 15, 15, 17, 11]);
assert.deepEqual([...program.microcycle], ["Push", "Pull", "Pierna A", "Descanso", "Upper", "Descanso", "Pierna B", "Descanso"]);
assert.deepEqual(plain(program.days.map(item => item.exercises.map(current => current.restSeconds))), [
  [180, 150, 150, 90, 90, 90, 90], [180, 180, 120, 90, 120, 90], [180, 180, 120, 120, 120, 90],
  [180, 150, 180, 120, 90, 90, 90], [180, 180, 180, 120, 90]
]);
assert.deepEqual(plain(program.days.map(item => item.exercises.map(current => current.transitionRestSeconds))), [
  [240, 180, 150, 120, 120, 90, 90], [240, 210, 150, 150, 150, 90], [240, 180, 150, 150, 90, 90],
  [210, 180, 180, 120, 120, 90, 90], [240, 210, 180, 120, 90]
]);
assert.deepEqual(plain(program.days.map(item => item.exercises.map(current => api.programWarmups(current).map(set => set.restSeconds)))), [
  [[60, 90, 90, 150], [90], [90], [60], [60], [60], []],
  [[60, 90, 150], [75, 120], [60], [60], [60], [60]],
  [[60, 90, 90, 180], [75, 120], [60], [90], [60], []],
  [[60, 90, 90, 150], [60, 120], [90], [60], [60], [60], [60]],
  [[60, 75, 90, 180], [90], [90], [60], [60]]
]);
assert.deepEqual(plain(exercise("dominadas-jalon").warmupVariants[1].sets.map(set => set.restSeconds)), [60, 120]);
assert.deepEqual(plain(exercise("fondos-paralelas").warmupVariants[1].sets.map(set => set.restSeconds)), [90, 120]);
assert.equal(exercise("dominadas-jalon").warmupVariants[1].sets.some(set => Number.isFinite(set.targetLoadPercent)), false);
const pullVariantSession = withSession("pull");
api.selectWarmupVariant(0, "dominadas");
assert.equal(pullVariantSession.exercises[0].warmupSets.length, 2);
assert.equal(pullVariantSession.exercises[0].warmupSets.some(set => Number.isFinite(set.targetLoadPercent)), false);
const suggestionSession = withSession("push");
suggestionSession.exercises[0].workingSets[0].weight = "85";
assert.equal(api.suggestedWarmupWeight(suggestionSession.exercises[0], suggestionSession.exercises[0].warmupSets[2]), 64);
assert.equal(suggestionSession.exercises[0].warmupSets[2].weight, "");
check("25. La estructura, variantes, sugerencias y microciclo son coherentes", () => assert.ok(true));
check("26. Ejecución sin errores de consola", () => assert.deepEqual(consoleErrors, []));

const [a,b,c,d] = api.currentProgram.days;
api.setState(api.defaults());
check("Plantillas 3+1: series, repeticiones, RIR y descansos, en orden", () => {
  const expected = [
    ["3/6-10/2/150","3/6-10/2/150","2/8-12/2/150","2/8-12/2/150","2/12-20/1-2/90","2/8-12/1-2/90","2/10-15/1-2/90"],
    ["2/5-8/3/180-240","2/10-15/2/120","2/10-15/2/150","2/10-15/1-2/90","2/10-20/No obligatorio/60-90","2/10-15/1-2/90"],
    ["2/4-6/3/180-240","3/8-12/2/150","2/8-12/2-3/150","2/10-15/2/120","2/8-12/2/150","2/12-20/1-2/90"],
    ["2/8-12/2/150","2/10-12/2/120","2/12-20/1-2/90","2/8-12/1-2/90","2/10-15/1-2/90","2/10-20/1-2, si procede/90"]
  ];
  for (const [index, day] of [a,b,c,d].entries()) {
    assert.deepEqual(Array.from(day.exercises, ex => {
      const target = ex.workingSets[0];
      assert.ok(ex.workingSets.every(s => JSON.stringify(s) === JSON.stringify(target)));
      return `${ex.workingSets.length}/${target.minReps}-${target.maxReps}/${target.targetRir}/${ex.restSeconds}${ex.restMax ? "-" + ex.restMax : ""}`;
    }), expected[index]);
  }
  assert.deepEqual([a,b,c,d].map(day => api.totalSetCount(api.createSession(day))), [16,12,13,12]);
  assert.deepEqual([a,b,c,d].map(day=>Array.from(day.exercises, ex=>ex.name)), [
    ["Press inclinado","Jalón al pecho","Press plano","Remo con pecho apoyado","Elevaciones laterales","Curl predicador","Extensión de tríceps sobre la cabeza"],
    ["Sentadilla libre con barra","Curl femoral tumbado","Prensa de piernas","Extensión de cuádriceps","Abdominales","Elevación de gemelos"],
    ["Peso muerto convencional","Press plano","Sentadilla búlgara","Curl femoral tumbado","Remo en máquina","Reverse pec deck"],
    ["Press de hombro","Jalón al pecho, agarre alternativo","Elevaciones laterales","Curl de bíceps","Extensión de tríceps","Gemelos o abdominales"]
  ]);
  assert.doesNotMatch(JSON.stringify(api.currentProgram),/curl femoral sentado/i);
  assert.deepEqual([a,b,c,d].map(day=>Boolean(day.optional)),[false,false,false,true]);
  assert.equal(b.exercises[0].name, "Sentadilla libre con barra");
  assert.equal(c.exercises[0].name, "Peso muerto convencional");
  assert.equal(c.exercises[3].name, b.exercises[1].name);
  assert.equal(c.exercises[3].name, "Curl femoral tumbado");
  assert.equal(b.exercises[4].name, "Abdominales");
  api.getState().settings.thirdSquatSet = true;
  assert.equal(api.createSession(b).exercises[0].workingSets.length, 3);
  api.getState().settings.thirdSquatSet = false;
});

function finishDay(day) {
  assert.equal(api.cycleState().next.id, day.id);
  api.startDay(day.id);
  const session = api.getState().activeSession;
  assert.equal(session.dayId, day.id);
  for (const [i, ex] of session.exercises.entries()) {
    for (const [j,set] of ex.workingSets.entries()) {
      completeInput(set);
      if ("repsRight" in set) set.repsRight = "9";
      api.toggleSet(i,j);
    }
  }
  assert.equal(session.timer.status, "idle");
  api.finishSession();
  assert.equal(api.getState().activeSession, null);
  assert.equal(api.getState().history[0].result,"complete");
}
check("Cancelar conserva A; finalizar una parcial guarda una vez y avanza a B", () => {
  api.startDay(b.id);
  assert.equal(api.getState().activeSession,null);
  api.startDay(a.id);
  api.cancelActiveSession();
  assert.equal(api.getState().history.length,0);
  assert.equal(api.cycleState().next.id,a.id);
  api.startDay(a.id);
  completeInput(api.getState().activeSession.exercises[0].workingSets[0]);
  api.toggleSet(0,0);
  api.finishSession();
  api.finishSession();
  assert.equal(api.cycleState().next.id,b.id);
  assert.equal(api.getState().history.length,1);
  assert.equal(api.getState().history[0].result,"partial");
  assert.equal(api.completedSetCount(api.getState().history[0]),1);
});
check("Completar A, B y C con pausas, recargar y elegir D", () => {
  api.setState(api.defaults());
  finishDay(a);
  api.getState().history[0].finishedAt = "2026-01-01T08:00:00Z";
  api.setState(api.storage.import(api.storage.export(api.getState())));
  finishDay(b);
  finishDay(c);
  assert.equal(api.cycleState().completed,3);
  finishDay(d);
  assert.equal(api.cycleState().next.id,a.id);
});
check("Omitir D tras C persiste sin crear una sesión", () => {
  finishDay(a); finishDay(b); finishDay(c);
  const before = JSON.stringify(api.getState().history);
  api.skipOptional();
  api.setState(api.storage.load());
  assert.equal(api.cycleState().next.id,a.id);
  assert.equal(JSON.stringify(api.getState().history),before);
  api.startDay(a.id);
  assert.equal(api.getState().activeSession.dayId,a.id);
  api.cancelActiveSession();
});
check("Variantes y descansos editables, progresión y referencias aisladas", () => {
  api.startDay(a.id);
  const ex = api.getState().activeSession.exercises[0];
  const options = (variant) => ({
    dataset: { exercise: "0" }, closest: () => ({
      querySelector: () => ({ value: variant }), querySelectorAll: () => [
        { value: "75", dataset: {option: "warmup-0"} }, {value: "135", dataset: {option:"restSeconds"}}
      ]
    })
  });
  api.saveExerciseOptions(options("Máquina 1"));
  assert.equal(ex.warmupSets[0].restSeconds,75);
  for (const [i,set] of ex.workingSets.entries()) {
    for (const [field,value] of [["weight","80"],["reps","10"]]) {
      api.updateInput({dataset:{exercise:0,set:i,field,series:"working"},value});
    }
    set.actualRir = "2";
    api.toggleSet(0,i);
    if (i === 0) assert.equal(api.getState().activeSession.timer.durationMs,135000);
  }
  api.finishSession();
  const recorded = api.getState().history[0].exercises[0];
  assert.equal(recorded.workingSets[0].variant, "Máquina 1");
  const fresh = api.createSession(a).exercises[0];
  fresh.variant = "Máquina 2";
  assert.equal(api.progression(fresh,"upper").kind,"none");
  assert.equal(api.suggestedWarmupWeight(fresh,fresh.warmupSets[0]),null);
  fresh.variant = "Máquina 1";
  assert.equal(api.progression(fresh,"upper").kind,"hold");
  assert.match(api.progression(fresh,"upper").text,/dos exposiciones/);
  assert.equal(api.suggestedWarmupWeight(fresh,fresh.warmupSets[0]),32);
  recorded.workingSets[0].actualRir = "0";
  assert.match(api.progression(fresh,"upper").text,/superó el RIR/);
  recorded.workingSets[0].variant = "Máquina 3";
  assert.equal(api.suggestedWarmupWeight(fresh,fresh.warmupSets[0]),null);
});
check("Búlgaras: cada pierna en sesión, exportación e historial editable", () => {
  const session = api.createSession(c);
  api.setState({...api.defaults(),activeSession:session});
  const set = session.exercises[2].workingSets[0];
  completeInput(set);
  api.toggleSet(2,0);
  assert.equal(set.completed,false);
  api.updateInput({dataset:{exercise:2,set:0,field:"repsRight",series:"working"},value:"10"});
  api.toggleSet(2,0);
  api.finishSession();
  const s = api.storage.import(api.storage.export(api.getState())).history[0];
  assert.match(api.renderHistoryExercise(s.exercises[2],2,false), /8 izq. \/ 10 der./);
  api.beginHistoryEdit(s.id);
  api.updateHistoryInput({dataset:{exercise:2,set:0,series:"working",historyField:"repsRight"},value:"11"});
  api.saveHistoryEdit(s.id);
  assert.equal(api.getState().history[0].exercises[2].workingSets[0].repsRight,"11");
});
check("V3: copia literal, 1.005 sesiones intactas y reanudación de Pierna B anterior", () => {
  const oldActive = api.createSession(day("pierna-b"));
  oldActive.exercises[0].workingSets[0].weight = "97.5";
  const old = {...api.defaults(), schemaVersion:3, activeSession:oldActive,
    history:Array.from({length:1005},(_,i)=>({...migrated.history[0],id:"old-"+i}))};
  old.settings.extra = "personalizado";
  const raw = JSON.stringify(old,null,1);
  saved.set("entreno.data",raw);
  const loaded = api.storage.load();
  api.setState(loaded);
  assert.equal(saved.get("entreno.data"),raw);
  assert.equal(JSON.stringify(loaded.history),JSON.stringify(old.history));
  assert.equal(JSON.stringify(loaded.activeSession),JSON.stringify(oldActive));
  assert.equal(loaded.settings.extra,"personalizado");
  assert.equal(api.storage.save(loaded),true);
  assert.equal(saved.get("entreno.backup.before-3p1"),raw);
  assert.equal(api.cycleState().next.id,a.id);
  completeInput(loaded.activeSession.exercises[0].warmupSets[0]);
  api.toggleWarmup(0,0);
  assert.equal(loaded.activeSession.timer.kind,"warmup");
  assert.equal(loaded.activeSession.exercises[0].name,"Peso muerto rumano");
  api.stopTimer(false);
  const before = saved.get("entreno.data");
  assert.equal(api.storage.save(api.storage.import(raw),true),true);
  assert.equal(saved.get("entreno.backup.before-import"),before);
  assert.equal(JSON.stringify(api.storage.load().history),JSON.stringify(old.history));
});
check("JSON ilegible y falta de espacio preservan el original", () => {
  saved.set("entreno.data","incompleto");
  api.storage.load();
  assert.equal(api.storage.save(api.defaults()),false);
  assert.equal(saved.get("entreno.data"),"incompleto");
  const raw = JSON.stringify(v2Data);
  saved.set("entreno.data",raw);
  saved.delete("entreno.backup.before-3p1");
  const migrated = api.storage.load();
  const save = context.localStorage.setItem;
  context.localStorage.setItem = () => { throw new Error("Sin espacio"); };
  assert.equal(api.storage.save(migrated),false);
  assert.equal(saved.get("entreno.data"),raw);
  context.localStorage.setItem = save;
});
const beforeImport = saved.get("entreno.data");
const oldJsonFile = new Blob([JSON.stringify(v2Data)], { type: "application/json" });
await api.importData(oldJsonFile);
check("Importar un archivo antiguo recupera la sesión y permite exportar otra vez", () => {
  assert.equal(api.getState().activeSession.id, v2Data.activeSession.id);
  assert.equal(api.getState().schemaVersion, 5);
  assert.equal(saved.get("entreno.backup.before-import.2"), beforeImport);
  const restored = api.storage.import(api.storage.export(api.getState()));
  assert.deepEqual(plain(restored), plain(api.getState()));
});
check("Pausa conserva borradores, posición, descanso y duración tras recarga", () => {
  api.setState(api.defaults());
  api.startDay(a.id);
  const active = api.getState().activeSession;
  completeInput(active.exercises[0].warmupSets[0]);
  api.toggleWarmup(0,0);
  api.updateInput({dataset:{exercise:0,set:1,series:"warmup",field:"weight"},value:"32.5"});
  const exercises = JSON.stringify(active.exercises);
  api.pauseSession();
  api.setState(api.storage.import(api.storage.export(api.storage.load())));
  const paused = api.getState().activeSession;
  assert.equal(api.sessionRoute(),"home");
  assert.equal(api.getState().history.length,0);
  assert.equal(api.cycleState().next.id,a.id);
  assert.equal(paused.timer.status,"paused");
  assert.equal(paused.timer.endTimestamp,null);
  const remaining = paused.timer.remainingMs;
  paused.pausedAt -= 3600000;
  api.resumeSession();
  const resumed = api.getState().activeSession;
  assert.equal(JSON.stringify(resumed.exercises), exercises);
  assert.deepEqual(plain(resumed.entryPosition),{exercise:0,set:1,series:"warmup"});
  assert.equal(resumed.id,active.id);
  assert.equal(resumed.timer.status,"running");
  assert.ok(Math.abs(resumed.timer.endTimestamp - Date.now() - remaining) < 1000);
  assert.ok(resumed.pausedMs >= 3600000);
  api.pauseTimer(); api.pauseSession(); api.resumeSession();
  assert.equal(api.getState().activeSession.timer.status,"paused");
  api.cancelActiveSession();
  assert.equal(api.getState().history.length,0);
});
check("Las parciales avanzan en los cuatro días, incluso al omitir ejercicios", () => {
  api.setState(api.defaults());
  for (const [i, day] of [a,b,c,d].entries()) {
    api.startDay(day.id);
    api.skipExercise(0);
    api.finishSession(); api.finishSession();
    const { history } = api.getState();
    assert.equal(history.length,i+1);
    assert.equal(history[0].result,"partial");
    assert.equal(api.completedSetCount(history[0]),0);
    assert.equal(history[0].exercises[0].status,"skipped");
    assert.match(api.renderHistorySession(history[0]),/PARCIAL/);
    api.setState(api.storage.load());
    assert.equal(api.cycleState().next.id,[b,c,d,a][i].id);
  }
});
check("Historial y copias inmutables ante reimportación, ID repetido y escritura fallida", () => {
  const initial = new Map([...saved].filter(([k])=>k.startsWith("entreno.backup.")));
  const existing = api.getState();
  assert.throws(()=>api.storage.import(JSON.stringify({...existing,history:[existing.history[0],...existing.history]})),/duplicados/);
  assert.throws(()=>api.storage.validate({...existing,activeSession:existing.history[0]}),/duplicados/);
  assert.equal(api.storage.save(api.defaults(),true),true);
  for (const [k,v] of initial) assert.equal(saved.get(k),v);
  assert.match(api.backupButtons(),/IMPORTACIÓN 2/);
  api.setState(api.storage.load()); api.startDay(a.id);
  const original = saved.get("entreno.data");
  const save = context.localStorage.setItem;
  context.localStorage.setItem = () => { throw new Error("Sin espacio"); };
  api.finishSession();
  assert.equal(api.getState().activeSession.dayId,a.id);
  assert.equal(api.getState().history.length,0);
  assert.equal(saved.get("entreno.data"),original);
  context.localStorage.setItem = save;
  api.setState(api.storage.load());
});
const hour = 3600000, sunday = Date.parse("2026-01-11T18:00:00Z");
function loggedSession(template, at, exerciseIndex) {
  const entry = api.createSession(template);
  entry.startedAt = new Date(at - hour).toISOString();
  entry.finishedAt = new Date(at).toISOString();
  if (exerciseIndex != null) {
    const set = entry.exercises[exerciseIndex].workingSets[0];
    Object.assign(set,{weight:"40",reps:"8",completed:true,completedAt:entry.finishedAt});
  }
  return entry;
}
check("D el domingo → A el lunes: fechas a 48–72 h, sin bloquear ni reiniciar el ciclo", () => {
  const recent = loggedSession(d,sunday,0);
  api.setState({...api.defaults(),history:[recent]});
  const before = JSON.stringify(api.getState());
  assert.equal(api.cycleState().next.id,a.id);
  const plan = api.recoveryPlan(a,sunday+24*hour);
  assert.equal(plan.overlap.at,sunday);
  assert.ok(plan.overlap.muscles.includes("hombros"));
  assert.match(api.planningText(a,sunday+24*hour),/Poco tiempo.*Press de hombro.*Press inclinado/);
  assert.match(api.planningText(a,sunday+48*hour),/En la ventana orientativa/);
  assert.equal(api.recoveryPlan(a,sunday+72*hour).overlap,null);
  assert.equal(JSON.stringify(api.getState()),before);
  api.startDay(a.id);
  assert.equal(api.getState().activeSession.dayId,a.id);
});
check("B → C identifica sentadilla/peso muerto; las series antiguas de una sesión pausada no rejuvenecen", () => {
  const leg = loggedSession(b,sunday,0);
  api.setState({...api.defaults(),history:[leg]});
  assert.match(api.planningText(c,sunday+hour),/Sentadilla libre con barra.*Peso muerto convencional.*glúteos/);
  leg.exercises[0].workingSets[0].completedAt = new Date(sunday-75*hour).toISOString();
  assert.equal(api.recoveryPlan(c,sunday+hour).overlap,null);
  delete leg.exercises[0].workingSets[0].completedAt;
  assert.equal(api.recoveryPlan(c,sunday+hour).overlap.at,sunday);
});
check("Solo cuentan efectivas coincidentes, no aproximaciones, pendientes, omitidos ni gemelos para C", () => {
  const leg = loggedSession(b,sunday,5);
  leg.exercises[0].warmupSets[0].completed = true;
  leg.exercises[0].workingSets[0].weight = "40";
  leg.exercises[1].workingSets[0].completed = true;
  leg.exercises[1].status = "skipped";
  api.setState({...api.defaults(),history:[leg]});
  assert.equal(api.recoveryPlan(c,sunday+hour).overlap,null);
  for (const day of [a,b,c,d]) for (const ex of day.exercises) assert.ok(api.musclesFor(ex.id).length,ex.name);
  assert.deepEqual(plain(api.musclesFor(d.exercises.at(-1).id,"Gemelos")),["gemelos"]);
  assert.deepEqual(plain(api.musclesFor(d.exercises.at(-1).id,"Abdominales")),["abdominales"]);
});
check("Cuatro semanas desde el inicio del 3+1; al omitir D sigue contando C y no cambia el historial", () => {
  const full = loggedSession(c,sunday,1);
  const old = loggedSession(day("push"),sunday-80*24*hour,0);
  api.setState({...api.defaults(),history:[full,old]});
  const history = JSON.stringify(api.getState().history);
  const start = Date.parse(full.startedAt);
  assert.equal(api.recoveryPlan(d,start+28*24*hour-1).intro,true);
  assert.equal(api.recoveryPlan(d,start+28*24*hour).intro,false);
  api.skipOptional();
  assert.equal(api.cycleState().next.id,a.id);
  assert.equal(api.recoveryPlan(a,sunday+hour).overlap.session,full.dayName);
  assert.equal(JSON.stringify(api.getState().history),history);
});
check("Una parcial sin solapamiento no oculta la última serie coincidente, incluso en un historial antiguo", () => {
  const last = loggedSession(b,sunday,5), prior = loggedSession(day("upper"),sunday-40*hour,0);
  api.setState({...api.defaults(),history:[last,prior]});
  assert.equal(api.recoveryPlan(c,sunday+hour).overlap.at,sunday-40*hour);
  assert.equal(api.cycleState().next.id,c.id);
});
// Solo lectura: los archivos opcionales se comparan en memoria y nunca se escriben.
verifyInsights(api,check,saved);
for (const [i, file] of process.argv.slice(2).entries()) {
  const raw = readFileSync(file, "utf8").replace(/^\uFEFF/,"");
  const original = JSON.parse(raw);
  check(`Exportación de prueba ${i+1}, V${original.schemaVersion}, ${original.history.length} sesiones`, () => {
    const imported = api.storage.import(raw);
    const roundtrip = api.storage.import(api.storage.export(imported));
    assert.deepEqual(plain(roundtrip), plain(imported));
    assert.equal(roundtrip.history.length,original.history.length);
    if (original.schemaVersion >= 3) assert.deepEqual(plain(roundtrip.history),original.history);
    for (const [j, session] of original.history.entries()) {
      const actual = roundtrip.history[j];
      for (const key of ["id","dayId","dayName","startedAt","finishedAt"]) assert.equal(actual[key],session[key]);
      assert.equal(actual.exercises.length,session.exercises.length);
      for (const [k, ex] of session.exercises.entries()) {
        const migratedEx = actual.exercises[k];
        assert.equal(migratedEx.id, ex.id);
        assert.equal(migratedEx.name, ex.name);
        const oldSets = ex.sets || ex.workingSets;
        assert.equal(migratedEx.workingSets.length,oldSets.length);
        for (const [n,set] of oldSets.entries()) {
          for (const key of Object.keys(set)) assert.deepEqual(plain(migratedEx.workingSets[n][key]), set[key]);
        }
      }
    }
    assert.equal(roundtrip.activeSession?.id,original.activeSession?.id);
  });
}
api.stopTimer(false);
assert.deepEqual(consoleErrors,[]);
console.log(results.join("\n"));
console.log(`\n${results.length} comprobaciones superadas.`);
