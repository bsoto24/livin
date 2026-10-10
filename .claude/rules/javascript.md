# JavaScript (livin)

- ✓ Use native ES modules (`import`/`export`); one module = one responsibility. Named exports only.
- ✓ Keep the three layers separate: dominio (`catalogo.js`, `hogar.js`, `almacen.js`), generador (`distribucion.js`, `posicion.js`), presentación (`juego.js`, `index.html`, y el arte como datos puros en `src/arte/`).
- ✓ Art modules in `src/arte/` are pure data and functions: 16×16 text grids with palette keys only (`paleta.js` is the single source of colours); no Phaser, no DOM, and `arteDelMapa` is deterministic.
- ✗ Domain and generator modules must never import from `src/arte/`.
- ✓ Domain and generator modules are pure and deterministic: same input → same output; no `Date.now()`/`Math.random()` without an injected source.
- ✗ Domain/generator code must never import Phaser or touch the DOM / `window` / `localStorage` directly (ADR del generador).
- ✓ Use the Spanish domain vocabulary from the spec (hogar, espacio, cuarto, baño interno); keep identifiers consistent with `spec.md`.
- ✓ Entities (espacios, miembros) are referenced by stable ids, never by name or position.
- ✗ No npm dependencies; the only external dependency is Phaser (pinned 3.80.1, from cdnjs).
- ✗ No DTOs/view-models/wrappers around Phaser or the DOM (Anti-Abstraction gate in the plan).
- ✓ Prefer plain objects and pure functions over classes for model and generator state.
- ✗ No side effects on spaces other than the one the user explicitly changed (Foundation principle 1).
