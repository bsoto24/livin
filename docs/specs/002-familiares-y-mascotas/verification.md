# Verificación de integración: Familiares y mascotas

**Feature:** 002-familiares-y-mascotas
**Fase del plan:** Phase 5: Integration Verification
**Fecha:** 2026-10-06
**Código verificado:** carpeta `poc/` en `main` (el último commit que tocó `poc/` es `2caa8a7`; los commits posteriores solo cambiaron documentos)
**Origen de las pruebas:** servidor estático de la carpeta `poc/` por la red local (`http://<IP-del-computador>:8080`, HTTP sin cifrar), con la cabecera `Cache-Control: no-cache`, abierto desde el teléfono.

## Resultado

La verificación manual en un dispositivo Android real **no encontró fallos** en ningún punto de la lista de la Fase 5.

| Dato | Valor |
|---|---|
| Fotogramas por segundo (indicador en pantalla) | 69 fps |
| `regen` (indicador en pantalla) | 0.0 ms |
| Puntos de la lista que fallaron | ninguno |
| Dispositivo | no se indicó en esta ronda (la verificación de la feature 001 fue en un Samsung Galaxy S23 Ultra con Android 16) |

Metas de la spec: 60 cuadros por segundo con 8 familiares y 4 mascotas en pantalla, y menos de 100 ms para mostrar el mapa tras cada alta, edición o baja en modo edición. Ambas se cumplen con los valores reportados.

## Alcance de lo verificado

Quien probó recorrió la lista de la Fase 5 en el teléfono y reportó que ningún punto falló:

- AC-1.1 a AC-1.5 y AC-2.1 a AC-2.4: altas de familiares y mascotas, listas sin preselección, "Guardar" desactivado hasta completar, límites de 8 y 4, cancelar sin cambios.
- AC-3.1 a AC-3.5: nombres con espacios, repetidos, de 21 caracteres y vacíos.
- AC-4.1 a AC-4.8: pausas y tramos, velocidad, cruce de puertas, aspecto por género y especie, nombres encima.
- AC-5.1 a AC-5.4: el jugador no pisa a ningún habitante; espera en una puerta ocupada.
- AC-6.1 a AC-6.3: colocación al abrir la app y al tocar **Listo**.
- AC-7.1 a AC-7.8: sección Habitantes, habitantes quietos en edición, prioridad al tocar, fichas, reubicación.
- AC-8.1 a AC-8.4: eliminar con confirmación.
- AC-9.1 a AC-9.5: cerrar y reabrir; AC-9.5 y AC-10.x se cubren con pruebas automáticas.
- Rendimiento con 8 familiares y 4 mascotas caminando, y `regen` tras cambios en edición.

## Lo que este registro no incluye

- No se anotó el modelo del teléfono en esta ronda.
- No se anotaron valores numéricos del cronómetro (la lista pide unas 4 casillas en 2 s). Solo consta que el punto no falló.
- El `regen` registrado es el del indicador, con resolución de 0.1 ms. No se anotó el peor caso de los 20 cambios seguidos, solo que no hubo ningún punto fallido. Como en la feature 001, el indicador mide solo una parte del camino de edición.
- No se registró si el teléfono abrió datos guardados por la feature 001 (migración v1 a v2) o ya traía datos de esta versión. Esa ruta está cubierta por las pruebas automáticas.
- Las pruebas fueron en un solo teléfono.

## Incidencia durante la prueba: mapa en negro por caché

En un primer intento, el teléfono mostraba los controles y el botón **Editar** pero no el mapa. Causa raíz: el servidor `python3 -m http.server` solo envía `Last-Modified`, y el navegador del teléfono aplicó caché heurística y mezcló módulos viejos con nuevos. El módulo nuevo `posicion.js` no coincidía con el importador viejo (`SyntaxError`: no exporta `claveCasilla`), y un error de enlace en un módulo ES aborta todo el grafo, así que el lienzo nunca se creó. Borrar los datos de navegación lo resolvió, y el plan ahora indica servir con `Cache-Control: no-cache` (commit `fb9b6c3`). Esta verificación se hizo con ese servidor y no repitió el fallo.

## Evidencia complementaria

- Pruebas automáticas: 100 de 100 pasan (`cd poc && npm test`, ejecutado el 2026-10-06).
- Revisión de alineación con la spec: SPEC-ALIGNED en dos rondas, con los hallazgos corregidos (temporización de pasos, validación de miembros activos, mensaje de nombre vacío al editar, pruebas adicionales).
- Prueba en el navegador de escritorio con viewport de teléfono durante la Fase 4.

## Asuntos abiertos

- **Etiquetas con 12 personajes en movimiento:** el PRD advierte que pueden saturar el mapa; es lo primero a ajustar si la prueba visual lo pide. No se reportó ninguna observación.
- **Límites aceptados** (sin acción): el indicador `regen` mide solo parte del camino de edición; el botón "+" está dentro de las filas "Familiares" y "Mascotas"; el validador acepta un habitante con `cuentaId` ajeno (la app nunca lo crea).
