# PRD: Jugador activo e intercambios

**Date:** 2026-10-08
**Feature:** 005-jugador-activo-e-intercambios

## Problem

Livin existe para que las personas que comparten un hogar vean de un vistazo cómo está la casa y quién se encarga de qué. Hoy solo el propietario juega: su personaje es el único que se controla, y es el único que puede actuar. Los familiares caminan solos por el mapa, pero quien comparte el teléfono con ellos no puede jugar como ellos. Y las actividades tienen un responsable fijo: si Ana no quiere lavar los platos hoy y Luis prefiere eso a sacar la basura, no hay forma de arreglarlo en la app.

Esta feature agrega dos cosas que se apoyan una en la otra:

1. **Jugador activo.** En un teléfono compartido, un selector "Juega: <nombre>" cambia quién actúa y quién es el personaje del mapa. Pueden jugar el propietario y los familiares. Quien deja de jugar sigue caminando solo.
2. **Intercambios.** Quien juega puede proponer a otra persona cambiar una de sus actividades por una de ella. La otra persona acepta o rechaza cuando le toca jugar. Una actividad puntual cambia de responsable hasta que se hace; una repetitiva, solo la próxima vez.

Las calificaciones con estrellas y el historial de actividades hechas, que completan la capa social, son la feature 006 y no forman parte de esta.

## Users & Context

**Usuarios de la v1:** las personas de un hogar que comparten **un solo teléfono**, sin cuentas ni conexión. El propietario sigue siendo quien configura el hogar; los familiares juegan "por turnos" en el mismo dispositivo, sin contraseñas.

**Usuarios futuros:** cada persona tendrá su propio dispositivo y su cuenta. Esta feature no implementa nada de eso; el jugador activo es estado del dispositivo, y los intercambios se refieren a miembros, no a cuentas.

**Lugar en el proyecto.** Es la primera mitad de la pieza 5 de las cinco en que se dividió el proyecto (mapa y editor del hogar → familiares y mascotas → rutinas → actividades → **capa social**). La pieza 5 se partió en dos features: **005 jugador activo e intercambios** y 006 calificaciones con estrellas. Se hace después de las features 001 a 004, ya implementadas y verificadas.

**Sistemas existentes que toca:**
- El **personaje del mapa** (001): deja de ser siempre el del propietario.
- El **movimiento de los habitantes** (002 y 004): el propietario, cuando no juega, camina solo; los familiares que dejan de jugar retoman su rutina.
- Las **rutinas** (004): un familiar que juega no sigue su rutina, incluso si está "fuera de casa".
- Las **actividades** (003): su responsable puede cambiar por un intercambio; se muestra "por intercambio" en la burbuja, la hoja y la lista.
- El **modelo de datos y el documento guardado**: se amplían y el formato guardado cambia de versión.
- La **posición guardada** del personaje: pasa a ser la de quien juega y guarda quién es.
- La **pantalla de exploración**: gana dos botones.

**Relación con las specs anteriores.** Esta feature reemplaza las exclusiones de las specs 001 a 004 sobre "negociación de intercambios" y amplía el movimiento de la 002 y la 004 (el propietario pasa a caminar solo cuando no juega). El resto de las specs sigue vigente sin cambios.

**Plataforma.** La PoC web sigue siendo desechable y su stack oficial no está decidido. La lógica de reglas (jugador, intercambios, vigencia) debe seguir siendo portable, sin depender del motor gráfico.

## Goals

**Jugador activo**
- En exploración, un botón **"Juega: <nombre>"** abre la lista del propietario y de los familiares. Las mascotas no aparecen. Al elegir a alguien, la cruceta pasa a mover a esa persona **desde donde esté**, sin teletransportarla.
- Quien deja de jugar sigue caminando solo desde su casilla: un familiar retoma su rutina; el propietario, que no tiene rutina, camina al azar por la casa como las mascotas.
- Mientras alguien juega, su rutina queda en pausa. Un familiar que estaba **fuera de casa** se puede elegir: aparece de inmediato en la entrada de la casa (o en la casilla libre más cercana si está ocupada) y, al dejar de jugar, retoma su rutina (y sale si su bloque actual sigue siendo "Fuera de casa").
- **Cualquier jugador** puede entrar al modo edición y marcar "Hecho" en cualquier actividad, como hoy.
- En modo edición, tocar a cualquier miembro (jugador, propietario, familiar o mascota) abre su ficha. Si se elimina a quien juega, juega el propietario.
- Al cerrar y reabrir la app **sigue jugando la misma persona**, en su posición guardada.

**Intercambios**
- Un botón **"Intercambios (n)"** abre un panel con las propuestas **recibidas** (aceptar o rechazar), las **enviadas** (retirar) y **"Proponer"**. El número es la cantidad de propuestas recibidas vigentes por la persona que juega.
- **Proponer:** el jugador elige una de **sus** actividades pendientes y una actividad pendiente de **otra persona** (propietario o familiar; no las de mascotas). Sirven también las que aún no vencen.
- **Responder:** la persona destinataria, cuando le toca jugar, ve la propuesta y la **acepta o la rechaza**. No hay contraofertas. Quien propuso puede **retirarla** mientras esté vigente.
- **Al aceptar**, cada una pasa a ser responsable de la actividad de la otra **solo la próxima vez**:
  - una **puntual** cambia de responsable hasta que se hace;
  - una **repetitiva**, al marcarla "Hecho", vuelve a su responsable original, con su nuevo vencimiento;
  - la burbuja, la hoja y la lista muestran al responsable actual, con la nota "por intercambio".
- **Vigencia:** una propuesta deja de ser vigente si una de las dos actividades se edita, se elimina, se marca como hecha o pierde a su responsable. Se muestra como "ya no vigente" y no se puede aceptar.
- **Reglas de la propuesta:** una actividad está a lo sumo en una propuesta vigente; una repetitiva que está intercambiada no se vuelve a intercambiar hasta que vuelve a su responsable; hay como máximo 20 propuestas vigentes en el hogar.
- Los intercambios **se conservan entre sesiones** y los hogares guardados con las features 001 a 004 **se abren sin perder datos**, sin intercambios.

## Non-Goals

- No hay calificaciones con estrellas ni historial de actividades hechas (feature 006).
- No hay contraofertas, intercambios de varias actividades por varias, ni favores con "deuda".
- No hay cuentas, contraseñas, ni sincronización entre teléfonos: es un solo teléfono compartido.
- Las mascotas no juegan ni intercambian.
- No hay notificaciones ni avisos fuera de la app: la propuesta se ve al abrir "Intercambios".
- No se muestra en el mapa quién tiene propuestas pendientes; el aviso es el número del botón.
- No se limita quién puede editar o marcar "Hecho": cualquier jugador puede hacer ambas cosas con cualquier actividad.

## Success Criteria

1. Al elegir otro jugador, el personaje del mapa pasa a ser esa persona en **su casilla** y el jugador anterior sigue caminando desde la suya; nadie salta de lugar ni comparte casilla. Se verifica con pruebas automáticas del cambio de jugador sin interfaz.
2. Un familiar fuera de casa se puede elegir y aparece en la entrada (o en la casilla libre más cercana si está ocupada). Al dejar de jugar vuelve a regirse por su rutina: si su bloque actual es "Fuera de casa", camina a la entrada y sale.
3. El propietario, cuando no juega, camina al azar sin pisar paredes ni muebles ni superponerse con otros habitantes que pasean; un familiar que no juega se mueve como en la 004.
4. Al cerrar y reabrir la app sigue jugando la misma persona en su posición. Si esa persona ya no existe, juega el propietario. Un hogar guardado sin jugador se abre con el propietario.
5. Un jugador propone un intercambio válido; la persona destinataria, al jugar, lo ve y lo acepta, lo rechaza, o quien propuso lo retira. Aceptar cambia el responsable de las dos actividades; rechazar y retirar no cambian nada.
6. En una repetitiva intercambiada, "Hecho" la devuelve a su responsable original con su nuevo vencimiento; en una puntual, el cambio dura hasta que se hace. Si el responsable original fue eliminado, la actividad se queda con quien la tiene.
7. Una propuesta deja de ser vigente al editar, eliminar o marcar "Hecho" cualquiera de sus dos actividades, o al eliminar a un miembro involucrado; en ese caso no se puede aceptar. Se verifica con pruebas automáticas para cada operación.
8. No se puede proponer: una actividad ajena como ofrecida, una de una mascota, una ya incluida en una propuesta vigente, una repetitiva ya intercambiada, ni más de 20 propuestas vigentes; cada rechazo muestra un mensaje que explica el motivo.
9. Reasignar a mano una actividad desde su ficha borra la nota "por intercambio" y su regreso automático.
10. Al cerrar y reabrir la app siguen todos los intercambios; un hogar guardado con la feature 001, 002, 003 o 004 se abre con todos sus datos, sin aviso y sin intercambios, y queda guardado en el formato nuevo en el siguiente guardado.
11. En el teléfono Android de referencia, con 8 familiares, 4 mascotas, el propietario caminando solo y 50 actividades, el movimiento se mantiene a 60 cuadros por segundo; el cambio de jugador y las operaciones del panel de intercambios muestran el mapa actualizado en menos de 100 ms.

## Architecture Decisions

- [Jugador activo como estado del dispositivo y movimiento unificado de los miembros](../../adr/005-jugador-activo-movimiento-unificado.md) — el `jugadorId` se guarda junto a la posición en `livin:posicion:v1` (no en el hogar); todos los miembros salvo el jugador son móviles, y el propietario se mueve como `libre` cuando no juega; cambiar de jugador no mueve a nadie, y un familiar fuera de casa aparece en la entrada.
- [Intercambios de actividades, "solo la próxima vez" y documento guardado versión 5](../../adr/005-intercambios-formato-v5.md) — una colección `intercambios` con un registro por propuesta; el campo `devolverA` en cada actividad recuerda a su responsable original; la vigencia se deriva de la marca `actualizadoEn` de las dos actividades, sin tocar las operaciones existentes; documento `version: 5` con migración pura desde la v1 a la v4.

**Decisiones menores, sin ADR** (reversibles y sin alternativas con costes reales; se registran aquí):
- **Dónde se ve el aviso:** el número del botón "Intercambios (n)" cuenta las propuestas vigentes recibidas por quien juega. No hay marca en el mapa.
- **Dónde se usan los botones:** "Juega" e "Intercambios" aparecen solo en exploración, junto a "Editar". En modo edición no se cambia de jugador ni se proponen intercambios.
- **Mascotas:** no juegan y no pueden ser parte de un intercambio; sus actividades no se ofrecen ni se piden.
- **Tope de propuestas:** 20 vigentes en el hogar, que se aplica al crear (como el tope de 50 actividades).
- **Qué se intercambia:** actividades pendientes, también las que aún no vencen; las puntuales y las repetitivas, en cualquier combinación.
- **Nota "por intercambio":** se muestra junto al responsable en la hoja y en la lista del panel; la burbuja no cambia de aspecto.
- **Quién ve qué:** la lista "Recibidas" y el número del botón son de la persona que juega; los datos son del hogar y no hay secretos entre jugadores en un mismo teléfono.

## Out of Scope

- Calificaciones con estrellas, historial de actividades hechas y quién hizo cada una (feature 006).
- Contraofertas, intercambios múltiples y favores con "deuda".
- Cuentas, inicio de sesión, un dispositivo por persona y sincronización (pieza de multiusuario).
- Notificaciones, recordatorios y alarmas.
- Restringir qué puede hacer cada jugador (permisos por persona).
- Rutinas o actividades propias para las mascotas.
- Arte definitivo, animaciones, sonido y música.

## Open Questions (para la spec)

- **Cómo se distingue al jugador en el mapa:** hoy el personaje del propietario es el único controlable y no lleva marca. Con varios jugadores hace falta una señal (nombre destacado, anillo, color) que no sature el mapa. Se propone resaltar su etiqueta de nombre.
- **Dónde van los botones "Juega" e "Intercambios" en la pantalla de exploración**, sin tapar la cruceta ni el cartel de la entrada (004) y manejables con una mano en el teléfono.
- **Qué pasa con el panel de intercambios y la hoja de actividades abiertos al cambiar de jugador:** se propone cerrarlos.
- **Avisar al editar o eliminar** una actividad que está en una propuesta vigente, o dejar que la propuesta simplemente deje de ser vigente. Se propone lo segundo, por simplicidad.
- **Orden de prioridad al tocar en modo edición** con el propietario como móvil: se propone personaje del jugador, miembro (propietario, familiar o mascota), burbuja, espacio, y que el cartel de la entrada conserve su lugar de la 004.
- **Saturación visual y rendimiento:** con 13 personajes en pantalla (12 móviles y el jugador), etiquetas, burbujas, insignias y el cartel, el mapa puede saturarse. Es lo primero a ajustar tras probarlo en un teléfono.
