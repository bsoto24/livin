---
date: 2026-10-10
spec: "010"
tags: [sdd-plan, pruebas, validacion, node]
---

# Lección: validar el código del plan ejecutándolo en memoria antes de aprobarlo

## Contexto

El plan de la 010 lleva el código completo de cuatro módulos y de cinco archivos de prueba (unas 1.250 líneas en total). Las reglas del modo de planificación impiden escribir archivos del repositorio antes de la aprobación, y un plan con una errata hace perder una ronda de subagentes.

## Qué pasó

Se extrajeron los bloques de código del propio `plan.md` y se cargaron con un gancho de módulos de Node (`module.register` con `resolve` y `load`) que sirve los archivos nuevos desde memoria y deja pasar al repositorio real para todo lo demás. Ejecutadas así, las 39 pruebas nuevas y las 391 existentes dieron 430 pasando, y la ejecución encontró un error del plan: `hogares-de-estados.test.js` importaba `actividadesPendientes` de `actividades.js` y está en `hogar.js`. También midió que `arteDelMapa` cuesta 0,5 ms en el hogar más grande y que la prueba exhaustiva de los 7.560 mapas cabe en unos 3 s. Una versión del script sin el indicador `--test-name-pattern` no terminó en 10 minutos (se quedó esperando) y otra falló porque en macOS no existe `timeout`; lo que funcionó fue lanzar `node --test-name-pattern='.' --input-type=module -` con el script por la entrada estándar y filtrar la salida con `grep`.

## Qué hacer la próxima vez

- Al planificar con mucho código, extraer los bloques del plan y ejecutarlos con el gancho de módulos sobre el repositorio real, antes de pedir la aprobación. Marcar en el plan, como primera línea de cada bloque de archivo completo, el comentario `// src/...` o `// test/...` que usa el repositorio: así el script los encuentra solo.
- Para las ediciones de archivos existentes (añadir al final, sustituir importaciones) construir el archivo virtual a partir del real; si el ancla del plan no existe, el script falla y el plan se corrige.
- Aplicar también los cambios de `juego.js` a una copia en memoria y pasar `node --check` por la entrada estándar; comprobar con `grep` que no quedan referencias a lo que se elimina.
- No usar `timeout` en macOS ni `git merge -F -`; `sed -i` necesita `''`.

## Señales a vigilar

Un plan con muchos bloques de código sin ninguna ejecución previa; una importación copiada de memoria desde el módulo equivocado; un script de validación que no termina (falta el indicador del ejecutor de pruebas o el gancho mantiene el proceso vivo).
