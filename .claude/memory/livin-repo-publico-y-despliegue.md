---
name: livin-repo-publico-y-despliegue
description: El repo bsoto24/livin es público desde 2026-10-12 y cada push a main con pruebas en verde publica la PoC en GitHub Pages
metadata:
  type: project
---

Desde el 2026-10-12 el repo `bsoto24/livin` es **público** y la PoC se sirve en https://bsoto24.github.io/livin/ (feature 012). El flujo `.github/workflows/publicar.yml` corre `npm test` en `poc/` y, si pasa, **publica `poc/index.html`, `poc/src/` y `poc/assets/` con cada push a `main`**, o a mano con `gh workflow run publicar.yml --ref main`. Pages está en modo «GitHub Actions» (no «desde una rama»). Todo el repo y su historial son visibles: código, `docs/`, `.claude/` y el correo del autor en cada commit.

**Why:** el usuario quiso mostrar la PoC con costo $0 y seguridad básica, y eligió hacer público el repo y usar GitHub Pages; la decisión y sus riesgos aceptados están en `docs/adr/012-hosting-estatico-github-pages.md` y `012-seguridad-sin-cabeceras-sri-y-csp.md`.
**How to apply:** no commitear secretos, credenciales ni datos personales (ni en `docs/` ni en `.claude/`); un push a `main` ya no es inocuo, porque publica, así que pedir confirmación antes de empujar; el `localStorage` de Livin pertenece al origen `bsoto24.github.io`, compartido con cualquier otro sitio que se publique bajo esa cuenta (si hace falta publicar otro, mover Livin a otro dominio antes); `index.html` mantiene su CSP por `<meta>` y el SRI de Phaser (`poc/test/despliegue.test.js` los protege; ver `docs/specs/012-despliegue-publico/quickstart.md` para subir la versión de Phaser). Relacionado: [[livin-project-state]], [[livin-no-esta-en-produccion]].
