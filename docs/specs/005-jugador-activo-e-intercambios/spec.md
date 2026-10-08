# Feature 005: Jugador activo e intercambios

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-08
**Branch:** `feat/005-jugador-activo-e-intercambios`
**Source:** [prd.md](prd.md) · [ADR jugador activo y movimiento unificado](../../adr/005-jugador-activo-movimiento-unificado.md) · [ADR intercambios y formato v5](../../adr/005-intercambios-formato-v5.md) · se apoya en la [spec 001](../001-mapa-editor-hogar/spec.md) (v1.1.0), la [spec 002](../002-familiares-y-mascotas/spec.md) (v1.0.0), la [spec 003](../003-actividades/spec.md) (v1.0.0) y la [spec 004](../004-rutinas/spec.md) (v1.0.0)

---

## Problem Statement

Livin existe para que las personas que comparten un hogar vean de un vistazo cómo está la casa y quién se encarga de qué. Hoy solo el propietario juega: su personaje es el único que se controla y el único que actúa, aunque varias personas compartan el teléfono. Y las actividades tienen un responsable fijo: si una persona prefiere hacer la tarea de otra, no hay forma de acordarlo en la app. Esta feature agrega, en un teléfono compartido, un **jugador activo** (un selector "Juega: <nombre>" que cambia quién actúa y quién es el personaje del mapa) y los **intercambios**: quien juega propone cambiar una de sus actividades por una de otra persona, y esa persona acepta o rechaza cuando le toca jugar. Una actividad puntual cambia de responsable hasta que se hace; una repetitiva, solo la próxima vez.

## Goals

- En exploración, un botón "Juega: <nombre>" permite elegir entre el propietario y los familiares (no las mascotas). La cruceta mueve a quien juega **desde donde esté**, sin teletransportarlo.
- Quien deja de jugar sigue caminando solo desde su casilla: un familiar retoma su rutina; el propietario, que no tiene rutina, pasea al azar por toda la casa.
- Un familiar que está **fuera de casa** se puede elegir: aparece de inmediato en la entrada y, mientras juega, su rutina queda en pausa.
- Cualquier jugador puede entrar al modo edición y marcar "Hecho" en cualquier actividad, como hoy. En el modo edición, tocar a cualquier miembro abre su ficha.
- Al reabrir la app sigue jugando la misma persona, en su posición.
- Quien juega **propone** un intercambio de una de sus actividades pendientes por una de otra persona; la persona destinataria, cuando le toca jugar, lo **acepta o rechaza**; quien propone puede **retirarlo**. Una actividad está a lo sumo en una propuesta vigente.
- Al aceptar, cada persona pasa a ser responsable de la actividad de la otra **solo la próxima vez**: una puntual cambia de responsable hasta que se hace; una repetitiva vuelve a su responsable original al marcarla "Hecho".
- Una propuesta deja de ser vigente si una de sus actividades se edita, se elimina, se marca como hecha o pierde a su responsable.
- Los intercambios y el jugador se conservan entre sesiones, y los hogares guardados con las features 001 a 004 se abren sin perder datos.

## Non-Goals

- No hay calificaciones con estrellas ni historial de actividades hechas (feature 006).
- No hay contraofertas, intercambios de varias actividades por varias, ni favores con "deuda".
- No hay cuentas, contraseñas ni sincronización entre teléfonos: es un solo teléfono compartido.
- Las mascotas no juegan ni intercambian.
- No hay notificaciones ni avisos fuera de la app: una propuesta se ve al abrir "Intercambios".
- No se muestra en el mapa quién tiene propuestas pendientes: el aviso es el número del botón.
- No se restringe qué puede hacer cada jugador: cualquiera edita y marca "Hecho" en cualquier actividad.
- Un familiar que juega no sale del hogar por la entrada.

## Users and Context

**Primary users:** las personas de un hogar que comparten un solo teléfono. El propietario configura el hogar; los familiares juegan "por turnos" en el mismo dispositivo, sin contraseñas.
**Secondary users:** las personas de un hogar que en features futuras tendrán su propio dispositivo y su cuenta. En esta feature los intercambios y el jugador apuntan a miembros, no a cuentas.
**Usage context:** sesiones cortas en el celular, en orientación vertical. Alguien pasa el teléfono, cambia de jugador, mira sus propuestas recibidas y responde; o propone un cambio y devuelve el teléfono.
**User mental model:** el mismo de las features 001 a 004. Vocabulario nuevo: "jugador" o "quien juega" (el personaje que mueve la cruceta); "jugador activo" (el que tiene el turno en este teléfono); "propuesta" o "intercambio" (el ofrecimiento de cambiar una actividad por otra); "ofrecida" (la actividad de quien propone) y "pedida" (la de la otra persona); "destinataria" (a quien se propone); "recibida" y "enviada" (la propuesta vista por cada lado); "vigente" (una propuesta pendiente cuyas dos actividades siguen como estaban); "regreso pendiente" (la repetitiva que está con otra persona por un intercambio y volverá a su responsable original al hacerla); "por intercambio" (la nota que muestra esa repetitiva).

**Relación con las specs anteriores.** Esta feature reemplaza las exclusiones de las specs 001 a 004 sobre "negociación de intercambios". Amplía reglas existentes:

- **Personaje del mapa (spec 001, FR-6 y FR-10):** el personaje que mueve la cruceta ya no es siempre el del propietario, sino el de quien juega. Su posición guardada es la de quien juega.
- **Movimiento (spec 002, FR-5; spec 004, FR-3 y FR-4):** el propietario, cuando no juega, pasea solo al azar por toda la casa (no tiene rutina). Un familiar que no juega sigue su rutina como en la 004; mientras juega, su rutina queda en pausa. Las mascotas no cambian.
- **Colocación (spec 002, FR-7; spec 004, FR-6):** al abrir la app y al tocar "Listo", se coloca primero a quien juega y después a los demás miembros, incluido el propietario si no juega.
- **Cartel de la entrada (spec 004, FR-5):** un familiar que juega no cuenta como fuera.
- **Toque en el modo edición (spec 003, AC-6.8; spec 004, AC-5.13):** la prioridad pasa a ser miembro que ocupa la casilla (quien juega, el propietario, un familiar o una mascota), cartel de la entrada, burbuja, espacio.
- **Actividades (spec 003):** el responsable de una actividad puede cambiar por un intercambio. La ficha, la hoja y la lista del panel muestran la nota "por intercambio" en las repetitivas que volverán a su responsable. El límite de 50 pendientes, el estado de los espacios y las burbujas no cambian.
- **Confirmaciones de eliminar (spec 003, AC-7.7):** cuentan las actividades que el miembro tiene en ese momento, también las recibidas por intercambio.

El resto de las specs 001 a 004 sigue vigente sin cambios.

## User Stories

### Story 1: Elegir quién juega

**As a** persona que comparte el teléfono con otras de su hogar
**I want** elegir quién juega
**So that** cada una actúe y se vea en el mapa como ella misma

**Acceptance criteria:**

- [ ] **AC-1.1** Dado el modo exploración, Cuando se muestra el mapa, Entonces se ve un botón "Juega: <nombre de quien juega>" en la esquina superior derecha, debajo de "Editar", que no tapa la cruceta ni el cartel de la entrada; en el modo edición el botón no se ve.
- [ ] **AC-1.2** Dado un hogar nuevo, o uno sin jugador guardado, Cuando se abre la app, Entonces juega el propietario y el botón dice "Juega: <nombre del propietario>".
- [ ] **AC-1.3** Dado el botón "Juega", Cuando el usuario lo toca, Entonces se abre una lista titulada "¿Quién juega?" con una fila por el propietario y por cada familiar activo (el propietario primero y después los familiares en el orden en que se crearon), sin ninguna mascota, con la fila de quien juega marcada con el texto "Jugando" y con un botón "Cerrar".
- [ ] **AC-1.4** Dado un hogar sin familiares, Cuando se abre la lista, Entonces tiene una sola fila, la del propietario, marcada "Jugando".
- [ ] **AC-1.5** Dada la lista abierta, Cuando el usuario toca la fila de otra persona, Entonces la lista se cierra, el botón pasa a decir "Juega: <nombre elegido>" y la cruceta mueve a esa persona (Story 2).
- [ ] **AC-1.6** Dada la lista abierta, Cuando el usuario toca la fila de quien ya juega, o "Cerrar", Entonces la lista se cierra y no cambia nada.
- [ ] **AC-1.7** Dadas dos personas con el mismo nombre, Cuando se abre la lista, Entonces aparecen dos filas separadas y tocar una elige solo a esa persona.
- [ ] **AC-1.8** Dado un nombre de persona con aspecto de marcado, Cuando se muestra en el botón o en la lista, Entonces se muestra como texto.
- [ ] **AC-1.9** Dado un familiar renombrado o eliminado en el modo edición, Cuando el usuario toca "Listo" y abre la lista, Entonces la lista muestra los nombres actuales y no incluye a quien se eliminó.

### Story 2: Cambiar de jugador sin saltos

**As a** persona que recibe el teléfono
**I want** tomar el control de mi personaje sin que nadie salte de lugar
**So that** el mapa siga siendo el de mi casa en este momento

**Acceptance criteria:**

- [ ] **AC-2.1** Dado el modo exploración con un familiar visible en una casilla, Cuando el usuario lo elige como jugador, Entonces ese familiar deja de caminar solo, pasa a ser el personaje que mueve la cruceta en esa misma casilla (o en la casilla a la que se dirigía, si estaba en medio de un paso), mirando hacia donde miraba (o hacia abajo si no tenía dirección), y la cámara se centra en él.
- [ ] **AC-2.2** Dado un cambio de jugador, Cuando se completa, Entonces la persona que jugaba queda en la casilla que ocupaba, deja de responder a la cruceta y camina sola; su nombre y su burbuja siguen visibles.
- [ ] **AC-2.3** Dado que quien jugaba es un familiar con bloque vigente en un espacio, Cuando deja de jugar, Entonces camina hasta ese espacio como en la feature 004; si su bloque vigente es "Fuera de casa", camina hasta la entrada y sale; si no tiene bloque vigente, pasea por toda la casa.
- [ ] **AC-2.4** Dado que quien jugaba es el propietario, Cuando deja de jugar, Entonces pasea al azar por toda la casa con las pausas y los tramos de la feature 002 (AC-4.1), sin límite de espacio y sin rutina.
- [ ] **AC-2.5** Dado un cambio de jugador, Cuando se completa, Entonces nadie queda en una casilla ocupada por otro habitante que no esté en ruta ni en la casilla de quien juega, y nadie queda en una pared, un mueble o fuera del mapa.
- [ ] **AC-2.6** Dado un cambio de jugador, Cuando se completa, Entonces las mascotas y los demás familiares siguen con el movimiento que tenían, sin saltos.
- [ ] **AC-2.7** Dado quien juega en medio de un paso, Cuando el usuario elige a otra persona, Entonces el cambio se aplica al terminar ese paso.
- [ ] **AC-2.8** Dado el mapa en cualquier modo, Cuando se muestra, Entonces la etiqueta de nombre de quien juega se dibuja resaltada (con un fondo de color que no tienen las demás etiquetas), solo la suya; al cambiar de jugador el resalte pasa a la nueva etiqueta.
- [ ] **AC-2.9** Dados una hoja de actividades, la hoja del cartel, el panel de intercambios o una ficha abiertos, Cuando el usuario cambia de jugador, Entonces se cierran.
- [ ] **AC-2.10** Dado un cambio de jugador, Cuando se completa, Entonces el mapa actualizado se muestra en menos de 100 ms.
- [ ] **AC-2.11** Dado un cambio de jugador, Cuando se completa, Entonces las burbujas de actividades sin espacio siguen sobre su miembro, el estado y las insignias de los espacios no cambian y el cartel cuenta solo a quienes están fuera.

### Story 3: Jugar como un familiar que está fuera de casa

**As a** familiar cuya rutina dice que estoy fuera de casa
**I want** poder tomar el teléfono y jugar igualmente
**So that** pueda responder mis propuestas aunque la rutina diga que salí

**Acceptance criteria:**

- [ ] **AC-3.1** Dado un familiar que está fuera (incluido el que espera fuera del mapa para reaparecer), Cuando se abre la lista "¿Quién juega?", Entonces su fila se puede elegir y muestra la nota "Fuera de casa · entra por la puerta".
- [ ] **AC-3.2** Dado un familiar fuera, Cuando el usuario lo elige, Entonces aparece de inmediato en la entrada como el personaje que mueve la cruceta, la cámara se centra en él y el cartel baja su cuenta en 1 (o desaparece si era el único fuera).
- [ ] **AC-3.3** Dada la entrada ocupada por un habitante cuando el familiar aparece, Cuando el usuario lo elige, Entonces aparece en la casilla transitable libre más cercana a la entrada por camino, siempre la misma para el mismo mapa y las mismas casillas ocupadas, y nunca en la casilla de otro.
- [ ] **AC-3.4** Dado un familiar que juega y cuyo bloque vigente es "Fuera de casa" o un espacio, Cuando pasa el tiempo, Entonces su rutina no lo mueve: se queda donde lo deja el jugador y puede caminar por toda la casa sin límite de espacio.
- [ ] **AC-3.5** Dado un familiar que juega, Cuando el usuario lo mueve hasta la entrada y sigue hacia abajo, Entonces no sale del hogar ni desaparece.
- [ ] **AC-3.6** Dado un familiar que deja de jugar, Cuando se completa el cambio, Entonces retoma su rutina de ese momento (AC-2.3); si su bloque vigente sigue siendo "Fuera de casa", camina a la entrada y vuelve a salir.
- [ ] **AC-3.7** Dado un familiar que juega y tiene actividades por hacer sin espacio, Cuando se muestra el mapa, Entonces su burbuja aparece sobre él y esas actividades no se señalan en el cartel.
- [ ] **AC-3.8** Dada la hoja del cartel abierta, Cuando el usuario elige a un familiar fuera como jugador, Entonces la hoja se cierra (AC-2.9) y el cartel actualizado ya no lo cuenta.

### Story 4: Actuar como la persona que juega

**As a** persona que juega
**I want** editar el hogar, marcar "Hecho" y abrir fichas como hoy
**So that** pueda hacer todo lo que hacía el propietario

**Acceptance criteria:**

- [ ] **AC-4.1** Dada cualquier persona que juega, Cuando toca "Editar", Entonces se abre el modo edición como hoy: todos los personajes visibles quedan quietos en la casilla en que están, incluido quien juega, y los familiares que están fuera siguen sin verse.
- [ ] **AC-4.2** Dado el modo edición, Cuando el usuario toca "Listo", Entonces quien juega se ubica según AC-7.3 y AC-7.4 de la 001 (en la misma posición relativa si sigue siendo válida, si no en la casilla de aparición de la sala) y después cada otro miembro se coloca como en AC-6.2 de la 004 (los familiares según su rutina de ese momento y el propietario, si no juega, y las mascotas en una casilla libre al azar), y todos empiezan a moverse.
- [ ] **AC-4.3** Dado el modo exploración, Cuando cualquier persona que juega toca "Hecho" en una actividad por hacer de cualquier miembro, Entonces se aplica como en la feature 003, sin comprobar que la actividad sea suya.
- [ ] **AC-4.4** Dado el modo edición, Cuando el usuario toca la casilla de un miembro visible (quien juega, el propietario, un familiar o una mascota), Entonces se abre su ficha: la del propietario (renombrar, sin "Eliminar") si es el propietario, juegue o no; la del familiar o de la mascota en los demás casos.
- [ ] **AC-4.5** Dado el modo edición, Cuando el usuario toca una casilla, Entonces se abre, con esta prioridad: la ficha del miembro que la ocupa (quien juega, el propietario o un habitante); si no, la hoja del cartel si la casilla es la de su dibujo; si no, la hoja de la burbuja que se muestra en esa casilla; si no, la ficha del espacio.
- [ ] **AC-4.6** Dado el modo edición con un familiar que juega, Cuando el usuario abre su ficha, Entonces ofrece "Rutina" como la de cualquier familiar; editar su rutina no cambia lo que hace mientras juega.
- [ ] **AC-4.7** Dado el modo edición y el familiar que juega, Cuando el usuario lo elimina desde su ficha y confirma, Entonces juega el propietario, que toma la casilla donde estaba el propietario como personaje quieto en el modo edición, el familiar desaparece junto con sus bloques y sus actividades como en la 004, y el resalte del nombre pasa al propietario.
- [ ] **AC-4.8** Dado el modo edición, Cuando el usuario elimina a un familiar o a una mascota que no juega, Entonces quien juega no cambia.
- [ ] **AC-4.9** Dado el modo exploración, Cuando el usuario toca "Editar" mientras quien juega está en medio de un paso, Entonces se espera a que termine el paso, como hoy.
- [ ] **AC-4.10** Dado el modo edición, Cuando el usuario crea o edita una actividad, Entonces puede asignarla a cualquier miembro, no solo a quien juega.

### Story 5: Seguir con la misma persona al reabrir la app

**As a** persona que cierra la app
**I want** que al volver siga jugando quien estaba jugando
**So that** no tenga que elegirlo cada vez en el teléfono compartido

**Acceptance criteria:**

- [ ] **AC-5.1** Dada una persona que juega en una posición válida, Cuando el usuario cierra y vuelve a abrir la app, Entonces juega la misma persona, en la misma posición relativa a su espacio, mirando hacia donde miraba.
- [ ] **AC-5.2** Dado un cambio de jugador, Cuando se completa, Entonces quedan guardados en ese momento quién juega y su posición, de modo que un cierre inesperado pierde como máximo el último movimiento.
- [ ] **AC-5.3** Dado un jugador guardado que ya no existe, que fue eliminado o que no es el propietario ni un familiar, Cuando se abre la app, Entonces juega el propietario, en la posición guardada si es válida o, si no, en la casilla de aparición de la sala.
- [ ] **AC-5.4** Dado un hogar guardado con las features 001 a 004, sin jugador guardado, Cuando se abre la app, Entonces juega el propietario en la misma casilla que antes (AC-9.7 de la 004).
- [ ] **AC-5.5** Dado un familiar que jugaba y cuyo bloque vigente al reabrir es "Fuera de casa" o de otro espacio, Cuando se abre la app, Entonces aparece en su posición guardada como jugador, no fuera del mapa ni en su espacio.
- [ ] **AC-5.6** Dado un hogar con otro jugador, Cuando se inspeccionan los datos guardados, Entonces solo hay una posición (la de quien juega) y quién es; no hay posiciones de los demás ni de la rutina.
- [ ] **AC-5.7** Dado el mapa modificado en el modo edición de modo que la posición guardada ya no es válida, Cuando el usuario toca "Listo", Entonces quien juega aparece en la casilla de aparición de la sala (AC-7.4 de la 001).

### Story 6: Proponer un intercambio

**As a** persona que juega
**I want** proponer a otra persona cambiar una de mis actividades por una suya
**So that** nos repartamos las tareas como preferimos

**Acceptance criteria:**

- [ ] **AC-6.1** Dado el modo exploración, Cuando se muestra el mapa, Entonces se ve un botón "Intercambios" debajo de "Juega" en la esquina superior derecha; si quien juega tiene propuestas recibidas vigentes, dice "Intercambios (n)" con n igual a su número; en el modo edición el botón no se ve.
- [ ] **AC-6.2** Dado el botón "Intercambios", Cuando el usuario lo toca, Entonces se abre un panel titulado "Intercambios" con las secciones "Recibidas" y "Enviadas" de quien juega (cada una con "Ninguna" si no tiene filas), el botón "Proponer" y un botón "Cerrar".
- [ ] **AC-6.3** Dado el panel, Cuando el usuario toca "Proponer", Entonces se abre una ficha "Proponer intercambio" con dos listas sin ningún valor elegido: "Tu actividad", con las actividades que quien juega puede ofrecer, y "Por la de", con las que puede pedir (cada opción muestra el nombre de la actividad y, en "Por la de", la persona responsable), y con el botón de guardar desactivado hasta elegir las dos.
- [ ] **AC-6.4** Dadas las dos listas, Cuando se muestran, Entonces "Tu actividad" incluye solo actividades pendientes (no eliminadas ni, si son puntuales, hechas) de quien juega, y "Por la de" solo pendientes de otras personas (el propietario o un familiar, nunca una mascota); en ninguna aparece una actividad que esté en una propuesta vigente ni una repetitiva con regreso pendiente; las actividades que aún no vencen sí aparecen.
- [ ] **AC-6.5** Dada la ficha con las dos actividades elegidas, Cuando el usuario guarda, Entonces se crea la propuesta con quien juega como proponente y la persona responsable de la pedida como destinataria, la ficha se cierra, la propuesta aparece en "Enviadas" de quien propone y en "Recibidas" de la destinataria cuando esta juegue, y ninguna actividad, miembro ni espacio cambia.
- [ ] **AC-6.6** Dada una persona sin actividades que ofrecer, o sin actividades de otras personas que pedir, o un hogar donde quien juega es la única persona, Cuando se abre el panel, Entonces "Proponer" aparece desactivado con el texto "No hay actividades para intercambiar".
- [ ] **AC-6.7** Dado un hogar con 20 propuestas vigentes, Cuando se abre el panel, Entonces "Proponer" aparece desactivado con el texto "Ya hay 20 propuestas vigentes"; con 19 sigue activo.
- [ ] **AC-6.8** Dada la ficha de proponer, Cuando el usuario la cierra sin guardar, Entonces no se crea ninguna propuesta.
- [ ] **AC-6.9** Dados datos desactualizados (por ejemplo, una actividad que dejó de estar pendiente mientras la ficha estaba abierta), Cuando el usuario guarda, Entonces la propuesta se rechaza con un mensaje que explica el motivo y no se crea nada. Los motivos son: la actividad ofrecida no es de quien propone, la pedida es de quien propone o de una mascota, una de las dos no está pendiente, una está ya en una propuesta vigente, una es una repetitiva con regreso pendiente, o ya hay 20 propuestas vigentes.
- [ ] **AC-6.10** Dados nombres de actividades o de personas con aspecto de marcado, Cuando se muestran en el panel, las listas o las filas, Entonces se muestran como texto.
- [ ] **AC-6.11** Dadas tres personas A, B y C, Cuando A propone a B, Entonces la propuesta no aparece en las listas de C ni cuenta para el número de su botón.

### Story 7: Responder y retirar propuestas

**As a** persona que recibe o hace una propuesta
**I want** aceptarla o rechazarla, o retirarla si la hice yo
**So that** el reparto de tareas quede como acordamos

**Acceptance criteria:**

- [ ] **AC-7.1** Dado quien juega con propuestas recibidas vigentes, Cuando abre el panel, Entonces "Recibidas" muestra una fila por cada una con el texto "<proponente> te ofrece «<ofrecida>» por «<pedida>»" y los botones "Aceptar" y "Rechazar".
- [ ] **AC-7.2** Dada una propuesta recibida vigente, Cuando el usuario toca "Aceptar", Entonces se aplican los efectos de la Story 8, la propuesta desaparece de "Recibidas" y de "Enviadas" del proponente, y el número del botón baja en 1.
- [ ] **AC-7.3** Dada una propuesta recibida vigente, Cuando el usuario toca "Rechazar", Entonces la propuesta desaparece de las listas, ninguna actividad cambia de responsable y el número del botón baja en 1.
- [ ] **AC-7.4** Dado quien juega con propuestas enviadas vigentes, Cuando abre el panel, Entonces "Enviadas" muestra una fila por cada una con el texto "Ofreciste «<ofrecida>» a <destinataria> por «<pedida>»" y un botón "Retirar".
- [ ] **AC-7.5** Dada una propuesta enviada vigente, Cuando el usuario toca "Retirar", Entonces desaparece de las listas, ninguna actividad cambia de responsable y el número de la destinataria baja en 1.
- [ ] **AC-7.6** Dada una propuesta dirigida a una persona que no es quien juega, Cuando quien juega abre el panel, Entonces la propuesta no aparece en su "Recibidas" y no puede aceptarla ni rechazarla; solo la destinataria puede responder y solo quien propuso puede retirar.
- [ ] **AC-7.7** Dado un cambio de jugador, Cuando se completa, Entonces el número del botón y las listas del panel corresponden a la nueva persona.
- [ ] **AC-7.8** Dada una propuesta que no es vigente, Cuando se muestra, Entonces su fila dice "Ya no vigente", no ofrece "Aceptar", "Rechazar" ni "Retirar" y ofrece solo "Quitar"; al tocarlo, la fila desaparece; no cuenta para el número del botón ni para el límite de 20.
- [ ] **AC-7.9** Dadas dos propuestas recibidas por la misma persona, Cuando acepta una, Entonces la otra sigue en su lista sin cambios, porque sus actividades son distintas.
- [ ] **AC-7.10** Dado un intento de aceptar una propuesta no vigente, o de responder una ya respondida (por ejemplo con datos desactualizados), Cuando se aplica, Entonces se rechaza con un mensaje y no cambia nada.
- [ ] **AC-7.11** Dado el panel abierto, Cuando la propuesta cambia de estado, Entonces el panel muestra el cambio en menos de 100 ms.

### Story 8: Qué cambia al aceptar

**As a** persona que acepta un intercambio
**I want** que cada una pase a hacer la tarea de la otra solo la próxima vez
**So that** nadie se quede con una tarea ajena para siempre

**Acceptance criteria:**

- [ ] **AC-8.1** Dadas dos actividades puntuales, Cuando se acepta el intercambio, Entonces cada una pasa a la persona responsable de la otra, y su nombre, icono, espacio, vencimiento y tipo no cambian.
- [ ] **AC-8.2** Dadas dos repetitivas, Cuando se acepta el intercambio, Entonces cada una pasa a la persona responsable de la otra y recuerda a su responsable original; el resto de sus datos no cambia.
- [ ] **AC-8.3** Dadas una puntual y una repetitiva, Cuando se acepta, Entonces ambas cambian de responsable y solo la repetitiva recuerda a su responsable original.
- [ ] **AC-8.4** Dada una repetitiva con regreso pendiente, Cuando cualquier jugador toca "Hecho" en ella, Entonces su vencimiento pasa a hoy más su frecuencia (AC-3.3 de la 003), vuelve a su responsable original y deja de mostrar la nota "por intercambio".
- [ ] **AC-8.5** Dada una puntual intercambiada, Cuando cualquier jugador toca "Hecho" en ella, Entonces se registra hecha hoy como en la 003 y deja de estar pendiente.
- [ ] **AC-8.6** Dada una repetitiva con regreso pendiente, Cuando se muestra la hoja de su lugar, la ficha de edición o la lista del panel de actividades, Entonces muestra a la persona responsable actual y la nota "por intercambio (vuelve a <responsable original>)".
- [ ] **AC-8.7** Dada una actividad que cambió de responsable, Cuando se muestra el mapa, Entonces la burbuja de las actividades sin espacio queda sobre su nuevo responsable (o, si el nuevo responsable es un familiar fuera, se señala en el cartel); las actividades con espacio conservan su burbuja en su espacio.
- [ ] **AC-8.8** Dado un intercambio aceptado, Cuando se muestra el mapa, Entonces el estado y las insignias de los espacios no cambian, porque dependen del espacio y del atraso de la actividad y no de su responsable.
- [ ] **AC-8.9** Dado un intercambio aceptado, Cuando se cuentan las actividades pendientes del hogar y de cada persona, Entonces el total del hogar no cambia y el de cada persona refleja a su responsable actual.
- [ ] **AC-8.10** Dada una repetitiva con regreso pendiente cuyo responsable original fue eliminado, Cuando alguien toca "Hecho", Entonces su vencimiento avanza como siempre y se queda con la persona que la tiene, sin nota "por intercambio".
- [ ] **AC-8.11** Dada una repetitiva con regreso pendiente, Cuando el usuario la reasigna a otra persona desde su ficha en el modo edición, Entonces deja de recordar a su responsable original; Cuando guarda la ficha sin cambiar a la persona responsable, la conserva.
- [ ] **AC-8.12** Dada una repetitiva con regreso pendiente, Cuando el usuario cambia su tipo a puntual desde su ficha, Entonces deja de recordar a su responsable original.
- [ ] **AC-8.13** Dada una repetitiva con regreso pendiente, Cuando se elimina a su responsable original, Entonces deja de recordarlo y se queda con quien la tiene; Cuando se elimina a quien la tiene, Entonces se elimina con sus demás actividades, y la confirmación de eliminar cuenta esa actividad.
- [ ] **AC-8.14** Dada una repetitiva con regreso pendiente, Cuando se abren las listas de la ficha de proponer, Entonces no aparece ni como ofrecida ni como pedida; vuelve a aparecer cuando regresa a su responsable original.
- [ ] **AC-8.15** Dado un intercambio aceptado, Cuando se inspecciona el registro de las dos actividades y de la propuesta, Entonces su auditoría se actualizó y la propuesta quedó como aceptada, con la fecha en que se respondió.

### Story 9: Cuándo una propuesta deja de ser vigente

**As a** persona que recibe una propuesta
**I want** que no se pueda aceptar una propuesta cuyas actividades ya no son las que se propusieron
**So that** no acepte algo distinto de lo que se ofreció

**Acceptance criteria:**

- [ ] **AC-9.1** Dada una propuesta vigente, Cuando se edita cualquiera de sus dos actividades (nombre, icono, responsable, espacio, tipo, vencimiento o frecuencia), Entonces la propuesta deja de ser vigente.
- [ ] **AC-9.2** Dada una propuesta vigente, Cuando se elimina cualquiera de sus dos actividades, Entonces deja de ser vigente.
- [ ] **AC-9.3** Dada una propuesta vigente, Cuando cualquiera de sus dos actividades se marca "Hecho", Entonces deja de ser vigente (una puntual deja de estar pendiente; una repetitiva cambia su vencimiento).
- [ ] **AC-9.4** Dada una propuesta vigente, Cuando se elimina a una de las personas involucradas, o el espacio de una de las actividades (con lo cual la actividad se elimina), Entonces deja de ser vigente.
- [ ] **AC-9.5** Dada una propuesta vigente, Cuando se renombra a una de las personas o a un espacio, Entonces sigue siendo vigente.
- [ ] **AC-9.6** Dada una propuesta vigente, Cuando cambia el día, Entonces sigue siendo vigente aunque una actividad pase a estar vencida.
- [ ] **AC-9.7** Dada una propuesta que dejó de ser vigente, Cuando el usuario edita o restaura la actividad a su valor anterior, Entonces la propuesta no vuelve a ser vigente.
- [ ] **AC-9.8** Dada una propuesta que dejó de ser vigente, Cuando se abren las listas de la ficha de proponer, Entonces las actividades de esa propuesta vuelven a estar disponibles para otra propuesta (si cumplen AC-6.4).
- [ ] **AC-9.9** Dado un intercambio aceptado, Cuando cambian las actividades involucradas, Entonces no se deshace ni se vuelve a mostrar: queda como aceptado.
- [ ] **AC-9.10** Dado cada tipo de cambio de AC-9.1 a AC-9.4, Cuando se aplica en el modo edición con el panel cerrado, Entonces no se muestra ningún aviso: la propuesta aparece como "Ya no vigente" la próxima vez que se abra el panel.

### Story 10: Conservar lo que ya tenía y los intercambios

**As a** usuario
**I want** que al volver a abrir la app estén mis intercambios y que mi hogar anterior siga igual
**So that** no pierda nada

**Acceptance criteria:**

- [ ] **AC-10.1** Dados intercambios en cualquier estado y repetitivas con la nota "por intercambio", Cuando el usuario cierra y vuelve a abrir la app, Entonces siguen las mismas propuestas con los mismos estados, y las mismas repetitivas con su regreso pendiente.
- [ ] **AC-10.2** Dada una propuesta creada, respondida, retirada o quitada, Cuando se aplica, Entonces el cambio queda guardado en el momento.
- [ ] **AC-10.3** Dado un hogar guardado con la feature 001, 002, 003 o 004, Cuando se abre la app, Entonces se muestran todos sus espacios, habitantes, actividades, rutinas y nombres, sin ningún aviso de error y sin intercambios; ninguna actividad tiene regreso pendiente; y los datos pasan a guardarse en el formato nuevo en el siguiente guardado.
- [ ] **AC-10.4** Dados datos guardados con una actividad activa inválida por su regreso pendiente (que no es nulo ni una persona activa distinta de su responsable, o que está en una puntual), Cuando se abre la app, Entonces se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001.
- [ ] **AC-10.5** Dados datos guardados sin lista de intercambios, o con un intercambio pendiente con un estado fuera de la lista, con referencias a miembros o actividades que no existen, o con marcas que no son texto, Cuando se abre la app, Entonces se muestra el mismo aviso y se crea el hogar inicial.
- [ ] **AC-10.6** Dados intercambios ya respondidos o retirados con datos inválidos (más allá de su estado) y todos los demás datos válidos, o actividades eliminadas con un regreso pendiente inválido, Cuando se abre la app, Entonces el hogar se abre con normalidad, sin aviso.
- [ ] **AC-10.7** Dado un hogar con intercambios, Cuando se inspeccionan los datos guardados, Entonces no hay ninguna vigencia calculada, ningún número de propuestas por persona ni ninguna posición de los demás miembros.
- [ ] **AC-10.8** Dado un hogar con intercambios y la app cerrada de forma inesperada, Cuando se vuelve a abrir, Entonces se pierde como máximo el último cambio no aplicado.

### Story 11: Identidad estable de las propuestas

**As a** propietario que más adelante compartirá su hogar con su familia
**I want** que cada propuesta conserve su identidad aunque cambie su estado
**So that** futuras funciones, como las calificaciones, se apoyen en ella sin perder datos

**Acceptance criteria:**

- [ ] **AC-11.1** Dada una propuesta, Cuando se acepta, se rechaza, se retira o se quita, Entonces su identificador sigue siendo el mismo.
- [ ] **AC-11.2** Dada una propuesta creada o modificada, Cuando se inspecciona su registro, Entonces contiene fecha de creación, fecha de última modificación y la cuenta local del propietario como autora.
- [ ] **AC-11.3** Dadas propuestas guardadas, Cuando se inspeccionan los datos guardados, Entonces cada una pertenece al hogar y referencia a las dos personas y a las dos actividades por identificador, y ninguna referencia una cuenta.
- [ ] **AC-11.4** Dada una propuesta, Cuando se renombra a una persona o a un espacio, o un espacio cambia de nombre automático, Entonces sigue vinculada a las mismas.
- [ ] **AC-11.5** Dada una propuesta respondida o retirada, Cuando se inspecciona su registro, Entonces conserva su identificador y no se borra; una propuesta quitada conserva el estado de rechazada o retirada según quien la quitó.

## Functional Requirements

### FR-1: Jugador activo y selector

El **jugador activo** es una persona (el propietario o un familiar) que, en este teléfono, mueve la cruceta, actúa y se resalta en el mapa.

**Must:**
- Mostrar en exploración el botón "Juega: <nombre>" y la lista "¿Quién juega?" con el propietario y los familiares activos, sin mascotas, con quien juega marcado.
- Permitir elegir a cualquier persona de la lista, incluida un familiar que está fuera de casa.
- Jugar el propietario si no hay un jugador guardado o el guardado no existe.
- Resaltar la etiqueta de nombre de quien juega, y solo la suya, en exploración y en edición.
- Cerrar las hojas, el panel y las fichas abiertos al cambiar de jugador.
- Mostrar los textos escritos por el usuario (nombres) siempre como texto.

**Must not:**
- Permitir que una mascota juegue.
- Mostrar el botón ni la lista en el modo edición.
- Crear, eliminar o mover un espacio, un miembro o una actividad como efecto de cambiar de jugador.

### FR-2: Cambio de jugador

**Must:**
- Hacer que la nueva persona pase a ser el personaje que mueve la cruceta en la casilla que ocupaba (o a la que se dirigía), sin teletransporte, y centrar la cámara en ella.
- Hacer que la persona que jugaba quede en su casilla y camine sola, con la dirección y el objetivo que le corresponden (FR-3).
- Aplicar el cambio al terminar el paso en curso de quien juega.
- Dejar a todos los demás sin saltos y sin superponerse (los que no están en ruta nunca comparten casilla entre sí ni con quien juega).
- Guardar en el momento quién juega y su posición.

**Must not:**
- Mover a nadie al cambiar de jugador, salvo a un familiar fuera, que aparece en la entrada (FR-4).
- Dejar a dos personajes controlados a la vez.

### FR-3: Movimiento de quien no juega

**Must:**
- Hacer que el propietario, cuando no juega, pasee al azar por toda la casa con las pausas y los tramos de la feature 002.
- Hacer que un familiar que no juega siga su rutina como en la feature 004 (objetivo de espacio, fuera o libre) y que uno que juega no tenga objetivo.
- Mantener las mascotas como en la feature 002.
- Al abrir la app y al tocar "Listo", colocar primero a quien juega y después a los demás miembros, incluido el propietario si no juega.

**Must not:**
- Aplicar una rutina al propietario ni a las mascotas.
- Hacer que un familiar que juega salga por la entrada o quede limitado a un espacio por su rutina.

### FR-4: Familiar fuera de casa como jugador

**Must:**
- Hacer aparecer en la entrada, de inmediato, al familiar fuera que se elige como jugador, o en la casilla transitable libre más cercana por camino si la entrada está ocupada, siempre la misma para el mismo mapa y las mismas casillas ocupadas.
- Dejar de contarlo en el cartel desde que aparece.
- Al dejar de jugar, devolverlo a su rutina de ese momento: si debe estar fuera, camina a la entrada y sale.

**Must not:**
- Dejar que el jugador salga del hogar por la entrada.
- Colocarlo en la casilla de otro habitante.

### FR-5: Actuar como quien juega

**Must:**
- Permitir a cualquier jugador entrar al modo edición, marcar "Hecho" en cualquier actividad por hacer y abrir las fichas de cualquier miembro.
- En el modo edición, abrir al tocar una casilla, con esta prioridad: la ficha del miembro que la ocupa (jugador, propietario o habitante), la hoja del cartel, la hoja de la burbuja, la ficha del espacio.
- Si se elimina al familiar que juega, pasar el juego al propietario, en la casilla donde estaba el propietario.
- Ofrecer "Rutina" en la ficha de todo familiar, juegue o no.

**Must not:**
- Restringir qué actividades o fichas puede usar cada jugador.
- Ofrecer "Eliminar" en la ficha del propietario.

### FR-6: Persistencia del jugador

**Must:**
- Guardar quién juega junto con su posición, en el momento de cada cambio de jugador y en los momentos en que ya se guardaba la posición.
- Al abrir la app, hacer jugar a la persona guardada en su posición guardada si es válida (AC-7.4 de la 001) y, si ya no existe o no puede jugar, al propietario.
- Abrir un hogar guardado sin jugador con el propietario en su posición guardada.
- Guardar solo la posición de quien juega, no las de los demás.

**Must not:**
- Enviar datos fuera del dispositivo.
- Guardar objetivos, rutas ni la vigencia de las propuestas.

### FR-7: Proponer un intercambio

Una **propuesta** cambia una actividad pendiente de quien propone (la **ofrecida**) por una actividad pendiente de otra persona (la **pedida**).

**Must:**
- Permitir proponer solo a quien juega, ofreciendo una actividad suya pendiente.
- Permitir pedir una actividad pendiente de otra persona (propietario o familiar), también si aún no vence.
- Mostrar en las listas solo las actividades que cumplen las reglas y no permitir elegir otras.
- Rechazar con un mensaje que explique el motivo una propuesta cuya ofrecida no es de quien propone, cuya pedida es de quien propone o de una mascota, cuyas actividades no están pendientes, con una actividad ya en una propuesta vigente, con una repetitiva con regreso pendiente, o cuando ya hay 20 propuestas vigentes.
- Dejar sin cambios las actividades hasta que se acepte la propuesta.

**Must not:**
- Permitir contraofertas, varias actividades por propuesta, ni una actividad en dos propuestas vigentes a la vez.
- Proponer con o a una mascota.
- Crear, eliminar o cambiar un espacio, un miembro u otra actividad como efecto de proponer.

### FR-8: Responder, retirar y quitar

**Must:**
- Mostrar a quien juega sus propuestas recibidas vigentes con "Aceptar" y "Rechazar" y las enviadas vigentes con "Retirar", y el número de recibidas vigentes en el botón "Intercambios (n)".
- Permitir aceptar o rechazar solo a la destinataria y retirar solo a quien propuso.
- Aceptar solo propuestas vigentes y solo una vez.
- Mostrar una propuesta que no es vigente como "Ya no vigente", sin acciones salvo "Quitar", que la deja como rechazada (si la quita la destinataria) o retirada (si la quita quien propuso).
- No contar en el número del botón ni en el límite de 20 las propuestas que no son vigentes.
- Marcar la propuesta como aceptada, rechazada o retirada con la fecha en que se respondió, sin borrar su registro.

**Must not:**
- Permitir que quien propone la acepte o rechace, ni que la destinataria la retire.
- Cambiar las actividades al rechazar, retirar o quitar.

### FR-9: Efecto de aceptar

**Must:**
- Intercambiar los responsables de las dos actividades y actualizar su auditoría.
- En cada repetitiva, recordar a su responsable original hasta que se haga; en una puntual, no recordar nada.
- Al marcar "Hecho" una repetitiva con regreso pendiente, avanzar su vencimiento a hoy más su frecuencia y devolverla a su responsable original; si este ya no está activo, dejarla con quien la tiene.
- Borrar el regreso pendiente cuando se reasigna la actividad a otra persona desde su ficha, cuando se cambia su tipo a puntual y cuando se elimina a su responsable original.
- Mostrar a la persona responsable actual en burbujas, hojas, fichas y listas, y la nota "por intercambio (vuelve a <responsable original>)" en las repetitivas con regreso pendiente.
- Mantener el límite de 50 pendientes, el estado de los espacios y las burbujas como en la feature 003.

**Must not:**
- Volver a intercambiar una repetitiva con regreso pendiente hasta que vuelva a su responsable original.
- Cambiar el vencimiento, el nombre, el icono, el espacio o el tipo de las actividades por el solo hecho de intercambiarlas.

### FR-10: Vigencia

**Must:**
- Considerar vigente una propuesta pendiente cuyas dos actividades siguen pendientes y sin ningún cambio desde que se propuso.
- Considerar que una edición, una eliminación (directa o en cascada), un "Hecho" o un intercambio aceptado de cualquiera de las dos actividades deja la propuesta como no vigente, también si luego se restaura el valor anterior.
- Calcular la vigencia a partir de los datos guardados y no guardarla.
- No anular una propuesta por renombrar a una persona o a un espacio, ni por el paso de los días.

**Must not:**
- Permitir aceptar una propuesta no vigente.
- Pedir confirmación ni mostrar avisos al editar o eliminar una actividad que está en una propuesta vigente.

### FR-11: Botones y panel

**Must:**
- Mostrar en exploración los botones "Juega" e "Intercambios" en la esquina superior derecha, debajo de "Editar", con un tamaño táctil legible, sin tapar la cruceta ni el cartel de la entrada y sin capturar la cruceta.
- Abrir con "Intercambios" un panel con "Recibidas", "Enviadas", "Proponer" y "Cerrar", y la ficha de proponer con dos listas sin valor inicial.
- Actualizar el panel en menos de 100 ms tras cada acción.

**Must not:**
- Mostrar estos botones ni el panel en el modo edición.
- Cambiar el aspecto de las burbujas por un intercambio.

### FR-12: Persistencia y compatibilidad

**Must:**
- Guardar en el dispositivo las propuestas y el regreso pendiente de las actividades junto con el resto del hogar, cada vez que cambian.
- Restaurarlos al reabrir la app.
- Abrir sin pérdida y sin aviso de error un hogar guardado con la feature 001, 002, 003 o 004, sin propuestas y sin regreso pendiente, y guardarlo a partir de entonces en el formato nuevo.
- Considerar ilegibles los datos guardados que no cumplen las condiciones de las versiones anteriores o que tienen una actividad activa con un regreso pendiente inválido, falta la lista de propuestas, o una propuesta pendiente con un estado fuera de la lista, referencias inexistentes o marcas que no son texto; en ese caso, mostrar un aviso y crear el hogar inicial de la feature 001.
- Ignorar, al validar, las actividades eliminadas y las propuestas ya respondidas o retiradas (más allá de su estado).

**Must not:**
- Perder o modificar los espacios, los habitantes, las actividades, las rutinas, los nombres o la posición del personaje de un hogar de las features 001 a 004 al abrirlo.
- Guardar la vigencia, los números de propuestas, objetivos ni posiciones de quienes no juegan.
- Enviar datos fuera del dispositivo.

### FR-13: Identidad y preparación multiusuario

**Must:**
- Dar a cada propuesta un identificador estable y globalmente único que no cambie al responderla.
- Registrar en cada propuesta la fecha de creación, la de última modificación y la cuenta autora.
- Referenciar a las personas y a las actividades de una propuesta por identificador, nunca por nombre ni posición, y no vincular una propuesta a una cuenta.
- Conservar los registros de las propuestas respondidas, retiradas o quitadas.

**Must not:**
- Perder el vínculo de una propuesta con sus personas y actividades al renombrarlas, renumerar o mover un espacio.

## Non-Functional Requirements

### Performance

- El movimiento de los personajes se mantiene a 60 cuadros por segundo en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares en ruta a la vez, 4 mascotas, el propietario caminando solo y 50 actividades por hacer repartidas por todos los espacios del hogar de mayor tamaño permitido.
- El cambio de jugador, las acciones del panel de intercambios y el cambio de estado de una propuesta muestran el mapa y el panel actualizados en menos de 100 ms en el dispositivo de referencia.
- El cálculo de la vigencia y de las listas de la ficha de proponer, con 50 actividades y 20 propuestas, no produce una pausa perceptible.

### Security

- No hay autenticación en esta feature: la cuenta del propietario es local y cualquier persona del teléfono puede jugar como cualquiera. Es una decisión consciente de la v1 de teléfono compartido.
- Ningún dato sale del dispositivo.
- Los textos escritos por el usuario (nombres de miembros, de espacios y de actividades) se muestran siempre como texto, nunca interpretados como marcado, en el botón, la lista, el panel, las filas y las fichas.

### Reliability

- El cambio de jugador se verifica de forma automática sin interfaz: para un estado, un jugador y un nuevo jugador, el resultado es un jugador nuevo y una lista de móviles en la que nadie comparte casilla con otro que no esté en ruta ni con quien juega, incluidos los casos del propietario, de un familiar visible, de un familiar fuera, de la entrada ocupada y de un familiar eliminado que juega.
- Las reglas de las propuestas se verifican de forma automática con un reloj inyectado: la lista completa de motivos de rechazo (AC-6.9), los efectos de aceptar con puntuales y repetitivas (AC-8.1 a AC-8.14) y la vigencia ante cada operación que cambia una actividad: editar, eliminar, "Hecho", aceptar otra propuesta, la baja de un espacio y la baja de un miembro (AC-9.1 a AC-9.8).
- Nunca queda una propuesta vigente que apunte a una actividad eliminada o ya hecha, ni una actividad activa con regreso pendiente a una persona eliminada; se verifica de forma automática para cualquier eliminación de un espacio o de un miembro, incluidos los dos casos de un cuarto con baño interno.
- Un hogar guardado con la feature 001, 002, 003 o 004 se abre sin pérdida de datos. Se verifica de forma automática con documentos guardados de esas features, incluidos documentos corruptos y propuestas o regresos pendientes inválidos.
- Un cierre inesperado de la app pierde como máximo el último cambio no aplicado.
- Toda operación que cambia una actividad (editar, eliminar, "Hecho", aceptar un intercambio, y las bajas en cascada de un espacio o de un miembro) deja como no vigente a la propuesta vigente que la incluye, también cuando dos operaciones ocurren en el mismo instante del reloj; una prueba de contrato lo comprueba para cada operación.

### Usability

- Los botones "Juega" e "Intercambios", la lista, el panel y las filas tienen un tamaño legible y táctil en un teléfono en vertical, y el texto del jugador resaltado se distingue sin leer el nombre, con el mismo criterio de legibilidad que las etiquetas de la feature 001 y las burbujas de la 003.
- Las acciones destructivas o irreversibles (aceptar, rechazar) no piden confirmación: se pueden retirar o reproponer, y el panel muestra el resultado.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| El usuario intenta guardar una propuesta sin elegir las dos actividades | El botón de guardar permanece desactivado; no se crea nada |
| Una actividad deja de estar disponible mientras la ficha de proponer está abierta | Al guardar, se rechaza con un mensaje que explica el motivo; no se crea nada |
| Hay 20 propuestas vigentes | "Proponer" está desactivado con el texto "Ya hay 20 propuestas vigentes" |
| No hay nada que ofrecer, nada que pedir, o quien juega es la única persona | "Proponer" está desactivado con el texto "No hay actividades para intercambiar" |
| Una de las dos actividades de una propuesta se edita, elimina o marca "Hecho" | La propuesta deja de ser vigente, se muestra como "Ya no vigente" y no se puede aceptar |
| Se elimina a una persona involucrada en una propuesta | La propuesta deja de ser vigente |
| Se intenta aceptar una propuesta no vigente o ya respondida | Se rechaza con un mensaje y no cambia nada |
| Se elige como jugador a un familiar fuera de casa | Aparece en la entrada (o en la casilla libre más cercana si está ocupada) y su rutina queda en pausa |
| Se elimina al familiar que juega | Juega el propietario, en la casilla donde estaba |
| El jugador guardado ya no existe al abrir la app | Juega el propietario, en la posición guardada si es válida, si no en la casilla de aparición de la sala |
| Falla el guardado en el dispositivo | Se muestra un aviso no bloqueante y la sesión continúa con los datos en memoria; se reintenta en el siguiente guardado |
| Los datos guardados no se pueden leer o tienen un regreso pendiente o una propuesta pendiente inválidos al abrir la app | Se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001 |
| Se elimina a quien tiene una repetitiva con regreso pendiente | La actividad se elimina con sus demás actividades y la confirmación la cuenta |

## Open Questions

- Ninguna bloqueante. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-08 y las dos decisiones de arquitectura están registradas en los ADR enlazados.
- **Resueltas en esta spec** (puntos que el PRD dejó para la spec): el jugador se distingue con la etiqueta de nombre resaltada (AC-2.8); los botones "Juega" e "Intercambios" van en la esquina superior derecha, debajo de "Editar" (AC-1.1, AC-6.1); las hojas, el panel y las fichas abiertos se cierran al cambiar de jugador (AC-2.9); no se avisa al editar o eliminar una actividad de una propuesta vigente (FR-10, AC-9.10); la prioridad al tocar en el modo edición es miembro que ocupa la casilla, cartel, burbuja, espacio (AC-4.5); una propuesta que deja de ser vigente se muestra como "Ya no vigente" con la única acción "Quitar" (AC-7.8).
- **Decisiones que esta spec tomó sobre puntos que el PRD no cerraba**, a confirmar al aprobarla: (a) la nota "por intercambio" se muestra solo en las repetitivas con regreso pendiente, no en las puntuales, porque una puntual intercambiada no guarda nada que recordar (AC-8.6); (b) si se elimina a quien tiene en su poder una repetitiva por un intercambio, la actividad se elimina con él en lugar de volver a su responsable original (AC-8.13), porque la baja en cascada de la 003 es por responsable actual; (c) el texto fijo de los avisos: "Fuera de casa · entra por la puerta", "Ya no vigente", "No hay actividades para intercambiar", "Ya hay 20 propuestas vigentes".
- Riesgos de legibilidad y de rendimiento, a medir en un teléfono con la verificación de la fase de integración del plan y a ajustar con evidencia: con 13 personajes en pantalla (12 móviles y el jugador) más etiquetas, burbujas, insignias, objetos y el cartel, el mapa puede saturarse; y el propietario caminando solo suma recorridos a un mapa con 8 familiares en ruta.

## Out of Scope (Future Considerations)

- Calificaciones con estrellas, historial de actividades hechas y quién hizo cada una (feature 006).
- Contraofertas, intercambios múltiples y favores con "deuda".
- Cuentas, inicio de sesión, un dispositivo por persona y sincronización (pieza de multiusuario).
- Notificaciones, recordatorios y alarmas.
- Restringir qué puede hacer cada jugador (permisos por persona).
- Rutinas o actividades propias para las mascotas, y que las mascotas jueguen o intercambien.
- Avisar al editar o eliminar una actividad que está en una propuesta vigente.
- Arte definitivo, animaciones, sonido y música.
