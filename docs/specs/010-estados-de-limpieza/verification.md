# Verificación: 010 Estados de limpieza

**Fecha:** 2026-10-10
**Rama:** `feat/010-estados-de-limpieza`
**Estado:** automática completa; navegador de escritorio parcial (ver los límites abajo); **teléfono Android pendiente** (la hace el usuario).

## Pruebas automáticas

`cd poc && npm test` → **430 pruebas, 0 fallos** (391 anteriores + 39 nuevas: 4 de `contrato-estados.test.js`, 9 de `aspecto-estados.test.js`, 8 de `suciedad.test.js`, 14 de `casillas-estados.test.js` y 4 de `hogares-de-estados.test.js`). `node --check src/juego.js` sin salida.

Las 39 pruebas nuevas cubren, sin Phaser: los siete grupos de arte y sus seis objetos (16×16, solo paleta, con píxeles transparentes y de color); las manchas, telarañas, moscas y las 27 sobreposiciones (lista exacta, uniones entre partes, desordenado distinto de desastre salvo la cama); la elección de casillas (6 manchas, 2 moscas, esquinas superiores con pared al norte y a un costado, el baño interno con 4 casillas libres); la composición por capas para los tres estados (cantidades, casillas libres, grupo por tipo, agua en cocina y baño, alternancia de tamaños, telarañas solo en esquinas y también sobre un mueble, sin esquinas en la sala bajo el comedor, pasillo sin arte de estado, los tres estados distintos en cada espacio, todo limpio igual a la 008); la regla `estadosCambiaron`; la exhaustiva de los 7.560 mapas con estados (unos 3 s); y los tres hogares de prueba (válidos para `version: 7`, ocho tipos de espacio, cada espacio en el estado pedido).

`git diff --stat main -- poc/src/{catalogo,hogar,almacen,distribucion,posicion,movimiento,rutas,rutinas,actividades,intercambios,historial}.js poc/src/arte/{paleta,texturas,mobiliario,personajes,caminar}.js` → sin cambios: el modelo, el generador, el movimiento, la paleta y los demás módulos de arte no se tocaron. Las suites 001 a 009 pasan sin cambiar sus expectativas (AC-10.3).

## Cómo cargar los hogares de prueba (AC-9.4)

Con el juego servido sin caché (`cd poc && python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"`) y abierto en `http://localhost:8080`, ejecutar en la consola del navegador (para otro estado, cambiar `'desastre'` por `'desordenado'` o `'limpio'`):

```js
const { hogarDePruebaDeEstados } = await import('/test/hogares-de-prueba.js');
const { fechaLocal } = await import('/src/fechas.js');
localStorage.setItem('livin:datos:v1', JSON.stringify(hogarDePruebaDeEstados('desastre', fechaLocal(new Date()))));
localStorage.removeItem('livin:posicion:v1');
location.reload();
```

Cada hogar tiene sala, comedor, cocina, baño común, lavandería, espacio de mascota, dormitorio, oficina y dos baños internos. En `desordenado` y `desastre` cada espacio tiene una actividad «Limpiar» del propietario atrasada 1 o 3 días. Cargar un hogar de prueba reemplaza el hogar guardado en ese navegador (mismas claves de almacenamiento): usar un perfil de pruebas. Para el teléfono, servir en `0.0.0.0:8080` solo mientras dura la prueba y apagarlo después.

## Navegador de escritorio (panel del navegador de la app, viewport 1000×1100)

Servidor sin caché, sin errores en la consola.

| Comprobación | Resultado |
|---|---|
| Arranque y hoja de dibujos (AC-10.6) | `arte` **4 ms** (meta: menos de 300 ms); la hoja mide **1024 × 64 px** con **237 cuadros** (162 anteriores + 75 nuevos), muy por debajo de 4.096 px por lado |
| Hogar `desastre` (AC-6.1, AC-6.3) | en exploración y en edición se ven en los ocho tipos de espacio los objetos propios (platos, ollas y envolturas en la cocina; ropa en el dormitorio; revistas, cojines y vasos en la sala y el comedor; papeles y tazas en la oficina; toallas y patitos en los baños; huesos y platos en el espacio de mascota; ropa y escobas en la lavandería), las manchas de suciedad, las telarañas en las esquinas superiores, las moscas en cocina, baño y mascota, y las mesas manchadas |
| Hogar `desordenado` (AC-6.1) | se vieron 4 objetos propios por espacio, las migas en la mesa del comedor, la cama deshecha del dormitorio y los papeles en el escritorio de la oficina; sin manchas ni telarañas |
| Baja de una actividad en edición (AC-7.1, AC-7.4) | con el hogar `desastre`, en Actividades → toque en la burbuja de la cocina → «Eliminar»: la cocina pasa a limpia al instante (insignia ✓, sin objetos, manchas, telarañas ni muebles sucios) y las demás no cambian; el mundo se recompuso **una vez** en **1,2 ms** y `regen` marcó **4,1 ms** |
| Cambio que no altera ningún estado (AC-7.5) | agregar «Lavar platos» sin lugar (de 9 a 10 pendientes): `regen` 2,4 ms y **ninguna recomposición del mundo** (0 llamadas a `clear` del `RenderTexture`) |
| Capas (AC-8.2, AC-8.4) | el protagonista, los familiares, las mascotas, los nombres, las insignias (✓ ! !!) y las burbujas quedan por encima del desorden; no se ve ningún cuadrado liso de color de la versión anterior |
| Carga completa en escritorio (AC-10.4, AC-10.5) | hogar `version: 7` de 21 espacios (el mayor permitido, mapa de 33×40 casillas, 528×640 px), 8 familiares, 4 mascotas y el propietario, y 50 actividades atrasadas 3 días repartidas por todos los espacios (todo en desastre): `dibujarMundo` tarda **1,5 ms** de media (50 llamadas); el indicador marcó **105 a 120 fps**; abre sin aviso. No incluye las 200 entradas de historial, que no intervienen en el dibujo del mundo |

## Límites de esta verificación

- **Teléfono Android:** pendiente. Hay que repetir con los tres hogares de prueba y con la carga completa: reconocimiento de los estados con el zoom de exploración y con el zoom bajo de edición, fps, `regen`, `arte` y la recomposición al cambiar un estado.
- **No se comprobó** en el navegador: el cambio de día con la app abierta (AC-7.3, lo cubre la misma ruta `refrescarActividades` que «Hecho»), el hogar `limpio` cargado como tal (se vio la cocina limpia tras la baja, y la 008 no cambió en limpio: AC-8.1 lo prueba la suite), agregar y eliminar un espacio en edición (AC-7.6, mismo camino `redibujar` que la 009), y un hogar guardado de una versión anterior a la 7 (AC-10.1: lo cubren las pruebas del almacén, que no cambian).
- **Marcar «Hecho»** en exploración no se probó: se usó la baja de la actividad en edición, que cambia el estado por la misma ruta (`aplicarActividades` → `refrescarActividades`).
- **Retoques a los dibujos:** ninguno todavía. Los dibujos son los bocetos del plan. Si en el teléfono algún objeto se confunde con un mueble o el desastre se ve demasiado cargado, se retocan en `src/arte/suciedad.js` o se baja la cantidad de manchas (spec, Open Questions).
- **Tiempo de dibujo medido de lado de la CPU** (JavaScript hasta `endDraw`); no incluye el trabajo de la tarjeta gráfica, que no se puede medir desde la consola.

## Pasos de teléfono para quien verifica

1. Cargar `hogarDePruebaDeEstados('desastre', …)` y mirar cada espacio con el zoom de exploración y en edición: ¿se reconoce cada tipo sin leer la insignia? ¿los objetos se distinguen del mobiliario?
2. Repetir con `'desordenado'` y `'limpio'`.
3. En el hogar `desastre`, marcar «Hecho» una actividad: el espacio queda limpio al instante.
4. Con la carga completa (21 espacios, 8 familiares, 4 mascotas, 50 actividades, 200 entradas de historial): anotar fps, `regen` y `arte`.
