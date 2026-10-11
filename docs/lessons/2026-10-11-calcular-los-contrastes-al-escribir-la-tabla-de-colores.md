---
date: 2026-10-11
spec: "011"
tags: [sdd-specify, colores, accesibilidad, paleta]
---

# Lección: calcular los contrastes al escribir la tabla de colores de la spec

## Contexto

La spec de la 011 fijó una tabla de roles de color (barra, paneles, botones, peligro…) y un criterio de contraste de al menos 4,5 a 1 para cada par de texto y fondo. La prueba de contraste se escribió en la Fase 0 del plan.

## Qué pasó

Al preparar la spec se calcularon los contrastes de la tabla a mano con un guion: el botón principal con fondo `g` y texto `j` daba 3,41 a 1. Se cambió a `i` sobre `j` (5,36) antes de aprobar la spec. Si ese cálculo se hubiera dejado para la prueba automática, el fallo habría salido en la implementación, con la spec ya aprobada y una nueva versión necesaria.

## Qué hacer la próxima vez

- Al escribir cualquier tabla de colores en una spec, calcular el contraste de cada par con la paleta real (una función de unas diez líneas) y cambiar el par que no llegue antes de aprobar.
- Incluir en el criterio la lista de pares y el valor mínimo, y escribir la prueba de contraste en la Fase 0.
- Elegir de la paleta existente en vez de añadir colores: aquí bastó con cambiar de clave.

## Señales a vigilar

Texto claro sobre un color medio de la paleta (azules y verdes intermedios), que suele quedar entre 3 y 4,5 a 1.
