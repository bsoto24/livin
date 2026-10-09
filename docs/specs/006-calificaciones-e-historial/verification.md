# Verificación: 006 calificaciones e historial

**Fecha:** 2026-10-09
**Rama:** `feat/006-calificaciones-e-historial`

## Pruebas automáticas

`cd poc && npm test` → 301 pruebas, 301 pasan, 0 fallan (258 de las features 001 a 005 + 43 nuevas). `node --check src/juego.js` sin salida.

Las 43 pruebas nuevas: 3 de contrato (`contrato-historial.test.js`), 8 del formato v6 en `almacen.test.js`, 16 de entradas, tope y fiabilidad en `historial.test.js` y 16 de consultas, calificaciones y promedio en `calificaciones.test.js`.

## Revisión de alineación con la spec (sdd-review, modo B)

Veredicto: **SPEC-ALIGNED**. Los 81 AC y los 9 FR tienen su prueba automática o, en la capa de presentación, su código verificado por inspección y la evidencia del navegador. No hubo diferencias de comportamiento ni funcionalidad no pedida. Dos hallazgos menores se corrigieron en `b75fce4`:

- Faltaban dos pruebas que pide la sección de fiabilidad de la spec: la secuencia combinada "Hecho tras eliminar al responsable original" (crédito a quien tiene la actividad) y la integridad referencial del documento v6 tras cada baja de espacio o miembro y tras el tope de 200 (se guarda y se vuelve a leer sin error).
- Si el día cambia con el panel del historial abierto, ahora se repinta (AC-2.5).

## Navegador de escritorio (panel del navegador integrado, ventana de 333 × 399 px)

Hogar de prueba con un familiar (Diana), una mascota (Firulais) y cuatro actividades, servido en local con un servidor estático temporal (apagado al terminar).

| Comprobación | AC | Resultado |
|---|---|---|
| Cuatro botones apilados (Editar, Juega, Intercambios, Historial) sin tapar la cruceta; "Historial" en la esquina superior derecha | AC-2.1 | ✓ |
| Historial vacío muestra "Aún no hay actividades hechas" y el filtro en "Todos" | AC-2.2, AC-2.6 | ✓ |
| Tres "Hecho" generan tres filas, la última primero, con "persona · espacio · Hoy" y estrellas vacías | AC-1.1, AC-1.5, AC-2.3, AC-2.4 | ✓ |
| Un nombre con marcado (`<b>perro</b>`) se muestra como texto | AC-2.8 | ✓ |
| La fila propia no se puede calificar y muestra "No puedes calificar tus propias actividades" | AC-4.3 | ✓ |
| Tocar la estrella 4 la llena, muestra "Tu calificación" y "Quitar"; el panel conserva el desplazamiento; `regen` 0,9 ms | AC-4.2, AC-5.1, AC-2.7, AC-2.10 | ✓ |
| Tocar la misma estrella no cambia nada (auditoría igual); otra estrella la cambia; "Quitar" la deja vacía y libre | AC-5.2, AC-5.3, AC-5.4 | ✓ |
| La entrada de la mascota se puede calificar | AC-4.4 | ✓ |
| Filtrar por Diana: "Diana: 2,0 ★ (1 calificadas)", una fila; sin calificaciones: "Personaje 1: sin calificaciones" | AC-3.2, AC-3.3, AC-3.4 | ✓ |
| Como Diana, la calificación del propietario aparece bloqueada ("Calificó Personaje 1", sin controles) y ella puede calificar la entrada del propietario | AC-5.5, AC-4.1 | ✓ |
| Las calificaciones quedan guardadas en el documento v6 | AC-8.1, AC-8.2 | ✓ |
| Con 200 entradas: abrir 2,8 ms, filtrar 2,1 ms, calificar 16,8 ms (< 100 ms); `regen` 3,3 ms; 101–114 fps | AC-2.7, AC-2.10 | ✓ |
| Un documento v5 (sin `historial`) se abre sin aviso, con el historial vacío y todos sus datos; abrirlo no lo reescribe | AC-8.3 | ✓ |

## No verificado en esta sesión

- **Teléfono Android de referencia** (2026-10-09, resumen del usuario; modelo no indicado): **64 fps, `regen` 62,7 ms, sin observaciones**, con la carga completa —8 familiares, 4 mascotas, 21 espacios (el máximo), 50 actividades pendientes y 200 entradas de historial (67 calificadas)— sembrada con una página de carga temporal fuera del repositorio. Cumple los 60 cuadros por segundo y los 100 ms de la meta. Se probó sobre `main` con la feature 007 ya integrada, que reemplazó los botones apilados de esta feature por la pestaña Actividades → Hechas, así que la comprobación de «cuatro botones sin tapar el cartel» ya no aplica; la fila con cinco estrellas y "Quitar", el recorrido de las 200 entradas y calificar se revisaron en esa pestaña (el usuario informó «sin observaciones», sin detallar paso por paso). El `regen` de 62,7 ms es el más alto registrado hasta ahora (antes 3 a 11 ms) y queda por debajo de la meta, pero con poco margen en el teléfono: conviene vigilarlo si crece la carga.
- **"Hecho" tocado desde la hoja del mapa**: las filas de la prueba en el navegador se sembraron llamando a `marcarHecha` (la misma función que usa el botón de la hoja); el flujo de la hoja (`aplicarActividades(marcarHecha(...))`) no cambió y su efecto está cubierto por las pruebas automáticas.
- **Guardado en el formato v6 de un hogar v5 tras el primer cambio**: cubierto por la prueba automática AC-8.3 (006); en el navegador, cambiar de jugador solo guarda la posición, así que el documento sigue en v5 hasta el primer cambio del hogar.
- **Tope de 200 con un "Hecho" nuevo en el navegador**: cubierto por las pruebas automáticas (199, 200 y 201 entradas).

## Observaciones

- El plan no listaba una prueba existente (`AC-11.8` de `almacen.test.js`, que fija las claves del documento guardado); se actualizó con `historial` en la Fase 1.
- El texto del resumen con una sola calificación dice "1 calificadas" (el texto fijo de la spec es "(<n> calificadas)").
- La spec dice que un `hechaEn` que no es una fecha y hora válidas vuelve ilegible el documento, pero el validador (y el modelo de datos) solo exigen texto no vacío. Límite aceptado: la lógica no usa `hechaEn` para nada más que la auditoría (el día mostrado sale de `dia`, que sí se valida como fecha real).
- Si una calificación se rechaza con la lista desplazada, el motivo aparece debajo de la lista y puede quedar fuera de la vista; la interfaz desactiva las estrellas que serían rechazadas, así que es casi inalcanzable.
