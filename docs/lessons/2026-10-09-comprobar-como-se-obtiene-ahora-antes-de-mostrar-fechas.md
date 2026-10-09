---
date: 2026-10-09
spec: "006"
tags: [sdd-specify, adr, reloj, fechas, zona-horaria]
---

# Lección: antes de diseñar cómo se muestra una fecha, comprobar cómo produce "ahora" el código existente

## Contexto

El PRD y el ADR de la 006 decían que cada entrada del historial guardaría `hechaEn` (fecha y hora) y que la lista mostraría "Hoy", "Ayer" y "Hace N días". El ADR se aceptó así.

## Qué pasó

Al escribir la spec, leyendo `marcarHecha` y `fechas.js`, se vio que `ctx.ahora()` devuelve un instante en UTC (`toISOString()`), mientras que la interfaz trabaja con el día del calendario local (`hoy`). Calcular "Hoy" y "Ayer" desde `hechaEn` habría dependido de la zona horaria del teléfono dentro de la lógica pura, justo lo que la regla del proyecto prohíbe. La solución fue guardar además `dia` (el `hoy` local con que se marcó "Hecho", que `marcarHecha` ya recibía) y enmendar el ADR, que ya estaba aceptado, antes de planificar.

## Qué hacer la próxima vez

- En el brainstorm, cuando una decisión de datos incluya fechas u horas, abrir `fechas.js` y el `ctx` de `juego.js` y escribir en el ADR cuál es la fuente de "ahora" (instante UTC o día local) y cuál se usa para mostrar.
- Guardar el día local junto al instante si la presentación necesita "hoy/ayer"; no derivarlo de un instante dentro de funciones puras.

## Señales a vigilar

Un campo "fecha y hora" cuyo único uso es mostrar "hoy" o "ayer"; funciones puras que necesitarían `getTimezoneOffset` o `Date` local para formatear.
