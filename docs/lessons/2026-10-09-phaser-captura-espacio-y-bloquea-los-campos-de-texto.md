---
date: 2026-10-09
spec: "007"
tags: [phaser, teclado, escritorio, formularios]
---

# Lesson: `createCursorKeys()` de Phaser captura Espacio y Mayúsculas en toda la ventana

## Context

Feature 007 (menú por secciones y formularios simples). El usuario avisó de que en el navegador de escritorio los campos de nombre no aceptaban espacios, mientras que en Android sí.

## What happened

La escena llamaba a `this.input.keyboard.createCursorKeys()` para leer las flechas. Ese método registra también las teclas Espacio y Mayúsculas y las **captura** (hace `preventDefault()` del `keydown` en toda la ventana), de modo que el carácter nunca llegaba al `<input>`. En Android el teclado virtual no emite ese evento, por eso allí no se notaba y la 001 a la 006 pasaron sus verificaciones en el teléfono sin ver el error. La causa se confirmó leyendo el código antes de proponer el arreglo; después se comprobó en el navegador con Espacio real en cinco campos de nombre.

## What to do next time

Para leer solo las flechas, usar `addKeys({ up: UP, down: DOWN, left: LEFT, right: RIGHT }, false)` (sin captura global) en lugar de `createCursorKeys()`. Si la pantalla tiene campos de texto en el mismo documento que el lienzo, no capturar globalmente ninguna tecla de escritura. Como no se puede probar sin navegador (las reglas del proyecto prohíben pruebas con DOM o Phaser), dejar un paso manual concreto en `verification.md`: escribir «Lavar platos» con Espacio real en cada campo de nombre, en Chrome de escritorio.

## Signals to watch for

«Funciona en el teléfono pero no en escritorio» con teclado; un campo de texto al que le faltan solo ciertos caracteres; cualquier `createCursorKeys`, `addCapture` o `preventDefault` global en la capa de presentación.
