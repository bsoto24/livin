---
date: 2026-10-10
spec: "010"
tags: [prd, sdd-specify, hogares-de-prueba, catalogo]
---

# Lección: cotejar los límites del catálogo antes de prometer un hogar de prueba en el PRD

## Contexto

El PRD de la 010 pedía «un tercer hogar de prueba» que mostrara los tres estados de limpieza en cada tipo de espacio, para revisarlos juntos en el navegador. Al escribir la spec se vio que el catálogo limita los espacios por tipo (una sola sala, un solo comedor, dos cocinas, y así), de modo que no se pueden tener tres espacios del mismo tipo con tres estados distintos.

## Qué pasó

La spec y el plan cambiaron la promesa: un hogar de prueba por estado (limpio, desordenado y desastre), cada uno con un espacio de cada uno de los ocho tipos, que se cargan uno por uno. Hubo que corregir también el PRD ya aprobado para que coincidiera, y dejar la desviación señalada en las preguntas abiertas de la spec. No costó nada en código, pero era una promesa que el PRD no podía cumplir.

## Qué hacer la próxima vez

- Al pedir en un PRD o en una spec un hogar de prueba o un ejemplo con varios espacios, comprobar en `src/catalogo.js` (`LIMITES`) y en `hogar.js` (`limites`) cuántos espacios de cada tipo admite el modelo, y redactar el objetivo con esos límites.
- Cuando algo no quepa en un solo ejemplo, decirlo en el PRD y proponer un ejemplo por caso.
- Si la spec corrige una promesa del PRD, editar el PRD en el mismo momento y dejar una nota en las preguntas abiertas de la spec.

## Señales a vigilar

Un objetivo del tipo «un hogar que muestre todos los X en cada Y» sin haber mirado los límites por tipo; un ejemplo de prueba que exige más espacios de un tipo de los que admite el catálogo.
