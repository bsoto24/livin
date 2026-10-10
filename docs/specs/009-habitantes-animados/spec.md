# Feature 009: Habitantes animados

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-10
**Branch:** `feat/009-habitantes-animados`
**Source:** [prd.md](prd.md) · [ADR los personajes como figuras compuestas por piezas](../../adr/009-personajes-compuestos-por-piezas.md) · [ADR el arte como cuadrículas de texto con paleta compartida](../../adr/008-arte-cuadriculas-con-paleta.md) · se apoya en la [spec 002](../002-familiares-y-mascotas/spec.md) (v1.0.0), la [spec 004](../004-rutinas/spec.md) (v1.0.0), la [spec 005](../005-jugador-activo-e-intercambios/spec.md) (v1.0.0), la [spec 007](../007-menu-y-formularios-simples/spec.md) (v1.0.0) y la [spec 008](../008-base-visual-y-mundo/spec.md) (v1.0.0)

---

## Problem Statement

Tras la feature 008 el mundo del hogar ya parece un videojuego de GBA, pero las personas y las mascotas que lo habitan siguen siendo rectángulos de color: las personas de 12×14 píxeles, las mascotas de 8×8, y el jugador se gira como un cuadrado. No se distingue un niño de un adulto más que por el tamaño, ni un perro de un gato más que por el color, y nadie camina: se deslizan. Es lo que más desentona con el mundo nuevo. Esta feature, la segunda de tres para dar arte al juego, da su cara y su caminar a todos los que viven en el hogar: 14 personajes de pixel art de una casilla (el protagonista, los siete aspectos y las seis especies) que miran y caminan en cuatro direcciones con parado y dos pasos. No cambia ninguna regla del juego.

## Goals

- **14 personajes** con dibujo propio de 16×16 píxeles: el protagonista (el propietario), los siete aspectos de un familiar y las seis especies de una mascota, que se distinguen de un vistazo.
- Que cada miembro del hogar se dibuje con **su** personaje, y que el dibujo cambie cuando se cambia su aspecto o su especie.
- **Caminar en cuatro direcciones**: vista de frente, de espalda y de lado, con la izquierda como la derecha volteada, y un ciclo de parado y dos pasos con pies alternos, para habitantes y para quien juega.
- Que la dirección en que mira cada personaje **no se guarde ni cambie el modelo**: se deduce de cómo se mueve.
- **Dos hogares de prueba** que juntos muestran los 14 personajes, para revisarlos en el juego.
- Que lo demás del mapa **siga funcionando igual**: capas, etiquetas, burbujas, toques, colisiones, rutas, velocidades y hogares guardados.
- Que el movimiento siga a 60 cuadros por segundo y el redibujo en modo edición tarde menos de 100 ms.

## Non-Goals

- No se dibujan los estados de limpieza con arte nuevo ni los objetos del suelo, las insignias, las burbujas con emoji o los colores de la interfaz HTML (feature 010).
- No hay animaciones de reposo (respirar, parpadear), de acciones (limpiar, dormir, sentarse) ni de emociones.
- No hay personalización individual: dos familiares con el mismo aspecto se ven iguales; solo el nombre los distingue.
- No se añaden aspectos ni especies, ni cambian las listas ni los límites del modelo.
- No cambian el movimiento, las rutas, las velocidades, las colisiones ni las reglas de aparición de los habitantes.
- No se dibujan cuatro vistas por separado (la izquierda no tiene dibujos propios), ni sombras bajo los personajes, ni figuras más altas que la casilla.
- No se crea una galería ni una vista previa del arte: se revisa en el juego con los hogares de prueba.
- No cambian el formato guardado, las migraciones ni las reglas del modelo.
- No se usa arte importado: ni PNG, ni hojas de sprites, ni paquetes de terceros.

## Users and Context

**Primary users:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, igual que en las features 001 a 008.
**Secondary users:** quienes en el futuro tendrán su propio dispositivo; esta feature no implementa nada de eso.
**Usage context:** sesiones cortas en un teléfono Android en vertical, y un navegador de escritorio para probar. Quien juega quiere reconocer a cada miembro de la familia y a cada mascota de un vistazo, y ver que caminan.
**User mental model:** el mismo de las features anteriores. Vocabulario nuevo: "personaje" (cada uno de los 14 tipos de dibujo: el protagonista, los siete aspectos y las seis especies); "cuadro" (cada uno de los 9 dibujos de un personaje); "vista" (frente, espalda o lado, según hacia dónde mira); "parado" (el cuadro de reposo) y "paso" (el cuadro de un pie adelantado, con dos variantes, una por pie); "protagonista" (el personaje del propietario, que no tiene aspecto desde la 007).

**Relación con las specs anteriores.** Esta feature reemplaza únicamente el aspecto de los habitantes y del jugador:

- **Spec 002:** el aspecto de los habitantes (FR-8, rectángulos de color y escala por aspecto) se reemplaza por los personajes. Siguen vigentes el movimiento, la aparición, las colisiones y las etiquetas de nombre.
- **Spec 004:** las rutas, la salida por la entrada y el regreso no cambian; quien está fuera de casa no se ve. Quien va en ruta se sigue dibujando debajo de quien pasea (AC-8.6 de la 004).
- **Spec 005:** quien juega puede ser el propietario o un familiar; el personaje que se dibuja como jugador es el de ese miembro. La etiqueta de quien juega sigue resaltada.
- **Spec 007:** los aspectos, las especies y el propietario sin aspecto no cambian; esta feature les da dibujo. El selector de iconos de la ficha sigue mostrando los emoji de la 007 hasta la feature 010.
- **Spec 008:** el mundo, la paleta, la tipografía y las capas no cambian; los personajes se dibujan con la paleta de la 008 y encima del mundo.

El resto de las specs 001 a 008 sigue vigente sin cambios.

## User Stories

### Story 1: Cada personaje tiene su dibujo completo

**As a** persona que ve el hogar en el mapa
**I want** que los 14 tipos de personaje tengan un dibujo propio con todos sus cuadros
**So that** nadie aparezca como un rectángulo ni con un cuadro que falta al caminar

**Acceptance criteria:**

- [ ] **AC-1.1** Dado el catálogo de personajes, Cuando se lista, Entonces tiene exactamente 14: el protagonista, los siete aspectos de la 007 y las seis especies de la 007, cada uno con una clave única.
- [ ] **AC-1.2** Dado cualquier personaje, Cuando se listan sus cuadros, Entonces tiene exactamente 9: las vistas de frente, de espalda y de lado, cada una con el cuadro parado, el paso con un pie y el paso con el otro; y no tiene cuadros propios para mirar a la izquierda.
- [ ] **AC-1.3** Dado cualquier cuadro de cualquier personaje, Cuando se mide, Entonces tiene exactamente 16 píxeles de ancho y 16 de alto.
- [ ] **AC-1.4** Dado cualquier cuadro de cualquier personaje, Cuando se examinan sus píxeles, Entonces cada píxel es transparente o es un color de la paleta de la 008, y ninguno usa un color que no esté en ella.
- [ ] **AC-1.5** Dado cualquier cuadro de cualquier personaje, Cuando se examinan sus píxeles, Entonces tiene al menos un píxel transparente (se ve el suelo alrededor), al menos un píxel de color y al menos un píxel del color de contorno de la paleta.
- [ ] **AC-1.6** Dado cualquier personaje y cualquiera de sus tres vistas, Cuando se comparan sus tres cuadros, Entonces el paso con un pie, el paso con el otro y el parado son tres dibujos distintos entre sí.
- [ ] **AC-1.7** Dado cualquier personaje, Cuando se comparan sus cuadros parados de las tres vistas, Entonces son tres dibujos distintos entre sí.
- [ ] **AC-1.8** Dados los 14 personajes, Cuando se comparan sus cuadros parados de frente, Entonces no hay dos iguales.

### Story 2: Se reconoce quién es quién de un vistazo

**As a** persona que ve el hogar en el mapa
**I want** distinguir a los niños de los adultos, a los ancianos de los demás y a cada mascota de las otras
**So that** sepa quién es quién sin leer los nombres

**Acceptance criteria:**

- [ ] **AC-2.1** Dados los cuadros parados de frente del niño y de la niña, Cuando se mide la altura que ocupan (de la primera a la última fila con píxeles de color), Entonces es al menos dos filas menor que la del adulto, la del neutro y la del protagonista.
- [ ] **AC-2.2** Dados los cuadros parados de frente del hámster y del perro, Cuando se cuentan sus píxeles de color, Entonces el del hámster tiene menos que el del perro (el hámster es la mascota más pequeña).
- [ ] **AC-2.3** Dado el mapa en pantalla con los hogares de prueba, Cuando se miran las personas, Entonces se reconocen por sus rasgos: el protagonista, con gorra y ropa rosa; el adulto, con ropa azul; la adulta, con ropa amarilla y pelo largo; el neutro, con ropa lavanda; el niño, más bajo y con ropa azul; la niña, más baja y con coletas; el anciano, con pelo gris y un bastón; y la anciana, con pelo gris y moño.
- [ ] **AC-2.4** Dado el mapa en pantalla con los hogares de prueba, Cuando se miran las mascotas, Entonces cada especie tiene una silueta propia: el perro, un cuadrúpedo marrón con cola; el gato, gris con orejas puntiagudas y cola larga; el conejo, claro con orejas largas; el hámster, redondo y pequeño; el loro, de pie, con pico, alas y cola; y «Otro», un bichito redondo con orejas y ojos.
- [ ] **AC-2.5** Dado el mapa en pantalla con el zoom de exploración en un teléfono en vertical, Cuando se mira a cada uno de los 14 personajes, Entonces se reconoce sin leer su nombre.

### Story 3: Cada miembro se ve con su personaje

**As a** persona que usa la aplicación
**I want** que cada miembro del hogar se dibuje con el personaje que corresponde a su aspecto o su especie
**So that** el mapa refleje a mi familia

**Acceptance criteria:**

- [ ] **AC-3.1** Dado el propietario, tenga o no el turno de jugar, Cuando se elige su personaje, Entonces es el protagonista.
- [ ] **AC-3.2** Dado un familiar activo con cualquiera de los siete aspectos, Cuando se elige su personaje, Entonces es el del personaje con la clave de su aspecto.
- [ ] **AC-3.3** Dada una mascota activa con cualquiera de las seis especies, Cuando se elige su personaje, Entonces es el del personaje con la clave de su especie.
- [ ] **AC-3.4** Dados dos familiares con el mismo aspecto, Cuando se eligen sus personajes, Entonces es el mismo; el dibujo no depende del nombre, del identificador ni de ningún otro dato del miembro.
- [ ] **AC-3.5** Dado un familiar en el mapa, Cuando se cambia su aspecto en la ficha y se guarda, Entonces el mapa lo dibuja con el personaje del aspecto nuevo.
- [ ] **AC-3.6** Dada una mascota en el mapa, Cuando se cambia su especie en la ficha y se guarda, Entonces el mapa la dibuja con el personaje de la especie nueva.
- [ ] **AC-3.7** Dado quien juega, sea el propietario o un familiar, Cuando se dibuja en el mapa, Entonces usa el personaje de ese miembro y, al cambiar de jugador, el anterior se dibuja como habitante con su personaje y el nuevo como jugador con el suyo.
- [ ] **AC-3.8** Dado el mapa en pantalla en cualquier momento, Cuando se miran los habitantes y el jugador, Entonces ninguno se dibuja como un rectángulo de color, y el niño y la niña no se obtienen escalando el dibujo de un adulto.

### Story 4: Caminan en cuatro direcciones

**As a** persona que ve el hogar en el mapa
**I want** que cada personaje mire hacia donde camina
**So that** el hogar se vea vivo y se entienda hacia dónde va cada uno

**Acceptance criteria:**

- [ ] **AC-4.1** Dada una dirección, Cuando se elige la vista, Entonces abajo es la vista de frente, arriba la de espalda, derecha la de lado y izquierda la de lado volteada horizontalmente.
- [ ] **AC-4.2** Dado un habitante que pasa de una casilla a una vecina, sea paseando o siguiendo una ruta, Cuando empieza el paso, Entonces se dibuja con la vista de la dirección de ese desplazamiento (arriba, abajo, izquierda o derecha).
- [ ] **AC-4.3** Dado un habitante que sigue una ruta con giros, Cuando cambia de dirección entre una casilla y la siguiente, Entonces su vista cambia al empezar el paso nuevo, sin esperar a llegar.
- [ ] **AC-4.4** Dado quien juega, Cuando pulsa una dirección (flecha del teclado o botón táctil), Entonces se dibuja con la vista de esa dirección, también si el paso se bloquea por una pared, un mueble o un habitante y no se mueve.
- [ ] **AC-4.5** Dado un personaje que mira a la izquierda, Cuando se dibuja, Entonces se ve su cuadro de lado volteado horizontalmente, ocupando exactamente la misma casilla que sin voltear, sin desplazarse.
- [ ] **AC-4.6** Dado un personaje que deja de moverse, Cuando se queda quieto, Entonces sigue mirando hacia donde miraba hasta que vuelva a moverse.
- [ ] **AC-4.7** Dado un habitante que se coloca de nuevo en el mapa (al abrir el hogar, al salir del modo edición, cuando el juego vuelve a colocar a todos según sus rutinas; al crearse o recolocarse por un cambio en la edición; o al volver de fuera de casa), Cuando se dibuja, Entonces mira de frente.
- [ ] **AC-4.8** Dado quien juega al abrir el hogar, Cuando se dibuja, Entonces mira en la dirección que se guardó con su posición y, si no hay ninguna, de frente.
- [ ] **AC-4.9** Dado un personaje que cambia entre jugador y habitante al cambiar de jugador, Cuando se dibuja tras el cambio, Entonces sigue mirando hacia donde miraba antes.
- [ ] **AC-4.10** Dado el hogar guardado, Cuando se guarda o se abre, Entonces la dirección en que mira cada habitante no forma parte del documento: no se guarda ni se restaura.

### Story 5: Dan pasos con un pie y con el otro

**As a** persona que ve el hogar en el mapa
**I want** que quien camina alterne los pies como en un videojuego de GBA
**So that** se vea que camina y no que se desliza

**Acceptance criteria:**

- [ ] **AC-5.1** Dado un personaje que está dando un paso de una casilla a la siguiente, Cuando se elige el cuadro según lo avanzado del paso, Entonces en la primera mitad del paso (de 0 a menos de la mitad) se ve el cuadro de paso con el pie que toca, y en la segunda mitad (de la mitad al final) se ve el cuadro parado.
- [ ] **AC-5.2** Dado un personaje que da dos pasos seguidos, Cuando se compara el pie del primero con el del segundo, Entonces son distintos; y el del tercero es otra vez el del primero.
- [ ] **AC-5.3** Dado un personaje que no está dando un paso, Cuando se elige su cuadro, Entonces es el cuadro parado de su vista.
- [ ] **AC-5.4** Dado un habitante que encadena varios pasos sin pausa, Cuando se mira su caminar, Entonces el cuadro alterna paso, parado, paso con el otro pie, parado, sin saltos, sin parpadeos y sin repetir dos veces seguidas el mismo cuadro de paso.
- [ ] **AC-5.5** Dado un habitante que termina su tramo y se detiene, Cuando espera su pausa, Entonces se ve parado, en la casilla de llegada y con la vista de su último paso.
- [ ] **AC-5.6** Dados los habitantes y el jugador caminando a la vez, Cuando se compara su caminar, Entonces cada uno cambia de cuadro al ritmo de su propio paso (la mitad de un paso de habitante, 250 ms, y la mitad de un paso de jugador, 125 ms), sin que cambie la velocidad a la que se desplazan.
- [ ] **AC-5.7** Dado quien juega con un botón de dirección presionado de forma continua, Cuando camina, Entonces el cuadro alterna igual que en AC-5.4 y, al soltarlo, queda parado al terminar el paso en curso.

### Story 6: En reposo, en edición y al volver de fuera

**As a** persona que usa la aplicación
**I want** que los personajes se vean bien quietos, al editar el hogar y al volver a casa
**So that** nada se vea a mitad de un paso ni aparezca raro

**Acceptance criteria:**

- [ ] **AC-6.1** Dado el modo edición, Cuando se entra en él, Entonces todos los personajes se ven parados, con la vista con la que miraban, y ninguno cambia de cuadro mientras dure.
- [ ] **AC-6.2** Dado quien juega a mitad de un paso, Cuando se entra en modo edición, Entonces termina el paso en curso, como antes de esta feature, y queda parado.
- [ ] **AC-6.3** Dado un familiar fuera de casa, Cuando se mira el mapa, Entonces su personaje no se ve; y Cuando vuelve, Entonces aparece en la entrada, parado y de frente, sin animación de llegada.
- [ ] **AC-6.4** Dado un familiar que camina hacia la entrada para salir, Cuando llega a ella, Entonces su personaje desaparece como antes de esta feature, sin quedar ningún dibujo suyo en el mapa.
- [ ] **AC-6.5** Dado cualquier redibujo del mapa (cambio de zoom, giro o cambio de tamaño de la pantalla, cambio de nombre, cambio de actividades o del día), Cuando se vuelven a crear los dibujos de los personajes, Entonces cada uno conserva la vista y el cuadro que tenía, y ninguno vuelve a mirar de frente ni se queda a mitad de un paso.
- [ ] **AC-6.6** Dado un habitante eliminado en modo edición, Cuando se vuelve al mapa, Entonces su personaje ya no se ve y no queda estado suyo (vista ni pie) que pueda aparecer en otro habitante.
- [ ] **AC-6.7** Dado un habitante agregado en modo edición, Cuando se vuelve al mapa, Entonces aparece con su personaje, parado y de frente, en su casilla.

### Story 7: Lo que ya existía sigue igual

**As a** persona que ya usa la aplicación
**I want** que las etiquetas, las burbujas y los toques sigan como siempre
**So that** el cambio de arte no me obligue a aprender nada

**Acceptance criteria:**

- [ ] **AC-7.1** Dado el mapa en pantalla, Cuando se mira el orden de las capas, Entonces los personajes están por encima del suelo, las paredes, el mobiliario y los objetos del suelo, y por debajo de sus nombres, las burbujas y el cartel de la entrada.
- [ ] **AC-7.2** Dado un habitante que va en ruta y otro que pasea en la misma casilla, Cuando se dibujan, Entonces el que va en ruta se ve debajo del que pasea, y los nombres de ambos siguen apilados como antes.
- [ ] **AC-7.3** Dado un personaje en el mapa, Cuando se miran su nombre y su burbuja, Entonces el nombre está sobre su cabeza con el mismo tamaño constante en pantalla de antes, la etiqueta de quien juega conserva su fondo resaltado y la burbuja del miembro lo sigue, centrada en la casilla de encima de él.
- [ ] **AC-7.4** Dado el modo edición, Cuando se toca la casilla de un personaje, Entonces se abre su ficha o se aplica la prioridad al tocar de siempre (el propietario, luego el habitante, luego el espacio); tocar el dibujo de un personaje no hace nada distinto de tocar su casilla.
- [ ] **AC-7.5** Dado el cartel «n fuera» de la entrada, Cuando hay familiares fuera de casa, Entonces se ve y responde como antes de esta feature.
- [ ] **AC-7.6** Dado quien juega, Cuando se mira su dibujo, Entonces ya no lleva la flecha de dirección de marcador de la versión anterior: la dirección se ve por la vista del personaje.
- [ ] **AC-7.7** Dado el mapa a cualquier zoom, incluido el fraccionario del modo edición, Cuando se miran los personajes, Entonces se ven con píxeles nítidos, sin suavizado y sin bordes borrosos.
- [ ] **AC-7.8** Dadas las colisiones, las rutas, las velocidades (2 casillas por segundo los habitantes y 4 el jugador), la aparición y el movimiento de los habitantes, Cuando se compara con la versión anterior, Entonces son idénticos; las suites de pruebas de esos módulos pasan sin cambiar sus expectativas.

### Story 8: Dos hogares de prueba para revisar los 14 personajes

**As a** persona que revisa el arte en el juego
**I want** abrir dos hogares preparados donde aparezcan los 14 personajes
**So that** pueda verlos caminar sin armar a mano una familia entera

**Acceptance criteria:**

- [ ] **AC-8.1** Dado el primer hogar de prueba, Cuando se examina, Entonces tiene al propietario, llamado «Protagonista»; seis familiares, con los aspectos adulto, adulta, niño, niña, anciano y anciana; y cuatro mascotas, con las especies perro, gato, conejo y hámster.
- [ ] **AC-8.2** Dado el segundo hogar de prueba, Cuando se examina, Entonces tiene al propietario, llamado «Protagonista», un familiar con el aspecto neutro y dos mascotas, con las especies loro y otro.
- [ ] **AC-8.3** Dados los dos hogares de prueba, Cuando se examina el nombre de cada familiar y de cada mascota, Entonces coincide con su aspecto o su especie (por ejemplo, «Adulta» o «Loro»), de modo que la etiqueta del mapa dice qué dibujo se espera.
- [ ] **AC-8.4** Dado cada hogar de prueba, Cuando lo valida el validador del documento guardado de la versión 7, Entonces es válido, y Cuando se abre en el juego, Entonces no muestra ningún aviso.
- [ ] **AC-8.5** Dados los dos hogares de prueba, Cuando se reúnen los personajes de todos sus miembros, Entonces aparecen los 14, y cada hogar respeta los límites de 8 familiares y 4 mascotas.
- [ ] **AC-8.6** Dado el registro de verificación de la feature, Cuando se lee, Entonces explica cómo cargar cada hogar de prueba en el navegador y qué se debe ver en cada uno.
- [ ] **AC-8.7** Dados los hogares de prueba, Cuando se busca dónde viven, Entonces están fuera del código de la aplicación (no se cargan al abrir el juego ni se enlazan desde él) y no cambian ningún documento guardado del usuario por sí mismos.

### Story 9: Conservar mi hogar y mantener la fluidez

**As a** persona que ya tiene un hogar guardado
**I want** que el cambio de arte no toque mis datos ni haga el juego más lento
**So that** pueda seguir usándolo igual

**Acceptance criteria:**

- [ ] **AC-9.1** Dado un hogar guardado de cualquier versión de la 1 a la 7, Cuando se abre el juego, Entonces se abre sin ningún aviso nuevo y se ve con los personajes nuevos.
- [ ] **AC-9.2** Dado un hogar abierto con esta feature, Cuando se guarda, Entonces el documento sigue en la versión 7, con la misma clave de almacenamiento y los mismos campos que antes, sin campos nuevos.
- [ ] **AC-9.3** Dada la posición guardada del jugador, Cuando se abre el hogar, Entonces sigue siendo válida y el jugador aparece donde estaba.
- [ ] **AC-9.4** Dadas las suites de pruebas de las features 001 a 008, Cuando se ejecutan, Entonces pasan (367 pruebas) sin cambiar sus expectativas.
- [ ] **AC-9.5** Dado el juego al arrancar, Cuando se preparan todos los dibujos, incluidos los 126 cuadros de personajes, Entonces tarda menos de 300 ms, medido en el dispositivo de referencia y registrado en `verification.md`, y se hace una sola vez, no en cada redibujo del mapa.
- [ ] **AC-9.6** Dado un hogar con la carga completa (8 familiares en ruta a la vez, 4 mascotas, el propietario caminando solo, 50 actividades pendientes y 200 entradas de historial), Cuando se camina 30 segundos, Entonces el juego mantiene 60 cuadros por segundo o más.
- [ ] **AC-9.7** Dado un cambio del modo edición con esa carga, Cuando se aplica, Entonces el mapa lo muestra en menos de 100 ms y el redibujo no supera los 62,7 ms medidos en la 007.

## Functional Requirements

### FR-1: Catálogo de personajes y sus cuadros

**Must:**
- Definir 14 personajes con las claves `protagonista`, las siete de los aspectos de la 007 (`adulto`, `adulta`, `nino`, `nina`, `anciano`, `anciana`, `neutro`) y las seis de las especies de la 007 (`perro`, `gato`, `conejo`, `hamster`, `loro`, `otro`).
- Dar a cada personaje 9 cuadros de 16×16 píxeles: las vistas de frente, de espalda y de lado (mirando a la derecha), cada una con el cuadro parado y los dos pasos, uno por pie.
- Dibujar con la paleta de la 008 y su color de contorno: cada píxel es transparente o una clave de la paleta, sin colores sueltos.
- Dibujar a los niños con un cuerpo más bajo dentro de la casilla (no escalar el dibujo de un adulto) y a cada mascota con el tamaño propio de su especie.
- Que los 126 cuadros salgan de la composición descrita en el ADR de esta feature (rasgos con nombre para las personas, una función por especie para las mascotas) y se expongan como cuadrículas de texto de 16×16, como el resto del arte, para validarlos sin el motor gráfico.

**Must not:**
- Importar PNG, hojas de sprites ni arte de terceros.
- Incluir cuadros propios para mirar a la izquierda: esa vista es la de lado volteada.
- Guardar los dibujos en el documento del hogar.
- Importar el módulo de personajes desde el modelo ni desde el generador.

### FR-2: Rasgos de cada personaje

**Must:**
- Dar a cada personaje los rasgos que lo distinguen: el protagonista, gorra y ropa rosa; el adulto, pelo marrón y ropa azul; la adulta, pelo largo y ropa amarilla; el neutro, pelo oscuro corto y ropa lavanda; el niño, más bajo, pelo marrón y ropa azul; la niña, más baja, con coletas y ropa amarilla; el anciano, pelo gris, ropa azul oscuro y un bastón; la anciana, pelo gris con moño y ropa naranja claro.
- Dar a las mascotas una silueta de lado reconocible: el perro, marrón con cola y oreja oscura; el gato, gris con rayas, orejas puntiagudas y cola larga; el conejo, claro con orejas largas y cola redonda; el hámster, redondo, pequeño y con una raya en el lomo; el loro, de pie, verde con ala azul, cresta roja y pico amarillo; «Otro», un bichito redondo verde claro con orejas y ojos grandes.
- Fijar el detalle final de los dibujos al dibujarlos y revisarlos en el juego; la descripción de arriba fija qué se dibuja, no el píxel exacto.

**Must not:**
- Distinguir a los personajes solo por el color: la silueta o un rasgo (altura, pelo, accesorio) debe diferenciar a los que comparten color.
- Dibujar rasgos que dependan del nombre del miembro o de datos que no sean su aspecto o su especie.

### FR-3: Elección del personaje de cada miembro

**Must:**
- Elegir el personaje de un miembro con una regla pura y determinista: el propietario es el protagonista; una persona con aspecto usa el personaje de su aspecto; una mascota usa el de su especie.
- Volver a elegir el personaje cuando cambian el aspecto o la especie de un miembro, para que el mapa lo refleje al volver de la ficha.
- Aplicar la regla al jugador y a los habitantes por igual.

**Must not:**
- Depender del nombre, del identificador, de la posición ni de ningún otro dato del miembro.
- Cambiar el modelo, el documento guardado o los iconos (emoji) de las fichas, las listas y las burbujas.
- Dejar a un miembro sin personaje: ver Error Scenarios.

### FR-4: Vista según la dirección

**Must:**
- Mostrar la vista de frente al mirar hacia abajo, la de espalda hacia arriba, la de lado hacia la derecha y la de lado volteada horizontalmente hacia la izquierda.
- Deducir hacia dónde mira un habitante del desplazamiento entre su casilla anterior y la actual, tanto si pasea como si sigue una ruta, y la de quien juega de la dirección en que se mueve o intenta moverse.
- Conservar la vista de cada personaje mientras no se mueva y a través de los redibujos del mapa, del cambio entre jugador y habitante y del paso por el modo edición.
- Mostrar de frente al habitante que se coloca de nuevo (al abrir el hogar, al salir del modo edición, al crearse o recolocarse por un cambio en la edición, o al volver de fuera); y al jugador, con la dirección que se guardó con su posición o de frente si no hay ninguna.

**Must not:**
- Guardar en el modelo ni en el documento hacia dónde mira un habitante, ni tocar el movimiento para obtenerlo.
- Dibujar un cuadro para la izquierda distinto del de lado volteado, ni desplazar el dibujo volteado fuera de su casilla.

### FR-5: Cuadro al caminar

**Must:**
- Elegir el cuadro de un personaje con una regla pura y determinista: a lo largo de un paso de una casilla a otra, la primera mitad muestra el cuadro de paso con el pie que toca y la segunda, el parado; fuera de un paso, el parado.
- Alternar el pie en cada paso nuevo del mismo personaje.
- Ajustar el ritmo de los cuadros a la duración del paso de cada uno (500 ms por casilla los habitantes, 250 ms el jugador), sin cambiar la velocidad de desplazamiento.
- Mantener a cada personaje con su propio estado de pie, de modo que redibujar el mapa no lo reinicie.

**Must not:**
- Cambiar las duraciones de los pasos, las pausas ni los tramos del movimiento.
- Mostrar un cuadro de paso en modo edición ni a quien está quieto.

### FR-6: Presentación de los personajes en el mapa

**Must:**
- Dibujar a cada habitante y al jugador con el cuadro que corresponde a su personaje, su vista y su paso, centrado en su casilla, de 16×16 píxeles y sin escalar.
- Mantener las capas de la 008 (personajes sobre el mundo y los objetos del suelo; quien va en ruta debajo de quien pasea; nombres, burbujas y cartel por encima), la regla de que quien está fuera de casa no se ve, el nombre sobre la cabeza, la etiqueta resaltada de quien juega y la burbuja que sigue al miembro.
- Dibujarlos con píxeles nítidos a cualquier zoom, incluido el fraccionario del modo edición.
- Resolver los toques por casilla, como antes; los dibujos de los personajes no responden a toques por sí mismos.
- Preparar los 126 cuadros una sola vez al arrancar, junto con los demás dibujos del mapa.

**Must not:**
- Cambiar el movimiento, las colisiones, la aparición, las rutas, las etiquetas, las burbujas, las insignias ni el cartel.
- Dibujar la flecha de dirección del marcador anterior del jugador ni rectángulos de color para los habitantes.
- Preparar los dibujos en cada redibujo del mapa.

### FR-7: Hogares de prueba

**Must:**
- Proveer dos hogares de prueba válidos, armados con las operaciones reales del modelo y no con documentos escritos a mano, que juntos incluyan los 14 personajes: el primero con el protagonista, los seis familiares de género o edad (adulto, adulta, niño, niña, anciano y anciana) y cuatro mascotas (perro, gato, conejo y hámster); el segundo con el protagonista, el neutro, el loro y «Otro».
- Nombrar a cada familiar y a cada mascota con su aspecto o su especie, y al propietario «Protagonista».
- Mantenerlos fuera de la aplicación, en el código de pruebas, con una prueba automática que los valida y comprueba que juntos cubren los 14 personajes.
- Registrar en `verification.md` cómo cargarlos en el navegador (importando los módulos y sembrando el almacenamiento local, como en las verificaciones anteriores) y qué se debe ver.

**Must not:**
- Cargarse solos al abrir el juego ni enlazarse desde la interfaz.
- Sobrescribir el hogar del usuario sin que quien verifica lo haga a propósito.

### FR-8: Compatibilidad

**Must:**
- Abrir sin error y sin aviso nuevo cualquier hogar guardado de la versión 1 a la 7, y guardarlo sin cambios de formato.
- Mantener válida la posición guardada del jugador.
- Mantener pasando las suites de las features 001 a 008 sin cambiar sus expectativas.

**Must not:**
- Cambiar el formato guardado, la versión del documento ni las claves de almacenamiento.
- Cambiar el modelo, el generador, el movimiento, las rutinas, los intercambios ni el historial.

### FR-9: Procedencia del arte

**Must:**
- Que todo el arte de los personajes sea original, producido en este proyecto.

**Must not:**
- Incluir sprites, texturas ni imágenes de terceros con derechos reservados.
- Importar PNG, hojas de sprites ni paquetes de terceros.

## Non-Functional Requirements

### Performance

- El movimiento de los personajes se mantiene a 60 cuadros por segundo o más en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares en ruta a la vez, 4 mascotas, el propietario caminando solo, 50 actividades pendientes repartidas por el hogar de mayor tamaño permitido y 200 entradas en el historial.
- Cada cambio del modo edición se muestra en el mapa en menos de 100 ms con esa carga; el redibujo no supera los 62,7 ms que midió la 007.
- Preparar todos los dibujos al arrancar, con los 126 cuadros de personajes incluidos, tarda menos de 300 ms; se mide en el dispositivo de referencia y se registra en `verification.md`.
- Elegir el personaje, la vista y el cuadro de cada miembro en cada cuadro de animación no produce una pausa perceptible.

### Security

- No hay autenticación en esta feature; sigue la decisión de la v1 de teléfono compartido.
- Ningún dato sale del dispositivo ni se pide ningún recurso a un servidor externo: el arte viaja con el juego.
- Los nombres de los miembros se muestran siempre como texto, nunca interpretados como marcado, también sobre el dibujo nuevo.

### Reliability

- Las reglas del arte se verifican de forma automática sin interfaz gráfica ni navegador: los 14 personajes y sus claves; los 9 cuadros de cada uno, de 16×16, solo con transparente o paleta, con píxeles transparentes, de color y de contorno; los pasos distintos del parado y entre sí; las vistas distintas; los 14 cuadros parados de frente distintos; las alturas del niño y la niña frente a los adultos y el tamaño del hámster frente al perro; la elección del personaje de cada miembro (el propietario, los 7 aspectos y las 6 especies); la elección de la vista por la dirección; la elección del cuadro por el avance del paso y la alternancia del pie, con los casos límite (inicio, mitad y final del paso, y fuera de un paso); la validez de los dos hogares de prueba y la cobertura conjunta de los 14 personajes.
- Una prueba comprueba que el arte no cambia el modelo: el documento guardado de un hogar es idéntico al anterior a la feature.
- Las partes que necesitan el navegador o el teléfono (reconocimiento de los 14 personajes, dirección y cambio de pie al caminar, conservación de la vista y del pie a través de los redibujos, aparición y salida por la entrada, nitidez a cualquier zoom, cambio de aspecto o especie en la ficha, medición de cuadros por segundo, redibujo y tiempo de preparación) se verifican a mano en un navegador de escritorio y en el teléfono, con los hogares de prueba y pasos concretos registrados en `verification.md`, porque las reglas del proyecto prohíben pruebas automáticas con DOM, con el motor gráfico o que dependan de tiempos.
- Las suites de las features 001 a 008 siguen pasando sin cambios.

### Usability

- Cada personaje se reconoce sin leer su nombre, en un teléfono en vertical y con el zoom de exploración.
- Se ve claramente que camina: el cambio de pie se distingue sin esfuerzo y no hay parpadeos ni saltos al girar, al llegar, al redibujar ni al reaparecer.
- Los personajes no tapan el nombre que llevan encima ni la burbuja de actividades.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Un miembro no tiene personaje (aspecto o especie fuera de las listas, dato futuro o corrupto que el validador no atrapó) | Se dibuja el personaje de respaldo de su clase (el neutro para una persona, «Otro» para una mascota) sin cerrar el juego; en datos válidos no ocurre y una prueba automática lo detecta si algún cambio lo provoca |
| Un habitante cambia de dirección en cada casilla (ruta con giros) | La vista cambia al empezar cada paso, sin parpadeos ni cuadros intermedios |
| Quien juega pulsa una dirección y el paso se bloquea (pared, mueble o habitante) | Se dibuja con la vista de esa dirección, parado y sin moverse |
| Se entra en modo edición con habitantes a mitad de un paso | Quedan quietos en la casilla a la que se dirigían, parados y con la vista con la que caminaban (como en la 002) |
| Se cambia el zoom, se gira la pantalla o se redibuja el mapa mientras alguien camina | Todos conservan su vista y su cuadro, sin volver a mirar de frente ni reiniciar el pie |
| Se elimina un habitante o se cambia de jugador en modo edición | El dibujo y el estado del eliminado desaparecen; el nuevo jugador y el anterior se dibujan con su personaje y su vista, sin mezclar estados |
| Un familiar sale por la entrada y vuelve | Se oculta al salir; al volver aparece parado y de frente en la entrada, sin animación de llegada |
| Dos habitantes comparten una casilla (uno en ruta y otro paseando) | Cada uno se dibuja con su personaje, el de la ruta debajo del que pasea, como antes |
| Se abre un hogar guardado de una versión anterior | Se abre sin aviso nuevo y se ve con los personajes nuevos |
| Falla el guardado en el dispositivo | Se mantiene el aviso no bloqueante de la 007: la sesión continúa con los datos en memoria |
| Los datos guardados no se pueden leer | Se mantiene el comportamiento de la 007: aviso y hogar inicial |

## Open Questions

- Ninguna bloqueante. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-10 (tamaño de 16×16; parado más dos pasos en tres vistas con la izquierda volteada; protagonista propio; figura compuesta por piezas; revisión en el juego con dos hogares de prueba) y la decisión de arquitectura está registrada en el ADR enlazado.
- **Decisiones que esta spec tomó sobre puntos que el PRD no cerraba**, a confirmar al aprobarla: (a) el ritmo del caminar: la primera mitad de cada paso muestra el cuadro de paso y la segunda el parado, con el pie alternando en cada paso (AC-5.1, AC-5.2); (b) quien aparece por primera vez o vuelve de fuera mira de frente, aunque la entrada esté en la pared de abajo y entre mirando hacia arriba (AC-4.7); (c) al cambiar de jugador cada personaje conserva hacia dónde miraba (AC-4.9); (d) el jugador gira hacia donde pulsa aunque el paso se bloquee (AC-4.4); (e) la flecha de dirección del marcador anterior del jugador desaparece (AC-7.6); (f) el personaje de respaldo para un miembro sin personaje es el neutro o «Otro», en vez de ningún dibujo (Error Scenarios); (g) los hogares de prueba llaman «Protagonista» al propietario y a cada miembro por su aspecto o especie (FR-7); (h) la descripción de rasgos de cada personaje (FR-2) fija qué se dibuja y no el píxel exacto, que se revisa a mano en el juego; (i) los emoji de los selectores de aspecto y especie de la ficha no cambian en esta feature (feature 010).
- **Paleta.** Las muestras aprobadas caben en los 32 colores de la 008. Si al dibujar hace falta algún color nuevo, se añade en el único módulo de la paleta y se actualiza la prueba que fija el total (AC-1.1 de la 008); esa es la única expectativa de las suites 001 a 008 que podría cambiar, y se anota en `verification.md`.
- **Riesgos a medir en el teléfono con la verificación de la fase de integración del plan**, y a ajustar con evidencia: (1) a 16×16, y con el zoom bajo del modo edición, los rasgos finos (coletas, bastón, orejas del gato) pueden perderse; si algún personaje no se reconoce, se retoca su dibujo antes de cerrar; (2) un cuadro de 16×16 ocupa toda la casilla: la cabeza llega al borde superior y puede quedar cerca del nombre; la distancia del nombre se ajusta si el nombre tapa el dibujo; (3) la silueta de «Otro» y del hámster, ambas redondas, puede confundirse a distancia; (4) los pasos de 125 ms del jugador (mitad de un paso) pueden verse como un parpadeo en lugar de un caminar; el plan puede ajustar el ritmo sin cambiar la velocidad; (5) la verificación en el teléfono de la 008 sigue pendiente y puede hacerse junto con la de esta feature.

## Out of Scope (Future Considerations)

- Estados de limpieza dibujados en el mapa con arte, objetos del suelo, insignias y burbujas con arte, juego de iconos propio y recolor de la interfaz HTML con la paleta (feature 010).
- Animaciones de reposo y de acciones, emociones y poses (dormir, sentarse, limpiar).
- Personalización individual de los personajes (colores, peinados, accesorios elegidos por el usuario).
- Aspectos o especies nuevos, y figuras más altas que la casilla.
- Cuatro vistas dibujadas por separado, sombras bajo los personajes y una galería o herramienta de vista previa del arte.
- Resolver el tamaño de la letra del mapa y la verificación en el teléfono de la 008.
- Cambios en el modelo, el generador, el movimiento, las rutinas, los intercambios, el historial o el formato guardado.
- Arte importado (PNG, hojas de sprites, paquetes de terceros).
- Cuentas, inicio de sesión, un dispositivo por persona y sincronización (pieza de multiusuario).
- El stack oficial de la aplicación.
