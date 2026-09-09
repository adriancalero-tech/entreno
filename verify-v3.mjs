import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFileSync } from "node:fs";
import vm from "node:vm";

class FakeElement {
  constructor() {
    this.innerHTML = "";
    this.textContent = "";
    this.open = false;
    this.files = [];
    this.value = "";
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  addEventListener() {}
  append() {}
  replaceChildren() {}
  querySelectorAll() { return []; }
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

let source = readFileSync(new URL("./app.js", import.meta.url), "utf8");
source = source.replace(/\nrender\(\);\s*$/, "");
source += `
globalThis.api = {
  workoutProgram, defaults, storage, normalizeSession, createSession, progression,
  completedSetCount, totalSetCount, programWarmups, renderHistoryExercise, renderExercise, suggestedWarmupWeight,
  toggleWarmup, skipWarmup, recoverWarmup, toggleSet, skipExercise, recoverExercise,
  selectWarmupVariant, updateInput, beginHistoryEdit, updateHistoryInput, saveHistoryEdit, stopTimer,
  getState: () => state,
  getHistoryDraft: () => historyDraft,
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

check("1. Usuario nuevo creado con schemaVersion 3", () => assert.equal(api.defaults().schemaVersion, 3));

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
  assert.equal(migrated.schemaVersion, 3);
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
  assert.match(progressionBefore, /Posible subida/);
  assert.equal(api.progression(exercise("press-inclinado"), "upper"), progressionBefore);
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
api.getState().history = [progressionSession];
const latestHtml = api.renderExercise(sessionForLatest.exercises[0], 0, day("push"));
check("18. Última sesión usa las efectivas como referencia principal", () => {
  assert.match(latestHtml, /Última vez · efectivas/);
  assert.match(latestHtml, /100 kg/);
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

api.stopTimer(false);
console.log(results.join("\n"));
console.log(`\n${results.length} comprobaciones V3 superadas.`);
