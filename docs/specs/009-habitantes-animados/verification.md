# Verificación: 009 Habitantes animados

**Fecha:** 2026-10-10
**Rama:** `feat/009-habitantes-animados`
**Estado:** automática, en navegador de escritorio y en el teléfono Android completas, con los límites descritos abajo. En el teléfono: 70 fps de promedio, `regen` de 45,3 ms y sin observaciones.

## Pruebas automáticas

`cd poc && npm test` → **391 pruebas, 0 fallos** (367 anteriores + 24 nuevas: 3 de `contrato-personajes.test.js`, 5 de `caminar.test.js`, 11 de `personajes.test.js` y 5 de `hogares-de-prueba.test.js`).

`git diff --stat main -- poc/src/{catalogo,hogar,almacen,distribucion,posicion,movimiento,rutas,rutinas,actividades,intercambios,historial}.js poc/src/arte/{paleta,casillas}.js poc/test/arte.test.js` → sin cambios: el modelo, el generador, el movimiento y la paleta no se tocaron (AC-7.8, AC-9.2, FR-8). Las suites 001 a 008 pasan sin cambiar sus expectativas (AC-9.4).

Los 126 cuadros de los 14 personajes cumplen en las pruebas: 16×16, solo paleta o transparente, con transparencia, color y contorno, pasos distintos del parado y entre sí, vistas distintas, 14 cuadros parados de frente distintos, niños al menos dos filas más bajos que los adultos y hámster más pequeño que el perro.

## Cómo cargar los hogares de prueba (AC-8.6)

Con el juego servido sin caché (`cd poc && python3 -c "import http.server as s; h = type('H', (s.SimpleHTTPRequestHandler,), {'end_headers': lambda self: (self.send_header('Cache-Control', 'no-cache'), s.SimpleHTTPRequestHandler.end_headers(self))[-1]}); s.ThreadingHTTPServer(('127.0.0.1', 8080), h).serve_forever()"`) y abierto en `http://localhost:8080`, ejecutar en la consola del navegador (para el segundo hogar, cambiar `hogarDePrueba1` por `hogarDePrueba2`):

```js
const { hogarDePrueba1 } = await import('/test/hogares-de-prueba.js');
localStorage.setItem('livin:datos:v1', JSON.stringify(hogarDePrueba1()));
localStorage.removeItem('livin:posicion:v1');
location.reload();
```

Los hogares de prueba no usan `crypto.randomUUID`, así que también se pueden cargar cuando el juego se abre por la IP de la red local (por ejemplo, en el teléfono, con el servidor escuchando en `0.0.0.0`).

Qué se debe ver:
- **Hogar 1:** «Protagonista» (gorra y ropa rosa, quien juega), «Adulto» (azul), «Adulta» (amarilla, pelo largo), «Niño» (más bajo, azul), «Niña» (más baja, coletas), «Anciano» (pelo gris, bastón), «Anciana» (pelo gris, moño), «Perro», «Gato», «Conejo» y «Hámster».
- **Hogar 2:** «Protagonista», «Neutro» (lavanda), «Loro» y «Otro» (bichito redondo verde claro).
- Cargar un hogar de prueba reemplaza el hogar guardado en ese navegador, porque usa las mismas claves de almacenamiento que el hogar real. Usar un perfil de navegador de pruebas.

## Navegador de escritorio (panel del navegador de la app, viewport 375×812 y escritorio)

Hogar de prueba 1 (y el 2 para los datos del documento), servidor sin caché. Se instrumentó el navegador sin tocar el código: se envolvió `Phaser.GameObjects.Image.prototype.setFrame` y `GameObjectFactory.prototype.image` para registrar los cuadros que se aplican y los que se crean.

| Comprobación | Resultado |
|---|---|
| Arranque (AC-8.4, AC-9.1) | se abre sin aviso con el hogar de prueba 1 y con el 2; sin errores en la consola |
| Tiempo de preparación del arte (AC-9.5) | **3 ms** con los 162 cuadros (meta: menos de 300 ms) |
| Reconocimiento (AC-2.3, AC-2.4, AC-3.8, AC-7.6) | ninguno es un rectángulo y el jugador no lleva flecha. En exploración se reconocieron el protagonista con gorra rosa, el adulto, la adulta, el niño, la niña, el anciano con bastón, la anciana, el perro y el gato; en el modo edición, a un zoom muy bajo, se ven los 10 habitantes del hogar 1 pero se leen sobre todo por el nombre. El conejo y el hámster solo se vieron a ese zoom bajo, y el neutro, el loro y «Otro» no se llegaron a ver a tamaño completo en el navegador (solo se comprobó que el hogar 2 se abre sin aviso y su documento): se revisaron en el teléfono |
| Direcciones del jugador (AC-4.1, AC-4.4, AC-4.5) | derecha: vista de lado mirando a la derecha; izquierda: la misma vista volteada, en la misma casilla; arriba contra una pared: de espalda, parado y sin moverse; abajo: de frente |
| Ciclo de pasos del jugador (AC-5.1, AC-5.2, AC-5.4, AC-5.6) | con la dirección mantenida 1,2 s se registró `lado:1, 0, 2, 0, 1, 0, 2, 0, 1, 0` con un cambio cada **125 ms** (mitad de los 250 ms de la casilla) y el pie alternando; al soltar, queda en `0` |
| Habitantes (AC-4.2, AC-4.3, AC-5.4, AC-5.5) | en 20 s, 10 habitantes cambiaron de vista y de pie (por ejemplo «Hámster»: `frente:2, 0, 1, 0, 2, 0`) sin repetir nunca el mismo cuadro de paso dos veces seguidas; al detenerse quedan en `0` con la vista de su último paso |
| Modo edición (AC-6.1) | en 3 s de edición no se aplicó ningún cambio de cuadro: todos parados |
| Salir de la edición (AC-4.7) | al tocar «Listo», los 10 habitantes se recrearon con `frente:0` (parados y de frente) |
| Redibujo (AC-6.5) | al cambiar el tamaño de la ventana en plena marcha, los habitantes que habían girado se recrearon con su vista (`lado`, `espalda`); ninguno volvió a mirar de frente |
| Agregar un familiar (AC-6.7) | «Nuevo» (neutro) aparece como `neutro:frente:0` |
| Cambiar el aspecto (AC-3.5) | al pasar «Nuevo» a anciano, el mapa lo dibuja con el personaje `anciano` y ninguno con `neutro` |
| Cambio de jugador (AC-3.7, AC-4.9) | de «Anciano» a «Adulto»: el saliente se recrea con su vista (`anciano:espalda:0`) y el protagonista, que miraba a la izquierda, se recrea como habitante con `protagonista:lado:0` |
| Rutina «Fuera de casa» (AC-6.4, AC-6.3, AC-7.5) | con un bloque «Fuera de casa» hasta las 09:30 para «Adulto» (creado con `agregarBloque`): al empezar el minuto camina hacia la entrada y desaparece, y el cartel «1 FUERA» aparece; al vencer el bloque, a las 09:30, reaparece en la entrada, de frente y parado, y el cartel desaparece |
| Hogar guardado (AC-9.2, AC-4.10) | el documento sigue en `version: 7` y las claves del documento y de los miembros son las mismas que las de un hogar nuevo; no hay campos de vista ni de pie |
| Cambio de especie (AC-3.6) | **no se comprobó en el navegador**: lo cubre `personajeDe` en las pruebas y el mismo camino de redibujo de AC-3.5 |
| Toques en edición (AC-7.4), capas (AC-7.1, AC-7.2), nombres y burbujas (AC-7.3) | se vieron nombres sobre los personajes y la etiqueta resaltada de quien juega; **no se probó de forma específica** tocar un personaje en edición, ni la superposición de dos habitantes en una casilla |
| Nitidez (AC-7.7) | el filtro de la textura es el NEAREST de la configuración (`pixelArt: true`); en las capturas a zoom de edición los píxeles se ven nítidos |

### Cuadros por segundo y redibujo de edición: límite del entorno

Con el panel del navegador visible se midieron **109 a 121 fps** (el juego y `requestAnimationFrame`) con el hogar de prueba 1 y `regen` de **4,5 a 8,5 ms** en cambios de edición. Pero durante buena parte de la verificación la pestaña alternó entre `visible` y `hidden` (la ventana de la app perdía el foco) y `requestAnimationFrame` bajaba a 1 o 2 por segundo, de modo que el indicador de la pantalla se quedaba congelado en «60 fps» y las lecturas no valen.

**No se obtuvo una medición fiable con la carga completa** (8 familiares, 4 mascotas, 50 actividades, 200 entradas, 21 espacios) en escritorio: se armó el hogar con las funciones del dominio y se abrió sin avisos, y el modo edición lo dibuja entero con los 12 personajes visibles, pero el fps y el `regen` quedan **pendientes de medirse en el teléfono** (AC-9.6, AC-9.7). Como referencia, la 008 midió en escritorio con esa misma carga 105 a 120 fps y 7,5 a 11,7 ms de redibujo, y la 009 no añade trabajo al redibujo del mundo: solo recrea 12 imágenes y cambia el cuadro de cada una por cuadro.

## Teléfono Android (2026-10-10)

Prueba hecha por quien decide el producto, con `poc/` servido en la red local sin caché (`http://<IP>:8080`), en `main` en `de26757`. Resumen aportado por el usuario; **no indicó el modelo del teléfono ni el desglose por paso**, y no informó el valor de `arte`.

| Medida | Resultado | Meta |
|---|---|---|
| Cuadros por segundo (promedio) | **70 fps** | 60 fps o más (AC-9.6) |
| Redibujo de edición (`regen`) | **45,3 ms** | menos de 100 ms y sin superar los 62,7 ms de la 007 (AC-9.7) |
| Observaciones | **ninguna** | |

Con el resultado «sin observaciones» se dan por cumplidos en el teléfono los pasos que pedía el plan (reconocimiento de los 14 personajes, caminar en las cuatro direcciones con el cambio de pie, modo edición y nitidez), incluidos los huecos de evidencia de escritorio: el neutro, el conejo, el hámster, el loro y «Otro» a tamaño completo (AC-2.3, AC-2.4, AC-2.5). No quedan retoques de dibujo.

**No quedó registrado:** el tiempo `arte N ms` del dispositivo de referencia (AC-9.5; en escritorio fue de 3 ms, muy por debajo de los 300 ms) ni si la prueba usó el hogar de carga completa (8 familiares, 4 mascotas, 50 pendientes y 200 entradas); el `regen` de 45,3 ms es compatible con esa carga, pues la 007 midió 62,7 ms y la 008 de 7,5 a 11,7 ms en escritorio.

## Revisión de la implementación (`sdd-review`, modo B)

**Veredicto: SPEC-ALIGNED** (una ronda, 2026-10-10). Suite fresca: 391 pruebas, 0 fallos; la matriz cubre los 67 criterios: ninguno ✗ Missing.

- **Pendientes del teléfono** (el código los soportaba): AC-2.5, AC-9.5, AC-9.6 y AC-9.7. Cerrados por la prueba del teléfono, salvo el valor de `arte` de AC-9.5, que no se registró (ver «Teléfono Android»).
- **Huecos de evidencia menores** (el código los soporta): AC-2.3 y AC-2.4 (neutro, conejo, hámster, loro y «Otro» no se vieron a tamaño completo en escritorio), AC-7.2 (dos habitantes en una casilla, uno en ruta y otro paseando), AC-7.4 (tocar un personaje en edición) y AC-6.2 (entrar en edición con un paso en curso: `entrarEdicion` no abre el drawer mientras el jugador camina, igual que antes de la 009). La pasada del teléfono no tuvo observaciones.
- **Notas** sin incumplir la spec: no hay una prueba específica de la 009 que fije que el documento guardado no cambia (AC-4.10; lo cubren el `git diff` vacío de los módulos del modelo, el viaje de ida y vuelta de `hogares-de-prueba.test.js` y las pruebas de la versión 7); el cambio de especie en la ficha (AC-3.6) no se probó en el navegador pero usa el mismo camino de redibujo que el cambio de aspecto.

## Límites aceptados

- El indicador de fps de la pantalla no se actualiza cuando el navegador baja `requestAnimationFrame`; solo vale con la pestaña visible.
- A 16×16 y con el zoom bajo del modo edición los personajes son muy pequeños y se leen sobre todo por el nombre (riesgo 1 de la spec).
- Un habitante en ruta con muchos pasos seguidos alterna el pie en cada casilla, también si da la vuelta; no se reinicia el pie al girar.
- Un habitante que pasa a ser quien juega a mitad de un paso conserva su registro de caminar, así que puede mostrar un cuadro de paso hasta 500 ms estando quieto.
- Si la posición guardada deja de ser válida y el juego recoloca al jugador de frente, el registro de caminar conserva la dirección anterior hasta que se mueva.
- El paso del tween usa el reloj de Phaser y el cuadro usa `performance.now()`: con la pestaña oculta puede desfasarse un cuadro de pie.
- Un familiar que pasa a ser quien juega tras estar fuera de casa conserva la dirección de su último paso, no mira de frente.
