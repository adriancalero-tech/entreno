# Entreno

Entreno es una aplicación web local para registrar un ciclo flexible de tres entrenamientos principales y un cuarto opcional.

## Ejecutar localmente

Los archivos son estáticos. Puedes servir la carpeta con cualquier servidor HTTP; por ejemplo, si tienes Python:

```bash
python -m http.server 8000
```

Después abre `http://localhost:8000`. También puede abrirse `index.html` directamente, aunque un servidor local reproduce mejor el entorno de GitHub Pages.

## Publicación en GitHub Pages

En GitHub abre **Settings → Pages**, elige **Deploy from a branch**, selecciona la rama `main`, la carpeta `/root` y guarda. No hay proceso de compilación ni service worker.

## Estructura

- `index.html`: estructura semántica y contenedores de la aplicación.
- `styles.css`: diseño móvil, modo oscuro, safe areas y estados visuales.
- `app.js`: programa de entrenamiento, estado, persistencia, temporizador, progresión y renderizado.

## Rutina

La rutina completa está centralizada al principio de `app.js` en `workoutProgram`. Cada ejercicio diferencia formalmente:

- `warmupSets`: series de aproximación con carga orientativa, repeticiones y descanso propios. Se registran, pero no cuentan como volumen efectivo ni intervienen en la doble progresión.
- `workingSets`: series efectivas con rango de repeticiones y RIR objetivo. Son las únicas que cuentan en el resumen de la sesión y en las recomendaciones de carga.

Para cambiar aproximaciones o series efectivas, edita sus arrays correspondientes dentro de `workoutProgram`; los descansos entre series y entre ejercicios siguen en `restSeconds` y `transitionRestSeconds`.

## Ciclo 3+1

La portada indica la siguiente sesión según el historial. A (torso, 16 efectivas), B (pierna, 12) y C (full body, 13) van en orden. Tras C puedes hacer D (complementario, 12) u omitirlo para volver a A. Puedes consultar todas las plantillas. Los días transcurridos entre entrenamientos son libres.

**La siguiente sesión no es una cita.** Durante las cuatro primeras semanas desde la primera sesión registrada del 3+1, la recomendación es hacer solo A, B y C. D sigue disponible si hay recuperación suficiente. No hay reinicio los lunes. La portada y la ficha comparan los músculos de la sesión prevista con las series efectivas realizadas recientemente, incluso en sesiones parciales. Por ejemplo, tras la sentadilla de B se considera el solapamiento con el peso muerto de C; tras el press de hombro de D se considera el de A. La referencia de 48–72 horas se muestra con fechas locales desde la última serie coincidente (o desde el final de la sesión si no hay hora de la serie). Es orientativa y nunca deshabilita el inicio. Las aproximaciones, los ejercicios omitidos y las series pendientes no cuentan para este aviso.

- **Finalizar** guarda el entrenamiento y avanza al siguiente. Una sesión con todas las efectivas realizadas figura como completa. Si quedan series pendientes o ejercicios omitidos, la confirmación muestra el recuento y se guarda como parcial. Las aproximaciones llevan un registro independiente.
- **Pausar entrenamiento** guarda la sesión activa, las entradas y el tiempo restante del descanso. Puedes cerrar la app y reanudar desde la portada. El tiempo en pausa se descuenta de la duración. Si el descanso ya estaba pausado manualmente, sigue así al volver.
- **Cancelar** pide confirmación y descarta la sesión activa. El historial y la posición del ciclo se conservan. La decisión de omitir D también se guarda por separado del historial.

En la ficha de B puedes activar la tercera serie de sentadilla para las próximas sesiones. En cada ejercicio, **Variante y descansos** permite identificar el equipo y ajustar los descansos de esa sesión, incluidos los de aproximación. El temporizador arranca en el límite inferior de los rangos y la transición tiene inicialmente el mismo valor que el descanso entre series.

Cada serie conserva la variante con la que empezaste a registrarla. Usa el mismo nombre para el mismo equipo. La referencia histórica compara ejercicios con el mismo identificador y variante y descarta sesiones con cargas de variantes mezcladas o sin identificar. Las cargas se introducen manualmente. Las búlgaras registran las repeticiones efectivas de cada pierna.

## Datos

Todos los datos se guardan únicamente en `localStorage` del navegador. No se usan analytics, cookies, servidores externos ni trackers. Desde Ajustes puedes exportar una copia JSON, restaurarla o borrar todos los datos.

El formato actual es `schemaVersion: 4`. Al abrir la actualización se lee el mismo `entreno.data`. Antes de la primera escritura sobre datos V1–V3 se guarda su texto original en `entreno.backup.before-3p1`. Las importaciones confirmadas guardan el estado local previo en `entreno.backup.before-import` o en una copia numerada. Se reutiliza una copia si su contenido ya es idéntico. Desde Ajustes puedes descargar cada copia y restaurarla con **Importar datos**. Si el respaldo o la escritura falla, la aplicación protege el original y ofrece la recuperación.

La importación acepta V1–V4. Las sesiones V1/V2 conservan sus series como efectivas. Las sesiones V3 conservan sus registros y sus nombres, incluida cualquier sesión activa. Las plantillas antiguas siguen disponibles internamente para terminar esa sesión. Solo los nuevos identificadores de día participan en el ciclo.

Las pruebas de datos y del ciclo se ejecutan con `node verify-v3.mjs`. Aceptan también rutas de copias JSON para comprobar la migración en memoria. Las pruebas de interfaz se ejecutan con `node verify-browser.mjs chrome msedge` usando Playwright Core y los navegadores locales. La variable opcional `PLAYWRIGHT_ENTRY` permite usar una instalación externa del módulo. Cada escenario utiliza un perfil temporal y archivos de entrenamiento sintéticos.
