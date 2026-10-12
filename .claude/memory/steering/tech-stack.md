---
scope: tech-stack
loaded-by: sdd-brainstorm, sdd-specify, sdd-plan, sdd-execute, sdd-review
---

# Tech Stack

## Languages
JavaScript (native ES modules), HTML, CSS — from the plan; no code written yet. Edit to match reality.

## Frameworks
Phaser 3 (pinned 3.80.1, loaded from cdnjs) as renderer for a disposable web PoC. The official stack is undecided; a later ADR will choose it from PoC performance evidence. Edit to match reality.

## Infrastructure
Static hosting on GitHub Pages at https://bsoto24.github.io/livin/ (feature 012, ADR `012-hosting-estatico-github-pages`): the public repo's `.github/workflows/publicar.yml` runs `npm test` in `poc/` and, only on `main`, publishes `poc/index.html`, `poc/src/` and `poc/assets/`. No application server, database or authentication; game data stays in each browser's local storage. Target: Android phone browser, portrait. Phaser loads with SRI and `index.html` carries a CSP `<meta>` (ADR `012-seguridad-sin-cabeceras-sri-y-csp`).

## Package Manager
None — no npm dependencies. Tests use Node's built-in runner (Node ≥ 20). Edit to match reality.
