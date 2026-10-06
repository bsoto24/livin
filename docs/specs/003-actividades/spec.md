# Feature 003: Actividades

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-06
**Branch:** `feat/003-actividades`
**Source:** [prd.md](prd.md) · [ADR modelo de actividades](../../adr/003-modelo-actividades-formato-v3.md) · [ADR estado derivado y fechas](../../adr/003-estado-derivado-fechas-reloj-inyectado.md) · se apoya en la [spec 001](../001-mapa-editor-hogar/spec.md) (v1.1.0) y la [spec 002](../002-familiares-y-mascotas/spec.md) (v1.0.0)

---

## Problem Statement

Livin existe para que las personas que comparten un hogar vean de un vistazo cómo está la casa y quién se encarga de qué. Hoy el mapa tiene espacios y habitantes, pero no tiene nada que hacer: no hay tareas, nadie tiene nada a su cargo y todos los espacios se ven igual. Esta feature agrega las actividades del hogar: el usuario las registra (puntuales o repetitivas), las asigna a un miembro y, si quiere, a un espacio, y el mapa muestra su estado. Los espacios con tareas vencidas se ven desordenados y, si el atraso crece, en desastre; marcar una tarea como hecha los limpia.

## Goals

- El usuario crea, edita y elimina actividades en el modo edición, con nombre, icono, miembro asignado (obligatorio) y espacio (opcional), hasta 50 activas.
- Una actividad es puntual (vence en una fecha) o repetitiva (cada 1, 2, 3, 7, 14 o 30 días); los plazos son por día, sin hora.
- El estado de cada espacio (limpio, desordenado, desastre) se calcula a partir de sus actividades vencidas; el usuario no lo marca a mano.
- El mapa muestra ese estado con objetos en el suelo y una insignia junto al nombre del espacio, y muestra una sola burbuja por lugar con lo que hay por hacer.
- Tocar una burbuja abre una hoja con las actividades de ese lugar; en exploración permite marcarlas como hechas, sin caminar hasta el sitio.
- Eliminar un espacio o un miembro elimina sus actividades, y la confirmación avisa cuántas.
- Las actividades se conservan entre sesiones y los hogares guardados con las features 001 y 002 se abren sin perder datos.
- El estado se mantiene al día con el paso de los días, también con la app abierta.

## Non-Goals

- No hay rutinas, horarios ni plazos con hora (pieza 3).
- No hay negociación de intercambios ni calificaciones (pieza 5).
- No hay cuentas, inicio de sesión ni sincronización para los familiares; el propietario marca las actividades de todos.
- No hay historial de actividades hechas, estadísticas, puntos ni logros, y marcar una actividad como hecha no se puede deshacer.
- No hay notificaciones, recordatorios ni alarmas.
- No hay que caminar hasta el espacio para completar una actividad.
- No hay actividades en pasillos ni con varios miembros asignados.
- No se pueden elegir frecuencias libres ni días de la semana concretos.
- No se agregan tipos de espacio ni cambia el editor de espacios de la feature 001, salvo lo indicado para eliminar espacios con actividades.

## Users and Context

**Primary users:** el propietario del hogar, que usa la app solo, en un único dispositivo y sin conexión. Es quien registra las actividades y quien las marca como hechas, también por los demás miembros, que no tienen cuenta ni usan la app.
**Secondary users:** los familiares, que en features futuras tendrán su propia cuenta y marcarán sus propias actividades. En esta feature no interactúan con la app; las actividades apuntan a un miembro, no a una cuenta.
**Usage context:** sesiones cortas en el celular, en orientación vertical. El usuario configura sus actividades una vez y luego las ajusta de vez en cuando; en el día a día recorre el mapa, ve qué espacios piden atención por sus burbujas y objetos, y marca lo que ya se hizo.
**User mental model:** el mismo de las features 001 y 002 (vista desde arriba, espacios, habitantes, modo edición y modo exploración). Vocabulario nuevo: "actividad" (una tarea del hogar); "puntual" y "repetitiva"; "por hacer" (una actividad pendiente cuya fecha de vencimiento es hoy o ya pasó); "atraso" (días enteros entre el vencimiento y hoy); "burbuja" (la señal sobre el mapa de lo que hay por hacer en un lugar); "lugar" (un espacio, o un miembro para las actividades sin espacio); "hoja" (el panel inferior con las actividades de un lugar); "limpio", "desordenado" y "desastre" (los tres estados de un espacio).
**Relación con las specs anteriores.** Esta feature reemplaza la exclusión de la 001 de que no gestiona actividades ni muestra estados de limpieza de los espacios, y la de la 002 de que no hay actividades. Amplía tres reglas existentes: la prioridad al tocar una casilla en modo edición (personaje del propietario, habitante, espacio; AC-7.3 y AC-7.4 de la 002) gana la burbuja entre el habitante y el espacio; la confirmación de eliminar un espacio (AC-5.3, AC-5.4 y AC-4.7 de la 001) se pide también cuando el espacio o su baño interno tienen actividades; y la confirmación de eliminar un habitante (AC-8.1 de la 002) avisa cuántas actividades se eliminarán con él. Resuelve dos asuntos que la 001 dejó abiertos para esta pieza: qué ocurre con una actividad cuando se elimina su espacio (se elimina con él) y que el estado de un espacio solo considera las actividades vinculadas a él. El resto de las specs 001 y 002 sigue vigente sin cambios.

## User Stories

### Story 1: Crear una actividad

**As a** propietario del hogar
**I want** registrar una tarea del hogar, asignarla a un miembro y, si quiero, a un espacio, con su plazo
**So that** el mapa me muestre qué hay por hacer y quién se encarga

**Acceptance criteria:**

- [ ] **AC-1.1** Dado el modo edición, Cuando el usuario toca "+ Actividad", Entonces se abre una ficha de alta con un campo de nombre vacío; una lista de iconos (Platos, Barrer, Ropa, Basura, Limpiar, Compras, Plantas, Mascota, Otra) con "Otra" elegido; una lista con todos los miembros activos (el personaje del propietario, los familiares y las mascotas) sin ninguno elegido; una lista de espacios activos con "Sin espacio" elegido; una elección de tipo (Puntual o Repetitiva) con "Puntual" elegido; un campo de fecha con la fecha de hoy; y el botón de guardar desactivado.
- [ ] **AC-1.2** Dada la ficha de alta con el tipo "Repetitiva", Entonces aparece además una lista de frecuencias (Cada día, Cada 2 días, Cada 3 días, Cada 7 días, Cada 14 días, Cada 30 días) sin ninguna elegida; con el tipo "Puntual" esa lista no aparece.
- [ ] **AC-1.3** Dada la ficha de alta con nombre válido, un miembro elegido y la fecha de hoy, Cuando el usuario guarda, Entonces la actividad se crea, la ficha se cierra, el contador de actividades aumenta en 1 y, en menos de 100 ms, el mapa muestra su burbuja.
- [ ] **AC-1.4** Dada la ficha de alta con una fecha futura, Cuando el usuario guarda, Entonces la actividad se crea y aparece en la lista del panel, pero el mapa no muestra ninguna burbuja ni cambia el estado de ningún espacio.
- [ ] **AC-1.5** Dada la ficha de alta con una fecha de hace 3 días y un espacio elegido, Cuando el usuario guarda, Entonces la actividad se crea con 3 días de atraso y ese espacio pasa a mostrarse en desastre.
- [ ] **AC-1.6** Dada la ficha de alta, Cuando falta el nombre o el miembro, o el tipo es Repetitiva y no hay frecuencia elegida, Entonces el botón de guardar permanece desactivado y no se crea ninguna actividad.
- [ ] **AC-1.7** Dadas 50 actividades activas, Cuando el usuario abre el panel del modo edición, Entonces el botón "+ Actividad" aparece desactivado y el contador muestra 50 de 50.
- [ ] **AC-1.8** Dada la ficha de alta, Cuando el usuario la cierra sin guardar, Entonces no se crea ninguna actividad y nada cambia en el mapa.
- [ ] **AC-1.9** Dado un nombre con espacios al inicio o al final, Cuando el usuario guarda, Entonces el nombre se guarda sin esos espacios; Dado el campo de nombre, Cuando el usuario intenta ingresar más de 30 caracteres, Entonces el campo no acepta caracteres más allá del trigésimo.
- [ ] **AC-1.10** Dada una actividad llamada "Barrer", Cuando el usuario guarda otra actividad llamada "barrer", Entonces el guardado se acepta, porque los nombres de las actividades pueden repetirse.

### Story 2: Ver qué hay por hacer en el mapa

**As a** usuario que recorre su hogar
**I want** ver sobre el mapa dónde hay tareas por hacer
**So that** sepa de un vistazo qué pide atención, sin abrir listas

**Acceptance criteria:**

- [ ] **AC-2.1** Dado un espacio con exactamente una actividad por hacer, Cuando se muestra el mapa en modo exploración o en modo edición, Entonces ese espacio muestra una sola burbuja con el icono de esa actividad y sin indicador de "más".
- [ ] **AC-2.2** Dado un espacio con tres actividades por hacer, con atrasos de 0, 2 y 1 días, Cuando se muestra el mapa, Entonces el espacio muestra una sola burbuja con el icono de la actividad de 2 días de atraso y, junto a él, un segundo icono "+" que indica que hay más actividades.
- [ ] **AC-2.3** Dadas dos actividades por hacer del mismo espacio con el mismo atraso, Cuando se muestra el mapa, Entonces la burbuja muestra el icono de la que se creó primero.
- [ ] **AC-2.4** Dadas actividades por hacer en dos espacios distintos, Cuando se muestra el mapa, Entonces cada uno de esos dos espacios muestra su propia burbuja y ningún otro espacio muestra una.
- [ ] **AC-2.5** Dada una actividad por hacer, sin espacio, asignada a un habitante, Cuando se muestra el mapa, Entonces se muestra una burbuja sobre ese habitante, y la burbuja lo sigue mientras camina; si ese habitante tiene varias actividades por hacer sin espacio, muestra una sola burbuja con el icono de la más atrasada y el indicador de "más".
- [ ] **AC-2.6** Dada una actividad por hacer con un espacio asignado, Cuando se muestra el mapa, Entonces su burbuja está en ese espacio y no sobre el miembro asignado.
- [ ] **AC-2.7** Dadas actividades que vencen en el futuro, actividades puntuales ya hechas y actividades eliminadas, Cuando se muestra el mapa, Entonces ninguna de ellas aporta una burbuja.
- [ ] **AC-2.8** Dado un espacio con una burbuja, Cuando se muestra el mapa, Entonces la burbuja se dibuja en una casilla del área de ese espacio que no es una puerta, y es siempre la misma casilla para el mismo hogar y las mismas actividades.
- [ ] **AC-2.9** Dado el modo exploración con burbujas visibles, Cuando el usuario toca la cruceta o camina, Entonces las burbujas no bloquean el paso de ningún personaje ni capturan la entrada de la cruceta, y el movimiento se mantiene a 60 cuadros por segundo.

### Story 3: Abrir la hoja y marcar una actividad como hecha

**As a** propietario del hogar
**I want** abrir las actividades de un lugar y marcar las que ya se hicieron
**So that** el mapa se limpie sin tener que caminar hasta cada espacio

**Acceptance criteria:**

- [ ] **AC-3.1** Dado el modo exploración y un lugar con burbuja, Cuando el usuario toca la burbuja, Entonces se abre una hoja con el nombre del lugar (el del espacio o el del miembro) y, por cada actividad por hacer de ese lugar, su icono, su nombre, el miembro asignado, su plazo ("Vence hoy" o "Atrasada N días") y un botón "Hecho"; la hoja no ofrece crear, editar ni eliminar.
- [ ] **AC-3.2** Dada la hoja con una actividad puntual, Cuando el usuario toca "Hecho", Entonces la actividad deja de estar por hacer, desaparece de la hoja y de la burbuja, y el mapa se actualiza en menos de 100 ms; si era la última del lugar, la hoja se cierra y la burbuja desaparece.
- [ ] **AC-3.3** Dada la hoja con una actividad repetitiva cada 7 días, Cuando el usuario toca "Hecho", Entonces la actividad deja de estar por hacer y su próximo vencimiento pasa a ser la fecha de hoy más 7 días, sin acumular los atrasos anteriores.
- [ ] **AC-3.4** Dado un espacio en desastre cuya única actividad por hacer tiene 4 días de atraso, Cuando el usuario la marca como hecha, Entonces el espacio pasa a limpio.
- [ ] **AC-3.5** Dado un espacio con dos actividades por hacer, con atrasos de 4 y 1 días, Cuando el usuario marca como hecha la de 4 días, Entonces el espacio pasa a desordenado.
- [ ] **AC-3.6** Dada una actividad asignada a un familiar o a una mascota, Cuando el usuario toca "Hecho" desde la hoja, Entonces la actividad se marca como hecha, porque el propietario puede marcar las actividades de cualquier miembro.
- [ ] **AC-3.7** Dada la hoja abierta, Cuando el usuario la cierra sin tocar "Hecho", Entonces nada cambia.
- [ ] **AC-3.8** Dada una actividad marcada como hecha, Cuando el usuario cierra y vuelve a abrir la app, Entonces sigue marcada como hecha (una puntual no vuelve a estar por hacer; una repetitiva conserva su nuevo vencimiento).
- [ ] **AC-3.9** Dado un lugar con más actividades por hacer de las que caben en la pantalla de una vez, Cuando el usuario abre su hoja, Entonces puede recorrer toda la lista y alcanzar cada actividad con su botón "Hecho".

### Story 4: Estado de limpieza de los espacios

**As a** usuario que recorre su hogar
**I want** que cada espacio se vea más desordenado cuanto más atrasadas estén sus tareas
**So that** lea cómo está la casa de un vistazo

**Acceptance criteria:**

- [ ] **AC-4.1** Dado un espacio sin actividades por hacer, Cuando se muestra el mapa, Entonces su estado es limpio: la insignia junto a su nombre es "✓" y no hay objetos en su suelo.
- [ ] **AC-4.2** Dado un espacio cuya actividad más atrasada vence hoy (atraso de 0 días), Cuando se muestra el mapa, Entonces su estado sigue siendo limpio, aunque muestre su burbuja.
- [ ] **AC-4.3** Dado un espacio cuya actividad más atrasada tiene 1 o 2 días de atraso, Cuando se muestra el mapa, Entonces su estado es desordenado: la insignia es "!" y su suelo muestra 4 objetos.
- [ ] **AC-4.4** Dado un espacio cuya actividad más atrasada tiene 3 o más días de atraso, Cuando se muestra el mapa, Entonces su estado es desastre: la insignia es "!!" y su suelo muestra 12 objetos.
- [ ] **AC-4.5** Dadas una actividad atrasada asignada a la cocina y otra atrasada asignada a un miembro sin espacio, Cuando se muestra el mapa, Entonces solo la cocina cambia de estado, y ningún otro espacio ni lugar cambia.
- [ ] **AC-4.6** Dado un baño interno con una actividad atrasada, Cuando se muestra el mapa, Entonces el baño interno cambia de estado y su cuarto no, porque cada baño interno es un espacio propio.
- [ ] **AC-4.7** Dado un espacio en desordenado o en desastre, Cuando se muestra el mapa de nuevo (tras recargar la app o tras un cambio en el modo edición), Entonces los objetos aparecen exactamente en las mismas casillas, que son casillas del espacio que no son pared, puerta ni mueble; si el espacio tiene menos casillas libres que objetos, se muestran tantos como casillas libres haya.
- [ ] **AC-4.8** Dados objetos en el suelo de un espacio, Cuando un personaje camina por ellos, Entonces los objetos no bloquean su paso y los personajes se dibujan por encima de ellos.
- [ ] **AC-4.9** Dado el mapa en modo exploración y en modo edición, Cuando se muestra, Entonces cada espacio muestra su insignia junto a su nombre, los pasillos no muestran ninguna, y la insignia no bloquea el paso ni captura la entrada.

### Story 5: El paso de los días

**As a** usuario
**I want** que el estado de mi casa se mantenga al día sin hacer nada
**So that** lo que veo en el mapa sea siempre lo de hoy

**Acceptance criteria:**

- [ ] **AC-5.1** Dada una actividad que vence mañana, Cuando pasa la medianoche con la app abierta, Entonces, sin recargar, aparece su burbuja y el estado de su espacio corresponde a la nueva fecha.
- [ ] **AC-5.2** Dado un espacio desordenado por una actividad con 2 días de atraso, Cuando pasa la medianoche con la app abierta, Entonces el espacio pasa a desastre sin recargar.
- [ ] **AC-5.3** Dada la app en segundo plano durante varios días, Cuando vuelve a primer plano, Entonces las burbujas y los estados corresponden a la fecha de ese momento.
- [ ] **AC-5.4** Dada la app cerrada durante varios días, Cuando se abre, Entonces las burbujas y los estados corresponden a la fecha de ese momento, sin ninguna acción del usuario.
- [ ] **AC-5.5** Dadas fechas fijas, Cuando se calcula el estado de un espacio a las 00:00 y a las 23:59 del mismo día, Entonces el resultado es el mismo, porque los plazos son por día.
- [ ] **AC-5.6** Dada una actividad repetitiva cada 3 días marcada como hecha hoy, Cuando pasan 2 días, Entonces no aparece ninguna burbuja por ella; Cuando pasan 3 días, Entonces vuelve a estar por hacer con 0 días de atraso.

### Story 6: Gestionar mis actividades en modo edición

**As a** propietario del hogar
**I want** ver, corregir y quitar todas mis actividades desde el modo edición
**So that** mi lista refleje las tareas reales de mi hogar

**Acceptance criteria:**

- [ ] **AC-6.1** Dado el modo exploración, Cuando el usuario toca "Editar", Entonces el panel muestra, además de las secciones de espacios y habitantes, una sección "Actividades" con el contador "n de 50", el botón "+ Actividad" y la lista de todas las actividades pendientes (las que están por hacer y las futuras), ordenadas por fecha de vencimiento, cada una con su icono, su nombre, el miembro asignado, su espacio o "Sin espacio" y su plazo; las puntuales ya hechas no aparecen.
- [ ] **AC-6.2** Dada la lista de actividades, Cuando el usuario toca una fila, Entonces se abre la ficha de edición de esa actividad con sus datos actuales (nombre, icono, miembro, espacio, tipo, fecha y frecuencia).
- [ ] **AC-6.3** Dada la ficha de edición con un cambio válido, Cuando el usuario guarda, Entonces el mapa muestra el cambio (burbuja y estado de los espacios afectados) en menos de 100 ms, la ficha se cierra y el identificador de la actividad no cambia.
- [ ] **AC-6.4** Dada la ficha de edición de una actividad puntual, Cuando el usuario cambia el tipo a Repetitiva y elige una frecuencia, Entonces la actividad pasa a ser repetitiva; Dada una repetitiva, Cuando cambia el tipo a Puntual, Entonces deja de tener frecuencia.
- [ ] **AC-6.5** Dada la ficha de edición, Cuando el usuario guarda un nombre vacío o solo con espacios en blanco, Entonces el cambio se rechaza con un mensaje que explica el motivo y el nombre anterior se mantiene.
- [ ] **AC-6.6** Dada la ficha de edición, Cuando el usuario toca "Eliminar", Entonces se pide confirmación con un mensaje que nombra la actividad; si cancela, no cambia nada; si confirma, la actividad desaparece del mapa y de la lista, el contador baja en 1, ningún espacio, habitante ni otra actividad se crea, elimina o modifica, y su registro sigue existiendo en los datos con fecha de eliminación.
- [ ] **AC-6.7** Dado el modo edición y un lugar con burbuja, Cuando el usuario toca la burbuja, Entonces se abre la hoja con las actividades por hacer de ese lugar y, por cada una, las opciones "Editar" (que abre su ficha de edición) y "Eliminar"; la hoja no ofrece "Hecho".
- [ ] **AC-6.8** Dado el modo edición, Cuando el usuario toca una casilla, Entonces se abre, con esta prioridad: la ficha del personaje del propietario si la casilla es la suya; si no, la ficha del habitante que la ocupa; si no, la hoja de la burbuja que se muestra en esa casilla; si no, la ficha del espacio.
- [ ] **AC-6.9** Dado el modo exploración, Cuando el usuario mira la pantalla, Entonces no hay ninguna opción para crear, editar o eliminar actividades.
- [ ] **AC-6.10** Dado el modo edición con 8 familiares, 4 mascotas y 50 actividades, Cuando el usuario agrega, edita o elimina una actividad, Entonces el mapa actualizado se muestra en menos de 100 ms.

### Story 7: Eliminar espacios o miembros que tienen actividades

**As a** propietario del hogar
**I want** que al eliminar un espacio o un miembro se vayan también sus actividades, sabiendo cuántas
**So that** no queden tareas colgando de algo que ya no existe

**Acceptance criteria:**

- [ ] **AC-7.1** Dado un espacio sin nombre personalizado con 2 actividades pendientes (una por hacer y una futura), Cuando el usuario toca "Eliminar" en su ficha, Entonces se pide confirmación con un mensaje que indica que se eliminarán 2 actividades; un espacio sin nombre personalizado y sin actividades se sigue eliminando sin confirmación.
- [ ] **AC-7.2** Dada la confirmación de la eliminación de un espacio con actividades, Cuando el usuario cancela, Entonces no cambia nada: el espacio y sus actividades siguen donde estaban.
- [ ] **AC-7.3** Dada la confirmación de la eliminación de un espacio con actividades, Cuando el usuario confirma, Entonces el espacio y sus actividades desaparecen del mapa, de la lista y de las burbujas, y las actividades de los demás espacios y las que no tienen espacio permanecen.
- [ ] **AC-7.4** Dado un cuarto con baño interno, sin otro cuarto libre donde moverlo, Cuando el usuario elimina el cuarto, Entonces la confirmación indica también el total de actividades que se eliminarán, sumando las del cuarto y las de su baño; al confirmar se eliminan todas.
- [ ] **AC-7.5** Dado un cuarto con baño interno que tiene actividades, y otro cuarto sin baño donde el baño puede moverse, Cuando el usuario elimina el cuarto y confirma, Entonces se eliminan las actividades del cuarto, el baño se mueve al otro cuarto con todas sus actividades, y su burbuja y su estado se muestran allí.
- [ ] **AC-7.6** Dado un tipo de espacio cuyo último espacio o cuyo baño interno más reciente tiene actividades, Cuando el usuario toca "−" en su contador, Entonces se pide la misma confirmación que al eliminarlo desde su ficha, con el número de actividades que se eliminarán.
- [ ] **AC-7.7** Dado un familiar o una mascota con 3 actividades pendientes, Cuando el usuario toca "Eliminar" en su ficha, Entonces la confirmación nombra al habitante e indica que se eliminarán 3 actividades; si cancela, no cambia nada; si confirma, el habitante y sus actividades desaparecen.
- [ ] **AC-7.8** Dado un habitante sin actividades pendientes, Cuando el usuario toca "Eliminar" en su ficha, Entonces la confirmación es la de la feature 002, sin mención de actividades.
- [ ] **AC-7.9** Dado el personaje del propietario con actividades, Cuando se abre su ficha, Entonces no ofrece Eliminar y sus actividades se mantienen.
- [ ] **AC-7.10** Dadas actividades eliminadas con un espacio o un miembro, Cuando se inspeccionan los datos guardados, Entonces sus registros siguen existiendo con fecha de eliminación y no aparecen en el mapa ni en la lista.

### Story 8: Conservar mis actividades y no perder lo que ya tenía

**As a** usuario
**I want** que al volver a abrir la app estén mis actividades y que mi hogar anterior siga igual
**So that** no tenga que volver a registrarlas ni rehacer mi casa

**Acceptance criteria:**

- [ ] **AC-8.1** Dadas actividades registradas, Cuando el usuario cierra y vuelve a abrir la app, Entonces siguen las mismas actividades con los mismos nombres, iconos, miembros, espacios, tipos, vencimientos y frecuencias, y el mapa muestra las mismas burbujas y estados que corresponden a la fecha de ese momento.
- [ ] **AC-8.2** Dado el modo edición o la hoja en exploración, Cuando el usuario crea, edita, elimina o marca como hecha una actividad, Entonces el cambio queda guardado en el momento en que se aplica.
- [ ] **AC-8.3** Dado un hogar guardado con la feature 001, sin habitantes ni actividades, Cuando se abre la app, Entonces se muestran todos sus espacios, sus nombres y el nombre de su personaje, sin ningún aviso de error, sin actividades, y los datos pasan a guardarse en el formato nuevo en el siguiente guardado.
- [ ] **AC-8.4** Dado un hogar guardado con la feature 002, con familiares y mascotas, Cuando se abre la app, Entonces se muestran todos sus espacios, habitantes, nombres y datos, sin ningún aviso de error, sin actividades, y los datos pasan a guardarse en el formato nuevo en el siguiente guardado.
- [ ] **AC-8.5** Dados datos guardados con una actividad activa inválida (sin tipo o sin icono válido, con una fecha que no existe en el calendario, repetitiva sin una frecuencia de la lista, puntual con frecuencia, repetitiva marcada como hecha, o que apunta a un miembro o a un espacio inexistente o eliminado), Cuando se abre la app, Entonces se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001.
- [ ] **AC-8.6** Dados datos guardados con una actividad eliminada que tiene datos inválidos y todas las demás válidas, Cuando se abre la app, Entonces el hogar se abre con normalidad, sin aviso.

### Story 9: Identidad estable de las actividades

**As a** propietario que más adelante compartirá su hogar con su familia
**I want** que cada actividad conserve su identidad aunque cambien sus datos
**So that** futuras funciones (rutinas, intercambios, cuentas) se apoyen en ellas sin perder datos

**Acceptance criteria:**

- [ ] **AC-9.1** Dada una actividad con un identificador, Cuando se edita (nombre, icono, miembro, espacio, tipo, fecha o frecuencia) o se marca como hecha, Entonces su identificador sigue siendo el mismo.
- [ ] **AC-9.2** Dada una actividad creada o modificada, Cuando se inspecciona su registro, Entonces contiene fecha de creación, fecha de última modificación y la cuenta local del propietario como autora.
- [ ] **AC-9.3** Dadas actividades guardadas, Cuando se inspeccionan los datos guardados, Entonces cada una pertenece al hogar, referencia a su miembro y, si la tiene, a su espacio por identificador, y ninguna referencia una cuenta.
- [ ] **AC-9.4** Dada una actividad asignada a un miembro y a un espacio, Cuando el usuario renombra el miembro o el espacio, o el espacio cambia de nombre automático por una renumeración, Entonces la actividad sigue vinculada a los mismos.
- [ ] **AC-9.5** Dada una actividad puntual marcada como hecha, Cuando se inspecciona su registro, Entonces conserva su identificador, no está eliminada y registra el día en que se hizo.

## Functional Requirements

### FR-1: Actividades y sus datos

Una **actividad** es una tarea del hogar con nombre, icono, un miembro asignado, un espacio opcional y un plazo.

**Must:**
- Pedir un nombre de 1 a 30 caracteres, sin espacios al inicio ni al final, que puede repetirse entre actividades.
- Pedir un icono de la lista cerrada (Platos, Barrer, Ropa, Basura, Limpiar, Compras, Plantas, Mascota, Otra), con "Otra" elegido de inicio.
- Pedir un miembro activo (el personaje del propietario, un familiar o una mascota), sin valor elegido de inicio.
- Permitir un espacio activo opcional, con "Sin espacio" elegido de inicio.
- Pedir un tipo: puntual o repetitiva, con puntual elegido de inicio.
- Pedir una fecha de vencimiento, que debe ser una fecha real del calendario, con la fecha de hoy de inicio; puede ser pasada.
- Pedir, en las repetitivas, una frecuencia de la lista cerrada (1, 2, 3, 7, 14 o 30 días), sin valor elegido de inicio.
- Permitir hasta 50 actividades activas por hogar; las eliminadas no cuentan.

**Must not:**
- Permitir superar el límite.
- Permitir una actividad sin nombre o sin miembro.
- Permitir valores libres de icono o frecuencia.
- Asignar una actividad a un pasillo.
- Asignar una actividad a más de un miembro.

### FR-2: Vencimiento, "por hacer" y atraso

**Must:**
- Medir los plazos en días del calendario local del dispositivo, sin hora: una actividad vence al empezar su día de vencimiento.
- Considerar **por hacer** una actividad pendiente cuyo vencimiento es hoy o una fecha anterior; considerar **pendiente** una actividad no eliminada que, si es puntual, no se ha marcado como hecha.
- Definir el **atraso** como los días enteros entre el vencimiento y hoy (0 si vence hoy).
- Tratar las actividades pendientes que vencen en el futuro como no vencidas: no aportan burbuja ni cambian ningún estado.

**Must not:**
- Depender de la hora del día para decidir si una actividad vence o cuál es su atraso.

### FR-3: Marcar como hecha

**Must:**
- Permitir marcar una actividad por hacer como hecha desde la hoja de su burbuja en el modo exploración, sin que el personaje esté en el espacio, y también cuando está asignada a otro miembro.
- Dejar de considerar pendiente una actividad puntual marcada como hecha, conservando su registro con el día en que se hizo.
- Fijar, en una actividad repetitiva marcada como hecha, su próximo vencimiento en la fecha de hoy más su frecuencia, sin acumular atrasos anteriores.
- Guardar el cambio en el momento en que se aplica y mostrarlo en el mapa en menos de 100 ms.

**Must not:**
- Ofrecer "Hecho" en el modo edición ni para actividades que no están por hacer.
- Exigir que el personaje camine hasta el espacio.
- Permitir deshacer un "Hecho" en esta feature.

### FR-4: Estado de un espacio

**Must:**
- Calcular el estado de cada espacio activo a partir de la actividad por hacer más atrasada de entre las vinculadas a él por espacio: **limpio** si no hay ninguna o su atraso es de 0 días, **desordenado** con 1 o 2 días de atraso y **desastre** con 3 o más.
- Tratar a cada baño interno como un espacio propio, con su propio estado.
- Recalcular el estado cada vez que cambian las actividades, los espacios o la fecha de hoy.
- Tomar los umbrales (0 días, 1 a 2 días, 3 o más) como valores de partida, ajustables tras probarlos en un teléfono.

**Must not:**
- Guardar el estado de un espacio.
- Permitir que el usuario fije el estado a mano.
- Hacer que las actividades de un espacio, o sin espacio, cambien el estado de otro espacio.
- Asignar un estado a los pasillos.

### FR-5: Aspecto de los espacios

**Must:**
- Mostrar junto al nombre de cada espacio una insignia según su estado: "✓" limpio, "!" desordenado, "!!" desastre, en modo exploración y en modo edición.
- Mostrar en el suelo de un espacio desordenado 4 objetos y en uno en desastre 12, sobre casillas del espacio que no son pared, puerta ni mueble, y menos si no hay tantas casillas libres.
- Colocar los objetos siempre en las mismas casillas para el mismo espacio, el mismo estado y la misma distribución, sin azar.
- Dibujar los objetos por debajo de los personajes y sin que bloqueen el paso ni capturen la entrada.
- Usar arte de marcador original, sin recursos de terceros con copyright.

**Must not:**
- Cambiar la distribución, las colisiones ni las casillas transitables del mapa por los objetos.
- Mostrar objetos ni estado en los pasillos.

### FR-6: Burbujas

**Must:**
- Mostrar, en modo exploración y en modo edición, una sola burbuja por lugar con actividades por hacer: un espacio para sus actividades con espacio y un miembro para las actividades suyas sin espacio.
- Mostrar en la burbuja el icono de la actividad por hacer más atrasada del lugar (a igual atraso, la creada primero) y, si el lugar tiene más de una, un segundo icono "+".
- Dibujar la burbuja de un espacio en una casilla de su área que no es una puerta, siempre la misma para el mismo hogar y las mismas actividades; dibujar la de un miembro sobre él, siguiéndolo al moverse.
- Quitar la burbuja cuando el lugar ya no tiene actividades por hacer.
- Hacer que la burbuja no bloquee el paso de ningún personaje ni capture la entrada de la cruceta.

**Must not:**
- Mostrar más de una burbuja por lugar.
- Mostrar burbujas por actividades futuras, hechas o eliminadas.
- Mostrar sobre un miembro la burbuja de una actividad que tiene espacio.

### FR-7: Hoja de un lugar

**Must:**
- Abrir, al tocar una burbuja, una hoja con el nombre del lugar y las actividades por hacer de ese lugar, cada una con su icono, nombre, miembro asignado y plazo ("Vence hoy" o "Atrasada N días").
- En modo exploración, ofrecer en la hoja solo el botón "Hecho" por actividad.
- En modo edición, ofrecer en la hoja las opciones "Editar" y "Eliminar" por actividad.
- Cerrar la hoja al marcar como hecha o eliminar la última actividad del lugar, o cuando el usuario la cierra.
- Mostrar los nombres escritos por el usuario siempre como texto.

**Must not:**
- Ofrecer en exploración crear, editar o eliminar.
- Ofrecer "Hecho" en modo edición.

### FR-8: Gestión en modo edición

**Must:**
- Mostrar en el panel del modo edición una sección "Actividades" con el contador "n de 50", el botón "+ Actividad" y la lista de todas las actividades pendientes (por hacer y futuras) ordenadas por vencimiento, con su icono, nombre, miembro, espacio o "Sin espacio" y plazo.
- Abrir una ficha de alta al tocar "+ Actividad" y una ficha de edición al tocar una actividad de la lista o su opción "Editar" en la hoja.
- Permitir cambiar en la edición el nombre, el icono, el miembro, el espacio, el tipo, la fecha y la frecuencia.
- Mostrar el cambio en el mapa en menos de 100 ms tras guardar.
- Pedir confirmación antes de eliminar una actividad, con un mensaje que la nombre.
- Marcar como eliminado el registro de una actividad eliminada, con su fecha de eliminación, en lugar de destruirlo.
- Abrir, al tocar una casilla en modo edición, con esta prioridad: la ficha del personaje del propietario; luego la del habitante; luego la hoja de la burbuja que se muestra en esa casilla; luego la ficha del espacio.
- Desactivar "+ Actividad" al llegar a 50 actividades activas.

**Must not:**
- Permitir crear, editar o eliminar actividades fuera del modo edición.
- Crear, eliminar o mover un espacio, un habitante u otra actividad como efecto de crear, editar o eliminar una actividad.

### FR-9: Bajas en cascada y confirmación

**Must:**
- Eliminar de forma lógica, junto con un espacio, todas sus actividades (pendientes, futuras y hechas), en la misma operación.
- Eliminar de forma lógica, junto con un miembro, todas sus actividades.
- Si al eliminar un cuarto se elimina también su baño interno (FR-4 de la feature 001), eliminar también las actividades del baño; si el baño interno se mueve a otro cuarto, conservar sus actividades.
- Pedir confirmación al eliminar un espacio, o al quitarlo con "−" en su contador, cuando él o su baño interno que se elimina con él tiene actividades pendientes, con un mensaje que indique cuántas actividades se eliminarán en total; mantener la regla de la feature 001 de pedir confirmación si tiene nombre personalizado o si se elimina su baño interno.
- Indicar en la confirmación de eliminar a un habitante cuántas actividades pendientes se eliminarán con él, cuando tiene alguna.

**Must not:**
- Dejar una actividad activa que apunte a un espacio o a un miembro eliminado.
- Eliminar actividades de otros espacios o miembros.
- Eliminar al personaje del propietario ni sus actividades.

### FR-10: El paso de los días

**Must:**
- Calcular las burbujas, los estados y los objetos del suelo con la fecha de hoy del dispositivo, al abrir la app y en cada cambio.
- Actualizar las burbujas y los estados cuando cambia el día con la app abierta y cuando la app vuelve a primer plano.

**Must not:**
- Requerir que el usuario recargue la app o realice alguna acción para ver el estado de hoy.
- Guardar fechas derivadas ni estados calculados.

### FR-11: Persistencia y compatibilidad

**Must:**
- Guardar en el dispositivo las actividades y sus datos junto con el resto del hogar, cada vez que se crean, editan, marcan como hechas o eliminan.
- Restaurar las actividades al reabrir la app.
- Abrir sin pérdida y sin aviso de error un hogar guardado con la feature 001 o con la 002, sin actividades, y guardarlo a partir de entonces en el formato nuevo.
- Considerar ilegibles los datos guardados que tengan una actividad activa inválida (sin tipo o sin icono válido, con una fecha que no existe, repetitiva sin una frecuencia de la lista o puntual con frecuencia, repetitiva marcada como hecha, o que apunte a un miembro o a un espacio inexistente o eliminado), y en ese caso mostrar un aviso y crear el hogar inicial de la feature 001.
- Ignorar, al validar, las actividades eliminadas.

**Must not:**
- Perder o modificar los espacios, los habitantes, los nombres o el personaje del propietario de un hogar de las features 001 o 002 al abrirlo.
- Enviar datos fuera del dispositivo.

### FR-12: Identidad y preparación multiusuario

**Must:**
- Dar a cada actividad un identificador estable y globalmente único, que no cambie al editarla ni al marcarla como hecha.
- Registrar en cada actividad la fecha de creación, la fecha de última modificación y la cuenta autora.
- Referenciar al miembro y al espacio de una actividad por identificador, nunca por nombre ni posición, y no vincular una actividad a una cuenta.
- Marcar como eliminadas las actividades borradas, con su fecha de eliminación, y excluirlas de toda vista y validación.

**Must not:**
- Perder el vínculo de una actividad con su miembro o su espacio al renombrarlos, renumerarlos o mover un baño interno.

## Non-Functional Requirements

### Performance

- El movimiento de los personajes se mantiene a 60 cuadros por segundo en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares, 4 mascotas y 50 actividades vencidas repartidas por todos los espacios del hogar de mayor tamaño permitido, es decir, con el máximo de objetos, burbujas e insignias dibujados a la vez.
- Tras crear, editar, eliminar o marcar como hecha una actividad, el mapa actualizado se muestra en menos de 100 ms en el dispositivo de referencia.

### Security

- No hay autenticación en esta feature; la cuenta del propietario es local.
- Ningún dato sale del dispositivo.
- Los textos escritos por el usuario (nombres de actividades, de espacios y de miembros) se muestran siempre como texto, nunca interpretados como marcado.

### Reliability

- Para cualquier combinación permitida de espacios, habitantes y actividades, y para cualquier eliminación de un espacio o de un miembro, nunca queda una actividad activa que apunte a un espacio o a un miembro eliminado. Se verifica de forma automática, incluyendo los dos casos de un cuarto con baño interno (el baño se mueve y el baño se elimina).
- El estado de los espacios, las burbujas y los atrasos se verifican de forma automática con fechas fijas, incluidos los límites de los umbrales (0, 1, 2 y 3 días de atraso), el cambio de día y las repetitivas marcadas como hechas.
- Un hogar guardado con la feature 001 o con la 002 se abre sin pérdida de datos. Se verifica de forma automática con documentos guardados de esas features, incluidos documentos corruptos.
- Un cierre inesperado de la app pierde como máximo el último cambio no aplicado; los cambios se guardan en el momento en que se aplican.
- Un teléfono con la fecha mal configurada muestra atrasos calculados con esa fecha; esta feature no lo detecta ni lo corrige.

### Usability

- Los iconos de las burbujas y los textos de la hoja tienen un tamaño legible en un teléfono en vertical y no cambian de tamaño al acercar o alejar la cámara, con el mismo criterio de legibilidad que las etiquetas de la feature 001.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| El usuario guarda una actividad con el nombre vacío | El botón de guardar permanece desactivado, o se rechaza con un mensaje si el nombre queda vacío al editar; no se crea ni modifica nada |
| El usuario intenta superar 30 caracteres en un nombre | No se guarda un nombre de más de 30 caracteres |
| El usuario intenta crear una actividad con el límite alcanzado | El botón "+ Actividad" está desactivado; no se crea nada |
| El usuario no elige miembro, o no elige frecuencia en una repetitiva | El botón de guardar permanece desactivado; no se crea nada |
| El usuario cancela la eliminación de una actividad, de un espacio con actividades o de un habitante con actividades | No cambia nada |
| Un lugar tiene más actividades por hacer de las que caben en la hoja | La hoja permite recorrerlas todas; ninguna queda inaccesible |
| El usuario marca como hecha una actividad por error | No hay deshacer; para recuperarla, el usuario crea la actividad de nuevo |
| Pasa la medianoche con la app abierta | Las burbujas y los estados se actualizan sin recargar |
| El teléfono tiene la fecha mal configurada | Los atrasos se calculan con esa fecha |
| Falla el guardado en el dispositivo | Se muestra un aviso no bloqueante y la sesión continúa con los datos en memoria; se reintenta en el siguiente guardado |
| Los datos guardados no se pueden leer o tienen una actividad activa inválida al abrir la app | Se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la feature 001 |

## Open Questions

- Ninguna bloqueante. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-06; las dos decisiones de arquitectura están registradas en los ADR enlazados.
- Riesgos de legibilidad y de rendimiento, a medir en un teléfono con la verificación de la Fase de integración del plan y a ajustar con evidencia: con 12 habitantes en movimiento más etiquetas, burbujas, insignias y hasta 12 objetos por espacio, el mapa puede saturarse; y los umbrales del estado (0, 1 a 2 y 3 o más días) y la cantidad de objetos (4 y 12) son valores de partida.

## Out of Scope (Future Considerations)

- Rutinas, horarios y el estado "fuera de casa" (pieza 3).
- Negociación de intercambios y calificaciones (pieza 5).
- Cuentas reales, inicio de sesión, sincronización y permisos para los familiares.
- Historial, estadísticas, puntos o logros de actividades hechas, y deshacer un "Hecho".
- Notificaciones, recordatorios y plazos con hora.
- Exigir que el personaje camine al espacio para completar una actividad.
- Actividades en pasillos o con varios miembros asignados; frecuencias libres o días de la semana.
- Arte definitivo, animaciones, sonido y música.
- Más de un propietario o más de un hogar por cuenta.
