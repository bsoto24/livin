# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Livin turns household chore management into a GBA-style top-down 2D game: the family's real home is a walkable map. The repo is **docs-only so far** — no code, no commits. The first feature, `001-mapa-editor-hogar` (map + home editor), is specified and planned but not implemented. All docs are written in Spanish; keep the spec's domain vocabulary (hogar, espacio, cuarto, baño común, baño interno, modo edición).

Source of truth, in order: `docs/specs/001-mapa-editor-hogar/spec.md` (approved v1.0.0) → `plan.md` (phased, test-first, includes full code listings) → `data-model.md`, `prd.md`, and the two ADRs in `docs/adr/`. Project identity and principles live in `.claude/memory/foundation.md`; stack/test/convention context in `.claude/memory/steering/`; per-topic rules in `.claude/rules/`. SDD workflow: start with `sdd-superpowers:sdd-workflow`.

## Planned commands (from plan.md; run inside `poc/`)

The PoC lives in `poc/` (not the repo root), has no npm dependencies, and requires Node ≥ 20.

```bash
cd poc && npm test                              # node --test "test/*.test.js" (plan expects 40 passing tests)
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
