---
date: 2026-10-12
spec: "012"
tags: [despliegue, seguridad, sdd-plan, sdd-brainstorm]
---

# Lección: mirar el estado real del hosting antes de planificar y buscar secretos antes de hacer público el repo

## Contexto

Feature 012. El plan fijaba el orden: buscar secretos en el historial (AC-4.1), luego hacer público el repo y configurar Pages (Fase 4). Mientras se escribía el plan, el usuario ya había hecho público el repo y configurado Pages en modo rama, algo que el brainstorm no preguntó y que el plan no comprobó.

## Qué pasó

El plan y la spec se escribieron sobre un estado supuesto («repo privado, Pages sin configurar»). La realidad era otra: repo público y Pages publicando el repo entero. Se descubrió solo cuando el usuario avisó del 404. La búsqueda de secretos (`gitleaks`) se hizo **después** de la publicación, al revés de FR-6 y AC-4.1; no hubo hallazgos, pero si los hubiera habido la credencial ya habría estado expuesta. La spec no se cambió: se dejó como desvío registrado en el plan y en `verification.md`.

## Qué hacer la próxima vez

- En el brainstorm de un despliegue, preguntar o comprobar el estado actual antes de decidir: `gh repo view --json visibility`, `gh api repos/<dueño>/<repo>/pages` y `gh run list`. Cuesta tres comandos de solo lectura.
- Poner la búsqueda de secretos como el **primer** paso y como condición previa a cambiar la visibilidad; si el repo ya es público, ejecutarla de inmediato y tratar cualquier hallazgo como credencial comprometida (rotarla).
- Si el usuario avanza por su cuenta con un paso irreversible (hacer público un repo), registrarlo como desvío en el plan y en `verification.md` en el mismo momento.

## Señales a vigilar

- Una spec o un plan que describe pasos de «publicar» sin haber leído la configuración real del hosting.
- Un orden de seguridad (buscar secretos, rotar, cambiar visibilidad) que depende de que el usuario no se adelante.
