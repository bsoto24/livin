# JavaScript (livin)

- ✓ Use native ES modules (`import`/`export`); one module = one responsibility. Named exports only.
- ✓ Keep the three layers separate: dominio (`catalogo.js`, `hogar.js`, `almacen.js`), generador (`distribucion.js`, `posicion.js`), presentación (`juego.js`, `index.html`, y el arte como datos puros en `src/arte/`).
- ✓ Art modules in `src/arte/` are pure data and functions: 16×16 text grids with palette keys only (`paleta.js` is the single source of colours); no Phaser, no DOM, `arteDelMapa` is deterministic and receives each space's cleanliness state as a parameter (the art never computes it from activities or dates), the mess art (`suciedad.js`), the walking rules (`caminar.js`) and the character catalogue (`personajes.js`) are pure, and `casillas.js` may import `aspecto.js` (which picks the tiles of objects, stains, flies and cobwebs) but not the reverse; the direction a character faces is a presentation detail and is never saved in the domain or the document.
- ✓ The interface icons (`iconos.js`, 19 grids plus `claveDeAvatar`) and the colour roles (`colores.js`: `ROLES`, `variablesDeColor`, `contraste`, `COLORES_DEL_MAPA`) are pure too. `src/imagenes.js` touches the DOM, so it lives outside `src/arte/`: it paints each icon and avatar once into a canvas and returns pixelated, non-selectable images.
- ✓ `index.html` colours only with the palette variables derived from `paleta.js` (no hex, `rgb` or colour names; translucency only through `--velo` and `--cruceta-fondo`), and every text/background pair of `ROLES` keeps a 4.5:1 contrast.
- ✓ `index.html` keeps its CSP `<meta>` before any style or script: scripts only from the own origin, cdnjs and the `'sha256-…'` hash of each inline script (no `unsafe-inline`/`unsafe-eval` for scripts); any new origin needs a justification and a test.
- ✓ A control that is pressed and held (the movement d-pad) is text, never an image: a long press on an image selects it and offers to download it on Android.
- ✗ Domain and generator modules must never import from `src/arte/`.
- ✓ Domain and generator modules are pure and deterministic: same input → same output; no `Date.now()`/`Math.random()` without an injected source.
- ✗ Domain/generator code must never import Phaser or touch the DOM / `window` / `localStorage` directly (ADR del generador).
- ✓ Use the Spanish domain vocabulary from the spec (hogar, espacio, cuarto, baño interno); keep identifiers consistent with `spec.md`.
- ✓ Entities (espacios, miembros) are referenced by stable ids, never by name or position.
- ✗ No npm dependencies; the only external dependency is Phaser (pinned 3.80.1, from cdnjs).
- ✗ No DTOs/view-models/wrappers around Phaser or the DOM (Anti-Abstraction gate in the plan).
- ✓ Prefer plain objects and pure functions over classes for model and generator state.
- ✗ No side effects on spaces other than the one the user explicitly changed (Foundation principle 1).
