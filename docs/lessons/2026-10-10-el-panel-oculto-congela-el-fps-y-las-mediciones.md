---
date: 2026-10-10
spec: "009"
tags: [verificacion, navegador, rendimiento, fps]
---

# Lección: con el panel del navegador oculto, el fps que muestra el juego no vale

## Contexto

La verificación de la 009 en el navegador de escritorio de la app necesitaba medir los cuadros por segundo con la carga completa y el redibujo de edición. El indicador del juego mostraba «60 fps» en cada lectura.

## Qué pasó

El panel del navegador de la app alternaba entre `document.visibilityState === 'visible'` y `'hidden'`, y la ventana pasaba a `hasFocus() === false`. En ese estado `requestAnimationFrame` baja a uno o dos disparos por segundo, el bucle de Phaser casi no se ejecuta y el texto del indicador se queda con su último valor, en este caso el «60 fps» inicial. Una medición propia de `requestAnimationFrame` durante 2 s dio 1 o 2 por segundo en esos momentos y 121 por segundo cuando el panel estaba a la vista. Al final el fps con la carga completa quedó sin medir en escritorio y pasó a pendiente del teléfono.

## Qué hacer la próxima vez

- Antes de leer o anotar un fps, medir `requestAnimationFrame` durante 2 s en la página y mirar `document.visibilityState`. Si da menos de 30 por segundo o `hidden`, descartar la lectura del indicador.
- Pedir al usuario que traiga de vuelta el panel (Cmd+Shift+B) y, para las mediciones, tomar una captura justo antes del script: despierta el panel un momento, pero no lo garantiza durante varios segundos.
- Para el coste del redibujo de edición no depender de la pantalla: medir el tiempo síncrono del clic que dispara la acción, o leer el `regen` que el propio juego calcula con `performance.now()`.
- Anotar en `verification.md` qué mediciones no son válidas y por qué, y dejar el fps con la carga completa para el teléfono.

## Señales a vigilar

Un indicador de fps que dice siempre lo mismo (`60 fps`) aunque cambie la escena; `visibilityState: "hidden"` con el panel «mostrado» según `tabs_context`; verificaciones de animación que dependen de pasar muchos segundos con el juego en marcha.
