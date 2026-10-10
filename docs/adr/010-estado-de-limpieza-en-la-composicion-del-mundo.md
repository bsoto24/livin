# ADR-010-estado-de-limpieza-en-la-composicion-del-mundo: El estado de limpieza como parte de la composición del mundo

**Status:** Accepted
**Date:** 2026-10-10
**Feature:** 010-estados-de-limpieza

## Context

La feature 010, la tercera de arte según la hoja de ruta del [PRD de la 008](../specs/008-base-visual-y-mundo/prd.md), dibuja los tres estados de limpieza de un espacio (`limpio`, `desordenado`, `desastre`) con arte propio. Los estados ya existen y se derivan de los días de atraso: `limpiezaDeEspacio(estado, espacioId, hoy)` en `actividades.js`, con umbrales de 1 y 3 días. Esta feature solo cambia **cómo se ven**.

Lo que se dibuja, decidido con muestras en el brainstorm, ya no son solo objetos sueltos en el suelo: también **manchas en el piso**, **muebles en versión sucia** (cama deshecha, grasa en la cocina, espuma y platos en el lavadero, mesas manchadas, moho en la ducha), **telarañas en las esquinas** y **moscas**. Todo depende del estado del espacio y puede cambiar sin que cambie la distribución del hogar: al marcar "Hecho", al agregar una actividad o al cambiar el día con la app abierta.

Cómo se dibuja hoy (verificado en `juego.js`, `casillas.js` y `aspecto.js`):
- Suelo, paredes y muebles se componen **una sola vez** en un `RenderTexture` (`dibujarMundo`), con `arteDelMapa(estado, distribucion)` como función pura, y solo se redibujan cuando cambia la distribución.
- Los objetos del suelo son una capa `Graphics` aparte (`dibujarObjetosDelSuelo`) con cuadros de colores, que se rehace en `refrescarActividades` al cambiar las actividades o el día.
- El arte son cuadrículas de 16×16 con una paleta única, convertidas en una hoja de texturas al arrancar ([ADR-008](008-arte-cuadriculas-con-paleta.md)).

Restricciones que pesan:
- Reglas del proyecto: el estado del juego vive en el dominio, no en objetos de Phaser, y no hay lógica de negocio en las escenas (`phaser.md`); los módulos de `src/arte/` son puros y sin Phaser ni DOM, y ni el dominio ni el generador los importan (`javascript.md`); la elección del arte se prueba sin Phaser (`testing.md`).
- Rendimiento: movimiento a 60 fps o más y redibujo en edición por debajo de 100 ms. Evidencia: con la carga completa (21 espacios, 8 familiares, 4 mascotas, 50 pendientes y 200 entradas) el redibujo del mundo tardó 7,5 a 11,7 ms en escritorio y el arte se preparó en 1 ms (`docs/specs/008-base-visual-y-mundo/verification.md`); en el teléfono, el indicador `regen` marcó 45,3 ms con el mundo de la 008 y los personajes de la 009 (resumen del usuario; no se registró el valor de `arte`).
- No cambia el formato guardado ni el modelo.

## Options Considered

### Option A: El estado entra en la composición del mundo (un solo `RenderTexture`)

`arteDelMapa` recibe el estado de limpieza de cada espacio y devuelve, por casilla, las capas en orden de dibujo (suelo, mancha, mueble, sobreposición sucia del mueble, telaraña, objeto, moscas). `dibujarMundo` las compone todas en el mismo `RenderTexture`, que se redibuja cuando cambia la firma de estados (qué espacio tiene qué estado). Desaparece la capa `Graphics` de objetos.

**Pros:** un solo camino de dibujo y una sola función pura que probar sin Phaser; el estado sigue viviendo en el dominio y la escena solo dibuja lo que la función le da; el costo del redibujo completo ya está medido y deja un margen amplio frente a los 100 ms; menos código en `juego.js`.
**Cons:** cada cambio de estado de algún espacio redibuja todo el mundo, no solo lo que cambió (se mitiga con la firma de estados: si ningún estado cambia, no se redibuja nada); el mundo deja de ser "estático salvo edición".

### Option B: Mundo estático y una segunda capa de suciedad que se redibuja aparte

El mundo sigue como hoy y un segundo `RenderTexture` (o `Graphics`) dibuja encima objetos, manchas, telarañas y los muebles sucios, y se rehace con cada cambio de estado.

**Pros:** el redibujo por cambio de estado es más barato porque no toca el mundo.
**Cons:** dos texturas que mantener alineadas en tamaño, zoom y orden; los muebles sucios se dibujarían encima de los limpios, así que cada sobreposición tendría que tapar todo lo que cubre o se transparentaría el mueble limpio; hay dos caminos de dibujo y dos conjuntos de pruebas; se gana tiempo en un redibujo que ya sobra 10 veces.

### Option C: Un sprite de Phaser por objeto, mancha y telaraña

Cada elemento es una imagen suelta que se crea o se destruye al cambiar el estado.

**Pros:** permitiría animar o mover cada elemento más adelante.
**Cons:** hasta cientos de objetos de escena (12 objetos y varias manchas por espacio, con hasta 21 espacios) frente a una sola textura; el estado del juego pasaría a vivir en objetos de Phaser, contra la regla del proyecto; no hay en el alcance ninguna animación que lo justifique.

## Decision

**We chose Option A (el estado entra en la composición del mundo)** porque es la única opción que cumple a la vez las reglas del proyecto (estado en el dominio, la elección del arte como función pura probada sin Phaser) y la meta de rendimiento con un solo camino de dibujo. El PRD pide manchas, muebles sucios y telarañas, no solo objetos; con una capa aparte (B) los muebles sucios obligan a coordinar dos texturas para ahorrar un tiempo que ya sobra: 7,5 a 11,7 ms medidos para el redibujo completo del mundo frente a 100 ms de meta. La opción C añade objetos de escena sin ningún beneficio dentro del alcance.

Reglas que fija la decisión:

- **`arteDelMapa(estado, distribucion, limpiezas)`** recibe un `Map` de id de espacio a estado de limpieza; si se omite, todos los espacios se consideran `limpio` y el resultado es el de hoy. `juego.js` calcula el `Map` con `limpiezaDeEspacio`; `src/arte/` no importa las reglas de actividades.
- **El mundo se redibuja solo si cambia la firma de estados** (la lista de espacios con su estado), además de cuando cambia la distribución. Un "Hecho" que no cambie ningún estado, o un cambio de día que lo deje todo igual, no vuelve a dibujar.
- **Los objetos, manchas, telarañas y sobreposiciones salen de datos puros** en `src/arte/` y de las casillas libres que ya calcula `aspecto.js`; la elección es determinista (mismo hogar, mismos estados, mismo resultado).
- **Todo se compone dentro del `RenderTexture` del mundo**, por debajo de los personajes, las etiquetas, las insignias y las burbujas, que no cambian de capa.
- **No se guarda nada nuevo.** Los estados siguen derivándose de `(estado, hoy)` ([ADR-003 de estado derivado](003-estado-derivado-fechas-reloj-inyectado.md)).

## Consequences

**Más fácil:**
- Probar sin Phaser lo que se ve en cada casilla para los tres estados, en los 7.560 mapas permitidos.
- Mantener un único camino de dibujo para el mundo; las features futuras que cambien el aspecto de un espacio (por ejemplo, un estado nuevo) solo amplían la función pura y los datos.
- Portar el arte y la elección de capas a otro motor: es lo mismo que el resto del mundo.

**Más difícil:**
- Un cambio de estado redibuja el mundo completo; si el hogar más grande permitido con todos los espacios en desastre no cumple los 100 ms en el teléfono, habría que pasar a la Option B (el mundo base no cambia y el cambio queda dentro de `juego.js`). La medición con la carga completa es un criterio de éxito de la feature.
- Las animaciones del desorden (moscas que se mueven, por ejemplo) no caben sin pasar a sprites sueltos (Option C) para esos elementos.

**A revisar si este ADR es reemplazado:** si el stack oficial usa un motor con capas de dibujo baratas por elemento, o si el redibujo completo del mundo deja de cumplir la meta de rendimiento con la carga completa en el teléfono.
