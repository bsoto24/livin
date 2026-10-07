# Verificación de integración: Actividades

**Feature:** 003-actividades
**Fase del plan:** Phase 6: Integration Verification
**Fecha:** 2026-10-06
**Código verificado:** carpeta `poc/` en `main` (el último commit que tocó `poc/` es `e890a58`; la fusión es `3863d51`)
**Origen de las pruebas:** servidor estático de la carpeta `poc/` por la red local (`http://<IP-del-computador>:8080`, HTTP sin cifrar), con la cabecera `Cache-Control: no-cache`, abierto desde el teléfono. El servidor se apagó al terminar.

## Resultado

La verificación manual en un dispositivo Android real **no reportó observaciones funcionales** en ningún punto de la lista de la Fase 6.

| Dato | Valor |
|---|---|
| Fotogramas por segundo (indicador en pantalla) | 70 fps |
| `regen` (indicador en pantalla) | 5.0 ms |
| Puntos de la lista con observaciones funcionales | ninguno |
| Dispositivo | no se indicó en esta ronda (las verificaciones anteriores fueron en un Samsung Galaxy S23 Ultra con Android 16) |

Metas de la spec: 60 cuadros por segundo con 8 familiares, 4 mascotas y 50 actividades, y menos de 100 ms para mostrar el mapa tras cada cambio. Con los valores reportados, ambas se cumplen: 70 fps y 5.0 ms.

## Alcance de lo verificado

Quien probó recorrió en el teléfono la lista de la Fase 6 y reportó que no hubo observaciones funcionales:

- AC-1.1 a AC-1.10: ficha de alta con sus valores iniciales, frecuencia solo en repetitivas, "Guardar" desactivado hasta completar, fechas pasadas y futuras, límite de 50, cancelar sin cambios, 30 caracteres, nombres repetidos.
- AC-2.1 a AC-2.9: una sola burbuja por lugar con el icono de la actividad más atrasada y "+", burbuja sobre el miembro para las actividades sin espacio, las futuras no se ven, las burbujas no bloquean ni capturan la cruceta.
- AC-3.1 a AC-3.9: la hoja con plazo y "Hecho", comportamiento de las puntuales y las repetitivas, desplazamiento de la hoja con muchas actividades.
- AC-4.1 a AC-4.9: insignias ✓, `!` y `!!`; 4 y 12 objetos que no bloquean; baño interno con su propio estado.
- AC-5.3 y AC-5.4: estado correcto tras segundo plano o cierre de la app (y, si pudo hacerse, el cambio de día).
- AC-6.1 a AC-6.10: lista del panel, ficha de edición, hoja en edición con Editar y Eliminar, prioridad al tocar.
- AC-7.1 a AC-7.10: confirmaciones con el número de actividades al eliminar espacios, cuartos con baño interno, con "−" y habitantes.
- AC-8.1 a AC-8.6: cerrar y reabrir, y abrir con los datos guardados por la feature 002.
- Rendimiento con 8 familiares, 4 mascotas y 50 actividades vencidas caminando, y `regen` tras cambios en edición.

## Lo que este registro no incluye

- No se anotó el modelo del teléfono en esta ronda.
- El reporte dice "sin observaciones funcionales"; no se registraron observaciones visuales (por ejemplo, si la burbuja del personaje tapa su nombre en modo edición, ni la legibilidad de iconos e insignias).
- No se anotó qué comprobaciones concretas se hicieron del cambio de día con la app abierta (AC-5.1 y AC-5.2), ni el peor `regen` de los 20 cambios seguidos: solo consta el valor del indicador, 5.0 ms.
- No se registró si el teléfono migró un hogar de la feature 002 o ya traía datos de esta versión. Esa ruta está cubierta por pruebas automáticas.
- Las pruebas fueron en un solo teléfono.

## Evidencia complementaria

- Pruebas automáticas: 150 de 150 pasan (`cd poc && npm test`, ejecutado el 2026-10-06 sobre `main`).
- Revisión de alineación con la spec (`sdd-review`, modo B), en tres rondas. La ronda 1 halló dos desviaciones, ya corregidas: un baño interno mostraba 3 objetos en lugar de 4 (`e13328c`), y un nombre de espacio personalizado se interpretaba como HTML en la pista "Siguiente:" del panel (`a4056e9`). La ronda 2 halló una tercera: la burbuja de un miembro se dibujaba fuera de la casilla donde responde al toque (`e890a58`). La ronda 3 terminó en SPEC-ALIGNED.
- Prueba en un navegador con viewport de teléfono durante la implementación: alta de actividades, insignia y objetos, burbuja, hoja y "Hecho", confirmación de borrado en cascada, persistencia tras recargar, nombres con HTML mostrados como texto, y toque sobre el icono dibujado de la burbuja de un miembro.
- Validación del plan antes de guardarlo: cada prueba nueva falló sin implementación, 150 de 150 con ella, y 14 de 15 mutaciones de reglas clave detectadas (la restante es equivalente).

## Asuntos abiertos

- **Limpieza visual con 12 habitantes, etiquetas, burbujas e insignias:** es lo primero a ajustar si se pide tras usar la app. No se reportó ninguna observación.
- **Dictámenes aceptados** (sin acción): el límite de "50 actividades activas" se cuenta como 50 pendientes; una burbuja de espacio y una de miembro pueden compartir casilla; en modo edición, con el zoom bajo, el icono de una burbuja es más grande que una casilla; el indicador `regen` mide solo parte del camino de edición.
