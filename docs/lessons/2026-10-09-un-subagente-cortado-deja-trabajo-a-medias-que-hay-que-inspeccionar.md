---
date: 2026-10-09
spec: "007"
tags: [sdd-execute, subagentes, proceso]
---

# Lesson: un subagente cortado a mitad de trabajo deja efectos que hay que inspeccionar antes de relanzarlo

## Context

Feature 007, ronda 1 de correcciones tras `sdd-review`. Se despachó un subagente para arreglar tres hallazgos (D1, D2 y D3) y verificarlos en el navegador.

## What happened

El subagente terminó con un error de límite de uso (HTTP 429) antes de commitear. En el árbol quedaban cambios sin commitear en tres archivos (los arreglos de D1 y D2 y un intento de D3, ya con 344 pruebas verdes) y un servidor estático de `npx serve` aún escuchando en el puerto 8099. Relanzar el mismo encargo desde cero habría repetido o pisado ese trabajo. En su lugar se inspeccionaron `git status`, `git diff`, las pruebas y `lsof`, se detuvo el servidor huérfano y se despachó un segundo subagente solo para revisar el diff, verificarlo en el navegador y commitear.

## What to do next time

Si un subagente falla o se corta, antes de relanzar: (1) `git status` y `git diff` para ver qué dejó; (2) correr `npm test` y `node --check`; (3) `lsof -iTCP -sTCP:LISTEN` por servidores o procesos que lanzó; (4) apagarlos; (5) relanzar con un encargo que parta de ese estado («revisa este diff, verifica y commitea») y no del original. Cada subagente que levanta un servidor debe terminar verificando que no deja nada escuchando.

## Signals to watch for

Estado `failed` por límite de uso o error de API en una notificación de subagente; árbol de trabajo sucio sin commit que lo explique; un puerto de desarrollo (8099) ocupado al empezar otra fase.
