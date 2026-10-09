---
date: 2026-10-06
spec: "003"
tags: [sdd-plan, subagentes, tdd, calidad]
---

# Lección: validar el código del plan en una copia antes de guardarlo evita rehacer fases

## Contexto

El plan de la 003 tenía unas 2.000 líneas con el código completo de seis fases, escrito en Plan Mode.

## Qué pasó

Tras la aprobación y antes de guardarlo, se extrajeron todos los bloques de código del plan y se aplicaron sus instrucciones con un script sobre una copia de `poc/` en el scratchpad. Primero solo las pruebas: cada una falló por el motivo previsto. Después todo el código: 150 de 150 a la primera. Luego 15 mutaciones de reglas clave: 14 detectadas y una equivalente (la comprobación del día en `numeroDeDia`, redundante con la del mes). La Fase 5 se comprobó con `node --check`, una revisión estática de importes e ids y una ejecución en un navegador con viewport de teléfono. Durante la ejecución, cada subagente implementó su fase con el texto del plan y el controlador comparó sus archivos con `cmp` contra la copia validada: todos idénticos. Ninguna fase necesitó ajustes de código. La validación también reveló un error de redacción (el plan decía "la línea de import" cuando eran varias líneas).

## Qué hacer la próxima vez

Cuando el plan lleva el código completo, validarlo por script en una copia antes de guardarlo: aplicar sus instrucciones tal cual, comprobar rojo y luego verde, mutar las reglas clave y, en la ejecución, comparar con `cmp` el resultado de cada subagente contra la copia validada. Prever unos 25 minutos extra.

## Señales a vigilar

Un plan con código completo y totales de pruebas prometidos ("# pass 150"); instrucciones de edición redactadas en prosa ("reemplazar la línea…"); informes de subagentes que dicen "verbatim" sin que nadie lo haya comparado.
