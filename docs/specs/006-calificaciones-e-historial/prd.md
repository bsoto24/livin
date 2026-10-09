# PRD: Calificaciones e historial de actividades hechas

**Date:** 2026-10-08
**Feature:** 006-calificaciones-e-historial

## Problem

Livin existe para que las personas que comparten un hogar vean de un vistazo cómo está la casa y quién se encarga de qué. Hoy, cuando alguien marca una actividad como "Hecho", el rastro desaparece: una puntual conserva solo el día en que se hizo y una repetitiva solo su próximo vencimiento. No hay forma de ver qué se hizo en la casa ni quién lo hizo, y tampoco de reconocer, o señalar, cómo salió. Quien lava los platos todos los días no deja huella; quien los lavó mal tampoco.

Esta feature cierra la capa social del proyecto con dos cosas que se apoyan una en la otra:

1. **Historial.** Cada "Hecho" deja una entrada en un historial del hogar: qué actividad era, quién estaba a cargo y cuándo se hizo. Se consulta desde un botón **"Historial"** en la pantalla de exploración.
2. **Calificaciones.** Otra persona del hogar puede calificar una entrada de 1 a 5 estrellas, cuando quiera, desde el historial. Al filtrar por una persona se ve su promedio.

## Users & Context

**Usuarios de la v1:** las personas de un hogar que comparten **un solo teléfono**, sin cuentas ni conexión. Quien califica es la persona que juega en ese momento (el selector "Juega: <nombre>" de la 005); no hay contraseñas ni forma de verificar quién tiene el teléfono, igual que en las features anteriores.

**Usuarios futuros:** cada persona tendrá su propio dispositivo y su cuenta. Esta feature no implementa nada de eso; las entradas y las calificaciones se refieren a miembros, no a cuentas.

**Lugar en el proyecto.** Es la segunda mitad de la pieza 5 (capa social) en que se dividió el proyecto: la 005 (jugador activo e intercambios) ya está implementada y verificada, y esta es la **006**. Es la última pieza del plan original (mapa y editor del hogar → familiares y mascotas → rutinas → actividades → capa social).

**Sistemas existentes que toca:**
- La operación **"Hecho"** (003, ampliada en la 005 con el regreso de las repetitivas intercambiadas): gana un efecto, agregar una entrada al historial, en la misma operación.
- El **modelo de datos y el documento guardado**: se amplían y el formato guardado cambia de versión.
- La **pantalla de exploración**: gana un botón "Historial".
- El **jugador activo** (005): es quien califica.
- Los **intercambios** (005): el crédito de una entrada va a quien tenía la actividad al hacerla, también si la recibió por un intercambio.

**Relación con las specs anteriores.** Esta feature reemplaza las exclusiones de las specs 003 a 005 sobre "historial de actividades hechas" y "calificaciones". El resto de esas specs sigue vigente sin cambios. Sigue vigente que marcar "Hecho" no se puede deshacer.

**Plataforma.** La PoC web sigue siendo desechable y su stack oficial no está decidido. La lógica de reglas (entradas, tope, calificación, promedio) debe seguir siendo portable, sin depender del motor gráfico.

## Goals

**Historial**
- Cada "Hecho" de cualquier actividad (puntual o repetitiva, de una persona o de una mascota) agrega **una** entrada con el nombre y el icono de la actividad, el lugar si lo tenía, quién estaba a cargo y cuándo se hizo.
- La persona acreditada es la **responsable en ese momento**: si una repetitiva estaba intercambiada, el crédito es de quien la tenía, no de su responsable original.
- Un botón **"Historial"** en la pantalla de exploración, junto a "Editar", "Juega" e "Intercambios", abre una lista de todo el hogar, de la más reciente a la más antigua, con un **filtro por persona**. Cada entrada muestra el icono, el nombre, a quién se acredita, cuándo se hizo y sus estrellas.
- El historial guarda solo las **últimas 200 entradas**: al llegar una nueva por encima de 200, se descarta la más antigua, esté calificada o no.
- Las entradas se conservan aunque la actividad se edite o se elimine, o aunque la persona acreditada se elimine (se muestra con "(ya no está)").
- Los historiales **se conservan entre sesiones** y los hogares guardados con las features 001 a 005 **se abren sin perder datos**, con el historial vacío.

**Calificaciones**
- Calificar es **opcional** y se hace desde el historial, cuando se quiera. No hay cola de pendientes, ni aviso, ni marca en el mapa.
- Una entrada tiene a lo sumo **una** calificación de 1 a 5 estrellas, dada por la persona que juega, que debe ser una persona (propietario o familiar) **distinta de la acreditada**. Las entradas de mascotas las puede calificar cualquier persona.
- Solo **quien dio una calificación puede cambiarla o quitarla**; el resto la ve bloqueada y con el nombre de quien la dio.
- Al filtrar el historial por una persona se muestra su **promedio** de estrellas con la cantidad de entradas calificadas (por ejemplo, "Ana: 4,2 ★ (12 calificadas)"). El promedio se calcula con las entradas que siguen en el historial y no se guarda.
- Si quien calificó se elimina después, la calificación se conserva y queda bloqueada para todos.

## Non-Goals

- No se puede deshacer un "Hecho" ni editar o borrar entradas del historial.
- No hay puntos, niveles, logros, rankings ni estrellas visibles en el mapa o en la lista del selector "Juega".
- No hay varias calificaciones por entrada ni cola de "por calificar" con avisos.
- No hay retención por fecha, archivo ni exportación del historial: solo el tope de 200 entradas.
- No hay cuentas, contraseñas, ni sincronización entre teléfonos: es un solo teléfono compartido.
- No se restringe quién puede marcar "Hecho" o editar: cualquier jugador sigue pudiendo hacer ambas cosas (005).

## Success Criteria

1. Marcar "Hecho" una actividad por hacer, puntual o repetitiva, agrega **exactamente una** entrada acreditada al responsable en ese momento, también tras un intercambio aceptado (quien la tenía recibe el crédito, y la repetitiva sigue volviendo a su responsable original). Marcar "Hecho" una actividad que no está por hacer no agrega nada. Se verifica con pruebas automáticas sin interfaz.
2. Con 200 entradas en el historial, el siguiente "Hecho" descarta la más antigua y deja 200. Se verifica en el límite (199, 200 y 201).
3. Se puede calificar una entrada con 1 a 5 estrellas solo si quien califica es una persona distinta de la acreditada; calificarse a uno mismo, calificar con un valor fuera de 1 a 5 o calificar una entrada inexistente se rechaza con un mensaje que explica el motivo.
4. Solo quien dio una calificación puede cambiarla o quitarla; cualquier otra persona la ve bloqueada. Se verifica con pruebas automáticas para cada caso, incluido que quitarla deja la entrada sin calificar.
5. El promedio de una persona cuenta solo las entradas calificadas que siguen en el historial, se actualiza al cambiar o quitar una calificación y no se guarda. Una persona sin entradas calificadas no muestra promedio.
6. Una entrada se sigue mostrando, con su nombre, su icono y su lugar de entonces, aunque la actividad se edite o se elimine, y con "(ya no está)" si se elimina la persona acreditada. Se verifica con pruebas automáticas.
7. Al cerrar y reabrir la app siguen el historial y sus calificaciones; un hogar guardado con la feature 001, 002, 003, 004 o 005 se abre con todos sus datos, sin aviso y con el historial vacío, y queda guardado en el formato nuevo en el siguiente guardado.
8. En el teléfono Android de referencia, con 200 entradas y 50 actividades, el movimiento se mantiene a 60 cuadros por segundo; abrir el historial, filtrarlo y calificar una entrada muestran el resultado en menos de 100 ms.

## Architecture Decisions

- [Historial de actividades hechas, calificaciones y documento guardado versión 6](../../adr/006-historial-calificaciones-formato-v6.md) — una colección `historial` con una entrada por "Hecho" (instantánea del nombre y el icono, el responsable de ese momento por id, estrellas y quién las dio); `marcarHecha` agrega la entrada y recorta a 200 en la misma operación pura; calificar es otra operación pura que exige una persona distinta de la acreditada y que solo permite cambiarla a quien la dio; el promedio se deriva; documento `version: 6` con migración pura desde la v1 a la v5.

**Decisiones menores, sin ADR** (reversibles y sin alternativas con costes reales; se registran aquí):
- **Dónde se abre:** un botón "Historial" solo en exploración, junto a "Editar", "Juega" e "Intercambios". En modo edición no se abre el historial (y "Hecho" solo existe en exploración, como en la 003).
- **Quién califica:** la persona que juega (005). No hay selector aparte de "quién califica".
- **Escala:** 1 a 5 estrellas enteras; sin medias estrellas.
- **Tope de entradas:** 200, que se aplica al crear (como el tope de 50 actividades y de 20 propuestas).
- **Promedio:** solo sobre las entradas calificadas que siguen en el historial; se muestra al filtrar por una persona y con la cantidad de calificadas. No se muestra en el mapa ni en el selector "Juega".
- **Entradas de mascotas:** existen y las puede calificar cualquier persona.
- **Calificación huérfana:** si quien calificó se elimina, la calificación se conserva y queda bloqueada para todos.

## Out of Scope

- Deshacer un "Hecho", y editar o eliminar entradas del historial.
- Puntos, niveles, logros, rankings, y estrellas o promedios en el mapa o en el selector "Juega".
- Varias calificaciones por entrada, una cola de "por calificar", y notificaciones o recordatorios.
- Retención del historial por fecha, archivo y exportación.
- Cuentas, inicio de sesión, un dispositivo por persona y sincronización (pieza de multiusuario).
- Restringir qué puede hacer cada jugador (permisos por persona).
- Arte definitivo, animaciones, sonido y música.

## Open Questions (para la spec)

- **Dónde va el botón "Historial"** en la pila de botones de la esquina superior derecha, ahora de cuatro (Editar, Juega, Intercambios, Historial), sin tapar la cruceta ni el cartel de la entrada (004). Se resuelve con el diseño de la spec y se prueba en el teléfono.
- **Qué filtra el filtro por persona:** se propone que liste a las personas **y** a las mascotas, y que el promedio se muestre para cualquiera de ellas que se elija.
- **Qué pasa con el panel de intercambios o la hoja abiertos al abrir el historial:** se propone cerrarlos, como al cambiar de jugador en la 005.
- **Cómo se ve una calificación bloqueada** (por ejemplo, estrellas deshabilitadas con el nombre de quien las dio) y cómo se distingue de una que el jugador actual puede cambiar.
- **Qué se muestra cuando el historial está vacío** y cuando el filtro no tiene entradas.
- **Cómo se formatea la fecha de una entrada** ("hoy", "ayer", "hace N días") sin depender de la hora del dispositivo en la lógica. Resuelto en la spec: cada entrada guarda el día del calendario local en que se hizo (el `hoy` con que se marcó "Hecho"), además de su fecha y hora (`hechaEn`, de `ctx.ahora()`, un instante UTC). Ojo con el nombre: `hechaEn` de una actividad puntual es un día `AAAA-MM-DD`, mientras que `hechaEn` de una entrada es un instante; la spec usa "día" para el primero.
- **Si se puede calificar una entrada cuya persona acreditada ya se eliminó:** por las reglas del ADR (quien califica es una persona activa y distinta de la acreditada) sí se puede; la spec debe confirmarlo.
- **Lista de motivos de rechazo al calificar** (calificarse a uno mismo, valor fuera de 1 a 5, entrada inexistente, quien califica no es una persona, calificación bloqueada por otra persona), cada uno con su mensaje, como `MENSAJES_ACTIVIDAD` en la 003.
