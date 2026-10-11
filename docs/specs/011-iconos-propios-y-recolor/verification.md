# Verificación: 011 Iconos propios y recolor de la interfaz

**Fecha:** 2026-10-10
**Rama:** `feat/011-iconos-propios-y-recolor`
**Estado:** automática y escritorio completas; **teléfono Android pendiente** (la hace el usuario).

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

**Hallazgo y corrección.** En el historial, el icono quedaba encima del nombre porque el contenedor del icono es un bloque flex (rompía AC-8.6). Se corrigió con una fila flex para el título (`.titulo-historial`) y se comprobó de nuevo: icono y nombre en la misma fila, el icono a la izquierda.

## Pendiente en el teléfono Android (la hace el usuario)

Repetir los pasos de arriba con el hogar de prueba y con la carga completa (8 familiares, 4 mascotas, 50 pendientes, 200 entradas y todos los espacios en desastre). Servir en `0.0.0.0:8080` solo mientras dura la prueba, con el servidor sin caché, y apagarlo después. Anotar:
- fps, `regen`, `arte` y `ui` (criterios: 60 fps o más; `regen` sin superar los 24,9 ms de la 010 y por debajo de 100 ms; `arte` + `ui` por debajo de 300 ms).
- Que la barra de 68 px acepte el rótulo de dos líneas de «Intercambios (n)» sin tapar el icono; si no, subir `--base`.
- Que los iconos de actividad se reconozcan a ×2, que las listas de 50 y 200 filas se desplacen sin tirones y que las áreas táctiles no se hayan encogido (AC-8.5).
- Si las burbujas (20×20 px, 30 con el «+») se leen con el zoom de edición, y si la letra de los botones en Silkscreen queda demasiado ancha (lección del 2026-10-10).

## Límites conocidos

- En modo edición, con el zoom bajo, la burbuja (16 px en pantalla) es más grande que una casilla; ya ocurría con el emoji (límite aceptado de la 003).
- Los círculos de responsable conservan su forma redonda (AC-5.6, spec).
- El indicador de depuración (`#depuracion`) queda parcialmente tapado por el botón «Juega» en el teléfono, como antes.
