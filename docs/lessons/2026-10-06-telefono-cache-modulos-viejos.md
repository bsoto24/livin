---
date: 2026-10-06
spec: "002"
tags: [android, cache, servidor, modulos-es]
---

# Lección: el teléfono mezcló módulos viejos y nuevos y el mapa no se dibujó

## Contexto

Fase 5 de la feature 002: se sirvió `poc/` con `python3 -m http.server 8080` y se abrió `http://<IP-del-computador>:8080` en un Samsung con Android.

## Qué pasó

En el teléfono se veían la cruceta y el botón "Editar", pero el mapa era una pantalla negra; en el navegador del Mac todo funcionaba. `http.server` solo envía `Last-Modified`, así que el navegador del teléfono aplicó caché heurística y combinó módulos de la versión anterior con módulos nuevos. El `posicion.js` viejo no exportaba `claveCasilla`, y el `movimiento.js` nuevo lo importaba: `SyntaxError: The requested module './posicion.js' does not provide an export named 'claveCasilla'`. Un error de enlace en un grafo de módulos ES aborta todo el grafo: el HTML queda visible, pero el lienzo nunca se crea. Se reprodujo el mismo error en Node con la combinación de archivos y se confirmó con el registro del servidor. Borrar los datos de navegación lo resolvió. Corrección (commit `fb9b6c3`): servir con una variante de una línea que añade `Cache-Control: no-cache`, y corregir las Fases 4 y 5 del plan; el mismo comando se reutilizó en la 003.

## Qué hacer la próxima vez

Servir siempre con `Cache-Control: no-cache` cuando se pruebe en un teléfono. Si el teléfono muestra los controles HTML pero no el lienzo y el escritorio funciona, sospechar primero de un error de enlace de módulos por caché antes de buscar un fallo de la app; reproducirlo importando el grafo de módulos en Node.

## Señales a vigilar

Controles visibles sin lienzo; funciona en el Mac pero no en el teléfono; archivos que cambiaron desde la última visita del teléfono; un servidor que solo envía `Last-Modified`.
