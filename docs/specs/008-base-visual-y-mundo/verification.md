# Verificación: 008 Base visual y mundo

**Fecha:** 2026-10-10
**Rama:** `feat/008-base-visual-y-mundo`
**Estado:** automática y en navegador de escritorio completas; **pendiente la verificación en el teléfono Android** (la hace quien decide el producto).

## Pruebas automáticas

`cd poc && npm test` → **367 pruebas, 0 fallos** (346 anteriores + 21 nuevas: 2 de contrato del arte, 7 de `arte.test.js`, 10 de `casillas.test.js` y 2 de `tipografia.test.js`). La prueba exhaustiva de las 7.560 combinaciones permitidas (`casillas.test.js`) tarda unos 0,8 s.

`git diff --stat main -- poc/src/{catalogo,hogar,distribucion,posicion,almacen,movimiento,actividades,historial,intercambios,rutinas}.js` → sin cambios: el generador y el dominio no se tocaron. La huella de las 7.560 distribuciones (AC-9.3 de la 004) sigue pasando sin cambios (AC-3.8, AC-4.7, AC-5.4, AC-10.2, AC-10.4).

## Navegador de escritorio (panel del navegador de la app, viewport 375×812 y escritorio)

| Comprobación | Resultado |
|---|---|
| `Phaser.GameObjects.RenderTexture.prototype.batchDrawFrame` | existe (`function`); no hizo falta el plan B |
| Tiempo de preparación del arte (AC-9.5) | **1 ms** (meta: menos de 300 ms) |
| Errores en la consola | ninguno |
| Suelos y paredes (AC-2.1 a AC-2.8, AC-3.9) | cada tipo de espacio se reconoce por su suelo (madera en sala y comedor, damero en cocina, azulejo en baño, alfombra rosa en dormitorio, lavanda en oficina, piedra en pasillo); paredes de frente y desde arriba se distinguen; puertas como suelo; sin costuras visibles a simple vista |
| Mobiliario (AC-4.2, AC-4.3, AC-4.8) | sofá, cama, cocina, baño y demás se ven como piezas; los de varias casillas, como un objeto |
| Capas (AC-5.1, AC-5.2, AC-5.5) | los objetos del suelo, las insignias (`!`, `!!`, `✓`), las burbujas con emoji, el cartel y los habitantes (rectángulos) siguen encima del mundo nuevo y en su orden |
| Letra en el mapa (AC-6.1 a AC-6.3) | etiquetas, insignias y cartel en Silkscreen; la etiqueta de quien juega conserva su fondo amarillo |
| Pestañas a 375 px (AC-7.1, AC-7.2) | las cuatro caben; «Intercambios (20)» se parte en dos líneas (19 px de alto) y no se sale de su pestaña |
| Título del drawer (AC-7.3) y formularios (AC-7.4) | título en Silkscreen; filas, botones y campos con la fuente del sistema |
| Letras ausentes en Silkscreen (AC-6.5, AC-6.6) | solo `✓` (se dibuja con la fuente del sistema); tildes, ñ, `¿` y `¡` existen |
| Sin servidores externos (AC-8.1) | las únicas peticiones son `localhost`, `cdnjs.cloudflare.com` (Phaser) y `assets/fonts/silkscreen-latin.woff2` |
| Respaldo sin fuente (AC-8.3) | con el archivo ausente, la fuente queda en estado `error`, el juego abre y se usa con la fuente del sistema, sin pantalla en blanco |
| Redibujo en edición (AC-9.2) | 3 a 7 ms al agregar espacios hasta el hogar más grande permitido (meta: menos de 100 ms; la 007 medía 62,7 ms con la carga completa) |
| Cuadros por segundo | 86 a 120 fps en el navegador de escritorio |

## Ronda 2: evidencia que faltó en la primera revisión (2026-10-10)

La primera pasada de `sdd-review` no halló desvíos de código, pero pidió evidencia en el navegador de escritorio que faltaba. Se recogió así:

| Comprobación | Resultado |
|---|---|
| **Pestañas a 360 px (AC-7.2)** | con el viewport emulado a 360×800 las cuatro pestañas caben, también con «Intercambios (20)» en dos líneas |
| **Carga completa en escritorio (AC-9.2, AC-9.6)** | hogar con 21 espacios, 8 familiares y el propietario, 4 mascotas, 50 actividades pendientes y 200 entradas de historial (armado con las funciones del dominio): movimiento **105 a 120 fps** durante 30 s con todos caminando; redibujo de edición al agregar y quitar espacios **7,5 a 11,7 ms** (meta 100 ms; la 007 medía 62,7 ms); arte **1 ms** |
| **Nitidez (AC-9.1, riesgo D3)** | en un Phaser aparte se reprodujo la secuencia de la escena (textura de render de 16×16, filtro NEAREST, `resize` a 528×176 y `clear`): el `scaleMode` sigue en NEAREST y los parámetros GL de mínimo y máximo también, antes y después del `resize`. Capturas en exploración y en edición: píxeles nítidos |
| **Orden de carga de la fuente (AC-8.2)** | por construcción (`await esperarFuente()` antes de `new Phaser.Game`, `juego.js:505`) y con varias recargas: la fuente figura `loaded` y las primeras capturas ya muestran Silkscreen |
| **Toque en el mapa (AC-5.3)** | el código de toques no cambió; en edición con la sección «Espacios», tocar el mapa abrió la ficha del espacio («Sala 1») |
| **Etiqueta de tamaño constante (AC-6.7)** | el mecanismo `setScale(1 / zoom)` no cambió; el texto se ve del mismo tamaño en exploración (zoom 3) y en edición |
| **Hogar guardado de una versión anterior (AC-10.1, AC-10.2)** | un documento `version: 6` (con familiar, mascota «perro» y una actividad) se abrió sin aviso y con el arte nuevo; el documento sigue en `version: 6` hasta el siguiente cambio, como antes de esta feature |
| **Posición guardada (AC-10.3)** | `posicion.js` y `distribucion.js` no cambiaron (diff vacío) y sus pruebas pasan; la comprobación manual no fue concluyente porque el canvas no recibió las flechas del teclado en la prueba automatizada |

> Un primer intento con un documento v6 «de carga completa» dio el aviso «No se pudo recuperar tu hogar guardado» porque incluía mascotas «conejo» y «loro», especies que la versión 6 no admitía (error de la prueba, no del producto); con un v6 válido se abrió sin aviso.

## Límites aceptados y pendientes

- **Tamaño de la letra del mapa (decisión pendiente, riesgo 1 de la spec):** `TAM_LETRA_MAPA = '12px'`. Con ese tamaño, en modo edición con el zoom bajo y varios espacios, los nombres largos («Espacio de mascota 1», «Lavandería 1») son más anchos que su espacio y se salen por el borde de la pantalla o se acercan a los vecinos. En la versión anterior (fuente del sistema) también eran más anchos que el espacio, pero unos 30 % menos. Quien decide el producto debe juzgarlo en el teléfono y, si hace falta, cambiar `TAM_LETRA_MAPA` en `poc/src/juego.js` (8 px es el tamaño nativo de la fuente y el más corto; 16 px, el más legible y el más ancho). No se probó un cambio en vivo porque el juego no expone la escena al navegador.
- **Con la carga completa en modo edición, las etiquetas de nombre en Silkscreen de 12 px se amontonan** (junto a las burbujas de 50 actividades): las más largas se cortan por el borde de la pantalla y se pisan con las vecinas. Es el mismo caso que el riesgo 1 de la spec; el tamaño lo decide quien ve el teléfono.
- **Verificación en el teléfono Android:** pendiente (pasos 2, 3, 5, 7 y 10 del plan: suelos, mobiliario, letra, pestañas y nitidez a simple vista, más fps, `regen` y `arte` en el dispositivo de referencia con la carga completa). En escritorio la carga completa ya se midió (ver «Ronda 2»).
- **Dibujos:** son la primera versión de las cuadrículas; los ajustes visuales posteriores se hacen en `poc/src/arte/` sin tocar el resto.
- El símbolo `✓` de la insignia «limpio» se dibuja con la fuente del sistema hasta la feature 010 (decisión (e) de la spec).
- `distribucion.test.js` conserva dos importaciones sin uso (`cuartosEnOrden`, `eliminarEspacio`) tras mover el generador a `ayuda.js`; es inocuo.
