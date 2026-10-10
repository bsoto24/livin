# Feature 010: Estados de limpieza

**Status:** Approved
**Version:** 1.0.0
**Created:** 2026-10-10
**Branch:** `feat/010-estados-de-limpieza`
**Source:** [prd.md](prd.md) · [ADR el estado de limpieza como parte de la composición del mundo](../../adr/010-estado-de-limpieza-en-la-composicion-del-mundo.md) · [ADR el arte como cuadrículas de texto con paleta compartida](../../adr/008-arte-cuadriculas-con-paleta.md) · [ADR el estado derivado de fechas](../../adr/003-estado-derivado-fechas-reloj-inyectado.md) · se apoya en la [spec 003](../003-actividades/spec.md) (v1.0.0), la [spec 007](../007-menu-y-formularios-simples/spec.md) (v1.0.0), la [spec 008](../008-base-visual-y-mundo/spec.md) (v1.0.0) y la [spec 009](../009-habitantes-animados/spec.md) (v1.0.0)

---

## Problem Statement

Tras las features 008 y 009 el hogar parece un videojuego de GBA con personajes que caminan, pero lo que más cuenta el juego, cómo está la casa, sigue siendo lo menos legible: los estados de limpieza (limpio, desordenado y desastre) se ven como 4 o 12 cuadritos de colores en el suelo, que no se reconocen como nada, y una insignia de texto junto al nombre del espacio. Quien mira el mapa en el teléfono tiene que leer la insignia para saber cómo está un espacio, en vez de verlo. Esta feature, la tercera y última de arte del mapa, da aspecto propio al desorden: objetos propios de cada tipo de espacio, manchas en el piso, muebles desordenados o sucios, telarañas y moscas. No cambia ninguna regla del juego: los estados se siguen derivando de los días de atraso con los mismos umbrales.

## Goals

- **Objetos propios de cada tipo de espacio** (seis por grupo de arte) que reemplazan a los cuadritos de color: ropa en el dormitorio, platos y ollas en la cocina, control de TV en la sala, y así en los demás.
- Que **desordenado** muestre 4 objetos y las piezas clave del espacio desordenadas, y que **desastre** muestre 12 objetos, manchas en el piso, las piezas clave sucias, telarañas en las esquinas y, en cocina, baño y mascota, moscas.
- Que cada espacio se reconozca **limpio, desordenado o en desastre de un vistazo**, sin leer la insignia.
- Que el mapa **se actualice** cuando cambia el estado de un espacio (al marcar "Hecho", al agregar una actividad o al cambiar el día), sin volver a dibujar cuando ningún estado cambia.
- Un **hogar de prueba de estados** para revisar los tres estados de los ocho tipos de espacio en el juego.
- Que lo demás **siga funcionando igual**: capas, personajes, etiquetas, insignias, burbujas, toques, colisiones, rutas, hogares guardados y el formato guardado.
- Que el movimiento siga a 60 cuadros por segundo y que el redibujo tarde menos de 100 ms con la carga completa.

## Non-Goals

- No hay iconos propios (de actividades, aspectos, barra inferior, burbujas ni insignias) ni recolor de la interfaz HTML (feature 011).
- No hay animaciones de moscas, de objetos ni de nada que se mueva en un espacio sucio.
- No hay estados nuevos ni cambios en los umbrales de 1 y 3 días, en cómo se deriva el estado o en las actividades.
- No cambian el modelo, el generador, las colisiones ni el formato guardado; el desorden es decoración y no bloquea el paso.
- El pasillo no tiene estado, como hoy.
- No se añaden muebles, objetos ni piezas a la distribución.
- No se usa arte importado: ni PNG, ni hojas de sprites, ni paquetes de terceros.
- No se crea una galería ni una vista previa del arte: se revisa en el juego con el hogar de prueba.

## Users and Context

**Primary users:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, igual que en las features 001 a 009.
**Secondary users:** quienes en el futuro tendrán su propio dispositivo; esta feature no implementa nada de eso.
**Usage context:** sesiones cortas en un teléfono Android en vertical, y un navegador de escritorio para probar. Quien juega quiere ver de un vistazo qué espacios necesitan atención y qué tan atrasados están.
**User mental model:** el mismo de las features anteriores. Vocabulario nuevo: "objeto" (cada dibujo suelto que se ve en el piso de un espacio desordenado, uno por casilla); "mancha" (suciedad o agua dibujada sobre el piso, solo en desastre); "telaraña" (dibujo de esquina, solo en desastre); "moscas" (dibujo sobre una casilla, solo en desastre y solo en cocina, baño y mascota); "sobreposición" (la parte sucia o desordenada de un mueble, que se ve encima del mueble limpio); "grupo de arte" (los seis objetos propios de un tipo de espacio: hay siete, porque la sala y el comedor comparten el suyo).

**Relación con las specs anteriores.** Esta feature reemplaza únicamente el dibujo de los estados de limpieza:

- **Spec 003:** el estado de cada espacio (FR-4: limpio, desordenado, desastre, derivado de la actividad por hacer más atrasada con umbrales de 1 y 3 días) y la cantidad de objetos (4 en desordenado y 12 en desastre, limitada por las casillas libres, FR-5) siguen vigentes sin cambios. Se reemplaza el aspecto de los objetos: los cuadros de colores pasan a ser los objetos de esta feature. Las insignias y las burbujas con icono de la 003 no cambian.
- **Spec 004:** la entrada del hogar sigue libre de objetos (AC-9.6 de la 004).
- **Spec 007:** las actividades, los lugares y la pestaña Actividades no cambian; marcar "Hecho" y agregar una actividad cambian el estado del espacio como antes.
- **Spec 008:** el mundo, la paleta (32 colores en 11 familias), la tipografía y las capas no cambian; el arte nuevo se compone con la paleta y el mundo de la 008, que sigue viéndose igual en un espacio limpio.
- **Spec 009:** los personajes no cambian y se siguen dibujando por encima del mundo.

El resto de las specs 001 a 009 sigue vigente sin cambios.

## User Stories

### Story 1: Cada tipo de espacio tiene sus objetos propios

**As a** persona que ve el hogar en el mapa
**I want** que un espacio desordenado muestre cosas propias de ese tipo de espacio
**So that** entienda qué pasó en él sin leer nada

**Acceptance criteria:**

- [ ] **AC-1.1** Dado el catálogo de objetos, Cuando se listan sus grupos, Entonces hay exactamente siete (cocina, baño, lavandería, mascota, dormitorio, oficina, y sala y comedor) y cada uno de los ocho tipos de espacio con estado (sala, comedor, cocina, baño, lavandería, mascota, dormitorio y oficina) tiene asignado uno, de modo que la sala y el comedor comparten el suyo y los espacios de un mismo tipo, incluidos el baño común y los baños internos, comparten el del suyo.
- [ ] **AC-1.2** Dado cualquier grupo, Cuando se listan sus objetos, Entonces tiene exactamente seis, con claves distintas, y sus seis dibujos son distintos entre sí.
- [ ] **AC-1.3** Dado cualquier objeto, Cuando se mide, Entonces tiene exactamente 16 píxeles de ancho y 16 de alto.
- [ ] **AC-1.4** Dado cualquier objeto, Cuando se examinan sus píxeles, Entonces cada píxel es transparente o es un color de la paleta de la 008, y ninguno usa un color que no esté en ella.
- [ ] **AC-1.5** Dado cualquier objeto, Cuando se examinan sus píxeles, Entonces tiene al menos un píxel transparente (se ve el piso alrededor) y al menos un píxel de color.
- [ ] **AC-1.6** Dados los siete grupos, Cuando se listan sus objetos, Entonces son los de FR-1 (por ejemplo, en la cocina: olla, plato sucio, cáscara de plátano, manzana mordida, envoltura de snack y caja de pizza).

### Story 2: Los objetos reemplazan a los cuadritos de color

**As a** persona que ve el hogar en el mapa
**I want** que los 4 y los 12 objetos de un espacio sean cosas reconocibles
**So that** un cuadrito de color no se confunda con un adorno

**Acceptance criteria:**

- [ ] **AC-2.1** Dado un espacio en estado limpio, Cuando se elige el arte de sus casillas, Entonces ninguna lleva objeto.
- [ ] **AC-2.2** Dado un espacio en estado desordenado con al menos 4 casillas libres, Cuando se elige el arte de sus casillas, Entonces exactamente 4 casillas libres distintas llevan un objeto, y cada objeto es del grupo de arte del tipo del espacio.
- [ ] **AC-2.3** Dado un espacio en estado desastre con al menos 12 casillas libres, Cuando se elige el arte de sus casillas, Entonces exactamente 12 casillas libres distintas llevan un objeto del grupo de su tipo, y entre ellas están las 4 casillas del desordenado, cada una con el mismo objeto.
- [ ] **AC-2.4** Dado un espacio con menos casillas libres que objetos (el baño interno tiene 4), Cuando está en desordenado o en desastre, Entonces lleva tantos objetos como casillas libres tenga.
- [ ] **AC-2.5** Dado un espacio con objetos, Cuando se compara con las casillas libres del espacio, Entonces ningún objeto está sobre un mueble, una pared, una puerta ni la entrada del hogar, ni fuera del espacio.
- [ ] **AC-2.6** Dada una casilla con objeto, Cuando se mira cuál es, Entonces es el que corresponde a la variante de 0 a 5 que ya tiene esa casilla entre los objetos del suelo del espacio, dentro de los seis de su grupo; una casilla conserva su objeto cuando el espacio pasa de desordenado a desastre.
- [ ] **AC-2.7** Dado el mismo hogar y los mismos estados, Cuando se elige el arte dos veces, Entonces el resultado es idéntico; y renombrar un espacio no cambia el arte.
- [ ] **AC-2.8** Dado el pasillo (que no tiene estado), Cuando se elige el arte, Entonces nunca lleva objetos, manchas, telarañas ni moscas.
- [ ] **AC-2.9** Dado un comedor y una sala, Cuando cualquiera está en desordenado, Entonces sus objetos son del mismo grupo (sala y comedor).

### Story 3: En desastre, el piso está sucio

**As a** persona que ve el hogar en el mapa
**I want** que un espacio en desastre tenga manchas en el piso
**So that** se vea que está sucio y no solo desordenado

**Acceptance criteria:**

- [ ] **AC-3.1** Dado un espacio en estado limpio o desordenado, Cuando se elige el arte de sus casillas, Entonces ninguna lleva mancha.
- [ ] **AC-3.2** Dado un espacio en estado desastre con al menos 6 casillas libres, Cuando se elige el arte de sus casillas, Entonces exactamente 6 casillas libres distintas llevan una mancha; con menos casillas libres, tantas como casillas libres tenga.
- [ ] **AC-3.3** Dado un espacio de tipo cocina o baño en desastre, Cuando se miran sus manchas en el orden en que se eligen, Entonces las 2 primeras son de agua y las demás de suciedad; en cualquier otro tipo, todas son de suciedad.
- [ ] **AC-3.4** Dado un espacio en desastre, Cuando se miran sus manchas de suciedad en el orden en que se eligen, Entonces alternan una grande y una pequeña, empezando por la grande; hay un solo tamaño de mancha de agua.
- [ ] **AC-3.5** Dada una casilla con mancha y objeto, Cuando se compone la casilla, Entonces la mancha va debajo del objeto, y ninguna mancha cubre un mueble, una pared, una puerta ni la entrada del hogar.
- [ ] **AC-3.6** Dado el mismo hogar y los mismos estados, Cuando se elige el arte dos veces, Entonces las manchas están en las mismas casillas y con el mismo dibujo.

### Story 4: En desastre hay telarañas y moscas

**As a** persona que ve el hogar en el mapa
**I want** que un espacio en desastre tenga telarañas en las esquinas y moscas en los lugares que más las atraen
**So that** el desastre se distinga claramente del desorden

**Acceptance criteria:**

- [ ] **AC-4.1** Dado un espacio en estado limpio o desordenado, Cuando se elige el arte de sus casillas, Entonces ninguna lleva telaraña ni moscas.
- [ ] **AC-4.2** Dado un espacio en estado desastre, Cuando se elige el arte, Entonces cada casilla interior de ese espacio (ni pared ni vacío) con pared al norte y pared al oeste lleva una telaraña de esquina izquierda, y cada una con pared al norte y pared al este, pero no al oeste, lleva una de esquina derecha; ninguna otra casilla lleva telaraña y ninguna lleva más de una.
- [ ] **AC-4.3** Dada una esquina superior ocupada por un mueble (la cama en el dormitorio, la cocina en la cocina), Cuando el espacio está en desastre, Entonces la telaraña se dibuja encima del mueble.
- [ ] **AC-4.4** Dado un espacio sin esquinas superiores (la sala cuando hay comedor encima), Cuando está en desastre, Entonces no lleva telarañas y su desastre se ve por lo demás (objetos, manchas y muebles).
- [ ] **AC-4.5** Dado un espacio de tipo cocina, baño o mascota en estado desastre, Cuando se elige el arte, Entonces exactamente 2 casillas libres distintas llevan moscas (tantas como casillas libres haya si son menos); las moscas se dibujan encima del objeto o la mancha de la casilla.
- [ ] **AC-4.6** Dado un espacio de cualquier otro tipo en desastre, Cuando se elige el arte, Entonces no lleva moscas.
- [ ] **AC-4.7** Dado el mismo hogar y los mismos estados, Cuando se elige el arte dos veces, Entonces las telarañas y las moscas están en las mismas casillas.

### Story 5: Los muebles se ven desordenados o sucios

**As a** persona que ve el hogar en el mapa
**I want** que las piezas clave de un espacio cambien con el estado
**So that** una cama deshecha o una cocina grasienta cuenten el estado sin leer

**Acceptance criteria:**

- [ ] **AC-5.1** Dado el catálogo de sobreposiciones, Cuando se listan, Entonces están exactamente las de FR-5 (para cada pieza y estado que se indican, y para cada una de sus partes inicio, medio y fin si ocupa varias casillas).
- [ ] **AC-5.2** Dada cualquier sobreposición, Cuando se mide y se examinan sus píxeles, Entonces mide 16×16, cada píxel es transparente o de la paleta, y tiene al menos un píxel que no es transparente.
- [ ] **AC-5.3** Dada una casilla de mueble con sobreposición en el estado de su espacio, Cuando se elige el arte, Entonces lleva el mueble de la 008 con su variante de siempre y encima la sobreposición de su pieza, su parte y ese estado.
- [ ] **AC-5.4** Dada una casilla de mueble sin sobreposición en el estado de su espacio (por ejemplo, el sofá, el velador o la refrigeradora en cualquier estado, o la cocina en desordenado), Cuando se elige el arte, Entonces es idéntica a la de la 008.
- [ ] **AC-5.5** Dada una pieza de varias casillas con sobreposición (cama, mesas, escritorio), Cuando se elige el arte de todas sus casillas, Entonces cada parte lleva la sobreposición de su parte, y las de las partes contiguas se unen de modo que se ve como un solo objeto.
- [ ] **AC-5.6** Dadas las piezas que cambian entre desordenado y desastre (lavadero, mesas, lavamanos, cama de mascota y escritorio), Cuando se comparan sus sobreposiciones de los dos estados, Entonces son distintas; la cama deshecha es la misma en ambos estados.

### Story 6: Se reconoce cómo está cada espacio de un vistazo

**As a** persona que ve el hogar en el mapa
**I want** distinguir un espacio limpio de uno desordenado y de uno en desastre sin leer la insignia
**So that** sepa dónde hay que hacer algo con solo mirar

**Acceptance criteria:**

- [ ] **AC-6.1** Dado cada tipo de espacio, Cuando se compara el arte de sus casillas en limpio, desordenado y desastre, Entonces los tres son distintos entre sí.
- [ ] **AC-6.2** Dado un espacio, Cuando pasa de desordenado a desastre, Entonces el arte conserva lo del desordenado (los objetos de AC-2.3) y agrega manchas, telarañas y muebles sucios (y moscas donde aplican).
- [ ] **AC-6.3** Dado el hogar de prueba de estados en el navegador de escritorio y en el teléfono, Cuando se explora, Entonces cada uno de los ocho tipos de espacio se reconoce limpio, desordenado y en desastre sin leer la insignia, y los seis objetos de cada grupo se distinguen entre sí.
- [ ] **AC-6.4** Dado el hogar de prueba de estados en el teléfono con el zoom de exploración, Cuando se mira un espacio en desastre, Entonces los objetos, las manchas y los muebles sucios no se confunden con el mobiliario limpio ni tapan el nombre del espacio.

### Story 7: El mapa se actualiza cuando cambia el estado

**As a** persona que usa el hogar
**I want** ver el espacio limpio apenas hago lo pendiente, y sucio cuando se atrasa
**So that** el mapa cuente siempre cómo está la casa

**Acceptance criteria:**

- [ ] **AC-7.1** Dado un espacio en desordenado o en desastre con una sola actividad atrasada, Cuando se marca "Hecho", Entonces el mapa lo muestra limpio, sin objetos, manchas, telarañas ni muebles sucios.
- [ ] **AC-7.2** Dado un espacio limpio, Cuando se agrega una actividad atrasada 3 días o más con ese espacio, Entonces el mapa lo muestra en desastre; con 1 o 2 días de atraso, en desordenado.
- [ ] **AC-7.3** Dada la app abierta, Cuando cambia el día (medianoche o vuelta a primer plano otro día) y un espacio pasa de estado, Entonces el mapa lo muestra con su estado nuevo.
- [ ] **AC-7.4** Dado el modo edición con la pestaña Actividades abierta, Cuando se agrega, se edita o se da de baja una actividad que cambia el estado de un espacio, Entonces el mapa lo muestra con su estado nuevo.
- [ ] **AC-7.5** Dados los estados de todos los espacios antes y después de una acción, Cuando ninguno cambió (marcar "Hecho" en una actividad sin espacio, o en un espacio con otra actividad igual de atrasada), Entonces el mundo no se vuelve a componer; si al menos un espacio cambió de estado, sí.
- [ ] **AC-7.6** Dado un espacio con una actividad atrasada, Cuando cambia la distribución del hogar (se agrega o se elimina un espacio), Entonces el mapa se redibuja con el arte de los estados vigentes de cada espacio.

### Story 8: Lo que ya existía sigue igual

**As a** persona que usa el juego
**I want** que nada de lo demás cambie
**So that** no se rompa lo que ya funciona

**Acceptance criteria:**

- [ ] **AC-8.1** Dado un hogar con todos los espacios limpios, Cuando se elige el arte de sus casillas, Entonces es idéntico al de la 008, y es el mismo que cuando no se indica ningún estado.
- [ ] **AC-8.2** Dados los personajes, las etiquetas de nombre, las insignias de estado (✓, !, !!), las burbujas de actividades, el cartel "n fuera", el resalte de quien juega y los toques en modo edición, Cuando se usa el mapa, Entonces funcionan y se ven como antes, y todos quedan por encima de los objetos, manchas y telarañas.
- [ ] **AC-8.3** Dados los objetos, las manchas, las telarañas, las moscas y los muebles sucios, Cuando alguien camina por un espacio en desastre, Entonces el paso, las colisiones, la aparición, las rutas y las burbujas de espacio son las mismas que con el espacio limpio.
- [ ] **AC-8.4** Dado un espacio desordenado o en desastre en el navegador, Cuando se mira su piso, Entonces no se ve ningún cuadro liso de color de los que dibujaba la versión anterior.
- [ ] **AC-8.5** Dados los estados de limpieza y sus umbrales, Cuando se calculan, Entonces son los de la 003 (1 día de atraso es desordenado y 3 o más, desastre) y la cantidad y la elección de las casillas de los objetos del suelo son las de la 003.

### Story 9: Un hogar de prueba para revisar los tres estados

**As a** persona que verifica la feature
**I want** cargar hogares que muestren los tres estados de los ocho tipos de espacio
**So that** pueda revisar todo el arte en el juego sin armar el hogar a mano

**Acceptance criteria:**

- [ ] **AC-9.1** Dado el ayudante de pruebas, Cuando se pide un hogar de prueba de estados para limpio, desordenado y desastre, Entonces cada uno es válido para el validador del formato `version: 7`.
- [ ] **AC-9.2** Dado cualquiera de los tres hogares, Cuando se listan sus espacios, Entonces tiene al menos un espacio de cada uno de los ocho tipos (sala, comedor, cocina, baño, lavandería, mascota, dormitorio y oficina).
- [ ] **AC-9.3** Dado un hogar de prueba pedido para desordenado o desastre y un día de referencia, Cuando se calcula el estado de cada uno de sus espacios, Entonces todos están en el estado pedido; en el hogar para limpio, todos están limpios.
- [ ] **AC-9.4** Dado `verification.md`, Cuando se lee, Entonces explica cómo cargar cada hogar en el navegador (importando los módulos y sembrando el almacenamiento local con el día de hoy) y qué se debe ver.

### Story 10: Conservar mi hogar y mantener la fluidez

**As a** persona que ya tiene un hogar guardado
**I want** que el arte nuevo no rompa mi hogar ni vuelva lento el juego
**So that** pueda seguir usándolo igual

**Acceptance criteria:**

- [ ] **AC-10.1** Dado un hogar guardado en cualquier versión de la 1 a la 7, Cuando se abre, Entonces se abre sin error y sin aviso nuevo, con los estados dibujados con el arte nuevo, y el documento queda sin cambios de formato.
- [ ] **AC-10.2** Dado un hogar armado con la misma secuencia de operaciones, Cuando se guarda su documento antes y después de la feature, Entonces los dos documentos son idénticos (el arte no cambia el modelo).
- [ ] **AC-10.3** Dadas las suites de las features 001 a 009, Cuando se ejecutan, Entonces pasan (391 pruebas) sin cambiar sus expectativas.
- [ ] **AC-10.4** Dado el hogar de mayor tamaño permitido con la carga completa y todos los espacios en desastre, Cuando alguien camina, Entonces el movimiento se mantiene a 60 cuadros por segundo o más.
- [ ] **AC-10.5** Dado ese mismo hogar, Cuando cambia el estado de un espacio, Entonces el mundo se compone de nuevo en menos de 100 ms y no peor que lo medido en la 008.
- [ ] **AC-10.6** Dado el arranque de la aplicación, Cuando se preparan todos los dibujos con los nuevos incluidos, Entonces tarda menos de 300 ms y la hoja de dibujos no supera 4.096 píxeles por lado.

## Functional Requirements

### FR-1: Catálogo de objetos, manchas, telarañas, moscas y sobreposiciones

**Must:**
- Definir siete grupos de objetos de 16×16, seis por grupo, con estos nombres de objeto (el dibujo exacto se afina al dibujar y se revisa en el juego):
  - dormitorio: camiseta, pantalón, calcetín, zapato, libro y peluche;
  - cocina: olla, plato sucio, cáscara de plátano, manzana mordida, envoltura de snack y caja de pizza;
  - sala y comedor: control de TV, cojín, revista, vaso, cuenco de snacks y calcetín;
  - lavandería: montón de ropa sucia, escoba, recogedor, detergente, calcetín y balde;
  - baño: toalla, rollo de papel higiénico, camiseta, patito de goma, jabón y cepillo de dientes;
  - mascota: hueso, comida regada, plato volcado, pelota, mechón de pelos y pluma;
  - oficina: papel arrugado, taza, hoja, lapicero, cuaderno y carpeta.
- Asignar a cada uno de los ocho tipos de espacio con estado el grupo de su tipo (la sala y el comedor, el de sala y comedor; el baño común y los baños internos, el de baño).
- Definir los dibujos de 16×16 de la mancha de suciedad grande, la mancha de suciedad pequeña y la mancha de agua; de la telaraña de esquina izquierda y de la de esquina derecha (dibujada como el espejo de la izquierda); y de las moscas.
- Definir las sobreposiciones de FR-5.
- Usar solo píxeles transparentes o colores de la paleta de la 008, en datos puros que no dependen del motor gráfico ni del navegador, y que no importan ni el dominio ni el generador.

**Must not:**
- Añadir colores a la paleta salvo que no alcance al dibujar (ver Open Questions).
- Incluir ningún objeto o sobreposición completamente transparente.

### FR-2: Objetos del suelo

**Must:**
- Mantener la cantidad (4 en desordenado y 12 en desastre, limitada por las casillas libres) y la elección de las casillas de los objetos del suelo de la 003, con sus mismas casillas libres (dentro del espacio, transitables, sin puertas ni la entrada del hogar).
- Elegir el objeto de cada casilla por la variante de 0 a 5 que la 003 ya calcula, entre los seis objetos del grupo de arte del espacio.
- Conservar el objeto de cada casilla cuando el estado pasa de desordenado a desastre.

**Must not:**
- Cambiar el contrato de los objetos del suelo de la 003 (cantidad, casillas, orden, variante de 0 a 5).
- Dibujar objetos en espacios limpios ni en el pasillo.

### FR-3: Manchas

**Must:**
- En desastre, elegir hasta 6 casillas libres del espacio, con otra tanda de la misma función de hash estable (otra sal) que la de los objetos, y dibujar en ellas una mancha debajo del objeto de la casilla, si lo hay.
- En cocina y baño, las 2 primeras manchas son de agua; las demás y todas las de los otros tipos son de suciedad, alternando grande y pequeña empezando por la grande.

**Must not:**
- Dibujar manchas en limpio ni en desordenado, ni sobre muebles, paredes, puertas o la entrada del hogar.

### FR-4: Telarañas y moscas

**Must:**
- En desastre, dibujar una telaraña en cada casilla interior del espacio con pared al norte y pared al oeste (esquina izquierda) o, si no hay pared al oeste, con pared al norte y pared al este (esquina derecha), encima del mueble si lo hay.
- En desastre, y solo en cocina, baño y mascota, dibujar moscas en 2 casillas libres elegidas con otra sal del mismo hash estable, encima del objeto o la mancha de la casilla.
- Considerar pared solo las casillas de pared, no las puertas abiertas.

**Must not:**
- Dibujar más de una telaraña por casilla, ni telarañas o moscas en limpio, en desordenado o en el pasillo.

### FR-5: Muebles desordenados o sucios

**Must:**
- Dibujar encima del mueble de la 008, con una sobreposición por pieza, estado y parte (inicio, medio o fin cuando ocupa varias casillas), solo estas:
  - cama (inicio y fin): deshecha en desordenado y en desastre (la misma);
  - cocina: con grasa en desastre;
  - lavadero: con platos en desordenado; con platos y espuma desbordada en desastre;
  - mesa de comedor (inicio, medio y fin) y mesa de centro (inicio y fin): con migas en desordenado; con una mancha derramada en desastre;
  - lavamanos: con espuma en desordenado; con espuma abundante en desastre;
  - inodoro: sucio en desastre;
  - ducha: con moho en desastre;
  - cama de mascota: revuelta en desordenado; revuelta y manchada en desastre;
  - escritorio (inicio y fin): con papeles apilados en desordenado; con papeles y una taza derramada en desastre.
- Dibujar las demás piezas (velador, sofá, silla de comedor, refrigeradora, silla de escritorio, lavadora y plato) y estos mismos muebles en los estados que no se indican, exactamente como en la 008.
- Que las sobreposiciones de las partes contiguas de una pieza se unan, de modo que se vea como un solo objeto.

**Must not:**
- Cambiar el dibujo del mueble de la 008 ni su variante de borde.
- Hacer que un mueble, sucio o no, deje de bloquear el paso.

### FR-6: Elección del arte de cada casilla

**Must:**
- Recibir el estado de limpieza de cada espacio (los espacios que no se indican, como el pasillo, son limpios) y devolver para cada casilla las capas en este orden de dibujo: suelo o pared, mancha, mueble, sobreposición del mueble, telaraña, objeto y moscas.
- Dar el mismo resultado que hoy cuando no se indica ningún estado o todos son limpios.
- Ser una regla pura y determinista: el mismo hogar, la misma distribución y los mismos estados dan siempre el mismo resultado; no depende de la fecha ni de ningún dato fuera de sus parámetros, y no guarda nada.
- Dar arte (nunca un color de respaldo) a todas las casillas de los 7.560 mapas permitidos con los tres estados aplicados a todos los espacios.

**Must not:**
- Importar las reglas de actividades ni calcular el estado de un espacio (lo calcula quien la llama, con las reglas de la 003).
- Cambiar el modelo, el generador ni las colisiones.

### FR-7: Cuándo se redibuja

**Must:**
- Decidir con una regla pura, a partir de los estados de todos los espacios antes y después de un cambio, si el mundo debe componerse de nuevo; un espacio ausente cuenta como limpio.
- Componer de nuevo el mundo cuando cambia el estado de algún espacio o cambia la distribución, en cualquier modo (exploración o edición), al marcar "Hecho", al agregar, editar o dar de baja una actividad, y al cambiar el día con la app abierta.
- Mantener, al componerlo de nuevo, la posición de la cámara, los personajes y su estado de caminar.

**Must not:**
- Volver a componer el mundo cuando ningún estado cambió.
- Reiniciar a los personajes, cerrar la hoja o el drawer abiertos, ni cambiar el zoom por componer de nuevo el mundo.

### FR-8: Presentación en el mapa

**Must:**
- Componer los objetos, manchas, telarañas, moscas y sobreposiciones en la misma imagen del mundo que el suelo, las paredes y los muebles de la 008, por debajo de los personajes, las etiquetas, las insignias, las burbujas y el cartel, con píxeles nítidos a cualquier zoom, incluido el fraccionario del modo edición.
- Preparar todos los dibujos nuevos una sola vez al arrancar, junto con los del mundo y los personajes, sin pasar de 4.096 píxeles por lado en la hoja de dibujos.
- Calcular el estado de cada espacio con las reglas de la 003 y pasarlo a la elección del arte, sin guardarlo.

**Must not:**
- Dibujar los cuadros de colores de los objetos del suelo ni mantener una capa aparte para ellos.
- Preparar los dibujos en cada redibujo del mapa.
- Cambiar las capas, las insignias, las burbujas, el cartel, el resalte de quien juega ni la resolución de toques por casilla.

### FR-9: Hogar de prueba de estados

**Must:**
- Proveer, como ayudante de pruebas fuera de la aplicación, un hogar de prueba válido y armado con las operaciones reales del modelo, para cada uno de los estados limpio, desordenado y desastre, con al menos un espacio de cada uno de los ocho tipos y, en los hogares para desordenado y desastre, una actividad por espacio atrasada 1 día (desordenado) o 3 días (desastre) respecto de un día de referencia que se indica al pedirlo, a cargo del propietario; el hogar para limpio no tiene actividades atrasadas.
- Que una prueba automática compruebe que los tres son válidos, que tienen los ocho tipos de espacio y que cada espacio queda en el estado pedido con las reglas de la 003.
- Registrar en `verification.md` cómo cargarlos en el navegador y qué se debe ver.

**Must not:**
- Cargarse solos al abrir el juego ni enlazarse desde la interfaz, ni sobrescribir el hogar del usuario sin que quien verifica lo haga a propósito.

### FR-10: Compatibilidad

**Must:**
- Abrir sin error y sin aviso nuevo cualquier hogar guardado de la versión 1 a la 7, y guardarlo sin cambios de formato.
- Mantener válida la posición guardada del jugador.
- Mantener pasando las suites de las features 001 a 009 sin cambiar sus expectativas.

**Must not:**
- Cambiar el formato guardado, la versión del documento ni las claves de almacenamiento.
- Cambiar el modelo, el generador, el movimiento, las rutinas, los intercambios, el historial, los umbrales de estado ni las insignias y burbujas.

### FR-11: Procedencia del arte

**Must:**
- Que todo el arte nuevo sea original, producido en este proyecto.

**Must not:**
- Incluir sprites, texturas ni imágenes de terceros con derechos reservados.
- Importar PNG, hojas de sprites ni paquetes de terceros.

## Non-Functional Requirements

### Performance

- El movimiento de los personajes se mantiene a 60 cuadros por segundo o más en el dispositivo de referencia (cualquier teléfono Android lanzado desde octubre de 2023), con 8 familiares en ruta a la vez, 4 mascotas, el propietario caminando solo, 50 actividades pendientes repartidas por el hogar de mayor tamaño permitido, todos sus espacios en desastre y 200 entradas en el historial.
- Componer de nuevo el mundo al cambiar un estado, o la distribución en modo edición, tarda menos de 100 ms con esa carga; no supera lo medido en la 008 (7,5 a 11,7 ms en escritorio con la carga completa) ni los 45,3 ms de `regen` que midió el teléfono con la 009. Se mide en el dispositivo de referencia y se registra en `verification.md`.
- Preparar todos los dibujos al arrancar, con los cuadros nuevos incluidos, tarda menos de 300 ms; se mide y se registra.
- Un cambio que no altera ningún estado no tiene costo de dibujo.

### Security

- No hay autenticación en esta feature; sigue la decisión de la v1 de teléfono compartido.
- Ningún dato sale del dispositivo ni se pide ningún recurso a un servidor externo: el arte viaja con el juego.
- Los nombres de los miembros y de los espacios se muestran siempre como texto, nunca interpretados como marcado, también sobre el dibujo nuevo.

### Reliability

- Las reglas del arte se verifican de forma automática sin interfaz gráfica ni navegador: los siete grupos de objetos y su asignación a los ocho tipos; los seis objetos de cada grupo, distintos entre sí, de 16×16, solo con transparente o paleta, con píxeles transparentes y de color; las manchas, telarañas, moscas y sobreposiciones de 16×16 y con la paleta; la lista exacta de sobreposiciones; la elección del arte de cada casilla para los tres estados (cantidades de objetos, manchas y moscas, casillas libres, orden de capas, telarañas solo en esquinas, sobreposiciones por pieza, parte y estado, los tres estados distintos entre sí, desastre conserva el desorden, todo limpio igual a la 008, determinismo); la regla de cuándo se redibuja; la cobertura de los 7.560 mapas con los tres estados; y la validez de los tres hogares de prueba con sus estados.
- Una prueba comprueba que el arte no cambia el modelo: el documento guardado de un hogar es idéntico al anterior a la feature.
- Las partes que necesitan el navegador o el teléfono (reconocimiento de los estados, actualización al marcar "Hecho", al agregar una actividad y al cambiar el día, orden de capas con los personajes, nitidez a cualquier zoom, medición de cuadros por segundo, de tiempos de redibujo y de preparación, y tamaño de la hoja de dibujos) se verifican a mano en un navegador de escritorio y en el teléfono, con los hogares de prueba y pasos concretos registrados en `verification.md`, porque las reglas del proyecto prohíben pruebas automáticas con DOM, con el motor gráfico o que dependan de tiempos.
- Las suites de las features 001 a 009 siguen pasando sin cambios.

### Usability

- Cada estado se reconoce sin leer la insignia, en un teléfono en vertical y con el zoom de exploración; el desastre se distingue del desorden de un vistazo.
- Los objetos no se confunden con muebles ni con personajes, y el espacio sucio no tapa su nombre ni sus burbujas.
- El cambio de estado se ve de inmediato y sin parpadeos ni saltos de la cámara.

## Error Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Un espacio tiene un tipo sin grupo de objetos (dato futuro o corrupto que el validador no atrapó) | Se dibuja sin objetos ni manchas pero con el resto de su estado, sin cerrar el juego; en datos válidos no ocurre y una prueba automática lo detecta si algún cambio lo provoca |
| Una pieza declarada con sobreposición no la tiene para una parte o un estado | Se dibuja el mueble de la 008 sin sobreposición; una prueba automática lo detecta |
| Un espacio tiene menos casillas libres que objetos, manchas o moscas (el baño interno tiene 4) | Se dibujan tantos como casillas libres haya, sin repetir casillas |
| El espacio no tiene esquinas superiores (la sala bajo el comedor) | No lleva telarañas; su desastre se ve por lo demás |
| Un espacio desaparece (se elimina) mientras estaba sucio | Su arte desaparece con él y las casillas que ocupaba dejan de existir; ningún otro espacio cambia |
| El estado de un espacio pasa de desastre a desordenado (se hace la actividad más atrasada y queda otra menos atrasada) | Se dibuja el desorden de 4 objetos y los muebles desordenados, sin manchas, telarañas ni moscas |
| Se cambia el zoom, se gira la pantalla o se compone de nuevo el mundo mientras alguien camina | Todos conservan su vista y su cuadro, sin saltos |
| Un cambio de día no altera ningún estado | No se compone de nuevo el mundo |
| Se abre un hogar guardado de una versión anterior | Se abre sin aviso nuevo y se ve con el arte nuevo |
| Falla el guardado en el dispositivo | Se mantiene el aviso no bloqueante de la 007: la sesión continúa con los datos en memoria |
| Los datos guardados no se pueden leer | Se mantiene el comportamiento de la 007: aviso y hogar inicial |

## Open Questions

- Ninguna bloqueante. Las decisiones abiertas del brainstorm se resolvieron con el usuario el 2026-10-10 (objetos propios de cada tipo de espacio con manchas en el desastre; qué cambia en cada estado y en cada espacio; la 010 solo de estados y los iconos y el recolor en una 011; estado dentro de la composición del mundo) y la decisión de arquitectura está registrada en el ADR enlazado.
- **Decisiones que esta spec tomó sobre puntos que el PRD no cerraba**, a confirmar al aprobarla: (a) las **seis manchas** por espacio en desastre, las **dos de agua** en cocina y baño, el alterne grande y pequeña, y las **dos casillas de moscas** (FR-3, FR-4); (b) los **seis objetos** de cada grupo: los que dijo quien decide el producto (ropa, objetos varios, ollas, platos, cáscaras de fruta, envoltura de snacks, control de TV, escoba, recogedor y detergente) más los que completan el grupo (por ejemplo, caja de pizza, cuenco de snacks, balde, jabón, pluma y carpeta); (c) que las **mesas de centro** también se manchan, no solo la de comedor (FR-5); (d) que la **cama de mascota** se ve revuelta desde el desorden, y la **cama** deshecha igual en desordenado y en desastre (FR-5); (e) la **regla de las telarañas**: esquinas superiores del espacio, con preferencia a la izquierda y una por casilla; la sala bajo un comedor no las lleva porque su esquina superior es la del comedor (FR-4); (f) que el **hogar de prueba** es uno por estado (limpio, desordenado y desastre) con un espacio de cada tipo, y no un solo hogar con los tres estados, porque el límite de espacios por tipo (por ejemplo, una sola sala) impide mostrar tres estados del mismo tipo a la vez; se cambia de uno a otro cargándolos (FR-9; el PRD pedía un hogar solo); (g) que **limpio es exactamente el mundo de la 008** (AC-8.1); (h) que las **insignias** (✓, !, !!) no cambian en esta feature (feature 011); (i) que los dibujos mostrados en el brainstorm eran bocetos y el arte final se dibuja en la implementación y se revisa en el juego (FR-1); (j) que el **baño interno** tiene su propio estado y su propio arte, como un espacio más.
- **Paleta.** Los bocetos aprobados caben en los 32 colores de la 008. Si al dibujar hace falta algún color nuevo, se añade en el único módulo de la paleta y se actualiza la prueba que fija el total (AC-1.1 de la 008); esa es la única expectativa de las suites 001 a 009 que podría cambiar, y se anota en `verification.md`.
- **Riesgos a medir en el teléfono con la verificación de la fase de integración del plan**, y a ajustar con evidencia: (1) el redibujo completo del mundo con todos los espacios en desastre en el hogar más grande puede acercarse a la meta de 100 ms en el teléfono; si no la cumple, el ADR prevé pasar a una capa de suciedad aparte; (2) con el zoom bajo del modo edición los objetos y las manchas pueden perderse o confundirse con el mobiliario; si es así, se retocan los dibujos antes de cerrar; (3) la densidad de un desastre (12 objetos, 6 manchas, moscas y muebles sucios en un espacio pequeño) puede cargar demasiado; la cantidad de manchas se puede bajar sin tocar los objetos; (4) la hoja de dibujos queda cerca del límite de 4.096 píxeles si no se reparte; el plan decide cómo repartirla.

## Out of Scope (Future Considerations)

- Iconos propios de actividades, aspectos, barra inferior, burbujas e insignias, y recolor de la interfaz HTML con la paleta (feature 011).
- Animaciones de moscas, objetos o cualquier cosa del desorden.
- Estados nuevos, cambios de los umbrales o de la derivación del estado, y estado de limpieza del pasillo.
- Muebles u objetos nuevos en la distribución, y decoración que no dependa del estado.
- Una galería o herramienta de vista previa del arte.
- Cambios en el modelo, el generador, el movimiento, las rutinas, los intercambios, el historial o el formato guardado.
- Arte importado (PNG, hojas de sprites, paquetes de terceros).
- Cuentas, inicio de sesión, un dispositivo por persona y sincronización (pieza de multiusuario).
- El stack oficial de la aplicación.
