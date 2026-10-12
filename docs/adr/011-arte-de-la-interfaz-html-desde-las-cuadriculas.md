# ADR-011-arte-de-la-interfaz-html-desde-las-cuadriculas: El arte de la interfaz HTML sale de las cuadrículas y la paleta

**Status:** Accepted
**Date:** 2026-10-10
**Feature:** 011-iconos-propios-y-recolor

## Context

La feature 011, la última del plan de arte (ver el [PRD de la 008](../specs/008-base-visual-y-mundo/prd.md) y el [de la 010](../specs/010-estados-de-limpieza/prd.md)), da iconos propios a la interfaz y recolorea el HTML con la paleta. Hasta ahora el arte vive en `src/arte/` como cuadrículas de texto de 16×16 con una paleta única de 32 colores, y solo lo consume Phaser, que lo pinta en una hoja de texturas al arrancar ([ADR-008](008-arte-cuadriculas-con-paleta.md)). La interfaz HTML (barra inferior, drawers, fichas, selector de iconos, cruceta) **no consume nada de ese arte**:
- Los iconos de la barra (`secciones.js`), de las actividades (`GLIFO_ICONO` en `juego.js`) y de los habitantes (`DATOS_ASPECTO` y `DATOS_ESPECIE` en `catalogo.js`) son emoji del sistema, que se ven distinto en cada teléfono.
- Los colores de `index.html` (marrón `#2a221c`, crema `#f2ead3`, rojo `#a32d2d`, entre otros) están escritos a mano y no pertenecen a la paleta.
- Las burbujas, las insignias de estado y las estrellas son texto con emoji o símbolos.

Lo decidido en el brainstorm con muestras dibujadas con la paleta real: iconos **a color con contorno oscuro** (como los muebles del mundo), recolor del HTML estilo **marco de videojuego** (esquinas cuadradas, borde oscuro grueso, sombra dura, Silkscreen en títulos y botones) y los **personajes de la 009 como avatar** de familiares y mascotas.

Falta decidir **cómo llega ese arte al HTML** (hoy solo hay un camino para Phaser, no para el DOM) y **de dónde salen los colores del CSS**. Restricciones que pesan:
- Reglas del proyecto: los módulos de `src/arte/` son datos y funciones puras, sin Phaser ni DOM, y ni el dominio ni el generador los importan (`javascript.md`); el arte son cuadrículas de la paleta, nunca PNG importados ni arte de terceros (`phaser.md`, ADR-008); el PoC no tiene dependencias ni paso de compilación.
- Rendimiento: movimiento a 60 fps o más y `regen` sin empeorar (45,3 ms en el teléfono con la 009; 24,9 ms con la 010); la preparación de texturas al arrancar tardó 4 ms en escritorio y debe seguir por debajo de 300 ms con el arte nuevo.
- Hay listas largas en el drawer (hasta 50 actividades pendientes y 200 entradas de historial, cada fila con un icono y, en el historial, estrellas): el icono se repite cientos de veces.
- Las burbujas de actividades del mapa viven en Phaser y deben mostrar el mismo icono que el resto.
- Una sola fuente de verdad para los colores: la paleta de `paleta.js`.

## Options Considered

### Option A: Canvas a imagen al arrancar, y variables CSS desde la paleta

Un módulo de presentación nuevo (con acceso al DOM, fuera de `src/arte/`) pinta cada cuadrícula en un canvas de 16×16 una sola vez al arrancar y guarda el resultado como imagen (URL de datos) por clave. La interfaz usa `<img>` o fondo CSS con `image-rendering: pixelated`, a la escala que necesite cada lugar. Los colores del CSS son variables (`--k`, `--z`…) que ese mismo módulo fija en `:root` a partir de la paleta, con una función pura que las calcula y se prueba sin DOM. Los iconos de las burbujas y las insignias del mapa se añaden a la hoja de texturas de Phaser que ya existe.

**Pros:** el arte sigue siendo datos puros (ADR-008) y una sola fuente de verdad, la paleta, para el mundo, los personajes, los iconos y el CSS; el costo es de una sola vez (decenas de canvas diminutos) y cada icono se reutiliza como imagen ya decodificada en cualquier cantidad de filas; no hay dependencias ni compilación; es el mismo camino para todo el HTML, y la función de variables CSS se prueba sin DOM.
**Cons:** hay un módulo de presentación nuevo que mantener; si el CSS se carga antes que el módulo, hay un instante sin colores hasta que se fijan las variables (se resuelve ocultando la interfaz hasta entonces o dando un fondo mínimo de respaldo); las imágenes no heredan el color del texto, por lo que los iconos son siempre a color (que es lo decidido).

### Option B: SVG en línea generado de la cuadrícula

Cada icono se convierte en un `<svg>` con un `<rect>` por píxel (o por tramo de píxeles iguales) y se inserta en el DOM donde haga falta; los colores se toman de la paleta o de `currentColor`.

**Pros:** escala sin pérdida a cualquier tamaño y puede heredar color con `currentColor` (útil si los iconos fueran monocromos); no necesita canvas.
**Cons:** un icono de 16×16 puede llevar decenas de `<rect>` incluso agrupando tramos, y se repite en cada fila de una lista de hasta 250 elementos, lo que multiplica los nodos del DOM en un teléfono; los iconos de Phaser seguirían necesitando otro camino; el heredar el color no aporta nada porque se eligieron iconos a color; el recolor de la interfaz seguiría necesitando su propio mecanismo para los colores del CSS.

### Option C: PNG o hoja de sprites exportada a mano

Los iconos se dibujan en una herramienta externa y se guardan como archivos `.png` en `assets/`, y el CSS usa colores copiados a mano.

**Pros:** el camino más corto para el HTML (`<img src>`); cualquier herramienta de dibujo sirve.
**Cons:** es arte importado, descartado por el ADR-008 y por `phaser.md`; los colores quedan duplicados y se desvían de la paleta sin que ninguna prueba lo detecte; el arte ya no se puede probar headless (16×16, solo claves de la paleta); más archivos que cargar y que cambiar si se amplía la paleta.

## Decision

**We chose Option A (canvas a imagen al arrancar y variables CSS desde la paleta)** porque es la única que cumple a la vez las reglas del proyecto y el rendimiento en listas largas. El PRD pide que los iconos, los avatares y los colores de la interfaz salgan de la paleta única sin arte importado (descarta C), y que las listas de hasta 250 filas sigan fluidas en el teléfono: una imagen ya decodificada reutilizada en cada fila no añade nodos al DOM, mientras que el SVG en línea (B) añade decenas por icono. El heredar color de B no se aprovecha porque los iconos son a color.

Reglas que fija la decisión:

- **Los dibujos nuevos son datos puros en `src/arte/`:** un módulo `iconos.js` con las cuadrículas de 16×16 de los iconos (barra, actividades, insignias de estado, estrellas, fecha y flechas de la cruceta), sin importar Phaser ni el DOM, y que ni el dominio ni el generador importan. Se prueban sin DOM: 16×16, solo claves de la paleta y una entrada por cada clave de `ICONOS`.
- **El módulo de presentación nuevo** (nombre y detalle en la spec y el plan) convierte cuadrículas en imágenes y fija las variables de color; vive junto a `juego.js`, no en `src/arte/`. Solo contiene la conversión y la escritura de variables: ninguna regla de negocio.
- **Los colores del CSS** son variables derivadas de `PALETA` por una función pura y probada; el CSS de `index.html` solo usa esas variables (también con alfa para los velos), nunca colores propios.
- **Los avatares** de familiares y mascotas usan el cuadro de frente de su personaje, pintado desde las cuadrículas de `personajes.js` con `personajeDe` por el mismo camino que los iconos (no desde la textura de Phaser), sin dibujos nuevos de habitantes.
- **Los iconos de las burbujas y las insignias del mapa** se añaden a la hoja de texturas de Phaser (`prepararArte`), no se pintan aparte.
- **Los emoji y símbolos-icono** (🏠 🍽️ 📅 ★ ▲ ✓…) dejan de usarse en la interfaz y en el mapa. Los de `DATOS_ASPECTO` y `DATOS_ESPECIE` (`catalogo.js`) y `INSIGNIAS` (`aspecto.js`) se quedan, sin uso en la presentación, porque los fijan pruebas de contrato anteriores; `SECCIONES.icono` pasa a ser la clave del icono y `resumenDeFicha` pierde el prefijo 📅 (ajustes mínimos de sus pruebas).
- **No se guarda nada nuevo:** las claves de `icono` de las actividades guardadas no cambian y el formato sigue siendo `version: 7`.

## Consequences

**Más fácil:**
- Tener un solo sitio donde se define cualquier color o dibujo de la aplicación (la paleta y `src/arte/`), con pruebas headless que lo comprueban.
- Cambiar o ampliar la paleta y ver el efecto en el mundo, los personajes, los iconos y el CSS a la vez.
- Portar el arte de los iconos y los avatares a otro stack: son cuadrículas de texto, igual que el resto.

**Más difícil:**
- Los iconos son imágenes de tamaño fijo y a color: un tema monocromo o un icono que herede el color del texto requeriría otro camino (por ejemplo, SVG, Option B) para esos iconos.
- Hay un módulo de presentación con DOM que mantener y un orden de arranque que cuidar (variables antes de pintar la interfaz).
- El avatar depende de que existan los cuadros de frente de los 14 personajes; un personaje nuevo en la 009 se vería en las listas sin tocar nada, pero un hueco en esa hoja dejaría el avatar vacío (la spec fija el respaldo).

**A revisar si este ADR es reemplazado:** si el stack oficial trae un sistema de iconos y temas propio, o si el costo de las imágenes en el teléfono (arranque o memoria con el hogar completo) no cumple los criterios de la feature.

## Actualización (2026-10-11, spec 2.0.0)

Tras la prueba en el teléfono, las cuatro flechas de la cruceta de movimiento dejaron de ser iconos: mantener pulsada una imagen para caminar activaba la selección y la descarga de la imagen del navegador. El catálogo queda en **19 iconos** (sin `flecha:*`), la cruceta usa los símbolos ▲ ◀ ▶ ▼ como texto con un fondo semitransparente derivado de la paleta (`--cruceta-fondo`), y todas las imágenes de la interfaz son no seleccionables y pasan el toque a su contenedor. La decisión de fondo (canvas a imagen al arrancar y variables CSS desde la paleta) no cambia. Consecuencia añadida a la sección anterior: un control que se mantiene pulsado no debe ser una imagen.
