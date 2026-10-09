# Feature 007: Menú por secciones y formularios simples

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-09
**Branch:** `feat/007-menu-y-formularios-simples`
**Source:** [prd.md](prd.md) · [ADR aspecto de los miembros, mascotas sin actividades y formato v7](../../adr/007-aspecto-miembros-formato-v7.md) · se apoya en la [spec 001](../001-mapa-editor-hogar/spec.md) (v1.1.0), la [spec 002](../002-familiares-y-mascotas/spec.md) (v1.0.0), la [spec 003](../003-actividades/spec.md) (v1.0.0), la [spec 004](../004-rutinas/spec.md) (v1.0.0), la [spec 005](../005-jugador-activo-e-intercambios/spec.md) (v1.0.0) y la [spec 006](../006-calificaciones-e-historial/spec.md) (v1.0.0)

---

## Problem Statement

El PoC de Livin ya tiene todas las piezas del plan original, pero al usarlo en un teléfono Android y en un navegador de escritorio aparecen tres problemas de uso y un error. Hay cuatro botones sueltos a la derecha y "Editar" abre un panel único que mezcla espacios, habitantes y actividades, demasiado denso para cambiar una sola cosa. Los formularios piden demasiado: un familiar exige nombre, parentesco y género (el parentesco no se usa en ninguna parte) y una actividad exige siete campos. Las mascotas pueden recibir actividades aunque no pueden ejecutarlas. Y en escritorio los campos de nombre no aceptan la tecla Espacio, porque el motor gráfico la captura en toda la ventana. Esta feature reorganiza la navegación en una barra inferior con cuatro secciones, cada una con su drawer; simplifica los formularios de actividad, familiar y mascota; impide que una mascota sea responsable de una actividad; y corrige el error de la tecla Espacio.

## Goals

- Una **barra inferior fija** con cuatro pestañas (Espacios, Familia, Actividades, Intercambios); cada una abre un drawer con solo su contenido y activa el modo edición.
- Un indicador **"Juega: <nombre>"** siempre visible, que además es el botón para cambiar de personaje; desaparecen los botones sueltos "Editar", "Intercambios" e "Historial".
- El **Historial** pasa a ser la pestaña "Hechas" dentro de Actividades, junto a "Pendientes".
- Un **formulario de actividad** con icono y nombre en una fila, sugerencias de selección rápida, selector de la persona responsable con círculos de color e inicial, y una línea-resumen "Hoy · Una vez · Sin lugar" que se despliega con "Cambiar".
- **Lugares de selección múltiple**: cada lugar marcado crea una actividad independiente con los mismos datos.
- **Formularios de familiar y de mascota** de una fila: icono y nombre. El familiar elige un aspecto entre siete y la mascota una especie entre seis; ambos vienen preseleccionados, así que basta el nombre.
- Que una **mascota no pueda ser responsable** de una actividad.
- Que la **tecla Espacio funcione** en todos los campos de texto en el navegador de escritorio.
- Que los hogares guardados con las features 001 a 006 **se abran sin error** y queden en el formato nuevo (versión 7).

## Non-Goals

- No hay arte nuevo: los personajes, las mascotas y las burbujas siguen siendo rectángulos de color.
- No se editan ni se mueven como grupo las actividades creadas en varios lugares: cada una es un registro suelto.
- No hay sugerencias personalizables por el usuario ni iconos de actividad nuevos: la lista de sugerencias es cerrada y los iconos son los 9 de hoy.
- El propietario no tiene aspecto ni selector de icono; su ficha sigue siendo la de la 001.
- No se conserva el parentesco ni se puede agregar desde la interfaz.
- El botón "Hecho" no aparece dentro del drawer de Pendientes: sigue en las burbujas del mapa, en exploración.
- No cambian las reglas de intercambios, rutinas, calificaciones ni el tope de 200 entradas del historial.
- No hay cuentas, contraseñas ni sincronización entre teléfonos: sigue siendo un solo teléfono compartido.

## Users and Context

**Primary users:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, igual que en las features 001 a 006.
**Secondary users:** las personas que en features futuras tendrán su propio dispositivo y su cuenta. Esta feature no implementa nada de eso.
**Usage context:** sesiones cortas en el celular en orientación vertical, y también en un navegador de escritorio para probar. Alguien quiere cambiar una sola cosa (agregar una actividad, agregar a un familiar, mirar un intercambio) y espera llegar a ella con uno o dos toques y rellenar casi nada.
**User mental model:** el mismo de las features 001 a 006. Vocabulario nuevo: "barra" (las cuatro pestañas fijas abajo); "drawer" (el panel que sube desde la barra con el contenido de una sección); "aspecto" (el dibujo de un familiar: adulto, adulta, niño, niña, anciano, anciana o neutro); "sugerencia" (una actividad predefinida con nombre e icono que se elige de un toque); "lugares" (los espacios donde se hace una actividad, que pueden ser varios al crearla).

**Relación con las specs anteriores.** Esta feature reemplaza:

- **Spec 001, FR-7 (modo edición):** el panel único con un contador por tipo de espacio pasa a ser el drawer "Espacios"; el modo edición se activa desde cualquiera de las cuatro pestañas y el botón "Editar" desaparece. Siguen vigentes sus reglas de alejar la vista, inmovilizar al personaje y volver con "Listo".
- **Spec 002, FR-2 y FR-4:** un familiar ya no tiene parentesco ni género sino un **aspecto** (siete valores), y una mascota tiene una de **seis especies**; ninguno exige elegir un valor porque vienen preseleccionados; la sección "Habitantes" del panel pasa a ser el drawer "Familia". Siguen vigentes los límites (8 familiares, 4 mascotas), las reglas de nombres (FR-3) y la confirmación al eliminar.
- **Spec 003, FR-1 y FR-8:** una actividad solo puede asignarse a una **persona** (propietario o familiar); la sección "Actividades" del panel pasa a ser la pestaña "Pendientes" del drawer "Actividades"; la ficha de actividad se rehace. Siguen vigentes los datos que se guardan de una actividad (nombre, icono, responsable, espacio, tipo, vencimiento y frecuencia), el tope de 50 y la hoja de un lugar.
- **Spec 005, FR-1 y FR-11:** el botón "Juega" pasa a ser un indicador visible también en edición, y el panel de intercambios pasa a ser el drawer "Intercambios". Siguen vigentes todas las reglas de proponer, aceptar, rechazar, retirar, quitar y vigencia.
- **Spec 006, FR-3:** el botón "Historial" desaparece y su panel pasa a ser la pestaña "Hechas" del drawer "Actividades", ahora disponible en el modo edición. Siguen vigentes las reglas de entradas, calificaciones, promedio y tope.

El resto de las specs 001 a 006 sigue vigente sin cambios.

## User Stories

### Story 1: Una barra inferior con las cuatro secciones

**As a** persona que comparte el hogar
**I want** llegar a cada sección con un toque desde una barra siempre visible
**So that** pueda cambiar una sola cosa sin recorrer un panel enorme

**Acceptance criteria:**

- [ ] **AC-1.1** Dado el modo exploración, Cuando se muestra el mapa, Entonces se ve una barra fija en el borde inferior con exactamente cuatro pestañas, en este orden: "Espacios", "Familia", "Actividades" e "Intercambios", cada una con su icono y un tamaño táctil legible, y no hay botones sueltos "Editar", "Intercambios" ni "Historial".
- [ ] **AC-1.2** Dado el modo exploración, Cuando se muestra el mapa, Entonces la cruceta queda por encima de la barra sin quedar tapada por ella y la barra no tapa el cartel de la entrada.
- [ ] **AC-1.3** Dada la barra, Cuando el usuario toca una pestaña, Entonces se abre el drawer de esa sección con su título y un botón "Listo", la pestaña queda marcada como activa, la app pasa al modo edición (la vista se aleja hasta mostrar el hogar completo y el personaje queda inmóvil) y el drawer muestra solo el contenido de esa sección.
- [ ] **AC-1.4** Dado un drawer abierto, Cuando el usuario toca otra pestaña, Entonces el drawer cambia al de esa sección, la app sigue en modo edición, y no se mueve ningún personaje ni la cámara.
- [ ] **AC-1.5** Dado un drawer abierto, Cuando el usuario toca "Listo" o la pestaña activa, Entonces el drawer se cierra, la app vuelve al modo exploración con la cámara siguiendo a quien juega, el personaje reaparece donde corresponde como en la 001 (AC-7.3, AC-7.4) y las etiquetas de nombre muestran los nombres vigentes.
- [ ] **AC-1.6** Dado un drawer abierto, Cuando se muestra, Entonces ocupa como máximo la mitad inferior de la pantalla por encima de la barra, el contenido que no cabe se recorre dentro del drawer, y el hogar completo se ve en la parte de la pantalla que el drawer y la barra no cubren.
- [ ] **AC-1.7** Dado un drawer abierto, Cuando se muestra, Entonces la barra sigue visible debajo de él, con la pestaña activa marcada.
- [ ] **AC-1.8** Dada una persona que juega con n propuestas recibidas vigentes (n de 1 en adelante), Cuando se muestra la barra, Entonces la pestaña dice "Intercambios (n)"; si no tiene ninguna, dice "Intercambios".
- [ ] **AC-1.9** Dada la app recién abierta, Cuando se muestra, Entonces está en modo exploración y sin ningún drawer abierto.
- [ ] **AC-1.10** Dada cualquier pestaña, Cuando el usuario la toca, Entonces el drawer se muestra en menos de 100 ms.
- [ ] **AC-1.11** Dado un drawer abierto con una ficha o una hoja de un lugar abiertas, Cuando el usuario cambia de pestaña o toca "Listo", Entonces la ficha y la hoja se cierran sin guardar nada.

### Story 2: El mapa responde según la sección

**As a** persona que edita el hogar
**I want** que tocar el mapa abra lo que corresponde a la sección en que estoy
**So that** no me salte una ficha ajena a lo que hago

**Acceptance criteria:**

- [ ] **AC-2.1** Dado el drawer "Espacios", Cuando el usuario toca una casilla de un espacio (esté o no ocupada por un personaje), Entonces se abre la ficha de ese espacio con Renombrar y Eliminar como en la 001; tocar un personaje, una burbuja o el cartel no abre ninguna otra ficha ni hoja.
- [ ] **AC-2.2** Dado el drawer "Familia", Cuando el usuario toca la casilla del propietario, de un familiar o de una mascota, Entonces se abre la ficha de esa persona o mascota con esta prioridad: el propietario, luego el habitante; tocar un espacio o una burbuja no abre nada.
- [ ] **AC-2.3** Dado el drawer "Familia" y familiares fuera de casa, Cuando el usuario toca el cartel "n fuera", Entonces se abre la hoja "Fuera de casa" y tocar la fila de un familiar abre su ficha, como en la 004 (AC-5.12).
- [ ] **AC-2.4** Dado el drawer "Actividades", Cuando el usuario toca una burbuja, Entonces se abre la hoja de ese lugar con las opciones Editar y Eliminar de cada actividad, como en la 003 (AC-6.7); tocar un personaje, un espacio o el cartel no abre nada.
- [ ] **AC-2.5** Dado el drawer "Intercambios", Cuando el usuario toca el mapa, Entonces no se abre ninguna ficha ni hoja.
- [ ] **AC-2.6** Dada cualquier sección, Cuando el usuario toca una casilla que no corresponde a nada de esa sección (un pasillo, el exterior, una casilla vacía), Entonces no pasa nada.
- [ ] **AC-2.7** Dado el modo exploración, Cuando el usuario toca el cartel o una burbuja, Entonces responde como en las features 003 y 004 (hoja del lugar con "Hecho", hoja "Fuera de casa").

### Story 3: El drawer Espacios

**As a** persona que cuida la distribución del hogar
**I want** una sección solo con los espacios
**So that** ajuste los cuartos sin ver nada más

**Acceptance criteria:**

- [ ] **AC-3.1** Dado el drawer "Espacios", Cuando se muestra, Entonces tiene un contador por cada tipo de espacio con sus botones − y + (que se desactivan en los límites), y la nota "Siguiente: <nombre>" del baño como en la 001 y la 003; no muestra familiares, mascotas ni actividades.
- [ ] **AC-3.2** Dado el drawer "Espacios", Cuando el usuario toca + o −, Entonces el espacio se agrega o se quita, con la confirmación de la 001 donde corresponde, y el mapa se regenera en menos de 100 ms.
- [ ] **AC-3.3** Dado un espacio eliminado desde el drawer, Cuando se eliminan actividades o bloques en cascada, Entonces la confirmación los cuenta como en la 003 (FR-9) y en la 004, sin cambios.

### Story 4: El drawer Familia

**As a** persona que gestiona a su familia
**I want** ver a mis familiares y mascotas en listas y agregar a más
**So that** administre a todos desde un solo lugar

**Acceptance criteria:**

- [ ] **AC-4.1** Dado el drawer "Familia", Cuando se muestra, Entonces tiene dos secciones, "Familiares" y "Mascotas", cada una con su contador "n de 8" y "n de 4", su botón "+" (desactivado al llegar al límite) y la lista de sus habitantes activos en el orden en que se crearon, cada fila con el icono de su aspecto o de su especie y su nombre.
- [ ] **AC-4.2** Dada una fila de un habitante, Cuando el usuario la toca, Entonces se abre la ficha de edición de ese habitante.
- [ ] **AC-4.3** Dado el botón "+" de una sección, Cuando el usuario lo toca, Entonces se abre la ficha de alta de familiar o de mascota (Story 5, Story 6).
- [ ] **AC-4.4** Dada una sección sin habitantes, Cuando se muestra, Entonces la lista dice "Aún no hay familiares" o "Aún no hay mascotas" y el botón "+" está activo.
- [ ] **AC-4.5** Dado el propietario, Cuando se muestra el drawer, Entonces no aparece en las listas ni cuenta en los contadores; su ficha se abre desde el mapa (AC-2.2).
- [ ] **AC-4.6** Dados nombres con aspecto de marcado, Cuando se muestran en las filas, Entonces se muestran como texto.
- [ ] **AC-4.7** Dado el drawer "Familia", Cuando se muestra, Entonces no muestra espacios, actividades ni intercambios.

### Story 5: Agregar y editar un familiar con un aspecto

**As a** persona que registra a un familiar
**I want** escribir su nombre y elegir un icono de persona
**So that** agregarlo tome unos segundos

**Acceptance criteria:**

- [ ] **AC-5.1** Dado el botón "+" de Familiares, Cuando el usuario lo toca, Entonces se abre la ficha "Nuevo familiar" con una fila que tiene a la izquierda un botón con el icono 🧑 y a la derecha el campo de nombre vacío con el marcador "Nombre del familiar", sin selectores de parentesco ni de género, con "Cancelar" y "Guardar" (desactivado mientras el nombre esté vacío).
- [ ] **AC-5.2** Dada la ficha, Cuando el usuario toca el botón del icono, Entonces se abre un selector con siete opciones, cada una con su icono y su etiqueta (👨 Adulto, 👩 Adulta, 👦 Niño, 👧 Niña, 👴 Anciano, 👵 Anciana, 🧑 Neutro) y la actual marcada; al elegir una, el selector se cierra y el botón muestra su icono.
- [ ] **AC-5.3** Dado un nombre válido y ningún aspecto elegido, Cuando el usuario toca "Guardar", Entonces se crea un familiar con aspecto "neutro".
- [ ] **AC-5.4** Dado cada uno de los siete aspectos, Cuando se elige y se guarda, Entonces el familiar queda con ese aspecto, su fila en el drawer muestra su icono y su personaje se dibuja según él (AC-5.9).
- [ ] **AC-5.5** Dados los nombres, Cuando se guarda un familiar, Entonces rigen las reglas de la 002 (FR-3): sin espacios al inicio ni al final, de 1 a 20 caracteres, único sin distinguir mayúsculas entre los miembros activos; si no se cumplen, se muestra el mensaje que explica el motivo y no se crea nada.
- [ ] **AC-5.6** Dado un familiar existente, Cuando se abre su ficha, Entonces muestra su aspecto en el botón y su nombre en el campo, con los botones "Rutina", "Eliminar", "Cancelar" y "Guardar"; cambiar el aspecto o el nombre y guardar actualiza solo a ese familiar.
- [ ] **AC-5.7** Dado un familiar, Cuando se pide eliminarlo, Entonces se pide confirmación con un mensaje que lo nombra y, si tiene actividades o bloques de rutina, los cuenta, como en la 002, la 003 y la 004; al confirmar se da de baja como hasta ahora.
- [ ] **AC-5.8** Dados 8 familiares activos, Cuando se muestra el drawer, Entonces el botón "+" de Familiares está desactivado.
- [ ] **AC-5.9** Dado el catálogo de aspectos, Cuando se dibujan los personajes, Entonces los aspectos masculinos (adulto, niño, anciano) comparten un color, los femeninos (adulta, niña, anciana) otro y el neutro un tercero, distintos entre sí; y un niño o una niña se dibuja con un tamaño menor que un adulto, mientras que un anciano o una anciana se dibuja con el tamaño de un adulto.
- [ ] **AC-5.10** Dado el personaje del propietario, Cuando se abre su ficha, Entonces tiene solo el campo de nombre con Renombrar, sin botón de icono, como en la 001.
- [ ] **AC-5.11** Dado un aspecto fuera de la lista (por ejemplo, por datos desactualizados), Cuando se intenta guardar, Entonces se muestra el mensaje "Elige un aspecto de la lista." y no se crea ni se cambia nada.

### Story 6: Agregar y editar una mascota con una especie

**As a** persona que registra a una mascota
**I want** escribir su nombre y elegir qué animal es
**So that** agregarla tome unos segundos

**Acceptance criteria:**

- [ ] **AC-6.1** Dado el botón "+" de Mascotas, Cuando el usuario lo toca, Entonces se abre la ficha "Nueva mascota" con una fila que tiene a la izquierda un botón con el icono 🐾 y a la derecha el campo de nombre vacío con el marcador "Nombre de la mascota", sin otros campos, con "Cancelar" y "Guardar" (desactivado mientras el nombre esté vacío).
- [ ] **AC-6.2** Dada la ficha, Cuando el usuario toca el botón del icono, Entonces se abre un selector con seis opciones, cada una con su icono y su etiqueta (🐶 Perro, 🐱 Gato, 🐰 Conejo, 🐹 Hámster, 🦜 Loro, 🐾 Otro) y la actual marcada; al elegir una, el selector se cierra y el botón muestra su icono.
- [ ] **AC-6.3** Dado un nombre válido y ninguna especie elegida, Cuando el usuario toca "Guardar", Entonces se crea una mascota de especie "otro".
- [ ] **AC-6.4** Dada cada una de las seis especies, Cuando se elige y se guarda, Entonces la mascota queda con esa especie, su fila muestra su icono y su dibujo en el mapa tiene un color propio, distinto de los de las otras cinco especies.
- [ ] **AC-6.5** Dada una mascota existente, Cuando se abre su ficha, Entonces muestra su especie en el botón y su nombre en el campo, con "Eliminar", "Cancelar" y "Guardar"; cambiar la especie o el nombre y guardar actualiza solo a esa mascota; no tiene botón "Rutina".
- [ ] **AC-6.6** Dada una mascota, Cuando se pide eliminarla, Entonces se pide confirmación con un mensaje que la nombra y, al confirmar, se da de baja como hasta ahora.
- [ ] **AC-6.7** Dadas 4 mascotas activas, Cuando se muestra el drawer, Entonces el botón "+" de Mascotas está desactivado.
- [ ] **AC-6.8** Dados los nombres, Cuando se guarda una mascota, Entonces rigen las mismas reglas de nombres que en AC-5.5.
- [ ] **AC-6.9** Dada una especie fuera de la lista (por ejemplo, por datos desactualizados), Cuando se intenta guardar, Entonces se muestra el mensaje "Elige una especie de la lista." y no se crea ni se cambia nada.

### Story 7: El drawer Actividades con Pendientes y Hechas

**As a** persona que gestiona las tareas
**I want** ver lo pendiente y lo hecho en la misma sección
**So that** encuentre las dos cosas en un solo lugar

**Acceptance criteria:**

- [ ] **AC-7.1** Dado el drawer "Actividades", Cuando se abre, Entonces muestra dos pestañas, "Pendientes" y "Hechas", con "Pendientes" elegida.
- [ ] **AC-7.2** Dada la pestaña "Pendientes", Cuando se muestra, Entonces tiene el contador "n de 50", el botón "+ Actividad" (desactivado al llegar a 50) y la lista de todas las actividades pendientes ordenadas por vencimiento, cada fila con su icono, su nombre, su responsable, su espacio o "Sin espacio" y su plazo, como en la 003 (FR-8).
- [ ] **AC-7.3** Dada una fila de "Pendientes", Cuando el usuario la toca, Entonces se abre la ficha de edición de esa actividad.
- [ ] **AC-7.4** Dada la pestaña "Hechas", Cuando se muestra, Entonces tiene lo que tenía el panel "Historial" de la 006: el filtro de persona con "Todos" elegido, el resumen del promedio, la lista de entradas de la más reciente a la más antigua con sus estrellas y los controles para calificar, cambiar y quitar, con las mismas reglas y los mismos textos (006, Stories 2 a 5).
- [ ] **AC-7.5** Dado el filtro de "Hechas", Cuando se abre, Entonces ofrece "Todos", el propietario, los familiares activos y solo las mascotas activas que tengan alguna entrada en el historial, y vuelve a "Todos" cada vez que se muestra la pestaña.
- [ ] **AC-7.6** Dada una calificación en "Hechas", Cuando se da, se cambia o se quita, Entonces la persona que califica es quien juega, y el panel muestra el cambio en menos de 100 ms.
- [ ] **AC-7.7** Dada cualquier pestaña del drawer, Cuando se muestra, Entonces no hay botón "Hecho" ni ningún botón "Historial".
- [ ] **AC-7.8** Dado el cambio entre "Pendientes" y "Hechas", Cuando se hace, Entonces no cambia ningún dato.
- [ ] **AC-7.9** Dada una entrada del historial acreditada a una mascota (solo puede venir de datos anteriores), Cuando se muestra en "Hechas", Entonces se ve y cualquier persona puede calificarla, como en la 006 (AC-4.4).

### Story 8: Un formulario de actividad de dos campos

**As a** persona que agrega una actividad
**I want** escribir o elegir el nombre y que el icono se complete solo
**So that** agregar una actividad tome unos segundos

**Acceptance criteria:**

- [ ] **AC-8.1** Dado el botón "+ Actividad", Cuando el usuario lo toca, Entonces se abre la ficha "Nueva actividad" con una fila que tiene a la izquierda un botón con el icono 📌 y a la derecha el campo de nombre vacío (marcador "Nombre de la actividad", máximo 30 caracteres); debajo, los chips de sugerencia; luego el selector de responsable; luego la línea-resumen con "Cambiar"; y "Cancelar" y "Guardar". No se ve ningún otro campo.
- [ ] **AC-8.2** Dado el campo de nombre vacío, Cuando se muestran las sugerencias, Entonces se ven los chips de las primeras 6 del catálogo en su orden (Lavar platos, Barrer, Trapear, Limpiar el baño, Lavar ropa, Sacar la basura), cada uno con su icono.
- [ ] **AC-8.3** Dado texto escrito en el campo, Cuando se muestran las sugerencias, Entonces se ven solo los chips cuyo nombre contiene el texto, sin distinguir mayúsculas ni acentos ni espacios al inicio o al final; si ninguno lo contiene, no se ve ningún chip.
- [ ] **AC-8.4** Dado el catálogo de sugerencias, Cuando se inspecciona, Entonces tiene exactamente estas diez, cada una con su icono: Lavar platos (Platos), Barrer (Barrer), Trapear (Limpiar), Limpiar el baño (Limpiar), Lavar ropa (Ropa), Sacar la basura (Basura), Hacer compras (Compras), Regar las plantas (Plantas), Dar de comer a la mascota (Mascota) y Pasear al perro (Mascota); y el nombre de cada una tiene como máximo 30 caracteres.
- [ ] **AC-8.5** Dada una sugerencia, Cuando el usuario toca su chip, Entonces el campo de nombre pasa a decir el nombre de la sugerencia, el botón del icono pasa a mostrar el icono de la sugerencia y el botón del icono deja de abrir el selector de iconos.
- [ ] **AC-8.6** Dado un texto que, sin distinguir mayúsculas, acentos ni espacios al inicio o al final, es igual al nombre de una sugerencia (por ejemplo, "barrer " o "LIMPIAR EL BAÑO"), Cuando el usuario lo escribe, Entonces se aplica el icono de esa sugerencia y el botón del icono deja de abrir el selector, igual que en AC-8.5.
- [ ] **AC-8.7** Dado un texto que no es igual a ninguna sugerencia, Cuando el usuario toca el botón del icono, Entonces se abre un selector con los nueve iconos de la 003 (Platos, Barrer, Ropa, Basura, Limpiar, Compras, Plantas, Mascota, Otra), cada uno con su icono y su etiqueta y el actual marcado; al elegir uno, el selector se cierra y el botón muestra ese icono.
- [ ] **AC-8.8** Dado el campo de nombre vacío o con un texto que no coincide con ninguna sugerencia y ningún icono elegido a mano, Cuando se muestra la ficha, Entonces el botón del icono muestra el icono genérico 📌 ("Otra").
- [ ] **AC-8.9** Dado un icono elegido a mano, Cuando el usuario sigue escribiendo un texto que no coincide con ninguna sugerencia, Entonces el icono elegido se mantiene.
- [ ] **AC-8.10** Dado un icono elegido a mano, Cuando el texto pasa a coincidir con una sugerencia, Entonces se aplica el icono de la sugerencia y se descarta el elegido a mano; si el texto vuelve a no coincidir, el botón vuelve a mostrar 📌.
- [ ] **AC-8.11** Dada una sugerencia aplicada, Cuando el usuario cambia el texto de modo que ya no coincide, Entonces el botón vuelve a mostrar 📌 (si no hay icono elegido a mano) y vuelve a abrir el selector.
- [ ] **AC-8.12** Dada la ficha de una actividad nueva, Cuando el nombre está vacío o no hay una persona elegida, Entonces "Guardar" está desactivado.
- [ ] **AC-8.13** Dado el icono que muestra el botón al guardar, Cuando se crea la actividad, Entonces la actividad queda con ese icono.
- [ ] **AC-8.14** Dado el nombre, Cuando se guarda, Entonces rigen las reglas de la 003 (FR-1): sin espacios al inicio ni al final, de 1 a 30 caracteres, y puede repetirse entre actividades.
- [ ] **AC-8.15** Dada una actividad existente, Cuando se abre su ficha de edición, Entonces muestra su nombre, su icono guardado, su responsable, su fecha, su recurrencia y su lugar; el icono guardado se respeta hasta que el nombre pase a coincidir con una sugerencia, y el botón abre el selector de iconos mientras el nombre no coincida con una.
- [ ] **AC-8.16** Dados los textos de sugerencias y de nombres con aspecto de marcado, Cuando se muestran en los chips, la ficha o las listas, Entonces se muestran como texto.

### Story 9: Quién la hace y los datos por omisión

**As a** persona que agrega una actividad
**I want** que quien juega, hoy y "una vez" vengan elegidos
**So that** solo cambie lo que sea distinto

**Acceptance criteria:**

- [ ] **AC-9.1** Dado el selector de responsable, Cuando se muestra, Entonces tiene un círculo por cada persona (el propietario primero y después los familiares en el orden en que se crearon, sin ninguna mascota), con el color de esa persona y su inicial, el nombre de la persona como etiqueta del botón y el elegido marcado.
- [ ] **AC-9.2** Dada la ficha de una actividad nueva, Cuando se abre, Entonces la persona que juega viene elegida como responsable.
- [ ] **AC-9.3** Dado el selector, Cuando el usuario toca el círculo de otra persona, Entonces queda elegida solo esa.
- [ ] **AC-9.4** Dada la ficha de una actividad nueva, Cuando se abre, Entonces la línea-resumen dice "📅 Hoy · Una vez · Sin lugar" y tiene un botón "Cambiar".
- [ ] **AC-9.5** Dada la línea-resumen, Cuando el usuario toca "Cambiar", Entonces se despliegan tres controles —la fecha, la recurrencia y los lugares— y el botón pasa a decir "Ocultar"; al tocarlo se repliegan y los valores elegidos se conservan.
- [ ] **AC-9.6** Dado el control de fecha, Cuando se despliega, Entonces tiene la fecha de hoy como valor inicial y acepta una fecha real del calendario, también pasada.
- [ ] **AC-9.7** Dado el control de recurrencia, Cuando se despliega, Entonces es un solo selector con siete opciones —"Una vez", "Cada día", "Cada 2 días", "Cada 3 días", "Cada 7 días", "Cada 14 días" y "Cada 30 días"— con "Una vez" elegida; "Una vez" crea una actividad puntual y las demás una repetitiva con esa frecuencia.
- [ ] **AC-9.8** Dados cambios en la fecha, la recurrencia o los lugares, Cuando el usuario los hace, Entonces la línea-resumen se actualiza en el momento: la fecha dice "Hoy" si es la de hoy o su AAAA-MM-DD si no; la recurrencia dice su etiqueta; y los lugares dicen "Sin lugar", el nombre del lugar o "<n> lugares".
- [ ] **AC-9.9** Dada la ficha con solo el nombre escrito, Cuando el usuario toca "Guardar", Entonces se crea una sola actividad puntual, que vence hoy, sin espacio, con el responsable elegido por omisión y el icono que muestra el botón.
- [ ] **AC-9.10** Dada una fecha o una recurrencia inválidas (por ejemplo, por datos desactualizados), Cuando se intenta guardar, Entonces se muestra el mensaje de la 003 ("Elige una fecha válida." o "Elige cada cuántos días se repite.") y no se crea ni se cambia nada.
- [ ] **AC-9.11** Dada una actividad guardada, Cuando se completa, Entonces el cambio queda guardado en el momento, la lista de "Pendientes" y las burbujas del mapa se actualizan en menos de 100 ms y la ficha se cierra.

### Story 10: Una actividad en varios lugares

**As a** persona que reparte una tarea entre varios espacios
**I want** marcar varios lugares de una vez
**So that** no tenga que crear la misma actividad a mano varias veces

**Acceptance criteria:**

- [ ] **AC-10.1** Dado "Cambiar" desplegado en una actividad nueva, Cuando se muestra el control de lugares, Entonces tiene un chip por cada espacio activo del hogar, con su nombre vigente y en el orden en que se crearon, de selección múltiple, ninguno marcado de inicio, y no ofrece pasillos.
- [ ] **AC-10.2** Dada una actividad nueva sin ningún lugar marcado, Cuando se guarda, Entonces se crea una sola actividad sin espacio.
- [ ] **AC-10.3** Dados *n* lugares marcados (n de 1 en adelante), Cuando se guarda, Entonces se crean exactamente *n* actividades, con el mismo nombre, el mismo icono, la misma persona responsable, la misma fecha, el mismo tipo y la misma frecuencia, cada una con uno de los lugares marcados como espacio y un identificador propio.
- [ ] **AC-10.4** Dada la actividad "Barrer" asignada a Diana con "Cuarto 1", "Cuarto 2" y "Sala" marcados, Cuando se guarda, Entonces el hogar tiene tres actividades: Barrer en Cuarto 1, Barrer en Cuarto 2 y Barrer en Sala, las tres asignadas a Diana.
- [ ] **AC-10.5** Dados varios lugares marcados, Cuando se guarda, Entonces se crean en el orden en que los espacios se crearon (no en el orden en que se tocaron los chips) y se guardan en una sola operación, con un solo guardado en el dispositivo.
- [ ] **AC-10.6** Dadas 49 actividades pendientes y 2 lugares marcados, Cuando se guarda, Entonces no se crea ninguna y se muestra el mensaje "Con estos lugares se superarían las 50 actividades pendientes."; con 49 pendientes y 1 lugar marcado se crea 1; con 48 y 2, se crean 2; con 50, "+ Actividad" está desactivado. El conteo es el mismo del tope actual (actividades no eliminadas y no hechas).
- [ ] **AC-10.7** Dado un dato inválido en una creación en varios lugares (nombre vacío o demasiado largo, responsable inválido, fecha o frecuencia inválidas, un lugar que ya no existe), Cuando se guarda, Entonces no se crea ninguna actividad y se muestra el mensaje que explica el motivo.
- [ ] **AC-10.8** Dada una actividad existente, Cuando se abre su ficha de edición y se despliega "Cambiar", Entonces el control de lugares es de selección única: tocar un chip lo elige y desmarca el anterior, y tocar el chip elegido lo desmarca (queda "Sin lugar").
- [ ] **AC-10.9** Dadas las actividades creadas juntas, Cuando se edita o se elimina una de ellas, Entonces no cambia ninguna de las otras.
- [ ] **AC-10.10** Dadas las actividades creadas en una repetitiva, Cuando se marca "Hecho" en una, Entonces solo avanza su vencimiento, y las demás conservan el suyo.
- [ ] **AC-10.11** Dada una creación en varios lugares, Cuando se completa, Entonces no se crea, elimina ni modifica ningún espacio, miembro, bloque, intercambio ni entrada del historial.

### Story 11: Las mascotas no se encargan de actividades

**As a** persona que reparte las tareas
**I want** que solo las personas puedan encargarse de una actividad
**So that** no asigne a una mascota algo que no puede hacer

**Acceptance criteria:**

- [ ] **AC-11.1** Dada cualquier pantalla donde se elige quién hace una actividad, Cuando se muestra, Entonces no ofrece ninguna mascota.
- [ ] **AC-11.2** Dados datos desactualizados que piden crear una actividad con una mascota como responsable, Cuando se aplica, Entonces se rechaza con el mensaje "Las mascotas no pueden encargarse de actividades." y no se crea nada.
- [ ] **AC-11.3** Dados datos desactualizados que piden cambiar a una mascota como responsable de una actividad existente, Cuando se aplica, Entonces se rechaza con el mismo mensaje y la actividad queda sin cambios.
- [ ] **AC-11.4** Dado un hogar con mascotas, Cuando se miran las burbujas, la lista de "Pendientes" y las hojas de los lugares, Entonces ninguna burbuja ni fila corresponde a una mascota como responsable.
- [ ] **AC-11.5** Dado un hogar con una mascota, Cuando se elimina, Entonces no se da de baja ninguna actividad por ello (no tiene ninguna).
- [ ] **AC-11.6** Dadas las sugerencias "Dar de comer a la mascota" y "Pasear al perro", Cuando se eligen, Entonces se asignan a una persona como cualquier otra.

### Story 12: Quién juega, siempre a la vista

**As a** persona que comparte el teléfono
**I want** ver y cambiar quién juega desde cualquier pantalla
**So that** califique, proponga o responda como la persona correcta

**Acceptance criteria:**

- [ ] **AC-12.1** Dado el modo exploración o el modo edición, Cuando se muestra la pantalla, Entonces se ve arriba a la derecha el indicador "Juega: <nombre de quien juega>", que no tapa la cruceta, el cartel de la entrada ni la barra, y no hay botón "Editar".
- [ ] **AC-12.2** Dado el indicador, Cuando el usuario lo toca, Entonces se abre la lista "¿Quién juega?" de la 005 (AC-1.3 a AC-1.8) con las mismas reglas, también en el modo edición.
- [ ] **AC-12.3** Dado el modo edición con un drawer abierto, Cuando el usuario elige a otra persona, Entonces el indicador pasa a decir su nombre, el drawer se mantiene abierto en la misma pestaña, y su contenido pasa a mostrarse para la nueva persona (en "Hechas" califica ella; en "Intercambios" se muestran sus propuestas recibidas y enviadas; la pestaña "Intercambios" muestra su número).
- [ ] **AC-12.4** Dado el modo edición, Cuando el usuario cambia de jugador, Entonces se cierran las fichas y las hojas abiertas, ningún personaje se mueve (salvo la aparición en la entrada de un familiar que estaba fuera de casa, como en la 005, FR-4) y al tocar "Listo" la cámara sigue a la nueva persona.
- [ ] **AC-12.5** Dado el modo exploración, Cuando el usuario cambia de jugador, Entonces rige la 005 sin cambios (FR-2 y FR-3).
- [ ] **AC-12.6** Dado un nombre con aspecto de marcado, Cuando se muestra en el indicador, Entonces se muestra como texto, y un nombre largo se recorta sin salirse de la pantalla.
- [ ] **AC-12.7** Dado un cambio de jugador, Cuando se completa, Entonces queda guardado en el momento junto con su posición, como en la 005.

### Story 13: El drawer Intercambios

**As a** persona que cambia tareas con otra
**I want** ver y responder mis intercambios en su propia sección
**So that** los gestione sin tener que salir del juego

**Acceptance criteria:**

- [ ] **AC-13.1** Dado el drawer "Intercambios", Cuando se muestra, Entonces tiene las secciones "Recibidas" y "Enviadas" de quien juega y el botón "Proponer", con las mismas filas, textos y botones (Aceptar, Rechazar, Retirar, Quitar) que el panel de la 005 (FR-11), sin su propio botón "Cerrar" (se cierra con "Listo").
- [ ] **AC-13.2** Dado el botón "Proponer", Cuando el usuario lo toca, Entonces se abre la ficha de proponer de la 005 (FR-7) con las mismas reglas, y se muestra el motivo cuando está desactivado (AC-6.6, AC-6.7 de la 005).
- [ ] **AC-13.3** Dada una propuesta, Cuando se propone, se acepta, se rechaza, se retira o se quita, Entonces los efectos y la vigencia son los de la 005 sin cambios, y el número de la pestaña se actualiza.
- [ ] **AC-13.4** Dado el drawer "Intercambios", Cuando se muestra, Entonces no muestra espacios, familiares ni actividades.
- [ ] **AC-13.5** Dado el drawer "Intercambios", Cuando se hace cualquier acción, Entonces el panel muestra el resultado en menos de 100 ms.

### Story 14: Escribir espacios en los nombres

**As a** persona que usa el navegador de escritorio
**I want** poder escribir espacios en los campos de texto
**So that** pueda dar nombres como "Lavar platos" o "Cuarto de Ana"

**Acceptance criteria:**

- [ ] **AC-14.1** Dado un navegador de escritorio, Cuando el usuario escribe un texto con espacios en el nombre de un espacio, del propietario, de un familiar, de una mascota o de una actividad (por ejemplo, "Lavar platos"), Entonces cada espacio aparece en el campo y el texto se guarda tal como se escribió, salvo los espacios al inicio y al final.
- [ ] **AC-14.2** Dado el modo exploración en un navegador de escritorio, Cuando el usuario pulsa las teclas de flecha, Entonces el personaje se mueve como hasta ahora.
- [ ] **AC-14.3** Dado un campo de texto con foco, Cuando el usuario pulsa una flecha, Entonces mueve el cursor del campo y no mueve a ningún personaje.
- [ ] **AC-14.4** Dado un teléfono Android, Cuando el usuario escribe en cualquier campo de texto, Entonces funciona como antes (incluidos los espacios).

### Story 15: Conservar mi hogar y pasar al formato nuevo

**As a** persona que ya tiene un hogar guardado
**I want** que se abra sin error con lo que tenía
**So that** no pierda lo que sigue siendo válido

**Acceptance criteria:**

- [ ] **AC-15.1** Dado un hogar guardado con la feature 001, 002, 003, 004, 005 o 006, Cuando se abre la app, Entonces se abre sin aviso de error con sus espacios, miembros, actividades válidas, bloques de rutina, intercambios, historial, nombres, jugador y posición.
- [ ] **AC-15.2** Dado un familiar guardado con la feature 002 a 006, Cuando se abre el hogar, Entonces su aspecto es "adulta" si su género era femenino, "adulto" si era masculino y "neutro" si era otro (o no tenía), y ya no tiene ni género ni parentesco.
- [ ] **AC-15.3** Dado el propietario, Cuando se abre el hogar, Entonces se le reconoce por su membresía de propietario (no por su género), queda sin aspecto y conserva su nombre.
- [ ] **AC-15.4** Dada una mascota guardada, Cuando se abre el hogar, Entonces conserva su especie y su nombre y queda sin aspecto, género ni parentesco.
- [ ] **AC-15.5** Dada una actividad no eliminada asignada a una mascota activa, Cuando se abre el hogar, Entonces queda dada de baja (eliminada con su fecha), no aparece en ninguna lista, burbuja ni cuenta del tope, y no se da de baja ninguna otra actividad.
- [ ] **AC-15.6** Dada una propuesta de intercambio que involucraba una actividad dada de baja por AC-15.5, Cuando se abre el hogar, Entonces la propuesta deja de ser vigente por la regla de la 005 y puede quitarse con "Quitar".
- [ ] **AC-15.7** Dado el historial de un hogar con entradas acreditadas a mascotas, Cuando se abre el hogar, Entonces el historial es idéntico al guardado (mismas entradas, mismas calificaciones, mismo orden).
- [ ] **AC-15.8** Dado un hogar abierto con datos antiguos, Cuando se guarda por primera vez después, Entonces queda guardado en el formato nuevo (versión 7); abrirlo y cerrarlo sin cambios no lo reescribe.
- [ ] **AC-15.9** Dados datos guardados que no se pueden leer, que no cumplen las condiciones de las versiones anteriores o que, en la versión 7, tienen a una persona con un aspecto fuera de la lista, a una mascota con una especie fuera de la lista o con aspecto, al propietario con aspecto, o a una actividad no eliminada asignada a un miembro que no es una persona activa, Cuando se abre la app, Entonces se muestra el aviso de siempre y se crea el hogar inicial de la 001.
- [ ] **AC-15.10** Dada la migración, Cuando se aplica dos veces al mismo hogar, Entonces produce el mismo resultado; y no crea, elimina ni mueve ningún espacio, miembro o bloque.
- [ ] **AC-15.11** Dados un hogar guardado y el mismo hogar migrado, Cuando se compara el mapa generado, Entonces es idéntico.
- [ ] **AC-15.12** Dado un cierre y reapertura de la app, Cuando se abre, Entonces los aspectos, las especies, las actividades creadas en varios lugares y los demás datos siguen ahí; el drawer abierto y la pestaña elegida no se conservan.

## Functional Requirements

### FR-1: Barra y drawers

**Must:**
- Mostrar en el borde inferior una barra con las pestañas "Espacios", "Familia", "Actividades" e "Intercambios", en ese orden, siempre visible (con o sin drawer abierto).
- Abrir con cada pestaña el drawer de su sección, con título, botón "Listo" y solo su contenido; marcar la pestaña activa.
- Pasar al modo edición al abrir cualquier drawer, y permanecer en él al cambiar de pestaña.
- Volver a exploración con "Listo" o al tocar la pestaña activa.
- Limitar el drawer a la mitad inferior de la pantalla por encima de la barra, con desplazamiento interno, y dejar el hogar completo visible por encima de él.
- Mostrar "Intercambios (n)" en la pestaña cuando quien juega tiene n propuestas recibidas vigentes.
- Subir la cruceta para que quede sobre la barra en exploración.
- Abrir la app siempre en exploración y sin drawer.
- Mostrar el drawer y cambiar de pestaña en menos de 100 ms.

**Must not:**
- Mostrar los botones sueltos "Editar", "Intercambios" ni "Historial".
- Conservar entre sesiones el drawer abierto ni la pestaña elegida.
- Tapar la cruceta o el cartel de la entrada con la barra.

### FR-2: Modo edición por sección y toques en el mapa

**Must:**
- Mantener las reglas del modo edición de la 001 (FR-7): alejar la vista hasta mostrar el hogar completo, inmovilizar a los personajes y volver con "Listo".
- Hacer que tocar el mapa responda solo con lo de la sección activa: Espacios, la ficha del espacio; Familia, la ficha del propietario o del habitante (con esa prioridad) y la hoja "Fuera de casa" desde el cartel; Actividades, la hoja de la burbuja con Editar y Eliminar; Intercambios, nada.
- Cerrar las fichas y las hojas abiertas al cambiar de pestaña o al volver a exploración.
- En exploración, responder como en las features 003 y 004 (hoja con "Hecho", hoja "Fuera de casa").

**Must not:**
- Abrir una ficha o una hoja ajena a la sección activa al tocar el mapa.
- Permitir mover a los personajes mientras dura el modo edición.
- Crear, eliminar o modificar un espacio, un miembro, una actividad o un bloque como efecto de abrir, cambiar o cerrar un drawer.

### FR-3: Drawer Espacios

**Must:**
- Mostrar un contador por tipo de espacio con − y + (desactivados en los límites) y la nota "Siguiente: <nombre>" del baño, con las reglas de la 001 (FR-2, FR-4, FR-7, FR-8).
- Regenerar y mostrar el mapa en menos de 100 ms tras cada cambio.

**Must not:**
- Mostrar habitantes, actividades o intercambios.

### FR-4: Drawer Familia

**Must:**
- Mostrar las secciones "Familiares" y "Mascotas", cada una con su contador "n de límite", su botón "+" (desactivado al llegar al límite) y la lista de sus habitantes activos en el orden de creación, con el icono de su aspecto o su especie y su nombre.
- Abrir la ficha de edición al tocar una fila y la ficha de alta al tocar "+".
- Mostrar "Aún no hay familiares" o "Aún no hay mascotas" en una lista vacía.
- Mostrar los nombres siempre como texto.

**Must not:**
- Listar al propietario ni contarlo en los contadores.
- Crear, eliminar o mover un espacio, o a otro habitante, como efecto de agregar, editar o eliminar a un habitante.

### FR-5: Aspecto y ficha de familiar

**Must:**
- Guardar en cada familiar un aspecto de una lista cerrada de siete valores —adulto, adulta, niño, niña, anciano, anciana y neutro—, cada uno con su etiqueta, su icono (👨 👩 👦 👧 👴 👵 🧑), su color y su tamaño de dibujo.
- Mostrar en la ficha un botón con el icono del aspecto a la izquierda del campo de nombre, que abre un selector con los siete; preseleccionar "neutro" en el alta.
- Permitir guardar un alta con solo el nombre; rechazar un aspecto fuera de la lista con "Elige un aspecto de la lista.".
- Dibujar el personaje con el color del grupo de su aspecto (masculinos, femeninos, neutro) y con un tamaño menor para niño y niña.
- Mantener la ficha de edición con "Rutina", "Eliminar", "Cancelar" y "Guardar", y las reglas de nombres de la 002 (FR-3).
- Mantener la ficha del propietario como en la 001, sin aspecto.

**Must not:**
- Pedir ni guardar parentesco ni género en un familiar.
- Usar el aspecto para algo distinto del dibujo y el icono de la lista.
- Restringir el aspecto según otro dato.

### FR-6: Especie y ficha de mascota

**Must:**
- Guardar en cada mascota una especie de una lista cerrada de seis valores —perro, gato, conejo, hámster, loro y otro—, cada una con su etiqueta, su icono (🐶 🐱 🐰 🐹 🦜 🐾) y su color de dibujo distinto del de las demás.
- Mostrar en la ficha un botón con el icono de la especie a la izquierda del campo de nombre, que abre un selector con las seis; preseleccionar "otro" en el alta.
- Permitir guardar un alta con solo el nombre; rechazar una especie fuera de la lista con "Elige una especie de la lista.".
- Mantener las claves de especie existentes (perro, gato, otro) sin cambios.
- Mantener la ficha de edición con "Eliminar", "Cancelar" y "Guardar", sin "Rutina".

**Must not:**
- Pedir aspecto, género ni parentesco a una mascota.

### FR-7: Drawer Actividades

**Must:**
- Mostrar las pestañas "Pendientes" y "Hechas", con "Pendientes" al abrir.
- En "Pendientes", mostrar el contador "n de 50", "+ Actividad" (desactivado al llegar a 50) y la lista de las pendientes ordenadas por vencimiento, con las reglas de la 003 (FR-8).
- En "Hechas", mostrar el filtro de persona, el resumen de promedio, la lista de entradas y los controles de calificación de la 006, con las mismas reglas.
- Ofrecer en el filtro de "Hechas" a las personas siempre y a las mascotas solo si tienen alguna entrada, y reiniciarlo en "Todos" cada vez que se muestra la pestaña.
- Hacer que quien califica sea quien juega.

**Must not:**
- Mostrar un botón "Hecho" ni un botón "Historial" en el drawer.
- Cambiar datos al pasar de una pestaña a otra.

### FR-8: Ficha de actividad

**Must:**
- Mostrar un botón de icono a la izquierda del campo de nombre (máximo 30 caracteres), con 📌 ("Otra") por omisión.
- Ofrecer una lista cerrada de diez sugerencias con nombre e icono (Lavar platos, Barrer, Trapear, Limpiar el baño, Lavar ropa, Sacar la basura, Hacer compras, Regar las plantas, Dar de comer a la mascota, Pasear al perro), mostradas como chips: las primeras 6 con el campo vacío y las que contienen el texto escrito, sin distinguir mayúsculas, acentos ni espacios en los extremos.
- Aplicar nombre e icono al elegir una sugerencia, y aplicar el icono cuando el texto escrito coincide con una (misma comparación); mientras el texto coincide con una, el botón del icono no abre el selector.
- Mientras el texto no coincide con ninguna sugerencia, abrir con el botón un selector con los nueve iconos de la 003; mantener un icono elegido a mano mientras no coincida con una sugerencia, descartarlo al coincidir, y volver a 📌 al dejar de coincidir.
- Al editar una actividad existente, respetar el icono guardado hasta que el nombre pase a coincidir con una sugerencia.
- Mostrar un selector de responsable con un círculo por persona (color e inicial), el propietario primero, sin mascotas, con quien juega elegido por omisión en el alta.
- Mostrar una línea-resumen "📅 <fecha> · <recurrencia> · <lugares>" con "Cambiar" (y "Ocultar" al desplegarse) que despliega la fecha (hoy por omisión, puede ser pasada), la recurrencia (un solo selector: Una vez, Cada día, Cada 2, 3, 7, 14 o 30 días) y los lugares.
- Habilitar "Guardar" en el alta solo con nombre y responsable; guardar con solo el nombre crea una actividad puntual, vence hoy, sin espacio, con el icono mostrado.
- Mantener las reglas de nombre y de datos de la 003 (FR-1) y sus mensajes.

**Must not:**
- Mostrar más campos que los indicados antes de tocar "Cambiar".
- Guardar una marca de icono "editable" o "bloqueado": se deduce del nombre.
- Ofrecer una mascota como responsable.

### FR-9: Creación en varios lugares

**Must:**
- Ofrecer en el alta un chip por cada espacio activo (nombre vigente, orden de creación, sin pasillos) con selección múltiple.
- Crear, con n lugares marcados, n actividades independientes con los mismos datos y un espacio distinto cada una, con un identificador propio; sin ningún lugar marcado, crear una sin espacio.
- Crearlas en el orden de los espacios, en una sola operación atómica y con un solo guardado.
- Rechazar sin crear nada si el total superaría las 50 actividades pendientes (mismo conteo que el tope actual) con "Con estos lugares se superarían las 50 actividades pendientes.", o si cualquier dato es inválido.
- En la edición, ofrecer los lugares como selección única, y tratar cada actividad como un registro suelto.

**Must not:**
- Crear, eliminar o modificar un espacio, un miembro, un bloque, un intercambio o una entrada del historial como efecto de crear actividades.
- Vincular entre sí las actividades creadas juntas: editar, eliminar o marcar "Hecho" una no cambia las otras.
- Crear un subconjunto de las actividades pedidas.

### FR-10: Responsables solo personas

**Must:**
- Aceptar como responsable de una actividad solo a una persona activa (propietario o familiar).
- Rechazar con "Las mascotas no pueden encargarse de actividades." crear o editar una actividad con una mascota como responsable, sin cambiar nada.
- Conservar sin cambios las entradas del historial acreditadas a mascotas y su calificación.

**Must not:**
- Ofrecer una mascota como responsable en ninguna pantalla.
- Cambiar las reglas de intercambios (que ya son solo entre personas).

### FR-11: Indicador "Juega"

**Must:**
- Mostrar "Juega: <nombre>" arriba a la derecha en exploración y en edición, sin tapar la cruceta, el cartel ni la barra, con el nombre recortado si es largo y siempre como texto.
- Abrir al tocarlo la lista "¿Quién juega?" de la 005, en ambos modos.
- En el modo edición, al elegir otra persona: actualizar el indicador y el resalte, mantener abierto el drawer y su pestaña con el contenido de la nueva persona, cerrar las fichas y las hojas, no mover a nadie salvo la aparición en la entrada de un familiar que estaba fuera de casa (005, FR-4), y guardar el cambio en el momento.
- En exploración, aplicar la 005 sin cambios.

**Must not:**
- Mostrar un botón "Editar".
- Crear, eliminar o mover un espacio, un miembro o una actividad como efecto de cambiar de jugador.

### FR-12: Drawer Intercambios

**Must:**
- Mostrar "Recibidas", "Enviadas" y "Proponer" de quien juega, con las mismas filas, textos, botones, ficha de proponer y reglas de vigencia de la 005 (FR-7 a FR-11).
- Actualizar el drawer y el número de la pestaña tras cada acción, en menos de 100 ms.

**Must not:**
- Cambiar las reglas de proponer, aceptar, rechazar, retirar, quitar ni de vigencia.
- Mostrar espacios, familiares o actividades.

### FR-13: Tecla Espacio y teclado

**Must:**
- Aceptar la tecla Espacio y todas las teclas de escritura en los campos de texto del navegador de escritorio (nombres de espacios, del propietario, de familiares, de mascotas y de actividades).
- Mantener las flechas moviendo al personaje en exploración, y moviendo el cursor del campo cuando hay un campo con foco.
- Mantener el comportamiento en Android.

**Must not:**
- Capturar la tecla Espacio ni las teclas de escritura de forma global.

### FR-14: Persistencia y compatibilidad

**Must:**
- Guardar en el dispositivo el aspecto de cada familiar, la especie de cada mascota y las actividades creadas, cada vez que cambian, y restaurarlos al reabrir la app.
- Abrir sin pérdida y sin aviso de error un hogar guardado con la feature 001 a 006 y guardarlo a partir de entonces en el formato nuevo (versión 7), solo en el siguiente guardado.
- Al migrar: convertir el género de cada familiar en aspecto (femenino → adulta, masculino → adulto, otro o ausente → neutro); identificar al propietario por su membresía y dejarlo sin aspecto; quitar género y parentesco de todos los miembros; dar de baja las actividades no eliminadas cuyo responsable sea una mascota activa; no tocar el historial ni nada más.
- Dar el resultado de la migración de forma determinista y con la hora inyectada.
- Considerar ilegibles los datos que no cumplen las condiciones de las versiones anteriores o que, en la versión 7: tienen una persona activa no propietaria con un aspecto fuera de la lista; una mascota activa con una especie fuera de la lista o con aspecto; al propietario con aspecto; o una actividad no eliminada cuyo responsable no es una persona activa. En ese caso, mostrar un aviso y crear el hogar inicial de la 001.

**Must not:**
- Perder o modificar los espacios, bloques de rutina, intercambios, historial, nombres, jugador o posición de un hogar de las features 001 a 006 al abrirlo (salvo lo indicado).
- Guardar el drawer abierto, la pestaña elegida, el icono "editable" ni el filtro del historial.
- Enviar datos fuera del dispositivo.

### FR-15: Identidad y preparación multiusuario

**Must:**
- Dar a cada actividad creada un identificador estable y globalmente único, y la fecha de creación, la de última modificación y la cuenta autora de siempre.
- Seguir referenciando a los miembros y espacios por identificador, nunca por nombre, posición, aspecto o especie.
- Conservar los registros dados de baja con su fecha de eliminación.

**Must not:**
- Perder el vínculo de una actividad con su responsable y su espacio al renombrar o renumerar.

## Non-Functional Requirements

### Performance

- El movimiento de los personajes se mantiene a 60 cuadros por segundo en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares en ruta a la vez, 4 mascotas, el propietario caminando solo, 50 actividades por hacer repartidas por todos los espacios del hogar de mayor tamaño permitido y 200 entradas en el historial.
- Abrir un drawer, cambiar de pestaña, abrir una ficha o un selector de iconos, elegir una sugerencia y guardar una actividad (incluso en varios lugares) muestran el resultado en menos de 100 ms en el dispositivo de referencia.
- El filtro de sugerencias y la creación en varios lugares, con el hogar de mayor tamaño permitido, no producen una pausa perceptible.
- Cada cambio del modo edición se muestra en el mapa en menos de 100 ms, como hasta ahora.

### Security

- No hay autenticación en esta feature: cualquier persona del teléfono puede jugar como cualquiera. Es una decisión consciente de la v1 de teléfono compartido.
- Ningún dato sale del dispositivo.
- Los textos escritos por el usuario (nombres de miembros, de espacios y de actividades) se muestran siempre como texto, nunca interpretados como marcado, en la barra, los drawers, las fichas, los chips y las filas.

### Reliability

- Las reglas del dominio se verifican de forma automática sin interfaz y con un reloj inyectado: el catálogo de aspectos (siete valores, icono, grupo de color, tamaño) y de especies (seis valores, icono, colores distintos); las altas de familiares y mascotas con todos los valores y con valores inválidos; la creación de una actividad en n lugares (n de 0 a varios), incluido el límite en 48, 49, 50 y 51; el rechazo de una mascota como responsable al crear y al editar; el catálogo de sugerencias (diez, con nombre de máximo 30 caracteres e icono válido); y las funciones puras de sugerencias (filtro, coincidencia sin distinguir mayúsculas ni acentos, icono aplicado y editable).
- La migración se verifica de forma automática con documentos guardados de cada versión de origen (de la 1 a la 6): el mapeo de aspectos; el propietario identificado por su membresía; la baja de actividades de mascotas solo en las versiones que pueden tenerlas (3 a 6); el historial intacto; documentos corruptos y documentos v7 inválidos.
- Una prueba de contrato comprueba que "Hecho", los intercambios, las rutinas, las calificaciones y los estados de los espacios producen los mismos resultados que antes de esta feature.
- El arreglo de la tecla Espacio no puede probarse sin navegador (las reglas del proyecto prohíben pruebas automáticas con DOM o con el motor gráfico): se verifica a mano en Chrome de escritorio, con un paso concreto registrado en `verification.md` (escribir "Lavar platos" en cada campo de nombre y mover al personaje con las flechas).
- Nunca queda una actividad con un responsable que no sea una persona activa; se verifica de forma automática para la creación, la edición, la migración y la eliminación de una persona.
- Un cierre inesperado de la app pierde como máximo el último cambio no aplicado.

### Usability

- La barra, las pestañas, los chips, los círculos de responsable y los botones de icono tienen un tamaño táctil legible en un teléfono en vertical; los chips se ajustan en varias líneas sin salirse de la pantalla.
- Se distingue de un vistazo la pestaña activa, la persona elegida como responsable y los lugares marcados.
- El caso común —agregar una actividad de una sugerencia para quien juega, hoy y una vez— se resuelve con dos toques (la sugerencia y "Guardar"); agregar un familiar o una mascota con solo el nombre, con escribirlo y tocar "Guardar".
- Los mensajes de error explican el motivo y qué hacer.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Se intenta guardar un familiar o una mascota con nombre vacío o repetido | Se rechaza con el mensaje de la 002 (nombre vacío, demasiado largo o repetido) y no se crea nada |
| Se intenta guardar un aspecto o una especie fuera de la lista (datos desactualizados) | Se rechaza con "Elige un aspecto de la lista." o "Elige una especie de la lista." y no cambia nada |
| Se intenta crear o editar una actividad con una mascota como responsable | Se rechaza con "Las mascotas no pueden encargarse de actividades." y no cambia nada |
| Se marcan lugares que harían superar las 50 actividades pendientes | No se crea ninguna; se muestra "Con estos lugares se superarían las 50 actividades pendientes." |
| Un lugar marcado ya no existe al guardar (se eliminó mientras la ficha estaba abierta) | No se crea ninguna actividad y se muestra el mensaje "Elige un espacio de la lista." |
| El nombre de la actividad está vacío o tiene más de 30 caracteres | Se rechaza con el mensaje de la 003 y no se crea nada |
| La fecha o la frecuencia son inválidas | Se rechaza con el mensaje de la 003 y no se crea nada |
| Se escribe un texto que no coincide con ninguna sugerencia y no se elige icono | La actividad se guarda con el icono genérico 📌 ("Otra") |
| Se toca el mapa en una casilla sin nada de la sección activa | No pasa nada |
| Se cambia de pestaña con una ficha o una hoja abierta | Se cierran sin guardar |
| Se cambia de jugador en edición | Se actualizan el indicador y el drawer; se cierran fichas y hojas; no se mueve a nadie salvo la aparición de un familiar que estaba fuera |
| Una propuesta involucra una actividad dada de baja por la migración | Deja de ser vigente y se puede quitar con "Quitar" |
| Un historial tiene entradas acreditadas a una mascota | Se conservan; la mascota aparece en el filtro solo si tiene entradas; cualquier persona puede calificarlas |
| Falla el guardado en el dispositivo | Se muestra un aviso no bloqueante y la sesión continúa con los datos en memoria; se reintenta en el siguiente guardado |
| Los datos guardados no se pueden leer, o son inválidos en la versión 7 | Se muestra un aviso que explica que no se pudo recuperar el hogar y se crea el hogar inicial de la 001 |
| Se pulsa Espacio en un campo de texto en escritorio | El espacio aparece en el campo |

## Open Questions

- Ninguna bloqueante. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-09 y la decisión de arquitectura está registrada en el ADR enlazado.
- **Resueltas en esta spec** (puntos que el PRD dejó para la spec): la "Hechas" mantiene el filtro de la 006 y ofrece a una mascota solo si tiene entradas (AC-7.5); la línea-resumen muestra "Hoy" o la fecha AAAA-MM-DD, la etiqueta de recurrencia y "Sin lugar", el nombre o "<n> lugares" (AC-9.8); el botón de despliegue pasa de "Cambiar" a "Ocultar" (AC-9.5); los chips de lugares y la creación siguen el orden de creación de los espacios (AC-10.1, AC-10.5); la comparación de sugerencias ignora mayúsculas, acentos y espacios en los extremos (AC-8.3, AC-8.6); las sugerencias se muestran como "contiene el texto" (AC-8.3); el icono elegido a mano se descarta al coincidir con una sugerencia (AC-8.10).
- **Decisiones que esta spec tomó sobre puntos que el PRD no cerraba**, a confirmar al aprobarla: (a) los textos fijos "Aún no hay familiares", "Aún no hay mascotas", "Elige un aspecto de la lista.", "Elige una especie de la lista.", "Las mascotas no pueden encargarse de actividades.", "Con estos lugares se superarían las 50 actividades pendientes." y los marcadores "Nombre del familiar", "Nombre de la mascota" y "Nombre de la actividad"; (b) el selector "¿Quién juega?" también funciona en el modo edición, porque "Hechas" e "Intercambios" dependen de quien juega, y el drawer se mantiene abierto con su contenido actualizado (AC-12.3, AC-12.4); (c) el propietario no aparece en las listas del drawer "Familia" y su ficha se abre desde el mapa (AC-4.5); (d) el cartel "n fuera" responde en edición solo en la sección "Familia" (AC-2.3); (e) las filas de las listas de "Familia" abren la ficha de edición (AC-4.2); (f) la pestaña "Pendientes" no tiene botón "Hecho" (AC-7.7); (g) la inicial de cada círculo de responsable es la primera letra de su nombre en mayúscula; (h) los aspectos de ancianos no cambian de tamaño ni de color respecto de los adultos (AC-5.9); (i) los tres nuevos colores de especie no se fijan en la spec: solo que sean distintos de los demás (AC-6.4).
- Riesgos de legibilidad y de coordinación, a medir en un teléfono con la verificación de la fase de integración del plan y a ajustar con evidencia: con la barra, un drawer de media pantalla y la cruceta, el hogar completo de mayor tamaño puede no caber entero por encima del drawer en teléfonos pequeños (AC-1.6); una fila de chips de lugares con muchos espacios puede alargar mucho el formulario (se recorre dentro de la ficha); y el cambio de jugador en edición reutiliza las reglas de aparición de la 005 sin movimiento de los demás (AC-12.4), lo que el plan debe comprobar contra el código de movimiento.

## Out of Scope (Future Considerations)

- Arte real para personajes, mascotas y burbujas.
- Aspecto para el propietario, y fecha de nacimiento, edad o cumpleaños de los familiares.
- Agrupar, editar o mover como conjunto las actividades creadas en varios lugares.
- Sugerencias de actividad personalizables o aprendidas del uso.
- Más iconos de actividad.
- El botón "Hecho" dentro del drawer de Pendientes.
- Responsabilidades propias de las mascotas.
- Cambios en intercambios, rutinas, calificaciones o el tope del historial.
- Cuentas, inicio de sesión, un dispositivo por persona y sincronización (pieza de multiusuario).
- El stack oficial de la aplicación.
