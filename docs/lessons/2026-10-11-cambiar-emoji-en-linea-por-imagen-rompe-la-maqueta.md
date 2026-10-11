---
date: 2026-10-11
spec: "011"
tags: [presentacion, iconos, css, verificacion]
---

# Lección: cambiar un emoji en línea por una imagen puede romper la maqueta, y solo se ve en el navegador

## Contexto

La 011 sustituyó los emoji de la interfaz por imágenes de pixel art dentro de un `span.icono`. Todas las pruebas automáticas pasaban (456), incluida la prueba estática de que no queda ningún emoji.

## Qué pasó

En las filas del historial, el icono de la actividad quedó encima del nombre en vez de a su lado. El `span.icono` es ahora un bloque flex (para centrar la imagen) y, donde antes un emoji se pintaba en línea junto a un `<strong>`, la imagen empujó al nombre a otra línea. Ninguna prueba lo veía: solo apareció al abrir el drawer «Hechas» en el navegador. Se corrigió con una fila flex para el título (`.titulo-historial`).

## Qué hacer la próxima vez

- Al sustituir un símbolo de texto por una imagen o un bloque, buscar cada contenedor donde el símbolo iba en línea con otro texto, y darle una fila flex o decidir que el icono sea en línea.
- Revisar en el navegador cada pantalla que muestre el icono (listas, hoja, historial, chips, selectores), no solo las dos o tres principales.
- Las pruebas estáticas del texto de `index.html` y de los fuentes no detectan problemas de maqueta: no cuentan como evidencia de que la disposición no cambió.

## Señales a vigilar

Un `span` que antes contenía solo texto y ahora contiene una imagen o un elemento con `display: flex` o `block`; filas con un icono seguido de un nombre dentro de un `div` sin clase propia.
