---
date: 2026-10-09
spec: "007"
tags: [presentacion, estado-derivado, revision]
---

# Lesson: si un control pasa de un solo modo a estar siempre visible, hay que repasar todos los caminos que cambian el estado

## Context

Feature 007. El botón «Juega: <nombre>» y el rótulo «Intercambios (n)» solo se veían en exploración y los refrescaba `actualizarBotones()` al volver de la edición. La 007 los dejó visibles también en modo edición.

## What happened

Las 341 pruebas automáticas pasaban y la verificación manual de integración no encontró nada. La revisión de alineación (`sdd-review`) detectó que `aplicar()` —la función que aplica cualquier cambio del modo edición— no llamaba a `actualizarBotones()`: renombrar al jugador, eliminar al jugador o cambiar las propuestas recibidas dejaba el texto antiguo en pantalla hasta pulsar «Listo». La presentación no tiene pruebas automáticas, así que solo la lectura de todos los caminos que asignan `estado` lo encontró. La corrección fue de una línea.

## What to do next time

Cuando una feature cambie cuándo se ve un elemento de la interfaz que muestra algo **derivado del estado**, hacer una lista de todas las asignaciones a `estado` (aquí `aplicar`, `aplicarActividades`, `aplicarRutina`, `aplicarHistorial`, `elegirJugador`, `cambiarDia`) y comprobar una por una si debe refrescar ese elemento. En el plan, convertirlo en un paso explícito de la fase de presentación y en un paso de la verificación manual («renombrar, eliminar y cambiar de jugador con el drawer abierto»).

## Signals to watch for

Un botón o rótulo que antes estaba oculto en un modo y ahora se muestra siempre; texto que se actualiza solo «al volver» o «al cerrar»; una función `actualizarX()` con pocos llamadores.
