# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Livin turns household chore management into a GBA-style top-down 2D game: the family's real home is a walkable map. The code is a **disposable web PoC in `poc/`** (the official stack is still undecided); features 001 to 011 are implemented and merged into `main` (001 to 011 pushed), with 459 automated tests. All docs are written in Spanish; keep the spec's domain vocabulary (hogar, espacio, cuarto, baño común, baño interno, modo edición).

Implemented features, one folder each under `docs/specs/`: `001-mapa-editor-hogar` (map and home editor), `002-familiares-y-mascotas` (family members and pets that walk), `003-actividades` (chores with clean/messy/disaster state), `004-rutinas` (weekly routines and the home's entrance), `005-jugador-activo-e-intercambios` (who plays, chore exchanges), `006-calificaciones-e-historial` (history and star ratings), `007-menu-y-formularios-simples` (bottom bar with a drawer per section, simple forms), `008-base-visual-y-mundo` (pixel-art floors, walls and furniture, Silkscreen font), `009-habitantes-animados` (14 pixel-art characters that walk in four directions), `010-estados-de-limpieza` (the clean/messy/disaster states drawn as themed floor objects, stains, dirty furniture, cobwebs and flies), and `011-iconos-propios-y-recolor` (19 own pixel-art icons, the characters as avatars, and the HTML interface recoloured with the palette in a game-frame look). The saved document is at format `version: 7` (key `livin:datos:v1`; older versions migrate on load). Features 001 to 009 were verified on an Android phone (008 and 009 together, on 2026-10-10, with the map label size `TAM_LETRA_MAPA` in `src/juego.js` kept at 12 px). Feature 010 was verified automatically, in a desktop browser and on an Android phone on 2026-10-10 (70 fps, `regen` 24.9 ms, no observations; see `docs/specs/010-estados-de-limpieza/verification.md`). Feature 011 (spec 2.0.0) was verified automatically, in a desktop browser and on an Android phone on 2026-10-11 (70 fps, `regen` 0.0 ms, no observations; see `docs/specs/011-iconos-propios-y-recolor/verification.md`): the bottom bar, the activity icons, the status badges and the map bubbles are drawn icons, no emoji remain in the interface, and the movement d-pad keeps its subtle text symbols (▲ ◀ ▶ ▼) because an image arrow was selected and offered for download on a long press. The art plan is complete (008 to 011); the history summary still shows a text ★ (an accepted exception, `historial.js`).

Source of truth, per feature and in order: `docs/specs/NNN-slug/spec.md` (approved) → `plan.md` (phased, test-first, includes full code listings) → `data-model.md` (when the saved format changes), `prd.md`, `verification.md` (evidence), and the ADRs in `docs/adr/` (numbered by the feature that produced them). Project identity and principles live in `.claude/memory/foundation.md`; stack/test/convention context in `.claude/memory/steering/`; per-topic rules in `.claude/rules/`; narrative lessons in `docs/lessons/`. SDD workflow: start with `sdd-superpowers:sdd-workflow`; new features branch from `main` (`feat/NNN-slug`).

## Commands (run inside `poc/`)

The PoC lives in `poc/` (not the repo root), has no npm dependencies, and requires Node ≥ 20.

```bash
cd poc && npm test                              # node --test "test/*.test.js" (459 passing tests as of feature 011)
cd poc && node --test test/hogar.test.js        # a single test file
cd poc && node --test --test-name-pattern="<name>" test/distribucion.test.js   # a single test by name
cd poc && npm start                             # npx serve -l 8080 . → http://localhost:8080 (phone: http://<LAN-IP>:8080)
cd poc && node --check src/juego.js             # syntax check of the Phaser scene
```

There is no linter or build step. The exhaustive generator test (all 7,560 allowed maps) takes a few seconds.

## Architecture (big picture)

Three independent layers, fixed by the generator ADR so model and generator can be ported to the (still undecided) official stack — only the renderer is throwaway:

1. **Model** — `src/catalogo.js` (space types as *data*: zone, limits, piece, whether it allows an internal bathroom), `src/hogar.js` (pure state operations), `src/almacen.js` (local persistence, session start).
2. **Generator** — `src/distribucion.js` + `src/posicion.js`: pure, deterministic. `generarDistribucion(estado)` returns `{ ancho, alto, tiles, espacioEn, rects, puertas, pasillos, aparicion }`. Same saved state ⇒ same map, which is what keeps the saved character position valid.
3. **Renderer** — `src/juego.js` + `index.html`: Phaser 3 (pinned 3.80.1 from cdnjs) draws the generator output. Layers 1–2 must never import Phaser or touch the DOM. The game's art lives next to the renderer as pure data in `src/arte/` (feature 008, ADR `008-arte-cuadriculas-con-paleta`): `paleta.js` (the single 32-colour palette), `lienzo.js` (drawing helpers), `texturas.js` (floors, walls), `mobiliario.js` (the 17 furniture pieces) `casillas.js` (`arteDelMapa(estado, distribucion, limpiezas)`: which art each tile gets, as ordered layers — floor, stain, furniture, dirty overlay, cobweb, object, flies — given each space's cleanliness state; `estadosCambiaron` says when the world must be redrawn), and, from feature 010 (ADR `010-estado-de-limpieza-en-la-composicion-del-mundo`), `suciedad.js` (the 7 art groups of 6 floor objects, stains, cobwebs, flies and the 27 dirty-furniture overlays; `aspecto.js` picks which free tiles get them) and, from feature 009 (ADR `009-personajes-compuestos-por-piezas`), `personajes.js` (the 14 characters — owner, 7 aspects, 6 species — with 9 frames each: front, back and side views, standing plus two steps; left is the side view flipped; `personajeDe(estado, miembro)` picks the character) and `caminar.js` (pure walking rules: view per direction, alternating foot, which frame to show), and, from feature 011 (ADR `011-arte-de-la-interfaz-html-desde-las-cuadriculas`), `iconos.js` (the 19 own icons — 4 bar tabs, 9 activity icons, 3 cleanliness states, 2 stars, the date — plus `claveDeAvatar`, which picks a member's avatar: the front frame of their character) and `colores.js` (`ROLES` map each interface role to a palette key; `variablesDeColor` derives the CSS variables; `contraste` checks every text/background pair at 4.5:1; `COLORES_DEL_MAPA` colours the map text). `src/imagenes.js` (presentation, with DOM, outside `src/arte/`) paints each icon and avatar once into a 16×16 canvas and hands out pixelated, non-selectable `<img>` elements; `index.html` uses only the palette variables and has no hard-coded colour (a static test checks it), and the map bubbles and badges come from the same Phaser texture sheet. The direction a character faces is never saved; `juego.js` derives it from movement. Art is 16×16 text grids using only palette keys; these modules never import Phaser or the DOM, and layers 1–2 never import them. `juego.js` only turns the grids into textures and draws them. The Silkscreen font is a local file in `assets/fonts/` (SIL OFL, see its `LEEME.md`).

Layout is prefab pieces assembled by fixed rules (not procedural): sala at center (comedor stacked on top, no wall between), service zone on the left (cocinas, baño común, lavanderías, mascotas), private zone on the right (dormitorios, oficinas); a corridor appears when a side zone has more than 2 spaces. The whole home is one continuous map; doors are walkable tiles.

Data-model constraint (ADR modelo de datos): spaces and members have stable ids so future features (family, activities, multiuser) reference them without migrating data — never key by name or position.

## Invariants to preserve

- No space is created, deleted or modified as a side effect of another action; the single exception is an internal bathroom whose room was deleted (FR-4).
- Names are trimmed and ≤ 20 chars; per-type count limits are in `plan.md` → Global Constraints (baño max = 1 + dormitorios + oficinas).
- Performance targets: 60 fps movement, edit-mode re-render < 100 ms, 4 tiles/s walk, 16 px tiles, portrait only.
- Tests use `node:test`; module contracts are fixed by tests in Phase 0 before any implementation.
