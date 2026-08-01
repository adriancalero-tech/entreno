# Entreno

Entreno es una aplicación web móvil, local y sin backend para registrar una rutina de hipertrofia de cinco días. Permite recuperar una sesión en curso, controlar descansos, consultar el historial, recibir sugerencias de doble progresión y exportar o importar todos los datos.

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

La rutina completa está centralizada al principio de `app.js` en `workoutProgram`. Para editar días, ejercicios, series, RIR o descansos, modifica exclusivamente esa estructura.

## Datos

Todos los datos se guardan únicamente en `localStorage` del navegador. No se usan analytics, cookies, servidores externos ni trackers. Desde Ajustes puedes exportar una copia JSON, restaurarla o borrar todos los datos.
