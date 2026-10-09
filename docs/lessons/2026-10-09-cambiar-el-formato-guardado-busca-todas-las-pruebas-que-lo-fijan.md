---
date: 2026-10-09
spec: "006"
tags: [sdd-plan, formato-guardado, migracion, pruebas]
---

# Lección: al cambiar el formato guardado, buscar con grep todas las pruebas que lo fijan

## Contexto

La 006 subió el documento guardado de la versión 5 a la 6 (`historial: []`). El plan listó con precisión las pruebas existentes que fijaban la versión (aserciones `version, 5`, el hogar inicial, los contratos de rutinas e intercambios) y la prueba `AC-10.7 (005)` que fija la lista de claves del documento.

## Qué pasó

Había una segunda prueba que también fija esa lista de claves (`AC-11.8` de `almacen.test.js`) y el plan no la nombraba. Nadie la vio al aprobarlo: la encontró el implementador de la Fase 1 cuando la suite se puso en rojo. Se corrigió añadiendo `'historial'` a su lista, igual que en la otra, sin más consecuencias; pero el plan prometía "estas son las pruebas que cambian" y no era completo.

## Qué hacer la próxima vez

- Al planificar un cambio de formato guardado, buscar con `grep` las pruebas que fijan la versión y las que fijan la lista de claves (`version, N)`, `Object.keys(guardado)`) en todos los archivos de prueba, y listar cada coincidencia en la fase del formato.
- Dejar en el plan el comando de búsqueda y el recuento esperado (por ejemplo, "debe haber N coincidencias"), para que el implementador detecte una prueba que falta antes de ver la suite en rojo.

## Señales a vigilar

Un plan que enumera "las pruebas que cambian" sin haberlas buscado con grep; dos pruebas distintas que verifican el mismo conjunto de claves del documento guardado.
