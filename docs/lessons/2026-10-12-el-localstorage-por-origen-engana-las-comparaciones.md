---
date: 2026-10-12
spec: "012"
tags: [verificacion, navegador, localstorage]
---

# Lección: el `localStorage` es por origen y engaña las comparaciones en el navegador

## Contexto

Feature 012, verificación de la CSP en una copia local servida en `http://127.0.0.1:8081/livin/`, con el navegador del panel de la app.

## Qué pasó

El mapa se veía oscuro: solo etiquetas y un personaje, sin suelos ni muebles. Parecía que la CSP bloqueaba el dibujo del mundo. La comparación con la versión sin CSP en otro puerto (`:8082`) mostraba el mundo bien dibujado, lo que reforzaba la sospecha. En realidad el origen `127.0.0.1:8081` ya tenía una partida guardada de otra sesión (formato v2, jugador «Diana») con una posición fuera del mapa actual. Cada puerto es un origen distinto con su propio `localStorage`, así que se estaban comparando partidas distintas, no políticas distintas. La comparación válida fue cambiar solo el `index.html` servido en `:8082` (misma partida): el mundo se dibujó igual con y sin CSP.

## Qué hacer la próxima vez

- Antes de atribuir un fallo visual a un cambio de código, mirar el estado guardado del origen con `JSON.stringify(Object.keys(localStorage))` y la versión del documento.
- Para comparar A y B, servir ambas versiones **desde el mismo origen** (cambiando el archivo) o vaciar el almacenamiento de ese origen antes. No comparar puertos distintos con partidas distintas.
- No borrar el `localStorage` ajeno sin necesidad: elegir un puerto nuevo o cambiar el archivo servido. (Un puerto nuevo puede pedir permiso en el navegador del panel: en esta sesión el `:8083` fue denegado.)

## Señales a vigilar

- Un mapa con etiquetas y personajes pero sin suelo: suele ser una posición guardada fuera del mapa, no un error de dibujo.
- Resultados distintos entre dos puertos de `localhost` que sirven el mismo código.
