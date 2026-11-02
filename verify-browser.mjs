// Pruebas de interfaz en perfiles efímeros. Requiere playwright-core y un navegador instalado.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const entry = process.env.PLAYWRIGHT_ENTRY;
const { chromium } = await import(entry ? pathToFileURL(entry).href : "playwright-core");
const files = new Map([["/", ["index.html","text/html"]], ["/app.js", ["app.js","text/javascript"]], ["/styles.css", ["styles.css","text/css"]]]);
for (const file of ["insights.js","views.js"]) files.set("/"+file,[file,"text/javascript"]);
const server = createServer(async (req, res) => {
  const file = files.get(req.url.split("?")[0]);
  if (!file) { res.writeHead(req.url === "/favicon.ico" ? 204 : 404); res.end(); return; }
  try {
    const bytes = await readFile(new URL(file[0], import.meta.url));
    res.writeHead(200, {"Content-Type":file[1]+"; charset=utf-8"}); res.end(bytes);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((resolve,reject) => server.once("error",reject).listen(0,"127.0.0.1",resolve));
const origin = "http://127.0.0.1:" + server.address().port;

async function scenario(browser, width, height) {
  const mobile = width < 600;
  const context = await browser.newContext({viewport:{width,height}, isMobile:mobile, hasTouch:mobile, deviceScaleFactor:mobile ? 3 : 1});
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    page.on("console", msg => { if (["error","warning"].includes(msg.type())) errors.push(msg.text()); });
    // Observa Web Audio real; el vibrador físico no es medible en emulación.
    await page.addInitScript(() => {
      window.signals = {tones:0, vibrations:0};
      const start = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function(...args) {
        window.signals.tones++;
        return start.apply(this,args);
      };
      Object.defineProperty(navigator,"vibrate",{value:()=>{window.signals.vibrations++;return true;}});
    });
    await page.goto(origin);
    const state = () => page.evaluate(()=>JSON.parse(localStorage.getItem("entreno.data")));
    const press = async label => {
      const control = page.getByRole("button",{name:label,exact:true});
      if (mobile) await control.tap(); else await control.click();
    };
    const noOverflow = async () => assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
    await noOverflow();
    await press("Ajustes");
    await page.locator('[data-setting="sound"]').check();
    await press("Entreno");
    await press("VER ENTRENAMIENTO A");
    await press("COMENZAR ENTRENAMIENTO");
    const ex = page.locator(".exercise-card").first();
    await ex.locator(".exercise-options > summary").click();
    await ex.locator('[data-option="variant"]').fill("Máquina QA");
    await press("APLICAR A ESTA SESIÓN");
    const warmup = ex.locator(".warmup-set").first();
    await warmup.locator('[data-field="weight"]').fill("20");
    await warmup.locator('[data-field="reps"]').fill("8");
    await warmup.locator('[data-action="toggle-warmup"]').click();
    assert.equal((await state()).activeSession.timer.kind,"warmup");
    const id = (await state()).activeSession.id;
    await noOverflow();
    await press("PAUSAR ENTRENAMIENTO");
    const paused = (await state()).activeSession;
    await page.reload();
    assert.equal((await state()).activeSession.timer.remainingMs,paused.timer.remainingMs);
    await press("REANUDAR SESIÓN");
    assert.equal((await state()).activeSession.id,id);
    assert.equal((await state()).activeSession.timer.status,"running");
    await press("PAUSAR");
    await press("REANUDAR");
    await press("OMITIR");
    await ex.locator(".exercise-options > summary").click();
    await ex.locator('[data-option="restSeconds"]').fill("2");
    await press("APLICAR A ESTA SESIÓN");
    const working = ex.locator(".set-card").first();
    await working.locator('[data-field="weight"]').fill("42.5");
    await working.locator('[data-field="reps"]').fill("9");
    await working.locator('[data-action="set-rir"][data-value="2"]').click();
    await working.locator('[data-action="toggle-set"]').click();
    await press("Historial");
    await page.waitForFunction(()=>window.signals.tones === 3 && window.signals.vibrations === 1);
    assert.equal((await state()).activeSession.timer.status,"finished");
    await press("Entreno"); await press("REANUDAR SESIÓN"); await press("OMITIR");
    await press("FINALIZAR ENTRENAMIENTO"); await press("GUARDAR PARCIAL");
    assert.ok(await page.getByRole("button",{name:"VER ENTRENAMIENTO B"}).isVisible());
    await press("Historial");
    await page.locator(".history-item > summary").click();
    assert.ok(await page.getByText(/PARCIAL ·/).isVisible());
    assert.match(await page.locator(".history-exercise").first().innerText(),/42.5 kg × 9.*Máquina QA.*real 2/);
    await press("Ajustes");
    const download = page.waitForEvent("download");
    await press("EXPORTAR DATOS");
    const bytes = await readFile(await (await download).path());
    const exported = JSON.parse(bytes);
    assert.deepEqual(exported,await state());
    await page.locator("#import-input").setInputFiles({name:"copia.json",mimeType:"application/json",buffer:bytes});
    await press("IMPORTAR");
    assert.deepEqual(await state(),exported);
    await press("Entreno"); await press("VER ENTRENAMIENTO B");
    await page.locator('[data-setting="thirdSquatSet"]').check();
    await press("COMENZAR ENTRENAMIENTO");
    assert.equal((await state()).activeSession.exercises[0].workingSets.length,3);
    await press("CANCELAR ENTRENAMIENTO");
    await page.locator("#modal").getByRole("button",{name:"CANCELAR ENTRENAMIENTO"}).click();
    await page.getByRole("button",{name:"VER ENTRENAMIENTO B"}).waitFor();
    assert.equal((await state()).history.length,1);
    assert.equal((await state()).activeSession,null);
    assert.deepEqual(errors,[]);
  } finally { await context.close(); }
}

async function planningScenario(browser, width, height) {
  const mobile = width < 600;
  const context = await browser.newContext({viewport:{width,height}, isMobile:mobile, hasTouch:mobile, timezoneId:"Europe/Madrid"});
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (["warning","error"].includes(m.type())) errors.push(m.text()); });
    const press = async name => {
      const button = page.getByRole("button",{name,exact:true});
      if (mobile) await button.tap(); else await button.click();
    };
    const open = async letter => { await press("VER ENTRENAMIENTO "+letter); await press("COMENZAR ENTRENAMIENTO"); };
    const logSet = async index => {
      const set = page.locator(".exercise-card").nth(index).locator(".set-card").first();
      const card = page.locator(".exercise-card").nth(index);
      if (!(await card.evaluate(el=>el.open))) await card.locator(".exercise-summary").click();
      await set.locator('[data-field="weight"]').fill("40");
      await set.locator('[data-field="reps"]').fill("8");
      await set.locator('[data-action="toggle-set"]').click();
      await press("OMITIR");
    };
    const finish = async () => { await press("FINALIZAR ENTRENAMIENTO"); await press("GUARDAR PARCIAL"); };
    const plan = page.locator("[data-plan-for]");
    const when = async iso => page.clock.setFixedTime(new Date(iso+"T18:00:00Z"));
    await when("2026-01-05"); await page.goto(origin);
    assert.match(await plan.innerText(),/Primeras 4 semanas/);
    await open("A"); await logSet(0); await finish();
    await when("2026-01-07"); await open("B"); await logSet(0); await finish();
    assert.match(await plan.innerText(),/Poco tiempo/);
    assert.match(await plan.innerText(),/Sentadilla libre con barra.*Peso muerto convencional/s);
    await when("2026-01-09"); await page.reload();
    assert.match(await plan.innerText(),/En la ventana orientativa/);
    await open("C"); await logSet(1); await finish();
    const afterC = await page.evaluate(()=>localStorage.getItem("entreno.data"));
    await press("OMITIR D Y PASAR A A"); await page.reload();
    assert.equal(await plan.getAttribute("data-plan-for"),"3p1-a");
    assert.match(await plan.innerText(),/C — Full Body.*Press plano/s);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem("entreno.data")).history),JSON.parse(afterC).history);
    // Segunda elección tras C sobre una copia del mismo escenario efímero.
    await page.evaluate(raw=>localStorage.setItem("entreno.data",raw),afterC);
    await when("2026-01-11"); await page.reload();
    await open("D"); await logSet(0); await finish();
    await when("2026-01-12"); await page.reload();
    assert.match(await page.locator(".cycle h2").innerText(),/Siguiente en la secuencia · A/);
    assert.match(await plan.innerText(),/Poco tiempo.*D — Complementario.*Press de hombro.*13 ene.*19:00.*14 ene.*19:00/s);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
    await press("VER ENTRENAMIENTO A");
    assert.match(await plan.innerText(),/Poco tiempo/);
    await press("COMENZAR ENTRENAMIENTO");
    const state = await page.evaluate(()=>JSON.parse(localStorage.getItem("entreno.data")));
    assert.equal(state.activeSession.dayId,"3p1-a");
    assert.equal(state.history.length,4);
    assert.deepEqual(errors,[]);
  } finally { await context.close(); }
}

async function adaptiveScenario(browser,width,height) {
  const mobile=width<600, context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile,timezoneId:"America/New_York"});
  try {
    const page=await context.newPage(); page.setDefaultTimeout(6000);
    const errors=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if (["error","warning"].includes(m.type())) errors.push(m.text());});
    await page.clock.setFixedTime(new Date("2026-10-23T22:30:00Z")); // Ya es sábado 24 en Madrid.
    const press=async name=>{const btn=page.getByRole("button",{name,exact:true});if(mobile) await btn.tap();else await btn.click();};
    const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem("entreno.data")));
    const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const history=["22","20","15"].map((d,i)=>({id:"seed-"+d,dayId:i?"3p1-a":"3p1-d",dayName:i?"A — Torso completo":"D — Complementario",startedAt:"2026-10-"+d+"T09:00:00Z",finishedAt:"2026-10-"+d+"T10:00:00Z",exercises:i?[{id:"3p1-inclinado",name:"Press inclinado",variant:"Barra",status:"completed",warmupSets:[],workingSets:Array.from({length:3},(_,j)=>({number:j+1,minReps:6,maxReps:10,targetRir:"2",actualRir:"2",completed:true,weight:"60",reps:"10",variant:"Barra"}))}]:[]}));
    const seed=JSON.stringify({schemaVersion:4,settings:{sound:false,vibration:false,upperIncrement:2.5,lowerIncrement:5},activeSession:null,history});
    await page.goto(origin);await press("Evolución");await noOverflow();
    assert.match(await page.locator("main").innerText(),/No hay series comparables/);
    assert.equal(await page.locator("[data-feature=variant]").inputValue(),"");
    await page.evaluate(s=>localStorage.setItem("entreno.data",s),seed);await page.reload();
    await press("Agenda");await noOverflow();
    await page.locator('[data-feature="cal-view"]').selectOption("week");
    assert.match(await page.locator(".cal-day.selected").getAttribute("aria-label"),/^2026-10-24/);
    await page.locator("[data-agenda-date]").fill("2026-10-26");await press("Planificar");
    assert.deepEqual((await state()).history,history);
    assert.equal(await page.evaluate(()=>localStorage.getItem("entreno.backup.before-adaptive")),seed);
    assert.equal((await state()).plans[0].date,"2026-10-26");
    await page.locator("[data-agenda-date]").fill("2026-10-27");await press("Guardar cambios del plan");
    const download=page.waitForEvent("download");await press("Exportar próximos entrenamientos (.ics)");
    assert.match(await readFile(await (await download).path(),"utf8"),/DTSTART;VALUE=DATE:20261027/);
    await page.locator('[data-action="pick-date"][data-date="2026-10-28"]').click();
    await page.locator("[data-agenda-kind]").selectOption("3p1-b");await press("Planificar");
    await page.locator('[data-action="pick-date"][data-date="2026-10-29"]').click();
    await page.locator("[data-agenda-kind]").selectOption("3p1-c");assert.match(await page.locator("[data-agenda-advice]").innerText(),/plan B/);
    await press("Planificar");await press("Eliminar solo el plan");await press("ELIMINAR PLAN");
    assert.equal((await state()).plans.length,2);assert.deepEqual((await state()).history,history);
    await press("Evolución");await noOverflow();
    await page.locator('[data-feature="weeks"]').selectOption("all");
    await page.locator('[data-feature="metric"]').selectOption("estimate");
    assert.match(await page.locator("main").innerText(),/Récord de carga.*60 kg/);
    assert.equal(await page.locator("svg").last().locator("circle").count(),2);
    await press("Entreno");await press("VER ENTRENAMIENTO A");await press("COMENZAR ENTRENAMIENTO");
    const ex=page.locator(".exercise-card").first();
    await ex.locator(".exercise-options > summary").click();await ex.locator('[data-option="variant"]').fill("Barra");await press("APLICAR A ESTA SESIÓN");
    assert.equal((await state()).activeSession.exercises[0].workingSets[0].weight,"");
    await page.locator(".compact > summary").click();await page.locator('[data-well="pain"]').selectOption("Articular");
    await page.locator('[data-well="left"]').selectOption("Fatiga alta");await page.locator('[data-well="note"]').fill("Registro de prueba");
    await press("Guardar recuperación");
    assert.match(await ex.locator(".progress-note").innerText(),/molestia articular/);
    assert.equal(await ex.locator('[data-action="accept-load"]').count(),0);
    await page.locator(".compact > summary").click();await page.locator('[data-well="pain"]').selectOption("Ninguna");await press("Guardar recuperación");
    await ex.locator('[data-action="accept-load"]').click();
    const working=ex.locator(".set-card").first();
    assert.equal(await working.locator('[data-field="weight"]').inputValue(),"62.5");
    assert.equal((await state()).activeSession.exercises[0].workingSets[0].completed,false);
    await working.locator('[data-field="weight"]').fill("61");await press("PAUSAR ENTRENAMIENTO");await page.reload();
    const persisted=await state();assert.deepEqual(persisted.history,history);assert.equal(persisted.wellness[0].date,"2026-10-24");
    assert.equal(persisted.activeSession.exercises[0].workingSets[0].weight,"61");
    await press("REANUDAR SESIÓN");await press("CANCELAR ENTRENAMIENTO");
    await page.locator("#modal").getByRole("button",{name:"CANCELAR ENTRENAMIENTO"}).click();
    assert.deepEqual((await state()).history,history);
    await press("Ajustes");
    const exportEvent=page.waitForEvent("download"); await press("EXPORTAR DATOS");
    const bytes=await readFile(await (await exportEvent).path()), exported=JSON.parse(bytes);
    assert.equal(exported.schemaVersion,5);assert.equal(exported.plans.length,2);assert.deepEqual(exported.wellness,persisted.wellness);
    await page.locator("#import-input").setInputFiles({name:"local-v5.json",mimeType:"application/json",buffer:bytes});
    await press("IMPORTAR");assert.deepEqual(await state(),exported);
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
}

try {
  const onlyPlanning = process.argv.includes("--planning-only");
  const channels = process.argv.slice(2).filter(arg => arg !== "--planning-only");
  for (const channel of channels.length ? channels : ["chrome","msedge"]) {
    const browser = await chromium.launch({ channel, headless:true, chromiumSandbox:true });
    try {
      for (const [width,height] of [[1280,800],[375,812],[390,844],[430,932]]) {
        if (!onlyPlanning) await scenario(browser,width,height);
        await planningScenario(browser,width,height);
        if (!onlyPlanning) await adaptiveScenario(browser,width,height);
        console.log(`✓ ${channel} ${browser.version()}, ${width}×${height} · ${onlyPlanning ? "planificación" : "sesión, ciclo y experiencia adaptativa"}`);
      }
    } finally { await browser.close(); }
  }
} finally { server.close(); }
