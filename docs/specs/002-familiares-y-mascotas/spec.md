# Feature 002: Familiares y mascotas

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-05
**Branch:** `feat/002-familiares-y-mascotas`
**Source:** [prd.md](prd.md) · [ADR modelo de miembros](../../adr/002-modelo-miembros-personas-mascotas.md) · [ADR movimiento de los habitantes](../../adr/002-movimiento-habitantes-modulo-puro.md) · se apoya en la [spec 001](../001-mapa-editor-hogar/spec.md) (v1.1.0)

---

## Problem Statement

El hogar de Livin tiene hoy un único habitante: el personaje del propietario. Un hogar real lo habitan varias personas y, a menudo, mascotas, y sin ellos el mapa se ve vacío y no hay a quién asignar rutinas ni actividades más adelante. Esta feature permite registrar a los familiares (con su parentesco y género) y a las mascotas (con su especie), y verlos caminar solos por el mapa, como base de las piezas siguientes del proyecto.

## Goals

- El usuario puede registrar hasta 8 familiares (además de su propio personaje), cada uno con nombre, parentesco con el propietario y género.
- El usuario puede registrar hasta 4 mascotas, cada una con nombre y especie.
- Todos se crean, editan y eliminan en el modo edición, y cada cambio se ve en el mapa en menos de 100 ms.
- En modo exploración, los familiares y las mascotas caminan solos y al azar por todo el hogar, sin atravesar paredes, muebles, a otro habitante ni al jugador, y sin bajar de 60 cuadros por segundo.
- Nadie se superpone con nadie, jugador incluido: los habitantes son obstáculos para el jugador.
- Cada habitante muestra su nombre encima y un aspecto distinto según su género (personas) o su especie (mascotas).
- Los habitantes y sus datos se conservan entre sesiones; su posición no.
- Los hogares guardados con la feature 001 se abren sin perder datos.
- Eliminar un habitante pide confirmación y conserva su registro (borrado lógico).

## Non-Goals

- No hay parentesco entre familiares: cada uno solo se relaciona con el propietario.
- No hay rutinas, horarios ni estado "fuera de casa".
- No hay actividades ni estados de limpieza de los espacios.
- No hay cuentas, inicio de sesión ni sincronización para los familiares; ninguno tiene cuenta.
- No se guarda la posición de los habitantes; no se pueden mover a mano ni colocar en un espacio concreto.
- No interactúan con los muebles ni entre sí; tocarlos en modo exploración no hace nada.
- Las mascotas no tienen género ni parentesco.
- No cambian los espacios, su distribución ni sus reglas de la feature 001.

## Users and Context

**Primary users:** el propietario del hogar, que usa la app solo, en un único dispositivo y sin conexión. Es quien registra a los demás habitantes; ellos no usan la app.
**Secondary users:** los familiares, que en features futuras tendrán su propia cuenta. En esta feature no interactúan con la app; el modelo ya contempla miembros sin cuenta.
**Usage context:** sesiones cortas en el celular, en orientación vertical. El usuario registra a su familia una vez y luego ajusta ocasionalmente; recorre el mapa y ve a los habitantes pasear, como los personajes de un juego de consola portátil.
**User mental model:** el mismo de la feature 001 (vista desde arriba, movimiento por casillas, muebles que bloquean el paso). Vocabulario nuevo: "habitante" (cualquier familiar o mascota, sin contar al personaje del propietario), "familiar" (persona del hogar distinta del propietario), "mascota", "parentesco" (relación del familiar con el propietario).
**Relación con la spec 001.** Esta feature reemplaza dos exclusiones de la 001 (que "no permite crear familiares ni mascotas" y que "no mueve personajes de forma autónoma") y amplía la lista de obstáculos para el jugador de FR-6 de la 001, que son las paredes, el mobiliario y los bordes del mapa, con los habitantes. También agrega una sección de habitantes al panel del modo edición (FR-7 de la 001) y una prioridad nueva al tocar una casilla (AC-5.6 de la 001). El resto de la 001 sigue vigente sin cambios.

## User Stories

### Story 1: Registrar un familiar

**As a** propietario del hogar
**I want** agregar a mis familiares con su nombre, su parentesco conmigo y su género
**So that** aparezcan en el mapa de mi casa

**Acceptance criteria:**

- [ ] **AC-1.1** Dado el modo edición, Cuando el usuario toca "+ Familiar", Entonces se abre una ficha de alta con un campo de nombre vacío, una lista de parentescos (Pareja, Hijo/a, Padre o madre, Hermano/a, Abuelo/a, Otro familiar) y una lista de géneros (Femenino, Masculino, Otro), sin ninguna opción preseleccionada, y con el botón de guardar desactivado.
- [ ] **AC-1.2** Dada la ficha de alta de un familiar con nombre válido, parentesco y género elegidos, Cuando el usuario guarda, Entonces el familiar aparece en el mapa, en menos de 100 ms, en una casilla libre elegida al azar, con su nombre encima, y el contador de familiares aumenta en 1.
- [ ] **AC-1.3** Dada la ficha de alta de un familiar, Cuando falta el nombre, el parentesco o el género, Entonces el botón de guardar permanece desactivado y no se crea ningún familiar.
- [ ] **AC-1.4** Dados 8 familiares activos, Cuando el usuario abre el panel del modo edición, Entonces el botón "+ Familiar" aparece desactivado y el contador muestra 8 de 8.
- [ ] **AC-1.5** Dada la ficha de alta de un familiar, Cuando el usuario la cierra sin guardar, Entonces no se crea ningún familiar y nada cambia en el mapa.

### Story 2: Registrar una mascota

**As a** propietario del hogar
**I want** agregar a mis mascotas con su nombre y su especie
**So that** también aparezcan en el mapa de mi casa

**Acceptance criteria:**

- [ ] **AC-2.1** Dado el modo edición, Cuando el usuario toca "+ Mascota", Entonces se abre una ficha de alta con un campo de nombre vacío y una lista de especies (Perro, Gato, Otro), sin ninguna opción preseleccionada y con el botón de guardar desactivado; la ficha no pide parentesco ni género.
- [ ] **AC-2.2** Dada la ficha de alta de una mascota con nombre válido y especie elegida, Cuando el usuario guarda, Entonces la mascota aparece en el mapa, en menos de 100 ms, en una casilla libre elegida al azar, con su nombre encima, y el contador de mascotas aumenta en 1.
- [ ] **AC-2.3** Dada la ficha de alta de una mascota, Cuando falta el nombre o la especie, Entonces el botón de guardar permanece desactivado y no se crea ninguna mascota.
- [ ] **AC-2.4** Dadas 4 mascotas activas, Cuando el usuario abre el panel del modo edición, Entonces el botón "+ Mascota" aparece desactivado y el contador muestra 4 de 4.

### Story 3: Nombres de los habitantes

**As a** propietario del hogar
**I want** que los nombres de mis familiares y mascotas sigan las mismas reglas que los demás nombres
**So that** nunca confunda a dos habitantes en el mapa

**Acceptance criteria:**

- [ ] **AC-3.1** Dado un nombre con espacios al inicio o al final, Cuando el usuario guarda un habitante, Entonces el nombre se guarda sin esos espacios.
- [ ] **AC-3.2** Dado un miembro del hogar llamado "Diana" (el personaje del propietario, un familiar o una mascota), Cuando el usuario intenta guardar a otro habitante con el nombre "diana", Entonces el guardado se rechaza con un mensaje que explica el motivo y no se crea ni modifica nada.
- [ ] **AC-3.3** Dado el campo de nombre de un habitante, Cuando el usuario intenta ingresar más de 20 caracteres, Entonces el campo no acepta caracteres más allá del vigésimo y el nombre guardado tiene como máximo 20 caracteres.
- [ ] **AC-3.4** Dado un habitante eliminado llamado "Luna", Cuando el usuario guarda a otro habitante llamado "Luna", Entonces el guardado se acepta, porque el nombre de un habitante eliminado puede reutilizarse.
- [ ] **AC-3.5** Dado el modo edición, Cuando el usuario edita a un habitante y guarda un nombre vacío o solo con espacios en blanco, Entonces el cambio se rechaza con un mensaje y el nombre anterior se mantiene.

### Story 4: Ver caminar a mi familia y a mis mascotas

**As a** usuario que recorre su hogar
**I want** ver a mis familiares y mascotas caminar solos por la casa
**So that** el hogar se sienta habitado y vivo

**Acceptance criteria:**

- [ ] **AC-4.1** Dado el modo exploración con al menos un habitante, Cuando pasa el tiempo, Entonces cada habitante alterna pausas de entre 1 y 4 segundos con tramos de entre 1 y 6 casillas en una dirección elegida al azar entre las libres, deteniéndose al encontrar un obstáculo.
- [ ] **AC-4.2** Dado un habitante que camina, Cuando avanza de una casilla a la siguiente, Entonces tarda 500 ms por casilla, es decir 2 casillas por segundo, la mitad que el jugador.
- [ ] **AC-4.3** Dado un habitante que camina, Cuando la casilla siguiente es pared, mobiliario, borde del mapa, otro habitante o el jugador, Entonces no cambia de casilla y espera.
- [ ] **AC-4.4** Dado un habitante que camina hacia una puerta o un pasillo, Cuando cruza la puerta, Entonces pasa al otro espacio sin pantalla de transición.
- [ ] **AC-4.5** Dados dos habitantes que eligen a la vez la misma casilla de destino, Cuando ambos intentan entrar en ella en el mismo instante, Entonces solo uno entra en ella y el otro espera.
- [ ] **AC-4.6** Dado el modo exploración con 8 familiares y 4 mascotas, Cuando el usuario camina, Entonces el movimiento del jugador y de los habitantes se mantiene a 60 cuadros por segundo en el dispositivo de referencia.
- [ ] **AC-4.7** Dado un habitante, Cuando se muestra en el mapa, Entonces su nombre aparece encima de él y lo sigue al moverse, en modo exploración y en modo edición.
- [ ] **AC-4.8** Dados un familiar de género Femenino, uno Masculino y uno Otro, y mascotas de especie Perro, Gato y Otro, Cuando se muestran en el mapa, Entonces cada uno se muestra con un aspecto distinto del de los demás de su clase, las mascotas se muestran más pequeñas que las personas y todos se distinguen del personaje del propietario.

### Story 5: Nadie se superpone con nadie

**As a** usuario que recorre su hogar
**I want** que los habitantes y yo no podamos ocupar la misma casilla
**So that** el mapa sea coherente y sepa siempre quién está dónde

**Acceptance criteria:**

- [ ] **AC-5.1** Dado el modo exploración, Cuando el usuario toca una dirección y la casilla siguiente está ocupada por un habitante, Entonces el personaje del propietario no cambia de casilla y queda mirando hacia esa dirección.
- [ ] **AC-5.2** Dado un habitante que va a entrar en una casilla, Cuando esa casilla es la del jugador o la que el jugador acaba de empezar a ocupar al dar un paso, Entonces el habitante no entra en ella y espera.
- [ ] **AC-5.3** Dada una puerta de una sola casilla ocupada por un habitante, Cuando el jugador intenta cruzarla, Entonces no puede hacerlo mientras el habitante siga en ella y puede cruzarla en cuanto el habitante se aparta.
- [ ] **AC-5.4** Dado el modo exploración con habitantes, Cuando transcurre cualquier recorrido de los personajes, Entonces nunca hay dos personajes (jugador o habitantes) en la misma casilla ni un personaje en una pared, un mueble o fuera del mapa.

### Story 6: Colocación de los habitantes al abrir la app y al volver de editar

**As a** usuario
**I want** que los habitantes aparezcan en lugares válidos cada vez que vuelvo a ver el mapa
**So that** nunca vea a alguien atrapado en una pared o encima de mí

**Acceptance criteria:**

- [ ] **AC-6.1** Dada una app que se abre con habitantes guardados, Cuando se muestra el mapa, Entonces el personaje del propietario se ubica según AC-7.4 de la 001 y después cada habitante aparece en una casilla transitable libre elegida al azar, distinta de la de los demás habitantes y de la del jugador.
- [ ] **AC-6.2** Dado el modo edición, Cuando el usuario toca "Listo", Entonces el personaje del propietario se ubica según AC-7.3 y AC-7.4 de la 001 y después cada habitante aparece en una casilla transitable libre elegida al azar, distinta de la de los demás habitantes y de la del jugador, y todos empiezan a caminar.
- [ ] **AC-6.3** Dado un hogar con 8 familiares, 4 mascotas y cualquier combinación permitida de espacios, Cuando se colocan los habitantes, Entonces cada uno recibe una casilla distinta y todas son alcanzables caminando desde la casilla de aparición de la sala.

### Story 7: Gestionar mis habitantes en modo edición

**As a** propietario del hogar
**I want** ver, corregir y quitar a mis familiares y mascotas desde el modo edición
**So that** mi lista de habitantes refleje a mi hogar real

**Acceptance criteria:**

- [ ] **AC-7.1** Dado el modo exploración, Cuando el usuario toca "Editar", Entonces el panel muestra, además de los contadores de espacios, una sección "Habitantes" con "Familiares" y "Mascotas", cada una con su contador "n de límite" y su botón "+".
- [ ] **AC-7.2** Dado el modo exploración con habitantes, Cuando el usuario entra al modo edición, Entonces los habitantes se ven quietos, cada uno en la casilla donde estaba y con su nombre encima; un habitante que estaba dando un paso se queda en la casilla a la que se dirigía.
- [ ] **AC-7.3** Dado el modo edición, Cuando el usuario toca la casilla ocupada por un habitante, Entonces se abre la ficha de ese habitante y no la del espacio que contiene esa casilla.
- [ ] **AC-7.4** Dado el modo edición con el personaje del propietario y un habitante en casillas distintas de un mismo espacio, Cuando el usuario toca la casilla del personaje del propietario, Entonces se abre la ficha del personaje; Cuando toca la del habitante, Entonces se abre la ficha del habitante; Cuando toca cualquier otra casilla del espacio, Entonces se abre la ficha del espacio.
- [ ] **AC-7.5** Dado el modo edición, Cuando se abre la ficha de un familiar, Entonces muestra su nombre, su parentesco y su género actuales, permite cambiarlos y ofrece las opciones de guardar los cambios y Eliminar; la ficha de una mascota muestra su nombre y su especie, con las mismas opciones.
- [ ] **AC-7.6** Dada la ficha de un habitante con un cambio válido, Cuando el usuario guarda, Entonces el mapa muestra el cambio (nombre y aspecto) en menos de 100 ms y la ficha se cierra.
- [ ] **AC-7.7** Dado un habitante en una casilla, Cuando un cambio en modo edición deja esa casilla fuera del mapa, no transitable u ocupada, Entonces solo ese habitante pasa a otra casilla transitable libre elegida al azar y los demás no se mueven.
- [ ] **AC-7.8** Dado el modo edición, Cuando se abre la ficha del personaje del propietario, Entonces permite renombrarlo como en la feature 001 y no muestra parentesco, género ni Eliminar.

### Story 8: Eliminar un habitante

**As a** propietario del hogar
**I want** quitar a un familiar o una mascota que ya no vive en mi hogar
**So that** el mapa y mis contadores estén al día, sin perder el historial

**Acceptance criteria:**

- [ ] **AC-8.1** Dada la ficha de un habitante, Cuando el usuario toca "Eliminar", Entonces se pide confirmación con un mensaje que nombra al habitante.
- [ ] **AC-8.2** Dada la confirmación de eliminación, Cuando el usuario cancela, Entonces no cambia nada: el habitante sigue en el mapa y en el panel.
- [ ] **AC-8.3** Dada la confirmación de eliminación, Cuando el usuario confirma, Entonces el habitante desaparece del mapa y del panel, el contador de su clase baja en 1 y ninguno de los demás habitantes ni de los espacios se crea, elimina o mueve.
- [ ] **AC-8.4** Dado un habitante eliminado, Cuando se inspeccionan los datos guardados, Entonces su registro sigue existiendo con fecha de eliminación, no aparece en el mapa ni en el panel y su nombre puede volver a usarse.

### Story 9: Conservar a mi familia entre sesiones y no perder lo que ya tenía

**As a** usuario
**I want** que al volver a abrir la app estén mis familiares y mascotas, y que mi hogar anterior siga igual
**So that** no tenga que volver a registrarlos ni rehacer mi casa

**Acceptance criteria:**

- [ ] **AC-9.1** Dados familiares y mascotas registrados, Cuando el usuario cierra y vuelve a abrir la app, Entonces siguen los mismos habitantes con los mismos nombres, parentescos, géneros y especies, y sus posiciones se reparten de nuevo según AC-6.1.
- [ ] **AC-9.2** Dado el modo edición, Cuando el usuario agrega, edita o elimina un habitante, Entonces el cambio queda guardado en el momento en que se aplica.
- [ ] **AC-9.3** Dado un hogar guardado con la feature 001, sin habitantes, Cuando se abre la app, Entonces se muestran todos sus espacios, los nombres y el nombre de su personaje, sin ningún aviso de error, y los datos pasan a guardarse en el formato nuevo en el siguiente guardado.
- [ ] **AC-9.4** Dado un hogar guardado con la feature 001, Cuando se abre y se agregan habitantes, Entonces el personaje del propietario conserva su nombre, su cuenta y su vínculo con ella, y no recibe parentesco ni género.
- [ ] **AC-9.5** Dados datos guardados con un habitante inválido (sin clase válida, una mascota con parentesco o con género, una persona con especie, o un parentesco, género o especie fuera de las listas), Cuando se abre la app, Entonces se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001.

### Story 10: Identidad estable de los habitantes

**As a** propietario que más adelante compartirá su hogar con su familia
**I want** que cada familiar y cada mascota conserven su identidad y su historial
**So that** futuras funciones (rutinas, actividades, cuentas) se apoyen en ellos sin perder datos

**Acceptance criteria:**

- [ ] **AC-10.1** Dado un habitante con un identificador, Cuando se renombra o se cambian su parentesco, género o especie, Entonces su identificador sigue siendo el mismo.
- [ ] **AC-10.2** Dado un habitante creado o modificado, Cuando se inspecciona su registro, Entonces contiene fecha de creación, fecha de última modificación y la cuenta local del propietario como autora.
- [ ] **AC-10.3** Dados familiares y mascotas guardados, Cuando se inspeccionan los datos guardados, Entonces ningún habitante tiene una cuenta vinculada y cada uno pertenece al hogar.

## Functional Requirements

### FR-1: Habitantes y límites

Un **habitante** es un familiar o una mascota. El personaje del propietario no es un habitante y no se cuenta en los límites.

**Must:**
- Permitir hasta 8 familiares activos y hasta 4 mascotas activas; los eliminados no cuentan.
- Permitir cero habitantes de cada clase.
- Desactivar el botón "+" de una clase cuando se alcanza su límite.

**Must not:**
- Permitir superar los límites.

### FR-2: Datos de cada habitante

**Must:**
- Pedir a un familiar un nombre, un parentesco con el propietario (Pareja, Hijo/a, Padre o madre, Hermano/a, Abuelo/a, Otro familiar) y un género (Femenino, Masculino, Otro), todos obligatorios y sin valor preseleccionado.
- Pedir a una mascota un nombre y una especie (Perro, Gato, Otro), obligatorios y sin valor preseleccionado.
- Aceptar solo los valores de esas listas cerradas.
- Usar el género de un familiar únicamente para su aspecto en el mapa.

**Must not:**
- Pedir parentesco ni género a una mascota, ni especie a un familiar.
- Permitir valores libres de parentesco, género o especie.
- Restringir el parentesco según el género.

### FR-3: Nombres de los habitantes

**Must:**
- Aplicar a los habitantes las reglas de nombres de miembros de la feature 001, a todos los miembros del hogar a la vez: sin espacios al inicio ni al final, entre 1 y 20 caracteres, y único sin distinguir mayúsculas entre los miembros activos (el personaje del propietario, los familiares y las mascotas).
- Rechazar con un mensaje que explique el motivo los nombres vacíos o repetidos.
- Permitir reutilizar el nombre de un habitante eliminado.

**Must not:**
- Permitir que dos miembros activos se muestren con el mismo nombre.
- Asignar un nombre automático a un habitante nuevo: el nombre siempre lo escribe el usuario.

### FR-4: Alta, edición y baja en modo edición

**Must:**
- Mostrar en el panel del modo edición una sección "Habitantes" con "Familiares" y "Mascotas", cada una con su contador y su botón "+".
- Abrir una ficha de alta al tocar "+ Familiar" o "+ Mascota", y una ficha de edición al tocar a un habitante en el mapa.
- Mostrar el cambio en el mapa en menos de 100 ms tras guardar.
- Pedir confirmación antes de eliminar a un habitante, con un mensaje que lo nombre.
- Marcar como eliminado el registro de un habitante eliminado, con su fecha de eliminación, en lugar de destruirlo.
- Abrir, al tocar una casilla, la ficha de quien la ocupa con esta prioridad: el personaje del propietario, luego el habitante, luego el espacio.
- Mantener la ficha del propietario como en la feature 001.

**Must not:**
- Permitir eliminar al personaje del propietario.
- Crear, eliminar o mover un espacio, o a otro habitante, como efecto de agregar, editar o eliminar a un habitante.
- Permitir crear, editar o eliminar habitantes fuera del modo edición.

### FR-5: Movimiento autónomo

**Must:**
- En modo exploración, hacer que cada habitante alterne pausas de 1 a 4 segundos con tramos de 1 a 6 casillas en una dirección elegida al azar entre las libres, deteniéndose al encontrar un obstáculo.
- Hacer que camine a 2 casillas por segundo.
- Permitirle cruzar puertas y pasillos, sin pantalla de transición.
- Mantener los habitantes quietos en el modo edición.

**Must not:**
- Hacer que un habitante atraviese paredes, mobiliario, bordes del mapa, a otro habitante o al jugador.
- Mover a un habitante de forma que ocupe la misma casilla que otro al mismo tiempo.

### FR-6: Obstáculos y bloqueo mutuo con el jugador

**Must:**
- Tratar a cada habitante como un obstáculo para el jugador: el jugador no cambia de casilla cuando la siguiente está ocupada por un habitante y queda mirando hacia ella.
- Impedir que un habitante entre en la casilla del jugador o en la que este acaba de empezar a ocupar al dar un paso.
- Mantener la regla de que las paredes, el mobiliario y los bordes del mapa bloquean el paso de todos los personajes.

**Must not:**
- Permitir que dos personajes (jugador o habitantes) ocupen la misma casilla.

### FR-7: Aparición y reubicación

**Must:**
- Al abrir la app, ubicar primero al personaje del propietario según la feature 001 y después a cada habitante en una casilla transitable libre elegida al azar, distinta de la de los demás habitantes y de la del jugador.
- Al tocar "Listo", repetir la misma colocación: primero el personaje del propietario según AC-7.3 y AC-7.4 de la 001 y después los habitantes en casillas libres elegidas al azar.
- Al agregar un habitante en modo edición, ubicarlo en una casilla transitable libre elegida al azar.
- Si un cambio del modo edición deja la casilla de un habitante fuera del mapa, no transitable u ocupada, reubicar solo a ese habitante en otra casilla libre elegida al azar; los demás no se mueven.
- Dejar quieto, al entrar al modo edición, a un habitante que está dando un paso, en la casilla a la que se dirigía.

**Must not:**
- Guardar la posición de los habitantes.
- Ubicar a un habitante en una pared, un mueble, una casilla ocupada o fuera del mapa.

### FR-8: Apariencia y etiquetas

**Must:**
- Mostrar a cada habitante con un aspecto propio: tres aspectos para los familiares según su género, tres para las mascotas según su especie, más pequeñas que las personas, y todos distinguibles del personaje del propietario.
- Usar arte de marcador original, sin recursos de terceros con copyright.
- Mostrar el nombre de cada habitante encima de él, en exploración y en edición, siguiéndolo al moverse y actualizándolo al renombrarlo o eliminarlo, con el mismo criterio de legibilidad que las etiquetas de la feature 001.

**Must not:**
- Dejar la etiqueta de un habitante eliminado.
- Hacer que las etiquetas bloqueen el paso o capturen la entrada.

### FR-9: Persistencia y compatibilidad

**Must:**
- Guardar en el dispositivo los habitantes y sus datos (clase, nombre, parentesco, género o especie) junto con el resto del hogar, cada vez que se agregan, editan o eliminan.
- Restaurar los habitantes y sus datos al reabrir la app.
- Abrir sin pérdida y sin aviso de error un hogar guardado con la feature 001, y guardarlo a partir de entonces en el formato nuevo.
- Considerar ilegibles los datos guardados que tengan un habitante inválido (sin clase válida, una mascota con parentesco o con género, una persona con especie, un parentesco, género o especie fuera de las listas, o sin exactamente un miembro vinculado a la cuenta del propietario), y en ese caso mostrar un aviso y crear el hogar inicial de la feature 001.

**Must not:**
- Guardar la posición de los habitantes ni las etiquetas.
- Perder o modificar los espacios, los nombres o el personaje del propietario de un hogar de la feature 001 al abrirlo.
- Enviar datos fuera del dispositivo.

### FR-10: Identidad y preparación para multiusuario

**Must:**
- Dar a cada habitante un identificador estable y globalmente único, que no cambie al renombrarlo ni al cambiar sus datos.
- Registrar en cada habitante la fecha de creación, la fecha de última modificación y la cuenta autora.
- Marcar como eliminados los habitantes borrados, con su fecha de eliminación, y excluirlos de toda vista y validación.
- Guardar a los habitantes como miembros del hogar sin cuenta vinculada.

**Must not:**
- Vincular una cuenta a un habitante en esta feature.
- Hacer que la eliminación de un habitante afecte a los espacios.

## Non-Functional Requirements

### Performance

- El movimiento del jugador y de los habitantes se mantiene a 60 cuadros por segundo en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares y 4 mascotas en el mapa.
- Tras agregar, editar o eliminar un habitante, el mapa actualizado se muestra en menos de 100 ms en el dispositivo de referencia.

### Security

- No hay autenticación en esta feature; la cuenta del propietario es local.
- Ningún dato sale del dispositivo.

### Reliability

- Para cualquier recorrido largo de habitantes en cualquier combinación permitida de espacios, nunca hay dos personajes en la misma casilla ni un personaje en una pared, un mueble o fuera del mapa. Se verifica de forma automática con recorridos reproducibles.
- Un hogar guardado con la feature 001 se abre sin pérdida de datos. Se verifica de forma automática con documentos guardados de esa feature, incluidos documentos corruptos.
- Un cierre inesperado de la app pierde como máximo el último cambio no aplicado; los cambios del modo edición se guardan en el momento en que se aplican.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| El usuario ingresa un nombre de habitante vacío o repetido | Se rechaza, se muestra el motivo y no se crea ni modifica nada |
| El usuario intenta superar 20 caracteres en un nombre | No se guarda un nombre de más de 20 caracteres |
| El usuario intenta agregar un habitante con el límite alcanzado | El botón "+" de su clase está desactivado; no se crea nada |
| El usuario cancela la eliminación de un habitante | No cambia nada |
| Un habitante está en una puerta de una casilla y el jugador quiere cruzar | El jugador espera hasta que el habitante se aparta; no se produce ninguna superposición |
| Un cambio de modo edición deja inválida u ocupada la casilla de un habitante | Solo ese habitante pasa a otra casilla libre elegida al azar |
| Falla el guardado en el dispositivo | Se muestra un aviso no bloqueante y la sesión continúa con los datos en memoria; se reintenta en el siguiente guardado |
| Los datos guardados no se pueden leer o tienen un habitante inválido al abrir la app | Se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001 |

## Open Questions

- Ninguna. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-05; las dos decisiones de arquitectura están registradas en los ADR enlazados.

## Out of Scope (Future Considerations)

- Árbol familiar y relaciones entre familiares.
- Rutinas, horarios y el estado "fuera de casa" (pieza 3).
- Actividades, asignaciones y estado visual de los espacios (pieza 4).
- Negociación de intercambios y calificaciones (pieza 5).
- Cuentas reales, inicio de sesión, sincronización y permisos para los familiares (pieza de multiusuario).
- Guardar la posición de los habitantes, colocarlos a mano o elegir en qué espacio viven.
- Interacción de los habitantes con los muebles o entre sí; tocarlos en modo exploración.
- Género o parentesco para las mascotas; más especies que Perro, Gato y Otro.
- Arte definitivo, animaciones de caminata, sonido y música.
- Más de un propietario o más de un hogar por cuenta.
