---
date: 2026-10-08
spec: "005"
tags: [sdd-review, adr, reloj, pruebas-de-contrato, calidad]
---

# Lección: una vigencia derivada de comparar marcas exige que la marca crezca siempre

## Contexto

En la 005 una propuesta de intercambio es "vigente" mientras la marca `actualizadoEn` de sus dos actividades sea igual a la guardada al proponer. Así no hubo que tocar editar, eliminar, "Hecho" ni las bajas en cascada: todas ya llamaban a `tocar`.

## Qué pasó

`tocar` copiaba `ctx.ahora()`. Con un reloj que no avanza entre dos operaciones (dos cambios en el mismo instante), la marca no cambiaba y editar, o marcar "Hecho" una repetitiva, dejaban la propuesta vigente. El ADR de intercambios lo había declarado un límite aceptado ("no ocurre con toques humanos"), pero la spec, en su NFR de Reliability, exigía que la vigencia se rompa también en el mismo instante, con una prueba de contrato por operación. Nadie lo notó al aprobar el plan: el reloj de pruebas (`crearCtx`) siempre avanza, así que los 253 tests pasaban. Lo encontró la revisión `sdd-review` de la implementación. Se corrigió haciendo que `tocar` añada un `+` a la marca anterior cuando el reloj no avanzó, con pruebas con reloj congelado para cada operación y para que restaurar el valor anterior no reviva la propuesta.

## Qué hacer la próxima vez

- Cuando una regla dependa de comparar marcas de tiempo, escribir desde la fase de contratos una prueba con reloj congelado para cada operación que deba invalidarla; el reloj de pruebas que siempre avanza oculta este fallo.
- Al aprobar un plan, cotejar cada "límite aceptado" de los ADR con los NFR de la spec. Si se contradicen, resolverlo antes (corregir el código o enmendar la spec con `sdd-spec-update`), no en la revisión final.

## Señales a vigilar

Un ADR que dice "no ocurre en la práctica" sobre un caso que la spec sí lista; un reloj inyectado de pruebas que solo sabe avanzar; reglas de validez derivadas de igualdad de marcas sin una prueba por cada operación que debe romperlas.
