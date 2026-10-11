---
date: 2026-10-11
spec: "011"
tags: [sdd-plan, sdd-spec-update, sdd-review, spec]
---

# Lección: una decisión del plan que se aparta de la spec sube como PATCH en el momento de planificar

## Contexto

La tabla de roles de color de la spec de la 011 (FR-7) decía que las líneas de separación van en `k`. Al escribir el CSS, el plan adoptó la clave `A` (arena, más suave) para los separadores de fila, sin cambiar la spec. Otras decisiones del plan también quedaron fuera de la spec: los chips y los círculos de responsable en la fuente del sistema, y un respaldo de 4 s para mostrar la página.

## Qué pasó

La revisión de la implementación contra la spec (`sdd-review`, modo B) las marcó como deriva. Todas se habían validado en pantalla y se resolvieron con una versión PATCH 1.0.1 de la spec, confirmada por el usuario, pero fue una vuelta extra que se pudo evitar.

## Qué hacer la próxima vez

- Al escribir el plan, si una decisión contradice o completa una tabla o un requisito de la spec, ejecutar `sdd-spec-update` (PATCH) en ese momento, no al final.
- Cotejar las tablas de la spec (colores, tamaños, tipografías) contra el código del plan antes de aprobarlo.
- Las decisiones de aspecto que tomó el plan «por buen gusto» (un color más suave, una fuente distinta para texto del usuario) conviene dejarlas por escrito en la spec.

## Señales a vigilar

Un plan que dice «decisión de esta fase» sobre un valor que la spec ya fija en una tabla; tablas de la spec que el código reemplaza con otro valor.
