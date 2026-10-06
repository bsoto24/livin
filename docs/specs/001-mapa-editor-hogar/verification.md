# Verificación de integración: Mapa y editor del hogar

**Feature:** 001-mapa-editor-hogar
**Fase del plan:** Phase 5: Integration Verification
**Fecha:** 2026-10-05
**Código verificado:** carpeta `poc/` en `main` (el código fuente es el de `e7ff0d2`; `poc/` no cambió después)
**Origen de las pruebas:** servidor estático de la carpeta `poc/` por la red local (`http://<IP-del-computador>:8080`, HTTP sin cifrar), abierto desde el teléfono.

## Resultado

La verificación manual en un dispositivo Android real **no encontró fallos** en ningún punto de la lista de la Fase 5.

| Dato | Valor |
|---|---|
| Dispositivo | Samsung Galaxy S23 Ultra |
| Sistema | Android 16 |
| Fotogramas por segundo (indicador en pantalla) | 82 fps |
| `regen` (indicador en pantalla) | 0.0 ms |
| Puntos de la lista que fallaron | ninguno |

Meta de rendimiento de la spec: 60 fps en el movimiento y menos de 100 ms para mostrar el mapa tras cada cambio en modo edición. Ambas se cumplen con los valores reportados.

## Alcance de lo verificado

Quien probó recorrió la lista de la Fase 5 en el teléfono y reportó que ningún punto falló:

- AC-1.1 a AC-1.3: arranque sin datos, hogar inicial, "Personaje 1" en la sala, sin pasillos.
- AC-2.1 a AC-2.5: cruceta táctil, avance continuo, choques con paredes y muebles, puertas sin transición.
- AC-3.1 a AC-3.8: modo edición, `+` y `−` hasta los límites, comedor sobre la sala, pasillo al tercer espacio de una zona.
- AC-4.1 a AC-4.9: baños internos, pista "Siguiente", eliminación con y sin confirmación.
- AC-5.1 a AC-5.6: fichas, renumeración, confirmaciones, Eliminar desactivado en mínimos, ficha del personaje.
- AC-6.1 a AC-6.7: renombres válidos e inválidos, máximo de 20 caracteres.
- AC-7.1 a AC-7.4: cerrar y reabrir, segundo plano, desplazar un cuarto con el personaje dentro, eliminar el espacio del personaje.
- AC-8.1 a AC-8.5: cubiertos por pruebas automáticas.

## Lo que este registro no incluye

- No se anotaron valores numéricos del cronómetro (la lista pide unas 8 casillas en unos 2 s al mantener pulsado). Solo consta que el punto no falló.
- El `regen` registrado es el que mostraba el indicador, con resolución de 0.1 ms. No se anotó el peor caso de los 20 cambios seguidos, solo que no hubo ningún punto fallido.
- Las pruebas fueron en un solo teléfono.

## Evidencia complementaria

- Pruebas automáticas: 44 de 44 pasan, incluida la verificación exhaustiva de los 7.560 mapas permitidos.
- Revisión de alineación con la spec (ronda 3): SPEC-ALIGNED, sin criterios sin cubrir.
- Prueba en el navegador de escritorio: caminar contra paredes con tecla pulsada, modo edición, renombrar, confirmaciones de eliminación y persistencia tras recargar.
- Carga correcta por una dirección IP de red local (contexto no seguro), tras corregir la dependencia de `crypto.randomUUID`.

## Verificación de la v1.1.0 (etiquetas de nombre en el mapa)

**Fecha:** 2026-10-05
**Alcance:** Story 9 (AC-9.1 a AC-9.5) y FR-12, agregados en la versión 1.1.0 de la spec.
**Código verificado:** carpeta `poc/` en `main` en `d91c412` (incluye `src/etiquetas.js` y su dibujo en `src/juego.js`).
**Origen de las pruebas:** servidor estático de `poc/` por la red local, abierto desde el teléfono.

| Dato | Valor |
|---|---|
| Fotogramas por segundo (indicador en pantalla) | 73 fps |
| Observaciones del usuario | ninguna |
| Dispositivo | no se indicó en esta ronda (la verificación anterior fue en un Samsung Galaxy S23 Ultra con Android 16) |

El usuario recorrió el juego en el teléfono con las etiquetas de la v1.1.0 y reportó 73 fps, por encima de los 60 que exige la spec, y ninguna observación. No se anotó el valor de `regen` ni se registró por separado cada punto de la lista de comprobación propuesta (etiquetas de espacios visibles sin entrar al modo edición, nombre del personaje siguiéndolo, etiqueta del espacio actual siempre visible, legibilidad, cruceta sin tapar etiquetas, cambios tras **Listo**).

### Evidencia complementaria de la v1.1.0

- Pruebas automáticas: 55 de 55 pasan, incluidas las 11 de `etiquetas.test.js` (lógica de qué etiquetas existen, su texto, y el desplazamiento de la etiqueta del espacio actual en horizontal y en vertical). Se comprobó con mutaciones que los tests detectan la falta de cada rama.
- Revisión de alineación con la spec de la v1.1.0: SPEC-ALIGNED, sin criterios sin cubrir.
- Prueba en el navegador de escritorio con viewport de teléfono: con la tecla pulsada, caminando de la Sala a la Cocina, la caja completa de la etiqueta del espacio actual quedó dentro de la vista en 8 de 8 paradas; renombrar al personaje a "Diana" actualizó su etiqueta en exploración y en edición.

## Asuntos abiertos

- **AC-6.6:** resuelto con la v1.1.0. El nombre del personaje ahora también se muestra junto a él sobre el mapa (AC-9.4).
- **Ambigüedades menores de la v1.1.0**, sin acción tomada por no haberse observado problemas en el teléfono:
  - Los pasillos no tienen etiqueta porque no tienen nombre.
  - La cruceta y el botón **Editar** son elementos HTML sobre el lienzo y pueden tapar una etiqueta.
  - La etiqueta del espacio actual cambia hasta 250 ms antes de que el sprite cruce una puerta.
  - Un nombre de 20 caracteres con letras anchas podría no caber en un cuarto estrecho; no se midió.
