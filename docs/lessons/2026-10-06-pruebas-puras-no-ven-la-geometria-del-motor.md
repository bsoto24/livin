---
date: 2026-10-06
spec: "003"
tags: [sdd-review, phaser, interfaz, subagentes]
---

# Lección: 150 pruebas en verde y aún había defectos que solo veía una revisión estricta

## Contexto

Feature 003 (actividades). Toda la lógica estaba en módulos puros con 150 pruebas; la capa de presentación (Phaser y HTML) no tiene pruebas automáticas por diseño. La revisión de alineación (`sdd-review`, modo B) se hizo en tres rondas con el modelo de la sesión y reglas estrictas: una fila por criterio (74), citas `archivo:línea` dentro del largo real del archivo, una lista aparte para lo que solo es de interfaz, y cinco citas autoverificadas.

## Qué pasó

La ronda 1 halló dos defectos. Los objetos del suelo reservaban la casilla de la burbuja, así que un baño interno (4 casillas libres) mostraba 3 objetos en vez de 4; el código venía del plan y la prueba lo describía tal cual, pero contradecía el AC-4.7 de la spec. Además, un nombre de espacio personalizado se interpretaba como HTML en la pista "Siguiente:" del panel (heredado de la 001; la spec 003 exige texto). La ronda 2 halló el tercero: la burbuja de un miembro se dibujaba 1,4 casillas por encima de él, pero respondía al toque en la casilla de encima; tocar el icono visible no abría la hoja. La función pura que decide la casilla y su prueba eran correctas; lo que fallaba era la posición del objeto de Phaser. Se corrigieron en tres commits, se comprobó en un navegador con viewport de teléfono que tocar el icono dibujado abre la hoja, y la ronda 3 terminó en SPEC-ALIGNED.

## Qué hacer la próxima vez

En elementos que se tocan, definir el área táctil igual al área dibujada (centrar el objeto en la casilla donde responde) y comprobarlo en el navegador con los dos zooms, no solo con pruebas. Contrastar con la spec las reglas numéricas de los fragmentos del plan ("limitados por…", "sin…"). Buscar con `grep` todo `innerHTML` que reciba texto del usuario. Mantener las reglas estrictas en el prompt del revisor y comprobar yo mismo algunas citas.

## Señales a vigilar

Una función pura que devuelve "la casilla del toque" mientras otro código coloca el objeto gráfico; reglas "reservar/excluir" en el código del plan que la spec no menciona; cadenas con plantillas asignadas a `innerHTML` que incluyen nombres; un revisor que da todo en verde en la primera pasada.
