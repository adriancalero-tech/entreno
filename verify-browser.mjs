// Pruebas de interfaz en perfiles efímeros. Requiere playwright-core y un navegador instalado.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const entry = process.env.PLAYWRIGHT_ENTRY;
const { chromium } = await import(entry ? pathToFileURL(entry).href : "playwright-core");
const files = new Map([["/", ["index.html","text/html"]], ["/app.js", ["app.js","text/javascript"]], ["/styles.css", ["styles.css","text/css"]]]);
const server = createServer(async (req, res) => {
  const file = files.get(req.url);
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

try {
  const onlyPlanning = process.argv.includes("--planning-only");
  const channels = process.argv.slice(2).filter(arg => arg !== "--planning-only");
  for (const channel of channels.length ? channels : ["chrome","msedge"]) {
    const browser = await chromium.launch({ channel, headless:true, chromiumSandbox:true });
    try {
      for (const [width,height] of [[1280,800],[375,812],[390,844],[430,932]]) {
        if (!onlyPlanning) await scenario(browser,width,height);
        await planningScenario(browser,width,height);
        console.log(`✓ ${channel} ${browser.version()}, ${width}×${height} · ${onlyPlanning ? "planificación" : "sesiones y planificación"}`);
      }
    } finally { await browser.close(); }
  }
} finally { server.close(); }
