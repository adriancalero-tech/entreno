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
- `insights.js`: fechas civiles de Madrid, relación plan/registro, métricas y reglas deterministas de progresión.
- `views.js`: agenda, evolución, recuperación y aceptación explícita de sugerencias. Las gráficas son SVG nativos; no se carga nada de una CDN.

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

Cada serie conserva la variante con la que empezaste a registrarla. Usa el mismo nombre para el mismo equipo, por ejemplo «Máquina 2», y el mismo criterio de peso para las mancuernas. «Máquina» o «Polea» sin identificar no generan comparaciones. Una sesión con variantes mezcladas puede aportar sus series identificadas a la gráfica de cada variante, pero no da derecho a subir de peso. Las búlgaras registran repeticiones de cada pierna.

## Agenda y recuperación

La agenda semanal/mensual usa fechas civiles de Madrid, semanas desde el lunes y un plan por fecha. Sugiere el siguiente día del ciclo teniendo en cuenta lo realizado y los planes pendientes anteriores. Si eliges otro orden, avisa; nunca inicia una sesión ni convierte un plan en historial. Los días sin datos no son descansos registrados. Un descanso se planifica expresamente. Los avisos de agenda comparan fechas sin hora con trabajo coincidente (real o previsto) a hasta dos días de distancia; no equivalen a 48 horas exactas. En la portada se mantienen las ventanas orientativas desde la hora del estímulo real.

Una sesión se asigna a la fecha madrileña de inicio (fin solo si falta inicio). Para el cumplimiento se emparejan fecha y entrenamiento exactos, una sola vez. Los planes ya realizados se conservan. Puedes mover un plan pendiente, incluso vencido, a una fecha libre sin cambiar ninguna sesión. El porcentaje describe la agenda **vigente**: no hay un registro de todas sus revisiones. La exportación ICS incluye entrenamientos previstos desde hoy como eventos de día completo, con identificadores estables; es una copia, no sincronización con cuentas.

La ficha diaria opcional registra energía, fatiga, agujetas, molestia muscular/articular, percepción en la pierna izquierda y una nota. Puede editarse desde la portada o la sesión. Los registros anteriores se consultan en Evolución; un día sin registro nunca se interpreta como buena recuperación. No se hacen diagnósticos.

## Cómo leer Evolución

- Periodos de 4/8/12 semanas móviles, incluido hoy en Madrid, o todo el historial. La comparación usa el periodo inmediatamente anterior de igual número de días. Frecuencia = entrenos con al menos una efectiva × 7 / días del periodo. Los recuentos semanales y mensuales son los registrados dentro del filtro, incluso en semanas o meses incompletos.
- Una efectiva marcada cuenta para frecuencia/series aunque no pueda usarse como dato de fuerza. No cuentan aproximaciones, pendientes ni ejercicios omitidos. La duración media resta pausas y solo incluye tiempos positivos de hasta seis horas para evitar cronómetros olvidados. Un plan vencido solo se considera cumplido con sesión completa del mismo tipo y fecha; las parciales se desglosan. Se excluyen descansos, fechas futuras y el día actual si aún no se ha cerrado sesión.
- Volumen muscular = series por grupo **principal**, no tonelaje global: presses de pecho/aperturas/fondos → pectorales; tirones/remos → espalda; presses de hombro/laterales/reverse → hombros; curls y extensiones de brazos → bíceps y tríceps; sentadillas, prensa y extensiones → cuádriceps; peso muerto y curl femoral → cadena posterior. Gemelos, abdominales y aductores se separan; sin identificación suficiente, «sin clasificar». El mapa de solapamiento de recuperación sí incluye músculos secundarios.
- Por ejercicio **y variante exacta**: carga máxima, mejores repeticiones a la carga de referencia (la más alta de la última exposición del periodo), detalle de series, y volumen registrado = kg anotados × reps. En unilaterales con ambos lados registrados se suman las reps para volumen y se usa el lado de menos reps para rendimiento. No se duplican por defecto los kg de mancuernas. Una sesión parcial puede tener menos volumen sin que haya caído la fuerza.
- La mejor serie se ordena por carga y después por reps. Los récords históricos se separan del mejor resultado del periodo. La 1RM **estimada** usa Epley, kg × (1 + reps / 30), solo en los básicos bilaterales con barra libre identificada, 2–10 reps y RIR anotado 0–2. No es una medición ni una carga prescrita. No se interpolan puntos ni se inventan pesos, RIR o repeticiones ausentes.

## Motor de sugerencias

Solo usa efectivas del mismo ejercicio y equipo. Primero muestra el resultado anterior y cuánto ha pasado. Con trabajo incompleto o tras más de 21 días, ofrece una referencia sin subida. A carga uniforme se prioriza una repetición adicional en una serie dentro del rango. Si bajan las reps totales a igual carga o el RIR es inferior al objetivo, propone mantener. Para proponer una subida hacen falta dos exposiciones completas en fechas distintas y próximas, con la misma prescripción y carga, todas las series en el máximo y RIR registrado compatible. Se pide valorar la técnica; el sistema no la mide.

El salto base parte de los ajustes de tren superior/inferior: máximo predeterminado de 1 kg en aislamientos, 2,5 kg en multiarticulares y 5 kg en básicos inferiores con barra. Puedes indicar el salto real por ejercicio y equipo. Si supera el 5 % se mantiene la referencia. La fatiga elevada, poca energía, agujetas intensas o molestias frenan la subida; la percepción izquierda de fatiga se aplica en tren inferior. Ante molestias articulares no se propone una carga. No se sustituye ningún ejercicio.

Aceptar una propuesta copia **solo el peso** en la siguiente efectiva totalmente vacía. Puedes editarlo, ignorarlo o introducir el tuyo. Nunca se marcan reps, RIR ni series como realizados al aceptar.

## Datos

Todos los datos se guardan únicamente en `localStorage` del navegador. No se usan analytics, cookies, servidores externos ni trackers. Desde Ajustes puedes exportar una copia JSON, restaurarla o borrar todos los datos.

El formato actual es `schemaVersion: 5`. Mantiene `entreno.data` y añade dos colecciones independientes (`plans` y `wellness`) y ajustes opcionales de equipo. La lectura no escribe. Antes de la primera escritura sobre V1–V4 se conserva el texto original. Para V1–V3 se reutiliza la copia previa al 3+1 si ya contiene exactamente ese texto; en los demás casos se guarda en `entreno.backup.before-adaptive` (numerado si ya existe otro). Se mantienen las copias anteriores a 3+1 y todas las de importación. Cada importación confirmada respalda el estado previo sin sobrescribir copias diferentes. Desde Ajustes se pueden descargar. Si no hay espacio, el original no se reemplaza.

La importación acepta V1–V5. V1/V2 migran sus series a efectivas. V3/V4 mantienen los registros históricos y las sesiones activas; no se rellenan variantes, RIR, sensaciones ni fechas previstas. Las plantillas antiguas siguen disponibles para terminar una sesión activa. Solo los días 3+1 participan en el ciclo. Una exportación nueva es V5; una instalación antigua no puede leer las nuevas colecciones.

Las pruebas de datos y del ciclo se ejecutan con `node verify-v3.mjs`. Aceptan también rutas de copias JSON para comprobar la migración en memoria. Las pruebas de interfaz se ejecutan con `node verify-browser.mjs chrome msedge` usando Playwright Core y los navegadores locales. La variable opcional `PLAYWRIGHT_ENTRY` permite usar una instalación externa del módulo. Cada escenario utiliza un perfil temporal y archivos de entrenamiento sintéticos.
