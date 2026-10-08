# Feature 004: Rutinas

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-06
**Branch:** `feat/004-rutinas`
**Source:** [prd.md](prd.md) · [ADR modelo de rutinas](../../adr/004-modelo-rutinas-formato-v4.md) · [ADR movimiento hacia un objetivo](../../adr/004-movimiento-hacia-objetivo-reloj.md) · se apoya en la [spec 001](../001-mapa-editor-hogar/spec.md) (v1.1.0), la [spec 002](../002-familiares-y-mascotas/spec.md) (v1.0.0) y la [spec 003](../003-actividades/spec.md) (v1.0.0)

---

## Problem Statement

Livin existe para que las personas que comparten un hogar vean de un vistazo cómo está la casa y quién se encarga de qué. Hoy los familiares caminan al azar por toda la casa a cualquier hora: el mapa no dice quién está en casa, quién salió a trabajar ni dónde está cada uno. Esta feature agrega las rutinas de los familiares. El usuario describe, para cada familiar, en qué espacio suele estar y cuándo sale de casa, con un horario de lunes a viernes y otro de sábado y domingo. El mapa muestra a cada familiar donde dice su rutina en ese momento: camina hasta su espacio cuando empieza un bloque, sale por la entrada del hogar cuando se va y vuelve a entrar cuando regresa, y un cartel junto a la entrada dice quiénes están fuera.

## Goals

- El usuario define, en el modo edición, la rutina de cada familiar: dos horarios (lunes a viernes, y sábado y domingo) de hasta 8 bloques cada uno, con inicio y fin en pasos de 30 minutos y un lugar (un espacio o fuera de casa).
- En el modo exploración el mapa sigue la hora del dispositivo: el familiar camina hasta el espacio de su bloque y pasea solo dentro de él; con un bloque fuera de casa camina hasta la entrada y desaparece del mapa, y al terminar el bloque reaparece por la entrada.
- Fuera de todo bloque, y para los familiares sin rutina, el movimiento sigue siendo el de la feature 002.
- Al abrir la app y al salir del modo edición cada familiar aparece directamente donde dice su rutina en ese momento, sin repetir el camino que no se vio.
- Un cartel junto a la entrada dice cuántos familiares están fuera, a qué hora vuelve cada uno y quiénes tienen actividades por hacer sin espacio; también se ve y se usa en el modo edición.
- Eliminar un espacio o un familiar elimina sus bloques, y la confirmación avisa cuántos bloques y cuántas actividades se eliminarán.
- Las rutinas se conservan entre sesiones y los hogares guardados con las features 001, 002 y 003 se abren sin perder datos.
- El mapa se mantiene al día con la hora, también con la app abierta.

## Non-Goals

- No hay rutinas para las mascotas ni para el personaje del propietario.
- No hay bloques que crucen la medianoche: dormir de 23:00 a 07:00 se registra como 23:00–24:00 y 00:00–07:00.
- No hay horarios por día de la semana ni días festivos: solo lunes a viernes y sábado y domingo.
- No hay actividades con hora, ni familiares que caminen hasta el espacio de una actividad; las actividades de la feature 003 no cambian.
- No hay notificaciones, recordatorios ni alarmas.
- No se puede copiar un horario a otro ni hay plantillas de rutina.
- No se muestra dónde está un familiar mientras está fuera de casa.
- No hay cuentas, inicio de sesión ni sincronización para los familiares; el propietario define las rutinas de todos.
- El jugador no puede salir del hogar por la entrada.

## Users and Context

**Primary users:** el propietario del hogar, que usa la app solo, en un único dispositivo y sin conexión. Es quien define las rutinas de todos los familiares, que no tienen cuenta ni usan la app.
**Secondary users:** los familiares, que en features futuras tendrán su propia cuenta y podrán ajustar su propia rutina. En esta feature no interactúan con la app; los bloques apuntan a un miembro, no a una cuenta.
**Usage context:** sesiones cortas en el celular, en orientación vertical. El usuario configura las rutinas una vez y las ajusta de vez en cuando; en el día a día recorre el mapa, ve quién está en casa y dónde por la posición de cada familiar y por el cartel de la entrada.
**User mental model:** el mismo de las features 001 a 003 (vista desde arriba, espacios, habitantes, modo edición y modo exploración). Vocabulario nuevo: "rutina" (los dos horarios de un familiar); "horario" ("Lun–Vie" o "Sáb–Dom"); "bloque" (un tramo del día con un lugar); "lugar de un bloque" (un espacio o "Fuera de casa"); "bloque vigente" (el bloque de hoy que cubre la hora actual: empieza en su inicio y termina justo en su fin); "entrada" (la puerta del hogar, en la pared inferior de la sala); "cartel" (la señal junto a la entrada con quiénes están fuera); "fuera" (un familiar que salió por la entrada y no está en el mapa); "en ruta" (un familiar que camina hacia su lugar o hacia la entrada porque su bloque cambió).

**Relación con las specs anteriores.** Esta feature reemplaza las exclusiones de las specs 001, 002 y 003 sobre rutinas, horarios y el estado "fuera de casa". Amplía reglas existentes:

- **Movimiento (spec 002, FR-5, AC-4.1 y AC-4.3):** los familiares con bloque vigente caminan hacia su lugar en vez de hacerlo al azar; fuera de todo bloque, y sin rutina, se mueven como antes. Las mascotas y el personaje del propietario no cambian.
- **No superposición (spec 002, FR-5, FR-6 y AC-5.4):** un familiar en ruta puede pasar por la casilla de otro habitante. Los habitantes que no están en ruta nunca comparten casilla entre sí ni con el jugador, y nadie comparte casilla con el jugador. El jugador sigue sin poder entrar en una casilla ocupada por un habitante.
- **Colocación (spec 002, FR-7, AC-6.1 y AC-6.2):** al abrir la app y al tocar "Listo", cada familiar con bloque vigente aparece en su espacio, o no aparece si está fuera; el resto se coloca como antes.
- **Habitantes quietos (spec 002, AC-7.2):** en el modo edición los familiares que están fuera siguen sin verse.
- **Toque en el modo edición (spec 002, AC-7.3 y AC-7.4; spec 003, AC-6.8):** la prioridad pasa a ser personaje del propietario, habitante, cartel de la entrada, burbuja, espacio.
- **Burbujas de actividades sin espacio (spec 003, AC-2.5):** mientras el familiar está fuera no hay burbuja sobre él; las señala el cartel.
- **Confirmaciones de eliminar (spec 003, AC-7.1, AC-7.4, AC-7.6 y AC-7.7; spec 002, AC-8.1):** cuentan también los bloques de rutina.
- **Generador (spec 001, FR-3 y FR-5):** la pared inferior de la sala gana una casilla transitable, la entrada; el resto de la distribución no cambia.

El resto de las specs 001, 002 y 003 sigue vigente sin cambios.

## User Stories

### Story 1: Definir la rutina de un familiar

**As a** propietario del hogar
**I want** describir, para cada familiar, en qué espacio suele estar y cuándo sale de casa
**So that** el mapa muestre dónde está cada uno a cada hora

**Acceptance criteria:**

- [ ] **AC-1.1** Dado el modo edición, Cuando el usuario abre la ficha de un familiar, Entonces, además de sus datos actuales y de las opciones de guardar y Eliminar, la ficha ofrece "Rutina"; la ficha de una mascota y la del personaje del propietario no la ofrecen.
- [ ] **AC-1.2** Dada la ficha de un familiar sin bloques, Cuando el usuario toca "Rutina", Entonces se abre su rutina con un selector de horario con "Lun–Vie" elegido, el texto "Sin bloques", el contador "0 de 8" y el botón "+ Bloque" activo.
- [ ] **AC-1.3** Dada la rutina de un familiar con bloques en ambos horarios, Cuando el usuario cambia el selector entre "Lun–Vie" y "Sáb–Dom", Entonces la lista, ordenada por inicio, muestra solo los bloques del horario elegido, cada uno con el formato "09:00–18:00 · Fuera de casa" o "09:00–18:00 · <nombre del espacio>", y el contador cuenta solo los de ese horario.
- [ ] **AC-1.4** Dada la rutina de un familiar, Cuando el usuario toca "+ Bloque", Entonces se abre una ficha de alta que indica el horario elegido, con una lista de inicio (de 00:00 a 23:30, cada 30 minutos) sin ningún valor elegido, una lista de fin (de 00:30 a 24:00, cada 30 minutos) sin ningún valor elegido, una lista de lugar con "Fuera de casa" y todos los espacios activos (con el nombre con que se muestran, sin pasillos) sin ninguno elegido, y el botón de guardar desactivado.
- [ ] **AC-1.5** Dada la ficha de alta, Cuando falta elegir el inicio, el fin o el lugar, Entonces el botón de guardar permanece desactivado y no se crea ningún bloque.
- [ ] **AC-1.6** Dada la ficha de alta con inicio 09:00, fin 18:00 y "Fuera de casa", Cuando el usuario guarda, Entonces el bloque se crea, la ficha se cierra, el bloque aparece en la lista como "09:00–18:00 · Fuera de casa", el contador sube en 1 y ningún familiar, espacio ni otro bloque se crea, elimina o cambia.
- [ ] **AC-1.7** Dada la ficha de alta con el fin igual o anterior al inicio, Cuando el usuario guarda, Entonces el guardado se rechaza con un mensaje que explica que el fin debe ser posterior al inicio, no se crea ningún bloque y la ficha sigue abierta con los valores elegidos.
- [ ] **AC-1.8** Dado un bloque 09:00–13:00 en "Lun–Vie", Cuando el usuario guarda otro bloque 12:00–14:00 en "Lun–Vie", Entonces el guardado se rechaza con un mensaje que explica que se superpone con otro bloque y no se crea nada; Cuando guarda 13:00–14:00 (empieza justo donde termina el otro), Entonces se acepta; Cuando guarda 12:00–14:00 en "Sáb–Dom", Entonces se acepta, porque los dos horarios son independientes.
- [ ] **AC-1.9** Dados 8 bloques en un horario de un familiar, Cuando el usuario abre ese horario, Entonces el contador muestra "8 de 8" y el botón "+ Bloque" aparece desactivado; en el otro horario del mismo familiar, y en el de otro familiar, el botón sigue activo si no tiene 8.
- [ ] **AC-1.10** Dada la ficha de alta, Cuando el usuario la cierra sin guardar, Entonces no se crea ningún bloque.
- [ ] **AC-1.11** Dados dos familiares, Cuando el usuario crea bloques para uno, Entonces el otro no cambia, porque cada familiar tiene su propia rutina.
- [ ] **AC-1.12** Dado un espacio con nombre escrito por el usuario que contiene texto con aspecto de marcado, Cuando se muestra en la lista de lugares o en un bloque, Entonces se muestra como texto.

### Story 2: Corregir y quitar bloques

**As a** propietario del hogar
**I want** cambiar o quitar un bloque de la rutina de un familiar
**So that** su rutina refleje su vida real

**Acceptance criteria:**

- [ ] **AC-2.1** Dada la rutina de un familiar con bloques, Cuando el usuario toca un bloque de la lista, Entonces se abre su ficha con su horario, su inicio, su fin y su lugar actuales, y con las opciones de guardar y Eliminar.
- [ ] **AC-2.2** Dada la ficha de un bloque con un cambio válido de inicio, fin o lugar, Cuando el usuario guarda, Entonces la ficha se cierra, la lista muestra el bloque con los valores nuevos en el orden que le corresponde por inicio y el identificador del bloque no cambia.
- [ ] **AC-2.3** Dados dos bloques 09:00–13:00 y 14:00–18:00 en un horario, Cuando el usuario edita el segundo para que sea 12:00–18:00, Entonces el guardado se rechaza con un mensaje que explica la superposición y el bloque mantiene sus valores anteriores; Cuando lo edita a 13:00–18:00, Entonces se acepta; Cuando edita el primero a 08:00–13:30 sin tocar el segundo, Entonces se acepta, porque un bloque no se superpone consigo mismo.
- [ ] **AC-2.4** Dada la ficha de un bloque, Cuando el usuario guarda un fin igual o anterior al inicio, Entonces el cambio se rechaza con un mensaje y el bloque mantiene sus valores anteriores.
- [ ] **AC-2.5** Dada la ficha de un bloque, Cuando el usuario toca "Eliminar", Entonces se pide confirmación con un mensaje que nombra al familiar y el horario del bloque; si cancela, no cambia nada; si confirma, el bloque desaparece de la lista, el contador baja en 1, ningún familiar, espacio u otro bloque se crea, elimina o modifica, y el registro del bloque sigue existiendo en los datos con fecha de eliminación.
- [ ] **AC-2.6** Dado un bloque cuyo lugar es un espacio, Cuando el usuario renombra ese espacio o el espacio cambia de nombre automático por una renumeración, Entonces el bloque sigue apuntando al mismo espacio y la lista muestra el nombre nuevo.
- [ ] **AC-2.7** Dada la rutina de un familiar, Cuando el usuario la cierra, Entonces vuelve a la ficha del familiar sin ningún cambio adicional.

### Story 3: Ver a cada familiar donde dice su rutina

**As a** usuario que recorre su hogar
**I want** que los familiares estén en el espacio que dice su rutina a cada hora
**So that** vea de un vistazo dónde está cada uno

**Acceptance criteria:**

- [ ] **AC-3.1** Dado el modo exploración y un familiar cuyo bloque vigente tiene como lugar un espacio donde no está, Cuando empieza el bloque, Entonces el familiar camina hasta una casilla de ese espacio por el camino más corto sobre las casillas transitables, cruzando puertas y pasillos sin pantalla de transición, a 2 casillas por segundo.
- [ ] **AC-3.2** Dado un familiar que llegó a su espacio, Cuando pasa el tiempo mientras su bloque sigue vigente, Entonces pasea con las pausas y los tramos de la feature 002 (AC-4.1) pero solo por casillas de ese espacio, sin salir de él.
- [ ] **AC-3.3** Dado un familiar que ya está dentro de su espacio cuando empieza el bloque, Cuando empieza el bloque, Entonces no sale de ese espacio ni camina fuera de él.
- [ ] **AC-3.4** Dado un familiar sin bloque vigente (porque no tiene rutina, porque su horario de hoy no tiene bloque a esa hora, o porque su bloque terminó), Cuando pasa el tiempo, Entonces pasea por toda la casa exactamente como en la feature 002.
- [ ] **AC-3.5** Dado un familiar cuyo bloque vigente termina y que no tiene otro bloque que empiece en ese momento, Cuando termina el bloque, Entonces deja de limitarse a ese espacio y pasea por toda la casa.
- [ ] **AC-3.6** Dados un familiar con bloque vigente, una mascota y el personaje del propietario, Cuando pasa el tiempo, Entonces la mascota sigue paseando al azar por toda la casa según la feature 002 y el personaje del propietario solo lo mueve el jugador.
- [ ] **AC-3.7** Dado un familiar en medio de una pausa, o de un tramo de paseo al azar, Cuando su bloque vigente cambia y debe ir a otro lugar, Entonces cancela la pausa o el tramo, termina el paso que ya había empezado y sigue su camino.
- [ ] **AC-3.8** Dado un familiar que cambia de lugar y un jugador que no le cierra el paso, Cuando empieza el cambio, Entonces llega a su destino (una casilla del espacio o la entrada) en un tiempo no mayor que (número de casillas del camino más corto, desde la casilla que ocupa o a la que se dirige en ese momento, + 1) por 500 ms.
- [ ] **AC-3.9** Dado un familiar en ruta hacia su espacio, Cuando llega a una casilla del espacio ocupada por otro habitante, Entonces no se queda en ella: sigue hasta una casilla libre de ese espacio.
- [ ] **AC-3.10** Dado un familiar en ruta hacia un espacio cuyas casillas transitables están todas ocupadas, Cuando llega junto a ese espacio, Entonces espera en la casilla libre más cercana fuera del espacio y entra en cuanto una casilla del espacio queda libre.
- [ ] **AC-3.11** Dados el mismo mapa, la misma casilla de partida y el mismo destino, Cuando se calcula la ruta de un familiar dos veces, Entonces el camino es el mismo.
- [ ] **AC-3.12** Dado un familiar con un bloque cuyo lugar es un baño interno, Cuando está en ese baño, Entonces pasea solo por las casillas del baño y no por las del cuarto que lo contiene.

### Story 4: Salir de casa y volver por la entrada

**As a** usuario que recorre su hogar
**I want** ver a un familiar salir por la puerta cuando se va y volver a entrar cuando regresa
**So that** sepa que no está en casa sin tener que preguntar

**Acceptance criteria:**

- [ ] **AC-4.1** Dado un familiar cuyo bloque vigente es "Fuera de casa", Cuando empieza el bloque, Entonces camina hasta la entrada y, al llegar a ella, desaparece del mapa con su nombre y su burbuja.
- [ ] **AC-4.2** Dado un familiar que está fuera, Cuando otros personajes caminan por el mapa, Entonces el familiar no ocupa ninguna casilla ni bloquea a nadie.
- [ ] **AC-4.3** Dado un familiar que está fuera, Cuando termina su bloque "Fuera de casa" y el siguiente bloque tiene como lugar un espacio, Entonces reaparece en la entrada y camina hasta ese espacio.
- [ ] **AC-4.4** Dado un familiar que está fuera, Cuando termina su bloque "Fuera de casa" y no hay otro bloque vigente, Entonces reaparece en la entrada y pasea por toda la casa.
- [ ] **AC-4.5** Dado un familiar con dos bloques "Fuera de casa" que se tocan (09:00–13:00 y 13:00–18:00), Cuando pasan las 13:00, Entonces el familiar sigue fuera y no reaparece.
- [ ] **AC-4.6** Dado un familiar que debe reaparecer y la entrada ocupada por el jugador o por otro habitante, Cuando termina su bloque "Fuera de casa", Entonces espera fuera del mapa y aparece en la entrada en cuanto queda libre.
- [ ] **AC-4.7** Dado un familiar que camina hacia la entrada, Cuando todavía no ha llegado, Entonces se ve en el mapa con su nombre y sigue siendo un habitante visible, y no cuenta como fuera.
- [ ] **AC-4.8** Dado un familiar con un bloque "Fuera de casa" que empieza mientras ya estaba en la entrada, Cuando empieza el bloque, Entonces desaparece sin caminar.

### Story 5: El cartel de la entrada

**As a** usuario que recorre su hogar
**I want** un cartel junto a la entrada que diga quiénes están fuera y cuándo vuelven
**So that** lea quién está en casa sin abrir listas

**Acceptance criteria:**

- [ ] **AC-5.1** Dados dos familiares fuera, Cuando se muestra el mapa en modo exploración, Entonces se ve un cartel con el texto "2 fuera" dibujado sobre la casilla de pared de la sala contigua a la entrada, a su izquierda; Dado que nadie está fuera, Entonces el cartel no se muestra.
- [ ] **AC-5.2** Dados un familiar que camina hacia la entrada sin haber llegado, una mascota y el personaje del propietario, Cuando se muestra el cartel, Entonces ninguno de ellos cuenta como fuera.
- [ ] **AC-5.3** Dado un familiar que sale por la entrada con el mapa a la vista, Cuando desaparece, Entonces el cartel aparece o su cuenta sube en 1; Cuando reaparece, Entonces la cuenta baja en 1 y, si era el único, el cartel desaparece.
- [ ] **AC-5.4** Dado el modo exploración y el cartel visible, Cuando el usuario toca el cartel, Entonces se abre una hoja titulada "Fuera de casa" con una fila por cada familiar fuera, con su nombre y su hora de vuelta ("Vuelve a las 18:00").
- [ ] **AC-5.5** Dado un familiar con bloques "Fuera de casa" que se tocan (09:00–13:00 y 13:00–18:00), Cuando se muestra su fila, Entonces dice "Vuelve a las 18:00", la hora en que termina el tramo continuo de bloques fuera de casa de hoy.
- [ ] **AC-5.6** Dado un familiar fuera cuyo tramo continuo llega hasta las 24:00, Cuando se muestra su fila, Entonces dice "Vuelve mañana".
- [ ] **AC-5.7** Dado un familiar que ya terminó su bloque "Fuera de casa" y espera fuera del mapa porque la entrada está ocupada, Cuando se muestra su fila, Entonces dice "Volviendo" y cuenta como fuera.
- [ ] **AC-5.8** Dado un familiar fuera con una actividad por hacer sin espacio, Cuando se muestra el cartel, Entonces el cartel muestra además una señal "!", su fila muestra la misma señal y no hay ninguna burbuja de esa actividad sobre el mapa; Dado que ninguno de los familiares fuera tiene actividades por hacer sin espacio, Entonces ni el cartel ni las filas muestran la señal.
- [ ] **AC-5.9** Dado el modo exploración y la fila de un familiar fuera con la señal "!", Cuando el usuario toca la fila, Entonces se abre la hoja de actividades de ese familiar con la misma forma que en la feature 003 (AC-3.1) y su botón "Hecho" por actividad; al marcar como hecha la última, la hoja se cierra y la señal desaparece del cartel y de la fila.
- [ ] **AC-5.10** Dado el modo exploración y la fila de un familiar fuera sin la señal "!", Cuando el usuario la toca, Entonces no se abre nada.
- [ ] **AC-5.11** Dado un familiar fuera con una actividad por hacer con espacio, Cuando se muestra el mapa, Entonces el espacio de la actividad muestra su burbuja como en la feature 003 y la actividad no cambia por estar el familiar fuera.
- [ ] **AC-5.12** Dado el modo edición, Cuando se muestra el mapa, Entonces el cartel se ve igual que en exploración; Cuando el usuario lo toca, Entonces se abre la misma hoja y, al tocar la fila de un familiar, se abre su ficha de edición (con su rutina, su renombrado y Eliminar) y no la hoja de actividades.
- [ ] **AC-5.13** Dado el modo edición, Cuando el usuario toca una casilla, Entonces se abre, con esta prioridad: la ficha del personaje del propietario si la casilla es la suya; si no, la ficha del habitante que la ocupa; si no, la hoja del cartel si la casilla es la de su dibujo; si no, la hoja de la burbuja que se muestra en esa casilla; si no, la ficha del espacio.
- [ ] **AC-5.14** Dado el modo exploración con el cartel visible, Cuando el usuario toca la cruceta o camina, Entonces el cartel no bloquea el paso de ningún personaje ni captura la entrada de la cruceta.
- [ ] **AC-5.15** Dado un familiar fuera, Cuando el usuario elimina a ese familiar desde su ficha abierta desde el cartel y confirma, Entonces el cartel se actualiza en menos de 100 ms: su cuenta baja en 1 o desaparece si era el único.

### Story 6: Dónde aparecen los familiares al abrir la app y al volver de editar

**As a** usuario
**I want** que al abrir la app o al terminar de editar cada familiar esté ya donde dice su rutina
**So that** no tenga que esperar a que caminen para ver cómo está la casa

**Acceptance criteria:**

- [ ] **AC-6.1** Dada una app que se abre con familiares con rutina, Cuando se muestra el mapa, Entonces el personaje del propietario se ubica según AC-7.4 de la 001; cada familiar con bloque vigente en un espacio aparece en una casilla transitable libre de ese espacio elegida al azar, distinta de la de los demás habitantes y de la del jugador; cada familiar con bloque vigente "Fuera de casa" no aparece y cuenta en el cartel; y cada familiar sin bloque vigente aparece como en AC-6.1 de la 002.
- [ ] **AC-6.2** Dado el modo edición, Cuando el usuario toca "Listo", Entonces el personaje del propietario se ubica según AC-7.3 y AC-7.4 de la 001 y después cada habitante se coloca como en AC-6.1 de esta spec (los familiares según su rutina de ese momento, incluidos los cambios hechos en el modo edición), las mascotas como en AC-6.2 de la 002, y todos empiezan a moverse; el mapa actualizado se muestra en menos de 100 ms.
- [ ] **AC-6.3** Dado un familiar cuyo bloque vigente es en un espacio sin ninguna casilla libre, Cuando se coloca, Entonces aparece en la casilla transitable libre más cercana a ese espacio, por camino, con un resultado siempre igual para el mismo mapa y las mismas casillas ocupadas, y después se dirige a su espacio como en AC-3.10.
- [ ] **AC-6.4** Dado el modo exploración con familiares en ruta, Cuando el usuario entra al modo edición, Entonces los familiares visibles se quedan quietos en la casilla a la que se dirigían, con su nombre encima; los que están fuera siguen sin verse; el cartel sigue mostrando a los mismos.
- [ ] **AC-6.5** Dado el modo edición, Cuando el usuario crea, edita o elimina bloques o cambia la hora del dispositivo, Entonces ningún familiar se mueve, aparece ni desaparece y el cartel no cambia hasta que el usuario toca "Listo".
- [ ] **AC-6.6** Dado el modo edición, Cuando el usuario agrega un familiar, Entonces aparece en una casilla transitable libre elegida al azar, porque aún no tiene rutina, como en la feature 002.
- [ ] **AC-6.7** Dado el modo edición, Cuando un cambio del mapa deja la casilla de un familiar visible fuera del mapa, no transitable u ocupada, Entonces solo ese familiar pasa a otra casilla transitable libre elegida al azar, como en AC-7.7 de la 002; los que están fuera no se ven afectados.
- [ ] **AC-6.8** Dada la entrada ocupada por el jugador al abrir la app o al tocar "Listo", Cuando un familiar debe aparecer allí por volver de estar fuera, Entonces espera como en AC-4.6.

### Story 7: El paso de las horas

**As a** usuario
**I want** que los familiares sigan su rutina a la hora del dispositivo, también con la app abierta
**So that** lo que veo en el mapa sea lo de este momento

**Acceptance criteria:**

- [ ] **AC-7.1** Dado un familiar con un bloque 09:00–18:00, Cuando se calcula dónde debe estar a las 08:59, 09:00, 17:59 y 18:00 de un día del horario correspondiente, Entonces a las 08:59 no tiene bloque vigente, a las 09:00 y a las 17:59 el vigente es ese bloque, y a las 18:00 vuelve a no tener bloque vigente.
- [ ] **AC-7.2** Dados bloques 09:00–13:00 y 13:00–18:00 con lugares distintos, Cuando se calcula dónde debe estar a las 12:59 y a las 13:00, Entonces a las 12:59 el vigente es el primero y a las 13:00 el segundo.
- [ ] **AC-7.3** Dadas las fechas 2026-10-09 (viernes), 2026-10-10 (sábado), 2026-10-11 (domingo) y 2026-10-12 (lunes), Cuando se calcula dónde debe estar un familiar con un horario "Lun–Vie" y otro "Sáb–Dom" distintos, Entonces el viernes y el lunes se usa el de "Lun–Vie" y el sábado y el domingo el de "Sáb–Dom".
- [ ] **AC-7.4** Dado un familiar con un bloque "Lun–Vie" 18:00–24:00 "Fuera de casa" y otro "Sáb–Dom" 00:00–07:00 en un dormitorio, Cuando se calcula dónde debe estar el viernes 2026-10-09 a las 23:59 y el sábado 2026-10-10 a las 00:00, Entonces el viernes a las 23:59 debe estar fuera y el sábado a las 00:00 en el dormitorio.
- [ ] **AC-7.5** Dados dos instantes con la misma fecha y el mismo minuto local y segundos distintos, Cuando se calcula dónde debe estar un familiar, Entonces el resultado es el mismo, porque la rutina se mide en minutos.
- [ ] **AC-7.6** Dado el modo exploración con la app abierta, Cuando el reloj del dispositivo pasa al minuto en que empieza o termina un bloque de un familiar, Entonces, sin recargar y sin ninguna acción del usuario, el familiar empieza a ir a su nuevo lugar.
- [ ] **AC-7.7** Dado el paso de viernes a sábado a medianoche con la app abierta en modo exploración, Cuando el reloj pasa de las 23:59 a las 00:00, Entonces los familiares pasan a seguir el horario de "Sáb–Dom" sin recargar.
- [ ] **AC-7.8** Dada la app en segundo plano durante varias horas, Cuando vuelve a primer plano, Entonces cada familiar va caminando a donde dice la rutina de ese momento y no recorre los lugares intermedios de las horas en que no se veía.
- [ ] **AC-7.9** Dada la app cerrada durante varias horas, Cuando se abre, Entonces la colocación de los familiares corresponde a la hora de ese momento, sin ninguna acción del usuario, como en AC-6.1.
- [ ] **AC-7.10** Dado un teléfono con la hora mal configurada, Cuando los familiares siguen su rutina, Entonces la siguen con esa hora; esta feature no lo detecta ni lo corrige.

### Story 8: Cruzarse en ruta sin atascos

**As a** usuario que recorre su hogar
**I want** que los familiares nunca se queden bloqueados en un pasillo ni en una puerta
**So that** lleguen siempre a donde dice su rutina

**Acceptance criteria:**

- [ ] **AC-8.1** Dados dos familiares en ruta que caminan en sentidos opuestos por un pasillo de una casilla de ancho, Cuando se cruzan, Entonces ninguno queda bloqueado: cada uno llega a su destino dentro del tiempo de AC-3.8, y mientras comparten casilla se dibujan en la misma casilla.
- [ ] **AC-8.2** Dados un familiar en ruta y otro habitante que pasea al azar sobre su camino, Cuando el familiar llega a la casilla de ese habitante, Entonces puede pasar por ella sin esperar; Cuando el que pasea al azar va a entrar en una casilla ocupada por un familiar en ruta, Entonces no entra y espera.
- [ ] **AC-8.3** Dado un familiar en ruta cuya casilla siguiente es la del jugador o la que el jugador acaba de empezar a ocupar al dar un paso, Cuando intenta entrar en ella, Entonces no entra y espera; Cuando el jugador se aparta, Entonces el familiar sigue su camino.
- [ ] **AC-8.4** Dado el modo exploración, Cuando el usuario toca una dirección y la casilla siguiente está ocupada por un habitante, incluso por un familiar en ruta, Entonces el personaje del propietario no cambia de casilla y queda mirando hacia esa dirección.
- [ ] **AC-8.5** Dado el modo exploración con familiares en ruta, Cuando transcurre cualquier recorrido de los personajes, Entonces nunca hay dos habitantes que no estén en ruta en la misma casilla, nunca hay un habitante en la casilla del jugador, y nunca hay un personaje en una pared, un mueble o fuera del mapa.
- [ ] **AC-8.6** Dados dos personajes en la misma casilla, uno de ellos un familiar en ruta, Cuando se dibujan, Entonces el que no está en ruta se dibuja encima del que está en ruta, y el nombre de ninguno de los dos queda completamente tapado por el otro.
- [ ] **AC-8.7** Dado el modo exploración con 8 familiares en ruta a la vez, 4 mascotas y 50 actividades, Cuando el usuario camina, Entonces el movimiento se mantiene a 60 cuadros por segundo en el dispositivo de referencia.

### Story 9: La entrada del hogar

**As a** usuario
**I want** que mi hogar tenga una puerta de entrada visible en el mapa
**So that** vea por dónde salen y entran los familiares

**Acceptance criteria:**

- [ ] **AC-9.1** Dado cualquier hogar permitido, Cuando se muestra el mapa, Entonces existe una entrada: una casilla transitable de la pared inferior de la sala, en la misma columna que la casilla de aparición, que pertenece a la sala y se ve distinta de una pared.
- [ ] **AC-9.2** Dadas las combinaciones permitidas de espacios (las 7.560 de la verificación exhaustiva), Cuando se genera la distribución, Entonces la entrada existe, es transitable, ningún mueble la bloquea y es alcanzable desde la casilla de aparición; y todos los demás requisitos de la feature 001 siguen cumpliéndose (cada espacio alcanzable, ninguna puerta bloqueada, ninguna pieza superpuesta).
- [ ] **AC-9.3** Dado cualquier hogar permitido, Cuando se compara su distribución con la que generaban las features 001 a 003, Entonces la única diferencia es la casilla de la entrada.
- [ ] **AC-9.4** Dado el mismo estado guardado, Cuando se genera la distribución dos veces, Entonces la entrada está en la misma casilla.
- [ ] **AC-9.5** Dado el personaje del propietario sobre la entrada, Cuando el usuario toca la dirección hacia abajo, Entonces el personaje no cambia de casilla y queda mirando hacia abajo, porque fuera del hogar no hay casillas transitables.
- [ ] **AC-9.6** Dado un espacio desordenado o en desastre, o con burbuja, Cuando se muestra el mapa, Entonces ningún objeto del suelo ni burbuja se dibuja sobre la entrada, y los demás objetos y burbujas siguen sus reglas de la feature 003.
- [ ] **AC-9.7** Dado el personaje del propietario guardado en una casilla válida, Cuando se abre una app guardada con las features 001 a 003, Entonces el personaje aparece en la misma casilla que antes.

### Story 10: Bajas en cascada de bloques

**As a** propietario del hogar
**I want** que al eliminar un espacio o un familiar se vayan también sus bloques, sabiendo cuántos
**So that** no queden bloques de rutina apuntando a algo que ya no existe

**Acceptance criteria:**

- [ ] **AC-10.1** Dado un espacio sin nombre personalizado, sin actividades y con 2 bloques de rutina, Cuando el usuario toca "Eliminar" en su ficha, Entonces se pide confirmación con un mensaje que indica que se eliminarán 2 bloques de rutina; un espacio sin nombre personalizado, sin actividades y sin bloques se sigue eliminando sin confirmación.
- [ ] **AC-10.2** Dado un espacio con 1 actividad pendiente y 3 bloques de rutina, Cuando el usuario toca "Eliminar" en su ficha, Entonces la confirmación indica que se eliminarán 1 actividad y 3 bloques de rutina; la confirmación nombra solo los conceptos cuyo número es mayor que cero.
- [ ] **AC-10.3** Dada la confirmación de eliminar un espacio con bloques, Cuando el usuario cancela, Entonces no cambia nada; Cuando confirma, Entonces el espacio y los bloques que apuntaban a él desaparecen, y los bloques de otros espacios, los de "Fuera de casa" y los familiares permanecen.
- [ ] **AC-10.4** Dado un cuarto con baño interno, sin otro cuarto libre donde moverlo, Cuando el usuario elimina el cuarto, Entonces la confirmación indica el total de actividades y de bloques que se eliminarán, sumando los del cuarto y los de su baño; al confirmar se eliminan todos.
- [ ] **AC-10.5** Dado un cuarto con baño interno que tiene bloques, y otro cuarto sin baño donde el baño puede moverse, Cuando el usuario elimina el cuarto y confirma, Entonces se eliminan los bloques del cuarto y los bloques del baño se conservan y siguen apuntando a él en su nueva ubicación.
- [ ] **AC-10.6** Dado un tipo de espacio cuyo último espacio, o cuyo baño interno más reciente, tiene bloques, Cuando el usuario toca "−" en su contador, Entonces se pide la misma confirmación que al eliminarlo desde su ficha, con el número de bloques que se eliminarán.
- [ ] **AC-10.7** Dado un familiar con 3 bloques y ninguna actividad, Cuando el usuario toca "Eliminar" en su ficha, Entonces la confirmación nombra al familiar e indica que se eliminarán 3 bloques de rutina; si cancela, no cambia nada; si confirma, el familiar y sus bloques desaparecen y los de los demás familiares permanecen.
- [ ] **AC-10.8** Dado un familiar con 3 actividades pendientes y 2 bloques, Cuando el usuario toca "Eliminar" en su ficha, Entonces la confirmación indica que se eliminarán 3 actividades y 2 bloques de rutina.
- [ ] **AC-10.9** Dado un familiar sin actividades pendientes ni bloques, o una mascota, Cuando el usuario toca "Eliminar" en su ficha, Entonces la confirmación es la de la feature 002 (o la de la 003 si tiene actividades), sin mención de bloques.
- [ ] **AC-10.10** Dados bloques eliminados con un espacio o un familiar, Cuando se inspeccionan los datos guardados, Entonces sus registros siguen existiendo con fecha de eliminación y no aparecen en la lista de bloques ni en el mapa.
- [ ] **AC-10.11** Dado un familiar cuyo bloque vigente apuntaba a un espacio que se eliminó, Cuando el usuario toca "Listo", Entonces el familiar se coloca según los bloques que le quedan, o como libre si no le queda ninguno vigente.
- [ ] **AC-10.12** Dada cualquier combinación permitida de espacios, familiares y bloques, y cualquier eliminación de un espacio o de un familiar, Cuando se aplica la eliminación, Entonces ningún bloque activo apunta a un espacio ni a un miembro eliminado.

### Story 11: Conservar mis rutinas y no perder lo que ya tenía

**As a** usuario
**I want** que al volver a abrir la app estén mis rutinas y que mi hogar anterior siga igual
**So that** no tenga que volver a definirlas ni rehacer mi casa

**Acceptance criteria:**

- [ ] **AC-11.1** Dadas rutinas definidas, Cuando el usuario cierra y vuelve a abrir la app, Entonces siguen los mismos bloques con los mismos horarios, inicios, fines y lugares, y los familiares se colocan según la hora de ese momento.
- [ ] **AC-11.2** Dado el modo edición, Cuando el usuario crea, edita o elimina un bloque, Entonces el cambio queda guardado en el momento en que se aplica.
- [ ] **AC-11.3** Dado un hogar guardado con la feature 001, sin habitantes ni actividades, Cuando se abre la app, Entonces se muestran todos sus espacios, sus nombres y el nombre de su personaje, sin ningún aviso de error y sin bloques, y los datos pasan a guardarse en el formato nuevo en el siguiente guardado.
- [ ] **AC-11.4** Dado un hogar guardado con la feature 002, con familiares y mascotas, Cuando se abre la app, Entonces se muestran todos sus espacios, habitantes, nombres y datos, sin ningún aviso de error y sin bloques, y los familiares pasean por toda la casa como antes.
- [ ] **AC-11.5** Dado un hogar guardado con la feature 003, con actividades, Cuando se abre la app, Entonces se muestran todos sus espacios, habitantes y actividades, con las mismas burbujas y estados que corresponden a la fecha de ese momento, sin ningún aviso de error y sin bloques.
- [ ] **AC-11.6** Dados datos guardados con un bloque activo inválido (con un horario fuera de "Lun–Vie" y "Sáb–Dom"; con un inicio o un fin que no es un entero de minutos múltiplo de 30 dentro de su rango, o con el fin igual o anterior al inicio; que apunta a un miembro que no es un familiar activo, como el personaje del propietario, una mascota, o un miembro inexistente o eliminado; que apunta a un espacio inexistente, eliminado o que es un pasillo; o que se superpone con otro bloque activo del mismo familiar y el mismo horario), Cuando se abre la app, Entonces se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001.
- [ ] **AC-11.7** Dados datos guardados con un bloque eliminado que tiene datos inválidos y todos los demás válidos, Cuando se abre la app, Entonces el hogar se abre con normalidad, sin aviso.
- [ ] **AC-11.8** Dado un hogar con rutinas, Cuando se inspeccionan los datos guardados, Entonces no hay ninguna posición de habitantes, ningún objetivo ni ningún estado calculado de la rutina, ni ningún dato de la entrada o del cartel.
- [ ] **AC-11.9** Dado un hogar con bloques y la app cerrada de forma inesperada, Cuando se vuelve a abrir, Entonces se pierde como máximo el último cambio no aplicado.

### Story 12: Identidad estable de los bloques

**As a** propietario que más adelante compartirá su hogar con su familia
**I want** que cada bloque conserve su identidad aunque cambien sus datos
**So that** futuras funciones se apoyen en los bloques sin perder datos

**Acceptance criteria:**

- [ ] **AC-12.1** Dado un bloque con un identificador, Cuando se edita (inicio, fin o lugar), Entonces su identificador sigue siendo el mismo.
- [ ] **AC-12.2** Dado un bloque creado o modificado, Cuando se inspecciona su registro, Entonces contiene fecha de creación, fecha de última modificación y la cuenta local del propietario como autora.
- [ ] **AC-12.3** Dados bloques guardados, Cuando se inspeccionan los datos guardados, Entonces cada uno pertenece al hogar, referencia a su familiar y, si no es "Fuera de casa", a su espacio por identificador, y ninguno referencia una cuenta.
- [ ] **AC-12.4** Dado un bloque que apunta a un familiar y a un espacio, Cuando el usuario renombra al familiar o al espacio, o el espacio cambia de nombre automático por una renumeración, o el baño interno al que apunta se mueve a otro cuarto, Entonces el bloque sigue vinculado a los mismos.
- [ ] **AC-12.5** Dado un bloque eliminado, Cuando se inspecciona su registro, Entonces conserva su identificador y tiene fecha de eliminación.

## Functional Requirements

### FR-1: Rutina y bloques

La **rutina** de un familiar son dos horarios opcionales, "Lun–Vie" y "Sáb–Dom", cada uno con hasta 8 bloques. Un **bloque** tiene un inicio, un fin y un lugar.

**Must:**
- Permitir rutina solo a los familiares (personas que no son el personaje del propietario).
- Pedir un inicio de 00:00 a 23:30 y un fin de 00:30 a 24:00, ambos en pasos de 30 minutos, con el fin posterior al inicio.
- Pedir un lugar: un espacio activo (sala, comedor, cocina, baño común, baño interno, lavandería, espacio de mascotas, dormitorio u oficina) o "Fuera de casa".
- Aceptar bloques que se tocan (el fin de uno es el inicio del siguiente) y rechazar los que cubren un mismo minuto de un mismo horario de un mismo familiar.
- Permitir hasta 8 bloques activos por horario y por familiar; los eliminados no cuentan.
- Mostrar los textos escritos por el usuario (nombres de espacios y de familiares) siempre como texto.

**Must not:**
- Permitir un bloque que cruce la medianoche, con valores libres de inicio o fin, o sin lugar.
- Permitir superar el límite.
- Asignar un bloque a un pasillo, a una mascota o al personaje del propietario.
- Crear, eliminar o mover un espacio, un habitante, una actividad u otro bloque como efecto de crear, editar o eliminar un bloque.

### FR-2: Horarios, hora y bloque vigente

**Must:**
- Medir la rutina en días del calendario local y minutos locales del dispositivo, sin segundos: el bloque cubre los minutos desde su inicio hasta justo antes de su fin.
- Usar el horario "Lun–Vie" de lunes a viernes y "Sáb–Dom" los sábados y domingos, según la fecha local.
- Considerar **bloque vigente** el bloque del horario de hoy que cubre el minuto actual; si no hay ninguno, el familiar queda libre.
- Calcular dónde debe estar un familiar solo a partir de su rutina y de la fecha y el minuto de hoy, sin guardar el resultado.

**Must not:**
- Depender de los segundos, ni de la hora del día de otro modo que no sea el minuto local, ni de la zona horaria, para decidir el bloque vigente.
- Guardar el lugar donde debe estar un familiar ni su posición.

### FR-3: Seguir la rutina en el mapa

**Must:**
- En modo exploración, hacer que un familiar con bloque vigente en un espacio camine por el camino más corto hasta ese espacio y, una vez dentro, pasee solo por sus casillas.
- Hacer que un familiar libre (sin bloque vigente o sin rutina) pasee por toda la casa como en la feature 002.
- Al cambiar el bloque vigente, cancelar la pausa o el tramo en curso, terminar el paso ya empezado y seguir la ruta; el tiempo de llegada, sin que el jugador cierre el paso, no supera (casillas del camino más corto, desde la casilla que ocupa o a la que se dirige, + 1) por 500 ms.
- Hacer que un familiar que llega a una casilla ocupada de su espacio siga hasta una libre; si el espacio no tiene ninguna, esperar en la casilla libre más cercana fuera de él.
- Calcular el mismo camino para el mismo mapa, la misma casilla de partida y el mismo destino.
- Mantener a los familiares sin rutina, a las mascotas y al personaje del propietario como en las features anteriores.

**Must not:**
- Hacer que un familiar con bloque vigente en un espacio salga de él por paseo.
- Hacer que un familiar atraviese paredes, mobiliario o los bordes del mapa, ni que entre en la casilla del jugador o en la que el jugador acaba de empezar a ocupar.
- Guardar el camino de un familiar.

### FR-4: Salir de casa y volver

**Must:**
- Hacer que un familiar con bloque vigente "Fuera de casa" camine hasta la entrada y, al llegar, desaparezca del mapa con su nombre y su burbuja.
- Dejar de contar a un familiar fuera como ocupante de casillas.
- Cuando termina su estadía fuera, reaparecerlo en la entrada y hacerlo caminar a su siguiente lugar, o pasear por toda la casa si no tiene bloque vigente.
- Mantener fuera, sin reaparecer, al familiar cuyo bloque "Fuera de casa" es seguido sin hueco por otro bloque "Fuera de casa".
- Si la entrada está ocupada al reaparecer, esperar fuera del mapa hasta que se libere.

**Must not:**
- Mostrar dónde está un familiar mientras está fuera.
- Dejar que el jugador salga del hogar por la entrada.

### FR-5: Cartel de la entrada

**Must:**
- Mostrar, en modo exploración y en modo edición, un cartel sobre la casilla de pared de la sala contigua a la entrada, a su izquierda, con el número de familiares fuera ("n fuera"), y no mostrarlo si n es 0.
- Contar como fuera solo a los familiares que no están en el mapa porque salieron, incluidos los que esperan fuera del mapa para reaparecer.
- Abrir, al tocarlo, una hoja "Fuera de casa" con una fila por familiar fuera: su nombre y "Vuelve a las HH:MM" (la hora en que termina el tramo continuo de bloques "Fuera de casa" de hoy), "Vuelve mañana" (si ese tramo llega hasta las 24:00) o "Volviendo" (si espera para reaparecer).
- Mostrar una señal "!" en el cartel y en las filas de los familiares fuera que tienen actividades por hacer sin espacio, y en modo exploración abrir al tocar esa fila la hoja de actividades del familiar (con "Hecho").
- En modo edición, abrir al tocar una fila la ficha del familiar.
- Quitar la burbuja de las actividades por hacer sin espacio de un familiar mientras está fuera; las actividades con espacio conservan su burbuja en su espacio.
- Hacer que el cartel no bloquee el paso de ningún personaje ni capture la entrada de la cruceta.
- Usar arte de marcador original, sin recursos de terceros con copyright.

**Must not:**
- Contar como fuera a las mascotas, al personaje del propietario o a un familiar que todavía camina hacia la entrada.
- Mostrar más de un cartel.

### FR-6: Colocación y modo edición

**Must:**
- Al abrir la app y al tocar "Listo", colocar primero al personaje del propietario según la feature 001 y después a cada habitante: un familiar con bloque vigente en un espacio, en una casilla transitable libre de ese espacio elegida al azar; uno fuera, fuera del mapa; el resto como en la feature 002.
- Si el espacio del bloque vigente no tiene casillas libres, colocar al familiar en la casilla transitable libre más cercana por camino, siempre la misma para el mismo mapa y las mismas casillas ocupadas.
- Dejar quietos a los habitantes en el modo edición, y mantener a los familiares fuera sin verse y al cartel sin cambios mientras dura.
- Aplicar los cambios de rutina hechos en el modo edición al tocar "Listo".
- Colocar a un familiar nuevo, que aún no tiene rutina, en una casilla libre al azar.
- Reubicar solo al familiar visible cuya casilla queda inválida u ocupada por un cambio del modo edición.

**Must not:**
- Mover, hacer aparecer o hacer desaparecer a un familiar en el modo edición a causa de un cambio de rutina o de la hora.
- Guardar la posición de los habitantes.

### FR-7: Cruzarse en ruta

**Must:**
- Permitir que un familiar en ruta pase por una casilla ocupada por otro habitante, y que no se detenga a ocuparla.
- Hacer que el jugador siga sin poder entrar en una casilla ocupada por un habitante, incluso por uno en ruta.
- Hacer que un familiar en ruta espere cuando su casilla siguiente es la del jugador o la que el jugador acaba de empezar a ocupar.
- Hacer que los habitantes que pasean al azar no entren en una casilla ocupada por un familiar en ruta.
- Dibujar, en una misma casilla, al que no está en ruta encima del que está en ruta, sin tapar por completo el nombre de ninguno.

**Must not:**
- Dejar que dos habitantes que no están en ruta, o un habitante y el jugador, ocupen la misma casilla.
- Dejar que un familiar quede bloqueado indefinidamente por otro habitante.

### FR-8: Edición de la rutina

**Must:**
- Ofrecer "Rutina" en la ficha de un familiar en el modo edición, y no en la de una mascota ni en la del personaje del propietario.
- Mostrar en la rutina un selector de horario, el contador "n de 8" del horario elegido, la lista de sus bloques ordenada por inicio y el botón "+ Bloque", desactivado con 8 bloques.
- Abrir una ficha de alta al tocar "+ Bloque" y una ficha de edición al tocar un bloque.
- Rechazar con un mensaje que explique el motivo un guardado con el fin no posterior al inicio o con una superposición, sin cambiar nada.
- Pedir confirmación antes de eliminar un bloque, con un mensaje que nombre al familiar y el horario.
- Marcar como eliminado el registro de un bloque eliminado, con su fecha de eliminación, en lugar de destruirlo.
- Guardar cada cambio en el momento en que se aplica.

**Must not:**
- Permitir crear, editar o eliminar bloques fuera del modo edición.
- Permitir cambiar el horario ni el familiar de un bloque ya creado.

### FR-9: Bajas en cascada y confirmación

**Must:**
- Eliminar de forma lógica, junto con un familiar, todos sus bloques, en la misma operación.
- Eliminar de forma lógica, junto con un espacio, todos los bloques que apuntan a él, en la misma operación.
- Si al eliminar un cuarto se elimina también su baño interno (FR-4 de la feature 001), eliminar también los bloques del baño; si el baño interno se mueve a otro cuarto, conservar sus bloques.
- Pedir confirmación al eliminar un espacio, o al quitarlo con "−" en su contador, cuando él o su baño interno tiene bloques o actividades pendientes, con un mensaje que indique cuántos bloques y cuántas actividades se eliminarán en total; mantener las demás reglas de confirmación de las features 001 y 003.
- Indicar en la confirmación de eliminar a un familiar cuántos bloques (y, si las tiene, cuántas actividades) se eliminarán con él.

**Must not:**
- Dejar un bloque activo que apunte a un espacio o a un miembro eliminado.
- Eliminar bloques de otros espacios o de otros familiares, ni los de "Fuera de casa" de un familiar por eliminar un espacio.

### FR-10: Persistencia y compatibilidad

**Must:**
- Guardar en el dispositivo los bloques junto con el resto del hogar, cada vez que se crean, editan o eliminan.
- Restaurar las rutinas al reabrir la app.
- Abrir sin pérdida y sin aviso de error un hogar guardado con la feature 001, 002 o 003, sin bloques, y guardarlo a partir de entonces en el formato nuevo.
- Considerar ilegibles los datos guardados que tengan un bloque activo inválido (según AC-11.6) y, en ese caso, mostrar un aviso y crear el hogar inicial de la feature 001.
- Ignorar, al validar, los bloques eliminados.

**Must not:**
- Perder o modificar los espacios, los habitantes, las actividades, los nombres o el personaje del propietario de un hogar de las features 001 a 003 al abrirlo.
- Guardar posiciones, lugares calculados, caminos, ni datos de la entrada o del cartel.
- Enviar datos fuera del dispositivo.

### FR-11: Identidad y preparación multiusuario

**Must:**
- Dar a cada bloque un identificador estable y globalmente único, que no cambie al editarlo.
- Registrar en cada bloque la fecha de creación, la fecha de última modificación y la cuenta autora.
- Referenciar al familiar y al espacio de un bloque por identificador, nunca por nombre ni posición, y no vincular un bloque a una cuenta.
- Marcar como eliminados los bloques borrados, con su fecha de eliminación, y excluirlos de toda vista y validación.

**Must not:**
- Perder el vínculo de un bloque con su familiar o con su espacio al renombrarlos, renumerarlos o mover un baño interno.

### FR-12: La entrada del hogar

**Must:**
- Incluir en toda distribución una entrada: una casilla transitable de la pared inferior de la sala, en la misma columna que la casilla de aparición, que pertenece a la sala y se dibuja distinta de una pared.
- Hacer que la entrada sea alcanzable desde la casilla de aparición en todas las combinaciones permitidas, sin que ningún mueble la bloquee.
- Generar la misma entrada para el mismo estado guardado.
- Dejar sin cambios todas las demás casillas de la distribución de las features anteriores.
- Dejar que el jugador pise la entrada.

**Must not:**
- Dejar que el jugador salga del hogar por ella.
- Dibujar objetos del suelo ni burbujas sobre la entrada.
- Alterar la posición de aparición ni la validez de la posición guardada del personaje del propietario.

## Non-Functional Requirements

### Performance

- El movimiento de los personajes se mantiene a 60 cuadros por segundo en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares en ruta a la vez, 4 mascotas y 50 actividades por hacer repartidas por todos los espacios del hogar de mayor tamaño permitido.
- Al tocar "Listo", y al eliminar un familiar fuera desde el cartel, el mapa actualizado se muestra en menos de 100 ms en el dispositivo de referencia, incluido el cálculo de la colocación y de las rutas de los familiares.
- Calcular las rutas de los familiares tras un cambio de bloque no produce una pausa perceptible del movimiento.

### Security

- No hay autenticación en esta feature; la cuenta del propietario es local.
- Ningún dato sale del dispositivo.
- Los textos escritos por el usuario (nombres de espacios y de miembros) se muestran siempre como texto, nunca interpretados como marcado, en las listas de lugares, en los bloques, en el cartel y en las confirmaciones.

### Reliability

- Para todas las combinaciones permitidas de espacios (las 7.560 de la verificación exhaustiva), existe una entrada alcanzable desde la casilla de aparición, y desde la entrada existe un camino a cada espacio. Se verifica de forma automática.
- La hora y el horario se verifican de forma automática con fechas y minutos fijos: los límites de un bloque (08:59, 09:00, 17:59 y 18:00), bloques que se tocan, los siete días de la semana, el paso de viernes a sábado, los segundos, los cambios de mes y un 29 de febrero.
- El movimiento hacia un objetivo se verifica de forma automática con un azar reproducible y sin el reloj real: llegada a un espacio y a la entrada dentro del tiempo de AC-3.8, familiares enfrentados en un pasillo de una casilla, espera ante el jugador, caminos iguales para entradas iguales, y largos recorridos con muchos habitantes comprobando que los habitantes que no están en ruta nunca comparten casilla y que nadie pisa una pared o un mueble.
- Para cualquier combinación permitida de espacios, familiares y bloques, y para cualquier eliminación de un espacio o de un familiar, nunca queda un bloque activo que apunte a un espacio o a un miembro eliminado; se verifica de forma automática, incluidos los dos casos de un cuarto con baño interno (el baño se mueve y el baño se elimina).
- Un hogar guardado con la feature 001, 002 o 003 se abre sin pérdida de datos. Se verifica de forma automática con documentos guardados de esas features, incluidos documentos corruptos y bloques inválidos.
- Un cierre inesperado de la app pierde como máximo el último cambio no aplicado.
- Un teléfono con la hora mal configurada hace que los familiares sigan la rutina con esa hora; esta feature no lo detecta ni lo corrige.

### Usability

- El cartel, sus filas y los textos de la hoja tienen un tamaño legible en un teléfono en vertical y no cambian de tamaño al acercar o alejar la cámara, con el mismo criterio de legibilidad que las etiquetas de la feature 001 y las burbujas de la 003.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| El usuario intenta guardar un bloque sin elegir inicio, fin o lugar | El botón de guardar permanece desactivado; no se crea nada |
| El fin del bloque es igual o anterior al inicio | Se rechaza con un mensaje que explica el motivo; no se crea ni modifica nada |
| El bloque se superpone con otro del mismo familiar y horario | Se rechaza con un mensaje que explica el motivo; no se crea ni modifica nada |
| El usuario intenta crear un noveno bloque en un horario | El botón "+ Bloque" está desactivado; no se crea nada |
| El usuario cancela la eliminación de un bloque, de un espacio o de un familiar con bloques | No cambia nada |
| Un familiar debe reaparecer y la entrada está ocupada | Espera fuera del mapa y aparece en cuanto la entrada queda libre; el cartel lo cuenta como "Volviendo" |
| El jugador cierra el paso a un familiar en ruta, o está sobre la entrada | El familiar espera hasta que el jugador se aparta |
| El espacio del bloque vigente no tiene casillas libres | El familiar espera en la casilla libre más cercana fuera del espacio y entra cuando se libera una |
| Se elimina el espacio al que apunta el bloque vigente de un familiar | Al tocar "Listo", el familiar se coloca según los bloques que le quedan, o libre si no le queda ninguno vigente |
| La app queda en segundo plano o cerrada durante horas | Al volver o al abrirla, los familiares van a (o aparecen en) donde dice la rutina de ese momento |
| El teléfono tiene la hora mal configurada | Los familiares siguen la rutina con esa hora |
| Falla el guardado en el dispositivo | Se muestra un aviso no bloqueante y la sesión continúa con los datos en memoria; se reintenta en el siguiente guardado |
| Los datos guardados no se pueden leer o tienen un bloque activo inválido al abrir la app | Se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001 |

## Open Questions

- Ninguna bloqueante. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-06 y las dos decisiones de arquitectura están registradas en los ADR enlazados.
- **Resueltas en esta spec** (puntos que el PRD dejó para la spec): la prioridad al tocar en el modo edición queda como personaje del propietario, habitante, cartel, burbuja, espacio (AC-5.13); el cartel se dibuja sobre la casilla de pared contigua a la entrada, a su izquierda, que ningún personaje, burbuja u objeto puede ocupar (FR-5); en una casilla compartida se dibuja encima el que no está en ruta (AC-8.6); un familiar que espera para reaparecer cuenta como fuera y su fila dice "Volviendo" (AC-5.7); al volver a primer plano los familiares caminan hacia donde corresponde, y solo al abrir la app o tocar "Listo" aparecen directamente (AC-7.8); el contador "n de 8", la confirmación al eliminar un bloque y la ausencia de valores iniciales en la ficha de alta siguen el patrón de la feature 003.
- Riesgos de legibilidad y de rendimiento, a medir en un teléfono con la verificación de la Fase de integración del plan y a ajustar con evidencia: con 12 habitantes en movimiento más etiquetas, burbujas, insignias, objetos y el cartel, el mapa puede saturarse; y 8 familiares en ruta a la vez con las rutas recalculadas es el riesgo principal de rendimiento de la pieza.

## Out of Scope (Future Considerations)

- Rutinas para mascotas o para el personaje del propietario.
- Bloques que cruzan la medianoche, horarios por día de la semana y días festivos.
- Programar actividades por hora o vincular bloques con actividades; que un familiar camine hasta el espacio de una actividad.
- Negociación de intercambios y calificaciones (pieza 5).
- Notificaciones, recordatorios y alarmas.
- Copiar horarios y plantillas de rutina.
- Mostrar dónde está un familiar fuera de casa; que el jugador salga del hogar.
- Cuentas reales, inicio de sesión, sincronización y permisos para los familiares.
- Arte definitivo, animaciones, sonido y música.
- Que los personajes nunca se superpongan al caminar en ruta (reemplazaría el ADR del movimiento hacia un objetivo).
