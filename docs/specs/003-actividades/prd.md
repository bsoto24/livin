# PRD: Actividades

**Date:** 2026-10-06
**Feature:** 003-actividades

## Problem

Livin existe para que las personas que comparten un hogar vean de un vistazo cómo está la casa y quién se encarga de qué. Hoy el mapa tiene espacios y habitantes, pero no tiene nada que hacer: no hay tareas, nadie tiene a su cargo nada y todos los espacios se ven igual. Las dos primeras piezas dejaron el terreno listo (espacios y miembros con identidad estable), pero sin actividades el juego no cumple todavía su propósito.

Esta feature agrega las actividades del hogar. El usuario registra tareas (puntuales o que se repiten), las asigna a un miembro y, si quiere, a un espacio, y el mapa muestra su estado: los espacios con tareas vencidas se ven desordenados y, si el atraso crece, en desastre. Marcar una tarea como hecha limpia el espacio.

## Users & Context

**Usuario de la v1:** el propietario del hogar, que usa la app solo, en un único dispositivo y sin conexión. Es quien registra las actividades y quien las marca como hechas, también por los demás miembros, que no tienen cuenta ni usan la app.

**Usuarios futuros:** los familiares tendrán su propia cuenta y marcarán sus propias actividades. Esta feature no implementa nada de eso; el modelo ya contempla actividades que apuntan a un miembro (no a una cuenta).

**Lugar en el proyecto.** Es la pieza 4 de las cinco en que se dividió el proyecto (mapa y editor del hogar → familiares y mascotas → rutinas → **actividades** → capa social). Se decidió hacerla antes que la pieza 3 (rutinas), que seguirá pendiente y reutilizará las fechas y los miembros de esta pieza.

**Sistemas existentes que toca:**
- El **mapa y el modo exploración**: se agregan burbujas sobre los espacios y los miembros, objetos en el suelo y una insignia junto al nombre del espacio.
- El **modo edición**: su panel gana una sección de actividades y sus fichas se reutilizan para crear y editar cada una.
- El **modelo de datos y el documento guardado**: se amplían y el formato guardado cambia de versión.
- La **eliminación de espacios y de miembros**: arrastra a sus actividades, y la confirmación avisa de ello.
- Las **etiquetas de nombre** de los espacios (feature 001, v1.1.0) y los **habitantes** (feature 002): las burbujas de las actividades sin espacio siguen al miembro mientras camina.

**Relación con las specs anteriores.** Esta feature reemplaza las exclusiones de la 001 ("no gestiona actividades ni muestra estados de limpieza de los espacios") y resuelve dos asuntos que la 001 dejó abiertos para esta pieza: qué ocurre con una actividad cuando se elimina su espacio (se elimina con él) y que el estado visual de un espacio solo considera las actividades vinculadas a él. El resto de las specs 001 y 002 sigue vigente sin cambios.

**Plataforma.** La PoC web sigue siendo desechable y su stack oficial no está decidido. La lógica de reglas (fechas, vencimientos, estado, burbujas) debe seguir siendo portable, sin depender del motor gráfico.

## Goals

- El usuario puede crear **actividades** en modo edición, cada una con **nombre**, **icono** de una lista cerrada, **miembro asignado** (obligatorio: un familiar, una mascota o el personaje del propietario) y **espacio** (opcional). Hasta 50 actividades activas por hogar.
- Una actividad puede ser **puntual** (vence en una fecha) o **repetitiva** (cada 1, 2, 3, 7, 14 o 30 días). Los plazos son por día, sin hora; la fecha puede ser pasada.
- Una actividad está **por hacer** desde el día en que vence. Las que vencen en el futuro no aparecen en el mapa.
- **Marcar una actividad como hecha** quita la puntual de las pendientes; en una repetitiva, la próxima vez vence **hoy más su frecuencia**, sin acumular atrasos pasados.
- **Estado de un espacio, calculado y no marcado a mano**, según la actividad por hacer más atrasada vinculada a él: limpio (sin ninguna o con atraso de 0 días), desordenado (1 o 2 días de atraso) o desastre (3 o más). Valores de partida, ajustables tras probarlos en un teléfono.
- **Aspecto en el mapa:** objetos tirados en el suelo del espacio (pocos en desordenado, muchos en desastre) y una insignia junto al nombre del espacio (✓, ! o !!). Los objetos están siempre en las mismas casillas para el mismo estado y no impiden caminar.
- **Una sola burbuja por lugar**, visible en exploración y en edición. En un espacio, la forman sus actividades por hacer; las actividades **sin espacio** muestran su burbuja sobre el miembro asignado, y la burbuja sigue al miembro cuando camina. La burbuja muestra el icono de la actividad más atrasada y, si hay más, un segundo icono que lo indica.
- **Tocar una burbuja abre una hoja** con las actividades de ese lugar: nombre, miembro, plazo y atraso. En **exploración** la hoja solo permite marcar **Hecho**, sin caminar hasta el espacio, y el propietario puede marcarla por cualquier miembro.
- **En modo edición** el panel gana una sección "Actividades" con un botón para crear y la **lista de todas las actividades** (también las futuras, que no tienen burbuja); tocar una fila abre su ficha. La hoja de una burbuja en edición permite además editar y eliminar. Eliminar pide confirmación.
- **Baja en cascada:** eliminar un espacio elimina sus actividades, y eliminar un miembro elimina las suyas. La confirmación dice cuántas actividades se borrarán. Es un borrado lógico, como en las features anteriores.
- Las actividades **se conservan entre sesiones** y los hogares guardados con las features 001 y 002 **se abren sin perder datos**.
- El estado y las burbujas se actualizan solos si la app queda abierta al pasar la medianoche o vuelve a primer plano en otro día.

## Non-Goals

- No hay rutinas, horarios ni plazos con hora (pieza 3).
- No hay negociación de intercambios ni calificaciones (pieza 5).
- No hay cuentas, inicio de sesión ni sincronización para los familiares; el propietario marca las actividades de todos.
- No hay historial de actividades hechas, estadísticas ni puntos.
- No hay notificaciones, recordatorios ni alarmas.
- No hay que caminar hasta el espacio para completar una actividad.
- No hay actividades en pasillos, ni actividades con varios miembros asignados.
- No se pueden elegir frecuencias libres ni días de la semana concretos.
- No se agregan tipos de espacio ni se cambia el editor de espacios de la feature 001.

## Success Criteria

1. El usuario crea una actividad puntual y una repetitiva en modo edición, y su efecto en el mapa (burbuja, objetos, insignia) aparece en menos de 100 ms.
2. Dadas fechas fijas, el estado de un espacio es limpio con atraso de 0 días o sin actividades por hacer, desordenado con 1 o 2 días y desastre con 3 o más; esto se verifica con pruebas automáticas que incluyen los límites de los umbrales y varios días seguidos.
3. Cada espacio con actividades por hacer muestra una sola burbuja, con el icono de la más atrasada y el indicador de "más" si hay varias; las actividades sin espacio muestran una única burbuja sobre su miembro; las futuras no se ven en el mapa.
4. Marcar una puntual como hecha la quita de las pendientes y deja el espacio limpio si era la única vencida; marcar una repetitiva como hecha hace que vuelva a vencer en la fecha de hoy más su frecuencia.
5. Eliminar un espacio o un miembro con actividades pide confirmación que dice cuántas se borrarán, y al confirmar quita las actividades con él; cancelar no cambia nada. Si un cuarto se elimina junto con su baño interno, también se eliminan las actividades del baño; si el baño interno pasa a otro cuarto, las conserva.
6. Al cerrar y reabrir la app siguen todas las actividades con sus datos; un hogar guardado con la feature 001 o 002 se abre con todos sus espacios, habitantes y nombres, sin aviso, y queda guardado en el formato nuevo en el siguiente guardado.
7. No se puede superar el límite de 50 actividades activas, ni crear una sin nombre o con más de 30 caracteres, ni sin miembro, ni con un espacio inexistente.
8. En el teléfono Android de referencia, con 8 familiares, 4 mascotas y 50 actividades repartidas por todos los espacios, el movimiento se mantiene a 60 cuadros por segundo; este es el riesgo principal de rendimiento de la pieza (cantidad de objetos, burbujas y etiquetas dibujados a la vez) y se mide en la verificación.
9. Al pasar la medianoche con la app abierta, o al volver a primer plano en otro día, el estado y las burbujas se actualizan sin recargar.
10. En exploración, la hoja de una burbuja solo permite marcar Hecho; crear, editar y eliminar solo se puede en modo edición.

## Architecture Decisions

- [Modelo de actividades y documento guardado versión 3](../../adr/003-modelo-actividades-formato-v3.md) — una colección `actividades` con un registro por actividad (próxima fecha, sin historial), referencias por id a un miembro obligatorio y un espacio opcional; documento `version: 3` con migración pura desde la v1 y la v2; bajas lógicas en cascada en la misma operación que elimina el espacio o el miembro, incluida la excepción del baño interno de la feature 001.
- [Estado de los espacios derivado de las actividades, con fechas locales y reloj inyectado](../../adr/003-estado-derivado-fechas-reloj-inyectado.md) — el estado, las burbujas y los objetos del suelo se calculan al vuelo con funciones puras y un `hoy` inyectado, sobre fechas del calendario local guardadas como texto; nada derivado se guarda, y se recalcula al cambiar el día.

**Decisiones menores, sin ADR** (reversibles y sin alternativas con costes reales; se registran aquí):
- **Iconos:** lista cerrada de iconos para las actividades (platos, barrer, ropa, basura, limpiar, compras, plantas, mascota y otra), con "otra" como valor por defecto. Son marcadores de la PoC, sin arte de terceros.
- **Frecuencias:** lista cerrada de 1, 2, 3, 7, 14 y 30 días.
- **Nombres de actividad:** de 1 a 30 caracteres, sin espacios en los extremos y **pueden repetirse**, a diferencia de los nombres de espacios y miembros.
- **Fecha de vencimiento:** se elige con el selector de fecha del teléfono y puede ser pasada.
- **Tope:** 50 actividades activas por hogar, contadas sobre las no eliminadas.
- **Objetos del suelo:** cantidad fija por estado (pocos en desordenado, muchos en desastre, limitada por las casillas libres del espacio) y posiciones derivadas del identificador del espacio, para que no cambien entre cuadros. Son decoración: no bloquean el paso de nadie.
- **Posición de la burbuja:** en un espacio, junto a su etiqueta de nombre; en un miembro, sobre su cabeza.
- **Hoja de la burbuja:** misma forma que las fichas ya existentes (panel inferior) y botón "Hecho" por actividad.

## Out of Scope

- Rutinas, horarios y el estado "fuera de casa" (pieza 3).
- Negociación de intercambios y calificaciones (pieza 5).
- Cuentas reales, inicio de sesión, sincronización y permisos para los familiares.
- Historial, estadísticas, puntos o logros de actividades hechas.
- Notificaciones, recordatorios y plazos con hora.
- Exigir que el personaje camine al espacio para completar una actividad.
- Actividades en pasillos o con varios miembros asignados; frecuencias libres o días de la semana.
- Arte definitivo, animaciones, sonido y música.

## Open Questions (para la spec)

- **Baño interno:** es un espacio dentro de un cuarto. Hay que decidir dónde se dibuja su burbuja y sus objetos, y cómo se comportan su insignia y su etiqueta.
- **Prioridad al tocar en modo edición:** hoy es personaje del propietario, habitante, espacio. Hay que fijar dónde entra la burbuja (se propone: después del habitante y antes del espacio).
- **Colisión visual:** con 12 habitantes, etiquetas, burbujas e insignias, el mapa puede saturarse. Es lo primero a ajustar tras probarlo en un teléfono.
