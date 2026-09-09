# Entreno

Entreno es una aplicación web móvil, local y sin backend para registrar una rutina de hipertrofia de cinco días. Permite recuperar una sesión en curso, controlar descansos, consultar y editar el historial, omitir ejercicios o aproximaciones, recibir sugerencias de doble progresión y exportar o importar todos los datos.

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

## Microciclo recomendado

La distribución es un microciclo flexible de ocho días: **Push → Pull → Pierna A → Descanso → Upper → Descanso → Pierna B → Descanso**. Es una recomendación informativa; la aplicación permite comenzar cualquier día cuando no hay otra sesión activa.

## Datos

Todos los datos se guardan únicamente en `localStorage` del navegador. No se usan analytics, cookies, servidores externos ni trackers. Desde Ajustes puedes exportar una copia JSON, restaurarla o borrar todos los datos.

El formato actual es `schemaVersion: 3`. Al cargar o importar una copia V1/V2, sus series existentes se migran a `workingSets` y se añade un array `warmupSets` vacío. Así se conserva el historial y una posible sesión activa sin inventar aproximaciones antiguas.
