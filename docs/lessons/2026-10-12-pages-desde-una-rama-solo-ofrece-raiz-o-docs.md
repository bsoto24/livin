---
date: 2026-10-12
spec: "012"
tags: [despliegue, github-pages, github-actions]
---

# Lección: GitHub Pages «desde una rama» solo ofrece `/` o `/docs`; con el sitio en una subcarpeta hace falta un flujo de Actions

## Contexto

Feature 012, primer despliegue. El usuario hizo público el repo y configuró Pages con la rama `main` y la carpeta `/`, el único par de opciones del selector junto a `/docs`. La PoC vive en `poc/`, así que `https://bsoto24.github.io/livin/` dio 404.

## Qué pasó

Con «Deploy from a branch» (`build_type: legacy`) Pages publica lo que hay en la raíz del repo como está: no había `index.html` y la raíz dio 404, pero `…/livin/poc/` servía el juego y también `poc/test/`, `poc/package.json` y los `.md` convertidos a HTML (`CLAUDE.html`). Es decir, el sitio estaba roto y a la vez publicaba de más. La solución ya estaba prevista en el ADR: un flujo de GitHub Actions que sube solo `index.html`, `src/` y `assets/`. Al cambiar la fuente a «GitHub Actions», GitHub ofrece plantillas de flujo (**GitHub Pages Jekyll** y **Static HTML**) que parecen un paso obligatorio; elegir una crea otro flujo con un commit directo en `main` que publicaría el repo entero.

## Qué hacer la próxima vez

- Si el sitio no está en la raíz ni en `/docs`, usar un flujo propio con `actions/upload-pages-artifact` y `actions/deploy-pages`, y poner la fuente de Pages en «GitHub Actions».
- Al cambiar la fuente, **ignorar** las plantillas Jekyll y Static HTML: ya existe el flujo del repo. Comprobar con `gh api repos/<dueño>/<repo>/pages` que `build_type` es `workflow`.
- Antes del primer despliegue, empujar el flujo a `main` con la fuente ya cambiada; con Pages aún en modo rama, `deploy-pages` no puede publicar.
- Después de cambiar la fuente, comprobar con `curl` que lo que ya no debe servirse da 404 (`/poc/`, `package.json`, `test/`).

## Señales a vigilar

- 404 en `https://<usuario>.github.io/<repo>/` justo después de configurar Pages.
- Una URL con la subcarpeta del proyecto (`…/poc/`) que sí responde: el modo rama está sirviendo el repo completo.
- `build_type: legacy` en la respuesta de `gh api …/pages`.
