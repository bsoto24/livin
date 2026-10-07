# PRD: Rutinas

**Date:** 2026-10-06
**Feature:** 004-rutinas

## Problem

Livin existe para que las personas que comparten un hogar vean de un vistazo cómo está la casa y quién se encarga de qué. Hoy los familiares caminan al azar por toda la casa a cualquier hora: el mapa no dice quién está en casa, quién salió a trabajar ni dónde está cada uno. Un familiar que pasa el día fuera aparece igual paseando por la sala, y sus actividades se ven como si pudiera hacerlas en ese momento.

Esta feature agrega las **rutinas** de los familiares. El usuario describe, para cada familiar, en qué espacio suele estar y cuándo sale de casa, en un horario de lunes a viernes y otro de sábado y domingo. El mapa muestra a cada familiar donde dice su rutina en ese momento: camina hasta su espacio cuando empieza un bloque, sale por la entrada del hogar cuando se va y vuelve a entrar cuando regresa. Un cartel junto a la entrada dice cuántos están fuera.

## Users & Context

**Usuario de la v1:** el propietario del hogar, que usa la app solo, en un único dispositivo y sin conexión. Es quien define las rutinas de todos los familiares, que no tienen cuenta ni usan la app.

**Usuarios futuros:** los familiares tendrán su propia cuenta y podrán ajustar su propia rutina. Esta feature no implementa nada de eso; los bloques apuntan a un miembro, no a una cuenta.

**Lugar en el proyecto.** Es la pieza 3 de las cinco en que se dividió el proyecto (mapa y editor del hogar → familiares y mascotas → **rutinas** → actividades → capa social). Se hace después de la pieza 4 (actividades), ya implementada, y reutiliza sus fechas locales y sus miembros. Su alcance se acotó a "dónde está cada familiar": no programa las actividades por hora.

**Sistemas existentes que toca:**
- El **generador de la distribución**: la pared inferior de la sala gana una casilla de **entrada**, la puerta del hogar.
- El **movimiento de los habitantes** (feature 002): los familiares con rutina caminan hacia un objetivo en lugar de hacerlo al azar; las mascotas y el personaje del propietario no cambian.
- El **modo edición**: la ficha de un familiar gana una sección para editar su rutina.
- El **modelo de datos y el documento guardado**: se amplían y el formato guardado cambia de versión.
- La **eliminación de espacios y de miembros**: arrastra a los bloques de rutina, y la confirmación avisa de ello.
- Las **burbujas de actividades sin espacio** (feature 003): mientras su familiar está fuera, se señalan en el cartel de la entrada.

**Relación con las specs anteriores.** Esta feature reemplaza las exclusiones de la 001, la 002 y la 003 sobre "rutinas, horarios y el estado fuera de casa". Amplía el movimiento de la 002 (los familiares con rutina ya no caminan siempre al azar, y mientras caminan en ruta pueden cruzarse con otros habitantes) y la confirmación de eliminar un espacio o un habitante de la 003 (cuenta también los bloques). El resto de las specs 001, 002 y 003 sigue vigente sin cambios.

**Plataforma.** La PoC web sigue siendo desechable y su stack oficial no está decidido. La lógica de reglas (horarios, objetivos, rutas) debe seguir siendo portable, sin depender del motor gráfico.

## Goals

- Cada **familiar** (no las mascotas ni el personaje del propietario) puede tener una **rutina** con dos horarios opcionales: **Lunes a viernes** y **Sábado y domingo**.
- Un horario es una lista de hasta 8 **bloques**. Cada bloque tiene **inicio** y **fin** en pasos de 30 minutos entre 00:00 y 24:00, con el fin posterior al inicio (un bloque no cruza la medianoche), y un **lugar**: un espacio activo o **Fuera de casa**. Los bloques de un mismo horario no se superponen, pero pueden tocarse.
- **En exploración, el mapa sigue la hora del dispositivo:**
  - Cuando empieza un bloque en un espacio, el familiar **camina hasta ese espacio** por la ruta más corta y luego pasea **solo dentro de él**.
  - Cuando empieza un bloque **Fuera de casa**, camina hasta la **entrada** y desaparece del mapa; cuando el bloque termina, reaparece en la entrada y camina a su siguiente lugar.
  - Fuera de todo bloque, pasea por toda la casa como hoy. Un familiar sin rutina se comporta exactamente como en la feature 002.
- **Al abrir la app o al salir del modo edición**, cada familiar aparece directamente donde dice su rutina en ese momento (dentro de su espacio, o fuera del mapa si está fuera), sin repetir el camino que no se vio.
- **Cartel de la entrada:** junto a la entrada, un cartel dice cuántos familiares están fuera ("2 fuera") y no se muestra si no hay nadie fuera. Tocarlo abre una hoja con los familiares que están fuera y, para cada uno, la hora a la que vuelve ("Vuelve a las 18:00"). Si alguno de ellos tiene actividades por hacer sin espacio, el cartel muestra una señal "!" y su fila permite abrir la hoja de actividades de ese familiar. El cartel se muestra también **en modo edición**, y ahí cada fila abre la **ficha del familiar**: como un familiar fuera no está en el mapa y el panel del modo edición no lista a los familiares (solo sus contadores), el cartel es el camino para editar su rutina, renombrarlo o eliminarlo mientras está fuera.
- **En modo edición**, la ficha de un familiar ofrece **"Rutina"**, que abre la rutina de ese familiar con un selector Lun–Vie / Sáb–Dom, la lista de bloques del horario elegido ordenada por inicio ("09:00–18:00 · Fuera de casa"), un botón **"+ Bloque"** y, al tocar un bloque, su ficha para cambiar inicio, fin y lugar o eliminarlo. Un bloque que se superpone con otro, o cuyo fin no es posterior al inicio, no se puede guardar, y un mensaje explica el motivo.
- **Baja en cascada:** eliminar un familiar elimina sus bloques, y la confirmación de eliminarlo dice cuántos bloques (además de cuántas actividades) se borrarán; eliminar un espacio elimina los bloques que apuntan a él, con el mismo aviso en su confirmación. Si un baño interno pasa a otro cuarto, conserva sus bloques. Es un borrado lógico, como en las features anteriores.
- Las rutinas **se conservan entre sesiones** y los hogares guardados con las features 001, 002 y 003 **se abren sin perder datos**, con rutinas vacías.
- El mapa se mantiene al día con la hora: si la app queda abierta cuando empieza o termina un bloque, o vuelve a primer plano más tarde, los familiares van a donde corresponde sin recargar.

## Non-Goals

- No hay rutinas para las mascotas ni para el personaje del propietario.
- No hay bloques que crucen la medianoche: dormir de 23:00 a 07:00 se registra como 23:00–24:00 y 00:00–07:00.
- No hay horarios por día de la semana ni días festivos: solo lunes a viernes y sábado y domingo.
- No hay actividades con hora, ni familiares que caminen hasta el espacio de una actividad; las actividades de la feature 003 no cambian.
- No hay notificaciones, recordatorios ni alarmas.
- No se puede copiar un horario a otro ni hay plantillas de rutina.
- No se muestra dónde está un familiar cuando está fuera de casa.
- No hay cuentas ni sincronización para los familiares.
- El jugador no puede salir del hogar por la entrada.

## Success Criteria

1. El usuario crea en modo edición una rutina con un bloque en un espacio y un bloque fuera de casa, y al salir del modo edición el familiar aparece donde corresponde a la hora del dispositivo; el mapa actualizado se muestra en menos de 100 ms.
2. Dado un `ahora` fijo y un azar reproducible, cada familiar con un bloque en un espacio llega a una casilla de ese espacio, y cada familiar con un bloque fuera de casa llega a la entrada y desaparece, en un tiempo no mayor que (longitud de su ruta + 1) por 500 ms, contado desde que cambia su objetivo y cuando el jugador no le cierra el paso (el "+ 1" cubre el paso que ya había empezado); esto se verifica con pruebas automáticas que incluyen familiares enfrentados en un pasillo de una casilla.
3. Fuera de todo bloque, y sin rutina, un familiar pasea por toda la casa como en la feature 002; los habitantes que pasean al azar nunca se superponen entre sí ni con el jugador, y nadie pisa paredes ni muebles.
4. En las 7.560 distribuciones permitidas hay una entrada en la pared inferior de la sala, transitable y alcanzable desde la casilla de aparición; la verificación exhaustiva del generador sigue pasando.
5. Al pasar de un bloque a otro con la app abierta (incluido el paso de viernes a sábado a medianoche), y al volver a primer plano más tarde, los familiares van a donde dice el horario que corresponde sin recargar.
6. El cartel de la entrada muestra cuántos familiares están fuera, no aparece si no hay ninguno, lista a cada uno con su hora de vuelta y señala con "!" a quienes tienen actividades por hacer sin espacio.
7. No se puede guardar un bloque que se superpone con otro del mismo horario, cuyo fin no es posterior a su inicio o que apunta a un pasillo, ni crear un noveno bloque en un horario.
8. Eliminar un espacio o un familiar con bloques o con actividades pide confirmación que dice cuántos bloques y cuántas actividades se borrarán; al confirmar, ningún bloque activo apunta a un espacio o a un miembro eliminado, incluidos los dos casos del cuarto con baño interno (el baño se mueve y el baño se elimina). Se verifica de forma automática.
9. Al cerrar y reabrir la app siguen todas las rutinas; un hogar guardado con la feature 001, 002 o 003 se abre con todos sus datos, sin aviso y sin rutinas, y queda guardado en el formato nuevo en el siguiente guardado.
10. En el teléfono Android de referencia, con el mapa más grande, 8 familiares caminando en ruta a la vez, 4 mascotas y 50 actividades, el movimiento se mantiene a 60 cuadros por segundo; es el riesgo principal de rendimiento de la pieza y se mide en la verificación.

## Architecture Decisions

- [Modelo de rutinas como colección de bloques y documento guardado versión 4](../../adr/004-modelo-rutinas-formato-v4.md) — una colección `bloques` con un registro por bloque (familiar, `laborables` o `finde`, inicio y fin en minutos múltiplos de 30, espacio o nulo para fuera de casa), con id estable y auditoría; sin superposición dentro de un horario; documento `version: 4` con migración pura desde la v1, la v2 y la v3; bajas lógicas en cascada en la misma operación que elimina el espacio o el familiar, incluida la excepción del baño interno.
- [Movimiento de los familiares hacia un objetivo derivado del reloj, con rutas y paso a través en ruta](../../adr/004-movimiento-hacia-objetivo-reloj.md) — un `ahora` inyectado (fecha y minuto locales) da a cada familiar un objetivo (espacio, fuera o libre) que no se guarda; rutas por búsqueda en anchura sobre el mapa; mientras caminan en ruta, los familiares pueden cruzarse con otros habitantes pero esperan al jugador, lo que evita bloqueos en los pasillos de una casilla y acota el tiempo de llegada.

**Decisiones menores, sin ADR** (reversibles y sin alternativas con costes reales; se registran aquí):
- **Entrada del hogar:** una casilla de puerta en la pared inferior de la sala, debajo de la casilla de aparición, que el generador devuelve como `entrada`. Es una regla fija más del generador de piezas del [ADR-001 del generador](../../adr/001-generador-distribucion-piezas-reglas.md), que no cambia el resto de la distribución. El jugador puede pisarla pero no salir por ella.
- **Horarios:** dos (lunes a viernes y sábado y domingo), según el día de la semana de la fecha local.
- **Paso de tiempo:** 30 minutos; inicio entre 00:00 y 23:30 y fin entre 00:30 y 24:00.
- **Tope:** 8 bloques por horario y por familiar.
- **Bloques que cruzan la medianoche:** no se permiten, para que la validación no dependa del horario del día siguiente.
- **Hora de vuelta en el cartel:** la hora en que termina el tramo continuo de bloques fuera de casa del familiar en el horario de hoy ("Vuelve a las 18:00"); si ese tramo llega hasta las 24:00, muestra "Vuelve mañana".
- **Burbuja de un familiar fuera de casa:** sus actividades por hacer sin espacio no muestran burbuja sobre el mapa; las señala el "!" del cartel de la entrada, que mantiene la regla de una sola señal por lugar de la feature 003.
- **Edición de la rutina:** se hace desde la ficha del familiar en modo edición, con el mismo estilo de panel inferior que las fichas existentes; los cambios se guardan en el momento y se aplican al mapa al salir del modo edición.

## Out of Scope

- Rutinas para mascotas o para el personaje del propietario.
- Bloques que cruzan la medianoche, horarios por día de la semana y días festivos.
- Programar actividades por hora o vincular bloques con actividades (pieza futura).
- Negociación de intercambios y calificaciones (pieza 5).
- Notificaciones, recordatorios y alarmas.
- Copiar horarios y plantillas de rutina.
- Mostrar dónde está un familiar fuera de casa.
- Cuentas reales, inicio de sesión, sincronización y permisos para los familiares.
- Arte definitivo, animaciones, sonido y música.

## Open Questions (para la spec)

- **Prioridad al tocar en modo edición:** hoy es personaje del propietario, habitante, burbuja, espacio. Hay que fijar dónde entra el cartel de la entrada (se propone: después del habitante y antes de la burbuja).
- **Dibujo superpuesto:** dos personajes en la misma casilla mientras uno camina en ruta; hay que fijar cuál se dibuja encima y que sus burbujas y etiquetas sigan legibles.
- **Saturación visual y rendimiento:** con 12 habitantes, etiquetas, burbujas, insignias y el cartel, el mapa puede saturarse. Es lo primero a ajustar tras probarlo en un teléfono.
