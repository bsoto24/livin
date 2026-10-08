# Verificación de integración: Rutinas

**Feature:** 004-rutinas
**Fase del plan:** Phase 8: Integration Verification
**Fecha:** 2026-10-07
**Código verificado:** rama `feat/004-rutinas` en `03ad63f` (carpeta `poc/`); en el teléfono, `main` en `1ecf48c` (la fusión, con el mismo código en `poc/`)
**Estado:** verificación automática, en navegador de escritorio y en el teléfono Android **completa** (sección "Verificado en el Android").

## Resultado automático

| Dato | Valor |
|---|---|
| `npm test` | 207 pruebas, 207 pasan, 0 fallan (150 de las features anteriores + 57 nuevas) |
| Distribuciones comprobadas de forma exhaustiva | 7.560, con entrada alcanzable en todas |
| Huella de las 7.560 distribuciones, con la entrada cerrada, frente al generador de `main` (feature 003) | idéntica (`f3e2f4bd…77393`), comprobada de forma independiente por el revisor |
| Revisión de alineación con la spec (`sdd-review`, modo B) | ronda 1: DRIFT DETECTED; ronda 2: **SPEC-ALIGNED** |
| Criterios de aceptación | 112: 80 cubiertos por pruebas automáticas, 32 solo de interfaz (verificados por lectura del código y, en parte, en el navegador); ninguno parcial ni faltante |

### Hallazgos de la revisión y su resolución

| Hallazgo | Resolución |
|---|---|
| D1 (AC-3.10): un familiar lejos de un espacio lleno no iba a esperar junto a él; reproducido a mano (a 30 s seguía a 15 casillas, sin moverse) | Corregido en `planificar` (Phase 9), con su prueba |
| D4 (AC-6.5): la hora de vuelta del cartel cambiaba al editar rutinas | Corregido: se calcula con las rutinas del momento de entrar a editar; comprobado en el navegador (04:00 durante la edición, 03:30 tras "Listo") |
| D5 (AC-8.6, FR-7): dos nombres de familiares en ruta en una misma casilla podían taparse | Corregido: se apilan; **sin comprobar visualmente** |
| Cobertura parcial de AC-3.5, AC-10.11, AC-11.6, AC-9.3 y AC-9.7 | Pruebas agregadas (Phases 9 y 10) |
| D2: el cartel es más ancho que una casilla | Aceptado: ruling del plan (alineado a la derecha contra la entrada, no tapa nada) |
| D3: quien espera un espacio lleno no bloquea a quien pasea | Aceptado: ruling del plan (evita un bloqueo real en la puerta de un baño interno; la spec define "en ruta" como caminar hacia el lugar) |

## Verificado en el navegador de escritorio (ventana de 375×812)

Sobre una copia del código y, para lo último, sobre el código de la rama:

- La entrada se ve como un hueco en la pared inferior de la sala; el personaje la pisa y no pasa de ella.
- "Rutina" solo aparece en la ficha de un familiar; la rutina abre en "Lun–Vie" con "Sin bloques" y "0 de 8".
- La ficha de bloque empieza sin valores elegidos y con "Guardar" desactivado; ofrece 48 inicios (00:00–23:30), fines hasta 24:00 y "Fuera de casa" más los espacios sin pasillos.
- Se muestran los mensajes de fin anterior al inicio y de superposición; el bloque se guarda de inmediato en formato v4.
- Con un bloque "Fuera de casa" vigente, al tocar "Listo" el familiar no está en el mapa y el cartel dice "1 fuera"; su hoja dice "Vuelve a las HH:MM". El cartel se puede tocar con el personaje en la casilla de aparición (se corrigió la cruceta, que lo tapaba) y la cruceta sigue moviendo al personaje.
- En modo edición el cartel sigue visible y su fila abre la ficha del familiar.
- Al empezar el bloque siguiente (cambio a las 00:30 con la app abierta), el familiar vuelve a entrar por la entrada y camina hasta la cocina; con el personaje en la casilla de arriba, esperó y entró cuando este se apartó.
- Eliminar a un familiar con bloques pide confirmación: "¿Eliminar a "Diana"? Se eliminarán 2 bloques de rutina."

## Verificado en el Android

**Fecha:** 2026-10-08
**Origen de las pruebas:** servidor estático de la carpeta `poc/` por la red local (`http://<IP-del-computador>:8080`, HTTP sin cifrar), con la cabecera `Cache-Control: no-cache`, abierto desde el teléfono. El servidor se apagó al terminar.

La verificación manual en un dispositivo Android real **no encontró fallos** en ningún punto de la lista de la Fase 8.

| Dato | Valor |
|---|---|
| Fotogramas por segundo (indicador en pantalla) | 60 fps |
| `regen` (indicador en pantalla) | 3 ms |
| Puntos de la lista que fallaron | ninguno |
| Dispositivo | no se indicó en esta ronda (las verificaciones anteriores fueron en un Samsung Galaxy S23 Ultra con Android 16) |

Metas de la spec: 60 fps o más (AC-8.7) y `regen` por debajo de 100 ms (AC-6.2, AC-5.15). Con los valores reportados se cumplen ambas; los 60 fps están exactamente en el límite de la meta.

Quien probó recorrió la lista del teléfono y reportó que ningún punto falló. Cubre:

- Rendimiento con 8 familiares cuyos bloques empiezan a la vez, 4 mascotas y 50 actividades, y `regen` en cambios consecutivos con rutinas cargadas.
- Legibilidad y tamaño del cartel, de las filas de su hoja, de la ficha y de la rutina, y de los nombres de los personajes.
- Posición y área táctil del cartel con los dos zooms (D2) y el comportamiento de la cruceta frente al cartel (AC-5.14).
- Nombres que se apilan entre familiares en ruta (D5, AC-8.6) y la espera junto a un espacio lleno (D1).
- Cambio de bloque con la app abierta, vuelta desde segundo plano y reapertura de la app tras horas (AC-7.6 a AC-7.9).
- Listas nativas de inicio, fin y lugar (AC-1.4, AC-2.1), nombres como texto (AC-1.12) y cierre inesperado (AC-11.9).

### Lo que este registro no incluye

- No se anotó el modelo del teléfono en esta ronda.
- El reporte es global ("sin fallos"): no se registró punto por punto qué se hizo en cada casilla, ni el peor `regen` de los 10 "Listo" seguidos, solo el valor del indicador (3 ms). No se anotaron observaciones visuales ni de sensación de uso (por ejemplo, cómo se siente que un familiar espere en una puerta).
- No se registró si se dejó la app abierta un viernes a medianoche (punto opcional de AC-7.9).
- No se registró si el teléfono migró un hogar de la feature 003 o ya traía datos de esta versión. Esa ruta está cubierta por pruebas automáticas.
- Las pruebas fueron en un solo teléfono.

### Asuntos abiertos

- **Rulings aceptados** (sin acción): D2 (el cartel es más ancho que una casilla, alineado a la derecha contra la entrada) y D3 (quien espera un espacio lleno no bloquea a quien pasea).
