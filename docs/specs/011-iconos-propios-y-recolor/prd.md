# PRD: Iconos propios y recolor de la interfaz

**Date:** 2026-10-10
**Feature:** 011-iconos-propios-y-recolor

## Problem

Tras la 008 a la 010 el mapa del hogar se ve como un videojuego GBA en pixel art, pero **todo lo que rodea al mapa sigue sin pertenecer a ese mundo**: la barra inferior, los drawers, las fichas y las burbujas usan emoji del sistema (que se ven distinto en cada teléfono) y una interfaz de marrón y crema que no sale de la paleta del juego. Las insignias de estado (✓ ! !!) son cuadros de texto de color y las estrellas del historial son los símbolos ★ ☆. El resultado es una pantalla de dos estilos: un mapa de pixel art y una interfaz HTML genérica.

Esta es la cuarta y última pieza del plan de arte (ver el [PRD de la 008](../008-base-visual-y-mundo/prd.md); la 010 movió aquí los iconos y el recolor, [PRD de la 010](../010-estados-de-limpieza/prd.md)): da **iconos propios** y **aspecto de videojuego a la interfaz HTML**, con la misma paleta y el mismo lenguaje de contorno oscuro del mundo.

## Users & Context

**Usuarios de la v1:** las personas de un hogar que comparten un solo teléfono, sin cuentas ni conexión, como en las features 001 a 010.

**Decisiones de arte (tomadas en el brainstorm con muestras dibujadas con la paleta real):**
- **Iconos a color con contorno oscuro**, como los muebles del mundo (se descartó el monocromo de una sola tinta).
- **Recolor «marco de videojuego»** para toda la interfaz HTML: esquinas cuadradas, borde oscuro grueso, sombra dura, botones con relieve y Silkscreen en títulos y botones (se descartaron «misma forma con colores de la paleta» y la mezcla con iconos monocromos).
- **Los personajes de la 009 como avatar** de familiares y mascotas en la lista de Familia y en el selector de aspecto y especie, en vez de emoji. Los círculos de responsable (inicial y color de cada miembro) no cambian.
- Los dibujos de las muestras eran **bocetos** para decidir el estilo; el arte final se dibuja en la implementación con la paleta de 32 colores y se afina en la spec y al dibujar. Los valores por defecto que quien decide el producto no listó (insignias y flechas de la cruceta dibujadas, recolor en toda la interfaz) se aceptaron en el brainstorm.

**Qué hay hoy (verificado en `index.html`, `juego.js`, `secciones.js`, `catalogo.js` y `aspecto.js`):**
- **Barra inferior:** 4 pestañas con emoji (🏠 👨‍👩‍👧 📋 🔄), en `secciones.js`.
- **Actividades:** 9 claves de icono (`platos`, `barrer`, `ropa`, `basura`, `limpiar`, `compras`, `plantas`, `mascota`, `otra`) con su emoji en `GLIFO_ICONO` de `juego.js`, usadas en las burbujas del mapa, las listas, los chips de sugerencias, el selector de iconos y el historial.
- **Habitantes:** emoji de aspecto y de especie en `DATOS_ASPECTO` y `DATOS_ESPECIE` (`catalogo.js`) y un emoji de respaldo; usados en la lista de Familia y en el selector de aspecto y especie.
- **Insignias de estado:** ✓ ! !! (`INSIGNIAS` en `aspecto.js`), en cuadros de texto con color de fondo junto al nombre de cada espacio.
- **Otros símbolos:** estrellas ★ ☆, fecha 📅 en la línea-resumen de la ficha, flechas ▲ ◀ ▶ ▼ de la cruceta.
- **CSS de `index.html`:** un centenar de reglas con colores escritos a mano (marrón `#2a221c`, crema `#f2ead3`, rojo `#a32d2d`, entre otros) que no pertenecen a la paleta; tipografía Silkscreen solo en la barra y los títulos de los drawers (008).
- **Arte:** `src/arte/` solo lo consume Phaser; la interfaz HTML no usa nada de él.

**Sistemas existentes que toca:**
- Un módulo nuevo de datos `src/arte/iconos.js`; la preparación del arte (`prepararArte` en `juego.js`) para los iconos de las burbujas y las insignias del mapa, que entran en la hoja de texturas; un módulo de presentación nuevo para llevar las cuadrículas al HTML; `index.html` (hoja de estilos y símbolos), `secciones.js`, `formularios.js` y las listas y fichas de `juego.js`.
- **Tres módulos puros con texto-icono fijado por pruebas anteriores** (decisión del brainstorm, ajustes mínimos de esas pruebas): `SECCIONES.icono` (`secciones.js`, AC-1.1 de la 007) pasa de emoji a la **clave del icono** de la pestaña; `resumenDeFicha` (`formularios.js`) **pierde el prefijo 📅** y la presentación dibuja el icono de fecha antes del texto; `INSIGNIAS` (`aspecto.js`, contrato de la 003) **se deja como está y sin uso** en la presentación, igual que los emoji de `catalogo.js`.
- **No se tocan:** el modelo, el generador, las actividades, rutinas, intercambios e historial, el formato guardado (sigue `version: 7`), el mundo, los personajes y el estado de limpieza dibujado (008 a 010), ni las claves de `icono` de las actividades guardadas.

**Plataforma.** El PoC web sigue siendo desechable y el stack oficial no está decidido; por eso el arte sigue siendo datos independientes del motor (ADR-008). Toda la interfaz y los documentos siguen en español.

## Goals

**Iconos propios**
- Un juego de **23 iconos de 16×16** con la paleta única: 4 de la barra inferior (Espacios, Familia, Actividades, Intercambios), 9 de actividades (los de las claves de `ICONOS`), 3 insignias de estado (limpio, desordenado, desastre), 2 estrellas (llena y vacía), el de fecha y las 4 flechas de la cruceta. Contorno oscuro y colores de la paleta; se reconocen a ×2 y ×3.
- Los iconos se ven en **todos** los sitios donde hoy hay emoji o símbolo: barra, drawers, listas de actividades y de historial, chips de sugerencias, selector de iconos, fichas, línea-resumen, cruceta, insignias de espacio y burbujas del mapa. Ningún emoji ni símbolo-icono queda en lo que ve la persona; solo permanecen, sin uso en la presentación, los de `catalogo.js` y `INSIGNIAS`.
- Las burbujas del mapa muestran el icono de la actividad más atrasada del lugar, con el «+» de más actividades como texto, y siguen respondiendo al toque como hoy.
- Las insignias de estado del mapa son los iconos dibujados, junto al nombre del espacio, con el comportamiento de hoy (siguen a la etiqueta, también cuando esta se desplaza en exploración).

**Avatares**
- Los familiares y las mascotas se ven con el **cuadro de frente de su personaje** (el de la 009: el propietario es el protagonista, un familiar usa su aspecto y una mascota su especie) en la lista de Familia y en el selector de aspecto y especie, donde hoy hay un emoji. Los demás lugares que muestran a un miembro con texto (círculos de responsable, «¿Quién juega?», intercambios, historial) no cambian.
- El avatar se elige con la misma regla que el personaje del mapa, así que siempre coincide con él.

**Recolor de la interfaz**
- Toda la interfaz HTML (barra, drawers, hoja de lugar, fichas, selectores, modales, avisos, botones y la cruceta) usa **solo colores de la paleta**, como variables derivadas de `paleta.js`. No queda en el CSS ningún color propio: el blanco `#fff`, el negro y el crema de hoy pasan a colores de la paleta. La **transparencia** solo se permite como un color de la paleta con alfa (por ejemplo, el velo de los modales con el color de contorno); los botones de la cruceta pasan a ser opacos.
- Aspecto de **marco de videojuego**: esquinas cuadradas, borde oscuro grueso y sombra dura en los paneles y botones, relieve en los botones, Silkscreen en títulos y botones. Los campos de texto, las listas largas y la ficha de actividad siguen en la fuente del sistema (como en la 008). La disposición, los tamaños y el comportamiento de los controles no cambian; siguen siendo tocables con el pulgar (objetivo táctil como hoy).
- Los estados de un control (activo, pulsado, desactivado, peligro, error) se distinguen con la paleta, y el texto se lee con contraste suficiente sobre su fondo.

**Preparación y respaldo**
- Los dibujos se preparan **una sola vez** al arrancar; si algún icono o avatar no se puede dibujar, la interfaz sigue funcionando y muestra un respaldo neutro (el icono genérico `otra` en actividades, el personaje `neutro` en habitantes) sin errores.

## Non-Goals

- Iconos monocromos o que hereden el color del texto, y modo oscuro o temas intercambiables (los iconos son a color y de un solo juego).
- Dibujar de nuevo el mundo, los personajes, los muebles o los estados de limpieza (008 a 010), ni cambiar el estilo del mapa.
- Animaciones de la interfaz o de los iconos, sonidos o vibración.
- Cambios de disposición, de flujo o de textos de los formularios; nuevos controles o pantallas; avatares en los círculos de responsable, «¿Quién juega?», intercambios o historial.
- Cambios en el modelo, el generador, las actividades, las reglas o el formato guardado; en `catalogo.js` solo se deja de usar lo que estaba pensado como emoji.
- Más iconos de actividad que los 9 actuales, o iconos distintos para cada sugerencia (las sugerencias siguen compartiendo los iconos de su clave).
- Arte importado (PNG, hojas de sprites o fuentes de iconos de terceros) y una galería o herramienta para dibujar o revisar los iconos (se revisan en el juego).

## Success Criteria

**Cobertura del arte (automático, sin Phaser ni DOM):**
- Cada cuadrícula nueva mide 16×16, usa solo claves de la paleta y no está vacía.
- Cada clave de `ICONOS` (las 9, incluida la genérica `otra`), cada estado de limpieza (los 3), cada pestaña de la barra (las 4) y los demás símbolos de la lista (estrellas, fecha y flechas) tienen su icono; los 14 personajes tienen su cuadro de frente.
- Las variables de color del CSS se calculan de `PALETA` con una función pura, y `index.html` no contiene colores fuera de ellas (ni `#hex`, ni `rgb`/`rgba` salvo un color de la paleta con alfa).
- Elegir el avatar de un miembro es determinista y coincide con `personajeDe`; cualquier dato fuera de las listas cae en el respaldo.
- No quedan emoji ni símbolos-icono (🏠 🍽️ 📅 ★ ☆ ▲ ◀ ▶ ▼ ✓…) en `index.html`, `juego.js`, `secciones.js` ni `formularios.js`, ni en el módulo de presentación nuevo; quedan fuera de esta comprobación `catalogo.js` y `INSIGNIAS` de `aspecto.js`.
- Las suites de las features 001 a 010 siguen pasando (431 pruebas) con solo estos ajustes: la prueba AC-1.1 de `secciones` (la clave del icono en lugar del emoji) y las de `resumenDeFicha` (sin el prefijo 📅); el contrato de `INSIGNIAS` y los emoji de `catalogo.js` no cambian; el formato guardado no cambia.

**En el navegador de escritorio y en el teléfono (con un hogar completo de 8 familiares, 4 mascotas, 50 pendientes, 200 entradas y todos los espacios en desastre):**
- Cada sección de la barra, cada drawer, la hoja de lugar, las fichas (espacio, miembro, actividad, bloque, intercambio), el selector de iconos, el historial y las burbujas se ven con los iconos y el aspecto nuevos; los iconos de actividad se distinguen entre sí a ×2.
- Todo lo que funcionaba antes funciona igual: tocar una burbuja, elegir o cambiar un icono, calificar con estrellas, mover con la cruceta y cambiar de jugador.
- El movimiento se mantiene a 60 fps o más y el redibujo no empeora lo medido en la 010 (`regen` de 24,9 ms en el teléfono, y por debajo de 100 ms con la carga completa).
- Preparar todos los dibujos al arrancar (hoja de texturas y imágenes del HTML) tarda menos de 300 ms (se mide y se registra); las listas de 50 filas de actividades y 200 del historial se desplazan sin tirones.
- Las etiquetas, las insignias, el cartel «n fuera», el resalte de quien juega y los toques funcionan como antes; la tipografía Silkscreen y el tamaño de la letra del mapa (12 px) no cambian.

## Architecture Decisions

- [El arte de la interfaz HTML sale de las cuadrículas y la paleta](../../adr/011-arte-de-la-interfaz-html-desde-las-cuadriculas.md) — los iconos son cuadrículas de 16×16 en `src/arte/iconos.js`; un módulo de presentación las pinta una vez en canvas y las usa como imágenes en el HTML, los colores del CSS son variables derivadas de la paleta y los iconos de burbujas e insignias entran en la hoja de texturas de Phaser; se descartaron el SVG en línea y los PNG propios.

Decisiones menores que se quedan aquí, sin ADR (locales a la presentación y fáciles de revertir):
- **Los emoji del dominio** (`DATOS_ASPECTO.icono`, `DATOS_ESPECIE.icono` en `catalogo.js`) se dejan sin uso en la presentación y no se tocan, para no cambiar el dominio ni la prueba de contrato de la 007; si se quiere limpiar, es una decisión aparte.
- **El avatar** es el cuadro de frente en reposo (cuadro 0 de la vista `frente`) del personaje, a ×2 (32 px) en listas y selectores. Se pinta desde las cuadrículas de `personajes.js` con `personajeDe`, por el mismo camino que los demás iconos del HTML, no leyendo la textura de Phaser.
- **La cruceta y el cartel «n fuera»:** las flechas pasan a iconos; el texto «n fuera» y su «!» se quedan como texto en Silkscreen.
- **Tamaños:** los iconos se pintan en 16 px lógicos y se muestran a ×2 o ×3 (32 o 48 px) sin suavizado; el tamaño exacto por lugar se fija en la spec.
- **Orden de arranque:** las variables de color y las imágenes se preparan antes de mostrar la interfaz, para que no aparezca un instante sin estilo.

## Out of Scope

- Iconos monocromos, modo oscuro, temas y ajustes de arte desde la aplicación.
- Redibujar el mundo, los personajes o los estados de limpieza, y nuevos muebles o habitantes.
- Animaciones, sonido y vibración.
- Cambios de disposición, de flujo o de textos de las pantallas; nuevos controles.
- Cambios en el modelo, el generador o el formato guardado; limpiar los emoji de `catalogo.js`.
- Más iconos de actividad o iconos por sugerencia.
- Arte importado y paquetes de iconos de terceros; una galería o herramienta de arte.
