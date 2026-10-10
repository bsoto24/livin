# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Livin turns household chore management into a GBA-style top-down 2D game: the family's real home is a walkable map. The code is a **disposable web PoC in `poc/`** (the official stack is still undecided); features 001 to 008 are implemented, merged into `main` and pushed, with 367 automated tests. All docs are written in Spanish; keep the spec's domain vocabulary (hogar, espacio, cuarto, baño común, baño interno, modo edición).

Implemented features, one folder each under `docs/specs/`: `001-mapa-editor-hogar` (map and home editor), `002-familiares-y-mascotas` (family members and pets that walk), `003-actividades` (chores with clean/messy/disaster state), `004-rutinas` (weekly routines and the home's entrance), `005-jugador-activo-e-intercambios` (who plays, chore exchanges), `006-calificaciones-e-historial` (history and star ratings), `007-menu-y-formularios-simples` (bottom bar with a drawer per section, simple forms), and `008-base-visual-y-mundo` (pixel-art floors, walls and furniture, Silkscreen font). The saved document is at format `version: 7` (key `livin:datos:v1`; older versions migrate on load). Features 001 to 007 were verified on an Android phone; 008 is verified on desktop only, and its phone check and the map label size (`TAM_LETRA_MAPA` in `src/juego.js`) are still pending. The art plan continues with `009` (animated inhabitants) and `010` (cleanliness states and icons).

Source of truth, per feature and in order: `docs/specs/NNN-slug/spec.md` (approved) → `plan.md` (phased, test-first, includes full code listings) → `data-model.md` (when the saved format changes), `prd.md`, `verification.md` (evidence), and the ADRs in `docs/adr/` (numbered by the feature that produced them). Project identity and principles live in `.claude/memory/foundation.md`; stack/test/convention context in `.claude/memory/steering/`; per-topic rules in `.claude/rules/`; narrative lessons in `docs/lessons/`. SDD workflow: start with `sdd-superpowers:sdd-workflow`; new features branch from `main` (`feat/NNN-slug`).

## Commands (run inside `poc/`)

The PoC lives in `poc/` (not the repo root), has no npm dependencies, and requires Node ≥ 20.

```bash
cd poc && npm test                              # node --test "test/*.test.js" (367 passing tests as of feature 008)
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
3. **Renderer** — `src/juego.js` + `index.html`: Phaser 3 (pinned 3.80.1 from cdnjs) draws the generator output. Layers 1–2 must never import Phaser or touch the DOM. The game's art lives next to the renderer as pure data in `src/arte/` (feature 008, ADR `008-arte-cuadriculas-con-paleta`): `paleta.js` (the single 32-colour palette), `lienzo.js` (drawing helpers), `texturas.js` (floors, walls), `mobiliario.js` (the 17 furniture pieces) and `casillas.js` (`arteDelMapa(estado, distribucion)`: which art each tile gets). Art is 16×16 text grids using only palette keys; these modules never import Phaser or the DOM, and layers 1–2 never import them. `juego.js` only turns the grids into textures and draws them. The Silkscreen font is a local file in `assets/fonts/` (SIL OFL, see its `LEEME.md`).

Layout is prefab pieces assembled by fixed rules (not procedural): sala at center (comedor stacked on top, no wall between), service zone on the left (cocinas, baño común, lavanderías, mascotas), private zone on the right (dormitorios, oficinas); a corridor appears when a side zone has more than 2 spaces. The whole home is one continuous map; doors are walkable tiles.

Data-model constraint (ADR modelo de datos): spaces and members have stable ids so future features (family, activities, multiuser) reference them without migrating data — never key by name or position.

## Invariants to preserve

- No space is created, deleted or modified as a side effect of another action; the single exception is an internal bathroom whose room was deleted (FR-4).
- Names are trimmed and ≤ 20 chars; per-type count limits are in `plan.md` → Global Constraints (baño max = 1 + dormitorios + oficinas).
- Performance targets: 60 fps movement, edit-mode re-render < 100 ms, 4 tiles/s walk, 16 px tiles, portrait only.
- Tests use `node:test`; module contracts are fixed by tests in Phase 0 before any implementation.
