# Feature 006: Calificaciones e historial de actividades hechas

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-08
**Branch:** `feat/006-calificaciones-e-historial`
**Source:** [prd.md](prd.md) · [ADR historial, calificaciones y formato v6](../../adr/006-historial-calificaciones-formato-v6.md) · se apoya en la [spec 001](../001-mapa-editor-hogar/spec.md) (v1.1.0), la [spec 002](../002-familiares-y-mascotas/spec.md) (v1.0.0), la [spec 003](../003-actividades/spec.md) (v1.0.0), la [spec 004](../004-rutinas/spec.md) (v1.0.0) y la [spec 005](../005-jugador-activo-e-intercambios/spec.md) (v1.0.0)

---

## Problem Statement

Livin existe para que las personas que comparten un hogar vean de un vistazo cómo está la casa y quién se encarga de qué. Hoy, cuando alguien marca una actividad como "Hecho", el rastro desaparece: una puntual conserva solo el día en que se hizo y una repetitiva solo su próximo vencimiento. No hay forma de ver qué se hizo en la casa ni quién lo hizo, ni de reconocer, o señalar, cómo salió. Esta feature agrega un **historial** (cada "Hecho" deja una entrada acreditada a la persona que estaba a cargo, y se consulta desde un botón "Historial") y las **calificaciones**: otra persona del hogar puede calificar una entrada de 1 a 5 estrellas, cuando quiera, desde el historial; al filtrar por una persona se ve su promedio.

## Goals

- Cada "Hecho" de cualquier actividad (puntual o repetitiva, de una persona o de una mascota) agrega una entrada con el nombre, el icono y el lugar de la actividad, la persona que estaba a cargo y el día en que se hizo.
- La persona acreditada es la responsable de la actividad en el momento de "Hecho", también si la tenía por un intercambio.
- Un botón "Historial" en exploración abre una lista de todo el hogar, de la más reciente a la más antigua, con un filtro por persona.
- El historial guarda solo las últimas 200 entradas; al llegar una nueva por encima de 200, se descarta la más antigua.
- Cualquier persona que juega puede calificar una entrada de otra persona (o de una mascota) con 1 a 5 estrellas, cuando quiera, desde el historial. Cada entrada tiene a lo sumo una calificación, y solo quien la dio puede cambiarla o quitarla.
- Al filtrar el historial por un miembro se muestra su promedio de estrellas con la cantidad de entradas calificadas; el promedio se calcula y no se guarda.
- Las entradas se conservan aunque la actividad, el espacio o la persona acreditada se editen o se eliminen.
- El historial y las calificaciones se conservan entre sesiones, y los hogares guardados con las features 001 a 005 se abren sin perder datos, con el historial vacío.

## Non-Goals

- No se puede deshacer un "Hecho" ni editar o eliminar entradas del historial.
- No hay puntos, niveles, logros, rankings ni estrellas visibles en el mapa o en la lista del selector "Juega".
- No hay varias calificaciones por entrada, ni una cola de "por calificar", ni avisos de que algo espera calificación.
- No hay retención del historial por fecha, archivo ni exportación: solo el tope de 200 entradas.
- No hay cuentas, contraseñas ni sincronización entre teléfonos: es un solo teléfono compartido.
- No se restringe quién puede marcar "Hecho" ni editar: cualquier jugador sigue pudiendo hacer ambas cosas (005).
- No se abre el historial en el modo edición.

## Users and Context

**Primary users:** las personas de un hogar que comparten un solo teléfono. Quien califica es la persona que juega en ese momento (el selector "Juega: <nombre>" de la 005); no hay contraseñas ni forma de verificar quién tiene el teléfono.
**Secondary users:** las personas de un hogar que en features futuras tendrán su propio dispositivo y su cuenta. En esta feature las entradas y las calificaciones apuntan a miembros, no a cuentas.
**Usage context:** sesiones cortas en el celular, en orientación vertical. Alguien marca "Hecho" en una burbuja; más tarde, otra persona toma el teléfono, cambia de jugador, abre el historial y, si quiere, califica lo que se hizo o mira cómo le va a cada quien.
**User mental model:** el mismo de las features 001 a 005. Vocabulario nuevo: "historial" (la lista de actividades hechas del hogar); "entrada" (el registro de un "Hecho"); "acreditada" (la persona a cuyo nombre queda una entrada: la que estaba a cargo de la actividad al hacerla); "calificación" o "estrellas" (de 1 a 5, a lo sumo una por entrada); "quien calificó" (la persona que dio las estrellas, la única que puede cambiarlas); "bloqueada" (una calificación que el jugador actual no puede cambiar); "promedio" (las estrellas medias de una persona, calculadas sobre sus entradas calificadas).

**Relación con las specs anteriores.** Esta feature reemplaza las exclusiones de las specs 003 a 005 sobre "historial de actividades hechas", "calificaciones" y "quién hizo cada una". Amplía reglas existentes:

- **"Hecho" (spec 003, FR-3; spec 005, FR-9):** además de lo que ya hace (la puntual queda hecha; la repetitiva avanza su vencimiento y, si estaba intercambiada, vuelve a su responsable original), agrega una entrada al historial en la misma operación. Marcar "Hecho" sigue sin poder deshacerse y sigue ofreciéndose solo en exploración.
- **Pantalla de exploración (spec 005, FR-11):** gana un cuarto botón, "Historial", debajo de "Intercambios".
- **Jugador activo (spec 005, FR-1):** quien juega es quien califica.
- **Documento guardado:** se amplía y el formato guardado cambia de versión.
- **Bajas (spec 001, FR-4; spec 003, FR-7; spec 005, FR-9):** eliminar una actividad, un espacio o un miembro no elimina sus entradas del historial, y las confirmaciones de eliminar no cuentan entradas.

El resto de las specs 001 a 005 sigue vigente sin cambios.

## User Stories

### Story 1: Que cada "Hecho" quede en el historial

**As a** persona que comparte el hogar
**I want** que cada actividad que se hace deje constancia de qué fue, quién estaba a cargo y cuándo
**So that** la casa tenga memoria de lo que se hizo

**Acceptance criteria:**

- [ ] **AC-1.1** Dada una actividad puntual por hacer asignada a Ana, Cuando cualquier jugador toca "Hecho" en ella, Entonces el historial gana exactamente una entrada con el nombre y el icono de la actividad, su espacio (o ninguno si no tenía), Ana como persona acreditada, el día de hoy y sin calificación; y la actividad queda hecha como en la 003.
- [ ] **AC-1.2** Dada una actividad repetitiva por hacer, Cuando se toca "Hecho", Entonces el historial gana exactamente una entrada con los mismos datos que en AC-1.1 y su vencimiento avanza a hoy más su frecuencia como en la 003.
- [ ] **AC-1.3** Dada una repetitiva que Luis tiene por un intercambio aceptado (su responsable original es Ana), Cuando se toca "Hecho", Entonces la entrada se acredita a Luis, no a Ana, y la actividad vuelve a Ana con su nuevo vencimiento como en la 005 (AC-8.4).
- [ ] **AC-1.4** Dada una puntual que Luis tiene por un intercambio aceptado, Cuando se toca "Hecho", Entonces la entrada se acredita a Luis.
- [ ] **AC-1.5** Dada una actividad asignada a una mascota, Cuando se toca "Hecho", Entonces el historial gana una entrada acreditada a la mascota.
- [ ] **AC-1.6** Dadas dos actividades distintas marcadas "Hecho" una tras otra, Cuando se abre el historial, Entonces hay una entrada por cada una, y la marcada en último lugar aparece primero.
- [ ] **AC-1.7** Dada una repetitiva marcada "Hecho" en dos días distintos, Cuando se abre el historial, Entonces hay dos entradas separadas de la misma actividad, cada una con el día en que se hizo.
- [ ] **AC-1.8** Dada una actividad que no está por hacer (por ejemplo, una puntual que ya está hecha, una eliminada o una que vence después de hoy), Cuando se intenta marcar "Hecho" con datos desactualizados, Entonces no cambia nada y el historial no gana ninguna entrada.
- [ ] **AC-1.9** Dado un "Hecho", Cuando se completa, Entonces la burbuja, el estado y las insignias de los espacios, el cartel, los números de pendientes y la vigencia de las propuestas quedan exactamente como los dejaba la feature 005 sin historial (AC-3.2, AC-3.3 de la 003 y AC-9.3 de la 005).
- [ ] **AC-1.10** Dado un "Hecho", Cuando se completa, Entonces el cambio queda guardado en el momento junto con la entrada.

### Story 2: Abrir el historial y leer qué se hizo

**As a** persona que juega
**I want** abrir una lista de lo que se hizo en la casa
**So that** vea de un vistazo quién se encargó de qué y cuándo

**Acceptance criteria:**

- [ ] **AC-2.1** Dado el modo exploración, Cuando se muestra el mapa, Entonces se ve un botón "Historial" en la esquina superior derecha, debajo de "Intercambios", que no tapa la cruceta ni el cartel de la entrada y tiene un tamaño táctil legible; en el modo edición el botón no se ve.
- [ ] **AC-2.2** Dado el botón "Historial", Cuando el usuario lo toca, Entonces se abre un panel titulado "Historial" con un filtro de persona con "Todos" elegido, la lista de entradas y un botón "Cerrar".
- [ ] **AC-2.3** Dado el panel con "Todos", Cuando se muestra la lista, Entonces tiene una fila por cada entrada del hogar, de la más reciente a la más antigua (la última entrada creada primero, también si dos entradas comparten el mismo día).
- [ ] **AC-2.4** Dada una fila, Cuando se muestra, Entonces tiene el icono y el nombre de la actividad tal como eran al hacerla; una línea con la persona acreditada, el nombre del espacio si lo tenía y el día; y cinco estrellas con la calificación (vacías si no tiene).
- [ ] **AC-2.5** Dado el día de una entrada, Cuando es hoy, Entonces se muestra "Hoy"; si fue ayer, "Ayer"; si fue hace N días con N de 2 en adelante, "Hace N días"; y si es posterior a hoy (la fecha del teléfono se movió hacia atrás), se muestra su fecha AAAA-MM-DD.
- [ ] **AC-2.6** Dado un historial sin entradas, Cuando se abre el panel, Entonces la lista muestra el texto "Aún no hay actividades hechas" y no hay filas.
- [ ] **AC-2.7** Dadas más entradas de las que caben en la pantalla, Cuando el usuario abre el panel, Entonces puede recorrer toda la lista y alcanzar cada fila y cada control.
- [ ] **AC-2.8** Dados nombres de actividades, de personas y de espacios con aspecto de marcado, Cuando se muestran en el panel, el filtro o las filas, Entonces se muestran como texto.
- [ ] **AC-2.9** Dado el panel abierto, Cuando el usuario toca "Cerrar", Entonces el panel se cierra y nada cambia.
- [ ] **AC-2.10** Dado el panel abierto, Cuando el usuario cambia el filtro o califica una entrada, Entonces el panel muestra el cambio en menos de 100 ms.
- [ ] **AC-2.11** Dado cualquier jugador, Cuando abre el historial, Entonces ve el historial completo del hogar; no hay entradas ocultas por jugador.

### Story 3: Filtrar por persona y ver su promedio

**As a** persona que comparte el hogar
**I want** ver lo que hizo cada miembro y cómo le fue
**So that** entienda el reparto de las tareas

**Acceptance criteria:**

- [ ] **AC-3.1** Dado el panel, Cuando el usuario abre el filtro, Entonces ofrece "Todos" y una opción por cada miembro activo (el propietario primero, luego los familiares y luego las mascotas, cada grupo en el orden en que se crearon), con el nombre actual de cada uno; dos miembros con el mismo nombre aparecen como dos opciones separadas.
- [ ] **AC-3.2** Dado el filtro, Cuando el usuario elige un miembro, Entonces la lista muestra solo las entradas acreditadas a ese miembro, de la más reciente a la más antigua.
- [ ] **AC-3.3** Dado un miembro elegido en el filtro con al menos una entrada calificada, Cuando se muestra el panel, Entonces sobre la lista aparece "<nombre>: <promedio> ★ (<n> calificadas)", con el promedio de las estrellas de sus entradas calificadas que siguen en el historial, con un decimal, con coma decimal y redondeando al más cercano (las mitades hacia arriba) — por ejemplo, 4 entradas con 5, 4, 4 y 4 estrellas muestran "4,3 ★ (4 calificadas)" — y n igual al número de entradas calificadas.
- [ ] **AC-3.4** Dado un miembro elegido sin entradas calificadas, Cuando se muestra el panel, Entonces aparece "<nombre>: sin calificaciones" y no se muestra ningún promedio.
- [ ] **AC-3.5** Dado un miembro elegido sin ninguna entrada, Cuando se muestra el panel, Entonces la lista dice "<nombre> no tiene actividades hechas en el historial" y aparece "<nombre>: sin calificaciones".
- [ ] **AC-3.6** Dado "Todos" elegido, Cuando se muestra el panel, Entonces no se muestra ningún promedio.
- [ ] **AC-3.7** Dado un miembro elegido, Cuando se califica, se cambia o se quita una calificación de sus entradas, Entonces el promedio se actualiza en el mismo momento.
- [ ] **AC-3.8** Dado el promedio, Cuando se calcula, Entonces cuenta solo las entradas que siguen en el historial y que tienen calificación; las entradas sin calificar no cuentan como cero, y lo descartado por el tope de 200 ya no cuenta.
- [ ] **AC-3.9** Dado un miembro que ya no existe, Cuando se abre el filtro, Entonces no aparece como opción; sus entradas se ven solo con "Todos".
- [ ] **AC-3.10** Dado el panel cerrado y vuelto a abrir, Cuando se muestra, Entonces el filtro vuelve a "Todos".
- [ ] **AC-3.11** Dado el promedio, Cuando se inspeccionan los datos guardados, Entonces no hay ningún promedio ni conteo de calificadas guardado.

### Story 4: Calificar una entrada

**As a** persona que juega
**I want** calificar de 1 a 5 estrellas lo que hizo otra persona
**So that** reconozca, o señale, cómo salió

**Acceptance criteria:**

- [ ] **AC-4.1** Dada una entrada sin calificación acreditada a otra persona o a una mascota, Cuando se abre el panel, Entonces sus cinco estrellas se pueden tocar.
- [ ] **AC-4.2** Dada una entrada que se puede calificar, Cuando quien juega toca la estrella k (de 1 a 5), Entonces la entrada queda con k estrellas, queda anotado que las dio quien juega, las estrellas de la fila se muestran llenas hasta la k y la fila muestra el texto "Tu calificación".
- [ ] **AC-4.3** Dada una entrada sin calificación acreditada a quien juega, Cuando se abre el panel, Entonces sus estrellas no se pueden tocar y la fila muestra el texto "No puedes calificar tus propias actividades".
- [ ] **AC-4.4** Dada una entrada acreditada a una mascota, Cuando cualquier persona que juega abre el panel, Entonces puede calificarla.
- [ ] **AC-4.5** Dada una entrada acreditada a una persona que ya se eliminó, Cuando una persona que juega abre el panel, Entonces puede calificarla.
- [ ] **AC-4.6** Dada una calificación recién dada, Cuando el usuario cierra y vuelve a abrir el panel, o cambia de jugador, Entonces sigue ahí con las mismas estrellas y la misma persona que las dio.
- [ ] **AC-4.7** Dados datos desactualizados (por ejemplo, una entrada descartada por el tope mientras el panel estaba abierto), Cuando se aplica una calificación, Entonces se rechaza con un mensaje que explica el motivo y no cambia nada. Los motivos son: la entrada ya no está en el historial; quien califica es la persona acreditada; quien califica no es una persona activa (propietario o familiar); las estrellas no son un entero de 1 a 5; la entrada ya tiene la calificación de otra persona.
- [ ] **AC-4.8** Dada una calificación aplicada, Cuando se inspecciona el registro de la entrada, Entonces conserva su identificador, solo cambian las estrellas, quién las dio y su auditoría, y no cambia ninguna actividad, espacio, miembro ni propuesta.
- [ ] **AC-4.9** Dado un hogar con tres personas A, B y C y una entrada acreditada a A, Cuando B la califica, Entonces C ve la calificación bloqueada (Story 5) y A también.
- [ ] **AC-4.10** Dada una entrada sin calificación, Cuando se muestra, Entonces sus cinco estrellas aparecen vacías y la fila no muestra ningún texto de calificación.

### Story 5: Cambiar o quitar una calificación

**As a** persona que calificó
**I want** corregir o retirar mis estrellas
**So that** un toque equivocado no quede para siempre

**Acceptance criteria:**

- [ ] **AC-5.1** Dada una entrada calificada por quien juega, Cuando se abre el panel, Entonces sus cinco estrellas se pueden tocar y la fila ofrece un botón "Quitar".
- [ ] **AC-5.2** Dada una entrada calificada por quien juega con k estrellas, Cuando toca la estrella j distinta de k, Entonces la entrada queda con j estrellas, dadas por la misma persona, y no cambia nada más.
- [ ] **AC-5.3** Dada una entrada calificada por quien juega con k estrellas, Cuando toca la estrella k, Entonces no cambia nada, ni siquiera la auditoría de la entrada.
- [ ] **AC-5.4** Dada una entrada calificada por quien juega, Cuando toca "Quitar", Entonces la entrada queda sin calificación y sin persona que la dio, sus estrellas se muestran vacías, y cualquier otra persona (menos la acreditada) puede calificarla.
- [ ] **AC-5.5** Dada una entrada calificada por otra persona, Cuando quien juega abre el panel, Entonces sus estrellas no se pueden tocar, no hay botón "Quitar" y la fila muestra "Calificó <nombre de quien las dio>"; esto vale también para la persona acreditada.
- [ ] **AC-5.6** Dada una entrada calificada por otra persona, Cuando esa persona vuelve a jugar, Entonces ve las estrellas con "Tu calificación" y puede cambiarlas o quitarlas (AC-5.1).
- [ ] **AC-5.7** Dada una calificación cuya autora se eliminó después, Cuando cualquier persona abre el panel, Entonces la calificación sigue con sus estrellas, no se puede tocar ni quitar, y la fila muestra "Calificó <nombre> (ya no está)".
- [ ] **AC-5.8** Dado un intento de cambiar o quitar una calificación dada por otra persona, o de quitar una entrada que no tiene calificación (por ejemplo, con datos desactualizados), Cuando se aplica, Entonces se rechaza con un mensaje que explica el motivo y no cambia nada.
- [ ] **AC-5.9** Dada una calificación cambiada o quitada, Cuando se completa, Entonces el cambio queda guardado en el momento y el promedio de la persona acreditada se actualiza.

### Story 6: El tope de 200 entradas

**As a** usuario del teléfono
**I want** que el historial no crezca sin límite
**So that** la app siga ligera

**Acceptance criteria:**

- [ ] **AC-6.1** Dado un historial con 199 entradas, Cuando se marca un "Hecho", Entonces el historial tiene 200 entradas y ninguna se descartó.
- [ ] **AC-6.2** Dado un historial con 200 entradas, Cuando se marca un "Hecho", Entonces el historial sigue con 200 entradas: se descartó la más antigua (la primera que se creó) y se conservan las otras 199 y la nueva.
- [ ] **AC-6.3** Dado un historial con 200 entradas cuya más antigua tiene calificación, Cuando se marca un "Hecho", Entonces se descarta igual, con su calificación.
- [ ] **AC-6.4** Dada una entrada descartada, Cuando se abre el panel, Entonces ya no aparece en la lista ni cuenta en ningún promedio.
- [ ] **AC-6.5** Dado el tope, Cuando se aplica, Entonces el orden se decide por el orden de creación de las entradas y no por su día: si el reloj del teléfono se movió hacia atrás, se descarta igualmente la primera que se creó.
- [ ] **AC-6.6** Dado un historial guardado con más de 200 entradas (por ejemplo, creado por una versión futura), Cuando se abre la app, Entonces se abre con normalidad con todas sus entradas y el tope se aplica en el siguiente "Hecho".
- [ ] **AC-6.7** Dado el tope de 200, Cuando el usuario marca un "Hecho", Entonces la operación no muestra ningún aviso ni pide confirmación por lo que se descarta.

### Story 7: Que el historial resista los cambios del hogar

**As a** usuario
**I want** que lo que se hizo siga viéndose aunque después edite o elimine cosas
**So that** el historial sea fiel a lo que pasó

**Acceptance criteria:**

- [ ] **AC-7.1** Dada una entrada y la actividad de origen, Cuando la actividad se edita (nombre, icono, responsable, espacio, tipo, vencimiento o frecuencia), Entonces la entrada conserva el nombre, el icono y la persona acreditada que tenía al hacerla.
- [ ] **AC-7.2** Dada una entrada y la actividad de origen, Cuando la actividad se elimina, Entonces la entrada sigue en el historial sin cambios.
- [ ] **AC-7.3** Dada una entrada con espacio, Cuando el espacio se renombra o cambia su nombre automático, Entonces la fila muestra el nombre actual del espacio.
- [ ] **AC-7.4** Dada una entrada con espacio, Cuando el espacio se elimina, Entonces la entrada sigue en el historial y la fila muestra "Espacio eliminado" en lugar del nombre del espacio.
- [ ] **AC-7.5** Dada una entrada acreditada a una persona o a una mascota, Cuando se renombra, Entonces la fila muestra el nombre actual.
- [ ] **AC-7.6** Dada una entrada acreditada a un miembro, Cuando el miembro se elimina, Entonces la entrada sigue en el historial y la fila muestra "<nombre> (ya no está)"; sigue visible con "Todos" y no cuenta en ningún promedio ni aparece en el filtro.
- [ ] **AC-7.7** Dada la eliminación de un espacio, de un miembro o de una actividad, Cuando se pide confirmación, Entonces el número de actividades que avisa es el de siempre (003 y 005) y no cuenta entradas del historial; y la confirmación no dice que se pierde historial.
- [ ] **AC-7.8** Dada la eliminación de un cuarto cuyo baño interno se elimina con él o pasa a otro cuarto, Cuando se completa, Entonces las entradas de las actividades de ese baño siguen en el historial, y las de un baño que pasó a otro cuarto conservan su espacio.
- [ ] **AC-7.9** Dada una persona acreditada que se elimina y otra persona que había dado una calificación en una entrada de la primera, Cuando se completa, Entonces la calificación se conserva.
- [ ] **AC-7.10** Dada cualquiera de estas operaciones (editar, eliminar, renombrar, eliminar un espacio o un miembro), Cuando se aplica, Entonces la vigencia de las propuestas de intercambio se calcula como en la 005, sin influencia del historial.

### Story 8: Conservar el historial y abrir hogares anteriores

**As a** usuario
**I want** que al volver a abrir la app estén mi historial y mis calificaciones, y que mi hogar anterior siga igual
**So that** no pierda nada

**Acceptance criteria:**

- [ ] **AC-8.1** Dado un historial con entradas y calificaciones, Cuando el usuario cierra y vuelve a abrir la app, Entonces siguen las mismas entradas, en el mismo orden, con las mismas estrellas y las mismas personas que las dieron.
- [ ] **AC-8.2** Dada una entrada creada, calificada, cambiada o quitada, Cuando se aplica, Entonces el cambio queda guardado en el momento.
- [ ] **AC-8.3** Dado un hogar guardado con la feature 001, 002, 003, 004 o 005, Cuando se abre la app, Entonces se muestran todos sus espacios, habitantes, actividades, rutinas, intercambios, nombres y su jugador, sin ningún aviso de error y con el historial vacío; y los datos pasan a guardarse en el formato nuevo en el siguiente guardado.
- [ ] **AC-8.4** Dados datos guardados sin lista de historial, o con una entrada con un nombre, una fecha y hora o un día que no son válidos, con referencias a actividades o miembros que no existen, con estrellas fuera de 1 a 5, con estrellas sin persona que las dio (o al revés), o con una persona que dio las estrellas que no existe, Cuando se abre la app, Entonces se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001.
- [ ] **AC-8.5** Dados datos guardados con un espacio de una entrada que no existe, Cuando se abre la app, Entonces se muestra el mismo aviso y se crea el hogar inicial.
- [ ] **AC-8.6** Dado un hogar con historial, Cuando se inspeccionan los datos guardados, Entonces no hay ningún promedio, conteo, orden calculado ni filtro guardados.
- [ ] **AC-8.7** Dado un hogar con historial y la app cerrada de forma inesperada, Cuando se vuelve a abrir, Entonces se pierde como máximo el último cambio no aplicado.
- [ ] **AC-8.8** Dado un hogar de la feature 001 a 005 abierto y guardado en el formato nuevo, Cuando se inspeccionan los espacios, habitantes, actividades, rutinas e intercambios, Entonces son idénticos a los de antes de abrirlo.

### Story 9: Identidad estable de las entradas

**As a** propietario que más adelante compartirá su hogar con su familia
**I want** que cada entrada conserve su identidad aunque se califique o cambie lo demás
**So that** futuras funciones, como estadísticas o logros, se apoyen en ella sin perder datos

**Acceptance criteria:**

- [ ] **AC-9.1** Dada una entrada, Cuando se califica, se cambia o se quita su calificación, Entonces su identificador sigue siendo el mismo.
- [ ] **AC-9.2** Dada una entrada creada o modificada, Cuando se inspecciona su registro, Entonces contiene fecha de creación, fecha de última modificación y la cuenta local del propietario como autora.
- [ ] **AC-9.3** Dadas entradas guardadas, Cuando se inspeccionan los datos guardados, Entonces cada una pertenece al hogar y referencia a su actividad, a la persona acreditada, a su espacio y a quien dio las estrellas por identificador, y ninguna referencia una cuenta.
- [ ] **AC-9.4** Dada una entrada, Cuando se renombra a un miembro o a un espacio, o un espacio cambia de nombre automático, Entonces sigue vinculada a los mismos.
- [ ] **AC-9.5** Dada una entrada, Cuando se inspecciona el historial, Entonces ninguna entrada se elimina salvo por el tope de 200; ni "Hecho", ni editar, ni las bajas de actividades, espacios o miembros las borran.

## Functional Requirements

### FR-1: Entrada del historial

Una **entrada** deja constancia de un "Hecho": qué actividad era, quién estaba a cargo, dónde y cuándo.

**Must:**
- Agregar exactamente una entrada cada vez que un "Hecho" se aplica a una actividad por hacer (puntual o repetitiva; de una persona o de una mascota), en la misma operación que ya cambia la actividad.
- Acreditar la entrada a la persona responsable de la actividad **antes** de que una repetitiva intercambiada vuelva a su responsable original.
- Guardar en la entrada el nombre y el icono de la actividad al hacerla, su espacio (o ninguno), el día del calendario local de "hoy" y la fecha y hora del instante.
- Dejar la entrada sin calificación al crearla.
- Guardar la entrada en el momento, junto con la actividad.
- Mantener sin cambios todos los efectos que "Hecho" ya tenía (vencimiento, regreso de una repetitiva intercambiada, estado de los espacios, burbujas, vigencia de las propuestas).

**Must not:**
- Agregar una entrada si el "Hecho" no se aplica (actividad no pendiente, eliminada, hecha o que vence después de hoy).
- Agregar más de una entrada por "Hecho".
- Permitir deshacer un "Hecho" ni editar o eliminar una entrada.

### FR-2: Tope de 200 entradas

**Must:**
- Conservar como máximo las últimas 200 entradas: al agregar una por encima de 200, descartar la más antigua por orden de creación, esté calificada o no.
- Aplicar el tope solo al agregar una entrada, nunca al abrir la app.
- Descartar sin avisos ni confirmaciones.

**Must not:**
- Descartar entradas por otro motivo que el tope.
- Ordenar por el día de la entrada para decidir qué descartar.

### FR-3: Botón y panel del historial

**Must:**
- Mostrar en exploración el botón "Historial" en la esquina superior derecha, debajo de "Intercambios", con un tamaño táctil legible y sin tapar la cruceta ni el cartel de la entrada ni capturar la cruceta.
- Abrir con el botón un panel "Historial" con el filtro, la lista y "Cerrar".
- Listar las entradas de la más reciente a la más antigua, con icono, nombre, persona acreditada, espacio (si tenía), día y estrellas.
- Mostrar el día como "Hoy", "Ayer", "Hace N días" o, si es posterior a hoy, su fecha AAAA-MM-DD.
- Mostrar el espacio con su nombre actual, o "Espacio eliminado" si ya no existe.
- Mostrar la persona acreditada con su nombre actual, o "<nombre> (ya no está)" si fue eliminada.
- Mostrar los textos escritos por el usuario (nombres) siempre como texto.
- Actualizar el panel en menos de 100 ms tras cada acción.

**Must not:**
- Mostrar el botón ni el panel en el modo edición.
- Ocultar entradas según quién juega.
- Cambiar el aspecto de las burbujas, el mapa o el selector "Juega" por el historial.

### FR-4: Filtro por persona y promedio

**Must:**
- Ofrecer el filtro "Todos" y los miembros activos (propietario, familiares, mascotas), con "Todos" elegido cada vez que se abre el panel.
- Mostrar con un miembro elegido solo sus entradas, y su promedio con la cantidad de entradas calificadas.
- Calcular el promedio sobre las entradas del historial acreditadas a ese miembro que tienen calificación: media aritmética, con un decimal, coma decimal y redondeo al más cercano con las mitades hacia arriba.
- Mostrar "sin calificaciones" cuando el miembro no tiene entradas calificadas, y no mostrar promedio con "Todos".
- Recalcular el promedio en cada cambio de calificación, del historial o del filtro.

**Must not:**
- Guardar el promedio ni la cantidad de calificadas.
- Contar las entradas sin calificar como cero.
- Ofrecer en el filtro a un miembro eliminado.

### FR-5: Calificar

**Must:**
- Permitir calificar una entrada a quien juega si es una persona activa (propietario o familiar), distinta de la persona acreditada, con 1 a 5 estrellas enteras y si la entrada no tiene calificación.
- Permitir que cualquier persona califique las entradas acreditadas a mascotas, y las de una persona eliminada.
- Registrar con la calificación quién la dio.
- Rechazar con un mensaje que explique el motivo una calificación cuya entrada no existe, cuya acreditada es quien califica, cuya autora no es una persona activa, cuyas estrellas no son un entero de 1 a 5, o cuya entrada ya tiene la calificación de otra persona.
- Dejar sin cambios todo lo demás: actividades, espacios, miembros, propuestas y otras entradas.

**Must not:**
- Permitir calificarse a uno mismo.
- Permitir más de una calificación por entrada.
- Pedir confirmación al calificar.

### FR-6: Cambiar y quitar una calificación

**Must:**
- Permitir cambiar o quitar una calificación solo a quien la dio.
- Quitar una calificación deja la entrada sin estrellas y sin persona que las dio, y vuelve a poder calificarse.
- No cambiar nada (ni la auditoría) si se elige el mismo número de estrellas que ya tiene.
- Rechazar con un mensaje que explique el motivo el intento de cambiar o quitar la calificación de otra persona, o de quitar una entrada sin calificación.
- Conservar una calificación cuya autora se eliminó, bloqueada para todos.
- Mostrar las calificaciones bloqueadas con quién las dio y sin controles, y las propias con "Tu calificación" y "Quitar".

**Must not:**
- Permitir que otra persona (ni la acreditada) cambie o quite una calificación ajena.
- Permitir que alguien califique una entrada de su propia autoría.

### FR-7: El historial frente a los cambios del hogar

**Must:**
- Conservar las entradas aunque la actividad se edite o elimine, o el espacio o el miembro acreditado se eliminen.
- Mostrar el nombre y el icono de la actividad como eran al hacerla.
- Seguir mostrando los nombres actuales de los miembros y de los espacios.
- No contar entradas del historial en las confirmaciones de eliminar.

**Must not:**
- Eliminar, mover o modificar una entrada como efecto de editar o eliminar una actividad, un espacio o un miembro.
- Influir en la vigencia de las propuestas de intercambio ni en el estado de los espacios.

### FR-8: Persistencia y compatibilidad

**Must:**
- Guardar en el dispositivo las entradas del historial y sus calificaciones junto con el resto del hogar, cada vez que cambian, y restaurarlas al reabrir la app, en el mismo orden.
- Abrir sin pérdida y sin aviso de error un hogar guardado con la feature 001, 002, 003, 004 o 005, con el historial vacío, y guardarlo a partir de entonces en el formato nuevo.
- Considerar ilegibles los datos guardados que no cumplen las condiciones de las versiones anteriores o que: no tienen la lista de historial; tienen una entrada con un nombre, una fecha y hora o un día que no son válidos; con referencias a actividades, miembros o espacios que no existen en el documento (eliminados incluidos); con estrellas que no son nulas ni un entero de 1 a 5; con estrellas y persona que las dio no ambas nulas o ambas presentes; o con una persona que dio las estrellas que no es un miembro del documento. En ese caso, mostrar un aviso y crear el hogar inicial de la feature 001.
- Abrir con normalidad un historial con más de 200 entradas.

**Must not:**
- Perder o modificar los espacios, los habitantes, las actividades, las rutinas, los intercambios, los nombres, el jugador o la posición de un hogar de las features 001 a 005 al abrirlo.
- Guardar el promedio, el conteo de calificadas, el orden calculado ni el filtro.
- Enviar datos fuera del dispositivo.

### FR-9: Identidad y preparación multiusuario

**Must:**
- Dar a cada entrada un identificador estable y globalmente único que no cambie al calificarla.
- Registrar en cada entrada la fecha de creación, la de última modificación y la cuenta autora.
- Referenciar a la actividad, a las personas y al espacio de una entrada por identificador, nunca por nombre ni posición, y no vincular una entrada a una cuenta.
- Conservar los registros de las entradas hasta que el tope las descarte.

**Must not:**
- Perder el vínculo de una entrada con sus miembros, su actividad y su espacio al renombrarlos, renumerar o mover un espacio.

## Non-Functional Requirements

### Performance

- El movimiento de los personajes se mantiene a 60 cuadros por segundo en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares en ruta a la vez, 4 mascotas, el propietario caminando solo, 50 actividades por hacer repartidas por todos los espacios del hogar de mayor tamaño permitido y 200 entradas en el historial.
- Abrir el historial, cambiar el filtro, calificar, cambiar y quitar una calificación muestran el panel actualizado en menos de 100 ms en el dispositivo de referencia, con 200 entradas.
- Marcar un "Hecho" (con su entrada y el posible descarte) no produce una pausa perceptible ni baja de los 60 cuadros por segundo.
- El cálculo del promedio y del orden, con 200 entradas, no produce una pausa perceptible.

### Security

- No hay autenticación en esta feature: la cuenta del propietario es local y cualquier persona del teléfono puede jugar como cualquiera, y por tanto calificar como cualquiera. Es una decisión consciente de la v1 de teléfono compartido.
- Ningún dato sale del dispositivo.
- Los textos escritos por el usuario (nombres de miembros, de espacios y de actividades) se muestran siempre como texto, nunca interpretados como marcado, en el botón, el panel, el filtro y las filas.

### Reliability

- Las reglas del historial se verifican de forma automática sin interfaz y con un reloj inyectado: la acreditación de cada "Hecho" (puntual, repetitiva, intercambiada, de mascota, no por hacer); el tope en 199, 200 y 201 entradas, también con la más antigua calificada; las reglas de calificar (la lista completa de motivos de rechazo de AC-4.7 y AC-5.8); cambiar, quitar y la calificación huérfana; el promedio (redondeo, entradas sin calificar, entradas descartadas, sin calificaciones); y la conservación del historial ante editar y eliminar actividades, espacios y miembros, incluidos los dos casos de un cuarto con baño interno.
- Una prueba de contrato comprueba que "Hecho" produce los mismos resultados que antes de esta feature en la actividad, los estados de los espacios y la vigencia de las propuestas (AC-1.9), y que agrega exactamente una entrada en cada caso de AC-1.1 a AC-1.5.
- Un hogar guardado con la feature 001, 002, 003, 004 o 005 se abre sin pérdida de datos. Se verifica de forma automática con documentos guardados de esas features, incluidos documentos corruptos y entradas del historial inválidas.
- Nunca queda una entrada que referencie una actividad, un miembro o un espacio inexistente; se verifica de forma automática para cualquier eliminación de un espacio o de un miembro y para el tope.
- Un cierre inesperado de la app pierde como máximo el último cambio no aplicado.
- El historial y las calificaciones se verifican también en las dos secuencias que combinan features: un "Hecho" de una repetitiva intercambiada (005) y un "Hecho" tras eliminar al responsable original.

### Usability

- El botón "Historial", el panel, el filtro, las filas y las estrellas tienen un tamaño legible y táctil en un teléfono en vertical; las estrellas se pueden tocar con el pulgar sin tocar la de al lado.
- Se distingue de un vistazo qué calificaciones puede cambiar el jugador actual ("Tu calificación" y "Quitar"), cuáles están bloqueadas ("Calificó <nombre>") y cuáles no se pueden dar ("No puedes calificar tus propias actividades").
- Calificar, cambiar y quitar no piden confirmación: se pueden corregir o quitar, y el panel muestra el resultado.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Se intenta marcar "Hecho" una actividad que ya no está por hacer (datos desactualizados) | No cambia nada y no se agrega ninguna entrada |
| El historial llega a 200 entradas y se hace una más | Se descarta la entrada más antigua, calificada o no, sin avisos |
| Se intenta calificar una entrada propia | Se rechaza con el mensaje "No puedes calificar tus propias actividades" y no cambia nada |
| Se intenta calificar con una calificación fuera de 1 a 5 | Se rechaza con un mensaje que pide elegir de 1 a 5 estrellas y no cambia nada |
| Se intenta calificar una entrada que ya fue descartada por el tope | Se rechaza con un mensaje que explica que ya no está en el historial y no cambia nada |
| Se intenta cambiar o quitar la calificación de otra persona | Se rechaza con un mensaje que explica que solo quien la dio puede cambiarla y no cambia nada |
| Se intenta quitar una entrada que no tiene calificación | Se rechaza con un mensaje y no cambia nada |
| Se elimina a quien dio una calificación | La calificación se conserva y queda bloqueada para todos con "(ya no está)" |
| Se elimina a la persona acreditada o al espacio de una entrada | La entrada se conserva y se muestra con "(ya no está)" o "Espacio eliminado" |
| Se edita o elimina la actividad de una entrada | La entrada se conserva sin cambios |
| El historial está vacío | La lista dice "Aún no hay actividades hechas" |
| Un miembro filtrado no tiene entradas o no tiene calificadas | La lista dice que no tiene actividades hechas en el historial, o el encabezado dice "sin calificaciones" |
| La fecha del teléfono se movió hacia atrás y una entrada queda con un día posterior a hoy | Se muestra su fecha AAAA-MM-DD en lugar de "Hoy" o "Ayer"; el orden y el tope siguen el orden de creación |
| Falla el guardado en el dispositivo | Se muestra un aviso no bloqueante y la sesión continúa con los datos en memoria; se reintenta en el siguiente guardado |
| Los datos guardados no se pueden leer o tienen un historial inválido al abrir la app | Se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001 |

## Open Questions

- Ninguna bloqueante. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-08 y la decisión de arquitectura está registrada en el ADR enlazado.
- **Resueltas en esta spec** (puntos que el PRD dejó para la spec): el botón "Historial" va en la esquina superior derecha, debajo de "Intercambios" (AC-2.1); el filtro lista a las personas y a las mascotas, y el promedio se muestra para cualquiera que se elija (AC-3.1, AC-3.3); la fecha de una entrada se muestra como "Hoy", "Ayer" o "Hace N días" a partir del día local que la entrada guarda, sin depender de la hora del dispositivo en la lógica (AC-2.5); sí se puede calificar la entrada de una persona ya eliminada (AC-4.5); la lista de motivos de rechazo al calificar está en AC-4.7 y AC-5.8; una calificación bloqueada se muestra con las estrellas sin controles y la nota "Calificó <nombre>" (AC-5.5). No hace falta cerrar otros paneles al abrir el historial porque, como el de intercambios, cubre la pantalla.
- **Decisiones que esta spec tomó sobre puntos que el PRD no cerraba**, a confirmar al aprobarla: (a) los textos fijos "Aún no hay actividades hechas", "<nombre> no tiene actividades hechas en el historial", "<nombre>: sin calificaciones", "Tu calificación", "Calificó <nombre>", "No puedes calificar tus propias actividades", "Espacio eliminado" y "(ya no está)"; (b) el día se muestra como "Hoy", "Ayer" y "Hace N días", sin día de la semana; (c) el promedio se redondea a un decimal, con coma decimal y las mitades hacia arriba; (d) tocar la misma estrella que ya tiene la calificación no cambia nada; (e) quitar una calificación libera la entrada para que otra persona la califique; (f) las entradas de un miembro eliminado se ven solo con "Todos" y no cuentan en ningún promedio; (g) el espacio de una entrada se muestra con su nombre actual, o "Espacio eliminado", y no se guarda su nombre; (h) el filtro vuelve a "Todos" cada vez que se abre el panel.
- Riesgos de legibilidad, a medir en un teléfono con la verificación de la fase de integración del plan y a ajustar con evidencia: con cuatro botones en la esquina superior derecha, la pila puede acercarse al centro de la pantalla en teléfonos pequeños; y una fila con icono, nombre, línea de datos, cinco estrellas y un botón "Quitar" puede quedar apretada en 340 px.

## Out of Scope (Future Considerations)

- Deshacer un "Hecho", y editar o eliminar entradas del historial.
- Puntos, niveles, logros, rankings, y estrellas o promedios en el mapa o en el selector "Juega".
- Varias calificaciones por entrada, una cola de "por calificar", y notificaciones o recordatorios.
- Retención del historial por fecha, archivo y exportación.
- Cuentas, inicio de sesión, un dispositivo por persona y sincronización (pieza de multiusuario).
- Restringir qué puede hacer cada jugador (permisos por persona).
- Abrir el historial desde el modo edición.
- Rutinas o actividades propias para las mascotas, y que las mascotas califiquen o jueguen.
- Arte definitivo, animaciones, sonido y música.
