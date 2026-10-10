---
date: 2026-10-10
spec: "008"
tags: [tipografia, silkscreen, legibilidad, telefono]
---

# Lección: una fuente pixel es más ancha que la del sistema y su tamaño se decide en el teléfono

## Contexto

La feature 008 puso Silkscreen (una fuente pixel de licencia abierta, guardada en `poc/assets/fonts/`) en las etiquetas del mapa, las insignias, el cartel, las pestañas de la barra y los títulos de los drawers. La spec ya anotaba el riesgo: «Silkscreen es más ancha que la fuente del sistema».

## Qué pasó

- Las etiquetas del mapa se crearon a 12 px (el tamaño de partida). En modo edición, con el zoom bajo y un hogar grande, los nombres largos («ESPACIO DE MASCOTA 1», «LAVANDERÍA 1») son más anchos que su espacio, se cortan por el borde de la pantalla y se pisan con las vecinas; con la carga completa (50 burbujas) el mapa queda amontonado. La fuente del sistema ya era más ancha que el espacio, pero unos 30 % menos.
- Las pestañas de la barra a 360 px no admiten «Intercambios (20)» en una sola línea a ningún tamaño legible: se resolvió permitiendo dos líneas a 8 px (`white-space` normal, `overflow-wrap: anywhere`).
- Silkscreen solo no tiene el símbolo ✓ (las demás tildes, la ñ, `¿` y `¡` sí); la pila `Silkscreen, system-ui, sans-serif` lo resuelve letra a letra. Se comprobó midiendo en un `canvas` con dos pilas de respaldo distintas (`serif` y `monospace`): la letra falta si el ancho difiere.
- No se pudo probar tamaños en vivo porque la escena no se expone al navegador; el tamaño quedó como una decisión pendiente para quien vea el teléfono. **Desenlace (2026-10-10):** quien decide el producto lo vio en el teléfono, sin observaciones, y se mantuvo en 12 px.

## Qué hacer la próxima vez

- Al elegir una fuente pixel, calcular antes el ancho de los textos más largos que admite el producto (nombres de 20 caracteres, etiquetas con contador) en el tamaño nativo (múltiplos de 8 px) y comprobar si caben en su contenedor; decidir de antemano qué se sacrifica (tamaño, partir en dos líneas o abreviar).
- Dejar el tamaño de letra de una capa gráfica en una sola constante con nombre (`TAM_LETRA_MAPA`) para poder ajustarlo tras ver el teléfono, y exponer la escena en una variable de depuración si se quiere probar tamaños en vivo.
- Verificar el respaldo de una fuente sin conexión renombrando su archivo y recargando desde otro origen (`127.0.0.1` en vez de `localhost`), porque con el mismo origen el navegador reutiliza la fuente ya cargada y la prueba no prueba nada.

## Señales a vigilar

Etiquetas centradas en un espacio que se salen de la pantalla; textos de un solo renglón con contadores que crecen; una prueba de respaldo de fuente que da «fuente cargada» aunque el archivo devuelva 404.
