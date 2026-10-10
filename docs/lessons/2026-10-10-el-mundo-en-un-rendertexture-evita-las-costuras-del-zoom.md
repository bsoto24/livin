---
date: 2026-10-10
spec: "008"
tags: [phaser, rendimiento, arte, zoom, verificacion]
---

# Lección: dibujar el mundo en un RenderTexture y comprobar el filtro con una réplica de la secuencia

## Contexto

La feature 008 sustituyó los rectángulos de color del mapa por texturas de 16×16. El PRD proponía un `Tilemap` de Phaser. El modo edición usa un zoom fraccionario (el hogar completo se encuadra en la pantalla) y el juego tiene `pixelArt: true`.

## Qué pasó

Un `Tilemap` con una hoja de texturas suele mostrar costuras entre casillas cuando la cámara tiene un zoom que no es entero. En vez de arriesgarse, el plan fijó un `RenderTexture` desde el principio: el mundo se compone a 1:1 en una sola imagen (`beginDraw`, `batchDrawFrame`, `endDraw`) y la cámara la amplía como un solo rectángulo; solo se rehace cuando cambia la distribución, y los objetos del suelo (que cambian con las actividades) van aparte en un `Graphics`. El resultado midió 1 ms de preparación de arte y de 3 a 12 ms de redibujo, incluso con la carga completa.

Quedó una duda: el filtro NEAREST se fija en `create()` sobre un `RenderTexture` de 16×16 y después `dibujarMundo()` hace `resize()` a 528×176 o más. La escena no se expone al navegador (`Phaser.GAMES` queda vacío), así que no se podía mirar la textura real. Se reprodujo la secuencia exacta (crear, `setFilter(NEAREST)`, `resize`, `clear`) en un `Phaser.Game` aparte y se leyeron `source[0].scaleMode` y `gl.getTexParameter(MIN_FILTER/MAG_FILTER)` antes y después: siguieron en NEAREST.

## Qué hacer la próxima vez

- Para un mapa de casillas con zoom fraccionario, componer el suelo en un `RenderTexture` (o equivalente de una sola imagen) y fijarle el filtro NEAREST explícitamente; reservar el `Tilemap` para cuando haya zoom entero o hoja de texturas con extrusión.
- Si hay que confirmar un detalle del motor que la app no expone, reproducir la misma secuencia de llamadas en un juego temporal (div fuera de pantalla, tipo `Phaser.WEBGL`, con un tiempo máximo) y leer el estado real, en vez de dejarlo como supuesto. En `WebGL` la textura es `source[0].glTexture.webGLTexture`.
- Medir el tiempo de preparación y el de redibujo con el indicador de depuración y registrarlos en `verification.md`.

## Señales a vigilar

Líneas finas o huecos entre casillas al cambiar de zoom; un redibujo que reconstruye todas las casillas por cada cambio de actividades; un filtro de textura que se supone y no se ha leído.
