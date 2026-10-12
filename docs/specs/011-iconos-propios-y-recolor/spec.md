# Feature 011: Iconos propios y recolor de la interfaz

**Status:** Approved
**Version:** 2.0.0
**Created:** 2026-10-10
**Last Updated:** 2026-10-11
**Branch:** `feat/011-iconos-propios-y-recolor`
**Source:** [prd.md](prd.md) · [ADR el arte de la interfaz HTML sale de las cuadrículas y la paleta](../../adr/011-arte-de-la-interfaz-html-desde-las-cuadriculas.md) · [ADR el arte como cuadrículas de texto con paleta compartida](../../adr/008-arte-cuadriculas-con-paleta.md) · se apoya en la [spec 003](../003-actividades/spec.md) (v1.0.0), la [spec 007](../007-menu-y-formularios-simples/spec.md) (v1.0.0), la [spec 008](../008-base-visual-y-mundo/spec.md) (v1.0.0), la [spec 009](../009-habitantes-animados/spec.md) (v1.0.0) y la [spec 010](../010-estados-de-limpieza/spec.md) (v1.0.0)

Los criterios llevan al final la forma de comprobarlos: **[auto]** (prueba automática sin Phaser ni pantalla) o **[nav]** (se mira o mide en el navegador de escritorio y en el teléfono con el hogar de prueba).

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-10-10 | Spec inicial aprobada |
| 1.0.1 | 2026-10-11 | PATCH, solo aclaraciones tras la revisión de la implementación (sin cambio de comportamiento): FR-7 añade el rol `separador` (clave `A`) que ya usaba el plan, y aclara que `opacity` y `transparent` no son colores propios; FR-8 y AC-8.3 aclaran que los chips y los círculos de responsable conservan la fuente del sistema porque llevan texto del usuario; FR-6 recoge el respaldo de 4 s si el módulo no llega a cargar; AC-7.4 recoge la excepción aceptada del «★» del resumen del historial. Motivo: lo construido y validado en pantalla ya hacía esto; la spec no lo decía. Confirmado por el usuario el 2026-10-11. |
| 2.0.0 | 2026-10-11 | MAJOR, reescribe AC-6.4 y toca FR-1, FR-2, FR-5, FR-7, FR-8, AC-1.1, AC-1.9, AC-7.3, AC-8.5: la cruceta de movimiento vuelve a su versión de la 010 (botones con los símbolos ▲ ◀ ▶ ▼ como texto, fondo semitransparente de la paleta, esquinas redondeadas, sin marco grueso ni sombra dura) y se quitan los 4 iconos de flecha (el catálogo pasa de 23 a 19 iconos). Se añade AC-9.6: ningún icono, avatar ni estrella ofrece guardar o seleccionar la imagen al mantenerlos pulsados. Motivo: la prueba en el teléfono mostró que mantener pulsada una flecha para caminar activaba la selección y descarga de la imagen del navegador, y la cruceta con marco quedaba demasiado recargada. Confirmado por el usuario el 2026-10-11. |

---

## Problem Statement

Tras las features 008 a 010 el mapa del hogar se ve como un videojuego de GBA en pixel art, pero todo lo que lo rodea sigue siendo de otro mundo: la barra inferior, los drawers, las fichas y las burbujas usan emoji del sistema (que se ven distinto en cada teléfono) y una interfaz de marrón y crema que no sale de la paleta del juego. Las insignias de estado son cuadros de texto de color y las estrellas del historial son símbolos de texto. Quien juega ve dos estilos en una sola pantalla. Esta feature, la cuarta y última de arte, da iconos propios a la interfaz y le da aspecto de videojuego con la misma paleta y el mismo contorno oscuro del mundo. No cambia ninguna regla del juego ni lo que se guarda.

## Goals

- Un **juego de 19 iconos propios** de 16×16 con la paleta única, a color y con contorno oscuro, que reemplazan a todos los emoji y símbolos-icono de la interfaz y del mapa.
- Que los **familiares y las mascotas** se vean con el cuadro de frente de su personaje de la 009 donde hoy hay un emoji (lista de Familia y selector de aspecto y especie).
- Que **toda la interfaz HTML y el texto del mapa (etiquetas, cartel y resalte) usen solo colores de la paleta**, con un solo lugar donde se definen, y tenga aspecto de **marco de videojuego**: esquinas cuadradas, borde oscuro grueso, sombra dura, relieve en los botones y Silkscreen en títulos y botones.
- Que los dibujos se **preparen una sola vez** al arrancar y que, si alguno falla, la interfaz siga funcionando con un respaldo.
- Que lo demás **siga funcionando igual**: disposición y comportamiento de los controles, mapa, personajes, estados de limpieza, hogares guardados y el formato guardado.
- Que el movimiento siga a 60 cuadros por segundo o más y que el redibujo no empeore con la carga completa.

## Non-Goals

- No hay iconos monocromos ni que hereden el color del texto, ni modo oscuro, temas intercambiables o ajustes de arte desde la aplicación.
- No se vuelve a dibujar el mundo, los personajes, los muebles ni los estados de limpieza (008 a 010).
- No hay animaciones de la interfaz o de los iconos, ni sonido ni vibración.
- No cambian la disposición, el flujo ni los textos de las pantallas y los formularios; no hay controles ni pantallas nuevas.
- No hay avatares en los círculos de responsable, en «¿Quién juega?», en los intercambios ni en el historial.
- No cambian el modelo, el generador, las actividades, las rutinas, los intercambios, el historial ni el formato guardado (sigue `version: 7`); las claves de `icono` de las actividades guardadas no cambian.
- No se añaden iconos de actividad más allá de los 9 actuales ni iconos distintos por sugerencia.
- No se usa arte importado (PNG, hojas de sprites, fuentes de iconos ni paquetes de terceros) ni se crea una galería o herramienta de arte: se revisa en el juego.

## Users and Context

**Primary users:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, igual que en las features 001 a 010.
**Secondary users:** quienes en el futuro tendrán su propio dispositivo; esta feature no implementa nada de eso.
**Usage context:** sesiones cortas en un teléfono Android en vertical, y un navegador de escritorio para probar. Quien juega toca la barra y los drawers con el pulgar y mira el mapa de un vistazo.
**User mental model:** el mismo de las features anteriores. Vocabulario nuevo: "icono" (un dibujo de 16×16 de la interfaz); "avatar" (el cuadro de frente en reposo de un personaje, usado como imagen de un familiar o una mascota en las listas); "marco de videojuego" (el aspecto de paneles y botones: esquinas cuadradas, borde oscuro grueso y sombra dura).

**Relación con las specs anteriores.** Esta feature reemplaza únicamente el aspecto de la interfaz y de los iconos; el comportamiento de cada pantalla es el de sus specs:

- **Spec 003:** las burbujas (un icono de la actividad más atrasada del lugar y «+» si hay más) y las insignias de estado junto al nombre de cada espacio siguen con su comportamiento; cambia cómo se dibujan. El contrato de `INSIGNIAS` (`✓`, `!`, `!!`) queda sin uso en la presentación y no cambia.
- **Spec 007:** la barra de cuatro pestañas, los drawers, las fichas, los chips de sugerencias y el selector de iconos siguen con su comportamiento; cambian sus iconos y su aspecto. La prueba AC-1.1 de la 007 (la barra y su icono) se ajusta: el icono de cada pestaña pasa de emoji a su clave de icono.
- **Spec 006:** las estrellas del historial siguen con su comportamiento (de 1 a 5, solo de otra persona); cambia su dibujo.
- **Spec 008:** la paleta de 32 colores y Silkscreen no cambian; esta feature extiende el uso de la paleta al CSS y mantiene el tamaño de letra del mapa (12 px).
- **Spec 009:** los personajes y su regla de elección (`personajeDe`) no cambian; el avatar usa su cuadro de frente.
- **Spec 010:** el mundo y los estados no cambian; el estado de limpieza se sigue derivando como antes.
- **Los emoji de `catalogo.js`** (`DATOS_ASPECTO` y `DATOS_ESPECIE`) y `INSIGNIAS` de `aspecto.js` quedan en el dominio sin cambios y sin uso en la presentación.

El resto de las specs 001 a 010 sigue vigente sin cambios.

## User Stories

### Story 1: Un juego de iconos propios, dibujado con la paleta

**As a** persona que usa el juego
**I want** que los iconos de la interfaz sean dibujos propios del juego
**So that** se vean igual en cualquier teléfono y combinen con el mapa

**Acceptance criteria:**

- [ ] **AC-1.1** Dado el catálogo de iconos, Cuando se listan sus claves, Entonces son exactamente las 19 de FR-1 (4 de pestañas, 9 de actividades, 3 de estados, 2 de estrellas y 1 de fecha), sin repetidas. **[auto]**
- [ ] **AC-1.2** Dado cualquier icono, Cuando se mide, Entonces tiene exactamente 16 píxeles de ancho y 16 de alto. **[auto]**
- [ ] **AC-1.3** Dado cualquier icono, Cuando se examinan sus píxeles, Entonces cada píxel es transparente o es un color de la paleta de la 008, y ninguno usa un color que no esté en ella. **[auto]**
- [ ] **AC-1.4** Dado cualquier icono, Cuando se examinan sus píxeles, Entonces tiene al menos un píxel de color y al menos un píxel con el color de contorno oscuro de la paleta. **[auto]**
- [ ] **AC-1.5** Dados los 9 iconos de actividades, Cuando se comparan sus dibujos, Entonces son distintos entre sí. **[auto]**
- [ ] **AC-1.6** Dadas las claves de `ICONOS` de `catalogo.js` (las 9 que se guardan en las actividades, incluida la genérica `otra`), Cuando se busca el icono de cada una, Entonces todas lo tienen. **[auto]**
- [ ] **AC-1.7** Dados los tres estados de limpieza (`limpio`, `desordenado`, `desastre`), Cuando se busca el icono de cada uno, Entonces los tres lo tienen y son distintos entre sí. **[auto]**
- [ ] **AC-1.8** Dado el catálogo de iconos, Cuando se piden dos veces, Entonces las cuadrículas son idénticas (el arte es determinista y no se modifica al leerlo). **[auto]**
- [ ] **AC-1.9** Dados los 19 iconos mostrados a ×2 sobre el crema y sobre el morado oscuro de la interfaz, Cuando se miran, Entonces se reconoce cada uno (los de actividades se distinguen entre sí) sin leer su rótulo. **[nav]**

### Story 2: La barra inferior con iconos propios

**As a** persona que cambia de sección
**I want** que cada pestaña de la barra tenga su icono dibujado
**So that** la barra se vea parte del juego

**Acceptance criteria:**

- [ ] **AC-2.1** Dada la lista de secciones, Cuando se lee la de cada pestaña, Entonces su icono es la clave del icono de esa pestaña (Espacios, Familia, Actividades, Intercambios) y ninguna es un emoji. **[auto]**
- [ ] **AC-2.2** Dada la barra, Cuando se muestra, Entonces cada pestaña dibuja su icono a ×2 (32 px) con su rótulo en Silkscreen debajo, y la pestaña abierta se distingue de las demás. **[nav]**
- [ ] **AC-2.3** Dada la pestaña Intercambios con propuestas recibidas, Cuando se muestra, Entonces su rótulo conserva el contador de la 007 («Intercambios (n)») junto al icono. **[nav]**

### Story 3: Los iconos de actividad en toda la interfaz

**As a** persona que ve o crea actividades
**I want** que cada actividad muestre su icono propio en todas las pantallas
**So that** las reconozca de un vistazo en cualquier lista

**Acceptance criteria:**

- [ ] **AC-3.1** Dada una actividad con cualquiera de las 9 claves de icono, Cuando se pinta en la lista de pendientes, la hoja de un lugar, el historial, el chip de sugerencia, el selector de iconos o el botón de icono de la ficha, Entonces se muestra el icono dibujado de esa clave y no un emoji. **[nav]**
- [ ] **AC-3.2** Dada una actividad guardada con una clave de icono que no está en las 9, Cuando se pinta, Entonces se muestra el icono genérico `otra` sin error. **[auto]**
- [ ] **AC-3.3** Dado el selector de iconos de una actividad, Cuando se abre, Entonces muestra una opción por clave de `ICONOS` con su icono a ×3 (48 px) y su rótulo, con la actual marcada, y elegir una la asigna como hasta ahora (AC-8.7 de la 007). **[nav]**
- [ ] **AC-3.4** Dado el nombre de una actividad igual al de una sugerencia, Cuando se escribe, Entonces el botón de icono de la ficha muestra el icono de la sugerencia y sigue sin poder cambiarse (AC-8.5 de la 007); con otro nombre muestra el elegido o el genérico y sigue siendo editable. **[nav]**
- [ ] **AC-3.5** Dado el drawer Actividades con 50 pendientes y el historial con 200 entradas, Cuando se desplazan, Entonces cada fila muestra su icono a ×2 (32 px) y el desplazamiento no tiene tirones. **[nav]**
- [ ] **AC-3.6** Dado el chip de una sugerencia, Cuando se muestra, Entonces lleva su icono a ×1 (16 px) antes del nombre, y tocarlo sigue escribiendo su nombre en la ficha. **[nav]**

### Story 4: Burbujas e insignias del mapa dibujadas

**As a** persona que mira el mapa
**I want** que las burbujas y las insignias de estado sean dibujos del juego
**So that** el mapa no mezcle emoji con pixel art

**Acceptance criteria:**

- [ ] **AC-4.1** Dado un lugar con actividades por hacer, Cuando se dibuja su burbuja, Entonces muestra el icono dibujado de la actividad más atrasada del lugar (el mismo criterio de la 003) y, si hay más de una, el «+» como texto en Silkscreen, y no usa ningún emoji. **[nav]**
- [ ] **AC-4.2** Dada una burbuja, Cuando se toca, Entonces responde como en la 003 y la 007 (en exploración abre la hoja del lugar; en edición, según la sección abierta) y el área táctil es la que se dibuja. **[nav]**
- [ ] **AC-4.3** Dado un espacio con estado de limpieza, Cuando se dibuja su etiqueta, Entonces junto al nombre se ve el icono de su estado (limpio, desordenado o desastre) en lugar del cuadro de texto ✓ ! !!, a 16 px en pantalla sin importar el zoom. **[nav]**
- [ ] **AC-4.4** Dada la etiqueta de un espacio que se desplaza en exploración hacia la parte visible, Cuando se mueve, Entonces el icono del estado la sigue pegado a su derecha, como la insignia de hoy. **[nav]**
- [ ] **AC-4.5** Dado un espacio cuyo estado cambia (al marcar «Hecho», al agregar una actividad o al cambiar el día con la app abierta), Cuando se refresca, Entonces su icono de estado pasa al nuevo estado. **[nav]**
- [ ] **AC-4.6** Dado el pasillo, Cuando se dibuja el mapa, Entonces no tiene etiqueta ni icono de estado, como hoy. **[nav]**
- [ ] **AC-4.7** Dado el cartel de la entrada, Cuando hay familiares fuera de casa, Entonces sigue mostrando el texto «n fuera» (y su « !» cuando corresponde) en Silkscreen y con el mismo comportamiento al tocarlo. **[nav]**

### Story 5: Familiares y mascotas con su personaje como avatar

**As a** persona que mira la lista de la familia
**I want** ver a cada familiar y mascota con su personaje de pixel art
**So that** la lista y el mapa muestren a la misma figura

**Acceptance criteria:**

- [ ] **AC-5.1** Dado un miembro del hogar, Cuando se elige su avatar, Entonces es el cuadro de frente en reposo (vista `frente`, cuadro 0) del personaje que devuelve `personajeDe` para él, de modo que coincide con el del mapa. **[auto]**
- [ ] **AC-5.2** Dados los 14 personajes (el protagonista, los 7 aspectos y las 6 especies), Cuando se busca el avatar de cada uno, Entonces todos tienen cuadro de frente. **[auto]**
- [ ] **AC-5.3** Dado un miembro con un aspecto o una especie fuera de las listas, Cuando se elige su avatar, Entonces es el del personaje de respaldo (`neutro` para una persona; `otro` para una mascota, según `personajeDe`) sin error. **[auto]**
- [ ] **AC-5.4** Dada la lista de Familia (el propietario, los familiares y las mascotas), Cuando se muestra, Entonces cada fila lleva su avatar a ×2 (32 px) en lugar del emoji y tocar la fila abre su ficha como hasta ahora. **[nav]**
- [ ] **AC-5.5** Dado el selector de aspecto de un familiar o de especie de una mascota, Cuando se abre, Entonces cada opción muestra el avatar de ese aspecto o especie a ×2 con su rótulo, con el actual marcado, y el botón de icono de la ficha del habitante muestra el avatar del elegido. **[nav]**
- [ ] **AC-5.6** Dado cualquier otro lugar que hoy muestra a un miembro (círculos de responsable, «¿Quién juega?», intercambios, historial), Cuando se muestra, Entonces conserva lo que muestra hoy (inicial con su color, o el nombre), sin avatar. **[nav]**

### Story 6: Estrellas y fecha dibujadas, y cruceta sutil

**As a** persona que califica, elige una fecha o mueve al personaje
**I want** que las estrellas y la fecha usen dibujos del juego y que la cruceta de movimiento siga sutil y sin imágenes
**So that** no haya símbolos de texto sueltos salvo las flechas de la cruceta, y que caminar con el dedo sostenido no active nada del navegador

**Acceptance criteria:**

- [ ] **AC-6.1** Dada una calificación de n estrellas de 5, Cuando se pinta la fila del historial, Entonces las primeras n muestran la estrella llena y las demás la vacía, a ×2 (32 px), y el comportamiento (quién puede calificar, cambiar o quitar) es el de la 006. **[nav]**
- [ ] **AC-6.2** Dada una estrella de una calificación propia o bloqueada, Cuando se pinta, Entonces está desactivada como hoy y se distingue de una activa. **[nav]**
- [ ] **AC-6.3** Dada la línea-resumen de la ficha de actividad, Cuando se pinta, Entonces el icono de fecha (a ×1) va antes del texto, y el texto del resumen ya no lleva ningún símbolo al comienzo: devuelve «Hoy · Una vez · Sin lugar» y variantes. **[auto]**
- [ ] **AC-6.4** Dada la cruceta, Cuando se muestra, Entonces cada botón muestra como texto el símbolo de su dirección (▲ ◀ ▶ ▼), sobre un fondo semitransparente de la paleta y con esquinas redondeadas, sin borde grueso ni sombra dura (el aspecto de la 010), conserva su nombre accesible («Arriba», «Izquierda», «Derecha», «Abajo»), y los huecos entre botones siguen dejando pasar el toque al mapa. **[nav]**

### Story 7: Los colores de la interfaz salen de la paleta

**As a** persona que mantiene el juego
**I want** que cada color de la interfaz salga de la paleta, definido en un solo lugar
**So that** cambiar un color de la paleta cambie todo a la vez y nada se desvíe

**Acceptance criteria:**

- [ ] **AC-7.1** Dada la paleta de 32 colores, Cuando se calculan las variables de color de la interfaz, Entonces hay una por clave de la paleta, con exactamente el valor de su color, y la función es pura (mismo resultado en cada llamada). **[auto]**
- [ ] **AC-7.2** Dada la hoja de estilos de `index.html`, Cuando se examina su texto, Entonces no contiene ningún color escrito a mano (`#hex`, `rgb(`, `hsl(` ni nombres de color) salvo las variables de FR-7, y `rgba` solo aparece con una variable de la paleta con alfa. **[auto]**
- [ ] **AC-7.3** Dado `index.html`, Cuando se examina, Entonces tampoco quedan emoji ni símbolos-icono (🏠 👨‍👩‍👧 📋 🔄 🍽️ 📅 ★ ☆ ✓…) en su contenido; la única excepción son los cuatro símbolos de la cruceta (▲ ◀ ▶ ▼), que siguen como texto de sus botones. **[auto]**
- [ ] **AC-7.4** Dados `juego.js`, `secciones.js`, `formularios.js` y el módulo de presentación nuevo, Cuando se examina su texto, Entonces no contienen emoji ni símbolos-icono; quedan fuera de esta comprobación `catalogo.js` y `aspecto.js` (`INSIGNIAS`). Excepción aceptada: el resumen del historial (`textoResumen` de `historial.js`, p. ej. «Diana: 4,3 ★ (4 calificadas)») sigue mostrando el símbolo ★ como texto, porque esta feature no toca `historial.js` y las pruebas de la 006 lo fijan. **[auto]**
- [ ] **AC-7.5** Dado que `juego.js` ya no usa los emoji de `DATOS_ASPECTO`, `DATOS_ESPECIE` ni `INSIGNIAS`, Cuando se examina, Entonces no los importa ni los usa. **[auto]**
- [ ] **AC-7.6** Dada cada pantalla de la interfaz (barra, drawers, hoja de lugar, fichas, selectores, modales, avisos, botones y cruceta), Cuando se muestra, Entonces solo se ven colores de la paleta, con el texto legible sobre su fondo (los pares de FR-7). **[nav]**
- [ ] **AC-7.7** Dados los pares de color de texto y fondo de FR-7, Cuando se calcula su contraste con los valores de la paleta, Entonces cada par cumple al menos 4,5 a 1 (texto normal). **[auto]**
- [ ] **AC-7.8** Dados las etiquetas de nombre de los espacios y de los habitantes, el cartel «n fuera» y el resalte de quien juega en el mapa, Cuando se dibujan, Entonces sus colores son los de la paleta de FR-7 (y no `#2a221c`, `#f2ead3` ni `#ffd166`), con el mismo tamaño, posición y comportamiento que en la 010. **[nav]**
- [ ] **AC-7.9** Dados los colores del texto del mapa (etiqueta, cartel y resalte), Cuando se calcula el contraste de cada par con los valores de la paleta, Entonces cumple al menos 4,5 a 1. **[auto]**

### Story 8: Aspecto de marco de videojuego

**As a** persona que usa la interfaz
**I want** que paneles y botones tengan el aspecto de un juego
**So that** la interfaz y el mapa se sientan como un solo mundo

**Acceptance criteria:**

- [ ] **AC-8.1** Dados la barra, el drawer, la hoja de lugar, las fichas y los modales, Cuando se muestran, Entonces tienen esquinas cuadradas, un borde oscuro de 3 px y una sombra dura sin desenfoque, según FR-8. **[nav]**
- [ ] **AC-8.2** Dados los botones (salvo los de la cruceta, que conservan el aspecto sutil de la 010), Cuando se muestran, Entonces tienen borde oscuro y sombra dura, y al pulsarlos se hunden (sin sombra); activo, pulsado, desactivado y peligro se distinguen entre sí por los colores de la paleta. **[nav]**
- [ ] **AC-8.3** Dados los títulos de los drawers, el rótulo de las pestañas y el texto de los botones, Cuando se muestran, Entonces usan Silkscreen; los campos de texto, las listas, la ficha de actividad y el historial siguen con la fuente del sistema. Los chips y los círculos de responsable, aunque son botones, conservan la fuente del sistema. **[nav]**
- [ ] **AC-8.4** Dado un error de formulario, Cuando se muestra, Entonces usa el color de peligro de la paleta con contraste suficiente. **[nav]**
- [ ] **AC-8.5** Dados todos los controles que se tocan (botones, pestañas, chips, filas, estrellas y botones de la cruceta), Cuando se miden, Entonces su área táctil es la misma o mayor que la de la 010 (no se encogen). **[nav]**
- [ ] **AC-8.6** Dada cada pantalla, Cuando se compara su disposición con la de la 010, Entonces los controles están en el mismo orden y con las mismas funciones: solo cambia el aspecto. **[nav]**

### Story 9: Preparación una sola vez, respaldo y rendimiento

**As a** persona que abre el juego en el teléfono
**I want** que arranque rápido y que no se rompa si falta un dibujo
**So that** el juego siga fluido y usable

**Acceptance criteria:**

- [ ] **AC-9.1** Dado el arranque, Cuando se preparan los dibujos, Entonces cada icono y cada avatar se dibuja una sola vez y se reutiliza en todas las filas y pantallas, sin volver a dibujarse al cambiar de pestaña, abrir una ficha o refrescar las listas. **[nav]**
- [ ] **AC-9.2** Dado el arranque en el teléfono, Cuando se miden juntos la hoja de texturas del mapa y las imágenes de la interfaz, Entonces tardan menos de 300 ms (se mide y se registra) y la hoja de texturas sigue sin pasar de 4.096 px por lado. **[nav]**
- [ ] **AC-9.3** Dado un icono o un avatar que no se puede dibujar (por ejemplo, por un error al preparar la imagen), Cuando se muestra la interfaz, Entonces esta sigue funcionando y en su lugar se muestra el respaldo (el icono `actividad:otra` en actividades y el avatar `neutro` en habitantes), sin errores en la consola y sin romper el resto. **[nav]**
- [ ] **AC-9.4** Dado el hogar completo (8 familiares, 4 mascotas, 50 pendientes, 200 entradas y todos los espacios en desastre), Cuando se juega en el teléfono, Entonces el movimiento se mantiene a 60 cuadros por segundo o más y el indicador `regen` no empeora lo medido en la 010 (24,9 ms) y queda por debajo de 100 ms. **[nav]**
- [ ] **AC-9.5** Dada la interfaz sin colores ni imágenes preparados todavía, Cuando se abre la página, Entonces no se ve un instante de interfaz sin estilo: la barra y los paneles aparecen ya con sus colores. **[nav]**
- [ ] **AC-9.6** Dado un icono, un avatar o una estrella de la interfaz, Cuando se mantiene pulsado con el dedo o el ratón, Entonces el navegador no ofrece guardar, arrastrar ni seleccionar la imagen, y el toque llega al elemento que la contiene (la fila, el botón o la opción). **[nav]**

### Story 10: Lo demás sigue funcionando

**As a** persona que ya usa el juego
**I want** que todo lo que funcionaba siga igual
**So that** el cambio de aspecto no me cueste nada

**Acceptance criteria:**

- [ ] **AC-10.1** Dado el hogar de la 010 guardado, Cuando se abre con esta versión, Entonces se carga sin avisos ni errores, con el mismo mundo y el mismo estado, y el formato guardado es `version: 7`. **[auto]**
- [ ] **AC-10.2** Dadas las pruebas de las features 001 a 010 (431), Cuando se ejecutan, Entonces pasan todas con solo estos ajustes: la prueba AC-1.1 de `secciones` (la clave del icono en lugar del emoji) y las de `resumenDeFicha` (sin el prefijo de fecha); el contrato de `INSIGNIAS` y los emoji de `catalogo.js` no cambian. **[auto]**
- [ ] **AC-10.3** Dado el uso completo del juego (jugar, cambiar de jugador, editar espacios, familia, actividades, rutinas, intercambios y calificaciones), Cuando se hace con la interfaz nueva, Entonces cada acción funciona como en la 010. **[nav]**
- [ ] **AC-10.4** Dados el mundo, los personajes, los estados de limpieza, las etiquetas de nombre, el resalte de quien juega y el cartel «n fuera», Cuando se comparan con los de la 010, Entonces se ven y funcionan igual, salvo los cambios de las historias 4 y 7. **[nav]**

## Functional Requirements

### FR-1: El juego de 19 iconos

Los iconos son cuadrículas de 16×16 con claves de la paleta única, a color y con contorno oscuro. Sus claves son estas 19 (una sola lista, la fuente de la que parten las pruebas de cobertura):

| Grupo | Claves | Cantidad |
|---|---|---|
| Pestañas | `pestana:espacios`, `pestana:familia`, `pestana:actividades`, `pestana:intercambios` | 4 |
| Actividades | `actividad:platos`, `actividad:barrer`, `actividad:ropa`, `actividad:basura`, `actividad:limpiar`, `actividad:compras`, `actividad:plantas`, `actividad:mascota`, `actividad:otra` | 9 |
| Estados de limpieza | `estado:limpio`, `estado:desordenado`, `estado:desastre` | 3 |
| Estrellas | `estrella:llena`, `estrella:vacia` | 2 |
| Fecha | `fecha` | 1 |

**Must:**
- Cada clave de `ICONOS` de `catalogo.js` tiene su `actividad:<clave>`; una clave desconocida cae en `actividad:otra`.
- Los iconos se definen como datos puros, sin Phaser ni DOM, y ni el dominio ni el generador los importan.
- Son los mismos dibujos para la interfaz HTML y para el mapa; no hay una segunda versión por lugar de uso.

**Must not:**
- No usar emoji, caracteres de símbolo ni arte importado como icono.
- No añadir iconos fuera de esta lista.

### FR-2: Tamaños de los iconos

Los iconos se muestran sin suavizado y a un tamaño entero múltiplo de 16 px:

| Lugar | Tamaño |
|---|---|
| Pestañas de la barra, filas de listas (actividades, historial, Familia), botón de icono de las fichas, estrellas, opciones del selector de aspecto y especie | ×2 (32 px) |
| Opciones del selector de iconos de actividad | ×3 (48 px) |
| Chips de sugerencias, icono de fecha de la línea-resumen | ×1 (16 px) |
| Burbujas e iconos de estado del mapa | 16 px en pantalla, sin importar el zoom |

**Must:**
- Mantener la proporción y los bordes nítidos (sin difuminar) a cualquier tamaño.

**Must not:**
- No usar tamaños no enteros para los iconos de la interfaz HTML.

### FR-3: Avatar de un miembro

El avatar de un familiar o una mascota es el cuadro de frente en reposo (vista `frente`, cuadro 0) del personaje que devuelve `personajeDe` para él.

**Must:**
- Usar la misma regla que el personaje del mapa, sin depender del nombre, del id ni de la posición.
- Dibujarse desde las cuadrículas de los personajes por el mismo camino que los demás iconos de la interfaz, sin leer las texturas del mapa.
- Mostrarse en la lista de Familia, en el selector de aspecto y especie, y en el botón de icono de la ficha de un habitante.

**Must not:**
- No aparecer en los círculos de responsable, «¿Quién juega?», los intercambios ni el historial.

### FR-4: Burbujas e insignias del mapa

**Must:**
- La burbuja de un lugar muestra el icono de la actividad más atrasada (criterio de la 003) y, si hay más, un «+» en texto, con la misma ubicación, profundidad y área táctil de hoy.
- La insignia de estado de cada espacio con etiqueta es el icono de su estado, pegado a la derecha de la etiqueta, con la misma ubicación y profundidad de hoy.
- Los iconos del mapa se preparan en la misma hoja de texturas del mundo (que sigue con 64 columnas y sin pasar de 4.096 px por lado).

**Must not:**
- No cambiar qué lugar tiene burbuja ni qué espacio tiene insignia, ni el estado que se muestra.
- No usar emoji ni cuadros de texto de color para burbujas e insignias.

### FR-5: Símbolos de texto convertidos en iconos

**Must:**
- Las pestañas de la barra usan los iconos `pestana:*`; `SECCIONES` guarda en cada una la clave de su icono y no un emoji.
- La línea-resumen de la ficha de actividad (`resumenDeFicha`) devuelve solo el texto («<fecha> · <recurrencia> · <lugares>») sin prefijo; la presentación dibuja `fecha` antes de él.
- Las estrellas del historial usan `estrella:llena` y `estrella:vacia`; la cruceta conserva los símbolos de texto ▲ ◀ ▶ ▼ en sus botones (decisión del 2026-10-11: una imagen se puede seleccionar y descargar al mantenerla pulsada).

**Must not:**
- No cambiar los textos de fecha, recurrencia y lugares, ni las reglas de las estrellas.

### FR-6: Preparación, respaldo y errores

**Must:**
- Preparar cada icono y cada avatar una sola vez al arrancar y reutilizarlo en cada pantalla.
- Que las imágenes de la interfaz no sean seleccionables, arrastrables ni ofrezcan guardarse al mantenerlas pulsadas, y que el toque pase a su contenedor (AC-9.6).
- Si una imagen no se puede preparar, mostrar el respaldo (`actividad:otra` en actividades, el avatar `neutro` en habitantes) o, si ni eso es posible, nada, sin lanzar errores.
- Que la interfaz no se vea sin estilo mientras se preparan los colores y las imágenes. Si el módulo no llega a cargar, a los 4 segundos la página se muestra de todos modos (sin colores ni imágenes de la paleta) en lugar de quedar oculta.

**Must not:**
- No bloquear el arranque del juego por esperar a un dibujo, más allá de lo que ya espera por la fuente (hasta 1 s).
- No guardar nada nuevo en el hogar ni en la posición.

### FR-7: Colores de la interfaz

Toda la interfaz HTML usa variables de color derivadas de la paleta, una por clave. La asignación de roles (la de las muestras del brainstorm, dirección B) es esta:

| Rol | Clave de la paleta | Color |
|---|---|---|
| Fondo de la página y bordes, sombras duras y líneas de separación | `k` | `#2e2233` |
| Barra inferior | `k` | `#2e2233` |
| Texto de la barra | `z` | `#eadfcf` |
| Pestaña abierta (fondo) | `e` | `#d9a066` |
| Texto de la pestaña abierta | `k` | `#2e2233` |
| Paneles: drawer, hoja, fichas y modales (fondo) | `j` | `#f4f1ea` |
| Texto sobre los paneles | `k` | `#2e2233` |
| Botón principal (fondo y texto) | `i` y `j` | `#3f5fb0` y `#f4f1ea` |
| Botones secundarios, chips y filas tocables (fondo) | `z` | `#eadfcf` |
| Peligro y errores | `q` | `#c0392b` |
| Texto de peligro sobre su botón | `j` | `#f4f1ea` |
| Velo de los modales | `k` con alfa | `#2e2233` al 55 % |
| Campos de texto (fondo y borde) | `j` y `k` | `#f4f1ea` y `#2e2233` |
| Texto del indicador de depuración | `p` | `#8bc27d` |
| Separadores de fila (líneas finas entre filas de listas) | `A` | `#d4c3a8` |
| Botones de la cruceta (fondo y símbolo) | `z` con alfa 0,85 y `k` | `#eadfcf` al 85 % y `#2e2233` |
| Etiquetas de nombre del mapa (fondo y texto) | `z` y `k` | `#eadfcf` y `#2e2233` |
| Cartel «n fuera» (fondo y texto) | `k` y `j` | `#2e2233` y `#f4f1ea` |
| Resalte de la etiqueta de quien juega | `r` | `#f2c14e` |

**Must:**
- Que el texto de cada par de la tabla tenga un contraste de al menos 4,5 a 1 sobre su fondo (AC-7.7); si un par no lo cumple, se elige otra clave de la paleta para ese rol y se corrige esta tabla.
- Que la transparencia de un color solo exista como una variable de la paleta con alfa (la propiedad `opacity`, que atenúa el texto secundario y los controles desactivados, y el valor `transparent`, que quita un fondo, no son colores propios y se permiten); el fondo de los botones de la cruceta es la clave `z` con alfa 0,85 (variable `--cruceta-fondo`), como en la 010, y su símbolo es `k`.
- Que `index.html` solo use esas variables para colorear (fondo, texto, borde, sombra y relleno).

**Must not:**
- No dejar colores propios en el CSS (el blanco, el negro, el marrón y el crema de hoy desaparecen).
- No cambiar los colores de los miembros (marcadores y círculos de responsable): vienen del dominio y de las features 002 y 009. Tampoco los del mundo ni los de los personajes.

### FR-8: Marco de videojuego

**Must:**
- Esquinas cuadradas (sin redondeo) en barra, drawer, hoja, fichas, modales, botones, chips, selectores y campos. Excepción: los botones de la cruceta conservan su aspecto de la 010 (esquinas redondeadas de 8 px, sin borde grueso ni sombra dura y sin hundirse), por ser sutil sobre el mapa.
- Borde oscuro de 3 px en paneles y de 2 px en botones, chips y campos, y sombra dura (sin desenfoque) de 3 px en paneles y de 2 px en botones.
- Botones con relieve: sombra dura en reposo y sin sombra, desplazados, al pulsarlos.
- Silkscreen en títulos de drawers, rótulos de pestañas y texto de botones; los campos de texto, las listas, la ficha de actividad y el historial siguen con la fuente del sistema. Los chips (sugerencias y lugares) y los círculos de responsable también conservan la fuente del sistema, aunque sean botones, porque llevan texto del usuario (nombres de actividades, lugares y personas).
- Conservar disposición, tamaños de área táctil y comportamiento de cada control.

**Must not:**
- No redondear esquinas, ni usar degradados, desenfoques ni sombras suaves.
- No cambiar el tamaño de la letra del mapa (12 px) ni el texto de las pantallas.

## Non-Functional Requirements

### Performance

- El movimiento se mantiene a 60 cuadros por segundo o más con el hogar completo.
- El redibujo del mundo y el de edición no empeoran lo medido en la 010 (`regen` de 24,9 ms en el teléfono) y quedan por debajo de 100 ms con la carga completa.
- Preparar todos los dibujos al arrancar (hoja de texturas e imágenes de la interfaz) tarda menos de 300 ms en el teléfono; se mide y se registra.
- Las listas de 50 filas de actividades y de 200 del historial se desplazan sin tirones con el icono de cada fila.

### Security

- No aplica: no hay cuentas, red ni datos nuevos. No se carga arte, fuentes ni imágenes de otra procedencia que los archivos del proyecto y los dibujos hechos en código.

### Reliability

- Los hogares guardados de cualquier versión anterior (hasta `version: 7`) se abren sin avisos y sin cambios.
- La falta de un dibujo no rompe la interfaz (FR-6).
- Las funciones nuevas de datos (iconos, avatares, variables de color) son puras y deterministas: la misma entrada da el mismo resultado y no modifican el modelo.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Una actividad guardada tiene una clave de icono desconocida | Se muestra el icono `actividad:otra`; el valor guardado no se toca |
| Un miembro tiene un aspecto o una especie fuera de las listas | Su avatar es el del personaje de respaldo que da `personajeDe` (`neutro` o `otro`) |
| Falla la preparación de una imagen (por ejemplo, el lienzo no está disponible) | La interfaz sigue funcionando y muestra el respaldo o nada en ese lugar; sin errores en la consola |
| Falla la fuente Silkscreen | Se usa la del sistema, como en la 008; el resto de la interfaz no cambia |
| Se abre la página antes de preparar colores e imágenes | No se ve la interfaz sin estilo; los paneles aparecen ya con sus colores |
| Un par de colores de FR-7 no alcanza el contraste mínimo | La prueba de contraste (AC-7.7) falla y se corrige el rol antes de implementar |
| Una prueba anterior fijaba un emoji (la AC-1.1 de `secciones`, `resumenDeFicha`) | Se ajusta solo esa prueba; `INSIGNIAS` y `catalogo.js` no se tocan |

## Open Questions

- Ninguna. La pregunta sobre el texto del mapa (etiquetas, cartel y resalte) se resolvió el 2026-10-10: pasan también a colores de la paleta, como fija FR-7.

## Out of Scope (Future Considerations)

- Iconos monocromos o que hereden el color del texto, modo oscuro, temas y ajustes de arte desde la aplicación.
- Redibujar el mundo, los personajes o los estados de limpieza; nuevos muebles o habitantes.
- Animaciones, sonido y vibración.
- Cambios de disposición, de flujo o de textos de las pantallas; nuevos controles.
- Avatares en los círculos de responsable, «¿Quién juega?», los intercambios y el historial.
- Más iconos de actividad o iconos por sugerencia.
- Limpiar los emoji de `catalogo.js` y `INSIGNIAS` del dominio.
- Arte importado, paquetes de iconos de terceros y una galería o herramienta de arte.
