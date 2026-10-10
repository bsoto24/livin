# ADR-009-personajes-compuestos-por-piezas: Los personajes como figuras compuestas por piezas, con tres vistas y la izquierda volteada

**Status:** Accepted
**Date:** 2026-10-10
**Feature:** 009-habitantes-animados

## Context

Hoy los habitantes del mapa son rectángulos: personas de 12×14 px (×0,75 los niños) y mascotas de 8×8, con el color tomado de `DATOS_ASPECTO` y `DATOS_ESPECIE` en `catalogo.js`. El jugador es un contenedor que se gira con `setAngle`. La feature 009, la segunda de tres de arte, los convierte en personajes de pixel art que **caminan en cuatro direcciones**.

El [ADR-008](008-arte-cuadriculas-con-paleta.md) ya fijó el formato: cuadrículas de texto con una paleta única, como módulos de datos puros en `src/arte/`, convertidas en texturas al arrancar, y dejó abierto el tamaño de los sprites de los habitantes y cómo producir "animaciones de varios cuadros". En el brainstorm de esta feature, quien decide el producto fijó:

- **Tamaño 16×16**, una casilla (no 16×24 ni 12×14). Los niños se dibujan más bajos dentro de ese lado en vez de escalarse.
- **Parado y dos pasos**, en tres vistas (frente, espalda y lado), con la izquierda como la derecha volteada: **9 cuadros por personaje**.
- **14 personajes**: el protagonista (el propietario, que no tiene aspecto desde la 007), los 7 aspectos (`adulto`, `adulta`, `nino`, `nina`, `anciano`, `anciana`, `neutro`) y las 6 especies (`perro`, `gato`, `conejo`, `hamster`, `loro`, `otro`). Son **126 cuadros** de 16×16.

Restricciones que pesan sobre cómo producirlos:

- Reglas del proyecto: sin PNG ni dependencias, arte original, módulos de `src/arte/` sin Phaser ni DOM, ni dominio ni generador importan arte (`javascript.md`, `phaser.md`).
- Se valida con `node:test` sin Phaser (`testing.md`): formato, paleta y completitud deben poder comprobarse sin motor.
- Quien produce el arte es Claude dentro de las sesiones de trabajo, sin editor de píxeles; la revisión es a ojo en el navegador y sobre dos hogares de prueba.
- Rendimiento: hasta 12 personajes en movimiento a 60 fps; la preparación de texturas al arrancar debe seguir bajo 300 ms.
- El modelo, el generador y el formato guardado (`version: 7`) no cambian.
- La feature 010 (estados e iconos) reutilizará la forma de producir y organizar el arte.

## Options Considered

### Option A: Cuadros escritos a mano como cuadrículas literales

Cada uno de los 126 cuadros es una lista de 16 cadenas escrita a mano en `src/arte/personajes.js`, igual que se habría hecho con `SUELOS` si no se hubieran usado primitivas.

**Pros:** control total sobre cada píxel; el formato en el archivo es idéntico al exportado; no hay lógica de composición que mantener.
**Cons:** unas 2.000 líneas de texto; un cambio de peinado, de ropa o de proporción obliga a tocar muchos cuadros; los cuadros de un mismo personaje se desalinean con facilidad (un píxel de más en un paso) y las pruebas de formato no lo detectan; revisar un diff de cuadrículas es lento.

### Option B: Figura compuesta por piezas, exportada como texto de 16×16

Una función dibuja una persona a partir de rasgos con nombre (`pelo`, `camisa`, `pantalon`, `largo`, `coletas`, `gorra`, `baston`, `nino`, `mono`, …), la vista y el cuadro, usando las primitivas de `lienzo.js` (`rect`, `caja`). Cada especie de mascota tiene su propia función. Cada personaje es un registro de rasgos; el módulo genera sus 9 cuadros al cargarse y exporta **texto de 16×16 con claves de paleta**, el mismo formato de la 008. La izquierda no se guarda: es la derecha volteada en la presentación.

**Pros:** unas 300 líneas; la coherencia entre cuadros sale de la construcción (los pasos solo cambian las piernas, el cuerpo no se mueve); cambiar un rasgo cambia a todos los personajes que lo usan; los rasgos de cada personaje son datos legibles en el diff; todo se valida con las mismas pruebas de formato más pruebas de completitud y de diferencia entre cuadros.
**Cons:** la figura base limita lo que se puede expresar (un detalle que no encaja en las piezas obliga a ampliar la función); las mascotas, de siluetas muy distintas, no comparten figura y cada una cuesta casi como dibujarla.

### Option C: Un cuadro por vista y rebote procedural al caminar

Se dibujan solo los cuadros de reposo (3 vistas por personaje, 42 cuadros) y el caminar se simula en Phaser con un pequeño rebote vertical de 1 px y un balanceo.

**Pros:** el mínimo arte; ningún cuadro de paso que mantener.
**Cons:** no es caminar en 2D: no hay piernas que se muevan, que es lo que pidió quien decide el producto; la sensación de paso depende de parámetros del motor que no se prueban sin Phaser.

## Decision

**We chose Option B (figura compuesta por piezas, exportada como texto de 16×16)** porque es la única opción que da animación de pasos real (lo que pide el PRD) sin escribir 2.000 líneas a mano, mantiene la coherencia entre cuadros por construcción y conserva el formato de la 008, validable sin Phaser. Quien decide el producto la eligió explícitamente tras ver el reparto de personas y mascotas dibujado con ella.

Reglas que fija la decisión:

- **Un módulo nuevo `src/arte/personajes.js`**, puro: sin Phaser, sin DOM, y ni el dominio ni el generador lo importan. Puede importar `hogar.js` (como ya hace `casillas.js`) para saber si un miembro es el propietario.
- **Catálogo de 14 personajes** con claves `protagonista`, las siete de `ASPECTOS` y las seis de `ESPECIES`. Una función pura `personajeDe(estado, miembro)` devuelve la clave: el propietario es `protagonista`, una persona con aspecto usa su aspecto y una mascota usa su especie.
- **Nueve cuadros por personaje**: vista `frente`, `espalda` y `lado` (mirando a la derecha), cada una con cuadro 0 (parado), 1 y 2 (pasos con cada pie). La vista `izquierda` no se guarda: la presentación voltea la de `lado`.
- **Claves de textura** `personaje:<clave>:<vista>:<cuadro>`, que se añaden al mismo atlas `arte` que ya construye `prepararArte` en `juego.js`; no se crea un segundo atlas ni se cambia el mecanismo.
- **Formato idéntico al de la 008**: lista de 16 cadenas de 16 caracteres con claves de la paleta y `.` transparente. La paleta es la de `paleta.js`; si hace falta un color nuevo se amplía en ese único lugar y se actualiza la prueba que fija el total.
- **Las proporciones se dibujan, no se escalan**: el niño y la niña son figuras más bajas dentro de la casilla; `escalaDe` deja de usarse en el mapa.
- **La dirección en la que mira un personaje no entra en el modelo ni en el documento guardado**: la deduce el renderizador del desplazamiento entre casillas (y del `jugador.direccion` del jugador).
- **Cuál de los tres cuadros se ve** lo decide una función pura (`cuadroDeCaminar`) que se prueba sin Phaser; el detalle de las fases se fija en la spec.

## Consequences

**Más fácil:**
- Retocar un rasgo (un peinado, un color de camisa) y verlo en todos los cuadros, con un diff pequeño.
- Probar sin Phaser que los 14 personajes tienen sus 9 cuadros, que miden 16×16, que usan solo la paleta y que los cuadros de paso se diferencian del de reposo.
- Reutilizar el patrón "módulo de rasgos que produce cuadrículas" en la feature 010 para los estados del hogar y los iconos.
- Portar el arte a otro motor: sigue siendo texto de 16×16, y la composición es JavaScript sin dependencias.

**Más difícil:**
- La figura base de las personas fija la silueta de todos; un personaje con una forma muy distinta (una silla de ruedas, por ejemplo) exigiría ampliar la función o añadir un caso especial.
- Las seis mascotas siguen siendo trabajo individual; el ahorro de la composición se concentra en las siete personas y el protagonista.
- El arte ya no se puede leer píxel a píxel en el archivo: hay que ejecutar el módulo (o mirarlo en el juego, con los hogares de prueba) para ver un cuadro.

**A revisar si este ADR es reemplazado:** si se pasa a arte dibujado en un editor de píxeles (Option B de la 008), o si la figura base resulta demasiado limitante para los aspectos que se añadan. Un cambio así solo reemplazaría la generación de cuadros de `personajes.js` y la conversión a texturas en `juego.js`; `personajeDe`, `cuadroDeCaminar`, el modelo, el generador y el formato guardado no cambiarían.
