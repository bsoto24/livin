---
date: 2026-10-11
spec: "011"
tags: [sdd-plan, sdd-execute, fases, refactor]
---

# Lección: la fase que elimina un identificador debe incluir a su último usuario

## Contexto

El plan de la 011 separó la Fase 5 (iconos en el HTML) y la Fase 6 (burbujas, insignias y colores del mapa). La Fase 5 pedía borrar `GLIFO_ICONO`, `COLOR_INSIGNIA`, `ESTILO_BURBUJA` y la importación de `INSIGNIAS` de `juego.js`; la Fase 6 reescribía `dibujarInsignias` y `dibujarBurbujas`, que todavía los usaban.

## Qué pasó

Al preparar la ejecución se vio que la Fase 5 sola dejaba la escena rota en tiempo de ejecución (`node --check` no lo detecta, solo falla al dibujar). Se resolvió con un dictamen: las dos fases se entregaron juntas a un solo subagente y se commitearon una vez, con las dos secciones del plan en el mensaje. Costó un commit más grande de lo previsto, y el commit intermedio que pedía el plan no existió.

## Qué hacer la próxima vez

- Al partir un plan en fases sobre un mismo archivo, listar qué identificadores elimina cada fase y comprobar que ninguna fase posterior los siga usando; si los usa, mover el borrado a la fase del último usuario.
- Si una fase «quita» algo que otra fase «reescribe», fundirlas o pasar el borrado a la segunda.
- Al ejecutar, buscar con `grep` los identificadores eliminados antes de commitear cada fase intermedia.

## Señales a vigilar

Una fase cuyo texto dice «borrar la constante X» mientras una fase posterior menciona un método que usa X; un plan con un commit intermedio que no se puede ejecutar por sí solo.
