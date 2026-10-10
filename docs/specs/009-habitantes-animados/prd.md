# PRD: Habitantes animados

**Date:** 2026-10-10
**Feature:** 009-habitantes-animados

## Problem

Tras la 008 el hogar ya parece un videojuego GBA, pero las personas y las mascotas que lo habitan siguen siendo rectángulos de color: las personas de 12×14 px, las mascotas de 8×8, y el jugador se gira como un cuadrado con `setAngle`. No se distingue un niño de un adulto más que por el tamaño, ni un perro de un gato más que por el color, y nadie camina: se deslizan. Es lo que más desentona con el mundo nuevo, y la fundación del proyecto promete una casa viva (principio 3: que cada cosa se reconozca de un vistazo).

Esta es la segunda de las tres features de arte (ver la hoja de ruta del [PRD de la 008](../008-base-visual-y-mundo/prd.md)): da su cara y su caminar a **todos los que viven en el hogar**.

## Users & Context

**Usuarios de la v1:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, como en las features 001 a 008.

**Qué se ve hoy (verificado en `juego.js` y `catalogo.js`):**
- Hay **14 "tipos de personaje"** en juego: el **propietario** (que desde la 007 no tiene aspecto y se dibuja rosa), los **7 aspectos** de un familiar (`adulto`, `adulta`, `nino`, `nina`, `anciano`, `anciana`, `neutro`) y las **6 especies** de una mascota (`perro`, `gato`, `conejo`, `hamster`, `loro`, `otro`).
- Cada habitante se mueve con un tween de 500 ms por casilla (2 casillas por segundo); el jugador, 250 ms por casilla. El modelo mantiene `direccion` solo durante un tramo al azar y no la actualiza cuando el habitante sigue una ruta (`seguirRuta`); el jugador sí guarda la suya.
- Las etiquetas de nombre, las burbujas, las insignias y el cartel "n fuera" ya están resueltos por las features anteriores; los toques se resuelven por casilla (`ocupanteEn`), no por el área del sprite.

**Dirección de arte (decidida en el brainstorm, con muestras dibujadas con la paleta real):**
- **Pixel art de 16×16, una casilla** por personaje, con la paleta de la 008. Las personas se ven "cabezonas" y legibles en el teléfono; el niño y la niña se dibujan más bajos, no escalados. Las mascotas se dibujan de lado.
- **Caminar en cuatro direcciones**: tres vistas dibujadas (frente, espalda y lado) y la izquierda como la derecha volteada. Cada vista tiene **parado y dos pasos**, de modo que el ciclo es parado, paso, parado, paso con el otro pie.
- **Reparto aprobado:** el *protagonista* (el propietario) con gorra rosa; adulto en azul; adulta en amarillo con pelo largo; neutro en lavanda; niño más bajo; niña con coletas; anciano con pelo gris y bastón; anciana con pelo gris y moño; perro, gato, conejo, hámster, loro y «Otro» (un bichito redondo genérico). Los detalles se afinan en la spec y al dibujar.

**Estado de la 008:** está mergeada y subida, verificada en escritorio; faltan su verificación en el teléfono y la decisión del tamaño de la letra del mapa (`TAM_LETRA_MAPA`). La 009 se diseña sobre la 008 tal como está y no depende de esa decisión; su verificación en el teléfono puede hacerse junto con la de la 008.

**Sistemas existentes que toca:**
- El **dibujo de los habitantes y del jugador** en `juego.js` (`sincronizarSprites`, `moverHabitantes`, `colocarPersonaje`, `mover`): los rectángulos pasan a ser imágenes del atlas `arte`, con la misma profundidad, las mismas etiquetas y la misma regla de que quien está "fuera" no se ve.
- `colorDe` y `escalaDe` (color y escala de marcador): dejan de usarse en el mapa.
- La **preparación del atlas** (`prepararArte`): recibe los cuadros de los personajes.
- **No se tocan:** el modelo, el generador, el movimiento (`movimiento.js`), las rutinas, los intercambios, el historial, el formato guardado (sigue `version: 7`), los objetos del suelo, las insignias, las burbujas con emoji y los colores de la interfaz HTML.

**Plataforma.** El PoC web sigue siendo desechable y el stack oficial no está decidido; por eso el arte sigue siendo datos independientes del motor (ADR-008 y ADR-009). Toda la interfaz y los documentos siguen en español.

## Goals

**Los 14 personajes**
- Cada uno de los 14 tipos de personaje tiene un **dibujo propio de 16×16 y 9 cuadros**: tres vistas (frente, espalda y lado) por parado y dos pasos. Entre los 14 se distinguen de un vistazo, y los siete aspectos se reconocen por rasgos y no solo por el color.
- Qué personaje usa cada miembro lo decide una regla pura: el propietario es el protagonista; una persona usa su aspecto; una mascota usa su especie. Cambiar el aspecto o la especie en la ficha cambia el dibujo al guardar.

**Caminar**
- Quien camina muestra la vista de su dirección (la izquierda es la de lado volteada) y alterna parado y paso con cada pie mientras recorre una casilla; al llegar o quedarse quieto se ve parado, mirando hacia donde iba. Aplica a habitantes (autónomos y en ruta) y al jugador, cada uno a su velocidad.
- La dirección se deduce en el renderizador del desplazamiento entre casillas (y del jugador, de su propia dirección). No se guarda ni cambia el modelo.
- En modo edición nadie camina: todos se ven parados, mirando donde miraban. Quien aparece (por ejemplo, al volver de fuera) lo hace parado y mirando de frente.

**Convivencia con lo existente**
- Los sprites mantienen sus capas (personajes sobre el mundo y los objetos del suelo; quien va en ruta debajo de quien pasea), sus etiquetas de nombre sobre la cabeza y el resalte de quien juega. Los toques en modo edición siguen resolviéndose por casilla.

**Hogares de prueba**
- Dos hogares de prueba válidos, armados con las operaciones reales del modelo, que juntos incluyen **a los 14 personajes**: el primero con el protagonista, los seis aspectos de género y edad y cuatro mascotas (perro, gato, conejo, hámster); el segundo con el neutro, el loro y «Otro». Se cargan en el navegador con el método ya conocido (importar los módulos y sembrar `localStorage`), y las instrucciones quedan en el registro de verificación. Una prueba comprueba que son válidos y que entre los dos cubren los 14.

## Non-Goals

- Estados de limpieza dibujados en el mapa, objetos del suelo en pixel art, iconos propios, insignias y burbujas con arte, y recolor de la interfaz HTML (feature 010).
- Animaciones de reposo (respirar, parpadear), de acciones (limpiar, dormir, sentarse) o de emociones.
- Personalización individual: dos familiares con el mismo aspecto se ven iguales; solo el nombre los distingue.
- Nuevos aspectos o especies, o cambios en las listas y límites del modelo.
- Cambios en el movimiento, las rutas, la velocidad, las colisiones o las reglas de aparición.
- Cuatro vistas dibujadas por separado (izquierda y derecha propias), sombras bajo los personajes y sprites más grandes que la casilla.
- Una herramienta o galería para revisar el arte (se revisa en el juego con los hogares de prueba).
- Cambios en el formato guardado o migraciones.
- Arte importado (PNG, hojas de sprites o paquetes de terceros).

## Success Criteria

**Cobertura del arte (automático, sin Phaser):**
- Los 14 personajes tienen sus 9 cuadros; cada uno mide 16×16, usa solo claves de la paleta y no está vacío.
- Los cuadros de paso se diferencian del de reposo y entre sí; las tres vistas de un personaje se diferencian; ningún par de personajes comparte el cuadro de reposo de frente.
- Todo miembro posible (el propietario, cada uno de los 7 aspectos y cada una de las 6 especies) obtiene un personaje.
- La elección del cuadro según el avance del paso es determinista y cubre reposo, paso con cada pie y la alternancia de pie entre casillas.
- Los dos hogares de prueba son válidos para el validador del formato `version: 7` y juntos incluyen a los 14 personajes.
- Las suites de las features 001 a 008 siguen pasando sin cambios (367 pruebas) y el formato guardado no cambia.

**En el navegador de escritorio y en el teléfono (con los hogares de prueba, y con un hogar completo de 8 familiares, 4 mascotas, 50 pendientes y 200 entradas):**
- Los 14 personajes se reconocen en exploración: se distingue un niño de un adulto, un anciano de un adulto, y cada especie de las demás.
- Al caminar se ven las cuatro direcciones, con el cambio de pie y sin saltos ni parpadeos al girar, al llegar o al reaparecer; el jugador y los habitantes caminan a su velocidad.
- Con 12 personajes en movimiento, el juego se mantiene a 60 fps o más.
- Preparar el atlas al arrancar, ya con los cuadros de personajes, tarda menos de 300 ms (se mide y se registra).
- El redibujo en modo edición sigue por debajo de 100 ms y no empeora los 62,7 ms de la 007 ni lo medido en la 008.
- Las etiquetas, las burbujas, el resalte de quien juega, el cartel "n fuera" y los toques funcionan como antes.

## Architecture Decisions

- [Los personajes como figuras compuestas por piezas, con tres vistas y la izquierda volteada](../../adr/009-personajes-compuestos-por-piezas.md) — cada personaje se genera desde rasgos con nombre (personas) o una función por especie (mascotas), exporta texto de 16×16 con la paleta de la 008 y guarda 9 cuadros; la izquierda es la derecha volteada en la presentación.

Decisiones menores que se quedan aquí, sin ADR (locales a la capa de presentación y fáciles de revertir):
- **La dirección no se guarda en el modelo.** Se deduce del desplazamiento en el renderizador. Se descartó añadirla a `movimiento.js`: obligaría a tocar la 002 y la 004 (el modelo mantiene `direccion` solo durante un tramo y no la actualiza en ruta) para un dato que solo usa la presentación.
- **El cuadro lo decide una función pura** (`cuadroDeCaminar`), para probarlo sin Phaser; la spec fija las fases de cada casilla y la alternancia de pie.
- **El protagonista es un dibujo propio** (el propietario no tiene aspecto), en vez de reutilizar el neutro con ropa rosa; conserva la identidad rosa de hoy.
- **Los hogares de prueba** viven como módulo de ayuda en `poc/test/` y no forman parte de la aplicación.
- **La paleta** de 32 colores alcanza para las muestras aprobadas; si al dibujar hace falta algún color, se amplía en `paleta.js` y se actualiza la prueba que fija el total.

## Out of Scope

- Cualquier cosa de la feature 010 de la hoja de ruta (estados de limpieza, objetos del suelo, iconos propios, recolor de la interfaz HTML).
- Animaciones de reposo y de acciones; personalización individual de los personajes.
- Una galería o herramienta de vista previa del arte.
- Sombras bajo los personajes, sprites más altos que la casilla y las cuatro vistas dibujadas por separado.
- Cambios en el modelo, el generador, el movimiento o el formato guardado.
- Arte importado y paquetes de terceros.
- Resolver el tamaño de la letra del mapa y la verificación de la 008 en el teléfono (siguen pendientes de la 008).
