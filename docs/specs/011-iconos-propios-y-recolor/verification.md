# Verificación: 011 Iconos propios y recolor de la interfaz

**Fecha:** 2026-10-10
**Rama:** `feat/011-iconos-propios-y-recolor`
**Estado:** automática, escritorio y teléfono Android verificados (el teléfono el 2026-10-11, con y sin carga completa); solo quedan sin evidencia explícita algunos puntos visuales menores (ver «Sin evidencia explícita en el teléfono»).

## Pruebas automáticas

```bash
cd poc && npm test        # 456 pruebas, 0 fallos (431 de la 010 + 25 nuevas)
node --check src/juego.js && node --check src/imagenes.js    # sin salida
```

- Pruebas nuevas: `test/iconos.test.js` (AC-1.1 a AC-1.8, AC-3.2, AC-5.1 a AC-5.3), `test/colores.test.js` (AC-7.1, AC-7.7, AC-7.8, AC-7.9) y `test/interfaz-estatica.test.js` (AC-7.2 a AC-7.5, AC-9.5); más la AC-2.1 añadida a `test/secciones.test.js`.
- Pruebas ajustadas (AC-10.2): solo `secciones.test.js` (AC-1.1: la clave del icono en lugar del emoji) y `formularios.test.js` (AC-9.4 y AC-9.8: sin el prefijo de fecha).
- `git diff --stat main` sobre el dominio, el generador, el movimiento y los módulos de arte del mapa (`catalogo.js`, `hogar.js`, `almacen.js`, `distribucion.js`, `posicion.js`, `movimiento.js`, `rutas.js`, `rutinas.js`, `actividades.js`, `intercambios.js`, `historial.js`, `aspecto.js`, `paleta.js`, `texturas.js`, `mobiliario.js`, `suciedad.js`, `casillas.js`, `personajes.js`, `caminar.js`): sin cambios (FR-6, AC-10.2). El formato guardado sigue en `version: 7` (AC-10.1).
- Contraste de los pares de texto: todos por encima de 4,5 a 1 (AC-7.7, AC-7.9). El botón principal usa `i` sobre `j` (5,36) porque `g` sobre `j` daba 3,41.

## Hogares de prueba (cargar desde la consola del navegador)

Servir `poc/` sin caché: `cd poc && python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"`.

```js
const { hogarDePruebaDeEstados, hogarDePrueba1 } = await import('/test/hogares-de-prueba.js');
const { fechaLocal } = await import('/src/fechas.js');
localStorage.setItem('livin:datos:v1', JSON.stringify(hogarDePruebaDeEstados('desastre', fechaLocal(new Date()))));
// Para ver los avatares: JSON.stringify(hogarDePrueba1()) (seis aspectos y cuatro mascotas) y luego hogarDePrueba2().
localStorage.removeItem('livin:posicion:v1');
location.reload();
```

## Escritorio (navegador de la app, viewport de teléfono 375×812, 2026-10-10)

| Paso | Resultado |
|---|---|
| Arranque (AC-9.2, AC-9.5) | Sin errores en la consola. `arte 4 ms · ui 22 ms` (26 ms en total, menos de 300). `document.body.classList.contains('preparando')` es `false`. 37 imágenes preparadas (23 iconos + 14 avatares) y un solo `canvas` en la página (el de Phaser): no se crean canvas al navegar. |
| Barra y cruceta (AC-2.2, AC-6.4) | 4 iconos de pestaña a ×2 con rótulo en Silkscreen; 4 flechas de la cruceta; la barra mide 68 px. Fondo y barra con los colores de la paleta (`rgb(46, 34, 51)`). |
| Drawer Actividades (AC-3.1, AC-3.5) | 10 filas con su icono a ×2; botones «Pendientes / Hechas» y «+ Actividad» con marco, sombra dura y Silkscreen; sin esquinas redondeadas. |
| Selector de iconos de actividad (AC-3.3) | 9 opciones a ×3 (48 px), con la actual («Otra») marcada. |
| Ficha de actividad (AC-3.4, AC-3.6, AC-6.3) | Botón de icono con su imagen; 6 chips de sugerencias con su icono a 16 px; línea-resumen con el icono de fecha y el texto «Hoy · Una vez · Sin lugar». |
| Familia y avatares (AC-5.4, AC-5.5) | Las 10 filas llevan avatar (el cuadro de frente del personaje); el botón de icono de la ficha del habitante muestra el avatar; el selector de aspecto muestra los 7 avatares a ×2 con el actual marcado. |
| Historial y estrellas (AC-6.1) | La fila lleva el icono de la actividad y 5 estrellas a ×2; al tocar la tercera, quedan 3 llenas y 2 vacías. |
| Respaldo (AC-9.3) | Con `urlsDeImagenes.delete('actividad:platos')` la fila muestra el icono genérico `otra`; con `urlsDeImagenes.clear()` aparece un hueco de 32 px sin errores en la consola. |
| Mapa (AC-4.1 a AC-4.5) | En edición, burbujas con su icono y una insignia dibujada junto al nombre de cada espacio (el desastre se ve como el icono rojo de «!!»). |

### Segunda pasada de escritorio (2026-10-11, tras la revisión de la implementación)

Hogar de prueba `desastre`, viewport de teléfono, estilos leídos con `getComputedStyle` y mapa en exploración:

| Paso | Resultado |
|---|---|
| Marco de videojuego (AC-7.6, AC-8.1, AC-8.2, AC-8.3) | Drawer y hoja: borde de 3 px, sombra dura `3px 3px 0`, esquinas a 0 px. Botones, «Juega» y botones de la cruceta: borde de 2 px, sombra `2px 2px 0`, esquinas a 0 px, Silkscreen; el botón principal es `rgb(63, 95, 176)` (`i`) con texto `rgb(244, 241, 234)` (`j`). Barra `rgb(46, 34, 51)` (`k`). La regla `button:active` (desplazar 2 px y quitar la sombra) existe. El título del drawer está en Silkscreen; el panel, en la fuente del sistema. |
| Chips y círculos (AC-5.6, AC-8.3) | Los chips tienen borde de 2 px, esquinas a 0 px y fuente del sistema; el círculo de responsable muestra solo la inicial (sin avatar), conserva su forma redonda y la fuente del sistema. |
| Cruceta (AC-6.4) | Botones opacos (`rgb(234, 223, 207)`, `z`) con su flecha. |
| Burbuja y hoja (AC-4.1, AC-4.2) | La burbuja del baño se ve con su icono dentro de un recuadro claro; al tocarla en el mapa se abre la hoja del lugar («Baño 3») con su actividad y su icono, con el borde de 3 px. |
| Insignia (AC-4.3, AC-4.4) | En exploración, junto a «OFICINA 1» se ve el icono rojo de desastre, pegado a la derecha de la etiqueta. |

Siguen sin evidencia de escritorio y pasan a la prueba del teléfono: el rótulo «Intercambios (n)» junto al icono (AC-2.3, necesita una propuesta recibida), el cartel «n fuera» (AC-4.7, necesita un familiar fuera de casa), las estrellas desactivadas (AC-6.2), el reconocimiento de los 23 iconos sobre crema y sobre morado (AC-1.9), la insignia que sigue a la etiqueta al desplazarse y la ausencia de insignia en el pasillo (AC-4.4, AC-4.6), y el recorrido completo (AC-10.3, AC-10.4).

**Hallazgo y corrección.** En el historial, el icono quedaba encima del nombre porque el contenedor del icono es un bloque flex (rompía AC-8.6). Se corrigió con una fila flex para el título (`.titulo-historial`) y se comprobó de nuevo: icono y nombre en la misma fila, el icono a la izquierda.

## Teléfono Android (el usuario, 2026-10-11)

Resumen del usuario sobre la versión servida desde la rama: **70 fps de promedio, `regen` 0,0 ms y sin observaciones** sobre la cruceta corregida (modelo del teléfono no indicado).

**Hallazgo y corrección (spec 2.0.0, Fase 8).** Al mantener pulsada una flecha de la cruceta para caminar, el navegador del teléfono trataba la flecha como una imagen: selección y opción de guardarla. Además la cruceta con marco quedaba más recargada que la anterior. Se revirtió la cruceta a la de la 010 (símbolos ▲ ◀ ▶ ▼ como texto, fondo semitransparente de la paleta, esquinas redondeadas de 8 px, sin marco ni sombra), se quitaron los 4 iconos de flecha (19 iconos) y todas las imágenes de la interfaz pasaron a no ser seleccionables, arrastrables ni guardables, con el toque pasando a su contenedor (AC-9.6). El usuario confirmó en el teléfono que la cruceta funciona bien (70 fps, `regen` 0,0 ms, sin observaciones).

## Teléfono Android: arranque, barra y carga completa (el usuario, 2026-10-11)

Versión servida desde `main` (sin caché, por la red local). Modelo del teléfono no indicado; resumen del usuario.

| Paso | Resultado |
|---|---|
| Arranque (AC-9.2, AC-9.4) | 70 fps, `regen` 2,1 ms, `arte` 20 ms, `ui` 77 ms (97 ms en total, por debajo de 300). |
| Barra con «Intercambios (n)» (AC-2.3) | Con una propuesta recibida, el rótulo con su contador se ve bien en la barra de 68 px, sin tapar el icono ni observaciones. |
| Carga completa (AC-9.2, AC-9.4, AC-3.5) | Con `hogarDeCargaCompleta` (8 familiares, 4 mascotas, 50 pendientes, 200 entradas y todos los espacios en desastre): **79 fps, `regen` 0,0 ms, `arte` 19 ms, `ui` 109 ms** (128 ms en total, por debajo de 300). El desplazamiento de las listas de 50 y de 200 filas fue fluido, sin tirones. |
| Pulsación larga (AC-9.6) | Mantener pulsada una imagen (icono, avatar o estrella) ya no ofrece guardarla ni seleccionarla. |

Cumplen los criterios de rendimiento de la spec: 60 fps o más, `regen` por debajo de los 24,9 ms de la 010 y de 100 ms, y `arte` + `ui` por debajo de 300 ms.

**Cómo se cargó.** `chrome://inspect` solo ve el teléfono por cable USB, no por wifi; se usó una página temporal (`carga-prueba.html`, no incluida en el repositorio) que guardaba un respaldo del hogar del teléfono, cargaba `hogarDeCargaCompleta(hoy)` desde `test/hogares-de-prueba.js` y permitía restaurar. Para repetirlo hace falta esa página o la consola del navegador:

```js
const { hogarDeCargaCompleta } = await import('/test/hogares-de-prueba.js');
const { fechaLocal } = await import('/src/fechas.js');
localStorage.setItem('livin:datos:v1', JSON.stringify(hogarDeCargaCompleta(fechaLocal(new Date()))));
localStorage.removeItem('livin:posicion:v1');
location.reload();
```

## Sin evidencia explícita en el teléfono

No se reportó de forma específica y queda sin registrar (el usuario no hizo observaciones): el reconocimiento de los iconos a ×2 sobre crema y morado (AC-1.9), las áreas táctiles (AC-8.5), la lectura de las burbujas con el zoom bajo de la edición, el ancho de la letra de los botones en Silkscreen, el cartel «n fuera» (AC-4.7), las estrellas desactivadas (AC-6.2) y la ausencia de insignia en el pasillo (AC-4.6).

## Límites conocidos

- **Excepción aceptada (AC-7.4, confirmada por el usuario el 2026-10-11):** el resumen del historial («Diana: 4,3 ★ (4 calificadas)», `textoResumen` de `historial.js`) sigue mostrando el símbolo ★ como texto; la feature no toca `historial.js` y las pruebas de la 006 lo fijan. Cambiarlo queda para una feature posterior.

- En modo edición, con el zoom bajo, la burbuja (16 px en pantalla) es más grande que una casilla; ya ocurría con el emoji (límite aceptado de la 003).
- Los círculos de responsable conservan su forma redonda (AC-5.6, spec).
- El indicador de depuración (`#depuracion`) queda parcialmente tapado por el botón «Juega» en el teléfono, como antes.
