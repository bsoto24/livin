---
date: 2026-10-11
spec: "011"
tags: [presentacion, android, iconos, cruceta, sdd-specify]
---

# Lección: un control que se mantiene pulsado no debe ser una imagen

## Contexto

La spec 1.0 de la 011 pedía dibujar las cuatro flechas de la cruceta de movimiento como iconos (imágenes) en lugar de los símbolos de texto ▲ ◀ ▶ ▼. Pasó la revisión, las pruebas y la verificación de escritorio.

## Qué pasó

En el teléfono Android, mantener pulsada una flecha para caminar de seguido hacía que el navegador la tratara como una imagen: selección y la opción de guardarla. Además la cruceta con marco resultaba más recargada que la anterior. Se revirtió a la cruceta de la 010 (spec 2.0.0, Fase 8): símbolos de texto, fondo semitransparente de la paleta, 19 iconos, y todas las imágenes de la interfaz pasaron a no ser seleccionables ni arrastrables y a pasar el toque a su contenedor. Ni el escritorio ni las pruebas automáticas podían ver el problema: el gesto de pulsación larga solo existe en el teléfono.

## Qué hacer la próxima vez

- En una spec que cambie un control que se mantiene pulsado (cruceta, botones de repetir), preguntar qué hace la pulsación larga y no convertirlo en imagen; usar texto o un elemento con `user-select: none`.
- Si se usan imágenes en la interfaz, bloquear desde el principio la selección, el arrastre y el menú de guardar (`pointer-events: none` o `user-select: none` y `-webkit-touch-callout: none`), no solo en los controles táctiles.
- Probar los gestos (pulsación larga, deslizar) en el teléfono antes de dar por buena una feature de aspecto que toque controles táctiles.

## Señales a vigilar

Un icono dibujado como `<img>` dentro de un botón que el usuario mantiene pulsado; una spec que sustituye símbolos de texto de un control táctil por imágenes sin criterios sobre la pulsación larga.
