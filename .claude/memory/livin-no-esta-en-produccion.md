---
name: livin-no-esta-en-produccion
description: Livin aún no está en producción: se aceptan migraciones del formato guardado que descartan datos sin valor, si el usuario lo decide
metadata:
  type: project
---

El juego todavía no sale a producción: lo usa solo el propio usuario como PoC (teléfono Android y navegador de escritorio). Al decidir qué hacer con las actividades asignadas a mascotas en la migración a v7, el usuario respondió «el juego aún no sale a producción, así que elimina al migrar» y descartó pasarlas al propietario o conservarlas.

**Why:** no hay datos de terceros que proteger; mantener datos que ya no tienen sentido (o inventar reasignaciones que nadie decidió) cuesta más complejidad que el riesgo de perderlos.
**How to apply:** al cambiar el formato guardado, una migración puede dar de baja o quitar datos que la regla nueva ya no admite, pero **nunca** debe producir un error al abrir un hogar ya guardado (los documentos de versiones anteriores se abren sin aviso y se guardan en el formato nuevo en el siguiente guardado). Mantener ese límite y dejar la decisión explícita en el ADR. Cuando la app llegue a usuarios reales, revisar esta regla. Relacionado: [[livin-project-state]].
