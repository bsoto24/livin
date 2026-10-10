# PRD: Estados de limpieza

**Date:** 2026-10-10
**Feature:** 010-estados-de-limpieza

## Problem

Tras la 008 y la 009 el hogar parece un videojuego GBA con personajes que caminan, pero lo que más cuenta el juego, **cómo está la casa**, sigue siendo lo menos legible. Los estados de limpieza (`limpio`, `desordenado`, `desastre`) se ven como 4 o 12 cuadritos de colores en el suelo, que no se reconocen como nada, y una insignia de texto (✓, !, !!) junto al nombre del espacio. En el teléfono, el principio 3 de la fundación ("el estado del hogar se lee de un vistazo en el propio mapa") depende hoy de leer la insignia y no de ver el espacio sucio.

Esta es la tercera y última feature de arte del mapa (ver la hoja de ruta del [PRD de la 008](../008-base-visual-y-mundo/prd.md)): da **aspecto propio al desorden**. Los iconos propios de la interfaz y el recolor de la HTML, que la hoja de ruta incluía en la 010, pasan a una **011** (decidido en este brainstorm, para poder verificar cada una por separado en el teléfono).

## Users & Context

**Usuarios de la v1:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, como en las features 001 a 009.

**Qué se ve hoy (verificado en `juego.js`, `aspecto.js` y `actividades.js`):**
- El estado de un espacio se deriva de la actividad por hacer más atrasada vinculada a él: 1 día de atraso es `desordenado` y 3 o más es `desastre`. Nada se guarda.
- `objetosDelSuelo` elige, por hash estable del espacio y la casilla, 4 casillas libres en desordenado y 12 en desastre (el desastre incluye siempre las del desorden), con una `variante` de 0 a 5; hoy se dibujan como cuadrados de color en una capa `Graphics`.
- El mundo (suelo, paredes y muebles) se compone en un `RenderTexture` y solo se redibuja al cambiar la distribución.

**Decisiones de arte (tomadas en el brainstorm con muestras dibujadas con la paleta real):**
- **Objetos propios de cada tipo de espacio** (no los mismos en todas partes) y **manchas en el piso** en el desastre.
- Qué cambia en cada estado:

| | **Desordenado** | **Desastre** |
|---|---|---|
| Objetos en el piso | 4, propios del espacio | 12, propios del espacio |
| Piso | limpio | manchas de suciedad (y de agua donde aplique) |
| Muebles | una pieza clave en versión desordenada | las piezas clave en versión sucia |
| Esquinas | nada | telarañas y, en cocina, baño y mascota, moscas |

- Por espacio (ideas de quien decide el producto, más una propuesta para tres espacios que no listó, ya aprobada):
  - **Dormitorio:** ropa, zapatos, libros y peluches en el piso; cama deshecha desde el desorden.
  - **Cocina:** ollas, platos sucios, plátano, manzana mordida y envoltura de snacks; platos en el lavadero en desordenado; en desastre, espuma desbordada, grasa en la cocina, agua y manchas en el piso.
  - **Sala y comedor:** control de TV, cojines, revistas y vasos; migas en las mesas en desordenado y mesas manchadas en desastre.
  - **Lavandería:** ropa sucia, escoba, recogedor y detergente.
  - **Baño:** toallas, papel higiénico, ropa y un patito; espuma en el lavamanos; en desastre, charcos, inodoro sucio y moho en la ducha.
  - **Espacio de mascota:** huesos, comida regada, plato volcado, pelota y pelos; cama deshecha.
  - **Oficina:** papeles, tazas, hojas, lapiceros y cuadernos; papeles apilados en el escritorio; en desastre, taza derramada.
  - El **pasillo** no tiene estado, como hoy.
- **Estado del arte:** los dibujos mostrados eran bocetos para decidir el reparto; el arte final se dibuja en la implementación con la paleta de 32 colores de la 008, y los detalles se afinan en la spec y al dibujar.

**Sistemas existentes que toca:**
- `arteDelMapa` en `src/arte/casillas.js` (recibe los estados de limpieza y devuelve las capas por casilla), un módulo de datos nuevo en `src/arte/` para los objetos, manchas, telarañas, moscas y sobreposiciones de muebles, y `prepararArte`/`dibujarMundo`/`refrescarActividades` en `juego.js`.
- Se eliminan de `juego.js` la capa `Graphics` de objetos del suelo y `COLOR_OBJETO`.
- **No se tocan:** el modelo, el generador, `limpiezaDeEspacio` y sus umbrales, el formato guardado (sigue `version: 7`), las rutinas, los intercambios, el historial, las insignias de texto (✓, !, !!), las burbujas con emoji, los iconos y los colores de la interfaz HTML (feature 011).

**Plataforma.** El PoC web sigue siendo desechable y el stack oficial no está decidido; por eso el arte sigue siendo datos independientes del motor (ADR-008). Toda la interfaz y los documentos siguen en español.

## Goals

**Los tres estados dibujados**
- Los ocho tipos de espacio con estado se reparten en siete grupos de arte (cocina, baño, lavandería, mascota, dormitorio, oficina, y sala y comedor, que comparten el suyo). Cada grupo tiene **seis objetos propios** de 16×16 para el suelo, que sustituyen a los cuadritos de color.
- En **desordenado**: 4 objetos propios y las piezas clave de cada espacio en versión desordenada (cama deshecha, platos en el lavadero, migas en las mesas, espuma en el lavamanos, cama de mascota revuelta, papeles apilados en el escritorio).
- En **desastre**: 12 objetos propios, manchas de suciedad en el piso (de agua en cocina y baño donde aplique), las piezas clave en versión sucia (grasa en la cocina, espuma desbordada en el lavadero, mesas manchadas, inodoro sucio, moho en la ducha, taza derramada en el escritorio), telarañas en las esquinas superiores del espacio y moscas en cocina, baño y mascota.
- En **limpio** el espacio se ve como hoy (suelo, paredes y muebles de la 008).
- Los tres estados se distinguen de un vistazo en cada tipo de espacio, sin leer la insignia.

**Coherencia de lo que se ve**
- Los objetos y las manchas solo caen en casillas libres del espacio, nunca sobre muebles, puertas ni la entrada del hogar. Cada casilla de desordenado conserva su objeto cuando el espacio pasa a desastre. Mismo hogar y mismos estados dan siempre el mismo dibujo.
- El espacio más pequeño (el baño interno, con 4 casillas libres) muestra tantos objetos como casillas libres tenga, como hoy.
- Las telarañas van solo en esquinas reales (casilla del espacio con pared al norte y pared al oeste o al este), con cualquier forma de espacio.
- Los personajes, las etiquetas, las insignias, las burbujas y el cartel "n fuera" siguen por encima del mundo con las mismas capas y funcionan igual.

**Redibujo**
- Cambiar el estado de un espacio (marcar "Hecho", agregar una actividad, cambiar el día con la app abierta) actualiza lo que se ve. El mundo se redibuja solo cuando cambia la combinación de estados de los espacios o la distribución; un cambio que no altera ningún estado no vuelve a dibujar.

**Hogar de prueba**
- Un hogar de prueba por estado (limpio, desordenado y desastre), válidos y armados con las operaciones reales del modelo, cada uno con un espacio de cada uno de los ocho tipos y, en los dos sucios, una actividad atrasada por espacio que lo deja en ese estado. No cabe un solo hogar con los tres estados de un mismo tipo porque el catálogo limita los espacios por tipo (por ejemplo, una sola sala), así que se cargan uno por uno en el navegador con el método ya conocido (sembrar `localStorage` con los módulos). Una prueba comprueba que son válidos, que tienen los ocho tipos y que cada espacio queda en el estado pedido. Las instrucciones quedan en el registro de verificación.

## Non-Goals

- Iconos propios (actividades, aspectos, barra inferior, burbujas, insignias) y recolor de la interfaz HTML (feature 011).
- Animaciones de moscas u objetos, o cualquier elemento que se mueva en un espacio sucio.
- Más estados que los tres actuales, o cambios en los umbrales de 1 y 3 días, en cómo se deriva el estado o en las actividades.
- Cambios en el modelo, el generador, las colisiones o el formato guardado; el desorden no bloquea el paso (es decoración, como hoy).
- Estado de limpieza en el pasillo.
- Objetos o muebles nuevos en la distribución, o cambios en el catálogo de piezas.
- Arte importado (PNG, hojas de sprites o paquetes de terceros).
- Una herramienta o galería para revisar el arte (se revisa en el juego con el hogar de prueba).

## Success Criteria

**Cobertura del arte (automático, sin Phaser):**
- Cada cuadrícula nueva mide 16×16, usa solo claves de la paleta y no está vacía.
- Los siete grupos de arte tienen seis objetos propios cada uno; toda pieza que declara una versión sucia tiene su sobreposición para cada estado en que cambia; hay manchas, telarañas (izquierda y derecha) y moscas.
- En los 7.560 mapas permitidos, con los tres estados aplicados a todos los espacios, ninguna casilla queda sin arte; los objetos y manchas solo ocupan casillas libres; las telarañas solo van en esquinas reales; en desastre se ven, además de los objetos, manchas, telarañas y las sobreposiciones declaradas.
- Elegir el arte de una casilla es determinista: dos llamadas con el mismo hogar y los mismos estados dan el mismo resultado; los objetos de desordenado siguen en las mismas casillas y con el mismo dibujo en desastre.
- Llamar a `arteDelMapa` sin estados da el mismo resultado que hoy (todo limpio).
- Las suites de las features 001 a 009 siguen pasando (391 pruebas); `objetosDelSuelo` conserva su contrato (4 y 12 objetos, las mismas casillas y `variante` de 0 a 5, que ahora elige el objeto entre los seis de su espacio) y el formato guardado no cambia.
- Los tres hogares de prueba de estados son válidos para el validador del formato `version: 7`, tienen los ocho tipos de espacio y dejan a cada espacio en el estado pedido.

**En el navegador de escritorio y en el teléfono (con el hogar de prueba y con un hogar completo de 8 familiares, 4 mascotas, 50 pendientes, 200 entradas y todos los espacios en desastre):**
- Cada espacio se reconoce limpio, desordenado y en desastre sin leer la insignia, y los objetos se distinguen entre sí.
- Al marcar "Hecho" en la última actividad atrasada de un espacio, este pasa a limpio y su dibujo se actualiza sin saltos; un cambio de día con la app abierta actualiza los espacios que cambian de estado.
- El movimiento se mantiene a 60 fps o más.
- El redibujo del mundo al cambiar el estado, y el de edición al cambiar la distribución, tardan menos de 100 ms con la carga completa y no empeoran lo medido en la 008 (7,5 a 11,7 ms en escritorio) ni los 45,3 ms de `regen` del teléfono con la 009.
- Preparar la hoja de texturas al arrancar, con los cuadros nuevos, tarda menos de 300 ms (se mide y se registra); la hoja no supera el tamaño de textura seguro en móviles.
- Las etiquetas, las insignias, las burbujas, el resalte de quien juega, el cartel "n fuera" y los toques funcionan como antes.

## Architecture Decisions

- [El estado de limpieza como parte de la composición del mundo](../../adr/010-estado-de-limpieza-en-la-composicion-del-mundo.md) — `arteDelMapa` recibe los estados y compone suelo, manchas, muebles sucios, telarañas, objetos y moscas en el mismo `RenderTexture`, que se redibuja solo si cambia la firma de estados; se descartaron una capa de suciedad aparte y un sprite por objeto.

Decisiones menores que se quedan aquí, sin ADR (locales a la capa de presentación y fáciles de revertir):
- **Muebles sucios como sobreposiciones:** cada versión sucia es una cuadrícula transparente de 16×16 dibujada encima del mueble limpio, en vez de duplicar cada pieza por estado y por parte (inicio, medio, fin). Una pieza sin sobreposición se ve igual en todos los estados.
- **El objeto de cada casilla** lo elige la `variante` (0 a 5) que `objetosDelSuelo` ya calcula con su hash estable, entre los seis objetos de su grupo de arte; equivale a "hash módulo seis" y no cambia el contrato de `aspecto.js`. Sala y comedor comparten los seis objetos.
- **Manchas:** salen de otra tanda de casillas libres del espacio, con otra sal en el hash, y pueden compartir casilla con un objeto (la mancha va debajo). Aparecen solo en desastre.
- **Telarañas y moscas:** las telarañas se colocan por regla de casillas (esquina superior); las moscas, sobre casillas libres elegidas con el hash, en cocina, baño y mascota. La telaraña de la derecha es otro cuadro dibujado como espejo de la de la izquierda.
- **Hoja de texturas en cuadrícula:** hoy son 162 cuadros en una sola fila (2.592 px); con unos 75 cuadros nuevos pasarían de 3.700 px, cerca de los 4.096 px que son el límite seguro en móviles, así que `prepararArte` reparte los cuadros en filas de 64 columnas.
- **Los hogares de prueba de estados** viven como módulo de ayuda en `poc/test/` y no forma parte de la aplicación.
- **La paleta** de 32 colores debería alcanzar; si al dibujar hace falta algún color, se amplía en `paleta.js` y se actualiza la prueba que fija el total.

## Out of Scope

- Cualquier cosa de la feature 011 (iconos propios de actividades, aspectos, barra, burbujas e insignias, y recolor de la interfaz HTML).
- Animaciones de moscas, objetos o cualquier cosa del desorden.
- Estados nuevos, cambios de umbrales o de la derivación del estado.
- Estado de limpieza del pasillo y decoración que no sea de estado.
- Cambios en el modelo, el generador o el formato guardado.
- Una galería o herramienta de vista previa del arte.
- Arte importado y paquetes de terceros.
