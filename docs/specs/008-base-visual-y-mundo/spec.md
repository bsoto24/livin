# Feature 008: Base visual y mundo

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-09
**Branch:** `feat/008-base-visual-y-mundo`
**Source:** [prd.md](prd.md) · [ADR el arte como cuadrículas de texto con paleta compartida](../../adr/008-arte-cuadriculas-con-paleta.md) · se apoya en la [spec 001](../001-mapa-editor-hogar/spec.md) (v1.1.0), la [spec 003](../003-actividades/spec.md) (v1.0.0), la [spec 004](../004-rutinas/spec.md) (v1.0.0), la [spec 005](../005-jugador-activo-e-intercambios/spec.md) (v1.0.0) y la [spec 007](../007-menu-y-formularios-simples/spec.md) (v1.0.0)

---

## Problem Statement

Livin quiere ser un videojuego 2D de vista cenital estilo GBA, pero hoy el mapa se ve como un plano de colores: cada tipo de espacio es un color liso, el mobiliario son cuadrados de color sin forma reconocible, todas las paredes son iguales y la letra es la del sistema. En el teléfono el hogar se entiende por las etiquetas y no por su aspecto, y el juego no transmite la identidad de "casa de videojuego" que dice la fundación del proyecto. Esta feature, la primera de tres para dar arte al juego, fija la línea gráfica común (pixel art clásico de GBA) y dibuja el mundo: una paleta única de 32 colores, una tipografía pixel, un suelo con textura para cada tipo de espacio, paredes que se ven de frente o desde arriba y las 17 piezas de mobiliario con forma reconocible. No cambia ninguna regla del juego.

## Goals

- Una **paleta única de 32 colores** en 11 familias, compartida con las dos features de arte siguientes; ningún dibujo usa un color fuera de ella.
- **Nueve texturas de suelo** (los ocho tipos de espacio y el pasillo) que permiten reconocer cada espacio de un vistazo.
- **Paredes de dos vistas**, de frente y desde arriba, elegidas por lo que hay debajo de cada casilla de pared.
- Las **17 piezas de mobiliario actuales** redibujadas con forma reconocible y contorno oscuro; las que ocupan varias casillas se ven como un solo objeto.
- Una **tipografía pixel (Silkscreen)** en el mapa, la barra inferior y los títulos de los drawers, guardada con el juego para funcionar sin conexión; los formularios y las listas siguen con la fuente del sistema.
- Que el arte sea **independiente de las reglas**: la elección del arte de cada casilla se calcula solo a partir de la distribución, se prueba sin interfaz gráfica y no cambia colisiones, formato guardado ni comportamiento.
- Que el movimiento siga a 60 cuadros por segundo y el redibujo en modo edición tarde menos de 100 ms.

## Non-Goals

- No hay personajes ni mascotas con sprites o animación de caminar: siguen siendo rectángulos de color (feature 009).
- No se dibujan los estados de limpieza con arte nuevo: los objetos del suelo siguen siendo cuadrados de color, y las insignias, las burbujas con emoji y los colores de la interfaz HTML (barra, drawers, fichas) no cambian (feature 010). En la barra y en los títulos de los drawers cambia solo la letra, no los colores.
- No se añaden muebles, espacios ni decoración que no bloquea (alfombras, ventanas, cuadros), y no cambia ninguna pieza ni regla de la distribución.
- No cambian el formato guardado, las migraciones ni las reglas del modelo.
- No hay modo oscuro, temas intercambiables ni ajustes de arte desde la aplicación.
- No se usa arte importado: ni PNG propios, ni hojas de sprites, ni paquetes de terceros.
- No se crea una herramienta ni una vista previa para dibujar el arte.

## Users and Context

**Primary users:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, igual que en las features 001 a 007.
**Secondary users:** quienes en el futuro tendrán su propio dispositivo; esta feature no implementa nada de eso.
**Usage context:** sesiones cortas en un teléfono Android en vertical, y un navegador de escritorio para probar. Quien juega quiere reconocer cada habitación del hogar de un vistazo al caminar y al editar, sin leer las etiquetas.
**User mental model:** el mismo de las features 001 a 007 (vista desde arriba, espacios, habitantes, modo edición y exploración). Vocabulario nuevo: "paleta" (el conjunto cerrado de 32 colores que usa todo el arte); "textura de suelo" (el dibujo de 16×16 píxeles que cubre una casilla de piso, uno por tipo de espacio); "pared de frente" y "pared desde arriba" (las dos vistas de una casilla de pared); "variante" (la versión de un dibujo de mueble según sus casillas vecinas de la misma pieza, para que las piezas de varias casillas se vean como un objeto); "casilla" (un cuadro del mapa de 16×16 píxeles, como en la 001).

**Hoja de ruta (tres features independientes):** 008 base visual y mundo (esta); 009 habitantes animados (caminar en cuatro direcciones, siete aspectos y seis especies); 010 estados e iconos (limpio, desordenado y desastre dibujados, juego de iconos y recolor de la interfaz HTML). La 008 deja la paleta y las convenciones listas para las otras dos.

**Relación con las specs anteriores.** Esta feature reemplaza únicamente el aspecto de lo que dibujan la 001, la 003 y la 007:

- **Spec 001:** las casillas de piso, de pared y de mobiliario dejan de ser rectángulos lisos y pasan a ser dibujos de 16×16 píxeles. Siguen vigentes sin cambios la distribución, las colisiones, las puertas, la casilla de aparición y las etiquetas de nombre (FR-12, salvo el tipo de letra).
- **Spec 003:** los objetos del suelo según el estado de limpieza (FR-5) siguen igual y se dibujan encima del suelo nuevo.
- **Spec 004:** el cartel junto a la entrada (FR-5) cambia solo de letra.
- **Spec 005:** la etiqueta de quien juega sigue resaltada con un fondo de color (AC-2.8); el texto cambia de letra.
- **Spec 007:** la barra inferior y los títulos de los drawers cambian de letra; los colores y la estructura de la interfaz no cambian.

El resto de las specs 001 a 007 sigue vigente sin cambios.

## User Stories

### Story 1: Una paleta única para todo el arte

**As a** persona que ve el hogar en el mapa
**I want** que todo se dibuje con los mismos colores
**So that** el juego se vea como un solo mundo y las features de arte siguientes encajen sin desentonar

**Acceptance criteria:**

- [ ] **AC-1.1** Dada la paleta, Cuando se lista, Entonces tiene exactamente 32 colores en 11 familias, cada uno con un identificador único y un valor de color distinto del de los demás.
- [ ] **AC-1.2** Dado cualquier dibujo de suelo, de pared o de mueble, Cuando se examinan sus píxeles, Entonces cada píxel es transparente o es un color de la paleta, y ninguno usa un color que no esté en ella.
- [ ] **AC-1.3** Dado cualquier dibujo de suelo, de pared o de mueble, Cuando se mide, Entonces tiene exactamente 16 píxeles de ancho y 16 de alto.
- [ ] **AC-1.4** Dado cualquier dibujo de suelo o de pared, Cuando se examinan sus píxeles, Entonces ninguno es transparente.
- [ ] **AC-1.5** Dado el juego en marcha, Cuando se muestra el mapa, Entonces los colores que se ven en el suelo, las paredes y el mobiliario son los de la paleta, sin los colores lisos de la versión anterior.

### Story 2: Cada espacio se reconoce por su suelo

**As a** persona que camina por el hogar
**I want** que cada tipo de espacio tenga su propio suelo
**So that** sepa en qué habitación estoy sin leer su etiqueta

**Acceptance criteria:**

- [ ] **AC-2.1** Dado el catálogo de tipos de espacio, Cuando se pide el suelo de cada uno de los ocho tipos y el del pasillo, Entonces existe uno para cada uno, nueve en total, y no hay dos con el mismo dibujo.
- [ ] **AC-2.2** Dado un hogar, Cuando se muestra el mapa, Entonces cada casilla que no es pared ni vacío muestra el suelo del tipo del espacio al que pertenece según la distribución de la 001, incluidas la casilla de aparición y las casillas de puerta.
- [ ] **AC-2.3** Dado un dormitorio u oficina con baño interno, Cuando se muestra el mapa, Entonces las casillas del baño interno muestran el suelo de baño y las demás casillas del cuarto muestran el suelo del cuarto.
- [ ] **AC-2.4** Dada la entrada del hogar (la casilla de la pared inferior de la sala, según la 004), Cuando se muestra el mapa, Entonces se dibuja con el suelo de la sala.
- [ ] **AC-2.5** Dada la sala con el comedor encima (sin pared entre ellos), Cuando se muestra el mapa, Entonces el suelo cambia de comedor a sala en el límite exacto entre ambos espacios.
- [ ] **AC-2.6** Dado un espacio que se renombra o se renumera, Cuando se muestra el mapa, Entonces su suelo no cambia: depende del tipo y no del nombre.
- [ ] **AC-2.7** Dada una casilla de suelo repetida varias veces en cualquier dirección, Cuando se muestra el mapa en el teléfono, Entonces no se ve ninguna costura entre casillas contiguas del mismo suelo. *(verificación manual)*
- [ ] **AC-2.8** Dado un hogar completo en el teléfono, Cuando se recorre, Entonces cada espacio se reconoce por su suelo sin leer su etiqueta. *(verificación manual)*

### Story 3: Las paredes se ven de frente o desde arriba

**As a** persona que mira el mapa
**I want** que las paredes se vean como paredes y no como un bloque de color
**So that** se distingan de un vistazo el suelo, las habitaciones y las puertas

**Acceptance criteria:**

- [ ] **AC-3.1** Dada una casilla de pared con una casilla justo debajo que existe y no es pared ni vacío, Cuando se elige su dibujo, Entonces es la pared de frente.
- [ ] **AC-3.2** Dada una casilla de pared cuya casilla de debajo es pared, es vacío o queda fuera del mapa, Cuando se elige su dibujo, Entonces es la pared desde arriba.
- [ ] **AC-3.3** Dada una casilla de pared sobre una puerta (casilla transitable dentro de una pared), Cuando se elige su dibujo, Entonces es la pared de frente, porque la casilla de debajo no es pared.
- [ ] **AC-3.4** Dada una puerta, Cuando se muestra el mapa, Entonces se dibuja con el suelo del espacio o pasillo al que pertenece según la distribución, no como pared.
- [ ] **AC-3.5** Dado un baño interno con su tabique, Cuando se elige el dibujo de cada casilla del tabique, Entonces se aplica la misma regla que a las demás paredes (AC-3.1 y AC-3.2).
- [ ] **AC-3.6** Dada la pared inferior de la sala y de las demás piezas, Cuando se elige su dibujo, Entonces es la pared desde arriba, porque debajo hay vacío o fuera del mapa, salvo la entrada, que es un suelo (AC-2.4).
- [ ] **AC-3.7** Dado cualquiera de los 7.560 mapas permitidos, Cuando se elige el dibujo de cada casilla de pared, Entonces recibe exactamente una de las dos vistas, ninguna casilla de pared queda sin dibujo y ninguna casilla que no es pared recibe una pared.
- [ ] **AC-3.8** Dada la vista elegida para una pared, Cuando se camina por el hogar, Entonces las casillas por las que se puede pasar son las mismas que antes de esta feature: la vista de una pared no cambia ninguna colisión.
- [ ] **AC-3.9** Dado el mapa en el teléfono, Cuando se mira, Entonces las paredes se distinguen del suelo de un vistazo y la pared de frente se distingue de la pared desde arriba. *(verificación manual)*

### Story 4: El mobiliario tiene forma reconocible

**As a** persona que mira una habitación
**I want** que cada mueble parezca lo que es
**So that** reconozca la cama, el sofá, la cocina o el inodoro sin leer nada

**Acceptance criteria:**

- [ ] **AC-4.1** Dada la leyenda del mobiliario de la 001 (17 piezas), Cuando se pide el dibujo de cada una, Entonces existe uno para cada una y no hay dos piezas distintas con el mismo dibujo base.
- [ ] **AC-4.2** Dado un mueble de una sola casilla (velador, silla de comedor, cocina, refrigeradora, lavadero, inodoro, lavamanos, ducha, silla de escritorio, cama de mascota y plato), Cuando se muestra el mapa, Entonces se dibuja completo en su casilla; y cada silla de un juego de comedor se dibuja igual y por separado, aunque estén en casillas contiguas.
- [ ] **AC-4.3** Dado un mueble que ocupa varias casillas contiguas como un solo objeto (sofá, mesa de centro, mesa de comedor, cama, escritorio y lavadora), Cuando se muestra el mapa, Entonces se ve como un solo objeto: el dibujo de las casillas de los extremos cierra el contorno hacia afuera y el de las casillas del medio continúa hacia las vecinas.
- [ ] **AC-4.4** Dada cualquier combinación de casillas vecinas de la misma pieza que aparezca en alguno de los 7.560 mapas permitidos para un mueble de varias casillas (AC-4.3), Cuando se elige su dibujo, Entonces existe un dibujo para esa combinación; y ninguna casilla de mobiliario de ninguna pieza queda sin dibujo.
- [ ] **AC-4.5** Dada una casilla con mueble, Cuando se muestra el mapa, Entonces se ve el suelo del espacio al que pertenece (AC-2.2) y encima el mueble, de modo que el suelo se ve a través de los píxeles transparentes del dibujo del mueble.
- [ ] **AC-4.6** Dado un mueble dentro de un baño interno, Cuando se muestra el mapa, Entonces el suelo que se ve debajo es el de baño (AC-2.3).
- [ ] **AC-4.7** Dado el mobiliario, Cuando se camina por el hogar, Entonces bloquea las mismas casillas que antes de esta feature: ninguna casilla cambia de transitable a no transitable ni al revés.
- [ ] **AC-4.8** Dado un hogar completo visto en el teléfono en modo edición, Cuando se mira, Entonces los muebles se reconocen entre sí y se distinguen del suelo. *(verificación manual)*

### Story 5: Lo que ya existía sobre el mapa sigue funcionando igual

**As a** persona que ya usa el juego
**I want** que el nuevo aspecto no cambie cómo funciona
**So that** pueda seguir jugando sin aprender nada

**Acceptance criteria:**

- [ ] **AC-5.1** Dado un espacio con actividades atrasadas, Cuando se muestra el mapa, Entonces los objetos del suelo del estado desordenado o desastre (003) se siguen dibujando encima del suelo y del mobiliario nuevos, por debajo de los personajes, y se redibujan al cambiar las actividades o el día.
- [ ] **AC-5.2** Dado el mapa, Cuando se muestra, Entonces los habitantes, sus etiquetas, las etiquetas y las insignias de los espacios, las burbujas y el cartel de la entrada se dibujan en las mismas posiciones y en el mismo orden de capas que antes de esta feature, por encima del suelo, las paredes y el mobiliario.
- [ ] **AC-5.3** Dado el mapa en cualquier modo, Cuando el usuario toca una casilla, Entonces responde la misma casilla y con las mismas reglas de prioridad que antes de esta feature.
- [ ] **AC-5.4** Dado un hogar, Cuando se genera la distribución, Entonces es idéntica a la de antes de esta feature (mismas casillas, mismas puertas, misma aparición y entrada): el arte no cambia el generador.
- [ ] **AC-5.5** Dados los habitantes, Cuando se muestran, Entonces siguen siendo rectángulos de color como hasta ahora.

### Story 6: La letra pixel en el mapa

**As a** persona que mira el mapa
**I want** que los nombres y los avisos se vean con una letra pixel
**So that** el texto encaje con el estilo del juego

**Acceptance criteria:**

- [ ] **AC-6.1** Dado el mapa, Cuando se muestran las etiquetas de nombre de los espacios, las de los habitantes y la de quien juega, Entonces se dibujan con la tipografía Silkscreen.
- [ ] **AC-6.2** Dado el mapa, Cuando se muestran las insignias de estado de los espacios y el cartel junto a la entrada, Entonces su texto se dibuja con la tipografía Silkscreen.
- [ ] **AC-6.3** Dada la etiqueta de quien juega, Cuando se muestra el mapa, Entonces sigue resaltada con un fondo de color que no tienen las demás etiquetas (AC-2.8 de la 005); no se exige que además esté en negrita.
- [ ] **AC-6.4** Dado un nombre guardado (de un espacio, un miembro o una actividad), Cuando se muestra con la letra pixel, Entonces el dato guardado no cambia: la tipografía solo cambia cómo se ve y, si la fuente dibuja las minúsculas como mayúsculas, el nombre se muestra así sin alterar el dato.
- [ ] **AC-6.5** Dado un texto con una letra o un símbolo que Silkscreen no tiene, Cuando se muestra en el mapa, Entonces esa letra o símbolo se dibuja con la fuente del sistema y el resto del texto no se corta ni deja huecos o cuadros vacíos.
- [ ] **AC-6.6** Dados los textos "Lavandería", "Baño", "Niño", "Hámster" y "Cocina 2", Cuando se muestran en el mapa, Entonces las tildes y la ñ se leen sin ambigüedad. *(verificación manual)*
- [ ] **AC-6.7** Dado el mapa en cualquier modo y a cualquier zoom, Cuando se muestran las etiquetas, Entonces su tamaño en pantalla es constante, como en la 001 (AC-9.1).
- [ ] **AC-6.8** Dado el mapa, Cuando se muestran las burbujas de actividades con su icono, Entonces siguen con el aspecto de hoy (emoji del sistema).

### Story 7: La letra pixel en la barra y los títulos; el sistema en los formularios

**As a** persona que usa los menús
**I want** que la barra y los títulos tengan la letra del juego y que lo que escribo se lea bien
**So that** el menú encaje con el juego sin dificultar los formularios

**Acceptance criteria:**

- [ ] **AC-7.1** Dada la barra inferior, Cuando se muestra, Entonces el texto de sus cuatro pestañas se dibuja con la tipografía Silkscreen.
- [ ] **AC-7.2** Dada una pantalla de 360 píxeles de ancho en vertical, Cuando se muestra la barra con las cuatro pestañas y la pestaña "Intercambios (n)" con n hasta 20, Entonces el texto de cada pestaña cabe dentro de ella, sin cortarse ni invadir a la vecina. *(verificación manual)*
- [ ] **AC-7.3** Dado un drawer abierto, Cuando se muestra, Entonces el título de su sección se dibuja con la tipografía Silkscreen.
- [ ] **AC-7.4** Dados los campos de texto, las listas, los chips, la ficha de actividad, las fichas de familiar y mascota, las hojas, el historial y los selectores, Cuando se muestran, Entonces siguen con la fuente del sistema, igual que antes de esta feature.
- [ ] **AC-7.5** Dados los colores y la estructura de la barra, los drawers y las fichas, Cuando se comparan con los de antes de esta feature, Entonces son los mismos: solo cambia la letra de la barra y de los títulos.

### Story 8: La letra funciona sin conexión y sin fallar

**As a** persona que juega sin internet
**I want** que la letra del juego esté siempre disponible
**So that** el juego se vea igual en cualquier momento y nunca falle por una fuente

**Acceptance criteria:**

- [ ] **AC-8.1** Dado el juego abierto, Cuando se inspecciona la actividad de red, Entonces no se pide ninguna fuente a un dominio externo: la tipografía se sirve con el propio juego. *(verificación manual)*
- [ ] **AC-8.2** Dada la apertura del juego, Cuando se muestra el mapa por primera vez, Entonces las etiquetas y la barra ya se ven con Silkscreen, sin que aparezcan primero con la fuente del sistema y cambien después. *(verificación manual)*
- [ ] **AC-8.3** Dado que la fuente tarda más de un segundo en estar disponible o no puede cargarse, Cuando se abre el juego, Entonces el mapa y la barra se muestran con la fuente del sistema, sin error visible y sin pantalla en blanco.
- [ ] **AC-8.4** Dado el repositorio, Cuando se busca junto al archivo de la fuente, Entonces hay un registro de su licencia (SIL Open Font License) y de su origen.

### Story 9: El mapa se ve nítido y se redibuja rápido

**As a** persona que edita el hogar
**I want** que el mapa nuevo se vea nítido y responda al instante
**So that** el arte no haga el juego más lento ni borroso

**Acceptance criteria:**

- [ ] **AC-9.1** Dado el mapa en modo exploración y en modo edición, Cuando se muestra a cualquier zoom, Entonces los píxeles se ven nítidos y sin suavizado. *(verificación manual)*
- [ ] **AC-9.2** Dado el modo edición con el hogar de mayor tamaño permitido y la carga completa (8 familiares, 4 mascotas, 50 actividades pendientes y 200 entradas en el historial), Cuando el usuario cambia los contadores de espacios o renombra uno, Entonces el mapa con el arte nuevo se muestra en menos de 100 ms.
- [ ] **AC-9.3** Dado el modo edición, Cuando se agrega un espacio, Entonces sus casillas muestran el suelo y el mobiliario de su tipo; y Cuando se elimina un espacio, Entonces ninguna casilla conserva arte de la distribución anterior.
- [ ] **AC-9.4** Dado un mismo hogar, Cuando se calcula dos veces el arte de cada casilla, Entonces el resultado es idéntico.
- [ ] **AC-9.5** Dado el arranque del juego, Cuando se preparan todos los dibujos, Entonces tarda menos de 300 ms en el dispositivo de referencia; el tiempo medido se registra.
- [ ] **AC-9.6** Dado el hogar completo en el teléfono, Cuando los personajes caminan, Entonces el movimiento se mantiene a 60 cuadros por segundo o más.

### Story 10: Conservar mi hogar

**As a** persona con un hogar ya guardado
**I want** que mi hogar se abra igual con el arte nuevo
**So that** no pierda nada por el cambio de aspecto

**Acceptance criteria:**

- [ ] **AC-10.1** Dado un hogar guardado en cualquier versión de la 1 a la 7, Cuando se abre el juego, Entonces se abre sin error ni aviso nuevo y se muestra con el arte nuevo.
- [ ] **AC-10.2** Dado un hogar abierto y guardado, Cuando se compara el documento guardado con el de antes de esta feature, Entonces es idéntico: no se agrega, quita ni cambia ningún campo ni la versión.
- [ ] **AC-10.3** Dada la posición guardada de quien juega, Cuando se abre el juego, Entonces es válida y se coloca en el mismo sitio que antes.
- [ ] **AC-10.4** Dadas las pruebas automáticas de las features 001 a 007, Cuando se ejecutan después de esta feature, Entonces pasan todas sin cambios en sus expectativas (346 pruebas al iniciar la 008).

## Functional Requirements

### FR-1: Paleta única

La paleta es el conjunto cerrado de colores del que sale todo el arte del juego. Las features 009 y 010 la reutilizan y pueden ampliarla, no sustituirla.

**Must:**
- Definir la paleta en un único lugar, con estos 32 colores en 11 familias (el valor es el color en hexadecimal):

| Familia | Colores |
|---|---|
| Contorno y pared (4) | contorno `#2e2233`, pared oscura `#4f4260`, pared media `#7a6a8c`, pared clara `#a799b8` |
| Madera (3) | oscura `#b87f48`, media `#d9a066`, clara `#ecc99a` |
| Azul (3) | oscuro `#3f5fb0`, medio `#5b7fd6`, claro `#8fb0f0` |
| Rosa (4) | fuerte `#d4537e`, claro `#e888a8`, pálido `#e9d6dc`, pálido oscuro `#dcc0c9` |
| Verde (2) | medio `#5fa05a`, claro `#8bc27d` |
| Neutros (4) | hueso `#f4f1ea`, hueso oscuro `#cfc8b8`, gris azulado `#9aa5ad`, gris claro `#c4ccd1` |
| Azulejo (2) | claro `#cfe3ea`, oscuro `#a9c9d6` |
| Lavanda (2) | clara `#dcd8ea`, oscura `#bdb7d6` |
| Arena y piedra (4) | arena `#eadfcf`, arena oscura `#d4c3a8`, piedra `#d6d1c4`, piedra oscura `#b9b3a3` |
| Verde grisáceo (2) | claro `#dde3d6`, oscuro `#c3ccba` |
| Acento (2) | rojo `#c0392b`, amarillo `#f2c14e` |

- Hacer que cada dibujo sea una cuadrícula de 16×16 píxeles donde cada píxel es transparente o un color de la paleta (ADR-008).
- Dejar el arte como datos que no dependen del motor gráfico ni del navegador, de modo que se puedan validar sin ellos.

**Must not:**
- Usar en el arte un color que no esté en la paleta.
- Guardar el arte ni la paleta en el documento del hogar.

### FR-2: Suelos

**Must:**
- Dar a cada tipo de espacio (sala, comedor, cocina, baño, lavandería, espacio de mascota, dormitorio y oficina) y al pasillo un suelo propio de 16×16 píxeles, sin píxeles transparentes, que se repite sin costura:
  - sala: madera cálida en tablas horizontales;
  - comedor: madera clara en tablas verticales;
  - cocina: baldosa en damero con junta gris azulada;
  - baño: azulejo pequeño;
  - lavandería: concreto verdoso moteado;
  - espacio de mascota: paja con motas;
  - dormitorio: alfombra rosa tejida;
  - oficina: alfombra lavanda cuadriculada;
  - pasillo: piedra con juntas.
- Elegir el suelo de cada casilla por el tipo del espacio al que pertenece según el mapa de espacios de la distribución, incluido el baño interno (con el suelo de baño), la casilla de aparición, las puertas y la entrada (con el suelo de la sala).

**Must not:**
- Elegir el suelo por el nombre del espacio ni por su número.
- Dibujar dos tipos con el mismo suelo.

### FR-3: Paredes

**Must:**
- Dar a las paredes dos vistas de 16×16 píxeles sin píxeles transparentes: la pared de frente (borde claro arriba, cuerpo con ladrillo, zócalo y base de contorno) y la pared desde arriba (parte superior plana con contorno).
- Elegir la vista de una casilla de pared solo por la casilla de debajo: de frente cuando existe y no es pared ni vacío, desde arriba en cualquier otro caso (pared debajo, vacío o fuera del mapa).
- Aplicar la misma regla a todas las paredes: exteriores, de separación entre espacios, de pasillos y tabiques de baños internos.

**Must not:**
- Cambiar qué casillas son pared ni qué casillas se pueden transitar.
- Dibujar una puerta como pared.

### FR-4: Mobiliario

**Must:**
- Dibujar cada una de las 17 piezas de la leyenda del mobiliario con forma reconocible y contorno oscuro, con transparencia donde se ve el suelo del espacio:
  - cama (de dos casillas en vertical): marco de madera, colcha azul y almohada blanca;
  - velador: mueble de madera con cajón;
  - sofá (cuatro casillas): asiento y respaldo tapizados;
  - mesa de centro (dos casillas): mesa baja de madera;
  - mesa de comedor (cuatro casillas): mesa de madera;
  - silla de comedor (una por casilla, todas iguales): silla de madera;
  - cocina: cocina con hornillas;
  - refrigeradora: electrodoméstico alto gris;
  - lavadero: pileta gris;
  - inodoro: inodoro blanco;
  - lavamanos: lavamanos blanco;
  - ducha: ducha azul clara;
  - escritorio (dos casillas): mesa de trabajo de madera;
  - silla de escritorio: silla oscura;
  - lavadora (dos casillas): electrodoméstico gris;
  - cama de mascota: cojín rojizo;
  - plato: plato amarillo.
- Elegir la variante del dibujo de cada casilla de las piezas que son un solo objeto de varias casillas (cama, sofá, mesa de centro, mesa de comedor, escritorio y lavadora) según sus casillas vecinas de la misma pieza (arriba, abajo, izquierda y derecha), de modo que se vean como un solo objeto; las demás piezas, incluida la silla de comedor, se dibujan igual en cada casilla.
- Mantener las 17 piezas como las define la 001, sin añadir ni quitar ninguna.

**Must not:**
- Añadir muebles, decoración que no bloquea ni piezas nuevas a ninguna distribución.
- Cambiar las casillas que bloquea cada mueble.

### FR-5: Elección del arte de cada casilla

**Must:**
- Calcular, a partir de la distribución del hogar, qué arte lleva cada casilla: el suelo (capa inferior) y, si la casilla es de mobiliario, el mueble (capa superior); o la pared, según FR-3.
- Hacerlo de forma pura y determinista: el mismo hogar produce siempre la misma elección, sin depender del motor gráfico ni de la interfaz, de modo que se pueda verificar con pruebas automáticas.
- Cubrir todas las casillas que no son vacío en los 7.560 mapas permitidos: ninguna casilla de suelo, de pared o de mobiliario queda sin arte.
- Recalcular la elección cada vez que cambia la distribución, sin dejar arte de la distribución anterior.

**Must not:**
- Cambiar el generador de la distribución, el modelo ni el documento guardado.
- Dibujar un color liso de respaldo para una casilla sin arte; una casilla sin arte es un fallo que las pruebas deben detectar.

### FR-6: Capas y comportamiento que no cambian

**Must:**
- Dibujar, de abajo arriba: suelo y paredes, mobiliario, objetos del suelo según el estado de limpieza, etiquetas e insignias de los espacios, habitantes y sus etiquetas, burbujas y cartel de la entrada, en el mismo orden relativo que antes de esta feature.
- Mantener las colisiones, los toques, la prioridad al tocar, el modo exploración y el modo edición como están.

**Must not:**
- Cambiar los habitantes, los objetos del suelo, las insignias, las burbujas ni los colores de la interfaz HTML.

### FR-7: Tipografía

**Must:**
- Usar Silkscreen (licencia SIL Open Font License) en: las etiquetas de nombre de los espacios y de los habitantes, las insignias de estado, el cartel junto a la entrada, el texto de las pestañas de la barra inferior y el título de cada drawer.
- Seguir usando la fuente del sistema en los campos de texto, las listas, los chips, las fichas, las hojas, el historial, los selectores y las burbujas.
- Servir la tipografía con el propio juego, sin depender de ningún servidor externo.
- Esperar a que la fuente esté disponible antes de mostrar por primera vez el mapa y la barra, hasta un máximo de un segundo; pasado ese tiempo, continuar con la fuente del sistema.
- Dibujar con la fuente del sistema cualquier letra o símbolo que Silkscreen no tenga.
- Conservar el resalte con fondo de color de la etiqueta de quien juega y el tamaño constante en pantalla de las etiquetas.
- Registrar la licencia y el origen de la fuente junto a su archivo.

**Must not:**
- Cambiar los textos ni los datos guardados: la tipografía solo cambia cómo se ven.
- Usar Silkscreen en los campos donde la persona escribe ni en las listas largas.
- Pedir la fuente a un servidor externo.

### FR-8: Dibujo del mapa en pantalla

**Must:**
- Mostrar el arte con píxeles nítidos, sin suavizado, a cualquier zoom.
- Mostrar el cambio de cada acción del modo edición en menos de 100 ms, también con la carga completa.
- Preparar los dibujos al arrancar en menos de 300 ms.
- Mantener el movimiento a 60 cuadros por segundo.

**Must not:**
- Empeorar los 62,7 ms de redibujo con la carga completa medidos en la 007.
- Volver a preparar los dibujos en cada redibujo del mapa.

### FR-9: Compatibilidad

**Must:**
- Abrir sin error y sin aviso nuevo cualquier hogar guardado de la versión 1 a la 7, y guardarlo sin cambios de formato.
- Mantener válida la posición guardada del jugador.
- Mantener pasando las suites de las features 001 a 007 sin cambiar sus expectativas.

**Must not:**
- Cambiar el formato guardado, la versión del documento ni las claves de almacenamiento.

### FR-10: Procedencia del arte

**Must:**
- Que todo el arte sea original, producido en este proyecto, salvo la tipografía Silkscreen, que es una fuente de licencia abierta.

**Must not:**
- Incluir sprites, texturas ni imágenes de terceros con derechos reservados.
- Importar PNG, hojas de sprites ni paquetes de terceros.

## Non-Functional Requirements

### Performance

- El movimiento de los personajes se mantiene a 60 cuadros por segundo o más en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares en ruta a la vez, 4 mascotas, el propietario caminando solo, 50 actividades pendientes repartidas por el hogar de mayor tamaño permitido y 200 entradas en el historial.
- Cada cambio del modo edición se muestra en el mapa en menos de 100 ms con esa carga; el redibujo no supera los 62,7 ms que midió la 007.
- Preparar todos los dibujos al arrancar tarda menos de 300 ms; se mide en el dispositivo de referencia y se registra en `verification.md`.
- La elección del arte de las casillas del hogar de mayor tamaño permitido no produce una pausa perceptible.

### Security

- No hay autenticación en esta feature; sigue la decisión de la v1 de teléfono compartido.
- Ningún dato sale del dispositivo ni se pide ningún recurso a un servidor externo: la tipografía y el arte viajan con el juego.
- Los textos escritos por el usuario (nombres de miembros, de espacios y de actividades) se muestran siempre como texto, nunca interpretados como marcado, también con la tipografía nueva.

### Reliability

- Las reglas del arte se verifican de forma automática sin interfaz gráfica ni navegador: la paleta (32 colores, 11 familias, identificadores y valores únicos); cada dibujo (16×16, solo transparente o color de paleta, sin transparencia en suelos y paredes); los nueve suelos, distintos entre sí; las 17 piezas de mobiliario, con dibujo base distinto cada una; la elección de la vista de la pared por la casilla de abajo; la elección de la variante del mueble por sus vecinas; la capa de suelo y la capa de mueble de cada casilla; el determinismo de la elección; y la cobertura completa en los 7.560 mapas permitidos, sin casilla sin arte y con el mismo conjunto de casillas transitables que antes.
- Una prueba comprueba que el arte no cambia la distribución: la distribución de cada hogar es idéntica a la anterior a la feature.
- Una prueba comprueba que existe el registro de licencia y origen de la tipografía junto a su archivo.
- Las partes que necesitan el navegador o el teléfono (costuras entre casillas, nitidez, reconocimiento de espacios y muebles, tilde y ñ, que las pestañas quepan en 360 píxeles, ausencia de peticiones externas, medición de cuadros por segundo, redibujo y tiempo de preparación) se verifican a mano en un navegador de escritorio y en el teléfono, con pasos concretos registrados en `verification.md`, porque las reglas del proyecto prohíben pruebas automáticas con DOM, con el motor gráfico o que dependan de tiempos.
- Las suites de las features 001 a 007 siguen pasando sin cambios.
- Si la fuente no puede cargarse, el juego se abre y se usa con la fuente del sistema, sin error visible.

### Usability

- Cada espacio se reconoce por su suelo y cada mueble por su forma, sin leer etiquetas, en un teléfono en vertical y con el zoom del modo edición.
- El texto de las etiquetas, las insignias, el cartel, las pestañas y los títulos se lee sin esfuerzo en un teléfono; las pestañas de la barra caben en 360 píxeles de ancho.
- Los campos donde se escribe y las listas largas conservan la legibilidad de la fuente del sistema.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| La tipografía no llega a cargarse (archivo ausente, dañado o más de un segundo de espera) | El mapa, la barra y los títulos se muestran con la fuente del sistema, sin error visible ni pantalla en blanco |
| Un texto contiene una letra o un símbolo que Silkscreen no tiene (por ejemplo, la marca ✓ de la insignia "limpio") | Esa letra o símbolo se dibuja con la fuente del sistema; el resto del texto se ve con Silkscreen sin cortes ni huecos |
| Una casilla de la distribución tiene una letra de mobiliario o un tipo de espacio sin arte (dato futuro o corrupto) | Se dibuja el suelo y no el mueble, sin cerrar el juego; en los 7.560 mapas permitidos no ocurre y una prueba automática lo detecta si algún cambio lo provoca |
| Una casilla de pared queda con vecinas inesperadas (por ejemplo, un hueco en el mapa) | Se elige la vista por la regla de FR-3 (la casilla de abajo no es pared ni vacío: de frente; en otro caso, desde arriba) sin error |
| Se cambia el hogar en modo edición mientras se redibuja | El mapa muestra siempre la elección de la última distribución, sin arte de la anterior |
| Se abre un hogar guardado de una versión anterior | Se abre sin aviso nuevo y se ve con el arte nuevo (igual que en la 007) |
| Falla el guardado en el dispositivo | Se mantiene el aviso no bloqueante de la 007: la sesión continúa con los datos en memoria |
| Los datos guardados no se pueden leer | Se mantiene el comportamiento de la 007: aviso y hogar inicial |
| Un nombre largo se dibuja con la letra pixel, que es más ancha | El texto no se corta; si desborda su espacio puede solaparse con una etiqueta vecina; ver la pregunta abierta sobre el ancho de las etiquetas |

## Open Questions

- Ninguna bloqueante. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-09 (estilo B, tres features, arte como cuadrículas de texto con paleta, Silkscreen en el mapa y la barra) y la decisión de arquitectura está registrada en el ADR enlazado.
- **Decisiones que esta spec tomó sobre puntos que el PRD no cerraba**, a confirmar al aprobarla: (a) la entrada del hogar y la casilla de aparición se dibujan con el suelo de la sala, sin arte propio (AC-2.2, AC-2.4); (b) la regla de la vista de la pared usa solo la casilla de debajo (AC-3.1 a AC-3.7); (c) la etiqueta de quien juega conserva su fondo de color y ya no se exige la negrita (AC-6.3); (d) la espera máxima de la fuente antes de continuar con la del sistema es de un segundo (AC-8.3); (e) el símbolo ✓ de la insignia "limpio" no existe en Silkscreen y se dibuja con la fuente del sistema hasta que la feature 010 dibuje las insignias (Error Scenarios); (f) los botones "Listo" y los demás de los drawers conservan la fuente del sistema: la letra pixel se aplica solo al texto de las pestañas y al título de cada drawer (AC-7.1, AC-7.3, AC-7.4); (g) el texto de la burbuja (emoji y "+") conserva la fuente del sistema (AC-6.8); (h) si la fuente dibuja las minúsculas como mayúsculas, el nombre se muestra así y no se altera el dato (AC-6.4); (i) la descripción de cada suelo y de cada mueble (FR-2, FR-4) fija qué se dibuja y no el píxel exacto, que se verifica a mano en el teléfono.
- **Riesgos a medir en un teléfono con la verificación de la fase de integración del plan**, y a ajustar con evidencia: (1) Silkscreen es más ancha que la fuente del sistema, por lo que una etiqueta de nombre larga ("Espacio de mascota", un nombre de 20 caracteres) puede ocupar más que su espacio en el modo edición con el zoom bajo y solaparse con una vecina; el tamaño de la letra de las etiquetas lo fija el plan con esa medida, sin bajar de lo legible; (2) el texto "Intercambios (20)" puede no caber en una pestaña de 360 píxeles de ancho (AC-7.2); si no cabe, el plan elige un tamaño menor o una forma más corta, sin cambiar el significado de la etiqueta; (3) el suelo del baño interno y el del cuarto se juntan en el tabique y pueden confundirse a zoom bajo; (4) Silkscreen puede no traer algún acento (AC-6.5, AC-6.6) y se comprueba antes de cerrar el plan.

## Out of Scope (Future Considerations)

- Personajes y mascotas con sprites y animación de caminar para los siete aspectos y las seis especies (feature 009).
- Estados de limpieza dibujados en el mapa con arte, insignias nuevas, juego de iconos propio para actividades, barra, drawers y burbujas, y recolor de la interfaz HTML con la paleta (feature 010).
- Muebles nuevos, decoración que no bloquea (alfombras, ventanas, cuadros) y sombras bajo los muebles.
- Las otras dos direcciones de arte comparadas en el brainstorm (colores planos mejorados y pixel art cálido con sombras).
- Arte importado (PNG, hojas de sprites, paquetes de terceros) y una herramienta o vista previa para dibujar el arte.
- Modo oscuro, temas y ajustes de arte desde la aplicación.
- Cambios en el modelo, el generador, las rutinas, los intercambios, el historial o el formato guardado.
- Cuentas, inicio de sesión, un dispositivo por persona y sincronización (pieza de multiusuario).
- El stack oficial de la aplicación.
